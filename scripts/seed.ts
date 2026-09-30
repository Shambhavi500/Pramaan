import { createClient } from "@supabase/supabase-js";
import { appendLedgerEntry } from "../lib/ledger";
import {
  DEMO_CLAIMS,
  DEMO_CLAIM_EVIDENCE_IDS,
  DEMO_DERIVATIVES,
  DEMO_ORG,
  DEMO_PAIR,
  DEMO_PROJECT,
  DEMO_REVIEWS,
  DEMO_SITE,
  DEMO_STORY_ID,
  DEMO_STORY_META,
  buildDemoEvidence,
  buildDemoStory,
  buildLedgerPlan,
  derivativeDeliveryUrl,
} from "../lib/demo-dataset";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const LEDGER_ACTOR = "demo_seed";
const LEGACY_ORG_SLUG = "green-aravalli"; // the first demo project (GA-17, Kotra), superseded by JH-04

function must<T>(res: { data: T; error: { message: string } | null }, what: string): NonNullable<T> {
  if (res.error || res.data == null) throw new Error(`${what}: ${res.error?.message ?? "no data"}`);
  return res.data as NonNullable<T>;
}

function check(res: { error: { message: string } | null }, what: string) {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
}

async function handleLegacy(reset: boolean) {
  const { data: legacy } = await supabase.from("org").select("id").eq("slug", LEGACY_ORG_SLUG).maybeSingle();
  if (!legacy) return;
  if (!reset) {
    console.warn(
      `! Legacy demo org "${LEGACY_ORG_SLUG}" still exists and will appear in the review queue. ` +
        `Re-run with "npm run seed -- --reset-legacy" to delete it and everything under it.`
    );
    return;
  }
  check(await supabase.from("org").delete().eq("id", legacy.id), "delete legacy org");
  console.log(`✓ Deleted legacy org "${LEGACY_ORG_SLUG}" (cascades to its projects, sites and evidence).`);
}

async function seed() {
  console.log("Seeding Pramaan demo data: JalSetu Foundation / Check Dam JH-04...");
  await handleLegacy(process.argv.includes("--reset-legacy"));

  const org = must(
    await supabase.from("org").upsert(DEMO_ORG, { onConflict: "slug" }).select().single(),
    "org"
  );
  const project = must(
    await supabase
      .from("project")
      .upsert({ org_id: org.id, ...DEMO_PROJECT }, { onConflict: "org_id,code" })
      .select()
      .single(),
    "project"
  );
  const site = must(
    await supabase
      .from("site")
      .upsert({ project_id: project.id, ...DEMO_SITE }, { onConflict: "project_id,code" })
      .select()
      .single(),
    "site"
  );

  const evidence = buildDemoEvidence();
  const ids = evidence.map((e) => e.row.id);

  check(
    await supabase
      .from("evidence")
      .upsert(
        evidence.map((e) => ({ ...e.row, org_id: org.id, project_id: project.id, site_id: site.id })),
        { onConflict: "id" }
      ),
    "evidence"
  );
  check(await supabase.from("understanding").upsert(evidence.map((e) => e.understanding)), "understanding");

  // The review table has no natural key, so replace this dataset's rows to stay idempotent.
  check(await supabase.from("review").delete().in("evidence_id", ids), "review reset");
  if (DEMO_REVIEWS.length) {
    check(
      await supabase
        .from("review")
        .insert(DEMO_REVIEWS.map(({ evidence_id, decision, reason }) => ({ evidence_id, decision, reason }))),
      "review"
    );
  }

  for (const { evidenceKeys, ...claim } of DEMO_CLAIMS) {
    const linked = evidenceKeys.map((k) => evidence.find((e) => e.key === k)!.row.id);
    check(
      await supabase.from("claim").upsert({ ...claim, project_id: project.id, site_id: site.id }, { onConflict: "id" }),
      `claim ${claim.id}`
    );
    check(
      await supabase.from("claim_evidence").delete().eq("claim_id", claim.id).not("evidence_id", "in", `(${linked.join(",")})`),
      `claim_evidence prune ${claim.id}`
    );
    check(
      await supabase
        .from("claim_evidence")
        .upsert(linked.map((evidence_id) => ({ claim_id: claim.id, evidence_id })), { onConflict: "claim_id,evidence_id" }),
      `claim_evidence ${claim.id}`
    );
  }

  check(await supabase.from("pair").upsert({ ...DEMO_PAIR, site_id: site.id }, { onConflict: "id" }), "pair");

  const story = buildDemoStory(evidence);
  check(
    await supabase.from("story").upsert(
      {
        id: DEMO_STORY_ID,
        org_id: org.id,
        ...DEMO_STORY_META,
        report: story.report,
        citation_coverage: story.citation_coverage,
        status: "draft",
      },
      { onConflict: "id" }
    ),
    "story"
  );

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo";
  check(
    await supabase.from("derivative").upsert(
      DEMO_DERIVATIVES.map((d) => {
        const base = evidence.find((e) => e.key === d.baseKey)!.row;
        return {
          id: d.id,
          base_evidence_id: base.id,
          base_asset_id: base.cld_asset_id,
          base_version: base.cld_version,
          story_id: d.story_id,
          kind: d.kind,
          transformation: d.transformation,
          delivery_url: derivativeDeliveryUrl(cloudName, d.transformation, base.cld_public_id, base.cld_version),
          class: d.class,
        };
      }),
      { onConflict: "id" }
    ),
    "derivative"
  );

  // The ledger is append-only, so only add entries this dataset has not written before.
  let appended = 0;
  for (const entry of buildLedgerPlan(evidence)) {
    const { data: existing } = await supabase
      .from("ledger_entry")
      .select("seq")
      .eq("subject_id", entry.subjectId)
      .eq("event", entry.event)
      .eq("actor", LEDGER_ACTOR)
      .limit(1);
    if (existing && existing.length) continue;
    await appendLedgerEntry({ ...entry, actor: LEDGER_ACTOR, orgId: org.id });
    appended++;
  }

  const byStatus = evidence.reduce<Record<string, number>>((acc, e) => {
    const s = String(e.row.trust_status);
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`✓ ${evidence.length} evidence rows`, byStatus, `· ${appended} new ledger entries`);
  console.log("! Image files are not created by the seed. Upload the demo media (docs/demo-jh04.md) to the public IDs above.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
