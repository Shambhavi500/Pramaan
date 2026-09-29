# 02 · Stakeholders, Personas & Jobs-to-be-Done

> The PS names "NGOs, governments, and sustainability organizations". Behind that phrase are at least seven distinct users with conflicting needs. Designing for the right **primary** user is what makes the demo feel real.
> Personas are composites for design; validate them with 2–3 real conversations this week (Jen Looper's #1 tip: *know your audience*).

---

## 1. Stakeholder map

| Stakeholder | Role in the evidence chain | Primary need | Power / interest |
|---|---|---|---|
| **Field coordinator / volunteer** | Captures evidence | Fast, offline, low-effort capture in their language | Low power, high interest |
| **M&E officer** (implementing NGO) | Organizes, verifies, reports | Trustworthy, organized evidence tied to indicators; less manual work | Medium / very high → **primary user** |
| **Comms & fundraising lead** | Turns evidence into stories | Campaign-ready content quickly, in brand, without credibility risk | Medium / high |
| **CSR manager / donor** (funder) | Consumes reports; decides funding | Verifiable proof of outcomes, audit-ready, BRSR/Rule 8(3)-compatible | **High / high → economic buyer** |
| **Independent impact assessor / auditor** | Verifies claims | Traceable evidence, sampling support, exportable packs | High / medium |
| **Government program officer** (e.g. block/district) | Monitors scheme progress, releases funds by stage | Before/during/after proof per asset; fraud detection | High / high |
| **Beneficiary / community member** | Appears in the media | Dignity, consent, privacy; being represented truthfully | Low power, rights-holder |
| **Public / journalist** | Scrutinizes claims | Ability to check "is this real?" | Low / variable |

---

## 2. Personas

### 2.1 Meera Iyer, M&E Manager at "Green Aravalli Foundation" (primary user)
- **Context:** Mid-size NGO (120 staff) running watershed + afforestation programs in 3 districts of Madhya Pradesh and Rajasthan. Funded by 4 CSR partners and 1 state scheme. Manages 6 projects, ~40 sites.
- **Today:** Field teams send photos on WhatsApp groups; she downloads them weekly into Drive folders named by month; builds quarterly reports in Word/PowerPoint; each CSR partner wants a different template; the annual third-party impact assessment asks for "geo-tagged before/after photos for a 10% sample of sites".
- **Pains:** 2–3 days per quarterly report per donor; can't find "that photo of the Bhil Khedi check dam before the monsoon"; donors question whether photos are from the right site; photos of children published by comms without consent forms; saplings "planted" but survival unknown.
- **Jobs-to-be-done:** *When a donor or assessor asks "show me proof", I want to pull verified, site-specific before/after evidence in minutes, so I can defend our work and keep funding.*
- **Success metric:** Report prep from ~3 days to < 1 hour; ≥ 80% of claimed outputs backed by verified evidence.

### 2.2 Ravi Bhuria, Field Coordinator, Jhabua district (capture user)
- **Context:** Speaks Bhili/Hindi; Android phone (₹10k), intermittent 3G/4G, shared data pack; visits 5 sites a day by bike.
- **Today:** Takes photos in the camera app, forwards on WhatsApp in the evening when he has signal; records short voice notes explaining progress.
- **Pains:** Re-sending photos that "didn't go"; being asked "which site is this?"; filling long forms.
- **JTBD:** *When I finish work at a site, I want to capture proof in a few taps even without network, so I don't have to redo it or explain later.*
- **Design implications:** Offline queue, auto-site detection from GPS, Hindi voice note → transcript, big buttons, works on low-end Android, minimal data usage.

### 2.3 Arjun Mehta, Communications & Fundraising Lead
- **Pains:** Hunting for good photos; resizing for Instagram/LinkedIn/WhatsApp; making reels takes a day; afraid of posting the wrong child's face; donor asks "is this photo from our project?".
- **JTBD:** *When a campaign or donor update is due, I want on-brand, multi-format assets built from verified evidence, so I can publish confidently in an hour.*
- **Guardrails he needs:** Consent-aware redaction, AI-assist clearly labeled, provenance link on every asset.

### 2.4 Priya Nair, CSR Head at a listed company (economic buyer)
- **Context:** Oversees ₹40 crore/yr CSR across 25 NGO partners; must meet Rule 8(3) impact-assessment requirements and contribute to the BRSR report; board asks about "greenwashing risk".
- **JTBD:** *When I report to my board and regulators, I need portfolio-level, verifiable evidence of outcomes, so that our CSR claims hold up to scrutiny.*
- **What she'd pay for:** Cross-partner dashboard, evidence coverage per project, audit-ready export, public "verify" links for the annual report.

### 2.5 Dr. Anil Sen, Independent Impact Assessor
- **JTBD:** *When assessing a CSR project, I want to sample sites and check evidence integrity remotely, so I can reduce costly field visits.*
- **Needs:** Trust signals per asset, original files and hashes, capture metadata, ZIP/PDF export, sampling tools.

### 2.6 Block Development Officer (government)
- **Context:** Releases scheme funds in tranches after before/during/after geotagged photo verification (GeoMGNREGA-style).
- **JTBD:** *When a stage completion is claimed, I want to see whether the photo is genuinely new, from the right location, and shows the right stage, so I can release funds without a site visit.*
- **Pain from the news:** "Photos of photos", recycled images, irrelevant uploads (NMMS, 2025).

### 2.7 Sunita Devi, beneficiary and community member (rights-holder)
- Appears in health-camp and SHG meeting photos. Rarely asked for consent; her children appear in school-program photos.
- **Design obligations:** Consent status per person/asset; faces pixelated in public outputs by default; right to withdrawal → derived assets invalidated (Cloudinary `invalidate: true`), originals restricted.

---

## 3. Journey: Meera's quarterly donor report, today vs. with the product

| Step | Today | Time | With the product | Time |
|---|---|---|---|---|
| Collect media | Chase WhatsApp groups, download, rename | 4–6 h | Auto-ingested from the field app / imports, already filed by project/site | 0 |
| Organize | Sort into folders by site/month | 3–4 h | AI + capture metadata auto-classify; map + timeline view | 0 |
| Verify | Eyeball; call field staff to confirm sites | 2–3 h | Trust Score + flagged queue; review only the ~10% flagged | 20 min |
| Find before/after | Scroll through folders | 1–2 h | Auto-suggested pairs per site; approve | 10 min |
| Write report | Word/PowerPoint per donor template | 6–8 h | Story Studio drafts an evidence-cited report per donor template | 15 min review |
| Make visuals | Canva, resize, redact faces manually | 3–4 h | Auto-generated social kit, reel, PDF pack with redaction + verify QR | 5 min |
| Answer auditor | Zip folders, email | 1–2 h | Share a signed evidence-pack link with hashes & provenance | 2 min |
| **Total** | | **~20–29 h** | | **< 1 h** |

(Time estimates are design hypotheses to validate in user interviews, and a good slide if confirmed.)

---

## 4. Interview script (use this week, 15 minutes, 2–3 people)

Targets: NGO M&E / program staff (LinkedIn, college NSS/NGO contacts), a CSR executive, a field coordinator.

1. Walk me through the last time you prepared a donor/CSR report. Where did the photos come from?
2. How do you know a field photo is from the right site and date? Has that ever gone wrong?
3. How long does it take to find a specific before/after pair?
4. What do donors/CSR partners ask for that's hardest to provide?
5. How do you handle consent for photos of beneficiaries and children?
6. If a tool did X [show the one-line concept], what would make you trust it? What would make you *not* use it?
7. May we quote you (anonymously) in our submission?

> Put 2–3 real quotes in the README and pitch. Winners cite real users (OperaAI cited the real trades shortage; Jen Looper's Hack Canada examples consulted real security guards).
