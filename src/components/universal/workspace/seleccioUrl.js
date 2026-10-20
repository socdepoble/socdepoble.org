/**
 * seleccioUrl.js · T7 (P9) · La selecció d'un espai de treball a la URL:
 * la carpeta, l'element (la nota, el document) i la secció del document.
 * Pur: llig i escriu URLSearchParams i no toca cap router. Qui el crida
 * decidix si la navegació és push o replace.
 *
 * Contracte de les claus (CLAUS_SELECCIO): 'carpeta', 'item' i 'seccio'.
 * Cada secció en pot reanomenar alguna (el Bloc de Notes fa servir 'nota'
 * per a l'element) sense que este mòdul ho sàpia.
 *
 * La secció s'escriu a la consulta (?seccio=) i no al fragment (#): en mode
 * memòria l'enllaç per compartir només porta camí i consulta (useAccions,
 * urlPerCompartir), i un fragment es perdria. Fase D (261020) · Per a llegir,
 * un fragment de document també val com a entrada (seccioDelFragment): és
 * l'adreça pública que la Play Console demana (/legal#esborra-compte).
 */

export const CLAUS_SELECCIO = Object.freeze({ carpeta: 'carpeta', item: 'item', seccio: 'seccio' });

/** Llargària màxima d'un slug de secció. El text en pren com a molt
 *  LLARGARIA_TEXT_SLUG perquè el sufix d'un repetit (-2, -3…) hi capiga. */
export const LLARGARIA_SLUG = 80;
const LLARGARIA_TEXT_SLUG = 72;
/** Slug d'un encapçalament sense cap lletra ni xifra (només emojis o signes). */
export const SLUG_SENSE_TEXT = 'seccio';

const clausDe = (claus) => ({ ...CLAUS_SELECCIO, ...(claus || {}) });

function comParams(params) {
  if (params instanceof URLSearchParams) return params;
  if (typeof params === 'string') return new URLSearchParams(params);
  return new URLSearchParams();
}

const valorNet = (valor) => (typeof valor === 'string' && valor.trim() !== '' ? valor : null);

/* Minúscules, sense diacrítics i amb guions entre paraules; cap guió a les
   puntes. Les lletres d'altres alfabets es conserven (la traducció). */
function netejaSlug(text, llargaria) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('ca')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+/, '')
    .slice(0, llargaria)
    .replace(/-+$/, '');
}

/** El slug estable d'un encapçalament, fet del seu text. */
export function slugDeSeccio(text) {
  return netejaSlug(text, LLARGARIA_TEXT_SLUG) || SLUG_SENSE_TEXT;
}

/**
 * Els slugs d'una llista d'encapçalaments en l'ordre del document. Els
 * repetits porten sufix (-2, -3…): el primer «Vincles» és 'vincles' i el
 * segon, 'vincles-2'. Mateix text i mateix ordre, mateixos slugs.
 */
export function slugsDeSeccions(textos = []) {
  const usats = new Set();
  return textos.map((text) => {
    const base = slugDeSeccio(text);
    let slug = base;
    for (let n = 2; usats.has(slug); n += 1) slug = `${base}-${n}`;
    usats.add(slug);
    return slug;
  });
}

/** La secció de la URL, normalitzada com un slug; null si no n'hi ha. */
export function llegixSeccio(params, clau = CLAUS_SELECCIO.seccio) {
  const valor = valorNet(comParams(params).get(clau));
  return valor === null ? null : (netejaSlug(valor, LLARGARIA_SLUG) || null);
}

/**
 * La selecció que porta la URL: { carpeta, item, seccio }. Una clau absent
 * o buida val null.
 */
export function llegixSeleccio(params, claus) {
  const k = clausDe(claus);
  const p = comParams(params);
  return {
    carpeta: valorNet(p.get(k.carpeta)),
    item: valorNet(p.get(k.item)),
    seccio: llegixSeccio(p, k.seccio)
  };
}

/**
 * Una còpia dels paràmetres amb la selecció escrita. Per a cada clau:
 * `undefined` no la toca, `null` (o '') l'esborra i un valor l'escriu.
 * Les claus que ja hi eren conserven la seua posició; la resta de
 * paràmetres no es toquen.
 * Una secció és d'un document: si l'element canvia i no s'escriu cap secció
 * nova, la de l'element anterior s'esborra.
 */
export function escriuSeleccio(params, seleccio = {}, claus) {
  const k = clausDe(claus);
  const next = new URLSearchParams(comParams(params));
  const itemAbans = valorNet(next.get(k.item));
  const posa = (clau, valor) => {
    if (valor === undefined) return;
    if (valor === null || valor === '') next.delete(clau);
    else next.set(clau, String(valor));
  };
  posa(k.carpeta, seleccio.carpeta);
  posa(k.item, seleccio.item);
  if (seleccio.seccio !== undefined) {
    posa(k.seccio, seleccio.seccio === null ? null : (netejaSlug(seleccio.seccio, LLARGARIA_SLUG) || null));
  } else if (seleccio.item !== undefined && valorNet(seleccio.item == null ? null : String(seleccio.item)) !== itemAbans) {
    next.delete(k.seccio);
  }
  return next;
}

/** Una còpia dels paràmetres amb la secció escrita (o esborrada amb null). */
export function escriuSeccio(params, slug, clau = CLAUS_SELECCIO.seccio) {
  return escriuSeleccio(params, { seccio: slug }, { seccio: clau });
}

/** Camí i consulta: '/notes' + '?nota=n1', o el camí sol si no hi ha consulta. */
export function rutaAmbConsulta(cami, params) {
  const consulta = comParams(params).toString();
  return consulta ? `${cami}?${consulta}` : cami;
}

/* Fase D (261020, tasca 3.2) · Un fragment de document (#esborra-compte) com a secció. Només
   paraules i guions: un fragment de paràmetres (#access_token=…&…, #sdp-ruta=…) no és cap secció. */
const RE_FRAGMENT_DE_SECCIO = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;
export function seccioDelFragment(hash) {
  const cru = String(hash ?? '').replace(/^#/, '');
  if (!cru || cru.length > LLARGARIA_SLUG * 3) return null;
  let text;
  try { text = decodeURIComponent(cru); } catch { return null; }
  return text.length <= LLARGARIA_SLUG && RE_FRAGMENT_DE_SECCIO.test(text) ? netejaSlug(text, LLARGARIA_SLUG) : null;
}
