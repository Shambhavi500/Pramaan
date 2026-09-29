import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const INTAKE_EVAL_SCRIPT = `
var md = resource_info.media_metadata || {};
var keys = Object.keys(md);
var tags = ['pramaan', 'intake_v1'];

var hasGps = keys.some(function(k) { return /GPSLatitude/i.test(k); });
if (!hasGps) tags.push('no_gps');

var qa = resource_info.quality_analysis;
if (qa && typeof qa.focus === 'number' && qa.focus < 0.5) tags.push('blurry');
if (resource_info.faces && resource_info.faces.length > 0) tags.push('has_faces');
if (md.Software && /photoshop|snapseed|lightroom|canva|picsart|gimp/i.test(String(md.Software))) {
  tags.push('edited_software');
}

var existingTags = upload_options['tags'] ? String(upload_options['tags']).split(',') : [];
upload_options['tags'] = existingTags.concat(tags).join(',');

function clean(v) { return String(v).replace(/[|=]/g, ' ').slice(0, 200); }
var ctx = [];
var dto = md.DateTimeOriginal || md.CreateDate;
if (dto) ctx.push('exif_time=' + clean(dto));
if (md.Make || md.Model) ctx.push('device=' + clean((md.Make || '') + ' ' + (md.Model || '')));
if (md.Software) ctx.push('software=' + clean(md.Software));
if (resource_info.source_url) ctx.push('source_url=' + clean(resource_info.source_url));
if (resource_info.phash) ctx.push('phash=' + clean(resource_info.phash));

var existingCtx = upload_options['context'] ? String(upload_options['context']) : '';
upload_options['context'] = [existingCtx].concat(ctx).filter(Boolean).join('|');
`.trim();

async function setup() {
  console.log("Configuring Cloudinary Named Transformations...");
  const transformations = [
    { name: "t_ev_thumb", transform: "c_fill,g_auto,w_320,h_240" },
    { name: "t_ev_detail", transform: "c_fit,w_1600,h_1600" },
    { name: "t_ev_analysis", transform: "c_fit,w_1024,h_1024/f_jpg/q_auto:good" },
    { name: "t_public_safe", transform: "e_pixelate_faces:12/c_fit,w_1600,h_1600" },
    { name: "t_pair_half", transform: "c_fill,g_auto,w_800,h_600" },
    { name: "t_card_1x1", transform: "c_fill,g_auto,ar_1:1,w_1080" },
    { name: "t_card_9x16", transform: "c_fill,g_auto,ar_9:16,w_1080" },
  ];

  for (const t of transformations) {
    try {
      await cloudinary.api.create_transformation(t.name, t.transform);
      console.log(`✓ Transformation ${t.name} created.`);
    } catch (err) {
      const msg = (err as { error?: { message?: string } })?.error?.message ?? String(err);
      if (/already exists/i.test(msg)) console.log(`ℹ Transformation ${t.name} already exists.`);
      else console.error(`✗ Transformation ${t.name} failed: ${msg}`);
    }
  }

  console.log("\nConfiguring structured metadata fields (used by DAM sync + search)...");
  const fields = [
    { external_id: "activity", label: "Activity", type: "string" as const },
    { external_id: "trust_score", label: "Trust Score", type: "integer" as const },
  ];
  for (const f of fields) {
    try {
      await cloudinary.api.add_metadata_field(f);
      console.log(`✓ Metadata field ${f.external_id} created.`);
    } catch (err) {
      const msg = (err as { error?: { message?: string } })?.error?.message ?? String(err);
      if (/already|exist|duplicate/i.test(msg)) console.log(`ℹ Metadata field ${f.external_id} already exists.`);
      else console.error(`✗ Metadata field ${f.external_id} failed: ${msg}`);
    }
  }

  console.log("\nConfiguring Upload Presets with Intake eval Gate...");
  const notificationUrl = `${process.env.APP_BASE_URL || "https://pramaan.vercel.app"}/api/cloudinary/webhook`;
  const presetOptions = {
    unsigned: false,
    backup: true,
    media_metadata: true,
    phash: true,
    colors: true,
    faces: true,
    quality_analysis: true,
    allowed_formats: "jpg,jpeg,png,heic,webp",
    eval: INTAKE_EVAL_SCRIPT,
    notification_url: notificationUrl,
  };
  try {
    await cloudinary.api.create_upload_preset({ name: "pramaan_evidence", ...presetOptions });
    console.log("✓ Upload preset pramaan_evidence created.");
  } catch (err) {
    const msg = (err as { error?: { message?: string } })?.error?.message ?? String(err);
    if (/already exists/i.test(msg)) {
      await cloudinary.api.update_upload_preset("pramaan_evidence", presetOptions);
      console.log("✓ Upload preset pramaan_evidence already existed; updated in place.");
    } else {
      console.error(`✗ Upload preset failed: ${msg}`);
      process.exitCode = 1;
    }
  }

  console.log(`\nWebhook target: ${notificationUrl}`);
  console.log("Note: Cloudinary must be able to reach this URL (use a tunnel or the Vercel deployment).");
}

setup().catch((e) => {
  console.error(e);
  process.exit(1);
});
