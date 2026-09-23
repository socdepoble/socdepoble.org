import React, { useCallback, useMemo } from 'react';
import { UniversalEditorShell } from './UniversalEditorShell';
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
 * }
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
    labels, 
    emptyPlaceholder,
    emptyDocument,
    identityActions,
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

  const handleCopyrightChange = useCallback(
    (e) => {
      const val = e.target.value;
      desaLocal('copyright', val, document?.id);
      desaCamp('copyright', val, document?.id);
    },
    [desaLocal, desaCamp, document?.id]
  );

  const editor = useUniversalRichText({
    content: document?.content || '',
    id: document?.id,
    extensions,
    onChange: handleChange,
    onSave: handleSave,
    debounceMs: 800,
    seedContent: LLAVOR_NOTA,
  });

  const { state, exec } = useTipTapToolbarAdapter(editor);

  const publica = useCallback(() => {
    if (document && publish) publish(document);
  }, [publish, document]);

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
      t={t}
    />
  );

  const copyrightValue = document.copyright || '© Sóc de Poble';
  const copyrightSelector = (
    <select 
      value={copyrightValue} 
      onChange={handleCopyrightChange}
      className="sdp-copyright-selector"
      title="Tria la llicència d'autoria"
    >
      <option value="© Sóc de Poble">© Sóc de Poble</option>
      <option value={`© ${barAuthorName || 'Foraster'}`}>© {barAuthorName || 'Foraster'}</option>
      <option value="Domini Públic (CC0)">Domini Públic (CC0)</option>
      <option value="Reconeixement (CC BY)">Reconeixement (CC BY)</option>
      <option value="Sense drets d'autor">Sense drets d'autor</option>
    </select>
  );

  return (
    <UniversalEditorShell
      key={document.id}
      id={document.id}
      topBar={topBar}
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
      copyright={copyrightSelector}
      {...rest}
    >
      <UniversalRichTextContent editor={editor} />
    </UniversalEditorShell>
  );
}

export default DocumentEditor;
