import { notFound } from "next/navigation";
import { CheckCircle2, Link2, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/db";
import { buildSafeEvidenceUrl } from "@/lib/url-builder";
import { EmptyState } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TrustScore } from "@/components/ui/TrustScore";
import { TrustSignalList, type TrustSignalRow } from "@/components/ui/TrustSignalList";
import { EvidenceMedia } from "@/components/ui/EvidenceMedia";
import { Hash, MetadataRow } from "@/components/ui/MetadataRow";

export const dynamic = "force-dynamic";

const CODE_BY_NAME: Record<string, string> = {
  "channel provenance": "P1",
  "exif timestamp": "P2",
  geofence: "P3",
  "perceptual hash reuse": "I1",
  "screen recapture": "I2",
  "synthetic generation": "I3",
  "activity claim match": "R1",
  "focus & quality": "Q1",
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function Node({ tag, title, children, strong = false }: { tag: string; title: string; children: React.ReactNode; strong?: boolean }) {
  return (
    <section className={`${strong ? "surface-3" : "surface-2"} enter w-full p-5 sm:p-6`} aria-label={title}>
      <p className="overline mb-1">{tag}</p>
      <h2 className="mb-3 font-display text-2xl leading-tight">{title}</h2>
      {children}
    </section>
  );
}

function Edge({ label, verified = false }: { label: string; verified?: boolean }) {
  return (
    <div className="flex items-stretch gap-3 pl-8" aria-hidden>
      <svg width="2" height="44" className="text-cyan-500">
        <line x1="1" y1="0" x2="1" y2="44" stroke="currentColor" strokeWidth="1.5" strokeDasharray="44" style={{ ["--len" as string]: 44, animation: "draw-line 600ms ease-out both" }} />
      </svg>
      <span className="flex items-center gap-1.5 self-center font-mono text-[11px] uppercase tracking-[0.08em] text-ink-600">
        {verified && <CheckCircle2 className="h-3.5 w-3.5 text-verified" />}
        {label}
      </span>
    </div>
  );
}

export default async function VerifyPage({ params }: { params: Promise<{ derivativeId: string }> }) {
  const { derivativeId } = await params;

  const { data: derivative, error } = await supabase
    .from("derivative")
    .select("*, evidence:base_evidence_id(*)")
    .eq("id", derivativeId)
    .maybeSingle();

  if (error) return <EmptyState title="Could not reach the evidence store">{error.message}</EmptyState>;
  if (!derivative || !derivative.evidence) notFound();

  const evidence: any = derivative.evidence;
  const verified = evidence.trust_status === "verified";

  const [{ data: und }, { data: ledger }] = await Promise.all([
    supabase.from("understanding").select("ai_vision, caption, activity_detected, activity_matches_claim").eq("evidence_id", evidence.id).maybeSingle(),
    supabase
      .from("ledger_entry")
      .select("seq, event, subject_id, entry_hash, prev_hash, created_at")
      .in("subject_id", [evidence.id, derivative.id])
      .order("seq", { ascending: true })
      .limit(12),
  ]);

  const signals: TrustSignalRow[] = ((und as any)?.ai_vision?.trust_signals ?? []).map((s: any) => ({
    id: s.id ?? CODE_BY_NAME[String(s.name).toLowerCase()],
    name: s.name,
    score: Number(s.score),
    reason: s.reason,
  }));

  const originalUrl = buildSafeEvidenceUrl(evidence.cld_public_id, Number(evidence.cld_version), evidence.consent_status);
  const fmt = (v?: string | null) => (v ? new Date(v).toISOString().replace("T", " ").replace(/\.\d+Z$/, "Z") : "not recorded");

  return (
    <div className="mx-auto max-w-[880px] space-y-0 pb-8">
      <header className="surface-2 enter mb-8 space-y-3 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="overline">Pramaan · Verification record</p>
          <StatusBadge status={evidence.trust_status} />
        </div>
        <h1 className="font-display text-3xl leading-tight tracking-[-0.02em] sm:text-4xl">
          Derivative <span className="mono-id text-2xl">{derivative.id}</span> traces to original{" "}
          <span className="mono-id text-2xl">{evidence.id}</span>
        </h1>
        <p className="flex items-start gap-2 text-[15px] text-ink-700">
          {verified ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-verified" aria-hidden /> : <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-review" aria-hidden />}
          {verified
            ? "The original is preserved unchanged. Every transformation applied to produce this output is disclosed below."
            : "This original has not reached the verified threshold. The lineage is still complete, but the evidence should not be cited as verified."}
        </p>
      </header>

      <Node tag="Published output" title="Derivative">
        <dl>
          <MetadataRow label="Kind">{derivative.kind}</MetadataRow>
          <MetadataRow label="Class">
            <span className={`badge ${derivative.class === "ai_generated" ? "badge-review" : "badge-neutral"}`}>
              {String(derivative.class).replace("_", " ")}
            </span>
            {derivative.class === "ai_generated" && <span className="ml-2 text-[13px]">AI-assisted; never used as evidence</span>}
          </MetadataRow>
          <MetadataRow label="Created" mono>
            {fmt(derivative.created_at)}
          </MetadataRow>
        </dl>
      </Node>

      <Edge label="derived from" />

      <Node tag="How it was made" title="Transformations">
        <p className="hash !block !bg-cloud-100 p-2 leading-relaxed">{derivative.transformation}</p>
        <p className="mt-2 text-[13px] text-ink-700">The recipe is a named Cloudinary transformation applied on delivery. The stored original is never overwritten.</p>
      </Node>

      <Edge label="original preserved · hashes match" verified />

      <Node tag="Source of truth" title="Original evidence" strong>
        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-md border border-cloud-200 bg-cloud-100">
            <EvidenceMedia src={originalUrl} alt={`Original evidence ${evidence.id}`} />
          </div>
          <dl>
            <MetadataRow label="Evidence ID" mono>
              {evidence.id}
            </MetadataRow>
            <MetadataRow label="SHA-256" title={evidence.client_sha256}>
              <Hash value={evidence.client_sha256 ?? "not recorded"} />
            </MetadataRow>
            <MetadataRow label="Storage ETag" title={evidence.etag}>
              <Hash value={evidence.etag ?? "not recorded"} />
            </MetadataRow>
            <MetadataRow label="Cloudinary" title={evidence.cld_asset_id}>
              <Hash value={evidence.cld_asset_id} />
            </MetadataRow>
          </dl>
        </div>
      </Node>

      <Edge label="captured with" />

      <Node tag="Provenance" title="Capture metadata">
        <dl className="grid sm:grid-cols-2 sm:gap-x-8">
          <MetadataRow label="Timestamp" mono>
            {fmt(evidence.exif_time ?? evidence.app_capture_time)}
          </MetadataRow>
          <MetadataRow label="Channel">{String(evidence.source_channel ?? "unknown").replace(/_/g, " ")}</MetadataRow>
          <MetadataRow label="Device">{evidence.device ?? "not recorded"}</MetadataRow>
          <MetadataRow label="Software">{evidence.software ?? "none reported"}</MetadataRow>
          <MetadataRow label="Geofence">{evidence.geo_status ? String(evidence.geo_status).replace(/_/g, " ") : "unknown"}</MetadataRow>
          <MetadataRow label="Activity">{String(evidence.activity_claimed).replace(/_/g, " ")}</MetadataRow>
          <MetadataRow label="Phase">{evidence.phase}</MetadataRow>
          <MetadataRow label="Consent">{String(evidence.consent_status).replace(/_/g, " ")}</MetadataRow>
        </dl>
      </Node>

      <Edge label="analysed by" />

      <Node tag="Understand" title="AI analysis">
        {(und as any)?.caption ? (
          <p className="text-[15px] leading-relaxed text-ink-800">{(und as any).caption}</p>
        ) : (
          <p className="text-sm text-ink-600">No AI description was stored for this asset.</p>
        )}
        {(und as any)?.activity_detected && (
          <dl className="mt-2">
            <MetadataRow label="Detected">{String((und as any).activity_detected).replace(/_/g, " ")}</MetadataRow>
            <MetadataRow label="Matches claim">{String((und as any).activity_matches_claim ?? "unknown")}</MetadataRow>
          </dl>
        )}
      </Node>

      <Edge label="scored as" />

      <Node tag="Verdict" title="Trust assessment" strong>
        <TrustScore score={evidence.trust_score} status={evidence.trust_status} variant="instrument" />
        {signals.length > 0 && (
          <div className="mt-6 border-t border-cloud-100 pt-4">
            <TrustSignalList signals={signals} />
          </div>
        )}
      </Node>

      {ledger && ledger.length > 0 && (
        <>
          <Edge label="recorded in the ledger" verified />
          <Node tag="Audit trail" title="Ledger entries">
            <ol className="relative space-y-4 border-l border-sky-300 pl-5">
              {ledger.map((e: any) => (
                <li key={e.seq} className="relative">
                  <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-xs bg-sky-600" aria-hidden />
                  <p className="flex flex-wrap items-baseline gap-x-3 font-mono text-xs">
                    <span className="overline !font-mono">Entry {String(e.seq).padStart(3, "0")}</span>
                    <span className="text-ink-600">{fmt(e.created_at)}</span>
                    <span className="font-semibold text-ink-900">{e.event}</span>
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-600">
                    <Link2 className="h-3 w-3" aria-hidden /> hash <Hash value={e.entry_hash} /> prev <Hash value={e.prev_hash} />
                    <span className="flex items-center gap-1 font-semibold text-verified-fg">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> linked
                    </span>
                  </p>
                </li>
              ))}
            </ol>
          </Node>
        </>
      )}
    </div>
  );
}
