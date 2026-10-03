/* R · Onada 3 (261003) · Recuperació de contrasenya a /registre.
   L'enllaç «Has oblidat la contrasenya?» només amb la capacitat opcional
   'recuperacioContrasenya'; la vista de recuperació és un mode intern del
   formulari. R2 (decisió del Mestre, 261003) · L'enllaç del correu espera
   «Desa» SENSE sessió (`enllacDeRecuperacio` de SessionContext,
   data/recuperacioPendent.js): «Definix la contrasenya nova» genèrica, i
   «Torna a obrir l'enllaç del correu» si la pàgina s'ha recarregat.
   Compatibilitat: una sessió marcada (`recuperacioPendent`) continua amb el
   compte i «Eixir del compte». El port es simula al context de sessió, com en
   OnboardingSection.test.jsx; l'estat de l'enllaç, amb una botiga reactiva. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => {
  const escoltes = new Set();
  const enllac = { valor: null };
  return {
    navigate: vi.fn(), toast: vi.fn(), demana: vi.fn(), definix: vi.fn(), entra: vi.fn(), eix: vi.fn(), oblidaEnllac: vi.fn(),
    usuari: { valor: null }, capacitat: { valor: true }, recuperacio: { valor: false }, enllac, escoltes,
    posaEnllac(valor) { enllac.valor = valor; for (const avisa of escoltes) avisa(); },
    config: Object.freeze({ tenantId: '00000000-0000-4000-8000-000000000000' })
  };
});
vi.mock('../../app/contexts/RouterContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => m.navigate,
}));
vi.mock('../../components/universal/UniversalPage', () => ({ UniversalPage: ({ children }) => <main>{children}</main> }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../app/contexts/SessionContext', async () => {
  const { useSyncExternalStore } = await import('react');
  const subscriu = (avisa) => { m.escoltes.add(avisa); return () => { m.escoltes.delete(avisa); }; };
  return {
    useSession: () => ({
      currentUser: m.usuari.valor,
      registerWithPassword: vi.fn(), loginWithPassword: m.entra, loginWithGoogle: vi.fn(),
      teCapacitat: (nom) => nom === 'recuperacioContrasenya' && m.capacitat.valor,
      demanaRecuperacioContrasenya: m.demana,
      definixContrasenyaNova: m.definix,
      recuperacioPendent: m.recuperacio.valor,
      enllacDeRecuperacio: useSyncExternalStore(subscriu, () => m.enllac.valor),
      oblidaEnllacDeRecuperacio: m.oblidaEnllac,
      logout: m.eix
    }),
  };
});
vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => ({ externalConfig: m.config }) }));
vi.mock('../../components/PedraSeca/index.js', async (importOriginal) => ({
  ...(await importOriginal()),
  UniversalCard: ({ title, subtitle, body }) => <section><h3>{title}</h3>{subtitle ? <p>{subtitle}</p> : null}{body}</section>,
}));
import { BrowserRouter, MemoryRouter } from '../../app/contexts/RouterContext';
import OnboardingSection from './OnboardingSection.jsx';
import { CODI_ENTRADA } from '../../data/errorsBackend.js';
import { ESPERA_REENVIAMENT_MS, MISSATGE_RECUPERACIO_ENVIADA } from './RecuperacioSteps.jsx';

const CONFIG = m.config;
const ENLLAC = 'Has oblidat la contrasenya?';
const TITOL_NOVA = 'Definix la contrasenya nova';

function deferred() {
  let resol;
  let rebutja;
  const promesa = new Promise((res, rej) => { resol = res; rebutja = rej; });
  return { promesa, resol, rebutja };
}

beforeEach(() => {
  for (const f of [m.navigate, m.toast, m.demana, m.definix, m.entra, m.eix, m.oblidaEnllac]) f.mockReset();
  m.oblidaEnllac.mockImplementation(() => m.posaEnllac(null));
  m.usuari.valor = null;
  m.capacitat.valor = true;
  m.recuperacio.valor = false;
  m.enllac.valor = null;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.history.replaceState(null, '', '/');
});

const entrar = () => render(<MemoryRouter rutaInicial="/registre?mode=entrar"><OnboardingSection /></MemoryRouter>);
const botoEnllac = () => screen.queryByRole('button', { name: ENLLAC });
const obriRecuperacio = (correu = '') => {
  entrar();
  if (correu) fireEvent.change(screen.getByLabelText('Correu electrònic'), { target: { name: 'email', value: correu } });
  fireEvent.click(botoEnllac());
};
const botoEnvia = () => screen.getByRole('button', { name: /Envia l’enllaç|Torna a enviar l’enllaç|Treballant/ });

/* ── L'enllaç ── */

test('R · amb la capacitat, Entrar guanya «Has oblidat la contrasenya?»; Crear compte no', () => {
  entrar();
  const boto = botoEnllac();
  expect(boto).not.toBeNull();
  expect(boto.classList.contains('sdp-boto')).toBe(true);
  expect(boto.classList.contains('sdp-boto--fantasma')).toBe(true);
  expect(boto.getAttribute('type')).toBe('button');
  expect(document.querySelectorAll('[style]')).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: 'Crear compte', exact: true }));
  expect(botoEnllac()).toBeNull();
});

test('R · sense la capacitat (un backend com Sollutia), cap enllaç: la pantalla d’accés no canvia', () => {
  m.capacitat.valor = false;
  entrar();
  expect(botoEnllac()).toBeNull();
  expect(screen.getByRole('button', { name: 'Entrar al compte' })).toBeTruthy();
});

test('R · l’enllaç obri la vista de recuperació amb el correu ja escrit, i «Torna a entrar» el conserva', () => {
  obriRecuperacio('ana@poble.test');
  expect(screen.getByRole('heading', { name: 'Recupera la contrasenya' })).toBeTruthy();
  expect(screen.getByLabelText('Correu electrònic').value).toBe('ana@poble.test');
  expect(screen.queryByLabelText('Contrasenya')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Torna a entrar' }));
  expect(screen.getByRole('button', { name: 'Entrar al compte' })).toBeTruthy();
  expect(screen.getByLabelText('Correu electrònic').value).toBe('ana@poble.test');
  expect(m.demana).not.toHaveBeenCalled();
});

/* Correcció de la revisió · el botó que obri o tanca la vista desapareix: el
   focus no pot caure a <body>. */
test('R · el focus va al correu en obrir la vista de recuperació i torna al correu en tornar a «Entrar»', () => {
  obriRecuperacio('ana@poble.test');
  expect(document.activeElement).toBe(screen.getByLabelText('Correu electrònic'));
  expect(document.activeElement.id).toBe('rec-email');
  fireEvent.click(screen.getByRole('button', { name: 'Torna a entrar' }));
  expect(document.activeElement.id).toBe('reg-email');
});

/* ── Demanar el correu ── */

test('R · envia: el port rep el correu i la configuració; desactivat mentre s’envia; missatge genèric; espera abans de reenviar', async () => {
  vi.useFakeTimers();
  const enviament = deferred();
  m.demana.mockReturnValue(enviament.promesa);
  obriRecuperacio(' ana@poble.test ');
  await act(async () => { fireEvent.click(botoEnvia()); });
  expect(m.demana).toHaveBeenCalledWith('ana@poble.test', CONFIG);
  expect(botoEnvia().disabled).toBe(true);
  expect(botoEnvia().getAttribute('aria-busy')).toBe('true');
  // Un segon enviament mentre s'espera no crida res.
  fireEvent.submit(botoEnvia().closest('form'));
  expect(m.demana).toHaveBeenCalledTimes(1);

  await act(async () => { enviament.resol({ enviat: true }); });
  const avis = screen.getByRole('status');
  expect(avis.textContent).toBe(MISSATGE_RECUPERACIO_ENVIADA);
  expect(avis.classList.contains('sdp-alerta--exit')).toBe(true);
  expect(botoEnvia().textContent).toBe('Torna a enviar l’enllaç');
  expect(botoEnvia().disabled).toBe(true);
  expect(screen.getByText(/d’ací a 60 s/)).toBeTruthy();
  fireEvent.submit(botoEnvia().closest('form'));
  expect(m.demana).toHaveBeenCalledTimes(1);

  for (let s = 0; s < ESPERA_REENVIAMENT_MS / 1000; s += 1) {
    act(() => { vi.advanceTimersByTime(1000); });
  }
  expect(botoEnvia().disabled).toBe(false);
  expect(screen.queryByText(/d’ací a/)).toBeNull();
  m.demana.mockResolvedValue({ enviat: true });
  await act(async () => { fireEvent.click(botoEnvia()); });
  expect(m.demana).toHaveBeenCalledTimes(2);
});

/* Correcció de la revisió · l'espera vivia a la vista i tornava a zero en
   desmuntar-la: «Torna a entrar» i tornar a obrir permetia reenviar de seguida. */
test('R · l’espera sobreviu a «Torna a entrar» i a tornar a obrir la vista; s’acaba quan toca', async () => {
  vi.useFakeTimers();
  m.demana.mockResolvedValue({ enviat: true });
  obriRecuperacio('ana@poble.test');
  await act(async () => { fireEvent.click(botoEnvia()); });
  expect(m.demana).toHaveBeenCalledTimes(1);
  act(() => { vi.advanceTimersByTime(10000); });

  fireEvent.click(screen.getByRole('button', { name: 'Torna a entrar' }));
  fireEvent.click(botoEnllac());
  expect(screen.getByRole('heading', { name: 'Recupera la contrasenya' })).toBeTruthy();
  expect(botoEnvia().disabled).toBe(true);
  expect(botoEnvia().textContent).toBe('Torna a enviar l’enllaç');
  expect(screen.getByText(/d’ací a 50 s/)).toBeTruthy();
  expect(screen.getByRole('status').textContent).toBe(MISSATGE_RECUPERACIO_ENVIADA);
  fireEvent.submit(botoEnvia().closest('form'));
  expect(m.demana).toHaveBeenCalledTimes(1);

  for (let s = 0; s < 50; s += 1) {
    act(() => { vi.advanceTimersByTime(1000); });
  }
  expect(botoEnvia().disabled).toBe(false);
  await act(async () => { fireEvent.click(botoEnvia()); });
  expect(m.demana).toHaveBeenCalledTimes(2);
});

test('R · el missatge és el mateix tant si el compte existix com si no, i no repetix el correu', async () => {
  const textos = [];
  for (const correu of ['existix@poble.test', 'no-existix@poble.test']) {
    m.demana.mockReset().mockResolvedValue({ enviat: true });
    obriRecuperacio(correu);
    await act(async () => { fireEvent.click(botoEnvia()); });
    const text = screen.getByRole('status').textContent;
    expect(text).not.toContain(correu);
    textos.push(text);
    cleanup();
  }
  expect(textos[0]).toBe(textos[1]);
  expect(textos[0]).toBe(MISSATGE_RECUPERACIO_ENVIADA);
});

test.each([
  [CODI_ENTRADA.MASSA_INTENTS, 'avis', 'Massa intents seguits.', true],
  [CODI_ENTRADA.SERVIDOR_INABASTABLE, 'avis', 'El servidor del poble no respon ara mateix.', false],
])('R · un error %s es diu clar amb l’Alerta de to %s i mai el cos cru', async (code, to, frase, ambEspera) => {
  m.demana.mockRejectedValue(Object.assign(new Error('Supabase 429: {"msg":"cru del servidor"}'), { code }));
  obriRecuperacio('ana@poble.test');
  await act(async () => { fireEvent.click(botoEnvia()); });
  const avis = screen.getByRole('status');
  expect(avis.classList.contains(`sdp-alerta--${to}`)).toBe(true);
  expect(avis.textContent).toContain(frase);
  expect(avis.textContent).not.toMatch(/Supabase|cru del servidor|\{/);
  expect(screen.queryByText(MISSATGE_RECUPERACIO_ENVIADA)).toBeNull();
  expect(botoEnvia().disabled).toBe(ambEspera);
});

test('R · un correu sense forma de correu no crida el port i ho diu al camp', async () => {
  obriRecuperacio('no-es-un-correu');
  await act(async () => { fireEvent.click(botoEnvia()); });
  expect(m.demana).not.toHaveBeenCalled();
  expect(screen.getByText('Escriu un correu electrònic vàlid.')).toBeTruthy();
  expect(screen.getByLabelText('Correu electrònic').getAttribute('aria-invalid')).toBe('true');
});

/* ── R2 · L'enllaç espera «Desa»: pantalla genèrica, sense sessió ── */

const NOVA = 'contrasenya-nova-llarga';
const TITOL_PERDUT = 'Torna a obrir l’enllaç del correu';
const ambEnllac = (estat = 'pendent', usuari = null) => {
  m.usuari.valor = usuari;
  m.enllac.valor = estat;
  window.history.replaceState(null, '', '/registre?mode=entrar');
  return render(<BrowserRouter><OnboardingSection /></BrowserRouter>);
};
const omplNova = (password, confirmPassword = password) => {
  fireEvent.change(screen.getByLabelText('Contrasenya nova'), { target: { name: 'password', value: password } });
  fireEvent.change(screen.getByLabelText('Confirmar contrasenya nova'), { target: { name: 'confirmPassword', value: confirmPassword } });
};
const botoDesa = () => screen.getByRole('button', { name: /Desa la contrasenya nova|Treballant/ });

test('R2 · enllaç pendent: «Definix la contrasenya nova» genèrica, sense sessió ni compte, i cap salt ni cap crida', () => {
  ambEnllac();
  expect(screen.getByRole('heading', { name: TITOL_NOVA })).toBeTruthy();
  expect(screen.queryByText(/Compte:/)).toBeNull();
  expect(screen.queryByRole('button', { name: 'Eixir del compte' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Torna a entrar' }).classList.contains('sdp-boto--fantasma')).toBe(true);
  expect(screen.queryByRole('button', { name: 'Entrar amb Google' })).toBeNull();
  expect(document.querySelectorAll('[style]')).toHaveLength(0);
  expect(m.navigate).not.toHaveBeenCalled();
  expect(m.definix).not.toHaveBeenCalled();
});

test('R2 · enllaç pendent amb una sessió d’abans: la pantalla genèrica passa davant, no diu cap compte i no salta al perfil', () => {
  ambEnllac('pendent', { id: 'A', email: 'pep@poble.test' });
  expect(screen.getByRole('heading', { name: TITOL_NOVA })).toBeTruthy();
  expect(screen.queryByText('pep@poble.test')).toBeNull();
  expect(m.navigate).not.toHaveBeenCalled();
});

test('R2 · «Desa»: una sola crida al port; desactivat i girant mentre treballa, cap doble enviament; toast i perfil', async () => {
  const desar = deferred();
  m.definix.mockReturnValue(desar.promesa);
  ambEnllac();
  omplNova(NOVA);
  await act(async () => { fireEvent.click(botoDesa()); });
  expect(m.definix).toHaveBeenCalledWith(NOVA, CONFIG);
  expect(botoDesa().disabled).toBe(true);
  expect(botoDesa().getAttribute('aria-busy')).toBe('true');
  expect(screen.getByRole('button', { name: 'Torna a entrar' }).disabled).toBe(true);
  fireEvent.submit(botoDesa().closest('form'));
  fireEvent.click(botoDesa());
  expect(m.definix).toHaveBeenCalledTimes(1);
  await act(async () => { desar.resol(true); });
  expect(m.toast).toHaveBeenCalledWith('Contrasenya nova desada. Benvingut de nou al Mas!', 'success');
  expect(m.navigate).toHaveBeenCalledWith('/el-meu-perfil', { replace: true });
});

test('R2 · validació abans de cap crida: mínim 10 caràcters i les dues iguals', async () => {
  ambEnllac();
  omplNova(NOVA, 'una-altra-diferent');
  await act(async () => { fireEvent.click(botoDesa()); });
  expect(screen.getByText('Les contrasenyes no coincidixen')).toBeTruthy();
  expect(m.definix).not.toHaveBeenCalled();
});

test('R2 · enllaç caducat o ja usat: la frase clara, «Desa» desactivat i «Demana un enllaç nou» obri «Recupera la contrasenya»', async () => {
  m.definix.mockRejectedValue(Object.assign(new Error('Supabase 403: {"msg":"Token has expired or is invalid"}'), { code: CODI_ENTRADA.ENLLAC_CADUCAT }));
  ambEnllac();
  omplNova(NOVA);
  await act(async () => { fireEvent.click(botoDesa()); });
  const avis = screen.getByRole('status');
  expect(avis.classList.contains('sdp-alerta--avis')).toBe(true);
  expect(avis.textContent).toContain('L’enllaç per a restablir la contrasenya ja no val: ha caducat o ja s’ha fet servir.');
  expect(avis.textContent).not.toMatch(/Supabase|Token has expired/);
  expect(botoDesa().disabled).toBe(true);
  expect(m.navigate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Demana un enllaç nou' }));
  expect(m.oblidaEnllac).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('heading', { name: 'Recupera la contrasenya' })).toBeTruthy();
  expect(document.activeElement.id).toBe('rec-email');
  expect(m.definix).toHaveBeenCalledTimes(1);
});

/* Correcció de la revisió de R2 · La sessió d'esta pestanya canvia mentre es
   verifica: l'adaptador guarda la sessió privada i rebutja una vegada amb un
   error SENSE codi (el text literal de supabase/auth.js, TORNA_A_DESAR). La
   pantalla el diu tal qual, deixa «Desa» actiu, buida els camps i el segon
   intent entra al perfil. */
const TORNA_A_DESAR = 'La sessió d’este navegador ha canviat mentre es desava. Torna a escriure la contrasenya nova i prem «Desa» una altra vegada: l’enllaç encara val.';
test('R2 · la sessió canvia mentre es desa: l’avís diu que l’enllaç encara val, «Desa» continua actiu i el segon intent entra', async () => {
  m.definix.mockRejectedValueOnce(new Error(TORNA_A_DESAR)).mockResolvedValueOnce(true);
  ambEnllac();
  omplNova(NOVA);
  await act(async () => { fireEvent.click(botoDesa()); });
  const avis = screen.getByRole('alert');
  expect(avis.textContent).toBe(TORNA_A_DESAR);
  expect(screen.queryByRole('button', { name: 'Demana un enllaç nou' })).toBeNull();
  expect(botoDesa().disabled).toBe(false);
  expect(screen.getByLabelText('Contrasenya nova').value).toBe('');
  expect(screen.getByLabelText('Confirmar contrasenya nova').value).toBe('');
  expect(screen.getByRole('heading', { name: TITOL_NOVA })).toBeTruthy();
  expect(m.navigate).not.toHaveBeenCalled();

  omplNova('una-altra-de-nova');
  await act(async () => { fireEvent.click(botoDesa()); });
  expect(m.definix).toHaveBeenCalledTimes(2);
  expect(m.definix).toHaveBeenLastCalledWith('una-altra-de-nova', CONFIG);
  expect(m.toast).toHaveBeenCalledWith('Contrasenya nova desada. Benvingut de nou al Mas!', 'success');
  expect(m.navigate).toHaveBeenCalledWith('/el-meu-perfil', { replace: true });
});

test('R2 · «Torna a entrar» oblida l’enllaç i torna al formulari d’entrada', () => {
  ambEnllac();
  fireEvent.click(screen.getByRole('button', { name: 'Torna a entrar' }));
  expect(m.oblidaEnllac).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('heading', { name: TITOL_NOVA })).toBeNull();
  expect(screen.getByRole('button', { name: 'Entrar al compte' })).toBeTruthy();
  expect(m.definix).not.toHaveBeenCalled();
});

test('R2 · recàrrega sense token: explica que cal tornar a obrir l’enllaç del correu, sense formulari ni crida', () => {
  ambEnllac('perdut');
  expect(screen.getByRole('heading', { name: TITOL_PERDUT })).toBeTruthy();
  expect(screen.getByText(/Torna a obrir l’enllaç del correu que t’hem enviat/)).toBeTruthy();
  expect(screen.queryByLabelText('Contrasenya nova')).toBeNull();
  expect(document.querySelectorAll('[style]')).toHaveLength(0);
  expect(m.navigate).not.toHaveBeenCalled();
  expect(m.definix).not.toHaveBeenCalled();
});

test.each([
  ['Demana un enllaç nou', 'Recupera la contrasenya'],
  ['Torna a entrar', 'Accés o nou registre']
])('R2 · recàrrega sense token: «%s» oblida l’enllaç i obri «%s»', (boto, titol) => {
  ambEnllac('perdut');
  fireEvent.click(screen.getByRole('button', { name: boto }));
  expect(m.oblidaEnllac).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('heading', { name: TITOL_PERDUT })).toBeNull();
  expect(screen.getByRole('heading', { name: titol })).toBeTruthy();
});

test('R2 · sense la capacitat, l’enllaç no obri res: el formulari de sempre', () => {
  m.capacitat.valor = false;
  ambEnllac();
  expect(screen.queryByRole('heading', { name: TITOL_NOVA })).toBeNull();
  expect(screen.getByRole('button', { name: 'Entrar al compte' })).toBeTruthy();
});

/* ── R2 · El text del registre (permís del Mestre, 261003) ── */

test('R2 · el registre diu «Les contrasenyes no coincidixen»', async () => {
  render(<MemoryRouter rutaInicial="/registre?mode=crear"><OnboardingSection /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText('Nom i cognoms'), { target: { name: 'name', value: 'Ana Puig' } });
  fireEvent.change(screen.getByLabelText('Correu electrònic'), { target: { name: 'email', value: 'ana@poble.test' } });
  fireEvent.change(screen.getByLabelText('Contrasenya'), { target: { name: 'password', value: NOVA } });
  fireEvent.change(screen.getByLabelText('Confirmar contrasenya'), { target: { name: 'confirmPassword', value: 'una-altra-diferent' } });
  fireEvent.click(screen.getByRole('checkbox'));
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Crear el compte' })); });
  expect(screen.getByText('Les contrasenyes no coincidixen')).toBeTruthy();
  expect(screen.queryByText(/coincideixen/)).toBeNull();
});

/* ── Compatibilitat: una sessió que encara ha de triar la contrasenya nova ── */

const ambRecuperacio = () => {
  m.usuari.valor = { id: 'U', email: 'ana@poble.test' };
  m.recuperacio.valor = true;
  window.history.replaceState(null, '', '/registre?mode=entrar');
  return render(<BrowserRouter><OnboardingSection /></BrowserRouter>);
};

test('R · NAVEGADOR: amb la marca de la sessió, «Definix la contrasenya nova» i no se salta al perfil', () => {
  ambRecuperacio();
  expect(screen.getByRole('heading', { name: TITOL_NOVA })).toBeTruthy();
  expect(screen.getByText('ana@poble.test')).toBeTruthy();
  expect(screen.getByLabelText('Contrasenya nova').getAttribute('autocomplete')).toBe('new-password');
  expect(screen.getByRole('button', { name: 'Mostra la contrasenya' }).getAttribute('aria-controls')).toBe('nova-password');
  expect(screen.getByRole('button', { name: 'Mostra la confirmació de la contrasenya' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Entrar amb Google' })).toBeNull();
  expect(document.querySelectorAll('[style]')).toHaveLength(0);
  expect(m.navigate).not.toHaveBeenCalled();
});

/* Correcció de la revisió · El router en memòria (la incrustació a WordPress)
   perd el seu estat en recarregar. La marca no hi viu: una càrrega nova de
   /registre sense cap estat de navegació torna a la pantalla nova. */
test('R · MEMÒRIA: després de recarregar (router nou, sense estat), la pantalla nova continua i no se salta al perfil', () => {
  m.usuari.valor = { id: 'U', email: 'ana@poble.test' };
  m.recuperacio.valor = true;
  render(<MemoryRouter rutaInicial="/registre?mode=entrar"><OnboardingSection /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: TITOL_NOVA })).toBeTruthy();
  expect(m.navigate).not.toHaveBeenCalled();
});

test('R · MEMÒRIA: amb sessió i sense la marca, al perfil com sempre', () => {
  m.usuari.valor = { id: 'U', email: 'ana@poble.test' };
  render(<MemoryRouter rutaInicial="/registre?mode=entrar"><OnboardingSection /></MemoryRouter>);
  expect(screen.queryByRole('heading', { name: TITOL_NOVA })).toBeNull();
  expect(m.navigate).toHaveBeenCalledWith('/el-meu-perfil', { replace: true });
});

test('R · validació: mateixa longitud que el registre i les dues iguals, sense cridar el port', async () => {
  ambRecuperacio();
  omplNova('curta');
  await act(async () => { fireEvent.click(botoDesa()); });
  expect(screen.getByText('Utilitza almenys 10 caràcters.')).toBeTruthy();
  omplNova('contrasenya-nova-llarga', 'una-altra-diferent');
  await act(async () => { fireEvent.click(botoDesa()); });
  expect(screen.getByText('Les contrasenyes no coincidixen')).toBeTruthy();
  expect(m.definix).not.toHaveBeenCalled();
});

test('R · desar: el port rep la contrasenya nova i la configuració; toast d’èxit i entrada normal al perfil', async () => {
  m.definix.mockResolvedValue(true);
  ambRecuperacio();
  omplNova('contrasenya-nova-llarga');
  await act(async () => { fireEvent.click(botoDesa()); });
  expect(m.definix).toHaveBeenCalledWith('contrasenya-nova-llarga', CONFIG);
  expect(m.toast).toHaveBeenCalledWith('Contrasenya nova desada. Benvingut de nou al Mas!', 'success');
  expect(m.navigate).toHaveBeenCalledWith('/el-meu-perfil', { replace: true });
});

test('R · desar rebutjat (la mateixa d’abans): Alerta amb la frase, camps buits i cap navegació', async () => {
  m.definix.mockRejectedValue(Object.assign(new Error('Supabase 422: {"msg":"New password should be different"}'), { code: CODI_ENTRADA.MATEIXA_CONTRASENYA }));
  ambRecuperacio();
  omplNova('contrasenya-nova-llarga');
  await act(async () => { fireEvent.click(botoDesa()); });
  const avis = screen.getByRole('alert');
  expect(avis.textContent).toBe('La contrasenya nova ha de ser diferent de l’anterior.');
  expect(screen.getByLabelText('Contrasenya nova').value).toBe('');
  expect(screen.getByLabelText('Confirmar contrasenya nova').value).toBe('');
  expect(m.navigate).not.toHaveBeenCalled();
  expect(m.toast).not.toHaveBeenCalled();
});

/* Correcció de la revisió · Mentre la contrasenya nova és pendent, la
   interfície no deixa anar enlloc més: l'única altra eixida és eixir del
   compte (qui ha obert un enllaç que no és seu no s'hi queda tancat). */
test('R · «Eixir del compte» tanca la sessió pel context, sense desar res', async () => {
  m.eix.mockResolvedValue(undefined);
  ambRecuperacio();
  const eixir = screen.getByRole('button', { name: 'Eixir del compte' });
  expect(eixir.classList.contains('sdp-boto--fantasma')).toBe(true);
  await act(async () => { fireEvent.click(eixir); });
  expect(m.eix).toHaveBeenCalledTimes(1);
  expect(m.definix).not.toHaveBeenCalled();
});

test('R · si eixir falla, ho diu clar i la pantalla es queda', async () => {
  m.eix.mockRejectedValue(Object.assign(new TypeError('Failed to fetch'), { status: 0 }));
  ambRecuperacio();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Eixir del compte' })); });
  expect(screen.getByRole('status').textContent).toContain('El servidor del poble no respon ara mateix.');
  expect(screen.getByRole('heading', { name: TITOL_NOVA })).toBeTruthy();
});

test('R · sense la capacitat, la marca no obri res: al perfil com sempre', () => {
  m.capacitat.valor = false;
  ambRecuperacio();
  expect(screen.queryByRole('heading', { name: TITOL_NOVA })).toBeNull();
  expect(m.navigate).toHaveBeenCalledWith('/el-meu-perfil', { replace: true });
});

test('R · sense sessió, la marca tampoc obri la pantalla nova', () => {
  m.recuperacio.valor = true;
  window.history.replaceState(null, '', '/registre?mode=entrar');
  render(<BrowserRouter><OnboardingSection /></BrowserRouter>);
  expect(screen.queryByRole('heading', { name: TITOL_NOVA })).toBeNull();
  expect(screen.getByRole('button', { name: 'Entrar al compte' })).toBeTruthy();
});
