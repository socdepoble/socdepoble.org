import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn(), registra: vi.fn(), entra: vi.fn(), google: vi.fn() }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => m.navigate }));
vi.mock('../../components/universal/UniversalPage', () => ({ UniversalPage: ({ children }) => <main>{children}</main> }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../app/contexts/SessionContext', () => ({
  useSession: () => ({ currentUser: null, registerWithPassword: m.registra, loginWithPassword: m.entra, loginWithGoogle: m.google }),
}));
vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => ({ externalConfig: { tenantId: 'T' } }) }));
/* La targeta real porta accions i telemetria que ací no es proven. */
vi.mock('../../components/PedraSeca/index.js', async (importOriginal) => ({
  ...(await importOriginal()),
  UniversalCard: ({ title, subtitle, body }) => <section><h3>{title}</h3>{subtitle ? <p>{subtitle}</p> : null}{body}</section>,
}));
import OnboardingSection from './OnboardingSection.jsx';

beforeEach(() => { for (const f of Object.values(m)) f.mockReset(); });
afterEach(cleanup);

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
    expect.objectContaining({ full_name: 'Ana Puig', accepta_rgpd: true, tenant_id: 'T' }), { tenantId: 'T' });
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

test('un error del registre es mostra i no hi ha targeta', async () => {
  m.registra.mockRejectedValue(new Error('Supabase 422: {"message":"User already registered"}'));
  await registra();
  expect(screen.getByRole('alert').textContent).toBe('User already registered');
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
  expect(m.registra).toHaveBeenCalledWith('Ana@Poble.TEST', 'contrasenya-llarga', expect.anything(), { tenantId: 'T' });
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
  expect(m.entra).toHaveBeenCalledWith('ana@poble.test', 'contrasenya-actual', { tenantId: 'T' });
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

test('login buit mostra errors accessibles i no consulta el port', async () => {
  render(<OnboardingSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Entrar', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Entrar al compte' }));
  expect(screen.getByLabelText('Correu electrònic').getAttribute('aria-invalid')).toBe('true');
  expect(screen.getByLabelText('Contrasenya').getAttribute('aria-describedby')).toBe('onboarding-login-password-error');
  expect(m.entra).not.toHaveBeenCalled();
});
