/**
 * IdentitatContext · la persona es pinta amb la seua fila de profiles.
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front A): la barra negra
 * pintava una «S» perquè l'actor només llegia les metadades de GoTrue. El
 * proveïdor de veres; la sessió i el port, simulats (getProfile i
 * listMyOrganizations). Dades sintètiques: cap compte real.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';

const m = vi.hoisted(() => ({
  sessio: { currentUser: null, generacio: 1 },
  /* undefined: el getProfile de veres del port (sense backend, llança en cridar-lo). */
  getProfile: undefined,
  organitzacions: async () => []
}));
vi.mock('./SessionContext.jsx', () => ({ useSession: () => m.sessio }));
vi.mock('../../data/backendPort.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    getDefaultUserId: () => m.sessio.currentUser?.id ?? null,
    getProfile: (...args) => (m.getProfile ? m.getProfile(...args) : real.getProfile(...args)),
    listMyOrganizations: (...args) => m.organitzacions(...args)
  };
});

import { IdentitatProvider, desaPreferencia, useIdentitat } from './IdentitatContext.jsx';

const FOTO = 'https://lh3.googleusercontent.com/a/pepa.png';
const FOTO_META = 'https://lh3.googleusercontent.com/a/pepa-meta.png';
const FOTO_NOVA = 'https://lh3.googleusercontent.com/a/pepa-nova.png';
const POBLE = 'La Torre de les Maçanes';
/* El símptoma: una sessió d'entrada amb contrasenya, sense metadades. */
const PEPA = Object.freeze({ id: 'u-pepa', email: 'pepa@poble.test', user_metadata: Object.freeze({}) });
const FILA_PEPA = Object.freeze({ id: 'u-pepa', full_name: 'Pepa Soler', avatar_url: FOTO, town_name: POBLE });
const TONI = Object.freeze({ id: 'u-toni', email: 'toni@poble.test', user_metadata: Object.freeze({}) });
const FILA_TONI = Object.freeze({ id: 'u-toni', full_name: 'Toni Ferrer', avatar_url: FOTO_NOVA, town_name: 'Benilloba' });

function diferida() {
  let resol;
  let rebutja;
  const promesa = new Promise((r, j) => { resol = r; rebutja = j; });
  return { promesa, resol, rebutja };
}
/* Una resposta per crida, en ordre: la prova decidix quan arriba cadascuna. */
function portAmbRespostes() {
  const respostes = [];
  const getProfile = vi.fn(() => {
    const d = diferida();
    respostes.push(d);
    return d.promesa;
  });
  return { getProfile, respostes };
}

const munta = () => renderHook(() => useIdentitat(), {
  wrapper: ({ children }) => <IdentitatProvider>{children}</IdentitatProvider>
});
const buida = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
const ambSessio = (currentUser, generacio = 1) => { m.sessio = { currentUser, generacio }; };

afterEach(() => {
  cleanup();
  desaPreferencia(PEPA.id, null);
  m.sessio = { currentUser: null, generacio: 1 };
  m.getProfile = undefined;
  m.organitzacions = async () => [];
  vi.restoreAllMocks();
});

describe('la fila de profiles', () => {
  test('sense metadades, l’actor persona i identitats[0] porten el nom, la foto i el poble de la fila', async () => {
    ambSessio(PEPA);
    const port = portAmbRespostes();
    m.getProfile = port.getProfile;
    const { result } = munta();
    /* Mentre la fila no arriba, la reserva de sempre: el correu (d'ací la «P»). */
    expect(result.current.actor).toMatchObject({ tipus: 'persona', id: 'u-pepa', nom: 'pepa@poble.test', avatar: null, poble: '' });
    await waitFor(() => expect(port.getProfile).toHaveBeenCalledTimes(1));
    /* El port rep la configuració del proveïdor, com listMyOrganizations. */
    expect(port.getProfile).toHaveBeenCalledWith({});
    await act(async () => { port.respostes[0].resol(FILA_PEPA); });
    await waitFor(() => expect(result.current.actor.nom).toBe('Pepa Soler'));
    expect(result.current.actor).toEqual({
      tipus: 'persona', id: 'u-pepa', nom: 'Pepa Soler', avatar: FOTO, rol: 'persona', slug: null, kind: null, poble: POBLE
    });
    expect(result.current.identitats).toEqual([
      { tipus: 'persona', id: 'u-pepa', nom: 'Pepa Soler', avatar: FOTO, poble: POBLE, rol: 'persona', activa: true }
    ]);
    /* Les claus del context no canvien. */
    expect(Object.keys(result.current).sort()).toEqual(
      ['actor', 'actorId', 'actorKey', 'actorType', 'carregant', 'error', 'identitats', 'memberships', 'refresh', 'setActor']
    );
  });

  test.each([
    ['la fila de reserva de l’adaptador', { ...FILA_PEPA, reserva: true }],
    ['una fila d’un altre compte', { ...FILA_TONI }],
    ['cap fila (null)', null]
  ])('%s no entra: es queden les metadades', async (_cas, fila) => {
    ambSessio({ ...PEPA, user_metadata: { full_name: 'Pepa de les metadades', avatar_url: FOTO_META } });
    m.getProfile = vi.fn(async () => fila);
    const { result } = munta();
    await waitFor(() => expect(m.getProfile).toHaveBeenCalled());
    await buida();
    expect(result.current.actor).toMatchObject({ nom: 'Pepa de les metadades', avatar: FOTO_META, poble: '' });
    expect(result.current.identitats[0]).toMatchObject({ nom: 'Pepa de les metadades', avatar: FOTO_META, poble: '' });
  });
});

describe('cap crida sense sessió, i cap caiguda si el port falla', () => {
  test('sense sessió, getProfile no es crida mai i l’actor és el convidat, sense poble', async () => {
    m.getProfile = vi.fn(async () => FILA_PEPA);
    const { result } = munta();
    await buida();
    expect(m.getProfile).not.toHaveBeenCalled();
    expect(result.current.actor).toEqual({
      tipus: 'persona', id: null, nom: null, avatar: null, rol: 'convidat', slug: null, kind: null, poble: null
    });
    expect(result.current.identitats).toEqual([]);
  });

  test('un port que rebutja: cap error a la consola, i les metadades', async () => {
    const errors = vi.spyOn(console, 'error');
    ambSessio({ ...PEPA, user_metadata: { full_name: 'Pepa Soler', avatar_url: FOTO_META, town_name: POBLE } });
    m.getProfile = vi.fn(async () => { throw new Error('Servidor caigut'); });
    const { result } = munta();
    await waitFor(() => expect(m.getProfile).toHaveBeenCalled());
    await buida();
    expect(result.current.actor).toMatchObject({ nom: 'Pepa Soler', avatar: FOTO_META, poble: POBLE });
    expect(result.current.error).toBeNull();
    expect(errors).not.toHaveBeenCalled();
  });

  test('un port sense getProfile (asseguraMetode llança en cridar-lo, síncron): cap caiguda, i les metadades', async () => {
    const real = await vi.importActual('../../data/backendPort.js');
    /* La precondició: sense backend, el mètode del port llança de manera síncrona. */
    expect(() => real.getProfile({})).toThrow('El mètode "getProfile" no està implementat');
    const errors = vi.spyOn(console, 'error');
    ambSessio({ ...PEPA, user_metadata: { full_name: 'Pepa Soler' } });
    const { result } = munta();
    await buida();
    expect(result.current.actor).toMatchObject({ tipus: 'persona', nom: 'Pepa Soler', avatar: null, poble: '' });
    expect(errors).not.toHaveBeenCalled();
  });
});

describe('mai es barregen dos comptes', () => {
  test('una resposta tardana del compte anterior no s’aplica mai al compte nou', async () => {
    ambSessio(PEPA);
    const port = portAmbRespostes();
    m.getProfile = port.getProfile;
    const { result, rerender } = munta();
    await waitFor(() => expect(port.getProfile).toHaveBeenCalledTimes(1));
    ambSessio(TONI, 2);
    rerender();
    await waitFor(() => expect(port.getProfile).toHaveBeenCalledTimes(2));
    expect(result.current.actor).toMatchObject({ id: 'u-toni', nom: 'toni@poble.test' });
    /* Arriba la de Pepa, tard: ni nom, ni foto, ni poble. */
    await act(async () => { port.respostes[0].resol(FILA_PEPA); });
    await buida();
    expect(result.current.actor).toMatchObject({ id: 'u-toni', nom: 'toni@poble.test', avatar: null, poble: '' });
    expect(result.current.identitats[0]).toMatchObject({ id: 'u-toni', nom: 'toni@poble.test', avatar: null });
    await act(async () => { port.respostes[1].resol(FILA_TONI); });
    await waitFor(() => expect(result.current.actor.nom).toBe('Toni Ferrer'));
    expect(result.current.actor).toMatchObject({ id: 'u-toni', avatar: FOTO_NOVA, poble: 'Benilloba' });
  });

  test('eixir buida el perfil: tornar a entrar amb un altre compte no hereta res', async () => {
    ambSessio(PEPA);
    m.getProfile = vi.fn(async () => FILA_PEPA);
    const { result, rerender } = munta();
    await waitFor(() => expect(result.current.actor.nom).toBe('Pepa Soler'));
    ambSessio(null, 2);
    rerender();
    expect(result.current.actor).toMatchObject({ nom: null, avatar: null, poble: null, rol: 'convidat' });
    const port = portAmbRespostes();
    m.getProfile = port.getProfile;
    ambSessio(TONI, 3);
    rerender();
    expect(result.current.actor).toMatchObject({ id: 'u-toni', nom: 'toni@poble.test', avatar: null, poble: '' });
    await waitFor(() => expect(port.getProfile).toHaveBeenCalledTimes(1));
  });
});

describe('la firma: una edició a l’app fa manar les metadades fins que arriba la fila nova', () => {
  test('editar el perfil (metadades noves) torna a llegir la fila i, mentrestant, mana el que s’ha editat', async () => {
    ambSessio(PEPA);
    const port = portAmbRespostes();
    m.getProfile = port.getProfile;
    const { result, rerender } = munta();
    await waitFor(() => expect(port.getProfile).toHaveBeenCalledTimes(1));
    await act(async () => { port.respostes[0].resol(FILA_PEPA); });
    await waitFor(() => expect(result.current.actor.nom).toBe('Pepa Soler'));
    /* actualitzaUsuariSessio: la mateixa persona, amb les metadades editades. */
    ambSessio({ ...PEPA, user_metadata: { full_name: 'Pepa Nova', avatar_url: FOTO_META } });
    rerender();
    expect(result.current.actor).toMatchObject({ nom: 'Pepa Nova', avatar: FOTO_META, poble: '' });
    expect(result.current.identitats[0]).toMatchObject({ nom: 'Pepa Nova', avatar: FOTO_META });
    await waitFor(() => expect(port.getProfile).toHaveBeenCalledTimes(2));
    await act(async () => { port.respostes[1].resol({ ...FILA_PEPA, full_name: 'Pepa Nova Soler', avatar_url: FOTO_NOVA }); });
    await waitFor(() => expect(result.current.actor.nom).toBe('Pepa Nova Soler'));
    expect(result.current.actor).toMatchObject({ avatar: FOTO_NOVA, poble: POBLE });
  });

  test('si la relectura després de l’edició falla, la fila vella no torna: manen les metadades', async () => {
    ambSessio(PEPA);
    const port = portAmbRespostes();
    m.getProfile = port.getProfile;
    const { result, rerender } = munta();
    await waitFor(() => expect(port.getProfile).toHaveBeenCalledTimes(1));
    await act(async () => { port.respostes[0].resol(FILA_PEPA); });
    await waitFor(() => expect(result.current.actor.nom).toBe('Pepa Soler'));
    /* Esborra la foto i canvia el nom: cap foto vella a la barra. */
    ambSessio({ ...PEPA, user_metadata: { full_name: 'Pepa Nova' } });
    rerender();
    await waitFor(() => expect(port.getProfile).toHaveBeenCalledTimes(2));
    await act(async () => { port.respostes[1].rebutja(new Error('Sense xarxa')); });
    await buida();
    expect(result.current.actor).toMatchObject({ nom: 'Pepa Nova', avatar: null, poble: '' });
  });
});

describe('relectures: refresh() i la renovació de la sessió', () => {
  test('refresh() torna a llegir la fila; la mateixa fila no canvia l’actor, una de nova sí', async () => {
    ambSessio(PEPA);
    const port = portAmbRespostes();
    m.getProfile = port.getProfile;
    const { result } = munta();
    await waitFor(() => expect(port.getProfile).toHaveBeenCalledTimes(1));
    await act(async () => { port.respostes[0].resol(FILA_PEPA); });
    await waitFor(() => expect(result.current.actor.nom).toBe('Pepa Soler'));
    const actor = result.current.actor;
    act(() => result.current.refresh());
    await waitFor(() => expect(port.getProfile).toHaveBeenCalledTimes(2));
    await act(async () => { port.respostes[1].resol({ ...FILA_PEPA }); });
    await buida();
    expect(result.current.actor).toBe(actor);
    act(() => result.current.refresh());
    await waitFor(() => expect(port.getProfile).toHaveBeenCalledTimes(3));
    await act(async () => { port.respostes[2].resol({ ...FILA_PEPA, avatar_url: FOTO_NOVA }); });
    await waitFor(() => expect(result.current.actor.avatar).toBe(FOTO_NOVA));
  });

  test('una renovació (generacio) torna a llegir; si falla, la foto bona es queda (no parpelleja)', async () => {
    ambSessio(PEPA, 1);
    const port = portAmbRespostes();
    m.getProfile = port.getProfile;
    const { result, rerender } = munta();
    await waitFor(() => expect(port.getProfile).toHaveBeenCalledTimes(1));
    await act(async () => { port.respostes[0].resol(FILA_PEPA); });
    await waitFor(() => expect(result.current.actor.avatar).toBe(FOTO));
    ambSessio(PEPA, 2);
    rerender();
    await waitFor(() => expect(port.getProfile).toHaveBeenCalledTimes(2));
    expect(result.current.actor).toMatchObject({ nom: 'Pepa Soler', avatar: FOTO, poble: POBLE });
    await act(async () => { port.respostes[1].rebutja(new Error('Sense xarxa')); });
    await buida();
    expect(result.current.actor).toMatchObject({ nom: 'Pepa Soler', avatar: FOTO, poble: POBLE });
  });
});

describe('l’entitat porta el poble de la seua pertinença, mai la foto de la persona', () => {
  const FORN = Object.freeze({ id: 'o-forn', name: 'Forn de la Torre', role: 'owner', slug: 'forn', kind: 'company', logo_url: null, town_name: POBLE });
  const COLLA = Object.freeze({ id: 'o-colla', name: 'Colla del Poble', role: 'admin', slug: 'colla', kind: 'group', logo_url: 'logo-colla.png' });
  const LECTORA = Object.freeze({ id: 'o-lectora', name: 'Associació', role: 'member', slug: 'associacio', kind: 'entitat', town_name: 'Benilloba' });

  test('entitat activa amb town_name → el seu poble; sense → \'\'; identitats igual', async () => {
    ambSessio(PEPA);
    m.getProfile = vi.fn(async () => FILA_PEPA);
    m.organitzacions = async () => [FORN, COLLA, LECTORA];
    desaPreferencia(PEPA.id, { type: 'entitat', id: 'o-forn' });
    const { result } = munta();
    await waitFor(() => expect(result.current.actor.tipus).toBe('entitat'));
    await waitFor(() => expect(m.getProfile).toHaveBeenCalled());
    await buida();
    expect(result.current.actor).toEqual({
      tipus: 'entitat', id: 'o-forn', nom: 'Forn de la Torre', avatar: null, rol: 'owner', slug: 'forn', kind: 'company', poble: POBLE
    });
    /* La persona, primera, amb el seu perfil; només les organitzacions on mana. */
    expect(result.current.identitats).toEqual([
      { tipus: 'persona', id: 'u-pepa', nom: 'Pepa Soler', avatar: FOTO, poble: POBLE, rol: 'persona', activa: false },
      { tipus: 'entitat', id: 'o-forn', nom: 'Forn de la Torre', avatar: null, poble: POBLE, rol: 'owner', slug: 'forn', kind: 'company', activa: true },
      { tipus: 'entitat', id: 'o-colla', nom: 'Colla del Poble', avatar: 'logo-colla.png', poble: '', rol: 'admin', slug: 'colla', kind: 'group', activa: false }
    ]);
    act(() => { result.current.setActor('entitat', 'o-colla'); });
    expect(result.current.actor).toMatchObject({ tipus: 'entitat', id: 'o-colla', avatar: 'logo-colla.png', poble: '' });
    act(() => { result.current.setActor('persona'); });
    expect(result.current.actor).toMatchObject({ tipus: 'persona', nom: 'Pepa Soler', avatar: FOTO, poble: POBLE });
  });
});
