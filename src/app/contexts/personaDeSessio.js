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
 * Pla 261014_1450, front B (ordre del Mestre, 14-10-2026) · La foto de l'actor
 * persona (la barra negra i el Xat, per IdentitatContext) es tria ací amb
 * triaAvatar, i la de /el-meu-perfil (PerfilContext.jsx) crida la mateixa
 * funció: 1) la pujada a Sóc de Poble, 2) la del proveïdor d'entrada
 * (Google…), 3) cap, i Avatar hi pinta les inicials amb la llavor. La firma i
 * la validesa de la fila no canvien: la regla només ordena els candidats que
 * ja hi entraven.
 * Pla 261014_1450, front B (revisió) · No és l'única cadena de foto de la persona: encara
 * porten la seua sections/notes/autoriaNota.js:152 (la signatura de la sessió
 * en una nota), data/localPerfils.js:91 (avatarDeSessio de l'adaptador local)
 * i la fila de reserva de data/supabase/auth.js:198 (getProfile). Pendent,
 * fora de l'abast del front B.
 *
 * Pur: sense React ni port (la mateixa capa que politicaRouter.js). Des del
 * front B importa utils/sanitize.js pel classificador de fonts pròpies; eixe
 * mòdul arma DOMPurify en carregar-se quan hi ha un DOM (el navegador, o
 * jsdom a les proves; sense DOM, des del pla 261018_1605, carrega sense
 * ganxo i el sanejador no funciona). IdentitatContext ja el portava al graf
 * (sessionService → data/identitat.js).
 */
import { esFontImatgePropia } from '../../utils/sanitize.js';

/* U+0000: cap camp de text de la sessió no el porta, i dos camps no es poden
   confondre en ajuntar-los. */
const SEPARADOR = '\u0000';
const net = (valor) => (typeof valor === 'string' ? valor.trim() : '');
const metadadesDe = (usuari) => usuari?.user_metadata || {};

/* Pla 261014_1450, front B (ordre del Mestre, 14-10-2026: «La prioritat
   d'avatars ha de ser estricta») · 1) la primera candidata pròpia per a
   esFontImatgePropia, el mateix classificador del mode estricte del Mur
   ('sdp-media://…', data:image, un camí de l'app o un origen del nostre
   servidor de mitjans); 2) si no n'hi ha cap, la primera no buida, que és la
   del proveïdor d'entrada (Google, Facebook, GitHub); 3) null, i Avatar hi
   pinta les inicials amb la llavor. Dins de cada grup mana l'ordre dels
   candidats. Els valors es netegen d'espais, i un que no és text compta com a
   buit. */
export function triaAvatar(...candidats) {
  const fonts = candidats.map(net).filter(Boolean);
  return fonts.find((font) => esFontImatgePropia(font)) || fonts[0] || null;
}

/* T43 (260928) · La cadena de sempre, mudada ací sense canvis des
   d'IdentitatContext: ara és la reserva quan no hi ha fila de perfil. */
export function nomDePersona(usuari) {
  const meta = metadadesDe(usuari);
  return meta.full_name || meta.name || usuari?.full_name || usuari?.email || 'El meu compte';
}
/* Pla 261014_1450, front B · La reserva de les metadades passa per la mateixa
   regla, perquè en este fitxer no quede cap altra cadena de foto. Només canvia
   quan una candidata de més avall és pròpia i una de més amunt no ho és: ara
   guanya la pròpia. Revisió del front B · personaDeSessio la crida com a
   reserva: un sol camí per a la foto de la sessió en este mòdul. */
export function avatarDePersona(usuari) {
  const meta = metadadesDe(usuari);
  const google = Array.isArray(usuari?.identities)
    ? usuari.identities.find((i) => i.provider === 'google')
    : null;
  const googleAvatar = google?.identity_data?.avatar_url || google?.identity_data?.picture;
  return triaAvatar(meta.avatar_url, meta.picture, usuari?.avatar_url, googleAvatar);
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
 * Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 4) · L'avatar és
 * només avatar_url: la capçalera (hero_url) és panoràmica i mai fa d'avatar.
 * Sense avatar_url, la persona es queda sense foto de la fila (en «Llevar
 * l'avatar», inicials), no amb la capçalera.
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
 * Pla 261014_1450, front B · La foto la tria triaAvatar entre la fila (només
 * si és vàlida) i les tres de la sessió: una pujada guanya a la de Google
 * siga on siga, i una fila d'abans d'una edició no hi entra encara que siga
 * pròpia (la barra mai pinta una foto vella).
 * Revisió del front B · Les tres de la sessió hi arriben per
 * avatarDePersona. És el mateix que posar-les planes darrere de la fila:
 * avatarDePersona torna la primera pròpia de les tres, si n'hi ha; si no, la
 * primera no buida (que no és pròpia), o null. Damunt, triaAvatar torna a
 * preferir la pròpia i, entre dues de la mateixa mena, la de la fila.
 */
export function personaDeSessio(usuari, perfil) {
  if (!usuari) return null;
  const valid = Boolean(perfil) && usuari.id != null
    && perfil.usuariId === String(usuari.id) && perfil.firma === firmaDePersona(usuari);
  const meta = metadadesDe(usuari);
  return Object.freeze({
    nom: (valid && perfil.nom) || nomDePersona(usuari),
    avatar: triaAvatar(valid ? perfil.avatar : '', avatarDePersona(usuari)),
    poble: (valid && perfil.poble) || net(meta.town_name)
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
