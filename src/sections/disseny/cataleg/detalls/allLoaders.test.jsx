import { cleanup, render, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from '../../../../app/contexts/RouterContext.jsx';
import { CATALOG_DETAIL_LOADERS } from '../detailRegistry.jsx';

const SPECIMEN_MODULES = import.meta.glob('./Especimen*.jsx');

afterEach(cleanup);

describe('Lazy Loaders del Catàleg', () => {
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
  }, 15_000);
});
