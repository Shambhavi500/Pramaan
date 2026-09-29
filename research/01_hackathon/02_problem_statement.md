# 02 · Problem Statement: Verbatim + Requirement Decomposition

> Source: `problem_explanation_3xx3jsbq9p1.pdf` (HackCulture asset, single image page, "02 / 03"). Transcribed verbatim from the rendered image below.

---

## 1. Verbatim text

> **PROBLEM STATEMENT 02 · CLOUDINARY**
> # AI-Powered Impact & Sustainability Media Platform
>
> NGOs, governments, and sustainability organizations generate large volumes of photos and videos from field projects, environmental initiatives, infrastructure work, and community programs. Manually organizing, analyzing, verifying, and turning this media into meaningful evidence and reports is time-consuming and difficult to scale.
>
> The challenge is to build an AI-powered media intelligence platform using Cloudinary that can understand field media, organize evidence by project, location, and timeline, and help teams turn visual data into reliable insights and impact stories.
>
> **GOAL** · Build a complete platform that can:
> - Analyze and intelligently organize large collections of image and video evidence.
> - Identify relevant projects, activities, locations, and visual signals from media.
> - Compare before-and-after media to demonstrate visible project or environmental changes.
> - Generate visual reports, summaries, and campaign-ready content from collected evidence.
> - Make media searchable through AI-powered metadata, tagging, and semantic discovery.
> - Preserve traceability to the original source assets and transformations.
>
> **EXPECTED OUTCOME** · A scalable media intelligence product that transforms raw field media into searchable evidence, measurable impact, and compelling visual stories.
>
> *3 OCT ONLINE · 11 OCT OFFLINE* · *02 / 03*

HackCulture's short version: *"build an AI-powered media intelligence platform using Cloudinary that can understand field media, organize evidence by project, location, and timeline, and help teams turn visual data into reliable insights and impact stories."* Tagline: **"AI-Powered Intelligence for the Real World."**

---

## 2. Close reading: what the wording tells us

### 2.1 Word-frequency signals

| Word/phrase | Count | What it implies |
|---|---|---|
| **evidence** | 4 ("meaningful evidence", "organize evidence", "video evidence", "searchable evidence") | The core object is **evidence**, not "content" or "photos". Evidence has to be attributable, verifiable, and traceable. |
| **verifying** / **reliable** / **traceability** | 1 each | This is a **trust** problem, not just an organization problem. Most teams will skip it. |
| **organize** / **searchable** / **semantic discovery** | 3 | Findability by project, location, time, and meaning |
| **before-and-after** / **visible changes** / **measurable impact** | 3 | Change has to be *demonstrated* and *quantified* |
| **reports** / **summaries** / **campaign-ready** / **stories** | 4 | Output side: turn evidence into communication artifacts |
| **scalable** / **large volumes** / **difficult to scale** | 3 | Architecture must handle thousands of assets and many orgs; manual review is the bottleneck |
| **NGOs, governments, sustainability organizations** | 1 | Multi-stakeholder: field staff, M&E officers, comms teams, donors/CSR, auditors, public |

### 2.2 The sentence that matters most

> *"Manually organizing, analyzing, **verifying**, and turning this media into meaningful evidence and reports is time-consuming and difficult to scale."*

This lists four pains in pipeline order (**organize → analyze → verify → report**), and the six goals map onto that same pipeline plus **compare** and **trace**. Our solution should be structured as that pipeline and presented that way to judges.

### 2.3 "Evidence" vs "content"

A marketing DAM treats a photo as content: the aim is to make it look good and ship it. The PS treats a photo as **evidence**, which puts it under obligations:

1. **Provenance**: who captured it, when, where, and with what device and app.
2. **Integrity**: the original is preserved unaltered; every derivative is declared.
3. **Context**: which project, site, activity, and indicator it supports.
4. **Comparability**: it can be put next to earlier or later evidence of the same place.
5. **Verifiability**: a third party (donor, auditor, citizen) can check the claim.
6. **Accountability for people in it**: consent, dignity, privacy.

Goal 6 (*"preserve traceability to the original source assets and transformations"*) is the PS author signalling this directly. Cloudinary's transformation model (immutable original, deterministic derived URL, versioned assets, backups) is well suited to it, and the team that makes this visible will stand out.

---

## 3. Requirements matrix

Each goal becomes a testable requirement with acceptance criteria and the **demo proof** a judge should see.

| ID | PS goal | Functional requirements | Acceptance criteria (demo-able) | Primary Cloudinary capabilities |
|---|---|---|---|---|
| **R1** | Analyze & intelligently organize large collections of image and video evidence | Bulk + field ingest; auto-analysis on upload; auto-filing by project/site/time; dedup; quality triage | Upload 50 mixed photos/videos → within minutes all are filed under the right project/site, with captions, tags, quality flags; duplicates flagged | Upload API/Widget, upload presets, `eval`/`on_success` scripts, `media_metadata`, `phash`, `quality_analysis`, AI Vision, Content Analysis captioning, structured metadata, asset folders, webhooks, MediaFlows |
| **R2** | Identify projects, activities, locations & visual signals | Activity classification against an org taxonomy; object counts; OCR of signboards; GPS extraction + geofence match; people/minor detection; video speech + visual transcripts | Each asset shows detected activity (with confidence), location on map, visual signals (e.g. "~40 saplings, drip irrigation, signboard: 'Project GA-17'") | AI Vision (tagging + general with JSON schema), OCR add-on, Google tagging, `media_metadata` (EXIF/GPS), `faces`, `auto_transcription`, AI Video Analysis, `auto_video_details`, `auto_chaptering` |
| **R3** | Compare before/after media | Auto-pair candidate before/after by site + viewpoint + time; side-by-side & slider; transition video; quantified change with an explainable method | Pick a site → system proposes a pair → shows slider + composite with date stamps + a 6-s transition reel + a "Δ green cover +31% (method: ExG index)" metric | Overlays (`l_`, `fl_layer_apply`, `g_west,x_`), text layers, `fl_splice:transition`, `relate_assets`, AI Vision on a **composite** URL, named/baseline transformations |
| **R4** | Generate visual reports, summaries, campaign-ready content | Evidence-grounded report narrative with citations; PDF evidence pack; social cards in all aspect ratios; short reels; public story page; multilingual captions | One click → donor/CSR report (web + PDF), 4 social formats, a 20-s reel with subtitles, a public story page with OG image | `multi` → PDF, `g_auto` crops, text/logo overlays, `b_gen_fill` (labeled), `fl_splice` reels, `l_subtitles`, `getCldOgImageUrl`, Video Player (chapters, transcripts), Image-to-Video (labeled) |
| **R5** | Searchable via AI metadata, tagging & semantic discovery | Faceted filters (project/site/activity/SDG/date/trust); geo search; natural-language semantic search; "find similar" | "Show check-dam photos near Jhabua before the 2025 monsoon with trust ≥ 80" → correct results, each with a "why it matched" | Search API (Tier-1 expressions over `metadata.*`, tags, folders, dates), structured metadata, AI captions → embeddings (Visual Search is Enterprise-only, so we add our own vector index) |
| **R6** | Preserve traceability to originals & transformations | Immutable originals; lineage for every derivative (base asset + version + transformation + class); tamper-evident audit log; public verify page; C2PA where available | Click any image in a campaign card/PDF (or scan its QR) → provenance chain back to the original, its hash, capture data, AI analysis, and every transformation applied, each labeled *transcoded / redacted / edited / AI-generated* | Asset IDs & versions, backups & version management, deterministic transformation URLs, derived-assets listing, `relate_assets`, webhooks, `fl_c2pa` (beta, on request) |
| **Outcome** | "Scalable… searchable evidence, **measurable impact**, compelling visual stories" | Indicator dashboard (outputs vs. verified evidence); evidence-coverage metrics; multi-org scalability; cost controls | Dashboard: "Saplings planted: 10,000 claimed / 8,412 backed by verified evidence (84% coverage)"; architecture + credit-budget slide | Structured metadata aggregations (our DB), eager async transforms, named/baseline transformations, CDN caching |

---

## 4. Implicit requirements (not written, but judges will probe them)

| Implicit requirement | Why it's implied | How we address it |
|---|---|---|
| **Low-connectivity field capture** | "Field projects", "community programs": rural India, weak networks | Offline-first PWA capture queue; chunked uploads; `q_auto`/`f_auto`/ABR for low-bandwidth viewing |
| **Context loss at capture** | Real field photos arrive via WhatsApp/Drive with EXIF stripped and names like `IMG_2034.jpg` | Capture-time metadata from the PWA (GPS, time, project, activity) written as structured metadata; fallback manual assignment with AI suggestions |
| **Fraud and recycled imagery** | "Verifying", "reliable"; India's NMMS/MGNREGA experience (photos of photos, reused images) | Evidence Trust Score: pHash reuse detection, recapture detection, GPS geofence, EXIF consistency, AI-generation signals, human review |
| **Privacy & dignity** | Community programs photograph beneficiaries, including children; DPDP Act 2023 | Face detection → consent state; public outputs auto-pixelate faces unless consent recorded; OCR-based text redaction |
| **Multilingual** | India field teams speak Hindi and other regional languages | `auto_transcription` language detection; translation to English (Google Translation add-on); bilingual captions |
| **Multi-tenant scale** | "NGOs, governments…", "scalable" | Org → project → site → asset hierarchy; per-org folders and metadata; role-based access |
| **Honest use of generative AI** | Evidence + GenAI is a credibility trap (greenwashing) | "Generative firewall": GenAI allowed only in the Story layer, auto-labeled, never in the evidence layer |
| **Cost-awareness** | Cloudinary judges warn against "platformmaxxing" | Analyze once at ingest; cache results; named/baseline transformations; credit budget in README |

---

## 5. What a *minimal* vs. a *winning* answer looks like

| Dimension | Minimal (most teams) | Winning |
|---|---|---|
| Ingest | Upload widget → gallery | Field PWA with capture-time provenance + bulk import + intake gate running inside Cloudinary (`eval`) |
| Understanding | Auto-tags list | Org-taxonomy classification with a JSON schema, object counts, OCR, video speech + visual transcripts, confidence |
| Verification | none | Explainable Trust Score + human review queue + audit log |
| Organization | Folders | Structured metadata schema, relations, map + timeline, indicator linkage |
| Search | Keyword | NL query → search plan (Cloudinary expressions + geo + vector) with "why matched" |
| Before/after | Two images side by side | Auto-pairing, slider, composite, transition reel, **quantified** change with a stated method |
| Reports | LLM summary text | Evidence-grounded report with citations to asset IDs, PDF pack, multi-format social kit, reel, public page |
| Traceability | none | Lineage graph, hash-chained ledger, derivative classification, QR "verify" links, C2PA-ready |
| GenAI | Used freely for "wow" | Used only where honest, and labeled |
| Cloudinary depth | Storage + a few transforms | ~25 capabilities, each tied to a requirement (see `04_solution/04_cloudinary_integration_blueprint.md`) |
