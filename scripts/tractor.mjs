#!/usr/bin/env node
// scripts/tractor.mjs — Regle Zero executable: cap document naix sense passar per la plantilla.
// Ús:
//   node scripts/tractor.mjs --genera  docs/prompts/NOU_DOC.md   el crea còpia de la plantilla
//   node scripts/tractor.mjs --comprova docs/prompts/NOU_DOC.md  valida l'esborrany
// Eixides: 0 OK · 1 plantilla il·localitzable · 2 falten claus YAML · 3 no cita la plantilla

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const PLANTILLES = [
  '_wiki_de_poble/02_saber/07_plantilles/00_PLANTILLA_PROMPT_ISO.md',
  '00_PLANTILLA_PROMPT_ISO.md',
];

function trobaPlantilla() {
  for (const p of PLANTILLES) if (existsSync(p)) return p;
  return null;
}

// Parser ingenu de claus de primer nivell del frontmatter (sense dependències).
function clausDeFrontmatter(text) {
  const bloc = text.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!bloc) return [];
  return bloc[1]
    .split('\n')
    .filter((l) => /^[A-Za-z_][\w-]*:/.test(l))
    .map((l) => l.match(/^([\w-]+)/)[1]);
}

const [accio, ruta] = process.argv.slice(2);
const plantilla = trobaPlantilla();

if (!plantilla) {
  console.error('TRACTOR ATURAT: no puc obrir la plantilla vigent (' + PLANTILLES.join(' | ') + ').');
  process.exit(1);
}

if (accio === '--genera') {
  const text = readFileSync(plantilla, 'utf8');
  writeFileSync(
    ruta,
    text + '\n<!-- Nascut del TRACTOR des de ' + plantilla + ' — ompli NOMÉS els blocs variables. -->\n'
  );
  console.log('TRACTOR: document generat des de ' + plantilla + '.');
  process.exit(0);
}

if (accio === '--comprova') {
  const doc = readFileSync(ruta, 'utf8');
  const clausPlantilla = clausDeFrontmatter(readFileSync(plantilla, 'utf8'));
  const clausDoc = clausDeFrontmatter(doc);
  const falten = clausPlantilla.filter((c) => !clausDoc.includes(c));
  if (falten.length) {
    console.error('TRACTOR: a l\'esborrós li falten claus del Gold Standard: ' + falten.join(', '));
    process.exit(2);
  }
  if (!(doc.includes('00_PLANTILLA_PROMPT_ISO') || doc.includes(plantilla))) {
    console.error('TRACTOR: el document no cita la plantilla (inputs/vincles). Has passat per ella?');
    process.exit(3);
  }
  console.log('TRACTOR: OK — ' + clausDoc.length + ' claus presents i plantilla citada.');
  process.exit(0);
}

console.error('Ús: node scripts/tractor.mjs (--genera|--comprova) <ruta>');
process.exit(1);
