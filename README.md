# Smriti

> Qdrant Edge gave devices a memory. Smriti gives that memory judgment: what to remember,
> what to share, and what to believe, even with no internet.

Code Cubicle 6.0 · PS3 (Qdrant Edge). A memory control plane for a factory-maintenance
copilot: technicians' devices work fully offline, decide on-device what may leave, and
resolve conflicting facts deterministically when they reconnect.

## Status

| Piece | State |
|---|---|
| Three Qdrant Edge shards per device (private / mutable / mirror) | ✅ |
| Dense (FastEmbed bge-small) + sparse (Edge-native BM25 + IDF), hybrid RRF | ✅ |
| Laya on-device decisions (residency, criticality) + heuristic fallback | ✅ |
| Guardrails: PII regex hard gate, dedup against mirror | ✅ |
| Resolver: HLC, version vectors, supersede / contested, time travel | ✅ 11 unit tests |
| Device API (FastAPI) + online/offline switch | ✅ |
| SQLite outbox, `/sync` gateway, mirror pull | ⏳ Sat |
| n8n alert, Ollama answers, dashboard, bench | ⏳ |

## Run

```bash
python -m venv .venv && .venv/Scripts/pip install -r requirements.txt   # Python 3.11–3.14
python scripts/download_models.py        # once, online. Then the network is never used.
python -m pytest                         # 19 tests, fully offline
SMRITI_DEVICE_ID=tech-A uvicorn device.app:app --port 8001
```

```bash
curl -X POST localhost:8001/remember -H 'content-type: application/json' \
     -d '{"text": "CNC-07 bearing replaced, vibration normal"}'
curl "localhost:8001/recall?q=is CNC-07 vibrating&mode=hybrid"
curl "localhost:8001/entity/machine:CNC-07/status/history?at=<epoch_ms>"
```

Env: `SMRITI_DEVICE_ID`, `SMRITI_DATA_DIR`, `SMRITI_DECIDER=laya|heuristic`, `SMRITI_OFFLINE=1`.

## Layout

```
device/   config · embed · shards (Qdrant Edge) · decide (Laya) · guard · resolver · memory · app
gateway/  sync gateway (skeleton; imports device.resolver so both sides run identical code)
scripts/  download_models.py
tests/    resolver (pure) + memory (real Edge shards and embeddings)
```

## What we built on Qdrant Edge (qdrant-edge-py 0.8.0)

- `EdgeShard.create/load`, named `dense` + sparse `bm25` vectors (`Modifier.Idf`), keyword
  payload indexes on `entity_key`, `status`, `kind`, `device_id`.
- Hybrid search inside a shard: two `Prefetch` stages + `Fusion.Rrf`, filtered with
  `must_not status=superseded`. Superseded facts are hidden, never deleted.
- `Bm25` embedder is built into Edge, so no sparse model download.
- `set_payload` to move facts between current / superseded / contested; `scroll` for entity history.

## Findings (measured on a laptop CPU, 2026-09-26)

- **Edge 0.8.0 loses unflushed writes on a hard kill.** 5 upserts then `os._exit` → 0 points
  on reload; with `flush()` → 5. We flush after every write (p50 15 ms, p95 21 ms) and
  test it (`test_write_survives_hard_kill`).
- **Cross-shard RRF must not re-fuse per-shard RRF lists.** Every shard's top hit gets
  1/(k+1) however weak it is, so an unrelated private note tied the right answer. We merge
  each modality globally by raw score, then fuse (`test_weak_hit_in_another_shard_...`).
- Offline recall, warm: ~5 ms embed + ~1 ms search across 3 shards.
- Laya on CPU: ~800 ms per decision warm (first load downloads weights). Residency was right
  on all demo notes (PII → private p=0.68, machine fact → sync, chit-chat → drop); criticality
  is weak zero-shot (a coolant leak on a walkway scored "important", not "safety-critical").
  Guardrails and the resolver have the final word.
- `EdgeShard.create` requires the directory to exist; `retrieve` needs `with_vector` positionally.
