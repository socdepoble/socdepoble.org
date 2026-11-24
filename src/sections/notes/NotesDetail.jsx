import { useEffect, useState } from 'react';
import NotesEditor from './NotesEditor.jsx';
import { useNotesData } from './NotesDataContext.jsx';
import { useNotes } from './NotesContext.jsx';
import { useUIStateOpcional } from '../../app/contexts/UIContext';
import { Accions, Dialeg, Boto } from '../../components/PedraSeca';
import { sanejaErrorNota, textosNotesDetail } from './i18nNotesDetail.js';

function useIdiomaNotes() {
  try {
    return useUIStateOpcional()?.language || 'ca';
  } catch {
    return 'ca';
  }
}

/** D01 · Decisió explícita quan l'esborrany local és d'una revisió anterior.
 *  Va en un <dialog> natiu: la capa superior no altera l'alçada de l'editor.
 *  Esc o «Tancar» ajornen la decisió; no descarten res. */
function DecisioConflicte({ note, onDescartat, tx }) {
  const { resolConflicteEsborrany } = useNotes() || {};
  const [ajornat, setAjornat] = useState(null);
  const [ocupat, setOcupat] = useState(false);
  const conflicte = note?.draftConflict;
  if (!conflicte || !resolConflicteEsborrany) return null;
  const clau = `${note.id}:${conflicte.remoteRevision}`;
  const decidix = async (decisio) => {
    if (ocupat) return;
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
      titol={tx.conflicteTitol}
      descripcio={tx.conflicteDescripcio(conflicte.baseRevision, conflicte.remoteRevision)}
      accions={(
        <>
          <Boto varietat="secundari" onClick={() => decidix('remot')} disabled={ocupat}>{tx.conflicteDescarta}</Boto>
          <Boto varietat="perill" onClick={() => decidix('meu')} disabled={ocupat} carregant={ocupat}>{tx.conflicteConserva}</Boto>
        </>
      )} />
  );
}

/** Un resum mai entra en l’editor com si tinguera un cos buit editable.
 *  Gauntlet 261016 (Bloc 3.9; ordre del Mestre: fora el peu «Ja publicat al
 *  Mur» de la vista d'edició) · Ja no rep ni passa la `seccio` de la carpeta:
 *  l'editor no fa cap peu (abans, Esmena 2 del pla 261007_1645). */
export default function NotesDetail({ activeNote }) {
  const { resolveNote, workspaceKey } = useNotesData();
  const tx = textosNotesDetail(useIdiomaNotes());
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
        setResult({ key, code: 'not-found', error: '' });
      }
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ key, code: 'error', error: error?.message || '' });
    });
    return () => controller.abort();
  }, [id, key, pending, resolveNote, attempt]);
  if (pending) {
    if (result?.key === key) {
      const missatge = result.code === 'not-found' ? tx.noDisponible : sanejaErrorNota(result.error, tx);
      return (
        <div role="alert" className="sdp-paragraf-centrat">
          <p>{missatge}</p>
          <Accions>
            <Boto varietat="secundari" onClick={() => setAttempt(value => value + 1)}>{tx.reintenta}</Boto>
          </Accions>
        </div>
      );
    }
    return <p role="status" className="sdp-paragraf-centrat">{tx.carregant}</p>;
  }
  /* D4 (excepció del Mestre, 260930; desfà T54) · Una connexió és una còpia
     editable: s'obri amb l'editor, com qualsevol nota, que ja en porta l'avís
     d'autoria i «Compartir» (NotesEditor). L'editor va DESPRÉS de resoldre la
     nota: en remot, el resum del llistat no porta `origen` i només arriba amb
     el cos complet. */
  return (
    <>
      <NotesEditor key={muntatge} activeNote={activeNote} />
      <DecisioConflicte note={activeNote} onDescartat={() => setMuntatge(value => value + 1)} tx={tx} />
    </>
  );
}
