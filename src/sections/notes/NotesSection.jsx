import { useMemo, useCallback, useEffect } from 'react';
import {
  Newspaper, ShoppingCart, LandPlot, GalleryVerticalEnd, CalendarDays, MapPin, NotebookPen, Folder
} from 'lucide-react';
import { useSearchParams } from '../../app/contexts/RouterContext';
import { useNotes } from './NotesContext';
import { UniversalWorkspace } from '../../components/universal/workspace/UniversalWorkspace';
import NotesEditor from './NotesEditor';
import { NotaFitxa } from './NotaFitxa.jsx';
import { extractPlainText } from '../../utils/contentAdapter.js';
import { NOTE_FOLDERS_SEED } from '../../data/appSeed.js';

/* Pell del Bloc de Notes: tot allò que el UniversalWorkspace no ha de saber. */
const ETIQUETES = { categories: 'CARPETES', items: 'NOTES', create: 'CREAR NOTA', search: 'Cercar notes', empty: 'No hi ha notes.' };
const ICONES = { categories: Folder, items: NotebookPen };
const ICONA_CARPETA = {
  'f-mur': Newspaper,
  'f-mercat': ShoppingCart,
  'f-pobles': LandPlot,
  'f-media': GalleryVerticalEnd,
  'f-events': CalendarDays,
  'f-mapa': MapPin,
  'f-notes': NotebookPen
};
/* Categories i etiquetes que sempre existixen al Bloc, encara que cap nota les use. */
const CATEGORIES_BASE = ['Sistema'];
const ETIQUETES_BASE = ['Productivitat', 'Tutorial'];

const toWorkspaceNote = (note) => ({
  id: String(note.id),
  categoryIds: [
    String(note.folderId ?? 'f-notes'),
    ...(note.categories || []).map(c => `cat_${c}`),
    ...(note.tags || []).map(t => `tag_${t}`)
  ],
  kind: 'note',
  title: extractPlainText(note.title || '', Infinity) || 'Sense títol',
  subtitle: note.formattedDate,
  excerpt: extractPlainText(note.subtitle || note.lead || '', Infinity) || note.plainText || '',
  image: note.coverImage || note.heroImage || '',
  tags: note.tags || [],
  searchText: note.searchText,
  revision: note.revision,
  updatedAt: note.updatedAt,
  data: note
});

const renderNota = ({ item, active, onSelect }) => (
  <NotaFitxa item={item} active={active} onSelect={onSelect} />
);

export default function NotesSection() {
  const notesContextValue = useNotes();
  const {
    status, error, notes, noteFolders, creaNota,
    informaError, refresh, canCreate,
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
    const folders = noteFolders.length > 0 ? noteFolders : NOTE_FOLDERS_SEED;
    return {
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
          options: folders
            .filter((folder) => String(folder.id) !== 'f-tot')
            .map((folder, order) => ({
              id: String(folder.id),
              label: folder.name,
              icon: ICONA_CARPETA[folder.id] || Folder,
              order
            }))
        },
        { id: 'categories', label: 'CATEGORIES', options: allCategories },
        { id: 'tags', label: 'ETIQUETES', options: allTags }
      ],
      items: notes.map(toWorkspaceNote)
    };
  }, [status, error, notesComplete, resolveNote, workspaceKey, refresh, canCreate, noteFolders, notes, allCategories, allTags]);

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
    let input = {};
    if (category?.groupId === 'categories') {
      input = { categories: [category.label] };
    } else if (category?.groupId === 'tags') {
      input = { tags: [category.label] };
    } else if (activeCategoryId !== '__all__') {
      input = { folderId: activeCategoryId };
    }
    const created = await creaNota(input);
    return toWorkspaceNote(created);
  }, [creaNota]);

  return (
    <UniversalWorkspace
      model={model}
      initialSelection={{}}
      selection={{ itemId: params.get('nota') ?? undefined }}
      onSelectionChange={handleSelectionChange}
      onCreate={onCreate}
      onCreateError={informaError}
      sortable={true}
      labels={{ ...ETIQUETES, empty: canCreate ? ETIQUETES.empty : 'Connecta per veure les teues notes.' }}
      icons={ICONES}
      tagFilter={false}
      renderItem={renderNota}
      renderDetail={({ item }) => <NotesEditor activeNote={item?.data} />}
      className="sdp-bloc"
      listClassName="sdp-bloc-list--notes"
      detailClassName="sdp-workspace-detail--editor"
    />
  );
}
