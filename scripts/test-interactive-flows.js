const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testInteractiveFlows() {
  console.log('Testing interactive flows and image rendering...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  const page = await context.newPage();

  // 1. Test /capture file selection and preview
  console.log('Testing /capture upload preview...');
  await page.goto('http://localhost:3000/capture', { waitUntil: 'domcontentloaded' });
  const sampleImagePath = path.resolve('./public/evidence/before_01.jpg');
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.setInputFiles(sampleImagePath);
    await page.waitForTimeout(1000);
    const previewImg = await page.$('img');
    const isLoaded = previewImg ? await previewImg.evaluate(img => img.complete && img.naturalWidth > 0) : false;
    console.log('Capture preview image loaded:', isLoaded ? 'YES [PASS]' : 'NO [FAIL]');
    await page.screenshot({ path: './qa_screenshots/capture_with_preview.png' });
  }

  // 2. Test /discover search with results
  console.log('Testing /discover search...');
  await page.goto('http://localhost:3000/discover', { waitUntil: 'domcontentloaded' });
  const searchInput = await page.$('input[type="text"], input[type="search"]');
  if (searchInput) {
    await searchInput.fill('check dam');
    await searchInput.press('Enter');
    await page.waitForTimeout(3000);
    const resultImgs = await page.$$eval('img', imgs => imgs.map(img => ({
      src: img.src,
      loaded: img.complete && img.naturalWidth > 0
    })));
    console.log(`Discover search results images: ${resultImgs.filter(i => i.loaded).length}/${resultImgs.length} loaded`);
    await page.screenshot({ path: './qa_screenshots/discover_results.png' });
  }

  // 3. Test /compare/pair_01 slider interaction
  console.log('Testing /compare slider...');
  await page.goto('http://localhost:3000/compare/pair_01', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const compareImgs = await page.$$eval('img', imgs => imgs.map(img => ({
    src: img.src,
    loaded: img.complete && img.naturalWidth > 0
  })));
  console.log(`Compare slider images: ${compareImgs.filter(i => i.loaded).length}/${compareImgs.length} loaded`);
  await page.screenshot({ path: './qa_screenshots/compare_slider.png' });

  // 4. Test /review item inspection
  console.log('Testing /review item...');
  await page.goto('http://localhost:3000/review', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const reviewImgs = await page.$$eval('img', imgs => imgs.map(img => ({
    src: img.src,
    loaded: img.complete && img.naturalWidth > 0
  })));
  console.log(`Review evidence images: ${reviewImgs.filter(i => i.loaded).length}/${reviewImgs.length} loaded`);
  await page.screenshot({ path: './qa_screenshots/review_item.png' });

  await browser.close();
  console.log('Interactive flow tests completed successfully!');
}

testInteractiveFlows();
