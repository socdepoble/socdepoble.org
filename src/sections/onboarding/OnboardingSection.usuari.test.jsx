/* P1-68 (pla 261028_1526, §3.8.2.3) · /registre proposa l'@usuari, que
   segueix el nom fins que la persona l'edita, i el poble preseleccionat (La
   Torre de les Maçanes) del catàleg. Només un identificador editat i el poble
   triat arriben a les metadades de l'alta (username, town_name). Sense
   catàleg, cap selector ni cap town_name. Noms sintètics. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn(), registra: vi.fn(), towns: [] }));
vi.mock('../../app/contexts/RouterContext', async (importOriginal) => ({ ...(await importOriginal()), useNavigate: () => m.navigate }));
vi.mock('../../components/universal/UniversalPage', () => ({ UniversalPage: ({ children }) => <main>{children}</main> }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../app/contexts/SessionContext', () => ({
  useSession: () => ({ currentUser: null, registerWithPassword: m.registra, loginWithPassword: vi.fn(), loginWithGoogle: vi.fn() }),
}));
vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => ({ externalConfig: { tenantId: '00000000-0000-4000-8000-000000000000' } }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ towns: m.towns }) }));
vi.mock('../../components/PedraSeca/index.js', async (importOriginal) => ({
  ...(await importOriginal()),
  UniversalCard: ({ title, subtitle, body }) => <section><h3>{title}</h3>{subtitle ? <p>{subtitle}</p> : null}{body}</section>,
}));
import OnboardingSection from './OnboardingSection.jsx';
import { MISSATGE_USERNAME_RESERVAT } from './onboardingModel.js';

const CATALEG = [{ title: 'Penàguila' }, { title: 'La Torre de les Maçanes' }, { title: 'Bel·lús' }];
beforeEach(() => {
  m.registra.mockReset(); m.navigate.mockReset(); m.toast.mockReset();
  m.registra.mockResolvedValue({ id: 'U' });
  m.towns = CATALEG;
});
afterEach(cleanup);

const canvia = (etiqueta, name, value) => fireEvent.change(screen.getByLabelText(etiqueta), { target: { name, value } });
const usuari = () => screen.getByLabelText('El teu identificador');
function omple(nom = 'Anna Pérez Soler') {
  canvia('Nom i cognoms', 'name', nom);
  canvia('Correu electrònic', 'email', 'anna@poble.test');
  canvia('Contrasenya', 'password', 'contrasenya-llarga');
  canvia('Confirmar contrasenya', 'confirmPassword', 'contrasenya-llarga');
  fireEvent.click(screen.getByRole('checkbox'));
}
const crea = () => act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Crear el compte' })); });
const metadades = () => m.registra.mock.calls.at(-1)[2];

test('la proposta segueix el nom; sense editar-la no viatja, i el poble preseleccionat sí', async () => {
  render(<OnboardingSection />);
  expect(usuari().value).toBe('');
  omple();
  expect(usuari().value).toBe('annaperez');
  canvia('Nom i cognoms', 'name', 'Anna Pérez');
  expect(usuari().value).toBe('annaperez');
  expect(screen.getByLabelText('El teu poble').value).toBe('La Torre de les Maçanes');
  await crea();
  expect(metadades()).toEqual(expect.objectContaining({ full_name: 'Anna Pérez', town_name: 'La Torre de les Maçanes' }));
  expect(metadades()).not.toHaveProperty('username');
});

test('editat, mana el de la persona encara que el nom canvie; buidat, torna la proposta', async () => {
  render(<OnboardingSection />);
  omple();
  canvia('El teu identificador', 'username', 'Anna.P-');
  expect(usuari().value).toBe('anna-p-');
  canvia('Nom i cognoms', 'name', 'Anna Pérez Vidal');
  expect(usuari().value).toBe('anna-p-');
  canvia('El teu identificador', 'username', '');
  expect(usuari().value).toBe('annaperez');
  canvia('El teu identificador', 'username', 'Anna.P-');
  canvia('El teu poble', 'poble', 'Penàguila');
  await crea();
  expect(metadades()).toEqual(expect.objectContaining({ username: 'anna-p', town_name: 'Penàguila' }));
});

test('un identificador reservat no s’envia: el motiu, en línia', async () => {
  render(<OnboardingSection />);
  omple();
  canvia('El teu identificador', 'username', 'consola');
  await crea();
  expect(screen.getByText(MISSATGE_USERNAME_RESERVAT)).toBeTruthy();
  expect(m.registra).not.toHaveBeenCalled();
});

test('sense catàleg, cap selector de poble ni town_name', async () => {
  m.towns = [];
  render(<OnboardingSection />);
  expect(screen.queryByLabelText('El teu poble')).toBeNull();
  omple();
  await crea();
  expect(metadades()).not.toHaveProperty('town_name');
});

/* Fixer (revisió de paritat, troballa 5) · Només La Torre ve triada: un
   catàleg que no la porta no tria per la persona el primer per ordre. */
test('un catàleg sense La Torre: «Tria un poble…» i cap town_name fins que en tria un', async () => {
  m.towns = [{ title: 'Penàguila' }, { title: 'Bel·lús' }];
  render(<OnboardingSection />);
  const selector = screen.getByLabelText('El teu poble');
  expect(selector.value).toBe('');
  expect([...selector.options].map((o) => o.textContent)).toEqual(['Tria un poble…', 'Bel·lús', 'Penàguila']);
  omple();
  await crea();
  expect(metadades()).not.toHaveProperty('town_name');
  cleanup();
  render(<OnboardingSection />);
  canvia('El teu poble', 'poble', 'Penàguila');
  expect([...screen.getByLabelText('El teu poble').options].map((o) => o.textContent)).toEqual(['Bel·lús', 'Penàguila']);
  omple();
  await crea();
  expect(metadades()).toEqual(expect.objectContaining({ town_name: 'Penàguila' }));
});

test('en Entrar no hi ha ni identificador ni poble', () => {
  render(<OnboardingSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Entrar', exact: true }));
  expect(screen.queryByLabelText('El teu identificador')).toBeNull();
  expect(screen.queryByLabelText('El teu poble')).toBeNull();
});
