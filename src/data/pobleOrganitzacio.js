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

/* P1-11 (pla 261024_2230, T5B-01; reserva de Codex 1945: «listPublicOrganizations
   no admet town_name i talla a 500 abans d'un filtre local») · El poble d'un
   filtre del directori públic (listPublicOrganizations({ poble })): el NOM,
   el mateix que desa el selector (organizations.town_name), sense espais als
   extrems; null si no n'hi ha cap, i llavors no es filtra res. No llança: un
   filtre no és cap alta. */
export function pobleDelFiltre(valor) {
  if (typeof valor !== 'string') return null;
  const nom = valor.trim();
  return nom || null;
}

/** P1-11 · Si una fila del directori és del poble `nom` (pobleDelFiltre, ja retallat): igualtat exacta del valor DESAT, com el
 *  town_name=eq. del servidor (revisió adversarial 261024: el valor desat no es retalla, o local i remot divergirien). */
export function esDelPobleDelFiltre(fila, nom) {
  return Boolean(nom) && typeof fila?.town_name === 'string' && fila.town_name === nom;
}

/** P1-11 · Un nom de filtre que cap fila pot portar (passa del CHECK de la columna): la resposta és buida sense preguntar. */
export const esPobleImpossible = (nom) => [...String(nom ?? '')].length > MAXIM_NOM_POBLE;
