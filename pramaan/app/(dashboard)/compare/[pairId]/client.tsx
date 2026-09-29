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
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Before & After Change Verification</h1>
          <p className="text-sm text-muted-foreground">
            {title} · {subtitle}
          </p>
        </div>
        {exgDelta !== null && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-lg text-sm font-semibold">
            Vegetation index Δ (ExG): {exgDelta >= 0 ? "+" : ""}
            {exgDelta.toFixed(3)}
          </div>
        )}
      </div>

      {notice && <p className="text-xs text-amber-700">{notice}</p>}

      <div className="h-[550px] w-full rounded-2xl overflow-hidden border shadow-sm">
        <ReactCompareSlider
          itemOne={<ReactCompareSliderImage src={beforeUrl} alt="Before" />}
          itemTwo={<ReactCompareSliderImage src={afterUrl} alt="After" />}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
