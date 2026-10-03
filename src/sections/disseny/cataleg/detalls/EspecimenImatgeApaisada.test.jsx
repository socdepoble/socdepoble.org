/* Ordre del Mestre (261003, tancament del Lector RSS) · l'espècimen de
   l'EXCEPCIÓ 16:9 a la regla 1:1 de Pedra Seca (§8): el catàleg el coneix i
   pinta les peces de veres amb la variant panoràmica, en Revista i en
   Targetes, sense h1 ni style= i sense cap avís de React. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from '../../../../app/contexts/RouterContext.jsx';
import { CATALOG_ITEMS } from '../manifest.js';
import { CATALOG_DETAIL_LOADERS } from '../detailRegistry.jsx';
import EspecimenImatgeApaisada from './EspecimenImatgeApaisada.jsx';

let errors;
beforeEach(() => { errors = vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => {
  const crides = errors.mock.calls.map((c) => String(c[0]).slice(0, 200));
  errors.mockRestore();
  cleanup();
  expect(crides).toEqual([]);
});

it('el catàleg el coneix: ítem viu del manifest, a Fonaments, i carregador', () => {
  expect(CATALOG_ITEMS.find((i) => i.id === 'fonaments-imatge-apaisada'))
    .toMatchObject({ categoryIds: ['fonaments'], detailKey: 'fonaments/imatge-apaisada', status: 'viu' });
  expect(CATALOG_DETAIL_LOADERS['fonaments/imatge-apaisada']).toBeTruthy();
});

it('Revista i Targetes amb la variant: la imatge pròpia i el marcador, dins de .sdp-panoramica', () => {
  const arrel = render(<MemoryRouter><EspecimenImatgeApaisada /></MemoryRouter>).container;
  expect(arrel.querySelector('h1')).toBeNull();
  expect(arrel.querySelector('[style]')).toBeNull();
  expect(arrel.querySelector('.sdp-especimen__nom').textContent).toBe('Imatge apaïsada 16:9 · excepció del Lector');
  expect(arrel.querySelector('table caption').textContent).toBe('Contracte');
  expect(arrel.textContent).toContain('EXCEPCIÓ a la regla 1:1 (Pedra Seca §8), autoritzada pel Mestre el 261003');
  const totes = (selector) => [...arrel.querySelectorAll(selector)];

  expect(totes('.sdp-panoramica .sdp-llista-articles__quadrat > img')).toHaveLength(1);
  expect(totes('.sdp-panoramica .sdp-llista-articles__quadrat > .sdp-marca-article')).toHaveLength(2);
  expect(totes('.sdp-llista-articles__quadrat').every((quadrat) => quadrat.closest('.sdp-panoramica'))).toBe(true);

  fireEvent.click(screen.getByRole('button', { name: 'Targetes' }));
  expect(totes('.sdp-panoramica .sdp-rajola__media > img')).toHaveLength(1);
  expect(totes('.sdp-panoramica .sdp-rajola__media > .sdp-marca-article')).toHaveLength(2);
  expect(totes('.sdp-rajola').every((rajola) => rajola.closest('.sdp-panoramica'))).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: /^El correfoc/ }));
  expect(screen.getByRole('status').textContent).toBe('Obriries «El correfoc passarà pel barranc».');
});
