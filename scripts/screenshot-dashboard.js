const puppeteer = require('puppeteer-core');
const os = require('os');

async function main() {
  const browser = await puppeteer.launch({
    executablePath: os.platform() === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined,
    headless: "new"
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024, deviceScaleFactor: 2 });
  const url = "https://card-bound-qk9z9mspd-jacksonrichardcastros-projects.vercel.app";
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  await page.screenshot({ path: 'dashboard-live.png', fullPage: true });
  console.log("Screenshot saved to dashboard-live.png");
  await browser.close();
}

main().catch(console.error);
