import { AlertCircle, Clock, OctagonAlert, ShieldCheck, XCircle, type LucideIcon } from "lucide-react";

export type EvidenceStatus = "verified" | "needs_review" | "flagged" | "pending" | "rejected";

const META: Record<EvidenceStatus, { label: string; cls: string; Icon: LucideIcon }> = {
  verified: { label: "Verified", cls: "badge-verified", Icon: ShieldCheck },
  needs_review: { label: "Needs review", cls: "badge-review", Icon: AlertCircle },
  flagged: { label: "Flagged", cls: "badge-flagged", Icon: OctagonAlert },
  rejected: { label: "Rejected", cls: "badge-flagged", Icon: XCircle },
  pending: { label: "Pending", cls: "badge-neutral", Icon: Clock },
};

export function normalizeStatus(s: string | null | undefined): EvidenceStatus {
  return s && s in META ? (s as EvidenceStatus) : "pending";
}

/** Status is always icon + label + border pattern (solid / dashed / double), never colour alone. */
export function StatusBadge({ status, className = "" }: { status: string | null | undefined; className?: string }) {
  const { label, cls, Icon } = META[normalizeStatus(status)];
  return (
    <span className={`badge ${cls} ${className}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  );
}

export const STATUS_STRIPE: Record<EvidenceStatus, string> = {
  verified: "stripe-verified",
  needs_review: "stripe-review",
  flagged: "stripe-flagged",
  rejected: "stripe-flagged",
  pending: "bg-cloud-200",
};
