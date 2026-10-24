/**
 * Plataforma d'Apps Enxufables · la FONT dels serveis neutrals de les apps
 * (T5, P1-07, 261024): hui, el servei de notícies del poble per al Lector.
 *
 * L'importa NOMÉS RutaApps.jsx, com fontSessio.js: ContenidorApp crida
 * useFontServeis(manifest) i passa el resultat a ProveidorApp (ContextApp.jsx),
 * i l'app el llig amb un ganxo pur de l'API pública (serveiNoticies.js ·
 * useServeiNoticies). Este mòdul NO és a la clausura de plataforma/index.js, ni
 * ha d'estar-hi (fronteres.test.js, serveiNoticies.test.jsx): importa el client
 * de dades (src/data/adaptadors/noticies/client.js) i la capa del paquet, que
 * cap app no pot veure (Model B: cap backend, cap xarxa, cap adreça a l'app).
 *
 * D'ON VE L'ORIGEN. Del backend segellat al paquet (capaDelPaquet(), decisions
 * A1 i A3 del Mestre, 261003): l'origen del seu `supabaseUrl`, i el camí de la
 * funció, /functions/v1/noticies (client.js · CAMI_NOTICIES). És l'únic origen
 * que admet la CSP de les apps natives (vite.natiu.config.js) i el mateix del
 * web i de l'element incrustat. Cap canal de l'amfitrió (atributs, config,
 * global) no el pot fixar: no hi ha cap servei d'amfitrió 'noticies-url'.
 *
 * A QUI ES DONA. Només a una app interna (origen 'interna'), pública
 * (permisos.veure 'public') i de la llista APPS_AMB_NOTICIES. Sense backend
 * remot (dataMode del paquet 'seed' o 'local') o amb un origen que no és https
 * (la Frontissa no l'admet), cap: el Lector diu que no hi ha cap font connectada.
 *
 * LES PROVES. Amb l'entorn de proves de ProveidorPlataforma (EntornContext, que
 * en producció és null), els serveis són els de `entorn.serveis` i cap més: una
 * prova no crea mai el client de veres ni toca la xarxa.
 *
 *   useFontServeis(manifest) · Object.freeze({ noticies }) o null; el mateix
 *                              objecte mentre no canvien el manifest ni l'entorn
 *   serveisDe(manifest, { capa, crea, substituts })  · la decisió, pura
 *
 * UN CLIENT PER SESSIÓ (261024 Lector, Gemini G2-03). El client de veres es crea
 * una sola vegada per origen i es torna a donar a cada muntatge del Lector:
 * l'estat del servei (GET /fonts) és d'una sessió de pàgina, no d'un muntatge,
 * i la cua de les fonts personals també. Un `crea` de prova no es guarda mai.
 */
import { useContext, useMemo } from 'react';
import { capaDelPaquet } from '../../config/capaDelPaquet.js';
import { creaServeiNoticies } from '../../data/adaptadors/noticies/client.js';
import { EntornContext } from './ContextApp.jsx';

/** Les apps que reben el servei de notícies. Afegir-n'hi una és decisió del Mestre. */
export const APPS_AMB_NOTICIES = Object.freeze(['lector']);
const MODES_SENSE_SERVIDOR = new Set(['seed', 'local']);
/* origen → el client de veres d'esta pàgina (vegeu la capçalera). */
const CLIENTS_DE_LA_SESSIO = new Map();

/* El client de veres d'un origen, el mateix tota la sessió; un `crea` de prova, cada vegada. */
function clientDe(crea, apiOrigin) {
  if (crea !== creaServeiNoticies) return crea({ apiOrigin });
  if (!CLIENTS_DE_LA_SESSIO.has(apiOrigin)) CLIENTS_DE_LA_SESSIO.set(apiOrigin, creaServeiNoticies({ apiOrigin }));
  return CLIENTS_DE_LA_SESSIO.get(apiOrigin);
}

/** L'origen https del backend de la capa, o null. */
export function origenDelBackend(capa) {
  const valor = capa?.supabaseUrl;
  if (typeof valor !== 'string' || !valor.trim()) return null;
  try {
    const url = new URL(valor.trim());
    return url.protocol === 'https:' && !url.username && !url.password ? url.origin : null;
  } catch {
    return null;
  }
}

const esApp = (manifest) => Boolean(manifest) && manifest.origen === 'interna' && manifest.permisos?.veure === 'public'
  && APPS_AMB_NOTICIES.includes(manifest.id);

/**
 * Els serveis de l'app, o null. `substituts` (les proves): si hi és (també null), mana
 * i no es crea res; els serveis que porta passen pel mateix criteri d'app.
 */
export function serveisDe(manifest, { capa = null, crea = creaServeiNoticies, substituts } = {}) {
  if (!esApp(manifest)) return null;
  if (substituts !== undefined) {
    const noticies = substituts?.noticies ?? null;
    return noticies ? Object.freeze({ noticies }) : null;
  }
  const delPaquet = capa || capaDelPaquet();
  if (MODES_SENSE_SERVIDOR.has(delPaquet?.dataMode)) return null;
  const apiOrigin = origenDelBackend(delPaquet);
  if (!apiOrigin) return null;
  try {
    return Object.freeze({ noticies: clientDe(crea, apiOrigin) });
  } catch {
    return null;
  }
}

/** Dins de ContenidorApp (RutaApps.jsx): els serveis de l'app que es munta. */
export function useFontServeis(manifest) {
  const entorn = useContext(EntornContext);
  return useMemo(
    () => serveisDe(manifest, entorn ? { substituts: Object.hasOwn(entorn, 'serveis') ? entorn.serveis : null } : {}),
    [manifest, entorn]
  );
}
