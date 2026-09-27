import { useMemo, useCallback, useEffect } from 'react';
import { NotebookPen, Folder } from 'lucide-react';
import { useSearchParams } from '../../app/contexts/RouterContext';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { useNotes, etiquetesDeNota } from './NotesContext';
import { useMur } from '../mur/MurContext';
import { UniversalWorkspace } from '../../components/universal/workspace/UniversalWorkspace';
import NotesDetail from './NotesDetail.jsx';
import { useNotesData } from './NotesDataContext.jsx';
import { NotaFitxa } from './NotaFitxa.jsx';
import { PublicacioDetall, PublicacioFitxa } from './PublicacioDetall.jsx';
import { extractPlainText } from '../../utils/contentAdapter.js';
import { aliesDeLActor } from '../../data/identitatsSeed.js';
import { TEXTOS_LLAVOR } from '../../components/universal/textosLlavor.js';
import { carpetesDelBloc, iconaDeCarpeta } from './carpetes.js';
import { itemsPublicatsDe } from './masDeLUsuari.js';

/* Pell del Bloc de Notes: tot allò que el UniversalWorkspace no ha de saber. */
const ETIQUETES = { categories: 'CARPETES', items: 'NOTES', create: 'CREAR NOTA', search: 'Cercar notes', empty: 'No hi ha notes.' };
const ICONES = { categories: Folder, items: NotebookPen };
const CAP = Object.freeze([]);
/* Categories i etiquetes que sempre existixen al Bloc, encara que cap nota les use. */
const CATEGORIES_BASE = ['Sistema'];
const ETIQUETES_BASE = ['Productivitat', 'Tutorial'];

const toWorkspaceNote = (note, noteFolders) => {
  const isSeedContent = note.content === LLAVOR_NOTA || (note.plainText && note.plainText.startsWith('Heading 3 (punxa'));
  return {
    id: String(note.id),
    categoryIds: [
      String(note.folderId ?? 'f-notes'),
      ...(note.categories || []).map(c => `cat_${c}`),
      ...(note.tags || []).map(t => `tag_${t}`)
    ],
    kind: 'note',
    title: extractPlainText(note.title || '', Infinity) || TEXTOS_LLAVOR.titol,
    subtitle: note.formattedDate,
    excerpt: extractPlainText(note.subtitle || note.lead || '', Infinity) || (!isSeedContent ? note.plainText || '' : ''),
    image: note.coverImage || note.heroImage || '',
    tags: note.tags || [],
    labels: etiquetesDeNota(note, noteFolders),
    searchText: note.searchText,
    revision: note.revision,
    updatedAt: note.updatedAt,
    data: note
  };
};

/* Una nota s'edita; una publicació pròpia (T1) es llig. */
const renderNota = ({ item, active, onSelect }) => (
  item?.kind === 'publicacio'
    ? <PublicacioFitxa item={item} active={active} onSelect={onSelect} />
    : <NotaFitxa item={item} active={active} onSelect={onSelect} />
);
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

export default function NotesSection() {
  const { activate, config } = useNotesData();
  useEffect(() => activate(), [activate]);
  const notesContextValue = useNotes();
  /* T1 · el MAS també ensenya el que l'actor ha publicat, per carpeta. */
  const { actor } = useIdentitat();
  const { sortedFeedPosts = CAP, sortedMarketItems = CAP, sortedEvents = CAP } = useMur();
  const alies = useMemo(() => aliesDeLActor(actor, { dataMode: config?.dataMode }), [actor, config?.dataMode]);
  const publicacions = useMemo(
    () => itemsPublicatsDe({ feedPosts: sortedFeedPosts, marketItems: sortedMarketItems, events: sortedEvents }, alies),
    [sortedFeedPosts, sortedMarketItems, sortedEvents, alies]
  );
  const {
    status, error, notes, noteFolders, creaNota,
    informaError, obriConfiguracioNotes, refresh, canCreate,
    notesComplete, resolveNote, workspaceKey
  } = notesContextValue || {
    status: 'error', error: new Error('NotesContext no disponible'), notes: [], noteFolders: []
  };
  const [params, setParams] = useSearchParams();

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

  const model = useMemo(() => {
    // Sense sessió o amb el backend apagat l'adaptador torna [] de carpetes:
    // pintem el catàleg de carpetes de sèrie perquè la vista siga sempre completa.
    const carpetes = carpetesDelBloc(noteFolders);
    return {
      // En entrar, la primera carpeta (Mur) es pinta activa: la mateixa cara
      // que Wiki i Disseny (pla 260924_1710 §3.4).
      primeraCarpeta: carpetes[0] ? String(carpetes[0].id) : undefined,
      status,
      error,
      itemsComplete: notesComplete,
      resolveItemId: resolveNote,
      workspaceKey,
      refresh, canCreate,
      navigationGroups: [
        {
          id: 'folders',
          label: null,
          options: carpetes
            .map((folder, order) => ({
              id: String(folder.id),
              label: folder.name,
              icon: iconaDeCarpeta(folder.id),
              order
            }))
        },
        { id: 'categories', label: 'CATEGORIES', options: allCategories },
        { id: 'tags', label: 'ETIQUETES', options: allTags }
      ],
      items: [...notes.map(note => toWorkspaceNote(note, noteFolders)), ...publicacions]
    };
  }, [status, error, notesComplete, resolveNote, workspaceKey, refresh, canCreate, noteFolders, notes, allCategories, allTags, publicacions]);

  const handleSelectionChange = useCallback(({ itemId }, meta) => {
    const current = params.get('nota');
    if ((current ?? null) === (itemId ?? null)) return;

    const next = new URLSearchParams(params);
    if (itemId == null) next.delete('nota');
    else next.set('nota', String(itemId));

    // push si és acció de l'usuari directa (per poder tirar enrere)
    const isPush = meta?.reason === 'user';
    setParams(next, { replace: !isPush });
  }, [params, setParams]);

  // Si l'usuari entra a /notes sense nota, i existeix el bloc de notes per defecte (n1), obre'l.
  useEffect(() => {
    if (!params.get('nota') && notes.some(n => n.id === 'n1')) {
      const next = new URLSearchParams(params);
      next.set('nota', 'n1');
      setParams(next, { replace: true });
    }
  }, [params, notes, setParams]);

  const onCreate = useCallback(async ({ activeCategoryId, category }) => {
    let input = { content: LLAVOR_NOTA };
    if (category?.groupId === 'categories') {
      input = { categories: [category.label] };
    } else if (category?.groupId === 'tags') {
      input = { tags: [category.label] };
    } else if (activeCategoryId !== '__all__') {
      input = { folderId: activeCategoryId };
    }
    const created = await creaNota(input);
    return toWorkspaceNote(created, noteFolders);
  }, [creaNota, noteFolders]);

  return (
    <UniversalWorkspace
      model={model}
      initialSelection={{ categoryId: model.primeraCarpeta }}
      selection={{ itemId: params.get('nota') ?? undefined }}
      onSelectionChange={handleSelectionChange}
      onCreate={onCreate}
      onCreateError={informaError}
      onManageCategories={obriConfiguracioNotes}
      sortable={true}
      labels={{ ...ETIQUETES, empty: canCreate ? ETIQUETES.empty : 'Connecta per veure les teues notes.' }}
      icons={ICONES}
      tagFilter={false}
      renderItem={renderNota}
      renderDetail={renderDetall}
      className="sdp-bloc"
      listClassName="sdp-bloc-list--notes"
      detailClassName="sdp-workspace-detail--editor"
    />
  );
}
