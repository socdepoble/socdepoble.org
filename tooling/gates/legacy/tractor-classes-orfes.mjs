#!/usr/bin/env node
/**
 * tractor-classes-orfes.mjs — Cap className sense regla CSS.
 *
 * AUDITORIA EN DUES PASSES
 *   1. Tots els .css de src/ (recursiu) defineixen el vocabulari de classes.
 *   2. Tots els .jsx de src/ (fora de proves) declaren usos de className.
 *      S'analitzen amb @babel/parser per a resoldre estàticament:
 *        · className="a b"                    → a, b
 *        · className={'a b'}                  → a, b
 *        · className={`a b`}                  → a, b
 *        · className={`a ${x}`}               → a  (i `${x}` com a dinàmic)
 *        · className={`a-${x}`}               → a- (dinàmic parcial dreta)
 *        · className={`${x}-b`}               → -b (dinàmic parcial esquerra)
 *        · className={cond ? 'a' : 'b'}       → a, b
 *        · className={['a', cond && 'b'].join(' ')} → a, b (més marcador dinàmic)
 *        · className={x}                      → dinàmic (variable)
 *        · className={styles.foo}             → dinàmic (member)
 *      També es rastregen formes equivalents fora del JSX pur:
 *        · element.classList.add/toggle/replace('a', 'b')
 *        · element.setAttribute('class', 'a b')
 *        · element.className = 'a b'
 *        · { className: 'a b' } en objectes literals
 *
 * RESULTAT
 *   · Orfes: cada classe estàtica sense regla CSS enlloc del projecte.
 *   · Dinàmiques: cada posició que no s'ha pogut resoldre (informatiu).
 *
 * EXEMPCIONS
 *   Unes poques classes vénen de sistemes externs o d'escotilles explícites
 *   i no han de tindre regla al CSS del projecte. Són a EXEMPTES amb motiu.
 *
 * CODI D'EIXIDA
 *   0 · Cap classe òrfena i cap error de parseig.
 *   1 · Hi ha orfes o errors de parseig (fail-closed).
 *   2 · No s'ha pogut localitzar src/ (fallada de context).
 *
 * ÚS
 *   node tooling/gates/tractor-classes-orfes.mjs
 *   node tooling/gates/tractor-classes-orfes.mjs --json      # sortida per a CI
 *   node tooling/gates/tractor-classes-orfes.mjs --detall    # llistat complet
 *   node tooling/gates/tractor-classes-orfes.mjs --arrel=/ruta
 *
 * DEPENDÈNCIES
 *   Cap d'externa fora de @babel/parser (ja declarat com a devDependency
 *   i utilitzat per design_guard, tractor-tdz, tractor-vocabulari i
 *   tractor-fitxa-gestor).
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { parse } from '@babel/parser';

/* ═══════════════════════════ Configuració ═══════════════════════════ */

const ARGS = process.argv.slice(2);
const JSON_OUT = ARGS.includes('--json');
const DETALL = ARGS.includes('--detall');

import { R as ARREL } from '../lib/arrel.mjs';

const SRC = join(ARREL, 'src');

/**
 * Classes que NO han de tindre regla al CSS del projecte perquè vénen de
 * sistemes externs o d'escotilles explícites. Cada entrada porta el motiu.
 * Si n'apareix una altra, afegir-la ací amb justificació escrita.
 */
const EXEMPTES = new Set([
  'ProseMirror',     // editor Tiptap: el seu CSS viu al paquet de Tiptap
  'tiptap',          // ídem
  'sdp-ignore-56',   // escotilla explícita de la porta 58px
  'light-only',      // estats externs / de sistema
  'dark-only',
  'active'
]);

/* ═══════════════════════════ CSS: vocabulari ═══════════════════════════ */

/**
 * Recorre src/ i torna el Set de noms de classe declarats en qualsevol
 * full .css. Neutralitza abans comentaris, cadenes i url() per evitar
 * falsos positius (una cadena `content: ".foo"` no és un selector).
 */
function scanSrcCss() {
  const classes = new Set();
  const fulls = [];

  (function walk(dir) {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.css')) fulls.push(full);
    }
  })(SRC);

  for (const full of fulls) {
    let css = readFileSync(full, 'utf8');
    // Es neutralitza preservant llargària (offsets intactes si mai cal).
    css = css.replace(/\/\*[\s\S]*?\*\//g, ' ');
    css = css.replace(/"(?:[^"\\]|\\.)*"/g, (m) => '"' + ' '.repeat(Math.max(0, m.length - 2)) + '"');
    css = css.replace(/'(?:[^'\\]|\\.)*'/g, (m) => "'" + ' '.repeat(Math.max(0, m.length - 2)) + "'");
    css = css.replace(/url\([^)]*\)/gi, (m) => 'url(' + ' '.repeat(Math.max(0, m.length - 5)) + ')');

    // Un selector de classe és `.` seguit d'un identificador vàlid.
    for (const m of css.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) {
      classes.add(m[1]);
    }
  }

  return { classes, fulls };
}

/* ═══════════════════════════ JSX: usos ═══════════════════════════ */

function scanSrcJsx() {
  const files = [];
  (function walk(dir) {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.jsx$/.test(e.name) && !/\.test\.jsx$/.test(e.name)) files.push(full);
    }
  })(SRC);

  const staticUsages = new Map(); // class → [{ file, line }]
  const unresolved = [];          // { file, line, reason, snippet }
  const parseErrors = [];         // { file, message }

  for (const file of files) {
    const rel = relative(ARREL, file);
    let src;
    try {
      src = readFileSync(file, 'utf8');
    } catch (err) {
      parseErrors.push({ file: rel, message: `No s'ha pogut llegir: ${err.message}` });
      continue;
    }

    let ast;
    try {
      ast = parse(src, {
        sourceType: 'module',
        plugins: ['jsx'],
        errorRecovery: false,
      });
    } catch (err) {
      parseErrors.push({ file: rel, message: err.message.split('\n')[0] });
      continue;
    }

    const addStatic = (cls, line) => {
      if (!staticUsages.has(cls)) staticUsages.set(cls, []);
      staticUsages.get(cls).push({ file: rel, line });
    };

    walkAst(ast, (node) => {
      // 1 · JSXAttribute: className / class
      if (node.type === 'JSXAttribute') {
        const nom = node.name?.type === 'JSXIdentifier' ? node.name.name : null;
        if (nom !== 'className' && nom !== 'class') return;
        if (!node.value) return;
        const line = node.loc?.start?.line ?? 0;
        
        let targetNode = node.value;
        if (node.value.type === 'JSXExpressionContainer') {
            targetNode = node.value.expression;
        }

        const { staticClasses, unresolved: markers } = extractClasses(targetNode);
        for (const cls of staticClasses) addStatic(cls, line);
        for (const m of markers) unresolved.push({ file: rel, line, ...m });
        return;
      }

      // 2 · ObjectProperty: { className: 'a b' }
      if (node.type === 'ObjectProperty' && !node.computed) {
        const key = node.key?.name ?? node.key?.value;
        if (key !== 'className' && key !== 'class') return;
        if (!node.value) return;
        const line = node.loc?.start?.line ?? 0;
        const { staticClasses, unresolved: markers } = extractClasses(node.value);
        for (const cls of staticClasses) addStatic(cls, line);
        for (const m of markers) unresolved.push({ file: rel, line, ...m });
        return;
      }

      // 3 · AssignmentExpression: element.className = 'a b'
      if (node.type === 'AssignmentExpression' && node.operator === '=') {
        if (node.left?.type !== 'MemberExpression') return;
        if (node.left.property?.name !== 'className') return;
        const line = node.loc?.start?.line ?? 0;
        const { staticClasses, unresolved: markers } = extractClasses(node.right);
        for (const cls of staticClasses) addStatic(cls, line);
        for (const m of markers) unresolved.push({ file: rel, line, ...m });
        return;
      }

      // 4 · CallExpression: classList.add/toggle/replace, setAttribute('class', …)
      if (node.type === 'CallExpression' || node.type === 'OptionalCallExpression') {
        const callee = node.callee;
        if (!callee || callee.type !== 'MemberExpression') return;
        const method = callee.property?.name;
        const isClassList = callee.object?.type === 'MemberExpression'
          && callee.object.property?.name === 'classList';
        const isSetAttr = method === 'setAttribute'
          && node.arguments?.[0]?.type === 'StringLiteral'
          && node.arguments[0].value === 'class';

        if (isClassList && (method === 'add' || method === 'toggle' || method === 'replace')) {
          const line = node.loc?.start?.line ?? 0;
          const args = method === 'replace' ? node.arguments.slice(1) : node.arguments;
          for (const arg of args ?? []) {
            if (arg?.type === 'StringLiteral') {
              for (const cls of splitClasses(arg.value)) addStatic(cls, line);
            }
          }
          return;
        }

        if (isSetAttr) {
          const line = node.loc?.start?.line ?? 0;
          const val = node.arguments[1];
          if (val?.type === 'StringLiteral') {
            for (const cls of splitClasses(val.value)) addStatic(cls, line);
          }
          return;
        }
      }
    });
  }

  return { staticUsages, unresolved, parseErrors, fileCount: files.length };
}

/* ═══════════════════════════ Recorregut AST ═══════════════════════════ */

function walkAst(node, visit) {
  if (!node || typeof node !== 'object') return;
  if (typeof node.type === 'string') visit(node);
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'start' || key === 'end' || key === 'range'
      || key === 'leadingComments' || key === 'trailingComments'
      || key === 'innerComments' || key === 'extra'
      || key === 'comments' || key === 'tokens') continue;
    const v = node[key];
    if (Array.isArray(v)) {
      for (const child of v) walkAst(child, visit);
    } else if (v && typeof v === 'object') {
      walkAst(v, visit);
    }
  }
}

/* ═══════════════════════════ Extracció de classes ═══════════════════════════ */

/**
 * Separa un text de classe en tokens individuals.
 * Un token vàlid comença amb lletra, `_` o `-` i després \w i `-`.
 */
function splitClasses(text) {
  if (!text) return [];
  const out = [];
  for (const p of text.split(/\s+/)) {
    if (p && /^-?[A-Za-z_][\w-]*$/.test(p)) out.push(p);
  }
  return out;
}

function extractClasses(node) {
  const staticClasses = [];
  const unresolved = [];

  if (!node) return { staticClasses, unresolved };

  if (node.type === 'StringLiteral') {
    staticClasses.push(...splitClasses(node.value));
  } else if (node.type === 'TemplateLiteral') {
    for (const quasi of node.quasis) {
      if (quasi.value && quasi.value.raw) {
        staticClasses.push(...splitClasses(quasi.value.raw));
      }
    }
    unresolved.push({ reason: 'TemplateLiteral amb expressions' });
  } else if (node.type === 'ConditionalExpression') {
    const cons = extractClasses(node.consequent);
    const alt = extractClasses(node.alternate);
    staticClasses.push(...cons.staticClasses, ...alt.staticClasses);
    unresolved.push(...cons.unresolved, ...alt.unresolved);
  } else if (node.type === 'LogicalExpression') {
    const right = extractClasses(node.right);
    staticClasses.push(...right.staticClasses);
    unresolved.push(...right.unresolved);
  } else if (node.type === 'ArrayExpression') {
    for (const el of node.elements) {
      if (el) {
        const res = extractClasses(el);
        staticClasses.push(...res.staticClasses);
        unresolved.push(...res.unresolved);
      }
    }
  } else if (node.type === 'CallExpression') {
     if (node.callee.type === 'MemberExpression' && node.callee.property.name === 'join' && node.callee.object.type === 'ArrayExpression') {
        const res = extractClasses(node.callee.object);
        staticClasses.push(...res.staticClasses);
        unresolved.push(...res.unresolved);
     } else {
        unresolved.push({ reason: 'CallExpression dinàmic' });
     }
  } else {
    unresolved.push({ reason: 'Expressió dinàmica: ' + node.type });
  }
  return { staticClasses, unresolved };
}

/* ═══════════════════════════ Execució ═══════════════════════════ */

const { classes: definides, fulls } = scanSrcCss();
const { staticUsages, unresolved, parseErrors, fileCount } = scanSrcJsx();

const falles = [];
for (const [cls, usages] of staticUsages.entries()) {
  if (!definides.has(cls) && !EXEMPTES.has(cls)) {
    for (const u of usages) {
      falles.push(`${u.file}:${u.line} · .${cls} no té cap regla CSS.`);
    }
  }
}

if (JSON_OUT) {
  console.log(JSON.stringify({ falles, parseErrors, fileCount, numDefinides: definides.size }));
  process.exit(falles.length || parseErrors.length ? 1 : 0);
}

if (parseErrors.length) {
  console.error(`\n❌ [CLASSES ÒRFENES] Errors de parseig:`);
  for (const err of parseErrors) console.error(`   ${err.file}: ${err.message}`);
}

if (falles.length || parseErrors.length) {
  if (falles.length) {
    console.error(`\n❌ [CLASSES ÒRFENES] ${falles.length} infracció(ns):`);
    [...new Set(falles)].forEach((f) => console.error('   ' + f));
  }
  process.exit(1);
}

console.log(`✅ [CLASSES ÒRFENES] Cap className sense regla · ${definides.size} classes definides · ${fileCount} arxius analitzats`);
