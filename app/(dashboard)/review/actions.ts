"use server";

import { revalidatePath } from "next/cache";
import { cloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { supabase } from "@/lib/db";
import { appendLedgerEntry } from "@/lib/ledger";

export type ReviewDecision = "verified" | "rejected";

export interface ReviewResult {
  ok: boolean;
  error?: string;
  /** Set when the DB decision was saved but the Cloudinary moderation sync failed. */
  cloudinaryWarning?: string;
}

const DEFAULT_REASON = "Reviewer decision via moderation queue";

export async function submitReviewDecision(
  evidenceId: string,
  decision: ReviewDecision,
  reason?: string
): Promise<ReviewResult> {
  if (typeof evidenceId !== "string" || !evidenceId) return { ok: false, error: "Missing evidence id" };
  if (decision !== "verified" && decision !== "rejected") return { ok: false, error: "Invalid decision" };
  const cleanReason = (typeof reason === "string" ? reason.trim() : "").slice(0, 500) || DEFAULT_REASON;

  const { data: evidence, error: findErr } = await supabase
    .from("evidence")
    .select("id, org_id, cld_public_id, trust_status, trust_score")
    .eq("id", evidenceId)
    .maybeSingle();
  if (findErr) return { ok: false, error: findErr.message };
  if (!evidence) return { ok: false, error: "Evidence not found" };

  const { error: updErr } = await supabase
    .from("evidence")
    .update({ trust_status: decision })
    .eq("id", evidenceId);
  if (updErr) return { ok: false, error: `Update failed: ${updErr.message}` };

  const { error: revErr } = await supabase
    .from("review")
    .insert({ evidence_id: evidenceId, decision, reason: cleanReason });
  if (revErr) return { ok: false, error: `Review log failed: ${revErr.message}` };

  await appendLedgerEntry({
    subjectType: "evidence",
    subjectId: evidenceId,
    event: "human_review",
    payload: {
      decision,
      reason: cleanReason,
      previous_status: evidence.trust_status,
      trust_score: evidence.trust_score,
    },
    actor: "reviewer",
    orgId: evidence.org_id,
  });

  // Mirror the decision into Cloudinary's moderation state if configured (DB is system of record)
  const moderation = decision === "verified" ? "approved" : "rejected";
  let cloudinaryWarning: string | undefined;
  if (isCloudinaryConfigured()) {
    try {
      const explicit = cloudinary.uploader.explicit as unknown as (
        publicId: string,
        options: { type: string; moderation: string }
      ) => Promise<unknown>;
      await explicit.call(cloudinary.uploader, evidence.cld_public_id, { type: "upload", moderation });
    } catch (explicitErr) {
      try {
        await cloudinary.api.update(evidence.cld_public_id, { moderation_status: moderation });
      } catch (updateErr) {
        cloudinaryWarning = `Cloudinary moderation sync failed: ${errMsg(updateErr) || errMsg(explicitErr)}`;
        console.error(cloudinaryWarning);
      }
    }
  }

  revalidatePath("/review");
  return { ok: true, cloudinaryWarning };
}

function errMsg(e: unknown): string {
  const o = e as { error?: { message?: string }; message?: string };
  return o?.error?.message ?? o?.message ?? "";
}
