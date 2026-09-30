const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/capture');
  await page.waitForTimeout(1000);
  
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(path.resolve('./public/evidence/before_01.jpg'));
  await page.waitForTimeout(1500);

  const preview = page.locator('img[alt="Capture preview"]');
  const count = await preview.count();
  console.log('Preview element count:', count);
  if (count > 0) {
    const info = await preview.first().evaluate(img => ({
      complete: img.complete,
      width: img.naturalWidth,
      height: img.naturalHeight,
      src: img.src.slice(0, 30)
    }));
    console.log('Preview image info:', info);
  }
  await browser.close();
})();
