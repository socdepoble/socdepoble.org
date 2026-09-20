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
  const teardown = Object.getOwnPropertyDescriptor(impl, 'destroy');
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

export const getDefaultUserId = asseguraMetode('getDefaultUserId');
export const refrescaSessio = asseguraMetode('refrescaSessio');
export const elMeuRol = asseguraMetode('elMeuRol');

export const loadCoreContent = asseguraMetode('loadCoreContent');
export const loadMur = asseguraMetode('loadMur');
export const loadMultimedia = asseguraMetode('loadMultimedia');
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

/* Fase 5 · Agenda */
export const loadActesAgenda = asseguraMetode('loadActesAgenda');