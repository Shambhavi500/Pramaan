import { normalizeStatus, StatusBadge, type EvidenceStatus } from "./StatusBadge";

const FILL: Record<EvidenceStatus, string> = {
  verified: "bg-verified",
  needs_review: "bg-review hatch-review",
  flagged: "bg-flagged hatch-flagged",
  rejected: "bg-flagged hatch-flagged",
  pending: "bg-ink-400",
};
const STROKE: Record<EvidenceStatus, string> = {
  verified: "var(--color-verified)",
  needs_review: "var(--color-review)",
  flagged: "var(--color-flagged)",
  rejected: "var(--color-flagged)",
  pending: "var(--color-ink-400)",
};

// Real pipeline thresholds (lib/trust-scoring.ts): >= 80 verified, < 50 flagged.
const TICKS = [50, 80];

/** Evidence instrument: a thin confidence bar with the decision thresholds marked. Not a gamified gauge. */
export function TrustScore({
  score,
  status,
  variant = "bar",
  showBadge = true,
}: {
  score: number;
  status: string | null | undefined;
  variant?: "bar" | "ring" | "instrument";
  showBadge?: boolean;
}) {
  const st = normalizeStatus(status);
  const pct = Math.max(0, Math.min(100, score));
  const sr = <span className="sr-only">{`Trust score ${pct} of 100, ${st.replace("_", " ")}`}</span>;

  if (variant === "ring") {
    const r = 30;
    const c = 2 * Math.PI * r;
    return (
      <div className="relative inline-grid h-[72px] w-[72px] place-items-center" role="img" aria-label={`Trust score ${pct} of 100`}>
        <svg viewBox="0 0 72 72" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx="36" cy="36" r={r} fill="none" stroke="var(--color-cloud-200)" strokeWidth="3" />
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke={STROKE[st]}
            strokeWidth="3"
            strokeLinecap="butt"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct / 100)}
          />
        </svg>
        <span className="font-display text-2xl tabular-nums">{pct}</span>
      </div>
    );
  }

  const bar = (
    <div className="relative h-1.5 w-full rounded-xs bg-cloud-200" aria-hidden>
      <div className={`h-full rounded-xs ${FILL[st]}`} style={{ width: `${pct}%` }} />
      {TICKS.map((t) => (
        <span key={t} className="absolute -top-0.5 h-2.5 w-px bg-ink-400" style={{ left: `${t}%` }} />
      ))}
    </div>
  );

  if (variant === "instrument") {
    return (
      <div className="space-y-3">
        {sr}
        <div className="flex items-end gap-4">
          <span className="font-display text-6xl leading-none tabular-nums tracking-tight" aria-hidden>
            {pct}
          </span>
          <span className="pb-1 text-sm text-ink-600" aria-hidden>
            / 100
          </span>
          <span className="pb-1">{showBadge && <StatusBadge status={st} />}</span>
        </div>
        {bar}
        <div className="relative h-3 font-mono text-[10px] text-ink-500" aria-hidden>
          {TICKS.map((t) => (
            <span key={t} className="absolute -translate-x-1/2" style={{ left: `${t}%` }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {sr}
      <span className="w-8 font-display text-xl tabular-nums" aria-hidden>
        {pct}
      </span>
      <div className="flex-1">{bar}</div>
      {showBadge && <StatusBadge status={st} />}
    </div>
  );
}
