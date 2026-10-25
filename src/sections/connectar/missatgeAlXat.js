/**
 * missatgeAlXat.js — Un missatge al xat privat amb la persona o l'entitat
 * de /connectar (IDEA-14, Directiva del Mestre, 261024): l'avís de «Connectar amb {nom}» (abans «Seguir»)
 * (useSeguiment.js) i la sol·licitud de «Formar part de l'entitat»
 * (organitzacio/BlocFormarPart.jsx).
 *
 *   · La maquinària del xat que ja hi havia, sense cap còpia: creaFil (obri o
 *     troba el directe, crea_fil_directe) i sendChatMessage d'useXat, el
 *     mateix parell que useAplicaAbast. sendChatMessage passa per la porta
 *     de les normes de convivència (XatContext · enviaAmbNormes): si la
 *     persona les declina, llança un AbortError i no ix res.
 *   · 261024 correccions (R4-04) · Les normes, ABANS d'obrir la conversa,
 *     com useAplicaAbast: crea_fil_directe la fa aparéixer de seguida a la
 *     llista de l'altra banda (CA-4), i qui declina no ha de deixar-hi cap
 *     conversa buida. Declinades, torna { enviat: false, motiu: 'normes' }
 *     sense cridar creaFil. Sense proveïdor de moderació (useModeracio
 *     null), la porta de sendChatMessage és l'única, com abans.
 *   · Amb qui: el contacte de confiança (autorPerConnectar o
 *     perfilPerConnectar de ConnectarSection), mai l'URL. Amb interlocutor,
 *     el seu id (en llavor, el del padró que ja ha resolt directeAmb). Sense
 *     (l'entitat pilot, CA-1), el xat de Sóc de Poble que resol el port
 *     (useXatSocDePoble): l'id del seu enllaç /xat?amb=<id>, el mateix que
 *     XatSection passaria a creaFil.
 *   · Cap metadada: XatContext envia sempre `metadades: {}` i xat_envia les
 *     ignora des de 2610081543 (B08). L'estructura del missatge és el text.
 *
 * Torna `envia(text)` → { enviat, filId, ruta, motiu? }: `ruta` és la de la conversa
 * (/xat/<filId>) quan s'ha pogut obrir. Una conversa que no s'obri llança
 * (l'error del port); un missatge que no ix torna enviat: false (el xat el
 * conserva per a tornar-lo a provar).
 */
import { useCallback } from 'react';
import { useXat } from '../xat/XatContext.jsx';
import { useXatSocDePoble } from '../../components/PedraSeca/hooks/xatSocDePoble.js';
import { useModeracio } from '../../components/PedraSeca/hooks/moderacioDePoble.js';

/** L'id d'un enllaç /xat?amb=<id> (el del xat de Sóc de Poble), o null. */
export function ambDeLEnllac(href) {
  if (typeof href !== 'string' || !href.startsWith('/xat?')) return null;
  const amb = new URLSearchParams(href.slice('/xat?'.length)).get('amb');
  return amb && amb.trim() ? amb : null;
}

/** Amb qui s'obri la conversa: l'id per a creaFil, o null si no n'hi ha cap. */
async function ambQui(contacte, xatSocDePoble) {
  if (!contacte) return null;
  if (contacte.interlocutor) return String(contacte.interlocutor.id);
  if (xatSocDePoble?.href) return ambDeLEnllac(xatSocDePoble.href);
  if (typeof xatSocDePoble?.resol !== 'function') return null;
  const resolt = await xatSocDePoble.resol();
  return ambDeLEnllac(resolt?.href);
}

export function useMissatgeAlXat(contacte) {
  const { creaFil, sendChatMessage } = useXat();
  const xatSocDePoble = useXatSocDePoble();
  /* asseguraNormes és estable (ModeracioContext): no refà `envia`. */
  const asseguraNormes = useModeracio()?.asseguraNormes ?? null;
  return useCallback(async (text) => {
    const cos = String(text ?? '').trim();
    const amb = cos ? await ambQui(contacte, xatSocDePoble) : null;
    if (!amb || typeof creaFil !== 'function' || typeof sendChatMessage !== 'function') {
      return { enviat: false, filId: null, ruta: null };
    }
    if (typeof asseguraNormes === 'function' && !(await asseguraNormes())) {
      return { enviat: false, filId: null, ruta: null, motiu: 'normes' };
    }
    const filId = await creaFil(amb, null);
    if (!filId) return { enviat: false, filId: null, ruta: null };
    /* Gauntlet 261025_0545 (D2) · Qui ho demana espera la resposta (el botó
       ocupat): sense xarxa, els reintents de sempre i enviat: false, no
       l'espera de la xarxa de la conversa oberta (XC-03). */
    const enviats = await sendChatMessage({ id: filId }, cos, { esperaLaXarxa: false });
    return {
      enviat: Array.isArray(enviats) && enviats.length > 0,
      filId,
      ruta: `/xat/${encodeURIComponent(filId)}`
    };
  }, [contacte, xatSocDePoble, creaFil, sendChatMessage, asseguraNormes]);
}
