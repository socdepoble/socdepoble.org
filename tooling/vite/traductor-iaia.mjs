/**
 * traductor-iaia.mjs — Connector només-dev: el Traductor Sobirà a
 * http://localhost:3340 (IDEA-31, ordre del Mestre 261029 23:30; QA-R2-13).
 *
 * Servix POST /__iaia/traduir amb el contracte exacte de src/data/traductor.js:
 *   { textos, desti, origen: 'CA', format } → { traduccions, origen: 'CA', desti, cache }
 * i, en error, la forma de WP REST { code: 'sdp_traduccio_*', message, data: { status } }.
 * Fa el que wordpress-plugin/includes/traduccio.php fa sense clau de DeepL, amb
 * les MATEIXES validacions i límits: JSON, cos de 32768 bytes com a molt (llegit
 * amb tall), mateix origen o cap, sec-fetch-site cross-site fora, 50 textos,
 * 5000 caràcters i 20000 bytes, 30 peticions sense cache per adreça cada 10
 * minuts, pressupost de 10000/100000 caràcters dia/mes (UTC) reservat abans
 * d'enviar i sense reemborsament, 12 s per crida i 30 s per petició (decisió
 * del Mestre 261030 §2: una sola crida lenta no esgota la petició), i la pausa
 * curta del proveïdor (60 s) només per un 403 o un 429, mai per un termini ni
 * per un error de xarxa puntual.
 *
 * Proveïdors per destí (cicle 2 del Gauntlet, 261030). APERTIUM_PER_DESTI és
 * la rèplica de MOTORS_TRADUCCIO (src/data/traductorLliure.js, l'única font de
 * veritat), i traductor-contracte.test.mjs vigila que coincidixen:
 *  · ES, EN-GB, FR i GL → Apertium, primer la beta i, si cau per transport o
 *    5xx, l'extrem principal (G10). El gallec (cat|glg) només a la beta:
 *    l'extrem principal torna 400 «That pair is not installed» (provat el
 *    30-10-2026). SDP_TRADUCCIO_APERTIUM_URL substituïx els extrems.
 *    Sempre amb `format` explícit, txt o html (C6): l'APy, sense format,
 *    tracta el text pla com a HTML.
 *  · DE i EU → l'extrem compatible amb LibreTranslate de SDP_TRADUCCIO_URL
 *    (clau opcional SDP_TRADUCCIO_URL_CLAU, mai en cap resposta ni registre),
 *    amb `target` segons el destí (G3). Sense eixe extrem,
 *    sdp_traduccio_sense_clau (D-3): MyMemory és del navegador, no del servidor.
 * Cap DeepL, cap Google.
 *
 * Memòria cau en memòria: 7 dies i 2000 entrades com a molt. Sense xarxa, la
 * resposta és el 502 sdp_traduccio_proveidor de sempre (el client hi posa el
 * seu missatge): cap excepció al servidor ni al navegador. Eixe 502 sí que
 * apareix a la consola del navegador com a recurs fallit, i només sense xarxa;
 * el mateix passa amb el 503 sense_clau de DE i EU sense proveïdor.
 * L'agent és l'honest del Mas (SocDePoble-Translation/1.1): mai es simula un
 * navegador ni es falsegen capçaleres per esquivar un error del servidor.
 *
 * `apply: 'serve'` → el build i el preview no el coneixen. En servir (i fora de
 * Vitest, que també avalua vite.config.js com a serve) definix
 * import.meta.env.SDP_TRADUCTOR_DEV, que src/main.jsx llig per a declarar
 * traductorUrl: la web publicada i l'app nativa no canvien.
 */
export const RUTA_TRADUCTOR = '/__iaia/traduir';
export const AGENT = 'SocDePoble-Translation/1.1';
export const APERTIUM_BETA = 'https://beta.apertium.org/apy/translate';
export const APERTIUM_PRINCIPAL = 'https://apertium.org/apy/translate';
/* G10: primer la beta i, si cau (transport o 5xx), l'extrem principal. */
export const APERTIUM = Object.freeze([APERTIUM_BETA, APERTIUM_PRINCIPAL]);
/* Apertium per destí: parell i extrems en ordre. El gallec, només la beta. */
export const APERTIUM_PER_DESTI = Object.freeze({
  ES: Object.freeze({ parell: 'cat|spa', extrems: APERTIUM }),
  'EN-GB': Object.freeze({ parell: 'cat|eng', extrems: APERTIUM }),
  FR: Object.freeze({ parell: 'cat|fra', extrems: APERTIUM }),
  GL: Object.freeze({ parell: 'cat|glg', extrems: Object.freeze([APERTIUM_BETA]) })
});
/* La llista tancada de destins (la mateixa del PHP) i el codi del proveïdor
   compatible amb LibreTranslate per a cada un (G3: mai un 'de' fix). */
export const DESTINS_TRADUCCIO = Object.freeze(['ES', 'EN-GB', 'FR', 'DE', 'GL', 'EU']);
export const CODIS_LLIURE = Object.freeze({ ES: 'es', 'EN-GB': 'en', FR: 'fr', DE: 'de', GL: 'gl', EU: 'eu' });
export const LIMITS = Object.freeze({
  cos: 32768, textos: 50, caracters: 5000, bytes: 20000, resposta: 131072,
  peticions: 30, finestra: 10 * 60 * 1000, diari: 10000, mensual: 100000,
  crida: 12000, total: 30000, pausa: 60 * 1000, cau: 2000, vidaCau: 7 * 24 * 60 * 60 * 1000
});

const DESTINS = new Set(DESTINS_TRADUCCIO);
const FORMATS = new Set(['text', 'html']);
const CLAUS = new Set(['textos', 'desti', 'origen', 'format']);
const JSON_TIPUS = /^application\/(?:[a-z0-9.+-]+\+)?json(?:;|$)/i;
/* Els blancs del trim() de PHP: un text de només blancs no es traduïx. */
const BLANCS_PHP = /^[ \t\n\r\0\x0B]*$/;
const MISSATGES = Object.freeze({
  limit: 'Translation limit reached. Try again later.',
  sense_clau: 'Translation is not configured on this server.',
  ocupada: 'Translation is busy. Try again shortly.',
  proveidor: 'The translation provider is unavailable. Try again later.'
});

/** { status, cos } d'error amb la forma de WP REST i el codi estable del PHP. */
export function errorTraduccio(codi, status) {
  return {
    status,
    cos: { code: `sdp_traduccio_${codi}`, message: MISSATGES[codi] ?? 'The translation request could not be accepted.', data: { status } }
  };
}

const caracters = (text) => Array.from(text).length;
const benFormat = (text) => (typeof text.isWellFormed === 'function'
  ? text.isWellFormed()
  : !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(text));

/** L'origen normalitzat (esquema://host:port) d'una URL http(s) sense credencials, o ''. */
function origenDe(url) {
  try {
    const u = new URL(url);
    if ((u.protocol !== 'http:' && u.protocol !== 'https:') || u.username || u.password) return '';
    return `${u.protocol}//${u.hostname}:${u.port || (u.protocol === 'https:' ? '443' : '80')}`;
  } catch {
    return '';
  }
}

/**
 * Les comprovacions del permís del PHP, en el mateix ordre: Origin del mateix
 * origen que el servidor (o absent, per a clients que no són navegadors),
 * sec-fetch-site cross-site fora i JSON. null si passa.
 */
export function comprovaCapcaleres(capcaleres, origenServidor) {
  const origen = capcaleres.origin;
  // Com el PHP: una capçalera buida compta com a absent.
  if (origen !== undefined && origen !== '' && (origenDe(origen) === '' || origenDe(origen) !== origenDe(origenServidor))) return errorTraduccio('origen', 403);
  if (capcaleres['sec-fetch-site'] === 'cross-site') return errorTraduccio('origen', 403);
  if (!JSON_TIPUS.test(capcaleres['content-type'] ?? '')) return errorTraduccio('json', 415);
  return null;
}

/** El cos (Buffer) validat com el PHP: { textos, desti, format } o { error }. */
export function validaCos(bytes) {
  const invalida = { error: errorTraduccio('invalida', 400) };
  let dades;
  try {
    dades = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    return invalida;
  }
  if (!dades || typeof dades !== 'object' || Array.isArray(dades) || !Array.isArray(dades.textos)
    || Object.keys(dades).some((clau) => !CLAUS.has(clau))) return invalida;
  const { textos, desti, origen, format } = dades;
  if (textos.length < 1 || textos.length > LIMITS.textos || !DESTINS.has(desti) || origen !== 'CA' || !FORMATS.has(format)) return invalida;
  let suma = 0;
  let bytesText = 0;
  let teText = false;
  for (const text of textos) {
    if (typeof text !== 'string' || !benFormat(text)) return invalida;
    suma += caracters(text);
    bytesText += Buffer.byteLength(text, 'utf8');
    teText = teText || !BLANCS_PHP.test(text);
  }
  if (bytesText > LIMITS.bytes || suma > LIMITS.caracters) return { error: errorTraduccio('mida', 413) };
  if (!teText) return invalida;
  return { textos, desti, format };
}

/** URL https sense credencials ni blancs, o '' (una constant invàlida és absent, com al PHP). */
export function urlHttps(valor) {
  if (typeof valor !== 'string' || !valor || /[\s\x00-\x1F\x7F]/.test(valor)) return '';
  try {
    const u = new URL(valor);
    return u.protocol === 'https:' && u.hostname && !u.username && !u.password ? valor : '';
  } catch {
    return '';
  }
}

/**
 * El proveïdor del destí, o l'error estable sdp_traduccio_sense_clau (503) si
 * DE o EU no en tenen cap (cap crida que ja sabem que fallarà).
 */
export function proveidorPer(desti, env = process.env) {
  if (Object.hasOwn(APERTIUM_PER_DESTI, desti)) {
    const { parell, extrems } = APERTIUM_PER_DESTI[desti];
    const propi = urlHttps(env.SDP_TRADUCCIO_APERTIUM_URL);
    return { nom: 'apertium', parell, extrems: propi ? [propi] : [...extrems], empremta: 'apertium' };
  }
  const url = urlHttps(env.SDP_TRADUCCIO_URL);
  if (!url || !Object.hasOwn(CODIS_LLIURE, desti)) return { error: errorTraduccio('sense_clau', 503) };
  const clau = typeof env.SDP_TRADUCCIO_URL_CLAU === 'string' && !/[\r\n]/.test(env.SDP_TRADUCCIO_URL_CLAU) ? env.SDP_TRADUCCIO_URL_CLAU.trim() : '';
  return { nom: 'lliure', url, clau, target: CODIS_LLIURE[desti], empremta: `lliure|${url}` };
}

/* Gauntlet 261030 (Fase 3, TC3.1) · L'ordre del menú del client
   (LLENGUES_TRADUCCIO, src/data/traductor.js; la prova ho vigila). */
export const ORDRE_DEL_MENU = Object.freeze(['ES', 'GL', 'EU', 'EN-GB', 'FR', 'DE']);

/**
 * TC3.1 · Els destins que este servidor servix de veritat, en l'ordre del
 * menú: els que proveidorPer no torna en error (la MATEIXA regla, cap còpia).
 * Sense SDP_TRADUCCIO_URL: ES, GL, EN-GB i FR (Apertium); amb ella, també EU i
 * DE. És el que el connector declara a main.jsx (SDP_TRADUCTOR_DEV_LLENGUES),
 * com fa marcatge.php amb `traductor-llengues` a WordPress.
 */
export function destinsServits(env = process.env) {
  return ORDRE_DEL_MENU.filter((desti) => !proveidorPer(desti, env).error);
}

/* Com socdepoble_enxufe_traduccio_limit: sense valor, el defecte; amb un valor
   que no és un enter no negatiu, 0 (cap crida nova), mai un límit inventat. */
function limitDe(valor, defecte) {
  if (valor === undefined || valor === '') return defecte;
  return /^\d+$/.test(String(valor)) ? Number(valor) : 0;
}

/** El cos de la resposta amb un sostre: null si passa de `maxim` bytes. */
async function llegixAmbSostre(resposta, maxim) {
  if (!resposta.body?.getReader) {
    const text = await resposta.text();
    return Buffer.byteLength(text) > maxim ? null : text;
  }
  const lector = resposta.body.getReader();
  const trossos = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxim) {
      await lector.cancel().catch(() => {});
      return null;
    }
    trossos.push(value);
  }
  return Buffer.concat(trossos.map((tros) => Buffer.from(tros))).toString('utf8');
}

const jsonDe = (text) => { try { return JSON.parse(text); } catch { return null; } };

/**
 * El servei sense HTTP: `tradueix(cosEnBytes, adreca)` → { status, cos }.
 * `fetch`, `env` i `ara` s'injecten (proves sense xarxa ni rellotge real).
 */
export function creaTraductorIaia({ fetch: fetchPropi, env = process.env, ara = Date.now, limits = LIMITS } = {}) {
  const fer = (url, opcions) => (fetchPropi ?? globalThis.fetch)(url, opcions);
  const cau = new Map();
  const ritme = new Map();
  const enVol = new Set();
  const pauses = new Map();
  let pressupost = { dia: '', mes: '', diari: 0, mensual: 0 };

  const llegixCau = (clau) => {
    const entrada = cau.get(clau);
    if (!entrada) return undefined;
    cau.delete(clau);
    if (entrada.fins <= ara()) return undefined;
    cau.set(clau, entrada);
    return entrada.valor;
  };
  const desaCau = (clau, valor) => {
    cau.delete(clau);
    cau.set(clau, { valor, fins: ara() + limits.vidaCau });
    while (cau.size > limits.cau) cau.delete(cau.keys().next().value);
  };

  /** Una crida: { resposta } o { transport: true }. Mai llança. */
  async function crida(url, opcions, limit) {
    const queda = limit - ara();
    if (queda < 1000) return { termini: true };
    try {
      const resposta = await fer(url, { ...opcions, redirect: 'manual', signal: AbortSignal.timeout(Math.min(limits.crida, queda)) });
      return { resposta };
    } catch {
      return { transport: true };
    }
  }

  /**
   * Com socdepoble_enxufe_traduccio_fallada: null si és un 200. Decisió del
   * Mestre 261030 §2: un termini o un error de xarxa puntual no obri la pausa
   * (la petició següent torna a provar); només 403, 429 i 456 (la quota de
   * DeepL al PHP) la obrin.
   */
  function fallada(resultat, empremta) {
    if (resultat.termini || resultat.transport) return errorTraduccio('proveidor', 502);
    const { status } = resultat.resposta;
    if (status === 403 || status === 429 || status === 456) {
      pauses.set(empremta, { fins: ara() + limits.pausa, estat: status });
      return status === 403 ? errorTraduccio('proveidor', 502) : errorTraduccio('limit', 429);
    }
    return status === 200 ? null : errorTraduccio('proveidor', 502);
  }

  async function apertium(proveidor, pendents, format, limit, desa) {
    let extrem = 0;
    for (const [clau, text] of pendents) {
      // C6: `format` sempre explícit; sense, l'APy desformata el text pla com a HTML.
      const cos = { langpair: proveidor.parell, q: text, markUnknown: 'no', format: format === 'html' ? 'html' : 'txt' };
      let resultat;
      for (;;) {
        resultat = await crida(proveidor.extrems[extrem], {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'User-Agent': AGENT },
          body: new URLSearchParams(cos).toString()
        }, limit);
        const caigut = resultat.transport || (resultat.resposta && resultat.resposta.status >= 500);
        if (!caigut || extrem + 1 >= proveidor.extrems.length) break;
        extrem += 1;
      }
      const error = fallada(resultat, proveidor.empremta);
      if (error) return error;
      const json = jsonDe(await llegixAmbSostre(resultat.resposta, limits.resposta).catch(() => null));
      const traduit = json?.responseStatus === 200 && json.responseData && typeof json.responseData === 'object'
        ? json.responseData.translatedText : null;
      if (typeof traduit !== 'string' || !traduit) return errorTraduccio('proveidor', 502);
      desa(clau, traduit);
    }
    return null;
  }

  async function lliure(proveidor, pendents, format, limit, desa) {
    const cos = { q: pendents.map(([, text]) => text), source: 'ca', target: proveidor.target, format, ...(proveidor.clau ? { api_key: proveidor.clau } : {}) };
    const resultat = await crida(proveidor.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': AGENT },
      body: JSON.stringify(cos)
    }, limit);
    const error = fallada(resultat, proveidor.empremta);
    if (error) return error;
    const json = jsonDe(await llegixAmbSostre(resultat.resposta, limits.resposta).catch(() => null));
    const traduccions = json?.translatedText;
    if (!Array.isArray(traduccions) || traduccions.length !== pendents.length
      || !traduccions.every((text) => typeof text === 'string' && text)) return errorTraduccio('proveidor', 502);
    pendents.forEach(([clau], i) => desa(clau, traduccions[i]));
    return null;
  }

  /** Com socdepoble_enxufe_traduccio_reserva: dia i mes UTC, abans d'enviar i sense reemborsament. */
  function reserva(quants) {
    const isoAra = new Date(ara()).toISOString();
    const dia = isoAra.slice(0, 10);
    const mes = isoAra.slice(0, 7);
    const diari = pressupost.dia === dia ? pressupost.diari : 0;
    const mensual = pressupost.mes === mes ? pressupost.mensual : 0;
    if (diari + quants > limitDe(env.SDP_TRADUCCIO_LIMIT_DIARI, limits.diari)
      || mensual + quants > limitDe(env.SDP_TRADUCCIO_LIMIT_MENSUAL, limits.mensual)) return false;
    pressupost = { dia, mes, diari: diari + quants, mensual: mensual + quants };
    return true;
  }

  function comptaPeticio(adreca) {
    const ara_ = ara();
    if (ritme.size > 1000) for (const [clau, valor] of ritme) if (valor.fins <= ara_) ritme.delete(clau);
    let estat = ritme.get(adreca);
    if (!estat || estat.fins <= ara_) estat = { fins: ara_ + limits.finestra, peticions: 0 };
    if (estat.peticions >= limits.peticions) return false;
    estat.peticions += 1;
    ritme.set(adreca, estat);
    return true;
  }

  async function tradueix(bytes, adreca = 'unknown') {
    const valid = validaCos(bytes);
    if (valid.error) return valid.error;
    const { textos, desti, format } = valid;
    const proveidor = proveidorPer(desti, env);
    if (proveidor.error) return proveidor.error;
    const clauDe = (text) => JSON.stringify([proveidor.empremta, desti, format, text]);
    const resultats = new Map();
    const pendents = new Map();
    for (const text of textos) {
      const clau = clauDe(text);
      const guardat = BLANCS_PHP.test(text) ? text : llegixCau(clau);
      if (guardat !== undefined) resultats.set(clau, guardat);
      else pendents.set(clau, text);
    }
    const resposta = (cache) => ({ status: 200, cos: { traduccions: textos.map((text) => resultats.get(clauDe(text))), origen: 'CA', desti, cache } });
    if (!pendents.size) return resposta(true);
    const pausa = pauses.get(proveidor.empremta);
    if (pausa && pausa.fins > ara()) return pausa.estat === 403 ? errorTraduccio('proveidor', 502) : errorTraduccio('limit', 429);
    // Com els panys per text del PHP: dues peticions no paguen el mateix text.
    if ([...pendents.keys()].some((clau) => enVol.has(clau))) return errorTraduccio('ocupada', 503);
    for (const clau of pendents.keys()) enVol.add(clau);
    try {
      if (!comptaPeticio(adreca)) return errorTraduccio('limit', 429);
      if (!reserva([...pendents.values()].reduce((suma, text) => suma + caracters(text), 0))) return errorTraduccio('limit', 429);
      const limit = ara() + limits.total;
      const desa = (clau, valor) => { desaCau(clau, valor); resultats.set(clau, valor); };
      const error = proveidor.nom === 'apertium'
        ? await apertium(proveidor, [...pendents], format, limit, desa)
        : await lliure(proveidor, [...pendents], format, limit, desa);
      return error ?? resposta(false);
    } finally {
      for (const clau of pendents.keys()) enVol.delete(clau);
    }
  }

  return Object.freeze({ tradueix, mida: () => cau.size });
}

/** El cos de la petició amb tall: { bytes } o { massa: true } sense guardar-ne més. */
export function llegixCos(req, maxim = LIMITS.cos) {
  return new Promise((resolve) => {
    const declarat = Number(req.headers['content-length']);
    if (Number.isFinite(declarat) && declarat > maxim) {
      resolve({ massa: true });
      return;
    }
    const trossos = [];
    let total = 0;
    let acabat = false;
    const fi = (valor) => { if (!acabat) { acabat = true; resolve(valor); } };
    req.on('data', (tros) => {
      if (acabat) return;
      total += tros.length;
      if (total > maxim) fi({ massa: true });
      else trossos.push(tros);
    });
    req.on('end', () => fi({ bytes: Buffer.concat(trossos) }));
    req.on('error', () => fi({ massa: false, bytes: null }));
  });
}

function envia(res, { status, cos }, tancar = false) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (tancar) res.setHeader('Connection', 'close');
  res.end(JSON.stringify(cos));
}

/** El gestor HTTP (Connect/Node). `origen(req)` torna l'origen propi del servidor. */
export function gestorTraductor(traductor, { origen } = {}) {
  return async (req, res) => {
    try {
      if (req.method !== 'POST') {
        envia(res, { status: 404, cos: { code: 'rest_no_route', message: 'No route was found matching the URL and request method.', data: { status: 404 } } });
        return;
      }
      const propi = origen ? origen(req) : `http://${req.headers.host}`;
      const capcaleres = comprovaCapcaleres(req.headers, propi);
      if (capcaleres) {
        envia(res, capcaleres, true);
        return;
      }
      const llegit = await llegixCos(req);
      if (llegit.massa) {
        envia(res, errorTraduccio('mida', 413), true);
        return;
      }
      if (!llegit.bytes) {
        envia(res, errorTraduccio('invalida', 400), true);
        return;
      }
      envia(res, await traductor.tradueix(llegit.bytes, req.socket?.remoteAddress || 'unknown'));
    } catch {
      // Cap text ni clau als registres; cap excepció cap a Vite.
      if (!res.headersSent) envia(res, errorTraduccio('proveidor', 502));
    }
  };
}

export default function traductorIaia({ fetch: fetchPropi, env = process.env } = {}) {
  return {
    name: 'sdp:traductor-iaia',
    apply: 'serve',
    config(_config, { command, isPreview } = {}) {
      if (command !== 'serve' || isPreview || process.env.VITEST) return undefined;
      return {
        define: {
          'import.meta.env.SDP_TRADUCTOR_DEV': JSON.stringify(RUTA_TRADUCTOR),
          /* TC3.1 · Els destins que este servidor servix (destinsServits):
             main.jsx els passa al nucli amb traductorUrl, i el client no
             demana els altres (cap 503 a la consola). */
          'import.meta.env.SDP_TRADUCTOR_DEV_LLENGUES': JSON.stringify(destinsServits(env).join(' '))
        }
      };
    },
    configureServer(server) {
      const https = Boolean(server.config?.server?.https);
      const traductor = creaTraductorIaia({ fetch: fetchPropi, env });
      server.middlewares.use(RUTA_TRADUCTOR, gestorTraductor(traductor, {
        origen: (req) => `${https ? 'https' : 'http'}://${req.headers.host}`
      }));
    }
  };
}
