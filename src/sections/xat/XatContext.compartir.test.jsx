/* Gauntlet 261026_1615 (Codex C1615-01 / Gemini G1615-00) · El que s'ha
   compartit des del menú «Compartir» del dispositiu és de la persona que hi
   era. Eixir de la sessió, o entrar-ne una altra, el descarta al proveïdor del
   xat (XatContext, efecte de `personaPrevia`), també el fitxer que el
   compositor tenia en vol: ja no pot tornar al lot i la seua còpia nativa
   s'allibera. Compartir abans d'entrar (convidat → persona) el conserva, i una
   renovació del JWT (generacio) no hi toca. El proveïdor i el registre són els
   de veres (config/compartirNatiu.js); arnés de XatContext.nivellIaia.test.jsx.
   Pla 261028_1526 (Bloc D, P1-31): el canvi de backend, la lectura en vol,
   el backend que canvia sense ningú dins i el tall que arriba al natiu (el
   tallador: només en una sessió nova, mai en compartir abans d'entrar). */
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import '../../host.js';
import { XatProvider, useXat } from './XatContext.jsx';
import { ambXatsPerDefecte } from '../../data/xatsPerDefecte.js';
import {
  compartitPendent, descartaCompartit, lliuraCompartit, prenFitxerCompartit, registraAlliberadorCompartit,
  registraTalladorCompartit, sessioCompartit, tornaFitxerCompartit, triaDestiCompartit
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
// La mateixa config a cada pintat: només canvia la sessió (llevat de les proves del backend, amb ALTRE).
const CONFIG = { backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000a' };
const ALTRE = { backendId: 'supabase', tenantId: '00000000-0000-0000-0000-00000000000b' };
const arbre = (config = CONFIG) => <XatProvider config={config}><Probe /></XatProvider>;
/* La sessió que torna useSession (sense persona: el convidat, en remot sense joId). */
const sessio = (id, generacio = 1) => {
  mock.session = id ? { currentUser: { id }, generacio } : { currentUser: null, generacio, estat: 'fora' };
  mock.actorKey = id ? `persona::${id}` : null;
};

/* El pont natiu: cada fitxer amb la seua còpia (ruta), qui l'allibera i qui hi talla la sessió. */
const allibera = vi.fn();
const talla = vi.fn();
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
  registraTalladorCompartit(talla);
  mock.loadFils.mockResolvedValue(fils());
  mock.loadMissatges.mockResolvedValue([]);
  mock.subscribeToXat.mockResolvedValue({ subscription: null, error: null });
  mock.teCapacitat.mockReturnValue(true);
});
afterEach(() => { cleanup(); descartaCompartit(); registraAlliberadorCompartit(null); registraTalladorCompartit(null); localStorage.clear(); });

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

test('si entra una altra persona (A → B), el lot d’A es descarta, també el fitxer en vol, i el natiu talla', async () => {
  const { vista, pres } = await lotDA();
  expect(talla).not.toHaveBeenCalled();
  sessio('B', 2);
  vista.rerender(arbre());
  descartat(pres);
  expect(talla).toHaveBeenCalledTimes(1);
  // B no el troba a la conversa (ni com a propietari ni sense).
  expect(prenFitxerCompartit('f-pepa', 'B')).toBeNull();
});

test('si A ix de la sessió (A → convidat), el lot es descarta, també el fitxer en vol, i el natiu talla', async () => {
  const { vista, pres } = await lotDA();
  sessio(null, 2);
  vista.rerender(arbre());
  descartat(pres);
  expect(talla).toHaveBeenCalledTimes(1);
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
  expect(talla).not.toHaveBeenCalled();
  act(() => { expect(tornaFitxerCompartit(pres)).toBe(true); });
  expect(compartitPendent().fitxers).toEqual(fitxers);
  expect(compartitPendent().fitxers[0]).toBe(fitxers[0]);
  expect(compartitPendent().text).toBe('Mireu el cartell');
});

/* L'App rep la captura abans que la persona entre: compartir abans d'entrar
   és el cas legítim, i el lot l'espera per a triar la conversa. La conversa
   que el convidat ja hi havia triat (en llavor o en local, on té xat) també es
   conserva: el mateix backend, cap «Envia a…» de nou. */
test('compartir abans d’entrar (convidat → A) conserva el lot i el seu destí, i A el pot triar i prendre', async () => {
  sessio(null);
  const vista = render(arbre());
  await act(async () => {});
  let fitxers;
  act(() => {
    fitxers = nouLot();
    triaDestiCompartit('f-pepa');
  });
  const lot = compartitPendent();
  expect(lot.desti).toBe('f-pepa');
  sessio('A', 2);
  vista.rerender(arbre());
  await waitFor(() => expect(value.status).toBe('ready'));
  expect(compartitPendent()).toBe(lot);
  expect(allibera).not.toHaveBeenCalled();
  expect(talla).not.toHaveBeenCalled();
  act(() => { triaDestiCompartit('f-pepa', 'A'); });
  let pres;
  act(() => { pres = prenFitxerCompartit('f-pepa', 'A'); });
  expect(pres.fitxer).toBe(fitxers[0]);
  expect(pres.peu).toBe('Mireu el cartell');
  expect(allibera).not.toHaveBeenCalled();
});

/* Pla 261028_1526 (Bloc D, P1-31) · Canviar de backend amb algú dins és una
   sessió nova, i el pont té època pròpia (sessioCompartit): el que encara
   llegia en la sessió d'abans ja no entra. El pont es fa ací a mà, com
   natiu/compartirNatiu.js: pren l'època en rebre el lot i la torna en lliurar-lo
   (el receptor de veres, amb el registre, el prova compartirNatiu.seguretat.test.js). */
test('si canvia el backend amb A dins ([X, A] → [Y, A]), el lot d’A es descarta, també el fitxer en vol, i la sessió puja', async () => {
  const { vista, pres } = await lotDA();
  const abans = sessioCompartit();
  vista.rerender(arbre(ALTRE));
  descartat(pres);
  expect(sessioCompartit()).toBe(abans + 1);
  expect(talla).toHaveBeenCalledTimes(1);
  expect(prenFitxerCompartit('f-pepa', 'A')).toBeNull();
});

test('A ix mentre el pont encara llig la seua compartició, i entra B: el lot no arriba, B no el troba i les còpies s’alliberen', async () => {
  const vista = render(arbre());
  await waitFor(() => expect(value.status).toBe('ready'));
  // El pont rep la compartició en la sessió d'A i comença a llegir-la.
  const epocaDA = sessioCompartit();
  sessio(null, 2);
  vista.rerender(arbre());
  sessio('B', 3);
  vista.rerender(arbre());
  await waitFor(() => expect(value.status).toBe('ready'));
  // La lectura acaba ara, ja amb B dins.
  const fitxers = [new Blob(['u'], { type: 'image/png' }), new Blob(['dos'], { type: 'image/png' })];
  let id;
  act(() => { id = lliuraCompartit({ fitxers, rutes: RUTES, text: 'la foto d’A', sessio: epocaDA }); });
  expect(id).toBeNull();
  expect(compartitPendent()).toBeNull();
  act(() => { expect(triaDestiCompartit('f-pepa', 'B')).toBe(false); });
  expect(prenFitxerCompartit('f-pepa', 'B')).toBeNull();
  expect(prenFitxerCompartit('f-pepa')).toBeNull();
  expect(allibera.mock.calls).toEqual([[RUTES]]);
  // Un sol tall natiu: el de l'eixida d'A (l'entrada de B, després de ningú, no ho és).
  expect(talla).toHaveBeenCalledTimes(1);
});

test('compartir abans d’entrar amb la lectura en vol (convidat → A): no és cap sessió nova i el lot entra per a A', async () => {
  sessio(null);
  const vista = render(arbre());
  await act(async () => {});
  const epoca = sessioCompartit();
  sessio('A', 2);
  vista.rerender(arbre());
  await waitFor(() => expect(value.status).toBe('ready'));
  expect(sessioCompartit()).toBe(epoca);
  let fitxers;
  act(() => {
    fitxers = [new Blob(['u'], { type: 'image/png' })];
    expect(lliuraCompartit({ fitxers, rutes: RUTES.slice(0, 1), sessio: epoca })).not.toBeNull();
    triaDestiCompartit('f-pepa', 'A');
  });
  expect(prenFitxerCompartit('f-pepa', 'A').fitxer).toBe(fitxers[0]);
  expect(allibera).not.toHaveBeenCalled();
});

/* Sense ningú dins, canviar de backend no descarta res (en fred la config pot
   assentar-se després de la compartició), però la conversa triada era de
   l'altre backend: el lot torna a «Envia a…» (desti null). */
test('si canvia el backend sense ningú dins ([X, convidat] → [Y, convidat]), el lot es conserva i només torna a «Envia a…»', async () => {
  sessio(null);
  const vista = render(arbre());
  await act(async () => {});
  const abans = sessioCompartit();
  let fitxers;
  act(() => {
    fitxers = nouLot();
    triaDestiCompartit('f-pepa');
  });
  const lot = compartitPendent();
  expect(lot.desti).toBe('f-pepa');
  vista.rerender(arbre(ALTRE));
  await act(async () => {});
  expect(compartitPendent()).toMatchObject({ id: lot.id, desti: null, propietari: null, text: 'Mireu el cartell' });
  expect(compartitPendent().fitxers).toEqual(fitxers);
  expect(compartitPendent().fitxers[0]).toBe(fitxers[0]);
  expect(sessioCompartit()).toBe(abans);
  expect(allibera).not.toHaveBeenCalled();
  expect(talla).not.toHaveBeenCalled();
});
