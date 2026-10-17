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
/* Gauntlet 261016_1530 (Bloc 3.6.1, ordre vigent) · «PROHIBIT duplicar Sóc
   de Poble»: derogat el directe de mostra amb l'entitat. 'fake-sdp' és ara la
   COMUNITAT de Sóc de Poble (Avisos, General i Beta Testers), com la de la
   llavor. L'ordre de la pantalla el posa la llista (actorsDelXat.js; vegeu
   XatSection.actorsPermanents.test.jsx). S'actualitza a posta. */
test('sense poble declarat, els quatre actors: la comunitat de Sóc de Poble, la de «Gent de la Torre», la IAIA i Javi; cap directe amb l’entitat', () => {
  munta();
  expect(xat.chatThreads.map((f) => f.id)).toEqual([
    'fake-sdp', 'fake-sdp-avisos', 'fake-sdp-general', 'fake-sdp-beta',
    'fake-poble', 'fake-poble-avisos', 'fake-poble-general', 'fake-iaia', 'fake-javi'
  ]);
  expect(xat.comunitats.map((c) => c.fil.name)).toEqual(['Sóc de Poble', 'Gent de la Torre']);
  const poble = xat.comunitats.find((c) => c.fil.subjecte?.tipus === 'poble');
  expect(poble.fil.subjecte).toEqual({
    tipus: 'poble', id: 'la-torre-de-les-macanes', titol: 'Gent de la Torre', ruta: '/pobles/la-torre-de-les-macanes'
  });
  /* Cap fil de Sóc de Poble que no siga de la seua comunitat. */
  expect(xat.chatThreads.filter((f) => f.name === 'Sóc de Poble').map((f) => f.tipus)).toEqual(['comunitat']);
  /* Els no llegits de la mostra no canvien: el de Sóc de Poble és ara als Avisos de la comunitat. */
  expect(xat.totalNoLlegits).toBe(2);
});

/* Revisió adversarial (Bloc 3.6.1) · El canal de proves porta el literal de
   l'ordre, «Beta Testers» (abans «Beta testers»): s'actualitza a posta. */
test('la comunitat de Sóc de Poble de la mostra: Avisos (la benvinguda de sempre, sense llegir i de només lectura), General i Beta Testers', () => {
  munta();
  const sdp = xat.comunitats.find((c) => c.fil.id === 'fake-sdp');
  expect(sdp.fil).toMatchObject({
    tipus: 'comunitat', name: 'Sóc de Poble', avatar_url: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png',
    subjecte: { tipus: 'entitat', id: 'socdepoble', ruta: '/socdepoble', titol: 'Sóc de Poble' }
  });
  expect(sdp.fills.map((f) => [f.id, f.tipus, f.name])).toEqual([
    ['fake-sdp-avisos', 'canal', 'Avisos'], ['fake-sdp-general', 'grup', 'General'], ['fake-sdp-beta', 'grup', 'Beta Testers']
  ]);
  expect(sdp.fills[2].title).toBe('Beta Testers');
  expect(sdp.noLlegits).toBe(1);
  expect(sdp.fills[0].potEscriure).toBe(false);
  expect(xat.getThreadMessages('fake-sdp-avisos').map((m) => m.text)).toEqual([
    'Benvingut a Sóc de Poble. Som una xarxa de pobles connectats.', "Registra't per a descobrir tot el que oferim."
  ]);
  expect(xat.getThreadMessages('fake-sdp-general')).toEqual([]);
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
   altre destinatari, al de sempre; mai pel nom.
   Gauntlet 261016_1530 · «La resta» és ara la comunitat de Sóc de Poble
   ('fake-sdp', que XatSection obri com a fitxa), no cap directe de mostra. */
test('creaFil: Javi (per id o àlies) obri el seu xat de només lectura; la IAIA, el seu; la resta, la comunitat de Sóc de Poble', async () => {
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
  /* Gauntlet 261016_1530 · Dues comunitats: la de Sóc de Poble i la del poble. */
  expect(xat.comunitats).toHaveLength(2);
  const comunitat = xat.comunitats.find((c) => c.fil.id === 'fake-poble');
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
  /* Gauntlet 261016_1530 · 'fake-sdp' ja és una comunitat: s'escriu al seu General. */
  const fil = xat.chatThreads.find((f) => f.id === 'fake-sdp-general');
  await act(async () => { await xat.sendChatMessage(fil, 'Hola'); });
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
