import { z } from "zod";
import { supabase } from "@/lib/db";
import { generateStructured } from "./gemini";
import { getBrief } from "./db";
import type { InvestigationState, InvestigationUpdate } from "./state";

export const PlanSchema = z.object({
  observationTargets: z.array(z.string()),
  claims: z.array(
    z.object({
      claim: z.string(),
      evidenceNeeded: z.array(z.string()),
      visualSignals: z.array(z.string()),
      comparisons: z.array(z.string()),
      sufficiency: z.string(),
    })
  ),
});

/** Generates the investigation plan from the activity brief and stores it back on the brief. */
export async function generateInvestigationPlan(briefId: string) {
  const brief = await getBrief(briefId);
  const plan = await generateStructured({
    schema: PlanSchema,
    system:
      "You plan evidence investigations for development projects (water conservation, plantation, infrastructure, community work). " +
      "Be concrete about the visual signals that would show each claim, per project phase.",
    task:
      "Create an investigation plan: (1) observationTargets — the concrete things to look for in photos/videos; " +
      "(2) for each claim to establish: what evidence is needed, the visual signals, what comparisons to make, and what would count as sufficient evidence.",
    data: {
      objective: brief.objective,
      activityType: brief.activity_type,
      period: [brief.period_start, brief.period_end],
      claimsToEstablish: brief.claims_to_establish,
      evidenceTypes: brief.evidence_types,
    },
  });
  const { error } = await supabase.from("activity_brief").update({ investigation_plan: plan }).eq("id", briefId);
  if (error) throw new Error(`Could not store investigation plan: ${error.message}`);
  return plan;
}

/** Graph node: reuse the stored plan when there is one, otherwise generate it. */
export async function understandObjective(state: InvestigationState): Promise<InvestigationUpdate> {
  const brief = await getBrief(state.briefId);
  const plan = brief.investigation_plan ?? (await generateInvestigationPlan(state.briefId));
  return { investigationPlan: plan as Record<string, unknown>, objective: brief.objective };
}
