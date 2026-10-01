import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const m = vi.hoisted(() => ({ logout: vi.fn(() => Promise.resolve()), comprova: vi.fn(async () => ({ ok: true })) }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: () => true, logout: m.logout, loginWithGoogle: vi.fn(), loginWithPassword: vi.fn(),
  registerWithPassword: vi.fn(), listMyOrganizations: vi.fn(),
  /* T2 i T4 · la capacitat 'salut', tal qual. */
  comprovaServidor: (...args) => m.comprova(...args),
  /* La sessió viva del port, per a la cua d'autodesament (ambitActual). */
  getCurrentUser: () => ({ id: 'U' })
}));
vi.mock('../../data/sessionService.js', () => ({
  getSessionState: () => ({ usuari: { id: 'U' }, estat: 'dins', rol: 'usuari', generacio: 1 }),
  subscribeSession: () => () => {},
  setSessionConfig: () => () => {},
  renovaAra: vi.fn()
}));
import { SessionProvider, useSession, useSessioOpcional } from './SessionContext.jsx';
import { cuaDesament } from '../../data/autodesament/cua.js';
import { ambitDe } from '../../data/autodesament/ambit.js';
import { bgSaveManager } from '../../sections/notes/GlobalSaveManager.js';

const CONFIG = Object.freeze({ supabaseUrl: 'https://poble.test', supabaseAnonKey: 'anon', tenantId: '00000000-0000-4000-8000-000000000000' });
/* L'àmbit dels esborranys de Notes de la persona «U» (NotesDataContext): esEsborranyDe el reconeix. */
const NOTES_U = 'backend:["supabase","https://poble.test","T","remote"]_persona::U_T';
const conflicte = () => vi.fn(async () => { throw Object.assign(new Error('Conflicte'), { status: 409 }); });

function BotoEixir({ amb }) {
  const { logout } = useSession();
  return <button type="button" onClick={amb === 'clic' ? logout : () => amb(logout)}>Eixir</button>;
}

beforeEach(async () => {
  m.logout.mockReset().mockImplementation(() => Promise.resolve());
  await cuaDesament.reinicia();
});
afterEach(cleanup);

/* T47 (correcció de la revisió, 260928) · Eixir de veres fa primer un intent
   final d'enviar el pendent: el logout arriba després, no en el mateix clic. */
test('D1 · logout() sense res revoca amb la configuració del proveïdor', async () => {
  render(<SessionProvider config={CONFIG}><BotoEixir amb={(logout) => logout()} /></SessionProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Eixir' }));
  await waitFor(() => expect(m.logout).toHaveBeenCalledWith(CONFIG, undefined));
});

test('D1 · un onClick={logout} no passa l’esdeveniment del clic com a configuració', async () => {
  render(<SessionProvider config={CONFIG}><BotoEixir amb="clic" /></SessionProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Eixir' }));
  await waitFor(() => expect(m.logout).toHaveBeenCalledTimes(1));
  expect(m.logout.mock.calls[0][0]).toBe(CONFIG);
});

test('D1 · una configuració explícita i l’abast de revocació arriben tal qual al port', async () => {
  const altra = { supabaseUrl: 'https://altre.test', supabaseAnonKey: 'k' };
  render(<SessionProvider config={CONFIG}><BotoEixir amb={(logout) => logout(altra, { scope: 'global' })} /></SessionProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Eixir' }));
  await waitFor(() => expect(m.logout).toHaveBeenCalledWith(altra, { scope: 'global' }));
});

test('T47 · eixir envia primer el pendent d’esta persona amb la sessió vàlida, després tanca i oblida el que no ha pogut eixir', async () => {
  const ordre = [];
  const ref = { ambit: ambitDe(CONFIG, 'U'), entitat: 'prova-eixida', id: 'jo', context: CONFIG };
  const senseEscriptor = { ...ref, entitat: 'prova-sense-escriptor' };
  cuaDesament.registraEscriptor('prova-eixida', { granularitat: 'camp', escriu: async () => { ordre.push('envia'); return {}; } });
  m.logout.mockImplementation(async () => { ordre.push('logout'); });
  render(<SessionProvider config={CONFIG}><BotoEixir amb="clic" /></SessionProvider>);
  await act(async () => {});                              // l'entrada de sessió ja ha reprès
  cuaDesament.encua(ref, 'lead', 'Encara en la pausa');
  cuaDesament.encua(senseEscriptor, 'lead', 'No pot eixir');
  fireEvent.click(screen.getByRole('button', { name: 'Eixir' }));
  await waitFor(() => expect(m.logout).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(cuaDesament.llig(senseEscriptor).camps).toEqual({}));
  expect(ordre).toEqual(['envia', 'logout']);
  expect(cuaDesament.llig(ref).camps).toEqual({});
});

test('T47 · la baixa (eixAmb) passa per la mateixa eixida; si falla, els esborranys es queden', async () => {
  const ref = { ambit: ambitDe(CONFIG, 'U'), entitat: 'prova-sense-escriptor', id: 'jo', context: CONFIG };
  let sessio;
  function Sonda() { sessio = useSessioOpcional(); return null; }
  render(<SessionProvider config={CONFIG}><Sonda /></SessionProvider>);
  await act(async () => {});
  cuaDesament.encua(ref, 'lead', 'Meu');
  await expect(sessio.eixAmb(async () => { throw new Error('Sense xarxa'); })).rejects.toThrow('Sense xarxa');
  expect(cuaDesament.llig(ref).camps).toEqual({ lead: 'Meu' });
  const baixa = vi.fn(async () => ({ demanada: true }));
  await expect(sessio.eixAmb(baixa, CONFIG)).resolves.toEqual({ demanada: true });
  expect(cuaDesament.llig(ref).camps).toEqual({});
  expect(m.logout).not.toHaveBeenCalled();
});

/* T47 (correcció de la revisió C02, 260928) · Abans, enviaNotesDeLUsuari i
   oblidaNotesDeLUsuari no les cridava ningú: el pendent de Notes no s'enviava
   en eixir i els esborranys es quedaven a l'ordinador compartit. jsdom no té
   IndexedDB: el gestor de Notes treballa des de la memòria d'esta pestanya. */
test('T47 · C02 · eixir envia la nota pendent de Notes abans del logout i, després, oblida les de la persona (també la que no ha pogut eixir)', async () => {
  const avisos = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const ordre = [];
    const desa = vi.fn(async (_id, payload, revision) => { ordre.push('envia nota'); return { ...payload, revision: revision + 1 }; });
    m.logout.mockImplementation(async () => { ordre.push('logout'); });
    render(<SessionProvider config={CONFIG}><BotoEixir amb="clic" /></SessionProvider>);
    await act(async () => {});
    void bgSaveManager.enqueue(NOTES_U, 'n', 'title', 'Últim', () => ({ revision: 1 }), desa, vi.fn(), vi.fn());
    void bgSaveManager.enqueue(NOTES_U, 'm', 'title', 'En conflicte', () => ({ revision: 1 }), conflicte(), vi.fn(), vi.fn());
    fireEvent.click(screen.getByRole('button', { name: 'Eixir' }));
    await waitFor(() => expect(m.logout).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(bgSaveManager.memoria.has(`${NOTES_U}:m`)).toBe(false));
    expect(ordre).toEqual(['envia nota', 'logout']);
    expect(desa).toHaveBeenCalledWith('n', { title: 'Últim' }, 1);
    expect(bgSaveManager.memoria.has(`${NOTES_U}:n`)).toBe(false);
    expect(bgSaveManager.queues.size).toBe(0);
  } finally {
    avisos.mockRestore();
  }
});

/* T47 (correcció de la revisió C01, 260928) · Abans d'eixir, la interfície
   pregunta què no ha arribat al servidor: res s'esborra fins que la persona ho sap. */
test('T47 · C01 · preparaEixida diu el que el servidor encara no té (fitxa i Notes) sense tancar ni oblidar res', async () => {
  const avisos = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const ref = { ambit: ambitDe(CONFIG, 'U'), entitat: 'prova-sense-escriptor', id: 'jo', context: CONFIG };
    let sessio;
    function Sonda() { sessio = useSessioOpcional(); return null; }
    render(<SessionProvider config={CONFIG}><Sonda /></SessionProvider>);
    await act(async () => {});
    cuaDesament.encua(ref, 'lead', 'No pot eixir');
    void bgSaveManager.enqueue(NOTES_U, 'm', 'title', 'Meu', () => ({ revision: 1 }), conflicte(), vi.fn(), vi.fn());
    let pendents;
    await act(async () => { pendents = await sessio.preparaEixida(); });
    expect(pendents).toEqual([
      { entitat: 'prova-sense-escriptor', id: 'jo', camps: ['lead'] },
      { entitat: 'nota', id: 'm', camps: ['title'] },
    ]);
    expect(m.logout).not.toHaveBeenCalled();
    expect(cuaDesament.llig(ref).camps).toEqual({ lead: 'No pot eixir' });
    expect(bgSaveManager.memoria.has(`${NOTES_U}:m`)).toBe(true);
    await bgSaveManager.oblidaUsuari('U');
  } finally {
    avisos.mockRestore();
  }
});

test('T47 · fora del proveïdor, useSessioOpcional diu null (una peça muntada sola)', () => {
  let sessio = 'sense llegir';
  function Sonda() { sessio = useSessioOpcional(); return null; }
  render(<Sonda />);
  expect(sessio).toBeNull();
});

/* T2 i T4 (ordre del Mestre, 260930) · /registre sonda el node pel context,
   com la resta de mètodes d'entrada: la UI no importa el port directament. */
test('T4 · el context exposa comprovaServidor del port i hi arriba la configuració tal qual', async () => {
  let sessio;
  function Sonda() { sessio = useSessioOpcional(); return null; }
  render(<SessionProvider config={CONFIG}><Sonda /></SessionProvider>);
  expect(typeof sessio.comprovaServidor).toBe('function');
  expect(typeof sessio.teCapacitat).toBe('function');
  m.comprova.mockResolvedValueOnce({ ok: false });
  await expect(sessio.comprovaServidor(CONFIG)).resolves.toEqual({ ok: false });
  expect(m.comprova).toHaveBeenCalledWith(CONFIG);
});

test('T18 · eixir amb un adaptador alternatiu conserva la configuració explícita', () => {
  const altra = { backendId: 'wordpress', backendUrl: 'https://poble.test/wp-json/sdp/v1', tenantId: '00000000-0000-4000-8000-000000000000' };
  render(<SessionProvider config={CONFIG}><BotoEixir amb={(logout) => logout(altra, { abast: 'pestanya' })} /></SessionProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Eixir' }));
  // Buidar només la pestanya no és eixir: directe al port i sense oblidar res.
  expect(m.logout).toHaveBeenCalledWith(altra, { abast: 'pestanya' });
});
