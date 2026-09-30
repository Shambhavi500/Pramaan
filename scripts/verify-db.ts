import { createClient } from "@supabase/supabase-js";
import { computeCoverage, type EvidenceStatus } from "../lib/coverage";

/**
 * `npm run db:verify`: checks the database the app is configured for, through the same API the app uses.
 * Schema checks always run; the demo-data checks are reported as SKIP until `npm run seed` has been run.
 * PostGIS and pHash are exercised by calling the real SQL functions. Extensions and indexes cannot be read
 * through the API, so the PostGIS check stands in for the extension; indexes are created by the migration.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const TABLES = [
  "org", "project", "site", "evidence", "understanding", "review",
  "pair", "story", "derivative", "ledger_entry", "claim", "claim_evidence",
];
const DEMO_ORG_SLUG = "jalsetu-foundation";
const DEMO_SITE_CODE = "JH-04";

type Result = "PASS" | "FAIL" | "SKIP";
let failures = 0;
function report(result: Result, name: string, detail = "") {
  if (result === "FAIL") failures++;
  console.log(`${result.padEnd(4)}  ${name}${detail ? `  ${detail}` : ""}`);
}

const isPlaceholder = (v: string) => !v || /your[-_]/i.test(v);

/* eslint-disable @typescript-eslint/no-explicit-any */
async function main() {
  if (isPlaceholder(url) || isPlaceholder(serviceKey)) {
    report("FAIL", "configuration", "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are unset or still placeholders in .env.local");
    return;
  }
  const db = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Connectivity + tables.
  const broken: string[] = [];
  for (const t of TABLES) {
    const { error } = await db.from(t).select("*", { count: "exact", head: true });
    if (error) broken.push(`${t} (${error.message})`);
  }
  if (broken.length === TABLES.length) {
    report("FAIL", "database connectivity / schema", `no table readable: ${broken[0]}. Apply the migration first.`);
    return;
  }
  report("PASS", "database connectivity");
  report(broken.length ? "FAIL" : "PASS", `tables (${TABLES.length})`, broken.join("; "));

  const { data: org } = await db.from("org").select("id").eq("slug", DEMO_ORG_SLUG).maybeSingle();
  const { data: site } = org
    ? await db.from("site").select("id, project!inner(org_id)").eq("code", DEMO_SITE_CODE).eq("project.org_id", org.id).maybeSingle<any>()
    : { data: null };

  // PostGIS through check_site_geofence().
  const noSite = await db.rpc("check_site_geofence", { p_site_id: "00000000-0000-0000-0000-000000000000", p_lng: 0, p_lat: 0 });
  report(noSite.error ? "FAIL" : "PASS", "function check_site_geofence exists", noSite.error?.message);
  if (site) {
    const far = await db.rpc("check_site_geofence", { p_site_id: site.id, p_lng: 0, p_lat: 0 });
    const row = (far.data as any[] | null)?.[0];
    const good = !far.error && row && row.inside === false && row.distance_m > 1_000_000;
    report(good ? "PASS" : "FAIL", "PostGIS: a point far away is outside the JH-04 geofence", far.error?.message ?? `distance_m=${row?.distance_m}`);
  } else {
    report("SKIP", "PostGIS geometry check on JH-04", "demo site not seeded");
  }

  // pHash through match_phash_candidates().
  // 64-bit hashes exceed JS number precision, so read the raw JSON text instead of parsing it.
  const raw = await fetch(`${url}/rest/v1/evidence?select=id,phash&phash=not.is.null&limit=1`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  }).then((r) => r.text());
  const probe = raw.match(/"id":"([^"]+)","phash":(-?\d+)/);
  if (probe) {
    const [, probeId, probeHash] = probe;
    const m = await db.rpc("match_phash_candidates", { target_phash: probeHash, max_distance: 0 });
    const hit = (m.data as any[] | null)?.find((r) => r.id === probeId);
    report(!m.error && hit?.distance === 0 ? "PASS" : "FAIL", "pHash: exact match returns distance 0", m.error?.message);
  } else {
    const m = await db.rpc("match_phash_candidates", { target_phash: "0", max_distance: 0 });
    report(m.error ? "FAIL" : "PASS", "function match_phash_candidates exists", m.error?.message ?? "no evidence with a pHash yet");
  }

  // RLS: the anon key must see and change nothing.
  if (!isPlaceholder(anonKey)) {
    const anon = createClient(url, anonKey, { auth: { persistSession: false } });
    const leaks: string[] = [];
    for (const t of TABLES) {
      const r = await anon.from(t).select("*").limit(1);
      if (!r.error && (r.data?.length ?? 0) > 0) leaks.push(t);
    }
    const w = await anon.from("org").insert({ slug: "rls-probe", name: "rls-probe" });
    if (!w.error) {
      leaks.push("org (anon insert succeeded)");
      await db.from("org").delete().eq("slug", "rls-probe");
    }
    report(leaks.length ? "FAIL" : "PASS", "RLS: anon key reads and writes nothing", leaks.join(", "));
  } else {
    report("SKIP", "RLS anon probe", "NEXT_PUBLIC_SUPABASE_ANON_KEY not set");
  }

  // Demo data.
  if (!org || !site) {
    report("SKIP", "demo data", `org "${DEMO_ORG_SLUG}" / site ${DEMO_SITE_CODE} not found: run npm run seed`);
    return;
  }
  report("PASS", `demo org ${DEMO_ORG_SLUG} and site ${DEMO_SITE_CODE}`);

  const { data: ev } = await db.from("evidence").select("id, trust_status, phash").eq("site_id", site.id);
  const evidence = (ev ?? []) as any[];
  const count = (s: string) => evidence.filter((e) => e.trust_status === s).length;
  report(evidence.length > 0 ? "PASS" : "FAIL", "demo evidence", `${evidence.length} rows: ${count("verified")} verified, ${count("needs_review")} needs_review, ${count("flagged")} flagged`);
  report(count("verified") > 0 && count("needs_review") > 0 && count("flagged") > 0 ? "PASS" : "FAIL", "trust statuses are distinguishable (verified, needs_review and flagged all present)");

  // Two verified assets that are near-duplicates of each other mean reuse got through the trust model.
  const hashes = new Map<string, string>();
  const rawAll = await fetch(`${url}/rest/v1/evidence?select=id,phash&site_id=eq.${site.id}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  }).then((r) => r.text());
  for (const m of rawAll.matchAll(/"id":"([^"]+)","phash":(-?\d+)/g)) hashes.set(m[1], m[2]);
  const verified = evidence.filter((e) => e.trust_status === "verified" && e.phash !== null);
  const twins: string[] = [];
  for (const e of verified) {
    const m = await db.rpc("match_phash_candidates", { target_phash: hashes.get(e.id) ?? "0", max_distance: 4 });
    for (const o of (m.data as any[] | null) ?? []) {
      if (o.id !== e.id && e.id < o.id && verified.some((v) => v.id === o.id)) twins.push(`${e.id}~${o.id}`);
    }
  }
  report(twins.length ? "FAIL" : "PASS", "pHash: no two verified assets are near-duplicates", twins.join(", "));

  // Claims and coverage.
  const { data: claims } = await db
    .from("claim")
    .select("id, statement, expected_evidence, claim_evidence(evidence:evidence_id(id, trust_status))")
    .eq("site_id", site.id);
  const cl = (claims ?? []) as any[];
  report(cl.length > 0 ? "PASS" : "FAIL", "impact claims", `${cl.length} for ${DEMO_SITE_CODE}`);
  for (const c of cl) {
    const items = (c.claim_evidence ?? []).map((x: any) => x.evidence).filter(Boolean);
    const cov = computeCoverage({
      expected: c.expected_evidence,
      statuses: items.map((i: any) => i.trust_status as EvidenceStatus),
    });
    const verifiedCount = items.filter((i: any) => i.trust_status === "verified").length;
    const label = cov.strength === "strong" ? "strong evidence" : cov.strength === "moderate" ? "moderate evidence" : "evidence gap";
    report(
      items.length > 0 && cov.verified === verifiedCount ? "PASS" : "FAIL",
      `claim "${c.statement}"`,
      `${label}: ${cov.verified} verified, ${cov.pending} needs review, ${cov.flagged} flagged; ${c.expected_evidence} needed`
    );
  }
}

main()
  .catch((e) => report("FAIL", "unexpected error", e instanceof Error ? e.message : String(e)))
  .finally(() => {
    console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll checks passed");
    process.exit(failures ? 1 : 0);
  });
