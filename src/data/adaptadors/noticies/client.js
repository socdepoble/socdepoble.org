/**
 * client.js · T5 (P1-07, 261024) · El client del servei de notícies del poble
 * (contracte sdp.noticies.v1), per al Lector de notícies.
 *
 * El navegador del veí no toca mai l'origen d'una font, ni per a l'XML ni per
 * a les imatges (la regla de src/apps/lector/fontNoticies.js): els feeds els
 * llig la funció `noticies` del backend segellat (supabase/functions/noticies/)
 * i ací només se li demana un feed pel seu id (o, una font personal, per la
 * seua adreça: T5b). Cap mode directe: el navegador no demana mai l'adreça
 * d'un feed a l'origen, ni quan l'origen enviaria CORS.
 *
 * El transport és la Frontissa de sempre (../sollutia/creaFrontissa.js), sense
 * tocar-la: GET sense credencials ni redireccions, l'origen en llista blanca,
 * un sol paràmetre (`font`, o `url` per a les personals), temps i mida fitats
 * i només JSON, que un DTO tancat (decodificaFeed, decodificaFeedPersonal,
 * decodificaEstat) torna a validar. Res d'AbortSignal.timeout ni
 * AbortSignal.any (no són del baseline 2022): els posa la Frontissa amb
 * AbortController i setTimeout.
 *
 *   creaServeiNoticies({ apiOrigin, cami?, fetchImpl?, enLinia?, ara? }) → Object.freeze({
 *     fonts()                → { categories, fonts }, del catàleg (cataleg.js):
 *                              cap xarxa, i per això no falla
 *     estat()                → { disponible, personals }: GET <base>/fonts; una resposta
 *                              definitiva es guarda tota la sessió, una de passada no
 *     feed(id, { signal })   → { font, xml, obtingut, obsoleta }, o rebutja amb
 *                              un ErrorNoticies amb `motiu` (MOTIUS_NOTICIES);
 *                              una cancel·lació (ErrorDades CANCELLED) passa tal qual
 *     feedPersonal(url, { signal })
 *                            → { url, xml, obtingut, obsoleta }: una font que ha
 *                              afegit la persona, llegida pel MATEIX servei
 *                              (GET …/feed?url=<adreça>), mai pel navegador
 *     imatge(urlOriginal)    → '<base>/imatge?u=<adreça>' o null: pura, sense xarxa
 *     video(enllac)          → { proveidor: 'youtube', id, incrustacio, enllac } o null: pura
 *   })
 *
 * L'ESTAT (261024 Lector; Gemini G2-03 i R5-01; R6 L-01, Lector final). La
 * primera crida a estat() (o el primer feed) demana GET <base>/fonts. Només es
 * guarda per a tota la sessió de la pàgina una resposta DEFINITIVA:
 *   · 200 del contracte → disponible, i `personals` el que diga el servei;
 *   · 404 que NO és un error del servei (la forma sdp_noticies_*): la funció no
 *     està desplegada → NO disponible.
 * Qualsevol altra cosa és DE PASSADA (una connexió que cau, la xarxa que no
 * arriba amb el dispositiu en línia, 5 s sense resposta, 5xx, 429, un 404 del
 * servei, un sobre que no casa): val ESPERA_ESTAT_MS (30 s) i, si torna a
 * fallar, ESPERA_ESTAT_MAXIMA_MS (60 s); passat eixe temps, el feed() següent
 * (o el «Torna-ho a provar») torna a preguntar. Mentre val:
 *   · la xarxa no ha arribat → NO disponible: cada feed() i feedPersonal()
 *     rebutja tot d'una amb el motiu 'servidor', SENSE cap petició;
 *   · la resta → disponible, però sense personals (no es pot confirmar que les
 *     llija: no s'envia cap adreça; 'personals-off').
 * Així, com a molt una petició fallida per ronda, no sis, i cap fallada de
 * passada no apaga el Lector (ni les fonts personals) tota la sessió. Si la
 * xarxa no arriba perquè el dispositiu diu que està fora de línia (`enLinia()`
 * fals), el motiu és 'sense-connexio' i no es guarda gens: quan torne la xarxa,
 * es torna a preguntar.
 *
 * T5b (ordre del Mestre, 261024) · LES FONTS PERSONALS. Només s'envia una
 * adreça si estat().personals és cert; si no, 'personals-off' sense cap
 * petició (l'interruptor del servei, SDP_NOTICIES_PERSONALS, arriba així al
 * navegador: R5-01). L'adreça es comprova ací abans d'eixir
 * (adrecaPersonalDelClient): https, sense usuari ni port, com a molt
 * MAXIM_URL_PERSONAL caràcters i sense el fragment (que no viatja). Una que no
 * passa rebutja amb el motiu 'adreca' sense cap petició; la Frontissa, a més,
 * no deixa eixir cap valor de consulta de més de 512 caràcters
 * (creaFrontissa.js): tampoc no ix, i també és 'adreca'. Les personals ixen
 * d'una en una (el servei n'admet una alhora per connexió). El servei ho torna
 * a comprovar tot (i molt més: el SSRF, gestor.js). Veu quines adreces es
 * demanen, mai qui les demana: cap credencial, cap galeta.
 *
 * LES IMATGES I ELS VÍDEOS (261024 Lector). imatge() fa l'adreça del servei per
 * a una imatge d'un feed (les regles de quines servix són del servei: gestor.js);
 * NOMÉS quan l'últim estat conegut diu que el servei hi és (R6 L-08): si encara
 * no se sap, o diu que no, null, i el Lector no envia cap petició condemnada a
 * fallar. video() reconeix un enllaç de YouTube (watch?v=, youtu.be i /shorts/)
 * i en dona la incrustació sense galetes (youtube-nocookie). Totes dues són
 * pures: cap xarxa.
 *
 * `apiOrigin` és l'origen del backend segellat al paquet (capaDelPaquet), mai
 * el d'un canal de l'amfitrió: el posa la plataforma (apps/plataforma/fontServeis.js).
 * La confiança ve d'eixa capa; per això l'origen és també la llista blanca.
 *
 * EL MOTIU (motiuDe). El servei respon amb codis HTTP triats perquè cada un
 * diga una cosa (README.md d'esta carpeta):
 *   TIMEOUT (8 s ací) o 504 (l'origen ha tardat, o ha respost un 304 sense cos:
 *   origen_buit, la memòria cau de la web, no el feed) → 'temps', mai 'font'
 *   la xarxa no respon (fetch sense estat)             → 'sense-connexio'
 *   429                                                → 'limit'
 *   502 (l'origen ha caigut, no és un feed o és massa gran) → 'font'
 *   422 (una adreça personal que el servei no llig)    → 'adreca'
 *   404 (un id que el servei no coneix), 5xx, 401, 403,
 *   una resposta que no casa amb el contracte, i la resta → 'servidor'
 */
import { creaFrontissa, ErrorDades } from '../sollutia/creaFrontissa.js';
import { CATEGORIES_TERRITORIALS, FONTS_TERRITORIALS, fontsPerAlLector } from './cataleg.js';

export { ErrorDades };

/** El temps màxim d'un feed: el mateix de la Viquipèdia i de la Frontissa. El servei en dona 6 a l'origen. */
export const TEMPS_FEED_MS = 8000;
/** El temps màxim de la pregunta de l'estat (GET /fonts, una resposta menuda i en memòria del servei). */
export const TEMPS_ESTAT_MS = 5000;
/** Quant val una resposta de passada de /fonts (la primera fallada): després es torna a preguntar. */
export const ESPERA_ESTAT_MS = 30 * 1000;
/** Quant val una resposta de passada quan la pregunta anterior també havia fallat. */
export const ESPERA_ESTAT_MAXIMA_MS = 60 * 1000;
/** El text XML més llarg que s'accepta (en caràcters): el servei talla l'origen a 2 MiB. */
export const MAXIM_XML = 2 * 1024 * 1024;
/** La resposta JSON més llarga (en bytes): l'XML escapat i els camps del sobre. */
export const MAXIM_RESPOSTA = 3 * 1024 * 1024;
/** La resposta de /fonts més llarga (en bytes). */
export const MAXIM_ESTAT = 256 * 1024;
/** El camí de la funció dins del backend (Supabase Edge Functions). */
export const CAMI_NOTICIES = '/functions/v1/noticies';
export const CAPTURA_FEED = 'noticies-feed-261024';
export const CAPTURA_PERSONAL = 'noticies-personal-261024';
export const CAPTURA_ESTAT = 'noticies-fonts-261024';
/** L'adreça personal (o d'imatge) més llarga (la mateixa del servei i del nucli del Lector). */
export const MAXIM_URL_PERSONAL = 2048;
/** On s'incrusta un vídeo de YouTube: el domini sense galetes. L'únic lloc del codi amb esta adreça. */
export const INCRUSTACIO_YOUTUBE = 'https://www.youtube-nocookie.com/embed/';
/**
 * Els motius que entén el Lector (src/apps/lector/fontNoticies.js · MOTIUS_NOTICIES diu el mateix):
 * 'adreca', una adreça personal que no es llig (cap font contactada); 'personals-off', el servei
 * no llig fonts personals (cap petició).
 */
export const MOTIUS_NOTICIES = Object.freeze(['sense-connexio', 'temps', 'servidor', 'font', 'limit', 'adreca', 'personals-off']);

const PATRO_CAMI = /^\/[a-z0-9_-]+(?:\/[a-z0-9_-]+)*$/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const ID_VIDEO = /^[A-Za-z0-9_-]{11}$/;
const PREFIX_SHORTS = '/shorts/';
/* El cos d'un 404 que es mira (per saber si és del servei): els seus errors són menuts. */
const MAXIM_COS_404 = 4096;
const SENSE_SERVEI = Object.freeze({ disponible: false, personals: false });
const SENSE_PERSONALS = Object.freeze({ disponible: true, personals: false });

/** Un error del servei de notícies: `motiu` és un de MOTIUS_NOTICIES; `codi`, el de la Frontissa. */
export class ErrorNoticies extends Error {
  constructor(motiu, causa = null) {
    super(`El servei de notícies no ha pogut servir el feed (${motiu}).`);
    this.name = 'ErrorNoticies';
    this.motiu = MOTIUS_NOTICIES.includes(motiu) ? motiu : 'servidor';
    this.codi = causa instanceof ErrorDades ? causa.code : null;
  }
}

/** El motiu d'un error de la Frontissa (vegeu la capçalera). */
export function motiuDe(error) {
  if (error instanceof ErrorNoticies) return error.motiu;
  if (!(error instanceof ErrorDades)) return 'servidor';
  if (error.code === 'TIMEOUT') return 'temps';
  if (error.code !== 'UNAVAILABLE') return 'servidor';
  if (error.status == null) return 'sense-connexio';
  if (error.status === 429) return 'limit';
  if (error.status === 504) return 'temps';
  if (error.status === 502) return 'font';
  if (error.status === 422) return 'adreca';
  return 'servidor';
}

/** Una adreça https neta tal com ix cap al servei (normalitzada, sense fragment), o null. */
export function adrecaPersonalDelClient(valor) {
  if (typeof valor !== 'string' || valor.length === 0 || valor.length > MAXIM_URL_PERSONAL) return null;
  let url;
  try {
    url = new URL(valor);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !url.hostname) return null;
  url.hash = '';
  return url.href.length > MAXIM_URL_PERSONAL ? null : url.href;
}

/**
 * Un vídeo de YouTube a partir del seu enllaç, o null: només https://www.youtube.com/watch?v=<id>
 * (un sol v), https://youtu.be/<id> i https://www.youtube.com/shorts/<id> (R6 L-03: un sol tram
 * després de /shorts/, cap camí de més), amb un id d'11 caràcters. `incrustacio` és la del domini
 * sense galetes (la mateixa per a un short); `enllac`, l'enllaç net de sempre, /watch?v=<id> (sense
 * cap altre paràmetre: ni el temps ni el «si» de compartir, que rastreja).
 */
export function videoDe(enllac) {
  if (typeof enllac !== 'string' || enllac.length === 0 || enllac.length > MAXIM_URL_PERSONAL) return null;
  let url;
  try {
    url = new URL(enllac);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
  let id = null;
  if (url.hostname === 'www.youtube.com' && url.pathname === '/watch') {
    const valors = url.searchParams.getAll('v');
    id = valors.length === 1 ? valors[0] : null;
  } else if (url.hostname === 'youtu.be') {
    id = url.pathname.slice(1);
  } else if (url.hostname === 'www.youtube.com' && url.pathname.startsWith(PREFIX_SHORTS)) {
    /* La resta del camí és l'id i prou: /shorts/<id>/res o /shorts/<id>/ no passen (ID_VIDEO). */
    id = url.pathname.slice(PREFIX_SHORTS.length);
  }
  if (!id || !ID_VIDEO.test(id)) return null;
  return Object.freeze({
    proveidor: 'youtube', id, incrustacio: `${INCRUSTACIO_YOUTUBE}${id}`, enllac: `https://www.youtube.com/watch?v=${id}`
  });
}

/* El DTO del feed: exactament estos quatre camps i d'estes formes; qualsevol altra cosa
   llança, i la Frontissa ho convertix en INVALID_PAYLOAD. */
export function decodificaFeed(dto) {
  if (!dto || typeof dto !== 'object' || Array.isArray(dto)) throw new TypeError('feed: no és un objecte');
  const { font, xml, obtingut, obsoleta } = dto;
  if (typeof font !== 'string' || !font) throw new TypeError('feed: font');
  if (typeof xml !== 'string' || !xml || xml.length > MAXIM_XML) throw new TypeError('feed: xml');
  if (obtingut !== null && (typeof obtingut !== 'string' || !ISO.test(obtingut))) throw new TypeError('feed: obtingut');
  if (typeof obsoleta !== 'boolean') throw new TypeError('feed: obsoleta');
  return Object.freeze({ font, xml, obtingut, obsoleta });
}

/* T5b · El DTO d'un feed personal: { url, xml, obtingut, obsoleta }, i prou. */
export function decodificaFeedPersonal(dto) {
  if (!dto || typeof dto !== 'object' || Array.isArray(dto)) throw new TypeError('feed personal: no és un objecte');
  const { url, xml, obtingut, obsoleta } = dto;
  if (typeof url !== 'string' || !url || url.length > MAXIM_URL_PERSONAL) throw new TypeError('feed personal: url');
  if (typeof xml !== 'string' || !xml || xml.length > MAXIM_XML) throw new TypeError('feed personal: xml');
  if (obtingut !== null && (typeof obtingut !== 'string' || !ISO.test(obtingut))) throw new TypeError('feed personal: obtingut');
  if (typeof obsoleta !== 'boolean') throw new TypeError('feed personal: obsoleta');
  return Object.freeze({ url, xml, obtingut, obsoleta });
}

/* El DTO de /fonts, per a l'estat: un objecte amb categories i fonts (el contracte), i `personals`
   només si és exactament cert (un servei d'abans del T5b no el porta: cap personal). */
export function decodificaEstat(dto) {
  if (!dto || typeof dto !== 'object' || Array.isArray(dto) || !Array.isArray(dto.categories) || !Array.isArray(dto.fonts)) {
    throw new TypeError('estat: no és el sobre de /fonts');
  }
  return dto.personals === true ? Object.freeze({ disponible: true, personals: true }) : SENSE_PERSONALS;
}

/* Si un 404 porta un error del servei (la forma de WP REST, sdp_noticies_*): llig com a molt
   MAXIM_COS_404 bytes; un cos més llarg, o que no s'entén, no és del servei. Mai llança. */
async function esErrorDelServei(resposta) {
  try {
    if (!/json/i.test(resposta.headers.get('content-type') || '') || !resposta.body?.getReader) return false;
    const lector = resposta.body.getReader();
    const trossos = [];
    let total = 0;
    try {
      while (true) {
        const { done, value } = await lector.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAXIM_COS_404) return false;
        trossos.push(value);
      }
    } finally {
      lector.cancel().catch(() => {});
    }
    const bytes = new Uint8Array(total);
    let posicio = 0;
    for (const tros of trossos) {
      bytes.set(tros, posicio);
      posicio += tros.byteLength;
    }
    const cos = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    return typeof cos?.code === 'string' && /^sdp_noticies_[a-z_]+$/.test(cos.code);
  } catch {
    return false;
  }
}

/* Espera una promesa que no es rebutja mai, o el senyal: avortat, CANCELLED. */
function ambSenyal(promesa, signal) {
  if (signal?.aborted) return Promise.reject(new ErrorDades('CANCELLED'));
  if (!signal) return promesa;
  return new Promise((resol, rebutja) => {
    const avorta = () => rebutja(new ErrorDades('CANCELLED'));
    signal.addEventListener('abort', avorta, { once: true });
    promesa.then(resol, rebutja).finally(() => signal.removeEventListener('abort', avorta));
  });
}

export function creaServeiNoticies({
  apiOrigin,
  cami = CAMI_NOTICIES,
  fetchImpl = (url, init) => globalThis.fetch(url, init),
  enLinia = () => globalThis.navigator?.onLine !== false,
  ara = () => Date.now(),
  categories = CATEGORIES_TERRITORIALS,
  fonts = FONTS_TERRITORIALS
} = {}) {
  if (typeof cami !== 'string' || !PATRO_CAMI.test(cami)) throw new ErrorDades('INVALID_RESOURCE');
  let origen;
  try {
    origen = new URL(apiOrigin).origin;
  } catch {
    throw new ErrorDades('INVALID_ORIGIN');
  }
  const llig = creaFrontissa({
    apiOrigin: `${origen}/`,
    allowedOrigins: [origen],
    fetchImpl,
    resources: {
      feed: {
        enabled: true,
        captureId: CAPTURA_FEED,
        path: `${cami}/feed`,
        params: ['font'],
        maxBytes: MAXIM_RESPOSTA,
        timeoutMs: TEMPS_FEED_MS,
        decode: decodificaFeed
      },
      personal: {
        enabled: true,
        captureId: CAPTURA_PERSONAL,
        path: `${cami}/feed`,
        params: ['url'],
        maxBytes: MAXIM_RESPOSTA,
        timeoutMs: TEMPS_FEED_MS,
        decode: decodificaFeedPersonal
      }
    }
  });
  /* L'estat té la seua Frontissa: la mateixa, amb un fetch que, en un 404, mira si el cos és un
     error del servei (la Frontissa no llig mai el cos d'un error) i el torna buit. */
  let darrer404DelServei = false;
  const lligEstat = creaFrontissa({
    apiOrigin: `${origen}/`,
    allowedOrigins: [origen],
    fetchImpl: async (url, init) => {
      const resposta = await fetchImpl(url, init);
      if (resposta.status !== 404) return resposta;
      darrer404DelServei = await esErrorDelServei(resposta);
      return new Response(null, { status: 404, statusText: resposta.statusText, headers: resposta.headers });
    },
    resources: {
      fonts: {
        enabled: true,
        captureId: CAPTURA_ESTAT,
        path: `${cami}/fonts`,
        params: [],
        maxBytes: MAXIM_ESTAT,
        timeoutMs: TEMPS_ESTAT_MS,
        decode: decodificaEstat
      }
    }
  });
  const coneguts = new Set(fonts.map((font) => font.id));
  const delLector = Object.freeze({
    categories: Object.freeze(categories.map((categoria) => Object.freeze({ ...categoria }))),
    fonts: fontsPerAlLector(fonts)
  });

  /* La pregunta de l'estat: { estat, motiu, definitiva, fora }. No es rebutja mai. Definitiva,
     només un 200 del contracte o un 404 que no és del servei (vegeu la capçalera). */
  async function sondeja() {
    darrer404DelServei = false;
    try {
      return { estat: await lligEstat('fonts'), motiu: null, definitiva: true, fora: false };
    } catch (error) {
      if (error instanceof ErrorDades && error.code === 'UNAVAILABLE') {
        if (error.status == null) {
          let fora = false;
          try {
            fora = enLinia() === false;
          } catch {
            fora = false;
          }
          return { estat: SENSE_SERVEI, motiu: fora ? 'sense-connexio' : 'servidor', definitiva: false, fora };
        }
        if (error.status === 404 && !darrer404DelServei) return { estat: SENSE_SERVEI, motiu: 'servidor', definitiva: true, fora: false };
      }
      return { estat: SENSE_PERSONALS, motiu: null, definitiva: false, fora: false };
    }
  }

  /* La memòria de l'estat: { promesa, fins } (fins: null mentre la pregunta va de camí, Infinity per
     a una resposta definitiva, l'instant en què caduca per a una de passada). `estatConegut`: el de
     l'última resposta, o null si encara no n'hi ha cap (el llig imatge(), que no fa xarxa). */
  let sondeig = null;
  let fallades = 0;
  let estatConegut = null;
  function sondeigDeLaSessio() {
    if (sondeig && (sondeig.fins === null || ara() < sondeig.fins)) return sondeig.promesa;
    const entrada = { promesa: sondeja(), fins: null };
    sondeig = entrada;
    entrada.promesa.then((resultat) => {
      if (sondeig !== entrada) return;
      estatConegut = resultat.estat;
      if (resultat.definitiva) {
        fallades = 0;
        entrada.fins = Infinity;
      } else if (resultat.fora) {
        /* Fora de línia: no es guarda gens; quan torne la xarxa, es torna a preguntar. */
        sondeig = null;
      } else {
        fallades += 1;
        entrada.fins = ara() + (fallades > 1 ? ESPERA_ESTAT_MAXIMA_MS : ESPERA_ESTAT_MS);
      }
    });
    return entrada.promesa;
  }

  /* L'estat abans d'una petició: sense servei, el motiu i cap petició. */
  async function servei(signal) {
    if (signal?.aborted) throw new ErrorDades('CANCELLED');
    const { estat, motiu } = await ambSenyal(sondeigDeLaSessio(), signal);
    if (!estat.disponible) throw new ErrorNoticies(motiu || 'servidor');
    return estat;
  }

  /* Les personals, d'una en una: la següent espera que acabe l'anterior (o el seu senyal). */
  let cuaPersonal = Promise.resolve();
  async function enTorn(fer, signal) {
    const anterior = cuaPersonal;
    let allibera;
    cuaPersonal = new Promise((resol) => { allibera = resol; });
    try {
      await ambSenyal(anterior, signal);
      return await fer();
    } finally {
      /* Si este no ha arribat a eixir (avortat a la cua), el següent encara espera l'anterior. */
      anterior.then(allibera);
    }
  }

  return Object.freeze({
    async fonts() {
      return delLector;
    },

    async estat() {
      return (await sondeigDeLaSessio()).estat;
    },

    async feed(id, { signal } = {}) {
      /* Un id que el catàleg no porta no ix mai del navegador. */
      if (typeof id !== 'string' || !coneguts.has(id)) throw new ErrorNoticies('font');
      await servei(signal);
      let dto;
      try {
        dto = await llig('feed', { font: id }, { signal });
      } catch (error) {
        if (error instanceof ErrorDades && error.code === 'CANCELLED') throw error;
        throw new ErrorNoticies(motiuDe(error), error);
      }
      if (dto.font !== id) throw new ErrorNoticies('servidor');
      return dto;
    },

    async feedPersonal(adreca, { signal } = {}) {
      /* Una adreça que no és https neta no ix mai del navegador. */
      const url = adrecaPersonalDelClient(adreca);
      if (!url) throw new ErrorNoticies('adreca');
      const estat = await servei(signal);
      if (!estat.personals) throw new ErrorNoticies('personals-off');
      let dto;
      try {
        dto = await enTorn(() => llig('personal', { url }, { signal }), signal);
      } catch (error) {
        if (error instanceof ErrorDades && error.code === 'CANCELLED') throw error;
        /* La Frontissa no deixa eixir cap valor de més de 512 caràcters: tampoc ix. */
        if (error instanceof ErrorDades && error.code === 'INVALID_QUERY') throw new ErrorNoticies('adreca', error);
        throw new ErrorNoticies(motiuDe(error), error);
      }
      if (dto.url !== url) throw new ErrorNoticies('servidor');
      return dto;
    },

    imatge(urlOriginal) {
      /* Sense un estat que diga que el servei hi és, cap adreça: la petició fallaria segur (L-08). */
      if (!estatConegut?.disponible) return null;
      const href = adrecaPersonalDelClient(urlOriginal);
      if (!href) return null;
      const adreca = new URL(`${cami}/imatge`, origen);
      adreca.searchParams.set('u', href);
      return adreca.href;
    },

    video(enllac) {
      return videoDe(enllac);
    }
  });
}
