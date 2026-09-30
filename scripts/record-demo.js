const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

async function recordPramaanDemo() {
  const recordingsDir = path.resolve("./recordings");
  if (!fs.existsSync(recordingsDir)) fs.mkdirSync(recordingsDir, { recursive: true });

  console.log("==================================================");
  console.log("   LAUNCHING PRAMAAN DEMO RECORDER (1920x1080)   ");
  console.log("==================================================");

  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: recordingsDir,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  // Helper to inject styled captions and animated cursor
  async function initOverlay() {
    await page.evaluate(() => {
      // Remove any prior cursor
      const oldCur = document.getElementById("demo-cursor");
      if (oldCur) oldCur.remove();

      const cur = document.createElement("div");
      cur.id = "demo-cursor";
      cur.style.position = "fixed";
      cur.style.width = "22px";
      cur.style.height = "22px";
      cur.style.borderRadius = "50%";
      cur.style.backgroundColor = "rgba(56, 189, 248, 0.9)";
      cur.style.border = "2px solid #ffffff";
      cur.style.boxShadow = "0 0 16px rgba(56, 189, 248, 0.8)";
      cur.style.pointerEvents = "none";
      cur.style.zIndex = "1000000";
      cur.style.transition = "transform 0.08s ease, width 0.15s ease, height 0.15s ease";
      cur.style.transform = "translate(-50%, -50%)";
      cur.style.left = "960px";
      cur.style.top = "540px";
      document.body.appendChild(cur);
    });
  }

  async function updateCaption(text, badge = "PRAMAAN · TRUST ENGINE") {
    await page.evaluate(
      ({ text, badge }) => {
        let el = document.getElementById("demo-caption-bar");
        if (!el) {
          el = document.createElement("div");
          el.id = "demo-caption-bar";
          el.style.position = "fixed";
          el.style.bottom = "28px";
          el.style.left = "50%";
          el.style.transform = "translateX(-50%)";
          el.style.zIndex = "999999";
          el.style.backgroundColor = "rgba(10, 18, 30, 0.92)";
          el.style.backdropFilter = "blur(14px)";
          el.style.border = "1px solid rgba(56, 189, 248, 0.35)";
          el.style.borderRadius = "9999px";
          el.style.padding = "10px 28px";
          el.style.boxShadow = "0 16px 40px rgba(0, 0, 0, 0.7)";
          el.style.fontFamily = "system-ui, -apple-system, sans-serif";
          el.style.textAlign = "center";
          el.style.maxWidth = "880px";
          el.style.transition = "all 0.3s ease";
          document.body.appendChild(el);
        }
        el.innerHTML = `
        <div style="font-size: 12px; font-weight: 700; color: #38bdf8; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 2px;">${badge}</div>
        <div style="font-size: 16px; font-weight: 500; color: #f8fafc; line-height: 1.4;">${text}</div>
      `;
      },
      { text, badge }
    );
  }

  async function animateCursorTo(x, y, durationMs = 700) {
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
    await page.waitForTimeout(durationMs + 50);
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
      ripple.style.transform = "translate(-50%, -50%) scale(0.5)";
      ripple.style.width = "40px";
      ripple.style.height = "40px";
      ripple.style.borderRadius = "50%";
      ripple.style.backgroundColor = "rgba(56, 189, 248, 0.4)";
      ripple.style.border = "2px solid #38bdf8";
      ripple.style.pointerEvents = "none";
      ripple.style.zIndex = "999999";
      ripple.style.transition = "all 0.4s ease-out";
      document.body.appendChild(ripple);

      requestAnimationFrame(() => {
        ripple.style.transform = "translate(-50%, -50%) scale(2.2)";
        ripple.style.opacity = "0";
      });
      setTimeout(() => ripple.remove(), 450);
    });
    await page.waitForTimeout(200);
  }

  // ==========================================
  // SCENE 1: THE CRISIS & LANDING PAGE (00:00 - 00:30)
  // ==========================================
  console.log(">> SCENE 1: Problem & Landing Page...");
  await page.goto("http://localhost:3000/");
  await initOverlay();
  await updateCaption(
    "In 2026, seeing is no longer believing. ₹2,600 Cr in fake field photos uncovered in rural welfare and CSR programs.",
    "01 · THE CRISIS"
  );
  await animateCursorTo(960, 480, 800);
  await page.waitForTimeout(3000);

  await updateCaption(
    "Government circulars mandate physical audits: workers photograph laptop screens, recycling old project pictures.",
    "01 · PHOTOGRAPHS OF PHOTOGRAPHS"
  );
  await page.evaluate(() => window.scrollBy({ top: 600, behavior: "smooth" }));
  await animateCursorTo(820, 620, 900);
  await page.waitForTimeout(4000);

  await updateCaption(
    "Introducing Pramaan: The Trust Engine transforming vulnerable media into audit-grade, mathematically verified proof.",
    "02 · THE SOLUTION"
  );
  await page.evaluate(() => window.scrollBy({ top: 800, behavior: "smooth" }));
  await page.waitForTimeout(3500);

  // ==========================================
  // SCENE 2: PROTOTYPE OVERVIEW HUB (00:30 - 00:55)
  // ==========================================
  console.log(">> SCENE 2: Prototype Overview Hub...");
  await page.goto("http://localhost:3000/prototype");
  await initOverlay();
  await updateCaption(
    "Central Prototype Hub: From field capture and computer vision to multi-agent investigation and public verification.",
    "03 · COMPLETE LIFECYCLE"
  );
  await animateCursorTo(380, 240, 800);
  await page.waitForTimeout(2500);

  await animateCursorTo(740, 240, 700); // Stage 2
  await page.waitForTimeout(1500);
  await animateCursorTo(1100, 240, 700); // Stage 3
  await page.waitForTimeout(1500);

  await updateCaption(
    "Let's follow a real field photo through the 5-stage cryptographic pipeline. Starting with live edge capture.",
    "03 · LIVE WORKFLOW START"
  );
  await animateCursorTo(380, 270, 600);
  await clickWithRipple();

  // ==========================================
  // SCENE 3: EVIDENCE INTAKE & GEOFENCING (00:55 - 01:50)
  // ==========================================
  console.log(">> SCENE 3: Evidence Capture & Attestation...");
  await page.goto("http://localhost:3000/capture");
  await initOverlay();
  await updateCaption(
    "Field Capture: Instant client-side SHA-256 hash computed via Web Crypto API before bytes leave the device.",
    "04 · HARDWARE ATTESTATION"
  );
  await animateCursorTo(640, 480, 800);
  await page.waitForTimeout(2000);

  // Upload real photo
  const testImg = path.resolve("./pitch/screenshots/trust_clean.png");
  if (fs.existsSync(testImg)) {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImg);
    await animateCursorTo(640, 420, 600);
    await clickWithRipple();
    await page.waitForTimeout(2500);
  }

  await updateCaption(
    "Simulating Nayapura on-site coordinates. Evaluated with PostGIS polygon geometry against Check Dam JH-04.",
    "04 · POSTGIS GEOFENCING"
  );
  const simLink = page.getByText("Simulate on-site GPS (JH-04)");
  if (await simLink.isVisible()) {
    const box = await simLink.boundingBox();
    if (box) await animateCursorTo(box.x + box.width / 2, box.y + box.height / 2, 700);
    await clickWithRipple();
    await simLink.click();
    await page.waitForTimeout(2000);
  }

  await updateCaption(
    "Submitting proof: Authoritative server re-hash prevents tampering, scoring 91/100 verified into the ledger.",
    "04 · CRYPTOGRAPHIC COMMIT"
  );
  const submitBtn = page.getByRole("button", { name: /Submit proof/i });
  if (await submitBtn.isVisible()) {
    const box = await submitBtn.boundingBox();
    if (box) await animateCursorTo(box.x + box.width / 2, box.y + box.height / 2, 600);
    await clickWithRipple();
    await submitBtn.click();
    await page.waitForTimeout(4500);
  }

  // ==========================================
  // SCENE 4: AUDITOR REVIEW QUEUE (01:50 - 02:35)
  // ==========================================
  console.log(">> SCENE 4: Auditor Review Queue...");
  await page.goto("http://localhost:3000/review");
  await initOverlay();
  await updateCaption(
    "Auditor Moderation Queue: 8-signal trust engine flags out-of-geofence uploads, pHash reuse, and recapture fraud.",
    "05 · FRAUD DETECTION"
  );
  await animateCursorTo(480, 360, 800);
  await page.waitForTimeout(3000);

  await updateCaption(
    "Auditor inspects forensic breakdown, enters verification rationale, and permanently commits the override.",
    "05 · HUMAN-IN-THE-LOOP"
  );
  await animateCursorTo(960, 480, 700);
  await clickWithRipple();
  await page.waitForTimeout(3000);

  // ==========================================
  // SCENE 5: BEFORE / AFTER COMPARISON (02:35 - 03:05)
  // ==========================================
  console.log(">> SCENE 5: Visual Compare Slider...");
  await page.goto("http://localhost:3000/compare/pair_01");
  await initOverlay();
  await updateCaption(
    "Comparing Check Dam JH-04: Arid riverbed baseline vs full monsoon water retention with ExG vegetation delta.",
    "06 · IMPACT VERIFICATION"
  );
  await animateCursorTo(960, 520, 800);
  await page.waitForTimeout(1500);

  const slider = page.locator('input[type="range"]');
  if (await slider.isVisible()) {
    await animateCursorTo(600, 520, 600);
    await slider.fill("20");
    await page.waitForTimeout(1200);

    await animateCursorTo(1320, 520, 800);
    await slider.fill("80");
    await page.waitForTimeout(1200);

    await animateCursorTo(960, 520, 600);
    await slider.fill("50");
    await page.waitForTimeout(2000);
  }

  // ==========================================
  // SCENE 6: NATURAL LANGUAGE DISCOVER (03:05 - 03:35)
  // ==========================================
  console.log(">> SCENE 6: Natural Language Discover...");
  await page.goto("http://localhost:3000/discover");
  await initOverlay();
  await updateCaption(
    "Natural Language Discover: Gemini 2.5 Flash Lite translates plain English queries into structured database filter plans.",
    "07 · AGENTIC RETRIEVAL"
  );
  const searchInput = page.locator('input[type="text"], input[type="search"]').first();
  if (await searchInput.isVisible()) {
    const box = await searchInput.boundingBox();
    if (box) await animateCursorTo(box.x + 120, box.y + box.height / 2, 700);
    await clickWithRipple();
    await searchInput.fill("check dam construction verified");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(4000);
  }

  // ==========================================
  // SCENE 7: MULTI-AGENT INVESTIGATION (03:35 - 04:20)
  // ==========================================
  console.log(">> SCENE 7: Multi-Agent LangGraph Investigation...");
  await page.goto("http://localhost:3000/investigate");
  await initOverlay();
  await updateCaption(
    "Autonomous Multi-Agent Investigation: LangGraph coordinates 6 specialized sub-agents with 768-dim pgvector RAG.",
    "08 · MULTI-AGENT SYSTEM"
  );
  await animateCursorTo(820, 420, 800);
  await page.waitForTimeout(3000);

  await updateCaption(
    "Vision Agent enforces the Generative Firewall: Zero synthetic AI infills permitted in the evidence store.",
    "08 · GENERATIVE FIREWALL"
  );
  await page.evaluate(() => window.scrollBy({ top: 350, behavior: "smooth" }));
  await page.waitForTimeout(3500);

  // ==========================================
  // SCENE 8: PUBLIC QR VERIFICATION (04:20 - 04:50)
  // ==========================================
  console.log(">> SCENE 8: Public QR Verification...");
  await page.goto("http://localhost:3000/verify/dv_8f9a2b");
  await initOverlay();
  await updateCaption(
    "Public Verification Portal: Scanned via QR on CSR reports. Full cryptographic chain of custody back to raw camera pixels.",
    "09 · CRYPTOGRAPHIC PROVENANCE"
  );
  await animateCursorTo(960, 320, 800);
  await page.waitForTimeout(2500);

  await page.evaluate(() => window.scrollBy({ top: 500, behavior: "smooth" }));
  await animateCursorTo(960, 520, 800);
  await page.waitForTimeout(3500);

  // ==========================================
  // SCENE 9: OUTRO & IMPACT (04:50 - 05:00)
  // ==========================================
  console.log(">> SCENE 9: Outro...");
  await page.evaluate(() => {
    document.body.innerHTML = `
      <div style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: radial-gradient(circle at center, #0f172a 0%, #020617 100%); color: white; font-family: system-ui, sans-serif; text-align: center;">
        <div style="display: inline-flex; align-items: center; gap: 12px; margin-bottom: 24px;">
          <div style="width: 20px; height: 20px; border-radius: 4px; background: #38bdf8; transform: rotate(45deg);"></div>
          <span style="font-size: 42px; font-weight: 800; letter-spacing: 0.1em; color: #f8fafc;">PRAMAAN</span>
        </div>
        <p style="font-size: 24px; color: #94a3b8; max-width: 720px; line-height: 1.5; font-weight: 400; margin-bottom: 32px;">
          The Trust Engine for Social & Climate Impact.<br>
          <span style="color: #38bdf8; font-weight: 600;">Real Projects. Verifiable Proof. Zero Greenwashing.</span>
        </p>
        <div style="display: flex; gap: 16px; font-size: 13px; font-family: monospace; color: #64748b;">
          <span>Next.js 15</span> · <span>Supabase PostGIS</span> · <span>pgvector</span> · <span>LangGraph</span> · <span>Gemini</span>
        </div>
      </div>
    `;
  });
  await initOverlay();
  await updateCaption("Pramaan · Bringing truth back to ground reality. Thank you.", "10 · VERIFIED IMPACT");
  await page.waitForTimeout(4000);

  // Finish video
  console.log(">> Finalizing recording...");
  const videoObj = page.video();
  await context.close();
  await browser.close();

  if (videoObj) {
    const rawVideoPath = await videoObj.path();
    const finalVideoPath = path.resolve("./recordings/pramaan_demo_5min.webm");
    if (fs.existsSync(rawVideoPath)) {
      fs.copyFileSync(rawVideoPath, finalVideoPath);
      console.log("==================================================");
      console.log(" ✓ VIDEO RECORDED SUCCESSFULLY!");
      console.log("   Path: " + finalVideoPath);
      console.log("   File Size: " + (fs.statSync(finalVideoPath).size / (1024 * 1024)).toFixed(2) + " MB");
      console.log("==================================================");
    }
  }
}

recordPramaanDemo().catch((err) => {
  console.error("Recording error:", err);
  process.exit(1);
});
