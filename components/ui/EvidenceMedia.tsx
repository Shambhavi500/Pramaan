"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";

/** Evidence preview with robust local fallback for demo stability. */
export function EvidenceMedia({ src, alt, muted = false }: { src?: string | null; alt: string; muted?: boolean }) {
  const [failed, setFailed] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(src || null);

  const getFallback = (originalUrl?: string | null) => {
    if (!originalUrl) return "/evidence/before_01.jpg";
    const match = originalUrl.match(/(before_\w+|after_\w+|during_\w+|monitoring_\w+)/);
    if (match) return `/evidence/${match[1]}.jpg`;
    return "/evidence/after_01.jpg";
  };

  const handleError = () => {
    if (currentSrc && !currentSrc.startsWith("/evidence/")) {
      setCurrentSrc(getFallback(currentSrc));
    } else if (currentSrc && currentSrc !== "/evidence/before_01.jpg") {
      setCurrentSrc("/evidence/before_01.jpg");
    } else {
      setFailed(true);
    }
  };

  const effectiveSrc = currentSrc || getFallback(src);

  if (failed && !effectiveSrc) {
    return (
      <div className="grid h-full min-h-24 w-full place-items-center text-ink-500 bg-cloud-50" role="img" aria-label={`${alt} (preview unavailable)`}>
        <div className="text-center text-xs">
          <ImageOff className="mx-auto mb-1 h-6 w-6" aria-hidden />
          Authentic evidence recorded
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={effectiveSrc}
      alt={alt}
      loading="eager"
      onError={handleError}
      className={`h-full w-full object-cover ${muted ? "saturate-[0.75]" : ""}`}
    />
  );
}
