import { CODI_ENTRADA, esBackendInabastable } from '../../data/errorsBackend.js';
import { PERSONA_PILOT } from '../../data/identitatsSeed.js';

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

/* ═══════════════════════════════════════════════════════════════════
   P1-68 (pla 261028_1526, §3.8.2.3; decisions del Mestre, 261028) ·
   L'IDENTIFICADOR @usuari

   Únic, en minúscules ASCII i sense @ (la interfície l'hi posa). La regla
   és la de la migració 2610282100_usuari_i_poble_canonic.sql
   (private.usuari_plega, usuari_base, usuari_normalitzat i
   usuari_reservat), literal a literal: la prova estàtica
   src/data/supabase/usuariIPoble.migracio.test.js extrau del SQL la taula de
   plegat, les partícules i la llista reservada i les compara amb estes.
   Res de NFD ni de \p{M}: normalizeSlug, slugDelPoble o plega no es poden
   copiar en SQL sense unaccent, i el client i el servidor proposarien
   identificadors diferents.
     · Base (baseDeUsername): el primer nom i el primer cognom sense
       partícules, sense separador i com a molt 24 caràcters
       («Anna Pérez Soler» → annaperez). Si no arriba a 3, 'veina'.
     · Col·lisió: el servidor hi afig -2, -3… (el client no veu els altres
       perfils i no ho pot saber); una base reservada ja la proposa amb -2,
       i una que no pot dur cap sufix (la seua -2 també és reservada), amb
       'veina' (primerUsernameLliure, private.usuari_lliure).
     · Reservats: la llista literal (les rutes del sistema, les identitats
       de la plataforma i 'baixa'), les seues còpies (sense guionets ni
       xifres del final, i tot el que comença per socdepoble o iaiamaria),
       tot el que comença per 'baixa-' (l'identificador d'una baixa en
       quarantena) i les identitats fundacionals (USERNAMES_FUNDACIONALS,
       dels àlies de PERSONA_PILOT; al servidor, private.ajustos
       'usuaris_reservats', que hi posa el Mestre). Els errors, només en
       valencià (decisió D4 del Mestre, com MISSATGES_ENTRADA). Funcions
       pures.
   ═══════════════════════════════════════════════════════════════════ */
export const MINIM_USERNAME = 3;
export const MAXIM_USERNAME = 30;
export const MAXIM_BASE_USERNAME = 24;
export const MAXIM_CANDIDATS_USERNAME = 100;
export const USERNAME_DE_RESERVA = 'veina';
export const PREFIX_USERNAME_DE_BAIXA = 'baixa-';
export const FORMA_USERNAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const PARTICULES_USERNAME = Object.freeze(['de', 'del', 'dels', 'la', 'les', 'el', 'els', 'i', 'y', 'd', 'l', 'da', 'das', 'do', 'dos', 'van', 'von', 'der', 'den']);
export const USERNAMES_RESERVATS = Object.freeze([
  '0001', 'socdepoble', 'soc-de-poble', 'rentonar', 'iaia', 'iaia-maria', 'mestre',
  'admin', 'superadmin', 'consola', 'registre', 'entrar', 'perfil', 'el-meu-perfil', 'gent', 'empresa', 'grup', 'pobles',
  'xat', 'cerca', 'connectar', 'app', 'api', 'auth', 'anima', 'legal', 'descarregues', 'page', 'sistema', 'suport',
  'mur', 'mercat', 'notes', 'calendari', 'multimedia', 'projecte', 'skills', 'wikidepoble', 'fedivers', 'constitucio', 'roadmap', 'versions',
  'baixa'
]);
/* Les arrels de les identitats de la plataforma: també en són còpies
   «iaia-maria-2» o «socdepoble2» (sense guionets ni xifres del final), i
   tot el que comença per un dels prefixos. */
export const ARRELS_RESERVADES_USERNAME = Object.freeze(['socdepoble', 'iaia', 'iaiamaria', 'rentonar', 'mestre', 'admin', 'superadmin']);
export const PREFIXOS_RESERVATS_USERNAME = Object.freeze(['socdepoble', 'iaiamaria']);
/* Les identitats fundacionals, en la forma d'un identificador i fora de la
   llista literal. El servidor les llig de private.ajustos 'usuaris_reservats'
   (el valor és USERNAMES_FUNDACIONALS.join(' ')). */
export const USERNAMES_FUNDACIONALS = Object.freeze([...new Set([PERSONA_PILOT.slug, ...PERSONA_PILOT.alies])]
  .filter((clau) => FORMA_USERNAME.test(String(clau)) && !USERNAMES_RESERVATS.includes(clau)));
/* Les lletres que es pleguen d'una en una (el translate() del SQL): cada una
   de `de` es torna la de la mateixa posició d'`a`. Les que en donen dues
   (ŀ, ß, æ, œ) van a LLIGADURES_USERNAME, abans. */
export const ACCENTS_USERNAME = Object.freeze({
  de: 'àáâäãåÀÁÂÄÃÅèéêëÈÉÊËìíîïÌÍÎÏòóôöõøÒÓÔÖÕØùúûüÙÚÛÜçÇñÑýÿÝ',
  a: 'aaaaaaaaaaaaeeeeeeeeiiiiiiiioooooooooooouuuuuuuuccnnyyy'
});
export const LLIGADURES_USERNAME = Object.freeze([['ŀ', 'l'], ['Ŀ', 'l'], ['ß', 'ss'], ['æ', 'ae'], ['Æ', 'ae'], ['œ', 'oe'], ['Œ', 'oe']]);
export const MISSATGE_USERNAME_FORMA = `L’identificador ha de tindre entre ${MINIM_USERNAME} i ${MAXIM_USERNAME} caràcters: lletres sense accents, xifres i guionets.`;
export const MISSATGE_USERNAME_RESERVAT = 'Eixe identificador està reservat. Tria’n un altre.';

const PLEGAT_USERNAME = new Map([...ACCENTS_USERNAME.de].map((lletra, i) => [lletra, [...ACCENTS_USERNAME.a][i]]));

/* La ela geminada (amb punt volat o amb punt) es queda en dues eles; després
   les lligadures, els accents i les majúscules ASCII. Cap altra minúscula: un
   lower() que depenga del locale (İ, K) no coincidiria amb el del servidor. */
function plegaUsername(text) {
  let valor = String(text ?? '').normalize('NFC').replace(/([lL])[.·‧∙]([lL])/g, '$1$2');
  for (const [de, a] of LLIGADURES_USERNAME) valor = valor.split(de).join(a);
  return [...valor].map((lletra) => PLEGAT_USERNAME.get(lletra) ?? lletra).join('').replace(/[A-Z]/g, (lletra) => lletra.toLowerCase());
}

/** Cert si l'identificador és reservat (private.usuari_reservat): la llista, una còpia, una baixa o una identitat fundacional. */
export function esUsernameReservat(valor) {
  const text = String(valor ?? '');
  const compacte = text.replace(/-/g, '');
  return USERNAMES_RESERVATS.includes(text) || text.startsWith(PREFIX_USERNAME_DE_BAIXA)
    || ARRELS_RESERVADES_USERNAME.includes(compacte.replace(/[0-9]+$/, ''))
    || PREFIXOS_RESERVATS_USERNAME.some((prefix) => compacte.startsWith(prefix))
    || USERNAMES_FUNDACIONALS.includes(text);
}

/** El candidat `n` d'una base: base-n dins dels 30 caràcters, sense guionet davant del sufix. */
export function ambSufixUsername(base, n) {
  return `${String(base).slice(0, MAXIM_USERNAME - String(n).length - 1).replace(/-+$/, '')}-${n}`;
}

/**
 * private.usuari_lliure: la base, base-2, base-3… fins al primer que no és
 * reservat ni `ocupat(candidat)`. Una base massa curta o que no pot dur cap
 * sufix (la seua -2 és reservada) passa a 'veina'; després de 100
 * candidats, 'veina-' i 8 xifres de `atzar()`.
 */
export function primerUsernameLliure(base, { ocupat = () => false, atzar = () => globalThis.crypto.randomUUID() } = {}) {
  let arrel = String(base ?? '').length >= MINIM_USERNAME ? String(base) : USERNAME_DE_RESERVA;
  if (esUsernameReservat(ambSufixUsername(arrel, 2))) arrel = USERNAME_DE_RESERVA;
  let candidat = arrel;
  for (let n = 1; esUsernameReservat(candidat) || ocupat(candidat);) {
    n += 1;
    if (n > MAXIM_CANDIDATS_USERNAME) return `${USERNAME_DE_RESERVA}-${String(atzar()).replace(/-/g, '').slice(0, 8)}`;
    candidat = ambSufixUsername(arrel, n);
  }
  return candidat;
}

/** El primer nom i el primer cognom sense partícules, junts i plegats (private.usuari_base). */
export function baseDeUsername(nom) {
  const bones = [];
  for (const paraula of plegaUsername(nom).replace(/[^a-z0-9]+/g, ' ').trim().split(' ')) {
    if (!paraula || PARTICULES_USERNAME.includes(paraula)) continue;
    bones.push(paraula);
    if (bones.length === 2) break;
  }
  return bones.join('').slice(0, MAXIM_BASE_USERNAME);
}

/**
 * L'identificador que el servidor donaria a `nom` si ningú no el tinguera:
 * la base, 'veina' si és massa curta o no pot dur cap sufix, i amb -2 si és
 * reservada.
 */
export function proposaUsername(nom) {
  return primerUsernameLliure(baseDeUsername(nom));
}

/** Un identificador escrit a mà, en la forma que es desa (private.usuari_normalitzat), o ''. */
export function normalitzaUsername(text) {
  return plegaUsername(text).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, MAXIM_USERNAME).replace(/-+$/, '');
}

/* Mentre s'escriu: el mateix plegat, però el guionet del final es queda (si
   no, «joan-» es tornaria «joan» a cada tecla i no se'n podria escriure cap). */
export function netejaUsernameEnEscriure(text) {
  return plegaUsername(text).replace(/[^a-z0-9]+/g, '-').replace(/^-+/, '').slice(0, MAXIM_USERNAME);
}

/**
 * null si l'identificador ja normalitzat es pot desar; si no, el motiu. Un
 * de reservat només passa si és el que la persona ja té (`actual`).
 */
export function validaUsername(valor, { actual = '' } = {}) {
  const text = String(valor ?? '');
  if (text.length < MINIM_USERNAME || text.length > MAXIM_USERNAME || !FORMA_USERNAME.test(text)) return MISSATGE_USERNAME_FORMA;
  if (esUsernameReservat(text) && text !== actual) return MISSATGE_USERNAME_RESERVAT;
  return null;
}

/* Els codis de desa_el_meu_usuari (2610282100) i dels adaptadors, en
   valencià. 'ocupat' no és cap error del servidor: és la resposta
   { desat: false, motiu: 'ocupat', proposta }, i el text porta la proposta. */
export const MISSATGES_USERNAME = Object.freeze({
  'SDP-USER-000': 'Cal iniciar sessió per a canviar l’identificador.',
  'SDP-USER-001': MISSATGE_USERNAME_FORMA,
  'SDP-USER-002': MISSATGE_USERNAME_RESERVAT,
  'SDP-USER-003': 'Has provat massa identificadors seguits. Torna-ho a provar d’ací a una hora.',
  'SDP-USER-004': 'Tens una baixa en curs: el perfil està congelat. Es desfà cancel·lant-la a «Privacitat i dades».',
  'SDP-USER-005': 'El teu perfil encara no és al servidor. Recarrega la pàgina i torna-ho a provar.',
  /* El disparador de 2610282100: una escriptura de fora de la RPC (006) i un
     identificador retingut per una baixa en quarantena (007, ocupat). */
  'SDP-USER-006': 'L’identificador només es pot canviar des del teu perfil.',
  'SDP-USER-007': 'Eixe identificador ja és d’algú.',
  ocupat: 'Eixe identificador ja és d’algú.',
  'NO-DISPONIBLE': 'El servidor d’este poble encara no sap desar l’identificador: cal aplicar-hi una migració pendent.',
  DESCONEGUT: 'No s’ha pogut desar l’identificador. Torna-ho a provar.'
});

/** L'error d'un desat d'identificador, amb el `code` i, si n'hi ha, la `proposta`. */
export function errorDUsername(code, { proposta = null, causa } = {}) {
  const clau = Object.hasOwn(MISSATGES_USERNAME, code) ? code : 'DESCONEGUT';
  const text = clau === 'ocupat' && proposta ? `${MISSATGES_USERNAME.ocupat} Et proposem @${proposta}.` : MISSATGES_USERNAME[clau];
  return Object.assign(new Error(text), { code: clau, ...(proposta ? { proposta } : null), ...(causa ? { cause: causa } : null) });
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
