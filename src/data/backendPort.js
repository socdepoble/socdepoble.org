import { CONTRACTE_BACKEND, CONTRACTE_NUCLI, CAPACITATS } from './contracte.js';

let currentImpl = null;
let isLocked = false;
let dispose = null;
const EMPTY = Object.freeze(Object.create(null));

export function setBackendImplementation(impl, force = false) {
  const isDev = import.meta.env?.DEV === true ||
    (typeof process !== 'undefined' && process.env.NODE_ENV === 'development');
  if (isLocked && !(force && isDev)) throw new Error('[backendPort] Backend bloquejat');
  if (!impl || typeof impl !== 'object') throw new TypeError('[backendPort] Implementació invàlida');
  const prepared = validaBackendImplementation(impl);
  // Commit després de validar-ho tot; cap mètode de la implementació vella sobreviu.
  currentImpl = prepared.candidate;
  dispose = prepared.dispose;
}
export function validaBackendImplementation(impl) {
  if (!impl || typeof impl !== 'object') throw new TypeError('[backendPort] Implementació invàlida');
  const candidate = Object.create(null);
  for (const name of CONTRACTE_BACKEND) {
    // La resolució normal conserva l'override de la instància/subclasse.
    // Els getters no s'executen com a efecte lateral de validar el contracte.
    let owner = impl, descriptor;
    while (owner && owner !== Object.prototype) {
      descriptor = Object.getOwnPropertyDescriptor(owner, name);
      if (descriptor) break;
      owner = Object.getPrototypeOf(owner);
    }
    if (!descriptor) continue;
    if (!('value' in descriptor) || typeof descriptor.value !== 'function')
      throw new TypeError(`[backendPort] ${name} ha de ser un mètode`);
    candidate[name] = descriptor.value.bind(impl);
  }
  const missing = CONTRACTE_NUCLI.filter(name => typeof candidate[name] !== 'function');
  if (missing.length) throw new Error(`[backendPort] Nucli incomplet: ${missing.join(', ')}`);
  for (const [cap, methods] of Object.entries(CAPACITATS)) {
    const count = methods.filter(name => typeof candidate[name] === 'function').length;
    if (count && count !== methods.length) throw new Error(`[backendPort] Capacitat parcial: ${cap}`);
  }
  let teardownOwner = impl, teardown;
  while (teardownOwner && teardownOwner !== Object.prototype) {
    teardown = Object.getOwnPropertyDescriptor(teardownOwner, 'destroy');
    if (teardown) break;
    teardownOwner = Object.getPrototypeOf(teardownOwner);
  }
  if (teardown && (!('value' in teardown) || typeof teardown.value !== 'function'))
    throw new TypeError('[backendPort] destroy invàlid');
  return { candidate: Object.freeze(candidate), dispose: teardown ? teardown.value.bind(impl) : null };
}
export function getBackendImplementation() { return currentImpl || EMPTY; }
export function freezeImplementation() {
  if (!currentImpl) throw new Error('[backendPort] No hi ha backend per segellar');
  isLocked = true;
}
export function destroy() { const fn = dispose; dispose = null; return fn?.(); }
export function teCapacitat(cap) {
  return Object.hasOwn(CAPACITATS, cap) && !!currentImpl && CAPACITATS[cap].every(name => typeof currentImpl[name] === 'function');
}

const asseguraMetode = (nom) => (...args) => {
  if (!currentImpl || typeof currentImpl[nom] !== 'function') {
    throw new Error(`[backendPort] El mètode "${nom}" no està implementat al backend actual.`);
  }
  return currentImpl[nom](...args);
};

export const adoptaSessioExterna = asseguraMetode('adoptaSessioExterna');
export const getDefaultUserId = asseguraMetode('getDefaultUserId');
export const refrescaSessio = asseguraMetode('refrescaSessio');
export const elMeuRol = asseguraMetode('elMeuRol');

export const loadCoreContent = asseguraMetode('loadCoreContent');
export const loadMur = asseguraMetode('loadMur');
export const loadMultimedia = asseguraMetode('loadMultimedia');
export const loadNotesPage = asseguraMetode('loadNotesPage');
/* Decisió 4 del Mestre (261007) · «Carregar-ne més» (capacitat
   'paginacioSeccions'). No és nucli: MurContext pregunta abans amb
   teCapacitat i, sense ella, no ofereix el botó. */
export const loadSeccioPage = asseguraMetode('loadSeccioPage');
export const loadNotes = asseguraMetode('loadNotes');
export const appendChatMessages = asseguraMetode('appendChatMessages');

export const appendSectionSubmissionNetworkOnly = asseguraMetode('appendSectionSubmissionNetworkOnly');
export const updateNote = asseguraMetode('updateNote');
export const loginWithMagicLink = asseguraMetode('loginWithMagicLink');
export const registerWithPassword = asseguraMetode('registerWithPassword');
export const loginWithPassword = asseguraMetode('loginWithPassword');
export const loginWithGoogle = asseguraMetode('loginWithGoogle');
export const listMyOrganizations = asseguraMetode('listMyOrganizations');
export const createOrganization = asseguraMetode('createOrganization');
export const updateOrganization = asseguraMetode('updateOrganization');
export const updateProfile = asseguraMetode('updateProfile');
export const updateUserPassword = asseguraMetode('updateUserPassword');
export const getProfile = asseguraMetode('getProfile');
export const recullTornadaOAuth = async (...args) => {
  await import('../host.js').then(m => m.quanLlest());
  if (!currentImpl || typeof currentImpl['recullTornadaOAuth'] !== 'function') {
    return Promise.reject(new Error(`[backendPort] El mètode "recullTornadaOAuth" no està implementat al backend actual.`));
  }
  return currentImpl['recullTornadaOAuth'](...args);
};
export const logout = asseguraMetode('logout');
export const getCurrentUser = asseguraMetode('getCurrentUser');
export const getBackendConfigurat = asseguraMetode('getBackendConfigurat');
export const getRuntimeDataMode = asseguraMetode('getRuntimeDataMode');


// Nous mètodes per al Xat v2 i el pont amb Notes
export const createNote = asseguraMetode('createNote');
export const loadFils = asseguraMetode('loadFils');
export const loadMissatges = asseguraMetode('loadMissatges');
export const enviaMissatge = asseguraMetode('enviaMissatge');
export const marcaLlegit = asseguraMetode('marcaLlegit');
export const creaFilDirecte = asseguraMetode('creaFilDirecte');
export const carregaMembres = asseguraMetode('carregaMembres');
export const subscribeToXat = asseguraMetode('subscribeToXat');
export const unsubscribeFromXat = asseguraMetode('unsubscribeFromXat');

// Mode Administrador
export const adminListUsers = asseguraMetode('adminListUsers');
export const adminListOrganizations = asseguraMetode('adminListOrganizations');


/* Fase 4 · Mitjans (capacitat 'mitjans').
   Cap component importa Supabase: demanen la capacitat i, si no hi és,
   es queden amb el comportament d'abans. */
export const uploadToStorage = async (...args) => {
  await import('../host.js').then(m => m.quanLlest());
  if (!currentImpl || typeof currentImpl['uploadToStorage'] !== 'function') {
    throw new Error(`[backendPort] El mètode "uploadToStorage" no està implementat al backend actual.`);
  }
  return currentImpl['uploadToStorage'](...args);
};
export const getPublicUrl = asseguraMetode('getPublicUrl');
export const resolveAsset = asseguraMetode('resolveAsset');
export const promoteToPublic = asseguraMetode('promoteToPublic');

/* Pla 261018_1605 (Tasca 4, D8; ordre del Mestre, 18-10-2026) · La biblioteca
   de fotos pròpies (capacitat 'mitjansPropis'). No és nucli ni part de
   'mitjans': «Multimèdia» pregunta abans amb teCapacitat i, sense ella, només
   pinta les fotos actives de la fitxa. */
export const llistaElsMeusMitjans = asseguraMetode('llistaElsMeusMitjans');
export const esborraElMeuMitja = asseguraMetode('esborraElMeuMitja');
export const quotaXat = asseguraMetode('quotaXat');
export const publicaAdjuntXat = asseguraMetode('publicaAdjuntXat');
export const urlAdjuntXat = asseguraMetode('urlAdjuntXat');
export const descartaAdjuntXat = asseguraMetode('descartaAdjuntXat');

/* Fase 5 · Agenda */
export const loadActesAgenda = asseguraMetode('loadActesAgenda');

/* Fase 1 · Compte i consentiment (capacitats 'compte' i 'consentiment').
   Cap és nucli: la interfície pregunta abans amb teCapacitat, perquè
   asseguraMetode llança de manera síncrona si el backend no les té. */
export const exportaLesMeuesDades = asseguraMetode('exportaLesMeuesDades');
export const estatBaixa = asseguraMetode('estatBaixa');
export const demanaBaixa = asseguraMetode('demanaBaixa');
export const cancelaBaixa = asseguraMetode('cancelaBaixa');
export const estatConsentiment = asseguraMetode('estatConsentiment');
export const registraConsentiment = asseguraMetode('registraConsentiment');
export const revocaConsentiment = asseguraMetode('revocaConsentiment');

/* Cicle de vida de les notes (capacitat 'cicleNotes'). Tampoc és nucli:
   l'editor només pinta «Borrar» si teCapacitat('cicleNotes'). */
export const mouNota = asseguraMetode('mouNota');
export const esborraNota = asseguraMetode('esborraNota');

/* Lògica d'Usuari · perfil públic (capacitat 'directori') i agents IA
   administrats (capacitat 'agents'). Cap és nucli: la interfície pregunta
   abans amb teCapacitat. */
export const loadPerfilPublic = asseguraMetode('loadPerfilPublic');
export const listMyAgents = asseguraMetode('listMyAgents');
export const updateAgent = asseguraMetode('updateAgent');

/* T43 (ordre del Mestre, 260928) · Administrar organitzacions (capacitat
   'reclamacions') i el seu correu opcional ('contacteOrganitzacio'). Cap és
   nucli: la interfície pregunta abans amb teCapacitat. */
export const reclamaOrganitzacio = asseguraMetode('reclamaOrganitzacio');
export const lesMevesReclamacions = asseguraMetode('lesMevesReclamacions');
export const llegeixContacteOrganitzacio = asseguraMetode('llegeixContacteOrganitzacio');
export const desaContacteOrganitzacio = asseguraMetode('desaContacteOrganitzacio');

/* T63.2 i T67 · El xat comú d'una Pàgina Universal (capacitat 'xatDePagina').
   No és nucli: XatContext pregunta abans amb teCapacitat i, sense ella,
   rebutja amb un error de codi 'sense-capacitat'. */
export const obriFilDePagina = asseguraMetode('obriFilDePagina');

/* T2 i T4 · Salut del node (capacitat 'salut'). No és nucli: /registre
   pregunta abans amb teCapacitat i, sense ella, canvia de mode com abans. */
export const comprovaServidor = asseguraMetode('comprovaServidor');

/* R (Onada 3, 261003) · Recuperar la contrasenya (capacitat
   'recuperacioContrasenya'). No és nucli: /registre pregunta abans amb
   teCapacitat i, sense ella, no pinta l'enllaç. R2 · definixContrasenyaNova
   verifica l'enllaç pendent i definix en una sola crida (contracte.js). */
export const demanaRecuperacioContrasenya = asseguraMetode('demanaRecuperacioContrasenya');
export const definixContrasenyaNova = asseguraMetode('definixContrasenyaNova');

/* Fase D (261020, tasca 1) · Entrar amb el testimoni d'un proveïdor (capacitat
   'entradaAmbToken'): el full natiu d'Apple o de Google. No és nucli: /registre
   pregunta abans amb teCapacitat i, sense ella, no pinta els botons natius. */
export const entraAmbTokenDeProveidor = asseguraMetode('entraAmbTokenDeProveidor');

/* Ordre del Mestre (261008, grup C) · Els membres d'una organització
   (capacitat 'membresOrganitzacio'). No és nucli: el Perfil pregunta abans
   amb teCapacitat i, sense ella, no pinta la gestió de membres ni «Eixir». */
export const llistaMembresOrganitzacio = asseguraMetode('llistaMembresOrganitzacio');
export const desaMembreOrganitzacio = asseguraMetode('desaMembreOrganitzacio');
export const llevaMembreOrganitzacio = asseguraMetode('llevaMembreOrganitzacio');

/* Onada 11 (261010; prompt 261010_1730, tasca 2) · El segon factor del
   superadmin (capacitat 'segonFactor'). No és nucli: «El compte» pregunta
   abans amb teCapacitat i, sense ella, no pinta la inscripció. */
export const llistaFactors = asseguraMetode('llistaFactors');
export const inscriuFactor = asseguraMetode('inscriuFactor');
export const reptaFactor = asseguraMetode('reptaFactor');
export const verificaFactor = asseguraMetode('verificaFactor');
export const retiraFactor = asseguraMetode('retiraFactor');

/* Onada 11 (261010; prompt 261010_1730, tasca 2) · La personalització del
   poble (capacitat 'personalitzacio'). No és nucli: el Tauler pregunta abans
   amb teCapacitat i, sense ella, no pinta «Desa». La lectura va dins de
   loadCoreContent (camp additiu `personalitzacio`). */
export const adminDesaPersonalitzacio = asseguraMetode('adminDesaPersonalitzacio');
export const adminHistorialPersonalitzacio = asseguraMetode('adminHistorialPersonalitzacio');

/* Fase D (261020, tasca 2; pla 261020_1300) · La moderació (capacitat
   'moderacio') i les normes de convivència ('normesConvivencia'). Cap és
   nucli: ModeracioContext pregunta abans amb teCapacitat i, sense elles,
   cap targeta ni bombolla no pinta «Més opcions» ni cap porta de normes. */
export const denunciaContingut = asseguraMetode('denunciaContingut');
export const llistaBloquejos = asseguraMetode('llistaBloquejos');
export const bloquejaAutor = asseguraMetode('bloquejaAutor');
export const desbloquejaAutor = asseguraMetode('desbloquejaAutor');
export const estatNormes = asseguraMetode('estatNormes');
export const acceptaNormes = asseguraMetode('acceptaNormes');
