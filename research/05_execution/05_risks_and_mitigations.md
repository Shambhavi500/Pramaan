# 05 · Risks & Mitigations

| # | Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| 1 | **Missing the 30 Sep HackCulture deadline** | Med | Fatal | Ship the vertical slice by 21:00 on 30 Sep; submit even if rough; iterate after | All |
| 2 | **Credits exhausted during judging** (Free: 25/month) | Med | High | Budget (`02_cloudinary/06`), cost panel, no video AI-crop/ABR, ≤10 GenAI transforms, eager pre-generation, freeze corpus by 9 Oct; ask DevRel for a boost | B |
| 3 | **Add-on quotas too small** (AI Vision/Content Analysis/OCR) | Med | High | Check quotas on day 0; one AI Vision call per image with a combined JSON schema; 1024-px inputs; cache results; fallback to Gemini vision on the same Cloudinary URL | C |
| 4 | Beta features not granted (C2PA, Duplicate Detection) | High | Low | Designed as pluggable; our pHash index + ledger + verify page stand alone | B |
| 5 | Search Tier 2 / Visual Search unavailable | Certain | Med | SMD mirrors (capture_date, lat/lng e6) + PostGIS + pgvector hybrid | C |
| 6 | `eval`/`on_success` script edge cases (tag/context formats, EXIF key names) | Med | Med | Log real `resource_info` payloads first; keep scripts minimal; duplicate logic in webhook job | B |
| 7 | Free plan limits: 10 MB images, 40 MB video transformation size | Med | Med | Client-side downscale (after hashing), cap clip length/resolution, validate in widget (`maxImageFileSize`, `maxVideoFileSize`) | A |
| 8 | Webhook delivery/ordering issues | Med | Med | Idempotency keys; reconcile job (Search API for assets without DB rows) | B |
| 9 | AI misclassification in Indian rural contexts | Med | Med | Org taxonomy with descriptions; claim context; reviewer overrides; local seed calibration; honest eval | C |
| 10 | LLM report hallucinations | Low-Med | High | Structured output + citation validation; only verified evidence; limitations section; human review before publish | C |
| 11 | Vercel function timeouts on long jobs | Med | Med | Inngest durable steps; async Cloudinary ops (`async`, `eager_async`, notifications) | B |
| 12 | Supabase free project pauses (7 days idle) | Low | High | Cron ping; check 10 Oct | D |
| 13 | Live demo network failure at venue | Med | High | Hotspot; pre-warmed CDN URLs; backup video; offline screenshots | D |
| 14 | Privacy slip in seed/demo data | Low | High | Team-captured/consenting subjects only; redaction policy on; review seed set | D |
| 15 | Scope creep ("platformmaxxing") | High | Med | Scope-cut ladder (`01_build_plan.md` §4); every feature must map to a PS goal | All |
| 16 | Another team builds a similar organizer | High | Med | Differentiators: trust + lineage + generative firewall + evidence-cited stories + field-first; lead the pitch with them | D |
| 17 | Starter kit beta quirks (Next kit 1.0.0-beta.4) | Low | Low | Pin versions from the kit; note issues in the form feedback | A |
| 18 | API key leakage via `.mcp.json` | Med | High | `.mcp.example.json` in git; real file ignored; rotate keys if leaked | B |
| 19 | Time-zone/date confusion in EXIF | Med | Low | EXIF has no TZ; store raw + assume the device TZ from app; show both | C |
| 20 | Judges question the "AI-generated detection" claims | Med | Med | Present as signals with measured precision; cite Moderation/C2PA as the upgrade path | C/D |
