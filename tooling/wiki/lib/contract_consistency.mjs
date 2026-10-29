import { markdownProse } from '../../lib/markdown-prose.mjs';
/** Explicit contract disagreements inside one caller-declared scope.
 * This is a bounded review aid, not a semantic or general health score.
 * History is counted only. Markdown quotations, fenced code and lines
 * introduced as examples are excluded from active claims. Inline code is
 * retained because policy directives are commonly written as code spans.
 */
const compare = (a, b) => {
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const x = a.codePointAt(i);
    const y = b.codePointAt(j);
    if (x !== y) return x < y ? -1 : 1;
    i += x > 0xffff ? 2 : 1;
    j += y > 0xffff ? 2 : 1;
  }
  return i === a.length ? (j === b.length ? 0 : -1) : 1;
};
const locationOrder = (a, b) => compare(a.path, b.path) || a.line - b.line
  || compare(a.value, b.value) || compare(a.source, b.source);
const visible = (line) => line.replace(/\*\*|__|`/g, '');
const cells = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((s) => visible(s).trim());
const DIMENSIONS = /\b(9|10|nou|deu|nine|ten)\s+dimensions?\b/gi;
const COUNTS = Object.freeze({ 9: '9', 10: '10', nou: '9', deu: '10', nine: '9', ten: '10' });

function validate(scope, documents) {
  if (typeof scope !== 'string' || !scope.trim() || scope.includes('\0')) throw new TypeError('scope must be an explicit nonempty string');
  if (!Array.isArray(documents)) throw new TypeError('documents must be an array');
  const paths = new Set();
  for (const doc of documents) {
    if (!doc || typeof doc !== 'object' || Array.isArray(doc)) throw new TypeError('document must be an object');
    if (typeof doc.path !== 'string' || !doc.path.trim() || doc.path.includes('\0')) throw new TypeError('document.path must be a nonempty string');
    if (paths.has(doc.path)) throw new TypeError('document paths must be unique');
    paths.add(doc.path);
    if (typeof doc.content !== 'string') throw new TypeError('document.content must be a string');
    if (!Object.hasOwn(doc, 'authority') || !['active', 'history'].includes(doc.authority)) throw new TypeError('document.authority must explicitly be active or history');
    if (Object.hasOwn(doc, 'scope') && doc.scope !== scope) throw new TypeError('document.scope must match the requested scope');
  }
}

function activeLines(content) {
  const lines = markdownProse(content, { preserveInlineCode: true }).split(/\r?\n/);
  let frontmatter = lines[0]?.replace(/^\ufeff/, '').trim() === '---';
  return lines.map((raw, i) => {
    const line = raw.trimStart();
    if (frontmatter) {
      if (i > 0 && line.trim() === '---') frontmatter = false;
      return '';
    }
    if (/^>/.test(line) || (/^(?: {4}|\t)/.test(raw) && !/^(?:[-*+]|\d+[.)])\s/.test(line))
      || /^(?:[-*+]\s+|\d+[.)]\s+)?(?:exemples?|examples?|e\.g\.)\s*:/i.test(line)) return '';
    return raw;
  });
}

function allowlist(text) {
  if (text === '*') return '*';
  const tokens = text.slice(1, -1).trim().match(/"[^"\n]*"|'[^'\n]*'|[^\s]+/g) ?? [];
  const normalized = tokens.map((token) => {
    const unquoted = /^(["']).*\1$/.test(token) ? token.slice(1, -1) : token;
    return ['self', '*', 'src'].includes(unquoted.toLowerCase()) ? unquoted.toLowerCase() : JSON.stringify(unquoted);
  });
  return `(${[...new Set(normalized)].sort(compare).join(' ')})`;
}

function policyClaims(line, path, number) {
  const claims = [];
  const headers = /\bPermissions-Policy\s*:\s*/gi;
  for (const header of line.matchAll(headers)) {
    const rest = line.slice(header.index + header[0].length).replace(/^`/, '');
    const directives = /\s*([a-z][a-z0-9-]*)\s*=\s*(\([^)]*\)|\*)\s*/giy;
    let cursor = 0;
    while (cursor < rest.length) {
      directives.lastIndex = cursor;
      const directive = directives.exec(rest);
      if (!directive) break;
      claims.push({ contract: `permissions-policy:${directive[1].toLowerCase()}`, path, line: number,
        value: allowlist(directive[2]), source: 'directive' });
      cursor = directives.lastIndex;
      if (rest[cursor] !== ',') break;
      cursor += 1;
    }
  }
  return claims;
}

function documentClaims(doc) {
  const lines = activeLines(doc.content);
  const claims = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = visible(lines[i]);
    for (const match of line.matchAll(DIMENSIONS)) {
      claims.push({ contract: 'dimension-count', path: doc.path, line: i + 1,
        value: COUNTS[match[1].toLowerCase()], source: 'prose' });
    }
    claims.push(...policyClaims(line, doc.path, i + 1));
    // A rubric is evidence only with a dimension header and an explicit,
    // consecutive, unique numeric range 1..9 or 1..10 in its first column.
    if (!line.includes('|') || !cells(line).some((cell) => /\bdimensio(?:n|ns|s)?\b/i.test(cell.normalize('NFD').replace(/\p{M}/gu, '')))) continue;
    const separator = cells(lines[i + 1] ?? '');
    if (separator.length < 2 || !separator.every((cell) => /^:?-{3,}:?$/.test(cell))) continue;
    const ids = [];
    for (let j = i + 2; j < lines.length && lines[j].includes('|'); j += 1) {
      const first = cells(lines[j])[0];
      if (/^\d+$/.test(first)) ids.push(Number(first));
    }
    const sorted = [...ids].sort((a, b) => a - b);
    if ([9, 10].includes(sorted.length) && sorted.every((n, index) => n === index + 1)) {
      claims.push({ contract: 'dimension-count', path: doc.path, line: i + 1,
        value: String(sorted.length), source: 'rubric' });
    }
  }
  return { claims, lineCount: lines.length };
}

const explicitText = (value) => typeof value === 'string' && value.length > 0 && value.trim() === value && !value.includes('\0');

/** A caller supplies stable labels; no natural-language meanings are inferred.
 * catalog = {scope, canonical:[{id,value}], claims:[{id,value,path,line}]}.
 * Optional scopes on documents/claims must match both explicit scope values.
 * Optional claim.text pins the exact source line against stale registries.
 * Claim locations must exist; historical, quoted and example/code locations
 * are excluded. Labels are compared exactly, with no project-specific IDs.
 * The caller remains responsible for the correctness of the supplied label.
 */
function auditCatalog(catalog, scope, documents) {
  if (catalog === undefined) return null;
  if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)
    || !Object.hasOwn(catalog, 'scope') || catalog.scope !== scope) throw new TypeError('catalog.scope must explicitly match the requested scope');
  if (!Array.isArray(catalog.canonical) || catalog.canonical.length === 0) throw new TypeError('catalog.canonical must be a nonempty array');
  if (!Array.isArray(catalog.claims)) throw new TypeError('catalog.claims must be an array');
  const canonical = new Map();
  for (const entry of catalog.canonical) {
    if (!entry || !explicitText(entry.id) || !explicitText(entry.value)) throw new TypeError('canonical entries need explicit id and value labels');
    if (canonical.has(entry.id)) throw new TypeError('canonical ids must be unique');
    canonical.set(entry.id, entry.value);
  }
  const locations = new Map(documents.map((doc) => [doc.path, { doc, lines: activeLines(doc.content), originalLines: doc.content.split(/\r?\n/) }]));
  const accepted = [];
  let historicalClaims = 0;
  let excludedClaims = 0;
  for (const claim of catalog.claims) {
    if (!claim || !explicitText(claim.id) || !explicitText(claim.value) || !explicitText(claim.path)
      || !Number.isSafeInteger(claim.line) || claim.line < 1) throw new TypeError('catalog claims need id, value, path and a positive integer line');
    if (Object.hasOwn(claim, 'scope') && claim.scope !== scope) throw new TypeError('claim.scope must match the requested scope');
    if (!canonical.has(claim.id)) throw new TypeError('every claim id needs an explicit canonical mapping');
    const location = locations.get(claim.path);
    if (!location || claim.line > location.lines.length) throw new TypeError('catalog claim location must exist in documents');
    if (location.doc.authority === 'history') { historicalClaims += 1; continue; }
    if (!location.lines[claim.line - 1].trim()) { excludedClaims += 1; continue; }
    if (Object.hasOwn(claim, 'text') && claim.text !== location.originalLines[claim.line - 1]) throw new TypeError('catalog claim.text must match its exact source line');
    accepted.push({ id: claim.id, contract: `catalog:${claim.id}`, path: claim.path, line: claim.line,
      value: claim.value, source: 'configured-catalog' });
  }
  const claims = [...new Map(accepted.map((claim) => [JSON.stringify(claim), claim])).values()]
    .sort((a, b) => locationOrder(a, b) || compare(a.id, b.id));
  const groups = new Map();
  for (const claim of claims) {
    if (!groups.has(claim.id)) groups.set(claim.id, []);
    groups.get(claim.id).push(claim);
  }
  const findings = [];
  for (const [id, evidence] of groups) {
    const value = canonical.get(id);
    const values = [...new Set([value, ...evidence.map((claim) => claim.value)])].sort(compare);
    if (values.length < 2) continue;
    findings.push({ code: 'EXPLICIT_CATALOG_DISAGREEMENT', scope, contract: `catalog:${id}`, values,
      canonical: { id, value }, paths: [...new Set(evidence.map((claim) => claim.path))].sort(compare),
      claims: evidence, requiresReview: true });
  }
  return { findings, coverage: { canonicalIds: canonical.size, configuredClaims: catalog.claims.length,
    activeClaims: claims.length, historicalClaims, excludedClaims, comparedIds: groups.size,
    status: groups.size === 0 ? 'incomplete' : 'evaluated' } };
}

export function auditContractClaims({ scope, documents, catalog } = {}) {
  validate(scope, documents);
  const claims = [];
  let scannedActiveLines = 0;
  const ordered = [...documents].sort((a, b) => compare(a.path, b.path));
  for (const doc of ordered) {
    if (doc.authority !== 'active') continue;
    const result = documentClaims(doc);
    claims.push(...result.claims);
    scannedActiveLines += result.lineCount;
  }
  const unique = [...new Map(claims.map((claim) => [JSON.stringify(claim), claim])).values()].sort(locationOrder);
  const grouped = new Map();
  for (const claim of unique) {
    if (!grouped.has(claim.contract)) grouped.set(claim.contract, []);
    grouped.get(claim.contract).push(claim);
  }
  const findings = [];
  for (const [contract, evidence] of grouped) {
    const values = [...new Set(evidence.map((claim) => claim.value))].sort(compare);
    if (values.length < 2) continue;
    findings.push({ code: 'EXPLICIT_CONTRACT_DISAGREEMENT', scope, contract, values,
      paths: [...new Set(evidence.map((claim) => claim.path))].sort(compare),
      claims: evidence, requiresReview: true });
  }
  const catalogResult = auditCatalog(catalog, scope, ordered);
  if (catalogResult) findings.push(...catalogResult.findings);
  findings.sort((a, b) => locationOrder(a.claims[0], b.claims[0]) || compare(a.contract, b.contract));
  const activeDocuments = ordered.filter((doc) => doc.authority === 'active').length;
  const incomplete = activeDocuments === 0 || catalogResult?.coverage.status === 'incomplete';
  return {
    scope,
    status: incomplete ? 'incomplete' : findings.length ? 'explicit-disagreements' : 'no-explicit-disagreements',
    coverage: { documents: ordered.length, activeDocuments, historicalDocuments: ordered.length - activeDocuments,
      scannedActiveLines, explicitClaims: unique.length + (catalogResult?.coverage.activeClaims ?? 0),
      contracts: grouped.size + (catalogResult?.coverage.comparedIds ?? 0),
      ...(catalogResult ? { catalog: catalogResult.coverage } : {}) },
    findings
  };
}
