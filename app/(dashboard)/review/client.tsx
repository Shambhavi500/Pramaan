"use client";

import React, { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Check, X, AlertTriangle } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TrustScore } from "@/components/ui/TrustScore";
import { EvidenceMedia } from "@/components/ui/EvidenceMedia";
import { MetadataRow } from "@/components/ui/MetadataRow";
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
      className={`flex items-center gap-2 rounded-sm border px-3 py-2 text-[13px] ${
        notice.tone === "ok"
          ? "border-verified-line bg-verified-bg text-verified-fg"
          : notice.tone === "warn"
            ? "border-review-line bg-review-bg text-review-fg"
            : "border-flagged-line bg-flagged-bg text-flagged-fg"
      }`}
    >
      {notice.text}
    </p>
  );

  if (!item) {
    return (
      <div className="space-y-4">
        <EmptyState title="Review queue cleared">No flagged or needs-review evidence is waiting.</EmptyState>
        <div className="mx-auto max-w-md">{noticeEl}</div>
      </div>
    );
  }

  const hard = item.status === "flagged";

  return (
    <div>
      <PageHeader stage="Understand · Review" title="Review queue" aside={<StatusBadge status={item.status} />}>
        {queue.length} item{queue.length === 1 ? "" : "s"} waiting, worst first. Press <kbd className="mono-id rounded-xs border border-border-strong bg-white px-1.5">V</kbd> to verify or{" "}
        <kbd className="mono-id rounded-xs border border-border-strong bg-white px-1.5">R</kbd> to reject. Every decision is written to the audit ledger.
      </PageHeader>

      {noticeEl && <div className="mb-4">{noticeEl}</div>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="surface-3 overflow-hidden">
          <div className={`h-[3px] ${hard ? "stripe-flagged" : "stripe-review"}`} aria-hidden />
          <div className="h-[min(60vh,560px)] bg-cloud-100">
            <EvidenceMedia key={item.id} src={item.imageUrl} alt={`Evidence ${item.id} under review`} />
          </div>
        </div>

        <div className="space-y-5">
          <div className="surface-1 space-y-4 p-5">
            <p className="overline">Trust assessment</p>
            <TrustScore score={item.score} status={item.status} variant="instrument" />
            <dl className="border-t border-cloud-100 pt-3">
              <MetadataRow label="Evidence" mono>
                {item.id}
              </MetadataRow>
              <MetadataRow label="Claimed">{item.activity.replace(/_/g, " ")}</MetadataRow>
              <MetadataRow label="Phase">{item.phase}</MetadataRow>
              <MetadataRow label="Geofence">{item.geoStatus ? item.geoStatus.replace(/_/g, " ") : "unknown"}</MetadataRow>
              {item.caption && <MetadataRow label="AI caption">{item.caption}</MetadataRow>}
            </dl>
          </div>

          <div className="space-y-2">
            <p className="overline">Why it was routed here</p>
            {item.reasons.map((r) => (
              <div key={r} className="flex items-start gap-2 rounded-md border border-review-line bg-review-bg p-3 text-[13px] text-ink-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-review-fg" aria-hidden />
                <span>{r}</span>
              </div>
            ))}
          </div>

          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            aria-label="Reason for the decision"
            placeholder="Reason for the decision (optional, kept in the audit ledger)"
            className="input"
          />

          <div className="grid grid-cols-2 gap-3">
            <button disabled={pending} onClick={() => decide("rejected")} className="btn-flag py-3">
              <X className="h-5 w-5" aria-hidden /> Reject (R)
            </button>
            <button disabled={pending} onClick={() => decide("verified")} className="btn-primary py-3">
              <Check className="h-5 w-5" aria-hidden /> Verify (V)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
