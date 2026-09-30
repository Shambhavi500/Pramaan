export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { supabase } from "@/lib/db";

export async function GET(_req: Request, ctx: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await ctx.params;
  if (!/^[\w-]{3,64}$/.test(reportId)) return Response.json({ error: "Invalid report id" }, { status: 400 });
  const { data, error } = await supabase
    .from("story")
    .select("id, template, period, report, citation_coverage, status, published_at")
    .eq("id", reportId)
    .maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data) return Response.json({ error: "Report not found" }, { status: 404 });
  return Response.json(data);
}
