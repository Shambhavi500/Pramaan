export const runtime = "nodejs";

import { z } from "zod";
import { supabase } from "@/lib/db";
import { getSiteInfo } from "@/lib/agents/db";
import { recordAgentAction } from "@/lib/agents/provenance";

const Body = z.object({
  checkpointId: z.number().int().positive(),
  decision: z.enum(["include", "exclude"]),
  note: z.string().trim().max(500).optional(),
});

/** Records a human decision on evidence the agents held back. The investigation is resumed via the investigate route. */
export async function POST(req: Request, ctx: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await ctx.params;
  if (!z.string().uuid().safeParse(siteId).success) return Response.json({ error: "Invalid site id" }, { status: 400 });
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid decision" }, { status: 400 });

  // The checkpoint must belong to an investigation of this site.
  const { data: cp } = await supabase
    .from("hitl_checkpoint")
    .select("id, evidence_id, decision, investigation_id, investigation!inner(site_id)")
    .eq("id", body.data.checkpointId)
    .eq("investigation.site_id", siteId)
    .maybeSingle();
  if (!cp) return Response.json({ error: "Checkpoint not found" }, { status: 404 });
  if (cp.decision) return Response.json({ error: "Already decided" }, { status: 409 });

  const { error } = await supabase
    .from("hitl_checkpoint")
    .update({ decision: body.data.decision, decision_note: body.data.note ?? null, decided_at: new Date().toISOString() })
    .eq("id", cp.id)
    .is("decision", null);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const site = await getSiteInfo(siteId);
  await recordAgentAction({
    orgId: site.orgId,
    subjectType: "evidence",
    subjectId: cp.evidence_id,
    event: "hitl_decision",
    agent: "human_reviewer",
    payload: { investigation_id: cp.investigation_id, decision: body.data.decision, note: body.data.note ?? null },
  });

  const { count } = await supabase
    .from("hitl_checkpoint")
    .select("id", { count: "exact", head: true })
    .eq("investigation_id", cp.investigation_id)
    .is("decision", null);

  return Response.json({ investigationId: cp.investigation_id, remaining: count ?? 0, readyToResume: (count ?? 0) === 0 });
}
