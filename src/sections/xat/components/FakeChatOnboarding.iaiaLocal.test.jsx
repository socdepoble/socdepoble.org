/* IDEA-56 (pla 261029_1605, Bloc F.2) · Al Xat de mostra (remot sense
   sessió), el fil de la IAIA respon amb el seu cervell local: l'Atles sense
   xarxa ni temporitzador, en l'ordre de les preguntes, i la seua frase de
   sempre si no ho sap; mai la frase de simulació. Els altres fils de mostra,
   com abans; el de Javi, de només lectura. */
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useContext } from 'react';
import FakeChatOnboarding from './FakeChatOnboarding.jsx';
import { XatContext } from '../XatContext.jsx';
import { ENCAPCALAMENT_DE_SOC_DE_POBLE, SALUTACIO_TECNICA_IAIA, oblidaIndexDeLaWiki, respostaDeLaIAIA } from '../../../data/iaiaLocal.js';
import { IAIA_ID, RESPOSTA_IAIA } from '../../../data/identitatsSeed.js';

const mocks = vi.hoisted(() => ({ externalConfig: {} }));
vi.mock('../../../app/contexts/UIContext.jsx', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: mocks.externalConfig })
}));

const SIMULACIO = 'Açò és una simulació. Si vols guardar la conversa, has de registrar-te, i ja està.';

let xat = null;
function Espia() {
  xat = useContext(XatContext);
  return null;
}
const munta = (props = {}, context = {}) => render(
  <FakeChatOnboarding originalContext={{ senseSessio: true, comunitats: [], ...context }} {...props}><Espia /></FakeChatOnboarding>
);
/* La resposta arriba en microtasques: la capa local, o la càrrega injectada. */
const buida = () => act(async () => { for (let i = 0; i < 40; i += 1) await Promise.resolve(); });
const fil = (id) => xat.chatThreads.find((f) => f.id === id);
const missatges = (id) => xat.getThreadMessages(id);
const ambPromesa = () => {
  let resol;
  const promesa = new Promise((r) => { resol = r; });
  return { promesa, resol };
};

beforeEach(() => {
  vi.useFakeTimers();
  mocks.externalConfig = {};
  xat = null;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  oblidaIndexDeLaWiki();
});

test('«Què és el Mercat?»: la IAIA respon amb l’Atles, signa amb el seu id, sense xarxa ni temporitzador', async () => {
  const espia = vi.fn(async () => ({ items: [] }));
  munta({ respostaIAIA: (pregunta) => respostaDeLaIAIA(pregunta, { carrega: espia }) });
  await act(async () => { await xat.sendChatMessage(fil('fake-iaia'), 'Què és el Mercat?'); });
  await buida();
  const resposta = missatges('fake-iaia').at(-1);
  expect(resposta).toMatchObject({ sender: 'other', author: 'IAIA MarIA', usuariId: IAIA_ID, is_ai: true });
  expect(resposta.text.startsWith(`${ENCAPCALAMENT_DE_SOC_DE_POBLE}\n`)).toBe(true);
  expect(resposta.text).toContain('· El Mercat — /mercat');
  expect(espia).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});

test('si no ho sap, la seua frase de sempre; a una salutació, la salutació; mai la frase de simulació', async () => {
  const espia = vi.fn(async () => ({ items: [] }));
  munta({ respostaIAIA: (pregunta) => respostaDeLaIAIA(pregunta, { carrega: espia }) });
  await act(async () => { await xat.sendChatMessage(fil('fake-iaia'), 'asdfgh'); });
  await buida();
  expect(missatges('fake-iaia').at(-1)).toMatchObject({ text: RESPOSTA_IAIA, usuariId: IAIA_ID, is_ai: true });
  expect(espia).toHaveBeenCalledTimes(1);
  await act(async () => { await xat.sendChatMessage(fil('fake-iaia'), 'Hola'); });
  await buida();
  expect(missatges('fake-iaia').at(-1).text).toBe(SALUTACIO_TECNICA_IAIA);
  /* Una resposta que llança o torna buit: també la frase de sempre. */
  munta({ respostaIAIA: async () => { throw new Error('x'); } });
  await act(async () => { await xat.sendChatMessage(fil('fake-iaia'), 'Què és el Mur?'); });
  await buida();
  expect(missatges('fake-iaia').at(-1).text).toBe(RESPOSTA_IAIA);
  act(() => { vi.runAllTimers(); });
  expect(missatges('fake-iaia').some((m) => m.text === SIMULACIO)).toBe(false);
});

test('dues preguntes seguides: les respostes, en l’ordre de les preguntes, encara que la primera tarde més; seq únics', async () => {
  const primera = ambPromesa();
  const respostaIAIA = vi.fn((pregunta) => (pregunta === 'Primera' ? primera.promesa : Promise.resolve('B')));
  munta({ respostaIAIA });
  await act(async () => {
    await xat.sendChatMessage(fil('fake-iaia'), 'Primera');
    await xat.sendChatMessage(fil('fake-iaia'), 'Segona');
  });
  await buida();
  expect(missatges('fake-iaia').filter((m) => m.sender === 'other' && m.usuariId === IAIA_ID)).toEqual([]);
  await act(async () => { primera.resol('A'); });
  await buida();
  expect(missatges('fake-iaia').filter((m) => m.usuariId === IAIA_ID).map((m) => m.text)).toEqual(['A', 'B']);
  expect(missatges('fake-iaia').slice(-4).map((m) => m.text)).toEqual(['Primera', 'Segona', 'A', 'B']);
  const seqs = missatges('fake-iaia').map((m) => m.seq);
  expect(new Set(seqs).size).toBe(seqs.length);
  expect(respostaIAIA.mock.calls.map(([pregunta]) => pregunta)).toEqual(['Primera', 'Segona']);
});

test('desmuntar amb una resposta pendent: res no es pinta i cap error a la consola', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const pendent = ambPromesa();
  const respostaIAIA = vi.fn(() => pendent.promesa);
  const { unmount } = munta({ respostaIAIA });
  await act(async () => { await xat.sendChatMessage(fil('fake-iaia'), 'Què és el Mercat?'); });
  await buida();
  const abans = missatges('fake-iaia').length;
  unmount();
  pendent.resol('Massa tard');
  await act(async () => { for (let i = 0; i < 20; i += 1) await Promise.resolve(); });
  expect(respostaIAIA).toHaveBeenCalledTimes(1);
  expect(missatges('fake-iaia')).toHaveLength(abans);
  expect(error).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});

test('els altres fils de mostra, com abans: el General respon el literal al cap d’un segon; el de Javi, res', async () => {
  const respostaIAIA = vi.fn(async () => 'R');
  munta({ respostaIAIA });
  await act(async () => { await xat.sendChatMessage(fil('fake-sdp-general'), 'Hola'); });
  act(() => { vi.advanceTimersByTime(999); });
  expect(missatges('fake-sdp-general').filter((m) => m.sender === 'other')).toEqual([]);
  act(() => { vi.advanceTimersByTime(1); });
  expect(missatges('fake-sdp-general').at(-1)).toMatchObject({ sender: 'other', text: SIMULACIO, is_ai: false });
  const deJavi = missatges('fake-javi').length;
  let enviats;
  await act(async () => { enviats = await xat.sendChatMessage(fil('fake-javi'), 'Hola, Javi'); });
  await buida();
  act(() => { vi.runAllTimers(); });
  expect(enviats).toEqual([]);
  expect(missatges('fake-javi')).toHaveLength(deJavi);
  expect(respostaIAIA).not.toHaveBeenCalled();
});

test('amb la IAIA apagada no hi ha el seu fil, i el seu cervell no es crida mai', async () => {
  const respostaIAIA = vi.fn(async () => 'R');
  munta({ respostaIAIA }, { iaiaApagada: true });
  expect(fil('fake-iaia')).toBeUndefined();
  let enviats;
  await act(async () => { enviats = await xat.sendChatMessage({ id: 'fake-iaia', name: 'IAIA MarIA' }, 'Què és el Mercat?'); });
  await buida();
  act(() => { vi.runAllTimers(); });
  expect(enviats).toEqual([]);
  expect(respostaIAIA).not.toHaveBeenCalled();
  expect(missatges('fake-iaia')).toHaveLength(2);
});
