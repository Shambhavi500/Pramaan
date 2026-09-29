import { supabase } from "@/lib/db";
import { phashHexToSignedBigInt } from "@/lib/phash";

export interface TrustSignal {
  id: string;
  name: string;
  score: number;
  weight: number;
  hardFlag?: boolean;
  reason?: string;
}

export interface TrustResult {
  score: number;
  status: "verified" | "needs_review" | "flagged";
  signals: TrustSignal[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function computeTrustScore(
  uploadPayload: any,
  vision: any,
  selfEvidenceId?: string
): Promise<TrustResult> {
  const signals: TrustSignal[] = [];
  let hardFlag = false;

  const md = uploadPayload.media_metadata || {};
  const tags: string[] = uploadPayload.tags || [];

  // P1: Channel Provenance
  const hasClientHash = Boolean(uploadPayload.context?.custom?.client_sha256);
  signals.push({ id: "P1", name: "Channel Provenance", score: hasClientHash ? 1.0 : 0.6, weight: 10 });

  // P2: EXIF Capture Time
  const hasExifTime = Boolean(md.DateTimeOriginal || md.CreateDate);
  signals.push({ id: "P2", name: "EXIF Timestamp", score: hasExifTime ? 1.0 : 0.0, weight: 5 });

  // P3: GPS presence (tag set by the in-upload eval gate)
  const hasGps = !tags.includes("no_gps");
  signals.push({ id: "P3", name: "Geofence Containment", score: hasGps ? 1.0 : 0.0, weight: 10 });

  // I1: pHash near-duplicate search (excluding the asset itself, e.g. on webhook redelivery)
  const currentPhash: string | undefined = uploadPayload.phash;
  if (currentPhash) {
    const { data } = await supabase.rpc("match_phash_candidates", {
      target_phash: phashHexToSignedBigInt(currentPhash),
      max_distance: 10,
    });
    const duplicates = ((data as { id: string; distance: number }[] | null) ?? []).filter(
      (d) => d.id !== selfEvidenceId
    );

    if (duplicates.length > 0) {
      const minDistance = duplicates[0].distance;
      if (minDistance <= 4) {
        hardFlag = true;
        signals.push({
          id: "I1",
          name: "Perceptual Hash Reuse",
          score: 0.0,
          weight: 15,
          hardFlag: true,
          reason: `Recycled asset detected. Matches evidence ${duplicates[0].id} with Hamming distance ${minDistance}.`,
        });
      } else {
        signals.push({ id: "I1", name: "Perceptual Hash Reuse", score: 0.5, weight: 15 });
      }
    } else {
      signals.push({ id: "I1", name: "Perceptual Hash Reuse", score: 1.0, weight: 15 });
    }
  }

  // I2: Screen recapture detection
  if (vision.recapture_suspected) {
    hardFlag = true;
    signals.push({
      id: "I2",
      name: "Screen Recapture",
      score: 0.0,
      weight: 10,
      hardFlag: true,
      reason: "Moire interference patterns or display bezel detected in photo.",
    });
  } else {
    signals.push({ id: "I2", name: "Screen Recapture", score: 1.0, weight: 10 });
  }

  // I3: Synthetic AI markers
  if (vision.synthetic_suspected) {
    signals.push({
      id: "I3",
      name: "Synthetic Generation",
      score: 0.2,
      weight: 5,
      reason: "Algorithmic generation cues observed by perception model.",
    });
  } else {
    signals.push({ id: "I3", name: "Synthetic Generation", score: 1.0, weight: 5 });
  }

  // R1: Activity claim match
  const claimScore =
    vision.activity_matches_claim === "yes" ? 1.0 : vision.activity_matches_claim === "uncertain" ? 0.5 : 0.0;
  signals.push({ id: "R1", name: "Activity Claim Match", score: claimScore, weight: 12 });

  // Q1: Image quality & focus
  signals.push({ id: "Q1", name: "Focus & Quality", score: tags.includes("blurry") ? 0.3 : 1.0, weight: 6 });

  const totalWeight = signals.reduce((acc, s) => acc + s.weight, 0);
  const weightedScore = signals.reduce((acc, s) => acc + s.score * s.weight, 0);
  let finalScore = Math.round((weightedScore / totalWeight) * 100);

  // Hard caps
  if (!hasGps && finalScore > 79) finalScore = 79;
  if (hardFlag && finalScore > 40) finalScore = 40;

  let status: TrustResult["status"] = "needs_review";
  if (finalScore >= 80) status = "verified";
  else if (finalScore < 50) status = "flagged";

  return { score: finalScore, status, signals };
}
