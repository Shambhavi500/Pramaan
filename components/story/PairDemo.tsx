"use client";

import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";

/** Authentic before/after check dam comparison for Check Dam JH-04. */
export function PairDemo() {
  return (
    <div className="space-y-2">
      <div className="panel h-[min(52vh,420px)] overflow-hidden p-1">
        <ReactCompareSlider
          itemOne={<ReactCompareSliderImage src="/evidence/before_01.jpg" alt="Check Dam JH-04: Baseline dry gully (May 2026)" />}
          itemTwo={<ReactCompareSliderImage src="/evidence/after_01.jpg" alt="Check Dam JH-04: Post-monsoon water retention (Sep 2026)" />}
          className="h-full w-full rounded-lg"
        />
      </div>
      <p className="text-center text-[11px] text-muted">Check Dam JH-04: Pre-monsoon dry riverbed vs post-monsoon full water retention. Drag the handle.</p>
    </div>
  );
}
