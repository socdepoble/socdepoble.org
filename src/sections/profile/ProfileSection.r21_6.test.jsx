import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation, useNavigate } from '../../app/contexts/RouterContext';
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_key, reserve) => reserve, language: 'ca' }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import ProfileSection from './ProfileSection.jsx';
import { AGENTS } from '../../data/agentsSeed.js';
afterEach(cleanup);
function Position() {
  const { pathname, search } = useLocation(); const navigate = useNavigate();
  return <><output data-testid="route">{pathname}{search ? `?${search}` : ''}</output><button onClick={() => navigate(-1)}>Arrere</button></>;
}
function mount(route) {
  return render(<MemoryRouter rutaInicial={route}><ProfileSection agents={AGENTS} /><Position /></MemoryRouter>);
}
test('el filtre de Gent viu a la URL, conserva la resta i sobreviu a una nova càrrega', () => {
  const view = mount('/perfil?referencia=publica');
  const group = screen.getByRole('group', { name: 'Filtra el directori per tipus' });
  fireEvent.click(within(group).getByRole('button', { name: 'Persones' }));
  const selected = screen.getByTestId('route').textContent;
  expect(selected).toBe('/perfil?referencia=publica&tipus=persona');
  expect(document.querySelectorAll('.sdp-card-grid > .sp-card')).toHaveLength(1);
  view.unmount();
  mount(selected);
  expect(within(screen.getByRole('group', { name: 'Filtra el directori per tipus' })).getByRole('button', { name: 'Persones' }).getAttribute('aria-pressed')).toBe('true');
  expect(document.querySelectorAll('.sdp-card-grid > .sp-card')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Tots' }));
  expect(screen.getByTestId('route').textContent).toBe('/perfil?referencia=publica');
  fireEvent.click(screen.getByRole('button', { name: 'Arrere' }));
  expect(screen.getByTestId('route').textContent).toBe(selected);
});
test('un filtre desconegut no fa desaparéixer el catàleg ni activa una IA inventada', () => {
  mount('/perfil?tipus=invalid');
  expect(document.querySelectorAll('.sdp-card-grid > .sp-card')).toHaveLength(3);
  expect(screen.getByRole('button', { name: 'Tots' }).getAttribute('aria-pressed')).toBe('true');
  expect(screen.getAllByRole('heading', { name: 'IAIA MarIA' })).toHaveLength(1);
});
