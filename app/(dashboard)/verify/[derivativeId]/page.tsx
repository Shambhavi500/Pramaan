import { supabase } from "@/lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VerifyPage({ params }: { params: Promise<{ derivativeId: string }> }) {
  const { derivativeId } = await params;

  const { data: derivative, error } = await supabase
    .from("derivative")
    .select("*, evidence:base_evidence_id(*)")
    .eq("id", derivativeId)
    .maybeSingle();

  if (error) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-light">Could not reach the evidence store</h1>
        <p className="mt-2 text-sm text-soft">{error.message}</p>
      </div>
    );
  }
  if (!derivative || !derivative.evidence) notFound();

  const evidence = derivative.evidence;
  const good = evidence.trust_status === "verified";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <span className="chip-lime">Public verification</span>
        <h1 className="flex items-center gap-3 text-4xl font-light tracking-tight">
          <span className={`h-3 w-3 animate-pulse rounded-full ${good ? "bg-good" : "bg-warn"}`} aria-hidden />
          Lineage inspector
        </h1>
      </div>

      <div className="panel space-y-5 p-6 text-sm">
        <div className="panel-flat p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Transformation recipe</p>
          <p className="mt-1 break-all font-mono text-xs">{derivative.transformation}</p>
          <div className="mt-3 flex gap-2">
            <span className="chip-outline">Class: {derivative.class}</span>
            {derivative.class === "ai_generated" && <span className="chip bg-warn text-lime-ink">AI-assisted</span>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="panel-flat p-3">
            <p className="text-xs text-muted">Client SHA-256</p>
            <p className="mt-1 truncate font-mono text-xs" title={evidence.client_sha256}>
              {evidence.client_sha256}
            </p>
          </div>
          <div className="panel-flat p-3">
            <p className="text-xs text-muted">Cloudinary storage ETag</p>
            <p className="mt-1 truncate font-mono text-xs" title={evidence.etag}>
              {evidence.etag}
            </p>
          </div>
        </div>

        <div className="panel-flat p-4">
          <p className="text-xs text-muted">Trust assessment</p>
          <p className={`text-3xl font-light ${good ? "text-good" : "text-warn"}`}>
            {evidence.trust_score} / 100 <span className="text-base font-medium">{String(evidence.trust_status).toUpperCase()}</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            Evidence {evidence.id} · Cloudinary asset {evidence.cld_asset_id}
          </p>
        </div>
      </div>
    </div>
  );
}
