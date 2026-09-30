# 05 · Cloudinary AI Developer Tooling: Starter Kits, Skills, MCP, Power Start

> Requirement #1 of the Cloudinary challenge is to use these tools. Everything below was **inspected directly**: npm tarballs of both kits, the `cloudinary-devs/skills` and `create-cloudinary-next-template` repos, and the MCP npm packages (29 Sep 2026).

---

## 1. Which starter kit? → **Next.js** (`create-cloudinary-next`)

| | React AI Starter Kit | **Next.js AI Starter Kit** |
|---|---|---|
| Command | `npx create-cloudinary-react` | `npx create-cloudinary-next` |
| Version | **1.0.0** (GA 21 May 2026) | **1.0.0-beta.4** (29 Jul 2026) |
| Stack scaffolded | React 19 + **Vite 6** + TS 5.9; `@cloudinary/react` ^1.14.3, `@cloudinary/url-gen` ^1.22.0 | **Next 16.2.7** (App Router) + React 19.2.4 + **`next-cloudinary` ^6.18.8** + Tailwind 4 + TS 5 (via `create-next-app --example cloudinary-devs/create-cloudinary-next-template`) |
| Files of note | `src/cloudinary/config.ts`, `src/cloudinary/UploadWidget.tsx`, `src/App.tsx` (AdvancedImage + fill/autoGravity + f_auto/q_auto), **`.cursorrules`** (long React-SDK rules incl. "golden rule" import table), `.env` / `.env.example`, `.cursor/mcp.json` | `app/page.tsx` (`CldUploadWidget` + `CldImage`), `.env.local` (`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, optional `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`, commented `NEXT_PUBLIC_CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`) |
| AI config | Cursor rules + MCP | **Skills installed into `.agents/skills/` (Cursor/Copilot/generic)**: `cloudinary-next`, `cloudinary-docs`, `cloudinary-transformations` (cloned live from `cloudinary-devs/skills`, with bundled fallbacks); **`.cursor/mcp.json`** (Cursor) with remote `cloudinary-asset-mgmt` + `cloudinary-env-config` |
| Headless | – | `npx create-cloudinary-next --headless --cloudName <c> --projectName pramaan --aiTools cursor --packageManager pnpm` |
| Why for us | – | **Server routes** for signed uploads, webhooks, AI calls, and secrets; Server Actions; `getCldOgImageUrl` for share cards; Vercel deploy |

> The kit's landing page includes "click-to-copy prompts" ("Create an image gallery with lazy loading…", "Add image overlays with text or logos"). Screenshot the first run for the README to show we started from the kit.
> Minor gotchas seen in the kit: README badge points at the React package; MCP template uses `/sse` endpoints (still valid, but switch to `/mcp`).

## 2. Skills Pack (`cloudinary-devs/skills`)

Install: `npx skills add cloudinary-devs/skills` (all) or `--skill cloudinary-docs,cloudinary-transformations` / `--skill cloudinary-next`. Global or per-project. Works with Cursor, Codex, ChatGPT, custom agents.

| Skill | Content (what it teaches the agent) | Where it helps us |
|---|---|---|
| **cloudinary-transformations** (v1.0.4) | URL anatomy; action vs qualifier rules; crop-mode decision guide; gravity; `f_auto/q_auto` placement; overlays with `fl_relative`, **side-by-side canvas extension** (`g_west,x_<base_width>`); text overlays; `b_` as qualifier; video-only params (`fl_splice`, `du_`, `so_`, `fps_`, `vc_`) and the **silent failure** warning when used on the wrong asset type; `f_auto:video` for video; named & **baseline** transformations; **AI transformation costs** (bg removal 75 tx, gen_fill 50, gen_replace 120, gen_background_replace 230, gen_restore 100, auto_enhance 100, upscale 10–100); variables & conditionals; **self-validation checklist**; `X-Cld-Error` debugging. References: advanced-features, ai-transformations, debugging, examples, named-transformations, responsive-images, transformation-costs, video-transformations | Before/after composites, stamps, reels, cost-aware AI transforms, fewer broken URLs |
| **cloudinary-next** (v1.0.0) | Classify the goal first; **non-negotiables** (never expose secret; `'use client'` for widgets/players; no `cloudinary` import in client/edge; `onSuccess` not deprecated callbacks; deletes need public ID + `resource_type` + `invalidate`); **API decision tree** (CldImage vs getCldImageUrl vs Node SDK); ready templates **`app-router-signature-route.ts`**, **`server-action-upload.ts`**, **`server-action-delete.ts`**; references for OG images, overlays, upload widget, signed uploads, video player, typescript narrowing, troubleshooting, checklist | Signed evidence uploads, OG cards, video player, server-only admin/search calls |
| **cloudinary-react** | React SDK patterns, signed uploads, TS patterns, video player, troubleshooting | (if any Vite sub-app) |
| **cloudinary-docs** | Picks relevant doc pages from the live `llms.txt` | Everything else (Analyze API, SMD, webhooks…) |

> Tip from the Skills README: skills + MCP together. Skills encode best practice (e.g. "use named transformations"), and MCP executes it (e.g. creates the named transformation in your account).

## 3. MCP servers

### 3.1 Remote servers (recommended; OAuth by default, or API-key headers)

| Server | Endpoint | Auth | Purpose |
|---|---|---|---|
| Asset Management | `https://asset-management.mcp.cloudinary.com/mcp` | OAuth or `cloudinary-url: cloudinary://key:secret@cloud` / individual headers | Upload, search, list, update, relate, archive, usage… |
| Environment Config | `https://environment-config.mcp.cloudinary.com/mcp` | OAuth or API key | **Upload presets, upload mappings, named transformations, webhooks (notification triggers), streaming profiles** |
| Structured Metadata | `https://structured-metadata.mcp.cloudinary.com/mcp` | OAuth or API key | **Metadata fields, datasources (list values), conditional rules** |
| Analysis | `https://analysis.mcp.cloudinary.com/sse` (docs) | **OAuth only** remotely | AI Vision, captioning, object detection, moderation… |
| MediaFlows | `https://mediaflows.mcp.cloudinary.com/v2/mcp` | headers `cld-cloud-name`, `cld-api-key`, `cld-secret` | Create/inspect/debug PowerFlows by prompt |

Optional headers: `cloudinary-region`, **`cloudinary-tools`** (allow-list tools to save context, e.g. `list-metadata-fields,get-metadata-field,create-metadata-field`), `cloudinary-embed-headers` (adds `_headers` with rate-limit and request IDs to each tool result).

### 3.2 Local servers (npm, stdio)
```bash
npx -y @cloudinary/asset-management mcp start
npx -y @cloudinary/environment-config mcp start
npx -y @cloudinary/structured-metadata mcp start
npx -y @cloudinary/analysis mcp start
# env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (Node 18+)
```
Cursor: add `https://asset-management.mcp.cloudinary.com/mcp` as a remote MCP server in `.cursor/mcp.json`, then authenticate.

### 3.3 Tool inventory (from the packages' READMEs)

**`@cloudinary/asset-management` 0.5.9**: assetRelations (create/delete by asset ID or public ID) · assets (rename, download link, **explicit**, **generateArchive**, downloadBackupAsset, destroyByAssetId, listImages/Videos/RawFiles, listResourcesByAssetFolder/AssetIDs/**Context**/**ModerationKindAndStatus**, restoreResourcesByAssetIDs, get/update by public ID or asset ID, listResourceTags, deleteBackupVersions, derivedDestroy) · explode (multi-page) · folders (show, create, update/move, destroy, list roots, search) · **search** (`searchAssets`, `visualSearchAssets`) · upload (`upload`, `uploadNoResourceType`, `uploadChunk`, destroy, text-to-image) · usage (`getUsage`).

**`@cloudinary/analysis` 0.4.2**: aiVisionGeneral · **aiVisionModeration** · aiVisionTagging · captioning · cldFashion · cldText · coco · googleLogoDetection · googleTagging · humanAnatomy · imageQuality · lvis · shopClassifier · unidet · watermarkDetection · tasks.getStatus.

> These packages are **Speakeasy-generated TypeScript SDKs as well as MCP servers**, so the same typed functions can be called from our Next.js server code (e.g. `analyzeAiVisionGeneral`). Using Cloudinary's *newest* SDK surface is a small but real "deep integration" signal.

### 3.4 How we'll use MCP (two layers; show both to judges)
1. **Dev-time (IDE agent)**: create the SMD schema, upload presets (with `eval`/`on_success`, add-ons, notification URL), named transformations (`t_evidence_thumb`, `t_public_safe`, `t_social_1x1` …), webhook triggers, and a MediaFlows PowerFlow, **all by prompt**. Log every prompt (the form asks).
2. **Runtime (in-app agent, "Evidence Copilot")**: Gemini with tools that wrap the Cloudinary SDK / Analysis SDK (search, get asset, analyze, relate, build composite URL, create PDF pack). This follows Cloudinary's "AI agents" direction (DAM Search/Taxonomy/Workflow agents are Enterprise-only; we give NGOs the same pattern on the free tier). See `04_solution/05_ai_pipeline_design.md`.

## 4. AI Power Start prompt (docs: `ai_powerstart`, canonical file `documentation/prompts/cloudinary-get-started-prompt.md`)

Paste into any AI IDE (Cursor, Antigravity, Copilot). It runs **five gated stages** and pauses for approval at each:

| Stage | What happens |
|---|---|
| 1 · AI tooling | Installs MCP servers (`@cloudinary/asset-management`, `@cloudinary/environment-config`) + skills |
| 2 · Framework detection | Detects stack (Next.js here) and how media is delivered |
| 3 · SDK & environment | Installs the right SDK; writes `.env.example`, `.env`, `.gitignore`; frontend gets cloud name only |
| 4 · Credentials | D1 account check (or **Claimable Cloud** via `npx @cloudinary/cloud`, no signup, 24-h claim window, delivery IP-restricted until claimed); D2 fill `.env` safely (`set -a && . .env && set +a`) |
| 5 · Verification | Creates an upload preset, uploads, transforms, **fetch-verifies every URL returns HTTP 200**, writes `docs/cloudinary-environment.json` and **`docs/cloudinary-getting-started-preview.html`** (before/after optimization with real byte savings) |

After setup it suggests next prompts ("Social sizes for every channel", "A consistent product catalog", "Let your users upload", "Fast galleries, automatically", "Transform and deliver video"), recommends the **VS Code extension**, and optionally renames an auto-generated cloud.

> **Commit `docs/cloudinary-environment.json` and the preview HTML** (they contain no secrets). They are visible proof in the repo that we ran Power Start. Mention the measured byte savings in the README.

## 5. Other AI-facing resources
- **llms.txt** (`/documentation/llms.txt`) + per-product indexes (`llms-image-and-video-apis.txt`, `llms-cloudinary-assets.txt`, `llms-mediaflows.txt`, `llms-troubleshooting.txt`); every doc page available as `.md`.
- **`cloudinary_transformation_rules.md`**: rules-based markdown to generate hallucination-free transformation URLs.
- **Context7** MCP: append "use context7" to prompts for up-to-date examples.
- **VS Code / Cursor extension** (GA Jul 2026; OpenVSX): browse/search/upload Media Library, copy URLs/public IDs in the IDE.
- **Cursor plugin**, ChatGPT/Codex plugins (Asset Management MCP).
- **Base44** no-code integration; **n8n** Cloudinary node.
- **Cloudinary CLI** `cld` (pipx/uv/Docker), `cld login`, `cld agent signup`.
- **Agents: start here** (`agents_start_here`): provisioning, credential safety, tool loading.

## 6. Recommended setup sequence (commands in `05_execution/02_repo_setup.md`)
1. `npx create-cloudinary-next` → choose **Cursor** (and Copilot if used) → writes skills + MCP configs.
2. `npx skills add cloudinary-devs/skills` (ensure all four, incl. `cloudinary-docs`).
3. Paste the **AI Power Start** prompt → complete 5 stages → commit `docs/` artifacts.
4. Add the **Structured Metadata** and **MediaFlows** MCP servers (and local Analysis server) to `.mcp.json`.
5. Start a `PROMPTS.md` log immediately.
