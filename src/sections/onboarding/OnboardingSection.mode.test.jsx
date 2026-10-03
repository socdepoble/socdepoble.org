import React, { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({
  navigate: vi.fn(), enterRemote: vi.fn(), exitRemote: vi.fn(), eleccio: vi.fn(() => false),
  comprova: vi.fn(), entra: vi.fn(), quanLlest: vi.fn(), teCapacitat: undefined, user: null, config: null
}));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => m.navigate }));
vi.mock('../../components/universal/UniversalPage', () => ({ UniversalPage: ({ children }) => <main>{children}</main> }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
/* T2 i T4 · La sessió porta ara teCapacitat i comprovaServidor del port. Sense
   teCapacitat (undefined per defecte) és una sessió com la d'abans de la sonda. */
vi.mock('../../app/contexts/SessionContext', () => ({
  useSession: () => ({ currentUser: m.user, teCapacitat: m.teCapacitat, comprovaServidor: m.comprova, loginWithPassword: m.entra })
}));
vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => ({ externalConfig: m.config }) }));
vi.mock('../../config/dataMode.js', () => ({
  resolveDataMode: config => config.dataMode || 'remote',
  enterRemoteMode: m.enterRemote,
  eleccioRemotaActiva: (...args) => m.eleccio(...args),
  exitRemoteMode: (...args) => m.exitRemote(...args)
}));
/* Correcció de la revisió T1–T4 (260930) · /registre decidix quan el port està
   llest (host.quanLlest), com la resta de consumidors del port. */
vi.mock('../../host.js', () => ({ quanLlest: (...args) => m.quanLlest(...args) }));
import OnboardingSection from './OnboardingSection.jsx';
import { CODI_ENTRADA } from '../../data/errorsBackend.js';
import { MARCA_SENSE_ENTRADA_AUTOMATICA } from './onboardingModel.js';
import { delEfimer, getEfimer } from '../../config/storage.js';
/* Un tenant sintètic en forma d'UUID: normalizeBackendConfig (backendConfig.js)
   en rebutja qualsevol altre, i la secció l'aplica a la configuració. */
const TENANT = '00000000-0000-4000-8000-0000000000de';
beforeEach(() => {
  vi.clearAllMocks();
  m.enterRemote.mockReset(); m.exitRemote.mockReset(); m.comprova.mockReset(); m.entra.mockReset();
  m.eleccio.mockReset().mockReturnValue(false);
  m.quanLlest.mockReset().mockResolvedValue(undefined);
  m.teCapacitat = undefined; m.user = null;
  m.config = { dataMode: 'seed', tenantId: TENANT };
  delEfimer(MARCA_SENSE_ENTRADA_AUTOMATICA);
});
afterEach(() => {
  cleanup();
  delEfimer(MARCA_SENSE_ENTRADA_AUTOMATICA);
});

const deferred = () => { let resol; const promesa = new Promise((res) => { resol = res; }); return { promesa, resol }; };
const ambSalut = () => { m.teCapacitat = (cap) => cap === 'salut'; };
const reintent = () => screen.getByRole('button', { name: 'Torna-ho a provar' });
/* Unes quantes microtasques: el que s'havia de decidir ja s'hauria decidit. */
const buidaMicrotasques = () => act(async () => { for (let i = 0; i < 10; i += 1) await Promise.resolve(); });

/* T16 es conserva (260930): /registre mostra directament el formulari i, des de
   seed/local, prepara el mode remot una sola vegada. Des de T2 i T4 ho fa així
   quan el port NO té la capacitat 'salut'; amb ella, primer sonda el servidor
   (proves «T16 amb sonda» de sota).
   Correcció de la revisió T1–T4 (260930) · La decisió espera ara que el port
   estiga llest (host.quanLlest): les proves que abans miraven la crida en el
   mateix pintat l'esperen amb waitFor. Les asercions són les mateixes, i a més
   es comprova que només hi ha una decisió (quanLlest una sola vegada). */
test('T16 sense la capacitat salut · entrar mostra directament el formulari original i prepara remote una sola vegada', async () => {
  render(<StrictMode><OnboardingSection /></StrictMode>);
  expect(screen.getByLabelText('Contrasenya')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Entrar amb Google' })).toBeTruthy();
  expect(screen.queryByText(/Estàs explorant la demostració/)).toBeNull();
  expect(screen.queryByRole('button', { name: 'Entrar amb dades reals' })).toBeNull();
  await waitFor(() => expect(m.enterRemote).toHaveBeenCalledTimes(1));
  expect(m.enterRemote).toHaveBeenCalledWith(expect.objectContaining({ dataMode: 'seed', tenantId: TENANT }));
  await buidaMicrotasques();
  expect(m.enterRemote).toHaveBeenCalledTimes(1);
  expect(m.quanLlest).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('Contrasenya').disabled).toBe(true);
  expect(m.comprova).not.toHaveBeenCalled();
});

test('una sessió antiga dins del pilot no amaga l’entrada real', async () => {
  m.user = { id: 'pilot' };
  render(<OnboardingSection />);
  expect(screen.getByLabelText('Contrasenya')).toBeTruthy();
  await waitFor(() => expect(m.enterRemote).toHaveBeenCalledTimes(1));
  expect(m.navigate).not.toHaveBeenCalled();
});

test('si no es pot preparar remote manté el formulari amb error i no envia credencials seed', async () => {
  m.enterRemote.mockImplementation(() => { throw new Error('No s’ha pogut guardar l’elecció.'); });
  render(<OnboardingSection />);
  expect((await screen.findByRole('alert')).textContent).toContain('No s’ha pogut guardar');
  expect(screen.getByLabelText('Contrasenya').disabled).toBe(true);
});

test('T16 sense la capacitat salut · un port que diu que no la té es comporta com abans', async () => {
  m.teCapacitat = () => false;
  render(<OnboardingSection />);
  await waitFor(() => expect(m.enterRemote).toHaveBeenCalledTimes(1));
  expect(m.comprova).not.toHaveBeenCalled();
});

/* ── Correcció de la revisió T1–T4 (260930) · La capacitat es llig amb el port llest ── */

test('el port s’instal·la després de muntar /registre: es sonda (salut) i no es canvia de mode directament', async () => {
  /* Com backendPort.teCapacitat: sense adaptador instal·lat, false per a tot. */
  const port = { llest: false };
  m.teCapacitat = (cap) => port.llest && cap === 'salut';
  const llest = deferred();
  m.quanLlest.mockReturnValue(llest.promesa);
  m.comprova.mockResolvedValue({ ok: true });
  render(<StrictMode><OnboardingSection /></StrictMode>);
  await buidaMicrotasques();
  // Mentre el port no està llest no es decidix res i el formulari espera.
  expect(m.enterRemote).not.toHaveBeenCalled();
  expect(m.comprova).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Contrasenya').disabled).toBe(true);
  port.llest = true;
  await act(async () => { llest.resol(); });
  await waitFor(() => expect(m.enterRemote).toHaveBeenCalledTimes(1));
  expect(m.comprova).toHaveBeenCalledTimes(1);
  expect(m.comprova.mock.invocationCallOrder[0]).toBeLessThan(m.enterRemote.mock.invocationCallOrder[0]);
  expect(m.quanLlest).toHaveBeenCalledTimes(1);
});

test('desmuntada abans que el port estiga llest: ni sonda ni canvi de mode', async () => {
  ambSalut();
  const llest = deferred();
  m.quanLlest.mockReturnValue(llest.promesa);
  m.comprova.mockResolvedValue({ ok: true });
  const vista = render(<OnboardingSection />);
  vista.unmount();
  await act(async () => { llest.resol(); });
  await buidaMicrotasques();
  expect(m.comprova).not.toHaveBeenCalled();
  expect(m.enterRemote).not.toHaveBeenCalled();
});

/* ── T2 i T4 (ordre del Mestre, 260930) · T16 amb sonda ── */

test('T16 amb sonda · el servidor respon: l’elecció remota es desa DESPRÉS de la sonda, una sola vegada en StrictMode', async () => {
  ambSalut();
  const sonda = deferred();
  m.comprova.mockReturnValue(sonda.promesa);
  render(<StrictMode><OnboardingSection /></StrictMode>);
  /* Correcció de la revisió T1–T4 (260930) · La sonda ix quan el port està llest
     (abans, en una microtasca): s'espera amb waitFor. */
  await waitFor(() => expect(m.comprova).toHaveBeenCalledTimes(1));
  expect(m.comprova).toHaveBeenCalledWith(expect.objectContaining({ dataMode: 'seed', tenantId: TENANT }));
  expect(m.enterRemote).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Contrasenya').disabled).toBe(true);
  expect(screen.getByRole('button', { name: 'Entrar amb Google' }).disabled).toBe(true);
  // Mentre sonda, sí que hi ha faena en curs: el botó d'enviar gira.
  expect(screen.getByRole('button', { name: 'Crear el compte' }).querySelector('.sdp-boto__gir')).not.toBeNull();
  await act(async () => { sonda.resol({ ok: true }); });
  expect(m.enterRemote).toHaveBeenCalledTimes(1);
  expect(m.enterRemote).toHaveBeenCalledWith(expect.objectContaining({ dataMode: 'seed', tenantId: TENANT }));
  expect(m.comprova).toHaveBeenCalledTimes(1);
  expect(screen.queryByText(/no respon/)).toBeNull();
});

test('T16 amb sonda · el servidor no respon: no es desa res, avís en mode de proves i «Torna-ho a provar» torna a sondar', async () => {
  ambSalut();
  m.comprova.mockResolvedValue({ ok: false });
  render(<StrictMode><OnboardingSection /></StrictMode>);
  const avis = await screen.findByRole('status');
  expect(avis.classList.contains('sdp-alerta--avis')).toBe(true);
  expect(avis.textContent).toContain('El servidor del poble no respon ara mateix. Continues en mode de proves: pots explorar l’app, però encara no pots crear el compte ni entrar.');
  expect(m.comprova).toHaveBeenCalledTimes(1);
  expect(m.enterRemote).not.toHaveBeenCalled();
  // Mentre no es pot entrar, ni el formulari ni Google.
  expect(screen.getByLabelText('Contrasenya').disabled).toBe(true);
  expect(screen.getByRole('button', { name: 'Entrar amb Google' }).disabled).toBe(true);

  // Un reintent que continua sense resposta: l'avís es queda i res no es desa.
  await act(async () => { fireEvent.click(within(avis).getByRole('button', { name: 'Torna-ho a provar' })); });
  expect(m.comprova).toHaveBeenCalledTimes(2);
  expect(m.enterRemote).not.toHaveBeenCalled();
  expect(screen.getByRole('status').textContent).toContain('no respon');

  // Mentre sonda, el botó ho diu i no admet un segon clic.
  const sonda = deferred();
  m.comprova.mockReturnValueOnce(sonda.promesa);
  await act(async () => { fireEvent.click(reintent()); });
  const ocupat = within(screen.getByRole('status')).getByRole('button');
  expect(ocupat.disabled).toBe(true);
  expect(ocupat.getAttribute('aria-busy')).toBe('true');
  await act(async () => { sonda.resol({ ok: true }); });
  expect(m.comprova).toHaveBeenCalledTimes(3);
  expect(m.enterRemote).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('status')).toBeNull();
});

/* Correcció de la revisió T1–T4 (260930) · Amb el servidor caigut el formulari
   continua desactivat (no s'envien credencials en mode de proves), però cap
   botó gira: no hi ha cap faena en curs. */
test('T16 amb sonda · servidor caigut: controls desactivats i cap gir al botó d’enviar', async () => {
  ambSalut();
  m.comprova.mockResolvedValue({ ok: false });
  render(<OnboardingSection />);
  await screen.findByRole('status');
  const enviar = screen.getByRole('button', { name: 'Crear el compte' });
  expect(enviar.disabled).toBe(true);
  expect(enviar.querySelector('.sdp-boto__gir')).toBeNull();
  expect(document.querySelector('.sdp-boto__gir')).toBeNull();
  for (const camp of ['Nom i cognoms', 'Correu electrònic', 'Contrasenya', 'Confirmar contrasenya']) {
    expect(screen.getByLabelText(camp).disabled, camp).toBe(true);
  }
  expect(screen.getByRole('checkbox').disabled).toBe(true);
  // I desactivat vol dir desactivat: un enviament forçat ni tan sols valida.
  fireEvent.submit(enviar.closest('form'));
  expect(screen.queryByText('Escriu el teu nom complet.')).toBeNull();
});

test('T16 amb sonda · una sonda que rebutja (un adaptador que no complix) val com a «no respon»', async () => {
  ambSalut();
  m.comprova.mockRejectedValue(new TypeError('Failed to fetch'));
  render(<OnboardingSection />);
  expect(await screen.findByRole('status')).toBeTruthy();
  expect(m.enterRemote).not.toHaveBeenCalled();
});

test('T16 amb sonda · una resposta que arriba amb la vista desmuntada no desa res', async () => {
  ambSalut();
  const sonda = deferred();
  m.comprova.mockReturnValue(sonda.promesa);
  const vista = render(<OnboardingSection />);
  /* Correcció de la revisió T1–T4 (260930) · La sonda ix quan el port està
     llest: s'espera que haja eixit abans de desmuntar, perquè la prova continue
     mirant la resposta TARDANA (el cas de desmuntar abans és la prova de dalt). */
  await waitFor(() => expect(m.comprova).toHaveBeenCalledTimes(1));
  vista.unmount();
  await act(async () => { sonda.resol({ ok: true }); });
  expect(m.enterRemote).not.toHaveBeenCalled();
});

test('T16 amb sonda · ja en remot no sonda ni desa res', async () => {
  ambSalut();
  m.config = { dataMode: 'remote', tenantId: TENANT };
  render(<OnboardingSection />);
  await buidaMicrotasques();
  expect(m.comprova).not.toHaveBeenCalled();
  expect(m.enterRemote).not.toHaveBeenCalled();
  expect(m.quanLlest).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Contrasenya').disabled).toBe(false);
});

/* ── T2 · Tornar al mode de proves quan el servidor no respon ── */

async function entraAmbError(error) {
  m.entra.mockRejectedValue(error);
  render(<OnboardingSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Entrar', exact: true }));
  fireEvent.change(screen.getByLabelText('Correu electrònic'), { target: { name: 'email', value: 'ana@poble.test' } });
  fireEvent.change(screen.getByLabelText('Contrasenya'), { target: { name: 'password', value: 'contrasenya-actual' } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Entrar al compte' })); });
}
const servidorCaigut = () => Object.assign(new Error('El servidor del poble no respon ara mateix.'), { code: CODI_ENTRADA.SERVIDOR_INABASTABLE });

test('T2 · en remot per una elecció desada, un servidor inabastable ofereix «Tornar al mode de proves»', async () => {
  m.config = { dataMode: 'remote', tenantId: TENANT };
  m.eleccio.mockReturnValue(true);
  await entraAmbError(servidorCaigut());
  const avis = screen.getByRole('status');
  expect(avis.classList.contains('sdp-alerta--avis')).toBe(true);
  expect(m.eleccio).toHaveBeenCalledWith(expect.objectContaining({ tenantId: TENANT }));
  fireEvent.click(within(avis).getByRole('button', { name: 'Tornar al mode de proves' }));
  expect(m.exitRemote).toHaveBeenCalledTimes(1);
  expect(m.exitRemote).toHaveBeenCalledWith(expect.objectContaining({ tenantId: TENANT }));
});

test('T2 · un error de xarxa sense codi (estat 0) també l’oferix', async () => {
  m.config = { dataMode: 'remote', tenantId: TENANT };
  m.eleccio.mockReturnValue(true);
  await entraAmbError(Object.assign(new Error('Supabase 0: xarxa'), { status: 0 }));
  expect(within(screen.getByRole('status')).getByRole('button', { name: 'Tornar al mode de proves' })).toBeTruthy();
});

test('T2 · si no es pot esborrar l’elecció, es diu i no es recarrega', async () => {
  m.config = { dataMode: 'remote', tenantId: TENANT };
  m.eleccio.mockReturnValue(true);
  m.exitRemote.mockImplementation(() => { throw new Error('No s’ha pogut esborrar l’elecció.'); });
  await entraAmbError(servidorCaigut());
  fireEvent.click(screen.getByRole('button', { name: 'Tornar al mode de proves' }));
  expect(screen.getByRole('alert').textContent).toContain('No s’ha pogut esborrar l’elecció.');
  // Correcció de la revisió T1–T4 (260930) · Sense recàrrega, tampoc es queda la marca.
  expect(getEfimer(MARCA_SENSE_ENTRADA_AUTOMATICA, null)).toBeNull();
});

test('T2 · sense elecció desada (una release en remot) o amb un altre error, cap botó per a tornar', async () => {
  m.config = { dataMode: 'remote', tenantId: TENANT };
  await entraAmbError(servidorCaigut());
  expect(screen.getByRole('status').textContent).toContain('no respon');
  expect(screen.queryByRole('button', { name: 'Tornar al mode de proves' })).toBeNull();
  cleanup();
  m.eleccio.mockReturnValue(true);
  await entraAmbError(Object.assign(new Error('x'), { code: CODI_ENTRADA.CREDENCIALS }));
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Tornar al mode de proves' })).toBeNull();
  expect(m.exitRemote).not.toHaveBeenCalled();
});

/* ── Correcció de la revisió T1–T4 (260930) · «Tornar al mode de proves» a /registre no es desfà ──
   exitRemoteMode recarrega la MATEIXA URL (/registre…): la càrrega següent és en
   mode de proves i, sense la marca d'un sol ús, l'entrada automàtica hi tornaria
   a desar l'elecció remota si la sonda respon (un /token en 500 amb /health viu). */
test('T2 · després de tornar al mode de proves amb la sonda en ok, la càrrega següent no entra sola fins al clic', async () => {
  // 1a càrrega: en remot per una elecció desada; entrar falla perquè el servidor no respon.
  m.config = { dataMode: 'remote', tenantId: TENANT };
  m.eleccio.mockReturnValue(true);
  await entraAmbError(servidorCaigut());
  fireEvent.click(within(screen.getByRole('status')).getByRole('button', { name: 'Tornar al mode de proves' }));
  expect(m.exitRemote).toHaveBeenCalledTimes(1);
  cleanup();

  // 2a càrrega (la recàrrega): mode de proves, port amb 'salut' i la sonda en ok.
  m.config = { dataMode: 'seed', tenantId: TENANT };
  m.eleccio.mockReturnValue(false);
  ambSalut();
  m.comprova.mockResolvedValue({ ok: true });
  render(<StrictMode><OnboardingSection /></StrictMode>);
  const avis = await screen.findByRole('status');
  expect(avis.classList.contains('sdp-alerta--avis')).toBe(true);
  expect(avis.textContent).toContain('Has tornat al mode de proves');
  await buidaMicrotasques();
  expect(m.comprova).not.toHaveBeenCalled();
  expect(m.enterRemote).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Contrasenya').disabled).toBe(true);
  // La marca s'ha consumit en llegir-la.
  expect(getEfimer(MARCA_SENSE_ENTRADA_AUTOMATICA, null)).toBeNull();

  // Només el clic manual sonda i, si respon, desa l'elecció.
  await act(async () => { fireEvent.click(within(avis).getByRole('button', { name: 'Connectar amb el servidor' })); });
  await waitFor(() => expect(m.enterRemote).toHaveBeenCalledTimes(1));
  expect(m.comprova).toHaveBeenCalledTimes(1);
  expect(m.comprova.mock.invocationCallOrder[0]).toBeLessThan(m.enterRemote.mock.invocationCallOrder[0]);
  cleanup();

  // 3a càrrega: la marca era d'un sol ús, i l'entrada automàtica torna com sempre.
  m.enterRemote.mockClear(); m.comprova.mockClear();
  render(<OnboardingSection />);
  await waitFor(() => expect(m.enterRemote).toHaveBeenCalledTimes(1));
  expect(m.comprova).toHaveBeenCalledTimes(1);
  expect(screen.queryByText(/Has tornat al mode de proves/)).toBeNull();
});

test('T2 · el clic manual amb el servidor encara caigut mostra l’avís de «no respon», sense desar res', async () => {
  m.config = { dataMode: 'remote', tenantId: TENANT };
  m.eleccio.mockReturnValue(true);
  await entraAmbError(servidorCaigut());
  fireEvent.click(screen.getByRole('button', { name: 'Tornar al mode de proves' }));
  cleanup();
  m.config = { dataMode: 'seed', tenantId: TENANT };
  ambSalut();
  m.comprova.mockResolvedValue({ ok: false });
  render(<OnboardingSection />);
  const avis = await screen.findByRole('status');
  await act(async () => { fireEvent.click(within(avis).getByRole('button', { name: 'Connectar amb el servidor' })); });
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('no respon'));
  expect(m.comprova).toHaveBeenCalledTimes(1);
  expect(m.enterRemote).not.toHaveBeenCalled();
  expect(screen.queryByText(/Has tornat al mode de proves/)).toBeNull();
});
