/**
 * useAplicaAbast.js — Executa la visibilitat triada d'una connexió ja
 * guardada (T43, ordre del Mestre, 260928).
 *
 *   · Persones: obri (o reprén) la conversa amb cada persona i li envia
 *     l'enllaç. Grups: envia l'enllaç a cada grup de xat. Tot el poble: no
 *     fa res sol; la persona la compartix al Mur des del lector del MAS
 *     («Compartir al Mur», notes/ConnexioDetall.jsx, T54).
 *   · En SÈRIE: el servidor té límit de freqüència al xat i una ràfega el
 *     faria rebutjar. Una fallada no n'atura cap altra: cada destinatari té
 *     el seu resultat.
 *   · Al final apunta a la nota què s'ha fet (origen.abast.aplicat). Si això
 *     falla, els enviaments ja han eixit: es diu, no s'amaga.
 *
 * Model B: parla amb useXat i useNotesData, mai amb Supabase. Cap capacitat
 * nova: creaFil i sendChatMessage ja són del nucli del xat.
 *
 * Fase D (261020, tasca 2; pla 261020_1300 · Google Play UGC; crítica
 * 261020, 1) · Abans de cap enviament, les normes de convivència UNA sola
 * vegada (useModeracio · asseguraNormes): si la persona les declina, no ix
 * res i cada destinatari queda «pendent», amb el motiu. Sense això, la porta
 * de XatContext obriria el diàleg una vegada per destinatari.
 */
import { useCallback } from 'react';
import { useXat } from '../xat/XatContext.jsx';
import { useNotesData } from '../notes/NotesDataContext';
import { useModeracio } from '../../components/PedraSeca/hooks/moderacioDePoble.js';
import { TEXTOS_MODERACIO } from '../../components/PedraSeca/organismes/textosModeracio.js';
import { normalitzaAbast } from '../../data/origenNota.js';
import { aplicatDe, passosDAplicacio } from './abastConnexio.js';

const NO_ENVIAT = 'No s’ha enviat. El trobaràs al xat per a tornar-ho a provar.';
/* Fase D (261020, tasca 2) · La reserva valenciana, com la resta de detalls d'ací. */
const CAL_ACCEPTAR = TEXTOS_MODERACIO.calAcceptar[1];

async function executaPas(pas, missatge, { creaFil, sendChatMessage }) {
  const { tipus, desti } = pas;
  const base = { clau: `${tipus}:${desti.id}`, tipus, id: desti.id, nom: desti.nom };
  if (tipus === 'mur') {
    return { ...base, estat: 'pendent', detall: 'Obri la connexió a les teues notes i prem «Compartir al Mur»: la veurà la gent registrada del poble, no Internet.' };
  }
  try {
    let filId = desti.id;
    if (tipus === 'xat-persona') {
      filId = desti.filId || await creaFil(desti.id, null);
      if (!filId) return { ...base, estat: 'error', detall: 'No s’ha pogut obrir la conversa.' };
    }
    /* sendChatMessage torna el missatge desat o [] si no ha eixit. Fase D
       (261020, tasca 2) · Només llança (AbortError) si es declinen les
       normes, i això ja s'ha preguntat abans del primer pas (aplica).
       Gauntlet 261025_0545 (D2) · Sense esperar la xarxa (XC-03 és per a la
       conversa oberta): sense cobertura, els reintents de sempre i 'error',
       i el destinatari següent i la nota no es queden esperant. */
    const enviats = await sendChatMessage({ id: filId }, missatge, { esperaLaXarxa: false });
    const fet = Array.isArray(enviats) && enviats.length > 0;
    return { ...base, estat: fet ? 'fet' : 'error', detall: fet ? 'Enviat per xat.' : NO_ENVIAT };
  } catch (error) {
    return { ...base, estat: 'error', detall: error?.message || NO_ENVIAT };
  }
}

export function useAplicaAbast() {
  const { creaFil, sendChatMessage } = useXat();
  const { updateNote } = useNotesData();
  /* asseguraNormes és estable (ModeracioContext): no refà `aplica`. */
  const asseguraNormes = useModeracio()?.asseguraNormes ?? null;

  /**
   * `nota`: la connexió acabada de crear. `origen`: el que s'hi ha desat.
   * `abast`: la tria sense normalitzar (pot portar filId del padró).
   * `missatge`: el text del xat. Torna { resultats } amb un element per pas.
   */
  const aplica = useCallback(async ({ nota, origen, abast, missatge }) => {
    const passos = passosDAplicacio(abast);
    /* Fase D (261020, tasca 2) · Les normes, una sola vegada i abans de res. */
    if (asseguraNormes && passos.some((pas) => pas.tipus !== 'mur') && !(await asseguraNormes())) {
      return {
        resultats: passos.map(({ tipus, desti }) => ({
          clau: `${tipus}:${desti.id}`, tipus, id: desti.id, nom: desti.nom, estat: 'pendent', detall: CAL_ACCEPTAR
        }))
      };
    }
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
  }, [creaFil, sendChatMessage, updateNote, asseguraNormes]);

  return { aplica };
}
