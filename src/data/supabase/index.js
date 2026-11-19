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
export { revocaPublicacioMur, drenaRevocacionsMur, encuaRevocacioNotaMur, destroy } from './copublicacioMur.js';
export * from './organizations.js';
export * from './auth.js';
export * from './notes.js';
export { registraDenunciaPublica, adminSafataDenuncies, adminRevisaDenuncia } from './lssi.js';
export * from './xat.js';
/* P0-122 · El servei distingix SQL absent d'una denegació real i conserva
   l'estat local explícit; l'adaptador exposa les cinc operacions juntes. */
export { carregaAccionsMissatges, alternaReaccio, alternaDestacat, alternaFixat, eliminaPerAMi } from './xatAccions.js';
/* Sanejament R15 (B2 · P1-01, R15-REG-05, Q-06) · El ritme del xat (RPC xat_ritme i
   xat_presencia, migracions 2611080430/0431/0432) i la IAIA amb servidor (funció
   iaia) NO són a la producció de Supabase. L'adaptador només anuncia eixes
   capacitats si el build ho demana amb una bandera literal (Vite la plega:
   tooling/vite/banderes-de-capacitat.mjs). Apagada, l'export val undefined:
   backendPort la tracta com a absent (teCapacitat fals, cap petició) i Rollup
   deixa fora xatRitme.js i iaia.js. El Node 0 ho decidix pel seu estat
   (clientPrivatNodeZero.js) i no passa per ací. */
import { loadRitmeXat as loadRitmeXatAmbServidor, actualitzaPresenciaXat as actualitzaPresenciaXatAmbServidor } from './xatRitme.js';
import { consultaIAIA as consultaIAIAAmbServidor } from './iaia.js';
export const loadRitmeXat = import.meta.env.VITE_SDP_XAT_RITME === '1' ? loadRitmeXatAmbServidor : undefined;
export const actualitzaPresenciaXat = import.meta.env.VITE_SDP_XAT_RITME === '1' ? actualitzaPresenciaXatAmbServidor : undefined;
export const consultaIAIA = import.meta.env.VITE_SDP_IAIA_SERVIDOR === '1' ? consultaIAIAAmbServidor : undefined;
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
export { lligPublicadorsRegistrats, traspassaPublicacio, reverteixTraspasPublicacio } from './copublicacio.js';
export { loadSeedRevisions, desaRevisioSeed } from './seedRevisions.js';
export { llistaRevisionsPatrimoni, desaRevisioPatrimoni, esborraRevisioPatrimoni } from './revisionsPatrimoni.js';
import { capturaConsultaProjeccionsCataleg } from '../projeccionsCataleg.js';
import { capturaSessio as capturaSessioProjeccions } from '../identitat.js';
export async function loadProjeccionsCataleg(input = {}, config = {}) {
  const query = capturaConsultaProjeccionsCataleg(input), capturedConfig = { ...config }, check = capturaSessioProjeccions();
  const reader = await import('./projeccionsCataleg.js');
  check();
  return reader.loadProjeccionsCataleg(query, capturedConfig);
}

/* PRODNM-07 (revisió R15b) · Les RPC de curadoria cultural són de la migració 2611091500, que la
   producció encara NO té: cridar-les deixa un 404 de PostgREST a la consola de cada visita a
   /page/la-iaia-sabuda. L'adaptador només anuncia la capacitat 'curadoriaCultural' si el build
   ho demana amb VITE_SDP_CURADORIA_CULTURAL=1, que s'encén després d'aplicar la migració.
   Apagada, les quatre valen undefined: el port la tracta com a absent (teCapacitat fals, cap
   petició) i la pàgina diu que no recull res. Sempre les quatre juntes: una capacitat parcial
   tomba la validació del port. */
import * as curadoriaAmbServidor from './curadoriaCultural.js';
const ambCuradoria = import.meta.env.VITE_SDP_CURADORIA_CULTURAL === '1';
export const estatCuradoriaCultural = ambCuradoria ? curadoriaAmbServidor.estatCuradoriaCultural : undefined;
export const llistaAportacionsCulturals = ambCuradoria ? curadoriaAmbServidor.llistaAportacionsCulturals : undefined;
export const enviaAportacioCultural = ambCuradoria ? curadoriaAmbServidor.enviaAportacioCultural : undefined;
export const revisaAportacioCultural = ambCuradoria ? curadoriaAmbServidor.revisaAportacioCultural : undefined;

/* P0-111 (Onada R18) · La migració 2611110455_revisions_editorials_wp.sql encara no és aplicada
   al servidor remot: com en curadoriaCultural, l'adaptador Supabase només anuncia la capacitat
   quan VITE_SDP_REVISIONS_EDITORIALS_WP=1 s'encén després d'aplicar la migració (evitant 404). */
import * as revisionsWpAmbServidor from './revisionsEditorialsWp.js';
const ambRevisionsWp = import.meta.env.VITE_SDP_REVISIONS_EDITORIALS_WP === '1';
export const llistaRevisionsEditorialsWp = ambRevisionsWp ? revisionsWpAmbServidor.llistaRevisionsEditorialsWp : undefined;
export const desaRevisioEditorialWp = ambRevisionsWp ? revisionsWpAmbServidor.desaRevisioEditorialWp : undefined;

/* R24 · CODEX-R24-03 · Capacitat 'consensIsoglosses' del joc «D'on parles?» (consensIsoglosses.js).
   Onada R28 · Els seus objectes SQL (la RPC resum_consens_isoglosses_poble i les taules
   joc_isoglosses_vots_consens i aportacions_veu_poble, de les migracions R23 20261113233000 i
   20261114023000) ja són a producció: els va aplicar el Mestre el 14-11-2026 (5/5 true,
   supabase/README.md). La bandera VITE_SDP_CONSENS_ISOGLOSSES continua apagada per decisió, no
   per absència: l'etiqueta i la clau d'una variant nova no passen per moderació, i encendre-la
   és decisió del Mestre (les quotes R28 de 20261115030000 tampoc no hi són aplicades). Com
   curadoriaCultural, l'adaptador només anuncia la capacitat amb VITE_SDP_CONSENS_ISOGLOSSES=1.
   Apagada, les tres valen undefined: el port la tracta com a absent (teCapacitat fals, cap
   petició ni cap 404) i la targeta continua en el seu mode local honest. Sempre les tres juntes. */
import * as consensAmbServidor from './consensIsoglosses.js';
const ambConsens = import.meta.env.VITE_SDP_CONSENS_ISOGLOSSES === '1';
export const lligConsensIsoglossesPoble = ambConsens ? consensAmbServidor.lligConsensIsoglossesPoble : undefined;
export const votaVariantIsoglossaPoble = ambConsens ? consensAmbServidor.votaVariantIsoglossaPoble : undefined;
export const desaAportacioVeuPoble = ambConsens ? consensAmbServidor.desaAportacioVeuPoble : undefined;

/* Explicitly invoked only after the optional R32.13 SQL is installed. */
export async function confirmaCapturaCrdtRural(input, config = {}) { return (await import('./crdtRuralAck.js')).confirmaCapturaCrdtRural(input, config); }
export async function registraDenunciaDiligent(input, config = {}) { return (await import('./denunciesDiligents.js')).registraDenunciaDiligent(input, config); }
export async function revisaDenunciaDiligent(input, config = {}) { return (await import('./denunciesDiligents.js')).revisaDenunciaDiligent(input, config); }
export async function llistaDenunciesDiligents(input, config = {}) { return (await import('./denunciesDiligents.js')).llistaDenunciesDiligents(input, config); }
