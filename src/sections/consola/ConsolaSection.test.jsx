import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const ruta = vi.hoisted(() => ({ comodi: '' }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ '*': ruta.comodi }),
  useNavigate: () => vi.fn(),
  Navigate: ({ to }) => <p data-testid="redirigix">{to}</p>,
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>
}));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, subtitle, lead, children }) => (
    <main>
      <header className="page-title"><h1>{title}</h1></header>
      {(subtitle || lead) && <div className="page-intro">{subtitle && <h2>{subtitle}</h2>}{lead && <p className="lead">{lead}</p>}</div>}
      {children}
    </main>
  )
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => ({ locale: 'ca-ES' }) }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('./mapa/useMapa.js', () => ({ useMapa: () => ({ estat: 'absent', mapa: null, error: null, carrega: vi.fn() }) }));
vi.mock('./consolaContent.js', async (importOriginal) => ({
  ...(await importOriginal()),
  carregaConsola: () => Promise.resolve(null)
}));
import ConsolaSection from './ConsolaSection.jsx';

afterEach(() => { cleanup(); ruta.comodi = ''; });

test('/consola: només el tauler de sis targetes, sense pestanyes, i l’entradeta separa els dos títols', async () => {
  render(<ConsolaSection />);
  await screen.findByText('Dades no disponibles en este entorn');

  expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['Consola Termodinàmica']);
  expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Manteniment de la IAIA']);
  expect(document.querySelector('.page-intro h2 + p.lead')).not.toBeNull();
  expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(6);
  expect(screen.queryByRole('tablist')).toBeNull();

  const enllacos = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
  expect(enllacos).toEqual(['pols', 'explorador', 'calendari', 'inventari', 'entrades', 'salut'].map((id) => `/consola/${id}`));
  expect(screen.getAllByText('Mapa no disponible en este entorn')).toHaveLength(5);
});

test('/consola/calendari: pàgina pròpia amb molla de pa, controls i avís de Mapa absent', async () => {
  ruta.comodi = 'calendari';
  render(<ConsolaSection />);
  await screen.findByText('Instantània encara no disponible.');

  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Calendari de processos');
  expect(screen.getByRole('link', { name: 'Consola Termodinàmica' }).getAttribute('href')).toBe('/consola');
  expect(screen.getByRole('button', { name: /Refrescar/ })).toBeTruthy();
  expect(screen.getByText('Mapa no disponible')).toBeTruthy();
  expect(screen.queryByRole('tablist')).toBeNull();
});

test('una subruta desconeguda torna al tauler', () => {
  ruta.comodi = 'pestanyes';
  render(<ConsolaSection />);
  expect(screen.getByTestId('redirigix').textContent).toBe('/consola');
});
