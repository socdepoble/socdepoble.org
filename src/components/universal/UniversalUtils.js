import { resolveAsset } from '../../config/assetResolver';

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

/* L'avatar es resol en llegir-lo, no en importar el mòdul: així hi val la
   base de recursos que l'amfitrió fixe després (config/assetResolver.js). */
export const DEFAULT_AUTHOR = {
  name: 'Sóc de Poble',
  location: 'La Torre de les Maçanes',
  get avatarUrl() { return resolveAsset('/assets/system/ui/logo-socdepoble-cuadrat-verd.svg'); }
};

/* T22 (Mestre, 260927) · La persona sense sessió és el Foraster, i el seu
   poble és sempre este. Nom i poble van junts: qualsevol barra taronja,
   targeta o capçalera que pinte el convidat llig d'ací, mai d'un literal
   propi. Amb sessió, nom i poble reals. */
export const FORASTER = Object.freeze({
  name: 'Foraster',
  location: 'Poble de la persona forastera'
});

/* Nom i poble que es pinten per a qui mira, a partir de la sessió (forma
   de `currentUser` que ja usa IdentitatContext) i sense tocar cap backend.
   Sense sessió, el Foraster sencer. Amb sessió, el nom de la persona i el
   poble que viatja a `user_metadata.town_name` (o buit si no en té: una
   persona registrada sense poble no és forastera). */
export function autorDeSessio(currentUser) {
  if (!currentUser) return { name: FORASTER.name, location: FORASTER.location };
  const meta = currentUser.user_metadata || {};
  return {
    name: meta.name || currentUser.full_name || FORASTER.name,
    location: meta.town_name || ''
  };
}

export const PAGE_CHROME_MODES = new Set(['none', 'page', 'context', 'full', 'system']);
