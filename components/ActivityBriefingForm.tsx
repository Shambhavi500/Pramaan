"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ACTIVITIES } from "@/lib/activities";

const CLAIMS = [
  { value: "construction_complete", label: "Construction / restoration completed" },
  { value: "location_authenticity", label: "Location authenticity" },
  { value: "before_after_change", label: "Before/after physical change" },
  { value: "environmental_change", label: "Environmental change" },
  { value: "community_participation", label: "Community participation" },
];
const EVIDENCE = [
  { value: "photos", label: "Photos" },
  { value: "videos", label: "Videos" },
  { value: "field_reports", label: "Field reports" },
  { value: "gps_tracks", label: "GPS tracks" },
];

function toggle(list: string[], v: string) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

/** Tells the agents what this activity is meant to demonstrate, so analysis is driven by the objective. */
export function ActivityBriefingForm({ siteId }: { siteId: string }) {
  const router = useRouter();
  const [objective, setObjective] = useState("");
  const [activityType, setActivityType] = useState<string>(ACTIVITIES[0].value);
  const [claims, setClaims] = useState<string[]>(["before_after_change", "location_authenticity"]);
  const [other, setOther] = useState("");
  const [evidenceTypes, setEvidenceTypes] = useState<string[]>(["photos"]);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/activities/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          objective,
          activityType,
          periodStart: periodStart || null,
          periodEnd: periodEnd || null,
          claimsToEstablish: other.trim() ? [...claims, other.trim()] : claims,
          evidenceTypes,
        }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? "Could not save the brief");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the brief");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="surface-1 space-y-6 p-6" aria-label="Activity brief">
      <label className="block space-y-1">
        <span className="overline">1 · What are you trying to document?</span>
        <textarea required minLength={5} maxLength={500} rows={2} value={objective} onChange={(e) => setObjective(e.target.value)} className="input" placeholder="Restoration of check dam and improvement of surrounding site" disabled={busy} />
      </label>

      <label className="block space-y-1">
        <span className="overline">2 · Activity type</span>
        <select value={activityType} onChange={(e) => setActivityType(e.target.value)} className="input" disabled={busy}>
          {ACTIVITIES.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      </label>

      <fieldset className="space-y-2" disabled={busy}>
        <legend className="overline">3 · What do you want to demonstrate?</legend>
        {CLAIMS.map((c) => (
          <label key={c.value} className="flex items-center gap-2 text-[14px]">
            <input type="checkbox" checked={claims.includes(c.value)} onChange={() => setClaims(toggle(claims, c.value))} />
            {c.label}
          </label>
        ))}
        <input value={other} onChange={(e) => setOther(e.target.value)} maxLength={120} className="input" placeholder="Other (write in)" />
      </fieldset>

      <fieldset className="space-y-2" disabled={busy}>
        <legend className="overline">4 · Evidence you will collect</legend>
        <div className="flex flex-wrap gap-4">
          {EVIDENCE.map((c) => (
            <label key={c.value} className="flex items-center gap-2 text-[14px]">
              <input type="checkbox" checked={evidenceTypes.includes(c.value)} onChange={() => setEvidenceTypes(toggle(evidenceTypes, c.value))} />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="overline">5 · Period start</span>
          <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="input" disabled={busy} />
        </label>
        <label className="space-y-1">
          <span className="overline">Period end</span>
          <input type="date" value={periodEnd} min={periodStart || undefined} onChange={(e) => setPeriodEnd(e.target.value)} className="input" disabled={busy} />
        </label>
      </div>

      {error && (
        <p role="alert" className="rounded-sm border border-flagged-line bg-flagged-bg px-3 py-2 text-[13px] text-flagged-fg">{error}</p>
      )}
      <button type="submit" disabled={busy || objective.trim().length < 5} className="btn-primary">
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {busy ? "Saving" : "Save brief"}
      </button>
    </form>
  );
}
