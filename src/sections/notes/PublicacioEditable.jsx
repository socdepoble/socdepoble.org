/**
 * PublicacioEditable.jsx — P0-25 / IDEA-96 (Onada R6, Bloc 1; ordre del
 * Mestre) · Una publicació pròpia del Mur o de l'agenda oberta al Bloc de
 * Notes s'edita viva: el mateix editor de notes (NotesEditor: TipTap,
 * «Edició avançada» i el selector amb «Actualitzar al Mur»), sense el peu
 * «Ja publicat al Mur».
 *
 * Obrir-la no crea res: l'editor escriu en una nota en memòria
 * (publicacioEditable.js · notaDeLaPublicacio), i el Bloc no s'omple de notes
 * buides. «Actualitzar al Mur» fa servir el camí de sempre:
 *  · en seed o local, el publishNote de sempre, que ho rebutja amb el motiu
 *    del mode de proves (res creat ni enviat);
 *  · una fila del Mur amb id de servidor s'adopta: una nota nova (creaNota),
 *    lligada a la fila (updateNote: publishedSubmissionId, isPublished) i
 *    publicada amb publishNote, que fa l'upsert amb el MATEIX id. Cap
 *    duplicat: la publicació virtual ix del Bloc (publicadesDesDeNotes) i la
 *    selecció passa a la nota, que ja és la peça editable;
 *  · la llavor editorial (sense UUID) o un acte (P0-25, Onada R6, Bloc 2):
 *    una revisió editorial al navegador (data/revisionsEditorials.js) amb els
 *    camps canviats, que el Mur, l'agenda, el detall i les rutes dedicades
 *    pinten a l'instant. Cap nota creada ni cap fila escrita.
 * Les guardes de publishNote (només lectura, signatura aliena i, per a una
 * fila, canvi de secció: NotesContext · rebuigDePublicacio) van ABANS
 * d'adoptar o de desar: un rebuig no deixa cap nota lligada.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { useSearchParams } from '../../app/contexts/RouterContext';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { escriuSeleccio } from '../../components/universal/workspace/seleccioUrl.js';
import { useNotes } from './NotesContext.jsx';
import { NotesContext } from './objectesDeContext.js';
import NotesEditor from './NotesEditor.jsx';
import { bgSaveManager } from './GlobalSaveManager.js';
import { CLAUS_BLOC } from './modeDesa.js';
import { nouIdDeNota } from './notaPreparada.js';
import { ErrorPublicacio } from './visibilitatNota.js';
import { ErrorIdentitatDeLectura } from '../../app/contexts/identitatDeReserva.js';
import { avisDeLaRevisioEditorial, desaRevisioEditorialAmbServidor, rebutjadaPelServidor } from '../../data/revisionsEditorials.js';
import { useIdentitatOReserva } from '../../app/contexts/useIdentitatOReserva.js';
import { useSuperadminEstable } from '../../hooks/useSuperadminEstable.js';
import {
  avisRevisioDesada, campsDeLAdopcio, campsDeLaRevisio, esFilaActualitzable, esRevisioEditorial, motiuNoActualitzable, motiuPublicacioDAltri,
  notaDeLaPublicacio
} from './publicacioEditable.js';

const MODES_LOCALS = new Set(['seed', 'local']);

export function PublicacioEditable({ item }) {
  const base = useNotes();
  const [params, setParams] = useSearchParams();
  const { showToast } = useToast();
  /* D-R6-1 (Bloc 3) · Qui signa i si és superadmin, per a la guarda dels actes. */
  const { actor } = useIdentitatOReserva();
  const { esSuperadmin } = useSuperadminEstable();
  const inicial = useMemo(() => notaDeLaPublicacio(item), [item]);
  /* L'esborrany, per publicació: una altra publicació oberta torna a partir
     de la seua; una recàrrega de la font (mateix id) no el xafa. */
  const [estat, setEstat] = useState(() => ({ clau: inicial.id, nota: inicial }));
  if (estat.clau !== inicial.id) setEstat({ clau: inicial.id, nota: inicial });
  const nota = estat.clau === inicial.id ? estat.nota : inicial;
  const viva = useRef(nota);
  viva.current = nota;
  /* La nota adoptada ({ id, revision, lligada }): un reintent no en crea cap altra. */
  const adoptada = useRef(null);

  const escriu = useCallback((id, camp, valor) => {
    if (String(id) !== viva.current.id) return;
    const nova = { ...viva.current, [camp]: valor, ...(camp === 'heroImage' ? { coverImage: valor || undefined } : null) };
    viva.current = nova;
    setEstat((previ) => (previ.clau === nova.id ? { ...previ, nota: nova } : previ));
  }, []);

  const publica = useCallback(async (doc) => {
    /* El document visible (també els canvis que encara no han passat pel canal). */
    const actual = doc && String(doc.id) === viva.current.id ? { ...viva.current, ...doc } : viva.current;
    // D-7 · Amb la reserva de només lectura, res (publishNote rebutja igual).
    if (base?.nomesLectura) throw new ErrorIdentitatDeLectura();
    if (esRevisioEditorial(item)) {
      /* La signatura aliena, com publishNote; una revisió no canvia de secció.
         D-B4-1 (Bloc 4; decisió de MarIA) · Una revisió conserva l'autoria:
         el superadmin estable la pot fer sobre una peça d'altri, del Mur o de
         l'agenda; un usuari ordinari, no. */
      const rebuig = base?.rebuigDePublicacio?.(actual, { seccio: false, esSuperadmin });
      if (rebuig) throw rebuig;
      /* D-R6-1 (Bloc 3) · La de publishNote no troba mai un acte (ni una peça
         fora de la finestra carregada): ací, amb la peça oberta i la mateixa
         funció pura. */
      const motiuAlie = motiuPublicacioDAltri(item, { actor, config: base?.config, esSuperadmin, t: base?.t });
      if (motiuAlie) {
        showToast(motiuAlie, 'info');
        throw new ErrorPublicacio(motiuAlie);
      }
      const { seccio, item: publicacio } = item.data;
      const camps = campsDeLaRevisio(inicial, actual);
      /* R12 (B4-S1) · Primer al navegador, sempre; al servidor només si el backend
         anuncia edicioEditorial i qui desa és superadmin (revisionsEditorials.js). */
      const resultat = Object.keys(camps).length
        ? await desaRevisioEditorialAmbServidor(seccio, publicacio, camps, { esSuperadmin, config: base?.config })
        : null;
      if (resultat && !resultat.desada) {
        const motiu = motiuNoActualitzable(item, base?.t);
        showToast(motiu, 'info');
        throw new ErrorPublicacio(motiu);
      }
      showToast(resultat?.desti === 'servidor' || rebutjadaPelServidor(resultat) ? avisDeLaRevisioEditorial(resultat, base?.t) : avisRevisioDesada(base?.t),
        rebutjadaPelServidor(resultat) ? 'info' : 'success');
      return true;
    }
    if (MODES_LOCALS.has(base?.config?.dataMode)) return base.publishNote(actual);
    if (!esFilaActualitzable(item)) {
      const motiu = motiuNoActualitzable(item, base?.t);
      showToast(motiu, 'info');
      throw new ErrorPublicacio(motiu);
    }
    if (typeof base?.creaNota !== 'function' || typeof base?.updateNote !== 'function') return false;
    /* Les guardes de publishNote abans d'adoptar: un rebuig no deixa cap nota lligada. */
    const rebuig = base?.rebuigDePublicacio?.(actual);
    if (rebuig) throw rebuig;
    const { creacio, lligam } = campsDeLAdopcio(actual);
    if (!adoptada.current) {
      const creada = await base.creaNota({ ...creacio, id: nouIdDeNota() });
      adoptada.current = { id: String(creada.id), revision: creada.revision ?? 0, lligada: false };
    }
    if (!adoptada.current.lligada) {
      const { id, revision } = adoptada.current;
      const desada = await base.updateNote(id, lligam, revision);
      adoptada.current = { id, revision: desada?.revision ?? revision + 1, lligada: true };
      /* La cua de desat ha de partir de la revisió lligada, encara que la
         llista viva no porte la nota fins a la pintada següent. */
      if (base.scopeKey) bgSaveManager.setRevision(base.scopeKey, id, adoptada.current.revision);
    }
    const { id, revision } = adoptada.current;
    /* La publicació virtual ja ix del Bloc: la selecció passa a la nota. */
    setParams(escriuSeleccio(params, { item: id }, CLAUS_BLOC), { replace: true });
    return base.publishNote({ ...actual, id, revision, publishedSubmissionId: actual.publishedSubmissionId, isPublished: true });
  }, [actor, base, esSuperadmin, inicial, item, params, setParams, showToast]);

  const valor = useMemo(() => (base ? {
    ...base,
    setLocalNoteField: escriu,
    saveNoteField: (id, camp, nou) => {
      escriu(id, camp, nou);
      return Promise.resolve(true);
    },
    publishNote: publica,
    compartirNota: null,
    canviaEstatPublicacio: undefined,
    mouNota: undefined,
    esborraNota: undefined,
    potEsborrar: false
  } : null), [base, escriu, publica]);

  if (!valor) return null;
  return (
    <NotesContext.Provider value={valor}>
      <NotesEditor key={nota.id} activeNote={nota} />
    </NotesContext.Provider>
  );
}

export default PublicacioEditable;
