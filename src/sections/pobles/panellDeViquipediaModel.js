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

const textNoBuit = (valor) => {
  if (typeof valor !== 'string') return valor != null && Number.isFinite(valor) ? String(Object.is(valor, -0) ? 0 : valor) : null;
  const net = valor.trim();
  return net ? net : null;
};

const numNet = (valor) => (Object.is(valor, -0) ? 0 : valor);

export function anyCensNet(valor) {
  if (typeof valor === 'number') {
    const enter = Math.trunc(valor);
    return Number.isFinite(valor) && enter === valor && enter >= 1000 && enter <= 9999 ? String(enter) : null;
  }
  if (typeof valor === 'string') {
    const net = valor.trim();
    return /^\d{4}$/.test(net) ? net : null;
  }
  return null;
}

export function construeixModelFontsTerritorials(poble, tx = {}) {
  const f = poble && typeof poble === 'object' ? poble : {};
  const dto = f.wikipedia_provenance ? f : f.fontsDeViquipedia?.dto || f;
  const imatges = dto.imatges || f.imatgesViquipedia || {};
  const vistes = new Set();
  const fotos = [imatges.hero, imatges.avatar, imatges.reserva]
    .filter((foto) => foto?.fitxer && !vistes.has(foto.fitxer) && vistes.add(foto.fitxer));
  const article = f.wikipedia_url || (
    dto.wikipedia_title
      ? `https://ca.wikipedia.org/wiki/${encodeURIComponent(dto.wikipedia_title.replace(/ /g, '_'))}`
      : null
  );
  const qid = dto.wikidata_id || f.wikidata_id || null;
  const anyCru = f.population_year ?? (
    f.population == null || f.population === dto.population ? dto.population_year : null
  );
  const any = anyCensNet(anyCru);
  const poblacioBase = textNoBuit(f.population ?? dto.population);
  const poblacioAmbAny = poblacioBase
    ? (any && !poblacioBase.includes(`(${any})`) ? `${poblacioBase} (${any})` : poblacioBase)
    : null;
  const elevacio = f.elevation ?? dto.elevation;
  const superficie = f.area ?? dto.area;
  const lat = f.lat ?? dto.lat;
  const lng = f.lng ?? dto.lng;
  const dades = [
    [tx.comarca, textNoBuit(f.comarca ?? dto.comarca)],
    [tx.provincia, textNoBuit(f.provincia ?? dto.provincia)],
    [tx.poblacio, poblacioAmbAny],
    [tx.altitud, Number.isFinite(elevacio) ? `${numNet(elevacio)} m` : null],
    [tx.superficie, Number.isFinite(superficie) ? `${numNet(superficie)} km²` : null],
    [tx.gentilici, textNoBuit(f.gentilici ?? dto.gentilici)],
    [
      tx.coordenades,
      Number.isFinite(lat) && Number.isFinite(lng)
        ? `${numNet(lat)}, ${numNet(lng)}`
        : null,
    ],
  ].filter(([, valor]) => valor != null);
  const absents = f.wikipedia_hydration?.missing || [];
  const excepcions = f.wikipedia_provenance?.exceptions || [];
  return { fotos, article, qid, dades, absents, excepcions };
}
