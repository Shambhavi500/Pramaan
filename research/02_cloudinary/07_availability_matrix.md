# 07 · Availability Matrix: What We Can Actually Use (and the Fallback for Each)

> Many of Cloudinary's most relevant features are Beta, on-request, or Enterprise. Designing around something you can't enable is a common hackathon failure. This matrix says, for every capability in our design, **whether we can use it on Free**, **how to unlock it**, and **the fallback if we can't**.

Legend: ✅ Free, self-serve · 🟡 add-on free tier (quota) · 🔶 Beta, self-serve · 📨 Beta/feature **on request** (support ticket) · 🔒 paid/Enterprise

| Capability | Status | Unlock path | In our design | Fallback if unavailable |
|---|---|---|---|---|
| Upload API / Widget / presets / signed uploads | ✅ | – | Core | – |
| `eval` / `on_success` upload scripts | ✅ | – | Intake gate | Do the same logic in our webhook handler |
| `media_metadata`, `phash`, `colors`, `faces`, `quality_analysis` | ✅ | – | Provenance & trust signals | – |
| Backups & versions | ✅ | Enable auto-backup in Settings | Evidence immutability | – |
| Structured metadata + conditional rules | ✅ | – | Evidence schema | – |
| Related assets (+ webhooks) | ✅ | – | Pairs, lineage | Store relations in DB only |
| Search API Tier 1 | ✅ | – | Faceted search | – |
| **Search API Tier 2** (`location`, `taken_at`, `image_metadata`, `colors`, `face_count`, aggregations) | 🔒 Advanced+ on request | Paid plan + request | Would enable native geo/EXIF search | **Copy GPS/date/etc. into SMD at ingest** (`lat_e6`, `lng_e6`, `capture_date`, `green_pct`…) + PostGIS for true geo queries |
| **Visual Search** (image/text) | 🔒 Enterprise | Sales | Semantic discovery | **Voyage multimodal embeddings + pgvector** over (image + AI caption) |
| DAM AI Agents (Taxonomy/Search/Workflow) | 🔒 Assets Enterprise, beta | CSM | – | Our in-app **Evidence Copilot** (Gemini + Cloudinary tools) |
| People Search | 🔒 Assets Enterprise | – | Not used (ethics) | – |
| AI Vision (tagging/general/moderation, JSON output) | 🟡 | Console → Add-ons → Free tier | Core perception | Gemini vision over the same Cloudinary-delivered 1024-px URL (keeps Cloudinary as the image pipeline) |
| Content Analysis (captioning, LVIS/COCO, IQA, watermark, cld_text) | 🟡 | Add-on free tier | Captions, objects, watermark | AI Vision schema covers captions/counts |
| OCR (`adv_ocr`, `g_ocr_text` redaction) | 🟡 | Add-on free tier | Signboards, text redaction | AI Vision `visible_text`; manual region blur (`e_blur_region` with x,y,w,h) |
| Google auto-tagging / logo detection | 🟡 | Add-on free tier | Generic labels, sponsor logos | AI Vision |
| Google Translation (transcript translation) | 🟡 | Add-on free tier | Hindi → English captions | Gemini translation of `.transcript` text → our own VTT |
| Auto transcription / auto chaptering | ✅ (not AP region) | – | Video evidence | – |
| Auto video details (AI title/desc/tags) | ✅ (1 tx/s) | – | Video cataloging | Gemini summary of transcript |
| **AI Video Analysis** (visual transcript) | 🔶 | Self-serve API (20 tx/s) | Visual understanding of video | Keyframes (`so_t`) → AI Vision |
| **Duplicate Image Detection** add-on | 📨 Beta | Support ticket | Native near-dup | **pHash Hamming index in Postgres** (works on Free) |
| **Content Provenance / C2PA** (`fl_c2pa`) | 📨 Beta | Support ticket ("available only to customers who request it") | Signed Content Credentials on published images | Our own hash-chained ledger + public verify page + QR (works everywhere); mark C2PA as "enabled when granted" |
| **Cloudinary Moderation** | ✅ 500 actions; 🔒 AI-generated & web-sourced detection, ongoing moderation | Console; advanced plan via sales/demo | Authenticity rules | AI Vision `synthetic_suspected` + watermark detection + XMP `DigitalSourceType` + recapture cues (signals, not verdicts) |
| Generative transformations (`b_gen_fill`, `e_gen_*`) | ✅ (high tx cost) | – | Story layer only, labeled | Plain `c_pad,b_auto` |
| Image Generation API | 🟡 (auto free plan) | Console first use | Optional illustrations for campaigns (labeled) + **synthetic test set for the fraud demo** | Skip |
| Image to Video | 🔶 16 trial credits on Free | Add-on Marketplace | Optional "living photo" hero (labeled) | Cross-fade transition reel via `fl_splice:transition` (deterministic, not generative) |
| Video Canvas | 🔶 | Console | Optional: author the reel template visually | Hand-written transformation (Skills Pack) |
| MediaFlows (EasyFlows/PowerFlows) + MediaFlows MCP | ✅ (touchpoint quota) | Console | Reviewer notifications, alt text, transcript export | Our own webhook handlers |
| MCP servers (Asset Mgmt, Env Config, SMD) | ✅ | OAuth or API key | Dev-time setup + prompt log | Admin API scripts |
| Analysis MCP (remote) | ✅ OAuth only | OAuth | Dev-time exploration | Local `npx @cloudinary/analysis mcp start` with env creds |
| Strict transformations | ✅ | Settings → Security | Production hardening | – |
| Token/cookie delivery auth | 🔒 Advanced+ | – | – | Signed URLs (`s--sig--`) on `authenticated` assets |
| PDF/ZIP delivery | ✅ after enabling in Security settings | Toggle | Evidence packs | – |

## Support tickets to file on Day 0 (support.cloudinary.com/hc/en-us/requests/new)

1. **"Hackathon (Code Cubicle 6.0 × Cloudinary Challenge): request beta access to Content Provenance & Authenticity (C2PA / `fl_c2pa`) for cloud `<cloud_name>`."** Explain the use case: verifiable NGO impact evidence.
2. **"Request beta access to Duplicate Image Detection add-on"**: use case: detecting recycled field photos across projects.
3. Ask via the **Cloudinary Creators Discord** and DevRel whether hackathon teams can get a temporary **credit / add-on quota boost** or a Moderation advanced trial.

> Even if these arrive after the deadline, the architecture treats them as **pluggable signal providers**. Show the adapters in code and say "enabled when granted". Judges reward teams that understand the platform's roadmap.
