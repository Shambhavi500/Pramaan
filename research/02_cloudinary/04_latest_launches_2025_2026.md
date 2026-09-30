# 04 · Latest Launches & Innovations (May 2025 → Sep 2026)

> Compiled from Cloudinary's official release-note RSS feeds (Image & Video, Assets/DAM, MediaFlows) and the full August 2026 release notes. **Relevance** = how useful it is for PS-02 (★★★ = core to our design).
> Judges notice when a team uses what their company shipped last month. The newest items are flagged 🆕.

---

## 1. Timeline

### Image & Video APIs

| Release | Headline items | Relevance |
|---|---|---|
| **31 Aug 2026** 🆕 | **Image Generation: reference images** (`image_to_image`, refs by URL or `asset_id`, positional `[1]`,`[2]` in prompt; families Nano Banana / Flux / GPT Image; `model.mode: auto` with preferences) · **Image to Video add-on on all accounts** (+ free trial credits) · **AI Video Analysis API (Beta)**: timestamped *visual transcription* · **Video Canvas (Beta)**: node editor → applets as named transformations · Upload Widget sources **Box / OneDrive / SharePoint** · `resource_info.source_url` in `eval` (remote-upload provenance) · SMD `hidden_ui` + `excluded_from_search` · People Search API (Enterprise) · API key creation with roles + "AI agent" key type · CLI via pipx/uv/Docker, `cld login` OAuth, **`cld agent signup`** · **Claimable Cloud** (`npx @cloudinary/cloud`) · **Next.js Starter Kit** · **AI Power Start page** · searchable fonts list · `g_track_person` deprecated (29 Aug) | ★★★ AI Video Analysis, source_url provenance, Next.js kit, Power Start · ★★ Image-to-Video (story layer only), Video Canvas, Box/OneDrive/SharePoint ingest |
| **9 Jul 2026** | **Image Generation add-on** (text→image) · **Cloudinary Skill for Next.js** · **VS Code Extension GA** · **Console Studio** for image transformations · custom fonts for video subtitles · **account-creation API for AI agents** | ★★★ Next.js skill · ★★ Studio (prototype transformations visually) |
| **28 May 2026** | Background-removal model **3.5× faster** · **Google Fonts in text overlays** · **Video Player v4** (lightweight lazy-loading bundle) · import `.vtt`/`.srt` subtitles · private Azure Blob upload · Python & JS SDKs for Permissions/Provisioning APIs | ★★ Google Fonts (Devanagari fonts for Hindi overlays; verify availability), Player v4 |
| **7 Apr 2026** | **Cloudinary Skills pack** · official Next.js SDK support · optional `api_key` in Media Library widget · Video Player Studio resize/crop · **HDR delivery** · Video Config API · responsive breakpoints · Basic Auth for uploads · **MCP Streamable HTTP** (`/mcp`) · **Cloudinary Moderation GA** | ★★★ Skills, MCP `/mcp`, Moderation |
| **28 Feb 2026** | Video Player Studio (opt-in) · Player Profiles API · **structured JSON output for AI Vision** (Analyze API) · **React Starter Kit** · closed captions for live streaming · **webhooks for related assets** | ★★★ AI Vision JSON schema, related-asset webhooks |
| **30 Jan 2026** | Improved PDF optimization · **Media Inspector GA** · enhanced Video Player Studio · revamped Image Studio · **Cloudinary Moderation** introduced | ★★ PDF optimization for evidence packs |
| **18 Dec 2025** | **`e_auto_enhance`** · React Native advanced video controls · Media Inspector enhancements · VS Code extension on OpenVSX (Cursor etc.) | ★ |
| **31 Oct 2025** | **VS Code Extension** · 3D in Product Gallery · Upload Widget meets **WCAG 2.1 AA** · Video Player features | ★ |
| **3 Sep 2025** | **Auto-generate AI video titles, descriptions, transcripts, chapters** · download buttons in player · **remote MCP servers with OAuth** · Media Library enhancements · new docs/demo apps | ★★★ auto_video_details, auto_chaptering |
| **9 Jul 2025** | **Cloudinary MCP servers** launch · super-light Video Player major version · **Add-on Marketplace** · Console dark theme · API key enhancements · **LLM-friendly docs** (llms.txt, markdown pages) | ★★★ MCP |
| **27 May 2025** | "Programmable Media" renamed **Cloudinary Image & Video** | – |

### Assets (DAM)

| Release | Headline items | Relevance |
|---|---|---|
| **24 Aug 2026** 🆕 | CI HUB connector · **People Search** (facial-recognition clustering) · **Chrome Extension (Beta)** · **Roles & Permissions** on free & self-serve · third-party Upload Widget sources · SMD **Hide field / Exclude from search** · alphabetical SMD values · Figma plugin export options | ★★ R&P (field worker vs reviewer roles in Media Library) |
| **30 Jun 2026** | New **Studio on all plans** · updated backups UI · Figma export template · DAM Apps · SMD restrictions · account restore within 30 days | ★ |
| **5 May 2026** | **AI Agents suite**: Taxonomy, Search, Workflow, Moderation, Concierge · CSV bulk tags · **Moderation GA** · employee access controls · Azure backup · **Visual Search upload** · Version History improvements · **Creative Approval API** · refreshed Advanced Search | ★★ (Enterprise) The *pattern* inspires our runtime "Evidence Copilot" |
| **28 Jan 2026** | **Assets Reports** (analytics) · **SMD regex validation** · multi-folder sharing · celebrity tag detection · previews of new search, Studio, Moderation | ★★ regex validation (e.g. site codes) |
| **11 Nov 2025** | **MediaFlows automations inside Media Library** · free-text search in shared collections | ★★ |
| **16 Sep 2025** | Configurable Upload Widget sources · **direct management of derived assets** · improved Focus Area Refiner | ★★ derived-asset listing = lineage UI |
| **7 Jul 2025** | Moderation enhancements · video usage by resolution · **Base44 integration** | ★ |

### MediaFlows

| Release | Headline items | Relevance |
|---|---|---|
| **31 Aug 2026** 🆕 | **Image to Video block** · **Generate Image From Text / From A Reference** blocks (Nano Banana, Flux, GPT Image) · **AI-recommended blocks** · unified **Condition block** (guided + JsonLogic) · SMD on exported transcripts · drafts · error variables on error paths | ★★ |
| **24 Jul 2026** | Redesigned block picker · Stibo STEP PIM block · **JsonLogic trigger filtering** · refined Notification block · **WebVTT export for transcriptions** · guided scheduling | ★★ VTT export → `l_subtitles` |
| **30 Jun 2026** | **Flow notifications** (success/failure → in-app, webhooks, **Slack, Teams**) · **Gemini model options** for "Gemini Analyze Image By Prompt" and "Gemini Generate Image And Cloudinary Upload" | ★★★ reviewer alerts |
| **31 May 2026** | Featured templates · Notification block supports user groups · Universal API response filter · **"Surfer" AI agent renamed Workflow Agent** · Send Teams Message GA | ★★ |
| **30 Apr 2026** | **Apps & Connections hub** · Notification block · Notifications page · Search Media / On Scheduled Search **with SMD** | ★★ |
| **31 Mar 2026** | Fal AI Virtual Photoshoot/Try-On · **Send Slack/Teams, Send To Airtable, Upload To FTP/SFTP** blocks · Get Asset Information with **media metadata + related assets** | ★★ |
| **27 Feb 2026** | MediaFlows Usage Report (touchpoints) · On Proof Status Change trigger | ★ |
| **31 Jan 2026** | **Export Metadata to CSV** · **Generate Alt Text** block · error paths · favorites | ★★ CSV export = auditor handoff |
| **30 Dec 2025** | **Gemini image analysis block** · cross-flow triggering · **transcription export + auto-generated metadata** | ★★ |
| **28 Nov 2025** | **Cloudinary Upload Preset trigger** · Update XMP Metadata · **Video Chaptering** & **Video Transcription** blocks · parallel Iterate | ★★ preset trigger = per-channel flows |
| **31 Oct 2025** | **Surfer AI Agent** (conversational workflow mgmt) · OpenAI/Gemini image-generation blocks · run flows from Assets | ★ |

## 2. Ecosystem and tooling milestones

| Date | Item |
|---|---|
| 26 Jan 2026 → 21 May 2026 | `create-cloudinary-react` beta.1 → **1.0.0** (React + Vite + TS, `.cursorrules`, MCP config, UploadWidget) |
| 30 Jun 2026 → 29 Jul 2026 | `create-cloudinary-next` **1.0.0-beta.4** (Next 16.2.7, React 19.2.4, next-cloudinary ^6.18.8, Tailwind 4; installs skills into `.agents/skills`; writes `.cursor/mcp.json`) |
| 12 Jul 2026 | MCP packages: `@cloudinary/asset-management` 0.5.9, `@cloudinary/analysis` 0.4.2, `@cloudinary/structured-metadata` 0.2.1, `@cloudinary/environment-config` 0.4.1 (also usable as typed TS SDKs) |
| 4 May 2026 | Jen Looper's "How to Win a Hackathon" (dev.to/cloudinary) |
| 2026 | Cursor marketplace plugin, ChatGPT/Codex plugins, Base44 integration, n8n node |

## 3. The five launches worth featuring in our build

1. **AI Vision structured JSON output** (Feb 2026): the backbone of per-image evidence understanding.
2. **AI Video Analysis** (Aug 2026) + **auto_video_details / auto_chaptering / auto_transcription** (Sep 2025): full video evidence understanding (speech + visuals).
3. **Next.js Starter Kit + Skills Pack + AI Power Start + MCP** (Apr–Aug 2026): the hackathon's own requirement; show both dev-time and runtime use.
4. **`resource_info.source_url` in `eval`** (Aug 2026): capture remote-upload provenance **inside Cloudinary**, a small feature that fits our traceability story well.
5. **Related-asset webhooks** (Feb 2026) + **derived-asset management** (Sep 2025): lineage graph maintenance.

Honorable mentions for the Story layer (clearly labeled): **Image-to-Video** start/end frames (before→after "living" transition; *AI-generated, never evidence*), **Image Generation with references** (e.g. illustrative campaign art), **Video Canvas** (author the reel template as an applet).

## 4. Deprecations / gotchas to avoid
- `g_track_person` (dynamic video overlays) **stopped working 29 Aug 2026**. Don't use it; use fixed gravity or Player interaction areas.
- MCP: use `/mcp` (Streamable HTTP) endpoints for new configs; `/sse` still aliases. The Next.js kit template still writes `/sse` URLs (works, but update to `/mcp`).
- Analysis MCP **remote** server supports **OAuth only** (no API-key headers); the local `npx @cloudinary/analysis mcp start` works with env credentials.
- Asia-Pacific data center: no auto transcription / auto chaptering, so choose the default region.
- Free accounts block **PDF/ZIP delivery** until enabled in Settings → Security.
