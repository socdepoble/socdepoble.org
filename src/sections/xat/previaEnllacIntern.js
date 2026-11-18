/**
 * previaEnllacIntern.js — Resol de manera síncrona i pura (zero peticions de
 * xarxa, zero fuites de privacitat) la targeta compacta amb miniatura quadrada
 * dreta per a enllaços interns de Sóc de Poble compartits o citats al Xat.
 */
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

function titolHumanaDeRuta(ruta) {
  const neta = String(ruta || '').split(/[?#]/)[0].replace(/\/+$/, '');
  const parts = neta.split('/').filter(Boolean);
  if (parts.length === 0) return 'Sóc de Poble';
  const ultim = decodeURIComponent(parts[parts.length - 1] || '');
  let frase = ultim.replace(/[-_]+/g, ' ').trim();
  if (!frase) return 'Sóc de Poble';
  frase = frase.charAt(0).toUpperCase() + frase.slice(1);
  for (const [patro, valor] of REEMPLACOS_TITOL) {
    frase = frase.replace(patro, valor);
  }
  return frase;
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
    const clau = rutaNeta.split(/[?#]/)[0].replace(/\/+$/, '').toLowerCase();
    if (!clau || clau === '/') return null;
    return {
      ruta: rutaNeta,
      domini,
      titol: titolHumanaDeRuta(clau),
      imatgeUrl: MINIATURES_CONEGUDES[clau] || MINIATURA_PER_DEFECTE
    };
  }
  const mRuta = RUTA_SOLTA_RE.exec(text);
  if (mRuta) {
    const rutaNeta = mRuta[1].replace(/[.,;:!?)]+$/, '');
    const clau = rutaNeta.split(/[?#]/)[0].replace(/\/+$/, '').toLowerCase();
    return {
      ruta: rutaNeta,
      domini: 'socdepoble.org',
      titol: titolHumanaDeRuta(clau),
      imatgeUrl: MINIATURES_CONEGUDES[clau] || MINIATURA_PER_DEFECTE
    };
  }
  return null;
}
