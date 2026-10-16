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

/* Gauntlet 261016 (prompt, Bloc 3.6; pla, Onada 1.2) · «Hi ha d'haver
   permanentment 4 converses visibles», també per a qui no s'ha registrat.
   Derogat «sense poble declarat, només les dues converses d'ajuda i cap
   comunitat»: sense amfitrió, la comunitat és la del poble de la llavor
   («Gent de la Torre») i Javi Llinares va a la cua. */
test('sense poble declarat, les quatre converses: «Gent de la Torre» (amb Avisos i General), la IAIA, Sóc de Poble i Javi', () => {
  munta();
  expect(xat.chatThreads.map((f) => f.id)).toEqual(['fake-poble', 'fake-poble-avisos', 'fake-poble-general', 'fake-iaia', 'fake-sdp', 'fake-javi']);
  expect(xat.comunitats).toHaveLength(1);
  expect(xat.comunitats[0].fil.name).toBe('Gent de la Torre');
  expect(xat.comunitats[0].fil.subjecte).toEqual({
    tipus: 'poble', id: 'la-torre-de-les-macanes', titol: 'Gent de la Torre', ruta: '/pobles/la-torre-de-les-macanes'
  });
  /* Els no llegits de la mostra no canvien: el missatge automàtic de Javi ja és llegit. */
  expect(xat.totalNoLlegits).toBe(2);
});

/* Gauntlet 261016 (Bloc 3.6.1) · Qui no s'ha registrat i obri el xat de Javi
   hi veu el missatge automàtic de l'ordre, literal, i res més: cap compositor
   (només lectura, amb l'avís de la mostra) i cap resposta inventada en nom
   d'una persona. */
test('Javi Llinares: el missatge automàtic literal, de només lectura, i cap enviament ni resposta simulada', async () => {
  munta();
  const fil = xat.chatThreads.find((f) => f.id === 'fake-javi');
  expect(fil).toMatchObject({
    name: 'Javi Llinares', tipus: 'persona', avatar_url: '/assets/fotos/javi-llinares-perfil-1200px.jpg', potEscriure: false, noLlegits: 0,
    ultimText: '«Este missatge és automàtic: per a poder parlar amb mi has de registrar-te.»'
  });
  expect(fil.avisNomesLectura).toBe("Si t'agrada el que veus, registra't per a entrar al xat de veritat!");
  expect(xat.getThreadMessages('fake-javi').map((m) => [m.text, m.sender, m.author, m.is_ai])).toEqual([
    ['«Este missatge és automàtic: per a poder parlar amb mi has de registrar-te.»', 'other', 'Javi Llinares', false]
  ]);
  let enviats;
  await act(async () => { enviats = await xat.sendChatMessage(fil, 'Hola, Javi'); });
  expect(enviats).toEqual([]);
  expect(vi.getTimerCount()).toBe(0);
  act(() => { vi.runAllTimers(); });
  expect(xat.getThreadMessages('fake-javi')).toHaveLength(1);
});

/* Auditoria adversarial 261016 (P2) · Un ?amb= amb Javi (la via «En privat»
   d'una targeta seua, /xat?amb=javillinares) portava qui no s'ha registrat al
   xat de mostra de l'entitat Sóc de Poble, amb compositor i resposta simulada.
   Javi, per id o àlies del padró pilot, va al seu xat de només lectura; un
   altre destinatari, al de sempre; mai pel nom. */
test('creaFil: Javi (per id o àlies) obri el seu xat de només lectura; la IAIA, el seu; la resta, el de Sóc de Poble', async () => {
  munta();
  for (const id of ['javillinares', '0001', 'javi', 'javi-llinares']) expect(await xat.creaFil(id)).toBe('fake-javi');
  expect(await xat.creaFil('ajuda:ia')).toBe('fake-iaia');
  expect(await xat.creaFil('ajuda:entitat')).toBe('fake-sdp');
  expect(await xat.creaFil('5a5a5a5a-0000-4000-8000-00000000000a')).toBe('fake-sdp');
  expect(await xat.creaFil('Javi Llinares')).toBe('fake-sdp');
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
