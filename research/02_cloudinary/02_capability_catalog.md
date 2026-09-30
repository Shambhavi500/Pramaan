# 02 · Capability Catalog (Mapped to the Problem Statement)

> An exhaustive, lifecycle-ordered catalog of Cloudinary capabilities relevant to PS-02, with **exact syntax**, **which requirement (R1–R6) it serves**, and **availability on the Free plan**.
> Legend: ✅ available on Free · 🟡 free tier of an add-on / trial credits · 🔶 beta · 🔒 Enterprise/advanced or on request.
> All syntax verified against cloudinary.com/documentation/*.md pages fetched on 29 Sep 2026.

---

## A. Ingest (R1)

| Capability | Syntax / API | Why we need it | Avail. |
|---|---|---|---|
| **Upload API** (server, signed) | `cloudinary.uploader.upload(file, {...})`, `upload_stream`, `upload_large` (chunked) | Server-side imports (bulk, WhatsApp/n8n bridge), full control of params | ✅ |
| **Upload Widget** | `CldUploadWidget` (next-cloudinary); sources `local`, `camera`, `url`, `google_drive`, `dropbox`, **`box`, `onedrive`, `sharepoint`** (Aug 2026); `maxChunkSize` ≥ 5 MB; `clientAllowedFormats`; `maxImageFileSize`; `prepareUploadParams` can set `context`, `metadata`, `tags`, `folder`, `publicId`, `qualityAnalysis`… | Web/mobile upload with signed params and structured metadata attached at upload | ✅ |
| **Signed uploads** | Route handler signs with `cloudinary.utils.api_sign_request` (Skills: `app-router-signature-route.ts`) | Never expose API secret; evidence uploads must be authenticated | ✅ |
| **Upload presets** | Console or Admin API `upload_presets`; can bundle add-ons, `eval`, `on_success`, eager, metadata defaults | One place to enforce the intake pipeline for all channels | ✅ |
| **Pre-upload `eval` script** | `eval: "if (resource_info.quality_analysis.focus < 0.5) { upload_options['tags'] = 'blurry' }"` · `resource_info` exposes `exif`, `media_metadata`, `phash`, `quality_analysis`, `faces`, `colors`, `coordinates`, `width/height`, `duration`, **`source_url`** (Aug 2026) | **Intake gate inside Cloudinary**: tag `no_gps`, `blurry`, `has_faces`, write context from EXIF before the asset is finalized | ✅ |
| **Post-upload `on_success` script** | `on_success: "current_asset.update({tags:[...], context:{...}, metadata:{...}})"` with access to `e.upload_info` (incl. `info.detection.captioning`) | Write AI results (e.g. caption) into metadata automatically | ✅ |
| **Async upload + webhooks** | `async: true`, `notification_url`, global notification URLs; eager `eager_async` + `eager_notification_url` | Robust pipeline; never block the field user | ✅ |
| **Remote fetch / upload from URL** | `upload("https://…")`, `/image/fetch/<url>` | Ingest from Drive/WhatsApp media URLs; satellite tiles as context layers | ✅ |
| **Chunked large uploads** | `upload_large`, widget `maxChunkSize` | Field video on flaky networks | ✅ |
| **Backups & versions** | `backup: true` (or account default) ; restore via Admin API; version history | Immutable originals; recoverability = evidence integrity | ✅ ("Auto-backup & revision tracking") |
| **Overwrite protection** | `overwrite: false`, `unique_filename: true` | Evidence must never be silently replaced | ✅ |
| **Claimable Cloud** | `npx @cloudinary/cloud` (agent provisions a 24-h claimable account) | Fast setup via AI Power Start | ✅ |

## B. Analyze / Understand (R1, R2)

| Capability | Syntax / API | Output | Avail. |
|---|---|---|---|
| **Embedded media metadata** | upload/explicit `media_metadata: true` | EXIF, IPTC, XMP, **GPS**, DateTimeOriginal, device make/model | ✅ |
| **Perceptual hash** | `phash: true` | 64-bit fingerprint → Hamming distance for near-duplicate detection | ✅ |
| **Colors** | `colors: true` | Predominant colors + histogram (e.g. green share as vegetation proxy) | ✅ |
| **Faces** | `faces: true` | Face coordinates (drives consent + redaction) | ✅ |
| **Quality analysis** | `quality_analysis: true` | Focus, noise, exposure etc. (extended scores on paid beta) | ✅ (basic) |
| **Accessibility analysis** | `accessibility_analysis: true` | Colorblind accessibility score | ✅ |
| **AI Vision: Tagging mode** | `POST /v2/analysis/<cloud>/analyze/ai_vision_tagging` · `tag_definitions` (≤10 {name, description}) | Custom-taxonomy tags (e.g. "check_dam: Does the image show a masonry/earthen check dam across a stream?") | 🟡 add-on (token quota) |
| **AI Vision: General mode** | `…/analyze/ai_vision_general` · `prompts` (≤10) · **JSON-Schema structured output** (schema fenced in the prompt; Feb 2026) | Structured scene understanding, counts, recapture/AI-gen cues, claim-match | 🟡 |
| **AI Vision: Moderation** | `aiVisionModeration` in the `@cloudinary/analysis` SDK | Yes/no policy questions | 🟡 |
| **Captioning** | `detection: "captioning"` on upload, or `…/analyze/captioning` | One-sentence caption | 🟡 Content Analysis add-on |
| **Object detection models** | `coco`, `lvis`, `unidet`, `human_anatomy`, `cld_fashion`, `cld_text`, `shop_classifier` (Analyze API or `detection:` on upload) | Objects + bounding boxes; text presence/location | 🟡 |
| **Image Quality Analysis (IQA)** | `detection: "iqa"` / `…/analyze/image_quality` | Quality score | 🟡 |
| **Watermark detection** | `detection: "watermark"` / `…/analyze/watermark_detection` | Catches stock/web-sourced images with watermarks | 🟡 |
| **Google auto-tagging / logo detection** | `categorization: "google_tagging", auto_tagging: 0.6` · `google_logo_detections` | Generic labels; logos | 🟡 |
| **OCR** | `ocr: "adv_ocr"` | Text + coordinates (project signboards, plaques, registers) | 🟡 OCR add-on |
| **Duplicate Image Detection** | `moderation: "duplicate:0.8"` (threshold); results via webhook + moderation lists | Near-duplicate rejection across the library | 🔶 Beta, request from support |
| **Video transcription** | `auto_transcription: true` or `{original_language: "hi", translate: ["en-US"]}` → `<public_id>.transcript` (word timings + confidence) | Speech → text for field interviews/testimonials | ✅ native (translation needs Google Translation add-on 🟡); not in AP data center |
| **Auto chaptering** | `auto_chaptering: true` → `<public_id>-chapters.vtt` | Navigable long field videos | ✅ (not in AP data center) |
| **Auto video details** | `auto_video_details: true` → AI title, description, **tags** in context (1 tx/s) | Instant cataloging of videos with dialogue | ✅ (counts tx) |
| **AI Video Analysis (visual transcription)** | `POST /v2/video/<cloud>/ai_video_analysis {video_asset_id, visual_transcription_prompt}` → poll job → `.visual.transcript` JSON `[{transcript,start_time,end_time}]` | Describes *what is visible* per segment, even without audio (20 tx/s) | 🔶 Beta (counts tx) |
| **Video tagging / moderation** | `categorization: "google_video_tagging"`, Google/AWS video moderation add-ons | Video labels, safety | 🟡 |
| **Advanced facial attributes** | add-on | Age/gender/landmarks: **avoid** (ethics) except minor-likely flag | 🟡 |
| **Cloudinary Moderation** | Console product; rules; one-time or ongoing | Quality/brand/compliance; AI-generated + web-sourced detection on advanced plans | ✅ 500 free actions; 🔒 advanced checks |
| **Media Inspector** (browser extension, GA Jan 2026) | Chrome extension | Debug delivered media | ✅ |

## C. Manage / Organize (R1, R5, R6)

| Capability | Syntax / API | Use | Avail. |
|---|---|---|---|
| **Structured metadata (SMD)** | Admin API `metadata_fields` (types: `string`, `integer`, `date`, `enum`, `set`); `mandatory`, `default_value`, `validation` (ranges, `strregex`, `strlen`), `datasource` (≤3000 values), `restrictions` (`readonly_ui`, `hidden_ui`, `excluded_from_search`) | Our evidence schema: `project_id`, `site_id`, `activity`, `sdg`, `phase`, `capture_date`, `lat_e6/lng_e6`, `trust_score`, `trust_status`, `consent_status`, `evidence_class`… | ✅ |
| **Conditional metadata rules** | Admin API `metadata_rules` | e.g. if `activity=plantation` → show `species`, `sapling_count` | ✅ |
| **Contextual metadata** | `context: {caption, alt, …}` | Captions, alt text, AI summaries | ✅ |
| **Tags** | `tags`, `add_tag`, `replace_tag`, `/image/list/<tag>.json` (client-side list) | Groupings for PDF packs, pairs, flags | ✅ |
| **Asset folders** | `asset_folder` (dynamic folder mode) | `pramaan/<org>/<project>/<site>/` | ✅ |
| **Related assets** | `add_related_assets(public_id, [ "image/upload/x", … ≤10 ])`, bidirectional; `add_related_assets_by_asset_id`; webhooks for related assets (Feb 2026) | Before↔after, video↔transcript, original↔story derivative | ✅ |
| **Moderation queue** | `moderation: "manual"`; `resources_by_moderation`; `update(…, {moderation_status: "approved"})`; Media Library Moderation view | Human review of low-trust evidence | ✅ |
| **Explicit** | `explicit(public_id, {media_metadata, phash, …, eager})` | Re-analyze existing assets; not rate-limited | ✅ |
| **Derived asset management** | List/destroy derived assets per asset (DAM Sept 2025) | Lineage inspection, cleanup | ✅ |
| **People Search API** | `/people` | Cluster people across library | 🔒 Assets Enterprise |
| **DAM AI Agents** (Taxonomy, Search, Workflow) | Console "Chat with AI" | – | 🔒 Assets Enterprise, beta |

## D. Search & Discovery (R5)

| Capability | Syntax | Notes | Avail. |
|---|---|---|---|
| **Search API: Tier 1** | `cloudinary.search.expression('metadata.project_id=GA17 AND metadata.trust_score>=80 AND resource_type:image').with_field('metadata').with_field('context').with_field('tags').sort_by('created_at','desc').max_results(100).execute()` | Fields: `tags`, `context.*`, `metadata.*`, `public_id`, `asset_folder`, `created_at`, `uploaded_at`, `resource_type`, `format`, `bytes`, dims, `moderation_status`…; Lucene-like `AND/OR/NOT`, ranges, `:` tokenized vs `=` exact, prefix `*` | ✅ |
| **Search API: Tier 2 (premium)** | `location:"23.83,74.53 5km"` (point radius / bbox / polygon over GPS), `taken_at:[…]` (EXIF date), `image_metadata.*`, `colors.green>=20`, `face_count`, `illustration_score`, `quality_analysis.*`, aggregations | **Very relevant, but Tier 2 is "available upon request for Advanced plans and higher."** On Free we **copy these values into structured metadata** (Tier 1) at ingest and do geo in PostGIS. | 🔒 |
| **Cacheable search URLs** | Signed search URL returning cached JSON | Public portals | ✅ |
| **Visual Search** (by image or **text**) | `visual_search({text: "flooded road"})` / `image_url` / `image_asset_id` | Exactly "semantic discovery", but **Enterprise only**. We build an equivalent with embeddings. | 🔒 |
| **Folder search** | `search_folders` | Navigation | ✅ |

## E. Transform & Compose (R3, R4, R6)

| Capability | Syntax | Use | Avail. |
|---|---|---|---|
| **Resize/crop** | `c_fill,g_auto,w_,h_`, `c_fit`, `c_pad`, `c_limit`, `c_thumb,g_face`, `ar_16:9`, `g_auto:<object>` | Uniform evidence thumbnails; social aspect ratios | ✅ |
| **Image overlays / side-by-side** | `l_<id>/…/fl_layer_apply,g_west,x_<w>` (canvas auto-expands), `fl_relative` | Before/after composites | ✅ |
| **Text overlays** | `co_white,b_rgb:00000099,l_text:Arial_28_bold:<urlenc>/fl_layer_apply,g_south_west,x_12,y_12`; Google Fonts supported (May 2026) | Date/GPS/trust stamps, report headlines | ✅ |
| **Image from text** | Upload API `text` method | Title cards for reels | ✅ |
| **Redaction** | `e_pixelate_faces[:N]`, `e_blur_faces[:N]`, `e_blur_region:800,g_ocr_text` / `e_pixelate_region:15,g_ocr_text` (needs OCR add-on), `e_blur_region` with explicit `x,y,w,h` | Privacy-by-transformation for public outputs | ✅ (OCR-gravity needs add-on 🟡) |
| **Enhancement** | `e_improve`, `e_auto_enhance` (100 tx), `e_enhance`, `e_upscale`, `e_gen_restore` (100 tx) | Only in Story layer; label as edited | ✅ (costly) |
| **Generative** | `b_gen_fill` (50 tx), `e_gen_remove` (50), `e_gen_replace` (120), `e_gen_recolor` (50), `e_gen_background_replace` (230), `e_background_removal` (75), `e_extract` (75) | **Never on evidence.** `b_gen_fill` only for social aspect-ratio extension, labeled | ✅ (costly) |
| **Conditionals & variables** | `if_ar_gt_1.0/…/if_else/…/if_end`, `$w_…` | Orientation-aware templates | ✅ |
| **Named / baseline transformations** | `t_public_safe`, `bl_bgrem/…` | Policy + cost control | ✅ |
| **Animated images** | `multi` API (animated GIF/WebP from tag), `fl_animated,fl_awebp`, `f_auto:animated` | Before/after flip-GIFs | ✅ |
| **PDF from images** | Upload API `multi(tag, {format: "pdf", transformation…})` → `/image/multi/<tag>.pdf`; ≤100 sync / ≤500 async images; **Free accounts must enable "Allow delivery of PDF and ZIP files" in Security settings** | Evidence packs | ✅ (setting) |
| **Archives** | `create_zip`, `download_zip_url` (signed, 1-h), `download_folder` | Auditor evidence export | ✅ (ZIP delivery setting on Free) |
| **Provenance signing (C2PA)** | `fl_c2pa` on delivery; images only (avif/heic/jpg/png/svg/tif/webp); classifies actions as **transcoded** (`c_fit`,`c_mfit`,`c_pad`,`c_lpad`,`c_mpad`,`f_*`,`q_*`, single-dim `c_scale`) vs **edited** (everything else) | Signed Content Credentials on published images | 🔶 Beta, **on request** |
| **Delivery URL signatures** | `s--<sig>--` signed URLs; `authenticated` type | Protect originals | ✅ |

## F. Video composition (R3, R4)

| Capability | Syntax | Use | Avail. |
|---|---|---|---|
| **Trim** | `so_`, `eo_`, `du_` (seconds or `p` percent) | Clip highlights | ✅ |
| **Concatenate** | `fl_splice,l_video:<id>/…/fl_layer_apply`; images spliced with `du_<s>` | Assemble reels from clips + stills | ✅ |
| **Cross-fade transitions** | `fl_splice:transition_(name_fade;du_2)` (also `circleopen`, `pixelize`, `hlslice`…) | Before→after morph reels | ✅ |
| **Slideshow from images** | Blank base video + chained `fl_splice:transition,l_<img>/du_6/…` | Photo-evidence reels without video footage | ✅ |
| **Subtitles** | `l_subtitles:arial_28:<public_id>.vtt/fl_layer_apply` (vtt/srt; transcripts exportable to SRT/VTT via MediaFlows) | Burned-in bilingual captions | ✅ |
| **Audio layer** | `l_audio:<id>` | Music/voice-over on reels | ✅ |
| **Smart crop for vertical** | `c_fill,g_auto,ar_9:16` (10 tx/s extra for AI gravity) | Reels/Shorts | ✅ |
| **AI preview** | `e_preview:duration_8` (2 tx/s of input) | Teasers | ✅ |
| **Progress bar, fade, boomerang, loop** | `e_progressbar`, `e_fade`, `e_boomerang`, `e_loop` | Polish | ✅ |
| **ABR streaming** | `sp_auto` (8 tx/s ≤1080p) | Low-bandwidth playback | ✅ |
| **Image-to-Video** | Console app + Image-to-Video API (`/v2/video/<cloud>/…`); start+end frames or references; 4/6/8 s; 720p/1080p; presets | "Living photo" hero for campaigns. **Label as AI-generated; never evidence.** | 🔶 Beta; Free = **16 trial credits (16 s, or 8 s with audio)** |
| **Video Canvas** (Aug 2026) | Node editor → applets backed by named transformations; Video Canvas API | Visual authoring of our reel template | 🔶 Beta |

## G. Deliver & Present (R4, R5)

| Capability | Syntax | Use | Avail. |
|---|---|---|---|
| **Auto format/quality** | `f_auto/q_auto` (images), `f_auto:video/q_auto` (video), `q_auto:eco` | Field-friendly bandwidth | ✅ |
| **Responsive** | `w_auto`, `dpr_auto` (Chromium + Client Hints), `CldImage sizes` | Mobile field app | ✅ |
| **Video Player** (v4, May 2026) | `CldVideoPlayer`; `chapters: true`, `chaptersButton`, text tracks from `.transcript` (paced subtitles, word highlight), `title/description: true` (AI), AI highlights graph, download button, Player Studio/Profiles/Config API | Evidence video viewer with chapters + bilingual captions | ✅ |
| **OG images** | `getCldOgImageUrl` in `generateMetadata` | Public story pages share well on WhatsApp/LinkedIn | ✅ |
| **Product Gallery / Media Library widget** | widgets | Optional donor portal gallery; embed DAM | ✅ |
| **Strict transformations** | Security setting: only named/eager transformations allowed | Production hardening against URL tampering | ✅ |

## H. Automate & Integrate (R1, R4)

| Capability | Notes | Avail. |
|---|---|---|
| **Webhooks** | Upload, eager, moderation, auto-transcription/chaptering, metadata changes, related-asset changes; verify with **notification signatures** | ✅ |
| **MediaFlows (EasyFlows/PowerFlows)** | Triggers: upload, upload-preset, metadata change, schedule, proof status; blocks: Gemini Analyze Image By Prompt, Generate Alt Text, Video Transcription/Chaptering/Export (SRT/WebVTT, with SMD), Condition (JsonLogic), Notification (in-app/Slack/Teams/webhook), Universal API, Image generation, Image-to-Video… Billed in **touchpoints** | ✅ (check quota) |
| **MediaFlows MCP** | `https://mediaflows.mcp.cloudinary.com/v2/mcp` with `cld-cloud-name`, `cld-api-key`, `cld-secret` headers | Build flows by prompt from the IDE | ✅ |
| **n8n node** | Upload (URL/file), build URLs, video players, update tags/SMD, get tags/SMD defs | WhatsApp/Telegram → Cloudinary ingest (n8n is an event sponsor) | ✅ |
| **CLI** | `cld` (pipx/uv/Docker), `cld login` (OAuth), `cld agent signup` | Scripting setup | ✅ |

## I. AI developer tooling (hackathon requirement)

See `05_developer_ai_tooling.md`. Includes Starter Kits, Skills Pack (4 skills), AI Power Start prompt, remote/local MCP servers (Asset Management, Environment Config, Structured Metadata, Analysis, MediaFlows), marketplace plugins (Cursor, ChatGPT, Codex), VS Code extension, llms.txt, transformation rules, Context7.
