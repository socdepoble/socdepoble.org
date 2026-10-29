/** Canal lateral per a serveis de cicle de vida, sense ampliar el transport. */
const serveis = new WeakMap();
export function serveiXifratXatDe(impl) {
  return impl && (typeof impl === 'object' || typeof impl === 'function') ? serveis.get(impl) ?? null : null;
}
export function registraServeiXifratXat(impl, servei) {
  serveis.set(impl, servei);
}
export function heretaServeiXifratXat(origen, desti) {
  const servei = serveiXifratXatDe(origen);
  if (servei) serveis.set(desti, servei);
}
