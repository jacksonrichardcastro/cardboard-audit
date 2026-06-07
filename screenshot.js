const { chromium, devices } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  
  const artifactDir = '/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b/artifacts';

  // Desktop screenshot
  const contextDesktop = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const pageDesktop = await contextDesktop.newPage();
  await pageDesktop.goto('http://localhost:3000/listings/180?created=1', { waitUntil: 'networkidle' });
  await pageDesktop.waitForTimeout(2000); // wait for animations and modal
  await pageDesktop.screenshot({ path: path.join(artifactDir, 'post-creation-modal-desktop.png') });
  await contextDesktop.close();

  // Mobile screenshot
  const iPhone = devices['iPhone 13 Pro'];
  const contextMobile = await browser.newContext({
    ...iPhone
  });
  const pageMobile = await contextMobile.newPage();
  await pageMobile.goto('http://localhost:3000/listings/180?created=1', { waitUntil: 'networkidle' });
  await pageMobile.waitForTimeout(2000); // wait for animations and modal
  await pageMobile.screenshot({ path: path.join(artifactDir, 'post-creation-modal-mobile.png') });
  await contextMobile.close();

  await browser.close();
})();
