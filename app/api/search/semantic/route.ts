export const runtime = "nodejs";

import { z } from "zod";
import { hybridEvidenceSearch } from "@/lib/agents/rag";
import { geminiConfigured } from "@/lib/agents/gemini";

const Body = z.object({
  siteId: z.string().uuid(),
  query: z.string().trim().min(2).max(300),
  phase: z.enum(["before", "during", "after", "monitoring"]).nullable().optional(),
  minTrustScore: z.number().int().min(0).max(100).optional(),
});

/** User-facing semantic search over a site's evidence (pgvector + SQL filters + Cloudinary). */
export async function POST(req: Request) {
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid search" }, { status: 400 });
  if (!geminiConfigured()) return Response.json({ error: "GEMINI_API_KEY is not configured on the server" }, { status: 503 });
  try {
    const hits = await hybridEvidenceSearch({ ...body.data, limit: 20 });
    return Response.json({ hits });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Search failed" }, { status: 500 });
  }
}
