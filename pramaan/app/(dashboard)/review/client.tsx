"use client";

import React, { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Check, X, AlertTriangle, ShieldAlert } from "lucide-react";
import { submitReviewDecision, type ReviewDecision } from "./actions";

export interface ReviewItem {
  id: string;
  score: number;
  status: string;
  reasons: string[];
  caption: string | null;
  activity: string;
  phase: string;
  geoStatus: string | null;
  imageUrl: string;
}

export default function ReviewClient({ initialItems }: { initialItems: ReviewItem[] }) {
  const [queue, setQueue] = useState(initialItems);
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState<{ tone: "ok" | "warn" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const busy = useRef(false);

  const item = queue[0];

  const decide = useCallback(
    (decision: ReviewDecision) => {
      if (!item || busy.current) return;
      busy.current = true;
      const current = item;
      startTransition(async () => {
        try {
          const res = await submitReviewDecision(current.id, decision, reason);
          if (!res.ok) {
            setNotice({ tone: "error", text: res.error ?? "Decision failed" });
            return;
          }
          setQueue((prev) => prev.filter((i) => i.id !== current.id));
          setReason("");
          setNotice(
            res.cloudinaryWarning
              ? { tone: "warn", text: `${current.id} ${decision}. ${res.cloudinaryWarning}` }
              : { tone: "ok", text: `${current.id} marked ${decision.toUpperCase()}; Cloudinary moderation updated.` }
          );
        } catch (e) {
          setNotice({ tone: "error", text: e instanceof Error ? e.message : "Decision failed" });
        } finally {
          busy.current = false;
        }
      });
    },
    [item, reason]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      const k = e.key.toLowerCase();
      if (k === "v") decide("verified");
      if (k === "r") decide("rejected");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide]);

  const noticeEl = notice && (
    <p
      role="status"
      className={`text-xs ${notice.tone === "ok" ? "text-good" : notice.tone === "warn" ? "text-warn" : "text-bad"}`}
    >
      {notice.text}
    </p>
  );

  if (!item) {
    return (
      <div className="mx-auto max-w-md space-y-3 py-16 text-center">
        <h2 className="text-3xl font-light">Review queue cleared</h2>
        <p className="text-sm text-soft">No flagged or needs-review evidence is waiting.</p>
        {noticeEl}
      </div>
    );
  }

  const hard = item.status === "flagged";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <span className="chip-lime">Moderation</span>
          <h1 className="text-4xl font-light tracking-tight">Review queue</h1>
          <p className="text-sm text-soft">{queue.length} items waiting · V verifies, R rejects</p>
        </div>
        <span className={`chip flex items-center gap-1 ${hard ? "bg-bad text-lime-ink" : "bg-warn text-lime-ink"}`}>
          <ShieldAlert className="h-3.5 w-3.5" aria-hidden /> {hard ? "Flagged" : "Needs review"}
        </span>
      </div>

      {noticeEl}

      <div className="panel overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.imageUrl} alt="Evidence under review" className="h-80 w-full object-cover" />
        <div className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted">{item.id}</span>
            <span className={`text-2xl font-light ${hard ? "text-bad" : "text-warn"}`}>Trust {item.score} / 100</span>
          </div>
          <p className="text-xs text-soft">
            Claimed: {item.activity.replace(/_/g, " ")} · Phase: {item.phase} · Geo: {item.geoStatus ?? "unknown"}
          </p>
          {item.caption && <p className="text-xs italic text-white/70">AI: {item.caption}</p>}
          {item.reasons.map((r) => (
            <div key={r} className="flex items-start gap-2 rounded-lg border border-bad/40 bg-bad/10 p-3 text-xs text-white/90">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-bad" aria-hidden />
              <span>{r}</span>
            </div>
          ))}
        </div>
      </div>

      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={500}
        aria-label="Reason for the decision"
        placeholder="Reason for the decision (optional, kept in the audit ledger)"
        className="field"
      />

      <div className="grid grid-cols-2 gap-4">
        <button disabled={pending} onClick={() => decide("rejected")} className="btn-danger py-3">
          <X className="h-5 w-5" aria-hidden /> Reject (R)
        </button>
        <button disabled={pending} onClick={() => decide("verified")} className="btn-lime py-3">
          <Check className="h-5 w-5" aria-hidden /> Verify (V)
        </button>
      </div>
    </div>
  );
}
