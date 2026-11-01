/**
 * adaptadorLocal.js — El segon adaptador complet del port (T1 · D01; assalt
 * 261101, pla aprovat pel Mestre el 2026-11-01).
 *
 * Model B: el port (backendPort.js) i el contracte (contracte.js) són la
 * frontera; este adaptador n'implementa el nucli sencer i totes les
 * capacitats que un node sense servidor pot complir, sense Supabase, sense
 * xarxa i sense accés directe a localStorage ni a sessionStorage
 * (tractor-persistencia L2). Dues vies indirectes: les Notes van a IndexedDB
 * (localNotes) només amb persistenciaNotes:'indexeddb', i la sessió és la
 * d'identitat.js, amb el seu desament. Cap entrada de producció l'importa: entra per
 * host.injectaBackendDelPaquet (adaptadorLocal.host.test.js) o directament en
 * una prova.
 *
 * COMPOSICIÓ, NO DUPLICACIÓ. Els servidors locals que ja fan de servidor en
 * seed i local (localNotes, localXat, localPerfils i localSeguiments) es
 * componen tal qual. Els magatzems petits que vivien dins de
 * src/data/supabase/ (moderació, personalització, compte, consentiment i la
 * validació de la pujada) es porten als mòduls d'esta carpeta: E1 de
 * tractor-enxufe no deixa importar res de src/data/supabase/ des d'ací.
 *
 *   contingutLocal.js   Mur, Multimèdia, pàgines de secció, agenda,
 *                       publicacions i personalització
 *   notesLocal.js       Notes: pàgines, detall i cicle de vida
 *   conversesLocal.js   Xat, adjunts privats i transport E2EE (rebuigs honestos)
 *   comunitatLocal.js   perfils públics, organitzacions, membres, moderació,
 *                       normes, seguiments i titular
 *   compteLocal.js      sessió, entrada, segon factor, compte i consentiment
 *   mitjansLocal.js     mitjans en memòria i la biblioteca de fotos
 *   dadesObertesLocal.js  les dades obertes del poble i la seua restauració
 *                       (T2 · D04/D10, src/data/dadesObertesLot.js)
 *
 * Cada instància té els seus magatzems; la identitat és la de l'app
 * (identitat.js), com localXat i localNotes, perquè l'adaptador es puga
 * endollar de veres. El Xat és l'excepció: el seu estat és del mòdul localXat
 * (global), separat per abast (tenantId i persona), també als canals:
 * dos pobles amb els mateixos ids de la llavor no compartixen avisos. destroy() tanca els canals d'esta instància però
 * no buida el Xat: una instància nova amb el mateix tenantId el retroba.
 * Cap mètode no simula un servei que no té: l'entrada real, el segon factor,
 * els adjunts privats i l'E2EE rebutgen amb el codi que prescriu el contracte.
 */
import { createLocalNotesAdapter } from '../localNotes.js';
import { PERSONES_SEED, createLocalPerfilsAdapter } from '../localPerfils.js';
import { createLocalSeguimentsAdapter } from '../localSeguiments.js';
import { ENTITATS_SEED } from '../identitatsSeed.js';
import { APP_SEED } from '../appSeed.js';
import { getDefaultUserId, usuariDeSessio } from '../identitat.js';
import { llavorAmbDatesDeProva } from '../../sections/mur/datesDeProvaMur.js';
import { creaContingutLocal } from './contingutLocal.js';
import { creaNotesLocal } from './notesLocal.js';
import { creaConversesLocal } from './conversesLocal.js';
import { creaComunitatLocal } from './comunitatLocal.js';
import { creaCompteLocal } from './compteLocal.js';
import { creaMitjansLocal } from './mitjansLocal.js';
import { creaDadesObertesLocal } from './dadesObertesLocal.js';
import { estatBuitDeDadesObertes } from '../dadesObertesLot.js';

export const BACKEND_ID_LOCAL = 'sdp-local';
export const MODES_ADAPTADOR_LOCAL = Object.freeze(['seed', 'local']);
/* Les capacitats del contracte que este node no declara, a posta i amb el seu
   motiu. Una capacitat a mitges no existix: o tots els mètodes o cap
   (backendPort.js). Qualsevol altra capacitat del contracte l'ha de servir
   este adaptador; les proves de cobertura ho comproven contra CAPACITATS.
     · versioClient: la versió mínima del client natiu (P0-23) és un deure
       del node publicat davant de les botigues; un node local no en publica
       cap, i sense la capacitat el client no bloqueja res. */
export const CAPACITATS_NO_DECLARADES = Object.freeze(['versioClient']);

/* Les claus d'abast de qui crida: l'adaptador és amo del seu backend (Model B)
   i mai no parla en nom d'un altre node. La resta (signal, limit, cursors del
   Xat, noteId…) passa tal qual. */
const CLAUS_D_ABAST = Object.freeze(['backendId', 'backendUrl', 'backend_url', 'supabaseUrl', 'supabaseAnonKey', 'anonKey',
  'tenantId', 'tenant_id', 'dataMode']);
/* Les col·leccions que pot portar `dades` (el ganxo d'una restauració). */
const CLAUS_DADES = Object.freeze(['towns', 'pages', 'agents', 'feedPosts', 'events', 'marketItems', 'mediaItems',
  'actesAgenda', 'entitats', 'persones']);
/* La interfície els crida de manera síncrona (NotesDataContext, identitat):
   no passen per la guarda asíncrona. */
const SINCRONS = new Set(['getRuntimeDataMode', 'getBackendConfigurat', 'getDefaultUserId', 'getCurrentUser', 'adoptaSessioExterna']);
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const copia = (valor) => (valor === undefined ? undefined : structuredClone(valor));
const esObjectePla = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const senyalAvortat = (valor) => valor !== null && typeof valor === 'object' && valor.signal?.aborted === true;
/* El text de backendPort.js: la interfície ja el coneix. */
const cancelacio = () => new DOMException('Operació cancel·lada.', 'AbortError');

/* Un magatzem de notes en memòria amb el contracte {read, mutate} de
   localNotes.js: una lectura i una escriptura no compartixen mai referències. */
function creaMagatzemMemoria() {
  const files = new Map();
  return {
    async read(clau) { return structuredClone(files.get(clau) || {}); },
    async mutate(clau, transforma) {
      const valor = transforma(structuredClone(files.get(clau)));
      files.set(clau, structuredClone(valor));
      return valor;
    },
    buida() { files.clear(); }
  };
}

function validaOpcions({ mode, tenantId, ara, nouId, dades, persistenciaNotes, magatzemNotes, politica }) {
  if (!MODES_ADAPTADOR_LOCAL.includes(mode)) throw new TypeError('[adaptadorLocal] El mode ha de ser «seed» o «local».');
  if (typeof tenantId !== 'string' || !RE_UUID.test(tenantId)) throw new TypeError('[adaptadorLocal] El tenantId ha de ser un UUID.');
  if (typeof ara !== 'function' || typeof nouId !== 'function') throw new TypeError('[adaptadorLocal] ara i nouId han de ser funcions.');
  if (!esObjectePla(dades)) throw new TypeError('[adaptadorLocal] dades ha de ser un objecte.');
  for (const [clau, valor] of Object.entries(dades)) {
    if (!CLAUS_DADES.includes(clau)) throw new TypeError(`[adaptadorLocal] dades no admet la clau «${clau}».`);
    if (!Array.isArray(valor)) throw new TypeError(`[adaptadorLocal] dades.${clau} ha de ser una llista.`);
  }
  if (!['memoria', 'indexeddb'].includes(persistenciaNotes)) throw new TypeError('[adaptadorLocal] persistenciaNotes ha de ser «memoria» o «indexeddb».');
  if (magatzemNotes !== null && (typeof magatzemNotes?.read !== 'function' || typeof magatzemNotes?.mutate !== 'function')) {
    throw new TypeError('[adaptadorLocal] magatzemNotes ha de tindre read i mutate.');
  }
  if (politica !== null && !esObjectePla(politica)) throw new TypeError('[adaptadorLocal] politica ha de ser null o { versio, url, textSha256 }.');
}

/* La llavor del poble pilot, la mateixa que servix l'adaptador Supabase en
   seed (runtime.js · buildSeedAppData i content.js), amb les dates de prova
   del Mur. Una sola vegada per instància: el rellotge d'arrencada de
   datesDeProvaMur és del mòdul, i dues instàncies donen el mateix. */
function llavorDelMode(mode) {
  if (mode !== 'seed') return { pages: APP_SEED.pages };
  return llavorAmbDatesDeProva({
    agents: APP_SEED.agents, feedPosts: APP_SEED.feedPosts, marketItems: APP_SEED.marketItems, events: APP_SEED.events,
    towns: APP_SEED.towns, mediaItems: APP_SEED.mediaItems, pages: APP_SEED.pages
  });
}

/**
 * Un adaptador nou, amb els seus magatzems.
 * @param {object} [opcions]
 * @param {'seed'|'local'} [opcions.mode='seed'] 'seed': la llavor del poble pilot; 'local': només `dades`.
 * @param {string} [opcions.tenantId] UUID; aïlla els magatzems d'esta instància. El Xat (localXat) només se separa per abast: els canals van per filId i no s'aïllen.
 * @param {() => Date} [opcions.ara] el rellotge dels magatzems d'esta carpeta i dels servidors compostos que l'admeten.
 * @param {() => string} [opcions.nouId] ids nous (mitjans, publicacions).
 * @param {object} [opcions.dades] col·leccions inicials (CLAUS_DADES), cada una una llista.
 * @param {'memoria'|'indexeddb'} [opcions.persistenciaNotes='memoria']
 * @param {{read: Function, mutate: Function}|null} [opcions.magatzemNotes]
 * @param {boolean} [opcions.personalitzacioOberta=false] sense aal2 local, el Tauler només desa si es demana a posta.
 * @param {boolean} [opcions.restauracioOberta=false] sense cap rol d'administració local, restauraDadesObertes només escriu si es demana a posta (T2-G04).
 * @param {{versio: string, url: string, textSha256: string}|null} [opcions.politica] la política vigent del consentiment.
 */
export function creaAdaptadorLocal({
  mode = 'seed', tenantId = globalThis.crypto.randomUUID(), ara = () => new Date(), nouId = () => globalThis.crypto.randomUUID(),
  dades = {}, persistenciaNotes = 'memoria', magatzemNotes = null, personalitzacioOberta = false, restauracioOberta = false, politica = null
} = {}) {
  validaOpcions({ mode, tenantId, ara, nouId, dades, persistenciaNotes, magatzemNotes, politica });
  const configuracio = Object.freeze({ backendId: BACKEND_ID_LOCAL, tenantId: tenantId.toLowerCase(), dataMode: mode });
  /* backendUrl buit a posta: normalizeBackendConfig no hi barreja l'URL del
     paquet (la política de l'arrencada), i l'abast és sempre el d'este node. */
  const ci = (config) => {
    const net = {};
    if (esObjectePla(config)) for (const [clau, valor] of Object.entries(config)) if (!CLAUS_D_ABAST.includes(clau)) net[clau] = valor;
    return { ...net, ...configuracio, backendUrl: '' };
  };

  const inicials = copia(dades);
  const llavor = llavorDelMode(mode);
  /* Una col·lecció: la de `dades` si la porta; si no, la de la llavor. */
  const coleccio = (clau) => (Object.hasOwn(inicials, clau) ? inicials[clau] : llavor[clau] ?? []);

  const memoriaNotes = persistenciaNotes === 'memoria' && magatzemNotes === null ? creaMagatzemMemoria() : null;
  const notes = persistenciaNotes === 'indexeddb'
    ? createLocalNotesAdapter(undefined, { rellotge: ara })
    : createLocalNotesAdapter(magatzemNotes ?? memoriaNotes, { rellotge: ara });
  const perfils = createLocalPerfilsAdapter({
    entitats: inicials.entitats ?? ENTITATS_SEED, persones: inicials.persones ?? PERSONES_SEED, ara
  });
  const seguiments = createLocalSeguimentsAdapter({ perfils, persones: inicials.persones ?? PERSONES_SEED, ara });

  const netejes = [];
  /* Les altes del Xat d'esta instància: subscripció → com donar-la de baixa. */
  const subscripcions = new Map();
  /* La moderació la llig també el compte (exportació) i els seguiments (bloquejos). */
  const moderacio = { denuncies: [], bloquejos: new Map(), normes: new Map() };
  /* T2 · D04/D10 · El magatzem de les dades obertes restaurades: el llig
     també el directori, els pobles i el Mur; una restauració l'intercanvia sencer. */
  const dadesObertes = { estat: estatBuitDeDadesObertes() };
  const usuari = () => usuariDeSessio();
  /* Qui actua en local: la sessió o, sense sessió, el convidat (com moderacio.js en seed). */
  const qui = () => usuari()?.id || getDefaultUserId();
  const bloquejosDe = (persona) => [...(moderacio.bloquejos.get(String(persona))?.values() ?? [])].reverse();
  const tancaCanals = async () => {
    const baixes = [...subscripcions.values()];
    subscripcions.clear();
    await Promise.all(baixes.map((baixa) => Promise.resolve().then(baixa).catch(() => {})));
  };

  const e = Object.freeze({
    mode, configuracio, ci, ara, nouId, coleccio, copia, notes, perfils, seguiments, subscripcions, moderacio, dadesObertes,
    usuari, qui, bloquejosDe, tancaCanals,
    opcions: Object.freeze({
      personalitzacioOberta: personalitzacioOberta === true, restauracioOberta: restauracioOberta === true,
      politica: politica ? Object.freeze({ ...politica }) : null
    }),
    contextSeguiments: () => ({ usuari: usuari(), qui: qui(), bloquejos: bloquejosDe(qui()) }),
    alTancar: (fn) => { netejes.push(fn); }
  });

  const metodes = {};
  for (const part of [creaCompteLocal(e), creaContingutLocal(e), creaNotesLocal(e), creaConversesLocal(e),
    creaComunitatLocal(e), creaMitjansLocal(e), creaDadesObertesLocal(e)]) {
    for (const [nom, fn] of Object.entries(part)) {
      if (Object.hasOwn(metodes, nom)) throw new Error(`[adaptadorLocal] ${nom} ve de dos mòduls.`);
      if (typeof fn !== 'function') throw new TypeError(`[adaptadorLocal] ${nom} ha de ser una funció.`);
      metodes[nom] = fn;
    }
  }

  let tancat = false;
  const errorTancat = () => new Error('[adaptadorLocal] Adaptador tancat.');
  /* Les altes que deixarien un recurs viu si la crida es rebutja després de
     fer-les: es desfan abans de rebutjar (amb el mètode cru, no el guardat). */
  const DESFES_SI_ES_REBUTJA = Object.freeze({
    subscribeToXat: (alta) => metodes.unsubscribeFromXat(alta?.subscription)
  });
  /* La guarda transversal: un adaptador tancat no respon, i una crida
     síncrona que llança es torna un rebuig. El senyal i el tancament es miren
     en cridar i, de nou, just abans d'entrar al magatzem (la microtasca
     següent): un avortament en el mateix tic no escriu res. Si el senyal
     s'avorta mentre treballa, el resultat no ix; l'efecte ja pot estar fet,
     com en un servidor, però una alta de canal es desfà. */
  const guardat = (nom, fn) => (...args) => {
    const comprova = () => {
      if (tancat) throw errorTancat();
      if (args.some(senyalAvortat)) throw cancelacio();
    };
    try { comprova(); } catch (error) { return Promise.reject(error); }
    const desfes = Object.hasOwn(DESFES_SI_ES_REBUTJA, nom) ? DESFES_SI_ES_REBUTJA[nom] : null;
    return Promise.resolve().then(() => { comprova(); return fn(...args); }).then(async (valor) => {
      const avortat = args.some(senyalAvortat);
      if (!avortat && !(tancat && desfes)) return valor;
      if (desfes) await Promise.resolve().then(() => desfes(valor)).catch(() => {});
      throw avortat ? cancelacio() : errorTancat();
    });
  };
  const publics = {};
  for (const [nom, fn] of Object.entries(metodes)) publics[nom] = SINCRONS.has(nom) ? fn : guardat(nom, fn);

  /** Tanca l'adaptador: cap crida asíncrona més, cap canal obert d'esta
      instància i els magatzems propis buits. El Xat no es buida: és global
      (localXat), i una instància nova amb el mateix tenantId el retroba. */
  async function destroy() {
    if (tancat) return;
    tancat = true;
    await tancaCanals();
    for (const neteja of netejes.splice(0)) neteja();
    memoriaNotes?.buida();
    moderacio.denuncies.length = 0;
    moderacio.bloquejos.clear();
    moderacio.normes.clear();
    dadesObertes.estat = estatBuitDeDadesObertes();
    perfils.reinicia();
    seguiments.reinicia();
    /* Mai reiniciaLocalXat(): és global i buidaria també el Xat d'altres
       adaptadors (el Supabase en seed); els canals d'esta instància ja són tancats. */
  }

  return Object.freeze({ ...publics, destroy, configuracio });
}

export default creaAdaptadorLocal;
