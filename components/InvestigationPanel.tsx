"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { InvestigationProgress } from "./InvestigationProgress";
import { HitlPanel, type PendingReviewItem } from "./HitlPanel";

export type PendingReview = PendingReviewItem;

interface Props {
  siteId: string;
  status: string | null; // latest investigation status
  investigationId: string | null;
  reportId: string | null;
  error: string | null;
  pending: PendingReview[];
}

type Ev =
  | { type: "started"; investigationId: string }
  | { type: "progress"; node: string; summary: string }
  | { type: "waiting_human"; pending: number }
  | { type: "complete"; reportId: string }
  | { type: "error"; message: string };

/** Generate Report button with live SSE progress, plus the human-review queue for held evidence. */
export function InvestigationPanel({ siteId, status, investigationId, reportId, error: initialError, pending }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(initialError);
  const [doneReport, setDoneReport] = useState<string | null>(null);
  const [deciding, setDeciding] = useState<number | null>(null);

  const resumable = investigationId && (status === "queued" || status === "waiting_human");
  const canResume = resumable && !(status === "waiting_human" && pending.length > 0);

  async function run() {
    if (busy) return;
    setBusy(true);
    setSteps([]);
    setError(null);
    try {
      const r = await fetch(`/api/activities/${siteId}/investigate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(canResume ? { investigationId } : {}),
      });
      if (!r.ok || !r.body) throw new Error((await r.json().catch(() => null))?.error ?? "Could not start the investigation");

      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const frames = buf.split("\n\n");
        buf = frames.pop() ?? "";
        for (const f of frames) {
          if (!f.startsWith("data: ")) continue;
          const ev = JSON.parse(f.slice(6)) as Ev;
          if (ev.type === "progress") setSteps((s) => [...s, ev.summary]);
          else if (ev.type === "error") setError(ev.message);
          else if (ev.type === "complete") setDoneReport(ev.reportId);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Investigation failed");
    } finally {
      setBusy(false);
      router.refresh();
    }
  }

  async function decide(p: PendingReview, decision: "include" | "exclude") {
    setDeciding(p.id);
    setError(null);
    try {
      const r = await fetch(`/api/activities/${siteId}/hitl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkpointId: p.id, decision }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? "Could not record the decision");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record the decision");
    } finally {
      setDeciding(null);
    }
  }

  const finishedReport = doneReport ?? (status === "complete" ? reportId : null);
  const label = canResume ? (status === "queued" ? "Run queued investigation" : "Resume investigation") : "Generate report";

  return (
    <section className="surface-1 space-y-4 p-6" aria-label="Investigation">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="overline">Agent investigation</p>
          <p className="text-[14px] text-ink-700">
            {status === "queued" && "New evidence arrived: an investigation is queued."}
            {status === "waiting_human" && "Paused: some evidence needs a human decision before it can be used."}
            {status === "running" && !busy && "A run is marked as running. If it stalled, start a new one."}
            {(!status || status === "complete" || status === "error") && "Six agents organise, analyse, verify, compare and report on this site's evidence."}
          </p>
        </div>
        <button onClick={run} disabled={busy || (status === "waiting_human" && pending.length > 0)} className="btn-primary">
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {busy ? "Investigating" : label}
        </button>
      </div>

      <InvestigationProgress steps={steps} busy={busy} />

      {error && (
        <p role="alert" className="rounded-sm border border-flagged-line bg-flagged-bg px-3 py-2 text-[13px] text-flagged-fg">{error}</p>
      )}

      {finishedReport && !busy && (
        <p className="text-[14px]">
          Report ready:{" "}
          <Link href={`/investigate/report/${finishedReport}`} className="font-semibold text-sky-700 underline">
            open the impact report
          </Link>
        </p>
      )}

      <HitlPanel pending={pending} onDecide={decide} decidingId={deciding} />
    </section>
  );
}
