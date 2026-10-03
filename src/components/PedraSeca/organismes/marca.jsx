/**
 * marca.jsx — el quadrat 1:1 d'un article quan no hi ha foto: les inicials
 * del nom i la icona de la seua categoria (disseny del Bar §A.10). Cap color
 * per categoria: el fons és el de la peça que el conté. La marca i la foto
 * omplin el marc que les conté: 16:9 dins de .sdp-panoramica (l'excepció del
 * Lector, catalegColleccio.css).
 *
 * Funcions de pintat (no són components del catàleg): les fan servir
 * GraellaArticles, LlistaArticles i DetallArticle.
 */
import { isValidElement } from 'react';
import { esFontImatgeSegura } from '../../../utils/sanitize.js';
import { resolRecursPropi } from '../../../config/assetResolver.js';
import { inicialsDe } from '../molecules/Rajola.jsx';

/** Un component de React (funció, memo, forwardRef: les icones de lucide). */
const esComponent = (valor) => typeof valor === 'function'
  || (typeof valor === 'object' && valor !== null && '$$typeof' in valor && !isValidElement(valor));

/** La icona d'una categoria, decorativa: un component o un element ja fet. */
export function pintaIcona(icona, mida = 20) {
  if (isValidElement(icona)) return icona;
  if (esComponent(icona)) {
    const Icona = icona;
    return <Icona size={mida} aria-hidden="true" focusable="false" />;
  }
  return null;
}

/** La font d'una imatge d'article, si és segura (el mateix filtre que Rajola). */
export function fontSegura(imatge) {
  const font = typeof imatge === 'string' && imatge !== '' ? resolRecursPropi(imatge) : null;
  return font && esFontImatgeSegura(font) ? font : null;
}

/** Inicials i icona de categoria. `renderMedia(article)` pot posar-hi un node propi. */
export function pintaMarca(article, categoria, renderMedia) {
  const propi = typeof renderMedia === 'function' ? renderMedia(article) : null;
  if (propi) return propi;
  return (
    <span className="sdp-marca-article">
      {pintaIcona(categoria?.icona)}
      <span className="sdp-marca-article__inicials">{inicialsDe(article?.nom)}</span>
    </span>
  );
}

/** El quadrat sencer: la foto si n'hi ha una de segura; si no, la marca. */
export function pintaQuadrat(article, categoria, renderMedia) {
  const src = fontSegura(article?.imatge);
  if (src) return <img className="sdp-marca-article__imatge" src={src} alt="" loading="lazy" referrerPolicy="no-referrer" />;
  return pintaMarca(article, categoria, renderMedia);
}
