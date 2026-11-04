/**
 * rolsDInclusio.js — Els tres rols de la tria de /connectar (FEDI-22, ordre
 * del Mestre, 261103): «Administrador», «Treballador / Soci» i «Usuari /
 * Membre». Lògica pura, amb `t` opcional (la reserva és el valor valencià).
 *
 *   · Sense la capacitat 'connexionsPubliques' (FEDI-23, Codex), el servidor
 *     només admet owner, admin i member (organization_memberships.role;
 *     desa_membre_organitzacio i membreDOrganitzacio rebutgen qualsevol
 *     altre). Cap opció que el servidor rebutge ni que enganye:
 *       · «Administrador» → 'admin': només el dona la propietària, i sempre
 *         amb confirmació (dona poders reals: fitxa, membres, xat i publicar).
 *       · «Treballador / Soci» no té cap valor al servidor: en la inclusió és
 *         una ràdio desactivada amb el motiu; mai es tradueix a 'admin' ni es
 *         desa en silenci com a 'member'. En la sol·licitud a una entitat, és
 *         només text del missatge.
 *       · «Usuari / Membre» → 'member', l'opció per defecte (1 clic).
 *   · Amb `ambFuncions` (el servidor té les connexions de FEDI-23 i ho ha
 *     confirmat una lectura: useIncloureEnEntitat), «Treballador / Soci» és
 *     una opció activa més, sense autoritat: inclouPersonaEnEntitat la desa
 *     com a pertinença de membre amb la funció a part.
 *   · Des de /connectar no es degrada mai ningú, ni es toca la propietària:
 *     això és del Perfil («Membres i connexions»).
 */

const senseTraductor = (_clau, reserva) => reserva;
const text = (t, parell) => (typeof t === 'function' ? t : senseTraductor)(...parell);

/* Parells [clau i18n, reserva]: la reserva és el valor de ca.js, lletra per lletra. */
export const TEXTOS_ROL = Object.freeze({
  admin: Object.freeze(['section.connectar.rol.admin', 'Administrador']),
  treballador: Object.freeze(['section.connectar.rol.treballador', 'Treballador / Soci']),
  member: Object.freeze(['section.connectar.rol.membre', 'Usuari / Membre']),
  adminAjuda: Object.freeze(['section.connectar.rol.adminAjuda', 'Gestiona la fitxa, els membres i el xat de l’entitat, i pot publicar en el seu nom.']),
  adminNomesPropietaria: Object.freeze(['section.connectar.rol.adminNomesPropietaria', 'Només la propietària de l’entitat nomena administradores.']),
  membreAjuda: Object.freeze(['section.connectar.rol.membreAjuda', 'Consta a la llista de membres, sense cap permís de gestió.']),
  treballadorAjuda: Object.freeze(['section.connectar.rol.treballadorAjuda', 'Hi treballa o n’és sòcia: consta a la llista de membres, sense cap permís de gestió.']),
  treballadorPendent: Object.freeze(['section.connectar.rol.treballadorPendent', 'Encara no es pot desar: el servidor del poble només distingix administradores i membres.']),
  treballadorDemana: Object.freeze(['section.connectar.rol.treballadorDemana', 'Qui l’administra decidirà amb quin rol t’hi dona d’alta.'])
});

/** L'ordre de la tria, tal com el va dir el Mestre. */
export const ROLS_DE_LA_VISTA = Object.freeze(['admin', 'treballador', 'member']);
export const ROL_PER_DEFECTE = 'member';
/* Els únics rols que /connectar escriu mai; «treballador», només amb `ambFuncions`. */
const ROLS_QUE_S_ESCRIUEN = Object.freeze(['member', 'admin']);
const ROLS_AMB_FUNCIONS = Object.freeze(['member', 'admin', 'treballador']);
export const rolsQueEsPodenEscriure = (ambFuncions = false) => (ambFuncions === true ? ROLS_AMB_FUNCIONS : ROLS_QUE_S_ESCRIUEN);

/** L'etiqueta visible d'un rol de la tria, traduïda. */
export function etiquetaDeRol(rol, t) {
  return Object.hasOwn(TEXTOS_ROL, rol) && ROLS_DE_LA_VISTA.includes(rol) ? text(t, TEXTOS_ROL[rol]) : '';
}

/**
 * Les opcions de GrupOpcions per a INCLOURE una persona en una entitat teua.
 * Amb un rol actual (ja hi és), cap: el que s'hi pot fer ho diu accioDInclusio.
 * `rolPropi`: el de qui mira en l'entitat triada ('owner' | 'admin').
 * `ambFuncions`: el servidor desa «Treballador / Soci» (FEDI-23).
 */
export function opcionsDeRol({ rolPropi = null, rolActual = null, t, ambFuncions = false } = {}) {
  if (rolActual != null) return [];
  const propietaria = rolPropi === 'owner';
  return [
    {
      valor: 'admin', etiqueta: text(t, TEXTOS_ROL.admin), desactivada: !propietaria,
      ajuda: text(t, propietaria ? TEXTOS_ROL.adminAjuda : TEXTOS_ROL.adminNomesPropietaria)
    },
    ambFuncions === true
      ? { valor: 'treballador', etiqueta: text(t, TEXTOS_ROL.treballador), ajuda: text(t, TEXTOS_ROL.treballadorAjuda) }
      : { valor: 'treballador', etiqueta: text(t, TEXTOS_ROL.treballador), desactivada: true, ajuda: text(t, TEXTOS_ROL.treballadorPendent) },
    { valor: 'member', etiqueta: text(t, TEXTOS_ROL.member), ajuda: text(t, TEXTOS_ROL.membreAjuda) }
  ];
}

/**
 * Les opcions per a DEMANAR formar part d'una entitat (BlocFormarPart): les
 * tres actives, perquè el rol només viatja com a text de la sol·licitud.
 * C12 · L'ajuda d'«Administrador» diu els poders i qui el dona, en dues
 * frases senceres.
 */
export function opcionsDeRolDemanat(t) {
  return [
    { valor: 'admin', etiqueta: text(t, TEXTOS_ROL.admin), ajuda: `${text(t, TEXTOS_ROL.adminAjuda)} ${text(t, TEXTOS_ROL.adminNomesPropietaria)}` },
    { valor: 'treballador', etiqueta: text(t, TEXTOS_ROL.treballador), ajuda: text(t, TEXTOS_ROL.treballadorDemana) },
    { valor: 'member', etiqueta: text(t, TEXTOS_ROL.member), ajuda: text(t, TEXTOS_ROL.membreAjuda) }
  ];
}

/**
 * Què es pot escriure des d'ací, o null si res:
 *   · { tipus: 'alta', rol: 'member', confirma: false } · 1 clic.
 *   · { tipus: 'alta', rol: 'admin', confirma: true } · només la propietària.
 *   · { tipus: 'ascens', rol: 'admin', confirma: true } · de membre a
 *     administradora, només la propietària.
 *   · { tipus: 'alta', rol: 'treballador', confirma: false } · 1 clic, només
 *     amb `ambFuncions`; sense, «Treballador / Soci» no s'escriu mai.
 * Ja propietària o administradora: res (mai es degrada des d'ací). Ja membre
 * (sense administrar), la funció no es canvia des d'ací: és del Perfil.
 */
export function accioDInclusio({ rolActual = null, rolPropi = null, rolTriat = ROL_PER_DEFECTE, ambFuncions = false } = {}) {
  const propietaria = rolPropi === 'owner';
  let accio = null;
  if (rolActual === 'member') {
    accio = propietaria ? { tipus: 'ascens', rol: 'admin', confirma: true } : null;
  } else if (rolActual == null) {
    if (rolTriat === 'member') accio = { tipus: 'alta', rol: 'member', confirma: false };
    else if (rolTriat === 'treballador') accio = { tipus: 'alta', rol: 'treballador', confirma: false };
    else if (rolTriat === 'admin' && propietaria) accio = { tipus: 'alta', rol: 'admin', confirma: true };
  }
  return accio && rolsQueEsPodenEscriure(ambFuncions).includes(accio.rol) ? accio : null;
}
