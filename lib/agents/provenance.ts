import { appendLedgerEntry } from "@/lib/ledger";

/** Cross-cutting traceability: every significant agent action lands in the hash-chained ledger. */
export async function recordAgentAction(params: {
  orgId: string | null;
  subjectType: "evidence" | "pair" | "story" | "investigation" | "claim";
  subjectId: string;
  event: string;
  payload: Record<string, unknown>;
  agent: string;
}) {
  try {
    await appendLedgerEntry({
      subjectType: params.subjectType,
      subjectId: params.subjectId,
      event: params.event,
      payload: params.payload,
      actor: params.agent,
      orgId: params.orgId,
    });
  } catch (err) {
    // Traceability must not take the investigation down, but the failure must be visible.
    console.error(`ledger write failed (${params.event}):`, err);
  }
}
