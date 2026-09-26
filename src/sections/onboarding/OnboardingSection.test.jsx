import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn(), registra: vi.fn(), entra: vi.fn(), google: vi.fn() }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => m.navigate }));
vi.mock('../../components/universal/UniversalPage', () => ({ UniversalPage: ({ children }) => <main>{children}</main> }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../app/contexts/SessionContext', () => ({
  useSession: () => ({ currentUser: null, registerWithPassword: m.registra, loginWithPassword: m.entra, loginWithGoogle: m.google }),
}));
vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => ({ externalConfig: { tenantId: 'T' } }) }));
/* La targeta real porta accions i telemetria que ací no es proven. */
vi.mock('../../components/PedraSeca/index.js', async (importOriginal) => ({
  ...(await importOriginal()),
  UniversalCard: ({ title, subtitle, body }) => <section><h3>{title}</h3>{subtitle ? <p>{subtitle}</p> : null}{body}</section>,
}));
import OnboardingSection from './OnboardingSection.jsx';

beforeEach(() => { for (const f of Object.values(m)) f.mockReset(); });
afterEach(cleanup);

async function registra() {
  render(<OnboardingSection />);
  fireEvent.change(screen.getByLabelText('Nom i cognoms'), { target: { name: 'name', value: 'Ana Puig' } });
  fireEvent.change(screen.getByLabelText('Correu electrònic'), { target: { name: 'email', value: ' Ana@Poble.TEST ' } });
  fireEvent.change(screen.getByLabelText('Contrasenya'), { target: { name: 'password', value: 'contrasenya-llarga' } });
  fireEvent.change(screen.getByLabelText('Confirmar contrasenya'), { target: { name: 'confirmPassword', value: 'contrasenya-llarga' } });
  fireEvent.click(screen.getByRole('checkbox'));
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Crear el compte' })); });
}

test('I4 · sense access_token es demana confirmar el correu, en minúscules i sense toast d’èxit', async () => {
  m.registra.mockResolvedValue({ id: 'U', email: 'ana@poble.test' });
  const avis = vi.spyOn(window, 'dispatchEvent');
  await registra();
  // El camp type=email ja retalla els espais; les majúscules arriben tal qual.
  expect(m.registra).toHaveBeenCalledWith('Ana@Poble.TEST', 'contrasenya-llarga',
    expect.objectContaining({ full_name: 'Ana Puig', accepta_rgpd: true, tenant_id: 'T' }), { tenantId: 'T' });
  expect(screen.getByRole('heading', { name: 'Confirma el teu compte' })).toBeTruthy();
  expect(screen.getByText('ana@poble.test')).toBeTruthy();
  expect(m.toast).not.toHaveBeenCalled();
  expect(avis.mock.calls.some(([e]) => e.type === 'sdp:auth-change')).toBe(false);
  avis.mockRestore();
});

test('amb access_token no hi ha targeta de confirmació i sí toast d’èxit', async () => {
  m.registra.mockResolvedValue({ access_token: 'jwt', user: { id: 'U' } });
  await registra();
  expect(screen.queryByRole('heading', { name: 'Confirma el teu compte' })).toBeNull();
  expect(m.toast).toHaveBeenCalledWith('Compte creat. Benvinguda al Mas.', 'success');
});

test('«Ja l’he confirmat» torna al formulari d’entrada sense recarregar, amb el correu escrit', async () => {
  m.registra.mockResolvedValue({ id: 'U' });
  await registra();
  fireEvent.click(screen.getByRole('button', { name: /Ja l’he confirmat/ }));
  expect(screen.queryByRole('heading', { name: 'Confirma el teu compte' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Entrar al compte' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Entrar', pressed: true })).toBeTruthy();
  expect(screen.getByLabelText('Correu electrònic').value).toBe('Ana@Poble.TEST');
  expect(screen.queryByLabelText('Nom i cognoms')).toBeNull();
});

test('un error del registre es mostra i no hi ha targeta', async () => {
  m.registra.mockRejectedValue(new Error('Supabase 422: {"message":"User already registered"}'));
  await registra();
  expect(screen.getByRole('alert').textContent).toBe('User already registered');
  expect(screen.queryByRole('heading', { name: 'Confirma el teu compte' })).toBeNull();
});
