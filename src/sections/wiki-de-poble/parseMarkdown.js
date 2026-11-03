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
 * R-07 (pla 261029_0216, Pas 2 i Pas 9) 261029:
 *  9 · extreuEditorial() salta el preàmbul que no és contingut (línies
 *      buides, comentaris HTML i un frontmatter romanent) abans de buscar
 *      l'H1: les plantilles obrin amb <!-- SDP:EIXIDA … --> i el títol social
 *      eixia com l'id cru del fitxer.
 *
 * Sense lookbehind: el Baseline és Safari 16.0 i no l'admet fins a 16.4.
 */

import { iniciDelContingut } from '../../utils/iniciEditorial.js';
import { llevaPuntFinal } from '../../components/universal/editorial.js';
import { marcaDeTaula } from '../../utils/sanitize.js';

const escapaHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const desescapaHtml = (text) => text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/* P1-16 · Les referències de caràcter que el navegador descodifica en pintar
   la capçalera, perquè el nom diga el mateix text: una llista tancada de
   noms i les numèriques. Un control, un subrogat UTF-16 o un número fora de
   rang és un espai (cap \u0000 no pot fer-se passar per un marcador); un
   nom que no és a la llista es queda tal qual. */
const ENTITATS = Object.freeze({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' });
const esPuntPintable = (punt) => punt >= 0x20 && punt <= 0x10ffff && !(punt >= 0x7f && punt <= 0x9f) && !(punt >= 0xd800 && punt <= 0xdfff);
const descodificaEntitats = (text) => text.replace(/&(?:#(\d{1,7})|#[xX]([0-9a-fA-F]{1,6})|([a-z]+));/g, (entitat, decimal, hexa, nom) => {
  if (nom) return Object.hasOwn(ENTITATS, nom) ? ENTITATS[nom] : entitat;
  const punt = decimal ? Number(decimal) : parseInt(hexa, 16);
  return esPuntPintable(punt) ? String.fromCodePoint(punt) : ' ';
});

/* P1-16 (pla 261028_1526 §3.5.1) · El nom accessible d'una taula, «Taula: »
   i les columnes de la capçalera en text pla, per a un atribut entre cometes.
   Regles lineals: les etiquetes fora, les referències de caràcter
   descodificades (abans del codi, que ja és text), el codi en línia resolt al
   seu text (si no, el pas final hi injectaria el <code>), cap angle
   (DOMPurify esborra un atribut amb «-->» o «</style») i & i " escapats. Com
   a molt NOM_TAULA caràcters; sense cap columna amb text, «Taula N» (l'ordre
   en el document). */
const NOM_TAULA = 120;
export const ETIQUETA_TAULA_DESPLACABLE = 'Taula desplaçable';

function escapaAtribut(text) {
  return String(text)
    .replace(/[<>\s]+/g, ' ')
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
}

// Una etiqueta externa no pot reactivar les marques provisionals del parser.
function etiquetaDeTaula(valor) {
  if (typeof valor !== 'string') return '';
  const net = valor.replace(/\u0000[A-Z]+\d*\u0000/g, '')
    .replace(/[\u0000-\u001f\u007f-\u009f\p{Cf}]/gu, '')
    .replace(/[<>\s]+/g, ' ').trim();
  const punts = [...net];
  const curt = punts.length > NOM_TAULA
    ? `${punts.slice(0, NOM_TAULA - 1).join('').trimEnd()}…` : net;
  return escapaAtribut(curt);
}

function nomDeTaula(capcalera, enLinia, n) {
  const columnes = capcalera.map((cella) => descodificaEntitats(cella.replace(/<[^<>]*>/g, ''))
    .replace(/\u0000LINIA(\d+)\u0000/g, (_m, i) => desescapaHtml((enLinia[Number(i)] ?? '').replace(/<[^<>]*>/g, '')))
    .replace(/[<>\s]+/g, ' ')
    .trim()).filter(Boolean);
  let nom = columnes.length ? `Taula: ${columnes.join(', ')}` : `Taula ${n}`;
  const punts = [...nom];
  if (punts.length > NOM_TAULA) nom = `${punts.slice(0, NOM_TAULA - 1).join('').trimEnd()}…`;
  return nom.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

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

/* O7 · Els salts tous no trenquen strong ni em, però només dins d'un paràgraf
   pla, abans d'ajuntar-ne les línies (Gauntlet WC-04): al pas global, un «*»
   en dues files de taula o en dues línies de cita s'aparellava i fusionava les
   files. Cap parella travessa una etiqueta de bloc (un <hr /> o una taula
   enganxats al paràgraf). Regles lineals: cap parella creua un altre «**». */
const ETIQUETA_BLOC = /<\/?(?:p|div|table|thead|tbody|tr|t[dh]|blockquote|hr|ul|ol|li|h[1-6]|pre)\b/i;
const parellaSaltTou = (parella, text, etiqueta) => (ETIQUETA_BLOC.test(text) ? parella : `<${etiqueta}>${text.replace(/\n/g, ' ')}</${etiqueta}>`);
function formatSaltTou(text) {
  if (!text.includes('\n')) return text;
  return text
    .replace(/\*\*([^\s*](?:(?:(?!\*\*)[\s\S])*?[^\s*])?)\*\*/g, (parella, t) => parellaSaltTou(parella, t, 'strong'))
    .replace(/\*([^\s*](?:[^*]*?[^\s*])?)\*/g, (parella, t) => parellaSaltTou(parella, t, 'em'));
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

/* O7 · La llista és un bloc amb ítems, no una successió de regex sobre <li>.
   El sagnat del contingut manté paràgrafs, subllistes i codi dins de l'ítem.
   Les llistes separades conserven start; repetir «1.» continua numerant com a
   Markdown. La recursió és limitada i mai s'interpreten tanques de codi.
   WC-01 · ([^\n]*)$ i no (.*)$: el «.» s'atura davant de \r, U+2028 i U+2029,
   «$» sense /m només casa al final i la tirada d'espais es repartia entre
   [ \t]+ i (.*) en O(k²). Les línies ja no porten \n: «$» casa al primer intent. */
const MARCA_LLISTA = /^([ \t]*)([-+*]|\d{1,9}[.)])[ \t]+([^\n]*)$/;
const amplariaSagnat = text => text.replace(/\t/g, '    ').length;

/* WC-03 · Una sola regla de tanca, la de l'antic pas 1a: extreuLlistes aparta
   el codi amb la MATEIXA regex i en un sol pas. Una tanca sense parella no és
   codi, i el codi que s'obri dins d'un ítem hi continua fins a la seua parella.
   fi[n]: l'última línia del bloc que obri la línia n (o -1).
   Ronda 3 · Amb /m, «^» i «$» casen també a \r, U+2028 i U+2029, que no
   parteixen les línies de split('\n'): un bloc pot obrir o tancar a mitja
   línia, i dos blocs poden compartir-ne una. tros[n] alterna el text de fora i
   les captures, de la línia n a la fi[n], com el replace de l'antic pas 1a:
   no es perd res de davant, d'entremig ni de darrere. Lineal. */
const BLOC_CODI = /^[ \t]*(`{3,}|~{3,})[ \t]*([\w+-]*)[^\n]*\n([\s\S]*?)^[ \t]*\1[ \t]*$/gm;
function blocsDeCodi(md, total) {
  const fi = new Array(total).fill(-1);
  const tros = [];
  const finalDeLinia = desDe => {
    const salt = md.indexOf('\n', desDe);
    return salt === -1 ? md.length : salt;
  };
  let linia = 0;
  let pos = 0; // la fi de l'última captura
  let iniciLinia = 0;
  let obri = -1;
  for (const m of md.matchAll(BLOC_CODI)) {
    const salt = finalDeLinia(pos);
    if (obri >= 0 && salt > m.index) {
      tros[obri].push(md.slice(pos, m.index), m); // a la línia on tanca l'anterior
    } else {
      if (obri >= 0) tros[obri].push(md.slice(pos, salt));
      for (; pos < m.index; pos += 1) if (md.charCodeAt(pos) === 10) { linia += 1; iniciLinia = pos + 1; }
      obri = linia;
      tros[obri] = [md.slice(iniciLinia, m.index), m];
    }
    for (pos = m.index; pos < m.index + m[0].length; pos += 1) if (md.charCodeAt(pos) === 10) { linia += 1; iniciLinia = pos + 1; }
    fi[obri] = linia;
  }
  if (obri >= 0) tros[obri].push(md.slice(pos, finalDeLinia(pos)));
  return { fi, tros };
}

// 1a · Un bloc de codi tancat. Envoltat de línies buides perquè el pas de
//      paràgrafs el tracte com a bloc propi i no el fique dins d'un <p>.
function apartaCodi([, , llengua, codi], blocs) {
  const lang = llengua ? llengua.toLowerCase().trim() : '';
  if (lang === 'mermaid') {
    blocs.push(`<div class="sdp-diagrama-card"><div class="sdp-diagrama-capcalera"><span>📐</span> Diagrama d’arquitectura</div><pre class="sdp-diagrama-cos"><code class="language-mermaid">${escapaHtml(codi.replace(/\n$/, ''))}</code></pre></div>`);
  } else {
    const classe = llengua ? ` class="language-${llengua}"` : '';
    blocs.push(`<pre><code${classe}>${escapaHtml(codi.replace(/\n$/, ''))}</code></pre>`);
  }
  return `\n\n${marcador('BLOC', blocs.length - 1)}\n\n`;
}

// El codi de dins d'un ítem perd el sagnat de l'ítem, mai cap caràcter.
const desindenta = (linia, columna) => {
  const ampla = linia.replace(/\t/g, '    ');
  return ampla.slice(Math.min(columna, /^ */.exec(ampla)[0].length));
};

/* WC-02 · Si cada línia COMENÇA dins d'un comentari HTML, segons les
   anteriors (també les que una llista es menja): un «<!-- … -->» al final del
   primer ítem no el trau de la llista, i un «<!--» de dins de codi (un bloc o
   `en línia`, la regla del pas 1b) és text. Mana l'últim delimitador de la
   línia; lineal (lastIndexOf). Ronda 3 · Del codi, compta el text de fora. */
function iniciEnComentari(linies, fiCodi, trosCodi) {
  const dins = new Array(linies.length);
  let comentari = false;
  const llig = (linia) => {
    const text = linia.replace(/`[^`\n]+`/g, '');
    const obri = text.lastIndexOf('<!--');
    const tanca = text.lastIndexOf('-->');
    if (obri > tanca) comentari = true;
    else if (tanca !== -1) comentari = false;
  };
  for (let n = 0; n < linies.length; n += 1) {
    if (fiCodi[n] >= 0) {
      dins.fill(comentari, n, fiCodi[n] + 1);
      llig(trosCodi[n].filter((_t, k) => k % 2 === 0).join('\n'));
      n = fiCodi[n];
      continue;
    }
    dins[n] = comentari;
    llig(linies[n]);
  }
  return dins;
}

function extreuLlistes(md, blocs, opcions) {
  const linies = md.split('\n');
  const { fi: fiCodi, tros: trosCodi } = blocsDeCodi(md, linies.length);
  const enComentari = iniciEnComentari(linies, fiCodi, trosCodi);
  const resultat = [];
  let i = 0;
  while (i < linies.length) {
    const linia = linies[i];
    if (fiCodi[i] >= 0) {
      // El text de davant d'un bloc que obri a mitja línia és una línia més:
      // «- ítem<U+2028>```» continua sent un ítem, com al pas 1a d'abans.
      const [abans, ...resta] = trosCodi[i];
      resultat.push((abans && !enComentari[i] ? extreuLlistes(abans, blocs, opcions) : abans)
        + resta.map((t, k) => (k % 2 ? t : apartaCodi(t, blocs))).join(''));
      i = fiCodi[i] + 1; continue;
    }
    const primer = !enComentari[i] && MARCA_LLISTA.exec(linia);
    if (!primer || opcions.nivellLlista >= 32) {
      resultat.push(linia); i += 1; continue;
    }
    const sagnat = amplariaSagnat(primer[1]);
    const tipus = /^\d/.test(primer[2]) ? 'ol' : 'ul';
    const inici = tipus === 'ol' ? Number.parseInt(primer[2], 10) : 1;
    const items = [];
    let esSolta = false;
    while (i < linies.length) {
      const cap = MARCA_LLISTA.exec(linies[i]);
      if (!cap || amplariaSagnat(cap[1]) !== sagnat || (/^\d/.test(cap[2]) ? 'ol' : 'ul') !== tipus) break;
      const columna = amplariaSagnat(cap[0].slice(0, cap[0].length - cap[3].length));
      const contingut = [cap[3]];
      i += 1;
      let buit = false;
      let fiCodiItem = -1; // WC-03 · el codi obert dins de l'ítem hi continua fins a la parella
      while (i < linies.length) {
        const seguent = linies[i];
        const dinsCodi = i <= fiCodiItem;
        if (!seguent.trim()) {
          let n = i + 1;
          while (n < linies.length && !linies[n].trim()) n += 1;
          const proxim = n > fiCodiItem && MARCA_LLISTA.exec(linies[n] || '');
          const mateixNivell = proxim && amplariaSagnat(proxim[1]) === sagnat
            && (/^\d/.test(proxim[2]) ? 'ol' : 'ul') === tipus;
          const continua = n < linies.length
            && (n <= fiCodiItem || amplariaSagnat(/^[ \t]*/.exec(linies[n])[0]) >= columna);
          if (!mateixNivell && !continua) break;
          esSolta = true;
          if (mateixNivell) { i = n; break; }
          contingut.push(''); i = n; buit = true; continue;
        }
        const marca = !dinsCodi && MARCA_LLISTA.exec(seguent);
        const marge = amplariaSagnat(/^[ \t]*/.exec(seguent)[0]);
        if (marca && amplariaSagnat(marca[1]) <= sagnat) break;
        if (marge >= columna) {
          if (!dinsCodi && fiCodi[i] >= 0) fiCodiItem = fiCodi[i];
          contingut.push(seguent.replace(/\t/g, '    ').slice(columna));
        } else if (dinsCodi) {
          contingut.push(desindenta(seguent, columna)); // tanca o codi a la columna 0
        } else if (!buit && esLiniaDeParagraf(seguent)) {
          contingut.push(seguent.trimStart()); // continuació de la mateixa frase
        } else break;
        buit = false;
        i += 1;
      }
      items.push(contingut.join('\n'));
    }
    const cos = items.map(item => {
      let contingut = parseMarkdown(item, { ...opcions, entradilla: false, nivellLlista: opcions.nivellLlista + 1 });
      if (!esSolta) contingut = contingut.replace(/^<p>([\s\S]*?)<\/p>(?=\s*(?:<(?:ul|ol|pre|div|h[1-6])\b|$))/, '$1');
      return `<li>${contingut}</li>`;
    }).join('');
    blocs.push(`<${tipus}${tipus === 'ol' && inici !== 1 ? ` start="${inici}"` : ''}>${cos}</${tipus}>`);
    resultat.push('', marcador('BLOC', blocs.length - 1), '');
  }
  return resultat.join('\n');
}

export function parseMarkdown(md, { entradilla = true, etiquetaTaula = null, nivellLlista = 0 } = {}) {
  if (!md) return '';
  let html = md.replace(/\r\n/g, '\n').replace(/\u0000/g, '');

  // 1a · Blocs de codi tancats i llistes, en un sol pas (extreuLlistes,
  //      WC-03): la mateixa regla de tanca per a tots dos.
  const blocs = [];
  html = extreuLlistes(html, blocs, { etiquetaTaula, nivellLlista });

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

  // Tables
  let taules = 0;
  html = html.replace(/^\|(.+)\|[ \t]*\n\|([-: |]+)\|[ \t]*\n((\|.*\|[ \t]*(?:\n|$))+)/gm, (match, head, sep, body) => {
    const capcalera = head.split('|').map((c) => c.trim());
    const thead = '<thead><tr>' + capcalera.map((c) => `<th scope="col">${c}</th>`).join('') + '</tr></thead>';
    const tbody = '<tbody>' + body.trim().split('\n').map(row => {
      return '<tr>' + row.trim().split('|').slice(1, -1).map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
    }).join('') + '</tbody>';
    taules += 1;
    /* IDEA-26 (261025) · La taula es desplaça dins de la seua caixa: la columna
       de la Wiki talla el que la desborda (overflow-x: hidden).
       P1-16 (pla 261028_1526 §3.5.1) / P2-16 (C1645-07) · La caixa és una regió
       amb nom i focus (WCAG 2.1.1: s'hi arriba i es desplaça amb el teclat),
       com les taules del catàleg; sanitize.js només li deixa role=region i
       tabindex=0 si porta la marca d'esta càrrega (data-sdp-taula), que lleva
       en sanejar. */
    const ariaLabelTaula = etiquetaDeTaula(etiquetaTaula)
      || nomDeTaula(capcalera, enLinia, taules);
    return `<div class="sdp-taula-prosa" role="region" aria-label="${ariaLabelTaula}" tabindex="0" data-sdp-taula="${marcaDeTaula()}"><table>\n${thead}\n${tbody}\n</table></div>`;
  });

  // Paragraphs (grouping hard-wrapped lines)
  const blocks = html.split(/\n\s*\n/);
  html = blocks.map(block => {
    const net = block.trim();
    if (net === '') return '';
    if (net.startsWith(ENTRADILLA)) return `<p class="lead">${formatSaltTou(net.slice(ENTRADILLA.length)).replace(/\n/g, ' ')}</p>`;
    // Un comentari HTML no és contingut: si davant d'un bloc només hi ha
    // comentaris, mana el que ve darrere. Ara que el títol és un bloc propi
    // (6), «### X\n<!-- nota -->\n- a» deixava un <p> buit davant de la llista.
    const senseComentaris = net.replace(/^(?:<!--[\s\S]*?-->\s*)+/, '');
    if (senseComentaris === '' || senseComentaris.match(/^(<(?:h[1-6]|ul|ol|li|hr|div|blockquote|pre|table)(?:[\s>])|\u0000BLOC)/)) return block;
    // Text net: ajuntem les línies amb un espai (abans, la negreta i la
    // cursiva partides per un salt tou: WC-04).
    return `<p>${formatSaltTou(net).replace(/\n/g, ' ')}</p>`;
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

/* R-07 (pla 261029_0216) · El preàmbul d'un document no és contingut: les
   línies buides, els comentaris HTML (les plantilles obrin amb
   <!-- SDP:EIXIDA … --> davant de l'H1) i un frontmatter romanent «---…---»
   a la primera línia. Torna la posició del primer caràcter de contingut amb
   un recorregut lineal (indexOf, cada caràcter una vegada) i sense cap
   expressió regular sobre el document: un comentari sense tancar és comentari
   fins al final, i un «# Títol» de dins d'un comentari és comentari. */

/**
 * Separa la capçalera editorial d'un document Markdown. Funció pura.
 *
 *  · titol: si el primer bloc de contingut és «# Títol», el títol en text
 *    pla, sense punt final. Si no, null. El preàmbul que no és contingut
 *    (línies buides, comentaris HTML i un frontmatter romanent) no compta
 *    (R-07): el títol d'una plantilla és el que ve darrere del comentari.
 *  · entradilla: si just després del títol ve un paràgraf pla (no títol,
 *    llista, taula, cita, codi, callout, regle, HTML, imatge ni línia
 *    d'etiqueta «**Categoria:** …»), eixe paràgraf en Markdown en línia.
 *    Si no, null.
 *  · cos: la resta del document, sense el preàmbul, el títol ni l'entradilla.
 *
 * Sense títol no hi ha entradilla: el document es torna sencer com a cos,
 * preàmbul inclòs.
 */
export function extreuEditorial(md) {
  // BOM inicial (U+FEFF) fora, per codi i no amb un caràcter invisible al font.
  const senseBom = typeof md === 'string' && md.charCodeAt(0) === 0xFEFF ? md.slice(1) : md;
  const text = typeof senseBom === 'string' ? senseBom.replace(/\r\n?/g, '\n') : '';
  // Des de la línia del primer caràcter de contingut: un «# » que no obri la
  // línia (darrere d'un «-->» o d'un sagnat) no és títol, i un preàmbul que
  // s'ho menja tot (un comentari sense tancar) no deixa cap línia.
  const inici = iniciDelContingut(text);
  const linies = inici < text.length ? text.slice(text.lastIndexOf('\n', inici - 1) + 1).split('\n') : [''];

  const capcalera = /^# (.*)$/.exec(linies[0]);
  const titol = capcalera ? textPla(capcalera[1]) : '';
  if (!titol) return { titol: null, entradilla: null, cos: text };

  let i = 1;
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
