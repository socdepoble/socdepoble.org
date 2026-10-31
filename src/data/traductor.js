/**
 * traductor.js — El Traductor Sobirà (ordre del Mestre, 260930 · via B).
 *
 * Client NEUTRE del servei de traducció que oferix l'amfitrió. No sap res del
 * proveïdor (DeepL) ni de l'amfitrió (WordPress): només el contracte acordat
 * amb Codex (auditoria 260930_2150, ronda D1, que accepta el lot proposat a
 * l'auditoria 260930_2145 amb dues esmenes):
 *   POST {url}  { textos: string[], desti, origen: 'CA', format: 'text'|'html' }
 *   200 → { traduccions: string[], origen: 'CA', desti, cache: boolean }
 *   error → { code, message, data: { status } }, el format de WP REST.
 * Esmena 1 de Codex: servei públic amb pressupost al servidor, sense nonce ni
 * galetes (credentials: 'omit'). Esmena 2: l'URL arriba per externalConfig
 * (traductorUrl), i no hi ha cap traductor-nonce.
 * La clau i l'URL del proveïdor no ixen mai del servidor: ací no n'hi ha cap.
 * Si demà un altre amfitrió (Sollutia) oferix el mateix contracte, n'hi ha
 * prou de canviar l'URL (Model B). La vista tria el missatge pel codi, mai
 * pel text del servidor (errorsBackend.js).
 */
import { CODI_BACKEND_INABASTABLE } from './errorsBackend.js';

export const ORIGEN_TRADUCCIO = 'CA';

/* La llista TANCADA de destins: el servidor rebutja qualsevol altre valor.
   `cap` és com ho diu una frase («Traduint al castellà…») i `lang` va a
   l'atribut lang del text traduït (lector de pantalla, guionat).
   Ordre del Mestre (261030 01:30): el gallec i el basc, literals. L'ordre del
   menú és el d'esta llista: el castellà, les altres llengües cooficials
   (gallec i basc) i després l'anglés, el francés i l'alemany, com abans. */
export const LLENGUES_TRADUCCIO = Object.freeze([
  Object.freeze({ codi: 'ES', nom: 'Castellà', cap: 'al castellà', lang: 'es' }),
  Object.freeze({ codi: 'GL', nom: 'Gallec', cap: 'al gallec', lang: 'gl' }),
  Object.freeze({ codi: 'EU', nom: 'Basc', cap: 'al basc', lang: 'eu' }),
  Object.freeze({ codi: 'EN-GB', nom: 'Anglés', cap: 'a l’anglés', lang: 'en-GB' }),
  Object.freeze({ codi: 'FR', nom: 'Francés', cap: 'al francés', lang: 'fr' }),
  Object.freeze({ codi: 'DE', nom: 'Alemany', cap: 'a l’alemany', lang: 'de' }),
]);

export const llenguaDeTraduccio = (codi) => LLENGUES_TRADUCCIO.find((llengua) => llengua.codi === codi) || null;

/* Gauntlet 261030 (Fase 3, TC3.1; traduir-eu-de-servidor-503) · Els destins
   que l'amfitrió declara que servix (`traductor-llengues`: marcatge.php a
   WordPress, el connector de desenvolupament a main.jsx). Una cadena separada
   per blancs ('ES GL EN-GB FR') o un array; només els codis exactes de
   LLENGUES_TRADUCCIO, sense repetits i en l'ordre declarat. Torna un array
   congelat o undefined (sense res vàlid): un amfitrió que no en declara cap
   es queda com abans. */
const LIMIT_TEXT_DESTINS = 128;
export function sanejaDestinsDeclarats(valor) {
  let candidats;
  if (typeof valor === 'string') {
    if (valor.length > LIMIT_TEXT_DESTINS) return undefined;
    candidats = valor.trim().split(/\s+/);
  } else if (Array.isArray(valor)) {
    candidats = valor.slice(0, LLENGUES_TRADUCCIO.length * 2);
  } else {
    return undefined;
  }
  const codis = [];
  for (const codi of candidats) {
    if (typeof codi === 'string' && llenguaDeTraduccio(codi) && !codis.includes(codi)) codis.push(codi);
  }
  return codis.length ? Object.freeze(codis) : undefined;
}

/* Els límits del servidor per petició (wordpress-plugin/includes/traduccio.php,
   ronda D1): 50 textos, 5000 caràcters Unicode i 20000 bytes de text entre
   tots, i 32768 bytes de cos JSON (ací, amb marge per a la resta del cos).
   `lots`: les peticions seguides que una pàgina pot gastar. El servidor
   compta 30 peticions cada 10 minuts per client i 10000 caràcters al dia:
   `caractersPagina` és eixe pressupost diari. Una pàgina més llarga no es
   traduïx a mitges ni s'emporta el pressupost de tot el poble (ronda C9-2:
   4 lots de 5000 en permetien 20000, el doble del que el servidor dona). */
export const LIMITS_TRADUCCIO = Object.freeze({
  textos: 50, caracters: 5000, bytes: 20000, json: 32000, lots: 4, caractersPagina: 10000
});

const FORMATS = new Set(['text', 'html']);

/** Codis neutrals dels errors. Van a `error.codi`; la vista hi posa el missatge. */
export const CODI_TRADUCCIO = Object.freeze({
  NO_DISPONIBLE: 'traduccio-no-disponible',
  PETICIO_INVALIDA: 'traduccio-peticio-invalida',
  MASSA_LLARGA: 'traduccio-massa-llarga',
  SERVIDOR: 'traduccio-servidor',
  RESPOSTA_INVALIDA: 'traduccio-resposta-invalida',
  INABASTABLE: CODI_BACKEND_INABASTABLE,
  CANCELLADA: 'traduccio-cancellada',
});

/** Error tipat: `codi` (CODI_TRADUCCIO), `status` HTTP i `codiServidor`
 *  (el `code` de WP REST, p. ex. 'sdp_traduccio_limit'). El missatge és el
 *  codi: cap text del servidor ni del proveïdor puja cap a la vista. */
export class ErrorTraductor extends Error {
  constructor(codi, { status = null, codiServidor = null, cause } = {}) {
    super(codi);
    this.name = 'ErrorTraductor';
    this.codi = codi;
    this.status = status;
    this.codiServidor = codiServidor;
    if (cause !== undefined) this.cause = cause;
  }
}

/** Caràcters Unicode (punts de codi), com els compta el servidor (preg_match_all('/./us')). */
export const caractersDe = (text) => Array.from(String(text)).length;

/** Bytes UTF-8, sense dependre de TextEncoder. */
export function bytesDe(text) {
  let bytes = 0;
  for (const car of String(text)) {
    const cp = car.codePointAt(0);
    bytes += cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
  }
  return bytes;
}

/**
 * L'URL del servei si és del MATEIX origen que la pàgina (http o https, sense
 * credencials a l'URL); si no, ''. Res de fetch a dominis externs: la guarda
 * de configAmfitrio (Codex) ja ho filtra, i esta és la segona porta.
 */
export function urlDeServei(url) {
  if (typeof url !== 'string' || !url.trim()) return '';
  const lloc = globalThis.location;
  try {
    const adreca = new URL(url.trim(), lloc?.href);
    if (adreca.protocol !== 'https:' && adreca.protocol !== 'http:') return '';
    if (adreca.username || adreca.password) return '';
    if (lloc?.origin && adreca.origin !== lloc.origin) return '';
    return adreca.href;
  } catch {
    return '';
  }
}

/**
 * Parteix un text massa llarg per a una sola petició en trossos de com a molt
 * `maxim` caràcters, tallant en un espai si n'hi ha cap. Un text curt torna tal qual.
 */
export function partixText(text, maxim = LIMITS_TRADUCCIO.caracters) {
  const punts = Array.from(String(text));
  if (punts.length <= maxim) return [String(text)];
  const trossos = [];
  let inici = 0;
  while (inici < punts.length) {
    let fi = Math.min(inici + maxim, punts.length);
    if (fi < punts.length) {
      const espai = punts.lastIndexOf(' ', fi - 1);
      if (espai > inici) fi = espai + 1;
    }
    trossos.push(punts.slice(inici, fi).join(''));
    inici = fi;
  }
  return trossos;
}

/**
 * Agrupa els textos en lots que respecten els límits del servidor, en ordre.
 * null si un text tot sol no hi cap (qui crida l'ha de partir abans).
 */
export function partixEnLots(textos, limits = LIMITS_TRADUCCIO) {
  const lots = [];
  let lot = [];
  let caracters = 0;
  let bytes = 0;
  let json = 0;
  for (const text of textos) {
    const c = caractersDe(text);
    const b = bytesDe(text);
    const j = bytesDe(JSON.stringify(text)) + 1;
    if (c > limits.caracters || b > limits.bytes || j > limits.json) return null;
    if (lot.length && (lot.length >= limits.textos || caracters + c > limits.caracters
      || bytes + b > limits.bytes || json + j > limits.json)) {
      lots.push(lot);
      lot = [];
      caracters = 0;
      bytes = 0;
      json = 0;
    }
    lot.push(text);
    caracters += c;
    bytes += b;
    json += j;
  }
  if (lot.length) lots.push(lot);
  return lots;
}

const esAvortament = (error, signal) => error?.name === 'AbortError' || signal?.aborted === true;

/* C7 (Codex 261030) · El termini propi d'una petició al servidor. El servidor
   (dev i PHP) gasta com a molt 30 s per petició (12 s per crida al
   proveïdor, decisió del Mestre 261030 §2): el client espera un poc més i
   després talla, perquè la pàgina no es quede «Traduint…» per sempre. */
export const TERMINI_TRADUCCIO = 40000;

/**
 * composaSenyal(signal, termini) · Un AbortSignal propi que s'avorta quan
 * s'avorta el de fora (cancel·lació humana: canvi de pàgina o de llengua) o
 * quan passa el termini, i diu quin dels dos ha sigut (`motiu()`:
 * 'cancellada', 'termini' o null). `dins(promesa)` fa que una promesa que no
 * escolta cap senyal (la lectura del cos JSON d'un fetch fals, per exemple)
 * també es talle. `allibera()` va sempre en un finally: lleva el temporitzador
 * i els oients. La comparteix el transport lliure (traductorLliure.js).
 */
export function composaSenyal(signal, termini) {
  const control = new AbortController();
  let motiu = null;
  let rebutja = null;
  const avortat = new Promise((_, rebuig) => { rebutja = rebuig; });
  avortat.catch(() => {});
  const enAvortar = () => rebutja(new DOMException('Aborted', 'AbortError'));
  control.signal.addEventListener('abort', enAvortar, { once: true });
  const cancella = () => { motiu ??= 'cancellada'; control.abort(); };
  if (signal?.aborted) cancella();
  else signal?.addEventListener('abort', cancella, { once: true });
  const rellotge = setTimeout(() => { motiu ??= 'termini'; control.abort(); }, termini);
  return {
    signal: control.signal,
    motiu: () => motiu,
    dins: (promesa) => Promise.race([promesa, avortat]),
    allibera() {
      clearTimeout(rellotge);
      signal?.removeEventListener('abort', cancella);
      control.signal.removeEventListener('abort', enAvortar);
    },
  };
}

/**
 * creaTraductor({ url, fetch, termini }) → { disponible, admetHtml, tradueix(textos, desti, { format, signal }) }.
 * Sense URL vàlida (socdepoble.org, sense amfitrió que oferisca el servei),
 * `disponible` és false i `tradueix` llança NO_DISPONIBLE sense cap petició.
 * `tradueix` fa UNA petició (un lot) i valida la resposta: mateix ordre i
 * mateixa longitud que `textos`, només cadenes, i el mateix destí.
 * C7 · Cada petició té el seu termini (`termini`, TERMINI_TRADUCCIO per
 * defecte), que cobrix també la lectura del cos: passat, INABASTABLE amb
 * l'estat 0; la cancel·lació de fora és CANCELLADA. El servidor accepta
 * `format: 'html'` (contracte D1), i per això `admetHtml` diu sí.
 */
export function creaTraductor({ url, fetch: fetchPropi, termini = TERMINI_TRADUCCIO } = {}) {
  const adreca = urlDeServei(url);
  /* El fetch global es llig en cada petició, no en crear el client: el client
     viu en un useMemo i un fetch substituït després (proves, un polyfill)
     no s'ha de quedar vell. */
  const fer = (opcions) => (fetchPropi ? fetchPropi(adreca, opcions) : globalThis.fetch(adreca, opcions));
  const disponible = Boolean(adreca && (fetchPropi || typeof globalThis.fetch === 'function'));

  async function tradueix(textos, desti, { format = 'text', signal } = {}) {
    if (!disponible) throw new ErrorTraductor(CODI_TRADUCCIO.NO_DISPONIBLE);
    const valids = Array.isArray(textos) && textos.length > 0 && textos.length <= LIMITS_TRADUCCIO.textos
      && textos.every((text) => typeof text === 'string');
    if (!valids || !llenguaDeTraduccio(desti) || !FORMATS.has(format)) {
      throw new ErrorTraductor(CODI_TRADUCCIO.PETICIO_INVALIDA);
    }
    if (signal?.aborted) throw new ErrorTraductor(CODI_TRADUCCIO.CANCELLADA);
    const senyal = composaSenyal(signal, termini);
    /* El motiu propi mana: un AbortError que arriba després del termini no
       és una cancel·lació de la persona. */
    const errorDAvortament = (error) => {
      if (senyal.motiu() === 'termini') return new ErrorTraductor(CODI_TRADUCCIO.INABASTABLE, { status: 0, cause: error });
      if (senyal.motiu() === 'cancellada' || esAvortament(error, signal)) {
        return new ErrorTraductor(CODI_TRADUCCIO.CANCELLADA, { cause: error });
      }
      return null;
    };
    try {
      let resposta;
      try {
        resposta = await senyal.dins(fer({
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ textos, desti, origen: ORIGEN_TRADUCCIO, format }),
          // Esmena 1 de Codex (D1): públic, sense galetes ni nonce de WordPress.
          credentials: 'omit',
          cache: 'no-store',
          signal: senyal.signal,
        }));
      } catch (error) {
        throw errorDAvortament(error) ?? new ErrorTraductor(CODI_TRADUCCIO.INABASTABLE, { status: 0, cause: error });
      }
      let cos = null;
      try {
        cos = await senyal.dins(resposta.json());
      } catch (error) {
        const avortament = errorDAvortament(error);
        if (avortament) throw avortament;
        cos = null;
      }
      if (!resposta.ok) {
        throw new ErrorTraductor(CODI_TRADUCCIO.SERVIDOR, {
          status: resposta.status,
          codiServidor: typeof cos?.code === 'string' ? cos.code : null,
        });
      }
      const traduccions = cos?.traduccions;
      const bona = Array.isArray(traduccions) && traduccions.length === textos.length
        && traduccions.every((text) => typeof text === 'string')
        && (cos.desti === undefined || cos.desti === desti);
      if (!bona) throw new ErrorTraductor(CODI_TRADUCCIO.RESPOSTA_INVALIDA, { status: resposta.status });
      return { traduccions: [...traduccions], desti, cache: cos.cache === true };
    } finally {
      senyal.allibera();
    }
  }

  return Object.freeze({ disponible, admetHtml: () => true, tradueix });
}

/* Decisió del Mestre (261030 §3) · Els noms propis no es traduïxen: Apertium
   fa «Sóc de Pueblo», «YAYA Maria», «Piedra Seca», «Gente de la Torre» i, en
   gallec, «no Casarío» per «al Mas»; MyMemory fa «TANTE MarIA» en alemany
   (mesura en viu del 261030, frases inventades). Abans d'enviar-lo, cada nom
   es canvia per una marca que cap motor no traduïx (ZSDPAZ…ZSDPEZ: les cinc
   mesures la tornen intacta, amb la preposició bona: «no ZSDPEZ», «ZSDPBZ-ra»)
   i, en tornar, la marca torna a ser el nom. De «el Mas» només es protegix
   «Mas»: l'article es traduïx («the Mas»).
   Gauntlet 261030 (cicle 2, noms-propis-iaia-sola-sense-proteccio) · La
   IAIA i MarIA soles també són noms: Apertium fa «Mantenimiento de la YAYA»
   i «Parla con Maria». Van després de «IAIA MarIA» (que casa primer, sencer)
   i amb marques pròpies, ZSDPFZ i ZSDPGZ. Mesura en viu del 261030 (frase
   inventada): cat|spa, cat|glg, cat|eng, cat|fra i ca|de les tornen
   intactes; ca|eu canvia ZSDPGZ per ZSDPFZ, i restauraNoms ho detecta i
   deixa eixe text en l'original. Ampliació de la llista literal del Mestre
   (§3): l'ha de ratificar ell. */
export const NOMS_PROPIS = Object.freeze(['Sóc de Poble', 'Gent de la Torre', 'IAIA MarIA', 'Pedra Seca', 'IAIA', 'MarIA']);
const NOM_MAS = 'Mas';
/* Cada nom, la seua marca. La del Mas (ZSDPEZ) es queda on era. */
const MARCA_DE_NOM = Object.freeze({
  'Sóc de Poble': 'ZSDPAZ', 'Gent de la Torre': 'ZSDPBZ', 'IAIA MarIA': 'ZSDPCZ', 'Pedra Seca': 'ZSDPDZ', IAIA: 'ZSDPFZ', MarIA: 'ZSDPGZ'
});
const MARCA_MAS = 'ZSDPEZ';
const NOM_DE_MARCA = Object.freeze(Object.fromEntries([...Object.entries(MARCA_DE_NOM).map(([nom, marca]) => [marca, nom]), [MARCA_MAS, NOM_MAS]]));
const RE_MARCA = /ZSDP[A-Y]+Z/g;
const escapaRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const RE_NOMS = new RegExp(`(^|[^\\p{L}\\p{N}])(${NOMS_PROPIS.map(escapaRe).join('|')})(?![\\p{L}\\p{N}])`, 'gu');
const RE_MAS = /(^|[^\p{L}\p{N}])((?:[Ee]l|[Dd]el|[Aa]l|[Pp]el) )Mas(?![\p{L}\p{N}])/gu;

/** Un text amb els noms propis canviats per marques. Un text que ja porta
 *  alguna cosa amb forma de marca no es toca (la tornada seria ambigua). */
export function protegixNoms(text) {
  const original = String(text);
  RE_MARCA.lastIndex = 0;
  if (RE_MARCA.test(original)) return original;
  return original
    .replace(RE_NOMS, (_, abans, nom) => `${abans}${MARCA_DE_NOM[nom]}`)
    .replace(RE_MAS, (_, abans, article) => `${abans}${article}${MARCA_MAS}`);
}

const comptaMarques = (text) => {
  const compte = new Map();
  for (const marca of String(text).match(RE_MARCA) || []) compte.set(marca, (compte.get(marca) || 0) + 1);
  return compte;
};

/**
 * La traducció amb les marques tornades als noms, o null si el motor n'ha
 * perdut, n'ha afegit o n'ha canviat cap: aleshores no se sap on anava el nom
 * i qui crida conserva l'original (cap paraula perduda).
 */
export function restauraNoms(traduit, protegit) {
  const abans = comptaMarques(protegit);
  const despres = comptaMarques(traduit);
  if (abans.size !== despres.size) return null;
  for (const [marca, quantes] of abans) if (despres.get(marca) !== quantes) return null;
  if (!abans.size) return String(traduit);
  return String(traduit).replace(RE_MARCA, (marca) => NOM_DE_MARCA[marca] ?? marca);
}

/**
 * Traduïx tots els textos d'una pàgina amb el mínim de peticions, una darrere
 * de l'altra: el servidor respon 503 «ocupat» a dos lots alhora del mateix
 * client. Un text massa llarg es parteix i es torna a ajuntar. Si la pàgina
 * passa de `limits.caractersPagina` caràcters o necessita més de
 * `limits.lots` peticions, MASSA_LLARGA sense cap petició.
 * La primera fallada ho para tot: mai es torna una traducció a mitges.
 *
 * C4 (Codex 261030) · Cada element de `textos` és una cadena (text pla) o
 * `{ text, format: 'html' }`: un bloc amb enllaços o negretes que
 * blocsTraduibles ha reconstruït en local, sense cap atribut de l'original.
 * Els de text van primer i els HTML després, cada tanda en el seu format;
 * entre totes dues no passen de `limits.lots`. Un bloc HTML no es parteix.
 * Decisió §3 · Els noms propis van protegits (protegixNoms); si el motor en
 * perd la marca, eixe text torna en l'original. Un transport amb pressupost
 * propi (traductorLliure: MyMemory, 4500 caràcters al dia) el comprova amb
 * `comprovaPagina` ABANS de cap petició.
 * Gauntlet 261030 (cicle 2) · `enOriginal(index)`, opcional, rep cada text
 * que torna en l'original: el motor l'ha tornat tal com l'ha rebut (no l'ha
 * traduït) o n'ha perdut un nom. Qui pinta hi posa el lang de l'original.
 */
export async function tradueixTot(traductor, textos, desti, { signal, limits = LIMITS_TRADUCCIO, enOriginal = null } = {}) {
  const peticions = textos.map((element) => (typeof element === 'string'
    ? { original: element, format: 'text' }
    : { original: String(element?.text ?? ''), format: element?.format === 'html' ? 'html' : 'text' }));
  const total = peticions.reduce((suma, { original }) => suma + caractersDe(original), 0);
  if (Number.isFinite(limits.caractersPagina) && total > limits.caractersPagina) {
    throw new ErrorTraductor(CODI_TRADUCCIO.MASSA_LLARGA);
  }
  for (const peticio of peticions) peticio.text = protegixNoms(peticio.original);
  traductor.comprovaPagina?.(peticions.map(({ text, format }) => ({ text, format })), desti);
  const tandes = [];
  for (const format of FORMATS) {
    const peces = [];
    const mapa = [];
    for (const [index, peticio] of peticions.entries()) {
      if (peticio.format !== format) continue;
      const trossos = format === 'text' ? partixText(peticio.text, limits.caracters) : [peticio.text];
      mapa.push([index, peces.length, trossos.length]);
      peces.push(...trossos);
    }
    if (!peces.length) continue;
    const lots = partixEnLots(peces, limits);
    if (!lots) throw new ErrorTraductor(CODI_TRADUCCIO.PETICIO_INVALIDA);
    tandes.push({ format, lots, mapa });
  }
  if (tandes.reduce((suma, { lots }) => suma + lots.length, 0) > limits.lots) {
    throw new ErrorTraductor(CODI_TRADUCCIO.MASSA_LLARGA);
  }
  const eixida = new Array(peticions.length);
  for (const { format, lots, mapa } of tandes) {
    const traduides = [];
    for (const lot of lots) {
      const { traduccions } = await traductor.tradueix(lot, desti, { format, signal });
      traduides.push(...traduccions);
    }
    for (const [index, inici, quants] of mapa) {
      eixida[index] = quants === 1
        ? traduides[inici]
        : traduides.slice(inici, inici + quants).map((tros) => tros.trim()).join(' ');
    }
  }
  return peticions.map(({ original, text }, index) => {
    const restaurat = text === original ? eixida[index] : restauraNoms(eixida[index], text);
    if (restaurat === null || eixida[index] === text) {
      if (typeof enOriginal === 'function') enOriginal(index);
      return original;
    }
    return restaurat;
  });
}
