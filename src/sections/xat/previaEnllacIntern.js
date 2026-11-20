/**
 * previaEnllacIntern.js — Resol de manera síncrona i pura (zero peticions de
 * xarxa, zero fuites de privacitat) la targeta compacta amb miniatura quadrada
 * dreta per a enllaços interns de Sóc de Poble compartits o citats al Xat.
 */
import { baseRecursos, hiHaPoliticaDeMitjans, resolveAsset } from '../../config/assetResolver.js';
import { CARA_DE_LA_IAIA } from '../../data/xatsPerDefecte.js';

const URL_INTERNA_RE = /https?:\/\/(?:www\.)?(socdepoble\.(?:org|cat|com))(\/[^\s<>"']*)/i;
const RUTA_SOLTA_RE = /(?:^|\s)(\/(?:mur|page|mercat|pobles|gent|entitat|events|iaia|projecte|anima|versions)(?:\/[^\s<>"']*)?)/i;

const MINIATURES_CONEGUDES = Object.freeze({
  '/mur/la-veu-de-soc-de-poble': '/assets/mur/la_veu_de_soc_de_poble_nano_v4.webp',
  '/mur/copies-seguretat-farcellet': '/assets/mur/copies_seguretat_farcellet_hero.webp',
  '/mur/copies-seguretat-quatre-capes': '/assets/mur/copies_seguretat_quatre_capes.webp',
  '/iaia': CARA_DE_LA_IAIA.src,
  '/anima': CARA_DE_LA_IAIA.src
});

const MINIATURA_PER_DEFECTE = '/assets/soc_de_poble_ibanez.webp';

const REEMPLACOS_TITOL = Object.freeze([
  [/\bsoc de poble\b/gi, 'Sóc de Poble'],
  [/\biaia\b/gi, 'IAIA MarIA'],
  [/\bl orella\b/gi, "L'Orella"]
]);

/* Gauntlet v1.2.13 · Un camí és propi si ni el text ni el camí normalitzat (segments «.» i «..» resolts, «\\» com a «/»)
   comencen per dues barres: «//host» seria un altre domini. */
function camiPropi(ruta) {
  if (/^\/[/\\]/.test(ruta)) return false;
  let normalitzat;
  try { normalitzat = new URL(ruta, 'https://socdepoble.org').pathname; } catch { return false; }
  return !/^\/[/\\]/.test(normalitzat);
}

function titolHumanaDeRuta(ruta) {
  const neta = String(ruta || '').split(/[?#]/)[0].replace(/\/+$/, '');
  const parts = neta.split('/').filter(Boolean);
  if (parts.length === 0) return 'Sóc de Poble';
  /* Gauntlet v1.2.13 · Un «%» solt («/mur/rebaixes-50%») feia petar decodeURIComponent dins del render i tombava la
     conversa sencera: si no es pot descodificar, es fa servir tal qual. */
  let ultim = parts[parts.length - 1] || '';
  try { ultim = decodeURIComponent(ultim); } catch { /* es queda tal qual */ }
  let frase = ultim.replace(/[-_]+/g, ' ').trim();
  if (!frase) return 'Sóc de Poble';
  frase = frase.charAt(0).toUpperCase() + frase.slice(1);
  for (const [patro, valor] of REEMPLACOS_TITOL) {
    frase = frase.replace(patro, valor);
  }
  return frase;
}

/**
 * Normalitza una miniatura pròpia (`/assets/…` o `assets/…`) i, quan l'app viu
 * incrustada en un amfitrió (connector WordPress, Sollutia) o porta una
 * política de mitjans segellada (variant del directori WordPress.org on
 * `assets/mur/` és extern), la resol en temps de crida amb `resolveAsset()`.
 * En l'entorn per defecte sense base ni política retorna el camí canònic
 * `/assets/…` sense cap canvi (Llei del Píxel).
 */
export function resolMiniaturaPreviaInterna(rutaImatge) {
  const crua = String(rutaImatge || '').trim();
  if (!crua) return '';
  if (/^(?:https?:\/\/|data:|blob:)/i.test(crua)) return crua;
  const canonica = crua.startsWith('assets/') ? `/${crua}` : crua;
  if (!canonica.startsWith('/assets/')) return canonica;
  if (!baseRecursos() && !hiHaPoliticaDeMitjans()) return canonica;
  return resolveAsset(canonica);
}

/**
 * Extreu la primera previsualització interna de Sóc de Poble trobada a `text`,
 * o `null` si no n'hi ha cap amb ruta editorial o de secció.
 */
export function extreuPreviaInterna(text) {
  if (typeof text !== 'string' || !text.trim()) return null;
  const mUrl = URL_INTERNA_RE.exec(text);
  if (mUrl) {
    const domini = mUrl[1].toLowerCase();
    const camiCru = mUrl[2] || '/';
    const rutaNeta = camiCru.replace(/[.,;:!?)]+$/, '');
    // Gauntlet v1.2.13 · «//host» o «/\\host» (també després de segments «.» o «..») serien un enllaç a un altre domini
    // amb l'etiqueta de socdepoble.org.
    if (!camiPropi(rutaNeta)) return null;
    const clau = rutaNeta.split(/[?#]/)[0].replace(/\/+$/, '').toLowerCase();
    if (!clau || clau === '/') return null;
    return {
      ruta: rutaNeta,
      domini,
      titol: titolHumanaDeRuta(clau),
      imatgeUrl: resolMiniaturaPreviaInterna(MINIATURES_CONEGUDES[clau] || MINIATURA_PER_DEFECTE)
    };
  }
  const mRuta = RUTA_SOLTA_RE.exec(text);
  if (mRuta) {
    const rutaNeta = mRuta[1].replace(/[.,;:!?)]+$/, '');
    if (!camiPropi(rutaNeta)) return null;
    const clau = rutaNeta.split(/[?#]/)[0].replace(/\/+$/, '').toLowerCase();
    return {
      ruta: rutaNeta,
      domini: 'socdepoble.org',
      titol: titolHumanaDeRuta(clau),
      imatgeUrl: resolMiniaturaPreviaInterna(MINIATURES_CONEGUDES[clau] || MINIATURA_PER_DEFECTE)
    };
  }
  return null;
}
