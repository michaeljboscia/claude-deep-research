#!/usr/bin/env node
/**
 * login.js — One-time auth setup for claude.ai
 *
 * Spawns a real Chrome window (not Playwright-launched) with remote
 * debugging enabled, navigates to claude.ai, and waits for you to
 * log in. Session persists in ./browser-profile/ for reuse.
 */

const { launchBrowser, killChrome } = require('./lib/browser');
const { SELECTORS, waitForAny } = require('./lib/selectors');
const { logger } = require('./lib/logger');

const LOGIN_URL = 'https://claude.ai';
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes to complete login

async function main() {
  // Kill any stale debug Chrome from a previous run
  await killChrome();
  await new Promise(r => setTimeout(r, 1000));

  logger.info('Opening Chrome for claude.ai login...');
  logger.info('Log in manually. This window will detect when you\'re authenticated.');

  const { browser, context, page } = await launchBrowser({ visible: true });

  // Register SIGINT handler immediately so Ctrl+C always cleans up
  process.on('SIGINT', async () => {
    logger.info('Shutting down Chrome...');
    await killChrome();
    process.exit(0);
  });

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

  logger.info('Browser staying open. Press Ctrl+C to exit.');

  // Keep process alive
  await new Promise(() => {});
}

main().catch(async (err) => {
  logger.error('Login failed:', err.message);
  await killChrome();
  process.exit(1);
});
