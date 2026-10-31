/**
 * client.js · Onada 5 (F5, fase 2) · La lectura de la Viquipèdia, Wikidata i
 * Commons per a l'algoritme de pobles nous (src/sections/pobles/pobleDeViquipedia.js).
 *
 * El transport és la Frontissa de sempre (../sollutia/creaFrontissa.js), sense
 * tocar-la: un catàleg tancat per origen, GET sense credencials ni
 * redireccions, paràmetres en llista blanca, temps i mida fitats, només JSON i
 * un DTO tancat (recursos.js). Ací només s'hi compon el que la Frontissa no
 * fa i l'etiqueta de Wikimedia demana:
 *   · la capçalera Api-User-Agent (el navegador no deixa canviar User-Agent);
 *   · una cua en sèrie: una sola petició viva i un respir entre peticions;
 *   · reintents només per a 429, 503, maxlag i errors de xarxa, amb espera
 *     creixent (1, 2 i 4 s més un atzar) i el Retry-After del servidor (fins a
 *     10 s), que para la cua sencera, no només la petició que l'ha rebut;
 *   · una sola petició per a crides iguals simultànies i una memòria de sessió.
 * Res d'AbortSignal.timeout ni AbortSignal.any (no són del baseline 2022):
 * AbortController i setTimeout.
 */
import { creaFrontissa, ErrorDades } from '../sollutia/creaFrontissa.js';
import { MUNICIPI_D_ESPANYA, RECURSOS } from './recursos.js';

/* L'entrada de l'adaptador: qui en consumix els DTO no importa mai els
   traductors (la frontera F1 de tractor-adaptadors). */
export { ErrorDades, MUNICIPI_D_ESPANYA };

/** Identificació per a Wikimedia: nom, versió i on trobar-nos. Cap correu personal. */
export const AGENT_USUARI = 'SocDePoble/1.0 (https://socdepoble.org/projecte)';
export const ESPAI_ENTRE_PETICIONS_MS = 250;
export const ESPERES_REINTENT_MS = Object.freeze([1000, 2000, 4000]);
export const MAXIM_ATZAR_MS = 250;
export const MAXIM_RETRY_AFTER_MS = 10000;
const TEMPS_MAXIM_MS = 8000;
const MAXIM_CAU = 100;
const KIB = 1024;

/* Sempre: JSON en la forma 2 (UTF-8 sense escapar), CORS anònim (origin=*) i
   maxlag=5, que demana a l'API que torne error si les rèpliques van tard. */
const COMUNS = Object.freeze({ format: 'json', formatversion: '2', origin: '*', maxlag: '5' });

const ORIGENS = Object.freeze({
  viquipedia: 'https://ca.wikipedia.org',
  wikidata: 'https://www.wikidata.org',
  commons: 'https://commons.wikimedia.org'
});

/* El catàleg: l'origen, els paràmetres fixos, els que posa qui crida i la
   captura real que en fonamenta la forma (tests/frontissa/fixtures/viquipedia/). */
export const CATALEG = Object.freeze({
  cercaMunicipi: Object.freeze({
    origen: 'wikidata', captureId: 'viquipedia-cerca-sella-261009', maxBytes: 64 * KIB,
    fixos: Object.freeze({ action: 'query', list: 'search', srlimit: '5' }),
    variables: Object.freeze(['srsearch'])
  }),
  entitats: Object.freeze({
    origen: 'wikidata', captureId: 'viquipedia-entitats-la-torre-de-les-macanes-261009', maxBytes: 1024 * KIB,
    fixos: Object.freeze({ action: 'wbgetentities', props: 'labels|claims|sitelinks', languages: 'ca', sitefilter: 'cawiki' }),
    variables: Object.freeze(['ids'])
  }),
  etiquetes: Object.freeze({
    origen: 'wikidata', captureId: 'viquipedia-etiquetes-la-torre-de-les-macanes-261009', maxBytes: 64 * KIB,
    fixos: Object.freeze({ action: 'wbgetentities', props: 'labels', languages: 'ca' }),
    variables: Object.freeze(['ids'])
  }),
  article: Object.freeze({
    origen: 'viquipedia', captureId: 'viquipedia-article-la-torre-de-les-macanes-261009', maxBytes: 256 * KIB,
    fixos: Object.freeze({
      action: 'query', prop: 'extracts|pageimages|pageprops|images|coordinates',
      exintro: '1', explaintext: '1', piprop: 'original|name', imlimit: '50', redirects: '1'
    }),
    variables: Object.freeze(['titles'])
  }),
  fitxers: Object.freeze({
    origen: 'commons', captureId: 'viquipedia-fitxers-la-torre-de-les-macanes-261009', maxBytes: 256 * KIB,
    fixos: Object.freeze({
      action: 'query', prop: 'imageinfo', iiprop: 'url|size|mime|sha1|extmetadata', iiurlwidth: '1600',
      iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl|AttributionRequired|Credit|Restrictions'
    }),
    variables: Object.freeze(['titles'])
  })
});

/** Llargària màxima d'un valor de paràmetre a la Frontissa (creaFrontissa.js). */
export const MAXIM_VALOR = 512;
/** Títols per petició que l'API admet sense compte. */
const MAXIM_TITOLS = 50;

/**
 * Agrupa títols de fitxer en valors de `titles` ('File:A|File:B') que no
 * passen de MAXIM_VALOR caràcters ni de 50 títols. Un títol que tot sol ja no
 * hi cap es queda fora: no es pot demanar.
 */
export function partixTitols(titols, maxim = MAXIM_VALOR) {
  const grups = [];
  let actual = [];
  let llargaria = 0;
  for (const titol of titols) {
    if (typeof titol !== 'string' || !titol || titol.length > maxim) continue;
    const afegit = actual.length ? titol.length + 1 : titol.length;
    if (actual.length && (llargaria + afegit > maxim || actual.length === MAXIM_TITOLS)) {
      grups.push(actual.join('|'));
      actual = [];
      llargaria = 0;
    }
    llargaria += actual.length ? titol.length + 1 : titol.length;
    actual.push(titol);
  }
  if (actual.length) grups.push(actual.join('|'));
  return grups;
}

/* Segons de Retry-After (l'única forma que hi hem vist), en mil·lisegons i
   fitats. Una data HTTP o un valor estrany no compten. */
function retryAfterMs(capcalera) {
  const segons = Number(capcalera);
  return Number.isFinite(segons) && segons > 0 ? Math.min(segons * 1000, MAXIM_RETRY_AFTER_MS) : 0;
}

/* Una espera que es pot cancel·lar; si el senyal s'avorta, CANCELLED. */
function dorm(ms, signal) {
  return new Promise((resol, rebutja) => {
    if (signal?.aborted) {
      rebutja(new ErrorDades('CANCELLED'));
      return;
    }
    const avorta = () => {
      clearTimeout(rellotge);
      rebutja(new ErrorDades('CANCELLED'));
    };
    const rellotge = setTimeout(() => {
      signal?.removeEventListener('abort', avorta);
      resol();
    }, Math.max(0, ms));
    signal?.addEventListener('abort', avorta, { once: true });
  });
}

/* Es reintenta el que és passatger: 429, 503 (també el maxlag, que el
   transport convertix en 503) i la xarxa (UNAVAILABLE sense estat). Mai un
   4xx, un TIMEOUT, una cancel·lació ni una forma invàlida. */
const esReintentable = (error) => error instanceof ErrorDades && error.code === 'UNAVAILABLE'
  && (error.status === 429 || error.status === 503 || error.status == null);

const clauDe = (recurs, entrada) => JSON.stringify([recurs, Object.keys(entrada).sort().map((k) => [k, entrada[k]])]);

/**
 * Un lector de Wikimedia. Tot el que no es passa té el valor de producció;
 * les proves injecten fetchImpl, espaiMs i atzar.
 *   llig(recurs, entrada, { signal }) → DTO de recursos.js, o ErrorDades.
 */
export function creaLectorViquipedia({
  fetchImpl = (url, init) => globalThis.fetch(url, init),
  agent = AGENT_USUARI,
  espaiMs = ESPAI_ENTRE_PETICIONS_MS,
  atzar = Math.random
} = {}) {
  let cua = Promise.resolve();
  let llestPer = 0;
  const enVol = new Map();
  const cau = new Map();

  const para = (ms) => { if (ms > 0) llestPer = Math.max(llestPer, Date.now() + ms); };

  /* El transport que veu la Frontissa: hi posa Api-User-Agent i, davant d'un
     «afluixa» del servidor, para la cua. MediaWiki torna el maxlag amb HTTP
     200 i la capçalera MediaWiki-API-Error (CORS l'exposa, igual que
     Retry-After: captura del 261009); es tradueix en un 503 sense cos.
     Fase 3a (disseny nit/viquipedia_disseny.md §4.10.1) · Sense referent:
     Wikimedia no sap des de quina pàgina es consulta (Legal §21). La
     Frontissa no el fixa i no es toca; les URL no canvien (les captures valen). */
  async function transport(url, init = {}) {
    const resposta = await fetchImpl(url, {
      ...init, referrerPolicy: 'no-referrer', headers: { ...(init.headers || {}), 'Api-User-Agent': agent }
    });
    const espera = retryAfterMs(resposta.headers?.get?.('retry-after'));
    if (resposta.status === 429 || resposta.status === 503) {
      para(espera || ESPERES_REINTENT_MS[0]);
      return resposta;
    }
    if (resposta.headers?.get?.('mediawiki-api-error') === 'maxlag') {
      para(espera || ESPERES_REINTENT_MS[0]);
      try { await resposta.body?.cancel?.(); } catch { /* el cos ja no interessa */ }
      return new Response(null, { status: 503 });
    }
    return resposta;
  }

  const frontisses = Object.fromEntries(Object.entries(ORIGENS).map(([origen, apiOrigin]) => [origen, creaFrontissa({
    apiOrigin: `${apiOrigin}/`,
    allowedOrigins: [apiOrigin],
    fetchImpl: transport,
    resources: Object.fromEntries(Object.entries(CATALEG)
      .filter(([, recurs]) => recurs.origen === origen)
      .map(([nom, recurs]) => [nom, {
        enabled: true,
        captureId: recurs.captureId,
        path: '/w/api.php',
        params: ['action', ...Object.keys(COMUNS), ...Object.keys(recurs.fixos).filter((k) => k !== 'action'), ...recurs.variables],
        maxBytes: recurs.maxBytes,
        timeoutMs: TEMPS_MAXIM_MS,
        decode: RECURSOS[nom].traductor
      }]))
  })]));

  /* Una sola petició viva i el respir entre peticions. El rellotge de la
     Frontissa no comença fins que és el torn: esperar a la cua no és un
     TIMEOUT. */
  function perTorn(tasca, signal) {
    const torn = cua.then(async () => {
      const espera = llestPer - Date.now();
      if (espera > 0) await dorm(espera, signal);
      if (signal?.aborted) throw new ErrorDades('CANCELLED');
      try {
        return await tasca();
      } finally {
        para(espaiMs);
      }
    });
    cua = torn.then(() => undefined, () => undefined);
    return torn;
  }

  async function ambReintents(recurs, params, signal) {
    const lectura = frontisses[CATALEG[recurs].origen];
    for (let intent = 0; ; intent += 1) {
      try {
        return await perTorn(() => lectura(recurs, params, { signal }), signal);
      } catch (error) {
        if (!esReintentable(error) || intent >= ESPERES_REINTENT_MS.length) throw error;
        await dorm(ESPERES_REINTENT_MS[intent] + Math.floor(atzar() * MAXIM_ATZAR_MS), signal);
      }
    }
  }

  /* Crides iguals simultànies comparteixen una petició. Qui cancel·la deixa
     d'esperar-la; la petició només s'avorta quan ja no l'espera ningú, i
     aleshores ix d'enVol: qui arribe després en fa una de nova, no hereta la
     cancel·lació. */
  function compartit(clau, fer, signal) {
    let entrada = enVol.get(clau);
    if (!entrada) {
      const controlador = new AbortController();
      entrada = { controlador, interessats: 0, promesa: null };
      entrada.promesa = fer(controlador.signal);
      const tanca = () => { if (enVol.get(clau) === entrada) enVol.delete(clau); };
      entrada.promesa.then(tanca, tanca);
      enVol.set(clau, entrada);
    }
    const viva = entrada;
    viva.interessats += 1;
    return new Promise((resol, rebutja) => {
      let fet = false;
      const acaba = () => {
        fet = true;
        signal?.removeEventListener('abort', avorta);
      };
      function avorta() {
        if (fet) return;
        acaba();
        viva.interessats -= 1;
        if (viva.interessats === 0) {
          if (enVol.get(clau) === viva) enVol.delete(clau);
          viva.controlador.abort();
        }
        rebutja(new ErrorDades('CANCELLED'));
      }
      if (signal?.aborted) {
        avorta();
        return;
      }
      signal?.addEventListener('abort', avorta, { once: true });
      viva.promesa.then(
        (valor) => { if (!fet) { acaba(); resol(valor); } },
        (error) => { if (!fet) { acaba(); rebutja(error); } }
      );
    });
  }

  async function llig(recurs, entrada = {}, { signal } = {}) {
    if (!Object.hasOwn(CATALEG, recurs)) throw new ErrorDades('UNKNOWN_RESOURCE');
    const { fixos, variables } = CATALEG[recurs];
    const claus = Object.keys(entrada || {});
    if (!claus.length || claus.some((k) => !variables.includes(k) || typeof entrada[k] !== 'string' || !entrada[k].trim())) {
      throw new ErrorDades('INVALID_QUERY');
    }
    if (signal?.aborted) throw new ErrorDades('CANCELLED');
    const clau = clauDe(recurs, entrada);
    if (cau.has(clau)) return cau.get(clau);
    const params = { action: fixos.action, ...COMUNS, ...fixos, ...entrada };
    const dto = await compartit(clau, (senyal) => ambReintents(recurs, params, senyal), signal);
    if (cau.size >= MAXIM_CAU) cau.delete(cau.keys().next().value);
    cau.set(clau, dto);
    return dto;
  }

  return Object.freeze({ llig });
}

let lector;

/** El lector de producció, creat la primera vegada que algú llig. */
export function llig(recurs, entrada, opcions) {
  lector ||= creaLectorViquipedia();
  return lector.llig(recurs, entrada, opcions);
}
