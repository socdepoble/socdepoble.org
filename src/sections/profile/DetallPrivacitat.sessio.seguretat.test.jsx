import React, { StrictMode, useState } from 'react';
import { flushSync } from 'react-dom';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';

/* BOT4-WEB · Adapter del compte, PerfilProvider i vista reals. Només la
   xarxa, l'autoritat de sessió, l'encaminador i el chrome són dobles.
   La persona del Perfil conserva id='jo': la protecció és el scope del
   Provider i la guarda de la vista, no una key que canvie entre A i B. */
const m = vi.hoisted(() => ({
  user: { id: 'A' }, entrada: 1, generacio: 1, rpc: vi.fn(), exporta: vi.fn(),
  getProfile: vi.fn(), listMyOrganizations: vi.fn(), estatBaixa: vi.fn(),
  updateProfile: vi.fn(), updateOrganization: vi.fn(), updateUserPassword: vi.fn(),
  uploadToStorage: vi.fn(), listMyAgents: vi.fn(), updateAgent: vi.fn(),
  llegeixContacteOrganitzacio: vi.fn(), desaContacteOrganitzacio: vi.fn(),
  llistaMembresOrganitzacio: vi.fn(), desaMembreOrganitzacio: vi.fn(),
  llevaMembreOrganitzacio: vi.fn(), carregaMembres: vi.fn(),
  demanaBaixa: vi.fn(), cancelaBaixa: vi.fn(), estatConsentiment: vi.fn(),
  registraConsentiment: vi.fn(), revocaConsentiment: vi.fn(),
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({
  useSession: () => ({ currentUser: m.user, generacio: m.generacio }),
  useSessioOpcional: () => ({ currentUser: m.user, generacio: m.generacio }),
}));
vi.mock('../../data/identitat.js', async (importOriginal) => ({
  ...await importOriginal(),
  entradaSessio: () => m.entrada,
  jwtPerBackend: () => 'jwt.sintetic',
  capturaSessio: () => {
    const entrada = m.entrada, id = m.user?.id;
    return () => {
      if (entrada !== m.entrada || id !== m.user?.id) throw new DOMException('Sessió canviada.', 'AbortError');
    };
  },
}));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...await importOriginal(),
  ...m,
  getCurrentUser: () => m.user,
  teCapacitat: (nom) => nom === 'compte',
  exportaLesMeuesDades: (...args) => m.exporta(...args),
}));
vi.mock('../../data/supabase/runtime.js', async (importOriginal) => ({
  ...await importOriginal(),
  getResolvedConfig: () => ({ hasSupabaseConfig: true }),
  rpc: (...args) => m.rpc(...args), request: vi.fn(),
}));
vi.mock('../../data/supabase/auth.js', async (importOriginal) => ({
  ...await importOriginal(),
  asseguraUsuari: async (_config, current) => { current(); return m.user; }, logout: vi.fn(),
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(), Link: ({ to, children }) => <a href={to}>{children}</a>,
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, children }) => <main><h1>{title}</h1>{children}</main>,
}));
import { PerfilProvider, usePerfil } from './PerfilContext.jsx';
import { DetallPrivacitat } from './DetallPrivacitat.jsx';
import { getBackendImplementation } from '../../data/backendPort.js';
import { cuaDesament } from '../../data/autodesament/cua.js';

/* E1 · L'host real compon l'adaptador; la còpia plana conserva tots els
   mètodes de l'entrada sense getters de l'espai de noms de Vitest. */
vi.mock('../../PedraSecaEmbed.jsx', () => ({ defineCustomElement: vi.fn() }));
vi.mock('../../data/supabase/index.js', async (importOriginal) => ({ ...await importOriginal() }));
let exportaLesMeuesDades;
beforeAll(async () => {
  const { arrenca } = await vi.importActual('../../host.js');
  await arrenca();
  ({ exportaLesMeuesDades } = getBackendImplementation());
});

const CONFIG = { tenantId: '00000000-0000-0000-0000-00000000000a', backendId: 'supabase' };
const DADES_A = { format: 'socdepoble.exportacio.v1', secret: 'private-account-A' };
const diferida = () => { let resol; const promesa = new Promise((r) => { resol = r; }); return { resol, promesa }; };
function DetallReal({ config = CONFIG }) {
  const perfil = usePerfil();
  return perfil.carregant ? <p>Carregant perfil…</p> :
    <DetallPrivacitat key={perfil.identitats[0]?.id} identitat={perfil.identitats[0]} config={config} />;
}
const arbre = (estricte = false, config = CONFIG) => {
  const fill = <PerfilProvider config={config}><DetallReal config={config} /></PerfilProvider>;
  return estricte ? <StrictMode>{fill}</StrictMode> : fill;
};
const boto = () => screen.getByRole('button', { name: 'Descarregar les meues dades' });
const quadre = () => screen.queryByRole('textbox', { name: 'Les teues dades, en JSON' });
const buida = () => act(async () => { for (let n = 0; n < 8; n += 1) await Promise.resolve(); });
let repinta;
function Superficie({ estricte, config }) {
  const [, redibuixa] = useState(0);
  repinta = () => redibuixa((n) => n + 1);
  return arbre(estricte, config);
}
async function munta(estricte = false, config = CONFIG) {
  const vista = render(<Superficie estricte={estricte} config={config} />);
  await waitFor(() => expect(boto()).toBeTruthy());
  await buida();
  return vista;
}
const canviaAB = (vista = null) => {
  m.user = { id: 'B' }; m.entrada++; m.generacio++;
  if (vista) flushSync(repinta);
};
let clic, blob;
beforeEach(async () => {
  await cuaDesament.reinicia();
  vi.clearAllMocks(); m.user = { id: 'A' }; m.entrada = 1; m.generacio = 1;
  m.getProfile.mockImplementation(async () => ({ id: m.user?.id, full_name: `Perfil ${m.user?.id}` }));
  m.listMyOrganizations.mockResolvedValue([]);
  m.estatBaixa.mockResolvedValue({ demanada: false });
  m.rpc.mockReset().mockResolvedValue(DADES_A);
  m.exporta.mockReset().mockImplementation(exportaLesMeuesDades);
  delete window.Capacitor; blob = null;
  URL.createObjectURL = vi.fn((b) => { blob = b; return 'blob:exportacio'; });
  URL.revokeObjectURL = vi.fn();
  clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); delete window.Capacitor; });

/* Ordre de microtasques: la RPC encua M1; l'await de l'adaptador encua C;
   M1 encua M2 darrere de C; C comprova A i encua la continuació de vista V;
   M2 canvia a B; V no pot descarregar A, encara que C l'haja autoritzat. */
for (const remunta of [true, false]) {
  test(`BOT4-WEB guarda l'efecte després del current() del port; remuntatge=${remunta}`, async () => {
    const vista = await munta();
    m.rpc.mockImplementation(() => {
      queueMicrotask(() => queueMicrotask(() => { canviaAB(remunta ? vista : null); }));
      return Promise.resolve(DADES_A);
    });
    await act(async () => {
      fireEvent.click(boto());
      for (let n = 0; n < 8; n += 1) await Promise.resolve();
    });
    if (remunta) await waitFor(() => expect(boto()).toBeTruthy());
    expect(m.user.id).toBe('B');
    expect(clic).not.toHaveBeenCalled();
    expect(quadre()).toBeNull();
  });
}

test('BOT4-WEB navegar fora amb la mateixa sessió avorta i no descarrega una resposta tardana', async () => {
  const pendent = diferida(); m.rpc.mockReturnValue(pendent.promesa);
  const vista = await munta(); fireEvent.click(boto());
  await waitFor(() => expect(m.rpc).toHaveBeenCalledTimes(1));
  const senyal = m.rpc.mock.calls[0][3].signal;
  vista.unmount();
  expect(senyal).toBeInstanceOf(AbortSignal);
  expect(senyal.aborted).toBe(true);
  await act(async () => { pendent.resol(DADES_A); });
  expect(clic).not.toHaveBeenCalled();
});

test('BOT4-WEB la renovació del JWT conserva la mateixa entrada i l’exportació', async () => {
  const pendent = diferida(); m.rpc.mockReturnValue(pendent.promesa);
  const vista = await munta(); fireEvent.click(boto());
  await waitFor(() => expect(m.rpc).toHaveBeenCalledTimes(1));
  m.generacio++; vista.rerender(<Superficie estricte={false} config={CONFIG} />);
  await act(async () => { pendent.resol(DADES_A); });
  expect(clic).toHaveBeenCalledTimes(1);
  expect(await blob.text()).toContain('private-account-A');
  expect(m.exporta.mock.calls[0][0]).toEqual({ ...CONFIG, signal: expect.any(AbortSignal) });
});

test('BOT4-WEB una fallada vigent es mostra i permet reintentar', async () => {
  m.rpc.mockRejectedValueOnce(new Error('fallada sintètica'));
  await munta(); await act(async () => { fireEvent.click(boto()); });
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(boto().disabled).toBe(false);
  await act(async () => { fireEvent.click(boto()); });
  expect(clic).toHaveBeenCalledTimes(1);
});

test('BOT4-WEB un error antic no pinta un avís per a B', async () => {
  const vista = await munta();
  m.rpc.mockImplementation(() => {
    queueMicrotask(() => queueMicrotask(() => { canviaAB(vista); }));
    return Promise.reject(new Error('fallada només d’A'));
  });
  await act(async () => {
    fireEvent.click(boto());
    for (let n = 0; n < 8; n += 1) await Promise.resolve();
  });
  await buida(); expect(screen.queryByRole('alert')).toBeNull();
  expect(document.body.textContent).not.toContain('fallada només d’A');
  expect(clic).not.toHaveBeenCalled();
});

test('BOT4-WEB StrictMode: JSON natiu vàlid es conserva en renovar i se’n va amb B', async () => {
  Object.defineProperty(window, 'Capacitor', { value: { isNativePlatform: () => true }, configurable: true });
  const vista = await munta(true); await act(async () => { fireEvent.click(boto()); });
  const inicial = quadre(); expect(inicial.value).toContain('private-account-A');
  m.generacio++; vista.rerender(<Superficie estricte config={CONFIG} />); expect(quadre()).toBe(inicial);
  m.user = { id: 'B' }; m.entrada++; vista.rerender(<Superficie estricte config={CONFIG} />);
  expect(quadre()).toBeNull(); expect(clic).not.toHaveBeenCalled();
});


test('BOT4-WEB un senyal extern preavortat no inicia cap exportació', async () => {
  const extern = new AbortController(); extern.abort();
  await munta(false, { ...CONFIG, signal: extern.signal });
  await act(async () => { fireEvent.click(boto()); });
  expect(m.exporta).not.toHaveBeenCalled();
  expect(clic).not.toHaveBeenCalled();
  expect(boto().disabled).toBe(false);
});

test('BOT4-WEB el senyal extern avorta encara que el transport ignore el senyal', async () => {
  const extern = new AbortController(), pendent = diferida();
  const lleva = vi.spyOn(extern.signal, 'removeEventListener');
  m.rpc.mockReturnValue(pendent.promesa);
  await munta(false, { ...CONFIG, signal: extern.signal }); fireEvent.click(boto());
  await waitFor(() => expect(m.rpc).toHaveBeenCalledTimes(1));
  const intern = m.rpc.mock.calls[0][3].signal;
  act(() => extern.abort());
  expect(intern.aborted).toBe(true);
  expect(boto().disabled).toBe(false);
  await act(async () => { pendent.resol(DADES_A); });
  expect(clic).not.toHaveBeenCalled();
  expect(lleva).toHaveBeenCalledWith('abort', expect.any(Function));
});

test('BOT4-WEB desmuntar lleva el listener extern sense esperar el transport', async () => {
  const extern = new AbortController(), pendent = diferida();
  const lleva = vi.spyOn(extern.signal, 'removeEventListener');
  m.rpc.mockReturnValue(pendent.promesa);
  const vista = await munta(false, { ...CONFIG, signal: extern.signal }); fireEvent.click(boto());
  await waitFor(() => expect(m.rpc).toHaveBeenCalledTimes(1));
  vista.unmount();
  expect(lleva).toHaveBeenCalledWith('abort', expect.any(Function));
  await act(async () => { pendent.resol(DADES_A); });
  expect(clic).not.toHaveBeenCalled();
});


test('BOT4-WEB un AbortError vigent allibera el botó per a reintentar', async () => {
  m.rpc.mockRejectedValueOnce(new DOMException('Avortament sintètic.', 'AbortError'));
  await munta(); await act(async () => { fireEvent.click(boto()); });
  expect(boto().disabled).toBe(false);
  expect(screen.queryByRole('alert')).toBeNull();
  await act(async () => { fireEvent.click(boto()); });
  expect(clic).toHaveBeenCalledTimes(1);
});
