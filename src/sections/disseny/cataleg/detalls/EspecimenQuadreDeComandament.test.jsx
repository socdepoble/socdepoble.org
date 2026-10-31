/* Ordre del Mestre (31-10-2026, 00:20, prompt 2208, T3.1) · El Quadre de
   Comandament té fitxa al catàleg (Pedra Seca §9): registre «viu», ítem del
   manifest i carregador; l'espècimen pinta la peça de veres, sense h1 ni
   style=, i el detall de cada barra respon al ratolí i al toc. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { CATALOG_ITEMS } from '../manifest.js';
import { CATALOG_DETAIL_LOADERS } from '../detailRegistry.jsx';
import { REGISTRE } from '../registre.js';
import EspecimenQuadreDeComandament from './EspecimenQuadreDeComandament.jsx';

let errors;
beforeEach(() => { errors = vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => {
  const crides = errors.mock.calls.map((c) => String(c[0]).slice(0, 200));
  errors.mockRestore();
  cleanup();
  expect(crides).toEqual([]);
});

test('el catàleg el coneix: registre «viu» de PedraSeca, ítem del manifest i carregador', () => {
  expect(REGISTRE.find((e) => e.nom === 'QuadreDeComandament')).toMatchObject({
    fitxer: 'PedraSeca/organismes/QuadreDeComandament.jsx', estat: 'viu'
  });
  expect(REGISTRE.find((e) => e.nom === 'QuadreDeComandament').fora).toBeUndefined();
  expect(CATALOG_ITEMS.find((i) => i.id === 'fonaments-quadre-comandament'))
    .toMatchObject({ detailKey: 'fonaments/quadre-comandament', status: 'viu', icon: '🕹️' });
  expect(CATALOG_DETAIL_LOADERS['fonaments/quadre-comandament']).toBeTruthy();
});

test('l’espècimen pinta la peça real (dues sèries, una i una amb negatius), sense h1 ni style=', () => {
  const { container } = render(<EspecimenQuadreDeComandament />);
  expect(container.querySelectorAll('.sdp-quadre')).toHaveLength(3);
  expect(container.querySelector('h1')).toBeNull();
  expect(container.querySelector('[style]')).toBeNull();
  expect(container.querySelector('.sdp-especimen__nom').textContent).toBe('QuadreDeComandament');
  expect(container.querySelector('table caption').textContent).toBe('Contracte');
  const visites = screen.getByRole('figure', { name: 'Visitants i vistes de cada hora (mostra)' });
  expect(within(visites).getAllByRole('button')).toHaveLength(24);
  fireEvent.pointerEnter(within(visites).getAllByRole('button')[13], { pointerType: 'mouse' });
  expect(visites.querySelector('.sdp-quadre__detall').textContent).toBe('13:00 h: 40 vistes · 11 visitants');
  const caixa = screen.getByRole('figure', { name: 'Vendes de cada hora (mostra)' });
  expect(caixa.querySelector('.sdp-quadre__barra--davant')).toBeNull();
  fireEvent.click(within(caixa).getAllByRole('button')[13]);
  expect(caixa.querySelector('.sdp-quadre__detall').textContent).toMatch(/^13:00 h: 158,00\s€$/);
  // Gauntlet f8 (F8-CRIT-03) · La gestoria: els mesos en negatiu baixen des del zero.
  const any = screen.getByRole('figure', { name: 'Resultat de cada mes (mostra)' });
  expect(within(any).getAllByRole('button')).toHaveLength(12);
  expect(any.querySelector('.sdp-quadre__barres--negatius .sdp-quadre__zero')).toBeTruthy();
  expect(within(any).getAllByRole('button')[1].querySelector('svg.sdp-quadre__regio[y] rect')).toBeTruthy();
  fireEvent.click(within(any).getAllByRole('button')[7]);
  expect(any.querySelector('.sdp-quadre__detall').textContent).toMatch(/^agost: -760,00\s€$/);
});
