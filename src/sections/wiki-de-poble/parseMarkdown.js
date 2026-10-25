/**
 * parseMarkdown.js — Markdown de la Wiki a HTML. L'eixida passa SEMPRE per
 * sanitizeHtml() a WikiDePobleSection.jsx: ací no es neteja res.
 *
 * Correccions 260924 (U09 · C15):
 *  1 · Tanques de codi. Es trauen ABANS de cap altra regla i tornen al final,
 *      escapades: dins d'un bloc, «#», «-», «*» i «|» són text, no format.
 *      El codi en línia rep el mateix tracte.
 *  2 · Negreta i cursiva no goloses: `**A** i **B**` fa dos <strong>.
 *  3 · Callouts `> [!NOTE]` amb espais finals i línies `>` buides. Vestixen la
 *      pell canònica de l'Alerta (.sdp-alerta--*): les classes .note/.warning
 *      que emetia el parser no tenien cap regla CSS.
 *  4 · Capçalera de taula: la captura ja exclou les barres exteriors, i el
 *      slice(1, -1) llevava la primera i l'última cel·la (dos columnes → thead buit).
 *
 * Poliment editorial 260925:
 *  5 · Cap títol ix amb punt final, tampoc quan el punt va dins de la negreta
 *      o la cursiva que el tanca («**Nota.**», «_x._»). Els suspensius es queden.
 *  6 · Un títol és sempre un bloc propi: el text enganxat davall ja no queda
 *      fora de cap <p>.
 *  7 · Entradilla: el primer paràgraf pla just després del primer «# » ix com
 *      <p class="lead"> (es pot apagar amb `{ entradilla: false }`).
 *  8 · extreuEditorial(): separa títol, entradilla i cos perquè la
 *      UniversalPage els pinte al seu lloc (H1 al bloc blanc, entradilla
 *      davall de l'H2) i la prosa no els repetisca.
 *
 * Sense lookbehind: el Baseline és Safari 16.0 i no l'admet fins a 16.4.
 */

import { llevaPuntFinal } from '../../components/universal/editorial.js';

const escapaHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Tipus d'avís de GitHub/Obsidian → variant de l'Alerta de Pedra Seca. */
const VARIANT_AVIS = { note: 'info', info: 'info', important: 'info', tip: 'exit', warning: 'avis', caution: 'error', danger: 'error' };

const MARCA = '\u0000';
const marcador = (tipus, index) => `${MARCA}${tipus}${index}${MARCA}`;
const ENTRADILLA = `${MARCA}ENTRADILLA${MARCA}`;

/* Línies que obrin un bloc que NO és un paràgraf pla. */
const NO_PARAGRAF = [
  /^#{1,6}(?:[ \t]|$)/,                        // títol
  /^[ \t]*(?:[-*+]|\d+[.)])[ \t]/,             // llista
  /^[ \t]*\|/,                                  // taula
  /^[ \t]*>/,                                   // cita i callout
  /^[ \t]*(?:`{3,}|~{3,})/,                     // tanca de codi
  /^[ \t]*(?:-{3,}|\*{3,}|_{3,})[ \t]*$/,       // regle horitzontal
  /^[ \t]*</,                                   // HTML
  /^[ \t]*!\[/,                                 // imatge
  /^[ \t]*\*\*[^*\n]+:[ \t]*\*\*/,              // «**Categoria:** …»
  /^[ \t]*\*\*[^*\n]+\*\*[ \t]*:/,              // «**Categoria**: …»
  /^[ \t]*__[^_\n]+:[ \t]*__/,
  /^[ \t]*__[^_\n]+__[ \t]*:/,
  /^\u0000BLOC/                                 // bloc de codi ja apartat
];

const esLiniaDeParagraf = (linia) => linia.trim() !== '' && !NO_PARAGRAF.some((regla) => regla.test(linia));

/* Punt final d'un títol, també dins de la negreta o la cursiva que el tanca.
   `[^.\s]` davant del punt: «...» no casa i els suspensius es queden. */
const PUNT_FINAL_TITOL = /^([\s\S]*[^.\s])[ \t]*\.(\*{1,3}|_{1,3})?[ \t]*$/;

function netejaTitol(text) {
  const sense = text.replace(/[ \t]+#+[ \t]*$/, ''); // tancament «## Títol ##»
  const trobat = PUNT_FINAL_TITOL.exec(sense);
  return trobat ? trobat[1] + (trobat[2] || '') : sense.replace(/[ \t]+$/, '');
}

/* Format en línia, compartit pel cos i per l'entradilla. El contingut de
   negreta i cursiva no pot començar ni acabar en espai ni en asterisc. */
function formatEnLinia(html) {
  return html
    .replace(/\*\*([^\s*](?:(?:(?!\*\*)[^\n])*?[^\s*])?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^\s*](?:[^*\n]*[^\s*])?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');
}

/* Marca el primer paràgraf pla que seguix el primer «# ». */
function marcaEntradilla(md) {
  const linies = md.split('\n');
  const h1 = linies.findIndex((linia) => /^# /.test(linia));
  if (h1 === -1) return md;
  let i = h1 + 1;
  while (i < linies.length && linies[i].trim() === '') i += 1;
  if (i >= linies.length || !esLiniaDeParagraf(linies[i])) return md;
  linies[i] = ENTRADILLA + linies[i].replace(/^[ \t]+/, '');
  return linies.join('\n');
}

export function parseMarkdown(md, { entradilla = true } = {}) {
  if (!md) return '';
  let html = md.replace(/\r\n/g, '\n').replace(/\u0000/g, '');

  // 1a · Blocs de codi tancats. Envoltats de línies buides perquè el pas de
  //      paràgrafs els tracte com a bloc propi i no els fique dins d'un <p>.
  const blocs = [];
  html = html.replace(/^[ \t]*(`{3,}|~{3,})[ \t]*([\w+-]*)[^\n]*\n([\s\S]*?)^[ \t]*\1[ \t]*$/gm, (_m, _tanca, llengua, codi) => {
    const lang = llengua ? llengua.toLowerCase().trim() : '';
    if (lang === 'mermaid') {
      blocs.push(`<div class="sdp-diagrama-card"><div class="sdp-diagrama-capcalera"><span class="sdp-diagrama-icona">📐</span> Diagrama d’arquitectura</div><pre class="sdp-diagrama-cos"><code class="language-mermaid">${escapaHtml(codi.replace(/\n$/, ''))}</code></pre></div>`);
    } else {
      const classe = llengua ? ` class="language-${llengua}"` : '';
      blocs.push(`<pre><code${classe}>${escapaHtml(codi.replace(/\n$/, ''))}</code></pre>`);
    }
    return `\n\n${marcador('BLOC', blocs.length - 1)}\n\n`;
  });

  // 1b · Codi en línia.
  const enLinia = [];
  html = html.replace(/`([^`\n]+)`/g, (_m, codi) => {
    enLinia.push(`<code>${escapaHtml(codi)}</code>`);
    return marcador('LINIA', enLinia.length - 1);
  });

  // 1c · Entradilla (7). Sobre el Markdown, amb el codi ja apartat.
  if (entradilla) html = marcaEntradilla(html);

  // UniversalPage té l'h1 de pàgina. El nivell visual conserva la classe
  // tipogràfica canònica; el nivell semàntic comença un esglaó més avall.
  // Les línies buides al voltant en fan un bloc propi (6).
  html = html.replace(/^(#{1,6}) (.*$)/gim, (_match, hashes, text) => {
    const visual = hashes.length;
    const semantic = Math.min(visual + 1, 6);
    return `\n\n<h${semantic} class="h${visual}">${netejaTitol(text)}</h${semantic}>\n\n`;
  });

  // Horizontal Rule
  html = html.replace(/^---$/gim, '<hr />');

  // Callouts. Cap línia buida a l'eixida: el pas de paràgrafs tallaria el <div>.
  html = html.replace(/^>[ \t]*\[!([A-Za-z]+)\][ \t]*\n((?:>[^\n]*(?:\n|$))+)/gm, (_match, type, content) => {
    const tipus = type.toLowerCase();
    const variant = VARIANT_AVIS[tipus] || 'info';
    const cos = content.replace(/^>[ \t]?/gm, '').trim().split(/\n[ \t]*\n/)
      .map(paragraf => `<p>${paragraf.trim().replace(/\n/g, ' ')}</p>`).join('');
    return `<div class="sdp-alerta sdp-alerta--${variant} ${tipus}"><div class="sdp-alerta__cos">${cos}</div></div>\n`;
  });
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Negreta, cursiva i enllaços.
  html = formatEnLinia(html);

  // Lists
  // Unordered Lists (-, *, +)
  html = html.replace(/^[ \t]*[-*+][ \t]+(.*)$/gim, '<li class="ul">$1</li>');
  // Ordered Lists (1., 2., etc)
  html = html.replace(/^[ \t]*\d+\.[ \t]+(.*)$/gim, '<li class="ol">$1</li>');

  // Join consecutive li tags of the same type
  html = html.replace(/<\/li>\n<li class="ul">/gim, '</li><li class="ul">');
  html = html.replace(/<\/li>\n<li class="ol">/gim, '</li><li class="ol">');

  // Wrap entire sequences of consecutive li tags into a single ul or ol
  html = html.replace(/((?:<li class="ul">[\s\S]*?<\/li>)+)/gi, '<ul>$1</ul>');
  html = html.replace(/((?:<li class="ol">[\s\S]*?<\/li>)+)/gi, '<ol>$1</ol>');

  // Clean up the temporary classes on li tags only
  html = html.replace(/<li class="[uo]l">/g, '<li>');

  // Tables
  html = html.replace(/^\|(.+)\|[ \t]*\n\|([-: |]+)\|[ \t]*\n((\|.*\|[ \t]*(?:\n|$))+)/gm, (match, head, sep, body) => {
    const thead = '<thead><tr>' + head.split('|').map(c => `<th>${c.trim()}</th>`).join('') + '</tr></thead>';
    const tbody = '<tbody>' + body.trim().split('\n').map(row => {
      return '<tr>' + row.trim().split('|').slice(1, -1).map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
    }).join('') + '</tbody>';
    /* IDEA-26 (261025) · La taula es desplaça dins de la seua caixa: la columna
       de la Wiki talla el que la desborda (overflow-x: hidden). */
    return `<div class="sdp-taula-prosa"><table>\n${thead}\n${tbody}\n</table></div>`;
  });

  // Paragraphs (grouping hard-wrapped lines)
  const blocks = html.split(/\n\s*\n/);
  html = blocks.map(block => {
    const net = block.trim();
    if (net === '') return '';
    if (net.startsWith(ENTRADILLA)) return `<p class="lead">${net.slice(ENTRADILLA.length).replace(/\n/g, ' ')}</p>`;
    // Un comentari HTML no és contingut: si davant d'un bloc només hi ha
    // comentaris, mana el que ve darrere. Ara que el títol és un bloc propi
    // (6), «### X\n<!-- nota -->\n- a» deixava un <p> buit davant de la llista.
    const senseComentaris = net.replace(/^(?:<!--[\s\S]*?-->\s*)+/, '');
    if (senseComentaris === '' || senseComentaris.match(/^(<h|<u|<o|<l|<a|<hr|<div|<blockquote|\u0000BLOC)/)) return block;
    // Text net: ajuntem les línies amb un espai
    return `<p>${net.replace(/\n/g, ' ')}</p>`;
  }).join('\n\n');

  return html
    .split(ENTRADILLA).join('')
    .replace(/\u0000LINIA(\d+)\u0000/g, (_m, index) => enLinia[Number(index)])
    .replace(/\u0000BLOC(\d+)\u0000/g, (_m, index) => blocs[Number(index)]);
}

/**
 * Markdown en línia (negreta, cursiva, enllaços i codi) per a l'entradilla
 * de la capçalera. El text s'escapa: una entradilla és prosa, no HTML. Qui
 * la pinte l'ha de passar igualment per sanitizeHtml().
 */
export function parseMarkdownEnLinia(md) {
  if (typeof md !== 'string' || !md.trim()) return '';
  const codis = [];
  const text = md.replace(/\u0000/g, '').replace(/\s*\n\s*/g, ' ').trim()
    .replace(/`([^`\n]+)`/g, (_m, codi) => {
      codis.push(`<code>${escapaHtml(codi)}</code>`);
      return marcador('LINIA', codis.length - 1);
    });
  return formatEnLinia(escapaHtml(text))
    .replace(/\u0000LINIA(\d+)\u0000/g, (_m, index) => codis[Number(index)]);
}

/* Títol del Markdown com a text pla: l'H1 de la pàgina és text de React, i
   un «**» o un «[x](y)» s'hi veurien tal qual. */
function textPla(md) {
  return llevaPuntFinal(md
    .replace(/[ \t]+#+[ \t]*$/, '')
    .replace(/<[^>]*>/g, '')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__)(\S(?:[^\n]*?\S)?)\1/g, '$2')
    .replace(/\*(\S(?:[^*\n]*?\S)?)\*/g, '$1')
    .replace(/(^|[\s(])_(\S(?:[^_\n]*?\S)?)_(?=$|[\s).,;:!?])/g, '$1$2')
    .trim());
}

/**
 * Separa la capçalera editorial d'un document Markdown. Funció pura.
 *
 *  · titol: si el primer bloc no buit és «# Títol», el títol en text pla,
 *    sense punt final. Si no, null.
 *  · entradilla: si just després del títol ve un paràgraf pla (no títol,
 *    llista, taula, cita, codi, callout, regle, HTML, imatge ni línia
 *    d'etiqueta «**Categoria:** …»), eixe paràgraf en Markdown en línia.
 *    Si no, null.
 *  · cos: la resta del document, sense el títol ni l'entradilla.
 *
 * Sense títol no hi ha entradilla: el document es torna sencer com a cos.
 */
export function extreuEditorial(md) {
  // BOM inicial (U+FEFF) fora, per codi i no amb un caràcter invisible al font.
  const senseBom = typeof md === 'string' && md.charCodeAt(0) === 0xFEFF ? md.slice(1) : md;
  const text = typeof senseBom === 'string' ? senseBom.replace(/\r\n?/g, '\n') : '';
  const linies = text.split('\n');
  let i = 0;
  while (i < linies.length && linies[i].trim() === '') i += 1;

  const capcalera = i < linies.length ? /^# (.*)$/.exec(linies[i]) : null;
  const titol = capcalera ? textPla(capcalera[1]) : '';
  if (!titol) return { titol: null, entradilla: null, cos: text };

  i += 1;
  while (i < linies.length && linies[i].trim() === '') i += 1;
  const iniciCos = i;

  const paragraf = [];
  while (i < linies.length && esLiniaDeParagraf(linies[i])) {
    paragraf.push(linies[i].trim());
    i += 1;
  }
  if (!paragraf.length) {
    return { titol, entradilla: null, cos: linies.slice(iniciCos).join('\n') };
  }

  while (i < linies.length && linies[i].trim() === '') i += 1;
  return {
    titol,
    entradilla: paragraf.join(' ').replace(/[ \t]+/g, ' ').trim(),
    cos: linies.slice(i).join('\n')
  };
}
