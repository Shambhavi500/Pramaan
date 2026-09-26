from device.resolver import HLC, Timestamp, belief_at, compare, merge, next_vv, resolve


def rec(mid, vv, valid_from, status="current"):
    return {"memory_id": mid, "entity_key": "machine:CNC-07/status", "vv": vv,
            "valid_from": valid_from, "valid_to": None, "superseded_by": None,
            "status": status}


# ---- version vectors

def test_compare_all_cases():
    assert compare({"A": 1}, {"A": 1}) == "equal"
    assert compare({"A": 2}, {"A": 1}) == "a_newer"
    assert compare({"A": 1}, {"A": 1, "B": 1}) == "b_newer"
    assert compare({"A": 2, "B": 1}, {"A": 1, "B": 2}) == "concurrent"
    assert compare({}, {}) == "equal"


def test_next_vv_merges_and_ticks():
    assert next_vv([{"A": 1, "B": 3}, {"A": 2}], "A") == {"A": 3, "B": 3}
    assert next_vv([], "B") == {"B": 1}
    assert merge({"A": 1}, {"B": 2}, {"A": 5}) == {"A": 5, "B": 2}


# ---- resolution

def test_newer_write_supersedes_without_deleting():
    old = rec("m1", {"A": 1}, 1000)
    new = rec("m2", {"A": 2}, 2000)
    r = resolve(new, [old])
    assert r.incoming["status"] == "current"
    assert r.changed[0]["status"] == "superseded"
    assert r.changed[0]["valid_to"] == 2000
    assert r.changed[0]["superseded_by"] == "m2"
    assert old["status"] == "current"  # inputs are not mutated


def test_stale_write_arrives_superseded():
    # The case the score-based merge gets wrong: an old fact delivered late.
    current = rec("m2", {"A": 2}, 2000)
    stale = rec("m1", {"A": 1}, 1000)
    r = resolve(stale, [current])
    assert r.incoming["status"] == "superseded"
    assert r.incoming["superseded_by"] == "m2"
    assert r.changed == []


def test_concurrent_offline_edits_are_contested():
    a = rec("mA", {"A": 1}, 1000)
    b = rec("mB", {"B": 1}, 1005)
    r = resolve(b, [a])
    assert r.incoming["status"] == "contested"
    assert r.changed[0]["status"] == "contested"


def test_write_that_saw_both_sides_resolves_contest():
    a = rec("mA", {"A": 1}, 1000, status="contested")
    b = rec("mB", {"B": 1}, 1005, status="contested")
    fix = rec("mS", {"A": 1, "B": 1, "S": 1}, 3000)
    r = resolve(fix, [a, b])
    assert r.incoming["status"] == "current"
    assert {c["status"] for c in r.changed} == {"superseded"}


def test_duplicate_delivery_is_idempotent():
    a = rec("m1", {"A": 1}, 1000)
    assert resolve(dict(a), [a]).duplicate
    assert resolve(rec("m9", {"A": 1}, 1000), [a]).duplicate


def test_superseded_records_are_ignored():
    old = rec("m1", {"A": 1}, 1000, status="superseded")
    r = resolve(rec("m2", {"B": 1}, 2000), [old])
    assert r.incoming["status"] == "current"
    assert r.changed == []


def test_time_travel():
    r1 = rec("m1", {"A": 1}, 1000)
    r2 = rec("m2", {"A": 2}, 2000)
    r1 = resolve(r2, [r1]).changed[0]
    assert [r["memory_id"] for r in belief_at([r1, r2], 1500)] == ["m1"]
    assert [r["memory_id"] for r in belief_at([r1, r2], 2500)] == ["m2"]
    assert belief_at([r1, r2], 500) == []


# ---- HLC

def test_hlc_monotonic_when_wall_clock_stalls():
    hlc = HLC("A", clock=lambda: 1000)
    ts = [hlc.now() for _ in range(3)]
    assert ts == sorted(ts) and len(set(ts)) == 3


def test_hlc_observe_moves_past_skewed_remote():
    hlc = HLC("A", clock=lambda: 1000)
    remote = Timestamp(5000, 7, "B")  # B's clock runs 4s fast
    after = hlc.observe(str(remote))
    assert after > remote
    assert hlc.now() > after
    assert Timestamp.parse(str(after)) == after
