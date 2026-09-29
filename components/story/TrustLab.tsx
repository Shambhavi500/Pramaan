"use client";

import { useMemo, useState } from "react";
import { finalizeTrust, VERIFIED_MIN, FLAGGED_BELOW } from "@/lib/trust-scoring";

interface Option {
  label: string;
  score: number;
  hard?: boolean;
  noGps?: boolean;
}
interface SignalDef {
  id: string;
  name: string;
  weight: number;
  source: string;
  options: Option[];
}

// Weights and scores mirror lib/trust-engine.ts.
const SIGNALS: SignalDef[] = [
  {
    id: "P1",
    name: "Channel provenance",
    weight: 10,
    source: "Client SHA-256 travelled in the signed upload context",
    options: [
      { label: "Hash present", score: 1 },
      { label: "Missing", score: 0.6 },
    ],
  },
  {
    id: "P2",
    name: "EXIF timestamp",
    weight: 5,
    source: "media_metadata from the upload preset",
    options: [
      { label: "Present", score: 1 },
      { label: "Missing", score: 0 },
    ],
  },
  {
    id: "P3",
    name: "Geofence",
    weight: 10,
    source: "PostGIS check_site_geofence()",
    options: [
      { label: "Inside", score: 1 },
      { label: "Within 150 m", score: 0.7 },
      { label: "Outside", score: 0 },
      { label: "No GPS", score: 0, noGps: true },
    ],
  },
  {
    id: "I1",
    name: "Perceptual-hash reuse",
    weight: 15,
    source: "Cloudinary phash + Hamming distance in Postgres",
    options: [
      { label: "Never seen", score: 1 },
      { label: "Similar (5–10 bits)", score: 0.5 },
      { label: "Reused (≤4 bits)", score: 0, hard: true },
    ],
  },
  {
    id: "I2",
    name: "Screen recapture",
    weight: 10,
    source: "AI Vision: moiré, bezels, pixel grids",
    options: [
      { label: "None seen", score: 1 },
      { label: "Suspected", score: 0, hard: true },
    ],
  },
  {
    id: "I3",
    name: "Synthetic cues",
    weight: 5,
    source: "AI Vision: generation artefacts",
    options: [
      { label: "None seen", score: 1 },
      { label: "Suspected", score: 0.2 },
    ],
  },
  {
    id: "R1",
    name: "Activity matches claim",
    weight: 12,
    source: "AI Vision vs the activity picked at capture",
    options: [
      { label: "Yes", score: 1 },
      { label: "Uncertain", score: 0.5 },
      { label: "No", score: 0 },
    ],
  },
  {
    id: "Q1",
    name: "Focus and quality",
    weight: 6,
    source: "Cloudinary quality_analysis → blurry tag",
    options: [
      { label: "Sharp", score: 1 },
      { label: "Blurry", score: 0.3 },
    ],
  },
];

const PRESETS: { name: string; pick: number[] }[] = [
  { name: "Clean field photo", pick: [0, 0, 0, 0, 0, 0, 0, 0] },
  { name: "Photo of a screen", pick: [0, 0, 0, 0, 1, 0, 0, 0] },
  { name: "Recycled from an old project", pick: [0, 0, 0, 2, 0, 0, 1, 0] },
  { name: "WhatsApp forward (no metadata)", pick: [1, 1, 3, 0, 0, 0, 0, 0] },
];

export function TrustLab() {
  const [pick, setPick] = useState<number[]>(PRESETS[0].pick);

  const result = useMemo(() => {
    const chosen = SIGNALS.map((s, i) => s.options[pick[i]]);
    return finalizeTrust(
      SIGNALS.map((s, i) => ({ score: chosen[i].score, weight: s.weight })),
      { hasExifGps: !chosen.some((c) => c.noGps), hardFlag: chosen.some((c) => c.hard) }
    );
  }, [pick]);

  const tone = result.status === "verified" ? "text-good" : result.status === "flagged" ? "text-bad" : "text-warn";
  const stroke = result.status === "verified" ? "#7ee8a4" : result.status === "flagged" ? "#ff7a8a" : "#ffd166";
  const C = 2 * Math.PI * 54;

  return (
    <div className="panel grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => setPick(p.pick)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                JSON.stringify(p.pick) === JSON.stringify(pick)
                  ? "border-lime bg-lime text-lime-ink"
                  : "border-line-bright text-soft hover:text-white"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        <ul className="divide-y divide-white/10">
          {SIGNALS.map((s, i) => (
            <li key={s.id} className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div>
                <p className="text-sm font-normal">
                  <span className="mr-2 font-mono text-xs text-lime">{s.id}</span>
                  {s.name} <span className="text-xs text-muted">· weight {s.weight}</span>
                </p>
                <p className="text-xs text-muted">{s.source}</p>
              </div>
              <div role="radiogroup" aria-label={s.name} className="flex flex-wrap gap-1">
                {s.options.map((o, oi) => (
                  <button
                    key={o.label}
                    role="radio"
                    aria-checked={pick[i] === oi}
                    onClick={() => setPick((prev) => prev.map((v, k) => (k === i ? oi : v)))}
                    className={`rounded-md px-2.5 py-1 text-xs transition ${
                      pick[i] === oi ? "bg-link/25 font-medium text-white ring-1 ring-link" : "bg-white/5 text-soft hover:bg-white/10"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col items-center justify-start gap-4 text-center lg:border-l lg:border-white/10 lg:pl-8">
        <svg viewBox="0 0 128 128" className="h-44 w-44" role="img" aria-label={`Trust score ${result.score} out of 100`}>
          <circle cx="64" cy="64" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
          <circle
            cx="64"
            cy="64"
            r="54"
            fill="none"
            stroke={stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - result.score / 100)}
            transform="rotate(-90 64 64)"
            style={{ transition: "stroke-dashoffset .6s ease, stroke .3s" }}
          />
          <text x="64" y="72" textAnchor="middle" className="fill-white text-[34px] font-light">
            {result.score}
          </text>
        </svg>
        <p className={`text-lg font-medium uppercase tracking-wide ${tone}`}>{result.status.replace("_", " ")}</p>
        <p className="min-h-10 text-xs text-soft">
          {result.capped === "hard_flag" && "A hard flag caps the score at 40, whatever else is clean."}
          {result.capped === "no_exif_gps" && "Without hardware GPS the score can never pass 79, so a person must look."}
          {!result.capped && "No cap applied. The score is the weighted average of the signals."}
        </p>
        <p className="text-[11px] text-muted">
          Verified ≥ {VERIFIED_MIN} · Needs review {FLAGGED_BELOW}–{VERIFIED_MIN - 1} · Flagged &lt; {FLAGGED_BELOW}
        </p>
      </div>
    </div>
  );
}
