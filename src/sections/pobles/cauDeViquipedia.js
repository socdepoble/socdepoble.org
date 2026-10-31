/**
 * cauDeViquipedia.js · Fase 3a de l'eina de pobles nous (disseny
 * nit/viquipedia_disseny.md §4.5) · La memòria cau local de les propostes
 * que la Viquipèdia ha tornat per a cada poble, perquè no s'hagen de tornar a
 * demanar. Viu en este navegador i en cap altre lloc: la base IndexedDB
 * `sdp-viquipedia` (magatzemLocal.js · creaMagatzemIdb), sense bloqueig de
 * pestanya (qualsevol en pot escriure) i, en navegació privada, en memòria.
 *
 *   · Clau: fitxaDelPoble.js · clauDeViquipedia (slug, província, versió).
 *   · Llista blanca: només `clau`, `llegitEl` i un DTO net. Cap camp
 *     desconegut, cap `chat` (es deriva), i les URL només dels orígens de
 *     Wikimedia que toquen: la cau acaba en `src` i `href`.
 *   · Vida: 30 dies per a 'complet' i 'parcial', 7 per a 'sense-article'
 *     (algú pot escriure l'article); 'no-disponible' no es desa mai.
 *   · Fitada a 200 entrades: en desar se'n van les més velles.
 *
 * Diferit: només l'importen el panell (PanellDeViquipedia.jsx) i, quan hi ha
 * alguna fitxa incompleta, usePobleHidratat.js. Amb la llavor no s'obri mai.
 */
import { creaMagatzemIdb } from '../../utils/magatzemLocal.js';
import { MAXIM_LEMA } from '../../data/limitsText.js';

export const NOM_BD = 'sdp-viquipedia';
export const STORE = 'propostes';
export const MAXIM_ENTRADES = 200;
const DIA_MS = 24 * 60 * 60 * 1000;
export const VIDA_MS = Object.freeze({ complet: 30 * DIA_MS, parcial: 30 * DIA_MS, 'sense-article': 7 * DIA_MS });

const ORIGENS_IMATGE = Object.freeze(['upload.wikimedia.org', 'thumb.wikimedia.org']);
const ORIGENS_FONT = Object.freeze(['commons.wikimedia.org']);
/* Auditoria matinal de Gemini, 261030 (MITJÀ-02) · L'enllaç de la llicència
   d'una foto és text de Commons (LicenseUrl, recursos.js) i acaba en un
   `href`: només de Creative Commons o de la mateixa Commons. */
const ORIGENS_LLICENCIA = Object.freeze(['creativecommons.org', 'www.creativecommons.org', 'commons.wikimedia.org']);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const QID = /^Q[1-9]\d*$/;

const falla = (que) => { throw new TypeError(`Entrada de la Viquipèdia no vàlida: ${que}.`); };

function text(valor, maxim, que, { buit = true } = {}) {
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== 'string' || Array.from(valor).length > maxim) falla(que);
  if (!buit && !valor.trim()) falla(que);
  return valor;
}

function nombre(valor, [minim, maxim], que) {
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < minim || valor > maxim) falla(que);
  return valor;
}

/* Una URL https d'un dels orígens permesos (o de qualsevol, amb `origens`
   null), sense credencials. Cap javascript:, cap http:. */
function url(valor, origens, que) {
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== 'string' || valor.length > 2048) falla(que);
  let llegida;
  try {
    llegida = new URL(valor);
  } catch {
    return falla(que);
  }
  if (llegida.protocol !== 'https:'
    || llegida.username || llegida.password || (origens && !origens.includes(llegida.hostname))) falla(que);
  return valor;
}

/* Una adreça que no és https, o amb credencials, tomba l'entrada com
   qualsevol altra URL; una https d'un altre lloc, no: la llicència es mostra
   sense enllaç (el crèdit sencer és a la pàgina del fitxer, fontUrl), com fa
   recursos.js amb una LicenseUrl que no és https. */
function urlDeLlicencia(valor, que) {
  const neta = url(valor, null, que);
  return neta && ORIGENS_LLICENCIA.includes(new URL(neta).hostname) ? neta : null;
}

function imatge(valor, que) {
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== 'object' || Array.isArray(valor)) falla(que);
  const amplada = nombre(valor.amplada, [1, 100000], `${que}.amplada`);
  const alcada = nombre(valor.alcada, [1, 100000], `${que}.alcada`);
  if (amplada === null || alcada === null) falla(`${que} sense mides`);
  return Object.freeze({
    src: url(valor.src, ORIGENS_IMATGE, `${que}.src`) ?? falla(`${que}.src`),
    fitxer: text(valor.fitxer, 255, `${que}.fitxer`, { buit: false }) ?? falla(`${que}.fitxer`),
    amplada,
    alcada,
    autor: text(valor.autor, 200, `${que}.autor`),
    llicencia: text(valor.llicencia, 200, `${que}.llicencia`),
    llicenciaUrl: urlDeLlicencia(valor.llicenciaUrl, `${que}.llicenciaUrl`),
    fontUrl: url(valor.fontUrl, ORIGENS_FONT, `${que}.fontUrl`)
  });
}

/**
 * La llista blanca de la cau: el registre net o un TypeError. És defensa en
 * profunditat (el DTO ja ve net de pobleDeViquipedia.js), perquè el que es
 * llig d'ací acaba en `src` i `href`.
 */
export function netejaEntrada(registre) {
  if (!registre || typeof registre !== 'object') falla('registre');
  const { clau, llegitEl, dto } = registre;
  if (typeof clau !== 'string' || !clau || clau.length > 400) falla('clau');
  if (typeof llegitEl !== 'number' || !Number.isFinite(llegitEl) || llegitEl < 0) falla('llegitEl');
  if (!dto || typeof dto !== 'object' || !Object.hasOwn(VIDA_MS, dto.estat)) falla('estat');
  const id = text(dto.id, 120, 'id');
  if (id !== null && !SLUG.test(id)) falla('id');
  const wikidata = text(dto.wikidata_id, 20, 'wikidata_id');
  if (wikidata !== null && !QID.test(wikidata)) falla('wikidata_id');
  const imatges = dto.imatges && typeof dto.imatges === 'object' ? dto.imatges : {};
  return {
    clau,
    llegitEl,
    dto: Object.freeze({
      estat: dto.estat,
      id,
      title: text(dto.title, 120, 'title'),
      author: text(dto.author, 200, 'author'),
      content: text(dto.content, MAXIM_LEMA, 'content'),
      provincia: text(dto.provincia, 120, 'provincia'),
      comarca: text(dto.comarca, 120, 'comarca'),
      population: text(dto.population, 40, 'population'),
      lat: nombre(dto.lat, [-90, 90], 'lat'),
      lng: nombre(dto.lng, [-180, 180], 'lng'),
      wikidata_id: wikidata,
      wikipedia_title: text(dto.wikipedia_title, 255, 'wikipedia_title'),
      copyright: text(dto.copyright, 200, 'copyright'),
      imatges: Object.freeze({
        hero: imatge(imatges.hero, 'hero'),
        avatar: imatge(imatges.avatar, 'avatar'),
        reserva: imatge(imatges.reserva, 'reserva')
      })
    })
  };
}

/** Cert si l'entrada ha passat la seua vida (o no se sap quan es va llegir). */
export function esCaducada(entrada, ara = Date.now()) {
  const vida = VIDA_MS[entrada?.dto?.estat];
  return !vida || !Number.isFinite(entrada?.llegitEl) || ara - entrada.llegitEl > vida;
}

/**
 * Una cau. Les proves passen `idb: null` (memòria) i el rellotge.
 *   llig(clau)             → Promise<entrada | null> (i la deixa a mà)
 *   entradaEnMemoria(clau) → l'entrada ja llegida, null (no n'hi ha) o undefined (no s'ha mirat)
 *   desa(clau, dto)        → Promise<entrada | null> ('no-disponible': null, no es desa)
 *   oblida(clau)           → Promise<true> quan el disc ja no la guarda; si no l'ha
 *                            pogut esborrar, rebutja i oblitFallit(clau) és cert
 *   oblidaTot()            → Promise<true> (o rebutja, si el disc no respon)
 *   oblitFallit(clau)      → cert si l'últim oblit d'eixa clau no ha arribat al disc
 *   subscriu(fn)           → desfés
 */
export function creaCauDeViquipedia({
  idb = globalThis.indexedDB, ara = () => Date.now(), navegador = globalThis.navigator, Canal = globalThis.BroadcastChannel
} = {}) {
  const magatzem = creaMagatzemIdb({
    nom: NOM_BD,
    versio: 1,
    stores: { [STORE]: { clau: 'clau', indexs: ['llegitEl'] } },
    llistaBlanca: { [STORE]: netejaEntrada },
    idb,
    navegador,
    Canal
  });
  const memoria = new Map();
  const oients = new Set();
  let escoltant = null;
  /* Auditoria matinal de Codex, 261030 (MITJÀ-C2 i MITJÀ-C3):
       · Els desats i els oblits arriben al disc en l'ordre en què es fan
         (enOrdre), i una lectura espera els que ja s'havien demanat.
       · Cada desat o oblit d'una clau en puja la generació, i l'oblit global,
         l'època: una lectura que acaba després no torna a posar a la mà el
         que ja s'ha oblidat o substituït.
       · Mentre el disc no confirma l'oblit d'una clau ('en-curs'), o si no
         l'ha pogut fer ('fallit'), llegir-la no torna el que el disc encara
         guarda: la mà continua buida fins que un altre oblit l'acaba o es
         torna a desar. */
  const generacions = new Map();
  let epoca = 0;
  const generacio = (clau) => `${epoca}:${generacions.get(clau) ?? 0}`;
  const puja = (clau) => { generacions.set(clau, (generacions.get(clau) ?? 0) + 1); };
  const oblits = new Map();
  let escriptures = Promise.resolve();
  function enOrdre(fer) {
    const pas = escriptures.then(fer);
    escriptures = pas.catch(() => {});
    return pas;
  }
  /* Llegir no ha de crear la base: obrir-la (creaMagatzemIdb) la crea buida
     al navegador de qui només ha visitat una fitxa incompleta. Si el
     navegador sap llistar les bases (indexedDB.databases: Chrome, Safari,
     Firefox 126+) i la nostra no hi és, no s'obri. Sense eixa API, s'obri. */
  let baseConeguda = false;
  async function baseExistix() {
    if (baseConeguda || !idb || typeof idb.databases !== 'function') return true;
    try {
      baseConeguda = (await idb.databases()).some((base) => base?.name === NOM_BD);
      return baseConeguda;
    } catch {
      return true;
    }
  }

  const avisa = () => { for (const oient of [...oients]) oient(); };

  /* Una entrada que no passa la llista blanca (una base d'un altre codi, o
     tocada a mà) és com si no hi fóra. */
  const valida = (registre) => {
    if (!registre) return null;
    try {
      return netejaEntrada(registre);
    } catch {
      return null;
    }
  };

  async function llig(clau) {
    if (typeof clau !== 'string' || !clau) return null;
    const vista = generacio(clau);
    await escriptures;
    let entrada = null;
    if (!oblits.has(clau)) {
      try {
        entrada = await baseExistix() ? valida(await magatzem.obte(STORE, clau)) : (memoria.get(clau) ?? null);
      } catch {
        entrada = memoria.get(clau) ?? null;
      }
    }
    /* Un 'sense-article' caducat ja no diu res: es pot tornar a provar. */
    if (entrada && entrada.dto.estat === 'sense-article' && esCaducada(entrada, ara())) entrada = null;
    /* Un desat o un oblit fet mentre es llegia mana sobre esta lectura. */
    if (generacio(clau) !== vista) return memoria.get(clau) ?? null;
    memoria.set(clau, entrada);
    return entrada;
  }

  /* Fitada: en passar de MAXIM_ENTRADES, se'n van les més velles. */
  async function poda() {
    const totes = await magatzem.totes(STORE);
    if (totes.length <= MAXIM_ENTRADES) return;
    const velles = [...totes].sort((a, b) => a.llegitEl - b.llegitEl).slice(0, totes.length - MAXIM_ENTRADES);
    for (const vella of velles) {
      await magatzem.esborra(STORE, vella.clau);
      if (memoria.has(vella.clau)) memoria.set(vella.clau, null);
    }
  }

  async function desa(clau, dto) {
    if (!Object.hasOwn(VIDA_MS, dto?.estat)) return null;
    const entrada = netejaEntrada({ clau, llegitEl: ara(), dto });
    puja(clau);
    oblits.delete(clau);
    memoria.set(clau, entrada);
    avisa();
    /* Si el disc falla (quota, una base que deixa de respondre), la
       proposta continua a mà en esta pestanya: és rendiment, no dades teues. */
    await enOrdre(async () => {
      try {
        await magatzem.desa(STORE, entrada);
        baseConeguda = true;
        await poda();
      } catch { /* només en memòria */ }
    });
    return entrada;
  }

  /* L'oblit sí que són dades teues: es confirma o es diu que ha fallat
     (MITJÀ-C3). Si una base que no existix no s'obri, no hi ha res a esborrar. */
  async function oblida(clau) {
    puja(clau);
    const vista = generacio(clau);
    oblits.set(clau, 'en-curs');
    memoria.set(clau, null);
    avisa();
    try {
      await enOrdre(async () => {
        if (await baseExistix()) await magatzem.esborra(STORE, clau);
      });
    } catch (error) {
      /* Si mentrestant s'ha tornat a desar o a oblidar, mana l'últim. */
      if (generacio(clau) === vista) {
        oblits.set(clau, 'fallit');
        avisa();
      }
      throw error;
    }
    if (generacio(clau) === vista) oblits.delete(clau);
    return true;
  }

  async function oblidaTot() {
    epoca += 1;
    const vista = epoca;
    for (const clau of memoria.keys()) memoria.set(clau, null);
    avisa();
    await enOrdre(async () => {
      if (await baseExistix()) await magatzem.buidaTot();
    });
    if (epoca === vista) oblits.clear();
    return true;
  }

  /* Un canvi d'una altra pestanya: es tornen a llegir les que ja es miraven. */
  function escolta() {
    if (escoltant) return;
    escoltant = magatzem.subscriu((avis) => {
      if (avis?.tipus !== 'canvi' || avis.local !== false) return;
      baseConeguda = true;
      const claus = [...memoria.keys()];
      Promise.all(claus.map((clau) => llig(clau))).then(avisa, avisa);
    });
  }

  return Object.freeze({
    llig,
    desa,
    oblida,
    oblidaTot,
    oblitFallit: (clau) => oblits.get(clau) === 'fallit',
    entradaEnMemoria: (clau) => memoria.get(clau),
    get persistent() { return magatzem.persistent; },
    subscriu(oient) {
      if (typeof oient !== 'function') throw new TypeError('subscriu necessita una funció.');
      oients.add(oient);
      escolta();
      return () => { oients.delete(oient); };
    }
  });
}

let cau = null;

/** La cau de l'app, creada la primera vegada que algú la demana. */
export function cauDeViquipedia() {
  cau ||= creaCauDeViquipedia();
  return cau;
}

/** Esborra totes les propostes d'este navegador (D-7: on es crida, ho decidix el Mestre). */
export function oblidaCauDeViquipedia() {
  return cauDeViquipedia().oblidaTot();
}
