/* La Gestoria viu fora de la Wiki. Router, plataforma i Workspace de veres;
   només les vistes financeres són dobles, amb un estat privat sintètic.
   Ordre del Mestre, 261004 («contaminació crítica de rutes/estats entre
   Gestoria i Wiki»): la Wiki no coneix cap id ni cap ruta de la Gestoria. Un
   enllaç antic (/wikidepoble?categoria=gestoria_cat&item=…) es queda a la
   Wiki i cau com qualsevol ítem desconegut: la portada, sense redirigir a
   l'app ni pintar-ne res. A la Gestoria s'hi entra per /app/gestoria. */
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

vi.mock('../../data/wikiManifest.js', () => ({
  wikiManifest: {
    categories: [{ id: 'folder:ser', label: 'SER' }],
    items: [{ id: 'identitat', title: 'Identitat', categoryId: 'folder:ser', tags: [], content: '# Identitat' }]
  }
}));
vi.mock('../../components/universal/UniversalPage.jsx', () => ({
  UniversalPage: ({ title, children }) => <section><header className="page-title"><h1>{title}</h1></header>{children}</section>
}));
vi.mock('../consola/ConsolaSection.jsx', () => ({ ConsolaIncrustada: () => null }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: () => ({ url: null, status: 'idle', isLoading: false })
}));
vi.mock('../gestoria/tauler/ShellGestoria.jsx', async () => {
  const { useState } = await import('react');
  const { useNavigate } = await import('../../app/contexts/RouterContext');
  return {
    default: function ShellGestoriaDeProva() {
      const navigate = useNavigate();
      const [visible, setVisible] = useState(false);
      return (
        <div className="sdp-gestoria-closca">
          <nav aria-label="Panell de control de la Gestoria">Gestoria</nav>
          <header className="page-title"><h1>Tauler Central</h1></header>
          <button type="button" onClick={() => setVisible(true)}>Mostra l’estat privat</button>
          {visible ? <p>Estat privat sintètic</p> : null}
          <button type="button" onClick={() => navigate(CONSULTA_TRACTORS)}>Obri el panell de Tractors</button>
        </div>
      );
    }
  };
});
vi.mock('../gestoria/aprendre/Aprendre.jsx', () => ({ default: () => <p>Repàs d’Aprendre de prova</p> }));
vi.mock('../tractors/PanellTractors.jsx', () => ({ default: () => <p>Aprovació de tractors de prova</p> }));

import { Link, MemoryRouter, Route, Routes, useLocation, useNavigate } from '../../app/contexts/RouterContext';
import { ProveidorPlataforma } from '../../apps/plataforma/PlataformaContext.jsx';
import { BarraLateral } from '../../apps/plataforma/BarraLateral.jsx';
import { UIProvider } from '../../app/contexts/UIContext.jsx';
import { preparaNavegador } from '../../apps/plataforma/__fixtures__/munta.jsx';
import RutaApps from '../../apps/plataforma/RutaApps.jsx';
import RutaWikiDePoble from './RutaWikiDePoble.jsx';
import { CONSULTA_TRACTORS } from '../gestoria/ContenidorGestoria.jsx';

function NavegacioDeProva() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  return (
    <nav aria-label="Prova">
      <Link to="/wikidepoble">Ves a la Wiki</Link>
      <Link to="/app/gestoria/tauler">Ves a la Gestoria</Link>
      <Link to="/app/gestoria/aprendre">Ves a Aprendre</Link>
      <button type="button" onClick={() => navigate(-1)}>Arrere de prova</button>
      <output aria-label="Ruta de prova">{pathname}{search ? `?${search}` : ''}</output>
    </nav>
  );
}

function munta(ruta, { basename = '' } = {}) {
  return render(
    <UIProvider>
      <MemoryRouter rutaInicial={ruta} basename={basename}>
        <ProveidorPlataforma entorn={{ produccio: false }}>
          <Routes>
            <Route path="/wikidepoble" element={<React.Suspense fallback={<p>Carregant la Wiki de prova</p>}><RutaWikiDePoble /></React.Suspense>} />
            <Route path="/app/*" element={<RutaApps />} />
            <Route path="/xat" element={<p>Xat de prova</p>} />
          </Routes>
          <nav aria-label="Navegació principal de prova">
            <BarraLateral><span>Menú Sóc de Poble de prova</span></BarraLateral>
          </nav>
          <NavegacioDeProva />
        </ProveidorPlataforma>
      </MemoryRouter>
    </UIProvider>
  );
}

const ruta = () => screen.getByLabelText('Ruta de prova').textContent;
const navega = (nom) => fireEvent.click(within(screen.getByRole('navigation', { name: 'Prova' })).getByRole('link', { name: nom }));

beforeEach(() => {
  preparaNavegador();
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

/* La Wiki sense cap rastre de la Gestoria: ni l'app, ni la closca, ni Aprendre,
   ni cap carpeta o document seu a l'arbre. */
function senseGestoria(container) {
  expect(container.querySelector('[data-sdp-app="gestoria"]')).toBeNull();
  expect(container.querySelector('.sdp-gestoria-closca')).toBeNull();
  expect(screen.queryByText('Repàs d’Aprendre de prova')).toBeNull();
  expect(screen.queryByText('Estat privat sintètic')).toBeNull();
  expect(screen.queryByRole('heading', { level: 1, name: 'Tauler Central' })).toBeNull();
  expect(screen.queryByRole('button', { name: /Gestoria de P/ })).toBeNull();
  expect(screen.queryByRole('button', { name: /Full trimestral/ })).toBeNull();
}

test.each([
  '/wikidepoble?categoria=gestoria_cat&item=gestoria_panell',
  '/wikidepoble?item=gestoria_panell',
  '/wikidepoble?categoria=gestoria_cat',
  '/wikidepoble?categoria=gestoria_cat&item=gestoria_aprendre'
])('l’enllaç antic %s es queda a la Wiki com un ítem desconegut: la portada i cap rastre de la Gestoria', async (antiga) => {
  const { container } = munta(`${antiga}&nom=no-ha-de-viatjar&seccio=privada`);
  expect(await screen.findByRole('heading', { level: 1, name: 'Wiki de Poble' })).toBeTruthy();
  expect(container.querySelector('.sdp-wiki-workspace')).toBeTruthy();
  expect(ruta()).toMatch(/^\/wikidepoble(?:\?|$)/);
  expect(ruta()).not.toMatch(/^\/app\//);
  senseGestoria(container);
  // Un instant després (cap redirecció diferida), igual.
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(ruta()).toMatch(/^\/wikidepoble(?:\?|$)/);
  senseGestoria(container);
});

test('els documents ordinaris conserven la consulta i la Wiki no mostra Gestoria', async () => {
  const { container } = munta('/wikidepoble?item=identitat');
  await screen.findByRole('heading', { level: 1, name: 'Identitat' });
  expect(ruta()).toBe('/wikidepoble?item=identitat');
  expect(container.querySelector('.sdp-wiki-workspace')).toBeTruthy();
  expect(container.querySelector('.sdp-gestoria-closca')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Gestoria de Poble' })).toBeNull();
});

test('tornar a la Wiki desmunta el rail i l’estat privat; entrar de nou comença net', async () => {
  const { container } = munta('/app/gestoria/tauler');
  await screen.findByRole('heading', { level: 1, name: 'Tauler Central' });
  fireEvent.click(screen.getByRole('button', { name: 'Mostra l’estat privat' }));
  expect(screen.getByText('Estat privat sintètic')).toBeTruthy();
  navega('Ves a la Wiki');
  await screen.findByRole('heading', { level: 1, name: 'Wiki de Poble' });
  expect(container.querySelector('.sdp-gestoria-closca')).toBeNull();
  expect(screen.queryByText('Estat privat sintètic')).toBeNull();
  navega('Ves a la Gestoria');
  await screen.findByRole('heading', { level: 1, name: 'Tauler Central' });
  expect(container.querySelector('.sdp-wiki-workspace')).toBeNull();
  expect(screen.queryByText('Estat privat sintètic')).toBeNull();
});

test('la consulta d’aprovació de Tractors des de la Gestoria porta a la Wiki', async () => {
  const { container } = munta('/app/gestoria/tauler');
  await screen.findByRole('heading', { level: 1, name: 'Tauler Central' });
  fireEvent.click(screen.getByRole('button', { name: 'Obri el panell de Tractors' }));
  await screen.findByText('Aprovació de tractors de prova');
  expect(ruta()).toBe('/wikidepoble?categoria=tractors_cat&item=tractors_aprovacio');
  expect(container.querySelector('.sdp-gestoria-closca')).toBeNull();
});

test.each(['gestoria_panell', 'gestoria_aprendre'])('des de l’enllaç antic %s, la Gestoria només s’obri per /app/gestoria; Aprendre i la fletxa de la barra tornen a la Wiki sense bucle', async (item) => {
  const { container } = munta(`/wikidepoble?categoria=gestoria_cat&item=${item}`);
  await screen.findByRole('heading', { level: 1, name: 'Wiki de Poble' });
  senseGestoria(container);
  await new Promise((resolve) => setTimeout(resolve, 0));
  navega('Ves a la Gestoria');
  await screen.findByRole('heading', { level: 1, name: 'Tauler Central' });
  expect(ruta()).toBe('/app/gestoria/tauler');
  const barra = screen.getByRole('navigation', { name: 'Navegació principal de prova' });
  fireEvent.click(within(barra).getByRole('link', { name: 'Aprendre' }));
  await screen.findByText('Repàs d’Aprendre de prova');
  expect(ruta()).toBe('/app/gestoria/aprendre');
  fireEvent.click(within(barra).getByRole('button', { name: 'Torna a Sóc de Poble' }));
  await screen.findByRole('heading', { level: 1, name: 'Wiki de Poble' });
  expect(ruta()).toMatch(/^\/wikidepoble(?:\?|$)/);
  expect(container.querySelector('.sdp-wiki-workspace')).toBeTruthy();
  senseGestoria(container);
});

test('la fletxa real de la barra conserva el document de la Wiki i la seua consulta', async () => {
  const { container } = munta('/wikidepoble?item=identitat');
  await screen.findByRole('heading', { level: 1, name: 'Identitat' });
  await new Promise((resolve) => setTimeout(resolve, 0));
  navega('Ves a la Gestoria');
  await screen.findByRole('heading', { level: 1, name: 'Tauler Central' });
  fireEvent.click(screen.getByRole('button', { name: 'Torna a Sóc de Poble' }));
  await screen.findByRole('heading', { level: 1, name: 'Identitat' });
  expect(ruta()).toBe('/wikidepoble?item=identitat');
  expect(container.querySelector('.sdp-wiki-workspace')).toBeTruthy();
  expect(container.querySelector('.sdp-gestoria-closca')).toBeNull();
});

test('en memòria i amb base WordPress: l’enllaç antic es queda a la Wiki i no toca la URL ni l’historial de l’amfitrió', async () => {
  const push = vi.spyOn(window.history, 'pushState');
  const replace = vi.spyOn(window.history, 'replaceState');
  const urlAbans = window.location.href;
  const estatAbans = window.history.state;
  const llargariaAbans = window.history.length;
  const { container } = munta('/wikidepoble?item=gestoria_aprendre', { basename: '/poble' });
  await screen.findByRole('heading', { level: 1, name: 'Wiki de Poble' });
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(ruta()).toMatch(/^\/wikidepoble(?:\?|$)/);
  senseGestoria(container);
  expect(screen.getByRole('link', { name: 'Ves a la Wiki' }).getAttribute('href')).toBe('/poble/wikidepoble');
  expect(push).not.toHaveBeenCalled();
  expect(replace).not.toHaveBeenCalled();
  expect(window.location.href).toBe(urlAbans);
  expect(window.history.state).toBe(estatAbans);
  expect(window.history.length).toBe(llargariaAbans);
});

test('fora de DEV, igual que en DEV: una consulta antiga no importa ni obri la Gestoria', async () => {
  vi.stubEnv('DEV', false);
  const { container } = munta('/wikidepoble?item=gestoria_panell');
  await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Wiki de Poble' })).toBeTruthy());
  expect(ruta()).toMatch(/^\/wikidepoble(?:\?|$)/);
  senseGestoria(container);
});
