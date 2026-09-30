import { z } from "zod";
import { getSiteInfo } from "./db";
import { generateStructured } from "./gemini";
import { hybridEvidenceSearch, type SearchHit } from "./rag";
import { recordAgentAction } from "./provenance";
import { errMsg } from "./util";
import { eligibleEvidence, type EvidenceRef, type InvestigationState, type InvestigationUpdate, type Phase } from "./state";

const RerankSchema = z.object({
  picks: z.array(
    z.object({
      evidenceId: z.string(),
      fitsGap: z.boolean(),
      suggestedPhase: z.enum(["before", "during", "after", "monitoring"]),
      reason: z.string(),
    })
  ),
});

const MAX_PICKS_PER_GAP = 3;

/**
 * Agent 5 — agentic retrieval. For each open gap it formulates a query, runs hybrid retrieval
 * (SQL filters + pgvector + Cloudinary), has Gemini pick what genuinely fills the gap, and pulls
 * those items (with their corrected phase) into the investigation. Flagged evidence is never pulled in.
 */
export async function discoverAgent(state: InvestigationState): Promise<InvestigationUpdate> {
  const site = await getSiteInfo(state.siteId);
  const gaps = state.evidenceGaps.filter((g) => g.severity !== "minor");
  const have = new Set(eligibleEvidence(state).map((e) => e.evidenceId));
  const blocked = new Set(state.excludedIds);

  const found: EvidenceRef[] = [];
  const overrides: Record<string, Phase> = {};
  const notes: string[] = [];

  for (const gap of gaps) {
    const query = `${gap.description} ${state.objective}`;
    let hits: SearchHit[];
    try {
      hits = await hybridEvidenceSearch({ query, siteId: state.siteId, minTrustScore: 60, limit: 10 });
    } catch (err) {
      notes.push(`Discovery search failed for gap "${gap.description}": ${errMsg(err)}`);
      continue;
    }
    // Candidates are items not already in play, never flagged, and (for phase gaps) currently in another phase.
    const candidates = hits.filter(
      (h) =>
        !have.has(h.evidenceId) && !blocked.has(h.evidenceId) && !found.some((f) => f.evidenceId === h.evidenceId) && h.trustStatus !== "flagged"
    );
    if (!candidates.length) continue;

    try {
      const out = await generateStructured({
        schema: RerankSchema,
        system:
          "You decide whether retrieved evidence fills a specific evidence gap. Be conservative: fitsGap=true only when the caption clearly supports it.",
        task: `Gap: "${gap.description}" (needs phase: ${gap.phase}). Activity objective: ${state.objective}. For each candidate, say whether it fills the gap and which phase it actually shows.`,
        data: candidates.map((c) => ({ evidenceId: c.evidenceId, labelledPhase: c.phase, caption: c.caption, similarity: Number(c.similarity.toFixed(3)), trustScore: c.trustScore })),
      });
      const byId = new Map(candidates.map((c) => [c.evidenceId, c]));
      let taken = 0;
      for (const p of out.picks) {
        const c = byId.get(p.evidenceId);
        if (!c || !p.fitsGap || taken >= MAX_PICKS_PER_GAP) continue;
        if (gap.phase !== "any" && p.suggestedPhase !== gap.phase) continue;
        found.push(c);
        if (gap.phase !== "any") overrides[c.evidenceId] = gap.phase;
        notes.push(`Discovery: ${c.evidenceId} added for gap "${gap.description}" — ${p.reason}`);
        taken++;
      }
    } catch (err) {
      notes.push(`Discovery rerank failed for gap "${gap.description}": ${errMsg(err)}`);
    }
  }

  await recordAgentAction({
    orgId: site.orgId,
    subjectType: "investigation",
    subjectId: state.investigationId,
    event: "discover_agent_retrieved",
    agent: "discover_agent",
    payload: { gaps_searched: gaps.length, evidence_added: found.map((f) => f.evidenceId), loop: state.loopCount + 1 },
  });

  return { discoveredEvidence: found, phaseOverrides: overrides, loopCount: state.loopCount + 1, lastDiscoveryAdded: found.length, notes };
}
