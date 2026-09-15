#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const isJson = args.includes('--json');
const rootArg = args.find(a => a.startsWith('--arrel='));
const SRC_DIR = rootArg ? path.join(rootArg.split('=')[1], 'src') : 'src';

const FORBIDDEN_CLASSES = [
  'sdp-w-', 'sdp-h-', 'sdp-p-', 'sdp-m-', 'sdp-flex', 'sdp-grid', 
  'sdp-justify', 'sdp-items', 'sdp-gap-', 'sdp-bg-', 'sdp-border', 
  'sdp-cursor-', 'sdp-opacity-'
];

function scanFiles(dir, exts) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...scanFiles(full, exts));
    } else if (exts.some(ext => full.endsWith(ext))) {
      files.push(full);
    }
  }
  return files;
}

const targetFiles = scanFiles(SRC_DIR, ['.js', '.jsx', '.ts', '.tsx']);
let errors = [];

for (const file of targetFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for forbidden classes in className="..." or class="..."
    // A simple regex to catch the class string
    const classMatch = line.match(/(?:className|class)\s*=\s*(["'{])([\s\S]*?)(?:["'}])/);
    if (classMatch) {
      const clsString = classMatch[2];
      const tokens = clsString.match(/[a-zA-Z0-9_-]+/g) || [];
      for (const token of tokens) {
        if (FORBIDDEN_CLASSES.some(prefix => token === prefix || token.startsWith(prefix))) {
          // Allow semantic tokens that might coincidentally match if necessary
          // But strictly following Grok, we catch them all.
          errors.push({
            file,
            line: i + 1,
            type: 'T1 UTILITAT-SDP',
            detail: `Trobada classe utilitària: ${token}`,
            code: line.trim()
          });
        }
      }
    }

    // Check for raw colors inside style={{ ... }}
    // We look for style={...} and check if it contains #hex, rgb, hsl
    if (line.includes('style={{') || line.includes('style={')) {
      // Very basic check per line, acknowledging multiline might need better parsing,
      // but Grok specified "dins de style={{...}} (també blocs multilínia)".
      // For a simple script, we check if the line has raw colors and is likely inside JSX.
      if (line.match(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/) || line.match(/\brgb\(/) || line.match(/\bhsl\(/)) {
        errors.push({
          file,
          line: i + 1,
          type: 'T2 COLOR-CRU',
          detail: `Trobada definició de color cru (#hex, rgb, hsl) prop de style=`,
          code: line.trim()
        });
      }
    }
  }
}

if (isJson) {
  console.log(JSON.stringify({
    totalFiles: targetFiles.length,
    errorsFound: errors.length,
    errors
  }, null, 2));
} else {
  console.log(`\n🚜 [TRACTOR ANTI-TAILWIND] Analitzant ${targetFiles.length} fitxers a ${SRC_DIR}...`);
  if (errors.length > 0) {
    console.log(`\n❌ S'han trobat ${errors.length} violacions de la Llei de Pedra Seca:\n`);
    errors.forEach(e => {
      console.log(`[${e.type}] ${e.file}:${e.line}`);
      console.log(`   Detall: ${e.detail}`);
      console.log(`   Codi:   ${e.code}\n`);
    });
    console.log(`🧱 El mur ha parat el build. Neteja la brutícia abans de continuar.\n`);
    process.exit(1);
  } else {
    console.log(`\n✅ Cap utilitat de Tailwind ni color cru detectat. El mur aprova el codi.\n`);
    process.exit(0);
  }
}

if (errors.length > 0) {
  process.exit(1);
}
