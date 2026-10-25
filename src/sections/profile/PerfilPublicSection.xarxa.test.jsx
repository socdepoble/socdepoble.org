/**
 * Revisió del Gauntlet 261022_0225 (REV-PERF-1) · Sense xarxa, la fitxa
 * pública no diu «Perfil no trobat». Port, adaptador (supabase/perfils.js) i
 * runtime reals; només fetch i l'host són fronteres simulades:
 *   · un fetch que es rebutja (TypeError: sense xarxa, DNS, servidor caigut)
 *     arriba a runtime.js com l'estat 0 i CODI_BACKEND_INABASTABLE, i
 *     l'adaptador ja no el convertix en null: l'avís amb «Torna-ho a provar»;
 *   · una resposta del servidor amb error (503) continua sent null: «Perfil no
 *     trobat», com abans;
 *   · una clau amb reserva local (un àlies de la persona pilot) pinta la fitxa
 *     del paquet.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({
  id: 'forn-de-proves', fetch: vi.fn(), navigate: vi.fn(),
  config: { dataMode: 'remote', supabaseUrl: 'https://xarxa.invalid', supabaseAnonKey: 'sb_publishable_fixture_xarxa', tenantId: '33333333-3333-4333-8333-333333333333' },
  identitat: { memberships: [], actor: null, setActor: vi.fn() }
}));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ agentId: m.id }),
  useNavigate: () => m.navigate
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: m.config })
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => m.identitat }));
vi.mock('../xat/XatContext', () => ({ useXat: () => ({ senseSessio: true }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../hooks/useEntitatDelProjecte.js', () => ({ useEntitatDelProjecte: () => 0 }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({ useResolvedAsset: (valor) => valor }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: (props) => (
    <div>
      <header className="page-title"><h1>{props.title}</h1></header>
      {props.subtitle ? <h2>{props.subtitle}</h2> : null}
      {props.lead ? <p className="lead">{props.lead}</p> : null}
      {props.children}
    </div>
  )
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
import PerfilPublicSection from './PerfilPublicSection.jsx';

const SENSE_RESPOSTA = 'No s’ha pogut carregar el perfil';
const resposta = (files, status = 200) => ({
  ok: status === 200, status, json: async () => files, text: async () => 'fallada simulada', headers: { get: () => null }
});
const senseXarxa = () => Promise.reject(new TypeError('Failed to fetch'));

/* Gauntlet 261025_0545 (DF-03) · El loadPerfilPublic de l'adaptador, tal com
   el deixa al port host.arrenca(). L'host que veu la pàgina continua sent la
   frontera simulada de dalt; el de veres només compon. */
let loadPerfilPublic;
beforeAll(async () => {
  const { arrenca } = await vi.importActual('../../host.js');
  await arrenca();
  ({ loadPerfilPublic } = getBackendImplementation());
});

beforeEach(() => {
  vi.clearAllMocks();
  m.id = 'forn-de-proves';
  const impl = Object.fromEntries(CONTRACTE_NUCLI.map((nom) => [nom, () => { throw new Error(`Fora d’àmbit: ${nom}`); }]));
  /* Gauntlet 261025_0545 (DF-03) · L'arrencada ja ha segellat el port: en
     desenvolupament (Vitest ho és) `force` hi torna a posar el joc reduït. */
  setBackendImplementation({ ...impl, loadPerfilPublic }, true);
  m.fetch.mockImplementation(senseXarxa);
  vi.stubGlobal('fetch', m.fetch);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test('sense xarxa: l’avís amb «Torna-ho a provar», no «Perfil no trobat»; el reintent pinta la fitxa', async () => {
  render(<PerfilPublicSection />);
  expect((await screen.findByRole('heading', { level: 1, name: SENSE_RESPOSTA })).textContent).toBe(SENSE_RESPOSTA);
  expect(screen.queryByText('Perfil no trobat')).toBeNull();
  expect(document.querySelector('p.lead').textContent).toBe('El servidor del poble no respon ara mateix. Pots tornar-ho a provar o continuar navegant.');
  /* REV-PERF-9 · El lector de pantalla també ho sap. */
  expect(screen.getByRole('alert').textContent).toBe(SENSE_RESPOSTA);
  m.fetch.mockResolvedValue(resposta([{ id: 'org-forn', slug: 'forn-de-proves', name: 'Forn de Proves', kind: 'company' }]));
  fireEvent.click(screen.getByRole('button', { name: 'Torna-ho a provar' }));
  expect((await screen.findByRole('heading', { level: 1, name: 'Forn de Proves' })).textContent).toBe('Forn de Proves');
});

test('una resposta del servidor amb error (503) continua sent «Perfil no trobat»', async () => {
  m.fetch.mockResolvedValue(resposta([], 503));
  render(<PerfilPublicSection />);
  expect((await screen.findByRole('heading', { level: 1, name: 'Perfil no trobat' })).textContent).toBe('Perfil no trobat');
  expect(screen.queryByRole('button', { name: 'Torna-ho a provar' })).toBeNull();
});

test('sense xarxa, un àlies de la persona pilot pinta la fitxa del paquet', async () => {
  m.id = '0001';
  render(<PerfilPublicSection />);
  expect((await screen.findByRole('heading', { level: 1, name: 'Javi Llinares' })).textContent).toBe('Javi Llinares');
  expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('La Torre de les Maçanes');
});
