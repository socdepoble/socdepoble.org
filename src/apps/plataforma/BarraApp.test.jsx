/* Plataforma d'Apps Enxufables · el relleu de la barra lateral
   (BarraLateral.jsx i BarraApp.jsx). Dins d'una app, la seua barra amb un sol
   aria-current i la fletxa a Sóc de Poble; fora, la barra de Sóc de Poble
   TAL QUAL (Llei del Píxel). */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { BrowserRouter, Link } from '../../app/contexts/RouterContext.jsx';
import { UIProvider } from '../../app/contexts/UIContext.jsx';
import { DEFAULT_SECTION_PATH } from '../../config/sections';
import { muntaPlataforma, preparaNavegador } from './__fixtures__/munta.jsx';
import { manifestDeProva } from './__fixtures__/manifests.js';
import { BarraLateral, TITOL_MENU_SDP, useTitolBarraLateral } from './BarraLateral.jsx';
import { creaRegistre } from './registreApps.js';

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
});

const registre = () => creaRegistre({
  internes: [
    manifestDeProva({
      grups: [{ id: 'gestio', titol: { ca: 'Gestió' } }],
      entrades: [
        { slug: 'inici', titol: { ca: 'Inici' }, icona: 'LayoutGrid' },
        { slug: 'caixa', titol: { ca: 'Caixa' }, icona: 'Receipt' },
        { slug: 'caixa-b', titol: { ca: 'Caixa B' }, icona: 'Receipt', grup: 'gestio' }
      ]
    }),
    manifestDeProva({ id: 'tancada', titol: { ca: 'Tancada' }, actiuPerDefecte: false })
  ]
});

/* La barra de Sóc de Poble de prova: el que App.jsx passa com a fills. */
function BarraSdp() {
  return (
    <>
      <button type="button" className="brand sdp-unstyled-btn" aria-label="Obrir o tancar menú Sóc de Poble" />
      <div className="sidebar-control-row"><button type="button" className="sidebar-control-btn" aria-label="Panell de control" /></div>
      <a className="nav-item" href="/xat" aria-label="Xat">Xat</a>
    </>
  );
}

function Titol() {
  return <output data-testid="titol-menu">{useTitolBarraLateral()}</output>;
}

function muntaBarra(url, { toggleSidebar = vi.fn(), isCompact = false, isDesktopSidebarClosed = false } = {}) {
  const resultat = muntaPlataforma(url, {
    registre: registre(),
    fills: (
      <>
        <nav aria-label="Navegació principal">
          <BarraLateral isCompact={isCompact} isDesktopSidebarClosed={isDesktopSidebarClosed} toggleSidebar={toggleSidebar}>
            <BarraSdp />
          </BarraLateral>
        </nav>
        <Titol />
        <Link to="/app/prova/inici">Entra a la prova</Link>
        <Link to="/xat?vista=comunitats">Ves a comunitats</Link>
      </>
    )
  });
  return { ...resultat, nav: screen.getByRole('navigation', { name: 'Navegació principal' }), toggleSidebar };
}

/* Què diu «estic ací» dins de la barra. */
const actius = (nav) => [...nav.querySelectorAll('[aria-current]')].map((el) => el.getAttribute('href') ?? el.getAttribute('aria-label'));

describe('Llei del Píxel: fora d’una app, la barra de Sóc de Poble no canvia', () => {
  /* Els nodes que pinten els fills sols, sense BarraLateral: la referència. */
  function nodesDeReferencia() {
    preparaNavegador();
    const { container } = render(<UIProvider><BrowserRouter><nav><BarraSdp /></nav></BrowserRouter></UIProvider>);
    const nodes = [...container.querySelector('nav').childNodes].map((node) => node.cloneNode(true));
    cleanup();
    return nodes;
  }

  test.each(['/xat', '/mur', '/control', '/app', '/app/fantasma/inici', '/app/tancada/inici', '/app/prova/Caixa', '/app//prova/inici'])(
    '%s pinta els fills tal qual', (url) => {
      const referencia = nodesDeReferencia();
      const { nav } = muntaBarra(url);
      const pintats = [...nav.childNodes];
      expect(pintats).toHaveLength(referencia.length);
      pintats.forEach((node, i) => expect(node.isEqualNode(referencia[i]), `node ${i}`).toBe(true));
      expect(screen.getByTestId('titol-menu').textContent).toBe(TITOL_MENU_SDP);
    }
  );
});

describe('dins d’una app', () => {
  test('la barra de l’app reemplaça la de Sóc de Poble i porta un sol aria-current', () => {
    const { nav } = muntaBarra('/app/prova/caixa');
    expect(within(nav).queryByRole('button', { name: 'Panell de control' })).toBeNull();
    expect(within(nav).getByRole('button', { name: 'Torna a Sóc de Poble' })).toBeTruthy();
    expect(within(nav).getByRole('button', { name: 'Obrir o tancar menú La Prova' }).classList.contains('brand')).toBe(true);
    expect(nav.querySelector('.sdp-app-barra__titol').textContent).toBe('La Prova');
    const enllacos = within(nav).getAllByRole('link');
    expect(enllacos.map((a) => a.getAttribute('href'))).toEqual(['/app/prova/inici', '/app/prova/caixa', '/app/prova/caixa-b']);
    for (const a of enllacos) expect(a.classList.contains('nav-item')).toBe(true);
    expect(actius(nav)).toEqual(['/app/prova/caixa']);
    expect(within(nav).getByRole('group', { name: 'Gestió' })).toBeTruthy();
    expect(screen.getByTestId('titol-menu').textContent).toBe('Menú La Prova');
  });

  test('a una subruta de l’entrada, s’encén només eixa entrada (caixa, no caixa-b)', () => {
    const { nav } = muntaBarra('/app/prova/caixa/t-3');
    expect(actius(nav)).toEqual(['/app/prova/caixa']);
  });

  test('una entrada que no existix no encén res', () => {
    const { nav } = muntaBarra('/app/prova/fantasma');
    expect(actius(nav)).toEqual([]);
  });

  test('navegar entre entrades fa push i mou l’únic aria-current', () => {
    const { nav } = muntaBarra('/app/prova/inici');
    const llarg = window.history.length;
    fireEvent.click(within(nav).getByRole('link', { name: 'Caixa B' }));
    expect(window.location.pathname).toBe('/app/prova/caixa-b');
    expect(window.history.length).toBe(llarg + 1);
    expect(actius(nav)).toEqual(['/app/prova/caixa-b']);
  });

  test('la fletxa torna (push) a l’última ruta de Sóc de Poble, amb la consulta', () => {
    muntaBarra('/mur');
    fireEvent.click(screen.getByRole('link', { name: 'Ves a comunitats' }));
    fireEvent.click(screen.getByRole('link', { name: 'Entra a la prova' }));
    const nav = screen.getByRole('navigation', { name: 'Navegació principal' });
    const llarg = window.history.length;
    act(() => { fireEvent.click(within(nav).getByRole('button', { name: 'Torna a Sóc de Poble' })); });
    expect(window.location.pathname + window.location.search).toBe('/xat?vista=comunitats');
    expect(window.history.length).toBe(llarg + 1);
    expect(within(nav).getByRole('button', { name: 'Panell de control' })).toBeTruthy();
  });

  test('entrant directament per un enllaç, la fletxa porta a DEFAULT_SECTION_PATH', () => {
    const { nav } = muntaBarra('/app/prova/inici');
    fireEvent.click(within(nav).getByRole('button', { name: 'Torna a Sóc de Poble' }));
    expect(window.location.pathname).toBe(DEFAULT_SECTION_PATH);
  });

  test('en compacte, triar una entrada o la fletxa tanca el calaix; cap botó de plegar', () => {
    const { nav, toggleSidebar } = muntaBarra('/app/prova/inici', { isCompact: true });
    expect(within(nav).queryByRole('button', { name: /barra lateral/ })).toBeNull();
    fireEvent.click(within(nav).getByRole('link', { name: 'Caixa' }));
    expect(toggleSidebar).toHaveBeenCalledTimes(1);
    fireEvent.click(within(nav).getByRole('button', { name: 'Torna a Sóc de Poble' }));
    expect(toggleSidebar).toHaveBeenCalledTimes(2);
  });

  test('en escriptori, el botó de plegar i el de la marca obrin i tanquen la barra', () => {
    const { nav, toggleSidebar } = muntaBarra('/app/prova/inici', { isDesktopSidebarClosed: true });
    const plegar = within(nav).getByRole('button', { name: 'Desplegar barra lateral' });
    expect(plegar.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(plegar);
    fireEvent.click(within(nav).getByRole('button', { name: 'Obrir o tancar menú La Prova' }));
    expect(toggleSidebar).toHaveBeenCalledTimes(2);
  });

  test('cap style= ni cap HTML de l’app: tot ve de classes i icones de la llista', () => {
    const { nav } = muntaBarra('/app/prova/caixa');
    expect(nav.querySelectorAll('[style]')).toHaveLength(0);
    expect(nav.querySelectorAll('iframe, script')).toHaveLength(0);
    /* L'única imatge és la marca de Sóc de Poble (BrandMark), com a la seua barra. */
    expect([...nav.querySelectorAll('img')].map((img) => img.className)).toEqual(['app-brand__mark']);
  });
});
