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
import { backendScope } from '../config/backendConfig.js';
import { capturaSessio } from './identitat.js';
import { capturaRevisioSeed } from './seedRevisions.js';
/* Onada R30 · A4 · La meitat del navegador (el registre, els oients i el solapament) viu a
   revisionsEditorialsDelNavegador.js, una fulla que l'arrencada del paquet importa sense
   arrossegar l'escriptura al servidor ni seedRevisions.js. Ací se'n reexporta cada nom públic, amb
   el mateix nom, i se n'usen els interns: el codi de baix és el de sempre. */
import {
  CAMPS_DE_LA_REVISIO, _buidaRevisionsDelNavegadorPerAProves, carregaMapa, desaRevisioEditorial, igual, normalitzaClau,
  notifica, oblidaRevisioEditorial, persisteixMapa, revisaElement, revisaLlista, revisioEditorial,
  subscriuRevisionsEditorials, versioRevisionsEditorials, versioValida
} from './revisionsEditorialsDelNavegador.js';

export {
  CAMPS_DE_LA_REVISIO, desaRevisioEditorial, oblidaRevisioEditorial, revisaElement, revisaLlista, revisioEditorial,
  subscriuRevisionsEditorials, versioRevisionsEditorials
};

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
  _buidaRevisionsDelNavegadorPerAProves();
}
