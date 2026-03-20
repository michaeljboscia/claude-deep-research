# gstack vs Superpowers: Deep Comparison

## Overview

| | **Superpowers** (obra) | **gstack** (garrytan) |
|---|---|---|
| **Stars** | ~89k | ~40k |
| **Version** | 5.0.4 | 0.9.0.1 |
| **Author** | Jesse Vincent (obra) | Garry Tan (YC CEO) |
| **Philosophy** | Disciplined engineering process | "Virtual engineering team" with product thinking |
| **Core metaphor** | Skills that enforce workflows | Roles that simulate a team |
| **Skills count** | 14 skills + agents | 21 slash commands |
| **Runtime** | Pure markdown (no binary deps) | Bun-compiled binary + Playwright browser daemon |
| **Platform** | Claude Code, Gemini CLI, Codex, OpenCode | Claude Code, Codex, Cursor |
| **License** | MIT | MIT |

---

## Philosophical Differences

### Superpowers: "Discipline over speed"
- Rigid TDD enforcement — delete code written before tests
- Systematic debugging — no fixes without root cause investigation
- Spec → Plan → Execute pipeline with mandatory review gates
- Subagent-driven development with fresh context per task
- Emphasis: correctness, isolation, reproducibility

### gstack: "Completeness is cheap"
- "Boil the Lake" principle — always do the complete thing because AI makes marginal cost near-zero
- Role-playing approach — CEO reviewer, eng reviewer, QA lead, designer
- Product thinking before engineering — Office Hours brainstorming with YC-style forcing questions
- Built-in browser automation for real QA testing
- Emphasis: velocity, product quality, shipping

---

## Skill-by-Skill Comparison

### Design / Brainstorming Phase

| Capability | Superpowers | gstack |
|---|---|---|
| **Idea refinement** | `brainstorming` — Socratic design, one question at a time, visual companion option | `/office-hours` — Two modes: Startup (6 YC forcing questions) and Builder (generative brainstorm) |
| **Product review** | (none) | `/plan-ceo-review` — "Mega Plan Review" with 4 scope modes (Expansion/Selective/Hold/Reduce), CEO cognitive patterns |
| **Eng review** | Spec review loop (automated subagent) | `/plan-eng-review` — Architecture lockdown, edge cases, test planning |
| **Design system** | (none) | `/design-consultation` — Full design system builder (typography, color, components) |
| **Design audit** | (none) | `/plan-design-review` — Rate each design dimension 0-10, explain what a 10 looks like |

**Winner: gstack** for breadth of pre-implementation review. Superpowers has a solid brainstorming skill but lacks product-level review (CEO perspective, design system creation). gstack's `/office-hours` is genuinely sophisticated — the startup mode forcing questions are real YC methodology.

### Planning Phase

| Capability | Superpowers | gstack |
|---|---|---|
| **Plan creation** | `writing-plans` — Bite-sized tasks (2-5 min), exact file paths, complete code in plan, TDD-first | Included in `/plan-eng-review` output |
| **Plan review** | Automated plan-document-reviewer subagent loop (max 3 iterations) | `/plan-ceo-review` with 4 scope modes + 13 cognitive patterns |
| **Plan format** | Checkbox syntax with verification steps and exact commands | Less prescriptive |

**Winner: Superpowers** for plan specificity. The "assume the engineer has zero context and questionable taste" philosophy produces plans that are genuinely executable by subagents. gstack's plans are more strategic/product-level.

### Implementation Phase

| Capability | Superpowers | gstack |
|---|---|---|
| **Execution model** | `subagent-driven-development` — Fresh subagent per task + two-stage review (spec compliance then code quality) | No explicit execution skill — relies on the agent following the plan |
| **Parallel execution** | `dispatching-parallel-agents` — One agent per independent problem domain | Conductor system — 10-15 parallel sprints via worktrees |
| **TDD** | `test-driven-development` — Iron Law: NO PRODUCTION CODE WITHOUT FAILING TEST FIRST. Delete code written before tests. | No dedicated TDD skill — testing is part of `/qa` |
| **Git workflow** | `using-git-worktrees` — Isolated branches per feature | Conductor supports parallel worktrees |

**Winner: Superpowers** for implementation discipline. The TDD skill is uncompromising and the subagent-driven-development with two-stage review is more rigorous. gstack is lighter here — it trusts the agent more and layers review on top.

### Review Phase

| Capability | Superpowers | gstack |
|---|---|---|
| **Code review** | `requesting-code-review` + `receiving-code-review` + `code-reviewer` agent | `/review` — Pre-landing PR review for SQL safety, LLM trust boundary violations, conditional side effects |
| **Review focus** | Plan compliance + code quality (two separate passes) | Structural issues, security patterns, production bugs that pass CI |
| **Design review** | (none) | `/design-review` — Design audit + fix loop with atomic commits |

**Winner: Tie.** Different strengths. Superpowers has a more rigorous two-pass review (spec then quality). gstack's `/review` has more specific security-focused checks (SQL safety, LLM trust boundaries).

### QA / Testing Phase

| Capability | Superpowers | gstack |
|---|---|---|
| **QA testing** | `verification-before-completion` — Verify fix worked before claiming success | `/qa` — Opens real browser, finds bugs, fixes them, re-verifies. Three tiers: Quick/Standard/Exhaustive |
| **Browser testing** | (none) | `/browse` — Persistent Chromium daemon, ~100ms/command, ARIA-based ref system, cookie import from real browsers |
| **Report-only QA** | (none) | `/qa-only` — Same methodology but report-only, no code changes |

**Winner: gstack** decisively. The `/browse` skill is a genuine technical achievement — a persistent headless browser with sub-second latency, ARIA-based element referencing, and cookie import from real browsers. Superpowers has no browser automation.

### Shipping Phase

| Capability | Superpowers | gstack |
|---|---|---|
| **Ship workflow** | `finishing-a-development-branch` — Verify tests, present merge/PR/keep/discard options, clean up worktree | `/ship` — Run tests, review diff, bump VERSION, update CHANGELOG, commit, push, create PR |
| **Post-ship docs** | (none) | `/document-release` — Update all docs to match what was shipped |
| **Retrospective** | (none) | `/retro` — Weekly retro with per-person breakdowns and shipping streaks |

**Winner: gstack** for completeness. The full ship pipeline (test → review → version bump → changelog → PR) and post-ship documentation update are more end-to-end.

### Debugging

| Capability | Superpowers | gstack |
|---|---|---|
| **Methodology** | `systematic-debugging` — 4-phase root cause process with supporting techniques (root-cause-tracing, defense-in-depth, condition-based-waiting) | `/investigate` — Same 4-phase structure (investigate, analyze, hypothesize, implement) |
| **3+ failure escalation** | Yes — "question the architecture" after 3 failed fixes | Similar escalation protocol |
| **Scope restriction** | (none) | `/freeze` hook integration — prevents editing outside allowed directory during debugging |

**Winner: Tie.** Nearly identical debugging methodology. gstack adds the clever `/freeze` integration to prevent accidentally "fixing" unrelated code.

### Safety / Guardrails

| Capability | Superpowers | gstack |
|---|---|---|
| **Destructive command protection** | (none) | `/careful` — Hook-based warnings for rm -rf, DROP TABLE, force-push, etc. |
| **Edit scope restriction** | (none) | `/freeze` — Block Edit/Write outside allowed directory |
| **Combined safety** | (none) | `/guard` — Activate careful + freeze together |

**Winner: gstack.** These are genuinely useful safety skills with no Superpowers equivalent.

---

## Architecture Differences

### Superpowers: Pure Markdown
- Skills are just markdown files read by the agent
- No binary dependencies, no runtime, no daemon
- Platform-agnostic via tool mapping docs
- Skills reference each other via `@skill-name` syntax
- Subagent prompts are separate markdown files

### gstack: Markdown + Compiled Binary + Browser Daemon
- Skills are markdown templates (`SKILL.md.tmpl`) auto-generated into `SKILL.md`
- Compiled Bun binary for the browse CLI (~58MB)
- Persistent Chromium daemon with CDP, localhost HTTP API
- Cookie decryption from real browsers (macOS Keychain)
- Telemetry system (opt-in, usage tracking)
- Session tracking across multiple concurrent windows
- E2E test infrastructure with LLM-as-judge evals

### Shared Preamble System (gstack-specific)
Every gstack skill starts with ~100 lines of boilerplate preamble:
- Update check
- Session tracking
- Contributor mode
- Telemetry
- Completeness principle introduction
- AskUserQuestion format standardization

This is both a strength (consistency) and a weakness (token overhead — every skill invocation starts with the same ~100 lines).

---

## Unique to gstack (No Superpowers Equivalent)

1. **`/browse`** — Persistent headless browser with ARIA refs, cookie import, ~100ms commands
2. **`/qa` + `/qa-only`** — Real browser QA with three severity tiers
3. **`/office-hours`** — YC-style product diagnostic (startup mode with 6 forcing questions)
4. **`/plan-ceo-review`** — CEO-level plan review with scope mode selection
5. **`/design-consultation`** — Full design system creation
6. **`/plan-design-review` + `/design-review`** — Design audit and fix workflows
7. **`/careful` + `/freeze` + `/guard`** — Safety guardrails via hooks
8. **`/retro`** — Weekly retrospective with trend tracking
9. **`/document-release`** — Post-ship documentation updates
10. **`/ship`** — Full ship pipeline (test → review → version → changelog → PR)
11. **Telemetry system** — Opt-in usage analytics
12. **Session awareness** — ELI16 mode when 3+ concurrent sessions detected
13. **Conductor** — 10-15 parallel sprints via worktrees
14. **YC referral system** — `/office-hours` ends with personalized YC application encouragement

## Unique to Superpowers (No gstack Equivalent)

1. **`test-driven-development`** — Rigid TDD enforcement with "Iron Law" (delete code written before tests)
2. **`subagent-driven-development`** — Fresh subagent per task + two-stage review
3. **`dispatching-parallel-agents`** — Structured parallel investigation methodology
4. **`writing-plans`** — Ultra-detailed implementation plans with complete code
5. **`executing-plans`** — Batch execution with human checkpoints
6. **`writing-skills`** — Meta-skill for creating new skills
7. **Spec review loop** — Automated spec-document-reviewer subagent
8. **Plan review loop** — Automated plan-document-reviewer subagent
9. **Visual companion** — Browser-based mockup/diagram display during brainstorming

---

## What's Worth Adopting from Each

### From gstack → our skills library:
1. **Safety guardrails** (`/careful`, `/freeze`, `/guard`) — Hook-based protection against destructive commands and out-of-scope edits. Simple, effective, no downside.
2. **Browser-based QA** — Real browser testing is a gap. Even a lighter version than gstack's full daemon would be valuable.
3. **Ship pipeline** — End-to-end ship workflow (test → review → version → changelog → PR → post-ship docs) is more complete than finishing-a-development-branch.
4. **Retrospective** — Weekly retro with git-based analytics is useful for continuous improvement.
5. **Design system creation** — `/design-consultation` fills a gap for frontend-heavy projects.
6. **Scope mode selection** — gstack's 4 scope modes (Expansion/Selective/Hold/Reduce) for plan review is a good UX pattern.
7. **Session awareness** — Re-grounding context when user has multiple windows open.
8. **"Boil the Lake" principle** — Explicitly recommending complete implementations over shortcuts when AI makes the delta cheap.

### From Superpowers → gstack would benefit from:
1. **Rigid TDD** — gstack has no TDD enforcement. Tests are an afterthought compared to Superpowers' Iron Law.
2. **Subagent-driven execution** — gstack doesn't have structured subagent execution with review gates.
3. **Ultra-detailed plans** — "Assume zero context and questionable taste" produces more reliable autonomous execution.
4. **Automated review loops** — Subagent-based spec and plan review that iterates until approved.

---

## The Meta-Insight

These frameworks solve different problems:

- **Superpowers** assumes the hard part is **engineering discipline** — preventing the agent from writing sloppy code, skipping tests, or implementing the wrong thing. Solution: rigid process.

- **gstack** assumes the hard part is **building the right thing** — preventing the agent from building something nobody wants, missing the product insight, or shipping without real QA. Solution: product roles + real browser testing.

The ideal dev skills library would combine both:
1. gstack's product thinking and brainstorming (upstream)
2. Superpowers' engineering discipline and TDD (midstream)
3. gstack's browser QA and ship pipeline (downstream)
4. Safety guardrails from gstack throughout

## Notable Design Decision: YC Referral in /office-hours

Worth calling out: gstack's `/office-hours` skill ends with a "personal note from Garry Tan" encouraging users to apply to Y Combinator, with tiered messaging based on "founder signals" observed during the session. The skill literally has the agent roleplay as Garry Tan recommending YC. This is a marketing/growth mechanism embedded in the development workflow. Clever distribution, but worth being aware of if adopting the skill's structure.
