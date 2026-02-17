/**
 * Centralized selectors for claude.ai UI elements.
 *
 * claude.ai is a React app using ProseMirror for the chat editor.
 * The DOM changes frequently, so each element has multiple fallback
 * selectors ordered from most stable (data-testid, aria) to least
 * stable (CSS structure). When the UI updates, you only need to
 * update this one file.
 */

const SELECTORS = {
  // The ProseMirror contenteditable div where you type messages
  chatInput: [
    '[data-testid="chat-input"]',
    'div[contenteditable="true"][translate="no"]',
    'div.ProseMirror[contenteditable="true"]',
    '[aria-label="Write your prompt to Claude"]',
    'div[contenteditable="true"]',
  ],

  // The send / submit button
  sendButton: [
    '[data-testid="send-button"]',
    'button[aria-label="Send Message"]',
    'button[aria-label="Send message"]',
    'button:has(svg) >> nth=-1',  // last icon button in input area
    'fieldset button[type="button"]',
  ],

  // The "+" button that opens the tools menu (inside chat input area)
  plusMenu: [
    'button[aria-label="Toggle menu"]',
    'button[aria-label="Add content"]',
  ],

  // The menu that appears after clicking +
  toolsMenu: [
    '[role="menu"]',
  ],

  // The "Research" item inside the + menu
  researchMenuItem: [
    '[role="menuitem"]:has-text("Research")',
    '[role="menu"] >> text=Research',
  ],

  // Indicator that the page has fully loaded (React hydrated)
  pageReady: [
    '[data-testid="chat-input"]',
    'div[contenteditable="true"]',
    'div.ProseMirror',
    'main',
  ],

  // Indicator that the user is logged in
  loggedIn: [
    '[data-testid="chat-input"]',
    'div[contenteditable="true"]',
    'button[aria-label="Send Message"]',
    'button[aria-label="Send message"]',
    'nav',
  ],

  // Cloudflare Turnstile challenge page
  cloudflareChallenge: [
    'text=Verify you are human',
    'text=Performing security verification',
    '#challenge-running',
    '#challenge-stage',
    'iframe[src*="challenges.cloudflare.com"]',
  ],
};

/**
 * Try each selector in the array; return the first element found.
 *
 * @param {import('playwright').Page} page
 * @param {string[]} selectors - ordered most-reliable → least-reliable
 * @param {object} opts
 * @param {number} opts.timeout - per-selector timeout in ms (default 3000)
 * @returns {Promise<import('playwright').Locator|null>}
 */
async function findElement(page, selectors, { timeout = 3000 } = {}) {
  for (const selector of selectors) {
    try {
      const locator = page.locator(selector).first();
      await locator.waitFor({ state: 'visible', timeout });
      return locator;
    } catch {
      // Selector didn't match within timeout — try the next one
    }
  }
  return null;
}

/**
 * Wait until any one of the selectors is visible (page-ready check).
 *
 * @param {import('playwright').Page} page
 * @param {string[]} selectors
 * @param {number} timeout - total timeout in ms
 * @returns {Promise<boolean>}
 */
async function waitForAny(page, selectors, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    for (const selector of selectors) {
      try {
        const visible = await page.locator(selector).first().isVisible();
        if (visible) return true;
      } catch {
        // ignore
      }
    }
    await page.waitForTimeout(500);
  }
  return false;
}

module.exports = { SELECTORS, findElement, waitForAny };
