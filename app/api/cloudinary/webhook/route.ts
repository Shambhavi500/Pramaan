export const runtime = "nodejs";
export const maxDuration = 60;
import { cloudinary } from "@/lib/cloudinary";
import { analyzeImageJob } from "@/jobs/analyze-image";
import { maybeQueueInvestigation } from "@/lib/agents/queue";

export async function POST(req: Request) {
  const body = await req.text();
  const timestamp = req.headers.get("x-cld-timestamp");
  const signature = req.headers.get("x-cld-signature");

  if (!timestamp || !signature) {
    return new Response("Missing signature headers", { status: 400 });
  }

  const isValid = cloudinary.utils.verifyNotificationSignature(body, Number(timestamp), signature, 7200);
  if (!isValid) {
    return new Response("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(body);

  if (payload.notification_type === "upload" && payload.resource_type === "image") {
    try {
      const result = await analyzeImageJob(payload);
      // Bulk uploads queue an investigation once enough new evidence has accumulated. Never fails the webhook.
      if (result.siteId) await maybeQueueInvestigation(result.siteId).catch((e) => console.error("auto-queue failed:", e));
    } catch (err) {
      console.error("analyzeImageJob failed:", err);
      // 500 makes Cloudinary retry the notification.
      return new Response("Analysis failed", { status: 500 });
    }
  }

  return new Response("Event accepted", { status: 200 });
}
