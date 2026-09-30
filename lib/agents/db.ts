import { randomBytes } from "crypto";
import { supabase } from "@/lib/db";
import type { EvidenceRef, Phase } from "./state";

export const shortId = (prefix: string, n = 8) => `${prefix}_${randomBytes(n).toString("hex").slice(0, n)}`;

export interface SiteInfo {
  siteId: string;
  siteCode: string;
  siteName: string;
  place: string;
  orgId: string;
}

export async function getSiteInfo(siteId: string): Promise<SiteInfo> {
  const { data, error } = await supabase
    .from("site")
    .select("id, code, name, village, district, state, project!inner(org_id)")
    .eq("id", siteId)
    .maybeSingle();
  if (error || !data) throw new Error(`Site ${siteId} not found`);
  const project = data.project as unknown as { org_id: string };
  return {
    siteId: data.id,
    siteCode: data.code,
    siteName: data.name,
    place: [data.village, data.district, data.state].filter(Boolean).join(", "),
    orgId: project.org_id,
  };
}

export interface BriefRow {
  id: string;
  site_id: string;
  objective: string;
  activity_type: string;
  period_start: string | null;
  period_end: string | null;
  claims_to_establish: string[];
  evidence_types: string[];
  investigation_plan: Record<string, unknown> | null;
}

export async function getLatestBrief(siteId: string): Promise<BriefRow | null> {
  const { data } = await supabase
    .from("activity_brief")
    .select("*")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as BriefRow | null) ?? null;
}

export async function getBrief(briefId: string): Promise<BriefRow> {
  const { data, error } = await supabase.from("activity_brief").select("*").eq("id", briefId).maybeSingle();
  if (error || !data) throw new Error(`Brief ${briefId} not found`);
  return data as BriefRow;
}

type Understanding = { caption: string | null; ai_vision: Record<string, unknown> | null };

export interface EvidenceRow {
  id: string;
  cld_public_id: string;
  phase: Phase;
  trust_score: number;
  trust_status: string;
  exif_time: string | null;
  app_capture_time: string | null;
  created_at: string;
  geo_status: string | null;
  activity_claimed: string;
  understanding: Understanding | Understanding[] | null;
}

export const EVIDENCE_SELECT =
  "id, cld_public_id, phase, trust_score, trust_status, exif_time, app_capture_time, created_at, geo_status, activity_claimed, understanding(caption, ai_vision)";

export function toEvidenceRef(row: EvidenceRow): EvidenceRef {
  const u = Array.isArray(row.understanding) ? row.understanding[0] : row.understanding;
  return {
    evidenceId: row.id,
    cloudinaryPublicId: row.cld_public_id,
    phase: row.phase,
    caption: u?.caption ?? "",
    trustScore: row.trust_score,
    trustStatus: row.trust_status,
    capturedAt: row.exif_time ?? row.app_capture_time ?? row.created_at,
    geoStatus: row.geo_status,
    activityClaimed: row.activity_claimed,
  };
}

export async function fetchSiteEvidenceRows(siteId: string): Promise<EvidenceRow[]> {
  const { data, error } = await supabase
    .from("evidence")
    .select(EVIDENCE_SELECT)
    .eq("site_id", siteId)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw new Error(`evidence fetch failed: ${error.message}`);
  return (data ?? []) as unknown as EvidenceRow[];
}
