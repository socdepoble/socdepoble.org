/**
 * i18nTaxonomiaV26.js — Diccionari diferit en 5 llengües (ca, es, en, eu, gl)
 * per a G26-2 (IDEA-360 Taxonomia Geogràfica, IDEA-365 Píndoles clicables,
 * IDEA-370 Pàgina Editorial d'Etiqueta/Categoria, IDEA-375 Edició Directa).
 *
 * Prefix exclusiu `taxonomiaV26*` · +0 B al nucli WP d'arrencada: les dues
 * claus del bloc territorial de la targeta, l'única peça d'este diccionari que
 * viatja a l'arrencada estàtica, viuen a i18nTerritoriTargetaV26.js i s'hi
 * incorporen ací en cada llengua.
 * v1.2.26 (IDEA-365, Llibre Mestre línia 3820) · `taxonomiaV26EditorialAutomatica*`:
 * l'H2 i l'entradeta de la pàgina automàtica d'una classificació sense pàgina
 * editorial al catàleg.
 */
import { TEXTOS_TERRITORI_TARGETA_V26 } from './i18nTerritoriTargetaV26.js';

const TEXTOS = Object.freeze({
  ca: Object.freeze({
    ...TEXTOS_TERRITORI_TARGETA_V26.ca,
    taxonomiaV26XarxaPobles: 'Xarxa de Pobles',
    taxonomiaV26ComarcaSubtitol: '{demarcacio} · {n} pobles documentats',
    taxonomiaV26ComarcaEntradeta: 'Pobles, activitats i publicacions vinculades a la comarca {deComarca} dins la Xarxa de Pobles de Sóc de Poble.',
    taxonomiaV26ComarcaPoblesTitol: 'Pobles de la comarca',
    taxonomiaV26ComarcaPublicacionsTitol: 'Publicacions i agenda del territori',
    taxonomiaV26ComarcaCapPublicacio: 'Encara no hi ha publicacions o actes registrats en esta comarca.',
    taxonomiaV26ComarcaNoTrobada: 'Comarca no trobada',
    taxonomiaV26ComarcaNoTrobadaSub: 'Esta adreça no correspon a cap comarca documentada a la Xarxa de Pobles.',
    taxonomiaV26ComarcaTornarPobles: 'Tornar a Xarxa de Pobles',
    taxonomiaV26EditorialAlies: 'També coneguda com',
    taxonomiaV26EditorialRutaDedicada: 'Obrir secció dedicada',
    taxonomiaV26EditorialPublicacionsTitol: 'Publicacions i recursos relacionats',
    taxonomiaV26EditorialSensePublicacions: 'Encara no hi ha publicacions amb esta classificació.',
    taxonomiaV26EditorialTornarMur: 'Tornar al Mur',
    taxonomiaV26EditorialTipusCategoria: 'Categoria de sistema',
    taxonomiaV26EditorialTipusEtiqueta: 'Etiqueta editorial',
    taxonomiaV26EditorialNoTrobada: 'Classificació no trobada',
    taxonomiaV26EditorialNoTrobadaSub: 'Esta categoria o etiqueta encara no té pàgina editorial publicada.',
    taxonomiaV26EditorialAutomaticaSubtitol: 'Totes les publicacions amb esta classificació',
    taxonomiaV26EditorialAutomaticaEntradeta: 'Pàgina automàtica amb les publicacions que porten «{nom}». Encara no té cap text editorial propi.',
    taxonomiaV26EditorBotoObrir: 'Editar taxonomia',
    taxonomiaV26EditorBotoTancar: 'Tancar editor de taxonomia',
    taxonomiaV26EditorTitol: 'Edició directa de taxonomia i geografia',
    taxonomiaV26EditorSubtitol: 'Actualitza categories de sistema, etiquetes i àmbit geogràfic sense modificar el cos del document.',
    taxonomiaV26EditorCategoriesSistema: 'Categories de sistema (mínim 1 obligatòria)',
    taxonomiaV26EditorCategoriesTematiques: 'Categories temàtiques',
    taxonomiaV26EditorEtiquetes: 'Etiquetes',
    taxonomiaV26EditorEtiquetaNova: 'Afegir etiqueta (separades per comes)',
    taxonomiaV26EditorAfegirEtiqueta: 'Afegir',
    taxonomiaV26EditorGeografia: 'Taxonomia geogràfica',
    taxonomiaV26EditorXarxa: 'Xarxa (ex. Xarxa de Pobles)',
    taxonomiaV26EditorDemarcacions: 'Demarcacions (separades per comes)',
    taxonomiaV26EditorComarques: 'Comarques (separades per comes)',
    taxonomiaV26EditorPobles: 'Pobles (separats per comes)',
    taxonomiaV26EditorParatges: 'Paratges o muntanyes (separats per comes)',
    taxonomiaV26EditorDesar: 'Desar taxonomia',
    taxonomiaV26EditorDesant: 'Desant…',
    taxonomiaV26EditorDesatOk: 'Taxonomia actualitzada correctament.',
    taxonomiaV26EditorErrorMinimSistema: 'Cal marcar almenys una categoria de sistema.',
    taxonomiaV26EditorErrorConflicte: 'Una altra edició ha canviat la versió. Torna a carregar abans de desar.',
    taxonomiaV26EditorErrorDesat: 'No s’ha pogut desar la taxonomia en este entorn.',
    taxonomiaV26EditorCarregant: 'Carregant editor de taxonomia…'
  }),
  es: Object.freeze({
    ...TEXTOS_TERRITORI_TARGETA_V26.es,
    taxonomiaV26XarxaPobles: 'Red de Pueblos',
    taxonomiaV26ComarcaSubtitol: '{demarcacio} · {n} pueblos documentados',
    taxonomiaV26ComarcaEntradeta: 'Pueblos, actividades y publicaciones vinculadas a la comarca de {comarca} en la Red de Pueblos de Sóc de Poble.',
    taxonomiaV26ComarcaPoblesTitol: 'Pueblos de la comarca',
    taxonomiaV26ComarcaPublicacionsTitol: 'Publicaciones y agenda del territorio',
    taxonomiaV26ComarcaCapPublicacio: 'Todavía no hay publicaciones o eventos registrados en esta comarca.',
    taxonomiaV26ComarcaNoTrobada: 'Comarca no encontrada',
    taxonomiaV26ComarcaNoTrobadaSub: 'Esta dirección no corresponde a ninguna comarca documentada en la Red de Pueblos.',
    taxonomiaV26ComarcaTornarPobles: 'Volver a Red de Pueblos',
    taxonomiaV26EditorialAlies: 'También conocida como',
    taxonomiaV26EditorialRutaDedicada: 'Abrir sección dedicada',
    taxonomiaV26EditorialPublicacionsTitol: 'Publicaciones y recursos relacionados',
    taxonomiaV26EditorialSensePublicacions: 'Todavía no hay publicaciones con esta clasificación.',
    taxonomiaV26EditorialTornarMur: 'Volver al Muro',
    taxonomiaV26EditorialTipusCategoria: 'Categoría de sistema',
    taxonomiaV26EditorialTipusEtiqueta: 'Etiqueta editorial',
    taxonomiaV26EditorialNoTrobada: 'Clasificación no encontrada',
    taxonomiaV26EditorialNoTrobadaSub: 'Esta categoría o etiqueta todavía no tiene página editorial publicada.',
    taxonomiaV26EditorialAutomaticaSubtitol: 'Todas las publicaciones con esta clasificación',
    taxonomiaV26EditorialAutomaticaEntradeta: 'Página automática con las publicaciones que llevan «{nom}». Todavía no tiene ningún texto editorial propio.',
    taxonomiaV26EditorBotoObrir: 'Editar taxonomía',
    taxonomiaV26EditorBotoTancar: 'Cerrar editor de taxonomía',
    taxonomiaV26EditorTitol: 'Edición directa de taxonomía y geografía',
    taxonomiaV26EditorSubtitol: 'Actualiza categorías de sistema, etiquetas y ámbito geográfico sin modificar el cuerpo del documento.',
    taxonomiaV26EditorCategoriesSistema: 'Categorías de sistema (mínimo 1 obligatoria)',
    taxonomiaV26EditorCategoriesTematiques: 'Categorías temáticas',
    taxonomiaV26EditorEtiquetes: 'Etiquetas',
    taxonomiaV26EditorEtiquetaNova: 'Añadir etiqueta (separadas por comas)',
    taxonomiaV26EditorAfegirEtiqueta: 'Añadir',
    taxonomiaV26EditorGeografia: 'Taxonomía geográfica',
    taxonomiaV26EditorXarxa: 'Red (ej. Xarxa de Pobles)',
    taxonomiaV26EditorDemarcacions: 'Demarcaciones (separadas por comas)',
    taxonomiaV26EditorComarques: 'Comarcas (separadas por comas)',
    taxonomiaV26EditorPobles: 'Pueblos (separados por comas)',
    taxonomiaV26EditorParatges: 'Parajes o montañas (separados por comas)',
    taxonomiaV26EditorDesar: 'Guardar taxonomía',
    taxonomiaV26EditorDesant: 'Guardando…',
    taxonomiaV26EditorDesatOk: 'Taxonomía actualizada correctamente.',
    taxonomiaV26EditorErrorMinimSistema: 'Debes marcar al menos una categoría de sistema.',
    taxonomiaV26EditorErrorConflicte: 'Otra edición ha cambiado la versión. Recarga antes de guardar.',
    taxonomiaV26EditorErrorDesat: 'No se ha podido guardar la taxonomía en este entorno.',
    taxonomiaV26EditorCarregant: 'Cargando editor de taxonomía…'
  }),
  en: Object.freeze({
    ...TEXTOS_TERRITORI_TARGETA_V26.en,
    taxonomiaV26XarxaPobles: 'Network of Villages',
    taxonomiaV26ComarcaSubtitol: '{demarcacio} · {n} documented villages',
    taxonomiaV26ComarcaEntradeta: 'Villages, activities and posts linked to the county of {comarca} in the Sóc de Poble Network of Villages.',
    taxonomiaV26ComarcaPoblesTitol: 'Villages in this county',
    taxonomiaV26ComarcaPublicacionsTitol: 'Posts and local calendar',
    taxonomiaV26ComarcaCapPublicacio: 'There are no posts or events recorded in this county yet.',
    taxonomiaV26ComarcaNoTrobada: 'County not found',
    taxonomiaV26ComarcaNoTrobadaSub: 'This address does not match any documented county in the Network of Villages.',
    taxonomiaV26ComarcaTornarPobles: 'Back to Villages',
    taxonomiaV26EditorialAlies: 'Also known as',
    taxonomiaV26EditorialRutaDedicada: 'Open dedicated section',
    taxonomiaV26EditorialPublicacionsTitol: 'Related posts and resources',
    taxonomiaV26EditorialSensePublicacions: 'No posts match this classification yet.',
    taxonomiaV26EditorialTornarMur: 'Back to Wall',
    taxonomiaV26EditorialTipusCategoria: 'System category',
    taxonomiaV26EditorialTipusEtiqueta: 'Editorial tag',
    taxonomiaV26EditorialNoTrobada: 'Classification not found',
    taxonomiaV26EditorialNoTrobadaSub: 'This category or tag does not have a published editorial page yet.',
    taxonomiaV26EditorialAutomaticaSubtitol: 'All posts with this classification',
    taxonomiaV26EditorialAutomaticaEntradeta: 'Automatic page with the posts tagged “{nom}”. It has no editorial text of its own yet.',
    taxonomiaV26EditorBotoObrir: 'Edit taxonomy',
    taxonomiaV26EditorBotoTancar: 'Close taxonomy editor',
    taxonomiaV26EditorTitol: 'Direct taxonomy and geography editor',
    taxonomiaV26EditorSubtitol: 'Update system categories, tags and geographic scope without altering the document body.',
    taxonomiaV26EditorCategoriesSistema: 'System categories (at least 1 required)',
    taxonomiaV26EditorCategoriesTematiques: 'Thematic categories',
    taxonomiaV26EditorEtiquetes: 'Tags',
    taxonomiaV26EditorEtiquetaNova: 'Add tags (comma-separated)',
    taxonomiaV26EditorAfegirEtiqueta: 'Add',
    taxonomiaV26EditorGeografia: 'Geographic taxonomy',
    taxonomiaV26EditorXarxa: 'Network (e.g. Xarxa de Pobles)',
    taxonomiaV26EditorDemarcacions: 'Regions (comma-separated)',
    taxonomiaV26EditorComarques: 'Counties (comma-separated)',
    taxonomiaV26EditorPobles: 'Villages (comma-separated)',
    taxonomiaV26EditorParatges: 'Landmarks or mountains (comma-separated)',
    taxonomiaV26EditorDesar: 'Save taxonomy',
    taxonomiaV26EditorDesant: 'Saving…',
    taxonomiaV26EditorDesatOk: 'Taxonomy updated successfully.',
    taxonomiaV26EditorErrorMinimSistema: 'Select at least one system category.',
    taxonomiaV26EditorErrorConflicte: 'Another edit changed the version. Reload before saving.',
    taxonomiaV26EditorErrorDesat: 'Could not save taxonomy in this environment.',
    taxonomiaV26EditorCarregant: 'Loading taxonomy editor…'
  }),
  eu: Object.freeze({
    ...TEXTOS_TERRITORI_TARGETA_V26.eu,
    taxonomiaV26XarxaPobles: 'Herrien Sarea',
    taxonomiaV26ComarcaSubtitol: '{demarcacio} · {n} herri dokumentatu',
    taxonomiaV26ComarcaEntradeta: '{comarca} eskualdearekin lotutako herriak, jarduerak eta argitalpenak Sóc de Poble Herrien Sarean.',
    taxonomiaV26ComarcaPoblesTitol: 'Eskualdeko herriak',
    taxonomiaV26ComarcaPublicacionsTitol: 'Lurraldeko argitalpenak eta agenda',
    taxonomiaV26ComarcaCapPublicacio: 'Oraindik ez dago argitalpenik edo ekitaldirik eskualde honetan.',
    taxonomiaV26ComarcaNoTrobada: 'Eskualdea ez da aurkitu',
    taxonomiaV26ComarcaNoTrobadaSub: 'Helbide hau ez dagokio Herrien Sarean dokumentatutako eskualde bati.',
    taxonomiaV26ComarcaTornarPobles: 'Itzuli Herrien Sarera',
    taxonomiaV26EditorialAlies: 'Honela ere ezaguna',
    taxonomiaV26EditorialRutaDedicada: 'Ireki atal propioa',
    taxonomiaV26EditorialPublicacionsTitol: 'Lotutako argitalpenak eta baliabideak',
    taxonomiaV26EditorialSensePublicacions: 'Oraindik ez dago sailkapen hau duen argitalpenik.',
    taxonomiaV26EditorialTornarMur: 'Itzuli Hormara',
    taxonomiaV26EditorialTipusCategoria: 'Sistema-kategoria',
    taxonomiaV26EditorialTipusEtiqueta: 'Etiketa editoriala',
    taxonomiaV26EditorialNoTrobada: 'Sailkapena ez da aurkitu',
    taxonomiaV26EditorialNoTrobadaSub: 'Kategoria edo etiketa honek ez du oraindik orri editorialik.',
    taxonomiaV26EditorialAutomaticaSubtitol: 'Sailkapen hau duten argitalpen guztiak',
    taxonomiaV26EditorialAutomaticaEntradeta: '«{nom}» daramaten argitalpenen orri automatikoa. Oraindik ez du testu editorial propiorik.',
    taxonomiaV26EditorBotoObrir: 'Editatu taxonomia',
    taxonomiaV26EditorBotoTancar: 'Itxi taxonomia editorea',
    taxonomiaV26EditorTitol: 'Taxonomia eta geografiaren edizio zuzena',
    taxonomiaV26EditorSubtitol: 'Eguneratu sistema-kategoriak, etiketak eta geografia dokumentuaren gorputza aldatu gabe.',
    taxonomiaV26EditorCategoriesSistema: 'Sistema-kategoriak (gutxienez 1 derrigorrezkoa)',
    taxonomiaV26EditorCategoriesTematiques: 'Kategoria tematikoak',
    taxonomiaV26EditorEtiquetes: 'Etiketak',
    taxonomiaV26EditorEtiquetaNova: 'Gehitu etiketak (komaz bereizita)',
    taxonomiaV26EditorAfegirEtiqueta: 'Gehitu',
    taxonomiaV26EditorGeografia: 'Taxonomia geografikoa',
    taxonomiaV26EditorXarxa: 'Sarea (adib. Xarxa de Pobles)',
    taxonomiaV26EditorDemarcacions: 'Lurraldeak (komaz bereizita)',
    taxonomiaV26EditorComarques: 'Eskualdeak (komaz bereizita)',
    taxonomiaV26EditorPobles: 'Herriak (komaz bereizita)',
    taxonomiaV26EditorParatges: 'Inguruneak edo mendiak (komaz bereizita)',
    taxonomiaV26EditorDesar: 'Gorde taxonomia',
    taxonomiaV26EditorDesant: 'Gordetzen…',
    taxonomiaV26EditorDesatOk: 'Taxonomia behar bezala eguneratu da.',
    taxonomiaV26EditorErrorMinimSistema: 'Gutxienez sistema-kategoria bat hautatu behar da.',
    taxonomiaV26EditorErrorConflicte: 'Beste edizio batek bertsioa aldatu du. Kargatu berriro gorde aurretik.',
    taxonomiaV26EditorErrorDesat: 'Ezin izan da taxonomia gorde ingurune honetan.',
    taxonomiaV26EditorCarregant: 'Taxonomia editorea kargatzen…'
  }),
  gl: Object.freeze({
    ...TEXTOS_TERRITORI_TARGETA_V26.gl,
    taxonomiaV26XarxaPobles: 'Rede de Aldeas',
    taxonomiaV26ComarcaSubtitol: '{demarcacio} · {n} aldeas documentadas',
    taxonomiaV26ComarcaEntradeta: 'Aldeas, actividades e publicacións vinculadas á comarca de {comarca} na Rede de Aldeas de Sóc de Poble.',
    taxonomiaV26ComarcaPoblesTitol: 'Aldeas da comarca',
    taxonomiaV26ComarcaPublicacionsTitol: 'Publicacións e axenda do territorio',
    taxonomiaV26ComarcaCapPublicacio: 'Aínda non hai publicacións nin eventos rexistrados nesta comarca.',
    taxonomiaV26ComarcaNoTrobada: 'Comarca non atopada',
    taxonomiaV26ComarcaNoTrobadaSub: 'Este enderezo non corresponde a ningunha comarca documentada na Rede de Aldeas.',
    taxonomiaV26ComarcaTornarPobles: 'Volver á Rede de Aldeas',
    taxonomiaV26EditorialAlies: 'Tamén coñecida como',
    taxonomiaV26EditorialRutaDedicada: 'Abrir sección dedicada',
    taxonomiaV26EditorialPublicacionsTitol: 'Publicacións e recursos relacionados',
    taxonomiaV26EditorialSensePublicacions: 'Aínda non hai publicacións con esta clasificación.',
    taxonomiaV26EditorialTornarMur: 'Volver ao Muro',
    taxonomiaV26EditorialTipusCategoria: 'Categoría de sistema',
    taxonomiaV26EditorialTipusEtiqueta: 'Etiqueta editorial',
    taxonomiaV26EditorialNoTrobada: 'Clasificación non atopada',
    taxonomiaV26EditorialNoTrobadaSub: 'Esta categoría ou etiqueta aínda non ten páxina editorial publicada.',
    taxonomiaV26EditorialAutomaticaSubtitol: 'Todas as publicacións con esta clasificación',
    taxonomiaV26EditorialAutomaticaEntradeta: 'Páxina automática coas publicacións que levan «{nom}». Aínda non ten ningún texto editorial propio.',
    taxonomiaV26EditorBotoObrir: 'Editar taxonomía',
    taxonomiaV26EditorBotoTancar: 'Pechar editor de taxonomía',
    taxonomiaV26EditorTitol: 'Edición directa de taxonomía e xeografía',
    taxonomiaV26EditorSubtitol: 'Actualiza categorías de sistema, etiquetas e ámbito xeográfico sen modificar o corpo do documento.',
    taxonomiaV26EditorCategoriesSistema: 'Categorías de sistema (mínimo 1 obrigatoria)',
    taxonomiaV26EditorCategoriesTematiques: 'Categorías temáticas',
    taxonomiaV26EditorEtiquetes: 'Etiquetas',
    taxonomiaV26EditorEtiquetaNova: 'Engadir etiquetas (separadas por comas)',
    taxonomiaV26EditorAfegirEtiqueta: 'Engadir',
    taxonomiaV26EditorGeografia: 'Taxonomía xeográfica',
    taxonomiaV26EditorXarxa: 'Rede (ex. Xarxa de Pobles)',
    taxonomiaV26EditorDemarcacions: 'Demarcacións (separadas por comas)',
    taxonomiaV26EditorComarques: 'Comarcas (separadas por comas)',
    taxonomiaV26EditorPobles: 'Aldeas (separadas por comas)',
    taxonomiaV26EditorParatges: 'Paraxes ou montañas (separadas por comas)',
    taxonomiaV26EditorDesar: 'Gardar taxonomía',
    taxonomiaV26EditorDesant: 'Gardando…',
    taxonomiaV26EditorDesatOk: 'Taxonomía actualizada correctamente.',
    taxonomiaV26EditorErrorMinimSistema: 'Cómpre marcar polo menos unha categoría de sistema.',
    taxonomiaV26EditorErrorConflicte: 'Outra edición cambiou a versión. Recarga antes de gardar.',
    taxonomiaV26EditorErrorDesat: 'Non se puido gardar a taxonomía neste contorno.',
    taxonomiaV26EditorCarregant: 'Cargando editor de taxonomía…'
  })
});

export function codiIdiomaTaxonomiaV26(idioma) {
  const curt = String(idioma || 'ca').trim().toLowerCase().slice(0, 2);
  return Object.hasOwn(TEXTOS, curt) ? curt : 'ca';
}

export function textosTaxonomiaV26(idioma = 'ca') {
  return TEXTOS[codiIdiomaTaxonomiaV26(idioma)];
}

export const CLAUS_I18N_TAXONOMIA_V26 = Object.freeze(Object.keys(TEXTOS.ca));

/* Integrador C1-3 (verificador R2-5/R2-6, P2) · Valencià normatiu: la preposició «de» es contrau amb
   l'article del nom de la comarca, que dins del text va en minúscula: «del Comtat», «de l'Alacantí»,
   «de la Marina Alta», «dels Ports»; mai «de El Comtat» ni «de L'Alacantí». Les altres llengües
   conserven {comarca} tal qual fins que les revise una persona nativa. */
const ARTICLE_DE_COMARCA = /^(?:(Els|El|Les|La)\s+|(L['’]))(\S.*)$/u;
const CONTRACCIO_DE = Object.freeze({ Els: 'dels', El: 'del', Les: 'de les', La: 'de la' });

export function ambPreposicioDe(nom) {
  const text = String(nom ?? '').trim();
  const article = ARTICLE_DE_COMARCA.exec(text);
  if (!article) return `de ${text}`;
  return article[2] ? `de l'${article[3]}` : `${CONTRACCIO_DE[article[1]]} ${article[3]}`;
}

/* L'entradeta d'una pàgina de comarca: la mateixa al client (PaginaComarca.jsx) i al head
   prerenderitzat (tooling/seo/build-social-manifest.mjs). */
export function entradetaDeComarca(nom, idioma = 'ca') {
  return textosTaxonomiaV26(idioma).taxonomiaV26ComarcaEntradeta
    .replace('{deComarca}', () => ambPreposicioDe(nom))
    .replace('{comarca}', () => String(nom ?? '').trim());
}
export const DICCIONARIS_I18N_TAXONOMIA_V26 = TEXTOS;
