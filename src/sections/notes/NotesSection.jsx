import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { NotebookPen, Folder } from 'lucide-react';
import { useSearchParams } from '../../app/contexts/RouterContext';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { useNotes, etiquetesDeNota } from './NotesContext';
import { useMur } from '../mur/MurContext';
import { useMultimedia } from '../multimedia/MultimediaContext.jsx';
import { UniversalWorkspace } from '../../components/universal/workspace/UniversalWorkspace';
import NotesDetail from './NotesDetail.jsx';
import { useNotesData } from './NotesDataContext.jsx';
import { NotaFitxa } from './NotaFitxa.jsx';
import { ConnexioFitxa } from './ConnexioFitxa.jsx';
import { PublicacioDetall, PublicacioFitxa } from './PublicacioDetall.jsx';
import { esConnexio, esExtern } from '../../data/origenNota.js';
import { extractPlainText } from '../../utils/contentAdapter.js';
import { EMOTICONA_PER_DEFECTE, emojiInicial } from '../../utils/emoji.js';
import { aliesDeLActor } from '../../data/identitatsSeed.js';
import { TEXTOS_LLAVOR } from '../../components/universal/textosLlavor.js';
import { iconaDeCarpeta, opcionsDeCarpetes } from './carpetes.js';
import { escriuSeleccio, llegixSeleccio } from '../../components/universal/workspace/seleccioUrl.js';
import { ALL_CATEGORY_ID } from '../../components/universal/workspace/workspaceState.js';
import { CARPETA_ALTRES, CARPETA_PER_SECCIO, esIdDePublicacio, itemsPublicatsDe, seccioDeCarpeta, seccioDePublicacio } from './masDeLUsuari.js';
import { llicenciaDeLActor } from '../../components/universal/drets/herencia.js';
import { LLICENCIA_PER_DEFECTE } from '../../components/universal/drets/llicencies.js';
import { CATEGORIES_BASE, ETIQUETES_BASE } from './classificacioBloc.js';
import { CLAUS_BLOC, carpetaDeDesa, esModeDesa, escriuDesa, paramsDeLaNota } from './modeDesa.js';
import { SnippetCurador } from './SnippetCurador.jsx';
import { NotaPreparadaContext, TITOL_NOTA_PREPARADA, useNotaPreparada } from './notaPreparada.js';
import { reglaDEntrada } from '../connectar/contingutExtern.js';

/* Pell del Bloc de Notes: tot allò que el UniversalWorkspace no ha de saber. */
const ETIQUETES = { categories: 'CARPETES', items: 'NOTES', create: 'CREAR NOTA', search: 'Cercar notes', empty: 'No hi ha notes.' };
/* P4 · Només sense sessió i amb dades remotes (reglaDEntrada). */
const TEXT_CAL_ENTRAR = 'Connecta per veure les teues notes.';
const ICONES = { categories: Folder, items: NotebookPen };
const CAP = Object.freeze([]);
/* T7 (P9) · A la URL del Bloc l'element es diu «nota» (?carpeta=&nota=&seccio=).
   T7C · La clau viu a modeDesa.js: el Snippet Curador l'escriu en eixir. */
const CLAUS_URL = CLAUS_BLOC;
/* T7 (P3) · En «ample», la columna de carpetes arrenca plegada en rail. */
const COLUMNES_INICIALS = Object.freeze({ left: true });
/* F4 (bloquejant de Codex, relleus 16, 17 i 21 de l'auditoria 261004_2240) ·
   Les fonts de les publicacions del MAS: el Mur porta Mur, Mercat i agenda
   (MurContext) i Multimèdia, els mitjans (MultimediaContext). Totes dues
   exposen [] fora de 'ready' (useScopedResource torna a 'loading' amb cada
   recàrrega). 'revalidating' encara no l'emet cap font: es llig si arriba.
   Un estat absent (una font sense eixa informació) compta com a llest. */
const ESTATS_PENDENTS = new Set(['loading', 'revalidating', 'error']);
const FONT_DE_SECCIO = Object.freeze({ mur: 'mur', mercat: 'mur', events: 'mur', multimedia: 'multimedia' });
const fontDe = (fonts, seccio) => (seccio == null ? null : fonts[FONT_DE_SECCIO[seccio]] ?? null);
/* Els mateixos textos que l'espai de treball pinta quan carrega o falla
   (UniversalWorkspace · DEFAULT_LABELS.loading i .error). */
const TEXT_CARREGANT = 'Carregant…';
const TEXT_ERROR_FONT = 'No s’han pogut carregar les dades.';

const toWorkspaceNote = (note, noteFolders) => {
  const isSeedContent = note.content === LLAVOR_NOTA || (note.plainText && note.plainText.startsWith('Heading 3 (punxa'));
  const title = extractPlainText(note.title || '', Infinity) || TEXTOS_LLAVOR.titol;
  /* T71 · una connexió es pinta a la llista amb ConnexioFitxa (la fitxa
     compacta amb l'autoria de l'original); el contingut de fora (origen
     'extern') és un clon teu i s'edita com una nota. D4 (260930) · la
     connexió també s'edita (NotesDetail l'obri amb NotesEditor). */
  const connexio = esConnexio(note);
  /* Una nota sense carpeta és a «Altres notes» (CARPETA_ALTRES, la mateixa
     de sèrie que l'editor: NotesEditor · CARPETA_PER_DEFECTE). */
  const carpeta = String(note.folderId ?? CARPETA_ALTRES);
  /* F4 (ordre del Mestre, 261004; PRD de la Marató 2230, D2) · Una nota
     publicada al Mur és una sola peça: la nota editable, que també és a la
     carpeta «Mur» del MAS (la publicació virtual no s'emet: itemsPublicatsDe).
     Només al model de vista: la dada no es toca. La seua carpeta va primer,
     perquè una URL sense ?carpeta= hi torne (WorkspaceContext · reconciliació). */
  const carpetaMur = CARPETA_PER_SECCIO.mur;
  const tambeAlMur = Boolean(note.isPublished && note.publishedSubmissionId) && carpeta !== carpetaMur;
  return {
    id: String(note.id),
    categoryIds: [
      carpeta,
      ...(tambeAlMur ? [carpetaMur] : []),
      ...(note.categories || []).map(c => `cat_${c}`),
      ...(note.tags || []).map(t => `tag_${t}`)
    ],
    kind: connexio ? 'connexio' : 'note',
    title,
    subtitle: note.formattedDate,
    excerpt: extractPlainText(note.subtitle || note.lead || '', Infinity) || (!isSeedContent ? note.plainText || '' : ''),
    image: note.coverImage || note.heroImage || '',
    /* T23 · l'emoticona triada per la persona (glif propi: ItemMedia i el
       rail la pinten abans que l'emoji del títol o la icona de carpeta).
       T34 · sense emoticona ni emoji al títol, la ploma en lloc de la icona
       de la carpeta. Només al model de vista: la dada `icon` no es toca.
       T71 · una connexió no porta la ploma per defecte (sense emoticona, la
       llista i el rail pinten el glif de la carpeta). Revisió de D4
       (260930) · però és editable: l'emoticona que s'hi tria mana, a la
       llista i al rail, com al contingut de fora, que tampoc porta la ploma
       per defecte i es distingix per la icona de la carpeta. */
    icon: connexio ? (note.icon || undefined)
      : note.icon || (esExtern(note) || emojiInicial(title) ? undefined : EMOTICONA_PER_DEFECTE),
    tags: note.tags || [],
    labels: etiquetesDeNota(note, noteFolders),
    searchText: note.searchText,
    revision: note.revision,
    updatedAt: note.updatedAt,
    data: note
  };
};

/* Una nota s'edita; una publicació pròpia (T1) i una connexió (T71) es llegixen. */
const renderNota = ({ item, active, onSelect }) => {
  if (item?.kind === 'publicacio') return <PublicacioFitxa item={item} active={active} onSelect={onSelect} />;
  if (item?.kind === 'connexio') return <ConnexioFitxa item={item} active={active} onSelect={onSelect} />;
  return <NotaFitxa item={item} active={active} onSelect={onSelect} />;
};
const renderDetall = ({ item }) => (
  item?.kind === 'publicacio'
    ? <PublicacioDetall item={item} />
    : <NotesDetail activeNote={item?.data} />
);

/* Llavor del cos d'una nota nova. Inclou Heading 3, 4, 5 i 6 perquè
   la persona veja la jerarquia, i un text indicant com esborrar-ho tot en fer clic. */
export const LLAVOR_NOTA = `
<h3>Heading 3 (punxa ací per esborrar-ho tot)</h3>
<p>Aquest és un paràgraf de prova sota un Heading 3.</p>
<h4>Heading 4</h4>
<p>Aquest és un paràgraf de prova sota un Heading 4.</p>
<h5>Heading 5</h5>
<p>Aquest és un paràgraf de prova sota un Heading 5.</p>
<h6>Heading 6</h6>
<p>Aquest és un paràgraf de prova sota un Heading 6.</p>
`.trim();

/* L'entrada d'una nota nova segons on és la persona, la que CREAR NOTA
   enviava des de T39: una categoria o una etiqueta la porten; una carpeta,
   el folderId; «Tot», la llavor del cos. */
function entradaDeNotaNova(categoriaId, categoria) {
  if (categoria?.groupId === 'categories') return { categories: [categoria.label] };
  if (categoria?.groupId === 'tags') return { tags: [categoria.label] };
  if (categoriaId != null && categoriaId !== ALL_CATEGORY_ID) return { folderId: categoriaId };
  return { content: LLAVOR_NOTA };
}

/* El grup d'una entrada de la navegació: categoria, etiqueta o (null) carpeta. */
function grupDe(id, categories, etiquetes) {
  const categoria = categories.find((opcio) => opcio.id === id);
  if (categoria) return { groupId: 'categories', label: categoria.label };
  const etiqueta = etiquetes.find((opcio) => opcio.id === id);
  return etiqueta ? { groupId: 'tags', label: etiqueta.label } : null;
}

export default function NotesSection() {
  const { activate, config } = useNotesData();
  useEffect(() => activate(), [activate]);
  const notesContextValue = useNotes();
  /* T1 · el MAS també ensenya el que l'actor ha publicat, per carpeta.
     T39 · `memberships` porta el copyright de les entitats (herència). */
  const { actor, memberships } = useIdentitat();
  const {
    sortedFeedPosts = CAP, sortedMarketItems = CAP, sortedEvents = CAP, status: estatMur, error: errorMur, refresh: refrescaMur
  } = useMur();
  /* F4 (ordre del Mestre, 261004; PRD de la Marató 2230, Fase 1) · També els
     mitjans de l'actor, a «Multimèdia». Ja passen pel port (MultimediaContext ·
     loadMultimedia): cap petició nova. Sense proveïdor, cap mitjà. */
  const { mediaItems = CAP, status: estatMultimedia, error: errorMultimedia, refresh: refrescaMultimedia } = useMultimedia();
  /* F4 (bloquejant de Codex) · L'estat de cada font, sobre valors primitius:
     el valor de reserva dels contextos sense proveïdor és un objecte nou a
     cada crida, i la resolució per ID no s'ha de refer a cada pintada.
     Revisió de F4 (ronda 1, I1) · I l'error de cada font. useScopedResource
     en guarda el rebuig capturat, un objecte nou a cada fallada
     (useScopedResource.js:28), i MurContext i MultimediaContext l'exposen tal
     qual. Si una recàrrega passa d'error a error sense que el Bloc pinte cap
     'loading' entremig (el rebuig arriba abans de la pintada), l'estat
     primitiu no canvia: sense l'error, la font era la mateixa, la clau de
     petició de l'espai de treball (requestKey) també, i el detall es quedava
     en «Carregant…» per sempre. Límit: una font que rebutjara dues vegades
     amb la mateixa instància d'error encara no canviaria res. */
  const fontsDelMas = useMemo(() => ({
    mur: { status: estatMur, error: errorMur, refresh: refrescaMur },
    multimedia: { status: estatMultimedia, error: errorMultimedia, refresh: refrescaMultimedia }
  }), [estatMur, errorMur, refrescaMur, estatMultimedia, errorMultimedia, refrescaMultimedia]);
  const alies = useMemo(() => aliesDeLActor(actor, { dataMode: config?.dataMode }), [actor, config?.dataMode]);
  const {
    status, error, notes, noteFolders, creaNota, setLocalNoteField, updateNote,
    informaError, obriConfiguracioNotes, refresh, canCreate, teSessio = false,
    notesComplete, resolveNote, workspaceKey
  } = notesContextValue || {
    status: 'error', error: new Error('NotesContext no disponible'), notes: [], noteFolders: []
  };
  /* F4 (D2) · Les publicacions del Mur nascudes d'una nota pròpia: la peça és
     la nota (toWorkspaceNote la posa també a «Mur»), no una còpia de lectura.
     Poliment de F4 (revisió de la Marató 2230) · Cada tecla porta un array de
     notes nou: el Set es memoritza sobre una clau de text (els ids ordenats,
     en JSON perquè cap id es confonga amb el separador), i les publicacions
     només es refan quan es publica o es despublica una nota. Així els seus
     objectes conserven la identitat entre edicions. */
  const clauPublicades = useMemo(() => JSON.stringify(notes
    .filter((nota) => nota.isPublished && nota.publishedSubmissionId)
    .map((nota) => String(nota.publishedSubmissionId))
    .sort()), [notes]);
  const publicadesDesDeNotes = useMemo(() => new Set(JSON.parse(clauPublicades)), [clauPublicades]);
  const publicacions = useMemo(
    () => itemsPublicatsDe(
      { feedPosts: sortedFeedPosts, marketItems: sortedMarketItems, events: sortedEvents, mediaItems },
      alies, { publicadesDesDeNotes }
    ),
    [sortedFeedPosts, sortedMarketItems, sortedEvents, mediaItems, alies, publicadesDesDeNotes]
  );
  const [params, setParams] = useSearchParams();
  /* T7C (P1) · ?mode=desa obri el Snippet Curador (modeDesa.js): el mateix
     espai de treball en mode compacte, sense cap ruta nova. */
  const modeDesa = esModeDesa(params);
  /* P4 (ordre del Mestre, 261003) · Una sola regla per a la sessió, la de
     Connectar i el Snippet Curador (reglaDEntrada): sense sessió i amb dades
     remotes, «Connecta…» i cap botó de crear. Abans ho decidia canCreate, que
     també és fals mentre es carrega i llig el mode de dades sense normalitzar:
     el botó desapareixia en cada càrrega i, amb el mode local de la política
     de compilació, eixia «Connecta…» damunt de notes que es podien crear. */
  const { calEntrar } = useMemo(() => reglaDEntrada({ teSessio, config, canCreate }), [teSessio, config, canCreate]);
  const ambPreparada = !modeDesa && !calEntrar;

  const allCategories = useMemo(() => {
    const cats = new Set(CATEGORIES_BASE);
    notes.forEach(n => (n.categories || []).forEach(c => cats.add(c)));
    return Array.from(cats).sort().map(c => ({ id: `cat_${c}`, label: c }));
  }, [notes]);

  const allTags = useMemo(() => {
    const tags = new Set(ETIQUETES_BASE);
    notes.forEach(n => (n.tags || []).forEach(t => tags.add(t)));
    return Array.from(tags).sort().map(t => ({ id: `tag_${t}`, label: t }));
  }, [notes]);

  // Sense sessió o amb el backend apagat l'adaptador torna [] de carpetes:
  // pintem el catàleg de carpetes de sèrie perquè la vista siga sempre completa.
  // T7 (P5) · amb el parentId de cada carpeta: l'arbre niat ja el pinta el Workspace.
  const carpetes = useMemo(() => opcionsDeCarpetes(noteFolders), [noteFolders]);
  /* Totes les entrades de la navegació (carpetes, categories i etiquetes):
     la nota preparada hi pertany (itemPreparadaBase) i, des de la revisió de
     F4 (R6c), són les que l'espai de treball reconeix en una ?carpeta=. */
  const idsDeNavegacio = useMemo(
    () => [...carpetes.map((carpeta) => String(carpeta.id)), ...allCategories.map((opcio) => opcio.id), ...allTags.map((opcio) => opcio.id)],
    [carpetes, allCategories, allTags]
  );

  /* T7 (P9) · La URL porta la carpeta i la nota (seleccioUrl.js): un enllaç
     copiat obri la mateixa carpeta amb la mateixa nota. La secció (?seccio=)
     l'escriu l'Índex de la pàgina; canviar de nota l'oblida. */
  const enUrl = llegixSeleccio(params, CLAUS_URL);

  /* ── F4 (bloquejant de Codex, relleus 16, 17 i 21 de l'auditoria 261004_2240)
     · Una publicació triada és de la seua font, no del port de notes ────────
     Amb les notes llestes i la font encara carregant, l'espai de treball la
     donava per absent (itemsComplete només sabia de notes) i hi fixava la nota
     preparada: la URL perdia l'id i la foto ja no s'obria en arribar. Per a
     una publicació triada la llista mai és completa: les fonts no són
     exhaustives (el port limita cada secció a 50, fase 2 de la Marató) i no hi
     ha resolució per ID. L'espai de treball conserva l'id; el detall diu
     «Carregant…» mentre la font carrega i «No s'ha pogut obrir l'element» si
     falla o, ja llesta, no la porta; l'id mai va a resolveNote com si fora una
     nota privada. Si ja estava oberta, es conserva l'última vista mentre la
     font torna a carregar o falla, només per a la mateixa identitat. Una nota
     ordinària continua amb itemsComplete i resolveNote de sempre.
     Revisió de F4 (ronda 2, R2d) · El camí el decidix el prefix
     (esIdDePublicacio): un id malformat ('publicacio::x', 'publicacio:mur')
     va per la via de publicació, sense cap font, com una secció desconeguda
     ('publicacio:receptes:r1'): l'avís «No s'ha pogut obrir l'element» i l'id
     a la URL; mai resolveNote. Canvi visible declarat: amb la llista de notes
     completa, un id així ja no cau a la primera nota (amb la URL reescrita),
     es queda amb l'avís. */
  const triaPublicacio = !modeDesa && esIdDePublicacio(enUrl.item);
  const seccioTriada = triaPublicacio ? seccioDePublicacio(enUrl.item) : null;
  const triadaPendent = ESTATS_PENDENTS.has(fontDe(fontsDelMas, seccioTriada)?.status);
  const vistaTriada = useMemo(
    () => (seccioTriada == null ? null : publicacions.find((item) => item.id === enUrl.item) ?? null),
    [seccioTriada, publicacions, enUrl.item]
  );
  const identitat = `${actor?.tipus ?? ''}:${actor?.id ?? ''}`;
  /* L'última vista es guarda en confirmar-se la pintada (efecte) i es llig
     quan la font ja no la porta: un estat no podria fer-ho sense repintar en
     bucle si una font no memoritza les seues llistes. */
  const darreraTriada = useRef(null);
  useEffect(() => {
    if (vistaTriada) darreraTriada.current = { item: vistaTriada, identitat };
    else if (!triadaPendent) darreraTriada.current = null;
  }, [vistaTriada, identitat, triadaPendent]);
  const darrera = darreraTriada.current;
  const conservada = !vistaTriada && triadaPendent && darrera?.identitat === identitat && darrera.item.id === enUrl.item
    ? darrera.item
    : null;
  /* Error de la font: la primera resolució el mostra («No s'ha pogut obrir
     l'element», amb Reintentar); la següent dins del mateix episodi és el
     Reintentar, i la recarrega. Mai una recàrrega soleta en bucle.
     Revisió de F4 (ronda 1, C2; ronda 2, R4b) · L'espai de treball torna a
     cridar resolveItemId a cada canvi de la seua clau de petició (requestKey,
     WorkspaceContext.jsx:219: l'intent, l'estat de Notes, la selecció, la
     funció…), i abans qualsevol segona crida amb la mateixa font comptava com
     a Reintentar: una revalidació de Notes, o anar a una altra nota i tornar
     Arrere a la foto, recarregaven la font sense que ningú ho demanara. Ara
     només és un Reintentar si, entre les dues crides, no ha canviat res del
     que el Bloc veu: la font (l'objecte de fontsDelMas, que ja porta l'error,
     I1), l'id i l'episodi, un testimoni nou cada vegada que canvien l'estat de
     Notes, la carpeta o l'element de la URL, resolveNote o workspaceKey. Totes
     estes causes ja canvien requestKey (cap crida de més): l'única crida que
     queda dins del mateix episodi és la del botó (resolutionAttempt).
     Límit conegut · La solució neta és que l'espai de treball diga quina
     crida és un Reintentar (per exemple, resolveItemId(id, { signal, reintent })
     des de retryItemResolution, WorkspaceContext.jsx:214). Toca el Workspace i
     queda fora de l'abast de F4: una causa de requestKey que el Bloc no veja i
     que no passe per cap d'estes encara comptaria com a Reintentar. */
  const errorMostrat = useRef(null);
  const resolPublicacio = useMemo(() => {
    const episodi = Object.freeze({ estatNotes: status, carpeta: enUrl.carpeta, item: enUrl.item, workspaceKey });
    return (id, opcions = {}) => {
      if (!esIdDePublicacio(id)) {
        if (typeof resolveNote !== 'function') throw new Error('La llista parcial de notes no disposa de resolució per ID.');
        return resolveNote(id, opcions);
      }
      /* Font llesta (o desconeguda, o cap per a un id malformat) que no la
         porta: pot ser fora de la finestra carregada, i res no en demostra
         l'absència. Ni s'hi salta a una altra. */
      const font = fontDe(fontsDelMas, seccioDePublicacio(id));
      if (!ESTATS_PENDENTS.has(font?.status)) {
        throw new Error('La publicació no és entre les carregades i no es pot resoldre per ID.');
      }
      if (font.status === 'error') {
        const mostrat = errorMostrat.current;
        const esReintent = mostrat?.font === font && mostrat.id === id && mostrat.episodi === episodi;
        if (!esReintent || typeof font.refresh !== 'function') {
          errorMostrat.current = { font, id, episodi };
          throw new Error('La font de la publicació no s’ha pogut carregar.');
        }
        font.refresh();
      }
      // Carregant: la resposta és la font, quan arribe (l'espai de treball avorta esta espera).
      return new Promise((_, rebutja) => {
        opcions.signal?.addEventListener('abort', () => rebutja(opcions.signal.reason), { once: true });
      });
    };
  }, [fontsDelMas, resolveNote, status, enUrl.carpeta, enUrl.item, workspaceKey]);
  /* Una entrada amb carpeta i sense element (un enllaç a la carpeta) obri el
     primer element; si la carpeta és d'una font que carrega o falla, no s'hi
     fixa la nota preparada abans que arribe (relleu 21): el detall diu que
     carrega, o que ha fallat amb Reintentar. Una nota de la carpeta (o de les
     seues subcarpetes) s'obri igual, perquè va davant de tot.
     Revisió de F4 (ronda 1, A1; relleu 22 de Codex) · Sense ?carpeta= (l'entrada
     nua de /notes) la carpeta d'entrada és la primera, la mateixa que l'espai
     de treball pinta activa (initialSelection: enUrl.carpeta ?? primeraCarpeta):
     /notes i /notes?carpeta=f-mur han d'esperar igual el Mur. Si no, amb el Mur
     carregant la nota preparada es fixava a la URL i ja no canviava en arribar.
     Revisió de F4 (ronda 2, R6c) · Igual amb una ?carpeta= que no és cap
     entrada de la navegació (un enllaç vell a una carpeta esborrada): l'espai
     de treball la canvia per la primera (WorkspaceContext.jsx:351-356,
     categoryById i normalizedCategories[0], que és carpetes[0]), i la secció
     d'entrada s'ha de derivar de la mateixa. */
  const carpetaReconeguda = enUrl.carpeta === ALL_CATEGORY_ID || idsDeNavegacio.includes(enUrl.carpeta);
  const carpetaDEntrada = carpetaReconeguda ? enUrl.carpeta : carpetes[0]?.id;
  const seccioDEntrada = ambPreparada && enUrl.item == null ? seccioDeCarpeta(carpetaDEntrada) : null;
  const { status: estatEntrada, refresh: refrescaEntrada } = fontDe(fontsDelMas, seccioDEntrada) ?? {};
  const esperaCarpeta = ESTATS_PENDENTS.has(estatEntrada);

  /* ── P4 (ordre del Mestre, 261003) · La «Nota sense títol» ─────────────
     Sempre n'hi ha una de preparada (notaPreparada.js), a la carpeta, la
     categoria o l'etiqueta on és la persona: la que l'espai de treball diu
     a cada canvi de selecció. No es desa fins que s'hi escriu. */
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const categoriaBase = categoriaActiva ?? enUrl.carpeta ?? carpetes[0]?.id ?? ALL_CATEGORY_ID;
  /* T39 (ordre del Mestre, 260928) · La nota nova hereta els drets de sèrie
     de l'actor (herencia.js): per a una entitat, el de la seua fitxa al
     servidor; si no, el que s'ha triat al Perfil en este dispositiu. Es
     compon DESPRÉS de l'entrada per carpeta, categoria o etiqueta.
     D15 (ordre del Mestre, 260930) · Sense herència, la Creative Commons de
     sèrie (LLICENCIA_PER_DEFECTE). Només en una nota nova del Bloc: no és
     retroactiva (una nota vella sense drets es pinta com sempre) i les notes
     de Connectar, del contingut de fora i del retall no la reben, perquè són
     contingut d'altri. */
  const basePreparada = useMemo(() => {
    const heretat = llicenciaDeLActor({ id: actor?.id, tipus: actor?.tipus, memberships });
    return {
      ...entradaDeNotaNova(categoriaBase, grupDe(categoriaBase, allCategories, allTags)),
      copyright: heretat || LLICENCIA_PER_DEFECTE
    };
  }, [categoriaBase, allCategories, allTags, actor, memberships]);
  /* Revisió de P4 · Un endoll que no respecta l'id del client crea la nota
     amb un altre: si la preparada era la triada, la selecció (la URL) passa a
     la nota creada. replace: és la mateixa nota, no una navegació. */
  const adoptaNota = useCallback((idPreparat, idCreat) => {
    if (llegixSeleccio(params, CLAUS_URL).item !== String(idPreparat)) return;
    setParams(escriuSeleccio(params, { item: idCreat }, CLAUS_URL), { replace: true });
  }, [params, setParams]);
  const preparada = useNotaPreparada({
    clau: workspaceKey ?? null, base: basePreparada, llavor: LLAVOR_NOTA,
    notes, creaNota, resolNota: resolveNote, setLocalNoteField, updateNote, informaError, adopta: adoptaNota
  });
  /* Revisió de P4 · CREAR NOTA la fixa a la llista (vegeu llistaParcial). */
  const [demanada, setDemanada] = useState(null);
  const potOferir = ambPreparada && !notes.some((nota) => String(nota.id) === preparada.id);
  /* A totes les entrades de la navegació (idsDeNavegacio), i al final de les
     dades: en una carpeta amb notes s'obri la primera de sempre; en una de
     buida, esta. */
  const itemPreparadaBase = useMemo(() => {
    if (!potOferir) return null;
    const item = toWorkspaceNote(preparada.document, noteFolders);
    return {
      ...item,
      title: extractPlainText(preparada.document.title || '', Infinity) || TITOL_NOTA_PREPARADA,
      categoryIds: [...new Set([...item.categoryIds, ...idsDeNavegacio])]
    };
  }, [potOferir, preparada.document, noteFolders, idsDeNavegacio]);
  /* Revisió de P4 · Amb la llista a mitges (més de 50 notes en remot: cada
     pàgina arriba 'ready' i notesComplete és fals fins a l'última), la
     preparada no s'oferix a la reconciliació inicial. Pertany a totes les
     entrades: en una carpeta les notes de la qual encara no han arribat, el
     Workspace l'hauria triada en lloc d'esperar, l'hauria escrita a la URL i
     ja no canviaria en arribar la pàgina bona. Es queda si està FIXADA: la
     persona l'ha demanada (CREAR NOTA) o ja és a la URL. Mentre carrega o
     revalida el Workspace no reconcilia: es conserva, i la llista no
     parpelleja a cada refresc. */
  const llistaParcial = status === 'ready' && notesComplete === false;
  const fixada = demanada === preparada.id || enUrl.item === preparada.id;
  /* F4 (relleu 21) · Tampoc mentre la font de la carpeta d'entrada carrega. */
  const itemPreparada = itemPreparadaBase && ((!llistaParcial && !esperaCarpeta) || fixada) ? itemPreparadaBase : null;
  const contextPreparada = useMemo(
    () => ({ escriu: preparada.escriu, desa: preparada.desa, creacio: preparada.creacio, reintenta: preparada.reintenta }),
    [preparada.escriu, preparada.desa, preparada.creacio, preparada.reintenta]
  );

  /* F1/F2 · El Workspace pregunta per la carpeta destí abans que la URL
     canviï. Només ajornem la preparada de reserva o una carpeta sense cap
     candidat mentre la seua font és pendent. Les notes/publicacions existents
     continuen elegibles. CREAR NOTA i les tries manuals no passen per esta
     política: una demanda anterior no autoritza el fallback d'una altra carpeta. */
  const canAutoSelect = useCallback(({ categoryId, item }) => {
    if (modeDesa || (item && item.id !== preparada.id)) return true;
    const font = fontDe(fontsDelMas, seccioDeCarpeta(categoryId));
    return !ESTATS_PENDENTS.has(font?.status);
  }, [modeDesa, preparada.id, fontsDelMas]);

  const model = useMemo(() => {
    const grupCarpetes = {
      id: 'folders',
      label: null,
      options: carpetes
        .map((folder, order) => ({
          id: folder.id,
          label: folder.nom,
          icon: iconaDeCarpeta(folder.id),
          order,
          parentId: folder.parentId
        }))
    };
    return {
      // En entrar, la primera carpeta (Mur) es pinta activa: la mateixa cara
      // que Wiki i Disseny (pla 260924_1710 §3.4).
      primeraCarpeta: carpetes[0] ? carpetes[0].id : undefined,
      status,
      error,
      /* F4 (bloquejant de Codex) · Sense publicació triada, ni carpeta
         d'entrada esperant la seua font, les notes de sempre. */
      itemsComplete: triaPublicacio || esperaCarpeta ? false : notesComplete,
      resolveItemId: triaPublicacio ? resolPublicacio : resolveNote,
      workspaceKey,
      canAutoSelect,
      /* P4 · CREAR NOTA es pinta sempre que la persona pot tindre notes, i
         l'espai de treball el desactiva mentre carrega (abans desapareixia). */
      refresh, canCreate: !calEntrar,
      /* T7C · Al snippet la navegació tria on arriba l'enllaç: només les
         carpetes. Categories i etiquetes es trien a la botonera. */
      navigationGroups: modeDesa ? [grupCarpetes] : [
        grupCarpetes,
        { id: 'categories', label: 'CATEGORIES', options: allCategories },
        { id: 'tags', label: 'ETIQUETES', options: allTags }
      ],
      /* P4 · La nota preparada que acaba d'arribar a la llista porta damunt,
         en este render, el que s'hi ha escrit mentre es creava: l'editor (el
         mateix id, cap remuntatge) no rep mai un cos vell. */
      items: [
        ...notes.map(note => toWorkspaceNote(
          String(note.id) === preparada.id ? { ...note, ...preparada.camps } : note, noteFolders)),
        ...publicacions,
        ...(conservada ? [conservada] : []),
        ...(itemPreparada ? [itemPreparada] : [])
      ]
    };
  }, [status, error, notesComplete, esperaCarpeta, triaPublicacio, resolveNote, resolPublicacio, workspaceKey, canAutoSelect, refresh, calEntrar, noteFolders, notes, carpetes, allCategories, allTags, publicacions, conservada, modeDesa, preparada.id, preparada.camps, itemPreparada]);

  /* T7C · La carpeta on arriba l'enllaç (la de la URL si és del Bloc; si
     no, la Safata d’Entrada) és la categoria activa del Workspace, i el
     detall no és cap nota. */
  const carpetaDesti = modeDesa ? carpetaDeDesa(params, carpetes) : null;
  const seleccioDesa = useMemo(() => ({ categoryId: carpetaDesti, itemId: null }), [carpetaDesti]);
  const renderDesa = useCallback(
    () => <SnippetCurador carpetes={carpetes} carpetaId={carpetaDesti} />,
    [carpetes, carpetaDesti]
  );
  /* F4 (relleu 21) · Mentre la carpeta d'entrada espera la seua font no hi ha
     cap element triat: el detall diu que carrega, o que ha fallat amb
     Reintentar (recarrega eixa font), no l'editor buit (que pinta la nota de
     benvinguda). El marcatge és el dels estats propis del detall. */
  const renderDetallBloc = useCallback((props) => {
    if (!esperaCarpeta || props?.item) return renderDetall(props);
    if (estatEntrada !== 'error') return <p role="status">{TEXT_CARREGANT}</p>;
    return (
      <div role="alert">
        {TEXT_ERROR_FONT}
        {typeof refrescaEntrada === 'function' ? <> <button type="button" onClick={refrescaEntrada}>Reintentar</button></> : null}
      </div>
    );
  }, [esperaCarpeta, estatEntrada, refrescaEntrada]);

  const handleSelectionChange = useCallback(({ categoryId, itemId }, meta) => {
    // push si és acció de l'usuari directa (per poder tirar enrere)
    const isPush = meta?.reason === 'user';
    /* T7C · Al snippet (mode compacte, cap nota per defecte):
       · una nota triada a la llista o al rail l'obri i ix del snippet amb
         push: Arrere hi torna, amb tota la tria, que és a la URL;
       · una carpeta triada és on arribarà l'enllaç: replace, perquè el
         snippet ocupe una sola entrada de l'historial. */
    if (modeDesa) {
      if (itemId != null) {
        if (isPush) setParams(paramsDeLaNota({ carpeta: categoryId ?? null, nota: itemId }), { replace: false });
        return;
      }
      if (categoryId == null || categoryId === ALL_CATEGORY_ID) return;
      const desti = escriuDesa(params, { carpeta: categoryId });
      if (desti.toString() !== params.toString()) setParams(desti, { replace: true });
      return;
    }
    // P4 · La nota preparada es crearà on és la persona.
    if (categoryId != null) setCategoriaActiva(String(categoryId));
    /* Correcció T1 · Si el sistema només reconcilia la carpeta d'una URL que
       no en porta cap (l'entrada de /notes, en tornar Arrere), la URL ja és
       completa: la nota diu la carpeta. No es reescriu, perquè el replace del
       router en memòria talla l'historial per davant i l'Avant es perdria. */
    const actual = llegixSeleccio(params, CLAUS_URL);
    const nomesReconciliaCarpeta = !isPush && actual.carpeta === null
      && itemId != null && String(itemId) === actual.item;
    const next = escriuSeleccio(params, {
      carpeta: nomesReconciliaCarpeta ? undefined : (categoryId ?? null),
      item: itemId ?? null
    }, CLAUS_URL);
    if (next.toString() === params.toString()) return;

    setParams(next, { replace: !isPush });
  }, [params, setParams, modeDesa]);

  // Si l'usuari entra a /notes sense nota, i existeix el bloc de notes per defecte (n1), obre'l.
  // T7 (P9) · Un enllaç amb carpeta i sense nota obri la primera nota d'eixa carpeta: no salta a n1.
  // T7C · Al snippet no s'obri cap nota.
  useEffect(() => {
    if (modeDesa) return;
    const { carpeta, item } = llegixSeleccio(params, CLAUS_URL);
    if (!item && !carpeta && notes.some(n => n.id === 'n1')) {
      setParams(escriuSeleccio(params, { item: 'n1' }, CLAUS_URL), { replace: true });
    }
  }, [params, notes, setParams, modeDesa]);

  /* P4 (ordre del Mestre, 261003) · CREAR NOTA ja no crea res al servidor:
     obri la nota preparada («Nota sense títol») on és la persona. Es crea
     amb la primera cosa que s'hi escriu, amb l'entrada i els drets de
     basePreparada (T39, D15). Així un clic no deixa cap nota buida. */
  const onCreate = useCallback(async ({ activeCategoryId } = {}) => {
    if (activeCategoryId != null) setCategoriaActiva(String(activeCategoryId));
    // També amb la llista a mitges: demanar-la la fixa a la llista.
    if (itemPreparadaBase) setDemanada(itemPreparadaBase.id);
    return itemPreparadaBase;
  }, [itemPreparadaBase]);

  /* T7C · El Bloc i el snippet són dues vistes del mateix esquelet: la clau
     el remunta en canviar de mode (columnes, selecció i detall de cada un).
     Al snippet no es crea cap nota buida, i el detall és una Pàgina
     Universal que fa scroll (sense la closca de l'editor).
     P4 · L'editor de la nota preparada escriu pel canal d'este context. */
  return (
    <NotaPreparadaContext.Provider value={contextPreparada}>
      <UniversalWorkspace
        key={modeDesa ? 'desa' : 'bloc'}
        model={model}
        initialSelection={modeDesa ? seleccioDesa : { categoryId: enUrl.carpeta ?? model.primeraCarpeta }}
        selection={modeDesa ? seleccioDesa : { categoryId: enUrl.carpeta ?? undefined, itemId: enUrl.item ?? undefined }}
        onSelectionChange={handleSelectionChange}
        compacte={modeDesa}
        /* MD (ordre del Mestre, 261003) · En mòbil, primer les carpetes; amb
           una nota a la URL d'entrada, l'editor, tret que siga la que hi
           havia quan la persona va deixar el Bloc (l'efecte de n1 i les
           tries escriuen ?nota= soles): llavors, el nivell on era
           (nivellMestreDetall.js). Al snippet no s'aplica. */
        mestreDetall={{ clau: 'notes', element: enUrl.item }}
        columnesInicials={modeDesa ? undefined : COLUMNES_INICIALS}
        inclouDescendents={true}
        onCreate={modeDesa ? undefined : onCreate}
        onCreateError={informaError}
        onManageCategories={obriConfiguracioNotes}
        sortable={true}
        labels={{ ...ETIQUETES, empty: calEntrar ? TEXT_CAL_ENTRAR : ETIQUETES.empty }}
        icons={ICONES}
        tagFilter={false}
        renderItem={renderNota}
        renderDetail={modeDesa ? renderDesa : renderDetallBloc}
        className="sdp-bloc"
        listClassName="sdp-bloc-list--notes"
        detailClassName={modeDesa ? '' : 'sdp-workspace-detail--editor'}
      />
    </NotaPreparadaContext.Provider>
  );
}
