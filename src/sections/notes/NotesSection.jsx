import { useMemo, useCallback, useEffect, useState } from 'react';
import { NotebookPen, Folder } from 'lucide-react';
import { useSearchParams } from '../../app/contexts/RouterContext';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { useNotes, etiquetesDeNota } from './NotesContext';
import { useMur } from '../mur/MurContext';
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
import { itemsPublicatsDe } from './masDeLUsuari.js';
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

const toWorkspaceNote = (note, noteFolders) => {
  const isSeedContent = note.content === LLAVOR_NOTA || (note.plainText && note.plainText.startsWith('Heading 3 (punxa'));
  const title = extractPlainText(note.title || '', Infinity) || TEXTOS_LLAVOR.titol;
  /* T71 · una connexió es pinta a la llista amb ConnexioFitxa (la fitxa
     compacta amb l'autoria de l'original); el contingut de fora (origen
     'extern') és un clon teu i s'edita com una nota. D4 (260930) · la
     connexió també s'edita (NotesDetail l'obri amb NotesEditor). */
  const connexio = esConnexio(note);
  return {
    id: String(note.id),
    categoryIds: [
      String(note.folderId ?? 'f-notes'),
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
  const { sortedFeedPosts = CAP, sortedMarketItems = CAP, sortedEvents = CAP } = useMur();
  const alies = useMemo(() => aliesDeLActor(actor, { dataMode: config?.dataMode }), [actor, config?.dataMode]);
  const publicacions = useMemo(
    () => itemsPublicatsDe({ feedPosts: sortedFeedPosts, marketItems: sortedMarketItems, events: sortedEvents }, alies),
    [sortedFeedPosts, sortedMarketItems, sortedEvents, alies]
  );
  const {
    status, error, notes, noteFolders, creaNota, setLocalNoteField, updateNote,
    informaError, obriConfiguracioNotes, refresh, canCreate, teSessio = false,
    notesComplete, resolveNote, workspaceKey
  } = notesContextValue || {
    status: 'error', error: new Error('NotesContext no disponible'), notes: [], noteFolders: []
  };
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

  /* T7 (P9) · La URL porta la carpeta i la nota (seleccioUrl.js): un enllaç
     copiat obri la mateixa carpeta amb la mateixa nota. La secció (?seccio=)
     l'escriu l'Índex de la pàgina; canviar de nota l'oblida. */
  const enUrl = llegixSeleccio(params, CLAUS_URL);

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
  /* A totes les entrades de la navegació, i al final de les dades: en una
     carpeta amb notes s'obri la primera de sempre; en una de buida, esta. */
  const idsDeNavegacio = useMemo(
    () => [...carpetes.map((carpeta) => String(carpeta.id)), ...allCategories.map((opcio) => opcio.id), ...allTags.map((opcio) => opcio.id)],
    [carpetes, allCategories, allTags]
  );
  /* Revisió de P4 · CREAR NOTA la fixa a la llista (vegeu llistaParcial). */
  const [demanada, setDemanada] = useState(null);
  const potOferir = ambPreparada && !notes.some((nota) => String(nota.id) === preparada.id);
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
  const itemPreparada = itemPreparadaBase && (!llistaParcial || fixada) ? itemPreparadaBase : null;
  const contextPreparada = useMemo(
    () => ({ escriu: preparada.escriu, desa: preparada.desa, creacio: preparada.creacio, reintenta: preparada.reintenta }),
    [preparada.escriu, preparada.desa, preparada.creacio, preparada.reintenta]
  );

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
      itemsComplete: notesComplete,
      resolveItemId: resolveNote,
      workspaceKey,
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
        ...(itemPreparada ? [itemPreparada] : [])
      ]
    };
  }, [status, error, notesComplete, resolveNote, workspaceKey, refresh, calEntrar, noteFolders, notes, carpetes, allCategories, allTags, publicacions, modeDesa, preparada.id, preparada.camps, itemPreparada]);

  /* T7C · La carpeta on arriba l'enllaç (la de la URL si és del Bloc; si
     no, la Safata d’Entrada) és la categoria activa del Workspace, i el
     detall no és cap nota. */
  const carpetaDesti = modeDesa ? carpetaDeDesa(params, carpetes) : null;
  const seleccioDesa = useMemo(() => ({ categoryId: carpetaDesti, itemId: null }), [carpetaDesti]);
  const renderDesa = useCallback(
    () => <SnippetCurador carpetes={carpetes} carpetaId={carpetaDesti} />,
    [carpetes, carpetaDesti]
  );

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
        renderDetail={modeDesa ? renderDesa : renderDetall}
        className="sdp-bloc"
        listClassName="sdp-bloc-list--notes"
        detailClassName={modeDesa ? '' : 'sdp-workspace-detail--editor'}
      />
    </NotaPreparadaContext.Provider>
  );
}
