import { createHash } from "crypto";
import { supabase } from "@/lib/db";

const GENESIS = "0".repeat(64);

export async function appendLedgerEntry(entry: {
  subjectType: string;
  subjectId: string;
  event: string;
  payload: Record<string, unknown>;
  actor: string;
  orgId?: string | null;
}) {
  const { data: head } = await supabase
    .from("ledger_entry")
    .select("entry_hash")
    .order("seq", { ascending: false })
    .limit(1)
    .maybeSingle();

  const prevHash = head?.entry_hash || GENESIS;
  const payloadHash = createHash("sha256").update(JSON.stringify(entry.payload)).digest("hex");

  const timestamp = new Date().toISOString();
  const entryHash = createHash("sha256")
    .update(prevHash + entry.event + entry.subjectId + payloadHash + timestamp)
    .digest("hex");

  const { error } = await supabase.from("ledger_entry").insert({
    org_id: entry.orgId ?? null,
    subject_type: entry.subjectType,
    subject_id: entry.subjectId,
    event: entry.event,
    payload: entry.payload,
    payload_hash: payloadHash,
    prev_hash: prevHash,
    entry_hash: entryHash,
    actor: entry.actor,
    created_at: timestamp,
  });
  if (error) throw new Error(`Ledger append failed: ${error.message}`);

  return { entryHash, prevHash };
}
