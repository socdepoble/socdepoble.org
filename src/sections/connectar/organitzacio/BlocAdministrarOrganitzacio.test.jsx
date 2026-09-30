import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* T43 (ordre del Mestre, 260928) · administrar una organització des de
   Connectar: alta, espera de la pertinença, «Actua com a» i «Edita la fitxa». */
const m = vi.hoisted(() => ({
  navigate: vi.fn(), capacitat: true, directori: true, user: { id: 'u-1' },
  identitat: null, reclama: vi.fn(), llista: vi.fn(), perfil: vi.fn()
}));
vi.mock('../../../app/contexts/RouterContext', () => ({ useNavigate: () => m.navigate }));
vi.mock('../../../app/contexts/SessionContext', () => ({ useSession: () => ({ currentUser: m.user }) }));
vi.mock('../../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => m.identitat }));
vi.mock('../../../data/backendPort.js', () => ({
  teCapacitat: (cap) => (cap === 'reclamacions' && m.capacitat) || (cap === 'directori' && m.directori),
  reclamaOrganitzacio: (...args) => m.reclama(...args),
  lesMevesReclamacions: (...args) => m.llista(...args),
  loadPerfilPublic: (...args) => m.perfil(...args)
}));
vi.mock('../../../data/identitat.js', () => ({ capturaSessio: () => () => {} }));
import { BlocAdministrarOrganitzacio } from './BlocAdministrarOrganitzacio.jsx';

const FORN = { id: 'forn', slug: 'forn-de-la-torre', name: 'Forn de la Torre', role: 'admin' };

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  m.capacitat = true;
  m.directori = true;
  m.user = { id: 'u-1' };
  m.identitat = { memberships: [], actor: { tipus: 'persona', id: 'u-1' }, setActor: vi.fn(() => true), refresh: vi.fn() };
  m.llista.mockResolvedValue([]);
  m.perfil.mockResolvedValue({ tipus: 'entitat', id: 'forn', nom: 'Forn de la Torre' });
  m.reclama.mockResolvedValue({ organitzacioId: 'forn', estat: 'aprovada', role: 'admin', data: null });
});

test('seed: connectar dona l’alta, espera que la pertinença arribe i llavors ofereix «Actua com a»', async () => {
  const vista = render(<BlocAdministrarOrganitzacio orgId="forn" config={{ dataMode: 'seed' }} />);
  expect(screen.getByRole('heading', { level: 3, name: 'Administrar l’organització' })).toBeTruthy();
  const boto = await screen.findByRole('button', { name: 'Connectar-me com a administradora' });
  expect(screen.queryByRole('textbox')).toBeNull();
  await act(async () => { fireEvent.click(boto); });
  expect(m.reclama).toHaveBeenCalledWith('forn', { justificacio: '' }, { dataMode: 'seed' });
  expect(m.identitat.refresh).toHaveBeenCalledTimes(1);
  /* La pertinença encara no hi és: cap botó que fallaria en silenci. */
  expect(screen.getByText('Estem afegint Forn de la Torre a les teues identitats…')).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Actua com a/ })).toBeNull();
  m.identitat = { ...m.identitat, memberships: [FORN] };
  vista.rerender(<BlocAdministrarOrganitzacio orgId="forn" config={{ dataMode: 'seed' }} />);
  fireEvent.click(screen.getByRole('button', { name: 'Actua com a Forn de la Torre' }));
  expect(m.identitat.setActor).toHaveBeenCalledWith('entitat', 'forn');
});

/* Correcció C17 (260928) · Cada transició que provoca la persona desmunta el
   botó premut: el focus va al títol del bloc, no al <body>. */
test('C17 · enviar i «Actua com a» porten el focus al títol del bloc', async () => {
  const vista = render(<BlocAdministrarOrganitzacio orgId="forn" config={{ dataMode: 'seed' }} />);
  const titol = screen.getByRole('heading', { level: 3, name: 'Administrar l’organització' });
  expect(titol.getAttribute('tabindex')).toBe('-1');
  const boto = await screen.findByRole('button', { name: 'Connectar-me com a administradora' });
  boto.focus();
  await act(async () => { fireEvent.click(boto); });
  expect(screen.queryByRole('button', { name: 'Connectar-me com a administradora' })).toBeNull();
  expect(document.activeElement).toBe(titol);
  m.identitat = { ...m.identitat, memberships: [FORN] };
  vista.rerender(<BlocAdministrarOrganitzacio orgId="forn" config={{ dataMode: 'seed' }} />);
  const actua = screen.getByRole('button', { name: 'Actua com a Forn de la Torre' });
  actua.focus();
  fireEvent.click(actua);
  expect(m.identitat.setActor).toHaveBeenCalledWith('entitat', 'forn');
  expect(document.activeElement).toBe(titol);
});

test('C17 · si «Actua com a» no canvia res (setActor torna false), el focus no es mou', () => {
  m.identitat = { ...m.identitat, memberships: [FORN], setActor: vi.fn(() => false) };
  render(<BlocAdministrarOrganitzacio orgId="forn" />);
  const actua = screen.getByRole('button', { name: 'Actua com a Forn de la Torre' });
  actua.focus();
  fireEvent.click(actua);
  expect(document.activeElement).toBe(actua);
});

test('«Edita la fitxa» obri el Perfil a la fitxa de l’organització sense canviar d’identitat', () => {
  m.identitat = { ...m.identitat, memberships: [FORN] };
  render(<BlocAdministrarOrganitzacio orgId="forn-de-la-torre" />);
  fireEvent.click(screen.getByRole('button', { name: 'Edita la fitxa de Forn de la Torre' }));
  expect(m.navigate).toHaveBeenCalledWith('/el-meu-perfil?organitzacio=forn');
  expect(m.identitat.setActor).not.toHaveBeenCalled();
});

test('remot: llig només la petició pròpia d’esta organització i la mostra pendent', async () => {
  m.llista.mockResolvedValue([
    { id: 'c0', organitzacioId: 'altra', estat: 'rebutjada', data: null },
    { id: 'c1', organitzacioId: 'o-1', estat: 'pendent', data: '2026-09-28T10:00:00Z' }
  ]);
  render(<BlocAdministrarOrganitzacio orgId="o-1" config={{}} />);
  expect(await screen.findByText(/Petició enviada el .*2026/)).toBeTruthy();
  expect(m.llista).toHaveBeenCalledTimes(1);
  expect(m.reclama).not.toHaveBeenCalled();
});

test('remot: la justificació viatja i «ja té propietària» es diu com a estat, sense el text del servidor', async () => {
  m.perfil.mockResolvedValue({ tipus: 'entitat', id: 'o-1', nom: 'Forn' });
  m.reclama.mockRejectedValue(Object.assign(new Error('Esta organització ja té qui l’administra.'), { code: 'SDP-CLAIM-003' }));
  render(<BlocAdministrarOrganitzacio orgId="o-1" config={{}} />);
  fireEvent.change(await screen.findByRole('textbox', { name: 'Explica breument qui eres (opcional)' }), { target: { value: 'Soc la fornera.' } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Connectar-me com a administradora' })); });
  expect(m.reclama).toHaveBeenCalledWith('o-1', { justificacio: 'Soc la fornera.' }, {});
  await waitFor(() => expect(screen.getByText('Forn ja té qui l’administra')).toBeTruthy());
  expect(screen.queryByRole('alert')).toBeNull();
  expect(m.identitat.refresh).not.toHaveBeenCalled();
});

test('sense la capacitat no crida res i ho diu; sense sessió porta a entrar', () => {
  m.capacitat = false;
  const vista = render(<BlocAdministrarOrganitzacio orgId="o-1" />);
  expect(screen.getByText('Este poble encara no permet connectar-se a organitzacions des de l’app.')).toBeTruthy();
  expect(m.llista).not.toHaveBeenCalled();
  vista.unmount();
  m.user = null;
  /* T4 (ordre del Mestre, 260930) · «Entrar» obri /registre en mode Entrar i,
     de tornada, on es venia (rutaDEntrada). Sense router llegible en esta
     prova, la ruta és la de la barra d'adreces. */
  window.history.replaceState(null, '', '/connectar?organitzacio=o-1');
  try {
    render(<BlocAdministrarOrganitzacio orgId="o-1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(m.navigate).toHaveBeenCalledWith('/registre?mode=entrar&tornar=%2Fconnectar%3Forganitzacio%3Do-1');
  } finally { window.history.replaceState(null, '', '/'); }
  expect(m.llista).not.toHaveBeenCalled();
});

/* T43b-3 · el nom del consentiment ve d'una font de confiança, mai del title de l'URL. */
test('el nom ve del directori; si no n’hi ha (o no és una organització) es diu «esta organització»', async () => {
  const vista = render(<BlocAdministrarOrganitzacio orgId="o-1" config={{}} />);
  expect(await screen.findByText('Vols administrar Forn de la Torre?')).toBeTruthy();
  expect(m.perfil).toHaveBeenCalledWith('o-1', {});
  vista.unmount();
  for (const resposta of [() => Promise.resolve(null), () => Promise.resolve({ tipus: 'persona', nom: 'Ajuntament fals' }), () => Promise.reject(new Error('xarxa'))]) {
    m.perfil.mockImplementationOnce(resposta);
    const altra = render(<BlocAdministrarOrganitzacio orgId="o-2" config={{}} />);
    await screen.findByRole('button', { name: 'Connectar-me com a administradora' });
    expect(altra.container.textContent).toContain('Vols administrar esta organització?');
    expect(altra.container.textContent).toContain('les converses d’esta organització');
    expect(altra.container.textContent).not.toContain('Ajuntament fals');
    altra.unmount();
  }
  /* Sense la capacitat del directori, ni es demana. */
  m.directori = false;
  m.perfil.mockClear();
  render(<BlocAdministrarOrganitzacio orgId="o-3" config={{}} />);
  expect(await screen.findByText('Vols administrar esta organització?')).toBeTruthy();
  expect(m.perfil).not.toHaveBeenCalled();
});

/* T43b-2 · llegir no és enviar: comprovant sense formulari, i cada error diu el que ha passat. */
test('mentre es llig la petició pròpia no hi ha formulari; un error de lectura no diu «No s’ha pogut enviar»', async () => {
  m.llista.mockReturnValue(new Promise(() => {}));
  const vista = render(<BlocAdministrarOrganitzacio orgId="o-1" config={{}} />);
  expect(await screen.findByText('Comprovant si ja has demanat administrar Forn de la Torre…')).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.queryByRole('textbox')).toBeNull();
  vista.unmount();

  m.llista.mockRejectedValue(Object.assign(new Error('Supabase 500: boom'), { status: 500 }));
  const lectura = render(<BlocAdministrarOrganitzacio orgId="o-1" config={{}} />);
  const avis = await screen.findByText(/No hem pogut comprovar si ja havies demanat administrar-la/);
  expect(avis).toBeTruthy();
  expect(lectura.container.textContent).toContain('No s’ha pogut comprovar');
  expect(lectura.container.textContent).not.toContain('No s’ha pogut enviar');
  expect(lectura.container.textContent).not.toContain('Supabase');
  /* Acabada la lectura, es pot demanar: un duplicat eixiria com a «pendent». */
  expect(screen.getByRole('button', { name: 'Connectar-me com a administradora' })).toBeTruthy();
  lectura.unmount();

  m.llista.mockRejectedValue(Object.assign(new Error('La petició ha trigat massa temps.'), { name: 'TimeoutError' }));
  render(<BlocAdministrarOrganitzacio orgId="o-1" config={{}} />);
  expect(await screen.findByText(/El servidor no ha respost i no hem pogut comprovar/)).toBeTruthy();
});

test('un TimeoutError en enviar es diu com a xarxa, no com una fallada genèrica', async () => {
  m.reclama.mockRejectedValue(Object.assign(new Error('La petició ha trigat massa temps.'), { name: 'TimeoutError' }));
  render(<BlocAdministrarOrganitzacio orgId="o-1" config={{}} />);
  const boto = await screen.findByRole('button', { name: 'Connectar-me com a administradora' });
  await act(async () => { fireEvent.click(boto); });
  const alerta = await screen.findByRole('alert');
  expect(alerta.textContent).toContain('No s’ha pogut enviar');
  expect(alerta.textContent).toContain('El servidor no ha respost. Comprova la connexió');
});

/* T43b-1 · la petició i l'error són d'una persona i d'una organització concretes. */
test('canviar d’organització o de persona no arrossega la petició ni l’error de l’anterior', async () => {
  m.llista.mockImplementation(async () => (m.user?.id === 'u-1'
    ? [{ id: 'c1', organitzacioId: 'o-1', estat: 'pendent', data: '2026-09-28T10:00:00Z' }]
    : []));
  const vista = render(<BlocAdministrarOrganitzacio orgId="o-1" config={{}} />);
  expect(await screen.findByText(/Petició enviada el .*2026/)).toBeTruthy();
  /* Una altra organització: ni un instant amb la petició d'o-1. */
  vista.rerender(<BlocAdministrarOrganitzacio orgId="o-2" config={{}} />);
  expect(screen.queryByText(/Petició enviada/)).toBeNull();
  expect(await screen.findByRole('button', { name: 'Connectar-me com a administradora' })).toBeTruthy();
  /* Tornar a o-1 amb una altra persona: la petició era d'u-1. */
  m.user = { id: 'u-2' };
  vista.rerender(<BlocAdministrarOrganitzacio orgId="o-1" config={{}} />);
  expect(screen.queryByText(/Petició enviada/)).toBeNull();
  expect(await screen.findByRole('button', { name: 'Connectar-me com a administradora' })).toBeTruthy();

  /* Un error d'enviament d'o-2 no es pinta a o-3. */
  m.reclama.mockRejectedValue(Object.assign(new Error('Supabase 500: boom'), { code: 'ALTRE' }));
  vista.rerender(<BlocAdministrarOrganitzacio orgId="o-2" config={{}} />);
  const boto = await screen.findByRole('button', { name: 'Connectar-me com a administradora' });
  await act(async () => { fireEvent.click(boto); });
  expect(await screen.findByRole('alert')).toBeTruthy();
  vista.rerender(<BlocAdministrarOrganitzacio orgId="o-3" config={{}} />);
  expect(screen.queryByRole('alert')).toBeNull();
});
