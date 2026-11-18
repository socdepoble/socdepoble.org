import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from '../../app/contexts/RouterContext';

vi.mock('../../app/contexts/CoreContentContext', () => ({
  useCoreContent: () => ({ pages: [], pageCopy: {}, status: 'loading' })
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', async (original) => ({
  ...(await original()), useUIActions: () => ({ t: (_, reserva) => reserva })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
import PageDetailSection from './PageDetailSection.jsx';

afterEach(cleanup);
function EstatRuta() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  return <><output data-testid="ruta">{pathname}{search ? `?${search}` : ''}</output><button onClick={() => navigate(-1)}>Arrere</button></>;
}

it('l’URL compartida redirigix amb replace, sense esperar dades remotes ni conservar el duplicat a l’historial', async () => {
  function Entra() {
    const navigate = useNavigate();
    return <button onClick={() => navigate('/page/sistema-nervios')}>Obrir adreça antiga</button>;
  }
  render(<MemoryRouter rutaInicial="/mur">
    <Routes>
      <Route path="/mur" element={<Entra />} />
      <Route path="/page/:slug" element={<PageDetailSection />} />
      <Route path="/wikidepoble" element={<p>Llibre canònic</p>} />
    </Routes>
    <EstatRuta />
  </MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Obrir adreça antiga' }));
  await waitFor(() => expect(screen.getByTestId('ruta').textContent).toBe('/wikidepoble?item=sistema_nervios_skills_i_repositoris'));
  expect(screen.getByText('Llibre canònic')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Arrere' }));
  await waitFor(() => expect(screen.getByTestId('ruta').textContent).toBe('/mur'));
});
