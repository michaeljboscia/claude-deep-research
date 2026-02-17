#!/usr/bin/env node
/**
 * parse-prompts.js — Extract prompts from a markdown file into JSON
 *
 * Reads a markdown file and extracts content between ``` code fences
 * into a JSON array suitable for use with launch-research.js.
 *
 * Usage:
 *   node parse-prompts.js <input.md> [output.json]
 *
 * If no output path is given, writes to topics/<input-filename>.json
 */
const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile) {
  console.error('Usage: node parse-prompts.js <input.md> [output.json]');
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(`File not found: ${inputFile}`);
  process.exit(1);
}

const src = fs.readFileSync(inputFile, 'utf-8');

// Extract content between ``` code fences
const prompts = [];
const regex = /```\n([\s\S]*?)```/g;
let match;
while ((match = regex.exec(src)) !== null) {
  const content = match[1].trim();
  // Skip short code blocks (CLI commands, config snippets, etc.)
  if (content.length > 200) {
    prompts.push(content);
  }
}

if (prompts.length === 0) {
  console.error('No prompts found. Prompts must be inside ``` code fences and over 200 characters.');
  process.exit(1);
}

console.log(`Found ${prompts.length} prompts`);

// Determine output path
const outPath = outputFile
  || path.join(__dirname, 'topics', path.basename(inputFile, path.extname(inputFile)) + '.json');

fs.writeFileSync(outPath, JSON.stringify(prompts, null, 2));
console.log(`Written to ${outPath}`);

// Show first 80 chars of each
prompts.forEach((p, i) => {
  console.log(`  ${i + 1}. ${p.slice(0, 80)}...`);
});
