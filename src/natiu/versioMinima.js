/**
 * natiu/versioMinima.js — P0-23 (BOT-A2; Gauntlet Claude 261025_1705) · La
 * porta de versió mínima i recomanada de l'app nativa.
 *
 * En arrencar, l'entrada nativa pregunta al node, pel port neutral (capacitat
 * 'versioClient', contracte.js), quina és la versió mínima de la seua
 * plataforma que encara servix. Si la d'este codi (VERSIO_CLIENT_NATIU) és més
 * vella, entrada.jsx pinta CalActualitzar.jsx en lloc de l'App.
 *
 * FAIL-OPEN: sense la capacitat, sense resposta, amb un error o amb una
 * resposta que no s'entén, l'app entra com sempre. Mai a la web ni al connector
 * de WordPress: només ho crida l'entrada nativa, i només a iOS i Android.
 *
 * v1.2.16 · ZERO APK fora de botiga (Gauntlet v1.2.16, ronda 2, L3R2-03) · Els enllaços del
 * node (versio_minima_client) i del manifest passen per enllacDeLaPlataforma: a Android només
 * l'https de play.google.com; qualsevol altre, també un .apk, és ENLLAC_ANDROID_PLAY, i ni
 * «Cal actualitzar l'app» ni la barra no obrin mai un APK.
 */
import {
  ENLLAC_ANDROID_MARKET,
  ENLLAC_ANDROID_PLAY,
  ENLLAC_IOS_APP_STORE,
  enllacBotigaPerDefecte,
  enllacDeLaPlataforma,
  enllacSegur,
  obriBotigaActualitzacio
} from '../config/actualitzacioRecomanada.js';
import { VERSIO_CLIENT_NATIU } from '../data/contracte.js';
import { teCapacitat, versioMinimaClient } from '../data/backendPort.js';

export {
  ENLLAC_ANDROID_MARKET,
  ENLLAC_ANDROID_PLAY,
  ENLLAC_IOS_APP_STORE,
  enllacBotigaPerDefecte,
  enllacSegur,
  obriBotigaActualitzacio
};

const PLATAFORMES = new Set(['ios', 'android']);
const PORT = Object.freeze({ teCapacitat, versioMinimaClient });

/**
 * Resol en una sola crida del port l'estat de versió del client natiu (Onada R22 · T2):
 *   · `{ estat: 'bloquejada', versioMinima, enllac }` si `versio < versioMinima`;
 *   · `{ estat: 'recomanada', plataforma, versioRecomanada, enllac, marketUrl }`
 *     si `versio >= versioMinima` però hi ha una `versioRecomanada > versio`;
 *   · `null` si l'app està al dia, fora de plataforma nativa o en cas d'error (fail-open).
 */
export async function estatDeVersio({
  plataforma,
  config,
  versio = VERSIO_CLIENT_NATIU,
  port = PORT,
  fontViva = null
} = {}) {
  if (!PLATAFORMES.has(plataforma)) return null;
  try {
    if (port.teCapacitat('versioClient') !== true) return null;
    const minima = await port.versioMinimaClient(plataforma, config);
    const versioMinima = minima?.versioMinima;
    if (Number.isSafeInteger(versioMinima) && versioMinima > versio) {
      return {
        estat: 'bloquejada',
        versioMinima,
        enllac: enllacDeLaPlataforma(plataforma, minima.enllac)
      };
    }
    let versioRecomanada = Number.isSafeInteger(minima?.versioRecomanada) ? minima.versioRecomanada : null;
    let enllacViva = enllacDeLaPlataforma(plataforma, minima?.enllac);
    if (versioRecomanada === null && typeof fontViva === 'function') {
      try {
        const viva = await fontViva(plataforma);
        if (Number.isSafeInteger(viva?.versioRecomanada) && viva.versioRecomanada >= 1) {
          versioRecomanada = viva.versioRecomanada;
        }
        const canalEnllac = enllacDeLaPlataforma(plataforma, viva?.canals?.[plataforma]?.enllac ?? viva?.enllac);
        if (!enllacViva && canalEnllac) enllacViva = canalEnllac;
      } catch {
        // Silenciós: el manifest estàtic auxiliar mai bloqueja ni embruta l'arrencada.
      }
    }
    if (Number.isSafeInteger(versioRecomanada) && versioRecomanada > versio) {
      return {
        estat: 'recomanada',
        plataforma,
        versioRecomanada,
        enllac: enllacViva || enllacBotigaPerDefecte(plataforma),
        marketUrl: plataforma === 'android' ? ENLLAC_ANDROID_MARKET : null
      };
    }
    return null;
  } catch (error) {
    console.warn('[natiu] No s’ha pogut saber la versió mínima; l’app entra igual:', error?.message ?? error);
    return null;
  }
}

/**
 * Si cal bloquejar l'app: { versioMinima, enllac } quan la versió d'este codi
 * és més vella que la mínima de la plataforma; null en qualsevol altre cas.
 */
export async function bloqueigDeVersio(opcions = {}) {
  const resultat = await estatDeVersio(opcions);
  return resultat?.estat === 'bloquejada'
    ? { versioMinima: resultat.versioMinima, enllac: resultat.enllac }
    : null;
}
