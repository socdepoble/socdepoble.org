import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => {
  const estat = vi.fn(), demana = vi.fn();
  return { estat, demana, accions: { estatPersistencia: estat, demanaPersistencia: demana } };
});
vi.mock('../estat/ProveidorBar.jsx', () => ({ useBar: () => ({
  accions: m.accions,
  persistent: true, mode: 'dispositiu', permis: { potEscriure: true }
}) }));
vi.mock('../../plataforma/index.js', async original => ({ ...(await original()),
  useApp: () => ({ manifest: { interruptors: [] } }),
  useInterruptorsApp: () => ({ avalua: () => ({}), actiu: () => false, apaga: vi.fn() })
}));
vi.mock('./comu.jsx', async original => ({ ...(await original()),
  AvisBase: () => null, AvisOperacio: () => null,
  Preparat: ({ children }) => <>{children}</>, Columna: ({ children }) => <div>{children}</div>
}));
import { AjustTriat } from './Ajustos.jsx';
const errorText = 'No s’ha pogut comprovar o demanar la persistència del navegador. Torna-ho a provar; desa una còpia del Bar.';
beforeEach(() => { m.estat.mockReset().mockResolvedValue({ duradora: false }); m.demana.mockReset().mockResolvedValue(true); });
afterEach(cleanup);

test('una lectura rebutjada es mostra i un reintent correcte conserva el missatge real de persistència', async () => {
  m.estat.mockRejectedValueOnce(new Error('private-provider-detail'));
  render(<AjustTriat params={{ seccio: 'dispositiu' }} />);
  expect(await screen.findByText(errorText)).toBeTruthy();
  expect(screen.queryByText('private-provider-detail')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Demana que no s’esborren' }));
  expect(await screen.findByText('Fet: el navegador no les esborrarà per falta d’espai.')).toBeTruthy();
  expect(screen.queryByText(errorText)).toBeNull();
});

test('el rebuig de demanar persistència no queda sense gestor ni fals èxit; els tocs dobles no dupliquen la petició', async () => {
  let reject;
  m.demana.mockImplementationOnce(() => new Promise((_resolve, no) => { reject = no; }));
  render(<AjustTriat params={{ seccio: 'dispositiu' }} />);
  const button = screen.getByRole('button', { name: 'Demana que no s’esborren' });
  fireEvent.click(button); fireEvent.click(button);
  expect(m.demana).toHaveBeenCalledTimes(1);
  reject(new Error('private-provider-detail'));
  expect(await screen.findByText(errorText)).toBeTruthy();
  expect(screen.queryByText('Fet: el navegador no les esborrarà per falta d’espai.')).toBeNull();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Demana que no s’esborren' }).disabled).toBe(false));
});
