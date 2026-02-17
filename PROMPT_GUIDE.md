# Prompt Design Guide for Batch Deep Research

How to structure prompts for large, multi-part research investigations using this tool.

## The Core Problem

Claude Deep Research is powerful but has limits. A single prompt that asks for everything — "Write me a complete guide to Magento 2" — will either produce shallow results, hit output limits, or choke trying to cover too much ground. The solution is **scoping and splitting**.

## Principles

### 1. Split by Subsystem, Not by Depth

**Wrong:** Split a topic into "beginner", "intermediate", "advanced"
**Right:** Split a topic into distinct subsystems that can stand alone

Example — instead of one massive "Adobe Commerce Architecture" prompt:
- BE1: Module system, service contracts, dependency injection
- BE3: Indexing, caching, full page cache
- BE9: Admin panel, UI components, PageBuilder

Each subsystem is self-contained. A reader can use one without needing the others.

### 2. Further Split if a Subsystem is Still Too Broad

If a single subsystem prompt is over 4000 characters or covers more than 3 major areas, split it again into focused thirds:

- BE1a: Module architecture & declarative schema
- BE1b: Service contracts, repositories & extension attributes
- BE1c: Dependency injection & the plugin system

Each sub-prompt should target a single coherent concept cluster.

### 3. Target Under 10,000 Words of Output

Deep Research produces its best work when the expected output is under 10,000 words (~40KB). Beyond that, quality drops — sections get rushed, examples get shallow, and the research phase doesn't dig deep enough on any single topic.

If your prompt would naturally produce more than 10,000 words, that's a signal to split it further.

### 4. Be Exhaustively Specific About What You Want

Don't say "cover caching." Say:

```
**Cache Types:**
- Complete reference for every built-in cache type:
  - `config` — merged XML configuration
  - `layout` — compiled layout XML
  - `block_html` — rendered block output
  ...
```

The more specific your outline, the better Deep Research performs. It uses your structure as a research plan. Vague prompts get vague results.

### 5. Include a Consistent Output Format Directive

End every prompt with the same format instruction so all parts of your investigation have a uniform structure:

```
For each topic, provide: (1) How it works technically, (2) Current best
practices (2024-2025), (3) Common mistakes and anti-patterns, (4) Complete
code examples, (5) Performance implications.
```

This gives Deep Research a rubric to follow for every section.

### 6. Include a Purpose Statement

Start each prompt with a one-sentence framing of what you're building and why this piece matters:

```
Create a focused technical reference for the Adobe Commerce / Magento 2
indexing system. Indexing is the mechanism that transforms normalized
database data into optimized, denormalized structures for fast storefront
queries.
```

This anchors the research and prevents it from drifting into tangential territory.

## Prompt Structure Template

```
[Purpose statement — what this guide covers and why it matters]

Cover these areas in exhaustive detail:

**[Area 1 Name]:**
- [Specific subtopic]
- [Specific subtopic]
- [Specific subtopic with technical detail: `class names`, `file paths`, `commands`]

**[Area 2 Name]:**
- [Specific subtopic]
- [Specific subtopic]

**[Area 3 Name (if needed)]:**
- [Specific subtopic]
- [Specific subtopic]

[Output format directive — consistent across all prompts in your investigation]

[Closing purpose statement — what the reader should be able to do after reading this]
```

## Sizing Guide

| Prompt Length | Expected Output | Quality |
|---------------|----------------|---------|
| 500–1500 chars | 3,000–5,000 words | Excellent — focused, deep |
| 1500–3000 chars | 5,000–8,000 words | Very good — detailed with examples |
| 3000–5000 chars | 8,000–12,000 words | Good — may rush some sections |
| 5000+ chars | 10,000+ words | Risky — consider splitting |

The sweet spot is **1500–3000 characters per prompt**, producing **5,000–8,000 words** of output.

## The "DO NOT ASK QUESTIONS" Directive

By default, Deep Research may ask clarifying questions before starting ("Would you like me to focus on X or Y?"). For batch operations, this stalls the entire pipeline.

This tool automatically wraps every prompt with:

```
DO NOT ASK QUESTIONS - LAUNCH THE PROMPT

[your prompt]

DO NOT ASK QUESTIONS - LAUNCH THE PROMPT
```

This tells Deep Research to start immediately with its best interpretation. To disable this, remove the `directive` lines in `launch-research.js` `submitTopic()`.

## Example: Planning a 15-Part Investigation

Say you want a comprehensive technical reference for a large framework. Here's how to plan it:

**Step 1:** List the major subsystems (aim for 5–8)
```
1. Core architecture (modules, DI, plugins)
2. Data layer (EAV, ORM, repositories)
3. Performance layer (indexing, caching, FPC)
4. API layer (REST, GraphQL, WebSocket)
5. Frontend (templates, layout, JavaScript)
6. Admin (UI components, grids, forms)
7. Operations (deploy, test, monitor)
```

**Step 2:** Assess which subsystems need splitting
- Subsystems 1, 3, and 6 are too broad → split each into 3 focused prompts
- The rest can stay as single prompts

**Step 3:** Write prompts with the template above
- 4 single prompts + 3 triple-splits = **13 prompts**

**Step 4:** Save as JSON and batch-launch
```bash
# Dry run to verify
node launch-research.js -t topics/my-investigation.json --dry-run

# Launch first 5 as a test
node launch-research.js -t topics/my-investigation.json --count 5

# Launch the rest
node launch-research.js -t topics/my-investigation.json --start-from 6
```

## JSON Format Tips

Use JSON (not .txt) for multi-paragraph prompts. JSON preserves formatting, newlines, and structure:

```json
[
  "First prompt with\n\n**Bold sections:**\n- Bullet points\n- More bullets",
  "Second prompt..."
]
```

To convert prompts from a markdown file where each prompt is in a code fence:

```bash
node parse-prompts.js /path/to/your/prompts.md
```

This extracts content between ``` fences and saves as a JSON array in `topics/`.
