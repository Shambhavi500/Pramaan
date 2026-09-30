export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/db";
import { buildSafeEvidenceUrl } from "@/lib/url-builder";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";
import { EvidenceCard } from "@/components/ui/EvidenceCard";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "verified", label: "Verified" },
  { key: "needs_review", label: "Needs review" },
  { key: "flagged", label: "Flagged" },
];

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function EvidencePage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "all" } = await searchParams;
  const active = FILTERS.some((f) => f.key === status) ? status : "all";

  let q = supabase
    .from("evidence")
    .select(
      "id, cld_public_id, cld_version, consent_status, trust_score, trust_status, activity_claimed, phase, geo_status, exif_time, created_at, " +
        "site:site_id(code, name), understanding(ai_vision, caption)"
    )
    .order("created_at", { ascending: false })
    .limit(60);
  if (active !== "all") q = q.eq("trust_status", active);
  const { data, error } = await q;

  if (error) return <EmptyState title="Could not load evidence">{error.message}</EmptyState>;

  return (
    <div className="pb-8">
      <PageHeader stage="Understand · Evidence" title="Evidence">
        Every asset, with its provenance and trust score on the card. Nothing is hidden behind a hover.
      </PageHeader>

      <nav className="glass sticky top-[60px] z-30 mb-6 flex flex-wrap items-center gap-2 rounded-lg p-2" aria-label="Filter evidence by status">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/evidence" : `/evidence?status=${f.key}`}
            aria-current={active === f.key ? "true" : undefined}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
              active === f.key ? "border-sky-600 bg-sky-100 font-semibold text-sky-700" : "border-transparent text-ink-700 hover:bg-sky-50"
            }`}
          >
            {f.label}
          </Link>
        ))}
        <span className="mono-meta ml-auto pr-2">{data?.length ?? 0} shown</span>
      </nav>

      {!data || data.length === 0 ? (
        <EmptyState title="No evidence here yet">
          Capture or import a photo, or run the seed script.
        </EmptyState>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(data as any[]).map((row) => {
            const u = Array.isArray(row.understanding) ? row.understanding[0] : row.understanding;
            const tags: string[] = (u?.ai_vision?.tags ?? u?.ai_vision?.detected ?? []).filter((t: unknown) => typeof t === "string");
            const activity = String(row.activity_claimed).replace(/_/g, " ");
            return (
              <EvidenceCard
                key={row.id}
                id={row.id}
                imageUrl={buildSafeEvidenceUrl(row.cld_public_id, Number(row.cld_version), row.consent_status)}
                title={`${activity.charAt(0).toUpperCase()}${activity.slice(1)}, ${row.phase}`}
                description={u?.caption}
                context={row.site ? `${row.site.code} · ${row.site.name}` : undefined}
                capturedAt={row.exif_time ?? row.created_at}
                geoLabel={row.geo_status ? String(row.geo_status).replace(/_/g, " ") : null}
                score={row.trust_score ?? 0}
                status={row.trust_status}
                signals={tags}
                actions={
                  row.trust_status === "verified" ? undefined : (
                    <Link href="/review" className="btn-outline !px-3 !py-1.5 text-[13px]">
                      Open review
                    </Link>
                  )
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
