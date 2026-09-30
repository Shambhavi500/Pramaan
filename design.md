# Pramaan — Visual Design System

> **Concept: Evidence Floating in the Clouds.**
> A serious evidence-intelligence platform suspended inside a calm atmospheric environment — not a website decorated with clouds.

**Status:** specification v1 · **Stack:** Next.js 15, Tailwind CSS v4 (`@theme`), `lucide-react`, `gsap`, `react-compare-slider` · **Primary demo target:** desktop, 1440 × 900

**Lifecycle the UI expresses:** Capture → Understand → Verify → Compare → Discover → Prove → Tell

---

## 0. How to read this document

Sections 1–8 are the *foundations* (principles, colour, atmosphere, surface, glass, type, radius, elevation). Sections 9–19 are *signature components and screens*. Sections 20–23 are *motion, the cloud rules, responsive and accessibility*. Sections 24–27 are *inventory, tokens, migration and the quality gate*.

If a rule in a component section conflicts with a foundation, the foundation wins. If a decorative effect conflicts with readability, readability wins (Principle 6).

---

## 1. Design principles

| # | Principle | Meaning in practice |
|---|-----------|---------------------|
| 1 | **Evidence has weight** | Evidence (photos, claims, lineage nodes) sits on higher surfaces than chrome. An evidence card is visibly *above* the page; navigation is *within* it. Weight is expressed by elevation, border clarity and contrast — never by size alone. |
| 2 | **Trust through clarity** | Verification state (status, trust score, provenance) is always visible on the object it describes. It is never in a hover-only tooltip, never behind decorative UI, and always carries text + icon + colour. |
| 3 | **Atmospheric depth** | Five ordered layers: **Atmosphere → Shell → Floating surface → Evidence → Verification metadata.** Each layer is more legible and more opaque than the one behind it. |
| 4 | **Calm intelligence** | Intelligence is shown as *transparency* (interpreted query, "why this matched", signal matrix), not as sparkle icons, gradients-on-text or "AI" badges. |
| 5 | **Editorial hierarchy** | Claims, changes and verdicts are the headline: large, quiet, well-spaced. Navigation, IDs and secondary metadata are small and recessive. One hero element per view. |
| 6 | **Data before decoration** | No blur, texture or gradient may sit *behind* dense text, tables or image regions being inspected. Atmosphere fades to near-nothing on data screens. |
| 7 | **Professional restraint** | Every decorative element must earn its place by serving hierarchy, depth or context. If removing it changes nothing, remove it. |
| 8 | **Traceability** | Every derivative visibly links to its original: persistent Evidence IDs, hash chips, "trace to original" affordances, lineage lines that never break. |

---

## 2. Colour system

Palette logic: a cool, low-chroma family (cloud → sky → atmosphere navy) carries the environment; a neutral ink family carries text; **three status hues** (verified / review / flagged) are the only saturated colours in the product. No rainbow, no purple, no neon.

### 2.1 Raw palette

```text
CLOUD (light neutrals, slightly cool)
--cloud-0    #FFFFFF   pure white — reserved for elevated surfaces & modals
--cloud-25   #FAFCFE   atmospheric white — page base
--cloud-50   #F3F7FB   app canvas tint
--cloud-100  #E9EFF6   recessed wells, table stripes, disabled fills
--cloud-200  #D8E1EC   hairline borders, dividers

SKY (blues)
--sky-50     #EEF5FC   selected row / soft highlight
--sky-100    #DCEAF8   chip fill, hover fill, atmospheric light field
--sky-200    #BFD6F0   light-field peak, focus halo (with alpha)
--sky-300    #93B8E3   decorative lines, map geofence stroke
--sky-400    #5E97D3   secondary interactive, chart secondary
--sky-500    #3A7BBF   link hover
--sky-600    #235FA0   primary interactive (AA on cloud-0: 6.4:1)
--sky-700    #1B4A80   pressed

CYAN (data accent, use sparingly — one accent per view)
--cyan-300   #8FD3DC
--cyan-500   #2F9DB0   lineage lines, active data highlight
--cyan-700   #1F6F80

ATMOSPHERE (deep navy — hero, inverse surfaces, dark mode base)
--atmosphere-700  #1E3350
--atmosphere-800  #14243B
--atmosphere-900  #0C1A2E   deepest navy
--atmosphere-950  #08121F

INK (text, slate → graphite)
--ink-900    #0F1B2B   primary text (16.9:1 on cloud-0)
--ink-800    #1D2B3D   headings on tinted surfaces
--ink-700    #33475F   secondary text (9.3:1)
--ink-600    #4A5F78   tertiary text (6.4:1)
--ink-500    #667B93   muted/metadata (4.6:1 — minimum for text)
--ink-400    #93A3B6   placeholder / disabled text (decorative only — fails AA; never for essential info)
--graphite   #2A3441   mono/technical blocks, dark code wells

STATUS (each with fg / soft-bg / border / on-dark)
--verified-700 #0F6B45  fg text          (6.3:1 on cloud-0)
--verified-600 #16855A  icon / accent bar
--verified-100 #E1F3EA  soft bg
--verified-300 #9DD5B8  border
--review-700   #8A5A00  fg text          (5.9:1)
--review-600   #B7791F  icon / accent bar
--review-100   #FBF0D9  soft bg
--review-300   #E8C27A  border
--flagged-700  #A32B3A  fg text          (6.6:1)
--flagged-600  #C43D4E  icon / accent bar
--flagged-100  #FBE5E8  soft bg
--flagged-300  #EDA3AD  border
```

### 2.2 Semantic roles (use these in components, not raw palette)

| Role | Token | Value | Use when |
|------|-------|-------|----------|
| **Background** | `--color-bg` | `cloud-25` | Body/page base, under the atmosphere layers |
| | `--color-bg-tint` | `cloud-50` | App content region behind cards |
| | `--color-bg-well` | `cloud-100` | Recessed areas: inputs, code/hash blocks, table headers |
| | `--color-bg-inverse` | `atmosphere-900` | Hero, verification "ledger" bands, dark mode base |
| **Surface** | `--color-surface` | `#FFFFFF` @ 100% | Standard card (Surface 1); tables; reports |
| | `--color-surface-elevated` | `#FFFFFF` | Floating evidence card (Surface 2); paired with elevation shadow |
| | `--color-surface-glass` | `rgba(255,255,255,.72)` | *Only* where §5 allows (nav, overlays, command bar) |
| | `--color-surface-selected` | `sky-50` | Selected row/card body |
| **Border** | `--color-border` | `cloud-200` | Default card/table edges |
| | `--color-border-strong` | `#B9C7D8` | Inputs, focused-adjacent, dividers on tint |
| | `--color-border-subtle` | `rgba(15,27,43,.06)` | Inner separators within a card |
| | `--color-border-inverse` | `rgba(255,255,255,.14)` | On atmosphere-900 |
| **Text** | `--color-text-primary` | `ink-900` | Titles, values, claims |
| | `--color-text-secondary` | `ink-700` | Body copy, descriptions |
| | `--color-text-tertiary` | `ink-600` | Labels, supporting lines |
| | `--color-text-muted` | `ink-500` | Metadata, captions (never smaller than 12px) |
| | `--color-text-disabled` | `ink-400` | Disabled controls only |
| | `--color-text-inverse` | `#F3F7FB` | On navy |
| **Interactive** | `--color-action` | `sky-600` | Primary button fill, links, active nav |
| | `--color-action-hover` | `sky-500` | Hover |
| | `--color-action-pressed` | `sky-700` | Active/pressed |
| | `--color-action-soft` | `sky-100` | Secondary/ghost hover fill, chip selected |
| **Focus** | `--color-focus` | `#1B6FD1` | 2px ring + 2px offset, always visible on keyboard focus |
| **Disabled** | `--color-disabled-bg` / `-fg` | `cloud-100` / `ink-400` | Non-interactive controls; also `aria-disabled` |
| **Status** | `--color-verified` / `-review` / `-flagged` | see palette | Semantic status only — never decorative |

### 2.3 Interactive state matrix

| State | Primary button | Secondary (outline) | Row / card |
|-------|----------------|---------------------|-----------|
| Rest | `action` fill, white text | 1px `border-strong`, `ink-900` text | `surface` |
| Hover | `action-hover`, elev +1 | fill `sky-50` | elev +1 (§8), border `sky-200` |
| Active | `action-pressed`, no shadow | fill `sky-100` | scale `.995` |
| Focus-visible | + 2px `focus` ring, 2px offset | same | same |
| Disabled | `disabled-bg` / `disabled-fg`, no shadow | same | 60% opacity, `cursor:not-allowed` |
| Selected | — | `sky-100` fill, `sky-600` border | Surface 3 treatment (§4) |

### 2.4 Dark mode (secondary)

Pramaan is **light-first** for evidence inspection (photos are judged against a neutral, bright canvas), with a **dark atmosphere theme** for hero, presentation/demo and verification-ledger contexts. Dark mode swaps semantic tokens, not components:

`bg → atmosphere-950`, `surface → #12233A`, `surface-elevated → #172B47`, `border → rgba(255,255,255,.10)`, `text-primary → #EEF4FB`, status fg use the `*-300` tints. Contrast requirements are identical.

> Migration note: the shipped UI is currently dark navy with lime CTAs (Cloudinary-hub language). Lime and the neon cyan chip are **retired** (they read as a vendor demo — see Quality Gate). The dark theme is preserved as `[data-theme="dark"]` so nothing is lost during migration.

---

## 3. Atmospheric background system

The environment is built from **five stacked layers**. Only Layer 4 is interactive. Layers 0–3 are rendered by one component, `<AtmosphericBackground />`, `position: fixed; inset: 0; z-index: -1; pointer-events: none`.

```text
Layer 4 — Floating surfaces (cards, panels)            ← content, opaque or per §5
Layer 3 — Fog/cloud texture (SVG noise, ≤ 4% opacity)  ← texture only
Layer 2 — Large blurred radial light fields            ← the "sky light"
Layer 1 — Extremely subtle blue vertical gradient      ← horizon
Layer 0 — Base cloud white (#FAFCFE)                   ← flat colour
```

### 3.1 Construction (CSS, no external images)

```css
.atmosphere {
  position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background-color: var(--cloud-25);                                   /* L0 */
  background-image:
    radial-gradient(60vw 45vh at 12% -5%,  rgb(191 214 240 / .55), transparent 70%),  /* L2 light A */
    radial-gradient(50vw 40vh at 92% 8%,   rgb(220 234 248 / .70), transparent 70%),  /* L2 light B */
    radial-gradient(70vw 50vh at 50% 110%, rgb(191 214 240 / .40), transparent 70%),  /* L2 haze low */
    linear-gradient(180deg, #F3F8FD 0%, #FAFCFE 38%, #F6F9FC 100%);                    /* L1 */
}
.atmosphere::after {                                                    /* L3 fog texture */
  content: ""; position: absolute; inset: 0; opacity: .035; mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='.012 .02' numOctaves='3' seed='7'/><feColorMatrix values='0 0 0 0 .36  0 0 0 0 .5  0 0 0 0 .7  0 0 0 .9 0'/></filter><rect width='100%' height='100%' filter='url(%23f)'/></svg>");
}
```

The fog texture is an **inline SVG `feTurbulence` data URI** (≈ 500 bytes, no network, no image asset). Stretch it with `background-size: 900px 600px` for cloud-scale (not grain-scale) structure.

### 3.2 Intensity modes

Set on the app shell via `data-atmosphere`:

| Mode | Where | L2 light alpha | L3 opacity | Motion |
|------|-------|---------------|-----------|--------|
| `hero` | Landing, verify hero | 100% (values above) + navy vertical vignette | 5% | slow drift (§20) |
| `ambient` | Overview, Discover, Impact, Stories | 60% | 3% | none |
| `quiet` | **Evidence, Review, Compare, Ledger, tables, reports** | 25% | 0 (removed) | none |

Rule: **the denser the screen, the quieter the sky.** In `quiet` mode the background is effectively `#F6F9FC` with a barely perceptible top light.

### 3.3 Hero atmosphere (dark)

For the landing hero, invert: `atmosphere-900` base, L2 lights in `sky-600 @ 35%` and `cyan-500 @ 12%`, with a lower **cloud bank** — 2–3 large blurred ellipses (`filter: blur(60px)`, `opacity .5–.7`, white → `sky-200`) sliding at different depths, fading the hero into `cloud-25` at its bottom edge (a 240px linear-gradient handoff). Evidence cards emerge *out of* this bank (see §19).

### 3.4 Performance constraints

- Static gradients only on data screens; no animated blur.
- Max **3** blurred ellipse elements in the hero; each `will-change: transform` only while animating; otherwise off.
- No `backdrop-filter` on the atmosphere itself.
- Total atmosphere cost target: < 1 ms paint on a mid-range laptop; must not affect scroll FPS.

---

## 4. Floating surface system

Surfaces communicate **depth in the evidence hierarchy**, not decoration. Elevation values reference §8.

| Level | Name | Use | Background | Border | Shadow | Blur | Radius | Hover | Active |
|-------|------|-----|------------|--------|--------|------|--------|-------|--------|
| **S0** | Flat | Page/regions, table body, report prose | transparent / `bg-tint` | none | `elev-0` | none | 0–`md` | — | — |
| **S1** | Standard card | Metric cards, form panels, list containers, settings | `surface` | 1px `border` | `elev-1` | none | `lg` (12) | border → `border-strong` | — |
| **S2** | Floating evidence | Evidence cards, claim cards, story cards, map popovers | `surface-elevated` | 1px `border` + 1px inner top highlight `rgba(255,255,255,.9)` | `elev-2` | none | `lg` (12) | translateY(-2px), `elev-3`, border `sky-200` | translateY(0), `elev-2` |
| **S3** | Focused / active evidence | Selected card, evidence in inspector, current lineage node | `surface-elevated` | 1px `sky-300` + 3px `sky-600 @ 14%` halo | `elev-3` | none | `xl` (16) | — | halo strengthens |
| **S4** | Inspection layer | Modals, lightbox, full evidence inspector, command palette | `surface-elevated` (or glass for palette only) | 1px `border` | `elev-4` + scrim | scrim `blur(2px)` on the page behind only | `xl` (16) | — | — |

**Scrim:** `rgba(12,26,46,.42)` for S4; the blur applies to the *page behind*, never to the modal contents or to evidence images.

**Rules**
- Cards are never rotated, tilted or perspective-transformed. Depth comes from shadow, border and lift only.
- The lift on hover is 2px max. No scale-up of evidence images (it alters what is being inspected).
- A card's evidence image is inset 0 (full-bleed at top, rounded to the card radius) and has **no** overlay effects except the status stripe/pin (§9).
- Two S2 cards adjacent must keep ≥ 16px gap so shadows do not merge into mud.

---

## 5. Glass / translucency rules

Glass is a **tool for temporary and overlaid controls**, not a theme.

```css
.glass {
  background: rgb(255 255 255 / .72);
  border: 1px solid rgb(255 255 255 / .65);
  box-shadow: var(--shadow-md), inset 0 1px 0 rgb(255 255 255 / .8);
  -webkit-backdrop-filter: saturate(1.15) blur(var(--blur-md));
          backdrop-filter: saturate(1.15) blur(var(--blur-md));
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass { background: rgb(255 255 255 / .96); }     /* opaque fallback, same look, no blur */
}
@media (prefers-reduced-transparency: reduce) {
  .glass { background: #fff; backdrop-filter: none; -webkit-backdrop-filter: none; }
}
```

| ✅ Allowed | ❌ Not allowed |
|-----------|---------------|
| Top navigation / lifecycle bar | Data tables, ledger rows |
| Floating filter bar over a grid | Reports, stories body copy, long descriptions |
| Map overlays (legend, layer control, cluster popover) | Trust-signal breakdown text |
| Metadata overlay *on* an image (chip row) — with scrim gradient beneath | Forms, inputs, error messages |
| Command/search bar | Modals' primary content (use opaque S4) |
| Toasts, tooltips, transient controls | Anything carrying ≥ 3 lines of text |

**Constraints**
- Blur radius ≤ 16px (`--blur-md`); ≤ 8px over large imagery (`--blur-sm`).
- Never blur-over-image for more than ~15% of a viewport area. Do **not** put a large `backdrop-filter` region over a photo being inspected.
- Text on glass must still meet AA against the *worst-case* backdrop; if the backdrop is a photo, add a `linear-gradient(to top, rgb(12 26 46 / .55), transparent)` scrim under the text or use the opaque fallback.
- Max **one glass layer** visible per region (no glass on glass).
- **Fallback:** without `backdrop-filter`, surfaces become 96% opaque white — identical hierarchy, zero blur.

---

## 6. Typography

**Voice:** institutional credibility (serif-adjacent restraint in display) + modern technology (neutral grotesque body, precise monospace).

| Role | Family | Rationale |
|------|--------|-----------|
| **Display** | `"Newsreader"` / fallback `"Source Serif 4", Georgia, serif` — used **only** for hero, page titles, claim titles, and the trust verdict | Editorial, audit-report gravitas. Sparing use keeps it premium, not literary. |
| **UI / body** | `Inter` (already loaded as `--font-inter`), fallback `ui-sans-serif, system-ui` | Neutral, highly legible; already in the app |
| **Mono** | `"JetBrains Mono"` / fallback `ui-monospace, "Cascadia Mono", Menlo, Consolas` | IDs, hashes, timestamps, coordinates |

> If adding a serif is undesirable (no new dependency), use Inter at weight 300 with tight tracking for display — the system still works. Newsreader is loaded via `next/font/google` (self-hosted, zero runtime dependency). Mono falls back to system stack if not loaded.

`font-feature-settings`: body `"cv11","ss01"`; all numerals in metrics/scores/tables use **`font-variant-numeric: tabular-nums`**; mono uses `"zero"` (slashed zero — critical for hashes).

### 6.1 Type scale

| Style | Family | Size / Line | Weight | Tracking | Case | Usage |
|-------|--------|-------------|--------|----------|------|-------|
| **Hero heading** | Display | clamp(44px, 6vw, 84px) / 1.02 | 400 | −0.025em | Sentence | Landing hero only |
| **Page title** | Display | 36 / 1.12 | 400 | −0.02em | Sentence | Top of each route |
| **Section heading** | UI | 22 / 1.25 | 600 | −0.01em | Sentence | Section headers |
| **Card title** | UI | 16 / 1.35 | 600 | −0.005em | Sentence | Evidence/story/claim card titles |
| **Claim title** | Display | 24 / 1.2 | 500 | −0.01em | UPPER via `text-transform` **no** — Sentence | Impact Claim Card headline |
| **Body** | UI | 15 / 1.6 | 400 | 0 | — | Paragraphs, descriptions |
| **Body small** | UI | 14 / 1.5 | 400 | 0 | — | Dense UI, table cells |
| **Caption** | UI | 12 / 1.4 | 500 | 0.01em | — | Image captions, helper text (≥ 12px, always) |
| **Overline / label** | UI | 11 / 1.3 | 600 | 0.08em | UPPER | Group labels, "INTERPRETED QUERY", status labels |
| **Status label** | UI | 11 / 1 | 700 | 0.06em | UPPER | StatusBadge text |
| **Metric** | UI | 32 / 1.1 | 600 | −0.02em | tabular | KPI values |
| **Trust score** | Display numerals | 56 / 1 | 500 | −0.03em | tabular | The `94` |
| **Evidence ID** | Mono | 12.5 / 1.3 | 500 | 0.02em | — | `EV-2026-000418` |
| **Metadata (mono)** | Mono | 12 / 1.4 | 400 | 0 | — | Timestamps, coordinates, EXIF values |
| **Hash / technical** | Mono | 11.5 / 1.5 | 400 | 0 | — | SHA-256, prev-hash; truncated `a3f9…c81e` with copy + expand |

### 6.2 Rules
- Body line length 60–75ch. Reports and stories cap at `max-w-[68ch]`.
- Technical strings never wrap mid-value; use truncate-middle + tooltip + copy button, and expose full value on focus/click.
- Weight 300 (current shipped body) is **retired** for body copy — too thin on light backgrounds. Minimum body weight 400.
- No all-caps sentences; caps only for ≤ 3-word labels.

---

## 7. Border radius

Radius encodes *how technical vs. how friendly* an element is. Restraint keeps it institutional.

| Token | px | Use | Why |
|-------|----|-----|-----|
| `--radius-xs` | 2 | Hash chips, code wells, table cell highlights | Technical data reads as precise |
| `--radius-sm` | 6 | Inputs, buttons, small tags, image thumbs in lists | Controls are crisp |
| `--radius-md` | 10 | Cards inside cards, metadata blocks, tooltips | Sub-surfaces |
| `--radius-lg` | 14 | **Standard/floating cards (S1/S2)** | The "floating object" radius |
| `--radius-xl` | 20 | Modals, S3/S4, hero panels, command bar | Major floating surfaces, not childish |
| `--radius-pill` | 999 | **Status badges, filter chips, compact toggles only** | Pill = "state or filter", never a container |

Never `rounded-full` on cards, images, or primary buttons (buttons use `sm`). Avatars/map pins are the only circles.

---

## 8. Shadows and elevation

Shadows are **soft, diffused, cool-tinted (`rgb(20 40 70)`)**, low-opacity. Two layers per level: a tight contact shadow (grounds it) + a wide ambient shadow (floats it). Never pure black. Max ambient blur 48px.

```css
--shadow-color: 20 40 70;
--elevation-0: none;
--elevation-1: 0 1px 2px rgb(var(--shadow-color) / .06), 0 1px 1px rgb(var(--shadow-color) / .04);
--elevation-2: 0 1px 2px rgb(var(--shadow-color) / .06), 0 6px 16px -4px rgb(var(--shadow-color) / .10), 0 12px 28px -12px rgb(var(--shadow-color) / .10);
--elevation-3: 0 2px 4px rgb(var(--shadow-color) / .06), 0 12px 28px -6px rgb(var(--shadow-color) / .14), 0 24px 40px -18px rgb(var(--shadow-color) / .14);
--elevation-4: 0 4px 8px rgb(var(--shadow-color) / .08), 0 24px 48px -8px rgb(var(--shadow-color) / .22), 0 40px 80px -24px rgb(var(--shadow-color) / .20);
```

| Level | Surface | Read |
|-------|---------|------|
| `elevation-0` | S0 | Grounded in the page |
| `elevation-1` | S1 | Resting on the plane |
| `elevation-2` | S2 | Hovering ~8px above |
| `elevation-3` | S3, S2:hover | Lifted, focused |
| `elevation-4` | S4 | Detached, over a scrim |

**Dark mode:** shadows reduce to `rgb(0 0 0 / .35)` variants plus a 1px top-light border (`rgba(255,255,255,.08)`) — depth comes from border-light, not shadow.

---

## 9. Evidence Card (canonical)

The most important component. **S2** surface, `radius-lg`, 320–360px wide in grids (min 280).

```text
┌───────────────────────────────────────────┐
│ ▮ status stripe (3px, top edge)           │
│ ┌───────────────────────────────────────┐ │
│ │            MEDIA PREVIEW              │ │  4:3, object-cover, lazy, Cloudinary f_auto,q_auto,c_fill
│ │ [● VERIFIED]              [⌖ 3 signals]│ │  status pin (top-left, opaque) · signal count (glass chip)
│ └───────────────────────────────────────┘ │
│ EV-2026-000418                  ⎘ copy    │  mono, 12.5
│ Check dam — north bank                    │  card title, 16/600
│ Jal Jeevan · Site JH-04 · Check Dam Rest. │  project · site · activity
│ 14 Jun 2026 · 09:41 IST · 23.3441°N 85.3096°E │  mono metadata row
│ ┌ signals ─────────────────────────────┐  │
│ │ ◇ water body   ◇ masonry  ◇ vegetation│  │  chips (pill), max 3 + "+2"
│ └───────────────────────────────────────┘ │
│ ───────────────────────────────────────── │
│ 94 ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ ✓ VERIFIED  8/8  │  mini TrustScore (see §10)
│ [Inspect]   [Compare]   [Cite]   ⋯        │  quick actions
└───────────────────────────────────────────┘
```

### 9.1 Status treatment (never colour-only)

| State | Stripe / accent | Pin | Icon | Text label | Shape cue | Trust bar tint |
|-------|-----------------|-----|------|-----------|-----------|----------------|
| **Verified** | `verified-600` | `verified-100` bg, `verified-700` text | `ShieldCheck` (filled check) | **VERIFIED** | solid stripe | green fill |
| **Needs review** | `review-600` | `review-100`, `review-700` | `Eye` / `AlertCircle` (open ring) | **NEEDS REVIEW** | **dashed** stripe | amber fill, hatch overlay |
| **Flagged** | `flagged-600` | `flagged-100`, `flagged-700` | `OctagonAlert` (octagon) | **FLAGGED** | **double** stripe (3px + 1px gap) + image gets 1px `flagged-300` inset border, image desaturated 25% | red fill, cross-hatch |

Distinguishable by **icon shape + label text + stripe pattern + hatch texture** — colour is redundant reinforcement.

### 9.2 Card states
Rest → Hover (lift 2px, elev-3, quick actions become fully opaque) → Focus-visible (2px ring on whole card; card is a single link target with nested buttons) → Selected (S3 halo) → Loading (image skeleton: `cloud-100` with a 1.6s linear shimmer at 40% intensity; reduced-motion: static) → Error (image failed: `cloud-100` well with `ImageOff` icon and "Preview unavailable · original preserved").

### 9.3 Variants
`compact` (list row, 72px thumb), `grid` (default), `inspector` (S3, full width, includes EXIF/hash panel), `citation` (inline in claims/stories: 56px thumb + ID + status dot + trust).

---

## 10. Trust Score visual language

An **evidence instrument**: precise, quiet, forensic. No gamification (no stars, badges, confetti, animated fills beyond a single 400ms draw on first view, no multicolour gauges).

### 10.1 Compact (in cards)

```text
94 ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬░  ✓ VERIFIED
```
A 4px-tall horizontal confidence bar (`cloud-200` track, status-colour fill), numeral in tabular display numerals, label with icon. Threshold ticks on the track at **50** and **80** (1px, `ink-400`) mark the Flagged and Verified cut-offs (the real pipeline thresholds in `lib/trust-scoring.ts`) — the viewer can see *why* 94 is verified.

### 10.2 Instrument (in inspector / verify page)

```text
┌─ TRUST ASSESSMENT ──────────────────────────────────┐
│                                                     │
│        ╭───╮   94 / 100                            │
│       │ 94 │   VERIFIED                             │
│        ╰───╯   8 of 8 checks passed · Model v2.3    │
│  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬░░  (ticks @50, @80)   │
│                                                     │
│  PROVENANCE                                         │
│  P1  Channel provenance        ✓ pass     0.99      │
│  P2  EXIF timestamp            ✓ pass     1.00      │
│  P3  Geofence                  ✓ pass   12 m in     │
│  INTEGRITY                                          │
│  I1  pHash reuse               ✓ pass    none       │
│  I2  Screen recapture          ✓ pass     0.02      │
│  I3  Synthetic generation      ✓ pass     0.03      │
│  RELEVANCE                                          │
│  R1  Activity match            ✓ pass     0.91      │
│  QUALITY                                            │
│  Q1  Image quality             ✓ pass     0.88      │
└─────────────────────────────────────────────────────┘
```

- **Ring:** a restrained 72px, **3px stroke** ring (`cloud-200` track, status-colour arc, no gradient, no glow) with the numeral centred. Optional; the horizontal bar is the primary form.
- **Signal matrix:** grouped by family (Provenance P, Integrity I, Relevance R, Quality Q) with overline labels. Each row: mono code (`P1`), name, **result glyph** (`✓` pass / `!` review / `✕` fail — different shapes), value in mono, and a 40px micro-bar.
- **Row states:** pass = `ink-700` text, `verified-600` glyph; review = amber glyph + row `review-100` tint + hatched micro-bar; fail = red glyph + `flagged-100` tint + "Why?" disclosure.
- **Expandable:** a row expands to show the raw measurement, the threshold, and the source (e.g. EXIF field, Cloudinary add-on response).
- **Weight display:** a discreet "contribution" column (mono, `+12`) is available in an "Explain score" toggle — this is the forensic breakdown.
- **Tone:** the verdict is stated in words. The numeral is a measurement, not a reward. Never animate the number counting up in the inspector; a single 400ms bar draw is the maximum.

---

## 11. Impact Claims

**Confidence ≠ Coverage.** Two distinct visual languages so users never conflate them:

| | Evidence Confidence | Impact Evidence Coverage |
|-|--------------------|-------------------------|
| Question | Can this **asset** be trusted? | How strongly does the **body of evidence** support this **claim**? |
| Unit | Trust score 0–100 | Coverage % of required evidence |
| Form | Thin horizontal bar + ring, **status colours** (green/amber/red) | **Segmented meter** (stacked bar of verified / flagged / gap), **sky/cyan colours** only |
| Where | Evidence Card, inspector | Impact Claim Card, story headers, reports |
| Type | Numerals, tabular | Display serif for the claim title |
| Surface | S2 | **S3-weight** even at rest (largest, most important object) |

### 11.1 Impact Claim Card

```text
┌────────────────────────────────────────────────────────────┐
│ CLAIM · CL-0007                     Jal Jeevan · JH-04     │  overline + mono
│                                                            │
│ Check dam restored                                         │  Display serif, 28–32
│                                                            │
│ EVIDENCE COVERAGE                                          │
│ 84%   ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬░░░░░ │  segmented meter
│       └── 17 verified ──────────────┘ 2 fl. ┘ 3 gaps ┘     │
│                                                            │
│  ● 17 verified assets   ◉ 2 flagged assets  ○ 3 evidence gaps │
│ ─────────────────────────────────────────────────────────  │
│ Structural restoration        ▮▮▮▮▮  STRONG               │
│ Water retention               ▮▮▮▮▮  STRONG               │
│ Vegetation improvement        ▮▮▮▯▯  MODERATE             │
│ ─────────────────────────────────────────────────────────  │
│ [thumb][thumb][thumb][thumb] +13    [Open evidence set]    │  citations
└────────────────────────────────────────────────────────────┘
```

- **Coverage meter segments:** verified = `sky-600` solid; flagged = `flagged-600` **hatched**; gap = `cloud-200` with **dashed outline** (visibly "empty slots"). Legend uses matching glyphs (`●`, `◉`, `○`).
- **Dimension strength:** 5-cell segmented indicator + text label (STRONG / MODERATE / WEAK / NONE). Cells are squares (`radius-xs`), not dots/stars. Strength colours: `sky-600` (strong), `sky-400` (moderate), `cloud-300` outlined (weak), empty (none).
- **Gaps are first-class:** each gap row is a clickable "what's missing" (e.g. "No post-monsoon photo, north bank") — honest coverage is the trust signal.
- **Hierarchy:** coverage % is the largest numeral on the card (Metric 32→48). The claim headline is display serif. Evidence thumbnails are S2 miniatures with status dots.

---

## 12. Before / After interface

An **analytical instrument**, not a social slider.

```text
┌───────────────────────────────────────────────────────────────────────┐
│ COMPARISON · Check dam JH-04 · north bank · same viewpoint (match 0.93)│
├──────────────────────┬─────────────────────┬──────────────────────────┤
│ BEFORE               │  CHANGE             │ AFTER                    │
│ 12 Jan 2026 · 10:02  │  +5 months, 3 days  │ 14 Jun 2026 · 09:41      │
│ EV-2026-000102       │  ▲ Water surface +38%│ EV-2026-000418           │
│ ✓ VERIFIED 91        │  ▲ Vegetation +22%  │ ✓ VERIFIED 94            │
│ 23.3438°N 85.3094°E  │  ▲ Structure: new   │ 23.3441°N 85.3096°E      │
├──────────────────────┴─────────────────────┴──────────────────────────┤
│ ┌───────────── synchronized viewport (zoom/pan linked) ─────────────┐ │
│ │  before ◀━━━━━━━━━━━━━━●━━━━━━━━━━━━━▶ after      [grid][overlay]│ │
│ └───────────────────────────────────────────────────────────────────┘ │
│ METHODOLOGY  Same-viewpoint match via feature alignment; change via   │
│ segmentation mask difference · model v2.3 · [View method] [Cite pair] │
└───────────────────────────────────────────────────────────────────────┘
```

- **Layout hierarchy is literal: BEFORE → CHANGE → AFTER.** The centre column is the visual weight: a `sky-50` well with tabular **delta metrics** (▲/▼ + value + unit). If no measurable change exists, the centre shows "No measurement — visual comparison only" (honest).
- **Slider:** `react-compare-slider`, styled: 2px `cloud-0` line with 1px `ink-900 @ 20%` outline, a 28px circular handle with `⇄` glyph, keyboard operable (`←/→` 2%, `Shift` 10%, `Home/End`). Labels ("BEFORE"/"AFTER") sit in opaque pills pinned top-left/top-right, with dates in mono.
- **Modes:** *Slider* (default), *Side-by-side* (synced zoom/pan), *Overlay/Difference* (opacity), *Swipe-fade*.
- **Sync:** pinch/scroll/drag pans both images together. A small "Aligned ✓ / Misaligned !" chip states match quality.
- **Every panel** carries date, location, project, evidence ID + status. Nothing is anonymous.
- **No glass over images** other than the two label pills (opaque). No decorative effects on the images; `Surface 2` frame only.

---

## 13. Timeline

A **horizontal (desktop) / vertical (mobile) timeline plane** with evidence "lifted" off it.

```text
JAN            APR                     JUN
 ●──────────────●───────────────────────●──────────►
 Baseline      Construction             Impact
 ┌────┐       ┌────┐ ┌────┐            ┌────┐ ┌────┐
 │img │       │img │ │img │            │img │ │img │   ← S2 cards, 6px above plane
 └────┘       └────┘ └────┘            └────┘ └────┘
   ⋮ thin 1px leader lines connect each card to its node
```

- **Plane:** a 1px `sky-300` line with tick marks; phase nodes are 12px rings (`sky-600`), filled if evidence exists, hollow if a **gap**. Between phases a subtle `sky-50` band shows duration.
- **Evidence nodes:** S2 mini cards (96–128px), status stripe, ID in mono; connected by a 1px leader; ground shadow (a soft elliptical shadow `rgb(20 40 70 / .10)` blurred 8px directly under the card on the plane) creates the "floating above the plane" reading.
- **Phase labels:** month in overline caps, phase name in `Section heading`.
- **Density:** > 6 items per phase collapse into a stacked "+N" cluster (S2 with 2 offset ghost cards behind, offset 4px, opacity .5 — evidence stack).
- **Filters** (verified only / flagged) mute non-matching nodes to 30% opacity — never remove them silently.

---

## 14. Map interface

Restrained geospatial instrument. Base tiles are **desaturated cool light** (or a custom MapLibre style using `cloud-50` land, `sky-100` water, `cloud-200` roads, no POI clutter). Fallback for no basemap: a stylised graticule on `cloud-50`.

| Element | Treatment |
|---------|-----------|
| **Project marker** | 14px square (`radius-xs`), `atmosphere-800`, white 2px stroke; label in overline caps |
| **Site marker** | 10px circle, `sky-600`, white 2px stroke |
| **Evidence cluster** | 32–48px circle, `surface` fill, `sky-600` 2px ring, count in tabular numerals; ring segments show verified/review/flagged proportion (thin, 3-part) |
| **Evidence point** | 8px, status-shaped (● verified, ◆ review, ▲ flagged) — shape + colour |
| **Geofence** | Polygon: 1.5px `sky-600` stroke, `sky-600 @ 6%` fill, 4-4 dash. Evidence outside = flagged shape with dotted leader to nearest boundary |
| **Selected evidence** | Marker grows to 14px, S3 halo, an S2 popover card (photo thumb + ID + status + trust) anchors above with a 6px caret |
| **Atmospheric overlay** | A very soft `radial-gradient` vignette at the map edges (`sky-100 @ 40%` → transparent, 80px), so the map feels seated in the environment. Pointer-events none. |
| **Controls** | Glass (§5) — layer toggles, legend, zoom; single glass layer |
| **Legend** | Shapes + labels + colour (non-colour-only) |

Rules: max 3 hues on the map; no gradients on markers; cluster animation ≤ 200ms; keyboard: markers focusable in tab order, `Enter` opens popover, `Esc` closes.

---

## 15. AI Search

A **premium command surface** whose intelligence is *explained*.

```text
┌───────────────────────────────────────────────────────────────┐   glass, radius-xl, elev-3
│ ⌕  Show verified evidence of the restored check dam near JH-04 │   16px, mono cue "⌘K"
└───────────────────────────────────────────────────────────────┘

INTERPRETED QUERY                              [Edit] [Reset]
┌─────────────┬──────────────────────────────────────────────────┐
│ Project     │ Jal Jeevan                                       │
│ Site        │ JH-04                                            │
│ Activity    │ Check Dam Restoration                            │
│ Period      │ Post-restoration                                 │
│ Trust       │ ≥ 80                                             │
└─────────────┴──────────────────────────────────────────────────┘
   each value is an editable chip (pill, sky-100); editing re-runs the search

12 RESULTS                                          sort: relevance ▾
┌──────────────┐ ┌──────────────┐
│ Evidence Card│ │ Evidence Card│
│  ...         │ │  ...         │
│ WHY THIS MATCHED                                                  │
│ [✓ Site JH-04] [✓ Activity match 0.91] [✓ Trust 94] [~ Period: inferred] │
└──────────────┘ └──────────────┘
```

- **Command bar:** the *only* place the "AI" surface is emphasised, via S4-glass, a `sky-600` 2px focus halo and a subtle top light. **No sparkles, no gradient text, no robot iconography.** Icon: `Search`.
- **Interpreted query (SearchPlan):** S1 panel, overline "INTERPRETED QUERY", a 2-column definition list; each value is an editable pill. **Inferred** values (not stated by the user) carry a dashed border + "inferred" tag so the system's assumptions are visible.
- **Why this matched (SearchResult):** chips per criterion with glyph (`✓` exact, `~` inferred/partial, `✕` unmet → listed as "did not match"). Each chip is a tooltip/disclosure with the underlying signal (e.g. "Activity classifier 0.91").
- **Empty/low-confidence:** "No verified evidence matches. Closest: …" with a relax-criteria affordance — never a blank grid.
- **Loading:** interpreted query appears first (~300ms), results stream after (transparency of stages).

---

## 16. Verification / provenance page — `/verify/[derivativeId]`

Public, forensic, calm. Layout is a **vertical lineage** with the graph as the hero. Signature experience.

```text
┌──────────────────────────────────────────────────────────────┐
│ PRAMAAN · VERIFICATION RECORD                  ✓ VERIFIED     │
│ Derivative D-8C41 traces to original EV-2026-000418           │
│ "Nothing was removed between the original and this output."   │
└──────────────────────────────────────────────────────────────┘

        ┌─ CAMPAIGN ASSET ───────────────┐   S2, 
        │ Poster · "Water returns" · 12 Aug 2026 │
        └───────────────┬────────────────┘
                        │  derived_from  (1px cyan-500 line, animated dash once)
        ┌─ DERIVATIVE ──▼────────────────┐
        │ 1080×1350 · crop + text overlay · D-8C41   │
        └───────────────┬────────────────┘
                        │  transformations
        ┌─ TRANSFORMATIONS ▼─────────────┐   listed inline as step chips:
        │ c_fill 4:5 → e_improve → l_text│   each chip: op · params · reversible?
        └───────────────┬────────────────┘
                        │  original preserved (hash match ✓)
        ┌─ ORIGINAL EVIDENCE ▼───────────┐   S3, largest node, full image
        │ EV-2026-000418 · sha256 a3f9…c81e  ✓ hash match │
        └─────┬───────────────────┬──────┘
              │                   │
   ┌─ CAPTURE METADATA ─┐  ┌─ AI ANALYSIS ──┐ ──▶ TRUST SCORE (instrument §10.2)
   │ device · EXIF · GPS│  │ signals · model │
   └────────────────────┘  └─────────────────┘
```

- **Lineage graph (VerificationLineage):** nodes are S2/S3 cards; edges are 1px `cyan-500` lines with 6px round joints and mid-edge labels in overline caps. Node emphasis by weight: **Original = S3 (largest)**, derivatives smaller S2. A vertical spine on the left (`sky-300`, 1px) and hash-match markers (`✓ sha256 identical`) on edges assert continuity.
- **"Nothing disappeared" panel:** a diff strip — *Original pixels retained: 100% · Metadata retained: yes · Transformations applied: 3 (all disclosed)*. If the derivative cropped content, show the crop rectangle drawn over the original (`sky-600` 2px, dimmed outside at 40%) so the viewer sees exactly what was omitted.
- **Trust posture:** a single sentence in display serif states the verdict; supporting numbers below. Verified state: green stripe on the header; not verified: amber/red banner with reason and **no** ambiguity.
- **Tone:** light canvas, `quiet` atmosphere, generous whitespace, all technical values in mono with copy buttons. Printable stylesheet (`@media print`: remove atmosphere/glass, keep borders, expand hashes).
- **Public safety:** no login chrome; a small "How verification works" link; a "Verify independently" section lists the hash and instructions to recompute.
- **Animations:** on load, edges draw top → bottom in 600ms total (stagger 80ms); never repeats; disabled for reduced-motion.

---

## 17. Ledger visualization

An **audit trail**, not a blockchain. No hexagons, no glowing chains, no coin/cube imagery. Think bank-statement + git-log.

```text
 ENTRY 001   2026-06-14T09:41:07Z   asset.captured   EV-2026-000418
 hash        a3f9c2…c81e
 prev        0000…0000  (genesis)                                  ✓ intact
    │
 ENTRY 002   2026-06-14T09:41:19Z   asset.verified   EV-2026-000418
 hash        7be1d0…04aa
 prev        a3f9c2…c81e                                           ✓ intact
    │
 ENTRY 003   …
```

- **Container:** S1 panel on `bg-tint`; entries are S0 rows separated by 1px `border-subtle`. A 1px vertical rail (`sky-300`) links entries with a 7px square node (`radius-xs`, not a circle — deliberately un-"blockchain").
- **Typography:** all mono. Column layout: `ENTRY nnn` (overline) · ISO-8601 UTC timestamp · event (`asset.verified`) · asset ID (link) · `hash` / `prev` blocks.
- **Hash linking:** the row's `prev` value is highlighted (`sky-100` bg) and, on hover/focus, the matching `hash` on the previous entry highlights too. Click scrolls to it. This makes tamper evidence *visible*.
- **Integrity:** per-row `✓ intact` (green glyph) / `✕ BROKEN CHAIN` (red, entire row tinted `flagged-100`, sticky banner). Overall header: "Chain integrity verified · 412 entries · last checked 09:41:22Z" with a "Re-verify" button.
- **Dark variant:** ledger works best on `atmosphere-900` in the verify page footer; keep contrast ≥ AA.

---

## 18. Navigation

Navigation **is** the workflow: the lifecycle bar. Not a sidebar with unrelated items.

```text
Overview · Capture · Import · Evidence · Review · Compare · Discover · Impact · Stories · Verify
   ◦         ①         ②        ③        ④        ⑤         ⑥        ⑦        ⑧       ⑨
```

- **Desktop (≥ 1024):** a **top glass bar** (56–64px, S0.5: glass + 1px bottom border) with the wordmark left; the 10 lifecycle items centred as text links; search (⌘K) and profile right. The current item has a 2px `sky-600` underline + `ink-900` text; others `ink-600`. Between lifecycle items, a hairline `›` separator in `ink-400` (hint of sequence), grouped visually: *Bring in* (Capture, Import) · *Understand* (Evidence, Review) · *Use* (Compare, Discover, Impact, Stories) · *Prove* (Verify). Group gaps 24px, item gaps 4px.
- **Laptop (1024–1279):** overline group labels hidden; items are icon + label (label 13px).
- **Tablet (768–1023):** items collapse to icons with labels on hover/focus; `Verify` and `Overview` remain labelled.
- **Mobile (< 768):** bottom tab bar (5: Overview, Capture, Evidence, Review, More) + a full-screen "More" sheet listing all lifecycle steps in order with descriptions. Top bar carries wordmark + search.
- **Lucide icons** (1.5px stroke, 18px): `LayoutDashboard, Camera, Upload, Images, ClipboardCheck, GitCompare, Search, Target, BookOpen, ShieldCheck`.
- **Routing:** Existing routes map 1:1 — `capture`, `import`, `review`, `compare`, `verify`, plus `Evidence`, `Discover`, `Impact`, `Stories` routes as they exist/are added. No route is removed.
- **Sub-navigation** lives inside pages as tabs (underline tabs), not in the global nav.

---

## 19. Hero / landing page

**"Evidence emerging through the clouds."** Editorial, cinematic, calm.

**Copy**
- Overline: `EVIDENCE AND IMPACT VERIFICATION`
- H1 (display serif): **Turn field media into verifiable impact.**
- Sub: *Pramaan transforms raw field photographs into searchable, traceable evidence and evidence-backed impact stories.*
- CTAs: **[Open the demo]** (primary) · **[See how verification works]** (secondary)

**Composition (desktop, 1440×900):**

```text
┌──────────────────────────────────────────────────────────────────────┐
│ nav (glass)                                                          │
│                                                                      │
│    EVIDENCE AND IMPACT VERIFICATION                    ┌─fragment─┐  │
│    Turn field media into                       ┌──────┐│ map + geo│  │
│    verifiable impact.                          │photo ││ fence    │  │
│    Pramaan transforms raw …                    │ ✓ 94 │└──────────┘  │
│    [Open the demo] [How it works]      ┌───┐ ╲ lineage lines        │
│                                        │B/A│  ╲───╌╌╌╌╌╌╌╌╌╌╌╌╌╌    │
│       ░░░░░░ cloud bank (blurred) ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└──────────────────────────────────────────────────────────────────────┘
```

- **Background:** the hero atmosphere (§3.3): deep atmosphere navy at the top resolving through `sky` mid-tones into cloud white at the bottom — the viewer descends *out* of the cloud layer into the light evidence workspace below.
- **Floating evidence cluster (right, 55% width):** 5–6 real (or seeded) S2 elements at different depths: a hero photo card with `✓ VERIFIED 94`; a before/after fragment (half-and-half image, split line); a small map tile with a dashed geofence and pin; a hash chip (`sha256 a3f9…c81e`); a trust-signal mini-list; a claim fragment (`Evidence coverage 84%`). Connected by **thin lineage lines** (1px, `cyan-500 @ 60%`, dotted) that pass *behind* nearer cards and *in front of* farther ones.
- **Depth:** 3 depth planes with `translate3d` parallax (near 1.0×, mid 0.6×, far 0.3× of pointer offset, max ±12px). Far cards are 6px-blurred and 60% opacity (blur applied to *those cards only*, never a full-viewport backdrop) to simulate atmospheric perspective.
- **Emergence:** on load, cards fade + translate up 16px from the cloud bank (staggered 90ms, 500ms each). Once. No looping animation except an optional ±4px 8s float on 2 cards (paused when tab hidden, off for reduced-motion).
- **Below the hero:** the scrollytelling lifecycle (Capture → … → Tell) — one lifecycle stage per viewport, on the *light* canvas (`ambient`), each with one S2 hero object. Existing GSAP scrollytelling is retained; only its surfaces/colours change.
- **Prohibited:** cartoon clouds, stock cloud PNGs, sparkles, gradient headline text.

---

## 20. Motion design

Motion communicates **floating, depth, discovery, verification, transition** — never spectacle.

| Kind | Duration | Easing | Use |
|------|----------|--------|-----|
| Micro-interaction | 150–200ms | `cubic-bezier(.2,0,0,1)` | hover, press, toggle, chip select, focus |
| Surface transition | 300–500ms | `cubic-bezier(.16,1,.3,1)` | card entrance, panel open, modal, page section reveal |
| Lineage draw | 500–800ms total | `cubic-bezier(.4,0,.2,1)` | verify graph edges (once) |
| Ambient drift | 8–14s | `ease-in-out` | hero cloud bank only; ±4px |

**Patterns**
- **Enter:** `opacity 0→1` + `translateY(8→0)`; surfaces also `scale(.98→1)`. Stagger lists 40–60ms, max 8 items animate (rest appear instantly).
- **Hover lift:** `translateY(-2px)` + shadow step, 180ms.
- **Modal:** scrim fade 250ms; panel `scale(.98→1)` + fade 320ms.
- **Verification moment:** when a status resolves to Verified, the pin fades in with a 250ms check-stroke draw. No confetti, sound or pulse.
- **Loading:** skeleton shimmer (1.6s, 40% intensity) or a 2px progress line at top of the surface. Spinners only for actions < 3s in buttons (16px).
- **Parallax:** hero only, ≤ 12px, pointer-driven, throttled to rAF; disabled on touch and reduced-motion.

**Prohibited:** bounce/spring overshoot, spinning icons, continuous background motion on data screens, page-transition wipes, parallax on scroll in tables/evidence views, animating box-shadow blur radii on many elements (animate `transform`/`opacity` only; pre-render shadow states).

**Reduced motion:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; scroll-behavior: auto !important; }
  .parallax, .drift { transform: none !important; }
}
```
(Aligned with the existing rule in `globals.css`.)

**Demo safety:** no motion may delay interactivity; entrances complete ≤ 500ms; content is interactive immediately.

---

## 21. Cloud metaphor rules — "Cloud, not cartoon"

**Allowed**

- Atmospheric gradients (≤ 3 stops, low chroma)
- Cloud-like *blurred* light fields and fog texture (≤ 5% opacity on data screens)
- Soft light and cool ambient shadows
- Floating cards and depth layering
- Translucent surfaces per §5 only
- Sky-inspired, desaturated colours
- Horizon fades (dark → light) in hero and section transitions
- Atmospheric perspective (distant elements softer/lighter)

**Prohibited**

- Cartoon cloud icons, ☁️ emoji, weather symbols
- Fluffy/vector cloud illustrations or stock cloud PNGs/JPGs
- Cloud-shaped cards, cloud-shaped buttons/badges
- Childish blue-to-white "sky" gradients (bright `#4facfe → #fff`)
- Bubbles, orbs, floating circles as decoration
- Playful/rounded display typography
- "Cloud" as branding text or in the logo (the concept is in the environment, not a mark)
- Cloud terms in UI copy ("in the cloud", "cloudy", etc.)
- More than one decorative atmospheric effect within a single viewport region

**Test:** Remove all of the above. If the product still feels like an evidence platform, the metaphor is correctly balanced. The atmosphere should be *felt* (depth, calm, light), rarely *seen*.

---

## 22. Responsive design

Breakpoints (Tailwind v4): `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`. **Primary: 1440 desktop.** Design *for* the task at each size — don't shrink.

| | Desktop ≥ 1280 | Laptop 1024–1279 | Tablet 768–1023 | Mobile < 768 |
|-|---|---|---|---|
| **Shell** | Top lifecycle bar, full labels | Icons + short labels | Icon nav; labels on focus | Bottom tabs + More sheet |
| **Evidence grid** | 4 cols (320) | 3 cols | 2 cols | 1 col (or 2-col compact grid toggle) |
| **Evidence inspector** | Two-pane: media (left, 60%) + tabs (Trust · Metadata · Lineage) right | Same, 55/45 | Media top, tabs below | **Full-screen sheet:** media pinned top (40vh, pinch-zoom), tabs scroll below; sticky action bar |
| **Before/After** | 3-column BEFORE·CHANGE·AFTER | same | Slider on top, deltas below as 2-col | Slider full width, deltas as accordion; side-by-side mode stacks vertically with synced pan |
| **Impact claim** | Wide card with dimension list at right | Stacked | Stacked | Coverage meter first, dimensions accordion |
| **Timeline** | Horizontal | Horizontal scroll | Horizontal scroll (snap) | **Vertical**, cards full width |
| **Map** | Map + right detail panel | Map + slide-over | Map + bottom sheet | Full-bleed map, bottom sheet (peek/half/full) |
| **Ledger** | Full columns | Hide `prev` col until expand | Row + expand | Card-per-entry, hashes truncated middle + expand |
| **Verify page** | Vertical lineage centred (max 880) | same | same | Same, nodes full width, transformations as list |
| **Search** | Command bar + plan + results | same | same | Bar sticky; plan collapsed to chips |
| **Atmosphere** | Full | Full | `ambient` | `quiet` (perf) |

**Rules:** touch targets ≥ 44×44 CSS px; mobile blur/glass reduced or removed; no hover-only affordances — everything reachable on tap/focus; image resolution served via Cloudinary `w_auto,dpr_auto,f_auto,q_auto`; safe-area insets on bottom bars.

---

## 23. Accessibility

Target: **WCAG 2.2 AA**, AAA where cheap for evidence text.

- **Contrast:** body text ≥ 4.5:1, large text/UI ≥ 3:1, verified against the *worst-case* atmosphere colour. `ink-500` (4.6:1) is the lightest permitted text on light surfaces; `ink-400` is disabled/placeholder only. Status fg tokens (`*-700`) are used for text; `*-600` for graphics (≥ 3:1).
- **Non-colour status:** every status = **icon shape + text label + pattern** (§9.1). Charts/meters use hatch and dashed outlines as second channel. Map uses shape (●/◆/▲).
- **Keyboard:** everything operable; logical tab order following the lifecycle; skip-link ("Skip to evidence"); roving tabindex in grids (arrow keys) with `Enter` = inspect, `Space` = select, `V` = verify (documented); `Esc` closes S4, returns focus to the trigger; slider `←/→`; `⌘/Ctrl+K` opens search.
- **Focus:** never removed. `:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; border-radius: inherit; }` plus a white 1px inner ring on dark surfaces. Focus ring ≥ 3:1 against adjacent colours.
- **Reduced motion / transparency / data:** `prefers-reduced-motion`, `prefers-reduced-transparency` (§5), `prefers-contrast: more` (increase border to `border-strong`, remove fog texture, drop shadows for 1px borders), and `forced-colors` (map to `Canvas/CanvasText`, keep borders, status glyphs remain).
- **Readable metadata:** min 12px; mono strings selectable; full hash reachable via button (not tooltip-only); timestamps show timezone; truncated values expose full text via `title` *and* an accessible expand.
- **Semantics:** `article` for cards with `aria-labelledby`; status as text in DOM (`<span class="sr-only">Status: verified, trust score 94 of 100</span>`); trust signals as a `<table>` or `role="list"`; ledger as `<ol>` with `aria-label`; lineage as an ordered list with a visually-rich SVG that is `aria-hidden` and a text equivalent; live regions (`aria-live="polite"`) for search results count and toasts.
- **Images:** every evidence image has `alt` = "{activity} at {site}, {date}" (never "image"); decorative atmosphere is CSS-only (`aria-hidden` by nature).
- **Targets:** ≥ 44px on touch, ≥ 24px on desktop (WCAG 2.5.8) with spacing.
- **Forms:** visible labels, errors in text + icon + `aria-describedby`.
- **Zoom:** layout intact at 200% and reflows at 400% (320 CSS px).

---

## 24. Component inventory

Legend: **Surface** = §4 level · **States** = R rest, H hover, A active, F focus-visible, S selected, D disabled, L loading, E error, X empty.

| Component | Visual role | Surface | States / notes |
|-----------|-------------|---------|----------------|
| **AppShell** | Page frame: `AtmosphericBackground`, lifecycle nav, content region (max 1360), toast region | S0 | Mode prop `hero/ambient/quiet`; skip-link; landmarks |
| **AtmosphericBackground** | Layers 0–3 (§3), fixed, non-interactive | — | Modes; static in `quiet`; drift only in `hero` |
| **FloatingSurface** | Base primitive: `level 0–4`, `glass?`, `radius`, `interactive?` | S0–S4 | R, H (if interactive), F, S; all cards compose this |
| **EvidenceCard** | Canonical evidence unit (§9) | S2 | R H F S L E; variants grid/compact/inspector/citation |
| **EvidenceGrid** | Responsive grid with roving tabindex, selection, multi-select bar | S0 | L (skeleton cards), X ("No evidence yet" + Capture/Import CTAs), E |
| **TrustScore** | Bar / ring / instrument forms (§10) | inherits | sizes `sm/md/lg`; status-coloured; threshold ticks |
| **TrustSignalList** | Grouped signal matrix (P/I/R/Q) | S1 | row states pass/review/fail; expandable; contribution toggle |
| **ImpactClaimCard** | Claim + coverage + dimensions + citations (§11) | S3-weight | R H F; L; E; "gap" click-through |
| **EvidenceCoverage** | Segmented coverage meter with legend | inherits | verified/flagged/gap segments; hatch/dash patterns |
| **Timeline** | Plane + phase nodes + lifted evidence (§13) | S0 + S2 | H F; gap nodes hollow; cluster stacks; V/H orientation |
| **MapEvidenceLayer** | Markers, clusters, geofence, selected popover (§14) | overlay | F on markers; cluster expand; geofence in/out |
| **BeforeAfterViewer** | Analytical comparison (§12) | S2 | slider/side-by-side/overlay modes; synced zoom; keyboard |
| **SearchCommandBar** | Glass command surface with ⌘K | S4-glass | R F (halo) L (progress line) X (suggestions) |
| **SearchPlan** | Interpreted query panel with editable pills | S1 | editable, inferred-dashed, reset |
| **SearchResult** | EvidenceCard + "Why this matched" chips | S2 | chip states exact/inferred/unmet |
| **VerificationLineage** | Lineage graph (§16) | S2/S3 nodes | node F/S; edge labels; hash-match; crop-diff overlay; print |
| **LedgerTimeline** | Audit trail (§17) | S1 | entry R H F; intact/broken; hash-link highlight |
| **StatusBadge** | Pill: icon + label (+ pattern) | pill | `verified/review/flagged/pending/processing`; sizes `sm/md`; never colour-only |
| **MetadataRow** | Label (overline) + value (mono where technical) + copy | S0 | truncate-middle, copy feedback (150ms ✓), full-value expand |
| **EvidenceCitation** | Inline citation chip: `[EV-…] ✓94` with hover S2 preview | pill/S2 | H F; links to inspector; broken-citation E |
| **StoryCard** | Editorial card: cover, title (display), claim summary, coverage, cited evidence | S2 | R H F; draft/published; L |
| **ReportPreview** | Paper-like page (S1 on `bg-well`), print-styled, citations footnoted | S1 | zoom; page nav; exports; **no glass** |
| **CampaignAssetCard** | Derivative card with lineage summary + "Verify" link + QR | S2 | verified/unverifiable; hash chip; F |
| **UploadSurface** | Dashed-border dropzone (S1) with progress rows | S1 | drag-over (`sky-50` + solid border), uploading (progress), error (per-file), done |
| **ReviewQueue** | Split list + inspector; queue rows compact evidence; keyboard triage (A approve / F flag / N next) | S1 + S3 | S; empty state "Queue clear ✓"; optimistic update; undo toast |
| **FilterBar** | Sticky glass bar of pill filters + search + view toggle | glass | R H A S D; active-count; clear all |
| **MetricCard** | Metric numeral + label + delta + optional sparkline (1px `sky-400`) | S1 | R H (if linked) L; delta ▲/▼ with text |
| **Toast** | Bottom-right, glass-permitted (short text), auto-dismiss 5s, pause on hover | S4-glass | success/info/warn/error with icon+label; `role="status"`; action + undo |
| **Modal** | Opaque S4 dialog, focus trap, scrim | S4 | open/close motion; `Esc`; size sm/md/lg; sheet on mobile |
| **Tooltip** | Small `atmosphere-900` bubble, 12px text, 8px offset, 300ms delay | S4 | F triggers too; never sole carrier of essential info |

---

## 25. Design tokens

### 25.1 CSS variables (drop-in)

```css
:root {
  /* ---- Palette ---- */
  --cloud-0:#FFFFFF; --cloud-25:#FAFCFE; --cloud-50:#F3F7FB; --cloud-100:#E9EFF6; --cloud-200:#D8E1EC;
  --sky-50:#EEF5FC; --sky-100:#DCEAF8; --sky-200:#BFD6F0; --sky-300:#93B8E3;
  --sky-400:#5E97D3; --sky-500:#3A7BBF; --sky-600:#235FA0; --sky-700:#1B4A80;
  --cyan-300:#8FD3DC; --cyan-500:#2F9DB0; --cyan-700:#1F6F80;
  --atmosphere-700:#1E3350; --atmosphere-800:#14243B; --atmosphere-900:#0C1A2E; --atmosphere-950:#08121F;
  --ink-900:#0F1B2B; --ink-800:#1D2B3D; --ink-700:#33475F; --ink-600:#4A5F78; --ink-500:#667B93; --ink-400:#93A3B6;
  --graphite:#2A3441;
  --verified-100:#E1F3EA; --verified-300:#9DD5B8; --verified-600:#16855A; --verified-700:#0F6B45;
  --review-100:#FBF0D9;   --review-300:#E8C27A;   --review-600:#B7791F;   --review-700:#8A5A00;
  --flagged-100:#FBE5E8;  --flagged-300:#EDA3AD;  --flagged-600:#C43D4E;  --flagged-700:#A32B3A;

  /* ---- Semantic ---- */
  --color-bg: var(--cloud-25);
  --color-bg-tint: var(--cloud-50);
  --color-bg-well: var(--cloud-100);
  --color-bg-inverse: var(--atmosphere-900);
  --color-surface: #FFFFFF;
  --color-surface-elevated: #FFFFFF;
  --color-surface-glass: rgb(255 255 255 / .72);
  --color-surface-selected: var(--sky-50);

  --color-text-primary: var(--ink-900);
  --color-text-secondary: var(--ink-700);
  --color-text-tertiary: var(--ink-600);
  --color-text-muted: var(--ink-500);
  --color-text-disabled: var(--ink-400);
  --color-text-inverse: #F3F7FB;

  --color-border: var(--cloud-200);
  --color-border-strong: #B9C7D8;
  --color-border-subtle: rgb(15 27 43 / .06);
  --color-border-inverse: rgb(255 255 255 / .14);

  --color-action: var(--sky-600);
  --color-action-hover: var(--sky-500);
  --color-action-pressed: var(--sky-700);
  --color-action-soft: var(--sky-100);
  --color-focus: #1B6FD1;
  --color-disabled-bg: var(--cloud-100);
  --color-disabled-fg: var(--ink-400);

  --color-verified: var(--verified-600);  --color-verified-fg: var(--verified-700);  --color-verified-bg: var(--verified-100);
  --color-review:   var(--review-600);    --color-review-fg:   var(--review-700);    --color-review-bg:   var(--review-100);
  --color-flagged:  var(--flagged-600);   --color-flagged-fg:  var(--flagged-700);   --color-flagged-bg:  var(--flagged-100);

  /* ---- Radius ---- */
  --radius-xs: 2px; --radius-sm: 6px; --radius-md: 10px; --radius-lg: 14px; --radius-xl: 20px; --radius-pill: 999px;

  /* ---- Elevation (cool, diffused) ---- */
  --shadow-color: 20 40 70;
  --shadow-xs: 0 1px 2px rgb(var(--shadow-color) / .06), 0 1px 1px rgb(var(--shadow-color) / .04);                         /* elevation-1 */
  --shadow-sm: var(--shadow-xs);
  --shadow-md: 0 1px 2px rgb(var(--shadow-color) / .06), 0 6px 16px -4px rgb(var(--shadow-color) / .10), 0 12px 28px -12px rgb(var(--shadow-color) / .10);   /* elevation-2 */
  --shadow-lg: 0 2px 4px rgb(var(--shadow-color) / .06), 0 12px 28px -6px rgb(var(--shadow-color) / .14), 0 24px 40px -18px rgb(var(--shadow-color) / .14);  /* elevation-3 */
  --shadow-xl: 0 4px 8px rgb(var(--shadow-color) / .08), 0 24px 48px -8px rgb(var(--shadow-color) / .22), 0 40px 80px -24px rgb(var(--shadow-color) / .20);  /* elevation-4 */
  --shadow-halo: 0 0 0 3px rgb(35 95 160 / .14);   /* S3 selection halo */

  /* ---- Blur ---- */
  --blur-sm: 8px; --blur-md: 16px; --blur-scrim: 2px;

  /* ---- Motion ---- */
  --ease-standard: cubic-bezier(.2,0,0,1);
  --ease-surface:  cubic-bezier(.16,1,.3,1);
  --dur-micro: 180ms; --dur-surface: 360ms; --dur-draw: 600ms;

  /* ---- Type ---- */
  --font-display: var(--font-newsreader), "Source Serif 4", Georgia, serif;
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-jetbrains), ui-monospace, "Cascadia Mono", Menlo, Consolas, monospace;

  /* ---- Layout ---- */
  --nav-h: 60px; --content-max: 1360px; --gutter: 24px;
  color-scheme: light;
}

[data-theme="dark"] {
  --color-bg: var(--atmosphere-950);  --color-bg-tint: var(--atmosphere-900);  --color-bg-well: var(--atmosphere-800);
  --color-surface: #12233A;  --color-surface-elevated: #172B47;  --color-surface-glass: rgb(20 36 59 / .72);  --color-surface-selected: rgb(94 151 211 / .16);
  --color-text-primary: #EEF4FB;  --color-text-secondary: #C3D0E0;  --color-text-tertiary: #A2B3C8;  --color-text-muted: #8DA0B8;
  --color-border: rgb(255 255 255 / .10);  --color-border-strong: rgb(255 255 255 / .20);
  --color-action: #5E97D3;  --color-action-hover: #7BAEE2;  --color-action-pressed: #93B8E3;
  --color-verified-fg: #8FDDB7;  --color-review-fg: #F0CB84;  --color-flagged-fg: #F4A9B2;
  --shadow-color: 0 0 0;  color-scheme: dark;
}
```

### 25.2 Tailwind v4 `@theme` mapping (`app/globals.css`)

```css
@theme {
  --font-display: var(--font-newsreader), "Source Serif 4", Georgia, serif;
  --font-sans:    var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-mono:    var(--font-jetbrains), ui-monospace, "Cascadia Mono", Menlo, Consolas, monospace;

  --color-cloud-0:#fff; --color-cloud-25:#FAFCFE; --color-cloud-50:#F3F7FB; --color-cloud-100:#E9EFF6; --color-cloud-200:#D8E1EC;
  --color-sky-50:#EEF5FC; --color-sky-100:#DCEAF8; --color-sky-200:#BFD6F0; --color-sky-300:#93B8E3;
  --color-sky-400:#5E97D3; --color-sky-500:#3A7BBF; --color-sky-600:#235FA0; --color-sky-700:#1B4A80;
  --color-atmosphere-900:#0C1A2E;
  --color-ink-900:#0F1B2B; --color-ink-700:#33475F; --color-ink-600:#4A5F78; --color-ink-500:#667B93; --color-ink-400:#93A3B6;
  --color-verified:#16855A; --color-review:#B7791F; --color-flagged:#C43D4E;

  --radius-xs:2px; --radius-sm:6px; --radius-md:10px; --radius-lg:14px; --radius-xl:20px;

  --shadow-elev-1: var(--shadow-sm);  --shadow-elev-2: var(--shadow-md);
  --shadow-elev-3: var(--shadow-lg);  --shadow-elev-4: var(--shadow-xl);
}
```
Usage: `bg-cloud-50 text-ink-900 rounded-lg shadow-elev-2`, `text-verified`, `font-display`.

### 25.3 Component classes (in `@layer components`, replacing the current `panel`/`btn-lime`/`chip*`)

```css
@layer components {
  .surface-1 { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); }
  .surface-2 { background: var(--color-surface-elevated); border: 1px solid var(--color-border); border-radius: var(--radius-lg);
               box-shadow: var(--shadow-md), inset 0 1px 0 rgb(255 255 255 / .9); transition: transform var(--dur-micro) var(--ease-standard), box-shadow var(--dur-micro) var(--ease-standard), border-color var(--dur-micro); }
  .surface-2:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); border-color: var(--sky-200); }
  .surface-3 { background: var(--color-surface-elevated); border: 1px solid var(--sky-300); border-radius: var(--radius-xl); box-shadow: var(--shadow-lg), var(--shadow-halo); }
  .surface-4 { background: var(--color-surface-elevated); border: 1px solid var(--color-border); border-radius: var(--radius-xl); box-shadow: var(--shadow-xl); }
  .btn-primary { @apply inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed; background: var(--color-action); }
  .btn-primary:hover { background: var(--color-action-hover); }
  .btn-primary:active { background: var(--color-action-pressed); }
  .btn-primary:disabled { background: var(--color-disabled-bg); color: var(--color-disabled-fg); }
  .btn-outline { @apply inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-sm font-medium; border: 1px solid var(--color-border-strong); color: var(--color-text-primary); }
  .btn-outline:hover { background: var(--sky-50); }
  .badge { @apply inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[.06em]; }
  .badge-verified { background: var(--color-verified-bg); color: var(--color-verified-fg); border: 1px solid var(--verified-300); }
  .badge-review   { background: var(--color-review-bg);   color: var(--color-review-fg);   border: 1px dashed var(--review-300); }
  .badge-flagged  { background: var(--color-flagged-bg);  color: var(--color-flagged-fg);  border: 1px double var(--flagged-300); }
  .mono-id { font-family: var(--font-mono); font-size: 12.5px; font-weight: 500; letter-spacing: .02em; font-variant-numeric: tabular-nums slashed-zero; }
  .hash    { font-family: var(--font-mono); font-size: 11.5px; background: var(--color-bg-well); border-radius: var(--radius-xs); padding: 1px 6px; }
  .field   { @apply w-full text-sm; background: #fff; border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm); padding: .5rem .75rem; }
  .field:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 1px; }
  :focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
}
```

---

## 26. Implementation guidance — migrating without a rewrite

**Constraints honoured:** all functionality kept; no new runtime dependencies (only two `next/font/google` faces — self-hosted, optional); Tailwind/CSS + existing components; shared tokens; accessibility and performance preserved.

**Current state (from the repo):** Tailwind v4 `@theme` in `app/globals.css`; dark-navy/lime language; utility classes `panel`, `panel-flat`, `chip*`, `btn-lime`, `btn-ghost`, `field`, `hairline-title`, `glow`; shared components in `components/` (`AppHeader`, `Brand`, `Logo`, `SiteFooter`, `story/`); routes in `app/(dashboard)/{capture,compare,import,prototype,review,verify}` + landing `app/page.tsx`; libs `gsap`, `react-compare-slider`, `lucide-react`, `clsx`, `tailwind-merge`.

### Phase 0 — Tokens (no visual change yet · ½ day)
1. Add §25.1 variables and §25.2 `@theme` block **alongside** existing tokens.
2. Add `data-theme="dark"` mapping so the current dark look is reproducible (`<html data-theme="dark">`) — the app keeps working while pages migrate.
3. Add legacy **aliases**: map old names to new (`--color-lime → --color-action`, `panel → surface-1`) so unmigrated code renders acceptably.

### Phase 1 — Shell and atmosphere (1 day)
4. Create `components/ui/AtmosphericBackground.tsx` (server component, CSS only) and mount it in `app/layout.tsx`; drive mode via `data-atmosphere` set per route group (`hero` for `/`, `quiet` for `(dashboard)` data routes).
5. Update `AppHeader` into the **lifecycle bar** (§18): same links, new grouping, glass with fallback. Keep route hrefs untouched.
6. Load fonts in `app/layout.tsx` with `next/font/google` (Newsreader, JetBrains Mono) beside Inter; expose CSS variables.

### Phase 2 — Primitives (1–2 days)
7. Add `components/ui/`: `FloatingSurface`, `StatusBadge`, `MetadataRow`, `TrustScore`, `TrustSignalList`, `EvidenceCoverage`, `Modal`, `Toast`, `Tooltip`. Use `clsx` + `tailwind-merge` (already installed) — no new packages.
8. Extract repeated markup: find every place that renders an evidence tile / status chip / hash / trust number (`review`, `verify`, `compare`, `capture`, `prototype`, `story/`) and replace with `EvidenceCard`, `StatusBadge`, `MetadataRow`. Keep props identical to the data already passed; the components are presentational.
9. Replace class usage by codemod-style search-and-replace: `panel → surface-1/2`, `chip-lime/chip-cyan → StatusBadge` (semantics decide), `btn-lime → btn-primary`, `btn-ghost → btn-outline`, `text-white → text-ink-900` (light theme). Do this per route, verifying each.

### Phase 3 — Route by route (in priority order for the demo)
| Order | Route | Key changes |
|-------|-------|-------------|
| 1 | `/verify/[derivativeId]` | `VerificationLineage`, TrustScore instrument, hashes in mono; `quiet` atmosphere; print CSS |
| 2 | `/review` | `ReviewQueue` split view, StatusBadge with icon+label+pattern, keyboard triage |
| 3 | `/compare` | `BeforeAfterViewer` around existing `react-compare-slider`; delta column; methodology |
| 4 | Evidence/Discover | `EvidenceGrid`, `SearchCommandBar`, `SearchPlan` (uses existing live interpreter output), "why matched" chips |
| 5 | Impact/Stories | `ImpactClaimCard`, `EvidenceCoverage`, `StoryCard`, `EvidenceCitation` |
| 6 | `/capture`, `/import` | `UploadSurface` restyle; progress and per-file states |
| 7 | Landing `/` | Hero composition (§19); retain GSAP scrollytelling, swap surfaces |
| 8 | Map, ledger, timeline | Restyle existing PostGIS/geofence and ledger views (§13, §14, §17) |

### Phase 4 — Retire legacy
10. When no imports/classes remain, delete `btn-lime`, `chip-lime`, `chip-cyan`, `glow`, `hairline-title` and the aliases. Grep for `lime|cyan|panel` before removal.

### Guardrails (do / don't)
- ✅ Reuse existing data flows, API routes, Supabase, Cloudinary calls — **this is a presentation-layer migration**.
- ✅ Keep `prefers-reduced-motion` rule; extend it (§20, §23).
- ✅ One `backdrop-filter` element per region; glass only on nav, filter bar, command bar, map controls, toasts.
- ✅ Serve images via existing Cloudinary transforms (`f_auto,q_auto,dpr_auto`); lazy-load below fold.
- ✅ Animate `transform`/`opacity` only; test scroll FPS on the review grid (≥ 100 cards) with atmosphere on.
- ✅ Add a tiny Storybook-like route (e.g. `/prototype/kit`, already-adjacent to the `prototype` route) rendering every component and state for visual QA — no new dependency.
- ❌ Don't put blur over large image regions. Don't make every component translucent. Don't add animation libraries (GSAP is already present; use CSS transitions first).
- ❌ Don't rewrite pages wholesale: swap presentational components, keep containers, hooks and data fetching.
- ❌ Don't ship a gradient on text, cloud illustrations, sparkles, or a second accent colour.

### Verification per phase
Typecheck (`npm run typecheck`), build (`npm run build`), manual keyboard pass, contrast check on `quiet` and `hero` modes, 200% zoom pass, reduced-motion pass, forced-colors sanity, and a **decoration-off screenshot** (disable atmosphere + shadows) to confirm the UI still reads.

---

## 27. Pramaan Visual Quality Gate

Before considering the redesign complete, verify:

- [ ] Does the UI feel professional enough for a government/NGO/donor audience?
- [ ] Does the cloud atmosphere remain subtle?
- [ ] Does the interface avoid looking childish?
- [ ] Are evidence cards visually elevated?
- [ ] Is verification immediately understandable?
- [ ] Can users distinguish verified/review/flagged evidence without relying only on color?
- [ ] Is Trust Score presented as an evidence instrument rather than gamification?
- [ ] Are Impact Claims visually distinct from individual evidence?
- [ ] Does Before/After feel analytical rather than decorative?
- [ ] Does the provenance page feel trustworthy and forensic?
- [ ] Does the UI demonstrate Cloudinary/media intelligence without looking like a Cloudinary demo? *(Lime, neon cyan and Cloudinary-hub styling are retired; media intelligence is shown through signals, transformations and lineage, not vendor branding.)*
- [ ] Does the entire application feel like one coherent product?
- [ ] Does the visual language reinforce "field media → evidence → impact"?
- [ ] Would the interface still look credible if all decorative effects were removed?
- [ ] Are the cloud effects enhancing hierarchy rather than distracting from it?

**Additional engineering gates**
- [ ] AA contrast passes on every text/surface pair in `quiet`, `ambient` and `hero` modes
- [ ] Keyboard-only run-through of Capture → Verify succeeds with visible focus at every step
- [ ] `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast` and `forced-colors` honoured
- [ ] No `backdrop-filter` over large image regions; ≤ 1 glass layer per region; opaque fallback verified
- [ ] Review grid scrolls at 60 fps with 100+ cards; hero paint < 1 ms/frame idle
- [ ] All existing routes and features work exactly as before

> **One-line test:** *If a viewer remembers the evidence, the verdict and the lineage — and only afterwards, if asked, remembers the sky — the design is right.*
