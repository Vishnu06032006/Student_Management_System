// Screenshots the hand-built architecture.html (a real layered reference-
// architecture layout, not an auto-laid-out graph) at high resolution.
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARCH_DIR = path.join(__dirname, '..', '..', 'docs', 'architecture');
const PNG_PATH = path.join(ARCH_DIR, 'system_architecture.png');
const HTML_PATH = path.join(ARCH_DIR, 'architecture.html');

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1560, height: 1200 }, deviceScaleFactor: 2 });
  await page.goto('file://' + HTML_PATH.replace(/\\/g, '/'));
  await page.waitForTimeout(150);

  const canvas = await page.$('#canvas');
  await canvas.screenshot({ path: PNG_PATH });
  console.log('Saved', PNG_PATH);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
