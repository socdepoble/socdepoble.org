/**
 * personaDeSessio.js — Qui és la persona de la sessió: nom, foto i poble.
 *
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front A) · La barra negra
 * pintava una «S»: l'actor persona només llegia les metadades de GoTrue, i un
 * compte d'entrada amb contrasenya no hi porta ni nom ni foto (queia al
 * correu). Ara la persona es pinta amb la SEUA fila de public.profiles
 * (full_name, avatar_url, town_name), llegida pel port neutral
 * (backendPort.getProfile, AGENTS §8) des d'IdentitatContext.
 *
 * Les metadades continuen sent la reserva, i manen mentre la fila és d'abans
 * d'una edició: tota edició del perfil a l'app reescriu les metadades
 * (identitat.js, actualitzaUsuariSessio), i la `firma` ho detecta fins que
 * la fila nova arriba. Així la barra mai pinta una foto vella.
 *
 * Una fila no entra mai si:
 *   · és la de RESERVA (auth.js, getProfile: `reserva: true`), que només és
 *     la sessió reescrita i no diu res que les metadades no diguen;
 *   · és d'un altre compte (fila.id ≠ usuari.id): una resposta tardana d'una
 *     sessió anterior no es barreja mai amb la d'ara (doctrina T47).
 *
 * Pur: sense React ni port (la mateixa capa que politicaRouter.js).
 */

/* U+0000: cap camp de text de la sessió no el porta, i dos camps no es poden
   confondre en ajuntar-los. */
const SEPARADOR = '\u0000';
const net = (valor) => (typeof valor === 'string' ? valor.trim() : '');
const metadadesDe = (usuari) => usuari?.user_metadata || {};

/* T43 (260928) · La cadena de sempre, mudada ací sense canvis des
   d'IdentitatContext: ara és la reserva quan no hi ha fila de perfil. */
export function nomDePersona(usuari) {
  const meta = metadadesDe(usuari);
  return meta.full_name || meta.name || usuari?.full_name || usuari?.email || 'El meu compte';
}
export function avatarDePersona(usuari) {
  const meta = metadadesDe(usuari);
  return meta.avatar_url || meta.picture || usuari?.avatar_url || null;
}

/**
 * Cadena determinista amb les dades d'identitat de la sessió. Canvia
 * exactament quan canvien: un altre compte o una edició del perfil a l'app.
 * Sense sessió, ''.
 */
export function firmaDePersona(usuari) {
  if (!usuari) return '';
  const meta = metadadesDe(usuari);
  return [
    usuari.id, meta.full_name, meta.name, meta.avatar_url, meta.picture, meta.town_name,
    usuari.full_name, usuari.avatar_url, usuari.email
  ].map((valor) => (valor == null ? '' : String(valor))).join(SEPARADOR);
}

/**
 * El perfil d'una fila de public.profiles, congelat, o null si la fila no és
 * de veres (cap, de reserva o d'un altre compte). `firma` és la de la sessió
 * amb què s'ha demanat: personaDeSessio la torna a mirar en pintar.
 */
export function perfilDeFila(fila, usuariId, firma) {
  if (!fila || typeof fila !== 'object' || fila.reserva === true) return null;
  if (usuariId == null || fila.id == null || String(fila.id) !== String(usuariId)) return null;
  return Object.freeze({
    usuariId: String(usuariId),
    firma: typeof firma === 'string' ? firma : '',
    nom: net(fila.full_name),
    avatar: net(fila.avatar_url),
    poble: net(fila.town_name)
  });
}

/** Dos perfils diuen el mateix (per a no tornar a pintar per una relectura igual). */
export function mateixPerfil(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.usuariId === b.usuariId && a.firma === b.firma && a.nom === b.nom && a.avatar === b.avatar && a.poble === b.poble;
}

/**
 * { nom, avatar, poble } de la persona de la sessió, o null sense sessió.
 * El perfil només val si és d'este compte i de la firma d'ara; si no, mana la
 * reserva de les metadades. Camp a camp: un perfil sense foto no esborra la
 * foto de les metadades (la de Google, p. ex.).
 */
export function personaDeSessio(usuari, perfil) {
  if (!usuari) return null;
  const valid = Boolean(perfil) && usuari.id != null
    && perfil.usuariId === String(usuari.id) && perfil.firma === firmaDePersona(usuari);
  return Object.freeze({
    nom: (valid && perfil.nom) || nomDePersona(usuari),
    avatar: (valid && perfil.avatar) || avatarDePersona(usuari),
    poble: (valid && perfil.poble) || net(metadadesDe(usuari).town_name)
  });
}

/**
 * El poble d'una organització: el town_name de la seua pertinença
 * (list_my_organizations el porta des de 2610081401), o ''. La mateixa font
 * que autoriaNota.actorAmbPobleDeLEntitat.
 */
export function pobleDeLaPertinenca(membership) {
  return net(membership?.town_name);
}
