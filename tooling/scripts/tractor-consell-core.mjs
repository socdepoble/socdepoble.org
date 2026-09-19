#!/usr/bin/env node
/**
 * tractor-consell.mjs — Porta mecànica de l'Auditoria Global (Seient Núm. 5)
 *
 * Zero dependències. Vanilla ESM. Un sol contracte: si una norma no té
 * `process.exit(1)`, no és una norma, és una preferència.
 *
 * Ús:
 *   node tooling/gates/tractor-consell.mjs            # arrel del repo
 *   node tooling/gates/tractor-consell.mjs --root ../ # arrel explícita
 *
 * Codis d'eixida:
 *   0 = cap infracció
 *   1 = almenys una infracció P0/P1
 *   2 = error d'execució del propi tractor (fitxers base absents)
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = (() => {
  const i = process.argv.indexOf('--root');
  return path.resolve(i > -1 ? process.argv[i + 1] : process.cwd());
})();

const infraccions = [];
const avisos = [];
const OK = [];

const falla = (llei, fitxer, linia, missatge) =>
  infraccions.push({ llei, fitxer, linia, missatge });
const avisa = (llei, fitxer, missatge) => avisos.push({ llei, fitxer, missatge });
const passa = (llei) => OK.push(llei);

const R = (rel) => path.join(ROOT, rel);
const llig = (rel) => (existsSync(R(rel)) ? readFileSync(R(rel), 'utf8') : null);
const linies = (txt) => txt.split('\n');

function arbre(rel, filtre) {
  const base = R(rel);
  if (!existsSync(base)) return [];
  const eixida = [];
  const passeja = (dir) => {
    for (const nom of readdirSync(dir)) {
      if (nom === 'node_modules' || nom.startsWith('.git')) continue;
      const p = path.join(dir, nom);
      if (statSync(p).isDirectory()) passeja(p);
      else if (filtre.test(nom)) eixida.push(p);
    }
  };
  passeja(base);
  return eixida;
}

/* ══════════════════════════════════════════════════════════════════
   LLEI 1 · CAP INTERRUPTOR MORT
   Cap constant literal pot decidir el mode de dades en temps de build.
   ══════════════════════════════════════════════════════════════════ */
{
  const LLEI = 'L1 · Interruptor mort';
  const backend = llig('src/data/supabaseBackend.js');
  if (!backend) {
    avisa(LLEI, 'src/data/supabaseBackend.js', 'Fitxer absent: no es pot verificar.');
  } else {
    let trobat = false;
    linies(backend).forEach((l, i) => {
      // const X = true/false;  usat després per a forçar un mode
      const m = l.match(/^\s*const\s+([A-Z_][A-Z0-9_]*)\s*=\s*(true|false)\s*;/);
      if (m && new RegExp(`${m[1]}\\s*\\?`).test(backend)) {
        trobat = true;
        falla(LLEI, 'src/data/supabaseBackend.js', i + 1,
          `\`${m[1]} = ${m[2]}\` plega el mode en temps de build. Tot el camí remot queda mort.`);
      }
    });
    if (/TODO|FIXME|HACK/.test(backend)) {
      const n = linies(backend).findIndex((l) => /TODO|FIXME|HACK/.test(l));
      falla(LLEI, 'src/data/supabaseBackend.js', n + 1,
        'TODO/FIXME dins la capa de dades: deute tècnic sense data de caducitat.');
    }
    if (!trobat) passa(LLEI);
  }
}

/* ══════════════════════════════════════════════════════════════════
   LLEI 2 · dataMode AMB LLISTA BLANCA
   Un mode desconegut no pot caure silenciosament en el camí remot.
   ══════════════════════════════════════════════════════════════════ */
{
  const LLEI = 'L2 · dataMode validat';
  const backend = llig('src/data/supabaseBackend.js');
  if (backend) {
    const teNormalitzador =
      /normalizeDataMode|DATA_MODES\s*=\s*(new Set|\[)/.test(backend);
    if (!teNormalitzador) {
      falla(LLEI, 'src/data/supabaseBackend.js', 0,
        'No hi ha `normalizeDataMode()` ni llista blanca de modes. Un `dataMode` desconegut cau al camí remot per defecte.');
    } else passa(LLEI);
  }
}

/* ══════════════════════════════════════════════════════════════════
   LLEI 3 · CONTRACTE DEL TEMA
   El conjunt de valors que escriu el PHP ha de ser el conjunt que
   entén el JS i el conjunt que entén el CSS. Tres capes, un vocabulari.
   ══════════════════════════════════════════════════════════════════ */
{
  const LLEI = 'L3 · Contracte del tema';
  const php = llig('wordpress-plugin/inc/sdp-tema.php');
  const ctx = llig('src/app/AppDataContext.jsx');
  const css = llig('src/css/index.css');
  let net = true;

  const valorsPHP = new Set();
  if (php) for (const m of php.matchAll(/saved\s*===\s*'([a-z]+)'/g)) valorsPHP.add(m[1]);

  const valorsCSS = new Set();
  if (css) for (const m of css.matchAll(/data-theme=["']([a-z]+)["']/g)) valorsCSS.add(m[1]);

  if (ctx) {
    const idx = linies(ctx).findIndex((l) =>
      /localStorage\.getItem\(\s*'socdepoble-theme-mode'\s*\)\s*\|\|/.test(l));
    if (idx > -1) {
      net = false;
      falla(LLEI, 'src/app/AppDataContext.jsx', idx + 1,
        "El tema es llig de localStorage sense resoldre'l. Si el valor guardat és 'system', React posa data-theme=\"system\", que no casa amb cap regla CSS.");
    }
    if (!/prefers-color-scheme/.test(ctx)) {
      net = false;
      falla(LLEI, 'src/app/AppDataContext.jsx', 0,
        "Cap resolució de `prefers-color-scheme` al costat React: el primer visitant amb SO fosc obté <html> fosc i component clar.");
    }
  }

  const CONEGUTS = new Set(['light', 'dark', 'system']);
  for (const v of valorsPHP) {
    if (!valorsCSS.has(v) && !CONEGUTS.has(v)) {
      net = false;
      falla(LLEI, 'wordpress-plugin/inc/sdp-tema.php', 0,
        `El PHP accepta el valor de tema '${v}' que el CSS no reconeix.`);
    }
  }
  if (valorsPHP.has('system') && ctx && !/'system'/.test(ctx)) {
    net = false;
    falla(LLEI, 'src/app/AppDataContext.jsx', 0,
      "El PHP guarda 'system' com a valor vàlid però el context React no el coneix.");
  }
  if (net) passa(LLEI);
}

/* ══════════════════════════════════════════════════════════════════
   LLEI 4 · SIMETRIA SHADOW DOM
   Dins d'un shadow root, `:root` no casa amb res. Tota regla
   `:root[data-theme]` necessita el bessó `:host([data-theme])`.
   ══════════════════════════════════════════════════════════════════ */
{
  const LLEI = 'L4 · Simetria :root/:host';
  const css = llig('src/css/index.css');
  if (css) {
    let net = true;
    linies(css).forEach((l, i) => {
      if (!/:root\[data-theme/.test(l)) return;
      if (/:host\(\[data-theme/.test(l)) return;
      net = false;
      falla(LLEI, 'src/css/index.css', i + 1,
        `Regla orfe sense bessó :host — morta dins del Shadow DOM: ${l.trim().slice(0, 80)}`);
    });
    if (net) passa(LLEI);
  }
}

/* ══════════════════════════════════════════════════════════════════
   LLEI 5 · LLEI DE VIDA (44px)
   Cap control interactiu per davall de --sdp-touch, a cap breakpoint.
   ══════════════════════════════════════════════════════════════════ */
{
  const LLEI = 'L5 · Llei de Vida (44px)';
  const css = llig('src/css/index.css');
  const MIN = 44;
  const INTERACTIU = /(button|\.btn|\.nav-item|\.sp-card-action|\.sp-card-connect|\.page-btn|\.icon\b|\.audio-play-btn|\.file-item-action|summary)/;
  if (css) {
    let net = true;
    linies(css).forEach((l, i) => {
      if (!INTERACTIU.test(l)) return;
      // Només mesures que fixen la CAIXA TÀCTIL (min-*), no la mida d'una icona interior.
      if (!/\bmin-(height|width)\s*:/.test(l)) return;
      for (const m of l.matchAll(/\b(min-height|min-width|height|width)\s*:\s*(\d+)px/g)) {
        const px = Number(m[2]);
        if (px < MIN) {
          net = false;
          falla(LLEI, 'src/css/index.css', i + 1,
            `${m[1]}: ${px}px < ${MIN}px en un control interactiu — ${l.trim().slice(0, 70)}`);
        }
      }
    });
    if (net) passa(LLEI);
  }
}

/* ══════════════════════════════════════════════════════════════════
   LLEI 6 · i18n TANCAT
   Tota clau usada ha d'existir. Tot idioma ha de tindre el mateix joc.
   ══════════════════════════════════════════════════════════════════ */
{
  const LLEI = 'L6 · i18n tancat';
  const i18n = llig('src/config/i18n.js');
  if (i18n) {
    let net = true;
    const IDIOMES = new Set(
      [...i18n.matchAll(/code:\s*'([a-z]{2})'/g)].map((m) => m[1])
    );
    const blocs = {};
    for (const m of i18n.matchAll(/^ {2}([a-z]{2}): \{/gm)) {
      if (!IDIOMES.has(m[1])) continue;
      let d = 1, j = m.index + m[0].length;
      while (j < i18n.length && d) { d += i18n[j] === '{' ? 1 : i18n[j] === '}' ? -1 : 0; j++; }
      blocs[m[1]] = new Set([...i18n.slice(m.index, j).matchAll(/'([\w.]+)'\s*:/g)].map((x) => x[1]));
    }
    const base = blocs.ca || new Set();
    for (const [codi, joc] of Object.entries(blocs)) {
      const falten = [...base].filter((k) => !joc.has(k));
      if (falten.length) {
        net = false;
        falla(LLEI, 'src/config/i18n.js', 0,
          `'${codi}' li falten ${falten.length} claus respecte de 'ca' (p. ex. ${falten.slice(0, 3).join(', ')}).`);
      }
    }
    const usades = new Set();
    for (const f of arbre('src', /\.(js|jsx)$/)) {
      if (f.endsWith('i18n.js')) continue;
      for (const m of readFileSync(f, 'utf8').matchAll(/\bt\(\s*['"]([\w.]+)['"]/g)) usades.add(m[1]);
    }
    const orfes = [...usades].filter((k) => !base.has(k));
    if (orfes.length) {
      net = false;
      falla(LLEI, 'src/config/i18n.js', 0,
        `Claus usades al codi i definides en cap idioma: ${orfes.join(', ')}`);
    }
    if (net) passa(LLEI);
  }
}

/* ══════════════════════════════════════════════════════════════════
   LLEI 7 · SENSE ÒRGANS MORTS
   Cap funció o constant de mòdul declarada i mai usada.
   ══════════════════════════════════════════════════════════════════ */
{
  const LLEI = 'L7 · Sense òrgans morts';
  let net = true;
  for (const f of arbre('src', /\.(js|jsx)$/)) {
    const src = readFileSync(f, 'utf8');
    const rel = path.relative(ROOT, f);
    const decls = [
      ...src.matchAll(/^(?:async )?function ([A-Za-z_$][\w$]*)/gm),
      ...src.matchAll(/^const ([A-Za-z_$][\w$]*)\s*=/gm)
    ];
    for (const d of decls) {
      const nom = d[1];
      if (/^(default|App)$/.test(nom)) continue;
      if (new RegExp(`export\\s[\\s\\S]*\\b${nom}\\b`).test(src)) continue;
      const usos = (src.match(new RegExp(`\\b${nom}\\b`, 'g')) || []).length;
      if (usos <= 1) {
        net = false;
        falla(LLEI, rel, linies(src.slice(0, d.index)).length,
          `\`${nom}\` declarat i mai usat (òrgan mort).`);
      }
    }
  }
  if (net) passa(LLEI);
}

/* ══════════════════════════════════════════════════════════════════
   LLEI 8 · CONTRACTE PHP ↔ REACT
   Tota funció sdp_*() invocada ha d'estar definida dins del plugin,
   i el manifest de rutes ha d'existir abans de publicar.
   ══════════════════════════════════════════════════════════════════ */
{
  const LLEI = 'L8 · Contracte PHP';
  const fitxers = arbre('wordpress-plugin', /\.php$/);
  if (fitxers.length) {
    let net = true;
    const definides = new Set();
    const invocades = new Map();
    for (const f of fitxers) {
      const src = readFileSync(f, 'utf8');
      const rel = path.relative(ROOT, f);
      for (const m of src.matchAll(/^function\s+(sdp_[a-z0-9_]+)/gm)) definides.add(m[1]);
      linies(src).forEach((l, i) => {
        if (/^\s*(\*|\/\/)/.test(l)) return;
        for (const m of l.matchAll(/(?<!function\s)\b(sdp_[a-z0-9_]+)\s*\(/g)) {
          if (/function_exists\(\s*'[^']*'\s*\)/.test(l) && l.indexOf(m[1]) > l.indexOf('function_exists')) continue;
          if (!invocades.has(m[1])) invocades.set(m[1], `${rel}:${i + 1}`);
        }
      });
      if (!/defined\(\s*'ABSPATH'\s*\)/.test(src)) {
        net = false;
        falla(LLEI, rel, 1, "Falta el guarda `defined('ABSPATH') || exit;` (accés directe al fitxer).");
      }
    }
    for (const [nom, on] of invocades) {
      if (definides.has(nom)) continue;
      net = false;
      const [rel, ln] = on.split(':');
      falla(LLEI, rel, Number(ln),
        `\`${nom}()\` invocada sense guarda i sense definició dins del plugin → fatal si l'ordre de càrrega canvia.`);
    }
    if (!existsSync(R('wordpress-plugin/dist/seo-routes.json'))) {
      net = false;
      falla(LLEI, 'wordpress-plugin/dist/seo-routes.json', 0,
        'Manifest de rutes absent: sdp_resolve_request() retornarà 404 en TOTES les rutes React.');
    }
    if (net) passa(LLEI);
  }
}

/* ══════════════════════════════════════════════════════════════════
   LLEI 9 · CAP SECRET AL DIST
   Cap URL de projecte ni clau dins d'un artefacte versionat.
   ══════════════════════════════════════════════════════════════════ */
{
  const LLEI = 'L9 · Cap secret al dist';
  let net = true;
  const PATRONS = [
    [/https:\/\/[a-z0-9]{15,}\.supabase\.co/g, 'URL del projecte Supabase'],
    [/\bsb_(publishable|secret)_[A-Za-z0-9_-]{10,}/g, 'clau Supabase'],
    [/\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g, 'JWT (possible service_role)'],
    [/service_role/g, 'referència a service_role']
  ];
  for (const f of [...arbre('wordpress-plugin/dist', /\.(js|json|css)$/), ...arbre('dist', /\.(js|json|css)$/)]) {
    const src = readFileSync(f, 'utf8');
    const rel = path.relative(ROOT, f);
    for (const [re, etiqueta] of PATRONS) {
      const t = src.match(re);
      if (t) {
        net = false;
        falla(LLEI, rel, 0,
          `${etiqueta} incrustada a l'artefacte versionat (${t.length} apar.). Rotar-la exigix recompilar i es filtra a cada bundle d'auditoria.`);
      }
    }
  }
  if (net) passa(LLEI);
}



/* ══════════════════════════════════════════════════════════════════
   INFORME
   ══════════════════════════════════════════════════════════════════ */
const banda = '─'.repeat(72);
console.log(`\n🚜 TRACTOR DEL CONSELL — ${path.basename(ROOT)}\n${banda}`);

for (const l of OK) console.log(`  ✅ ${l}`);

if (avisos.length) {
  console.log(`\n⚠️  AVISOS (${avisos.length})`);
  for (const a of avisos) console.log(`  · [${a.llei}] ${a.fitxer} — ${a.missatge}`);
}

if (infraccions.length) {
  console.log(`\n❌ INFRACCIONS (${infraccions.length})\n${banda}`);
  const perLlei = new Map();
  for (const i of infraccions) {
    if (!perLlei.has(i.llei)) perLlei.set(i.llei, []);
    perLlei.get(i.llei).push(i);
  }
  for (const [llei, llista] of perLlei) {
    console.log(`\n  ${llei}  (${llista.length})`);
    for (const i of llista.slice(0, 12)) {
      console.log(`    ${i.fitxer}${i.linia ? ':' + i.linia : ''}`);
      console.log(`      ↳ ${i.missatge}`);
    }
    if (llista.length > 12) console.log(`    … i ${llista.length - 12} més.`);
  }
  console.log(`\n${banda}`);
  console.log(`El bancal no passa. ${infraccions.length} infraccions.\n`);
  process.exit(1);
}

console.log(`\n${banda}\nBancal net. Es pot obrir el solc del Xat.\n`);
process.exit(0);
