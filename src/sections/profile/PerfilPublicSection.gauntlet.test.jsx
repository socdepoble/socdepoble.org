/** Gauntlet 261022: ruta + pàgina + port + adaptador + runtime reals.
 * Les fronteres d'host i fetch són fixtures controlades, sense xarxa.
 * Estos casos són independents de les proves del constructor de perfils.
 */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({
  host: vi.fn(), fetch: vi.fn(), seo: vi.fn(), titols: [],
  config: { dataMode: 'remote', supabaseUrl: 'https://gauntlet.invalid', supabaseAnonKey: 'sb_publishable_fixture_gauntlet', tenantId: '33333333-3333-4333-8333-333333333333' },
  identitat: { memberships: [], actor: null, setActor: vi.fn() },
  t: (_, alternativa) => alternativa
}));
vi.mock('../../host.js', () => ({ quanLlest: (opcions) => m.host(opcions) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: m.t, resolveAsset: (valor) => valor }),
  useUIState: () => ({ externalConfig: m.config, locale: 'ca-ES', language: 'ca' })
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => m.identitat }));
vi.mock('../xat/XatContext', () => ({ useXat: () => ({ senseSessio: true }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: (props) => m.seo(props) }));
vi.mock('../../hooks/useEntitatDelProjecte.js', () => ({ useEntitatDelProjecte: () => null }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({ useResolvedAsset: (valor) => valor }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: (props) => {
    m.titols.push(props.title);
    return <article><h1>{props.title}</h1>{props.subtitle && <h2>{props.subtitle}</h2>}<p>{props.lead}</p></article>;
  }
}));
/* Gauntlet 261025_0545 (DF-03) · L'adaptador ja no s'importa ací: el compon
   l'arrencada de l'host de veres, l'única porta cap a src/data/supabase
   (tractor-enxufe E1). <soc-de-poble> no hi pinta res, i a Vitest l'espai de
   noms del mòdul porta getters que el port no admet: el mock en fa la còpia
   plana, sense canviar cap mètode. */
vi.mock('../../PedraSecaEmbed.jsx', () => ({ defineCustomElement: vi.fn() }));
vi.mock('../../data/supabase/index.js', async (importOriginal) => ({ ...await importOriginal() }));
import { CONTRACTE_NUCLI } from '../../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../../data/backendPort.js';
import { MemoryRouter, Routes, Route, useNavigate } from '../../app/contexts/RouterContext.jsx';
import PerfilPublicSection from './PerfilPublicSection.jsx';

const resposta = (files) => ({ ok: true, status: 200, json: async () => files, headers: { get: () => null } });
const ajornada = () => {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
};
const buida = async () => { await act(async () => { await vi.dynamicImportSettled(); await vi.advanceTimersByTimeAsync(0); }); };
const avanca = async (ms) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
function Navegacio() {
  const navigate = useNavigate();
  return <button onClick={() => navigate('/empresa/actual')}>Canvia la ruta</button>;
}
function munta(ruta) {
  return render(<MemoryRouter rutaInicial={ruta}>
    <Navegacio />
    <Routes>
      <Route path="/javillinares" element={<PerfilPublicSection id="javillinares" />} />
      <Route path="/gent/:agentId" element={<PerfilPublicSection />} />
      <Route path="/empresa/:agentId" element={<PerfilPublicSection />} />
    </Routes>
  </MemoryRouter>);
}

/* Gauntlet 261025_0545 (DF-03) · El loadPerfilPublic de l'adaptador, tal com
   el deixa al port host.arrenca(). L'host que veu la pàgina continua sent la
   fixture de dalt; el de veres només compon. */
let loadPerfilPublic;
beforeAll(async () => {
  const { arrenca } = await vi.importActual('../../host.js');
  await arrenca();
  ({ loadPerfilPublic } = getBackendImplementation());
});

beforeEach(() => {
  vi.useFakeTimers(); vi.clearAllMocks(); m.titols = [];
  m.config = { ...m.config, dataMode: 'remote' };
  const impl = Object.fromEntries(CONTRACTE_NUCLI.map((nom) => [nom, () => { throw new Error(`Fora d’àmbit: ${nom}`); }]));
  /* Gauntlet 261025_0545 (DF-03) · L'arrencada ja ha segellat el port: en
     desenvolupament (Vitest ho és) `force` hi torna a posar el joc reduït. */
  setBackendImplementation({ ...impl, loadPerfilPublic }, true);
  m.host.mockResolvedValue(undefined);
  m.fetch.mockResolvedValue(resposta([]));
  vi.stubGlobal('fetch', m.fetch);
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

test('l’espera d’host forma part dels 3 s: es tanca i no enceta cap petició tardana', async () => {
  const host = ajornada();
  m.host.mockReturnValue(host.promise); // Host que ignora AbortSignal a posta.
  munta('/gent/desconegut'); await buida();
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Carregant el perfil…');
  await avanca(2999);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Carregant el perfil…');
  await avanca(1);
  expect(screen.getByRole('heading', { level: 1 }).textContent).not.toBe('Carregant el perfil…');
  expect(m.fetch).not.toHaveBeenCalled();
  await act(async () => { host.resolve(); }); await buida();
  expect(m.fetch).not.toHaveBeenCalled();
});

test('2 s d’host + xarxa pendent no es convertixen en 5 s i el transport es cancel·la', async () => {
  m.host.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 2000)));
  let senyal;
  m.fetch.mockImplementation((_url, { signal }) => {
    senyal = signal;
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Cancel·lada', 'AbortError')), { once: true }));
  });
  munta('/gent/desconegut'); await buida();
  await avanca(2000);
  expect(m.fetch).toHaveBeenCalledTimes(1);
  await avanca(999);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Carregant el perfil…');
  await avanca(1);
  expect(screen.getByRole('heading', { level: 1 }).textContent).not.toBe('Carregant el perfil…');
  expect(senyal.aborted).toBe(true);
});

test('canviar de ruta cancel·la l’anterior; una resposta tardana no substituïx el perfil actual', async () => {
  const tardana = ajornada(); let senyal;
  m.fetch.mockImplementation((url, { signal }) => {
    if (new URL(url).searchParams.get('slug') === 'eq.lenta') { senyal = signal; return tardana.promise; }
    return Promise.resolve(resposta([{ id: 'actual', slug: 'actual', name: 'Perfil actual', kind: 'company' }]));
  });
  munta('/empresa/lenta'); await buida();
  fireEvent.click(screen.getByRole('button', { name: 'Canvia la ruta' })); await buida();
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Perfil actual');
  expect(senyal.aborted).toBe(true);
  await act(async () => { tardana.resolve(resposta([{ id: 'lenta', name: 'Resposta vella', kind: 'company' }])); }); await buida();
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Perfil actual');
  expect(m.titols).not.toContain('Resposta vella');
});

const ALIES = ['/javillinares', '/gent/javillinares', '/gent/javi-llinares', '/gent/0001'];
test.each(['remote', 'seed', 'local'].flatMap((mode) => ALIES.map((ruta) => [mode, ruta])))('%s %s conserva la fitxa canònica i no adopta una organització impostora', async (mode, ruta) => {
  m.config = { ...m.config, dataMode: mode };
  m.fetch.mockResolvedValue(resposta([{ id: 'org-impostora', slug: 'javillinares', name: 'Empresa impostora', kind: 'company' }]));
  munta(ruta); await buida();
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Javi Llinares');
  expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('La Torre de les Maçanes');
  expect(m.titols).not.toContain('Empresa impostora');
  const BIO = "Dissenyador gràfic, sempre disposat a integrar-me en equips de treball on aprendre i aportar valor als projectes. Dins de l'Associació El Rentonar, coordine el Projecte Sóc de Poble.";
  expect(screen.getByText(BIO)).toBeTruthy();
  if (mode !== 'remote') expect(m.fetch).not.toHaveBeenCalled();
});
