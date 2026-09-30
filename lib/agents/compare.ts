import { z } from "zod";
import { supabase } from "@/lib/db";
import { cloudinary } from "@/lib/cloudinary";
import { classifyTransformation } from "@/lib/transformations";
import { generateStructured } from "./gemini";
import { getSiteInfo, shortId } from "./db";
import { recordAgentAction } from "./provenance";
import { errMsg } from "./util";
import { eligibleEvidence, type BeforeAfterPair, type EvidenceRef, type InvestigationState, type InvestigationUpdate } from "./state";

const MAX_PAIRS = 3;
const MIN_CONTEXT_CONFIDENCE = 0.5;

const ComparisonSchema = z.object({
  changes: z.array(z.string()),
  unchanged: z.array(z.string()),
  cannotConclude: z.array(z.string()),
  comparable: z.boolean(),
  overall: z.enum(["strong", "moderate", "weak"]),
});

function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

const parseVec = (v: unknown): number[] | null => {
  if (Array.isArray(v)) return v as number[];
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as number[];
    } catch {
      return null;
    }
  }
  return null;
};

/** Side-by-side before | after layout built from Cloudinary layers, with equal square crops for a fair comparison. */
export function compositeTransformation(afterPublicId: string) {
  const layer = afterPublicId.replace(/\//g, ":");
  return `c_fill,h_600,w_600/b_rgb:0b0b0b,c_pad,g_west,h_600,w_1200/l_${layer},c_fill,h_600,w_600/fl_layer_apply,g_east/f_auto,q_auto`;
}

/** Agent 4 — finds comparable before/after pairs, describes what visibly changed, and never claims causation. */
export async function compareAgent(state: InvestigationState): Promise<InvestigationUpdate> {
  const site = await getSiteInfo(state.siteId);
  const eligible = eligibleEvidence(state).filter((e) => {
    const ctx = state.identifiedContext[e.evidenceId];
    return !ctx || ctx.contextConfidence >= MIN_CONTEXT_CONFIDENCE;
  });
  const befores = eligible.filter((e) => e.phase === "before");
  const afters = eligible.filter((e) => e.phase === "after");
  if (!befores.length || !afters.length) return { beforeAfterPairs: [], notes: ["No before/after candidates to compare."] };

  const { data: emb } = await supabase
    .from("understanding")
    .select("evidence_id, embedding")
    .in("evidence_id", [...befores, ...afters].map((e) => e.evidenceId));
  const vec = new Map((emb ?? []).map((r) => [r.evidence_id, parseVec(r.embedding)]));

  // Candidate score: same-viewpoint similarity (embedding cosine) weighted by the weaker item's trust.
  const scored: { b: EvidenceRef; a: EvidenceRef; score: number }[] = [];
  for (const b of befores)
    for (const a of afters) {
      const vb = vec.get(b.evidenceId), va = vec.get(a.evidenceId);
      const sim = vb && va ? cosine(vb, va) : 0.5;
      scored.push({ b, a, score: sim * (Math.min(a.trustScore, b.trustScore) / 100) });
    }
  scored.sort((x, y) => y.score - x.score);

  const usedB = new Set<string>(), usedA = new Set<string>();
  const chosen: typeof scored = [];
  for (const c of scored) {
    if (chosen.length >= MAX_PAIRS) break;
    if (usedB.has(c.b.evidenceId) || usedA.has(c.a.evidenceId)) continue;
    usedB.add(c.b.evidenceId);
    usedA.add(c.a.evidenceId);
    chosen.push(c);
  }

  const notes: string[] = [];
  const pairs: BeforeAfterPair[] = [];

  for (const { b, a, score } of chosen) {
    const cached = state.beforeAfterPairs.find((p) => p.beforeId === b.evidenceId && p.afterId === a.evidenceId);
    if (cached) {
      pairs.push(cached);
      continue;
    }
    let cmp: z.infer<typeof ComparisonSchema> | null = null;
    try {
      cmp = await generateStructured({
        schema: ComparisonSchema,
        system:
          "You compare before/after evidence from a development project. Describe VISIBLE change only. " +
          "Visible change is not proof that the project caused it; list what cannot be concluded from visual comparison alone.",
        task: `Activity objective: ${state.objective}. Compare the before item to the after item. Set comparable=false if they do not appear to show the same place or viewpoint.`,
        data: {
          before: { id: b.evidenceId, capturedAt: b.capturedAt, caption: b.caption, analysis: state.analyzedEvidence[b.evidenceId] },
          after: { id: a.evidenceId, capturedAt: a.capturedAt, caption: a.caption, analysis: state.analyzedEvidence[a.evidenceId] },
        },
      });
    } catch (err) {
      notes.push(`Comparison failed for ${b.evidenceId} → ${a.evidenceId}: ${errMsg(err)}`);
    }

    const confidence: BeforeAfterPair["confidence"] = !cmp || !cmp.comparable
      ? "inconclusive"
      : cmp.overall === "strong"
        ? "confirmed"
        : "partial";

    let compositeUrl: string | null = null;
    const t = compositeTransformation(a.cloudinaryPublicId);
    if (confidence !== "inconclusive") {
      compositeUrl = cloudinary.url(b.cloudinaryPublicId, { raw_transformation: t, secure: true, sign_url: true });
    }

    const aiComparison = { ...(cmp ?? {}), confidence, generated_by: "compare_agent", investigation_id: state.investigationId };
    const { data: existing } = await supabase.from("pair").select("id").eq("before_id", b.evidenceId).eq("after_id", a.evidenceId).limit(1).maybeSingle();
    const pairId = existing?.id ?? shortId("pair");
    const row = { candidate_score: Math.round(score * 1000) / 1000, ai_comparison: aiComparison, composite_url: compositeUrl };
    const { error } = existing
      ? await supabase.from("pair").update(row).eq("id", pairId)
      : await supabase.from("pair").insert({ id: pairId, site_id: state.siteId, before_id: b.evidenceId, after_id: a.evidenceId, status: "suggested", ...row });
    if (error) {
      notes.push(`Could not save pair ${pairId}: ${error.message}`);
      continue;
    }

    if (compositeUrl) {
      const { data: base } = await supabase.from("evidence").select("cld_asset_id, cld_version").eq("id", b.evidenceId).maybeSingle();
      const { data: dup } = await supabase.from("derivative").select("id").eq("delivery_url", compositeUrl).limit(1).maybeSingle();
      if (base && !dup) {
        await supabase.from("derivative").insert({
          id: shortId("dv", 6),
          base_evidence_id: b.evidenceId,
          base_asset_id: base.cld_asset_id,
          base_version: base.cld_version,
          kind: "before_after_composite",
          transformation: t,
          delivery_url: compositeUrl,
          class: classifyTransformation(t),
        });
      }
    }

    await recordAgentAction({
      orgId: site.orgId,
      subjectType: "pair",
      subjectId: pairId,
      event: "compare_agent_paired",
      agent: "compare_agent",
      payload: { before: b.evidenceId, after: a.evidenceId, confidence, candidate_score: row.candidate_score },
    });

    pairs.push({
      pairId,
      beforeId: b.evidenceId,
      afterId: a.evidenceId,
      visibleChanges: cmp?.changes ?? [],
      cannotConclude: cmp?.cannotConclude ?? ["Automated comparison failed."],
      confidence,
      compositeUrl,
    });
  }

  return { beforeAfterPairs: pairs, notes };
}
