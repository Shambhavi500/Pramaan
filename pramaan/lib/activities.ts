export const ACTIVITIES = [
  { value: "check_dam_construction", label: "Check dam construction" },
  { value: "sapling_plantation", label: "Sapling plantation" },
  { value: "farm_pond", label: "Farm pond" },
  { value: "school_infrastructure", label: "School infrastructure" },
  { value: "health_camp", label: "Health camp" },
  { value: "other", label: "Other" },
] as const;

export const PHASES = [
  { value: "before", label: "Before" },
  { value: "during", label: "During" },
  { value: "after", label: "After" },
  { value: "monitoring", label: "Monitoring" },
] as const;

export type Activity = (typeof ACTIVITIES)[number]["value"];
export type Phase = (typeof PHASES)[number]["value"];

export const ACTIVITY_VALUES: readonly string[] = ACTIVITIES.map((a) => a.value);
export const PHASE_VALUES: readonly string[] = PHASES.map((p) => p.value);

export function parseActivity(v: unknown): Activity {
  return typeof v === "string" && ACTIVITY_VALUES.includes(v) ? (v as Activity) : "other";
}

export function parsePhase(v: unknown): Phase {
  return typeof v === "string" && PHASE_VALUES.includes(v) ? (v as Phase) : "after";
}
