# Exploration: obra/superpowers

> **Repository:** https://github.com/obra/superpowers
> **Version:** 5.0.4
> **License:** MIT
> **Stars:** ~88.8k | **Forks:** ~7k
> **Primary languages:** Shell (55.1%), JavaScript (32.0%)
> **Author:** Jesse Vincent (obra)

## What is Superpowers?

Superpowers is an **agentic skills framework** — a system of composable, structured skills that guide AI coding agents through a complete software development lifecycle. Instead of letting agents jump straight into writing code, Superpowers enforces a disciplined workflow: **brainstorm → plan → implement (with TDD) → review → complete**.

It's platform-agnostic and works across Claude Code (official marketplace), Cursor, Codex, OpenCode, and Gemini CLI.

---

## Repository Structure

```
obra/superpowers/
├── skills/                          # 14 composable skill modules
│   ├── brainstorming/
│   ├── writing-plans/
│   ├── executing-plans/
│   ├── subagent-driven-development/
│   ├── dispatching-parallel-agents/
│   ├── test-driven-development/
│   ├── systematic-debugging/
│   ├── using-git-worktrees/
│   ├── finishing-a-development-branch/
│   ├── requesting-code-review/
│   ├── receiving-code-review/
│   ├── verification-before-completion/
│   ├── using-superpowers/
│   └── writing-skills/
├── agents/
│   └── code-reviewer.md             # Subagent for code review
├── commands/
│   ├── brainstorm.md                # (deprecated → use skill)
│   ├── execute-plan.md
│   └── write-plan.md
├── hooks/
│   ├── hooks.json
│   ├── hooks-cursor.json
│   ├── run-hook.cmd
│   └── session-start
├── docs/
│   ├── plans/
│   ├── superpowers/
│   ├── windows/
│   ├── README.codex.md
│   ├── README.opencode.md
│   └── testing.md
├── tests/
│   ├── brainstorm-server/
│   ├── claude-code/
│   ├── explicit-skill-requests/
│   ├── opencode/
│   ├── skill-triggering/
│   └── subagent-driven-dev/
├── .claude-plugin/                  # Claude Code marketplace plugin
├── .cursor-plugin/                  # Cursor integration
├── .codex/                          # Codex integration
├── .opencode/                       # OpenCode integration
├── CHANGELOG.md
├── GEMINI.md                        # Gemini CLI integration
├── gemini-extension.json
├── package.json
└── README.md
```

---

## Core Workflow (7 Stages)

The system follows a structured process that maps to a real software development lifecycle:

### Stage 1: Brainstorming
**Skill:** `brainstorming`

Transforms ideas into approved designs before any code is written. The process:
1. Review project context (files, docs, recent work)
2. Ask clarifying questions — **one at a time**, prefer multiple-choice
3. Present 2-3 approach options with trade-offs and a recommendation
4. Present design in digestible sections, seeking approval after each
5. Write spec to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
6. Dispatch spec review (max 3 iterations before escalating to human)
7. Get user approval

**Hard gate:** "Do NOT invoke any implementation skill, write any code, scaffold any project, or take any implementation action until you have presented a design and the user has approved it."

The only permitted exit transition is → `writing-plans`.

### Stage 2: Git Worktrees
**Skill:** `using-git-worktrees`

Creates isolated workspaces sharing the same repository. The skill:
- Checks for existing `.worktrees/` or `worktrees/` directories
- Checks `CLAUDE.md` for preferences
- Asks user if neither exists
- Verifies the directory is in `.gitignore`
- Creates worktree, runs project setup (auto-detects package.json, Cargo.toml, etc.)
- Runs tests to establish a **clean baseline**

### Stage 3: Writing Plans
**Skill:** `writing-plans`

Breaks work into focused, bite-sized tasks (2-5 minutes each). Requirements:
- Mandatory header with goal, architecture, and tech stack
- File mapping before task definition
- Exact file paths, complete code samples, precise commands
- Each step isolates a single action: write test → verify failure → implement → verify pass → commit
- Plans undergo single-reviewer dispatch before execution (max 3 iteration fix loop)

Key philosophy: "Treat engineers as skilled but context-naive developers."

### Stage 4: Execution
**Skill:** `subagent-driven-development` (preferred) or `executing-plans`

**Subagent-driven development** dispatches fresh subagents for individual tasks:
1. Extract all tasks from the plan upfront
2. Per task: dispatch implementer → spec reviewer → code quality reviewer
3. Handle reviewer feedback via fix cycles
4. Complete remaining tasks before final code review

Model selection strategy: cheap models for isolated 1-2 file tasks, standard for multi-file integration, most capable for architecture and review.

**Executing plans** is the simpler alternative: load plan → execute tasks sequentially → finish. Recommends using subagent-driven development when available.

### Stage 5: Test-Driven Development
**Skill:** `test-driven-development`

Enforces the RED-GREEN-REFACTOR cycle throughout implementation:
- **RED:** Write a failing test demonstrating desired behavior
- **GREEN:** Write minimal code to pass the test
- **REFACTOR:** Clean up while maintaining green tests

Iron law: "NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST." If code exists before tests, delete it completely. The skill explicitly counters common rationalizations ("too simple to test", "I'll test after", "already manually tested").

### Stage 6: Code Review
**Skills:** `requesting-code-review`, `receiving-code-review`
**Agent:** `code-reviewer.md`

**Requesting review** dispatches the code-reviewer subagent with base/head SHAs and implementation description. Mandatory after each task in subagent-driven development, major features, and before merges.

**Receiving review** emphasizes technical rigor over performative agreement. Key principles:
- "Verify before implementing. Ask before assuming."
- External feedback = suggestions to evaluate, not orders to follow
- Pushback is appropriate when suggestions break functionality or lack context
- No blanket agreement ("You're absolutely right!") — restate technical requirements instead

The **code-reviewer agent** evaluates: plan alignment, code quality (patterns, error handling, type safety), architecture (SOLID, separation of concerns), and documentation. Issues are categorized as Critical (must fix), Important (should fix), or Suggestions.

### Stage 7: Branch Completion
**Skill:** `finishing-a-development-branch`

Process: verify tests → present 4 options → execute → clean up.

Options presented:
1. Merge back to base branch locally
2. Push and create a Pull Request
3. Keep branch as-is (user handles later)
4. Discard (requires typed 'discard' confirmation)

---

## Supporting Skills

### Systematic Debugging
**Skill:** `systematic-debugging`

A rigorous 4-phase debugging methodology:

1. **Root Cause Investigation:** Read errors carefully, reproduce consistently, check recent changes, gather evidence at component boundaries, trace data flow
2. **Pattern Analysis:** Find working examples, compare against references, identify differences
3. **Hypothesis and Testing:** Form single hypothesis, test minimally (one variable at a time), verify
4. **Implementation:** Create failing test case, implement single fix, verify

**Critical rule:** After 3+ failed fixes, stop and question the architecture — it's likely a design problem, not a bug.

Iron law: "NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST."

### Dispatching Parallel Agents
**Skill:** `dispatching-parallel-agents`

For 2+ independent tasks without shared state. Pattern:
1. Identify independent problem domains
2. Create focused agent tasks (specific scope, clear goal, constraints)
3. Dispatch in parallel
4. Review and integrate results

Key: agents get **isolated context** — only what they need, never full session history.

### Verification Before Completion
**Skill:** `verification-before-completion`

Non-negotiable rule: "NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE."

Before stating anything passes/works/is fixed:
1. Identify what command proves the claim
2. Execute it freshly
3. Read full output and check exit code
4. Verify output actually supports the claim

Expressions like "should work", "probably passes", "looks correct" are insufficient.

### Using Superpowers (Meta-Skill)
**Skill:** `using-superpowers`

The orchestrator skill that enforces: "If you think there is even a 1% chance a skill might apply, you ABSOLUTELY MUST invoke the skill."

Priority hierarchy:
1. User's explicit instructions (highest)
2. Superpowers skills (override default behavior)
3. Default system prompt (lowest)

Identifies 12 thought patterns that indicate improper skill avoidance (e.g., "This is just a simple question", "Let me gather information first").

### Writing Skills (Meta-Skill)
**Skill:** `writing-skills`

"Writing skills IS Test-Driven Development applied to process documentation."

The TDD mapping:
- Test case → Pressure scenario with subagent
- Production code → Skill document (SKILL.md)
- RED → Agent violates rule without skill (baseline)
- GREEN → Agent complies with skill present
- REFACTOR → Close loopholes while maintaining compliance

Key insight on Claude Search Optimization (CSO): Descriptions that summarize workflow create shortcuts Claude will take, causing it to skip the full skill content. Descriptions should only contain triggering conditions ("Use when...").

---

## Key Design Principles

1. **Design before code:** Every task starts with brainstorming and explicit design approval
2. **Test-first always:** No production code without a failing test
3. **Systematic over ad-hoc:** Structured processes beat improvisation
4. **Evidence over confidence:** Verify before claiming success
5. **Reduce complexity:** Design for isolation, one clear purpose per unit
6. **Isolated context for subagents:** Fresh agents with only necessary context, not full history
7. **Skills are non-negotiable:** If a skill might apply, use it
8. **Root cause over symptoms:** Never fix symptoms without understanding causes
9. **Frequent small commits:** Each step gets its own commit
10. **Process documentation follows TDD too:** Skills are tested against pressure scenarios

---

## Architecture Insights

### Skill Discovery
Skills use YAML frontmatter with `name` and `description` fields. The description starts with "Use when..." and contains only triggering conditions — never workflow summaries. This is critical because Claude may shortcut workflow descriptions instead of reading the full skill.

### Platform Abstraction
The repository supports 5+ platforms through platform-specific configuration directories (`.claude-plugin/`, `.cursor-plugin/`, `.codex/`, `.opencode/`, `gemini-extension.json`). Skills themselves are platform-agnostic markdown files.

### Testing Infrastructure
Tests are organized by concern:
- `brainstorm-server/` — Tests for the brainstorming workflow
- `claude-code/` — Claude Code-specific tests
- `explicit-skill-requests/` — Tests that skills are invoked when requested
- `skill-triggering/` — Tests that skills auto-trigger on matching conditions
- `subagent-driven-dev/` — Tests for the subagent workflow

### Hooks System
The `hooks/` directory provides session-start hooks and platform-specific hook configurations (JSON for Claude Code and Cursor, CMD for Windows).

---

## What Makes Superpowers Notable

1. **88.8k stars** — One of the most popular AI coding agent frameworks
2. **Process over tools:** It doesn't provide code libraries — it provides *discipline*. The skills are behavioral guidelines that make AI agents more rigorous
3. **Anti-rationalization design:** Skills explicitly counter the ways agents try to skip steps, with detailed "Red Flags" and "Common Rationalizations" tables
4. **Meta-recursive:** The skill for writing skills follows TDD, tested against pressure scenarios where agents try to skip the process
5. **Platform breadth:** Works across Claude Code, Cursor, Codex, OpenCode, and Gemini CLI
6. **Real-world grounded:** Skills reference actual debugging sessions and include concrete impact metrics (e.g., "systematic debugging: 15-30 min fix vs. random fixes: 2-3 hours of thrashing")
