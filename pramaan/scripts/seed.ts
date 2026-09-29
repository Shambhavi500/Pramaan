import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

function must<T>(res: { data: T; error: { message: string } | null }, what: string): NonNullable<T> {
  if (res.error || res.data == null) throw new Error(`${what}: ${res.error?.message ?? "no data"}`);
  return res.data as NonNullable<T>;
}

async function seed() {
  console.log("Seeding Pramaan demo data...");

  const org = must(
    await supabase
      .from("org")
      .upsert({ slug: "green-aravalli", name: "Green Aravalli Foundation", kind: "ngo" }, { onConflict: "slug" })
      .select()
      .single(),
    "org"
  );

  const project = must(
    await supabase
      .from("project")
      .upsert(
        {
          org_id: org.id,
          code: "aravalli-ws-2",
          name: "Aravalli Watershed Restorations",
          summary: "Restoring water retention and sapling cover across 8 tribal villages.",
          funder: "TechCorp India CSR",
          sdgs: ["SDG6", "SDG13", "SDG15"],
        },
        { onConflict: "org_id,code" }
      )
      .select()
      .single(),
    "project"
  );

  const site = must(
    await supabase
      .from("site")
      .upsert(
        {
          project_id: project.id,
          code: "GA-17",
          name: "Kotra Check Dam #4",
          village: "Kotra",
          district: "Udaipur",
          state: "Rajasthan",
          setting: "rural_field",
          // Placeholder coordinates near Kotra, Udaipur: replace with the real surveyed site.
          center: "SRID=4326;POINT(73.4386 24.2189)",
          radius_m: 150,
          geofence:
            "SRID=4326;POLYGON((73.4376 24.2180, 73.4396 24.2180, 73.4396 24.2198, 73.4376 24.2198, 73.4376 24.2180))",
        },
        { onConflict: "project_id,code" }
      )
      .select()
      .single(),
    "site"
  );

  const base = { org_id: org.id, project_id: project.id, site_id: site.id, resource_type: "image", format: "jpg" };

  const ev = await supabase.from("evidence").upsert(
    [
      {
        ...base,
        id: "ev_01J9Z6Q2",
        cld_asset_id: "cld_asset_seed_01",
        cld_public_id: "cld-sample",
        cld_version: 1727600000,
        bytes: 204800,
        width: 1200,
        height: 900,
        etag: "a8f9b2c3d4e5f601",
        client_sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        phase: "before",
        activity_claimed: "check_dam_construction",
        trust_score: 94,
        trust_status: "verified",
      },
      {
        ...base,
        id: "ev_01J9Z6Q3",
        cld_asset_id: "cld_asset_seed_02",
        cld_public_id: "cld-sample-2",
        cld_version: 1727600001,
        bytes: 215400,
        width: 1200,
        height: 900,
        etag: "b9e8c7d6a5f40123",
        client_sha256: "cf83ac138fbc97d61e1482b5d3b160eed824fcd031f0dd82f8ab28c00ee92347",
        phase: "after",
        activity_claimed: "check_dam_construction",
        trust_score: 91,
        trust_status: "verified",
      },
    ],
    { onConflict: "id" }
  );
  if (ev.error) throw new Error(`evidence: ${ev.error.message}`);

  const pair = await supabase.from("pair").upsert(
    {
      id: "pair_01",
      site_id: site.id,
      before_id: "ev_01J9Z6Q2",
      after_id: "ev_01J9Z6Q3",
      candidate_score: 0.9,
      status: "approved",
    },
    { onConflict: "id" }
  );
  if (pair.error) throw new Error(`pair: ${pair.error.message}`);

  const dv = await supabase.from("derivative").upsert(
    {
      id: "dv_8f9a2b",
      base_evidence_id: "ev_01J9Z6Q3",
      base_asset_id: "cld_asset_seed_02",
      base_version: 1727600001,
      kind: "card",
      transformation: "t_public_safe/f_auto/q_auto",
      delivery_url: "https://res.cloudinary.com/demo/image/upload/t_public_safe/cld-sample-2.jpg",
      class: "redacted",
    },
    { onConflict: "id" }
  );
  if (dv.error) throw new Error(`derivative: ${dv.error.message}`);

  console.log("✓ Seed data inserted successfully.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
