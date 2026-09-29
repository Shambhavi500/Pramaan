# 04 · Submission Checklist, Form Drafts & README Template

---

## 1. HackCulture (Project Submission round closes Wed 30 Sep 23:59 IST)
- [ ] Log in and read the submission form fields (unknown until viewed; fill everything).
- [ ] Live URL (Vercel) works in incognito + test credentials in README.
- [ ] Public GitHub repo with a strong README (template below).
- [ ] Every team member's **GitHub profile** polished (pinned repo, bio) and **LinkedIn** updated + post published (selection is on these profiles).
- [ ] Short demo video link (even a 60-s draft; update later).
- [ ] Confirm with team.geekroom@gmail.com what "3 OCT ONLINE" involves.

## 2. Cloudinary Google Form: draft answers (update with real numbers)

**Hackathon Name:** Code Cubicle 2026
**Team name:** ___
**Project URL:** https://pramaan.vercel.app (demo login in README)
**GitHub URL:** https://github.com/<org>/pramaan

**Brief project description:**
> Pramaan is an AI media-intelligence platform that turns field photos and videos from NGOs, CSR programs and government schemes into verified, searchable evidence and evidence-cited impact stories. It understands media with Cloudinary AI Vision and video AI, scores authenticity (recaptures, recycled photos, location/time mismatches), organizes evidence by project, site and timeline, pairs before/after media to quantify change, and generates reports, PDF evidence packs, social kits and reels through Cloudinary transformations, with full provenance and a "Verify" QR on every output.

**What were your project's media needs and how did you use Cloudinary?** (the most important answer: specific, enumerated)
> Our media needs: ingest large volumes of field photos/videos from low-connectivity areas; extract provenance (time, GPS, device); understand content against each NGO's taxonomy; detect recycled/recaptured images; organize by project/site/timeline; compare before/after; generate reports and campaign media; and keep every output traceable to its original.
> How we used Cloudinary:
> 1) Signed Upload Widget + direct signed uploads from an offline-first PWA; upload presets enforcing our intake policy for every channel (incl. Box/OneDrive/SharePoint/Drive sources).
> 2) An in-Cloudinary intake gate via the upload `eval` script reading `media_metadata` (EXIF/GPS), `phash`, `quality_analysis`, `faces` and `source_url` to tag no_gps/blurry/has_faces and record provenance context before the asset is finalized.
> 3) AI Vision (`ai_vision_general` with JSON-schema structured output, via the `@cloudinary/analysis` SDK) for per-image understanding: activity vs. claim, counts, visible text, people/minors (for consent), recapture and synthetic cues.
> 4) Video: `auto_transcription` with translation (Hindi→English), `auto_chaptering`, `auto_video_details`, AI Video Analysis visual transcripts, keyframes via `so_` + AI Vision; playback in the Video Player with chapters and captions.
> 5) Structured metadata (17 typed fields) + conditional rules, asset folders, tags, context; Search API expressions for faceted + NL-planned search; related assets for before↔after and lineage.
> 6) Before/after: side-by-side composites with text layers, flip GIFs, cross-fade reels (`fl_splice:transition`), and AI Vision run on the composite URL to describe change.
> 7) Stories: g_auto social crops (1:1/4:5/9:16/16:9), overlays (headline, logo, verify QR), labeled `b_gen_fill`, reels with `l_subtitles`/`l_audio`, `multi`→PDF evidence packs, OG images.
> 8) Traceability & privacy: versions/backups, deterministic transformation URLs recorded as lineage (classified transcoded/redacted/edited/AI-generated), `e_pixelate_faces`/OCR region blur via named transformations for consent-aware public outputs, moderation status for reviewer decisions, webhooks with signature verification; C2PA-ready (`fl_c2pa`).
> 9) Ops: named + baseline transformations, eager async, f_auto/q_auto; a MediaFlows PowerFlow for flagged-evidence alerts.
> Dev tooling: Next.js Starter Kit, Skills Pack, AI Power Start, and MCP servers (Asset Management, Environment Config, Structured Metadata, Analysis, MediaFlows) to create our schema, presets, transformations, webhooks and flows by prompt.

**Which did you use?** Next.js Starter Kit ✓ · Skills Pack ✓ · AI Power Start Prompt ✓ · Other: "Cloudinary MCP servers (asset-management, environment-config, structured-metadata, analysis, mediaflows); @cloudinary/analysis SDK; VS Code extension"

**Prompts tried:** paste 6–10 best entries from `PROMPTS.md` (setup prompts via MCP, AI Vision schema prompt, transformation prompts that the Skills Pack fixed, report-synthesis system prompt summary).

**Recording link:** YouTube unlisted / Cloudinary-hosted video.

**AI model(s) used to build:** e.g. "Claude Opus 5.5 (Claude Code) and Cursor for development; runtime: Cloudinary AI Vision/Analyze API, Cloudinary video AI, Claude Opus 5.5 (planning & report synthesis), Voyage multimodal-3.5 embeddings."

**Ratings:** honest; add 1–2 lines of *specific* feedback in the prompts field (e.g. "The skill's side-by-side canvas-extension rule saved us hours; the Next kit's MCP template still uses /sse; Analysis MCP remote is OAuth-only which confused us at first").

**Follow-up conversation:** **Yes**

## 3. README template (repo root)

```markdown
# Pramaan: from field photo to verified impact
> AI media-intelligence for NGOs, CSR & public programs, built on Cloudinary. Every pixel traceable.

[Live demo](https://…) · [2-min video](https://…) · Demo login: judge@demo / ••••
![hero gif](docs/hero.gif)

## The problem (why this matters)
- Photo-based monitoring uncovered ₹2,600 cr of fake wage claims in 7 months in one state, then fraud adapted: "photos of photos" (MoRD, Jul 2025)
- ₹35,000 cr/yr CSR; independent impact assessments mandated (Rule 8(3))
- 42% of nonprofits face rising custom-report demand; 49% unfunded
## What Pramaan does (7 pillars): Capture · Understand · Verify · Organize & Discover · Compare · Tell · Trace
## How we use Cloudinary
| # | Capability | Where | Why |  ← the integration map (26 rows) with example URLs
## Architecture  (mermaid diagram + short text)
## Evidence Trust Score (signals, weights, caps) + evaluation results (precision/recall, confusion matrix, failure modes)
## Search evaluation (Recall@10 / nDCG@10: structured vs semantic vs hybrid)
## Privacy & ethics (consent → redaction by transformation; generative firewall; no face recognition)
## Built with Cloudinary AI dev tools (Starter Kit, Skills, AI Power Start, MCP) + PROMPTS.md
## Cost & scalability (credits per 1,000 items; analyze-once; CDN)
## Run locally (env vars, seed, commands)
## Team · Credits (datasets/photos/music/libraries) · License
```

## 4. LinkedIn post template (each member, 30 Sep and 11 Oct)
> We're building **Pramaan** for #CodeCubicle6 × @Cloudinary: an AI media-intelligence platform that verifies field photos from NGOs, CSR and government programs and turns them into evidence-cited impact stories. Every pixel traceable back to its original. Built with Cloudinary AI Vision, video AI, structured metadata, transformations & MCP, on the Next.js Starter Kit. Live demo 👉 … Repo 👉 … @Geek Room #AI #SocialImpact #CSR

## 5. Final-round checklist (11 Oct)
- [ ] Live URL tested on venue Wi-Fi + hotspot
- [ ] Backup video + slides offline (2 laptops + USB)
- [ ] Phones charged; field-agent login ready; fraud samples on phone gallery
- [ ] Printed A5 social card with QR (judges love scanning a physical artifact)
- [ ] Credit usage < 80%; Supabase awake
- [ ] Timed rehearsal ≤ 3:00 (or the given limit); Q&A owners assigned per topic
