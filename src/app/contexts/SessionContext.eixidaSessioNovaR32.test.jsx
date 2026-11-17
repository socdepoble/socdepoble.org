/* Onada R32 (lot_02 de Codex) i R32.2 (Peixos sobre el lot_02) · L'eixida de
   veres espera l'intent final (xarxa) abans de `tanca`, i mentrestant la sessió
   de la pestanya pot canviar. Amb el capturaSessio REAL d'identitat.js (abans
   la prova el simulava i no veia el buidat de la pestanya):
     · una entrada nova (una altra persona o la mateixa) no es revoca ni rep la
       baixa de l'eixida antiga, que rebutja amb AbortError;
     · si qui ha entrat NO és qui ix, les dades locals de qui ix s'obliden
       igualment en este dispositiu (la cua i Notes del seu àmbit, les carpetes
       locals del perfil i els seus títols de la IAIA): abans es quedaven per a
       la persona següent;
     · si és la mateixa persona, les seues dades es queden (és dins);
     · si la pestanya només s'ha buidat (renovació que rep 400/401,
       reconciliaAmbRegistre, un segon clic), no hi ha cap sessió nova a
       protegir: l'eixida continua com sempre, amb `tanca` i els oblits. */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { CLAU_USUARI, desaSessio, esborraSessio } from '../../data/identitat.js';
import { getEfimer } from '../../config/storage.js';

const m = vi.hoisted(() => ({
  gate: null, estat: null,
  logout: vi.fn(), oblit: vi.fn(), oblidaSessio: vi.fn(),
  notes: vi.fn(), titols: vi.fn(), carpetes: vi.fn()
}));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: () => false, logout: m.logout, getCurrentUser: () => m.estat.usuari,
  loginWithGoogle: vi.fn(), loginWithPassword: vi.fn(), registerWithPassword: vi.fn(),
  listMyOrganizations: vi.fn(), comprovaServidor: vi.fn(), demanaRecuperacioContrasenya: vi.fn(),
  definixContrasenyaNova: vi.fn(), entraAmbTokenDeProveidor: vi.fn()
}));
vi.mock('../../data/sessionService.js', () => ({ getSessionState: () => m.estat,
  subscribeSession: () => () => {}, setSessionConfig: () => () => {}, renovaAra: vi.fn() }));
/* eixDeLaSessio: l'intent final (la porta) i, després, `tanca` i l'oblit de
   DESPRES_DE_TANCAR (m.oblit) només si `tanca` no ha llançat. */
vi.mock('../../data/autodesament/sessio.js', () => ({ reprenSessio: vi.fn(), preparaEixida: vi.fn(),
  oblidaSessio: m.oblidaSessio,
  eixDeLaSessio: async ({ tanca }) => { await m.gate.promise; const r = await tanca(); m.oblit(); return r; } }));
vi.mock('../../sections/notes/GlobalSaveManager.js', () => ({
  enviaNotesDeLUsuari: async () => undefined, oblidaNotesDeLUsuari: m.notes, pendentsNotesDe: async () => []
}));
vi.mock('../../sections/xat/sessionsIAIALocals.js', () => ({ oblidaTitolsIAIADePersona: m.titols }));
vi.mock('../../sections/multimedia/bibliotecaCarpetesLocals.js', () => ({ oblidaTotesLesCarpetesLocals: m.carpetes }));
import { SessionProvider, useSession } from './SessionContext.jsx';

let sessio;
function Sonda() { sessio = useSession(); return null; }
const ajornada = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
/* Una entrada real: incrementa generacioEntrada i deixa l'actor a la pestanya. */
const entra = (id) => expect(desaSessio({ access_token: `jwt-${id}`, user: { id } }, { origen: 'amfitrio' })).toBe(true);
const oblitsLocals = () => [m.oblidaSessio, m.notes, m.titols, m.carpetes];

beforeEach(() => {
  localStorage.clear(); sessionStorage.clear();
  entra('A');
  m.estat = { usuari: { id: 'A' }, estat: 'dins', rol: 'usuari', generacio: 1 };
  m.gate = ajornada();
  m.logout.mockReset().mockResolvedValue(undefined); m.oblit.mockReset();
  m.oblidaSessio.mockReset().mockResolvedValue(true);
  m.notes.mockReset().mockResolvedValue(undefined);
  m.titols.mockReset().mockResolvedValue(undefined);
  m.carpetes.mockReset().mockResolvedValue({ ok: true });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test('una altra persona entra durant la sincronització final: no es revoca la seua sessió, però les dades locals de qui ix s’obliden', async () => {
  render(<SessionProvider><Sonda /></SessionProvider>);
  let feina;
  await act(async () => { feina = sessio.logout().then(value => ({ value }), error => ({ error })); });
  entra('B'); m.estat = { ...m.estat, usuari: { id: 'B' } };
  m.gate.resolve();
  expect(await feina).toMatchObject({ error: { name: 'AbortError' } });
  expect(m.logout).not.toHaveBeenCalled(); expect(m.oblit).not.toHaveBeenCalled();
  expect(getEfimer(CLAU_USUARI, null)).toMatchObject({ id: 'B' });
  expect(m.oblidaSessio).toHaveBeenCalledOnce(); expect(m.oblidaSessio.mock.calls[0][1]).toBe('A');
  expect(m.notes).toHaveBeenCalledWith('A'); expect(m.titols).toHaveBeenCalledWith('A');
  expect(m.carpetes).toHaveBeenCalledOnce();
});

test('la mateixa persona torna a entrar durant la sincronització final: ni revocació ni oblit de les seues dades', async () => {
  render(<SessionProvider><Sonda /></SessionProvider>);
  let feina;
  await act(async () => { feina = sessio.logout().then(value => ({ value }), error => ({ error })); });
  entra('A');
  m.gate.resolve();
  expect(await feina).toMatchObject({ error: { name: 'AbortError' } });
  expect(m.logout).not.toHaveBeenCalled(); expect(m.oblit).not.toHaveBeenCalled();
  for (const oblit of oblitsLocals()) expect(oblit).not.toHaveBeenCalled();
});

test('la baixa antiga tampoc executa el callback destructiu en una entrada nova, i oblida el local de qui ix', async () => {
  render(<SessionProvider><Sonda /></SessionProvider>);
  const baixa = vi.fn(async () => ({ demanada: true }));
  const feina = sessio.eixAmb(baixa).then(value => ({ value }), error => ({ error }));
  entra('B'); m.gate.resolve();
  expect(await feina).toMatchObject({ error: { name: 'AbortError' } });
  expect(baixa).not.toHaveBeenCalled(); expect(m.oblit).not.toHaveBeenCalled();
  expect(m.notes).toHaveBeenCalledWith('A'); expect(m.titols).toHaveBeenCalledWith('A'); expect(m.carpetes).toHaveBeenCalledOnce();
});

test('una fallada d’un oblit local no amaga l’AbortError, no talla els altres i ho diu a la consola', async () => {
  const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
  m.notes.mockRejectedValue(new Error('base bloquejada'));
  render(<SessionProvider><Sonda /></SessionProvider>);
  const feina = sessio.logout().then(value => ({ value }), error => ({ error }));
  entra('B'); m.gate.resolve();
  expect(await feina).toMatchObject({ error: { name: 'AbortError' } });
  expect(m.titols).toHaveBeenCalledWith('A'); expect(m.carpetes).toHaveBeenCalledOnce();
  expect(avis.mock.calls.filter(([pre, motiu]) => pre === '[sessio] Oblit local de qui ix:' && motiu === 'base bloquejada')).toHaveLength(1);
});

test('la pestanya es buida durant la sincronització final (renovació que rep 400): l’eixida continua, tanca i oblida', async () => {
  render(<SessionProvider><Sonda /></SessionProvider>);
  let feina;
  await act(async () => { feina = sessio.logout().then(value => ({ value }), error => ({ error })); });
  esborraSessio({ abast: 'pestanya' });
  m.gate.resolve();
  expect(await feina).toEqual({ value: undefined });
  expect(m.logout).toHaveBeenCalledOnce(); expect(m.oblit).toHaveBeenCalledOnce();
  expect(m.logout.mock.invocationCallOrder[0]).toBeLessThan(m.oblit.mock.invocationCallOrder[0]);
});

test('la mateixa entrada completa tancament i oblit en ordre', async () => {
  render(<SessionProvider><Sonda /></SessionProvider>);
  const feina = sessio.logout(); m.gate.resolve(); await feina;
  expect(m.logout).toHaveBeenCalledOnce(); expect(m.oblit).toHaveBeenCalledOnce();
  expect(m.logout.mock.invocationCallOrder[0]).toBeLessThan(m.oblit.mock.invocationCallOrder[0]);
  /* El camí bo no passa per l'oblit de l'avortament (el fa eixDeLaSessio). */
  expect(m.oblidaSessio).not.toHaveBeenCalled();
});
