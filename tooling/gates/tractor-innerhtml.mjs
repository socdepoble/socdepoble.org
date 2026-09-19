#!/usr/bin/env node
/**
 * tractor-innerhtml.mjs — cap HTML entra a l'arbre sense passar pel sanejador.
 *
 * Motiu: a l'auditoria 260829, tres dels quatre `dangerouslySetInnerHTML` de
 * l'arbre estaven sanejats i un no. Sense porta, la pròxima vegada seran dos.
 */
import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const ARREL = 'src';
const EXT = new Set(['.js', '.jsx']);
const SALTA = new Set(['node_modules', 'dist', '.git']);
const PATRO = /dangerouslySetInnerHTML\s*=\s*\{\{\s*__html:\s*([\s\S]+?)\s*\}\}/g;

async function passeja(dir, eixida = []) {
  for (const ent of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    if (SALTA.has(ent.name) || ent.name.startsWith('.')) continue;
    const cami = join(dir, ent.name);
    if (ent.isDirectory()) await passeja(cami, eixida);
    else if (EXT.has(extname(ent.name))) eixida.push(cami);
  }
  return eixida;
}

const infraccions = [];
for (const fitxer of await passeja(ARREL)) {
  const text = await readFile(fitxer, 'utf8');
  for (const m of text.matchAll(PATRO)) {
    if (/\bsanitizeHtml\s*\(/.test(m[1])) continue;
    infraccions.push({
      fitxer,
      linia: text.slice(0, m.index).split('\n').length,
      expressio: m[1].trim()
    });
  }
}

if (infraccions.length) {
  console.error('\n❌ TRACTOR innerHTML: HTML sense sanejar\n');
  for (const i of infraccions) {
    console.error(`   ${i.fitxer}:${i.linia}  →  __html: ${i.expressio}`);
  }
  console.error('\n   Embolica-ho amb sanitizeHtml() de src/utils/sanitize.js.\n');
  process.exit(1);
}
console.log(`✅ TRACTOR innerHTML: tots els punts d'injecció estan sanejats.`);
