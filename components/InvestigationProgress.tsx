"use client";

import React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

interface Props {
  steps: string[];
  busy?: boolean;
}

/** Displays real-time SSE progress events from LangGraph nodes. */
export function InvestigationProgress({ steps, busy = false }: Props) {
  if (steps.length === 0 && !busy) return null;

  return (
    <ol className="space-y-1 text-[13px] text-ink-700" aria-live="polite">
      {steps.map((s, i) => (
        <li key={i} className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" aria-hidden />
          <span>{s}</span>
        </li>
      ))}
      {busy && (
        <li className="flex items-center gap-2 text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin text-sky-600" aria-hidden />
          <span>Working…</span>
        </li>
      )}
    </ol>
  );
}
