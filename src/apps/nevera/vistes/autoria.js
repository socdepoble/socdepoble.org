/**
 * La Nevera de Casa · qui signa cada targeta.
 *
 * REGLA D'OR 1 (ordre del Mestre, 261004) · Tota UniversalCard porta la seua
 * boina taronja amb l'autor real, enllaçat a la seua pàgina:
 *   · un article del catàleg de la Nevera (els de base, els productes de
 *     botiga del tall que publica el projecte i els suggeriments del
 *     calendari de temporada) és de l'entitat Sóc de Poble, que el publica:
 *     autoriaDe(ENTITAT_PROJECTE) de la plataforma, resolta per identificador
 *     (porta al perfil de l'entitat, /empresa/socdepoble: Onada 8, 261009;
 *     abans, a la pàgina del projecte);
 *   · un article propi (el que la persona ha creat en este dispositiu) és de
 *     la persona. La plataforma no dona a les apps la seua identitat ni el seu
 *     perfil (cap sessió travessa la frontera), i no se n'inventa cap: la
 *     boina diu «Tu», que és cert, sense enllaç. Quan la plataforma oferisca
 *     la identitat de la persona, és ací on es canvia.
 *     Onada 8 (261009) · PENDENT de MarIA: «un clic a QUALSEVOL boina taronja
 *     porta SEMPRE al perfil de l'autor» demana que «Tu» porte a la pàgina de
 *     qui mira (/el-meu-perfil, com la boina de la Gestoria). Una app no pot
 *     escriure rutes de l'amfitrió: la plataforma l'hauria de donar, i un nom
 *     nou a l'API és un canvi menor del contracte del nucli dels mòduls
 *     (sdp.modul.v1, VERSIO_NUCLI de contracteNucli.js), que no és d'este front.
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
