/* Onada R24 · Consola Zero (P-G de l'informe 261114 «consola_404_chunks») ·
 * El nucli pur de l'arnés (tooling/gates/consola-zero.mjs): cap xarxa, cap
 * navegador i cap fitxer escrit. Quatre parts:
 *   1. Firebase Hosting en local: els globs de minimatch (el motor de
 *      superstatic, path.posix.matchesGlob amb el «!» invertit ací) i les
 *      regex de firebase.json, les capçaleres efectives d'un camí (totes les
 *      regles que hi casen; per a la mateixa clau, l'última, com diu
 *      src/config/firebaseHosting.test.js) i què servix Hosting per a un camí
 *      (fitxer, index.html d'una carpeta, reescriptura o 404 de veritat).
 *   2. La classificació dels esdeveniments CDP: consola (error, warning,
 *      assert), excepcions no capturades i rebutjos sense amo, entrades del
 *      Log (xarxa, CSP, intervencions, obsolescències) i peticions del mateix
 *      origen que fallen o tornen ≥ 400. L'iniciador «about:client» és un
 *      <link rel=modulepreload> (Chromium, ModulePreloadIfNeeded).
 *   3. Les rutes del router: els <Route path> de src/app/App.jsx (AST de
 *      @babel/parser, ja devDependency) i la comprovació de
 *      consola-zero.rutes.json contra ells.
 *   4. El resum i el codi d'eixida de l'informe. */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from '@babel/parser';

export const ESQUEMA_INFORME = 'sdp.consola-zero.v1';
export const ESQUEMA_RUTES = 'sdp.consola-zero.rutes.v1';

/* ───────────── 1 · Firebase Hosting en local ───────────── */

/** Un glob de firebase.json contra el camí de la petició (minimatch; «!» inicial = negació). */
export function casaGlobHosting(glob, cami) {
  let patro = String(glob);
  let negat = false;
  while (patro.startsWith('!')) { patro = patro.slice(1); negat = !negat; }
  return path.posix.matchesGlob(cami, patro) !== negat;
}

/** Una regla amb `regex` (RE2 a Firebase; ací RegExp amb la bandera u, com superstatic sense RE2) o amb `source`. */
export function casaReglaHosting(regla, cami) {
  if (typeof regla?.regex === 'string') return new RegExp(regla.regex, 'u').test(cami);
  if (typeof regla?.source === 'string') return casaGlobHosting(regla.source, cami);
  return false;
}

/** Les capçaleres que Hosting posa a un camí: { clau en minúscules: { clau, valor, regla } }. */
export function capcaleresEfectives(hosting, cami) {
  const efectives = {};
  (hosting?.headers ?? []).forEach((regla, index) => {
    if (!casaReglaHosting(regla, cami)) return;
    for (const { key, value } of regla.headers ?? []) efectives[String(key).toLowerCase()] = { clau: key, valor: value, regla: index };
  });
  return efectives;
}

/** El destí de la primera reescriptura que casa, o null. */
export function reescripturaDe(hosting, cami) {
  const regla = (hosting?.rewrites ?? []).find((r) => casaReglaHosting(r, cami));
  return regla?.destination ?? null;
}

/**
 * Què servix Hosting per a `cami` (ja descodificat). `tipusDe(rel)` torna
 * 'fitxer', 'carpeta' o null per a un camí relatiu a public. Torna
 * { estat: 200, rel } | { estat: 301, desti } | { estat: 404 } | { estat: 400 }.
 * trailingSlash fals: /x/ → 301 /x; /x servix x/index.html si és una carpeta.
 */
export function resolDeHosting(hosting, cami, tipusDe) {
  if (typeof cami !== 'string' || !cami.startsWith('/') || cami.includes('\0')) return { estat: 400 };
  const normal = path.posix.normalize(cami);
  if (normal !== cami.replace(/\/{2,}/g, '/') || normal.split('/').includes('..')) return { estat: 400 };
  if (hosting?.trailingSlash === false && normal.length > 1 && normal.endsWith('/')) return { estat: 301, desti: normal.replace(/\/+$/, '') };
  const rel = normal.replace(/^\/+/, '');
  if (rel === '' || tipusDe(rel) === 'carpeta') {
    const index = rel === '' ? 'index.html' : `${rel}/index.html`;
    if (tipusDe(index) === 'fitxer') return { estat: 200, rel: index };
  } else if (tipusDe(rel) === 'fitxer') return { estat: 200, rel };
  const desti = reescripturaDe(hosting, normal);
  if (desti) {
    const relDesti = desti.replace(/^\/+/, '');
    if (tipusDe(relDesti) === 'fitxer') return { estat: 200, rel: relDesti, reescrit: true };
  }
  return { estat: 404 };
}

const TIPUS_MIME = Object.freeze({
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.jsonld': 'application/ld+json; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/vnd.microsoft.icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
  '.wasm': 'application/wasm', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.pdf': 'application/pdf', '.sha256': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8'
});

/** El tipus MIME per extensió, com el servix Hosting (les regles de firebase.json el poden sobreescriure). */
export function tipusMime(rel) {
  return TIPUS_MIME[path.posix.extname(String(rel)).toLowerCase()] ?? 'application/octet-stream';
}

/* ───────────── 2 · Classificació dels esdeveniments CDP ───────────── */

/** El text d'una crida de consola, com el pinta DevTools (valors, descripcions o el tipus). */
export function textDeArguments(args = []) {
  return args.map((a) => {
    if (a == null) return '';
    if (a.value !== undefined) return typeof a.value === 'string' ? a.value : JSON.stringify(a.value);
    return a.description ?? a.unserializableValue ?? `[${a.type ?? '?'}]`;
  }).join(' ').trim();
}

const llocDe = (marc) => (marc ? { url: marc.url || null, linia: Number.isInteger(marc.lineNumber) ? marc.lineNumber + 1 : null } : { url: null, linia: null });

/**
 * Un esdeveniment CDP de consola o de registre com a troballa, o null si no
 * en és. `estricte` fa fallar també els missatges informatius del navegador
 * (el «Banner not shown…» de beforeinstallprompt), que sempre s'anoten.
 */
export function classificaEsdeveniment(missatge, { estricte = false } = {}) {
  const { method, params = {} } = missatge ?? {};
  if (method === 'Runtime.consoleAPICalled') {
    if (!['error', 'warning', 'assert'].includes(params.type)) return null;
    return { categoria: 'consola', nivell: params.type === 'warning' ? 'avis' : 'error', text: textDeArguments(params.args), ...llocDe(params.stackTrace?.callFrames?.[0]), falla: true };
  }
  if (method === 'Runtime.exceptionThrown') {
    const d = params.exceptionDetails ?? {};
    const marc = d.stackTrace?.callFrames?.[0];
    const text = [d.text, d.exception?.description].filter(Boolean).join(' ').trim() || 'excepció sense text';
    return {
      categoria: 'excepcio', nivell: 'error', text,
      url: d.url || marc?.url || null, linia: Number.isInteger(d.lineNumber) ? d.lineNumber + 1 : llocDe(marc).linia, falla: true
    };
  }
  if (method === 'Log.entryAdded') {
    const e = params.entry ?? {};
    const base = { categoria: `log:${e.source ?? 'other'}`, text: e.text ?? '', url: e.url || null, linia: Number.isInteger(e.lineNumber) ? e.lineNumber + 1 : null };
    if (e.level === 'error' || e.level === 'warning') return { ...base, nivell: e.level === 'warning' ? 'avis' : 'error', falla: true, peticio: e.networkRequestId ?? null };
    if (e.level === 'info') return { ...base, nivell: 'info', falla: estricte === true, observacio: true };
    return null;
  }
  return null;
}

/** «about:client» és l'empremta d'un <link rel=modulepreload> (preload_helper.cc); la resta, el tipus de CDP. */
export function categoriaDIniciador(iniciador) {
  if (!iniciador) return 'desconegut';
  if (iniciador.url === 'about:client' || iniciador.stack?.callFrames?.[0]?.url === 'about:client') return 'modulepreload';
  return iniciador.type || 'desconegut';
}

const origenDe = (url) => { try { return new URL(url).origin; } catch { return null; } };
const camiDe = (url) => { try { const u = new URL(url); return `${u.pathname}${u.search}`; } catch { return String(url); } };

export const esMateixOrigen = (url, origen) => origenDe(url) === origen;

/** Un servidor de Supabase (producció o qualsevol projecte): mai no s'hi ha d'arribar. */
export function esFugaAProduccio(url) {
  try { return /(^|\.)supabase\.(co|in)$/i.test(new URL(url).hostname); } catch { return false; }
}

/** El que el navegador pot carregar sense eixir de la màquina ni del build servit. */
export function esPeticioPermesa(url, origen) {
  if (/^(data|blob|about|chrome|chrome-extension|devtools):/i.test(String(url))) return true;
  return esMateixOrigen(url, origen);
}

/** Una resposta HTTP com a troballa (mateix origen i estat ≥ 400), o null. */
export function classificaResposta({ url, estat, iniciador, tipus = null }, { origen }) {
  if (!esMateixOrigen(url, origen) || !(Number(estat) >= 400)) return null;
  return { categoria: 'xarxa', nivell: 'error', text: `${estat} ${camiDe(url)}`, url, iniciador: categoriaDIniciador(iniciador), tipus, estat: Number(estat), falla: true };
}

/**
 * Una petició que no ha acabat com a troballa, o null (una cancel·lació de la
 * pròpia navegació no ho és). `backend` és l'origen sintètic del build; una
 * petició a Supabase és una fuga, i la resta de fora, una petició externa.
 */
export function classificaFallada({ url, error = '', cancelada = false, iniciador, tipus = null }, { origen, backend = null }) {
  if (cancelada) return null;
  const base = { nivell: 'error', url, iniciador: categoriaDIniciador(iniciador), tipus, falla: true };
  if (esFugaAProduccio(url)) return { ...base, categoria: 'fuga', text: `petició a Supabase bloquejada (${origenDe(url)}): ${error}`.trim() };
  if (backend && origenDe(url) === backend) return { ...base, categoria: 'backend-sintetic', text: `${error} ${camiDe(url)}`.trim() };
  if (!esMateixOrigen(url, origen)) {
    if (esPeticioPermesa(url, origen)) return null;
    // Una de fora: l'arnés la talla (és sense xarxa), però en producció arribaria. S'anota, no falla.
    return { ...base, categoria: 'externa', text: `${error} ${url}`.trim(), falla: false, observacio: true };
  }
  return { ...base, categoria: 'xarxa', text: `${error} ${camiDe(url)}`.trim() };
}

/**
 * El «Failed to load resource» del Log és de la petició `url`: el del mateix
 * origen continua fallant; el de Supabase és una fuga; el del backend
 * sintètic, una crida de la llavor al backend; el de fora, una observació.
 */
export function reclassificaLogDeXarxa(troballa, url, { origen, backend = null }) {
  if (!troballa || troballa.categoria !== 'log:network' || !url || esMateixOrigen(url, origen)) return troballa;
  if (esFugaAProduccio(url)) return { ...troballa, categoria: 'fuga', url };
  if (backend && origenDe(url) === backend) return { ...troballa, categoria: 'backend-sintetic', url };
  if (esPeticioPermesa(url, origen)) return troballa;
  return { ...troballa, categoria: 'externa', url, falla: false, observacio: true };
}

/**
 * Les excepcions documentades de consola-zero.rutes.json: una troballa de la
 * categoria `categoria` sobre el camí `cami` (de qualsevol origen) deixa de
 * fallar i s'anota amb el motiu. Res més: ni comodins ni text lliure.
 */
export function aplicaExempcions(troballa, exempcions = []) {
  if (!troballa?.falla || !troballa.url) return troballa;
  let cami;
  try { cami = new URL(troballa.url).pathname; } catch { return troballa; }
  const e = exempcions.find((x) => x.categoria === troballa.categoria && x.cami === cami);
  return e ? { ...troballa, falla: false, observacio: true, exempcio: e.motiu } : troballa;
}

/* Els missatges de càrrega de trossos dels tres motors i de l'ajudant de Vite. */
const ERROR_DE_TROS = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|vite:preloadError|ChunkLoadError|Expected a JavaScript-or-Wasm module script|MIME type of "text\/html"/i;

/** Una troballa que diu que un tros no s'ha pogut carregar (404, MIME o import() rebutjat). */
export function esTrobadaDeTros(troballa) {
  if (!troballa) return false;
  if (troballa.categoria === 'xarxa') return /\/assets\/[^/?#]+\.(?:m?js|css)\b/.test(troballa.text) || troballa.iniciador === 'modulepreload';
  return ERROR_DE_TROS.test(troballa.text ?? '');
}

/* ───────────── 3 · Les rutes del router ───────────── */

function camina(node, visita) {
  if (!node || typeof node.type !== 'string') return;
  visita(node);
  for (const clau of Object.keys(node)) {
    const valor = node[clau];
    if (Array.isArray(valor)) valor.forEach((fill) => camina(fill, visita));
    else if (valor && typeof valor.type === 'string') camina(valor, visita);
  }
}

/**
 * Els <Route path> de src/app/App.jsx, absoluts ('xat' → '/xat', '*' → '/*'),
 * únics i ordenats, i el text de cada path que és una expressió.
 */
export function rutesDeLApp(text) {
  const ast = parse(String(text), { sourceType: 'module', plugins: ['jsx'] });
  const patrons = new Set();
  const expressions = [];
  camina(ast, (n) => {
    if (n.type !== 'JSXOpeningElement' || n.name?.type !== 'JSXIdentifier' || n.name.name !== 'Route') return;
    const atribut = n.attributes.find((a) => a.type === 'JSXAttribute' && a.name?.name === 'path');
    if (!atribut) return;
    const valor = atribut.value;
    const literal = valor?.type === 'StringLiteral' ? valor.value
      : valor?.type === 'JSXExpressionContainer' && valor.expression.type === 'StringLiteral' ? valor.expression.value : null;
    if (literal !== null) patrons.add(literal.startsWith('/') ? literal : `/${literal}`);
    else if (valor?.type === 'JSXExpressionContainer') expressions.push(String(text).slice(valor.expression.start, valor.expression.end));
  });
  return { patrons: [...patrons].sort(), expressions };
}

/** Un patró de React Router (segments, «:param» i «*» final) contra una ruta. */
export function casaPatroDeRuta(patro, ruta) {
  const p = patro.split('/').filter(Boolean);
  const r = String(ruta).split(/[?#]/)[0].split('/').filter(Boolean);
  for (let i = 0; i < p.length; i += 1) {
    if (p[i] === '*') return true;
    if (i >= r.length) return false;
    if (p[i].startsWith(':')) continue;
    let segment;
    try { segment = decodeURIComponent(r[i]); } catch { return false; }
    if (p[i] !== segment) return false;
  }
  return p.length === r.length;
}

/* El comodí de l'arrel només delega a ActorRoutes, i el seu «*» és NotFoundPage: cap dels dos no és una ruta. */
const COMODINS = new Set(['/*']);

/**
 * consola-zero.rutes.json contra el router: cada ruta canònica casa amb un
 * patró que no és el comodí (o és d'una expressió declarada), i cada patró
 * sense paràmetres del router té una ruta o un motiu d'exclusió.
 */
export function comprovaRutes({ rutes, router, exclosos = {}, perExpressio = {} }) {
  const especifics = router.filter((p) => !COMODINS.has(p));
  const senseRouter = rutes.filter((r) => !(r in perExpressio) && !especifics.some((p) => casaPatroDeRuta(p, r)));
  const estatics = especifics.filter((p) => !p.includes(':')).map((p) => p.replace(/\/\*$/, '') || '/');
  const senseCobrir = [...new Set(estatics)].filter((p) => !(p in exclosos) && !rutes.some((r) => r.split(/[?#]/)[0] === p));
  const exclusionsMortes = Object.keys(exclosos).filter((p) => !estatics.includes(p));
  return { senseRouter, senseCobrir, exclusionsMortes };
}

/* ───────────── 4 · Resum i codi d'eixida ───────────── */

/** Totes les troballes que fallen d'un informe, amb l'escenari i la ruta. */
export function trobadesQueFallen(informe) {
  const totes = [];
  for (const r of informe?.escenaris?.rutes ?? []) for (const t of r.troballes ?? []) if (t.falla) totes.push({ escenari: 'rutes', ruta: r.ruta, ...t });
  for (const r of informe?.escenaris?.interna ?? []) for (const t of r.troballes ?? []) if (t.falla) totes.push({ escenari: 'interna', ruta: r.ruta, ...t });
  for (const t of informe?.troballesGlobals ?? []) if (t.falla) totes.push({ escenari: 'global', ...t });
  return totes;
}

/** El resum: quantes rutes, quantes troballes per categoria i si és verd. */
export function resumeix(informe) {
  const falles = trobadesQueFallen(informe);
  const perCategoria = {};
  for (const t of falles) perCategoria[t.categoria] = (perCategoria[t.categoria] ?? 0) + 1;
  const rutesAmbFalles = new Set(falles.filter((t) => t.ruta).map((t) => t.ruta));
  const skew = informe?.escenaris?.skew;
  const skewVerd = !skew || skew.veredicte === 'verd';
  /* R24 · Gauntlet (G-client-9) · Una porta que no ha mirat res no certifica
     res: verd exigix almenys una ruta visitada (rutes o interna) o el
     desfasament executat. */
  const visitades = (informe?.escenaris?.rutes ?? []).length + (informe?.escenaris?.interna ?? []).length;
  const mirat = visitades > 0 || Boolean(skew);
  const verd = falles.length === 0 && skewVerd && !informe?.infraestructura && mirat;
  return {
    rutes: (informe?.escenaris?.rutes ?? []).length,
    troballes: falles.length,
    rutesAmbFalles: rutesAmbFalles.size,
    perCategoria,
    skew: skew ? skew.veredicte : 'no-executat',
    visitades,
    verd,
    text: !mirat && falles.length === 0 && !informe?.infraestructura
      ? 'Consola Zero: no verd, cap ruta visitada ni desfasament executat.'
      : verd
      ? `Consola Zero: verd (${(informe?.escenaris?.rutes ?? []).length} rutes, 0 troballes${skew ? `, desfasament ${skew.veredicte}` : ''}).`
      : `Consola Zero: ${falles.length} troballes en ${rutesAmbFalles.size} rutes (${Object.entries(perCategoria).map(([c, n]) => `${c} ${n}`).join(', ') || 'cap'})${skew ? `; desfasament ${skew.veredicte}` : ''}.`
  };
}

/** 0 consola neta; 1 troballes; 2 ús o infraestructura (també un control de desfasament que no falla, i un informe que no ha mirat res). */
export function codiDEixida(informe) {
  if (informe?.infraestructura || informe?.escenaris?.skew?.veredicte === 'control-no-falla') return 2;
  const resum = resumeix(informe);
  if (!resum.verd && resum.troballes === 0 && resum.visitades === 0 && resum.skew === 'no-executat') return 2;
  return resumeix(informe).verd ? 0 : 1;
}

/* Onada R24.2 · Porta Arrel A4 · Este fitxer és el nucli pur que importa
   tooling/gates/consola-zero.mjs (i les seues proves), no una porta: executat
   directament no certifica res, ho diu i ix amb codi 2. */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.error('consola-zero-nucli.mjs és el nucli de la porta, no la porta: executa `npm run porta:consola-zero`.');
  process.exitCode = 2;
}
