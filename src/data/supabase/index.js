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



// Re-export identitat per complir contracte
export { getDefaultUserId } from '../identitat.js';


