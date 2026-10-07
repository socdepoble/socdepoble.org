/**
 * Ordre del Mestre (261007) · «Comentaris = xat» · Comentar ofereix SEMPRE
 * dues vies, i useAccions fa la triada que li passa el menú (BotoComentar):
 *  · 'privat' · el xat privat amb Sóc de Poble, el missatge directe amb
 *    l'entitat, resolt UNA vegada per a tota l'app (useXatSocDePoble). Sense
 *    proveïdor, el de la llavor (/xat?amb=socdepoble).
 *  · 'public' · el xat públic de l'element (T63.2), si el contracte l'admet.
 * comentarXat diu què oferix el menú: 'comu' (les dues), 'privat' (la
 * pública, desactivada) o null (cap menú: un handler propi, que mana).
 */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn() }));
vi.mock('../../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('../../universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));

import { AVIS_SENSE_XAT, useAccions } from './useAccions.js';
import { XAT_SOCDEPOBLE_DE_LLAVOR, XatSocDePobleContext } from './xatSocDePoble.js';

const UUID = '7d1f4c2e-9a3b-4c5d-8e6f-0a1b2c3d4e5f';
const desti = () => {
  const url = new URL(mocks.navigate.mock.calls.at(-1)[0], 'http://localhost');
  return { cami: url.pathname, ...Object.fromEntries(url.searchParams) };
};
/* El hook dins d'un proveïdor del xat de Sóc de Poble amb el valor donat. */
const ambXat = (valor, props) => renderHook(() => useAccions(props), {
  wrapper: ({ children }) => <XatSocDePobleContext.Provider value={valor}>{children}</XatSocDePobleContext.Provider>
});

beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, '', '/mur');
});

describe('261007 · les dues vies de Comentar', () => {
  test('una publicació: el menú porta les dues; «públic», el seu xat amb el títol; «privat», Sóc de Poble (llavor)', () => {
    const objecte = { tipus: 'publicacio', id: 'coca', titol: 'Recepta de coca', ruta: '/mur/coca' };
    const { result } = renderHook(() => useAccions({ title: 'Recepta de coca', objecte, hasFooter: true }));
    expect(result.current.comentarVisible).toBe(true);
    expect(result.current.comentarXat).toBe('comu');
    result.current.handleComment('public');
    expect(desti()).toEqual({ cami: '/xat', sobre: 'publicacio:coca', titol: 'Recepta de coca', ruta: '/mur/coca' });
    result.current.handleComment('privat');
    expect(mocks.navigate).toHaveBeenLastCalledWith(XAT_SOCDEPOBLE_DE_LLAVOR.href);
    expect(XAT_SOCDEPOBLE_DE_LLAVOR.href).toBe('/xat?amb=socdepoble');
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  test('sense via no fa res: Comentar sempre passa pel menú', () => {
    const { result } = renderHook(() => useAccions({ title: 'Mur', hasFooter: true, telemetria: { origen: 'pagina' } }));
    for (const via of [undefined, 'directe', { type: 'click' }]) result.current.handleComment(via);
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  test('sense xat públic, el menú es queda amb la pública desactivada («privat») i la privada funciona', () => {
    const casos = [
      { title: 'El Xat', mainHref: '/page/xat', hasFooter: true }, // una pàgina fora de PAGINES_AMB_XAT
      { title: 'Carregant…', objecte: null, hasFooter: true, telemetria: { origen: 'pagina' } },
      { title: 'Pepa', hasFooter: true }, // una targeta sense objecte ni detall
      { objecte: { tipus: 'pagina', id: 'Genoma', ruta: '/wikidepoble?item=genoma' }, hasFooter: true }
    ];
    for (const props of casos) {
      mocks.navigate.mockClear();
      const { result } = renderHook(() => useAccions(props));
      expect([props.title, result.current.comentarVisible, result.current.comentarXat]).toEqual([props.title, true, 'privat']);
      result.current.handleComment('privat');
      expect(mocks.navigate).toHaveBeenCalledWith('/xat?amb=socdepoble');
    }
  });

  test('si algú crida la via pública sense xat públic, ho diu i no navega', () => {
    const { result } = renderHook(() => useAccions({ title: 'El Xat', mainHref: '/page/xat', hasFooter: true }));
    result.current.handleComment('public');
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith(AVIS_SENSE_XAT);
  });

  test('una persona o una IA no tenen xat públic: el seu directe no ho és; «privat» és Sóc de Poble', () => {
    for (const objecte of [{ tipus: 'ia', id: 'iaia' }, { tipus: 'persona', id: 'pepa', ruta: '/gent/pepa' }]) {
      mocks.navigate.mockClear();
      const { result } = renderHook(() => useAccions({ objecte, hasFooter: true }));
      expect(result.current.comentarXat).toBe('privat');
      result.current.handleComment('public');
      expect(mocks.navigate).not.toHaveBeenCalled();
      result.current.handleComment('privat');
      expect(mocks.navigate).toHaveBeenCalledWith('/xat?amb=socdepoble');
    }
  });

  test('una nota no ofereix Comentar: cap menú', () => {
    const { result } = renderHook(() => useAccions({ objecte: { tipus: 'nota', id: 'n1' }, hasFooter: true, showComment: true }));
    expect([result.current.comentarVisible, result.current.comentarXat]).toEqual([false, null]);
  });

  test('un handler propi mana: es crida tal qual i no hi ha menú (com un onTranslate propi)', () => {
    const onComment = vi.fn();
    const { result } = renderHook(() => useAccions({ title: 'Prova', onComment, objecte: { tipus: 'publicacio', id: 'p1' } }));
    expect(result.current.comentarXat).toBeNull();
    result.current.handleComment('privat');
    expect(onComment).toHaveBeenCalledWith('privat');
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});

describe('261007 · la via privada llig el proveïdor de l’app', () => {
  const objecte = { tipus: 'producte', id: 'samarreta', titol: 'Samarreta', ruta: '/mercat/samarreta' };

  test('en remot resolt: el xat de l’entitat que ha tornat el port', () => {
    const { result } = ambXat({ estat: 'remot', href: `/xat?amb=${UUID}`, avis: null }, { objecte, hasFooter: true });
    result.current.handleComment('privat');
    expect(mocks.navigate).toHaveBeenCalledWith(`/xat?amb=${UUID}`);
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  test('en remot encara sense resoldre: diu que es busca, el demana una vegada i hi va quan arriba', async () => {
    const resol = vi.fn(() => Promise.resolve({ estat: 'remot', href: `/xat?amb=${UUID}`, avis: null }));
    const { result } = ambXat({ estat: 'pendent', href: null, avis: 'Encara es busca.', resol }, { objecte, hasFooter: true });
    result.current.handleComment('privat');
    expect(mocks.toast).toHaveBeenCalledWith('Encara es busca.');
    expect(resol).toHaveBeenCalledTimes(1);
    expect(mocks.navigate).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith(`/xat?amb=${UUID}`));
  });

  test('si la resolució acaba sense xat, ho diu (una vegada) i no navega', async () => {
    const absent = vi.fn(() => Promise.resolve({ estat: 'absent', href: null, avis: 'No disponible.' }));
    const primer = ambXat({ estat: 'pendent', href: null, avis: 'Encara es busca.', resol: absent }, { objecte, hasFooter: true });
    primer.result.current.handleComment('privat');
    await vi.waitFor(() => expect(mocks.toast).toHaveBeenLastCalledWith('No disponible.'));
    expect(mocks.toast.mock.calls).toEqual([['Encara es busca.'], ['No disponible.']]);
    mocks.toast.mockClear();
    /* Un error que torna a fallar: el mateix avís, una sola vegada. */
    const error = vi.fn(() => Promise.resolve({ estat: 'error', href: null, avis: 'No disponible.' }));
    const segon = ambXat({ estat: 'error', href: null, avis: 'No disponible.', resol: error }, { objecte, hasFooter: true });
    segon.result.current.handleComment('privat');
    await vi.waitFor(() => expect(error).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    expect(mocks.toast.mock.calls).toEqual([['No disponible.']]);
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  /* Correcció C6 · Una sola navegació diferida: la de l'última tria de l'app
     (`darrera`, del proveïdor), i només si la persona continua on era. */
  describe('C6 · la navegació que espera el xat', () => {
    /* Una resolució que es respon a mà, amb el `darrera` que diria el proveïdor. */
    const pendent = (darrera) => {
      let respon;
      const resol = vi.fn(() => new Promise((r) => { respon = (xat) => r({ ...xat, darrera }); }));
      return { resol, respon: (xat) => respon(xat) };
    };
    const REMOT = { estat: 'remot', href: `/xat?amb=${UUID}`, avis: null };
    const PENDENT = { estat: 'pendent', href: null, avis: 'Encara es busca.' };

    test('una tria que ja no és l’última de l’app no navega ni avisa; l’última, sí, una vegada', async () => {
      const vella = pendent(false);
      const primer = ambXat({ ...PENDENT, resol: vella.resol }, { objecte, hasFooter: true });
      primer.result.current.handleComment('privat');
      await act(async () => { vella.respon(REMOT); });
      expect(mocks.navigate).not.toHaveBeenCalled();
      mocks.toast.mockClear();
      const ultima = pendent(true);
      const segon = ambXat({ ...PENDENT, resol: ultima.resol }, { objecte, hasFooter: true });
      segon.result.current.handleComment('privat');
      await act(async () => { ultima.respon(REMOT); });
      expect(mocks.navigate).toHaveBeenCalledTimes(1);
      expect(mocks.navigate).toHaveBeenCalledWith(REMOT.href);
      /* Sense xat, l'avís també és només de l'última. */
      mocks.toast.mockClear();
      const sense = pendent(false);
      ambXat({ ...PENDENT, resol: sense.resol }, { objecte, hasFooter: true }).result.current.handleComment('privat');
      mocks.toast.mockClear();
      await act(async () => { sense.respon({ estat: 'absent', href: null, avis: 'No disponible.' }); });
      expect(mocks.toast).not.toHaveBeenCalled();
    });

    test('si la persona ha canviat de ruta des del clic, la resposta no la porta al xat', async () => {
      const espera = pendent(true);
      const { result } = ambXat({ ...PENDENT, resol: espera.resol }, { objecte, hasFooter: true });
      result.current.handleComment('privat');
      window.history.replaceState(null, '', '/mercat');
      await act(async () => { espera.respon(REMOT); });
      expect(mocks.navigate).not.toHaveBeenCalled();
      /* La mateixa tria, sense moure's: hi va. */
      const quieta = pendent(true);
      const altra = ambXat({ ...PENDENT, resol: quieta.resol }, { objecte, hasFooter: true });
      altra.result.current.handleComment('privat');
      await act(async () => { quieta.respon(REMOT); });
      expect(mocks.navigate.mock.calls).toEqual([[REMOT.href]]);
    });

    test('si la peça que ha triat ja no hi és (desmuntada), la resposta no navega', async () => {
      const espera = pendent(true);
      const { result, unmount } = ambXat({ ...PENDENT, resol: espera.resol }, { objecte, hasFooter: true });
      result.current.handleComment('privat');
      unmount();
      await act(async () => { espera.respon(REMOT); });
      expect(mocks.navigate).not.toHaveBeenCalled();
    });
  });

  test('en remot sense xat (resolent, absent, error): l’avís del proveïdor, sense navegar; la pública no en depén', () => {
    const { result } = ambXat({ estat: 'resolent', href: null, avis: 'Xat de Sóc de Poble: encara s’està buscant.' }, { objecte, hasFooter: true });
    result.current.handleComment('privat');
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith('Xat de Sóc de Poble: encara s’està buscant.');
    result.current.handleComment('public');
    expect(desti().sobre).toBe('producte:samarreta');
  });
});
