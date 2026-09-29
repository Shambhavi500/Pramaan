"use client";

import React from "react";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";
import { getCldImageUrl } from "next-cloudinary";

// Demo pair: the two seeded evidence assets (see scripts/seed.ts).
export default function ComparePage() {
  const beforeUrl = getCldImageUrl({
    src: "cld-sample",
    width: 1200,
    height: 900,
    crop: "fill",
    gravity: "auto",
  });

  const afterUrl = getCldImageUrl({
    src: "cld-sample-2",
    width: 1200,
    height: 900,
    crop: "fill",
    gravity: "auto",
  });

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Before & After Change Verification</h1>
          <p className="text-sm text-muted-foreground">Site GA-17 · Kotra Check Dam (March 2025 vs September 2026)</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-lg text-sm font-semibold">
          Vegetation Cover Δ: +31% (ExG Index)
        </div>
      </div>

      <div className="h-[550px] w-full rounded-2xl overflow-hidden border shadow-sm">
        <ReactCompareSlider
          itemOne={<ReactCompareSliderImage src={beforeUrl} alt="Before Project" />}
          itemTwo={<ReactCompareSliderImage src={afterUrl} alt="After Project" />}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
