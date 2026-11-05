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
/* E1.2 (pla 261029_1305) · Explícit: transportAdjunts és intern de la branca xifrada, no del port. */
export { quotaXat, publicaAdjuntXat, urlAdjuntXat, descartaAdjuntXat } from './xatMultimedia.js';
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
/* T8b · P0-23 (BOT-A2; assalt 261101) · Capacitat 'versioClient', la versió
   mínima de l'app nativa (2611011510). Explícita pel mateix motiu. */
export { versioMinimaClient } from './versioClient.js';
/* Fase D (261020, tasca 1) · Capacitat 'entradaAmbToken' (Apple i Google des
   del full natiu). Explícita pel mateix motiu. */
export { entraAmbTokenDeProveidor } from './auth.js';
/* P1-12 Fase 4 (pla 261029_1305, Bloc C, E1.1 i E1.2) · Capacitats 'clausXat' i
   'xatMultimediaXifrat': transport opac (src/data/supabase/xatXifrat.js). Les
   dos llistes senceres, perquè una capacitat parcial tomba la validació del port. */
export {
  publicaIdentitatXat, laMevaIdentitatXat, desaFraseXat, clausDeXat, desaLlibretaXat, laMevaLlibretaXat, estatXifratXat,
  epoquesDelFilXat, sobresMeusXat, obriEpocaXat, enviaXifratXat, reembolcallaXat, demanaXifratXat,
  publicaAdjuntXifratXat, bytesAdjuntXat
} from './xatXifrat.js';
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
/* T2 · D04/D10 (assalt 261101) · Capacitat 'dadesObertes', la lectura
   anònima de les dades obertes del poble. Explícita pel mateix motiu. Este
   adaptador no restaura (sense 'restauracioDadesObertes', decisió D-3). */
export { llegixDadesObertes } from './dadesObertes.js';
/* T6b (IDEA-14; decisió del Mestre, 261024) · Capacitat 'seguiments',
   «Connectar / Seguir». Explícita pel mateix motiu. */
export {
  segueix, deixaDeSeguir, estatSeguiment, elsMeusSeguiments, quiEmSegueix
} from './seguiments.js';
/* IDEA-22, punt 2 (pla 261025_0200) · Capacitats 'titularPublic' i
   'consentimentTitular': la titular que ha triat mostrar-se i la seua tria.
   Explícites pel mateix motiu. */
export { loadTitularPublic, estatTitularPublic, marcaTitularPublic } from './perfils.js';
/* IDEA-24 (marató 261101_2143, B4) · Capacitat 'transferenciaPropietat', la
   transferència atòmica de la propietat (2610311500). Explícita pel mateix motiu. */
export { transfereixPropietatOrganitzacio } from './organizations.js';
/* B8C-2 (marató 261101_2143; Bloc B8) · Capacitat 'avisosPush', els aparells
   dels avisos push del Xat (B8-SERVIDOR §2.9). Explícita pel mateix motiu.
   'silenciXat' (silenciaFil) ix pel `export * from './xat.js'` de dalt. */
export { desaDispositiuAvisos, retiraDispositiuAvisos } from './dispositiusAvisos.js';


/* FEDI23 · Capacitat completa de connexions consentides, sis operacions. */
export { preferenciesConnexions, desaVisibilitatConnexions, connexionsPubliquesDe,
  membresIEntitatsConnectadesDe, inclouPersonaEnEntitat, solicitaUnirSeAEntitat } from './seguiments.js';

export {adminActualitzaPublicacioEditorial} from './editorialPublicada.js';
