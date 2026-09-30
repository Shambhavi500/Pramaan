// Consistency checks for the JH-04 demo dataset. No database or network needed: `npm run check:demo`.
import assert from "node:assert/strict";
import { finalizeTrust } from "../lib/trust-scoring";
import { classifyTransformation } from "../lib/transformations";
import {
  DEMO_CLAIMS,
  DEMO_CLAIM_EVIDENCE_IDS,
  DEMO_DERIVATIVES,
  DEMO_PAIR,
  DEMO_PROJECT,
  DEMO_REVIEWS,
  DEMO_STORY_ID,
  GEOFENCE_BOX,
  buildDemoEvidence,
  buildDemoStory,
  buildLedgerPlan,
  demoClaimCoverage,
  distanceToGeofenceM,
  hamming,
} from "../lib/demo-dataset";
import { DEMO_UPLOAD_FOLDER } from "../lib/demo-site";

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ok   ${name}`);
  } catch (e) {
    console.error(`  FAIL ${name}\n       ${(e as Error).message}`);
    process.exitCode = 1;
  }
}

const evidence = buildDemoEvidence();
const get = (key: string) => {
  const e = evidence.find((x) => x.key === key);
  assert.ok(e, `missing evidence ${key}`);
  return e;
};

console.log("JH-04 demo dataset");

test("ids, asset ids and public ids are unique and live under the site upload folder", () => {
  for (const field of ["id", "cld_asset_id", "cld_public_id"] as const) {
    const values = evidence.map((e) => e.row[field] as string);
    assert.equal(new Set(values).size, values.length, `${field} not unique`);
  }
  for (const e of evidence) assert.ok(e.row.cld_public_id.startsWith(DEMO_UPLOAD_FOLDER + "/"));
});

test("every problem-statement evidence case is represented", () => {
  const cases = new Set(evidence.map((e) => e.case));
  for (const c of [
    "baseline",
    "vegetation",
    "monitoring",
    "community",
    "construction",
    "after",
    "missing_gps",
    "wrong_geofence",
    "duplicate",
    "screen_recapture",
    "low_quality",
    "ai_transformed",
  ]) {
    assert.ok(cases.has(c), `no evidence for case ${c}`);
  }
  // Site metadata, activity classification and visual signals live on every row.
  for (const e of evidence) {
    assert.ok(e.row.activity_claimed && e.understanding.activity_detected && e.understanding.caption);
    assert.ok(Array.isArray((e.understanding.ai_vision as { trust_signals: unknown[] }).trust_signals));
  }
  assert.ok(evidence.some((e) => e.understanding.activity_detected !== e.row.activity_claimed), "no activity mismatch");
  assert.ok(DEMO_DERIVATIVES.some((d) => d.class === "ai_generated"), "no AI-generated derivative");
});

test("timeline is ordered and inside the project window", () => {
  const first = (phase: string) =>
    Math.min(...evidence.filter((e) => e.row.phase === phase && e.row.trust_status === "verified").map((e) => Date.parse(e.capturedAt)));
  const last = (phase: string) =>
    Math.max(...evidence.filter((e) => e.row.phase === phase && e.row.trust_status === "verified").map((e) => Date.parse(e.capturedAt)));
  assert.ok(last("before") < first("during"), "baseline must precede construction");
  assert.ok(last("during") < first("after"), "construction must precede after");
  const monitoring = evidence.filter((e) => e.row.phase === "monitoring").map((e) => Date.parse(e.capturedAt));
  assert.ok(Math.min(...monitoring) > last("after"), "monitoring must follow the after photos");
  for (const e of evidence) {
    const t = Date.parse(e.capturedAt);
    assert.ok(t >= Date.parse(DEMO_PROJECT.start_date) && t <= Date.parse(DEMO_PROJECT.end_date), `${e.key} outside project dates`);
    assert.ok(Date.parse(e.row.created_at as string) >= t, `${e.key} ingested before it was captured`);
    assert.equal(e.row.cld_version, Math.floor(Date.parse(e.row.created_at as string) / 1000));
  }
});

test("GPS, geofence status and distances agree", () => {
  for (const e of evidence) {
    const gps = e.row.gps as string | null;
    if (!gps) {
      assert.equal(e.row.geo_status, "no_gps", e.key);
      assert.equal(e.geoDistanceM, null);
      continue;
    }
    const [lng, lat] = gps.match(/POINT\(([-\d.]+) ([-\d.]+)\)/)!.slice(1).map(Number);
    const d = distanceToGeofenceM({ lng, lat });
    const inside =
      lng >= GEOFENCE_BOX.minLng && lng <= GEOFENCE_BOX.maxLng && lat >= GEOFENCE_BOX.minLat && lat <= GEOFENCE_BOX.maxLat;
    assert.equal(d === 0, inside, `${e.key} distance/inside disagree`);
    assert.equal(e.row.geo_status, inside ? "in_geofence" : "outside_geofence", e.key);
  }
  assert.ok((get("after_wronggeo").geoDistanceM ?? 0) > 150, "wrong-geofence item must be beyond tolerance");
  assert.equal(get("after_nogps").row.gps, null);
});

test("stored score and status equal the trust-scoring math on the stored signals", () => {
  for (const e of evidence) {
    const { score, status } = finalizeTrust(e.signals, {
      hasExifGps: e.row.gps !== null,
      hardFlag: e.signals.some((s) => s.hardFlag),
    });
    assert.equal(e.row.trust_score, score, `${e.key} score`);
    if (e.row.trust_status !== "rejected") assert.equal(e.row.trust_status, status, `${e.key} status`);
  }
});

test("each trust scenario lands where the demo says it does", () => {
  const status = (k: string) => get(k).row.trust_status;
  const verified = evidence.filter((e) => e.row.trust_status === "verified").map((e) => e.key).sort();
  assert.deepEqual(verified, [
    "after_01",
    "after_02",
    "after_veg",
    "before_01",
    "before_02",
    "before_veg",
    "during_01",
    "during_02",
    "during_community",
    "monitoring_01",
  ]);
  assert.equal(status("after_reuse"), "flagged");
  assert.equal(status("after_recapture"), "flagged");
  assert.equal(status("after_nogps"), "needs_review");
  assert.equal(get("after_nogps").row.trust_score, 79, "no-GPS cap");
  assert.equal(status("after_wronggeo"), "flagged");
  assert.equal(get("after_wronggeo").row.trust_score, 40, "geofence hard flag cap");
  assert.equal(status("during_lowq"), "needs_review");
  assert.equal(status("after_ai_edit"), "rejected");
  for (const k of ["after_reuse", "after_recapture", "after_wronggeo"]) assert.ok((get(k).row.trust_score as number) <= 40, k);
});

test("duplicate and derivative pHash distances are exactly what the signals report", () => {
  const dup = get("after_reuse");
  assert.deepEqual(dup.duplicateOf, { id: get("after_02").row.id, distance: 2 });
  const ph = (k: string) => BigInt(get(k).row.phash as string);
  assert.equal(hamming(ph("after_reuse"), ph("after_02")), 2);
  assert.equal(hamming(ph("after_ai_edit"), ph("after_01")), 7);
  assert.notEqual(get("after_reuse").row.client_sha256, get("after_02").row.client_sha256, "re-encode must change the file hash");
  // Nothing else may collide, or an innocent photo would carry an I1 penalty.
  for (const a of evidence) {
    for (const b of evidence) {
      if (a.key >= b.key) continue;
      const near = hamming(ph(a.key), ph(b.key)) <= 10;
      const intended = new Set([`after_02|after_reuse`, `after_01|after_ai_edit`]).has(`${a.key}|${b.key}`);
      assert.equal(near, intended, `unexpected pHash relation ${a.key} / ${b.key}`);
    }
  }
  assert.equal(get("after_ai_edit").signals.find((s) => s.id === "I1")?.score, 0.5);
});

test("recapture, synthetic and quality cues match their signals", () => {
  const v = (k: string) => get(k).understanding.ai_vision as Record<string, unknown>;
  assert.equal(v("after_recapture").recapture_suspected, true);
  assert.equal(v("after_ai_edit").synthetic_suspected, true);
  for (const e of evidence) {
    if (e.key !== "after_recapture") assert.equal(v(e.key).recapture_suspected, false, e.key);
    if (e.key !== "after_ai_edit") assert.equal(v(e.key).synthetic_suspected, false, e.key);
  }
  assert.equal(get("during_lowq").signals.find((s) => s.id === "Q1")?.score, 0.3);
});

test("people and consent flags agree with the vision result", () => {
  for (const e of evidence) {
    const people = (e.understanding.ai_vision as { people: { present: boolean } }).people.present;
    assert.equal((e.row.people_flags as string[]).includes("has_people"), people, e.key);
    const expected = !people ? "not_required" : e.key === "during_community" ? "obtained" : "pending";
    assert.equal(e.row.consent_status, expected, e.key);
  }
});

test("claims cite real evidence, coverage counts verified ones only, and strengths differ", () => {
  const ids = new Set(evidence.map((e) => e.row.id));
  // Every submitted asset is offered for at least one claim.
  assert.deepEqual([...DEMO_CLAIM_EVIDENCE_IDS].sort(), [...ids].sort());
  for (const c of DEMO_CLAIMS) for (const k of c.evidenceKeys) assert.ok(ids.has(`ev_jh04_${k}`), `${c.id} cites unknown ${k}`);
  const cov = Object.fromEntries(DEMO_CLAIMS.map((c) => [c.id, demoClaimCoverage(evidence, c)]));
  assert.equal(cov.cl_01.strength, "strong");
  assert.equal(cov.cl_01.verified, 5);
  assert.equal(cov.cl_01.pending, 1, "low-quality photo");
  assert.equal(cov.cl_02.strength, "moderate");
  assert.equal(cov.cl_02.verified, 4);
  assert.equal(cov.cl_02.missing, 2);
  assert.equal(cov.cl_02.flagged, 4, "reuse, recapture, wrong geofence and rejected AI edit");
  assert.equal(cov.cl_02.pending, 1, "no-GPS");
  assert.equal(cov.cl_03.strength, "weak");
  assert.equal(cov.cl_03.verified, 2);
  // Claims must be for evidence with a matching activity, so the review screen is not comparing unlike things.
  for (const c of DEMO_CLAIMS) {
    for (const k of c.evidenceKeys) assert.equal(get(k).row.activity_claimed, c.activity, `${c.id}/${k}`);
  }
});

test("before/after pair is two verified, in-geofence photos of the same site with the right phases", () => {
  const before = evidence.find((e) => e.row.id === DEMO_PAIR.before_id)!;
  const after = evidence.find((e) => e.row.id === DEMO_PAIR.after_id)!;
  assert.equal(before.row.phase, "before");
  assert.equal(after.row.phase, "after");
  for (const e of [before, after]) {
    assert.equal(e.row.trust_status, "verified");
    assert.equal(e.row.geo_status, "in_geofence");
  }
  assert.equal(before.row.gps, after.row.gps, "pair must share a vantage point");
});

test("derivatives: bases exist, classes match their recipes, AI output never derives from bad evidence or enters the evidence layer", () => {
  for (const d of DEMO_DERIVATIVES) {
    const base = get(d.baseKey);
    assert.equal(base.row.trust_status, "verified", `${d.id} derives from unverified evidence`);
    if (!d.transformation.startsWith("t_")) assert.equal(classifyTransformation(d.transformation), d.class, d.id);
    if (d.class === "ai_generated") assert.equal(d.story_id, DEMO_STORY_ID, "AI-generated output belongs to a story");
  }
  assert.ok(DEMO_DERIVATIVES.some((d) => d.id === "dv_8f9a2b"), "nav links to dv_8f9a2b");
  assert.equal(DEMO_PAIR.id, "pair_01");
});

test("report cites only verified evidence, dates match the citations, and it makes no measurements", () => {
  const { report, citation_coverage } = buildDemoStory(evidence);
  const verified = new Map(evidence.filter((e) => e.row.trust_status === "verified").map((e) => [e.row.id, e]));
  const paragraphs = [...report.executive_summary, ...report.sections.flatMap((s) => s.paragraphs)];
  assert.equal(citation_coverage, 1);
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(iso));
  for (const p of paragraphs) {
    assert.ok(p.evidence_ids.length > 0, `uncited: ${p.text}`);
    const citedDays = p.evidence_ids.map((id) => {
      const e = verified.get(id);
      assert.ok(e, `${id} cited but not verified`);
      return fmt(e.capturedAt);
    });
    for (const day of p.text.match(/\d{1,2} [A-Z][a-z]+ 2026/g) ?? []) {
      assert.ok(citedDays.includes(day), `date "${day}" not backed by a cited photo: ${p.text}`);
    }
    assert.ok(!/litre|liter|hectare|household|cubic|acre|tonne|%|₹/i.test(p.text), `quantitative claim: ${p.text}`);
  }
});

test("ledger plan covers every evidence row, the review, each derivative and the story", () => {
  const plan = buildLedgerPlan(evidence);
  for (const e of evidence) assert.ok(plan.some((x) => x.subjectId === e.row.id && x.event === "analyzed"), e.key);
  for (const r of DEMO_REVIEWS) assert.ok(plan.some((x) => x.subjectId === r.evidence_id && x.event === "human_review"));
  for (const d of DEMO_DERIVATIVES) assert.ok(plan.some((x) => x.subjectId === d.id && x.event === "derived"));
  assert.ok(plan.some((x) => x.subjectId === DEMO_STORY_ID && x.event === "synthesized"));
  assert.ok(plan.some((x) => x.subjectId === get("during_community").row.id && x.event === "consent_recorded"));
  const rejected = plan.find((x) => x.subjectId === get("after_ai_edit").row.id && x.event === "analyzed")!;
  assert.equal(rejected.payload.status, "needs_review", "ledger keeps the engine verdict before the human decision");
});

console.log(`\n${passed} checks passed${process.exitCode ? ", some FAILED" : ""}`);
