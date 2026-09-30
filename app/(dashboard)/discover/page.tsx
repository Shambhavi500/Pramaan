"use client";

import React, { useState } from "react";
import { Search, Loader2, Check, Minus } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { EvidenceCard } from "@/components/ui/EvidenceCard";

interface Filter {
  field: string;
  op: string;
  value: string;
}
interface Resource {
  public_id: string;
  secure_url: string;
  created_at?: string;
  metadata?: Record<string, string | number | undefined>;
  context?: { custom?: Record<string, string> };
}
interface SearchResponse {
  plan: { filters: Filter[]; explanation: string };
  expression: string;
  total: number;
  resources: Resource[];
}

const FIELD_LABEL: Record<string, string> = {
  activity: "Activity",
  trust_status: "Trust status",
  phase: "Phase",
  capture_date: "Period",
  trust_score: "Trust",
};
const EXAMPLES = ["Verified check dam evidence at JH-04", "Sapling plantation photos with trust score above 80", "Everything flagged this month"];

const pretty = (f: Filter) => {
  const v = f.value.replace(/_/g, " ");
  return f.field === "trust_score" ? `${f.op === "=" ? "" : f.op + " "}${v}` : v;
};

/** Does this result visibly satisfy the filter? Returns exact match, unknown (inferred) or miss. */
function check(r: Resource, f: Filter): "exact" | "inferred" | "miss" {
  const m = r.metadata ?? {};
  const raw = m[f.field];
  if (raw === undefined || raw === null || raw === "") return "inferred";
  if (f.field === "trust_score") {
    const a = Number(raw);
    const b = Number(f.value);
    return f.op === ">=" ? (a >= b ? "exact" : "miss") : f.op === "<=" ? (a <= b ? "exact" : "miss") : a === b ? "exact" : "miss";
  }
  return String(raw) === f.value ? "exact" : "miss";
}

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<SearchResponse | null>(null);

  async function run(q: string) {
    const text = q.trim();
    if (!text || busy) return;
    setQuery(text);
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: text }) });
      if (!r.ok) throw new Error(await r.text());
      setRes((await r.json()) as SearchResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setRes(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pb-8">
      <PageHeader stage="Use · Discover" title="Ask the evidence">
        Search in plain language. Pramaan shows exactly how it read your question, then why each result matched.
      </PageHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(query);
        }}
        className="glass mx-auto flex max-w-3xl items-center gap-3 rounded-xl p-2 pl-4 focus-within:outline focus-within:outline-2 focus-within:outline-focus"
        role="search"
      >
        <Search className="h-5 w-5 shrink-0 text-ink-600" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={300}
          aria-label="Search evidence in natural language"
          placeholder="Show verified evidence of the restored check dam near JH-04"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-ink-900 outline-none placeholder:text-ink-500"
        />
        <button type="submit" disabled={busy || !query.trim()} className="btn-primary">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Search
        </button>
      </form>

      {!res && !busy && !error && (
        <ul className="mx-auto mt-4 flex max-w-3xl flex-wrap gap-2" aria-label="Example searches">
          {EXAMPLES.map((ex) => (
            <li key={ex}>
              <button onClick={() => run(ex)} className="rounded-full border border-border-strong bg-white px-3.5 py-1.5 text-[13px] text-ink-700 hover:bg-sky-50">
                {ex}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div aria-live="polite" className="mx-auto mt-8 max-w-6xl space-y-8">
        {error && <p className="rounded-sm border border-flagged-line bg-flagged-bg px-3 py-2 text-[13px] text-flagged-fg">{error}</p>}

        {res && (
          <>
            <section className="surface-1 enter p-5" aria-label="Interpreted query">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <p className="overline">Interpreted query</p>
                <p className="mono-meta">{res.expression}</p>
              </div>
              {res.plan.filters.length === 0 ? (
                <p className="text-sm text-ink-700">No specific filters were inferred, so all Pramaan evidence is shown.</p>
              ) : (
                <dl className="grid gap-x-8 sm:grid-cols-2">
                  {res.plan.filters.map((f, i) => (
                    <div key={i} className="grid grid-cols-[6.5rem_1fr] items-center gap-3 py-1.5">
                      <dt className="overline">{FIELD_LABEL[f.field] ?? f.field}</dt>
                      <dd>
                        <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-0.5 text-sm text-sky-700">{pretty(f)}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              <p className="mt-3 border-t border-cloud-100 pt-3 text-[13px] text-ink-700">{res.plan.explanation}</p>
            </section>

            <div>
              <p className="overline mb-4" role="status">
                {res.total} result{res.total === 1 ? "" : "s"}
              </p>
              {res.resources.length === 0 ? (
                <EmptyState title="No verified evidence matches">Try relaxing one criterion above, such as the period or trust threshold.</EmptyState>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {res.resources.map((r) => {
                    const m = r.metadata ?? {};
                    const custom = r.context?.custom ?? {};
                    const activity = String(m.activity ?? custom.activity ?? "evidence").replace(/_/g, " ");
                    return (
                      <EvidenceCard
                        key={r.public_id}
                        id={r.public_id.split("/").pop() ?? r.public_id}
                        imageUrl={r.secure_url.replace("/upload/", "/upload/c_fill,w_640,h_480,g_auto,f_auto,q_auto/")}
                        title={activity}
                        context={String(m.phase ?? custom.phase ?? "")}
                        capturedAt={r.created_at ?? null}
                        score={Number(m.trust_score ?? 0)}
                        status={String(m.trust_status ?? "pending")}
                        footer={
                          <div className="space-y-1.5 border-t border-cloud-100 pt-3">
                            <p className="overline">Why this matched</p>
                            <ul className="flex flex-wrap gap-1.5">
                              {res.plan.filters.map((f, i) => {
                                const c = check(r, f);
                                return (
                                  <li
                                    key={i}
                                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
                                      c === "exact"
                                        ? "border-verified-line bg-verified-bg text-verified-fg"
                                        : c === "inferred"
                                          ? "border-dashed border-sky-300 bg-sky-50 text-sky-700"
                                          : "border-flagged-line bg-flagged-bg text-flagged-fg"
                                    }`}
                                  >
                                    {c === "exact" ? <Check className="h-3 w-3" aria-hidden /> : <Minus className="h-3 w-3" aria-hidden />}
                                    {FIELD_LABEL[f.field] ?? f.field}: {pretty(f)}
                                    <span className="sr-only">{c === "exact" ? " matched exactly" : c === "inferred" ? " inferred" : " not matched"}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        }
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
