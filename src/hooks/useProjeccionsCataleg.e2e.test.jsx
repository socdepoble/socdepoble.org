import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import { creaCanalFals, creaIdbFals } from '../utils/__fixtures__/navegadorFals.js';
const m = vi.hoisted(() => ({ user: null, identity: null, adapter: null, config: null, failPublic: false, publicCalls: [], defer: null, capacitat: true,
  version: 0, readCalls: 0, readView: null, readGate: null, ambVersio: false, tick: 0, forcaVersionada: false }));
vi.mock('../app/contexts/UIContext.jsx', () => ({ useUIStateOpcional: () => ({ externalConfig: m.config }) }));
vi.mock('../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => ({ currentUser: m.user, estat: m.user ? 'dins' : 'fora' }) }));
vi.mock('../app/contexts/useIdentitatOReserva.js', () => ({ useIdentitatOReserva: () => m.identity }));
vi.mock('../components/PedraSeca/hooks/moderacioDePoble.js', () => ({ useModeracio: () => ({ versioBloquejos: m.version }) }));
vi.mock('../components/PedraSeca/index.js', () => ({
  Alerta: ({ children }) => <div role="alert">{children}</div>, Boto: ({ children, ...props }) => <button {...props}>{children}</button>, Fila: ({ children }) => <div>{children}</div>
}));
vi.mock('../data/backendPort.js', () => ({
  teCapacitat: () => m.capacitat,
  loadProjeccionsCataleg: async (query, config) => {
    m.readCalls++;
    const result = await m.adapter.loadProjeccionsCataleg(query, config);
    const view = m.readView ? m.readView(query, result) : result;
    if (m.defer && query.audiencia === 'publica') await m.defer;
    if (m.readGate) await m.readGate(query);
    return view;
  },
  appendSectionSubmissionNetworkOnly: async (sub, config) => {
    m.publicCalls.push(structuredClone(sub));
    /* Onada R32 · D-R32-PUB-1 · Cap backend viu té CAS de publicacions, i
       l'adaptador local descartaria el camp sense dir res: ací no pot passar. */
    if (Object.hasOwn(sub, 'expectedUpdatedAt')) throw new Error('expectedUpdatedAt no pot viatjar: cap backend viu té CAS de publicacions (D-R32-PUB-1).');
    if (m.failPublic && sub.sectionId === 'mur') throw new Error('Xarxa tallada després del primer ACK');
    const saved = await m.adapter.appendSectionSubmissionNetworkOnly(sub, config);
    // Com content.js amb `return=representation`: la versió exacta del servidor, amb microsegons.
    return m.ambVersio ? { ...saved, updatedAt: `2026-11-16T05:00:00.${String(++m.tick).padStart(6, '0')}Z` } : saved;
  }
}));
/* Passa el servei real intacte. Només la prova de robustesa de la lectura remota
   força `versionada`, per provar el camí que activaria D-R32-PUB-1(a). */
vi.mock('../data/projeccionsCatalegServei.js', async importOriginal => {
  const real = await importOriginal();
  return { ...real, creaServeiProjeccionsCataleg: opcions => real.creaServeiProjeccionsCataleg(m.forcaVersionada ? { ...opcions, versionada: true } : opcions) };
});
import { configuraBackendSessio, desaSessio, esborraSessio } from '../data/identitat.js';
import { creaAdaptadorLocal } from '../data/local/adaptadorLocal.js';
import { DESTINS_CATALEG, perDestiCataleg, projeccioCatalegDe } from '../data/projeccionsCataleg.js';
import ProveidorProjeccionsCataleg from '../app/contexts/ProveidorProjeccionsCataleg.jsx';
import { useProjeccionsCatalegContext } from '../components/universal/workspace/ProjeccionsCatalegContext.js';
import SelectorDestinsPublicacio from '../components/universal/workspace/SelectorDestinsPublicacio.jsx';
import { useProjeccionsCataleg } from './useProjeccionsCataleg.js';

const OWNER = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5', ALTRE = '6a7b8c9d-0e1f-4a2b-8c3d-4e5f6a7b8c9d';
const FONT = { font: 'herbari', id: 'timonet', title: 'Timonet', subtitle: 'Thymus vulgaris', lead: 'Font literal immutable' };
const LABELS = ['Mur', 'Mercat públic', 'Rebost privat', 'TPV Bar privat', 'Què dinem?', 'Herbari', 'Banc de Llavors',
  'Arbres emblemàtics i monumentals', 'Pàgines del fons documental'];
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
  m.config = m.adapter.configuracio; m.failPublic = false; m.publicCalls = []; m.defer = null; m.capacitat = true;
  m.version = 0; m.readCalls = 0; m.readView = null; m.readGate = null; m.ambVersio = false; m.tick = 0; m.forcaVersionada = false; entra();
});

describe('R31 Passada2 · relleu ACK local → lectura remota', () => {
  const own = result => result.current.projeccions.filter(row => row.projeccioCataleg?.id === FONT.id);
  const refresh = async hook => { await act(async () => { m.version++; hook.rerender(); }); };
  const marker = { id: ALTRE, ownerUserId: OWNER, sectionId: 'mur', title: 'Altra font llegida',
    projeccioCataleg: { v: 1, font: 'herbari', id: 'lectura-completada', destins: ['mur'], audiencia: 'publica' } };
  test.each(['retirada', 'edició'])('un ACK sense lectura posterior conserva la vista, però una lectura fresca respecta la %s remota', async kind => {
    const hook = renderHook(() => useProjeccionsCataleg());
    await waitFor(() => expect(hook.result.current.estat).toBe('sincronitzat'));
    await act(async () => { await hook.result.current.desa(FONT, ['mur', 'bar']); });
    expect(own(hook.result)).toHaveLength(2);
    expect(own(hook.result).every(row => row._projeccioLocal === true && !row._projeccioPendent)).toBe(true);
    m.readView = (_query, result) => ({ ...result, items: kind === 'retirada' ? [] : result.items.map(row => ({ ...row, title: 'Canvi remot' })) });
    await refresh(hook);
    await waitFor(() => {
      if (kind === 'retirada') expect(own(hook.result)).toEqual([]);
      else { expect(own(hook.result)).toHaveLength(2); expect(own(hook.result).every(row => row.title === 'Canvi remot' && row._projeccioLocal !== true)).toBe(true); }
    });
    expect(m.publicCalls).toHaveLength(2);
  });
  test('una lectura fresca buida no elimina un intent pendent amb ACK parcial', async () => {
    const hook = renderHook(() => useProjeccionsCataleg());
    await waitFor(() => expect(hook.result.current.estat).toBe('sincronitzat')); m.failPublic = true;
    await act(async () => { await expect(hook.result.current.desa(FONT, ['mur', 'bar'])).rejects.toMatchObject({ desatLocal: true }); });
    m.readView = () => ({ items: [], cursor: null });
    const before = m.readCalls; await refresh(hook); await waitFor(() => expect(m.readCalls).toBeGreaterThan(before));
    await waitFor(() => { expect(hook.result.current.estat).toBe('pendent'); expect(own(hook.result)).toHaveLength(2); });
    expect(own(hook.result).every(row => row._projeccioPendent)).toBe(true); expect(m.publicCalls).toHaveLength(2);
  });
  test.each(['abans del primer ACK', 'després d’un ACK anterior'])('lectura iniciada %s no lleva una publicació nova que acaba durant el vol', async when => {
    const hook = renderHook(() => useProjeccionsCataleg());
    await waitFor(() => expect(hook.result.current.estat).toBe('sincronitzat'));
    if (when === 'després d’un ACK anterior') await act(async () => { await hook.result.current.desa(FONT, ['mur', 'bar']); });
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    m.readView = (query, result) => ({ ...result, items: query.audiencia === 'publica' ? [...result.items, marker] : result.items });
    m.readGate = async query => { if (query.audiencia === 'publica') await gate; };
    const previous = m.readCalls; await refresh(hook); await waitFor(() => expect(m.readCalls).toBeGreaterThan(previous));
    await act(async () => { await hook.result.current.desa({ ...FONT, title: 'Intent nou confirmat' }, ['herbari', 'bar']); });
    expect(own(hook.result).every(row => row.title === 'Intent nou confirmat')).toBe(true);
    await act(async () => { release(); });
    // El marcador prova que la lectura antiga ja s'ha publicat: no basta
    // observar l'estat optimista abans que la promesa antiga acabe.
    await waitFor(() => expect(hook.result.current.projeccions.some(row => row.id === marker.id)).toBe(true));
    expect(own(hook.result)).toHaveLength(2); expect(own(hook.result).every(row => row.title === 'Intent nou confirmat' && row._projeccioLocal)).toBe(true);
    m.readGate = null; m.readView = null; await refresh(hook);
    await waitFor(() => { expect(own(hook.result)).toHaveLength(2); expect(own(hook.result).every(row => row.title === 'Intent nou confirmat' && !row._projeccioLocal)).toBe(true); });
  });
  test('una lectura fallida no retira un ACK local; la lectura següent reeixida sí que el pot substituir', async () => {
    const hook = renderHook(() => useProjeccionsCataleg());
    await waitFor(() => expect(hook.result.current.estat).toBe('sincronitzat'));
    await act(async () => { await hook.result.current.desa(FONT, ['mur', 'bar']); });
    m.readView = () => { throw new Error('Lectura fallida'); };
    await refresh(hook); await waitFor(() => expect(hook.result.current.error?.message).toBe('Lectura fallida'));
    expect(own(hook.result)).toHaveLength(2); expect(own(hook.result).every(row => row._projeccioLocal)).toBe(true);
    m.readView = () => ({ items: [], cursor: null }); await refresh(hook);
    await waitFor(() => expect(own(hook.result)).toEqual([]));
  });
});
/* Onada R32 (Gauntlet del Carril 1) · La composició de PRODUCCIÓ (el hook) i la
   lectura remota sobre l'esquema viu. */
describe('R32 · publicacions sense CAS i lectura remota de xarxa', () => {
  const own = result => result.current.projeccions.filter(row => row.projeccioCataleg?.id === FONT.id);
  const refresh = async hook => { await act(async () => { m.version++; hook.rerender(); }); };
  test('el hook no envia mai expectedUpdatedAt, encara que el backend torne la versió en cada ACK', async () => {
    m.ambVersio = true;
    const hook = renderHook(() => useProjeccionsCataleg());
    await waitFor(() => expect(hook.result.current.estat).toBe('sincronitzat'));
    await act(async () => { await hook.result.current.desa(FONT, ['mur', 'bar']); });
    // Republicar i retirar després d'un ACK amb versió: és on un servei versionat l'enviaria.
    await act(async () => { await hook.result.current.desa({ ...FONT, title: 'Timonet revisat' }, ['herbari', 'bar']); });
    await act(async () => { await hook.result.current.desa(FONT, []); });
    expect(m.publicCalls).toHaveLength(6);
    expect(m.publicCalls.filter(sub => Object.hasOwn(sub, 'expectedUpdatedAt'))).toEqual([]);
    expect(hook.result.current.estat).toBe('sincronitzat'); expect(hook.result.current.error).toBeNull();
  });
  test.each([['dorment (producció)', false], ['versionada (D-R32-PUB-1 a)', true]])('IndexedDB deixa de respondre: un refresc remot encara mostra les files noves del servidor · %s', async (_nom, versionada) => {
    const fals = creaIdbFals(); vi.stubGlobal('indexedDB', fals.idb); m.forcaVersionada = versionada;
    const nova = { id: '9b8a7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d', ownerUserId: ALTRE, sectionId: 'mur', title: 'Projecció nova d’una veïna',
      projeccioCataleg: { v: 1, font: 'herbari', id: 'romani', destins: ['mur'], audiencia: 'publica' } };
    const hook = renderHook(() => useProjeccionsCataleg());
    await waitFor(() => expect(hook.result.current.estat).toBe('sincronitzat'));
    await act(async () => { await hook.result.current.desa(FONT, ['mur', 'bar']); });
    expect(own(hook.result)).toHaveLength(2);
    // Com WKWebView després de passar a segon pla: la base ja oberta deixa de respondre (NO_DISPONIBLE).
    fals.control.fallaObrir = true; const obertures = fals.registre.obrides.length;
    m.readView = (query, result) => ({ ...result, items: query.audiencia === 'publica' ? [...result.items, nova] : result.items });
    const before = m.readCalls; await refresh(hook); await waitFor(() => expect(m.readCalls).toBeGreaterThan(before));
    await waitFor(() => expect(hook.result.current.projeccions.some(row => row.id === nova.id)).toBe(true));
    expect(hook.result.current.estat).toBe('sincronitzat'); expect(hook.result.current.error).toBeNull();
    expect(own(hook.result)).toHaveLength(2);
    // Dorment, la lectura remota no toca el magatzem local, com al viu.
    if (!versionada) expect(fals.registre.obrides.length).toBe(obertures);
    else expect(fals.registre.obrides.length).toBeGreaterThan(obertures);
  });
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
