# 03 · Judging & What Cloudinary Actually Wants

> This file triangulates the judging criteria from every available signal: the Cloudinary info-session notes you shared, Cloudinary's hackathon page, the head judge's published advice, a sibling Cloudinary hackathon's rules, the submission form, and past winners. It ends with an **inferred scoring rubric** and a self-audit checklist.

---

## 1. Evidence base

| # | Source | Signal |
|---|---|---|
| S1 | Info session (your notes) | Judged on **"deep integration of media capabilities (audio, video, or image), innovation, UI/UX, and usefulness."** Action item: judge on **"functionality, innovation, Cloudinary integration, and usefulness."** Judges want a **media pipeline, not storage**. **Social-good applications "specifically highlighted as a preferred direction."** Example given: infrastructure-safety imagery (power lines and trees). Past winner cited: "StudyStudio" (Purdue: text extraction + video generation). |
| S2 | cloudinary.com/pages/hackathons | Requirements: use Starter Kit / Skills Pack / AI Power Start; **"Ship something functional and production-ready"**; **"Show an innovative use of Cloudinary's media capabilities"**; complete the survey. Tagline: **"Build a Production-Ready Media App in One Weekend."** Prizes include **featuring projects on Cloudinary's platform**. |
| S3 | "How to Win a Hackathon" by **Jen Looper** (Cloudinary DevRel, head judge on the circuit), dev.to, 4 May 2026 | Know your audience (talk to real users, avoid a "tech savior complex"); talk to sponsors; set AI tools up properly (**Skills Pack prevents hallucinations**) so judges interact with **production-ready apps rather than demo videos**; **deep integration, not surface-level**. At Cloudinary she looks for "not just the use of the platform as a place to dump images and video, but a deep use of the APIs, for example optimizing and transforming images in an AI pipeline with the goal of constructing videos." **Avoid "platformmaxxing"** (using every feature and burning credits). Pitch: 15-s hook → 60–90-s demo → 30-s technical; **record a backup video**. |
| S4 | HackIndia "Pixels to Products: Cloudinary AI Hackathon 2026" (same ₹30K/member + ₹20K runner-up structure; **Jen Looper = Head Judge**) | Every project must **use Cloudinary as an active component, not static image hosting**; implement upload / management / transformation / optimization / search / generation / delivery; **document the integration clearly in the README**; 2–4 min demo video; live demo; public GitHub with setup instructions; mandatory survey. Highlighted capabilities: Upload API, auto-tagging, background removal, content-aware cropping, moderation, transformations, **Search API, structured metadata**, f_auto/q_auto. Tracks: *AI Media Pipelines*, *Generative Content Workflows*, *Media-Savvy Startup*. |
| S5 | Submission form | Asks **how you used Cloudinary for your media needs**, which **kits/skills/prompt** you used and their ratings, **which prompts you tried**, which **AI models**, a recording, and whether they may follow up. |
| S6 | Past winners (see `04_past_winners_analysis.md`) | OperaAI (Hack Canada): real, quantified problem (250K unfilled trades jobs), multimodal AI pipeline, Cloudinary preprocessing and annotated overlays, hands-free UX. StudyO (LA Hacks): Cloudinary transformations stitch stills into TikTok/YouTube/lecture-style **videos**. |
| S7 | Creators Community | Cloudinary values "builders over observers", shipping, sharing, nonprofit partners, "From Cloud to Crowd". |

---

## 2. What Cloudinary gets out of a hackathon (and how to align with it)

Knowing a sponsor's motives is the most reliable way to predict what they will reward.

| Cloudinary's objective | Evidence | How our project serves it |
|---|---|---|
| **Adoption of the new AI developer tooling**: Starter Kits (React GA May 2026; Next.js beta Jul 2026), Skills Pack (Apr 2026), AI Power Start (Aug 2026), MCP servers, Claimable Cloud | Form asks which kits/skills/prompt you used and ratings; kit READMEs carry a hackathon mascot | Build on `create-cloudinary-next`, install Skills, run AI Power Start, use MCP servers at dev time **and** show a runtime agent. Document it in the README and write thoughtful, specific feedback. |
| **Product feedback / research** | Form: prompts tried, AI models, ratings, "follow-up conversation?" | Maintain a prompt log; note concrete friction points (e.g. which skill instructions saved time, where MCP auth was confusing). |
| **Showcases and content** (blog posts, featured projects) | "Featured projects on Cloudinary's platform"; Jen Looper writes posts about winners | Make the project story-ready: clear problem, visual demo, architecture diagram, a README they could lift into a blog post. |
| **Show AI + media as an "intelligence" platform** (AI Vision, Analyze API, Moderation, AI Video Analysis, MediaFlows agents) | 2025–26 launches are AI-heavy | Put Cloudinary's **AI perception** features (AI Vision, captioning, video transcripts, visual transcription) at the core, not only transformations. |
| **Social good / community** | "Social good… preferred direction"; nonprofit partners; the PS itself | NGO/CSR/government evidence is social good by definition. Ground it in real Indian programs and data. |
| **Talent pipeline** | DevRel-led Creators Community | Polished public repo and LinkedIn presence (also needed for HackCulture selection). |

---

## 3. Inferred scoring rubric

No official weighted rubric was published. This is a synthesis of S1–S6; weights are our estimate.

| Criterion | Est. weight | What earns full marks | Our target evidence |
|---|---|---|---|
| **Cloudinary integration depth** | **30%** | Cloudinary is the *engine* of the pipeline: ingest → analyze → organize → transform → deliver → automate. Features used *purposefully*, cost-aware, documented. | ~25 Cloudinary capabilities, each mapped to a PS requirement, in an "Integration map" README section + a live "pipeline inspector" in the UI that shows the Cloudinary calls/URLs behind each result |
| **Usefulness / real-world impact** | **25%** | Solves a real, specific, validated problem for identifiable users, with quantified stakes | NMMS/MGNREGA fraud data, CSR Rule 8(3) impact-assessment mandate, NGO reporting-burden stats; a persona; ideally 1–2 quotes from real NGO/CSR practitioners |
| **Innovation** | **20%** | Non-obvious idea that others won't have | Evidence Trust Score, provenance ledger + "verify" QR, generative firewall, composite-then-analyze before/after, evidence coverage metric |
| **Functionality / production-readiness** | **15%** | Live URL that works when judges click; auth, error states, real data, not a mock | Deployed on Vercel; seeded demo org; judge login; robust async handling; mobile-friendly |
| **UI/UX** | **10%** | Clean, fast, intuitive; clear information hierarchy; good on mobile | Map + timeline + evidence cards; before/after slider; one-click Story Studio; accessible (alt text from AI, captions) |

**Hard gates** (fail any and you're out regardless of the score): uses a Starter Kit/Skills/Power Start · live demo works · public GitHub · survey submitted · README documents Cloudinary usage.

---

## 4. What the judges will *probably* ask in the final (prepare answers)

| Likely question | Crisp answer (to rehearse) |
|---|---|
| "Why do you need Cloudinary for this instead of S3 + OpenAI?" | "Cloudinary is our evidence engine, not our bucket. It extracts EXIF/GPS/pHash and quality at ingest, runs our intake rules *inside* the upload (`eval`), does per-image AI Vision with our taxonomy, transcribes and chapters video, composes before/after images we then analyze, renders every report and reel from the originals through deterministic transformation URLs, and those URLs *are* our lineage. Replacing it would mean building six services." |
| "How do you know a photo is real?" | "We don't claim certainty; we compute an explainable Trust Score from ~10 signals (capture-app provenance, EXIF consistency, geofence, perceptual-hash reuse across the whole corpus, recapture detection, AI-generation cues, claim-content match, quality) and route low scores to a human. Everything's logged. With Cloudinary's C2PA beta, outputs carry signed Content Credentials." |
| "How does this scale / what does it cost?" | "Analysis runs once at ingest and is cached as metadata; views are CDN hits. We use named and baseline transformations and eager async generation. Our credit model: ~X credits per 1,000 evidence items." (Fill from `02_cloudinary/06_plans_limits_costs.md`.) |
| "Isn't AI-generated content dangerous for impact reporting?" | "Yes, so we built a generative firewall. GenAI transformations are blocked in evidence views, allowed only in the Story layer, auto-labeled 'AI-assisted', and recorded in the ledger. The classification mirrors the transcoded-vs-edited allowlist Cloudinary's own C2PA implementation uses." |
| "Who are the users and did you talk to any?" | Persona + any real conversations (strongly recommended: call 2–3 NGO/CSR contacts this week). |
| "What about privacy of beneficiaries/children?" | "Faces are detected at ingest; without recorded consent, every public derivative is auto-pixelated via transformation; DPDP-aligned consent tracking; originals never published." |
| "What did you use the Skills Pack / MCP for?" | Specific examples from the prompt log (e.g. MCP created the structured-metadata schema and upload presets; the Skills Pack produced valid overlay/splice transformation strings on the first try). |

---

## 5. Anti-patterns that lose Cloudinary prizes

1. **"Dump images and video"**: Cloudinary as a CDN/bucket with a couple of `w_300` resizes.
2. **Platformmaxxing**: 40 features bolted on without purpose, credits exhausted mid-judging (a real risk on the Free plan's 25 credits).
3. **Demo-video-only or broken live link**: they explicitly want production-ready apps.
4. **GenAI spectacle without substance**: background replacement on NGO photos is ethically wrong for evidence.
5. **Generic "AI summary" apps**: an LLM wrapper with a gallery.
6. **No README integration section**: judges skim; make the integration legible.
7. **Ignoring their new tools**: not using the Starter Kit/Skills/Power Start fails requirement #1.

---

## 6. Self-audit checklist (run before each submission)

- [ ] Every PS goal (R1–R6) is visible in the live app within 3 clicks.
- [ ] README has **"How we use Cloudinary"** with a table: capability → where in code → why → URL example.
- [ ] Starter Kit used (Next.js) and it shows (repo history starts from `create-cloudinary-next`; `.claude/skills/` or `.agents/skills/` present).
- [ ] Skills Pack + AI Power Start + MCP usage documented with prompts.
- [ ] Live demo URL works in incognito; demo credentials in README; seed data loaded.
- [ ] 2–4 min recorded walkthrough uploaded (public/unlisted link).
- [ ] Credit usage checked in Console; buffer ≥ 30% left before judging windows.
- [ ] Survey submitted with thoughtful feedback + "Yes" to follow-up.
- [ ] Each teammate posts on LinkedIn (build story + tags @Cloudinary, @Geek Room).
