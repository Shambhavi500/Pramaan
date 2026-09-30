import Link from "next/link";
import { Children, type ReactNode } from "react";
import { ArrowRight, ArrowDown } from "lucide-react";
import { StoryNav } from "@/components/story/StoryNav";
import { StoryEffects } from "@/components/story/StoryEffects";
import { CloudHero } from "@/components/story/CloudHero";
import { HeroUrl } from "@/components/story/HeroUrl";
import { Scrolly } from "@/components/story/Scrolly";
import { Architecture } from "@/components/story/Architecture";
import { TrustLab } from "@/components/story/TrustLab";
import { FirewallLab } from "@/components/story/FirewallLab";
import { CapabilityMap } from "@/components/story/CapabilityMap";
import { SiteFooter } from "@/components/SiteFooter";
import {
  CaptureCard,
  SignCode,
  EvalGate,
  WebhookCode,
  AnalysisDerivative,
  VisionJson,
  ReviewCard,
  ReviewWrites,
  LedgerVisual,
  PairVisual,
  CompositeCode,
  ExgVisual,
  SearchPlan,
  StoryReport,
  PdfCode,
  VerifyMock,
} from "@/components/story/visuals";

function Chapter({ id, n, title, lead, children }: { id: string; n: string; title: string; lead?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-16 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5">
        <div data-reveal className="mb-12 max-w-3xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lime">{n}</p>
          <h2 className="hairline-title max-w-none text-3xl sm:text-4xl">{title}</h2>
          {lead && <p className="text-lg font-light leading-relaxed text-soft">{lead}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

const STATS = [
  { n: 8, s: "", l: "trust signals, each with a weight" },
  { n: 7, s: "", l: "named Cloudinary transformations" },
  { n: 0, s: "", l: "generated pixels in the evidence layer" },
  { n: 1, s: "", l: "hash chain behind every decision" },
];

const FACTS = [
  { big: "₹2,600 cr", text: "in fake wage claims uncovered in Rajasthan (Nov 2024 to Jun 2025) after geotagged photos became mandatory for MGNREGS work.", src: "The420.in, via our research notes" },
  { big: "Photos of photos", text: "By July 2025 the Ministry of Rural Development ordered manual checks, citing photographs of photographs and irrelevant images.", src: "MoRD circular, Jul 2025" },
  { big: "₹34,909 cr", text: "of CSR money was spent in FY 2023-24 across roughly 59,600 projects. Much of the evidence behind it lives in chat groups.", src: "National CSR Portal, via The CSR Journal" },
  { big: "Rule 8(3)", text: "Larger CSR projects need an independent impact assessment. Assessors need photos they can trust.", src: "Companies (CSR Policy) Rules, 2021 amendment" },
];

const LIES = [
  { lie: "It was taken somewhere else", check: "EXIF GPS is read at upload; PostGIS tests it against the site geofence.", cld: "eval gate · media_metadata" },
  { lie: "It is an old photo, reused", check: "A perceptual hash is compared bit by bit with every earlier photo.", cld: "phash" },
  { lie: "It is a photo of a screen", check: "AI Vision looks for moiré, bezels and pixel grids.", cld: "AI Vision" },
  { lie: "It was edited before upload", check: "The EXIF Software field is matched against editing apps.", cld: "eval gate" },
  { lie: "It shows someone who never agreed", check: "Faces are detected on upload and pixelated in every delivery until consent is on file.", cld: "faces · e_pixelate_faces" },
];

export default function StoryPage() {
  return (
    <div className="theme-dark min-h-screen">
      <StoryNav />
      <StoryEffects />

      {/* ---------- Hero ---------- */}
      <section className="glow relative overflow-hidden pt-32 pb-20 sm:pt-40">
        <CloudHero />
        <div className="relative mx-auto max-w-7xl px-5">
          <div data-hero className="max-w-4xl space-y-7 lg:max-w-[50%]">
            <span className="chip-lime">Code Cubicle 6.0 · Cloudinary challenge</span>
            <h1 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] font-normal leading-[1.02] tracking-[-0.025em]">Turn field media into verifiable impact.</h1>
            <p className="text-xl font-light text-soft sm:text-2xl">Pramaan (प्रमाण) · हर तस्वीर, एक प्रमाण · every photo, a proof</p>
            <p className="max-w-2xl text-lg font-light leading-relaxed text-white/85">
              An evidence pipeline for field media. Cloudinary inspects and transforms every photo, a database remembers it, and a hash-chained ledger makes any later edit visible.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#problem" className="btn-lime px-6 py-3">
                Scroll the story <ArrowDown className="h-4 w-4" aria-hidden />
              </a>
              <Link href="/prototype" className="btn-ghost px-6 py-3">
                Open the prototype <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div data-reveal className="mt-16 max-w-3xl">
            <HeroUrl />
          </div>

          <dl className="mt-16 grid grid-cols-2 gap-8 border-t border-white/10 pt-8 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.l}>
                <dt className="text-5xl font-light text-lime" data-count={s.n} data-suffix={s.s}>
                  {s.n}
                  {s.s}
                </dt>
                <dd className="mt-1 text-sm text-soft">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------- 01 Problem ---------- */}
      <Chapter id="problem" n="01 · The problem" title="A photo used to be proof. Then people learned to fake photos." lead="Governments and companies now ask for photos as evidence that work happened. The photos are easy to reuse, restage, re-photograph or edit, and nobody has time to check each one.">
        <div className="grid gap-4 md:grid-cols-2">
          {FACTS.map((f) => (
            <article key={f.big} data-reveal className="panel space-y-3 p-7">
              <p className="text-4xl font-light text-lime">{f.big}</p>
              <p className="font-light leading-relaxed text-white/85">{f.text}</p>
              <p className="text-xs text-muted">{f.src}</p>
            </article>
          ))}
        </div>

        <h3 data-reveal className="mb-6 mt-20 text-2xl font-light">
          Five ways a field photo lies, and what catches each one
        </h3>
        <div data-reveal className="grid gap-px overflow-hidden rounded-xl border border-line bg-line">
          {LIES.map((l) => (
            <div key={l.lie} className="grid gap-2 bg-ink p-5 md:grid-cols-[1.1fr_1.6fr_auto] md:items-center md:gap-8">
              <p className="text-lg font-normal">{l.lie}</p>
              <p className="text-sm font-light text-white/80">{l.check}</p>
              <span className="chip-cyan self-start normal-case tracking-normal">{l.cld}</span>
            </div>
          ))}
        </div>
      </Chapter>

      {/* ---------- 02 Pipeline ---------- */}
      <Chapter id="pipeline" n="02 · The pipeline" title="One photo, seven hand-offs" lead="Field staff and desk staff upload through the same signed path. Cloudinary does the inspecting. Our server turns what Cloudinary found into a score, and every decision is written down.">
        <div data-reveal>
          <Architecture />
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { t: "Cloudinary is the engine", d: "It stores and versions the photo, reads its metadata, hashes its pixels, finds faces, judges focus, runs AI Vision and delivers every derivative." },
            { t: "The database is the memory", d: "Supabase holds evidence, reviews, pairs and stories. PostGIS answers “was this inside the fence?” and Postgres compares pHashes bit by bit." },
            { t: "Claude only reads records", d: "It plans searches and drafts reports from verified rows. It never sees a photo as evidence and never decides a trust score." },
          ].map((c) => (
            <div key={c.t} data-reveal className="panel-flat p-6">
              <h3 className="mb-2 text-xl font-normal">{c.t}</h3>
              <p className="text-sm font-light leading-relaxed text-white/80">{c.d}</p>
            </div>
          ))}
        </div>
      </Chapter>

      {/* ---------- 03 Capture ---------- */}
      <Chapter id="capture" n="03 · Capture" title="Proof starts before the upload" lead="By the time a photo reaches Cloudinary it already carries a fingerprint, a place, a claim and a signature.">
        <Scrolly
          steps={[
            {
              kicker: "In the browser",
              title: "Fingerprint it, place it, label it",
              body: (
                <>
                  <p>The moment a photo is chosen, the browser hashes the bytes with SHA-256. If the file is swapped or edited later, that hash will not match.</p>
                  <p>The worker also says what the photo is for. An activity (check dam, saplings, school building…) and a phase (before, during, after) come from two dropdowns, so the claim is on record before any AI has a say.</p>
                </>
              ),
            },
            {
              kicker: "Signed upload",
              title: "The secret stays home, the bytes go direct",
              body: (
                <>
                  <p>The photo never passes through our server. It goes from the phone straight to Cloudinary, and our server only signs the request.</p>
                  <p>The signature covers the context string too, so the hash, activity and phase cannot be altered in flight. The signer refuses any preset other than ours and any folder outside <code className="font-mono text-sm text-soft">pramaan/</code>.</p>
                </>
              ),
            },
            {
              kicker: "Cloudinary intake gate",
              title: "A checkpoint inside the upload itself",
              body: (
                <>
                  <p>The upload preset asks Cloudinary for EXIF, a perceptual hash, faces and a focus score, then runs a small script before the asset is even stored.</p>
                  <p>The script turns raw metadata into tags a reviewer can filter on. No GPS, blurry, faces present, edited in a photo app: all flagged at the door, with nothing for us to poll or re-derive.</p>
                </>
              ),
            },
          ]}
          visuals={Children.toArray([CaptureCard, SignCode, EvalGate])}
        />
      </Chapter>

      {/* ---------- 04 Understand ---------- */}
      <Chapter id="understand" n="04 · Understand" title="Cloudinary looks at the photo" lead="When the upload finishes, Cloudinary calls our webhook. That call triggers the only expensive step: asking an AI model what is actually in the picture.">
        <Scrolly
          steps={[
            {
              kicker: "Webhook",
              title: "Trust the caller, or don't run",
              body: (
                <>
                  <p>Anyone can post to a public URL, so the first thing the endpoint does is verify Cloudinary&apos;s signature and reject anything older than two hours.</p>
                  <p>If analysis fails, the endpoint returns an error on purpose. Cloudinary treats that as a failed delivery and retries, so a photo is not silently dropped.</p>
                </>
              ),
            },
            {
              kicker: "A derivative for the model",
              title: "The AI sees a small copy, not the original",
              body: (
                <>
                  <p>A named transformation, <code className="font-mono text-sm text-soft">t_ev_analysis</code>, produces a 1024 px JPEG at good quality. The URL is versioned, so it points at exactly the bytes that were uploaded.</p>
                  <p>Smaller input means faster and cheaper analysis, and the original is never touched.</p>
                </>
              ),
            },
            {
              kicker: "AI Vision",
              title: "Ask a question, get a fixed shape back",
              body: (
                <>
                  <p>Cloudinary&apos;s AI Vision is prompted with the activity the worker <em>claimed</em> and a JSON schema. It answers with the activity it sees, whether that matches, whether people or minors appear, and any signs of a recaptured screen or synthetic image.</p>
                  <p>Because the shape is fixed, the trust engine can score it without parsing prose.</p>
                </>
              ),
            },
          ]}
          visuals={Children.toArray([WebhookCode, AnalysisDerivative, VisionJson])}
        />
      </Chapter>

      {/* ---------- 05 Trust ---------- */}
      <Chapter id="trust" n="05 · Trust" title="A score you can argue with" lead="Eight signals, each with a weight, combine into a number from 0 to 100. Nothing is hidden: change a signal below and watch the score and its caps respond. This calculator runs the same scoring module as the server.">
        <div data-reveal>
          <TrustLab />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="panel-flat p-6">
            <h3 className="mb-2 text-lg font-normal">Hard flags beat averages</h3>
            <p className="text-sm font-light text-white/80">A reused photo or a photographed screen caps the score at 40. One damning signal cannot be diluted by seven clean ones.</p>
          </div>
          <div className="panel-flat p-6">
            <h3 className="mb-2 text-lg font-normal">No hardware GPS, no auto-verify</h3>
            <p className="text-sm font-light text-white/80">Without EXIF GPS the score stops at 79. A person has to look, because browser-reported location is easy to fake.</p>
          </div>
          <div className="panel-flat p-6">
            <h3 className="mb-2 text-lg font-normal">The geofence is real geometry</h3>
            <p className="text-sm font-light text-white/80">Inside the site polygon scores 1.0, within 150 m scores 0.7, further scores 0. The check is a PostGIS function, not a guess.</p>
          </div>
        </div>
      </Chapter>

      {/* ---------- 06 Review ---------- */}
      <Chapter id="review" n="06 · Review and ledger" title="People decide the edge cases, and the record can't be quietly rewritten" lead="Anything flagged or borderline lands in a queue, worst first. Every decision is stored where it can be checked later.">
        <Scrolly
          steps={[
            {
              kicker: "The queue",
              title: "Worst first, with the reason on screen",
              body: (
                <>
                  <p>The reviewer sees the photo (faces pixelated unless consent is on file), the score, what the worker claimed, what the AI saw and exactly which signals fired.</p>
                  <p>V verifies, R rejects. Typing in the reason box never triggers a shortcut.</p>
                </>
              ),
            },
            {
              kicker: "One decision",
              title: "Four systems, kept in step",
              body: (
                <>
                  <p>A decision updates the evidence, records who decided and why, appends to the ledger and mirrors the outcome into Cloudinary&apos;s moderation status, so the media library and the database tell the same story.</p>
                  <p>The database is the source of truth. If Cloudinary is unreachable, the decision stands and the reviewer is warned.</p>
                </>
              ),
            },
            {
              kicker: "The ledger",
              title: "Edit one record and the chain says so",
              body: (
                <>
                  <p>Each ledger entry stores a hash of its payload and a hash that also covers the previous entry. Change any record and its hash no longer recomputes.</p>
                  <p>Try it: edit a record on the right. Your browser recomputes every hash with the same formula the server uses.</p>
                  <p className="text-sm text-muted">Honest limit: a database administrator could rewrite the whole chain. Publishing the latest hash somewhere outside the database is the natural next step.</p>
                </>
              ),
            },
          ]}
          visuals={Children.toArray([ReviewCard, ReviewWrites, LedgerVisual])}
        />
      </Chapter>

      {/* ---------- 07 Firewall ---------- */}
      <Chapter id="firewall" n="07 · The generative firewall" title="Cloudinary can invent pixels. Evidence must never contain them." lead="Generative fill, background removal and upscaling are useful for a social post and fatal for proof. Every transformation is classified, and the evidence layer refuses the generative ones.">
        <div data-reveal>
          <FirewallLab />
        </div>
      </Chapter>

      {/* ---------- 08 Compare ---------- */}
      <Chapter id="compare" n="08 · Change over time" title="Same place, two dates, one slider" lead="A funder does not want a score. They want to see that something changed.">
        <Scrolly
          steps={[
            {
              kicker: "The slider",
              title: "Drag across two verified photos",
              body: (
                <>
                  <p>The compare page loads a pair from the database, checks both photos are the same site, and serves each at 1200×900, cropped around the subject and converted to the best format for the browser.</p>
                  <p>If a pair ID is not found it shows the first available pair and says so.</p>
                </>
              ),
            },
            {
              kicker: "One-URL composite",
              title: "A shareable image with no editing step",
              body: (
                <>
                  <p>For a report or a post, Cloudinary layers the second photo beside the first and stamps BEFORE and AFTER on them, all inside a single delivery URL.</p>
                  <p>Nothing is generated and nothing is stored: the composite exists only as a recipe over the original photos.</p>
                </>
              ),
            },
            {
              kicker: "Measuring change",
              title: "A number only when there is one",
              body: (
                <>
                  <p>The pair table has room for a vegetation-index value per photo. When both are present the page shows the difference.</p>
                  <p>Calculating that index from pixels is designed but not built. Until it is, the page shows nothing rather than a made-up percentage.</p>
                </>
              ),
            },
          ]}
          visuals={Children.toArray([PairVisual, CompositeCode, ExgVisual])}
        />
      </Chapter>

      {/* ---------- 09 Discover ---------- */}
      <Chapter id="discover" n="09 · Discover and tell" title="Ask in plain words, hand over a report with receipts" lead="The APIs behind these steps exist in the repository; screens for them are the next thing to build.">
        <Scrolly
          steps={[
            {
              kicker: "Search",
              title: "Claude plans, the server checks, Cloudinary searches",
              body: (
                <>
                  <p>A sentence becomes a small structured plan. The server keeps only fields and values on an allowlist before building the Cloudinary Search expression, so the model can suggest a query but cannot inject one.</p>
                </>
              ),
            },
            {
              kicker: "Report",
              title: "No citation, no claim",
              body: (
                <>
                  <p>Story synthesis sends Claude only verified evidence and demands an evidence ID on every paragraph. Then the server checks the IDs itself, drops any that were invented and stores the share of paragraphs that are properly cited.</p>
                </>
              ),
            },
            {
              kicker: "Pack",
              title: "The photos travel with the report",
              body: (
                <>
                  <p>The same evidence is tagged and Cloudinary assembles it into a PDF. PDF delivery is switched off by default on free accounts, so it has to be enabled in the console first.</p>
                </>
              ),
            },
          ]}
          visuals={Children.toArray([SearchPlan, StoryReport, PdfCode])}
        />
      </Chapter>

      {/* ---------- 10 Verify ---------- */}
      <Chapter id="verify" n="10 · Verify" title="Scan it, and see how the image was made" lead="Anything published carries a short link, usually as a QR code. The page behind it shows what a skeptical reader needs.">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div data-reveal className="space-y-4 font-light leading-relaxed text-white/85">
            <p>The inspector shows the exact transformation recipe, its class (transcoded, redacted, edited or AI-generated), the fingerprint the phone computed, Cloudinary&apos;s storage ETag and the trust score.</p>
            <p>Two hashes taken by different parties, at different moments, are what make a swapped file detectable.</p>
            <Link href="/verify/dv_8f9a2b" className="btn-lime">
              Open a sample verification page <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <p className="text-xs text-muted">Needs the seed data and Supabase credentials.</p>
          </div>
          <div data-reveal>{VerifyMock}</div>
        </div>
      </Chapter>

      {/* ---------- 11 Map ---------- */}
      <Chapter id="map" n="11 · Cloudinary, feature by feature" title="Where each Cloudinary capability earns its place" lead="Every entry names the file that uses it. “In the code” means implemented in this repository; “Designed” means specified but not built.">
        <div data-reveal>
          <CapabilityMap />
        </div>
      </Chapter>

      {/* ---------- 12 Status ---------- */}
      <Chapter id="status" n="12 · Honest status" title="What is done, and what is not" lead="A prototype earns trust by saying where it stops.">
        <div className="grid gap-4 md:grid-cols-3">
          <div data-reveal className="panel space-y-3 p-6">
            <span className="chip-lime">Built</span>
            <ul className="space-y-2 text-sm font-light text-white/85">
              <li>Signed capture and desk import</li>
              <li>Upload preset with eval gate and named transformations</li>
              <li>Webhook, AI Vision job, eight-signal trust engine</li>
              <li>PostGIS geofence and pHash reuse search</li>
              <li>Review queue with ledger and moderation sync</li>
              <li>Compare page, verify page, search and story APIs</li>
              <li>Generative firewall classifier</li>
            </ul>
          </div>
          <div data-reveal className="panel space-y-3 p-6">
            <span className="chip bg-warn text-lime-ink">Not yet proven</span>
            <ul className="space-y-2 text-sm font-light text-white/85">
              <li>It type-checks and builds, but has not yet run end to end against live Cloudinary, Supabase and Anthropic accounts</li>
              <li>Cloudinary moderation may need a different call than the one first tried; the code has a fallback</li>
              <li>The review screen has no login yet</li>
              <li>Demo images on this page come from Cloudinary&apos;s public sample cloud</li>
            </ul>
          </div>
          <div data-reveal className="panel space-y-3 p-6">
            <span className="chip-outline">Designed, not built</span>
            <ul className="space-y-2 text-sm font-light text-white/85">
              <li>Automatic before and after pairing</li>
              <li>Vegetation index from pixels</li>
              <li>Video transcripts and chapters</li>
              <li>C2PA content credentials</li>
              <li>Embedding search (the column exists)</li>
              <li>Screens for search and story writing</li>
            </ul>
          </div>
        </div>

        <div data-reveal className="mt-20 flex flex-col items-start gap-6 rounded-2xl border border-line-bright/60 bg-gradient-to-br from-panel-2 to-navy p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div className="max-w-xl space-y-2">
            <h2 className="text-3xl font-light sm:text-4xl">Ready to see it run?</h2>
            <p className="font-light text-soft">Five working screens: capture, import, review, compare and verify.</p>
          </div>
          <Link href="/prototype" className="btn-lime px-7 py-3.5 text-base">
            Open the prototype <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </Chapter>

      <SiteFooter />
    </div>
  );
}
