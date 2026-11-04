/* Torn 260930 · El Xat de mostra sense sessió: la comunitat del poble de
   l'amfitrió (T1) i la cita de les respostes (auditoria de Codex 2150, C6-X2). */
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useContext } from 'react';
import FakeChatOnboarding from './FakeChatOnboarding.jsx';
import { XatContext } from '../XatContext.jsx';
import { RouteParamsContext } from '../../../app/contexts/objectesDeContext.js';
import { MemoryRouter, useLocation } from '../../../app/contexts/RouterContext.jsx';
import Compositor from './Compositor.jsx';
import { IAIA_ID } from '../../../data/identitatsSeed.js';
import { oblidaEntitatDelProjecte, registraEntitatDelProjecte } from '../../../config/navigation.js';

const mocks = vi.hoisted(() => ({ externalConfig: {}, core: {}, directori: false, perfil: vi.fn() }));
vi.mock('../../../data/backendPort.js', () => ({
  teCapacitat: () => mocks.directori,
  loadPerfilPublic: (...args) => mocks.perfil(...args)
}));
vi.mock('../../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: [], ...mocks.core }) }));
vi.mock('../../../app/contexts/UIContext.jsx', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: mocks.externalConfig })
}));

let xat = null;
let pintats = [];
function Espia() {
  xat = useContext(XatContext);
  pintats.push({ status: xat.status, fils: xat.chatThreads.map((f) => f.id) });
  return null;
}
/* IDEA-56 (pla 261029_1605, Bloc F.2) · `props` passa al component (per
   exemple, `respostaIAIA`, el cervell local de la IAIA, injectable). */
const munta = (props = {}) => render(<FakeChatOnboarding originalContext={{ senseSessio: true, comunitats: [] }} {...props}><Espia /></FakeChatOnboarding>);
const buidaMicrotasques = () => act(async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); });

beforeEach(() => {
  vi.useFakeTimers();
  mocks.externalConfig = { dataMode: 'seed' };
  mocks.core = {};
  mocks.directori = false;
  mocks.perfil.mockReset();
  oblidaEntitatDelProjecte();
  xat = null;
  pintats = [];
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
  /* Onada 261030 (cicle 2) · El total del títol és la suma dels fils que
     pinta la llista: Avisos de Sóc de Poble, Avisos del poble i la IAIA. */
  expect(xat.totalNoLlegits).toBe(xat.chatThreads.reduce((suma, f) => suma + (f.noLlegits || 0), 0));
  expect(xat.totalNoLlegits).toBe(3);
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
test('creaFil: cada ajuda obri el seu xat; un destinatari desconegut mai obri Sóc de Poble', async () => {
  munta();
  for (const id of ['javillinares', '0001', 'javi', 'javi-llinares']) expect(await xat.creaFil(id)).toBe('fake-javi');
  expect(await xat.creaFil('ajuda:ia')).toBe('fake-iaia');
  expect(await xat.creaFil('ajuda:entitat')).toBe('fake-sdp');
  for (const id of ['socdepoble', 'soc-de-poble_official']) expect(await xat.creaFil(id)).toBe('fake-sdp');
  for (const id of ['5a5a5a5a-0000-4000-8000-00000000000a', 'Javi Llinares', '']) {
    await expect(xat.creaFil(id)).rejects.toMatchObject({ code: 'DESTINATARI_INVALID' });
  }
});

test('Oli de La Torre per slug i UUID obri un sol directe amb el seu nom i logotip', async () => {
  munta();
  const id = 'fake-entitat:3073b933-69fc-4c3e-80dc-b0df9c6b8391';
  await act(async () => {
    expect(await xat.creaFil('olidelatorre')).toBe(id);
    expect(await xat.creaFil('3073b933-69fc-4c3e-80dc-b0df9c6b8391')).toBe(id);
  });
  expect(xat.chatThreads.filter((fil) => fil.id === id)).toHaveLength(1);
  expect(xat.chatThreads.find((fil) => fil.id === id)).toMatchObject({
    tipus: 'directe', name: 'Oli de La Torre', avatar_url: '/assets/uploads/brain/oli_de_la_torre_logo.webp'
  });
  expect(xat.comunitats.map((c) => c.fil.id)).not.toContain(id);
  expect(xat.getThreadMessages(id)).toEqual([]);
  expect(xat.filCarregat(id)).toBe(true);
  expect(xat.hiHaMesAntics(id)).toBe(false);
  expect(mocks.perfil).not.toHaveBeenCalled();
});

const remot = () => { mocks.externalConfig = { dataMode: 'remote', backendUrl: 'https://node.example' }; mocks.directori = true; };
const RENTONAR = 'b2c87505-5555-4555-8555-555555555555';

test('R2C2X-01 · l’UUID remot del projecte declarat pel backend obri la comunitat sense duplicar Sóc de Poble', async () => {
  remot();
  const perfil = { id: 'a240e870-5555-4555-8555-555555555555', slug: 'socdepoble', tipus: 'entitat', nom: 'Sóc de Poble', avatar: '/socdepoble-remot.webp' };
  expect(registraEntitatDelProjecte(perfil)).toBe(true);
  mocks.perfil.mockResolvedValue(perfil);
  munta();
  await act(async () => { expect(await xat.creaFil(perfil.id)).toBe('fake-sdp'); });
  expect(mocks.perfil).toHaveBeenCalledWith(perfil.id, expect.objectContaining({ signal: expect.any(AbortSignal) }));
  expect(xat.chatThreads.filter(f => f.name === 'Sóc de Poble')).toMatchObject([{ id: 'fake-sdp', tipus: 'comunitat' }]);
  expect(xat.chatThreads.some(f => f.id.startsWith('fake-entitat:'))).toBe(false);
});

test.each(['seed', 'remote'])('R2C2X-03 · «En privat» de la IAIA per l’id del padró obri el seu únic fil en %s', async dataMode => {
  mocks.externalConfig = { dataMode };
  mocks.directori = true;
  munta();
  expect(await xat.creaFil(IAIA_ID)).toBe('fake-iaia');
  expect(xat.chatThreads.filter(f => f.id === 'fake-iaia')).toHaveLength(1);
  expect(xat.chatThreads.some(f => f.id.startsWith('fake-entitat:'))).toBe(false);
  expect(mocks.perfil).not.toHaveBeenCalled();
});

test('C2X-03/04 · Rentonar per slug i UUID usa el mateix DTO públic del port, nom i avatar; la llavor no el suplix', async () => {
  remot();
  // Contracte loadPerfilPublic: nom/avatar i tipus neutres; cap fila vendor.
  const perfil = { id: RENTONAR, slug: 'rentonar', tipus: 'grup', nom: 'El Rentonar públic', avatar: '/rentonar-remot.webp', publicat: true, propietari: false };
  mocks.perfil.mockImplementation(async clau => ['rentonar', RENTONAR].includes(clau) ? perfil : null);
  munta();
  await act(async () => {
    expect(await xat.creaFil('rentonar')).toBe(`fake-entitat:${RENTONAR}`);
    expect(await xat.creaFil(RENTONAR)).toBe(`fake-entitat:${RENTONAR}`);
  });
  expect(mocks.perfil.mock.calls.map(([clau]) => clau)).toEqual(['rentonar', RENTONAR]);
  expect(xat.chatThreads.filter(f => f.id.startsWith('fake-entitat:'))).toMatchObject([
    { id: `fake-entitat:${RENTONAR}`, name: 'El Rentonar públic', avatar_url: '/rentonar-remot.webp', potEscriure: false }
  ]);
  await expect(xat.creaFil('El Rentonar públic')).rejects.toMatchObject({ code: 'DESTINATARI_INVALID' });
});

test('C2X-03 · un perfil remot absent, erroni o d’una persona no cau mai a l’entitat del padró', async () => {
  remot();
  mocks.perfil.mockResolvedValueOnce(null).mockResolvedValueOnce({ tipus: 'persona', id: 'persona', nom: 'Oli de La Torre' }).mockRejectedValueOnce(new Error('Sense connexió'));
  munta();
  await expect(xat.creaFil('rentonar')).rejects.toMatchObject({ code: 'DESTINATARI_INVALID' });
  await expect(xat.creaFil('olidelatorre')).rejects.toMatchObject({ code: 'DESTINATARI_INVALID' });
  await expect(xat.creaFil('rentonar')).rejects.toThrow('Sense connexió');
  expect(xat.chatThreads.some(f => f.id.startsWith('fake-entitat:'))).toBe(false);
});

test('C2X-03 · sense directori remot no publica una empresa del padró com si fora del servidor', async () => {
  mocks.externalConfig = { dataMode: 'remote' };
  munta();
  await expect(xat.creaFil('olidelatorre')).rejects.toMatchObject({ code: 'DESTINATARI_INVALID' });
  expect(mocks.perfil).not.toHaveBeenCalled();
});

test('una altra entitat es resol pel port del directori sense crear cap fil remot', async () => {
  remot();
  mocks.perfil.mockResolvedValue({ id: 'org-ajuntament', slug: 'ajuntament', tipus: 'entitat', nom: 'Ajuntament de la Torre', avatar: '/ajuntament.png' });
  munta();
  await act(async () => { expect(await xat.creaFil('ajuntament')).toBe('fake-entitat:org-ajuntament'); });
  expect(mocks.perfil).toHaveBeenCalledWith('ajuntament', expect.objectContaining({ signal: expect.any(AbortSignal) }));
  expect(xat.chatThreads.at(-1)).toMatchObject({ name: 'Ajuntament de la Torre', avatar_url: '/ajuntament.png' });
  expect(xat.chatThreads.at(-1).subjecte).toBeUndefined();
});

test('la persona homònima i els errors de directori mai es convertixen en Sóc de Poble', async () => {
  remot();
  mocks.perfil.mockResolvedValueOnce({ id: 'persona', tipus: 'persona', nom: 'Sóc de Poble' }).mockRejectedValueOnce(new Error('Sense xarxa'));
  munta();
  await expect(xat.creaFil('persona')).rejects.toMatchObject({ code: 'DESTINATARI_INVALID' });
  await expect(xat.creaFil('desconeguda')).rejects.toThrow('Sense xarxa');
  expect(xat.chatThreads.filter((fil) => fil.id.startsWith('fake-entitat:'))).toEqual([]);
});

test('un altre id amb el slug socdepoble conserva el destinatari explícit de la URL', async () => {
  remot();
  mocks.perfil.mockResolvedValue({ id: 'org-altre-poble', slug: 'socdepoble', tipus: 'entitat', nom: 'Una altra entitat' });
  munta();
  await act(async () => { expect(await xat.creaFil('org-altre-poble')).toBe('fake-entitat:org-altre-poble'); });
  expect(xat.chatThreads.at(-1)).toMatchObject({ name: 'Una altra entitat', tipus: 'directe' });
});

test('desmuntar avorta la consulta del directori i no crea un fil tardà', async () => {
  remot();
  let resol;
  mocks.perfil.mockImplementation(() => new Promise((r) => { resol = r; }));
  const { unmount } = munta();
  const pendent = xat.creaFil('festes');
  const { signal } = mocks.perfil.mock.calls[0][1];
  unmount();
  expect(signal.aborted).toBe(true);
  resol({ id: 'festes', tipus: 'grup', nom: 'Festes' });
  expect(await pendent).toBeNull();
});

test('canviar de backend avorta la lectura anterior i buida els directes de mostra', async () => {
  remot();
  let resol;
  mocks.perfil.mockResolvedValueOnce({ id: 'org-oli', slug: 'olidelatorre', tipus: 'entitat', nom: 'Oli de La Torre', avatar: '/oli-remot.webp' })
    .mockImplementationOnce(() => new Promise((r) => { resol = r; }));
  const { rerender } = munta();
  await act(async () => { await xat.creaFil('olidelatorre'); });
  const pendent = xat.creaFil('festes');
  const { signal } = mocks.perfil.mock.calls[1][1];
  mocks.externalConfig = { backendUrl: 'https://altre-node.example' };
  rerender(<FakeChatOnboarding originalContext={{ senseSessio: true }}><Espia /></FakeChatOnboarding>);
  expect(signal.aborted).toBe(true);
  resol({ id: 'festes', tipus: 'grup', nom: 'Festes de l’altre poble' });
  expect(await pendent).toBeNull();
  expect(xat.chatThreads.some((fil) => fil.id.startsWith('fake-entitat:'))).toBe(false);
});

const mostraDeRuta = (threadId) => (
  <RouteParamsContext.Provider value={{ threadId }}>
    <FakeChatOnboarding originalContext={{ senseSessio: true }}><Espia /></FakeChatOnboarding>
  </RouteParamsContext.Provider>
);

test('recarregar la URL d’Oli de La Torre reconstruïx el destinatari de només lectura, sense missatges inventats', async () => {
  const id = 'fake-entitat:3073b933-69fc-4c3e-80dc-b0df9c6b8391';
  const anterior = munta();
  await act(async () => { await xat.creaFil('olidelatorre'); });
  await act(async () => { await xat.sendChatMessage(xat.chatThreads.find((f) => f.id === id), 'Només d’esta mostra'); });
  expect(xat.getThreadMessages(id)).toEqual([]);
  anterior.unmount();
  pintats = [];
  render(mostraDeRuta(id));
  await buidaMicrotasques();
  expect(pintats[0].status).toBe('loading');
  expect(xat.status).toBe('ready');
  expect(xat.chatThreads.find((f) => f.id === id)).toMatchObject({ name: 'Oli de La Torre', avatar_url: '/assets/uploads/brain/oli_de_la_torre_logo.webp' });
  expect(xat.getThreadMessages(id)).toEqual([]);
  expect(mocks.perfil).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});

test('la URL d’una altra entitat espera la mateixa resolució pública del directori', async () => {
  const id = 'fake-entitat:org-festes';
  remot();
  let resol;
  mocks.perfil.mockImplementation(() => new Promise((r) => { resol = r; }));
  render(mostraDeRuta(id));
  expect(xat.status).toBe('loading');
  expect(xat.llistaFresca).toBe(false);
  expect(mocks.perfil).toHaveBeenCalledWith('org-festes', expect.objectContaining({ signal: expect.any(AbortSignal) }));
  await act(async () => { resol({ id: 'org-festes', tipus: 'grup', nom: 'Comissió de Festes', avatar: '/festes.png' }); });
  expect(xat.status).toBe('ready');
  expect(xat.llistaFresca).toBe(true);
  expect(xat.chatThreads.find((f) => f.id === id)).toMatchObject({ name: 'Comissió de Festes', avatar_url: '/festes.png' });
  expect(xat.getThreadMessages(id)).toEqual([]);
});

test('una fallada de xarxa en restaurar la URL queda com a avís; no com un 404 ni una càrrega eterna', async () => {
  remot();
  mocks.perfil.mockRejectedValue(new Error('Directori sense connexió'));
  render(mostraDeRuta('fake-entitat:org-festes'));
  await buidaMicrotasques();
  expect(xat.status).toBe('ready');
  expect(xat.llistaFresca).toBe(false);
  expect(xat.avisLlista).toBe('Directori sense connexió');
  expect(xat.chatThreads.some((fil) => fil.id === 'fake-entitat:org-festes')).toBe(false);
});

test('una URL desconeguda no inventa cap identitat ni resta restaurant per sempre', async () => {
  render(mostraDeRuta('fake-entitat:desconeguda'));
  await buidaMicrotasques();
  expect(xat.status).toBe('ready');
  expect(xat.llistaFresca).toBe(true);
  expect(xat.avisLlista).toBeNull();
  expect(xat.chatThreads.some((fil) => fil.id === 'fake-entitat:desconeguda')).toBe(false);
});

test('canviar d’amfitrió oblida els textos locals i restaura l’entitat de només lectura', async () => {
  const id = 'fake-entitat:3073b933-69fc-4c3e-80dc-b0df9c6b8391';
  const { rerender } = render(mostraDeRuta(id));
  await buidaMicrotasques();
  await act(async () => { await xat.sendChatMessage(xat.chatThreads.find((f) => f.id === 'fake-poble-general'), 'Text de l’altre amfitrió'); });
  expect(xat.getThreadMessages('fake-poble-general')).toHaveLength(1);
  mocks.externalConfig = { dataMode: 'seed', backendUrl: 'https://altre-node.example' };
  rerender(mostraDeRuta(id));
  await buidaMicrotasques();
  expect(xat.chatThreads.find((f) => f.id === id)).toMatchObject({ name: 'Oli de La Torre' });
  expect(xat.getThreadMessages(id)).toEqual([]);
  expect(xat.getThreadMessages('fake-poble-general')).toEqual([]);
  expect(vi.getTimerCount()).toBe(0);
});

test('C2X-06 · la UI de l’entitat conserva el nom i mostra l’avís d’entrar; cap compositor, enviament ni resposta amb nom d’empresa', async () => {
  remot();
  mocks.perfil.mockResolvedValue({ id: 'org-oli', slug: 'olidelatorre', tipus: 'entitat', nom: 'Oli de La Torre', avatar: '/oli.webp' });
  const enviaRemot = vi.fn(), creaRemot = vi.fn();
  function Pantalla() {
    const context = useContext(XatContext);
    xat = context;
    const fil = context.chatThreads.find(f => f.id === 'fake-entitat:org-oli');
    return fil ? <><h2>{fil.name}</h2><Compositor fil={fil} valor="" t={(_, reserva) => reserva} /></> : null;
  }
  render(<FakeChatOnboarding originalContext={{ senseSessio: true, sendChatMessage: enviaRemot, creaFil: creaRemot }}><Pantalla /></FakeChatOnboarding>);
  await act(async () => { await xat.creaFil('olidelatorre'); });
  expect(screen.getByRole('heading', { name: 'Oli de La Torre' })).toBeTruthy();
  expect(screen.getByRole('status').textContent).toContain("registra't per a entrar al xat de veritat");
  expect(screen.queryByRole('textbox')).toBeNull();
  const fil = xat.chatThreads.find(f => f.id === 'fake-entitat:org-oli');
  await act(async () => {
    expect(await xat.sendChatMessage(fil, 'Hola')).toEqual([]);
    expect(await xat.sendChatMessage({ ...fil, potEscriure: true }, 'No es pot forçar')).toEqual([]);
    vi.runAllTimers();
  });
  expect(xat.getThreadMessages(fil.id)).toEqual([]);
  expect(enviaRemot).not.toHaveBeenCalled(); expect(creaRemot).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});

test('C2X-03 · una URL antiga amb slug es canonitza al fil remot únic després de resoldre el DTO', async () => {
  remot();
  mocks.perfil.mockResolvedValue({ id: RENTONAR, slug: 'rentonar', tipus: 'grup', nom: 'El Rentonar públic', avatar: '/rentonar.webp' });
  let ruta;
  function Ubicacio() { ruta = useLocation().pathname; return <Espia />; }
  render(<MemoryRouter initialEntries={['/xat/fake-entitat%3Arentonar']}>
    <RouteParamsContext.Provider value={{ threadId: 'fake-entitat:rentonar' }}>
      <FakeChatOnboarding originalContext={{ senseSessio: true }}><Ubicacio /></FakeChatOnboarding>
    </RouteParamsContext.Provider>
  </MemoryRouter>);
  await buidaMicrotasques();
  expect(ruta).toBe(`/xat/${encodeURIComponent(`fake-entitat:${RENTONAR}`)}`);
  expect(xat.chatThreads.filter(f => f.id.startsWith('fake-entitat:'))).toHaveLength(1);
  expect(xat.chatThreads.at(-1).name).toBe('El Rentonar públic');
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

/* IDEA-56 (pla 261029_1605, Bloc F.2) · La IAIA respon amb el seu cervell
   local (injectat ací), en microtasques i sense temporitzador: es buiden
   abans de mirar els seq (actualitzat a posta). */
test('una resposta simulada conserva la cita, i els seq no es repetixen en dos enviaments seguits', async () => {
  munta({ respostaIAIA: async () => 'R' });
  const fil = xat.chatThreads.find((f) => f.id === 'fake-iaia');
  await act(async () => {
    await xat.sendChatMessage(fil, 'Primer', { respostaA: 'm1' });
    await xat.sendChatMessage(fil, 'Segon');
  });
  const propis = xat.getThreadMessages('fake-iaia').filter((m) => m.sender === 'me');
  expect(propis.map((m) => [m.text, m.respostaA])).toEqual([['Primer', 'm1'], ['Segon', null]]);
  await buidaMicrotasques();
  act(() => { vi.runAllTimers(); });
  const seqs = xat.getThreadMessages('fake-iaia').map((m) => m.seq);
  expect(xat.getThreadMessages('fake-iaia').filter((m) => m.text === 'R')).toHaveLength(2);
  expect(new Set(seqs).size).toBe(seqs.length);
});

/* P1-52 (Fita 16 del Llibre Mestre, 261029) · La resposta simulada diu el
   literal del Mestre, pla i sense pompositat. El traductor d'esta prova torna
   la reserva: és la del component la que es fixa ací; la clau
   section.xat.fake.reply, en les cinc llengües, la fixa i18n.claus.test.js.
   IDEA-56 (Bloc F.2) · Al fil de la IAIA ara respon el seu cervell local:
   el literal es prova al General de la comunitat (actualitzat a posta). */
test('la resposta simulada és el literal del Mestre (P1-52)', async () => {
  munta();
  const fil = xat.chatThreads.find((f) => f.id === 'fake-sdp-general');
  await act(async () => { await xat.sendChatMessage(fil, 'Hola'); });
  act(() => { vi.runAllTimers(); });
  const resposta = xat.getThreadMessages('fake-sdp-general').at(-1);
  expect(resposta).toMatchObject({ sender: 'other', author: fil.name, is_ai: false });
  expect(resposta.text).toBe('Açò és una simulació. Si vols guardar la conversa, has de registrar-te, i ja està.');
});

test('desmuntar cancel·la les respostes pendents', async () => {
  const { unmount } = munta();
  /* Gauntlet 261016_1530 · 'fake-sdp' ja és una comunitat: s'escriu al seu General. */
  const fil = xat.chatThreads.find((f) => f.id === 'fake-sdp-general');
  await act(async () => { await xat.sendChatMessage(fil, 'Hola'); });
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

/* Gauntlet 261030 (cicle 2, G2) · Llegir un fil de mostra (la conversa crida
   marcaVist quan una bombolla entra en pantalla) en baixa els no llegits a 0,
   i el títol (totalNoLlegits) baixa en el MATEIX valor del context que la
   insígnia del fil i la de la seua comunitat. Només en este estat: muntar-lo
   de nou torna a la mostra de sempre. */
const noLlegitsDe = (valor, id) => valor.chatThreads.find((f) => f.id === id).noLlegits;
const comunitatDe = (valor, id) => valor.comunitats.find((c) => c.fil.id === id).noLlegits;

test('G2 · llegir el fil de la IAIA de mostra en posa el no llegit a 0 i el títol baixa alhora', () => {
  munta();
  expect(xat.totalNoLlegits).toBe(3);
  expect(noLlegitsDe(xat, 'fake-iaia')).toBe(1);
  /* Només la primera bombolla a la vista: encara en queda una per llegir. */
  act(() => { xat.marcaVist('fake-iaia', 1); });
  expect(noLlegitsDe(xat, 'fake-iaia')).toBe(1);
  expect(xat.totalNoLlegits).toBe(3);
  act(() => { xat.marcaVist('fake-iaia', 2); });
  const despres = xat;
  expect(noLlegitsDe(despres, 'fake-iaia')).toBe(0);
  expect(despres.totalNoLlegits).toBe(2);
  /* Una marca més vella no el torna a pujar. */
  act(() => { xat.marcaVist('fake-iaia', 1); });
  expect(noLlegitsDe(xat, 'fake-iaia')).toBe(0);
  expect(xat.totalNoLlegits).toBe(2);
});

test('G2 · llegir els Avisos d’una comunitat de mostra baixa el fil, la insígnia de la comunitat i el títol alhora', () => {
  munta();
  act(() => { xat.marcaVist('fake-sdp-avisos', 2); });
  const valor = xat;
  expect(noLlegitsDe(valor, 'fake-sdp-avisos')).toBe(0);
  expect(comunitatDe(valor, 'fake-sdp')).toBe(0);
  expect(comunitatDe(valor, 'fake-poble')).toBe(1);
  expect(valor.totalNoLlegits).toBe(2);
  act(() => { xat.marcaVist('fake-poble-avisos', 1); });
  expect(comunitatDe(xat, 'fake-poble')).toBe(0);
  expect(xat.totalNoLlegits).toBe(1);
});

test('G2 · «Marcar com a llegides» de la selecció fa la mateixa marca local i diu quantes', () => {
  munta();
  let marcades = null;
  act(() => { marcades = xat.marcaLlegides(['fake-sdp-avisos', 'fake-sdp-general', 'fake-iaia']); });
  expect(marcades).toBe(2);
  expect(noLlegitsDe(xat, 'fake-sdp-avisos')).toBe(0);
  expect(noLlegitsDe(xat, 'fake-iaia')).toBe(0);
  expect(xat.totalNoLlegits).toBe(1);
  /* Ja llegides: cap més. */
  act(() => { marcades = xat.marcaLlegides(['fake-sdp-avisos', 'fake-iaia']); });
  expect(marcades).toBe(0);
});

test('G2 · la lectura de la mostra no es guarda: muntar-la de nou torna als tres no llegits', () => {
  const { unmount } = munta();
  act(() => { xat.marcaVist('fake-iaia', 2); });
  expect(xat.totalNoLlegits).toBe(2);
  unmount();
  munta();
  expect(xat.totalNoLlegits).toBe(3);
  expect(noLlegitsDe(xat, 'fake-iaia')).toBe(1);
});
