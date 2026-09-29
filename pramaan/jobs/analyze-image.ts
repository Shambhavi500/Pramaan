import { CloudinaryAnalysis } from "@cloudinary/analysis";
import { cloudinary } from "@/lib/cloudinary";
import { supabase } from "@/lib/db";
import { computeTrustScore } from "@/lib/trust-engine";
import { appendLedgerEntry } from "@/lib/ledger";
import { phashHexToSignedBigInt } from "@/lib/phash";
import { resolveContextFromFolder } from "@/lib/org";

/* eslint-disable @typescript-eslint/no-explicit-any */

function getAnalysisClient() {
  return new CloudinaryAnalysis({
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    security: {
      cloudinaryAuth: {
        apiKey: process.env.CLOUDINARY_API_KEY!,
        apiSecret: process.env.CLOUDINARY_API_SECRET!,
      },
    },
  });
}

export const EVIDENCE_SCHEMA = {
  type: "object",
  properties: {
    activity: {
      type: "string",
      enum: ["sapling_plantation", "check_dam_construction", "farm_pond", "school_infrastructure", "health_camp", "other"],
    },
    activity_matches_claim: { type: "string", enum: ["yes", "no", "uncertain"] },
    visible_counts: {
      type: "object",
      properties: {
        saplings: { type: "integer" },
        structures: { type: "integer" },
        people: { type: "integer" },
      },
    },
    people: {
      type: "object",
      properties: {
        present: { type: "boolean" },
        minors_likely: { type: "boolean" },
      },
      required: ["present", "minors_likely"],
    },
    visible_text: { type: "string" },
    recapture_suspected: { type: "boolean" },
    recapture_cues: { type: "array", items: { type: "string" } },
    synthetic_suspected: { type: "boolean" },
    synthetic_cues: { type: "array", items: { type: "string" } },
    setting: { type: "string", enum: ["rural_field", "forest", "urban", "indoor", "construction_site"] },
    scene_summary: { type: "string" },
  },
  required: ["activity", "activity_matches_claim", "people", "recapture_suspected", "synthetic_suspected", "scene_summary"],
  additionalProperties: false,
};

const CLAIMED_ACTIVITY = "check_dam_construction";

/** Used only when AI Vision is unavailable. The result is marked so it is never mistaken for a real analysis. */
const FALLBACK_VISION = {
  activity: CLAIMED_ACTIVITY,
  activity_matches_claim: "uncertain",
  visible_counts: { saplings: 0, structures: 0, people: 0 },
  people: { present: false, minors_likely: false },
  visible_text: "",
  recapture_suspected: false,
  recapture_cues: [],
  synthetic_suspected: false,
  synthetic_cues: [],
  setting: "rural_field",
  scene_summary: "AI Vision unavailable at ingest time; pending manual or retried analysis.",
  fallback: true,
};

async function runVision(analysisUrl: string): Promise<any> {
  try {
    const prompt =
      `Analyze this development project field photo against the claimed activity "${CLAIMED_ACTIVITY}". ` +
      `Return ONLY JSON matching this JSON schema:\n` +
      JSON.stringify(EVIDENCE_SCHEMA);
    const res: any = await getAnalysisClient().analyze.aiVisionGeneral({
      source: { uri: analysisUrl },
      prompts: [prompt],
    });
    const raw = res?.data?.analysis?.responses?.[0]?.value;
    if (!raw) throw new Error("Empty AI Vision response");
    const text = typeof raw === "string" ? raw.replace(/^```(?:json)?\s*|\s*```$/g, "") : raw;
    return typeof text === "string" ? JSON.parse(text) : text;
  } catch (err) {
    console.error("AI Vision failed, using flagged fallback:", err);
    return FALLBACK_VISION;
  }
}

export async function analyzeImageJob(payload: any) {
  const publicId: string = payload.public_id;
  const version: number = payload.version;
  const evidenceId = `ev_${String(payload.asset_id || publicId.split("/").pop()).slice(0, 26)}`;

  const analysisUrl = cloudinary.url(publicId, {
    transformation: [{ raw_transformation: "t_ev_analysis" }],
    version,
    secure: true,
  });

  const visionData = await runVision(analysisUrl);
  const trustResult = await computeTrustScore(payload, visionData, evidenceId);
  const ctx = await resolveContextFromFolder(publicId);
  if (!ctx) throw new Error(`No org found for ${publicId}; run "npm run seed" first.`);

  const phash = payload.phash ? phashHexToSignedBigInt(payload.phash) : null;
  const custom = payload.context?.custom ?? {};
  const people: string[] = visionData.people?.minors_likely
    ? ["has_people", "minors_likely"]
    : visionData.people?.present
      ? ["has_people"]
      : [];

  const { error: evErr } = await supabase.from("evidence").upsert({
    id: evidenceId,
    org_id: ctx.orgId,
    project_id: ctx.projectId,
    site_id: ctx.siteId,
    cld_asset_id: payload.asset_id || evidenceId,
    cld_public_id: publicId,
    cld_version: version,
    resource_type: payload.resource_type || "image",
    format: payload.format || "jpg",
    bytes: payload.bytes || 0,
    width: payload.width || 0,
    height: payload.height || 0,
    etag: payload.etag || "",
    client_sha256: custom.client_sha256 || payload.etag || "",
    exif_time: custom.exif_time ? safeDate(custom.exif_time) : null,
    device: custom.device || null,
    software: custom.software || null,
    geo_status: (payload.tags || []).includes("no_gps") ? "no_gps" : "inferred",
    phase: "after",
    activity_claimed: CLAIMED_ACTIVITY,
    phash,
    trust_score: trustResult.score,
    trust_status: trustResult.status,
    people_flags: people,
    consent_status: people.length ? "pending" : "not_required",
  });
  if (evErr) throw new Error(`evidence upsert failed: ${evErr.message}`);

  const { error: uErr } = await supabase.from("understanding").upsert({
    evidence_id: evidenceId,
    ai_vision: { ...visionData, trust_signals: trustResult.signals },
    caption: visionData.scene_summary,
    activity_detected: visionData.activity,
    activity_matches_claim: visionData.activity_matches_claim,
  });
  if (uErr) throw new Error(`understanding upsert failed: ${uErr.message}`);

  await appendLedgerEntry({
    subjectType: "evidence",
    subjectId: evidenceId,
    event: "analyzed",
    payload: {
      score: trustResult.score,
      status: trustResult.status,
      activity: visionData.activity,
      ai_vision_fallback: Boolean(visionData.fallback),
    },
    actor: "cld_ai_vision",
    orgId: ctx.orgId,
  });

  // Sync verdict back to the Cloudinary DAM so it is searchable there.
  await cloudinary.uploader.explicit(publicId, {
    type: "upload",
    metadata: `trust_score=${trustResult.score}|activity=${visionData.activity}`,
    ...(trustResult.status === "flagged" ? { moderation: "manual" } : {}),
  }).catch((e) => console.error("DAM sync failed:", e?.message ?? e));

  return { evidenceId, ...trustResult };
}

function safeDate(v: string): string | null {
  // EXIF dates look like "2025:03:14 10:22:31"
  const iso = v.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3").replace(" ", "T");
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toISOString();
}
