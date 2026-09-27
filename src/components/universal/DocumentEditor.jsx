import React, { useCallback, useMemo } from 'react';
import { UniversalEditorShell } from './UniversalEditorShell';
import CopyrightSelector from './CopyrightSelector.jsx';
import DocumentPrintPreview from './DocumentPrintPreview.jsx';
import { UniversalPage } from './UniversalPage.jsx';
import { DateTimeControl } from '../PedraSeca/index.js';
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
 *   publish: (document) => void, // Cridat en prémer el botó de publicar.
 *   uploadMedia: async (file) => String, // Lògica de pujada d'imatges (retorna URL).
 *   labels: Array, // Etiquetes visuals del document (ex: estat, lloc).
 *   emptyPlaceholder: String, // Text per a l'estat buit (títol de reserva).
 *   emptyDocument: Object, // Opcional. Document de benvinguda per a l'estat buit
 *                          // ({ title, subtitle, lead, heroImage, content, labels, copyright }).
 *   identityActions: ReactNode // Opcional. Passarel·la d'identitat (Connectar, perfil...)
 *                              // que s'injecta a la barra taronja, al costat de l'hora.
 *   classificacio: ReactNode // Opcional. Botonera de classificació (Carpetes, Categories,
 *                            // Etiquetes) davall del títol, al lloc de les píndoles.
 *   llicencia: ReactNode // Opcional. Ranura del botó de llicència, davall de la botonera.
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
 *   ...rest // La resta (previewTitle, previewHelp…) passa a UniversalEditorShell.
 * }
 *
 * Amb 'dalt' la columna de l'editor només té una fila pròpia, la de les eines,
 * i la barra blava de la pàgina ocupa la fila 2, alineada amb la dels controls
 * de les altres columnes (skill sdp-app-grid-shell §2). Amb 'davall-entradilla'
 * (D13) la barra blava és la fila 1 i les eines baixen dins del document, just
 * davall de l'entradilla.
 */

/* Estat buit: una UniversalPage completa (barra blava, capçalera, barra taronja,
   bloc blanc del títol i cos de lectura) en lloc d'un simple "Obre un solc". */
function EmptyDocumentPage({ emptyDocument, emptyPlaceholder, barAuthorAvatar, barAuthorName, barAuthorLocation, identityActions, t }) {
  const ara = new Date();
  const time = `${ara.getHours().toString().padStart(2, '0')}:${ara.getMinutes().toString().padStart(2, '0')}`;
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
            barActions: (
              <>
                <DateTimeControl time={time} />
                {identityActions}
              </>
            )
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
    uploadMedia, 
    deleteDocument,
    labels, 
    emptyPlaceholder,
    emptyDocument,
    identityActions,
    classificacio = null,
    llicencia = null,
    seedContent = LLAVOR_NOTA,
    posicioEines = 'dalt',
    statusIcon,
    barAuthorAvatar,
    barAuthorName,
    barAuthorLocation,
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

  const publica = useCallback(() => {
    if (document && publish) publish(document);
  }, [publish, document]);

  /* Abans del retorn primerenc: un hook condicional canvia l'ordre dels hooks
     quan el document passa de buit a carregat i React llança. */
  const esborra = useCallback(() => {
    if (document && deleteDocument) deleteDocument(document);
  }, [deleteDocument, document]);

  if (!document) {
    return (
      <EmptyDocumentPage
        emptyDocument={emptyDocument}
        emptyPlaceholder={emptyPlaceholder}
        barAuthorAvatar={barAuthorAvatar}
        barAuthorName={barAuthorName}
        barAuthorLocation={barAuthorLocation}
        identityActions={identityActions}
        t={t}
      />
    );
  }

  const topBar = (
    <UniversalRichTextToolbar
      state={state}
      exec={exec}
      onPublish={publica}
      onDelete={deleteDocument ? esborra : undefined}
      t={t}
    />
  );

  const copyrightValue = document.copyright || '© Sóc de Poble';

  /* Davall del títol: la botonera de classificació i, davall d'ella, la
     ranura de la llicència. Sense botonera, PageFrame pinta les píndoles. */
  const copyrightSelector = llicencia || (updateLocal ? <CopyrightSelector value={copyrightValue}
    onSave={value => { desaLocal('copyright', value, document.id); desaCamp('copyright', value, document.id); }} /> : null);
  const ranuraClassificacio = classificacio || copyrightSelector ? (
    <>
      {classificacio}
      {copyrightSelector ? <div className="sdp-copyright-control">{copyrightSelector}<DocumentPrintPreview document={document} author={barAuthorName} /></div> : null}
    </>
  ) : null;

  return (
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
      identityActions={identityActions}
      statusIcon={statusIcon}
      {...rest}
      classificacio={ranuraClassificacio}
      copyright={copyrightValue}
    >
      <UniversalRichTextContent editor={editor} />
    </UniversalEditorShell>
  );
}

export default DocumentEditor;
