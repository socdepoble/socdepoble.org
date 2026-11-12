/**
 * textosBarres.js — T7 · P1-22 (261101) · Els noms accessibles de la barra
 * blava (BarraBlava.jsx), de la regió de la barra taronja (BarraTaronja.jsx)
 * i del calaix de l'Índex (PageFrame.jsx · TableOfContentsDrawer), en parells
 * [clau i18n, reserva en valencià], com TEXTOS_COMENTAR (textosComentar.js).
 * La reserva és el valor valencià del diccionari i el text de sempre: fora de
 * l'app (sense traductor) i en valencià, cap atribut canvia (Llei del Píxel).
 * Dades, no cap component: per això viuen fora del .jsx.
 */
export const TEXTOS_BARRA = Object.freeze({
  arrere: Object.freeze(['pagina.barra.arrere', 'Tornar arrere']),
  index: Object.freeze(['pagina.barra.index', 'Índex de secció']),
  endavant: Object.freeze(['pagina.barra.endavant', 'Tornar endavant']),
  traduir: Object.freeze(['pagina.barra.traduir', 'Traduir']),
  comentar: Object.freeze(['pagina.barra.comentar', 'Comentar']),
  compartir: Object.freeze(['pagina.barra.compartir', 'Compartir']),
  /* El nom de la regió de la barra taronja (<section aria-label>). */
  autoria: Object.freeze(['pagina.barra.autoria', 'Autoria i data']),
  /* Onada R19 · Noms accessibles de la co-publicació multi-entitat registrada. */
  copublicadors: Object.freeze(['pagina.barra.copublicadors', 'Entitats co-publicadores registrades']),
  avatarCompost: Object.freeze(['pagina.barra.avatarCompost', 'Fitxa principal de co-publicació: {nom}'])
});

/* El calaix de l'Índex que obri el botó «Índex de secció». */
export const TEXTOS_INDEX = Object.freeze({
  titol: Object.freeze(['pagina.index.titol', 'Taula de continguts']),
  tanca: Object.freeze(['pagina.index.tanca', 'Tancar taula']),
  buit: Object.freeze(['pagina.index.buit', "No s'han trobat seccions."])
});

/* Gauntlet 2 · 261101 (G2-T7-02; resta de P1-22) · El nom accessible de cada
   botó del peu d'una targeta (UniversalCard): una frase sencera amb el buit
   {titol} (cada llengua hi posa el títol on li toca) i, sense títol, el verb
   sol, el de la barra blava. La reserva és el text de sempre: en valencià,
   «Traduir <títol>», «Comentar <títol>», «Compartir <títol>» i «Ancorar <títol>»,
   sense cap canvi (Llei del Píxel). */
export const TEXTOS_PEU_TARGETA = Object.freeze({
  traduir: Object.freeze({ sol: TEXTOS_BARRA.traduir, ambTitol: Object.freeze(['pagina.targeta.traduir', 'Traduir {titol}']) }),
  comentar: Object.freeze({ sol: TEXTOS_BARRA.comentar, ambTitol: Object.freeze(['pagina.targeta.comentar', 'Comentar {titol}']) }),
  compartir: Object.freeze({ sol: TEXTOS_BARRA.compartir, ambTitol: Object.freeze(['pagina.targeta.compartir', 'Compartir {titol}']) }),
  ancorar: Object.freeze({ sol: Object.freeze(['pagina.barra.ancorar', 'Ancorar']), ambTitol: Object.freeze(['pagina.targeta.ancorar', 'Ancorar {titol}']) })
});
