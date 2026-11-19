import { createElement } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { contrasenyaProuLlarga } from './copiaSeguretatXat.js';
import { CosCopiaSeguretatXat, MOTOR_COPIA } from './components/PaginaCopiaSeguretatXat.jsx';

vi.mock('./XatContext', () => ({ useXat: () => ({}) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => ({ locale: 'ca-ES' }) }));

const hostil = 'aa' + '\u0315'.repeat(16383) + '\u0300'.repeat(16384);
const valida = 'farcell de la iaia 2026';
const abast = { usuariId: 'audit-user', tenantId: 'audit-tenant' };
const contingut = { fils: [{ id: 'audit-thread' }], missatges: [], filsAmbMissatges: 0 };
const escriu = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
function formulari() {
  const motor = { ...MOTOR_COPIA, exporta: vi.fn().mockResolvedValue({ text: 'fixture-xifrada' }) };
  render(createElement(CosCopiaSeguretatXat, { abast, contingut, motor }));
  return motor;
}
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test('password model refuses the 64 KiB mark budget without normalizing or replacing the secret', () => {
  const spy = vi.spyOn(String.prototype, 'normalize');
  expect(new TextEncoder().encode(hostil).length).toBe(65536);
  expect(contrasenyaProuLlarga(hostil)).toBe(false);
  expect(spy.mock.contexts.every((text) => String(text).length < 1000)).toBe(true);
  expect(hostil.length).toBe(32769);
});

test('admitted password validation preserves native NFC/trim length and propagates unrelated errors', () => {
  for (const text of ['', 'onze-caract', 'dotze-caract', '  dotze-caract  ', 'e\u0301'.repeat(12), '漢字'.repeat(10)]) {
    expect(contrasenyaProuLlarga(text)).toBe(text.normalize('NFC').trim().length >= 12);
  }
  expect(contrasenyaProuLlarga(null)).toBe(false);
  const error = new Error('native canary');
  vi.spyOn(String.prototype, 'normalize').mockImplementation(() => { throw error; });
  expect(() => contrasenyaProuLlarga(valida)).toThrow(error);
});

test('real backup form stops a hostile primary password before its own NFC comparison and crypto', () => {
  const motor = formulari();
  escriu('Contrasenya de la còpia', hostil); escriu('Repetix la contrasenya', hostil);
  const spy = vi.spyOn(String.prototype, 'normalize');
  fireEvent.click(screen.getByRole('button', { name: 'Prepara la còpia' }));
  expect(motor.exporta).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Contrasenya de la còpia').getAttribute('aria-invalid')).toBe('true');
  expect(screen.getByLabelText('Contrasenya de la còpia').value).toBe(hostil);
  expect(spy.mock.contexts.every((text) => String(text).length < 1000)).toBe(true);
});

test('real backup form retains the original admitted secret after canonical comparison', async () => {
  const motor = formulari(), original = 'cafe\u0301 de la iaia 2026';
  escriu('Contrasenya de la còpia', original); escriu('Repetix la contrasenya', original.normalize('NFC'));
  fireEvent.click(screen.getByRole('button', { name: 'Prepara la còpia' }));
  await waitFor(() => expect(motor.exporta).toHaveBeenCalledTimes(1));
  expect(motor.exporta.mock.calls[0][0].contrasenya).toBe(original);
});

test('known JSX boundary: a hostile repetition still reaches native NFC when the primary password is admitted', () => {
  const motor = formulari();
  escriu('Contrasenya de la còpia', valida); escriu('Repetix la contrasenya', hostil);
  const native = String.prototype.normalize;
  const spy = vi.spyOn(String.prototype, 'normalize').mockImplementation(function (forma) {
    // Record the actual comparison boundary without spending time reordering it.
    return String(this) === hostil ? hostil : native.call(this, forma);
  });
  fireEvent.click(screen.getByRole('button', { name: 'Prepara la còpia' }));
  expect(spy.mock.contexts.some((text) => String(text) === hostil)).toBe(true);
  expect(screen.getByLabelText('Repetix la contrasenya').getAttribute('aria-invalid')).toBe('true');
  expect(motor.exporta).not.toHaveBeenCalled();
});
