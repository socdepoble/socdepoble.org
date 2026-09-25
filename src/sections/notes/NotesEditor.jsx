import { useIdentitat } from "../../app/contexts/IdentitatContext.jsx";
import { useCoreContent } from "../../app/contexts/CoreContentContext.jsx";
import { useSession } from "../../app/contexts/SessionContext.jsx";
import { useCallback, useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import { useNotes, etiquetesDeNota } from './NotesContext';
import { DocumentEditor } from '../../components/universal/DocumentEditor';
import { uploadToStorage, teCapacitat } from '../../data/backendPort.js';
import { NOTES_SEED, NOTE_FOLDERS_SEED } from '../../data/appSeed.js';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { Boto } from '../../components/PedraSeca';
import { BotoneraClassificacio } from '../../components/universal/classificacio/BotoneraClassificacio.jsx';
import { DialegCarpeta } from '../../components/universal/classificacio/DialegCarpeta.jsx';
import { DialegValors } from '../../components/universal/classificacio/DialegValors.jsx';
import {
  CATEGORIA_GENERAL, classificacioDe, canvisDeClassificacio, cataleg, usos, reanomena, esborra
} from '../../components/universal/classificacio/model.js';

/* Constants de mòdul */
const SENSE_PARAMS = {};
const CAP = Object.freeze([]);
const toastPerConsola = (msg, tipus) =>
  console.warn('[NotesEditor] Toast sense cablejar:', msg, tipus);

/* La nota de benvinguda (n1) és la font del text de l'estat buit. */
const NOTA_BENVINGUDA = NOTES_SEED.find((n) => n.id === 'n1') || {};

/* Categories i etiquetes que sempre existixen al Bloc (les mateixes que la
   columna de navegació de NotesSection). Com que sempre hi tornen, a la modal
   no es reanomenen ni s'esborren. */
const CATEGORIES_BASE = ['Sistema'];
const ETIQUETES_BASE = ['Productivitat', 'Tutorial'];
const CARPETA_PER_DEFECTE = 'f-notes';

const AVIS_CATEGORIA = `Cal almenys una categoria. Si vols netejar-les, marca'n una de general, com «${CATEGORIA_GENERAL}».`;
/* Carpetes: el port de dades (backendPort.js) no té cap mètode per a crear,
   reanomenar ni esborrar carpetes; el catàleg és el de sèrie. Fins que hi haja
   contracte amb Sollutia (AGENTS §8) només es pot triar. */
const AVIS_CARPETES = 'Crear, reanomenar i esborrar carpetes encara no té contracte de dades amb el servidor. De moment, tria la carpeta d’esta nota.';
const AVIS_SENSE_TOTES = 'Reanomenar i esborrar estaran disponibles quan s’hagen carregat totes les notes.';

/* Lògica de pujada d'imatges pròpia de Notes */
async function pujarImatgeDeNota(fitxer, config) {
  if (!teCapacitat('mitjans')) return null;
  const res = await uploadToStorage(fitxer, { carpeta: 'notes', tenantId: config?.tenantId }, config);
  return res.url;
}

export default function NotesEditor({ activeNote, onToast = toastPerConsola }) {
  const {
    saveNoteField, setLocalNoteField, publishNote, noteFolders, t, config, workspaceKey,
    notes = CAP, notesComplete
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
     l'editor (pla 260924_1710 §3.4). Abans calia prémer EDITAR; ara la còpia
     local de la nota de benvinguda s'obri directament: la primera tecla ja
     edita. Els canvis es queden en memòria, res no s'envia. */
  const foraster = !currentUser;
  const [sandbox, setSandbox] = useState(() => ({
    ...NOTA_BENVINGUDA, id: 'prova-local', isPublished: false, revision: 0
  }));
  const actualitzaSandbox = useCallback((_id, field, value) => {
    setSandbox((previ) => (previ[field] === value ? previ : { ...previ, [field]: value }));
  }, []);
  const notaEnEdicio = activeNote || (foraster ? sandbox : null);
  const esSandbox = notaEnEdicio === sandbox;

  /* ── Classificació (botonera davall del títol) ───────────────────────── */
  const [dialeg, setDialeg] = useState(null); // 'carpeta' | 'categories' | 'etiquetes' | null
  // Documents sobre què actuen reanomenar i esborrar: les notes del bloc i,
  // si s'està provant, la còpia local.
  const documents = useMemo(() => (esSandbox ? [sandbox, ...notes] : notes), [esSandbox, sandbox, notes]);
  const carpetes = useMemo(() => {
    const llista = noteFolders?.length ? noteFolders : NOTE_FOLDERS_SEED;
    return llista.filter((f) => String(f.id) !== 'f-tot').map((f) => ({ id: String(f.id), nom: f.name }));
  }, [noteFolders]);
  const classificacio = useMemo(() => (notaEnEdicio ? classificacioDe(notaEnEdicio) : null), [notaEnEdicio]);
  const carpetaId = String(notaEnEdicio?.folderId ?? CARPETA_PER_DEFECTE);

  const escriu = useCallback((operacions) => {
    for (const { doc, canvis } of operacions) {
      for (const [camp, valor] of Object.entries(canvis)) {
        if (esSandbox && doc.id === sandbox.id) actualitzaSandbox(doc.id, camp, valor);
        else setLocalNoteField?.(doc.id, camp, valor);
      }
    }
  }, [esSandbox, sandbox.id, actualitzaSandbox, setLocalNoteField]);

  const desaCarpeta = useCallback((id) => {
    if (notaEnEdicio && id && id !== carpetaId) escriu([{ doc: notaEnEdicio, canvis: { folderId: id } }]);
    setDialeg(null);
  }, [notaEnEdicio, carpetaId, escriu]);

  const desaValors = useCallback((camp, valors) => {
    if (notaEnEdicio) {
      const canvis = canvisDeClassificacio(notaEnEdicio, { ...classificacioDe(notaEnEdicio), [camp]: valors });
      if (Object.keys(canvis).length) escriu([{ doc: notaEnEdicio, canvis }]);
    }
    setDialeg(null);
  }, [notaEnEdicio, escriu]);

  const tancaDialeg = useCallback(() => setDialeg(null), []);

  const notesAdapter = useMemo(() => {
    // La nota n1 (Bloc de notes) és fixa de "Sóc de Poble" a La Torre.
    const isExampleNote = notaEnEdicio?.id === 'n1';

    // Per a la resta, el perfil és de l'usuari actual
    const avatar = isExampleNote ? '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg' : (currentProfile?.avatar || '/assets/system/ui/default-avatar.jpg');
    const name = isExampleNote ? 'Sóc de Poble' : (currentProfile?.name || 'Foraster');
    const location = isExampleNote ? 'La Torre de les Maçanes' : (currentProfile?.location || 'Identitat Lliure');

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
      classificacio: classificacio ? (
        <BotoneraClassificacio
          carpeta={carpetes.find((c) => c.id === carpetaId)?.nom}
          categories={classificacio.categories}
          etiquetes={classificacio.tags}
          onObri={setDialeg}
        />
      ) : null,
      statusIcon: <Info size={16} />,
      barAuthorAvatar: avatar,
      barAuthorName: name,
      barAuthorLocation: location,
      copyright: '© Sóc de Poble'
    };
  }, [notaEnEdicio, esSandbox, actualitzaSandbox, setLocalNoteField, saveNoteField, publishNote, noteFolders, t, currentProfile, emptyDocument, config, showToast, classificacio, carpetes, carpetaId]);

  // Reanomenar i esborrar necessiten veure totes les notes: amb el llistat a
  // mitges, una nota no carregada es quedaria amb el nom vell.
  const globalActiu = notesComplete !== false;
  const propsValors = (camp) => ({
    obert: true,
    onTanca: tancaDialeg,
    cataleg: cataleg(documents, camp, camp === 'categories' ? CATEGORIES_BASE : ETIQUETES_BASE),
    seleccionats: classificacio[camp],
    fixos: camp === 'categories' ? CATEGORIES_BASE : ETIQUETES_BASE,
    usos: usos(documents, camp),
    onDesa: (valors) => desaValors(camp, valors),
    onReanomena: (vell, nou) => escriu(reanomena(documents, camp, vell, nou)),
    onEsborra: (valor) => escriu(esborra(documents, camp, valor)),
    globalActiu,
    avisGlobal: AVIS_SENSE_TOTES
  });

  return (
    <>
      <DocumentEditor key={`${workspaceKey}:${notaEnEdicio?.id || "intro"}`} adapter={notesAdapter} onToast={onToast} />
      {dialeg === 'carpeta' && notaEnEdicio ? (
        <DialegCarpeta
          key={`carpeta:${notaEnEdicio.id}`}
          obert
          onTanca={tancaDialeg}
          opcions={carpetes}
          seleccionada={carpetaId}
          onDesa={desaCarpeta}
          avis={AVIS_CARPETES}
        />
      ) : null}
      {dialeg === 'categories' && notaEnEdicio ? (
        <DialegValors
          key={`categories:${notaEnEdicio.id}`}
          {...propsValors('categories')}
          titol="Categories de la nota"
          etiquetaNou="Nova categoria"
          minim={1}
          avisMinim={AVIS_CATEGORIA}
          extra={esSuperadmin ? (
            // Només la persona superadministradora les veu, com abans a la barra.
            <div className="sdp-classificacio-dialeg__reservat">
              <p className="sdp-classificacio-dialeg__avis">Les categories de sistema i de projecte encara no tenen model de dades: decisió pendent del Mestre.</p>
              <Boto varietat="fantasma" disabled>Categories de sistema</Boto>
              <Boto varietat="fantasma" disabled>Categories de projecte</Boto>
            </div>
          ) : null}
        />
      ) : null}
      {dialeg === 'etiquetes' && notaEnEdicio ? (
        <DialegValors
          key={`etiquetes:${notaEnEdicio.id}`}
          {...propsValors('tags')}
          titol="Etiquetes de la nota"
          etiquetaNou="Nova etiqueta"
          minim={0}
        />
      ) : null}
    </>
  );
}
