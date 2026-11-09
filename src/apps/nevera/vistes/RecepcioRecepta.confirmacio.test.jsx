import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useNavigate } from '../../../app/contexts/RouterContext';
import { ContextNevera } from './context.js';
import { RecepcioRecepta } from './RecepcioRecepta.jsx';
import { estatInicial } from '../nucli/index.js';
import { afigIngredientsRecepta } from '../trasllatRecepta.js';
afterEach(cleanup);

test('a draft from the calculation layer retains explicit2→8servings and requires the Add action', async () => {
  let estat = estatInicial();
  const draft = { v: 1, slug: 'pa-rustic', racionsBase: 2, racions: 8, linies: [{ nom: 'farina de força', text: '1 kg de farina de força', quantitat: 1, unitat: 'kg' }] };
  function Arribada() {
    const navigate = useNavigate(), [ready, setReady] = useState(false);
    return ready ? <RecepcioRecepta llista={estat.llistes[0]} /> : <button onClick={() => { navigate('/app/nevera/llista/casa?recepta=pa-rustic&racions=99', { state: { trasllatRecepta: draft } }); setReady(true); }}>Trasllada el càlcul</button>;
  }
  const context = { mode: 'editable', llegit: true, accions: { afigIngredientsRecepta(id, linies) { estat = afigIngredientsRecepta(estat, id, linies); return true; } } };
  render(<MemoryRouter rutaInicial="/receptes/pa-rustic"><ContextNevera.Provider value={context}><Arribada /></ContextNevera.Provider></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Trasllada el càlcul' }));
  await screen.findByRole('group', { name: 'Ingredients de «Pa rústic»' });
  expect(screen.getByLabelText('Racions de la recepta original').value).toBe('2');
  expect(screen.getByLabelText('Racions que vols preparar').value).toBe('8');
  expect(screen.getByLabelText('Quantitat o indicació 1').value).toBe('4 kg');
  expect(estat.llistes[0].linies).toEqual([]);
  fireEvent.click(screen.getByRole('button', { name: 'Afig els ingredients de la recepta' }));
  expect(estat.llistes[0].linies).toEqual([{ articleId: 'farina', especificacio: '4 kg' }]);
});


test('new same-route receipts reset all overrides, even identical state, and removing state clears confirmations', async () => {
  const draftA = { v: 1, slug: 'pa-rustic', racionsBase: 2, racions: 8, linies: [{ nom: 'Farina', text: '1 kg de farina', quantitat: 1, unitat: 'kg' }] };
  const draftB = { v: 1, slug: 'pa-rustic', racionsBase: 4, racions: 12, linies: [{ nom: 'Oli', text: '1 l d’oli', quantitat: 1, unitat: 'l' }] };
  const afig = vi.fn(() => true), llista = estatInicial().llistes[0];
  function Arribades() {
    const navigate = useNavigate();
    const ruta = '/app/nevera/llista/casa?recepta=pa-rustic&racions=99';
    return <><button onClick={() => navigate(ruta, { state: { trasllatRecepta: draftA } })}>Draft A</button>
      <button onClick={() => navigate(ruta, { state: { trasllatRecepta: draftB } })}>Draft B</button>
      <button onClick={() => navigate(ruta, { state: { trasllatRecepta: draftB } })}>Draft B idèntic</button>
      <button onClick={() => navigate(ruta)}>Lleva state</button><RecepcioRecepta llista={llista} /></>;
  }
  render(<MemoryRouter rutaInicial="/app/nevera/llista/casa"><ContextNevera.Provider value={{ mode: 'editable', llegit: true, accions: { afigIngredientsRecepta: afig } }}><Arribades /></ContextNevera.Provider></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Draft A' }));
  await screen.findByRole('group', { name: 'Ingredients de «Pa rústic»' });
  expect(screen.getByLabelText('Racions de la recepta original').value).toBe('2');
  fireEvent.change(screen.getByLabelText('Ingredient 1'), { target: { value: 'Nom del draft A' } });
  fireEvent.change(screen.getByLabelText('Quantitat o indicació 1'), { target: { value: 'Nota del draft A' } });
  fireEvent.click(screen.getByLabelText('Inclou l’ingredient 1'));
  fireEvent.click(screen.getByRole('button', { name: 'Draft B' }));
  await screen.findByRole('group', { name: 'Ingredients de «Pa rústic»' });
  expect(screen.getByLabelText('Racions de la recepta original').value).toBe('4');
  expect(screen.getByLabelText('Racions que vols preparar').value).toBe('12');
  expect(screen.getByLabelText('Ingredient 1').value).toBe('Oli d’oliva');
  expect(screen.getByLabelText('Quantitat o indicació 1').value).toBe('3 l');
  expect(screen.getByLabelText('Inclou l’ingredient 1').checked).toBe(true);
  expect(afig).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Afig els ingredients de la recepta' }));
  expect(afig).toHaveBeenCalledWith('casa', [{ nom: 'Oli d’oliva', especificacio: '3 l', index: 0 }]);
  fireEvent.change(screen.getByLabelText('Racions de la recepta original'), { target: { value: '6' } });
  fireEvent.change(screen.getByLabelText('Quantitat o indicació 1'), { target: { value: 'Nota del draft B' } });
  fireEvent.click(screen.getByRole('button', { name: 'Draft B idèntic' }));
  await screen.findByRole('group', { name: 'Ingredients de «Pa rústic»' });
  expect(screen.getByLabelText('Racions de la recepta original').value).toBe('4');
  expect(screen.getByLabelText('Quantitat o indicació 1').value).toBe('3 l');
  expect(screen.queryByRole('status')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Lleva state' }));
  await screen.findByRole('group', { name: 'Ingredients de «Pa rústic»' });
  expect(screen.getByLabelText('Racions de la recepta original').value).toBe('');
  expect(screen.getByLabelText('Racions que vols preparar').value).toBe('');
  expect(screen.getByLabelText('Ingredient 1').value).toBe('Farina');
  expect(screen.getByLabelText('Quantitat o indicació 1').value).toBe('');
  expect(screen.getByRole('button', { name: 'Afig els ingredients de la recepta' }).disabled).toBe(true);
  expect(afig).toHaveBeenCalledTimes(1);
});
