const puppeteer = require('puppeteer-core');
const fs = require('fs');
const os = require('os');

async function main() {
  const browser = await puppeteer.launch({
    executablePath: os.platform() === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined,
    headless: "new"
  });
  const page = await browser.newPage();
  const url = "https://card-bound-eej0txqm0-jacksonrichardcastros-projects.vercel.app";
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  const styles = await page.evaluate(() => {
    const rootDiv = document.querySelector('main > div');
    const body = document.body;
    
    return {
      rootDiv: {
        bgImage: window.getComputedStyle(rootDiv).backgroundImage,
        bgColor: window.getComputedStyle(rootDiv).backgroundColor,
      },
      body: {
        bgImage: window.getComputedStyle(body).backgroundImage,
        bgColor: window.getComputedStyle(body).backgroundColor,
      }
    };
  });
  
  console.log(JSON.stringify(styles, null, 2));
  await browser.close();
}

main().catch(console.error);
