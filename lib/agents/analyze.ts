import { z } from "zod";
import { generateStructured } from "./gemini";
import { getSiteInfo } from "./db";
import { recordAgentAction } from "./provenance";
import { errMsg, mapLimit } from "./util";
import { eligibleEvidence, type EvidenceAnalysis, type InvestigationState, type InvestigationUpdate } from "./state";
import { supabase } from "@/lib/db";

const MAX_ANALYZE = Number(process.env.AGENT_MAX_ANALYZE ?? 40);

const AnalysisSchema = z.object({
  confirmed: z.array(z.string()),
  uncertain: z.array(z.string()),
  notVisible: z.array(z.string()),
  relevance: z.enum(["high", "medium", "low"]),
});

/** Agent 2 — reads each item through the lens of the activity objective, not as a generic "describe this image". */
export async function analyzeAgent(state: InvestigationState): Promise<InvestigationUpdate> {
  const site = await getSiteInfo(state.siteId);
  const todo = eligibleEvidence(state)
    .filter((e) => !state.analyzedEvidence[e.evidenceId])
    .sort((a, b) => b.trustScore - a.trustScore)
    .slice(0, MAX_ANALYZE);

  const { data: vision } = await supabase.from("understanding").select("evidence_id, ai_vision").in("evidence_id", todo.map((e) => e.evidenceId));
  const visionById = new Map((vision ?? []).map((v) => [v.evidence_id, v.ai_vision as Record<string, unknown>]));

  const notes: string[] = [];
  const results = await mapLimit(todo, 4, async (e): Promise<[string, EvidenceAnalysis]> => {
    const v = visionById.get(e.evidenceId) ?? {};
    try {
      const out = await generateStructured({
        schema: AnalysisSchema,
        system:
          "You are an evidence analyst for a development-project audit. Report only what the provided description supports. " +
          "Separate what is confirmed from what is uncertain, and list target signals that are not visible.",
        task:
          `Activity objective: ${state.objective}\nInvestigation plan (what to look for): ${JSON.stringify(state.investigationPlan?.observationTargets ?? state.investigationPlan ?? {})}\n` +
          `Phase labelled: ${e.phase}. What relevant observations can be made from this evidence description? What is confirmed, uncertain, and not visible?`,
        data: {
          caption: e.caption,
          detected: { activity: v.activity, setting: v.setting, counts: v.visible_counts, visible_text: v.visible_text },
          recaptureCues: v.recapture_cues,
          syntheticCues: v.synthetic_cues,
        },
      });
      return [e.evidenceId, out];
    } catch (err) {
      notes.push(`Analysis failed for ${e.evidenceId}: ${errMsg(err)}`);
      return [e.evidenceId, { confirmed: [], uncertain: ["Automated analysis failed for this item."], notVisible: [], relevance: "low" }];
    }
  });

  await recordAgentAction({
    orgId: site.orgId,
    subjectType: "investigation",
    subjectId: state.investigationId,
    event: "analyze_agent_analyzed",
    agent: "analyze_agent",
    payload: { analyzed: results.length, failed: notes.length },
  });

  return { analyzedEvidence: Object.fromEntries(results), notes };
}
