// Offline smoke checks for the agent layer: no Gemini, Cloudinary or database calls are made.
import assert from "node:assert/strict";
import { compositeTransformation } from "../lib/agents/compare";
import { pramaanGraph, MAX_LOOPS } from "../lib/agents/graph";
import { eligibleEvidence, type EvidenceRef, type InvestigationState } from "../lib/agents/state";
import { validIds } from "../lib/agents/util";

const t = compositeTransformation("pramaan/org/JH-04/after_1");
assert.match(t, /l_pramaan:org:JH-04:after_1,/, "layer id must use ':' instead of '/'");
assert.match(t, /fl_layer_apply,g_east/);

assert.deepEqual(validIds(["a", "x", "a", "b"], new Set(["a", "b"])), ["a", "b"], "invented ids dropped, duplicates removed");

const nodes = Object.keys(pramaanGraph.getGraph().nodes);
for (const n of ["understand_objective", "organize_evidence", "hitl_checkpoint", "analyze_evidence", "identify_context", "compare_before_after", "synthesize", "discover_evidence", "generate_report"]) {
  assert.ok(nodes.includes(n), `graph is missing node ${n}`);
}

const ref = (id: string, phase: EvidenceRef["phase"]): EvidenceRef => ({
  evidenceId: id, cloudinaryPublicId: id, phase, caption: "", trustScore: 80, trustStatus: "verified", capturedAt: null, geoStatus: null, activityClaimed: "other",
});
const state = {
  organizedEvidence: [ref("e1", "during"), ref("e2", "after")],
  discoveredEvidence: [ref("e3", "monitoring")],
  excludedIds: ["e2"],
  phaseOverrides: { e3: "before" },
} as unknown as InvestigationState;
const eligible = eligibleEvidence(state);
assert.deepEqual(eligible.map((e) => `${e.evidenceId}:${e.phase}`), ["e1:during", "e3:before"], "excluded dropped, overrides applied");

console.log(`agent checks passed (${nodes.length} graph nodes, MAX_LOOPS=${MAX_LOOPS})`);
