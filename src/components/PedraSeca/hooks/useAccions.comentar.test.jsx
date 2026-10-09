/**
 * Ordre del Mestre (261007) · «Comentaris = xat» · Comentar ofereix SEMPRE
 * dues vies, i useAccions fa la triada que li passa el menú (BotoComentar):
 *  · 'privat' · el xat privat amb Sóc de Poble, el missatge directe amb
 *    l'entitat, resolt UNA vegada per a tota l'app (useXatSocDePoble). Sense
 *    proveïdor, el de la llavor (/xat?amb=socdepoble). Onada 8 (261009) · Si
 *    l'objecte té autor (o és un perfil), el xat amb ell: vegeu el seu bloc.
 *  · 'public' · el xat públic de l'element (T63.2), si el contracte l'admet.
 * comentarXat diu què oferix el menú: 'comu' (les dues), 'privat' (la
 * pública, desactivada) o null (cap menú: un handler propi, que mana).
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn() }));
vi.mock('../../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('../../universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));

import { AVIS_SENSE_XAT, interlocutorDelPrivat, useAccions } from './useAccions.js';
import { XAT_SOCDEPOBLE_DE_LLAVOR, XatSocDePobleContext } from './xatSocDePoble.js';
import {
  objecteDe, objecteDePagina, objecteDePerfil, oblidaEntitatDelProjecte, registraEntitatDelProjecte
} from '../../../config/navigation.js';
import { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG } from '../../../data/identitatsSeed.js';

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

  /* Onada 8 (261009) · Derogat el «privat és Sóc de Poble» del perfil: el xat
     privat d'una persona o d'una IA és el seu, el mateix de «Escriu-li al
     xat». Sense nom (cap línia que el diga), el de Sóc de Poble. */
  test('una persona o una IA no tenen xat públic: el seu directe no ho és; «privat» és el seu xat', () => {
    for (const objecte of [{ tipus: 'ia', id: 'iaia', titol: 'IAIA MarIA' }, { tipus: 'persona', id: 'pepa', titol: 'Pepa', ruta: '/gent/pepa' }]) {
      mocks.navigate.mockClear();
      const { result } = renderHook(() => useAccions({ objecte, hasFooter: true }));
      expect(result.current.comentarXat).toBe('privat');
      expect(result.current.comentarPrivatAmb).toBe(objecte.titol);
      result.current.handleComment('public');
      expect(mocks.navigate).not.toHaveBeenCalled();
      result.current.handleComment('privat');
      expect(mocks.navigate).toHaveBeenCalledWith(`/xat?amb=${objecte.id}`);
    }
    mocks.navigate.mockClear();
    const { result } = renderHook(() => useAccions({ objecte: { tipus: 'persona', id: 'pepa' }, hasFooter: true }));
    expect(result.current.comentarPrivatAmb).toBeNull();
    result.current.handleComment('privat');
    expect(mocks.navigate).toHaveBeenCalledWith('/xat?amb=socdepoble');
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

/* Onada 8 (261009; requeriments, punt 3) · «Comentar» → «En privat» obri el
   xat amb l'AUTOR de la publicació (/xat?amb=<id>), encara que no el
   conegues: el backend ja ho permet (crea_fil_directe). El pilot (id, àlies o
   UUID registrat), una pàgina sense autor i una publicació pròpia continuen
   anant al xat amb Sóc de Poble. El menú diu amb qui (comentarPrivatAmb). Els
   descriptors són els de veres (objecteDe, objecteDePerfil). */
describe('Onada 8 · «En privat» obri el xat amb l’autor', () => {
  const UUID_PILOT = '0b1c2d3e-4f50-4a61-8b72-93a4b5c6d7e8';
  const UUID_PEPA = '3c2b1a09-8f7e-4d6c-9b5a-4e3d2c1b0a99';
  afterEach(() => { oblidaEntitatDelProjecte(); });

  const privat = (objecte, valorXat) => {
    mocks.navigate.mockClear();
    const { result } = valorXat === undefined
      ? renderHook(() => useAccions({ objecte, hasFooter: true }))
      : ambXat(valorXat, { objecte, hasFooter: true });
    result.current.handleComment('privat');
    return { ruta: mocks.navigate.mock.calls.at(-1)?.[0], amb: result.current.comentarPrivatAmb };
  };

  test('una publicació d’una persona: el seu xat, amb el seu nom al menú', () => {
    const objecte = objecteDe({ id: 'p1', title: 'Coca', ownerUserId: UUID_PEPA, author_name: 'Pepa' }, 'mur');
    expect(privat(objecte)).toEqual({ ruta: `/xat?amb=${UUID_PEPA}`, amb: 'Pepa' });
  });

  test('una publicació d’una entitat qualsevol: el seu xat; un producte, el de qui ven', () => {
    expect(privat(objecteDe({ id: 'p2', title: 'Pa', author_org_id: 'forn', author_name: 'Forn de la Plaça' }, 'mur')))
      .toEqual({ ruta: '/xat?amb=forn', amb: 'Forn de la Plaça' });
    expect(privat(objecteDe({ id: 'm1', title: 'Mel', author_entity_id: 'abelles', seller: 'Les Abelles' }, 'mercat')))
      .toEqual({ ruta: '/xat?amb=abelles', amb: 'Les Abelles' });
  });

  test('el pilot, per id, per àlies o pel UUID registrat: el xat amb Sóc de Poble, i el menú de sempre', () => {
    for (const id of [ENTITAT_PILOT_ID, 'soc-de-poble_official']) {
      const objecte = objecteDe({ id: 'p3', title: 'Avís', author_org_id: id, author_name: 'Sóc de Poble' }, 'mur');
      expect(objecte.autor.projecte).toBe(true);
      expect([id, privat(objecte)]).toEqual([id, { ruta: XAT_SOCDEPOBLE_DE_LLAVOR.href, amb: null }]);
    }
    registraEntitatDelProjecte({ tipus: 'entitat', id: UUID_PILOT, slug: ENTITAT_PILOT_SLUG });
    const remot = objecteDe({ id: 'p4', title: 'Avís', author_org_id: UUID_PILOT, author_name: 'Sóc de Poble' }, 'mur');
    expect(privat(remot, { estat: 'remot', href: `/xat?amb=${UUID_PILOT}`, avis: null })).toEqual({ ruta: `/xat?amb=${UUID_PILOT}`, amb: null });
    /* El perfil del pilot també va pel canal de Sóc de Poble. */
    expect(privat(objecteDePerfil({ tipus: 'entitat', id: ENTITAT_PILOT_ID, nom: 'Sóc de Poble' }))).toEqual({ ruta: XAT_SOCDEPOBLE_DE_LLAVOR.href, amb: null });
  });

  test('sense autor (una pàgina, un poble, un nom sense id): el xat amb Sóc de Poble', () => {
    const casos = [
      objecteDePagina({ titol: 'El projecte', ruta: '/projecte' }),
      objecteDe({ id: 'sella', title: 'Sella', author: 'Gent de Sella' }, 'pobles'),
      objecteDe({ id: 'p5', title: 'Coca', author_name: 'Pepa' }, 'mur'),
      undefined,
      null
    ];
    for (const objecte of casos) expect([objecte?.tipus, privat(objecte)]).toEqual([objecte?.tipus, { ruta: XAT_SOCDEPOBLE_DE_LLAVOR.href, amb: null }]);
  });

  test('una publicació pròpia (de qui mira o d’una entitat que representa): el xat amb Sóc de Poble', () => {
    const esDeQuiMira = (id) => [UUID_PEPA, 'forn'].includes(id);
    const valor = { ...XAT_SOCDEPOBLE_DE_LLAVOR, esDeQuiMira };
    expect(privat(objecteDe({ id: 'p6', title: 'Coca', ownerUserId: UUID_PEPA, author_name: 'Pepa' }, 'mur'), valor))
      .toEqual({ ruta: XAT_SOCDEPOBLE_DE_LLAVOR.href, amb: null });
    expect(privat(objecteDe({ id: 'p7', title: 'Pa', author_org_id: 'forn', author_name: 'Forn' }, 'mur'), valor))
      .toEqual({ ruta: XAT_SOCDEPOBLE_DE_LLAVOR.href, amb: null });
    /* La d'una altra persona, amb el mateix proveïdor: la seua. */
    expect(privat(objecteDe({ id: 'p8', title: 'Mel', ownerUserId: 'jordi', author_name: 'Jordi' }, 'mur'), valor))
      .toEqual({ ruta: '/xat?amb=jordi', amb: 'Jordi' });
  });

  test('un perfil de persona, d’entitat o de grup: el seu xat, encara que no el conegues', () => {
    expect(privat(objecteDePerfil({ tipus: 'persona', id: UUID_PEPA, nom: 'Pepa' }))).toEqual({ ruta: `/xat?amb=${UUID_PEPA}`, amb: 'Pepa' });
    expect(privat(objecteDePerfil({ tipus: 'entitat', id: 'forn', nom: 'Forn de la Plaça' }))).toEqual({ ruta: '/xat?amb=forn', amb: 'Forn de la Plaça' });
    expect(privat(objecteDePerfil({ tipus: 'grup', id: 'colla', nom: 'La Colla' }))).toEqual({ ruta: '/xat?amb=colla', amb: 'La Colla' });
  });

  /* Revisió de l'Onada 8 · En llavor, el xat local només obri directes amb el
     seu padró: el proveïdor hi posa directeAmb (xatCorporatiu.js ·
     directeDeLlavor, que en té la prova amb el localXat de veres). Ací, un
     doble: l'àlies d'una persona passa a l'id del padró, i un autor que no hi
     és va al xat amb Sóc de Poble, amb el menú de sempre, mai a un error. */
  test('en llavor (directeAmb): l’àlies, a l’id del padró; un autor de fora del padró, el xat amb Sóc de Poble', () => {
    const directeAmb = vi.fn((qui) => ({ javillinares: '0001', iaia: 'iaia' })[qui.id] ?? null);
    const valor = { ...XAT_SOCDEPOBLE_DE_LLAVOR, directeAmb };
    expect(privat(objecteDe({ id: 'mac', title: 'Mac Mini', author_id: 'javillinares', author_name: 'Javi' }, 'mercat'), valor))
      .toEqual({ ruta: '/xat?amb=0001', amb: 'Javi' });
    expect(directeAmb).toHaveBeenCalledWith(expect.objectContaining({ tipus: 'persona', id: 'javillinares' }));
    expect(privat(objecteDePerfil({ tipus: 'ia', id: 'iaia', nom: 'IAIA MarIA' }), valor)).toEqual({ ruta: '/xat?amb=iaia', amb: 'IAIA MarIA' });
    expect(privat(objecteDePerfil({ tipus: 'persona', id: UUID_PEPA, nom: 'Andreu Soler' }), valor))
      .toEqual({ ruta: XAT_SOCDEPOBLE_DE_LLAVOR.href, amb: null });
    /* L'id del padró també es mira contra qui mira: el teu àlies és teu. */
    const propi = { ...valor, esDeQuiMira: (id) => id === '0001' };
    expect(privat(objecteDe({ id: 'mac', title: 'Mac Mini', author_id: 'javillinares', author_name: 'Javi' }, 'mercat'), propi))
      .toEqual({ ruta: XAT_SOCDEPOBLE_DE_LLAVOR.href, amb: null });
  });

  test('l’interlocutor és pur: interlocutorDelPrivat no navega ni inventa', () => {
    expect(interlocutorDelPrivat(objecteDe({ id: 'p9', ownerUserId: 'pepa', author_name: 'Pepa' }, 'mur')))
      .toEqual({ tipus: 'persona', id: 'pepa', nom: 'Pepa', projecte: false });
    expect(interlocutorDelPrivat({ tipus: 'nota', id: 'n1', titol: 'Nota' })).toBeNull();
    /* Un id que no cap en una ruta de l'app: cap xat amb ell. */
    expect(interlocutorDelPrivat({ tipus: 'persona', id: 'x'.repeat(400), titol: 'Llarg' })).toBeNull();
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
