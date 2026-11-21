#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { CAMINS } from '../lib/arrel.mjs';

const FORBIDDEN_PHRASES = [
  /ignore all previous/i,
  /forget previous/i,
  /you are not an ai/i,
  /disregard previous/i,
  /ignore agents\.md/i,
  /bypass agents\.md/i,
  /saltat les regles/i,
  /ignora les regles/i,
  /no faces cas de/i,
  /desobeeix/i,
  /ignora l'arquitectura/i
];

const SCAN_DIRS = [
  CAMINS.wiki,
  '.agents'
];

function resolvePath(p) {
  return path.resolve(process.cwd(), p);
}

function scanDirectory(dir, findings = []) {
  if (!fs.existsSync(dir)) return findings;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // Skip hidden files/folders (except .agents) and irrelevant files
    if (entry.name.startsWith('.') && entry.name !== '.agents') continue;
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath, findings);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      for (const phrase of FORBIDDEN_PHRASES) {
        if (phrase.test(content)) {
          findings.push({
            file: fullPath,
            phrase: phrase.toString()
          });
        }
      }
    }
  }
  
  return findings;
}

function validateCompliance() {
  console.log('Verificant compliment cognitiu de la Wiki i .agents (Anti-al·lucinacions)...');
  const findings = [];
  
  for (const dir of SCAN_DIRS) {
    scanDirectory(resolvePath(dir), findings);
  }
  
  if (findings.length > 0) {
    console.error('\\n🚨 SDP-LOCK: INJECCIÓ COGNITIVA DETECTADA 🚨');
    console.error("S'han trobat instruccions il·legals que intenten fer un bypass de la governança:\\n");
    
    findings.forEach(f => {
      console.error(`- Fitxer: ${path.relative(process.cwd(), f.file)}`);
      console.error(`  Motiu: Coincidència amb la regla prohibida ${f.phrase}`);
    });
    
    console.error('\\nResol aquestes instruccions abans de fer un commit.');
    process.exit(1);
  }
  
  console.log('✅ Cap injecció cognitiva detectada. El cervell està net.');
}

validateCompliance();
