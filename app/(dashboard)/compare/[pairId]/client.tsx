"use client";

import React from "react";
import { ReactCompareSlider } from "react-compare-slider";
import { EvidenceMedia } from "@/components/ui/EvidenceMedia";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface Side {
  id: string;
  at: string | null;
  score: number;
  status: string;
}

interface Props {
  title: string;
  subtitle: string;
  notice: string | null;
  exgDelta: number | null;
  pairId: string;
  candidateScore: number | null;
  before: Side;
  after: Side;
  beforeUrl: string;
  afterUrl: string;
}

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })
    : "unknown";

function span(a: string | null, b: string | null) {
  if (!a || !b) return null;
  const days = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
  if (days < 1) return "same day";
  if (days < 60) return `${days} days`;
  return `${Math.round(days / 30.4)} months`;
}

function SidePanel({ label, side }: { label: string; side: Side }) {
  return (
    <div className="space-y-2 p-5">
      <p className="overline">{label}</p>
      <p className="mono-meta text-ink-800">{fmt(side.at)}</p>
      <p className="mono-id text-ink-700">{side.id}</p>
      <div className="flex items-center gap-2">
        <StatusBadge status={side.status} />
        <span className="font-display text-lg tabular-nums">{side.score}</span>
      </div>
    </div>
  );
}

/** Scientific comparison (design.md section 12): BEFORE, CHANGE, AFTER with a labelled slider and stated method. */
export default function CompareClient({ title, subtitle, notice, exgDelta, pairId, candidateScore, before, after, beforeUrl, afterUrl }: Props) {
  const elapsed = span(before.at, after.at);
  const Trend = exgDelta === null ? Minus : exgDelta >= 0 ? ArrowUp : ArrowDown;
  return (
    <div>
      <PageHeader stage="Use · Compare" title="Before & after">
        {title} · {subtitle}
      </PageHeader>

      {notice && <p className="mb-4 rounded-sm border border-review-line bg-review-bg px-3 py-2 text-[13px] text-review-fg">{notice}</p>}

      <section className="surface-2 overflow-hidden" aria-label="Before and after comparison">
        <div className="grid divide-cloud-200 md:grid-cols-3 md:divide-x">
          <SidePanel label="Before" side={before} />
          <div className="space-y-2 bg-sky-50 p-5">
            <p className="overline">Change{elapsed ? ` · over ${elapsed}` : ""}</p>
            {exgDelta !== null ? (
              <>
                <p className="flex items-center gap-2 font-display text-4xl tabular-nums text-ink-900">
                  <Trend className="h-6 w-6 text-sky-600" aria-hidden />
                  {exgDelta >= 0 ? "+" : ""}
                  {exgDelta.toFixed(3)}
                </p>
                <p className="text-[13px] text-ink-700">Vegetation index (ExG), after minus before</p>
              </>
            ) : (
              <p className="text-[13px] text-ink-700">No measurement recorded. This is a visual comparison only.</p>
            )}
            {candidateScore !== null && (
              <p className="mono-meta">viewpoint match {candidateScore.toFixed(2)}</p>
            )}
          </div>
          <SidePanel label="After" side={after} />
        </div>

        <div className="relative h-[min(64vh,540px)] w-full border-y border-cloud-200 bg-cloud-100">
          <ReactCompareSlider
            itemOne={<div className="h-full w-full"><EvidenceMedia src={beforeUrl} alt={`Before, ${fmt(before.at)}`} /></div>}
            itemTwo={<div className="h-full w-full"><EvidenceMedia src={afterUrl} alt={`After, ${fmt(after.at)}`} /></div>}
            className="h-full w-full"
          />
          <span className="badge badge-neutral pointer-events-none absolute left-3 top-3 bg-white">Before</span>
          <span className="badge badge-neutral pointer-events-none absolute right-3 top-3 bg-white">After</span>
        </div>

        <div className="grid gap-2 p-5 text-[13px] text-ink-700 md:grid-cols-[auto_1fr] md:gap-6">
          <p className="overline pt-0.5">Methodology</p>
          <p>
            Both frames are the same site and viewpoint, delivered from the stored originals with fill and auto gravity and no generated pixels.
            Faces stay pixelated unless consent is on file. Pair <span className="mono-id">{pairId}</span> cites evidence{" "}
            <span className="mono-id">{before.id}</span> and <span className="mono-id">{after.id}</span>.
          </p>
        </div>
      </section>
    </div>
  );
}
