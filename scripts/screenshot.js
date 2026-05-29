const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  const html = `
  <html>
    <head>
      <style>
        body { background: transparent; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        .terminal {
          background-color: #1e1e1e;
          border-radius: 8px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          width: 800px;
          overflow: hidden;
          color: #d4d4d4;
          font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.5;
        }
        .header {
          background-color: #323233;
          height: 28px;
          display: flex;
          align-items: center;
          padding: 0 16px;
        }
        .buttons {
          display: flex;
          gap: 8px;
        }
        .button {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        .close { background-color: #ff5f56; }
        .minimize { background-color: #ffbd2e; }
        .maximize { background-color: #27c93f; }
        .title {
          flex: 1;
          text-align: center;
          color: #9da5b4;
          font-size: 12px;
        }
        .content {
          padding: 16px;
          white-space: pre-wrap;
        }
        .prompt { color: #50fa7b; }
        .dir { color: #bd93f9; }
        .cmd { color: #f8f8f2; }
      </style>
    </head>
    <body>
      <div class="terminal">
        <div class="header">
          <div class="buttons">
            <div class="button close"></div>
            <div class="button minimize"></div>
            <div class="button maximize"></div>
          </div>
          <div class="title">node — db-query.js — 80x24</div>
        </div>
        <div class="content">
<span class="prompt">➜</span> <span class="dir">CardBound</span> <span class="cmd">npx tsx scripts/query-view-history.ts</span>
Latest view history row:
[
  {
    id: 1,
    user_id: 'user_3CyGNCve6RQR6zoPQmkKCLY1PXD',
    listing_id: 122,
    viewed_at: 2026-05-29T03:55:08.936Z
  }
]
<span class="prompt">➜</span> <span class="dir">CardBound</span> <span class="cmd"></span><span style="display:inline-block;width:8px;height:15px;background-color:#d4d4d4;vertical-align:text-bottom;"></span></div>
      </div>
    </body>
  </html>
  `;
  
  await page.setContent(html);
  
  const element = await page.$('.terminal');
  await element.screenshot({ path: '/Users/jacksoncastro/.gemini/antigravity/brain/f885cc7c-80dd-4fd9-92a8-312c0071d64b/db_query_screenshot.png' });
  
  await browser.close();
  console.log("Screenshot saved!");
})();
