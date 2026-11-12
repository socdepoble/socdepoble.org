import { AGENTS_MAP } from './agentsSeed.js';

export const TIPUS_RECURS_COPUBLICABLE = Object.freeze([
  'article', 'pagina', 'llibre_cataleg', 'recepta', 'arbre', 'planta', 'llavor'
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ID_RECURS = /^[A-Za-z0-9_-][A-Za-z0-9_:-]{0,127}$/;
const MAX_PUBLICADORS = 12;
const LIMIT_VERSIO = 2147483647;
export const PARAM_REGISTRE_PUBLICADOR = 'registre';

export const esTipusIdAcreditat = tipus => tipus === 'persona' || tipus === 'organitzacio';

export function rutaIdAcreditat(id, tipus) {
  return typeof id === 'string' && UUID.test(id) && esTipusIdAcreditat(tipus)
    ? `/perfil/${id}?${PARAM_REGISTRE_PUBLICADOR}=${tipus}` : null;
}

export function tipusDeRutaAcreditada(ruta, id) {
  if (typeof ruta !== 'string') return null;
  return ['persona', 'organitzacio'].find(tipus => ruta === rutaIdAcreditat(id, tipus)) ?? null;
}

export function corresponPerfilAcreditat(perfil, id, tipus) {
  if (typeof id !== 'string' || !perfil?.publicat || typeof perfil.id !== 'string' || perfil.id.toLowerCase() !== id.toLowerCase()) return false;
  return tipus === 'persona' ? perfil.tipus === 'persona'
    : tipus === 'organitzacio' && (perfil.tipus === 'entitat' || perfil.tipus === 'grup');
}

const MISSATGES = Object.freeze({
  'publicacio-invalida': 'La sol·licitud de publicació no és vàlida.',
  'publicacio-inexistent': 'La peça no consta com a publicable en este poble.',
  'publicador-no-registrat': 'Algun publicador no és un compte públic registrat i actiu.',
  'publicador-oficial-no-configurat': 'Falta vincular el compte oficial de Sóc de Poble al padró.',
  'conflicte-versio': 'La publicació ha canviat. Recarrega-la abans de continuar.',
  'operacio-reutilitzada': 'L’identificador de l’operació ja pertany a una altra sol·licitud.',
  'sense-sessio': 'Cal iniciar sessió per a gestionar la publicació.',
  'cal-segon-factor': 'Cal confirmar el segon factor de la sessió.',
  'sense-permis': 'La sessió no pot gestionar la publicació.',
  'no-disponible': 'El node actual no té el servei de co-publicació disponible.',
  'resposta-invalida': 'El node ha tornat una resposta de publicació invàlida.'
});

export function errorCopublicacio(codi) {
  return Object.assign(new Error(MISSATGES[codi]), { code: codi, codi });
}

const invalid = () => { throw errorCopublicacio('publicacio-invalida'); };

function camps(entrada, obligatoris, opcionals = []) {
  if (entrada === null || typeof entrada !== 'object'
    || ![Object.prototype, null].includes(Object.getPrototypeOf(entrada))) invalid();
  const descriptors = Object.getOwnPropertyDescriptors(entrada);
  const resultat = Object.create(null);
  for (const clau of Reflect.ownKeys(descriptors)) {
    const descriptor = descriptors[clau];
    if ((!obligatoris.includes(clau) && !opcionals.includes(clau)) || !Object.hasOwn(descriptor, 'value')) invalid();
    resultat[clau] = descriptor.value;
  }
  if (!obligatoris.every(clau => Object.hasOwn(resultat, clau))) invalid();
  return resultat;
}

const CLAUS_RECURS = ['recursTipus', 'recursId'];

function recursDe({ recursTipus, recursId }) {
  if (!TIPUS_RECURS_COPUBLICABLE.includes(recursTipus) || typeof recursId !== 'string'
    || !ID_RECURS.test(recursId)) invalid();
  return { recursTipus, recursId: UUID.test(recursId) ? recursId.toLowerCase() : recursId };
}

function uuidDe(valor) {
  if (typeof valor !== 'string' || !UUID.test(valor)) invalid();
  return valor.toLowerCase();
}

function versioDe(valor, minima) {
  if (!Number.isInteger(valor) || valor < minima || valor >= LIMIT_VERSIO) invalid();
  return valor;
}

function idsDe(valors) {
  if (!Array.isArray(valors) || valors.length >= MAX_PUBLICADORS
    || Reflect.ownKeys(valors).length !== valors.length + 1) invalid();
  return Array.from({ length: valors.length }, (_, index) => {
    const descriptor = Object.getOwnPropertyDescriptor(valors, index);
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) invalid();
    return uuidDe(descriptor.value);
  });
}

export function capturaConsultaPublicadors(entrada) {
  return recursDe(camps(entrada, CLAUS_RECURS));
}

export function capturaTraspasPublicacio(entrada) {
  const dades = camps(entrada, [...CLAUS_RECURS, 'nouActorRegistratId', 'versioEsperada', 'operacioId'],
    ['mantindreCopublicadorSdp', 'copublicadorsRegistratsIds']);
  const nouActorRegistratId = uuidDe(dades.nouActorRegistratId);
  const copublicadorsRegistratsIds = idsDe(Object.hasOwn(dades, 'copublicadorsRegistratsIds') ? dades.copublicadorsRegistratsIds : []);
  const mantindreCopublicadorSdp = Object.hasOwn(dades, 'mantindreCopublicadorSdp') ? dades.mantindreCopublicadorSdp : false;
  if (typeof mantindreCopublicadorSdp !== 'boolean'
    || new Set([nouActorRegistratId, ...copublicadorsRegistratsIds]).size !== copublicadorsRegistratsIds.length + 1) invalid();
  return { ...recursDe(dades), nouActorRegistratId, copublicadorsRegistratsIds, mantindreCopublicadorSdp,
    versioEsperada: versioDe(dades.versioEsperada, 0), operacioId: uuidDe(dades.operacioId) };
}

export function capturaReversioPublicacio(entrada) {
  const dades = camps(entrada, [...CLAUS_RECURS, 'traspasId', 'versioEsperada', 'operacioId']);
  const traspasId = uuidDe(dades.traspasId);
  const operacioId = uuidDe(dades.operacioId);
  if (traspasId === operacioId) invalid();
  return { ...recursDe(dades), traspasId, versioEsperada: versioDe(dades.versioEsperada, 1), operacioId };
}

const oficial = AGENTS_MAP.SOCDEPOBLE;
export const PUBLICADOR_SDP = Object.freeze({
  actor_id: oficial.id,
  slug_ruta: '/socdepoble',
  nom: oficial.name,
  avatar_url: oficial.avatar_url,
  poble_nom: oficial.town_name,
  rol_publicacio: 'principal'
});

export function publicacioPerDefecte(recurs) {
  return { ...recurs, versio: 0, publicadorsRegistrats: [], publicadorEfectiu: PUBLICADOR_SDP };
}

const respostaInvalida = () => { throw errorCopublicacio('resposta-invalida'); };
const textValid = (valor, limit) => typeof valor === 'string' && valor.length <= limit;

function actorValid(actor, rol) {
  if (!actor || typeof actor.actor_id !== 'string' || !UUID.test(actor.actor_id)
    || !tipusDeRutaAcreditada(actor.slug_ruta, actor.actor_id)
    || actor.rol_publicacio !== rol
    || !textValid(actor.nom, 240) || !actor.nom.trim()
    || (actor.avatar_url !== null && !textValid(actor.avatar_url, 4096))
    || (actor.poble_nom !== null && !textValid(actor.poble_nom, 240))) respostaInvalida();
  const { actor_id, slug_ruta, nom, avatar_url, poble_nom, rol_publicacio } = actor;
  return { actor_id, slug_ruta, nom, avatar_url, poble_nom, rol_publicacio };
}

/** El servidor només transporta actors verificats. La reserva oficial es resol al port. */
export function validaRespostaCopublicacio(resposta, recurs, operacio) {
  if (!resposta || resposta.recursTipus !== recurs.recursTipus || resposta.recursId !== recurs.recursId
    || !Number.isInteger(resposta.versio) || resposta.versio < 0 || resposta.versio > LIMIT_VERSIO
    || !Array.isArray(resposta.publicadorsRegistrats) || resposta.publicadorsRegistrats.length > MAX_PUBLICADORS) respostaInvalida();
  const publicadorsRegistrats = resposta.publicadorsRegistrats.map((actor, posicio) =>
    actorValid(actor, posicio === 0 ? 'principal' : 'copublicador'));
  if (new Set(publicadorsRegistrats.map(actor => actor.actor_id.toLowerCase())).size !== publicadorsRegistrats.length) respostaInvalida();
  const consulta = { ...recurs, versio: resposta.versio, publicadorsRegistrats,
    publicadorEfectiu: publicadorsRegistrats[0] ?? PUBLICADOR_SDP };
  if (!operacio) return consulta;
  const { operacioId, repetida, versioOperacio } = resposta;
  if (operacioId !== operacio.operacioId || typeof repetida !== 'boolean'
    || versioOperacio !== operacio.versioEsperada + 1 || resposta.versio < versioOperacio
    || (!repetida && resposta.versio !== versioOperacio)) respostaInvalida();
  return { ...consulta, operacioId, repetida, versioOperacio };
}

export const CAPTURA_COPUBLICACIO = Object.freeze({
  lligPublicadorsRegistrats: capturaConsultaPublicadors,
  traspassaPublicacio: capturaTraspasPublicacio,
  reverteixTraspasPublicacio: capturaReversioPublicacio
});
