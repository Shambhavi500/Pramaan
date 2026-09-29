# 03 · System Architecture

> Principle: **Cloudinary does the media work (store, perceive, transform, deliver, lineage). Postgres keeps the relational and derived state (projects, sites, trust, embeddings, ledger). Claude does cross-asset reasoning (planning, comparison, narrative).** Next.js on Vercel orchestrates.

---

## 1. Component diagram

```mermaid
flowchart TB
  subgraph Client["Clients"]
    PWA["Field PWA (Next.js, offline queue)<br/>camera · GPS · SHA-256 · IndexedDB"]
    WEB["Web app (Next.js App Router)<br/>dashboard · search · compare · studio · review"]
    PUB["Public pages<br/>/verify · /s/story"]
  end

  subgraph Vercel["Next.js on Vercel (Node runtime)"]
    SIGN["/api/sign-upload<br/>(api_sign_request)"]
    HOOK["/api/cloudinary/webhook<br/>(verify signature, idempotent)"]
    PIPE["Pipeline workers<br/>(Inngest functions or route handlers + after())"]
    SRCH["/api/search (planner + hybrid exec)"]
    STORY["/api/stories (generate · render · publish)"]
    AGENT["/api/copilot (Claude tool runner)"]
    VER["/api/verify/:id (provenance)"]
  end

  subgraph Cld["Cloudinary (the evidence engine)"]
    UP["Upload API + preset pramaan_evidence<br/>media_metadata · phash · colors · faces · quality_analysis<br/>eval (intake gate) · on_success · notification_url · backup"]
    AN["Analyze API: AI Vision (JSON) · captioning · OCR · watermark"]
    VID["Video AI: auto_transcription(+translate) · auto_chaptering<br/>auto_video_details · AI Video Analysis"]
    SMD["Structured metadata · tags · context · folders · relations · moderation"]
    SAPI["Search API (Tier 1)"]
    TX["Transformation URL API → derived assets on CDN<br/>composites · redaction · stamps · reels · PDF (multi) · OG"]
    MF["MediaFlows (alerts, alt text, transcript export)"]
  end

  subgraph Data["Data plane"]
    PG[("Supabase Postgres<br/>projects · sites (PostGIS) · evidence · trust<br/>pairs · stories · derivatives · ledger<br/>pgvector embeddings · pHash index")]
    RT["Supabase Realtime"]
  end

  subgraph AI["External AI"]
    CL["Claude API (claude-opus-5-5)<br/>planner · comparison · report synthesis · copilot"]
    VO["Voyage multimodal embeddings"]
  end

  PWA -->|signed params| SIGN
  PWA -->|direct upload| UP
  WEB -->|signed widget| UP
  UP -->|webhook| HOOK --> PIPE
  PIPE --> AN
  PIPE --> VID
  PIPE --> SMD
  PIPE --> VO
  PIPE --> PG
  PG --> RT --> WEB
  WEB --> SRCH --> SAPI
  SRCH --> CL
  SRCH --> PG
  WEB --> STORY --> CL
  STORY --> TX
  STORY --> SMD
  WEB --> AGENT --> CL
  AGENT --> SAPI & AN & TX & PG
  PUB --> VER --> PG
  PUB --> TX
  SMD -.-> MF
  VID -->|webhook| HOOK
```

## 2. Ingest pipeline (sequence)

```mermaid
sequenceDiagram
  autonumber
  participant P as Field PWA
  participant S as /api/sign-upload
  participant C as Cloudinary Upload
  participant E as eval (in Cloudinary)
  participant W as /api/cloudinary/webhook
  participant J as Pipeline job
  participant AV as Analyze API (AI Vision)
  participant DB as Postgres
  participant VO as Voyage
  P->>P: hash (SHA-256), GPS, time, site, phase → IndexedDB
  P->>S: request signature (params incl. metadata/context/tags)
  S-->>P: signature + timestamp (API secret stays server-side)
  P->>C: upload (preset pramaan_evidence, chunked if video)
  C->>E: run eval with resource_info (exif, media_metadata, phash, quality, faces)
  E-->>C: upload_options: tags (no_gps / blurry / has_faces), context (exif_time, gps)
  C-->>P: upload response (asset_id, public_id, version, phash, media_metadata…)
  C->>W: notification (upload) [+ later: auto_transcription, auto_chaptering, video details]
  W->>W: verify X-Cld-Signature + timestamp, dedupe
  W->>J: enqueue analyze(asset_id)
  J->>AV: ai_vision_general(source = 1024px derived URL, prompt + JSON schema + claim context)
  AV-->>J: structured understanding (+ limits.addons_quota)
  J->>DB: pHash neighbours (bit_count(phash XOR $1) ≤ T), geofence check (PostGIS)
  J->>J: compute Trust Score (signals + reasons)
  J->>VO: embed(image URL + caption) → vector
  J->>DB: upsert evidence, trust, embedding, ledger entries
  J->>C: update SMD (activity, trust_score, trust_status, capture_date, lat_e6/lng_e6, sdg…), tags, context, moderation_status if flagged
  DB-->>P: realtime update (caption + trust badge)
```

**Why both `eval` and the webhook?** `eval` runs *inside* Cloudinary before the asset is finalized: cheap, deterministic intake tags that exist even if our backend is down. The webhook job does the expensive, cross-asset work (AI Vision, pHash search, trust, embeddings). Showing both demonstrates real understanding of the platform.

## 3. Story generation (sequence)

```mermaid
sequenceDiagram
  autonumber
  participant U as Comms / M&E user
  participant A as /api/stories
  participant DB as Postgres
  participant CL as Claude
  participant C as Cloudinary
  U->>A: generate(project, period, template)
  A->>DB: select verified evidence + pairs + indicators (+ consent)
  A->>A: build evidence bundle JSON (ids, captions, counts, dates, sites, metrics)
  A->>CL: messages.parse(structured report schema, evidence bundle, template)
  CL-->>A: report {sections[], claims[{text, evidence_ids[]}], captions, social_copy}
  A->>A: validate every evidence_id exists & is verified (reject/repair otherwise)
  A->>C: tag selected assets pack_{storyId}, then multi(tag, format pdf, transformation t_pack_page)
  A->>C: build URLs: social kit (g_auto crops + overlays + QR), reel (fl_splice transitions + l_subtitles), OG image
  A->>C: eager-generate derivatives (eager_async) for instant viewing
  A->>DB: store story, derivative records (class, transformation, base asset/version), ledger entries
  A-->>U: preview (web report, PDF link, social kit, reel)
  U->>A: publish → ledger entry, public page live
```

## 4. Async job design

| Job | Trigger | Idempotency key | Retries | Notes |
|---|---|---|---|---|
| `analyze.image` | upload webhook (image) | `asset_id:version` | 3, exp. backoff; 429 → honor quota | AI Vision on the `t_ev_analysis` derived URL (`c_fit,w_1024,h_1024/f_jpg/q_auto:good`) |
| `trust.compute` | after analyze; after reviewer override; after new near-duplicate appears | `asset_id:version:rev` | 3 | Recompute neighbours when a new asset lands near an old one |
| `embed` | after analyze | `asset_id:version` | 3 | Voyage multimodal (image + caption) |
| `video.enrich` | upload webhook (video) | `asset_id` | – | Upload preset requests `auto_transcription` (+translate), `auto_chaptering`, `auto_video_details`; completion webhooks update DB |
| `video.visual` | manual "Deep analyze" button (cost-gated) | `asset_id` | poll job | AI Video Analysis; keyframes → AI Vision |
| `pair.suggest` | nightly + on new `after` evidence | `site_id:date` | – | Candidate pairs by site, time gap, embedding similarity |
| `pair.compare` | pair approved | `pair_id` | 3 | Composite URL → AI Vision comparison + ExG metric |
| `story.render` | user action | `story_id:rev` | 3 | Eager derivatives; `multi` PDF async |
| `ledger.anchor` (P2) | hourly | `hour` | – | Publish ledger head hash as a raw asset (tamper evidence) |

Implementation options: **Inngest** (durable steps, retries, free tier) is recommended; the simplest alternative is route handlers + Next.js `after()` for short work + a `jobs` table polled by a cron (Vercel Cron).

## 5. Webhook handling

- Endpoint: `/api/cloudinary/webhook` (Node runtime). Configure as **global notification URL** (Settings → Webhook notifications, or via the Environment Config MCP) **and** per-upload `notification_url` in the preset.
- **Verify signature**: Cloudinary sends `X-Cld-Timestamp` and `X-Cld-Signature`; recompute per the *Notification signatures* doc (Node SDK: `cloudinary.utils.verifyNotificationSignature(body, timestamp, signature, validFor)`) and reject stale timestamps.
- **Idempotency**: store `(asset_id, notification_type, version/batch_id)` in a `webhook_events` table with a unique constraint; ignore repeats.
- **Types we handle**: `upload`, `eager`, `moderation`, `info` (auto_transcription/auto_chaptering/auto_video_details completion), `multi` (PDF), related-asset changes, metadata changes.

## 6. Security model

| Concern | Control |
|---|---|
| Secrets | `CLOUDINARY_API_SECRET`, `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` server-only; never `NEXT_PUBLIC_*` (Skills rule) |
| Upload abuse | **Signed uploads only**; preset restricts formats, max size, folder; per-user rate limit on `/api/sign-upload` |
| Tenant isolation | Supabase RLS by `org_id`; Cloudinary asset folders per org; Search expressions always ANDed with `metadata.org_id=<org>` server-side |
| Search injection | Claude planner output validated against a **whitelist grammar** (allowed fields/operators) before execution |
| Original protection (P1) | Store originals as `type: authenticated`; serve via **signed URLs** (`sign_url: true`); public outputs only through named transformations with redaction |
| URL tampering (prod) | Enable **Strict transformations** (only named/eager transformations served) once templates are final |
| Webhook spoofing | Signature + timestamp verification |
| Prompt injection via images (e.g. text in a photo saying "ignore instructions") | Treat AI outputs as **data**; Claude prompts wrap evidence as quoted JSON; tools that write require human confirmation |
| PII | Face/minor flags; redaction policy; location coarsening on public pages; consent withdrawal → `invalidate: true` on derived + unpublish |

## 7. Scaling considerations (answer to "is it scalable?")

- **Media heavy lifting is on Cloudinary's CDN and processing fleet**; our servers only handle metadata and orchestration.
- **Analyze once**: per-asset AI results persisted; views never trigger AI.
- **pHash search**: `bit_count(phash # $1)` over a `bigint`/`bit(64)` column is fast for 10⁵ rows; at 10⁶+ use multi-index hashing (split the hash into 4 × 16-bit bands with B-tree indexes; candidates must match ≥ 1 band exactly for distance ≤ 3), or an HNSW index on embeddings for similar-scene search.
- **Embeddings**: pgvector HNSW index; per-org partial indexes.
- **Search**: Cloudinary Search API for metadata facets (scales to millions; Tier 1 ≤ 10 M assets), PostGIS for geo, pgvector for semantics; intersect by `asset_id`.
- **Rate limits**: Free-plan Admin API 500/h, so batch SMD updates (`update_metadata` supports multiple public IDs), prefer Upload API `explicit` (not rate-limited) and webhooks over polling.
- **Multi-tenant**: org → project → site hierarchy; folder-per-org; RLS; per-org taxonomy injected into AI prompts.

## 8. Deployment topology

| Piece | Where | Notes |
|---|---|---|
| Next.js app + API routes | Vercel (Hobby) | Node runtime for routes using `cloudinary` SDK (not Edge; Skills rule) |
| Postgres + Auth + Realtime + Storage (consent docs) | Supabase (Free) | Enable `postgis`, `vector`; keep warm (pauses after 7 days idle) |
| Jobs | Inngest Cloud (Free) or Vercel Cron | |
| Media | Cloudinary (Free, default US region) | Not Asia-Pacific (transcription/chaptering unsupported there) |
| AI | Anthropic API, Voyage API | Keys in Vercel env |
| Optional automation | MediaFlows (flag alerts to Slack/email), n8n (WhatsApp bridge) | |
