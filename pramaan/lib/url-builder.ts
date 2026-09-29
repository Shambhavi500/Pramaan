import { cloudinary } from "@/lib/cloudinary";

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

/** Evidence-layer delivery URL. Faces are pixelated unless consent is on file or not required. */
export function buildSafeEvidenceUrl(publicId: string, version: number, consentStatus: string): string {
  const baseTransform =
    consentStatus === "obtained" || consentStatus === "not_required" ? "t_ev_detail" : "t_public_safe";
  assertGenerativeFirewall("evidence", baseTransform);

  return cloudinary.url(publicId, {
    transformation: [{ raw_transformation: baseTransform }, { fetch_format: "auto", quality: "auto" }],
    version,
    secure: true,
  });
}

/** Side-by-side before/after composite with text labels. No generative steps. */
export function buildCompositeUrl(beforePublicId: string, afterPublicId: string): string {
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
