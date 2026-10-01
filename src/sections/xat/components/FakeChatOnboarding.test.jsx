/* Torn 260930 · El Xat de mostra sense sessió: la comunitat del poble de
   l'amfitrió (T1) i la cita de les respostes (auditoria de Codex 2150, C6-X2). */
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useContext } from 'react';
import FakeChatOnboarding from './FakeChatOnboarding.jsx';
import { XatContext } from '../XatContext.jsx';

const mocks = vi.hoisted(() => ({ externalConfig: {} }));
vi.mock('../../../app/contexts/UIContext.jsx', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: mocks.externalConfig })
}));

let xat = null;
function Espia() {
  xat = useContext(XatContext);
  return null;
}
const munta = () => render(<FakeChatOnboarding originalContext={{ senseSessio: true, comunitats: [] }}><Espia /></FakeChatOnboarding>);

beforeEach(() => {
  vi.useFakeTimers();
  mocks.externalConfig = {};
  xat = null;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

test('sense poble declarat, només les dues converses d\'ajuda i cap comunitat', () => {
  munta();
  expect(xat.chatThreads.map((f) => f.id)).toEqual(['fake-iaia', 'fake-sdp']);
  expect(xat.comunitats).toEqual([]);
});

test('amb poble, la comunitat del poble amb Avisos (només lectura, amb la benvinguda) i General', () => {
  mocks.externalConfig = { poble: 'la-torre-de-les-macanes', nomPoble: 'Gent de la Torre' };
  munta();
  expect(xat.comunitats).toHaveLength(1);
  const [comunitat] = xat.comunitats;
  expect(comunitat.fil.name).toBe('Gent de la Torre');
  expect(comunitat.fil.subjecte).toEqual({
    tipus: 'poble', id: 'la-torre-de-les-macanes', titol: 'Gent de la Torre', ruta: '/pobles/la-torre-de-les-macanes'
  });
  expect(comunitat.fills.map((f) => [f.id, f.tipus])).toEqual([['fake-poble-avisos', 'canal'], ['fake-poble-general', 'grup']]);
  expect(comunitat.fills[0].potEscriure).toBe(false);
  const [benvinguda] = xat.getThreadMessages('fake-poble-avisos');
  expect(benvinguda.text).toContain('Gent de la Torre');
  expect(xat.getThreadMessages('fake-poble-general')).toEqual([]);
});

test('una resposta simulada conserva la cita, i els seq no es repetixen en dos enviaments seguits', async () => {
  munta();
  const fil = xat.chatThreads.find((f) => f.id === 'fake-iaia');
  await act(async () => {
    await xat.sendChatMessage(fil, 'Primer', { respostaA: 'm1' });
    await xat.sendChatMessage(fil, 'Segon');
  });
  const propis = xat.getThreadMessages('fake-iaia').filter((m) => m.sender === 'me');
  expect(propis.map((m) => [m.text, m.respostaA])).toEqual([['Primer', 'm1'], ['Segon', null]]);
  act(() => { vi.runAllTimers(); });
  const seqs = xat.getThreadMessages('fake-iaia').map((m) => m.seq);
  expect(new Set(seqs).size).toBe(seqs.length);
});

test('desmuntar cancel·la les respostes pendents', async () => {
  const { unmount } = munta();
  const fil = xat.chatThreads.find((f) => f.id === 'fake-sdp');
  await act(async () => { await xat.sendChatMessage(fil, 'Hola'); });
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
