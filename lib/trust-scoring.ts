// Pure scoring math shared by the server trust engine and the browser-side explainer.

export type TrustStatus = "verified" | "needs_review" | "flagged";

export const VERIFIED_MIN = 80;
export const FLAGGED_BELOW = 50;
export const NO_EXIF_GPS_CAP = 79;
export const HARD_FLAG_CAP = 40;

export function finalizeTrust(
  signals: { score: number; weight: number }[],
  opts: { hasExifGps: boolean; hardFlag: boolean }
): { score: number; status: TrustStatus; capped: "hard_flag" | "no_exif_gps" | null } {
  const totalWeight = signals.reduce((acc, s) => acc + s.weight, 0);
  const weighted = signals.reduce((acc, s) => acc + s.score * s.weight, 0);
  let score = totalWeight ? Math.round((weighted / totalWeight) * 100) : 0;

  let capped: "hard_flag" | "no_exif_gps" | null = null;
  if (!opts.hasExifGps && score > NO_EXIF_GPS_CAP) {
    score = NO_EXIF_GPS_CAP;
    capped = "no_exif_gps";
  }
  if (opts.hardFlag && score > HARD_FLAG_CAP) {
    score = HARD_FLAG_CAP;
    capped = "hard_flag";
  }

  const status: TrustStatus = score >= VERIFIED_MIN ? "verified" : score < FLAGGED_BELOW ? "flagged" : "needs_review";
  return { score, status, capped };
}
