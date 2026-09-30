import { StateGraph, START, END } from "@langchain/langgraph";
import { supabase } from "@/lib/db";
import { InvestigationStateAnnotation, type InvestigationState } from "./state";
import { understandObjective } from "./plan";
import { organizeAgent } from "./organize";
import { analyzeAgent } from "./analyze";
import { identifyAgent } from "./identify";
import { compareAgent } from "./compare";
import { discoverAgent } from "./discover";
import { synthesizeEvidence } from "./synthesize";
import { reportAgent } from "./report";
import { getBrief, getLatestBrief, shortId } from "./db";
import { recordAgentAction } from "./provenance";
import { getSiteInfo } from "./db";
import { errMsg } from "./util";

export const MAX_LOOPS = 3;

const hasUndecidedHitl = (s: InvestigationState) => s.hitlRequests.some((r) => !s.hitlDecisions[r.evidenceId]);

/** Persist held evidence so a reviewer can decide; the graph then ends and is resumed once decisions exist. */
async function hitlCheckpointNode(state: InvestigationState) {
  const pending = state.hitlRequests.filter((r) => !state.hitlDecisions[r.evidenceId]);
  if (pending.length) {
    await supabase.from("hitl_checkpoint").upsert(
      pending.map((r) => ({ investigation_id: state.investigationId, evidence_id: r.evidenceId, reason: r.reason, agent: r.agent, options: r.options })),
      { onConflict: "investigation_id,evidence_id", ignoreDuplicates: true }
    );
  }
  return {};
}

function routeAfterOrganize(s: InvestigationState) {
  return hasUndecidedHitl(s) ? "hitl" : "continue";
}

function routeAfterSynthesis(s: InvestigationState) {
  if (s.loopCount >= MAX_LOOPS) return "max_loops";
  if (s.lastDiscoveryAdded === 0) return "sufficient"; // last search found nothing new: looping again cannot help
  if (s.evidenceGaps.some((g) => g.severity === "critical")) return "loop";
  return "sufficient";
}

/**
 * Pipeline: understand → organize → (human review?) → analyze → identify → compare → synthesize →
 * (gaps? discover → analyze … up to MAX_LOOPS) → report.
 * Discovery sits on the loop edge rather than the main chain: it only has work once synthesis has named a gap.
 */
export const pramaanGraph = new StateGraph(InvestigationStateAnnotation)
  .addNode("understand_objective", understandObjective)
  .addNode("organize_evidence", organizeAgent)
  .addNode("hitl_checkpoint", hitlCheckpointNode)
  .addNode("analyze_evidence", analyzeAgent)
  .addNode("identify_context", identifyAgent)
  .addNode("compare_before_after", compareAgent)
  .addNode("synthesize", synthesizeEvidence)
  .addNode("discover_evidence", discoverAgent)
  .addNode("generate_report", reportAgent)
  .addEdge(START, "understand_objective")
  .addEdge("understand_objective", "organize_evidence")
  .addConditionalEdges("organize_evidence", routeAfterOrganize, { hitl: "hitl_checkpoint", continue: "analyze_evidence" })
  .addEdge("hitl_checkpoint", END)
  .addEdge("analyze_evidence", "identify_context")
  .addEdge("identify_context", "compare_before_after")
  .addEdge("compare_before_after", "synthesize")
  .addConditionalEdges("synthesize", routeAfterSynthesis, {
    loop: "discover_evidence",
    sufficient: "generate_report",
    max_loops: "generate_report",
  })
  .addEdge("discover_evidence", "analyze_evidence")
  .addEdge("generate_report", END)
  .compile();

export type InvestigationEvent =
  | { type: "started"; investigationId: string }
  | { type: "progress"; node: string; summary: string }
  | { type: "waiting_human"; investigationId: string; pending: number }
  | { type: "complete"; investigationId: string; reportId: string }
  | { type: "error"; message: string };

const NODE_LABEL: Record<string, string> = {
  understand_objective: "Planned the investigation from the activity brief",
  organize_evidence: "Organised and phase-tagged the evidence",
  hitl_checkpoint: "Paused: evidence needs human review",
  analyze_evidence: "Analysed evidence against the objective",
  identify_context: "Verified site, phase and activity for each item",
  compare_before_after: "Compared before/after evidence",
  synthesize: "Drafted claims, timeline and evidence gaps",
  discover_evidence: "Searched for evidence to fill gaps",
  generate_report: "Generated the impact report",
};

function summarise(node: string, update: Record<string, unknown>): string {
  const n = (k: string) => (Array.isArray(update[k]) ? (update[k] as unknown[]).length : 0);
  switch (node) {
    case "organize_evidence": return `${n("organizedEvidence")} organised, ${n("excludedIds")} held back, ${n("hitlRequests")} need review`;
    case "analyze_evidence": return `${Object.keys((update.analyzedEvidence as object) ?? {}).length} items analysed`;
    case "identify_context": return `${Object.keys((update.identifiedContext as object) ?? {}).length} items verified`;
    case "compare_before_after": return `${n("beforeAfterPairs")} pair(s) compared`;
    case "synthesize": return `${n("claims")} claims, ${n("evidenceGaps")} gaps`;
    case "discover_evidence": return `${n("discoveredEvidence")} item(s) retrieved (loop ${update.loopCount ?? "?"}/${MAX_LOOPS})`;
    default: return "";
  }
}

/** Create the investigation row, or return an existing queued/waiting one to resume. */
export async function prepareInvestigation(siteId: string, opts: { resumeId?: string; triggeredBy?: "user" | "upload" | "schedule" } = {}) {
  const brief = await getLatestBrief(siteId);
  if (!brief) throw new Error("This activity has no brief yet. Create the activity brief first.");

  if (opts.resumeId) {
    const { data } = await supabase.from("investigation").select("id, status, site_id").eq("id", opts.resumeId).maybeSingle();
    if (!data || data.site_id !== siteId) throw new Error("Investigation not found for this site");
    if (data.status === "running") throw new Error("Investigation is already running");
    if (data.status === "complete") throw new Error("Investigation is already complete");
    if (data.status === "waiting_human") {
      const { count } = await supabase.from("hitl_checkpoint").select("id", { count: "exact", head: true }).eq("investigation_id", data.id).is("decision", null);
      if (count) throw new Error(`${count} evidence item(s) still need a review decision`);
    }
    return { investigationId: data.id, briefId: brief.id };
  }

  const investigationId = shortId("inv");
  const { error } = await supabase.from("investigation").insert({ id: investigationId, site_id: siteId, brief_id: brief.id, status: "running", triggered_by: opts.triggeredBy ?? "user" });
  if (error) throw new Error(`Could not start investigation: ${error.message}`);
  return { investigationId, briefId: brief.id };
}

/** Runs (or resumes) an investigation, persisting progress and yielding events for SSE. */
export async function* runInvestigation(siteId: string, investigationId: string, briefId: string): AsyncGenerator<InvestigationEvent> {
  const site = await getSiteInfo(siteId);
  const brief = await getBrief(briefId);
  const progress: Array<{ node: string; label: string; summary: string; at: string }> = [];
  const snapshot: Record<string, unknown> = {};
  let reportId: string | null = null;
  let paused = false;
  let finished = false;

  const save = (patch: Record<string, unknown>) =>
    supabase.from("investigation").update({ ...patch, langgraph_state: snapshot, progress, updated_at: new Date().toISOString() }).eq("id", investigationId);

  await save({ status: "running", brief_id: briefId, error: null });
  yield { type: "started", investigationId };

  try {
    const stream = await pramaanGraph.stream(
      { siteId, briefId, objective: brief.objective, investigationId },
      { streamMode: "updates", recursionLimit: 60 }
    );
    for await (const chunk of stream) {
      for (const [node, update] of Object.entries(chunk as Record<string, Record<string, unknown> | undefined>)) {
        const u = update ?? {};
        for (const k of ["loopCount", "evidenceGaps", "claims", "beforeAfterPairs", "timeline"]) if (k in u) snapshot[k] = u[k];
        if (node === "hitl_checkpoint") paused = true;
        if (node === "generate_report") reportId = (u.reportId as string) ?? null;
        const entry = { node, label: NODE_LABEL[node] ?? node, summary: summarise(node, u), at: new Date().toISOString() };
        progress.push(entry);
        await save({});
        yield { type: "progress", node, summary: `${entry.label}${entry.summary ? ` — ${entry.summary}` : ""}` };
      }
    }

    if (paused) {
      const { count } = await supabase.from("hitl_checkpoint").select("id", { count: "exact", head: true }).eq("investigation_id", investigationId).is("decision", null);
      await save({ status: "waiting_human" });
      finished = true;
      yield { type: "waiting_human", investigationId, pending: count ?? 0 };
      return;
    }
    if (!reportId) throw new Error("Investigation finished without producing a report");
    await save({ status: "complete", report_id: reportId });
    await recordAgentAction({ orgId: site.orgId, subjectType: "investigation", subjectId: investigationId, event: "investigation_completed", agent: "orchestrator", payload: { report_id: reportId, loops: snapshot.loopCount ?? 0 } });
    finished = true;
    yield { type: "complete", investigationId, reportId };
  } catch (err) {
    const message = errMsg(err);
    finished = true;
    await save({ status: "error", error: message });
    yield { type: "error", message };
  } finally {
    // Client disconnected mid-run: don't leave the row stuck in 'running'.
    if (!finished) await save({ status: "error", error: "Interrupted: the connection closed before the investigation finished. Run it again." });
  }
}

export function eventsToSse(events: AsyncGenerator<InvestigationEvent>): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await events.next();
      if (done) return controller.close();
      controller.enqueue(enc.encode(`data: ${JSON.stringify(value)}\n\n`));
    },
    async cancel() {
      await events.return(undefined);
    },
  });
}
