"""Belief resolver: hybrid logical clocks, version vectors, supersede/contested.

Pure Python with no Qdrant imports, so the sync gateway runs exactly the same code.
Version vectors decide truth; nothing here is ever deleted, only given a validity window.
"""
from __future__ import annotations

import threading
import time
from dataclasses import dataclass, field


# ---------------------------------------------------------------- HLC

@dataclass(frozen=True, order=True)
class Timestamp:
    wall_ms: int
    counter: int
    node: str

    def __str__(self) -> str:
        return f"{self.wall_ms}:{self.counter:04d}:{self.node}"

    @classmethod
    def parse(cls, s: str) -> "Timestamp":
        wall, counter, node = s.split(":", 2)
        return cls(int(wall), int(counter), node)


class HLC:
    """Hybrid Logical Clock (Kulkarni et al. 2014).

    Timestamps stay close to wall time but still order causally related events
    correctly when device clocks are skewed.
    """

    def __init__(self, node: str, clock=lambda: int(time.time() * 1000)):
        self.node = node
        self._clock = clock
        self._wall = 0
        self._counter = 0
        self._lock = threading.Lock()

    def now(self) -> Timestamp:
        with self._lock:
            pt = self._clock()
            if pt > self._wall:
                self._wall, self._counter = pt, 0
            else:
                self._counter += 1
            return Timestamp(self._wall, self._counter, self.node)

    def observe(self, remote: Timestamp | str) -> Timestamp:
        """Merge a timestamp received from another node (on sync)."""
        if isinstance(remote, str):
            remote = Timestamp.parse(remote)
        with self._lock:
            pt = self._clock()
            wall = max(self._wall, remote.wall_ms, pt)
            if wall == self._wall == remote.wall_ms:
                counter = max(self._counter, remote.counter) + 1
            elif wall == self._wall:
                counter = self._counter + 1
            elif wall == remote.wall_ms:
                counter = remote.counter + 1
            else:
                counter = 0
            self._wall, self._counter = wall, counter
            return Timestamp(wall, counter, self.node)


# ---------------------------------------------------------------- version vectors

VV = dict[str, int]


def compare(a: VV, b: VV) -> str:
    """Return 'equal', 'a_newer', 'b_newer' or 'concurrent'."""
    keys = a.keys() | b.keys()
    a_ge = all(a.get(k, 0) >= b.get(k, 0) for k in keys)
    b_ge = all(b.get(k, 0) >= a.get(k, 0) for k in keys)
    if a_ge and b_ge:
        return "equal"
    if a_ge:
        return "a_newer"
    if b_ge:
        return "b_newer"
    return "concurrent"


def merge(*vvs: VV) -> VV:
    out: VV = {}
    for vv in vvs:
        for k, v in vv.items():
            out[k] = max(out.get(k, 0), v)
    return out


def next_vv(known: list[VV], device_id: str) -> VV:
    """Version vector for a new write: everything this device has seen, plus one tick."""
    vv = merge(*known)
    vv[device_id] = vv.get(device_id, 0) + 1
    return vv


# ---------------------------------------------------------------- resolution

LIVE = ("current", "contested")


@dataclass
class Resolution:
    incoming: dict
    changed: list[dict] = field(default_factory=list)  # existing records whose status changed
    duplicate: bool = False


def resolve(incoming: dict, existing: list[dict]) -> Resolution:
    """Place `incoming` relative to existing records about the same entity_key.

    Mutates copies, never the inputs. Rules:
      incoming dominates old  -> old superseded (valid_to set), incoming current
      old dominates incoming  -> incoming arrives already superseded (stale write)
      equal                   -> duplicate delivery, ignore
      concurrent              -> both contested; a human decides
    """
    new = dict(incoming)
    new.setdefault("status", "current")
    res = Resolution(incoming=new)

    for old_in in existing:
        if old_in["memory_id"] == new["memory_id"]:
            res.duplicate = True
            return res
        if old_in.get("status") not in LIVE:
            continue
        old = dict(old_in)
        c = compare(new["vv"], old["vv"])
        if c == "equal":
            res.duplicate = True
            return res
        if c == "a_newer":
            old.update(status="superseded", valid_to=new["valid_from"],
                       superseded_by=new["memory_id"])
            res.changed.append(old)
        elif c == "b_newer":
            new.update(status="superseded", valid_to=old["valid_from"],
                       superseded_by=old["memory_id"])
        else:
            if old["status"] != "contested":
                old["status"] = "contested"
                res.changed.append(old)
            if new["status"] != "superseded":
                new["status"] = "contested"
    return res


def belief_at(records: list[dict], t_ms: int) -> list[dict]:
    """Time travel: the records that were believed at time t_ms."""
    return [
        r for r in records
        if r["valid_from"] <= t_ms and (r.get("valid_to") is None or r["valid_to"] > t_ms)
    ]
