const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { chromium } = require('playwright');

const PROFILE_DIR = path.join(__dirname, '..', 'browser-profile');
const CDP_PORT = 9222;

/**
 * Strategy: Connect to Chrome via CDP instead of launching it.
 *
 * Why this beats launchPersistentContext:
 * - Playwright-launched Chrome gets tagged with CDP markers that
 *   Cloudflare Turnstile detects (even headed, even with stealth patches)
 * - A user-launched Chrome with --remote-debugging-port is indistinguishable
 *   from a normal Chrome session — because it IS a normal Chrome session
 * - We just attach to it and drive it via CDP
 *
 * Flow:
 * 1. launch() spawns Chrome as a regular subprocess with debugging port
 * 2. Playwright connects via connectOverCDP()
 * 3. Chrome uses our dedicated profile dir (not your daily profile)
 */

/**
 * Find the Chrome executable on macOS.
 */
function findChrome() {
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('Chrome not found. Install Google Chrome.');
}

/**
 * Check if Chrome is already running on the debug port.
 */
async function isDebugPortOpen() {
  try {
    const resp = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
    return resp.ok;
  } catch {
    return false;
  }
}

/**
 * Launch Chrome as a regular process with remote debugging enabled.
 * This is NOT Playwright launching Chrome — it's a normal Chrome instance
 * that Playwright will attach to afterward.
 */
async function spawnChrome({ visible = false } = {}) {
  const chrome = findChrome();

  const args = [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${PROFILE_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
  ];

  if (!visible) {
    // Move window off-screen so it doesn't interfere
    args.push('--window-position=-10000,-10000');
    args.push('--window-size=1280,900');
  }

  // Spawn Chrome detached so it survives if this process dies
  const { spawn } = require('child_process');
  const child = spawn(chrome, args, {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();

  // Wait for debug port to become available
  const start = Date.now();
  while (Date.now() - start < 15000) {
    if (await isDebugPortOpen()) return;
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`Chrome did not start on port ${CDP_PORT} within 15s`);
}

/**
 * Launch or connect to a Chrome instance for automation.
 *
 * @param {object} opts
 * @param {boolean} opts.visible - show the Chrome window (for login)
 * @returns {Promise<{browser: Browser, context: BrowserContext, page: Page}>}
 */
async function launchBrowser({ visible = false } = {}) {
  // If Chrome isn't already running with debug port, start it
  if (!(await isDebugPortOpen())) {
    await spawnChrome({ visible });
  }

  // Connect Playwright to the running Chrome via CDP
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);

  const context = browser.contexts()[0] || await browser.newContext();
  const page = context.pages()[0] || await context.newPage();

  return { browser, context, page };
}

/**
 * Kill the Chrome debug instance.
 */
async function killChrome() {
  try {
    execSync(`lsof -ti:${CDP_PORT} | xargs kill -9 2>/dev/null`, { stdio: 'ignore' });
  } catch {
    // Already dead
  }
}

module.exports = { launchBrowser, killChrome, PROFILE_DIR, CDP_PORT };
