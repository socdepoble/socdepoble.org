#!/usr/bin/env node
/**
 * tractor-cromatic.mjs — LA INQUISICIÓ DEL COLOR
 *
 * LLEI DURA. Sense sostre. Sense `--baseline`.
 *
 * PER QUÈ EXISTIX (auditoria Seient Núm. 5, iteració 006):
 *   `tractor-tokens.mjs` verifica que el vocabulari existix.
 *   Cap porta verificava que el vocabulari DIGA LA VERITAT.
 *
 *   El resultat: `--sdp-pedra-700` es va reancorar a `--sdp-neutre-500`
 *   i la rampa es va invertir (700 més clar que 600). El comentari
 *   «11,20:1» va sobreviure intacte al costat d'un color de 4,80:1.
 *   Cap gate ho va veure perquè cap gate sabia calcular contrast.
 *
 *   Un comentari de contrast no verificat és pitjor que cap comentari:
 *   dona permís per no comprovar-ho.
 *
 * LLEIS
 *   C1 · MONOTONIA — dins d'una família `--sdp-<fam>-<n>`, la lluminositat
 *        ha de decréixer estrictament quan `n` creix. Una rampa que puja
 *        i baixa no és una escala: és un contenidor de colors.
 *   C2 · VERACITAT — tot comentari `/* N,NN:1 *␘/` al costat d'un token
 *        semàntic ha de coincidir (±0,15) amb el contrast REAL calculat
 *        contra la superfície del seu tema.
 *   C3 · MANDAT PEDRA SECA — el text de cos i de títol han d'arribar a
 *        7:1 (AAA). L'usuari objectiu té 55–80 anys i llig a sol de
 *        migdia sobre un iPad A10. AA no és suficient ací.
 *   C4 · DOCUMENTACIÓ VIVA — cada etiqueta hexadecimal de
 *        `DesignSection.jsx` ha de coincidir amb el valor resolt del
 *        token que diu que representa.
 *   C5 · ÀNCORA CANÒNICA — els graons ancoratge de cada rampa han de
 *        citar `var(--sdp-canon-*)`, mai un literal.
 *   C6 · HEX SOTA EL TEMA — cap hexadecimal en cru per davall del darrer
 *        bloc de tema. Els primitius es declaren dalt; els components
 *        citen. Excepció declarada: el mostrari `.sw-*`.
 *
 * Ús:
 *   node tooling/gates/tractor-cromatic.mjs
 *   node tooling/gates/tractor-cromatic.mjs --nomes C1
 *   node tooling/gates/tractor-cromatic.mjs --arrel ../
 *
 * Eixides: 0 net · 1 infracció · 2 error d'execució.
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const arg = (nom, def = null) => {
  const i = process.argv.indexOf(nom);
  return i > -1 ? process.argv[i + 1] : def;
};
const ARREL = path.resolve(arg('--arrel', process.cwd()));
const NOMES = arg('--nomes');
const R = (rel) => path.join(ARREL, rel);

const FONT = 'src/css/tokens.css';
const CANON = 'src/css/design-tokens.css';
const MOSTRARI = 'src/sections/disseny/DesignSection.jsx';

/* ── Colorimetria ──────────────────────────────────────────────────── */

const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

function rgb(v) {
  const s = String(v).trim().toLowerCase();
  if (/^oklch\(\s*100%/.test(s)) return [255, 255, 255];
  if (/^oklch\(\s*0%/.test(s)) return [0, 0, 0];
  let m = /^#([0-9a-f]{3})$/.exec(s);
  if (m) return [...m[1]].map((c) => parseInt(c + c, 16));
  m = /^#([0-9a-f]{6})/.exec(s);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(s);
  if (m) return [1, 2, 3].map((i) => Math.round(+m[i]));
  return null;
}

const lum = (c) => {
  const [r, g, b] = c.map((v) => lin(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/* ── Lectura del tema ──────────────────────────────────────────────── */

for (const f of [FONT, CANON, MOSTRARI]) {
  if (!existsSync(R(f))) {
    console.error(`PARAT. No existix ${f}. Arrel equivocada?`);
    process.exit(2);
  }
}

const cssCanon = readFileSync(R(CANON), 'utf8');
const cssFont = readFileSync(R(FONT), 'utf8');
const linies = cssFont.split('\n');

/* El tema clar és tot el que hi ha abans del primer @media o [data-theme]. */
const talls = [cssFont.indexOf('@media'), cssFont.indexOf('[data-theme="dark"]')]
  .filter((i) => i > -1);
const finalTemaClar = talls.length ? Math.min(...talls) : cssFont.length;
const liniaFinalTema = cssFont.slice(0, finalTemaClar).split('\n').length;

const DEF = new Map();      // token → valor cru
const LINIA = new Map();    // token → línia on es declara
const posar = (txt, desplacament, fitxer) => {
  const ls = txt.split('\n');
  ls.forEach((l, i) => {
    for (const m of l.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)) {
      if (DEF.has(m[1])) continue;
      DEF.set(m[1], m[2].trim());
      LINIA.set(m[1], { fitxer, linia: i + 1 + desplacament });
    }
  });
};
posar(cssCanon, 0, CANON);
posar(cssFont.slice(0, finalTemaClar), 0, FONT);

function resol(v, prof = 0) {
  if (prof > 16 || v == null) return v;
  const m = /^var\(\s*(--[\w-]+)\s*\)$/.exec(String(v).trim());
  return m ? resol(DEF.get(m[1]), prof + 1) : String(v).trim();
}
const color = (tok) => rgb(resol(DEF.get(tok)));

/* ── Bastida d'informe ─────────────────────────────────────────────── */

const inf = [];
const OK = [];
const falla = (llei, on, msg) => inf.push({ llei, on, msg });
const actiu = (c) => !NOMES || NOMES === c;

/* ══════════════════════════════════════════════════════════════════
   C1 · MONOTONIA DE LES RAMPES
   ══════════════════════════════════════════════════════════════════ */
if (actiu('C1')) {
  let net = true;
  const families = new Map();
  for (const t of DEF.keys()) {
    const m = /^--sdp-([a-z]+)-(\d+)$/.exec(t);
    if (!m) continue;
    if (!families.has(m[1])) families.set(m[1], []);
    families.get(m[1]).push([+m[2], t]);
  }
  for (const [fam, llista] of families) {
    if (llista.length < 3) continue;
    llista.sort((a, b) => a[0] - b[0]);
    let prev = null;
    for (const [n, tok] of llista) {
      const c = color(tok);
      if (!c) continue;
      const L = lum(c);
      if (prev && L > prev.L + 1e-6) {
        net = false;
        const on = LINIA.get(tok);
        falla('C1 · Rampa invertida', `${on.fitxer}:${on.linia}`,
          `\`${tok}\` (${resol(DEF.get(tok))}, L=${L.toFixed(4)}) és MÉS CLAR que ` +
          `\`${prev.tok}\` (${resol(DEF.get(prev.tok))}, L=${prev.L.toFixed(4)}). ` +
          `La rampa «${fam}» puja i baixa: qualsevol semàntic ancorat ací hereta ` +
          `un contrast que ningú ha calculat.`);
      }
      prev = { L, tok, n };
    }
  }
  if (net) OK.push('C1 · Monotonia de rampes');
}

/* ══════════════════════════════════════════════════════════════════
   C2 · VERACITAT DELS COMENTARIS DE CONTRAST
   ══════════════════════════════════════════════════════════════════ */
/* La superfície contra la qual es mesura cada semàntic.
   `--sdp-sobre-X` es llig SOBRE `--sdp-X`; la resta, sobre la targeta. */
function superficieDe(tok) {
  const m = /^--sdp-sobre-(.+)$/.exec(tok);
  if (m) {
    const fons = `--sdp-${m[1]}`;
    const c = color(fons);
    if (c) return { c, nom: fons };
  }
  const targeta = color('--sdp-fons-targeta') || rgb('#ffffff');
  return { c: targeta, nom: '--sdp-fons-targeta' };
}

if (actiu('C2')) {
  let net = true;
  let comprovats = 0;
  linies.forEach((l, i) => {
    if (i + 1 > liniaFinalTema) return;
    const d = /(--sdp-[\w-]+)\s*:\s*([^;]+);\s*\/\*\s*([\d]+[.,][\d]+)\s*:\s*1/.exec(l);
    if (!d) return;
    const tok = d[1];
    const c = color(tok);
    if (!c) return;
    const sup = superficieDe(tok);
    comprovats++;
    const real = contrast(c, sup.c);
    const decl = parseFloat(d[3].replace(',', '.'));
    if (Math.abs(real - decl) > 0.15) {
      net = false;
      falla('C2 · Comentari fals', `${FONT}:${i + 1}`,
        `\`${tok}\` = ${resol(DEF.get(tok))} sobre \`${sup.nom}\` · el comentari ` +
        `declara ${decl.toFixed(2)}:1 però el contrast real és ${real.toFixed(2)}:1 ` +
        `(desviació ${real - decl >= 0 ? '+' : ''}${(real - decl).toFixed(2)}). ` +
        `Un comentari no verificat dona permís per no comprovar-ho.`);
    }
  });
  if (net) OK.push(`C2 · Veracitat de contrastos (${comprovats} comprovats)`);
}

/* ══════════════════════════════════════════════════════════════════
   C3 · MANDAT PEDRA SECA — text ≥ 7:1
   ══════════════════════════════════════════════════════════════════ */
const MANDAT = {
  '--sdp-text-titol': 7,
  '--sdp-text-cos': 7,
  '--sdp-text-suau': 7,
  '--sdp-accio-text': 4.5,
  '--sdp-accent-text': 4.5,
};

if (actiu('C3')) {
  let net = true;
  for (const [tok, min] of Object.entries(MANDAT)) {
    const c = color(tok);
    if (!c) {
      net = false;
      falla('C3 · Mandat Pedra Seca', FONT, `\`${tok}\` no es resol a cap color.`);
      continue;
    }
    const r = contrast(c, rgb('#ffffff'));
    if (r < min - 1e-9) {
      net = false;
      const on = LINIA.get(tok) || { fitxer: FONT, linia: '?' };
      falla('C3 · Mandat Pedra Seca', `${on.fitxer}:${on.linia}`,
        `\`${tok}\` = ${resol(DEF.get(tok))} dona ${r.toFixed(2)}:1 sobre blanc; ` +
        `el mandat n'exigix ${min}:1. Usuari de 55–80 anys, cataractes, ` +
        `sol de migdia, iPad A10. Ací AA no és un aprovat.`);
    }
  }
  if (net) OK.push('C3 · Mandat Pedra Seca (text AAA)');
}

/* ══════════════════════════════════════════════════════════════════
   C4 · DOCUMENTACIÓ VIVA
   ══════════════════════════════════════════════════════════════════ */
if (actiu('C4')) {
  let net = true;
  const ds = readFileSync(R(MOSTRARI), 'utf8').split('\n');
  ds.forEach((l, i) => {
    for (const m of l.matchAll(/(#[0-9a-fA-F]{3,8})\s*<br\s*\/?>\s*(--sdp-[\w-]+)/g)) {
      const lit = m[1].toLowerCase();
      const tok = m[2];
      const real = resol(DEF.get(tok));
      if (!real) {
        net = false;
        falla('C4 · Documentació viva', `${MOSTRARI}:${i + 1}`,
          `El mostrari documenta \`${tok}\`, que no existix al tema.`);
        continue;
      }
      const a = rgb(lit); const b = rgb(real);
      if (!a || !b) continue;
      if (a.join() !== b.join()) {
        net = false;
        falla('C4 · Documentació viva', `${MOSTRARI}:${i + 1}`,
          `L'etiqueta diu \`${lit}\` per a \`${tok}\`, però el token val ` +
          `\`${real}\`. La pàgina que documenta el sistema és la que més ` +
          `s'ha de creure: si menteix, propaga la mentida a tot qui la llija.`);
      }
    }
  });
  if (net) OK.push('C4 · Documentació viva');
}

/* ══════════════════════════════════════════════════════════════════
   C5 · ÀNCORA CANÒNICA
   ══════════════════════════════════════════════════════════════════ */
const ANCORES = ['--sdp-primary-500', '--sdp-secondary-500'];

if (actiu('C5')) {
  let net = true;
  for (const tok of ANCORES) {
    const cru = DEF.get(tok);
    if (cru == null) continue;
    if (!/^var\(\s*--sdp-canon-/.test(cru)) {
      net = false;
      const on = LINIA.get(tok) || { fitxer: FONT, linia: '?' };
      falla('C5 · Àncora canònica', `${on.fitxer}:${on.linia}`,
        `\`${tok}: ${cru}\`. Un graó ancoratge ha de citar \`var(--sdp-canon-*)\`. ` +
        `Si el cànon i la rampa poden divergir en silenci, tenim dos sistemes ` +
        `de disseny amb un sol nom.`);
    }
  }
  if (net) OK.push('C5 · Àncores canòniques');
}

/* ══════════════════════════════════════════════════════════════════
   C6 · HEX SOTA EL TEMA
   ══════════════════════════════════════════════════════════════════ */
const EXEMPT_C6 = /^\s*\.sw-/;

/* Un bloc de tema és qualsevol selector que declare tokens per a tot
   l'arbre: :root, :host, .sdp-root, [data-theme] o un @media de tema. */
const OBRE_TEMA =
  /(:root|:host|\.sdp-root|\[data-theme|@media\s*\((?:prefers-color-scheme|prefers-contrast|forced-colors))/;

const dinsTema = new Set();
{
  let dins = false, prof = 0;
  linies.forEach((l, i) => {
    if (!dins && OBRE_TEMA.test(l) && l.includes('{')) { dins = true; prof = 0; }
    if (dins) {
      dinsTema.add(i + 1);
      prof += (l.match(/\{/g) || []).length - (l.match(/\}/g) || []).length;
      if (prof <= 0) dins = false;
    }
  });
}

if (actiu('C6')) {
  let net = true;
  linies.forEach((l, i) => {
    if (dinsTema.has(i + 1)) return;
    if (EXEMPT_C6.test(l)) return;
    if (/^\s*(\/\*|\*|\/\/)/.test(l)) return;
    for (const m of l.matchAll(/#([0-9a-fA-F]{3,8})\b/g)) {
      if (![3, 4, 6, 8].includes(m[1].length)) continue;
      net = false;
      falla('C6 · Hex fora de tema', `${FONT}:${i + 1}`,
        `\`#${m[1]}\` en cru fora d'un bloc de tema. Un color escrit ací no ` +
        `canvia amb el tema fosc ni amb el mode d'alt contrast: es queda ` +
        `clavat mentre tota la resta es mou.`);
    }
  });
  if (net) OK.push('C6 · Cap hex fora dels blocs de tema');
}

/* ══════════════════════════════════════════════════════════════════
   INFORME
   ══════════════════════════════════════════════════════════════════ */
const banda = '─'.repeat(74);
console.log(
  `\n🎨 TRACTOR CROMÀTIC — la Inquisició del Color\n` +
  `   ${DEF.size} tokens resolts · tema clar fins a la línia ${liniaFinalTema}\n${banda}`
);
for (const l of OK) console.log(`  ✅ ${l}`);

if (inf.length) {
  const perLlei = new Map();
  for (const x of inf) {
    if (!perLlei.has(x.llei)) perLlei.set(x.llei, []);
    perLlei.get(x.llei).push(x);
  }
  console.log(`\n❌ INFRACCIONS (${inf.length})\n${banda}`);
  for (const [llei, llista] of perLlei) {
    console.log(`\n  ${llei}  (${llista.length})`);
    for (const x of llista.slice(0, 12)) {
      console.log(`    ${x.on}`);
      console.log(`      ↳ ${x.msg}`);
    }
    if (llista.length > 12) console.log(`    … i ${llista.length - 12} més.`);
  }
  console.log(`\n${banda}`);
  console.log('El color no diu la veritat. Esta llei no admet sostre de deute.\n');
  process.exit(1);
}

console.log(`\n${banda}\nEl color diu la veritat.\n`);
process.exit(0);
