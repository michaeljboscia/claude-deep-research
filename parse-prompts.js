#!/usr/bin/env node
/**
 * Parse the Adobe Commerce Backend Bible markdown file
 * and extract each prompt (content between ``` blocks) into
 * a JSON topics file.
 */
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(process.argv[2], 'utf-8');

// Extract content between ``` code fences
const prompts = [];
const regex = /```\n([\s\S]*?)```/g;
let match;
while ((match = regex.exec(src)) !== null) {
  const content = match[1].trim();
  // Skip short code blocks (like CLI commands in the version history)
  if (content.length > 200) {
    prompts.push(content);
  }
}

console.log(`Found ${prompts.length} prompts`);

// Write as JSON (array of strings)
const outPath = path.join(__dirname, 'topics', 'adobe-commerce-backend-bible.json');
fs.writeFileSync(outPath, JSON.stringify(prompts, null, 2));
console.log(`Written to ${outPath}`);

// Also show first 80 chars of each
prompts.forEach((p, i) => {
  console.log(`  ${i + 1}. ${p.slice(0, 80)}...`);
});
