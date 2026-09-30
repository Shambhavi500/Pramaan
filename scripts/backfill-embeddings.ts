import { supabase } from "../lib/db";
import { generateEvidenceEmbedding } from "../lib/agents/rag";

/** Generates embeddings for understanding rows that have none. Safe to re-run. */
async function main() {
  const { data, error } = await supabase.from("understanding").select("evidence_id").is("embedding", null).limit(2000);
  if (error) throw new Error(error.message);
  const ids = (data ?? []).map((r) => r.evidence_id as string);
  console.log(`${ids.length} evidence item(s) missing embeddings`);

  let ok = 0, failed = 0;
  for (const id of ids) {
    try {
      if (await generateEvidenceEmbedding(id)) ok++;
      else failed++;
    } catch (e) {
      failed++;
      console.error(`${id}:`, e instanceof Error ? e.message : e);
    }
    await new Promise((r) => setTimeout(r, 150)); // stay under embedding rate limits
  }
  console.log(`done: ${ok} embedded, ${failed} failed`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
