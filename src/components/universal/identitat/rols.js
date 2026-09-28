/**
 * rols.js — Les etiquetes dels rols d'una organització (T43, ordre del
 * Mestre, 260928). Font única per a la barra negra, el calaix d'identitats,
 * el selector de la barra taronja, el Perfil i la vista Connectar: abans
 * cada lloc tenia el seu mapa i els textos podien divergir.
 */

export const ETIQUETES_ROL = Object.freeze({
  owner: 'Propietari',
  admin: 'Administra',
  member: 'Membre'
});

/** Rols que administren (i poden signar en nom de) l'organització. */
export const ROLS_QUE_MANEN = Object.freeze(['owner', 'admin']);

/** L'etiqueta d'un rol, o null si el rol no és conegut. */
export function etiquetaDeRol(rol) {
  return Object.hasOwn(ETIQUETES_ROL, rol) ? ETIQUETES_ROL[rol] : null;
}

/** true si el rol administra l'organització (owner o admin). */
export function esRolQueMana(rol) {
  return ROLS_QUE_MANEN.includes(rol);
}
