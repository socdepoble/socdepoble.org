/* O4-CLAUDE-1 (correcció A1-06 de l'àrbitre, Pedra Seca §9) · L'espècimen
   del bloc «On es publica?»: munta el BlocAmbit de veres, en línia (cap
   diàleg ni botó de desar), diu d'on penja i escriu la fitxa en el seu estat
   local, com la nota. Dades inventades. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { MemoryRouter } from '../../../../app/contexts/RouterContext.jsx';
import EspecimenBlocAmbit from './EspecimenBlocAmbit.jsx';
import { CATALOG_ITEMS, nodeUniversal } from '../manifest.js';
import { CATALOG_DETAIL_LOADERS } from '../detailRegistry.jsx';
import { REGISTRE } from '../registre.js';

afterEach(cleanup);

const pinta = () => render(<MemoryRouter><EspecimenBlocAmbit /></MemoryRouter>);

test('dos blocs de veres en línia, sense diàleg ni botons, amb el llinatge des de l’editor', () => {
  const { container } = pinta();
  const blocs = screen.getAllByRole('group', { name: 'On es publica?' });
  expect(blocs).toHaveLength(2);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(blocs.flatMap((bloc) => within(bloc).queryAllByRole('button'))).toEqual([]);
  expect(container.querySelector('#llinatge-bloc-ambit')).not.toBeNull();
  expect(container.querySelector('h1')).toBeNull();
  // El primer, una nota del Mur; el segon, la fitxa incompleta després de PUBLICAR.
  expect(within(blocs[0]).getByRole('radio', { name: 'Mur' }).checked).toBe(true);
  expect(within(blocs[1]).getByRole('radio', { name: 'Compartir cotxe' }).checked).toBe(true);
  expect(within(blocs[1]).getByLabelText(/^Lloc d’eixida/).getAttribute('aria-invalid')).toBe('true');
  expect(blocs[1].querySelector('.sdp-alerta--error').textContent).toBe('La fitxa de «Compartir cotxe» no està completa.');
});

test('triar un àmbit escriu la fitxa a l’estat de l’espècimen i el bloc la torna a pintar', () => {
  pinta();
  const bloc = screen.getAllByRole('group', { name: 'On es publica?' })[0];
  fireEvent.click(within(bloc).getByRole('radio', { name: 'Treball' }));
  expect(within(bloc).getByRole('radio', { name: 'Treball' }).checked).toBe(true);
  fireEvent.change(within(bloc).getByLabelText(/^Ofici o sector/), { target: { value: 'Forner' } });
  expect(within(bloc).getByLabelText(/^Ofici o sector/).value).toBe('Forner');
  fireEvent.click(within(bloc).getByRole('radio', { name: 'Mur' }));
  expect(within(bloc).queryByLabelText(/^Ofici o sector/)).toBeNull();
});

test('registrat: ítem formularis/ambit amb carregador, node bloc-ambit penjat de l’editor i entrada viva al registre', () => {
  const item = CATALOG_ITEMS.find((i) => i.id === 'formularis-ambit');
  expect(item?.detailKey).toBe('formularis/ambit');
  expect(typeof CATALOG_DETAIL_LOADERS['formularis/ambit']).toBe('object');
  expect(nodeUniversal('bloc-ambit')).toMatchObject({ pare: 'editor', item: 'formularis-ambit' });
  expect(REGISTRE.filter((entrada) => entrada.nom === 'BlocAmbit')).toEqual([
    { nom: 'BlocAmbit', fitxer: 'universal/ambits/BlocAmbit.jsx', pagina: 'formularis', estat: 'viu', fora: true }
  ]);
});
