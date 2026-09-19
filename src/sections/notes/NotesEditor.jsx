import { useIdentitat } from "../../app/contexts/IdentitatContext.jsx";
import { useCoreContent } from "../../app/contexts/CoreContentContext.jsx";
import { useSession } from "../../app/contexts/SessionContext.jsx";
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
  const { actorId } = useIdentitat();
  const { agents } = useCoreContent();
  const { currentUser } = useSession();

  const currentProfile = useMemo(() => {
    const agent = agents?.find(a => String(a.id) === String(actorId));
    if (agent) return { name: agent.name, avatar: agent.avatar_url || agent.image_url, location: agent.location };
    return {
      name: currentUser?.user_metadata?.name || currentUser?.full_name || 'Foraster',
      avatar: currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture || '/assets/system/ui/default-avatar.jpg',
      location: 'Identitat Lliure'
    };
  }, [agents, actorId, currentUser]);

  const notesAdapter = useMemo(() => {
    // La nota n1 (Bloc de notes) és fixa de "Sóc de Poble" a La Torre.
    const isExampleNote = activeNote?.id === 'n1';
    
    // Per a la resta, el perfil és de l'usuari actual
    const avatar = isExampleNote ? '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg' : (currentProfile?.avatar || '/assets/system/ui/default-avatar.jpg');
    const name = isExampleNote ? 'Sóc de Poble' : (currentProfile?.name || 'Foraster');
    const location = isExampleNote ? 'La Torre de les Maçanes' : (currentProfile?.location || 'Identitat Lliure');

    // Temps en directe per a l'edició (només si no està publicat o si és un esborrany)
    let dynamicTime = activeNote?.formattedTime;
    if (!isExampleNote) {
      const ara = new Date();
      dynamicTime = `${ara.getHours().toString().padStart(2, '0')}:${ara.getMinutes().toString().padStart(2, '0')}`;
    }

    return {
      document: activeNote ? { ...activeNote, formattedTime: dynamicTime } : null,
      updateLocal: setLocalNoteField,
      saveRemote: saveNoteField,
      publish: publishNote,
      uploadMedia: pujarImatgeDeNota,
      labels: activeNote ? etiquetesDeNota(activeNote, noteFolders, SENSE_PARAMS) : [],
      emptyPlaceholder: t('section.notes.open', 'Obre un solc'),
      barAuthorAvatar: avatar,
      barAuthorName: name,
      barAuthorLocation: location,
      copyright: '© Sóc de Poble',
      showLogoUpload: false
    };
  }, [activeNote, setLocalNoteField, saveNoteField, publishNote, noteFolders, t, currentProfile]);

  return <DocumentEditor adapter={notesAdapter} onToast={onToast} />;
}
