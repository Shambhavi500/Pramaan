import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { supabase } from "@/lib/db";
import { cloudinary } from "@/lib/cloudinary";
import { phashHexToSignedBigInt } from "@/lib/phash";
import { fetchSiteEvidenceRows, shortId, toEvidenceRef } from "./db";
import { hybridEvidenceSearch } from "./rag";
import { compositeTransformation } from "./compare";
import { recordAgentAction } from "./provenance";
import { classifyTransformation } from "@/lib/transformations";

/** Tool 1: Retrieve all evidence records for a site from Supabase */
export const fetchSiteEvidenceTool = tool(
  async ({ siteId }: { siteId: string }) => {
    try {
      const rows = await fetchSiteEvidenceRows(siteId);
      return JSON.stringify(rows.map(toEvidenceRef));
    } catch (err) {
      return JSON.stringify({ error: err instanceof Error ? err.message : String(err) });
    }
  },
  {
    name: "fetch_site_evidence",
    description: "Retrieve all evidence records for a site from Supabase",
    schema: z.object({
      siteId: z.string().describe("The UUID of the site to retrieve evidence for"),
    }),
  }
);

/** Tool 2: Run Cloudinary metadata / AI analysis on a media asset */
export const cloudinaryAnalyzeTool = tool(
  async ({ publicId }: { publicId: string }) => {
    try {
      const res = await cloudinary.api.resource(publicId, {
        image_metadata: true,
        exif: true,
        colors: true,
      });
      return JSON.stringify({
        public_id: res.public_id,
        format: res.format,
        bytes: res.bytes,
        width: res.width,
        height: res.height,
        tags: res.tags,
        metadata: res.image_metadata,
      });
    } catch (err) {
      return JSON.stringify({ error: err instanceof Error ? err.message : String(err) });
    }
  },
  {
    name: "cloudinary_analyze_asset",
    description: "Run Cloudinary metadata and analysis lookup on a media asset",
    schema: z.object({
      publicId: z.string().describe("The Cloudinary public_id of the asset"),
    }),
  }
);

/** Tool 3: Cluster evidence items into before/during/after/monitoring phases */
export const groupByPhaseTool = tool(
  async ({
    evidenceList,
  }: {
    evidenceList: Array<{ evidenceId: string; phase: string; [key: string]: unknown }>;
  }) => {
    const grouped: Record<string, string[]> = {
      before: [],
      during: [],
      after: [],
      monitoring: [],
      unknown: [],
    };
    for (const item of evidenceList) {
      const phase = item.phase?.toLowerCase() ?? "unknown";
      if (phase in grouped) {
        grouped[phase].push(item.evidenceId);
      } else {
        grouped.unknown.push(item.evidenceId);
      }
    }
    return JSON.stringify(grouped);
  },
  {
    name: "group_evidence_by_phase",
    description: "Cluster evidence items into before/during/after/monitoring phases",
    schema: z.object({
      evidenceList: z.array(
        z.object({
          evidenceId: z.string(),
          phase: z.string(),
        }).passthrough()
      ).describe("List of evidence items to group"),
    }),
  }
);

/** Tool 4: Check if coordinates fall inside the registered site geofence */
export const checkGeofenceTool = tool(
  async ({ siteId, lat, lng }: { siteId: string; lat: number; lng: number }) => {
    try {
      const { data, error } = await supabase.rpc("check_site_geofence", {
        p_site_id: siteId,
        p_lat: lat,
        p_lng: lng,
      });
      if (error) throw error;
      const row = (Array.isArray(data) ? data[0] : data) as { inside: boolean; distance_m: number } | null;
      return JSON.stringify({
        inside: row?.inside ?? false,
        distanceMeters: row?.distance_m ?? null,
      });
    } catch (err) {
      return JSON.stringify({ error: err instanceof Error ? err.message : String(err) });
    }
  },
  {
    name: "check_geofence",
    description: "Check if GPS coordinates fall inside the registered site geofence using PostGIS",
    schema: z.object({
      siteId: z.string().describe("The UUID of the site"),
      lat: z.number().describe("Latitude in decimal degrees"),
      lng: z.number().describe("Longitude in decimal degrees"),
    }),
  }
);

/** Tool 5: Check for perceptual hash duplicates using Hamming distance */
export const checkPhashDuplicateTool = tool(
  async ({
    phash,
    maxDistance = 10,
    excludeEvidenceId,
  }: {
    phash: string;
    maxDistance?: number;
    excludeEvidenceId?: string;
  }) => {
    try {
      const { data, error } = await supabase.rpc("match_phash_candidates", {
        target_phash: phashHexToSignedBigInt(phash),
        max_distance: maxDistance,
      });
      if (error) throw error;
      const candidates = ((data as Array<{ id: string; distance: number }>) ?? []).filter(
        (c) => !excludeEvidenceId || c.id !== excludeEvidenceId
      );
      return JSON.stringify({
        duplicatesFound: candidates.length > 0,
        candidates,
      });
    } catch (err) {
      return JSON.stringify({ error: err instanceof Error ? err.message : String(err) });
    }
  },
  {
    name: "check_phash_duplicate",
    description: "Check for duplicate or near-duplicate evidence using perceptual hash (pHash) Hamming distance",
    schema: z.object({
      phash: z.string().describe("The hex perceptual hash of the asset"),
      maxDistance: z.number().optional().default(10).describe("Maximum Hamming distance (default 10)"),
      excludeEvidenceId: z.string().optional().describe("Evidence ID to exclude from results"),
    }),
  }
);

/** Tool 6: Hybrid RAG search (pgvector + SQL filter + Cloudinary) */
export const hybridEvidenceSearchTool = tool(
  async ({
    query,
    siteId,
    phase,
    minTrustScore = 60,
    limit = 20,
  }: {
    query: string;
    siteId: string;
    phase?: "before" | "during" | "after" | "monitoring";
    minTrustScore?: number;
    limit?: number;
  }) => {
    try {
      const hits = await hybridEvidenceSearch({
        query,
        siteId,
        phase: phase ?? null,
        minTrustScore,
        limit,
      });
      return JSON.stringify(hits);
    } catch (err) {
      return JSON.stringify({ error: err instanceof Error ? err.message : String(err) });
    }
  },
  {
    name: "hybrid_evidence_search",
    description: "Perform hybrid evidence search combining pgvector semantic similarity, SQL filtering, and Cloudinary",
    schema: z.object({
      query: z.string().describe("Natural language search query"),
      siteId: z.string().describe("Site UUID"),
      phase: z.enum(["before", "during", "after", "monitoring"]).optional().describe("Optional phase filter"),
      minTrustScore: z.number().optional().default(60).describe("Minimum trust score required (0-100)"),
      limit: z.number().optional().default(20).describe("Max results to return"),
    }),
  }
);

/** Tool 7: Generate Cloudinary side-by-side composite transformation */
export const cloudinaryGenerateCompositeTool = tool(
  async ({
    beforePublicId,
    afterPublicId,
  }: {
    beforePublicId: string;
    afterPublicId: string;
  }) => {
    try {
      const transformation = compositeTransformation(afterPublicId);
      const compositeUrl = cloudinary.url(beforePublicId, {
        raw_transformation: transformation,
        secure: true,
        sign_url: true,
      });
      return JSON.stringify({
        compositeUrl,
        transformation,
      });
    } catch (err) {
      return JSON.stringify({ error: err instanceof Error ? err.message : String(err) });
    }
  },
  {
    name: "cloudinary_generate_composite",
    description: "Generate a side-by-side before/after comparison composite URL using Cloudinary layers",
    schema: z.object({
      beforePublicId: z.string().describe("Public ID of the before asset"),
      afterPublicId: z.string().describe("Public ID of the after asset"),
    }),
  }
);

/** Tool 8: Write an audit entry to the ledger */
export const writeLedgerEntryTool = tool(
  async ({
    orgId,
    subjectType,
    subjectId,
    event,
    payload,
    agent,
  }: {
    orgId: string;
    subjectType: "evidence" | "pair" | "story" | "investigation" | "claim";
    subjectId: string;
    event: string;
    payload: Record<string, unknown>;
    agent: string;
  }) => {
    try {
      await recordAgentAction({
        orgId,
        subjectType,
        subjectId,
        event,
        payload,
        agent,
      });
      return JSON.stringify({ recorded: true });
    } catch (err) {
      return JSON.stringify({ error: err instanceof Error ? err.message : String(err) });
    }
  },
  {
    name: "write_ledger_entry",
    description: "Write an immutable audit log entry into the ledger for traceability",
    schema: z.object({
      orgId: z.string().describe("Organization UUID"),
      subjectType: z
        .enum(["evidence", "pair", "story", "investigation", "claim"])
        .describe("Subject type (investigation, evidence, pair, story, claim)"),
      subjectId: z.string().describe("Subject ID"),
      event: z.string().describe("Event name"),
      payload: z.record(z.string(), z.unknown()).describe("Event payload"),
      agent: z.string().describe("Agent identifier"),
    }),
  }
);

/** Tool 9: Save or update a before/after pair */
export const savePairTool = tool(
  async ({
    siteId,
    beforeId,
    afterId,
    candidateScore,
    aiComparison,
    compositeUrl,
  }: {
    siteId: string;
    beforeId: string;
    afterId: string;
    candidateScore: number;
    aiComparison: Record<string, unknown>;
    compositeUrl?: string | null;
  }) => {
    try {
      const { data: existing } = await supabase
        .from("pair")
        .select("id")
        .eq("before_id", beforeId)
        .eq("after_id", afterId)
        .limit(1)
        .maybeSingle();

      const pairId = existing?.id ?? shortId("pair");
      const row = {
        candidate_score: candidateScore,
        ai_comparison: aiComparison,
        composite_url: compositeUrl ?? null,
      };

      const { error } = existing
        ? await supabase.from("pair").update(row).eq("id", pairId)
        : await supabase.from("pair").insert({
            id: pairId,
            site_id: siteId,
            before_id: beforeId,
            after_id: afterId,
            status: "suggested",
            ...row,
          });

      if (error) throw error;

      if (compositeUrl) {
        const { data: base } = await supabase
          .from("evidence")
          .select("cld_asset_id, cld_version")
          .eq("id", beforeId)
          .maybeSingle();
        const { data: dup } = await supabase
          .from("derivative")
          .select("id")
          .eq("delivery_url", compositeUrl)
          .limit(1)
          .maybeSingle();

        if (base && !dup) {
          const t = compositeTransformation(afterId);
          await supabase.from("derivative").insert({
            id: shortId("dv", 6),
            base_evidence_id: beforeId,
            base_asset_id: base.cld_asset_id,
            base_version: base.cld_version,
            kind: "before_after_composite",
            transformation: t,
            delivery_url: compositeUrl,
            class: classifyTransformation(t),
          });
        }
      }

      return JSON.stringify({ pairId, status: "saved" });
    } catch (err) {
      return JSON.stringify({ error: err instanceof Error ? err.message : String(err) });
    }
  },
  {
    name: "save_pair",
    description: "Persist or update an approved before/after evidence comparison pair",
    schema: z.object({
      siteId: z.string().describe("Site UUID"),
      beforeId: z.string().describe("Evidence ID of the before item"),
      afterId: z.string().describe("Evidence ID of the after item"),
      candidateScore: z.number().describe("Scored candidate similarity"),
      aiComparison: z.record(z.string(), z.unknown()).describe("AI comparison evaluation"),
      compositeUrl: z.string().nullable().optional().describe("Cloudinary composite URL"),
    }),
  }
);

/** All LangChain tools available to the multi-agent system */
export const allAgentTools = [
  fetchSiteEvidenceTool,
  cloudinaryAnalyzeTool,
  groupByPhaseTool,
  checkGeofenceTool,
  checkPhashDuplicateTool,
  hybridEvidenceSearchTool,
  cloudinaryGenerateCompositeTool,
  writeLedgerEntryTool,
  savePairTool,
];
