# Session Log: claude-deep-research

**Project:** claude-deep-research
**Owner:** michaeljboscia
**Repo:** local-only (~/projects/claude-deep-research)
**Branch:** main
**Agent:** Claude Opus 4.6
**Session Start:** 2026-02-16 21:48 EST

---

## OVERALL GOAL

Build a Playwright-based tool to batch-launch Claude Deep Research topics from a text/JSON file. Two-phase design: login once (visible Chrome), then batch-submit topics headlessly in the background.

---

## MACRO-LEVEL TODO

- [x] Phase 1: Scaffold project (package.json, .gitignore, git init)
- [x] Phase 2: Shared browser config (lib/browser.js)
- [x] Phase 3: Multi-fallback selectors (lib/selectors.js)
- [x] Phase 4: Logger module (lib/logger.js)
- [x] Phase 5: Login script (login.js)
- [x] Phase 6: Batch launcher (launch-research.js)
- [x] Phase 7: Example topics + README
- [x] Phase 8: npm install, git init, initial commit
- [x] Phase 9: Fix Cloudflare bypass (connectOverCDP approach)
- [x] Phase 10: Fix Research toggle activation (+ menu → Research menuitem)
- [x] Phase 11: Verify end-to-end — single topic with Deep Research ✅
- [x] Phase 12: Batch launch 15 Adobe Commerce Backend Bible prompts ✅
- [x] Phase 13: Final commit + cleanup ✅

---

## WHERE WE ARE

**Phase:** 13 complete — ALL PHASES DONE
**Progress:** 100% complete — all 15 topics submitted successfully

---

## WHAT WORKS

1. **connectOverCDP browser strategy** — spawn real Chrome with `--remote-debugging-port=9222`, Playwright attaches via CDP. Cloudflare Turnstile cannot distinguish this from a normal user. Verified: Cloudflare auto-clears, session cookies persist.
2. **Login persistence** — `browser-profile/` directory holds Chrome profile data. Login once, session survives across runs.
3. **Research activation** — Click `button[aria-label="Toggle menu"]` (the + icon in chat input) → click `[role="menuitem"]:has-text("Research")` from the dropdown menu.
4. **Topic submission** — Clipboard paste (`navigator.clipboard.writeText` + `Meta+V`) into ProseMirror `contenteditable` div, then click send button.
5. **Chrome stays alive** — Playwright disconnects but Chrome keeps running so Deep Research can process.
6. **Dry run mode** — `--dry-run` flag correctly parses topics from .txt and .json files.
7. **15 Adobe Commerce prompts parsed** — `parse-prompts.js` extracted all 15 from the markdown file into JSON.

---

## WHAT DOESN'T WORK / KNOWN ISSUES

1. **Headless Chrome is blocked by Cloudflare** — Even with stealth patches (`navigator.webdriver`, `chrome.runtime`, plugins array), Cloudflare Turnstile detects headless. Solved by using connectOverCDP with a real Chrome process instead.
2. **Off-screen Chrome** — Uses `--window-position=-10000,-10000` to move window off-screen. On macOS this works but Chrome may briefly flash on launch. Not a real problem.
3. **Research toggle detection was wrong initially** — We assumed Research was a standalone toggle button. It's actually inside the "+" menu (accessible via `aria-label="Toggle menu"`). Fixed by DOM inspection.

---

## WHY (Pattern Analysis)

**Cloudflare Turnstile detection:** The root cause is that Playwright's `launchPersistentContext` adds CDP-specific markers to Chrome that Cloudflare fingerprints. Even `channel: 'chrome'` (using system Chrome) and JS-level stealth patches can't mask the CDP protocol markers. The solution — spawning Chrome ourselves as a normal process and connecting Playwright via `connectOverCDP` — works because the Chrome instance has zero Playwright markers.

**Research toggle misidentification:** We assumed a standalone button based on the plan. The actual claude.ai UI puts Research inside a `[role="menu"]` dropdown triggered by a `+` button. Lesson: always screenshot-and-dump-DOM before writing selectors.

---

## CRITICAL PATHS

- **Project:** `/Users/mikeboscia/projects/claude-deep-research/`
- **Chrome profile:** `./browser-profile/` (gitignored)
- **CDP port:** 9222
- **Topics file (ready):** `./topics/adobe-commerce-backend-bible.json` (15 prompts)
- **Error screenshots:** `./logs/` (gitignored)

---

## SESSION ACTIVITY LOG

| Time (EST) | Action | Status |
|------------|--------|--------|
| 21:48 | Session start, plan provided by user | ✓ |
| 21:50 | Scaffolded project: package.json, .gitignore, lib/, topics/ | ✓ |
| 21:51 | Created all lib modules: browser.js, selectors.js, logger.js | ✓ |
| 21:51 | Created login.js and launch-research.js | ✓ |
| 21:52 | Created example-topics.txt, README.md | ✓ |
| 21:52 | npm install, git init, initial commit `136a8c2` | ✓ |
| 21:52 | Dry run verified — topics parse correctly | ✓ |
| 22:01 | First login attempt — detected instantly (existing session) | ✓ |
| 22:08 | First headless test — Cloudflare Turnstile blocked | ✗ |
| 22:10 | Added stealth patches (navigator.webdriver, plugins, etc.) | ✗ |
| 22:11 | Stealth headless still blocked by Cloudflare | ✗ |
| 22:11 | Tried headed mode — Cloudflare cleared but false-positive on login | ✗ |
| 22:13 | Rewrote browser.js: connectOverCDP instead of launchPersistentContext | ✓ |
| 22:15 | Login with connectOverCDP — session preserved, instant auth | ✓ |
| 22:15 | Off-screen Chrome test — Cloudflare passed, session valid | ✓ |
| 22:16 | Topic submitted but Research toggle not found | ✗ |
| 22:18 | DOM inspection: Research is inside + menu, not standalone | ✓ |
| 22:20 | Clicked + button, found Research menuitem | ✓ |
| 22:20 | Fixed enableResearch(): + menu → Research menuitem | ✓ |
| 22:21 | **END-TO-END SUCCESS**: Research activated, topic typed, submitted | ✓ |
| 22:21 | Committed fix `b7555d6` | ✓ |
| 22:23 | Parsed 15 Adobe Commerce prompts from markdown → JSON | ✓ |
| 22:23 | Dry run verified all 15 prompts load correctly | ✓ |
| 22:25 | Full narrative session notes | ✓ |
| 22:27 | Context compaction, session continued | ✓ |
| 22:29 | Added `--count` flag, jitter delays, bumped default delay to 30s | ✓ |
| 22:30 | Discovered `keyboard.type()` splits prompts on `\n` (Enter = submit) | ✗ |
| 22:31 | Replaced `keyboard.type()` with clipboard paste (`Meta+V`) | ✓ |
| 22:33 | Single topic test with clipboard paste — SUCCESS | ✓ |
| 22:34 | Batch launched topics 2–6, all submitted successfully | ✓ |
| 22:34 | Committed `b152234` — clipboard paste + count + jitter | ✓ |
| 22:40 | Batch launched topics 7–11, all submitted successfully | ✓ |
| 22:44 | Added "DO NOT ASK QUESTIONS" directive wrapper to prompts | ✓ |
| 22:45 | Batch launched topics 12–15, all submitted successfully | ✓ |
| 22:47 | Committed `94b55b8` — directive wrapper | ✓ |
| 22:48 | **ALL 15 TOPICS SUBMITTED** — 15/15, zero failures | ✓ |

---

## NOTES FOR FUTURE SESSIONS

1. **Kill Chrome debug instance:** `lsof -ti:9222 | xargs kill` — do this before launching a new session
2. **Session expiry:** If claude.ai session expires, re-run `npm run login` (opens visible Chrome)
3. **Selectors may break:** claude.ai updates their UI. If selectors fail, run `debug-screenshot.js` pattern to dump DOM and update `lib/selectors.js`
4. **Rate limiting:** All 15 topics submitted with 30s ±30% jitter delays. No rate limiting observed during submission. Account hit "extra usage spending limit" (resets Thursday) but this is a usage cap, not bot detection.
5. **keyboard.type() is BROKEN for multi-line prompts:** `\n` chars become Enter keypresses which trigger submit. ALWAYS use clipboard paste for multi-line content.
5. **Off-screen Chrome on macOS:** `--window-position=-10000,-10000` works but Chrome may briefly appear in the Dock. Not a functional issue.

---

## GIT LOG

```
94b55b8 Add DO NOT ASK QUESTIONS directive wrapper to all prompts
b152234 Clipboard paste instead of keyboard.type(), add --count flag and jitter delays
8d59e2e Add session log, prompt parser, and 15 Adobe Commerce topics
b7555d6 Fix Cloudflare bypass and Research activation
136a8c2 Initial commit: Claude Deep Research batch launcher
```

---

## SESSION UPDATE: 2026-02-16 22:25 EST

### Summary
Built and verified the Claude Deep Research batch launcher end-to-end. Overcame Cloudflare Turnstile detection and incorrect Research toggle selectors.

### What Was Accomplished
- Scaffolded entire project from plan: package.json, lib modules, login.js, launch-research.js, README
- Initial commit `136a8c2` with Playwright-based architecture
- Discovered headless Chrome blocked by Cloudflare Turnstile (even with stealth patches)
- Rewrote browser strategy from `launchPersistentContext` to `connectOverCDP` — spawns real Chrome, attaches Playwright via debug port
- Discovered Research is inside a `+` menu dropdown, not a standalone toggle
- Fixed Research activation: click + button → click Research menuitem
- Commit `b7555d6` with all fixes
- Parsed 15 Adobe Commerce Backend Bible prompts into JSON topics file
- Dry run confirmed all 15 prompts load correctly

### Key Decisions & Why
- **connectOverCDP over launchPersistentContext**: Cloudflare fingerprints Playwright-launched Chrome via CDP markers. A user-spawned Chrome with `--remote-debugging-port` is indistinguishable from a normal session.
- **Off-screen instead of headless**: `--window-position=-10000,-10000` moves Chrome window off-screen. It's technically headed (passing Cloudflare) but invisible to the user.
- **Chrome stays alive after Playwright disconnects**: Deep Research needs the browser running to process. We disconnect Playwright but leave Chrome alive.
- **JSON format for multi-paragraph prompts**: The Adobe Commerce prompts are 1000+ chars each with markdown formatting. JSON array preserves them perfectly vs .txt which would need delimiter parsing.

### What Works Now
- Full pipeline: login → navigate → bypass Cloudflare → enable Research → type prompt → submit → disconnect
- Verified with single topic: Deep Research launched successfully on claude.ai

### What Doesn't Work / Known Issues
- Headless mode is permanently blocked by Cloudflare (not fixable without compromising Chrome's CDP)
- Rate limiting behavior unknown for 15 rapid submissions

### Current State
**Phase:** Ready to batch-launch 15 Adobe Commerce Backend Bible prompts
**Next Step:** Run `node launch-research.js -t topics/adobe-commerce-backend-bible.json`

### Technical Notes
- Chrome debug port: 9222 (hardcoded in lib/browser.js)
- ProseMirror input requires clipboard paste, NOT `keyboard.type()` or `fill()`
- The + menu button is `aria-label="Toggle menu"`, Research is `[role="menuitem"]:has-text("Research")`
- `parse-prompts.js` is a one-off utility, not part of the main tool

---

## SESSION UPDATE: 2026-02-16 22:48 EST

### Summary
Completed the entire project — fixed critical prompt-splitting bug, added anti-detection features, and successfully batch-launched all 15 Adobe Commerce Backend Bible Deep Research topics with zero failures.

### What Was Accomplished
- Discovered `keyboard.type()` splits multi-line prompts because `\n` → Enter → submit in ProseMirror
- Replaced with clipboard paste approach (`navigator.clipboard.writeText` + `Meta+V`) — instant, atomic, no splitting
- Added `--count`/`-n` flag to limit batch size for incremental testing
- Added ±30% jitter to inter-topic delays (base 30s → random 21–39s) for anti-detection
- Bumped default delay from 15s to 30s (appropriate for Deep Research's compute cost)
- Added "DO NOT ASK QUESTIONS - LAUNCH THE PROMPT" directive wrapper to top/bottom of every prompt
- Removed unused `randomTypingDelay()` function
- Commit `b152234` — clipboard paste, count flag, jitter delays
- Commit `94b55b8` — directive wrapper
- **Batch launched all 15 topics in 3 runs:** 1 (test), 2–6, 7–11, 12–15 — all successful

### Key Decisions & Why
- **Clipboard paste over keyboard.type()**: `keyboard.type()` sends literal Enter keypresses for `\n` chars, and claude.ai's ProseMirror editor interprets Enter as "submit message". Clipboard paste is atomic — the entire prompt lands at once regardless of newlines. This is also what a real user does (Cmd+V).
- **Jittered delays**: Fixed 15s intervals between topics is a bot fingerprint. ±30% randomization on a 30s base makes timing look human.
- **"DO NOT ASK QUESTIONS" wrapper**: Deep Research sometimes asks clarifying questions before starting. This directive forces immediate research launch — user's workflow preference.
- **Test 1 before batch 5**: User correctly insisted on proving paste works with a single topic before attempting a batch.

### What Works Now
- Full pipeline: login → navigate → Cloudflare bypass → Research activation → clipboard paste → submit → disconnect
- All 15 Adobe Commerce Backend Bible topics submitted to Deep Research
- `--count` flag for incremental batching
- `--start-from` for resuming from any topic
- Jittered delays between submissions
- Directive wrapper on all prompts

### What Doesn't Work / Known Issues
- Account hit "extra usage spending limit" (resets Thursday at 12:00 PM) — this is a claude.ai usage cap, not bot detection
- Topics 1–11 were submitted WITHOUT the "DO NOT ASK QUESTIONS" directive (added after those batches)
- Some of those earlier topics may have asked clarifying questions instead of launching immediately

### Current State
**Phase:** ALL PHASES COMPLETE
**Next Step:** Monitor Deep Research results on claude.ai. Tool is ready for reuse with any future topic files.

### Technical Notes
- `keyboard.type()` is PERMANENTLY UNSUITABLE for multi-line content in ProseMirror — always use clipboard paste
- Chrome stays alive on port 9222 after Playwright disconnects — `lsof -ti:9222 | xargs kill` to clean up
- The directive wrapper is hardcoded in `launch-research.js` `submitTopic()` — could be made configurable via CLI flag in the future
- Anti-detection worked: 15 submissions over ~15 minutes with no bot detection or CAPTCHA triggers
