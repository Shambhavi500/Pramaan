export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { supabase } from "@/lib/db";
import { buildPairImageUrl } from "@/lib/url-builder";
import { EmptyState } from "@/components/ui/PageHeader";
import CompareClient from "./client";

const PAIR_SELECT =
  "id, exg_before, exg_after, candidate_score, status, site:site_id(code, name, village, district), " +
  "before:before_id(id, cld_public_id, cld_version, consent_status, created_at, trust_score, trust_status), " +
  "after:after_id(id, cld_public_id, cld_version, consent_status, created_at, trust_score, trust_status)";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function ComparePage({ params }: { params: Promise<{ pairId: string }> }) {
  const { pairId } = await params;

  let { data: pair } = await supabase.from("pair").select(PAIR_SELECT).eq("id", pairId).maybeSingle<any>();
  let fellBack = false;
  if (!pair) {
    const { data: first } = await supabase
      .from("pair")
      .select(PAIR_SELECT)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<any>();
    pair = first;
    fellBack = Boolean(first);
  }

  if (!pair || !pair.before || !pair.after) {
    return <EmptyState title="No before/after pairs yet">Run the seed script or approve a suggested pair.</EmptyState>;
  }

  const site = pair.site;
  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "unknown";

  const exgBefore = pair.exg_before === null ? null : Number(pair.exg_before);
  const exgAfter = pair.exg_after === null ? null : Number(pair.exg_after);
  const exgDelta = exgBefore !== null && exgAfter !== null ? exgAfter - exgBefore : null;

  return (
    <CompareClient
      title={site ? `${site.code} · ${site.name}` : "Unknown site"}
      subtitle={`${fmt(pair.before.created_at)} vs ${fmt(pair.after.created_at)}${site?.district ? ` · ${site.district}` : ""}`}
      notice={fellBack ? `Pair "${pairId}" was not found; showing ${pair.id} instead.` : null}
      exgDelta={exgDelta}
      pairId={pair.id}
      candidateScore={pair.candidate_score === undefined ? null : Number(pair.candidate_score)}
      before={{ id: pair.before.id, at: pair.before.created_at, score: pair.before.trust_score ?? 0, status: pair.before.trust_status }}
      after={{ id: pair.after.id, at: pair.after.created_at, score: pair.after.trust_score ?? 0, status: pair.after.trust_status }}
      beforeUrl={buildPairImageUrl(pair.before.cld_public_id, Number(pair.before.cld_version), pair.before.consent_status)}
      afterUrl={buildPairImageUrl(pair.after.cld_public_id, Number(pair.after.cld_version), pair.after.consent_status)}
    />
  );
}
