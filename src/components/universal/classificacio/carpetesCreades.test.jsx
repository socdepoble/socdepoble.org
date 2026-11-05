import React from 'react';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { BotoneraClassificacio } from './BotoneraClassificacio.jsx';
import {
  CLAU_CARPETES_CREADES, _reiniciaCarpetesCreades, carpetesCreades, desaCarpetaCreada,
  normalitzaCarpetesCreades, resolCarpeta, subscriuCarpetesCreades, useCarpetesCreades,
} from './carpetesCreades.js';
import { STORAGE_PREFIX } from '../../../config/storage.js';

/* Onada R6 · Bloc 2 (P1-d) · Una carpeta creada en línia sobreviu a la
   recàrrega, i dos noms diferents no comparteixen mai l'id. «Recarregar» és
   oblidar la memòria del mòdul (_reiniciaCarpetesCreades) i tornar a muntar:
   el que queda és el que hi ha al storage. */
const CLAU = STORAGE_PREFIX + CLAU_CARPETES_CREADES;
const SERIE = [{ id: 'f-mur', nom: 'Mur', parentId: null }];

beforeEach(() => {
  localStorage.clear();
  _reiniciaCarpetesCreades();
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  _reiniciaCarpetesCreades();
});

const pinta = (props = {}) => render(
  <BotoneraClassificacio
    enLinia={{ carpetaId: 'f-mur', carpetes: SERIE, ambitCarpetes: 'notes-ambit-a', ...props }}
    onObri={vi.fn()}
  />
);
const creaCarpeta = (nom) => {
  const camp = screen.getByLabelText('Crear nova carpeta');
  fireEvent.change(camp, { target: { value: nom } });
  fireEvent.keyDown(camp, { key: 'Enter' });
};
const opcionsCarpeta = () => within(screen.getByLabelText('Carpeta')).getAllByRole('option').map((o) => [o.value, o.textContent]);

test('P1-d · «Fèstes» i «Festes» tenen ids diferents; el mateix nom (caixa i espais a banda) reutilitza la carpeta', () => {
  const primera = resolCarpeta('Fèstes', SERIE);
  expect(primera).toEqual({ id: 'f-festes', nom: 'Fèstes', nova: true });
  const ambUna = [...SERIE, primera];
  expect(resolCarpeta('Festes', ambUna)).toEqual({ id: 'f-festes-2', nom: 'Festes', nova: true });
  const ambDues = [...ambUna, { id: 'f-festes-2', nom: 'Festes' }];
  expect(resolCarpeta('  FÈSTES ', ambDues)).toEqual({ id: 'f-festes', nom: 'Fèstes', nova: false });
  expect(resolCarpeta('festes', ambDues)).toEqual({ id: 'f-festes-2', nom: 'Festes', nova: false });
  expect(resolCarpeta('Festes!', ambDues)).toEqual({ id: 'f-festes-3', nom: 'Festes!', nova: true });
  expect(resolCarpeta('mur', SERIE)).toEqual({ id: 'f-mur', nom: 'Mur', nova: false });
  expect(resolCarpeta('   ', SERIE)).toBeNull();
});

test('P1-d · la carpeta creada a la botonera persistix, torna després de recarregar i no es duplica', async () => {
  const onCanviaCarpeta = vi.fn();
  pinta({ onCanviaCarpeta });
  /* Bloc 5 · La creació és asíncrona (creaCarpetaCreada): s'espera cada una abans de la següent. */
  creaCarpeta('Fèstes');
  await waitFor(() => expect(onCanviaCarpeta).toHaveBeenLastCalledWith('f-festes', 'Fèstes'));
  creaCarpeta('Festes');
  await waitFor(() => expect(onCanviaCarpeta).toHaveBeenLastCalledWith('f-festes-2', 'Festes'));
  creaCarpeta(' fèstes ');
  await waitFor(() => expect(onCanviaCarpeta).toHaveBeenCalledTimes(3));
  expect(onCanviaCarpeta).toHaveBeenLastCalledWith('f-festes', 'Fèstes');
  expect(carpetesCreades('notes-ambit-a').map((c) => c.id)).toEqual(['f-festes', 'f-festes-2']);

  // Recàrrega simulada: fora la memòria i el component; queda el storage.
  cleanup();
  _reiniciaCarpetesCreades();
  pinta({ onCanviaCarpeta: vi.fn() });
  expect(opcionsCarpeta()).toEqual(expect.arrayContaining([['f-festes', 'Fèstes'], ['f-festes-2', 'Festes']]));
  expect(JSON.parse(localStorage.getItem(CLAU)).ambits['notes-ambit-a']).toEqual([
    { id: 'f-festes', nom: 'Fèstes' }, { id: 'f-festes-2', nom: 'Festes' },
  ]);
});

test('P1-d · un altre àmbit (un altre compte o tenant) no hereta les carpetes; desar és idempotent', () => {
  expect(desaCarpetaCreada('notes-ambit-a', { id: 'f-hort', nom: 'Hort' })).toBe(true);
  expect(desaCarpetaCreada('notes-ambit-a', { id: 'f-hort', nom: 'Un altre nom' })).toBe(false);
  expect(carpetesCreades('notes-ambit-a')).toEqual([{ id: 'f-hort', nom: 'Hort' }]);
  expect(carpetesCreades('notes-ambit-b')).toEqual([]);
  _reiniciaCarpetesCreades();
  pinta({ ambitCarpetes: 'notes-ambit-b' });
  expect(opcionsCarpeta().map(([valor]) => valor)).not.toContain('f-hort');
});

test('P1-d · un storage brut o estrany es descarta sense trencar res', () => {
  expect(normalitzaCarpetesCreades('brossa').ambits).toEqual({});
  expect(normalitzaCarpetesCreades({ v: 1, ambits: { a: [{ id: 'no-f', nom: 'X' }, { id: 'f-ok', nom: ' ' }, { id: 'f-bo', nom: 'Bo' }, { id: 'f-bo', nom: 'Repetit' }] } }).ambits)
    .toEqual({ a: [{ id: 'f-bo', nom: 'Bo' }] });
  localStorage.setItem(CLAU, '{no és json');
  _reiniciaCarpetesCreades();
  expect(carpetesCreades('qualsevol')).toEqual([]);
  expect(desaCarpetaCreada('__proto__', { id: 'f-proto', nom: 'Proto' })).toBe(true);
  expect(carpetesCreades('__proto__')).toEqual([{ id: 'f-proto', nom: 'Proto' }]);
  expect(Object.prototype).not.toHaveProperty('f-proto');
});

test('P1-d · àrbitre · desar no esborra les carpetes que una altra pestanya ha desat mentrestant', () => {
  expect(desaCarpetaCreada('notes-ambit-a', { id: 'f-hort', nom: 'Hort' })).toBe(true);
  // Una altra pestanya escriu al storage; esta conserva la memòria vella.
  const altra = JSON.parse(localStorage.getItem(CLAU));
  altra.ambits['notes-ambit-a'].push({ id: 'f-vinya', nom: 'Vinya' });
  localStorage.setItem(CLAU, JSON.stringify(altra));
  expect(desaCarpetaCreada('notes-ambit-a', { id: 'f-olivera', nom: 'Olivera' })).toBe(true);
  _reiniciaCarpetesCreades();
  expect(carpetesCreades('notes-ambit-a').map((c) => c.id)).toEqual(['f-hort', 'f-vinya', 'f-olivera']);
});

/* D-R6-2 (Onada R6, Bloc 3) · Una altra pestanya desa una carpeta: el
   navegador ho avisa amb un StorageEvent i esta la veu sense recarregar. */
const altraPestanyaDesa = (ambit, carpetes) => {
  const valor = JSON.stringify({ v: 1, ambits: { [ambit]: carpetes } });
  localStorage.setItem(CLAU, valor);
  window.dispatchEvent(new StorageEvent('storage', { key: CLAU, newValue: valor }));
};

test('D-R6-2 · una carpeta desada en una altra pestanya arriba a l’instant, sense recarregar', () => {
  const { result, unmount } = renderHook(() => useCarpetesCreades('notes-ambit-a'));
  expect(result.current).toEqual([]);
  act(() => { altraPestanyaDesa('notes-ambit-a', [{ id: 'f-hort', nom: 'Hort' }]); });
  expect(result.current).toEqual([{ id: 'f-hort', nom: 'Hort' }]);
  unmount();
});

test('D-R6-2 · una sola escolta storage: només la clau de carpetes (o un buidat) avisa, i se’n va amb l’últim oient', () => {
  const afig = vi.spyOn(window, 'addEventListener');
  const lleva = vi.spyOn(window, 'removeEventListener');
  const a = vi.fn();
  const b = vi.fn();
  const fiA = subscriuCarpetesCreades(a);
  const fiB = subscriuCarpetesCreades(b);
  expect(afig.mock.calls.filter(([tipus]) => tipus === 'storage')).toHaveLength(1);
  carpetesCreades('notes-ambit-a');
  window.dispatchEvent(new StorageEvent('storage', { key: `${STORAGE_PREFIX}una-altra-clau`, newValue: '1' }));
  expect(a).not.toHaveBeenCalled();
  localStorage.clear();
  window.dispatchEvent(new StorageEvent('storage', { key: null }));
  expect(a).toHaveBeenCalledTimes(1);
  expect(b).toHaveBeenCalledTimes(1);
  fiA();
  expect(lleva.mock.calls.filter(([tipus]) => tipus === 'storage')).toHaveLength(0);
  fiB();
  expect(lleva.mock.calls.filter(([tipus]) => tipus === 'storage')).toHaveLength(1);
  altraPestanyaDesa('notes-ambit-a', [{ id: 'f-vinya', nom: 'Vinya' }]);
  expect(a).toHaveBeenCalledTimes(1);
  afig.mockRestore();
  lleva.mockRestore();
});
