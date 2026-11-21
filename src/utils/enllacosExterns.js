/** Qualificació SEO comuna. La confiança editorial només ve del consumidor,
 * mai d'un rel escrit dins d'HTML aportat per una persona o un comerç. */
export function relEnllacExtern({ editorial = false, sponsored = false } = {}) {
  return `${editorial === true ? '' : 'ugc nofollow '}${sponsored === true ? 'sponsored ' : ''}noopener noreferrer`;
}

export function esEnllacExtern(href) {
  try {
    const base = typeof window !== 'undefined' ? window.location.href : 'https://socdepoble.org/';
    const url = new URL(href, base);
    return ['http:', 'https:'].includes(url.protocol) && url.origin !== new URL(base).origin;
  } catch { return false; }
}
