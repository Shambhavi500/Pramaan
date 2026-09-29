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
      className={`text-xs ${notice.tone === "ok" ? "text-emerald-700" : notice.tone === "warn" ? "text-amber-700" : "text-red-700"}`}
    >
      {notice.text}
    </p>
  );

  if (!item) {
    return (
      <div className="p-16 text-center max-w-md mx-auto space-y-3">
        <h2 className="text-xl font-bold">Review Queue Cleared</h2>
        <p className="text-sm text-muted-foreground">No flagged or needs-review evidence is waiting.</p>
        {noticeEl}
      </div>
    );
  }

  const hard = item.status === "flagged";

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Evidence Moderation Queue</h1>
          <p className="text-sm text-muted-foreground">{queue.length} items requiring review</p>
        </div>
        <span
          className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1 ${hard ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}
        >
          <ShieldAlert className="h-3.5 w-3.5" /> {hard ? "FLAGGED" : "NEEDS REVIEW"}
        </span>
      </div>

      {noticeEl}

      <div className="border rounded-2xl overflow-hidden bg-white shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.imageUrl} alt="Review item" className="w-full h-80 object-cover" />
        <div className="p-5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-muted-foreground">{item.id}</span>
            <span className={`text-lg font-bold ${hard ? "text-red-600" : "text-amber-600"}`}>
              Trust: {item.score} / 100
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Claimed: {item.activity.replace(/_/g, " ")} · Phase: {item.phase} · Geo: {item.geoStatus ?? "unknown"}
          </p>
          {item.caption && <p className="text-xs italic text-neutral-600">AI: {item.caption}</p>}
          {item.reasons.map((r) => (
            <div
              key={r}
              className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 flex items-start gap-2"
            >
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <span>{r}</span>
            </div>
          ))}
        </div>
      </div>

      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={500}
        placeholder="Reason for the decision (optional, kept in the audit ledger)"
        className="w-full border rounded-xl bg-white px-3 py-2 text-sm"
      />

      <div className="grid grid-cols-2 gap-4">
        <button
          disabled={pending}
          onClick={() => decide("rejected")}
          className="py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
        >
          <X className="h-5 w-5" /> Reject (R)
        </button>
        <button
          disabled={pending}
          onClick={() => decide("verified")}
          className="py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
        >
          <Check className="h-5 w-5" /> Override & Verify (V)
        </button>
      </div>
    </div>
  );
}
