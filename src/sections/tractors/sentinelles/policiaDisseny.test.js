// @vitest-environment node
/* Sentinella 4 · Policia del Disseny: cada regla, un cas que dispara i un que
   no. Els colors i els estils dels exemples es componen a trossos perquè les
   portes que llegixen src/ (design_guard, tractor-pedra-seca) no els prenguen
   per infraccions d'este fitxer. */
import { describe, expect, test } from 'vitest';
import { SENTINELLA_POLICIA, observaPolicia, revisaFitxer } from './policiaDisseny.js';

const hex = (...trossos) => ['#', ...trossos].join('');
const px = (n) => `${n}${'px'}`;
const codis = (avisos) => avisos.map((a) => a.codi);
const estil = ['sty', 'le='].join('');

describe('JSX i JS', () => {
  test('estil en línia: roja amb la línia exacta', () => {
    const codi = ['const A = () => (', `  <p ${estil}{{ margin: 0 }}>x</p>`, ');'].join('\n');
    expect(revisaFitxer('src/apps/A.jsx', codi)).toEqual([
      { codi: 'PS-ESTIL-EN-LINIA', severitat: 'roja', missatge: expect.any(String), font: 'src/apps/A.jsx:2' }
    ]);
    expect(revisaFitxer('src/apps/B.jsx', 'const B = () => <p className="sdp-x">x</p>;')).toEqual([]);
  });

  test('estil en línia dins d’una etiqueta JSX: també darrere d’una fletxa, en diverses línies o com a text', () => {
    const fletxa = `const A = () => <button type="button" onClick={() => fes()} ${estil}{{ margin: 0 }}>x</button>;`;
    expect(codis(revisaFitxer('src/apps/A.jsx', fletxa))).toEqual(['PS-ESTIL-EN-LINIA']);
    const linies = ['const B = () => (', '  <p', '    className="sdp-a"', `    ${estil}{{ margin: 0 }}`, '  >x</p>', ');'].join('\n');
    expect(revisaFitxer('src/apps/B.jsx', linies)).toEqual([expect.objectContaining({ codi: 'PS-ESTIL-EN-LINIA', font: 'src/apps/B.jsx:4' })]);
    expect(codis(revisaFitxer('src/apps/C.jsx', `const C = () => <div>{cond && <p ${estil}"color: red">x</p>}</div>;`))).toEqual(['PS-ESTIL-EN-LINIA']);
    // La forma de PanellTractors.jsx:72: un apòstrof dins d'un atribut entre cometes no enganya la lectura.
    const apostrof = ['return (', '  <code', '    className="sdp-a"', '    title="Copia l’empremta i l\'enllaç"', `    ${estil}{{ cursor: 'pointer' }}`, '  />', ');'].join('\n');
    expect(revisaFitxer('src/apps/D.jsx', apostrof)).toEqual([expect.objectContaining({ codi: 'PS-ESTIL-EN-LINIA', font: 'src/apps/D.jsx:5' })]);
  });

  test('l’XML d’un escriptor en una plantilla i una variable «style» no són estils en línia', () => {
    const vora = ['const VORA = `<border>${[\'left\'].map((costat) => `<${costat} ', estil, '"thin"><color auto="1"/></${costat}>`).join(\'\')}</border>`;'].join('');
    expect(revisaFitxer('src/utils/fulls/xlsx.js', vora)).toEqual([]);
    expect(revisaFitxer('src/utils/x.js', `const xml = \`<left ${estil}"thin"/>\`;\nconst html = '<p ${estil}"x">';`)).toEqual([]);
    const variable = ['sty', 'le = '].join('');
    expect(revisaFitxer('src/utils/y.js', `const ${variable}{ a: 1 };\nlet b = 1\nfunction f({ ${variable}{} }) { return b; }\n${variable}{ b: 2 };`)).toEqual([]);
  });

  test('un estil en un comentari no compta', () => {
    expect(revisaFitxer('src/apps/C.jsx', `// <p ${estil}{{}}>\nconst C = 1;\n/* <p ${estil}"x"> */`)).toEqual([]);
  });

  test(':has() a una cadena de selector: roja', () => {
    expect(codis(revisaFitxer('src/apps/D.js', "el.querySelector('li:has(> a)');"))).toEqual(['PS-HAS']);
  });

  test('color cru en el codi: roja; una entitat HTML, no', () => {
    expect(codis(revisaFitxer('src/apps/E.jsx', `const color = '${hex('ff', '0000')}';`))).toEqual(['PS-COLOR-CRU']);
    expect(codis(revisaFitxer('src/apps/F.jsx', `const c = 'rgba(0, 0, 0, 0.5)';`))).toEqual(['PS-COLOR-CRU']);
    const entitat = `&${hex('039')};`;
    expect(revisaFitxer('src/apps/G.jsx', `const t = <p>${entitat}x${entitat}</p>;`)).toEqual([]);
  });

  test('h1 o h2 amb punt final: groga; sense punt o amb expressions, no', () => {
    const h = (n, text) => `<h${n} className="sdp-t">${text}</h${n}>`;
    expect(codis(revisaFitxer('src/apps/H.jsx', h(2, 'El títol.')))).toEqual(['PS-TITOL-PUNT']);
    expect(revisaFitxer('src/apps/I.jsx', h(2, 'El títol'))).toEqual([]);
    expect(revisaFitxer('src/apps/J.jsx', h(3, 'Un h3 pot acabar.'))).toEqual([]);
    expect(revisaFitxer('src/apps/K.jsx', h(1, '{titol}.'))).toEqual([]);
  });

  test('dues closques AppGridShell en un fitxer: groga', () => {
    const una = '<AppGridShell id="a" />';
    expect(codis(revisaFitxer('src/apps/L.jsx', `${una}\n${una}`))).toEqual(['PS-CLOSCA-DOBLE']);
    expect(revisaFitxer('src/apps/M.jsx', una)).toEqual([]);
  });
});

describe('CSS', () => {
  test('tokens primitius en un component: roja; dins de :root, no', () => {
    const primitiu = 'var(--sdp-pedra-400)';
    expect(codis(revisaFitxer('src/apps/a.css', `.sdp-a { color: ${primitiu}; }`))).toEqual(['PS-PRIMITIU']);
    expect(revisaFitxer('src/apps/b.css', `:root { --sdp-x: ${primitiu}; --sdp-y: ${hex('fff')}; }`)).toEqual([]);
    expect(revisaFitxer('src/css/tokens.css', `.sdp-root { --sdp-z: ${hex('000')}; }`)).toEqual([]);
  });

  test('color cru fora dels tokens, també dins d’una capa: roja', () => {
    expect(codis(revisaFitxer('src/apps/c.css', `@layer components { .sdp-a { color: ${hex('abc')}; } }`))).toEqual(['PS-COLOR-CRU']);
    expect(revisaFitxer('src/apps/d.css', `@media (prefers-color-scheme: dark) { :root { --sdp-x: ${hex('111')}; } }`)).toEqual([]);
  });

  test('dins d’un @media de tema només s’eximixen els blocs dels tokens, no les regles de component', () => {
    expect(codis(revisaFitxer('src/apps/d1.css', `@media (prefers-color-scheme: dark) { .sdp-a { color: ${hex('abc')}; } }`))).toEqual(['PS-COLOR-CRU']);
    const tema = [
      '@media (prefers-color-scheme: dark) {',
      `  :root:not([data-theme="light"]) { --sdp-x: ${hex('111')}; }`,
      `  .sdp-b { background: var(--sdp-pedra-400); }`,
      '}'
    ].join('\n');
    expect(revisaFitxer('src/apps/d2.css', tema)).toEqual([expect.objectContaining({ codi: 'PS-PRIMITIU', font: 'src/apps/d2.css:3' })]);
  });

  test('un bloc és de tokens si el seu subjecte és :root, :host o .sdp-root; un component penjat d’ells, no', () => {
    expect(revisaFitxer('src/apps/t1.css', `:root[data-theme="dark"] .sdp-root, :host([data-theme="dark"]) .sdp-root { --sdp-x: ${hex('222')}; }`)).toEqual([]);
    expect(codis(revisaFitxer('src/apps/t2.css', `:host([data-theme="dark"]) .sdp-a { color: ${hex('abc')}; }`))).toEqual(['PS-COLOR-CRU']);
    expect(codis(revisaFitxer('src/apps/t3.css', `.sdp-root .sdp-a, .sdp-root { color: ${hex('abc')}; }`))).toEqual(['PS-COLOR-CRU']);
  });

  test('espais fora de l’escala de 0.25rem: groga; múltiples i tokens, no', () => {
    const fora = `.sdp-a { margin: 0.3rem ${px(13)}; }`;
    expect(codis(revisaFitxer('src/apps/e.css', fora))).toEqual(['PS-ESPAI']);
    expect(revisaFitxer('src/apps/e.css', fora)[0].missatge).toContain(`0.3rem, ${px(13)}`);
    expect(revisaFitxer('src/apps/f.css', `.sdp-a { padding: 0.75rem 1rem 0 var(--sdp-space-4); gap: ${px(8)}; margin-inline: auto; }`)).toEqual([]);
  });

  test('un control per davall de --sdp-touch: roja; amb el token, no', () => {
    expect(codis(revisaFitxer('src/apps/g.css', `.sdp-a button { min-height: ${px(32)}; }`))).toEqual(['PS-TACTIL']);
    expect(codis(revisaFitxer('src/apps/h.css', 'a.sdp-enllac { height: 2rem; }'))).toEqual(['PS-TACTIL']);
    expect(revisaFitxer('src/apps/i.css', '.sdp-a button { min-height: var(--sdp-touch); }')).toEqual([]);
    expect(revisaFitxer('src/apps/j.css', `.sdp-a .sdp-icona { height: ${px(20)}; }`)).toEqual([]);
  });

  test('el pseudoelement d’un control no és el control (cas de modules.css: el xebró del summary)', () => {
    const xebro = '.sdp-explorador__grup > summary::after { content: ""; width: 0.5rem; height: 0.5rem; }';
    expect(revisaFitxer('src/css/modules.css', xebro)).toEqual([]);
    expect(revisaFitxer('src/apps/o.css', `a.sdp-enllac:before { width: ${px(8)}; height: ${px(8)}; }`)).toEqual([]);
    // Una pseudoclasse sí que és el control.
    expect(codis(revisaFitxer('src/apps/p.css', '.sdp-a > summary:hover { min-height: 2rem; }'))).toEqual(['PS-TACTIL']);
  });

  test('les longituds dins de calc(), min(), max() o clamp() no es comparen amb --sdp-touch', () => {
    expect(revisaFitxer('src/apps/q.css', `.sdp-a button { min-height: calc(var(--sdp-touch) + ${px(4)}); }`)).toEqual([]);
    expect(revisaFitxer('src/apps/r.css', `.sdp-a button { min-width: max(var(--sdp-touch), calc(100% - ${px(8)})); }`)).toEqual([]);
    // Fora de la funció, el literal continua comptant.
    expect(codis(revisaFitxer('src/apps/s.css', `.sdp-a button { min-height: ${px(32)}; width: calc(100% - ${px(8)}); }`))).toEqual(['PS-TACTIL']);
  });

  test('ombres i radis: amb token, res; amb valors literals, groga', () => {
    expect(codis(revisaFitxer('src/apps/k.css', `.sdp-a { box-shadow: 0 ${px(2)} ${px(4)} var(--sdp-ombra-1); border-radius: ${px(5)}; }`))).toEqual(['PS-OMBRA', 'PS-RADI']);
    expect(revisaFitxer('src/apps/l.css', '.sdp-a { box-shadow: var(--sdp-ombra-2); border-radius: var(--sdp-radi-m); }')).toEqual([]);
    expect(revisaFitxer('src/apps/m.css', '.sdp-a { box-shadow: none; border-radius: 50%; }')).toEqual([]);
  });

  test(':has() al CSS: roja', () => {
    expect(codis(revisaFitxer('src/apps/n.css', '.sdp-a:has(.sdp-b) { display: none; }'))).toEqual(['PS-HAS']);
  });
});

describe('observaPolicia', () => {
  test('ajunta els avisos de tots els fitxers i diu quants n’ha revisat', () => {
    const eixida = observaPolicia({
      fitxers: [
        { ruta: 'A.jsx', text: `<p ${estil}{{}} />` },
        { ruta: 'b.css', text: `.sdp-a { margin: ${px(3)}; }` },
        { ruta: 'notes.md', text: `${estil}{{}}` }
      ]
    });
    expect(codis(eixida.avisos)).toEqual(['PS-ESTIL-EN-LINIA', 'PS-ESPAI']);
    expect(eixida.informe).toMatch(/^2 fitxers revisats/);
    expect(eixida.informe).toContain('Roges: 1');
  });

  test('massa avisos: es tallen i ho diu', () => {
    const molts = Array.from({ length: 320 }, (_v, i) => `.sdp-a${i} { margin: ${px(3)}; }`).join('\n');
    const eixida = observaPolicia({ fitxers: [{ ruta: 'molts.css', text: molts }] });
    expect(eixida.avisos).toHaveLength(301);
    expect(eixida.avisos[300]).toMatchObject({ codi: 'PS-MASSA-AVISOS', severitat: 'info' });
  });

  test('prepara converteix els bytes triats en text', () => {
    const entrada = SENTINELLA_POLICIA.entrada.prepara([{ nom: 'x.css', bytes: new TextEncoder().encode('.sdp-a {}') }]);
    expect(entrada).toEqual({ fitxers: [{ ruta: 'x.css', text: '.sdp-a {}' }] });
  });
});
