import React, { StrictMode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ navigate: vi.fn(), enterRemote: vi.fn(), user: null }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => m.navigate }));
vi.mock('../../components/universal/UniversalPage', () => ({ UniversalPage: ({ children }) => <main>{children}</main> }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => ({ currentUser: m.user }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => ({ externalConfig: { dataMode: 'seed', tenantId: 'test-demo' } }) }));
vi.mock('../../config/dataMode.js', () => ({ resolveDataMode: config => config.dataMode || 'remote', enterRemoteMode: m.enterRemote }));
import OnboardingSection from './OnboardingSection.jsx';
beforeEach(() => { vi.clearAllMocks(); m.enterRemote.mockReset(); m.user = null; });
afterEach(cleanup);

test('entrar mostra directament el formulari original i prepara remote una sola vegada', () => {
  render(<StrictMode><OnboardingSection /></StrictMode>);
  expect(screen.getByLabelText('Contrasenya')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Entrar amb Google' })).toBeTruthy();
  expect(screen.queryByText(/Estàs explorant la demostració/)).toBeNull();
  expect(screen.queryByRole('button', { name: 'Entrar amb dades reals' })).toBeNull();
  expect(m.enterRemote).toHaveBeenCalledWith(expect.objectContaining({ dataMode: 'seed', tenantId: 'test-demo' }));
  expect(m.enterRemote).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('Contrasenya').disabled).toBe(true);
});

test('una sessió antiga dins del pilot no amaga l’entrada real', () => {
  m.user = { id: 'pilot' };
  render(<OnboardingSection />);
  expect(m.navigate).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Contrasenya')).toBeTruthy();
  expect(m.enterRemote).toHaveBeenCalledTimes(1);
});

test('si no es pot preparar remote manté el formulari amb error i no envia credencials seed', () => {
  m.enterRemote.mockImplementation(() => { throw new Error('No s’ha pogut guardar l’elecció.'); });
  render(<OnboardingSection />);
  expect(screen.getByRole('alert').textContent).toContain('No s’ha pogut guardar');
  expect(screen.getByLabelText('Contrasenya').disabled).toBe(true);
});
