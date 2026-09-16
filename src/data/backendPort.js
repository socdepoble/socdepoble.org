// src/data/backendPort.js

import { CONTRACTE_BACKEND, CAPACITATS } from './contracte.js';

let currentImpl = null;
let isLocked = false;

export function setBackendImplementation(impl, force = false) {
  const isDev = typeof process !== 'undefined' ? process.env.NODE_ENV === 'development' : (typeof import.meta !== 'undefined' && import.meta.env?.DEV);
  if (isLocked && (!force || !isDev)) {
    throw new Error('[backendPort] 🔒 Backend bloquejat. Injecció tardana detectada. El salt forçós (force) només s\'admet en desenvolupament.');
  }
  if (!currentImpl) currentImpl = {};
  
  let obj = impl;
  while (obj && obj !== Object.prototype) {
    for (const key of Object.getOwnPropertyNames(obj)) {
      if (CONTRACTE_BACKEND.includes(key) && typeof obj[key] === 'function') {
        // Enllaçar al 'impl' original per preservar el 'this' de la classe
        currentImpl[key] = obj[key].bind(impl);
      } else if (CONTRACTE_BACKEND.includes(key)) {
        currentImpl[key] = obj[key];
      }
    }
    obj = Object.getPrototypeOf(obj);
  }
}

export function getBackendImplementation() {
  return currentImpl || {};
}

export function freezeImplementation() {
  isLocked = true;
  if (currentImpl) Object.freeze(currentImpl);
}

export function destroy() {
  if (currentImpl && typeof currentImpl.destroy === 'function') {
    currentImpl.destroy();
  }
}

export function teCapacitat(cap) {
  if (!CAPACITATS[cap] || !currentImpl) return false;
  return CAPACITATS[cap].every(m => typeof currentImpl[m] === 'function');
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
export const recullTornadaOAuth = asseguraMetode('recullTornadaOAuth');
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
export const uploadToStorage = asseguraMetode('uploadToStorage');
export const getPublicUrl = asseguraMetode('getPublicUrl');
