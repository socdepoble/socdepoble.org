import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { UniversalEditorShell } from './UniversalEditorShell';
import { SelectorVisibilitat, TEXTOS_VISIBILITAT } from './SelectorVisibilitat.jsx';
import BotoDretsAutor from './CopyrightSelector.jsx';
import { CopyrightPage } from './drets/CopyrightPage.jsx';
import DocumentPrintPreview from './DocumentPrintPreview.jsx';
import { UniversalPage } from './UniversalPage.jsx';
import { Boto, DateTimeControl, Dialeg } from '../PedraSeca/index.js';
import { dataHoraAra } from './barres/dataHoraBarra.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import {
  useUniversalRichText,
  useTipTapToolbarAdapter,
  UniversalRichTextToolbar,
  UniversalRichTextContent,
} from './richText';
import { extensionsRiques } from './richText/extensions';
/* T7 · Les peces de les targetes incrustades viuen en camins a banda: les
   proves que substituïxen './richText' i './richText/extensions' amb
   fàbriques tancades no les veuen. */
import { DialegTriaTargeta } from './richText/extensions/targetes/DialegTriaTargeta.jsx';
import { NOM_EXTENSIO_TARGETES, TargetesIncrustadesContext } from './richText/extensions/targetes/TargetesIncrustadesContext.js';
import { attrsDeEntrada } from './richText/extensions/targetes/formaDelGrup.js';
import { useUIActions } from '../../app/contexts/UIContext';
import { LLAVOR_NOTA } from '../../sections/notes/NotesSection.jsx';

/**
 * Interfície Adapter requerida:
 * {
 *   document: Object, // El document actual. Si és null, mostra l'estat buit.
 *   updateLocal: (id, field, value) => void, // Cridat immediatament a cada input.
 *   saveRemote: (id, field, value) => void, // Cridat amb debounce o a l'onBlur.
 *   publish: (document) => void, // Reserva: sense `visibilitat`, triar «pública» al
 *                              // selector el crida. PUBLICAR ja no publica directament.
 *   visibilitat: { textos, onTria(publica, document), bloqueig, comNom } // Opcional (T41).
 *                            // PUBLICAR i la bola del món obrin el SelectorVisibilitat;
 *                            // confirmar crida onTria i el consumidor decidix.
 *   ambDataPublicacio: Boolean // Opcional (T40, false). La pastilla de data obri el
 *                            // calendari i desa el camp 'publishDate' (ISO | null).
 *   avisDataPublicacio: String|null // Opcional (T40). Avís honest dins del calendari
 *                            // quan la data no es desa com la resta (columna en quarantena).
 *   uploadMedia: async (file) => String, // Lògica de pujada d'imatges (retorna URL).
 *   labels: Array, // Etiquetes visuals del document (ex: estat, lloc).
 *   emptyPlaceholder: String, // Text per a l'estat buit (títol de reserva).
 *   emptyDocument: Object, // Opcional. Document de benvinguda per a l'estat buit
 *                          // ({ title, subtitle, lead, heroImage, content, labels, copyright,
 *                          //    logoEntitat?, avatarAutor? }). Ordre del Mestre (261007,
 *                          // ordre E): logoEntitat i avatarAutor ({ src, alt }) pinten
 *                          // damunt de l'H1 el mateix que la fitxa pública, en lectura.
 *   classificacio: ReactNode // Opcional. Botonera de classificació (Carpetes, Categories,
 *                            // Etiquetes) davall del títol, al lloc de les píndoles.
 *   llicencia: ReactNode // Opcional. Ranura del botó de llicència, davall de la botonera.
 *   dretsAutor: { ambit, perDefecte, autor } // Opcional (T39). «Elegir drets d'autor»
 *                            // obri la vista a pantalla completa (CopyrightPage) dins
 *                            // de la columna. ambit: 'publicacio'|'perfil'|'neutre'
 *                            // (per defecte) tria l'avís d'herència; perDefecte, la
 *                            // llicència heretada; autor (per defecte barAuthorName),
 *                            // el nom de «© autor». Es desa pel camí de sempre.
 *   dretsTriats: String|null // Opcional (correcció de la revisió, 261008). La
 *                            // llicència TRIADA de veres, per a la píndola dels
 *                            // drets, quan document.copyright no ho és: el Perfil hi
 *                            // posa el «© Nom» de lectura encara que no se n'haja
 *                            // triat cap. Amb la clau mana ella (null o '' = cap
 *                            // triada: «Elegir drets d'autor»); la línia de la
 *                            // capçalera i la vista de drets continuen amb
 *                            // document.copyright. Sense la clau, document.copyright
 *                            // (Notes i el catàleg, el DOM de sempre).
 *   ambDrets: Boolean        // Opcional (Directiva de Dignitat Humana, pla
 *                            // 261015_1900; true). Amb false, el document no porta
 *                            // drets d'autor enlloc: ni la píndola de davall del
 *                            // títol (i, amb ella, «Vista A4 / PDF», que viu a la
 *                            // mateixa ranura), ni la línia de la capçalera (tampoc
 *                            // la reserva «© Sóc de Poble»), ni la vista de drets.
 *                            // La fitxa d'una persona (PerfilEditor): una persona no
 *                            // és una obra. Sense la clau, el DOM de sempre.
 *   statusIcon: ReactNode // Opcional. Icona del botó d'estat de la barra taronja.
 *   barAuthorAvatar, barAuthorName, barAuthorLocation: String // Opcionals. Autoria
 *                            // de la barra taronja (i de l'estat buit).
 *   barAuthorHref: String|null // Opcional. Ordre del Mestre (261007): «Quan
 *                            // isquen, les barres taronges han de portar a la
 *                            // pàgina de l'autor que l'ha creada». La ruta de
 *                            // la pàgina de qui signa: amb ella, l'avatar i el
 *                            // nom de la barra taronja són un enllaç (també a
 *                            // l'estat buit). Sense la clau, el DOM de sempre.
 *   seedContent: String|null // Opcional. Llavor del cos: mentre el cos és
 *                            // exactament esta llavor es pinta atenuat i es buida
 *                            // en rebre el focus. Sense la clau (undefined) val
 *                            // LLAVOR_NOTA, com sempre, i el Bloc de Notes no la
 *                            // passa; un valor explícit mana, també null (cap llavor).
 *                            // La fitxa del Perfil (PerfilEditor) depén d'este null:
 *                            // no el convertiu en «sense clau».
 *                            // La dependència inversa cap a sections/notes és deute
 *                            // previ que es conserva per ordre del Mestre: el Bloc
 *                            // de Notes no es toca.
 *   posicioEines: 'dalt'|'davall-entradilla' // Opcional ('dalt'). On va la barra
 *                            // d'eines; qualsevol altre valor es comporta com 'dalt'.
 *   emoticona: String        // Opcional (T51). El camp CRU d'emoticona del document
 *                            // ('' | un emoji): l'espai central de la barra taronja.
 *                            // També a l'estat buit (T66b), sempre en lectura.
 *   onObriEmoticona: () => void // Opcional (T51). Amb ell, l'espai central és el
 *                            // botó que obri el diàleg d'emoticona del consumidor
 *                            // (ploma blanca sense emoticona). Sense, cel·la de lectura.
 *   ambVistes: Boolean       // Opcional (CONTRACTE-3, pla 261008_1201; true). Amb
 *                            // false, davall del títol (.sdp-copyright-control) no es
 *                            // pinten «Vista A4 / PDF» i «Crear portada»
 *                            // (DocumentPrintPreview): el consumidor les porta a un
 *                            // altre apartat. El botó dels drets es queda. Sense la
 *                            // clau, el DOM de sempre (Notes i el catàleg).
 *   targetaViva, avisTargetaViva // RETIRADES (T50 · Bloc 3.4 del Gauntlet, 261016).
 *                            // L'aside de la targeta viva a la dreta i el seu xip
 *                            // «Vista targeta» ja no tenien cap consumidor (Notes
 *                            // els va llevar a P4; el Perfil, al pla 261015). La
 *                            // closca és sempre filla directa del contenidor; la
 *                            // targeta viva viu a la fitxa de la llista (NotaFitxa,
 *                            // PerfilShell) i a «Les vistes» (DetallVistes). Una
 *                            // clau vella que encara arribe passa per ...rest i
 *                            // PageFrame no la llig: el DOM de sempre.
 *   targetes: { cerca(consulta) } // Opcional (T7, 261004). Targetes incrustades al
 *                            // cos: l'ordre «/» «Targeta» obri el selector, que
 *                            // busca amb cerca() (entrades d'indexCerca: Model B).
 *                            // Ha de ser CONSTANT durant la vida de l'adaptador:
 *                            // l'esquema de TipTap es fixa en crear l'editor.
 *                            // Sense la clau, el DOM és el de sempre.
 *   peuDePagina: ReactNode   // Opcional. Esmena 2 del pla 261007_1645 (ordre del
 *   etiquetaPeuDePagina: String // Mestre, 261007: llistar el que l'avatar actiu ja
 *                            // té publicat «per tot el sistema»). El peu de la
 *                            // pàgina de l'editor: no es desestructura ací, passa
 *                            // per ...rest a UniversalEditorShell i d'ací a la
 *                            // UniversalPage i a PageFrame, que el pinta després
 *                            // de l'article, dins del contenidor que fa scroll, en
 *                            // un section amb nom (etiquetaPeuDePagina). Fora de
 *                            // l'article: l'Índex de la nota no el recull. Va
 *                            // l'últim i sempre en la mateixa posició: aparéixer o
 *                            // canviar no remunta TipTap. L'estat buit
 *                            // (EmptyDocumentPage) no el rep. Ha de ser un node
 *                            // memoritzat pel consumidor (NotesEditor ·
 *                            // useMemo): un JSX nou a cada pintada refaria
 *                            // l'adaptador. Sense la clau, el DOM de sempre.
 *   ...rest // La resta (heroEditLabel, estatDesament…) passa a UniversalEditorShell.
 *           // Ordre del Mestre (261007, ordre E): també onLogoEdit i logoEditLabel
 *           // (la ranura del logotip, mirall d'onHeroEdit) i avatarAutor, que
 *           // la closca deixa passar fins a PageFrame (l'avatar redó damunt de l'H1).
 *
 * T40 (ordre del Mestre, 260928) · La identitat ja no va a la barra taronja
 * (cap `identityActions`): viu a la barra negra (TopBar).
 * }
 *
 * Amb 'dalt' la columna de l'editor només té una fila pròpia, la de les eines,
 * i la barra blava de la pàgina ocupa la fila 2, alineada amb la dels controls
 * de les altres columnes (skill sdp-app-grid-shell §2). Amb 'davall-entradilla'
 * (D13) la barra blava és la fila 1 i les eines baixen dins del document, just
 * davall de l'entradilla.
 */

/* Estat buit: una UniversalPage completa (barra blava, capçalera, barra taronja,
   bloc blanc del títol i cos de lectura) en lloc d'un simple "Obre un solc".
   T51 (decisió del Mestre, 260928) · La pastilla porta la data i l'hora d'ara
   (abans només l'hora), amb el seu dateTime: mai buida.
   T66b (sdp-pedra-seca §10) · L'estat buit és LECTURA: l'espai central porta
   l'emoticona triada que dona l'adaptador (una fitxa en baixa o de reserva)
   i, sense, la cel·la buida. Mai el botó: onObriEmoticona no hi arriba.
   Ordre del Mestre (261007) · Amb barAuthorHref, l'autoria porta a la pàgina
   de qui signa; sense, la topBarData de sempre (cap clau authorHref).
   Ordre del Mestre (261007, ordre E) · Damunt de l'H1, el mateix que la fitxa
   pública (PerfilPublicSection; derogació del showLogos={false}, 261004):
   `logoEntitat` (el logotip d'una entitat) o `avatarAutor` (l'avatar redó
   d'una persona o d'un agent IA), les claus de PageFrame. És LECTURA: de
   l'avatar només passen src i alt, mai onCanvia. Sense les claus, cap prop
   nova i el DOM de sempre. */
function EmptyDocumentPage({ emptyDocument, emptyPlaceholder, barAuthorAvatar, barAuthorName, barAuthorLocation, barAuthorHref, emoticona, t }) {
  const doc = emptyDocument || {};
  const title = doc.title || emptyPlaceholder || t('editor.open', 'Obre un document');
  const rawHtml = doc.content || '';
  const capDeLectura = {
    ...(doc.logoEntitat ? { logoEntitat: doc.logoEntitat } : null),
    ...(doc.avatarAutor ? { avatarAutor: { src: doc.avatarAutor.src, alt: doc.avatarAutor.alt } } : null),
  };

  return (
    <div className="sdp-editor-shell-atomic">
      <div className="sdp-editor-document">
        <UniversalPage
          chrome="context"
          layout="contained"
          title={title}
          subtitle={doc.subtitle}
          lead={doc.lead}
          heroImage={doc.heroImage}
          heroAlt={doc.heroAlt || ''}
          showLogos={Boolean(doc.showLogos)}
          {...capDeLectura}
          labels={doc.labels || []}
          copyright={doc.copyright}
          topBarData={{
            authorName: barAuthorName,
            authorLocation: barAuthorLocation,
            authorAvatar: barAuthorAvatar,
            ...(barAuthorHref ? { authorHref: barAuthorHref } : null),
            emoticona,
            /* Per barActions i sense onClick: un <time>, com abans (UniversalPage
               faria de la pastilla per defecte un botó cap al Mur). */
            barActions: <DateTimeControl {...dataHoraAra()} />
          }}
        >
          {rawHtml ? <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(rawHtml) }} /> : null}
        </UniversalPage>
      </div>
    </div>
  );
}
export function DocumentEditor({ adapter, onToast }) {
  const { t } = useUIActions();
  const { 
    document, 
    updateLocal, 
    saveRemote, 
    publish,
    /* T5 · «Compartir» per a una nota connectada; sense valor, «Publicar». */
    publishLabel = null,
    uploadMedia,
    deleteDocument,
    labels,
    emptyPlaceholder,
    emptyDocument,
    /* T41 · el selector de visibilitat (null: textos genèrics i `publish` de reserva). */
    visibilitat = null,
    /* T40 · la pastilla de data obri el calendari de publicació. */
    ambDataPublicacio = false,
    avisDataPublicacio = null,
    classificacio = null,
    llicencia = null,
    /* T39 · la vista de drets d'autor (null: sense avís d'herència). */
    dretsAutor = null,
    /* Correcció de la revisió (261008) · la llicència triada de veres (undefined: document.copyright). */
    dretsTriats = undefined,
    /* Directiva de Dignitat Humana (261015) · false: cap rastre de drets d'autor. */
    ambDrets = true,
    seedContent = LLAVOR_NOTA,
    posicioEines = 'dalt',
    statusIcon,
    barAuthorAvatar,
    barAuthorName,
    barAuthorLocation,
    /* Ordre del Mestre (261007) · la ruta de la pàgina de qui signa (null: sense enllaç). */
    barAuthorHref = null,
    /* T51 · l'espai central de la barra taronja (camp cru i obertura del diàleg). */
    emoticona = '',
    onObriEmoticona = null,
    /* CONTRACTE-3 (261008) · false: les vistes (A4 i portada) no van davall del títol. */
    ambVistes = true,
    /* T7 · la font de les targetes incrustades (null: el cos de sempre). */
    targetes = null,
    ...rest
  } = adapter;

  const ambTargetes = Boolean(targetes);
  /* Ordre del Mestre (261007, ordre E) · L'ordre «/» Imatge avisa pel mateix
     canal que la capçalera (onToast) quan la pujada es rebutja o el fitxer no
     és una imatge. Per una ref: les extensions han de ser CONSTANTS (useMemo,
     richText/extensions) i un onToast nou a cada render reconstruiria TipTap.
     Auditoria 261007 (retocs de l'ordre E) · Sense onToast, un console.warn
     amb el mateix missatge de l'avís (també per a un fitxer que no és una
     imatge). */
  const onToastRef = useRef(onToast);
  onToastRef.current = onToast;
  const avisaDelCos = useCallback((missatge, tipus) => {
    if (typeof onToastRef.current === 'function') onToastRef.current(missatge, tipus);
    else console.warn(`[slash] ${missatge}`);
  }, []);
  const extensions = useMemo(
    () => extensionsRiques({ onImageUpload: uploadMedia, ambTargetes, onToast: avisaDelCos }),
    [uploadMedia, ambTargetes, avisaDelCos],
  );

  const desaLocal = useCallback(
    (field, val, id) => {
      if (id != null && updateLocal) updateLocal(id, field, val);
    },
    [updateLocal],
  );

  const desaCamp = useCallback(
    (field, val, id) => {
      if (id != null && saveRemote) saveRemote(id, field, val);
    },
    [saveRemote],
  );

  const handleChange = useCallback(
    (html, id) => desaLocal('content', html, id),
    [desaLocal],
  );

  const handleSave = useCallback(
    (html, id) => desaCamp('content', html, id),
    [desaCamp],
  );

  const editor = useUniversalRichText({
    content: document?.content || '',
    id: document?.id,
    extensions,
    onChange: handleChange,
    onSave: handleSave,
    debounceMs: 800,
    seedContent,
  });

  const { state, exec } = useTipTapToolbarAdapter(editor);

  /* T41 (ordre del Mestre, 260928) · PUBLICAR i la bola del món ja no canvien
     res en silenci: obrin el selector de visibilitat. L'estat guarda l'id del
     document que l'ha obert, no un booleà: al Perfil DocumentEditor no porta
     key per identitat, i un canvi d'identitat el tanca sol en lloc d'aplicar
     la tria a una altra fitxa. Tots els hooks van abans del retorn primerenc. */
  const [visibilitatDe, setVisibilitatDe] = useState(null);
  /* Un altre document: el selector s'oblida (tornar a A no el reobri). */
  if (visibilitatDe != null && visibilitatDe !== document?.id) setVisibilitatDe(null);
  const obreVisibilitat = useCallback(() => {
    if (document) setVisibilitatDe(document.id);
  }, [document]);
  const tancaVisibilitat = useCallback(() => setVisibilitatDe(null), []);
  /* Confirmar: el consumidor decidix (visibilitat.onTria). Sense adaptador de
     visibilitat, «pública» crida el `publish` de sempre i «privada» no fa res. */
  const triaVisibilitat = useCallback((publicaTriada) => {
    if (!document) return true;
    if (visibilitat?.onTria) return visibilitat.onTria(publicaTriada, document);
    return publicaTriada && publish ? publish(document) : true;
  }, [document, visibilitat, publish]);

  /* T40 (ordre del Mestre, 260928) · La data triada es desa com qualsevol
     altre camp: al moment (updateLocal) i pel canal d'autodesament (saveRemote). */
  const triaDataPublicacio = useCallback((iso) => {
    if (!document) return;
    desaLocal('publishDate', iso, document.id);
    desaCamp('publishDate', iso, document.id);
  }, [document, desaLocal, desaCamp]);

  /* Abans del retorn primerenc: un hook condicional canvia l'ordre dels hooks
     quan el document passa de buit a carregat i React llança. */
  const esborra = useCallback(() => {
    if (document && deleteDocument) deleteDocument(document);
  }, [deleteDocument, document]);

  /* T39 (ordre del Mestre, 260928) · «Elegir drets d'autor» obri una vista a
     pantalla completa DINS de la columna (CopyrightPage), no un diàleg. La
     closca s'amaga amb una classe però continua MUNTADA: TipTap, els camps i
     la cua d'autodesament no es desmunten ni perden res. Com el selector de
     visibilitat, l'estat guarda l'id del document que l'ha obert. */
  const [dretsDe, setDretsDe] = useState(null);
  if (dretsDe != null && dretsDe !== document?.id) setDretsDe(null);
  const dretsOberts = dretsDe != null && dretsDe === document?.id;
  /* On tornar en tancar: el botó i la posició de scroll de la pàgina (amb la
     closca en display:none, el navegador la perd). */
  const retornDrets = useRef(null);
  const obreDrets = useCallback((event) => {
    if (!document) return;
    const boto = event?.currentTarget ?? null;
    const contenidor = boto?.closest?.('.sdp-universal-page-container') ?? null;
    retornDrets.current = { boto, contenidor, scroll: contenidor?.scrollTop ?? 0 };
    setDretsDe(document.id);
  }, [document]);
  /* Poliment T39 · T47 (ordre del Mestre, 260928) · L'esborrany de la vista
     (tria i text lliure) es guarda per document a cada canvi: Escape dins del
     text lliure, «Tornar al document» o canviar de document no perden el que
     s'hi ha escrit, i en reobrir torna. Desar o «Cancel·lar» (renúncia
     explícita) el descarten. La casella de CC0 no s'hi guarda mai. És memòria
     d'esta pantalla, no del document: res no es desa fins a «Desar autoria». */
  const esborranysDrets = useRef(new Map());
  const guardaEsborranyDrets = useCallback((esborrany) => {
    if (document) esborranysDrets.current.set(document.id, esborrany);
  }, [document]);
  const tancaDrets = useCallback((motiu) => {
    if (motiu === 'boto' && document) esborranysDrets.current.delete(document.id);
    setDretsDe(null);
  }, [document]);
  const desaDrets = useCallback((valor) => {
    if (!document) return;
    esborranysDrets.current.delete(document.id);
    /* El camí de sempre: al moment (updateLocal) i per l'autodesament (saveRemote). */
    desaLocal('copyright', valor, document.id);
    desaCamp('copyright', valor, document.id);
    setDretsDe(null);
  }, [document, desaLocal, desaCamp]);
  /* En tancar (desar, cancel·lar, tornar o Escape), abans de pintar: la
     pàgina torna on era i el focus, al botó que l'ha oberta. */
  useLayoutEffect(() => {
    if (dretsOberts) return;
    const retorn = retornDrets.current;
    if (!retorn) return;
    retornDrets.current = null;
    if (retorn.contenidor?.isConnected) retorn.contenidor.scrollTop = retorn.scroll;
    if (retorn.boto?.isConnected) retorn.boto.focus({ preventScroll: true });
  }, [dretsOberts]);

  /* T7 (ordre del Mestre, prompt 261004_0515) · Targetes incrustades al cos.
     L'ordre de l'editor (obreSelectorDeTargeta) obri el selector pel magatzem
     de l'extensió; el selector i l'avís de previsualització són UN sol
     diàleg cadascun, germans de la closca, mai dins del contenteditable.
     Abans del retorn primerenc, com la resta de hooks. */
  const [selectorTargetaObert, setSelectorTargetaObert] = useState(false);
  const [avisTargetaObert, setAvisTargetaObert] = useState(false);
  useEffect(() => {
    const magatzem = ambTargetes && editor && !editor.isDestroyed ? editor.storage?.[NOM_EXTENSIO_TARGETES] : null;
    if (!magatzem) return undefined;
    const obre = () => setSelectorTargetaObert(true);
    magatzem.obreSelector = obre;
    return () => {
      if (magatzem.obreSelector === obre) magatzem.obreSelector = null;
    };
  }, [ambTargetes, editor]);
  const tancaSelectorTargeta = useCallback(() => setSelectorTargetaObert(false), []);
  const triaTargeta = useCallback((entrada) => {
    setSelectorTargetaObert(false);
    const attrs = attrsDeEntrada(entrada);
    if (attrs && editor && !editor.isDestroyed) editor.chain().focus().inserirTargeta(attrs).run();
  }, [editor]);
  const avisaTargeta = useCallback(() => setAvisTargetaObert(true), []);
  const tancaAvisTargeta = useCallback(() => setAvisTargetaObert(false), []);
  const contextTargetes = useMemo(
    () => (ambTargetes ? { avisa: avisaTargeta, t } : null),
    [ambTargetes, avisaTargeta, t],
  );

  if (!document) {
    return (
      <EmptyDocumentPage
        emptyDocument={emptyDocument}
        emptyPlaceholder={emptyPlaceholder}
        barAuthorAvatar={barAuthorAvatar}
        barAuthorName={barAuthorName}
        barAuthorLocation={barAuthorLocation}
        barAuthorHref={barAuthorHref}
        emoticona={emoticona}
        t={t}
      />
    );
  }

  const esPublica = Boolean(document.isPublished);
  const textosVisibilitat = visibilitat?.textos || TEXTOS_VISIBILITAT;
  /* Sense adaptador, un document ja públic no es pot tornar privat: cap
     consumidor futur queda amb un botó que menteix. */
  const bloqueigVisibilitat = visibilitat
    ? (visibilitat.bloqueig ?? null)
    : (esPublica ? { opcio: 'privada', motiu: 'Este document encara no es pot tornar a fer privat.' } : null);
  const visibilitatOberta = visibilitatDe != null && visibilitatDe === document.id;
  const etiquetaVisibilitat = `${esPublica ? textosVisibilitat.publica.etiqueta : textosVisibilitat.privada.etiqueta}: canviar la visibilitat`;

  const topBar = (
    <UniversalRichTextToolbar
      state={state}
      exec={exec}
      onPublish={obreVisibilitat}
      publishPopup="dialog"
      publishLabel={publishLabel}
      onDelete={deleteDocument ? esborra : undefined}
      t={t}
    />
  );

  const copyrightValue = document.copyright || '© Sóc de Poble';

  /* Davall del títol: la botonera de classificació i, davall d'ella, la
     ranura de la llicència. Sense botonera, PageFrame pinta les píndoles.
     Decisió del Mestre (261008) · potTriarDrets és la condició de la
     píndola (cap ranura pròpia de llicència i un document que es pot
     editar): amb ella, també el copyright de la capçalera obri la vista de
     drets (onCanviaCopyright de PageFrame) en lloc de portar a /page/drets-autor.
     La píndola rep la llicència triada de veres (document.copyright), mai
     la reserva «© Sóc de Poble».
     Correcció de la revisió (261008) · Amb la clau dretsTriats, mana ella:
     el Perfil hi posa el «© Nom» de lectura (perfilCamps) encara que ningú
     no n'haja triat cap, i la píndola el donava per triat. Un valor que no
     és text (null) és «cap triada».
     Directiva de Dignitat Humana (261015) · Amb ambDrets={false} no es pot
     triar res (potTriarDrets fals) i la capçalera no porta cap copyright. */
  const potTriarDrets = ambDrets && !llicencia && Boolean(updateLocal);
  const llicenciaTriada = dretsTriats === undefined
    ? (document.copyright || '')
    : (typeof dretsTriats === 'string' ? dretsTriats : '');
  const copyrightSelector = (ambDrets ? llicencia : null) || (potTriarDrets ? <BotoDretsAutor valor={copyrightValue} triada={llicenciaTriada} onClick={obreDrets} /> : null);
  /* CONTRACTE-3 (261008) · Amb ambVistes={false}, ni Vista A4 / PDF ni Crear
     portada: el botó dels drets es queda.
     T50 · Bloc 3.4 (261016) · El xip «Vista targeta» ja no és d'esta ranura:
     el control només porta els drets i, darrere, les vistes. */
  const ranuraClassificacio = classificacio || copyrightSelector ? (
    <>
      {classificacio}
      {copyrightSelector ? (
        <div className="sdp-copyright-control">
          {copyrightSelector}
          {ambVistes ? <DocumentPrintPreview document={document} author={barAuthorName} /> : null}
        </div>
      ) : null}
    </>
  ) : null;

  /* T39 · Amb la vista de drets oberta, la closca s'amaga (però no es desmunta). */
  const classeCloscat = [rest.className, dretsOberts ? 'sdp-editor-shell-atomic--amagat' : null].filter(Boolean).join(' ');

  const closca = (
    <UniversalEditorShell
      key={document.id}
      id={document.id}
      topBar={topBar}
      posicioEines={posicioEines}
      titleHtml={document.title}
      subtitleHtml={document.subtitle}
      leadHtml={document.lead}
      heroImage={document.heroImage}
      logoImage={document.logoImage}
      isPublished={document.isPublished}
      formattedTime={document.formattedTime}
      formattedDate={document.formattedDate}
      labels={labels || []}
      onImageUpload={uploadMedia}
      onLocalChange={desaLocal}
      onSaveField={desaCamp}
      onToast={onToast}
      barAuthorAvatar={barAuthorAvatar}
      barAuthorName={barAuthorName}
      barAuthorLocation={barAuthorLocation}
      barAuthorHref={barAuthorHref}
      statusIcon={statusIcon}
      emoticona={emoticona}
      onObriEmoticona={onObriEmoticona}
      onObriVisibilitat={obreVisibilitat}
      etiquetaVisibilitat={etiquetaVisibilitat}
      visibilitatOberta={visibilitatOberta}
      publishDate={ambDataPublicacio ? (document.publishDate ?? null) : null}
      onPublishDateChange={ambDataPublicacio ? triaDataPublicacio : null}
      avisDataPublicacio={ambDataPublicacio ? avisDataPublicacio : null}
      {...rest}
      className={classeCloscat}
      classificacio={ranuraClassificacio}
      copyright={ambDrets ? copyrightValue : undefined}
      /* Decisió del Mestre (261008) · Després de ...rest: cap adaptador ho
         desfà. Sense potTriarDrets (una connexió, sense updateLocal), el
         copyright continua sent l'enllaç de lectura. Amb ambDrets={false}
         (261015), cap línia de copyright. */
      onCanviaCopyright={potTriarDrets ? obreDrets : undefined}
    >
      {/* T7 · Els NodeViews de les targetes es munten com a portals dins del
          cos i llegixen este context (avisa i t). Sense targetes, el cos de sempre. */}
      {contextTargetes ? (
        <TargetesIncrustadesContext.Provider value={contextTargetes}>
          <UniversalRichTextContent editor={editor} />
        </TargetesIncrustadesContext.Provider>
      ) : <UniversalRichTextContent editor={editor} />}
    </UniversalEditorShell>
  );

  return (
    <>
      {/* T39 · Germana ABANS de la closca: la posició de la closca no canvia i
          React no la remunta en obrir o tancar la vista. */}
      {dretsOberts && ambDrets ? (
        <CopyrightPage
          valor={copyrightValue}
          autor={dretsAutor?.autor ?? barAuthorName ?? ''}
          ambit={dretsAutor?.ambit ?? 'neutre'}
          perDefecte={dretsAutor?.perDefecte ?? null}
          esborrany={esborranysDrets.current.get(document.id) ?? null}
          onEsborrany={guardaEsborranyDrets}
          onDesa={desaDrets}
          onTanca={tancaDrets}
        />
      ) : null}
      {/* T50 · Bloc 3.4 (261016) · La closca, sempre filla directa: cap
          embolcall ni aside de la targeta viva al costat de l'editor. */}
      {closca}
      {/* T41 · Una sola instància, germana de la closca: l'obrin la bola del
          món (barra taronja) i PUBLICAR (barra d'eines), també en mòbil, on
          T38 amaga la taronja. */}
      <SelectorVisibilitat
        obert={visibilitatOberta}
        onTanca={tancaVisibilitat}
        esPublica={esPublica}
        onTria={triaVisibilitat}
        textos={textosVisibilitat}
        bloqueig={bloqueigVisibilitat}
        comNom={visibilitat?.comNom || null}
      />
      {/* T7 · El selector de targetes i l'avís de previsualització, germans de
          la closca i només amb targetes: sense la clau, el DOM de sempre. */}
      {ambTargetes ? (
        <>
          <DialegTriaTargeta
            obert={selectorTargetaObert}
            onTanca={tancaSelectorTargeta}
            cerca={targetes?.cerca}
            onTria={triaTargeta}
            t={t}
          />
          <Dialeg
            obert={avisTargetaObert}
            onTanca={tancaAvisTargeta}
            titol={t('editor.targetes.avis.titol', 'Esta targeta és una previsualització')}
            descripcio={t('editor.targetes.avis.descripcio', 'Esta targeta està incrustada al document que edites. Els seus botons —connectar, traduir, comentar i compartir— només funcionen quan es llig el document publicat.')}
            mida="m"
            accions={<Boto varietat="accent" onClick={tancaAvisTargeta}>{t('editor.targetes.avis.entesos', 'Entesos')}</Boto>}
          />
        </>
      ) : null}
    </>
  );
}

export default DocumentEditor;
