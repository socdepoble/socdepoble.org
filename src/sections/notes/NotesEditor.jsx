import { useIdentitat } from "../../app/contexts/IdentitatContext.jsx";
import { useCoreContent } from "../../app/contexts/CoreContentContext.jsx";
import { useSession } from "../../app/contexts/SessionContext.jsx";
import { useCallback, useMemo, useRef, useState } from 'react';
import { useLocalSandbox } from './useLocalSandbox.js';
import { compressImage } from '../../utils/imageUtils.js';
import { useNotes, etiquetesDeNota } from './NotesContext';
import { useEstatDesamentNota, estatPerAlEditor } from './useEstatDesamentNota.js';
import { DocumentEditor } from '../../components/universal/DocumentEditor';
import { uploadToStorage, teCapacitat } from '../../data/backendPort.js';
import { NOTES_SEED, NOTE_FOLDERS_SEED } from '../../data/appSeed.js';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { BotoneraClassificacio } from '../../components/universal/classificacio/BotoneraClassificacio.jsx';
import { DialegCarpeta } from '../../components/universal/classificacio/DialegCarpeta.jsx';
import { DialegValors } from '../../components/universal/classificacio/DialegValors.jsx';
import { DialegEmoticona } from '../../components/universal/classificacio/DialegEmoticona.jsx';
import { DialegEsborrarNota } from './DialegEsborrarNota.jsx';
import {
  CATEGORIA_GENERAL, classificacioDe, canvisDeClassificacio, cataleg, usos, reanomena, esborra
} from '../../components/universal/classificacio/model.js';
import { esConnexio, esExtern, netejaDrets, teDretsReservats } from '../../data/origenNota.js';
import {
  TEXT_DRETS_RESERVATS, TITOL_DRETS_RESERVATS, bloqueigDeNota, publicaAmbMotiu, textosAmbDrets, textosDeNota
} from './visibilitatNota.js';
import { Alerta, Insignia } from '../../components/PedraSeca';
import { llicenciaDeLActor } from '../../components/universal/drets/herencia.js';
import { ID_COPIA_PROVA, ID_NOTA_BENVINGUDA, autoriaDeLActor, autoriaDeNota } from './autoriaNota.js';
import { useNotaPreparadaDelBloc } from './notaPreparada.js';
import { useMur } from '../mur/MurContext';
import { cercaEntrades, deActe, dePagina, dePoble, deProducte, dePublicacio, textPla } from '../search/indexCerca.js';
import { rutaDePerfilDAutor } from '../../config/navigation.js';

/* Constants de mòdul */
const SENSE_PARAMS = {};
const CAP = Object.freeze([]);

/* La nota de benvinguda (n1) és la font del text de l'estat buit. */
const NOTA_BENVINGUDA = NOTES_SEED.find((n) => n.id === ID_NOTA_BENVINGUDA) || {};

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
/* T40 (ordre del Mestre, 260928) · Sense la columna publish_date (D2), la data
   queda en quarantena al dispositiu i publishNote la pren de la nota d'ací:
   des d'un altre dispositiu el Mur no rebria cap data triada i cauria a la de
   creació (created_at). */
const AVIS_DATA_DISPOSITIU = 'Al servidor encara no hi ha on guardar la data de publicació. Es guarda en este dispositiu i només s’aplica si publiques des d’ací.';
/* T71b · El selector de visibilitat d'un contingut de fora: els textos de
   compartir (visibilitatNota.js, CONNEXIO), però és una còpia de la persona,
   que l'edita: no es diu que siga d'altri ni que només es llig. */
const TEXTOS_EXTERN = Object.freeze({
  ...textosDeNota({ connexio: true }),
  descripcio: 'Este contingut de fora és una còpia teua: el pots editar, i compartir-lo el porta al teu Mur citant-ne l’origen.'
});

/* Lògica de pujada d'imatges pròpia de Notes */
async function pujarImatgeDeNota(fitxer, config) {
  if (config?.dataMode === 'seed' || config?.dataMode === 'local') {
    if (!/^image\/(png|jpeg|webp|gif|avif)$/.test(fitxer.type) || fitxer.size > 10 * 1024 * 1024) {
      throw new Error('Tria una imatge PNG, JPEG, WebP, GIF o AVIF de menys de 10 MB.');
    }
    return compressImage(fitxer, { maxSize: 1200 });
  }
  if (!teCapacitat('mitjans')) return null;
  const res = await uploadToStorage(fitxer, { carpeta: 'notes', tenantId: config?.tenantId }, config);
  return res.url;
}

/* T7 (ordre del Mestre, prompt 261004_0515) · Les targetes que el Bloc pot
   incrustar al cos d'una nota: les fonts públiques que ja carreguen el Mur i
   el contingut base, amb els adaptadors purs de /cerca (indexCerca.js), més
   el que la instantània de la targeta necessita (subtítol, autor, la seua
   pàgina i poble). Cap nota ni cap conversa: una nota privada incrustada en
   una publicació exposaria el seu títol (decisió per defecte, pendent del
   Mestre). Només el Bloc de Notes oferix targetes; el Perfil, pendent. */
const textDe = (...valors) => valors.map((valor) => textPla(valor)).find(Boolean) || '';
const autoriaDe = (element) => {
  try {
    return rutaDePerfilDAutor(element) || '';
  } catch {
    return '';
  }
};

function entradesDeTargetes({ publicacions, actes, productes, pobles, pagines }) {
  const entrades = [];
  const afig = (llista, adaptador, extra) => {
    for (const element of Array.isArray(llista) ? llista : CAP) {
      const entrada = adaptador(element, SENSE_PARAMS);
      if (entrada && !entrada.privada) entrades.push({ ...entrada, ...extra(element) });
    }
  };
  afig(publicacions, dePublicacio, (post) => ({
    subtitol: textDe(post?.post_subtitle, post?.subtitle),
    autor: textDe(post?.author_name, post?.author),
    autorRuta: autoriaDe(post),
    poble: textDe(post?.town_name, post?.author_location)
  }));
  afig(actes, deActe, (acte) => ({
    subtitol: textDe(acte?.subtitle),
    autor: textDe(acte?.author_name),
    autorRuta: autoriaDe(acte),
    poble: textDe(acte?.author_location, acte?.town_name)
  }));
  afig(productes, deProducte, (producte) => ({
    subtitol: textDe(producte?.subtitle),
    autor: textDe(producte?.seller, producte?.author_name),
    autorRuta: autoriaDe(producte),
    poble: textDe(producte?.population, producte?.author_location)
  }));
  afig(pobles, dePoble, (poble) => ({ subtitol: textDe(poble?.post_subtitle), poble: textDe(poble?.comarca) }));
  afig(pagines, dePagina, (pagina) => ({ subtitol: textDe(pagina?.subtitle) }));
  return entrades;
}

/* T7 · `onToast` és opcional: sense, els avisos de l'editor (p. ex. una
   capçalera que no s'ha pogut pujar) van al missatge ràpid de l'app
   (useToast), i no a la consola. Abans cap muntatge (NotesDetail, el
   catàleg) el passava i la persona no veia l'error. */
export default function NotesEditor({ activeNote, onToast = null }) {
  const {
    saveNoteField, setLocalNoteField, publishNote, compartirNota, noteFolders, t, config, workspaceKey,
    notes = CAP, notesComplete, mouNota, esborraNota, potEsborrar = false, scopeKey
  } = useNotes();
  const { actorId, actor, memberships } = useIdentitat();
  const { agents, towns, pages } = useCoreContent();
  const { currentUser, esSuperadmin = false } = useSession();
  const { showToast } = useToast();
  const mur = useMur();

  /* T7 · La font de les targetes incrustades (DocumentEditor · targetes). La
     funció és estable: notesAdapter es recalcula amb trenta dependències i
     l'esquema de l'editor es fixa en crear-lo. Les entrades es fan quan es
     busca, no a cada render, i es recorden mentre les fonts no canvien. */
  const fontsTargetes = useRef(null);
  fontsTargetes.current = {
    publicacions: mur.feedPosts, actes: mur.events, productes: mur.marketItems, pobles: towns, pagines: pages
  };
  const memoriaTargetes = useRef({ fonts: null, entrades: CAP });
  const cercaTargetes = useCallback((consulta) => {
    const fonts = fontsTargetes.current;
    const memoria = memoriaTargetes.current;
    if (!memoria.fonts || Object.keys(fonts).some((clau) => fonts[clau] !== memoria.fonts[clau])) {
      memoriaTargetes.current = { fonts, entrades: entradesDeTargetes(fonts) };
    }
    return cercaEntrades(memoriaTargetes.current.entrades, consulta).llista;
  }, []);
  const targetes = useMemo(() => ({ cerca: cercaTargetes }), [cercaTargetes]);

  /* Poliment T41/T43 · el mateix nom que publishNote posa al Mur (autoriaNota):
     el selector i la barra no poden dir una cosa i el Mur una altra. */
  const autoria = useMemo(() => autoriaDeLActor(actor, currentUser), [actor, currentUser]);

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
  const sandboxInitial = useMemo(() => ({
    ...NOTA_BENVINGUDA, id: ID_COPIA_PROVA, isPublished: false, revision: 0
  }), []);
  const [sandbox, actualitzaSandbox] = useLocalSandbox(sandboxInitial, config,
    message => showToast(message, 'error'));
  const notaEnEdicio = activeNote || (foraster ? sandbox : null);
  const esSandbox = notaEnEdicio === sandbox;
  /* P4 (ordre del Mestre, 261003) · La «Nota sense títol» del Bloc
     (notaPreparada.js) encara no és al servidor: escriu pel seu canal, que la
     crea amb la primera cosa que s'hi escriu. Fora del Bloc no n'hi ha. */
  const preparada = useNotaPreparadaDelBloc();
  const escriuPreparada = preparada?.escriu || null;
  const desaPreparada = preparada?.desa || escriuPreparada;
  const esPreparada = Boolean(notaEnEdicio?.preparada && escriuPreparada);
  /* Revisió de P4 · L'estat de la seua creació ({ estat, detall } o null):
     'enviant', 'error' (amb «Torna-ho a provar») o 'pendent'. */
  const creacioPreparada = esPreparada ? preparada?.creacio ?? null : null;
  const reintentaPreparada = esPreparada ? preparada?.reintenta ?? null : null;
  /* T5 · una nota connectada és d'altri: no es publica com a pròpia, es
     compartix citant l'origen. D4 (excepció del Mestre, 260930) · al MAS és
     una còpia editable: s'obri ací, amb l'avís d'autoria. */
  const connexio = esConnexio(notaEnEdicio);
  /* D4 · l'original porta els drets reservats (origen.drets comença per «©»). */
  const dretsReservats = connexio && teDretsReservats(notaEnEdicio?.origen);
  /* Revisió de D4 (260930) · Els drets d'una connexió són els de l'original
     (els mateixos que publishNote envia al Mur): l'editor els pinta en lloc
     del copyright de la nota o del «© Sóc de Poble» de sèrie, i no deixa
     triar-ne cap altre (l'obra és d'altri). */
  const dretsDeLOriginal = connexio ? netejaDrets(notaEnEdicio?.origen?.drets) : '';
  /* El copyright que es pinta (closca, targeta viva i vista A4) és el de
     l'original; la resta, la nota tal qual. Memoritzat a part: el document
     només canvia quan canvia la nota. publishNote no desa este copyright. */
  const documentPerAlEditor = useMemo(
    () => (connexio ? { ...notaEnEdicio, copyright: dretsDeLOriginal } : (notaEnEdicio || null)),
    [connexio, notaEnEdicio, dretsDeLOriginal]
  );
  /* T71b · un contingut de fora és una còpia de la persona i s'edita, però
     tampoc es publica com a propi: es compartix, citant l'origen (la cita la
     posa publishNote si el cos ja no la porta). */
  const extern = esExtern(notaEnEdicio);
  const citaOrigen = connexio || extern;

  /* ── T47b (ordre del Mestre, 260928) · La ploma (skill sdp-universal-editor
     §1) a la barra taronja, amb l'estat de la cua de Notes. Només per a una
     nota de veres: la còpia de prova del Foraster no ix del dispositiu, i la
     nota preparada (P4) encara no té res a la cua. ─── */
  const idDesament = esSandbox || esPreparada ? null : notaEnEdicio?.id ?? null;
  const desament = useEstatDesamentNota(scopeKey, idDesament);
  /* T47 (ordre del Mestre, 260928) · Una nota oberta amb un esborrany D01
     (draftConflict) no està «tota desada»: espera que la persona tríe.
     Revisió de P4 · La nota preparada no té cua, però sí una creació: la
     barra diu si viatja o si no ha arribat (amb la veritat: el text només és
     en esta pestanya) i el detall oferix tornar-ho a provar sense escriure. */
  const conflicte = Boolean(notaEnEdicio?.draftConflict);
  const estatDesament = useMemo(() => {
    if (scopeKey && idDesament != null) return estatPerAlEditor(desament, { conflicte });
    if (!creacioPreparada) return null;
    return creacioPreparada.estat === 'error' && typeof reintentaPreparada === 'function'
      ? { ...creacioPreparada, accions: [{ text: t('common.reintenta', 'Torna-ho a provar'), onClick: reintentaPreparada }] }
      : creacioPreparada;
  }, [scopeKey, idDesament, desament, conflicte, creacioPreparada, reintentaPreparada, t]);
  const dataNomesAlDispositiu = Boolean(estatDesament) && Boolean(desament?.quarantena?.includes('publishDate'));

  /* ── Classificació (botonera davall del títol) ───────────────────────── */
  const [dialeg, setDialeg] = useState(null); // 'carpeta' | 'categories' | 'etiquetes' | 'emoticona' | 'esborrar' | null
  // Documents sobre què actuen reanomenar i esborrar: les notes del bloc i,
  // si s'està provant, la còpia local.
  const documents = useMemo(() => (esSandbox ? [sandbox, ...notes] : notes), [esSandbox, sandbox, notes]);
  /* T7 (P5/P8) · Contracte amb el Lot A: { id, nom, parentId }. Amb parentId,
     DialegCarpeta pinta l'arbre amb sagnat; la llavor és plana i es veu igual. */
  const carpetes = useMemo(() => {
    const llista = noteFolders?.length ? noteFolders : NOTE_FOLDERS_SEED;
    return llista.filter((f) => String(f.id) !== 'f-tot').map((f) => ({
      id: String(f.id), nom: f.name, parentId: f.parentId == null ? null : String(f.parentId)
    }));
  }, [noteFolders]);
  const classificacio = useMemo(() => (notaEnEdicio ? classificacioDe(notaEnEdicio) : null), [notaEnEdicio]);
  const carpetaId = String(notaEnEdicio?.folderId ?? CARPETA_PER_DEFECTE);

  const idEnEdicio = notaEnEdicio?.id;
  const escriu = useCallback((operacions) => {
    for (const { doc, canvis } of operacions) {
      for (const [camp, valor] of Object.entries(canvis)) {
        if (esSandbox && doc.id === sandbox.id) actualitzaSandbox(doc.id, camp, valor);
        else if (esPreparada && doc.id === idEnEdicio) escriuPreparada(doc.id, camp, valor);
        else setLocalNoteField?.(doc.id, camp, valor);
      }
    }
  }, [esSandbox, sandbox.id, actualitzaSandbox, esPreparada, idEnEdicio, escriuPreparada, setLocalNoteField]);

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

  /* T23 · l'emoticona és un camp més del document (`icon`): al sandbox del
     Foraster o a la nota, pel mateix canal que la classificació. Buida = llevar. */
  const desaEmoticona = useCallback((icon) => {
    if (notaEnEdicio && (icon || '') !== (notaEnEdicio.icon || '')) escriu([{ doc: notaEnEdicio, canvis: { icon: icon || '' } }]);
    setDialeg(null);
  }, [notaEnEdicio, escriu]);

  const tancaDialeg = useCallback(() => setDialeg(null), []);
  /* T51 · el botó de l'espai central de la barra taronja obri el mateix
     DialegEmoticona que el quart botó de la botonera (que es conserva). */
  const obriEmoticona = useCallback(() => setDialeg('emoticona'), []);

  /* ── Borrar (paperera, arxiu o definitiu) ────────────────────────────────
     Només si el backend té la capacitat 'cicleNotes' i la nota és pròpia: mai
     sobre la còpia de prova del Foraster, ni per al Foraster quan les notes
     són remotes (no en té). En seed i local, les notes són del dispositiu i
     qui les pot crear les pot borrar (el mateix criteri que canCreate). El
     diàleg recorda quina nota l'ha obert: si la nota ix del Bloc i l'editor
     passa a una altra, el diàleg no es queda obert damunt de la nova. */
  const notesPropies = !foraster || config?.dataMode === 'seed' || config?.dataMode === 'local';
  const pucBorrar = Boolean(potEsborrar && notesPropies && !esSandbox && !esPreparada && mouNota && esborraNota);
  const [aBorrar, setABorrar] = useState(null);
  const [borrant, setBorrant] = useState(false);
  const obriBorrar = useCallback((doc) => {
    setABorrar(doc?.id ?? null);
    setDialeg('esborrar');
  }, []);
  const triaBorrar = useCallback(async (opcio) => {
    if (!notaEnEdicio || borrant) return;
    setBorrant(true);
    const fet = opcio === 'definitiu'
      ? await esborraNota(notaEnEdicio)
      : await mouNota(notaEnEdicio, opcio);
    setBorrant(false);
    if (fet) setDialeg(null);
  }, [notaEnEdicio, borrant, esborraNota, mouNota]);

  /* T50 (D2) · Qui signa la nota: la barra taronja d'ací i la targeta viva de
     la llista (NotaFitxa) llegixen el mateix helper (autoriaNota.js), també
     amb una entitat activa. La nota de benvinguda (n1) és de Sóc de Poble.
     T65 (decisió del Mestre, 260928: «Editable, signa Sóc de Poble») · I
     també la còpia que en prova el Foraster (autoriaNota) i l'estat buit, que
     pinta el text d'n1: la signa Sóc de Poble, no qui la llig. */
  const idSignatura = notaEnEdicio ? notaEnEdicio.id : ID_NOTA_BENVINGUDA;
  const signatura = useMemo(
    () => autoriaDeNota({ notaId: idSignatura, actor, actorId, agents, currentUser }),
    [idSignatura, actor, actorId, agents, currentUser]
  );

  const notesAdapter = useMemo(() => {
    /* T41 (ordre del Mestre, 260928) · PUBLICAR (i la bola del món) obrin el
       selector de visibilitat: publicar o compartir al Mur només en confirmar.
       Triar «privada» no toca res: una nota sense publicar ja ho és, i una de
       publicada no es pot retirar del Mur (cap mètode al port): bloquejada,
       amb el motiu. publishNote fa els seus toasts de resultat de xarxa. */
    const bloqueig = bloqueigDeNota({
      foraster: foraster || esSandbox,
      modeLocal: config?.dataMode === 'seed' || config?.dataMode === 'local',
      publicada: Boolean(notaEnEdicio?.isPublished),
      /* T71b · el mateix motiu que publishNote en mode compartir. */
      connexio: citaOrigen,
      /* P4 · la nota preparada encara no és al servidor: no hi ha res a
         publicar. Revisió · el motiu segons la creació: buida, en camí o fallida. */
      preparada: esPreparada ? (creacioPreparada?.estat || 'buida') : false,
    });
    const visibilitat = {
      /* D4 · amb els drets reservats de l'original, el selector ho avisa. */
      textos: textosAmbDrets(extern ? TEXTOS_EXTERN : textosDeNota({ connexio }), dretsReservats),
      bloqueig,
      /* La identitat que signa la publicació (MurContext signa amb el mateix
         actor), amb el nom que publishNote hi posarà: mai un correu. */
      comNom: bloqueig?.opcio === 'publica' ? null : (autoria?.nom || null),
      /* publishNote fa un toast i, amb la finestra modal oberta, eixe toast
         queda davall del vel (i fora de l'arbre accessible): el motiu es diu
         també en línia, dins del selector. T47 (ordre del Mestre, 260928) ·
         false és la xarxa (ERROR_PUBLICAR: tornar-ho a provar servix);
         ErrorPublicacio porta el motiu de veres (desat en conflicte, sense
         servidor…), que no es tapa amb «torna-ho a provar». La traducció és
         la de visibilitatNota.js (publicaAmbMotiu), la mateixa del lector. */
      onTria: async (publica, doc) => {
        if (!publica || bloqueig?.opcio === 'publica') return true;
        return publicaAmbMotiu(() => (citaOrigen && compartirNota ? compartirNota : publishNote)(doc));
      },
    };

    return {
      /* Revisió de D4 · per a una connexió, amb els drets de l'original. */
      document: documentPerAlEditor,
      /* P4 · La nota preparada: totes dues vies van al seu canal (la imatge de
         capçalera només arriba per saveRemote); escriure-hi dues vegades el
         mateix valor no crea res de més. Si la creació falla, només el desat
         amb pausa (saveRemote) la torna a provar, no cada tecla. */
      updateLocal: esSandbox ? actualitzaSandbox : esPreparada ? escriuPreparada : setLocalNoteField,
      saveRemote: esSandbox ? undefined : esPreparada ? desaPreparada : saveNoteField,
      visibilitat,
      /* T40 (ordre del Mestre, 260928) · la pastilla de data obri el calendari
         i desa 'publishDate' pel mateix canal que la resta de camps. */
      ambDataPublicacio: true,
      /* Només quan el servidor no la pot guardar: el calendari deixa de dir
         que es desa com la resta i ho explica en línia. */
      avisDataPublicacio: dataNomesAlDispositiu ? AVIS_DATA_DISPOSITIU : null,
      publishLabel: citaOrigen ? t('section.notes.compartir', 'Compartir') : null,
      // UniversalToolbar pinta «Borrar» al costat de «Publicar» només si hi és.
      deleteDocument: pucBorrar ? obriBorrar : undefined,
      uploadMedia: (file) => pujarImatgeDeNota(file, config),
      labels: notaEnEdicio ? etiquetesDeNota(notaEnEdicio, noteFolders, SENSE_PARAMS) : [],
      emptyPlaceholder: t('section.notes.open', 'Obre un solc'),
      emptyDocument,
      classificacio: classificacio ? (
        <BotoneraClassificacio
          carpeta={carpetes.find((c) => c.id === carpetaId)?.nom}
          categories={classificacio.categories}
          etiquetes={classificacio.tags}
          emoticona={notaEnEdicio?.icon || ''}
          onObri={setDialeg}
        />
      ) : null,
      /* T51 (ordre del Mestre, 260928) · L'espai central de la barra taronja:
         el camp CRU de la nota (mai la 🪶 per defecte del model de vista de la
         llista, T34) i l'obertura del diàleg d'emoticona. Sense nota (estat
         buit), cap botó. La data de la còpia de prova del Foraster, que no en
         porta, la posa la closca: la d'ara (barres/dataHoraBarra.js). */
      emoticona: notaEnEdicio?.icon || '',
      onObriEmoticona: notaEnEdicio ? obriEmoticona : null,
      /* T23.1 (ordre del Mestre, 260927 nit) · la «i» d'informació de la barra
         taronja ja no es necessita: el botó d'estat torna a dir el que és
         (cadenat en esborrany, bola del món publicada), i l'editabilitat la
         diu la ploma de la botonera. */
      barAuthorAvatar: signatura.avatar,
      barAuthorName: signatura.nom,
      barAuthorLocation: signatura.poble,
      copyright: '© Sóc de Poble',
      posicioEines: 'davall-entradilla',
      /* T7 (ordre del Mestre, 261004) · Targetes incrustades al cos: l'ordre
         «/» «Targeta». Sempre present (constant): l'esquema no es reconstruïx. */
      targetes,
      /* P4 (ordre del Mestre, 261003; desfà la targeta viva de l'editor de
         T50) · Sense `targetaViva`: ni l'aside de la dreta ni el xip «Vista
         targeta». Ocupava 24rem al costat de l'editor (en un MacBook Air, amb
         les carpetes en rail) i no s'hi podia fer res; l'editor ja mostra com
         queda i la fitxa activa de la llista (NotaFitxa) ja és la targeta
         viva. La closca torna a ser filla directa de la columna del detall. */
      /* T39 (ordre del Mestre, 260928) · La vista de drets d'autor explica
         d'on ve la llicència de sèrie (herència des del Perfil). La còpia de
         prova del Foraster i una nota connectada (obra d'altri) no hereten
         res: sense avís. */
      dretsAutor: foraster || esSandbox || connexio
        ? { ambit: 'neutre' }
        : { ambit: 'publicacio', perDefecte: llicenciaDeLActor({ id: actor?.id ?? actorId, tipus: actor?.tipus, memberships }) },
      /* Revisió de D4 (260930) · Una connexió no es relicencia: la ranura de
         la llicència diu els drets de l'original, de lectura, en lloc del
         botó «Elegir drets d'autor» (DocumentEditor no el pinta si hi ha
         ranura, i la vista de drets no es pot obrir). */
      ...(connexio ? {
        llicencia: (
          <Insignia to="neutre">
            {dretsDeLOriginal
              ? t('section.notes.drets.original', 'Drets de l’original: {drets}').replace('{drets}', () => dretsDeLOriginal)
              : t('section.notes.drets.originalSenseDeclarar', 'L’original no declara drets')}
          </Insignia>
        )
      } : {}),
      ...(estatDesament ? { estatDesament } : {})
    };
  }, [notaEnEdicio, documentPerAlEditor, esSandbox, esPreparada, creacioPreparada, escriuPreparada, desaPreparada, foraster, actor, actorId, autoria, memberships, actualitzaSandbox, setLocalNoteField, saveNoteField, publishNote, compartirNota, connexio, dretsReservats, dretsDeLOriginal, extern, citaOrigen, pucBorrar, obriBorrar, obriEmoticona, noteFolders, t, signatura, emptyDocument, config, classificacio, carpetes, carpetaId, estatDesament, dataNomesAlDispositiu, targetes]);

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
      {/* D4 (excepció del Mestre, 260930) · la connexió és una còpia editable. */}
      {connexio ? (
        <Alerta to="info" titol={t('section.notes.connexio.titol', 'Element connectat')}>
          {t('section.notes.connexio.textEditable', 'Este contingut el signa {autor}. És una còpia teua: el pots editar i el pots canviar de carpeta; compartir-lo el porta al teu Mur citant-ne l’origen i l’autoria.')
            .replace('{autor}', () => notaEnEdicio?.origen?.autorNom || t('section.notes.connexio.altri', 'una altra persona'))}
        </Alerta>
      ) : null}
      {/* D4 · l'original porta els drets reservats: cal saber-ho abans de republicar. */}
      {dretsReservats ? (
        <Alerta to="avis" titol={t('section.notes.drets.titol', TITOL_DRETS_RESERVATS)}>
          {t('section.notes.drets.text', TEXT_DRETS_RESERVATS)}
        </Alerta>
      ) : null}
      {/* T71b · un contingut de fora: és teu i s'edita, però ve d'una altra web. */}
      {extern ? (
        <Alerta to="info" titol={t('section.notes.extern.titol', 'Contingut de fora')}>
          {t('section.notes.extern.text', 'Este contingut de fora és una còpia teua (web d’origen: {lloc}): el pots editar. Compartir-lo el porta al teu Mur citant-ne l’origen, sense cap imatge de l’altra web.')
            .replace('{lloc}', notaEnEdicio?.origen?.lloc || t('section.notes.extern.llocDesconegut', 'desconeguda'))}
        </Alerta>
      ) : null}
      {/* T47b · workspaceKey depén de l'entrada de sessió (NotesDataContext): la
          renovació del JWT que fa SdP ja no remunta l'editor mentre s'escriu.
          La reinjecció de l'amfitrió en mode incrustat encara sí (pendent). */}
      <DocumentEditor key={`${workspaceKey}:${notaEnEdicio?.id || "intro"}`} adapter={notesAdapter} onToast={onToast || showToast} />
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
            // Només la persona superadministradora ho veu, com abans a la barra.
            // T7 (P8) · L'avís es queda; els dos botons desactivats sense funció, no.
            <div className="sdp-classificacio-dialeg__reservat">
              <p className="sdp-classificacio-dialeg__avis">Les categories de sistema i de projecte encara no tenen model de dades: decisió pendent del Mestre.</p>
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
      {dialeg === 'emoticona' && notaEnEdicio ? (
        <DialegEmoticona
          key={`emoticona:${notaEnEdicio.id}`}
          obert
          onTanca={tancaDialeg}
          actual={notaEnEdicio.icon || ''}
          onDesa={desaEmoticona}
        />
      ) : null}
      {dialeg === 'esborrar' && pucBorrar && notaEnEdicio && aBorrar === notaEnEdicio.id ? (
        <DialegEsborrarNota
          key={`esborrar:${notaEnEdicio.id}`}
          obert
          nota={notaEnEdicio}
          onTanca={tancaDialeg}
          onTria={triaBorrar}
          ocupat={borrant}
        />
      ) : null}
    </>
  );
}
