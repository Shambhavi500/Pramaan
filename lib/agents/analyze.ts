import { z } from "zod";
import { generateStructured } from "./gemini";
import { getSiteInfo } from "./db";
import { recordAgentAction } from "./provenance";
import { errMsg } from "./util";
import { eligibleEvidence, type EvidenceAnalysis, type InvestigationState, type InvestigationUpdate } from "./state";
import { supabase } from "@/lib/db";

const MAX_ANALYZE = Number(process.env.AGENT_MAX_ANALYZE ?? 40);
const BATCH = 8; // items per Gemini call: keeps request counts low under provider rate limits

const BatchSchema = z.object({
  items: z.array(
    z.object({
      evidenceId: z.string(),
      confirmed: z.array(z.string()),
      uncertain: z.array(z.string()),
      notVisible: z.array(z.string()),
      relevance: z.enum(["high", "medium", "low"]),
    })
  ),
});

const failed = (): EvidenceAnalysis => ({ confirmed: [], uncertain: ["Automated analysis failed for this item."], notVisible: [], relevance: "low" });

/** Agent 2 — reads each item through the lens of the activity objective, not as a generic "describe this image". */
export async function analyzeAgent(state: InvestigationState): Promise<InvestigationUpdate> {
  const site = await getSiteInfo(state.siteId);
  const todo = eligibleEvidence(state)
    .filter((e) => !state.analyzedEvidence[e.evidenceId])
    .sort((a, b) => b.trustScore - a.trustScore)
    .slice(0, MAX_ANALYZE);

  const { data: vision } = await supabase.from("understanding").select("evidence_id, ai_vision").in("evidence_id", todo.map((e) => e.evidenceId));
  const visionById = new Map((vision ?? []).map((v) => [v.evidence_id, (v.ai_vision ?? {}) as Record<string, unknown>]));

  const notes: string[] = [];
  const results: Record<string, EvidenceAnalysis> = {};

  for (let i = 0; i < todo.length; i += BATCH) {
    const batch = todo.slice(i, i + BATCH);
    try {
      const out = await generateStructured({
        schema: BatchSchema,
        system:
          "You are an evidence analyst for a development-project audit. Report only what the provided description supports. " +
          "For each item separate what is confirmed from what is uncertain, and list target signals that are not visible.",
        task:
          `Activity objective: ${state.objective}\nInvestigation targets (what to look for): ${JSON.stringify(state.investigationPlan?.observationTargets ?? [])}\n` +
          `Return one entry per evidenceId.`,
        data: batch.map((e) => {
          const v = visionById.get(e.evidenceId) ?? {};
          return {
            evidenceId: e.evidenceId,
            phase: e.phase,
            caption: e.caption,
            detected: { activity: v.activity, setting: v.setting, counts: v.visible_counts, visible_text: v.visible_text },
            recaptureCues: v.recapture_cues,
            syntheticCues: v.synthetic_cues,
          };
        }),
      });
      const byId = new Map(out.items.map((it) => [it.evidenceId, it]));
      for (const e of batch) {
        const it = byId.get(e.evidenceId);
        results[e.evidenceId] = it ? { confirmed: it.confirmed, uncertain: it.uncertain, notVisible: it.notVisible, relevance: it.relevance } : failed();
        if (!it) notes.push(`Analysis missing for ${e.evidenceId}`);
      }
    } catch (err) {
      notes.push(`Analysis failed for a batch of ${batch.length}: ${errMsg(err)}`);
      for (const e of batch) results[e.evidenceId] = failed();
    }
  }

  if (todo.length && Object.values(results).every((r) => r.uncertain[0]?.startsWith("Automated"))) {
    throw new Error(`Analysis failed for every item. ${notes[0] ?? ""}`.trim());
  }

  await recordAgentAction({
    orgId: site.orgId,
    subjectType: "investigation",
    subjectId: state.investigationId,
    event: "analyze_agent_analyzed",
    agent: "analyze_agent",
    payload: { analyzed: todo.length, failed: Object.values(results).filter((r) => r.uncertain[0]?.startsWith("Automated")).length },
  });

  return { analyzedEvidence: results, notes };
}
