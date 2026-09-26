"""System 1: fast on-device decisions about each memory.

Laya proposes; guard.py and resolver.py have the final word. The heuristic engine
has the same interface, needs no model, and is used by tests and as a fallback.
A Jev (cloud) adapter would implement the same `decide` method on the gateway.
"""
from __future__ import annotations

import re
import time
from functools import lru_cache
from typing import Protocol

from device import config

RESIDENCY_Q = {
    "type": "choice",
    "instructions": "Where should this memory live?",
    "criteria": {
        "private": "personal info, names, phone numbers, opinions about people",
        "sync": "machine facts, fixes, safety issues useful to other technicians",
        "drop": "chit-chat, duplicates, no useful information",
    },
}
CRITICALITY_Q = {
    "type": "score",
    "instructions": "How critical is this for plant safety or uptime?",
    "criteria": ["routine", "important", "safety-critical"],
}
CRITICALITY = ["routine", "important", "safety-critical"]


class DecisionEngine(Protocol):
    name: str

    def decide(self, text: str) -> dict: ...

    def contradicts(self, new: str, old: str) -> float | None: ...


class LayaEngine:
    name = "laya"

    def __init__(self):
        from laya import Router

        self.router = Router(device="cpu")

    def decide(self, text: str) -> dict:
        t = time.perf_counter()
        a = self.router.predict(text, {"residency": RESIDENCY_Q, "criticality": CRITICALITY_Q})["answers"]
        crit_probs = a["criticality"]["probabilities"]
        crit = max(crit_probs, key=crit_probs.get)
        return {
            "residency": a["residency"]["choice"],
            "p": a["residency"]["answer_confidence"],
            "probabilities": a["residency"]["probabilities"],
            "criticality": CRITICALITY[int(crit)],
            "engine": self.name,
            "latency_ms": round((time.perf_counter() - t) * 1000, 1),
        }

    def contradicts(self, new: str, old: str) -> float | None:
        q = {"c": {"type": "noul", "instructions": "Does NEW contradict OLD about the same machine?"}}
        return self.router.predict(f"OLD: {old}\nNEW: {new}", q)["answers"]["c"]["noul"]


class HeuristicEngine:
    name = "heuristic"
    _SAFETY = re.compile(r"\b(fire|smoke|leak|spark|shock|injur|overheat|burn|gas|emergency|lockout)", re.I)
    _IMPORTANT = re.compile(r"\b(vibrat|noise|fault|error|fail|broken|replac|repair|down|alarm)", re.I)
    _MACHINE = re.compile(r"\b[A-Z]{2,5}-\d{1,4}\b")
    _PERSON = re.compile(r"\b(call|phone|ask|tell|wife|home|personal|salary|leave)\b", re.I)

    def decide(self, text: str) -> dict:
        if self._PERSON.search(text):
            res, p = "private", 0.7
        elif self._MACHINE.search(text) or self._IMPORTANT.search(text) or self._SAFETY.search(text):
            res, p = "sync", 0.7
        else:
            res, p = "drop", 0.6
        crit = ("safety-critical" if self._SAFETY.search(text)
                else "important" if self._IMPORTANT.search(text) else "routine")
        return {"residency": res, "p": p, "probabilities": None, "criticality": crit,
                "engine": self.name, "latency_ms": 0.0}

    def contradicts(self, new: str, old: str) -> float | None:
        return None


@lru_cache(maxsize=1)
def get_engine() -> DecisionEngine:
    return LayaEngine() if config.DECIDER == "laya" else HeuristicEngine()
