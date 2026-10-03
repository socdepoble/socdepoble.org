/** P5 (Mestre, 261003) · Dispositius en mode foraster, amb els contextos simulats.
 *
 *  · El nom suggerit no porta mai un nom de persona sense sessió; amb sessió
 *    el porta, però no es desa al navegador.
 *  · L'estat buit és la note-card de sempre, fora de la graella (centrada).
 *  · Dues instàncies muntades al mateix document compartixen les dues capes
 *    d'emmagatzematge, com una pestanya duplicada: han de resoldre l'id
 *    repetit, vore's, connectar, parlar-se i desconnectar-se. El canal és el
 *    doble en memòria de BroadcastChannel. */
import { cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getVal, setVal } from '../../config/storage.js';
import { CanalFals } from './__fixtures__/canalFals.js';
import { loadDeviceChats } from './devicesRuntime.js';
import DevicesSection from './DevicesSection';

const mocks = vi.hoisted(() => ({
  ui: { externalConfig: { tenantId: 't-prova' } },
  core: { agents: [], ownerUserId: null },
  sessio: null
}));

vi.mock('../../components/universal/UniversalPage', async () => {
  const { createElement } = await import('react');
  return { UniversalPage: ({ children }) => createElement('main', null, children) };
});
vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => mocks.ui }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../../app/contexts/SessionContext', () => ({ useSessioOpcional: () => mocks.sessio }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));

const GENERIC = 'Ordinador de l’usuari';
const BUIT = 'Encara no hi ha altres instàncies visibles.';
const CLAU_PERFIL = 'socdepoble-device-profile-v1-t-prova';
const textDeLocalStorage = () => Array.from({ length: localStorage.length }, (_, i) => {
  const clau = localStorage.key(i);
  return `${clau}=${localStorage.getItem(clau)}`;
}).join('\n');
const AGENT = { id: '0001', name: 'Persona del padró', type: 'PERSON' };
const ambSessio = (id, nom) => ({ currentUser: { id, user_metadata: { name: nom } } });

const nomDelCamp = (arrel) => within(arrel).getByPlaceholderText('Nom del dispositiu').value;
const idDe = (arrel) => within(arrel).getByText(/^ID [^\s:]{8}$/).textContent.trim().slice(3);
/* La pantalla en mostra 8 caràcters; l'id sencer ix del que s'ha publicat al canal. */
const idComplet = (curt) => CanalFals.publicats.map(({ data }) => data.device?.id || data.fromId).find((id) => id?.startsWith(curt));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  CanalFals.reinicia();
  vi.stubGlobal('BroadcastChannel', CanalFals);
  mocks.core = { agents: [AGENT], ownerUserId: 'a1b2c3d4-0000-4000-8000-000000000001' };
  mocks.sessio = null;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('foraster: el nom suggerit és genèric, sense cap nom de persona', () => {
  const { container } = render(<DevicesSection />);
  expect(nomDelCamp(container)).toBe(GENERIC);
  expect(within(container).getByText('Dispositiu actual').previousSibling.textContent).toBe(GENERIC);
});

test('foraster: genèric encara que l’id de convidat case amb un agent del padró', () => {
  mocks.core = { agents: [AGENT], ownerUserId: AGENT.id };
  const { container } = render(<DevicesSection />);
  expect(nomDelCamp(container)).toBe(GENERIC);
});

test('amb sessió: el nom de la persona; si és del padró, el del padró', () => {
  mocks.sessio = ambSessio('u-1', 'Persona amb sessió');
  const primera = render(<DevicesSection />);
  expect(nomDelCamp(primera.container)).toBe('Ordinador de Persona amb sessió');
  primera.unmount();

  mocks.sessio = ambSessio(AGENT.id, 'Nom de la sessió');
  const segona = render(<DevicesSection />);
  expect(nomDelCamp(segona.container)).toBe('Ordinador de Persona del padró');
});

test('el nom personal gravat per la versió anterior es refà en foraster; un nom propi es conserva', () => {
  setVal(CLAU_PERFIL, { id: 'id-vell', name: 'Ordinador de Persona antiga', kind: 'portal', isVisible: false, createdAt: 1 });
  const primera = render(<DevicesSection />);
  expect(nomDelCamp(primera.container)).toBe(GENERIC);
  primera.unmount();

  setVal(CLAU_PERFIL, { name: 'La tauleta de la cuina', nomAutomatic: false, kind: 'portal', isVisible: false, createdAt: 1 });
  const segona = render(<DevicesSection />);
  expect(nomDelCamp(segona.container)).toBe('La tauleta de la cuina');
});

test('entrar i eixir: el nom automàtic seguix la persona; el desat amb «Guardar», no', async () => {
  const { container, rerender } = render(<DevicesSection />);
  expect(nomDelCamp(container)).toBe(GENERIC);

  mocks.sessio = ambSessio('u-1', 'Persona amb sessió');
  rerender(<DevicesSection />);
  await waitFor(() => expect(nomDelCamp(container)).toBe('Ordinador de Persona amb sessió'));

  mocks.sessio = null;
  rerender(<DevicesSection />);
  await waitFor(() => expect(nomDelCamp(container)).toBe(GENERIC));

  fireEvent.change(within(container).getByPlaceholderText('Nom del dispositiu'), { target: { value: 'Ordinador del taller' } });
  fireEvent.click(within(container).getByRole('button', { name: /Guardar/ }));
  await waitFor(() => expect(nomDelCamp(container)).toBe('Ordinador del taller'));

  mocks.sessio = ambSessio('u-1', 'Persona amb sessió');
  rerender(<DevicesSection />);
  await waitFor(() => expect(nomDelCamp(container)).toBe('Ordinador del taller'));
});

test('privacitat: amb sessió el nom automàtic no es desa a localStorage; el triat amb «Guardar», sí', async () => {
  mocks.sessio = ambSessio('u-1', 'Persona amb sessió');
  const { container } = render(<DevicesSection />);
  expect(nomDelCamp(container)).toBe('Ordinador de Persona amb sessió');
  fireEvent.click(within(container).getByRole('button', { name: /Invisible \(Privat\)/ }));
  await waitFor(() => expect(getVal(CLAU_PERFIL)).toMatchObject({ isVisible: true, nomAutomatic: true }));
  expect(textDeLocalStorage()).not.toContain('Persona amb sessió');

  fireEvent.change(within(container).getByPlaceholderText('Nom del dispositiu'), { target: { value: 'Ordinador del taller' } });
  fireEvent.click(within(container).getByRole('button', { name: /Guardar/ }));
  await waitFor(() => expect(getVal(CLAU_PERFIL)).toMatchObject({ name: 'Ordinador del taller', nomAutomatic: false }));
});

test('estat buit: la note-card de sempre, amb el seu text, fora de la graella de targetes', () => {
  const { container } = render(<DevicesSection />);
  const buit = within(container).getByText(BUIT);
  expect(buit.classList.contains('note-card')).toBe(true);
  expect(buit.closest('.sdp-card-grid')).toBeNull();
  expect(buit.parentElement.classList.contains('devices-panel__body')).toBe(true);
  expect(container.querySelector('.sdp-card-grid .note-card')).toBeNull();
  expect(container.querySelector('.sdp-buit')).toBeNull();

  fireEvent.click(within(container).getByRole('button', { name: 'Simular connexions de prova' }));
  expect(within(container).queryByText(BUIT)).toBeNull();
  expect(within(container).getByText('Mòbil de prova')).toBeTruthy();
});

test('dues instàncies (pestanya duplicada): resolen l’id, es veuen, connecten, es parlen i es desconnecten', async () => {
  const u = render(<DevicesSection />);
  const d = render(<DevicesSection />);

  /* Les dues han llegit el mateix id; la més nova en pren un altre. */
  await waitFor(() => expect(idDe(u.container)).not.toBe(idDe(d.container)));
  const idU = idDe(u.container);
  const idD = idDe(d.container);

  /* Per defecte són invisibles: cap de les dues veu l'altra. */
  expect(within(u.container).getByText(BUIT)).toBeTruthy();
  fireEvent.click(within(u.container).getByRole('button', { name: /Invisible \(Privat\)/ }));
  fireEvent.click(within(d.container).getByRole('button', { name: /Invisible \(Privat\)/ }));

  const targetaDeD = (await within(u.container).findByText(`ID curt: ${idD}`)).closest('article');
  const targetaDeU = (await within(d.container).findByText(`ID curt: ${idU}`)).closest('article');

  fireEvent.click(within(targetaDeD).getByRole('button', { name: /Connectar/ }));
  expect(within(targetaDeD).getByText('Esperant resposta')).toBeTruthy();

  fireEvent.click(await within(d.container).findByRole('button', { name: /Acceptar/ }));
  await waitFor(() => expect(within(targetaDeD).getByText('Connectat')).toBeTruthy());

  fireEvent.change(within(u.container).getByPlaceholderText('Escriu un missatge directe...'), { target: { value: 'Bon dia des de la primera' } });
  fireEvent.click(within(u.container).getByRole('button', { name: /Enviar/ }));
  expect(await within(d.container).findByText('Bon dia des de la primera')).toBeTruthy();

  fireEvent.change(within(d.container).getByPlaceholderText('Escriu un missatge directe...'), { target: { value: 'Rebut des de la segona' } });
  fireEvent.click(within(d.container).getByRole('button', { name: /Enviar/ }));
  expect(await within(u.container).findByText('Rebut des de la segona')).toBeTruthy();

  /* En desconnectar, l'altra torna a «Disponible» i guarda l'avís de tancament
     (el canal directe només es pinta amb una connexió viva). */
  fireEvent.click(within(targetaDeD).getByRole('button', { name: /Desconnectar/ }));
  expect(within(targetaDeD).getByRole('button', { name: /Connectar/ })).toBeTruthy();
  await waitFor(() => expect(within(targetaDeU).getByText('Disponible')).toBeTruthy());
  expect(loadDeviceChats('t-prova', idComplet(idD))[idComplet(idU)].at(-1).text).toBe('La connexió s’ha tancat.');
});
