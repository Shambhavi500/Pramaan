# 11 · Tech Stack: Choices, Rationale, Alternatives

> Criteria: (1) satisfies the Cloudinary challenge requirements, (2) fastest path to a **production-ready live demo** in ~12 days, (3) free or near-free tiers, (4) credible scalability story, (5) team familiarity (TypeScript).

---

## 1. Stack at a glance

| Layer | Choice | Version / plan | Why | Alternatives considered |
|---|---|---|---|---|
| App framework | **Next.js (App Router)** scaffolded with **`npx create-cloudinary-next`** | Next 16.2.x, React 19.2, TS 5, Tailwind 4 (from the kit) | **Required starter kit**; server routes for signing/webhooks/AI; Vercel deploy; `next-cloudinary` | React/Vite kit (no server; would need a separate backend) |
| Cloudinary client | **`next-cloudinary`** (`CldImage`, `CldUploadWidget`, `CldVideoPlayer`, `getCldImageUrl`, `getCldOgImageUrl`) | ^6.18 | Official Next.js SDK; Skills Pack covers it | `@cloudinary/url-gen` |
| Cloudinary server | **`cloudinary` Node SDK v2** (`import { v2 as cloudinary }`) | latest v2 | Upload, explicit, Admin, Search, metadata, relations, `multi`, signatures | REST directly |
| Cloudinary AI | **`@cloudinary/analysis`** typed SDK (Analyze API) | 0.4.x | Typed AI Vision/captioning/OCR calls with retries & typed errors; newest SDK surface | Raw `fetch` to `/v2/analysis` |
| Cloudinary dev tooling | **Skills Pack**, **AI Power Start**, **MCP** (Asset Mgmt, Env Config, Structured Metadata, Analysis local, MediaFlows), VS Code extension | – | Challenge requirement + faster correct code | – |
| UI | Tailwind 4 + **shadcn/ui** (Radix) + lucide icons | – | Fast, accessible, polished | Mantine, Chakra |
| Maps | **MapLibre GL JS** + OpenStreetMap-based tiles (e.g. MapTiler free key) + `@mapbox/mapbox-gl-draw`-compatible draw for geofences | – | Open, free, performant | Leaflet (simpler), Mapbox (keys/cost) |
| Before/after slider | `react-compare-slider` | – | Tiny, accessible | custom |
| Charts | Recharts (or Tremor) | – | Dashboard KPIs | Chart.js |
| PWA / offline | **Serwist** (`@serwist/next`) + **idb-keyval** (IndexedDB) + Background Sync / online-retry | – | Offline capture queue; installable app | next-pwa (older), Workbox direct |
| Database | **Supabase Postgres** with **PostGIS** + **pgvector**; Supabase **Auth** + **Realtime** + Storage (consent docs) | Free tier (500 MB DB; pauses after 7 days idle) | One vendor for relational + geo + vectors + auth + realtime | Neon + Clerk + Qdrant/Pinecone |
| Jobs | **Inngest** (durable functions, retries, idempotency) | Free tier | Reliable async pipeline on serverless | Next.js `after()` + Vercel Cron + jobs table; Trigger.dev; Upstash QStash |
| LLM | **Claude API**, model **`claude-opus-5-5`** (Claude Opus 5.5) via `@anthropic-ai/sdk` | $4 / $20 per MTok; 1M context; 128K max output | Strong multimodal reasoning, structured outputs, tool runner | – |
| Embeddings | **Voyage `voyage-multimodal-3.5`** | Free allowance (verify) | Images + text in one space (Visual Search substitute) | Text-only embeddings of captions; open CLIP/SigLIP self-hosted |
| Image math | `sharp` (ExG green index on small derivatives) | – | Deterministic change metric | – |
| QR codes | `qrcode` (server) → upload PNG to Cloudinary once per derivative | – | Verify links on outputs | – |
| Hashing | Web Crypto (client SHA-256), Node `crypto` (ledger) | – | Integrity | – |
| Validation | **Zod** (shared schemas for AI outputs, API I/O, planner) | – | One schema for Claude structured output + runtime validation | – |
| Hosting | **Vercel** (Hobby) | – | Required live demo URL; preview deploys | Netlify, Render |
| Automation | **MediaFlows** (in-Cloudinary), **n8n** (sponsor; WhatsApp/Telegram bridge, stretch) | – | Low-code ops; sponsor alignment | Zapier |
| Monitoring | Vercel logs + Sentry (free) + a Cost panel (Cloudinary `usage`, add-on quotas, Claude usage) | – | Demo-day safety | – |
| Testing | Vitest (units: classifier, trust, planner compiler), Playwright (smoke on the live URL) | – | Production-readiness | – |

## 2. Claude API usage specifics (current API, Sep 2026)

| Topic | Guidance for our code |
|---|---|
| Model | `claude-opus-5-5` for all reasoning routes (planner, pair second opinion, report synthesis, Copilot). Exact ID string, no date suffix. |
| Effort | Set `output_config.effort` explicitly (Opus 5.5 default is `medium`): planner `low`, pair check `medium`, report `high`. Thinking is adaptive and always on for Opus 5.5 (it cannot be disabled; don't send `thinking: {type: "disabled"}` or `budget_tokens`). |
| Structured output | `client.messages.parse({ …, output_config: { format: zodOutputFormat(Schema) } })` → `response.parsed_output` (null on parse failure → retry). The old `output_format` param is deprecated. |
| Tools / agent | `client.beta.messages.toolRunner({ model, max_tokens, tools: [betaZodTool({...}), …], messages })`. **Forced `tool_choice` (`any`/`tool`) returns 400 on Opus 5.5**, so use `auto`, clear descriptions, `strict: true` on JSON-schema tools; validate inputs before write actions. |
| Refusal fallback | On beta calls (Claude API only): `betas: ["server-side-fallback-2026-07-01"]`, `fallbacks: "default"`; always check `stop_reason` (`refusal`) before reading content. |
| Vision | `{ type: "image", source: { type: "url", url: <Cloudinary t_ev_analysis URL> } }`. Cloudinary downsizes before Claude sees it (cheaper, faster). |
| Prompt caching | Top-level `cache_control: { type: "ephemeral" }`; keep the system prompt + taxonomy + template stable and first; volatile evidence bundle last. Verify with `usage.cache_read_input_tokens`. |
| Streaming | Use `.stream()` + `.finalMessage()` for long report generations (avoids HTTP timeouts on large `max_tokens`). |
| Batches | Message Batches API (50% cost) for bulk, non-interactive work (e.g. regenerating captions for 300 images in Hindi overnight). |
| Prefill | Not supported on current models; use structured outputs instead. |
| Errors | Catch SDK typed errors most-specific-first (rate limit vs. API status vs. connection); retry 429/5xx with backoff. |

## 3. Repository layout (proposed)

```
pramaan/
├─ app/
│  ├─ (auth)/login/
│  ├─ capture/            # field PWA capture
│  ├─ import/             # bulk import (CldUploadWidget)
│  ├─ p/[projectId]/      # dashboard: KPIs, map, timeline, indicators
│  ├─ e/[evidenceId]/     # evidence detail
│  ├─ review/             # queue
│  ├─ search/
│  ├─ compare/[pairId]/
│  ├─ studio/             # story wizard
│  ├─ s/[storyId]/        # public story page
│  ├─ verify/[dvId]/      # public provenance page
│  ├─ admin/              # taxonomy, sites, consent, policies, cost, setup check
│  └─ api/
│     ├─ sign-upload/route.ts
│     ├─ cloudinary/webhook/route.ts
│     ├─ search/route.ts
│     ├─ stories/route.ts
│     ├─ copilot/route.ts
│     └─ inngest/route.ts
├─ lib/
│  ├─ cloudinary.ts        # server SDK config
│  ├─ analysis.ts          # @cloudinary/analysis client
│  ├─ urls/                # URL builders + classifier + generative firewall
│  ├─ trust/               # signals, aggregation, explanations
│  ├─ search/              # planner schema, compiler, fusion
│  ├─ ai/                  # Claude clients, prompts, zod schemas
│  ├─ ledger.ts
│  └─ db/                  # supabase client, queries
├─ jobs/                   # inngest functions: analyze, trust, embed, pair, story.render
├─ cloudinary/             # IaC-ish: presets.json, smd-fields.json, named-transformations.json, eval.js
├─ db/migrations/
├─ seed/                   # demo corpus manifest + labeled test set
├─ docs/                   # cloudinary-environment.json (Power Start), architecture, eval results
├─ .claude/skills/  .agents/skills/  .mcp.json  .cursor/mcp.json
├─ PROMPTS.md  CREDITS.md  README.md
```

## 4. Environment variables

| Var | Scope | Notes |
|---|---|---|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | public | From the kit |
| `NEXT_PUBLIC_CLOUDINARY_API_KEY` | public | Needed by the signed upload widget |
| `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | **server only** | Never `NEXT_PUBLIC_` |
| `CLOUDINARY_URL` | server only | Alternative single var (MCP local, CLI) |
| `ANTHROPIC_API_KEY` | server only | Claude |
| `VOYAGE_API_KEY` | server only | Embeddings |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | RLS-protected |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Jobs |
| `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` | server only | Jobs |
| `NEXT_PUBLIC_MAPTILER_KEY` | public | Map tiles |
| `APP_BASE_URL` | server | Webhook/verify links |

## 5. Why not X? (quick answers for judges)
- **Why not just S3 + an LLM?** We'd rebuild EXIF/pHash/quality extraction, AI Vision, transcription/chaptering, transformations, CDN, versions/backups and the Media Library. Cloudinary gives the evidence engine plus a UI NGO staff can use directly.
- **Why Postgres besides Cloudinary metadata?** Geo polygons, vectors, relational indicators, and an append-only ledger aren't DAM concepts; SMD mirrors keep Cloudinary searchable and the Media Library meaningful.
- **Why Claude and not only Cloudinary AI Vision?** Cloudinary AI handles single-asset perception; cross-asset reasoning (reports citing 40 assets, query planning, agents) needs a general reasoning model.
- **Why an LLM planner for search?** NL queries mix geography, time, taxonomy and semantics; the planner makes a typed, inspectable plan (not a black box), compiled by whitelisted code.
