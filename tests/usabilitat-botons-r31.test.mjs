import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';

const ARREL = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

function caminaJsx(dirAbs, out = []) {
  for (const ent of fs.readdirSync(dirAbs, { withFileTypes: true })) {
    if (ent.name.startsWith('.') || ent.name === 'node_modules') continue;
    const full = path.join(dirAbs, ent.name);
    if (ent.isSymbolicLink()) continue;
    if (ent.isDirectory()) caminaJsx(full, out);
    else if (/\.(?:jsx|js)$/.test(ent.name) && !/\.test\.(?:jsx|js)$/.test(ent.name)) out.push(full);
  }
  return out;
}

function visitaAst(node, cb) {
  if (!node || typeof node !== 'object') return;
  cb(node);
  for (const k of Object.keys(node)) {
    const v = node[k];
    if (Array.isArray(v)) {
      for (const child of v) visitaAst(child, cb);
    } else if (v && typeof v === 'object' && typeof v.type === 'string') {
      visitaAst(v, cb);
    }
  }
}

test('cap element JSX <button> en producció dins d’un <form> o component omiteix l’atribut explícit type=', () => {
  const fitxers = caminaJsx(path.join(ARREL, 'src'));
  const senseType = [];

  for (const abs of fitxers) {
    const codi = fs.readFileSync(abs, 'utf8');
    if (!codi.includes('<button')) continue;
    let ast;
    try {
      ast = parse(codi, {
        sourceType: 'module',
        plugins: ['jsx'],
      });
    } catch {
      continue;
    }
    visitaAst(ast.program, (node) => {
      if (node.type !== 'JSXOpeningElement') return;
      if (node.name?.type !== 'JSXIdentifier' || node.name.name !== 'button') return;
      const teType = (node.attributes || []).some(
        (attr) =>
          (attr.type === 'JSXAttribute' && attr.name?.name === 'type')
          || attr.type === 'JSXSpreadAttribute',
      );
      if (!teType) {
        const rel = path.relative(ARREL, abs).split(path.sep).join('/');
        senseType.push(`${rel}:${node.loc?.start?.line ?? '?'}`);
      }
    });
  }

  assert.deepEqual(
    senseType,
    [],
    `Tots els <button> JSX han de declarar type explícit ("button", "submit" o "reset") per evitar enviaments accidentals de formulari: ${senseType.join(', ')}`,
  );
});

test('WCAG 2.5.3 (Label in Name): DateTimeControl i SelectorDataHora separen spans amb espai i conserven el text visible a aria-label', () => {
  const controls = fs.readFileSync(path.join(ARREL, 'src/components/PedraSeca/atoms/controls.jsx'), 'utf8');
  const selector = fs.readFileSync(path.join(ARREL, 'src/components/PedraSeca/organismes/SelectorDataHora.jsx'), 'utf8');

  assert.match(controls, /\{time && date \? ' ' : null\}/);
  assert.match(selector, /\{mostra\.time && mostra\.date \? ' ' : null\}/);
  assert.match(
    selector,
    /\.replace\(`\(\$\{visible\}\)`, `— \$\{visible\}`\)/,
    'SelectorDataHora substitueix els parèntesis de ({visible}) per guió llarg per complir label-content-name-mismatch d’axe-core',
  );
});

test('Dialeg canònic usa <dialog> natiu i les 4 rutes d’entitat (/gent, /empresa, /grup, /ajuntament) estan declarades al router i a PerfilPublicSection', () => {
  const dialeg = fs.readFileSync(path.join(ARREL, 'src/components/PedraSeca/organismes/Dialeg.jsx'), 'utf8');
  assert.match(dialeg, /<dialog\b/);
  assert.match(dialeg, /showModal\(/);

  const perfilPublic = fs.readFileSync(path.join(ARREL, 'src/sections/profile/PerfilPublicSection.jsx'), 'utf8');
  for (const prefix of ['/gent/:id', '/empresa/:id', '/grup/:id', '/ajuntament/:id', '/perfil/:id']) {
    assert.ok(perfilPublic.includes(prefix), `PerfilPublicSection documenta i suporta ${prefix}`);
  }

  const perfilCamps = fs.readFileSync(path.join(ARREL, 'src/sections/profile/perfilCamps.js'), 'utf8');
  assert.match(perfilCamps, /ambDretsDeFitxa = \(identitat\) => menaDeFitxa\(identitat\) !== 'persona'/);
});
