import { CODI_ENTRADA, esBackendInabastable } from '../../data/errorsBackend.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/* La política de contrasenya del registre. R (Onada 3, 261003): la contrasenya
   nova de la recuperació hi passa igual, per una sola constant. */
export const LONGITUD_MINIMA_CONTRASENYA = 10;
const MISSATGE_CONTRASENYA_CURTA = `Utilitza almenys ${LONGITUD_MINIMA_CONTRASENYA} caràcters.`;

/** Cert si el correu té forma de correu (el mateix patró del registre). */
export function esCorreuValid(email) {
  return EMAIL_PATTERN.test(String(email || '').trim());
}

/**
 * R (Onada 3, 261003) · La contrasenya nova de la recuperació: la mateixa
 * longitud que el registre i les dues iguals. Torna els errors per camp.
 */
export function validaContrasenyaNova({ password, confirmPassword }) {
  const errors = {};
  if (String(password || '').length < LONGITUD_MINIMA_CONTRASENYA) errors.password = MISSATGE_CONTRASENYA_CURTA;
  if (String(password || '') !== String(confirmPassword || '')) errors.confirmPassword = 'Les contrasenyes no coincidixen';
  return errors;
}

export function normalizeSlug(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function validateRegistration({ name, email, password }) {
  const errors = {};
  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || '').trim();

  if (cleanName.length < 2) {
    errors.name = 'Escriu el teu nom complet.';
  } else if (cleanName.length > 120) {
    errors.name = 'El nom no pot superar els 120 caràcters.';
  }

  if (!EMAIL_PATTERN.test(cleanEmail)) {
    errors.email = 'Escriu un correu electrònic vàlid.';
  }

  if (String(password || '').length < LONGITUD_MINIMA_CONTRASENYA) {
    errors.password = MISSATGE_CONTRASENYA_CURTA;
  }

  return errors;
}

export function validateOrganization(organization) {
  const errors = {};
  const name = String(organization?.name || '').trim();
  const slug = String(organization?.slug || '').trim();
  const description = String(organization?.description || '').trim();

  if (name.length < 2 || name.length > 120) {
    errors.name = 'El nom ha de tindre entre 2 i 120 caràcters.';
  }
  if (!SLUG_PATTERN.test(slug)) {
    errors.slug = 'L’identificador només pot contindre lletres, números i guionets.';
  }
  if (description.length > 500) {
    errors.description = 'La descripció no pot superar els 500 caràcters.';
  }

  return errors;
}

export function findSeedOrganization(organizations, blueprint, parentId = undefined) {
  return (organizations || []).find((organization) => (
    organization.kind === blueprint.kind
    && (parentId === undefined || organization.parent_organization_id === parentId)
  )) || null;
}

/* GoTrue porta el text a `msg`; PostgREST, a `message`; OAuth, a `error_description`. */
export function readableBackendError(error) {
  const original = String(error?.message || error || 'S’ha produït un error inesperat.');
  const payload = original.replace(/^Supabase\s+\d+:\s*/i, '');
  try {
    const parsed = JSON.parse(payload);
    const text = [parsed?.message, parsed?.error_description, parsed?.msg].find((valor) => typeof valor === 'string' && valor.trim());
    return text || original;
  } catch {
    return original;
  }
}

/* ── T4 (ordre del Mestre, 260930) · Errors d'entrada per codi, mai pel text ──
   L'adaptador traduïx el seu vocabulari a CODI_ENTRADA (src/data/errorsBackend.js);
   ací es tria la frase i el to de l'avís. Funcions pures. */
const MISSATGES_ENTRADA = Object.freeze({
  [CODI_ENTRADA.CREDENCIALS]: 'El correu o la contrasenya no són correctes.',
  [CODI_ENTRADA.CORREU_PENDENT]: 'Encara no has confirmat el correu. Obri l’enllaç que t’hem enviat i torna a entrar.',
  [CODI_ENTRADA.CONTRASENYA_FEBLE]: 'La contrasenya és massa feble. Tria’n una de més llarga i més difícil d’endevinar.',
  [CODI_ENTRADA.COMPTE_EXISTENT]: 'Ja hi ha un compte amb este correu. Entra amb la teua contrasenya.',
  [CODI_ENTRADA.MASSA_INTENTS]: 'Massa intents seguits. Espera uns minuts i torna-ho a provar.',
  [CODI_ENTRADA.SERVIDOR_INABASTABLE]: 'El servidor del poble no respon ara mateix. Torna-ho a provar d’ací a una estona.',
  [CODI_ENTRADA.MODE_LOCAL]: 'L’entrada real encara s’està preparant. Recarrega el formulari d’entrada.',
  [CODI_ENTRADA.ENLLAC_CADUCAT]: 'L’enllaç per a restablir la contrasenya ja no val: ha caducat o ja s’ha fet servir. Demana’n un altre.',
  [CODI_ENTRADA.MATEIXA_CONTRASENYA]: 'La contrasenya nova ha de ser diferent de l’anterior.',
  /* Fase D (261020, tasca 1) · L'entrada amb Apple o Google des del full natiu.
     Només en valencià, com la resta d'esta taula (decisió D4 del Mestre). */
  [CODI_ENTRADA.TOKEN_REBUTJAT]: 'El servidor del poble no ha acceptat la identificació del teu compte. Torna-ho a provar o entra amb el correu.',
  [CODI_ENTRADA.PROVEIDOR_INACTIU]: 'Esta manera d’entrar encara no està activada al servidor del poble. Entra amb el correu.',
  [CODI_ENTRADA.DESCONEGUT]: 'No s’ha pogut completar l’operació. Revisa les dades i torna-ho a provar.'
});

/* Un error que no s'ha de llegir en veu alta com a urgència: la persona no ha fet res mal.
   Fase D · Tampoc un testimoni rebutjat ni un proveïdor apagat al servidor. */
const CODIS_AVIS = new Set([CODI_ENTRADA.SERVIDOR_INABASTABLE, CODI_ENTRADA.MASSA_INTENTS, CODI_ENTRADA.CORREU_PENDENT, CODI_ENTRADA.ENLLAC_CADUCAT,
  CODI_ENTRADA.TOKEN_REBUTJAT, CODI_ENTRADA.PROVEIDOR_INACTIU]);

/**
 * El codi d'entrada d'un error, o null. Un error sense codi però que diu que
 * el servidor no s'ha pogut abastar (estat 0, TypeError de xarxa) val com a
 * SERVIDOR_INABASTABLE: un adaptador que encara no traduïx no ha de pintar-ne
 * el text cru. Correcció de la revisió T1–T4 (260930): per la mateixa raó,
 * una resposta del servidor (un estat HTTP d'error) sense codi val com a
 * DESCONEGUT.
 */
export function codiDEntrada(error) {
  const code = error?.code;
  if (typeof code === 'string' && Object.hasOwn(MISSATGES_ENTRADA, code)) return code;
  if (esBackendInabastable(error)) return CODI_ENTRADA.SERVIDOR_INABASTABLE;
  return Number.isInteger(error?.status) && error.status >= 400 ? CODI_ENTRADA.DESCONEGUT : null;
}

/**
 * La frase en valencià d'un error d'entrada, triada pel codi. Correcció de la
 * revisió T1–T4 (260930): ja no parseja el format de cap proveïdor
 * (readableBackendError es queda per als altres consumidors). Sense codi ni
 * resposta del servidor, és un text propi de l'adaptador (una sessió que no
 * s'ha pogut desar, Google no disponible en local…) i es mostra tal qual.
 */
export function missatgeDEntrada(error) {
  const code = codiDEntrada(error);
  if (code) return MISSATGES_ENTRADA[code];
  const text = typeof error === 'string' ? error : error?.message;
  return typeof text === 'string' && text.trim() ? text : MISSATGES_ENTRADA[CODI_ENTRADA.DESCONEGUT];
}

/* Correcció de la revisió T1–T4 (260930) · Marca d'un sol ús de la capa
   efímera (storage.js): «Tornar al mode de proves» des de /registre la deixa
   abans de recarregar, i la càrrega següent de /registre la consumix i no fa
   l'entrada automàtica. */
export const MARCA_SENSE_ENTRADA_AUTOMATICA = 'registre-sense-entrada-automatica';

/* Encàrrec 261018_1220 (Tasques 0 i 2, ordre del Mestre) · Marca d'un sol ús de
   l'accés pilot de desenvolupament: «Entra com a Javi Llinares» des d'un node
   remot passa al mode de proves i recarrega (config/dataMode.js ·
   enterTestMode); la càrrega següent de /registre la consumix i hi entra com
   a persona pilot sense cap altre clic. Va sempre amb la marca de dalt, perquè
   la sonda no torne a passar el node a remot. */
export const MARCA_ENTRADA_PILOT = 'registre-entrada-pilot';

/** El to de l'Alerta d'un error d'entrada: 'avis' si no és culpa de la persona, 'error' si no. */
export function toDeLErrorDEntrada(code) {
  return CODIS_AVIS.has(code) ? 'avis' : 'error';
}
