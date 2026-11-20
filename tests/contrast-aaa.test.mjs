import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { audita, color, llegeixTemes, llindar, luminancia, parellesSemantiques, ratio, selectorAplicaAlMode, sobre, variantsDAlies } from '../tooling/gates/contrast-aaa.mjs';

const near = (a, b, e = 1e-12) => assert.ok(Math.abs(a - b) <= e, `${a} != ${b}`);

test('WCAG 2.x: extrems, simetria, llindar sRGB i cap arredoniment d’aprovació', () => {
  const white = color('#ffffff');
  const black = color('#000000');
  assert.equal(ratio(white, black), 21);
  assert.equal(ratio(white, white), 1);
  near(ratio(white, color('#0f672f')), 6.996599758323873, 1e-9);
  assert.ok(ratio(white, color('#0f672f')) < llindar());
  assert.ok(ratio(white, color('#0e662e')) >= llindar());
  assert.equal(ratio(black, white), ratio(white, black));
  assert.equal(llindar(true), 4.5);
  assert.equal(llindar(false), 7);
  near(luminancia([0.04045, 0.04045, 0.04045, 1]), 0.04045 / 12.92);
});

test('alfa: es compon sobre el fons abans de linealitzar, sense truncar a hex', () => {
  const gray = sobre(color('rgba(255, 255, 255, 0.5)'), color('#000000'));
  assert.deepEqual(gray, [0.5, 0.5, 0.5, 1]);
  near(ratio(color('rgba(255, 255, 255, 0.5)'), color('#000000')), 5.280822809644651);
  near(ratio(color('#fff'), color('rgba(0, 0, 0, .5)'), color('#fff')), 3.976653024912438);
  assert.throws(() => ratio(color('#fff'), color('transparent')), /Fons translúcid/);
});

test('color-mix sRGB: alfa premultiplicada i percentatge transparent, sense verd fosc espuri', () => {
  assert.deepEqual(color('color-mix(in srgb, #ffffff 50%, transparent)'), [1, 1, 1, 0.5]);
  assert.deepEqual(color('color-mix(in srgb, #ffffff 25%, #000000 25%)'), [0.5, 0.5, 0.5, 0.5]);
  assert.deepEqual(color('color-mix(in srgb, #fff, #000)'), [0.5, 0.5, 0.5, 1]);
  assert.deepEqual(color('rgb(100% 0% 0% / 50%)'), [1, 0, 0, 0.5]);
});

test('tokens: referències niades/fallback, cicles i valors desconeguts fallen tancats', () => {
  assert.deepEqual(color('var(--a)', { '--a': 'var(--b, var(--c))', '--c': '#fff' }), [1, 1, 1, 1]);
  assert.throws(() => color('var(--a)', { '--a': 'var(--b)', '--b': 'var(--a)' }), /Cicle/);
  assert.throws(() => color('var(--absent)'), /Token absent/);
  assert.throws(() => color('oklch(50% .2 90)'), /Color no resolt/);
  assert.throws(() => color('rgba(1, 2, 3, 2)'), /fora de rang/);
});

test('CSS real: 4 modes, totes les parelles semàntiques i les explícites opaces passen sense arredonir', () => {
  const r = audita();
  assert.equal(Object.keys(llegeixTemes()).length, 4);
  assert.ok(parellesSemantiques().length >= 100);
  assert.ok(r.cens.length >= 400, 'el cens llig tots els fulls CSS de src/css');
  assert.ok(r.explicites.length >= 1000);
  assert.equal(r.fallades.length, 0, JSON.stringify(r.fallades, null, 2));
  // L’informe no amaga el que necessita un DOM; no és un PASS global de WCAG.
  assert.ok(r.contextuals.length > 0);
  assert.ok(r.contextuals.every((x) => x.motiu && !('passa' in x)));
});

test('oracle independent contra la regressió anterior: el text taronja heretat era AA i no AAA', () => {
  const oldFg = color('#ad4c03');
  const oldBg = color('#ffffff');
  assert.ok(ratio(oldFg, oldBg) < 7);
  const css = readFileSync('src/css/tokens.css', 'utf8');
  assert.match(css, /--sdp-accent-text:\s*var\(--sdp-primary-800\)/);
  const modes = llegeixTemes();
  for (const map of Object.values(modes)) assert.ok(ratio(color('var(--sdp-accent-text)', map), color('var(--sdp-fons-subtil)', map)) >= 7);
});

/* Gauntlet v1.2.14 R2 · Els àlies locals: la reserva no amaga el valor real, l'àmbit de tema filtra els valors que
   no poden coexistir i un àlies niat dins d'un altre valor falla tancat. */
test('variantsDAlies: reserva, àlies niats, àmbit de tema i fail-closed', () => {
  const defs = (parells) => new Map(parells.map(([v, sels]) => [v, sels]));
  const alies = new Map([
    ['--x', defs([['#777', ['.p']]])],
    ['--y', defs([['var(--x)', ['.q']]])],
    ['--f', defs([['#000', ['.p']], ['#fff', ['[data-theme="dark"] .p']]])],
    ['--g', defs([['linear-gradient(var(--x), var(--x)), #fff', ['.r']]])],
    ['--c1', defs([['var(--c2)', ['.a']]])],
    ['--c2', defs([['var(--c1)', ['.a']]])],
  ]);
  assert.deepEqual(variantsDAlies('var(--x, #000)', alies), ['#777', '#000']);
  assert.deepEqual(variantsDAlies('var(--y)', alies), ['#777']);
  assert.deepEqual(variantsDAlies('var(--f)', alies, 'clar'), ['#000']);
  assert.deepEqual(variantsDAlies('var(--f)', alies, 'fosc'), ['#000', '#fff']);
  assert.deepEqual(variantsDAlies('var(--sdp-text)', alies), ['var(--sdp-text)']);
  assert.deepEqual(variantsDAlies('var(--desconegut, #123)', alies), ['var(--desconegut, #123)']);
  assert.throws(() => variantsDAlies('var(--g)', alies), /niat/);
  assert.throws(() => variantsDAlies('var(--c1)', alies), /Cicle/);
});

/* Gauntlet v1.2.14 R2b · L'àmbit de tema es decidix per a cada selector de la llista: una llista mixta o un selector de
   només clar (`:not([data-theme="dark"])`) també aplica en clar. Mesurar de més, mai de menys. */
test('selectorAplicaAlMode: llistes mixtes i :not() no amaguen el mode clar', () => {
  assert.equal(selectorAplicaAlMode('[data-theme="dark"] .x', 'clar'), false);
  assert.equal(selectorAplicaAlMode('[data-theme="dark"] .x', 'fosc'), true);
  assert.equal(selectorAplicaAlMode('.x--invers, [data-theme="dark"] .x', 'clar'), true);
  assert.equal(selectorAplicaAlMode(':root:not([data-theme="dark"]) .x', 'clar'), true);
  assert.equal(selectorAplicaAlMode(':host(:not([data-theme="dark"])) .x', 'clar'), true);
  assert.equal(selectorAplicaAlMode('[data-contrast="bancal"] .x', 'clar'), false);
  assert.equal(selectorAplicaAlMode('[data-contrast="bancal"] .x', 'bancal fosc'), true);
  assert.equal(selectorAplicaAlMode('.a, .b', 'fosc'), true);
  const alies = new Map([['--t', new Map([['var(--sdp-text-cos)', ['.c']], ['#fafafa', ['.c--invers, [data-theme="dark"] .c']]])]]);
  assert.deepEqual(variantsDAlies('var(--t)', alies, 'clar'), ['var(--sdp-text-cos)', '#fafafa']);
});
