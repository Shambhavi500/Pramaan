"""The device's memory service: remember (embed -> decide -> guard -> resolve -> store) and recall."""
from __future__ import annotations

import re
import time
import uuid
from collections import deque
from pathlib import Path

from device import config, embed, guard
from device.decide import DecisionEngine, get_engine
from device.resolver import HLC, LIVE, belief_at, next_vv, resolve
from device.shards import Shards

MACHINE = re.compile(r"\b([A-Z]{2,5}-\d{1,4})\b")
DUPLICATE_COSINE = 0.95


def infer_entity_key(text: str) -> str | None:
    m = MACHINE.search(text)
    return f"machine:{m.group(1)}/status" if m else None


class Memory:
    def __init__(self, device_id: str = config.DEVICE_ID, root: Path | None = None,
                 engine: DecisionEngine | None = None):
        self.device_id = device_id
        self.shards = Shards(root)
        self.engine = engine or get_engine()
        self.hlc = HLC(device_id)
        self.decisions: deque[dict] = deque(maxlen=500)  # TODO(Sat): persist in SQLite with the outbox

    # ------------------------------------------------------------ write path

    def remember(self, text: str, entity_key: str | None = None, author: str | None = None) -> dict:
        t0 = time.perf_counter()
        dense = embed.dense(text)
        sparse = embed.sparse_doc(text)

        dup = self._near_duplicate(dense)
        decision = guard.apply(self.engine.decide(text), text, duplicate_of=dup)
        residency = decision["residency"]
        entity_key = entity_key or infer_entity_key(text)
        ts = self.hlc.now()

        record = {
            "memory_id": str(uuid.uuid4()),
            "entity_key": entity_key,
            "value": text,
            "kind": "private" if residency == "private" else ("semantic" if entity_key else "episodic"),
            "device_id": self.device_id,
            "author": author,
            "hlc": str(ts),
            "vv": {},
            "valid_from": ts.wall_ms,
            "valid_to": None,
            "superseded_by": None,
            "status": "current",
            "sensitivity": "private" if residency == "private" else "internal",
            "decision": decision,
            "hits": 0,
            "last_access": ts.wall_ms,
            "embed_model": config.DENSE_MODEL,
        }

        changed = []
        if residency == "sync" and entity_key:
            # Only shareable facts take part in belief resolution; a private note that
            # mentions a machine must never supersede that machine's status.
            existing = self.shards.by_entity(entity_key)
            record["vv"] = next_vv([p["vv"] for _, p in existing], self.device_id)
            res = resolve(record, [p for _, p in existing])
            record = res.incoming
            where = {p["memory_id"]: shard for shard, p in existing}
            for old in res.changed:
                fields = {k: old[k] for k in ("status", "valid_to", "superseded_by")}
                self.shards.set_payload(where[old["memory_id"]], old["memory_id"], fields)
                changed.append({"memory_id": old["memory_id"], **fields})
        else:
            record["vv"] = {self.device_id: 1}

        shard = {"private": "private", "sync": "mutable"}.get(residency)
        if shard:
            self.shards.upsert(shard, record, dense, sparse)
            # TODO(Sat): same transaction -> SQLite outbox when shard == "mutable"

        entry = {
            "memory_id": record["memory_id"], "text": text, "shard": shard, "entity_key": entity_key,
            "status": record["status"], "changed": changed, **decision,
            "total_ms": round((time.perf_counter() - t0) * 1000, 1), "at": ts.wall_ms,
        }
        self.decisions.appendleft(entry)
        return entry

    def _near_duplicate(self, dense: list[float]) -> str | None:
        hits = self.shards.search("mirror", dense, None, k=1)
        if hits and hits[0][1] >= DUPLICATE_COSINE:
            return hits[0][0]
        return None

    # ------------------------------------------------------------ read path

    def recall(self, query: str, k: int = 5, mode: str = "hybrid") -> dict:
        t0 = time.perf_counter()
        dense = embed.dense_query(query) if mode in ("hybrid", "dense") else None
        sparse = embed.sparse_query(query) if mode in ("hybrid", "sparse") else None
        t_embed = time.perf_counter()
        hits = self.shards.search_all(dense, sparse, k)
        t_search = time.perf_counter()
        return {
            "query": query, "mode": mode,
            "embed_ms": round((t_embed - t0) * 1000, 2),
            "search_ms": round((t_search - t_embed) * 1000, 2),
            "hits": [
                {"memory_id": mid, "score": round(score, 5), "shard": shard,
                 "shard_score": round(shard_score, 5), "value": p["value"], "status": p["status"],
                 "entity_key": p.get("entity_key"), "device_id": p.get("device_id")}
                for mid, score, p, shard, shard_score in hits
            ],
        }

    def history(self, entity_key: str, at_ms: int | None = None) -> dict:
        """Every version of a fact (nothing is deleted), optionally the belief at a time."""
        records = sorted((p for _, p in self.shards.by_entity(entity_key, shards=("mutable", "mirror"))),
                         key=lambda r: r["valid_from"])
        out = {"entity_key": entity_key, "versions": records,
               "current": [r for r in records if r["status"] in LIVE]}
        if at_ms is not None:
            out["believed_at"] = {"t": at_ms, "records": belief_at(records, at_ms)}
        return out

    def stats(self) -> dict:
        return {name: self.shards.count(name) for name in self.shards.shards}

    def close(self) -> None:
        self.shards.flush()
        self.shards.close()
