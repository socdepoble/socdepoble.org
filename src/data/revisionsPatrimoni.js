export const TIPUS_REVISIO_PATRIMONI = Object.freeze(['llavor', 'arbre', 'recepta']);

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*(?![\s\S])/u;
const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}(?![\s\S])/u;
const CLAU_MESURA = /^[A-Za-z][A-Za-z0-9_]{0,47}(?![\s\S])/u;
const CLAUS_PECA = ['entitatTipus', 'entitatSlug'];
const CLAUS_CAMPANYA = [...CLAUS_PECA, 'campanyaAny', 'versio', 'id'];
const CLAUS_EDICIO = [...CLAUS_CAMPANYA, 'estatConservacio', 'mesures', 'observacions'];

export function errorRevisioPatrimoni(codi, cause) {
  const missatges = {
    'revisio-patrimoni-invalida': 'Les dades de la campanya de patrimoni no són vàlides.',
    'resposta-invalida': 'El node ha tornat una revisió de patrimoni invàlida.',
    'sense-sessio': 'Cal iniciar sessió per a editar una revisió de patrimoni.',
    'sense-permis': 'No tens permisos per a editar esta revisió de patrimoni.',
    'normes-pendents': 'Cal acceptar les normes de convivència abans d’editar una revisió de patrimoni.',
    'no-disponible': 'Les revisions de patrimoni no estan disponibles en este node.',
    'revisio-no-vigent': 'La revisió ha canviat o no es pot editar amb esta sessió.'
  };
  const Classe = codi === 'revisio-patrimoni-invalida' ? TypeError : Error;
  return Object.assign(new Classe(missatges[codi], { cause }), { codi, code: codi });
}

function invalid() {
  throw errorRevisioPatrimoni('revisio-patrimoni-invalida');
}

function campsPropis(input, accepta, maxim) {
  if (!input || (Object.getPrototypeOf(input) !== Object.prototype && Object.getPrototypeOf(input) !== null)) invalid();
  const claus = Reflect.ownKeys(input);
  if (claus.length > maxim) invalid();
  const camps = Object.create(null);
  for (const clau of claus) {
    const descriptor = Object.getOwnPropertyDescriptor(input, clau);
    if (typeof clau !== 'string' || !accepta(clau) || !descriptor || !Object.hasOwn(descriptor, 'value')) invalid();
    camps[clau] = descriptor.value;
  }
  return camps;
}

const campsDe = (input, claus) => campsPropis(input, (clau) => claus.includes(clau), claus.length);
const enterEntre = (valor, min, max) => Number.isInteger(valor) && valor >= min && valor <= max;
const anyValid = (any) => enterEntre(any, 1, 9999);
const versioValida = (versio, minima) => enterEntre(versio, minima, 2147483647);

function textFitat(valor, maxim) {
  return typeof valor === 'string' && valor.length <= maxim * 2 && !valor.includes('\0')
    && !/[\uD800-\uDFFF]/u.test(valor) && [...valor].length <= maxim;
}

function pecaDe(camps) {
  const { entitatTipus, entitatSlug } = camps;
  if (!TIPUS_REVISIO_PATRIMONI.includes(entitatTipus) || !textFitat(entitatSlug, 128)
    || !SLUG.test(entitatSlug)) invalid();
  return { entitatTipus, entitatSlug };
}

function campanyaDe(camps, versioMinima) {
  if (!anyValid(camps.campanyaAny) || !versioValida(camps.versio, versioMinima)) invalid();
  const campanya = { ...pecaDe(camps), campanyaAny: camps.campanyaAny, versio: camps.versio };
  if (campanya.versio === 0) {
    if (Object.hasOwn(camps, 'id')) invalid();
    return campanya;
  }
  if (typeof camps.id !== 'string' || !UUID.test(camps.id)) invalid();
  return { ...campanya, id: camps.id };
}

function mesuresDe(input) {
  const mesures = campsPropis(input, (clau) => CLAU_MESURA.test(clau)
    && clau !== 'constructor' && clau !== 'prototype', 32);
  for (const valor of Object.values(mesures)) {
    if (valor === null || typeof valor === 'boolean') continue;
    if (typeof valor === 'number' && Number.isFinite(valor) && Math.abs(valor) <= Number.MAX_SAFE_INTEGER) continue;
    if (textFitat(valor, 160)) continue;
    invalid();
  }
  return Object.freeze(Object.fromEntries(Object.entries(mesures)));
}

export function capturaConsultaRevisionsPatrimoni(input) {
  const camps = campsDe(input, [...CLAUS_PECA, 'abansAny', 'limit']);
  const abansAny = camps.abansAny ?? null;
  const limit = camps.limit === undefined ? 50 : camps.limit;
  if ((abansAny !== null && !anyValid(abansAny)) || !enterEntre(limit, 1, 100)) invalid();
  return Object.freeze({ ...pecaDe(camps), abansAny, limit });
}

export function capturaEdicioRevisioPatrimoni(input, versioMinima = 0) {
  const camps = campsDe(input, CLAUS_EDICIO);
  if (!textFitat(camps.estatConservacio, 80) || !camps.estatConservacio.trim()
    || !textFitat(camps.observacions, 4000)) invalid();
  return Object.freeze({
    ...campanyaDe(camps, versioMinima),
    estatConservacio: camps.estatConservacio.trim(),
    mesures: mesuresDe(camps.mesures),
    observacions: camps.observacions
  });
}

export function capturaBaixaRevisioPatrimoni(input) {
  return Object.freeze(campanyaDe(campsDe(input, CLAUS_CAMPANYA), 1));
}
