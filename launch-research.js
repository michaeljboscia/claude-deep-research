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
 *   node launch-research.js -t ./topics/my-topics.txt --count 5
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { launchBrowser, killChrome } = require('./lib/browser');
const { SELECTORS, findElement, waitForAny } = require('./lib/selectors');
const { logger, saveScreenshot } = require('./lib/logger');

// ─── CLI argument parsing ────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    topicsFile: null,
    delay: 30,
    dryRun: false,
    startFrom: 1,
    count: Infinity,
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
      case '--count':
      case '-n':
        opts.count = parseInt(args[++i], 10);
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
  -d, --delay <seconds>  Base delay between topics (default: 30, ±30% jitter)
  -n, --count <N>        Only submit the first N topics (after start-from)
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

  // Validate numeric args
  if (isNaN(opts.delay) || opts.delay < 0) {
    logger.error(`Invalid --delay value. Must be a positive number.`);
    process.exit(1);
  }
  if (isNaN(opts.startFrom) || opts.startFrom < 1) {
    logger.error(`Invalid --start-from value. Must be a positive integer.`);
    process.exit(1);
  }
  if (opts.count !== Infinity && (isNaN(opts.count) || opts.count < 1)) {
    logger.error(`Invalid --count value. Must be a positive integer.`);
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

// ─── Anti-detection helpers ──────────────────────────────────────

/**
 * Add ±30% jitter to a base delay so timing isn't perfectly regular.
 * e.g. base=30 → random value between 21 and 39.
 */
function jitter(baseSeconds) {
  const min = baseSeconds * 0.7;
  const max = baseSeconds * 1.3;
  return Math.round(min + Math.random() * (max - min));
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

  // Wait for menu to close and UI to settle
  await page.waitForTimeout(1500);

  // Verify Research mode is active by checking for a visible indicator.
  // When Research is enabled, claude.ai shows a "Research" badge/pill
  // near the chat input area, or the menu item gets a checkmark.
  const researchActive = await page.evaluate(() => {
    // Check for any visible element containing "Research" that isn't inside a menu
    // (the menu should be closed by now — any remaining "Research" text is the badge)
    const indicators = document.querySelectorAll(
      '[data-testid*="research"], [class*="research"], [aria-label*="Research"]'
    );
    for (const el of indicators) {
      if (el.offsetParent !== null && !el.closest('[role="menu"]')) return true;
    }
    // Fallback: check if the page has any visible text "Research" outside menus
    const body = document.body.innerText;
    return body.includes('Research mode') || body.includes('Deep Research');
  });

  if (researchActive) {
    logger.ok('Research mode verified active.');
  } else {
    // Not fatal — the click may have worked even if we can't find the indicator.
    // claude.ai UI changes could break this check but not the actual toggle.
    logger.warn('Research mode clicked but could not verify activation indicator.');
  }

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

  // Wrap the prompt with instructions to prevent Deep Research from
  // asking clarifying questions instead of immediately launching.
  const directive = 'DO NOT ASK QUESTIONS - LAUNCH THE PROMPT';
  const wrappedTopic = `${directive}\n\n${topic}\n\n${directive}`;

  // Paste via macOS system clipboard (pbcopy) — NOT the browser Clipboard API.
  // The browser's navigator.clipboard.writeText() loses permission after several
  // page navigations due to "transient user activation" expiry. pbcopy writes
  // directly to the OS clipboard, which Meta+V reads without any browser permission.
  const tmpFile = '/tmp/claude-paste-buffer.txt';
  fs.writeFileSync(tmpFile, wrappedTopic);
  execSync(`cat "${tmpFile}" | pbcopy`);
  await page.keyboard.press('Meta+v');
  logger.info(`[${index}] Pasted topic: "${topic.slice(0, 80)}${topic.length > 80 ? '...' : ''}"`);

  // Let ProseMirror process the pasted content
  await page.waitForTimeout(1000);

  // Verify the paste actually landed.
  // claude.ai has two paste modes: short text goes inline in the editor,
  // long text becomes a "Pasted content" attachment block. Check for both.
  const pasteStatus = await page.evaluate(() => {
    // Check 1: inline text in the editor
    const editor = document.querySelector('[data-testid="chat-input"]')
      || document.querySelector('div[contenteditable="true"]');
    const inlineChars = editor ? editor.textContent.trim().length : 0;

    // Check 2: "Pasted content" attachment block (large pastes)
    const hasPastedAttachment = !!document.querySelector('[class*="pasted"], [data-testid*="pasted"], [aria-label*="Pasted"]')
      || document.body.innerText.includes('Pasted content');

    // Check 3: send button is enabled (content exists in some form)
    const sendBtn = document.querySelector('[data-testid="send-button"], button[aria-label="Send Message"], button[aria-label="Send message"]');
    const sendEnabled = sendBtn && !sendBtn.disabled;

    return { inlineChars, hasPastedAttachment, sendEnabled };
  });

  if (pasteStatus.inlineChars > 0) {
    logger.info(`[${index}] Paste verified (${pasteStatus.inlineChars} chars inline).`);
  } else if (pasteStatus.hasPastedAttachment) {
    logger.info(`[${index}] Paste verified (attached as "Pasted content" block).`);
  } else if (pasteStatus.sendEnabled) {
    logger.info(`[${index}] Paste verified (send button enabled).`);
  } else {
    logger.error(`[${index}] Paste failed — no content detected in editor.`);
    await saveScreenshot(page, `topic_${index}_paste_failed`);
    return false;
  }

  // Submit: try the send button first, fall back to Enter key
  const sendBtn = await findElement(page, SELECTORS.sendButton, { timeout: 3000 });
  if (sendBtn) {
    await sendBtn.click();
    logger.ok(`[${index}] Submitted via send button.`);
  } else {
    await page.keyboard.press('Enter');
    logger.ok(`[${index}] Submitted via Enter key.`);
  }

  // Wait for Deep Research to launch and the chat title to auto-generate.
  // Without this, navigating away too fast leaves untitled conversations.
  logger.info(`[${index}] Waiting 15s for chat title to generate...`);
  await page.waitForTimeout(15000);

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

  // Calculate the effective topic range
  const endAt = Math.min(opts.startFrom + opts.count - 1, topics.length);
  const toSubmit = endAt - opts.startFrom + 1;

  if (opts.count < Infinity) {
    logger.info(`Will submit ${toSubmit} topics (${opts.startFrom} through ${endAt}).`);
  }

  // Dry run: just print topics and exit
  if (opts.dryRun) {
    logger.info('=== DRY RUN — no browser will be launched ===');
    topics.forEach((topic, i) => {
      const num = i + 1;
      const skip = num < opts.startFrom || num > endAt ? ' [SKIP]' : '';
      console.log(`  ${num}. ${topic.slice(0, 120)}${topic.length > 120 ? '...' : ''}${skip}`);
    });
    logger.info(`Total: ${topics.length} topics, ${toSubmit} to submit.`);
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
    if (num > endAt) break;

    const topic = topics[i];
    logger.info(`─── Topic ${num}/${topics.length} (batch ${submitted + failed + 1}/${toSubmit}) ───`);

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

    // Jittered delay between topics (skip after the last one in this batch)
    if (submitted + failed < toSubmit) {
      const wait = jitter(opts.delay);
      logger.info(`Waiting ${wait}s before next topic (base: ${opts.delay}s ±30%)...`);
      await page.waitForTimeout(wait * 1000);
    }
  }

  // Summary
  logger.info('═══════════════════════════════════════');
  logger.ok(`Done! Submitted: ${submitted}, Failed: ${failed}, Batch: ${toSubmit}/${topics.length} total topics`);
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
