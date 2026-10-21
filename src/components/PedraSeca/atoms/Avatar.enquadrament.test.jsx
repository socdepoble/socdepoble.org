/* Onada 6 (tasca 12) · Avatar · la variant ADDITIVA `enquadrament`: amb una
   imatge i un nom de la llista tancada, dos classes més i res més; sense la
   prop, sense imatge o amb un nom que no és de la llista, el mateix DOM de
   sempre (Llei del Píxel). El CSS de la variant viu dins de @layer components
   i guanya a .sdp-avatar__imatge per especificitat. */
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Avatar, ENQUADRAMENTS_AVATAR } from './Avatar.jsx';

const SRC = '/assets/uploads/brain/xat_portada.webp';
afterEach(cleanup);

test('amb imatge i un enquadrament de la llista, les dues classes de la variant', () => {
  expect(ENQUADRAMENTS_AVATAR).toEqual(['iaia']);
  const { container } = render(<Avatar nom="IAIA MarIA" src={SRC} mida="xl" enquadrament="iaia" alt="" />);
  expect(container.firstChild.className).toBe('sdp-avatar sdp-avatar--xl sdp-avatar--enquadrat sdp-avatar--enquadrat-iaia');
  expect(container.querySelector('img.sdp-avatar__imatge').getAttribute('src')).toBe(SRC);
});

test('sense la prop, sense imatge o amb un nom que no és de la llista: el DOM de sempre', () => {
  const base = render(<Avatar nom="IAIA MarIA" src={SRC} mida="md" alt="" />).container.innerHTML;
  cleanup();
  expect(render(<Avatar nom="IAIA MarIA" src={SRC} mida="md" alt="" enquadrament="altra" />).container.innerHTML).toBe(base);
  cleanup();
  const senseImatge = render(<Avatar nom="IAIA MarIA" mida="md" enquadrament="iaia" />).container;
  expect(senseImatge.firstChild.className).toBe('sdp-avatar sdp-avatar--md');
  expect(senseImatge.textContent).toContain('IM');
});

test('el CSS de la variant: dins de @layer components, amb especificitat sobre .sdp-avatar__imatge i sense cap estil fora del Baseline', () => {
  const css = readFileSync(path.join(process.cwd(), 'src/css/modules.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const base = css.indexOf('.sdp-avatar__imatge {');
  const variant = css.indexOf('.sdp-avatar--enquadrat .sdp-avatar__imatge {');
  const iaia = css.indexOf('.sdp-avatar--enquadrat-iaia .sdp-avatar__imatge {');
  expect(base).toBeGreaterThan(-1);
  expect(variant).toBeGreaterThan(base);
  expect(iaia).toBeGreaterThan(variant);
  /* El primer bloc @layer components de modules.css tanca abans de @layer legacy. */
  expect(iaia).toBeLessThan(css.indexOf('@layer legacy {'));
  expect(css).toMatch(/\.sdp-avatar--enquadrat \{ position: relative; overflow: hidden; \}/);
  expect(css).not.toMatch(/object-view-box/);
});
