"""End-to-end device memory on real Qdrant Edge shards and real embeddings (heuristic decider)."""
import pytest

from device import config
from device.decide import HeuristicEngine
from device.guard import find_pii

pytestmark = pytest.mark.models

if not (config.MODELS_DIR).exists():
    pytest.skip("models not downloaded; run scripts/download_models.py", allow_module_level=True)


@pytest.fixture
def memory(tmp_path):
    from device.memory import Memory

    m = Memory("tech-A", root=tmp_path, engine=HeuristicEngine())
    yield m
    m.close()


def test_pii_regex():
    assert find_pii("Call Ravi on 9812345612") == ["phone"]
    assert find_pii("mail ravi.k@plant.in") == ["email"]
    assert find_pii("Aadhaar 1234 5678 9012") == ["aadhaar"]
    assert find_pii("CNC-07 spindle at 12000 rpm") == []


def test_note_is_searchable_offline(memory):
    memory.remember("CNC-07 bearing replaced, vibration normal")
    memory.remember("Hydraulic press HP-2 oil leak near the pump")
    for mode in ("hybrid", "dense", "sparse"):
        hits = memory.recall("CNC-07 bearing", k=3, mode=mode)["hits"]
        assert hits[0]["value"].startswith("CNC-07 bearing"), mode
        assert hits[0]["shard"] == "mutable"


def test_weak_hit_in_another_shard_does_not_tie_best_hit(memory):
    memory.remember("Call Ravi on 9812345612 about the bearing")  # private shard
    memory.remember("CNC-07 bearing replaced, vibration normal")  # mutable shard
    memory.remember("Coolant leak under lathe LT-3")
    hits = memory.recall("is CNC-07 vibrating", k=3)["hits"]
    assert hits[0]["value"].startswith("CNC-07")
    assert hits[0]["score"] > hits[1]["score"]


def test_pii_note_stays_private(memory):
    e = memory.remember("Call Ravi on 9812345612 about the CNC-07 bearing")
    assert e["shard"] == "private" and e["override"].startswith("PII")
    # A private note mentioning CNC-07 must not take part in status resolution.
    assert memory.history("machine:CNC-07/status")["versions"] == []


def test_newer_local_fact_supersedes_and_history_is_kept(memory):
    a = memory.remember("CNC-07 still vibrating at high RPM")
    b = memory.remember("CNC-07 bearing replaced, vibration normal")
    assert b["changed"] == [{"memory_id": a["memory_id"], "status": "superseded",
                             "valid_to": b["at"], "superseded_by": b["memory_id"]}]
    h = memory.history("machine:CNC-07/status", at_ms=a["at"])
    assert [r["memory_id"] for r in h["current"]] == [b["memory_id"]]
    assert [r["memory_id"] for r in h["believed_at"]["records"]] == [a["memory_id"]]
    # Superseded facts are hidden from search but never deleted.
    ids = [x["memory_id"] for x in memory.recall("CNC-07 vibration", k=5)["hits"]]
    assert a["memory_id"] not in ids and b["memory_id"] in ids
    assert len(h["versions"]) == 2


def test_chit_chat_is_dropped(memory):
    e = memory.remember("lol lunch was good today")
    assert e["residency"] == "drop" and e["shard"] is None
    assert memory.stats() == {"private": 0, "mutable": 0, "mirror": 0}


def test_write_survives_hard_kill(tmp_path):
    import os
    import subprocess
    import sys
    from device.memory import Memory

    code = ("import os; from device.memory import Memory; from device.decide import HeuristicEngine; "
            f"m = Memory('tech-A', root=r'{tmp_path}', engine=HeuristicEngine()); "
            "m.remember('CNC-07 spindle belt replaced'); os._exit(9)")
    env = dict(os.environ, SMRITI_DECIDER="heuristic")
    assert subprocess.run([sys.executable, "-c", code], env=env, cwd=config.ROOT).returncode == 9
    m = Memory("tech-A", root=tmp_path, engine=HeuristicEngine())
    assert m.stats()["mutable"] == 1
    m.close()


def test_shards_persist_across_restart(tmp_path):
    from device.memory import Memory

    m = Memory("tech-A", root=tmp_path, engine=HeuristicEngine())
    m.remember("CNC-07 coolant pump replaced")
    m.close()
    m2 = Memory("tech-A", root=tmp_path, engine=HeuristicEngine())
    assert m2.recall("coolant pump", k=1)["hits"][0]["value"] == "CNC-07 coolant pump replaced"
    m2.close()
