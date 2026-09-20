import { useIdentitat } from "../../app/contexts/IdentitatContext.jsx";
import { useCoreContent } from "../../app/contexts/CoreContentContext.jsx";
import { useSession, ESTAT } from "../../app/contexts/SessionContext.jsx";
import { useNavigate } from '../../app/contexts/RouterContext';
import { useMemo } from 'react';
import { MoreVertical, LogIn, UserRound, LogOut } from 'lucide-react';
import { Dropdown, DropdownItem } from '../../components/PedraSeca/index.js';
import { useNotes, etiquetesDeNota } from './NotesContext';
import { DocumentEditor } from '../../components/universal/DocumentEditor';
import { uploadToStorage, teCapacitat } from '../../data/backendPort.js';
import { NOTES_SEED } from '../../data/appSeed.js';

/* Constants de mòdul */
const SENSE_PARAMS = {};
const toastPerConsola = (msg, tipus) =>
  console.warn('[NotesEditor] Toast sense cablejar:', msg, tipus);

/* La nota de benvinguda (n1) és la font del text de l'estat buit. */
const NOTA_BENVINGUDA = NOTES_SEED.find((n) => n.id === 'n1') || {};

/* Lògica de pujada d'imatges pròpia de Notes */
async function pujarImatgeDeNota(fitxer) {
  if (!teCapacitat('mitjans')) return null;
  const res = await uploadToStorage(fitxer, { carpeta: 'notes' });
  return res.url;
}

/* Passarel·la d'identitat: el Bloc Universal és on l'usuari es connecta o gestiona el perfil. */
function AccionsIdentitat({ estat, onConnecta, onPerfil, onTanca }) {
  const dins = estat === ESTAT.DINS;
  return (
    <Dropdown
      right
      minWidth="220px"
      trigger={
        <button type="button" className="btn-icon-orange" aria-label="Opcions d'usuari" title="Opcions d'usuari">
          <MoreVertical size={16} />
        </button>
      }
    >
      {dins ? (
        <>
          <DropdownItem icon={<UserRound size={16} />} onClick={onPerfil}>El meu perfil</DropdownItem>
          <DropdownItem icon={<LogOut size={16} />} onClick={onTanca}>Tancar sessió</DropdownItem>
        </>
      ) : (
        <>
          <DropdownItem icon={<LogIn size={16} />} onClick={onConnecta}>Connectar</DropdownItem>
          <DropdownItem icon={<UserRound size={16} />} onClick={onConnecta}>Crear el meu perfil</DropdownItem>
        </>
      )}
    </Dropdown>
  );
}

export default function NotesEditor({ activeNote, onToast = toastPerConsola }) {
  const { saveNoteField, setLocalNoteField, publishNote, noteFolders, t } = useNotes();
  const { actorId } = useIdentitat();
  const { agents } = useCoreContent();
  const { currentUser, estat, logout } = useSession();
  const navigate = useNavigate();

  const currentProfile = useMemo(() => {
    const agent = agents?.find(a => String(a.id) === String(actorId));
    if (agent) return { name: agent.name, avatar: agent.avatar_url || agent.image_url, location: agent.location };
    return {
      name: currentUser?.user_metadata?.name || currentUser?.full_name || 'Foraster',
      avatar: currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture || '/assets/system/ui/default-avatar.jpg',
      location: 'Identitat Lliure'
    };
  }, [agents, actorId, currentUser]);

  const identityActions = useMemo(() => (
    <AccionsIdentitat
      estat={estat}
      onConnecta={() => navigate('/registre?tornar=' + encodeURIComponent('/notes'))}
      onPerfil={() => navigate('/el-meu-perfil')}
      onTanca={() => {
        Promise.resolve(logout?.()).catch((err) => onToast(err?.message || 'No s\'ha pogut tancar la sessió', 'error'));
      }}
    />
  ), [estat, navigate, logout, onToast]);

  /* Estat buit: la mateixa anatomia que la nota de benvinguda, en mode lectura. */
  const emptyDocument = useMemo(() => ({
    title: NOTA_BENVINGUDA.title || t('section.notes.open', 'Obre un solc'),
    subtitle: NOTA_BENVINGUDA.subtitle,
    lead: NOTA_BENVINGUDA.lead,
    heroImage: NOTA_BENVINGUDA.heroImage,
    heroAlt: 'Una llibreta oberta amb algú escrivint',
    content: NOTA_BENVINGUDA.content,
    labels: etiquetesDeNota(NOTA_BENVINGUDA, noteFolders, SENSE_PARAMS),
    copyright: '© Sóc de Poble'
  }), [noteFolders, t]);

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
      emptyDocument,
      identityActions,
      barAuthorAvatar: avatar,
      barAuthorName: name,
      barAuthorLocation: location,
      copyright: '© Sóc de Poble'
    };
  }, [activeNote, setLocalNoteField, saveNoteField, publishNote, noteFolders, t, currentProfile, emptyDocument, identityActions]);

  return <DocumentEditor adapter={notesAdapter} onToast={onToast} />;
}
