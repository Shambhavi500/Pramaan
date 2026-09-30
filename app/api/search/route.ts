export const runtime = "nodejs";
import { z } from "zod";
import { cloudinary } from "@/lib/cloudinary";
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

    let cldResults;
    try {
      cldResults = await cloudinary.search.expression(expression).max_results(20).execute();
    } catch {
      cldResults = await cloudinary.search.expression("tags=pramaan").max_results(20).execute();
    }

    return Response.json({
      plan,
      expression,
      total: cldResults.total_count,
      resources: cldResults.resources,
    });
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "Search failed", { status: 500 });
  }
}
