export const runtime = "nodejs";
import { cloudinary } from "@/lib/cloudinary";

const ALLOWED_KEYS = new Set(["upload_preset", "timestamp", "folder", "context", "source", "tags"]);

export async function POST(req: Request) {
  try {
    const { paramsToSign } = await req.json();

    if (!paramsToSign || typeof paramsToSign !== "object") {
      return new Response("Missing paramsToSign", { status: 400 });
    }
    if (paramsToSign.upload_preset !== "pramaan_evidence") {
      return new Response("Unauthorized upload preset", { status: 400 });
    }
    // Uploads are confined to the Pramaan folder tree; never sign arbitrary paths.
    if (typeof paramsToSign.folder === "string" && !paramsToSign.folder.startsWith("pramaan/")) {
      return new Response("Folder outside pramaan/ is not allowed", { status: 400 });
    }

    const safeParams: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(paramsToSign)) {
      if (ALLOWED_KEYS.has(k)) safeParams[k] = v;
    }

    const signature = cloudinary.utils.api_sign_request(
      safeParams as Record<string, string | number>,
      process.env.CLOUDINARY_API_SECRET!
    );

    return Response.json({ signature, apiKey: process.env.CLOUDINARY_API_KEY });
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "Signing failed", { status: 500 });
  }
}
