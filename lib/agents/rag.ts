import { supabase } from "@/lib/db";
import { cloudinary } from "@/lib/cloudinary";
import { embedText, geminiConfigured } from "./gemini";
import { EVIDENCE_SELECT, toEvidenceRef, type EvidenceRow } from "./db";
import type { EvidenceRef, Phase } from "./state";

export interface SearchHit extends EvidenceRef {
  similarity: number;
  source: "vector" | "cloudinary" | "both";
  score: number; // similarity × trust, used for ranking
}

/** One searchable document per evidence item: caption + detected signals + claimed context. */
export function composeEvidenceDocument(ev: {
  caption: string | null;
  aiVision: Record<string, unknown> | null;
  phase: string;
  activityClaimed: string;
}): string {
  const v = (ev.aiVision ?? {}) as Record<string, unknown>;
  const cues = [...((v.recapture_cues as string[]) ?? []), ...((v.synthetic_cues as string[]) ?? [])];
  return [
    ev.caption ?? "",
    v.activity ? `Activity detected: ${v.activity}.` : "",
    `Claimed activity: ${ev.activityClaimed}. Phase: ${ev.phase}.`,
    v.setting ? `Setting: ${v.setting}.` : "",
    v.visible_text ? `Visible text: ${v.visible_text}.` : "",
    cues.length ? `Cues: ${cues.join("; ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export async function generateEvidenceEmbedding(evidenceId: string): Promise<boolean> {
  if (!geminiConfigured()) return false;
  const { data } = await supabase
    .from("evidence")
    .select("phase, activity_claimed, understanding(caption, ai_vision)")
    .eq("id", evidenceId)
    .maybeSingle();
  const u = Array.isArray(data?.understanding) ? data.understanding[0] : data?.understanding;
  if (!data || !u) return false;
  const doc = composeEvidenceDocument({
    caption: u.caption,
    aiVision: u.ai_vision as Record<string, unknown>,
    phase: data.phase,
    activityClaimed: data.activity_claimed,
  });
  const embedding = await embedText(doc, "RETRIEVAL_DOCUMENT");
  const { error } = await supabase.from("understanding").update({ embedding: JSON.stringify(embedding) }).eq("evidence_id", evidenceId);
  if (error) throw new Error(`embedding update failed: ${error.message}`);
  return true;
}

/** Cloudinary folder of a site, derived from any of its assets ("pramaan/<org>/<site>/file"). */
const folderOf = (publicId: string) => publicId.split("/").slice(0, -1).join("/");

async function cloudinaryHits(folder: string, query: string): Promise<string[]> {
  if (!folder || !/^[\w\-/]+$/.test(folder)) return [];
  try {
    // Folder is validated above; the free-text query is only used as a quoted term.
    const term = query.replace(/["\\]/g, " ").slice(0, 120);
    const res = await cloudinary.search.expression(`folder="${folder}" AND ("${term}")`).max_results(20).execute();
    return (res.resources ?? []).map((r: { public_id: string }) => r.public_id);
  } catch {
    return [];
  }
}

/** Hybrid retrieval: SQL filters + pgvector similarity, merged with a Cloudinary search, ranked by similarity × trust. */
export async function hybridEvidenceSearch(params: {
  query: string;
  siteId: string;
  phase?: Phase | null;
  minTrustScore?: number;
  limit?: number;
}): Promise<SearchHit[]> {
  const limit = params.limit ?? 20;
  const minTrust = params.minTrustScore ?? 60;
  const embedding = await embedText(params.query, "RETRIEVAL_QUERY");
  const { data, error } = await supabase.rpc("match_evidence_hybrid", {
    p_query_embedding: JSON.stringify(embedding),
    p_site_id: params.siteId,
    p_phase: params.phase ?? null,
    p_min_trust: minTrust,
    p_limit: limit,
  });
  if (error) throw new Error(`match_evidence_hybrid failed: ${error.message}`);
  const rows = (data ?? []) as Array<{ evidence_id: string; similarity: number }>;
  const sim = new Map(rows.map((r) => [r.evidence_id, r.similarity]));

  const { data: refRows } = await supabase.from("evidence").select(EVIDENCE_SELECT).in("id", [...sim.keys()]);
  const refs = ((refRows ?? []) as unknown as EvidenceRow[]).map(toEvidenceRef);
  const known = new Set(refs.map((r) => r.cloudinaryPublicId));

  let cldIds: string[] = [];
  const anyPublicId = refs[0]?.cloudinaryPublicId;
  if (anyPublicId) cldIds = await cloudinaryHits(folderOf(anyPublicId), params.query);
  const cldOnly = cldIds.filter((p) => !known.has(p));
  if (cldOnly.length) {
    let q = supabase
      .from("evidence")
      .select(EVIDENCE_SELECT)
      .eq("site_id", params.siteId)
      .in("cld_public_id", cldOnly)
      .gte("trust_score", minTrust)
      .neq("trust_status", "rejected");
    if (params.phase) q = q.eq("phase", params.phase);
    const { data: extra } = await q;
    for (const r of (extra ?? []) as unknown as EvidenceRow[]) refs.push(toEvidenceRef(r));
  }

  const cldSet = new Set(cldIds);
  return refs
    .map((r): SearchHit => {
      const s = sim.get(r.evidenceId) ?? 0;
      const inCld = cldSet.has(r.cloudinaryPublicId);
      const similarity = s === 0 && inCld ? 0.5 : s;
      return {
        ...r,
        similarity,
        source: s > 0 && inCld ? "both" : inCld ? "cloudinary" : "vector",
        score: similarity * (r.trustScore / 100) + (inCld && s > 0 ? 0.05 : 0),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
