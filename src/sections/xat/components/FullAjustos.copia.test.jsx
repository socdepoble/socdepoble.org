/* Onada R28 (pla 261115_0135, Lot C3) · La porta de la còpia `.sdpbackup` al
   full Ajustos: Ajustos › Xats › «Còpia de seguretat», amb les dos accions
   reals («Desa una còpia xifrada» i «Comprova una còpia») dins del mateix
   marc, el focus al ‹ de cada pàgina nova i a la fila que l'havia obert en
   tornar, la cerca que les troba, i sense `PaginaCopia` (el catàleg) l'avís
   honest en lloc de cap formulari. FullAjustos hi passa la pàgina en diferit
   i, muntada de veres dins de ClosCaXat, la pàgina diferida comprova una còpia
   amb el motor de veres. jsdom no té showModal: el Dialeg hi posa `open`.
   Onada R28 · copia-xat-01 · Amb lazyRouteRenovable i una barrera pròpia: si
   el tros no arriba, l'avís es queda dins del full amb «Torna-ho a provar». */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Component } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { lazyRouteRenovable } from '../../../apps/plataforma/lazyRoute.js';
import { delVal, getVal, setVal } from '../../../config/storage.js';
import { exportaCopiaSeguretatXat } from '../../../data/xat/copiaSeguretatPortatil.js';
import ClosCaXat, { BotoObriRail, CLAU_RAIL } from './ClosCaXat.jsx';
import { CosAjustos, paginaDiferidaRenovable } from './FullAjustos.jsx';
import PanellInicialMobil from './PanellInicialMobil.jsx';

const JO = '0b6a1f5e-6a2c-4f3e-9d1a-2b3c4d5e6f70';
const TENANT = '2d8c3b70-8c4e-4b50-9f3c-4d5e6f708192';
const AMBIT = JSON.stringify([`backend:${JSON.stringify(['supabase', 'https://exemple.supabase.co', TENANT, 'remote'])}`, JO, null]);

const mocks = vi.hoisted(() => ({ xat: {} }));
vi.mock('../../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/xat' }),
  useSearchParams: () => [new URLSearchParams()],
  useParams: () => ({})
}));
vi.mock('../../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa, setTheme: vi.fn(), setLanguage: vi.fn() }),
  useUIState: () => ({ themePreference: 'light', language: 'ca', locale: 'ca-ES' })
}));
vi.mock('../../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', towns: [] }) }));
vi.mock('../XatContext', () => ({ useXat: () => mocks.xat }));
vi.mock('../../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => null, useSession: () => null }));

const t = (_clau, reserva) => reserva;
const titol = () => document.querySelector('.sdp-xat-ajustos__titol')?.textContent;
const fila = (nom) => screen.getByRole('button', { name: nom });

function PaginaDeProva({ accio }) {
  return <p data-testid="pagina-copia">{`accio:${accio}`}</p>;
}

/* AppGridShell mesura el contenidor: 1280 és ample (el rail obert, amb «Tu» al peu). */
Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return 1280; } });

let railAbans = null;
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  railAbans = getVal(CLAU_RAIL);
  mocks.xat = { comunitats: [], joId: JO, joNom: 'Javi Llinares', joAvatar: null, ambitEstable: AMBIT, chatThreads: [], getThreadMessages: () => [] };
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  if (railAbans == null) delVal(CLAU_RAIL);
  else setVal(CLAU_RAIL, railAbans);
});

test('Xats › Còpia de seguretat: la nota honesta i les dos accions, que empenyen la seua pàgina', () => {
  render(<CosAjustos t={t} PaginaCopia={PaginaDeProva} />);
  fireEvent.click(fila('Xats'));
  fireEvent.click(fila('Còpia de seguretat'));
  expect(titol()).toBe('Còpia de seguretat');
  expect(screen.getByText(/Restaurar-la dins de l’app encara no és possible/)).toBeTruthy();
  const targeta = document.querySelector('.sdp-xat-ajustos__targeta');
  expect(within(targeta).getAllByRole('button').map((b) => b.textContent)).toEqual(['Desa una còpia xifrada', 'Comprova una còpia']);

  fireEvent.click(fila('Desa una còpia xifrada'));
  expect(titol()).toBe('Desa una còpia xifrada');
  expect(screen.getByTestId('pagina-copia').textContent).toBe('accio:desa');
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Torna a Còpia de seguretat' }));

  fireEvent.click(screen.getByRole('button', { name: 'Torna a Còpia de seguretat' }));
  expect(document.activeElement).toBe(fila('Desa una còpia xifrada'));
  fireEvent.click(fila('Comprova una còpia'));
  expect(titol()).toBe('Comprova una còpia');
  expect(screen.getByTestId('pagina-copia').textContent).toBe('accio:comprova');
});

test('la cerca dels ajustos troba la còpia i obri la pàgina de l’acció', () => {
  render(<CosAjustos t={t} PaginaCopia={PaginaDeProva} />);
  fireEvent.change(screen.getByRole('searchbox', { name: 'Cerca als ajustos' }), { target: { value: 'copia' } });
  /* Cada resultat porta en gris la pàgina on viu. */
  const resultats = screen.getAllByRole('button').filter((b) => b.dataset.sdpFila).map((b) => b.textContent);
  expect(resultats).toEqual(['Còpia de seguretatXats', 'Desa una còpia xifradaCòpia de seguretat', 'Comprova una còpiaCòpia de seguretat']);
  fireEvent.click(screen.getByRole('button', { name: /^Comprova una còpia/ }));
  expect(titol()).toBe('Comprova una còpia');
  expect(screen.getByTestId('pagina-copia').textContent).toBe('accio:comprova');
});

test('sense PaginaCopia (fora del xat, el catàleg) no hi ha cap formulari: només l’avís', () => {
  render(<CosAjustos t={t} pilaInicial={[{ id: 'arrel', origen: null }, { id: 'xats', origen: 'xats' }, { id: 'copia', origen: 'xats-copia' }, { id: 'copia-desa', origen: 'copia-desa' }]} />);
  expect(titol()).toBe('Desa una còpia xifrada');
  expect(screen.getByText('Entra al xat amb el teu compte per a fer o comprovar una còpia.')).toBeTruthy();
  expect(screen.queryByLabelText('Contrasenya de la còpia')).toBeNull();
});

test('FullAjustos carrega la pàgina de la còpia en diferit: el motor no entra al tros de /xat per un import estàtic', () => {
  const font = readFileSync(path.join(process.cwd(), 'src/sections/xat/components/FullAjustos.jsx'), 'utf8');
  /* Onada R28 · copia-xat-01 · Amb lazyRoute (LazyRouteError i la recuperació
     de l'entrada web), mai amb el lazy nu de React. */
  expect(font).toMatch(/lazyRoute(Renovable)?\(\(\) => import\('\.\/PaginaCopiaSeguretatXat\.jsx'\)\)/);
  expect(font).not.toMatch(/(?<![\w.])lazy\(/);
  expect(font).not.toMatch(/^import[^;]*\blazy\b[^;]*from 'react'/m);
  expect(font).not.toMatch(/^import[^;]*PaginaCopiaSeguretatXat/m);
  expect(font).not.toMatch(/^import[^;]*copiaSeguretatPortatil/m);
  expect(font).not.toMatch(/^import[^;]*copiaSeguretatXat/m);
});

/* Onada R28 · copia-xat-01 · Un tros que no arriba (sense connexió, o un
   desplegament nou) es queda dins del full, amb «Torna-ho a provar»; cap altre
   error s'hi amaga. La pàgina diferida es fa amb la mateixa fàbrica que
   FullAjustos (paginaDiferidaRenovable i lazyRouteRenovable). */
const PILA_DESA = [{ id: 'arrel', origen: null }, { id: 'xats', origen: 'xats' }, { id: 'copia', origen: 'xats-copia' }, { id: 'copia-desa', origen: 'copia-desa' }];

/* Els errors que React i jsdom informen quan una barrera para un render: són
   els esperats, i no s'han de pintar a l'eixida de la prova. */
function callaErrorsEsperats() {
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  const calla = (event) => event.preventDefault();
  window.addEventListener('error', calla);
  return () => {
    window.removeEventListener('error', calla);
    errors.mockRestore();
  };
}

class BarreraDeProva extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() { return this.state.error ? <p data-testid="barrera-de-fora">{String(this.state.error.message)}</p> : this.props.children; }
}

test('si el tros de la còpia no arriba: l’avís dins del full, sense bucle, i «Torna-ho a provar» el torna a demanar', async () => {
  const importa = vi.fn()
    .mockRejectedValueOnce(new TypeError('Failed to fetch dynamically imported module'))
    .mockResolvedValue({ default: PaginaDeProva });
  const PaginaCopia = paginaDiferidaRenovable(lazyRouteRenovable(importa));
  const restaura = callaErrorsEsperats();
  try {
    render(<BarreraDeProva><CosAjustos t={t} pilaInicial={PILA_DESA} PaginaCopia={PaginaCopia} /></BarreraDeProva>);
    const avis = await screen.findByRole('alert');
    expect(avis.textContent).toContain('No s’ha pogut obrir esta pàgina. Comprova que tens connexió i torna-ho a provar.');
    /* Dins del full: el títol de la pàgina i el ‹ hi són, i la barrera de fora no ha vist res. */
    expect(titol()).toBe('Desa una còpia xifrada');
    expect(screen.getByRole('button', { name: 'Torna a Còpia de seguretat' })).toBeTruthy();
    expect(screen.queryByTestId('barrera-de-fora')).toBeNull();
    /* Mai en bucle: el rebuig no torna a demanar el tros tot sol. */
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(importa).toHaveBeenCalledTimes(1);

    fireEvent.click(within(avis).getByRole('button', { name: 'Torna-ho a provar' }));
    expect((await screen.findByTestId('pagina-copia')).textContent).toBe('accio:desa');
    expect(importa).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).toBeNull();
    /* El focus, al ‹ de la pàgina, com en entrar-hi. */
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Torna a Còpia de seguretat' }));
  } finally {
    restaura();
  }
});

test('tornar a entrar a la pàgina després d’una fallada també és una intenció nova', async () => {
  const importa = vi.fn()
    .mockRejectedValueOnce(new TypeError('Failed to fetch dynamically imported module'))
    .mockResolvedValue({ default: PaginaDeProva });
  const PaginaCopia = paginaDiferidaRenovable(lazyRouteRenovable(importa));
  const restaura = callaErrorsEsperats();
  try {
    render(<CosAjustos t={t} pilaInicial={PILA_DESA} PaginaCopia={PaginaCopia} />);
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Torna a Còpia de seguretat' }));
    fireEvent.click(fila('Desa una còpia xifrada'));
    expect((await screen.findByTestId('pagina-copia')).textContent).toBe('accio:desa');
    expect(importa).toHaveBeenCalledTimes(2);
  } finally {
    restaura();
  }
});

test('qualsevol altre error de la pàgina de la còpia no s’amaga: puja a la barrera de fora', async () => {
  function PaginaQueFalla() { throw new Error('una fallada que no és de càrrega'); }
  const PaginaCopia = paginaDiferidaRenovable(lazyRouteRenovable(async () => ({ default: PaginaQueFalla })));
  const restaura = callaErrorsEsperats();
  try {
    render(<BarreraDeProva><CosAjustos t={t} pilaInicial={PILA_DESA} PaginaCopia={PaginaCopia} /></BarreraDeProva>);
    expect((await screen.findByTestId('barrera-de-fora')).textContent).toBe('una fallada que no és de càrrega');
    expect(screen.queryByText(/No s’ha pogut obrir esta pàgina/)).toBeNull();
  } finally {
    restaura();
  }
});

test('dins de ClosCaXat: Tu › Xats › Còpia de seguretat › Comprova una còpia carrega la pàgina diferida i comprova de veres', async () => {
  const CONTRASENYA = 'farcell de la iaia 2026';
  const text = await exportaCopiaSeguretatXat({
    usuariId: JO, tenantId: TENANT, contrasenya: CONTRASENYA,
    fils: [{ id: 'fil-1', titol: 'Forn de Dalt' }],
    missatges: [{ id: 'm-1', filId: 'fil-1', seq: 1, text: 'Una fogassa, per favor', creatAl: '2026-11-10T08:00:00.000Z' }]
  });
  setVal(CLAU_RAIL, 'obert');
  render(<ClosCaXat middleTitle="Xats" middleColumn={<aside className="sdp-workspace-column" aria-label="Xats"><PanellInicialMobil /><BotoObriRail etiqueta="Menú" /></aside>} rightColumn={<div />} />);
  fireEvent.click(within(document.getElementById('app-grid-sidebar')).getByRole('button', { name: 'Ajustos del xat' }));
  const full = screen.getByRole('dialog', { name: 'Ajustos' });
  const filaDelFull = (nom) => within(full).getByRole('button', { name: new RegExp(`^${nom}`) });
  fireEvent.click(filaDelFull('Xats'));
  fireEvent.click(filaDelFull('Còpia de seguretat'));
  fireEvent.click(filaDelFull('Comprova una còpia'));

  const arxiu = await within(full).findByLabelText('Arxiu de la còpia', {}, { timeout: 10000 });
  const bytes = new TextEncoder().encode(text);
  fireEvent.change(arxiu, { target: { files: [{ name: 'forn.sdpbackup', size: bytes.length, arrayBuffer: async () => bytes.buffer }] } });
  await within(full).findByText('Arxiu triat: forn.sdpbackup', {}, { timeout: 10000 });
  fireEvent.change(within(full).getByLabelText('Contrasenya de la còpia'), { target: { value: CONTRASENYA } });
  fireEvent.click(within(full).getByRole('button', { name: 'Comprova la còpia' }));
  expect(await within(full).findByText('La còpia s’obri i està intacta', {}, { timeout: 10000 })).toBeTruthy();
  expect(within(full).getByText('Converses: 1 · Missatges: 1')).toBeTruthy();
});
