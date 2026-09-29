import { supabase } from "@/lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VerifyPage({ params }: { params: Promise<{ derivativeId: string }> }) {
  const { derivativeId } = await params;

  const { data: derivative } = await supabase
    .from("derivative")
    .select("*, evidence:base_evidence_id(*)")
    .eq("id", derivativeId)
    .maybeSingle();

  if (!derivative || !derivative.evidence) notFound();

  const evidence = derivative.evidence;

  return (
    <main className="min-h-screen bg-neutral-50 p-6 flex flex-col items-center">
      <div className="max-w-2xl w-full bg-white rounded-2xl border p-8 shadow-sm">
        <div className="flex items-center gap-3 border-b pb-4 mb-6">
          <div className="h-4 w-4 rounded-full bg-emerald-500 animate-pulse" />
          <h1 className="text-xl font-bold">Pramaan Verifiable Lineage Inspector</h1>
        </div>

        <div className="space-y-4 text-sm">
          <div className="p-4 bg-neutral-100 rounded-lg">
            <p className="text-xs font-mono uppercase text-muted-foreground">Transformation Recipe</p>
            <p className="font-mono text-xs break-all mt-1">{derivative.transformation}</p>
            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
              Class: {derivative.class}
            </span>
            {derivative.class === "ai_generated" && (
              <span className="inline-block mt-2 ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                AI-assisted
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground">Client SHA-256</p>
              <p className="font-mono text-xs truncate mt-1" title={evidence.client_sha256}>
                {evidence.client_sha256}
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground">Cloudinary Storage ETag</p>
              <p className="font-mono text-xs truncate mt-1" title={evidence.etag}>
                {evidence.etag}
              </p>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <p className="text-xs text-muted-foreground">Trust Assessment</p>
            <p className="text-lg font-bold text-emerald-700">
              {evidence.trust_score} / 100 ({String(evidence.trust_status).toUpperCase()})
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Evidence {evidence.id} · Cloudinary asset {evidence.cld_asset_id}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
