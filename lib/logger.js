const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, '..', 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function timestamp() {
  return new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

function log(level, ...args) {
  const ts = timestamp();
  const prefix = `[${ts}] [${level}]`;
  console.log(prefix, ...args);
}

const logger = {
  info:  (...args) => log('INFO',  ...args),
  warn:  (...args) => log('WARN',  ...args),
  error: (...args) => log('ERROR', ...args),
  ok:    (...args) => log('OK',    ...args),
};

/**
 * Save an error screenshot to the logs directory.
 * @param {import('playwright').Page} page
 * @param {string} label - descriptive name for the screenshot
 * @returns {Promise<string>} path to the saved screenshot
 */
async function saveScreenshot(page, label) {
  const safeName = label.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  const filename = `${safeName}_${Date.now()}.png`;
  const filepath = path.join(LOGS_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  logger.info(`Screenshot saved: ${filepath}`);
  return filepath;
}

module.exports = { logger, saveScreenshot, LOGS_DIR };
