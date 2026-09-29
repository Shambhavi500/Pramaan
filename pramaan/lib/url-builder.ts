import { cloudinary } from "@/lib/cloudinary";

const GENERATIVE_REGEX = [/^e_gen_/, /^b_gen_fill/, /^e_background_removal/, /^e_extract/, /^e_upscale/];
const REDACT_REGEX = [/^e_(pixelate|blur)_faces/, /^e_(pixelate|blur)_region/, /^g_ocr_text/];

export type DerivativeClass = "transcoded" | "redacted" | "edited" | "ai_generated";

export function classifyTransformation(transformation: string): DerivativeClass {
  const parts = transformation.split("/").flatMap((c) => c.split(","));
  if (parts.some((p) => GENERATIVE_REGEX.some((r) => r.test(p)))) return "ai_generated";
  if (parts.some((p) => REDACT_REGEX.some((r) => r.test(p)))) return "redacted";
  if (parts.some((p) => p.startsWith("l_") || p.includes("fl_splice"))) return "edited";
  return "transcoded";
}

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
