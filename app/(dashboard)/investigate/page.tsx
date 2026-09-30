export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/db";
import { cloudinary } from "@/lib/cloudinary";
import { getLatestBrief } from "@/lib/agents/db";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { ActivityBriefingForm } from "@/components/ActivityBriefingForm";
import { InvestigationPanel, type PendingReview } from "@/components/InvestigationPanel";
import { SemanticSearch } from "@/components/SemanticSearch";

export default async function InvestigatePage({ searchParams }: { searchParams: Promise<{ site?: string }> }) {
  const { site: siteParam } = await searchParams;
  const { data: sites, error } = await supabase.from("site").select("id, code, name").order("code");
  if (error) return <EmptyState title="Could not load sites">{error.message}</EmptyState>;
  if (!sites?.length) return <EmptyState title="No sites yet">Run the seed script to create a site.</EmptyState>;

  const site = sites.find((s) => s.id === siteParam) ?? sites[0];
  const brief = await getLatestBrief(site.id);

  const { data: inv } = await supabase
    .from("investigation")
    .select("id, status, report_id, error")
    .eq("site_id", site.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let pending: PendingReview[] = [];
  if (inv) {
    const { data: cps } = await supabase.from("hitl_checkpoint").select("id, evidence_id, reason").eq("investigation_id", inv.id).is("decision", null);
    const { data: evs } = await supabase.from("evidence").select("id, cld_public_id").in("id", (cps ?? []).map((c) => c.evidence_id));
    const pid = new Map((evs ?? []).map((e) => [e.id, e.cld_public_id]));
    pending = (cps ?? []).map((c) => ({
      id: c.id,
      evidenceId: c.evidence_id,
      reason: c.reason,
      thumbUrl: pid.get(c.evidence_id)
        ? cloudinary.url(pid.get(c.evidence_id)!, { transformation: [{ width: 240, height: 240, crop: "fill" }, { fetch_format: "auto", quality: "auto" }], secure: true, sign_url: true })
        : null,
    }));
  }

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        stage="Use · Investigate"
        title="Evidence investigation"
        aside={
          <nav aria-label="Sites" className="flex flex-wrap gap-2">
            {sites.map((s) => (
              <Link key={s.id} href={`/investigate?site=${s.id}`} className={s.id === site.id ? "btn-primary" : "btn-outline"}>
                {s.code}
              </Link>
            ))}
          </nav>
        }
      >
        Tell the agents what {site.name} is meant to demonstrate. They organise the evidence, check it against that objective, compare before and after, and write a cited report that states what it cannot conclude.
      </PageHeader>

      {!brief ? (
        <div className="max-w-3xl">
          <ActivityBriefingForm siteId={site.id} />
        </div>
      ) : (
        <div className="max-w-3xl space-y-6">
          <section className="surface-1 space-y-1 p-6">
            <p className="overline">Activity brief</p>
            <p className="text-[15px] text-ink-900">{brief.objective}</p>
            <p className="text-[13px] text-ink-600">
              {brief.activity_type} · {[brief.period_start, brief.period_end].filter(Boolean).join(" to ") || "no period set"} · {brief.claims_to_establish.length} claim(s) ·{" "}
              {brief.investigation_plan ? "plan ready" : "plan generates when the investigation starts"}
            </p>
          </section>
          <InvestigationPanel siteId={site.id} status={inv?.status ?? null} investigationId={inv?.id ?? null} reportId={inv?.report_id ?? null} error={inv?.status === "error" ? inv.error : null} pending={pending} />
          <SemanticSearch siteId={site.id} />
        </div>
      )}
    </div>
  );
}
