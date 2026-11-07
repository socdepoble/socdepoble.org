/**
 * revisionsEditorials.js — P0-25 (Onada R6, Bloc 2) · Les revisions
 * editorials dels elements que no tenen fila pròpia al servidor: la llavor
 * del Mur (el Manifest de Poble, d'`app_content.feedPosts`, sense UUID) i els
 * actes de l'agenda (l'Aplec 2023), que «Actualitzar al Mur» de /notes
 * (PublicacioEditable) no pot escriure per `publishNote`.
 *
 * EMMAGATZEMATGE AL NAVEGADOR: `app_content` només té polítiques de lectura i cap port hi
 * escriu, així que la revisió viu en este navegador (memòria + localStorage,
 * la clau `publicacions.revisions.v1` amb el prefix de config/storage.js).
 * Mateix patró que publicacionsEsborrades.js: un registre reactiu per clau
 * `${seccio}:${id}`, els oients del mòdul (la mateixa pestanya) i l'esdeveniment
 * `storage` de la finestra (les altres pestanyes). Els lectors (MurContext,
 * ItemDetailSection, elementDeSeccio) en fan el solapament amb revisaElement.
 *
 * Forma desada: { "<seccio>:<id>": { camps: { title, content, … }, desadaEl } }.
 * Els camps són els de la nota (notaDeLaPublicacio); en solapar-los, cada un
 * va a la primera clau no buida de l'element, en l'ordre en què
 * notaDeLaPublicacio les llig. L'HTML es guarda tal com el dona l'editor:
 * el saneja el lector que el pinta (cosPerAPintar, renderRichText).
 *
 * R12 (Onada R6, Bloc 4, B4-S1) · Quan el backend anuncia `edicioEditorial`
 * (RPC `admin_actualitza_publicacio_editorial` de la migració 76: superadmin +
 * aal2, camps blancs i CAS sobre la versió de la fila), desaRevisioEditorialAmbServidor
 * escriu també al servidor. Ordre del Mestre: la revisió es desa SEMPRE primer
 * al navegador, com fins ara; en mode seed o local, sense la capacitat, sense
 * rol de superadmin, sense versió coneguda o si el servidor la rebutja, es
 * queda ací i el resultat ho diu (`desti: 'navegador'` + `motiu`). Amb èxit,
 * l'entrada guarda `servidor: { versio }` i deixa de solapar-se quan el lector
 * ja porta eixa versió o una de més nova (`_editorialVersio`).
 */
import { STORAGE_PREFIX, getVal, setVal } from '../config/storage.js';
import { backendScope } from '../config/backendConfig.js';
import { capturaSessio } from './identitat.js';
import { capturaRevisioSeed } from './seedRevisions.js';

const CLAU_STORAGE = 'publicacions.revisions.v1';
const SECCIONS_VALIDES = Object.freeze(new Set(['mur', 'events']));
/* Camp de la nota → claus de l'element, en l'ordre de lectura. */
const CLAUS_DE_L_ELEMENT = Object.freeze({
  title: Object.freeze(['title', 'name']),
  subtitle: Object.freeze(['post_subtitle', 'subtitle']),
  lead: Object.freeze(['entradilla', 'lead', 'summary']),
  content: Object.freeze(['content']),
  heroImage: Object.freeze(['image_url', 'image']),
  logoImage: Object.freeze(['logo_image']),
  copyright: Object.freeze(['copyright']),
  icon: Object.freeze(['icon']),
  publishDate: Object.freeze(['publish_date']),
  tags: Object.freeze(['tags'])
});
export const CAMPS_DE_LA_REVISIO = Object.freeze(Object.keys(CLAUS_DE_L_ELEMENT));
const MAX_COS = 600000;
const MAX_TEXT = 4000;
const MAX_ETIQUETES = 50;

let versio = 0;
const oients = new Set();
let cacheMem = null;
let escoltaStorage = null;

const versioValida = (valor) => Number.isSafeInteger(valor) && valor > 0;

function normalitzaClau(seccio, id) {
  const s = String(seccio || '').trim().toLowerCase();
  const i = id == null ? '' : String(id).trim();
  if (!SECCIONS_VALIDES.has(s) || !i) return null;
  return `${s}:${i}`;
}

/* Només els camps coneguts, del tipus esperat i amb topall: el storage és de la persona, no de confiança. */
function campsValids(camps) {
  if (!camps || typeof camps !== 'object' || Array.isArray(camps)) return null;
  const nets = {};
  for (const camp of CAMPS_DE_LA_REVISIO) {
    if (!Object.prototype.hasOwnProperty.call(camps, camp)) continue;
    const valor = camps[camp];
    if (camp === 'tags') {
      if (Array.isArray(valor)) {
        nets.tags = valor.filter((etiqueta) => typeof etiqueta === 'string' && etiqueta.length <= 80).slice(0, MAX_ETIQUETES);
      }
    } else if (camp === 'publishDate' && valor === null) {
      nets.publishDate = null;
    } else if (typeof valor === 'string' && valor.length <= (camp === 'content' ? MAX_COS : MAX_TEXT)) {
      nets[camp] = valor;
    }
  }
  return Object.keys(nets).length ? Object.freeze(nets) : null;
}

function carregaMapa() {
  if (cacheMem) return cacheMem;
  const mapa = new Map();
  try {
    const desat = getVal(CLAU_STORAGE, null);
    if (desat && typeof desat === 'object' && !Array.isArray(desat)) {
      for (const [clau, entrada] of Object.entries(desat)) {
        const [seccio, ...resta] = String(clau).split(':');
        const normal = normalitzaClau(seccio, resta.join(':'));
        const camps = normal === clau ? campsValids(entrada?.camps) : null;
        if (camps) {
          const servidor = versioValida(entrada?.servidor?.versio) ? Object.freeze({ versio: entrada.servidor.versio,
            ...(entrada.servidor.tipus === 'seed' ? { tipus: 'seed', fontVersio: entrada.servidor.fontVersio } : {}) }) : null;
          mapa.set(clau, Object.freeze({ camps, desadaEl: typeof entrada.desadaEl === 'string' ? entrada.desadaEl : null, ...(servidor ? { servidor } : null) }));
        }
      }
    }
  } catch {
    /* sense storage disponible */
  }
  cacheMem = mapa;
  return cacheMem;
}

function persisteixMapa(mapa) {
  try {
    setVal(CLAU_STORAGE, Object.fromEntries(mapa));
  } catch {
    /* sense storage disponible: la revisió viu en memòria fins a la recàrrega */
  }
}

function notifica() {
  versio += 1;
  for (const fn of oients) {
    try { fn(); } catch { /* ignora error d'oient */ }
  }
}

/* Una altra pestanya ha desat o esborrat: es torna a llegir el storage. */
function enCanviDeStorage(event) {
  if (event?.key != null && event.key !== STORAGE_PREFIX + CLAU_STORAGE) return;
  cacheMem = null;
  notifica();
}

export function subscriuRevisionsEditorials(callback) {
  oients.add(callback);
  if (!escoltaStorage && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    escoltaStorage = enCanviDeStorage;
    window.addEventListener('storage', escoltaStorage);
  }
  return () => {
    oients.delete(callback);
    if (!oients.size && escoltaStorage && typeof window !== 'undefined') {
      window.removeEventListener('storage', escoltaStorage);
      escoltaStorage = null;
    }
  };
}

export function versioRevisionsEditorials() {
  return versio;
}

/** Els camps revisats d'un element ({ title, content, … }) o null. */
export function revisioEditorial(seccio, id) {
  const clau = normalitzaClau(seccio, id);
  return clau ? carregaMapa().get(clau)?.camps || null : null;
}

/** Desa (fusionant amb la revisió anterior) els camps d'una revisió. Torna false si no n'accepta cap. */
export function desaRevisioEditorial(seccio, id, camps) {
  const clau = normalitzaClau(seccio, id);
  const nous = clau ? campsValids(camps) : null;
  if (!nous) return false;
  const mapa = carregaMapa();
  const fusionats = Object.freeze({ ...(mapa.get(clau)?.camps || {}), ...nous });
  mapa.set(clau, Object.freeze({ camps: fusionats, desadaEl: new Date().toISOString() }));
  persisteixMapa(mapa);
  notifica();
  return true;
}

export function oblidaRevisioEditorial(seccio, id) {
  const clau = normalitzaClau(seccio, id);
  const mapa = carregaMapa();
  if (!clau || !mapa.has(clau)) return false;
  mapa.delete(clau);
  persisteixMapa(mapa);
  notifica();
  return true;
}

const clauDeDesti = (element, claus) => claus.find((clau) => {
  const valor = element[clau];
  return typeof valor === 'string' ? valor !== '' : valor != null;
}) || claus[0];

const igual = (a, b) => (Array.isArray(a) && Array.isArray(b)
  ? a.length === b.length && a.every((valor, index) => valor === b[index])
  : a === b);

/** L'element amb la seua revisió al damunt (un objecte nou) o el MATEIX element
 *  si no en té o ja la porta (aplicar-la dos voltes no canvia la identitat). */
export function revisaElement(seccio, element) {
  if (!element || typeof element !== 'object' || element.id == null) return element;
  const clau = normalitzaClau(seccio, element.id);
  const entrada = clau ? carregaMapa().get(clau) : null;
  const camps = entrada?.camps || null;
  if (!camps) return element;
  /* R12 · El servidor ja l'ha acceptada i el lector porta eixa versió (o una de
     posterior, d'una altra mà): mana la fila, no la còpia del navegador. */
  const versioDelServidor = entrada.servidor?.tipus === 'seed' ? element._seedRevisioVersio : element._editorialVersio;
  if (entrada.servidor?.tipus === 'seed' && versioValida(entrada.servidor.fontVersio)
    && versioValida(element._seedFontVersio || element._editorialVersio)
    && entrada.servidor.fontVersio !== (element._seedFontVersio || element._editorialVersio)) return element;
  if (entrada.servidor && versioValida(versioDelServidor) && versioDelServidor >= entrada.servidor.versio) return element;
  const canvis = Object.entries(camps)
    .map(([camp, valor]) => [clauDeDesti(element, CLAUS_DE_L_ELEMENT[camp]), valor])
    .filter(([clau, valor]) => !igual(element[clau], valor));
  if (!canvis.length) return element;
  const revisat = { ...element };
  for (const [clau, valor] of canvis) revisat[clau] = Array.isArray(valor) ? [...valor] : valor;
  return revisat;
}

/** La llista amb les revisions al damunt; la MATEIXA llista si cap element en té. */
export function revisaLlista(llista, seccio) {
  if (!Array.isArray(llista) || !llista.length) return llista || [];
  const mapa = carregaMapa();
  const s = String(seccio || '').trim().toLowerCase();
  if (!mapa.size || !SECCIONS_VALIDES.has(s)) return llista;
  if (!llista.some((element) => element?.id != null && mapa.has(`${s}:${String(element.id)}`))) return llista;
  return llista.map((element) => revisaElement(s, element));
}

/* ── R12 · Escriptura al servidor pel port (capacitat `edicioEditorial`) ── */

/* Camp de la nota → camp blanc de la RPC (campsPublicacio de editorialPublicada.js). */
const CAMP_DEL_SERVIDOR = Object.freeze({
  title: 'title', subtitle: 'subtitle', lead: 'entradilla', content: 'content', heroImage: 'image_url',
  logoImage: 'logo_image', copyright: 'copyright', icon: 'icon', publishDate: 'publish_date', tags: 'tags'
});
/* La fila d'app_content de cada secció (CLAU_EDITORIAL_DE_SECCIO). */
const FILA_DE_SECCIO = Object.freeze({ mur: 'feedPosts', events: 'events' });
const MODES_DEL_NAVEGADOR = Object.freeze(new Set(['seed', 'local']));
const ID_DEL_SERVIDOR = /^[A-Za-z0-9_-]{1,128}$/;
/* Motius pels quals el servidor ha dit que no (o no ha respost): la UI avisa que només queda al navegador. */
const MOTIUS_DEL_SERVIDOR = Object.freeze(new Set(['conflicte-versio', 'cal-segon-factor', 'no-disponible', 'editorial-error', 'editorial-invalid', 'resposta-invalida', 'avortada']));
/* Última versió confirmada pel servidor en esta càrrega: la desada següent no
   torna a enviar la versió vella (conflicte segur) encara que el lector no s'haja refrescat. */
const versionsConfirmades = new Map();
/* Una sola escriptura en vol per element: la segona espera la primera i en pren la versió. */
const enVol = new Map();

function canvisDelServidor(camps) {
  const canvis = {};
  for (const [camp, valor] of Object.entries(camps)) {
    const desti = CAMP_DEL_SERVIDOR[camp];
    if (!desti || valor === null) continue;
    canvis[desti] = Array.isArray(valor) ? [...valor] : valor;
  }
  return canvis;
}

function motiuSenseServidor({ seccio, element, config, esSuperadmin, teCapacitat }) {
  if (!config || typeof config !== 'object' || MODES_DEL_NAVEGADOR.has(config.dataMode)) return 'mode-navegador';
  if (!teCapacitat('edicioEditorial')) return 'sense-rpc';
  if (esSuperadmin !== true) return 'sense-permis';
  if (!ID_DEL_SERVIDOR.test(String(element.id))) return 'sense-fila';
  if (element._editorialClau != null && element._editorialClau !== FILA_DE_SECCIO[seccio]) return 'sense-fila';
  return null;
}

/**
 * Desa la revisió al navegador (sempre, abans de res) i, si el backend ho
 * permet, també al servidor amb la RPC editorial. No llança per un rebuig del
 * servidor: la revisió ja és al navegador i el resultat diu on ha quedat.
 * @param {'mur'|'events'} seccio
 * @param {{ id: string, _editorialVersio?: number, _editorialClau?: string, _seedFontVersio?: number, _seedRevisioVersio?: number }} element la publicació tal com la llig el lector
 * @param {object} camps els camps de la nota (CAMPS_DE_LA_REVISIO)
 * @param {{ esSuperadmin?: boolean, config?: object|null, signal?: AbortSignal }} [opcions]
 * @returns {Promise<{ desada: boolean, desti: 'servidor'|'navegador'|null, motiu: string|null, versio?: number }>}
 */
export async function desaRevisioEditorialAmbServidor(seccio, element, camps, { esSuperadmin = false, config = null, signal = null } = {}) {
  const comprovaSessio = capturaSessio();
  const id = element && typeof element === 'object' ? element.id : null;
  if (!desaRevisioEditorial(seccio, id, camps)) return { desada: false, desti: null, motiu: 'invalida' };
  const clau = normalitzaClau(seccio, id);
  const port = await import('./backendPort.js');
  comprovaSessio();
  /* Àrbitre R11 (R33-L2-01) · El lector marca TOTA peça d'app_content amb la versió
     de la fila (_seedFontVersio), també la que ja porta _editorialVersio: la
     propietària no superadmin hi entra per la revisió de llavor; el superadmin
     continua amb la RPC editorial de la fila quan el backend la té. */
  if (config && !MODES_DEL_NAVEGADOR.has(config.dataMode) && port.teCapacitat('revisionsLlavor') && versioValida(element?._seedFontVersio)
    && (esSuperadmin !== true || !port.teCapacitat('edicioEditorial'))) {
    /* Només els canvis explícits d'esta desada. El storage v1 antic no té autor:
       no s'envia automàticament tot el mapa o els camps d'una sessió anterior. */
    return enviaRevisioSeed({ seccio: clau.split(':')[0], id: String(id), camps, versio: element?._seedRevisioVersio || 0, fontVersio: element?._seedFontVersio }, port, config, signal, comprovaSessio);
  }
  const motiu = motiuSenseServidor({ seccio: clau.split(':')[0], element, config, esSuperadmin, teCapacitat: port.teCapacitat });
  if (motiu) return { desada: true, desti: 'navegador', motiu };
  const anterior = enVol.get(clau) || Promise.resolve();
  const torn = anterior.catch(() => {}).then(async () => {
    const versio = Math.max(versioValida(element._editorialVersio) ? element._editorialVersio : 0, versionsConfirmades.get(clau) || 0);
    if (!versio) return { desada: true, desti: 'navegador', motiu: 'sense-versio' };
    /* La revisió sencera que hi ha ara al navegador (també la d'abans), no sols els camps d'esta desada. */
    const enviada = carregaMapa().get(clau)?.camps || null;
    const canvis = canvisDelServidor(enviada || {});
    /* Àrbitre B4-S1 · La RPC no sap esborrar (p. ex. publishDate: null): si en
       queda algun camp fora, la còpia del navegador ha de continuar manant. */
    const completa = !!enviada && Object.values(enviada).every((valor) => valor !== null);
    if (!Object.keys(canvis).length) return { desada: true, desti: 'navegador', motiu: 'sense-camps' };
    let resultat;
    try {
      resultat = await port.adminActualitzaPublicacioEditorial({ seccio: clau.split(':')[0], id: String(id), canvis, versio }, { ...config, ...(signal ? { signal } : null) });
    } catch (error) {
      const codi = error?.name === 'AbortError' ? 'avortada' : (error?.code || error?.codi || 'editorial-error');
      return { desada: true, desti: 'navegador', motiu: MOTIUS_DEL_SERVIDOR.has(codi) ? codi : 'editorial-error' };
    }
    if (!versioValida(resultat?.versio)) return { desada: true, desti: 'navegador', motiu: 'resposta-invalida' };
    versionsConfirmades.set(clau, resultat.versio);
    const mapa = carregaMapa();
    const actual = mapa.get(clau);
    /* Àrbitre B4-S1 · Només si l'entrada és encara la que s'ha enviat: una desada
       posterior (en cua o d'una altra pestanya) no es pot marcar amb esta versió,
       o el lector l'amagaria encara que el servidor la rebutge després. */
    if (actual && completa && actual.camps === enviada) {
      mapa.set(clau, Object.freeze({ ...actual, servidor: Object.freeze({ versio: resultat.versio }) }));
      persisteixMapa(mapa);
      notifica();
    }
    return { desada: true, desti: 'servidor', motiu: null, versio: resultat.versio };
  });
  enVol.set(clau, torn);
  try {
    return await torn;
  } finally {
    if (enVol.get(clau) === torn) enVol.delete(clau);
  }
}

async function enviaRevisioSeed(input, port, config, signal, comprovaSessio) {
  let capturada;
  /* Àrbitre R11 (R33-L2-01) · Rebuig del client, sense cap petició: no és un «rebuig del servidor». */
  try { capturada = capturaRevisioSeed(input); } catch { return { desada: true, desti: 'navegador', motiu: 'revisio-no-enviable' }; }
  const clau = normalitzaClau(capturada.seccio, capturada.id);
  const scope = `${backendScope(config)}:${clau}:${capturada.fontVersio}`, anterior = enVol.get(scope) || Promise.resolve();
  const torn = anterior.catch(() => {}).then(async () => {
    try {
      comprovaSessio();
      const versio = Math.max(capturada.versio, versionsConfirmades.get(scope) || 0);
      const resultat = await port.desaRevisioSeed({ ...capturada, versio }, { ...config, ...(signal ? { signal } : {}) });
      comprovaSessio();
      if (!versioValida(resultat?.versio) || resultat.versio !== versio + 1) return { desada: true, desti: 'navegador', motiu: 'resposta-invalida' };
      versionsConfirmades.set(scope, resultat.versio);
      const mapa = carregaMapa(), actual = mapa.get(clau);
      if (actual && Object.entries(actual.camps).every(([key, value]) => igual(resultat.camps?.[key], value))) {
        mapa.set(clau, Object.freeze({ ...actual, servidor: Object.freeze({ tipus: 'seed', versio: resultat.versio, fontVersio: capturada.fontVersio }) }));
        persisteixMapa(mapa); notifica();
      }
      return { desada: true, desti: 'servidor', motiu: null, versio: resultat.versio };
    } catch (error) {
      const motiu = error?.name === 'AbortError' ? 'avortada' : error?.code === 'conflicte-versio' ? 'conflicte-versio'
        : error?.code === 'no-disponible' ? 'no-disponible' : error?.code === 'sense-sessio' ? 'sense-sessio' : 'editorial-error';
      return { desada: true, desti: 'navegador', motiu };
    }
  });
  enVol.set(scope, torn);
  try { return await torn; } finally { if (enVol.get(scope) === torn) enVol.delete(scope); }
}

/** Explicit, selected migration. Legacy entries have no actor binding: never
 * call this from startup/session restore. Every retained entry remains local,
 * including successful ones; the current server version controls its overlay.
 * A selection must include the exact fields reviewed by the caller and a CAS
 * version read for this backend. No clear(), delete or bulk publication. */
export async function migraRevisionsEditorialsAlServidor(seleccio, { config, signal = null } = {}) {
  if (!config || MODES_DEL_NAVEGADOR.has(config.dataMode)) throw new TypeError('La migració requerix un servidor configurat.');
  if (!Array.isArray(seleccio) || seleccio.length > 200) throw new TypeError('Selecciona les revisions revisades.');
  const capturades = seleccio.map(capturaRevisioSeed), comprovaSessio = capturaSessio();
  const claus = capturades.map(row => normalitzaClau(row.seccio, row.id));
  if (new Set(claus).size !== claus.length) throw new TypeError('Una revisió apareix dos vegades.');
  for (const [index, row] of capturades.entries()) {
    const local = carregaMapa().get(claus[index])?.camps;
    if (!local || Object.keys(local).length !== Object.keys(row.camps).length
      || !Object.entries(local).every(([key, value]) => igual(value, row.camps[key]))) throw new TypeError('La revisió ha canviat: torna a revisar-la.');
  }
  const port = await import('./backendPort.js'); comprovaSessio();
  if (!port.teCapacitat('revisionsLlavor')) throw new Error('El backend no té revisions de llavor.');
  const resultats = [];
  for (const row of capturades) {
    comprovaSessio();
    resultats.push({ seccio: row.seccio, id: row.id, ...await enviaRevisioSeed(row, port, config, signal, comprovaSessio) });
  }
  return resultats;
}

/** True si el resultat ve d'un intent al servidor que no ha reeixit (la revisió només queda al navegador). */
export function rebutjadaPelServidor(resultat) {
  return resultat?.desti === 'navegador' && MOTIUS_DEL_SERVIDOR.has(resultat.motiu);
}

/** L'avís que diu on ha quedat la revisió: al servidor, o només al navegador (perquè el servidor no l'ha acceptada o perquè no hi ha servidor). */
export function avisDeLaRevisioEditorial(resultat, t = null) {
  const [clau, reserva] = resultat?.desti === 'servidor'
    ? ['section.notes.publicacio.revisioDesadaServidor', 'Revisió desada al servidor: el Mur i la pàgina ja la mostren a tothom.']
    : rebutjadaPelServidor(resultat)
      ? ['section.notes.publicacio.revisioNomesNavegador', 'El servidor no ha acceptat la revisió: queda desada només en este navegador.']
      : ['section.notes.publicacio.revisioDesada', 'Revisió desada en este navegador: el Mur i la pàgina ja la mostren.'];
  return typeof t === 'function' ? t(clau, reserva) : reserva;
}

/** Només per a proves unitàries: reinicia l'estat en memòria i l'emmagatzematge. */
export function _reiniciaRevisionsEditorialsPerAProves() {
  versionsConfirmades.clear();
  enVol.clear();
  cacheMem = new Map();
  persisteixMapa(cacheMem);
  notifica();
}
