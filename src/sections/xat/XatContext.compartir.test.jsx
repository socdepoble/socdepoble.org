/* Gauntlet 261026_1615 (Codex C1615-01 / Gemini G1615-00) · El que s'ha
   compartit des del menú «Compartir» del dispositiu és de la persona que hi
   era. Eixir de la sessió, o entrar-ne una altra, el descarta al proveïdor del
   xat (XatContext, efecte de `personaPrevia`), també el fitxer que el
   compositor tenia en vol: ja no pot tornar al lot i la seua còpia nativa
   s'allibera. Compartir abans d'entrar (convidat → persona) el conserva, i una
   renovació del JWT (generacio) no hi toca. El proveïdor i el registre són els
   de veres (config/compartirNatiu.js); arnés de XatContext.nivellIaia.test.jsx. */
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import '../../host.js';
import { XatProvider, useXat } from './XatContext.jsx';
import { ambXatsPerDefecte } from '../../data/xatsPerDefecte.js';
import {
  compartitPendent, descartaCompartit, lliuraCompartit, prenFitxerCompartit,
  registraAlliberadorCompartit, tornaFitxerCompartit, triaDestiCompartit
} from '../../config/compartirNatiu.js';

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

const ara = '2026-10-26T16:15:00Z';
const fils = () => ambXatsPerDefecte([
  { id: 'f-pepa', tipus: 'directe', titol: 'Pepa', altres: [{ id: 'P', nom: 'Pepa', tipus: 'persona' }], ultimSeq: 1, llegitFinsSeq: 1, noLlegits: 0, ultimAutorId: 'P', ultimAl: ara }
]);

let value;
function Probe() {
  value = useXat();
  return null;
}
// La mateixa config a cada pintat: només canvia la sessió.
const CONFIG = { backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a' };
const arbre = () => <XatProvider config={CONFIG}><Probe /></XatProvider>;
/* La sessió que torna useSession (sense persona: el convidat, en remot sense joId). */
const sessio = (id, generacio = 1) => {
  mock.session = id ? { currentUser: { id }, generacio } : { currentUser: null, generacio, estat: 'fora' };
  mock.actorKey = id ? `persona::${id}` : null;
};

/* El pont natiu: cada fitxer amb la seua còpia (ruta), i qui l'allibera. */
const allibera = vi.fn();
const RUTES = ['file:///cache/compartit/1.png', 'file:///cache/compartit/2.png'];
const nouLot = () => {
  const fitxers = [new Blob(['u'], { type: 'image/png' }), new Blob(['dos'], { type: 'image/png' })];
  lliuraCompartit({ fitxers, rutes: RUTES, text: 'Mireu el cartell' });
  return fitxers;
};

beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear(); mock.pathname = '/mur';
  sessio('A');
  descartaCompartit();
  registraAlliberadorCompartit(allibera);
  mock.loadFils.mockResolvedValue(fils());
  mock.loadMissatges.mockResolvedValue([]);
  mock.subscribeToXat.mockResolvedValue({ subscription: null, error: null });
  mock.teCapacitat.mockReturnValue(true);
});
afterEach(() => { cleanup(); descartaCompartit(); registraAlliberadorCompartit(null); localStorage.clear(); });

/* A ha compartit dos fotos i ha triat el directe amb Pepa; el compositor
   d'eixa conversa ja n'ha pres la primera (en vol). */
async function lotDA() {
  const vista = render(arbre());
  await waitFor(() => expect(value.status).toBe('ready'));
  let fitxers;
  let pres;
  act(() => {
    fitxers = nouLot();
    triaDestiCompartit('f-pepa', 'A');
    pres = prenFitxerCompartit('f-pepa', 'A');
  });
  expect(pres.fitxer).toBe(fitxers[0]);
  expect(compartitPendent()).toMatchObject({ desti: 'f-pepa', propietari: 'A' });
  expect(compartitPendent().fitxers).toHaveLength(1);
  expect(allibera).not.toHaveBeenCalled();
  return { vista, fitxers, pres };
}

/* El lot ja no hi és, el fitxer en vol tampoc pot tornar, i les dues còpies
   natives s'han alliberat (una pel descart, l'altra en intentar tornar). */
const descartat = (pres) => {
  expect(compartitPendent()).toBeNull();
  expect(allibera).toHaveBeenCalledWith([RUTES[1]]);
  expect(tornaFitxerCompartit(pres)).toBe(false);
  expect(compartitPendent()).toBeNull();
  expect(allibera).toHaveBeenCalledWith([RUTES[0]]);
  expect(allibera).toHaveBeenCalledTimes(2);
};

test('si entra una altra persona (A → B), el lot d’A es descarta, també el fitxer en vol', async () => {
  const { vista, pres } = await lotDA();
  sessio('B', 2);
  vista.rerender(arbre());
  descartat(pres);
  // B no el troba a la conversa (ni com a propietari ni sense).
  expect(prenFitxerCompartit('f-pepa', 'B')).toBeNull();
});

test('si A ix de la sessió (A → convidat), el lot es descarta, també el fitxer en vol', async () => {
  const { vista, pres } = await lotDA();
  sessio(null, 2);
  vista.rerender(arbre());
  descartat(pres);
});

/* clauPersona no porta `generacio`: una renovació del JWT no és una sessió nova. */
test('una renovació del JWT (A → A, generacio nova) conserva el lot i el fitxer en vol hi pot tornar', async () => {
  const { vista, fitxers, pres } = await lotDA();
  const lot = compartitPendent();
  sessio('A', 2);
  vista.rerender(arbre());
  await waitFor(() => expect(value.status).toBe('ready'));
  expect(compartitPendent()).toBe(lot);
  expect(allibera).not.toHaveBeenCalled();
  act(() => { expect(tornaFitxerCompartit(pres)).toBe(true); });
  expect(compartitPendent().fitxers).toEqual(fitxers);
  expect(compartitPendent().fitxers[0]).toBe(fitxers[0]);
  expect(compartitPendent().text).toBe('Mireu el cartell');
});

/* L'App rep la captura abans que la persona entre: compartir abans d'entrar
   és el cas legítim, i el lot l'espera per a triar la conversa. */
test('compartir abans d’entrar (convidat → A) conserva el lot, i A el pot triar i prendre', async () => {
  sessio(null);
  const vista = render(arbre());
  await act(async () => {});
  let fitxers;
  act(() => { fitxers = nouLot(); });
  const lot = compartitPendent();
  sessio('A', 2);
  vista.rerender(arbre());
  await waitFor(() => expect(value.status).toBe('ready'));
  expect(compartitPendent()).toBe(lot);
  expect(allibera).not.toHaveBeenCalled();
  act(() => { triaDestiCompartit('f-pepa', 'A'); });
  let pres;
  act(() => { pres = prenFitxerCompartit('f-pepa', 'A'); });
  expect(pres.fitxer).toBe(fitxers[0]);
  expect(pres.peu).toBe('Mireu el cartell');
  expect(allibera).not.toHaveBeenCalled();
});
