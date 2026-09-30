export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { supabase } from "@/lib/db";
import { buildSafeEvidenceUrl } from "@/lib/url-builder";
import { computeCoverage, type EvidenceStatus } from "@/lib/coverage";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { ImpactClaimCard } from "@/components/ui/ImpactClaimCard";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function ClaimsPage() {
  const { data, error } = await supabase
    .from("claim")
    .select(
      "id, statement, expected_evidence, site:site_id(code, name, district), " +
        "claim_evidence(evidence:evidence_id(id, trust_score, trust_status, cld_public_id, cld_version, consent_status))"
    )
    .order("created_at", { ascending: true });

  if (error) return <EmptyState title="Could not load impact claims">{error.message}</EmptyState>;
  if (!data || data.length === 0) return <EmptyState title="No impact claims yet">Run the seed script to add a demo claim.</EmptyState>;

  return (
    <div className="pb-16">
      <PageHeader stage="Use · Impact" title="Impact claims">
        A trusted photo is not enough. Each claim is scored on how much verified evidence supports it, and what is still missing.
      </PageHeader>

      <div className="mx-auto max-w-4xl space-y-8">
        {(data as any[]).map((claim) => {
          const items = (claim.claim_evidence ?? [])
            .map((ce: any) => ce.evidence)
            .filter(Boolean)
            .map((e: any) => ({
              id: e.id as string,
              score: (e.trust_score ?? 0) as number,
              status: e.trust_status as EvidenceStatus,
              imageUrl: e.cld_public_id ? buildSafeEvidenceUrl(e.cld_public_id, Number(e.cld_version), e.consent_status) : null,
            }));
          const cov = computeCoverage({ expected: claim.expected_evidence, statuses: items.map((i: { status: EvidenceStatus }) => i.status) });
          return (
            <ImpactClaimCard
              key={claim.id}
              claimId={claim.id}
              siteLabel={claim.site ? `${claim.site.code} · ${claim.site.name}` : "Unassigned site"}
              statement={claim.statement}
              coveragePct={Math.round(cov.coverage * 100)}
              verified={cov.verified}
              flagged={cov.flagged}
              pending={cov.pending}
              gaps={cov.missing}
              strength={cov.strength}
              items={items}
            />
          );
        })}
      </div>
    </div>
  );
}
