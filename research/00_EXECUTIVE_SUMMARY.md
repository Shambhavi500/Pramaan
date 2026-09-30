# Executive Summary: Winning the Cloudinary Challenge at Code Cubicle 6.0

> One page. Read this first; everything else is supporting detail.

---

## ⏰ Deadlines (as of Tue 29 Sep 2026)
- **Wed 30 Sep, 23:59 IST: HackCulture "Project Submission" round closes.** Finalists (~15–20 of 3,700 registrants) are picked on the team's **GitHub + LinkedIn profiles**. Ship a live vertical slice, a public repo with a strong README, and LinkedIn posts by tomorrow night.
- **Sat 3 Oct: "3 OCT ONLINE"** (PDF footer). Treat it as a checkpoint; submit the Cloudinary Google Form by then.
- **Sun 11 Oct: Final, offline at Paytm, Noida.** Cloudinary 1st prize **₹1,20,000** (₹30K Amazon voucher per member); 2nd ₹40K (site) or ₹20K (info session).

## 🎯 What Cloudinary actually wants
1. **Use their new AI dev tools**: Next.js/React Starter Kit, Skills Pack, AI Power Start, MCP. (Hard requirement; the form asks which and how.)
2. **Functional, production-ready app** with a **live URL**, not a demo video.
3. **Deep, purposeful media integration**: Cloudinary as the *engine* of an AI media pipeline, "not a place to dump images", ideally **generating media (e.g. videos) from transformations** (StudyO), without **platformmaxxing**.
4. **Real-world usefulness / social good**, with a quantified problem (OperaAI opened with "250,000 unfilled trades jobs").
5. Clear README documentation of the integration + a 2–4 min video + thoughtful feedback in the survey.
The likely head judge (**Jen Looper**, Cloudinary DevRel) published exactly this playbook in May 2026 and heads the sibling HackIndia × Cloudinary event with an identical prize structure.

## 🧠 The real problem (root cause)
The PS says "organizing and reporting field media is slow". The root cause is that **field media has no evidence chain.** Photos arrive context-stripped (WhatsApp strips metadata), can be recycled or faked, are never compared consistently over time, and lose their link to the original once edited for campaigns. Evidence:
- After India enforced geotagged-photo monitoring for MGNREGS, **₹2,600 crore of fake wage claims were uncovered in Rajasthan in 7 months**. Then fraud adapted to the photos: the Ministry ordered **manual verification (Jul 2025)** citing *"photographs of photographs"* and irrelevant images (a 2024 case: a photo of two dogs as attendance for nine workers).
- **₹35,000 crore/yr** Indian CSR with mandated **independent impact assessments** (Rule 8(3)); **42%** of nonprofits face rising custom-report demand, **49%** unfunded.
- **>90%** of one major registry's rainforest offsets judged likely "phantom" (2023): unverifiable visual/impact claims are a crisis.
- **DPDP Act**: photos of beneficiaries (esp. children) need consent → redaction by default.

## 💡 The solution: **Pramaan** (प्रमाण, "proof")
*From field photo to verified impact. Every pixel traceable.*

| Pillar | What | PS goal |
|---|---|---|
| 1 Capture | Offline-first PWA + imports; capture-time GPS/time/SHA-256; **in-Cloudinary `eval` intake gate** | R1 |
| 2 Understand | **AI Vision with JSON schemas** (org taxonomy, counts, text, people/minors, recapture/synthetic cues); video **transcription+translation, chapters, AI titles, AI Video Analysis** | R1, R2 |
| 3 Verify | Explainable **Evidence Trust Score** (geofence, EXIF/time, pHash reuse, recapture, claim-match, quality) → reviewer queue | "verifying / reliable" |
| 4 Organize & Discover | 17-field **structured metadata**, map + timeline, **NL → search plan** over Cloudinary Search + PostGIS + embeddings | R1, R5 |
| 5 Compare | Auto-paired before/after → slider, **overlay composite**, **cross-fade reel** (`fl_splice:transition`), **AI Vision on the composite**, ExG green-cover Δ | R3 |
| 6 Tell | Story Studio: **evidence-cited** reports (Gemini), **`multi`→PDF packs**, social kits (g_auto + overlays), subtitled reels, public pages | R4 |
| 7 Trace | Classified derivatives (transcoded/redacted/edited/AI), **hash-chained ledger**, **Verify QR** on every output, **C2PA-ready (`fl_c2pa`)**, **generative firewall** | R6 |

**Architecture:** Next.js (from `create-cloudinary-next`) on Vercel · Cloudinary as the evidence engine (~25 capabilities, each mapped to a requirement) · Supabase Postgres (PostGIS + pgvector + ledger) · **Gemini** for cross-asset reasoning (query plans, evidence-cited reports, Copilot agent) · Voyage multimodal embeddings (since Cloudinary Visual Search is Enterprise-only).

## 🏆 Why this wins
- Hits all six PS goals, including the two most teams will skip: **verification** and **traceability**.
- Cloudinary is used as *perception + rendering + lineage*, which is Jen Looper's stated ideal, and uses their **newest launches** (AI Vision JSON, AI Video Analysis, `source_url` in eval, Starter Kit/Skills/Power Start/MCP).
- Clear social-good story grounded in **real Indian data**, with an economic buyer (CSR).
- Memorable demo moments: fraud caught live, one-click evidence-cited report, **scan-the-QR provenance**.
- Honest and cost-aware: GenAI quarantined and labeled; credit budget fits the Free plan (~16–18 of 25 credits).

## ⚠️ Constraints discovered (designed around)
- **Visual Search** = Enterprise; **Search Tier 2** (geo/EXIF/colors) = Advanced-on-request → mirror values into SMD + PostGIS + pgvector.
- **C2PA** and **Duplicate Detection** = beta, *on request* → file tickets today; pHash index + ledger work without them.
- **Cloudinary Moderation**: AI-generated/web-sourced detection is advanced-plan only; 500 free actions.
- Free plan: 25 credits, 10 MB images, 100 MB video, **40 MB max video transformation**, 500 Admin API calls/h, **PDF/ZIP delivery off by default**.
- AI Video Analysis costs **20 tx per second** → hero clips only.

## ✅ Do this today (Day 0)
1. `npx create-cloudinary-next` → public repo; `npx skills add cloudinary-devs/skills`; run **AI Power Start**; add MCP servers.
2. Console: backups ON, PDF/ZIP delivery ON, Free tiers of AI Vision / Content Analysis / OCR / Google tagging / translation; note quotas.
3. Support tickets: C2PA beta, Duplicate Detection beta; ask DevRel (Discord) about a credit boost.
4. Supabase (PostGIS, pgvector) + Vercel; start `PROMPTS.md`, `CREDITS.md`.
5. Tomorrow: vertical slice live (upload → AI understanding → trust → evidence page) + README → **submit on HackCulture before 23:59**.

→ Full plan: `05_execution/01_build_plan.md` · Integration details: `04_solution/04_cloudinary_integration_blueprint.md`
