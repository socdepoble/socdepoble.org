import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn(), registra: vi.fn(), entra: vi.fn(), google: vi.fn(), usuari: { valor: null } }));
/* Els routers són els de veres (C5: la consulta ve del router); només la
   navegació es simula, per a llegir on porta. Sense router al voltant, el
   useRouter de veres es queixa i la secció llig la barra d'adreces, com abans. */
vi.mock('../../app/contexts/RouterContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => m.navigate,
}));
vi.mock('../../components/universal/UniversalPage', () => ({ UniversalPage: ({ children }) => <main>{children}</main> }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../app/contexts/SessionContext', () => ({
  useSession: () => ({ currentUser: m.usuari.valor, registerWithPassword: m.registra, loginWithPassword: m.entra, loginWithGoogle: m.google }),
}));
vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => ({ externalConfig: { tenantId: '00000000-0000-4000-8000-000000000000' } }) }));
/* La targeta real porta accions i telemetria que ací no es proven. */
vi.mock('../../components/PedraSeca/index.js', async (importOriginal) => ({
  ...(await importOriginal()),
  UniversalCard: ({ title, subtitle, body }) => <section><h3>{title}</h3>{subtitle ? <p>{subtitle}</p> : null}{body}</section>,
}));
import { BrowserRouter, MemoryRouter, useRouter } from '../../app/contexts/RouterContext';
import OnboardingSection from './OnboardingSection.jsx';
import { CODI_ENTRADA } from '../../data/errorsBackend.js';
import { RUTA_DESPRES_D_ENTRAR, rutaDEntrada } from '../../config/rutaEntrada.js';

beforeEach(() => {
  for (const f of [m.navigate, m.toast, m.registra, m.entra, m.google]) f.mockReset();
  m.usuari.valor = null;
});
afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

function omple() {
  fireEvent.change(screen.getByLabelText('Nom i cognoms'), { target: { name: 'name', value: 'Ana Puig' } });
  fireEvent.change(screen.getByLabelText('Correu electrònic'), { target: { name: 'email', value: ' Ana@Poble.TEST ' } });
  fireEvent.change(screen.getByLabelText('Contrasenya'), { target: { name: 'password', value: 'contrasenya-llarga' } });
  fireEvent.change(screen.getByLabelText('Confirmar contrasenya'), { target: { name: 'confirmPassword', value: 'contrasenya-llarga' } });
  fireEvent.click(screen.getByRole('checkbox'));
}

async function registra() {
  render(<OnboardingSection />);
  omple();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Crear el compte' })); });
}

function deferred() {
  let resol;
  let rebutja;
  const promesa = new Promise((res, rej) => { resol = res; rebutja = rej; });
  return { promesa, resol, rebutja };
}

const botoCrear = () => screen.getByRole('button', { name: 'Crear el compte' });
const botoGoogle = () => screen.getByRole('button', { name: 'Entrar amb Google' });
const ull = () => screen.getByRole('button', { name: 'Mostra la contrasenya' });
const ullConfirma = () => screen.getByRole('button', { name: 'Mostra la confirmació de la contrasenya' });
/* jsdom té PageTransitionEvent: el persisted arriba pel constructor. */
const tornaDelBfcache = (persisted) => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted }));

test('I4 · sense access_token es demana confirmar el correu, en minúscules i sense toast d’èxit', async () => {
  m.registra.mockResolvedValue({ id: 'U', email: 'ana@poble.test' });
  const avis = vi.spyOn(window, 'dispatchEvent');
  await registra();
  // El camp type=email ja retalla els espais; les majúscules arriben tal qual.
  expect(m.registra).toHaveBeenCalledWith('Ana@Poble.TEST', 'contrasenya-llarga',
    expect.objectContaining({ full_name: 'Ana Puig', accepta_rgpd: true, tenant_id: '00000000-0000-4000-8000-000000000000' }), { tenantId: '00000000-0000-4000-8000-000000000000' });
  expect(screen.getByRole('heading', { name: 'Confirma el teu compte' })).toBeTruthy();
  expect(screen.getByText('ana@poble.test')).toBeTruthy();
  expect(m.toast).not.toHaveBeenCalled();
  expect(avis.mock.calls.some(([e]) => e.type === 'sdp:auth-change')).toBe(false);
  avis.mockRestore();
});

test('amb access_token no hi ha targeta de confirmació i sí toast d’èxit', async () => {
  m.registra.mockResolvedValue({ access_token: 'jwt', user: { id: 'U' } });
  await registra();
  expect(screen.queryByRole('heading', { name: 'Confirma el teu compte' })).toBeNull();
  expect(m.toast).toHaveBeenCalledWith('Compte creat. Benvinguda al Mas.', 'success');
});

test('«Ja l’he confirmat» torna al formulari d’entrada sense recarregar, amb el correu escrit', async () => {
  m.registra.mockResolvedValue({ id: 'U' });
  await registra();
  fireEvent.click(screen.getByRole('button', { name: /Ja l’he confirmat/ }));
  expect(screen.queryByRole('heading', { name: 'Confirma el teu compte' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Entrar al compte' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Entrar', pressed: true })).toBeTruthy();
  expect(screen.getByLabelText('Correu electrònic').value).toBe('Ana@Poble.TEST');
  expect(screen.queryByLabelText('Nom i cognoms')).toBeNull();
});

/* Correcció de la revisió T1–T4 (260930) · Abans l'error arribava sense estat i la
   vista en parsejava el `message` del cos de Supabase («User already registered»).
   La vista ja no llig el format de cap proveïdor: una resposta del servidor sense
   codi (amb el seu estat, com les llança runtime.request) mostra la frase genèrica
   valenciana. Es continua comprovant que l'error es mostra i que no hi ha targeta. */
test('un error del registre es mostra i no hi ha targeta', async () => {
  m.registra.mockRejectedValue(Object.assign(new Error('Supabase 422: {"message":"User already registered"}'), { status: 422 }));
  await registra();
  expect(screen.getByRole('alert').textContent).toBe('No s’ha pogut completar l’operació. Revisa les dades i torna-ho a provar.');
  expect(screen.getByRole('alert').textContent).not.toMatch(/User already registered|Supabase|\{/);
  expect(screen.queryByRole('heading', { name: 'Confirma el teu compte' })).toBeNull();
});

test('backend que falla: ix l’alerta i el formulari torna a estar utilitzable', async () => {
  m.registra.mockRejectedValue(new Error('Error de xarxa: No es pot connectar al servidor.'));
  await registra();
  expect(screen.getByRole('alert').textContent).toContain('Error de xarxa');
  expect(screen.getByLabelText('Nom i cognoms').disabled).toBe(false);
  expect(screen.getByLabelText('Correu electrònic').disabled).toBe(false);
  expect(screen.getByLabelText('Contrasenya').disabled).toBe(false);
  expect(botoCrear().disabled).toBe(false);
  expect(botoGoogle().disabled).toBe(false);
  expect(document.querySelector('.sdp-boto__gir')).toBeNull();
  // Les dues contrasenyes es buiden: el reintent no hereta mitja parella.
  expect(screen.getByLabelText('Contrasenya').value).toBe('');
  expect(screen.getByLabelText('Confirmar contrasenya').value).toBe('');
});

test('error seguit de reintent: el segon intent arriba i l’alerta se’n va', async () => {
  m.registra
    .mockRejectedValueOnce(new Error('Error de xarxa: No es pot connectar al servidor.'))
    .mockResolvedValueOnce({ access_token: 'jwt', user: { id: 'U' } });
  await registra();
  expect(screen.getByRole('alert')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Contrasenya'), { target: { name: 'password', value: 'contrasenya-llarga' } });
  fireEvent.change(screen.getByLabelText('Confirmar contrasenya'), { target: { name: 'confirmPassword', value: 'contrasenya-llarga' } });
  await act(async () => { fireEvent.click(botoCrear()); });
  expect(m.registra).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole('alert')).toBeNull();
  expect(m.toast).toHaveBeenCalledWith('Compte creat. Benvinguda al Mas.', 'success');
  expect(botoCrear().disabled).toBe(false);
});

test('Google pendent no congela el correu; si el correu l’avorta, Google no pinta cap error', async () => {
  const google = deferred();
  const registre = deferred();
  m.google.mockReturnValue(google.promesa);
  m.registra.mockReturnValue(registre.promesa);
  render(<OnboardingSection />);
  await act(async () => { fireEvent.click(botoGoogle()); });
  // L'espera de Google viu al seu botó…
  expect(botoGoogle().disabled).toBe(true);
  expect(botoGoogle().getAttribute('aria-busy')).toBe('true');
  expect(botoGoogle().querySelector('.sdp-boto__gir')).not.toBeNull();
  // …i el formulari de correu continua viu.
  expect(screen.getByLabelText('Nom i cognoms').disabled).toBe(false);
  expect(screen.getByLabelText('Contrasenya').disabled).toBe(false);
  expect(botoCrear().disabled).toBe(false);
  expect(botoCrear().querySelector('.sdp-boto__gir')).toBeNull();

  omple();
  await act(async () => { fireEvent.click(botoCrear()); });
  expect(m.registra).toHaveBeenCalledTimes(1);
  expect(botoCrear().disabled).toBe(true);
  expect(botoGoogle().getAttribute('aria-busy')).toBeNull();
  // La capa d'autenticació avorta Google en començar el correu.
  await act(async () => { google.rebutja(Object.assign(new Error('Intent substituït'), { name: 'AbortError' })); });
  expect(screen.queryByRole('alert')).toBeNull();
  expect(botoCrear().disabled).toBe(true);
  await act(async () => { registre.resol({ access_token: 'jwt', user: { id: 'U' } }); });
  expect(botoCrear().disabled).toBe(false);
  expect(botoGoogle().disabled).toBe(false);
});

test('tornada del bfcache: l’espera de Google que no resol mai s’allibera', async () => {
  m.google.mockReturnValue(new Promise(() => {}));
  render(<OnboardingSection />);
  await act(async () => { fireEvent.click(botoGoogle()); });
  expect(botoGoogle().disabled).toBe(true);
  // Una càrrega normal (persisted=false) no toca res.
  act(() => { tornaDelBfcache(false); });
  expect(botoGoogle().disabled).toBe(true);
  act(() => { tornaDelBfcache(true); });
  expect(botoGoogle().disabled).toBe(false);
  expect(botoGoogle().getAttribute('aria-busy')).toBeNull();
  expect(botoCrear().disabled).toBe(false);
});

test('l’ull alterna type i aria-pressed sense perdre el valor, i cada camp va per separat', () => {
  render(<OnboardingSection />);
  const camp = screen.getByLabelText('Contrasenya');
  const confirma = screen.getByLabelText('Confirmar contrasenya');
  fireEvent.change(camp, { target: { name: 'password', value: 'text-de-prova' } });
  expect(camp.type).toBe('password');
  expect(ull().getAttribute('aria-pressed')).toBe('false');
  expect(ull().getAttribute('aria-controls')).toBe('reg-password');
  expect(ullConfirma().getAttribute('aria-controls')).toBe('reg-confirm-password');
  // El mousedown no roba el focus del camp.
  expect(fireEvent.mouseDown(ull())).toBe(false);

  fireEvent.click(ull());
  expect(camp.type).toBe('text');
  expect(camp.value).toBe('text-de-prova');
  expect(ull().getAttribute('aria-pressed')).toBe('true');
  expect(confirma.type).toBe('password');
  expect(ullConfirma().getAttribute('aria-pressed')).toBe('false');
  expect(camp.getAttribute('autocomplete')).toBe('new-password');
  expect(camp.getAttribute('autocapitalize')).toBe('none');
  expect(camp.getAttribute('spellcheck')).toBe('false');

  fireEvent.click(ull());
  expect(camp.type).toBe('password');
  expect(camp.value).toBe('text-de-prova');
  expect(ull().getAttribute('aria-pressed')).toBe('false');
});

test('en enviar, les dues contrasenyes tornen a ocultes i els ulls queden quiets mentre s’espera', async () => {
  /* Els tipus es lligen quan el gestor crida el backend: prova l'ordre, no només el final. */
  const tipusEnEnviar = [];
  m.registra.mockImplementation(() => {
    tipusEnEnviar.push(screen.getByLabelText('Contrasenya').type, screen.getByLabelText('Confirmar contrasenya').type);
    return new Promise(() => {});
  });
  render(<OnboardingSection />);
  omple();
  fireEvent.click(ull());
  fireEvent.click(ullConfirma());
  expect(screen.getByLabelText('Contrasenya').type).toBe('text');
  expect(screen.getByLabelText('Confirmar contrasenya').type).toBe('text');
  await act(async () => { fireEvent.click(botoCrear()); });
  expect(m.registra).toHaveBeenCalledWith('Ana@Poble.TEST', 'contrasenya-llarga', expect.anything(), { tenantId: '00000000-0000-4000-8000-000000000000' });
  expect(tipusEnEnviar).toEqual(['password', 'password']);
  expect(screen.getByLabelText('Contrasenya').type).toBe('password');
  expect(screen.getByLabelText('Confirmar contrasenya').type).toBe('password');
  expect(ull().getAttribute('aria-pressed')).toBe('false');
  expect(ull().disabled).toBe(true);
  expect(ullConfirma().disabled).toBe(true);
});

test('en mode Entrar només hi ha un ull, sobre la contrasenya actual', () => {
  render(<OnboardingSection />);
  expect(screen.getAllByRole('button', { name: /^Mostra la / })).toHaveLength(2);
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(screen.getAllByRole('button', { name: /^Mostra la / })).toHaveLength(1);
  expect(ull().getAttribute('aria-controls')).toBe('reg-password');
  expect(screen.getByLabelText('Contrasenya').getAttribute('autocomplete')).toBe('current-password');
  fireEvent.click(ull());
  expect(screen.getByLabelText('Contrasenya').type).toBe('text');
});

async function entra() {
  render(<OnboardingSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Entrar', exact: true }));
  fireEvent.change(screen.getByLabelText('Correu electrònic'), { target: { name: 'email', value: 'ana@poble.test' } });
  fireEvent.change(screen.getByLabelText('Contrasenya'), { target: { name: 'password', value: 'contrasenya-actual' } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Entrar al compte' })); });
}

test('login usa el port amb la configuració del node i confirma entrada', async () => {
  m.entra.mockResolvedValue({ access_token: 'jwt', user: { id: 'U' } });
  await entra();
  expect(m.entra).toHaveBeenCalledWith('ana@poble.test', 'contrasenya-actual', { tenantId: '00000000-0000-4000-8000-000000000000' });
  expect(m.toast).toHaveBeenCalledWith('Benvingut de nou al Mas!', 'success');
});

test('login amb error permet reintent i no anuncia èxit', async () => {
  m.entra.mockRejectedValue(new Error('Credencials incorrectes'));
  await entra();
  expect(screen.getByRole('alert').textContent).toBe('Credencials incorrectes');
  expect(screen.getByRole('button', { name: 'Entrar al compte' }).disabled).toBe(false);
  expect(m.toast).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Crear compte', exact: true }));
  expect(screen.queryByRole('alert')).toBeNull();
});

test('login pendent bloqueja doble enviament i canvi de mode', async () => {
  const pending = deferred(); m.entra.mockReturnValue(pending.promesa);
  await entra();
  fireEvent.submit(screen.getByRole('button', { name: 'Entrar al compte' }).closest('form'));
  expect(m.entra).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Crear compte', exact: true }).disabled).toBe(true);
  await act(async () => { pending.resol({ access_token: 'jwt', user: { id: 'U' } }); });
  expect(screen.getByRole('button', { name: 'Crear compte', exact: true }).disabled).toBe(false);
});

test('resultat antic de Google no anuncia entrada durant login per correu', async () => {
  const google = deferred(); const login = deferred();
  m.google.mockReturnValue(google.promesa); m.entra.mockReturnValue(login.promesa);
  render(<OnboardingSection />);
  fireEvent.click(botoGoogle());
  fireEvent.click(screen.getByRole('button', { name: 'Entrar', exact: true }));
  fireEvent.change(screen.getByLabelText('Correu electrònic'), { target: { name: 'email', value: 'ana@poble.test' } });
  fireEvent.change(screen.getByLabelText('Contrasenya'), { target: { name: 'password', value: 'contrasenya' } });
  fireEvent.click(screen.getByRole('button', { name: 'Entrar al compte' }));
  await act(async () => { google.resol({ access_token: 'anterior' }); });
  expect(m.toast).not.toHaveBeenCalled();
  await act(async () => { login.rebutja(new Error('Error de xarxa')); });
  expect(screen.getByRole('alert').textContent).toBe('Error de xarxa');
});

/* ── C5 · Amb sessió, la secció se'n va. Ordre del Mestre (261002): sempre al
   propi perfil (/el-meu-perfil), mai on es demanava; deroga T4 (260930) per a
   l'entrada. Abans estes proves fixaven la tornada al ?tornar; ara fixen que
   cap ?tornar (de l'app, de l'amfitrió, vàlid o no) canvia l'aterratge. La
   consulta de l'app continua manant per al ?mode, i l'app no toca la URL de
   l'amfitrió. */
const entraAmbSessio = (arbre) => {
  m.usuari.valor = { id: 'U' };
  render(arbre);
};

test('C5 · MEMÒRIA: ni el ?tornar de l’app ni el de la pàgina amfitriona manen; es va al perfil', () => {
  window.history.replaceState(null, '', '/pagina-amfitrio?tornar=/el-compte-de-lamfitrio');
  entraAmbSessio(<MemoryRouter rutaInicial="/registre?tornar=/mur"><OnboardingSection /></MemoryRouter>);
  expect(m.navigate).toHaveBeenCalledTimes(1);
  expect(m.navigate).toHaveBeenCalledWith('/el-meu-perfil', { replace: true });
  // L'app no ha tocat la URL de l'amfitrió.
  expect(`${window.location.pathname}${window.location.search}`).toBe('/pagina-amfitrio?tornar=/el-compte-de-lamfitrio');
});

test('C5 · MEMÒRIA sense ?tornar a l’app: la consulta de l’amfitrió no mana, es va al perfil', () => {
  window.history.replaceState(null, '', '/pagina-amfitrio?tornar=/xat');
  entraAmbSessio(<MemoryRouter rutaInicial="/registre"><OnboardingSection /></MemoryRouter>);
  expect(m.navigate).toHaveBeenCalledWith('/el-meu-perfil', { replace: true });
});

test('C5 · MEMÒRIA: un ?tornar que no és una ruta de l’app es descarta com sempre', () => {
  entraAmbSessio(<MemoryRouter rutaInicial="/registre?tornar=//fora.example/x"><OnboardingSection /></MemoryRouter>);
  expect(m.navigate).toHaveBeenCalledWith('/el-meu-perfil', { replace: true });
});

test('C5 · NAVEGADOR (socdepoble.org): el ?tornar de la barra d’adreces ja no mana; es va al perfil', () => {
  window.history.replaceState(null, '', '/registre?tornar=/mercat');
  entraAmbSessio(<BrowserRouter><OnboardingSection /></BrowserRouter>);
  expect(m.navigate).toHaveBeenCalledTimes(1);
  expect(m.navigate).toHaveBeenCalledWith('/el-meu-perfil', { replace: true });
});

test('C5 · sense router llegible: tampoc el ?tornar de la barra d’adreces; es va al perfil', () => {
  window.history.replaceState(null, '', '/registre?tornar=/mur');
  entraAmbSessio(<OnboardingSection />);
  expect(m.navigate).toHaveBeenCalledTimes(1);
  expect(m.navigate).toHaveBeenCalledWith('/el-meu-perfil', { replace: true });
});

test('login buit mostra errors accessibles i no consulta el port', async () => {
  render(<OnboardingSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Entrar', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Entrar al compte' }));
  expect(screen.getByLabelText('Correu electrònic').getAttribute('aria-invalid')).toBe('true');
  expect(screen.getByLabelText('Contrasenya').getAttribute('aria-describedby')).toBe('onboarding-login-password-error');
  expect(m.entra).not.toHaveBeenCalled();
});

/* ── T4 (ordre del Mestre, 260930) · ?mode obri el formulari en eixe mode ── */

/* Una altra porta cap a /registre amb el formulari ja muntat (el router de veres). */
function Salta({ a }) {
  const { navigate } = useRouter();
  return <button type="button" onClick={() => navigate(a)}>Salta</button>;
}

test('T4 · ?mode=entrar obri directament Entrar, en memòria i al navegador', () => {
  render(<MemoryRouter rutaInicial="/registre?mode=entrar&tornar=/mur"><OnboardingSection /></MemoryRouter>);
  expect(screen.getByRole('button', { name: 'Entrar', pressed: true })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Entrar al compte' })).toBeTruthy();
  expect(screen.queryByLabelText('Nom i cognoms')).toBeNull();
  expect(screen.getByLabelText('Contrasenya').getAttribute('autocomplete')).toBe('current-password');
  cleanup();
  window.history.replaceState(null, '', '/registre?mode=entrar');
  render(<BrowserRouter><OnboardingSection /></BrowserRouter>);
  expect(screen.getByRole('button', { name: 'Entrar', pressed: true })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Entrar al compte' })).toBeTruthy();
});

test.each(['/registre?mode=crear', '/registre', '/registre?mode=recuperar'])('T4 · %s obri Crear compte (sense mode, o amb un de desconegut, com sempre)', (ruta) => {
  render(<MemoryRouter rutaInicial={ruta}><OnboardingSection /></MemoryRouter>);
  expect(screen.getByRole('button', { name: 'Crear compte', pressed: true })).toBeTruthy();
  expect(screen.getByLabelText('Nom i cognoms')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Crear el compte' })).toBeTruthy();
});

test('T4 · un altre ?mode amb el formulari muntat el canvia sense perdre el correu escrit', () => {
  render(<MemoryRouter rutaInicial="/registre?mode=crear"><OnboardingSection /><Salta a="/registre?mode=entrar" /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText('Correu electrònic'), { target: { name: 'email', value: 'ana@poble.test' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salta' }));
  expect(screen.getByRole('button', { name: 'Entrar', pressed: true })).toBeTruthy();
  expect(screen.queryByLabelText('Nom i cognoms')).toBeNull();
  expect(screen.getByLabelText('Correu electrònic').value).toBe('ana@poble.test');
});

test('T4 · el divisor ja no promet «3 passos manuals»', () => {
  render(<OnboardingSection />);
  expect(screen.getByText('O entra amb el teu correu')).toBeTruthy();
  expect(screen.queryByText(/passos manuals/)).toBeNull();
});

/* ── T4 · Els errors d'entrada es trien pel codi i es pinten amb l'espècimen <Alerta> ── */

const CRU = 'Supabase 400: {"code":400,"error_code":"x","msg":"cru del servidor"}';
const errorAmbCodi = (code) => Object.assign(new Error(CRU), { code });

test.each([
  [CODI_ENTRADA.CREDENCIALS, 'alert', 'error', 'El correu o la contrasenya no són correctes.'],
  [CODI_ENTRADA.SERVIDOR_INABASTABLE, 'status', 'avis', 'El servidor del poble no respon ara mateix.'],
  [CODI_ENTRADA.MASSA_INTENTS, 'status', 'avis', 'Massa intents seguits.'],
  [CODI_ENTRADA.CORREU_PENDENT, 'status', 'avis', 'Encara no has confirmat el correu.'],
  [CODI_ENTRADA.CONTRASENYA_FEBLE, 'alert', 'error', 'La contrasenya és massa feble.'],
  [CODI_ENTRADA.COMPTE_EXISTENT, 'alert', 'error', 'Ja hi ha un compte amb este correu.'],
  /* Correcció de la revisió T1–T4 (260930) · El codi neutral d'una resposta sense traducció. */
  [CODI_ENTRADA.DESCONEGUT, 'alert', 'error', 'No s’ha pogut completar l’operació.'],
])('T4 · entrar amb %s: Alerta de to pel codi (%s), la frase valenciana i mai el cos cru', async (code, rol, to, frase) => {
  m.entra.mockRejectedValue(errorAmbCodi(code));
  await entra();
  const avis = screen.getByRole(rol);
  expect(avis.classList.contains('sdp-alerta')).toBe(true);
  expect(avis.classList.contains(`sdp-alerta--${to}`)).toBe(true);
  expect(avis.querySelector('.sdp-alerta__icona')).not.toBeNull();
  expect(avis.textContent).toContain(frase);
  expect(avis.textContent).not.toMatch(/Supabase|cru del servidor|\{/);
  expect(avis.querySelectorAll('[style]')).toHaveLength(0);
  // Cap botó per a tornar al mode de proves: ací no hi ha cap elecció desada.
  expect(screen.queryByRole('button', { name: 'Tornar al mode de proves' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Entrar al compte' }).disabled).toBe(false);
});

test('T4 · un servidor inabastable que arriba sense codi (estat 0) tampoc no pinta el JSON cru', async () => {
  m.registra.mockRejectedValue(Object.assign(new Error('Supabase 0: {"msg":"Error de xarxa"}'), { status: 0 }));
  await registra();
  const avis = screen.getByRole('status');
  expect(avis.classList.contains('sdp-alerta--avis')).toBe(true);
  expect(avis.textContent).toContain('El servidor del poble no respon ara mateix.');
  expect(avis.textContent).not.toMatch(/Supabase|\{/);
});

/* Correcció de la revisió T1–T4 (260930) · Abans esta prova fixava com a correcte
   que el `msg` en anglés de GoTrue arribara a /registre. Ara no hi arriba mai: ni
   el que traduïx l'adaptador (code DESCONEGUT) ni una resposta que un port no
   traduïx (només l'estat). En tots dos casos, la frase genèrica valenciana. */
test('T4 · un error de GoTrue sense traducció no pinta el seu msg en anglés, sinó la frase genèrica valenciana', async () => {
  const generica = 'No s’ha pogut completar l’operació. Revisa les dades i torna-ho a provar.';
  const cos = 'Supabase 422: {"code":422,"error_code":"signup_disabled","msg":"Signups not allowed for this instance"}';
  for (const error of [
    Object.assign(new Error(cos), { status: 422 }),
    Object.assign(new Error(generica, { cause: new Error(cos) }), { code: CODI_ENTRADA.DESCONEGUT, status: 422 })
  ]) {
    m.registra.mockReset().mockRejectedValue(error);
    await registra();
    const avis = screen.getByRole('alert');
    expect(avis.textContent).toBe(generica);
    expect(avis.textContent).not.toMatch(/Signups|not allowed|Supabase|\{/);
    cleanup();
  }
});

/* ── T4 · La tornada després d'entrar ──
   Ordre del Mestre (261002) · Ja no hi ha tornada: un ?tornar vàlid tampoc no
   canvia l'aterratge. Les proves de tornades insegures es conserven: també
   acaben al perfil, i cap ruta externa arriba mai a navigate. */

test('T4 · ?tornar vàlid amb consulta: tampoc no s’hi torna; es va al perfil', () => {
  entraAmbSessio(<MemoryRouter rutaInicial="/registre?mode=entrar&tornar=%2Fmur%3Fitem%3D3"><OnboardingSection /></MemoryRouter>);
  expect(m.navigate).toHaveBeenCalledTimes(1);
  expect(m.navigate).toHaveBeenCalledWith('/el-meu-perfil', { replace: true });
});

test.each([
  ['barra inversa', '/registre?tornar=%2F%5Cfora.example%2Fx'],
  ['torna a l’entrada', '/registre?tornar=%2Fregistre%3Fmode%3Dentrar'],
  ['relativa', '/registre?tornar=mur'],
  ['amb espais', '/registre?tornar=%2Fmur%20x'],
])('T4 · un ?tornar insegur (%s) es descarta i es va al perfil', (_nom, ruta) => {
  entraAmbSessio(<MemoryRouter rutaInicial={ruta}><OnboardingSection /></MemoryRouter>);
  expect(m.navigate).toHaveBeenCalledTimes(1);
  expect(m.navigate).toHaveBeenCalledWith('/el-meu-perfil', { replace: true });
});

/* Correcció de la revisió T1–T4 (260930) · Un /connectar compartit (Web Share
   Target) que codificat passa dels 300 caràcters. Abans s'hi tornava sencer.
   Ordre del Mestre (261002) · Ara també s'aterra al perfil: l'element
   compartit es perd després d'entrar (pendent de decisió del Mestre). */
const CONNECTAR_LLARG = `/connectar?${new URLSearchParams({
  url: 'https://www.diari.example/comarques/2026/09/30/fira-tardor-la-torre-123456.html',
  title: 'Fira de la Tardor a la Torre de les Maçanes: parades, música i productes de la terra',
  text: 'Fira de la Tardor https://www.diari.example/comarques/2026/09/30/fira-tardor-la-torre-123456.html'
})}`;

test('261002 · MEMÒRIA: una tornada de més de 300 caràcters a /connectar tampoc no mana; es va al perfil', () => {
  expect(CONNECTAR_LLARG.length).toBeGreaterThan(300);
  entraAmbSessio(<MemoryRouter rutaInicial={`/registre?mode=entrar&tornar=${encodeURIComponent(CONNECTAR_LLARG)}`}><OnboardingSection /></MemoryRouter>);
  expect(m.navigate).toHaveBeenCalledTimes(1);
  expect(m.navigate).toHaveBeenCalledWith('/el-meu-perfil', { replace: true });
});

test('261002 · NAVEGADOR: una tornada de més de 300 caràcters a /connectar tampoc no mana; es va al perfil', () => {
  window.history.replaceState(null, '', `/registre?mode=entrar&tornar=${encodeURIComponent(CONNECTAR_LLARG)}`);
  entraAmbSessio(<BrowserRouter><OnboardingSection /></BrowserRouter>);
  expect(m.navigate).toHaveBeenCalledTimes(1);
  expect(m.navigate).toHaveBeenCalledWith('/el-meu-perfil', { replace: true });
});

test('T4 · una tornada que passa del topall propi (2048) es descarta i es va al perfil', () => {
  const massa = `/connectar?text=${'a'.repeat(2100)}`;
  entraAmbSessio(<MemoryRouter rutaInicial={`/registre?tornar=${encodeURIComponent(massa)}`}><OnboardingSection /></MemoryRouter>);
  expect(m.navigate).toHaveBeenCalledWith('/el-meu-perfil', { replace: true });
});

/* ── Ordre del Mestre (261002) · Cada porta d'entrada aterra al propi perfil ──
   La sessió arriba com en l'app: l'adaptador avisa (sdp:auth-change) i
   SessionContext torna a pintar la secció amb currentUser; ací es torna a
   pintar amb l'usuari. Cada porta porta un ?tornar per a provar que no mana,
   i abans que arribe la sessió no es navega enlloc. */
const ambRuta = (ruta) => () => <MemoryRouter rutaInicial={ruta}><OnboardingSection /></MemoryRouter>;
const arribaLaSessio = (rerender, arbre) => { m.usuari.valor = { id: 'U' }; rerender(arbre()); };
const esPerfil = () => {
  expect(m.navigate).toHaveBeenCalledTimes(1);
  expect(m.navigate).toHaveBeenCalledWith(RUTA_DESPRES_D_ENTRAR, { replace: true });
};

test('261002 · el punt únic de decisió és el propi perfil, mai el Panell de Control', () => {
  expect(RUTA_DESPRES_D_ENTRAR).toBe('/el-meu-perfil');
});

test('261002 · contrasenya: després d’entrar, al perfil i no al ?tornar', async () => {
  m.entra.mockResolvedValue({ access_token: 'jwt', user: { id: 'U' } });
  const arbre = ambRuta('/registre?mode=entrar&tornar=%2Fmur');
  const { rerender } = render(arbre());
  fireEvent.change(screen.getByLabelText('Correu electrònic'), { target: { name: 'email', value: 'ana@poble.test' } });
  fireEvent.change(screen.getByLabelText('Contrasenya'), { target: { name: 'password', value: 'contrasenya-actual' } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Entrar al compte' })); });
  expect(m.entra).toHaveBeenCalledTimes(1);
  expect(m.navigate).not.toHaveBeenCalled();
  arribaLaSessio(rerender, arbre);
  esPerfil();
});

test('261002 · registre amb sessió immediata: al perfil i no al ?tornar', async () => {
  m.registra.mockResolvedValue({ access_token: 'jwt', user: { id: 'U' } });
  const arbre = ambRuta('/registre?mode=crear&tornar=%2Fmercat');
  const { rerender } = render(arbre());
  omple();
  await act(async () => { fireEvent.click(botoCrear()); });
  expect(m.registra).toHaveBeenCalledTimes(1);
  expect(m.navigate).not.toHaveBeenCalled();
  arribaLaSessio(rerender, arbre);
  esPerfil();
});

test('261002 · registre que demana confirmar el correu: sense sessió no navega', async () => {
  m.registra.mockResolvedValue({ id: 'U' });
  render(ambRuta('/registre?mode=crear&tornar=%2Fmercat')());
  omple();
  await act(async () => { fireEvent.click(botoCrear()); });
  expect(screen.getByRole('heading', { name: 'Confirma el teu compte' })).toBeTruthy();
  expect(m.navigate).not.toHaveBeenCalled();
});

test('261002 · Google per finestra emergent: al perfil i no al ?tornar', async () => {
  m.google.mockResolvedValue({ access_token: 'jwt', user: { id: 'U' } });
  const arbre = ambRuta('/registre?mode=entrar&tornar=%2Fxat');
  const { rerender } = render(arbre());
  await act(async () => { fireEvent.click(botoGoogle()); });
  expect(m.google).toHaveBeenCalledTimes(1);
  expect(m.navigate).not.toHaveBeenCalled();
  arribaLaSessio(rerender, arbre);
  esPerfil();
});

/* GoTrue torna a la pàgina des d'on es va prémer el botó (P1, 261003:
   data/oauthRelay.js, urlDeTornada), que al lloc propi és /registre; el codi
   arriba per la consulta, o pel fragment #sdp_code de les entrades que va
   començar el relé retirat. App.jsx bescanvia el codi (recullTornadaOAuth) i la
   sessió arriba amb la secció ja muntada. El cas que no torna a /registre el
   prova App.test.jsx. */
test('261002 · Google per redirecció: la tornada a /registre aterra al perfil quan arriba la sessió', () => {
  window.history.replaceState(null, '', '/registre#sdp_code=codi-sintetic');
  const arbre = () => <BrowserRouter><OnboardingSection /></BrowserRouter>;
  const { rerender } = render(arbre());
  expect(m.navigate).not.toHaveBeenCalled();
  arribaLaSessio(rerender, arbre);
  esPerfil();
});

test('261002 · RequireAuth: la seua entrada (/registre?mode=entrar&tornar=<pàgina protegida>) també aterra al perfil', () => {
  const entrada = rutaDEntrada({ mode: 'entrar', tornar: '/admin' });
  expect(entrada).toBe('/registre?mode=entrar&tornar=%2Fadmin');
  const arbre = ambRuta(entrada);
  const { rerender } = render(arbre());
  expect(m.navigate).not.toHaveBeenCalled();
  arribaLaSessio(rerender, arbre);
  esPerfil();
});
