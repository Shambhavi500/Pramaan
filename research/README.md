# Research: Cloudinary Challenge, Code Cubicle 6.0 (PS-02)

> The prototype these documents led to lives in the [repository root](../README.md).

> Deep research and a solution design for **Problem Statement 02 · Cloudinary: AI-Powered Impact & Sustainability Media Platform**, compiled 29 Sep 2026.
> Proposed product: **Pramaan** (प्रमाण, "proof"): *from field photo to verified impact, every pixel traceable.*

**Start here → [`00_EXECUTIVE_SUMMARY.md`](00_EXECUTIVE_SUMMARY.md)** (one page: deadlines, what Cloudinary wants, root cause, solution, first actions).

> ⏰ **HackCulture Project Submission closes Wed 30 Sep 2026, 23:59 IST.** See `01_hackathon/01_event_brief.md`.

---

## Folder map & reading order

### 01 · The hackathon
| File | What's inside |
|---|---|
| [`01_hackathon/01_event_brief.md`](01_hackathon/01_event_brief.md) | Timeline & deadlines, prizes (and discrepancies), Cloudinary's official requirements, the submission form field-by-field, rules, open questions |
| [`01_hackathon/02_problem_statement.md`](01_hackathon/02_problem_statement.md) | Verbatim PS (transcribed from the PDF image), close reading, requirements matrix R1–R6 with acceptance criteria, implicit requirements, minimal vs. winning answer |
| [`01_hackathon/03_judging_and_what_cloudinary_wants.md`](01_hackathon/03_judging_and_what_cloudinary_wants.md) | Evidence-based judging model (info session, Jen Looper's playbook, HackIndia rules, form), Cloudinary's motives, inferred rubric, judge Q&A, anti-patterns, self-audit |
| [`01_hackathon/04_past_winners_analysis.md`](01_hackathon/04_past_winners_analysis.md) | OperaAI, StudyO, StudyStudio and others: what won and why; positioning conclusions |

### 02 · Cloudinary: platform research
| File | What's inside |
|---|---|
| [`02_cloudinary/01_platform_overview.md`](02_cloudinary/01_platform_overview.md) | Products (Image, Video, Assets, MediaFlows, Moderation), mental model, core concepts, URL anatomy, 2025–26 strategic direction |
| [`02_cloudinary/02_capability_catalog.md`](02_cloudinary/02_capability_catalog.md) | Exhaustive capability catalog by lifecycle stage with exact syntax, PS mapping and Free-plan availability |
| [`02_cloudinary/03_ai_and_analysis_stack.md`](02_cloudinary/03_ai_and_analysis_stack.md) | Analyze API, AI Vision (JSON schema), Content Analysis, native analysis, video AI chain, Moderation, Duplicate Detection, gaps we must build, "compose then perceive" |
| [`02_cloudinary/04_latest_launches_2025_2026.md`](02_cloudinary/04_latest_launches_2025_2026.md) | Dated timeline of every relevant launch (May 2025 → Sep 2026), relevance ratings, deprecations/gotchas |
| [`02_cloudinary/05_developer_ai_tooling.md`](02_cloudinary/05_developer_ai_tooling.md) | Starter Kits (inspected), Skills Pack contents, MCP servers + tool inventories, AI Power Start stages, recommended setup |
| [`02_cloudinary/06_plans_limits_costs.md`](02_cloudinary/06_plans_limits_costs.md) | Free-plan limits, transformation-cost rules, add-on quotas, **hackathon credit budget**, guardrails, non-Cloudinary costs |
| [`02_cloudinary/07_availability_matrix.md`](02_cloudinary/07_availability_matrix.md) | Free / add-on / beta / on-request / Enterprise status for every capability in the design, with fallbacks + support tickets to file |

### 03 · The problem, to the root
| File | What's inside |
|---|---|
| [`03_problem_deep_dive/01_root_cause_analysis.md`](03_problem_deep_dive/01_root_cause_analysis.md) | Five Whys → root cause ("field media has no evidence chain"), trust-gap model, 8 sub-problems, why now, design principles |
| [`03_problem_deep_dive/02_stakeholders_and_personas.md`](03_problem_deep_dive/02_stakeholders_and_personas.md) | Stakeholder map, 7 personas with JTBD, today-vs-future journey, interview script |
| [`03_problem_deep_dive/03_india_and_global_evidence.md`](03_problem_deep_dive/03_india_and_global_evidence.md) | NMMS/MGNREGA fraud data, GeoMGNREGA before-during-after, CSR Rule 8(3) & spend, DPDP, carbon-credit credibility, reporting burden, pitch one-liners |
| [`03_problem_deep_dive/04_existing_solutions_and_gaps.md`](03_problem_deep_dive/04_existing_solutions_and_gaps.md) | Landscape (ODK/Kobo, govt apps, ProofMode/Truepic, DAMs, M&E, story tools), the gap, positioning, integrations, moat |

### 04 · The solution: Pramaan
| File | What's inside |
|---|---|
| [`04_solution/01_solution_concept.md`](04_solution/01_solution_concept.md) | Concept, one-liners, 7 pillars mapped to PS goals, wow moments, differentiation, scope tiers, success metrics |
| [`04_solution/02_feature_spec.md`](04_solution/02_feature_spec.md) | Screen-by-screen spec (capture, import, evidence, review, dashboard, search, compare, studio, verify, admin, copilot), NFRs |
| [`04_solution/03_system_architecture.md`](04_solution/03_system_architecture.md) | Component diagram, ingest & story sequences, async jobs, webhook handling, security, scaling, deployment |
| [`04_solution/04_cloudinary_integration_blueprint.md`](04_solution/04_cloudinary_integration_blueprint.md) | **26-row integration map**, account settings, SMD schema, presets + `eval` gate, named transformations, code sketches, URL recipes, player, MediaFlows, MCP setup prompts |
| [`04_solution/05_ai_pipeline_design.md`](04_solution/05_ai_pipeline_design.md) | Perception vs. reasoning split, AI Vision prompt, **Trust Score algorithm**, pHash index, evaluation plan, Gemini planner/report/Copilot, embeddings, safety |
| [`04_solution/06_data_model.md`](04_solution/06_data_model.md) | Cloudinary conventions, ER diagram, full Postgres DDL, field ownership, RLS |
| [`04_solution/07_evidence_integrity_and_traceability.md`](04_solution/07_evidence_integrity_and_traceability.md) | Immutable originals, derivative classifier, **generative firewall**, hash-chained ledger, verify page + QR, C2PA plan, consent/redaction |
| [`04_solution/08_before_after_engine.md`](04_solution/08_before_after_engine.md) | Pairing algorithm, repeat-photography ghost overlay, 6 presentation formats, AI-on-composite, ExG metric |
| [`04_solution/09_search_and_discovery.md`](04_solution/09_search_and_discovery.md) | Hybrid search (Cloudinary Search + PostGIS + pgvector), planner→compiler, fusion, "why matched", eval |
| [`04_solution/10_impact_story_studio.md`](04_solution/10_impact_story_studio.md) | Templates, evidence selection, cited generation, Cloudinary rendering (cards, PDF, social, reels, pages), impact & coverage metrics |
| [`04_solution/11_tech_stack.md`](04_solution/11_tech_stack.md) | Stack with rationale & alternatives, Gemini API specifics, repo layout, env vars, "why not X" |
| [`04_solution/12_privacy_safety_ethics.md`](04_solution/12_privacy_safety_ethics.md) | Principles, DPDP alignment, redaction matrix, AI ethics, fraud-detection ethics, security checklist, responsible GenAI |

### 05 · Execution
| File | What's inside |
|---|---|
| [`05_execution/01_build_plan.md`](05_execution/01_build_plan.md) | Roles, Gantt, day-by-day plan (29 Sep → 11 Oct), scope-cut ladder, definition of done |
| [`05_execution/02_repo_setup.md`](05_execution/02_repo_setup.md) | Exact commands: starter kit, skills, Power Start, MCP config, deps, env, config-as-code, DB, deploy, first MCP prompts, repo hygiene |
| [`05_execution/03_demo_and_pitch.md`](05_execution/03_demo_and_pitch.md) | Word-for-word 3-min pitch, 5-min variant, slide outline, demo data, video recording, Q&A bank |
| [`05_execution/04_submission_checklist.md`](05_execution/04_submission_checklist.md) | HackCulture checklist, **draft answers for every Cloudinary form field**, README template, LinkedIn template, finals checklist |
| [`05_execution/05_risks_and_mitigations.md`](05_execution/05_risks_and_mitigations.md) | 20 risks with likelihood/impact/mitigation/owner |
| [`05_execution/06_prompt_log_template.md`](05_execution/06_prompt_log_template.md) | `PROMPTS.md` format and seed entries (the form asks for prompts used) |

### 06 · References
| File | What's inside |
|---|---|
| [`06_references/sources.md`](06_references/sources.md) | Every source consulted, grouped; items that couldn't be verified publicly |

---

## Method
- **Primary sources:** HackCulture page (rendered in a browser, incl. FAQs), the PS PDF (a single image, transcribed), Cloudinary's hackathon page and submission form, Cloudinary docs as markdown (~60 pages), release-note RSS feeds (2024–2026), npm tarballs of both starter kits, the `cloudinary-devs/skills` and `create-cloudinary-next-template` repos, and the MCP/SDK npm packages (tool inventories).
- **Secondary sources:** past-winner write-ups (Devpost), Cloudinary DevRel articles, Indian government/CSR/DPDP coverage, global impact-credibility investigations.
- **Verification:** claims about Cloudinary features cite their docs; availability (Free/beta/Enterprise) was checked per feature. Items that could not be verified are listed in `06_references/sources.md` §H. Syntax that should be tested live is marked **(verify)**.
