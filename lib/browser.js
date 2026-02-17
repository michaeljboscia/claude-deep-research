const path = require('path');
const { chromium } = require('playwright');

const PROFILE_DIR = path.join(__dirname, '..', 'browser-profile');

/**
 * Launch a persistent Chrome browser context.
 *
 * Using launchPersistentContext means cookies, localStorage, and session
 * data survive between runs — login once, reuse forever.
 *
 * @param {object} opts
 * @param {boolean} opts.headless - true for batch runs, false for login
 * @returns {Promise<{context: BrowserContext, page: Page}>}
 */
async function launchBrowser({ headless = true } = {}) {
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless,
    channel: 'chrome',          // Use system Chrome (less bot fingerprinting)
    viewport: { width: 1280, height: 900 },
    args: [
      '--disable-blink-features=AutomationControlled',
      '--restore-last-session',  // Playwright bug #36139 workaround
    ],
  });

  // Use the first page if one already exists, otherwise open a new one
  const page = context.pages().length > 0
    ? context.pages()[0]
    : await context.newPage();

  return { context, page };
}

module.exports = { launchBrowser, PROFILE_DIR };
