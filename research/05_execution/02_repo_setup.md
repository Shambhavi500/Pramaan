# 02 · Repo Setup: Exact Commands & Config

> Run in a fresh folder (not inside this research folder). Commands are for Git Bash/macOS/Linux; PowerShell equivalents are noted where they differ.

---

## 1. Scaffold from the Cloudinary Next.js Starter Kit (challenge requirement)

Interactive (recommended for the screenshot):
```bash
npx create-cloudinary-next
# Project name: pramaan · Cloud name: <your_cloud> · Unsigned preset: No (we use signed)
# AI tools: Cursor (+ Copilot if used) · Install deps: Yes
```
Headless alternative:
```bash
npx create-cloudinary-next --headless --cloudName "<your_cloud>" --projectName pramaan --aiTools cursor --packageManager pnpm
```
This creates Next 16 + next-cloudinary + Tailwind 4, `.env.local`, skills in `.agents/skills/`, and MCP config in `.cursor/mcp.json`.

```bash
cd pramaan && git init && git add -A && git commit -m "Scaffold from create-cloudinary-next (Cloudinary Next.js AI Starter Kit)"
```

## 2. Skills Pack (ensure all four skills)
```bash
npx skills add cloudinary-devs/skills
```

## 3. AI Power Start
Open the project in Cursor and paste the **Get Started** prompt from https://cloudinary.com/documentation/ai_powerstart (canonical: `/documentation/prompts/cloudinary-get-started-prompt.md`). Approve each of the 5 stages. Then:
```bash
git add docs/cloudinary-environment.json docs/cloudinary-getting-started-preview.html && git commit -m "Run Cloudinary AI Power Start: env verified, optimization preview"
```

## 4. MCP servers

Update `.cursor/mcp.json` to use `/mcp` endpoints and add SMD + MediaFlows + local Analysis:
```json
{
  "mcpServers": {
    "cloudinary-asset-mgmt": { "type": "http", "url": "https://asset-management.mcp.cloudinary.com/mcp" },
    "cloudinary-env-config": { "type": "http", "url": "https://environment-config.mcp.cloudinary.com/mcp" },
    "cloudinary-smd":        { "type": "http", "url": "https://structured-metadata.mcp.cloudinary.com/mcp" },
    "cloudinary-analysis": {
      "command": "npx", "args": ["-y", "@cloudinary/analysis", "mcp", "start"],
      "env": { "CLOUDINARY_CLOUD_NAME": "<cloud>", "CLOUDINARY_API_KEY": "<key>", "CLOUDINARY_API_SECRET": "<secret>" }
    },
    "mediaflows": {
      "type": "http", "url": "https://mediaflows.mcp.cloudinary.com/v2/mcp",
      "headers": { "cld-cloud-name": "<cloud>", "cld-api-key": "<key>", "cld-secret": "<secret>" }
    }
  }
}
```
Do **not** commit real secrets. Keep a `.mcp.example.json` in git, and put the real file in `.gitignore` (or use env expansion if your client supports it). Authenticate the OAuth servers from your IDE's MCP settings.

## 5. Dependencies
```bash
pnpm add cloudinary @cloudinary/analysis @langchain/google-genai @langchain/langgraph zod @supabase/supabase-js @supabase/ssr inngest maplibre-gl react-compare-slider recharts qrcode sharp ulid idb-keyval
pnpm add -D @serwist/next serwist vitest @playwright/test @types/qrcode
npx shadcn@latest init
```
(`sharp` runs server-side only. Keep `cloudinary` imports out of client components; Skills rule.)

## 6. Environment (`.env.local`, never committed)
```dotenv
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_API_KEY=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GEMINI_API_KEY=
VOYAGE_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
NEXT_PUBLIC_MAPTILER_KEY=
APP_BASE_URL=https://pramaan.vercel.app
```
Mirror them in Vercel (Production + Preview). Commit a `.env.example` with names only.

## 7. Cloudinary configuration as code
Keep the source of truth in `cloudinary/` and apply via MCP prompts (log them) or a script using the Admin API:
```
cloudinary/
├─ smd-fields.json            # 17 fields (see 04_solution/04 §3)
├─ smd-rules.json             # conditional rules
├─ presets/pramaan_evidence.json
├─ presets/pramaan_evidence_video.json
├─ eval.js                    # intake gate (minify into the preset)
├─ named-transformations.json # t_ev_thumb, t_ev_detail, t_ev_analysis, t_public_safe, …
└─ webhooks.json              # notification triggers
```
Also upload once: `pramaan/blank.mp4` (1-s black video for slideshows), org logos, fonts if custom.

## 8. Database
```bash
npx supabase init
npx supabase link --project-ref <ref>
npx supabase migration new init_schema   # paste DDL from 04_solution/06_data_model.md
npx supabase db push
```
Enable extensions first (`postgis`, `vector`) in the Supabase dashboard or in the migration.

## 9. Deploy
```bash
npx vercel link
npx vercel --prod
```
Then set the Cloudinary **global webhook URL** to `https://<prod>/api/cloudinary/webhook` and test with an upload.

## 10. First MCP prompts to run (and log in `PROMPTS.md`)
1. "Using the structured-metadata MCP, create the metadata fields defined in cloudinary/smd-fields.json exactly (types, validations, datasources), then list them back."
2. "Using the environment-config MCP, create signed upload presets from cloudinary/presets/*.json and show me their settings."
3. "Create the named transformations in cloudinary/named-transformations.json; then generate a test URL for each on samples/landscapes/nature-mountains and confirm HTTP 200 (check X-Cld-Error if not)."
4. "Add webhook notification triggers for upload, eager, moderation, info and metadata-change events to <prod>/api/cloudinary/webhook."
5. "Using the asset-management MCP, upload ./seed/*.jpg with preset pramaan_evidence and metadata from seed/manifest.csv; then list assets tagged no_gps."
6. "Using the mediaflows MCP, create a PowerFlow: when trust_status changes to flagged or needs_review, send a notification with the asset thumbnail and a link to <prod>/e/{asset_id}."

## 11. Repo hygiene (for the GitHub-profile-based selection)
- Clear README with GIF/screenshots at the top, live link, test credentials, architecture diagram, "How we use Cloudinary" table, eval results, team, credits.
- Meaningful commit history (small, descriptive commits; every teammate committing).
- `LICENSE` (MIT), `CREDITS.md`, `PROMPTS.md`, `docs/` (architecture, eval, Cloudinary env proof).
- GitHub repo description + topics: `cloudinary`, `nextjs`, `ai`, `impact`, `csr`, `ngo`, `media-intelligence`, `hackathon`.
- Pin the repo on every member's GitHub profile; update LinkedIn with the project.
