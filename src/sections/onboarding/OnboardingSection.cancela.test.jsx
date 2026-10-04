/* F1 (Onada 4, 261003) · Amb COOP, la capa d'autenticació ja no rebutja sola
   quan es tanca la finestra de Google (data/oauthRelay.js): mentre Google
   espera, /registre oferix «Cancel·la l’entrada», que avorta l'intent de
   veres (data/authAttempt.js, el de les proves és el real) i torna el botó. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn(), google: vi.fn(), intent: null }));
vi.mock('../../app/contexts/RouterContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => m.navigate,
}));
vi.mock('../../components/universal/UniversalPage', () => ({ UniversalPage: ({ children }) => <main>{children}</main> }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../app/contexts/SessionContext', () => ({
  useSession: () => ({ currentUser: null, registerWithPassword: vi.fn(), loginWithPassword: vi.fn(), loginWithGoogle: m.google }),
}));
vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => ({ externalConfig: { tenantId: '00000000-0000-4000-8000-000000000000' } }) }));
import OnboardingSection from './OnboardingSection.jsx';
import { beginAuthAttempt, cancelAuthAttempts } from '../../data/authAttempt.js';

const botoGoogle = () => screen.getByRole('button', { name: 'Entrar amb Google' });
const botoCancela = () => screen.queryByRole('button', { name: 'Cancel·la l’entrada' });
/* Com l'adaptador de veres: l'entrada obri un intent i només rebutja quan s'avorta. */
const googleQueEspera = () => {
  const intent = beginAuthAttempt();
  m.intent = intent;
  return new Promise((_, rebutja) => {
    intent.signal.addEventListener('abort', () => rebutja(intent.signal.reason), { once: true });
  });
};

beforeEach(() => {
  for (const f of [m.navigate, m.toast, m.google]) f.mockReset();
  m.intent = null;
});
afterEach(() => {
  cancelAuthAttempts();
  cleanup();
});

test('F1 · Google pendent: «Cancel·la l’entrada» apareix, avorta l’intent i torna el botó amb el focus', async () => {
  m.google.mockImplementation(googleQueEspera);
  render(<OnboardingSection />);
  expect(botoCancela()).toBeNull();
  await act(async () => { fireEvent.click(botoGoogle()); });
  expect(botoGoogle().disabled).toBe(true);
  const cancela = botoCancela();
  expect(cancela).not.toBeNull();
  expect(cancela.disabled).toBe(false);
  expect(cancela.classList.contains('sdp-boto')).toBe(true);
  // L'avís és l'espècimen <Alerta> informatiu: regió viva, sense estils en línia.
  const avis = cancela.closest('.sdp-alerta');
  expect(avis.classList.contains('sdp-alerta--info')).toBe(true);
  expect(avis.getAttribute('role')).toBe('status');
  expect(avis.textContent).toContain('finestra de Google');
  expect(avis.querySelectorAll('[style]')).toHaveLength(0);

  await act(async () => { fireEvent.click(cancela); });
  expect(m.intent.signal.aborted).toBe(true);
  expect(botoCancela()).toBeNull();
  expect(botoGoogle().disabled).toBe(false);
  expect(botoGoogle().getAttribute('aria-busy')).toBeNull();
  // L'AbortError de l'intent cancel·lat no pinta cap error.
  expect(screen.queryByRole('alert')).toBeNull();
  expect(document.activeElement).toBe(botoGoogle());
});

test('F1 · després de cancel·lar es pot tornar a entrar amb Google', async () => {
  m.google.mockImplementation(googleQueEspera);
  render(<OnboardingSection />);
  await act(async () => { fireEvent.click(botoGoogle()); });
  const primer = m.intent;
  await act(async () => { fireEvent.click(botoCancela()); });
  await act(async () => { fireEvent.click(botoGoogle()); });
  expect(m.google).toHaveBeenCalledTimes(2);
  expect(m.intent).not.toBe(primer);
  expect(m.intent.signal.aborted).toBe(false);
  expect(botoCancela()).not.toBeNull();
});

test('F1 · un port que no avorta: la resposta tardana d’un intent cancel·lat no anuncia cap entrada', async () => {
  let resol;
  m.google.mockReturnValue(new Promise((r) => { resol = r; }));
  const avis = vi.spyOn(window, 'dispatchEvent');
  render(<OnboardingSection />);
  await act(async () => { fireEvent.click(botoGoogle()); });
  await act(async () => { fireEvent.click(botoCancela()); });
  expect(botoGoogle().disabled).toBe(false);
  await act(async () => { resol({ access_token: 'tardana', user: { id: 'U' } }); });
  expect(m.toast).not.toHaveBeenCalled();
  expect(avis.mock.calls.some(([e]) => e.type === 'sdp:auth-change')).toBe(false);
  avis.mockRestore();
});
