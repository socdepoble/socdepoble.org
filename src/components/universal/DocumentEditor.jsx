import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { UniversalEditorShell } from './UniversalEditorShell';
import { SelectorVisibilitat, TEXTOS_VISIBILITAT } from './SelectorVisibilitat.jsx';
import BotoDretsAutor from './CopyrightSelector.jsx';
import { CopyrightPage } from './drets/CopyrightPage.jsx';
import DocumentPrintPreview from './DocumentPrintPreview.jsx';
import { BotoTargetaViva, TargetaViva } from './TargetaViva.jsx';
import { UniversalPage } from './UniversalPage.jsx';
import { DateTimeControl } from '../PedraSeca/index.js';
import { dataHoraAra } from './barres/dataHoraBarra.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import {
  useUniversalRichText,
  useTipTapToolbarAdapter,
  UniversalRichTextToolbar,
  UniversalRichTextContent,
} from './richText';
import { extensionsRiques } from './richText/extensions';
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
 *                          // ({ title, subtitle, lead, heroImage, content, labels, copyright }).
 *   classificacio: ReactNode // Opcional. Botonera de classificació (Carpetes, Categories,
 *                            // Etiquetes) davall del títol, al lloc de les píndoles.
 *   llicencia: ReactNode // Opcional. Ranura del botó de llicència, davall de la botonera.
 *   dretsAutor: { ambit, perDefecte, autor } // Opcional (T39). «Elegir drets d'autor»
 *                            // obri la vista a pantalla completa (CopyrightPage) dins
 *                            // de la columna. ambit: 'publicacio'|'perfil'|'neutre'
 *                            // (per defecte) tria l'avís d'herència; perDefecte, la
 *                            // llicència heretada; autor (per defecte barAuthorName),
 *                            // el nom de «© autor». Es desa pel camí de sempre.
 *   statusIcon: ReactNode // Opcional. Icona del botó d'estat de la barra taronja.
 *   barAuthorAvatar, barAuthorName, barAuthorLocation: String // Opcionals. Autoria
 *                            // de la barra taronja (i de l'estat buit).
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
 *   targetaViva: Boolean     // Opcional (T50, false). La targeta del document
 *                            // (TargetaViva) fixa a la dreta de l'editor quan el
 *                            // contenidor és prou ample, i si no, el xip «Vista
 *                            // targeta» davall del títol. Sense la clau, el DOM
 *                            // és el de sempre. Ha de ser CONSTANT durant la vida
 *                            // de l'adaptador: canviar-la canvia el pare de la
 *                            // closca i remunta TipTap.
 *   avisTargetaViva: { titol, descripcio, vista } // Opcional (T50). Els textos
 *                            // del consumidor per a l'aside i el xip de la
 *                            // targeta viva (AVISOS_TARGETA_VIVA de TargetaViva.jsx).
 *                            // Sense la clau, la reserva AVIS_PREVISUALITZACIO.
 *   ...rest // La resta (heroEditLabel, estatDesament…) passa a UniversalEditorShell.
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
   i, sense, la cel·la buida. Mai el botó: onObriEmoticona no hi arriba. */
function EmptyDocumentPage({ emptyDocument, emptyPlaceholder, barAuthorAvatar, barAuthorName, barAuthorLocation, emoticona, t }) {
  const doc = emptyDocument || {};
  const title = doc.title || emptyPlaceholder || t('editor.open', 'Obre un document');
  const rawHtml = doc.content || '';

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
          labels={doc.labels || []}
          copyright={doc.copyright}
          topBarData={{
            authorName: barAuthorName,
            authorLocation: barAuthorLocation,
            authorAvatar: barAuthorAvatar,
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
    seedContent = LLAVOR_NOTA,
    posicioEines = 'dalt',
    statusIcon,
    barAuthorAvatar,
    barAuthorName,
    barAuthorLocation,
    /* T51 · l'espai central de la barra taronja (camp cru i obertura del diàleg). */
    emoticona = '',
    onObriEmoticona = null,
    /* T50 · la targeta viva a la dreta (o el xip «Vista targeta»). */
    targetaViva = false,
    /* Els textos de l'avís de la targeta viva (sense: la reserva de TargetaViva). */
    avisTargetaViva = null,
    ...rest
  } = adapter;

  const extensions = useMemo(
    () => extensionsRiques({ onImageUpload: uploadMedia }),
    [uploadMedia],
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

  /* T50 · La targeta viva signa com la barra taronja. Abans del retorn
     primerenc, com la resta de hooks. */
  const autorTargeta = useMemo(
    () => ({ nom: barAuthorName, avatar: barAuthorAvatar, poble: barAuthorLocation }),
    [barAuthorName, barAuthorAvatar, barAuthorLocation],
  );

  if (!document) {
    return (
      <EmptyDocumentPage
        emptyDocument={emptyDocument}
        emptyPlaceholder={emptyPlaceholder}
        barAuthorAvatar={barAuthorAvatar}
        barAuthorName={barAuthorName}
        barAuthorLocation={barAuthorLocation}
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
     ranura de la llicència. Sense botonera, PageFrame pinta les píndoles. */
  const copyrightSelector = llicencia || (updateLocal ? <BotoDretsAutor valor={copyrightValue} onClick={obreDrets} /> : null);
  /* T50 · El xip «Vista targeta», germà de Vista A4 i Crear portada. El CSS
     l'amaga quan l'aside de la dreta ja es veu. L'avís, el del consumidor
     (avisTargetaViva); undefined deixa la reserva de TargetaViva. */
  const avisTargeta = avisTargetaViva || undefined;
  const botoTargeta = targetaViva ? <BotoTargetaViva document={document} autor={autorTargeta} etiquetes={labels || []} avis={avisTargeta} /> : null;
  const ranuraClassificacio = classificacio || copyrightSelector || botoTargeta ? (
    <>
      {classificacio}
      {copyrightSelector || botoTargeta ? (
        <div className="sdp-copyright-control">
          {copyrightSelector}
          {copyrightSelector ? <DocumentPrintPreview document={document} author={barAuthorName} /> : null}
          {botoTargeta}
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
      copyright={copyrightValue}
    >
      <UniversalRichTextContent editor={editor} />
    </UniversalEditorShell>
  );

  return (
    <>
      {/* T39 · Germana ABANS de la closca: la posició de la closca no canvia i
          React no la remunta en obrir o tancar la vista. */}
      {dretsOberts ? (
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
      {/* T50 (decisió del Mestre, 260928: «Llista + dreta si hi cap») · Amb
          targetaViva, un embolcall CONSTANT (no depén de l'amplària: canviar
          el pare de la closca remuntaria TipTap). És un contenidor amb nom:
          l'aside de la dreta només es veu si l'editor fa almenys 60rem
          (components.css); si no, el xip «Vista targeta» de davall del títol.
          Amb la vista de drets oberta s'amaga sencer (la closca ja ho està). */}
      {targetaViva ? (
        <div className={`sdp-editor-amb-targeta${dretsOberts ? ' sdp-editor-amb-targeta--drets' : ''}`}>
          <div className="sdp-editor-amb-targeta__graella">
            {closca}
            <aside className="sdp-targeta-viva" aria-label="Previsualització de la targeta">
              <TargetaViva document={document} autor={autorTargeta} etiquetes={labels || []} avis={avisTargeta} />
            </aside>
          </div>
        </div>
      ) : closca}
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
    </>
  );
}

export default DocumentEditor;
