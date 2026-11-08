import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
const estat = vi.hoisted(() => ({ ruta: 'taxonomia', seo: vi.fn() }));
vi.mock('../../app/contexts/RouterContext', () => ({ useParams: () => ({ '*': estat.ruta }), useNavigate: () => vi.fn(), Navigate: ({ to }) => <p>{to}</p>, Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a> }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => ({ locale: 'ca-ES' }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: estat.seo }));
vi.mock('../../components/universal/UniversalPage', () => ({ UniversalPage: ({ title, lead, children }) => <main><header className="page-title"><h1>{title}</h1></header><p>{lead}</p>{children}</main> }));
vi.mock('../taxonomia/BrainTaxonomia.jsx', () => ({ default: () => <section aria-label="Brain compartit carregat"/> }));
vi.mock('./mapa/useMapa.js', () => ({ useMapa: () => ({ estat: 'absent', mapa: null, error: null, carrega: vi.fn() }) }));
vi.mock('./consolaContent.js', async (original) => ({ ...await original(), carregaConsola: async () => null }));
vi.mock('./govern/governContent.js', async (original) => ({ ...await original(), carregaGovern: async () => null }));
import ConsolaSection from './ConsolaSection.jsx';
afterEach(() => { cleanup(); estat.ruta = 'taxonomia'; estat.seo.mockClear(); localStorage.clear(); });

test('/consola/taxonomia munta la vista compartida i publica el seu head explícit', async () => {
  render(<ConsolaSection/>);
  expect(await screen.findByRole('region', { name: 'Brain compartit carregat' })).toBeTruthy();
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Categories i etiquetes');
  expect(estat.seo).toHaveBeenCalledWith(expect.objectContaining({ title: 'Categories i etiquetes · Consola Termodinàmica', description: 'Explora els noms canònics, comprova quins documents els connecten i compara propostes abans de decidir.' }));
});

test('el tauler real oferix una targeta amb la ruta explícita del Brain', async () => {
  estat.ruta = '';
  render(<ConsolaSection/>);
  const enllac = await screen.findByRole('link', { name: 'Categories i etiquetes' });
  expect(enllac.getAttribute('href')).toBe('/consola/taxonomia');
});

test('/consola/taxonomia/ (barra final) és la mateixa pàgina, amb molla de pa cap al tauler', async () => {
  estat.ruta = 'taxonomia/';
  render(<ConsolaSection/>);
  expect(await screen.findByRole('region', { name: 'Brain compartit carregat' })).toBeTruthy();
  const molla = screen.getByRole('navigation', { name: 'Molla de pa' });
  expect(molla.querySelector('a').getAttribute('href')).toBe('/consola');
  expect(estat.seo).toHaveBeenCalledWith(expect.objectContaining({ title: 'Categories i etiquetes · Consola Termodinàmica' }));
});
