import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import { creaCanalFals, creaIdbFals } from '../utils/__fixtures__/navegadorFals.js';
const m = vi.hoisted(() => ({ user: null, identity: null, adapter: null, config: null, failPublic: false, publicCalls: [], defer: null, capacitat: true }));
vi.mock('../app/contexts/UIContext.jsx', () => ({ useUIStateOpcional: () => ({ externalConfig: m.config }) }));
vi.mock('../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => ({ currentUser: m.user, estat: m.user ? 'dins' : 'fora' }) }));
vi.mock('../app/contexts/useIdentitatOReserva.js', () => ({ useIdentitatOReserva: () => m.identity }));
vi.mock('../components/PedraSeca/index.js', () => ({
  Alerta: ({ children }) => <div role="alert">{children}</div>, Boto: ({ children, ...props }) => <button {...props}>{children}</button>, Fila: ({ children }) => <div>{children}</div>
}));
vi.mock('../data/backendPort.js', () => ({
  teCapacitat: () => m.capacitat,
  loadProjeccionsCataleg: async (query, config) => { const result = await m.adapter.loadProjeccionsCataleg(query, config); if (m.defer && query.audiencia === 'publica') await m.defer; return result; },
  appendSectionSubmissionNetworkOnly: async (sub, config) => {
    m.publicCalls.push(structuredClone(sub));
    if (m.failPublic && sub.sectionId === 'mur') throw new Error('Xarxa tallada després del primer ACK');
    return m.adapter.appendSectionSubmissionNetworkOnly(sub, config);
  }
}));
import { configuraBackendSessio, desaSessio, esborraSessio } from '../data/identitat.js';
import { creaAdaptadorLocal } from '../data/local/adaptadorLocal.js';
import { DESTINS_CATALEG, perDestiCataleg, projeccioCatalegDe } from '../data/projeccionsCataleg.js';
import ProveidorProjeccionsCataleg from '../app/contexts/ProveidorProjeccionsCataleg.jsx';
import { useProjeccionsCatalegContext } from '../components/universal/workspace/ProjeccionsCatalegContext.js';
import SelectorDestinsPublicacio from '../components/universal/workspace/SelectorDestinsPublicacio.jsx';

const OWNER = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5', ALTRE = '6a7b8c9d-0e1f-4a2b-8c3d-4e5f6a7b8c9d';
const FONT = { font: 'herbari', id: 'timonet', title: 'Timonet', subtitle: 'Thymus vulgaris', lead: 'Font literal immutable' };
const LABELS = ['Mur', 'Mercat públic', 'Rebost privat', 'TPV Bar privat', 'Què dinem?', 'Herbari', 'Banc de Llavors'];
function entra(id = OWNER) {
  m.user = id ? { id } : null;
  m.identity = { actorKey: id ? `persona::${id}` : 'anon', actor: { tipus: 'persona', id }, actorId: id, nomesLectura: !id };
  configuraBackendSessio(m.config);
  if (id) desaSessio({ access_token: 'testimoni-opac-local', user: { id, user_metadata: {} } }); else esborraSessio({ abast: 'tot' });
}
function Harness({ enabled = true }) {
  return <ProveidorProjeccionsCataleg enabled={enabled}><CosHarness /></ProveidorProjeccionsCataleg>;
}
function CosHarness() {
  const api = useProjeccionsCatalegContext();
  const refs = api.projeccions.map(projeccioCatalegDe).filter(row => row?.ownerId === api.ownerId && row.font.id === FONT.id);
  const initial = [...new Set(refs.flatMap(row => row.destins))];
  const pending = refs.some(row => row.pendent);
  return <>
    <SelectorDestinsPublicacio key={api.ownerId} font={FONT} inicials={initial} desa={api.desa} autoritzat={api.autoritzat}
      persistent={api.persistent} error={api.error} estat={pending ? 'pendent' : refs.length ? 'confirmat' : ''} />
    {DESTINS_CATALEG.map(desti => <output key={desti} data-testid={`desti-${desti}`}>{perDestiCataleg(api.projeccions, desti, { ownerId: api.ownerId }).length}</output>)}
    <output data-testid="status">{api.estat}</output>
  </>;
}
beforeEach(() => {
  vi.stubGlobal('crypto', webcrypto); vi.stubGlobal('indexedDB', creaIdbFals().idb); vi.stubGlobal('BroadcastChannel', undefined);
  m.adapter = creaAdaptadorLocal({ mode: 'local', tenantId: '7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7' });
  m.config = m.adapter.configuracio; m.failPublic = false; m.publicCalls = []; m.defer = null; m.capacitat = true; entra();
});
afterEach(() => { cleanup(); m.adapter.destroy(); esborraSessio({ abast: 'tot' }); vi.unstubAllGlobals(); });
const triaTots = () => { for (const label of LABELS) fireEvent.click(screen.getByRole('checkbox', { name: label, exact: true })); };
const confirma = () => { fireEvent.click(screen.getByRole('checkbox', { name: 'Confirmació pública' })); fireEvent.click(screen.getByRole('button', { name: 'Desa els destins' })); };
describe('P0-59 · UI → hook real → IndexedDB → segon backend → col·leccions', () => {
  test('StrictMode, consentiment, set superfícies, recàrrega i revocació completa', async () => {
    const sourceBefore = structuredClone(FONT);
    const first = render(<StrictMode><Harness /></StrictMode>);
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('sincronitzat'));
    triaTots(); expect(m.publicCalls).toHaveLength(0); expect(screen.getByRole('button', { name: 'Desa els destins' }).disabled).toBe(true);
    confirma(); await screen.findByText('Destins confirmats pel servidor.');
    for (const desti of DESTINS_CATALEG) expect(screen.getByTestId(`desti-${desti}`).textContent, desti).toBe('1');
    expect(m.publicCalls).toHaveLength(2); expect(m.publicCalls.map(row => row.sectionId)).toEqual(['notes', 'mur']); expect(FONT).toEqual(sourceBefore);
    first.unmount(); render(<Harness />); await screen.findByText('Destins confirmats pel servidor.');
    for (const desti of DESTINS_CATALEG) expect(screen.getByTestId(`desti-${desti}`).textContent, desti).toBe('1');
    triaTots(); fireEvent.click(screen.getByRole('button', { name: 'Desa els destins' }));
    await waitFor(() => { for (const desti of DESTINS_CATALEG) expect(screen.getByTestId(`desti-${desti}`).textContent, desti).toBe('0'); });
    await screen.findByText('Destins confirmats pel servidor.'); expect(m.publicCalls).toHaveLength(4);
  });
  test('ACK parcial és pendent, recàrrega reintenta només la fila pública i el compte següent no veu la cua', async () => {
    m.failPublic = true; const view = render(<Harness />);
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('sincronitzat'));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Mur', exact: true })); fireEvent.click(screen.getByRole('checkbox', { name: 'TPV Bar privat', exact: true })); confirma();
    await screen.findByText('No s’ha pogut sincronitzar. La tria continua pendent.'); expect(screen.getByTestId('status').textContent).toBe('pendent');
    expect(screen.getByTestId('desti-mur').textContent).toBe('1'); expect(screen.getByTestId('desti-bar').textContent).toBe('1');
    act(() => { entra(ALTRE); view.rerender(<Harness />); });
    expect(screen.getByTestId('desti-bar').textContent).toBe('0'); expect(screen.getByTestId('desti-mur').textContent).toBe('0');
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('sincronitzat'));
    m.failPublic = false; act(() => { entra(OWNER); view.rerender(<Harness />); });
    await screen.findByText('Destins confirmats pel servidor.');
    expect(m.publicCalls.filter(row => row.sectionId === 'notes')).toHaveLength(1);
    expect(m.publicCalls.filter(row => row.sectionId === 'mur')).toHaveLength(2);
  });
  test('una resposta antiga arriba després del canvi de compte; inactiu no obri recursos', async () => {
    let resolve; m.defer = new Promise(done => { resolve = done; });
    const view = render(<Harness />);
    act(() => { entra(ALTRE); view.rerender(<Harness />); });
    m.defer = null; await act(async () => { resolve(); });
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('sincronitzat'));
    for (const desti of DESTINS_CATALEG) expect(screen.getByTestId(`desti-${desti}`).textContent).toBe('0');
    view.rerender(<Harness enabled={false} />); expect(screen.getByTestId('status').textContent).toBe('inactiu');
  });
  test('desmuntar tanca connexions, canals i el mateix listener online inclús amb StrictMode', async () => {
    const fals = creaIdbFals(), canals = creaCanalFals();
    vi.stubGlobal('indexedDB', fals.idb); vi.stubGlobal('BroadcastChannel', canals.Canal);
    const afig = vi.spyOn(window, 'addEventListener'), lleva = vi.spyOn(window, 'removeEventListener');
    const view = render(<StrictMode><Harness /></StrictMode>);
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('sincronitzat'));
    fireEvent.click(screen.getByRole('checkbox', { name: 'TPV Bar privat', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Desa els destins' })); await screen.findByText('Destins confirmats pel servidor.');
    expect(canals.obertes.size).toBe(1); view.unmount();
    await waitFor(() => expect(fals.registre.obertes).toBe(0)); expect(canals.obertes.size).toBe(0);
    const listeners = afig.mock.calls.filter(([name]) => name === 'online').map(([, fn]) => fn);
    const removed = lleva.mock.calls.filter(([name]) => name === 'online').map(([, fn]) => fn);
    expect(listeners.length).toBeGreaterThan(0); expect(removed).toEqual(listeners);
    afig.mockRestore(); lleva.mockRestore();
  });
  test('un backend sense lector opcional conserva la tria local pendent i no publica una referència il·legible', async () => {
    m.capacitat = false; render(<Harness />);
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('sincronitzat'));
    fireEvent.click(screen.getByRole('checkbox', { name: 'TPV Bar privat', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Desa els destins' }));
    await screen.findByText('No s’ha pogut sincronitzar. La tria continua pendent.');
    expect(screen.getByTestId('status').textContent).toBe('pendent');
    expect(screen.getByTestId('desti-bar').textContent).toBe('1'); expect(m.publicCalls).toEqual([]);
  });
});
