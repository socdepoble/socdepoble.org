import { useIdentitatOReserva } from "../../app/contexts/useIdentitatOReserva.js";
import { imatgeLocalComDataUrl } from '../../utils/imageUtils.js';
import { garantixWebp } from '../../utils/pujadaImatge.js';
import { useCoreContent } from "../../app/contexts/CoreContentContext.jsx";
import { useSession } from "../../app/contexts/SessionContext.jsx";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSandbox } from './useLocalSandbox.js';
import { useNotes, etiquetesDeNota } from './NotesContext';
import { useEstatDesamentNota, estatPerAlEditor } from './useEstatDesamentNota.js';
import { DocumentEditor } from '../../components/universal/DocumentEditor';
import { uploadToStorage, teCapacitat } from '../../data/backendPort.js';
import { NOTE_FOLDERS_SEED } from '../../data/appSeed.js';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { BotoneraClassificacio } from '../../components/universal/classificacio/BotoneraClassificacio.jsx';
import { DialegCarpeta } from '../../components/universal/classificacio/DialegCarpeta.jsx';
import { DialegValors } from '../../components/universal/classificacio/DialegValors.jsx';
import { DialegEmoticona } from '../../components/universal/classificacio/DialegEmoticona.jsx';
import { BlocAmbit } from '../../components/universal/ambits/BlocAmbit.jsx';
import { useCanalAmbit } from '../../components/universal/ambits/canalAmbit.js';
import { ambitPerCanviDeCarpeta, carpetaDeLAmbit } from '../../components/universal/ambits/carpetaAmbit.js';
import { CARPETA_PER_SECCIO } from './masDeLUsuari.js';
import { ESTAT_PER_DEFECTE, coaccionaAmbit, esFitxaDAmbit, etiquetaDAmbit, validaFitxa } from '../../utils/publicacioUniversal.js';
import { DialegEsborrarNota } from './DialegEsborrarNota.jsx';
import { carregaCatalegEmojis, useCanalEmojis } from './canalEmojis.js';
import {
  CATEGORIA_GENERAL, classificacioDe, canvisDeClassificacio, cataleg, usos, reanomena, esborra
} from '../../components/universal/classificacio/model.js';
import { esConnexio, esExtern, netejaDrets, teDretsReservats } from '../../data/origenNota.js';
import {
  TEXT_DRETS_RESERVATS, TITOL_DRETS_RESERVATS, bloqueigDeNota, publicaAmbMotiu, textosAmbDrets, textosDeNota, textosExtern
} from './visibilitatNota.js';
import { nomDeCarpeta } from './carpetes.js';
import { carpetesCreades, creaCarpetaCreada, useCarpetesCreades } from '../../components/universal/classificacio/carpetesCreades.js';
import { Alerta, Insignia } from '../../components/PedraSeca';
import { llicenciaDeLActor } from '../../components/universal/drets/herencia.js';
import { ID_COPIA_PROVA, ID_NOTA_BENVINGUDA, autoriaDeLActor, modeDeDadesResolt, signaturaDeNota } from './autoriaNota.js';
import { TITOL_NOTA_PREPARADA, useNotaPreparadaDelBloc } from './notaPreparada.js';
import { GUIA_NOTA, LLAVORS_NOTA } from './llavorNota.js';
import { NOTA_TUTORIAL } from './notaTutorial.js';
import { proposaCard } from './proposaCard.js';
import { memoriaOralDelBloc } from './memoriaOralDelBloc.js';
import { categoriesBase, etiquetesBase } from '../../data/personalitzacio.js';
import { useMur } from '../mur/MurContext';
import { esAppNativa } from '../../config/origenPublic.js';
import { esPaginaVisible } from '../../config/systemPages.js';
import { cercaEntrades, deActe, dePagina, dePoble, deProducte, dePublicacio, textPla } from '../search/indexCerca.js';
import { rutaDePerfilDAutor } from '../../config/navigation.js';
import { useModeracio } from '../../components/PedraSeca/hooks/moderacioDePoble.js';
import { tradueix } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { omple } from '../../config/moderacio.js';
import { TEXTOS_MODERACIO } from '../../components/PedraSeca/organismes/textosModeracio.js';

/* Constants de mòdul */
const SENSE_PARAMS = {};
const CAP = Object.freeze([]);

/* Revisió del Gauntlet 261017 (ID4) · El text de càrrega de l'espai de
   treball (UniversalWorkspace · DEFAULT_LABELS.loading; NotesSection ·
   TEXT_CARREGANT), mentre la sessió recordada es restaura. */
const TEXT_CARREGANT = ['section.xat.carregant', 'Carregant…'];

/* La nota de benvinguda (n1) és la font del text de l'estat buit.
   IDEA-59 / P1-72 · La mateixa de la Card tutorial de NOTES (notaTutorial.js). */
const NOTA_BENVINGUDA = NOTA_TUTORIAL;

/* Categories i etiquetes que sempre existixen al Bloc (les mateixes que la
   columna de navegació de NotesSection). Com que sempre hi tornen, a la modal
   no es reanomenen ni s'esborren. Onada 11 (261010; prompt 261010_1730,
   tasca 2) · La còpia local s'ha unificat amb classificacioBloc.js, i les
   llistes passen per categoriesBase / etiquetesBase amb la taxonomia del
   poble (useCoreContent().personalitzacio): sense personalització són les
   mateixes llistes de sèrie. */
const CARPETA_PER_DEFECTE = 'f-notes';

const AVIS_CATEGORIA = ["section.notes.editor.avisCategoria", "Cal almenys una categoria. Si vols netejar-les, marca'n una de general, com «{categoria}»."];
/* Carpetes (Onada R6 · Bloc 5) · Crear ja té contracte: creaCarpetaCreada desa la
   carpeta nova al servidor (capacitat carpetesNotes, migració 76) i, si el
   servidor no en té, en este navegador. Reanomenar i esborrar encara no. */
const AVIS_CARPETES = ["section.notes.editor.avisCarpetes", "Les carpetes noves es desen al servidor quan ho permet i, si no, en este navegador. Reanomenar i esborrar carpetes encara no té contracte de dades."];
const AVIS_SENSE_TOTES = ["section.notes.editor.avisSenseTotes", "Reanomenar i esborrar estaran disponibles quan s’hagen carregat totes les notes."];
/* T40 (ordre del Mestre, 260928) · Sense la columna publish_date (D2), la data
   queda en quarantena al dispositiu i publishNote la pren de la nota d'ací:
   des d'un altre dispositiu el Mur no rebria cap data triada i cauria a la de
   creació (created_at). */
const AVIS_DATA_DISPOSITIU = ["section.notes.editor.avisDataDispositiu", "Al servidor encara no hi ha on guardar la data de publicació. Es guarda en este dispositiu i només s’aplica si publiques des d’ací."];

/* Lògica de pujada d'imatges pròpia de Notes.
   Gauntlet 261016 (Bloc 1 i 1.2) · El fitxer que arriba ací (uploadMedia) ja
   ve preparat: la closca (useHeroImageHandler: la foto a la seua mida exacta,
   dins del pressupost i amb l'EXIF que la persona ha triat conservar; el
   logotip) i l'ordre «/» Imatge del cos el comprimixen ABANS de cridar-lo, i
   el camí del servidor (uploadToStorage) el puja tal qual. En seed i local es
   desa també tal qual, com a data URL dels mateixos bytes: abans es tornava a
   comprimir (compressImage sense opcions), i això perdia l'EXIF triat i podia
   traure la foto del pressupost. La validació no canvia. */
async function pujarImatgeDeNota(fitxer, config) {
  if (config?.dataMode === 'seed' || config?.dataMode === 'local') {
    /* Encàrrec 261018 · La validació i la lectura viuen a imageUtils.js (també les fa servir el Perfil). */
    return imatgeLocalComDataUrl(fitxer);
  }
  if (!teCapacitat('mitjans')) return null;
  /* Pla 261022_1645 · A Storage, cap JPEG ni PNG nou (pujadaImatge.js ·
     garantixWebp); un PDF o un WebP passen tal qual. */
  const res = await uploadToStorage(await garantixWebp(fitxer), { carpeta: 'notes', tenantId: config?.tenantId }, config);
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
    /* Auditoria de seguretat 261019 (F14) · L'author_name que força el
       servidor, com la fitxa del producte; el `seller`, només fora d'una
       publicació d'un veí. */
    autor: producte?.ownerUserId != null
      ? textDe(producte?.author_name)
      : textDe(producte?.author_name, producte?.seller),
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
   catàleg) el passava i la persona no veia l'error.
   Gauntlet 261016 (Bloc 3.9; ordre del Mestre: «Eliminar el bloc inferior
   "Ja publicat al Mur" de la vista d'edició») · Fora la prop `seccio` i el peu
   que en feia (PublicacionsDeLActor, Esmena 2 del pla 261007_1645): l'editor
   no porta cap peu, tampoc a Mercat ni a Esdeveniments. P0-25 / IDEA-96
   (Onada R6) · Tampoc la lectura d'una publicació (PublicacioDetall): cap peu
   «Ja publicat al Mur» en tot el Bloc. */
export default function NotesEditor({ activeNote, onToast = null }) {
  const {
    saveNoteField, setLocalNoteField, publishNote, compartirNota, noteFolders, t, config, workspaceKey,
    notes = CAP, notesComplete, mouNota, esborraNota, potEsborrar = false, scopeKey
  } = useNotes();
  // D-7 · Fora d'IdentitatProvider, la reserva anònima de només lectura (useIdentitatOReserva.js).
  const { actorId, actor, memberships } = useIdentitatOReserva();
  const { agents, towns, pages, personalitzacio } = useCoreContent();
  const { currentUser, estat: estatSessio, esSuperadmin = false } = useSession();
  /* P1-20 · D15 (T4a) · El tros de la geo de publishNote (NotesContext) es demana en obrir
     l'editor: en publicar ja hi és i no depén d'una baixada nova. És un import(), no estàtic. */
  useEffect(() => { import('./geoDeLesFotos.js').catch(() => {}); }, []);
  /* Onada 11 · Les llistes de sèrie, ampliades per la taxonomia del poble si n'hi ha. */
  const taxonomia = personalitzacio?.taxonomia?.payload;
  const CATEGORIES_BASE = categoriesBase(taxonomia);
  const ETIQUETES_BASE = etiquetesBase(taxonomia);
  const { showToast } = useToast();
  const mur = useMur();
  /* Fase D (261020, tasca 2) · La porta de les normes de convivència abans de
     publicar (onTria, més avall). Estable: no torna a fer l'adaptador. */
  const { asseguraNormes = null } = useModeracio() ?? {};
  /* Bloc 3.8 del Gauntlet (261016) · El canal de la graella d'emojis del Bloc
     (NotesSection): l'editor s'hi registra per a escriure al cursor, i l'ordre
     «/» Emoji l'obri. Fora del Bloc (sense canal), l'adaptador de sempre. */
  const canalEmojis = useCanalEmojis();
  /* IDEA-61 (T0, prompt 261102_1532) · El canal de l'àmbit del Bloc
     (NotesSection · ?ambit=): l'àmbit pendent que la secció demana obrir, o
     null fora del Bloc. Amb canal, la botonera oferix el grup «Àmbit»; sense
     (el catàleg, una peça sola), el DOM de sempre, tret que la nota ja porte
     una fitxa d'àmbit. */
  const canalAmbit = useCanalAmbit();

  /* T7 · La font de les targetes incrustades (DocumentEditor · targetes). La
     funció és estable: notesAdapter es recalcula amb trenta dependències i
     l'esquema de l'editor es fixa en crear-lo. Les entrades es fan quan es
     busca, no a cada render, i es recorden mentre les fonts no canvien. */
  const fontsTargetes = useRef(null);
  /* Ordre del Mestre (261027) · Dins de l'app nativa, les pàgines només web
     (esPaginaVisible: Descàrregues) no s'oferixen com a targeta. Memoritzat:
     la memòria de la cerca compara les fonts. */
  const paginesDeTargeta = useMemo(() => (Array.isArray(pages)
    ? pages.filter((p) => esPaginaVisible(p?.key ?? p?.slug ?? p?.id, { nativa: esAppNativa() }))
    : pages), [pages]);
  fontsTargetes.current = {
    publicacions: mur.feedPosts, actes: mur.events, productes: mur.marketItems, pobles: towns, pagines: paginesDeTargeta
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
  /* T3.2 (marató 261101) · La fitxa de memòria oral de «🎴 Proposa Card»
     (memoriaOralDelBloc.js): només amb sessió es pot signar la revisió, i el
     fitxer no porta l'identificador del compte (G2-MO-08); coneix els pobles
     de l'aplicació. Només es refà si
     canvien. */
  const idDeLaSessio = currentUser?.id ?? null;
  const memoriaOral = useMemo(() => memoriaOralDelBloc({ persona: idDeLaSessio, pobles: towns }), [idDeLaSessio, towns]);

  /* Estat buit: la mateixa anatomia que la nota de benvinguda, en mode lectura. */
  const emptyDocument = useMemo(() => ({
    title: NOTA_BENVINGUDA.title || t('section.notes.open', 'Obre un solc'),
    subtitle: NOTA_BENVINGUDA.subtitle,
    lead: NOTA_BENVINGUDA.lead,
    heroImage: NOTA_BENVINGUDA.heroImage,
    heroAlt: t("section.notes.editor.portadaAlt", "Una llibreta oberta amb algú escrivint"),
    content: NOTA_BENVINGUDA.content,
    labels: etiquetesDeNota(NOTA_BENVINGUDA, noteFolders, SENSE_PARAMS),
    copyright: NOTA_BENVINGUDA.copyright,
    /* Gauntlet 261030 (cicle 3, traduir-perfil-lectura-fitxa-no-publica) ·
       La nota de benvinguda és text del sistema, públic: Traduir hi continua
       actiu (DocumentEditor · EmptyDocumentPage només el deixa actiu amb la
       marca). Cap text de les notes de la persona no passa per ací. */
    traduccio: true
  }), [noteFolders, t]);

  /* ── Sandbox del Foraster ────────────────────────────────────────────────
     Sense sessió no hi ha notes pròpies, però la persona ha de poder provar
     l'editor (pla 260924_1710 §3.4). Abans calia prémer EDITAR; ara la còpia
     local de la nota de benvinguda s'obri directament: la primera tecla ja
     edita. Els canvis es queden en memòria, res no s'envia.
     Revisió del Gauntlet 261017 (ID4; relleu 3: mai «Foraster» mentre la
     sessió és vàlida) · Mentre una sessió recordada es restaura (estat
     'comprovant' encara sense usuari) no se sap si la persona és el
     Foraster: cap còpia de prova (signada amb el logotip verd) on escriure
     el que després no seria a les seues notes, sinó «Carregant…» (vegeu el
     final), com la càrrega del Bloc (NotesDataContext · sessioResolta).
     `senseSessio` és el criteri de sempre per a tot allò que demana sessió
     (publicar, borrar, heretar drets); `foraster`, la sessió ja resolta sense
     ningú dins. */
  const senseSessio = !currentUser;
  const sessioPendent = senseSessio && estatSessio === 'comprovant';
  const foraster = senseSessio && !sessioPendent;
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
  /* Onada R6 · Bloc 2 (P1-d) · Les carpetes creades en línia persistixen per àmbit
     (scopeKey) i tornen en recarregar: cap nota no apunta a una carpeta fantasma. */
  const carpetesLocals = useCarpetesCreades(scopeKey);
  const carpetes = useMemo(() => {
    const llista = noteFolders?.length ? noteFolders : NOTE_FOLDERS_SEED;
    /* P1-22 · El nom de sèrie en la llengua de l'app (nomDeCarpeta); l'id és el que es desa. */
    const base = llista.filter((f) => String(f.id) !== 'f-tot').map((f) => ({
      id: String(f.id), nom: nomDeCarpeta(f, t), parentId: f.parentId == null ? null : String(f.parentId)
    }));
    const extres = carpetesLocals.filter((extra) => !base.some((c) => c.id === extra.id))
      .map((extra) => ({ id: extra.id, nom: extra.nom, parentId: null }));
    return [...base, ...extres];
  }, [noteFolders, t, carpetesLocals]);
  const classificacio = useMemo(() => (notaEnEdicio ? classificacioDe(notaEnEdicio) : null), [notaEnEdicio]);
  const carpetaId = String(notaEnEdicio?.folderId ?? CARPETA_PER_DEFECTE);
  /* IDEA-61 (T0) · La fitxa d'àmbit de la nota ({ ambit, estat, dades } net,
     o null), coaccionada pel contracte com en llegir una fila del port. */
  const fitxaDeLaNota = notaEnEdicio?.fitxa;
  const fitxaDAmbit = useMemo(() => coaccionaAmbit(fitxaDeLaNota), [fitxaDeLaNota]);
  /* Revisió L2-A4 (IDEA-61) · Una obra d'altri (connexió o contingut de fora)
     es compartix, mai es publica amb fitxa pròpia (NotesContext · publishNote
     la descarta): dins del Bloc no oferix el grup, com l'efecte del canal.
     Amb una fitxa ja desada, sí: es pot vore i llevar.
     O4-CLAUDE-1 · Ni la còpia de prova del Foraster, que no ix del
     dispositiu ni rep mai cap fitxa: sense bloc «On es publica?», sense botó.
     La carpeta i l'àmbit només es sincronitzen en una nota pròpia.
     Correcció A1-04 de l'àrbitre · Un cop el bloc s'ha mostrat per a una nota,
     s'hi queda mentre eixa nota continua oberta: triar «Mur» (fitxa null) en
     una obra d'altri amb fitxa, o fora del Bloc, ja no el desmunta amb el
     focus a dins (cauria a <body> i el lector de pantalla perdria el lloc).
     `blocVist` és l'id d'eixa nota; obrir-ne una altra sense bloc l'oblida.
     Estat derivat en la pintada (com BlocAmbit · vist): cap efecte ni bucle. */
  const ambAmbitPerLaNota = !esSandbox && ((Boolean(canalAmbit) && !citaOrigen) || fitxaDAmbit !== null);
  const idDeLaNota = notaEnEdicio?.id ?? null;
  const [blocVist, setBlocVist] = useState(null);
  const blocVistAra = ambAmbitPerLaNota ? idDeLaNota : (blocVist === idDeLaNota ? blocVist : null);
  if (blocVistAra !== blocVist) setBlocVist(blocVistAra);
  const ambAmbit = ambAmbitPerLaNota || (blocVist !== null && blocVist === idDeLaNota);
  const sincronitzaAmbit = !esSandbox && !citaOrigen;

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

  /* O4-CLAUDE-1 (ordre del Mestre, captura 261102_2121) · La carpeta mana
     l'àmbit en dos casos (carpetaAmbit.js): moure la nota a la carpeta del
     Mercat li posa l'àmbit Mercat, i traure-la'n cap a la del Mur amb l'àmbit
     Mercat la torna al Mur (cap fitxa). En la mateixa escriptura. */
  const assignaCarpeta = useCallback((id) => {
    if (notaEnEdicio && id && id !== carpetaId) {
      const canvis = { folderId: id };
      const ambitNou = sincronitzaAmbit ? ambitPerCanviDeCarpeta({
        ambitActual: fitxaDAmbit?.ambit ?? 'mur', abans: carpetaId, despres: id, carpetaPerSeccio: CARPETA_PER_SECCIO
      }) : null;
      if (ambitNou === 'mur') canvis.fitxa = null;
      else if (ambitNou) canvis.fitxa = { ambit: ambitNou, estat: ESTAT_PER_DEFECTE, dades: {} };
      escriu([{ doc: notaEnEdicio, canvis }]);
    }
  }, [notaEnEdicio, carpetaId, escriu, sincronitzaAmbit, fitxaDAmbit]);
  const desaCarpeta = useCallback((id, nomNou = null) => {
    setDialeg(null);
    /* P1-d (Bloc 5) · Idempotent: una carpeta que ja hi és (de sèrie o creada, també per la
       Botonera, que ja l'ha desada abans de cridar-nos) no es torna a crear. Una de nova es
       crea primer (al servidor si el permet) i la nota pren l'id que torna, mai un id fantasma. */
    const coneguda = carpetes.some((c) => c.id === String(id)) || carpetesCreades(scopeKey).some((c) => c.id === String(id));
    if (!nomNou || coneguda) { assignaCarpeta(id); return; }
    creaCarpetaCreada(scopeKey, nomNou, { existents: carpetes, config })
      .then((carpeta) => { if (carpeta?.id) assignaCarpeta(carpeta.id); })
      .catch(() => { showToast(t('section.notes.carpetes.errorCrear', 'No s’ha pogut crear la carpeta. Torna-ho a provar.'), 'error'); });
  }, [assignaCarpeta, carpetes, scopeKey, config, showToast, t]);

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

  /* IDEA-61 (T0, prompt 261102_1532) · La fitxa d'àmbit és un camp més del
     document (`fitxa`): pel canal de la classificació (nota o nota
     preparada), ja normalitzada pel bloc.
     O4-CLAUDE-1 (ordre del Mestre, captura 261102_2121) · Sense finestra
     modal ni «Desar l'àmbit»: el bloc «On es publica?» en línia (BlocAmbit,
     dins de l'«Edició avançada») crida desaAmbit a cada canvi. Triar un àmbit
     escriu de seguida la seua fitxa i, en una nota pròpia, la carpeta de la
     seua secció (carpetaAmbit.js: el Mercat a la del Mercat; la resta, a la
     del Mur); editar un camp o l'Estat escriu la fitxa normalitzada. Només
     s'escriu el que canvia: cap tecla repetida no torna a la cua. La guarda
     de PUBLICAR (visibilitat.onTria) continua igual.
     `errorsAmbit`: la nota (l'id) on PUBLICAR s'ha aturat per la fitxa; el
     bloc hi mostra els errors sense esperar cap tecla, fins que es tria un
     altre àmbit. */
  const [errorsAmbit, setErrorsAmbit] = useState(null);
  /* Correcció D2-publicacio-5-verticals-02 · La fitxa que arriba ja és neta
     (normalitzaDades descarta, per exemple, «60» habitacions), però el bloc
     continua pintant el valor amb el seu error. `valida` (tercer argument de
     BlocAmbit) diu si les dades que la persona veu passen el contracte; ací
     es guarda amb la nota i la fitxa desada a què correspon, perquè PUBLICAR
     no deixe eixir una fitxa que la pantalla dona per errònia. Obrir una
     altra nota l'oblida: el bloc es remunta amb les dades desades, ja netes. */
  const validesaLocal = useRef(null);
  useEffect(() => { validesaLocal.current = null; }, [idEnEdicio]);
  const desaAmbit = useCallback((fitxa, motiu, valida = true) => {
    if (!notaEnEdicio) return;
    /* Triar «Mur» és la publicació de sempre: cap fitxa (null la lleva, com
       la desa el port), no una fitxa amb àmbit 'mur'. */
    const nova = esFitxaDAmbit(fitxa) ? fitxa : null;
    validesaLocal.current = { id: notaEnEdicio.id, fitxa: JSON.stringify(nova), valida: valida !== false };
    const canvis = {};
    if (JSON.stringify(nova) !== JSON.stringify(notaEnEdicio.fitxa ?? null)) canvis.fitxa = nova;
    if (motiu === 'ambit') {
      setErrorsAmbit(null);
      const desti = sincronitzaAmbit ? carpetaDeLAmbit(fitxa?.ambit, CARPETA_PER_SECCIO) : null;
      if (desti && desti !== carpetaId && carpetes.some((carpeta) => carpeta.id === desti)) canvis.folderId = desti;
    }
    if (Object.keys(canvis).length) escriu([{ doc: notaEnEdicio, canvis }]);
  }, [notaEnEdicio, escriu, sincronitzaAmbit, carpetaId, carpetes]);
  /* O4-CLAUDE-1 · Anar al bloc «On es publica?» ({ nota, enfoca }): l'entrada
     ?ambit= i el botó «Àmbit» de la botonera. La closca obri l'«Edició
     avançada», hi porta la vista i, des del botó, el focus al ràdio triat; en
     acabar ho diu (peticioAmbitAtesa) i la petició s'oblida, perquè un
     remuntatge de l'editor no hi torne. Viu ací, no a la URL: consumir el
     canal ja esborra ?ambit=. */
  const [peticioAmbit, setPeticioAmbit] = useState(null);
  const peticioAmbitAtesa = useCallback((atesa) => setPeticioAmbit((actual) => (actual === atesa ? null : actual)), []);
  const obriClassificacio = useCallback((tipus) => {
    if (tipus === 'ambit') {
      if (idEnEdicio != null) setPeticioAmbit({ nota: idEnEdicio, enfoca: true });
      return;
    }
    setDialeg(tipus);
  }, [idEnEdicio]);

  const tancaDialeg = useCallback(() => setDialeg(null), []);
  /* IDEA-61 · L'entrada des d'una secció (/notes?ambit=vehicle): la nota
     oberta queda amb la fitxa de l'àmbit demanat si encara no en té cap de
     vertical, una vegada per demanda (el canal es consumix; la ref evita
     repetir-ho si el canal no canvia, també sota StrictMode). Mai sobre la
     còpia de prova ni sobre una obra d'altri.
     O4-CLAUDE-1 · En lloc del diàleg, l'«Edició avançada» s'obri sola amb el
     bloc «On es publica?» a la vista. Amb la fitxa nova, la carpeta de la
     seua secció (vehicle, treball, habitatge: la del Mur; el Mercat, la
     seua). La nota preparada la rep sempre a les seues dades, encara que ja
     hi nasca (NotesSection · basePreparada): en consumir el canal la base
     torna a ser la carpeta on és la persona. */
  const canalConsumit = useRef(null);
  useEffect(() => {
    const pendent = canalAmbit?.pendent;
    if (!pendent || !notaEnEdicio || esSandbox || canalConsumit.current === canalAmbit) return;
    canalConsumit.current = canalAmbit;
    /* Correcció D2-publicacio-5-verticals-05 · Amb una obra d'altri oberta
       (la nota destinació, però no apta), el canal es consumix sense escriure
       ni demanar el bloc: pendent, cauria damunt de la primera nota pròpia
       que s'obriga després (fitxa i carpeta que ningú no ha demanat). La
       còpia de prova i la nota nul·la el conserven (T-06). */
    if (citaOrigen) {
      canalAmbit.consumix?.();
      return;
    }
    if (!esFitxaDAmbit(notaEnEdicio.fitxa)) {
      const canvis = { fitxa: { ambit: pendent, estat: ESTAT_PER_DEFECTE, dades: {} } };
      const desti = carpetaDeLAmbit(pendent, CARPETA_PER_SECCIO);
      if (desti && (desti !== carpetaId || esPreparada) && carpetes.some((carpeta) => carpeta.id === desti)) canvis.folderId = desti;
      escriu([{ doc: notaEnEdicio, canvis }]);
    }
    setPeticioAmbit({ nota: notaEnEdicio.id, enfoca: false });
    canalAmbit.consumix?.();
  }, [canalAmbit, notaEnEdicio, esSandbox, citaOrigen, escriu, carpetaId, carpetes, esPreparada]);
  /* Gauntlet 261016 (Bloc 3.9; ordre del Mestre: «eliminar la ploma blanca
     central» de la barra taronja) · El DialegEmoticona (amb la graella del
     catàleg) només s'obri des del quart botó de la botonera, «Emojis XL»,
     dins de l'«Edició avançada»: la barra taronja queda en lectura. */

  /* ── Borrar (paperera, arxiu o definitiu) ────────────────────────────────
     Només si el backend té la capacitat 'cicleNotes' i la nota és pròpia: mai
     sobre la còpia de prova del Foraster, ni per al Foraster quan les notes
     són remotes (no en té). En seed i local, les notes són del dispositiu i
     qui les pot crear les pot borrar (el mateix criteri que canCreate). El
     diàleg recorda quina nota l'ha obert: si la nota ix del Bloc i l'editor
     passa a una altra, el diàleg no es queda obert damunt de la nova. */
  const notesPropies = !senseSessio || config?.dataMode === 'seed' || config?.dataMode === 'local';
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
     pinta el text d'n1: la signa Sóc de Poble, no qui la llig.
     Ordre del Mestre (261007) · La signatura porta també la `ruta` de la
     pàgina de l'autor (signaturaDeNota): la benvinguda, al perfil de Sóc de
     Poble (Onada 8, 261009; abans, a /projecte).
     Gauntlet 261016 (Bloc 3.9; ordre del Mestre: prohibit «Foraster») · Amb
     el mode de dades del Bloc: sense sessió en seed o local, i amb la sessió
     de la persona pilot, signa Javi Llinares i porta a la seua fitxa.
     Correcció de la revisió (261016) · El mode RESOLT (modeDeDadesResolt),
     no el cru: un paquet seed que ja ha triat l'entrada real treballa en
     remot, i sense sessió hi signa «Veí». */
  const idSignatura = notaEnEdicio ? notaEnEdicio.id : ID_NOTA_BENVINGUDA;
  const dataMode = useMemo(() => modeDeDadesResolt(config), [config]);
  const signatura = useMemo(
    () => signaturaDeNota({ notaId: idSignatura, actor, actorId, agents, currentUser, dataMode }),
    [idSignatura, actor, actorId, agents, currentUser, dataMode]
  );
  /* IDEA-61 (T0) · El que veu la previsualització del bloc d'àmbit (O4-CLAUDE-1: en línia): els
     textos plans de la nota (el títol pot portar HTML) i la signatura de la
     barra taronja (mai «Sóc de Poble» per defecte). */
  const documentDePrevisualitzacio = useMemo(() => (notaEnEdicio ? {
    title: textDe(notaEnEdicio.title), subtitle: textDe(notaEnEdicio.subtitle), lead: textDe(notaEnEdicio.lead),
    heroImage: notaEnEdicio.heroImage || undefined,
    authorName: signatura.nom || null, authorAvatar: signatura.avatar || null, authorLocation: signatura.poble || null
  } : null), [notaEnEdicio, signatura]);

  const notesAdapter = useMemo(() => {
    /* T41 (ordre del Mestre, 260928) · PUBLICAR (i la bola del món) obrin el
       selector de visibilitat: publicar o compartir al Mur només en confirmar.
       Triar «privada» no toca res: una nota sense publicar ja ho és, i una de
       publicada no es pot retirar del Mur (cap mètode al port): bloquejada,
       amb el motiu. publishNote fa els seus toasts de resultat de xarxa. */
    const bloqueig = bloqueigDeNota({
      foraster: senseSessio || esSandbox,
      modeLocal: config?.dataMode === 'seed' || config?.dataMode === 'local',
      publicada: Boolean(notaEnEdicio?.isPublished),
      /* T71b · el mateix motiu que publishNote en mode compartir. */
      connexio: citaOrigen,
      /* P4 · la nota preparada encara no és al servidor: no hi ha res a
         publicar. Revisió · el motiu segons la creació: buida, en camí o fallida. */
      preparada: esPreparada ? (creacioPreparada?.estat || 'buida') : false,
      /* P1-22 · els motius en la llengua de l'app. */
      t,
    });
    const visibilitat = {
      /* D4 · amb els drets reservats de l'original, el selector ho avisa. */
      textos: textosAmbDrets(extern ? textosExtern(t) : textosDeNota({ connexio, t }), dretsReservats, t),
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
        /* IDEA-61 (T0, prompt 261102_1532) · Una fitxa d'àmbit vertical
           incompleta no ix al Mur: el motiu, en línia, al selector
           (SelectorVisibilitat pinta el missatge de l'error que llança onTria). */
        const fitxa = doc?.fitxa;
        /* Correcció D2-publicacio-5-verticals-02 · També quan la fitxa desada
           és neta però el bloc pinta un valor que el contracte no admet. */
        const local = validesaLocal.current;
        const invalidaEnElBloc = local !== null && local.id === doc?.id && local.fitxa === JSON.stringify(fitxa ?? null) && !local.valida;
        if (esFitxaDAmbit(fitxa) && (!validaFitxa(fitxa.ambit, fitxa.dades).ok || invalidaEnElBloc)) {
          /* O4-CLAUDE-1 · I el bloc «On es publica?» ja mostra què falta.
             Correcció A1-03 de l'àrbitre · L'«Edició avançada» pot estar
             plegada (un remuntatge no la recorda): la closca l'obri i hi porta
             la vista, una sola vegada i sense robar el focus al selector. */
          setErrorsAmbit(doc?.id ?? null);
          if (doc?.id != null) setPeticioAmbit({ nota: doc.id, enfoca: false });
          throw new Error(omple(t('editor.ambit.errorPublicar', 'La fitxa de «{ambit}» no està completa.'), { ambit: etiquetaDAmbit(fitxa.ambit, t) }));
        }
        /* Fase D (261020, tasca 2; pla 261020_1300 · Google Play UGC) · Abans
           de la primera publicació, les normes de convivència
           (ModeracioContext · asseguraNormes, estable). Declinar deixa el
           selector obert i diu per què, en línia (crítica 261020, 10). Ací
           s'hi podrà endollar el filtre previ que demana Apple 1.2. */
        if (asseguraNormes && !(await asseguraNormes())) throw new Error(tradueix(t, TEXTOS_MODERACIO.calAcceptar));
        /* Integració 261024 (Codex C-02) · Si el servidor la rebutja igualment
           per les normes (SDP-MOD-428), la porta es torna a obrir i, si les
           accepta, es publica una sola vegada més (publicaAmbMotiu). */
        return publicaAmbMotiu(() => (citaOrigen && compartirNota ? compartirNota : publishNote)(doc), {
          tornaAPreguntar: asseguraNormes ? () => asseguraNormes({ rebutjades: true }) : null,
          /* P1-22 · amb `t`, el motiu de les normes i el de la xarxa ixen traduïts. */
          t
        });
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
      avisDataPublicacio: dataNomesAlDispositiu ? tradueix(t, AVIS_DATA_DISPOSITIU) : null,
      publishLabel: citaOrigen ? t('section.notes.compartir', 'Compartir') : null,
      // UniversalToolbar pinta «Borrar» al costat de «Publicar» només si hi és.
      deleteDocument: pucBorrar ? obriBorrar : undefined,
      uploadMedia: (file) => pujarImatgeDeNota(file, config),
      labels: notaEnEdicio ? etiquetesDeNota(notaEnEdicio, noteFolders, SENSE_PARAMS) : [],
      emptyPlaceholder: t('section.notes.open', 'Obre un solc'),
      emptyDocument,
      /* Gauntlet 261016 (Bloc 3.9; ordre del Mestre) · El placeholder de l'H1
         és exactament el títol de la targeta: «Nota sense títol». */
      placeholderTitol: TITOL_NOTA_PREPARADA,
      /* Bloc 3.9 · Les metadades (capçalera, logotip, botonera, drets i
         vistes) van a l'«Edició avançada», plegada.
         AH-03 · Situada just davall de la Barra Taronja ('despres-autoria'),
         deixant net el flux d'escriptura H1 → H2 → Lead → Eines → Cos. */
      edicioAvancada: true,
      posicioEdicioAvancada: 'despres-autoria',
      titolEdicioAvancada: t('section.notes.editor.edicioAvancada.titol', 'Edició avançada de la nota'),
      resumEdicioAvancada: t('section.notes.editor.edicioAvancada.resum', 'Afig la foto de capçalera, el logotip, l’àmbit de publicació, etiquetes i drets'),
      showDarkLogoUpload: true,
      /* P1-64 (pla 261028_1526 §3.1.1; Mestre 261028, decisió 8) · El cos d'una
         publicació: l'ordre «/» Imatge pregunta si es conserven la ubicació i la
         data de la foto (DocumentEditor · fotosDePublicacio). El Perfil no. */
      fotosDePublicacio: true,
      /* IDEA-41 (Llibre Mestre; Mestre 261028, Bloc H) · «🎴 Proposa Card» a la
         barra d'eines: el títol, el subtítol i l'entradilla des de les primeres
         línies del cos, sense IA (proposaCard.js). Pel canal de cada nota (la
         pròpia, la còpia de prova i la preparada), com la resta de camps; el
         Perfil no el porta. Constant: l'adaptador no es refà. Revisió
         adversarial 261028 · Una connexió o un contingut de fora (citaOrigen)
         no el porten: el seu cos comença amb el text del sistema (la
         presentació de l'original, «Connectat per a llegir-lo més tard.»,
         «Font: …»), que pujat als camps perdria l'enllaç i eixiria al Mur per
         l'entradilla, sense el filtre dels paràgrafs privats (connexions.js). */
      proposaCard: citaOrigen ? null : proposaCard,
      /* T3.2 (marató 261101) · I, en el mateix clic, la «Fitxa de memòria
         oral (OKF v0.2)» de la nota, local i sense xarxa (DocumentEditor ·
         memoriaOral). Les mateixes notes que porten el botó. */
      memoriaOral: citaOrigen ? null : memoriaOral,
      /* Bloc 3.9 · La plantilla de format d'ara i la d'abans: totes dues
         s'esvaeixen al primer focus del cos (llavorNota.js). IDEA-59 / P1-72 ·
         Ja no naix cap nota amb elles: només les porten notes velles. */
      seedContent: LLAVORS_NOTA,
      /* IDEA-59 / P1-72 (Mestre 261101, punt 1) · El cartell guia reversible
         del cos buit: s'amaga en punxar, torna si s'ix sense escriure i no
         torna en una nota on s'ha escrit. No es desa ni es publica. */
      guiaCos: GUIA_NOTA,
      classificacio: classificacio ? (
        <BotoneraClassificacio
          carpeta={carpetes.find((c) => c.id === carpetaId)?.nom}
          categories={classificacio.categories}
          etiquetes={classificacio.tags}
          emoticona={notaEnEdicio?.icon || ''}
          etiquetaEmoticona={t("section.notes.editor.emojis", "Emojis XL")}
          enLinia={{
            carpetaId,
            carpetes,
            onCanviaCarpeta: desaCarpeta,
            ambitCarpetes: scopeKey,
            configCarpetes: config,
            catalegCategories: cataleg(documents, 'categories', CATEGORIES_BASE),
            onCanviaCategories: (valors) => desaValors('categories', valors),
            categoriaGeneral: CATEGORIA_GENERAL,
            catalegEtiquetes: cataleg(documents, 'tags', ETIQUETES_BASE),
            onCanviaEtiquetes: (valors) => desaValors('tags', valors),
          }}
          onObri={obriClassificacio}
        />
      ) : null,
      /* O4-CLAUDE-1 (ordre del Mestre, captura 261102_2121) · «On es
         publica?» en línia, dins de l'«Edició avançada», entre el logotip i
         la classificació (la ranura de la closca): els mateixos casos que el
         grup «Àmbit» de la botonera. La previsualització signa com la barra
         taronja. La petició d'anar-hi, només per a la nota que l'ha feta. */
      ambitEdicioAvancada: notaEnEdicio && classificacio && ambAmbit ? (
        <BlocAmbit
          key={`ambit:${notaEnEdicio.id}`}
          valor={fitxaDAmbit}
          document={documentDePrevisualitzacio}
          onCanvia={desaAmbit}
          mostraErrors={errorsAmbit != null && errorsAmbit === notaEnEdicio.id}
          t={t}
        />
      ) : null,
      peticioAmbit: notaEnEdicio && ambAmbit && peticioAmbit?.nota === notaEnEdicio.id ? peticioAmbit : null,
      onPeticioAmbitAtesa: peticioAmbitAtesa,
      /* T51 (ordre del Mestre, 260928) · L'espai central de la barra taronja:
         el camp CRU de la nota (mai la 🪶 per defecte del model de vista de la
         llista, T34). La data de la còpia de prova del Foraster, que no en
         porta, la posa la closca: la d'ara (barres/dataHoraBarra.js).
         Gauntlet 261016 (Bloc 3.9; ordre del Mestre: «eliminar la ploma
         blanca central») · Sempre en lectura: cap onObriEmoticona, i l'espai
         central pinta l'emoticona triada o la cel·la buida. El Perfil
         conserva el seu botó. */
      emoticona: notaEnEdicio?.icon || '',
      onObriEmoticona: null,
      /* T23.1 (ordre del Mestre, 260927 nit) · la «i» d'informació de la barra
         taronja ja no es necessita: el botó d'estat torna a dir el que és
         (cadenat en esborrany, bola del món publicada), i l'editabilitat la
         diu la ploma de la botonera. */
      barAuthorAvatar: signatura.avatar,
      barAuthorName: signatura.nom,
      barAuthorLocation: signatura.poble,
      /* Ordre del Mestre (261007) · L'autoria de la barra taronja porta a la
         pàgina de qui signa, també a l'estat buit (la benvinguda). */
      barAuthorHref: signatura.ruta,
      copyright: NOTA_BENVINGUDA.copyright,
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
      dretsAutor: senseSessio || esSandbox || connexio
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
      ...(estatDesament ? { estatDesament } : {}),
      /* Bloc 3.8 (261016) · Inserir al cursor (la icona «Emojis» de NOTES) i
         l'ordre «/» Emoji. Totes dues funcions són estables (canalEmojis.js). */
      ...(canalEmojis ? { registraInsercio: canalEmojis.registra, obreEmojis: canalEmojis.obri } : {})
    };
  }, [notaEnEdicio, documentPerAlEditor, esSandbox, esPreparada, creacioPreparada, escriuPreparada, desaPreparada, senseSessio, actor, actorId, autoria, memberships, actualitzaSandbox, setLocalNoteField, saveNoteField, publishNote, compartirNota, connexio, dretsReservats, dretsDeLOriginal, extern, citaOrigen, pucBorrar, obriBorrar, noteFolders, t, signatura, emptyDocument, config, classificacio, carpetes, carpetaId, desaCarpeta, desaValors, documents, CATEGORIES_BASE, ETIQUETES_BASE, estatDesament, dataNomesAlDispositiu, targetes, canalEmojis, asseguraNormes, memoriaOral, ambAmbit, fitxaDAmbit, obriClassificacio, documentDePrevisualitzacio, desaAmbit, errorsAmbit, peticioAmbit, peticioAmbitAtesa, scopeKey]);

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
    avisGlobal: tradueix(t, AVIS_SENSE_TOTES)
  });

  /* Revisió del Gauntlet 261017 (ID4) · Sense cap nota oberta i amb la
     sessió encara en restauració, l'estat de càrrega de l'espai de treball
     (UniversalWorkspace · DEFAULT_LABELS.loading, el mateix «Carregant…»),
     no la còpia de prova del Foraster ni l'estat buit signat per Sóc de
     Poble. Després de tots els ganxos: l'ordre no canvia entre pintades. */
  if (sessioPendent && !notaEnEdicio) {
    return <p role="status">{tradueix(t, TEXT_CARREGANT)}</p>;
  }

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
          avis={tradueix(t, AVIS_CARPETES)}
        />
      ) : null}
      {dialeg === 'categories' && notaEnEdicio ? (
        <DialegValors
          key={`categories:${notaEnEdicio.id}`}
          {...propsValors('categories')}
          titol={t("section.notes.editor.categories", "Categories de la nota")}
          etiquetaNou={t("section.notes.editor.novaCategoria", "Nova categoria")}
          minim={1}
          avisMinim={omple(tradueix(t, AVIS_CATEGORIA), { categoria: CATEGORIA_GENERAL })}
          extra={esSuperadmin ? (
            // Només la persona superadministradora ho veu, com abans a la barra.
            // T7 (P8) · L'avís es queda; els dos botons desactivats sense funció, no.
            <div className="sdp-classificacio-dialeg__reservat">
              <p className="sdp-classificacio-dialeg__avis">{t("section.notes.editor.avisCategories", "Les categories de sistema i de projecte encara no tenen model de dades: decisió pendent del Mestre.")}</p>
            </div>
          ) : null}
        />
      ) : null}
      {dialeg === 'etiquetes' && notaEnEdicio ? (
        <DialegValors
          key={`etiquetes:${notaEnEdicio.id}`}
          {...propsValors('tags')}
          titol={t("section.notes.editor.etiquetes", "Etiquetes de la nota")}
          etiquetaNou={t("section.notes.editor.novaEtiqueta", "Nova etiqueta")}
          minim={0}
        />
      ) : null}
      {/* Bloc 3.8 (261016) · La graella del catàleg Emojis XL en lloc de la
          drecera de teclat de l'OS: un clic assigna l'emoticona a la nota
          (desaEmoticona, pel canal de sempre: nota, còpia de prova o nota
          preparada) i tanca. Les dades, a demanda. */}
      {dialeg === 'emoticona' && notaEnEdicio ? (
        <DialegEmoticona
          key={`emoticona:${notaEnEdicio.id}`}
          obert
          onTanca={tancaDialeg}
          actual={notaEnEdicio.icon || ''}
          onDesa={desaEmoticona}
          carregaCataleg={carregaCatalegEmojis}
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
