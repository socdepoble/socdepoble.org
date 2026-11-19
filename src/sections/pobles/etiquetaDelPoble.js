/**
 * etiquetaDelPoble.js · R22 (Llibre Mestre, «4a Etiqueta Geogràfica Final»)
 * · L'última pastilla d'una targeta i de la seua pàgina és la del poble des
 * d'on es publica, i porta a la pàgina del poble (/pobles/<slug>). La barra
 * taronja porta al perfil de qui ven o signa, no al poble: per això cal esta
 * pastilla al final.
 *
 *   · nomDeLEtiquetaDelPoble: el text de la pastilla. Si la fitxa del poble
 *     porta el camp `etiqueta_curta_poble` (un nom curt, «La Torre»), mana
 *     eixe; si no el porta, o és buit, només espais o massa llarg, el nom
 *     oficial de la fitxa («La Torre de les Maçanes»).
 *     Hui cap fitxa no el porta i ningú no el pot posar: les fitxes viuen a
 *     app_content(tenant, 'towns'), que només té polítiques de lectura, i la
 *     llavor (townsSeed.js) no el du. Fins que el Mestre decidisca on es desa
 *     i qui l'escriu (Llibre Mestre, R22: «l'administrador local de cada
 *     poble»), la pastilla mostra sempre el nom oficial.
 *   · etiquetaDelPoble: la pastilla enllaçada d'una fitxa de poble, o null
 *     si la fitxa no té un slug canònic o no té cap nom.
 *   · pobleDeLElement: la fitxa del poble d'una publicació, buscada NOMÉS
 *     dins de les fitxes de /pobles (useCoreContent · towns) amb la regla
 *     única de clauDelPoble.js (poble_id i, sense, el lloc de qui publica).
 *     El text de la pastilla no ve mai del payload de la publicació: només
 *     de la fitxa del poble, no de qui publica.
 *
 * Pur: sense React, sense xarxa i sense dades pròpies.
 */
import { slugDelPoble } from './nomsDelPoble.js';
import { clausDelPoble, pobleDeLaPublicacio } from './clauDelPoble.js';

/* Sostre de 60 caràcters, el que la fitxa de la tasca R22 proposava per a
   etiqueta_curta_poble (cap migració del repositori no l'aplica encara): un
   nom curt més llarg no és cap nom curt, i la pastilla torna a l'oficial. */
const LLARGARIA_MAXIMA = 60;

const textNet = (valor) => (typeof valor === 'string' ? valor.trim().replace(/\s+/g, ' ') : '');

/* Només un slug que ja és canònic (minúscules ASCII, xifres i guions): un
   valor que caldria netejar no es reescriu per a fer-ne una ruta. */
function slugCanonic(valor) {
  const text = textNet(valor);
  return text && slugDelPoble(text) === text ? text : null;
}

/** El text de la pastilla d'una fitxa de poble: el nom curt si la fitxa el porta o, sense, el nom oficial. '' sense nom. */
export function nomDeLEtiquetaDelPoble(poble) {
  if (!poble || typeof poble !== 'object') return '';
  const curta = textNet(poble.etiqueta_curta_poble);
  if (curta && curta.length <= LLARGARIA_MAXIMA) return curta;
  return textNet(poble.name) || textNet(poble.title);
}

/** La pastilla del poble ({ text, href, className }) d'una fitxa de /pobles, o null. */
export function etiquetaDelPoble(poble) {
  if (!poble || typeof poble !== 'object') return null;
  const slug = slugCanonic(poble.slug) || slugCanonic(poble.id);
  const text = nomDeLEtiquetaDelPoble(poble);
  return slug && text ? { text, href: `/pobles/${slug}`, className: 'sdp-badge-tag sp-card-label--enllac' } : null;
}

/** La fitxa de /pobles des d'on s'ha publicat `item`, o null si no n'hi ha cap que hi case. */
export function pobleDeLElement(item, towns) {
  if (!Array.isArray(towns) || !towns.length) return null;
  const clau = pobleDeLaPublicacio(item);
  if (!clau) return null;
  return towns.find((town) => clausDelPoble(town).includes(clau)) || null;
}
