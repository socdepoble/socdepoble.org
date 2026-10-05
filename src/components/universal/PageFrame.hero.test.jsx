import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { resolveAsset } from '../../config/assetResolver';
import { PageFrame } from './PageFrame.jsx';

vi.mock('../../config/assetResolver', () => ({ resolveAsset: vi.fn((uri) => uri) }));
vi.mock('../PedraSeca/hooks/useAccions.js', () => ({ useAccions: () => ({}) }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.mocked(resolveAsset).mockImplementation((uri) => uri);
});

const portada = (props) => render(<PageFrame title="Portada" authorName="Pepa" heroImage="/assets/portada.jpg" {...props} />)
  .container.querySelector('.hero-image img');

test('la portada reserva la proporció declarada sense estils en línia i continua passant pel resolver', () => {
  vi.mocked(resolveAsset).mockImplementation((uri) => uri === '/assets/portada.jpg' ? '/amfitrio/assets/portada.jpg' : uri);
  const img = portada({ heroWidth: 1200, heroHeight: 630, heroAlt: 'El poble' });
  expect(img.getAttribute('src')).toBe('/amfitrio/assets/portada.jpg');
  expect(resolveAsset).toHaveBeenCalledWith('/assets/portada.jpg');
  expect(img.getAttribute('alt')).toBe('El poble');
  expect(img.getAttribute('width')).toBe('1200');
  expect(img.getAttribute('height')).toBe('630');
  expect(img.hasAttribute('style')).toBe(false);
  expect(img.hasAttribute('fetchpriority')).toBe(false);
});

test.each([
  [undefined, undefined], [1200, undefined], [undefined, 630], [0, 630], [-1, 630],
  [1200, 0], [1200, -1], ['1200', 630], [1200, '630'], [null, 630], [NaN, 630], [1200, Infinity]
])('un parell absent o invàlid (%s, %s) no inventa dimensions', (heroWidth, heroHeight) => {
  const img = portada({ heroWidth, heroHeight });
  expect(img.hasAttribute('width')).toBe(false);
  expect(img.hasAttribute('height')).toBe(false);
});

test('topBarData porta el seu parell i la prioritat high explícita', () => {
  const img = portada({
    heroWidth: 1200, heroHeight: 630,
    topBarData: { heroImage: '/assets/una-altra.jpg', heroWidth: 640, heroHeight: 480, heroFetchPriority: 'high' }
  });
  expect(img.getAttribute('src')).toBe('/assets/una-altra.jpg');
  expect(img.getAttribute('width')).toBe('640');
  expect(img.getAttribute('height')).toBe('480');
  expect(img.getAttribute('fetchpriority')).toBe('high');
});

test('un parell incomplet de topBarData no es barreja amb les dimensions d’una altra portada', () => {
  const img = portada({ heroWidth: 1200, heroHeight: 630, topBarData: { heroWidth: 640 } });
  expect(img.hasAttribute('width')).toBe(false);
  expect(img.hasAttribute('height')).toBe(false);
});

test('una altra imatge de topBarData necessita les seues dimensions; no hereta la proporció de la portada anterior', () => {
  const img = portada({ heroWidth: 1200, heroHeight: 630, topBarData: { heroImage: '/assets/una-altra.jpg' } });
  expect(img.getAttribute('src')).toBe('/assets/una-altra.jpg');
  expect(img.hasAttribute('width')).toBe(false);
  expect(img.hasAttribute('height')).toBe(false);
});

test('topBarData amb la mateixa imatge conserva el parell declarat de la portada', () => {
  const img = portada({ heroWidth: 1200, heroHeight: 630, topBarData: { heroImage: '/assets/portada.jpg' } });
  expect(img.getAttribute('width')).toBe('1200');
  expect(img.getAttribute('height')).toBe('630');
});

test.each([undefined, null, true, 'HIGH', 'auto', 'low'])('la prioritat %s no opta la portada a high', (heroFetchPriority) => {
  expect(portada({ heroFetchPriority }).hasAttribute('fetchpriority')).toBe(false);
});

test('una prop high explícita opta la portada a la prioritat alta', () => {
  expect(portada({ heroFetchPriority: 'high' }).getAttribute('fetchpriority')).toBe('high');
});

test('heroComponent conserva la ranura sense imatge automàtica ni atributs injectats', () => {
  const { container } = render(<PageFrame title="Editor" authorName="Pepa"
    heroImage="/assets/portada.jpg" heroWidth={1200} heroHeight={630} heroFetchPriority="high"
    topBarData={{ heroComponent: <div data-testid="portada-propia">Portada de l’editor</div> }} />);
  expect(container.querySelector('.hero-image img')).toBeNull();
  expect(container.querySelector('.hero-image [data-testid="portada-propia"]').outerHTML)
    .toBe('<div data-testid="portada-propia">Portada de l’editor</div>');
  expect(resolveAsset).not.toHaveBeenCalledWith('/assets/portada.jpg');
});
