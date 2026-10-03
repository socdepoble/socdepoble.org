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

  it('carrega i renderitza tots els espècimens asíncrons', async () => {
    expect(Object.keys(SPECIMEN_MODULES)).toHaveLength(Object.keys(CATALOG_DETAIL_LOADERS).length);

    const moduls = await Promise.all(
      Object.entries(SPECIMEN_MODULES).map(async ([ruta, importa]) => [ruta, await importa()])
    );

    for (const [ruta, modul] of moduls) {
      try {
        const Especimen = modul.default;
        const vista = render(
          <MemoryRouter>
            <Especimen />
          </MemoryRouter>
        );
        await waitFor(() => {
          expect(vista.container.firstElementChild, ruta).not.toBeNull();
        });
        vista.unmount();
      } catch (e) {
        throw new Error(`L’espècimen ${ruta} ha fallat: ${e.message}`);
      }
    }
    expect(Object.keys(CATALOG_DETAIL_LOADERS).length).toBeGreaterThan(20);
    /* La importació de tots els espècimens compta dins del temps de la prova:
       amb la màquina carregada (altres proves en paral·lel) passava de 15 s. */
  }, 45_000);
});
