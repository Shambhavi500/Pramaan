# 04 · Cloudinary Integration Blueprint

> Every Cloudinary integration point: **what, where, exact configuration, and why**. The integration map (§1) goes almost verbatim into the README's "How we use Cloudinary" section. Code is TypeScript for Next.js (App Router, Node runtime) using `cloudinary` (Node SDK v2), `next-cloudinary`, and `@cloudinary/analysis`.
> Syntax verified against Cloudinary docs and SDK READMEs (29 Sep 2026). Items marked **(verify)** need a quick check against the live API during implementation.

---

## 1. Integration map (README-ready)

| # | PS goal | Cloudinary capability | Where in Pramaan | Why it matters |
|---|---|---|---|---|
| 1 | R1 | **Signed Upload Widget** (`CldUploadWidget`) + direct signed upload (PWA) + Box/OneDrive/SharePoint/Drive sources | `/capture`, `/import` | Evidence enters through authenticated, policy-controlled channels |
| 2 | R1, R6 | **Upload presets** `pramaan_evidence` / `pramaan_evidence_video` | Env config (created via MCP) | One enforced intake policy for every channel |
| 3 | R1, R2, R6 | **Pre-upload `eval` intake gate** reading `resource_info.media_metadata / phash / quality_analysis / faces / source_url` | Preset | Intake tags & provenance context computed *inside Cloudinary* |
| 4 | R2, R6 | **`media_metadata`, `phash`, `colors`, `faces`, `quality_analysis`** | Preset | Provenance (EXIF/GPS/device), reuse detection, vegetation proxy, consent, quality |
| 5 | R1, R2 | **AI Vision** `ai_vision_general` with **JSON schema** (+ `ai_vision_tagging`) via `@cloudinary/analysis` | `analyze.image` job | Org-taxonomy understanding, counts, text, people, recapture/synthetic cues, claim-match |
| 6 | R2 | **Captioning / OCR / watermark detection** (add-ons) | `analyze.image` job | Alt text, signboard text, stock-image giveaway |
| 7 | R2 | **`auto_transcription` (+translate), `auto_chaptering`, `auto_video_details`** | Video preset | Speech → bilingual captions, chapters, AI titles/tags for video evidence |
| 8 | R2 | **AI Video Analysis** (visual transcription) + keyframes (`so_<t>` → jpg) | "Deep analyze" action | What is *visible* in video, timestamped |
| 9 | R1, R5 | **Structured metadata** (17 fields) + conditional rules | Schema (via MCP) | Typed, searchable evidence schema |
| 10 | R1 | **Asset folders, tags, contextual metadata** | Everywhere | Organization, grouping, captions |
| 11 | R3, R6 | **Related assets** (`add_related_assets`) + related-asset webhooks | Pairs, lineage | Before↔after, video↔transcript, original↔derivative links in Cloudinary itself |
| 12 | R3 | **Overlay composites** (`l_`, `fl_layer_apply,g_west,x_`), **text layers**, `multi` animated GIF | `/compare` | Before/after composite, stamps, flip-GIF |
| 13 | R3 | **AI Vision on the composite URL** ("compose, then perceive") | `pair.compare` job | Change description + viewpoint check in one call |
| 14 | R3, R4 | **Video splicing with cross-fade transitions** (`fl_splice:transition_(name_fade;du_1)`), `l_subtitles`, `l_audio` | Reels | Before→after and impact reels built from verified stills |
| 15 | R4 | **`g_auto` smart crops, overlays, `b_gen_fill` (labeled)** | Social kit | 1:1, 4:5, 9:16, 16:9 in one click |
| 16 | R4 | **`multi` → PDF** (+ PDF delivery enabled) | Evidence packs | Auditor-ready PDF from tagged evidence cards |
| 17 | R4 | **Video Player** (chapters, captions, AI title/description), **OG images** (`getCldOgImageUrl`) | Evidence detail, story pages | Rich playback, shareable pages |
| 18 | R5 | **Search API** (Tier-1 expressions over `metadata.*`, tags, folders, dates) | `/search`, Copilot | Faceted + planner-driven retrieval |
| 19 | R6 | **Versions & backups**, `overwrite:false`, asset IDs, deterministic URLs, derived-asset listing | Ledger, `/verify` | Immutable originals; the URL is the recipe |
| 20 | R6 | **Redaction transformations** (`e_pixelate_faces`, `e_blur_region`, `g_ocr_text`) in named transformation `t_public_safe` | All public outputs | Privacy by transformation (DPDP) |
| 21 | R6 | **Moderation status** (`moderation: "manual"` via `explicit`, overrides) | `/review` | Reviewer decisions mirrored in Cloudinary's Media Library |
| 22 | R6 | **Webhooks** + notification signature verification | `/api/cloudinary/webhook` | Async, tamper-resistant pipeline |
| 23 | R6 | **C2PA `fl_c2pa`** (beta, on request) | Public deliveries (when granted) | Standard Content Credentials |
| 24 | Ops | **Named/baseline transformations, eager async, `f_auto`/`q_auto`** | Everywhere | Cost & performance |
| 25 | Ops | **MediaFlows** PowerFlow (flag → notify; alt text; transcript → VTT) | Automation | Low-code ops for NGO admins |
| 26 | Dev | **Next.js Starter Kit, Skills Pack, AI Power Start, MCP servers** (Asset Mgmt, Env Config, SMD, Analysis, MediaFlows) | Repo setup, `PROMPTS.md` | Challenge requirement; agent-built configuration |

## 2. Account settings checklist (Console → Settings)

| Setting | Value | Why |
|---|---|---|
| Region | Default (US) | Transcription/chaptering unavailable in Asia-Pacific DC |
| Folder mode | Dynamic folders (asset_folder) | Folder moves don't change public IDs, so URLs stay stable (lineage) |
| Backups | **Auto backup ON** | Immutable originals / version history |
| Security → Allow delivery of PDF and ZIP files | **ON** | Evidence packs & archives on Free |
| Webhook notifications → global URL | `https://<app>/api/cloudinary/webhook` | Catch every event (incl. Media Library actions) |
| Add-ons (Free tiers) | AI Vision, AI Content Analysis, OCR, Google Auto Tagging, Google Translation | Perception stack |
| Security → Strict transformations | OFF during dev → **ON before finals** (with all templates as named/eager) | Tamper-proof public URLs |
| Upload → default presets | Image: `pramaan_evidence`; Video: `pramaan_evidence_video` | Media Library uploads also go through our intake |

## 3. Structured metadata schema (create via Structured Metadata MCP or Admin API)

| external_id | label | type | Notes / validation |
|---|---|---|---|
| `org_id` | Organization | enum | datasource = orgs; **mandatory** |
| `project_id` | Project | enum | datasource updated when a project is created; mandatory |
| `site_id` | Site | string | `strregex: ^[A-Z]{2,4}-\d{1,4}$` |
| `activity` | Activity | enum | taxonomy (plantation, check_dam, farm_pond, …, other) |
| `sdg` | SDGs | set | SDG1…SDG17 |
| `phase` | Phase | enum | before, during, after, monitoring |
| `capture_date` | Capture date | date | From EXIF or app; Tier-1 searchable (EXIF `taken_at` is Tier-2) |
| `lat_e6` | Latitude ×1e6 | integer | range −90e6..90e6 (copy of GPS for Tier-1 range queries) |
| `lng_e6` | Longitude ×1e6 | integer | range −180e6..180e6 |
| `geo_status` | Geo status | enum | in_geofence, outside_geofence, no_gps, inferred |
| `trust_score` | Trust score | integer | 0–100 |
| `trust_status` | Trust status | enum | pending, verified, needs_review, flagged, rejected |
| `consent_status` | Consent | enum | not_required, obtained, pending, denied, withdrawn |
| `people_flags` | People | set | has_people, minors_likely |
| `evidence_class` | Evidence class | enum | original, derived_transcoded, derived_redacted, derived_edited, ai_generated |
| `source_channel` | Source | enum | field_app, upload_widget, bulk_import, whatsapp, drive, api |
| `client_sha256` | Client SHA-256 | string | `strregex: ^[a-f0-9]{64}$`; `readonly_ui` |

Conditional rule examples: if `activity = sapling_plantation` → show `species` (set) and `sapling_count` (integer); if `people_flags` contains `minors_likely` → `consent_status` mandatory.

**MCP prompt (log it):** *"Using the structured-metadata MCP, create these 17 metadata fields with the given types, validations and datasources, then create conditional rules: …"*

## 4. Upload presets

### 4.1 `pramaan_evidence` (image, signed)
```json
{
  "name": "pramaan_evidence",
  "unsigned": false,
  "settings": {
    "unique_filename": true,
    "overwrite": false,
    "use_filename": false,
    "backup": true,
    "media_metadata": true,
    "phash": true,
    "colors": true,
    "faces": true,
    "quality_analysis": true,
    "allowed_formats": "jpg,jpeg,png,heic,heif,webp",
    "notification_url": "https://<app>/api/cloudinary/webhook",
    "eager": "t_ev_thumb|t_ev_analysis",
    "eager_async": true,
    "eager_notification_url": "https://<app>/api/cloudinary/webhook",
    "eval": "<see 4.3>"
  }
}
```
Optional add-on params (only if quota allows): `"detection": "captioning"`, `"ocr": "adv_ocr"`. Keep them **off** in the preset and call the Analyze API selectively from the job to protect quotas. (verify: exact preset field names in the Console/Admin API)

### 4.2 `pramaan_evidence_video` (video, signed)
```json
{
  "name": "pramaan_evidence_video",
  "unsigned": false,
  "settings": {
    "resource_type": "video",
    "unique_filename": true, "overwrite": false, "backup": true,
    "media_metadata": true,
    "auto_transcription": { "translate": ["en-US"] },
    "auto_chaptering": true,
    "auto_video_details": true,
    "eager": "c_limit,h_720/vc_auto/q_auto/f_mp4",
    "eager_async": true,
    "notification_url": "https://<app>/api/cloudinary/webhook",
    "eager_notification_url": "https://<app>/api/cloudinary/webhook"
  }
}
```
Keep field clips ≤ 40 MB (Free plan's max video *transformation* size).

### 4.3 The intake gate (`eval`)
Runs **inside Cloudinary before the upload completes**; can only modify `upload_options`. Keep it small, defensive, and deterministic:

```js
// eval: Pramaan intake gate v1
var md = resource_info.media_metadata || {};
var keys = Object.keys(md);
var tags = ['pramaan', 'intake_v1'];
var hasGps = keys.some(function (k) { return /GPSLatitude/i.test(k); });
if (!hasGps) tags.push('no_gps');
var qa = resource_info.quality_analysis;
if (qa && typeof qa.focus === 'number' && qa.focus < 0.5) tags.push('blurry');
if (resource_info.faces && resource_info.faces.length > 0) tags.push('has_faces');
if (md.Software && /photoshop|snapseed|lightroom|canva|picsart|gimp/i.test(String(md.Software))) tags.push('edited_software');
var existingTags = upload_options['tags'] ? String(upload_options['tags']).split(',') : [];
upload_options['tags'] = existingTags.concat(tags).join(',');

function clean(v) { return String(v).replace(/[|=]/g, ' ').slice(0, 200); }
var ctx = [];
var dto = md.DateTimeOriginal || md.CreateDate;
if (dto) ctx.push('exif_time=' + clean(dto));
if (md.Make || md.Model) ctx.push('device=' + clean((md.Make || '') + ' ' + (md.Model || '')));
if (md.Software) ctx.push('software=' + clean(md.Software));
if (resource_info.source_url) ctx.push('source_url=' + clean(resource_info.source_url));
if (resource_info.phash) ctx.push('phash=' + clean(resource_info.phash));
var existingCtx = upload_options['context'] ? String(upload_options['context']) : '';
upload_options['context'] = [existingCtx].concat(ctx).filter(Boolean).join('|');
```
Notes: the doc example uses the `key=value` string form for `context`. **(verify)** the exact shape of `upload_options['tags']`/`['context']` when the client already sent them, and the exact EXIF key names in `media_metadata` for your sample photos. Log a few `resource_info` payloads first.

### 4.4 `on_success` (optional)
`current_asset.update()` **replaces** tags/context/metadata rather than merging, so if used, merge explicitly:
```js
var ctx = (e.upload_info.context && e.upload_info.context.custom) || {};
var cap = e.upload_info.info && e.upload_info.info.detection && e.upload_info.info.detection.captioning
  && e.upload_info.info.detection.captioning.data && e.upload_info.info.detection.captioning.data.caption;
if (cap) { ctx.caption = cap; ctx.alt = cap; current_asset.update({ context: ctx }); }
```
We recommend doing this in our webhook job instead (safer to test), and **showing `eval` as the in-Cloudinary gate**.

## 5. Named transformations (create via Environment Config MCP)

`f_auto`, `q_auto`, `dpr_auto`, `w_auto` don't work *inside* named transformations, so append them in the URL (`t_ev_thumb/f_auto/q_auto`).

| Name | Definition | Class | Use |
|---|---|---|---|
| `t_ev_thumb` | `c_fill,g_auto,w_320,h_240` | edited (crop) | Grids |
| `t_ev_detail` | `c_fit,w_1600,h_1600` | **transcoded** | Evidence viewer (C2PA "transcoded" allowlist) |
| `t_ev_analysis` | `c_fit,w_1024,h_1024/f_jpg/q_auto:good` | transcoded | AI Vision input (fewer image tokens) |
| `t_public_safe` | `e_pixelate_faces:12/c_fit,w_1600,h_1600` | **redacted** | Any public output without consent |
| `t_public_safe_ocr` | `e_pixelate_faces:12/e_blur_region:800,g_ocr_text/c_fit,w_1600,h_1600` | redacted | When documents/phone numbers visible (OCR add-on) |
| `t_card_1x1` / `t_card_4x5` / `t_card_9x16` / `t_card_16x9` | `c_fill,g_auto,ar_1:1,w_1080` etc. | edited | Social kit bases |
| `t_pair_half` | `c_fill,g_auto,w_800,h_600` | edited | Before/after halves |
| `t_pack_page` | `c_pad,b_white,w_1240,h_1754` | edited (layout) | PDF pages (A4 @150 dpi) |
| `t_genfill_9x16` (baseline) | `c_pad,ar_9:16,b_gen_fill,w_1080` | **ai_generated** | Story only; use as `bl_` for variants |

## 6. Server code sketches

### 6.1 Cloudinary server client (`lib/cloudinary.ts`, Node runtime only)
```ts
import { v2 as cloudinary } from "cloudinary";
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});
export { cloudinary };
```

### 6.2 Signed upload params (`app/api/sign-upload/route.ts`), adapted from the Skills Pack template
```ts
export const runtime = "nodejs";
import { cloudinary } from "@/lib/cloudinary";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await auth(req);                     // field_agent+ only
  const { paramsToSign } = await req.json();         // from CldUploadWidget / PWA
  // Enforce server-side policy: preset, folder, org metadata cannot be spoofed
  if (paramsToSign.upload_preset !== "pramaan_evidence" && paramsToSign.upload_preset !== "pramaan_evidence_video")
    return new Response("preset not allowed", { status: 400 });
  const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET!);
  return Response.json({ signature });
}
```
(For the PWA's direct uploads, the server builds `paramsToSign` itself, including `metadata`, `context`, `asset_folder`, `public_id`, from the authenticated user + chosen site, so clients can't forge org/project.)

### 6.3 Webhook (`app/api/cloudinary/webhook/route.ts`)
```ts
export const runtime = "nodejs";
import { cloudinary } from "@/lib/cloudinary";
import { enqueue } from "@/lib/jobs";

export async function POST(req: Request) {
  const body = await req.text();
  const ts = req.headers.get("x-cld-timestamp")!;
  const sig = req.headers.get("x-cld-signature")!;
  const ok = cloudinary.utils.verifyNotificationSignature(body, Number(ts), sig, 7200);
  if (!ok) return new Response("bad signature", { status: 401 });
  const evt = JSON.parse(body);
  await enqueue("cloudinary.event", evt, { idempotencyKey: `${evt.asset_id}:${evt.notification_type}:${evt.version ?? evt.batch_id ?? ""}` });
  return new Response("ok");
}
```

### 6.4 AI Vision with JSON schema (`jobs/analyze-image.ts`)
```ts
import { CloudinaryAnalysis } from "@cloudinary/analysis";
const cla = new CloudinaryAnalysis({
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  security: { cloudinaryAuth: { apiKey: process.env.CLOUDINARY_API_KEY!, apiSecret: process.env.CLOUDINARY_API_SECRET! } },
});

const analysisUrl = cloudinary.url(publicId, { transformation: [{ raw_transformation: "t_ev_analysis" }], secure: true, version });
const prompt = buildEvidencePrompt(claimContext) + "\n```json\n" + JSON.stringify(EVIDENCE_SCHEMA) + "\n```";
const res = await cla.analyze.aiVisionGeneral({ source: { uri: analysisUrl }, prompts: [prompt] });
// res.data.analysis.responses[0].value is a JSON string conforming to the schema
// log res.limits.addons_quota for the cost panel
```
(verify: the SDK's exact response field casing, e.g. `data.analysis.responses[0].value`, in its typed models)

### 6.5 Write back to Cloudinary (SMD + tags + moderation)
```ts
await cloudinary.uploader.update_metadata(
  { activity: understanding.activity, trust_score: trust.score, trust_status: trust.status,
    capture_date: captureDate, lat_e6: Math.round(lat * 1e6), lng_e6: Math.round(lng * 1e6),
    geo_status: geo.status, people_flags: peopleFlags },
  [publicId]
);
if (trust.status === "flagged" || trust.status === "needs_review") {
  await cloudinary.uploader.explicit(publicId, { type: "upload", moderation: "manual" }); // appears in Media Library → Moderation
}
```

### 6.6 Relate before/after
```ts
await cloudinary.api.add_related_assets(beforePublicId, [`image/upload/${afterPublicId}`]);
```

### 6.7 Search (Tier-1 expression built by the planner, always org-scoped)
```ts
const expr = `metadata.org_id=${orgId} AND (${validatedPlannerExpression})`;
const result = await cloudinary.search
  .expression(expr)
  .with_field("metadata").with_field("context").with_field("tags")
  .sort_by("created_at", "desc")
  .max_results(200)
  .execute();
```

## 7. URL recipes (the "transformation as lineage" layer)

Let `C = https://res.cloudinary.com/<cloud>`.

**Evidence detail (transcoded):** `C/image/upload/t_ev_detail/f_auto/q_auto/v<ver>/pramaan/<org>/ev_<id>.jpg`

**Public-safe:** `C/image/upload/t_public_safe/f_auto/q_auto/v<ver>/pramaan/<org>/ev_<id>.jpg`

**Stamped evidence (date · site · trust):**
```
C/image/upload/t_ev_detail/
co_white,b_rgb:000000AA,l_text:Arial_26_bold:12%20Mar%202025%20%C2%B7%20GA-17%20%C2%B7%20Trust%2091/fl_layer_apply,g_south_west,x_16,y_16/
l_pramaan:qr:<shortId>/c_scale,w_140/fl_layer_apply,g_south_east,x_16,y_16/
f_auto/q_auto/v<ver>/pramaan/<org>/ev_<id>.jpg
```

**Before/after composite (1600×600 canvas):**
```
C/image/upload/t_pair_half/
l_pramaan:<org>:ev_<after>/t_pair_half/fl_layer_apply,g_west,x_800/
co_white,b_rgb:000000AA,l_text:Arial_28_bold:BEFORE%20%C2%B7%2012%20Mar%202025/fl_layer_apply,g_north_west,x_16,y_16/
co_white,b_rgb:000000AA,l_text:Arial_28_bold:AFTER%20%C2%B7%2018%20Sep%202026/fl_layer_apply,g_north_west,x_816,y_16/
f_auto/q_auto/pramaan/<org>/ev_<before>.jpg
```
(Skills rule: to place an overlay *beside* the base, offset past the base edge (`g_west,x_<base_width>`) and the canvas auto-expands. Folder slashes become `:` inside `l_`. Named transformations inside a layer chain: **(verify)**; if unsupported, inline `c_fill,g_auto,w_800,h_600`.)

**Cross-fade before→after reel (video built from two stills over a 1-s blank base):**
```
C/video/upload/du_1/c_fill,w_1080,h_1350/
fl_splice:transition_(name_fade;du_1),l_pramaan:<org>:ev_<before>/c_fill,g_auto,w_1080,h_1350/du_3/fl_layer_apply/
fl_splice:transition_(name_fade;du_2),l_pramaan:<org>:ev_<after>/c_fill,g_auto,w_1080,h_1350/du_4/fl_layer_apply/
l_subtitles:arial_36:pramaan:reels:<storyId>.vtt/fl_layer_apply/
vc_auto/q_auto/f_mp4/pramaan/blank.mp4
```
Pattern follows the documented "slideshow from images using an underlying blank video" example. Upload a 1-s blank `pramaan/blank.mp4` once. For per-slide captions, **pre-render slides as images** (stamped URL → upload as `pramaan/slides/<storyId>/<n>`) and splice those, which is more robust than nesting text layers inside splice layers.

**Social card 9:16 with headline + logo + verify QR:**
```
C/image/upload/t_card_9x16/
co_white,l_text:Arial_64_bold_center:8%2C412%20saplings%20verified/c_fit,w_900/fl_layer_apply,g_north,y_120/
l_pramaan:<org>:logo/c_scale,w_220/fl_layer_apply,g_south_west,x_40,y_40/
l_pramaan:qr:<shortId>/c_scale,w_180/fl_layer_apply,g_south_east,x_40,y_40/
f_auto/q_auto/pramaan/<org>/ev_<id>.jpg
```

**Video keyframe for AI Vision:** `C/video/upload/so_12.5/c_fit,w_1024,h_1024/f_jpg/q_auto:good/<video_public_id>.jpg`

**Evidence pack PDF:** `C/image/multi/pack_<storyId>.pdf` (after `cloudinary.uploader.multi("pack_<storyId>", { format: "pdf", async: true, notification_url })`).

## 8. Video Player configuration (evidence detail)
```tsx
"use client";
import { CldVideoPlayer } from "next-cloudinary";
import "next-cloudinary/dist/cld-video-player.css";

<CldVideoPlayer
  width="1280" height="720"
  src={publicId}
  chaptersButton
  chapters
  textTracks={{ captions: { label: "Hindi (original)", default: true }, subtitles: [{ label: "English", language: "en-US" }] }}
  sourceTypes={["mp4"]}          // progressive SD for credit control in the demo
/>
```
(verify: next-cloudinary prop names for `chapters`, `chaptersButton`, `textTracks`, `title/description` against the `cloudinary-next` skill's `video-player.md` and next-cloudinary docs.)

## 9. MediaFlows (one purposeful PowerFlow)

**"Flagged evidence → reviewer alert"**
- Trigger: *metadata changed* where `trust_status ∈ {flagged, needs_review}` (JsonLogic filter).
- Blocks: Get Asset Information (with media metadata + related assets) → Condition (`people_flags` contains `minors_likely`?) → Notification (in-app + Slack/Teams channel `#pramaan-review`, or webhook to our app) → (optional) Generate Alt Text → Update metadata.
- Build it via the **MediaFlows MCP** with a logged prompt, e.g. *"Create a PowerFlow: when the structured metadata field trust_status changes to flagged or needs_review, get the asset info, and send a Slack message to #pramaan-review with the thumbnail URL, trust score and a link https://<app>/e/{{asset_id}}."*

Optional second flow: **"Transcript → WebVTT export"** for reels (Export Video Transcript block, WebVTT, Jul 2026).

## 10. MCP-driven setup script (what to ask the IDE agent, in order)
1. *Environment Config MCP:* "Create signed upload presets `pramaan_evidence` and `pramaan_evidence_video` with these settings…"
2. *Structured Metadata MCP:* "Create these metadata fields and conditional rules…"
3. *Environment Config MCP:* "Create named transformations t_ev_thumb, t_ev_detail, … with these definitions…"
4. *Environment Config MCP:* "Add a webhook notification trigger for upload, eager, moderation, info and metadata events to https://<app>/api/cloudinary/webhook."
5. *Asset Management MCP:* "Upload the seed images from ./seed with these metadata values and folders; then list assets missing GPS."
6. *MediaFlows MCP:* "Create the flagged-evidence PowerFlow…"
7. *Analysis MCP (local):* "Run ai_vision_general with this schema on these 5 seed images and show me the JSON" (prompt tuning).

Every prompt and outcome → `PROMPTS.md` (feeds the submission form).
