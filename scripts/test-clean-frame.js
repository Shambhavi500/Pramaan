const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  await context.addInitScript(() => {
    const hideStyle = document.createElement('style');
    hideStyle.innerHTML = 'nextjs-portal, [data-nextjs-dialog-overlay], [data-nextjs-toast], div[class*="nextjs-portal"], #__next-build-watcher, #demo-caption-bar { display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }';
    document.documentElement.appendChild(hideStyle);
    const cleanObserver = new MutationObserver(() => {
      document.querySelectorAll('nextjs-portal, [data-nextjs-toast], #demo-caption-bar').forEach(el => el.remove());
    });
    cleanObserver.observe(document.documentElement, { childList: true, subtree: true });
  });
  const page = await context.newPage();
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(2000);
  const portals = await page.locator('nextjs-portal').count();
  const toasts = await page.locator('[data-nextjs-toast]').count();
  const caption = await page.locator('#demo-caption-bar').count();
  console.log('portals in DOM:', portals, '| toasts in DOM:', toasts, '| caption in DOM:', caption);
  await page.screenshot({ path: './recordings/test_clean_screenshot.png' });
  console.log('Screenshot saved to recordings/test_clean_screenshot.png');
  await browser.close();
})();
