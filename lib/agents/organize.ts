import { z } from "zod";
import { supabase } from "@/lib/db";
import { cloudinary } from "@/lib/cloudinary";
import { generateStructured } from "./gemini";
import { fetchSiteEvidenceRows, getSiteInfo, toEvidenceRef } from "./db";
import { recordAgentAction } from "./provenance";
import { errMsg } from "./util";
import type { EvidenceRef, HitlRequest, InvestigationState, InvestigationUpdate, Phase } from "./state";

const PhaseCheck = z.object({
  corrections: z.array(
    z.object({
      evidenceId: z.string(),
      suggestedPhase: z.enum(["before", "during", "after", "monitoring"]),
      confidence: z.enum(["high", "medium", "low"]),
      reason: z.string(),
    })
  ),
  clusters: z.array(z.object({ label: z.string(), evidenceIds: z.array(z.string()) })),
});

interface TrustSignal {
  id: string;
  name?: string;
  reason?: string;
  hardFlag?: boolean;
}

/** Agent 1 — turns the raw evidence bucket into a phase-tagged set, and holds back anything that needs a human. */
export async function organizeAgent(state: InvestigationState): Promise<InvestigationUpdate> {
  const site = await getSiteInfo(state.siteId);
  const rows = await fetchSiteEvidenceRows(state.siteId);

  const { data: decided } = await supabase
    .from("hitl_checkpoint")
    .select("evidence_id, decision")
    .eq("investigation_id", state.investigationId)
    .not("decision", "is", null);
  const decisions: Record<string, string> = { ...state.hitlDecisions };
  for (const d of decided ?? []) decisions[d.evidence_id] = d.decision as string;

  const kept: EvidenceRef[] = [];
  const excluded: string[] = [];
  const hitl: HitlRequest[] = [];
  const notes: string[] = [];

  for (const row of rows) {
    const ref = toEvidenceRef(row);
    if (row.trust_status === "rejected") {
      excluded.push(ref.evidenceId);
      continue;
    }
    if (row.trust_status === "flagged") {
      // Flagged evidence (reused image, out-of-geofence, synthetic cues, ...) never enters a report without a human decision.
      const decision = decisions[ref.evidenceId];
      if (decision === "include") kept.push(ref);
      else {
        excluded.push(ref.evidenceId);
        if (!decision) {
          const u = Array.isArray(row.understanding) ? row.understanding[0] : row.understanding;
          const signals = ((u?.ai_vision as { trust_signals?: TrustSignal[] } | null)?.trust_signals ?? []).filter(
            (s) => s.hardFlag || s.id === "I1"
          );
          const why = signals.map((s) => s.reason || s.name).filter(Boolean).join(" ");
          hitl.push({
            evidenceId: ref.evidenceId,
            agent: "organize_agent",
            reason: why || `Evidence is flagged (trust score ${ref.trustScore}).`,
            options: [
              { label: "Include in report", value: "include" },
              { label: "Exclude", value: "exclude" },
            ],
          });
        }
      }
      continue;
    }
    kept.push(ref);
  }

  // Ask Gemini to spot phase mislabels and cluster near-identical viewpoints. Advisory; only high-confidence fixes apply.
  const overrides: Record<string, Phase> = {};
  const described = kept.filter((e) => e.caption).slice(0, 60);
  if (described.length >= 2) {
    try {
      const out = await generateStructured({
        schema: PhaseCheck,
        system:
          "You organise field evidence for a development-project audit. You only propose a phase correction when the caption clearly contradicts the labelled phase.",
        task:
          `Activity objective: ${state.objective}\nFor each item, decide whether its labelled phase (before/during/after/monitoring) is contradicted by its caption. ` +
          `Also group items that show the same subject or viewpoint into labelled clusters.`,
        data: described.map((e) => ({ evidenceId: e.evidenceId, labelledPhase: e.phase, caption: e.caption, capturedAt: e.capturedAt })),
      });
      const known = new Set(described.map((e) => e.evidenceId));
      for (const c of out.corrections) {
        if (known.has(c.evidenceId) && c.confidence === "high") {
          overrides[c.evidenceId] = c.suggestedPhase;
          notes.push(`Phase of ${c.evidenceId} treated as "${c.suggestedPhase}": ${c.reason}`);
        }
      }
      for (const c of out.clusters.filter((c) => c.evidenceIds.length > 1).slice(0, 5)) {
        notes.push(`Cluster "${c.label}": ${c.evidenceIds.filter((i) => known.has(i)).join(", ")}`);
      }
    } catch (err) {
      notes.push(`Phase check skipped: ${errMsg(err)}`);
    }
  }

  const organized = kept.map((e) => ({ ...e, phase: overrides[e.evidenceId] ?? e.phase }));

  // Best-effort phase tags in the Cloudinary DAM so the assets are browsable there too.
  for (const phase of ["before", "during", "after", "monitoring"] as const) {
    const ids = organized.filter((e) => e.phase === phase).map((e) => e.cloudinaryPublicId);
    if (ids.length) await cloudinary.uploader.add_tag(`phase_${phase}`, ids.slice(0, 1000)).catch(() => undefined);
  }

  await recordAgentAction({
    orgId: site.orgId,
    subjectType: "investigation",
    subjectId: state.investigationId,
    event: "organize_agent_organized",
    agent: "organize_agent",
    payload: { organized: organized.length, excluded: excluded.length, held_for_review: hitl.length },
  });

  return {
    organizedEvidence: organized,
    excludedIds: excluded,
    hitlRequests: hitl,
    hitlDecisions: decisions,
    notes,
  };
}
