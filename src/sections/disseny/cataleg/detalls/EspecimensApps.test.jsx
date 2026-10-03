/* Fase 0 de les apps El Bar i Salut (Pedra Seca §9) · els espècimens de
   Rajola, TeclatNumeric, LiniaDelTemps i Histograma pinten el component de
   veres, sense h1 ni style=, i sense cap avís de React a la consola. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from '../../../../app/contexts/RouterContext.jsx';
import { CATALOG_ITEMS } from '../manifest.js';
import { CATALOG_DETAIL_LOADERS } from '../detailRegistry.jsx';
import { REGISTRE } from '../registre.js';
import EspecimenRajola from './EspecimenRajola.jsx';
import EspecimenTeclatNumeric from './EspecimenTeclatNumeric.jsx';
import EspecimenLiniaDelTemps from './EspecimenLiniaDelTemps.jsx';
import EspecimenHistograma from './EspecimenHistograma.jsx';

const pla = (text) => text.replace(/[^\S\n\r\t ]/g, ' ');
const pinta = (Especimen) => render(<MemoryRouter><Especimen /></MemoryRouter>).container;

let errors;
beforeEach(() => { errors = vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => {
  const crides = errors.mock.calls.map((c) => String(c[0]).slice(0, 200));
  errors.mockRestore();
  cleanup();
  expect(crides).toEqual([]);
});

describe('el catàleg les coneix', () => {
  it('registre «viu», ítem del manifest i carregador per a cada peça', () => {
    const esperades = [
      ['Rajola', 'formularis-rajola', 'formularis/rajola'],
      ['TeclatNumeric', 'formularis-teclat-numeric', 'formularis/teclat-numeric'],
      ['LiniaDelTemps', 'fonaments-linia-del-temps', 'fonaments/linia-del-temps'],
      ['Histograma', 'fonaments-histograma', 'fonaments/histograma']
    ];
    for (const [nom, item, clau] of esperades) {
      expect(REGISTRE.find((e) => e.nom === nom), nom).toMatchObject({ estat: 'viu' });
      expect(REGISTRE.find((e) => e.nom === nom).fora, nom).toBeUndefined();
      expect(CATALOG_ITEMS.find((i) => i.id === item), item).toMatchObject({ detailKey: clau, status: 'viu' });
      expect(CATALOG_DETAIL_LOADERS[clau], clau).toBeTruthy();
    }
  });
});

describe('els espècimens', () => {
  it.each([
    ['Rajola', EspecimenRajola, '.sdp-rajola'],
    ['TeclatNumeric', EspecimenTeclatNumeric, '.sdp-teclat'],
    ['LiniaDelTemps', EspecimenLiniaDelTemps, '.sdp-linia-temps'],
    ['Histograma', EspecimenHistograma, '.sdp-histograma']
  ])('%s: el component real, la fitxa sencera, sense h1 ni style=', (nom, Especimen, classe) => {
    const arrel = pinta(Especimen);
    expect(arrel.querySelector(classe), nom).not.toBeNull();
    expect(arrel.querySelector('h1')).toBeNull();
    expect(arrel.querySelector('[style]')).toBeNull();
    expect(arrel.querySelector('.sdp-especimen__nom').textContent).toBe(nom);
    expect(arrel.querySelector('table caption').textContent).toBe('Contracte');
  });

  it('Rajola: cada toc afig a la comanda de mostra; la categoria triada porta aria-pressed', () => {
    pinta(EspecimenRajola);
    const productes = screen.getByRole('list', { name: 'Productes de mostra' });
    fireEvent.click(within(productes).getByRole('button', { name: /^Cafè 1,20/ }));
    fireEvent.click(within(productes).getByRole('button', { name: /^Cafè 1,20/ }));
    expect(pla(screen.getByRole('status').textContent)).toBe('Comanda de mostra: 2 × Cafè · 2,40 €');
    expect(within(productes).getByRole('button', { name: 'Croissant Esgotat' }).disabled).toBe(true);
    const categories = screen.getByRole('list', { name: 'Categories de mostra' });
    fireEvent.click(within(categories).getByRole('button', { name: 'Begudes' }));
    expect(within(categories).getByRole('button', { name: 'Begudes' }).getAttribute('aria-pressed')).toBe('true');
    expect(within(categories).getByRole('button', { name: 'Cafès' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('TeclatNumeric: torna enters i Cobra diu l’enter acceptat', () => {
    const arrel = pinta(EspecimenTeclatNumeric);
    /* Els visors (<output>) també són role="status": l'avís de l'espècimen és el <p>. */
    const avis = () => pla(arrel.querySelector('p[role="status"]').textContent);
    const efectiu = screen.getByRole('group', { name: 'Efectiu lliurat' });
    for (const xifra of ['2', '0', '0', '0']) fireEvent.click(within(efectiu).getByRole('button', { name: xifra }));
    expect(avis()).toBe('Torna 2000 cèntims (20,00 €) i 250 ml.');
    fireEvent.click(within(efectiu).getByRole('button', { name: 'Cobra' }));
    expect(avis()).toBe('Has cobrat 20,00 €: el teclat ha tornat l’enter 2000.');
  });

  it('LiniaDelTemps: triar un apunt el marca i ho diu; el buit pinta l’EstatBuit', () => {
    const arrel = pinta(EspecimenLiniaDelTemps);
    fireEvent.click(screen.getByRole('button', { name: /^08:15: Tiquet cobrat/ }));
    expect(screen.getByRole('button', { name: /^08:15: Tiquet cobrat/ }).getAttribute('aria-current')).toBe('true');
    expect(screen.getByRole('status').textContent).toBe('Apunt obert: Tiquet cobrat.');
    expect(screen.getByText('Encara no hi ha cap apunt en este torn.')).toBeTruthy();
    expect(arrel.querySelectorAll('ol.sdp-linia-temps')).toHaveLength(2);
  });

  it('Histograma: dues figures amb nom, 24 i 7 barres, una destacada a cadascuna', () => {
    pinta(EspecimenHistograma);
    const hores = screen.getByRole('figure', { name: 'Per hora del dia (mostra)' });
    const setmana = screen.getByRole('figure', { name: 'Per dia de la setmana (mostra)' });
    expect(within(hores).getAllByRole('listitem')).toHaveLength(24);
    expect(within(setmana).getAllByRole('listitem')).toHaveLength(7);
    expect(hores.querySelectorAll('.sdp-histograma__columna--destacada')).toHaveLength(1);
    expect(setmana.querySelector('.sdp-histograma__columna--destacada .sdp-nomes-lector').textContent).toBe('dissabte: 22 apunts');
  });
});
