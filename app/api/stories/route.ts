export const runtime = "nodejs";
export const maxDuration = 60;
import { z } from "zod";
import { supabase } from "@/lib/db";
import { cloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { appendLedgerEntry } from "@/lib/ledger";
import { generateStructured } from "@/lib/agents/gemini";

const Cited = z.object({ text: z.string(), evidence_ids: z.array(z.string()) });
const ReportSchema = z.object({
  title: z.string(),
  executive_summary: z.array(Cited),
  sections: z.array(z.object({ heading: z.string(), paragraphs: z.array(Cited) })),
});

export async function POST(req: Request) {
  try {
    const { template, period } = await req.json();
    if (typeof template !== "string" || typeof period !== "string") {
      return new Response("template and period are required", { status: 400 });
    }

    const { data: evidenceItems } = await supabase
      .from("evidence")
      .select("id, org_id, cld_public_id, activity_claimed, phase, trust_score")
      .eq("trust_status", "verified")
      .limit(20);

    if (!evidenceItems || evidenceItems.length === 0) {
      return new Response("Insufficient verified evidence to synthesize report", { status: 400 });
    }

    const report = await generateStructured({
      schema: ReportSchema,
      system:
        "You are an impact auditor synthesizing a CSR impact report. GROUNDING RULE: every paragraph or factual " +
        "statement MUST cite at least one evidence ID from the provided bundle. Never fabricate progress.",
      task: `Template: ${template}\nPeriod: ${period}\nWrite the report from the evidence bundle below.`,
      data: evidenceItems,
    });
    if (!report) return new Response("Failed to synthesize report", { status: 500 });

    // Enforce the grounding rule server-side: drop citations that are not in the bundle and measure coverage.
    const validIds = new Set(evidenceItems.map((e) => e.id));
    const paragraphs = [...report.executive_summary, ...report.sections.flatMap((s) => s.paragraphs)];
    for (const p of paragraphs) p.evidence_ids = p.evidence_ids.filter((id) => validIds.has(id));
    const cited = paragraphs.filter((p) => p.evidence_ids.length > 0).length;
    const coverage = paragraphs.length ? cited / paragraphs.length : 0;

    const storyId = `st_${Date.now()}`;
    const packTag = `pack_${storyId}`;

    let pdfUrl: string | null = null;
    if (isCloudinaryConfigured()) {
      try {
        await cloudinary.uploader.add_tag(
          packTag,
          evidenceItems.map((e) => e.cld_public_id)
        );
        await cloudinary.uploader.multi(packTag, { format: "pdf", async: true });
        pdfUrl = cloudinary.url(`${packTag}.pdf`, { resource_type: "image", secure: true });
      } catch (cldErr) {
        console.warn("Cloudinary PDF generation skipped:", cldErr);
      }
    }

    const orgId = evidenceItems[0].org_id;
    const { error } = await supabase.from("story").insert({
      id: storyId,
      org_id: orgId,
      template,
      period,
      report,
      citation_coverage: coverage,
      status: "draft",
    });
    if (error) throw new Error(`story insert failed: ${error.message}`);

    await appendLedgerEntry({
      subjectType: "story",
      subjectId: storyId,
      event: "synthesized",
      payload: { template, period, citation_coverage: coverage, evidence_count: evidenceItems.length },
      actor: "gemini_report_writer",
      orgId,
    });

    return Response.json({ storyId, report, citationCoverage: coverage, pdfUrl });
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "Story synthesis failed", { status: 500 });
  }
}
