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
export * from './xatMultimedia.js';
export * from './storage.js';
export * from './realtime.js';
export * from './utils.js';
export * from './compte.js';
export * from './perfils.js';
/* Onada 11 (261010; prompt 261010_1730, tasca 2) · El segon factor del
   superadmin i la personalització del poble. */
export * from './segonFactor.js';
export * from './personalitzacio.js';
/* Fase D (261020, tasca 2; pla 261020_1300) · La moderació i les normes de
   convivència. */
export * from './moderacio.js';



// Re-export identitat per complir contracte
export { getDefaultUserId, adoptaSessioExterna } from '../identitat.js';
export { getCurrentUser } from './runtime.js';
/* T2 i T4 · Capacitat 'salut'. Explícita a posta: dos `export *` amb el mateix
   nom s'anul·len en silenci i la capacitat desapareixeria sense avís. */
export { comprovaServidor } from './auth.js';
/* Fase D (261020, tasca 1) · Capacitat 'entradaAmbToken' (Apple i Google des
   del full natiu). Explícita pel mateix motiu. */
export { entraAmbTokenDeProveidor } from './auth.js';
/* Pla 261018_1605 (Tasca 4, D8; ordre del Mestre, 18-10-2026) · Capacitat
   'mitjansPropis', la biblioteca de fotos pròpies. Explícita pel mateix motiu. */
export { llistaElsMeusMitjans, esborraElMeuMitja } from './storage.js';
/* Fase D (261020, tasca 2) · Capacitats 'moderacio' i 'normesConvivencia'.
   Explícites pel mateix motiu. */
export {
  denunciaContingut, llistaBloquejos, bloquejaAutor, desbloquejaAutor, estatNormes, acceptaNormes
} from './moderacio.js';
/* Pla 261022_1955 (Cercador Universal, T1) · Capacitat 'directoriEntitats', el
   directori públic de /cerca. Explícita pel mateix motiu. */
export { listPublicOrganizations } from './organizations.js';
/* T6b (IDEA-14; decisió del Mestre, 261024) · Capacitat 'seguiments',
   «Connectar / Seguir». Explícita pel mateix motiu. */
export {
  segueix, deixaDeSeguir, estatSeguiment, elsMeusSeguiments, quiEmSegueix
} from './seguiments.js';


