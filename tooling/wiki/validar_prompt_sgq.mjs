#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSgqContext, validateSgqPrompt } from './lib/prompt_sgq.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
try {
  const files = process.argv.slice(2);
  if (!files.length) throw new Error('Ús: node tooling/wiki/validar_prompt_sgq.mjs prompt.md [prompt2.md]');
  const context = loadSgqContext(root);
  for (const file of files) {
    const errors = validateSgqPrompt(context, fs.readFileSync(file, 'utf8'));
    if (errors.length) throw new Error(`${file}: ${errors.join('; ')}`);
    console.log(`SGQ OK: ${file}`);
  }
} catch (error) {
  console.error(`SGQ BLOQUEJAT: ${error.message}`);
  process.exit(1);
}
