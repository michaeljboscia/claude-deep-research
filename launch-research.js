#!/usr/bin/env node
/**
 * launch-research.js — Batch launcher for Claude Deep Research
 *
 * Reads topics from a text file (one per line), connects to a real
 * Chrome instance (off-screen), and submits each topic as a Deep
 * Research conversation on claude.ai.
 *
 * Usage:
 *   node launch-research.js --topics ./topics/my-topics.txt
 *   node launch-research.js -t ./topics/my-topics.txt -d 30
 *   node launch-research.js -t ./topics/my-topics.txt --dry-run
 *   node launch-research.js -t ./topics/my-topics.txt --start-from 5
 */

const fs = require('fs');
const path = require('path');
const { launchBrowser } = require('./lib/browser');
const { SELECTORS, findElement, waitForAny } = require('./lib/selectors');
const { logger, saveScreenshot } = require('./lib/logger');

// ─── CLI argument parsing ────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    topicsFile: null,
    delay: 15,
    dryRun: false,
    startFrom: 1,
    visible: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--topics':
      case '-t':
        opts.topicsFile = args[++i];
        break;
      case '--delay':
      case '-d':
        opts.delay = parseInt(args[++i], 10);
        break;
      case '--dry-run':
        opts.dryRun = true;
        break;
      case '--start-from':
        opts.startFrom = parseInt(args[++i], 10);
        break;
      case '--visible':
        opts.visible = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Claude Deep Research Batch Launcher

Usage:
  node launch-research.js --topics <file> [options]

Options:
  -t, --topics <file>    Path to topics file (required)
  -d, --delay <seconds>  Delay between topics (default: 15)
  --dry-run              Print topics without launching browser
  --start-from <N>       Start from topic number N (1-indexed)
  --visible              Show the browser window (default: off-screen)
  -h, --help             Show this help
`);
        process.exit(0);
    }
  }

  if (!opts.topicsFile) {
    logger.error('Missing required --topics flag. Use --help for usage.');
    process.exit(1);
  }

  return opts;
}

// ─── Topic file parsing ──────────────────────────────────────────

function loadTopics(filePath) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    logger.error(`Topics file not found: ${resolved}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(resolved, 'utf-8');

  // Support JSON format (array of strings)
  if (resolved.endsWith('.json')) {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      logger.error('JSON topics file must be an array of strings.');
      process.exit(1);
    }
    return parsed.map(t => t.trim()).filter(Boolean);
  }

  // Text format: one topic per line, # comments, skip blanks
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
}

// ─── Cloudflare handling ─────────────────────────────────────────

/**
 * Wait for Cloudflare Turnstile challenge to resolve.
 * With connectOverCDP (real Chrome), this should auto-clear quickly.
 */
async function waitForCloudflare(page, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    // Check if we've navigated past the challenge (URL changed)
    const url = page.url();
    if (url.includes('claude.ai') && !url.includes('challenges')) {
      // Also verify the challenge text is gone
      const stillBlocked = await waitForAny(page, SELECTORS.cloudflareChallenge, 2000);
      if (!stillBlocked) return true;
    }
    await page.waitForTimeout(2000);
  }
  return false;
}

// ─── Research activation ─────────────────────────────────────────

/**
 * Enable Research mode via the + menu.
 *
 * Flow: click "+" button → menu opens → click "Research" menu item.
 */
async function enableResearch(page) {
  // Step 1: Click the + button to open the tools menu
  const plusBtn = await findElement(page, SELECTORS.plusMenu, { timeout: 5000 });
  if (!plusBtn) {
    logger.warn('Plus menu button not found.');
    return false;
  }

  await plusBtn.click();
  await page.waitForTimeout(1000);

  // Step 2: Wait for the menu to appear
  const menu = await findElement(page, SELECTORS.toolsMenu, { timeout: 3000 });
  if (!menu) {
    logger.warn('Tools menu did not open.');
    return false;
  }

  // Step 3: Click "Research" in the menu
  const researchItem = await findElement(page, SELECTORS.researchMenuItem, { timeout: 3000 });
  if (!researchItem) {
    logger.warn('Research menu item not found — may not be available on this account.');
    // Close the menu by pressing Escape
    await page.keyboard.press('Escape');
    return false;
  }

  await researchItem.click();
  logger.info('Research mode activated.');

  // Wait for menu to close and UI to settle
  await page.waitForTimeout(1500);
  return true;
}

// ─── Submit a single topic ───────────────────────────────────────

async function submitTopic(page, topic, index) {
  logger.info(`[${index}] Navigating to claude.ai/new...`);
  await page.goto('https://claude.ai/new', { waitUntil: 'domcontentloaded' });

  // Wait for the page to be ready (React hydration)
  const ready = await waitForAny(page, SELECTORS.pageReady, 30000);
  if (!ready) {
    logger.error(`[${index}] Page did not become ready within 30s.`);
    await saveScreenshot(page, `topic_${index}_page_not_ready`);
    return false;
  }

  // Extra settle time for React hydration + dynamic UI loading
  await page.waitForTimeout(2000);

  // Enable Research mode
  const researchEnabled = await enableResearch(page);
  if (!researchEnabled) {
    logger.warn(`[${index}] Proceeding without Research toggle (may submit as regular chat).`);
  }

  // Focus and type into the chat input
  const input = await findElement(page, SELECTORS.chatInput, { timeout: 10000 });
  if (!input) {
    logger.error(`[${index}] Chat input not found.`);
    await saveScreenshot(page, `topic_${index}_no_input`);
    return false;
  }

  await input.click();
  await page.waitForTimeout(300);

  // Use keyboard.type() because ProseMirror contenteditable doesn't
  // respond to Playwright's fill() method.
  await page.keyboard.type(topic, { delay: 10 });
  logger.info(`[${index}] Typed topic: "${topic.slice(0, 80)}${topic.length > 80 ? '...' : ''}"`);

  await page.waitForTimeout(500);

  // Submit: try the send button first, fall back to Enter key
  const sendBtn = await findElement(page, SELECTORS.sendButton, { timeout: 3000 });
  if (sendBtn) {
    await sendBtn.click();
    logger.ok(`[${index}] Submitted via send button.`);
  } else {
    await page.keyboard.press('Enter');
    logger.ok(`[${index}] Submitted via Enter key.`);
  }

  return true;
}

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();
  const topics = loadTopics(opts.topicsFile);

  logger.info(`Loaded ${topics.length} topics from ${opts.topicsFile}`);

  if (opts.startFrom > 1) {
    logger.info(`Starting from topic #${opts.startFrom}`);
  }

  // Dry run: just print topics and exit
  if (opts.dryRun) {
    logger.info('=== DRY RUN — no browser will be launched ===');
    topics.forEach((topic, i) => {
      const num = i + 1;
      const skip = num < opts.startFrom ? ' [SKIP]' : '';
      console.log(`  ${num}. ${topic}${skip}`);
    });
    logger.info(`Total: ${topics.length} topics, ${topics.length - opts.startFrom + 1} to submit.`);
    return;
  }

  // Launch real Chrome (off-screen) and connect via CDP
  logger.info(`Launching Chrome (${opts.visible ? 'visible' : 'off-screen'})...`);
  const { browser, context, page } = await launchBrowser({ visible: opts.visible });

  // Navigate and handle Cloudflare challenge if it appears
  logger.info('Navigating to claude.ai...');
  await page.goto('https://claude.ai/new', { waitUntil: 'domcontentloaded' });

  // Check for Cloudflare challenge
  const hitCloudflare = await waitForAny(page, SELECTORS.cloudflareChallenge, 5000);
  if (hitCloudflare) {
    logger.warn('Cloudflare challenge detected — waiting for auto-resolve (up to 30s)...');
    const cleared = await waitForCloudflare(page, 30000);
    if (!cleared) {
      logger.error('Cloudflare challenge did not resolve. Try running: npm run login');
      await saveScreenshot(page, 'cloudflare_blocked');
      await browser.close();
      process.exit(1);
    }
    logger.ok('Cloudflare challenge cleared.');
  }

  // Verify login is still valid
  logger.info('Verifying login session...');
  const loggedIn = await waitForAny(page, SELECTORS.loggedIn, 15000);
  if (!loggedIn) {
    logger.error('Not logged in. Run "npm run login" first to authenticate.');
    await saveScreenshot(page, 'not_logged_in');
    await browser.close();
    await killChrome();
    process.exit(1);
  }
  logger.ok('Session is valid.');

  // Submit each topic
  let submitted = 0;
  let failed = 0;

  for (let i = 0; i < topics.length; i++) {
    const num = i + 1;
    if (num < opts.startFrom) continue;

    const topic = topics[i];
    logger.info(`─── Topic ${num}/${topics.length} ───`);

    try {
      const ok = await submitTopic(page, topic, num);
      if (ok) {
        submitted++;
      } else {
        failed++;
      }
    } catch (err) {
      logger.error(`[${num}] Unexpected error: ${err.message}`);
      await saveScreenshot(page, `topic_${num}_error`).catch(() => {});
      failed++;
    }

    // Delay between topics (skip after the last one)
    if (i < topics.length - 1) {
      logger.info(`Waiting ${opts.delay}s before next topic...`);
      await page.waitForTimeout(opts.delay * 1000);
    }
  }

  // Summary
  logger.info('═══════════════════════════════════════');
  logger.ok(`Done! Submitted: ${submitted}, Failed: ${failed}, Total: ${topics.length}`);
  logger.info('Check claude.ai in your browser to monitor research progress.');
  logger.info('═══════════════════════════════════════');

  // Disconnect Playwright but leave Chrome running — Deep Research
  // needs the browser alive to process in the background.
  await browser.close();
  logger.info('Playwright disconnected. Chrome stays running in the background.');
  logger.info('To kill it later: lsof -ti:9222 | xargs kill');
}

main().catch(async (err) => {
  logger.error('Fatal error:', err.message);
  process.exit(1);
});
