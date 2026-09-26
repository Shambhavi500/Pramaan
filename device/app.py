"""Device API (one process per simulated device).

    SMRITI_DEVICE_ID=tech-A uvicorn device.app:app --port 8001
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from device import config
from device.memory import Memory
from device.shards import SHARD_NAMES

state = {"online": False, "memory": None}


@asynccontextmanager
async def lifespan(_: FastAPI):
    state["memory"] = Memory()
    yield
    state["memory"].close()


app = FastAPI(title=f"Smriti device {config.DEVICE_ID}", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def mem() -> Memory:
    return state["memory"]


class Note(BaseModel):
    text: str
    entity_key: str | None = None
    author: str | None = None


class Online(BaseModel):
    online: bool


@app.get("/health")
def health():
    return {"device_id": config.DEVICE_ID, "online": state["online"],
            "decider": mem().engine.name, "shards": mem().stats()}


@app.post("/remember")
def remember(note: Note):
    return mem().remember(note.text, note.entity_key, note.author)


@app.get("/recall")
def recall(q: str, k: int = 5, mode: str = "hybrid"):
    if mode not in ("hybrid", "dense", "sparse"):
        raise HTTPException(400, "mode must be hybrid, dense or sparse")
    return mem().recall(q, k, mode)


@app.get("/memories/{shard}")
def memories(shard: str, limit: int = 100):
    if shard not in SHARD_NAMES:
        raise HTTPException(404, f"shard must be one of {SHARD_NAMES}")
    return mem().shards.list(shard, limit)


@app.get("/entity/{entity_key:path}/history")
def history(entity_key: str, at: int | None = None):
    return mem().history(entity_key, at)


@app.get("/decisions")
def decisions(limit: int = 50):
    return list(mem().decisions)[:limit]


@app.post("/online")
def set_online(body: Online):
    # Network chaos switch. Sync (Sat) only runs while this is true.
    state["online"] = body.online
    return {"online": state["online"]}
