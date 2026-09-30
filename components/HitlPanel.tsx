"use client";

import React from "react";
import { PauseCircle } from "lucide-react";

export interface PendingReviewItem {
  id: number;
  evidenceId: string;
  reason: string;
  thumbUrl: string | null;
}

interface Props {
  pending: PendingReviewItem[];
  onDecide: (item: PendingReviewItem, decision: "include" | "exclude") => Promise<void> | void;
  decidingId?: number | null;
}

/** Human-in-the-Loop review panel for evidence flagged during an investigation. */
export function HitlPanel({ pending, onDecide, decidingId }: Props) {
  if (pending.length === 0) return null;

  return (
    <div className="space-y-3 border-t border-cloud-200 pt-4" aria-label="Human-in-the-loop checkpoints">
      <h3 className="flex items-center gap-2 font-display text-xl text-ink-900">
        <PauseCircle className="h-5 w-5 text-amber-600" aria-hidden /> Needs your review ({pending.length})
      </h3>
      <p className="text-[13px] text-ink-600">
        The agents detected potential integrity anomalies (e.g., perceptual hash reuse, out-of-geofence capture, or suspicious cues). Flagged evidence is excluded from reports unless explicitly approved.
      </p>
      <ul className="space-y-3">
        {pending.map((p) => (
          <li key={p.id} className="flex flex-wrap items-start gap-4 rounded-sm border border-cloud-200 bg-surface-0 p-3">
            {p.thumbUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.thumbUrl}
                alt={`Evidence ${p.evidenceId}`}
                width={120}
                height={120}
                className="h-[120px] w-[120px] rounded-sm object-cover border border-cloud-200"
              />
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <p className="mono-id text-[12px]">{p.evidenceId}</p>
              <p className="text-[14px] text-ink-800">{p.reason}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-outline"
                  disabled={decidingId === p.id}
                  onClick={() => onDecide(p, "exclude")}
                >
                  Exclude
                </button>
                <button
                  type="button"
                  className="btn-outline text-sky-700 hover:text-sky-800"
                  disabled={decidingId === p.id}
                  onClick={() => onDecide(p, "include")}
                >
                  Include in report
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
