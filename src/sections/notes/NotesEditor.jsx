import { FileText } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useNotes, etiquetesDeNota } from './NotesContext';
import { UniversalEditorShell } from '../../components/universal/UniversalEditorShell';
import {
  useUniversalRichText,
  useTipTapToolbarAdapter,
  UniversalRichTextToolbar,
  UniversalRichTextContent,
} from '../../components/universal/richText';
import { extensionsRiques } from '../../components/universal/richText/extensions/index.js';
import { uploadToStorage, teCapacitat } from '../../data/backendPort.js';

/* Constants de mòdul: identitat eterna, cap recreació per render. */
const SENSE_PARAMS = {};
const toastPerConsola = (msg, tipus) =>
  console.warn('[NotesEditor] Toast sense cablejar:', msg, tipus);

/* La capacitat es comprova al MOMENT de la crida (abans es capturava al
   muntatge i quedava antiguada si l'usuari entrava després). A més:
   funció de mòdul = identitat estable per a l'hook i per a la closca. */
async function pujarImatgeDeNota(fitxer) {
  if (!teCapacitat('mitjans')) return null;
  const res = await uploadToStorage(fitxer, { carpeta: 'notes' });
  return res.url;
}

export default function NotesEditor({ activeNote, onToast = toastPerConsola }) {
  const { saveNoteField, setLocalNoteField, publishNote, noteFolders, t } = useNotes();

  const extensions = useMemo(
    () => extensionsRiques({ onImageUpload: pujarImatgeDeNota }),
    [],
  );

  /* Handlers ESTABLES. Sospitós #1 de la pèrdua de focus: si
     useUniversalRichText posa onChange/onSave en deps de recreació de
     l'editor, una identitat nova per render destrueix el TipTap.
     Açò ho neutralitza — sempre que NotesContext done funcions
     estables (si no, el focus killer viu allà). */
  const desaLocal = useCallback(
    (field, val, noteId) => {
      if (noteId != null) setLocalNoteField(noteId, field, val);
    },
    [setLocalNoteField],
  );

  const desaCamp = useCallback(
    (field, val, noteId) => {
      if (noteId != null) saveNoteField(noteId, field, val);
    },
    [saveNoteField],
  );

  const handleChange = useCallback(
    (html, noteId) => desaLocal('content', html, noteId),
    [desaLocal],
  );

  const handleSave = useCallback(
    (html, noteId) => desaCamp('content', html, noteId),
    [desaCamp],
  );

  const editor = useUniversalRichText({
    content: activeNote?.content || '',
    id: activeNote?.id,
    extensions,
    onChange: handleChange,
    onSave: handleSave,
    debounceMs: 800,
  });

  const { state, exec } = useTipTapToolbarAdapter(editor);

  const publica = useCallback(() => {
    if (activeNote) publishNote(activeNote);
  }, [publishNote, activeNote]);

  if (!activeNote) {
    return (
      <section className="sdp-editor">
        <div className="sdp-buit">
          <FileText size={64} />
          <h2 className="section-title">{t('section.notes.open', 'Obre un solc')}</h2>
        </div>
      </section>
    );
  }

  const topBar = (
    <UniversalRichTextToolbar
      state={state}
      exec={exec}
      onPublish={publica}
      isPublished={activeNote.isPublished}
      t={t}
    />
  );

  return (
    <UniversalEditorShell
      key={activeNote.id}
      id={activeNote.id}
      topBar={topBar}
      titleHtml={activeNote.title}
      subtitleHtml={activeNote.subtitle}
      leadHtml={activeNote.lead}
      heroImage={activeNote.heroImage}
      logoImage={activeNote.logoImage}
      isPublished={activeNote.isPublished}
      formattedTime={activeNote.formattedTime}
      formattedDate={activeNote.formattedDate}
      labels={etiquetesDeNota(activeNote, noteFolders, SENSE_PARAMS)}
      onImageUpload={pujarImatgeDeNota}
      onLocalChange={desaLocal}
      onSaveField={desaCamp}
      onToast={onToast}
    >
      <UniversalRichTextContent editor={editor} />
    </UniversalEditorShell>
  );
}
