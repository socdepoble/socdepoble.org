import { LIMITS_EDITORIALS, textAcotat } from './xmlEditorialSegur.js';
const ENTITIES = Object.freeze({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', laquo: '«', raquo: '»', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', hellip: '…', bull: '•', middot: '·', copy: '©', euro: '€' });
const DROP = new Set(['script', 'style', 'svg', 'math', 'iframe', 'object', 'embed', 'template', 'form', 'textarea', 'xmp', 'plaintext']);
const ALLOWED = new Set(['p', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'strong', 'em', 'blockquote', 'a']);
const BLOCKS = new Set(['p', 'div', 'section', 'article', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'figure', 'figcaption']);
const escape = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// Gauntlet v1.2.13 · Primer l'escapat de Markdown i després el d'HTML: a l'inrevés, «'» acabava com a «&\#39;» literal.
const markdownText = s => escape(s.replace(/[\\`*_{}[\]()!#|]/g, c => `\\${c}`));
function entities(text) {
  // Bounded entity alphabet: unknown entities stay text and are escaped later.
  return text.replace(/&(#x[0-9a-fA-F]{1,8}|#[0-9]{1,8}|[A-Za-z]{2,16});/g, (whole, key) => {
    if (!key.startsWith('#')) return Object.hasOwn(ENTITIES, key) ? ENTITIES[key] : whole;
    const n = Number.parseInt(key.slice(key.startsWith('#x') ? 2 : 1), key.startsWith('#x') ? 16 : 10);
    return n > 31 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff) ? String.fromCodePoint(n) : '\ufffd';
  });
}
export function urlEditorialSegura(value, base) {
  if (typeof value !== 'string' || value.length > 2048 || value !== value.trim() || /[\s\\\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060-\u206f]/u.test(value)) return null;
  try {
    const url = base ? new URL(value, base) : new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port) return null;
    return url.href;
  } catch { return null; }
}
function attrs(text) {
  const out = Object.create(null);
  let at = 0;
  while (at < text.length) {
    while (at < text.length && /[\s/]/u.test(text[at])) at++;
    const start = at;
    while (at < text.length && !/[\s=/]/u.test(text[at])) at++;
    const name = text.slice(start, at).toLowerCase();
    if (!name) { at++; continue; }
    while (at < text.length && /\s/u.test(text[at])) at++;
    if (text[at] !== '=') { if (!Object.hasOwn(out, name)) out[name] = ''; continue; }
    at++; while (at < text.length && /\s/u.test(text[at])) at++;
    let value;
    if (text[at] === '"' || text[at] === "'") {
      const quote = text[at++], end = text.indexOf(quote, at);
      if (end === -1) break;
      value = text.slice(at, end); at = end + 1;
    } else {
      const first = at;
      while (at < text.length && !/\s/u.test(text[at])) at++;
      value = text.slice(first, at);
    }
    if (!Object.hasOwn(out, name)) out[name] = entities(value);
    if (Object.keys(out).length > 128) throw new TypeError('Massa atributs HTML.');
  }
  return out;
}
/** Rebuilds a small HTML vocabulary; original attributes/markup never escape.
 * Markdown is escaped text + headings, media is separate structured metadata.
 * No DOM parser, fetch, script, style, SVG, handlers or user CSS survives. */
export function sanejaHtmlEditorial(input, { base } = {}) {
  const html = textAcotat(input, LIMITS_EDITORIALS.articleBytes);
  const out = [], md = [], plain = [], blocks = [], images = [], stack = [], dropped = [];
  let cursor = 0, tokens = 0, current = [], currentType = 'paragraph', subtitle = '', lead = '';
  const flush = () => {
    const text = current.join('').replace(/\s+/gu, ' ').trim(); current = [];
    if (!text) return;
    blocks.push({ type: currentType, text });
    if (currentType === 'subtitle' && !subtitle) subtitle = text;
    if (currentType === 'paragraph' && !lead) lead = text;
    currentType = 'paragraph';
  };
  const emitText = value => {
    if (!value || dropped.length) return;
    const decoded = entities(value);
    out.push(escape(decoded)); md.push(markdownText(decoded)); plain.push(decoded); current.push(decoded);
  };
  while (cursor < html.length) {
    const open = html.indexOf('<', cursor);
    if (open === -1) { emitText(html.slice(cursor)); break; }
    emitText(html.slice(cursor, open));
    if (++tokens > LIMITS_EDITORIALS.nodes) throw new TypeError('Massa etiquetes HTML.');
    if (html.startsWith('<!--', open)) {
      const end = html.indexOf('-->', open + 4); cursor = end === -1 ? html.length : end + 3; continue;
    }
    let end = open + 1, quote = '';
    for (; end < html.length; end++) {
      const c = html[end];
      if (quote) { if (c === quote) quote = ''; }
      else if (c === '"' || c === "'") quote = c;
      else if (c === '>') break;
    }
    if (end === html.length) { emitText(html.slice(open)); break; }
    const raw = html.slice(open + 1, end), match = /^\/?([A-Za-z][A-Za-z0-9:-]*)/.exec(raw);
    cursor = end + 1;
    if (!match) continue;
    const name = match[1].toLowerCase(), close = raw[0] === '/';
    if (dropped.length) {
      if (close && name === dropped.at(-1)) dropped.pop();
      else if (!close && DROP.has(name) && !raw.endsWith('/')) {
        if (dropped.length >= LIMITS_EDITORIALS.depth) throw new TypeError('HTML massa profund.');
        dropped.push(name);
      }
      continue;
    }
    if (DROP.has(name)) { if (!close && name !== 'embed') dropped.push(name); continue; }
    if (name === 'br') { out.push('<br>'); md.push('\n'); plain.push('\n'); current.push(' '); continue; }
    if (BLOCKS.has(name)) { flush(); md.push('\n\n'); plain.push('\n'); if (!close) currentType = name === 'h2' ? 'subtitle' : name.startsWith('h') ? 'heading' : 'paragraph'; }
    const tag = name === 'h1' || name === 'h2' ? 'h3' : name === 'b' ? 'strong' : name === 'i' ? 'em' : name;
    if (close) {
      const index = stack.lastIndexOf(tag);
      if (index !== -1) { while (stack.length > index) out.push(`</${stack.pop()}>`); }
      continue;
    }
    const attributes = attrs(raw.slice(match[0].length));
    if (name === 'img') {
      const url = urlEditorialSegura(attributes['data-src'] || attributes.src, base);
      if (!url) continue;
      const width = /^[1-9][0-9]{0,3}$/.test(attributes.width || '') ? Number(attributes.width) : null;
      const height = /^[1-9][0-9]{0,3}$/.test(attributes.height || '') ? Number(attributes.height) : null;
      const classes = (attributes.class || '').split(/\s+/u);
      const alineacio = classes.includes('alignright') || attributes.align === 'right' ? 'dreta' : classes.includes('alignleft') || attributes.align === 'left' ? 'esquerra' : 'centre';
      const image = { url, alt: attributes.alt || '', width, height, alineacio, index: blocks.length };
      images.push(image);
      out.push(`<img src="${escape(url)}" alt="${escape(image.alt)}" loading="lazy"${width ? ` width="${width}"` : ''}${height ? ` height="${height}"` : ''}>`);
      continue;
    }
    if (!ALLOWED.has(tag)) continue;
    let suffix = '';
    if (tag === 'a') {
      const href = urlEditorialSegura(attributes.href, base);
      if (!href) continue;
      suffix = ` href="${escape(href)}" rel="noopener noreferrer"`;
    }
    if (stack.length >= LIMITS_EDITORIALS.depth) throw new TypeError('HTML massa profund.');
    out.push(`<${tag}${suffix}>`); stack.push(tag);
    if (tag.startsWith('h')) md.push('### ');
  }
  flush();
  while (stack.length) out.push(`</${stack.pop()}>`);
  return { htmlNet: out.join('').trim(), markdown: md.join('').replace(/\n{3,}/g, '\n\n').trim(), text: plain.join('').replace(/\s+/gu, ' ').trim(), blocks, subtitle, lead, mitjans: images };
}
export function textEditorialNet(input) { return sanejaHtmlEditorial(input).text; }
