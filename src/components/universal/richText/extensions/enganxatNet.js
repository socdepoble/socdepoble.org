/**
 * enganxatNet.js — P0-58 (IDEA-189) · El que s'enganxa al cos entra amb el
 * nostre format, sense la brossa del xat o del web d'on ve.
 *
 * netejaFormatEnganxat(html) és l'última passada de l'HTML enganxat o deixat
 * anar (netejaHtmlPerAlCos, a index.js, després de les imatges i del registre
 * de les fotos):
 *  · un codi que només porta una URL web segura (la píndola de la captura,
 *    «play.google.com/apps/testing/…») es torna un enllaç clicable;
 *  · un codi dins d'un enllaç, o amb un enllaç dins, es desfà: la marca Code
 *    exclou Link i l'enllaç es perdia;
 *  · un bloc de codi que només porta una URL és un paràgraf amb l'enllaç;
 *  · un h1 baixa a h2 (l'h1 és el títol de la pàgina: Pedra Seca §4);
 *  · els enllaços només conserven l'href (fora class, style, id, target,
 *    data-*): el subratllat de prosa és el dels enllaços sense classe. El
 *    d'una imatge enllaçada conserva també target i rel (P0-26 D1).
 * NO lleva el style de la resta d'elements: les regles de Bold i Italic de
 * l'esquema lligen font-weight i font-style, i en depenen les negretes i les
 * cursives de Google Docs (el seu embolcall, una «b» amb font-weight normal,
 * tampoc no és negreta per a l'esquema). Els span, font, div i u ja els desfà
 * l'esquema, i DOMPurify en desar.
 *
 * Una passada sense res a fer torna la MATEIXA cadena (Llei del Píxel), i un
 * enganxat INTERN (ProseMirror marca el seu portapapers amb data-pm-slice)
 * també: copiar dins del text no canvia res. Si l'HTML no es pot llegir amb
 * seguretat, torna tal qual: el risc és només de format, perquè l'esquema i
 * el sanejador continuen protegint.
 *
 * EnganxatDeText fa el mateix amb el text pla que porta Markdown
 * (markdownEnganxat.js): només si no és Maj+enganxar i el text en té forma.
 * Dins d'un bloc de codi, ProseMirror ja enganxa el text cru sense
 * preguntar-nos res.
 */
import { Extension } from '@tiptap/core';
import { DOMParser as AnalitzadorDeEsquema } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { sanitizeHtml } from '../../../../utils/sanitize.js';
import { markdownAHtml, semblaMarkdown, urlWebSegura } from '../markdownEnganxat.js';
import { plantillaDe } from './imatgesEnganxades.js';

export const NOM_ENGANXAT_DE_TEXT = 'enganxatDeText';

/* El filtre ràpid mira les ETIQUETES que es poden tocar: sense cap enllaç,
   codi, bloc de codi ni títol de nivell 1, res a fer («<abbr» o «<article»
   no compten). */
const POT_TINDRE_FORMAT = /<(?:a|code|h1|pre)[\s/>]/i;

/* Un enllaç de text només porta l'href (target i rel els posa Link). El d'una
   imatge enllaçada conserva target i rel: SdpImage els llig de l'<a> pare i
   els torna a validar (enllacImatge.js, P0-26 D1). */
const ATRIBUTS_D_ENLLAC = new Set(['href']);
const ATRIBUTS_D_IMATGE_ENLLACADA = new Set(['href', 'target', 'rel']);

/* Un element substituït pels seus fills (el text queda al seu lloc). */
const desfes = (element) => element.replaceWith(...Array.from(element.childNodes));

function creaEnllac(document_, url) {
  const enllac = document_.createElement('a');
  enllac.setAttribute('href', url);
  enllac.textContent = url;
  return enllac;
}

/**
 * L'HTML enganxat sense la brossa de format. Vegeu la capçalera del fitxer.
 * @param {string} html
 * @returns {string} el mateix objecte si no hi ha res a canviar
 */
export function netejaFormatEnganxat(html) {
  if (typeof html !== 'string' || !POT_TINDRE_FORMAT.test(html)) return html;
  const plantilla = plantillaDe(html);
  if (!plantilla) return html;
  const arrel = plantilla.content;
  if (arrel.querySelector('[data-pm-slice]')) return html;
  const document_ = plantilla.ownerDocument;
  let canviat = false;

  for (const pre of arrel.querySelectorAll('pre')) {
    if (pre.querySelector('img')) continue;
    const url = urlWebSegura(pre.textContent);
    if (!url) continue;
    const paragraf = document_.createElement('p');
    paragraf.append(creaEnllac(document_, url));
    pre.replaceWith(paragraf);
    canviat = true;
  }

  for (const codi of arrel.querySelectorAll('code')) {
    if (codi.closest('pre')) continue;
    if (codi.closest('a') || codi.querySelector('a')) {
      desfes(codi);
      canviat = true;
      continue;
    }
    if (codi.querySelector('img')) continue;
    const url = urlWebSegura(codi.textContent);
    if (!url) continue;
    codi.replaceWith(creaEnllac(document_, url));
    canviat = true;
  }

  for (const titol of arrel.querySelectorAll('h1')) {
    const h2 = document_.createElement('h2');
    for (const nom of titol.getAttributeNames()) h2.setAttribute(nom, titol.getAttribute(nom));
    h2.append(...Array.from(titol.childNodes));
    titol.replaceWith(h2);
    canviat = true;
  }

  for (const enllac of arrel.querySelectorAll('a')) {
    const permesos = enllac.querySelector('img') ? ATRIBUTS_D_IMATGE_ENLLACADA : ATRIBUTS_D_ENLLAC;
    for (const nom of enllac.getAttributeNames()) {
      if (permesos.has(nom)) continue;
      enllac.removeAttribute(nom);
      canviat = true;
    }
  }

  return canviat ? plantilla.innerHTML : html;
}

/**
 * El clipboardTextParser de ProseMirror: el tros que s'enganxa per a un text
 * pla amb Markdown, o null (el camí de sempre: un <p> per línia i les regles
 * d'enganxat de TipTap). `plain` és Maj+enganxar: el text entra literal.
 */
export function trosDeMarkdown(text, $context, plain, view) {
  if (plain || !semblaMarkdown(text)) return null;
  const html = sanitizeHtml(netejaFormatEnganxat(markdownAHtml(text)));
  const plantilla = html ? plantillaDe(html) : null;
  if (!plantilla) return null;
  return AnalitzadorDeEsquema.fromSchema(view.state.schema)
    .parseSlice(plantilla.content, { context: $context, preserveWhitespace: true });
}

/** El text pla amb Markdown, enganxat o deixat anar, entra amb el nostre format. */
export const EnganxatDeText = Extension.create({
  name: NOM_ENGANXAT_DE_TEXT,
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey(NOM_ENGANXAT_DE_TEXT),
        props: { clipboardTextParser: trosDeMarkdown },
      }),
    ];
  },
});
