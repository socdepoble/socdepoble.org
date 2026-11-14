#!/usr/bin/env node
/* Onada R24 · Consola Zero (P-G de l'informe 261114 «consola_404_chunks») ·
 * L'arnés estricte de la consola del navegador, sense xarxa i sense cap
 * dependència nova (CDP natiu amb el WebSocket de Node, el patró de
 * tooling/anatomia/qa-browser.mjs).
 *
 *   npm run porta:consola-zero -- --scratch <carpeta absoluta existent>
 *     [--chrome-tmp <carpeta absoluta existent>] [--escenaris rutes,interna,skew]
 *     [--antic <dist absolut d'un build anterior>] [--antic-creat ISO]
 *     [--dist <dist absolut ja construït>] [--rutes /a,/b] [--estricte]
 *     [--chrome <binari>] [--informe <fitxer .json absolut>] [--temps-ruta 20000]
 *
 * Passos:
 *   1. Un mkdtemp dins de --scratch (mai res fora d'ell, de --chrome-tmp ni de
 *      --informe). Sense --dist, un `vite build` amb
 *      vite.consola-zero.config.mjs i VITE_* sintètiques (mode
 *      llavor, backend http://localhost:9, un port que Chrome no obri mai),
 *      més el prerender
 *      social sense remot (SDP_SOCIAL_SENSE_REMOT=1). Totes les variables
 *      viatgen dins del spawn; cap no es prefixa a la línia d'ordres.
 *   2. Un servidor HTTP propi a 127.0.0.1 que fa de Firebase Hosting amb
 *      firebase.json (fitxers, index.html de les carpetes prerenderitzades,
 *      reescriptura de l'SPA, capçaleres i CSP, 404 de veritat a /assets).
 *      `vite preview` no servix: torna l'index.html amb 200 per a un tros que
 *      falta, i Firebase torna un 404.
 *   3. Chrome sense cap: perfil i memòria cau en un mkdtemp de --chrome-tmp,
 *      HOME apuntat allí, --use-mock-keychain --password-store=basic, cap DNS
 *      fora de 127.0.0.1/localhost, un servidor intermediari mort per a tot
 *      el que no és el bucle local i Network.setBlockedURLs per a
 *      *.supabase.co. Cap petició no ix de la màquina.
 *   4. Escenaris: «rutes» (cada ruta de consola-zero.rutes.json en fred, en un
 *      context de navegador nou); «interna» (des de /, history.pushState cap a
 *      cada ruta en el mateix document, per als import() diferits); «skew»
 *      (amb --antic: s'obri / del build antic, el servidor canvia al build nou
 *      sense retenció i la navegació interna ha de donar 404 de modulepreload
 *      —el control que ha de fallar—; després, amb el build nou més
 *      `retencio-assets.mjs incorpora` de l'antic, 0 trossos perduts).
 *   5. Falla per: consola error, warning o assert; excepcions no capturades i
 *      rebutjos sense amo; entrades del Log d'error o d'avís; peticions del
 *      mateix origen que fallen o tornen ≥ 400 (també els modulepreload). Els
 *      missatges informatius del navegador només amb --estricte. Les peticions
 *      de fora que l'arnés talla s'anoten sense fallar.
 *   6. informe.json (sdp.consola-zero.v1) dins del mkdtemp i, amb --informe,
 *      una còpia. Codi 0 consola neta, 1 troballes, 2 ús o infraestructura
 *      (també un control de desfasament que no falla, o una resposta de
 *      Supabase, que voldria dir una fuga). Chrome i el servidor es tanquen
 *      sempre; el perfil de Chrome s'esborra.
 *
 * Límits: certifica el front (trossos, React, CSP, SW) en mode llavor, no les
 * respostes reals de Supabase; Chrome sense cap pot no disparar
 * beforeinstallprompt (ho cobrix src/pwa/instalacio.test.js). */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { setTimeout as espera } from 'node:timers/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  ESQUEMA_INFORME, aplicaExempcions, capcaleresEfectives, classificaEsdeveniment, classificaFallada, classificaResposta, codiDEixida,
  esFugaAProduccio, esTrobadaDeTros, reclassificaLogDeXarxa, resolDeHosting, resumeix, tipusMime
} from './consola-zero-nucli.mjs';
import { arxiva, comprovaClausura, incorpora, inventariaAssets } from '../scripts/retencio-assets.mjs';

const ARREL = fileURLToPath(new URL('../..', import.meta.url));
const PREFIX = '[consola-zero]';
const CHROME_PER_DEFECTE = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
/* El backend del build apunta a un port que Chrome no obri mai (9, «unsafe port»): cap connexió,
   ni local. Un backend sintètic que respon la sonda de /registre la passa a mode remot
   (OnboardingSection: comprovaServidor ok → enterRemoteMode) i llavors tot són 503: D-consola-5. */
export const BACKEND_MORT = 'http://localhost:9';
const BLOQUEJADES = ['*://*.supabase.co/*', '*://*.supabase.in/*', '*://*.supabase.co:*/*'];
const ESCENARIS = Object.freeze(['rutes', 'interna', 'skew']);

class ErrorDUs extends Error {}
class ErrorInfra extends Error {}

/** L'entorn del build: el del procés sense cap VITE_/SDP_/SUPABASE, més les sintètiques. */
export function entornSintetic({ envDir, backend = BACKEND_MORT, sal = '' }) {
  const net = Object.fromEntries(Object.entries(process.env).filter(([clau]) => !/^(VITE_|SDP_|SUPABASE)/.test(clau)));
  return {
    ...net,
    VITE_SUPABASE_URL: backend,
    VITE_SUPABASE_ANON_KEY: 'sb_publishable_consola_zero',
    VITE_DATA_MODE: 'seed',
    VITE_TENANT_ID: '00000000-0000-4000-8000-000000000024',
    VITE_PUSH_VAPID_PUBLICA: '',
    SOURCE_DATE_EPOCH: String(Date.UTC(2026, 10, 14, 5, 0, 0) / 1000),
    SDP_CONSOLA_ZERO_ENVDIR: envDir,
    ...(sal ? { SDP_CONSOLA_ZERO_SAL: sal } : {})
  };
}

function carpetaAbsoluta(valor, que) {
  if (typeof valor !== 'string' || !path.isAbsolute(valor)) throw new ErrorDUs(`${que} ha de ser un camí absolut`);
  const estat = fs.statSync(valor, { throwIfNoEntry: false });
  if (!estat?.isDirectory()) throw new ErrorDUs(`${que} no existix o no és una carpeta: ${valor}`);
  return fs.realpathSync(valor);
}

function analitza(argv) {
  const opcions = { estricte: false, tempsRuta: 20000 };
  const valors = new Set(['--scratch', '--chrome-tmp', '--escenaris', '--antic', '--antic-creat', '--dist', '--rutes', '--chrome', '--informe', '--temps-ruta']);
  for (let i = 0; i < argv.length; i += 1) {
    const clau = argv[i];
    if (clau === '--estricte') { opcions.estricte = true; continue; }
    if (!valors.has(clau)) throw new ErrorDUs(`opció desconeguda: ${clau}`);
    const valor = argv[i + 1];
    if (valor === undefined || valor.startsWith('--')) throw new ErrorDUs(`${clau} necessita un valor`);
    opcions[clau.slice(2)] = valor;
    i += 1;
  }
  opcions.scratch = carpetaAbsoluta(opcions.scratch, '--scratch');
  opcions.chromeTmp = opcions['chrome-tmp'] ? carpetaAbsoluta(opcions['chrome-tmp'], '--chrome-tmp') : null;
  if (opcions.antic) opcions.antic = carpetaAbsoluta(opcions.antic, '--antic');
  if (opcions.dist) opcions.dist = carpetaAbsoluta(opcions.dist, '--dist');
  opcions.escenaris = (opcions.escenaris ?? (opcions.antic ? 'rutes,interna,skew' : 'rutes,interna')).split(',').map((e) => e.trim()).filter(Boolean);
  /* R24 · Gauntlet (G-client-9) · Una llista buida després del filtre («,») no és «tots»: és un error d'ús. */
  if (!opcions.escenaris.length) throw new ErrorDUs('--escenaris no porta cap escenari');
  for (const e of opcions.escenaris) if (!ESCENARIS.includes(e)) throw new ErrorDUs(`escenari desconegut: ${e}`);
  if (opcions.rutes !== undefined && !opcions.rutes.split(',').map((r) => r.trim()).filter(Boolean).length) {
    throw new ErrorDUs('--rutes no porta cap ruta');
  }
  if (opcions.escenaris.includes('skew') && !opcions.antic) throw new ErrorDUs('l’escenari skew necessita --antic (el dist d’un build anterior)');
  if (opcions.informe && (!path.isAbsolute(opcions.informe) || !opcions.informe.endsWith('.json'))) throw new ErrorDUs('--informe ha de ser un fitxer .json absolut');
  if (opcions['antic-creat'] && !Number.isFinite(Date.parse(opcions['antic-creat']))) throw new ErrorDUs('--antic-creat ha de ser una data ISO');
  const temps = Number(opcions['temps-ruta'] ?? opcions.tempsRuta);
  if (!Number.isInteger(temps) || temps < 3000) throw new ErrorDUs('--temps-ruta ha de ser un enter de mil·lisegons ≥ 3000');
  opcions.tempsRuta = temps;
  opcions.chrome = opcions.chrome ?? CHROME_PER_DEFECTE;
  if (!fs.existsSync(opcions.chrome)) throw new ErrorDUs(`no trobe Chrome: ${opcions.chrome}`);
  return opcions;
}

/* ───────────── 1 · Build sense xarxa ───────────── */

function executa(ordre, args, { env, que }) {
  const r = spawnSync(ordre, args, { cwd: ARREL, env, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0) {
    const cua = `${r.stdout ?? ''}\n${r.stderr ?? ''}`.trim().split('\n').slice(-15).join('\n');
    throw new ErrorInfra(`${que} ha fallat (codi ${r.status ?? r.signal}):\n${cua}`);
  }
  return r;
}

function construeix({ arrel, outDir, backend }) {
  const envDir = path.join(arrel, 'env-buit');
  fs.mkdirSync(envDir, { recursive: true });
  const env = entornSintetic({ envDir, backend });
  const vite = path.join(ARREL, 'node_modules', 'vite', 'bin', 'vite.js');
  const inici = Date.now();
  executa(process.execPath, [vite, 'build', '-c', 'vite.consola-zero.config.mjs', '--outDir', outDir, '--emptyOutDir'], { env, que: 'vite build' });
  const snapshot = path.join(arrel, 'social', 'snapshot.json');
  fs.mkdirSync(path.dirname(snapshot), { recursive: true });
  executa(process.execPath, ['tooling/seo/projeccio-publica.mjs', '--root', ARREL, '--origin', 'https://socdepoble.org', '--out', snapshot],
    { env: { ...env, SDP_SOCIAL_SENSE_REMOT: '1' }, que: 'projecció social sense remot' });
  executa(process.execPath, ['tooling/seo/prerender-social.mjs', '--root', ARREL, '--dist', outDir, '--origin', 'https://socdepoble.org', '--snapshot', snapshot],
    { env, que: 'prerender social' });
  return { segons: Math.round((Date.now() - inici) / 100) / 10 };
}

/** El build contra els sostres del service worker: la regla del comentari de MAXIM_RECURSOS (P-C). */
export function pressupostDelSw(dist, textSw) {
  const inventari = inventariaAssets(dist);
  const trossos = inventari.length;
  const bytes = inventari.reduce((suma, f) => suma + f.bytes, 0);
  const maximRecursos = Number(/const MAXIM_RECURSOS = (\d+);/.exec(textSw)?.[1]);
  const factors = /const MAXIM_BYTES = ([\d\s*]+);/.exec(textSw)?.[1]?.split('*').map((n) => Number(n.trim()));
  const maximBytes = factors?.length ? factors.reduce((p, n) => p * n, 1) : NaN;
  const dins = trossos <= maximRecursos / 2 && bytes <= maximBytes / 2;
  return { trossos, bytes, maximRecursos, maximBytes, dinsDeLaMeitat: dins };
}

/* ───────────── 2 · Firebase Hosting en local ───────────── */

function creaServidor(hosting) {
  let arrel = null;
  let etiqueta = null;
  const registre = [];
  const servidor = http.createServer((req, res) => {
    let cami;
    try { cami = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname); } catch { res.writeHead(400).end(); return; }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return; }
    const tipusDe = (rel) => {
      const estat = fs.statSync(path.join(arrel, rel), { throwIfNoEntry: false });
      return estat?.isDirectory() ? 'carpeta' : estat?.isFile() ? 'fitxer' : null;
    };
    const r = resolDeHosting(hosting, cami, tipusDe);
    const capcaleres = {};
    for (const { clau, valor } of Object.values(capcaleresEfectives(hosting, cami))) capcaleres[clau] = valor;
    registre.push({ cami, estat: r.estat, build: etiqueta, t: Date.now() });
    if (r.estat === 301) { res.writeHead(301, { ...capcaleres, Location: r.desti + (new URL(req.url, 'http://127.0.0.1').search) }); res.end(); return; }
    if (r.estat !== 200) {
      // El 404 de Firebase: una pàgina HTML pròpia, no-cache i mai l'index.html de l'SPA.
      const cos = '<!doctype html><html><head><title>Page Not Found</title></head><body><h1>Page Not Found</h1></body></html>';
      const senseCache = Object.fromEntries(Object.entries(capcaleres).filter(([clau]) => !/^(cache-control|content-type)$/i.test(clau)));
      res.writeHead(r.estat, { ...senseCache, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', 'Content-Length': Buffer.byteLength(cos) });
      res.end(req.method === 'HEAD' ? undefined : cos);
      return;
    }
    const fitxer = path.join(arrel, r.rel);
    const teTipus = Object.keys(capcaleres).some((clau) => clau.toLowerCase() === 'content-type');
    res.writeHead(200, { ...(teTipus ? {} : { 'Content-Type': tipusMime(r.rel) }), ...capcaleres, 'Content-Length': fs.statSync(fitxer).size });
    if (req.method === 'HEAD') { res.end(); return; }
    fs.createReadStream(fitxer).on('error', () => res.destroy()).pipe(res);
  });
  return {
    servidor,
    registre,
    canvia(nouArrel, nom) { arrel = nouArrel; etiqueta = nom; },
    async escolta() {
      await new Promise((ok, ko) => { servidor.once('error', ko); servidor.listen(0, '127.0.0.1', ok); });
      return `http://127.0.0.1:${servidor.address().port}`;
    },
    tanca: () => new Promise((ok) => { servidor.closeAllConnections?.(); servidor.close(() => ok()); })
  };
}

/* ───────────── 3 · Chrome i CDP ───────────── */

async function arrencaChrome({ chrome, tmp }) {
  const dir = fs.mkdtempSync(path.join(tmp, 'consola-zero-chrome-'));
  const perfil = path.join(dir, 'perfil');
  const cau = path.join(dir, 'cau');
  fs.mkdirSync(perfil);
  fs.mkdirSync(cau);
  const proces = spawn(chrome, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${perfil}`, `--disk-cache-dir=${cau}`,
    '--use-mock-keychain', '--password-store=basic', '--no-first-run', '--no-default-browser-check',
    '--disable-background-networking', '--disable-component-update', '--disable-sync', '--disable-default-apps',
    '--disable-domain-reliability', '--metrics-recording-only', '--hide-scrollbars',
    // Cap DNS fora del bucle local, i un intermediari mort per a tot el que no hi és (el bucle local va directe).
    '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost',
    '--proxy-server=http://127.0.0.1:9',
    'about:blank'
  ], { stdio: 'ignore', env: { ...process.env, HOME: dir } });
  let port = null;
  let cami = null;
  for (let i = 0; i < 150 && !port; i += 1) {
    try {
      const [p, c] = fs.readFileSync(path.join(perfil, 'DevToolsActivePort'), 'utf8').split('\n');
      port = Number(p);
      cami = c;
    } catch { await espera(100); }
  }
  if (!port) {
    proces.kill('SIGKILL');
    throw new ErrorInfra('Chrome no ha obert el port de depuració');
  }
  return { proces, dir, ws: `ws://127.0.0.1:${port}${cami}` };
}

async function connectaCdp(url) {
  const ws = new WebSocket(url);
  await new Promise((ok, ko) => {
    ws.addEventListener('open', ok, { once: true });
    ws.addEventListener('error', () => ko(new ErrorInfra('CDP: no connecta')), { once: true });
  });
  let id = 0;
  const pendents = new Map();
  const escoltes = new Set();
  ws.addEventListener('message', (event) => {
    const m = JSON.parse(event.data);
    if (m.id && pendents.has(m.id)) {
      const p = pendents.get(m.id);
      pendents.delete(m.id);
      clearTimeout(p.rellotge);
      if (m.error) p.ko(new Error(`${p.metode}: ${m.error.message}`));
      else p.ok(m.result);
      return;
    }
    if (m.method) for (const escolta of escoltes) escolta(m);
  });
  const send = (metode, params = {}, sessionId = undefined, temps = 30000) => new Promise((ok, ko) => {
    const i = ++id;
    const rellotge = setTimeout(() => { pendents.delete(i); ko(new Error(`CDP: temps esgotat a ${metode}`)); }, temps);
    pendents.set(i, { ok, ko, rellotge, metode });
    ws.send(JSON.stringify(sessionId ? { id: i, method: metode, params, sessionId } : { id: i, method: metode, params }));
  });
  /* En tancar, cap rellotge pendent no ha de retindre el procés (ordres a sessions ja mortes, que no responen mai). */
  const tanca = () => {
    for (const p of pendents.values()) clearTimeout(p.rellotge);
    pendents.clear();
    escoltes.clear();
    try { ws.close(); } catch { /* ja tancat */ }
  };
  return { send, on: (f) => { escoltes.add(f); return () => escoltes.delete(f); }, tanca };
}

/* El buffer de reserva: errors i rebutjos que la pàgina veu (també els de recursos), per si CDP en perd cap. */
const RESERVA = `(() => { const b = (window.__sdpConsolaZero = []);
  addEventListener('error', (e) => { const t = e.target; b.push({ tipus: 'error', text: String(e.message || (t && (t.src || t.href)) || e.type) }); }, true);
  addEventListener('unhandledrejection', (e) => { const r = e.reason; b.push({ tipus: 'rebuig', text: String((r && (r.stack || r.message)) || r) }); });
})();`;

/** Les sessions de Chrome, el seu context i el recol·lector de cada context (una ruta o un escenari). */
function creaNavegador({ cdp, origen, backend, estricte, exempcions = [] }) {
  const sessions = new Map();
  const perTarget = new Map();
  const recollidors = new Map();
  const fuites = [];

  const prepara = async (sessionId, tipus) => {
    const domini = (metode, params) => cdp.send(metode, params, sessionId).catch(() => null);
    if (tipus === 'page' || tipus === 'iframe') {
      await domini('Page.enable');
      await domini('Page.addScriptToEvaluateOnNewDocument', { source: RESERVA });
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
      sessions.set(sessionId, { tipus: targetInfo.type, context: targetInfo.browserContextId, targetId: targetInfo.targetId });
      const preparat = prepara(sessionId, targetInfo.type)
        .then(() => (waitingForDebugger ? cdp.send('Runtime.runIfWaitingForDebugger', {}, sessionId).catch(() => null) : null));
      perTarget.set(targetInfo.targetId, { sessionId, preparat });
      return;
    }
    if (m.method === 'Target.detachedFromTarget') { sessions.delete(m.params.sessionId); return; }
    const s = m.sessionId && sessions.get(m.sessionId);
    const r = s && recollidors.get(s.context);
    if (r) r.rep(m, s);
  });

  const nouRecollidor = () => {
    const r = {
      troballes: [], observacions: [], peticions: new Map(), enVol: new Set(), activitat: Date.now(), navegacions: 0, claus: new Set(),
      afegeix(troballa, s) {
        const t = aplicaExempcions(troballa, exempcions);
        if (!t) return;
        const clau = `${t.categoria}|${t.url ?? ''}|${t.text}`;
        if (r.claus.has(clau)) return;
        r.claus.add(clau);
        const amb = { ...t, sessio: s?.tipus ?? null };
        (t.falla ? r.troballes : r.observacions).push(amb);
      },
      rep(m, s) {
        const p = m.params ?? {};
        const clauPeticio = `${m.sessionId}|${p.requestId}`;
        const esPagina = s.tipus === 'page';
        switch (m.method) {
          case 'Network.requestWillBeSent': {
            r.peticions.set(clauPeticio, { url: p.request?.url, iniciador: p.initiator, tipus: p.type ?? null, estat: null });
            if (esPagina) { r.enVol.add(clauPeticio); r.activitat = Date.now(); }
            return;
          }
          case 'Network.responseReceived': {
            const peticio = r.peticions.get(clauPeticio) ?? { url: p.response?.url, iniciador: null };
            peticio.estat = p.response?.status ?? null;
            if (esFugaAProduccio(p.response?.url)) fuites.push(p.response.url);
            r.afegeix(classificaResposta({ url: p.response?.url, estat: p.response?.status, iniciador: peticio.iniciador, tipus: p.type ?? null }, { origen }), s);
            return;
          }
          case 'Network.loadingFinished':
            if (esPagina) { r.enVol.delete(clauPeticio); r.activitat = Date.now(); }
            return;
          case 'Network.loadingFailed': {
            if (esPagina) { r.enVol.delete(clauPeticio); r.activitat = Date.now(); }
            const peticio = r.peticions.get(clauPeticio) ?? {};
            // Un mitjà que el navegador talla després d'una resposta bona (preload=metadata) no és cap fallada.
            if (peticio.estat && peticio.estat < 400 && /ERR_ABORTED/.test(p.errorText ?? '')) return;
            const error = [p.errorText, p.blockedReason ? `(bloquejada: ${p.blockedReason})` : ''].filter(Boolean).join(' ');
            r.afegeix(classificaFallada({ url: peticio.url, error, cancelada: p.canceled === true, iniciador: peticio.iniciador, tipus: p.type ?? null },
              { origen, backend }), s);
            return;
          }
          case 'Page.frameNavigated':
            if (esPagina && !p.frame?.parentId && /^https?:/.test(p.frame?.url ?? '')) r.navegacions += 1;
            return;
          case 'Page.javascriptDialogOpening':
            r.afegeix({ categoria: 'dialeg', nivell: 'info', text: `${p.type}: ${p.message}`, falla: false, observacio: true }, s);
            cdp.send('Page.handleJavaScriptDialog', { accept: false }, m.sessionId).catch(() => null);
            return;
          default: {
            let t = classificaEsdeveniment(m, { estricte });
            if (t?.categoria === 'log:network' && t.peticio) {
              const url = r.peticions.get(`${m.sessionId}|${t.peticio}`)?.url ?? t.url;
              t = reclassificaLogDeXarxa(t, url, { origen, backend });
            } else if (t?.categoria === 'log:network' && t.url) {
              t = reclassificaLogDeXarxa(t, t.url, { origen, backend });
            }
            if (t) { delete t.peticio; r.afegeix(t, s); }
          }
        }
      }
    };
    return r;
  };

  const avalua = async (sessionId, expressio) => {
    const r = await cdp.send('Runtime.evaluate', { expression: expressio, returnByValue: true, awaitPromise: true }, sessionId, 15000);
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result?.value;
  };

  const esperaQuietud = async (r, { quiet = 1000, maxim }) => {
    const fi = Date.now() + maxim;
    while (Date.now() < fi) {
      if (r.enVol.size === 0 && Date.now() - r.activitat >= quiet) return true;
      await espera(100);
    }
    return false;
  };

  /** Un context nou amb una pestanya en blanc, preparada i escoltada. */
  const obriContext = async () => {
    const { browserContextId } = await cdp.send('Target.createBrowserContext', { disposeOnDetach: true });
    const r = nouRecollidor();
    recollidors.set(browserContextId, r);
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank', browserContextId });
    for (let i = 0; i < 100 && !perTarget.has(targetId); i += 1) await espera(50);
    const sessio = perTarget.get(targetId);
    if (!sessio) throw new ErrorInfra('la pestanya nova no s’ha adjuntat');
    await sessio.preparat;
    return { browserContextId, sessionId: sessio.sessionId, r };
  };

  const tancaContext = async (browserContextId) => {
    recollidors.delete(browserContextId);
    await cdp.send('Target.disposeBrowserContext', { browserContextId }).catch(() => null);
  };

  /** Navega i espera: document complet del nostre origen, xarxa quieta, #root amb fills, desplaçament fins al final. */
  const carrega = async ({ sessionId, r }, url, { maxim }) => {
    const inici = Date.now();
    const nav = await cdp.send('Page.navigate', { url }, sessionId);
    if (nav.errorText) r.afegeix({ categoria: 'navegacio', nivell: 'error', text: `${nav.errorText} ${url}`, falla: true });
    for (let i = 0; i < 150; i += 1) {
      const llest = await avalua(sessionId, `document.readyState === 'complete' && location.origin === ${JSON.stringify(origen)}`).catch(() => false);
      if (llest) break;
      await espera(100);
    }
    await esperaQuietud(r, { maxim: Math.max(1000, maxim - (Date.now() - inici)) });
    let estat = null;
    for (let i = 0; i < 50; i += 1) {
      estat = await avalua(sessionId, `(() => { const a = document.querySelector('#root'); return { fills: a ? a.childElementCount : -1, url: location.pathname + location.search, titol: document.title }; })()`).catch(() => null);
      if (estat?.fills > 0) break;
      await espera(100);
    }
    if (!(estat?.fills > 0)) r.afegeix({ categoria: 'pantalla-buida', nivell: 'error', text: `#root sense fills a ${url}`, falla: true });
    await avalua(sessionId, 'window.scrollTo(0, document.documentElement.scrollHeight)').catch(() => null);
    await espera(1000);
    await esperaQuietud(r, { maxim: 5000 });
    return estat;
  };

  const reserva = async (sessionId) => (await avalua(sessionId, 'window.__sdpConsolaZero || []').catch(() => [])) ?? [];

  /* Navegació interna com la del router: pushState + popstate, en el mateix document. */
  const navegaInterna = async ({ sessionId, r }, ruta, { maxim = 8000 } = {}) => {
    await avalua(sessionId, `(() => { history.pushState({}, '', ${JSON.stringify(ruta)}); dispatchEvent(new PopStateEvent('popstate', { state: {} })); return true; })()`)
      .catch((error) => r.afegeix({ categoria: 'navegacio', nivell: 'error', text: `pushState ${ruta}: ${error.message}`, falla: true }));
    await espera(300);
    await esperaQuietud(r, { maxim });
  };

  return { obriContext, tancaContext, carrega, navegaInterna, reserva, avalua, fuites };
}

/* ───────────── 4 · Escenaris ───────────── */

async function escenariRutes(nav, { origen, rutes, tempsRuta }) {
  const resultats = [];
  for (const ruta of rutes) {
    const inici = Date.now();
    const ctx = await nav.obriContext();
    try {
      const estat = await nav.carrega(ctx, `${origen}${ruta}`, { maxim: tempsRuta });
      const reserva = await nav.reserva(ctx.sessionId);
      resultats.push({
        ruta, final: estat?.url ?? null, titol: estat?.titol ?? null, ms: Date.now() - inici, peticions: ctx.r.peticions.size,
        recarregues: Math.max(0, ctx.r.navegacions - 1), troballes: ctx.r.troballes, observacions: ctx.r.observacions, reserva
      });
      process.stderr.write(`${PREFIX} ${ruta}: ${ctx.r.troballes.length} troballes, ${ctx.r.observacions.length} observacions (${Date.now() - inici} ms)\n`);
    } finally {
      await nav.tancaContext(ctx.browserContextId);
    }
  }
  return resultats;
}

async function escenariInterna(nav, { origen, rutes, tempsRuta }) {
  const ctx = await nav.obriContext();
  const resultats = [];
  try {
    await nav.carrega(ctx, `${origen}/`, { maxim: tempsRuta });
    let vist = ctx.r.troballes.length;
    let vistes = ctx.r.observacions.length;
    resultats.push({ ruta: '/', troballes: ctx.r.troballes.slice(0, vist), observacions: ctx.r.observacions.slice(0, vistes) });
    for (const ruta of rutes) {
      await nav.navegaInterna(ctx, ruta);
      resultats.push({ ruta, troballes: ctx.r.troballes.slice(vist), observacions: ctx.r.observacions.slice(vistes), recarregues: Math.max(0, ctx.r.navegacions - 1) });
      vist = ctx.r.troballes.length;
      vistes = ctx.r.observacions.length;
    }
  } finally {
    await nav.tancaContext(ctx.browserContextId);
  }
  return resultats;
}

/* Una passada del desfasament: s'obri l'inici amb el build antic i, amb la pestanya oberta, el servidor canvia. */
async function passadaSkew(nav, servidor, { origen, antic, nou, etiqueta, skew, tempsRuta }) {
  servidor.canvia(antic, 'antic');
  const ctx = await nav.obriContext();
  try {
    await nav.carrega(ctx, `${origen}${skew.inici}`, { maxim: tempsRuta });
    const abans = ctx.r.troballes.length;
    const marca = servidor.registre.length;
    servidor.canvia(nou, etiqueta);
    for (const ruta of skew.navegacions) await nav.navegaInterna(ctx, ruta, { maxim: 10000 });
    await espera(1000);
    const despres = ctx.r.troballes.slice(abans);
    const trossos = despres.filter(esTrobadaDeTros);
    const modulepreload404 = despres.filter((t) => t.categoria === 'xarxa' && t.estat === 404 && t.iniciador === 'modulepreload');
    const servidor404 = servidor.registre.slice(marca).filter((p) => p.estat === 404 && p.cami.startsWith('/assets/'));
    return {
      etiqueta,
      trossosPerduts: trossos.length,
      modulepreload404: modulepreload404.length,
      servidor404Assets: [...new Set(servidor404.map((p) => p.cami))].length,
      recarregues: Math.max(0, ctx.r.navegacions - 1),
      produccioBloquejada: [...ctx.r.troballes, ...ctx.r.observacions].filter((t) => t.categoria === 'fuga').length,
      troballesDeTros: trossos.slice(0, 40),
      altres: despres.filter((t) => !esTrobadaDeTros(t) && t.categoria !== 'fuga').slice(0, 40),
      abansDelCanvi: ctx.r.troballes.slice(0, abans).filter((t) => t.categoria !== 'fuga').slice(0, 20)
    };
  } finally {
    await nav.tancaContext(ctx.browserContextId);
  }
}

async function escenariSkew(nav, servidor, { origen, arrel, antic, anticCreat, nou, skew, tempsRuta }) {
  // L'arxiu de la prova viu dins del mkdtemp de l'arnés: és l'únic lloc explícit que l'arnés té.
  const arxiu = path.join(arrel, 'arxiu-retencio');
  fs.mkdirSync(arxiu, { recursive: true });
  const ret = path.join(arrel, 'dist-amb-retencio');
  const htmlAntic = fs.readFileSync(path.join(antic, 'index.html'), 'utf8');
  const arxivatAntic = arxiva({ dist: antic, arxiu, creat: anticCreat });
  const arxivatNou = arxiva({ dist: nou, arxiu, creat: new Date() });
  const clon = process.platform === 'darwin' ? spawnSync('cp', ['-cR', nou, ret]) : { status: 1 };
  if (clon.status !== 0) fs.cpSync(nou, ret, { recursive: true });
  const rebut = incorpora({ dist: ret, arxiu });
  const clausuraSense = comprovaClausura({ dist: nou, html: htmlAntic });
  const clausuraAmb = comprovaClausura({ dist: ret, html: htmlAntic });
  const control = await passadaSkew(nav, servidor, { origen, antic, nou, etiqueta: 'nou-sense-retencio', skew, tempsRuta });
  const retencio = await passadaSkew(nav, servidor, { origen, antic, nou: ret, etiqueta: 'nou-amb-retencio', skew, tempsRuta });
  const controlFalla = control.modulepreload404 > 0 || control.servidor404Assets > 0;
  const veredicte = !controlFalla ? 'control-no-falla' : retencio.trossosPerduts === 0 && retencio.servidor404Assets === 0 ? 'verd' : 'roig';
  return {
    veredicte,
    antic: { dist: antic, entrada: arxivatAntic.manifest.entrada, fitxers: arxivatAntic.manifest.fitxers.length, creat: arxivatAntic.manifest.creat },
    nou: { entrada: arxivatNou.manifest.entrada, fitxers: arxivatNou.manifest.fitxers.length },
    retencio: { retinguts: rebut.retinguts.map((x) => x.entrada), exclosos: rebut.exclosos, copiats: rebut.copiats, bytes: rebut.bytes },
    clausuraDelBuildAntic: {
      senseRetencio: { presents: clausuraSense.abastables, absents: clausuraSense.falten.length, exemples: clausuraSense.falten.slice(0, 10).map((f) => f.nom) },
      ambRetencio: { presents: clausuraAmb.abastables, absents: clausuraAmb.falten.length, exemples: clausuraAmb.falten.slice(0, 10).map((f) => f.nom) }
    },
    control,
    ambRetencio: retencio
  };
}

/* ───────────── 5 · L'ordre ───────────── */

export async function main(argv = process.argv.slice(2)) {
  let opcions;
  try {
    opcions = analitza(argv);
  } catch (error) {
    process.stderr.write(`${PREFIX} ${error.message}\n`);
    return 2;
  }
  const arrel = fs.mkdtempSync(path.join(opcions.scratch, 'consola-zero-'));
  const informe = { schema: ESQUEMA_INFORME, creat: new Date().toISOString(), arrel, escenaris: {}, troballesGlobals: [] };
  const hosting = JSON.parse(fs.readFileSync(path.join(ARREL, 'firebase.json'), 'utf8')).hosting;
  const rutesJson = JSON.parse(fs.readFileSync(path.join(ARREL, 'tooling/gates/consola-zero.rutes.json'), 'utf8'));
  const rutes = opcions.rutes ? opcions.rutes.split(',').map((r) => r.trim()).filter(Boolean) : [...rutesJson.rutes, ...rutesJson.notFound];
  const servidor = creaServidor(hosting);
  let chrome = null;
  let cdp = null;
  try {
    const backendOrigen = BACKEND_MORT;
    informe.backend = { origen: backendOrigen, respon: [] };
    const dist = opcions.dist ?? path.join(arrel, 'dist');
    if (!opcions.dist) informe.build = { dist, ...construeix({ arrel, outDir: dist, backend: backendOrigen }) };
    else informe.build = { dist, reutilitzat: true };
    const textSw = fs.readFileSync(path.join(ARREL, 'public/sw.js'), 'utf8');
    informe.build.pressupostSw = pressupostDelSw(dist, textSw);
    if (!informe.build.pressupostSw.dinsDeLaMeitat) {
      informe.troballesGlobals.push({ categoria: 'pressupost-sw', nivell: 'error', falla: true,
        text: `el build (${informe.build.pressupostSw.trossos} trossos, ${informe.build.pressupostSw.bytes} B) passa de la meitat dels sostres de public/sw.js` });
    }
    servidor.canvia(dist, 'nou');
    const origen = await servidor.escolta();
    informe.origen = origen;
    chrome = await arrencaChrome({ chrome: opcions.chrome, tmp: opcions.chromeTmp ?? arrel });
    // Un arnés interromput (Ctrl-C, kill) no deixa cap Chrome orfe ni el seu perfil.
    const aturaChrome = (senyal) => {
      try { chrome.proces.kill('SIGKILL'); } catch { /* ja aturat */ }
      fs.rmSync(chrome.dir, { recursive: true, force: true });
      process.exit(senyal === 'SIGINT' ? 130 : 143);
    };
    for (const senyal of ['SIGINT', 'SIGTERM']) process.once(senyal, aturaChrome);
    cdp = await connectaCdp(chrome.ws);
    informe.navegador = (await cdp.send('Browser.getVersion')).product;
    await cdp.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true });
    const nav = creaNavegador({ cdp, origen, backend: backendOrigen, estricte: opcions.estricte, exempcions: rutesJson.exempcions ?? [] });
    if (opcions.escenaris.includes('rutes')) informe.escenaris.rutes = await escenariRutes(nav, { origen, rutes, tempsRuta: opcions.tempsRuta });
    if (opcions.escenaris.includes('interna')) informe.escenaris.interna = await escenariInterna(nav, { origen, rutes: rutes.filter((r) => r !== '/'), tempsRuta: opcions.tempsRuta });
    if (opcions.escenaris.includes('skew')) {
      const anticCreat = opcions['antic-creat'] ? new Date(opcions['antic-creat']) : fs.statSync(path.join(opcions.antic, 'index.html')).mtime;
      informe.escenaris.skew = await escenariSkew(nav, servidor, { origen, arrel, antic: opcions.antic, anticCreat, nou: dist, skew: rutesJson.skew, tempsRuta: opcions.tempsRuta });
    }
    if (nav.fuites.length) informe.infraestructura = `FUGA: ${nav.fuites.length} respostes de Supabase han arribat al navegador (${nav.fuites[0]})`;
    informe.servidor = { peticions: servidor.registre.length, perEstat: servidor.registre.reduce((a, p) => ({ ...a, [p.estat]: (a[p.estat] ?? 0) + 1 }), {}) };
  } catch (error) {
    informe.infraestructura = error instanceof ErrorInfra || error instanceof ErrorDUs ? error.message : (error?.stack ?? String(error));
  } finally {
    cdp?.tanca();
    if (chrome) {
      chrome.proces.kill('SIGTERM');
      await Promise.race([new Promise((ok) => chrome.proces.once('exit', ok)), espera(5000, undefined, { ref: false })]);
      if (chrome.proces.exitCode === null && chrome.proces.signalCode === null) chrome.proces.kill('SIGKILL');
      fs.rmSync(chrome.dir, { recursive: true, force: true });
    }
    await servidor.tanca();
  }
  informe.resum = resumeix(informe);
  informe.codi = codiDEixida(informe);
  const text = `${JSON.stringify(informe, null, 2)}\n`;
  fs.writeFileSync(path.join(arrel, 'informe.json'), text);
  if (opcions.informe) fs.writeFileSync(opcions.informe, text);
  process.stdout.write(`${PREFIX} ${informe.resum.text}\n${PREFIX} Informe: ${opcions.informe ?? path.join(arrel, 'informe.json')}\n`);
  if (informe.infraestructura) process.stderr.write(`${PREFIX} INFRAESTRUCTURA: ${informe.infraestructura}\n`);
  return informe.codi;
}

// Com a ordre (també per un enllaç), no quan una prova la importa (la forma de la Porta Arrel, A4).
if (process.argv[1] && fs.existsSync(process.argv[1])
  && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  main().then((codi) => { process.exitCode = codi; });
}
