# Demo dataset: JalSetu Foundation, Jal Jeevan, Check Dam JH-04, Jhabua

A fictional project with one coherent story: a check dam across a gully near Jhabua, photographed before (12 May 2026), during (18 Jun, 9 Jul) and after the monsoon (15 Sep), monitored (28 Sep), plus the bad evidence a real programme receives.

- Data: [`lib/demo-dataset.ts`](../lib/demo-dataset.ts). Seed: `npm run seed`. Consistency checks: `npm run check:demo` (no database needed).
- Scores, statuses, geofence distances, pHash distances and report dates are **derived** in the dataset module, not typed twice.
- No measured impact numbers exist. The dataset never states litres, hectares or households.
- Seeded AI Vision results carry `"demo_seed": true`, and ledger entries use the actor `demo_seed`, so they cannot be mistaken for real analysis.

## Media you must supply

The seed writes rows only. It does **not** create images. Upload one JPEG per row to the exact public ID below, or the review, compare and verify screens will show broken images.

Upload **without** the `pramaan_evidence` preset (Media Library, or the Admin/upload API with `public_id` set and no preset). That preset owns the webhook. Going through it would create a *new* evidence row per file (its ID comes from the Cloudinary asset ID), and its pHash would collide with the seeded row for the same picture.

| Public ID | Case | Phase | Expected verdict (score) | What the file should be |
| --- | --- | --- | --- | --- |
| `pramaan/jalsetu-foundation/JH-04/before_01` | baseline | before | verified (100) | Wide shot of a dry gully from the downstream side of the planned alignment; survey stake in frame. |
| `pramaan/jalsetu-foundation/JH-04/before_02` | baseline | before | verified (92) | Same dry channel from the upstream bank, no structure visible. |
| `pramaan/jalsetu-foundation/JH-04/during_01` | construction | during | verified (100) | Foundation trench across the gully, stone and cement bags, project board readable. |
| `pramaan/jalsetu-foundation/JH-04/during_02` | construction | during | verified (100) | Partly built masonry wall with a few workers in frame (faces visible, to exercise redaction). |
| `pramaan/jalsetu-foundation/JH-04/after_01` | after | after | verified (100) | Completed wall and spillway from the SAME vantage as before_01, water pooled upstream. |
| `pramaan/jalsetu-foundation/JH-04/after_02` | after | after | verified (100) | Impounded water behind the wall from the upstream bank (same spot as before_02). |
| `pramaan/jalsetu-foundation/JH-04/after_nogps` | missing gps | after | needs review (79) | A genuine after photo of the dam captured (or exported) with GPS EXIF removed. |
| `pramaan/jalsetu-foundation/JH-04/after_wronggeo` | wrong geofence | after | flagged (40) | A farm pond photo (any pond) so the scene contradicts the claimed check dam. |
| `pramaan/jalsetu-foundation/JH-04/after_reuse` | duplicate | after | flagged (40) | after_02 re-saved with lower JPEG quality and a small resize, metadata stripped, uploaded again via bulk import. |
| `pramaan/jalsetu-foundation/JH-04/after_recapture` | screen recapture | after | flagged (40) | A phone photo of a laptop screen displaying some check dam image. Bezel at the edge, moire visible. |
| `pramaan/jalsetu-foundation/JH-04/during_lowq` | low quality | during | needs review (68) | Small, blurry, compressed photo of the wall (as a WhatsApp forward would look). No EXIF. |
| `pramaan/jalsetu-foundation/JH-04/after_ai_edit` | ai transformed | after | rejected (58) | after_01 run through a generative-fill tool to 'improve' the water, exported without EXIF. |
| `pramaan/jalsetu-foundation/JH-04/before_veg` | vegetation | before | verified (100) | East bank of the gully: dry scrub and bare soil, pre-monsoon. |
| `pramaan/jalsetu-foundation/JH-04/after_veg` | vegetation | after | verified (100) | Same east-bank spot as before_veg after the monsoon: green grass and shrub cover. |
| `pramaan/jalsetu-foundation/JH-04/monitoring_01` | monitoring | monitoring | verified (100) | Same vantage as after_01, two weeks later; water still standing behind the wall. |
| `pramaan/jalsetu-foundation/JH-04/during_community` | community | during | verified (100) | Group photo of workers in front of the partly built wall (faces visible; consent recorded). |

Cloudinary Search (the AI search screen) reads Cloudinary tags and structured metadata (`activity`, `trust_score`), not these tables. The rows are searchable only once the media is uploaded through the normal pipeline (or tagged `pramaan` with that metadata).

## Three-minute path

| Step | Screen | Shows |
| --- | --- | --- |
| Raw media to organisation | `/review` header, DB rows | Every asset resolved to org, project, site, phase, activity from its upload folder and context |
| Visual understanding | `/review` | Captions, detected activity, people and consent flags from the AI Vision result |
| Verification | `/review` | Reused image (40), screen recapture (40), no GPS (79 cap), wrong geofence (70), low quality (68), reviewer-rejected AI edit |
| Before / after | `/compare/pair_01` | `before_01` and `after_01`, same vantage point |
| AI search | Search API | After upload only, see above |
| Impact claims and coverage | `/claims` | Three claims: construction 5 of 5 (strong), water retention 4 of 6 (moderate), vegetation 2 of 6 (weak, one photo pair). Only verified photos count |
| Report | `POST /api/stories`, seeded draft `st_jh04_2026` | Every paragraph cites verified evidence only |
| Campaign asset | `dv_jh04_banner` | Generative-fill banner, classed `ai_generated`, attached to the story, never in the evidence layer |
| Provenance | `/verify/dv_8f9a2b` | Recipe, hashes, trust score; ledger holds analyzed, human_review, derived and synthesized events |

Wrong geofence: a GPS fix beyond the 150 m tolerance is a hard flag in the engine (cap 40), so that row is flagged whatever the photo shows.
