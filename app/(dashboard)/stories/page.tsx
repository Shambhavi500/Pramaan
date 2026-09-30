export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { supabase } from "@/lib/db";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { GenerateStory } from "./generate";

interface Cited {
  text: string;
  evidence_ids: string[];
}
interface Report {
  title: string;
  executive_summary: Cited[];
  sections: { heading: string; paragraphs: Cited[] }[];
}

function Paragraph({ p }: { p: Cited }) {
  return (
    <p className="text-[15px] leading-[1.7] text-ink-800">
      {p.text}{" "}
      {p.evidence_ids.map((id) => (
        <span key={id} className="mono-id mx-0.5 inline-block rounded-xs border border-sky-200 bg-sky-50 px-1.5 text-[11px] text-sky-700" title={`Evidence ${id}`}>
          {id}
        </span>
      ))}
    </p>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function StoriesPage() {
  const { data, error } = await supabase
    .from("story")
    .select("id, template, period, report, citation_coverage, status, published_at")
    .order("published_at", { ascending: false, nullsFirst: true })
    .limit(10);

  if (error) return <EmptyState title="Could not load stories">{error.message}</EmptyState>;

  return (
    <div className="pb-8">
      <PageHeader stage="Use · Stories" title="Evidence-backed stories">
        Every statement cites the verified assets behind it. Statements without a valid citation are dropped, not softened.
      </PageHeader>

      <div className="mb-10 max-w-3xl">
        <GenerateStory />
      </div>

      {!data || data.length === 0 ? (
        <EmptyState title="No stories yet">Generate one from the verified evidence above.</EmptyState>
      ) : (
        <div className="mx-auto max-w-[68ch] space-y-10 lg:mx-0">
          {(data as any[]).map((s) => {
            const r = s.report as Report;
            return (
              <article key={s.id} className="surface-2 enter space-y-5 p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="overline">
                    {s.template} · {s.period}
                  </p>
                  <span className="badge badge-neutral">{s.status}</span>
                </div>
                <h2 className="font-display text-3xl leading-[1.2] tracking-[-0.01em]">{r.title}</h2>
                <p className="mono-meta">
                  Citation coverage {Math.round(Number(s.citation_coverage) * 100)}% · <span>{s.id}</span>
                </p>
                <div className="space-y-3 border-t border-cloud-100 pt-4">
                  <h3 className="overline">Executive summary</h3>
                  {r.executive_summary.map((p, i) => (
                    <Paragraph key={i} p={p} />
                  ))}
                </div>
                {r.sections.map((sec) => (
                  <div key={sec.heading} className="space-y-3">
                    <h3 className="text-lg font-semibold">{sec.heading}</h3>
                    {sec.paragraphs.map((p, i) => (
                      <Paragraph key={i} p={p} />
                    ))}
                  </div>
                ))}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
