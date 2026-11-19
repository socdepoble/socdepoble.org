import { lstatSync, readFileSync } from 'node:fs';
/** CSS lexical surface for static gates. Strings and comments are data, never declarations.
 * Preserves ordinary newlines; escaped identifiers may shift columns. Rejects incomplete input.
 * This is a lexer, not a cascade/layout validator. No CSS is executed.
 */
const blank = s => s.replace(/[^\n]/g, ' ');

/** Legacy leaf-block surface, one forward scan. Input is already lexicalized
 * by consumers that need strings/comments masked. This does not validate CSS
 * or interpret nesting, selectors or the cascade. Ranges are disjoint, so
 * copying all returned selectors/bodies is also bounded by input length. */
export function* blocsCssFulla(text) {
  let start = 0, opening = -1, selector = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      opening = i;
      selector = start;
      start = i + 1;
    } else if (text[i] === '}') {
      if (opening > selector) yield { selector: text.slice(selector, opening), body: text.slice(opening + 1, i), index: selector };
      opening = -1;
      start = i + 1;
    }
  }
}

export function cssAnalitzable(font, { atributs = false } = {}) {
  let out = '';
  const stack = [];
  for (let i = 0; i < font.length;) {
    const c = font[i];
    if (c === '/' && font[i + 1] === '*') {
      const end = font.indexOf('*/', i + 2);
      if (end < 0) throw new Error('CSS no certificable: comentari sense tancar');
      out += blank(font.slice(i, end + 2)); i = end + 2; continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      for (; j < font.length; j++) {
        if (font[j] === '\\') { j++; continue; }
        if (font[j] === c) break;
        if (font[j] === '\n' || font[j] === '\r') throw new Error('CSS no certificable: cadena sense tancar');
      }
      if (j >= font.length) throw new Error('CSS no certificable: cadena sense tancar');
      out += atributs && stack.at(-1) === '[' ? font.slice(i, j + 1) : blank(font.slice(i, j + 1)); i = j + 1; continue;
    }
    if (c === '\\') {
      const hex = /^[0-9a-fA-F]{1,6}(?:\r\n|[\t\n\r\f ])?/.exec(font.slice(i + 1));
      if (hex) {
        const cp = parseInt(hex[0], 16);
        out += cp > 0 && cp <= 0x10ffff && !(cp >= 0xd800 && cp <= 0xdfff) ? String.fromCodePoint(cp) : '\uFFFD';
        i += 1 + hex[0].length; continue;
      }
      if (!font[i + 1] || /[\r\n\f]/.test(font[i + 1])) throw new Error('CSS no certificable: escapament incomplet');
      out += font[i + 1]; i += 2; continue;
    }
    if ('{[('.includes(c)) stack.push(c);
    if ('}])'.includes(c) && stack.pop() !== ({ '}': '{', ']': '[', ')': '(' })[c]) throw new Error('CSS no certificable: delimitadors divergents');
    out += c; i++;
  }
  if (stack.length) throw new Error('CSS no certificable: bloc o funció sense tancar');
  return out;
}

/** Only custom-property declarations at a declaration boundary; quoted content never counts. */
export function declaracionsTokensCSS(font) {
  const css = cssAnalitzable(font);
  return [...css.matchAll(/(?:^|[;{}])\s*(--[\w-]+)\s*:\s*([^;{}]*)/g)]
    .map(m => ({ nom: m[1], valor: m[2].trim(), index: m.index }));
}

/** Decode a regular source file without silently replacing invalid UTF-8 bytes. */
export function fontUTF8(abs) {
  const stat = lstatSync(abs);
  if (stat.isSymbolicLink() || !stat.isFile()) throw new Error(`Font no regular o symlink: ${abs}`);
  return new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(abs));
}
