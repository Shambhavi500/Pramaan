# 03 · Real-World Evidence: India & Global Context

> Facts, figures and precedents that ground the problem. Use these in the README "Why this matters" section and the pitch hook. Every item has a source link in `06_references/sources.md`.

---

## 1. India: government programs already run on geotagged photo evidence

### 1.1 MGNREGS and the NMMS app (attendance photos)
- The **National Mobile Monitoring System (NMMS)** requires geotagged photos of workers at worksites (twice a day) for MGNREGS attendance.
- **8 July 2025**: the Ministry of Rural Development directed states/UTs to **manually verify digital attendance records**, citing misuse: **"photographs of photographs"**, **irrelevant images**, **fake photographs**, erroneous worker counts, gender discrepancies, multiple entries of a single worker, and afternoon sessions skipped (DownToEarth; Vision IAS; ToppersNotes).
- Documented case: on **15 Apr 2024**, a mate (worksite supervisor) in Sedaria village, **Pali, Rajasthan uploaded a photo of two dogs** on NMMS as attendance for **nine workers** (gravel-road work); he was blacklisted after a Lokpal-ordered inquiry (ETV Bharat, 25 Jun 2024).
- Workarounds included **uninstalling/reinstalling the app** to bypass afternoon photo restrictions.
- Scale: after NMMS photo-monitoring was enforced, **~13 crore fake workdays ≈ ₹2,600 crore** in illegal wage claims were **uncovered** in Rajasthan between **Nov 2024 and Jun 2025**; ~15.31% of reported workdays Jan–Jun 2025 were identified as fraudulent; 7 crore+ workdays cancelled; action against ~1,700 mates and 5,000+ officials (The420.in, updated 4 Jul 2025). **Photo monitoring exposed legacy fraud, and then fraud adapted to the photos** (MoRD circular, Jul 2025).
- Critique: The Wire, "Two Photos or No Pay", and "NMMS didn't end corruption, it changed its shape" (the burden shifted onto workers while fraud adapted).

**Lesson for design:** *Mandating photos does not create trust.* Photos need **verification signals** (recapture detection, duplicate/reuse detection, location/time consistency, content-claim match) plus **human review for the flagged minority**. Our Trust Score targets these exact documented failure modes.

### 1.2 GeoMGNREGA (asset geotagging via ISRO's Bhuvan)
- Assets created under MGNREGA are geotagged through the **Bhuvan** mobile app: GPS location + **two photographs** captured by MGNREGA Spatial Enumerators; **time and location are encrypted at upload**.
- **Before–During–After geotagging** enables **progress-based fund disbursement**.
- Validation is human: **GIS Asset Supervisors** at the block level, then approval by a **state nodal officer**.
- Milestone: **1 crore assets geotagged** (GKToday).

**Lesson for design:** The **before/during/after** model already exists in Indian public administration. Our `phase` field and before/after engine mirror it, and automated pairing + trust signals can take load off the block-level human bottleneck.

### 1.3 Other schemes using photo evidence (for context in the pitch)
PMAY-G (stage-wise geotagged house-construction photos via AwaasApp), Swachh Bharat Mission (Grameen) toilet geotagging, Jal Jeevan Mission asset geotagging, Amrit Sarovar (pond rejuvenation before/after). *Mention generally; verify specifics before quoting numbers.*

## 2. India: Corporate Social Responsibility (CSR)

| Fact | Detail |
|---|---|
| Mandate | Companies Act 2013, **Section 135**: qualifying companies spend 2% of average net profits on CSR |
| Scale | **₹34,908.75 crore** spent in **FY 2023-24** across **~59,600 projects** by **27,188 companies** (National CSR Portal data, as reported by The CSR Journal) |
| Impact assessment | **Rule 8(3)**, Companies (CSR Policy) Rules (2021 amendment): companies with an **average CSR obligation ≥ ₹10 crore** in the three preceding FYs must undertake **impact assessment through an independent agency** for projects with **outlay ≥ ₹1 crore** that were **completed ≥ 1 year** before the study. Assessment cost may be booked as CSR expense up to **5% of total CSR spend or ₹50 lakh, whichever is less**. |
| Disclosure | Listed companies disclose via SEBI's **BRSR** (Business Responsibility & Sustainability Report); the "BRSR Core" subset requires assurance for the largest listed companies |

**Lesson for design:** There's a **paying buyer** (CSR teams) and a **regulatory reason** to want verifiable evidence (independent assessments, BRSR assurance, reputational risk). Frame the product as **"audit-ready impact evidence"** for the CSR ecosystem, not only an NGO tool. This helps the "usefulness" score and a startup/business-model narrative (HackIndia even has a "Media-Savvy Startup" track).

## 3. India: Privacy law and beneficiary imagery (DPDP)

- **Digital Personal Data Protection Act, 2023** + **DPDP Rules, 2025**: core obligations phase in, with compliance required by **13 May 2027**.
- A **photograph that identifies a person is personal data**; CSR/NGO photography therefore needs a lawful basis, typically **consent** that is free, specific, informed, unconditional and affirmative.
- **Children and persons with disabilities**: **verifiable consent of parent/lawful guardian**; prohibition on processing that harms them.
- **Retention**: delete when the purpose is fulfilled or consent is withdrawn.

**Lesson for design:** Consent-aware media handling is a **compliance feature**, not a nice-to-have: face detection → consent status → **automatic redaction in all public derivatives** → withdrawal triggers invalidation. Cloudinary's delivery-time transformations (`e_pixelate_faces`, `e_blur_region`) and `invalidate: true` suit this well.

## 4. Global: the credibility crisis in impact and climate claims

- **Carbon offsets**: The Guardian, Die Zeit and SourceMaterial (2023) concluded **>90% of Verra's rainforest offsets are likely "phantom credits"**; threat to forests overestimated by ~400% on average in the analyzed projects (Verra disputed the methodology; its CEO resigned in May 2023). → Donors and regulators are skeptical of unverifiable environmental claims.
- **Nonprofit reporting burden** (Benevity, 2025): since the start of 2025, **42%** of nonprofits saw increased demand for custom impact reporting and **44%** more requests for custom impact stories; **49%** say donors rarely/never fund that work; **53%** would prefer donors accept existing reports; storytelling jumped from **9th to 2nd** in growing budget areas. → Automating *evidence-grounded, donor-specific* reports directly relieves a funded pain.
- **Donor behavior**: more than half of donors say clear impact reporting makes them more likely to give again (CCS Fundraising, cited by Benevity).
- **Generative AI**: realistic synthetic imagery lowers the cost of fabricated evidence. Industry responses: C2PA Content Credentials (Adobe, Microsoft, Google, camera makers; Cloudinary offers `fl_c2pa` beta) and AI-generated detection (Cloudinary Moderation). → Provenance is becoming an expected feature of media platforms.

## 5. Field reality checklist (design constraints)

| Constraint | Evidence / rationale | Design response |
|---|---|---|
| Intermittent connectivity | Rural field sites; NMMS failures attributed partly to network issues | Offline queue (IndexedDB + Background Sync), resumable/chunked uploads |
| Low-end Android devices | Typical field staff phones | Lightweight PWA, no heavy client ML, server/Cloudinary does the work |
| Metadata stripping | Messaging apps typically strip EXIF (incl. GPS) from shared photos | Capture in-app with Geolocation API; attach metadata at upload; label imported media as "provenance: imported" |
| Multilingual voice | Field staff explain progress verbally | `auto_transcription` with language detection + translation |
| Shared devices / identities | Supervisors upload on behalf of workers | Capture-app sessions per user; device fingerprint in provenance; supervisor attribution |
| Consent paperwork | Paper forms rarely linked to photos | Consent capture (photo of signed form or on-screen consent), linked to assets |

## 6. Pitch-ready one-liners (pick one for the hook)

1. "When one Indian state made photo evidence mandatory, it uncovered ₹2,600 crore in fake wage claims in seven months. Then the fraud adapted: photos of photos. Photos alone aren't proof."
2. "India's companies spend ₹35,000 crore a year on CSR, and the evidence behind it lives in WhatsApp groups."
3. "Generative AI can fake an 'after' photo in five seconds. Impact organizations need proof that survives that."
