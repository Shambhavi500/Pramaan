import Link from "next/link";
import { EvidenceCoverage, StrengthMeter } from "./EvidenceCoverage";
import { normalizeStatus, StatusBadge } from "./StatusBadge";

export interface ClaimEvidenceItem {
  id: string;
  score: number;
  status: string;
  imageUrl?: string | null;
}

/**
 * Impact Claim Card (design.md section 11): the most important object in the product, so it carries S3 weight at rest.
 * Answers "how strongly does the evidence support this claim", distinct from per-asset trust.
 */
export function ImpactClaimCard({
  claimId,
  siteLabel,
  statement,
  coveragePct,
  verified,
  flagged,
  pending,
  gaps,
  strength,
  items,
}: {
  claimId: string;
  siteLabel: string;
  statement: string;
  coveragePct: number;
  verified: number;
  flagged: number;
  pending: number;
  gaps: number;
  strength: "strong" | "moderate" | "weak";
  items: ClaimEvidenceItem[];
}) {
  return (
    <section className="surface-3 enter space-y-6 p-6 sm:p-8" aria-labelledby={`claim-${claimId}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="overline">
          Claim · <span className="mono-id normal-case tracking-normal">{claimId}</span>
        </p>
        <p className="text-[13px] text-ink-700">{siteLabel}</p>
      </div>

      <h2 id={`claim-${claimId}`} className="font-display text-3xl leading-[1.2] tracking-[-0.01em] text-ink-900">
        {statement}
      </h2>

      <div className="space-y-3">
        <p className="overline">Evidence coverage</p>
        <div className="flex items-end gap-4">
          <span className="font-display text-6xl leading-none tabular-nums tracking-tight text-ink-900">
            {coveragePct}
            <span className="text-3xl">%</span>
          </span>
          <StrengthMeter strength={strength} />
        </div>
        <EvidenceCoverage verified={verified} flagged={flagged} pending={pending} gaps={gaps} />
      </div>

      {gaps > 0 && (
        <p className="rounded-sm border border-dashed border-ink-400 bg-cloud-50 px-3 py-2 text-[13px] text-ink-700">
          <b className="text-ink-900">What is missing:</b> {gaps} more verified asset{gaps > 1 ? "s" : ""} needed before this claim is fully supported.
        </p>
      )}

      {items.length > 0 && (
        <div className="space-y-2 border-t border-cloud-100 pt-4">
          <p className="overline">Cited evidence · {items.length}</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 rounded-md border border-cloud-200 bg-cloud-25 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={i.imageUrl || `/evidence/${i.id.replace('ev_jh04_', '')}.jpg`}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-sm object-cover"
                  loading="eager"
                  onError={(e) => {
                    const fallback = `/evidence/${i.id.replace('ev_jh04_', '')}.jpg`;
                    (e.currentTarget as HTMLImageElement).src = fallback;
                  }}
                />
                <span className="mono-id min-w-0 flex-1 truncate text-ink-700" title={i.id}>
                  {i.id}
                </span>
                <span className="font-display text-lg tabular-nums">{i.score}</span>
                <StatusBadge status={normalizeStatus(i.status)} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        <Link href="/review" className="btn-outline">
          Open review queue
        </Link>
        <Link href="/evidence" className="btn-outline">
          Browse evidence
        </Link>
      </div>
    </section>
  );
}
