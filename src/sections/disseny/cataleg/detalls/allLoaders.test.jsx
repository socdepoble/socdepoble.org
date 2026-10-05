import { cleanup, render, waitFor } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from '../../../../app/contexts/RouterContext.jsx';
import { CATALOG_DETAIL_LOADERS } from '../detailRegistry.jsx';
import { CATALOG_ITEMS } from '../manifest.js';

/* Un espècimen pot tindre la seua prova al costat (Especimen*.test.jsx): no és un espècimen. */
const SPECIMEN_MODULES = import.meta.glob(['./Especimen*.jsx', '!./Especimen*.test.jsx']);

/* jsdom no porta ResizeObserver; la barra d'eines (T52) i altres peces reals el fan servir. */
beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
});
afterAll(() => vi.unstubAllGlobals());
afterEach(cleanup);

describe('Lazy Loaders del Catàleg', () => {
  /* T52 · paritat: cap ítem del manifest sense carregador, cap carregador orfe. */
  it('el manifest i els carregadors coincidixen', () => {
    const claus = CATALOG_ITEMS.map((item) => item.detailKey);
    expect(new Set(claus).size).toBe(claus.length);
    expect(new Set(CATALOG_ITEMS.map((item) => item.id)).size).toBe(CATALOG_ITEMS.length);
    expect(new Set(claus)).toEqual(new Set(Object.keys(CATALOG_DETAIL_LOADERS)));
  });

  it('el cens de mòduls físics coincidix amb tots els carregadors', () => {
    expect(Object.keys(SPECIMEN_MODULES)).toHaveLength(Object.keys(CATALOG_DETAIL_LOADERS).length);
    expect(Object.keys(CATALOG_DETAIL_LOADERS).length).toBeGreaterThan(20);
  });

  it.each(Object.entries(SPECIMEN_MODULES))('carrega i renderitza %s', async (ruta, importa) => {
    const modul = await importa();
    const Especimen = modul.default;
    const vista = render(<MemoryRouter><Especimen /></MemoryRouter>);
    await waitFor(() => expect(vista.container.firstElementChild, ruta).not.toBeNull());
    vista.unmount();
  });
});
