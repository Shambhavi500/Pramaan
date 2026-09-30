import { supabase } from "@/lib/db";
import { getLatestBrief, shortId } from "./db";

export const AUTO_TRIGGER_THRESHOLD = Number(process.env.AGENT_AUTO_TRIGGER_THRESHOLD ?? 10);

/**
 * Called after a webhook ingest. When enough new evidence has landed for a site since its last
 * investigation, records a 'queued' investigation. It is not run inline: the webhook must answer
 * Cloudinary quickly, so the queued run is started from the site's Investigate page.
 */
export async function maybeQueueInvestigation(siteId: string): Promise<string | null> {
  const brief = await getLatestBrief(siteId);
  if (!brief) return null;

  const { data: last } = await supabase
    .from("investigation")
    .select("id, status, created_at")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (last && ["queued", "running", "waiting_human"].includes(last.status)) return null;

  let q = supabase.from("evidence").select("id", { count: "exact", head: true }).eq("site_id", siteId);
  if (last) q = q.gt("created_at", last.created_at);
  const { count } = await q;
  if ((count ?? 0) < AUTO_TRIGGER_THRESHOLD) return null;

  const id = shortId("inv");
  const { error } = await supabase.from("investigation").insert({ id, site_id: siteId, brief_id: brief.id, status: "queued", triggered_by: "upload" });
  if (error) {
    console.error("queue investigation failed:", error.message);
    return null;
  }
  return id;
}
