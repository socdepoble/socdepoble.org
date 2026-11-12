import path from 'path';
import { fileURLToPath } from 'url';
/**
 * design_guard.mjs — PORTA DE DISSENY PEDRA SECA
 *
 * HISTÒRIA D'AQUEST FITXER (auditoria 260829):
 * Durant tota la seua vida aquest fitxer va estar declarat a `npm run porta`
 * com `node tooling/gates/design_guard.mjs`, però només exportava `run()`
 * sense punt d'entrada CLI. Node l'importava, definia les funcions i eixia
 * amb codi 0. La porta de disseny mai va fallar perquè mai es va executar.
 * A més, l'arrel per defecte era `src/components/universal` — 4 fitxers,
 * l'únic directori del projecte que ja estava net.
 *
 * REGLA D'OR: si aquest fitxer torna a perdre el bloc CLI del final,
 * `tooling/gates/tractor-rutes.mjs` ho detecta i falla.
 *
 * ÚS:
 *   node tooling/gates/design_guard.mjs                 # verifica contra el deute
 *   node tooling/gates/design_guard.mjs --baseline      # congela el deute actual
 *   node tooling/gates/design_guard.mjs --detall        # llista cada infracció
 *   node tooling/gates/design_guard.mjs --arrel=src/sections
 */

import { readFile, readdir } from 'node:fs/promises';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { parse } from '@babel/parser';
import { designColorSource, isSafeCromStyle } from '../lib/design-contracts.mjs';

const SCAN_EXT = new Set(['.html', '.css', '.js', '.mjs', '.jsx']);
const SKIP = new Set(['node_modules', '.git', 'vendor', '_build', 'dist', '04_ARXIU_Documents_Historics']);
const RAW_HEX = /#[0-9a-fA-F]{3,8}\b/g;
const FONT_SMALL = /font-size\s*:\s*(\d+(?:\.\d+)?)px/gi;
const TOUCH_SIZE = /(min-)?(width|height)\s*:\s*(\d+(?:\.\d+)?)px/gi;
const FOCUS_NONE = /outline\s*:\s*(0|none)\b/gi;
const CLASS_RE = /\bclass(?:Name)?=["'`]([^"'`]+)["'`]/g;

const ALLOWED_HEX = new Set([
  '#000', '#000000',
  '#fff', '#ffffff',
  '#FF7300', '#ff7300',
  '#0984E3', '#0984e3'
]);

/**
 * LLEIS DURES: no admeten deute. Fallen sempre que es violen, encara que
 * estigueren al baseline. Són les que no tenen cap excusa legítima.
 */
const LLEIS_DURES = new Set(['tailwind-visual', 'font-too-small']);

/* ═══ DIV-SOUP · CALIBRATGE D-2 (assalt 10/10, 261101) ═══════════════
 * L'heurística comptava `<div` com a TEXT: també dins de cadenes (l'HTML de
 * prosa de pageContent.js, que passa per sanitizeHtml, on section, article,
 * main i aside NO són a ALLOWED_TAGS: src/utils/sanitize.js) i dins de les
 * fixtures de les proves (sanitize.test.js, targetesIncrustades.test.js). I
 * només acceptava section|article|main|aside com a estructura: un <form>, un
 * <fieldset>, un <dl> o un embolcall canònic de Pedra Seca no hi comptaven.
 * El 261101 els nou avisos eren falsos positius d'esta mesura, cap defecte.
 * Ara, en .js/.jsx: només compten els elements JSX <div> de l'AST; l'estructura
 * són les etiquetes semàntiques natives i els embolcalls documentats de davall;
 * i les proves (*.test.*, __tests__/) no són interfície. Fora de JS (.html), el
 * recompte de text de sempre, sense comentaris. El llindar (> 10) no canvia.
 * T11-01 (marató 261101_2143) hi afig la ràtio: vegeu LLINDAR_RATIO_DIV_SOUP.
 */
export const ESTRUCTURA_NATIVA = Object.freeze([
  'section', 'article', 'main', 'aside', 'nav', 'header', 'footer',
  'form', 'fieldset', 'dialog', 'details', 'figure', 'dl', 'table'
]);
/** Embolcalls canònics documentats: el component pinta la seua `marca`, un
 *  element semàntic o un altre embolcall del registre. La porta la cerca en
 *  el JSX d'ell o d'un component local del mateix `fitxer` que ell pinta, fora
 *  de callbacks i de branques condicionals (`? :`, `&&`). També compta el JSX
 *  desat en una variable, encara que la variable només es pinte en una branca
 *  o no es pinte, i el d'un `if (…) return`: és una guarda de registre, no
 *  d'anàlisi de flux. No cal que siga l'arrel del DOM (PageFrame pinta
 *  l'<article> dins d'un <div> contenidor). Ho vigila l'AST a
 *  tests/design-guard.test.mjs. */
export const EMBOLCALLS_SEMANTICS = Object.freeze({
  UniversalPage: { fitxer: 'components/universal/UniversalPage.jsx', marca: '<PageFrame' },
  PageFrame: { fitxer: 'components/universal/PageFrame.jsx', marca: '<article' },
  UniversalCard: { fitxer: 'components/PedraSeca/organismes/UniversalCard.jsx', marca: '<article' },
  Dialeg: { fitxer: 'components/PedraSeca/organismes/Dialeg.jsx', marca: '<dialog' },
  DialegConfirmacio: { fitxer: 'components/PedraSeca/organismes/Dialeg.jsx', marca: '<Dialeg ' },
  GrupCamps: { fitxer: 'components/PedraSeca/organismes/formulari.jsx', marca: '<fieldset' },
  Especimen: { fitxer: 'sections/disseny/cataleg/Especimen.jsx', marca: '<section' }
});
const NATIVA = new Set(ESTRUCTURA_NATIVA);
const LLINDAR_DIV_SOUP = 10;
/* T11-01 (Gemini, Tall 11; marató 261101_2143, ordre del Mestre) · Un sol
 * embolcall no salva una vista de quaranta <div>: també és sopa quan hi ha més
 * de LLINDAR_RATIO_DIV_SOUP <div> per element d'estructura. La ràtio és per
 * fitxer. Amb l'arbre del 261101 el màxim és 13 per 1 (EspecimenControlsBarra
 * .jsx), i els 12 per 1 de XatSection.jsx són estats buits i Suspense escampats
 * en components xicotets, no cap sopa: 15 deixa la porta en 0 avisos amb marge
 * i atrapa 16 <div> o més dins d'un sol embolcall (31 dins de dos). */
export const LLINDAR_RATIO_DIV_SOUP = 15;
/** Cert si `{ divs, estructura }` és sopa de <div>: més de LLINDAR_DIV_SOUP i,
 *  a més, cap estructura o més de LLINDAR_RATIO_DIV_SOUP per element (enters,
 *  sense dividir). Pura. */
export function esSopaDeDivs({ divs, estructura }) {
  if (divs <= LLINDAR_DIV_SOUP) return false;
  return estructura === 0 || divs > LLINDAR_RATIO_DIV_SOUP * estructura;
}
const ES_PROVA = /(^|[\\/])__tests__[\\/]|\.(test|spec)\.[cm]?[jt]sx?$/;

function nomJsx(nom) {
  if (!nom) return '';
  if (nom.type === 'JSXIdentifier') return nom.name;
  if (nom.type === 'JSXMemberExpression') return nomJsx(nom.property);
  return '';
}

/** { divs, estructura } dels elements JSX d'un AST. */
function sopaJsx(ast) {
  let divs = 0;
  let estructura = 0;
  walkAst(ast, (node) => {
    if (node.type !== 'JSXOpeningElement') return;
    const nom = nomJsx(node.name);
    if (nom === 'div') divs += 1;
    else if (NATIVA.has(nom) || Object.hasOwn(EMBOLCALLS_SEMANTICS, nom)) estructura += 1;
  });
  return { divs, estructura };
}

/** El text sense comentaris HTML, en una passada (indexOf, cap regex que
 *  torne arrere): un `<!--` sense tancar s'emporta la resta, com al navegador. */
function senseComentarisHtml(text) {
  let net = '';
  let des = 0;
  for (;;) {
    const obri = text.indexOf('<!--', des);
    if (obri === -1) return net + text.slice(des);
    net += text.slice(des, obri);
    const tanca = text.indexOf('-->', obri + 4);
    if (tanca === -1) return net;
    des = tanca + 3;
  }
}

/* T11-01 · El grup no captura: split() posa cada grup capturat dins del
 * resultat, i amb `(…)` cada etiqueta d'estructura comptava doble. Amb la sola
 * condició de `estructura === 0` no es notava; amb la ràtio, sí. */
const ETIQUETA_ESTRUCTURA = new RegExp(`<(?:${ESTRUCTURA_NATIVA.join('|')})\\b`, 'i');

function sopaText(text) {
  const net = senseComentarisHtml(text);
  return {
    divs: net.split(/<div\b/i).length - 1,
    estructura: net.split(ETIQUETA_ESTRUCTURA).length - 1
  };
}

async function walk(dir, out = []) {
  for (const ent of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    if (SKIP.has(ent.name) || ent.name.startsWith('.')) continue;
    const full = join(dir, ent.name);
    if (ent.isDirectory()) await walk(full, out);
    else if (SCAN_EXT.has(extname(ent.name)) && !ent.name.endsWith('.config.js')) out.push(full);
  }
  return out;
}

function lineOf(text, idx) {
  return text.slice(0, idx).split(/\r?\n/).length;
}

function walkAst(node, visitor) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const child of node) walkAst(child, visitor);
    return;
  }
  visitor(node);
  for (const key of Object.keys(node)) {
    if (key !== 'loc' && key !== 'tokens' && key !== 'comments' && key !== 'extra' && key !== 'leadingComments' && key !== 'trailingComments') {
      walkAst(node[key], visitor);
    }
  }
}

/**
 * Línies on un hex CRU és legítim: la definició del propi sistema de disseny.
 *
 * AUDITORIA 260831 (Seient Núm. 5): 68 de les 121 identitats `raw-color`
 * declarades a '.agents/deute/.design-guard-deute.json' eren les DEFINICIONS CANÒNIQUES
 * dels tokens dins de `:root, :host, .sdp-root` — `#fe7406`, `#0e0d0c`,
 * `#f9f8f5`… El 56% del «deute crític» era el propi sistema de disseny
 * denunciant-se a si mateix.
 *
 * Una porta que assenyala la seua font de veritat ensenya a ignorar-la.
 * Ací es calla en eixos blocs, i només en eixos.
 */
const OBRE_TEMA = /(:root|:host|\.sdp-root|@media\s*\((?:prefers-color-scheme|prefers-contrast|forced-colors))/;

function liniesDeTema(text) {
  const dins = new Set();
  let obert = false;
  let prof = 0;
  text.split(/\r?\n/).forEach((l, i) => {
    if (!obert && OBRE_TEMA.test(l) && l.includes('{')) { obert = true; prof = 0; }
    if (obert) {
      dins.add(i + 1);
      prof += (l.match(/\{/g) || []).length - (l.match(/\}/g) || []).length;
      if (prof <= 0) obert = false;
    }
  });
  return dins;
}

function scanDesign(text, file, vocab = null) {
  const findings = [];
  const TEMA = liniesDeTema(text);

  // Identificadors numèrics de registre de WordPress en text editorial.
  const colorSource = designColorSource(text, file).replace(/\bWP\s+#\d+\b/g, referencia => ' '.repeat(referencia.length));
  for (const m of colorSource.matchAll(RAW_HEX)) {
    if (TEMA.has(lineOf(text, m.index))) continue;
    if (!ALLOWED_HEX.has(m[0].toLowerCase()) && !text.slice(Math.max(0, m.index - 40), m.index).includes('ALLOW_RAW_COLOR')) {
      findings.push({
        severity: 'critical',
        rule: 'raw-color',
        file,
        line: lineOf(text, m.index),
        token: m[0].toLowerCase(),
        message: `Color cru no canonic: ${m[0]}. Usa token --sp-* o justifica amb ALLOW_RAW_COLOR.`
      });
    }
  }

  for (const m of text.matchAll(FONT_SMALL)) {
    const px = Number(m[1]);
    if (px < 16) {
      findings.push({
        severity: 'critical', rule: 'font-too-small', file,
        line: lineOf(text, m.index), token: `${px}px`,
        message: `Font menor de 16px: ${px}px.`
      });
    }
  }

  for (const m of text.matchAll(TOUCH_SIZE)) {
    const prop = m[2];
    const px = Number(m[3]);
    const nearby = text.slice(Math.max(0, m.index - 120), m.index + 160);
    if (px > 0 && px < 44 && /button|\.sp-button|role=["']button|cursor\s*:\s*pointer/i.test(nearby)) {
      findings.push({
        severity: 'critical', rule: 'touch-too-small', file,
        line: lineOf(text, m.index), token: `${prop}:${px}px`,
        message: `Possible control interactiu amb ${prop} ${px}px (<44px).`
      });
    }
  }

  for (const m of text.matchAll(FOCUS_NONE)) {
    const nearby = text.slice(Math.max(0, m.index - 120), m.index + 160);
    if (!/focus-visible|box-shadow|outline-offset|caret-color|ALLOW_FOCUS_INVISIBLE/i.test(nearby)) {
      findings.push({
        severity: 'critical', rule: 'focus-invisible', file,
        line: lineOf(text, m.index), token: 'outline-none',
        message: 'Focus eliminat sense alternativa visible.'
      });
    }
  }

  for (const m of text.matchAll(CLASS_RE)) {
    for (const token of m[1].split(/\s+/)) {
      // AUDITORIA 260829: l'heuristica de prefix confonia BEM amb Tailwind
      // (`text-panel__head`, `text-center` son classes NOSTRES). Nomes es
      // denuncia el token si NO esta declarat al CSS del sistema.
      if (vocab && vocab.has(token)) continue;
      if (/^(sdp-)?(bg|text|border|rounded|shadow|ring|from|via|to|p|m|px|py|pt|pb|mx|my|flex|grid|w|h|gap)-/.test(token) || /^(sdp-)?(flex|grid|block)$/.test(token)) {
        findings.push({
          severity: 'critical', rule: 'tailwind-visual', file,
          line: lineOf(text, m.index), token,
          message: `Classe visual Tailwind prohibida: ${token}.`
        });
      }
    }
  }

  // REGLA DE LES CAPÇALERES
  if (!file.includes('disseny_pedra_seca.html') && !file.includes('disseny_pedra_seca.md')) {
    const h1Matches = [...text.matchAll(/<h1\b/gi)];
    if (h1Matches.length > 1) {
      findings.push({
        severity: 'critical', rule: 'h1-multiple', file,
        line: lineOf(text, h1Matches[1].index), token: 'h1',
        message: 'Més d\'un H1 detectat. La Regla de les Capçaleres permet només un H1.'
      });
    } else if (h1Matches.length === 1) {
      const beforeH1 = text.slice(0, h1Matches[0].index);
      const lastHeaderOpen = beforeH1.lastIndexOf('<header');
      const lastHeaderClose = beforeH1.lastIndexOf('</header>');
      if (lastHeaderOpen === -1 || lastHeaderOpen < lastHeaderClose || !beforeH1.slice(lastHeaderOpen).includes('page-title')) {
        findings.push({
          severity: 'critical', rule: 'h1-outside-header', file,
          line: lineOf(text, h1Matches[0].index), token: 'h1',
          message: 'L\'H1 ha d\'estar dins d\'un <header class="page-title">.'
        });
      }
    }
  }

  const esJs = file.endsWith('.jsx') || file.endsWith('.js');
  let ast = null;
  if (esJs) {
    try { ast = parse(text, { sourceType: 'module', plugins: ['jsx'] }); } catch { ast = null; }
  }

  // REGLA DIV-SOUP (calibratge D-2): vegeu ESTRUCTURA_NATIVA i EMBOLCALLS_SEMANTICS.
  if (!ES_PROVA.test(file)) {
    const sopa = ast ? sopaJsx(ast) : sopaText(text);
    if (esSopaDeDivs(sopa)) {
      findings.push({
        severity: 'warning', rule: 'div-soup', file, line: 1, token: 'div-soup',
        message: sopa.estructura === 0
          ? `Massa divs (${sopa.divs}) sense estructura semàntica (${ESTRUCTURA_NATIVA.join(', ')} o un embolcall canònic). Aplica Pedra Seca.`
          : `Massa divs (${sopa.divs}) per a tan poca estructura semàntica (${sopa.estructura}): més de ${LLINDAR_RATIO_DIV_SOUP} per element. Aplica Pedra Seca.`
      });
    }
  }

  // REGLA: AST per bloquejar style={{...}}
  if (esJs) {
    try {
      if (!ast) throw new Error('sense AST');
      walkAst(ast, (node) => {
        if (node.type === 'JSXAttribute' && node.name && node.name.name === 'style' && !isSafeCromStyle(node, file)) {
          findings.push({
            severity: 'critical',
            rule: 'inline-style',
            file,
            line: node.loc ? node.loc.start.line : 1,
            token: 'style=',
            message: 'Estils en línia prohibits. Fes servir el CSS del sistema (Pedra Seca).'
          });
        }
      });
    } catch {
      // Ignore parse errors, let the linter or builder catch them
    }
  }

  return findings;
}

async function carregaVocabulari(files) {
  const vocab = new Set();
  for (const abs of files.filter(f => extname(f) === '.css')) {
    const css = await readFile(abs, 'utf8').catch(() => '');
    for (const m of css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) vocab.add(m[1]);
  }
  return vocab;
}

export async function run(options = {}) {
  const root = options.root || 'src';
  const files = await walk(root);
  const vocab = options.vocab || await carregaVocabulari(files);
  const findings = [];

  for (const abs of files) {
    const rel = relative(root, abs);
    const text = await readFile(abs, 'utf8').catch(() => '');
    findings.push(...scanDesign(text, rel, vocab));
  }

  const critical = findings.filter(f => f.severity === 'critical').length;
  const warning = findings.filter(f => f.severity === 'warning').length;

  return {
    ok: critical === 0,
    summary: `Design Guard: ${files.length} fitxers, ${critical} critics, ${warning} avisos.`,
    data: { filesScanned: files.length, findings, summary: { critical, warning } }
  };
}

/* ═══════════════════════ RATCHET DE DEUTE ═══════════════════════
 * El deute registra IDENTITATS (regla|fitxer|token), no números de línia.
 * Moure codi no crea deute. Introduir una infracció nova, sí.
 * El deute només pot baixar. Igual que tractor-pedra-seca.mjs.
 */

const identitat = (f) => `${f.rule}|${f.file}|${f.token}`;

function comptaPerRegla(findings) {
  const acc = {};
  for (const f of findings) {
    if (f.severity !== 'critical') continue;
    acc[f.rule] = acc[f.rule] || { max: 0, identitats: [] };
    acc[f.rule].max += 1;
    acc[f.rule].identitats.push(identitat(f));
  }
  for (const r of Object.values(acc)) r.identitats = [...new Set(r.identitats)].sort();
  return acc;
}

async function cli() {
  const args = process.argv.slice(2);
  const BASELINE = args.includes('--baseline');
  const DETALL = args.includes('--detall');
  const arrelArg = args.find(a => a.startsWith('--arrel='));
  const root = resolve(process.cwd(), arrelArg ? arrelArg.split('=')[1] : 'src');
  const DEUTE_PATH = join(process.cwd(), '.agents/deute/.design-guard-deute.json');

  if (!existsSync(root)) {
    console.error(`PARAT. L'arrel «${root}» no existix. La porta falla tancada.`);
    process.exit(1);
  }

  const res = await run({ root });
  const actual = comptaPerRegla(res.data.findings);

  if (DETALL) {
    for (const f of res.data.findings) {
      console.log(`  [${f.severity[0].toUpperCase()}] ${f.rule.padEnd(20)} ${f.file}:${f.line}  ${f.message}`);
    }
    console.log('');
  }

  if (BASELINE) {
    writeFileSync(DEUTE_PATH, JSON.stringify(actual, null, 2) + '\n', 'utf8');
    console.log(res.summary);
    console.log('Deute congelat a .design-guard-deute.json:');
    for (const [regla, d] of Object.entries(actual)) console.log(`  ${regla.padEnd(22)}: ${d.max}`);
    console.log('\nEl deute només pot baixar a partir d\'ara.');
    process.exit(0);
  }

  if (!existsSync(DEUTE_PATH)) {
    console.error(res.summary);
    console.error('\nPARAT. No hi ha .design-guard-deute.json.');
    console.error('Executa una vegada: node tooling/gates/design_guard.mjs --baseline\n');
    process.exit(1);
  }

  const previ = JSON.parse(readFileSync(DEUTE_PATH, 'utf8'));
  let trencat = false;

  for (const [regla, d] of Object.entries(actual)) {
    const base = previ[regla] || { max: 0, identitats: [] };
    const conegudes = new Set(base.identitats);
    const noves = d.identitats.filter(i => !conegudes.has(i));

    if (LLEIS_DURES.has(regla) && d.max > 0) {
      console.error(`LLEI DURA VIOLADA · ${regla}: ${d.max} infraccions (no admet deute).`);
      for (const i of d.identitats) console.error(`    ${i}`);
      trencat = true;
      continue;
    }
    if (d.max > base.max) {
      console.error(`DEUTE PUJA · ${regla}: ${base.max} -> ${d.max}`);
      for (const i of noves) console.error(`    NOVA: ${i}`);
      trencat = true;
    } else if (noves.length > 0) {
      console.error(`INFRACCIÓ NOVA · ${regla} (total igual, però identitat distinta)`);
      for (const i of noves) console.error(`    NOVA: ${i}`);
      trencat = true;
    } else if (d.max < base.max) {
      console.log(`  ${regla.padEnd(22)}: ${base.max} -> ${d.max}  (baixa)`);
    }
  }

  console.log(res.summary);
  if (trencat) {
    console.error('\nPARAT. El deute de disseny puja o s\'ha trencat una llei dura.');
    process.exit(1);
  }
  console.log('PASSA. El deute de disseny no puja.');
  process.exit(0);
}

/* ─── PUNT D'ENTRADA CLI ─── el bloc que faltava durant tota la vida del fitxer */
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  cli().catch((e) => {
    console.error('PARAT. Error intern del Design Guard:', e?.message || e);
    process.exit(1);
  });
}
