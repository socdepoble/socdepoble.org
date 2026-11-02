/**
 * IDEA-42 (B7h, marató 261101_2143; spec B7-PEDRA §2.9b) · `portadaSencera`
 * de PageFrame: una portada VERTICAL de lectura (ImatgeDePortada) porta també
 * hero-image--sencera i layout.css li lleva el límit d'alçada. Una quadrada o
 * una apaïsada, la ranura heroComponent i tota portada sense la prop (o amb un
 * valor que no és true), el DOM de sempre. Cas «--sencera» de
 * PageFrame.hero.test.jsx, en un fitxer propi del carril.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { PageFrame } from './PageFrame.jsx';

vi.mock('../../config/assetResolver', () => ({ resolveAsset: vi.fn((uri) => uri) }));
vi.mock('../PedraSeca/hooks/useAccions.js', () => ({ useAccions: () => ({}) }));
afterEach(cleanup);

const portada = (props) => render(<PageFrame title="Aplec" authorName="Pepa" heroImage="/assets/cartell.webp" {...props} />)
  .container.querySelector('.hero-image img');
const marc = (img) => img.closest('.hero-image');
const carrega = (img, amplada, alcada) => {
  Object.defineProperty(img, 'naturalWidth', { configurable: true, value: amplada });
  Object.defineProperty(img, 'naturalHeight', { configurable: true, value: alcada });
  act(() => { fireEvent.load(img); });
};

test.each([[723, 1024, 'hero-image hero-image--vertical hero-image--sencera'], [1200, 1200, 'hero-image'], [1600, 900, 'hero-image']])(
  'amb portadaSencera i la mida declarada (%s × %s): %s',
  (heroWidth, heroHeight, classe) => {
    expect(marc(portada({ heroWidth, heroHeight, portadaSencera: true })).className).toBe(classe);
  }
);

test('sense mida declarada, es decidix en carregar, com la vertical', () => {
  const img = portada({ portadaSencera: true });
  expect(marc(img).className).toBe('hero-image');
  carrega(img, 723, 1024);
  expect(marc(img).className).toBe('hero-image hero-image--vertical hero-image--sencera');
});

test.each([undefined, false, 'true', 1])('portadaSencera %s: la vertical de sempre', (portadaSencera) => {
  expect(marc(portada({ heroWidth: 723, heroHeight: 1024, portadaSencera })).className).toBe('hero-image hero-image--vertical');
});

test('la ranura heroComponent no porta mai la classe', () => {
  const { container } = render(<PageFrame title="Aplec" authorName="Pepa" heroImage="/assets/cartell.webp" heroWidth={723} heroHeight={1024}
    portadaSencera topBarData={{ heroComponent: <div data-testid="portada-propia" /> }} />);
  expect(container.querySelector('.hero-image').className).toBe('hero-image');
});

test('layout.css: la regla lleva el límit i va just després de la guarda vertical (la mateixa capa i especificitat)', () => {
  const css = readFileSync(path.join(process.cwd(), 'src/css/layout.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const guarda = css.indexOf('.hero-image--vertical img {');
  const regla = css.indexOf('.hero-image--sencera img { max-height: none; }');
  expect(guarda).toBeGreaterThan(-1);
  expect(regla).toBeGreaterThan(guarda);
  expect(css.slice(guarda, regla)).toMatch(/max-width:\s*100%;[\s\S]*max-height:\s*min\(75vh,\s*720px\);/);
  expect(css.slice(guarda, regla)).not.toMatch(/@layer|@media|@container/);
});
