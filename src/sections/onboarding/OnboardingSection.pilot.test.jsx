/**
 * Gauntlet 261016_1530 (Bloc 3.6.4; F66) · L'entrada pilot local a /registre.
 * La sessió i el canvi de mode són falsos (com OnboardingSection.mode.test.jsx):
 * ací es prova què pinta la pàgina i què demana, en cada estat. La cadena de
 * veres (sessió, identitat i adaptador) la prova OnboardingSection.pilot.flux.test.jsx.
 *
 * Només en desenvolupament (Vitest corre amb DEV) i en mode de proves, i només
 * quan el servidor no hi és: l'avís «no respon» o el mode de proves triat.
 * Mai en remot, mai en producció, mai amb una sessió ja oberta.
 */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({
  navigate: vi.fn(), enterRemote: vi.fn(), exitRemote: vi.fn(), eleccio: vi.fn(() => false), toast: vi.fn(),
  comprova: vi.fn(), entra: vi.fn(), pilot: vi.fn(), quanLlest: vi.fn(), teCapacitat: undefined, user: null, config: null,
  ambPilot: true
}));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => m.navigate }));
vi.mock('../../components/universal/UniversalPage', () => ({ UniversalPage: ({ children }) => <main>{children}</main> }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../app/contexts/SessionContext', () => ({
  useSession: () => ({
    currentUser: m.user, teCapacitat: m.teCapacitat, comprovaServidor: m.comprova, loginWithPassword: m.entra,
    ...(m.ambPilot ? { entraComAPilot: m.pilot } : {})
  })
}));
vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => ({ externalConfig: m.config }) }));
vi.mock('../../config/dataMode.js', () => ({
  resolveDataMode: config => config.dataMode || 'remote',
  enterRemoteMode: m.enterRemote,
  eleccioRemotaActiva: (...args) => m.eleccio(...args),
  exitRemoteMode: (...args) => m.exitRemote(...args)
}));
vi.mock('../../host.js', () => ({ quanLlest: (...args) => m.quanLlest(...args) }));
import OnboardingSection from './OnboardingSection.jsx';
import { CODI_ENTRADA } from '../../data/errorsBackend.js';
import { PERSONA_PILOT } from '../../data/identitatsSeed.js';
import { CODI_PILOT_NO_DISPONIBLE } from '../../data/sessioPilot.js';
import { RUTA_DESPRES_D_ENTRAR } from '../../config/rutaEntrada.js';
import { MARCA_SENSE_ENTRADA_AUTOMATICA } from './onboardingModel.js';
import { delEfimer, setEfimer } from '../../config/storage.js';

const TENANT = '00000000-0000-4000-8000-0000000000f6';
/* El literal de l'encàrrec B3 (criteri de Codex), sencer i en un sol lloc
   visible: el títol del bloc. */
const TITOL = 'Entra com a persona pilot · només en aquest ordinador';
const BOTO = 'Entra com a persona pilot';

beforeEach(() => {
  vi.clearAllMocks();
  m.enterRemote.mockReset(); m.exitRemote.mockReset(); m.comprova.mockReset(); m.entra.mockReset(); m.pilot.mockReset();
  m.eleccio.mockReset().mockReturnValue(false);
  m.quanLlest.mockReset().mockResolvedValue(undefined);
  m.teCapacitat = (cap) => cap === 'salut';
  m.user = null; m.ambPilot = true;
  m.config = { dataMode: 'seed', tenantId: TENANT };
  m.pilot.mockImplementation(() => ({ user: { id: '0001' } }));
  delEfimer(MARCA_SENSE_ENTRADA_AUTOMATICA);
  window.history.replaceState(null, '', '/registre?mode=entrar');
});
afterEach(() => {
  cleanup();
  delEfimer(MARCA_SENSE_ENTRADA_AUTOMATICA);
  window.history.replaceState(null, '', '/');
  vi.unstubAllEnvs();
});

const deferred = () => { let resol; const promesa = new Promise((res) => { resol = res; }); return { promesa, resol }; };
const buidaMicrotasques = () => act(async () => { for (let i = 0; i < 10; i += 1) await Promise.resolve(); });
/* El bloc de l'entrada pilot (l'Alerta pel seu títol), o null. */
const blocPilot = () => screen.queryByText(TITOL)?.closest('.sdp-alerta') ?? null;

async function servidorQueNoRespon() {
  m.comprova.mockResolvedValue({ ok: false });
  render(<OnboardingSection />);
  return screen.findByRole('status');
}

test('seed · el servidor no respon: l’entrada pilot és visible i honesta, fora de la regió viva, i substituïx el «Mock»', async () => {
  const avis = await servidorQueNoRespon();
  // L'avís de sempre, amb el text i l'únic botó de sempre.
  expect(avis.textContent).toContain('El servidor del poble no respon ara mateix. Continues en mode de proves: pots explorar l’app, però encara no pots crear el compte ni entrar.');
  expect(within(avis).getAllByRole('button').map((b) => b.textContent)).toEqual(['Torna-ho a provar']);
  expect(screen.queryByRole('button', { name: 'Forçar entrada local (Mock)' })).toBeNull();

  const bloc = blocPilot();
  expect(bloc).not.toBeNull();
  expect(bloc.getAttribute('role')).toBeNull();
  expect(bloc.classList.contains('sdp-alerta--info')).toBe(true);
  expect(bloc.textContent).toContain(`pots entrar com a ${PERSONA_PILOT.nom}, la persona pilot de les dades de mostra`);
  expect(bloc.textContent).toContain('només viu en esta pestanya d’aquest ordinador, no passa pel servidor i no dona cap permís real');
  expect(bloc.textContent).toContain('Només apareix en desenvolupament.');
  const boto = within(bloc).getByRole('button', { name: BOTO });
  expect(boto.disabled).toBe(false);
  // Una sola regió viva a la pàgina: l'avís «no respon».
  expect(screen.getAllByRole('status')).toHaveLength(1);
  // El formulari continua tancat: el mode de proves no envia credencials.
  expect(screen.getByLabelText('Contrasenya').disabled).toBe(true);
});

test('seed · «Entra com a persona pilot» entra per la sessió i aterra a la pròpia identitat, sense tornar a sondar', async () => {
  await servidorQueNoRespon();
  fireEvent.click(within(blocPilot()).getByRole('button', { name: BOTO }));
  expect(m.pilot).toHaveBeenCalledTimes(1);
  expect(m.pilot).toHaveBeenCalledWith(expect.objectContaining({ dataMode: 'seed', tenantId: TENANT }));
  expect(m.navigate).toHaveBeenCalledWith(RUTA_DESPRES_D_ENTRAR, { replace: true });
  expect(m.toast).toHaveBeenCalledWith(`Has entrat com a ${PERSONA_PILOT.nom}, la persona pilot. Esta sessió de prova només viu en aquest ordinador.`, 'success');
  await buidaMicrotasques();
  expect(m.comprova).toHaveBeenCalledTimes(1);
  expect(m.enterRemote).not.toHaveBeenCalled();
  expect(m.entra).not.toHaveBeenCalled();
});

test('local · també s’oferix, i una tornada de la Gestoria hi mana com en qualsevol entrada', async () => {
  m.config = { dataMode: 'local', tenantId: TENANT };
  window.history.replaceState(null, '', '/registre?mode=entrar&tornar=%2Fapp%2Fgestoria%2Ffactures');
  await servidorQueNoRespon();
  fireEvent.click(within(blocPilot()).getByRole('button', { name: BOTO }));
  expect(m.pilot).toHaveBeenCalledWith(expect.objectContaining({ dataMode: 'local' }));
  expect(m.navigate).toHaveBeenCalledWith('/app/gestoria/factures', { replace: true });
});

test('mentre torna a sondar, el botó pilot espera; si continua sense resposta, torna a estar llest', async () => {
  const avis = await servidorQueNoRespon();
  const sonda = deferred();
  m.comprova.mockReturnValueOnce(sonda.promesa);
  await act(async () => { fireEvent.click(within(avis).getByRole('button', { name: 'Torna-ho a provar' })); });
  expect(within(blocPilot()).getByRole('button', { name: BOTO }).disabled).toBe(true);
  await act(async () => { sonda.resol({ ok: false }); });
  expect(within(blocPilot()).getByRole('button', { name: BOTO }).disabled).toBe(false);
  expect(m.pilot).not.toHaveBeenCalled();
});

test('després de «Tornar al mode de proves» també s’oferix, al costat de «Connectar amb el servidor»', async () => {
  setEfimer(MARCA_SENSE_ENTRADA_AUTOMATICA, true);
  m.comprova.mockResolvedValue({ ok: true });
  render(<OnboardingSection />);
  const avis = await screen.findByRole('status');
  expect(avis.textContent).toContain('Has tornat al mode de proves');
  expect(blocPilot()).not.toBeNull();
  await buidaMicrotasques();
  expect(m.comprova).not.toHaveBeenCalled();
  fireEvent.click(within(blocPilot()).getByRole('button', { name: BOTO }));
  expect(m.pilot).toHaveBeenCalledTimes(1);
  expect(m.enterRemote).not.toHaveBeenCalled();
});

test('si l’entrada pilot es rebutja, l’avís ho diu i no s’aterra enlloc', async () => {
  m.pilot.mockImplementation(() => {
    throw Object.assign(new Error('L’entrada pilot només existix en desenvolupament i en mode de proves (seed o local).'), { code: CODI_PILOT_NO_DISPONIBLE });
  });
  await servidorQueNoRespon();
  fireEvent.click(within(blocPilot()).getByRole('button', { name: BOTO }));
  expect((await screen.findByRole('alert')).textContent).toContain('L’entrada pilot només existix en desenvolupament');
  expect(m.navigate).not.toHaveBeenCalled();
  expect(m.toast).not.toHaveBeenCalled();
});

/* ── Negatives ── */

test('negativa · el servidor respon: es passa a remot i no hi ha entrada pilot', async () => {
  m.comprova.mockResolvedValue({ ok: true });
  render(<OnboardingSection />);
  await waitFor(() => expect(m.enterRemote).toHaveBeenCalledTimes(1));
  expect(blocPilot()).toBeNull();
  expect(screen.queryByRole('button', { name: BOTO })).toBeNull();
});

test('negativa · mentre sonda la primera vegada, encara no s’oferix', async () => {
  const sonda = deferred();
  m.comprova.mockReturnValue(sonda.promesa);
  render(<OnboardingSection />);
  await waitFor(() => expect(m.comprova).toHaveBeenCalledTimes(1));
  expect(blocPilot()).toBeNull();
  await act(async () => { sonda.resol({ ok: false }); });
  expect(blocPilot()).not.toBeNull();
});

test('negativa · en remot, ni amb el servidor caigut ni amb una elecció desada: cal l’entrada real', async () => {
  m.config = { dataMode: 'remote', tenantId: TENANT };
  m.eleccio.mockReturnValue(true);
  m.entra.mockRejectedValue(Object.assign(new Error('El servidor del poble no respon ara mateix.'), { code: CODI_ENTRADA.SERVIDOR_INABASTABLE }));
  render(<OnboardingSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Entrar', exact: true }));
  fireEvent.change(screen.getByLabelText('Correu electrònic'), { target: { name: 'email', value: 'ana@poble.test' } });
  fireEvent.change(screen.getByLabelText('Contrasenya'), { target: { name: 'password', value: 'contrasenya-actual' } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Entrar al compte' })); });
  expect(within(screen.getByRole('status')).getByRole('button', { name: 'Tornar al mode de proves' })).toBeTruthy();
  expect(blocPilot()).toBeNull();
  expect(screen.queryByRole('button', { name: BOTO })).toBeNull();
  expect(m.pilot).not.toHaveBeenCalled();
});

test('negativa · en un build de producció (DEV fals) no hi ha entrada pilot i el «Mock» es queda com abans', async () => {
  vi.stubEnv('DEV', false);
  const avis = await servidorQueNoRespon();
  expect(blocPilot()).toBeNull();
  expect(screen.queryByRole('button', { name: BOTO })).toBeNull();
  expect(within(avis).getAllByRole('button').map((b) => b.textContent)).toEqual(['Torna-ho a provar', 'Forçar entrada local (Mock)']);
});

test('negativa · amb una sessió ja oberta no s’oferix una altra entrada', async () => {
  m.user = { id: '0001' };
  await servidorQueNoRespon();
  expect(blocPilot()).toBeNull();
});

test('negativa · una sessió que no porta l’entrada pilot (un port d’abans) no pinta el bloc', async () => {
  m.ambPilot = false;
  await servidorQueNoRespon();
  expect(blocPilot()).toBeNull();
});
