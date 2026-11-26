/* Onada v1.2.25 · Lot 1 de Claude · XAT-B01 i XAT-B02 (síntesi Quíntuple
   D01–D15, propostes atòmiques 2 i 9), al proveïdor real amb el port simulat.
   L'arnés és el de XC-03 (XatContext.cicle261025.test.jsx), el mateix del
   repro eliminaPendent.repro de l'auditoria:
     · XAT-B01 · «Elimina per a tothom» o «Elimina per a mi» sobre una
       bombolla pròpia encara 'pendent' la cancel·la. Sense xarxa: ni en
       tornar la xarxa ('online') ni amb el sondeig no hi ha cap crida a
       enviaMissatge, i el missatge no torna. Si el transport ja volava, el
       missatge ja pot ser al servidor: des que es cancel·la no es pinta mai
       amb el text, i s'elimina per a tothom quan el magatzem el té (l'ACK
       tardà o una lectura, abans o després de la fallada); sense ACK, una
       lectura del fil diu si el servidor el té. Si l'eliminació falla per
       xarxa, per temps o per la sessió, es torna a provar; si falla del tot,
       no s'amaga: torna amb el text i la persona rep l'avís en la seua llengua.
     · XAT-B02 · Mentre hi ha cap bombolla pròpia sense ACK (pendent o en
       error), cap eliminació per a tothom encara per fer o cap bombolla en
       repòs (R22), el registre de l'estat pendent ho sap (hiHaEstatPendent),
       i la recuperació de desplegament no recarrega sola.
   Ronda 1: escrites ABANS de la correcció. Ronda 2 (Gauntlet v1.2.25: T1,
   T2, T3, T5, VS-F1 a VS-F4): a la base 604975967b04 en cauen 25 de 27 i amb
   el pegat de la ronda 1, 17 de 27 (totes les que proven una troballa). Les
   que hi passen guarden la correcció mateixa: un enviament nou amb el mateix
   id, «Elimina per a mi» d'un missatge ja enviat, un missatge que arriba ja
   esborrat, i les de la ronda 1 que el pegat d'aquella ronda ja complia. */
import { StrictMode, useLayoutEffect } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../host.js';
import { XatProvider, useXat } from './XatContext.jsx';
import { buidaEstatsPendents, hiHaEstatPendent } from '../../pwa/estatsPendents.js';
import { esborraSessio } from '../../data/identitat.js';

const mock = vi.hoisted(() => ({
  session: { currentUser: { id: 'A' }, generacio: 1 }, actorKey: 'persona::A', pathname: '/xat', showToast: vi.fn(),
  language: undefined, recuperable: false,
  loadFils: vi.fn(), loadMissatges: vi.fn(), enviaMissatge: vi.fn(), marcaLlegit: vi.fn(),
  creaFilDirecte: vi.fn(), carregaMembres: vi.fn(), subscribeToXat: vi.fn(), unsubscribeFromXat: vi.fn(),
  obriFilDePagina: vi.fn(), teCapacitat: vi.fn(), publicaAdjuntXat: vi.fn(),
  /* El motor d'accions diferit (creaOpcionsMotorAccions.js) els importa del port. */
  carregaAccionsMissatges: vi.fn(), alternaReaccio: vi.fn(), alternaDestacat: vi.fn(), alternaFixat: vi.fn(),
  eliminaPerAMi: vi.fn(), eliminaPerATothom: vi.fn(), urlAdjuntXat: vi.fn()
}));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => mock.session }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorKey: mock.actorKey, identitats: undefined }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useLocation: () => ({ pathname: mock.pathname }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, alternativa) => alternativa, language: mock.language }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mock.showToast }) }));
vi.mock('../../data/backendPort.js', () => mock);
/* R22 · Si la sessió perduda sense eixir es pot recuperar (XatContext.bombollesSessio.test.jsx). */
vi.mock('../../data/identitat.js', async (importOriginal) => ({ ...await importOriginal(), sessioRecuperable: () => mock.recuperable }));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
/* v1.2.25 · Poliment P2 de Codex (Guàrdia #7) · El diccionari de l'avís arriba per un import diferit, que en una
   xarxa lenta tarda: amb `diccionari.porta` (una promesa), el text no arriba fins que la prova l'obri. Sense porta,
   el mòdul de sempre. */
const diccionari = vi.hoisted(() => ({ porta: null }));
vi.mock('./i18nAccionsMissatgeXat.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    textAccioMissatgeXat: (...args) => (diccionari.porta
      ? diccionari.porta.then(() => real.textAccioMissatgeXat(...args))
      : real.textAccioMissatgeXat(...args))
  };
});

const CONFIG = { backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a' };
/* L'RPC d'eliminació només accepta UUID (rebutEliminacioMissatge.js). */
const FIL = 'aaaaaaaa-0000-4000-8000-00000000000a';
const TEXT = 'Missatge equivocat';
const msg = (seq, usuariId = 'X', extra = {}) => ({ id: `m-${seq}`, filId: FIL, usuariId, text: `t${seq}`, seq, creatAl: '2026-11-25T05:00:00Z', ...extra });
const fil = (extra = {}) => ({ id: FIL, titol: 'A', altresNoms: [], ultimSeq: 1, llegitFinsSeq: 1, llegitPelsAltresFinsSeq: 0, noLlegits: 0, ultimAutorId: 'X', ultimAl: '2026-11-25T05:00:00Z', ...extra });
const xarxa = () => Object.assign(new Error('Failed to fetch'), { code: 'XARXA', retriable: true });
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };

/* `vigila`: des que la persona l'elimina, cap render no ha de pintar el text. */
let value;
let vigila;
let textPintat;
function Sonda() {
  const actual = useXat();
  if (vigila && actual.chatMessages.some((m) => m.text === TEXT)) textPintat = true;
  useLayoutEffect(() => { value = actual; });
  value = actual;
  return null;
}
const arbre = () => <StrictMode><XatProvider config={CONFIG}><Sonda /></XatProvider></StrictMode>;
const pas = async (ms) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const assenta = async () => { for (let i = 0; i < 10; i += 1) await pas(0); };
const delMissatge = (id) => value.chatMessages.filter((m) => m.id === id);

/* El «servidor» de missatges (xat_historial i xat_nous), com a XC-03. */
let servidor;
let callbackCanal;
let espiaLinia = null;
const senseXarxa = () => { espiaLinia = vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false); return espiaLinia; };
const lecturaDelServidor = async (_, opcions = {}) => (opcions.despresDeSeq != null
  ? servidor.filter((m) => m.seq > opcions.despresDeSeq).slice(0, 100)
  : servidor.slice(-(opcions.limit ?? 50))).map((m) => ({ ...m }));
/* Sense xarxa, tampoc no hi ha cap lectura bona. */
const lecturesSenseXarxa = () => mock.loadMissatges.mockImplementation(async () => { throw xarxa(); });
const lecturesAmbXarxa = () => mock.loadMissatges.mockImplementation(lecturaDelServidor);
beforeEach(() => {
  vi.resetAllMocks();
  buidaEstatsPendents();
  diccionari.porta = null;
  vigila = false;
  textPintat = false;
  servidor = [msg(1)];
  callbackCanal = null;
  mock.session = { currentUser: { id: 'A' }, generacio: 1 };
  mock.actorKey = 'persona::A';
  mock.language = undefined;
  mock.recuperable = false;
  mock.loadFils.mockImplementation(async () => [fil({ ultimSeq: servidor.at(-1)?.seq ?? 0 })]);
  lecturesAmbXarxa();
  mock.marcaLlegit.mockResolvedValue({ llegitFinsSeq: 1, rebutFinsSeq: 1 });
  mock.subscribeToXat.mockImplementation(async (filId, cb) => { callbackCanal = cb; return { subscription: `sub-${filId}`, error: null }; });
  mock.unsubscribeFromXat.mockResolvedValue(null);
  mock.teCapacitat.mockReturnValue(true);
  mock.carregaAccionsMissatges.mockResolvedValue({ missatges: [], teMes: false, seguentId: null });
  mock.eliminaPerATothom.mockImplementation(async ({ filId, missatgeId }) => ({
    filId, missatgeId, esborrat: true, esborratAl: '2026-11-25T05:01:00.000Z', reaccions: [], destacat: false, fixat: false, amagat: false
  }));
});
afterEach(() => { cleanup(); vi.useRealTimers(); espiaLinia?.mockRestore(); espiaLinia = null; buidaEstatsPendents(); });

async function obert() {
  const vista = render(arbre());
  await waitFor(() => expect(value.status).toBe('ready'));
  vi.useFakeTimers();
  act(() => value.obriFil(FIL));
  await act(async () => { await vi.dynamicImportSettled(); });
  await pas(0);
  expect(value.chatMessages.map((m) => m.seq)).toEqual([1]);
  return vista;
}

/* Una bombolla pròpia amb el transport en vol: l'ACK (o la fallada) el dona la prova. */
async function ambTransportEnVol() {
  const vista = await obert();
  const transport = deferred();
  mock.enviaMissatge.mockImplementation(() => transport.promise);
  let promesa;
  act(() => { promesa = value.sendChatMessage({ id: FIL }, TEXT); });
  await pas(0);
  expect(mock.enviaMissatge).toHaveBeenCalledTimes(1);
  const pendent = value.chatMessages.at(-1);
  expect(pendent).toMatchObject({ text: TEXT, estatEnviament: 'pendent' });
  return { transport, promesa, pendent, cos: mock.enviaMissatge.mock.calls[0][1], vista };
}
/* Sense xarxa, la bombolla ja ha fet un intent i espera que torne. */
async function esperantLaXarxa() {
  await obert();
  const linia = senseXarxa();
  mock.enviaMissatge.mockRejectedValue(xarxa());
  let promesa;
  act(() => { promesa = value.sendChatMessage({ id: FIL }, TEXT); });
  await pas(30000);
  const pendent = value.chatMessages.at(-1);
  expect(pendent).toMatchObject({ text: TEXT, estatEnviament: 'pendent' });
  expect(mock.enviaMissatge).toHaveBeenCalledTimes(1);
  return { linia, promesa, pendent };
}
/* Torna la xarxa: el que s'enviara ara arribaria al servidor. */
async function tornaLaXarxa(linia, promesa) {
  mock.enviaMissatge.mockReset();
  mock.enviaMissatge.mockImplementation(async (_, cos) => {
    servidor.push({ ...msg(2, 'A'), id: cos.id, text: cos.text });
    return { ...msg(2, 'A'), id: cos.id, text: cos.text };
  });
  linia.mockReturnValue(true);
  act(() => { window.dispatchEvent(new Event('online')); });
  await pas(0);
  let resultat;
  await act(async () => { resultat = await promesa; });
  return resultat;
}
async function elimina(id) {
  let resposta;
  await act(async () => { resposta = await value.eliminaPerATothom(id); });
  vigila = true;
  return resposta;
}
const desaAlServidor = (cos) => { servidor.push({ ...msg(2, 'A'), id: cos.id, text: cos.text }); };
const ack = (cos) => ({ ...msg(2, 'A'), id: cos.id, text: cos.text });
const nous = () => act(() => { callbackCanal?.(null, { tipus: 'nous', filId: FIL }); });
const esborrat = (seq = 2) => [expect.objectContaining({ seq, text: '', esborrat: true })];

describe('XAT-B01 · «Elimina per a tothom» sobre una bombolla pendent la cancel·la', () => {
  it('sense xarxa: cap crida a enviaMissatge després d’eliminar-la, ni en tornar la xarxa, i el missatge no torna', async () => {
    const { linia, promesa, pendent } = await esperantLaXarxa();
    expect(await elimina(pendent.id)).toMatchObject({ estat: 'local', filId: FIL, missatgeId: pendent.id });
    expect(delMissatge(pendent.id)).toEqual([]);
    expect(await tornaLaXarxa(linia, promesa)).toEqual([]);
    /* El sondeig, el canal i tornar a la pàgina tampoc no l'envien. */
    nous();
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    await pas(60000);
    expect(mock.enviaMissatge).not.toHaveBeenCalled();
    expect(mock.eliminaPerATothom).not.toHaveBeenCalled();
    expect(delMissatge(pendent.id)).toEqual([]);
    expect(textPintat).toBe(false);
    /* La lectura del fil ha dit que el servidor no el té: res pendent. */
    expect(hiHaEstatPendent()).toBe(false);
  });

  it('amb el transport en vol: l’ACK tardà no el pinta mai amb el text i l’elimina per a tothom al servidor', async () => {
    const { transport, promesa, pendent, cos } = await ambTransportEnVol();
    await elimina(pendent.id);
    expect(delMissatge(pendent.id)).toEqual([]);
    desaAlServidor(cos);
    let resultat;
    await act(async () => { transport.resolve(ack(cos)); resultat = await promesa; });
    expect(resultat).toEqual([]);
    await assenta();
    expect(mock.eliminaPerATothom).toHaveBeenCalledTimes(1);
    expect(mock.eliminaPerATothom.mock.calls[0][0]).toEqual({ filId: FIL, missatgeId: pendent.id });
    /* La lectura següent el porta del servidor: continua sense text. */
    nous();
    await assenta();
    expect(delMissatge(pendent.id)).toEqual(esborrat());
    expect(textPintat).toBe(false);
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(1);
    expect(hiHaEstatPendent()).toBe(false);
  });

  it('amb el transport en vol i l’ACK perdut: la lectura del fil el porta del servidor i s’elimina per a tothom sense pintar-lo', async () => {
    const { transport, promesa, pendent, cos } = await ambTransportEnVol();
    await elimina(pendent.id);
    /* El servidor l'ha desat, però la resposta no arriba. */
    desaAlServidor(cos);
    act(() => { transport.reject(xarxa()); });
    /* Cap reintent: la persona l'ha cancel·lat. */
    await pas(30000);
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(1);
    let resultat;
    await act(async () => { resultat = await promesa; });
    expect(resultat).toEqual([]);
    await assenta();
    expect(mock.eliminaPerATothom).toHaveBeenCalledTimes(1);
    expect(mock.eliminaPerATothom.mock.calls[0][0]).toEqual({ filId: FIL, missatgeId: pendent.id });
    expect(delMissatge(pendent.id)).toEqual(esborrat());
    expect(textPintat).toBe(false);
    expect(hiHaEstatPendent()).toBe(false);
  });

  it('T1 · amb l’ACK perdut i la lectura que el porta ABANS de la fallada, en un fil quiet: s’elimina per a tothom', async () => {
    const { transport, promesa, pendent, cos } = await ambTransportEnVol();
    await elimina(pendent.id);
    desaAlServidor(cos);
    nous();
    await assenta();
    act(() => { transport.reject(xarxa()); });
    await act(async () => { await promesa; });
    await pas(120000);
    await assenta();
    expect(mock.eliminaPerATothom).toHaveBeenCalledTimes(1);
    expect(mock.eliminaPerATothom.mock.calls[0][0]).toEqual({ filId: FIL, missatgeId: pendent.id });
    expect(delMissatge(pendent.id)).toEqual(esborrat());
    expect(textPintat).toBe(false);
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(1);
    expect(hiHaEstatPendent()).toBe(false);
  });

  it('T3 · amb la lectura que el porta ABANS de l’ACK tardà: mai no es pinta amb el text i s’elimina una sola vegada', async () => {
    const { transport, promesa, pendent, cos } = await ambTransportEnVol();
    await elimina(pendent.id);
    desaAlServidor(cos);
    nous();
    await assenta();
    expect(textPintat).toBe(false);
    expect(delMissatge(pendent.id)).toEqual(esborrat());
    await act(async () => { transport.resolve(ack(cos)); await promesa; });
    await assenta();
    expect(mock.eliminaPerATothom).toHaveBeenCalledTimes(1);
    expect(delMissatge(pendent.id)).toEqual(esborrat());
    expect(textPintat).toBe(false);
    expect(hiHaEstatPendent()).toBe(false);
  });

  it('amb el transport en vol i sense ACK, si el servidor no l’havia desat: cap intent d’eliminació, cap error i cap marca', async () => {
    const { transport, promesa, pendent } = await ambTransportEnVol();
    await elimina(pendent.id);
    expect(hiHaEstatPendent()).toBe(true);
    act(() => { transport.reject(xarxa()); });
    await pas(30000);
    await act(async () => { await promesa; });
    await assenta();
    expect(hiHaEstatPendent()).toBe(false);
    /* Arriba un altre missatge del fil: el magatzem canvia, però el cancel·lat no hi és. */
    servidor.push(msg(2, 'X'));
    nous();
    await assenta();
    expect(value.chatMessages.map((m) => m.seq)).toEqual([1, 2]);
    expect(mock.eliminaPerATothom).not.toHaveBeenCalled();
    expect(value.errorAccions).toBeNull();
    expect(textPintat).toBe(false);
  });

  it('si el servidor no l’elimina (fallada definitiva), no s’amaga: torna amb el text i la persona rep l’avís en la seua llengua', async () => {
    mock.language = 'es';
    const { transport, promesa, pendent, cos, vista } = await ambTransportEnVol();
    mock.eliminaPerATothom.mockRejectedValue(Object.assign(new Error('SDP-XAT-500: no s’ha pogut eliminar'), { code: 'SDP-XAT-500' }));
    await elimina(pendent.id);
    await act(async () => { transport.resolve(ack(cos)); await promesa; });
    await assenta();
    await act(async () => { await vi.dynamicImportSettled(); });
    await assenta();
    expect(mock.eliminaPerATothom).toHaveBeenCalledTimes(1);
    expect(delMissatge(pendent.id)).toEqual([expect.objectContaining({ text: TEXT, seq: 2, esborrat: false })]);
    expect(value.errorAccions).toMatchObject({ code: 'SDP-XAT-500' });
    /* Mai el text de l'error: el de i18nAccionsMissatgeXat.js, en la llengua de la interfície. */
    expect(mock.showToast).toHaveBeenCalledTimes(1);
    expect(mock.showToast).toHaveBeenCalledWith('No se ha podido eliminar el mensaje para todos.', 'error');
    /* La costura amb Conversa (eliminatsLocals) i cap altre intent. */
    expect(value.eliminacionsDesfetes).toEqual([pendent.id]);
    await pas(60000);
    expect(mock.eliminaPerATothom).toHaveBeenCalledTimes(1);
    expect(hiHaEstatPendent()).toBe(false);
    /* Són de l'àmbit: la persona nova no les hereta. */
    mock.session = { currentUser: { id: 'B' }, generacio: 2 };
    mock.actorKey = 'persona::B';
    vista.rerender(arbre());
    await assenta();
    expect(value.eliminacionsDesfetes).toEqual([]);
  });

  /* v1.2.25 · Poliment P2 de l'auditoria de Codex (Guàrdia #7) · L'àmbit i la generació es capturen abans de l'import
     diferit del diccionari. Amb la porta tancada, la fallada definitiva ja s'ha vist (eliminacionsDesfetes) i l'avís
     espera el text; si mentrestant la persona canvia (A → B) o la sessió canvia sense canviar d'àmbit, l'avís d'A no
     es pinta. Abans només es mirava si el proveïdor s'havia desmuntat, i l'avís eixia igual. */
  async function fallaDefinitivaAmbElDiccionariEnCami() {
    const porta = deferred();
    diccionari.porta = porta.promise;
    mock.language = 'es';
    const { transport, promesa, pendent, cos, vista } = await ambTransportEnVol();
    mock.eliminaPerATothom.mockRejectedValue(Object.assign(new Error('SDP-XAT-500: no s’ha pogut eliminar'), { code: 'SDP-XAT-500' }));
    await elimina(pendent.id);
    await act(async () => { transport.resolve(ack(cos)); await promesa; });
    await assenta();
    await act(async () => { await vi.dynamicImportSettled(); });
    await assenta();
    expect(mock.eliminaPerATothom).toHaveBeenCalledTimes(1);
    expect(value.eliminacionsDesfetes).toEqual([pendent.id]);
    expect(mock.showToast).not.toHaveBeenCalled();
    const obri = async () => { await act(async () => { porta.resolve(); }); await assenta(); };
    return { obri, vista };
  }

  it('Poliment P2 · la mateixa persona: quan arriba el diccionari, l’avís es pinta una vegada, en la seua llengua', async () => {
    const { obri } = await fallaDefinitivaAmbElDiccionariEnCami();
    await obri();
    expect(mock.showToast).toHaveBeenCalledTimes(1);
    expect(mock.showToast).toHaveBeenCalledWith('No se ha podido eliminar el mensaje para todos.', 'error');
  });

  it('Poliment P2 · si la persona canvia (A → B) mentre arriba el diccionari, l’avís de l’eliminació d’A no es pinta', async () => {
    const { obri, vista } = await fallaDefinitivaAmbElDiccionariEnCami();
    mock.session = { currentUser: { id: 'B' }, generacio: 2 };
    mock.actorKey = 'persona::B';
    vista.rerender(arbre());
    await assenta();
    expect(value.eliminacionsDesfetes).toEqual([]);
    await obri();
    expect(mock.showToast).not.toHaveBeenCalled();
  });

  it('Poliment P2 · si la sessió canvia sense canviar d’àmbit (una altra generació) mentre arriba el diccionari, cap avís', async () => {
    const { obri } = await fallaDefinitivaAmbElDiccionariEnCami();
    act(() => { esborraSessio({ abast: 'pestanya' }); });
    await obri();
    expect(mock.showToast).not.toHaveBeenCalled();
  });

  it('si la lectura el porta ja esborrat (eliminat des d’un altre aparell), no es torna a eliminar ni hi ha cap avís', async () => {
    const { transport, promesa, pendent, cos } = await ambTransportEnVol();
    await elimina(pendent.id);
    servidor.push({ ...msg(2, 'A'), id: cos.id, text: '', esborratAl: '2026-11-25T05:00:30.000Z' });
    nous();
    await assenta();
    act(() => { transport.reject(xarxa()); });
    await act(async () => { await promesa; });
    await assenta();
    await act(async () => { await vi.dynamicImportSettled(); });
    await pas(60000);
    expect(mock.eliminaPerATothom).not.toHaveBeenCalled();
    expect(mock.showToast).not.toHaveBeenCalled();
    expect(delMissatge(pendent.id)).toEqual(esborrat());
    expect(textPintat).toBe(false);
    expect(hiHaEstatPendent()).toBe(false);
  });

  it('VS-F1 · si l’eliminació tardana falla per xarxa, es torna a provar sola i el missatge acaba eliminat, sense cap avís', async () => {
    const { transport, promesa, pendent, cos } = await ambTransportEnVol();
    mock.eliminaPerATothom.mockRejectedValueOnce(xarxa());
    await elimina(pendent.id);
    desaAlServidor(cos);
    await act(async () => { transport.resolve(ack(cos)); await promesa; });
    await assenta();
    expect(mock.eliminaPerATothom).toHaveBeenCalledTimes(1);
    /* Mentre espera el reintent, ni torna el text ni s'oblida (la marca hi és). */
    expect(textPintat).toBe(false);
    expect(hiHaEstatPendent()).toBe(true);
    nous();
    await assenta();
    expect(mock.eliminaPerATothom).toHaveBeenCalledTimes(1);
    await pas(5000);
    await assenta();
    expect(mock.eliminaPerATothom).toHaveBeenCalledTimes(2);
    expect(delMissatge(pendent.id)).toEqual(esborrat());
    expect(mock.showToast).not.toHaveBeenCalled();
    expect(value.eliminacionsDesfetes).toEqual([]);
    expect(textPintat).toBe(false);
    expect(hiHaEstatPendent()).toBe(false);
  });

  it('VS-F1 · sense xarxa, el reintent de l’eliminació espera que torne la xarxa', async () => {
    const { transport, promesa, pendent, cos } = await ambTransportEnVol();
    mock.eliminaPerATothom.mockRejectedValueOnce(xarxa());
    await elimina(pendent.id);
    desaAlServidor(cos);
    const linia = senseXarxa();
    lecturesSenseXarxa();
    await act(async () => { transport.resolve(ack(cos)); await promesa; });
    await assenta();
    expect(mock.eliminaPerATothom).toHaveBeenCalledTimes(1);
    await pas(60000);
    expect(mock.eliminaPerATothom).toHaveBeenCalledTimes(1);
    expect(hiHaEstatPendent()).toBe(true);
    linia.mockReturnValue(true);
    lecturesAmbXarxa();
    act(() => { window.dispatchEvent(new Event('online')); });
    await assenta();
    expect(mock.eliminaPerATothom).toHaveBeenCalledTimes(2);
    expect(delMissatge(pendent.id)).toEqual(esborrat());
    expect(mock.showToast).not.toHaveBeenCalled();
    expect(hiHaEstatPendent()).toBe(false);
  });

  it('VS-F1 · si falla per xarxa fins al sostre (3 intents), torna amb el text i l’avís, en valencià sense llengua triada', async () => {
    const { transport, promesa, pendent, cos } = await ambTransportEnVol();
    mock.eliminaPerATothom.mockRejectedValue(xarxa());
    await elimina(pendent.id);
    desaAlServidor(cos);
    await act(async () => { transport.resolve(ack(cos)); await promesa; });
    await assenta();
    expect(mock.eliminaPerATothom).toHaveBeenCalledTimes(1);
    await pas(5000);
    await assenta();
    expect(mock.eliminaPerATothom).toHaveBeenCalledTimes(2);
    expect(mock.showToast).not.toHaveBeenCalled();
    /* L'espera es doblega: 5 s, després 10 s. */
    await pas(5000);
    await assenta();
    expect(mock.eliminaPerATothom).toHaveBeenCalledTimes(2);
    await pas(5000);
    await assenta();
    await act(async () => { await vi.dynamicImportSettled(); });
    await assenta();
    expect(mock.eliminaPerATothom).toHaveBeenCalledTimes(3);
    expect(mock.showToast).toHaveBeenCalledTimes(1);
    expect(mock.showToast).toHaveBeenCalledWith("No s'ha pogut eliminar el missatge per a tothom.", 'error');
    expect(delMissatge(pendent.id)).toEqual([expect.objectContaining({ text: TEXT, esborrat: false })]);
    expect(value.eliminacionsDesfetes).toEqual([pendent.id]);
    expect(hiHaEstatPendent()).toBe(false);
    await pas(120000);
    expect(mock.eliminaPerATothom).toHaveBeenCalledTimes(3);
  });

  it('T5 · si l’eliminació tardana s’avorta (la sessió canvia sense canviar d’àmbit), es torna a provar: cap marca mentidera', async () => {
    const { transport, promesa, pendent, cos } = await ambTransportEnVol();
    mock.eliminaPerATothom.mockRejectedValueOnce(new DOMException('La sessió ha canviat.', 'AbortError'));
    await elimina(pendent.id);
    desaAlServidor(cos);
    await act(async () => { transport.resolve(ack(cos)); await promesa; });
    await assenta();
    expect(mock.eliminaPerATothom).toHaveBeenCalledTimes(1);
    expect(hiHaEstatPendent()).toBe(true);
    await pas(5000);
    await assenta();
    expect(mock.eliminaPerATothom).toHaveBeenCalledTimes(2);
    expect(delMissatge(pendent.id)).toEqual(esborrat());
    expect(value.errorAccions).toBeNull();
    expect(mock.showToast).not.toHaveBeenCalled();
    expect(hiHaEstatPendent()).toBe(false);
  });

  it('a la cua darrere d’una altra: eliminada abans d’eixir, no ix mai i no deixa cap marca (la comprovació d’abans de rural.envia)', async () => {
    await obert();
    const primer = deferred();
    mock.enviaMissatge.mockImplementationOnce(() => primer.promise);
    mock.enviaMissatge.mockImplementation(async (_, cos) => ({ ...msg(3, 'A'), id: cos.id, text: cos.text }));
    let pa; let pb;
    act(() => { pa = value.sendChatMessage({ id: FIL }, 'Primer'); });
    act(() => { pb = value.sendChatMessage({ id: FIL }, TEXT); });
    await pas(0);
    expect(mock.enviaMissatge).toHaveBeenCalledTimes(1);
    const segon = value.chatMessages.at(-1);
    expect(segon).toMatchObject({ text: TEXT, estatEnviament: 'pendent' });
    await elimina(segon.id);
    const cosA = mock.enviaMissatge.mock.calls[0][1];
    let resultat;
    await act(async () => { primer.resolve({ ...msg(2, 'A'), id: cosA.id, text: cosA.text }); await pa; resultat = await pb; });
    await assenta();
    expect(resultat).toEqual([]);
    expect(mock.enviaMissatge.mock.calls.map(([, cos]) => cos.text)).toEqual(['Primer']);
    expect(mock.eliminaPerATothom).not.toHaveBeenCalled();
    expect(textPintat).toBe(false);
    expect(hiHaEstatPendent()).toBe(false);
  });

  it('un enviament nou amb el mateix id (el reintent d’un reenviament) no hereta la cancel·lació', async () => {
    await obert();
    const ID = 'bbbbbbbb-0000-4000-8000-00000000000b';
    mock.enviaMissatge.mockRejectedValueOnce(Object.assign(new Error('SDP-XAT-007: massa llarg'), { code: 'SDP-XAT-007', retriable: false }));
    await act(async () => { await value.sendChatMessage({ id: FIL }, TEXT, { clientMsgId: ID }); });
    expect(value.chatMessages.at(-1)).toMatchObject({ id: ID, estatEnviament: 'error' });
    await act(async () => { await value.eliminaPerATothom(ID); });
    expect(delMissatge(ID)).toEqual([]);
    mock.enviaMissatge.mockImplementation(async (_, cos) => ({ ...msg(2, 'A'), id: cos.id, text: cos.text }));
    let resultat;
    await act(async () => { resultat = await value.sendChatMessage({ id: FIL }, TEXT, { clientMsgId: ID }); });
    expect(resultat).toEqual([expect.objectContaining({ id: ID, seq: 2 })]);
    expect(delMissatge(ID)).toEqual([expect.objectContaining({ text: TEXT, seq: 2, estatEnviament: 'enviat' })]);
    expect(hiHaEstatPendent()).toBe(false);
  });

  it('en canviar de persona, l’eliminació tardana no passa a la persona nova', async () => {
    const { transport, promesa, pendent, cos, vista } = await ambTransportEnVol();
    await elimina(pendent.id);
    desaAlServidor(cos);
    /* La resposta es perd (sense reintent: la prova no depén dels temporitzadors) i la lectura de la
       persona A tampoc no arriba; abans que cap el porte, la sessió passa a la B. */
    lecturesSenseXarxa();
    act(() => { transport.reject(Object.assign(new Error('Temps esgotat'), { code: 'TEMPS', retriable: false })); });
    await act(async () => { await promesa; });
    await assenta();
    expect(hiHaEstatPendent()).toBe(true);
    lecturesAmbXarxa();
    vigila = false;
    mock.session = { currentUser: { id: 'B' }, generacio: 2 };
    mock.actorKey = 'persona::B';
    vista.rerender(arbre());
    await assenta();
    act(() => value.obriFil(FIL));
    await assenta();
    /* La B el veu (és al servidor), però mai no l'elimina amb la seua sessió. */
    expect(delMissatge(pendent.id)).toEqual([expect.objectContaining({ text: TEXT, seq: 2 })]);
    expect(mock.eliminaPerATothom).not.toHaveBeenCalled();
    expect(hiHaEstatPendent()).toBe(false);
  });
});

describe('XAT-B01 · «Elimina per a mi» i cancelaEnviament (Gauntlet T2 i VS-F4)', () => {
  it('T2 · «Elimina per a mi» sobre una bombolla pendent (sense xarxa) també la cancel·la: cap error ni cap enviament', async () => {
    const { linia, promesa, pendent } = await esperantLaXarxa();
    let resposta;
    await act(async () => { resposta = await value.eliminaPerAMi(pendent); });
    vigila = true;
    expect(resposta).toEqual({ estat: 'local', filId: FIL, missatgeId: pendent.id });
    expect(value.errorAccions).toBeNull();
    expect(delMissatge(pendent.id)).toEqual([]);
    expect(await tornaLaXarxa(linia, promesa)).toEqual([]);
    nous();
    await pas(60000);
    expect(mock.enviaMissatge).not.toHaveBeenCalled();
    expect(mock.eliminaPerAMi).not.toHaveBeenCalled();
    expect(delMissatge(pendent.id)).toEqual([]);
    expect(textPintat).toBe(false);
    expect(hiHaEstatPendent()).toBe(false);
  });

  it('T2 · «Elimina per a mi» amb el transport en vol i l’ACK tardà: s’elimina per a tothom (decisió de l’àrbitre)', async () => {
    const { transport, promesa, pendent, cos } = await ambTransportEnVol();
    await act(async () => { await value.eliminaPerAMi(pendent); });
    vigila = true;
    desaAlServidor(cos);
    await act(async () => { transport.resolve(ack(cos)); await promesa; });
    await assenta();
    expect(mock.eliminaPerATothom).toHaveBeenCalledTimes(1);
    expect(mock.eliminaPerATothom.mock.calls[0][0]).toEqual({ filId: FIL, missatgeId: pendent.id });
    expect(mock.eliminaPerAMi).not.toHaveBeenCalled();
    expect(textPintat).toBe(false);
  });

  it('«Elimina per a mi» sobre un missatge ja enviat continua anant al motor', async () => {
    await obert();
    mock.eliminaPerAMi.mockImplementation(async ({ filId, missatgeId }) => ({ filId, missatgeId, reaccions: [], destacat: false, fixat: false, amagat: true }));
    const enviat = value.chatMessages[0];
    await act(async () => { await value.eliminaPerAMi({ ...enviat, filId: FIL }); });
    expect(mock.eliminaPerAMi).toHaveBeenCalledTimes(1);
    expect(mock.eliminaPerAMi.mock.calls[0][0]).toEqual({ filId: FIL, missatgeId: enviat.id });
  });

  it('VS-F4 · sense la capacitat d’eliminar per a tothom, cancelaEnviament cancel·la la bombolla pendent i no s’envia', async () => {
    mock.teCapacitat.mockImplementation((nom) => nom !== 'xatEliminaPerATothom' && nom !== 'xatAccionsMissatge');
    const { linia, promesa, pendent } = await esperantLaXarxa();
    expect(value.eliminaPerATothom).toBeNull();
    expect(value.cancelaEnviament('cccccccc-0000-4000-8000-00000000000c')).toBeNull();
    let resposta;
    act(() => { resposta = value.cancelaEnviament(pendent.id); });
    vigila = true;
    expect(resposta).toEqual({ estat: 'local', filId: FIL, missatgeId: pendent.id });
    expect(delMissatge(pendent.id)).toEqual([]);
    expect(await tornaLaXarxa(linia, promesa)).toEqual([]);
    await pas(60000);
    expect(mock.enviaMissatge).not.toHaveBeenCalled();
    expect(delMissatge(pendent.id)).toEqual([]);
    expect(textPintat).toBe(false);
  });
});

describe('XAT-B02 · la cua del xat es marca a estatsPendents', () => {
  it('amb una bombolla pendent, hiHaEstatPendent() és true; confirmada, false', async () => {
    const { transport, promesa, cos } = await ambTransportEnVol();
    expect(hiHaEstatPendent()).toBe(true);
    await act(async () => { transport.resolve(ack(cos)); await promesa; });
    expect(value.chatMessages.at(-1)).toMatchObject({ text: TEXT, seq: 2 });
    expect(hiHaEstatPendent()).toBe(false);
  });

  it('una bombolla en error també (el text només viu en memòria); descartada, false', async () => {
    await obert();
    mock.enviaMissatge.mockRejectedValue(Object.assign(new Error('SDP-XAT-007: massa llarg'), { code: 'SDP-XAT-007', retriable: false }));
    await act(async () => { await value.sendChatMessage({ id: FIL }, TEXT); });
    const fallida = value.chatMessages.at(-1);
    expect(fallida).toMatchObject({ estatEnviament: 'error' });
    expect(hiHaEstatPendent()).toBe(true);
    act(() => { value.descartaFallit(fallida.id); });
    expect(hiHaEstatPendent()).toBe(false);
  });

  it('VS-F2 · eliminada amb el transport en vol, la marca es queda fins que se sap si el servidor la té, també sense xarxa', async () => {
    const { transport, promesa, pendent } = await ambTransportEnVol();
    expect(hiHaEstatPendent()).toBe(true);
    await elimina(pendent.id);
    /* Ja no és cap bombolla pendent, però l'eliminació per a tothom potser s'ha de fer. */
    expect(hiHaEstatPendent()).toBe(true);
    const linia = senseXarxa();
    lecturesSenseXarxa();
    act(() => { transport.reject(xarxa()); });
    await act(async () => { await promesa; });
    await pas(30000);
    /* Una recàrrega ara la perdria (VS-2b): la marca hi és. */
    expect(hiHaEstatPendent()).toBe(true);
    linia.mockReturnValue(true);
    lecturesAmbXarxa();
    act(() => { window.dispatchEvent(new Event('online')); });
    await assenta();
    /* La lectura diu que el servidor no el té: res a eliminar. */
    expect(hiHaEstatPendent()).toBe(false);
    expect(mock.eliminaPerATothom).not.toHaveBeenCalled();
  });

  it('en desmuntar el proveïdor, la marca se’n va (també la de l’eliminació armada)', async () => {
    const { pendent } = await ambTransportEnVol();
    expect(hiHaEstatPendent()).toBe(true);
    await elimina(pendent.id);
    expect(hiHaEstatPendent()).toBe(true);
    act(() => { cleanup(); });
    expect(hiHaEstatPendent()).toBe(false);
  });

  it('en canviar de persona, la marca se’n va amb les bombolles', async () => {
    const vista = await obert();
    const transport = deferred();
    mock.enviaMissatge.mockImplementation(() => transport.promise);
    act(() => { value.sendChatMessage({ id: FIL }, TEXT); });
    await pas(0);
    expect(hiHaEstatPendent()).toBe(true);
    mock.session = { currentUser: { id: 'B' }, generacio: 2 };
    mock.actorKey = 'persona::B';
    vista.rerender(arbre());
    await pas(0);
    expect(value.chatMessages.some((m) => m.text === TEXT)).toBe(false);
    expect(hiHaEstatPendent()).toBe(false);
  });

  /* Gauntlet v1.2.25 (VS-F3) · L'arnés de R22 (XatContext.bombollesSessio.test.jsx): la renovació
     fallida sense cobertura buida la pestanya i el registre la pot tornar. */
  async function bombollaEnRepos() {
    mock.recuperable = true;
    const vista = await obert();
    senseXarxa();
    mock.enviaMissatge.mockRejectedValue(xarxa());
    let promesa;
    act(() => { promesa = value.sendChatMessage({ id: FIL }, TEXT); });
    await pas(0);
    expect(hiHaEstatPendent()).toBe(true);
    mock.session = { currentUser: null, generacio: 2, estat: 'fora' };
    vista.rerender(arbre());
    await act(async () => { await promesa; });
    await assenta();
    expect(value.chatMessages).toEqual([]);
    return vista;
  }

  it('VS-F3 · amb la sessió perduda sense eixir, les bombolles en repòs mantenen la marca fins que tornen', async () => {
    const vista = await bombollaEnRepos();
    expect(hiHaEstatPendent()).toBe(true);
    espiaLinia.mockReturnValue(true);
    mock.session = { currentUser: { id: 'A' }, generacio: 3, estat: 'dins' };
    vista.rerender(arbre());
    await assenta();
    act(() => value.obriFil(FIL));
    await assenta();
    const tornada = value.chatMessages.find((m) => m.text === TEXT);
    expect(tornada).toMatchObject({ estatEnviament: 'error' });
    /* Ara la marca és la de la bombolla en error, que ja es veu. */
    expect(hiHaEstatPendent()).toBe(true);
    act(() => { value.descartaFallit(tornada.id); });
    expect(hiHaEstatPendent()).toBe(false);
  });

  it('VS-F3 · una altra persona oblida les bombolles en repòs: la marca se’n va', async () => {
    const vista = await bombollaEnRepos();
    expect(hiHaEstatPendent()).toBe(true);
    mock.session = { currentUser: { id: 'B' }, generacio: 3, estat: 'dins' };
    mock.actorKey = 'persona::B';
    vista.rerender(arbre());
    await assenta();
    expect(hiHaEstatPendent()).toBe(false);
  });

  it('VS-F3 · en desmuntar amb bombolles en repòs, la marca se’n va', async () => {
    await bombollaEnRepos();
    expect(hiHaEstatPendent()).toBe(true);
    act(() => { cleanup(); });
    expect(hiHaEstatPendent()).toBe(false);
  });
});
