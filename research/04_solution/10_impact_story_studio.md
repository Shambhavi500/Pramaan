# 10 · Impact Story Studio (PS goal R4 + "measurable impact")

> *"Generate visual reports, summaries, and campaign-ready content from collected evidence."*
> Story Studio turns **verified** evidence into audience-specific outputs. Gemini writes; Cloudinary renders; the ledger records. Every output carries a Verify QR.

---

## 1. Templates (audience-first)

| Template | Audience | Sections | Outputs |
|---|---|---|---|
| **CSR Partner Quarterly** | CSR manager / board | Summary · Outputs vs targets (with evidence coverage) · Before/after highlights · Beneficiary voices (transcript quotes, consented) · Risks & limitations · Evidence index | Web report, **PDF evidence pack**, 4-image LinkedIn carousel |
| **Impact Assessment Pack (Rule 8(3)-ready)** | Independent assessor | Project profile · Sampling frame · Per-site evidence tables (time, GPS, trust, reviewer) · Pairs & metrics with methods · Integrity appendix (hashes, ledger head) | PDF pack + **ZIP of originals** (signed `download_zip_url`) + CSV (MediaFlows "Export Metadata to CSV" or our API) |
| **Government Stage Report** | Block/district officer | Per asset: before / during / after with timestamps and geofence status; stage claims; flags | PDF (1 page per asset) |
| **Social Campaign Kit** | Public / donors | Hook stat · 1 hero before/after · 3 supporting visuals · CTA | 1:1, 4:5, 9:16, 16:9 images; 20-s reel; captions EN + HI; alt text |
| **Public Story Page** | Anyone | Scrollytelling: numbers → sliders → reel → map → "How we verified this" | `/s/<storyId>` with OG image |

## 2. Evidence selection (before generation)
- Eligible: `trust_status = verified` **and** consent-compatible with the target output (public vs internal).
- Score for inclusion: `0.35·relevance_to_template + 0.25·quality + 0.2·diversity (site/activity/time coverage) + 0.2·pair_bonus`.
- Diversity via greedy MMR over embeddings (avoid 10 near-identical plantation shots).
- User can pin/unpin; the bundle is frozen with its hash into the ledger at generation time.

## 3. Generation (Gemini, structured output)
- Input bundle: evidence items (id, caption/scene_summary, activity, counts, site, date, trust, pair metrics with methods), indicators (target/claimed/evidence-backed), transcript excerpts (consented), org voice/brand notes, template spec.
- Output: `Report` schema (`05_ai_pipeline_design.md` §4.2): sections with **per-paragraph `evidence_ids`**, key metrics with `method`, captions EN + HI + alt, social copy, limitations.
- Post-validate citations → **citation coverage %** shown in the Studio ("97% of factual sentences cite verified evidence").
- Tone guardrails: dignity-first language, no "poverty porn", no identity inference, no invented quotes.

## 4. Rendering with Cloudinary

### 4.1 Evidence cards (building block for PDF & slides)
For each selected evidence item, build a **card derivative** URL (edited class):
```
t_public_safe (if consent requires) → c_pad,b_white,w_1240,h_1754 (A4 @150dpi)
→ image area c_fit,w_1140,h_1100,g_north,y_60
→ text block: caption (EN), "GA-17 · 12 Mar 2025 · 23.83°N 74.53°E · Trust 91 · Verified"
→ QR (l_pramaan:qr:<dv>) bottom-right · org logo bottom-left · page footer "Pramaan evidence card ev_…"
```
**Materialize** each card as its own asset (upload from the derived URL) with `public_id: pramaan/<org>/stories/<storyId>/card_<nn>`, tag `pack_<storyId>`, context `derived_from=<asset_id>@v<version>|transformation=<string>`, SMD `evidence_class=derived_edited` (or `derived_redacted`).

### 4.2 PDF evidence pack
```ts
await cloudinary.uploader.multi(`pack_${storyId}`, { format: "pdf", async: true, notification_url: WEBHOOK_URL });
// deliver: https://res.cloudinary.com/<cloud>/image/multi/pack_<storyId>.pdf
```
- Pages are ordered **alphabetically by public ID**, hence `card_01`, `card_02`, ….
- Prepend a **cover page** and an **integrity appendix page** (rendered as images: title/summary text, ledger head hash, QR to the story verify page) using text layers on a blank canvas asset (or the Upload API `text` method for simple text images).
- Free-plan prerequisite: **enable PDF delivery** in Security settings.
- Narrative web report remains the primary; the PDF pack is the portable, auditor-friendly artifact. (Optional: a full typeset PDF via `@react-pdf/renderer` embedding Cloudinary card images.)

### 4.3 Social kit
From each hero evidence item (or pair composite):
| Format | Base | Additions |
|---|---|---|
| 1:1 (1080²) | `t_card_1x1` (`c_fill,g_auto`) | headline stat text layer, logo, QR |
| 4:5 (1080×1350) | `t_card_4x5` | + caption band |
| 9:16 (1080×1920) | `t_card_9x16`; if the subject gets cut, use **`bl_genfill_9x16` (b_gen_fill, AI-assisted label)** | top/bottom text bands |
| 16:9 (1920×1080) | `t_card_16x9` | LinkedIn/Twitter |
Headline numbers come only from `key_metrics` with methods. Hindi overlays: pick a Devanagari-capable font (Google Fonts support in text overlays since May 2026; verify the font name, e.g. Noto Sans Devanagari).

### 4.4 Reel (20 s)
1. Pre-render slides (materialized card-like images at 1080×1920 with text): title slide (Upload API `text` or text layer on a brand background) → 3–5 evidence slides → before/after pair (two slides) → closing stat + QR slide.
2. Splice over the blank base with transitions:
   `du_1/…/fl_splice:transition_(name_fade;du_1),l_<slide1>/du_4/fl_layer_apply/…/f_mp4/q_auto/vc_auto`
3. Subtitles: generate a `.vtt` from the report captions (or transcript quotes), upload as raw → `l_subtitles:arial_40:pramaan:reels:<storyId>.vtt/fl_layer_apply`.
4. Optional music bed: `l_audio:pramaan:music:<track>/fl_layer_apply` (royalty-free, credited).
5. Cost: SD progressive ≈ 2 tx/s → 40 tx per reel.
6. Optional polish (P2): author the reel template in **Video Canvas** (Aug 2026) as an applet backed by a named transformation.

### 4.5 Public story page
- Next.js route `/s/[storyId]`, statically generated after publish.
- `generateMetadata` → `getCldOgImageUrl({ src: heroCompositePublicId, overlays: [...headline...] })`.
- Components: KPI band, before/after sliders, `CldVideoPlayer` (reel + chapters), MapLibre site map (coarsened), "How we verified this" (trust method + ledger head + link to verify pages), PDF download.

## 5. Measurable impact: the indicator & coverage model

| Metric | Definition | Why judges/CSR care |
|---|---|---|
| **Evidence-backed output** | Σ quantities linked to **verified** evidence for an indicator (AI estimate reviewed, or field entry corroborated by evidence) | Turns photos into numbers |
| **Evidence coverage %** | evidence-backed ÷ claimed (e.g. 8,412 / 10,000 saplings = 84%) | Single honest KPI for "how much of what we claim can we prove?" |
| **Site coverage %** | sites with ≥ 1 verified evidence in period ÷ active sites | Monitoring completeness |
| **Pair coverage %** | sites with an approved before/after pair ÷ sites requiring one | Change demonstrated |
| **Change metrics** | ExG Δ, construction stage progression, water presence (per pair, with method) | Environmental/project change |
| **Integrity rate** | flagged ÷ submitted; reviewer override rate | Fraud/quality signal; calibration |
| **Time-to-report** | generation → publish | Operational efficiency |

Dashboard shows these per project and rolled up for funders (the CSR portfolio view).

## 6. Accessibility & language
- Alt text from AI (`alt` in context) for every image in reports/pages.
- Captions EN + HI for reels; transcripts for videos (Cloudinary transcription + translation).
- WCAG-AA contrast in overlays (text bands with `b_rgb:000000AA`).
- Numbers formatted in Indian system (lakh/crore) for Indian audiences, international elsewhere.

## 7. Publish & provenance
Publishing a story:
1. Freezes the report JSON + evidence bundle hash → ledger `published`.
2. Creates `derivative` rows for every URL used (class-tagged) with QR short IDs.
3. Optionally adds `fl_c2pa` to public image URLs (when enabled).
4. Makes `/s/<storyId>` and `/verify/<dv>` pages live.
5. Withdrawal (e.g. consent withdrawn) → story status `withdrawn`, derived assets invalidated (`invalidate: true`), ledger `withdrawn`.
