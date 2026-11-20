/** XML bounded, non-resolving and forward-only. DTD/entities/PI are refused.
 * This is the strict CMS export subset, not a general XML processor. */
export const LIMITS_EDITORIALS = Object.freeze({ bytes: 8 * 1024 * 1024, nodes: 100000, depth: 64, articles: 10000, articleBytes: 512 * 1024, mediaBytes: 32 * 1024 * 1024, totalMediaBytes: 128 * 1024 * 1024, activeNamespaces: 256, namespaceDeclarations: 4096 });
const XML_ENTITIES = Object.freeze({ amp: '&', lt: '<', gt: '>', apos: "'", quot: '"' });
const NAME = /^[A-Za-z_][A-Za-z0-9_.:-]*$/;
const WS = /[\t\n\r ]/;
const validPoint = n => n === 9 || n === 10 || n === 13 || n >= 32 && n <= 0xd7ff || n >= 0xe000 && n <= 0xfffd || n >= 0x10000 && n <= 0x10ffff;
export function textAcotat(value, max = LIMITS_EDITORIALS.bytes) {
  if (typeof value !== 'string' || value.length > max || new TextEncoder().encode(value).byteLength > max) throw new TypeError('Text editorial invàlid o fora de pressupost.');
  for (const c of value) if (!validPoint(c.codePointAt(0))) throw new TypeError('Caràcter XML invàlid.');
  return value;
}
export function desescapaEntitatsXml(value) {
  const out = [];
  let start = 0;
  for (let at = value.indexOf('&'); at !== -1; at = value.indexOf('&', start)) {
    out.push(value.slice(start, at));
    const end = value.indexOf(';', at + 1);
    if (end === -1 || end - at > 32) throw new TypeError('Entitat XML invàlida.');
    const entity = value.slice(at + 1, end);
    let decoded = Object.hasOwn(XML_ENTITIES, entity) ? XML_ENTITIES[entity] : undefined;
    if (entity.startsWith('#')) {
      const hex = entity.startsWith('#x');
      const digits = entity.slice(hex ? 2 : 1);
      if (!(hex ? /^[0-9a-fA-F]{1,8}$/ : /^[0-9]{1,8}$/).test(digits)) throw new TypeError('Entitat numèrica XML invàlida.');
      const point = Number.parseInt(digits, hex ? 16 : 10);
      if (!validPoint(point)) throw new TypeError('Caràcter XML invàlid.');
      decoded = String.fromCodePoint(point);
    }
    if (decoded === undefined) throw new TypeError('Entitats XML externes o desconegudes prohibides.');
    out.push(decoded); start = end + 1;
  }
  out.push(value.slice(start));
  return out.join('');
}
function qname(name) {
  if (!NAME.test(name) || name.split(':').length > 2 || name.endsWith(':')) throw new TypeError('Nom XML invàlid.');
  const colon = name.indexOf(':');
  return colon === -1 ? ['', name] : [name.slice(0, colon), name.slice(colon + 1)];
}
/** Nodes hold ordered text/children. Text is decoded once; CDATA stays literal. */
export function parsejaXmlEditorialSegur(input) {
  const text = textAcotat(input).replace(/^\uFEFF/, '');
  const root = { name: '#document', local: '#document', uri: '', attrs: Object.create(null), parts: [], ns: Object.assign(Object.create(null), { xml: 'http://www.w3.org/XML/1998/namespace' }), nsActive: 1 };
  const stack = [root];
  let cursor = 0, nodes = 0, namespaceDeclarations = 0;
  const pushText = (value, literal = false) => {
    if (!value) return;
    if (!literal && value.includes(']]>')) throw new TypeError('Tancament CDATA fora de context.');
    if (stack.length === 1 && value.trim()) throw new TypeError('Text fora de l’arrel XML.');
    stack.at(-1).parts.push(literal ? value : desescapaEntitatsXml(value));
  };
  while (cursor < text.length) {
    const open = text.indexOf('<', cursor);
    if (open === -1) { pushText(text.slice(cursor)); cursor = text.length; break; }
    pushText(text.slice(cursor, open));
    if (text.startsWith('<!--', open)) {
      const end = text.indexOf('-->', open + 4);
      if (end === -1 || text.slice(open + 4, end).includes('--')) throw new TypeError('Comentari XML invàlid.');
      cursor = end + 3; continue;
    }
    if (text.startsWith('<![CDATA[', open)) {
      const end = text.indexOf(']]>', open + 9);
      if (end === -1 || stack.length === 1) throw new TypeError('CDATA XML invàlid.');
      pushText(text.slice(open + 9, end), true); cursor = end + 3; continue;
    }
    if (text.startsWith('<?xml ', open) && open === 0) {
      const end = text.indexOf('?>', open + 6);
      if (end === -1 || end > 256 || !/^<\?xml\s+version=(?:"1\.0"|'1\.0')(?:\s+encoding=(?:"UTF-8"|'UTF-8'))?(?:\s+standalone=(?:"(?:yes|no)"|'(?:yes|no)'))?\s*\?>$/i.test(text.slice(open, end + 2))) throw new TypeError('Declaració XML no compatible.');
      cursor = end + 2; continue;
    }
    if (text[open + 1] === '!' || text[open + 1] === '?') throw new TypeError('DTD, entitats i instruccions XML prohibides.');
    let at = open + 1;
    const closing = text[at] === '/';
    if (closing) at++;
    const nameStart = at;
    while (at < text.length && !WS.test(text[at]) && text[at] !== '>' && text[at] !== '/') at++;
    const name = text.slice(nameStart, at);
    qname(name);
    if (closing) {
      while (at < text.length && WS.test(text[at])) at++;
      if (text[at] !== '>' || stack.length === 1 || stack.at(-1).name !== name) throw new TypeError('Tancament XML inconsistent.');
      const closed = stack.pop(); delete closed.ns; delete closed.nsActive;
      cursor = at + 1; continue;
    }
    const attrs = Object.create(null);
    while (at < text.length) {
      const beforeWhitespace = at;
      while (at < text.length && WS.test(text[at])) at++;
      if (text[at] === '>' || text[at] === '/') break;
      if (at === beforeWhitespace) throw new TypeError('Separador d’atribut XML absent.');
      const start = at;
      while (at < text.length && !WS.test(text[at]) && text[at] !== '=') at++;
      const key = text.slice(start, at); qname(key);
      while (at < text.length && WS.test(text[at])) at++;
      if (text[at++] !== '=') throw new TypeError('Atribut XML invàlid.');
      while (at < text.length && WS.test(text[at])) at++;
      const quote = text[at++];
      if (quote !== '"' && quote !== "'") throw new TypeError('Atribut XML sense cometes.');
      const end = text.indexOf(quote, at);
      if (end === -1 || Object.hasOwn(attrs, key) || text.slice(at, end).includes('<')) throw new TypeError('Atribut XML duplicat o truncat.');
      attrs[key] = desescapaEntitatsXml(text.slice(at, end)); at = end + 1;
      if (Object.keys(attrs).length > 128) throw new TypeError('Massa atributs XML.');
    }
    const selfClosing = text[at] === '/';
    if (selfClosing) at++;
    if (text[at] !== '>') throw new TypeError('Etiqueta XML truncada.');
    const namespaceKeys = Object.keys(attrs).filter(key => key === 'xmlns' || key.startsWith('xmlns:'));
    namespaceDeclarations += namespaceKeys.length;
    const nsActive = stack.at(-1).nsActive + namespaceKeys.length;
    if (nsActive > LIMITS_EDITORIALS.activeNamespaces || namespaceDeclarations > LIMITS_EDITORIALS.namespaceDeclarations) throw new TypeError('XML fora de pressupost de namespaces.');
    // Persistent scope: leaves reuse the parent; declarations add one small
    // scope. Never copy the full inherited namespace map for each node.
    const ns = namespaceKeys.length ? Object.create(stack.at(-1).ns) : stack.at(-1).ns;
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'xmlns') ns[''] = value;
      else if (key.startsWith('xmlns:')) {
        const prefix = key.slice(6);
        if (prefix === 'xmlns' || prefix === 'xml' && value !== ns.xml || !value) throw new TypeError('Namespace XML invàlid.');
        ns[prefix] = value;
      }
    }
    const [prefix, local] = qname(name);
    if (prefix && !(prefix in ns)) throw new TypeError('Prefix XML desconegut.');
    const expandedAttrs = new Set();
    for (const key of Object.keys(attrs)) {
      if (key === 'xmlns' || key.startsWith('xmlns:')) continue;
      const [p, l] = qname(key);
      if (p && !(p in ns)) throw new TypeError('Prefix d’atribut desconegut.');
      const expanded = `${p ? ns[p] : ''}|${l}`;
      if (expandedAttrs.has(expanded)) throw new TypeError('Atribut XML ambigu.');
      expandedAttrs.add(expanded);
    }
    const node = { name, local, uri: ns[prefix] || '', attrs, parts: [], ns, nsActive };
    if (++nodes > LIMITS_EDITORIALS.nodes || stack.length > LIMITS_EDITORIALS.depth) throw new TypeError('XML fora de pressupost de nodes/profunditat.');
    stack.at(-1).parts.push(node);
    if (!selfClosing) stack.push(node);
    else { delete node.ns; delete node.nsActive; }
    cursor = at + 1;
  }
  const elements = root.parts.filter(p => typeof p !== 'string');
  if (stack.length !== 1 || elements.length !== 1) throw new TypeError('Arrel XML absent, múltiple o truncada.');
  return elements[0];
}
export const fillsXml = (node, local, uri) => node.parts.filter(part => typeof part !== 'string' && part.local === local && (uri === undefined || part.uri === uri));
export const textXml = node => node ? node.parts.map(part => typeof part === 'string' ? part : textXml(part)).join('') : '';
