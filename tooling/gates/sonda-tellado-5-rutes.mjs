#!/usr/bin/env node
/**
 * sonda-tellado-5-rutes.mjs — Sonda HTTP determinista de 5 rutes segons
 * Fernando Tellado (`IDEA-263` + `IDEA-266` · Onada R25.2).
 *
 * REGLA D'OR:
 *   · SEMPRE executa peticions `GET` anònimes sense cookies (MAI `HEAD` a soles,
 *     ja que cachés, CDNs i plantilles PHP sovint responen 200 a HEAD mentre
 *     trenquen en renderitzar el cos real del GET).
 *   · Verifica les 5 rutes canòniques:
 *       1) `/`
 *       2) `/sonda-404-inexistent-<nonce>/`
 *       3) `/feed/`
 *       4) `/wp-sitemap.xml` (amb caiguda neta a `/sitemap.xml` si l'amfitrió és estàtic)
 *       5) `/robots.txt` (ha de respondre 200 OK FINS I TOT durant un manteniment 503!)
 *
 * LÍMITS (Onada R26 · invariants IDEA-263 de l'auditoria Codex R25.2):
 *   · Temps acotat per ruta (salts i cos inclosos) i cos llegit en streaming fins
 *     a `maxBytes`; l'excés es cancel·la, mai es descarrega sencer.
 *   · Els salts 3xx es seguixen a mà (màxim `maxSalts`, només http/https) amb
 *     historial; s'avalua la resposta final. El cos d'un salt es cancel·la.
 *   · `Retry-After` vàlid: segons enters (>= 60) o una data HTTP futura.
 */
import crypto from 'node:crypto';
import http from 'node:http';
import { esMain } from '../lib/arrel.mjs';

export const MAX_BYTES_RESPOSTA = 1024 * 1024;
export const MAX_SALTS = 5;
const MINIM_RETRY_AFTER_SEGONS = 60;

const RE_DATA_HTTP = [
  /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/,
  /^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), \d{2}-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2} \d{2}:\d{2}:\d{2} GMT$/,
  /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun) (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) [ \d]\d \d{2}:\d{2}:\d{2} \d{4}$/,
];

/** `Retry-After` (RFC 9110 §10.2.3): delta-seconds o HTTP-date, com a mínim `minimSegons` en el futur. */
export function retryAfterValid(valor, { ara = Date.now(), minimSegons = MINIM_RETRY_AFTER_SEGONS } = {}) {
  const v = String(valor ?? '').trim();
  if (/^\d{1,10}$/.test(v)) return Number(v) >= minimSegons;
  if (!RE_DATA_HTTP.some((re) => re.test(v))) return false;
  const t = Date.parse(v);
  return Number.isFinite(t) && t - ara >= minimSegons * 1000;
}

async function llegeixCosAcotat(res, maxBytes, signal) {
  if (!res.body) return { buf: Buffer.alloc(0), truncat: false };
  const lector = res.body.getReader();
  const trossos = [];
  let bytes = 0;
  let truncat = false;
  try {
    for (;;) {
      if (signal.aborted) throw new Error('temps exhaurit');
      const { done, value } = await lector.read();
      if (done) break;
      const resta = maxBytes - bytes;
      if (value.byteLength > resta) {
        if (resta > 0) trossos.push(Buffer.from(value.buffer, value.byteOffset, resta));
        bytes += Math.max(0, resta);
        truncat = true;
        break;
      }
      trossos.push(Buffer.from(value.buffer, value.byteOffset, value.byteLength));
      bytes += value.byteLength;
    }
  } finally {
    if (truncat) await lector.cancel().catch(() => {});
    else lector.releaseLock();
  }
  return { buf: Buffer.concat(trossos, bytes), truncat };
}

async function getAnonim(urlCompleta, { timeoutMs = 4000, maxBytes = MAX_BYTES_RESPOSTA, maxSalts = MAX_SALTS } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const salts = [];
  let url = urlCompleta;
  try {
    for (;;) {
      const res = await fetch(url, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'SocDePoble-SondaTellado/1.1 (+https://socdepoble.org)',
        },
        signal: ctrl.signal,
      });
      const location = res.headers.get('location');
      if (res.status >= 300 && res.status < 400 && location) {
        await res.body?.cancel().catch(() => {});
        salts.push({ status: res.status, location });
        let seguent;
        try { seguent = new URL(location, url); } catch { return { status: res.status, salts, error: `Location invàlida en el salt ${salts.length}: ${location.slice(0, 120)}` }; }
        if (seguent.protocol !== 'http:' && seguent.protocol !== 'https:') {
          return { status: res.status, salts, error: `salt a un esquema no HTTP (${seguent.protocol}); no es seguix` };
        }
        if (salts.length > maxSalts) return { status: res.status, salts, error: `més de ${maxSalts} salts de redirecció` };
        url = seguent.href;
        continue;
      }
      const { buf, truncat } = await llegeixCosAcotat(res, maxBytes, ctrl.signal);
      return {
        status: res.status,
        headers: Object.fromEntries([...res.headers.entries()].map(([k, v]) => [k.toLowerCase(), v])),
        bytes: buf.length,
        truncat,
        text: buf.subarray(0, 65536).toString('utf8'),
        salts,
        urlFinal: url,
      };
    }
  } catch (err) {
    return { status: 0, salts, error: ctrl.signal.aborted ? `temps exhaurit (${timeoutMs} ms)` : `error de xarxa: ${err?.cause?.code || err?.message || err}` };
  } finally {
    clearTimeout(timer);
  }
}

/** Directives de Cache-Control com a conjunt de noms (sense valors), en minúscules. */
export function directivesCacheControl(valor) {
  return new Set(String(valor || '').toLowerCase().split(',').map((d) => d.split('=')[0].trim()).filter(Boolean));
}

/**
 * Executa la sonda completa de 5 rutes amb GET anònim.
 */
export async function executaSondaTellado5Rutes(baseUrl, opcions = {}) {
  const base = String(baseUrl || '').replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(base)) {
    throw new TypeError(`URL base invàlida per a la sonda: ${baseUrl}`);
  }

  const esperaManteniment = Boolean(opcions.esperaManteniment);
  const nonce = opcions.nonce || crypto.randomBytes(6).toString('hex');
  const limits = {
    timeoutMs: Number(opcions.timeoutMs) > 0 ? Number(opcions.timeoutMs) : 4000,
    maxBytes: Number(opcions.maxBytes) > 0 ? Number(opcions.maxBytes) : MAX_BYTES_RESPOSTA,
    maxSalts: Number.isInteger(opcions.maxSalts) && opcions.maxSalts >= 0 ? opcions.maxSalts : MAX_SALTS,
  };

  const resultats = [];
  const errors = [];
  const resultat = (ruta, resp) => ({
    ruta,
    status: resp.status,
    bytes: resp.bytes ?? 0,
    truncat: Boolean(resp.truncat),
    salts: resp.salts || [],
    ...(resp.urlFinal ? { urlFinal: resp.urlFinal } : {}),
  });
  /** Una ruta que no ha arribat a una resposta final no s'avalua com si haguera respost. */
  const fallada = (nom, ruta, resp) => {
    if (!resp.error) return false;
    errors.push(`${nom} (${ruta}): ${resp.error}`);
    return true;
  };

  const avaluaManteniment503 = (nom, ruta, resp) => {
    const cruRetry = resp.headers['retry-after'] || '';
    const cacheCtrl = String(resp.headers['cache-control'] || '').toLowerCase();
    const ok503 = resp.status === 503;
    const okRetry = retryAfterValid(cruRetry);
    // VIG-07 i IDEA-263: no-store (el que envia nocache_headers() de WordPress); «no-cache» sol
    // permet desar la pàgina de manteniment i servir-la revalidada després.
    const okNoStore = directivesCacheControl(cacheCtrl).has('no-store');
    if (!ok503 || !okRetry || !okNoStore) {
      errors.push(
        `${nom} (${ruta}): en manteniment cal HTTP 503 + Retry-After vàlid (>= 60 s o data HTTP futura) + Cache-Control no-store (rebut status=${resp.status}, retry-after="${cruRetry}", cache-control="${cacheCtrl}")`,
      );
    }
  };

  // 1. Portada /
  const rPortada = await getAnonim(`${base}/`, limits);
  resultats.push(resultat('/', rPortada));
  if (fallada('portada', '/', rPortada)) {
    // ja anotat
  } else if (esperaManteniment) {
    avaluaManteniment503('portada', '/', rPortada);
  } else if (rPortada.status !== 200 || rPortada.bytes === 0) {
    errors.push(`portada (/): esperat 200 amb cos HTML no buit, rebut ${rPortada.status} (${rPortada.bytes} B)`);
  }

  // 2. Ruta 404 amb nonce (caça soft-404 que responen 200 silenciós)
  const ruta404 = `/sonda-404-inexistent-${nonce}/`;
  const r404 = await getAnonim(`${base}${ruta404}`, limits);
  resultats.push(resultat(ruta404, r404));
  if (fallada('sonda-404', ruta404, r404)) {
    // ja anotat
  } else if (esperaManteniment) {
    avaluaManteniment503('sonda-404', ruta404, r404);
  } else if (r404.status !== 404) {
    errors.push(`sonda-404 (${ruta404}): esperat HTTP 404 real (no soft-404), rebut ${r404.status}`);
  }

  // 3. Canal RSS /feed/
  const rFeed = await getAnonim(`${base}/feed/`, limits);
  resultats.push(resultat('/feed/', rFeed));
  if (fallada('feed', '/feed/', rFeed)) {
    // ja anotat
  } else if (esperaManteniment) {
    avaluaManteniment503('feed', '/feed/', rFeed);
  } else if (rFeed.status !== 200 || !/<(?:rss|feed)\b/i.test(rFeed.text)) {
    errors.push(`feed (/feed/): esperat 200 amb XML <rss> o <feed>, rebut ${rFeed.status}`);
  }

  // 4. Mapa del lloc /wp-sitemap.xml (o /sitemap.xml en amfitrions estàtics)
  let rutaSitemap = '/wp-sitemap.xml';
  let rSitemap = await getAnonim(`${base}${rutaSitemap}`, limits);
  if (!esperaManteniment && rSitemap.status === 404) {
    const rAlt = await getAnonim(`${base}/sitemap.xml`, limits);
    if (rAlt.status === 200) {
      rutaSitemap = '/sitemap.xml';
      rSitemap = rAlt;
    }
  }
  resultats.push(resultat(rutaSitemap, rSitemap));
  if (fallada('sitemap', rutaSitemap, rSitemap)) {
    // ja anotat
  } else if (esperaManteniment) {
    avaluaManteniment503('sitemap', rutaSitemap, rSitemap);
  } else if (rSitemap.status !== 200 || !/<(?:urlset|sitemapindex)\b/i.test(rSitemap.text)) {
    errors.push(`sitemap (${rutaSitemap}): esperat 200 amb <urlset> o <sitemapindex>, rebut ${rSitemap.status}`);
  }

  // 5. /robots.txt -> SEMPRE 200 OK, fins i tot durant manteniment 503!
  const rRobots = await getAnonim(`${base}/robots.txt`, limits);
  resultats.push(resultat('/robots.txt', rRobots));
  if (fallada('robots', '/robots.txt', rRobots)) {
    // ja anotat
  } else if (rRobots.status !== 200 || !/user-agent\s*:/i.test(rRobots.text)) {
    errors.push(`robots (/robots.txt): ha de respondre SEMPRE 200 OK amb User-agent fins i tot en manteniment (rebut ${rRobots.status})`);
  }

  return {
    sonda: 'sonda-tellado-5-rutes',
    metode: 'GET',
    baseUrl: base,
    limits,
    esperaManteniment,
    ok: errors.length === 0,
    resultats,
    errors,
  };
}

/**
 * Servidor local efímer (127.0.0.1:0) per provar la sonda sense xarxa externa.
 */
export async function creaServidorEfimerTellado(opcions = {}) {
  const mantenimentSegons = Number(opcions.mantenimentSegons || 0);
  const soft404 = Boolean(opcions.soft404);
  const robots503 = Boolean(opcions.robots503);
  const ometRetryAfter = Boolean(opcions.ometRetryAfter);
  const cacheControl = typeof opcions.cacheControl === 'string' ? opcions.cacheControl : 'no-store, no-cache, must-revalidate, max-age=0';
  const peticionsRebudes = [];

  const server = http.createServer((req, res) => {
    peticionsRebudes.push({
      method: req.method,
      url: req.url,
      cookie: req.headers.cookie || '',
    });

    if (req.url === '/robots.txt' && !robots503) {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('User-agent: *\nAllow: /\n');
      return;
    }

    if (mantenimentSegons > 0) {
      const capcaleres = {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': cacheControl,
      };
      if (!ometRetryAfter) {
        capcaleres['Retry-After'] = String(Math.max(60, mantenimentSegons));
      }
      res.writeHead(503, capcaleres);
      res.end('<!doctype html><html lang="ca"><title>Manteniment</title><h1>Tornem prompte</h1></html>');
      return;
    }

    if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<!doctype html><html lang="ca"><title>Sóc de Poble</title><h1>Benvinguts</h1></html>');
      return;
    }

    if (req.url === '/feed/') {
      res.writeHead(200, { 'Content-Type': 'application/rss+xml; charset=utf-8' });
      res.end('<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Sóc de Poble</title></channel></rss>');
      return;
    }

    if (req.url === '/wp-sitemap.xml') {
      res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
      res.end('<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></sitemapindex>');
      return;
    }

    if (soft404) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<!doctype html><html><body>Portada disfressada de 200</body></html>');
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<!doctype html><html lang="ca"><title>404</title><h1>No trobat</h1></html>');
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  return {
    url: `http://127.0.0.1:${port}`,
    peticionsRebudes,
    tanca: () => new Promise((resolve) => server.close(resolve)),
  };
}

export async function executaCliSondaTellado(argv = process.argv.slice(2)) {
  let url = '';
  let esperaManteniment = false;
  let json = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--espera-manteniment') esperaManteniment = true;
    else if (arg === '--json') json = true;
    else if (arg.startsWith('--url=')) url = arg.slice('--url='.length);
    else if (arg === '--url' && argv[i + 1]) {
      url = argv[i + 1];
      i += 1;
    }
  }

  if (!url) {
    console.error('Ús: node tooling/gates/sonda-tellado-5-rutes.mjs --url=https://domini.org [--espera-manteniment] [--json]');
    return 2;
  }

  const resultat = await executaSondaTellado5Rutes(url, { esperaManteniment });
  if (json) {
    console.log(JSON.stringify(resultat, null, 2));
  } else if (resultat.ok) {
    console.log(`✅ [SONDA-TELLADO] 5 rutes GET verificades sobre ${resultat.baseUrl}`);
  } else {
    console.error(`❌ [SONDA-TELLADO] ${resultat.errors.length} fallada(es) sobre ${resultat.baseUrl}:`);
    for (const err of resultat.errors) console.error(`  - ${err}`);
  }
  return resultat.ok ? 0 : 1;
}

if (esMain(import.meta.url)) {
  executaCliSondaTellado().then((code) => {
    process.exitCode = code;
  });
}
