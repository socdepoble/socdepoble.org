/**
 * Lector de notícies · els identificadors (nucli pur).
 *
 * L'id d'un article és DETERMINISTA: el mateix article del mateix feed té
 * sempre el mateix id, llija'l qui el llija i quan siga. Així «llegit» i «per
 * a després» sobreviuen a cada lectura del feed. Es fa amb FNV-1a de 64 bits
 * (dos de 32 amb llavors diferents) sobre el guid, l'enllaç o, si no n'hi ha,
 * el títol i la data. No és criptogràfic ni ho necessita: només distingix.
 *
 *   <font>-<16 xifres hex>   p. ex. «veu-placa-3f9a0c17b2e4d851»
 * Passa esIdOpac de la plataforma (minúscules, xifres, «-» i «_», ≤ 64):
 * va a la URL (?article=) tal qual.
 */

/** El mateix patró que esIdOpac (plataforma/rutesAplicacio.js): analitzador.test.js ho comprova (describe «ids»). */
export const PATRO_ID = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const MAX_PREFIX = 40;

/** Un id opac vàlid per a la URL. */
export const esIdLector = (valor) => typeof valor === 'string' && PATRO_ID.test(valor);

function fnv1a(text, llavor) {
  let hash = llavor >>> 0;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

const hex8 = (n) => n.toString(16).padStart(8, '0');

/** 16 xifres hexadecimals deterministes d'un text. */
export function empremta(text) {
  const valor = String(text ?? '');
  return hex8(fnv1a(valor, 0x811c9dc5)) + hex8(fnv1a(valor, 0x9dc5811c));
}

/** L'id d'un article: el prefix de la font (si és vàlid) i l'empremta de la clau. */
export function idArticle(fontId, clau) {
  const prefix = esIdLector(fontId) && fontId.length <= MAX_PREFIX ? fontId : 'a';
  return `${prefix}-${empremta(clau)}`;
}
