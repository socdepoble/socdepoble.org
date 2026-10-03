/**
 * Lector de notícies · les adreces d'un feed (nucli pur).
 *
 * Una adreça de fora només entra a l'app absoluta, d'un protocol de la
 * llista i sense credencials. Les relatives es resolen contra la base que es
 * passa (l'enllaç de l'article o del feed); sense base, una relativa no
 * entra. El parser és el WHATWG (URL): lleva tabuladors i salts de dins
 * («java\nscript:» és «javascript:») i mai no executa res.
 */
import { netejaText } from './entitats.js';

export const PROTOCOLS_WEB = Object.freeze(['http:', 'https:']);
export const PROTOCOLS_ENLLAC = Object.freeze(['http:', 'https:', 'mailto:']);
export const MAX_URL = 2048;

/* Una base només val si és web i absoluta. */
function baseValida(base) {
  if (typeof base !== 'string' || base === '') return undefined;
  try {
    const url = new URL(base);
    return PROTOCOLS_WEB.includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/**
 * L'adreça absoluta i normalitzada, o null si no és d'un protocol permés,
 * porta usuari o contrasenya, no es pot resoldre o és massa llarga.
 */
export function urlAbsoluta(valor, base = null, protocols = PROTOCOLS_WEB) {
  if (typeof valor !== 'string') return null;
  const net = netejaText(valor).trim();
  if (net === '' || net.length > MAX_URL) return null;
  let url;
  try {
    url = new URL(net, baseValida(base));
  } catch {
    return null;
  }
  if (!protocols.includes(url.protocol) || url.username !== '' || url.password !== '') return null;
  return url.href.length > MAX_URL ? null : url.href;
}
