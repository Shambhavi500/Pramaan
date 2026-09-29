"use client";

import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";

const DEMO = "https://res.cloudinary.com/demo/image/upload/c_fill,g_auto,w_900,h_650/f_auto/q_auto";

/** Two public demo photos, standing in for two verified evidence photos of one site. */
export function PairDemo() {
  return (
    <div className="space-y-2">
      <div className="panel h-[min(52vh,420px)] overflow-hidden p-1">
        <ReactCompareSlider
          itemOne={<ReactCompareSliderImage src={`${DEMO}/samples/landscapes/nature-mountains.jpg`} alt="Demo photo standing in for the before image" />}
          itemTwo={<ReactCompareSliderImage src={`${DEMO}/samples/landscapes/beach-boat.jpg`} alt="Demo photo standing in for the after image" />}
          className="h-full w-full rounded-lg"
        />
      </div>
      <p className="text-center text-[11px] text-muted">Demo photos from Cloudinary&apos;s public sample cloud, not real project sites. Drag the handle.</p>
    </div>
  );
}
