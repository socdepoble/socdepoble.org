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
import { errorDeConnexions, subjecteConnexionsDelContracte, visibilitatConnexionsDelContracte, inclusioPersonaDelContracte, sollicitudEntitatDelContracte } from '../contracte.js';
import { ENTITATS_SEED } from '../identitatsSeed.js';
import { APP_SEED } from '../appSeed.js';
import { capturaSessio, getDefaultUserId, usuariDeSessio } from '../identitat.js';
import { llavorAmbDatesDeProva } from '../../sections/mur/datesDeProvaMur.js';
import { creaContingutLocal, capturaPayloadPersonalitzacioLocal } from './contingutLocal.js';
import { creaNotesLocal } from './notesLocal.js';
import { creaConversesLocal } from './conversesLocal.js';
import { creaComunitatLocal } from './comunitatLocal.js';
import { creaCompteLocal } from './compteLocal.js';
import { creaAdminUsuarisLocal } from './adminUsuarisLocal.js';
import { capturaAdminUsuaris } from '../adminUsuaris.js';
import { capturaConsultaRevisionsSeed, capturaRevisioSeed } from '../seedRevisions.js';
import { creaMitjansLocal } from './mitjansLocal.js';
import { creaDadesObertesLocal } from './dadesObertesLocal.js';
import { estatBuitDeDadesObertes } from '../dadesObertesLot.js';

export const BACKEND_ID_LOCAL = 'sdp-local';
export const MODES_ADAPTADOR_LOCAL = Object.freeze(['seed', 'local']);
/* FEDI-16 + FEDI23 · Les capacitats declarades són completes. La versió mínima local és
   null; l'administració multipoble només opera amb autoritat LOCAL injectada.
   Declarar mètodes no concedix autoritat ni permisos sobre cap servidor. */
export const CAPACITATS_NO_DECLARADES = Object.freeze(['iaia','xatRitme','importacioPaquetMunicipal','verificacioCorreu','recuperacioCorreu']);

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

/* La composició local és l'únic lloc on es pot injectar autoritat. No
   s'inferix del directori, de metadades, de rol, d'aal ni de cap config client. */
function administracioLocalValidada(entrada) {
  if (entrada === null) return null;
  const invalid = () => { throw new TypeError('[adaptadorLocal] administracioLocal requerix { pobles, autoritza }.'); };
  if (!esObjectePla(entrada) || Object.keys(entrada).some(k => !['pobles', 'autoritza'].includes(k))
    || typeof entrada.autoritza !== 'function' || !Array.isArray(entrada.pobles) || entrada.pobles.length > 1000) invalid();
  const ids = new Set(), slugs = new Set();
  const pobles = entrada.pobles.map(poble => {
    if (!esObjectePla(poble) || typeof poble.id !== 'string' || !RE_UUID.test(poble.id)
      || typeof poble.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(poble.slug)
      || typeof poble.nom !== 'string' || !poble.nom.trim() || poble.nom.length > 200) invalid();
    const id = poble.id.toLowerCase();
    if (ids.has(id) || slugs.has(poble.slug)) invalid();
    ids.add(id); slugs.add(poble.slug);
    return Object.freeze({ id, slug: poble.slug, nom: poble.nom.trim() });
  });
  return Object.freeze({ pobles: Object.freeze(pobles), autoritza: entrada.autoritza });
}
const ADMINISTRATIUS = new Set(['adminLlistaPobles', 'adminLligPersonalitzacio', 'adminDesaPersonalitzacio', 'adminHistorialPersonalitzacio','adminLlistaUsuarisRegistrats','adminAssignaMembreOrganitzacio','adminConnectaUsuari', 'loadSeedRevisions', 'desaRevisioSeed']);
const lligAvortamentNatiu = Object.getOwnPropertyDescriptor(AbortSignal.prototype, 'aborted').get;
const errorAbastAdmin = () => Object.assign(new TypeError('Cal un tenant explícit i coherent.'), { code: 'abast-invalid' });
/* Captura síncrona abans de la microtasca de guardat(): només selectors
   primitius i el senyal viu. Cap getter client es crida ni cap config es força
   amb ci(). El payload queda separat abans que el consumidor el puga mutar. */
function capturaArgumentsAdmin(nom, args) {
  const indexConfig = nom === 'adminLlistaPobles' || nom === 'adminLligPersonalitzacio' ? 0 : 1;
  const config = args[indexConfig] === undefined ? {} : args[indexConfig];
  if (!esObjectePla(config)) throw errorAbastAdmin();
  const selectors = {};
  for (const clau of ['tenantId', 'tenant_id', 'signal']) {
    const descriptor = Object.getOwnPropertyDescriptor(config, clau);
    if (!descriptor) continue;
    if (!Object.hasOwn(descriptor, 'value')) throw errorAbastAdmin();
    const valor = descriptor.value;
    if (clau !== 'signal' && valor !== undefined && valor !== null && typeof valor !== 'string') throw errorAbastAdmin();
    if (clau === 'signal' && valor != null) {
      /* Valida la marca i llig l'intrínsec, mai un getter `aborted` propi
         d'un objecte client, ni tan sols d'un AbortSignal genuí alterat. */
      try { lligAvortamentNatiu.call(valor); } catch { throw errorAbastAdmin(); }
      selectors.signal = Object.freeze({ get aborted() { return lligAvortamentNatiu.call(valor); } });
    } else selectors[clau] = valor;
  }
  if (senyalAvortat(selectors)) throw cancelacio();
  if (nom === 'adminHistorialPersonalitzacio' && typeof args[0] !== 'string') {
    throw Object.assign(new TypeError('La clau de personalització no és vàlida.'), { code: 'clau-invalida' });
  }
  const capturats = [...args];
  capturats[indexConfig] = Object.freeze(selectors);
  if(nom==='adminLlistaUsuarisRegistrats'||nom==='adminAssignaMembreOrganitzacio'||nom==='adminConnectaUsuari')capturats[0]=capturaAdminUsuaris(args[0],nom==='adminLlistaUsuarisRegistrats'?'llista':nom==='adminAssignaMembreOrganitzacio'?'membre':'connecta',{local:true});
  if (nom === 'loadSeedRevisions') capturats[0] = capturaConsultaRevisionsSeed(args[0]);
  if (nom === 'desaRevisioSeed') capturats[0] = capturaRevisioSeed(args[0]);
  if (nom === 'adminDesaPersonalitzacio') {
    const entrada = args[0] === undefined ? {} : args[0];
    if (!esObjectePla(entrada)) throw new TypeError('Entrada de personalització invàlida.');
    const camps = {};
    for (const clau of ['clau', 'payload', 'versio']) {
      const descriptor = Object.getOwnPropertyDescriptor(entrada, clau);
      if (descriptor && !Object.hasOwn(descriptor, 'value')) throw new TypeError('Entrada de personalització invàlida.');
      camps[clau] = descriptor?.value;
    }
    camps.payload = capturaPayloadPersonalitzacioLocal(camps.payload);
    if (typeof camps.clau !== 'string' || (camps.versio != null && !Number.isSafeInteger(camps.versio))) throw new TypeError('Entrada de personalització invàlida.');
    capturats[0] = Object.freeze(camps);
  }
  return capturats;
}

const METODES_CONNEXIONS = new Set(['preferenciesConnexions', 'desaVisibilitatConnexions', 'connexionsPubliquesDe', 'membresIEntitatsConnectadesDe', 'inclouPersonaEnEntitat', 'solicitaUnirSeAEntitat']);
function capturaArgumentsConnexions(nom, args) {
  const validador = nom === 'desaVisibilitatConnexions' ? visibilitatConnexionsDelContracte
    : nom === 'inclouPersonaEnEntitat' ? inclusioPersonaDelContracte
      : nom === 'solicitaUnirSeAEntitat' ? sollicitudEntitatDelContracte : subjecteConnexionsDelContracte;
  const dades = validador(args[0]);
  const config = args[1] === undefined ? {} : args[1];
  if (!esObjectePla(config)) throw errorDeConnexions('SDP-CONN-001');
  const capturada = {};
  for (const clau of Reflect.ownKeys(config)) {
    const descriptor = Object.getOwnPropertyDescriptor(config, clau);
    if (typeof clau !== 'string' || !descriptor || !Object.hasOwn(descriptor, 'value')) throw errorDeConnexions('SDP-CONN-001');
    if (clau === 'signal' && descriptor.value != null) {
      const signal = descriptor.value;
      try { lligAvortamentNatiu.call(signal); } catch { throw errorDeConnexions('SDP-CONN-001'); }
      capturada.signal = Object.freeze({ get aborted() { return lligAvortamentNatiu.call(signal); } });
    }
  }
  return [Object.freeze(dades), Object.freeze(capturada)];
}

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
 * @param {{pobles: Array<{id: string, slug: string, nom: string}>, autoritza: Function}|null} [opcions.administracioLocal] autoritat explícita només d'este procés; pot ser asíncrona i ha de tornar true.
 * @param {{versio: string, url: string, textSha256: string}|null} [opcions.politica] la política vigent del consentiment.
 */
export function creaAdaptadorLocal({
  mode = 'seed', tenantId = globalThis.crypto.randomUUID(), ara = () => new Date(), nouId = () => globalThis.crypto.randomUUID(),
  dades = {}, persistenciaNotes = 'memoria', magatzemNotes = null, personalitzacioOberta = false, restauracioOberta = false, politica = null, administracioLocal = null
} = {}) {
  validaOpcions({ mode, tenantId, ara, nouId, dades, persistenciaNotes, magatzemNotes, politica });
  const autoritatLocal = administracioLocalValidada(administracioLocal);
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
  /* P1-75/P2-08: internal current rows and their last authenticated writer;
     public read DTOs never contain this ownership metadata. */
  const revisionsLlavor = { actuals: new Map(), autoria: new Map() };
  const usuari = () => usuariDeSessio();
  /* Qui actua en local: la sessió o, sense sessió, el convidat (com moderacio.js en seed). */
  const qui = () => usuari()?.id || getDefaultUserId();
  const bloquejosDe = (persona) => [...(moderacio.bloquejos.get(String(persona))?.values() ?? [])].reverse();
  const tancaCanals = async () => {
    const baixes = [...subscripcions.values()];
    subscripcions.clear();
    await Promise.all(baixes.map((baixa) => Promise.resolve().then(baixa).catch(() => {})));
  };

  /* PC155-01 · El tancament es declara abans de compondre els mòduls: e.abast el llig. */
  let tancat = false;
  const errorTancat = () => new Error('[adaptadorLocal] Adaptador tancat.');
  /* PC155-01 · L'abast de qui crida (persona i entrada de la sessió), capturat
     abans d'esperar. El comprovador que torna llança si l'adaptador s'ha
     tancat, si l'entrada ha canviat (eixida, reentrada o un altre actor: el
     mateix AbortError de capturaSessio) o si la persona viva ja no és la
     capturada (també una sessió caducada). Una renovació no el mou. */
  const abast = () => {
    const persona = usuari()?.id ?? null;
    const entrada = capturaSessio();
    return () => {
      if (tancat) throw errorTancat();
      entrada();
      if ((usuari()?.id ?? null) !== persona) throw new DOMException('La sessió ha canviat.', 'AbortError');
    };
  };

  const e = Object.freeze({
    mode, configuracio, ci, ara, nouId, coleccio, copia, notes, perfils, seguiments, subscripcions, moderacio, dadesObertes, revisionsLlavor,
    usuari, qui, bloquejosDe, tancaCanals, abast,
    opcions: Object.freeze({
      personalitzacioOberta: personalitzacioOberta === true, restauracioOberta: restauracioOberta === true,
      politica: politica ? Object.freeze({ ...politica }) : null, administracioLocal: autoritatLocal
    }),
    /* Sense argument, el context de la sessió viva; amb un usuari capturat, el
       d'eixe usuari (PC155-01: l'exportació no torna a llegir la sessió). */
    contextSeguiments: (u = usuari()) => {
      const q = u?.id || getDefaultUserId();
      return { usuari: u, qui: q, bloquejos: bloquejosDe(q), bloquejosDe, pobles: [...(autoritatLocal?.pobles ?? []), ...coleccio('towns').map(p => ({ id: String(p.id ?? ''), slug: p.slug, nom: p.nom ?? p.title ?? p.name }))] };
    },
    alTancar: (fn) => { netejes.push(fn); }
  });

  const metodes = {};
  for (const part of [creaCompteLocal(e), creaAdminUsuarisLocal(e), creaContingutLocal(e), creaNotesLocal(e), creaConversesLocal(e),
    creaComunitatLocal(e), creaMitjansLocal(e), creaDadesObertesLocal(e)]) {
    for (const [nom, fn] of Object.entries(part)) {
      if (Object.hasOwn(metodes, nom)) throw new Error(`[adaptadorLocal] ${nom} ve de dos mòduls.`);
      if (typeof fn !== 'function') throw new TypeError(`[adaptadorLocal] ${nom} ha de ser una funció.`);
      metodes[nom] = fn;
    }
  }

  /* Les altes que deixarien un recurs viu si la crida es rebutja després de
     fer-les: es desfan abans de rebutjar (amb el mètode cru, no el guardat). */
  const DESFES_SI_ES_REBUTJA = Object.freeze({
    subscribeToXat: (alta) => metodes.unsubscribeFromXat(alta?.subscription)
  });
  /* PC155-01-A1 · Els mètodes que capturen l'abast EN CRIDAR, abans de la
     microtasca de la guarda, com l'adaptador Supabase (capturaSessio síncron a
     sessioDelCompte): un canvi de sessió en el mateix tic de la crida ja no
     entra al mètode. La resta de mètodes és l'opció C (seguiment de P2-08). */
  const AMB_ABAST_EN_CRIDAR = new Set(['exportaLesMeuesDades', ...ADMINISTRATIUS, ...METODES_CONNEXIONS]);
  /* La guarda transversal: un adaptador tancat no respon, i una crida
     síncrona que llança es torna un rebuig. El senyal i el tancament es miren
     en cridar i, de nou, just abans d'entrar al magatzem (la microtasca
     següent): un avortament en el mateix tic no escriu res. Si el senyal
     s'avorta o l'adaptador es tanca mentre treballa, el resultat no ix (tampoc
     el d'una lectura); l'efecte ja pot estar fet, com en un servidor, però una
     alta de canal es desfà. El canvi de persona el mira el mètode que espera,
     amb e.abast() (PC155-01: l'exportació); els d'AMB_ABAST_EN_CRIDAR, a més,
     des de la crida i abans d'entrar (PC155-01-A1). */
  const guardat = (nom, fn) => (...entrades) => {
    let args, abastCrida;
    try {
      if (tancat) throw errorTancat();
      abastCrida = AMB_ABAST_EN_CRIDAR.has(nom) ? abast() : null;
      args = ADMINISTRATIUS.has(nom) ? capturaArgumentsAdmin(nom, entrades) : METODES_CONNEXIONS.has(nom) ? capturaArgumentsConnexions(nom, entrades) : entrades;
    } catch (error) { return Promise.reject(error); }
    const estaAvortat = () => ADMINISTRATIUS.has(nom)
      ? senyalAvortat(args[nom === 'adminLlistaPobles' || nom === 'adminLligPersonalitzacio' ? 0 : 1])
      : args.some(senyalAvortat);
    const comprova = () => {
      if (tancat) throw errorTancat();
      if (estaAvortat()) throw cancelacio();
      abastCrida?.();
    };
    try { comprova(); } catch (error) { return Promise.reject(error); }
    const desfes = Object.hasOwn(DESFES_SI_ES_REBUTJA, nom) ? DESFES_SI_ES_REBUTJA[nom] : null;
    return Promise.resolve().then(() => { comprova(); return fn(...args); }).then(async (valor) => {
      abastCrida?.();
      const avortat = estaAvortat();
      /* PC155-01 · Tancat, cap resultat ix, tampoc el d'una lectura sense desfes. */
      if (!avortat && !tancat) return valor;
      if (desfes) await Promise.resolve().then(() => desfes(valor)).catch(() => {});
      throw avortat ? cancelacio() : errorTancat();
    });
  };
  const publics = {};
  for (const [nom, fn] of Object.entries(metodes)) publics[nom] = SINCRONS.has(nom) ? fn : guardat(nom, fn);

  /** Tanca l'adaptador: cap crida asíncrona més ni cap resultat de les que
      eren en vol, cap canal obert d'esta instància i els magatzems propis
      buits. El Xat no es buida: és global (localXat), i una instància nova
      amb el mateix tenantId el retroba. */
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
