// src/sections/notes/NotesSection.jsx
import { useMemo, useCallback } from 'react';
import { useSearchParams } from '../../app/contexts/RouterContext';
import { useNotes } from './NotesContext';
import { UniversalWorkspace } from '../../components/universal/workspace/UniversalWorkspace';

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

  const model = useMemo(() => ({
    status,
    categories: noteFolders
      .filter((folder) => String(folder.id) !== 'f-tot')
      .map((folder, order) => ({
      id: String(folder.id),
      label: folder.name,
      order
      })),
    items: notes.map(toWorkspaceNote)
  }), [status, noteFolders, notes]);

  const handleSelectionChange = useCallback(({ itemId }, meta) => {
    const current = params.get('nota');
    if ((current ?? null) === (itemId ?? null)) return;

    const next = new URLSearchParams(params);
    if (itemId == null) next.delete('nota');
    else next.set('nota', String(itemId));
    setParams(next);
    // El Router haurà d’acceptar replace/push: user → push;
    // reconcile/create → replace; external sync → cap eco.
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
