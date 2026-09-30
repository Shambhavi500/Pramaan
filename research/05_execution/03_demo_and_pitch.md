# 03 · Demo Script & Pitch

> Structure follows Jen Looper's published formula: **Hook (15 s) → Demo (60–90 s) → Technical (30 s)**, plus a close. Always have a **backup video**. The finals may allow longer; a 5-minute version is included.

---

## 1. The 3-minute pitch (word-for-word draft)

**[0:00–0:15] Hook** *(slide: dog photo blurred + "₹2,600 crore")*
> "When Rajasthan made geotagged photos mandatory for rural-jobs attendance, it uncovered ₹2,600 crore in fake wage claims in seven months. Then the fraud adapted: photos of photos, recycled images, even a photo of two dogs submitted as proof that nine people worked. **Photos alone aren't proof.** We're Team ___, and we built **Pramaan**: proof that holds up."

**[0:15–0:35] Problem** *(slide: WhatsApp chaos → CSR report)*
> "NGOs, CSR teams and government programs run on field photos, over ₹35,000 crore a year of CSR alone. But those photos arrive with no context, can't be verified, can't be compared over time, and lose their link to the original the moment someone edits them for a campaign. So organizations spend days rebuilding reports nobody fully trusts."

**[0:35–2:05] Live demo** *(app)*
1. *(Phone)* "Ravi captures a check dam in airplane mode. It queues offline, syncs, and **Cloudinary** runs our intake rules *inside the upload*: EXIF, GPS, a perceptual hash, quality."
2. *(Card appears)* "Cloudinary's AI Vision reads it against the NGO's own taxonomy: *check dam, ~70% complete, signboard GA-17*. It's inside the site geofence. **Trust 91, Verified.**"
3. *(Upload two fakes)* "Now a photo of a laptop screen, and a photo already used by another project last year. **Flagged**, with reasons: recapture detected; near-duplicate, pHash distance 3, from Project Sunrise."
4. *(Search)* "Meera asks in plain English: *check dams near Jhabua before the monsoon with trust above 80*. Hybrid search over Cloudinary metadata, geography and meaning, and every result says why it matched."
5. *(Compare)* "Pramaan paired the before and after automatically. Slider, a labeled composite, a cross-fade reel, all Cloudinary transformations. Green cover went **up 31 points** by the Excess-Green index, and AI Vision describes what changed."
6. *(Studio)* "One click: a CSR report where **every sentence cites evidence**, a PDF evidence pack, four social formats and a subtitled reel, with faces pixelated automatically where there's no consent."
7. *(Phone scan)* "Scan the QR on any card and you land on the provenance page: original, capture time and place, trust signals, hash, and every transformation labeled *transcoded, redacted, edited or AI-assisted*. **GenAI can make a campaign prettier. It can never make evidence.**"

**[2:05–2:35] Technical** *(slide: architecture, Cloudinary in the center)*
> "Cloudinary is our evidence engine, not our bucket: signed uploads with an in-Cloudinary `eval` gate, AI Vision with JSON schemas, transcription and chaptering for video, structured metadata and search, relations for before/after, and deterministic transformation URLs that *are* our lineage. Gemini does cross-asset reasoning: query plans and evidence-cited reports. We built on the Next.js Starter Kit, the Skills Pack, AI Power Start and Cloudinary's MCP servers, which created our metadata schema, presets and flows by prompt."

**[2:35–3:00] Impact & close** *(slide: metrics)*
> "On our labeled test set we flag **__%** of recycled or recaptured images at **__%** precision. A quarterly donor report goes from about 20 hours to under one. Evidence coverage tells a funder exactly how much of what's claimed is proven. Pramaan: from field photo to verified impact, every pixel traceable."

## 2. 5-minute version (if allowed)
Add: 30 s persona story (Meera's quarter), 30 s on privacy (DPDP consent → redaction by transformation), 30 s on eval & honesty (failure modes), 30 s business model (NGO free tier; CSR/agency paid portfolio view; Cloudinary nonprofit discount path).

## 3. Slide outline (8 slides max)
1. Title + tagline + team
2. Hook stat (NMMS: ₹2,600 cr uncovered, then fraud adapted: photos of photos, the 2024 dog photo) + CSR ₹35K cr
3. Root cause: "field media has no evidence chain" (diagram of the trust gap)
4. Pramaan: 7 pillars (capture → trace)
5. *(Live demo, no slide)*
6. Architecture: Cloudinary at the center; integration count; Starter Kit/Skills/MCP badges
7. Results: trust eval metrics, time saved, evidence coverage, cost per 1,000 items
8. Ask/close: "Every pixel traceable" + QR to the live app & repo

## 4. Demo data & environment
- Seed: 2 orgs · 3 projects · 8 sites (real GPS from team-captured photos) · ~300 images · 10 videos · 20 pairs · 3 stories.
- **Fraud set staged** in a "demo inbox" folder, ready to upload live (screen recapture, recycled image, synthetic image made with Cloudinary Image Generation and labeled as test data, wrong-location photo).
- Pre-warm: open every demo URL once (derivatives cached), eager-generate reels/PDF.
- Accounts: `judge@demo` (reviewer), `field@demo` (field agent) on a phone.
- Network: phone hotspot as backup; the demo works on 4G.
- **Backup:** the full 3-min video offline on 2 laptops + USB; screenshots of each step in slides' hidden appendix.

## 5. Recording the 2–4 min video (for the Cloudinary form)
- Screen + voice (OBS/Loom), 1080p, captions (upload to Cloudinary, use its transcription to caption your own demo video: a nice meta-touch).
- Show the live URL in the address bar; show the pipeline inspector with Cloudinary URLs; end with the repo URL + QR.
- Host: YouTube (unlisted) or Cloudinary itself (with `CldVideoPlayer` on a `/demo` page).

## 6. Q&A bank (rehearse; 20-second answers)
See `01_hackathon/03_judging_and_what_cloudinary_wants.md` §4 for the Cloudinary-specific set. Additional:

| Q | A |
|---|---|
| "What if GPS is spoofed?" | "GPS is one signal among ~12; spoofed GPS still fails reuse, recapture or claim-match checks, and capture-app provenance plus device consistency weigh more than EXIF. We triage; humans decide." |
| "False positives will annoy field staff." | "Language is 'needs review', never 'fake'; staff see the reason and can respond or re-capture; reviewers override in one key press; overrides calibrate thresholds." |
| "Why would an NGO pay?" | "Most won't. Free tier for NGOs; the **funder** (CSR teams under Rule 8(3), agencies) pays for portfolio dashboards, audit packs and verification at scale." |
| "How is this different from Google Photos / a DAM?" | "They organize content. We verify evidence: trust signals, lineage, consent-aware outputs and evidence-cited reporting." |
| "What happens at 1 million photos?" | "Media work is on Cloudinary's CDN; analysis runs once at ingest; pHash uses band indexes; vectors use HNSW; search is Cloudinary + PostGIS + pgvector." |
| "Biggest limitation?" | Be honest: "Heavy crops can evade perceptual hashing, and AI-generated detection is a signal, not proof; Cloudinary Moderation's advanced authenticity checks and C2PA at capture are our upgrade path." |
