/**
 * Model pur de constants, fonts primàries, connexió i atribució per a PanellDeViquipedia (R32.24).
 */
export const TERMINI_MS = 20000;

export const ESTATS_DESABLES_VIQUIPEDIA = Object.freeze(['complet', 'parcial']);

export const FONT_PRIMARIA_VIQUIPEDIA = new Set([
  'ca.wikipedia.org',
  'es.wikipedia.org',
  'www.wikidata.org',
  'wikidata.org',
  'commons.wikimedia.org',
  'creativecommons.org',
  'www.creativecommons.org',
]);

export const urlDeFont = (valor) => {
  try {
    const url = new URL(valor);
    return url.protocol === 'https:'
      && !url.username
      && !url.password
      && FONT_PRIMARIA_VIQUIPEDIA.has(url.hostname)
      ? url.href
      : null;
  } catch {
    return null;
  }
};

export function focusPerdut(node) {
  const arrel = node?.getRootNode?.();
  if (!arrel) return false;
  const actiu = arrel.activeElement ?? node.ownerDocument?.activeElement ?? null;
  return !actiu || !actiu.isConnected || actiu.tagName === 'BODY';
}

export function subscriuConnexio(avisa) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('online', avisa);
  window.addEventListener('offline', avisa);
  return () => {
    window.removeEventListener('online', avisa);
    window.removeEventListener('offline', avisa);
  };
}

export const enLinia = () => typeof navigator === 'undefined' || navigator.onLine !== false;

export function construeixModelFontsTerritorials(poble, tx) {
  const dto = poble.wikipedia_provenance ? poble : poble.fontsDeViquipedia?.dto || poble;
  const imatges = dto.imatges || poble.imatgesViquipedia || {};
  const vistes = new Set();
  const fotos = [imatges.hero, imatges.avatar, imatges.reserva]
    .filter((foto) => foto?.fitxer && !vistes.has(foto.fitxer) && vistes.add(foto.fitxer));
  const article = poble.wikipedia_url || (
    dto.wikipedia_title
      ? `https://ca.wikipedia.org/wiki/${encodeURIComponent(dto.wikipedia_title.replace(/ /g, '_'))}`
      : null
  );
  const qid = dto.wikidata_id || poble.wikidata_id;
  const any = poble.population_year ?? (
    poble.population == null || poble.population === dto.population ? dto.population_year : null
  );
  const dades = [
    [tx.comarca, poble.comarca ?? dto.comarca],
    [tx.provincia, poble.provincia ?? dto.provincia],
    [
      tx.poblacio,
      (poble.population ?? dto.population)
        ? `${poble.population ?? dto.population}${any ? ` (${any})` : ''}`
        : null,
    ],
    [tx.altitud, Number.isFinite(poble.elevation ?? dto.elevation) ? `${poble.elevation ?? dto.elevation} m` : null],
    [tx.superficie, Number.isFinite(poble.area ?? dto.area) ? `${poble.area ?? dto.area} km²` : null],
    [tx.gentilici, poble.gentilici ?? dto.gentilici],
    [
      tx.coordenades,
      Number.isFinite(poble.lat ?? dto.lat) && Number.isFinite(poble.lng ?? dto.lng)
        ? `${poble.lat ?? dto.lat}, ${poble.lng ?? dto.lng}`
        : null,
    ],
  ].filter(([, valor]) => valor != null);
  const absents = poble.wikipedia_hydration?.missing || [];
  const excepcions = poble.wikipedia_provenance?.exceptions || [];
  return { fotos, article, qid, dades, absents, excepcions };
}
