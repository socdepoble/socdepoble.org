#!/usr/bin/env node
/** Context fresc, compartit pels hosts; mai una còpia persistent de les regles. */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from '../documental/cli.mjs';

export const SOURCES = ['AGENTS.md', '.agents/BOOTSTRAP.md',
  '_wiki_de_poble/01_ser/02_genotip.md', '_wiki_de_poble/00_index.md'];
export const MAX_BYTES = 128 * 1024;

export function contextLocal(root = ROOT) {
  const realRoot = fs.realpathSync(root);
  const text = SOURCES.map(file => {
    const full = fs.realpathSync(path.join(root, file));
    if (!full.startsWith(realRoot + path.sep)) throw new Error(`Font fora del projecte: ${file}`);
    const stat = fs.statSync(full);
    if (!stat.isFile() || stat.size > MAX_BYTES) throw new Error(`Font invàlida o massa gran: ${file}`);
    const content = fs.readFileSync(full, 'utf8');
    if (!content.trim()) throw new Error(`Font buida: ${file}`);
    return `\n<!-- SDP:FONT ${file} -->\n${content}\n<!-- /SDP:FONT ${file} -->\n`;
  }).join('\n');
  if (Buffer.byteLength(text) > MAX_BYTES) throw new Error('Context massa gran; no es trunca cap font');
  return text;
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  try {
    const payload = JSON.parse(fs.readFileSync(0, 'utf8'));
    if (payload.hook_event_name !== 'SessionStart') throw new Error('Cal un esdeveniment SessionStart');
    process.stdout.write(JSON.stringify({hookSpecificOutput: {
      hookEventName: 'SessionStart', additionalContext: contextLocal()
    }}));
  } catch (error) {
    console.error(`[CONTEXT-LOCAL] ${error.message}`);
    process.stdout.write(JSON.stringify({continue: false, stopReason: `Context incomplet: ${error.message}`}));
    process.exitCode = 2;
  }
}
