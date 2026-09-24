import { useIdentitat } from "../../app/contexts/IdentitatContext.jsx";
import { useCoreContent } from "../../app/contexts/CoreContentContext.jsx";
import { useSession } from "../../app/contexts/SessionContext.jsx";
import { useCallback, useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import { useNotes, etiquetesDeNota } from './NotesContext';
import { DocumentEditor } from '../../components/universal/DocumentEditor';
import { uploadToStorage, teCapacitat } from '../../data/backendPort.js';
import { NOTES_SEED } from '../../data/appSeed.js';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { Dialeg, Boto, Camp, CampText, Casella } from '../../components/PedraSeca';

/* Constants de mòdul */
const SENSE_PARAMS = {};
const CAP = Object.freeze([]);
const toastPerConsola = (msg, tipus) =>
  console.warn('[NotesEditor] Toast sense cablejar:', msg, tipus);

/* La nota de benvinguda (n1) és la font del text de l'estat buit. */
const NOTA_BENVINGUDA = NOTES_SEED.find((n) => n.id === 'n1') || {};

/* Categories i etiquetes que sempre existixen al Bloc (les mateixes que la
   columna de navegació de NotesSection). */
const CATEGORIES_BASE = ['Sistema'];
const ETIQUETES_BASE = ['Productivitat', 'Tutorial'];

/* Lògica de pujada d'imatges pròpia de Notes */
async function pujarImatgeDeNota(fitxer, config) {
  if (!teCapacitat('mitjans')) return null;
  const res = await uploadToStorage(fitxer, { carpeta: 'notes', tenantId: config?.tenantId }, config);
  return res.url;
}

/**
 * Diàleg de classificació (categories o etiquetes d'una nota): caselles amb
 * els valors coneguts del Bloc més un camp per a afegir-ne un de nou. La
 * decisió es confirma amb «Desar» (Pedra Seca: casella = decisió confirmada).
 */
function DialegClassificacio({ obert, onTanca, titol, coneguts, seleccionats, onDesa }) {
  const [triats, setTriats] = useState(() => new Set(seleccionats));
  const [nou, setNou] = useState('');
  const [afegits, setAfegits] = useState(CAP);
  const opcions = useMemo(
    () => [...new Set([...coneguts, ...afegits, ...seleccionats])].sort((a, b) => a.localeCompare(b, 'ca')),
    [coneguts, afegits, seleccionats]
  );
  const alterna = (valor) => setTriats((previ) => {
    const seguent = new Set(previ);
    if (seguent.has(valor)) seguent.delete(valor); else seguent.add(valor);
    return seguent;
  });
  const afegix = () => {
    const valor = nou.trim();
    if (!valor) return;
    setAfegits((previ) => (previ.includes(valor) ? previ : [...previ, valor]));
    setTriats((previ) => new Set([...previ, valor]));
    setNou('');
  };
  return (
    <Dialeg
      obert={obert}
      onTanca={onTanca}
      titol={titol}
      mida="s"
      accions={(
        <>
          <Boto varietat="secundari" onClick={() => onTanca?.('boto')}>Cancel·lar</Boto>
          <Boto varietat="primari" onClick={() => onDesa([...triats])}>Desar</Boto>
        </>
      )}
    >
      <div className="sdp-classificacio">
        {opcions.map((valor) => (
          <Casella key={valor} etiqueta={valor} checked={triats.has(valor)} onChange={() => alterna(valor)} />
        ))}
        <Camp etiqueta="Afegir-ne una de nova" ajuda="Escriu el nom i prem Retorn.">
          <CampText
            value={nou}
            onChange={(e) => setNou(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); afegix(); } }}
          />
        </Camp>
      </div>
    </Dialeg>
  );
}

export default function NotesEditor({ activeNote, onToast = toastPerConsola }) {
  const {
    saveNoteField, setLocalNoteField, publishNote, noteFolders, t, config, workspaceKey,
    notes = CAP
  } = useNotes();
  const { actorId } = useIdentitat();
  const { agents } = useCoreContent();
  const { currentUser, esSuperadmin = false } = useSession();
  const { showToast } = useToast();

  const currentProfile = useMemo(() => {
    const agent = agents?.find(a => String(a.id) === String(actorId));
    if (agent) return { name: agent.name, avatar: agent.avatar_url || agent.image_url, location: agent.location };
    return {
      name: currentUser?.user_metadata?.name || currentUser?.full_name || 'Foraster',
      avatar: currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture || '/assets/system/ui/default-avatar.jpg',
      location: 'Identitat Lliure'
    };
  }, [agents, actorId, currentUser]);

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

  /* ── Sandbox del Foraster ────────────────────────────────────────────────
     Sense sessió no hi ha notes pròpies, però la persona ha de poder provar
     l'editor (pla 260924_1710 §3.4, «Botó EDITAR per a Forasters»). El botó
     EDITAR viu a la barra taronja de l'estat buit i obri una còpia local de la
     nota de benvinguda: els canvis es queden en memòria, res no s'envia. */
  const foraster = !currentUser;
  const [provant, setProvant] = useState(false);
  const [sandbox, setSandbox] = useState(() => ({
    ...NOTA_BENVINGUDA, id: 'prova-local', isPublished: false, revision: 0
  }));
  const actualitzaSandbox = useCallback((_id, field, value) => {
    setSandbox((previ) => (previ[field] === value ? previ : { ...previ, [field]: value }));
  }, []);
  const notaEnEdicio = activeNote || (foraster && provant ? sandbox : null);
  const esSandbox = notaEnEdicio === sandbox;

  /* ── Classificació (barra de l'editor) ───────────────────────────────── */
  const [dialeg, setDialeg] = useState(null); // 'categories' | 'etiquetes' | null
  const coneguts = useMemo(() => {
    const categories = new Set(CATEGORIES_BASE);
    const etiquetes = new Set(ETIQUETES_BASE);
    for (const n of notes) {
      (n.categories || []).forEach((c) => categories.add(c));
      (n.tags || []).forEach((e) => etiquetes.add(e));
    }
    return { categories: [...categories], etiquetes: [...etiquetes] };
  }, [notes]);

  const desaClassificacio = useCallback((camp, valors) => {
    if (!notaEnEdicio) return;
    if (esSandbox) actualitzaSandbox(notaEnEdicio.id, camp, valors);
    else setLocalNoteField?.(notaEnEdicio.id, camp, valors);
    setDialeg(null);
  }, [notaEnEdicio, esSandbox, actualitzaSandbox, setLocalNoteField]);

  const avisReservat = useCallback(() => {
    showToast('Les categories de sistema i de projecte encara no tenen model de dades: decisió pendent del Mestre.');
  }, [showToast]);

  const metaActions = useMemo(() => {
    if (!notaEnEdicio) return CAP;
    const accions = [];
    // Només la persona superadministradora veu les categories reservades.
    if (esSuperadmin) {
      accions.push({ id: 'sistema', label: 'Categories de sistema', reservat: true, onClick: avisReservat });
      accions.push({ id: 'projecte', label: 'Categories de projecte', reservat: true, onClick: avisReservat });
    }
    accions.push({
      id: 'categories', label: 'Categories',
      pressed: (notaEnEdicio.categories || []).length > 0,
      onClick: () => setDialeg('categories')
    });
    accions.push({
      id: 'etiquetes', label: 'Etiquetes',
      pressed: (notaEnEdicio.tags || []).length > 0,
      onClick: () => setDialeg('etiquetes')
    });
    return accions;
  }, [notaEnEdicio, esSuperadmin, avisReservat]);

  const notesAdapter = useMemo(() => {
    // La nota n1 (Bloc de notes) és fixa de "Sóc de Poble" a La Torre.
    const isExampleNote = notaEnEdicio?.id === 'n1';

    // Per a la resta, el perfil és de l'usuari actual
    const avatar = isExampleNote ? '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg' : (currentProfile?.avatar || '/assets/system/ui/default-avatar.jpg');
    const name = isExampleNote ? 'Sóc de Poble' : (currentProfile?.name || 'Foraster');
    const location = isExampleNote ? 'La Torre de les Maçanes' : (currentProfile?.location || 'Identitat Lliure');

    const botoEditar = foraster && !provant ? (
      <button type="button" className="btn-connectar" onClick={() => setProvant(true)}>
        EDITAR
      </button>
    ) : null;

    return {
      document: notaEnEdicio || null,
      updateLocal: esSandbox ? actualitzaSandbox : setLocalNoteField,
      saveRemote: esSandbox ? undefined : saveNoteField,
      publish: esSandbox
        ? () => showToast('Connecta amb el teu compte per a publicar la nota al Mur.', 'error')
        : publishNote,
      uploadMedia: (file) => pujarImatgeDeNota(file, config),
      labels: notaEnEdicio ? etiquetesDeNota(notaEnEdicio, noteFolders, SENSE_PARAMS) : [],
      emptyPlaceholder: t('section.notes.open', 'Obre un solc'),
      emptyDocument,
      identityActions: botoEditar,
      metaActions,
      statusIcon: <Info size={16} />,
      barAuthorAvatar: avatar,
      barAuthorName: name,
      barAuthorLocation: location,
      copyright: '© Sóc de Poble'
    };
  }, [notaEnEdicio, esSandbox, actualitzaSandbox, setLocalNoteField, saveNoteField, publishNote, noteFolders, t, currentProfile, emptyDocument, config, foraster, provant, showToast, metaActions]);

  return (
    <>
      <DocumentEditor key={`${workspaceKey}:${notaEnEdicio?.id || "intro"}`} adapter={notesAdapter} onToast={onToast} />
      {dialeg && notaEnEdicio ? (
        <DialegClassificacio
          key={`${dialeg}:${notaEnEdicio.id}`}
          obert
          onTanca={() => setDialeg(null)}
          titol={dialeg === 'categories' ? 'Categories de la nota' : 'Etiquetes de la nota'}
          coneguts={dialeg === 'categories' ? coneguts.categories : coneguts.etiquetes}
          seleccionats={(dialeg === 'categories' ? notaEnEdicio.categories : notaEnEdicio.tags) || CAP}
          onDesa={(valors) => desaClassificacio(dialeg === 'categories' ? 'categories' : 'tags', valors)}
        />
      ) : null}
    </>
  );
}
