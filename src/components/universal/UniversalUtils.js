export function isSafeUrl(url) {
  if (typeof url !== 'string' || !url) return false;
  const cleanUrl = url.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  if (cleanUrl.startsWith('//')) return false;
  try {
    const u = new URL(cleanUrl, window.location.origin);
    return (u.protocol === 'http:' || u.protocol === 'https:') && !cleanUrl.toLowerCase().startsWith('javascript:');
  } catch {
    return false;
  }
}

export function isSafeAsset(url) {
  if (typeof url !== 'string' || !url) return false;
  if (url.startsWith('data:image/')) return true;
  return isSafeUrl(url);
}

export function isValidDate(dd, mm, yy) {
  const d = new Date(yy, mm - 1, dd);
  return d.getFullYear() === Number(yy) && 
         d.getMonth() === Number(mm) - 1 && 
         d.getDate() === Number(dd);
}

export const DEFAULT_AUTHOR = {
  name: 'Sóc de Poble',
  location: 'La Torre de les Maçanes',
  avatarUrl: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg'
};

/* T22 (Mestre, 260927) · La persona sense sessió és el Foraster, i el seu
   poble és sempre este. Nom i poble van junts: qualsevol barra taronja,
   targeta o capçalera que pinte el convidat llig d'ací, mai d'un literal
   propi. Amb sessió, nom i poble reals. */
export const FORASTER = Object.freeze({
  name: 'Foraster',
  location: 'Poble de la persona forastera'
});

export const PAGE_CHROME_MODES = new Set(['none', 'page', 'context', 'full', 'system']);
