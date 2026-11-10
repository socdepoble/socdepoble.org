/* R16-S (P0-79 / IDEA-210) · La fitxa personal: el cercador dels municipis de
   l'INE (el JSON de veres, en el seu tros diferit) alimenta «El teu poble» i
   «Altres pobles», amb els homònims distingits per la província i la cita de
   la font a la vista; els altres pobles s'afigen i es lleven sense tocar el
   principal; una cerca vella que arriba tard no xafa la nova; i tot el text
   nou ix en la llengua de la interfície. Noms de persona sintètics. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import GL from '../../config/idiomes/gl.js';

const mocks = vi.hoisted(() => ({ cerca: null, llengua: null }));
vi.mock('../pobles/nomenclatorIne.js', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, cercaMunicipisIne: (...args) => (mocks.cerca ?? original.cercaMunicipisIne)(...args) };
});
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActionsOpcional: () => (mocks.llengua ? { t: (clau, reserva) => mocks.llengua[clau] ?? reserva } : null),
}));
import { ETIQUETA_POBLE, IdentitatAlPoble } from './IdentitatAlPoble.jsx';

afterEach(() => {
  cleanup();
  mocks.cerca = null;
  mocks.llengua = null;
});

const CATALEG = ['La Torre de les Maçanes', 'Penàguila', 'Benifallim'];
const pinta = (props = {}) => render(
  <IdentitatAlPoble usuari="annaperez" confirmat poble="La Torre de les Maçanes" pobles={CATALEG}
    onDesaUsuari={vi.fn()} onDesaPoble={vi.fn(async () => {})} {...props} />
);
const cercador = () => screen.getByRole('textbox', { name: 'Cerca entre els 8.132 municipis d’Espanya' });
const altres = () => screen.getByRole('combobox', { name: 'Altres pobles' });
const valorsDe = (selector) => within(selector).getAllByRole('option').map((opcio) => opcio.value);

test('escriure al cercador porta els municipis de l’INE a les dues llistes, els homònims amb la província', async () => {
  const desaPoble = vi.fn(async () => {});
  pinta({ onDesaPoble: desaPoble });
  // La cita de la font és a la vista, amb el cercador.
  expect(screen.getByText(/Font: elaboració pròpia amb dades de l’INE \(www\.ine\.es\), relació de municipis a 1 de gener de 2026\./)).toBeTruthy();
  expect(valorsDe(screen.getByLabelText(ETIQUETA_POBLE))).not.toContain('Sada (Navarra)');

  fireEvent.focus(cercador());
  fireEvent.change(cercador(), { target: { value: 'sada' } });
  await waitFor(() => expect(valorsDe(screen.getByLabelText(ETIQUETA_POBLE))).toContain('Sada (Navarra)'));
  const principal = valorsDe(screen.getByLabelText(ETIQUETA_POBLE));
  expect(principal).toContain('Sada (A Coruña)');
  expect(principal).not.toContain('Sada');
  expect(principal).toContain('Penàguila');
  expect(valorsDe(altres())).toContain('Sada (A Coruña)');

  await act(async () => { fireEvent.change(screen.getByLabelText(ETIQUETA_POBLE), { target: { value: 'Sada (Navarra)' } }); });
  expect(desaPoble).toHaveBeenCalledWith('Sada (Navarra) · La Torre de les Maçanes');

  // Buidar el cercador torna les llistes al catàleg.
  fireEvent.change(cercador(), { target: { value: '' } });
  await waitFor(() => expect(valorsDe(screen.getByLabelText(ETIQUETA_POBLE))).not.toContain('Sada (A Coruña)'));
});

test('una cerca vella que arriba tard no xafa la de l’última consulta', async () => {
  const pendents = new Map();
  mocks.cerca = (consulta) => new Promise((resol) => { pendents.set(consulta, resol); });
  pinta();
  fireEvent.change(cercador(), { target: { value: 'bu' } });
  fireEvent.change(cercador(), { target: { value: 'busot' } });
  await act(async () => { pendents.get('busot')([{ valor: 'Busot' }]); });
  await act(async () => { pendents.get('bu')([{ valor: 'Bustarviejo' }]); });
  const valors = valorsDe(screen.getByLabelText(ETIQUETA_POBLE));
  expect(valors).toContain('Busot');
  expect(valors).not.toContain('Bustarviejo');
});

test('afegir un altre poble el posa darrere; llevar-lo el trau, i el principal no es pot llevar', async () => {
  const desaPoble = vi.fn(async () => {});
  pinta({ poble: 'La Torre de les Maçanes · Penàguila', onDesaPoble: desaPoble });
  // Els triats no s'oferixen per a afegir.
  expect(valorsDe(altres())).toEqual(['', 'Benifallim']);
  await act(async () => { fireEvent.change(altres(), { target: { value: 'Benifallim' } }); });
  expect(desaPoble).toHaveBeenLastCalledWith('La Torre de les Maçanes · Penàguila · Benifallim');

  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Lleva Penàguila' })); });
  expect(desaPoble).toHaveBeenLastCalledWith('La Torre de les Maçanes');
  expect(screen.queryByRole('button', { name: 'Lleva La Torre de les Maçanes' })).toBeNull();
});

test('sense cap poble desat, el nou va darrere del preseleccionat; amb un de sol, res a llevar', async () => {
  const desaPoble = vi.fn(async () => {});
  pinta({ poble: '', onDesaPoble: desaPoble });
  expect(screen.queryByRole('button', { name: /^Lleva / })).toBeNull();
  await act(async () => { fireEvent.change(altres(), { target: { value: 'Penàguila' } }); });
  expect(desaPoble).toHaveBeenCalledWith('La Torre de les Maçanes · Penàguila');
});

test('en gallec, els textos nous i la cita de la font ixen en gallec', () => {
  mocks.llengua = GL;
  pinta({ poble: 'La Torre de les Maçanes · Penàguila' });
  expect(screen.getByRole('textbox', { name: GL['section.onboarding.identitatPoble.etiquetaCercaIne'] })).toBeTruthy();
  expect(screen.getByRole('combobox', { name: GL['section.onboarding.identitatPoble.etiquetaAltresPobles'] })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Quita Penàguila' })).toBeTruthy();
  expect(screen.getByText(/Fonte: elaboración propia con datos do INE \(www\.ine\.es\)/)).toBeTruthy();
  expect(screen.queryByText(/Cerca entre els|Altres pobles|Lleva /)).toBeNull();
});
