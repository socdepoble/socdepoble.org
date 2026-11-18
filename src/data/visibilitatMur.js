/** P0-126 · Aparador, independent de publicació, carpeta i permisos. */
export function capturaVisibilitatMur(input = {}) {
  const mostrar = input.mostrarAlMur, ocultar = input.ocultarDelMur;
  if (mostrar === undefined && ocultar === undefined) return {};
  if ((mostrar !== undefined && typeof mostrar !== 'boolean') || (ocultar !== undefined && typeof ocultar !== 'boolean')
    || (mostrar !== undefined && ocultar !== undefined && mostrar === ocultar)) {
    throw Object.assign(new TypeError('La visibilitat al Mur ha de ser un booleà coherent.'), { code: 'mur-visibilitat-invalida' });
  }
  const visible = mostrar ?? !ocultar;
  return { mostrarAlMur: visible, ocultarDelMur: !visible };
}

/** En lectura no coaccionem "false", 0 o null a una decisió editorial. */
export function visibilitatMurLlegida(input = {}) {
  try { return capturaVisibilitatMur(input); } catch { return null; }
}

export function esVisibleAlMur(input) {
  const decisio = visibilitatMurLlegida(input);
  return decisio !== null && decisio.mostrarAlMur !== false;
}
