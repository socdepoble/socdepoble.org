#!/usr/bin/env node
/**
 * Onada R32.18 · Lot 03 · gauntlet-71-rutes-cdp.mjs
 *
 * Arnés d'auditoria real en Chrome Headless CDP (sense xarxa externa ni
 * dependències de tercers) que constrüeix el paquet de producció i recorre
 * totes les 71 rutes canòniques de tooling/gates/consola-zero.rutes.json més
 * /page/guia i les 6 micro-apps (/app/bar, /app/nevera, /app/gestoria,
 * /app/genealogia, /app/lector, /app/salut) en 320x700, 359x780, 360x800 i
 * 1280x800, Mode Sènior ON/OFF, tema light/dark i les 5 llengües
 * (ca, es, en, eu, gl).
 *
 * Ús:
 *   node tooling/anatomia/gauntlet-71-rutes-cdp.mjs --informe /tmp/matriu_cdp.json
 *   node tooling/anatomia/gauntlet-71-rutes-cdp.mjs --informe /tmp/matriu_cdp.json --amb-consola-zero
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as espera } from 'node:timers/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  aplicaExempcions,
  capcaleresEfectives,
  classificaEsdeveniment,
  classificaFallada,
  classificaResposta,
  reclassificaLogDeXarxa,
  resolDeHosting,
  tipusMime,
} from '../gates/consola-zero-nucli.mjs';

const ARREL_DEFECTE = fs.realpathSync(fileURLToPath(new URL('../..', import.meta.url)));
const CHROME_PER_DEFECTE = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const BACKEND_MORT = 'http://localhost:9';
const BLOQUEJADES = ['*://*.supabase.co/*', '*://*.supabase.in/*', '*://*.supabase.co:*/*'];

export const SCENARIOS_PER_ROUTE = Object.freeze([
  Object.freeze({ w: 320, h: 700, mobile: true, theme: 'light', senior: false, lang: 'ca' }),
  Object.freeze({ w: 320, h: 700, mobile: true, theme: 'dark', senior: true, lang: 'es' }),
  Object.freeze({ w: 359, h: 780, mobile: true, theme: 'light', senior: false, lang: 'eu' }),
  Object.freeze({ w: 359, h: 780, mobile: true, theme: 'dark', senior: true, lang: 'gl' }),
  Object.freeze({ w: 360, h: 800, mobile: true, theme: 'light', senior: true, lang: 'en' }),
  Object.freeze({ w: 360, h: 800, mobile: true, theme: 'dark', senior: false, lang: 'ca' }),
  Object.freeze({ w: 1280, h: 800, mobile: false, theme: 'light', senior: false, lang: 'ca' }),
  Object.freeze({ w: 1280, h: 800, mobile: false, theme: 'dark', senior: true, lang: 'es' }),
]);

export const EXTRA_ROUTES = Object.freeze([
  '/page/guia',
  '/app/bar',
  '/app/nevera',
  '/app/gestoria',
  '/app/genealogia',
  '/app/lector',
  '/app/salut',
]);

export const KEY_5LANG_ROUTES = new Set([
  '/', '/mur', '/mercat', '/calendari', '/pobles', '/mapa', '/xat',
  '/el-meu-perfil', '/app', '/page/guia', '/app/bar', '/app/nevera',
  '/app/gestoria', '/app/genealogia', '/app/lector', '/app/salut',
]);

/**
 * Avalua al navegador (funció pura serialitzable via Runtime.evaluate) els 5 invariants visuals:
 * 1) Zero desbordament horitzontal (scrollWidth <= clientWidth).
 * 2) Zero imatges visibles del mateix origen amb naturalWidth === 0.
 * 3) Dianes tàctils >= 48 px i dianes primàries >= 56 px quan Mode Sènior és actiu.
 * 4) Jerarquia tipogràfica editorial H1 >= H2 >= H3 al contingut principal (excloent nav, aside, dialog, .sp-card i .sdp-especimen).
 * 5) Prohibició de taules amples (>= 3 columnes) nues en rutes editorials/Wiki (P0-128), validant que les taules tècniques (<Taula>) visquen dins d'una regió desplaçable accessible WCAG 2.1.1 (role="region", tabIndex >= 0, overflow-x: auto).
 */
export function auditDomInPage(seniorActiu) {
  const docEl = document.documentElement;
  const body = document.body;
  const clientW = docEl.clientWidth || window.innerWidth;
  const scrollW = Math.max(docEl.scrollWidth, body ? body.scrollWidth : 0);
  const overflowPx = Math.max(0, Math.ceil(scrollW - clientW));

  const offendingOverflow = [];
  if (overflowPx > 0) {
    for (const el of document.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.right > clientW + 1) {
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed') continue;
        let clipped = false;
        for (let p = el.parentElement; p && p !== docEl; p = p.parentElement) {
          const ox = getComputedStyle(p).overflowX;
          const pr = p.getBoundingClientRect();
          if ((ox === 'hidden' || ox === 'clip' || ox === 'auto' || ox === 'scroll') && pr.right <= clientW + 1) {
            clipped = true;
            break;
          }
        }
        if (!clipped) {
          offendingOverflow.push({
            tag: el.tagName.toLowerCase(),
            cls: String(el.className || '').slice(0, 80),
            right: Math.round(r.right),
            clientW,
          });
          if (offendingOverflow.length >= 5) break;
        }
      }
    }
  }

  const isVisible = (el) => {
    if (!el || !el.isConnected) return false;
    if (el.closest('[hidden], [inert], [aria-hidden="true"], .sdp-sr-only, .sdp-nomes-lector')) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0.5 && r.height > 0.5;
  };

  const brokenImages = [];
  for (const img of document.querySelectorAll('img')) {
    if (!isVisible(img)) continue;
    const src = img.getAttribute('src') || '';
    if (!src || /^https?:\/\/(?!127\.0\.0\.1|localhost)/i.test(src)) continue;
    if (img.complete && img.naturalWidth === 0) {
      brokenImages.push({ src: src.slice(0, 120), alt: (img.alt || '').slice(0, 40) });
    }
  }

  const smallTargets = [];
  const seniorPrimarySel = '.sdp-boto, .sdp-accions > a:not([class]), a.sp-card-porta, button.sp-card-porta, .sdp-mode-senior-xip';
  const controlSel = 'button, [role="button"], [role="switch"], .nav-item, .sdp-boto, a.sp-card-porta, button.sp-card-porta, .sdp-mode-senior-xip';
  for (const el of document.querySelectorAll(controlSel)) {
    if (!isVisible(el)) continue;
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;
    if (el.classList.contains('app-grid-resizer')) continue;
    const cs = getComputedStyle(el);
    if (el.tagName === 'A' && cs.display === 'inline') continue;
    let hiddenByAncestor = false;
    for (let p = el.parentElement; p && p !== docEl; p = p.parentElement) {
      const pr = p.getBoundingClientRect();
      const pcs = getComputedStyle(p);
      if ((pcs.overflow === 'hidden' || pcs.overflowX === 'hidden' || pcs.overflowY === 'hidden') && (pr.width < 2 || pr.height < 2)) {
        hiddenByAncestor = true;
        break;
      }
    }
    if (hiddenByAncestor) continue;

    const r = el.getBoundingClientRect();
    const isSeniorPrimary = Boolean(seniorActiu) && el.matches(seniorPrimarySel);
    const strict48 = el.matches('.sdp-boto, .nav-item, .btn-icon, .sdp-mode-senior-xip, a.sp-card-porta, button.sp-card-porta');
    const expectedH = isSeniorPrimary ? 55.5 : (strict48 ? 47.5 : 43.5);
    if (r.height < expectedH) {
      smallTargets.push({
        tag: el.tagName.toLowerCase(),
        cls: String(el.className || '').slice(0, 80),
        text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40),
        w: Math.round(r.width * 10) / 10,
        h: Math.round(r.height * 10) / 10,
        expectedH: Math.round(expectedH),
      });
      if (smallTargets.length >= 6) break;
    }
  }

  const headingViolations = [];
  const mainArea = document.querySelector('main, .app-main__content, #root') || body;
  const visibleHeadings = (tag) => [...mainArea.querySelectorAll(tag)]
    .filter((h) => isVisible(h) && !h.closest('nav, aside, dialog, .sp-card, .sdp-especimen'))
    .map((h) => parseFloat(getComputedStyle(h).fontSize));
  const h1s = visibleHeadings('h1');
  const h2s = visibleHeadings('h2');
  const h3s = visibleHeadings('h3');
  if (h1s.length && h2s.length && Math.max(...h1s) + 0.5 < Math.max(...h2s)) {
    headingViolations.push({ rule: 'H1>=H2', h1: Math.max(...h1s), h2: Math.max(...h2s) });
  }
  if (h2s.length && h3s.length && Math.min(...h2s) + 0.5 < Math.max(...h3s)) {
    headingViolations.push({ rule: 'H2>=H3', h2: Math.min(...h2s), h3: Math.max(...h3s) });
  }

  const editorialRe = /^\/(page\/|wiki|wikidepoble|mur\/|mercat\/|events\/|legal|projecte|constitucio|anima|roadmap|versions|fedivers|receptes|skills|descarregues|ia\b|iaia\b|realitat)/;
  const wideTables = [];
  for (const tbl of mainArea.querySelectorAll('table')) {
    if (!isVisible(tbl)) continue;
    const rows = [...tbl.querySelectorAll('tr')];
    const maxCols = rows.reduce((m, tr) => {
      const visCells = [...tr.children].filter((c) => getComputedStyle(c).display !== 'none');
      return Math.max(m, visCells.length);
    }, 0);
    if (maxCols >= 3) {
      const firstRow = rows.find((tr) => tr.children.length >= 3);
      const trDisplay = firstRow ? getComputedStyle(firstRow).display : 'table-row';
      if (trDisplay !== 'table-row') continue;
      const tblRect = tbl.getBoundingClientRect();
      const isEditorial = editorialRe.test(location.pathname);
      const region = tbl.closest('[role="region"]');
      const regionCs = region ? getComputedStyle(region) : null;
      const isAccessibleScrollRegion = Boolean(
        region &&
        region.tabIndex >= 0 &&
        (regionCs.overflowX === 'auto' || regionCs.overflowX === 'scroll') &&
        region.getBoundingClientRect().right <= clientW + 1,
      );
      const rawOverflows = tblRect.right > clientW + 1 && !isAccessibleScrollRegion;
      if (isEditorial || rawOverflows || (!isAccessibleScrollRegion && tbl.scrollWidth > clientW + 2)) {
        wideTables.push({ cols: maxCols, width: Math.round(tblRect.width), scrollW: tbl.scrollWidth, path: location.pathname });
      }
    }
  }

  return {
    overflowPx,
    offendingOverflow,
    brokenImages,
    smallTargets,
    headingViolations,
    wideTables,
    lang: docEl.lang || '',
    theme: docEl.getAttribute('data-theme') || 'light',
    senior: docEl.getAttribute('data-sdp-senior') === 'true',
  };
}

export function llistaRutesCompleta(rutesJson) {
  const canoniques = [...(rutesJson.rutes ?? []), ...(rutesJson.notFound ?? [])];
  const totes = [...new Set([...canoniques, ...EXTRA_ROUTES])];
  return { canoniques, totes };
}

function entornSintetic(envDir) {
  const net = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(VITE_|SDP_|SUPABASE)/.test(k)));
  return {
    ...net,
    VITE_SUPABASE_URL: BACKEND_MORT,
    VITE_SUPABASE_ANON_KEY: 'sb_publishable_consola_zero',
    VITE_DATA_MODE: 'seed',
    VITE_TENANT_ID: '00000000-0000-4000-8000-000000000024',
    VITE_PUSH_VAPID_PUBLICA: '',
    SOURCE_DATE_EPOCH: String(Date.UTC(2026, 10, 20, 1, 0, 0) / 1000),
    SDP_CONSOLA_ZERO_ENVDIR: envDir,
  };
}

function executa(arrel, ordre, args, env, que) {
  const r = spawnSync(ordre, args, { cwd: arrel, env, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0) {
    throw new Error(`${que} ha fallat (${r.status}):\n${(`${r.stdout ?? ''}\n${r.stderr ?? ''}`).slice(-2500)}`);
  }
  return r;
}

/* Gauntlet v1.2.14 R2 · El build propi, mentre dura, dins del projecte (el connector sdp-public-net exigix una eixida
   estrictament dins de l'arrel), però mai a <arrel>/dist: un mkdtemp sota node_modules/.cache, que Git ignora. */
let buildDinsDelProjecte = null;

const viu = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };

function directoriDeBuild(arrel) {
  const arrelReal = fs.realpathSync(arrel);
  const nodeModules = path.join(arrel, 'node_modules');
  if (!fs.realpathSync(nodeModules).startsWith(arrelReal + path.sep)) throw new Error(`node_modules ix fora de l'arrel: no s'hi construïx`);
  const cau = path.join(nodeModules, '.cache');
  fs.mkdirSync(cau, { recursive: true });
  const real = fs.realpathSync(cau);
  if (!real.startsWith(arrelReal + path.sep)) throw new Error(`node_modules/.cache ix fora de l'arrel (${real}): no s'hi construïx`);
  /* Gauntlet R2b · Escombra els temporals que un SIGKILL haja deixat: cadascun porta el pid del seu procés. */
  for (const nom of fs.readdirSync(cau).filter((n) => n.startsWith('sdp-gauntlet-71-'))) {
    const dir = path.join(cau, nom);
    let pid = 0;
    try { pid = Number(fs.readFileSync(path.join(dir, 'pid'), 'utf8')); } catch { /* sense pid: abandonat */ }
    if (!pid || !viu(pid)) fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10 });
  }
  const dir = fs.mkdtempSync(path.join(cau, 'sdp-gauntlet-71-'));
  fs.writeFileSync(path.join(dir, 'pid'), String(process.pid));
  return dir;
}

function construeixProduccio(arrel, workDir) {
  /* Gauntlet v1.2.14 R2 · El <arrel>/dist d'una altra mà (un build de producció a punt de desplegar) no es toca mai:
     vite escriu en un temporal propi dins del projecte, es copia al directori de treball i el temporal s'esborra. */
  const outDir = path.join(workDir, 'dist');
  const envDir = path.join(workDir, 'env-buit');
  fs.mkdirSync(envDir, { recursive: true });
  const env = entornSintetic(envDir);
  const vite = path.join(arrel, 'node_modules', 'vite', 'bin', 'vite.js');
  const t0 = Date.now();
  buildDinsDelProjecte = directoriDeBuild(arrel);
  try {
    const viteOutDir = path.join(buildDinsDelProjecte, 'dist');
    executa(arrel, process.execPath, [vite, 'build', '-c', 'vite.consola-zero.config.mjs', '--outDir', viteOutDir, '--emptyOutDir'], env, 'vite build');
    fs.cpSync(viteOutDir, outDir, { recursive: true });
  } finally {
    fs.rmSync(buildDinsDelProjecte, { recursive: true, force: true, maxRetries: 10 });
    buildDinsDelProjecte = null;
  }
  const snapshot = path.join(workDir, 'social', 'snapshot.json');
  fs.mkdirSync(path.dirname(snapshot), { recursive: true });
  executa(arrel, process.execPath, ['tooling/seo/projeccio-publica.mjs', '--root', arrel, '--origin', 'https://socdepoble.org', '--out', snapshot],
    { ...env, SDP_SOCIAL_SENSE_REMOT: '1' }, 'projeccio social');
  executa(arrel, process.execPath, ['tooling/seo/prerender-social.mjs', '--root', arrel, '--dist', outDir, '--origin', 'https://socdepoble.org', '--snapshot', snapshot],
    env, 'prerender social');
  return { outDir, buildMs: Date.now() - t0 };
}

function creaServidor(hosting, distDir) {
  const servidor = http.createServer((req, res) => {
    let cami;
    try { cami = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname); }
    catch { res.writeHead(400).end(); return; }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return; }
    const tipusDe = (rel) => {
      const estat = fs.statSync(path.join(distDir, rel), { throwIfNoEntry: false });
      return estat?.isDirectory() ? 'carpeta' : estat?.isFile() ? 'fitxer' : null;
    };
    const r = resolDeHosting(hosting, cami, tipusDe);
    const capcaleres = {};
    for (const { clau, valor } of Object.values(capcaleresEfectives(hosting, cami))) capcaleres[clau] = valor;
    if (r.estat === 301) {
      res.writeHead(301, { ...capcaleres, Location: r.desti + (new URL(req.url, 'http://127.0.0.1').search) });
      res.end();
      return;
    }
    if (r.estat !== 200) {
      const cos = '<!doctype html><html><head><title>Page Not Found</title></head><body><h1>Page Not Found</h1></body></html>';
      const senseCache = Object.fromEntries(Object.entries(capcaleres).filter(([clau]) => !/^(cache-control|content-type)$/i.test(clau)));
      res.writeHead(r.estat, { ...senseCache, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', 'Content-Length': Buffer.byteLength(cos) });
      res.end(req.method === 'HEAD' ? undefined : cos);
      return;
    }
    const fitxer = path.join(distDir, r.rel);
    const teTipus = Object.keys(capcaleres).some((clau) => clau.toLowerCase() === 'content-type');
    res.writeHead(200, { ...(teTipus ? {} : { 'Content-Type': tipusMime(r.rel) }), ...capcaleres, 'Content-Length': fs.statSync(fitxer).size });
    if (req.method === 'HEAD') { res.end(); return; }
    fs.createReadStream(fitxer).on('error', () => res.destroy()).pipe(res);
  });
  return {
    async escolta() {
      await new Promise((ok, ko) => { servidor.once('error', ko); servidor.listen(0, '127.0.0.1', ok); });
      return `http://127.0.0.1:${servidor.address().port}`;
    },
    tanca: () => new Promise((ok) => { servidor.closeAllConnections?.(); servidor.close(() => ok()); }),
  };
}

/* Gauntlet v1.2.14 R2 · El Chrome viu es coneix des del spawn, no des que arrencaChrome torna: un senyal durant
   l'arrencada també el mata. */
let chromeEnArrencada = null;

async function arrencaChrome(chromeBin, workDir) {
  const dir = fs.mkdtempSync(path.join(workDir, 'chrome-'));
  const perfil = path.join(dir, 'perfil');
  const cau = path.join(dir, 'cau');
  fs.mkdirSync(perfil);
  fs.mkdirSync(cau);
  const proces = spawn(chromeBin, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${perfil}`, `--disk-cache-dir=${cau}`,
    '--use-mock-keychain', '--password-store=basic', '--no-first-run', '--no-default-browser-check',
    '--disable-background-networking', '--disable-component-update', '--disable-sync', '--disable-default-apps',
    '--disable-domain-reliability', '--metrics-recording-only', '--hide-scrollbars',
    '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding', '--disable-ipc-flooding-protection',
    '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost',
    '--proxy-server=http://127.0.0.1:9',
    'about:blank',
  ], { stdio: 'ignore', env: { ...process.env, HOME: dir } });
  chromeEnArrencada = proces;
  /* Un binari absent o sense permís d'execució emet 'error': es converteix en rebuig (i el finally neteja), no en una
     excepció no gestionada que tombe el procés. */
  let errorSpawn = null;
  proces.once('error', (e) => { errorSpawn = e; });
  let port = null;
  let cami = null;
  for (let i = 0; i < 150 && !port && !errorSpawn; i += 1) {
    try {
      const [p, c] = fs.readFileSync(path.join(perfil, 'DevToolsActivePort'), 'utf8').split('\n');
      port = Number(p);
      cami = c;
    } catch { await espera(100); }
  }
  if (errorSpawn) throw new Error(`Chrome no ha arrencat: ${errorSpawn.message}`);
  if (!port) { proces.kill('SIGKILL'); throw new Error('Chrome no ha obert DevToolsActivePort'); }
  return { proces, dir, ws: `ws://127.0.0.1:${port}${cami}` };
}

async function connectaCdp(url) {
  const ws = new WebSocket(url);
  await new Promise((ok, ko) => {
    ws.addEventListener('open', ok, { once: true });
    ws.addEventListener('error', () => ko(new Error('CDP error')), { once: true });
  });
  let id = 0;
  const pendents = new Map();
  const escoltes = new Set();
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pendents.has(m.id)) {
      const p = pendents.get(m.id);
      pendents.delete(m.id);
      clearTimeout(p.rellotge);
      if (m.error) p.ko(new Error(`${p.metode}: ${m.error.message}`));
      else p.ok(m.result);
      return;
    }
    if (m.method) for (const fn of escoltes) fn(m);
  });
  const send = (metode, params = {}, sessionId = undefined, temps = 30000) => new Promise((ok, ko) => {
    const i = ++id;
    const rellotge = setTimeout(() => { pendents.delete(i); ko(new Error(`Timeout CDP ${metode}`)); }, temps);
    pendents.set(i, { ok, ko, rellotge, metode });
    ws.send(JSON.stringify(sessionId ? { id: i, method: metode, params, sessionId } : { id: i, method: metode, params }));
  });
  const tanca = () => {
    for (const p of pendents.values()) clearTimeout(p.rellotge);
    pendents.clear();
    escoltes.clear();
    try { ws.close(); } catch { /* ja tancat */ }
  };
  return { send, on: (f) => { escoltes.add(f); return () => escoltes.delete(f); }, tanca };
}

const RESERVA_INIT = `(() => {
  window.__sdpErrors = [];
  addEventListener('error', (e) => {
    const t = e.target;
    if (t && t.tagName === 'IMG') return;
    window.__sdpErrors.push({ tipus: 'pageerror', text: String(e.message || (t && (t.src || t.href)) || e.type) });
  }, true);
  addEventListener('unhandledrejection', (e) => {
    const r = e.reason;
    window.__sdpErrors.push({ tipus: 'unhandledrejection', text: String((r && (r.stack || r.message)) || r) });
  });
})();`;

const AUDIT_DOM_EXPR = (seniorActiu) => `(${auditDomInPage.toString()})(${Boolean(seniorActiu)})`;

function parseCli(argv) {
  let arrel = ARREL_DEFECTE;
  let informe = null;
  let rutes = null;
  let chrome = CHROME_PER_DEFECTE;
  let ambConsolaZero = false;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--amb-consola-zero') ambConsolaZero = true;
    else if (a === '--arrel') arrel = fs.realpathSync(argv[++i]);
    else if (a === '--informe') informe = path.resolve(argv[++i]);
    else if (a === '--chrome') chrome = argv[++i];
    else if (a === '--rutes') rutes = argv[++i];
    else if (a.startsWith('--rutes=')) rutes = a.slice('--rutes='.length);
    else if (a.startsWith('--informe=')) informe = path.resolve(a.slice('--informe='.length));
  }
  return { arrel, informe, rutes, chrome, ambConsolaZero };
}

export async function main(argv = process.argv.slice(2)) {
  const opts = parseCli(argv);
  const tmpBase = fs.realpathSync(os.tmpdir());
  const workDir = fs.mkdtempSync(path.join(tmpBase, 'sdp-gauntlet-71-cdp-'));
  let servidor = null;
  let chrome = null;
  let cdp = null;
  /* Gauntlet v1.2.14 R2 · L'arnés no escriu mai a <arrel>/dist (construeixProduccio construïx en un temporal propi).
     Davant d'un senyal, mata el Chrome (també el que encara arrenca) i esborra el directori de treball i el temporal
     de build. */
  const netejaSincron = () => {
    for (const p of [chrome?.proces, chromeEnArrencada]) { try { p?.kill('SIGKILL'); } catch { /* ja és mort */ } }
    try { fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 }); } catch { /* temporal del sistema */ }
    try { if (buildDinsDelProjecte) fs.rmSync(buildDinsDelProjecte, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 }); } catch { /* l'escombra el pròxim build (fitxer pid) */ }
  };
  const gestors = [['SIGINT', 130], ['SIGTERM', 143], ['SIGHUP', 129]].map(([senyal, codi]) => {
    const gestor = () => { netejaSincron(); process.exit(codi); };
    process.once(senyal, gestor);
    return [senyal, gestor];
  });

  try {
    const hosting = JSON.parse(fs.readFileSync(path.join(opts.arrel, 'firebase.json'), 'utf8')).hosting;
    const rutesJson = JSON.parse(fs.readFileSync(path.join(opts.arrel, 'tooling/gates/consola-zero.rutes.json'), 'utf8'));
    const { canoniques: rutesCanoniques71, totes } = llistaRutesCompleta(rutesJson);
    const totesLesRutes = opts.rutes ? opts.rutes.split(',').map((r) => r.trim()).filter(Boolean) : totes;
    const exempcions = rutesJson.exempcions ?? [];

    const { outDir } = construeixProduccio(opts.arrel, workDir);
    servidor = creaServidor(hosting, outDir);
    const origen = await servidor.escolta();
    chrome = await arrencaChrome(opts.chrome, workDir);
    cdp = await connectaCdp(chrome.ws);

    const sessions = new Map();
    const perTarget = new Map();
    const recollidors = new Map();

    const prepara = async (sessionId, tipus) => {
      const domini = (m, p) => cdp.send(m, p, sessionId).catch(() => null);
      if (tipus === 'page' || tipus === 'iframe') {
        await domini('Page.enable');
        await domini('Page.addScriptToEvaluateOnNewDocument', { source: RESERVA_INIT });
      }
      await domini('Runtime.enable');
      await domini('Log.enable');
      await domini('Network.enable');
      if (!(await domini('Network.setBlockedURLs', { urls: BLOQUEJADES }))) {
        await domini('Network.setBlockedURLs', { urlPatterns: BLOQUEJADES.map((urlPattern) => ({ urlPattern, block: true })) });
      }
      await domini('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true });
    };

    cdp.on((m) => {
      if (m.method === 'Target.attachedToTarget') {
        const { sessionId, targetInfo, waitingForDebugger } = m.params;
        sessions.set(sessionId, { tipus: targetInfo.type, context: targetInfo.browserContextId });
        const preparat = prepara(sessionId, targetInfo.type)
          .then(() => (waitingForDebugger ? cdp.send('Runtime.runIfWaitingForDebugger', {}, sessionId).catch(() => null) : null));
        perTarget.set(targetInfo.targetId, { sessionId, preparat });
        return;
      }
      if (m.method === 'Target.detachedFromTarget') { sessions.delete(m.params.sessionId); return; }
      const s = m.sessionId && sessions.get(m.sessionId);
      const rec = s && recollidors.get(s.context);
      if (rec) rec.rep(m, s);
    });

    await cdp.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true });
    const browserVersion = (await cdp.send('Browser.getVersion')).product;

    function creaRecollidor() {
      const r = {
        troballes: [],
        peticions: new Map(),
        enVol: new Set(),
        activitat: Date.now(),
        claus: new Set(),
        afegeix(troballa) {
          const t = aplicaExempcions(troballa, exempcions);
          if (!t || !t.falla) return;
          const clau = `${t.categoria}|${t.url ?? ''}|${t.text}`;
          if (r.claus.has(clau)) return;
          r.claus.add(clau);
          r.troballes.push(t);
        },
        rep(m, s) {
          const p = m.params ?? {};
          const clauPeticio = `${m.sessionId}|${p.requestId}`;
          const esPagina = s.tipus === 'page';
          if (m.method === 'Network.requestWillBeSent') {
            r.peticions.set(clauPeticio, { url: p.request?.url, iniciador: p.initiator, tipus: p.type ?? null, estat: null });
            if (esPagina) { r.enVol.add(clauPeticio); r.activitat = Date.now(); }
          } else if (m.method === 'Network.responseReceived') {
            const peticio = r.peticions.get(clauPeticio) ?? { url: p.response?.url, iniciador: null };
            peticio.estat = p.response?.status ?? null;
            r.afegeix(classificaResposta({ url: p.response?.url, estat: p.response?.status, iniciador: peticio.iniciador, tipus: p.type ?? null }, { origen }));
          } else if (m.method === 'Network.loadingFinished') {
            if (esPagina) { r.enVol.delete(clauPeticio); r.activitat = Date.now(); }
          } else if (m.method === 'Network.loadingFailed') {
            if (esPagina) { r.enVol.delete(clauPeticio); r.activitat = Date.now(); }
            const peticio = r.peticions.get(clauPeticio) ?? {};
            if (peticio.estat && peticio.estat < 400 && /ERR_ABORTED/.test(p.errorText ?? '')) return;
            const err = [p.errorText, p.blockedReason ? `(bloquejada: ${p.blockedReason})` : ''].filter(Boolean).join(' ');
            r.afegeix(classificaFallada({ url: peticio.url, error: err, cancelada: p.canceled === true, iniciador: peticio.iniciador, tipus: p.type ?? null }, { origen, backend: BACKEND_MORT }));
          } else if (m.method === 'Page.javascriptDialogOpening') {
            cdp.send('Page.handleJavaScriptDialog', { accept: false }, m.sessionId).catch(() => null);
          } else {
            let t = classificaEsdeveniment(m, { estricte: false });
            if (t?.categoria === 'log:network') {
              const url = t.peticio ? (r.peticions.get(`${m.sessionId}|${t.peticio}`)?.url ?? t.url) : t.url;
              t = reclassificaLogDeXarxa(t, url, { origen, backend: BACKEND_MORT });
            }
            if (t) { delete t.peticio; r.afegeix(t); }
          }
        },
      };
      return r;
    }

    const avalua = async (sessionId, expression) => {
      const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId, 20000);
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result?.value;
    };

    const esperaQuietud = async (r, quiet = 400, maxMs = 6000) => {
      const fi = Date.now() + maxMs;
      while (Date.now() < fi) {
        if (r.enVol.size === 0 && Date.now() - r.activitat >= quiet) return;
        await espera(60);
      }
    };

    async function auditaRuta(ruta) {
      const { browserContextId } = await cdp.send('Target.createBrowserContext', { disposeOnDetach: true });
      const rec = creaRecollidor();
      recollidors.set(browserContextId, rec);
      const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank', browserContextId });
      for (let i = 0; i < 100 && !perTarget.has(targetId); i += 1) await espera(40);
      const sessio = perTarget.get(targetId);
      await sessio.preparat;
      const sid = sessio.sessionId;

      const routeErrors = [];
      const scenarioSummaries = [];
      const t0 = Date.now();

      try {
        await cdp.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 700, deviceScaleFactor: 1, mobile: true }, sid);
        await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }, { name: 'prefers-color-scheme', value: 'light' }] }, sid);
        await cdp.send('Page.navigate', { url: `${origen}${ruta}` }, sid);

        for (let i = 0; i < 150; i += 1) {
          const ok = await avalua(sid, "document.readyState === 'complete' && !!document.querySelector('#root') && document.querySelector('#root').childElementCount > 0").catch(() => false);
          if (ok) break;
          await espera(80);
        }
        await esperaQuietud(rec, 450, 8000);

        await avalua(sid, `(async () => {
          for (const img of document.querySelectorAll('img')) {
            if (img.loading === 'lazy') img.loading = 'eager';
          }
          window.scrollTo(0, document.documentElement.scrollHeight);
          await new Promise((r) => setTimeout(r, 120));
          window.scrollTo(0, 0);
          await Promise.all([...document.querySelectorAll('img')].map((img) => {
            if (img.complete || !img.src || /^https?:\\/\\/(?!127\\.0\\.0\\.1|localhost)/i.test(img.src)) return Promise.resolve();
            return new Promise((res) => {
              const to = setTimeout(res, 1500);
              img.addEventListener('load', () => { clearTimeout(to); res(); }, { once: true });
              img.addEventListener('error', () => { clearTimeout(to); res(); }, { once: true });
            });
          }));
        })()`).catch(() => null);
        await esperaQuietud(rec, 250, 4000);

        const scenarios = [...SCENARIOS_PER_ROUTE];
        if (KEY_5LANG_ROUTES.has(ruta)) {
          for (const extraLang of ['ca', 'es', 'en', 'eu', 'gl']) {
            if (!scenarios.some((s) => s.w === 320 && s.lang === extraLang)) {
              scenarios.push({ w: 320, h: 700, mobile: true, theme: 'light', senior: false, lang: extraLang });
            }
          }
        }

        for (const sc of scenarios) {
          await cdp.send('Emulation.setDeviceMetricsOverride', { width: sc.w, height: sc.h, deviceScaleFactor: 1, mobile: sc.mobile }, sid);
          await cdp.send('Emulation.setEmulatedMedia', {
            features: [
              { name: 'prefers-reduced-motion', value: 'reduce' },
              { name: 'prefers-color-scheme', value: sc.theme },
            ],
          }, sid);

          await avalua(sid, `(async () => {
            window.dispatchEvent(new CustomEvent('sdp:theme-changed', { detail: { theme: ${JSON.stringify(sc.theme)} } }));
            window.dispatchEvent(new CustomEvent('sdp:senior-changed', { detail: { senior: ${sc.senior} } }));
            window.dispatchEvent(new CustomEvent('sdp:language-changed', { detail: { language: ${JSON.stringify(sc.lang)} } }));
            await Promise.race([
              new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
              new Promise((r) => setTimeout(r, 80)),
            ]);
            await new Promise((r) => setTimeout(r, ${sc.senior || sc.lang !== 'ca' ? 140 : 60}));
            void document.documentElement.offsetHeight;
          })()`);
          if (sc.senior || sc.lang !== 'ca') await esperaQuietud(rec, 140, 3000);
          if (sc.senior) {
            await avalua(sid, `(async () => {
              const deadline = Date.now() + 2500;
              const hasSeniorSheet = () => {
                if (document.querySelector('style[data-sdp-full-diferit="mode-senior"]')) return true;
                for (const s of document.adoptedStyleSheets || []) {
                  try {
                    for (const r of s.cssRules || []) {
                      if (r.cssText && r.cssText.includes('sdp-mode-senior-xip')) return true;
                    }
                  } catch { /* cross-origin rule */ }
                }
                return false;
              };
              while (!hasSeniorSheet() && Date.now() < deadline) {
                await new Promise((r) => setTimeout(r, 50));
              }
              void document.documentElement.offsetHeight;
            })()`);
          }

          const dom = await avalua(sid, AUDIT_DOM_EXPR(sc.senior));
          const label = `${sc.w}x${sc.h}:${sc.theme}:senior=${sc.senior ? 'ON' : 'OFF'}:${sc.lang}`;
          const errs = [];
          if (dom.overflowPx > 0) errs.push({ type: 'overflow', px: dom.overflowPx, details: dom.offendingOverflow });
          if (dom.brokenImages.length > 0) errs.push({ type: 'broken-images', details: dom.brokenImages });
          if (dom.smallTargets.length > 0) errs.push({ type: 'small-targets', details: dom.smallTargets });
          if (dom.headingViolations.length > 0) errs.push({ type: 'heading-hierarchy', details: dom.headingViolations });
          if (dom.wideTables.length > 0) errs.push({ type: 'wide-tables', details: dom.wideTables });

          scenarioSummaries.push({ scenario: label, ok: errs.length === 0, errors: errs });
          for (const e of errs) routeErrors.push({ scenario: label, ...e });
        }

        const runtimeErrs = await avalua(sid, 'window.__sdpErrors || []').catch(() => []);
        for (const re of runtimeErrs) routeErrors.push({ scenario: 'runtime', type: re.tipus, text: re.text });
        for (const tr of rec.troballes) routeErrors.push({ scenario: 'console/network', type: tr.categoria, text: tr.text, url: tr.url });
      } catch (err) {
        routeErrors.push({ scenario: 'infra', type: 'cdp-error', text: String(err?.message || err) });
      } finally {
        recollidors.delete(browserContextId);
        await cdp.send('Target.disposeBrowserContext', { browserContextId }).catch(() => null);
      }

      return {
        ruta,
        esCanonica71: rutesCanoniques71.includes(ruta),
        escenarisAvaluats: scenarioSummaries.length,
        ok: routeErrors.length === 0,
        ms: Date.now() - t0,
        errors: routeErrors,
      };
    }

    const results = new Array(totesLesRutes.length);
    let cursor = 0;
    const CONCURRENCY = 4;
    await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
      while (cursor < totesLesRutes.length) {
        const idx = cursor++;
        results[idx] = await auditaRuta(totesLesRutes[idx]);
      }
    }));

    cdp.tanca();
    cdp = null;
    chrome.proces.kill('SIGTERM');
    await Promise.race([new Promise((ok) => chrome.proces.once('exit', ok)), espera(3000)]);
    if (chrome.proces.exitCode === null) chrome.proces.kill('SIGKILL');
    chrome = null;
    await servidor.tanca();
    servidor = null;

    const canoniquesResults = results.filter((r) => r.esCanonica71);
    const falladesCanoniques = canoniquesResults.filter((r) => !r.ok);
    const falladesTotals = results.filter((r) => !r.ok);
    const totalEscenaris = results.reduce((s, r) => s + r.escenarisAvaluats, 0);

    let consolaZeroOficial = null;
    if (opts.ambConsolaZero && falladesTotals.length === 0) {
      const czOut = path.join(workDir, 'consola-zero.json');
      executa(opts.arrel, process.execPath, [
        'tooling/gates/consola-zero.mjs',
        '--scratch', workDir,
        '--dist', outDir,
        '--escenaris', 'rutes,interna',
        '--informe', czOut,
      ], process.env, 'consola-zero oficial');
      consolaZeroOficial = JSON.parse(fs.readFileSync(czOut, 'utf8')).resum;
    }

    const report = {
      schema: 'sdp.gauntlet-71-rutes-cdp.r32_18.v1',
      creat: new Date().toISOString(),
      navegador: browserVersion,
      viewports: ['320x700', '359x780', '360x800', '1280x800'],
      modesSenior: ['OFF', 'ON'],
      temes: ['light', 'dark'],
      llengues: ['ca', 'es', 'en', 'eu', 'gl'],
      resum: {
        rutesCanoniquesTotal: canoniquesResults.length,
        rutesCanoniquesPass: canoniquesResults.length - falladesCanoniques.length,
        rutesCanoniquesFail: falladesCanoniques.length,
        rutesTotalsAmbMicroApps: results.length,
        rutesTotalsPass: results.length - falladesTotals.length,
        rutesTotalsFail: falladesTotals.length,
        escenarisTotalsAvaluats: totalEscenaris,
        errorsTotals: results.reduce((s, r) => s + r.errors.length, 0),
      },
      ...(consolaZeroOficial ? { consolaZeroOficial } : {}),
      fallades: falladesTotals,
      rutes: results,
    };

    const jsonText = `${JSON.stringify(report, null, 2)}\n`;
    if (opts.informe) {
      fs.mkdirSync(path.dirname(opts.informe), { recursive: true });
      fs.writeFileSync(opts.informe, jsonText, 'utf8');
    } else {
      process.stdout.write(jsonText);
    }
    return falladesTotals.length === 0 ? 0 : 1;
  } finally {
    try { cdp?.tanca(); } catch { /* ignore */ }
    for (const p of [chrome?.proces, chromeEnArrencada]) { try { p?.kill('SIGKILL'); } catch { /* ignore */ } }
    chromeEnArrencada = null;
    if (servidor) { try { await servidor.tanca(); } catch { /* ignore */ } }
    fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 10 });
    for (const [senyal, gestor] of gestors) process.removeListener(senyal, gestor);
  }
}

if (process.argv[1] && fs.existsSync(process.argv[1])
  && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  /* Gauntlet R2b · 0 verd, 1 rutes en roig, 2 fallada de l'arnés (build, Chrome, xarxa). */
  main().then((codi) => { process.exitCode = codi; }, (e) => { console.error(e?.stack || String(e)); process.exitCode = 2; });
}
