/* IDEA-48 (estat previ a F7; pla 261101_1246, T7 · S6) · El contenidor del bloc
   «Persones de confiança». Amb la bandera apagada (la de veres), no pinta res i
   no llig ni el port ni el servei. Amb la bandera encesa (sonda) i un servei
   simulat: sense servei, res; el recompte; un error; i un recompte que no és un
   enter, error (mai un zero inventat). */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ encesa: false, servei: null, backend: { nom: 'backend' }, recuperacio: false }));
vi.mock('../../config/xifratXat.js', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, get E2EE_ACTIU_PER_DEFECTE() { return m.encesa; } };
});
vi.mock('../../data/backendPort.js', () => ({ getBackendImplementation: vi.fn(() => m.backend), teCapacitat: vi.fn(() => m.recuperacio) }));
vi.mock('../../data/xifratXat.js', () => ({ serveiXifratXat: vi.fn(() => m.servei) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActionsOpcional: () => null }));

const { getBackendImplementation, teCapacitat } = await import('../../data/backendPort.js');
const { serveiXifratXat } = await import('../../data/xifratXat.js');
const { default: BlocPersonesConfianca } = await import('./BlocPersonesConfianca.jsx');

beforeEach(() => { m.encesa = false; m.servei = null; m.recuperacio = false; vi.clearAllMocks(); });
afterEach(cleanup);

test('bandera apagada: cap bloc, cap lectura del port ni del servei', () => {
  m.servei = { contactesVerificats: vi.fn(async () => 4) };
  const { container } = render(<BlocPersonesConfianca />);
  expect(container.innerHTML).toBe('');
  expect(getBackendImplementation).not.toHaveBeenCalled();
  expect(teCapacitat).not.toHaveBeenCalled();
  expect(serveiXifratXat).not.toHaveBeenCalled();
  expect(m.servei.contactesVerificats).not.toHaveBeenCalled();
});

describe('bandera encesa (sonda)', () => {
  beforeEach(() => { m.encesa = true; });

  test('sense servei (backend local o sense instal·lar): no pinta res', () => {
    const { container } = render(<BlocPersonesConfianca />);
    expect(container.innerHTML).toBe('');
    expect(serveiXifratXat).toHaveBeenCalledWith(m.backend);
  });

  test('el recompte: un bloc amb el seu títol (h2), «Tens 2…» i «En falta 1…»', async () => {
    m.servei = { contactesVerificats: vi.fn(async () => 2) };
    render(<BlocPersonesConfianca />);
    expect(screen.getByRole('region', { name: 'Persones de confiança' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Persones de confiança' })).toBeTruthy();
    expect(await screen.findByText('Tens 2 contactes amb el número de seguretat verificat. En falta 1 per a arribar a tres.')).toBeTruthy();
    expect(m.servei.contactesVerificats).toHaveBeenCalledTimes(1);
    /* Gauntlet T7b-G02/G08 · La capacitat del contracte decidix si la recuperació és activa (avui, mai). */
    expect(teCapacitat).toHaveBeenCalledWith('recuperacioSocial');
    expect(screen.getByText(/^La recuperació amb persones de confiança encara no està activa en este node/)).toBeTruthy();
  });

  test('amb la capacitat recuperacioSocial (F7, encara no al contracte): sense l’avís que no està activa', async () => {
    m.servei = { contactesVerificats: vi.fn(async () => 3) };
    m.recuperacio = true;
    const { container } = render(<BlocPersonesConfianca />);
    expect(await screen.findByText('Tens 3 contactes amb el número de seguretat verificat.')).toBeTruthy();
    expect(container.textContent).not.toMatch(/encara no està activa|Ja en tens prou/);
  });

  test('una lectura que falla: l’avís d’error', async () => {
    m.servei = { contactesVerificats: vi.fn(async () => { throw Object.assign(new Error('x'), { codi: 'sense-motor-xifrat' }); }) };
    render(<BlocPersonesConfianca />);
    expect((await screen.findByRole('alert')).textContent).toBe('No s’ha pogut llegir quins contactes tens verificats.');
  });

  test('un recompte que no és un enter no negatiu és un error, no un zero', async () => {
    m.servei = { contactesVerificats: vi.fn(async () => undefined) };
    const { container } = render(<BlocPersonesConfianca />);
    await screen.findByRole('alert');
    expect(container.textContent).not.toMatch(/Encara no has verificat/);
  });
});
