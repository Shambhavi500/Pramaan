export const runtime = "nodejs";
export const maxDuration = 60;

import { after } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/db";
import { generateInvestigationPlan } from "@/lib/agents/plan";
import { geminiConfigured } from "@/lib/agents/gemini";

const CLAIMS = ["construction_complete", "location_authenticity", "before_after_change", "environmental_change", "community_participation"] as const;
const EVIDENCE_TYPES = ["photos", "videos", "field_reports", "gps_tracks"] as const;

const BriefSchema = z.object({
  siteId: z.string().uuid(),
  objective: z.string().trim().min(5).max(500),
  activityType: z.string().trim().min(1).max(60),
  periodStart: z.string().date().nullable().optional(),
  periodEnd: z.string().date().nullable().optional(),
  claimsToEstablish: z.array(z.union([z.enum(CLAIMS), z.string().trim().min(1).max(120)])).max(12).default([]),
  evidenceTypes: z.array(z.enum(EVIDENCE_TYPES)).max(8).default([]),
});

/** Saves the activity brief, then generates the investigation plan in the background. */
export async function POST(req: Request) {
  const parsed = BriefSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid brief", issues: parsed.error.issues }, { status: 400 });
  const b = parsed.data;

  const { data: site } = await supabase.from("site").select("id").eq("id", b.siteId).maybeSingle();
  if (!site) return Response.json({ error: "Site not found" }, { status: 404 });

  const { data: brief, error } = await supabase
    .from("activity_brief")
    .insert({
      site_id: b.siteId,
      objective: b.objective,
      activity_type: b.activityType,
      period_start: b.periodStart ?? null,
      period_end: b.periodEnd ?? null,
      claims_to_establish: b.claimsToEstablish,
      evidence_types: b.evidenceTypes,
    })
    .select("id")
    .single();
  if (error || !brief) return Response.json({ error: error?.message ?? "Could not save brief" }, { status: 500 });

  // Runs after the response is sent. If it fails, the plan is generated lazily when the investigation starts.
  if (geminiConfigured()) {
    after(() => generateInvestigationPlan(brief.id).catch((e) => console.error("plan generation failed:", e)));
  }

  return Response.json({ briefId: brief.id, planGenerating: geminiConfigured() });
}
