# 02 · Feature Specification & User Flows

> Screen-by-screen spec with user stories, acceptance criteria, and the Cloudinary calls behind each feature. Priority: **P0** = MVP, **P1** = strong, **P2** = stretch.

---

## 0. Information architecture

```
Organization (NGO / agency / CSR program)
 └── Project  (e.g. "Aravalli Watershed Phase 2", funder: CSR Partner A, indicators)
      └── Site (geofence polygon or point+radius, code "GA-17", village, district)
           └── Evidence item  (one Cloudinary asset: image | video | audio)
                ├── capture provenance (who/when/where/device/channel/sha256)
                ├── AI understanding (activity, counts, text, people, transcripts…)
                ├── trust assessment (score, signals, status, reviewer decision)
                ├── phase (before | during | after | monitoring)
                ├── indicator links (e.g. "saplings planted")
                └── derivatives (thumbs, composites, story assets) → lineage
Pairs (before ↔ after)  ·  Stories (report, social kit, reel, public page)  ·  Ledger (append-only)
```

Roles: `field_agent` · `reviewer` (M&E) · `comms` · `org_admin` · `funder_viewer` (read-only, cross-org portfolio) · `public` (verify pages, public stories).

---

## 1. Field Capture (PWA): `/capture` · P0 (offline queue P1)

**User story:** As Ravi (field agent), I open Pramaan on my phone at a site, tap **Capture**, take photos/videos or record a voice note, and leave, even without network.

| Element | Behaviour | Tech |
|---|---|---|
| Site auto-detect | On open, get GPS (`navigator.geolocation`, high accuracy) → nearest site whose geofence contains the point; else "Choose site" | PostGIS `ST_Contains` via API (cached site list offline) |
| Project/activity/phase | Pre-filled from site; phase defaults: `before` if no evidence yet, else `during` | Local state |
| Capture | `<input type="file" accept="image/*,video/*" capture="environment">`, plus a voice-note recorder (`MediaRecorder`) | Browser |
| Client provenance | For each file: SHA-256 (`crypto.subtle.digest`), capture time (device + GPS time), lat/lng/accuracy, device UA, app version, user ID, site ID → saved with the file | Web Crypto |
| Resize guard | If > 10 MB or > 25 MP: downscale to ≤ 4096 px long edge **after** hashing the original (hash both, and record `client_resized=true`) | Canvas / `createImageBitmap` |
| Offline queue | Files + metadata stored in IndexedDB; Background Sync (or retry on `online`) uploads when connected; status chips per item | Serwist + idb-keyval |
| Upload | Signed upload to preset `pramaan_evidence` with `context`, `metadata` (SMD), `tags`, `asset_folder` | next-cloudinary signed widget **or** direct signed `fetch` to Upload API (chunked for video, `X-Unique-Upload-Id`) |
| Feedback | After sync: card shows AI caption + trust status when the webhook completes (realtime via Supabase Realtime) | Supabase Realtime |

**Acceptance:** Capture 3 photos + 1 video + 1 voice note in airplane mode → reconnect → all uploaded within 60 s, correct site/project, each gets AI understanding and a trust score within ~1–2 min.

## 2. Bulk Import: `/import` · P0

- `CldUploadWidget` (signed) with sources: `local`, `url`, `google_drive`, `dropbox`, `box`, `onedrive`, `sharepoint`; `multiple: true`; project/site chosen up front or "Auto-assign".
- `prepareUploadParams` injects `metadata: {project_id, source_channel: "bulk_import", …}` and `context`.
- Auto-assign: if EXIF GPS exists → geofence match; else AI Vision + OCR signboard + filename heuristics suggest a site, flagged "provenance: inferred" for reviewer confirmation.
- Remote uploads record `resource_info.source_url` into context via the preset's `eval` (Aug 2026 feature).

## 3. Evidence Detail: `/e/[id]` · P0

Panels:
1. **Viewer**: `CldImage` (evidence-safe transformation only) / `CldVideoPlayer` (chapters, captions, AI title).
2. **Understanding**: scene summary, activity (+ confidence), counts, visible text, setting, season cues; for video: transcript (orig + EN), visual transcript timeline, chapters.
3. **Trust**: score gauge + signal table (✓/⚠/✗ with reason and source, e.g. "pHash distance 3 to ev_…" linking to the other asset).
4. **Provenance**: capturer, device, capture vs upload time, GPS (+ accuracy) on a mini-map with the site geofence, channel, SHA-256 (client) vs Cloudinary `etag`, version history.
5. **Lineage**: graph of derivatives (thumbs, composites, story assets) with transformation strings and class badges.
6. **Relations**: pairs, related video/transcript, same-site timeline strip.
7. **Actions** (reviewer): Approve / Reject / Request re-capture / Edit metadata / Mark consent.
8. **Pipeline inspector** (toggle): shows the exact Cloudinary calls/URLs used (for judges and debugging).

## 4. Review Queue: `/review` · P0

- Lists `trust_status in (needs_review, flagged)` sorted by risk; bulk actions.
- Approve/Reject writes: our DB (decision + reason + reviewer), **Cloudinary moderation status** (`update(public_id, {moderation_status})` when the asset was uploaded with `moderation: "manual"`), SMD `trust_status`, and a **ledger entry**.
- Keyboard-first (J/K navigate, A approve, R reject) for speed.
- **Acceptance:** Reviewer clears 20 items in < 5 minutes; every decision is visible in the evidence's ledger.

## 5. Project Dashboard: `/p/[projectId]` · P0 (coverage metrics P1)

- **Header KPIs**: evidence count, % verified, sites with recent evidence, open flags.
- **Indicators** (e.g. saplings planted, check dams built, trainings held): claimed value (from project plan/MIS) vs. **evidence-backed value** → **Evidence Coverage %**.
- **Map** (MapLibre + OSM): site geofences, evidence pins colored by trust; clustering.
- **Timeline**: horizontal per-site strip of thumbnails by capture date; phase markers (before/during/after).
- **Alerts**: sites without evidence in N days; flag spikes per uploader (fraud pattern).

## 6. Search: `/search` · P0 (semantic P1)

- **NL bar** → Gemini query planner returns a validated plan: `{cloudinary_expression, semantic_query, geo, time, sort, explanation}` → executed as a hybrid (Cloudinary Search API ∩ PostGIS ∩ pgvector) → results with **"why matched"** chips (e.g. `activity=check_dam`, `2.1 km from Jhabua`, `semantic 0.82: "stone check dam across dry stream"`).
- **Facets**: project, site, activity, SDG, phase, date range, trust status, media type, has people, consent.
- **Find similar**: from any evidence → embedding kNN (+ pHash for near-duplicates).
- Details in `09_search_and_discovery.md`.

## 7. Compare: `/compare` and `/compare/[pairId]` · P0 (reel & metrics P1)

- **Suggestions list**: candidate pairs per site (same site/geofence, similar viewpoint, ≥ 14 days apart, `before`→`after/monitoring` phases) with a pairing confidence.
- **Pair view**: slider (react-compare-slider) · labeled side-by-side composite (Cloudinary URL) · animated flip GIF/WebP · cross-fade reel (`fl_splice:transition`) · **AI comparison** (AI Vision on the composite) · **deterministic metric** (ExG green-cover index Δ) with the method explained · "Add to story".
- Approve pair → `add_related_assets` both ways + DB pair record + ledger entry.
- Details in `08_before_after_engine.md`.

## 8. Story Studio: `/studio` · P0 (report + PDF) / P1 (social, reel, public page)

Wizard:
1. **Choose scope**: project(s), period, audience template (CSR partner quarterly, Govt stage report, Social campaign, Annual report).
2. **Evidence selection**: auto-selects verified evidence ranked by relevance/quality/diversity; user can pin/unpin. **Only `verified` evidence is eligible** (policy).
3. **Generate**: Gemini drafts a structured report (sections, key numbers, claims **each citing evidence IDs**), captions and social copy (EN + HI).
4. **Render** via Cloudinary: PDF evidence pack (`multi` on tag `pack_<storyId>`), 4 social formats, 20-s reel, public story page with OG image; consent redaction applied automatically; "Verify" QR on every visual.
5. **Review & publish**: diff view of claims vs. evidence; publish writes ledger entries and marks derivatives as `published`.

Details in `10_impact_story_studio.md`.

## 9. Public Verify Page: `/verify/[derivativeId]` · P0

- Opened from the QR/short link printed on any output.
- Shows: the delivered image (as published), **the evidence it derives from** (original or redacted view per consent), capture time/place (coarsened to ~1 km for privacy if needed), trust score & signals, reviewer decision, hash values, **transformation chain** with class labels, ledger excerpt, and C2PA status ("signed", or "not enabled").
- No login. Rate-limited. Cacheable.

## 10. Public Story Page: `/s/[storyId]` · P1

- Scrollytelling page: headline numbers → before/after sliders → reel → map → "How we verified this" section → download PDF.
- OG image via `getCldOgImageUrl` (composite + headline stat).

## 11. Admin: `/admin` · P0 (parts) / P1

| Section | What |
|---|---|
| Taxonomy | Activities (→ AI Vision tag definitions & JSON enum), SDG mapping, indicators |
| Sites | Draw geofences (MapLibre draw) or point + radius; site codes |
| Consent | Consent records (per person / per event), link to assets; withdrawal flow |
| Policies | Trust thresholds, pHash distance threshold, public redaction policy, GenAI allowance |
| Cost panel | Cloudinary `usage` (credits, tx, storage, bandwidth), add-on quotas from `limits.addons_quota`, Gemini token usage |
| Pipeline health | Webhook log, job statuses, failures/retries |
| Cloudinary setup check | Verifies SMD fields, presets, named transformations, webhooks exist (created via MCP; this screen proves it) |

## 12. Evidence Copilot (runtime agent): side panel · P1

- Chat panel available on project/search pages: *"Which sites have no after-photos yet?"*, *"Draft a 150-word update on Bhil Khedi check dam with the best before/after"*, *"Why was ev_… flagged?"*
- Implemented as Gemini + tools that call Cloudinary (search, get asset, analyze, build composite, relate, create PDF pack) and our DB. Human-in-the-loop: write actions (relate, publish) require confirmation.

## 13. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | Evidence grid LCP < 2.5 s on 4G (thumbnails `c_fill,g_auto,w_320/f_auto/q_auto`, lazy) |
| Reliability | All AI/analysis async with retries; idempotent webhook handling (dedupe by `asset_id` + `notification_type` + version) |
| Security | Signed uploads only; API secret server-side; webhook signature verification; RLS per org in Supabase; signed/authenticated delivery for originals (P1) |
| Privacy | Public derivatives redacted unless consent `obtained`; minors never public unless guardian consent recorded; location coarsening option |
| Accessibility | Alt text from AI captions; video captions; WCAG AA contrast; keyboard review |
| i18n | English + Hindi UI strings (P2); bilingual captions (P1) |
| Cost | Analyze once; eager async derivatives; budget guardrails (`02_cloudinary/06_plans_limits_costs.md`) |
