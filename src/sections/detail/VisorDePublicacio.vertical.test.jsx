/**
 * IDEA-20 (Directiva del Mestre 261024, àudio 22:47; revisió adversarial
 * 261024, lent multiformat) · La portada sola d'una publicació (ranura
 * heroComponent de PageFrame) marca el seu botó quan la foto és vertical, en
 * carregar-se (naturalWidth/naturalHeight), lligat al src. Quadrades i
 * apaïsades, el DOM de sempre. La guarda la posa components.css.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { VisorDePublicacio } from './VisorDePublicacio.jsx';

afterEach(cleanup);

const DADES = Object.freeze({ titol: 'Collaret de plata', autor: 'Taller', drets: null, poble: null, article: { sectionId: 'mur', id: 'p1' } });
const carrega = (img, amplada, alcada) => {
  Object.defineProperty(img, 'naturalWidth', { configurable: true, value: amplada });
  Object.defineProperty(img, 'naturalHeight', { configurable: true, value: alcada });
  fireEvent.load(img);
};

test('una portada vertical marca el botó; una quadrada o una apaïsada, no; i una altra foto torna a començar', () => {
  const { container, rerender } = render(<VisorDePublicacio fotos={['/assets/fotos/vertical.webp']} dades={DADES} etiquetaObri="Veure la imatge" />);
  const boto = () => container.querySelector('button.sdp-visor__obridor');
  expect(boto().className).toBe('sdp-visor__obridor');
  carrega(boto().querySelector('img'), 900, 1600);
  expect(boto().className).toBe('sdp-visor__obridor sdp-visor__obridor--vertical');
  rerender(<VisorDePublicacio fotos={['/assets/fotos/panoramica.webp']} dades={DADES} etiquetaObri="Veure la imatge" />);
  expect(boto().className).toBe('sdp-visor__obridor');
  carrega(boto().querySelector('img'), 2100, 900);
  expect(boto().className).toBe('sdp-visor__obridor');
  rerender(<VisorDePublicacio fotos={['/assets/fotos/quadrada.webp']} dades={DADES} etiquetaObri="Veure la imatge" />);
  carrega(boto().querySelector('img'), 1200, 1200);
  expect(boto().className).toBe('sdp-visor__obridor');
});

test('la guarda vertical és a la capa components, amb tokens i el límit del consens', () => {
  const css = readFileSync(path.join(process.cwd(), 'src/css/components.css'), 'utf8');
  const bloc = css.slice(css.indexOf('.hero-image .sdp-visor__obridor--vertical > img'));
  expect(bloc.slice(0, bloc.indexOf('}'))).toMatch(/max-height:\s*min\(75vh,\s*720px\)/);
  expect(css).toMatch(/\.hero-image \.sdp-visor__obridor--vertical \{ background: var\(--sdp-fons-app\); \}/);
});
