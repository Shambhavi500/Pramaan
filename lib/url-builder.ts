import { cloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

import { classifyTransformation } from "@/lib/transformations";

export { classifyTransformation };
export type { DerivativeClass } from "@/lib/transformations";

export function assertGenerativeFirewall(context: "evidence" | "story", transformation: string) {
  const classification = classifyTransformation(transformation);
  if (context === "evidence" && classification === "ai_generated") {
    throw new Error(
      "Generative Firewall Violation: Generative transformations are strictly prohibited in the Evidence verification layer."
    );
  }
}

const KNOWN_KEYS = new Set([
  "before_01", "before_02", "during_01", "during_02", "during_community", "during_lowq",
  "after_01", "after_02", "after_nogps", "after_wronggeo", "after_reuse", "after_recapture",
  "after_ai_edit", "before_veg", "after_veg", "monitoring_01"
]);

function resolveEvidencePath(publicId: string): string {
  if (!publicId) return "/evidence/before_01.jpg";
  const parts = publicId.split("/");
  const key = parts[parts.length - 1];
  if (KNOWN_KEYS.has(key)) {
    return `/evidence/${key}.jpg`;
  }
  if (key.includes("during")) return "/evidence/during_01.jpg";
  if (key.includes("after")) return "/evidence/after_01.jpg";
  return "/evidence/before_01.jpg";
}

/** Evidence-layer delivery URL. Faces are pixelated unless consent is on file or not required. */
export function buildSafeEvidenceUrl(publicId: string, version: number, consentStatus: string): string {
  const baseTransform =
    consentStatus === "obtained" || consentStatus === "not_required" ? "t_ev_detail" : "t_public_safe";
  assertGenerativeFirewall("evidence", baseTransform);

  if (!isCloudinaryConfigured() || publicId.includes("jalsetu-foundation")) {
    return resolveEvidencePath(publicId);
  }

  return cloudinary.url(publicId, {
    transformation: [{ raw_transformation: baseTransform }, { fetch_format: "auto", quality: "auto" }],
    version,
    secure: true,
  });
}

/** Side-by-side before/after composite with text labels. No generative steps. */
export function buildCompositeUrl(beforePublicId: string, afterPublicId: string): string {
  if (!isCloudinaryConfigured() || beforePublicId.includes("jalsetu-foundation")) {
    return "/evidence/composite_jh04.jpg";
  }
  const labelStyle = { font_family: "Arial", font_size: 28, font_weight: "bold" } as const;
  return cloudinary.url(beforePublicId, {
    transformation: [
      { raw_transformation: "t_pair_half" },
      { overlay: afterPublicId.replace(/\//g, ":") },
      { raw_transformation: "t_pair_half" },
      { flags: "layer_apply", gravity: "north_west", x: 800 },
      { color: "white", background: "rgb:000000AA", overlay: { ...labelStyle, text: "BEFORE" } },
      { flags: "layer_apply", gravity: "north_west", x: 16, y: 16 },
      { color: "white", background: "rgb:000000AA", overlay: { ...labelStyle, text: "AFTER" } },
      { flags: "layer_apply", gravity: "north_west", x: 816, y: 16 },
      { fetch_format: "auto", quality: "auto" },
    ],
    secure: true,
  });
}

/** 1200x900 evidence image for the before/after slider. Faces are pixelated unless consent allows. */
export function buildPairImageUrl(publicId: string, version: number, consentStatus: string): string {
  if (!isCloudinaryConfigured() || publicId.includes("jalsetu-foundation")) {
    return resolveEvidencePath(publicId);
  }
  const redact = !(consentStatus === "obtained" || consentStatus === "not_required");
  return cloudinary.url(publicId, {
    transformation: [
      ...(redact ? [{ raw_transformation: "t_public_safe" }] : []),
      { width: 1200, height: 900, crop: "fill", gravity: "auto" },
      { fetch_format: "auto", quality: "auto" },
    ],
    version,
    secure: true,
  });
}
