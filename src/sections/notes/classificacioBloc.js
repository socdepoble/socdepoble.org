/**
 * classificacioBloc.js · T7C · Les categories i etiquetes de sèrie del Bloc
 * de Notes, i l'avís de la categoria mínima. Una sola font per a la columna
 * de navegació (NotesSection) i el Snippet Curador (SnippetCurador).
 *
 * Com que sempre tornen al catàleg, als diàlegs no es reanomenen ni
 * s'esborren (DialegValors, `fixos`). NotesEditor i ConnectarSection encara
 * en porten una còpia pròpia (pendent d'unificar fora del T7C).
 */
import { CATEGORIA_GENERAL } from '../../components/universal/classificacio/model.js';

/** Categories que sempre existixen al Bloc, encara que cap nota les use. */
export const CATEGORIES_BASE = Object.freeze(['Sistema']);
/** Etiquetes que sempre existixen al Bloc, encara que cap nota les use. */
export const ETIQUETES_BASE = Object.freeze(['Productivitat', 'Tutorial']);
/** La regla d'orfandat de les categories, dita a la persona (el mateix text de NotesEditor). */
export const AVIS_CATEGORIA = `Cal almenys una categoria. Si vols netejar-les, marca'n una de general, com «${CATEGORIA_GENERAL}».`;
