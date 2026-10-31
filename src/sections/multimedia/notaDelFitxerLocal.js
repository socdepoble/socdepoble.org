/**
 * notaDelFitxerLocal.js — De text local a nota del Bloc de Notes (IDEA-55 ·
 * Onada 261029_1605). Pur: ni React ni xarxa.
 *
 * Només el text editable (md, markdown, txt, json, csv, tsv, yml, yaml,
 * canvas): el codi i els registres (html, css, js, xml, vcf, log) no s'envien
 * mai (un .vcf porta dades personals). La creació de la nota és la sancionada
 * del Xat: `creaNota({ title, folderId: 'f-notes', content })` i després
 * `/notes?nota=…`.
 *
 * ESCAPA → CONSTRUÏX → SANEJA (com retall.js del Xat). El Markdown passa per
 * parseMarkdown de la Wiki i per sanitizeHtml; la resta va dins d'un
 * <pre><code> amb el text escapat. El títol és el primer «# » (fora dels
 * blocs de codi) o, si no n'hi ha, el nom del fitxer sense extensió; la resta
 * de títols baixa dos nivells, perquè la nota ja té el seu. Gauntlet 261029
 * (cicle 1) · El nom del fitxer entra al títol amb nomVisibleLocal: un control
 * de direcció del text (U+202E…) no hi arriba a falsejar l'extensió.
 */
import { netejaText, sanitizeHtml } from '../../utils/sanitize.js';
import { parseMarkdown } from '../wiki-de-poble/parseMarkdown.js';
import { esTextEditableLocal, extensioDe, troncSenseExtensio } from './motorMultimediaLocal.js';
import { nomVisibleLocal } from './suportGestorLocal.js';

/** El topall del text d'una nota feta des d'un fitxer local (decisions.md). */
export const MAX_TEXT_NOTA_BYTES = 512 * 1024;

const ESCAPADES = Object.freeze({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' });
const escapa = (valor) => String(valor ?? '').replace(/[&<>"']/g, (c) => ESCAPADES[c]);

const EXTENSIONS_MARKDOWN = new Set(['md', 'markdown']);
const TANCA = /^[ \t]*(`{3,}|~{3,})/;

/* El primer «# » fora del codi (el títol) i el cos sense eixa línia, amb els altres títols dos nivells més avall. */
function separaTitol(md) {
  const linies = String(md).replace(/\r\n?/g, '\n').split('\n');
  let tanca = null;
  let titol = null;
  const cos = [];
  for (const linia of linies) {
    const marca = TANCA.exec(linia);
    if (marca) {
      if (!tanca) tanca = marca[1][0];
      else if (marca[1][0] === tanca) tanca = null;
      cos.push(linia);
      continue;
    }
    if (!tanca) {
      if (titol === null) {
        const h1 = /^#[ \t]+(.+?)[ \t#]*$/.exec(linia);
        if (h1) {
          titol = h1[1];
          continue;
        }
      }
      const h = /^(#{1,6})([ \t])/.exec(linia);
      if (h) {
        cos.push(`${'#'.repeat(Math.min(6, h[1].length + 2))}${linia.slice(h[1].length)}`);
        continue;
      }
    }
    cos.push(linia);
  }
  return { titol, cos: cos.join('\n') };
}

/** Bytes UTF-8 d'un text. */
export const bytesDeText = (text) => new TextEncoder().encode(String(text ?? '')).byteLength;

/**
 * L'entrada de `creaNota` per a un fitxer de text local, o null si el fitxer
 * no és de text editable.
 * @param {{ nom: string, text: string }} fitxer
 * @returns {{ title: string, folderId: 'f-notes', content: string }|null}
 */
export function notaDelFitxerLocal({ nom = '', text = '' } = {}) {
  if (typeof nom !== 'string' || !esTextEditableLocal(nom)) return null;
  const tronc = nomVisibleLocal(troncSenseExtensio(nom));
  if (EXTENSIONS_MARKDOWN.has(extensioDe(nom))) {
    const { titol, cos } = separaTitol(text);
    return {
      title: netejaText(titol || tronc, 160) || netejaText(nomVisibleLocal(nom), 160),
      folderId: 'f-notes',
      content: sanitizeHtml(parseMarkdown(cos, { entradilla: false })) || '<p></p>'
    };
  }
  return {
    title: netejaText(tronc, 160) || netejaText(nomVisibleLocal(nom), 160),
    folderId: 'f-notes',
    content: sanitizeHtml(`<pre><code>${escapa(text)}</code></pre>`)
  };
}
