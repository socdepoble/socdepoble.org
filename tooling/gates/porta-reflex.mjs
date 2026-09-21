#!/usr/bin/env node
import fs from 'node:fs';

// This gate verifies if the file being written to the Escriptori has a 'reflex' field
// in its frontmatter, ensuring the AI read the template before writing.

const args = process.argv.slice(2);
// In a hook context, we might receive arguments as JSON on stdin.
// We'll read stdin if it's not a TTY.
let input = '';

try {
  if (!process.stdin.isTTY) {
    input = fs.readFileSync(0, 'utf-8');
  }
} catch (e) { /* ignore error */ }

// For simplicity in this implementation, if it's called with a file path, we check the file.
// If it's called via Antigravity PreToolUse hook, we check the 'CodeContent' or 'ReplacementContent' in stdin.
function checkContent(content) {
  // If writing to escriptori and it's a PROMPT, INFORME, ACTA
  // We should enforce the reflex token. But to avoid blocking all writes,
  // we just do a loose check for now: if it looks like a frontmatter document for the desktop,
  // it should have a reflex or at least type/status.
  
  if (content.includes('type: prompt') || content.includes('type: informe') || content.includes('type: acta')) {
    if (!content.includes('reflex:')) {
      console.error("[PORTA-REFLEX] BLOQUEIG: Has oblidat incloure el rebut 'reflex' al frontmatter!");
      console.error("Segons la regla Fail-Closed (Anella 1 i 2), no pots crear aquest document sense haver llegit abans les regles i deixar-ne constància.");
      process.exit(1);
    }
  }
  process.exit(0);
}

if (input) {
  try {
    const payload = JSON.parse(input);
    const content = payload.toolArgs?.CodeContent || payload.toolArgs?.ReplacementContent || payload.toolArgs?.ReplacementChunks?.[0]?.ReplacementContent || '';
    const file = payload.toolArgs?.TargetFile || '';
    if (file.includes('04_escriptori')) {
      checkContent(content);
    } else {
      process.exit(0);
    }
  } catch (e) {
    process.exit(0);
  }
} else if (args.length > 0) {
  const file = args[0];
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf-8');
    checkContent(content);
  }
}

process.exit(0);
