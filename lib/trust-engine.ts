import { supabase } from "@/lib/db";
import { phashHexToSignedBigInt } from "@/lib/phash";
import { extractGps, type GpsFix } from "@/lib/geo";
import { finalizeTrust } from "@/lib/trust-scoring";

const GEOFENCE_TOLERANCE_M = 150;

export interface TrustSignal {
  id: string;
  name: string;
  score: number;
  weight: number;
  hardFlag?: boolean;
  reason?: string;
}

export interface GeoAssessment {
  status: "in_geofence" | "outside_geofence" | "no_gps" | "inferred";
  distanceM: number | null;
}

export interface TrustResult {
  score: number;
  status: "verified" | "needs_review" | "flagged";
  signals: TrustSignal[];
  geo: GeoAssessment;
  gps: GpsFix | null;
}

export interface TrustOptions {
  selfEvidenceId?: string;
  siteId?: string | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function computeTrustScore(
  uploadPayload: any,
  vision: any,
  { selfEvidenceId, siteId }: TrustOptions = {}
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

  // P3: Geofence containment. EXIF GPS presence (tag from the eval gate) gates the score cap below;
  // when a fix and a site are known, PostGIS decides inside / near / outside the site geofence.
  const hasGps = !tags.includes("no_gps");
  const gps = extractGps(uploadPayload);
  let geo: GeoAssessment = { status: gps || hasGps ? "inferred" : "no_gps", distanceM: null };
  let p3Score = hasGps ? 1.0 : 0.0;
  let p3Reason: string | undefined = hasGps ? undefined : "No EXIF GPS on the image.";
  let p3HardFlag = false;

  if (gps && siteId) {
    const { data, error } = await supabase.rpc("check_site_geofence", {
      p_site_id: siteId,
      p_lng: gps.lng,
      p_lat: gps.lat,
    });
    const row = (Array.isArray(data) ? data[0] : data) as { inside: boolean; distance_m: number } | null;
    if (error) {
      console.error("check_site_geofence failed (is the migration applied?):", error.message);
    } else if (row) {
      const src = gps.source === "exif" ? "EXIF" : "app-reported";
      if (row.inside) {
        p3Score = 1.0;
        p3Reason = undefined;
        geo = { status: "in_geofence", distanceM: 0 };
      } else if (row.distance_m <= GEOFENCE_TOLERANCE_M) {
        p3Score = 0.7;
        p3Reason = `${src} GPS is ${Math.round(row.distance_m)} m outside the site geofence (within ${GEOFENCE_TOLERANCE_M} m tolerance).`;
        geo = { status: "outside_geofence", distanceM: row.distance_m };
      } else {
        p3Score = 0.0;
        p3Reason = `${src} GPS is ${Math.round(row.distance_m)} m outside the site geofence.`;
        geo = { status: "outside_geofence", distanceM: row.distance_m };
        // A photo taken well away from the site cannot support a claim about the site.
        hardFlag = true;
        p3HardFlag = true;
      }
    }
  }
  signals.push({
    id: "P3",
    name: "Geofence Containment",
    score: p3Score,
    weight: 10,
    reason: p3Reason,
    ...(p3HardFlag ? { hardFlag: true } : {}),
  });

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

  const { score: finalScore, status } = finalizeTrust(signals, { hasExifGps: hasGps, hardFlag });

  return { score: finalScore, status, signals, geo, gps };
}
