# Claude Deep Research Batch Launcher

Batch-launch [Claude Deep Research](https://claude.ai) topics via Playwright browser automation. Write your research topics in a text file, run one command, and walk away — each topic gets its own conversation with Research mode enabled.

## Quick Context (For AI)

- **Purpose:** Automate batch submission of Deep Research topics to claude.ai
- **Tech:** Node.js + Playwright (persistent browser context, system Chrome)
- **Two-phase design:** `login.js` (visible, one-time) → `launch-research.js` (headless, batch)
- **Key pattern:** `launchPersistentContext` + `channel: 'chrome'` + `keyboard.type()` for ProseMirror
- **Selectors:** Centralized in `lib/selectors.js` with multi-fallback chains

## Prerequisites

- **Node.js** 18+
- **Google Chrome** installed (Playwright uses your system Chrome, not bundled Chromium)
- **Claude Pro/Team account** with Deep Research access

## Setup

```bash
cd ~/projects/claude-deep-research
npm install
```

## Usage

### Step 1: Login (one-time)

```bash
npm run login
```

A Chrome window opens to claude.ai. Log in with your credentials. Once the chat input appears, the session is saved. Press **Ctrl+C** to close.

You only need to do this once (or when your session expires).

### Step 2: Create a topics file

Create a text file with one research topic per line:

```text
# My research topics
# Lines starting with # are comments

What are the leading open-source alternatives to Snowflake for real-time analytics in 2026?

Compare vector database performance: Pinecone vs Weaviate vs Qdrant for production RAG systems with 10M+ embeddings.
```

### Step 3: Launch research

```bash
# Basic usage
node launch-research.js --topics ./topics/my-topics.txt

# Custom delay between topics (default: 15 seconds)
node launch-research.js -t ./topics/my-topics.txt -d 30

# Dry run — print topics without launching browser
node launch-research.js -t ./topics/my-topics.txt --dry-run

# Resume from topic #5 (if earlier run failed partway)
node launch-research.js -t ./topics/my-topics.txt --start-from 5
```

### Step 4: Check results

Open [claude.ai](https://claude.ai) in your normal browser. Each topic appears as a separate conversation with Deep Research running (or completed).

## CLI Reference

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--topics <file>` | `-t` | required | Path to topics file (.txt or .json) |
| `--delay <seconds>` | `-d` | `15` | Seconds to wait between topic submissions |
| `--dry-run` | | `false` | Print parsed topics without launching browser |
| `--start-from <N>` | | `1` | Skip topics before position N (1-indexed) |
| `--help` | `-h` | | Show help |

## Topics File Format

**Text format** (`.txt`): one topic per line, `#` comments, blank lines ignored.

**JSON format** (`.json`): array of strings.

```json
[
  "First research topic",
  "Second research topic"
]
```

## Project Structure

```
claude-deep-research/
├── package.json              # playwright dependency, npm scripts
├── .gitignore                # browser-profile/, node_modules/, logs/
├── login.js                  # Visible browser — manual login, save session
├── launch-research.js        # Headless browser — batch topic submission
├── lib/
│   ├── browser.js            # Shared Playwright persistent context config
│   ├── selectors.js          # All claude.ai selectors (multi-fallback)
│   └── logger.js             # Timestamped console logging + screenshots
├── topics/
│   └── example-topics.txt    # Sample topics file
├── browser-profile/          # Chrome session data (gitignored)
└── logs/                     # Error screenshots (gitignored)
```

## Troubleshooting

### "Not logged in" error

Your session expired. Re-run `npm run login` to authenticate again.

### Research toggle not found

The Research feature may not be available on your account tier, or claude.ai updated their UI. Check `lib/selectors.js` and update the `researchToggle` selectors.

### Topic submission fails

Check `logs/` for error screenshots. Common causes:
- **CAPTCHA / rate limiting:** Increase `--delay` to 30-60 seconds
- **DOM changes:** Update selectors in `lib/selectors.js`
- **Page didn't load:** Network issue — retry with `--start-from`

### Headless detection

If claude.ai blocks headless Chrome, the tool already uses `channel: 'chrome'` (system Chrome) and `--disable-blink-features=AutomationControlled`. If that's not enough, run `login.js` style (headed) by temporarily editing `launch-research.js` to pass `headless: false`.

## How It Works

1. **Persistent context:** Playwright's `launchPersistentContext()` saves all cookies and localStorage to `./browser-profile/`. Login once, reuse forever.
2. **System Chrome:** `channel: 'chrome'` tells Playwright to use your installed Chrome instead of its bundled Chromium. This produces a browser fingerprint identical to a real user.
3. **ProseMirror input:** claude.ai uses a `contenteditable` div (ProseMirror editor), not a standard `<textarea>`. We use `keyboard.type()` to simulate real keystrokes instead of `fill()` which doesn't work on contenteditable elements.
4. **Same-tab navigation:** Each topic reuses the same browser tab via `page.goto('claude.ai/new')`. This avoids memory bloat from 20+ simultaneous Research tabs.
5. **Multi-fallback selectors:** Every UI element has 4-6 selector strategies in `lib/selectors.js`, tried in order from most stable (`data-testid`) to least stable (CSS structure).
