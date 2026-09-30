export type EvidenceStatus = "pending" | "verified" | "needs_review" | "flagged" | "rejected";

export interface CoverageInput {
  expected: number;
  statuses: EvidenceStatus[];
}

export type Strength = "strong" | "moderate" | "weak";

export interface Coverage {
  verified: number;
  pending: number; // awaiting review
  flagged: number; // flagged or rejected
  missing: number; // verified assets still needed
  coverage: number; // 0..1
  strength: Strength;
}

/**
 * How well the available evidence supports a claim. Only verified assets count:
 * a flagged or unreviewed photo adds nothing to coverage, which is the point.
 */
export function computeCoverage({ expected, statuses }: CoverageInput): Coverage {
  const count = (...s: EvidenceStatus[]) => statuses.filter((x) => s.includes(x)).length;
  const verified = count("verified");
  const coverage = expected > 0 ? Math.min(1, verified / expected) : 0;
  return {
    verified,
    pending: count("pending", "needs_review"),
    flagged: count("flagged", "rejected"),
    missing: Math.max(0, expected - verified),
    coverage,
    strength: coverage >= 0.8 ? "strong" : coverage >= 0.5 ? "moderate" : "weak",
  };
}
