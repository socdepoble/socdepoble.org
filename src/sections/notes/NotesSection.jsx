// src/sections/notes/NotesSection.jsx
import { useMemo, useCallback } from 'react';
import { useSearchParams } from '../../app/contexts/RouterContext';
import { useNotes } from './NotesContext';
import { UniversalWorkspace } from '../../components/universal/workspace/UniversalWorkspace';
import NotesEditor from './NotesEditor';

const toWorkspaceNote = (note) => ({
  id: String(note.id),
  categoryIds: [String(note.folderId ?? 'f-notes')],
  kind: 'note',
  title: note.title || 'Sense títol',
  subtitle: note.formattedDate,
  tags: note.tags || [],
  searchText: note.searchText,
  revision: note.revision,
  updatedAt: note.updatedAt,
  data: note
});

export default function NotesSection() {
  const {
    status, notes, noteFolders, creaNota,
    obriConfiguracioNotes, informaError
  } = useNotes();
  const [params, setParams] = useSearchParams();

  const allCategories = useMemo(() => {
    const cats = new Set();
    notes.forEach(n => (n.categories || []).forEach(c => cats.add(c)));
    return Array.from(cats).sort().map(c => ({ id: `cat_${c}`, label: c }));
  }, [notes]);

  const allTags = useMemo(() => {
    const tags = new Set();
    notes.forEach(n => (n.tags || []).forEach(t => tags.add(t)));
    return Array.from(tags).sort().map(t => ({ id: `tag_${t}`, label: t }));
  }, [notes]);

  const model = useMemo(() => ({
    status,
    navigationGroups: [
      {
        id: 'folders',
        label: null,
        options: noteFolders
          .filter((folder) => String(folder.id) !== 'f-tot')
          .map((folder, order) => ({
            id: String(folder.id),
            label: folder.name,
            order
          }))
      },
      ...(allCategories.length > 0 ? [{ id: 'categories', label: 'CATEGORIES', options: allCategories }] : []),
      ...(allTags.length > 0 ? [{ id: 'tags', label: 'ETIQUETES', options: allTags }] : [])
    ],
    items: notes.map(n => {
      const wNote = toWorkspaceNote(n);
      wNote.categoryIds = [
        String(n.folderId ?? 'f-notes'),
        ...(n.categories || []).map(c => `cat_${c}`),
        ...(n.tags || []).map(t => `tag_${t}`)
      ];
      return wNote;
    })
  }), [status, noteFolders, notes, allCategories, allTags]);

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

  return (
    <UniversalWorkspace
      model={model}
      initialSelection={{}}
      selection={{ itemId: params.get('nota') ?? undefined }}
      onSelectionChange={handleSelectionChange}
      onCreate={async ({ activeCategoryId }) => {
        const input = activeCategoryId === '__all__'
          ? {}
          : { folderId: activeCategoryId };
        const created = await creaNota(input);
        return toWorkspaceNote(created);
      }}
      onCreateError={informaError}
      onManageCategories={obriConfiguracioNotes}
      labels={{ categories: 'CARPETES', items: 'NOTES', create: 'CREAR NOTA' }}
      renderDetail={({ item }) => <NotesEditor activeNote={item.data} />}
    />
  );
}
