"""Sync gateway (skeleton; Sat build). Idempotent batch ingest -> resolver -> Qdrant Server.

    uvicorn gateway.app:app --port 8000
"""
from fastapi import FastAPI

from device.resolver import resolve  # noqa: F401  same resolver as the devices

app = FastAPI(title="Smriti sync gateway")


@app.get("/health")
def health():
    return {"ok": True}


# TODO(Sat): POST /sync   {device_id, ops: [{op_id, record, vector}]}
#   - skip op_ids already seen (idempotent)
#   - resolve() against live records with the same entity_key, upsert to Qdrant Server
#   - fire n8n webhook when a record becomes contested
# TODO(Sat): GET /changes?since=<hlc>  -> devices pull into their mirror shard
