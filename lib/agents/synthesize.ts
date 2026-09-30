import { z } from "zod";
import { generateStructured } from "./gemini";
import { getBrief } from "./db";
import { errMsg, validIds } from "./util";
import { eligibleEvidence, type EvidenceGap, type InvestigationState, type InvestigationUpdate, type Phase } from "./state";

const SynthSchema = z.object({
  claims: z.array(
    z.object({
      statement: z.string(),
      supportingIds: z.array(z.string()),
      confidence: z.enum(["high", "medium", "low"]),
      gaps: z.array(z.string()),
    })
  ),
  timeline: z.array(z.object({ date: z.string(), phase: z.string(), description: z.string(), evidenceIds: z.array(z.string()) })),
});

const CLAIM_LABEL: Record<string, string> = {
  construction_complete: "construction/restoration completed",
  location_authenticity: "location authenticity",
  before_after_change: "before/after physical change",
  environmental_change: "environmental change",
  community_participation: "community participation",
};

/** Deterministic gap detection first (what is missing), then Gemini drafts claims and a timeline from what exists. */
export async function synthesizeEvidence(state: InvestigationState): Promise<InvestigationUpdate> {
  const brief = await getBrief(state.briefId);
  const eligible = eligibleEvidence(state).filter((e) => e.trustScore >= 60);
  const wants = new Set(brief.claims_to_establish);
  const notes: string[] = [];

  const gaps: EvidenceGap[] = [];
  const need = (phase: Phase, severity: EvidenceGap["severity"], label: string) => {
    if (!eligible.some((e) => e.phase === phase)) gaps.push({ phase, severity, description: `No trusted "${label}" evidence for ${brief.objective}` });
  };
  need("before", "critical", "before");
  need("after", "critical", "after");
  if (wants.has("construction_complete") || wants.has("community_participation")) need("during", "moderate", "during-activity");

  if ((wants.has("before_after_change") || wants.has("environmental_change")) && !state.beforeAfterPairs.some((p) => p.confidence !== "inconclusive")) {
    gaps.push({ phase: "any", severity: "critical", description: "No comparable before/after pair showing the same place or viewpoint" });
  }
  if (wants.has("location_authenticity")) {
    const inFence = eligible.filter((e) => e.geoStatus === "in_geofence").length;
    if (eligible.length && inFence / eligible.length < 0.5) {
      gaps.push({ phase: "any", severity: "moderate", description: "Fewer than half of the evidence items are GPS-confirmed inside the site geofence" });
    }
  }

  let claims: InvestigationUpdate["claims"] = [];
  let timeline: InvestigationUpdate["timeline"] = [];
  if (eligible.length) {
    try {
      const out = await generateStructured({
        schema: SynthSchema,
        system:
          "You synthesise verified field evidence into cautious claims. Every claim MUST cite evidence IDs from the data. " +
          "State limits honestly; never assert project success or causation beyond what the evidence shows.",
        task:
          `Objective: ${brief.objective}. Claims the project wants to establish: ${brief.claims_to_establish.map((c) => CLAIM_LABEL[c] ?? c).join("; ") || "unspecified"}. ` +
          `Produce one claim per requested claim (plus any other well-supported finding), with confidence and any gaps, and a dated timeline of the activity.`,
        data: {
          evidence: eligible.slice(0, 60).map((e) => ({
            evidenceId: e.evidenceId,
            phase: e.phase,
            capturedAt: e.capturedAt,
            trustScore: e.trustScore,
            caption: e.caption,
            analysis: state.analyzedEvidence[e.evidenceId],
            context: state.identifiedContext[e.evidenceId] && {
              siteConfirmed: state.identifiedContext[e.evidenceId].siteConfirmed,
              inconsistencies: state.identifiedContext[e.evidenceId].inconsistencies,
            },
          })),
          beforeAfterPairs: state.beforeAfterPairs.map((p) => ({ before: p.beforeId, after: p.afterId, confidence: p.confidence, visibleChanges: p.visibleChanges, cannotConclude: p.cannotConclude })),
          openGaps: gaps,
        },
      });
      const valid = new Set(eligible.map((e) => e.evidenceId));
      claims = out.claims
        .map((c) => ({ ...c, supportingIds: validIds(c.supportingIds, valid) }))
        .filter((c) => c.supportingIds.length > 0); // an uncited claim is dropped, not softened
      timeline = out.timeline.map((t) => ({ ...t, evidenceIds: validIds(t.evidenceIds, valid) })).filter((t) => t.evidenceIds.length > 0);
    } catch (err) {
      notes.push(`Synthesis failed: ${errMsg(err)}`);
    }
  }

  return { evidenceGaps: gaps, claims, timeline, notes };
}
