/* IDEA-133 (Onada R10, ordre del Mestre del 261106, B2-01) · Al xat de mostra
   sense sessió, la bombolla de simulació (section.xat.fake.reply) conserva el
   literal intacte i porta, just davall i dins de la bombolla, un enllaç de
   veres cap a /registre: «Entra o registra’t ara →», en les cinc llengües.
   La fletxa és decorativa: el nom accessible de l'enllaç és el text. Les
   dades (FakeChatOnboarding) i la vista (Bombolla) es proven juntes: la
   bombolla que es pinta és la que torna el context de mostra.
   Gauntlet R10 (B2V-01) · La resposta local de la IAIA (la trobada, la de
   sempre i la d'un error) no porta mai la marca ni l'enllaç a /registre. */
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
  /* Cap altra bombolla de la mostra la porta: ni la benvinguda dels Avisos, ni la IAIA, ni Javi. */
  render(<FakeChatOnboarding originalContext={{ senseSessio: true, comunitats: [] }}><Espia /></FakeChatOnboarding>);
  for (const fil of xat.chatThreads) {
    expect([fil.id, xat.getThreadMessages(fil.id).some((m) => m.accioRegistre)]).toEqual([fil.id, false]);
  }
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
  /* Ni cap temporitzador ha afegit la bombolla de simulació al fil de la IAIA. */
  expect(xat.getThreadMessages('fake-iaia').some((m) => m.accioRegistre)).toBe(false);
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
