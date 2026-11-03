// Render an HTML page to a single full-page image (the LP's finished
// image).
//
// Engines, in order:
// 1. Headless Chromium through playwright-core. One-time setup in the
//    environment that runs the pipeline:
//      npm install
//      node node_modules/playwright-core/cli.js install chromium
//    The browser build must match the installed playwright-core
//    version; a mismatch surfaces as a launch error naming the build.
// 2. wkhtmltoimage (system package: apt install wkhtmltopdf), when the
//    Chromium route is unavailable.
// The layout CSS (page-layout.mjs) stays within block/float layout so
// both engines produce the same page. If neither engine is available
// this throws with the setups in the message; the caller records it
// as a hold rather than a silent pass.

import { execFile } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execFileP = promisify(execFile);

function resolveRoot(root, rel) {
  return path.isAbsolute(rel) ? rel : path.join(root, rel);
}

async function renderWithChromium({ root, htmlFile, outFile, width }) {
  let pw = null;
  let importError = null;
  for (const name of ["playwright-core", "playwright"]) {
    try {
      pw = await import(name);
      break;
    } catch (e) {
      importError = e;
    }
  }
  if (!pw) throw new Error(`playwright module not installed: ${importError ? importError.message : "not found"}`);
  const browser = await pw.chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 2 });
    await page.goto(`file://${resolveRoot(root, htmlFile)}`, { waitUntil: "networkidle" });
    await page.screenshot({ path: resolveRoot(root, outFile), fullPage: true, type: "png" });
  } finally {
    await browser.close();
  }
  return "chromium";
}

async function renderWithWkhtmltoimage({ root, htmlFile, outFile, width }) {
  await execFileP("wkhtmltoimage", [
    "--enable-local-file-access",
    "--width", String(width),
    "--quality", "95",
    resolveRoot(root, htmlFile),
    resolveRoot(root, outFile),
  ]);
  return "wkhtmltoimage";
}

export async function renderHtmlToImage({ root, html, htmlFile, outFile, width = 480 }) {
  const htmlAbs = resolveRoot(root, htmlFile);
  mkdirSync(path.dirname(htmlAbs), { recursive: true });
  writeFileSync(htmlAbs, html, "utf8");
  mkdirSync(path.dirname(resolveRoot(root, outFile)), { recursive: true });
  const errors = [];
  for (const engine of [renderWithChromium, renderWithWkhtmltoimage]) {
    try {
      const used = await engine({ root, htmlFile, outFile, width });
      return { status: "rendered", file: outFile, htmlFile, engine: used };
    } catch (e) {
      errors.push(`${engine.name}: ${String(e && e.message ? e.message : e).split("\n")[0]}`);
    }
  }
  throw new Error(`完成イメージの描画エンジンが使えません（Chromium: npm install のうえ node node_modules/playwright-core/cli.js install chromium／wkhtmltoimage: apt install wkhtmltopdf）: ${errors.join(" | ")}`);
}
