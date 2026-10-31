/**
 * federacio-iaia.mjs — P1-23 (ordre del Mestre del 30-10-2026, candidatura
 * NLnet NGI Fediversity) · La federació ActivityPub de la fase 1 (descoberta i
 * lectura) amb UN sol esquema d'URL a tot arreu (src/data/activitypub.js).
 * Dos connectors:
 *
 *   · sdp:federacio-dev (apply 'serve') · el servidor de desenvolupament
 *     (http://localhost:3340) servix, darrere dels middlewares de Vite que
 *     van abans de qualsevol connector (rebuig de peticions amb «#», CORS i
 *     allowedHosts: vite 7.3.6, chunks/config.js, _createServer):
 *       GET /.well-known/webfinger?resource=acct:<slug>@<host>  → JRD (RFC 7033):
 *           application/jrd+json, Access-Control-Allow-Origin: *, 400 sense
 *           resource, amb més d'un o malformat (§4.2: sense esquema, acct:
 *           sense usuari@host, massa llarg), 404 si és ben format però no és
 *           un actor d'este origen; filtre rel (§4.3).
 *       GET /ap/actors|outbox|followers/<slug>.json, /ap/inbox/<slug> i
 *           /ap/objectes/<slug>/<id>.json → application/activity+json, sempre
 *           (com el lloc estàtic: cap negociació per Accept, perquè dev i
 *           Firebase diguen el mateix).
 *       POST (i la resta) → 405 amb Allow: GET, HEAD, OPTIONS (RFC 9110
 *           §15.5.6); a la inbox també, perquè rebre és de la fase 2
 *           (signatures HTTP, Follow/Accept). Una inbox desconeguda, 404.
 *       OPTIONS → 204 amb CORS per a qualsevol origen. El CORS de Vite
 *           (server.cors) respondria ell els OPTIONS abans que este connector,
 *           sense Access-Control-Allow-Origin per a un origen extern i
 *           anunciant POST: per això el connector embolica server.cors
 *           (corsAmbFederacio) perquè passe de llarg només en estes rutes.
 *       GET /.well-known/nodeinfo i /nodeinfo/2.1.json → NodeInfo 2.1.
 *     L'origen dels ids és el de la petició (http://localhost:3340 →
 *     acct:<slug>@localhost:3340): http només en loopback (un altre host per
 *     http, 400, si allowedHosts de Vite el deixa passar). Els documents es
 *     reconstruïxen a cada petició amb ssrLoadModule: un canvi a pageContent.js
 *     o a activitypub.js es veu sense reiniciar.
 *   · sdp:federacio-build (apply 'build') · el build web (npm run build:web,
 *     vite.config.js) emet a l'eixida ap/actors, ap/outbox, ap/followers,
 *     ap/inbox i ap/objectes amb l'origen públic canònic (VITE_CANONICAL_URL o
 *     https://socdepoble.org; https sempre), i firebase.json els servix amb Content-Type
 *     application/activity+json, CORS * i Cache-Control (regla /ap/**). També
 *     .well-known/host-meta i .well-known/webfinger/<slug>.json dels actors
 *     principals (fitxersWebFingerEstatic del generador): el WebFinger que
 *     Mastodon troba per la plantilla LRDD quan /.well-known/webfinger torna
 *     404 a Firebase (reescriptures i capçaleres de firebase.json). Ni el
 *     natiu (vite.natiu.config.js) ni el connector WordPress
 *     (vite.standalone.config.js) el registren. Un build SSR no n'emet.
 *
 * Res d'esta configuració importa src/: el generador
 * (tooling/seo/genera-federacio.mjs) es carrega amb un import() de camí calculat
 * dins dels ganxos, i vite.config.js no en fa dependència (Vite no es reinicia
 * quan es toca una pàgina).
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { defaultAllowedOrigins } from 'vite';

export const RUTA_WEBFINGER = '/.well-known/webfinger';
export const RUTA_NODEINFO = '/.well-known/nodeinfo';
export const RUTA_NODEINFO_21 = '/nodeinfo/2.1.json';
export const GENERADOR = 'tooling/seo/genera-federacio.mjs';
export const TIPUS = Object.freeze({
  ap: 'application/activity+json; charset=utf-8',
  jrd: 'application/jrd+json; charset=utf-8',
  json: 'application/json; charset=utf-8',
  nodeinfo: 'application/json; profile="http://nodeinfo.diaspora.software/ns/schema/2.1#"'
});
/* Un sol patró, de longitud fitada i sense alternatives ambigües. */
const RUTA_AP = /^\/ap\/(?:(actors|outbox|followers)\/([a-z0-9-]{1,64})\.json|objectes\/([a-z0-9-]{1,64})\/([a-z0-9-]{1,128})\.json|inbox\/([a-z0-9-]{1,64}))$/;
const HOST = /^(?:[a-z0-9.-]{1,253}|\[[0-9a-f:.]{2,45}\])(?::\d{1,5})?$/i;
export const METODES_LECTURA = 'GET, HEAD, OPTIONS';

/** Cert si la petició és d'una ruta de la federació (les que este connector respon). */
export function esRutaFederada(urlDeLaPeticio) {
  let cami = '';
  try { cami = new URL(urlDeLaPeticio ?? '/', 'http://federacio.invalid').pathname; } catch { return false; }
  return cami === RUTA_WEBFINGER || cami === RUTA_NODEINFO || cami === RUTA_NODEINFO_21 || cami === '/ap' || cami.startsWith('/ap/');
}

/**
 * Embolica server.cors de Vite perquè passe de llarg (origin: false: el
 * paquet cors crida next() sense tocar res) a les rutes de la federació, i
 * les responga este connector com nginx i Firebase: CORS * i OPTIONS → 204
 * amb GET, HEAD, OPTIONS. La resta de rutes conserva el CORS de Vite
 * (per defecte, { origin: defaultAllowedOrigins }); false continua sent false.
 */
export function corsAmbFederacio(anterior) {
  if (anterior === false) return false;
  const base = anterior === undefined || anterior === null ? { origin: defaultAllowedOrigins } : anterior === true ? {} : anterior;
  return function corsDeViteForaDeLaFederacio(req, retorn) {
    if (esRutaFederada(req.url)) return retorn(null, { origin: false });
    if (typeof base === 'function') return base(req, retorn);
    return retorn(null, base);
  };
}

function envia(res, { status, tipus = TIPUS.json, cos, cap = false, capcaleres = {} }) {
  const bytes = Buffer.from(typeof cos === 'string' ? cos : `${JSON.stringify(cos, null, 2)}\n`, 'utf8');
  res.statusCode = status;
  res.setHeader('Content-Type', tipus);
  res.setHeader('Content-Length', String(bytes.length));
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-cache');
  for (const [clau, valor] of Object.entries(capcaleres)) res.setHeader(clau, valor);
  res.end(cap ? undefined : bytes);
}

const error = (res, status, missatge, cap, capcaleres) => envia(res, { status, cos: { error: missatge }, cap, capcaleres });

/**
 * El middleware de la federació (Connect). `prepara(origen)` torna
 * { ap, origen, actors, fitxers, versio } (preparaFederacio del generador) i
 * llança TypeError si l'origen no és vàlid. Les rutes que no són seues passen
 * a next() sense tocar res.
 */
export function gestorFederacio({ prepara, https = false, registre = null } = {}) {
  if (typeof prepara !== 'function') throw new TypeError('gestorFederacio necessita prepara(origen).');
  return async function federacio(req, res, next) {
    if (!esRutaFederada(req.url)) return next();
    const url = new URL(req.url ?? '/', 'http://federacio.invalid');
    const cami = url.pathname;
    const webfinger = cami === RUTA_WEBFINGER;
    const nodeinfo = cami === RUTA_NODEINFO || cami === RUTA_NODEINFO_21;
    // RFC 7033 §5: CORS obligatori a WebFinger; a /ap/** el mateix que la regla de firebase.json.
    res.setHeader('Access-Control-Allow-Origin', '*');
    const ruta = RUTA_AP.exec(cami);
    const inbox = ruta?.[5] ?? null;
    const cap = req.method === 'HEAD';
    const lectura = req.method === 'GET' || cap;
    const preflight = () => {
      res.statusCode = 204;
      res.setHeader('Access-Control-Allow-Methods', METODES_LECTURA);
      res.setHeader('Access-Control-Allow-Headers', 'Accept');
      return res.end();
    };
    const noAdmes = (cos) => envia(res, { status: 405, cos, capcaleres: { Allow: METODES_LECTURA } });
    // Una inbox desconeguda és 404 a qualsevol mètode: es decidix quan ja hi ha els actors.
    if (!inbox && req.method === 'OPTIONS') return preflight();
    if (!inbox && !lectura) return noAdmes({ error: 'method_not_allowed' });
    const host = req.headers?.host ?? '';
    if (!HOST.test(host)) return error(res, 400, 'bad_host', cap);
    let preparat = null;
    try {
      preparat = await prepara(`${https ? 'https' : 'http'}://${host}`);
    } catch (fallada) {
      if (fallada instanceof TypeError) return error(res, 400, 'origin_not_federable', cap);
      registre?.error?.(`[sdp:federacio] ${fallada?.message ?? fallada}`);
      return error(res, 500, 'federation_unavailable', cap);
    }
    const { ap, origen, actors, fitxers, versio } = preparat;
    const coneguts = new Set(actors.map((actor) => actor.slug));
    if (webfinger) {
      const recursos = url.searchParams.getAll('resource');
      // RFC 7033 §4.2: absent, repetit o malformat → 400; ben format i desconegut → 404.
      if (recursos.length !== 1 || !ap.analitzaRecursWebFinger(recursos[0])) return error(res, 400, 'bad_resource', cap);
      const jrd = ap.construeixWebFinger(recursos[0], { origen, municipis: actors, rel: url.searchParams.getAll('rel') });
      if (!jrd) return error(res, 404, 'not_found', cap);
      return envia(res, { status: 200, tipus: TIPUS.jrd, cos: ap.serialitzaJson(jrd), cap });
    }
    if (nodeinfo) {
      return cami === RUTA_NODEINFO
        ? envia(res, { status: 200, tipus: TIPUS.json, cos: ap.serialitzaJson(ap.construeixEnllacosNodeInfo({ origen })), cap })
        : envia(res, { status: 200, tipus: TIPUS.nodeinfo, cos: ap.serialitzaJson(ap.construeixNodeInfo({ origen, versio })), cap });
    }
    if (inbox) {
      // Es llig (una col·lecció buida); rebre-hi és de la fase 2: ni Follow ni cap altra activitat.
      if (!coneguts.has(inbox)) return error(res, 404, 'not_found', cap);
      if (req.method === 'OPTIONS') return preflight();
      if (!lectura) return noAdmes({ error: 'inbox_not_implemented', detail: 'ActivityPub inbox: phase 2 (HTTP signatures, Follow/Accept). Read-only today.' });
    }
    const document = ruta ? fitxers.get(cami.slice(1)) : undefined;
    if (!document) return error(res, 404, 'not_found', cap);
    return envia(res, { status: 200, tipus: TIPUS.ap, cos: ap.serialitzaJson(document), cap });
  };
}

/* Carrega el generador amb un camí calculat (cap dependència de la configuració).
   La consulta ?v=<mtime> fa que un canvi al generador es veja en dev sense
   reiniciar el procés: Node guarda cada mòdul per URL, i Vite, en reiniciar
   el servidor per un canvi de configuració, no buida eixa memòria. */
export const generadorDe = (arrel) => {
  const fitxer = path.join(arrel, GENERADOR);
  return import(`${pathToFileURL(fitxer).href}?v=${Math.trunc(fs.statSync(fitxer).mtimeMs)}`);
};

export default function federacioIaia({ arrel } = {}) {
  let configuracio = null;
  return [
    {
      name: 'sdp:federacio-dev',
      apply: 'serve',
      // El CORS de Vite va abans dels connectors: a les rutes federades, que passe de llarg.
      config(config, { isPreview } = {}) {
        if (isPreview) return undefined;
        return { server: { cors: corsAmbFederacio(config.server?.cors) } };
      },
      configureServer(server) {
        const arrelDelProjecte = arrel ?? server.config.root;
        const carrega = (rel) => server.ssrLoadModule(`/${rel}`);
        const prepara = async (origen) => (await generadorDe(arrelDelProjecte)).preparaFederacio({ arrel: arrelDelProjecte, origen, carrega });
        server.middlewares.use(gestorFederacio({ prepara, https: Boolean(server.config.server?.https), registre: server.config.logger }));
      }
    },
    {
      name: 'sdp:federacio-build',
      apply: 'build',
      configResolved(config) { configuracio = config; },
      async generateBundle() {
        if (!configuracio || configuracio.build?.ssr) return;
        const arrelDelProjecte = arrel ?? configuracio.root;
        const generador = await generadorDe(arrelDelProjecte);
        const origen = await generador.origenDeLaPublicacio({ env: configuracio.env ?? {}, arrel: arrelDelProjecte });
        const preparat = await generador.preparaFederacio({ arrel: arrelDelProjecte, origen });
        // ap/** i el WebFinger estàtic (host-meta, un text XRD, i el JRD dels actors principals).
        for (const [fileName, document] of [...preparat.fitxers, ...generador.fitxersWebFingerEstatic(preparat)]) {
          this.emitFile({ type: 'asset', fileName, source: generador.bytesDe(preparat.ap, document) });
        }
      }
    }
  ];
}
