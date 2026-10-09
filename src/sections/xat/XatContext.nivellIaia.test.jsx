/* Onada 6 (tasca 12) · «Si el nivell d'IA és 0 (apagada), la IAIA no hauria
   d'aparéixer al llistat de xats.» El context del xat l'amaga de tot el que es
   veu: la llista (i per tant les cerques i les comunitats), els no llegits,
   els contactes freqüents i els avisos. Les dades no es toquen: en tornar a
   encendre-la, reapareix sense recarregar. */
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import '../../host.js';
import { XatProvider, useXat } from './XatContext.jsx';
import { ambXatsPerDefecte } from '../../data/xatsPerDefecte.js';
import { IAIA_ID } from '../../data/identitatsSeed.js';
import { CLAU_NIVELL_IAIA, anunciaNivellIaia } from '../realitat/nivellIaia.js';
import { setVal } from '../../config/storage.js';

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

const ara = '2026-10-09T01:00:00Z';
const PAGINA_IAIA = { tipus: 'pagina', id: '/iaia', ruta: '/iaia', titol: "L'ànima de la iaia" };
/* La llista del servidor: una persona, el xat públic de /iaia (vestit), un
   directe amb la IAIA i la fila sintètica de Sóc de Poble a la cua. */
const fils = () => ambXatsPerDefecte([
  { id: 'f-pepa', tipus: 'directe', titol: 'Pepa', altres: [{ id: 'P', nom: 'Pepa', tipus: 'persona' }], ultimSeq: 2, llegitFinsSeq: 0, noLlegits: 2, ultimAutorId: 'P', ultimAl: ara },
  { id: 'p-iaia', tipus: 'grup', titol: 'IAIA MarIA', subjecte: PAGINA_IAIA, ultimSeq: 3, llegitFinsSeq: 0, noLlegits: 3, ultimAutorId: 'X', ultimAl: ara },
  { id: 'd-iaia', tipus: 'directe', titol: 'IAIA MarIA', altres: [{ id: IAIA_ID, nom: 'IAIA MarIA', tipus: 'ia' }], ultimSeq: 1, llegitFinsSeq: 0, noLlegits: 1, ultimAutorId: IAIA_ID, ultimAl: ara }
]);

let value;
function Probe() {
  value = useXat();
  return null;
}
const munta = () => render(<XatProvider config={{ backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a' }}><Probe /></XatProvider>);
const ids = () => value.chatThreads.map((f) => f.perDefecte ?? f.id);
const canviaNivell = (nivell) => act(() => { setVal(CLAU_NIVELL_IAIA, nivell); anunciaNivellIaia(nivell); });

beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear(); mock.pathname = '/mur';
  mock.loadFils.mockResolvedValue(fils());
  mock.loadMissatges.mockResolvedValue([]);
  mock.subscribeToXat.mockResolvedValue({ subscription: null, error: null });
  mock.teCapacitat.mockReturnValue(true);
});
afterEach(() => { cleanup(); localStorage.clear(); vi.useRealTimers(); });

test('amb el nivell 1 (de sèrie) la IAIA hi és: llista, no llegits i contactes freqüents', async () => {
  munta();
  await waitFor(() => expect(value.status).toBe('ready'));
  expect(ids()).toEqual(['f-pepa', 'p-iaia', 'd-iaia', 'socdepoble']);
  expect(value.iaiaApagada).toBe(false);
  expect(value.totalNoLlegits).toBe(6);
  expect(value.contactesFrequents.map((c) => c.usuari_id)).toEqual(['P', IAIA_ID]);
  expect(value.esFilAmagat('p-iaia')).toBe(false);
});

test('amb el nivell 0 la IAIA desapareix de tot el que es veu, i torna en encendre-la', async () => {
  setVal(CLAU_NIVELL_IAIA, 0);
  munta();
  await waitFor(() => expect(value.status).toBe('ready'));
  expect(value.iaiaApagada).toBe(true);
  expect(ids()).toEqual(['f-pepa', 'socdepoble']);
  expect(value.totalNoLlegits).toBe(2);
  expect(value.contactesFrequents.map((c) => c.usuari_id)).toEqual(['P']);
  expect([value.esFilAmagat('p-iaia'), value.esFilAmagat('d-iaia'), value.esFilAmagat('f-pepa'), value.esFilAmagat(null)]).toEqual([true, true, false, false]);

  canviaNivell(2);
  expect(value.iaiaApagada).toBe(false);
  expect(ids()).toEqual(['f-pepa', 'p-iaia', 'd-iaia', 'socdepoble']);
  expect(value.totalNoLlegits).toBe(6);
  /* Cap crida nova al servidor: les dades eren les mateixes. */
  expect(mock.loadFils).toHaveBeenCalledTimes(1);
});

test('la fila per defecte de la IAIA (remot, encara sense xat) també se’n va', async () => {
  mock.loadFils.mockResolvedValue(ambXatsPerDefecte([]));
  munta();
  await waitFor(() => expect(value.status).toBe('ready'));
  expect(ids()).toEqual(['socdepoble', 'iaia']);
  canviaNivell(0);
  expect(ids()).toEqual(['socdepoble']);
});

test('amb la IAIA apagada, un missatge nou al seu xat no avisa; el d’una persona, sí', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  setVal(CLAU_NIVELL_IAIA, 0);
  munta();
  await waitFor(() => expect(value.status).toBe('ready'));
  mock.showToast.mockClear();
  /* El sondeig següent porta un missatge nou al xat de /iaia i un a Pepa. */
  const nous = fils().map((f) => (f.id === 'p-iaia' ? { ...f, ultimSeq: 4, noLlegits: 4 } : f.id === 'f-pepa' ? { ...f, ultimSeq: 3, noLlegits: 3 } : f));
  mock.loadFils.mockResolvedValue(nous);
  await act(async () => { await vi.advanceTimersByTimeAsync(26000); });
  await waitFor(() => expect(mock.showToast).toHaveBeenCalledTimes(1));
  expect(mock.showToast).toHaveBeenCalledWith('Missatge nou de Pepa');
});
