/* QA-A01a (Gauntlet 261029_1858) · expulsaSessio() de l'amfitrió (API i pont
   d'iframe) passa per l'eixida de veres de la interfície quan n'hi ha una de
   registrada (data/expulsioAmfitrio.js), i fa el camí curt de sempre (el logout
   de l'adaptador, sense res més) quan no n'hi ha cap o quan no es pot començar.
   Ací no es carrega la interfície (PedraSecaEmbed simulat): la integració amb
   SessionProvider és a src/app/contexts/SessionContext.expulsio.seguretat.test.jsx. */
import { afterEach, expect, test, vi } from 'vitest';
vi.mock('../src/PedraSecaEmbed.jsx', () => ({ defineCustomElement: vi.fn() }));
vi.mock('../src/config/runtimePolicy.js', () => ({ setRuntimePolicy: vi.fn(), getRuntimePolicy: () => ({}), esOrigenParePermes: () => false }));
vi.mock('../src/data/identitat.js', () => ({ adoptaSessioExterna: vi.fn(() => true), esborraSessio: vi.fn(), configuraBackendSessio: vi.fn() }));
vi.mock('../src/utils/sanitize.js', () => ({ sanitizeHtml: (x) => x }));
vi.mock('../src/apps/plataforma/registreApps.js', () => ({ registraAppExterna: vi.fn() }));
import { CONTRACTE_NUCLI } from '../src/data/contracte.js';
import { fixaCapaDelPaquet } from '../src/config/capaDelPaquet.js';
import { registraEixidaDeVeres } from '../src/data/expulsioAmfitrio.js';
import { esborraSessio } from '../src/data/identitat.js';
import { expulsaSessio, injectaBackendDelPaquet } from '../src/host.js';

fixaCapaDelPaquet(Object.freeze({
  supabaseUrl: 'https://paquet.supabase.test',
  supabaseAnonKey: 'sb_publishable_del_paquet',
  tenantId: '11111111-1111-4111-8111-111111111111'
}));
const adaptador = Object.fromEntries(CONTRACTE_NUCLI.map((nom) => [nom, vi.fn()]));
adaptador.logout = vi.fn(async () => {});
injectaBackendDelPaquet(adaptador);

let baixes = [];
afterEach(() => {
  for (const baixa of baixes) baixa();
  baixes = [];
  adaptador.logout.mockClear();
  vi.mocked(esborraSessio).mockClear();
});

test('sense cap eixida de veres registrada (cap interfície carregada): el logout de l’adaptador, com sempre', () => {
  expect(expulsaSessio()).toBe(true);
  expect(adaptador.logout).toHaveBeenCalledTimes(1);
  expect(adaptador.logout).toHaveBeenCalledWith();
  expect(esborraSessio).not.toHaveBeenCalled();
});

test('amb una eixida registrada, l’expulsió passa per ella (la més recent) i l’amfitrió no tanca pel seu compte', async () => {
  const deReserva = vi.fn(async () => {});
  const delProveidor = vi.fn(async () => { throw new Error('Sense xarxa'); });
  baixes.push(registraEixidaDeVeres(deReserva), registraEixidaDeVeres(delProveidor));
  expect(expulsaSessio()).toBe(true);
  expect(delProveidor).toHaveBeenCalledTimes(1);
  expect(deReserva).not.toHaveBeenCalled();
  expect(adaptador.logout).not.toHaveBeenCalled();
  // Una eixida que rebutja (logout fallit) no deixa cap rebuig sense atendre: es veu a la cua de microtasques.
  await new Promise((resolve) => { setTimeout(resolve, 0); });
  // En donar de baixa el proveïdor, mana la de reserva.
  baixes.pop()();
  expulsaSessio();
  expect(deReserva).toHaveBeenCalledTimes(1);
});

test('una eixida que llança en començar no deixa l’expulsió a mitges: camí curt', () => {
  baixes.push(registraEixidaDeVeres(() => { throw new Error('trencada'); }));
  expect(expulsaSessio()).toBe(true);
  expect(adaptador.logout).toHaveBeenCalledTimes(1);
});
