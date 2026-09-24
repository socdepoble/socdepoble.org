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
 * Sense lookbehind: el Baseline és Safari 16.0 i no l'admet fins a 16.4.
 */

const escapaHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Tipus d'avís de GitHub/Obsidian → variant de l'Alerta de Pedra Seca. */
const VARIANT_AVIS = { note: 'info', info: 'info', important: 'info', tip: 'exit', warning: 'avis', caution: 'error', danger: 'error' };

const MARCA = '\u0000';
const marcador = (tipus, index) => `${MARCA}${tipus}${index}${MARCA}`;

export function parseMarkdown(md) {
  if (!md) return '';
  let html = md.replace(/\r\n/g, '\n').replace(/\u0000/g, '');

  // 1a · Blocs de codi tancats. Envoltats de línies buides perquè el pas de
  //      paràgrafs els tracte com a bloc propi i no els fique dins d'un <p>.
  const blocs = [];
  html = html.replace(/^[ \t]*(`{3,}|~{3,})[ \t]*([\w+-]*)[^\n]*\n([\s\S]*?)^[ \t]*\1[ \t]*$/gm, (_m, _tanca, llengua, codi) => {
    const classe = llengua ? ` class="language-${llengua}"` : '';
    blocs.push(`<pre><code${classe}>${escapaHtml(codi.replace(/\n$/, ''))}</code></pre>`);
    return `\n\n${marcador('BLOC', blocs.length - 1)}\n\n`;
  });

  // 1b · Codi en línia.
  const enLinia = [];
  html = html.replace(/`([^`\n]+)`/g, (_m, codi) => {
    enLinia.push(`<code>${escapaHtml(codi)}</code>`);
    return marcador('LINIA', enLinia.length - 1);
  });

  // UniversalPage té l'h1 de pàgina. El nivell visual conserva la classe
  // tipogràfica canònica; el nivell semàntic comença un esglaó més avall.
  html = html.replace(/^(#{1,6}) (.*$)/gim, (_match, hashes, text) => {
    const visual = hashes.length;
    const semantic = Math.min(visual + 1, 6);
    return `<h${semantic} class="h${visual}">${text}</h${semantic}>`;
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

  // Formatting. El contingut no pot començar ni acabar en espai ni en asterisc.
  html = html.replace(/\*\*([^\s*](?:(?:(?!\*\*)[^\n])*?[^\s*])?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^\s*](?:[^*\n]*[^\s*])?)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');

  // Lists
  html = html.replace(/^\s*-\s+(.*)$/gim, '<li>$1</li>');
  html = html.replace(/<\/li>\n<li>/gim, '</li><li>');
  html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');

  // Tables
  html = html.replace(/^\|(.+)\|[ \t]*\n\|([-: |]+)\|[ \t]*\n((\|.*\|[ \t]*(?:\n|$))+)/gm, (match, head, sep, body) => {
    const thead = '<thead><tr>' + head.split('|').map(c => `<th>${c.trim()}</th>`).join('') + '</tr></thead>';
    const tbody = '<tbody>' + body.trim().split('\n').map(row => {
      return '<tr>' + row.trim().split('|').slice(1, -1).map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
    }).join('') + '</tbody>';
    return `<div><table>\n${thead}\n${tbody}\n</table></div>`;
  });

  // Paragraphs (grouping hard-wrapped lines)
  const blocks = html.split(/\n\s*\n/);
  html = blocks.map(block => {
    if (block.trim() === '') return '';
    if (block.trim().match(/^(<h|<u|<l|<a|<hr|<div|<blockquote|\u0000BLOC)/)) return block;
    // Text net: ajuntem les línies amb un espai
    return `<p>${block.trim().replace(/\n/g, ' ')}</p>`;
  }).join('\n\n');

  return html
    .replace(/\u0000LINIA(\d+)\u0000/g, (_m, index) => enLinia[Number(index)])
    .replace(/\u0000BLOC(\d+)\u0000/g, (_m, index) => blocs[Number(index)]);
}
