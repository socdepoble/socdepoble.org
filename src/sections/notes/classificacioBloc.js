/**
 * classificacioBloc.js · T7C · Les categories i etiquetes de sèrie del Bloc
 * de Notes, i l'avís de la categoria mínima. Una sola font per a la columna
 * de navegació (NotesSection), l'editor (NotesEditor), el Snippet Curador
 * (SnippetCurador) i Connectar (ConnectarSection).
 *
 * Com que sempre tornen al catàleg, als diàlegs no es reanomenen ni
 * s'esborren (DialegValors, `fixos`).
 *
 * Onada 11 (261010; prompt 261010_1730, tasca 2) · Els valors viuen a
 * src/data/personalitzacio.js, on la superadmin pot ampliar-los amb la
 * taxonomia del poble (categoriesBase, etiquetesBase); ací es re-exporten
 * perquè els consumidors del Bloc continuen tenint una sola porta. Les
 * còpies locals que portaven NotesEditor i ConnectarSection s'han unificat.
 */
import { CATEGORIA_GENERAL } from '../../components/universal/classificacio/model.js';
import { omple } from '../../config/moderacio.js';
import { tradueix } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';

export { CATEGORIES_BASE, ETIQUETES_BASE } from '../../data/personalitzacio.js';
export const PARELL_AVIS_CATEGORIA = Object.freeze(['section.notes.editor.avisCategoria', "Cal almenys una categoria. Si vols netejar-les, marca'n una de general, com «{categoria}»."]);
export const avisCategoria = (t = null) => omple(tradueix(t, PARELL_AVIS_CATEGORIA), { categoria: CATEGORIA_GENERAL });
/** La regla d'orfandat de les categories, dita a la persona (el mateix text de NotesEditor). */
export const AVIS_CATEGORIA = avisCategoria(null);
