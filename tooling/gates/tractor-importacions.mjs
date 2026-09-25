#!/usr/bin/env node
/**
 * tractor-importacions.mjs — Cap importació relativa cap al no-res.
 *
 * PER QUÈ: `useGestoriaData.js` va importar `../lib/db` (Dexie) durant tres
 * sessions sense que cap porta ho veiera. ESLint no du resolutor i el build,
 * que sí que ho veu, corre DESPRÉS de les portes. Un error que només apareix
 * al final de la cadena és un error que es descobrix tard i sempre.
 *
 * ABAST: només especificadors relatius (./ i ../). Els bare imports són cosa
 * de npm i ja peten a la instal·lació.
 *
 * ÚS: node tooling/gates/tractor-importacions.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';

const ARRELS = ['src', 'tooling', 'scripts', 'tests'];
const CODI = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']);
const RESOLUBLES = ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.json', '.css', '.svg', '.png'];

// L'AST conserva imports reals dins de tests, sense interpretar fixtures com a codi.
function imports(text, file) {
  const ast = parse(text, { sourceType: 'unambiguous', plugins: ['jsx', ...(/\.tsx?$/.test(file) ? ['typescript'] : [])] });
  const found = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    const source = ['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration', 'ImportExpression'].includes(node.type)
      ? node.source : node.type === 'CallExpression' && (node.callee?.type === 'Import' || node.callee?.name === 'require') ? node.arguments[0] : null;
    if (source?.type === 'StringLiteral') found.push({ spec: source.value, line: source.loc.start.line });
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    }
  }
  visit(ast);
  return found;
}

function* fitxers(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* fitxers(p);
    else if (CODI.has(path.extname(e.name))) yield p;
  }
}

/** Vite accepta sufixos de consulta (?inline, ?raw, ?url). No són part del camí. */
const netejaSufix = (spec) => spec.split('?')[0];

function resol(desDe, spec) {
  const base = path.resolve(path.dirname(desDe), netejaSufix(spec));
  const proves = [base, ...RESOLUBLES.map(e => base + e),
                  ...RESOLUBLES.map(e => path.join(base, 'index' + e))];
  return proves.find(p => fs.existsSync(p) && fs.statSync(p).isFile()) || null;
}

const trencades = [];
for (const arrel of ARRELS) {
  for (const fitxer of fitxers(arrel)) {
    const txt = fs.readFileSync(fitxer, 'utf8');
    let specs;
    try { specs = imports(txt, fitxer); }
    catch (e) { trencades.push({ fitxer, linia: e.loc?.line || 1, spec: `PARSE: ${e.message}` }); continue; }
    for (const { spec, line: linia } of specs) {
      if (!spec.startsWith('.')) continue;
      if (!resol(fitxer, spec)) {
        trencades.push({ fitxer, linia, spec });
      }

      // Check for circular Pedra Seca imports
      if (fitxer.includes('/components/PedraSeca/') && !fitxer.endsWith('index.js')) {
        const fullResolved = resol(fitxer, spec);
        if (fullResolved && fullResolved.endsWith('components/PedraSeca/index.js')) {
            trencades.push({ fitxer, linia, spec: `CIRCULAR PEDRA SECA: ${spec}` });
        }
      }
    }
  }
}

if (trencades.length === 0) {
  console.log('✅ Porta Importacions: cap importació relativa orfe.');
  process.exit(0);
}

console.error(`\n❌ Porta Importacions: ${trencades.length} importació(ns) cap al no-res.\n`);
for (const t of trencades) console.error(`  ${t.fitxer}:${t.linia}  →  ${t.spec}`);
console.error('\nUna importació que no resol és un build mort esperant el seu torn.\n');
process.exit(1);
