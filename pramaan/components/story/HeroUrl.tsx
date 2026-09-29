"use client";

import { useEffect, useState } from "react";

const SEGMENTS = [
  { part: "t_ev_analysis", note: "Named transformation: fit to 1024 px, JPEG, q_auto:good. This is what AI Vision sees." },
  { part: "t_public_safe", note: "Pixelates faces, then fits to 1600 px. Served when consent is missing." },
  { part: "t_pair_half", note: "Fill 800×600 around the subject, one half of a before/after composite." },
];

const DEMO = "https://res.cloudinary.com/demo/image/upload";

// Same recipes as the named transformations, at a smaller size so the demo loads quickly.
const DEMO_RECIPE: Record<string, string> = {
  t_ev_analysis: "c_fit,w_720,h_720/f_jpg/q_auto:good",
  t_public_safe: "e_pixelate_faces:12/c_fit,w_720,h_720",
  t_pair_half: "c_fill,g_auto,w_720,h_540",
};

/** A small live echo of the hub's URL explorer: the recipe changes, the image is rendered by Cloudinary. */
export function HeroUrl() {
  const [i, setI] = useState(1);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((v) => (v + 1) % SEGMENTS.length), 3800);
    return () => clearInterval(id);
  }, []);

  const seg = SEGMENTS[i];
  const src = `${DEMO}/${DEMO_RECIPE[seg.part]}/samples/people/smiling-man.jpg`;

  return (
    <div className="panel overflow-hidden">
      <div className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="relative aspect-[4/3] bg-navy">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={seg.part} src={src} alt="Demo portrait rendered by Cloudinary with the selected named transformation" className="absolute inset-0 h-full w-full object-cover" />
        </div>
        <div className="flex flex-col justify-center gap-4 p-5">
          <div className="flex gap-2">
            {SEGMENTS.map((s, k) => (
              <button
                key={s.part}
                onClick={() => setI(k)}
                className={`rounded-full border px-3 py-1 text-[11px] font-medium transition ${
                  k === i ? "border-lime bg-lime text-lime-ink" : "border-line-bright text-soft hover:text-white"
                }`}
              >
                {s.part.replace("t_", "")}
              </button>
            ))}
          </div>
          <p className="text-sm font-light text-white/85">{seg.note}</p>
          <p className="break-all rounded-lg border border-line bg-navy/70 p-3 font-mono text-[11px] leading-relaxed text-soft">
            <span className="text-muted">…/image/upload/</span>
            <span className="text-lime">{seg.part}</span>
            <span className="text-muted">/pramaan/…/photo.jpg</span>
          </p>
        </div>
      </div>
    </div>
  );
}
