/* 261026 (prompt 261026_1615, tasca 3) · Els avisos natius del xat, al
   proveïdor real amb el registre real (config/avisosNatius.js) i un adaptador
   fals. Amb l'App a la vista, el toast de sempre; amb l'App fora de la vista i
   el permís concedit, el sondeig de la llista continua (cada MS_LLISTA_SEGON_PLA,
   60 s) i l'avís és del sistema, també si la persona es va quedar al xat.
   Sense permís, amagada no es mira res, com abans. Arnés de
   XatContext.nivellIaia.test.jsx. */
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../host.js';
import { XatProvider, useXat } from './XatContext.jsx';
import { ambXatsPerDefecte } from '../../data/xatsPerDefecte.js';
import { idDAvis, refrescaPermisAvisos, registraAvisosNatius } from '../../config/avisosNatius.js';

const mock = vi.hoisted(() => ({
  session: { currentUser: { id: 'A' }, generacio: 1 }, actorKey: 'persona::A', pathname: '/mur', showToast: vi.fn(),
  loadFils: vi.fn(), loadMissatges: vi.fn(), enviaMissatge: vi.fn(), marcaLlegit: vi.fn(),
  creaFilDirecte: vi.fn(), carregaMembres: vi.fn(), subscribeToXat: vi.fn(), unsubscribeFromXat: vi.fn(),
  obriFilDePagina: vi.fn(), teCapacitat: vi.fn()
}));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => mock.session }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorKey: mock.actorKey, identitats: undefined }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useLocation: () => ({ pathname: mock.pathname }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, fallback) => fallback }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mock.showToast }) }));
vi.mock('../../data/backendPort.js', () => mock);
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));

/* Un sol adaptador per al registre del mòdul (només es registra una vegada):
   el permís es canvia per la clausura i es torna a llegir amb refrescaPermisAvisos.
   netejaAvisos (opcional al contracte) hi és des del principi: el registre
   el llig a cada crida de netejaAvisosNatius. */
let estatDelPermis = 'granted';
const adaptador = {
  estatPermis: vi.fn(async () => estatDelPermis),
  demanaPermis: vi.fn(async () => estatDelPermis),
  avisa: vi.fn(async () => {}),
  escoltaToc: vi.fn(),
  netejaAvisos: vi.fn(async () => {})
};
registraAvisosNatius(adaptador);

const ara = '2026-10-26T16:00:00Z';
/* El directe amb Pepa, amb `seq` missatges seus. */
const filDePepa = (seq) => ({ id: 'f-pepa', tipus: 'directe', titol: 'Pepa', altres: [{ id: 'P', nom: 'Pepa', tipus: 'persona' }], ultimSeq: seq, llegitFinsSeq: 0, noLlegits: seq, ultimAutorId: 'P', ultimAl: ara });
/* Una conversa que encara no era a la llista: Quim hi escriu el primer missatge. */
const filDeQuim = (seq) => ({ id: 'f-nou', tipus: 'directe', titol: 'Quim', altres: [{ id: 'Q', nom: 'Quim', tipus: 'persona' }], ultimSeq: seq, llegitFinsSeq: 0, noLlegits: seq, ultimAutorId: 'Q', ultimAl: ara });
/* La llista del servidor: el directe amb Pepa i, si cal, altres converses. */
const fils = (seq, ...altres) => ambXatsPerDefecte([filDePepa(seq), ...altres]);

let value;
function Probe() {
  value = useXat();
  return null;
}
const munta = () => render(<XatProvider config={{ backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a' }}><Probe /></XatProvider>);
const amaga = () => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
  document.dispatchEvent(new Event('visibilitychange'));
};
const mostra = () => { delete document.visibilityState; delete document.hidden; };
/* La persona torna a l'App: la pàgina es veu i el document ho anuncia. */
const torna = () => { mostra(); document.dispatchEvent(new Event('visibilitychange')); };
const avanca = (ms) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });
/* L'avís que esperem del directe amb Pepa. */
/* Gauntlet 261026_1615 (C1615-09) · L'avís porta `vigent`: es torna a mirar si
   la pàgina continua amagada just abans d'encarregar-lo. */
const AVIS_PEPA = { id: idDAvis('f-pepa'), titol: 'Pepa', cos: 'Missatge nou', filId: 'f-pepa', vigent: expect.any(Function) };
const AVIS_QUIM = { id: idDAvis('f-nou'), titol: 'Quim', cos: 'Missatge nou', filId: 'f-nou', vigent: expect.any(Function) };

/* Muntat amb l'App a la vista i la llista ja carregada (la línia base dels avisos). */
async function llest() {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  munta();
  await waitFor(() => expect(value.status).toBe('ready'));
  expect(mock.loadFils).toHaveBeenCalledTimes(1);
  mock.showToast.mockClear();
}

beforeEach(async () => {
  vi.clearAllMocks(); localStorage.clear(); mock.pathname = '/mur';
  mock.loadFils.mockResolvedValue(fils(2));
  mock.loadMissatges.mockResolvedValue([]);
  mock.subscribeToXat.mockResolvedValue({ subscription: null, error: null });
  mock.teCapacitat.mockReturnValue(true);
  estatDelPermis = 'granted';
  await refrescaPermisAvisos();
});
afterEach(() => { cleanup(); mostra(); localStorage.clear(); vi.useRealTimers(); });

test('amb l’App a la vista i fora del xat, un missatge nou d’una altra persona porta el toast i cap avís natiu', async () => {
  await llest();
  mock.loadFils.mockResolvedValue(fils(3));
  await avanca(26000);
  await waitFor(() => expect(mock.showToast).toHaveBeenCalledTimes(1));
  expect(mock.showToast).toHaveBeenCalledWith('Missatge nou de Pepa');
  expect(adaptador.avisa).not.toHaveBeenCalled();
});

test('amb l’App amagada i el permís concedit, el sondeig continua cada minut i l’avís és del sistema, sense toast', async () => {
  await llest();
  amaga();
  /* El tic armat a la vista (25 s) ja mira la llista amb la pàgina amagada. */
  mock.loadFils.mockResolvedValue(fils(3));
  await avanca(26000);
  await waitFor(() => expect(adaptador.avisa).toHaveBeenCalledTimes(1));
  expect(mock.loadFils).toHaveBeenCalledTimes(2);
  expect(adaptador.avisa).toHaveBeenCalledWith(AVIS_PEPA);
  expect(mock.showToast).not.toHaveBeenCalled();

  /* Després, cada 60 s: als 30 s (on el de la vista ja hauria mirat) encara no. */
  mock.loadFils.mockResolvedValue(fils(4));
  await avanca(30000);
  expect(mock.loadFils).toHaveBeenCalledTimes(2);
  await avanca(30000);
  await waitFor(() => expect(mock.loadFils).toHaveBeenCalledTimes(3));
  await waitFor(() => expect(adaptador.avisa).toHaveBeenCalledTimes(2));
  expect(adaptador.avisa).toHaveBeenLastCalledWith(AVIS_PEPA);
  expect(mock.showToast).not.toHaveBeenCalled();
});

test('amb l’App amagada al xat (/xat/…), l’avís natiu arriba igual i no torna a demanar el permís', async () => {
  mock.pathname = '/xat/f-pepa';
  /* El refresc del beforeEach ja ha cridat estatPermis: es buida perquè la
     crida que es mira siga la d'entrar al xat amb sessió, i no la d'abans. */
  adaptador.estatPermis.mockClear();
  await llest();
  /* Entrar al xat amb sessió consulta el permís; ja concedit, cap diàleg. */
  expect(adaptador.estatPermis).toHaveBeenCalledTimes(1);
  expect(adaptador.demanaPermis).not.toHaveBeenCalled();
  amaga();
  mock.loadFils.mockResolvedValue(fils(3));
  await avanca(26000);
  await waitFor(() => expect(adaptador.avisa).toHaveBeenCalledTimes(1));
  expect(adaptador.avisa).toHaveBeenCalledWith(AVIS_PEPA);
  expect(mock.showToast).not.toHaveBeenCalled();
  expect(adaptador.demanaPermis).not.toHaveBeenCalled();
});

test('amb el permís encara per decidir, entrar al xat amb sessió el demana una sola vegada; fora del xat, mai', async () => {
  estatDelPermis = 'prompt';
  await refrescaPermisAvisos();
  adaptador.estatPermis.mockClear();
  /* Fora del xat (/mur): ni es consulta ni es pregunta, encara que la llista avance. */
  await llest();
  mock.loadFils.mockResolvedValue(fils(3));
  await avanca(26000);
  await waitFor(() => expect(mock.loadFils).toHaveBeenCalledTimes(2));
  expect(adaptador.estatPermis).not.toHaveBeenCalled();
  expect(adaptador.demanaPermis).not.toHaveBeenCalled();
  cleanup();
  vi.useRealTimers();

  /* Al xat (/xat): una sola pregunta, i els sondejos de després no la repetixen. */
  mock.pathname = '/xat';
  mock.loadFils.mockClear();
  mock.loadFils.mockResolvedValue(fils(3));
  await llest();
  await waitFor(() => expect(adaptador.demanaPermis).toHaveBeenCalledTimes(1));
  mock.loadFils.mockResolvedValue(fils(4));
  await avanca(26000);
  await waitFor(() => expect(mock.loadFils).toHaveBeenCalledTimes(2));
  await avanca(1000);
  expect(adaptador.demanaPermis).toHaveBeenCalledTimes(1);
});

test('sense el permís concedit, amagada no es mira la llista ni arriba cap avís (com abans)', async () => {
  estatDelPermis = 'denied';
  await refrescaPermisAvisos();
  await llest();
  amaga();
  mock.loadFils.mockResolvedValue(fils(3));
  await avanca(26000);
  await avanca(65000);
  expect(mock.loadFils).toHaveBeenCalledTimes(1);
  expect(adaptador.avisa).not.toHaveBeenCalled();
  expect(mock.showToast).not.toHaveBeenCalled();
});

/* Revisió 261026 · Un xat silenciat no fa sonar el telèfon: amb l'App amagada
   no hi ha avís natiu (el toast de dins de l'App no canvia). */
test('un xat silenciat no porta cap avís natiu amb l’App amagada', async () => {
  const silenciat = (seq) => fils(seq).map((f) => (f.id === 'f-pepa' ? { ...f, silenciatFinsAl: '2099-01-01T00:00:00Z' } : f));
  mock.loadFils.mockResolvedValue(silenciat(2));
  await llest();
  amaga();
  mock.loadFils.mockResolvedValue(silenciat(3));
  await avanca(26000);
  await waitFor(() => expect(mock.loadFils).toHaveBeenCalledTimes(2));
  await avanca(1000);
  expect(adaptador.avisa).not.toHaveBeenCalled();
});

/* Revisió 261026 · Un xat arxivat tampoc: el port torna el fil del domini
   (`arxivatAl`) i el context el passa per mapejaFil, que en fa `arxivat`. El
   toast de dins de l'App es queda, com amb el silenciat. */
test('un xat arxivat no porta cap avís natiu amb l’App amagada; el toast de dins de l’App es queda', async () => {
  const arxivat = (seq) => fils(seq).map((f) => (f.id === 'f-pepa' ? { ...f, arxivatAl: '2026-10-20T10:00:00Z' } : f));
  mock.loadFils.mockResolvedValue(arxivat(2));
  await llest();
  amaga();
  mock.loadFils.mockResolvedValue(arxivat(3));
  await avanca(26000);
  await waitFor(() => expect(mock.loadFils).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(mock.showToast).toHaveBeenCalledTimes(1));
  expect(mock.showToast).toHaveBeenCalledWith('Missatge nou de Pepa');
  await avanca(1000);
  expect(adaptador.avisa).not.toHaveBeenCalled();
});

/* Revisió 261026 · La primera llista de l'àmbit és la línia base; una conversa
   que apareix DESPRÉS és nova i el seu primer missatge avisa. */
test('una conversa nova en un sondeig posterior avisa del seu primer missatge (a la vista, el toast; una sola vegada)', async () => {
  await llest();
  mock.loadFils.mockResolvedValue(fils(2, filDeQuim(1)));
  await avanca(26000);
  await waitFor(() => expect(mock.showToast).toHaveBeenCalledTimes(1));
  expect(mock.showToast).toHaveBeenCalledWith('Missatge nou de Quim');
  expect(adaptador.avisa).not.toHaveBeenCalled();
  /* El sondeig següent porta la mateixa llista: res de nou, cap avís repetit. */
  await avanca(26000);
  await waitFor(() => expect(mock.loadFils).toHaveBeenCalledTimes(3));
  await avanca(1000);
  expect(mock.showToast).toHaveBeenCalledTimes(1);
});

test('una conversa nova amb l’App amagada i el permís concedit porta l’avís del sistema', async () => {
  await llest();
  amaga();
  mock.loadFils.mockResolvedValue(fils(2, filDeQuim(1)));
  await avanca(26000);
  await waitFor(() => expect(adaptador.avisa).toHaveBeenCalledTimes(1));
  expect(adaptador.avisa).toHaveBeenCalledWith(AVIS_QUIM);
  expect(mock.showToast).not.toHaveBeenCalled();
});

test('la primera llista mai avisa (és la línia base), encara que les converses porten missatges', async () => {
  mock.loadFils.mockResolvedValue(fils(5, filDeQuim(3)));
  vi.useFakeTimers({ shouldAdvanceTime: true });
  munta();
  await waitFor(() => expect(value.status).toBe('ready'));
  expect(mock.loadFils).toHaveBeenCalledTimes(1);
  expect(mock.showToast).not.toHaveBeenCalled();
  expect(adaptador.avisa).not.toHaveBeenCalled();
  /* El sondeig següent, amb la mateixa llista, tampoc: la base ja hi és. */
  await avanca(26000);
  await waitFor(() => expect(mock.loadFils).toHaveBeenCalledTimes(2));
  await avanca(1000);
  expect(mock.showToast).not.toHaveBeenCalled();
  expect(adaptador.avisa).not.toHaveBeenCalled();
});

test('la primera llista tampoc avisa pel sistema si l’App arrenca amagada', async () => {
  mock.loadFils.mockResolvedValue(fils(5, filDeQuim(3)));
  vi.useFakeTimers({ shouldAdvanceTime: true });
  amaga();
  munta();
  await waitFor(() => expect(value.status).toBe('ready'));
  expect(mock.loadFils).toHaveBeenCalledTimes(1);
  await avanca(1000);
  expect(adaptador.avisa).not.toHaveBeenCalled();
});

/* En tornar a l'App, el permís es torna a llegir (es pot haver canviat als
   ajustos) i els avisos que ja són a la barra sobren. Amagar-la no fa res d'això. */
test('en tornar a l’App es torna a llegir el permís i es lleven els avisos de la barra', async () => {
  await llest();
  adaptador.estatPermis.mockClear();
  amaga();
  await avanca(500);
  expect(adaptador.netejaAvisos).not.toHaveBeenCalled();
  expect(adaptador.estatPermis).not.toHaveBeenCalled();
  torna();
  expect(adaptador.netejaAvisos).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(adaptador.estatPermis).toHaveBeenCalledTimes(1));
  expect(adaptador.demanaPermis).not.toHaveBeenCalled();
});

/* Gauntlet 261030 (cicle 2, Codex C3) · L'avís natiu va lligat a la generació
   de persona: el `vigent` que rep l'adaptador (i que es mira just abans del
   schedule) torna fals si mentrestant la persona ha eixit o n'ha entrat una
   altra, encara que l'App continue amagada. En eixir o canviar de persona,
   els avisos que ja són a la barra se'n van. Una renovació del JWT no és cap
   persona nova: ni invalida l'avís ni neteja la barra. */
describe('C3 · la generació de persona dels avisos natius', () => {
  const CONFIG = Object.freeze({ backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a' });
  const arbre = () => <XatProvider config={CONFIG}><Probe /></XatProvider>;
  let vista = null;
  /* Amagada, amb la llista ja carregada i un avís de Pepa encarregat: en torna el `vigent`. */
  async function avisPendent() {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vista = render(arbre());
    await waitFor(() => expect(value.status).toBe('ready'));
    amaga();
    mock.loadFils.mockResolvedValue(fils(3));
    await avanca(26000);
    await waitFor(() => expect(adaptador.avisa).toHaveBeenCalledTimes(1));
    expect(adaptador.avisa).toHaveBeenCalledWith(AVIS_PEPA);
    const { vigent } = adaptador.avisa.mock.calls[0][0];
    expect(vigent()).toBe(true);
    adaptador.netejaAvisos.mockClear();
    return vigent;
  }
  const canviaSessio = (session, actorKey = mock.actorKey) => act(async () => {
    mock.session = session;
    mock.actorKey = actorKey;
    vista.rerender(arbre());
  });
  afterEach(() => {
    mock.session = { currentUser: { id: 'A' }, generacio: 1 };
    mock.actorKey = 'persona::A';
    vista = null;
  });

  test('entra una altra persona (A → B) amb l’App amagada: l’avís d’A ja no és vigent i la barra es neteja', async () => {
    const vigent = await avisPendent();
    await canviaSessio({ currentUser: { id: 'B' }, generacio: 2 }, 'persona::B');
    expect(document.hidden).toBe(true);
    expect(vigent()).toBe(false);
    expect(adaptador.netejaAvisos).toHaveBeenCalledTimes(1);
  });

  test('A ix (i torna a entrar): l’avís d’abans de l’eixida ja no és vigent, tampoc amb A de nou', async () => {
    const vigent = await avisPendent();
    await canviaSessio({ currentUser: null, generacio: 2 });
    expect(vigent()).toBe(false);
    expect(adaptador.netejaAvisos).toHaveBeenCalledTimes(1);
    await canviaSessio({ currentUser: { id: 'A' }, generacio: 3 }, 'persona::A');
    expect(vigent()).toBe(false);
  });

  test('una renovació del JWT (la mateixa persona) no toca l’avís ni la barra', async () => {
    const vigent = await avisPendent();
    await canviaSessio({ currentUser: { id: 'A' }, generacio: 2 });
    expect(vigent()).toBe(true);
    expect(adaptador.netejaAvisos).not.toHaveBeenCalled();
    /* I quan la persona torna a l'App, deixa de ser vigent per la vista, com sempre. */
    mostra();
    expect(vigent()).toBe(false);
  });
});
