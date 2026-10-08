import { useEffect, useState } from 'react';
import NotesEditor from './NotesEditor.jsx';
import { useNotesData } from './NotesDataContext.jsx';
import { useNotes } from './NotesContext.jsx';
import { Dialeg, Boto } from '../../components/PedraSeca';

/** D01 · Decisió explícita quan l'esborrany local és d'una revisió anterior.
 *  Va en un <dialog> natiu: la capa superior no altera l'alçada de l'editor.
 *  Esc o «Tancar» ajornen la decisió; no descarten res. */
function DecisioConflicte({ note, onDescartat }) {
  const { resolConflicteEsborrany } = useNotes() || {};
  const [ajornat, setAjornat] = useState(null);
  const [ocupat, setOcupat] = useState(false);
  const conflicte = note?.draftConflict;
  if (!conflicte || !resolConflicteEsborrany) return null;
  const clau = `${note.id}:${conflicte.remoteRevision}`;
  const decidix = async (decisio) => {
    setOcupat(true);
    try {
      const fet = await resolConflicteEsborrany(note, decisio);
      if (fet && decisio === 'remot') onDescartat?.();
    } finally {
      setOcupat(false);
      setAjornat(clau);
    }
  };
  return (
    <Dialeg obert={ajornat !== clau} onTanca={() => setAjornat(clau)} mida="s" tancaEnVel={false}
      titol="Hi ha una versió més nova d’esta nota"
      descripcio={`El teu esborrany es va començar sobre la revisió ${conflicte.baseRevision} i al servidor ja hi ha la ${conflicte.remoteRevision}. Mentre no tries, els canvis no es poden desar.`}
      accions={(
        <>
          <Boto varietat="secundari" onClick={() => decidix('remot')} disabled={ocupat}>Descartar el meu esborrany</Boto>
          <Boto varietat="perill" onClick={() => decidix('meu')} carregant={ocupat}>Conservar el meu i sobreescriure</Boto>
        </>
      )} />
  );
}

/** Un resum mai entra en l’editor com si tinguera un cos buit editable.
 *  Esmena 2 del pla 261007_1645 · `seccio`: la secció de la carpeta triada
 *  (NotesSection · seccioDeCarpeta), un text. NotesEditor en fa el peu amb el
 *  que l'actor ja hi té publicat; cap clau de muntatge nova. */
export default function NotesDetail({ activeNote, seccio = null }) {
  const { resolveNote, workspaceKey } = useNotesData();
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  // L'editor llig el contingut en muntar-se: després de descartar un esborrany
  // cal tornar-lo a muntar perquè mostre la versió del servidor.
  const [muntatge, setMuntatge] = useState(0);
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
  /* D4 (excepció del Mestre, 260930; desfà T54) · Una connexió és una còpia
     editable: s'obri amb l'editor, com qualsevol nota, que ja en porta l'avís
     d'autoria i «Compartir» (NotesEditor). L'editor va DESPRÉS de resoldre la
     nota: en remot, el resum del llistat no porta `origen` i només arriba amb
     el cos complet. */
  return (
    <>
      <NotesEditor key={muntatge} activeNote={activeNote} seccio={seccio} />
      <DecisioConflicte note={activeNote} onDescartat={() => setMuntatge(value => value + 1)} />
    </>
  );
}
