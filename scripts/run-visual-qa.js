const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const outDir = path.resolve('./qa_screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const pagesToTest = [
  { name: 'landing', url: 'http://localhost:3000/' },
  { name: 'prototype', url: 'http://localhost:3000/prototype' },
  { name: 'capture', url: 'http://localhost:3000/capture' },
  { name: 'evidence', url: 'http://localhost:3000/evidence' },
  { name: 'review', url: 'http://localhost:3000/review' },
  { name: 'compare', url: 'http://localhost:3000/compare/pair_01' },
  { name: 'claims', url: 'http://localhost:3000/claims' },
  { name: 'verify', url: 'http://localhost:3000/verify/dv_8f9a2b' },
  { name: 'discover', url: 'http://localhost:3000/discover' },
  { name: 'investigate', url: 'http://localhost:3000/investigate' },
];

async function runVisualQA() {
  console.log('=== STARTING COMPREHENSIVE VISUAL QA AUDIT ===\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  const failedImageRequests = [];
  page.on('response', (response) => {
    const url = response.url();
    const status = response.status();
    // Only track image assets
    if (/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url) && status >= 400) {
      failedImageRequests.push({ url, status });
    }
  });

  const results = [];

  for (const p of pagesToTest) {
    console.log(`Checking ${p.name} (${p.url})...`);
    let success = false;
    let attempts = 0;

    while (!success && attempts < 3) {
      attempts++;
      try {
        await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(1500);

        // Audit DOM for images
        const imgAudit = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll('img'));
          const brokenImgs = [];
          const loadedImgs = [];

          imgs.forEach((img, idx) => {
            const isLoaded = img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
            const rect = img.getBoundingClientRect();
            const info = {
              index: idx,
              src: img.src,
              alt: img.alt,
              width: rect.width,
              height: rect.height,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              loaded: isLoaded
            };
            if (!isLoaded && rect.width > 0 && rect.height > 0) {
              brokenImgs.push(info);
            } else if (isLoaded) {
              loadedImgs.push(info);
            }
          });

          const previewUnavailable = Array.from(document.querySelectorAll('*'))
            .filter(el => el.textContent && el.textContent.includes('Preview unavailable'))
            .length;

          return {
            totalImgs: imgs.length,
            loadedCount: loadedImgs.length,
            brokenCount: brokenImgs.length,
            brokenImgs,
            previewUnavailableTextCount: previewUnavailable
          };
        });

        const shotPath = path.join(outDir, `${p.name}.png`);
        await page.screenshot({ path: shotPath, fullPage: false });

        const passed = imgAudit.brokenCount === 0 && imgAudit.previewUnavailableTextCount === 0;
        results.push({
          page: p.name,
          url: p.url,
          passed,
          totalImgs: imgAudit.totalImgs,
          loadedCount: imgAudit.loadedCount,
          brokenCount: imgAudit.brokenCount,
          brokenImgs: imgAudit.brokenImgs,
          previewUnavailable: imgAudit.previewUnavailableTextCount,
          screenshot: shotPath
        });

        console.log(`  -> Total images: ${imgAudit.totalImgs}, Loaded: ${imgAudit.loadedCount}, Broken: ${imgAudit.brokenCount}, Unavailable text: ${imgAudit.previewUnavailableTextCount}`);
        if (!passed) {
          console.error(`  [FAIL] Issues detected on ${p.name}:`, JSON.stringify(imgAudit.brokenImgs, null, 2));
        } else {
          console.log(`  [PASS] ${p.name} rendered cleanly.`);
        }
        success = true;
      } catch (err) {
        if (attempts >= 3) {
          console.error(`  [ERROR] Failed to test ${p.name} after ${attempts} attempts:`, err.message);
          results.push({ page: p.name, passed: false, error: err.message });
        } else {
          console.log(`  Retry ${attempts} for ${p.name}...`);
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }
  }

  await browser.close();

  console.log('\n=== VISUAL QA SUMMARY ===');
  const allPassed = results.every(r => r.passed);
  console.table(results.map(r => ({
    page: r.page,
    passed: r.passed ? 'PASS' : 'FAIL',
    images: `${r.loadedCount}/${r.totalImgs}`,
    broken: r.brokenCount,
    fallbackText: r.previewUnavailable
  })));

  if (failedImageRequests.length > 0) {
    console.error('\nBroken Image Requests:', failedImageRequests);
  } else {
    console.log('\nZERO failed image network requests!');
  }

  if (allPassed) {
    console.log('\n>>> ALL PAGES PASSED VISUAL QA WITH ZERO BROKEN IMAGES! <<<');
  } else {
    console.error('\n>>> SOME PAGES FAILED VISUAL QA! CHECK LOGS ABOVE! <<<');
    process.exit(1);
  }
}

runVisualQA();
