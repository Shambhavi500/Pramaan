"use client";

import React, { useState } from "react";
import { Loader2, Search } from "lucide-react";

interface Hit {
  evidenceId: string;
  caption: string;
  phase: string;
  trustScore: number;
  similarity: number;
  source: string;
}

/** Natural-language search over one site's evidence (Discovery agent's retrieval, exposed directly). */
export function SemanticSearch({ siteId }: { siteId: string }) {
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/search/semantic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, query, phase: phase || null }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Search failed");
      setHits(j.hits);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="surface-1 space-y-4 p-6" aria-label="Semantic search">
      <form onSubmit={go} className="grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
        <label className="space-y-1">
          <span className="overline">Search this site&apos;s evidence</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="input" maxLength={300} placeholder="water pooling behind the dam wall" disabled={busy} />
        </label>
        <label className="space-y-1">
          <span className="overline">Phase</span>
          <select value={phase} onChange={(e) => setPhase(e.target.value)} className="input" disabled={busy}>
            <option value="">Any</option>
            <option value="before">Before</option>
            <option value="during">During</option>
            <option value="after">After</option>
            <option value="monitoring">Monitoring</option>
          </select>
        </label>
        <button type="submit" disabled={busy || query.trim().length < 2} className="btn-primary">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
          Search
        </button>
      </form>
      {error && <p role="alert" className="rounded-sm border border-flagged-line bg-flagged-bg px-3 py-2 text-[13px] text-flagged-fg">{error}</p>}
      {hits && hits.length === 0 && <p className="text-[14px] text-ink-700">No matching evidence with a trust score of 60 or more.</p>}
      {hits && hits.length > 0 && (
        <ul className="divide-y divide-cloud-200">
          {hits.map((h) => (
            <li key={h.evidenceId} className="space-y-1 py-3">
              <p className="text-[14px] text-ink-800">{h.caption || "No caption"}</p>
              <p className="text-[12px] text-ink-600">
                <span className="mono-id">{h.evidenceId}</span> · {h.phase} · trust {h.trustScore} · match {(h.similarity * 100).toFixed(0)}% · via {h.source}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
