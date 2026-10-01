/* Revisió adversarial 260930 i ordre del Mestre 260930 · El full «Ajustos»
   muntat de veres dins de ClosCaXat (el mateix banc que FullAjustos.test.jsx):
   · P2: «llengua» troba la secció Llengua i la porta a l'Aparença;
   · P3: després de «No eixir encara» el focus torna a «Tanca la sessió», no
     cau a <body> (a l'encastat, un Tab des de <body> ixia del modal);
   · P3: l'estat buit mostra el terme tal com s'ha escrit, també amb $&, $'…;
   · P3: la nota de l'arrel diu on porta «Privacitat» (decisió pendent del
     Mestre: el Perfil no s'obri en «Privacitat i dades»);
   · P2 (ordre del Mestre): «Tanca la sessió» no recarrega la pàgina: a
     WordPress la recàrrega s'emportava l'amfitrió sencer.
   jsdom no té showModal: el Dialeg hi posa `open`. jsdom tampoc no navega i
   no deixa substituir `location.reload` (propietat no configurable): una
   recàrrega hi emet un `jsdomError` «Not implemented: navigation…» per la
   consola virtual de la finestra (window._virtualConsole). Eixe avís és el
   que es vigila; si la consola virtual no hi és, la prova falla en lloc de
   passar sense comprovar res. */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { delVal, getVal, setVal } from '../../../config/storage.js';
import ClosCaXat, { BotoObriRail, CLAU_RAIL } from './ClosCaXat.jsx';
import PanellInicialMobil from './PanellInicialMobil.jsx';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  sessio: null
}));

vi.mock('../../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: '/xat' }),
  useSearchParams: () => [new URLSearchParams()],
  useParams: () => ({})
}));
vi.mock('../../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa, setTheme: vi.fn(), setLanguage: vi.fn() }),
  useUIState: () => ({ themePreference: 'light', language: 'ca' })
}));
vi.mock('../XatContext', () => ({
  useXat: () => ({ comunitats: [], joId: 'jo', joNom: 'Javi Llinares', chatThreads: [] })
}));
vi.mock('../../../app/contexts/SessionContext.jsx', () => ({
  useSessioOpcional: () => mocks.sessio,
  useSession: () => mocks.sessio
}));

Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return 1280; } });

let abans = null;
let navegacions = [];
const escoltaJsdom = (error) => {
  if (/Not implemented: navigation/.test(String(error?.message))) navegacions.push(error.message);
};

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  abans = getVal(CLAU_RAIL);
  setVal(CLAU_RAIL, 'obert');
  mocks.navigate.mockReset();
  mocks.sessio = null;
  navegacions = [];
  window._virtualConsole?.on('jsdomError', escoltaJsdom);
});
afterEach(() => {
  cleanup();
  window._virtualConsole?.off('jsdomError', escoltaJsdom);
  vi.unstubAllGlobals();
  if (abans == null) delVal(CLAU_RAIL);
  else setVal(CLAU_RAIL, abans);
});

function obriElFull() {
  render(
    <ClosCaXat
      middleTitle="Xats"
      middleColumn={<aside className="sdp-workspace-column" aria-label="Xats"><PanellInicialMobil /><BotoObriRail etiqueta="Menú" /></aside>}
      rightColumn={<div />}
    />
  );
  const boto = within(document.getElementById('app-grid-sidebar')).getByRole('button', { name: 'Tu: ajustos' });
  boto.focus();
  fireEvent.click(boto);
}

const full = () => screen.getByRole('dialog', { name: 'Ajustos' });
const titol = () => within(full()).getByRole('heading', { level: 2 }).textContent;
const fila = (nom) => within(full()).getByRole('button', { name: new RegExp(`^${nom}`) });
const cerca = (terme) => fireEvent.change(within(full()).getByRole('searchbox'), { target: { value: terme } });

function ambSessio({ pendents = [], capacitats = [] } = {}) {
  mocks.sessio = {
    currentUser: { id: 'jo', email: 'javi@exemple.org' },
    logout: vi.fn(async () => {}),
    preparaEixida: vi.fn(async () => pendents),
    teCapacitat: (capacitat) => capacitats.includes(capacitat)
  };
}

test('P2 · «llengua» troba la secció Llengua, que obri l’Aparença; en tornar, el focus és al resultat', () => {
  obriElFull();
  cerca('llengua');
  const llengua = fila('Llengua');
  expect(llengua.textContent).toBe('LlenguaAparença');
  expect(llengua.querySelector('svg.lucide-chevron-right')).toBeTruthy();
  llengua.focus();
  fireEvent.click(llengua);
  expect(titol()).toBe('Aparença');
  expect(within(full()).getByRole('group', { name: 'Llengua' })).toBeTruthy();
  fireEvent.click(within(full()).getByRole('button', { name: 'Torna a Ajustos' }));
  expect(document.activeElement).toBe(fila('Llengua'));
});

test('P3 · després de «No eixir encara», el focus torna a «Tanca la sessió»', async () => {
  ambSessio({ pendents: [{ entitat: 'nota', camps: ['content'] }] });
  obriElFull();
  fireEvent.click(fila('Compte'));
  const eixida = within(full()).getByRole('button', { name: 'Tanca la sessió' });
  fireEvent.click(eixida);
  const noEixir = await within(full()).findByRole('button', { name: 'No eixir encara' });
  expect(document.activeElement).toBe(noEixir);
  fireEvent.click(noEixir);
  await waitFor(() => expect(within(full()).queryByText('Encara hi ha canvis sense desar')).toBeNull());
  expect(eixida.disabled).toBe(false);
  expect(document.activeElement).toBe(eixida);
  expect(mocks.sessio.logout).not.toHaveBeenCalled();
});

test('P3 · l’estat buit mostra el terme tal com s’ha escrit, sense interpretar-ne els patrons $', () => {
  obriElFull();
  for (const terme of ['zz$&', "zz$'", 'zz$`', 'zz$$']) {
    cerca(terme);
    expect([terme, within(full()).getByRole('status').textContent]).toEqual([terme, `Cap resultatCap ajust coincidix amb «${terme}».`]);
  }
});

test('P3 · la nota de l’arrel diu on porta «Privacitat», i no promet un apartat que el servidor no té', () => {
  ambSessio({ capacitats: ['consentiment'] });
  obriElFull();
  expect(within(full()).getByText('«Privacitat» obri el teu perfil: hi trobaràs l’apartat «Privacitat i dades».')).toBeTruthy();
  cleanup();

  ambSessio({ capacitats: [] });
  obriElFull();
  expect(within(full()).getByText('«Privacitat» obri el teu perfil, però el servidor d’este poble encara no hi ofereix l’apartat «Privacitat i dades».')).toBeTruthy();
  fireEvent.click(fila('Privacitat'));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/el-meu-perfil');
});

test('Ordre del Mestre · «Tanca la sessió» ix sense recarregar la pàgina: tanca la sessió i porta a /registre', async () => {
  expect(typeof window._virtualConsole?.on).toBe('function');
  ambSessio();
  obriElFull();
  fireEvent.click(fila('Compte'));
  fireEvent.click(within(full()).getByRole('button', { name: 'Tanca la sessió' }));
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/registre', { replace: true }));
  expect(mocks.sessio.logout).toHaveBeenCalledTimes(1);
  expect(navegacions).toEqual([]);
});
