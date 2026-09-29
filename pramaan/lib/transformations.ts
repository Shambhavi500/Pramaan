// Pure (no Node SDK imports) so it can run in server code and in the browser.
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

