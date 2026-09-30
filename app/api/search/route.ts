export const runtime = "nodejs";
import { z } from "zod";
import { cloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { supabase } from "@/lib/db";
import { buildSafeEvidenceUrl } from "@/lib/url-builder";
import { generateStructured } from "@/lib/agents/gemini";

const ACTIVITIES = [
  "sapling_plantation",
  "check_dam_construction",
  "farm_pond",
  "school_infrastructure",
  "health_camp",
  "other",
] as const;

const SearchPlanSchema = z.object({
  filters: z.array(
    z.object({
      field: z.enum(["activity", "trust_status", "phase", "capture_date", "trust_score"]),
      op: z.enum(["=", ">=", "<="]),
      value: z.string(),
    })
  ),
  explanation: z.string(),
});

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (typeof query !== "string" || !query.trim() || query.length > 300) {
      return new Response("Invalid query", { status: 400 });
    }

    const plan = await generateStructured({
      schema: SearchPlanSchema,
      system:
        "You are the Pramaan Search Planner. Translate the user's request into whitelisted search filters. " +
        "Allowed fields: activity, trust_status, phase, capture_date, trust_score. " +
        `activity values: ${ACTIVITIES.join(", ")}.`,
      task: "Produce search filters for the user's search request below.",
      data: { search: query },
    });
    if (!plan) return new Response("Failed to parse query", { status: 500 });

    // Only whitelisted, validated values are ever interpolated into the Search API expression.
    const clauses: string[] = ["tags=pramaan"];
    for (const f of plan.filters) {
      if (f.field === "activity" && (ACTIVITIES as readonly string[]).includes(f.value)) {
        clauses.push(`metadata.activity=${f.value}`);
      }
      if (f.field === "trust_score" && /^\d{1,3}$/.test(f.value)) {
        clauses.push(`metadata.trust_score${f.op}${f.value}`);
      }
    }
    const expression = clauses.join(" AND ");

    let resources: any[] = [];
    let total = 0;

    if (isCloudinaryConfigured()) {
      try {
        const cldResults = await cloudinary.search.expression(expression).max_results(20).execute();
        resources = cldResults.resources || [];
        total = cldResults.total_count || resources.length;
      } catch {
        try {
          const fallbackCld = await cloudinary.search.expression("tags=pramaan").max_results(20).execute();
          resources = fallbackCld.resources || [];
          total = fallbackCld.total_count || resources.length;
        } catch {
          // Fall through to database search
        }
      }
    }

    // Database fallback if Cloudinary is not configured or returned no resources
    if (resources.length === 0) {
      let q = supabase
        .from("evidence")
        .select("id, cld_public_id, cld_version, trust_score, trust_status, activity_claimed, phase, created_at, consent_status")
        .order("created_at", { ascending: false })
        .limit(20);

      for (const f of plan.filters) {
        if (f.field === "activity") {
          q = q.eq("activity_claimed", f.value);
        } else if (f.field === "trust_status") {
          q = q.eq("trust_status", f.value);
        } else if (f.field === "phase") {
          q = q.eq("phase", f.value);
        } else if (f.field === "trust_score") {
          const num = parseInt(f.value, 10);
          if (!isNaN(num)) {
            if (f.op === ">=") q = q.gte("trust_score", num);
            else if (f.op === "<=") q = q.lte("trust_score", num);
            else q = q.eq("trust_score", num);
          }
        }
      }

      let { data: evRows } = await q;

      if (!evRows || evRows.length === 0) {
        const { data: allRows } = await supabase
          .from("evidence")
          .select("id, cld_public_id, cld_version, trust_score, trust_status, activity_claimed, phase, created_at, consent_status")
          .order("created_at", { ascending: false })
          .limit(20);
        evRows = allRows ?? [];
      }

      resources = (evRows ?? []).map((row) => ({
        public_id: row.cld_public_id,
        secure_url: buildSafeEvidenceUrl(row.cld_public_id, Number(row.cld_version), row.consent_status),
        created_at: row.created_at,
        metadata: {
          activity: row.activity_claimed,
          trust_status: row.trust_status,
          trust_score: row.trust_score,
          phase: row.phase,
        },
        context: {
          custom: {
            activity: row.activity_claimed,
            phase: row.phase,
          },
        },
      }));
      total = resources.length;
    }

    return Response.json({
      plan,
      expression,
      total,
      resources,
    });
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "Search failed", { status: 500 });
  }
}
