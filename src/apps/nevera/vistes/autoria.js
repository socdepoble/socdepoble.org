/**
 * La Nevera de Casa · qui signa cada targeta.
 *
 * REGLA D'OR 1 (ordre del Mestre, 261004) · Tota UniversalCard porta la seua
 * boina taronja amb l'autor real, enllaçat a la seua pàgina:
 *   · un article del catàleg de la Nevera (els de base, els productes de
 *     botiga del tall que publica el projecte i els suggeriments del
 *     calendari de temporada) és de l'entitat Sóc de Poble, que el publica:
 *     autoriaDe(ENTITAT_PROJECTE) de la plataforma, resolta per identificador
 *     (porta a la pàgina del projecte);
 *   · un article propi (el que la persona ha creat en este dispositiu) és de
 *     la persona. La plataforma no dona a les apps la seua identitat ni el seu
 *     perfil (cap sessió travessa la frontera), i no se n'inventa cap: la
 *     boina diu «Tu», que és cert, sense enllaç. Quan la plataforma oferisca
 *     la identitat de la persona, és ací on es canvia.
 * La forma és la de l'autoria de PaginaApp ({ nom, href, avatar, poble }), la
 * que llig l'esquelet (TargetesArticles) des de `article.autoria`.
 */
import { ENTITAT_PROJECTE, autoriaDe } from '../../plataforma/index.js';

/** La boina d'un article propi: la persona, sense nom ni perfil inventats. */
export const AUTORIA_PROPIA = Object.freeze({ nom: 'Tu' });

/** Qui signa un article de la Nevera ({ propi? }); sense article (un suggeriment del calendari), el projecte. */
export function autoriaDArticle(article) {
  return article?.propi ? AUTORIA_PROPIA : autoriaDe(ENTITAT_PROJECTE);
}
