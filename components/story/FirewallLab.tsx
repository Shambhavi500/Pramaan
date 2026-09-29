"use client";

import { useState } from "react";
import { classifyTransformation, type DerivativeClass } from "@/lib/transformations";

const DEMO = "https://res.cloudinary.com/demo/image/upload";

const PRESETS = [
  { label: "Resize + smart crop", t: "c_fill,g_auto,w_800,h_600", img: "samples/landscapes/nature-mountains.jpg" },
  { label: "Pixelate faces", t: "e_pixelate_faces:12/c_fit,w_800", img: "samples/people/smiling-man.jpg" },
  { label: "Text label overlay", t: "co_white,l_text:Arial_36_bold:BEFORE/fl_layer_apply,g_north_west,x_16,y_16/c_fit,w_800", img: "samples/landscapes/nature-mountains.jpg" },
  { label: "Generative fill", t: "b_gen_fill,ar_16:9,c_pad,w_1200", img: null },
  { label: "Remove background", t: "e_background_removal", img: null },
];

const CLASS_STYLE: Record<DerivativeClass, string> = {
  transcoded: "bg-link/20 text-link",
  redacted: "bg-good/20 text-good",
  edited: "bg-warn/20 text-warn",
  ai_generated: "bg-bad/20 text-bad",
};

export function FirewallLab() {
  const [t, setT] = useState(PRESETS[1].t);
  const [img, setImg] = useState<string | null>(PRESETS[1].img);
  const cls = classifyTransformation(t);
  const generative = cls === "ai_generated";

  return (
    <div className="panel space-y-5 p-5 sm:p-8">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => {
              setT(p.t);
              setImg(p.img);
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              p.t === t ? "border-lime bg-lime text-lime-ink" : "border-line-bright text-soft hover:text-white"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-soft">Transformation (edit it, or pick a preset)</span>
        <input
          value={t}
          onChange={(e) => {
            setT(e.target.value);
            setImg(null);
          }}
          spellCheck={false}
          className="field font-mono text-xs"
        />
      </label>

      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            Classified as <span className={`rounded px-2 py-0.5 font-mono text-xs ${CLASS_STYLE[cls]}`}>{cls}</span>
          </div>
          <div className={`rounded-lg border p-4 ${generative ? "border-bad/50 bg-bad/10" : "border-good/40 bg-good/10"}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Evidence layer</p>
            <p className={`text-lg font-normal ${generative ? "text-bad" : "text-good"}`}>{generative ? "Blocked" : "Allowed"}</p>
            <p className="text-xs text-white/70">
              {generative ? "assertGenerativeFirewall() throws. Nothing generated is ever served as proof." : "Deterministic: the same input always gives the same pixels."}
            </p>
          </div>
          <div className="rounded-lg border border-line bg-white/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Story Studio</p>
            <p className="text-lg font-normal">Allowed</p>
            <p className="text-xs text-white/70">
              {generative
                ? "Only with an on-image “AI-assisted” badge and the ai_generated class in the ledger."
                : "Ordinary derivative, recorded with its recipe."}
            </p>
          </div>
        </div>

        <div className="grid min-h-56 place-items-center overflow-hidden rounded-lg border border-line bg-navy/60">
          {img && !generative ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`${DEMO}/${t}/${img}`} alt="Live Cloudinary rendering of this transformation" className="h-full max-h-72 w-full object-cover" />
          ) : (
            <p className="px-6 text-center text-xs text-muted">
              {generative ? "Not rendered here: generative output is never shown in the evidence layer." : "Pick a preset to see it rendered live by Cloudinary."}
            </p>
          )}
        </div>
      </div>
      <p className="break-all font-mono text-[11px] text-muted">
        {img && !generative ? `${DEMO}/${t}/${img}` : "The classifier is lib/transformations.ts, the same code the server runs."}
      </p>
    </div>
  );
}
