import { z } from "zod";
import { supabase } from "@/lib/db";
import { generateStructured } from "./gemini";
import { getBrief, getSiteInfo } from "./db";
import { recordAgentAction } from "./provenance";
import { errMsg } from "./util";
import { eligibleEvidence, type EvidenceIdentity, type InvestigationState, type InvestigationUpdate } from "./state";

const SignalSchema = z.object({
  items: z.array(z.object({ evidenceId: z.string(), signals: z.array(z.string()), inconsistencies: z.array(z.string()) })),
});

const BATCH = 12;

/**
 * Agent 3 — confirms each item belongs to this site / phase / activity.
 * The confirmations are deterministic (geofence result, AI-vision match, capture date vs period);
 * Gemini only adds visual signals and flags inconsistencies. It never overrides a deterministic result.
 */
export async function identifyAgent(state: InvestigationState): Promise<InvestigationUpdate> {
  const site = await getSiteInfo(state.siteId);
  const brief = await getBrief(state.briefId);
  const todo = eligibleEvidence(state).filter((e) => !state.identifiedContext[e.evidenceId]);

  const { data: vision } = await supabase.from("understanding").select("evidence_id, ai_vision").in("evidence_id", todo.map((e) => e.evidenceId));
  const visionById = new Map((vision ?? []).map((v) => [v.evidence_id, (v.ai_vision ?? {}) as Record<string, unknown>]));

  const start = brief.period_start ? new Date(brief.period_start).getTime() : null;
  const end = brief.period_end ? new Date(brief.period_end).getTime() + 86_400_000 : null;

  const identities: Record<string, EvidenceIdentity> = {};
  const notes: string[] = [];

  for (const e of todo) {
    const v = visionById.get(e.evidenceId) ?? {};
    const inconsistencies: string[] = [];

    const geo = e.geoStatus;
    const siteScore = geo === "in_geofence" ? 1 : geo === "outside_geofence" ? 0 : 0.4;
    if (geo === "outside_geofence") inconsistencies.push("GPS places this capture outside the registered site geofence.");
    if (geo === "no_gps" || geo === null) inconsistencies.push("No GPS: location cannot be confirmed from metadata.");

    const match = v.activity_matches_claim;
    const activityScore = match === "yes" ? 1 : match === "no" ? 0 : 0.5;
    if (match === "no") inconsistencies.push(`Visual content does not match the claimed activity "${e.activityClaimed}".`);

    let phaseScore = 0.5;
    const t = e.capturedAt ? new Date(e.capturedAt).getTime() : NaN;
    if (!isNaN(t) && (start !== null || end !== null)) {
      const inside = (start === null || t >= start) && (end === null || t < end);
      phaseScore = inside ? 1 : 0;
      if (!inside) inconsistencies.push("Capture time falls outside the activity period.");
    }

    identities[e.evidenceId] = {
      siteConfirmed: geo === "in_geofence",
      phaseConfirmed: phaseScore === 1,
      activityConfirmed: match === "yes",
      signals: [],
      inconsistencies,
      contextConfidence: Math.round((0.4 * siteScore + 0.4 * activityScore + 0.2 * phaseScore) * 100) / 100,
    };
  }

  // Gemini pass for visual signals, batched. Failures leave the deterministic result intact.
  for (let i = 0; i < todo.length; i += BATCH) {
    const batch = todo.slice(i, i + BATCH);
    try {
      const out = await generateStructured({
        schema: SignalSchema,
        system:
          "You extract visual signals from evidence descriptions and flag internal inconsistencies. " +
          "Signals are short phrases in categories: structural, environmental, human activity, temporal. Do not restate deterministic checks.",
        task:
          `Site ${site.siteCode} (${site.place}); activity period ${brief.period_start ?? "?"} to ${brief.period_end ?? "?"}; objective: ${state.objective}. ` +
          `For each item list visible signals and any inconsistencies between its caption, labelled phase, and the checks provided.`,
        data: batch.map((e) => ({
          evidenceId: e.evidenceId,
          phase: e.phase,
          caption: e.caption,
          capturedAt: e.capturedAt,
          deterministicChecks: identities[e.evidenceId],
        })),
      });
      for (const item of out.items) {
        const id = identities[item.evidenceId];
        if (!id) continue;
        id.signals = item.signals.slice(0, 8);
        id.inconsistencies = [...id.inconsistencies, ...item.inconsistencies.slice(0, 4)];
      }
    } catch (err) {
      notes.push(`Signal extraction skipped for a batch of ${batch.length}: ${errMsg(err)}`);
    }
  }

  for (const [id, ident] of Object.entries(identities)) {
    if (ident.inconsistencies.length) notes.push(`${id}: ${ident.inconsistencies.join(" ")}`);
  }

  await recordAgentAction({
    orgId: site.orgId,
    subjectType: "investigation",
    subjectId: state.investigationId,
    event: "identify_agent_verified_context",
    agent: "identify_agent",
    payload: {
      identified: todo.length,
      site_confirmed: Object.values(identities).filter((i) => i.siteConfirmed).length,
      with_inconsistencies: Object.values(identities).filter((i) => i.inconsistencies.length).length,
    },
  });

  return { identifiedContext: identities, notes };
}
