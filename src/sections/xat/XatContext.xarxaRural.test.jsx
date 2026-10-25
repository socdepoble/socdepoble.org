/* Auditoria 261008 (261008_1355_auditoria_claude.md) · El xat amb xarxa rural
   intermitent, al proveïdor real amb el port simulat:
     · B04 · un sondeig fallit ja no buida una llista que s'havia carregat bé
       (ni tanca la conversa oberta): l'avís no bloqueja i el tic següent
       arriba als 2, 5, 10 o 30 s, amb sostre de 60 s;
     · B09 · cada fallada seguida de l'historial cap arrere porta una espera
       (esperaAntics); a la tercera, o amb un error no reintentable, només el
       botó o la xarxa que torna ('online'); el primer èxit la reinicia.
   Calcada de la preparació de XatContext.test.jsx. */
import { StrictMode, useLayoutEffect } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../host.js';
import { XatProvider, useXat } from './XatContext.jsx';

const mock = vi.hoisted(() => ({
  session: { currentUser: { id: 'A' }, generacio: 1 }, actorKey: 'persona::A', pathname: '/xat', showToast: vi.fn(),
  loadFils: vi.fn(), loadMissatges: vi.fn(), enviaMissatge: vi.fn(), marcaLlegit: vi.fn(),
  creaFilDirecte: vi.fn(), carregaMembres: vi.fn(), subscribeToXat: vi.fn(), unsubscribeFromXat: vi.fn(),
  obriFilDePagina: vi.fn(), teCapacitat: vi.fn()
}));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => mock.session }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorKey: mock.actorKey, identitats: undefined }) }));
/* La resta de dependències del proveïdor, com a XatContext.test.jsx. */
vi.mock('../../app/contexts/RouterContext', () => ({ useLocation: () => ({ pathname: mock.pathname }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, alternativa) => alternativa }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mock.showToast }) }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({ ...await importOriginal(), ...mock }));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));

const CONFIG = { backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a' };
const missatge = (text, id = 'm-A', extra = {}) => ({ id, filId: 'fil-A', usuariId: 'X', text, seq: 1, creatAl: '2026-10-08T10:00:00Z', ...extra });
const fil = (extra = {}) => ({ id: 'fil-A', titol: 'A', altresNoms: [], ultimSeq: 1, llegitFinsSeq: 1, llegitPelsAltresFinsSeq: 0, noLlegits: 0, ultimAutorId: 'X', ultimAl: '2026-10-08T10:00:00Z', ...extra });
const xarxa = (text = 'Load failed') => Object.assign(new Error(text), { code: 'XARXA', retriable: true });
const noReintentable = (text = 'SDP-XAT-003: no eres membre d’aquest poble.') => Object.assign(new Error(text), { code: 'SDP-XAT-003', retriable: false });

let value;
function Sonda() {
  const actual = useXat();
  useLayoutEffect(() => { value = actual; });
  value = actual;
  return null;
}
const arbre = () => <StrictMode><XatProvider config={CONFIG}><Sonda /></XatProvider></StrictMode>;
const pas = async (ms) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const llistes = () => mock.loadFils.mock.calls.length;

beforeEach(() => {
  vi.clearAllMocks();
  mock.session = { currentUser: { id: 'A' }, generacio: 1 };
  mock.actorKey = 'persona::A';
  mock.loadFils.mockResolvedValue([fil()]);
  mock.loadMissatges.mockResolvedValue([missatge('Bon dia')]);
  mock.marcaLlegit.mockResolvedValue({ llegitFinsSeq: 1, rebutFinsSeq: 1 });
  mock.subscribeToXat.mockResolvedValue({ subscription: 'sub-A', error: null });
  mock.unsubscribeFromXat.mockResolvedValue(null);
  mock.teCapacitat.mockReturnValue(true);
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

/* La llista carregada bé, el fil obert i el sondeig tornat a armar amb els
   temporitzadors de la prova (obrir un fil torna a crear l'efecte). */
async function ambLlistaCarregada() {
  const vista = render(arbre());
  await waitFor(() => expect(value.status).toBe('ready'));
  expect(value.chatThreads.map((f) => f.id)).toEqual(['fil-A']);
  vi.useFakeTimers();
  act(() => value.obriFil('fil-A'));
  await pas(0);
  expect(value.chatMessages.map((m) => m.text)).toEqual(['Bon dia']);
  return vista;
}

describe('B04 · un sondeig fallit no buida la llista ni tanca la conversa', () => {
  it('després d’una càrrega bona, un loadFils rebutjat conserva la llista i el fil obert, avisa sense bloquejar i torna a provar als 2 s', async () => {
    await ambLlistaCarregada();
    mock.loadFils.mockRejectedValueOnce(xarxa());
    const abans = llistes();
    await pas(25000);
    expect(llistes()).toBe(abans + 1);
    expect(value.chatThreads.map((f) => f.id)).toEqual(['fil-A']);
    expect(value.filActiu).toBe('fil-A');
    expect(value.chatMessages.map((m) => m.text)).toEqual(['Bon dia']);
    expect(value.status).toBe('ready');
    /* L'avís que tapa la llista no es posa: només el no bloquejant. */
    expect(value.avis).toBeNull();
    expect(value.llistaFresca).toBe(false);
    expect(value.avisLlista).toBe('Load failed');
    /* No als 250 s: als 2 s. */
    await pas(1999);
    expect(llistes()).toBe(abans + 1);
    await pas(1);
    expect(llistes()).toBe(abans + 2);
    expect(value.llistaFresca).toBe(true);
    expect(value.avisLlista).toBeNull();
    expect(value.chatThreads.map((f) => f.id)).toEqual(['fil-A']);
  });

  it('les fallades reintentables seguides tornen a provar als 2, 5, 10 i 30 s i després cada 60 s; un èxit torna als 25 s', async () => {
    await ambLlistaCarregada();
    mock.loadFils.mockRejectedValue(xarxa());
    const abans = llistes();
    await pas(25000);
    expect(llistes()).toBe(abans + 1);
    let esperades = abans + 1;
    for (const espera of [2000, 5000, 10000, 30000, 60000, 60000]) {
      await pas(espera - 1);
      expect(llistes()).toBe(esperades);
      await pas(1);
      esperades += 1;
      expect(llistes()).toBe(esperades);
      expect(value.chatThreads.map((f) => f.id)).toEqual(['fil-A']);
      expect(value.llistaFresca).toBe(false);
    }
    mock.loadFils.mockResolvedValue([fil()]);
    await pas(60000);
    esperades += 1;
    expect(llistes()).toBe(esperades);
    expect(value.llistaFresca).toBe(true);
    /* Amb èxit, la cadència de sempre: el comptador s'ha reiniciat. */
    await pas(24999);
    expect(llistes()).toBe(esperades);
    await pas(1);
    expect(llistes()).toBe(esperades + 1);
  });

  it('un error no reintentable amb la llista carregada també la conserva, però el tic següent s’espaia a 250 s', async () => {
    await ambLlistaCarregada();
    mock.loadFils.mockRejectedValueOnce(noReintentable());
    const abans = llistes();
    await pas(25000);
    expect(llistes()).toBe(abans + 1);
    expect(value.chatThreads.map((f) => f.id)).toEqual(['fil-A']);
    expect(value.avis).toBeNull();
    expect(value.avisLlista).toBe('SDP-XAT-003: no eres membre d’aquest poble.');
    await pas(249999);
    expect(llistes()).toBe(abans + 1);
    await pas(1);
    expect(llistes()).toBe(abans + 2);
  });

  it('la primera càrrega fallida continua buidant la llista amb l’avís que la tapa, i torna a provar als 2 s, no als 25 s', async () => {
    /* Revisió 261008 · Amb els temporitzadors de la prova des del muntatge:
       el sondeig s'arma abans que la càrrega inicial falle. */
    vi.useFakeTimers();
    mock.loadFils.mockRejectedValue(xarxa());
    render(arbre());
    await pas(0);
    expect(value.status).toBe('ready');
    expect(value.chatThreads).toEqual([]);
    expect(value.avis).toBe('Load failed');
    expect(value.avisLlista).toBeNull();
    expect(value.llistaFresca).toBe(false);
    const abans = llistes();
    mock.loadFils.mockResolvedValue([fil()]);
    await pas(1999);
    expect(llistes()).toBe(abans);
    await pas(1);
    expect(llistes()).toBe(abans + 1);
    expect(value.chatThreads.map((f) => f.id)).toEqual(['fil-A']);
    expect(value.avis).toBeNull();
    expect(value.llistaFresca).toBe(true);
  });

  it('obrir una conversa enmig de l’espera curta no la torna als 25 s', async () => {
    await ambLlistaCarregada();
    mock.loadFils.mockRejectedValueOnce(xarxa());
    const abans = llistes();
    await pas(25000);
    expect(llistes()).toBe(abans + 1);
    await pas(1000);
    /* Canviar el fil obert torna a crear l'efecte del sondeig. */
    act(() => value.obriFil(null));
    await pas(0);
    await pas(1999);
    expect(llistes()).toBe(abans + 1);
    await pas(1);
    expect(llistes()).toBe(abans + 2);
  });

  it('una fallada d’una altra crida (recarrega) també passa a l’espera curta', async () => {
    await ambLlistaCarregada();
    const abans = llistes();
    await pas(10000);
    mock.loadFils.mockRejectedValueOnce(xarxa());
    await act(async () => { await value.recarrega(); });
    expect(llistes()).toBe(abans + 1);
    expect(value.avisLlista).toBe('Load failed');
    /* Sense la reprogramació, el tic arribava als 25 s del muntatge (15 s més tard). */
    await pas(1999);
    expect(llistes()).toBe(abans + 1);
    await pas(1);
    expect(llistes()).toBe(abans + 2);
    expect(value.llistaFresca).toBe(true);
  });

  it('l’esquema sense aplicar buida la llista encara que s’haguera carregat', async () => {
    render(arbre());
    await waitFor(() => expect(value.status).toBe('ready'));
    expect(value.chatThreads.map((f) => f.id)).toEqual(['fil-A']);
    mock.loadFils.mockRejectedValueOnce(Object.assign(new Error('L’esquema del xat no està aplicat.'), { code: 'ESQUEMA', retriable: false }));
    await act(async () => { await value.recarrega(); });
    expect(value.chatThreads).toEqual([]);
    expect(value.avis).toBe('L’esquema del xat no està aplicat.');
    expect(value.avisLlista).toBeNull();
    expect(value.llistaFresca).toBe(false);
  });
});

describe('B09 · l’historial cap arrere no es demana en bucle quan falla', () => {
  /* Només l'historial cap arrere (abansDeSeq) falla; la resta de lectures, bé. */
  function anticsFallen(error) {
    mock.loadMissatges.mockImplementation((_, opcions) => (opcions?.abansDeSeq != null
      ? Promise.reject(error)
      : Promise.resolve([missatge('Bon dia')])));
  }

  it('cada fallada seguida porta una espera de 2 i 5 s; a la tercera, només manual; el primer èxit la lleva i reinicia el comptador', async () => {
    await ambLlistaCarregada();
    vi.setSystemTime(new Date('2026-10-08T12:00:00Z'));
    const ara = Date.now();
    anticsFallen(xarxa());
    await act(async () => { await value.carregaMesAntics('fil-A'); });
    expect(value.esperaAntics('fil-A')).toEqual({ fallades: 1, manual: false, fins: ara + 2000 });
    expect(value.carregantAntics('fil-A')).toBe(false);
    await act(async () => { await value.carregaMesAntics('fil-A'); });
    expect(value.esperaAntics('fil-A')).toEqual({ fallades: 2, manual: false, fins: ara + 5000 });
    await act(async () => { await value.carregaMesAntics('fil-A'); });
    expect(value.esperaAntics('fil-A')).toEqual({ fallades: 3, manual: true, fins: null });
    /* El botó continua podent provar-ho; si torna a fallar, continua manual. */
    await act(async () => { await value.carregaMesAntics('fil-A'); });
    expect(value.esperaAntics('fil-A')).toEqual({ fallades: 4, manual: true, fins: null });
    mock.loadMissatges.mockResolvedValue([]);
    await act(async () => { await value.carregaMesAntics('fil-A'); });
    expect(value.esperaAntics('fil-A')).toBeNull();
    /* El comptador torna a començar. */
    anticsFallen(xarxa());
    await act(async () => { await value.carregaMesAntics('fil-A'); });
    expect(value.esperaAntics('fil-A')).toMatchObject({ fallades: 1, manual: false });
  });

  it('un error no reintentable passa a manual a la primera fallada', async () => {
    await ambLlistaCarregada();
    anticsFallen(noReintentable('SDP-XAT-006: no eres membre actiu del fil.'));
    await act(async () => { await value.carregaMesAntics('fil-A'); });
    expect(value.esperaAntics('fil-A')).toEqual({ fallades: 1, manual: true, fins: null });
  });

  it('la xarxa que torna (online) lleva l’espera però conserva el comptador', async () => {
    await ambLlistaCarregada();
    anticsFallen(xarxa());
    for (let i = 0; i < 3; i += 1) await act(async () => { await value.carregaMesAntics('fil-A'); });
    expect(value.esperaAntics('fil-A')).toMatchObject({ fallades: 3, manual: true });
    await act(async () => { window.dispatchEvent(new Event('online')); });
    expect(value.esperaAntics('fil-A')).toBeNull();
    await act(async () => { await value.carregaMesAntics('fil-A'); });
    expect(value.esperaAntics('fil-A')).toEqual({ fallades: 4, manual: true, fins: null });
  });

  it('un altre àmbit (una altra persona) no hereta ni l’espera ni el comptador', async () => {
    const vista = await ambLlistaCarregada();
    anticsFallen(xarxa());
    await act(async () => { await value.carregaMesAntics('fil-A'); });
    await act(async () => { await value.carregaMesAntics('fil-A'); });
    expect(value.esperaAntics('fil-A')).toMatchObject({ fallades: 2, manual: false });
    const vell = value;
    mock.session = { currentUser: { id: 'B' }, generacio: 2 };
    mock.actorKey = 'persona::B';
    vista.rerender(arbre());
    await pas(0);
    expect(value.status).toBe('ready');
    expect(vell.esperaAntics('fil-A')).toBeNull();
    expect(value.esperaAntics('fil-A')).toBeNull();
    act(() => value.obriFil('fil-A'));
    await pas(0);
    await act(async () => { await value.carregaMesAntics('fil-A'); });
    expect(value.esperaAntics('fil-A')).toMatchObject({ fallades: 1, manual: false });
  });
});

/* CUR-03 · Provider i adaptador de realtime de producte; només el client de
   transport i la resta de mètodes del port són locals. Cap petició de xarxa. */
import { getBackendImplementation } from '../../data/backendPort.js';
/* E1 · El transport continua sent el doble de baix; l'adaptador el compon
   l'host real i n'extraiem els mètodes des del port neutral. */
vi.mock('../../PedraSecaEmbed.jsx', () => ({ defineCustomElement: vi.fn() }));
vi.mock('../../data/supabase/index.js', async (importOriginal) => ({ ...await importOriginal() }));
let subscribeReal, unsubscribeReal;
beforeAll(async () => {
  const { arrenca } = await vi.importActual('../../host.js');
  await arrenca();
  ({ subscribeToXat: subscribeReal, unsubscribeFromXat: unsubscribeReal } = getBackendImplementation());
});
const rt = vi.hoisted(() => ({ client: null, channels: [], syncError: false }));
vi.mock('../../data/supabase/config.js', async (importOriginal) => ({ ...await importOriginal(), getClient: async () => rt.client }));
vi.mock('../../data/supabase/runtime.js', async (importOriginal) => ({ ...await importOriginal(), getResolvedConfig: config => ({ ...config, runtimeDataMode: 'remote' }), generateUUID: () => 'uuid-local' }));
vi.mock('../../data/supabase/utils.js', () => ({ handleError: error => error }));
vi.mock('../../data/identitat.js', async (importOriginal) => ({ ...await importOriginal(), usuariDeSessio: () => mock.session.currentUser, getDefaultUserId: () => 'A' }));

const configuraRT = () => {
  rt.channels = []; rt.syncError = false;
  rt.client = {
    removeChannel: vi.fn().mockResolvedValue('ok'),
    channel: vi.fn(() => {
      const canal = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(callback => {
          canal.estat = callback;
          if (rt.syncError) callback('CHANNEL_ERROR', new Error('durant subscribe'));
          return canal;
        })
      };
      rt.channels.push(canal); return canal;
    })
  };
  mock.subscribeToXat.mockImplementation(subscribeReal);
  mock.unsubscribeFromXat.mockImplementation(unsubscribeReal);
};
const statusRT = async (canal, estat) => { await act(async () => { canal.estat(estat, new Error(estat)); }); };
const missatgesCarregats = () => mock.loadMissatges.mock.calls.length;
describe('CUR-03 · el Provider real recupera la cadència amb l’adaptador real', () => {
  it('CUR-03 · error → SUBSCRIBED torna del sondeig de 5 s al de 30 s', async () => {
    configuraRT(); await ambLlistaCarregada();
    const canal = rt.channels.at(-1);
    await statusRT(canal, 'CHANNEL_ERROR'); await pas(5000);
    const despresError = missatgesCarregats(); await pas(5000);
    expect(missatgesCarregats()).toBe(despresError + 1);
    const abansRecuperar = missatgesCarregats();
    await statusRT(canal, 'SUBSCRIBED');
    expect(missatgesCarregats()).toBe(abansRecuperar + 1);
    expect(mock.loadMissatges).toHaveBeenLastCalledWith('fil-A', expect.objectContaining({ despresDeSeq: 1 }));
    await pas(5000);
    const recuperat = missatgesCarregats(); await pas(5000);
    expect(missatgesCarregats()).toBe(recuperat);
    await pas(25000); expect(missatgesCarregats()).toBe(recuperat + 1);
  });
  it('CUR-03 · l’error síncron abans de resoldre subscribe conserva el mode degradat', async () => {
    configuraRT(); rt.syncError = true; await ambLlistaCarregada();
    await pas(5000); const abans = missatgesCarregats(); await pas(5000);
    expect(missatgesCarregats()).toBe(abans + 1);
  });
  it('CUR-03 · la recuperació d’un canal antic després de tancar el fil no crea lectures', async () => {
    configuraRT(); await ambLlistaCarregada(); const canal = rt.channels.at(-1);
    await statusRT(canal, 'CHANNEL_ERROR');
    act(() => value.obriFil(null)); await pas(0); const abans = missatgesCarregats();
    await statusRT(canal, 'SUBSCRIBED'); await pas(60000);
    expect(missatgesCarregats()).toBe(abans);
  });
  it('CUR-03 · el rebuig tardà d’una obertura antiga no degrada el canal nou', async () => {
    configuraRT();
    let rebutja;
    const pendent = new Promise((_resolve, reject) => { rebutja = reject; });
    mock.subscribeToXat.mockImplementationOnce(() => pendent);
    await ambLlistaCarregada();
    act(() => window.dispatchEvent(new Event('online'))); await pas(0);
    expect(rt.channels).toHaveLength(1);
    await pas(30000);
    await act(async () => { rebutja(new Error('obertura antiga rebutjada')); });
    await pas(30000); const abans = missatgesCarregats(); await pas(5000);
    expect(missatgesCarregats()).toBe(abans);
  });
});
