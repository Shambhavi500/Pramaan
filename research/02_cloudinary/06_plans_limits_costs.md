# 06 · Plans, Limits, Costs & a Hackathon Credit Budget

> Cloudinary judges explicitly warn about **"platformmaxxing"**, piling on features until credits run out. On the Free plan (25 credits) that can take the live demo down **during judging**. This file turns the pricing rules into a concrete budget and guardrails.

---

## 1. Free plan (Image & Video APIs)

| Limit | Free | Why it matters to us |
|---|---|---|
| **Monthly credits** | **25** (30-day cycle; no time limit on the plan) | Everything (storage, bandwidth, transformations, video processing) draws from this |
| 1 credit = | 1,000 transformations **or** 1 GB storage **or** 1 GB bandwidth **or** 500 s SD video processing **or** 250 s HD video processing | |
| Users / product environments | 3 users · **1 environment** | Dev and prod share one environment and one credit pool. Be disciplined. |
| Max image file size / resolution | **10 MB / 25 MP** | Modern 50-MP phone modes can exceed this; the PWA should downscale on device (e.g. ≤ 4096 px, JPEG q≈0.9) while preserving EXIF, or capture at 12 MP |
| Max video file size | **100 MB** | Cap field clips (e.g. ≤ 60 s at 720p) |
| **Max video transformation size** | **40 MB** | **Transformations on videos > 40 MB fail on Free.** Compress/limit at capture; keep reel sources small |
| Max megapixels across all frames | 50 MP | Limits animated outputs |
| **Admin API rate limit** | **500 requests/hour** | Batch Admin calls; use the Search API wisely; prefer the Upload API `explicit` (not rate-limited) for re-analysis; cache results in our DB |
| Add-ons | **Free tiers only** (paid tiers require a paid plan) | AI Vision / Content Analysis / OCR / Google tagging quotas are small, so analyze once and cache |
| Included | Upload widget & API, remote fetch, **auto-backup & revision tracking**, all transformations, video transcoding & streaming, auto optimization, CDN, REST APIs, **MCP server access**, free add-on tiers | |
| Not included | Custom domain, token/cookie auth, **AI-powered search (Visual Search)**, multi-CDN, SSO, provisioning APIs, SLA | Plan around them |
| Assets (DAM) | Every Image & Video plan includes **Assets Free** (Media Library UI, basic search, light collaboration) | Reviewers can use the Media Library moderation view |
| Security default | **PDF and ZIP delivery blocked** on Free until you enable *Settings → Security → Allow delivery of PDF and ZIP files* | Required for evidence packs & archives |
| Overage behaviour | Warnings, then **partial**, then full account disablement | Monitor usage via Admin API `usage` (or the MCP `getUsage` tool) |

Paid plans for reference: Plus $99/mo (225 cr), Advanced $249 (600 cr, Tier-2 search on request, token auth), Advanced Extra $549, Pro PAYG $1,099 (+$0.45/cr overage). **Startups & nonprofits discounts** exist (agent-inquiries@cloudinary.com), which is worth mentioning in the business model slide.

## 2. Transformation counting rules that affect our design

| Rule | Consequence |
|---|---|
| **Each upload = 1 tx** (raw files 0) | 400 uploads ≈ 0.4 credits |
| A transformation URL is **counted once when first generated**; repeat views are free CDN hits | Deterministic URL templates are cheap; don't vary parameter order (`w_200,h_200` ≠ `h_200,w_200` → two derivatives) |
| Chained components **don't** multiply the count | Complex composites cost 1 tx (unless AI effects inside) |
| **AI effects cost extra per derivative**: `e_background_removal` 75, `b_gen_fill` 50, `e_gen_remove` 50, `e_gen_recolor` 50, `e_gen_replace` 120, `e_gen_background_replace` 230, `e_gen_restore` 100, `e_auto_enhance`/`e_enhance` 100, `e_upscale` 10–100 | Keep GenAI out of evidence; in the Story layer use **baseline transformations** (`bl_<name>`) so one AI pass serves all variants |
| **AVIF** costs 1 tx per 2 MP | `f_auto` may pick AVIF; acceptable, just note it |
| **Progressive video**: SD 2 tx/s, HD 4 tx/s, 4K 8 tx/s (h264/h265/vp9); AV1 ×8 | Serve evidence video at **SD by default**; HD on demand |
| **ABR `sp_auto`**: 8 tx/s (≤1080p) | Skip ABR for the demo unless needed; use progressive MP4 |
| **Video AI gravity** (`g_auto` on video): +10 tx/s · **`e_preview`**: +2 tx/s of input | Avoid AI-cropping video; build vertical reels from **images** or pre-cropped clips |
| **Auto video details**: +1 tx/s | Fine |
| **AI Video Analysis**: **+20 tx/s, charged every run** | 30 s clip = 600 tx = **0.6 credits per run**. Use on 2–3 short hero clips only; cache the transcript |
| Audio-only: 0.1 tx/s · animated images: 1 + 0.1/frame · multi-page: 1 + 0.1/page | PDF packs are cheap |
| Derived assets count toward **storage** (not backup) | Clean up experiments |
| Default optimizations (Optimize-by-default setting) count; use `fl_original` to deliver originals without a tx | – |

## 3. Add-on quotas (Free tiers)

Exact free-tier numbers are **not published in the docs**; they appear in Console → Add-ons (login required). Examples in the docs show quota objects like `{"type":"ai_vision","limit":100000,…}` and `{"type":"object_detection","limit":500,…}`. Treat those as *illustrative*, not guaranteed.

**Day-0 action:** open Console → Add-on Marketplace, subscribe to the **Free** tier of: *Cloudinary AI Vision*, *Cloudinary AI Content Analysis*, *OCR Text Detection & Extraction*, *Google Auto Tagging*, *Google Translation*, and note each monthly quota in `docs/quotas.md`. Then size the demo corpus accordingly.

Other known allowances:
- **Cloudinary Moderation**: 500 free moderation actions (assets × rules); advanced checks require an advanced plan.
- **Image to Video**: one-time **16 trial credits on Free** = 16 s of video (8 s with audio); 32 on paid.
- **Image Generation**: auto-subscribed to its free plan on first Console generation.
- **MediaFlows**: billed in **touchpoints** (≥1 per execution; premium blocks 100 per action in "MediaFlows for Assets"). Check the usage report.

## 4. Hackathon credit budget (Sep 29 → Oct 11, single 30-day cycle)

Assumed demo corpus: **3 NGOs × 2 projects × ~4 sites**, ~**350 images**, **12 short videos** (≤ 30 s, ≤ 40 MB), **25 before/after pairs**, **8 stories**.

| Line item | Calculation | tx | Credits |
|---|---|---|---|
| Uploads | 362 × 1 | 362 | 0.36 |
| Image derivatives (thumb, card, detail, analysis-1024, public-safe, map) | 350 × 6 | 2,100 | 2.10 |
| Before/after composites & GIFs | 25 × 4 | 100 | 0.10 |
| Social kit (4 formats × 8 stories) + **5** `b_gen_fill` extensions | 32 + 5 × 50 | 282 | 0.28 |
| Evidence video playback (SD progressive) | 12 × 30 s × 2 | 720 | 0.72 |
| Auto video details | 12 × 30 × 1 | 360 | 0.36 |
| AI Video Analysis (3 hero clips, 2 runs each) | 3 × 30 × 20 × 2 | 3,600 | 3.60 |
| Keyframes | 12 × 6 | 72 | 0.07 |
| Reels (8 × 20 s, SD) incl. slideshow splices | 8 × 20 × 2 | 320 | 0.32 |
| PDF packs (8 × 25 pages) | 8 × (1 + 2.5) | 28 | 0.03 |
| Dev experimentation buffer | – | 2,000 | 2.00 |
| **Transformations subtotal** | | **~9,650** | **~9.7** |
| Storage (originals ≈ 1.6 GB + derived ≈ 0.6 GB) | | | ~2.2 |
| Bandwidth (dev + judges + finals; f_auto/q_auto) | | | ~4–6 |
| **Total** | | | **~16–18 of 25** |

**Guardrails**
1. **Cost panel** in the admin UI: calls Admin API `usage` hourly → shows credits used/remaining; warns at 70%.
2. **Analyze once**: all AI outputs stored in our DB + SMD; the UI never triggers analysis on view.
3. **Named/baseline transformations** for every recurring output; pre-generate with `eager` + `eager_async` at ingest so judge clicks are cache hits.
4. **No `g_auto` on video, no ABR, no AV1** in the demo; SD by default.
5. **GenAI allowance**: max 10 generative transformations and ≤ 16 s Image-to-Video for the whole event.
6. **Freeze the corpus** by Oct 9; no bulk re-processing after that.
7. If a paid-plan trial or hackathon credit boost is offered, accept it; don't rely on it.

## 5. Non-Cloudinary running costs (estimates)

| Service | Plan | Est. cost for the event |
|---|---|---|
| Vercel | Hobby | $0 (function duration limits: keep steps short; push long work to webhooks/queues) |
| Supabase | Free (500 MB DB, pgvector, PostGIS; **pauses after 7 days of inactivity**, so keep it warm before Oct 11) | $0 |
| Gemini API | Free tier for development; pay-as-you-go on a billing-enabled key. Default model **`gemini-2.5-flash`**. ~300 query plans (≈2K in / 0.5K out) + ~40 reports (≈30K in / 4K out) + ~100 pair checks | Low; free-tier rate limits (~5 RPM) are the practical constraint, so calls are throttled and retried |
| Voyage AI (`voyage-multimodal-3.5`) | Free allowance (verify) | ≈ $0–2 |
| Inngest (optional durable jobs) | Free tier | $0 |
| Domain | optional | ₹0–800 |
