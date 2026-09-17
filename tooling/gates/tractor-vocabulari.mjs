#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import path from 'path';
/**
 * tractor-vocabulari.mjs — EL CIMENT ARMAT
 *
 * PREMISSA (auditoria 260829):
 * Llistar infraccions no impedix que se'n creen de noves. El que ho impedix
 * és tancar el vocabulari. `termodinamic.mjs` ja fa això amb els noms de
 * fitxer: una llista tancada de CATEGORIES i un sol regex. Aquest tractor
 * aplica la mateixa forma al CSS.
 *
 * LLEI: dins de `src/sections/**`, tota classe usada ha d'estar declarada
 * al full canònic. Si no hi és, la compilació falla. No hi ha `className`
 * lliure. Construir una vista fora de l'estàndard deixa de ser possible.
 *
 * TRES REGLES:
 *   V1 · classe-forastera   Classe usada que no existix al vocabulari. LLEI DURA.
 *   V2 · classe-opaca    `className={`x--${cond}`}` — no verificable estàticament.
 *                           Admet deute; ha de baixar cap a mapes explícits.
 *   V3 · css-de-seccio      Cap fitxer .css pot viure sota src/sections/.  LLEI DURA.
 *
 * ÚS:
 *   node tooling/gates/tractor-vocabulari.mjs
 *   node tooling/gates/tractor-vocabulari.mjs --baseline
 *   node tooling/gates/tractor-vocabulari.mjs --detall
 *   node tooling/gates/tractor-vocabulari.mjs --fantasmes   # classes declarades buides
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { parse } from '@babel/parser';

const ARREL = process.cwd();
const DEUTE_PATH = join(ARREL, '.agents/deute/.vocabulari-deute.json');

/** El vocabulari canònic ara viu dividit en diversos fulls. L'ÚNICA font del vocabulari. */
const FULLS_CANONICS = [
  'src/css/modules.css',
  'src/css/layout.css',
  'src/css/tokens.css',
  'src/css/index.css'
];

/**
 * Fulls en transició. Les seues classes s'accepten HUI, però el deute
 * V2/legacy ha de baixar fins que aquest array quede buit i el fitxer
 * es puga esborrar. Objectiu declarat: suprimir legacy-components.css.
 */
const FULLS_TRANSICIO = ['src/css/legacy-components.css'];

/** Directoris on la llei s'aplica. La resta del projecte queda fora. */
const ABAST = ['src/sections', 'src/components', 'src/app', 'src/pages'];

const LLEIS_DURES = new Set(['classe-forastera', 'css-de-seccio']);

/* ─────────────────────────── Utilitats ─────────────────────────── */

function arbre(dir, exts, acc = []) {
  const abs = join(ARREL, dir);
  if (!existsSync(abs)) return acc;
  for (const nom of readdirSync(abs)) {
    if (nom === 'node_modules' || nom.startsWith('.')) continue;
    const rel = join(dir, nom);
    if (statSync(join(ARREL, rel)).isDirectory()) arbre(rel, exts, acc);
    else if (exts.includes(extname(nom))) acc.push(rel);
  }
  return acc;
}

function llegirVocabulari() {
  const vocab = new Set();
  const buides = new Set();
  
  const fitxersCSS = [...FULLS_CANONICS, ...FULLS_TRANSICIO];
  for (const dir of ABAST) {
    fitxersCSS.push(...arbre(dir, ['.css']));
  }
  
  for (const full of fitxersCSS) {
    const abs = join(ARREL, full);
    if (!existsSync(abs)) continue;
    const css = readFileSync(abs, 'utf8');
    for (const m of css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) vocab.add(m[1]);
    // classes fantasma: declarades amb cos buit
    for (const m of css.matchAll(/\.(-?[_a-zA-Z][\w-]*)\s*\{\s*\}/g)) buides.add(m[1]);
  }
  return { vocab, buides };
}

/* ───────────────── Extracció de classes per AST ───────────────── */

function tokens(str) {
  return str.split(/\s+/).filter(t => /^-?[_a-zA-Z][\w-]*$/.test(t));
}

/**
 * Recull les classes d'una expressió JSX de `className`.
 * Retorna { estatiques: [], dinamiques: [] }.
 *
 * ESTÀTIC:  "a b"  ·  {'a'}  ·  {cond ? 'a' : 'b'}  ·  {`a ${x ? 'b' : 'c'}`}
 * DINÀMIC:  {`x--${y}`}  — la interpolació toca un token a mitges.
 */
function classesDe(node) {
  const estatiques = [];
  const dinamiques = [];

  const visita = (n) => {
    if (!n || typeof n !== 'object') return;
    switch (n.type) {
      case 'StringLiteral':
        estatiques.push(...tokens(n.value));
        return;
      case 'TemplateLiteral': {
        n.quasis.forEach((q, i) => {
          const text = q.value.cooked ?? q.value.raw ?? '';
          const seguent = n.expressions[i];
          // Si el tros acaba sense espai i encara ve una interpolació,
          // el token queda partit: no es pot verificar.
          const partitDreta = seguent && text.length > 0 && !/\s$/.test(text);
          const anterior = i > 0 ? (n.quasis[i - 1].value.cooked ?? '') : null;
          const partitEsquerra = anterior !== null && text.length > 0 && !/^\s/.test(text);
          const trossos = tokens(text);
          if (partitDreta && trossos.length) {
            dinamiques.push(trossos[trossos.length - 1] + '${…}');
            estatiques.push(...trossos.slice(0, -1));
          } else if (partitEsquerra && trossos.length) {
            dinamiques.push('${…}' + trossos[0]);
            estatiques.push(...trossos.slice(1));
          } else {
            estatiques.push(...trossos);
          }
          if (seguent) visita(seguent);
        });
        return;
      }
      case 'ConditionalExpression':
        visita(n.consequent); visita(n.alternate); return;
      case 'LogicalExpression':
        visita(n.left); visita(n.right); return;
      case 'BinaryExpression':
        visita(n.left); visita(n.right); return;
      case 'JSXExpressionContainer':
        visita(n.expression); return;
      case 'CallExpression':
        n.arguments.forEach(visita); return;
      case 'ArrayExpression':
        n.elements.forEach(visita); return;
      case 'Identifier':
      case 'MemberExpression':
      case 'NumericLiteral':
        return; // no és una classe: és una variable. No la comptem.
      default:
        for (const k of Object.keys(n)) {
          const v = n[k];
          if (Array.isArray(v)) v.forEach(visita);
          else if (v && typeof v === 'object' && v.type) visita(v);
        }
    }
  };

  visita(node);
  return { estatiques, dinamiques };
}

function recorreJSX(ast, cb) {
  const visita = (n) => {
    if (!n || typeof n !== 'object') return;
    if (n.type === 'JSXAttribute' && n.name?.name === 'className' && n.value) {
      cb(n.value, n.loc?.start?.line ?? 0);
    }
    for (const k of Object.keys(n)) {
      const v = n[k];
      if (Array.isArray(v)) v.forEach(visita);
      else if (v && typeof v === 'object' && v.type) visita(v);
    }
  };
  visita(ast);
}

/* ─────────────────────────── Escaneig ─────────────────────────── */

export function escaneja() {
  const { vocab, buides } = llegirVocabulari();
  const infraccions = [];

  // V3 — cap CSS sota src/sections
  for (const dir of ABAST) {
    for (const f of arbre(dir, ['.css'])) {
      infraccions.push({
        regla: 'css-de-seccio', fitxer: f, linia: 1, token: f,
        missatge: `Full de secció prohibit. L'única porta al Shadow DOM són ${FULLS_CANONICS.join(', ')}.`
      });
    }
  }

  // V1 i V2 — classes al JSX
  for (const dir of ABAST) {
    for (const f of arbre(dir, ['.jsx', '.js'])) {
      const codi = readFileSync(join(ARREL, f), 'utf8');
      let ast;
      try {
        ast = parse(codi, { sourceType: 'module', plugins: ['jsx'], errorRecovery: true });
        if (ast.errors && ast.errors.length > 0) {
          infraccions.push({
            regla: 'classe-forastera', fitxer: f, linia: ast.errors[0].loc?.line || 1, token: '<parse-error>',
            missatge: `Errors sintàctics detectats durant el parseig (${ast.errors[0].message}).`
          });
          continue;
        }
      } catch (e) {
        infraccions.push({
          regla: 'classe-forastera', fitxer: f, linia: 1, token: '<parse-error>',
          missatge: `No s'ha pogut analitzar: ${e.message}`
        });
        continue;
      }
      recorreJSX(ast, (valor, linia) => {
        const { estatiques, dinamiques } = classesDe(valor);
        for (const t of new Set(estatiques)) {
          if (!vocab.has(t)) {
            infraccions.push({
              regla: 'classe-forastera', fitxer: f, linia, token: t,
              missatge: `Classe «${t}» no declarada a ${FULLS_CANONICS.join(', ')}.`
            });
          }
        }
        for (const d of new Set(dinamiques)) {
          infraccions.push({
            regla: 'classe-opaca', fitxer: f, linia, token: d,
            missatge: `Classe construïda en temps d'execució («${d}»). Usa un mapa explícit.`
          });
        }
      });
    }
  }

  return { infraccions, vocab, buides };
}

/* ────────────────────── Ratchet i entrada CLI ────────────────────── */

const identitat = (i) => `${i.regla}|${i.fitxer}|${i.token}`;

function comptaPerRegla(infraccions) {
  const acc = {};
  for (const i of infraccions) {
    acc[i.regla] = acc[i.regla] || { max: 0, identitats: [] };
    acc[i.regla].max += 1;
    acc[i.regla].identitats.push(identitat(i));
  }
  for (const r of Object.values(acc)) r.identitats = [...new Set(r.identitats)].sort();
  return acc;
}

function cli() {
  const args = process.argv.slice(2);
  const BASELINE = args.includes('--baseline');
  const DETALL = args.includes('--detall');
  const FANTASMES = args.includes('--fantasmes');

  const fullsAbsents = FULLS_CANONICS.filter(f => !existsSync(join(ARREL, f)));
  if (fullsAbsents.length > 0) {
    console.error(`PARAT. No es troben els fulls canònics següents: ${fullsAbsents.join(', ')}. La porta falla tancada.`);
    process.exit(1);
  }

  const { infraccions, vocab, buides } = escaneja();

  if (FANTASMES) {
    console.log(`Vocabulari: ${vocab.size} classes declarades.`);
    console.log(`Fantasmes (declarades amb cos buit): ${buides.size}`);
    for (const b of [...buides].sort()) console.log(`  .${b} {}`);
    process.exit(0);
  }

  if (DETALL) {
    for (const i of infraccions) {
      console.log(`  ${i.regla.padEnd(18)} ${i.fitxer}:${i.linia}  ${i.missatge}`);
    }
    console.log('');
  }

  const actual = comptaPerRegla(infraccions);
  console.log(`Vocabulari Pedra Seca: ${vocab.size} classes canòniques. ${infraccions.length} infraccions.`);

  if (BASELINE) {
    writeFileSync(DEUTE_PATH, JSON.stringify(actual, null, 2) + '\n', 'utf8');
    console.log('Deute congelat a .vocabulari-deute.json:');
    for (const [r, d] of Object.entries(actual)) console.log(`  ${r.padEnd(20)}: ${d.max}`);
    process.exit(0);
  }

  if (!existsSync(DEUTE_PATH)) {
    console.error('\nPARAT. No hi ha .vocabulari-deute.json.');
    console.error('Executa una vegada: node tooling/gates/tractor-vocabulari.mjs --baseline\n');
    process.exit(1);
  }

  const previ = JSON.parse(readFileSync(DEUTE_PATH, 'utf8'));
  let trencat = false;

  for (const [regla, d] of Object.entries(actual)) {
    const base = previ[regla] || { max: 0, identitats: [] };
    const conegudes = new Set(base.identitats);
    const noves = d.identitats.filter(i => !conegudes.has(i));

    if (LLEIS_DURES.has(regla) && noves.length > 0) {
      console.error(`LLEI DURA · ${regla}: ${noves.length} infraccions NOVES.`);
      for (const i of noves) console.error(`    ${i}`);
      trencat = true;
    } else if (d.max > base.max || noves.length > 0) {
      console.error(`DEUTE PUJA · ${regla}: ${base.max} -> ${d.max}`);
      for (const i of noves) console.error(`    NOVA: ${i}`);
      trencat = true;
    } else if (d.max < base.max) {
      console.log(`  ${regla.padEnd(20)}: ${base.max} -> ${d.max}  (baixa)`);
    }
  }

  if (trencat) {
    console.error('\nPARAT. Vocabulari trencat. Declara la classe a ' + FULLS_CANONICS.join(', ') + ' o usa una existent.');
    process.exit(1);
  }
  console.log('PASSA. Cap classe forastera nova.');
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  cli();
}
