# Pramaan (प्रमाण)

Verifiable field-evidence platform built on Cloudinary (Code Cubicle 6.0). Next.js 15, Supabase (PostGIS + pgvector), Claude for search planning and grounded story synthesis.

## Run

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in every value.
3. Run `supabase/migration.sql` in the Supabase SQL Editor (Postgres 14+).
4. `npm run setup:cloudinary` creates the named transformations, metadata fields and the `pramaan_evidence` upload preset (with the in-upload `eval` gate).
5. `npm run seed` inserts the demo org, project, site, two evidence rows and one derivative.
6. `npm run dev`

The Cloudinary webhook (`/api/cloudinary/webhook`) must be reachable from the internet. Locally, expose port 3000 with a tunnel, set `APP_BASE_URL` to the tunnel URL, then re-run `npm run setup:cloudinary`.

## Routes

| Route | Purpose |
| --- | --- |
| `/capture` | Field capture: SHA-256 + GPS, signed direct upload |
| `/import` | Desk bulk ingest via `CldUploadWidget` |
| `/review` | Moderation queue (demo data, not persisted) |
| `/compare/pair_01` | Before/after slider (uses the seeded `cld-sample*` assets, so it needs the public demo cloud or your own copies) |
| `/verify/dv_8f9a2b` | Public lineage inspector (needs seed data) |
| `POST /api/search` | Claude plans filters, Cloudinary Search executes |
| `POST /api/stories` | Grounded report from verified evidence + PDF pack |

## Generative firewall

`lib/url-builder.ts` classifies every transformation and `assertGenerativeFirewall("evidence", ...)` throws on generative steps in the evidence layer. Generative output is allowed only in Story Studio, labelled "AI-assisted".
