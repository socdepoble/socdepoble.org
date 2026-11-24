/** Static import promises, including literal Node --eval programs. Never executes a source. */
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from '@babel/parser';

const UNKNOWN = Symbol('unknown');
const scopes = new Set(['Program', 'BlockStatement']);
function children(node) {
  return Object.entries(node).filter(([key]) => !['loc', 'comments', 'tokens', 'errors'].includes(key))
    .flatMap(([, value]) => Array.isArray(value) ? value : [value]).filter(value => value?.type);
}
function walk(node, visit, parents = []) {
  if (!node?.type) return;
  visit(node, parents);
  for (const child of children(node)) walk(child, visit, [...parents, node]);
}
/** No arbitrary evaluation: only const literals, native path/URL operations and cwd. */
export function importacionsExecutables(source, { root, file, base = path.dirname(path.join(root, file)), inline = false, depth = 0 } = {}) {
  const imports = [], errors = [];
  const runtimeCwd = inline ? base : root;
  if (depth > 8) return { imports, errors: [{ line: 1, detail: 'Node --eval imbricat fora del límit estàtic' }] };
  let ast;
  try { ast = parse(source, { sourceType: 'unambiguous', plugins: ['jsx'], createImportExpressions: true, attachComment: false }); }
  catch (error) { return { imports, errors: [{ line: error.loc?.line ?? 1, detail: 'JavaScript no analitzable: sintaxi invàlida' }] }; }
  const native = new Map();
  for (const node of ast.program.body) if (node.type === 'ImportDeclaration' && /^node:(?:path|url|child_process)$/.test(node.source.value)) {
    for (const spec of node.specifiers) native.set(spec.local.name, { module: node.source.value, name: spec.imported?.name ?? '*' });
  }
  function binding(name, parents, at) {
    for (let i = parents.length - 1; i >= 0; i--) {
      const scope = parents[i];
      if ((scope.params ?? []).some(param => param.name === name)) return { node: null, parents };
      if (!scopes.has(scope.type)) continue;
      for (const statement of scope.body) {
        const declaration = statement.declaration ?? statement;
        if (declaration.type !== 'VariableDeclaration') continue;
        const found = declaration.declarations.find(item => item.id.name === name);
        if (found) return { node: declaration.kind === 'const' && found.end <= at ? found.init : null, parents: parents.slice(0, i + 1) };
      }
    }
    return null;
  }
  function nativeCall(node, parents, at) {
    if (node?.type === 'Identifier') return binding(node.name, parents, at) ? null : native.get(node.name);
    if (node?.type === 'MemberExpression' && !node.computed && node.object.type === 'Identifier') {
      if (binding(node.object.name, parents, at)) return null;
      const imported = native.get(node.object.name);
      if (imported?.name === '*') return { module: imported.module, name: node.property.name };
    }
    return null;
  }
  function value(node, parents, at, seen = new Set()) {
    if (!node) return UNKNOWN;
    if (node.type === 'StringLiteral') return node.value;
    if (node.type === 'TemplateLiteral' && !node.expressions.length) return node.quasis[0].value.cooked ?? UNKNOWN;
    if (node.type === 'Identifier' && !seen.has(node.name)) {
      const found = binding(node.name, parents, at);
      if (found) return value(found.node, found.parents, at, new Set([...seen, node.name]));
    }
    if (node.type === 'MemberExpression' && !node.computed && node.object.type === 'MetaProperty'
      && node.object.meta.name === 'import' && node.property.name === 'url') return pathToFileURL(inline ? path.join(base, '[eval1]') : path.join(root, file)).href;
    if (node.type === 'CallExpression') {
      if (node.callee.type === 'MemberExpression' && node.callee.object.name === 'process' && node.callee.property.name === 'cwd' && !node.arguments.length) return runtimeCwd;
      const call = nativeCall(node.callee, parents, at), args = node.arguments.map(arg => value(arg, parents, at, seen));
      if (args.some(arg => arg === UNKNOWN)) return UNKNOWN;
      if (call?.module === 'node:path' && ['resolve', 'join', 'dirname'].includes(call.name) && args.every(arg => typeof arg === 'string')) {
        return call.name === 'resolve' ? path.resolve(runtimeCwd, ...args) : path[call.name](...args);
      }
      if (call?.module === 'node:url' && call.name === 'fileURLToPath' && args.length === 1) {
        try { return fileURLToPath(args[0]); } catch { return UNKNOWN; }
      }
    }
    return UNKNOWN;
  }
  function expression(node, parents, at, seen = new Set()) {
    if (node?.type !== 'Identifier') return { node, parents };
    if (seen.has(node.name)) return { node: null, parents };
    const found = binding(node.name, parents, at);
    return found ? expression(found.node, found.parents, at, new Set([...seen, node.name])) : { node: null, parents };
  }
  function mutated(node) {
    if (node?.type !== 'Identifier') return false;
    const names = new Set([node.name]);
    // Const aliases still refer to the same array/object. A write or opaque
    // member call through any of them makes this static snapshot unprovable.
    let changed;
    do {
      changed = false;
      walk(ast.program, candidate => {
        if (candidate.type === 'VariableDeclarator' && candidate.id.type === 'Identifier'
          && candidate.init?.type === 'Identifier' && names.has(candidate.init.name) && !names.has(candidate.id.name)) {
          names.add(candidate.id.name); changed = true;
        }
      });
    } while (changed);
    const owner = target => {
      while (target?.type === 'MemberExpression') target = target.object;
      return target?.type === 'Identifier' && names.has(target.name);
    };
    let found = false;
    walk(ast.program, candidate => {
      if (candidate.type === 'AssignmentExpression' && owner(candidate.left)
        || candidate.type === 'UpdateExpression' && owner(candidate.argument)
        || candidate.type === 'UnaryExpression' && candidate.operator === 'delete' && owner(candidate.argument)
        || candidate.type === 'CallExpression' && candidate.callee.type === 'MemberExpression' && owner(candidate.callee.object)) found = true;
    });
    return found;
  }
  function workingDirectory(node, parents, at) {
    if (!node) return runtimeCwd;
    if (mutated(node)) return UNKNOWN;
    const resolved = expression(node, parents, at);
    if (resolved.node?.type !== 'ObjectExpression') return UNKNOWN;
    let cwd = runtimeCwd;
    for (const item of resolved.node.properties) {
      if (item.type === 'SpreadElement') { cwd = UNKNOWN; continue; }
      const key = item.computed ? value(item.key, resolved.parents, at) : item.key.name ?? item.key.value;
      if (key === UNKNOWN) cwd = UNKNOWN;
      else if (key === 'cwd') cwd = item.type === 'ObjectProperty' ? value(item.value, resolved.parents, at) : UNKNOWN;
    }
    return cwd;
  }
  walk(ast.program, (node, parents) => {
    if (node.type === 'ImportExpression') {
      const spec = value(node.source, parents, node.start);
      if (typeof spec === 'string' && spec.startsWith('.')) imports.push({ spec, base, line: node.loc.start.line, inline });
    }
    if (node.type !== 'CallExpression') return;
    const call = nativeCall(node.callee, parents, node.start);
    if (call?.module !== 'node:child_process' || !['spawn', 'spawnSync', 'execFile', 'execFileSync'].includes(call.name)) return;
    const executable = node.arguments[0];
    const isNode = executable?.type === 'MemberExpression' && !executable.computed
      && executable.object.name === 'process' && executable.property.name === 'execPath'
      || value(executable, parents, node.start) === 'node';
    const resolvedArgs = expression(node.arguments[1], parents, node.start);
    const args = resolvedArgs.node;
    if (!isNode || args?.type !== 'ArrayExpression') return;
    const position = args.elements.findIndex(arg => ['-e', '--eval'].includes(value(arg, resolvedArgs.parents, node.start)));
    if (position < 0) return;
    if (mutated(node.arguments[1])) { errors.push({ line: node.loc.start.line, detail: 'Arguments Node --eval amb mutació no acreditada' }); return; }
    const code = value(args.elements[position + 1], resolvedArgs.parents, node.start);
    if (typeof code !== 'string') return; // computed programs remain outside this finite static check
    const cwd = workingDirectory(node.arguments[2], parents, node.start);
    const nested = importacionsExecutables(code, { root, file, base: typeof cwd === 'string' ? path.resolve(root, cwd) : root, inline: true, depth: depth + 1 });
    // A computed import such as process.argv[1] has no relative literal to resolve.
    // An unknown cwd cannot certify a literal relative import using an invented base.
    if (typeof cwd !== 'string' && nested.imports.length) { errors.push({ line: node.loc.start.line, detail: 'Node --eval literal amb cwd no resoluble' }); return; }
    imports.push(...nested.imports.map(item => ({ ...item, line: node.loc.start.line })));
    errors.push(...nested.errors.map(item => ({ ...item, line: node.loc.start.line })));
  });
  return { imports, errors };
}
