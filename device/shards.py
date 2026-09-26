"""Qdrant Edge storage: three in-process shards per device.

  private  raw personal/sensitive notes; never leaves the device
  mutable  local writes waiting to sync (outbox-backed)
  mirror   read-only copy of fleet knowledge pulled from the server

Each shard stores a named dense vector ("dense", bge-small) and a sparse one
("bm25", Edge-native BM25 with IDF). Hybrid search fuses them inside the shard
with Fusion.Rrf; results from the three shards are then fused again with RRF.
"""
from __future__ import annotations

from pathlib import Path
from typing import Iterable

from qdrant_edge import (
    CountRequest, Distance, EdgeConfig, EdgeShard, EdgeSparseVectorParams, EdgeVectorParams,
    FieldCondition, Filter, Fusion, MatchAny, MatchValue, Modifier, PayloadSchemaType, Point,
    Prefetch, Query, QueryRequest, ScrollRequest, SparseVector, UpdateOperation,
)

from device import config

SHARD_NAMES = ("private", "mutable", "mirror")
INDEXED_FIELDS = ("entity_key", "status", "kind", "device_id")
RRF_K = 60

NOT_SUPERSEDED = Filter(must_not=[FieldCondition("status", match=MatchValue("superseded"))])


def _edge_config() -> EdgeConfig:
    return EdgeConfig(
        vectors={"dense": EdgeVectorParams(size=config.DENSE_DIM, distance=Distance.Cosine)},
        sparse_vectors={"bm25": EdgeSparseVectorParams(modifier=Modifier.Idf)},
    )


def open_shard(path: Path) -> EdgeShard:
    if (path / "edge_config.json").exists():
        return EdgeShard.load(str(path))
    path.mkdir(parents=True, exist_ok=True)  # create() does not make the directory
    shard = EdgeShard.create(str(path), _edge_config())
    for f in INDEXED_FIELDS:
        shard.update(UpdateOperation.create_field_index(f, PayloadSchemaType.Keyword))
    return shard


def rrf(ranked_lists: Iterable[list[tuple[str, dict]]], k: int = RRF_K) -> list[tuple[str, float, dict]]:
    """Reciprocal Rank Fusion: score = sum over lists of 1 / (k + rank)."""
    scores: dict[str, float] = {}
    items: dict[str, dict] = {}
    for ranked in ranked_lists:
        for rank, (key, item) in enumerate(ranked, start=1):
            scores[key] = scores.get(key, 0.0) + 1.0 / (k + rank)
            items.setdefault(key, item)
    return sorted(((key, s, items[key]) for key, s in scores.items()), key=lambda t: -t[1])


class Shards:
    def __init__(self, root: Path | None = None):
        root = Path(root or config.DATA_DIR)
        self.shards: dict[str, EdgeShard] = {n: open_shard(root / n) for n in SHARD_NAMES}

    def __getitem__(self, name: str) -> EdgeShard:
        return self.shards[name]

    # ---- writes
    # qdrant-edge 0.8.0 does not recover unflushed writes after a hard kill (verified:
    # 5 upserts + os._exit -> 0 points on reload). Flush every write; costs ~15 ms.

    def upsert(self, shard: str, record: dict, dense: list[float], sparse: SparseVector) -> None:
        point = Point(record["memory_id"], {"dense": dense, "bm25": sparse}, record)
        self.shards[shard].update(UpdateOperation.upsert_points([point]))
        self.shards[shard].flush()

    def set_payload(self, shard: str, memory_id: str, fields: dict) -> None:
        self.shards[shard].update(UpdateOperation.set_payload([memory_id], fields))
        self.shards[shard].flush()

    def flush(self) -> None:
        for s in self.shards.values():
            s.flush()

    def close(self) -> None:
        for s in self.shards.values():
            s.close()

    # ---- reads

    def search(self, shard: str, dense: list[float] | None, sparse: SparseVector | None,
               k: int = 10, flt: Filter | None = NOT_SUPERSEDED) -> list[tuple[str, float, dict]]:
        """Dense-only, sparse-only, or hybrid (both given) search within one shard."""
        s = self.shards[shard]
        if dense is not None and sparse is not None:
            req = QueryRequest(
                limit=k,
                prefetches=[
                    Prefetch(limit=k * 3, query=Query.Nearest(dense, using="dense"), filter=flt),
                    Prefetch(limit=k * 3, query=Query.Nearest(sparse, using="bm25"), filter=flt),
                ],
                query=Fusion.Rrf(k=RRF_K),
                with_payload=True,
            )
        elif dense is not None:
            req = QueryRequest(limit=k, query=Query.Nearest(dense, using="dense"), filter=flt, with_payload=True)
        else:
            req = QueryRequest(limit=k, query=Query.Nearest(sparse, using="bm25"), filter=flt, with_payload=True)
        return [(str(p.id), p.score, p.payload) for p in s.query(req)]

    def search_all(self, dense, sparse, k: int = 10, shards: Iterable[str] = SHARD_NAMES):
        """Search every shard. Returns [(memory_id, score, payload, shard, raw_score)].

        Per-shard RRF lists can't be fused again: every shard's top hit would get the
        same 1/(k+1) however weak it is. Instead each modality is merged globally by
        its raw score (cosine is comparable across shards), then the two lists are fused.
        """
        ranked = []
        for vec, sp in ((dense, None), (None, sparse)):
            if vec is None and sp is None:
                continue
            hits = [(mid, (name, score, payload))
                    for name in shards for mid, score, payload in self.search(name, vec, sp, k)]
            ranked.append(sorted(hits, key=lambda h: -h[1][1]))
        if len(ranked) == 1:
            return [(mid, s, p, name, s) for mid, (name, s, p) in ranked[0][:k]]
        fused = rrf(ranked)
        return [(mid, score, item[2], item[0], item[1]) for mid, score, item in fused[:k]]

    def by_entity(self, entity_key: str, shards: Iterable[str] = ("mutable", "mirror"),
                  statuses: list[str] | None = None) -> list[tuple[str, dict]]:
        """All records about one entity, as (shard, payload)."""
        must = [FieldCondition("entity_key", match=MatchValue(entity_key))]
        if statuses:
            must.append(FieldCondition("status", match=MatchAny(statuses)))
        out = []
        for name in shards:
            out += [(name, r.payload) for r in self._scroll_all(name, Filter(must=must))]
        return out

    def list(self, shard: str, limit: int = 100) -> list[dict]:
        recs, _ = self.shards[shard].scroll(ScrollRequest(limit=limit, with_payload=True, with_vector=False))
        return [r.payload for r in recs]

    def count(self, shard: str) -> int:
        return self.shards[shard].count(CountRequest())

    def _scroll_all(self, shard: str, flt: Filter, page: int = 256):
        offset = None
        while True:
            recs, offset = self.shards[shard].scroll(
                ScrollRequest(offset=offset, limit=page, filter=flt, with_payload=True, with_vector=False))
            yield from recs
            if offset is None:
                return
