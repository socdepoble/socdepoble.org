import { useEffect, useState } from 'react';
import NotesEditor from './NotesEditor.jsx';
import { useNotesData } from './NotesDataContext.jsx';

/** Un resum mai entra en l’editor com si tinguera un cos buit editable. */
export default function NotesDetail({ activeNote }) {
  const { resolveNote, workspaceKey } = useNotesData();
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const id = activeNote?.id;
  const revision = activeNote?.revision;
  const pending = activeNote?.contentLoaded === false;
  const key = JSON.stringify([workspaceKey, id, revision]);
  useEffect(() => {
    if (!pending) return;
    const controller = new AbortController();
    setResult(null);
    resolveNote(id, { signal: controller.signal }).then(value => {
      if (!controller.signal.aborted && value.status === 'not-found') {
        setResult({ key, error: 'La nota ja no està disponible.' });
      }
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ key, error: error.message });
    });
    return () => controller.abort();
  }, [id, key, pending, resolveNote, attempt]);
  if (pending) return result?.key === key
    ? <div role="alert"><p>{result.error}</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Reintentar</button></div>
    : <p role="status">Carregant la nota…</p>;
  return <NotesEditor activeNote={activeNote} />;
}
