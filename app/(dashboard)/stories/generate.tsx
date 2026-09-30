"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const TEMPLATES = ["CSR quarterly impact report", "Donor update", "Government progress report"];

/** Synthesizes a grounded story through the existing /api/stories route, then refreshes the list. */
export function GenerateStory() {
  const router = useRouter();
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [period, setPeriod] = useState("Q2 2026");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/stories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ template, period }) });
      if (!r.ok) throw new Error(await r.text());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Story synthesis failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={go} className="surface-1 space-y-3 p-4" aria-label="Generate a story">
      <div className="grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
        <label className="space-y-1">
          <span className="overline">Template</span>
          <select value={template} onChange={(e) => setTemplate(e.target.value)} className="input" disabled={busy}>
            {TEMPLATES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="overline">Period</span>
          <input value={period} onChange={(e) => setPeriod(e.target.value)} className="input" maxLength={40} disabled={busy} />
        </label>
        <button type="submit" disabled={busy || !period.trim()} className="btn-primary">
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {busy ? "Synthesizing" : "Generate story"}
        </button>
      </div>
      {error && (
        <p role="alert" className="rounded-sm border border-flagged-line bg-flagged-bg px-3 py-2 text-[13px] text-flagged-fg">
          {error}
        </p>
      )}
    </form>
  );
}
