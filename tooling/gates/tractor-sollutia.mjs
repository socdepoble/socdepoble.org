#!/usr/bin/env node
/**
 * tractor-sollutia.mjs — LA PORTA DE LA FRONTERA
 *
 * PER QUÈ EXISTIX
 * ───────────────
 *   Totes les portes actuals miren cap endins (src/, .agents/, wiki). Cap mira
 *   la costura: què passa quan el Web Component cau dins d'una pàgina que no
 *   controlem. L'auditoria 260831 va trobar quatre defectes que només es veuen
 *   des d'eixe costat i que cap `npm run porta` detecta.
 *
 * LLEIS
 *   S1 VAR-ORFE-AMFITRIO
 *       `var(--x, fallback)` a una superfície d'amfitrió (index.html,
 *       wordpress-plugin/**) on `--x` no es definix enlloc. El fallback pinta
 *       sempre i el token real no mana mai.
 *       Cas real: index.html usa `--sdp-fons-app`, blank.php usa `--sdp-bg`.
 *       Cap de les dos existix. Les dos cauen a #f4eee6, que no és cap token
 *       (el token de fons càlid és #fff4ef). Dos noms, cap definició, un color
 *       que no és el del sistema.
 *
 *   S2 INSTANCIA-UNICA
 *       `connectedCallback` desmunta les altres instàncies connectades. Dos
 *       blocs Gutenberg a la mateixa pàgina, o l'editor i la previsualització,
 *       i la primera mor. Un custom element que no admet dos instàncies és un
 *       singleton disfressat, i Sollutia no ho sabrà fins que ho trenque.
 *
 *   S3 ORDRE-CIRCULAR
 *       Una porta encadenada a `build` exigix un artefacte que només produïx
 *       una passa posterior de la mateixa cadena. En clon net, `npm run build`
 *       no pot passar mai.
 *       Cas real: `porta` crida `build-seo-manifest --verifica`, que exigix
 *       `wordpress-plugin/dist/seo-routes.json`; qui l'escriu és `build:seo`,
 *       que va després.
 *
 *   S4 TOKEN-MUT
 *       Token declarat a `design-tokens.json` (que es proclama «font única de
 *       veritat», status TANCAT) que cap fitxer consumix. Un contracte que
 *       ningú llig no és un contracte.
 *
 * Pedra Seca: zero dependències, ESM, fail-closed.
 *
 *   node tooling/gates/tractor-sollutia.mjs
 *   node tooling/gates/tractor-sollutia.mjs --json
 */

import fs from 'node:fs';
import path from 'node:path';

const ARG = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? null;
const ARREL = path.resolve(ARG('arrel') ?? process.cwd());
const JSON_OUT = process.argv.includes('--json');

const EXCLOU = /(^|\/)(node_modules|\.git|dist|build|coverage)(\/|$)/;
const EXT = new Set(['.css', '.js', '.jsx', '.mjs', '.ts', '.tsx', '.html', '.php']);

function fitxers(dir, acc = []) {
  const abs = path.join(ARREL, dir);
  if (!fs.existsSync(abs)) return acc;
  const st = fs.statSync(abs);
  if (st.isFile()) { acc.push(dir); return acc; }
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.posix.join(dir, e.name);
    if (EXCLOU.test(rel)) continue;
    if (e.isDirectory()) fitxers(rel, acc);
    else if (EXT.has(path.extname(e.name))) acc.push(rel);
  }
  return acc;
}

const TOTS = ['src', 'wordpress-plugin', 'index.html', 'public'].flatMap((d) => fitxers(d));
/* Superfícies d'amfitrió: el que pinta abans que React estiga viu. */
const AMFITRIO = TOTS.filter((f) => f === 'index.html' || f.startsWith('wordpress-plugin/'));

const llegeix = (f) => fs.readFileSync(path.join(ARREL, f), 'utf8');
const infr = [];
const afig = (llei, on, detall) => infr.push({ llei, on, detall });

/* ─────────────────────── S1 · variables òrfenes ─────────────────────── */

const definides = new Set();
for (const f of TOTS) {
  for (const m of llegeix(f).matchAll(/(--[\w-]+)\s*:/g)) definides.add(m[1]);
}
const fallbackPerVar = new Map();
for (const f of AMFITRIO) {
  const t = llegeix(f);
  for (const m of t.matchAll(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/g)) {
    const [, nom, fb] = m;
    if (nom.endsWith('-')) continue; /* concatenació dinàmica, no una variable */
    if (definides.has(nom)) continue;
    const linia = t.slice(0, m.index).split('\n').length;
    afig('S1', `${f}:${linia}`, `«${nom}» no es definix enlloc; pinta sempre el recurs ${fb ? `«${fb.trim()}»` : '(cap!)'}`);
    if (fb) {
      const k = fb.trim().toLowerCase();
      if (!fallbackPerVar.has(k)) fallbackPerVar.set(k, []);
      fallbackPerVar.get(k).push(nom);
    }
  }
}
for (const [valor, noms] of fallbackPerVar) {
  if (new Set(noms).size > 1) {
    afig('S1', 'amfitrió', `${new Set(noms).size} noms distints (${[...new Set(noms)].join(', ')}) per al mateix valor ${valor}: trieu-ne un`);
  }
}

/* ─────────────────────── S2 · instància única (Retirat: Ara es permeten múltiples) ─────────────────────── */

/* ─────────────────────── S3 · ordre circular ─────────────────────── */

const pkg = JSON.parse(llegeix('package.json'));
const S = pkg.scripts ?? {};
const desplega = (s, d = 0) => (d > 8 ? s : desplega(s.replace(/npm run ([\w:-]+)/g, (_, n) => S[n] ?? ''), d + 1));
const cadena = desplega(S.build ?? '');
const passes = cadena.split('&&').map((x) => x.trim());
/* Artefactes que una passa escriu (--escriu) i una altra exigix (--verifica). */
const escriu = new Map();
const verifica = [];
passes.forEach((p, i) => {
  const eina = /(?:node|sh)\s+([\w./-]+)/.exec(p)?.[1];
  if (!eina) return;
  if (/--escriu|--write|--baseline/.test(p)) escriu.set(eina, i);
  if (/--verifica|--verify|--check/.test(p)) verifica.push([eina, i, p]);
});
for (const [eina, i] of verifica) {
  const j = escriu.get(eina);
  if (j !== undefined && j > i) {
    afig('S3', 'package.json:build',
      `passa ${i + 1} executa «${eina} --verifica» però qui escriu l'artefacte és la passa ${j + 1}: en clon net no passa mai`);
  }
}

/* ─────────────────────── S4 · tokens muts ─────────────────────── */

const TOK = 'src/config/design-tokens.json';
if (fs.existsSync(path.join(ARREL, TOK))) {
  const tokens = JSON.parse(llegeix(TOK));
  const declarats = [];
  (function rec(o) {
    if (o && typeof o === 'object') {
      if (typeof o.css_var === 'string') declarats.push(o.css_var);
      for (const v of Object.values(o)) rec(v);
    }
  })(tokens);
  const consumits = new Set();
  for (const f of TOTS) {
    if (f === TOK) continue;
    for (const m of llegeix(f).matchAll(/var\(\s*(--[\w-]+)/g)) consumits.add(m[1]);
  }
  const muts = declarats.filter((v) => !consumits.has(v));
  const font = tokens?.meta?.font_unica_de_veritat === true;
  for (const v of muts) {
    afig('S4', TOK, `«${v}» declarat${font ? ' a la «font única de veritat»' : ''} i consumit 0 vegades`);
  }
  if (declarats.length && muts.length / declarats.length > 0.3) {
    afig('S4', TOK,
      `${muts.length}/${declarats.length} tokens muts (${Math.round(100 * muts.length / declarats.length)}%): `
      + 'la «font única de veritat» no governa el sistema real');
  }
}

/* ──────────────────────────────── Eixida ──────────────────────────────── */

const per = (l) => infr.filter((x) => x.llei === l);
const ETIQ = {
  S1: 'VAR-ORFE-AMFITRIÓ · el fallback pinta i el token no mana',
  S3: 'ORDRE-CIRCULAR · la porta exigix el que la porta encara no ha fet',
  S4: 'TOKEN-MUT · declarat i mai consumit',
};

if (JSON_OUT) {
  console.log(JSON.stringify({ ok: infr.length === 0, infraccions: infr }, null, 2));
  process.exit(infr.length ? 1 : 0);
}

console.log('\n🧱 TRACTOR DE LA FRONTERA (Sollutia)');
console.log('─'.repeat(72));
for (const l of ['S1', 'S3', 'S4']) {
  const x = per(l);
  console.log(`\n${x.length === 0 ? '✅' : '❌'} ${l} · ${ETIQ[l]} — ${x.length}`);
  for (const i of x.slice(0, 10)) console.log(`      ${i.on}\n        ↳ ${i.detall}`);
  if (x.length > 10) console.log(`      … i ${x.length - 10} més`);
}
console.log(`\n${'─'.repeat(72)}`);
if (infr.length) {
  console.error(`PARAT. ${infr.length} defecte(s) que Sollutia veurà abans que nosaltres.`);
  process.exit(1);
}
console.log('PASSA. La frontera aguanta.');
process.exit(0);
