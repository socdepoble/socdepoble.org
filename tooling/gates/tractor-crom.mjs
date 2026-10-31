#!/usr/bin/env node
/**
 * tractor-crom.mjs — LA CLOSCA IMMUTABLE
 *
 * LLEI DURA. Sense sostre. Sense `--baseline`.
 *
 * PER QUÈ EXISTIX (dictamen Seient Núm. 5, 260911):
 *   La TopBar (header.bar-black) i la SideBar (nav.app-sidebar) han de ser
 *   idèntiques en clar i en fosc. No ho eren: 10 declaracions de la closca
 *   penjaven de semàntics que el bloc fosc redefinix. Resultats mesurats:
 *     · .nav-item--system.active en fosc: text negre sobre negre (1,23:1).
 *     · .sdp-top-bar-btn:hover en clar: icona blanca sobre quasi blanc (1,18:1).
 *     · .sidebar-control-btn: canviava de blau i de color de text.
 *   I la doctrina (pedra-seca/SKILL.md) es contradia en tres línies, així que
 *   cada IA pintava la closca a la seua manera.
 *
 * LLEIS
 *   K1 · SOBIRANIA — cada `--sdp-crom-*` es declara UNA vegada, en un bloc
 *        `:root` que no siga de tema fosc. Redefinir-lo en fosc és prohibit.
 *   K2 · SENSE TEMA — cap regla de la closca viu dins d'un context fosc
 *        (`[data-theme="dark"]` o `prefers-color-scheme: dark`).
 *   K3 · NOMÉS CROM — les propietats de color de la closca només admeten
 *        `var(--sdp-crom-*)` o paraules clau (transparent, inherit,
 *        currentColor, none…). Cap altre token, cap literal de color.
 *   K4 · RECTANGLE PUR — els botons de la SideBar (`nav.app-sidebar .nav-item`
 *        i `.sidebar-control-btn`) porten `border-radius: 0` (o `inherit`) i
 *        mai `width: 100%` (el «fantasma» de punta a punta). Ordre del Mestre
 *        (T15, 260930; regla definitiva del 260927 vespre i CONTROL de bloc
 *        sencer del 260913): la barra principal és un llistat a sang, rectangle
 *        pur de banda a banda (layout.css, T15). Abans K4 exigia la pastilla
 *        (var(--sdp-radi-pastilla)), que contradiu eixa ordre. Ordre del Mestre
 *        (T15, 260930; 30-10-2026, portes en verd): el radi es mira a tota
 *        regla de la closca que acabe en `.nav-item` o `.sidebar-control-btn`
 *        (`.nav-item.active`, `.sdp-root .nav-item:hover`…), perquè una de més
 *        específica que la base arrodoniria la barra lateral. Només el selector
 *        `.nav-item` nu i exacte, el de la barra mòbil, queda fora d'abast del radi.
 *   K5 · SENSE ORFES — tot `var(--sdp-crom-*)` citat està declarat.
 *   K6 · ESQUEMA FIX — `nav.app-sidebar` i `header.bar-black` declaren
 *        `color-scheme: dark`. Sense açò els controls natius (<button>,
 *        scroll) hereten els colors UA del tema: el botó de la marca passava
 *        de negre a blanc. Ho va caçar Chromium, no aquest parser.
 *
 *   Fora d'abast: `.mobile-nav` (navegació inferior mòbil, té el seu disseny).
 *
 * Ús:
 *   node tooling/gates/tractor-crom.mjs
 *   node tooling/gates/tractor-crom.mjs --css=ruta.css   # només eixe full
 *
 * Eixides: 0 net · 1 infracció · 2 error d'execució.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ARREL = process.cwd();
const ARG_CSS = process.argv.filter((a) => a.startsWith('--css=')).map((a) => a.slice(6));

const CLOSCA = /(app-sidebar|bar-black|\.brand\b|sidebar-control-btn|app-sidebar-nav|\.nav-item|right-icons|sdp-top-bar-btn|mobile-logo|iaia-icon|app-avatar-img|sdp-avatar-placeholder|icona-linia|app-brand__mark)/;
const FORA = /\.mobile-nav\b/;
const BOTONS_SIDEBAR = /(\.nav-item|\.sidebar-control-btn)(?![\w-])/;
/* K4 · el radi (també el d'una cantonada) i el rectangle pur: zero, amb unitat o sense, o inherit. */
const RADI = /^border(-(top|bottom)-(left|right)|-(start|end)-(start|end))?-radius$/;
const RADI_RECTE = /^(?:0(?:px|r?em|%)?|inherit)$/;
const PROP_COLOR = /^(color|background(-color|-image)?|border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-color)?|outline(-color)?|box-shadow|text-shadow|fill|stroke|scrollbar-color|caret-color|text-decoration(-color)?|column-rule(-color)?|accent-color)$/;
const PARAULES_CLAU = new Set(['transparent', 'inherit', 'initial', 'unset', 'revert', 'currentcolor', 'none', '0', 'solid', 'dashed', 'dotted', 'thin', 'auto']);
const FOSC = /data-theme\s*=\s*["']?dark|prefers-color-scheme\s*:\s*dark/;

function fullsCss() {
  if (ARG_CSS.length) return ARG_CSS;
  const acc = [];
  const camina = (dir) => {
    for (const nom of readdirSync(dir)) {
      if (nom === 'node_modules' || nom.startsWith('.')) continue;
      const abs = join(dir, nom);
      if (statSync(abs).isDirectory()) camina(abs);
      else if (nom.endsWith('.css')) acc.push(abs);
    }
  };
  const src = join(ARREL, 'src');
  if (!existsSync(src)) throw new Error('No trobe src/. Executa des de l\'arrel del projecte.');
  camina(src);
  return acc;
}

/** Parser mínim: blocs amb pila de preludis, línia d'inici i declaracions. */
function analitza(css) {
  const regles = [];
  const pila = [];
  let buf = '';
  let linia = 1;
  let liniaBuf = 1;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '/' && css[i + 1] === '*') {
      const f = css.indexOf('*/', i + 2);
      const fi = f === -1 ? css.length : f + 2;
      for (let k = i; k < fi; k++) if (css[k] === '\n') linia++;
      i = fi - 1;
      continue;
    }
    if (c === '"' || c === "'") {
      let k = i + 1;
      while (k < css.length && css[k] !== c) { if (css[k] === '\\') k++; k++; }
      buf += css.slice(i, k + 1);
      i = k;
      continue;
    }
    if (c === '\n') linia++;
    if (!buf.trim()) liniaBuf = linia;
    if (c === '{') {
      pila.push({ preludi: buf.trim(), linia: liniaBuf });
      buf = '';
    } else if (c === '}') {
      const bloc = pila.pop();
      if (bloc && !bloc.preludi.startsWith('@')) {
        const decls = [];
        for (const tros of buf.split(';')) {
          const d = tros.indexOf(':');
          if (d === -1) continue;
          const prop = tros.slice(0, d).trim().toLowerCase();
          const valor = tros.slice(d + 1).trim().replace(/\s*!important$/i, '');
          if (prop) decls.push({ prop, valor });
        }
        const context = [...pila.map((p) => p.preludi), bloc.preludi].join(' ');
        regles.push({ selector: bloc.preludi, context, linia: bloc.linia, decls });
      }
      buf = '';
    } else if (c === ';' && (pila.length === 0 || pila[pila.length - 1].preludi.startsWith('@'))) {
      buf = '';
    } else {
      buf += c;
    }
  }
  return regles;
}

const infraccions = [];
const registra = (llei, fitxer, linia, missatge) => infraccions.push({ llei, fitxer, linia, missatge });

const declarats = new Map();
const citats = [];

let fulls;
try { fulls = fullsCss(); } catch (e) { console.error(`💥 ${e.message}`); process.exit(2); }

for (const abs of fulls) {
  const fitxer = relative(ARREL, abs) || abs;
  let regles;
  try { regles = analitza(readFileSync(abs, 'utf8')); } catch (e) { console.error(`💥 ${fitxer}: ${e.message}`); process.exit(2); }

  for (const r of regles) {
    const fosc = FOSC.test(r.context);
    const selectors = r.selector.split(',').map((s) => s.trim()).filter(Boolean);

    for (const d of r.decls) {
      if (d.prop.startsWith('--sdp-crom-')) {
        const esRoot = selectors.some((s) => /^:root\b/.test(s));
        if (fosc || !esRoot) {
          registra('K1', fitxer, r.linia, `\`${d.prop}\` declarat a «${r.selector.slice(0, 60)}». Només es pot declarar al :root clar.`);
        }
        if (!fosc && esRoot) {
          if (declarats.has(d.prop)) registra('K1', fitxer, r.linia, `\`${d.prop}\` declarat dues vegades (primera: línia ${declarats.get(d.prop)}).`);
          else declarats.set(d.prop, r.linia);
        }
      }
      for (const m of d.valor.matchAll(/var\(\s*(--sdp-crom-[\w-]+)/g)) citats.push({ token: m[1], fitxer, linia: r.linia });
    }

    const closca = selectors.filter((s) => CLOSCA.test(s) && !FORA.test(s));
    if (!closca.length) continue;
    if (fosc) {
      registra('K2', fitxer, r.linia, `Regla de la closca dins d'un context fosc: «${closca[0].slice(0, 70)}». La closca no té tema.`);
    }

    for (const d of r.decls) {
      if (!PROP_COLOR.test(d.prop)) continue;
      const tokens = [...d.valor.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]);
      const forasters = tokens.filter((t) => !t.startsWith('--sdp-crom-'));
      const sensVars = d.valor.replace(/var\([^)]*\)/g, ' ');
      const literal = /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|oklch|oklab|lab|lch|hwb|color)\(/i.test(sensVars);
      const paraules = sensVars.toLowerCase().split(/[\s,/]+/).filter(Boolean)
        .filter((p) => !PARAULES_CLAU.has(p) && !/^-?[\d.]+(px|em|rem|%)?$/.test(p));
      if (forasters.length) {
        registra('K3', fitxer, r.linia, `«${closca[0].slice(0, 50)}» { ${d.prop}: ${d.valor} } cita ${forasters.join(', ')}. La closca només pinta amb --sdp-crom-*.`);
      } else if (literal) {
        registra('K3', fitxer, r.linia, `«${closca[0].slice(0, 50)}» { ${d.prop}: ${d.valor} } porta un color literal. Declara'l com a --sdp-crom-* al :root.`);
      } else if (paraules.length && !tokens.length) {
        registra('K3', fitxer, r.linia, `«${closca[0].slice(0, 50)}» { ${d.prop}: ${d.valor} } usa un color amb nom (${paraules.join(', ')}).`);
      }
    }

    const botons = closca.filter((s) => BOTONS_SIDEBAR.test(s.split(/\s+/).pop() || ''));
    if (botons.length) {
      for (const d of r.decls) {
        if (d.prop === 'width' && /^100%$/.test(d.valor)) {
          registra('K4', fitxer, r.linia, `«${botons[0]}» { width: 100% }: fantasma de punta a punta. La caixa dels botons de la SideBar s'estira per la li, no per una amplària literal.`);
        }
        // Ordre del Mestre (T15, 260930) · rectangle pur a tot selector dels botons de la
        // barra lateral; només el `.nav-item` nu i exacte (barra mòbil) en queda fora.
        const barra = botons.find((s) => s !== '.nav-item');
        if (barra && RADI.test(d.prop) && !RADI_RECTE.test(d.valor)) {
          registra('K4', fitxer, r.linia, `«${barra}» { ${d.prop}: ${d.valor} }: la SideBar és un llistat a sang, rectangle pur (border-radius: 0).`);
        }
      }
    }
  }
}

// K4 positiva: les dues bases de la barra lateral han d'existir i declarar el rectangle pur
// (Ordre del Mestre, T15 260930). La `.nav-item` nua és la de la barra mòbil: fora d'abast.
for (const base of ['nav.app-sidebar .nav-item', '.sidebar-control-btn']) {
  let trobada = false;
  for (const abs of fulls) {
    const regles = analitza(readFileSync(abs, 'utf8'));
    for (const r of regles) {
      if (FOSC.test(r.context)) continue;
      if (!r.selector.split(',').map((s) => s.trim()).includes(base)) continue;
      if (r.decls.some((d) => d.prop === 'border-radius' && RADI_RECTE.test(d.valor) && d.valor !== 'inherit')) trobada = true;
    }
  }
  if (!trobada) registra('K4', 'src/**/*.css', 0, `La regla base «${base}» no declara border-radius: 0 (rectangle pur, T15).`);
}

// K6: esquema de color fix a les dues arrels de la closca.
for (const arrel of ['nav.app-sidebar', 'header.bar-black']) {
  let fix = false;
  for (const abs of fulls) {
    for (const r of analitza(readFileSync(abs, 'utf8'))) {
      if (FOSC.test(r.context) || r.context.includes('@media')) continue;
      if (!r.selector.split(',').map((s) => s.trim()).includes(arrel)) continue;
      if (r.decls.some((d) => d.prop === 'color-scheme' && d.valor === 'dark')) fix = true;
    }
  }
  if (!fix) registra('K6', 'src/**/*.css', 0, `«${arrel}» no declara color-scheme: dark. Els controls natius canviaran amb el tema.`);
}

for (const c of citats) {
  if (!declarats.has(c.token)) registra('K5', c.fitxer, c.linia, `\`${c.token}\` citat però no declarat al :root.`);
}

console.log('\n🧱 [TRACTOR CROM] La closca immutable (TopBar + SideBar)');
console.log(`   Fulls: ${fulls.length} · tokens --sdp-crom-*: ${declarats.size} · cites: ${citats.length}`);
if (!infraccions.length) {
  console.log('   ✅ K1–K6 net. La closca és idèntica en clar i en fosc, i la SideBar no té fantasmes.\n');
  process.exit(0);
}
for (const i of infraccions) console.log(`   ❌ ${i.llei} · ${i.fitxer}:${i.linia}  ${i.missatge}`);
console.log(`\n   ${infraccions.length} infracció(ns). LLEI DURA: no hi ha deute que valga.\n`);
process.exit(1);
