/**
 * Segmented coverage meter (design.md section 11). Sky = verified, hatched red = flagged, dashed empty slots = gaps.
 * Deliberately not the green/amber/red trust-bar language: coverage is about the claim, not the asset.
 */
export function EvidenceCoverage({
  verified,
  flagged,
  pending = 0,
  gaps,
}: {
  verified: number;
  flagged: number;
  pending?: number;
  gaps: number;
}) {
  const total = Math.max(1, verified + flagged + pending + gaps);
  const w = (n: number) => `${(n / total) * 100}%`;
  return (
    <div className="space-y-3">
      <div className="flex h-3 w-full gap-0.5" role="img" aria-label={`${verified} verified, ${flagged} flagged, ${pending} awaiting review, ${gaps} evidence gaps`}>
        {verified > 0 && <div className="rounded-xs bg-sky-600" style={{ width: w(verified) }} />}
        {pending > 0 && <div className="rounded-xs bg-sky-300" style={{ width: w(pending) }} />}
        {flagged > 0 && <div className="hatch-flagged rounded-xs bg-flagged" style={{ width: w(flagged) }} />}
        {gaps > 0 && <div className="hatch-gap rounded-xs border border-dashed border-ink-400" style={{ width: w(gaps) }} />}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-700">
        <li className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-xs bg-sky-600" aria-hidden />
          <b className="tabular-nums text-ink-900">{verified}</b> verified
        </li>
        {pending > 0 && (
          <li className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-sky-300" aria-hidden />
            <b className="tabular-nums text-ink-900">{pending}</b> awaiting review
          </li>
        )}
        <li className="flex items-center gap-1.5">
          <span className="hatch-flagged h-2.5 w-2.5 rounded-xs bg-flagged" aria-hidden />
          <b className="tabular-nums text-ink-900">{flagged}</b> flagged
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-xs border border-dashed border-ink-500" aria-hidden />
          <b className="tabular-nums text-ink-900">{gaps}</b> evidence {gaps === 1 ? "gap" : "gaps"}
        </li>
      </ul>
    </div>
  );
}

const CELLS: Record<string, { on: number; label: string }> = {
  strong: { on: 5, label: "Strong" },
  moderate: { on: 3, label: "Moderate" },
  weak: { on: 1, label: "Weak" },
  none: { on: 0, label: "None" },
};

/** Five-cell strength indicator with a word label, so strength never depends on shade alone. */
export function StrengthMeter({ strength }: { strength: keyof typeof CELLS }) {
  const { on, label } = CELLS[strength];
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex gap-0.5" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={`h-3 w-3 rounded-xs ${i < on ? (on >= 4 ? "bg-sky-600" : "bg-sky-400") : "border border-ink-400"}`} />
        ))}
      </span>
      <span className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-800">{label}</span>
    </span>
  );
}
