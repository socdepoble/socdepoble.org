/* R56 · Només identitat d'entrada. Posicions de scroll sempre en memòria;
   ni permisos ni autenticitat es deriven d'este format intern. */
export const CLAU_ENTRADA_HISTORIAL = '__sdp_router_entry';
let sequencia = 0;
export const novaClauDeRuta = () => `sdp:${Math.random().toString(36).slice(2) || '0'}:${++sequencia}`;
const esClau = value => typeof value === 'string' && /^sdp:[a-z0-9]{1,16}:[1-9]\d{0,12}$/.test(value);
const dada = (object, key) => {
  const descriptor = object && typeof object === 'object' ? Object.getOwnPropertyDescriptor(object, key) : null;
  return descriptor && Object.hasOwn(descriptor, 'value') ? descriptor : null;
};

const esRegistre = value => value && typeof value === 'object'
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));

/** Un únic nom reservat és autoritatiu. v1, slots numerats, versions futures
    o accessors són opacs; el format no acredita autenticitat ni permisos. */
export function llegixEntradaHistorial(raw) {
  if (!esRegistre(raw)) return null;
  const value = dada(raw, CLAU_ENTRADA_HISTORIAL)?.value;
  if (!esRegistre(value)) return null;
  const keys = Reflect.ownKeys(value);
  if (![3, 4].includes(keys.length) || !['version', 'key', 'state'].every(key => dada(value, key))
      || !keys.every(key => ['version', 'key', 'state', 'hostValue'].includes(key) && dada(value, key))) return null;
  const version = dada(value, 'version').value, key = dada(value, 'key').value;
  if (version !== 2 || !esClau(key)) return null;
  return { namespace: CLAU_ENTRADA_HISTORIAL, key, state: dada(value, 'state').value,
    ...(Object.hasOwn(value, 'hostValue') ? { hostValue: dada(value, 'hostValue').value } : {}) };
}

export function estatPublicDeHistorial(raw) {
  const entry = llegixEntradaHistorial(raw);
  return entry ? entry.state : raw ?? null;
}

/** Projecció nova R56; cap lectura de window, història host o context.
    Un POP no marcat no té identitat coneguda: la URL no identifica l’entrada. */
export function ubicacioAmbIdentitat(ruta, cerca, location, raw, inicial, accio) {
  return { ruta, cerca, fragment: ruta === null ? '' : location.hash,
    navegacio: { clau: ruta === null ? null : llegixEntradaHistorial(raw)?.key
      ?? (accio === 'INITIAL' && location.href === inicial.href ? inicial.clau : null), accio } };
}

export function estatDeNovaEntrada(anterior, options) {
  const state = options.state === anterior ? estatPublicDeHistorial(anterior) : options.state ?? null;
  return ambEntradaHistorial(state, novaClauDeRuta(), campsHostDeHistorial(anterior));
}

export function campsHostDeHistorial(raw) {
  const entry = llegixEntradaHistorial(raw);
  if (!entry) return esRegistre(raw) ? raw : {};
  const host = {};
  for (const key of Object.keys(raw)) if (key !== CLAU_ENTRADA_HISTORIAL) {
    Object.defineProperty(host, key, Object.getOwnPropertyDescriptor(raw, key));
  }
  if (Object.hasOwn(entry, 'hostValue')) Object.defineProperty(host, CLAU_ENTRADA_HISTORIAL,
    { value: entry.hostValue, enumerable: true, configurable: true, writable: true });
  return host;
}

/** Domini host: registre pla de camps propis. La col·lisió del nom reservat
    s'embolcalla; campsHostDeHistorial la reconstruïx, no queda plana al raw.
    Cap payload públic de la pàgina anterior s'arrossega a l'entrada nova. */
export function ambEntradaHistorial(state, key, host) {
  if (!esClau(key)) throw new TypeError('Identitat de ruta invàlida');
  const fields = esRegistre(host) ? host : {}, raw = {};
  for (const name of Object.keys(fields)) {
    const descriptor = dada(fields, name);
    if (!descriptor) throw new TypeError('Un camp host accessor no es pot copiar com a dada');
    Object.defineProperty(raw, name, { value: descriptor.value, enumerable: true, configurable: true, writable: true });
  }
  const collision = Object.hasOwn(fields, CLAU_ENTRADA_HISTORIAL);
  const original = dada(fields, CLAU_ENTRADA_HISTORIAL);
  if (collision && !original) throw new TypeError('Un namespace host accessor no es pot copiar com a dada');
  Object.defineProperty(raw, CLAU_ENTRADA_HISTORIAL, {
    value: { version: 2, key, state, ...(collision ? { hostValue: original.value } : {}) },
    enumerable: true, configurable: true, writable: true,
  });
  return raw;
}
