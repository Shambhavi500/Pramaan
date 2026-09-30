import { supabase } from "../lib/db";
import { getLatestBrief } from "../lib/agents/db";
import { generateInvestigationPlan } from "../lib/agents/plan";
import { prepareInvestigation, runInvestigation } from "../lib/agents/graph";

/** CLI run of an investigation: `npm run investigate -- JH-04 [inv_id-to-resume]`. Creates a demo brief if the site has none. */
async function main() {
  const code = process.argv[2] ?? "JH-04";
  const resumeId = process.argv[3];
  const { data: site } = await supabase.from("site").select("id, name").eq("code", code).limit(1).maybeSingle();
  if (!site) throw new Error(`No site with code ${code}`);

  if (!(await getLatestBrief(site.id))) {
    const { data: brief, error } = await supabase
      .from("activity_brief")
      .insert({
        site_id: site.id,
        objective: `Demonstrate construction of the check dam at ${site.name} and its effect on the surrounding site`,
        activity_type: "check_dam_construction",
        claims_to_establish: ["construction_complete", "location_authenticity", "before_after_change", "environmental_change"],
        evidence_types: ["photos"],
      })
      .select("id")
      .single();
    if (error || !brief) throw new Error(error?.message ?? "brief insert failed");
    await generateInvestigationPlan(brief.id);
    console.log("created demo brief", brief.id);
  }

  const { investigationId, briefId } = await prepareInvestigation(site.id, { resumeId });
  for await (const ev of runInvestigation(site.id, investigationId, briefId)) console.log(JSON.stringify(ev));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
