/* B8C-5 (marató 261101_2143; B8-CLIENT §5.1) · Silenciar una conversa al
   proveïdor real, amb el port simulat (la capacitat 'silenciXat') i el registre
   real dels avisos natius amb un adaptador fals. Arnés de
   XatContext.avisosNatius.test.jsx.
     (1) amb la capacitat, silenciaFil crida el port i el fil passa a silenciat;
     (2) amb NO-DISPONIBLE (o sense la capacitat), el silenci es queda en
         memòria fins a recarregar;
     (3) un fil silenciat en memòria no fa avís natiu i no suma als no llegits;
     (4) en canviar de persona, el silenci en memòria se'n va, i res d'A
         (ni una resposta tardana, ni un error, ni les funcions guardades)
         arriba a B;
     (5) potSilenciarFil: ni files d'ajuda, ni el xat de Javi, ni visitants;
     (6) un sondeig de la llista en vol d'abans del silenci no el desfà;
     (7) un silenci en memòria de 8 hores caduca sol, i el de «sempre» no
         desborda el temporitzador. */
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../host.js';
import { XatProvider, useXat } from './XatContext.jsx';
import { ambXatsPerDefecte } from '../../data/xatsPerDefecte.js';
import { SILENCI_SEMPRE } from '../../data/contracte.js';
import { idDAvis, refrescaPermisAvisos, registraAvisosNatius } from '../../config/avisosNatius.js';

const mock = vi.hoisted(() => ({
  session: { currentUser: { id: 'A' }, generacio: 1 }, actorKey: 'persona::A', pathname: '/mur', showToast: vi.fn(),
  loadFils: vi.fn(), loadMissatges: vi.fn(), enviaMissatge: vi.fn(), marcaLlegit: vi.fn(),
  creaFilDirecte: vi.fn(), carregaMembres: vi.fn(), subscribeToXat: vi.fn(), unsubscribeFromXat: vi.fn(),
  obriFilDePagina: vi.fn(), teCapacitat: vi.fn(), silenciaFil: vi.fn(), capSilenci: true
}));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => mock.session }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorKey: mock.actorKey, identitats: undefined }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useLocation: () => ({ pathname: mock.pathname }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, fallback) => fallback }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mock.showToast }) }));
vi.mock('../../data/backendPort.js', () => mock);
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));

let estatDelPermis = 'granted';
const adaptador = {
  estatPermis: vi.fn(async () => estatDelPermis),
  demanaPermis: vi.fn(async () => estatDelPermis),
  avisa: vi.fn(async () => {}),
  escoltaToc: vi.fn(),
  netejaAvisos: vi.fn(async () => {})
};
registraAvisosNatius(adaptador);

const CONFIG = { backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a' };
const ara = '2026-10-26T16:00:00Z';
const HORA = 3600000;
const filDePepa = (seq, extra = {}) => ({ id: 'f-pepa', tipus: 'directe', titol: 'Pepa', altres: [{ id: 'P', nom: 'Pepa', tipus: 'persona' }], ultimSeq: seq, llegitFinsSeq: 0, noLlegits: seq, ultimAutorId: 'P', ultimAl: ara, ...extra });
const filDeQuim = (seq) => ({ id: 'f-quim', tipus: 'directe', titol: 'Quim', altres: [{ id: 'Q', nom: 'Quim', tipus: 'persona' }], ultimSeq: seq, llegitFinsSeq: 0, noLlegits: seq, ultimAutorId: 'Q', ultimAl: ara });
const filDePagina = () => ({ id: 'f-pagina', tipus: 'grup', titol: 'La festa', participant: false, ultimSeq: 1, llegitFinsSeq: 0, noLlegits: 0, ultimAutorId: 'Z', ultimAl: ara });
const fils = (seq, ...altres) => ambXatsPerDefecte([filDePepa(seq), ...altres]);
const noDisponible = () => Object.assign(new Error('Este servidor encara no sap silenciar converses.'), { code: 'NO-DISPONIBLE', codi: 'NO-DISPONIBLE' });

let value;
/* ARB-SIL-02 · Quants renders del consumidor: un temporitzador desbocat repinta en bucle. */
let renders = 0;
function Probe() {
  renders += 1;
  value = useXat();
  return null;
}
const arbre = () => <XatProvider config={CONFIG}><Probe /></XatProvider>;
const munta = () => render(arbre());
const pepa = () => value.chatThreads.find((f) => f.id === 'f-pepa');
const amaga = () => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
  document.dispatchEvent(new Event('visibilitychange'));
};
const mostra = () => { delete document.visibilityState; delete document.hidden; };
const avanca = (ms) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });
const silencia = (filId, durada) => act(() => value.silenciaFil(filId, durada));
const diferit = () => { let resol; const promesa = new Promise((r) => { resol = r; }); return { promesa, resol }; };
const rebutjable = () => { let rebutja; const promesa = new Promise((_, r) => { rebutja = r; }); return { promesa, rebutja }; };
/* La persona B entra (sessió i actor nous) i ja té la seua llista. */
async function entraB(vista) {
  mock.session = { currentUser: { id: 'B' }, generacio: 2 };
  mock.actorKey = 'persona::B';
  vista.rerender(arbre());
  await waitFor(() => expect(value.joId).toBe('B'));
  await waitFor(() => expect(pepa()).toBeTruthy());
}
/* El límit d'un setTimeout als navegadors (2^31-1 ms): més enllà, es dispara de seguida. */
const MAXIM_SET_TIMEOUT = 2147483647;

async function llest() {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const vista = munta();
  await waitFor(() => expect(value.status).toBe('ready'));
  await waitFor(() => expect(pepa()).toBeTruthy());
  return vista;
}

beforeEach(async () => {
  vi.clearAllMocks(); localStorage.clear(); mock.pathname = '/mur';
  mock.session = { currentUser: { id: 'A' }, generacio: 1 };
  mock.actorKey = 'persona::A';
  mock.capSilenci = true;
  mock.loadFils.mockResolvedValue(fils(2));
  mock.loadMissatges.mockResolvedValue([]);
  mock.subscribeToXat.mockResolvedValue({ subscription: null, error: null });
  mock.teCapacitat.mockImplementation((cap) => (cap === 'silenciXat' ? mock.capSilenci : true));
  mock.silenciaFil.mockReset();
  estatDelPermis = 'granted';
  await refrescaPermisAvisos();
});
afterEach(() => { cleanup(); mostra(); localStorage.clear(); vi.useRealTimers(); });

describe('(1) amb la capacitat, ho desa el port', () => {
  test('silenciaFil(id, \'8h\') crida el port amb { filId, durada } i el fil passa a silenciat sense esperar el sondeig', async () => {
    await llest();
    const fins = new Date(Date.now() + 8 * HORA).toISOString();
    mock.silenciaFil.mockResolvedValue({ silenciatFinsAl: fins });
    expect(pepa().silenciat).toBe(false);
    expect(value.totalNoLlegits).toBe(2);
    let resultat;
    await act(async () => { resultat = await value.silenciaFil('f-pepa', '8h'); });
    expect(resultat).toEqual({ estat: 'fet', finsAl: fins });
    expect(mock.silenciaFil).toHaveBeenCalledTimes(1);
    expect(mock.silenciaFil.mock.calls[0][0]).toEqual({ filId: 'f-pepa', durada: '8h' });
    expect(mock.silenciaFil.mock.calls[0][1]).toMatchObject(CONFIG);
    expect(pepa().silenciat).toBe(true);
    expect(value.totalNoLlegits).toBe(0);
  });

  test('«sempre» (la sentinella del servidor) i després «cap»: silenciat i desfet', async () => {
    await llest();
    mock.silenciaFil.mockResolvedValueOnce({ silenciatFinsAl: '9999-12-31T00:00:00+00:00' });
    await act(async () => { await value.silenciaFil('f-pepa', 'sempre'); });
    expect(pepa().silenciat).toBe(true);
    mock.silenciaFil.mockResolvedValueOnce({ silenciatFinsAl: null });
    let resultat;
    await act(async () => { resultat = await value.silenciaFil('f-pepa', 'cap'); });
    expect(resultat).toEqual({ estat: 'fet', finsAl: null });
    expect(mock.silenciaFil.mock.calls[1][0]).toEqual({ filId: 'f-pepa', durada: 'cap' });
    expect(pepa().silenciat).toBe(false);
    expect(value.totalNoLlegits).toBe(2);
  });

  test.each([
    ['XAT_NO_PARTICIPANT', { code: 'XAT_NO_PARTICIPANT' }],
    ['SILENCI_INVALID (rellotge, SDP-XAT-050)', { code: 'SILENCI_INVALID' }],
    ['la xarxa', { code: 'XARXA', retriable: true }]
  ])('un error que no és NO-DISPONIBLE (%s) torna \'error\' i no fa cap silenci fals, ni en memòria', async (_, camps) => {
    await llest();
    mock.silenciaFil.mockRejectedValue(Object.assign(new Error('no'), camps));
    let resultat;
    await act(async () => { resultat = await value.silenciaFil('f-pepa', '8h'); });
    expect(resultat).toEqual({ estat: 'error', finsAl: null });
    expect(pepa().silenciat).toBe(false);
    expect(value.totalNoLlegits).toBe(2);
  });

  test('una durada fora del contracte no arriba al port', async () => {
    await llest();
    let resultat;
    await act(async () => { resultat = await value.silenciaFil('f-pepa', 'una-hora'); });
    expect(resultat).toEqual({ estat: 'error', finsAl: null });
    expect(mock.silenciaFil).not.toHaveBeenCalled();
  });
});

describe('(2) sense servidor, en memòria', () => {
  test('amb NO-DISPONIBLE torna \'local\' amb la data de 8 h i el fil queda silenciat fins a recarregar', async () => {
    await llest();
    mock.silenciaFil.mockRejectedValue(noDisponible());
    const abans = Date.now();
    let resultat;
    await act(async () => { resultat = await value.silenciaFil('f-pepa', '8h'); });
    expect(resultat.estat).toBe('local');
    const fi = Date.parse(resultat.finsAl);
    expect(fi).toBeGreaterThanOrEqual(abans + 8 * HORA);
    expect(fi).toBeLessThanOrEqual(Date.now() + 8 * HORA);
    expect(pepa().silenciat).toBe(true);
    /* El sondeig torna la fila sense silenci (el servidor no el sap): el de la memòria mana. */
    await avanca(26000);
    await waitFor(() => expect(mock.loadFils).toHaveBeenCalledTimes(2));
    expect(pepa().silenciat).toBe(true);
    /* Recarregar (un proveïdor nou) el perd: mai s'ha desat al navegador. */
    expect(localStorage.length).toBe(0);
    cleanup();
    vi.useRealTimers();
    await llest();
    expect(pepa().silenciat).toBe(false);
  });

  test('sense la capacitat no crida el port; «sempre» és la sentinella del contracte; «cap» el desfà en memòria', async () => {
    mock.capSilenci = false;
    await llest();
    let resultat;
    await act(async () => { resultat = await value.silenciaFil('f-pepa', 'sempre'); });
    expect(resultat).toEqual({ estat: 'local', finsAl: SILENCI_SEMPRE });
    expect(mock.silenciaFil).not.toHaveBeenCalled();
    expect(pepa().silenciat).toBe(true);
    await act(async () => { resultat = await value.silenciaFil('f-pepa', 'cap'); });
    expect(resultat).toEqual({ estat: 'local', finsAl: null });
    expect(pepa().silenciat).toBe(false);
  });

  test('un servidor que ja el té silenciat i un «cap» en memòria: mana la memòria', async () => {
    mock.capSilenci = false;
    mock.loadFils.mockResolvedValue(fils(2).map((f) => (f.id === 'f-pepa' ? { ...f, silenciatFinsAl: SILENCI_SEMPRE } : f)));
    await llest();
    expect(pepa().silenciat).toBe(true);
    await silencia('f-pepa', 'cap');
    expect(pepa().silenciat).toBe(false);
    expect(value.totalNoLlegits).toBe(2);
  });

  /* ARB-SIL-03 (X3) · Defensiu: l'adaptador de Supabase memoritza el
     NO-DISPONIBLE per càrrega i node, però si el servidor respon, la seua
     resposta substituïx la memòria; un «sempre» local no pot sobreviure a un
     «cap» desat al servidor. */
  test('un «cap» que el servidor sí desa esborra el «sempre» en memòria d’abans', async () => {
    await llest();
    mock.silenciaFil.mockRejectedValueOnce(noDisponible());
    let resultat;
    await act(async () => { resultat = await value.silenciaFil('f-pepa', 'sempre'); });
    expect(resultat).toEqual({ estat: 'local', finsAl: SILENCI_SEMPRE });
    expect(pepa().silenciat).toBe(true);
    mock.silenciaFil.mockResolvedValueOnce({ silenciatFinsAl: null });
    await act(async () => { resultat = await value.silenciaFil('f-pepa', 'cap'); });
    expect(resultat).toEqual({ estat: 'fet', finsAl: null });
    expect(pepa().silenciat).toBe(false);
    expect(value.totalNoLlegits).toBe(2);
    /* El sondeig següent porta la fila sense silenci: no torna cap «sempre» amagat. */
    await avanca(26000);
    await waitFor(() => expect(mock.loadFils).toHaveBeenCalledTimes(2));
    expect(pepa().silenciat).toBe(false);
  });
});

describe('(3) els efectes del silenci en memòria (ARB-12)', () => {
  test('amb l’App amagada, el fil silenciat en memòria no fa avís natiu; un altre fil sí', async () => {
    await llest();
    mock.silenciaFil.mockRejectedValue(noDisponible());
    await silencia('f-pepa', '1setmana');
    amaga();
    /* Pepa escriu (seq 3) i Quim obri una conversa nova: només avisa Quim. */
    mock.loadFils.mockResolvedValue(fils(3, filDeQuim(1)));
    await avanca(26000);
    await waitFor(() => expect(adaptador.avisa).toHaveBeenCalledTimes(1));
    expect(adaptador.avisa).toHaveBeenCalledWith(expect.objectContaining({ id: idDAvis('f-quim'), filId: 'f-quim' }));
    expect(adaptador.avisa).not.toHaveBeenCalledWith(expect.objectContaining({ filId: 'f-pepa' }));
  });

  test('totalNoLlegits no el suma', async () => {
    mock.loadFils.mockResolvedValue(fils(2, filDeQuim(1)));
    await llest();
    expect(value.totalNoLlegits).toBe(3);
    mock.silenciaFil.mockRejectedValue(noDisponible());
    await silencia('f-pepa', '8h');
    expect(value.totalNoLlegits).toBe(1);
    expect(pepa().silenciat).toBe(true);
  });
});

describe('(4) canvi de persona', () => {
  test('el silenci en memòria d’A no passa a B (encara que el fil tinga el mateix id), ni torna amb A', async () => {
    const vista = await llest();
    mock.silenciaFil.mockRejectedValue(noDisponible());
    await silencia('f-pepa', '8h');
    expect(pepa().silenciat).toBe(true);
    mock.session = { currentUser: { id: 'B' }, generacio: 2 };
    mock.actorKey = 'persona::B';
    vista.rerender(arbre());
    await waitFor(() => expect(value.joId).toBe('B'));
    await waitFor(() => expect(pepa()).toBeTruthy());
    expect(pepa().silenciat).toBe(false);
    mock.session = { currentUser: { id: 'A' }, generacio: 3 };
    mock.actorKey = 'persona::A';
    vista.rerender(arbre());
    await waitFor(() => expect(value.joId).toBe('A'));
    await waitFor(() => expect(pepa()).toBeTruthy());
    expect(pepa().silenciat).toBe(false);
  });

  test('un silenci d’A que torna del port quan ja hi ha B dins no toca la llista de B i diu \'error\'', async () => {
    const vista = await llest();
    const enVol = diferit();
    mock.silenciaFil.mockReturnValue(enVol.promesa);
    let promesa;
    act(() => { promesa = value.silenciaFil('f-pepa', 'sempre'); });
    mock.session = { currentUser: { id: 'B' }, generacio: 2 };
    mock.actorKey = 'persona::B';
    vista.rerender(arbre());
    await waitFor(() => expect(value.joId).toBe('B'));
    await waitFor(() => expect(pepa()).toBeTruthy());
    let resultat;
    await act(async () => { enVol.resol({ silenciatFinsAl: SILENCI_SEMPRE }); resultat = await promesa; });
    expect(resultat).toEqual({ estat: 'error', finsAl: null });
    expect(pepa().silenciat).toBe(false);
  });

  /* ARB-SIL-01 · El camí d'error també mira l'àmbit: sense la guarda, el
     NO-DISPONIBLE tardà d'A passaria al silenci en memòria, i la memòria ja és
     la de B (el mateix id de fil la silenciaria a B). */
  test('un NO-DISPONIBLE d’A que torna quan ja hi ha B dins diu \'error\' i no deixa cap silenci en memòria a B', async () => {
    const vista = await llest();
    const enVol = rebutjable();
    mock.silenciaFil.mockReturnValue(enVol.promesa);
    let promesa;
    act(() => { promesa = value.silenciaFil('f-pepa', 'sempre'); });
    await entraB(vista);
    expect(value.totalNoLlegits).toBe(2);
    let resultat;
    await act(async () => { enVol.rebutja(noDisponible()); resultat = await promesa; });
    expect(resultat).toEqual({ estat: 'error', finsAl: null });
    expect(pepa().silenciat).toBe(false);
    expect(value.totalNoLlegits).toBe(2);
  });

  /* ARB-SIL-03 (X4) · Les funcions guardades d'un altre àmbit no fan res
     (ARQ-H01): la llista que veuen és la d'A, però la memòria i la sessió del
     port ja són de B. Sense `dins()`, el silenci d'A aniria a parar a B. */
  test.each([
    ['sense la capacitat (en memòria)', false],
    ['amb la capacitat (el port)', true]
  ])('potSilenciarFil i silenciaFil guardats d’A, cridats quan ja hi ha B dins (%s): fals i \'error\', sense port ni silenci a B', async (_, capacitat) => {
    mock.capSilenci = capacitat;
    mock.silenciaFil.mockResolvedValue({ silenciatFinsAl: SILENCI_SEMPRE });
    const vista = await llest();
    const { potSilenciarFil: potDA, silenciaFil: silenciaDA } = value;
    expect(potDA('f-pepa')).toBe(true);
    await entraB(vista);
    expect(value.potSilenciarFil('f-pepa')).toBe(true);
    expect(potDA('f-pepa')).toBe(false);
    let resultat;
    await act(async () => { resultat = await silenciaDA('f-pepa', 'sempre'); });
    expect(resultat).toEqual({ estat: 'error', finsAl: null });
    expect(mock.silenciaFil).not.toHaveBeenCalled();
    expect(pepa().silenciat).toBe(false);
    expect(value.totalNoLlegits).toBe(2);
  });
});

describe('(5) potSilenciarFil', () => {
  test('cert per a un fil teu de la llista; fals per a les files d’ajuda, el xat de Javi, un visitant i un fil desconegut', async () => {
    mock.loadFils.mockResolvedValue(fils(2, filDePagina()));
    await llest();
    expect(value.potSilenciarFil('f-pepa')).toBe(true);
    const ajuda = value.chatThreads.filter((f) => typeof f.id === 'string' && f.id.startsWith('sdp-per-defecte:')).map((f) => f.id);
    expect(ajuda.length).toBeGreaterThan(0);
    for (const id of [...ajuda, 'sdp-per-defecte:iaia', 'fake-javi', 'f-pagina', 'no-hi-es', '', null, undefined]) {
      expect(value.potSilenciarFil(id), String(id)).toBe(false);
    }
    let resultat;
    await act(async () => { resultat = await value.silenciaFil('f-pagina', '8h'); });
    expect(resultat).toEqual({ estat: 'error', finsAl: null });
    await act(async () => { resultat = await value.silenciaFil('fake-javi', '8h'); });
    expect(resultat).toEqual({ estat: 'error', finsAl: null });
    expect(mock.silenciaFil).not.toHaveBeenCalled();
  });

  test('fora del proveïdor (BUIT) no es pot silenciar res', async () => {
    function Sol() { value = useXat(); return null; }
    render(<Sol />);
    expect(value.potSilenciarFil('f-pepa')).toBe(false);
    await expect(value.silenciaFil('f-pepa', '8h')).resolves.toEqual({ estat: 'error', finsAl: null });
  });
});

describe('(6) AUTO-05 · un sondeig en vol', () => {
  test('el sondeig que volava abans del silenci torna després amb la fila sense silenci i no el desfà', async () => {
    await llest();
    const enVol = diferit();
    mock.loadFils.mockReturnValueOnce(enVol.promesa);
    await avanca(26000);
    await waitFor(() => expect(mock.loadFils).toHaveBeenCalledTimes(2));
    mock.silenciaFil.mockResolvedValue({ silenciatFinsAl: new Date(Date.now() + 7 * 24 * HORA).toISOString() });
    await act(async () => { await value.silenciaFil('f-pepa', '1setmana'); });
    expect(pepa().silenciat).toBe(true);
    await act(async () => { enVol.resol(fils(2)); await enVol.promesa; });
    await avanca(10);
    expect(pepa().silenciat).toBe(true);
    expect(value.totalNoLlegits).toBe(0);
  });
});

describe('(7) caducitat del silenci en memòria', () => {
  test('«8 hores» en memòria s’acaba sol: el fil torna a sumar sense recarregar', async () => {
    /* Sense el permís, amagada no es mira la llista: només corre el temporitzador del silenci. */
    estatDelPermis = 'denied';
    await refrescaPermisAvisos();
    mock.capSilenci = false;
    await llest();
    await silencia('f-pepa', '8h');
    expect(pepa().silenciat).toBe(true);
    expect(value.totalNoLlegits).toBe(0);
    amaga();
    await avanca(8 * HORA - 60000);
    expect(pepa().silenciat).toBe(true);
    await avanca(2 * 60000);
    await waitFor(() => expect(pepa().silenciat).toBe(false));
    expect(value.totalNoLlegits).toBe(2);
  });

  /* ARB-SIL-02 · El topall de 24 h del temporitzador: un «sempre» en memòria
     (any 9999) no pot armar un setTimeout de més de 2^31-1 ms, que els
     navegadors disparen de seguida (un bucle de repintats). Rearmat cada 24 h,
     el fil continua silenciat. */
  test('«sempre» en memòria: cap espera passa del límit dels navegadors, no repinta en bucle i, rearmat, continua silenciat passades 25 h', async () => {
    estatDelPermis = 'denied';
    await refrescaPermisAvisos();
    mock.capSilenci = false;
    await llest();
    const espia = vi.spyOn(globalThis, 'setTimeout');
    const esperaMesLlarga = () => Math.max(0, ...espia.mock.calls.map((crida) => Number(crida[1]) || 0));
    try {
      await silencia('f-pepa', 'sempre');
      const abans = renders;
      await avanca(300);
      expect(esperaMesLlarga()).toBeLessThanOrEqual(MAXIM_SET_TIMEOUT);
      expect(renders - abans).toBeLessThan(10);
      amaga();
      await avanca(25 * HORA);
      expect(esperaMesLlarga()).toBeLessThanOrEqual(MAXIM_SET_TIMEOUT);
      expect(renders - abans).toBeLessThan(20);
      expect(pepa().silenciat).toBe(true);
      expect(value.totalNoLlegits).toBe(0);
    } finally {
      espia.mockRestore();
    }
  });
});
