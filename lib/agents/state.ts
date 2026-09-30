import { Annotation } from "@langchain/langgraph";

export type Phase = "before" | "during" | "after" | "monitoring";

export interface EvidenceRef {
  evidenceId: string;
  cloudinaryPublicId: string;
  phase: Phase;
  caption: string;
  trustScore: number;
  trustStatus: string;
  capturedAt: string | null;
  geoStatus: string | null;
  activityClaimed: string;
}

export interface EvidenceClaim {
  statement: string;
  supportingIds: string[];
  confidence: "high" | "medium" | "low";
  gaps: string[];
}

export interface TimelineEvent {
  date: string;
  phase: string;
  description: string;
  evidenceIds: string[];
}

export interface EvidenceGap {
  description: string;
  phase: Phase | "any";
  severity: "critical" | "moderate" | "minor";
}

export interface BeforeAfterPair {
  pairId: string;
  beforeId: string;
  afterId: string;
  visibleChanges: string[];
  cannotConclude: string[];
  confidence: "confirmed" | "partial" | "inconclusive";
  compositeUrl: string | null;
}

export interface HitlRequest {
  evidenceId: string;
  reason: string;
  agent: string;
  options: Array<{ label: string; value: "include" | "exclude" }>;
}

export interface EvidenceAnalysis {
  confirmed: string[];
  uncertain: string[];
  notVisible: string[];
  relevance: "high" | "medium" | "low";
}

export interface EvidenceIdentity {
  siteConfirmed: boolean;
  phaseConfirmed: boolean;
  activityConfirmed: boolean;
  signals: string[];
  inconsistencies: string[];
  contextConfidence: number; // 0..1
}

const replace = <T>(_: T, b: T) => b;
const merge = <T extends object>(a: T, b: T) => ({ ...a, ...b });
const dedupeById = (a: EvidenceRef[], b: EvidenceRef[]) => {
  const m = new Map(a.map((e) => [e.evidenceId, e]));
  for (const e of b) m.set(e.evidenceId, e);
  return [...m.values()];
};

/** Shared state passed between all agents. Reducers replace or dedupe so loop iterations never duplicate data. */
export const InvestigationStateAnnotation = Annotation.Root({
  siteId: Annotation<string>(),
  briefId: Annotation<string>(),
  objective: Annotation<string>(),
  investigationId: Annotation<string>(),

  investigationPlan: Annotation<Record<string, unknown> | null>({ reducer: replace, default: () => null }),

  organizedEvidence: Annotation<EvidenceRef[]>({ reducer: replace, default: () => [] }),
  excludedIds: Annotation<string[]>({ reducer: replace, default: () => [] }),
  analyzedEvidence: Annotation<Record<string, EvidenceAnalysis>>({ reducer: merge, default: () => ({}) }),
  identifiedContext: Annotation<Record<string, EvidenceIdentity>>({ reducer: merge, default: () => ({}) }),
  beforeAfterPairs: Annotation<BeforeAfterPair[]>({ reducer: replace, default: () => [] }),

  // Evidence the discovery agent pulled in for a gap, plus the phase it should count as.
  discoveredEvidence: Annotation<EvidenceRef[]>({ reducer: dedupeById, default: () => [] }),
  phaseOverrides: Annotation<Record<string, Phase>>({ reducer: merge, default: () => ({}) }),

  timeline: Annotation<TimelineEvent[]>({ reducer: replace, default: () => [] }),
  claims: Annotation<EvidenceClaim[]>({ reducer: replace, default: () => [] }),
  evidenceGaps: Annotation<EvidenceGap[]>({ reducer: replace, default: () => [] }),

  loopCount: Annotation<number>({ reducer: replace, default: () => 0 }),
  lastDiscoveryAdded: Annotation<number>({ reducer: replace, default: () => -1 }), // -1 = discovery has not run yet
  hitlRequests: Annotation<HitlRequest[]>({ reducer: replace, default: () => [] }),
  hitlDecisions: Annotation<Record<string, string>>({ reducer: merge, default: () => ({}) }),
  notes: Annotation<string[]>({ reducer: (a, b) => [...a, ...b], default: () => [] }),

  finalReport: Annotation<Record<string, unknown> | null>({ reducer: replace, default: () => null }),
  reportId: Annotation<string | null>({ reducer: replace, default: () => null }),
});

export type InvestigationState = typeof InvestigationStateAnnotation.State;
export type InvestigationUpdate = typeof InvestigationStateAnnotation.Update;

/** Evidence the agents may reason over: organised + discovered, with phase overrides applied. */
export function eligibleEvidence(state: InvestigationState): EvidenceRef[] {
  const out = new Map<string, EvidenceRef>();
  for (const e of [...state.organizedEvidence, ...state.discoveredEvidence]) {
    if (state.excludedIds.includes(e.evidenceId)) continue;
    out.set(e.evidenceId, { ...e, phase: state.phaseOverrides[e.evidenceId] ?? e.phase });
  }
  return [...out.values()];
}
