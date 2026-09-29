"use client";

import { useEffect, useState } from "react";

interface Entry {
  seq: number;
  event: string;
  subjectId: string;
  payload: Record<string, unknown>;
  tamperedPayload: Record<string, unknown>;
  timestamp: string;
  // Hashes as originally written.
  payloadHash: string;
  prevHash: string;
  entryHash: string;
}

const GENESIS = "0".repeat(64);

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

// Same formula as lib/ledger.ts.
async function hashEntry(prev: string, event: string, subjectId: string, payload: unknown, ts: string) {
  const payloadHash = await sha256(JSON.stringify(payload));
  const entryHash = await sha256(prev + event + subjectId + payloadHash + ts);
  return { payloadHash, entryHash };
}

const SEED = [
  { event: "analyzed", subjectId: "ev_A1", payload: { score: 94, status: "verified" }, tampered: { score: 94, status: "verified", note: "edited" } },
  { event: "analyzed", subjectId: "ev_B7", payload: { score: 31, status: "flagged" }, tampered: { score: 91, status: "verified" } },
  { event: "human_review", subjectId: "ev_B7", payload: { decision: "rejected", reason: "Photo of a screen" }, tampered: { decision: "verified", reason: "Photo of a screen" } },
  { event: "synthesized", subjectId: "st_1", payload: { citation_coverage: 1, evidence_count: 12 }, tampered: { citation_coverage: 1, evidence_count: 40 } },
];

const short = (h: string) => h.slice(0, 10) + "…";

export function LedgerDemo() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [tampered, setTampered] = useState<Set<number>>(new Set());
  const [checks, setChecks] = useState<{ payloadOk: boolean; hashOk: boolean; linkOk: boolean }[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const out: Entry[] = [];
        let prev = GENESIS;
        for (let i = 0; i < SEED.length; i++) {
          const s = SEED[i];
          const timestamp = new Date(Date.UTC(2026, 8, 29, 9, 10 * (i + 1))).toISOString();
          const { payloadHash, entryHash } = await hashEntry(prev, s.event, s.subjectId, s.payload, timestamp);
          out.push({
            seq: i + 1,
            event: s.event,
            subjectId: s.subjectId,
            payload: s.payload,
            tamperedPayload: s.tampered,
            timestamp,
            payloadHash,
            prevHash: prev,
            entryHash,
          });
          prev = entryHash;
        }
        setEntries(out);
      } catch {
        setError(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!entries.length) return;
    let cancelled = false;
    (async () => {
      const res = [];
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        const payload = tampered.has(i) ? e.tamperedPayload : e.payload;
        const { payloadHash, entryHash } = await hashEntry(e.prevHash, e.event, e.subjectId, payload, e.timestamp);
        res.push({
          payloadOk: payloadHash === e.payloadHash,
          hashOk: entryHash === e.entryHash,
          linkOk: i === 0 ? e.prevHash === GENESIS : e.prevHash === entries[i - 1].entryHash,
        });
      }
      if (!cancelled) setChecks(res);
    })();
    return () => {
      cancelled = true;
    };
  }, [entries, tampered]);

  const broken = checks.findIndex((c) => !c.payloadOk || !c.hashOk || !c.linkOk);

  if (error) return <p className="panel-flat p-4 text-sm text-soft">This demo needs a secure context (https or localhost) for the Web Crypto API.</p>;

  return (
    <div className="panel space-y-3 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Ledger, recomputed in your browser</p>
        <button
          onClick={() => setTampered(new Set())}
          disabled={tampered.size === 0}
          className="text-xs text-link underline underline-offset-4 disabled:opacity-40"
        >
          Reset
        </button>
      </div>

      <ol className="space-y-2">
        {entries.map((e, i) => {
          const c = checks[i];
          const bad = c && (!c.payloadOk || !c.hashOk || !c.linkOk);
          const isTampered = tampered.has(i);
          return (
            <li key={e.seq} className={`rounded-lg border p-3 text-xs transition ${bad ? "border-bad bg-bad/10" : "border-line bg-white/[0.03]"}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">
                  <span className="mr-2 font-mono text-lime">#{e.seq}</span>
                  {e.event} · <span className="font-mono text-soft">{e.subjectId}</span>
                </p>
                <button
                  onClick={() =>
                    setTampered((prev) => {
                      const n = new Set(prev);
                      if (n.has(i)) n.delete(i);
                      else n.add(i);
                      return n;
                    })
                  }
                  className="rounded-md border border-line-bright px-2 py-1 text-[11px] text-soft hover:text-white"
                >
                  {isTampered ? "Undo edit" : "Edit this record"}
                </button>
              </div>
              <p className="mt-2 break-all font-mono text-[11px] text-white/80">{JSON.stringify(isTampered ? e.tamperedPayload : e.payload)}</p>
              <p className="mt-1 font-mono text-[10px] text-muted">
                prev {short(e.prevHash)} → hash {short(e.entryHash)}
              </p>
              {bad && (
                <p className="mt-1 text-[11px] font-medium text-bad">
                  {!c.payloadOk ? "Payload no longer matches the hash stored when it was written." : !c.linkOk ? "Chain link broken." : "Entry hash mismatch."}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <p className={`text-sm font-medium ${broken === -1 ? "text-good" : "text-bad"}`} role="status">
        {entries.length === 0 ? "Hashing…" : broken === -1 ? "Chain intact: every hash recomputes." : `Tampering detected at entry #${broken + 1}.`}
      </p>
    </div>
  );
}
