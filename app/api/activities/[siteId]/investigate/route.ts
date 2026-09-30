export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

import { z } from "zod";
import { supabase } from "@/lib/db";
import { eventsToSse, prepareInvestigation, runInvestigation } from "@/lib/agents/graph";
import { geminiConfigured } from "@/lib/agents/gemini";

const Params = z.object({ siteId: z.string().uuid() });
const Body = z.object({ investigationId: z.string().regex(/^inv_[0-9a-f]+$/).optional() });

/** Starts (or resumes) an investigation and streams progress as Server-Sent Events. */
export async function POST(req: Request, ctx: { params: Promise<{ siteId: string }> }) {
  const p = Params.safeParse(await ctx.params);
  if (!p.success) return Response.json({ error: "Invalid site id" }, { status: 400 });
  const body = Body.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return Response.json({ error: "Invalid body" }, { status: 400 });
  if (!geminiConfigured()) return Response.json({ error: "GEMINI_API_KEY is not configured on the server" }, { status: 503 });

  let prepared;
  try {
    prepared = await prepareInvestigation(p.data.siteId, { resumeId: body.data.investigationId });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Could not start" }, { status: 409 });
  }

  return new Response(eventsToSse(runInvestigation(p.data.siteId, prepared.investigationId, prepared.briefId)), {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
  });
}

/** Latest investigation for the site, with any evidence waiting on a human decision. */
export async function GET(_req: Request, ctx: { params: Promise<{ siteId: string }> }) {
  const p = Params.safeParse(await ctx.params);
  if (!p.success) return Response.json({ error: "Invalid site id" }, { status: 400 });

  const { data: inv } = await supabase
    .from("investigation")
    .select("id, status, progress, error, report_id, triggered_by, created_at, updated_at")
    .eq("site_id", p.data.siteId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!inv) return Response.json({ investigation: null, pending: [] });

  const { data: pending } = await supabase
    .from("hitl_checkpoint")
    .select("id, evidence_id, reason, agent, options")
    .eq("investigation_id", inv.id)
    .is("decision", null);
  return Response.json({ investigation: inv, pending: pending ?? [] });
}
