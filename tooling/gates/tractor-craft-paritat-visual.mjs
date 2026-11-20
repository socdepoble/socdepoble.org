#!/usr/bin/env node
/**
 * tractor-craft-paritat-visual.mjs — Tractor Operatiu "Craft Anything x Pedra Seca"
 *
 * Inspiració arquitectònica en sala neta: storytold/craft-anything (Alejavi Rivera)
 * Implementació 100% pròpia per a Sóc de Poble (Node 22 + Chrome Headless CDP natiu).
 *
 * Executa els 4 pilars de fortificació i paritat visual sense dependències externes:
 *   1. Fortificació del Graf de Mòduls (Tarjan SCC sobre src/): caça tots els cicles
 *      d'imports circulars que trenquen Vite HMR i la inicialització de chunks.
 *   2. Inventari Clean-Room dels Clons Sagrats de 01_produccio/ (només lectura d'estructura):
 *      WhatsApp-Clon-01, WhatsApp-Clon-02, loyverse_clon, loyverse_clon_ipad, loyverse_clon_mobil.
 *   3. Study & Capture Multi-Amplària (320, 359, 360, 768, 1280 px) via Chrome CDP:
 *      - Fotografia PNG per amplària (screenshot-<width>.png)
 *      - Mesura DOM computada (capture.json: layouts, outline LCS, design 3 superfícies,
 *        phantom_columns >= 80px, duplicate_empty_cards, touch_targets_under_44_56, health & a11y)
 *      - Sonda d'estats interactius oberts (pestanyes/botons de filtre en 1280 px i 360 px)
 *   4. Check, Page Claims, Unknowns Ledger & KeptChecks SHA-256 + Informe Markdown.
 *
 * Porta (v1.2.14, `npm run porta:craft-paritat`): necessita un servidor viu (per defecte
 * http://localhost:3340, que NO s'atura). Eixida 0 només si el graf de src/ no té cap cicle i
 * totes les Page Claims passen; 1 si n'hi ha cap en roig; 2 si l'eina no ha pogut córrer.
 * L'eixida va a un temporal propi (mkdtemp) llevat de --out; el Chrome aïllat (perfil i cau
 * temporals, --use-mock-keychain, --password-store=basic) es mata i s'espera fins i tot davant
 * SIGINT/SIGTERM: cap procés Chromium zombi.
 */

import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as espera } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import { CAMINS, esMain } from '../lib/arrel.mjs';

const CHROME_DEFAULT = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ARREL_DEFECTE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const AMPLARIES_PEDRA_SECA = [320, 359, 360, 768, 1280];
const EXTENSIONS_CODI = ['.js', '.jsx', '.mjs', '.ts', '.tsx'];

export function lligArgs(argv) {
  const args = {
    arrel: ARREL_DEFECTE,
    baseUrl: 'http://localhost:3340',
    rutes: ['/xat', '/app/bar/taules', '/app/rebost'],
    amplaries: AMPLARIES_PEDRA_SECA,
    out: null,
    chrome: CHROME_DEFAULT,
    settleMs: 1400
  };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--arrel' && argv[i + 1]) args.arrel = path.resolve(argv[++i]);
    else if (a === '--base-url' && argv[i + 1]) args.baseUrl = argv[++i].replace(/\/+$/, '');
    else if (a === '--rutes' && argv[i + 1]) args.rutes = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--amplaries' && argv[i + 1]) args.amplaries = argv[++i].split(',').map((n) => Number(n.trim())).filter((n) => n > 0);
    else if (a === '--out' && argv[i + 1]) args.out = path.resolve(argv[++i]);
    else if (a === '--chrome' && argv[i + 1]) args.chrome = argv[++i];
    else if (a === '--settle-ms' && argv[i + 1]) args.settleMs = Number(argv[++i]);
    else throw new Error(`Argument desconegut o sense valor: ${a}`);
  }
  if (!args.rutes.length) throw new Error('--rutes no pot quedar buit');
  if (!args.amplaries.length) throw new Error('--amplaries no pot quedar buit');
  if (!Number.isFinite(args.settleMs) || args.settleMs < 0) throw new Error('--settle-ms ha de ser un nombre >= 0');
  return args;
}

/* ───────────── PILAR 1 · TARJAN SCC SOBRE GRAF D'IMPORTS DE src/ ───────────── */

function llistaFitxersCodi(dir, acumulat = []) {
  if (!fs.existsSync(dir)) return acumulat;
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entrada.name.startsWith('.') || entrada.name === 'node_modules' || entrada.name === 'dist') continue;
    const ple = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      llistaFitxersCodi(ple, acumulat);
    } else if (
      EXTENSIONS_CODI.includes(path.extname(entrada.name)) &&
      !/\.(test|spec)\.[jt]sx?$/.test(entrada.name)
    ) {
      acumulat.push(ple);
    }
  }
  return acumulat;
}

export function resolImportLocal(origenAbs, especificador, srcAbs) {
  let base;
  if (especificador.startsWith('.')) {
    base = path.resolve(path.dirname(origenAbs), especificador);
  } else if (especificador.startsWith('@/')) {
    base = path.join(srcAbs, especificador.slice(2));
  } else {
    return null;
  }
  const candidats = [
    base,
    ...EXTENSIONS_CODI.map((ext) => `${base}${ext}`),
    ...EXTENSIONS_CODI.map((ext) => path.join(base, `index${ext}`))
  ];
  for (const c of candidats) {
    try {
      if (fs.statSync(c).isFile()) return c;
    } catch {
      /* no existeix */
    }
  }
  return null;
}

/** Especificadors dels imports i reexportacions ESTÀTICS d'un mòdul. Gauntlet v1.2.14: amb @babel/parser (ja
 * dependència del repositori, com tooling/lib/design-contracts.mjs), no amb expressions regulars: cap comentari,
 * cadena ni plantilla fabrica o amaga arestes. Els import() dinàmics no creen cicles estàtics i no hi entren. Un
 * mòdul que no es pot analitzar llança: la porta no el pot donar per net. */
export function extreuImportsEstatics(codi, extensio = '.jsx') {
  /* Gauntlet v1.2.14 R2 · Els plugins segons l'extensió: un .ts o .tsx s'analitza amb TypeScript (`import type`,
     anotacions), no queda «no analitzat» per sempre. */
  const plugins = extensio === '.ts' ? ['typescript'] : extensio === '.tsx' ? ['jsx', 'typescript'] : ['jsx'];
  const ast = parse(codi, { sourceType: 'module', plugins, errorRecovery: false });
  const resultat = [];
  /* Gauntlet R2b · Un import o export només de tipus (`import type`, `export type`, o tots els especificadors de tipus)
     no existix en temps d'execució: no és cap aresta. */
  const nomesTipus = (node) => node.importKind === 'type' || node.exportKind === 'type'
    || (node.specifiers?.length > 0 && node.specifiers.every((e) => e.importKind === 'type' || e.exportKind === 'type'));
  for (const node of ast.program.body) {
    if ((node.type === 'ImportDeclaration' || node.type === 'ExportAllDeclaration' || node.type === 'ExportNamedDeclaration')
      && node.source && typeof node.source.value === 'string' && !nomesTipus(node)) {
      resultat.push(node.source.value);
    }
  }
  return resultat;
}

export function analitzaCiclesImports(arrelDonada) {
  /* Gauntlet v1.2.14 · Camins absoluts a tot el graf: amb una arrel relativa («.») les claus eren relatives i els
     destins absoluts, i cap aresta casava (zero cicles fals). */
  const arrel = path.resolve(arrelDonada);
  const srcAbs = path.join(arrel, 'src');
  const fitxers = llistaFitxersCodi(srcAbs);
  const graf = new Map();
  const hashes = new Map();
  const noAnalitzats = [];

  for (const f of fitxers) {
    const buf = fs.readFileSync(f);
    hashes.set(path.relative(arrel, f), crypto.createHash('sha256').update(buf).digest('hex'));
    const text = buf.toString('utf8');
    const arestes = new Set();
    let especificadors;
    try { especificadors = extreuImportsEstatics(text, path.extname(f)); }
    catch (err) { noAnalitzats.push({ fitxer: path.relative(arrel, f), error: String(err.message).slice(0, 160) }); especificadors = []; }
    for (const esp of especificadors) {
      const desti = resolImportLocal(f, esp, srcAbs);
      if (desti && desti !== f) arestes.add(desti);
    }
    graf.set(f, [...arestes]);
  }

  let index = 0;
  const idxMap = new Map();
  const lowMap = new Map();
  const enPila = new Set();
  const pila = [];
  const cicles = [];

  function strongConnect(v) {
    idxMap.set(v, index);
    lowMap.set(v, index);
    index += 1;
    pila.push(v);
    enPila.add(v);

    for (const w of graf.get(v) || []) {
      if (!graf.has(w)) continue;
      if (!idxMap.has(w)) {
        strongConnect(w);
        lowMap.set(v, Math.min(lowMap.get(v), lowMap.get(w)));
      } else if (enPila.has(w)) {
        lowMap.set(v, Math.min(lowMap.get(v), idxMap.get(w)));
      }
    }

    if (lowMap.get(v) === idxMap.get(v)) {
      const scc = [];
      let w;
      do {
        w = pila.pop();
        enPila.delete(w);
        scc.push(w);
      } while (w !== v);
      if (scc.length > 1) {
        const rels = scc.map((x) => path.relative(arrel, x)).sort();
        cicles.push({ mida: rels.length, membres: rels });
      }
    }
  }

  for (const f of fitxers) {
    if (!idxMap.has(f)) strongConnect(f);
  }

  cicles.sort((a, b) => b.mida - a.mida || a.membres[0].localeCompare(b.membres[0]));
  const empremtatGlobal = crypto
    .createHash('sha256')
    .update([...hashes.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${v}`).join('\n'))
    .digest('hex');

  return {
    totalFitxersAnalitzats: fitxers.length - noAnalitzats.length,
    totalCicles: cicles.length,
    cicles,
    noAnalitzats,
    empremtatGlobalSrcSha256: empremtatGlobal
  };
}

/* ───────────── PILAR 2 · INVENTARI CLEAN-ROOM DE 01_PRODUCCIO ───────────── */

export function inventariaReferenciesClon(arrel) {
  const base = path.join(arrel, CAMINS.escriptori, '01_produccio');
  const colLeccions = [
    { id: 'whatsapp_clon_01', domini: '/xat', carpeta: 'WhatsApp-Clon-01' },
    { id: 'whatsapp_clon_02', domini: '/xat', carpeta: 'WhatsApp-Clon-02' },
    { id: 'loyverse_clon_desktop', domini: '/app/bar & /app/rebost', carpeta: 'loyverse_clon' },
    { id: 'loyverse_clon_ipad', domini: '/app/bar & /app/rebost', carpeta: 'loyverse_clon_ipad' },
    { id: 'loyverse_clon_mobil', domini: '/app/bar & /app/rebost', carpeta: 'loyverse_clon_mobil' }
  ];
  /* Gauntlet v1.2.14 · 01_produccio és zona humana (AGENTS §12; D-R30-14-bis de verificador-scc.mjs): ni s'obri ni
     es llista. Només es diu si la carpeta de referència hi és. */
  return colLeccions.map((col) => ({ ...col, existeix: fs.existsSync(path.join(base, col.carpeta)) }));
}

/* ───────────── PILAR 3 · CHROME HEADLESS CDP MULTI-AMPLÀRIA ───────────── */

/* Chromes vius d'aquest procés: la neteja els mata i els espera també davant SIGINT/SIGTERM. */
const CHROMES_VIUS = new Set();

async function tancaChrome(ctx) {
  if (!ctx) return;
  CHROMES_VIUS.delete(ctx);
  if (ctx.proc.pid && ctx.proc.exitCode === null && ctx.proc.signalCode === null) {
    const eixida = new Promise((ok) => ctx.proc.once('exit', ok));
    try { ctx.proc.kill('SIGKILL'); } catch { /* ja és mort */ }
    await Promise.race([eixida, espera(5000, undefined, { ref: false })]);
  }
  fs.rmSync(ctx.tmpDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
}

function tancaChromesSincron() {
  for (const ctx of CHROMES_VIUS) {
    try { ctx.proc.kill('SIGKILL'); } catch { /* ja és mort */ }
    try { fs.rmSync(ctx.tmpDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 }); } catch { /* el SO el recollirà */ }
  }
  CHROMES_VIUS.clear();
}

/** Gauntlet v1.2.14 R2 · Chrome ha d'existir i ser executable: un fitxer sense permís d'execució fallaria al spawn. */
function comprovaChrome(chromeBin) {
  try { fs.accessSync(chromeBin, fs.constants.X_OK); }
  catch { throw new Error(`No trobe cap Chrome executable a ${chromeBin} (useu --chrome)`); }
}

/** Gauntlet v1.2.14 R2 · Les respostes del servidor de dades es descarten pel nom de host, no per subcadena: un
 * paràmetre de consulta que diga «supabase.co» no amaga una fallada del servidor local. */
export function esHostDeDades(url) {
  try {
    const { hostname } = new URL(url);
    return hostname === 'supabase.co' || hostname.endsWith('.supabase.co');
  } catch { return false; }
}

async function arrencaChrome(chromeBin) {
  comprovaChrome(chromeBin);
  const tmpDir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'sdp-craft-cdp-'));
  const perfil = path.join(tmpDir, 'perfil');
  const cau = path.join(tmpDir, 'cau');
  fs.mkdirSync(perfil);
  fs.mkdirSync(cau);
  const proc = spawn(chromeBin, [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${perfil}`,
    `--disk-cache-dir=${cau}`,
    '--use-mock-keychain',
    '--password-store=basic',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-sync',
    '--disable-default-apps',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--hide-scrollbars',
    'about:blank'
  ], { stdio: 'ignore', env: { ...process.env, HOME: tmpDir } });
  const ctx = { proc, tmpDir, wsUrl: null };
  CHROMES_VIUS.add(ctx);
  /* Un spawn fallit emet 'error': es convertix en rebuig (eixida 2 de la CLI), no en una excepció no gestionada. */
  let errorSpawn = null;
  proc.once('error', (e) => { errorSpawn = e; });

  let port = null;
  let cami = null;
  for (let i = 0; i < 120 && !port && !errorSpawn; i += 1) {
    try {
      const [p, c] = fs.readFileSync(path.join(perfil, 'DevToolsActivePort'), 'utf8').split('\n');
      port = Number(p);
      cami = c;
    } catch {
      await espera(100);
    }
  }
  if (!port) {
    await tancaChrome(ctx);
    throw new Error(errorSpawn ? `Chrome no ha arrencat: ${errorSpawn.message}` : 'Chrome no ha obert DevToolsActivePort');
  }
  ctx.wsUrl = `ws://127.0.0.1:${port}${cami}`;
  return ctx;
}

async function connectaCdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((ok, ko) => {
    ws.addEventListener('open', ok, { once: true });
    ws.addEventListener('error', () => ko(new Error('No s’ha pogut connectar al WebSocket CDP')), { once: true });
  });
  let seq = 0;
  const pendents = new Map();
  const oients = new Set();

  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pendents.has(msg.id)) {
      const p = pendents.get(msg.id);
      pendents.delete(msg.id);
      clearTimeout(p.timer);
      if (msg.error) p.ko(new Error(`${p.method}: ${msg.error.message}`));
      else p.ok(msg.result);
      return;
    }
    if (msg.method) {
      for (const fn of oients) fn(msg);
    }
  });

  const send = (method, params = {}, sessionId = undefined, timeoutMs = 25000) =>
    new Promise((ok, ko) => {
      const id = ++seq;
      const timer = setTimeout(() => {
        pendents.delete(id);
        ko(new Error(`Timeout CDP en ${method}`));
      }, timeoutMs);
      pendents.set(id, { ok, ko, timer, method });
      ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
    });

  const tanca = () => {
    for (const p of pendents.values()) clearTimeout(p.timer);
    pendents.clear();
    oients.clear();
    try { ws.close(); } catch { /* tancat */ }
  };

  return {
    send,
    on: (fn) => {
      oients.add(fn);
      return () => oients.delete(fn);
    },
    tanca
  };
}

const SONDA_DOM_CRAFT = `(() => {
  const rgbToHex = (rgb) => {
    if (!rgb) return null;
    const m = rgb.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([0-9.]+))?\\)/);
    if (!m) return null;
    const alpha = m[4] !== undefined ? Number(m[4]) : 1;
    if (alpha < 0.05) return null;
    const hex = (n) => Number(n).toString(16).padStart(2, '0');
    return '#' + hex(m[1]) + hex(m[2]) + hex(m[3]);
  };

  const vis = (el) => {
    if (!el || !(el instanceof Element)) return false;
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };

  const w = window.innerWidth;
  const pageW = Math.max(
    document.documentElement ? document.documentElement.scrollWidth : 0,
    document.body ? document.body.scrollWidth : 0
  );
  const pageH = Math.max(
    document.documentElement ? document.documentElement.scrollHeight : 0,
    document.body ? document.body.scrollHeight : 0
  );

  const fontPx = (sel) => {
    const el = document.querySelector(sel);
    return el && vis(el) ? Math.round( parseFloat(getComputedStyle(el).fontSize) || 0 ) : 0;
  };

  // Esquelet en ordre de document (Craft Anything PARTS)
  const MAP_PARTS = {
    header: 'header', nav: 'navigation bar', main: 'main area', footer: 'footer',
    section: 'section', article: 'article', aside: 'sidebar', form: 'form',
    h1: 'top heading', h2: 'subheading', h3: 'subheading', h4: 'subheading',
    ul: 'list', ol: 'list', img: 'image', video: 'video',
    button: 'button', input: 'form field', select: 'form field', textarea: 'form field'
  };
  const outline = [];
  for (const el of document.querySelectorAll('header,nav,main,footer,section,article,aside,form,h1,h2,h3,h4,ul,ol,img,video,button,input,select,textarea,[role]')) {
    if (!vis(el)) continue;
    const role = el.getAttribute('role');
    let tag = el.tagName.toLowerCase();
    if (role === 'banner') tag = 'header';
    else if (role === 'navigation') tag = 'nav';
    else if (role === 'main') tag = 'main';
    else if (role === 'complementary') tag = 'aside';
    else if (role === 'search') tag = 'form';
    if (MAP_PARTS[tag]) {
      outline.push({ tag, part: MAP_PARTS[tag] });
    }
  }

  // Blocs principals + Detector de Columnes Fantasma Buides (ex. El Bar / Taules ~220px)
  const blocks = [];
  const phantomColumns = [];
  for (const el of document.querySelectorAll('header,nav,main,aside,section')) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    const st = getComputedStyle(el);
    const h = el.querySelector('h1,h2,h3');
    blocks.push({
      tag: el.tagName.toLowerCase(),
      heading: h ? h.textContent.trim().slice(0, 80) : '',
      width: Math.round(r.width),
      height: Math.round(r.height),
      pad: [st.paddingTop, st.paddingRight, st.paddingBottom, st.paddingLeft].map((x) => Math.round(parseFloat(x) || 0))
    });
  }

  for (const parent of document.querySelectorAll('div,main,section')) {
    if (!vis(parent)) continue;
    const pst = getComputedStyle(parent);
    if (!pst.display.includes('flex') && !pst.display.includes('grid')) continue;
    const children = [...parent.children].filter(vis);
    if (children.length < 2) continue;
    for (const ch of children) {
      const cst = getComputedStyle(ch);
      if (cst.pointerEvents === 'none' || cst.position === 'fixed' || cst.position === 'absolute') continue;
      const r = ch.getBoundingClientRect();
      if (r.width >= 80 && r.width <= 420 && r.height >= 240) {
        const textLen = (ch.innerText || '').trim().length;
        const controls = ch.querySelectorAll('button,a,input,img,svg,canvas,ul,li').length;
        if (textLen === 0 && controls === 0) {
          phantomColumns.push({
            tag: ch.tagName.toLowerCase(),
            className: String(ch.className || '').slice(0, 100),
            width: Math.round(r.width),
            height: Math.round(r.height),
            bg: rgbToHex(getComputedStyle(ch).backgroundColor)
          });
        }
      }
    }
  }

  // Detector de Targetes Buides Duplicades (ex. "Barra · 19:10 / 0 línies / 0,00 €")
  const comptadorTargetes = new Map();
  for (const card of document.querySelectorAll('article,li,button,div')) {
    if (!vis(card)) continue;
    const r = card.getBoundingClientRect();
    if (r.height < 48 || r.height > 220 || r.width < 160) continue;
    const txt = (card.innerText || '').replace(/\\s+/g, ' ').trim();
    if (txt.length >= 10 && txt.length <= 90 && /(0 línies|0 líneas|0 lines|0,00\\s*€)/i.test(txt)) {
      comptadorTargetes.set(txt, (comptadorTargetes.get(txt) || 0) + 1);
    }
  }
  const duplicateEmptyCards = [...comptadorTargetes.entries()]
    .filter(([, n]) => n >= 2)
    .map(([text, repeticions]) => ({ text, repeticions }));

  // Paleta i jerarquia de superfícies + A11y + Dianes Tàctils
  const bgCounts = new Map();
  const fgCounts = new Map();
  let unnamedControls = 0;
  let brokenImages = 0;
  let imagesWithoutAlt = 0;
  let touchUnder44 = 0;
  let wideTablesP0128 = 0;

  for (const tbl of document.querySelectorAll('table')) {
    if (!vis(tbl)) continue;
    const maxCols = Math.max(0, ...[...tbl.querySelectorAll('tr')].map((tr) => tr.children.length));
    if (maxCols >= 3) wideTablesP0128 += 1;
  }

  for (const img of document.querySelectorAll('img')) {
    if (!vis(img)) continue;
    if (img.complete && img.naturalWidth === 0) brokenImages += 1;
    if (!img.hasAttribute('alt')) imagesWithoutAlt += 1;
  }

  for (const ctrl of document.querySelectorAll('button,a[href],input,select,textarea,[role="button"],[role="tab"]')) {
    if (!vis(ctrl)) continue;
    const r = ctrl.getBoundingClientRect();
    if (Math.min(r.width, r.height) < 36) touchUnder44 += 1;
    const label = (
      ctrl.getAttribute('aria-label') ||
      ctrl.getAttribute('title') ||
      ctrl.getAttribute('placeholder') ||
      ctrl.innerText ||
      ''
    ).trim();
    if (!label && !ctrl.getAttribute('aria-labelledby')) {
      unnamedControls += 1;
    }
  }

  for (const el of document.querySelectorAll('body,main,header,nav,aside,section,article,input,textarea,button')) {
    if (!vis(el)) continue;
    const st = getComputedStyle(el);
    const bg = rgbToHex(st.backgroundColor);
    const fg = rgbToHex(st.color);
    if (bg) bgCounts.set(bg, (bgCounts.get(bg) || 0) + 1);
    if (fg) fgCounts.set(fg, (fgCounts.get(fg) || 0) + 1);
  }

  const topMap = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([value, count]) => ({ value, count }));
  const landmarks = {};
  for (const sel of ['header', 'nav', 'main', 'aside', 'footer']) {
    if (document.querySelector(sel)) landmarks[sel] = true;
  }

  const interactiveTabs = [...document.querySelectorAll('[role="tab"], nav button, header button')]
    .filter(vis)
    .slice(0, 8)
    .map((b) => ({
      label: (b.getAttribute('aria-label') || b.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 50),
      width: Math.round(b.getBoundingClientRect().width),
      height: Math.round(b.getBoundingClientRect().height)
    }))
    .filter((b) => b.label.length > 0);

  return {
    width: w,
    page_w: pageW,
    page_h: pageH,
    sideways_scroll: pageW > w + 1,
    type: {
      h1: fontPx('h1'),
      h2: fontPx('h2'),
      body: Math.round(parseFloat(getComputedStyle(document.body).fontSize) || 0)
    },
    blocks: blocks.slice(0, 18),
    phantom_columns: phantomColumns,
    duplicate_empty_cards: duplicateEmptyCards,
    outline: outline.slice(0, 60),
    design: {
      backgrounds: topMap(bgCounts),
      text_colors: topMap(fgCounts),
      main_font: (getComputedStyle(document.body).fontFamily || '').split(',')[0].replace(/['"]/g, '').trim()
    },
    a11y: {
      lang: document.documentElement.lang || '',
      unnamed_controls: unnamedControls,
      images_without_alt: imagesWithoutAlt,
      broken_images: brokenImages,
      touch_controls_under_36px: touchUnder44,
      wide_tables_p0128: wideTablesP0128,
      landmarks
    },
    interactive_tabs: interactiveTabs,
    headings: [...document.querySelectorAll('h1,h2,h3')].filter(vis).map((h) => h.innerText.trim()).filter(Boolean).slice(0, 12)
  };
})()`;

export function slugRuta(ruta) {
  const net = ruta.replace(/^\/+|\/+$/g, '');
  return net ? net.replace(/[^a-z0-9]+/gi, '_').toLowerCase() : 'inici';
}

async function capturaRutaMultiAmplaria({ cdp, baseUrl, ruta, amplaries, outDir, settleMs }) {
  const slug = slugRuta(ruta);
  const dirRuta = path.join(outDir, 'captures', slug);
  fs.mkdirSync(dirRuta, { recursive: true });

  const { browserContextId } = await cdp.send('Target.createBrowserContext');
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank', browserContextId });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

  const consoleErrors = [];
  const hmrCircularWarnings = [];
  const failedRequests = [];
  const reqUrlById = new Map();

  const desconnectaOient = cdp.on((m) => {
    if (m.sessionId !== sessionId) return;
    if (m.method === 'Runtime.consoleAPICalled') {
      const tipus = m.params.type;
      const text = (m.params.args || []).map((a) => a.value ?? a.description ?? '').join(' ');
      if (/circular import|Failed to reload/i.test(text)) {
        hmrCircularWarnings.push(text.slice(0, 240));
      }
      if (tipus === 'error' || tipus === 'assert') {
        consoleErrors.push(text.slice(0, 240));
      }
    } else if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      consoleErrors.push(String(d?.exception?.description || d?.text || 'Excepció JS').slice(0, 240));
    } else if (m.method === 'Network.requestWillBeSent') {
      reqUrlById.set(m.params.requestId, m.params.request?.url || '');
    } else if (m.method === 'Network.responseReceived') {
      const status = m.params.response?.status || 0;
      const url = m.params.response?.url || '';
      if (status >= 400 && !esHostDeDades(url)) {
        failedRequests.push({ url, status });
      }
    } else if (m.method === 'Network.loadingFailed') {
      const url = reqUrlById.get(m.params.requestId) || '';
      if (url && !m.params.canceled && !esHostDeDades(url)) {
        failedRequests.push({ url, status: m.params.errorText || 'FAILED' });
      }
    }
  });

  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);
  await cdp.send('Network.enable', {}, sessionId);

  const urlCompleta = `${baseUrl}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
  const layouts = [];
  const screenshots = [];

  try {
    for (let idx = 0; idx < amplaries.length; idx += 1) {
      const width = amplaries[idx];
      const height = width < 768 ? 844 : 900;
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width < 768
      }, sessionId);

      if (idx === 0) {
        const nav = await cdp.send('Page.navigate', { url: urlCompleta }, sessionId);
        if (nav?.errorText) throw new Error(`No s'ha pogut carregar ${urlCompleta}: ${nav.errorText}`);
        await espera(settleMs);
        /* Gauntlet v1.2.14 · Una pàgina d'error del navegador o un 4xx/5xx no són la ruta: no s'hi mesura res. */
        const estat = await cdp.send('Runtime.evaluate', {
          expression: "(performance.getEntriesByType('navigation')[0] || {}).responseStatus || 0", returnByValue: true
        }, sessionId);
        const codi = Number(estat?.result?.value) || 0;
        if (codi >= 400) throw new Error(`No s'ha pogut carregar ${urlCompleta}: HTTP ${codi}`);
      } else {
        await espera(450);
      }

      const evalRes = await cdp.send('Runtime.evaluate', {
        expression: SONDA_DOM_CRAFT,
        returnByValue: true
      }, sessionId);
      const mesura = evalRes?.result?.value;
      if (mesura) layouts.push(mesura);

      const shot = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
      if (shot?.data) {
        const nomPng = `screenshot-${width}.png`;
        fs.writeFileSync(path.join(dirRuta, nomPng), Buffer.from(shot.data, 'base64'));
        screenshots.push(path.join('captures', slug, nomPng));
      }
    }
  } finally {
    desconnectaOient();
    await cdp.send('Target.closeTarget', { targetId }).catch(() => null);
    await cdp.send('Target.disposeBrowserContext', { browserContextId }).catch(() => null);
  }

  const claims = construeixClaims(ruta, layouts, { consoleErrors, failedRequests });

  const captureDoc = {
    schema: 'sdp.craft-capture.v1',
    capturedAt: new Date().toISOString(),
    route: ruta,
    url: urlCompleta,
    screenshots,
    health: {
      console_errors: consoleErrors,
      hmr_circular_warnings: hmrCircularWarnings,
      failed_requests: failedRequests
    },
    layouts,
    claims
  };

  fs.writeFileSync(path.join(dirRuta, 'capture.json'), JSON.stringify(captureDoc, null, 2));
  return captureDoc;
}

/** Page Claims a l'estil Craft Anything (website.rs::page_claims): funció pura sobre les mesures. */
export function construeixClaims(ruta, layouts, { consoleErrors = [], failedRequests = [] } = {}) {
  const claims = [];
  if (!layouts.length) {
    claims.push({ title: `${ruta} s'ha pogut mesurar`, passed: false, detail: 'cap amplària ha tornat mesura DOM' });
  }
  for (const l of layouts) {
    claims.push({
      title: `${ruta} no desborda lateralment a ${l.width} px`,
      passed: !l.sideways_scroll,
      detail: `page_w=${l.page_w} px vs viewport=${l.width} px`
    });
    claims.push({
      title: `${ruta} no té columnes fantasma buides (>=80 px) a ${l.width} px`,
      passed: l.phantom_columns.length === 0,
      detail: l.phantom_columns.length === 0
        ? '0 columnes buides'
        : l.phantom_columns.map((c) => `${c.tag}.${c.className} (${c.width}x${c.height}px, bg=${c.bg})`).join('; ')
    });
  }
  const refDesktop = layouts.find((l) => l.width === 1280) || layouts[layouts.length - 1] || {};
  claims.push({
    title: `${ruta} no registra errors de consola ni excepcions JS`,
    passed: consoleErrors.length === 0,
    detail: consoleErrors.slice(0, 3).join(' | ') || '0 errors'
  });
  claims.push({
    title: `${ruta} carrega tots els recursos locals sense 4xx/5xx`,
    passed: failedRequests.length === 0,
    detail: failedRequests.slice(0, 3).map((f) => `${f.url} (${f.status})`).join(', ') || '0 peticions fallides'
  });
  claims.push({
    title: `${ruta} no acumula targetes buides duplicades (0 línies · 0,00 €)`,
    passed: (refDesktop.duplicate_empty_cards || []).length === 0,
    detail: (refDesktop.duplicate_empty_cards || []).map((d) => `"${d.text}" x${d.repeticions}`).join('; ') || '0 duplicats buits'
  });
  claims.push({
    title: `${ruta} compleix P0-128 (zero taules HTML >= 3 columnes) i imatges íntegres`,
    passed: (refDesktop.a11y?.wide_tables_p0128 || 0) === 0 && (refDesktop.a11y?.broken_images || 0) === 0,
    detail: `taules_amples=${refDesktop.a11y?.wide_tables_p0128 || 0}, imatges_trencades=${refDesktop.a11y?.broken_images || 0}`
  });
  return claims;
}

/* ───────────── PILAR 4 · KEPT-CHECKS & INFORME MARKDOWN ───────────── */

export function generaInformeMarkdown({ ciclesInfo, inventariClons, capturesRutes, outDir }) {
  const dataIso = new Date().toISOString();
  const totalClaims = capturesRutes.reduce((acc, r) => acc + r.claims.length, 0);
  const claimsOk = capturesRutes.reduce((acc, r) => acc + r.claims.filter((c) => c.passed).length, 0);

  const linies = [
    '# Informe Operatiu · Tractor Craft Anything x Pedra Seca (Sistema, Xat i Clons)',
    '',
    `- **Data d'execució:** \`${dataIso}\``,
    `- **Mòduls JS/JSX analitzats a \`src/\`:** \`${ciclesInfo.totalFitxersAnalitzats}\``,
    `- **Empremta SHA-256 global \`KeptChecks\` (\`src/\`):** \`${ciclesInfo.empremtatGlobalSrcSha256}\``,
    `- **Components Fortament Connexes (Cicles d'Imports Circulars Tarjan SCC):** \`${ciclesInfo.totalCicles}\``,
    `- **Afirmacions verificades (\`Page Claims\`) sobre les rutes vives:** \`${claimsOk} / ${totalClaims}\``,
    '',
    '## 1. Fortificació del Sistema · Graf d\'Imports Circulars (`Tarjan SCC` sobre `src/`)',
    ''
  ];

  if (ciclesInfo.totalCicles === 0) {
    linies.push('- **VERD ABSOLUT (`0` cicles d\'imports circulars):** Tot l\'arbre `src/` és un DAG acíclic net per a Vite HMR i Rollup.');
  } else {
    linies.push(`S'han detectat **\`${ciclesInfo.totalCicles}\` components amb imports circulars** que expliquen els avisos \`[hmr] failed to apply HMR as it's within a circular import\` i poden degradar el recarregament en calent o l'ordre d'avaluació de mòduls:`);
    linies.push('');
    ciclesInfo.cicles.forEach((c, idx) => {
      linies.push(`### 1.${idx + 1}. Cicle #${idx + 1} (\`${c.mida}\` fitxers interconnectats)`);
      for (const m of c.membres) {
        linies.push(`- \`${m}\``);
      }
      linies.push('');
    });
  }

  linies.push('## 2. Corpus Clean-Room de Captures de Referència (`01_produccio/` · Només Lectura)');
  linies.push('');
  for (const col of inventariClons) {
    linies.push(`- **\`${col.carpeta}\`** (domini \`${col.domini}\`): ${col.existeix ? 'present' : 'absent'} (zona humana: no es llista).`);
  }
  linies.push('');

  linies.push('## 3. Auditoria Multi-Amplària per Ruta (`320`, `359`, `360`, `768`, `1280 px`)');
  linies.push('');

  for (const cap of capturesRutes) {
    const fallides = cap.claims.filter((c) => !c.passed);
    const desk = cap.layouts.find((l) => l.width === 1280) || cap.layouts[0] || {};
    const mob = cap.layouts.find((l) => l.width === 359) || cap.layouts[0] || {};
    linies.push(`### Ruta \`${cap.route}\` — \`${cap.claims.length - fallides.length}/${cap.claims.length}\` Claims en Verd`);
    linies.push(`- **Captures generades:** ${cap.screenshots.map((s) => `\`${s}\``).join(', ')}`);
    linies.push(`- **Tipografia computada (1280 px):** \`h1=${desk.type?.h1 || 0}px\`, \`h2=${desk.type?.h2 || 0}px\`, \`body=${desk.type?.body || 0}px\`, font principal \`${desk.design?.main_font || 'n/d'}\``);
    linies.push(`- ** Paleta dominant de superfícies:** ${(desk.design?.backgrounds || []).slice(0, 5).map((b) => `\`${b.value}\` (${b.count})`).join(', ') || 'cap'}`);
    linies.push(`- **Geometria mòbil estret (\`359 px\`):** \`page_w=${mob.page_w || 0}px\` (${mob.sideways_scroll ? 'DESBORDA' : '0 scroll lateral'})`);
    linies.push(`- **Salut A11y & Consola:** \`errors_consola=${cap.health.console_errors.length}\`, \`peticions_fallides=${cap.health.failed_requests.length}\`, \`controls_sense_nom=${desk.a11y?.unnamed_controls ?? 0}\`, \`dianes_<36px=${desk.a11y?.touch_controls_under_36px ?? 0}\``);
    if ((desk.interactive_tabs || []).length > 0) {
      linies.push(`- **Controls de navegació/pestanyes detectats:** ${desk.interactive_tabs.map((t) => `*"${t.label}"* (\`${t.width}x${t.height}px\`)`).join(', ')}`);
    }
    if (fallides.length === 0) {
      linies.push('- **Estat Craft Anything:** Tots els `Page Claims` passen en les 5 amplàries.');
    } else {
      linies.push('- **Troballes pendents de refinament (`Claims` en roig):**');
      for (const f of fallides) {
        linies.push(`  - **FALLA:** ${f.title} -> \`${f.detail}\``);
      }
    }
    linies.push('');
  }

  const mdPath = path.join(outDir, 'INFORME_CRAFT_ANYTHING_XAT_WHATSAPP_CLON_I_FORTIFICACIO.md');
  fs.writeFileSync(mdPath, `${linies.join('\n')}\n`);
  return mdPath;
}

export async function main(argv = process.argv) {
  const args = lligArgs(argv);
  if (!fs.existsSync(path.join(args.arrel, 'src'))) throw new Error(`L'arrel ${args.arrel} no té src/`);
  comprovaChrome(args.chrome);
  const ciclesInfo = analitzaCiclesImports(args.arrel);
  const inventariClons = inventariaReferenciesClon(args.arrel);
  const outTemporal = !args.out;
  if (outTemporal) args.out = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'sdp-craft-paritat-'));
  fs.mkdirSync(args.out, { recursive: true });
  /* Gauntlet v1.2.14 · Els senyals es vigilen dins de main(): també quan s'importa (proves), cap Chrome orfe. */
  const senyals = { SIGINT: 130, SIGTERM: 143, SIGHUP: 129 };
  const gestors = Object.entries(senyals).map(([senyal, codi]) => {
    const gestor = () => {
      tancaChromesSincron();
      if (outTemporal) { try { fs.rmSync(args.out, { recursive: true, force: true }); } catch { /* temporal del sistema */ } }
      process.exit(codi);
    };
    process.once(senyal, gestor);
    return [senyal, gestor];
  });

  let chromeCtx = null;
  const capturesRutes = [];
  try {
    chromeCtx = await arrencaChrome(args.chrome);
    const cdp = await connectaCdp(chromeCtx.wsUrl);
    try {
      for (const ruta of args.rutes) {
        const cap = await capturaRutaMultiAmplaria({
          cdp,
          baseUrl: args.baseUrl,
          ruta,
          amplaries: args.amplaries,
          outDir: args.out,
          settleMs: args.settleMs
        });
        capturesRutes.push(cap);
      }
    } finally {
      cdp.tanca();
    }
  } catch (err) {
    if (outTemporal) fs.rmSync(args.out, { recursive: true, force: true });
    throw err;
  } finally {
    await tancaChrome(chromeCtx);
    for (const [senyal, gestor] of gestors) process.removeListener(senyal, gestor);
  }

  const keptChecks = {
    schema: 'sdp.kept-checks.v1',
    updatedAt: new Date().toISOString(),
    srcGraphSha256: ciclesInfo.empremtatGlobalSrcSha256,
    circularImportsCount: ciclesInfo.totalCicles,
    circularImports: ciclesInfo.cicles,
    routesChecked: capturesRutes.map((c) => ({
      route: c.route,
      passedClaims: c.claims.filter((x) => x.passed).length,
      totalClaims: c.claims.length,
      failedClaims: c.claims.filter((x) => !x.passed)
    }))
  };
  fs.writeFileSync(path.join(args.out, 'kept-checks.json'), JSON.stringify(keptChecks, null, 2));

  const mdPath = generaInformeMarkdown({
    ciclesInfo,
    inventariClons,
    capturesRutes,
    outDir: args.out
  });

  const totalClaims = capturesRutes.reduce((acc, r) => acc + r.claims.length, 0);
  const claimsOk = capturesRutes.reduce((acc, r) => acc + r.claims.filter((c) => c.passed).length, 0);
  const verd = ciclesInfo.totalCicles === 0 && ciclesInfo.noAnalitzats.length === 0 && claimsOk === totalClaims;
  console.log(JSON.stringify({
    ok: verd,
    claimsOk,
    claimsTotal: totalClaims,
    eixida: args.out,
    totalFitxersSrc: ciclesInfo.totalFitxersAnalitzats,
    fitxersNoAnalitzats: ciclesInfo.noAnalitzats,
    totalCiclesImports: ciclesInfo.totalCicles,
    cicles: ciclesInfo.cicles,
    rutesAuditades: capturesRutes.map((r) => ({
      ruta: r.route,
      claimsOk: r.claims.filter((c) => c.passed).length,
      claimsTotal: r.claims.length
    })),
    informeMarkdown: mdPath
  }, null, 2));
  return verd ? 0 : 1;
}

if (esMain(import.meta.url)) {
  process.once('exit', tancaChromesSincron);
  main().then((codi) => { process.exitCode = codi; }).catch((err) => {
    console.error('[tractor-craft-paritat-visual] ERROR:', err.message);
    tancaChromesSincron();
    process.exitCode = 2;
  });
}
