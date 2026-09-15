import { useCallback, useMemo } from 'react';
import { useSearchParams } from '../../app/contexts/RouterContext';
import { NotesProvider, useNotes } from './NotesContext';
import NotesEditor from './NotesEditor';
import { UniversalWorkspace } from '../../components/universal/workspace';
import { FileText } from 'lucide-react';

const notesManagerConfig = {
  getItemId: (n) => n.id,
  getItemSearchText: (n) => `${n.title} ${n.subtitle} ${n.content}`,
  getItemCard: (n) => ({ title: n.title, subtitle: n.subtitle, meta: n.createdAt })
};

function buildNotesFacets(folders) {
  return [{
    id: 'folder',
    label: 'Carpetes',
    type: 'flat',
    hideHeader: true,
    options: folders.map((folder) => ({ id: folder.id, label: folder.name })),
    getValue: (item) => item?.folderId || ''
  }];
}

/* ── El slot com a CONSTANT DE MÒDUL ────────────────────────────────
   L'element no depén de res de l'escop (l'editor es subscriu ell mateix
   al ManagerContext, com diu el contracte), així que el definim UNA
   vegada per mòdul: funció estable + element únic. És el màxim grau
   d'estabilitat possible per al contracte renderEditor — cap memo de la
   plantilla es tornarà a invalidar mai per la columna d'editor.

   Si un dia NotesEditor necessara props d'este àmbit, canvia a
   useCallback amb dependències reals. */
const renderEditorDeNotes = (activeNote) => <NotesEditor activeNote={activeNote} />;

function NotesSectionInner({ notaInicialId }) {
  const { notes, noteFolders, creaNota } = useNotes();

  /* Abans: buildNotesFacets(noteFolders) inline = array nova cada
     render, invalidant els memos del Manager. */
  const facets = useMemo(() => buildNotesFacets(noteFolders), [noteFolders]);

  /* Promesa amb catch: una creació que falla no pot morir en silenci.
     TODO(plantilla): quan ManagerContext exposure una acció per
     seleccionar per programació (p.e. triaItem(id)), ací cal obrir la
     nota nova de seguida. */
  const handleCreate = useCallback(async () => {
    try {
      return await creaNota();
    } catch (e) {
      console.error("[NotesSection] No s'ha pogut crear la nota:", e);
      return null;
    }
  }, [creaNota]);

  /* Coherència de tipus: la URL sempre dona strings; si els ids són
     numèrics, la comparació inicial fallava en silenci. */
  const initialItemId = notaInicialId != null ? String(notaInicialId) : null;

  return (
    <div className="sdp-gestor-pagina">
      <UniversalWorkspace
        items={notes}
        facets={facets}
        getItemId={notesManagerConfig.getItemId}
        getItemSearchText={notesManagerConfig.getItemSearchText}
        getItemCard={notesManagerConfig.getItemCard}
        onActionCreate={handleCreate}
        createLabel="CREAR NOTA"
        listTitle="NOTES"
        listIcon={FileText}
        initialItemId={initialItemId}
        renderEditor={renderEditorDeNotes}
      />
    </div>
  );
}

export default function NotesSection() {
  const [searchParams] = useSearchParams();
  const notaInicialId = searchParams.get('nota');

  return (
    <NotesProvider>
      <NotesSectionInner notaInicialId={notaInicialId} />
    </NotesProvider>
  );
}
