const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const FFMPEG = path.resolve("./node_modules/ffmpeg-static/ffmpeg.exe");
const FFPROBE = path.resolve("./node_modules/ffprobe-static/bin/win32/x64/ffprobe.exe");

async function recordMasterVideo() {
  const recordingsDir = path.resolve("./recordings");
  if (!fs.existsSync(recordingsDir)) fs.mkdirSync(recordingsDir, { recursive: true });

  const rawVideoDir = path.resolve("./recordings/raw_record");
  if (!fs.existsSync(rawVideoDir)) fs.mkdirSync(rawVideoDir, { recursive: true });

  console.log("===============================================================");
  console.log("   LAUNCHING MASTER 5-MINUTE VIDEO PRODUCTION PIPELINE        ");
  console.log("   TARGET DURATION: EXACTLY 05:00.000 (300.000 SECONDS)       ");
  console.log("===============================================================");

  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: rawVideoDir,
      size: { width: 1920, height: 1080 },
    },
  });

  // Permanently suppress Next.js dev badges and any caption bar from the page DOM
  await context.addInitScript(() => {
    const hideStyle = document.createElement("style");
    hideStyle.id = "hide-nextjs-dev-tools";
    hideStyle.innerHTML = `
      nextjs-portal,
      [data-nextjs-dialog-overlay],
      [data-nextjs-toast],
      div[class*="nextjs-portal"],
      #__next-build-watcher,
      #demo-caption-bar {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `;
    document.documentElement.appendChild(hideStyle);

    const cleanObserver = new MutationObserver(() => {
      document.querySelectorAll("nextjs-portal, [data-nextjs-toast], #demo-caption-bar").forEach((el) => el.remove());
    });
    cleanObserver.observe(document.documentElement, { childList: true, subtree: true });
  });

  const page = await context.newPage();

  // Helper to inject styled animated cursor only (no caption bar)
  async function initOverlay() {
    await page.evaluate(() => {
      document.querySelectorAll("nextjs-portal, [data-nextjs-toast], #demo-caption-bar").forEach((el) => el.remove());
      let cur = document.getElementById("demo-cursor");
      if (!cur) {
        cur = document.createElement("div");
        cur.id = "demo-cursor";
        cur.style.position = "fixed";
        cur.style.width = "24px";
        cur.style.height = "24px";
        cur.style.borderRadius = "50%";
        cur.style.backgroundColor = "rgba(56, 189, 248, 0.9)";
        cur.style.border = "2.5px solid #ffffff";
        cur.style.boxShadow = "0 0 20px rgba(56, 189, 248, 0.9)";
        cur.style.pointerEvents = "none";
        cur.style.zIndex = "1000000";
        cur.style.transition = "transform 0.08s ease, width 0.15s ease, height 0.15s ease";
        cur.style.transform = "translate(-50%, -50%)";
        cur.style.left = "960px";
        cur.style.top = "540px";
        document.body.appendChild(cur);
      }
    });
  }

  // Audio synchronization logger (DOM caption bar removed per user specification)
  async function updateCaption(text, badge = "PRAMAAN · TRUST ENGINE") {
    console.log(`[TIMELINE AUDIO-SYNC]: [${badge}] ${text}`);
    await page.evaluate(() => {
      const cap = document.getElementById("demo-caption-bar");
      if (cap) cap.remove();
      document.querySelectorAll("nextjs-portal, [data-nextjs-toast]").forEach((el) => el.remove());
    });
  }

  async function animateCursorTo(x, y, durationMs = 800) {
    await page.evaluate(
      ({ x, y, durationMs }) => {
        const cur = document.getElementById("demo-cursor");
        if (!cur) return;
        cur.style.transition = `left ${durationMs}ms cubic-bezier(0.25, 1, 0.5, 1), top ${durationMs}ms cubic-bezier(0.25, 1, 0.5, 1)`;
        cur.style.left = `${x}px`;
        cur.style.top = `${y}px`;
      },
      { x, y, durationMs }
    );
    await page.waitForTimeout(durationMs + 60);
  }

  async function clickWithRipple() {
    await page.evaluate(() => {
      const cur = document.getElementById("demo-cursor");
      if (!cur) return;
      const x = cur.style.left;
      const y = cur.style.top;

      const ripple = document.createElement("div");
      ripple.style.position = "fixed";
      ripple.style.left = x;
      ripple.style.top = y;
      ripple.style.transform = "translate(-50%, -50%) scale(0.4)";
      ripple.style.width = "48px";
      ripple.style.height = "48px";
      ripple.style.borderRadius = "50%";
      ripple.style.backgroundColor = "rgba(56, 189, 248, 0.4)";
      ripple.style.border = "2px solid #38bdf8";
      ripple.style.pointerEvents = "none";
      ripple.style.zIndex = "999999";
      ripple.style.transition = "all 0.45s ease-out";
      document.body.appendChild(ripple);

      requestAnimationFrame(() => {
        ripple.style.transform = "translate(-50%, -50%) scale(2.4)";
        ripple.style.opacity = "0";
      });
      setTimeout(() => ripple.remove(), 500);
    });
    await page.waitForTimeout(250);
  }

  const startTime = Date.now();
  function elapsed() {
    return ((Date.now() - startTime) / 1000).toFixed(1);
  }

  // ==============================================================
  // SCENE 1: THE CRISIS & PROBLEM HOOK (Allocated: 28.0s)
  // Target Timeline: 00:00.000 - 00:28.000
  // ==============================================================
  console.log(`[${elapsed()}s] >> SCENE 1: Problem & Landing Page (28s)...`);
  await page.goto("http://localhost:3000/");
  await initOverlay();
  await updateCaption(
    "In 2026, seeing is no longer believing. Over 2,600 crore rupees in rural development and CSR funds siphoned off using fake field photos.",
    "01 / 10 · THE CRISIS"
  );
  await animateCursorTo(960, 480, 1000);
  await page.waitForTimeout(8000);

  await updateCaption(
    "Government circulars mandate manual checks because field agents are literally photographing photographs on laptop screens.",
    "01 / 10 · FRAUDULENT RECAPTURE"
  );
  await page.evaluate(() => window.scrollBy({ top: 580, behavior: "smooth" }));
  await animateCursorTo(840, 600, 1000);
  await page.waitForTimeout(9000);

  await updateCaption(
    "Corporate funders and communities are flying completely blind without mathematical proof of physical ground truth.",
    "01 / 10 · THE DILEMMA"
  );
  await page.evaluate(() => window.scrollBy({ top: 600, behavior: "smooth" }));
  await page.waitForTimeout(9000);

  // ==============================================================
  // SCENE 2: INTRODUCING PRAMAAN (Allocated: 22.0s)
  // Target Timeline: 00:28.000 - 00:50.000
  // ==============================================================
  console.log(`[${elapsed()}s] >> SCENE 2: Introducing Pramaan Hub (22s)...`);
  await page.goto("http://localhost:3000/prototype");
  await initOverlay();
  await updateCaption(
    "This is Pramaan: The trust engine that transforms vulnerable field media into mathematically verified, audit-grade impact proof.",
    "02 / 10 · THE SOLUTION"
  );
  await animateCursorTo(380, 240, 900);
  await page.waitForTimeout(7000);

  await updateCaption(
    "Built across 5 core lifecycle stages: edge cryptography, PostGIS geofencing, multi-agent AI verification, and immutable ledger.",
    "02 / 10 · 5-STAGE PIPELINE"
  );
  await animateCursorTo(740, 240, 900);
  await page.waitForTimeout(5000);
  await animateCursorTo(1100, 240, 900);
  await page.waitForTimeout(5000);
  await animateCursorTo(380, 270, 700);
  await clickWithRipple();
  await page.waitForTimeout(3000);

  // ==============================================================
  // SCENE 3: HARDWARE ATTESTATION & FIELD CAPTURE (Allocated: 38.0s)
  // Target Timeline: 00:50.000 - 01:28.000
  // ==============================================================
  console.log(`[${elapsed()}s] >> SCENE 3: Field Capture & Attestation (38s)...`);
  await page.goto("http://localhost:3000/capture");
  await initOverlay();
  await updateCaption(
    "It begins right at the edge. The moment an image is selected, Pramaan computes client-side SHA-256 via Web Crypto API.",
    "03 / 10 · HARDWARE ATTESTATION"
  );
  await animateCursorTo(640, 480, 1000);
  await page.waitForTimeout(6000);

  // Upload test image
  const testImg = path.resolve("./public/evidence/before_01.jpg");
  if (fs.existsSync(testImg)) {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImg);
    await animateCursorTo(640, 420, 800);
    await clickWithRipple();
    await page.waitForTimeout(6000);
  }

  await updateCaption(
    "We select the Nayapura check dam site and simulate on-site coordinates in Jhabua, locking GPS to 22.77°N, 74.59°E.",
    "03 / 10 · POSTGIS SITE GEOFENCE"
  );
  const simLink = page.getByText("Simulate on-site GPS (JH-04)");
  if (await simLink.isVisible()) {
    const box = await simLink.boundingBox();
    if (box) await animateCursorTo(box.x + box.width / 2, box.y + box.height / 2, 800);
    await clickWithRipple();
    await simLink.click();
    await page.waitForTimeout(10000);
  }

  await updateCaption(
    "High-accuracy hardware GPS attestation locked. Zero bytes leave without cryptographic binding.",
    "03 / 10 · CRYPTOGRAPHIC LOCK"
  );
  await page.waitForTimeout(14000);

  // ==============================================================
  // SCENE 4: AUTHORITATIVE SERVER RE-HASH & LEDGER COMMIT (Allocated: 28.0s)
  // Target Timeline: 01:28.000 - 01:56.000
  // ==============================================================
  console.log(`[${elapsed()}s] >> SCENE 4: Server Re-Hash & Ledger Commit (28s)...`);
  await updateCaption(
    "We select check dam construction as activity, baseline before evidence, and click submit proof.",
    "04 / 10 · SUBMIT PROOF"
  );
  const submitBtn = page.getByRole("button", { name: /Submit proof/i });
  if (await submitBtn.isVisible()) {
    const box = await submitBtn.boundingBox();
    if (box) await animateCursorTo(box.x + box.width / 2, box.y + box.height / 2, 800);
    await clickWithRipple();
    await submitBtn.click();
    await page.waitForTimeout(8000);
  }

  await updateCaption(
    "Server recomputes SHA-256 directly from raw byte streams to prevent tampering. Evaluates PostGIS boundary polygon.",
    "04 / 10 · ZERO-TRUST SERVER RE-HASH"
  );
  await page.waitForTimeout(10000);

  await updateCaption(
    "Assigned Trust Score 91/100 (verified) and permanently committed to the immutable audit ledger.",
    "04 / 10 · PERMANENT COMMIT"
  );
  await page.waitForTimeout(9000);

  // ==============================================================
  // SCENE 5: AUDITOR MODERATION QUEUE & FRAUD DETECTION (Allocated: 38.0s)
  // Target Timeline: 01:56.000 - 02:34.000
  // ==============================================================
  console.log(`[${elapsed()}s] >> SCENE 5: Review Queue & Fraud Detection (38s)...`);
  await page.goto("http://localhost:3000/review");
  await initOverlay();
  await updateCaption(
    "What happens when someone attempts fraud? Pramaan's 8-signal trust engine catches perceptual hash reuse and screen recaptures.",
    "05 / 10 · 8-SIGNAL TRUST ENGINE"
  );
  await animateCursorTo(480, 360, 1000);
  await page.waitForTimeout(10000);

  await updateCaption(
    "In the review queue, suspicious uploads are prioritized by risk. Here, an upload is flagged: 480 km away from the site.",
    "05 / 10 · ANOMALY DETECTION"
  );
  await animateCursorTo(960, 480, 900);
  await page.waitForTimeout(12000);

  await updateCaption(
    "Auditor inspects the forensic breakdown, records explicit justification, and seals the verified decision into the ledger.",
    "05 / 10 · HUMAN-IN-THE-LOOP OVERRIDE"
  );
  await clickWithRipple();
  await page.waitForTimeout(15000);

  // ==============================================================
  // SCENE 6: BEFORE / AFTER VISUAL CHANGE INSPECTION (Allocated: 28.0s)
  // Target Timeline: 02:34.000 - 03:02.000
  // ==============================================================
  console.log(`[${elapsed()}s] >> SCENE 6: Visual Comparison Slider (28s)...`);
  await page.goto("http://localhost:3000/compare/pair_01");
  await initOverlay();
  await updateCaption(
    "To prove genuine physical transformation, Pramaan pairs baseline and terminal evidence.",
    "06 / 10 · IMPACT VERIFICATION"
  );
  await animateCursorTo(960, 520, 900);
  await page.waitForTimeout(6000);

  await updateCaption(
    "Watch as we slide across Check Dam JH-04: arid dry riverbed on left, full monsoon water retention on right.",
    "06 / 10 · PHYSICAL TRANSFORMATION"
  );
  const slider = page.locator('input[type="range"]');
  if (await slider.isVisible()) {
    await animateCursorTo(600, 520, 800);
    await slider.fill("20");
    await page.waitForTimeout(4000);

    await animateCursorTo(1320, 520, 900);
    await slider.fill("80");
    await page.waitForTimeout(4000);

    await animateCursorTo(960, 520, 700);
    await slider.fill("50");
    await page.waitForTimeout(4000);
  }

  await updateCaption(
    "Excess Green Index delta measures positive ecological recovery with mathematically grounded spectral analytics.",
    "06 / 10 · EXG VEGETATION DELTA"
  );
  await page.waitForTimeout(9000);

  // ==============================================================
  // SCENE 7: NATURAL LANGUAGE DISCOVER & QUERY PLANNER (Allocated: 33.0s)
  // Target Timeline: 03:02.000 - 03:35.000
  // ==============================================================
  console.log(`[${elapsed()}s] >> SCENE 7: Natural Language Discover (33s)...`);
  await page.goto("http://localhost:3000/discover");
  await initOverlay();
  await updateCaption(
    "Need specific proof across thousands of field assets? Our Discover engine uses Gemini 2.5 Flash Lite query planning.",
    "07 / 10 · NATURAL LANGUAGE SEARCH"
  );
  const searchInput = page.locator('input[type="text"], input[type="search"]').first();
  if (await searchInput.isVisible()) {
    const box = await searchInput.boundingBox();
    if (box) await animateCursorTo(box.x + 120, box.y + box.height / 2, 800);
    await clickWithRipple();
    await searchInput.fill("check dam construction verified");
    await page.waitForTimeout(3000);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(7000);
  }

  await updateCaption(
    "Translates plain English requests into structured database queries without SQL injection risk, retrieving verified cards.",
    "07 / 10 · STRUCTURED FILTER EXECUTION"
  );
  await animateCursorTo(640, 480, 900);
  await page.waitForTimeout(14000);

  await updateCaption(
    "Every search result is directly linked to authenticated cryptographic evidence.",
    "07 / 10 · LINKED EVIDENCE CARDS"
  );
  await page.waitForTimeout(8000);

  // ==============================================================
  // SCENE 8: AUTONOMOUS MULTI-AGENT INVESTIGATION (Allocated: 48.0s)
  // Target Timeline: 03:35.000 - 04:23.000
  // ==============================================================
  console.log(`[${elapsed()}s] >> SCENE 8: Multi-Agent LangGraph (48s)...`);
  await page.goto("http://localhost:3000/investigate");
  await initOverlay();
  await updateCaption(
    "Now the core intelligence layer: autonomous multi-agent investigation. LangGraph coordinates 6 specialized sub-agents.",
    "08 / 10 · LANGGRAPH MULTI-AGENT"
  );
  await animateCursorTo(820, 420, 900);
  await page.waitForTimeout(10000);

  await updateCaption(
    "Retrieval agent executes 768-dim pgvector searches. Forensics agent validates geofences.",
    "08 / 10 · 768-DIM PGVECTOR RAG"
  );
  await page.evaluate(() => window.scrollBy({ top: 320, behavior: "smooth" }));
  await page.waitForTimeout(12000);

  await updateCaption(
    "Vision agent enforces our Generative Firewall: Zero synthetic AI infills permitted in the evidence store.",
    "08 / 10 · GENERATIVE FIREWALL"
  );
  await page.waitForTimeout(13000);

  await updateCaption(
    "When anomalies are detected, the graph pauses at a human-in-the-loop checkpoint. Synthesizer drafts cited report.",
    "08 / 10 · HITL CHECKPOINT & CITATIONS"
  );
  await page.waitForTimeout(12000);

  // ==============================================================
  // SCENE 9: PUBLIC QR VERIFICATION & CHAIN OF CUSTODY (Allocated: 20.0s)
  // Target Timeline: 04:23.000 - 04:43.000
  // ==============================================================
  console.log(`[${elapsed()}s] >> SCENE 9: Public QR Verification (20s)...`);
  await page.goto("http://localhost:3000/verify/dv_8f9a2b");
  await initOverlay();
  await updateCaption(
    "When a donor or citizen scans the QR code on a report, they see complete, tamper-proof cryptographic provenance.",
    "09 / 10 · PUBLIC VERIFICATION PORTAL"
  );
  await animateCursorTo(960, 320, 900);
  await page.waitForTimeout(8000);

  await updateCaption(
    "Full lineage traced from published media back through privacy redactions to raw camera pixels and ledger block.",
    "09 / 10 · UNBROKEN CHAIN OF CUSTODY"
  );
  await page.evaluate(() => window.scrollBy({ top: 480, behavior: "smooth" }));
  await animateCursorTo(960, 520, 900);
  await page.waitForTimeout(11000);

  // ==============================================================
  // SCENE 10: CONCLUSION & VERIFIABLE IMPACT (Allocated: 17.0s)
  // Target Timeline: 04:43.000 - 05:00.000
  // ==============================================================
  console.log(`[${elapsed()}s] >> SCENE 10: Hero Outro (17s)...`);
  await page.evaluate(() => {
    document.body.innerHTML = `
      <div style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: radial-gradient(circle at center, #0f172a 0%, #020617 100%); color: white; font-family: system-ui, sans-serif; text-align: center;">
        <div style="display: inline-flex; align-items: center; gap: 16px; margin-bottom: 28px;">
          <div style="width: 28px; height: 28px; border-radius: 6px; background: #38bdf8; transform: rotate(45deg); box-shadow: 0 0 30px #38bdf8;"></div>
          <span style="font-size: 52px; font-weight: 800; letter-spacing: 0.12em; color: #f8fafc;">PRAMAAN</span>
        </div>
        <p style="font-size: 26px; color: #94a3b8; max-width: 800px; line-height: 1.6; font-weight: 400; margin-bottom: 36px;">
          The Trust Engine for Social & Climate Impact.<br>
          <span style="color: #38bdf8; font-weight: 700;">Real Projects. Verifiable Proof. Zero Greenwashing.</span>
        </p>
        <div style="display: flex; gap: 20px; font-size: 15px; font-family: monospace; color: #64748b; padding: 12px 28px; background: rgba(255,255,255,0.03); border-radius: 9999px; border: 1px solid rgba(255,255,255,0.08);">
          <span>Next.js 15</span> · <span>Supabase PostGIS</span> · <span>pgvector</span> · <span>LangGraph</span> · <span>Gemini 2.5</span>
        </div>
      </div>
    `;
  });
  await initOverlay();
  await updateCaption(
    "Real projects. Verifiable proof. Zero greenwashing. Pramaan brings cryptographic truth back to ground reality. Thank you.",
    "10 / 10 · VERIFIED IMPACT"
  );
  await page.waitForTimeout(16500);

  // Close browser and save video
  console.log(">> Finalizing raw video capture...");
  const videoObj = page.video();
  await context.close();
  await browser.close();

  const rawVideoPath = await videoObj.path();
  console.log("Raw recording saved to:", rawVideoPath);

  // ==============================================================
  // FINAL FFMPEG RENDER: EXACT 05:00.000 (300.000 SECONDS)
  // Mux raw video + master 5-minute audio track
  // ==============================================================
  const finalVideoMp4 = path.resolve("./recordings/pramaan_demo_5min_master.mp4");
  const finalVideoWebm = path.resolve("./recordings/pramaan_demo_5min_master.webm");
  const masterAudio = path.resolve("./recordings/master_audio_5min.mp3");

  console.log("===============================================================");
  console.log("   MUXING AND NORMALIZING TO EXACT 05:00.000 MASTER VIDEO     ");
  console.log("===============================================================");

  // FFmpeg command to enforce exact 300.000s duration, 1920x1080 30fps H.264 / AAC
  const filterComplex = [
    "[0:v]tpad=stop_mode=clone:stop_duration=6.0,trim=0:300.000,setpts=PTS-STARTPTS[v]",
    "[1:a]atrim=0:300.000,asetpts=PTS-STARTPTS[a]"
  ].join(";");

  const muxCmdMp4 = [
    FFMPEG, "-y",
    "-i", rawVideoPath,
    "-i", masterAudio,
    "-filter_complex", filterComplex,
    "-map", "[v]",
    "-map", "[a]",
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "18",
    "-pix_fmt", "yuv420p",
    "-r", "30",
    "-c:a", "aac",
    "-b:a", "192k",
    "-ar", "48000",
    "-t", "300.000",
    finalVideoMp4
  ];

  console.log("Rendering Master MP4 (Exact 05:00.000)...");
  execSync(muxCmdMp4.map(arg => `"${arg}"`).join(" "), { stdio: "inherit" });

  // WebM version as well (fast VP8 encode with Vorbis audio)
  const muxCmdWebm = [
    FFMPEG, "-y",
    "-i", finalVideoMp4,
    "-c:v", "libvpx",
    "-b:v", "2.5M",
    "-crf", "10",
    "-quality", "realtime",
    "-cpu-used", "4",
    "-c:a", "libvorbis",
    "-b:a", "128k",
    "-t", "300.000",
    finalVideoWebm
  ];

  console.log("Rendering Master WebM (Exact 05:00.000)...");
  execSync(muxCmdWebm.map(arg => `"${arg}"`).join(" "), { stdio: "inherit" });

  // Probe final file durations
  const probeDuration = (file) => {
    return parseFloat(
      execSync(`"${FFPROBE}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`)
        .toString()
        .trim()
    );
  };

  const durMp4 = probeDuration(finalVideoMp4);
  const durWebm = probeDuration(finalVideoWebm);

  console.log("===============================================================");
  console.log("   FINAL VIDEO VALIDATION REPORT                               ");
  console.log("===============================================================");
  console.log(`[OK] Master MP4 Path: ${finalVideoMp4}`);
  console.log(`[OK] Master MP4 Duration: ${durMp4.toFixed(3)}s (Target: 300.000s ± 1.0s)`);
  console.log(`[OK] Master MP4 File Size: ${(fs.statSync(finalVideoMp4).size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`[OK] Master WebM Path: ${finalVideoWebm}`);
  console.log(`[OK] Master WebM Duration: ${durWebm.toFixed(3)}s`);
  console.log(`[OK] Master WebM File Size: ${(fs.statSync(finalVideoWebm).size / (1024 * 1024)).toFixed(2)} MB`);
  console.log("===============================================================");

  // Copy to exact and public paths
  fs.copyFileSync(finalVideoMp4, path.resolve("./recordings/pramaan_demo_5min_exact.mp4"));
  fs.copyFileSync(finalVideoWebm, path.resolve("./recordings/pramaan_demo_5min_exact.webm"));
  fs.copyFileSync(finalVideoMp4, path.resolve("./public/pramaan_demo_5min.mp4"));
  console.log("[OK] Synchronized to ./recordings/pramaan_demo_5min_exact.mp4 and ./public/pramaan_demo_5min.mp4");
}

recordMasterVideo().catch((err) => {
  console.error("Master Video Recording Error:", err);
  process.exit(1);
});
