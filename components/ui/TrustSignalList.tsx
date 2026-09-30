import { Check, Minus, X } from "lucide-react";

export interface TrustSignalRow {
  id?: string;
  name: string;
  /** 0..1 */
  score: number;
  reason?: string;
}

function verdict(score: number) {
  if (score >= 0.8) return { Icon: Check, label: "pass", cls: "text-verified-fg", row: "", bar: "bg-verified" };
  if (score >= 0.5) return { Icon: Minus, label: "review", cls: "text-review-fg", row: "bg-review-bg/60", bar: "bg-review hatch-review" };
  return { Icon: X, label: "fail", cls: "text-flagged-fg", row: "bg-flagged-bg/60", bar: "bg-flagged hatch-flagged" };
}

const GROUPS: Record<string, string> = { P: "Provenance", I: "Integrity", R: "Relevance", Q: "Quality" };

/** Forensic signal matrix grouped by family (P / I / R / Q). Each row: code, name, glyph + word, value, micro-bar. */
export function TrustSignalList({ signals }: { signals: TrustSignalRow[] }) {
  if (signals.length === 0) return <p className="text-sm text-ink-600">No signal breakdown recorded for this asset.</p>;
  const groups = Object.entries(GROUPS)
    .map(([k, label]) => ({ label, rows: signals.filter((s) => s.id?.startsWith(k)) }))
    .filter((g) => g.rows.length);
  const ungrouped = signals.filter((s) => !s.id || !(s.id[0] in GROUPS));
  if (ungrouped.length) groups.push({ label: "Signals", rows: ungrouped });

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <section key={g.label}>
          <h4 className="overline mb-1">{g.label}</h4>
          <ul className="divide-y divide-cloud-100">
            {g.rows.map((s) => {
              const v = verdict(s.score);
              return (
                <li key={s.id ?? s.name} className={`grid grid-cols-[2rem_1fr_auto] items-center gap-x-3 rounded-xs px-2 py-2 ${v.row}`}>
                  <span className="mono-id text-ink-600">{s.id ?? "·"}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-ink-900">{s.name}</p>
                    {s.reason && s.score < 0.8 && <p className="text-xs text-ink-600">{s.reason}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden h-1.5 w-10 rounded-xs bg-cloud-200 sm:block" aria-hidden>
                      <span className={`block h-full rounded-xs ${v.bar}`} style={{ width: `${Math.round(s.score * 100)}%` }} />
                    </span>
                    <span className="mono-meta w-10 text-right">{s.score.toFixed(2)}</span>
                    <span className={`flex w-16 items-center gap-1 text-xs font-semibold ${v.cls}`}>
                      <v.Icon className="h-3.5 w-3.5" aria-hidden /> {v.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
