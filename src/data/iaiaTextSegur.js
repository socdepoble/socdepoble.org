/** Text derivat de corpus IAIA, no sanejador HTML. Escàners endavant que
 * conserven les regles històriques de prosa/Markdown, incloses marques literals.
 * No toca originals, fitxers ni esborranys. */
export const esBlanc = char => char !== undefined && /\s/.test(char);
const horitzontal = char => char === ' ' || char === '\t';
const suffixCursiva = char => char === undefined || esBlanc(char) || ').,;:!?'.includes(char);
function cercador(text, token, accepta = () => true) {
  let next = -2;
  return from => {
    if (next === -2 || next !== -1 && next < from) {
      next = text.indexOf(token, from);
      while (next !== -1 && !accepta(next)) next = text.indexOf(token, next + 1);
    }
    return next;
  };
}
export function senseEtiquetesIaia(text) {
  const parts = []; let copied = 0, open = text.indexOf('<');
  while (open !== -1) {
    const end = text.indexOf('>', open + 1); if (end === -1) break;
    parts.push(text.slice(copied, open)); copied = end + 1; open = text.indexOf('<', copied);
  }
  parts.push(text.slice(copied)); return parts.join('');
}
export function substituixCodiIaia(text, transforma = code => code) {
  const parts = [], tick = cercador(text, '`'), newline = cercador(text, '\n');
  let copied = 0, i = tick(0);
  while (i !== -1) {
    const end = tick(i + 1), nl = newline(i + 1);
    if (end === -1) break;
    if (nl !== -1 && nl < end) { i = tick(nl + 1); continue; }
    if (end > i + 1) { parts.push(text.slice(copied, i), transforma(text.slice(i + 1, end))); copied = end + 1; i = tick(copied); }
    else i = end;
  }
  parts.push(text.slice(copied)); return parts.join('');
}
export function senseDestinsIaia(text) {
  const parts = []; let copied = 0, i = text.indexOf('](');
  while (i !== -1) {
    const end = text.indexOf(')', i + 2); if (end === -1) break;
    parts.push(text.slice(copied, i), ']'); copied = end + 1; i = text.indexOf('](', copied);
  }
  parts.push(text.slice(copied)); return parts.join('');
}
function etiquetaEnllacos(text) {
  const parts = []; let copied = 0, i = text.indexOf('[');
  while (i !== -1) {
    const close = text.indexOf(']', i + 1); if (close === -1) break;
    if (text[close + 1] !== '(') { i = text.indexOf('[', close + 1); continue; }
    const end = text.indexOf(')', close + 2); if (end === -1) break;
    const start = i > copied && text[i - 1] === '!' ? i - 1 : i;
    parts.push(text.slice(copied, start), text.slice(i + 1, close)); copied = end + 1; i = text.indexOf('[', copied);
  }
  parts.push(text.slice(copied)); return parts.join('');
}
function senseNegreta(text) {
  const parts = [], stars = cercador(text, '**', i => i > 0 && !esBlanc(text[i - 1])), under = cercador(text, '__', i => i > 0 && !esBlanc(text[i - 1])), newline = cercador(text, '\n');
  let copied = 0;
  for (let i = 0; i < text.length;) {
    const marker = text.slice(i, i + 2);
    if ((marker !== '**' && marker !== '__') || esBlanc(text[i + 2]) || i + 2 >= text.length) { i++; continue; }
    const nl = newline(i + 2);
    // The optional second-content group was greedy: prefer a body with at
    // least two characters; use the one-character alternative only if none.
    let end = (marker === '**' ? stars : under)(i + 4);
    if (end === -1 || nl !== -1 && nl < end) end = text.slice(i + 3, i + 5) === marker ? i + 3 : -1;
    if (end === -1) { i++; continue; }
    parts.push(text.slice(copied, i), text.slice(i + 2, end)); copied = end + 2; i = copied;
  }
  parts.push(text.slice(copied)); return parts.join('');
}
function senseCursiva(text, marker) {
  const parts = [], next = cercador(text, marker), newline = cercador(text, '\n'); let copied = 0;
  for (let i = 0; i < text.length;) {
    if (text[i] !== marker || i + 1 >= text.length || esBlanc(text[i + 1])
      || marker === '_' && i > 0 && (!esBlanc(text[i - 1]) && text[i - 1] !== '(' || i - 1 < copied)) { i++; continue; }
    let end = next(i + 2); const nl = newline(i + 1);
    if (end === -1 || nl !== -1 && nl < end) { i++; continue; }
    if (end === i + 2 && text[end + 1] === marker || esBlanc(text[end - 1]) || marker === '_' && !suffixCursiva(text[end + 1])) {
      if (text[end + 1] === marker && (marker !== '_' || suffixCursiva(text[end + 2]))) end++;
      else { i++; continue; }
    }
    parts.push(text.slice(copied, i), text.slice(i + 1, end)); copied = end + 1; i = copied;
  }
  parts.push(text.slice(copied)); return parts.join('');
}
function senseTancaTitol(text) {
  let end = text.length; while (end > 0 && horitzontal(text[end - 1])) end--;
  let start = end; while (start > 0 && text[start - 1] === '#') start--;
  if (start === end || !horitzontal(text[start - 1])) return text;
  while (start > 0 && horitzontal(text[start - 1])) start--;
  return text.slice(0, start);
}
export function textPlaIaia(md, llevaPunt = true) {
  let text = etiquetaEnllacos(substituixCodiIaia(senseEtiquetesIaia(senseTancaTitol(md))));
  text = senseCursiva(senseCursiva(senseNegreta(text), '*'), '_').trim();
  if (!llevaPunt || !text.endsWith('.') || text.length < 2 || text[text.length - 2] === '.') return text;
  return text.slice(0, -1).trimEnd();
}
export function senseComentarisTancatsIaia(text) {
  const parts = []; let copied = 0, i = text.indexOf('<!--');
  while (i !== -1) { const end = text.indexOf('-->', i + 4); if (end === -1) break; parts.push(text.slice(copied, i)); copied = end + 3; i = text.indexOf('<!--', copied); }
  parts.push(text.slice(copied)); return parts.join('');
}
export function senseTanquesIaia(text, token) {
  const parts = [], newline = cercador(text, '\n'); let copied = 0, i = text.indexOf(token);
  while (i !== -1) {
    const nl = newline(i + token.length); if (nl === -1) break;
    const end = text.indexOf(token, nl + 1); if (end === -1) break;
    parts.push(text.slice(copied, i)); copied = end + token.length; i = text.indexOf(token, copied);
  }
  parts.push(text.slice(copied)); return parts.join('');
}
export function senseFrontmatterIaia(text) {
  if (!text.startsWith('---')) return text;
  let i = 3, lastHeader = -1, headerLines = 0;
  while (i < text.length && esBlanc(text[i])) { if (text[i] === '\n') { lastHeader = i; headerLines++; } i++; }
  if (lastHeader === -1) return text;
  const tail = pos => {
    let after = pos + 4, lastNewline = -1;
    while (after < text.length && esBlanc(text[after])) { if (text[after] === '\n') lastNewline = after; after++; }
    return after === text.length ? after : lastNewline === -1 ? -1 : lastNewline + 1;
  };
  let end = text.indexOf('\n---', lastHeader + 1);
  while (end !== -1) { const after = tail(end); if (after !== -1) return text.slice(after); end = text.indexOf('\n---', end + 1); }
  if (headerLines > 1 && text.startsWith('\n---', lastHeader)) { const after = tail(lastHeader); if (after !== -1) return text.slice(after); }
  return text;
}

/* Un token sense espais que porta separador de codi es lleva sencer. Si és
 * una extensió, la captura golosa antiga acabava en l'última extensió vàlida. */
export function substituixNomsCodiIaia(text, transforma = () => ' ') {
  const parts = []; let i = 0;
  while (i < text.length) {
    if (esBlanc(text[i])) { parts.push(text[i++]); continue; }
    const start = i; while (i < text.length && !esBlanc(text[i])) i++;
    const token = text.slice(start, i);
    if (/[_/\\]/.test(token)) { parts.push(transforma(token)); continue; }
    const extension = /\.(?:md|mjs|js|jsx|json|css|html|sql)\b/giu; let match, last = 0;
    while ((match = extension.exec(token))) if (match.index > 0) last = match.index + match[0].length;
    parts.push(last ? transforma(token.slice(0, last)) + token.slice(last) : token);
  }
  return parts.join('');
}
const localEmail = char => char !== undefined && /[\w.+-]/u.test(char);
const domainEmail = char => char !== undefined && /[\w-]/u.test(char);
export function senseContactesIaia(text) {
  const parts = []; let copied = 0, i = 0;
  while (i < text.length) {
    if (!localEmail(text[i])) { i++; continue; }
    const start = i; while (i < text.length && localEmail(text[i])) i++;
    if (text[i] !== '@') continue;
    let end = i + 1; while (end < text.length && domainEmail(text[end])) end++;
    if (end === i + 1) continue;
    let validEnd = -1;
    while (text[end] === '.' && domainEmail(text[end + 1])) { end += 2; while (end < text.length && domainEmail(text[end])) end++; validEnd = end; }
    if (validEnd === -1) continue;
    const from = start > copied && text[start - 1] === '@' ? start - 1 : start;
    parts.push(text.slice(copied, from), '[contacte omés]'); copied = validEnd; i = copied;
  }
  parts.push(text.slice(copied)); return parts.join('');
}

export function sensePuntuacioFinalIaia(text, characters) {
  let end = text.length; while (end > 0 && characters.includes(text[end - 1])) end--;
  return text.slice(0, end);
}
