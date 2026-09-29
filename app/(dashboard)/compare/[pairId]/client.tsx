"use client";

import React from "react";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";

interface Props {
  title: string;
  subtitle: string;
  notice: string | null;
  exgDelta: number | null;
  beforeUrl: string;
  afterUrl: string;
}

export default function CompareClient({ title, subtitle, notice, exgDelta, beforeUrl, afterUrl }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <span className="chip-cyan">Change verification</span>
          <h1 className="text-4xl font-light tracking-tight">Before &amp; after</h1>
          <p className="text-sm text-soft">
            {title} · {subtitle}
          </p>
        </div>
        {exgDelta !== null && (
          <div className="panel-flat px-4 py-2 text-sm font-medium text-good">
            Vegetation index Δ (ExG): {exgDelta >= 0 ? "+" : ""}
            {exgDelta.toFixed(3)}
          </div>
        )}
      </div>

      {notice && <p className="text-xs text-warn">{notice}</p>}

      <div className="panel h-[min(70vh,550px)] w-full overflow-hidden p-1">
        <ReactCompareSlider
          itemOne={<ReactCompareSliderImage src={beforeUrl} alt="Before" />}
          itemTwo={<ReactCompareSliderImage src={afterUrl} alt="After" />}
          className="h-full w-full rounded-lg"
        />
      </div>
    </div>
  );
}
