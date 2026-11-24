const CAMI_ESTATIC = /^\/(?:assets|opendata|\.well-known|nodeinfo|ap|federation)\//i;
const FORA = /[\u0000-\u001F\u007F\\]/;
const BASE = 'https://socdepoble.org/';
const esHttp = (p) => p === 'http:' || p === 'https:';
const netDe = (v) => (typeof v === 'string' ? v.trim() : '');

/** Qualificació SEO comuna. La confiança editorial només ve del consumidor,
 * mai d'un rel escrit dins d'HTML aportat per una persona o un comerç. */
export function relEnllacExtern({ editorial = false, sponsored = false } = {}) {
  return `${editorial === true ? '' : 'ugc nofollow '}${sponsored === true ? 'sponsored ' : ''}noopener noreferrer`;
}

export function esEnllacExtern(href) {
  const net = netDe(href);
  if (!net) return false;
  try {
    const base = typeof window !== 'undefined' ? window.location.href : BASE;
    const origen = new URL(base);
    const url = new URL(net, net.startsWith('//') && !esHttp(origen.protocol) ? BASE : base);
    return esHttp(url.protocol) && url.origin !== origen.origin;
  } catch { return false; }
}

/** IDEA-343 · Recursos físics servits fora del router SPA (PDF, imatges a mida
 * completa, JSON-LD, ActivityPub). */
export function esRecursEstaticPropi(href) {
  const net = netDe(href);
  if (!net || /^[#?]|^\/\//.test(net) || FORA.test(net)) return false;
  if (CAMI_ESTATIC.test(net)) return true;
  try {
    const u = new URL(net, typeof window !== 'undefined' ? window.location.origin : BASE);
    return esHttp(u.protocol) && CAMI_ESTATIC.test(u.pathname);
  } catch { return false; }
}

/** IDEA-343 · Destinació canònica: '_blank' sempre als externs; null a rutes SPA,
 * fragments i mailto:/tel:, llevat de recursos estàtics amb '_blank' explícit. */
export const destinacioSeguraDEnllac = (href, targetActual = null) => (
  esEnllacExtern(href) || (targetActual === '_blank' && esRecursEstaticPropi(href)) ? '_blank' : null
);
