#!/usr/bin/env node
/** R21.6: a bounded static contract, not a runtime/remote health certificate. */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from '@babel/parser';

const ROOTS = ['src/sections/', 'src/apps/'];
const HEAD = ['author', 'location', 'date', 'dateTime'];
const NON_FEED = new Set(['action', 'onboarding']);
const IAIA = '11111111-1a1a-0000-0000-000000000000';
const FUNCTIONS = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression', 'ObjectMethod']);
const META = new Set(['loc', 'start', 'end', 'extra', 'comments', 'tokens', 'errors']);
const isFunction = n => Boolean(n && FUNCTIONS.has(n.type));
const keyName = n => n?.type === 'Identifier' || n?.type === 'JSXIdentifier' ? n.name : n?.type === 'StringLiteral' ? n.value : null;
function children(n) {
  const out = [];
  for (const [k, value] of Object.entries(n || {})) {
    if (META.has(k)) continue;
    if (Array.isArray(value)) out.push(...value.filter(v => v && typeof v.type === 'string'));
    else if (value && typeof value.type === 'string') out.push(value);
  }
  return out;
}
function walk(n, fn, parent = null) { if (!n) return; fn(n, parent); for (const c of children(n)) walk(c, fn, n); }
const empty = (unknown = false) => ({ fields: new Map(), unknown });
function merge(a, b) {
  const fields = b.unknown ? new Map() : new Map(a.fields);
  for (const [k, v] of b.fields) fields.set(k, v);
  return { fields, unknown: a.unknown || b.unknown };
}
function intersection(shapes) {
  if (!shapes.length) return empty(true);
  const fields = new Map(shapes[0].fields);
  for (const shape of shapes.slice(1)) for (const k of fields.keys()) if (!shape.fields.has(k)) fields.delete(k);
  for (const key of fields.keys()) fields.set(key, { alternatives: shapes.flatMap(s => s.fields.get(key).alternatives || [s.fields.get(key)]) });
  return { fields, unknown: shapes.some(s => s.unknown) };
}
function alwaysExits(n) {
  if (!n) return false;
  if (['ReturnStatement', 'ThrowStatement'].includes(n.type)) return true;
  if (n.type === 'BlockStatement') return n.body.some(alwaysExits);
  if (n.type === 'IfStatement') return alwaysExits(n.consequent) && alwaysExits(n.alternate);
  if (n.type === 'TryStatement') return alwaysExits(n.finalizer) || alwaysExits(n.block) && (!n.handler || alwaysExits(n.handler.body));
  // Loops/switches are deliberately not inferred to terminate from a token.
  return false;
}
function returns(fn) {
  if (fn.type === 'ArrowFunctionExpression' && fn.body.type !== 'BlockStatement') return [fn.body];
  const out = [];
  const visit = n => {
    if (!n || n !== fn && isFunction(n)) return;
    if (n.type === 'ReturnStatement') { out.push(n.argument); return; }
    for (const c of children(n)) visit(c);
  };
  visit(fn); return out;
}
function literal(n) {
  if (n?.type === 'StringLiteral' || n?.type === 'BooleanLiteral' || n?.type === 'NumericLiteral') return n.value;
  if (n?.type === 'NullLiteral') return null;
  if (n?.type === 'TemplateLiteral' && !n.expressions.length) return n.quasis[0].value.cooked;
  if (n?.type === 'Identifier' && n.name === 'undefined') return undefined;
  if (n?.type === 'BinaryExpression' && n.operator === '+') {
    const a = literal(n.left), b = literal(n.right);
    if (typeof a === 'string' && typeof b === 'string') return a + b;
  }
  return Symbol.for('unknown');
}

/** All module loads are supplied; fixture mode never consults the filesystem. */
export function analyseSources(input, { load = null } = {}) {
  const sources = new Map(Object.entries(input));
  const models = new Map(), diagnostics = [], seenIssues = new Set(), coverage = [];
  const issue = (code, file, node, message) => {
    const entry = { code, file, line: node?.loc?.start.line || 1, column: (node?.loc?.start.column || 0) + 1, message };
    const id = `${code}:${file}:${entry.line}:${entry.column}:${message}`;
    if (!seenIssues.has(id)) { diagnostics.push(entry); seenIssues.add(id); }
  };
  function source(file) {
    if (!sources.has(file) && load) {
      try { const text = load(file); if (typeof text === 'string') sources.set(file, text); }
      catch { issue('LU00', file, null, 'No es pot llegir un mòdul requerit; no es declara cobertura.'); }
    }
    return sources.get(file);
  }
  function module(file) {
    if (typeof file !== 'string') return null;
    if (models.has(file)) return models.get(file);
    const text = source(file);
    if (text === undefined) return null;
    const m = { file, text, ast: null, scopes: new WeakMap(), parents: new WeakMap(), imports: new Map(), exports: new Map(), stars: [] };
    models.set(file, m);
    try { m.ast = parse(text, { sourceType: 'unambiguous', plugins: ['jsx', ...(/\.tsx?$/.test(file) ? ['typescript'] : [])], errorRecovery: false }); }
    catch (e) { issue('LU00', file, { loc: { start: e.loc } }, 'JavaScript/JSX no es pot analitzar; la porta falla.'); return m; }
    const global = { parent: null, bindings: new Map() };
    function bindPattern(n, value, scope) {
      if (n?.type === 'Identifier') scope.bindings.set(n.name, value);
      else if (n?.type === 'AssignmentPattern') bindPattern(n.left, n.right, scope);
      else if (n?.type === 'ObjectPattern') for (const p of n.properties) bindPattern(p.value || p.argument, null, scope);
      else if (n?.type === 'ArrayPattern') for (const p of n.elements) bindPattern(p, null, scope);
    }
    const visit = (n, parent, scope) => {
      if (!n) return;
      m.parents.set(n, parent);
      if (n.type === 'FunctionDeclaration' && n.id) scope.bindings.set(n.id.name, n);
      if (isFunction(n) || n.type === 'BlockStatement') {
        scope = { parent: scope, bindings: new Map() };
        if (isFunction(n)) for (const param of n.params || []) bindPattern(param, null, scope);
      }
      m.scopes.set(n, scope);
      if (n.type === 'VariableDeclarator') bindPattern(n.id, n.init, scope);
      if (n.type === 'ImportDeclaration') for (const spec of n.specifiers) {
        m.imports.set(spec.local.name, { source: n.source.value, name: spec.type === 'ImportDefaultSpecifier' ? 'default' : spec.type === 'ImportNamespaceSpecifier' ? '*' : keyName(spec.imported) });
      }
      if (n.type === 'ExportNamedDeclaration') {
        if (n.declaration?.type === 'FunctionDeclaration') m.exports.set(n.declaration.id.name, { node: n.declaration });
        for (const d of n.declaration?.declarations || []) if (d.id.type === 'Identifier') m.exports.set(d.id.name, { node: d.init });
        for (const spec of n.specifiers) m.exports.set(keyName(spec.exported), n.source ? { source: n.source.value, name: keyName(spec.local) } : { local: keyName(spec.local), at: n });
      }
      if (n.type === 'ExportDefaultDeclaration') m.exports.set('default', { node: n.declaration });
      if (n.type === 'ExportAllDeclaration') m.stars.push(n.source.value);
      for (const c of children(n)) visit(c, n, scope);
    };
    visit(m.ast, null, global); return m;
  }
  function resolveFile(m, spec) {
    if (!spec?.startsWith('.')) return null;
    const stem = path.posix.normalize(path.posix.join(path.posix.dirname(m.file), spec));
    if (stem.startsWith('../') || path.posix.isAbsolute(stem)) return null;
    for (const file of [stem, ...['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx'].map(ext => stem + ext), `${stem}/index.js`, `${stem}/index.jsx`]) if (source(file) !== undefined) return file;
    return null;
  }
  function exported(m, name, chain) {
    if (!m || chain.size > 24) return null;
    const tag = `${m.file}:export:${name}`;
    if (chain.has(tag)) return null;
    const next = new Set([...chain, tag]), entry = m.exports.get(name);
    if (entry?.node) return resolve(entry.node, m, next);
    if (entry?.local) return resolve({ type: 'Identifier', name: entry.local, _at: entry.at }, m, next);
    if (entry?.source) return exported(module(resolveFile(m, entry.source)), entry.name, next);
    for (const spec of m.stars) { const found = exported(module(resolveFile(m, spec)), name, next); if (found) return found; }
    return null;
  }
  function resolve(n, m, chain = new Set()) {
    if (!n || !m || chain.size > 24) return null;
    if (n.type !== 'Identifier') return { node: n, module: m };
    const tag = `${m.file}:${n.start ?? n.name}:id:${n.name}`;
    if (chain.has(tag)) return null;
    const next = new Set([...chain, tag]);
    let scope = m.scopes.get(n._at || n);
    while (scope) {
      if (scope.bindings.has(n.name)) {
        const bound = scope.bindings.get(n.name);
        return bound ? resolve(bound, m, next) : { node: n, module: m };
      }
      scope = scope.parent;
    }
    const entry = m.imports.get(n.name);
    if (entry && entry.name !== '*') return exported(module(resolveFile(m, entry.source)), entry.name, next);
    return { node: n, module: m };
  }
  function shape(n, m, chain = new Set()) {
    if (!n) return empty();
    const tag = `${m.file}:${n.start ?? ''}:${n.type}`;
    if (chain.has(tag) || chain.size > 32) return empty(true);
    const next = new Set([...chain, tag]);
    if (n.type === 'Identifier') {
      const resolved = resolve(n, m);
      return !resolved || resolved.node === n ? empty(true) : shape(resolved.node, resolved.module, next);
    }
    if (n.type === 'ObjectExpression') {
      let out = empty();
      for (const p of n.properties) {
        if (p.type === 'SpreadElement') out = merge(out, shape(p.argument, m, next));
        else {
          const k = p.computed ? literal(p.key) : keyName(p.key);
          if (typeof k !== 'string') out = merge(out, empty(true));
          else out.fields.set(k, { node: p.value || p, module: m });
        }
      }
      return out;
    }
    if (n.type === 'ConditionalExpression') return intersection([shape(n.consequent, m, next), shape(n.alternate, m, next)]);
    if (n.type === 'LogicalExpression') return intersection([shape(n.left, m, next), shape(n.right, m, next)]);
    if (n.type === 'NullLiteral' || n.type === 'BooleanLiteral' || n.type === 'StringLiteral' || n.type === 'NumericLiteral') return empty();
    if (n.type === 'CallExpression') {
      if (n.callee.type === 'MemberExpression' && n.callee.object.name === 'Object') {
        if (['freeze', 'seal'].includes(keyName(n.callee.property))) return shape(n.arguments[0], m, next);
        if (keyName(n.callee.property) === 'assign') return n.arguments.reduce((out, arg) => merge(out, shape(arg, m, next)), empty());
      }
      const callee = resolve(n.callee, m);
      if (callee && isFunction(callee.node)) {
        const paths = returns(callee.node).map(expr => shape(expr, callee.module, next));
        if (callee.node.body.type === 'BlockStatement' && !alwaysExits(callee.node.body)) paths.push(empty(true));
        return intersection(paths);
      }
    }
    return empty(true);
  }
  function jsxName(n, m, chain = new Set()) {
    if (n?.type === 'JSXMemberExpression') {
      const entry = m.imports.get(n.object.name);
      return entry?.name === '*' ? n.property.name : `${jsxName(n.object, m)}.${n.property.name}`;
    }
    const name = n?.name;
    if (!name || chain.has(name)) return name;
    const imported = m.imports.get(name);
    if (imported && imported.name !== 'default') return imported.name;
    const ref = { type: 'Identifier', name, _at: n };
    const resolved = resolve(ref, m);
    if (resolved?.node.type === 'MemberExpression' && resolved.node.object.type === 'Identifier' && m.imports.get(resolved.node.object.name)?.name === '*') return keyName(resolved.node.property);
    if (resolved?.node.type === 'ConditionalExpression') {
      for (const value of [resolved.node.consequent, resolved.node.alternate]) if (jsxName({ ...value, type: value.type === 'Identifier' ? 'JSXIdentifier' : value.type }, resolved.module, new Set([...chain, name])) === 'UniversalCard') return 'UniversalCard';
    }
    if (resolved?.node.type === 'CallExpression' && resolved.node.arguments.length) {
      const callee = resolved.node.callee, local = callee.type === 'Identifier' ? m.imports.get(callee.name)?.name || callee.name : keyName(callee.property);
      if (['memo', 'forwardRef'].includes(local)) {
        const value = resolved.node.arguments[0];
        if (value.type === 'Identifier' && jsxName({ ...value, type: 'JSXIdentifier' }, resolved.module, new Set([...chain, name])) === 'UniversalCard') return 'UniversalCard';
      }
    }
    if (resolved?.node.type === 'Identifier' && resolved.node.name !== name) return jsxName({ ...resolved.node, type: 'JSXIdentifier' }, resolved.module, new Set([...chain, name]));
    return imported?.source.endsWith('/UniversalCard.jsx') ? 'UniversalCard' : name;
  }
  function attributes(opening, m) {
    let out = empty();
    for (const a of opening.attributes) {
      if (a.type === 'JSXSpreadAttribute') out = merge(out, shape(a.argument, m));
      else if (a.type === 'JSXAttribute') out.fields.set(keyName(a.name), { node: a.value?.type === 'JSXExpressionContainer' ? a.value.expression : a.value || { type: 'BooleanLiteral', value: true }, module: m });
    }
    return out;
  }
  function possibleValues(value, chain = new Set()) {
    if (!value) return [Symbol.for('unknown')];
    if (value.alternatives) return value.alternatives.flatMap(v => possibleValues(v, chain));
    const ref = resolve(value.node, value.module), n = ref?.node || value.node, m = ref?.module || value.module;
    const tag = `${m.file}:${n?.type}:${n?.start}`;
    if (chain.has(tag) || chain.size > 24) return [Symbol.for('unknown')];
    const next = new Set([...chain, tag]);
    if (n?.type === 'ConditionalExpression') return [n.consequent, n.alternate].flatMap(node => possibleValues({ node, module: m }, next));
    if (n?.type === 'LogicalExpression') {
      const a = possibleValues({ node: n.left, module: m }, next), b = possibleValues({ node: n.right, module: m }, next);
      if (n.operator === '||') return [...a.filter(v => v === Symbol.for('unknown') || Boolean(v)), ...b];
      if (n.operator === '??') return [...a.filter(v => v !== null && v !== undefined), ...b];
      return [...a.filter(v => v === Symbol.for('unknown') || !v), ...b];
    }
    return [literal(n)];
  }
  function knownValue(value) {
    const values = possibleValues(value);
    return values.every(v => v === values[0]) ? values[0] : Symbol.for('unknown');
  }
  const valuesOf = value => possibleValues(value).filter(v => v !== Symbol.for('unknown'));
  function classTokens(value) {
    const out = valuesOf(value).flatMap(tokensOf);
    const ref = value?.node && resolve(value.node, value.module), node = ref?.node || value?.node;
    if (node?.type === 'TemplateLiteral') out.push(...node.quasis.flatMap(q => tokensOf(q.value.cooked)));
    return out;
  }
  const tokensOf = value => typeof value === 'string' ? value.split(/\s+/).filter(Boolean) : [];
  function isDemo(n, m) {
    // Exhibits are explicitly composed with the canonical specimen wrapper,
    // not exempted by directory or by comments. They remain in the census.
    if (!m.file.startsWith('src/sections/disseny/')) return false;
    for (let p = m.parents.get(n); p; p = m.parents.get(p)) {
      if (p.type !== 'JSXElement' || jsxName(p.openingElement.name, m) !== 'Especimen' || p.openingElement.name.type !== 'JSXIdentifier') continue;
      const bound = resolve({ type: 'Identifier', name: p.openingElement.name.name, _at: p.openingElement.name }, m);
      if (bound?.module.file === 'src/sections/disseny/cataleg/Especimen.jsx' && isFunction(bound.node)) return true;
    }
    return false;
  }
  function inspectCard(n, m, props = attributes(n, m)) {
    const variants = possibleValues(props.fields.get('variant'));
    const nonFeed = variants.length && variants.every(v => NON_FEED.has(v));
    const role = nonFeed ? variants.includes('onboarding') ? 'onboarding' : 'action' : isDemo(n, m) ? 'specimen' : 'content';
    if (role !== 'content') return role;
    const missing = HEAD.filter(k => !props.fields.has(k));
    const blank = HEAD.filter(k => k !== 'dateTime' && props.fields.has(k) && possibleValues(props.fields.get(k)).some(v => v !== Symbol.for('unknown') && (typeof v !== 'string' || !v.trim())));
    if (missing.length || blank.length) issue('LU02', m.file, n, `UniversalCard de contingut sense contracte complet: ${[...missing.map(k => `${k} absent/no resolt`), ...blank.map(k => `${k} buit literal`)].join(', ')}. Usar la font editorial compartida; no inventar dates.`);
    return role;
  }
  function inspect(m) {
    const record = { file: m.file, cards: 0, grids: 0, roles: { content: 0, action: 0, onboarding: 0, specimen: 0 }, jsx: false };
    coverage.push(record);
    if (!m.ast) return;
    walk(m.ast, n => {
      if (n.type !== 'JSXOpeningElement') return;
      record.jsx = true;
      const name = jsxName(n.name, m), props = attributes(n, m), classes = classTokens(props.fields.get('className'));
      if (classes.includes('feed-grid')) issue('LU01', m.file, n, 'Classe feed-grid morta: usar sdp-card-grid o GraellaTargetes.');
      if (classes.includes('sdp-card-grid') || name === 'GraellaTargetes') record.grids++;
      if (name !== 'UniversalCard') return;
      record.cards++;
      const role = inspectCard(n, m, props);
      record.roles[role]++;
    });
  }
  // Every source module is scanned, even a route with no card or grid.
  for (const file of [...sources.keys()].filter(n => ROOTS.some(root => n.startsWith(root))).sort()) inspect(module(file));

  // Trace repeated card/grid renderers, including local helper functions and
  // relative imported wrappers, so a primary button cannot hide in a helper.
  const traced = new Set();
  function trace(n, m, grid = false, repeated = false, depth = 0) {
    if (!n || !m?.ast || depth > 24) return;
    const tag = `${m.file}:${n.type}:${n.start}:${grid}:${repeated}`;
    if (traced.has(tag)) return; traced.add(tag);
    if (n.type === 'JSXElement') {
      const opening = n.openingElement, name = jsxName(opening.name, m), props = attributes(opening, m);
      const classes = classTokens(props.fields.get('className'));
      const ownGrid = classes.includes('sdp-card-grid') || name === 'GraellaTargetes';
      const inGrid = grid || ownGrid;
      const binding = opening.name.type === 'JSXIdentifier' ? resolve({ type: 'Identifier', name: opening.name.name, _at: opening.name }, m) : null;
      let defaultVariety = null;
      const params = binding?.node?.params?.[0];
      const pattern = params?.type === 'AssignmentPattern' ? params.left : params;
      const param = pattern?.type === 'ObjectPattern' && pattern.properties.find(p => keyName(p.key) === 'varietat');
      if (param?.value?.type === 'AssignmentPattern') defaultVariety = literal(param.value.right);
      const variety = props.fields.has('varietat') ? knownValue(props.fields.get('varietat')) : defaultVariety;
      const porta = props.fields.get('porta');
      const nestedVariety = porta ? knownValue({ alternatives: (porta.alternatives || [porta]).map(v => shape(v.node, v.module).fields.get('varietat')) }) : null;
      const primary = variety === 'primari' || nestedVariety === 'primari' && !props.fields.has('varietat') || classes.includes('sdp-boto--primari') || name === 'PortaDePagina' && !props.fields.has('varietat') && !defaultVariety;
      if (inGrid && (repeated || ownGrid) && primary) issue('LU03', m.file, opening, 'Acció primària dins d’una graella repetida; usar acció secundària (PS-07).');
      // Structural wrappers between a real card and its canonical grid break
      // the direct-child CSS contract. Fragments and map/conditional nodes do not.
      if (name === 'UniversalCard' && grid) {
        inspectCard(opening, m, props);
        let parent = m.parents.get(n);
        while (parent) {
          if (parent.type === 'JSXElement') {
            const pn = jsxName(parent.openingElement.name, m), pp = attributes(parent.openingElement, m);
            if (classTokens(pp.fields.get('className')).includes('sdp-card-grid') || pn === 'GraellaTargetes') break;
            if (/^[a-z]/.test(pn || '')) { issue('LU04', m.file, parent.openingElement, 'Embolcall HTML entre UniversalCard i graella: la targeta ha de ser filla directa.'); break; }
          }
          parent = m.parents.get(parent);
        }
      }
      if (/^[A-Z]/.test(name || '') && name !== 'UniversalCard' && !['GraellaTargetes', 'Especimen'].includes(name) && inGrid) {
        // Validate the public variant/default of canonical button primitives;
        // traversing their internal conditional CSS without caller bindings
        // would incorrectly classify every explicit secondary as primary.
        const primitive = binding && /src\/components\/PedraSeca\/(?:atoms\/Boto|organismes\/PortesTargeta)\.jsx$/.test(binding.module.file);
        if (!primitive && binding && isFunction(binding.node)) trace(binding.node, binding.module, true, repeated || ownGrid, depth + 1);
      }
      for (const c of children(n)) trace(c, m, inGrid, repeated || ownGrid, depth + 1);
      return;
    }
    if (n.type === 'CallExpression' && grid) {
      if (n.callee.type === 'MemberExpression' && ['map', 'flatMap'].includes(keyName(n.callee.property))) {
        for (const arg of n.arguments) {
          const ref = resolve(arg, m);
          if (ref) trace(ref.node, ref.module, true, true, depth + 1);
        }
      } else {
        const ref = resolve(n.callee, m);
        if (ref && isFunction(ref.node)) trace(ref.node, ref.module, true, repeated, depth + 1);
      }
    }
    for (const c of children(n)) trace(c, m, grid, repeated, depth + 1);
  }
  for (const item of coverage) { const m = module(item.file); if (m.ast) trace(m.ast, m); }

  const catalogue = module('src/data/agentsSeed.js');
  if (catalogue?.ast) {
    const legacyModule = module('src/data/catalegAgents.js');
    let legacy = exported(legacyModule, 'IDS_FICCIO_LEGACY', new Set());
    while (legacy?.node.type === 'CallExpression' && ['freeze', 'seal'].includes(keyName(legacy.node.callee.property))) legacy = { node: legacy.node.arguments[0], module: legacy.module };
    const legacyIds = new Set((legacy?.node.type === 'ArrayExpression' ? legacy.node.elements : []).map(literal).filter(v => typeof v === 'string'));
    const entry = exported(catalogue, 'AGENTS_MAP', new Set());
    const map = entry ? shape(entry.node, entry.module) : empty(true);
    if (map.unknown || !map.fields.size) issue('LU05', catalogue.file, entry?.node, 'AGENTS_MAP no és resoluble estàticament; no es pot acreditar la purga.');
    for (const value of map.fields.values()) {
      const card = shape(value.node, value.module), id = knownValue(card.fields.get('id')), type = knownValue(card.fields.get('type'));
      if (typeof id === 'string' && legacyIds.has(id.trim().toLowerCase())) issue('LU05', catalogue.file, value.node, 'Identitat fictícia històrica reintroduïda en AGENTS_MAP, encara que haja canviat de tipus.');
      if (['AI', 'ANIMAL'].includes(typeof type === 'string' ? type.trim().toUpperCase() : '') && id !== IAIA) issue('LU05', catalogue.file, value.node, 'Bot/personatge no canònic en AGENTS_MAP.');
      for (const k of ['systemPrompt', 'albums']) {
        const v = card.fields.get(k);
        if (!v) continue;
        const texts = valuesOf(v).filter(x => typeof x === 'string');
        if (v.node?.type === 'ArrayExpression' || v.node?.type === 'ObjectExpression') walk(v.node, n => { const s = literal(n); if (typeof s === 'string') texts.push(s); });
        if (texts.some(text => ["L'Ull de la IAIA", 'Jutjat de Trellat', "L'Archon", 'El Rebost'].some(name => text.replace(/[’‘]/g, "'").includes(name)))) issue('LU05', catalogue.file, v.node, 'Referència a sub-agent fictici retirat en el catàleg actiu.');
      }
    }
    function projectsCanonical(n, m, depth = 0) {
      if (!n || depth > 16) return false;
      const r = resolve(n, m); n = r?.node || n; m = r?.module || m;
      if (n.type !== 'CallExpression' || n.callee.type !== 'MemberExpression') return false;
      const op = keyName(n.callee.property);
      if (n.callee.object.name === 'Object' && op === 'values') {
        const origin = resolve(n.arguments[0], m);
        return origin?.node === entry?.node && origin?.module === entry?.module;
      }
      if (!['filter', 'map'].includes(op) || !projectsCanonical(n.callee.object, m, depth + 1)) return false;
      const callback = n.arguments[0];
      if (!isFunction(callback) || callback.body.type === 'BlockStatement' || callback.params[0]?.type !== 'Identifier') return false;
      let pure = true;
      walk(callback.body, child => { if (['CallExpression', 'AssignmentExpression', 'UpdateExpression', 'NewExpression', 'AwaitExpression', 'YieldExpression'].includes(child.type)) pure = false; });
      if (!pure) return false;
      if (op === 'filter') return true;
      const output = shape(callback.body, m);
      return ['id', 'type'].every(k => {
        const value = output.fields.get(k);
        return value?.node?.type === 'MemberExpression' && value.node.object.name === callback.params[0].name && keyName(value.node.property) === k;
      });
    }
    const active = exported(catalogue, 'AGENTS', new Set());
    if (active && !projectsCanonical(active.node, active.module)) issue('LU05', catalogue.file, active.node, 'L’export AGENTS no és una projecció acreditada d’AGENTS_MAP; una concatenació o mutació podria reintroduir bots.');
  }
  diagnostics.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.code.localeCompare(b.code));
  return { schema: 'sdp.logica-universal.v1', valid: diagnostics.length === 0, diagnostics, coverage, scannedFiles: coverage.length, consultedModules: [...models.keys()].sort(), limits: ['Static JSX/import/object-shape contract only; not proof of runtime values, rendering, remote deployment, authorization or CRUD.', 'Dynamic spreads or incomplete helper branches fail the header contract instead of being silently approved.', 'Explicit action/onboarding variants and canonical component specimens are classified, retained in the census, and are not directory/feed cards.'] };
}

export function scanRepository(root) {
  const canonical = fs.realpathSync(root), sources = {};
  const read = relative => {
    const absolute = path.join(canonical, relative);
    const stat = fs.lstatSync(absolute);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 4 * 1024 * 1024) throw new Error('non-regular or oversized source');
    return fs.readFileSync(absolute, 'utf8');
  };
  function collect(relative) {
    for (const entry of fs.readdirSync(path.join(canonical, relative), { withFileTypes: true })) {
      const name = path.posix.join(relative, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Symlink no admés en el cens: ${name}`);
      if (entry.isDirectory()) collect(name);
      else if (/\.(?:[cm]?js|jsx|tsx?)$/.test(name) && !/\.(?:test|spec)\.(?:[cm]?js|jsx|tsx?)$/.test(name)) sources[name] = read(name);
    }
  }
  for (const dir of ROOTS) collect(dir.slice(0, -1));
  if (fs.existsSync(path.join(canonical, 'src/data/agentsSeed.js'))) sources['src/data/agentsSeed.js'] = read('src/data/agentsSeed.js');
  return analyseSources(sources, { load: relative => fs.existsSync(path.join(canonical, relative)) && fs.statSync(path.join(canonical, relative)).isFile() ? read(relative) : undefined });
}
export function main(args = process.argv.slice(2)) {
  try {
    let root = process.cwd(), json = false;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--json') json = true;
      else if (args[i] === '--root' && args[i + 1]) root = args[++i];
      else throw new Error('Ús: porta-logica-universal.mjs [--root DIRECTORI] [--json]');
    }
    const result = scanRepository(root);
    if (json) process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    else {
      for (const d of result.diagnostics) process.stdout.write(`${d.file}:${d.line}:${d.column} [${d.code}] ${d.message}\n`);
      process.stdout.write(`${result.valid ? 'PASS' : 'FAIL'} · lògica universal · ${result.scannedFiles} fonts · ${result.diagnostics.length} incidències\n`);
    }
    return result.valid ? 0 : 1;
  } catch (error) { process.stderr.write(`porta-logica-universal: ${error.message}\n`); return 2; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) process.exitCode = main();
