# 06 · Prompt Log Template (`PROMPTS.md` in the product repo)

> The Cloudinary form asks *"If you used prompt engineering to build, what prompts did you try?"* and which AI models you used. Log from day 0; it becomes a strong, specific answer and a README section. Keep entries short.

---

## Format
```markdown
### P-017 · 2026-09-30 · Structured metadata schema via MCP
- Tool/model: Claude Code (Claude Opus 5.5) + cloudinary-smd MCP
- Skill(s) active: cloudinary-docs
- Prompt:
  > Using the structured-metadata MCP, create the 17 fields in cloudinary/smd-fields.json exactly…
- Result: ✅ 17 fields created; 1 retry (enum datasource format)
- Learning / feedback for Cloudinary: MCP returned a clear validation error for `strregex`; docs example helped.
```

## Categories to cover (aim for 20–40 entries)
1. **Setup**: AI Power Start run; kit choices; MCP auth.
2. **Cloudinary configuration via MCP**: SMD fields/rules, presets, named transformations, webhooks, MediaFlows flow.
3. **Transformation authoring with the Skills Pack**: composite, stamps, reel splice, subtitles, social crops, redaction, and cases where the skill's self-validation checklist caught an error (e.g. `g_auto` with `c_scale`, `b_` as a qualifier, `f_auto:video`).
4. **Runtime prompts**: AI Vision evidence prompt + schema versions (v1→v3 and why); comparison-on-composite prompt; AI Video Analysis prompt; Claude planner system prompt; report synthesis system prompt; Copilot tool descriptions.
5. **Evaluation prompts**: test-set generation with Cloudinary Image Generation (clearly labeled synthetic).
6. **Debugging prompts**: X-Cld-Error investigations, webhook signature issues.

## Seed entries (copy, then fill results)
- "Get started with Cloudinary in this project: [AI Power Start prompt]"
- "Build a Cloudinary URL that places image B to the right of image A at 800×600 each with white labels 'BEFORE · <date>' and 'AFTER · <date>' in the top-left of each half; use f_auto/q_auto." (Skills: cloudinary-transformations)
- "Create a 6-second video from two images with a 2-second fade between them using a blank base video, 1080×1350, then add subtitles from a VTT raw asset." (Skills: video-transformations reference)
- "Create a named transformation t_public_safe that pixelates faces and fits within 1600×1600; explain whether it counts as transcoded or edited for C2PA."
- "Write an upload eval script that tags images without GPS as no_gps and blurry images (focus < 0.5) as blurry, preserving existing tags."
- "Generate a JSON Schema for AI Vision that returns activity (enum), claim match, counts, people/minors, visible text, recapture/synthetic cues and change measures."
