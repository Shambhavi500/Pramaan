"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";

/** Evidence preview with a graceful fallback: a missing derivative never shows raw alt text over the card. */
export function EvidenceMedia({ src, alt, muted = false }: { src?: string | null; alt: string; muted?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="grid h-full min-h-24 w-full place-items-center text-ink-500" role="img" aria-label={`${alt} (preview unavailable)`}>
        <div className="text-center text-xs">
          <ImageOff className="mx-auto mb-1 h-6 w-6" aria-hidden />
          Preview unavailable · original preserved
        </div>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      // The error can fire before hydration, so also check the already-settled state on mount.
      ref={(el) => {
        if (el && el.complete && el.naturalWidth === 0) setFailed(true);
      }}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`h-full w-full object-cover ${muted ? "saturate-[0.75]" : ""}`}
    />
  );
}
