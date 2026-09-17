#!/usr/bin/env node
/**
 * codemod_frontmatter.mjs — MIGRACIÓ 34 CLAUS → 8
 *
 * PER QUÈ EXISTIX
 * ───────────────
 *   L'esquema canònic sense migració és una altra norma escrita. Açò és la
 *   part que la fa executable: llig `tooling/wiki/esquema_frontmatter.json`
 *   i reescriu els 96 documents perquè el tractor puga posar el deute a zero.
 *
 * LLEI DE SEGURETAT
 *   Per defecte NO escriu. Ensenya el diff i se'n va. `kimi_purge.cjs` ens va
 *   ensenyar què passa quan un codemod substituïx text a cegues per tot el
 *   repositori sense assaig previ: cal --escriu explícit, i abans es fa còpia.
 *
 * ÚS
 *   node tooling/wiki/codemod_frontmatter.mjs              # assaig, mostra diff
 *   node tooling/wiki/codemod_frontmatter.mjs --diff       # diff complet
 *   node tooling/wiki/codemod_frontmatter.mjs --escriu     # aplica (fa còpia)
 *
 * Pedra Seca: zero dependències, ESM, idempotent, assaig per defecte.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parteix, llig, escriu } from './lib/frontmatter_pla.mjs';

const ARG = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? null;
const ARREL = path.resolve(ARG('arrel') ?? process.cwd());
const ESCRIU = process.argv.includes('--escriu');
const DIFF = process.argv.includes('--diff');
const ESQUEMA = path.join(ARREL, 'tooling/wiki/esquema_frontmatter.json');
const E = JSON.parse(fs.readFileSync(ESQUEMA, 'utf8'));

const ARRELS = (ARG('arrels') ?? '_wiki_de_poble,.agents').split(',');
const EXCLOU = /(^|\/)(node_modules|\.git|\.obsidian|dist|build|90_historic|\.sdp-paperera)(\/|$)/;
function esPlantillaBuida(cru) { return /:\s*.*\{[^}]+\}/.test(cru); }

/* Vocabulari: 30 termes reals → 14. Els descartats o bé eren universals
 * (`socdepoble` en 58 de 96 documents, `sistema` en 53: una etiqueta que
 * porta tot el corpus no distingix res) o bé eren notes soltes d'un sol ús. */
const TAGS = {
  cultura: 'saber', coneixement: 'saber', saber: 'saber',
  tecnica: 'maquina', dev: 'maquina', maquina: 'maquina',
  normativa: 'govern', regles: 'govern', governanca: 'govern', govern: 'govern',
  identitat: 'identitat', genoma: 'genoma', core: 'core', skills: 'skills',
  graf: 'graf', actes: 'acta', escriptori: 'escriptori', sollutia: 'sollutia',
  temporal: 'temporal', pedra_seca: 'disseny', disseny: 'disseny',
  subvencions: 'legal', financament: 'legal', 'finançament': 'legal',
  associacio: 'legal', economia: 'legal', viabilitat: 'legal', pressupost: 'legal',
  legal: 'legal',
  /* fora: socdepoble, sistema (universals) · clippings, acta_marmota, estrategia (soroll) */
};

function md(dir, acc = []) {
  const abs = path.join(ARREL, dir);
  if (!fs.existsSync(abs)) return acc;
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.posix.join(dir, e.name);
    if (EXCLOU.test(rel)) continue;
    if (e.isDirectory()) md(rel, acc);
    else if (e.name.endsWith('.md')) acc.push(rel);
  }
  return acc;
}

const NODES = md(ARRELS[0]).concat(...ARRELS.slice(1).map((d) => md(d))).sort();
/* L'abast de l'extensió d'agent el declara l'esquema, no este fitxer.
 * Abans ací hi havia el regex clavat a mà. Quan `abast` va passar de cadena
 * a llista, la porta ho va llegir bé i el codemod no: el codemod llevava
 * name/triggers_on/core del mirall i la porta els tornava a exigir tot seguit.
 * Un codemod i una porta que no lligen la mateixa llei són dues lleis. */
const aGlob = (g) => new RegExp('^' + g.split('*').map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*') + '$');
const ABAST_AGENT = (Array.isArray(E.extensio_agent.abast)
  ? E.extensio_agent.abast
  : [E.extensio_agent.abast]).map(aGlob);
const esSkill = (n) => ABAST_AGENT.some((re) => re.test(n));

const OBL = Object.keys(E.universal.obligatories);
const OPC = Object.keys(E.universal.opcionals);
/* Les opcionals de l'extensió també són esquema. Llegir només les
 * obligatòries feia que el codemod esborrara en silenci qualsevol clau
 * opcional declarada (p. ex. `prioritat`), cada volta que s'executava. */
const AGENT = [...Object.keys(E.extensio_agent.obligatories),
              ...Object.keys(E.extensio_agent.opcionals ?? {})];
const EXTRA = E.migracio.conserva_fora_d_esquema ?? [];
const ORDRE = [...OBL, ...OPC, ...AGENT, ...EXTRA];
const FORA = new Set([
  ...E.migracio.esborra_entropia_zero,
  ...E.migracio.esborra_ho_guarda_git,
  ...E.migracio.esborra_redundant_amb_el_cos,
]);

/* Deducció de `tipus` quan falta. Mai inventem `estat`: `esborrany` és el
 * valor honest per a un document que mai ha declarat el seu estat. */
function deduTipus(n) {
  if (esSkill(n) || n.includes('/skills/')) return 'skill';
  if (/(^|\/)(00_INDEX|README|index)[^/]*\.md$/i.test(n)) return 'index';
  if (/_ACTA_|\/10_actes\//.test(n)) return 'acta';
  if (/(^|\/)(LLEI_|ESTANDARD_|ADR-)/.test(n)) return 'norma';
  if (/PROTOCOL|_LOCK/.test(n)) return 'protocol';
  return 'document';
}

function primerH1(cos) {
  /* H1 primer; si el document no en té (n'hi ha que comencen per `##`),
   * val el primer encapçalament de qualsevol nivell. Millor una description
   * imperfecta treta del cos que una d'inventada. */
  const l = cos.split('\n').find((x) => /^#{1,3}\s+/.test(x));
  return l ? l.replace(/^#{1,3}\s+/, '').replace(/[*_`]/g, '').trim().slice(0, 190) : null;
}

/* ──────────────────────────── Transformació ──────────────────────────── */

const canvis = [];
for (const n of NODES) {
  const abs = path.join(ARREL, n);
  const orig = fs.readFileSync(abs, 'utf8');
  const { fm, cru, cos } = parteix(orig);
  if (fm && esPlantillaBuida(cru)) continue; /* marcadors {…}: es deixa intacta */
  const { valors } = fm ? llig(cru) : { valors: new Map() };
  const nou = new Map();
  const registre = [];

  /* 1. renomenaments — el destí existent mana, el vell només omple buits */
  for (const [de, a] of Object.entries(E.migracio.renomena)) {
    if (!valors.has(de)) continue;
    const v = valors.get(de);
    if (a === 'tags') {
      const acc = [...(valors.get('tags') ?? []), ...(Array.isArray(v) ? v : [v])];
      valors.set('tags', acc);
    } else if (!valors.has(a) || !valors.get(a)) {
      valors.set(a, v);
    }
    valors.delete(de);
    registre.push(`${de} → ${a}`);
  }

  /* 2. claus fora */
  for (const k of [...valors.keys()]) if (FORA.has(k)) { valors.delete(k); registre.push(`− ${k}`); }

  /* 3. valors d'enum */
  for (const [k, mapa] of Object.entries(E.migracio.valors)) {
    const v = valors.get(k);
    if (typeof v === 'string' && mapa[v]) { valors.set(k, mapa[v]); registre.push(`${k}: ${v} → ${mapa[v]}`); }
  }

  /* 4. vocabulari de tags: normalitza, deduplica, ordena */
  if (valors.has('tags')) {
    const brut = valors.get('tags');
    const nets = [...new Set((Array.isArray(brut) ? brut : [brut])
      .map((t) => TAGS[String(t).trim().toLowerCase()])
      .filter(Boolean))].sort();
    if (nets.length) valors.set('tags', nets); else valors.delete('tags');
  }

  /* 5. omplir obligatòries que falten */
  if (!valors.get('type') && !valors.get('tipus')) { valors.set('type', deduTipus(n)); registre.push(`+ type: ${deduTipus(n)}`); }
  if (!valors.get('status') && !valors.get('estat')) { valors.set('status', 'esborrany'); registre.push('+ status: esborrany'); }
  if (!valors.get('description')) {
    const d = primerH1(cos);
    if (d) { valors.set('description', d); registre.push('+ description (des de l\'H1)'); }
  }

  /* 6. res que sobre de l'esquema */
  const ok = new Set(esSkill(n) ? ORDRE : [...OBL, ...OPC]);
  for (const k of [...valors.keys()]) if (!ok.has(k)) { valors.delete(k); registre.push(`− ${k}`); }

  nou.clear();
  const cap = escriu(valors, ORDRE);
  const resultat = cap + cos.replace(/^\n+/, '\n');
  if (resultat !== orig) canvis.push({ n, registre, orig, resultat });
}

/* ──────────────────────────── Eixida ──────────────────────────── */

console.log('\n🧹 CODEMOD FRONTMATTER — 34 claus → 8');
console.log('─'.repeat(72));
console.log(`  ${NODES.length} documents · ${canvis.length} a modificar\n`);

const resum = new Map();
for (const c of canvis) for (const r of c.registre) {
  const clau = r.replace(/:.*$/, '').trim();
  resum.set(clau, (resum.get(clau) ?? 0) + 1);
}
for (const [k, v] of [...resum].sort((a, b) => b[1] - a[1]).slice(0, 22)) {
  console.log(`  ${String(v).padStart(3)}×  ${k}`);
}

if (DIFF) {
  for (const c of canvis.slice(0, 8)) {
    console.log(`\n── ${c.n}`);
    console.log('  ABANS: ' + (parteix(c.orig).cru || '(cap)').trim().split('\n').join(' | '));
    console.log('  DESPRÉS: ' + parteix(c.resultat).cru.trim().split('\n').join(' | '));
  }
}

console.log('\n' + '─'.repeat(72));
if (!ESCRIU) {
  console.log('ASSAIG. Res escrit. Revisa amb --diff i aplica amb --escriu.');
  process.exit(0);
}

const copia = path.join(ARREL, `.frontmatter-copia-${Date.now()}`);
fs.mkdirSync(copia, { recursive: true });
for (const c of canvis) {
  const dest = path.join(copia, c.n);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, c.orig);
  fs.writeFileSync(path.join(ARREL, c.n), c.resultat);
}
console.log(`✍️  ${canvis.length} documents reescrits.`);
console.log(`🗃️  Còpia dels originals a ${path.relative(ARREL, copia)}/`);
console.log('   Comprova i esborra-la. Afig-la al .gitignore si no ho està.');
