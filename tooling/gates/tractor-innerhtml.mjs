#!/usr/bin/env node
/**
 * tractor-innerhtml.mjs — cap HTML entra a l'arbre sense passar pel sanejador.
 *
 * Motiu: a l'auditoria 260829, tres dels quatre `dangerouslySetInnerHTML` de
 * l'arbre estaven sanejats i un no. Sense porta, la pròxima vegada seran dos.
 */
import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { senseComentaris } from '../lib/codi.mjs';

const ARREL = 'src';
const EXT = new Set(['.js', '.jsx']);
const SALTA = new Set(['node_modules', 'dist', '.git']);

const PATRO = /dangerouslySetInnerHTML\s*=\s*\{\{\s*__html:\s*([\s\S]+?)\s*\}\}/g;
const PATRO_SHORTHAND = /dangerouslySetInnerHTML\s*=\s*\{(?!\{)/g;
const PATRO_DOM = /\b(innerHTML|outerHTML)\s*=|insertAdjacentHTML\s*\(/g;

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
  const originalText = await readFile(fitxer, 'utf8');
  const text = senseComentaris(originalText, fitxer);
  
  for (const m of text.matchAll(PATRO)) {
    const expr = m[1].trim();
    if (/^sanitizeHtml\s*\(.*\)$/.test(expr)) continue;
    infraccions.push({
      fitxer,
      linia: originalText.slice(0, m.index).split('\n').length,
      expressio: `__html: ${expr}`
    });
  }

  for (const m of text.matchAll(PATRO_SHORTHAND)) {
    infraccions.push({
      fitxer,
      linia: originalText.slice(0, m.index).split('\n').length,
      expressio: `Forma il·legal: usa {{ __html: sanitizeHtml(...) }}`
    });
  }

  for (const m of text.matchAll(PATRO_DOM)) {
    if (!text.slice(m.index).startsWith('innerHTML = sanitizeHtml') && 
        !text.slice(m.index).startsWith('outerHTML = sanitizeHtml') &&
        !/\.insertAdjacentHTML\s*\(\s*[^,]+,\s*sanitizeHtml/.test(text.slice(m.index, m.index + 100))) {
      infraccions.push({
        fitxer,
        linia: originalText.slice(0, m.index).split('\n').length,
        expressio: `Modificació del DOM sense sanitizeHtml()`
      });
    }
  }
}

if (infraccions.length) {
  console.error('\n❌ TRACTOR innerHTML: HTML sense sanejar\n');
  for (const i of infraccions) {
    console.error(`   ${i.fitxer}:${i.linia}  →  ${i.expressio}`);
  }
  console.error('\n   Embolica-ho amb sanitizeHtml() de src/utils/sanitize.js i evita shorthands o variables intermèdies.\n');
  process.exit(1);
}
console.log(`✅ TRACTOR innerHTML: tots els punts d'injecció estan sanejats.`);
