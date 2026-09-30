import { createHash } from "node:crypto";
import { finalizeTrust, type TrustStatus } from "@/lib/trust-scoring";
import type { DerivativeClass } from "@/lib/transformations";
import { computeCoverage } from "@/lib/coverage";
import { DEMO_ORG_SLUG, DEMO_SITE_CODE, DEMO_SITE_NAME, DEMO_UPLOAD_FOLDER } from "@/lib/demo-site";
import type { Activity, Phase } from "@/lib/activities";

/**
 * Demo dataset: JalSetu Foundation, Jal Jeevan programme, Check Dam JH-04, Jhabua (fictional).
 *
 * Everything an evidence row needs to agree with itself is derived here rather than typed twice:
 *  - the geofence status and distance come from the site polygon and the GPS fix,
 *  - pHash values are generated so the Hamming distances are what the trust signals say,
 *  - each trust score and status comes from the same weights and caps as lib/trust-engine.ts,
 *  - the report text takes its dates and IDs from the evidence rows it cites.
 * Nothing here is a measured impact number (no litres, hectares or households).
 *
 * The rows describe photographs. The image files themselves are NOT created by the seed: upload them
 * to `cld_public_id` (see docs/demo-jh04.md) before the review, compare and search screens can show pixels.
 */

/* ---------- org, project, site ---------- */

export const DEMO_ORG = { slug: DEMO_ORG_SLUG, name: "JalSetu Foundation", kind: "ngo" as const };

export const DEMO_PROJECT = {
  code: "jal-jeevan-jh",
  name: "Jal Jeevan: Jhabua Check Dams",
  summary: "Check dams that hold monsoon runoff for tribal hamlets in Jhabua district.",
  funder: "Bharat Sahyog CSR (fictional)",
  start_date: "2026-05-01",
  end_date: "2026-12-31",
  sdgs: ["SDG6", "SDG13", "SDG15"],
};

// Placeholder coordinates near Jhabua town, Madhya Pradesh. Replace with the surveyed site if one exists.
const CENTER = { lng: 74.5921, lat: 22.7712 };
const HALF = { lng: 0.0011, lat: 0.0009 }; // roughly 113 m by 100 m
export const GEOFENCE_BOX = {
  minLng: CENTER.lng - HALF.lng,
  maxLng: CENTER.lng + HALF.lng,
  minLat: CENTER.lat - HALF.lat,
  maxLat: CENTER.lat + HALF.lat,
};
const GEOFENCE_TOLERANCE_M = 150; // same tolerance as lib/trust-engine.ts

export const DEMO_SITE = {
  code: DEMO_SITE_CODE,
  name: DEMO_SITE_NAME,
  village: "Nayapura",
  district: "Jhabua",
  state: "Madhya Pradesh",
  setting: "rural_field",
  center: `SRID=4326;POINT(${CENTER.lng} ${CENTER.lat})`,
  radius_m: 150,
  geofence:
    `SRID=4326;POLYGON((${GEOFENCE_BOX.minLng} ${GEOFENCE_BOX.minLat}, ${GEOFENCE_BOX.maxLng} ${GEOFENCE_BOX.minLat}, ` +
    `${GEOFENCE_BOX.maxLng} ${GEOFENCE_BOX.maxLat}, ${GEOFENCE_BOX.minLng} ${GEOFENCE_BOX.maxLat}, ` +
    `${GEOFENCE_BOX.minLng} ${GEOFENCE_BOX.minLat}))`,
};

function haversineM(a: { lng: number; lat: number }, b: { lng: number; lat: number }): number {
  const R = 6371008.8;
  const rad = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Metres from the (axis-aligned) site polygon; 0 when inside. */
export function distanceToGeofenceM(p: { lng: number; lat: number }): number {
  const clamped = {
    lng: Math.min(Math.max(p.lng, GEOFENCE_BOX.minLng), GEOFENCE_BOX.maxLng),
    lat: Math.min(Math.max(p.lat, GEOFENCE_BOX.minLat), GEOFENCE_BOX.maxLat),
  };
  return haversineM(p, clamped);
}

/* ---------- evidence specs ---------- */

type Channel = "field_app" | "bulk_import" | "whatsapp";
type Match = "yes" | "no" | "uncertain";
type Setting = "rural_field" | "forest" | "urban" | "indoor" | "construction_site";

interface VisionSpec {
  activity: Activity;
  match: Match;
  counts: { saplings: number; structures: number; people: number };
  peoplePresent: boolean;
  minorsLikely: boolean;
  visibleText: string;
  recaptureCues?: string[];
  syntheticCues?: string[];
  setting: Setting;
  summary: string;
}

interface EvidenceSpec {
  key: string;
  /** Which of the twelve problem-statement cases this row exists to demonstrate. */
  case: string;
  phase: Phase;
  /** Activity the uploader claims; defaults to check dam construction. */
  claimed?: Activity;
  capturedAt: string; // ISO with the local +05:30 offset
  channel: Channel;
  device: string | null;
  software: string | null;
  exifTime: boolean;
  gps: { lng: number; lat: number; accuracyM: number } | null;
  blurry?: boolean;
  /** pHash is this item's source with `flips` bits changed. Otherwise an independent hash. */
  phashFrom?: { key: string; flips: number };
  consent?: "pending" | "obtained";
  ingestDelayMin?: number;
  vision: VisionSpec;
  /** What the image file should be, so the demo media can be produced. */
  mediaBrief: string;
}

const PHONE = "Samsung SM-A146B";
// Two fixed vantage points, so the before and after photos share a framing.
const DOWNSTREAM = { lng: 74.59185, lat: 22.77085 };
const UPSTREAM_BANK = { lng: 74.59232, lat: 22.77131 };
const fix = (p: { lng: number; lat: number }, accuracyM: number) => ({ ...p, accuracyM });

const SPECS: EvidenceSpec[] = [
  // 1. Baseline
  {
    key: "before_01",
    case: "baseline",
    phase: "before",
    capturedAt: "2026-05-12T10:14:00+05:30",
    channel: "field_app",
    device: PHONE,
    software: null,
    exifTime: true,
    gps: fix(DOWNSTREAM, 6),
    vision: {
      activity: "check_dam_construction",
      match: "yes",
      counts: { saplings: 0, structures: 0, people: 0 },
      peoplePresent: false,
      minorsLikely: false,
      visibleText: "JH-04",
      setting: "rural_field",
      summary:
        "Dry gully bed with exposed stones, looking upstream from the planned dam alignment. A survey stake tagged JH-04 is visible. No masonry structure yet.",
    },
    mediaBrief: "Wide shot of a dry gully from the downstream side of the planned alignment; survey stake in frame.",
  },
  {
    key: "before_02",
    case: "baseline",
    phase: "before",
    capturedAt: "2026-05-12T10:31:00+05:30",
    channel: "field_app",
    device: PHONE,
    software: null,
    exifTime: true,
    gps: fix(UPSTREAM_BANK, 5),
    vision: {
      activity: "check_dam_construction",
      match: "uncertain",
      counts: { saplings: 0, structures: 0, people: 0 },
      peoplePresent: false,
      minorsLikely: false,
      visibleText: "",
      setting: "rural_field",
      summary: "Dry channel bed and scrub on both banks, seen from the upstream side. No construction visible, so the claimed activity cannot be confirmed from this frame alone.",
    },
    mediaBrief: "Same dry channel from the upstream bank, no structure visible.",
  },
  // 2. Construction / restoration
  {
    key: "during_01",
    case: "construction",
    phase: "during",
    capturedAt: "2026-06-18T11:02:00+05:30",
    channel: "field_app",
    device: PHONE,
    software: null,
    exifTime: true,
    gps: fix(DOWNSTREAM, 5),
    vision: {
      activity: "check_dam_construction",
      match: "yes",
      counts: { saplings: 0, structures: 1, people: 0 },
      peoplePresent: false,
      minorsLikely: false,
      visibleText: "JalSetu Foundation | Jal Jeevan | JH-04",
      setting: "construction_site",
      summary:
        "Excavated foundation trench across the gully with stacked stone and cement bags beside it. A project board reading JH-04 is in frame.",
    },
    mediaBrief: "Foundation trench across the gully, stone and cement bags, project board readable.",
  },
  {
    key: "during_02",
    case: "construction",
    phase: "during",
    capturedAt: "2026-07-09T09:47:00+05:30",
    channel: "field_app",
    device: PHONE,
    software: null,
    exifTime: true,
    gps: fix(DOWNSTREAM, 6),
    consent: "pending",
    vision: {
      activity: "check_dam_construction",
      match: "yes",
      counts: { saplings: 0, structures: 1, people: 4 },
      peoplePresent: true,
      minorsLikely: false,
      visibleText: "JH-04",
      setting: "construction_site",
      summary: "Masonry wall rising across the gully with four workers laying stone. Faces are identifiable, so delivery URLs pixelate them until consent is recorded.",
    },
    mediaBrief: "Partly built masonry wall with a few workers in frame (faces visible, to exercise redaction).",
  },
  // 3. After / impact
  {
    key: "after_01",
    case: "after",
    phase: "after",
    capturedAt: "2026-09-15T10:20:00+05:30",
    channel: "field_app",
    device: PHONE,
    software: null,
    exifTime: true,
    gps: fix(DOWNSTREAM, 5),
    vision: {
      activity: "check_dam_construction",
      match: "yes",
      counts: { saplings: 0, structures: 1, people: 0 },
      peoplePresent: false,
      minorsLikely: false,
      visibleText: "JH-04",
      setting: "rural_field",
      summary:
        "Completed masonry wall with spillway, same framing as the 12 May baseline. Standing water is visible upstream of the wall and the survey stake tagged JH-04 is still in view.",
    },
    mediaBrief: "Completed wall and spillway from the SAME vantage as before_01, water pooled upstream.",
  },
  {
    key: "after_02",
    case: "after",
    phase: "after",
    capturedAt: "2026-09-15T10:36:00+05:30",
    channel: "field_app",
    device: PHONE,
    software: null,
    exifTime: true,
    gps: fix(UPSTREAM_BANK, 5),
    vision: {
      activity: "check_dam_construction",
      match: "yes",
      counts: { saplings: 0, structures: 1, people: 0 },
      peoplePresent: false,
      minorsLikely: false,
      visibleText: "",
      setting: "rural_field",
      summary: "Water pooled behind the finished wall, photographed from the upstream bank; the same bank as the 12 May upstream baseline.",
    },
    mediaBrief: "Impounded water behind the wall from the upstream bank (same spot as before_02).",
  },
  // 4. Missing GPS
  {
    key: "after_nogps",
    case: "missing_gps",
    phase: "after",
    capturedAt: "2026-09-16T11:12:00+05:30",
    channel: "field_app",
    device: PHONE,
    software: null,
    exifTime: true,
    gps: null,
    vision: {
      activity: "check_dam_construction",
      match: "yes",
      counts: { saplings: 0, structures: 1, people: 0 },
      peoplePresent: false,
      minorsLikely: false,
      visibleText: "",
      setting: "rural_field",
      summary: "Finished check dam wall with water upstream. Looks consistent with the site, but the file carries no GPS position (location was off at capture).",
    },
    mediaBrief: "A genuine after photo of the dam captured (or exported) with GPS EXIF removed.",
  },
  // 5. Wrong geofence
  {
    key: "after_wronggeo",
    case: "wrong_geofence",
    phase: "after",
    capturedAt: "2026-09-17T15:30:00+05:30",
    channel: "field_app",
    device: PHONE,
    software: null,
    exifTime: true,
    gps: { lng: 74.592, lat: 22.829, accuracyM: 8 },
    vision: {
      activity: "farm_pond",
      match: "no",
      counts: { saplings: 0, structures: 1, people: 0 },
      peoplePresent: false,
      minorsLikely: false,
      visibleText: "",
      setting: "rural_field",
      summary: "A lined farm pond with an earthen bund. This is not a check dam across a gully, and the GPS fix is in a different village.",
    },
    mediaBrief: "A farm pond photo (any pond) so the scene contradicts the claimed check dam.",
  },
  // 6. Duplicate / reused
  {
    key: "after_reuse",
    case: "duplicate",
    phase: "after",
    capturedAt: "2026-09-22T14:05:00+05:30",
    channel: "bulk_import",
    device: null,
    software: null,
    exifTime: false,
    gps: null,
    phashFrom: { key: "after_02", flips: 2 },
    ingestDelayMin: 20,
    vision: {
      activity: "check_dam_construction",
      match: "yes",
      counts: { saplings: 0, structures: 1, people: 0 },
      peoplePresent: false,
      minorsLikely: false,
      visibleText: "",
      setting: "rural_field",
      summary: "Water pooled behind a finished wall, seen from the upstream bank. Visually near-identical to an earlier after photo of this site.",
    },
    mediaBrief: "after_02 re-saved with lower JPEG quality and a small resize, metadata stripped, uploaded again via bulk import.",
  },
  // 7. Screen recapture
  {
    key: "after_recapture",
    case: "screen_recapture",
    phase: "after",
    capturedAt: "2026-09-22T14:20:00+05:30",
    channel: "field_app",
    device: PHONE,
    software: null,
    exifTime: true,
    gps: null,
    vision: {
      activity: "check_dam_construction",
      match: "yes",
      counts: { saplings: 0, structures: 1, people: 0 },
      peoplePresent: false,
      minorsLikely: false,
      visibleText: "",
      recaptureCues: ["moire banding across the sky region", "monitor bezel visible along the lower edge"],
      setting: "indoor",
      summary: "A check dam with water behind it, but the frame is a photograph of a monitor: moire banding and a screen bezel are visible.",
    },
    mediaBrief: "A phone photo of a laptop screen displaying some check dam image. Bezel at the edge, moire visible.",
  },
  // 8. Low quality
  {
    key: "during_lowq",
    case: "low_quality",
    phase: "during",
    capturedAt: "2026-08-04T16:40:00+05:30",
    channel: "whatsapp",
    device: null,
    software: null,
    exifTime: false,
    gps: null,
    blurry: true,
    ingestDelayMin: 18 * 60,
    vision: {
      activity: "check_dam_construction",
      match: "yes",
      counts: { saplings: 0, structures: 1, people: 0 },
      peoplePresent: false,
      minorsLikely: false,
      visibleText: "",
      setting: "construction_site",
      summary: "Blurred, low-light view of the wall and spillway apron under construction. Forwarded through a messaging app, so capture time and position were stripped.",
    },
    mediaBrief: "Small, blurry, compressed photo of the wall (as a WhatsApp forward would look). No EXIF.",
  },
  // 9. AI-generated / transformed
  {
    key: "after_ai_edit",
    case: "ai_transformed",
    phase: "after",
    capturedAt: "2026-09-24T12:00:00+05:30",
    channel: "bulk_import",
    device: null,
    software: "Generative Fill (AI edit)",
    exifTime: false,
    gps: null,
    phashFrom: { key: "after_01", flips: 7 },
    ingestDelayMin: 30,
    vision: {
      activity: "check_dam_construction",
      match: "yes",
      counts: { saplings: 0, structures: 1, people: 0 },
      peoplePresent: false,
      minorsLikely: false,
      visibleText: "",
      syntheticCues: ["water surface has repeated, over-smooth texture", "wall edge blends into the background without a real shadow"],
      setting: "rural_field",
      summary: "A check dam with water upstream that closely resembles the 15 Sep after photo, but with a re-painted water surface and no camera metadata.",
    },
    mediaBrief: "after_01 run through a generative-fill tool to 'improve' the water, exported without EXIF.",
  },
  // 10. Vegetation (baseline and after)
  {
    key: "before_veg",
    case: "vegetation",
    phase: "before",
    claimed: "other",
    capturedAt: "2026-05-12T10:52:00+05:30",
    channel: "field_app",
    device: PHONE,
    software: null,
    exifTime: true,
    gps: fix({ lng: 74.59196, lat: 22.77152 }, 6),
    vision: {
      activity: "other",
      match: "yes",
      counts: { saplings: 0, structures: 0, people: 0 },
      peoplePresent: false,
      minorsLikely: false,
      visibleText: "",
      setting: "rural_field",
      summary: "Bare, dry scrub on the east bank of the gully with exposed soil and little ground cover. Pre-monsoon baseline for vegetation.",
    },
    mediaBrief: "East bank of the gully: dry scrub and bare soil, pre-monsoon.",
  },
  {
    key: "after_veg",
    case: "vegetation",
    phase: "after",
    claimed: "other",
    capturedAt: "2026-09-15T11:05:00+05:30",
    channel: "field_app",
    device: PHONE,
    software: null,
    exifTime: true,
    gps: fix({ lng: 74.59196, lat: 22.77152 }, 5),
    vision: {
      activity: "other",
      match: "yes",
      counts: { saplings: 0, structures: 0, people: 0 },
      peoplePresent: false,
      minorsLikely: false,
      visibleText: "",
      setting: "rural_field",
      summary: "Same east bank as the 12 May baseline, now with continuous green grass and shrub cover. One post-monsoon photo cannot show a trend on its own.",
    },
    mediaBrief: "Same east-bank spot as before_veg after the monsoon: green grass and shrub cover.",
  },
  // 11. Monitoring
  {
    key: "monitoring_01",
    case: "monitoring",
    phase: "monitoring",
    capturedAt: "2026-09-28T09:30:00+05:30",
    channel: "field_app",
    device: PHONE,
    software: null,
    exifTime: true,
    gps: fix(DOWNSTREAM, 5),
    vision: {
      activity: "check_dam_construction",
      match: "yes",
      counts: { saplings: 0, structures: 1, people: 0 },
      peoplePresent: false,
      minorsLikely: false,
      visibleText: "JH-04",
      setting: "rural_field",
      summary: "Same framing as the 15 Sep after photo, taken 13 days later. Water is still visible upstream of an intact wall and spillway.",
    },
    mediaBrief: "Same vantage as after_01, two weeks later; water still standing behind the wall.",
  },
  // 12. Community, with consent on file
  {
    key: "during_community",
    case: "community",
    phase: "during",
    capturedAt: "2026-07-09T14:10:00+05:30",
    channel: "field_app",
    device: PHONE,
    software: null,
    exifTime: true,
    gps: fix(DOWNSTREAM, 6),
    consent: "obtained",
    vision: {
      activity: "check_dam_construction",
      match: "yes",
      counts: { saplings: 0, structures: 1, people: 6 },
      peoplePresent: true,
      minorsLikely: false,
      visibleText: "",
      setting: "construction_site",
      summary: "Six local workers posed in front of the partly built wall at the end of the shift. Written consent for use of their images is on file.",
    },
    mediaBrief: "Group photo of workers in front of the partly built wall (faces visible; consent recorded).",
  },
];

/* ---------- derived evidence rows ---------- */

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const evidenceId = (key: string) => `ev_jh04_${key}`;

function baseHash(key: string): bigint {
  return BigInt("0x" + sha(`pramaan-demo-phash:${key}`).slice(0, 16));
}

function phashOf(key: string, byKey: Map<string, EvidenceSpec>): bigint {
  const spec = byKey.get(key)!;
  if (!spec.phashFrom) return baseHash(key);
  let h = phashOf(spec.phashFrom.key, byKey);
  // Flip a fixed, spread-out set of bit positions so the distance is exactly `flips`.
  for (let i = 0; i < spec.phashFrom.flips; i++) h ^= 1n << BigInt((i * 9 + 3) % 64);
  return h;
}

export function hamming(a: bigint, b: bigint): number {
  let x = BigInt.asUintN(64, a ^ b);
  let n = 0;
  while (x) {
    n += Number(x & 1n);
    x >>= 1n;
  }
  return n;
}

export interface DemoSignal {
  id: string;
  name: string;
  score: number;
  weight: number;
  hardFlag?: boolean;
  reason?: string;
}

export interface DemoEvidence {
  key: string;
  case: string;
  mediaBrief: string;
  row: Record<string, unknown> & { id: string; cld_public_id: string; cld_version: number; trust_status: string; trust_score: number };
  understanding: {
    evidence_id: string;
    ai_vision: Record<string, unknown>;
    caption: string;
    activity_detected: string;
    activity_matches_claim: string;
  };
  signals: DemoSignal[];
  capturedAt: string;
  geoDistanceM: number | null;
  duplicateOf: { id: string; distance: number } | null;
}

const ISO = (ms: number) => new Date(ms).toISOString();

export function buildDemoEvidence(): DemoEvidence[] {
  const byKey = new Map(SPECS.map((s) => [s.key, s]));
  const hashes = new Map(SPECS.map((s) => [s.key, phashOf(s.key, byKey)]));

  return SPECS.map((spec) => {
    const id = evidenceId(spec.key);
    const captured = Date.parse(spec.capturedAt);
    const ingested = captured + (spec.ingestDelayMin ?? 3) * 60_000;
    const v = spec.vision;
    const signals: DemoSignal[] = [];
    let hardFlag = false;

    signals.push({ id: "P1", name: "Channel Provenance", score: spec.channel === "field_app" ? 1 : 0.6, weight: 10 });
    signals.push({ id: "P2", name: "EXIF Timestamp", score: spec.exifTime ? 1 : 0, weight: 5 });

    // P3: same tiers as the engine (inside, within tolerance, outside; no GPS scores zero).
    let geo: "in_geofence" | "outside_geofence" | "no_gps" = "no_gps";
    let distance: number | null = null;
    let p3 = 0;
    let p3Reason: string | undefined = "No EXIF GPS on the image.";
    let p3Hard = false;
    if (spec.gps) {
      distance = distanceToGeofenceM(spec.gps);
      if (distance === 0) {
        geo = "in_geofence";
        p3 = 1;
        p3Reason = undefined;
      } else if (distance <= GEOFENCE_TOLERANCE_M) {
        geo = "outside_geofence";
        p3 = 0.7;
        p3Reason = `EXIF GPS is ${Math.round(distance)} m outside the site geofence (within ${GEOFENCE_TOLERANCE_M} m tolerance).`;
      } else {
        geo = "outside_geofence";
        p3 = 0;
        p3Reason = `EXIF GPS is ${Math.round(distance)} m outside the site geofence.`;
        p3Hard = true; // beyond tolerance is a hard flag, as in lib/trust-engine.ts
        hardFlag = true;
      }
    }
    signals.push({ id: "P3", name: "Geofence Containment", score: p3, weight: 10, reason: p3Reason, ...(p3Hard ? { hardFlag: true } : {}) });

    // I1: nearest earlier upload, as the engine sees the archive at ingest time.
    let duplicateOf: DemoEvidence["duplicateOf"] = null;
    for (const other of SPECS) {
      if (other.key === spec.key || Date.parse(other.capturedAt) >= captured) continue;
      const d = hamming(hashes.get(spec.key)!, hashes.get(other.key)!);
      if (d <= 10 && (!duplicateOf || d < duplicateOf.distance)) duplicateOf = { id: evidenceId(other.key), distance: d };
    }
    if (duplicateOf && duplicateOf.distance <= 4) {
      hardFlag = true;
      signals.push({
        id: "I1",
        name: "Perceptual Hash Reuse",
        score: 0,
        weight: 15,
        hardFlag: true,
        reason: `Recycled asset detected. Matches evidence ${duplicateOf.id} with Hamming distance ${duplicateOf.distance}.`,
      });
    } else {
      signals.push({ id: "I1", name: "Perceptual Hash Reuse", score: duplicateOf ? 0.5 : 1, weight: 15 });
    }

    const recapture = Boolean(v.recaptureCues?.length);
    if (recapture) {
      hardFlag = true;
      signals.push({
        id: "I2",
        name: "Screen Recapture",
        score: 0,
        weight: 10,
        hardFlag: true,
        reason: "Moire interference patterns or display bezel detected in photo.",
      });
    } else {
      signals.push({ id: "I2", name: "Screen Recapture", score: 1, weight: 10 });
    }

    const synthetic = Boolean(v.syntheticCues?.length);
    signals.push(
      synthetic
        ? { id: "I3", name: "Synthetic Generation", score: 0.2, weight: 5, reason: "Algorithmic generation cues observed by perception model." }
        : { id: "I3", name: "Synthetic Generation", score: 1, weight: 5 }
    );

    signals.push({
      id: "R1",
      name: "Activity Claim Match",
      score: v.match === "yes" ? 1 : v.match === "uncertain" ? 0.5 : 0,
      weight: 12,
    });
    signals.push({ id: "Q1", name: "Focus & Quality", score: spec.blurry ? 0.3 : 1, weight: 6 });

    const { score, status } = finalizeTrust(signals, { hasExifGps: spec.gps !== null, hardFlag });
    // The AI-edited export is rejected by a reviewer (see DEMO_REVIEWS); the engine alone leaves it in the queue.
    const finalStatus: TrustStatus | "rejected" = REVIEWED[spec.key]?.decision === "rejected" ? "rejected" : status;

    const fieldApp = spec.channel === "field_app";
    const sha256 = sha(`pramaan-demo-file:${spec.key}`);
    const people = v.minorsLikely ? ["has_people", "minors_likely"] : v.peoplePresent ? ["has_people"] : [];
    const publicId = `${DEMO_UPLOAD_FOLDER}/${spec.key}`;
    const version = Math.floor(ingested / 1000);

    const aiVision = {
      activity: v.activity,
      activity_matches_claim: v.match,
      visible_counts: v.counts,
      people: { present: v.peoplePresent, minors_likely: v.minorsLikely },
      visible_text: v.visibleText,
      recapture_suspected: recapture,
      recapture_cues: v.recaptureCues ?? [],
      synthetic_suspected: synthetic,
      synthetic_cues: v.syntheticCues ?? [],
      setting: v.setting,
      scene_summary: v.summary,
      trust_signals: signals,
      // Marks this as authored demo data, like `fallback` marks a degraded real analysis.
      demo_seed: true,
    };

    return {
      key: spec.key,
      case: spec.case,
      mediaBrief: spec.mediaBrief,
      capturedAt: spec.capturedAt,
      geoDistanceM: distance,
      duplicateOf,
      signals,
      row: {
        id,
        cld_asset_id: `demo_jh04_${spec.key}`,
        cld_public_id: publicId,
        cld_version: version,
        resource_type: "image",
        format: "jpg",
        // Placeholder file facts; a real upload replaces them through the webhook.
        bytes: spec.blurry ? 141_000 : 2_100_000 + (Number(baseHash(spec.key) % 1_200_000n)),
        width: spec.blurry ? 1280 : 4032,
        height: spec.blurry ? 960 : 3024,
        etag: sha(`pramaan-demo-etag:${spec.key}`).slice(0, 32),
        source_channel: spec.channel,
        // Non-field-app rows have no device hash; the analyze job falls back to the etag, so do the same.
        client_sha256: fieldApp ? sha256 : sha(`pramaan-demo-etag:${spec.key}`).slice(0, 32),
        app_capture_time: fieldApp ? ISO(captured) : null,
        exif_time: spec.exifTime ? ISO(captured) : null,
        device: spec.device,
        software: spec.software,
        gps: spec.gps ? `SRID=4326;POINT(${spec.gps.lng} ${spec.gps.lat})` : null,
        gps_accuracy_m: spec.gps?.accuracyM ?? null,
        geo_status: geo,
        phase: spec.phase,
        activity_claimed: spec.claimed ?? "check_dam_construction",
        phash: BigInt.asIntN(64, hashes.get(spec.key)!).toString(),
        trust_score: score,
        trust_status: finalStatus,
        consent_status: spec.consent ?? (people.length ? "pending" : "not_required"),
        people_flags: people,
        created_at: ISO(ingested),
      },
      understanding: {
        evidence_id: id,
        ai_vision: aiVision,
        caption: v.summary,
        activity_detected: v.activity,
        activity_matches_claim: v.match,
      },
    };
  });
}

/* ---------- review, claim, pair ---------- */

const REVIEWED: Record<string, { decision: "rejected"; reason: string; previous: TrustStatus } | undefined> = {
  after_ai_edit: {
    decision: "rejected",
    previous: "needs_review",
    reason:
      "Generative-fill edit of ev_jh04_after_01 (pHash within 7 bits, editing software recorded, EXIF and GPS stripped). AI-altered pixels are not admissible as evidence.",
  },
};

export const DEMO_REVIEWS = Object.entries(REVIEWED).flatMap(([key, r]) =>
  r ? [{ evidence_id: evidenceId(key), decision: r.decision, reason: r.reason, previous_status: r.previous }] : []
);

export interface DemoClaim {
  id: string;
  statement: string;
  activity: string;
  /** Verified assets the evidence protocol asks for. Only verified assets count towards coverage. */
  expected_evidence: number;
  /** Everything the programme offered for the claim, good and bad. */
  evidenceKeys: string[];
}

export const DEMO_CLAIMS: DemoClaim[] = [
  {
    id: "cl_01",
    statement: "Check dam JH-04 was constructed at the surveyed site.",
    activity: "check_dam_construction",
    // Protocol: baseline, two construction stages, workers on site, completed structure.
    expected_evidence: 5,
    evidenceKeys: ["before_01", "during_01", "during_02", "during_community", "after_01", "during_lowq"],
  },
  {
    id: "cl_02",
    statement: "Check dam JH-04 was holding water after the 2026 monsoon.",
    activity: "check_dam_construction",
    // Protocol: 2 baseline, 2 after and 2 monitoring photos.
    expected_evidence: 6,
    evidenceKeys: [
      "before_02",
      "after_01",
      "after_02",
      "monitoring_01",
      "after_nogps",
      "after_wronggeo",
      "after_reuse",
      "after_recapture",
      "after_ai_edit",
    ],
  },
  {
    id: "cl_03",
    statement: "Vegetation on the banks around JH-04 improved after construction.",
    activity: "other",
    // Protocol: 3 baseline and 3 after photos across seasons. Only one pair exists so far.
    expected_evidence: 6,
    evidenceKeys: ["before_veg", "after_veg"],
  },
];

export const DEMO_CLAIM_EVIDENCE_IDS = Array.from(new Set(DEMO_CLAIMS.flatMap((c) => c.evidenceKeys))).map(evidenceId);

export const DEMO_PAIR = {
  id: "pair_01",
  before_id: evidenceId("before_01"),
  after_id: evidenceId("after_01"),
  // Legacy placeholder from the first seed; nothing in the repo computes it yet.
  candidate_score: 0.9,
  status: "approved" as const,
};

/* ---------- derivatives and story ---------- */

export const DEMO_STORY_ID = "st_jh04_2026";
export const DEMO_STORY_META = { template: "csr_progress", period: "May to Sep 2026" };

export const DEMO_DERIVATIVES: {
  id: string;
  baseKey: string;
  kind: string;
  transformation: string;
  story_id: string | null;
  class: DerivativeClass;
}[] = [
  { id: "dv_8f9a2b", baseKey: "after_01", kind: "card", transformation: "t_public_safe/f_auto/q_auto", story_id: null, class: "redacted" },
  { id: "dv_jh04_thumb", baseKey: "after_01", kind: "social_thumb", transformation: "c_fill,g_auto,w_1080,h_1080/f_auto/q_auto", story_id: null, class: "transcoded" },
  {
    id: "dv_jh04_banner",
    baseKey: "after_02",
    kind: "campaign_banner",
    transformation: "b_gen_fill,c_pad,w_1600,h_900/f_auto/q_auto",
    story_id: DEMO_STORY_ID,
    class: "ai_generated",
  },
];

export function derivativeDeliveryUrl(cloudName: string, transformation: string, publicId: string, version: number) {
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/v${version}/${publicId}.jpg`;
}

const fmtDay = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(iso));

interface Cited {
  text: string;
  evidence_ids: string[];
}

/** Draft report in the shape POST /api/stories stores. Every sentence cites verified evidence only. */
export function buildDemoStory(evidence: DemoEvidence[]) {
  const ev = (k: string) => evidence.find((e) => e.key === k)!;
  const id = (k: string) => ev(k).row.id;
  const day = (k: string) => fmtDay(ev(k).capturedAt);
  const p = (text: string, ...keys: string[]): Cited => ({ text, evidence_ids: keys.map(id) });

  const report = {
    title: "JalSetu Foundation: Check Dam JH-04, Jhabua",
    executive_summary: [
      p(
        `Baseline photographs taken inside the JH-04 geofence on ${day("before_01")} show a dry gully bed and a survey stake, with no masonry structure in place.`,
        "before_01",
        "before_02"
      ),
      p(
        `Photographs from ${day("during_01")} and ${day("during_02")} show construction progressing from a foundation trench to a raised masonry wall.`,
        "during_01",
        "during_02"
      ),
      p(
        `On ${day("after_01")}, photographs from the original vantage point show a completed wall and spillway with standing water upstream.`,
        "before_01",
        "after_01",
        "after_02"
      ),
      p(
        `A monitoring photograph from ${day("monitoring_01")} shows water still standing behind an intact wall.`,
        "monitoring_01"
      ),
    ],
    sections: [
      {
        heading: "Baseline",
        paragraphs: [
          p(
            `Both baseline photographs were captured with the field app on ${day("before_01")}: one from the planned alignment looking upstream, one from the upstream bank.`,
            "before_01",
            "before_02"
          ),
        ],
      },
      {
        heading: "Construction",
        paragraphs: [
          p(`The ${day("during_01")} photograph shows an excavated foundation trench across the gully.`, "during_01"),
          p(
            `By ${day("during_02")} a masonry wall is rising across the gully. Faces are pixelated in delivery until consent is recorded.`,
            "during_02"
          ),
        ],
      },
      {
        heading: "After the 2026 monsoon",
        paragraphs: [
          p(
            `Comparing the same vantage point on ${day("before_01")} and ${day("after_01")}, the dry gully has become a completed wall with a spillway.`,
            "before_01",
            "after_01"
          ),
          p(`The upstream bank photograph of ${day("after_02")} shows water pooled behind the wall.`, "after_02"),
          p(
            `The ${day("monitoring_01")} monitoring photograph repeats the ${day("after_01")} framing with water still present.`,
            "monitoring_01",
            "after_01"
          ),
        ],
      },
      {
        heading: "Vegetation and community",
        paragraphs: [
          p(
            `The east bank was bare scrub on ${day("before_veg")} and carried continuous green cover on ${day("after_veg")}. This is a single photo pair, too little to call a trend.`,
            "before_veg",
            "after_veg"
          ),
          p(`Six workers were photographed on site on ${day("during_community")}, with consent recorded.`, "during_community"),
        ],
      },
    ],
  };

  const paragraphs = [...report.executive_summary, ...report.sections.flatMap((s) => s.paragraphs)];
  const coverage = paragraphs.filter((x) => x.evidence_ids.length > 0).length / paragraphs.length;
  return { report: { ...report, demo_seed: true }, citation_coverage: coverage };
}

/* ---------- ledger plan ---------- */

export interface LedgerPlanEntry {
  subjectType: "evidence" | "derivative" | "story";
  subjectId: string;
  event: string;
  payload: Record<string, unknown>;
}

export function buildLedgerPlan(evidence: DemoEvidence[]): LedgerPlanEntry[] {
  const plan: LedgerPlanEntry[] = [];
  for (const e of [...evidence].sort((a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt))) {
    const analysis = e.understanding.ai_vision;
    plan.push({
      subjectType: "evidence",
      subjectId: e.row.id,
      event: "analyzed",
      payload: {
        // Score and status as the engine produced them, before any human review.
        score: e.row.trust_score,
        status: REVIEWED[e.key] ? REVIEWED[e.key]!.previous : e.row.trust_status,
        activity: analysis.activity,
        claimed_activity: e.row.activity_claimed,
        phase: e.row.phase,
        geo_status: e.row.geo_status,
        geo_distance_m: e.geoDistanceM,
        ai_vision_fallback: false,
        demo_seed: true,
      },
    });
    if (e.row.consent_status === "obtained") {
      plan.push({
        subjectType: "evidence",
        subjectId: e.row.id,
        event: "consent_recorded",
        payload: { consent_status: "obtained", recorded_by: "field_lead", demo_seed: true },
      });
    }
    const review = REVIEWED[e.key];
    if (review) {
      plan.push({
        subjectType: "evidence",
        subjectId: e.row.id,
        event: "human_review",
        payload: {
          decision: review.decision,
          reason: review.reason,
          previous_status: review.previous,
          trust_score: e.row.trust_score,
        },
      });
    }
  }

  for (const d of DEMO_DERIVATIVES) {
    const base = evidence.find((e) => e.key === d.baseKey)!;
    plan.push({
      subjectType: "derivative",
      subjectId: d.id,
      event: "derived",
      payload: {
        base_evidence_id: base.row.id,
        base_version: base.row.cld_version,
        transformation: d.transformation,
        class: d.class,
        demo_seed: true,
      },
    });
  }

  const { citation_coverage } = buildDemoStory(evidence);
  plan.push({
    subjectType: "story",
    subjectId: DEMO_STORY_ID,
    event: "synthesized",
    payload: {
      ...DEMO_STORY_META,
      citation_coverage,
      evidence_count: evidence.filter((e) => e.row.trust_status === "verified").length,
      demo_seed: true,
    },
  });
  return plan;
}

/** Coverage for one demo claim, computed the same way the Claims screen does. */
export function demoClaimCoverage(evidence: DemoEvidence[], claim: DemoClaim) {
  const offered = new Set(claim.evidenceKeys.map(evidenceId));
  return computeCoverage({
    expected: claim.expected_evidence,
    statuses: evidence
      .filter((e) => offered.has(e.row.id))
      .map((e) => e.row.trust_status as Parameters<typeof computeCoverage>[0]["statuses"][number]),
  });
}
