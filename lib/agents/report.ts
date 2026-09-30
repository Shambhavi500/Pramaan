import { z } from "zod";
import { supabase } from "@/lib/db";
import { cloudinary } from "@/lib/cloudinary";
import { classifyTransformation } from "@/lib/transformations";
import { generateStructured } from "./gemini";
import { getBrief, getSiteInfo, shortId } from "./db";
import { recordAgentAction } from "./provenance";
import { AGENT_VERSION, validIds } from "./util";
import { eligibleEvidence, type InvestigationState, type InvestigationUpdate } from "./state";

const ReportSchema = z.object({
  activitySummary: z.string(),
  beforeAfterNarrative: z.string(),
  executiveSummary: z.array(z.object({ text: z.string(), evidenceIds: z.array(z.string()) })),
  claims: z.array(
    z.object({
      statement: z.string(),
      verdict: z.enum(["supported", "partially_supported", "insufficient_evidence"]),
      confidence: z.enum(["high", "medium", "low"]),
      citedEvidenceIds: z.array(z.string()),
      limitations: z.string(),
    })
  ),
  cannotConclude: z.array(z.string()),
  campaign: z.object({ headline: z.string(), summary: z.string(), keyEvidenceIds: z.array(z.string()) }),
});

export interface ImpactReport {
  activitySummary: string;
  period: string;
  evidenceSummary: { total: number; verified: number; flagged: number; excluded: number };
  claims: Array<{ statement: string; verdict: string; confidence: string; citedEvidenceIds: string[]; limitations: string }>;
  beforeAfterNarrative: string;
  beforeAfterPairs: Array<{ pairId: string; beforeId: string; afterId: string; confidence: string; compositeUrl: string | null }>;
  timeline: InvestigationState["timeline"];
  evidenceGaps: InvestigationState["evidenceGaps"];
  cannotConclude: string[];
  campaignContent: { headline: string; summary: string; keyVisuals: string[] };
  traceability: { investigationId: string; generatedAt: string; agentVersions: Record<string, string> };
}

const visual = (publicId: string, t: string) => cloudinary.url(publicId, { raw_transformation: t, secure: true, sign_url: true });
const CAMPAIGN_T = "c_fill,ar_16:9,w_1280/f_auto,q_auto";

/** Agent 6 — terminal agent. Every claim is cited; anything uncited is dropped and gaps/limits are stated plainly. */
export async function reportAgent(state: InvestigationState): Promise<InvestigationUpdate> {
  const site = await getSiteInfo(state.siteId);
  const brief = await getBrief(state.briefId);
  const eligible = eligibleEvidence(state);
  const valid = new Set(eligible.map((e) => e.evidenceId));
  const period = [brief.period_start, brief.period_end].filter(Boolean).join(" to ") || "unspecified period";

  const out = await generateStructured({
    schema: ReportSchema,
    system:
      "You write honest impact reports for development projects. Every statement of fact must cite evidence IDs supplied in the data. " +
      "Never write 'successful' or similar without citations. Say explicitly what cannot be concluded. Visible change is not proof of causation. " +
      "The campaign summary must be at most 280 characters and contain no claim the evidence does not support.",
    task: `Write the report for: ${brief.objective} (${site.siteName}, ${site.place}; ${period}). Use verdict "insufficient_evidence" for any claim the evidence gaps prevent.`,
    data: {
      claimsDrafted: state.claims,
      timeline: state.timeline,
      beforeAfterPairs: state.beforeAfterPairs,
      evidenceGaps: state.evidenceGaps,
      notes: state.notes.slice(-20),
      evidenceIds: eligible.map((e) => ({ id: e.evidenceId, phase: e.phase, trust: e.trustScore })),
    },
  });

  // Server-side grounding: drop invented citations, downgrade claims left with none.
  const claims = out.claims.map((c) => {
    const ids = validIds(c.citedEvidenceIds, valid);
    return ids.length ? { ...c, citedEvidenceIds: ids } : { ...c, citedEvidenceIds: ids, verdict: "insufficient_evidence" as const, confidence: "low" as const };
  });
  const summary = out.executiveSummary.map((s) => ({ text: s.text, evidence_ids: validIds(s.evidenceIds, valid) }));
  const campaignSummary = out.campaign.summary.slice(0, 280);

  const keyIds = validIds(out.campaign.keyEvidenceIds, valid).slice(0, 4);
  const byId = new Map(eligible.map((e) => [e.evidenceId, e]));
  const visualEvidence = (keyIds.length ? keyIds : [...eligible].sort((a, b) => b.trustScore - a.trustScore).slice(0, 3).map((e) => e.evidenceId))
    .map((id) => byId.get(id)!)
    .filter(Boolean);

  const storyId = shortId("st_agent", 10);
  const keyVisuals = visualEvidence.map((e) => visual(e.cloudinaryPublicId, CAMPAIGN_T));

  const cited = [...summary, ...claims.map((c) => ({ evidence_ids: c.citedEvidenceIds }))];
  const coverage = cited.length ? cited.filter((p) => p.evidence_ids.length > 0).length / cited.length : 0;

  const impact: ImpactReport = {
    activitySummary: out.activitySummary,
    period,
    evidenceSummary: {
      total: state.organizedEvidence.length + state.excludedIds.length,
      verified: eligible.filter((e) => e.trustStatus === "verified").length,
      flagged: Object.keys(state.hitlDecisions).length + state.hitlRequests.length,
      excluded: state.excludedIds.length,
    },
    claims,
    beforeAfterNarrative: out.beforeAfterNarrative,
    beforeAfterPairs: state.beforeAfterPairs.map((p) => ({ pairId: p.pairId, beforeId: p.beforeId, afterId: p.afterId, confidence: p.confidence, compositeUrl: p.compositeUrl })),
    timeline: state.timeline,
    evidenceGaps: state.evidenceGaps,
    cannotConclude: out.cannotConclude,
    campaignContent: { headline: out.campaign.headline, summary: campaignSummary, keyVisuals },
    traceability: {
      investigationId: state.investigationId,
      generatedAt: new Date().toISOString(),
      agentVersions: Object.fromEntries(["organize", "analyze", "identify", "compare", "discover", "report"].map((a) => [a, AGENT_VERSION])),
    },
  };

  // The `report` column also carries the shape the existing Stories page renders (title / executive_summary / sections).
  const storyReport = {
    title: out.campaign.headline,
    executive_summary: summary,
    sections: [
      { heading: "Claims", paragraphs: claims.map((c) => ({ text: `${c.statement} [${c.verdict.replace(/_/g, " ")}, ${c.confidence} confidence] ${c.limitations}`, evidence_ids: c.citedEvidenceIds })) },
      { heading: "Before and after", paragraphs: [{ text: out.beforeAfterNarrative, evidence_ids: state.beforeAfterPairs.flatMap((p) => [p.beforeId, p.afterId]) }] },
      { heading: "What cannot be concluded", paragraphs: out.cannotConclude.map((t) => ({ text: t, evidence_ids: [] as string[] })) },
    ],
    impact,
  };

  const { error } = await supabase.from("story").insert({
    id: storyId,
    org_id: site.orgId,
    template: "agent_investigation",
    period,
    report: storyReport,
    citation_coverage: coverage,
    status: "draft",
  });
  if (error) throw new Error(`story insert failed: ${error.message}`);

  // Derivative traceability for every Cloudinary transformation the report uses.
  const { data: bases } = await supabase.from("evidence").select("id, cld_asset_id, cld_version").in("id", visualEvidence.map((e) => e.evidenceId));
  if (bases?.length) {
    await supabase.from("derivative").insert(
      bases.map((b, i) => ({
        id: shortId("dv", 6),
        base_evidence_id: b.id,
        base_asset_id: b.cld_asset_id,
        base_version: b.cld_version,
        story_id: storyId,
        kind: "campaign_thumbnail",
        transformation: CAMPAIGN_T,
        delivery_url: visual(visualEvidence.find((e) => e.evidenceId === b.id)!.cloudinaryPublicId, CAMPAIGN_T) || keyVisuals[i],
        class: classifyTransformation(CAMPAIGN_T),
      }))
    );
  }

  await recordAgentAction({
    orgId: site.orgId,
    subjectType: "story",
    subjectId: storyId,
    event: "report_agent_generated",
    agent: "report_agent",
    payload: {
      investigation_id: state.investigationId,
      citation_coverage: coverage,
      claims: claims.length,
      gaps: state.evidenceGaps.length,
      cited_evidence: [...new Set(claims.flatMap((c) => c.citedEvidenceIds))],
    },
  });

  return { finalReport: impact as unknown as Record<string, unknown>, reportId: storyId };
}
