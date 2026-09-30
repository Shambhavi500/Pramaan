export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { supabase } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import type { ImpactReport } from "@/lib/agents/report";

const Ids = ({ ids }: { ids: string[] }) => (
  <>
    {ids.map((id) => (
      <span key={id} className="mono-id mx-0.5 inline-block rounded-xs border border-sky-200 bg-sky-50 px-1.5 text-[11px] text-sky-700" title={`Evidence ${id}`}>
        {id}
      </span>
    ))}
  </>
);

const VERDICT: Record<string, string> = { supported: "Supported", partially_supported: "Partially supported", insufficient_evidence: "Insufficient evidence" };

export default async function ReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  if (!/^[\w-]{3,64}$/.test(reportId)) notFound();
  const { data } = await supabase.from("story").select("id, period, report, citation_coverage").eq("id", reportId).maybeSingle();
  const impact = (data?.report as { impact?: ImpactReport } | null)?.impact;
  if (!data || !impact) notFound();

  return (
    <div className="max-w-3xl space-y-8 pb-8">
      <PageHeader stage="Use · Investigate · Report" title={impact.campaignContent.headline}>
        {impact.activitySummary}
      </PageHeader>

      <p className="text-[13px] text-ink-600">
        {impact.period} · {impact.evidenceSummary.verified} verified of {impact.evidenceSummary.total} items · {impact.evidenceSummary.excluded} excluded · citation coverage {(Number(data.citation_coverage) * 100).toFixed(0)}%
      </p>

      <section className="space-y-4">
        <h2 className="font-display text-2xl">Claims</h2>
        {impact.claims.map((c, i) => (
          <article key={i} className="surface-1 space-y-2 p-4">
            <p className="text-[15px] leading-[1.7] text-ink-800">
              {c.statement} <Ids ids={c.citedEvidenceIds} />
            </p>
            <p className="text-[12px] uppercase tracking-wide text-ink-600">
              {VERDICT[c.verdict] ?? c.verdict} · {c.confidence} confidence
            </p>
            {c.limitations && <p className="text-[13px] text-ink-700">Limits: {c.limitations}</p>}
          </article>
        ))}
      </section>

      {impact.beforeAfterPairs.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-2xl">Before and after</h2>
          <p className="text-[15px] leading-[1.7] text-ink-800">{impact.beforeAfterNarrative}</p>
          {impact.beforeAfterPairs.map((p) => (
            <figure key={p.pairId} className="space-y-1">
              {p.compositeUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.compositeUrl} alt={`Before ${p.beforeId} and after ${p.afterId}`} className="w-full rounded-sm" />
              ) : null}
              <figcaption className="text-[12px] text-ink-600">
                <Ids ids={[p.beforeId, p.afterId]} /> · {p.confidence}
              </figcaption>
            </figure>
          ))}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="font-display text-2xl">What cannot be concluded</h2>
        <ul className="list-disc space-y-1 pl-5 text-[14px] text-ink-800">
          {impact.cannotConclude.map((t, i) => <li key={i}>{t}</li>)}
          {impact.evidenceGaps.map((g, i) => <li key={`g${i}`}>Gap ({g.severity}): {g.description}</li>)}
        </ul>
      </section>

      {impact.timeline.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-display text-2xl">Timeline</h2>
          <ul className="space-y-2 text-[14px]">
            {impact.timeline.map((t, i) => (
              <li key={i}><strong>{t.date}</strong> · {t.phase} — {t.description} <Ids ids={t.evidenceIds} /></li>
            ))}
          </ul>
        </section>
      )}

      <section className="surface-1 space-y-2 p-4">
        <h2 className="overline">Campaign summary</h2>
        <p className="text-[15px]">{impact.campaignContent.summary}</p>
      </section>

      <p className="mono-id text-[11px] text-ink-500">
        {impact.traceability.investigationId} · generated {impact.traceability.generatedAt}
      </p>
    </div>
  );
}
