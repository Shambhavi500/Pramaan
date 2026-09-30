export const runtime = "nodejs";
import { cloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

const ALLOWED_KEYS = new Set(["upload_preset", "timestamp", "folder", "context", "source", "tags"]);

export async function GET() {
  const configured = isCloudinaryConfigured();
  return Response.json({
    configured,
    cloudName: configured ? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME : null,
  });
}

export async function POST(req: Request) {
  try {
    if (!isCloudinaryConfigured()) {
      return Response.json(
        {
          error: "Cloudinary credentials are not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env.local to enable direct signed uploads.",
          configured: false,
        },
        { status: 503 }
      );
    }

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

    return Response.json({ signature, apiKey: process.env.CLOUDINARY_API_KEY, configured: true });
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "Signing failed", { status: 500 });
  }
}
