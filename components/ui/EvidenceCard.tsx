import Link from "next/link";
import type { ReactNode } from "react";
import { MapPin } from "lucide-react";
import { EvidenceMedia } from "./EvidenceMedia";
import { normalizeStatus, StatusBadge, STATUS_STRIPE } from "./StatusBadge";
import { TrustScore } from "./TrustScore";

export interface EvidenceCardProps {
  id: string;
  imageUrl?: string | null;
  title: string;
  /** e.g. project / site / activity, rendered as a single supporting line */
  context?: string;
  /** longer supporting text (e.g. AI caption), clamped to two lines */
  description?: string | null;
  capturedAt?: string | null;
  geoLabel?: string | null;
  score: number;
  status: string | null | undefined;
  signals?: string[];
  href?: string;
  actions?: ReactNode;
  /** overlaid caption fragment for search results, etc. */
  footer?: ReactNode;
}

const fmtTime = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : `${d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} · ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
};

/**
 * Canonical Evidence Card (design.md section 9): floating S2 surface, status stripe (pattern per status),
 * media preview, mono ID and metadata, key signals, trust instrument, quick actions.
 */
export function EvidenceCard({ id, imageUrl, title, context, description, capturedAt, geoLabel, score, status, signals, href, actions, footer }: EvidenceCardProps) {
  const st = normalizeStatus(status);
  const when = fmtTime(capturedAt);
  const flagged = st === "flagged" || st === "rejected";
  return (
    <article
      className={`surface-2 enter flex flex-col overflow-hidden ${href ? "is-interactive" : ""}`}
      aria-labelledby={`ev-${id}`}
    >
      <div className={`h-[3px] w-full ${STATUS_STRIPE[st]}`} aria-hidden />
      <div className="relative aspect-[4/3] bg-cloud-100">
        <EvidenceMedia src={imageUrl} alt={`${title}${when ? `, ${when}` : ""}`} muted={flagged} />
        <div className="absolute left-3 top-3">
          <StatusBadge status={st} className="shadow-[var(--shadow-elev-1)]" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <p className="mono-id text-ink-600">{id}</p>
          <h3 id={`ev-${id}`} className="text-base font-semibold leading-snug tracking-[-0.005em] text-ink-900">
            {href ? (
              <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
                {title}
              </Link>
            ) : (
              title
            )}
          </h3>
          {context && <p className="text-[13px] text-ink-700">{context}</p>}
          {description && <p className="line-clamp-2 text-xs text-ink-600" title={description}>{description}</p>}
        </div>

        {(when || geoLabel) && (
          <p className="mono-meta flex flex-wrap items-center gap-x-3 gap-y-1">
            {when && <span>{when}</span>}
            {geoLabel && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" aria-hidden /> {geoLabel}
              </span>
            )}
          </p>
        )}

        {signals && signals.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Key detected signals">
            {signals.slice(0, 3).map((s) => (
              <li key={s} className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs text-sky-700">
                {s}
              </li>
            ))}
            {signals.length > 3 && <li className="px-1 py-0.5 text-xs text-ink-600">+{signals.length - 3}</li>}
          </ul>
        )}

        <div className="mt-auto border-t border-cloud-100 pt-3">
          <TrustScore score={score} status={st} showBadge={false} />
        </div>
        {footer}
        {actions && <div className="relative z-10 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </article>
  );
}
