/** P5 (Mestre, 261003) · El runtime de Dispositius.
 *
 *  No hi ha WebRTC: el transport és BroadcastChannel (pestanyes del mateix
 *  navegador i origen). Ací es proven el nom suggerit (cap nom propi de
 *  reserva), la identitat per pestanya (abans compartida i, per tant, cega) i
 *  cada camí del pont: descoberta, mode privat, petició adreçada, acceptar,
 *  rebutjar, missatge, desconnexió, tancament net, aïllament per tenant,
 *  recàrrega i pestanya duplicada. El canal és un doble en memòria.
 *  Privacitat (revisió): el nom automàtic, que amb sessió porta el nom de la
 *  persona, no arriba mai a localStorage. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getEfimer, getVal, setVal } from '../../config/storage.js';
import { CanalFals, buida } from './__fixtures__/canalFals.js';
import {
  PRESENCE_HEARTBEAT_MS,
  ambNomSuggerit,
  createChatMessage,
  createDeviceBridge,
  idDeInstancia,
  loadDeviceChats,
  loadDeviceConnections,
  loadDeviceProfile,
  nomPerDefecte,
  saveDeviceChats,
  saveDeviceConnections,
  saveDeviceProfile
} from './devicesRuntime.js';

const UA_ORDINADOR = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Safari/605.1.15';
const UA_MOBIL = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36';
const GENERIC = 'Ordinador de l’usuari';
const T = 't-prova';
const CLAU_PERFIL = `socdepoble-device-profile-v1-${T}`;
/* Tot el que hi ha a localStorage, claus i valors, per a buscar-hi un nom. */
const textDeLocalStorage = () => Array.from({ length: localStorage.length }, (_, i) => {
  const clau = localStorage.key(i);
  return `${clau}=${localStorage.getItem(clau)}`;
}).join('\n');

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('nom suggerit', () => {
  test('sense persona és genèric i diu el tipus d’aparell', () => {
    expect(nomPerDefecte(null, UA_ORDINADOR)).toBe('Ordinador de l’usuari');
    expect(nomPerDefecte(null, UA_MOBIL)).toBe('Mòbil de l’usuari');
    expect(nomPerDefecte()).toBe(GENERIC);
  });

  test('amb persona porta el seu nom', () => {
    expect(nomPerDefecte('Persona amb sessió', UA_ORDINADOR)).toBe('Ordinador de Persona amb sessió');
    expect(nomPerDefecte('Persona amb sessió', UA_MOBIL)).toBe('Mòbil de Persona amb sessió');
  });

  test('un perfil nou en foraster naix genèric i automàtic, i a localStorage no hi van ni l’id ni el nom automàtic', () => {
    const perfil = loadDeviceProfile(T);
    expect(perfil).toMatchObject({ name: GENERIC, nomAutomatic: true, isVisible: false, kind: 'portal' });
    expect(getVal(CLAU_PERFIL)).toEqual({ nomAutomatic: true, kind: 'portal', isVisible: false, createdAt: perfil.createdAt });
    expect(loadDeviceProfile(T).name).toBe(GENERIC);
  });

  test('amb sessió naix amb el nom de la persona, però eixe nom no es desa mai al navegador', () => {
    const perfil = loadDeviceProfile(T, 'Persona amb sessió');
    expect(perfil.name).toBe('Ordinador de Persona amb sessió');
    saveDeviceProfile(T, { ...perfil, isVisible: true });
    expect(getVal(CLAU_PERFIL)).not.toHaveProperty('name');
    expect(textDeLocalStorage()).not.toContain('Persona amb sessió');
    /* Ix la persona: el navegador no la recorda. */
    expect(loadDeviceProfile(T)).toMatchObject({ name: GENERIC, isVisible: true });
  });

  test('el nom triat amb «Guardar» sí que es desa, i es conserva amb sessió o sense', () => {
    const perfil = loadDeviceProfile(T, 'Persona amb sessió');
    saveDeviceProfile(T, { ...perfil, name: 'Ordinador del taller', nomAutomatic: false });
    expect(getVal(CLAU_PERFIL)).toMatchObject({ name: 'Ordinador del taller', nomAutomatic: false });
    expect(loadDeviceProfile(T).name).toBe('Ordinador del taller');
    expect(loadDeviceProfile(T, 'Una altra persona').name).toBe('Ordinador del taller');
  });

  test('el nom personal que la versió anterior va gravar es refà en foraster, i es netegen les claus de l’id vell', () => {
    setVal(CLAU_PERFIL, { id: 'id-vell', name: 'Ordinador de Persona antiga', kind: 'portal', isVisible: true, createdAt: 1 });
    setVal(`socdepoble-device-chat-v1-${T}::id-vell`, { 'E9B234F1-mock-a': [{ id: 'm', text: 'Rebut.' }] });
    setVal(`socdepoble-device-connections-v1-${T}::id-vell`, { 'E9B234F1-mock-a': { state: 'connected' } });
    setVal(`socdepoble-device-selected-peer-v1-${T}::id-vell`, 'E9B234F1-mock-a');

    const perfil = loadDeviceProfile(T);

    expect(perfil).toMatchObject({ name: GENERIC, nomAutomatic: true, isVisible: true, createdAt: 1 });
    expect(perfil.id).not.toBe('id-vell');
    expect(getVal(CLAU_PERFIL)).not.toHaveProperty('id');
    expect(textDeLocalStorage()).not.toContain('Persona antiga');
    expect(getVal(`socdepoble-device-chat-v1-${T}::id-vell`)).toBeNull();
    expect(getVal(`socdepoble-device-connections-v1-${T}::id-vell`)).toBeNull();
    expect(getVal(`socdepoble-device-selected-peer-v1-${T}::id-vell`)).toBeNull();
  });

  test('els noms críptics vells («Portal XXXX») també són automàtics', () => {
    setVal(CLAU_PERFIL, { id: 'id-vell', name: 'Portal H2MH', kind: 'portal', isVisible: false, createdAt: 1 });
    expect(loadDeviceProfile(T).name).toBe(GENERIC);
  });

  test('un nom propi es conserva: vell amb una altra forma, o desat amb la marca', () => {
    setVal(CLAU_PERFIL, { id: 'id-vell', name: 'La tauleta de la cuina', kind: 'portal', isVisible: false, createdAt: 1 });
    expect(loadDeviceProfile(T)).toMatchObject({ name: 'La tauleta de la cuina', nomAutomatic: false });

    setVal(CLAU_PERFIL, { name: 'Ordinador de casa', nomAutomatic: false, kind: 'portal', isVisible: false, createdAt: 1 });
    expect(loadDeviceProfile(T, 'Persona amb sessió')).toMatchObject({ name: 'Ordinador de casa', nomAutomatic: false });
  });

  test('el nom automàtic seguix la persona (entrar i eixir); el propi no es toca', () => {
    const perfil = loadDeviceProfile(T);
    const dins = ambNomSuggerit(perfil, 'Persona amb sessió');
    expect(dins.name).toBe('Ordinador de Persona amb sessió');
    expect(ambNomSuggerit(dins, null).name).toBe(GENERIC);
    expect(ambNomSuggerit(perfil, null)).toBe(perfil);

    const propi = { ...perfil, name: 'Ordinador del taller', nomAutomatic: false };
    expect(ambNomSuggerit(propi, 'Persona amb sessió')).toBe(propi);
  });
});

describe('identitat per pestanya', () => {
  test('dues pestanyes del mateix navegador tenen ids diferents (abans compartien el de localStorage)', () => {
    const primera = loadDeviceProfile(T);
    sessionStorage.clear(); // una pestanya nova: localStorage comú, capa efímera neta
    const segona = loadDeviceProfile(T);
    expect(segona.id).not.toBe(primera.id);
    expect(segona.name).toBe(primera.name);
  });

  test('recarregar la pestanya conserva l’id; renovar-lo el canvia i el desa', () => {
    const abans = loadDeviceProfile(T).id;
    expect(loadDeviceProfile(T).id).toBe(abans);
    const nou = idDeInstancia(T, { renova: true });
    expect(nou).not.toBe(abans);
    expect(loadDeviceProfile(T).id).toBe(nou);
  });

  test('xats i connexions són de la instància: viuen a la capa efímera i moren amb la pestanya', () => {
    const { id } = loadDeviceProfile(T);
    saveDeviceChats(T, id, { altra: [{ id: 'm1', text: 'Hola' }] });
    saveDeviceConnections(T, id, { altra: { state: 'connected' } });
    expect(loadDeviceChats(T, id)).toEqual({ altra: [{ id: 'm1', text: 'Hola' }] });
    expect(loadDeviceConnections(T, id)).toEqual({ altra: { state: 'connected' } });
    expect(getVal(`socdepoble-device-chat-v1-${T}::${id}`)).toBeNull();
    expect(getEfimer(`socdepoble-device-chat-v1-${T}::${id}`)).toEqual({ altra: [{ id: 'm1', text: 'Hola' }] });
    sessionStorage.clear();
    expect(loadDeviceChats(T, id)).toEqual({});
    expect(loadDeviceConnections(T, id)).toEqual({});
  });
});

describe('el pont (BroadcastChannel)', () => {
  let ponts = [];

  const handlers = () => ({
    onPresence: vi.fn(),
    onConnectRequest: vi.fn(),
    onConnectAccept: vi.fn(),
    onConnectDecline: vi.fn(),
    onMessage: vi.fn(),
    onDisconnect: vi.fn(),
    onDuplicate: vi.fn()
  });

  /* `naixement` fa de performance.timeOrigin: quan va nàixer el document del pont. */
  const pontDe = (perfil, { tenant = T, naixement } = {}) => {
    const h = handlers();
    const b = createDeviceBridge(tenant, perfil, h, { naixement });
    ponts.push(b);
    return { b, h, id: perfil.id };
  };

  const pont = (id, { visible = true, tenant = T, naixement } = {}) =>
    pontDe({ id, name: `Instància ${id}`, kind: 'portal', isVisible: visible }, { tenant, naixement });

  const publicatsPer = (id) => CanalFals.publicats.filter(({ data }) => data.fromId === id || data.device?.id === id);

  beforeEach(() => {
    CanalFals.reinicia();
    vi.stubGlobal('BroadcastChannel', CanalFals);
  });

  afterEach(() => {
    ponts.forEach((b) => b?.destroy());
    ponts = [];
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test('sense BroadcastChannel no hi ha pont', () => {
    vi.stubGlobal('BroadcastChannel', undefined);
    expect(createDeviceBridge(T, { id: 'a', name: 'a', kind: 'portal', isVisible: true }, handlers())).toBeNull();
  });

  test('regressió: dues pestanyes amb perfils de veres es descobrixen', async () => {
    const perfilA = { ...loadDeviceProfile(T), isVisible: true };
    sessionStorage.clear();
    const perfilB = { ...loadDeviceProfile(T), isVisible: true };
    const a = pontDe(perfilA);
    const b = pontDe(perfilB);
    await buida();
    expect(a.h.onPresence).toHaveBeenCalledWith(expect.objectContaining({ id: perfilB.id, name: GENERIC }));
    expect(b.h.onPresence).toHaveBeenCalledWith(expect.objectContaining({ id: perfilA.id, name: GENERIC }));
  });

  test('descoberta: qui arriba demana presència i qui és visible respon', async () => {
    const a = pont('A');
    await buida();
    const b = pont('B');
    await buida();
    expect(b.h.onPresence).toHaveBeenCalledWith(expect.objectContaining({ id: 'A', name: 'Instància A', kind: 'portal' }));
    expect(a.h.onPresence).toHaveBeenCalledWith(expect.objectContaining({ id: 'B', name: 'Instància B' }));
  });

  test('batec: una instància visible s’anuncia cada PRESENCE_HEARTBEAT_MS', async () => {
    vi.useFakeTimers();
    pont('A');
    const b = pont('B');
    await buida();
    b.h.onPresence.mockClear();
    vi.advanceTimersByTime(PRESENCE_HEARTBEAT_MS);
    await buida();
    expect(b.h.onPresence).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(PRESENCE_HEARTBEAT_MS * 2);
    await buida();
    expect(b.h.onPresence).toHaveBeenCalledTimes(3);
  });

  test('mode privat: una instància invisible no s’anuncia ni quan li ho demanen ni amb el batec', async () => {
    vi.useFakeTimers();
    pont('A', { visible: false });
    const b = pont('B');
    b.b.requestPresence();
    vi.advanceTimersByTime(PRESENCE_HEARTBEAT_MS * 3);
    await buida();
    expect(b.h.onPresence).not.toHaveBeenCalled();
    expect(publicatsPer('A').map(({ data }) => data.type)).toEqual(['presence:request']);
  });

  test('connexió adreçada: només el destinatari rep la petició, i la resposta torna a qui la va fer', async () => {
    const a = pont('A');
    const b = pont('B');
    const c = pont('C');
    await buida();

    a.b.requestConnection('B');
    await buida();
    expect(b.h.onConnectRequest).toHaveBeenCalledWith('A');
    expect(c.h.onConnectRequest).not.toHaveBeenCalled();

    b.b.acceptConnection('A');
    await buida();
    expect(a.h.onConnectAccept).toHaveBeenCalledWith('B');
    expect(c.h.onConnectAccept).not.toHaveBeenCalled();
  });

  test('rebutjar arriba a qui ho va demanar', async () => {
    const a = pont('A');
    const b = pont('B');
    a.b.requestConnection('B');
    b.b.declineConnection('A');
    await buida();
    expect(a.h.onConnectDecline).toHaveBeenCalledWith('B');
    expect(a.h.onConnectAccept).not.toHaveBeenCalled();
  });

  test('missatge: arriba sencer, una sola vegada i només al destinatari', async () => {
    const a = pont('A');
    const b = pont('B');
    const c = pont('C');
    const missatge = createChatMessage({ sender: 'me', text: 'Bon dia, veïna', author: 'Instància A' });
    a.b.sendMessage('B', missatge);
    await buida();
    expect(b.h.onMessage).toHaveBeenCalledTimes(1);
    expect(b.h.onMessage).toHaveBeenCalledWith('A', missatge);
    expect(c.h.onMessage).not.toHaveBeenCalled();
    expect(a.h.onMessage).not.toHaveBeenCalled();
  });

  test('desconnexió: el peer en té notícia', async () => {
    const a = pont('A');
    const b = pont('B');
    a.b.disconnectConnection('B');
    await buida();
    expect(b.h.onDisconnect).toHaveBeenCalledWith('A');
    expect(a.h.onDisconnect).not.toHaveBeenCalled();
  });

  test('tancament net: després de destroy() ni s’envia ni es rep res, el batec para i repetir-lo no falla', async () => {
    vi.useFakeTimers();
    const a = pont('A');
    const b = pont('B');
    await buida();
    a.b.destroy();
    const abans = publicatsPer('A').length;

    vi.advanceTimersByTime(PRESENCE_HEARTBEAT_MS * 3);
    expect(() => a.b.requestPresence()).not.toThrow();
    expect(() => a.b.sendMessage('B', createChatMessage({ sender: 'me', text: 'tard', author: 'A' }))).not.toThrow();
    expect(() => a.b.destroy()).not.toThrow();
    await buida();
    expect(publicatsPer('A')).toHaveLength(abans);
    expect(b.h.onMessage).not.toHaveBeenCalled();

    b.b.sendMessage('A', createChatMessage({ sender: 'me', text: 'hi ets?', author: 'B' }));
    b.b.requestConnection('A');
    await buida();
    expect(a.h.onMessage).not.toHaveBeenCalled();
    expect(a.h.onConnectRequest).not.toHaveBeenCalled();
  });

  test('aïllament per tenant: instàncies de tenants diferents no es veuen', async () => {
    const a = pont('A', { tenant: 'poble-1' });
    const b = pont('B', { tenant: 'poble-2' });
    a.b.requestConnection('B');
    await buida();
    expect(a.h.onPresence).not.toHaveBeenCalled();
    expect(b.h.onPresence).not.toHaveBeenCalled();
    expect(b.h.onConnectRequest).not.toHaveBeenCalled();
  });

  test('reconnexió: la pestanya recarregada torna amb el mateix id i la conversa continua', async () => {
    const a = pont('A');
    const b = pont('B');
    await buida();
    a.b.destroy();
    b.h.onPresence.mockClear();

    const a2 = pont('A');
    await buida();
    expect(b.h.onPresence).toHaveBeenCalledWith(expect.objectContaining({ id: 'A' }));
    expect(a2.h.onDuplicate).not.toHaveBeenCalled();

    const missatge = createChatMessage({ sender: 'me', text: 'Continuem', author: 'Instància B' });
    b.b.sendMessage('A', missatge);
    await buida();
    expect(a2.h.onMessage).toHaveBeenCalledWith('B', missatge);
  });

  test('pestanya duplicada: el mateix id en dos ponts vius del mateix document → només el pont més nou en canvia, una sola vegada', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    const original = pont('X');
    vi.setSystemTime(2_000);
    const copia = pont('X');
    await buida();

    expect(copia.h.onDuplicate).toHaveBeenCalledTimes(1);
    expect(original.h.onDuplicate).not.toHaveBeenCalled();
    expect(publicatsPer('X').some(({ data }) => data.type === 'presence:duplicate' && data.nascut === 1_000)).toBe(true);

    vi.advanceTimersByTime(PRESENCE_HEARTBEAT_MS * 2);
    await buida();
    expect(copia.h.onDuplicate).toHaveBeenCalledTimes(1);
    expect(original.h.onDuplicate).not.toHaveBeenCalled();
    /* Cap dels dos ha pres l'altre per un peer. */
    expect(original.h.onPresence).not.toHaveBeenCalled();
    expect(copia.h.onPresence).not.toHaveBeenCalled();
  });

  test('pestanya duplicada: conserva l’id el document més antic, encara que el seu pont siga el més nou', async () => {
    /* L'original (document nascut a 1000) era a /mur quan es va duplicar. La
       còpia (document de 2000) entra a /dispositius a 3000 i hereta l'id;
       l'original hi torna a 5000 i refà el pont. Ha de canviar la còpia. */
    vi.useFakeTimers();
    vi.setSystemTime(3_000);
    const copia = pont('X', { naixement: 2_000 });
    vi.setSystemTime(5_000);
    const original = pont('X', { naixement: 1_000 });
    await buida();
    expect(copia.h.onDuplicate).toHaveBeenCalledTimes(1);
    expect(original.h.onDuplicate).not.toHaveBeenCalled();
    expect(publicatsPer('X').some(({ data }) => data.type === 'presence:duplicate')).toBe(false);
  });

  test('pestanya duplicada: un missatge d’una versió anterior (sense naixement) es desempata pel pont', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(2_000);
    const nou = pont('X', { visible: false });
    /* Una pestanya oberta abans del desplegament publica sense `naixement`. */
    const [nomCanal] = CanalFals.oberts.keys();
    const vell = new CanalFals(nomCanal);
    vell.postMessage({ type: 'presence:request', fromId: 'X', nascut: 1_000, pont: 'vell', sentAt: 1_000 });
    await buida();
    vell.close();
    expect(nou.h.onDuplicate).toHaveBeenCalledTimes(1);
  });

  test('pestanya duplicada: si la còpia arriba quan l’original ja hi és, també canvia la còpia', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(5_000);
    const original = pont('X', { visible: false });
    vi.setSystemTime(5_500);
    const copia = pont('X', { visible: false });
    await buida();
    expect(copia.h.onDuplicate).toHaveBeenCalledTimes(1);
    expect(original.h.onDuplicate).not.toHaveBeenCalled();
  });
});
