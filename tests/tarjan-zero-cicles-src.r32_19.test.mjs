import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { parse } from '@babel/parser';

const ARREL_SRC = fileURLToPath(new URL('../src/', import.meta.url));
const EXTENSIONS = ['.js', '.jsx', '.mjs', '.ts', '.tsx'];
const esModul = (nom) => EXTENSIONS.includes(path.extname(nom));

function fontsDe(directori) {
  const fonts = new Map();
  function visita(dir) {
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      const fitxer = path.join(dir, entrada.name);
      if (entrada.isDirectory()) visita(fitxer);
      else if (entrada.isFile() && esModul(fitxer)) fonts.set(fitxer, fs.readFileSync(fitxer, 'utf8'));
    }
  }
  visita(directori);
  return fonts;
}

function grafDe(fonts, arrel) {
  const graf = new Map([...fonts.keys()].map((fitxer) => [fitxer, new Set()]));
  for (const [fitxer, font] of fonts) {
    const plugins = ['jsx'];
    if (/\.tsx?$/.test(fitxer)) plugins.push('typescript');
    const ast = parse(font, { sourceType: 'unambiguous', plugins, sourceFilename: fitxer });
    for (const node of ast.program.body) {
      if (!['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) || !node.source) continue;
      if (node.importKind === 'type' || node.exportKind === 'type') continue;
      const spec = node.source.value;
      if (/\?(?:raw|url)(?:[&#]|$)/.test(spec) || /\.css\?inline(?:[&#]|$)/.test(spec)) continue;
      const ruta = spec.split(/[?#]/)[0];
      const local = ruta.startsWith('.') ? path.resolve(path.dirname(fitxer), ruta)
        : ruta.startsWith('@/') ? path.resolve(arrel, ruta.slice(2))
          : ruta.startsWith('/src/') ? path.resolve(arrel, ruta.slice(5)) : null;
      if (!local || path.relative(arrel, local).startsWith('..' + path.sep)) continue;
      const candidats = [local, ...EXTENSIONS.map((ext) => local + ext), ...EXTENSIONS.map((ext) => path.join(local, `index${ext}`))];
      const desti = candidats.find((candidat) => fonts.has(candidat));
      if (desti) graf.get(fitxer).add(desti);
      else if (esModul(local) || !path.extname(local)) assert.fail(`Import de mòdul local no resolt: ${fitxer}: ${spec}`);
    }
  }
  return graf;
}

function ciclesTarjan(graf) {
  let index = 0;
  const indexs = new Map();
  const baixos = new Map();
  const pila = [];
  const dins = new Set();
  const cicles = [];
  function visita(v) {
    indexs.set(v, index);
    baixos.set(v, index++);
    pila.push(v);
    dins.add(v);
    for (const w of graf.get(v)) {
      if (!indexs.has(w)) {
        visita(w);
        baixos.set(v, Math.min(baixos.get(v), baixos.get(w)));
      } else if (dins.has(w)) baixos.set(v, Math.min(baixos.get(v), indexs.get(w)));
    }
    if (baixos.get(v) !== indexs.get(v)) return;
    const scc = [];
    let w;
    do {
      w = pila.pop();
      dins.delete(w);
      scc.push(w);
    } while (w !== v);
    if (scc.length > 1 || graf.get(v).has(v)) cicles.push(scc.sort());
  }
  for (const v of graf.keys()) if (!indexs.has(v)) visita(v);
  return cicles.sort((a, b) => a[0].localeCompare(b[0], 'en'));
}

const grafVirtual = (fonts) => grafDe(new Map(Object.entries(fonts).map(([p, font]) => [path.join('/src', p), font])), '/src');

test('Tarjan troba SCC, self-loop i reexports; ignora textos, comentaris i import dinàmic', () => {
  const graf = grafVirtual({
    'a.js': `import './b'; export const text = "import './a.js'"; // import './a.js'\nimport('./a.js');`,
    'b.jsx': `export { x } from '@/c.js'; export const vista = <div />;`,
    'c.js': `export * from './a.js'; export const x = 1;`,
    'd.js': `import './d.js';`,
    'sol.js': `const text = "export * from './sol.js'"; import('./sol.js');`
  });
  assert.deepEqual(ciclesTarjan(graf), [['/src/a.js', '/src/b.jsx', '/src/c.js'], ['/src/d.js']]);
});

test('Tarjan no confon una aresta cap a una SCC ja tancada amb un cicle nou', () => {
  assert.deepEqual(ciclesTarjan(grafVirtual({ 'a.js': `import './b.js';`, 'b.js': '', 'c.js': `import './a.js'; import './b.js';` })), []);
});

test('el graf falla tancat davant sintaxi o imports locals de codi no resolts', () => {
  assert.throws(() => grafVirtual({ 'a.js': `import './absent.js';` }), /no resolt/);
  assert.throws(() => grafVirtual({ 'a.js': `import {` }));
});

test('tot src: zero SCC amb cicle, incloent .jsx, proves, reexports i self-loops', (t) => {
  const fonts = fontsDe(ARREL_SRC);
  assert.ok(fonts.size > 1800, `Cens src inesperat: ${fonts.size}`);
  const graf = grafDe(fonts, ARREL_SRC);
  const cicles = ciclesTarjan(graf);
  t.diagnostic(JSON.stringify({ moduls: fonts.size, arestes: [...graf.values()].reduce((n, ds) => n + ds.size, 0), cycles: cicles.length }));
  assert.deepEqual(cicles.map((c) => c.map((p) => path.relative(ARREL_SRC, p))), []);
});
