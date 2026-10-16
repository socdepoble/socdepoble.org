/**
 * pobleOrganitzacio.js — El poble d'una organització (Gauntlet 261016, Bloc
 * 3.5.2; ordre del Mestre: «El poble és innegociable. Tota entitat creada o
 * mostrada ha de portar el seu poble»). Funció pura, sense xarxa ni React,
 * com correuOrganitzacio.js: la usen el formulari d'alta
 * (DialegNovaOrganitzacio.jsx), el domini (organizations.js · creaOrganitzacio),
 * l'adaptador remot (supabase/organizations.js · createOrganization) i
 * l'edició del Perfil (PerfilContext.jsx · guardarAjust i guardarCampPerfil).
 *
 * El poble es desa pel NOM (organizations.town_name, 2610081401), com
 * profiles.town_name. Una organització no naix sense poble ni el perd en
 * editar-la: el text buit ja no vol dir «sense poble», és un error amb un
 * missatge clar. El límit és el del CHECK del servidor
 * (organizations_town_name_llargaria), en caràcters de veres (char_length,
 * com T49): «🌾» és 1, no 2.
 */

export const MAXIM_NOM_POBLE = 120;
export const ERROR_SENSE_POBLE = 'Cada organització ha de tindre el seu poble: tria’n un.';
export const ERROR_POBLE_MASSA_LLARG = `El nom del poble pot tindre com a màxim ${MAXIM_NOM_POBLE} caràcters.`;

/** El nom del poble tal com es desa (sense espais als extrems), o llança un Error amb el missatge per a la persona. */
export function pobleDOrganitzacio(valor) {
  const nom = typeof valor === 'string' ? valor.trim() : '';
  if (!nom) throw new Error(ERROR_SENSE_POBLE);
  if ([...nom].length > MAXIM_NOM_POBLE) throw new Error(ERROR_POBLE_MASSA_LLARG);
  return nom;
}
