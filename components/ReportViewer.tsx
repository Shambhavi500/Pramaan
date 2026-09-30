"use client";

import React from "react";
import type { ImpactReport } from "@/lib/agents/report";

interface Props {
  impact: ImpactReport;
  citationCoverage?: number;
  storyId?: string;
}

const EvidenceIds = ({ ids }: { ids: string[] }) => (
  <>
    {ids.map((id) => (
      <span
        key={id}
        className="mono-id mx-0.5 inline-block rounded-xs border border-sky-200 bg-sky-50 px-1.5 text-[11px] text-sky-700"
        title={`Evidence ${id}`}
      >
        {id}
      </span>
    ))}
  </>
);

const VERDICT: Record<string, { label: string; className: string }> = {
  supported: { label: "Supported", className: "border-emerald-300 bg-emerald-50 text-emerald-800" },
  partially_supported: { label: "Partially supported", className: "border-amber-300 bg-amber-50 text-amber-800" },
  insufficient_evidence: { label: "Insufficient evidence", className: "border-slate-300 bg-slate-50 text-slate-700" },
};

/** Reusable report viewer rendering the full verified impact report and Cloudinary media assets. */
export function ReportViewer({ impact, citationCoverage, storyId }: Props) {
  return (
    <div className="space-y-8" aria-label="Investigation Impact Report">
      {/* Overview metadata */}
      <section className="surface-1 space-y-3 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cloud-200 pb-3">
          <span className="overline">Activity Audit Report</span>
          {storyId && <span className="mono-id text-[12px] text-ink-500">{storyId}</span>}
        </div>
        <h1 className="font-display text-2xl text-ink-900">{impact.campaignContent.headline}</h1>
        <p className="text-[15px] leading-relaxed text-ink-800">{impact.activitySummary}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-ink-600 pt-2">
          <span><strong>Period:</strong> {impact.period}</span>
          <span><strong>Evidence:</strong> {impact.evidenceSummary.verified} verified / {impact.evidenceSummary.total} total</span>
          {impact.evidenceSummary.excluded > 0 && <span><strong>Excluded:</strong> {impact.evidenceSummary.excluded}</span>}
          {citationCoverage !== undefined && (
            <span><strong>Grounding:</strong> {(citationCoverage * 100).toFixed(0)}% citation coverage</span>
          )}
        </div>
      </section>

      {/* Claims */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink-900">Findings & Claims</h2>
        <div className="space-y-3">
          {impact.claims.map((c, i) => {
            const v = VERDICT[c.verdict] ?? { label: c.verdict, className: "border-slate-200 bg-slate-50 text-slate-700" };
            return (
              <article key={i} className="surface-1 space-y-2 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`inline-block rounded-xs border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${v.className}`}>
                    {v.label}
                  </span>
                  <span className="text-[12px] text-ink-500 uppercase tracking-wide">
                    {c.confidence} confidence
                  </span>
                </div>
                <p className="text-[15px] leading-[1.7] text-ink-900">
                  {c.statement} <EvidenceIds ids={c.citedEvidenceIds} />
                </p>
                {c.limitations && (
                  <p className="text-[13px] text-ink-600 bg-cloud-50 p-2.5 rounded-sm border border-cloud-100">
                    <strong className="text-ink-700">Limitations:</strong> {c.limitations}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* Before and After comparisons */}
      {impact.beforeAfterPairs.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-2xl text-ink-900">Before & After Comparisons</h2>
          <p className="text-[15px] leading-[1.7] text-ink-800">{impact.beforeAfterNarrative}</p>
          <div className="grid gap-6">
            {impact.beforeAfterPairs.map((p) => (
              <figure key={p.pairId} className="surface-1 overflow-hidden p-4 space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.compositeUrl || "/evidence/composite_jh04.jpg"}
                  alt={`Before ${p.beforeId} and after ${p.afterId}`}
                  className="w-full rounded-sm object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/evidence/composite_jh04.jpg";
                  }}
                />
                <figcaption className="flex flex-wrap items-center justify-between text-[12px] text-ink-600 pt-1">
                  <span>
                    Pair <EvidenceIds ids={[p.beforeId, p.afterId]} />
                  </span>
                  <span className="uppercase tracking-wider font-medium text-ink-700">
                    Confidence: {p.confidence}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* What cannot be concluded / Evidence gaps */}
      <section className="surface-1 space-y-3 p-5 border-l-4 border-amber-500">
        <h2 className="font-display text-xl text-ink-900">What Cannot Be Concluded</h2>
        <p className="text-[13px] text-ink-600">
          Responsible evidence reporting: the following questions remain unproven by the collected media alone.
        </p>
        <ul className="list-disc space-y-1.5 pl-5 text-[14px] text-ink-800">
          {impact.cannotConclude.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
          {impact.evidenceGaps.map((g, i) => (
            <li key={`gap-${i}`} className="text-amber-900">
              <strong>Open Gap ({g.severity}):</strong> {g.description}
            </li>
          ))}
        </ul>
      </section>

      {/* Timeline */}
      {impact.timeline.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-2xl text-ink-900">Activity Timeline</h2>
          <ol className="relative border-l border-cloud-300 ml-3 space-y-4 py-2">
            {impact.timeline.map((t, i) => (
              <li key={i} className="ml-6 space-y-1">
                <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-sky-600" />
                <div className="flex flex-wrap items-baseline gap-2">
                  <time className="text-[13px] font-semibold text-ink-900">{t.date}</time>
                  <span className="text-[11px] uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.2 rounded-xs">
                    {t.phase}
                  </span>
                </div>
                <p className="text-[14px] text-ink-800">
                  {t.description} <EvidenceIds ids={t.evidenceIds} />
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Campaign Content */}
      <section className="surface-1 space-y-3 p-6">
        <h2 className="overline">Campaign & Dissemination Content</h2>
        <p className="font-display text-lg text-ink-900">{impact.campaignContent.headline}</p>
        <p className="text-[15px] leading-relaxed text-ink-800 bg-cloud-50 p-4 rounded-sm border border-cloud-200 font-mono text-[13px]">
          {impact.campaignContent.summary}
        </p>
        {impact.campaignContent.keyVisuals?.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {impact.campaignContent.keyVisuals.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url || (i === 0 ? "/evidence/after_01.jpg" : "/evidence/monitoring_01.jpg")}
                alt={`Key Visual ${i + 1}`}
                className="w-full aspect-video rounded-sm object-cover border border-cloud-200"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = i === 0 ? "/evidence/after_01.jpg" : "/evidence/monitoring_01.jpg";
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Traceability Footer */}
      <footer className="pt-4 border-t border-cloud-200 text-[11px] text-ink-500 flex flex-wrap justify-between gap-2">
        <span className="mono-id">Investigation: {impact.traceability.investigationId}</span>
        <span>Generated: {new Date(impact.traceability.generatedAt).toLocaleString()}</span>
      </footer>
    </div>
  );
}
