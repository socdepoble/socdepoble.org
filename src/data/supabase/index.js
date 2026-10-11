/**
 * @module supabase
 * @description Punt d'entrada per a totes les operacions de Supabase.
 * @see [[Protocol Petorreta]]
 * @see [[Llei Enxufabilitat]]
 */

// Re-export de tots els mòduls
export * from './runtime.js';
export * from './admin.js';
export * from './content.js';
export * from './organizations.js';
export * from './auth.js';
export * from './notes.js';
export * from './xat.js';
export * from './storage.js';
export * from './realtime.js';
export * from './utils.js';
export * from './compte.js';
export * from './perfils.js';
/* Onada 11 (261010; prompt 261010_1730, tasca 2) · El segon factor del
   superadmin i la personalització del poble. */
export * from './segonFactor.js';
export * from './personalitzacio.js';



// Re-export identitat per complir contracte
export { getDefaultUserId, adoptaSessioExterna } from '../identitat.js';
export { getCurrentUser } from './runtime.js';
/* T2 i T4 · Capacitat 'salut'. Explícita a posta: dos `export *` amb el mateix
   nom s'anul·len en silenci i la capacitat desapareixeria sense avís. */
export { comprovaServidor } from './auth.js';


