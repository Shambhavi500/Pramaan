import { Code, Tags } from "@/components/story/Code";
import { LedgerDemo } from "@/components/story/LedgerDemo";
import { PairDemo } from "@/components/story/PairDemo";
import { Check, FileText, Database, ShieldCheck, ScrollText, QrCode } from "lucide-react";

const DEMO = "https://res.cloudinary.com/demo/image/upload";

/* ---------- Capture ---------- */

export const CaptureCard = (
  <div className="panel overflow-hidden">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={`${DEMO}/c_fill,g_auto,w_900,h_420/f_auto/q_auto/samples/landscapes/nature-mountains.jpg`} alt="Example field photo" className="h-52 w-full object-cover" />
    <div className="space-y-3 p-5 text-sm">
      <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 text-xs">
        <dt className="text-muted">SHA-256</dt>
        <dd className="truncate font-mono">e3b0c442…7852b855</dd>
        <dt className="text-muted">GPS</dt>
        <dd>24.2189°N, 73.4386°E (±12 m)</dd>
        <dt className="text-muted">Activity</dt>
        <dd>check_dam_construction</dd>
        <dt className="text-muted">Phase</dt>
        <dd>before</dd>
      </dl>
      <p className="text-[11px] text-muted">Example values. The real page computes the hash with crypto.subtle.digest.</p>
    </div>
  </div>
);

export const SignCode = (
  <div className="space-y-4">
    <Code title="app/(dashboard)/capture/page.tsx → POST /api/sign-upload">{`
const context = [
  "client_sha256=" + sha256,
  "activity=" + activity,
  "phase=" + phase,
  "gps_lat=…", "gps_lng=…", "gps_acc=…",
].join("|");

paramsToSign = {
  upload_preset: "pramaan_evidence",
  timestamp,
  folder: "pramaan/green-aravalli/GA-17",
  context,           // signed, so it can't be swapped later
};`}</Code>
    <Code title="app/api/sign-upload/route.ts">{`
// only these keys are ever signed
const ALLOWED = ["upload_preset","timestamp","folder",
                 "context","source","tags"];
// wrong preset, or folder outside pramaan/  →  400
signature = cloudinary.utils.api_sign_request(safeParams, API_SECRET);`}</Code>
  </div>
);

export const EvalGate = (
  <div className="space-y-4">
    <Code title="upload preset · eval (runs inside Cloudinary)">{`
var md = resource_info.media_metadata || {};
var hasGps = Object.keys(md).some(function (k) {
  return /GPSLatitude/i.test(k);
});
if (!hasGps) tags.push('no_gps');

if (qa && qa.focus < 0.5)        tags.push('blurry');
if (resource_info.faces.length)  tags.push('has_faces');
if (/photoshop|snapseed|canva|gimp/i.test(md.Software))
                                 tags.push('edited_software');

ctx.push('exif_time=' + md.DateTimeOriginal);
ctx.push('device='    + md.Make + ' ' + md.Model);
ctx.push('phash='     + resource_info.phash);`}</Code>
    <Tags items={["pramaan", "intake_v1", "no_gps", "blurry", "has_faces", "edited_software"]} />
  </div>
);

/* ---------- Understand ---------- */

export const WebhookCode = (
  <Code title="app/api/cloudinary/webhook/route.ts">{`
const ok = cloudinary.utils.verifyNotificationSignature(
  body, Number(timestamp), signature, 7200
);
if (!ok) return new Response("Invalid signature", { status: 401 });

try {
  await analyzeImageJob(payload);
} catch {
  // 500 makes Cloudinary retry the notification
  return new Response("Analysis failed", { status: 500 });
}`}</Code>
);

export const AnalysisDerivative = (
  <div className="panel overflow-hidden">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={`${DEMO}/c_fit,w_1024,h_1024/f_jpg/q_auto:good/samples/landscapes/nature-mountains.jpg`} alt="A 1024 pixel JPEG derivative, rendered live by Cloudinary" className="h-64 w-full object-cover" />
    <div className="space-y-2 p-5">
      <p className="font-mono text-[11px] text-soft">t_ev_analysis = c_fit,w_1024,h_1024 / f_jpg / q_auto:good</p>
      <p className="text-xs text-white/75">This exact URL is what gets sent to AI Vision. The original can be many megabytes; the model sees a small JPEG.</p>
    </div>
  </div>
);

export const VisionJson = (
  <div className="space-y-3">
    <Code title="jobs/analyze-image.ts · response shape (illustrative values)">{`
{
  "activity": "check_dam_construction",
  "activity_matches_claim": "yes",
  "people": { "present": false, "minors_likely": false },
  "recapture_suspected": false,
  "synthetic_suspected": false,
  "setting": "rural_field",
  "scene_summary": "Masonry check dam across a dry stream bed."
}`}</Code>
    <p className="text-xs text-muted">If AI Vision is unavailable, the job records “uncertain”, marks the result fallback: true and lets the trust score decide, instead of pretending it looked.</p>
  </div>
);

/* ---------- Review & ledger ---------- */

export const ReviewCard = (
  <div className="panel overflow-hidden">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={`${DEMO}/c_fill,w_900,h_380/f_auto/q_auto/samples/people/smiling-man.jpg`} alt="Example review card image" className="h-44 w-full object-cover" />
    <div className="space-y-3 p-5">
      <div className="flex items-center justify-between">
        <span className="chip bg-bad text-lime-ink">Flagged</span>
        <span className="text-2xl font-light text-bad">Trust 34 / 100</span>
      </div>
      <p className="rounded-lg border border-bad/40 bg-bad/10 p-3 text-xs">Moiré interference patterns or display bezel detected in photo.</p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <span className="btn-danger">Reject (R)</span>
        <span className="btn-lime">Verify (V)</span>
      </div>
    </div>
  </div>
);

const WRITES = [
  { icon: Database, t: "evidence.trust_status", d: "becomes verified or rejected" },
  { icon: FileText, t: "review row", d: "decision and the reviewer's reason" },
  { icon: ScrollText, t: "ledger entry", d: "human_review, chained to the last hash" },
  { icon: ShieldCheck, t: "Cloudinary moderation", d: "approved or rejected on the asset" },
];

export const ReviewWrites = (
  <div className="panel space-y-3 p-5">
    <p className="text-xs font-semibold uppercase tracking-wide text-muted">One keypress, four writes</p>
    {WRITES.map((w) => (
      <div key={w.t} className="flex items-start gap-3 rounded-lg border border-line bg-white/[0.03] p-3">
        <w.icon className="mt-0.5 h-5 w-5 shrink-0 text-lime" aria-hidden />
        <div>
          <p className="font-mono text-xs">{w.t}</p>
          <p className="text-xs text-soft">{w.d}</p>
        </div>
        <Check className="ml-auto mt-0.5 h-4 w-4 text-good" aria-hidden />
      </div>
    ))}
    <p className="text-[11px] text-muted">If the Cloudinary call fails, the decision is still saved and the reviewer sees a warning.</p>
  </div>
);

export const LedgerVisual = <LedgerDemo />;

/* ---------- Compare ---------- */

export const PairVisual = <PairDemo />;

export const CompositeCode = (
  <div className="space-y-4">
    <Code title="lib/url-builder.ts · buildCompositeUrl()">{`
cloudinary.url(beforePublicId, {
  transformation: [
    { raw_transformation: "t_pair_half" },
    { overlay: afterPublicId },            // second photo
    { raw_transformation: "t_pair_half" },
    { flags: "layer_apply", gravity: "north_west", x: 800 },
    { overlay: { text: "BEFORE", … } },
    { flags: "layer_apply", gravity: "north_west", x: 16, y: 16 },
    { overlay: { text: "AFTER", … } },
    { flags: "layer_apply", gravity: "north_west", x: 816, y: 16 },
    { fetch_format: "auto", quality: "auto" },
  ],
});`}</Code>
    <p className="text-xs text-muted">One URL, no image editing step, nothing stored. Change the two public IDs and you get a different composite.</p>
  </div>
);

export const ExgVisual = (
  <div className="panel space-y-3 p-5">
    <p className="text-xs font-semibold uppercase tracking-wide text-muted">pair table</p>
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="panel-flat p-3">
        <p className="text-xs text-muted">exg_before</p>
        <p className="font-mono">nullable</p>
      </div>
      <div className="panel-flat p-3">
        <p className="text-xs text-muted">exg_after</p>
        <p className="font-mono">nullable</p>
      </div>
    </div>
    <p className="text-xs text-soft">The compare page shows the vegetation-index change when both columns are filled. Computing ExG from pixels is designed, not built yet, so the page never invents a number.</p>
  </div>
);

/* ---------- Discover & tell ---------- */

export const SearchPlan = (
  <div className="space-y-4">
    <div className="panel-flat p-4 text-sm">
      <p className="text-xs text-muted">Someone types</p>
      <p className="font-normal">“check dams with trust above 80”</p>
    </div>
    <Code title="Claude returns a plan (validated with Zod)">{`
{ "filters": [
    { "field": "activity",    "op": "=",  "value": "check_dam_construction" },
    { "field": "trust_score", "op": ">=", "value": "80" } ],
  "explanation": "Check dam photos scoring 80 or more." }`}</Code>
    <Code title="app/api/search/route.ts → Cloudinary Search">{`
tags=pramaan
  AND metadata.activity=check_dam_construction
  AND metadata.trust_score>=80
// values are checked against an allowlist and /^\\d{1,3}$/
// before they touch the expression`}</Code>
  </div>
);

export const StoryReport = (
  <div className="panel space-y-4 p-5">
    <p className="text-xs font-semibold uppercase tracking-wide text-muted">Every paragraph carries its evidence</p>
    <div className="panel-flat space-y-2 p-4 text-sm">
      <p className="font-light">The Kotra check dam was completed and photographed at the same site before and after construction.</p>
      <div className="flex gap-2">
        <span className="chip-outline normal-case tracking-normal">ev_01J9Z6Q2</span>
        <span className="chip-outline normal-case tracking-normal">ev_01J9Z6Q3</span>
      </div>
    </div>
    <ul className="space-y-1.5 text-xs text-soft">
      <li>· Only verified evidence is sent to Claude.</li>
      <li>· Citations that are not in the bundle are removed by the server.</li>
      <li>· Citation coverage is stored with the story.</li>
    </ul>
  </div>
);

export const PdfCode = (
  <Code title="app/api/stories/route.ts">{`
const packTag = "pack_" + storyId;
await cloudinary.uploader.add_tag(packTag, publicIds);
await cloudinary.uploader.multi(packTag, {
  format: "pdf",
  async: true,
});
// evidence photos → one PDF, assembled by Cloudinary`}</Code>
);

/* ---------- Verify ---------- */

export const VerifyMock = (
  <div className="panel space-y-4 p-5">
    <div className="flex items-center gap-3">
      <QrCode className="h-9 w-9 text-lime" aria-hidden />
      <div>
        <p className="text-sm font-normal">/verify/dv_8f9a2b</p>
        <p className="text-xs text-muted">the URL inside the QR code</p>
      </div>
    </div>
    <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-xs">
      <dt className="text-muted">Recipe</dt>
      <dd className="font-mono">t_public_safe/f_auto/q_auto</dd>
      <dt className="text-muted">Class</dt>
      <dd>redacted</dd>
      <dt className="text-muted">Client SHA-256</dt>
      <dd className="font-mono">cf83ac13…ee92347</dd>
      <dt className="text-muted">Trust</dt>
      <dd className="text-good">91 / 100 VERIFIED</dd>
    </dl>
  </div>
);
