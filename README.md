# Claude Deep Research Batch Launcher

Batch-launch [Claude Deep Research](https://claude.ai) topics via Playwright browser automation. Write your research topics in a text or JSON file, run one command, and walk away — each topic gets its own conversation with Research mode enabled.

## Quick Context (For AI)

- **Purpose:** Automate batch submission of Deep Research topics to claude.ai
- **Tech:** Node.js + Playwright, connecting to a real Chrome instance via CDP (`connectOverCDP`)
- **Two-phase design:** `login.js` (visible Chrome, one-time) → `launch-research.js` (off-screen Chrome, batch)
- **Key pattern:** Spawn real Chrome with `--remote-debugging-port=9222`, Playwright attaches via CDP. Clipboard paste (`Meta+V`) into ProseMirror contenteditable.
- **Selectors:** Centralized in `lib/selectors.js` with multi-fallback chains
- **Platform:** macOS only (Chrome paths and paste keybinding are macOS-specific)

## Prerequisites

- **macOS** (Chrome paths and keyboard shortcuts are macOS-specific)
- **Node.js** 18+
- **Google Chrome** installed at `/Applications/Google Chrome.app/`
- **Claude Pro/Team account** with Deep Research access

## Setup

```bash
git clone <repo-url>
cd claude-deep-research

# Skip Playwright's browser download — we use your system Chrome, not bundled Chromium
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install
```

## Usage

### Step 1: Login (one-time)

```bash
npm run login
```

A Chrome window opens to claude.ai. Log in with your credentials. Once the chat input appears, the session is saved to `./browser-profile/`. Press **Ctrl+C** to close.

You only need to do this once (or when your session expires).

### Step 2: Create a topics file

**Text format** (`.txt`) — one topic per line, `#` comments, blank lines ignored:

```text
# My research topics

What are the leading open-source alternatives to Snowflake for real-time analytics?

Compare vector database performance: Pinecone vs Weaviate vs Qdrant for production RAG systems.
```

**JSON format** (`.json`) — array of strings, better for multi-paragraph prompts:

```json
[
  "First research topic with\nmultiple lines\nand formatting",
  "Second research topic"
]
```

A ready-to-run example is included — 5 Deep Research prompts about the Teletubbies:

```bash
# Try it out
node launch-research.js -t ./topics/example-topics.json --dry-run
```

### Step 3: Launch research

```bash
# Submit all topics
node launch-research.js --topics ./topics/my-topics.txt

# Submit only the first 5
node launch-research.js -t ./topics/my-topics.txt --count 5

# Custom delay between topics (default: 30 seconds ±30% jitter)
node launch-research.js -t ./topics/my-topics.txt -d 60

# Dry run — print topics without launching browser
node launch-research.js -t ./topics/my-topics.txt --dry-run

# Resume from topic #6 (if earlier run covered 1-5)
node launch-research.js -t ./topics/my-topics.txt --start-from 6

# Show the browser window (default is off-screen)
node launch-research.js -t ./topics/my-topics.txt --visible
```

### Step 4: Check results

Open [claude.ai](https://claude.ai) in your normal browser. Each topic appears as a separate conversation with Deep Research running (or completed).

## CLI Reference

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--topics <file>` | `-t` | required | Path to topics file (.txt or .json) |
| `--delay <seconds>` | `-d` | `30` | Base delay between submissions (±30% random jitter) |
| `--count <N>` | `-n` | all | Only submit N topics (after start-from) |
| `--dry-run` | | `false` | Print parsed topics without launching browser |
| `--start-from <N>` | | `1` | Skip topics before position N (1-indexed) |
| `--visible` | | `false` | Show the Chrome window (default: off-screen) |
| `--help` | `-h` | | Show help |

## How It Works

1. **Real Chrome via CDP:** Instead of Playwright launching Chrome (which Cloudflare Turnstile fingerprints), we spawn Chrome as a normal subprocess with `--remote-debugging-port=9222` and attach Playwright via `chromium.connectOverCDP()`. Cloudflare cannot distinguish this from a real user session.

2. **Off-screen window:** Chrome runs with `--window-position=-10000,-10000` — technically a visible (headed) browser, but positioned off-screen so it doesn't interrupt your workflow. This passes Cloudflare checks that block headless mode.

3. **Clipboard paste:** claude.ai uses a ProseMirror contenteditable editor. `keyboard.type()` sends literal Enter keypresses for `\n` characters, which ProseMirror interprets as "submit message" — splitting multi-line prompts. Clipboard paste (`navigator.clipboard.writeText()` + `Meta+V`) inserts the entire prompt atomically, exactly like a human pasting.

4. **Research activation:** The Deep Research toggle is inside a `+` menu dropdown, not a standalone button. The tool clicks `button[aria-label="Toggle menu"]` to open the menu, then clicks `[role="menuitem"]:has-text("Research")`.

5. **Session persistence:** Chrome's user data directory (`./browser-profile/`) stores all cookies and localStorage. Login once, reuse across runs.

6. **Chrome stays alive:** After submitting all topics, Playwright disconnects but Chrome keeps running. Deep Research needs an active browser session to process.

7. **Anti-detection:** Delays between topics use ±30% random jitter (e.g., 30s base → 21-39s actual) to avoid the fixed-interval pattern that bot detection flags.

## Project Structure

```
claude-deep-research/
├── package.json              # playwright dependency, npm scripts
├── .gitignore                # browser-profile/, node_modules/, logs/, session-logs/
├── LICENSE                   # MIT
├── login.js                  # Visible Chrome — manual login, save session
├── launch-research.js        # Off-screen Chrome — batch topic submission
├── parse-prompts.js          # Utility: extract prompts from markdown code fences
├── lib/
│   ├── browser.js            # Chrome spawning + Playwright CDP connection
│   ├── selectors.js          # All claude.ai selectors (multi-fallback)
│   └── logger.js             # Timestamped console logging + error screenshots
├── topics/
│   ├── example-topics.txt    # Sample topics file (text format)
│   └── *.json                # Your topic files (JSON format)
├── browser-profile/          # Chrome session data (gitignored)
├── logs/                     # Error screenshots (gitignored)
└── session-logs/             # Development session notes (gitignored)
```

## Troubleshooting

### "Not logged in" error

Your session expired. Re-run `npm run login` to authenticate again.

### Chrome already running on port 9222

Kill the existing instance before launching:

```bash
lsof -ti:9222 | xargs kill
```

### Research toggle not found

The Research feature may not be available on your account tier, or claude.ai updated their UI. The tool will warn and submit as a regular chat instead. To fix, inspect the DOM and update selectors in `lib/selectors.js`.

### Topic submission fails

Check `logs/` for error screenshots. Common causes:
- **Rate limiting:** Increase `--delay` to 60+ seconds
- **DOM changes:** claude.ai updated their UI — update selectors in `lib/selectors.js`
- **Page didn't load:** Network issue — retry with `--start-from`

### Cloudflare blocks the browser

This shouldn't happen with the CDP approach (real Chrome). If it does:
1. Kill Chrome: `lsof -ti:9222 | xargs kill`
2. Re-run `npm run login` to get a fresh session
3. Try again

### Prompts getting cut off or split

Make sure you're using the latest version. Earlier versions used `keyboard.type()` which splits on newlines. The current version uses clipboard paste which handles multi-line prompts correctly.

## Designing Good Prompts

See **[PROMPT_GUIDE.md](PROMPT_GUIDE.md)** for best practices on structuring multi-part Deep Research investigations — including how to scope prompts, optimal sizing (target under 10,000 words of output), the split-by-subsystem strategy, and a reusable prompt template.

## Platform Note

This tool is built for **macOS**. It uses macOS Chrome paths (`/Applications/Google Chrome.app/`) and the macOS paste shortcut (`Meta+V`). Linux/Windows users would need to modify `lib/browser.js` (Chrome path detection) and `launch-research.js` (paste keybinding to `Control+V`).
