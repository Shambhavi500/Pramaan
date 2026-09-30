<div align="center">

<img src="app/icon.svg" alt="Pramaan logo" width="88" height="88" />

# Pramaan (प्रमाण)

**Proof for every photo.** An evidence pipeline for field media, built on Cloudinary.

`Next.js 15` · `React 19` · `Cloudinary` · `Supabase (PostGIS)` · `Claude`

*Code Cubicle 6.0 · Cloudinary track · PS-02 "AI-Powered Impact & Sustainability Media Platform"*

</div>

---

## The problem

Impact programmes run on photos: a check dam built, saplings planted, a school repaired. Funders, auditors and governments are asked to believe those photos, and today they have little reason to.

- Photos arrive stripped of context (messaging apps remove metadata), get recycled between sites, and are photographed off a screen.
- They are never compared over time in a consistent way.
- Once edited for a campaign, they lose their link to the original.

India's geotagged-photo monitoring for MGNREGS uncovered thousands of crores in fake claims, and fraud then adapted to the photos themselves ("photographs of photographs"). The root cause is not slow reporting. **Field media has no evidence chain.** The full analysis is in [`research/03_problem_deep_dive`](research/03_problem_deep_dive/01_root_cause_analysis.md).

## What Pramaan does

Pramaan gives every photo a chain of custody, from the moment it is taken to the report it ends up in.

| Stage | What happens | Where |
| --- | --- | --- |
| **Capture** | SHA-256 and GPS are recorded on the device at capture time, then uploaded with a signed direct upload. | `/capture` |
| **Import** | Desk staff bulk-ingest existing photos through the Cloudinary upload widget. | `/import` |
| **Gate** | An in-upload `eval` rule at Cloudinary rejects unusable files before they cost anything. | `scripts/setup-cloudinary.ts` |
| **Understand** | A webhook triggers Cloudinary AI analysis: perceptual hash, EXIF, tags, screen-recapture and synthetic-image cues. | `jobs/analyze-image.ts` |
| **Verify** | An explainable **Trust Score** combines eight weighted signals and routes each photo to *verified*, *needs review* or *flagged*. | `lib/trust-engine.ts` |
| **Review** | Reviewers work a moderation queue, with per-signal reasons shown for every decision. | `/review` |
| **Compare** | Before and after photos are paired and shown with a slider. | `/compare/[pairId]` |
| **Discover** | Plain-English search: Claude plans structured filters, Cloudinary Search runs them. | `POST /api/search` |
| **Tell** | Claude writes a report in which every claim cites evidence IDs, packaged as a PDF. | `POST /api/stories` |
| **Trace** | Every derivative is classified, and every event is appended to a hash-chained ledger. Anyone can inspect the lineage. | `/verify/[derivativeId]` |

## Design decisions worth knowing

### 1. An explainable Trust Score, not a black box

Eight signals are scored from 0 to 1 and combined by weight. Each signal carries a human-readable reason, so a reviewer can see why a photo scored the way it did.

| ID | Signal | Weight |
| --- | --- | --- |
| P1 | Channel provenance (client-side hash present) | 10 |
| P2 | EXIF timestamp | 5 |
| P3 | Geofence containment (PostGIS, 150 m tolerance) | 10 |
| I1 | Perceptual-hash reuse across the archive | 15 |
| I2 | Screen recapture | 10 |
| I3 | Synthetic generation | 5 |
| R1 | Activity claim match (does the photo show what was claimed?) | 12 |
| Q1 | Focus and quality | 6 |

The final score is capped by two rules ([`lib/trust-scoring.ts`](lib/trust-scoring.ts)). Without EXIF GPS, a photo can never exceed **79**, so it cannot reach *verified*. Any hard flag, such as a reused image, caps the score at **40**. The scoring math is pure and shared, so the browser-side explainer and the server engine cannot disagree.

### 2. The generative firewall

AI-generated pixels must never become evidence. [`lib/url-builder.ts`](lib/url-builder.ts) classifies every Cloudinary transformation into `transcoded`, `redacted`, `edited` or `ai_generated`. `assertGenerativeFirewall("evidence", ...)` throws on generative steps such as `e_gen_*`, background removal or upscaling. Generative output is allowed only in Story Studio, where it is labelled "AI-assisted".

### 3. Privacy by default

Faces are pixelated in delivery URLs unless consent is on file. `buildSafeEvidenceUrl` picks the `t_public_safe` named transformation unless consent is `obtained` or `not_required`.

### 4. A tamper-evident ledger

Each ledger entry stores the hash of the previous entry, so editing history breaks the chain visibly ([`lib/ledger.ts`](lib/ledger.ts)).

### 5. Perception and reasoning are separated

Cloudinary does the perceiving and rendering: analysis, hashing, transformations, delivery. Claude does the reasoning across assets: search planning and cited reports, both constrained by Zod schemas. Signed uploads are locked to one preset and the `pramaan/` folder tree.

## Tech stack

| Layer | Choice |
| --- | --- |
| App | Next.js 15 (App Router), React 19, TypeScript |
| UI | Tailwind CSS 4, GSAP, Lucide, `react-compare-slider` |
| Media | Cloudinary: `next-cloudinary`, `cloudinary` SDK, `@cloudinary/analysis` |
| Data | Supabase Postgres with PostGIS (geofences) |
| AI reasoning | Anthropic SDK with Zod structured outputs |

## Getting started

**Prerequisites:** Node 20+, a Cloudinary account, a Supabase project, an Anthropic API key.

```bash
npm install
cp .env.example .env.local   # then fill in every value
```

1. Create the schema from [`supabase/migrations/`](supabase/migrations). Against a hosted project: `npx supabase login`, `npx supabase link --project-ref <ref>`, `npx supabase db push`. Locally (needs Docker): `npx supabase start` then `npx supabase db reset`. The migration enables PostGIS, creates the tables, indexes and the `match_phash_candidates` / `check_site_geofence` functions, and turns on RLS. It contains no demo data. RLS note: the app has no user auth yet and uses the service-role key server-side, so anon access is denied but per-organisation isolation is not enforced per user; add auth and per-org policies before exposing the app publicly.
2. Create the Cloudinary configuration as code:

   ```bash
   npm run setup:cloudinary
   ```

   This creates the named transformations, the structured metadata fields and the `pramaan_evidence` upload preset with its `eval` gate.
3. Insert the demo dataset (JalSetu Foundation, Check Dam JH-04; see [`docs/demo-jh04.md`](docs/demo-jh04.md), which also lists the demo images you need to upload). Add `-- --reset-legacy` once to delete the old Green Aravalli demo org:

   ```bash
   npm run seed
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

Open <http://localhost:3000>.

> The Cloudinary webhook (`/api/cloudinary/webhook`) must be reachable from the internet. Locally, expose port 3000 with a tunnel, set `APP_BASE_URL` to the tunnel URL, then run `npm run setup:cloudinary` again.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_API_KEY` | Browser-side Cloudinary config |
| `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Server-only: signing, Admin and Analysis APIs |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only database access |
| `ANTHROPIC_API_KEY` | Search planning and story generation |
| `APP_BASE_URL` | Webhook target and verify-QR links |

### Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run check:demo` | Consistency checks for the demo dataset (no database) |
| `npm run setup:cloudinary` | Provision Cloudinary config |
| `npm run seed` | Insert demo data |
| `npm run db:verify` | Check the configured database: tables, functions, PostGIS, pHash, RLS, seeded claims and coverage |

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Story-driven landing page: the problem, the pipeline, live demos of the trust score, firewall and ledger |
| `/prototype` | Overview of the working prototype |
| `/capture` | Field capture with SHA-256 and GPS, signed direct upload |
| `/import` | Desk bulk ingest via `CldUploadWidget` |
| `/review` | Moderation queue |
| `/compare/pair_01` | Before/after slider. It uses the seeded `cld-sample*` assets, so it needs the public demo cloud or your own copies. |
| `/verify/dv_8f9a2b` | Public lineage inspector (needs seed data) |
| `POST /api/sign-upload` | Signs uploads, restricted to the evidence preset and `pramaan/` folders |
| `POST /api/cloudinary/webhook` | Verified webhook that runs analysis and scoring |
| `POST /api/search` | Natural-language search: Claude plans, Cloudinary executes |
| `POST /api/stories` | Cited report from verified evidence, plus PDF pack |

## Project structure

```text
app/
  page.tsx                 Landing page
  (dashboard)/             Prototype screens: capture, import, review, compare, verify
  api/                     sign-upload, webhook, search, stories
components/
  story/                   Landing-page sections and interactive demos
lib/
  trust-engine.ts          Signal computation (server)
  trust-scoring.ts         Pure scoring math (server and browser)
  url-builder.ts           Delivery URLs and the generative firewall
  transformations.ts       Transformation classifier
  ledger.ts                Hash-chained ledger
  geo.ts, phash.ts         GPS parsing, perceptual-hash handling
jobs/analyze-image.ts      Webhook job: analyse, score, record
scripts/                   setup-cloudinary.ts, seed.ts
supabase/migrations/       Schema, extension, SQL functions, RLS
research/                  Research and solution design (see below)
```

## Research

The thinking behind the build lives in [`research/`](research/README.md): the hackathon brief and judging model, a Cloudinary capability catalogue with plan limits, a root-cause analysis with India and global evidence, and the full solution design (architecture, data model, integrity model, pitch). Start with the [executive summary](research/00_EXECUTIVE_SUMMARY.md).

## Status and known limits

This is a hackathon prototype built to show one vertical slice end to end.

- The review queue and some demo screens run on sample data.
- Compare and verify need the seed data, and compare also needs the sample assets in your Cloudinary cloud.
- Cloudinary features that need paid plans or on-request access (Visual Search, C2PA, Duplicate Detection) are designed around, not depended on. Perceptual-hash reuse is checked in Postgres instead.
- Row-level security and offline-first capture are designed in the research but not built.
