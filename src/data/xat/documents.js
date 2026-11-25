/** Documents del xat: identificació pels bytes, mai pel nom. Cap execució ni render HTML. */
import { llegeixZip } from '../../utils/fulls/zip.js';
import { validaPdfMedia } from '../../utils/validadorPdfMedia.js';

export const MAX_DOCUMENT_BYTES = 10_000_000;
export const MIME_DOCUMENT_XAT = Object.freeze([
  'application/pdf', 'text/csv', 'text/plain',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const falla = () => { throw Object.assign(new Error('El contingut del document no és del tipus admés.'), { code: 'document-format' }); };
const textUtf8 = bytes => { try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { return falla(); } };
const actiuText = /<\s*(?:!doctype\s+html|(?:html|head|body)\b|(?:[\w.-]+:)?(?:script|scripts|svg|iframe|object|embed)\b)|(?:java|vb)script\s*:|^\s*(?:#!|(?:export\s+)?(?:import\s+.+\s+from\s*['"]|(?:async\s+)?function\s*\w*\s*\(|(?:const|let|var)\s+\w+\s*=)|(?:window|document|globalThis)\s*[.[]|(?:alert|eval|fetch|setTimeout|setInterval)\s*\()/im;
const NS_OFFICE = 'urn:oasis:names:tc:opendocument:xmlns:office:1.0';
const NS_WORD = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const NS_XML = 'http://www.w3.org/XML/1998/namespace';
const NS_XMLNS = 'http://www.w3.org/2000/xmlns/';
const NS_SCRIPT = new Set(['urn:oasis:names:tc:opendocument:xmlns:script:1.0', 'http://openoffice.org/2000/script']);
const ELEMENTS_ACTIUS = new Set(['script', 'svg', 'iframe', 'object', 'embed', 'html', 'head', 'event-listener', 'execute-macro']);

/** Lleva literals i comentaris abans de reconéixer formes de funció/arrow.
 * Identifica sintaxi executable coneguda; no executa ni pretén detectar tot programa possible.
 */
function formaScript(text) {
  const peces = []; let inici = 0;
  for (let i = 0; i < text.length;) {
    let fi;
    if (text.startsWith('//', i)) { fi = text.indexOf('\n', i + 2); if (fi < 0) fi = text.length; }
    else if (text.startsWith('/*', i)) { fi = text.indexOf('*/', i + 2); fi = fi < 0 ? text.length : fi + 2; }
    else if (text[i] === '"' || text[i] === "'" || text[i] === '`') {
      const quote = text[i]; fi = i + 1;
      while (fi < text.length) { if (text[fi] === '\\') fi += 2; else if (text[fi++] === quote) break; }
    } else { i++; continue; }
    peces.push(text.slice(inici, i), ' '); i = fi; inici = fi;
  }
  peces.push(text.slice(inici));
  const codi = peces.join('');
  return /(?:\)|[$\p{L}_][$\p{L}\p{N}_]*)\s*=>|\bfunction\s*\*?\s*(?:[$\p{L}_][$\p{L}\p{N}_]*\s*)?\(|\bimport\s*\(/u.test(codi);
}

function descodificaXml(text, compte, atribut = false) {
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(text)
    || atribut && text.length > 65_536
    || /&(?!(?:amp|lt|gt|quot|apos|#\d{1,7}|#x[\da-fA-F]{1,6});)/.test(text)) falla();
  let entitatsAtribut = 0;
  return text.replace(/&([^;]+);/g, (_tot, nom) => {
    if (++compte.entitats > 200_000 || atribut && ++entitatsAtribut > 4096) falla();
    const simple = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[nom];
    if (simple !== undefined) return simple;
    const cp = nom.startsWith('#x') ? parseInt(nom.slice(2), 16) : Number(nom.slice(1));
    if (!(cp === 9 || cp === 10 || cp === 13 || cp >= 32 && cp <= 0xd7ff || cp >= 0xe000 && cp <= 0xfffd || cp >= 0x10000 && cp <= 0x10ffff)) falla();
    return String.fromCodePoint(cp);
  });
}

function nomXml(nom, ns, atribut = false) {
  const parts = nom.split(':');
  if (parts.length > 2 || parts.some(p => !/^[A-Za-z_][\w.-]*$/.test(p))) falla();
  const prefix = parts.length === 2 ? parts[0] : '';
  if (prefix && !ns.has(prefix)) falla();
  return { local: parts.at(-1), uri: prefix ? ns.get(prefix) : atribut ? '' : ns.get('') ?? '' };
}

// XML estrictament acotat, sense DTD ni entitats externes; només les entitats XML/númeriques.
function xmlDocument(bytes, arrelEsperada, namespace) {
  const xml = textUtf8(bytes), pila = [], compte = { entitats: 0 }; let pos = 0, arrel = null, tokens = 0, cos = false;
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) falla();
  while (pos < xml.length) {
    const inici = xml.indexOf('<', pos), fins = inici < 0 ? xml.length : inici;
    const text = descodificaXml(xml.slice(pos, fins), compte);
    if (!pila.length && text.trim()) falla();
    if (pila.at(-1)?.scripts && text.trim()) falla();
    if (inici < 0) break;
    if (++tokens > 200_000) falla();
    if (xml.startsWith('<!--', inici)) { const fi = xml.indexOf('-->', inici + 4); if (fi < 0 || xml.slice(inici + 4, fi).includes('--')) falla(); pos = fi + 3; continue; }
    if (xml.startsWith('<?xml ', inici) && !arrel) { const fi = xml.indexOf('?>', inici + 6); if (fi < 0) falla(); pos = fi + 2; continue; }
    if (xml.startsWith('<![CDATA[', inici) && pila.length) { const fi = xml.indexOf(']]>', inici + 9); if (fi < 0 || pila.at(-1).scripts && xml.slice(inici + 9, fi).trim()) falla(); pos = fi + 3; continue; }
    let fi = inici + 1, quote = null;
    for (; fi < xml.length; fi++) {
      const c = xml[fi];
      if (quote) { if (c === quote) quote = null; }
      else if (c === '"' || c === "'") quote = c;
      else if (c === '>') break;
      else if (c === '<') falla();
    }
    if (fi === xml.length || quote) falla();
    const tag = xml.slice(inici + 1, fi), match = /^(\/?)([A-Za-z_][\w:.-]*)([\s\S]*?)(\/?)$/.exec(tag);
    if (!match) falla();
    const [, tanca, nom, atributs, buit] = match;
    if (tanca) { if (atributs.trim() || buit || pila.pop()?.nom !== nom) falla(); }
    else {
      if (pila.at(-1)?.scripts) falla(); // office:scripts buit és vàlid; qualsevol contingut actiu queda vetat.
      const attrs = new Map(); let resta = atributs;
      while (resta.trim()) {
        const a = /^\s+([A-Za-z_][\w:.-]*)\s*=\s*(['"])([^<>]*?)\2/.exec(resta);
        if (!a || attrs.has(a[1])) falla(); attrs.set(a[1], descodificaXml(a[3], compte, true)); resta = resta.slice(a[0].length);
        if (attrs.size > 256) falla();
      }
      const ns = new Map(pila.at(-1)?.ns ?? [['xml', NS_XML]]);
      for (const [clau, valor] of attrs) {
        if (clau === 'xmlns' || clau.startsWith('xmlns:')) {
          const prefix = clau === 'xmlns' ? '' : clau.slice(6);
          if (prefix === 'xmlns' || prefix === 'xml' && valor !== NS_XML || prefix !== 'xml' && valor === NS_XML || valor === NS_XMLNS || prefix && !valor) falla();
          ns.set(prefix, valor);
          if (ns.size > 256) falla();
        }
      }
      const expandit = nomXml(nom, ns), scripts = expandit.uri === NS_OFFICE && expandit.local === 'scripts';
      if (NS_SCRIPT.has(expandit.uri) || ['http://www.w3.org/1999/xhtml', 'http://www.w3.org/2000/svg'].includes(expandit.uri)
        || ELEMENTS_ACTIUS.has(expandit.local.toLowerCase()) || expandit.local.toLowerCase() === 'scripts' && !scripts
        || expandit.local.toLowerCase() === 'body' && ![NS_OFFICE, NS_WORD].includes(expandit.uri)) falla();
      const expandits = new Set();
      for (const [clau, valor] of attrs) {
        if (clau === 'xmlns' || clau.startsWith('xmlns:')) continue;
        const a = nomXml(clau, ns, true), identitat = `${a.uri}\0${a.local}`;
        if (expandits.has(identitat)) falla(); expandits.add(identitat);
        if (NS_SCRIPT.has(a.uri) || /^on\w+/i.test(a.local) || a.local.toLowerCase() === 'targetmode' && valor.trim().toLowerCase() === 'external'
          || /(?:java|vb)script:/i.test(valor.replace(/[\t\r\n ]/g, ''))) falla();
      }
      if (!pila.length) {
        if (arrel) falla(); arrel = nom;
        if (arrelEsperada && (expandit.local !== arrelEsperada || expandit.uri !== namespace)) falla();
      }
      if (pila.length === 1 && expandit.local === 'body' && expandit.uri === namespace) cos = true;
      if (!buit) { pila.push({ nom, ns, scripts }); if (pila.length > 128) falla(); }
    }
    pos = fi + 1;
  }
  if (!arrel || pila.length) falla();
  if ([NS_OFFICE, NS_WORD].includes(namespace) && !cos) falla();
  return xml;
}

/** Identifica formats i refusa formes actives conegudes; no és antivirus ni prova d'innocuïtat.
 * UTF-8 en TXT/CSV no té màgia binària. L'entrega de documents continua sent attachment.
 */
export function validaBytesDocumentXat(bytes, mime) {
  if (!(bytes instanceof Uint8Array) || !bytes.length || bytes.length > MAX_DOCUMENT_BYTES || !MIME_DOCUMENT_XAT.includes(mime)) falla();
  if (mime === 'application/pdf') {
    try { validaPdfMedia(bytes); } catch { return falla(); }
    // Lexer estructural compartit; l'entrega continua sent attachment, mai antivirus.
    return true;
  }
  if (mime.startsWith('text/')) {
    const text = textUtf8(bytes);
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(text) || /<\s*\/?\s*[A-Za-z_][^<>]*>/.test(text) || actiuText.test(text) || formaScript(text)) falla();
    return true;
  }
  // El lector compartit verifica estructura local/central, CRC i DEFLATE amb sostre.
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 3 || bytes[3] !== 4) falla();
  let paquet;
  try { paquet = llegeixZip(bytes, { maxEixida: 20_000_000 }); } catch { return falla(); }
  const entrades = new Map(paquet.map(({ nom, dades }) => [nom, dades]));
  if (!entrades.size || entrades.size !== paquet.length || entrades.size > 2048) falla();
  for (const [nom, dades] of entrades) {
    if (/(?:^|\/)(?:\.\.?)(?:\/|$)|\\|:|\0|(?:vbaProject|macros?|scripts?)(?:\.|\/)|\.(?:html?|svg|[cm]?js|exe|com|bat|cmd|vbs|ps1)$/i.test(nom)) falla();
    if (/\.(?:xml|rels)$/i.test(nom)) xmlDocument(dades);
  }
  if (mime === 'application/vnd.oasis.opendocument.text') {
    if (!entrades.has('content.xml') || textUtf8(entrades.get('mimetype') ?? new Uint8Array()) !== mime) falla();
    xmlDocument(entrades.get('content.xml'), 'document-content', NS_OFFICE);
  } else {
    const tipus = xmlDocument(entrades.get('[Content_Types].xml') ?? new Uint8Array(), 'Types', 'http://schemas.openxmlformats.org/package/2006/content-types');
    xmlDocument(entrades.get('word/document.xml') ?? new Uint8Array(), 'document', NS_WORD);
    xmlDocument(entrades.get('_rels/.rels') ?? new Uint8Array(), 'Relationships', 'http://schemas.openxmlformats.org/package/2006/relationships');
    if (!/application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document\.main\+xml/.test(tipus)
      || !entrades.has('_rels/.rels')) falla();
  }
  return true;
}

export async function validaDocumentXat(fitxer, { signal } = {}) {
  if (!(fitxer instanceof Blob) || fitxer.size > MAX_DOCUMENT_BYTES || !fitxer.size) falla();
  signal?.throwIfAborted();
  const bytes = new Uint8Array(await fitxer.arrayBuffer());
  signal?.throwIfAborted();
  return validaBytesDocumentXat(bytes, fitxer.type);
}
