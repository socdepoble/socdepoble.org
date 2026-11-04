import { webcrypto } from 'node:crypto';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest';
import ProvaXifratXat, { TEXTOS_PROVA_XIFRAT as T } from './ProvaXifratXat.jsx';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';
import { E2EE_ACTIU_PER_DEFECTE } from '../../config/xifratXat.js';
import { creaProvaXifratXat } from '../../data/xifratXatLaboratori.js';

vi.mock('../../app/contexts/UIContext', () => ({ useUIActionsOpcional: () => null }));
/* jsdom reutilitza el TextEncoder de Node: els bytes han de pertànyer al
   mateix reialme que Uint8Array, com passa en un navegador real. Les
   primitives WebCrypto continuen sent les reals. */
const EncoderNatiu = globalThis.TextEncoder;
beforeAll(() => vi.stubGlobal('TextEncoder', class extends EncoderNatiu {
  encode(text) { return Uint8Array.from(super.encode(text)); }
}));
afterAll(() => vi.unstubAllGlobals());
afterEach(cleanup);

test('el protocol de la mostra funciona també en el reialme del navegador', async () => {
  const prova = await creaProvaXifratXat({ cripto: webcrypto });
  try {
    prova.fotografia().ranures.forEach((r, index) => prova.confirmaSas(index, r.contacte));
    expect(await prova.provaMissatge('Mostra del navegador')).toMatchObject({ obert: 'Mostra del navegador' });
  } finally { prova.tanca(); }
}, 30_000);

test('laboratori explícit: tres SAS reals, mostra local, rotació i disputa; tancar esborra el text', async () => {
  const { container } = render(<ProvaXifratXat cripto={webcrypto} />);
  expect(E2EE_ACTIU_PER_DEFECTE).toBe(false);
  expect(screen.queryByRole('list')).toBeNull();
  expect(screen.getByText(T.limit[1])).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: T.inicia[1] }));
  await screen.findByRole('list', { name: T.mostraLlista[1] }, { timeout: 10_000 });
  const xifra = screen.getByRole('button', { name: T.xifra[1] });
  expect(xifra.disabled).toBe(true);
  expect(screen.getAllByText(/Este aparell: \d{3} \d{3} \d{3} \d{3} · Contacte:/)).toHaveLength(3);
  for (let n = 1; n <= 3; n += 1) fireEvent.click(screen.getByRole('button', { name: `Verificar codi SAS de Contacte de mostra ${n}` }));
  expect(xifra.disabled).toBe(false);
  expect(screen.getByText(T.mostraRecompte[1].replace('{n}', '3'))).toBeTruthy();
  expect(container.textContent).not.toContain('Tens 3 contactes amb el número de seguretat verificat.');
  expect(container.textContent).not.toContain('Tria gent de qui et fies de veres:');
  const camp = screen.getByRole('textbox', { name: T.missatge[1] });
  expect(camp.id).toBeTruthy();
  expect(container.querySelector(`label[for="${camp.id}"]`)).toBeTruthy();
  fireEvent.change(camp, { target: { value: 'Missatge efímer de la pantalla' } });
  fireEvent.click(xifra);
  await screen.findByText(T.controls[1], {}, { timeout: 10_000 });
  expect(screen.getByText('Missatge efímer de la pantalla')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: T.rota[1] }));
  await screen.findByText(T.rotacio[1], {}, { timeout: 10_000 });
  fireEvent.click(screen.getByRole('button', { name: T.mostraAccioDisputa[1] }));
  expect(screen.getByRole('alert').textContent).toBe(T.mostraDisputa[1]);
  expect(container.textContent).not.toContain('cerimònia de recuperació ha quedat bloquejada');
  expect(xifra.disabled).toBe(true);
  expect(screen.getByRole('button', { name: T.rota[1] }).disabled).toBe(true);
  expect(screen.queryByText(T.rotacio[1])).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: T.tanca[1] }));
  expect(screen.queryByRole('textbox')).toBeNull();
  expect(container.textContent).not.toContain('Missatge efímer de la pantalla');
  expect(screen.getByRole('button', { name: T.inicia[1] })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: T.inicia[1] }));
  await screen.findByRole('textbox', { name: T.missatge[1] }, { timeout: 10_000 });
  expect(screen.getByRole('textbox', { name: T.missatge[1] }).value).toBe(T.textInicial[1]);
  expect(container.textContent).not.toContain('Missatge efímer de la pantalla');
  expect(container.querySelector('[style]')).toBeNull();
}, 30_000);

test('un entorn sense WebCrypto mostra l’error i no crea cap contacte de mostra', async () => {
  render(<ProvaXifratXat cripto={null} />);
  fireEvent.click(screen.getByRole('button', { name: T.inicia[1] }));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(T.error[1]));
  expect(screen.queryByRole('list')).toBeNull();
  expect(E2EE_ACTIU_PER_DEFECTE).toBe(false);
});


test('R2F27-03 · els textos de mostra tenen traducció als cinc idiomes', () => {
  for (const dict of [CA, ES, EN, EU, GL]) for (const [key] of Object.values(T)) expect(dict[key], key).toEqual(expect.any(String));
});
