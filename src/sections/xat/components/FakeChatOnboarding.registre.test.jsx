/* IDEA-133 (Onada R10, ordre del Mestre del 261106, B2-01) · Al xat de mostra
   sense sessió, la bombolla de simulació (section.xat.fake.reply) conserva el
   literal intacte i porta, just davall i dins de la bombolla, un enllaç de
   veres cap a /registre: «Entra o registra’t ara →», en les cinc llengües.
   La fletxa és decorativa: el nom accessible de l'enllaç és el text. Les
   dades (FakeChatOnboarding) i la vista (Bombolla) es proven juntes: la
   bombolla que es pinta és la que torna el context de mostra.
   Gauntlet R10 (B2V-01) · La resposta local de la IAIA (la trobada, la de
   sempre i la d'un error) no porta mai la marca ni l'enllaç a /registre.
   Onada R29 · DECISIÓ-R29-02.7 (ordre del Mestre, substituïx l'abast de B2-01) ·
   La invitació inicial de la IAIA (m2) també porta l'enllaç; cap altra
   bombolla de la mostra (ni els Avisos, ni Javi, ni les respostes de la IAIA). */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useContext } from 'react';
import FakeChatOnboarding from './FakeChatOnboarding.jsx';
import Bombolla from './Bombolla.jsx';
import { XatContext } from '../XatContext.jsx';
import { MemoryRouter, useLocation } from '../../../app/contexts/RouterContext.jsx';
import '../../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../../config/i18n.js';
import { mapejaMissatge } from '../missatges.js';
import { IAIA_ID, RESPOSTA_IAIA } from '../../../data/identitatsSeed.js';

vi.mock('../../../data/backendPort.js', () => ({ teCapacitat: () => false, loadPerfilPublic: vi.fn() }));
vi.mock('../../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: [] }) }));
vi.mock('../../../app/contexts/UIContext.jsx', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: { dataMode: 'seed' } })
}));

const LITERAL = 'Açò és una simulació. Si vols guardar la conversa, has de registrar-te, i ja està.';
const ENLLAC = {
  ca: 'Entra o registra’t ara →',
  es: 'Entra o regístrate ahora →',
  en: 'Sign in or sign up now →',
  eu: 'Sartu edo erregistratu orain →',
  gl: 'Entra ou rexístrate agora →'
};
const t = (_, alternativa) => alternativa;

let xat = null;
function Espia() { xat = useContext(XatContext); return null; }
let ruta = null;
function Ubicacio() { ruta = useLocation().pathname; return null; }

beforeEach(() => { vi.useFakeTimers(); xat = null; ruta = null; });
afterEach(() => { cleanup(); vi.useRealTimers(); });

/** La resposta simulada al General de la comunitat de Sóc de Poble (com la prova de P1-52). */
async function respostaSimulada() {
  render(<FakeChatOnboarding originalContext={{ senseSessio: true, comunitats: [] }}><Espia /></FakeChatOnboarding>);
  const fil = xat.chatThreads.find((f) => f.id === 'fake-sdp-general');
  await act(async () => { await xat.sendChatMessage(fil, 'Hola'); });
  act(() => { vi.runAllTimers(); });
  const resposta = xat.getThreadMessages('fake-sdp-general').at(-1);
  cleanup();
  return resposta;
}

const pintaBombolla = (missatge, props = {}) => render(
  <MemoryRouter rutaInicial="/xat/fake-sdp-general">
    <ul><Bombolla missatge={missatge} t={t} {...props} /></ul>
    <Ubicacio />
  </MemoryRouter>
);

test('B2-01 · la resposta simulada porta la marca de l’enllaç; el text literal no canvia', async () => {
  const resposta = await respostaSimulada();
  expect(resposta).toMatchObject({ sender: 'other', text: LITERAL, accioRegistre: true });
  /* Onada R29 · DECISIÓ-R29-02.7 · De les bombolles de partida, només la invitació de la IAIA (m2) la
     porta: ni la seua salutació, ni la benvinguda dels Avisos, ni Javi. */
  const AMB_MARCA = { 'fake-iaia': ['m2'] };
  render(<FakeChatOnboarding originalContext={{ senseSessio: true, comunitats: [] }}><Espia /></FakeChatOnboarding>);
  for (const fil of xat.chatThreads) {
    const ambMarca = xat.getThreadMessages(fil.id).filter((m) => m.accioRegistre === true).map((m) => m.id);
    expect([fil.id, ambMarca]).toEqual([fil.id, AMB_MARCA[fil.id] || []]);
  }
});

test('Onada R29 · DECISIÓ-R29-02.7 · la invitació de la IAIA porta, dins de la bombolla i davall del literal intacte, l’enllaç a /registre', () => {
  render(<FakeChatOnboarding originalContext={{ senseSessio: true, comunitats: [] }}><Espia /></FakeChatOnboarding>);
  const invitacio = xat.getThreadMessages('fake-iaia').find((m) => m.id === 'm2');
  expect(invitacio).toMatchObject({ sender: 'other', is_ai: true, accioRegistre: true, text: "Si t'agrada el que veus, registra't per a entrar al xat de veritat!" });
  /* La salutació de la IAIA (m1), no. */
  expect(xat.getThreadMessages('fake-iaia').find((m) => m.id === 'm1')).not.toHaveProperty('accioRegistre');
  cleanup();
  const { container } = pintaBombolla(invitacio);
  const bombolla = container.querySelector('.sdp-xat-bombolla');
  const paragrafs = [...bombolla.querySelectorAll('p.sdp-xat-bombolla__text')];
  expect(paragrafs.map((p) => p.textContent)).toEqual(["Si t'agrada el que veus, registra't per a entrar al xat de veritat!", ENLLAC.ca]);
  const enllac = within(bombolla).getByRole('link', { name: 'Entra o registra’t ara' });
  expect(enllac.getAttribute('href')).toBe('/registre');
  fireEvent.click(enllac);
  expect(ruta).toBe('/registre');
  cleanup();
  /* Amb la IAIA apagada, el seu fil (i la invitació) no hi és. */
  render(<FakeChatOnboarding originalContext={{ senseSessio: true, comunitats: [], iaiaApagada: true }}><Espia /></FakeChatOnboarding>);
  expect(xat.chatThreads.some((f) => f.id === 'fake-iaia')).toBe(false);
});

test('B2V-01 · la resposta de la IAIA (trobada, la de sempre o després d’un error) no porta la marca ni cap enllaç a /registre', async () => {
  const respostes = [
    async () => 'El Mercat és on el veïnat compra i ven.',
    async () => null,
    async () => { throw new Error('sense Atles'); }
  ];
  let crides = 0;
  render(
    <FakeChatOnboarding originalContext={{ senseSessio: true, comunitats: [] }} respostaIAIA={(pregunta) => respostes[crides++](pregunta)}>
      <Espia />
    </FakeChatOnboarding>
  );
  const fil = xat.chatThreads.find((f) => f.id === 'fake-iaia');
  const delaIAIA = [];
  for (const pregunta of ['Què és el Mercat?', 'asdfgh', 'Què és el Mur?']) {
    await act(async () => { await xat.sendChatMessage(fil, pregunta); });
    await act(async () => { for (let i = 0; i < 40; i += 1) await Promise.resolve(); });
    delaIAIA.push(xat.getThreadMessages('fake-iaia').at(-1));
  }
  act(() => { vi.runAllTimers(); });
  expect(crides).toBe(3);
  expect(delaIAIA.map((m) => [m.usuariId, m.is_ai, m.text])).toEqual([
    [IAIA_ID, true, 'El Mercat és on el veïnat compra i ven.'],
    [IAIA_ID, true, RESPOSTA_IAIA],
    [IAIA_ID, true, RESPOSTA_IAIA]
  ]);
  /* Ni cap temporitzador ha afegit la bombolla de simulació al fil de la IAIA: només la invitació
     inicial (m2, Onada R29 · DECISIÓ-R29-02.7) porta la marca, cap resposta. */
  expect(xat.getThreadMessages('fake-iaia').filter((m) => m.accioRegistre).map((m) => m.id)).toEqual(['m2']);
  cleanup();
  for (const missatge of delaIAIA) {
    expect(missatge).not.toHaveProperty('accioRegistre');
    const { container } = pintaBombolla(missatge);
    expect(container.querySelector('a[href="/registre"]')).toBeNull();
    expect(screen.queryByText(/Entra o registra/)).toBeNull();
    cleanup();
  }
});

test('B2-01 · dins de la bombolla i davall del literal, un enllaç de veres a /registre, amb focus i nom', async () => {
  const resposta = await respostaSimulada();
  const { container } = pintaBombolla(resposta);
  const bombolla = container.querySelector('.sdp-xat-bombolla');
  const paragrafs = [...bombolla.querySelectorAll('p.sdp-xat-bombolla__text')];
  /* El literal, sencer i sol en el seu paràgraf; l'enllaç, al paràgraf de just davall. */
  expect(paragrafs.map((p) => p.textContent)).toEqual([LITERAL, ENLLAC.ca]);
  const enllac = within(bombolla).getByRole('link', { name: 'Entra o registra’t ara' });
  expect(paragrafs[1].contains(enllac)).toBe(true);
  expect(enllac.tagName).toBe('A');
  expect(enllac.getAttribute('href')).toBe('/registre');
  expect(enllac.className).toBe('sdp-xat-enllac');
  /* La fletxa es veu, però és decorativa. */
  expect(enllac.textContent).toBe(ENLLAC.ca);
  expect(enllac.querySelector('[aria-hidden="true"]').textContent).toBe(' →');
  enllac.focus();
  expect(document.activeElement).toBe(enllac);
  /* L'hora continua darrere, dins de la bombolla. */
  expect(bombolla.lastElementChild.className).toBe('sdp-xat-bombolla__meta');
  fireEvent.click(enllac);
  expect(ruta).toBe('/registre');
});

test('B2-01 · les cinc llengües: el text de la clau i el nom accessible sense la fletxa', async () => {
  const resposta = await respostaSimulada();
  for (const [codi, text] of Object.entries(ENLLAC)) {
    const tr = createTranslator(codi);
    expect([codi, tr('section.xat.fake.registre')]).toEqual([codi, text]);
    pintaBombolla(resposta, { t: tr });
    const enllac = screen.getByRole('link', { name: text.replace(/\s*→$/, '') });
    expect([codi, enllac.textContent, enllac.getAttribute('href')]).toEqual([codi, text, '/registre']);
    cleanup();
  }
});

test('B2-01 · sense la marca, la pròpia, l’esborrada o un missatge del servidor: cap enllaç; en la selecció, cap enllaç interactiu', async () => {
  const resposta = await respostaSimulada();
  const senseMarca = Object.fromEntries(Object.entries(resposta).filter(([clau]) => clau !== 'accioRegistre'));
  for (const missatge of [senseMarca, { ...resposta, sender: 'me' }, { ...resposta, esborrat: true }]) {
    pintaBombolla(missatge);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByText(/Entra o registra/)).toBeNull();
    cleanup();
  }
  /* Un missatge del servidor no pot portar la marca: mapejaMissatge no la copia. */
  expect(mapejaMissatge({ id: 'x', filId: 'f', text: 'Hola', usuariId: 'u', accioRegistre: true }, 'jo')).not.toHaveProperty('accioRegistre');
  const { container } = pintaBombolla(resposta, { seleccio: { actiu: true, triat: false, onAlterna: vi.fn() } });
  expect(screen.queryByRole('link')).toBeNull();
  expect(container.querySelector('a')).toBeNull();
  expect(container.querySelector('span.sdp-xat-enllac').textContent).toBe(ENLLAC.ca);
});
