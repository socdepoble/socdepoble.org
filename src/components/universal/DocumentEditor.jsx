import React, { useCallback, useMemo } from 'react';
import { FileText } from 'lucide-react';
import { UniversalEditorShell } from './UniversalEditorShell';
import {
  useUniversalRichText,
  useTipTapToolbarAdapter,
  UniversalRichTextToolbar,
  UniversalRichTextContent,
} from './richText';
import { extensionsRiques } from './richText/extensions';
import { useUIActions } from '../../app/contexts/UIContext';

/**
 * Interfície Adapter requerida:
 * {
 *   document: Object, // El document actual. Si és null, mostra l'estat buit.
 *   updateLocal: (id, field, value) => void, // Cridat immediatament a cada input.
 *   saveRemote: (id, field, value) => void, // Cridat amb debounce o a l'onBlur.
 *   publish: (document) => void, // Cridat en prémer el botó de publicar.
 *   uploadMedia: async (file) => String, // Lògica de pujada d'imatges (retorna URL).
 *   labels: Array, // Etiquetes visuals del document (ex: estat, lloc).
 *   emptyPlaceholder: String // Text per a l'estat buit.
 * }
 */
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
  });

  const { state, exec } = useTipTapToolbarAdapter(editor);

  const publica = useCallback(() => {
    if (document && publish) publish(document);
  }, [publish, document]);

  if (!document) {
    return (
      <section className="sdp-editor">
        <div className="sdp-buit">
          <FileText size={64} />
          <h2 className="section-title">{emptyPlaceholder || t('editor.open', 'Obre un document')}</h2>
        </div>
      </section>
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
      copyright={copyrightSelector}
      {...rest}
    >
      <UniversalRichTextContent editor={editor} />
    </UniversalEditorShell>
  );
}

export default DocumentEditor;
