/**
 * useAplicaAbast.js — Executa la visibilitat triada d'una connexió ja
 * guardada (T43, ordre del Mestre, 260928).
 *
 *   · Persones: obri (o reprén) la conversa amb cada persona i li envia
 *     l'enllaç. Grups: envia l'enllaç a cada grup de xat. Tot el poble: no
 *     fa res sol; la persona la compartix al Mur des del MAS (flux T5).
 *   · En SÈRIE: el servidor té límit de freqüència al xat i una ràfega el
 *     faria rebutjar. Una fallada no n'atura cap altra: cada destinatari té
 *     el seu resultat.
 *   · Al final apunta a la nota què s'ha fet (origen.abast.aplicat). Si això
 *     falla, els enviaments ja han eixit: es diu, no s'amaga.
 *
 * Model B: parla amb useXat i useNotesData, mai amb Supabase. Cap capacitat
 * nova: creaFil i sendChatMessage ja són del nucli del xat.
 */
import { useCallback } from 'react';
import { useXat } from '../xat/XatContext.jsx';
import { useNotesData } from '../notes/NotesDataContext';
import { normalitzaAbast } from '../../data/origenNota.js';
import { aplicatDe, passosDAplicacio } from './abastConnexio.js';

const NO_ENVIAT = 'No s’ha enviat. El trobaràs al xat per a tornar-ho a provar.';

async function executaPas(pas, missatge, { creaFil, sendChatMessage }) {
  const { tipus, desti } = pas;
  const base = { clau: `${tipus}:${desti.id}`, tipus, id: desti.id, nom: desti.nom };
  if (tipus === 'mur') {
    return { ...base, estat: 'pendent', detall: 'Obri la connexió al teu MAS i prem «Compartir»: la veurà la gent registrada del poble, no Internet.' };
  }
  try {
    let filId = desti.id;
    if (tipus === 'xat-persona') {
      filId = desti.filId || await creaFil(desti.id, null);
      if (!filId) return { ...base, estat: 'error', detall: 'No s’ha pogut obrir la conversa.' };
    }
    // sendChatMessage no llança: torna el missatge desat o [] si no ha eixit.
    const enviats = await sendChatMessage({ id: filId }, missatge);
    const fet = Array.isArray(enviats) && enviats.length > 0;
    return { ...base, estat: fet ? 'fet' : 'error', detall: fet ? 'Enviat per xat.' : NO_ENVIAT };
  } catch (error) {
    return { ...base, estat: 'error', detall: error?.message || NO_ENVIAT };
  }
}

export function useAplicaAbast() {
  const { creaFil, sendChatMessage } = useXat();
  const { updateNote } = useNotesData();

  /**
   * `nota`: la connexió acabada de crear. `origen`: el que s'hi ha desat.
   * `abast`: la tria sense normalitzar (pot portar filId del padró).
   * `missatge`: el text del xat. Torna { resultats } amb un element per pas.
   */
  const aplica = useCallback(async ({ nota, origen, abast, missatge }) => {
    const passos = passosDAplicacio(abast);
    const resultats = [];
    for (const pas of passos) {
      resultats.push(await executaPas(pas, missatge, { creaFil, sendChatMessage }));
    }

    const hiHaEnviaments = passos.some((pas) => pas.tipus !== 'mur');
    if (hiHaEnviaments && nota?.id != null && typeof updateNote === 'function') {
      try {
        const abastNet = normalitzaAbast(abast) || { mode: 'privada', persones: [], grups: [] };
        await updateNote(nota.id, { origen: { ...origen, abast: { ...abastNet, aplicat: aplicatDe(resultats) } } }, nota.revision ?? 0);
      } catch {
        resultats.push({
          clau: 'registre', tipus: 'registre', id: 'registre', nom: 'Registre a la nota', estat: 'error',
          detall: 'Els enviaments ja han eixit, però la nota no ha pogut apuntar-los.'
        });
      }
    }
    return { resultats };
  }, [creaFil, sendChatMessage, updateNote]);

  return { aplica };
}
