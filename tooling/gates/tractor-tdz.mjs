#!/usr/bin/env node
/**
 * tractor-tdz.mjs — Llei de la Zona Morta Temporal.
 *
 * Detecta l'ús d'un binding `const`/`let`/`class` d'àmbit de mòdul en una
 * inicialitzadora que s'avalua ABANS de la seua declaració. Això no és un avís
 * d'estil: llança ReferenceError en carregar el mòdul i tomba l'aplicació
 * sencera. ESLint recommended no ho detecta (no-use-before-define no hi és).
 *
 * Ús: node tractor-tdz.mjs [arrel]
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';

const EXT = new Set(['.js', '.jsx', '.mjs', '.cjs']);
const UNKNOWN = Symbol('valor no acreditat');
const funcio = n => ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(n?.type);
function noms(p, acc = []) {
  if (!p) return acc;
  if (p.type === 'Identifier') acc.push(p.name);
  else if (p.type === 'RestElement') noms(p.argument, acc);
  else if (p.type === 'AssignmentPattern') noms(p.left, acc);
  else if (p.type === 'ArrayPattern') p.elements.forEach(x => noms(x, acc));
  else if (p.type === 'ObjectPattern') p.properties.forEach(x => noms(x.type === 'RestElement' ? x.argument : x.value, acc));
  return acc;
}
const declaracio = n => n?.type?.startsWith('Export') && n.declaration ? n.declaration : n;
function literal(n) {
  if (['BooleanLiteral', 'NumericLiteral', 'StringLiteral'].includes(n?.type)) return n.value;
  if (n?.type === 'NullLiteral') return null;
  if (n?.type === 'UnaryExpression' && n.operator === '!') {
    const v = literal(n.argument); if (v !== UNKNOWN) return !v;
  }
  return UNKNOWN;
}
/** Anàlisi local d'avaluació inicial. No executa codi ni resol crides opaques. */
export function auditaCodiTdz(codi, f = '<font>') {
  let ast;
  try { ast = parse(codi, { sourceType: 'module', plugins: ['jsx', 'classProperties', 'topLevelAwait', 'importAttributes'] }); }
  catch (e) { return [{ f, tipus: 'SINTAXI', msg: e.message, linia: e.loc?.line ?? 0 }]; }
  const errors = [], lexics = new Map(), inicialitzats = new Set(), globals = new Map(), scopes = [], actives = new Set();
  let crides = 0;
  const cos = ast.program.body.map(declaracio);
  for (const n of cos) {
    if (n?.type === 'VariableDeclaration' && n.kind !== 'var') for (const d of n.declarations) for (const name of noms(d.id)) lexics.set(name, d.id.loc.start.line);
    if (n?.type === 'ClassDeclaration' && n.id) lexics.set(n.id.name, n.id.loc.start.line);
    if (n?.type === 'FunctionDeclaration' && n.id) globals.set(n.id.name, n);
  }
  const ombrejat = name => scopes.some(s => s.names.has(name));
  const referencia = n => {
    if (lexics.has(n.name) && !inicialitzats.has(n.name) && !ombrejat(n.name)) errors.push({ f, tipus: 'TDZ', linia: n.loc.start.line,
      msg: `'${n.name}' s'usa a la línia ${n.loc.start.line} però encara no s'ha inicialitzat (declaració a la ${lexics.get(n.name)}). TDZ en l'avaluació inicial.` });
  };
  function scope(body = [], parameters = []) {
    const names = new Set(parameters), functions = new Map();
    for (const n of body.map(declaracio)) {
      if (n?.type === 'VariableDeclaration') for (const d of n.declarations) noms(d.id).forEach(x => names.add(x));
      if (['FunctionDeclaration', 'ClassDeclaration'].includes(n?.type) && n.id) names.add(n.id.name);
      if (n?.type === 'FunctionDeclaration' && n.id) functions.set(n.id.name, n);
    }
    return { names, functions };
  }
  function trobaFuncio(name) {
    for (let i = scopes.length - 1; i >= 0; i--) if (scopes[i].names.has(name)) return scopes[i].functions.get(name);
    return (!lexics.has(name) || inicialitzats.has(name)) ? globals.get(name) : null;
  }
  function patro(p, top, provided = UNKNOWN) {
    if (!p) return;
    if (p.type === 'Identifier') { if (top) inicialitzats.add(p.name); return; }
    if (p.type === 'RestElement') return patro(p.argument, top);
    if (p.type === 'AssignmentPattern') {
      if (provided === UNKNOWN || provided === null) visita(p.right);
      return patro(p.left, top);
    }
    if (p.type === 'ArrayPattern') { p.elements.forEach((x, i) => patro(x, top, provided?.type === 'ArrayExpression' ? provided.elements[i] ?? null : UNKNOWN)); return; }
    if (p.type === 'ObjectPattern') for (const x of p.properties) {
      if (x.computed) visita(x.key);
      const key = x.key?.name ?? x.key?.value;
      const known = provided?.type === 'ObjectExpression' && !provided.properties.some(y => y.type === 'SpreadElement');
      const value = known ? provided.properties.findLast(y => !y.computed && (y.key?.name ?? y.key?.value) === key)?.value ?? null : UNKNOWN;
      patro(x.type === 'RestElement' ? x.argument : x.value, top, value);
    }
  }
  function executa(fn, args = []) {
    if (fn.async || fn.generator || actives.has(fn)) return; // async/generator no acrediten execució completa síncrona
    if (++crides > 1024 || actives.size >= 32) {
      if (!errors.some(e => e.tipus === 'ABAST')) errors.push({ f, tipus: 'ABAST', linia: fn.loc.start.line, msg: 'Límit de crides locals de l’anàlisi TDZ.' });
      return;
    }
    actives.add(fn);
    const params = fn.params.flatMap(p => noms(p)), local = scope([], [...params, ...(fn.id ? [fn.id.name] : [])]);
    // var pertany a la funció, també dins de blocs; no als cossos de funcions filles.
    const vars = n => { if (!n || typeof n !== 'object' || (n !== fn.body && funcio(n))) return;
      if (n.type === 'VariableDeclaration' && n.kind === 'var') n.declarations.forEach(d => noms(d.id).forEach(x => local.names.add(x)));
      for (const [k, v] of Object.entries(n)) if (!['loc', 'type'].includes(k)) { if (Array.isArray(v)) v.forEach(vars); else if (v?.type) vars(v); }
    };
    vars(fn.body); scopes.push(local);
    fn.params.forEach((p, i) => patro(p, false, args[i] ?? null));
    if (fn.body.type === 'BlockStatement') bloc(fn.body.body); else visita(fn.body);
    scopes.pop(); actives.delete(fn);
  }
  function visita(n) {
    if (!n || typeof n !== 'object') return;
    if (n.type === 'Identifier') { referencia(n); return; }
    if (funcio(n)) return;
    if (n.type === 'CallExpression' || n.type === 'OptionalCallExpression') {
      visita(n.callee); n.arguments.forEach(visita);
      const fn = funcio(n.callee) ? n.callee : n.callee?.type === 'Identifier' ? trobaFuncio(n.callee.name) : null;
      if (fn) executa(fn, n.arguments); return;
    }
    if (n.type === 'AssignmentExpression' && n.left.type === 'Identifier') {
      referencia(n.left); visita(n.right);
      let owner = globals;
      for (let i = scopes.length - 1; i >= 0; i--) if (scopes[i].names.has(n.left.name)) { owner = scopes[i].functions; break; }
      if (n.operator === '=' && funcio(n.right)) owner.set(n.left.name, n.right); else owner.delete(n.left.name);
      return;
    }
    if (n.type === 'LogicalExpression') {
      visita(n.left); const v = literal(n.left);
      if (v !== UNKNOWN && ((n.operator === '&&' && !v) || (n.operator === '||' && v) || (n.operator === '??' && v != null))) return;
      visita(n.right); return;
    }
    if (n.type === 'ConditionalExpression') {
      visita(n.test); const v = literal(n.test);
      if (v === UNKNOWN || v) visita(n.consequent);
      if (v === UNKNOWN || !v) visita(n.alternate); return;
    }
    if (n.type === 'MemberExpression' || n.type === 'OptionalMemberExpression') { visita(n.object); if (n.computed && !(n.optional && literal(n.object) === null)) visita(n.property); return; }
    if (['ObjectMethod', 'ClassMethod', 'ClassPrivateMethod'].includes(n.type)) { if (n.computed) visita(n.key); return; }
    for (const [k, v] of Object.entries(n)) {
      if (['loc', 'type'].includes(k) || (k === 'key' && !n.computed) || (n.type === 'JSXAttribute' && k === 'name') || ['ImportSpecifier', 'ExportSpecifier'].includes(n.type)) continue;
      if (Array.isArray(v)) v.forEach(visita); else if (v?.type) visita(v);
    }
  }
  function sentencia(n, top = false) {
    if (!n) return false;
    if (n.type === 'VariableDeclaration') {
      for (const d of n.declarations) {
        visita(d.init); patro(d.id, top && n.kind !== 'var', d.init ?? UNKNOWN);
        if (d.id.type === 'Identifier' && funcio(d.init)) (top ? globals : scopes.at(-1).functions).set(d.id.name, d.init);
      }
    } else if (n.type === 'FunctionDeclaration' || n.type === 'ImportDeclaration') { /* declaratives, no executar cos */ }
    else if (n.type === 'ClassDeclaration') { visita(n.superClass); if (top && n.id) inicialitzats.add(n.id.name); }
    else if (n.type === 'BlockStatement') return bloc(n.body);
    else if (n.type === 'ReturnStatement' || n.type === 'ThrowStatement') { visita(n.argument); return true; }
    else if (n.type === 'IfStatement') {
      visita(n.test); const v = literal(n.test);
      if (v !== UNKNOWN) return sentencia(v ? n.consequent : n.alternate);
      const a = sentencia(n.consequent), b = sentencia(n.alternate); return a && b;
    } else visita(n);
    return false;
  }
  function bloc(body) {
    scopes.push(scope(body)); let terminal = false;
    for (const n of body) if (sentencia(n)) { terminal = true; break; }
    scopes.pop(); return terminal;
  }
  for (const n of cos) sentencia(n, true);
  const seen = new Set();
  return errors.filter(e => { const key = `${e.linia}:${e.msg}`; if (seen.has(key)) return false; seen.add(key); return true; });
}

function fitxers(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!['node_modules', '.git'].includes(e.name)) fitxers(p, acc); }
    else if (EXT.has(path.extname(e.name))) acc.push(p);
  }
  return acc;
}
export function auditaTdz(arrel = 'src') { return fitxers(arrel).flatMap(f => auditaCodiTdz(fs.readFileSync(f, 'utf8'), f)); }
export function main(args = process.argv.slice(2)) {
  const arrel = args[0] || 'src', errors = auditaTdz(arrel);
  if (!errors.length) { console.log(`✅ TDZ: cap ús abans de declaració a ${arrel}/`); return 0; }
  console.log(`❌ TDZ: ${errors.length} problema(es)\n`);
  for (const e of errors) console.log(`  [${e.tipus}] ${e.f}:${e.linia}\n      ${e.msg}`);
  return 1;
}
import { fileURLToPath } from 'node:url';
if (process.argv[1] && fs.existsSync(process.argv[1]) && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
