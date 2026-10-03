/* Plataforma d'Apps Enxufables · ClosaAplicacio, l'esquelet comú (P1-R1).
   Una sola taula de rutes alimenta les tres columnes d'AppGridShell: el que
   comparteixen el TPV del bar i La Compra. S'entra per l'API pública
   (index.js), com ho farà una app. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { lazy, memo, useState } from 'react';
import { Link } from '../../app/contexts/RouterContext.jsx';
import { muntaPlataforma } from './__fixtures__/munta.jsx';
import { manifestDeProva } from './__fixtures__/manifests.js';
import {
  ClosaAplicacio, PANELLS_ESTRET, esData, esIdOpac, useApp, useClosaAplicacio, validaRutes, validaTaulaDeClosa
} from './index.js';
import { creaRegistre } from './registreApps.js';

/* Les tres columnes d'una app de prova, amb noms neutres: la mateixa forma
   serviria per a categories | productes | comanda o llistes | articles | detall. */
function Grups() {
  const { ruta } = useApp();
  return (
    <div>
      <p>Grups</p>
      <Link to={ruta('inici', 'a-3')}>Grup a-3</Link>
    </div>
  );
}

function Llista({ params }) {
  const { ruta } = useApp();
  const { mida, panellObert, obriPanell, tancaPanells } = useClosaAplicacio();
  const [comptador, setComptador] = useState(0);
  return (
    <div>
      <p>Llista {params.elementId || 'cap'}</p>
      <output data-testid="closa">{`${mida}:${panellObert || 'cap'}`}</output>
      <button type="button" onClick={() => setComptador((n) => n + 1)}>{`Compta ${comptador}`}</button>
      <button type="button" onClick={() => obriPanell('esquerra')}>Obri els grups</button>
      <button type="button" onClick={() => obriPanell('constructor')}>Obri res</button>
      <button type="button" onClick={tancaPanells}>Tanca els panells</button>
      <Link to={ruta('inici', 'a-9')}>Obri a-9</Link>
      <Link to={ruta('caixa')}>Ves a la caixa</Link>
    </div>
  );
}

const Element = ({ params }) => <p>Element {params.elementId}</p>;
const SenseElement = () => <p>Tria un element</p>;
const Caixa = ({ params }) => <p>Caixa {params.dia || 'oberta'}</p>;

const RUTES = [
  { path: 'inici', Esquerra: Grups, Mig: Llista, Detall: SenseElement },
  { path: 'inici/:elementId', params: { elementId: esIdOpac }, Esquerra: Grups, Mig: Llista, Detall: Element, estret: 'detall' },
  { path: 'caixa', Esquerra: Grups, Mig: Llista, Detall: Caixa, estret: 'esquerra' },
  { path: 'caixa/:dia', params: { dia: esData }, Mig: Llista, Detall: Caixa }
];

const appAmb = (rutes) => function AppDeProva() {
  return <ClosaAplicacio rutes={rutes} titols={{ esquerra: 'Grups', mig: 'Llista' }} />;
};
const registreAmb = (rutes = RUTES) => creaRegistre({
  internes: [manifestDeProva({ carrega: () => Promise.resolve({ default: appAmb(rutes) }) })]
});

const ambAmplada = (amplada) => vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(amplada);
const columna = (id) => document.getElementById(id);
const closca = () => document.querySelector('.app-grid-shell');
const tancada = (id) => columna(id).getAttribute('aria-hidden') === 'true';

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('les columnes ixen de la URL', () => {
  test('enllaç profund: una sola taula pinta esquerra, mig i detall', async () => {
    ambAmplada(1400);
    muntaPlataforma('/app/prova/inici/a-7', { registre: registreAmb() });
    expect(await screen.findByText('Element a-7')).toBeTruthy();
    expect(closca().getAttribute('aria-label')).toBe('La Prova');
    expect(closca().dataset.layout).toBe('ample');
    expect(within(columna('app-grid-sidebar')).getByText('Grups')).toBeTruthy();
    expect(within(columna('app-grid-list')).getByText('Llista a-7')).toBeTruthy();
    expect(within(columna('app-grid-main')).getByText('Element a-7')).toBeTruthy();
    for (const id of ['app-grid-sidebar', 'app-grid-list', 'app-grid-main']) expect(tancada(id), id).toBe(false);
    expect(screen.getByTestId('closa').textContent).toBe('ample:cap');
    expect(screen.getByRole('separator', { name: 'Redimensionar Grups' })).toBeTruthy();
    expect(screen.getByRole('separator', { name: 'Redimensionar Llista' })).toBeTruthy();
  });

  test('navegar fa push i una columna amb el mateix component no es desmunta', async () => {
    ambAmplada(1400);
    muntaPlataforma('/app/prova/inici', { registre: registreAmb() });
    expect(await screen.findByText('Tria un element')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Compta 0' }));
    const llarg = window.history.length;

    fireEvent.click(screen.getByRole('link', { name: 'Obri a-9' }));
    expect(await screen.findByText('Element a-9')).toBeTruthy();
    expect(window.history.length).toBe(llarg + 1);
    expect(screen.getByRole('button', { name: 'Compta 1' })).toBeTruthy();

    await act(async () => { window.history.back(); });
    await waitFor(() => expect(screen.getByText('Tria un element')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Compta 1' })).toBeTruthy();
  });

  test('una ruta sense Esquerra deixa la columna esquerra buida', async () => {
    ambAmplada(1400);
    muntaPlataforma('/app/prova/caixa/2026-10-02', { registre: registreAmb() });
    expect(await screen.findByText('Caixa 2026-10-02')).toBeTruthy();
    expect(columna('app-grid-sidebar').childElementCount).toBe(0);
  });

  test.each(['/app/prova/inici/a-7/extra', '/app/prova/caixa/2026-02-30', '/app/prova/caixa/hui'])(
    'cap ruta casa (%s): l’avís de pàgina inexistent, mai un 404 mut', async (url) => {
      muntaPlataforma(url, { registre: registreAmb() });
      expect(await screen.findByText('Esta pàgina de l’app no existix')).toBeTruthy();
      expect(screen.getByRole('link', { name: 'Ves a La Prova' }).getAttribute('href')).toBe('/app/prova/inici');
      expect(closca()).toBeNull();
    }
  );
});

describe('«estret»: la ruta tria la columna que es veu', () => {
  test('mig per defecte, detall quan la ruta ho diu, i arrere hi torna', async () => {
    ambAmplada(375);
    muntaPlataforma('/app/prova/inici', { registre: registreAmb() });
    await screen.findByText('Tria un element');
    await waitFor(() => expect(closca().dataset.panell).toBe('middle'));
    expect(closca().dataset.layout).toBe('estret');
    expect(tancada('app-grid-list')).toBe(false);
    expect(tancada('app-grid-main')).toBe(true);
    expect(screen.getByTestId('closa').textContent).toBe('estret:mig');

    fireEvent.click(screen.getByRole('link', { name: 'Obri a-9' }));
    await screen.findByText('Element a-9');
    await waitFor(() => expect(closca().dataset.panell).toBe(''));
    expect(tancada('app-grid-main')).toBe(false);
    expect(tancada('app-grid-list')).toBe(true);

    await act(async () => { window.history.back(); });
    await waitFor(() => expect(closca().dataset.panell).toBe('middle'));
    expect(screen.getByText('Tria un element')).toBeTruthy();
  });

  test('una ruta amb estret «esquerra» obri el panell de l’esquerra', async () => {
    ambAmplada(375);
    muntaPlataforma('/app/prova/caixa', { registre: registreAmb() });
    await screen.findByText('Caixa oberta');
    await waitFor(() => expect(closca().dataset.panell).toBe('left'));
    expect(tancada('app-grid-sidebar')).toBe(false);
  });

  test('useClosaAplicacio obri els grups; triar-ne un porta al detall; tancar torna a la llista', async () => {
    ambAmplada(375);
    muntaPlataforma('/app/prova/inici', { registre: registreAmb() });
    await screen.findByText('Tria un element');
    await waitFor(() => expect(closca().dataset.panell).toBe('middle'));

    fireEvent.click(screen.getByRole('button', { name: 'Obri res' }));
    expect(closca().dataset.panell).toBe('middle');
    fireEvent.click(screen.getByRole('button', { name: 'Obri els grups' }));
    await waitFor(() => expect(closca().dataset.panell).toBe('left'));
    expect(screen.getByTestId('closa').textContent).toBe('estret:esquerra');

    fireEvent.click(within(columna('app-grid-sidebar')).getByRole('link', { name: 'Grup a-3' }));
    await screen.findByText('Element a-3');
    await waitFor(() => expect(closca().dataset.panell).toBe(''));

    await act(async () => { window.history.back(); });
    await waitFor(() => expect(closca().dataset.panell).toBe('middle'));
    /* En una ruta de llista, tancar els panells no deixa a la vista un detall buit. */
    fireEvent.click(screen.getByRole('button', { name: 'Tanca els panells' }));
    await waitFor(() => expect(closca().dataset.panell).toBe('middle'));
  });
});

describe('la taula de rutes', () => {
  test('una taula mal declarada no tomba l’App: avís i consola', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const dolenta = [{ path: 'inici', Mig: Llista }, { path: 'fantasma', Mig: Llista, Detall: Caixa }];
    muntaPlataforma('/app/prova/inici', { registre: registreAmb(dolenta) });
    expect(await screen.findByText('Esta app no es pot obrir')).toBeTruthy();
    expect(closca()).toBeNull();
    const missatges = errors.mock.calls.flat().flat().join(' ');
    expect(missatges).toContain('la columna Detall no és cap component');
    expect(missatges).toContain('«fantasma» no és cap entrada del manifest');
  });

  test('validaTaulaDeClosa: columnes, panell estret i entrades del manifest', () => {
    const manifest = manifestDeProva();
    expect(validaTaulaDeClosa(RUTES, manifest)).toEqual({ ok: true, errors: [] });
    expect(validaTaulaDeClosa([{ path: 'inici', Mig: memo(Llista), Detall: lazy(() => Promise.resolve({ default: Caixa })) }], manifest).ok).toBe(true);
    expect(PANELLS_ESTRET).toEqual(['esquerra', 'mig', 'detall']);
    const casos = [
      [{ path: 'inici', Detall: Caixa }, 'la columna Mig no és cap component'],
      [{ path: 'inici', Mig: Llista, Detall: 'Caixa' }, 'la columna Detall no és cap component'],
      [{ path: 'inici', Esquerra: {}, Mig: Llista, Detall: Caixa }, 'la columna Esquerra no és cap component'],
      [{ path: 'inici', Mig: Llista, Detall: Caixa, estret: 'dreta' }, 'estret ha de ser'],
      [{ path: 'inici', Mig: Llista, Detall: Caixa, estret: 'esquerra' }, 'sense columna Esquerra'],
      [{ path: ':id', params: { id: esIdOpac }, Mig: Llista, Detall: Caixa }, 'no és cap entrada del manifest']
    ];
    for (const [ruta, error] of casos) {
      const { ok, errors } = validaTaulaDeClosa([ruta], manifest);
      expect(ok, error).toBe(false);
      expect(errors.join(' '), error).toContain(error);
    }
    expect(validaTaulaDeClosa(null, manifest).ok).toBe(false);
  });

  test('validaRutes sense columnes no canvia: una taula de camins continua valent', () => {
    expect(validaRutes([{ path: 'inici' }, { path: 'inici/:id', params: { id: esIdOpac } }])).toEqual({ ok: true, errors: [] });
    expect(validaRutes([{ path: 'inici' }], { columnes: true }).ok).toBe(false);
  });
});
