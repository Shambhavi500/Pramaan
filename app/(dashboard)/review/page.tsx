export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { supabase } from "@/lib/db";
import { buildSafeEvidenceUrl } from "@/lib/url-builder";
import ReviewClient, { type ReviewItem } from "./client";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function ReviewPage() {
  const { data, error } = await supabase
    .from("evidence")
    .select(
      "id, cld_public_id, cld_version, consent_status, trust_score, trust_status, activity_claimed, phase, geo_status, created_at, understanding(ai_vision, caption)"
    )
    .in("trust_status", ["flagged", "needs_review"])
    .order("trust_score", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h2 className="text-2xl font-light">Could not load the review queue</h2>
        <p className="mt-2 text-sm text-soft">{error.message}</p>
      </div>
    );
  }

  const items: ReviewItem[] = (data ?? []).map((row: any) => {
    const u = Array.isArray(row.understanding) ? row.understanding[0] : row.understanding;
    const signals: { name: string; score: number; reason?: string }[] = u?.ai_vision?.trust_signals ?? [];
    const reasons = signals.filter((s) => s.reason).map((s) => s.reason as string);
    if (reasons.length === 0) {
      const weak = signals.filter((s) => s.score < 0.5).map((s) => s.name);
      reasons.push(
        weak.length
          ? `Low-scoring signals: ${weak.join(", ")}.`
          : `Trust score ${row.trust_score} is below the auto-verify threshold.`
      );
    }
    return {
      id: row.id,
      score: row.trust_score ?? 0,
      status: row.trust_status,
      reasons,
      caption: u?.caption ?? null,
      activity: row.activity_claimed,
      phase: row.phase,
      geoStatus: row.geo_status,
      imageUrl: buildSafeEvidenceUrl(row.cld_public_id, Number(row.cld_version), row.consent_status),
    };
  });

  return <ReviewClient initialItems={items} />;
}
