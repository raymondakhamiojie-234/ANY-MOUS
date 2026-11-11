import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const downloadDir = path.resolve(__dirname, "../tmp-downloads");

// Ensure clean download directory
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
} else {
  for (const file of fs.readdirSync(downloadDir)) {
    fs.unlinkSync(path.join(downloadDir, file));
  }
}

// Locate browser binary (Edge or Chrome)
const browserPaths = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

const executablePath = browserPaths.find((p) => fs.existsSync(p));
if (!executablePath) {
  console.error("No compatible browser (Edge or Chrome) found!");
  process.exit(1);
}

console.log(`Using browser executable: ${executablePath}`);

async function runBrowserTest() {
  console.log("Launching headless browser...");
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    defaultViewport: { width: 412, height: 915 }, // Mobile viewport (Pixel 7 / iPhone style)
  });

  try {
    const page = await browser.newPage();

    // Enable download tracking via CDP
    const client = await page.target().createCDPSession();
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: downloadDir,
    });

    console.log("1. Navigating to login page...");
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });

    console.log("2. Performing quick demo login as @alex...");
    // Find and click demo login button
    await page.waitForSelector("button::-p-text('Log in as @alex')");
    await page.click("button::-p-text('Log in as @alex')");

    // Wait for redirect to /dashboard
    await page.waitForNavigation({ waitUntil: "networkidle2" });
    console.log(`Current page URL: ${page.url()}`);
    if (!page.url().includes("/dashboard")) {
      throw new Error(`Expected URL to include /dashboard, got ${page.url()}`);
    }

    console.log("3. Locating inbox message cards on dashboard...");
    await page.waitForSelector("button::-p-text('Reply & Share Card →')");
    const replyButtons = await page.$$("button::-p-text('Reply & Share Card →')");
    console.log(`Found ${replyButtons.length} message card(s) ready for reply.`);

    console.log("4. Clicking 'Reply & Share Card →' on first message...");
    await replyButtons[0].click();

    console.log("5. Verifying 9:16 vertical story card modal opened...");
    await page.waitForSelector("#reply-story-card", { timeout: 5000 });

    const cardBox = await page.$eval("#reply-story-card", (el) => {
      const rect = el.getBoundingClientRect();
      return { width: rect.width, height: rect.height, ratio: rect.width / rect.height };
    });
    console.log(`9:16 Story Card Dimensions: ${cardBox.width.toFixed(1)}px x ${cardBox.height.toFixed(1)}px (aspect ratio ~ ${cardBox.ratio.toFixed(2)})`);

    console.log("6. Typing custom reply into textarea...");
    const textarea = await page.waitForSelector("textarea[placeholder='Type your public response here...']");
    await textarea.type("Haha 100% true! Thanks for asking ❤️ Check out my story!");

    // Verify text appears live in the card preview
    const previewReplyText = await page.$eval("#reply-story-card", (el) => el.innerText);
    if (!previewReplyText.includes("Haha 100% true!")) {
      throw new Error("Live preview failed: typed reply did not appear in the 9:16 card.");
    }
    console.log("Live preview verified inside 9:16 card.");

    console.log("7. Switching theme to Cyber Violet...");
    const themeBtn = await page.waitForSelector("button::-p-text('Cyber Violet')");
    await themeBtn.click();
    await new Promise((r) => setTimeout(r, 400));

    console.log("8. Clicking 'Download PNG' button...");
    const downloadBtn = await page.waitForSelector("button::-p-text('Download PNG')");
    await downloadBtn.click();

    console.log("9. Waiting for PNG file to be downloaded...");
    let downloadedFile = null;
    const startTime = Date.now();
    while (Date.now() - startTime < 15000) {
      const files = fs.readdirSync(downloadDir).filter((f) => !f.endsWith(".crdownload") && !f.endsWith(".tmp"));
      if (files.length > 0) {
        downloadedFile = path.join(downloadDir, files[0]);
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    if (!downloadedFile) {
      throw new Error("Download timed out: no PNG file appeared in download directory.");
    }

    const stats = fs.statSync(downloadedFile);
    console.log(`Downloaded file: ${path.basename(downloadedFile)} (${stats.size} bytes)`);

    if (stats.size < 5000) {
      throw new Error(`Downloaded file is suspiciously small: ${stats.size} bytes`);
    }

    // Verify PNG magic bytes: 0x89 0x50 0x4E 0x47 (‰PNG)
    const buffer = fs.readFileSync(downloadedFile);
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47;

    if (!isPng) {
      throw new Error("Downloaded file does not have valid PNG header magic bytes!");
    }
    console.log("✅ Verified valid PNG magic header bytes: 89 50 4E 47 (PNG)");

    console.log("\n=======================================================");
    console.log("🎉 BROWSER TEST PASSED: Reply & Share Card Download Flow");
    console.log("=======================================================\n");
  } finally {
    await browser.close();
  }
}

runBrowserTest().catch((err) => {
  console.error("Browser test failed:", err);
  process.exit(1);
});
