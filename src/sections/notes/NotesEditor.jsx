import { useMemo } from 'react';
import { useNotes, etiquetesDeNota } from './NotesContext';
import { DocumentEditor } from '../../components/universal/DocumentEditor';
import { uploadToStorage, teCapacitat } from '../../data/backendPort.js';

/* Constants de mòdul */
const SENSE_PARAMS = {};
const toastPerConsola = (msg, tipus) =>
  console.warn('[NotesEditor] Toast sense cablejar:', msg, tipus);

/* Lògica de pujada d'imatges pròpia de Notes */
async function pujarImatgeDeNota(fitxer) {
  if (!teCapacitat('mitjans')) return null;
  const res = await uploadToStorage(fitxer, { carpeta: 'notes' });
  return res.url;
}

export default function NotesEditor({ activeNote, onToast = toastPerConsola }) {
  const { saveNoteField, setLocalNoteField, publishNote, noteFolders, t } = useNotes();

  const notesAdapter = useMemo(() => ({
    document: activeNote,
    updateLocal: setLocalNoteField,
    saveRemote: saveNoteField,
    publish: publishNote,
    uploadMedia: pujarImatgeDeNota,
    labels: activeNote ? etiquetesDeNota(activeNote, noteFolders, SENSE_PARAMS) : [],
    emptyPlaceholder: t('section.notes.open', 'Obre un solc')
  }), [activeNote, setLocalNoteField, saveNoteField, publishNote, noteFolders, t]);

  return <DocumentEditor adapter={notesAdapter} onToast={onToast} />;
}
