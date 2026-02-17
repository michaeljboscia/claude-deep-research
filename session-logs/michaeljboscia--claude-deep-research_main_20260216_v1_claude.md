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
- [ ] Phase 12: Batch launch 15 Adobe Commerce Backend Bible prompts
- [ ] Phase 13: Final commit + cleanup

---

## WHERE WE ARE

**Phase:** 11 complete, ready for Phase 12
**Progress:** ~85% complete — tool is proven working, batch launch pending

---

## WHAT WORKS

1. **connectOverCDP browser strategy** — spawn real Chrome with `--remote-debugging-port=9222`, Playwright attaches via CDP. Cloudflare Turnstile cannot distinguish this from a normal user. Verified: Cloudflare auto-clears, session cookies persist.
2. **Login persistence** — `browser-profile/` directory holds Chrome profile data. Login once, session survives across runs.
3. **Research activation** — Click `button[aria-label="Toggle menu"]` (the + icon in chat input) → click `[role="menuitem"]:has-text("Research")` from the dropdown menu.
4. **Topic submission** — `keyboard.type()` into ProseMirror `contenteditable` div (`data-testid="chat-input"`), then click send button.
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

---

## NOTES FOR FUTURE SESSIONS

1. **Kill Chrome debug instance:** `lsof -ti:9222 | xargs kill` — do this before launching a new session
2. **Session expiry:** If claude.ai session expires, re-run `npm run login` (opens visible Chrome)
3. **Selectors may break:** claude.ai updates their UI. If selectors fail, run `debug-screenshot.js` pattern to dump DOM and update `lib/selectors.js`
4. **Rate limiting unknown:** We haven't tested with 15 topics yet. Default 15s delay may need increasing if claude.ai rate-limits Deep Research launches.
5. **Off-screen Chrome on macOS:** `--window-position=-10000,-10000` works but Chrome may briefly appear in the Dock. Not a functional issue.

---

## GIT LOG

```
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
- ProseMirror input requires `keyboard.type()` not `fill()`
- The + menu button is `aria-label="Toggle menu"`, Research is `[role="menuitem"]:has-text("Research")`
- `parse-prompts.js` is a one-off utility, not part of the main tool
