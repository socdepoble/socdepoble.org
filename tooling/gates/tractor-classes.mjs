#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = 'src';

// Prefixos dinàmics que considerem "indeterminats" o llista blanca de prefixos
const PREFIXOS_PERMESOS = [
  'toc-level-',
  'btn-',
  'is-',
  'ajust-',
  'devices-status--'
];

/* ═══════════════════════ Llista Blanca i Prefixos ═══════════════════════ */

export function informe() {
const LLISTA_BLANCA_CLASSES = [
  'hidden', 'invisible',
  'ProseMirror'
];

function scanFiles(dir, ext) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...scanFiles(full, ext));
    else if (full.endsWith(ext)) files.push(full);
  }
  return files;
}

const cssFiles = scanFiles(SRC_DIR, '.css');
const jsxFiles = [...scanFiles(SRC_DIR, '.jsx'), ...scanFiles(SRC_DIR, '.js')];
const htmlFiles = ['public/index.html', 'public/auth/callback.html'];

const definedClasses = new Set();
const usedClasses = new Set();

// 1. Extraure classes de CSS
for (const file of cssFiles) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Buidar strings i url() per evitar falsos positius
  content = content.replace(/'[^']*'/g, "''");
  content = content.replace(/"[^"]*"/g, '""');
  content = content.replace(/url\([^)]*\)/g, 'url()');
  // Buidar comentaris
  content = content.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Netejar contingut entre claus per només quedar-nos amb els preludis de selector
  // Açò és complex amb expressions regulars degut a l'aniuament (com a media queries),
  // però de forma simplificada i segura, els selectors sempre estan fora de blocs de propietats.
  let isInsideBlock = false;
  let currentSelector = '';
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '{') {
      isInsideBlock = true;
      
      // Processar currentSelector
      if (currentSelector && !currentSelector.trim().startsWith('@')) {
        const matches = currentSelector.match(/\.([a-zA-Z_][a-zA-Z0-9_-]*)/g);
        if (matches) {
          for (const match of matches) {
            definedClasses.add(match.substring(1));
          }
        }
      }
      currentSelector = '';
    } else if (char === '}') {
      isInsideBlock = false;
      currentSelector = '';
    } else {
      if (!isInsideBlock) {
        currentSelector += char;
      }
    }
  }
}

// 2. Extraure ús de JSX/JS i HTML
const processUsages = (filesList) => {
  for (const file of filesList) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf8');
    
    // Buscar className="...", class="...", className={...}
    const classAttrs = content.matchAll(/class(?:Name)?\s*=\s*(["'{])([\s\S]*?)(?:["'}])/g);
    for (const match of classAttrs) {
      const clsString = match[2];
      const tokens = clsString.match(/[a-zA-Z0-9_-]+/g);
      if (tokens) {
        for (const token of tokens) {
          usedClasses.add(token);
        }
      }
    }
    
    // Buscar classList.add("..."), classList.remove("...")
    const classListMatches = content.matchAll(/classList\.(?:add|remove|toggle|contains)\s*\(\s*["']([^"']+)["']/g);
    for (const match of classListMatches) {
      const tokens = match[1].match(/[a-zA-Z0-9_-]+/g);
      if (tokens) {
        for (const token of tokens) {
          usedClasses.add(token);
        }
      }
    }
  }
};

processUsages(jsxFiles);
processUsages(htmlFiles);

// 3. Analitzar quines classes estan definides però no usades
const mortes = [];
const vives = [];
const indeterminades = [];

for (const definedCls of definedClasses) {
  if (usedClasses.has(definedCls)) {
    vives.push(definedCls);
    continue;
  }
  
  if (LLISTA_BLANCA_CLASSES.includes(definedCls)) {
    vives.push(definedCls);
    continue;
  }
  
  let esIndeterminada = false;
  for (const prefix of PREFIXOS_PERMESOS) {
    if (definedCls.startsWith(prefix)) {
      esIndeterminada = true;
      indeterminades.push(definedCls);
      break;
    }
  }
  
  if (!esIndeterminada) {
    mortes.push(definedCls);
  }
}

console.log(`\n🧹 [TRACTOR CLASSES] Anàlisi de CSS (Salufmà Segur)`);
console.log(`Definides: ${definedClasses.size} | Vives confirmades: ${vives.length}`);

if (indeterminades.length > 0) {
  console.log(`\n⚠️  Indeterminades (Prefixos dinàmics): ${indeterminades.length}`);
}

if (mortes.length > 0) {
  console.log(`\n👻 Classes aparentment MORTES (${mortes.length}):`);
  const chunkSize = 5;
  for (let i = 0; i < mortes.length; i += chunkSize) {
    console.log(`   ${mortes.slice(i, i + chunkSize).join('  ')}`);
  }
  console.log(`\n💡 INSTRUCCIÓ: Mai esborres de forma automàtica. Mou-les manualment o revisa el codi font per confirmar.`);
} else {
  console.log(`\n✅ Zero classes mortes trobades. Codi net!`);
}

return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.exit(informe());
}
