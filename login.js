#!/usr/bin/env node
/**
 * login.js — One-time auth setup for claude.ai
 *
 * Opens a visible Chrome window to claude.ai. You log in manually
 * (email, SSO, whatever). Once the chat input appears, the session
 * is confirmed. Close the browser (Ctrl+C) and the session persists
 * in ./browser-profile/ for headless reuse by launch-research.js.
 */

const { launchBrowser } = require('./lib/browser');
const { SELECTORS, waitForAny } = require('./lib/selectors');
const { logger } = require('./lib/logger');

const LOGIN_URL = 'https://claude.ai';
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes to complete login

async function main() {
  logger.info('Opening Chrome for claude.ai login...');
  logger.info('Log in manually. This window will detect when you\'re authenticated.');

  const { context, page } = await launchBrowser({ headless: false });

  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
  logger.info(`Navigated to ${LOGIN_URL}`);
  logger.info(`Waiting up to 5 minutes for login (look for chat input)...`);

  const loggedIn = await waitForAny(page, SELECTORS.loggedIn, LOGIN_TIMEOUT_MS);

  if (loggedIn) {
    logger.ok('Login detected! Session saved to ./browser-profile/');
    logger.info('You can close this browser window (Ctrl+C) now.');
    logger.info('Next step: node launch-research.js --topics ./topics/your-topics.txt');
  } else {
    logger.warn('Login not detected within 5 minutes.');
    logger.warn('Try again with: npm run login');
  }

  // Keep the browser open so the user can verify / interact
  // Session data is auto-persisted by the persistent context.
  // The process stays alive until Ctrl+C.
  logger.info('Browser staying open. Press Ctrl+C to exit.');

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Closing browser and saving session...');
    await context.close();
    process.exit(0);
  });

  // Keep process alive
  await new Promise(() => {});
}

main().catch((err) => {
  logger.error('Login failed:', err.message);
  process.exit(1);
});
