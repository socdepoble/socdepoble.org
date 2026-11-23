#!/usr/bin/env node
/** IDEA-319. Anàlisi estàtica: cap mòdul d'aplicació s'importa ni s'executa.
 * El cens de deute és estricte; --json no transforma infraccions en excepcions.
 * Limit: dades HTML rebudes en execució i noms d'etiqueta calculats necessiten
 * també la prova DOM del carril de vistes. No es pretén executar React ací.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let parseFragment, parse, postcss, javascriptParser;
function htmlFragment(text) {
  parseFragment ||= require('parse5').parseFragment;
  return parseFragment(text);
}


function parseProgram(text, file) {
  if (/\.[cm]?js$/.test(file)) {
    try {
      javascriptParser ||= require('acorn').Parser;
      return javascriptParser.parse(text, { ecmaVersion: 'latest', sourceType: 'module', allowHashBang: true });
    } catch { /* Errors, JSX en JS o Acorn absent conserven el parser canònic. */ }
  }
  parse ||= require('@babel/parser').parse;
  return parse(text, { sourceType: 'unambiguous', attachComment: false, plugins: ['jsx', 'estree', ...(/\.tsx?$/.test(file) ? ['typescript'] : [])] }).program;
}

export const EXCEPCIONS = Object.freeze([
  Object.freeze({ id: 'escala-tipografica', file: 'src/sections/disseny/cataleg/detalls/EspecimenTipografia.jsx',
    text: 'Subtítol que acompanya la lectura (h2)', className: 'component-doc-preview',
    reason: 'Mostra viva H1/H2/H3/H4/H5/H6: el subtítol pertany al document de demostració.' }),
  Object.freeze({ id: 'dialog-independent', element: 'dialog',
    reason: 'Només el títol H2 referenciat per aria-labelledby del dialog natiu té jerarquia pròpia.' }),
  Object.freeze({ id: 'entrada-impressio', file: 'src/sections/disseny/cataleg/detalls/EspecimenImpressio.jsx',
    reason: 'DOCUMENT.content és entrada de prova per a un iframe A4 autònom; no és PAGE_COPY ni children HTML de UniversalPage.' })
]);

const FONT = /\.[cm]?[jt]sx?$/;
const PROVA = /(?:^|\/)(?:__tests__|fixtures)(?:\/|$)|\.(?:test|spec)\.[cm]?[jt]sx?$/;
const KEYS = new Map();
const NODE_SCOPE = Symbol('canonicalNodeScope');
const EMPTY = Object.freeze([]);
const LEAVES = new Set(['Identifier', 'Literal', 'JSXIdentifier', 'JSXText', 'TemplateElement', 'JSXEmptyExpression', 'PrivateName']);
const PAGE_MODULE = 'src/components/universal/UniversalPage.jsx';
const FUNCTIONS = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression', 'ObjectMethod', 'ClassMethod', 'ClassPrivateMethod']);
const childKeys = node => {
  let keys = KEYS.get(node.type);
  if (!keys) { keys = Object.keys(node).filter(k => !['loc', 'start', 'end', 'extra', 'tokens', 'comments'].includes(k)); KEYS.set(node.type, keys); }
  return keys;
};
const childNodes = node => {
  if (!node || LEAVES.has(node.type)) return EMPTY;
  const out = [];
  for (const key of childKeys(node)) {
    const value = node[key];
    if (Array.isArray(value)) { for (const item of value) if (item && typeof item.type === 'string') out.push(item); }
    else if (value && typeof value.type === 'string') out.push(value);
  }
  return out;
};
const jsxName = node => node?.type === 'JSXIdentifier' ? node.name :
  node?.type === 'JSXMemberExpression' ? `${jsxName(node.object)}.${jsxName(node.property)}` : '';
const propName = node => node?.name ?? node?.value;
const attr = (node, name) => node.openingElement?.attributes.find(a => a.type === 'JSXAttribute' && a.name.name === name)?.value;
const unwrap = node => node?.type === 'JSXExpressionContainer' ? node.expression : node;

function filesAt(root, sub) {
  const result = [];
  const visit = relative => {
    for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
      const next = `${relative}/${entry.name}`;
      if (entry.isDirectory()) visit(next);
      else if (entry.isFile()) result.push(next);
    }
  };
  if (fs.existsSync(path.join(root, sub))) visit(sub);
  return result.sort();
}

const orderIssues = (a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column || a.code.localeCompare(b.code) || a.message.localeCompare(b.message);
const uniqueExemptions = entries => [...new Map(entries.map(entry => [`${entry.id}:${entry.file}:${entry.line}:${entry.reason}`, entry])).values()].sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.id.localeCompare(b.id));

const isLineTerminator = code => code === 10 || code === 13 || code === 0x2028 || code === 0x2029;
function lineEnd(text, start) {
  for (let index = start; index < text.length; index++) if (isLineTerminator(text.charCodeAt(index))) return index;
  return -1;
}

function uncomment(clause) {
  let result = '', start = 0, index = 0;
  while (index < clause.length) {
    const quote = clause[index];
    if (quote === '"' || quote === "'" || quote === '`') {
      index++;
      while (index < clause.length) { if (clause[index] === '\\') index += 2; else if (clause[index++] === quote) break; }
    } else if (clause[index] === '/' && (clause[index + 1] === '*' || clause[index + 1] === '/')) {
      result += clause.slice(start, index) + ' ';
      const block = clause[index + 1] === '*', end = block ? clause.indexOf('*/', index + 2) : lineEnd(clause, index + 2);
      index = end < 0 ? clause.length : end + (block ? 2 : 1); start = index;
    } else index++;
  }
  return result + clause.slice(start);
}
// Índex de l'enllaç ESM: les clàusules ambigües conserven candidats.
function wrapperExports(lexical, seeds) {
  const result = new Map();
  const add = (file, name) => { if (!result.has(file)) result.set(file, new Set()); const names = result.get(file), old = names.size; names.add(name); return old !== names.size; };
  for (const [file, name] of seeds) add(file, name);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [file, flags] of lexical) {
      for (const edge of flags.forwards || []) {
        const names = result.get(edge.target);
        if (!names?.size) continue;
        if (edge.unknown) changed = add(file, '*') || changed;
        else if (edge.imported === '*') { for (const name of names) if (name !== 'default') changed = add(file, name) || changed; }
        else if (names.has(edge.imported) || names.has('*')) changed = add(file, edge.exported) || changed;
      }
      const bindings = new Map((flags.imports || []).map(edge => [edge.local, edge]));
      // Cap àlies d'aquest mòdul pot propagar una Page fins que un dels seus
      // imports tinga una referència coneguda. El punt fix el tornarà a mirar.
      if (![...bindings.values()].some(binding => result.get(binding.target)?.size)) continue;
      let aliasesChanged = true;
      while (aliasesChanged) { aliasesChanged = false; for (const [alias, original, member] of flags.aliases || []) if (!bindings.has(alias) && bindings.has(original)) {
        const source = bindings.get(original);
        if (!member || source.imported === '*') { bindings.set(alias, member ? { ...source, imported: member } : source); aliasesChanged = true; }
      } }
      for (const edge of flags.localExports || []) {
        const binding = bindings.get(edge.local), names = binding && result.get(binding.target);
        if (names && (binding.unknown || names.has('*') || names.has(binding.imported))) changed = add(file, edge.exported) || changed;
      }
      if (flags.unknownLocalExports && [...bindings.values()].some(binding => result.get(binding.target)?.size)) changed = add(file, '*') || changed;
    }
  }
  return result;
}
function wrapperCallers(lexical, references) {
  const callers = new Set();
  for (const [file, flags] of lexical) {
    if (!flags.jsx) continue;
    const imports = new Map((flags.imports || []).map(edge => [edge.local, edge])), candidates = new Map();
    let ambiguous = false;
    for (const edge of flags.imports || []) {
      const names = references.get(edge.target);
      if (!names?.size) continue;
      if (edge.unknown) ambiguous = true;
      else if (edge.imported === '*' || names.has('*') || names.has(edge.imported)) candidates.set(edge.local, edge);
    }
    if (ambiguous) { callers.add(file); continue; }
    if (!candidates.size) continue;
    let grew = true;
    while (grew) { grew = false; for (const [alias, original, member] of flags.aliases || []) if (!candidates.has(alias) && candidates.has(original)) {
      const source = candidates.get(original), names = references.get(source.target);
      if (!member || source.imported === '*' && (names.has('*') || names.has(member))) { candidates.set(alias, member ? { ...source, imported: member } : source); grew = true; }
    } }
    for (const tag of flags.tags || []) {
      if (!isComponentName(tag) && !tag.includes('.')) continue;
      const [prefix, member] = tag.split('.'), binding = candidates.get(prefix);
      if (binding && (binding.imported !== '*' || !member || references.get(binding.target).has(member) || references.get(binding.target).has('*'))) { callers.add(file); break; }
      // An alias with comments/destructuring is intentionally over-approximated.
      if (!imports.has(prefix) && !candidates.has(prefix) && candidates.size) { callers.add(file); break; }
    }
  }
  return callers;
}
const isComponentName = name => /^[A-Z]/.test(name) || name.includes('.');

// Conservative lexical frontier only. Actual Page consumption is queried at
// the callsite; no AST wrapper discovery or global rounds are required.
function demandFrontier(lexical) {
  const files = new Set([...lexical].filter(([file, flags]) => FONT.test(file) && !PROVA.test(file) && flags.page).map(([file]) => file));
  let references;
  while (true) {
    references = wrapperExports(lexical, [...files].map(file => [file, '*']));
    let changed = false;
    for (const file of wrapperCallers(lexical, references)) if (FONT.test(file) && !PROVA.test(file) && !files.has(file)) { files.add(file); changed = true; }
    if (!changed) break;
  }
  return { roots: [...files], references: [...references].map(([file, names]) => [file, [...names]]) };
}

/** API pura sobre una instantània { 'src/...jsx': text }; útil també en CI. */
export function auditaFonts(fonts, { exceptions = EXCEPCIONS, prepared = null, lexicalFiles = null, roots = null, mode = 'all', reuse = null, knownWrappers = null, documentFiles = null } = {}) {
  const started = performance.now();
  const issues = [], exemptions = [], modules = reuse ? (reuse.modules ||= new Map()) : new Map(), emitted = new Set();
  const literalMemo = reuse ? (reuse.literalMemo ||= new WeakMap()) : new WeakMap();
  const entryMemo = reuse ? (reuse.entryMemo ||= new WeakMap()) : new WeakMap();
  const returnsMemo = reuse ? (reuse.returnsMemo ||= new WeakMap()) : new WeakMap();
  const activeDefaults = new WeakSet();
  const lineIndexes = new Map();
  const consumedCache = reuse ? (reuse.consumedCache ||= new WeakMap()) : new WeakMap(), consumedActive = new WeakMap();
  const controlTags = new Set(['input', 'select', 'textarea', 'button', 'option']);
  const phases = {}, phase = (name, since) => { phases[name] = Math.round((performance.now() - since) * 100) / 100; return performance.now(); };
  function location(file, node) {
    if (node?.loc?.start) return { line: node.loc.start.line, column: node.loc.start.column + 1 };
    if (node?.source?.start) return { line: node.source.start.line, column: node.source.start.column };
    if (!Number.isInteger(node?.start) || node.start < 0) return { line: 1, column: 1 };
    let starts = lineIndexes.get(file);
    if (!starts) {
      starts = [0];
      for (const match of fonts[file].matchAll(/\r\n|[\r\n\u2028\u2029]/g)) starts.push(match.index + match[0].length);
      lineIndexes.set(file, starts);
    }
    let low = 0, high = starts.length;
    while (low + 1 < high) { const middle = low + high >>> 1; if (starts[middle] <= node.start) low = middle; else high = middle; }
    return { line: low + 1, column: node.start - starts[low] + 1 };
  }
  const add = (code, file, node, message, extra = {}) => {
    const { line, column } = location(file, node);
    const key = `${code}:${file}:${node?.start ?? line}:${message}`;
    if (!emitted.has(key)) { emitted.add(key); issues.push({ code, file, line, column, message, ...extra }); }
  };
  function mod(file) {
    if (modules.has(file)) return modules.get(file);
    const rootScope = { id: 0, bindings: new Map(), parent: null, function: true };
    let scopeId = 0;
    const record = { file, ast: null, bindings: rootScope.bindings, rootScope, imports: new Map(), exports: new Map(), stars: [], jsx: [] };
    modules.set(file, record);
    try {
      record.ast = parseProgram(fonts[file], file);
      let syntheticStart = -1;
      function bind(name, node, scope) {
        const old = scope.bindings.get(name);
        if (old && old !== node && old.syntheticUnion) old.elements.push(node);
        else scope.bindings.set(name, old && old !== node ? { type: 'ArrayExpression', elements: [old, node], start: syntheticStart--, syntheticUnion: true } : node);
      }
      function bindPattern(pattern, value, scope, parameter = false) {
        if (pattern.type === 'Identifier') bind(pattern.name, value, scope);
        else if (pattern.type === 'ObjectPattern') for (const property of pattern.properties) {
          if (property.type === 'RestElement') bindPattern(property.argument, value, scope, parameter);
          else {
            const member = value && { type: 'MemberExpression', object: value, property: property.key, computed: property.computed, start: syntheticStart-- };
            if (member) member[NODE_SCOPE] = scope;
            bindPattern(property.value, member, scope, parameter);
          }
        }
        else if (pattern.type === 'AssignmentPattern') {
          // Els defaults de props es projecten al lloc de crida, mai com a
          // valor incondicional del paràmetre quan la prop ja ve definida.
          const fallback = { type: 'AssignmentPattern', left: value, right: pattern.right, syntheticDefault: true, start: syntheticStart-- };
          fallback[NODE_SCOPE] = scope;
          bindPattern(pattern.left, parameter ? null : fallback, scope, parameter);
        }
        else if (pattern.type === 'ArrayPattern') for (const [index, item] of pattern.elements.entries()) if (item) {
          const member = value && { type: 'MemberExpression', object: value, property: { type: 'Literal', value: index }, computed: true, start: syntheticStart-- };
          if (member) member[NODE_SCOPE] = scope;
          bindPattern(item, member, scope, parameter);
        }
      }
      function index(node, scope = rootScope, variableScope = null) {
        if (LEAVES.has(node.type) && node.type !== 'Identifier') return;
        if ((node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') && node.id) bind(node.id.name, node, scope);
        if (FUNCTIONS.has(node.type)) {
          scope = { id: ++scopeId, bindings: new Map(), parent: scope, function: true };
          if (node.type === 'FunctionExpression' && node.id) bind(node.id.name, node, scope);
          for (const param of node.params || []) bindPattern(param, null, scope, true);
        } else if (node.type === 'BlockStatement' || node.type === 'CatchClause') {
          scope = { id: ++scopeId, bindings: new Map(), parent: scope, function: false };
          if (node.type === 'CatchClause' && node.param) bindPattern(node.param, null, scope);
        }
        if (node.type === 'Identifier' || node.type === 'JSXElement' || node.type === 'CallExpression' || node.type === 'MemberExpression') node[NODE_SCOPE] = scope;
        if (LEAVES.has(node.type)) return;
        if (node.type === 'JSXElement') record.jsx.push({ node });
        if (node.type === 'ImportDeclaration') for (const spec of node.specifiers) {
          record.imports.set(spec.local.name, { from: node.source.value, name: spec.type === 'ImportDefaultSpecifier' ? 'default' : spec.type === 'ImportNamespaceSpecifier' ? '*' : propName(spec.imported) });
        }
        if (node.type === 'VariableDeclarator') bindPattern(node.id, node.init, variableScope || scope);
        if (node.type === 'ExportDefaultDeclaration') record.exports.set('default', node.declaration);
        if (node.type === 'ExportNamedDeclaration') {
          if (node.declaration?.id) record.exports.set(node.declaration.id.name, node.declaration);
          for (const decl of node.declaration?.declarations || []) if (decl.id.type === 'Identifier') record.exports.set(decl.id.name, decl.init);
          for (const spec of node.specifiers || []) record.exports.set(propName(spec.exported), node.source ? { reexport: node.source.value, name: propName(spec.local) } : spec.local);
        }
        if (node.type === 'ExportAllDeclaration') record.stars.push(node.source.value);
        let declarationScope = scope;
        if (node.type === 'VariableDeclaration' && node.kind === 'var') while (declarationScope.parent && !declarationScope.function) declarationScope = declarationScope.parent;
        const variable = node.type === 'VariableDeclaration' ? declarationScope : null;
        for (const key of childKeys(node)) {
          const value = node[key];
          if (Array.isArray(value)) {
            for (const next of value) if (next && typeof next.type === 'string') index(next, scope, variable);
          } else if (value && typeof value.type === 'string') index(value, scope, variable);
        }
      }
      index(record.ast);
    } catch (error) { add('MC0', file, null, `Sintaxi no analitzable: ${error.message}`); }
    return record;
  }
  const importCache = reuse ? (reuse.importCache ||= new Map()) : new Map(), resolveCache = reuse ? (reuse.resolveCache ||= new Map()) : new Map();
  function importFile(file, source) {
    const key = `${file}:${source}`;
    if (importCache.has(key)) return importCache.get(key);
    if (!source?.startsWith('.')) return null;
    const base = path.posix.normalize(path.posix.join(path.posix.dirname(file), source.split('?')[0]));
    const result = [base, `${base}.jsx`, `${base}.js`, `${base}.tsx`, `${base}.ts`, `${base}/index.js`, `${base}/index.jsx`].find(name => Object.hasOwn(fonts, name));
    importCache.set(key, result);
    return result;
  }
  // Escàner O(n): salta literals/comentaris amb indexOf i recorre únicament
  // tokens rellevants. Mai usa grups repetits de comentaris en una regex.
  const parents = prepared && reuse?.parents || new Map(), lexical = prepared && reuse?.lexical || new Map();
  const tokens = /\/|['"`]|\b(?:UniversalPage|from|import|export|dangerouslySetInnerHTML|__html|maxWidth|maxInlineSize|createElement)\b|<\s*[A-Za-z][\w.]*|;/g;
  const pageTokens = new RegExp(`${tokens.source}|[{}>]`, 'g');
  if (prepared) {
    if (!reuse?.lexical) {
      for (const [file, flags] of prepared.lexical) lexical.set(file, flags);
      for (const [file, providers] of prepared.parents) parents.set(file, new Set(providers));
      if (reuse) { reuse.lexical = lexical; reuse.parents = parents; }
    }
  } else for (const file of lexicalFiles || Object.keys(fonts)) indexLexicalFile(file);
  function indexLexicalFile(file) {
    const source = fonts[file];
    if (!FONT.test(file)) { lexical.set(file, { cssMeasure: source.includes('--sdp-measure') }); return; }
    let page = false, pageWord = false, pageUncertain = false, spread = false, braces = 0, relevant = false, bodyRelevant = false, hasJSX = false, hasFactory = false, tagLiteral = false;
    const angles = [], tags = new Set(), canonicalTags = new Set(['UniversalPage']), imports = [], forwards = [], localExports = [];
    let unknownLocalExports = false;
    const scan = source.includes('UniversalPage') ? pageTokens : tokens;
    const hasMeasure = source.includes('--sdp-measure');
    function quoted(start, quote) {
      let end = start;
      while ((end = source.indexOf(quote, end + 1)) >= 0) {
        let slash = end;
        while (source[slash - 1] === '\\') slash--;
        if ((end - slash) % 2 === 0) break;
      }
      if (end < 0) end = source.length;
      return end + 1;
    }
    function importAt(start) {
      let i = start;
      while (i < source.length) {
        if (source.charCodeAt(i) <= 32 || source[i] === '(') { i++; continue; }
        if (source[i] === '/' && source[i + 1] === '*') { const end = source.indexOf('*/', i + 2); i = end < 0 ? source.length : end + 2; continue; }
        if (source[i] === '/' && source[i + 1] === '/') { const end = lineEnd(source, i + 2); i = end < 0 ? source.length : end + 1; continue; }
        break;
      }
      if (source[i] !== '"' && source[i] !== "'") return { target: null, end: i, spec: null };
      const quotedEnd = quoted(i, source[i]);
      const spec = source.slice(i + 1, quotedEnd - 1).replace(/\\x([\da-f]{2})|\\u([\da-f]{4})/gi, (_, x, u) => String.fromCharCode(parseInt(x || u, 16)));
      const target = importFile(file, spec);
      if (target) {
        if (!parents.has(target)) parents.set(target, new Set()); parents.get(target).add(file);

      }
      return { target, end: quotedEnd, spec };
    }
    // An English "from" in an exported dictionary is not a reexport. Match
    // possible statement boundaries, keeping ambiguous comments conservative.
    let codeStart = 0;
    while (codeStart < source.length) {
      while (/\s/.test(source[codeStart] || '') && codeStart < source.length) codeStart++;
      const block = source.startsWith('/*', codeStart), line = source.startsWith('//', codeStart);
      if (!block && !line) break;
      const end = block ? source.indexOf('*/', codeStart + 2) : lineEnd(source, codeStart + 2);
      codeStart = end < 0 ? source.length : end + (block ? 2 : 1);
    }
    const code = source.slice(codeStart);
    const possibleLink = /(?:^|[;\r\n\u2028\u2029}]|\*\/)[^\S\r\n\u2028\u2029]*(?:import\b|export\s*(?:\*|\{|\/[*/]))|\bimport\s*(?:\(|\/[*/])/.test(code);
    if (!possibleLink && !/UniversalPage|<\s*h2\b|['"`]h(?:2?['"`]|\$\{|\\)|\\(?:x68|u0068|u\{0*68\}|150|h)|dangerouslySetInnerHTML|__html|--sdp-measure|maxWidth|maxInlineSize|createElement/.test(code)) { lexical.set(file, { page, relevant, children: source.includes('children') }); return; }
    let clauseStart = -1, clauseKind = '';
    function specifiers(clause) {
      if (/[\\/]/.test(clause)) return null;
      const match = clause.trim().match(/^\{([\s\S]*)\}$/);
      if (!match) return null;
      const result = [];
      for (const part of match[1].split(',')) {
        if (!part.trim()) continue;
        const entry = part.trim().match(/^([\w$]+)(?:\s+as\s+([\w$]+))?$/);
        if (!entry) return null;
        result.push([entry[1], entry[2] || entry[1]]);
      }
      return result;
    }
    function localExport(end) {
      if (clauseKind !== 'export' || clauseStart < 0) return;
      let cursor = clauseStart;
      // Un inicialitzador compost ja prova que no és un àlies simple. No cal
      // tornar a recórrer tots els literals d'un diccionari per acreditar-ho.
      function next() {
        while (cursor < end) {
          const code = source.charCodeAt(cursor);
          if (code === 32 || code >= 9 && code <= 13 || code > 127 && /\s/.test(source[cursor])) { cursor++; continue; }
          if (source[cursor] === '/' && (source[cursor + 1] === '*' || source[cursor + 1] === '/')) {
            const block = source[cursor + 1] === '*', close = block ? source.indexOf('*/', cursor + 2) : lineEnd(source, cursor + 2);
            cursor = close < 0 ? end : Math.min(end, close + (block ? 2 : 1));
            continue;
          }
          const start = cursor;
          while (cursor < end && /[\w$]/.test(source[cursor])) cursor++;
          return cursor === start ? source[cursor++] : source.slice(start, cursor);
        }
        return null;
      }
      const head = next();
      if (head === '{') {
        const clause = uncomment(source.slice(clauseStart, end)).trim();
        const entries = specifiers(clause);
        if (entries) for (const [local, exported] of entries) localExports.push({ local, exported });
        else unknownLocalExports = true;
      } else if (head === 'default') {
        let local = next(), depth = 0;
        while (local === '(') { depth++; local = next(); }
        let tail = next();
        while (depth && tail === ')') { depth--; tail = next(); }
        if (!depth && local && /^[\w$]+$/.test(local) && tail === null) localExports.push({ local, exported: 'default' });
      } else if (head === 'const' || head === 'let' || head === 'var') {
        const exported = next(), equal = next(), local = next();
        if (exported && /^[\w$]+$/.test(exported) && equal === '=' && local && /^[\w$]+$/.test(local) && next() === null) localExports.push({ local, exported });
        else unknownLocalExports = true;
      }
    }
    function link(clause, target) {
      if (!target) return;
      clause = uncomment(clause);
      if (clauseKind === 'export') {
        if (clause.trim() === '*') forwards.push({ target, imported: '*', exported: '*' });
        else { const entries = specifiers(clause); if (entries) for (const [imported, exported] of entries) forwards.push({ target, imported, exported }); else forwards.push({ target, unknown: true }); }
      } else if (clauseKind === 'import') {
        if (/[\\/]/.test(clause)) { imports.push({ target, unknown: true }); return; }
        const namespace = clause.trim().match(/^\*\s*as\s+([\w$]+)$/);
        if (namespace) { imports.push({ target, local: namespace[1], imported: '*' }); return; }
        const brace = clause.indexOf('{');
        if (brace >= 0) {
          const entries = specifiers(clause.slice(brace)), prefix = clause.slice(0, brace).trim().replace(/,$/, '').trim();
          if (!entries || prefix && !/^[\w$]+$/.test(prefix)) { imports.push({ target, unknown: true }); return; }
          if (prefix) imports.push({ target, local: prefix, imported: 'default' });
          for (const [imported, local] of entries) imports.push({ target, local, imported });
        } else if (/^[\w$]+$/.test(clause.trim())) imports.push({ target, local: clause.trim(), imported: 'default' });
        else imports.push({ target, unknown: true });
      }
    }
    scan.lastIndex = 0;
    let match;
    while ((match = scan.exec(source))) {
      const token = match[0], first = token[0], start = match.index;
      if (first === '/') {
        if (source[start + 1] === '/') { const end = lineEnd(source, start + 2); scan.lastIndex = end < 0 ? source.length : end + 1; }
        else if (source[start + 1] === '*') { const end = source.indexOf('*/', start + 2); scan.lastIndex = end < 0 ? source.length : end + 2; }
        else {
          // Regex literals can contain quote and comment characters. Recognise
          // expression-start positions; JSX closing/selfclosing tags are code.
          let before = start - 1;
          while (before >= 0 && source.charCodeAt(before) <= 32) before--;
          const prefix = source.slice(Math.max(0, before - 7), before + 1);
          if (!(angles.length && braces === angles.at(-1)) && (before < 0 || /[=(:,[!&|?;{}]$/.test(prefix) || /\b(?:return|yield|throw|case)$/.test(prefix))) {
            let end = start + 1, bracket = false;
            for (; end < source.length; end++) {
              if (source[end] === '\\') { end++; continue; }
              if (source[end] === '[') bracket = true;
              else if (source[end] === ']') bracket = false;
              else if (source[end] === '/' && !bracket) { end++; break; }
              else if (isLineTerminator(source.charCodeAt(end))) break;
            }
            scan.lastIndex = end;
          }
        }
        continue;
      }
      if (token === '{') {
        if (angles.length && braces === angles.at(-1) && /^\{\s*\.\.\./.test(source.slice(start, start + 64))) spread = true;
        braces++; continue;
      }
      if (token === '}') { braces--; continue; }
      if (token === '>') { if (source[start - 1] !== '=' && angles.length && braces === angles.at(-1)) angles.pop(); continue; }
      if (first === '"' || first === "'" || first === '`') {
        const end = quoted(start, first);
        scan.lastIndex = end;
        if (first !== '`' && (end - start > 34 || !'h\\_dm'.includes(source[start + 1]))) continue;
        const value = source.slice(start + 1, end - 1);
        const decoded = value.length <= 32 && value.includes('\\') ? value.replace(/\\(?:u\{([\da-f]+)\}|u([\da-f]{4})|x([\da-f]{2})|([0-7]{1,3})|([\s\S]))/gi, (_, point, unicode, hex, octal, other) => point || unicode || hex ? String.fromCodePoint(parseInt(point || unicode || hex, 16)) : octal ? String.fromCharCode(parseInt(octal, 8)) : other) : value;
        if (decoded === 'h' || decoded === 'h2' || first === '`' && /^h\$\{/.test(decoded)) {
          tagLiteral = true;
        }
        if ((decoded === '__html' || decoded === 'dangerouslySetInnerHTML') || hasMeasure && (decoded === 'maxWidth' || decoded === 'maxInlineSize')) relevant = bodyRelevant = true;
        if (first === '`' && value.includes('${')) {
          if (/<\s*h2\b|\b(?:__html|dangerouslySetInnerHTML|createElement)\b/.test(value)) relevant = bodyRelevant = true;
          if (/\bUniversalPage\b/.test(value)) { pageWord = true; pageUncertain = true; }
          if (/\{\s*\.\.\./.test(value)) spread = true;
        }
      } else if (first === '<') {
        hasJSX = true;
        if (/^<\s*h2$/.test(token)) relevant = bodyRelevant = true;
        tags.add(token.slice(1).trim());
        angles.push(braces);
      }
      else if (token === 'UniversalPage') pageWord = true;
      else if (token === ';') { localExport(start); clauseStart = -1; clauseKind = ''; }
      else if (token === 'import' || token === 'export') {
        clauseStart = scan.lastIndex; clauseKind = token;
        if (token === 'import') {
          const item = importAt(scan.lastIndex);
          if (item.target === PAGE_MODULE) pageWord = true;
          scan.lastIndex = Math.max(scan.lastIndex, item.end);
        }
      } else if (token === 'from') {
        const item = importAt(scan.lastIndex);
        if (clauseStart >= 0) link(source.slice(clauseStart, start).trim(), item.target);
        if (clauseStart >= 0) {
          const clause = source.slice(clauseStart, start);
          for (const named of clause.matchAll(/\bUniversalPage(?:\s+as\s+([\w$]+))?/g)) canonicalTags.add(named[1] || 'UniversalPage');
          if (item.target === PAGE_MODULE) {
            const alias = clause.trim().match(/^([\w$]+)/)?.[1];
            if (alias) canonicalTags.add(alias);
          }
          if ((item.target === PAGE_MODULE || clause.includes('UniversalPage')) && /[\\/]/.test(clause)) pageUncertain = true;
        }
        if (item.target === PAGE_MODULE) pageWord = true;
        scan.lastIndex = Math.max(scan.lastIndex, item.end);
        clauseStart = -1;
      }
      else if (token === 'createElement') hasFactory = true;
      else relevant = bodyRelevant = true;
    }
    localExport(source.length);
    let aliases;
    relevant ||= tagLiteral;
    page = [...tags].some(tag => canonicalTags.has(tag) || tag.endsWith('.UniversalPage')) || pageUncertain && pageWord;
    lexical.set(file, { page, relevant, body: bodyRelevant || hasFactory || tagLiteral, tag: tagLiteral, jsx: hasJSX, spread, children: source.includes('children'), tags: [...tags], imports, forwards, localExports,
      get aliases() {
        if (aliases) return aliases;
        aliases = imports.length && (hasJSX || localExports.length || unknownLocalExports)
          ? [...source.matchAll(/\b(?:const|let|var)\s+([\w$]+)\s*=\s*([\w$]+)(?=\s*[,;]|\s*$)/g)].map(match => [match[1], match[2]]) : [];
        if (imports.some(edge => edge.imported === '*')) for (const match of source.matchAll(/\b(?:const|let|var)\s*\{([^{}]*)\}\s*=\s*([\w$]+)/g)) {
          for (const part of uncomment(match[1]).split(',')) {
            const member = part.trim().match(/^([\w$]+)(?:\s*:\s*([\w$]+))?$/);
            if (member) aliases.push([member[2] || member[1], match[2], member[1]]);
          }
        }
        return aliases;
      }, unknownLocalExports });
  }
  phases.lexicalMs = Math.round((performance.now() - started) * 100) / 100;
  function closure(field = 'relevant', extra = []) {
    const found = new Set([...Object.keys(fonts).filter(file => FONT.test(file) && lexical.get(file)?.[field]), ...extra]), pending = [...found];
    for (let i = 0; i < pending.length; i++) {
      if (pending[i] === PAGE_MODULE) continue;
      for (const parent of parents.get(pending[i]) || []) if (!found.has(parent)) { found.add(parent); pending.push(parent); }
    }
    return found;
  }
  const cachedGraph = prepared && reuse?.graph;
  const canHaveH2 = cachedGraph?.all || closure(), canHaveTags = cachedGraph?.tags || closure('tag'), tagBodies = new Set();
  for (const file of canHaveTags) for (const parent of parents.get(file) || []) if (lexical.get(parent)?.jsx) tagBodies.add(parent);
  const canRenderContent = cachedGraph?.body || closure('body', tagBodies);
  if (prepared && reuse && !reuse.graph) reuse.graph = { all: canHaveH2, tags: canHaveTags, body: canRenderContent };
    let checkpoint = phase('indexMs', started);
  if (mode === 'prepare') return { prepared: { lexical: [...lexical], parents: [...parents].map(([file, entries]) => [file, [...entries]]) }, stats: { files: Object.keys(fonts).length, ...phases, durationMs: performance.now() - started } };
  function resolve(file, name, seen, context = null) {
    if (seen) return resolveValue(file, name, seen, context);
    const m = mod(file), scope = context?.[NODE_SCOPE] || m.rootScope;
    const key = `${file}:${name}:${scope.id}`;
    if (!resolveCache.has(key)) resolveCache.set(key, resolveValue(file, name, new Set(), context));
    return resolveCache.get(key);
  }
  function resolveValue(file, name, seen, context) {
    const m = mod(file);
    let scope = context?.[NODE_SCOPE] || m.rootScope;
    const key = `${file}:${name}:${scope.id}`;
    if (seen.has(key)) return null;
    seen.add(key);
    if (name.includes('.')) {
      const [namespace, ...members] = name.split('.'), imp = m.imports.get(namespace);
      const target = imp?.name === '*' && importFile(file, imp.from);
      if (target) return resolve(target, members.join('.'), seen);
      const localMember = resolveObjectMember(file, name, context, seen);
      if (localMember) return localMember;
    }
    let local, found = false;
    while (scope) { if (scope.bindings.has(name)) { local = scope.bindings.get(name); found = true; break; } scope = scope.parent; }
    if (!found) local = m.exports.get(name);
    if (found && !local) return { file, node: null };
    if (local?.type === 'Identifier' && local.name !== name) return resolve(file, local.name, seen, local);
    if (local?.reexport) {
      const next = importFile(file, local.reexport);
      return next ? resolve(next, local.name, seen) : null;
    }
    const member = namespaceAlias(file, local);
    if (member) return resolve(file, member, seen, local);
    if (local) return { file, node: local };
    const imp = m.imports.get(name), next = imp && importFile(file, imp.from);
    if (next) return resolve(next, imp.name, seen);
    for (const source of m.stars) {
      const target = importFile(file, source), value = target && resolve(target, name, new Set(seen));
      if (value) return value;
    }
    return null;
  }
  // Els barrels s'indexen una vegada, però un reexport sense candidats no
  // obliga a parsejar el component final. La selecció segueix el símbol importat.
  const renderResolveCache = reuse ? (reuse.renderResolveCache ||= new Map()) : new Map();
  function resolveRendered(file, name, context = null, seen = new Set(), kind = 'all') {
    const m = mod(file), scope = context?.[NODE_SCOPE] || m.rootScope;
    const key = `${file}:${name}:${scope.id}:${kind}`;
    if (seen.has(key)) return null;
    if (renderResolveCache.has(key)) return renderResolveCache.get(key);
    seen.add(key);
    function imported(next, symbol) {
      const possible = kind === 'body' ? canRenderContent : kind === 'tag' ? canHaveTags : canHaveH2;
      if (!next || !possible.has(next)) return null;
      return resolveRendered(next, symbol, null, new Set(seen), kind);
    }
    let value = null, binding, found = false, at = scope;
    while (at) { if (at.bindings.has(name)) { binding = at.bindings.get(name); found = true; break; } at = at.parent; }
    if (found) {
      const member = namespaceAlias(file, binding);
      value = member ? resolveRendered(file, member, binding, new Set(seen), kind) : binding?.type === 'Identifier' && binding.name !== name ? resolveRendered(file, binding.name, binding, new Set(seen), kind) : binding ? { file, node: binding } : null;
    }
    else if (name.includes('.')) {
      const [prefix, ...parts] = name.split('.'), imp = m.imports.get(prefix);
      if (imp?.name === '*') value = imported(importFile(file, imp.from), parts.join('.'));
      else value = resolveObjectMember(file, name, context, seen, kind);
    } else {
      const exported = m.exports.get(name), imp = m.imports.get(name);
      if (exported?.reexport) value = imported(importFile(file, exported.reexport), exported.name);
      else if (exported?.type === 'Identifier' && exported.name !== name) value = resolveRendered(file, exported.name, exported, new Set(seen), kind);
      else if (exported) value = { file, node: exported };
      else if (imp) value = imported(importFile(file, imp.from), imp.name);
      else for (const source of m.stars) { value = imported(importFile(file, source), name); if (value) break; }
    }
    renderResolveCache.set(key, value);
    return value;
  }
  function literal(node, file, seen = new Set()) {
    node = unwrap(node);
    if (!node) return null;
    if (!seen.size && literalMemo.has(node)) return literalMemo.get(node);
    const value = literalValue(node, file, seen);
    if (!seen.size) literalMemo.set(node, value);
    return value;
  }
  function literalValue(node, file, seen) {
    node = unwrap(node);
    if (!node) return null;
    if (node.syntheticDefault) {
      const values = defaultValues(node, file).map(entry => literal(entry.value, entry.file, new Set(seen))).filter(value => value !== null);
      return values.length ? values.join('\uFFFC') : null;
    }
    if (node.type === 'JSXText') return node.value;
    if (node.type === 'Literal' && ['string', 'number'].includes(typeof node.value)) return String(node.value);
    if (node.type === 'TemplateLiteral') {
      let out = '';
      for (let i = 0; i < node.quasis.length; i++) out += (node.quasis[i].value.cooked ?? node.quasis[i].value.raw) + (i < node.expressions.length ? literal(node.expressions[i], file, seen) ?? '\uFFFC' : '');
      return out;
    }
    if (node.type === 'BinaryExpression' && node.operator === '+') {
      const a = literal(node.left, file, seen), b = literal(node.right, file, seen);
      return a === null && b === null ? null : `${a ?? '\uFFFC'}${b ?? '\uFFFC'}`;
    }
    if (node.type === 'MemberExpression') {
      const selected = memberValues(node, file);
      const values = selected.map(entry => literal(entry.value, entry.file, new Set(seen))).filter(value => value !== null);
      return values.length ? values.join('\uFFFC') : null;
    }
    if (node.type === 'Identifier') {
      const key = `${file}:${node.name}`;
      if (seen.has(key)) return null;
      const next = resolve(file, node.name, undefined, node);
      if (next) return literal(next.node, next.file, new Set([...seen, key]));
    }
    return null;
  }
  function html(text, file, node, code, ancestors = []) {
    if (!text || !/<\s*h2\b/i.test(text) || code === 'MC2' && !contextRenders(ancestors)) return;
    const fragment = htmlFragment(text);
    const walk = value => {
      if (value.tagName === 'h2') add(code, file, node, 'H2 dins del cos editorial HTML; usa H3/H4.');
      for (const child of value.childNodes || []) walk(child);
      if (value.content) walk(value.content);
    };
    walk(fragment);
  }
  function staticHtml(node, file, code, ancestors = []) {
    if (!node || /^(?:Import|Export)(?:Specifier|DefaultSpecifier|NamespaceSpecifier|Declaration)$/.test(node.type) || node.type === 'ImportDeclaration') return;
    if (node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration') { if (node.declaration) staticHtml(node.declaration, file, code, ancestors); return; }
    if (node.type === 'VariableDeclarator') { if (node.init) staticHtml(node.init, file, code, ancestors); return; }
    if (node.type === 'Property') { staticHtml(node.value, file, code, ancestors); return; }
    const text = literal(node, file);
    if (text !== null) { html(text, file, node, code, ancestors); return; }
    for (const next of childNodes(node)) staticHtml(next, file, code, ancestors);
  }
  // PAGE_COPY i fragments que l'alimenten: Babel decodifica també \x3c/\u003c.
  for (const file of (mode === 'discover' ? [] : documentFiles || Object.keys(fonts)).filter(f => /(?:^|\/)pageContent[^/]*\.js$/.test(f) && !PROVA.test(f))) {
    const m = mod(file);
    if (m.ast) staticHtml(m.ast, file, 'MC1');
  }
  checkpoint = phase('pageCopyMs', checkpoint);

  const frontier = prepared?.frontier || demandFrontier(lexical);
  const rootFiles = roots || frontier.roots;
  const canonicalAuditFiles = new Set(knownWrappers?.auditedRoots || rootFiles);
  const pageReferences = new Map(frontier.references.map(([file, names]) => [file, new Set(names)]));
  function isPage(file, name, node = null) {
    if (!isComponentName(name)) return false;
    if (isCanonicalPage(file, name)) return true;
    const prefix = name.split('.')[0], imp = mod(file).imports.get(prefix);
    if (imp) {
      const names = pageReferences.get(importFile(file, imp.from));
      const symbol = imp.name === '*' ? name.split('.')[1] : imp.name;
      if (!names || !names.has('*') && !names.has(symbol)) return false;
    }
    const consumed = consumedProps(resolve(file, name, undefined, node), true);
    return !!consumed?.size;
  }
  function isCanonicalPage(file, name) {
    const m = mod(file);
    return name === 'UniversalPage' || m.imports.get(name)?.name === 'UniversalPage' || name.endsWith('.UniversalPage') && m.imports.get(name.split('.')[0])?.name === '*';
  }
  // La llista sintàctica de retorns és independent dels props i del context.
  // Cada consumidor interpreta les expressions amb les seues pròpies guardes.
  function returnedValues(body) {
    if (returnsMemo.has(body)) return returnsMemo.get(body);
    const result = [];
    function collect(node) {
      if (node.type === 'ReturnStatement') { result.push(node.argument); return; }
      if (FUNCTIONS.has(node.type) || LEAVES.has(node.type)) return;
      for (const key of childKeys(node)) {
        const value = node[key];
        if (Array.isArray(value)) {
          for (const next of value) if (next && typeof next.type === 'string') collect(next);
        } else if (value && typeof value.type === 'string') collect(value);
      }
    }
    collect(body); returnsMemo.set(body, result);
    return result;
  }
  checkpoint = phase('wrappersMs', checkpoint);
  // Cada prop es vincula a la ruta i al sink que la renderitza: JSX, HTML o
  // estil. Un text React que conté "<h2>" no es converteix en HTML per inferència.
  function consumedProps(target, pageOnly = false) {
    if (!target?.node || !FUNCTIONS.has(target.node.type)) return null;
    const mode = pageOnly ? 1 : 0, bit = 1 << mode, active = consumedActive.get(target.node) || 0;
    if (active & bit) return null;
    const cached = consumedCache.get(target.node);
    if (cached && Object.hasOwn(cached, mode)) return cached[mode];
    const m = mod(target.file), bindings = new Map(), used = new Set(), seen = new Set(), dependencies = new WeakMap(), activeDependencies = new WeakSet();
    used.sinks = new Map(); used.defaults = [];
    let incomplete = false;
    function bind(pattern, route = [], excluded = new Set()) {
      if (!pattern) return;
      if (pattern.type === 'AssignmentPattern') { used.defaults.push({ path: route, value: pattern.right, file: target.file }); bind(pattern.left, route, excluded); }
      else if (pattern.type === 'Identifier') bindings.set(pattern.name, { path: route, excluded, scope: pattern?.[NODE_SCOPE] });
      else if (pattern.type === 'ObjectPattern') {
        const keys = new Set(pattern.properties.filter(prop => prop.type !== 'RestElement').map(prop => prop.computed ? literal(prop.key, target.file) : String(propName(prop.key))));
        for (const prop of pattern.properties) {
          if (prop.type === 'RestElement') bind(prop.argument, route, keys);
          else bind(prop.value, [...route, prop.computed ? literal(prop.key, target.file) ?? '*' : String(propName(prop.key))]);
        }
      } else if (pattern.type === 'ArrayPattern') pattern.elements.forEach((item, index) => { if (item) bind(item, [...route, String(index)]); });
    }
    for (const param of target.node.params || []) bind(param);
    function nearest(node, name) {
      let scope = node?.[NODE_SCOPE] || m.rootScope;
      while (scope && !scope.bindings.has(name)) scope = scope.parent;
      return scope;
    }
    function source(node, active = new Set()) {
      node = unwrap(node);
      if (!node || active.has(node)) return null;
      active.add(node);
      if (node.type === 'Identifier') {
        const binding = bindings.get(node.name);
        if (binding && nearest(node, node.name) === binding.scope) return binding;
        if (m.imports.has(node.name)) return null;
        const local = resolve(target.file, node.name, undefined, node);
        return local?.file === target.file ? source(local.node, active) : null;
      }
      if (node.type === 'MemberExpression') {
        const base = source(node.object, active);
        if (!base) return null;
        const key = node.computed ? literal(node.property, target.file) ?? '*' : String(propName(node.property));
        if (base.excluded.has(key)) return null;
        return { path: [...base.path, key], excluded: new Set(), scope: base.scope };
      }
      if (node.type === 'ChainExpression') return source(node.expression, active);
      return null;
    }
    function mark(route, kind, page) {
      if (!page) return;
      const key = route[0] || '*', path = route.slice(1);
      used.add(key);
      if (!used.sinks.has(key)) used.sinks.set(key, []);
      const sinks = used.sinks.get(key);
      if (!sinks.some(sink => sink.kind === kind && JSON.stringify(sink.path) === JSON.stringify(path))) sinks.push({ kind, path });
    }
    function depends(node) {
      node = unwrap(node);
      if (!node) return false;
      if (dependencies.has(node)) return dependencies.get(node);
      if (activeDependencies.has(node)) return true;
      activeDependencies.add(node);
      let value = !!source(node);
      if (!value && node.type === 'Identifier') {
        const local = m.imports.has(node.name) ? null : resolve(target.file, node.name, undefined, node);
        value = local?.file === target.file && depends(local.node);
      } else if (!value && node.type === 'JSXElement') {
        const tag = jsxName(node.openingElement.name), prefix = tag.split('.')[0], binding = bindings.get(prefix);
        value = !!binding && nearest(node, prefix) === binding.scope || node.children.some(depends) || node.openingElement.attributes.some(depends);
        if (!value && !m.imports.has(prefix)) { const local = resolve(target.file, tag, undefined, node); value = local?.file === target.file && depends(local.node); }
      } else if (!value && node.type === 'Property') value = depends(node.value);
      else if (!value && node.type === 'MemberExpression') value = depends(node.object) || node.computed && depends(node.property);
      else if (!value && node.type === 'JSXAttribute') value = depends(node.value);
      else if (!value) value = childNodes(node).some(depends);
      activeDependencies.delete(node); dependencies.set(node, !!value);
      return value;
    }
    function at(node, route, kind, page) {
      node = unwrap(node);
      if (!node) return;
      const parameter = source(node);
      if (parameter) { mark([...parameter.path, ...route], kind, page); return; }
      if (!route.length) { visit(node, kind, page); return; }
      if (node.type === 'ConditionalExpression') { at(node.consequent, route, kind, page); at(node.alternate, route, kind, page); return; }
      for (const entry of objectEntries(node, target.file)) if (entry.file === target.file && (route[0] === '*' || entry.key === route[0])) at(entry.value, route.slice(1), kind, page);
    }
    function descriptors(inner, key, page) {
      if (!inner) return page ? [{ kind: 'jsx', path: [] }] : [];
      return [...(inner.sinks.get(key) || []), ...(inner.sinks.get('*') || [])];
    }
    function transfer(node, inner, key, page) {
      for (const sink of descriptors(inner, key, page)) at(node, sink.path, sink.kind, true);
    }
    function spread(node, inner, page, hasChildren) {
      const parameter = source(node);
      if (parameter) {
        if (!inner) { if (page) mark(parameter.path, 'jsx', true); return; }
        for (const [key, sinks] of inner.sinks) if ((key !== 'children' || !hasChildren) && !parameter.excluded.has(key)) for (const sink of sinks) mark([...parameter.path, ...(key === '*' ? [] : [key]), ...sink.path], sink.kind, true);
      } else for (const entry of objectEntries(node, target.file)) if (entry.file === target.file && (entry.key !== 'children' || !hasChildren)) transfer(entry.value, inner, entry.key, page);
    }
    function visit(node, kind = 'jsx', page = !pageOnly) {
      node = unwrap(node);
      if (!node || !depends(node)) return;
      const key = `${node.start}:${node.type}:${kind}:${page}`;
      if (seen.has(key)) return;
      seen.add(key);
      const parameter = source(node);
      if (parameter) { mark(parameter.path, kind, page); return; }
      if (node.type === 'Identifier') { const local = resolve(target.file, node.name, undefined, node); if (local?.file === target.file) visit(local.node, kind, page); return; }
      if (FUNCTIONS.has(node.type)) {
        if (node.body?.type !== 'BlockStatement') visit(node.body, kind, page);
        else for (const value of returnedValues(node.body)) visit(value, kind, page);
        return;
      }
      if (node.type === 'ConditionalExpression') { visit(node.consequent, kind, page); visit(node.alternate, kind, page); return; }
      if (node.type === 'LogicalExpression') { if (node.operator !== '&&') visit(node.left, kind, page); visit(node.right, kind, page); return; }
      if (node.type === 'UnaryExpression') return;
      if (node.type === 'BinaryExpression' && kind === 'jsx') return;
      if (node.type === 'Property') {
        if (kind === 'style') { if (['maxWidth', 'maxInlineSize', 'max-width', 'max-inline-size'].includes(String(propName(node.key)))) visit(node.value, 'measure', page); }
        else visit(node.value, kind, page);
        return;
      }
      if (node.type === 'MemberExpression') { for (const entry of memberValues(node, target.file)) if (entry.file === target.file) visit(entry.value, kind, page); return; }
      if (node.type === 'JSXElement') {
        const tag = jsxName(node.openingElement.name), custom = isComponentName(tag), canonical = isCanonicalPage(target.file, tag), hasChildren = jsxHasChildren(node);
        const tagParts = tag.split('.'), tagBinding = bindings.get(tagParts[0]);
        if (tagBinding && nearest(node, tagParts[0]) === tagBinding.scope) mark([...tagBinding.path, ...tagParts.slice(1)], 'jsx', page);
        if (canonical) {
          for (const child of node.children) visit(child, 'jsx', true);
          for (const prop of node.openingElement.attributes) {
            if (prop.type === 'JSXSpreadAttribute') { if (!hasChildren) at(prop.argument, ['children'], 'jsx', true); }
            else if (prop.name.name === 'children' && !hasChildren) visit(prop.value, 'jsx', true);
          }
          return;
        }
        if (custom) {
          const component = resolve(target.file, tag, undefined, node), mode = pageOnly && !page;
          const innerFor = () => {
            const inner = consumedProps(component, mode);
            if (component?.node && FUNCTIONS.has(component.node.type) && (!inner || inner.incomplete)) incomplete = true;
            return inner;
          };
          if (component?.file === target.file && depends(component.node)) visit(component.node, 'jsx', page);
          for (const child of node.children) if (depends(child)) transfer(child, innerFor(), 'children', page);
          for (const prop of node.openingElement.attributes) {
            if (prop.type === 'JSXSpreadAttribute' && depends(prop.argument)) {
              spread(prop.argument, innerFor(), page, hasChildren);
            } else if (prop.type === 'JSXAttribute' && (prop.name.name !== 'children' || !hasChildren) && depends(prop.value)) transfer(prop.value, innerFor(), prop.name.name, page);
          }
        } else {
          for (const child of node.children) visit(child, 'jsx', page);
          for (const prop of node.openingElement.attributes) {
            if (prop.type === 'JSXSpreadAttribute') {
              if (!hasChildren) at(prop.argument, ['children'], 'jsx', page);
              at(prop.argument, ['dangerouslySetInnerHTML', '__html'], 'html', page);
              if (!controlTags.has(tag)) at(prop.argument, ['style'], 'style', page);
            } else if (prop.name.name === 'children' && !hasChildren) visit(prop.value, 'jsx', page);
            else if (prop.name.name === 'dangerouslySetInnerHTML') at(prop.value, ['__html'], 'html', page);
            else if (prop.name.name === 'style' && !controlTags.has(tag)) visit(prop.value, 'style', page);
          }
        }
        return;
      }
      for (const next of childNodes(node)) visit(next, kind, page);
    }
    consumedActive.set(target.node, active | bit);
    try { visit(target.node); } finally { if (active) consumedActive.set(target.node, active); else consumedActive.delete(target.node); }
    used.incomplete = incomplete;
    if (!incomplete) { const modes = consumedCache.get(target.node) || []; modes[mode] = used; consumedCache.set(target.node, modes); }
    return used;
  }
  function guarded(ancestors, file, name, prop, ownerNode, pageOnly = false) {
    const last = ancestors.at(-1);
    const token = `|prop:${file}:${ownerNode.start}:${prop}:${pageOnly}`;
    const context = last?.context || '';
    return [...ancestors, { ...last, guard: { file, name, prop, node: ownerNode, pageOnly }, context: context.includes(token) ? context : context + token }];
  }
  const guardResults = new Map(), contextResults = new Map();
  function contextRenders(ancestors) {
    const context = ancestors.at(-1)?.context || '';
    if (contextResults.has(context)) return contextResults.get(context);
    for (const { guard } of ancestors) if (guard) {
      const key = `${guard.file}:${guard.node.start}:${guard.prop}:${guard.pageOnly}`;
      if (!guardResults.has(key)) {
        const consumed = isCanonicalPage(guard.file, guard.name) ? new Set(['children']) : consumedProps(resolve(guard.file, guard.name, undefined, guard.node), guard.pageOnly);
        guardResults.set(key, !consumed || consumed.has('*') || consumed.has(guard.prop));
      }
      if (!guardResults.get(key)) { contextResults.set(context, false); return false; }
    }
    contextResults.set(context, true);
    return true;
  }
  function memberValues(node, file, seen = new Set(), renderOnly = false) {
    const name = node.computed ? literal(node.property, file) : propName(node.property);
    if (node.object.type === 'Identifier') {
      const imp = mod(file).imports.get(node.object.name);
      if (imp?.name === '*' && name) {
        const target = renderOnly ? resolveRendered(file, `${node.object.name}.${name}`, node, new Set(), 'body') : resolve(file, `${node.object.name}.${name}`, undefined, node);
        return target?.node ? [{ value: target.node, file: target.file }] : [];
      }
    }
    const entries = objectEntries(node.object, file, new Set(seen));
    return name === null ? entries : entries.filter(entry => entry.key === name);
  }
  function namespaceAlias(file, node) {
    if (node?.type !== 'MemberExpression' || node.object.type !== 'Identifier') return null;
    const m = mod(file), name = node.object.name;
    let scope = node.object[NODE_SCOPE] || node[NODE_SCOPE] || m.rootScope;
    while (scope) { if (scope.bindings.has(name)) return null; scope = scope.parent; }
    const member = node.computed ? literal(node.property, file) : propName(node.property);
    return m.imports.get(name)?.name === '*' && member ? `${name}.${member}` : null;
  }
  function resolveObjectMember(file, name, context, seen, kind = null) {
    const [prefix, ...route] = name.split('.');
    const base = kind ? resolveRendered(file, prefix, context, new Set(seen), kind) : resolve(file, prefix, new Set(seen), context);
    let selected = base?.node ? [{ value: base.node, file: base.file }] : [];
    for (const member of route) selected = selected.flatMap(entry => objectEntries(entry.value, entry.file).filter(value => value.key === member));
    return selected.length === 1 ? { node: selected[0].value, file: selected[0].file } : null;
  }
  function undefinedValue(node, file, seen = new Set()) {
    node = unwrap(node);
    if (!node) return true;
    if (node.type === 'UnaryExpression' && node.operator === 'void') return true;
    if (node.type !== 'Identifier') return false;
    const key = `${file}:${node.name}:${node.start}`;
    if (seen.has(key)) return false;
    seen.add(key);
    const target = resolve(file, node.name, undefined, node);
    return target?.node ? undefinedValue(target.node, target.file, seen) : node.name === 'undefined' && !target;
  }
  function defaultValues(node, file) {
    if (activeDefaults.has(node)) return [];
    activeDefaults.add(node);
    try {
      const values = node.left?.type === 'MemberExpression' ? memberValues(node.left, file) : node.left ? [{ value: node.left, file }] : [];
      return values.length ? values.map(entry => undefinedValue(entry.value, entry.file) ? { value: node.right, file } : entry) : [{ value: node.right, file }];
    } finally { activeDefaults.delete(node); }
  }
  function objectEntries(node, file, seen = new Set()) {
    node = unwrap(node);
    if (!node) return [];
    const key = `${file}:${node.start}:${node.type}`;
    if (seen.has(key)) return [];
    seen.add(key);
    if (node.syntheticDefault) return defaultValues(node, file).flatMap(entry => objectEntries(entry.value, entry.file, new Set(seen)));
    if (node.type === 'Identifier') {
      const target = resolve(file, node.name, undefined, node);
      return target ? objectEntries(target.node, target.file, seen) : [];
    }
    if (entryMemo.has(node)) return entryMemo.get(node);
    if (node.type === 'ObjectExpression' && node.properties.every(prop => prop.type === 'Property' && !prop.computed && propName(prop.key) !== undefined)) {
      const entries = new Map();
      for (const prop of node.properties) {
        const key = String(propName(prop.key));
        entries.set(String(key), { key: String(key), value: prop.value, node: prop, file });
      }
      const result = [...entries.values()]; entryMemo.set(node, result); return result;
    }

    if (node.type === 'MemberExpression') return memberValues(node, file, seen).flatMap(entry => objectEntries(entry.value, entry.file, new Set(seen)));
    if (node.syntheticUnion) return node.elements.flatMap(value => objectEntries(value, file, new Set(seen)));
    if (node.type === 'ArrayExpression') {
      const result = node.elements.flatMap((value, index) => value ? [{ key: String(index), value, node: value, file }] : []);
      entryMemo.set(node, result); return result;
    }
    const entries = new Map();
    for (const prop of node.properties || []) {
      if (prop.type === 'SpreadElement') for (const entry of objectEntries(prop.argument, file, new Set(seen))) entries.set(entry.key, entry);
      else {
        const key = prop.computed ? literal(prop.key, file) : propName(prop.key);
        if (key !== null && key !== undefined) entries.set(String(key), { key: String(key), value: prop.value, node: prop, file });
      }
    }
    return [...entries.values()];
  }
  function jsxHasChildren(node) { return node.children.some(child => child.type === 'JSXText' ? child.value.trim() || !child.value.includes('\n') && child.value.length : !(child.type === 'JSXExpressionContainer' && child.expression.type === 'JSXEmptyExpression')); }
  const obviousCache = new WeakMap();
  function obvious(node, file) {
    if (!obviousCache.has(node)) obviousCache.set(node, node.start >= 0 && /<\s*h2\b|__html|dangerouslySetInnerHTML|--sdp-measure/.test(fonts[file].slice(node.start, node.end)));
    return obviousCache.get(node);
  }
  const visited = reuse ? (reuse.visited ||= new Map()) : new Map();
  function projectValues(node, file, route, seen = new Set()) {
    node = unwrap(node);
    if (!node) return [];
    if (!route.length) return [{ node, file }];
    const key = `${file}:${node.start}:${route.join('.')}`;
    if (seen.has(key)) return [];
    seen.add(key);
    if (node.type === 'ConditionalExpression') return [...projectValues(node.consequent, file, route, new Set(seen)), ...projectValues(node.alternate, file, route, new Set(seen))];
    return objectEntries(node, file).filter(entry => route[0] === '*' || entry.key === route[0]).flatMap(entry => projectValues(entry.value, entry.file, route.slice(1), new Set(seen)));
  }
  function sinksFor(consumer, key) {
    if (!consumer) {
      if (key === 'dangerouslySetInnerHTML') return { sinks: [{ kind: 'html', path: ['__html'] }], confirmed: false };
      if (key === 'style') return { sinks: [{ kind: 'style', path: [] }], confirmed: false };
      return { sinks: [{ kind: 'jsx', path: [] }], confirmed: false };
    }
    if (isCanonicalPage(consumer.file, consumer.name)) return { sinks: key === 'children' ? [{ kind: 'jsx', path: [] }] : [], confirmed: true };
    const consumed = consumedProps(resolve(consumer.file, consumer.name, undefined, consumer.node), consumer.pageOnly);
    if (!consumed) return sinksFor(null, key);
    // mark() afig conjuntament used.has(key) i els seus descriptors. Només
    // un resum complet i positiu acredita el mateix guard de contextRenders.
    return { sinks: [...(consumed.sinks.get(key) || []), ...(consumed.sinks.get('*') || [])],
      confirmed: !consumed.incomplete && (consumed.has(key) || consumed.has('*')) };
  }
  function auditStyle(node, file, ancestors) {
    for (const declaration of objectEntries(node, file)) if (['maxWidth', 'maxInlineSize', 'max-width', 'max-inline-size'].includes(declaration.key) && /var\(\s*--sdp-measure(?:\s*[,)]|$)/.test(literal(declaration.value, declaration.file) || '') && contextRenders(ancestors)) add('MC3', declaration.file, declaration.node, 'Amplada editorial JSX restringida per --sdp-measure.');
  }
  const possibleValues = reuse ? (reuse.possibleValues ||= new WeakMap()) : new WeakMap();
  const possibleActive = new WeakSet();
  function possibleValue(node, file) {
    node = unwrap(node);
    if (!node) return false;
    if (possibleValues.has(node)) return possibleValues.get(node);
    if (possibleActive.has(node)) return true;
    possibleActive.add(node);
    let possible = true;
    if (node.type === 'Literal' || node.type === 'JSXText') possible = typeof node.value === 'string' && /<\s*h2\b|var\(\s*--sdp-measure/i.test(node.value);
    else if (node.type === 'ObjectExpression') possible = node.properties.some(prop => prop.type === 'SpreadElement' || possibleValue(prop.value, file));
    else if (node.type === 'ArrayExpression') possible = node.elements.some(value => possibleValue(value, file));
    else if (node.type === 'BinaryExpression' || node.type === 'TemplateLiteral') {
      const value = literal(node, file);
      possible = value === null || value.includes('\uFFFC') || /<\s*h2\b|var\(\s*--sdp-measure/i.test(value);
    } else if (node.type === 'JSXElement') {
      const name = jsxName(node.openingElement.name);
      possible = name === 'h2' || isComponentName(name) || node.children.some(child => possibleValue(child, file)) || node.openingElement.attributes.some(prop => prop.type === 'JSXSpreadAttribute' || ['children', 'dangerouslySetInnerHTML', 'style'].includes(prop.name.name) && possibleValue(prop.value, file));
    } else if (node.type === 'Identifier') {
      // Parameters have no static value here; their actual inputs are projected
      // at the calling JSX boundary. Never load an import merely to prune it.
      const m = mod(file);
      let scope = node?.[NODE_SCOPE] || m.rootScope;
      while (scope && !scope.bindings.has(node.name)) scope = scope.parent;
      possible = scope ? possibleValue(scope.bindings.get(node.name), file) : m.imports.has(node.name) || m.stars.length > 0;
    } else if (FUNCTIONS.has(node.type)) {
      if (node.body?.type !== 'BlockStatement') possible = possibleValue(node.body, file);
      else possible = returnedValues(node.body).some(value => possibleValue(value, file));
    } else if (node.type === 'CallExpression') {
      const factory = node.callee.type === 'Identifier' ? node.callee.name : node.callee.type === 'MemberExpression' ? propName(node.callee.property) : null;
      possible = factory === 'createElement' || possibleValue(node.callee, file) || node.arguments.some(value => possibleValue(value, file));
    } else if (['ConditionalExpression', 'LogicalExpression', 'UnaryExpression', 'SequenceExpression', 'SpreadElement'].includes(node.type)) possible = childNodes(node).some(value => possibleValue(value, file));
    possibleActive.delete(node);
    possibleValues.set(node, possible);
    return possible;
  }
  function renderedProp(value, file, key, ancestors, consumer = null, control = false) {
    if (consumer && !possibleValue(value, file)) return;
    const { sinks, confirmed } = sinksFor(consumer, key);
    // No es compacten guards desconeguts/incomplets ni camins amb excepcions.
    // Les entrades reals conserven cada ruta i kind; només s'omet el token que
    // repeteix un consum ja acreditat, permetent memoitzar el mateix cos.
    const contextual = consumer && confirmed && ancestors.some(a => a.node?.type === 'JSXElement' &&
      (jsxName(a.node.openingElement.name) === 'dialog' || contextualPageClass(a.node, a.file)));
    const context = consumer && (!confirmed || contextual) ? guarded(ancestors, consumer.file, consumer.name, key, consumer.node, consumer.pageOnly) : ancestors;
    for (const sink of sinks) for (const selected of projectValues(value, file, sink.path)) {
      if (sink.kind === 'html') staticHtml(selected.node, selected.file, 'MC2', context);
      else if (sink.kind === 'style') { if (!control) auditStyle(selected.node, selected.file, context); }
      else if (sink.kind === 'measure') {
        if (!control && /var\(\s*--sdp-measure(?:\s*[,)]|$)/.test(literal(selected.node, selected.file) || '') && contextRenders(context)) add('MC3', selected.file, selected.node, 'Amplada editorial JSX restringida per --sdp-measure.');
      } else rendered(selected.node, selected.file, context);
    }
  }
  function renderedProps(node, file, ancestors = [], seen = new Set(), allowed = null, control = false, consumer = null, ignored = new Set()) {
    for (const entry of objectEntries(node, file, seen)) {
      if (ignored.has(entry.key) || allowed && !allowed.has('*') && !allowed.has(entry.key)) continue;
      renderedProp(entry.value, entry.file, entry.key, ancestors, consumer, control);
    }
  }
  function renderedDefaults(node, file, target, ancestors, consumer) {
    const used = consumedProps(target);
    if (!used?.defaults?.length) return;
    const properties = node.openingElement.attributes.map(prop => prop.type === 'JSXSpreadAttribute' ? { type: 'SpreadElement', argument: prop.argument }
      : { type: 'Property', key: { type: 'Literal', value: prop.name.name }, value: unwrap(prop.value) || { type: 'Literal', value: true }, computed: false });
    if (jsxHasChildren(node)) properties.push({ type: 'Property', key: { type: 'Literal', value: 'children' }, computed: false,
      value: { type: 'JSXFragment', children: node.children, start: node.start } });
    const supplied = { type: 'ObjectExpression', properties, start: node.start }, applied = [];
    const startsWith = (path, prefix) => prefix.every((key, index) => path[index] === key);
    function inputs(route) {
      const fallback = applied.findLast(entry => startsWith(route, entry.path));
      return fallback ? projectValues(fallback.value, fallback.file, route.slice(fallback.path.length)) : projectValues(supplied, file, route);
    }
    for (const entry of used.defaults) {
      if (!entry.path.length) continue; // React sempre passa l'objecte de props.
      const values = inputs(entry.path), parent = entry.path.slice(0, -1);
      if (parent.length && !inputs(parent).some(value => value.node.type === 'ObjectExpression' || value.node.type === 'ArrayExpression')) continue;
      if (values.length && !values.every(value => undefinedValue(value.node, value.file))) continue;
      applied.push(entry);
      let value = entry.value;
      for (const key of entry.path.slice(1).toReversed()) value = { type: 'ObjectExpression', start: node.start,
        properties: [{ type: 'Property', key: { type: 'Literal', value: key }, value, computed: false }] };
      renderedProp(value, entry.file, entry.path[0], ancestors, consumer);
    }
  }
  const pageExceptionClasses = new Set(exceptions.map(entry => entry.className).filter(Boolean));
  function contextualPageClass(node, file) {
    const value = literal(attr(node, 'className'), file);
    return value?.includes('component-doc-preview') || value?.split(/\s+/).some(name => pageExceptionClasses.has(name));
  }
  function rendered(node, file, ancestors = []) {
    if (!node || (node.type !== 'Identifier' && LEAVES.has(node.type))) return;
    // ESTree ChainExpression i el seu CallExpression comparteixen start.
    // Desemboliquem abans del memo per no considerar la crida ja visitada.
    if (node.type === 'ChainExpression') { rendered(node.expression, file, ancestors); return; }
    if (node.syntheticDefault) { for (const value of defaultValues(node, file)) rendered(value.value, value.file, ancestors); return; }
    if (ancestors.at(-1)?.guard && obvious(node, file) && !contextRenders(ancestors)) return;
    const context = ancestors.at(-1)?.context || '';
    let contexts = visited.get(file);
    if (!contexts) { contexts = new Map(); visited.set(file, contexts); }
    let positions = contexts.get(context);
    if (!positions) { positions = new Set(); contexts.set(context, positions); }
    if (positions.has(node.start)) return;
    positions.add(node.start);
    if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') {
      for (const member of node.body?.body || []) {
        if (member.key?.type === 'PrivateName' || member.key?.type === 'PrivateIdentifier') continue;
        const name = member.computed ? literal(member.key, file) : propName(member.key);
        if (!member.static && name === 'render') rendered(member.value || member, file, ancestors);
      }
      return;
    }
    if (FUNCTIONS.has(node.type)) {
      if (node.body?.type !== 'BlockStatement') rendered(node.body, file, ancestors);
      else for (const value of returnedValues(node.body)) rendered(value, file, ancestors);
      return;
    }
    if (node.type === 'Identifier') {
      const imp = mod(file).imports.get(node.name);
      const target = !imp || canRenderContent.has(importFile(file, imp.from)) ? resolveRendered(file, node.name, node, new Set(), 'body') : null;
      if (target) rendered(target.node, target.file, ancestors);
      return;
    }
    if (node.type === 'MemberExpression') {
      const imp = node.object.type === 'Identifier' && mod(file).imports.get(node.object.name);
      if (imp && !canRenderContent.has(importFile(file, imp.from))) return;
      for (const entry of memberValues(node, file, new Set(), true)) rendered(entry.value, entry.file, ancestors);
      return;
    }
    if (node.type === 'JSXElement') {
      const originalName = jsxName(node.openingElement.name);
      const importedTag = mod(file).imports.get(originalName.split('.')[0]);
      const tagValue = isComponentName(originalName) && (!importedTag || canHaveTags.has(importFile(file, importedTag.from))) ? resolveRendered(file, originalName, node, new Set(), 'tag') : null;
      const name = tagValue && literal(tagValue.node, tagValue.file) === 'h2' ? 'h2' : originalName;
      const custom = isComponentName(name), isControl = controlTags.has(name);
      // locatePages audita aquest mateix cos com a arrel pròpia. Les entrades
      // reals dels paràmetres ja s'han projectat en sinksFor al lloc de crida.
      // Diàlegs i mostres poden afegir excepcions contextuals: es recorren.
      if (custom && canonicalAuditFiles.has(file) && isCanonicalPage(file, name) &&
          !contextualPageClass(node, file) &&
          !ancestors.some(a => a.node?.type === 'JSXElement' &&
            (jsxName(a.node.openingElement.name) === 'dialog' || contextualPageClass(a.node, a.file)))) return;
      const imp = custom && mod(file).imports.get(name);
      const target = custom && (!imp || canRenderContent.has(importFile(file, imp.from))) ? resolveRendered(file, name, node, new Set(), 'body') : null;
      const hasChildren = jsxHasChildren(node);
      const ignored = hasChildren ? new Set(['children']) : new Set();
      if (!custom && !isControl) auditStyle(unwrap(attr(node, 'style')), file, ancestors);
      if (name === 'h2') {
        if (!contextRenders(ancestors)) return;
        const id = literal(attr(node, 'id'), file), text = node.children.filter(n => n.type === 'JSXText').map(n => n.value).join('').trim();
        const dialog = ancestors.findLast(a => jsxName(a.node.openingElement.name) === 'dialog');
        const label = dialog && literal(attr(dialog.node, 'aria-labelledby'), dialog.file);
        const titleOfDialog = id && label?.split(/\s+/).includes(id);
        const sample = exceptions.find(e => e.file === file && e.text === text && ancestors.some(a => literal(attr(a.node, 'className'), a.file)?.split(/\s+/).includes(e.className)));
        if (titleOfDialog && exceptions.some(e => e.id === 'dialog-independent')) exemptions.push({ id: 'dialog-independent', file, line: location(file, node).line, reason: EXCEPCIONS[1].reason });
        else if (sample) exemptions.push({ id: sample.id, file, line: location(file, node).line, reason: sample.reason });
        else add('MC2', file, node, 'H2 renderitzat com a children de UniversalPage; usa H3/H4.');
      }
      const changesContext = name === 'dialog' || contextualPageClass(node, file);
      const nextAncestors = [...ancestors, { file, node, context: context + (changesContext ? `,${file}:${node.start}` : '') }];
      const consumer = custom ? { file, name, node } : null;
      for (const child of node.children) renderedProp(child, file, 'children', nextAncestors, consumer, isControl);
      for (const property of node.openingElement.attributes) {
        if (property.type === 'JSXSpreadAttribute') renderedProps(property.argument, file, nextAncestors, new Set(), custom ? null : new Set(['children', 'dangerouslySetInnerHTML', 'style']), isControl, consumer, ignored);
        else if (!ignored.has(property.name.name) && (custom || property.name.name === 'children' || property.name.name === 'dangerouslySetInnerHTML')) renderedProp(property.value, file, property.name.name, nextAncestors, consumer, isControl);
      }
      if (custom && !isCanonicalPage(file, name) && target) { renderedDefaults(node, file, target, nextAncestors, consumer); rendered(target.node, target.file, nextAncestors); }
      return;
    }
    if (node.type === 'CallExpression') {
      const callee = node.callee;
      const namespace = callee.type === 'MemberExpression' && callee.object.type === 'Identifier' ? mod(file).imports.get(callee.object.name) : null;
      const direct = callee.type === 'Identifier' ? mod(file).imports.get(callee.name) : null;
      const factory = namespace?.from === 'react' && propName(callee.property) === 'createElement' || direct?.from === 'react' && direct.name === 'createElement';
      if (factory && literal(node.arguments[0], file) === 'h2' && contextRenders(ancestors)) add('MC2', file, node, 'H2 creat com a children de UniversalPage amb React.createElement; usa H3/H4.');
    }
    // Crides locals com renderCos() també són contingut, sense executar-les.
    if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
      const imp = mod(file).imports.get(node.callee.name);
      const target = !imp || canRenderContent.has(importFile(file, imp.from)) ? resolveRendered(file, node.callee.name, node, new Set(), 'body') : null;
      if (target) rendered(target.node, target.file, ancestors);
    }
    if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression') {
      for (const entry of memberValues(node.callee, file, new Set(), true)) rendered(entry.value, entry.file, ancestors);
    }
    if (node.type === 'CallExpression') {
      for (const argument of node.arguments) rendered(argument, file, ancestors);
      return;
    }
    if (node.type === 'Property') { if (propName(node.key) === '__html') staticHtml(node.value, file, 'MC2', ancestors); else rendered(node.value, file, ancestors); return; }
    for (const next of childNodes(node)) rendered(next, file, ancestors);
  }
  function locatePages(node, file) {
    if (node.type !== 'JSXElement') return;
    const name = jsxName(node.openingElement.name), canonical = isCanonicalPage(file, name);
    if (!canonical && (!isComponentName(name) || !node.children.some(value => possibleValue(value, file)) && !node.openingElement.attributes.some(prop => possibleValue(prop.type === 'JSXSpreadAttribute' ? prop.argument : prop.value, file)))) return;
    if (!canonical && !isPage(file, name, node)) return;
    const ancestors = canonical ? [] : [{ file, node, context: '' }];
    const consumer = canonical ? null : { file, name, node, pageOnly: true };
    for (const child of node.children) renderedProp(child, file, 'children', ancestors, consumer);
    const ignored = jsxHasChildren(node) ? new Set(['children']) : new Set();
    for (const property of node.openingElement.attributes) {
      if (property.type === 'JSXSpreadAttribute') renderedProps(property.argument, file, ancestors, new Set(), canonical ? new Set(['children']) : null, false, consumer, ignored);
      else if (!ignored.has(property.name.name) && (!canonical || property.name.name === 'children')) renderedProp(property.value, file, property.name.name, ancestors, consumer);
    }
  }
  for (const file of rootFiles) { const m = mod(file); for (const { node } of m.jsx) locatePages(node, file); }
  checkpoint = phase('childrenMs', checkpoint);

  function controlOnlySelector(selector) {
    if (!selector) return false;
    const branches = [];
    let start = 0, depth = 0, quoted = '', escaped = false;
    for (let i = 0; i < selector.length; i++) {
      const char = selector[i];
      if (quoted) { if (char === quoted && !escaped) quoted = ''; escaped = char === '\\' && !escaped; continue; }
      if (char === '"' || char === "'") { quoted = char; continue; }
      if (char === '(' || char === '[') depth++;
      else if (char === ')' || char === ']') depth--;
      else if (char === ',' && depth === 0) { branches.push(selector.slice(start, i)); start = i + 1; }
    }
    if (depth !== 0 || quoted) return false;
    branches.push(selector.slice(start));
    return branches.every(branch => {
      const text = branch.trim();
      let subject = 0;
      depth = 0; quoted = ''; escaped = false;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (quoted) { if (char === quoted && !escaped) quoted = ''; escaped = char === '\\' && !escaped; continue; }
        if (char === '"' || char === "'") { quoted = char; continue; }
        if (char === '(' || char === '[') depth++;
        else if (char === ')' || char === ']') depth--;
        else if (depth === 0 && /[>+~\s]/.test(char)) subject = i + 1;
      }
      // Es comprova el subjecte, no un control avantpassat: input + p és prosa.
      return /^(?:input|select|textarea|button|option)(?=[.#[:]|$)/i.test(text.slice(subject));
    });
  }
  // Sense llistes de deute tolerat: cada selector desconegut restringit queda
  // visible. La revisió humana pot distingir controls de prosa, mai amagar P.
  for (const file of (mode === 'discover' ? [] : documentFiles || Object.keys(fonts)).filter(f => f.endsWith('.css'))) {
    const source = fonts[file];
    if (!source.includes('--sdp-measure')) continue;
    try {
      (postcss ||= require('postcss')).parse(source, { from: file }).walkDecls(decl => {
        if (controlOnlySelector(decl.parent.selector)) return;
        if (/^max-(?:width|inline-size)$/i.test(decl.prop) && /var\(\s*--sdp-measure(?:\s*[,)]|$)/i.test(decl.value)) {
          add('MC3', file, decl, `Amplada editorial restringida per --sdp-measure: ${decl.parent.selector || '(regla niada)'}`, { selector: decl.parent.selector || null });
        }
      });
    } catch (error) { add('MC0', file, null, `CSS no analitzable: ${error.reason || error.message}`); }
  }
  phase('cssMs', checkpoint);
  return { ok: issues.length === 0, issues: issues.sort(orderIssues), exemptions: uniqueExemptions(exemptions),
    inventory: exceptions, stats: { files: Object.keys(fonts).length, parsedModules: modules.size, relevantClosure: canHaveH2.size, bodyClosure: canRenderContent.size, pageRoots: rootFiles.length, ...phases, durationMs: Math.round((performance.now() - started) * 100) / 100 } };
}

export function auditaMaquetacio(arrel = process.cwd()) {
  const started = performance.now(), fonts = {};
  let bytes = 0;
  for (const file of filesAt(arrel, 'src')) if ((FONT.test(file) && !PROVA.test(file)) || file.endsWith('.css')) {
    const buffer = fs.readFileSync(path.join(arrel, file));
    bytes += buffer.length;
    fonts[file] = buffer.toString('utf8');
  }
  const readMs = performance.now() - started, result = auditaFonts(fonts);
  Object.assign(result.stats, { workers: 0, terminatedWorkers: 0, discovery: 'demand', inventoryReadFiles: Object.keys(fonts).length,
    inventoryReadBytes: bytes, actualReads: Object.keys(fonts).length, actualReadBytes: bytes,
    readMs: Math.round(readMs * 100) / 100, durationMs: Math.round((performance.now() - started) * 100) / 100 });
  return result;
}

const ownedBy = (files, count) => {
  const parts = Array.from({ length: count }, () => []);
  files.forEach((file, index) => parts[index % count].push(file));
  return parts;
};

/** Mateix cens, amb lectura/índex/AST repartits i sense cap cache persistent. */
export async function auditaMaquetacioConcurrent(arrel = process.cwd(), { workers = 4, timeoutMs = 30000 } = {}) {
  if (!Number.isInteger(workers) || workers < 1 || workers > 4) throw new Error('Calen entre 1 i 4 workers.');
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('Timeout de worker invàlid.');
  const started = performance.now(), deadline = started + timeoutMs;
  const files = filesAt(arrel, 'src').filter(file => (FONT.test(file) && !PROVA.test(file)) || file.endsWith('.css'));
  if (!files.length) return { ...auditaFonts({}), stats: { files: 0, workers: 0, parsedModules: 0, pageRoots: 0, inventoryReadFiles: 0, inventoryReadBytes: 0, durationMs: performance.now() - started } };
  const count = Math.min(workers, files.length), parts = ownedBy(files, count), pool = [];
  const rootWorkerCount = count === 4 ? 3 : count, documentWorker = count - 1;
  let sequence = 0, answer, failed, terminatedWorkers = 0;
  const allIssues = [], allExemptions = [];
  try {
    for (let index = 0; index < count; index++) {
      const thread = new Worker(new URL(import.meta.url), { workerData: { canonicalGate: true, arrel, files, owned: parts[index] } });
      const pending = new Map(), exited = new Promise(resolve => thread.once('exit', resolve));
      const rejectAll = error => { for (const job of pending.values()) { clearTimeout(job.timer); job.reject(error); } pending.clear(); };
      thread.on('error', rejectAll);
      thread.on('exit', code => { if (pending.size) rejectAll(new Error(`Worker finalitzat abans de respondre (${code}).`)); });
      thread.on('message', packet => {
        const job = pending.get(packet.id);
        if (!job) return;
        clearTimeout(job.timer); pending.delete(packet.id);
        if (packet.error) job.reject(new Error(packet.error)); else job.resolve(packet.result);
      });
      pool.push({ thread, exited, cancel: rejectAll, request(command, payload = {}) {
        const remainingMs = deadline - performance.now();
        if (remainingMs <= 0) return Promise.reject(new Error(`Timeout global abans de ${command}.`));
        return new Promise((resolve, reject) => {
          const id = ++sequence;
          const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timeout del worker en ${command}.`)); }, remainingMs);
          pending.set(id, { resolve, reject, timer });
          try { thread.postMessage({ id, command, ...payload }); }
          catch (error) { clearTimeout(timer); pending.delete(id); reject(error); }
        });
      } });
    }
    const indexed = await Promise.all(pool.map(worker => worker.request('prepare')));
    const lexical = new Map(), parents = new Map();
    for (const { prepared } of indexed) {
      for (const [file, flags] of prepared.lexical) lexical.set(file, flags);
      for (const [file, names] of prepared.parents) {
        if (!parents.has(file)) parents.set(file, new Set());
        for (const name of names) parents.get(file).add(name);
      }
    }
    const frontier = demandFrontier(lexical);
    const plan = { frontier, lexical: [...lexical].map(([file, flags]) => [file, { page: flags.page, relevant: flags.relevant, body: flags.body, tag: flags.tag, jsx: flags.jsx, spread: flags.spread, children: flags.children, cssMeasure: flags.cssMeasure }]), parents: [...parents].map(([file, names]) => [file, [...names]]) };
    const possible = new Set(files.filter(file => lexical.get(file)?.relevant)), queue = [...possible];
    for (let index = 0; index < queue.length; index++) {
      if (queue[index] === PAGE_MODULE) continue;
      for (const parent of parents.get(queue[index]) || []) if (!possible.has(parent)) { possible.add(parent); queue.push(parent); }
    }
    const roots = new Set(frontier.roots);
    const sizes = new Map(indexed.flatMap(result => result.reads.sizes)), rootOwners = new Map(), rootWeights = new Array(rootWorkerCount).fill(0);
    const documents = files.filter(file => /(?:^|\/)pageContent[^/]*\.js$/.test(file) || lexical.get(file)?.cssMeasure);
    let documentFailure;
    const documentStart = performance.now();
    let documentsElapsedMs;
    const documentTask = pool[documentWorker].request('bodies', { plan, roots: [], documents, wrappers: { ids: ['UniversalPage'], names: ['UniversalPage'], files: [] } }).then(result => { documentsElapsedMs = performance.now() - documentStart; return result; }).catch(error => { documentFailure = error; return null; });
    const rootParts = () => {
      const result = Array.from({ length: rootWorkerCount }, () => []);
      for (const file of [...roots].filter(file => !rootOwners.has(file)).sort((a, b) => (sizes.get(b) || 0) - (sizes.get(a) || 0) || a.localeCompare(b))) {
        const owner = rootWeights.indexOf(Math.min(...rootWeights));
        rootOwners.set(file, owner); rootWeights[owner] += (sizes.get(file) || 0) + 12000;
      }
      for (const file of roots) result[rootOwners.get(file)].push(file);
      return result;
    };
    const indexMs = performance.now() - started, bodyStart = performance.now(), partitions = rootParts();
    const rootResults = await Promise.all(pool.slice(0, rootWorkerCount).map((worker, index) => worker.request('bodies', { plan, roots: partitions[index], documents: [], wrappers: { auditedRoots: [...roots] } })));
    const documentResult = await documentTask;
    if (documentFailure) throw documentFailure;
    for (const result of [...rootResults, documentResult]) { allIssues.push(...result.issues); allExemptions.push(...result.exemptions); }
    const results = documentWorker >= rootWorkerCount ? [...rootResults, documentResult] : rootResults;
    const issues = [...new Map(allIssues.map(issue => [JSON.stringify(issue), issue])).values()].sort(orderIssues);
    answer = { ok: issues.length === 0, issues, exemptions: uniqueExemptions(allExemptions), inventory: EXCEPCIONS,
      stats: { files: files.length, parsedModules: results.reduce((sum, result) => sum + result.stats.parsedModules, 0),
        pageRoots: roots.size, relevantClosure: possible.size, workers: count, rootWorkers: rootWorkerCount, dedicatedDocumentWorker: documentWorker >= rootWorkerCount, discovery: 'demand', wrapperRounds: 0, bodyJobs: rootWorkerCount + 1, documentFiles: documents.length, stolenJobs: 0,
        inventoryReadFiles: indexed.reduce((sum, result) => sum + result.reads.inventoryFiles, 0),
        inventoryReadBytes: indexed.reduce((sum, result) => sum + result.reads.inventoryBytes, 0),
        actualReads: results.reduce((sum, result) => sum + result.reads.files, 0), actualReadBytes: results.reduce((sum, result) => sum + result.reads.bytes, 0),
        indexMs: Math.round(indexMs * 100) / 100, wrappersMs: 0, childrenAndDocumentsMs: Math.round((performance.now() - bodyStart) * 100) / 100, documentWorkerMs: Math.round(documentResult.stats.durationMs * 100) / 100, documentsElapsedMs: Math.round(documentsElapsedMs * 100) / 100 } };
  } catch (error) { failed = error; }
  finally {
    for (const worker of pool) {
      worker.cancel(new Error('Pool tancat.'));
      // La via cooperativa també allibera un worker ociós si terminate rebutja.
      try { worker.thread.postMessage({ id: 0, command: 'shutdown' }); } catch { /* Es comprova igualment l'eixida real. */ }
    }
    const outcomes = await Promise.allSettled(pool.map(worker => Promise.resolve().then(() => worker.thread.terminate())));
    const rejected = outcomes.some(result => result.status === 'rejected');
    if (rejected) {
      let timer;
      try { await Promise.race([Promise.all(pool.map(worker => worker.exited)), new Promise(resolve => { timer = setTimeout(resolve, 1000); })]); }
      finally { clearTimeout(timer); }
    }
    terminatedWorkers = pool.filter(worker => worker.thread.threadId === -1).length;
    if (rejected || terminatedWorkers !== pool.length) failed ||= new Error('No s’ha pogut confirmar el tancament de tots els workers.');
  }

  if (failed) { failed.terminatedWorkers = terminatedWorkers; throw failed; }
  answer.stats.terminatedWorkers = terminatedWorkers;
  answer.stats.durationMs = Math.round((performance.now() - started) * 100) / 100;
  return answer;
}

if (!isMainThread && workerData?.canonicalGate) {
  const fonts = {}, loaded = new Map(), sizes = new Map(), reuse = {};
  let bytes = 0;
  for (const file of workerData.files) Object.defineProperty(fonts, file, { enumerable: true, get() {
    if (!loaded.has(file)) {
      const absolute = path.join(workerData.arrel, file), text = fs.readFileSync(absolute, 'utf8');
      const size = text.includes('\uFFFD') ? fs.statSync(absolute).size : Buffer.byteLength(text);
      bytes += size; sizes.set(file, size);
      loaded.set(file, text);
    }
    return loaded.get(file);
  } });
  let inventoryBytes = 0, globalPlan = null;
  parentPort.on('message', packet => {
    if (packet.command === 'shutdown') { parentPort.close(); return; }
    try {
      let result;
      if (packet.command === 'prepare') {
        result = auditaFonts(fonts, { mode: 'prepare', lexicalFiles: workerData.owned, reuse });
        inventoryBytes = bytes;
      } else {
        if (packet.plan) globalPlan = packet.plan;
        if (!globalPlan) throw new Error('Falta el graf global preparat.');
        result = auditaFonts(fonts, { mode: packet.command === 'discover' ? 'discover' : 'bodies', prepared: globalPlan,
        roots: packet.roots, knownWrappers: packet.wrappers,  documentFiles: packet.documents || workerData.owned, reuse });
      }
      result.reads = { files: loaded.size, bytes, inventoryFiles: workerData.owned.length, inventoryBytes, ...(packet.command === 'prepare' ? { sizes: [...sizes] } : {}) };
      parentPort.postMessage({ id: packet.id, result });
    } catch (error) { parentPort.postMessage({ id: packet.id, error: error.stack || String(error) }); }
  });
} else if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(path.resolve(process.argv[1]))).href) {
  /* v1.2.23 · costura Porta Arrel A4 (ordre del Mestre 261123) · mateixa guarda d'entrada directa (camí real de argv[1]
   * contra import.meta.url), escrita en la forma que la Porta Arrel reconeix; abans comparava amb fileURLToPath. */
  const args = process.argv.slice(2), rootArg = args.find(a => a.startsWith('--arrel='));
  const root = rootArg?.slice(8) || (args.includes('--arrel') ? args[args.indexOf('--arrel') + 1] : process.cwd());
  const started = performance.now();
  let result;
  try { result = auditaMaquetacio(path.resolve(root)); }
  catch (error) { result = { ok: false, issues: [{ code: 'MC0', file: 'tooling/gates/tractor-maquetacio-canonica.mjs', line: 1, column: 1, message: `Anàlisi interrompuda: ${error.message}` }], exemptions: [], inventory: EXCEPCIONS, stats: { terminatedWorkers: error.terminatedWorkers || 0 } }; }
  result.stats.totalMs = Math.round((performance.now() - started) * 100) / 100;
  if (args.includes('--json')) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else {
    for (const issue of result.issues) process.stdout.write(`${issue.file}:${issue.line}:${issue.column} [${issue.code}] ${issue.message}\n`);
    process.stdout.write(`IDEA-319: ${result.issues.length} infraccions, ${result.exemptions.length} excepcions auditades; ${result.stats.totalMs} ms\n`);
  }
  process.exitCode = result.ok ? 0 : 1;
}
