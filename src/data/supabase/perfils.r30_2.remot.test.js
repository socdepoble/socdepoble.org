import { beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ request: vi.fn(), rpc: vi.fn(), local: vi.fn(), user: null }));
vi.mock('./runtime.js', () => ({
  getCurrentUser: () => m.user, request: m.request, rpc: m.rpc,
  getResolvedConfig: (config = {}) => ({ hasSupabaseConfig: true, runtimeDataMode: config.dataMode || 'remote', ...config })
}));
vi.mock('../localPerfils.js', () => ({ localPerfils: { loadPerfilPublic: m.local } }));
import { loadPerfilPublic, perfilDePersona } from './perfils.js';
import { loadPerfilPublic as pelPort, setBackendImplementation } from '../backendPort.js';
import { CONTRACTE_NUCLI } from '../contracte.js';
import { IDS_REMOTS_FUNDACIONALS, PERSONA_PILOT } from '../identitatsSeed.js';
import { rutaCanonicaDePerfil } from '../../config/navigation.js';
import { ambReservaDelPaquet } from '../../sections/profile/perfilsDelPaquet.js';
import { CODI_BACKEND_INABASTABLE } from '../errorsBackend.js';

const ID = IDS_REMOTS_FUNDACIONALS[PERSONA_PILOT.slug][0];
const ALTRE = '11111111-1111-4111-8111-111111111111';
const FILA = Object.freeze({ id: ID, full_name: 'Nom remot vigent', avatar_url: '/assets/avatar-remot.webp',
  hero_url: '/assets/portada-remota.webp', bio: 'Biografia remota', town_name: 'Poble remot',
  lema: '', is_public: true, created_at: '2026-11-01T10:00:00Z', updated_at: '2026-11-15T10:00:00Z' });

beforeEach(() => {
  vi.clearAllMocks();
  m.user = { id: ALTRE };
  m.request.mockResolvedValue([]);
  m.rpc.mockResolvedValue([FILA]);
  m.local.mockReturnValue({ tipus: 'persona', id: 'local' });
  const nucli = Object.fromEntries(CONTRACTE_NUCLI.map(nom => [nom, vi.fn()]));
  setBackendImplementation({ ...nucli, loadPerfilPublic });
});

test.each(PERSONA_PILOT.alies)('D-R24.2-3 · el port resol l’àlies declarat %s al compte remot', async clau => {
  const perfil = await pelPort(clau);
  expect(perfil).toMatchObject({ id: ID, nom: FILA.full_name, hero: FILA.hero_url, avatar: FILA.avatar_url,
    bio: FILA.bio, poble: FILA.town_name, propietari: false, publicat: true, lema: '' });
  expect(m.rpc).toHaveBeenCalledOnce();
  expect(m.rpc).toHaveBeenCalledWith('perfil_public', { p_id: ID }, expect.any(Object), expect.any(Object));
  expect(m.request).not.toHaveBeenCalled();
  expect(rutaCanonicaDePerfil(perfil)).toBe('/javillinares');
});

test.each([ID, ID.toUpperCase()])('la inversa UUID → URL canònica conserva identitat i connexions: %s', async clau => {
  const perfil = await pelPort(clau);
  expect(perfil.id).toBe(ID);
  expect(rutaCanonicaDePerfil(perfil)).toBe('/javillinares');
  expect(m.request).not.toHaveBeenCalled();
});

test('el compte propi llig profiles amb el UUID remot; mai una identitat del paquet', async () => {
  m.user = { id: ID };
  m.request.mockResolvedValue([{ ...FILA, username: 'usuari-remot' }]);
  expect(await pelPort('javillinares')).toMatchObject({ id: ID, propietari: true, usuari: 'usuari-remot' });
  expect(m.request).toHaveBeenCalledWith(`/rest/v1/profiles?id=eq.${ID}&limit=1`, expect.any(Object), expect.any(Object));
  expect(m.rpc).not.toHaveBeenCalled();
});

test('sense sessió no consulta dades privades i la reserva existent continua disponible', async () => {
  m.user = null;
  expect(await pelPort('javillinares')).toBeNull();
  expect(m.rpc).not.toHaveBeenCalled();
  expect(m.request).not.toHaveBeenCalled();
  expect(ambReservaDelPaquet('javillinares', null).id).toBe(PERSONA_PILOT.id);
});

test('xarxa offline es propaga; una resposta absent no pot resoldre una organització homònima', async () => {
  const error = Object.assign(new Error('Sense xarxa'), { status: 0, codi: CODI_BACKEND_INABASTABLE });
  m.rpc.mockRejectedValueOnce(error);
  await expect(pelPort('javillinares')).rejects.toBe(error);
  m.rpc.mockResolvedValue([]);
  m.request.mockResolvedValue([{ id: ALTRE, kind: 'company', slug: 'javillinares', name: 'Homònim' }]);
  expect(await pelPort('javillinares')).toBeNull();
  expect(m.request).not.toHaveBeenCalled();
});

test('no accepta una fila remota amb un UUID distint del que s’ha sol·licitat', async () => {
  m.rpc.mockResolvedValue([{ ...FILA, id: ALTRE }]);
  expect(await pelPort('javillinares')).toBeNull();
});

test('la resolució de l’àlies conserva la cancel·lació i no lliura una resposta tardana', async () => {
  let resol;
  m.rpc.mockImplementation(() => new Promise(resolve => { resol = resolve; }));
  const controller = new AbortController();
  const lectura = pelPort('javillinares', { signal: controller.signal });
  const rebut = expect(lectura).rejects.toMatchObject({ name: 'AbortError' });
  await vi.waitFor(() => expect(resol).toBeTypeOf('function'));
  controller.abort();
  resol([FILA]);
  await rebut;
  expect(m.rpc.mock.calls[0][2].signal.aborted).toBe(true);
});

test('una RPC bloquejada acaba amb el pressupost original encara que ignore el senyal', async () => {
  vi.useFakeTimers();
  try {
    m.rpc.mockImplementation(() => new Promise(() => {}));
    let resultat;
    const lectura = pelPort('javillinares').catch(error => { resultat = error; });
    await vi.advanceTimersByTimeAsync(2999);
    expect(resultat).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);
    await lectura;
    expect(resultat).toMatchObject({ name: 'TimeoutError' });
    expect(m.rpc.mock.calls[0][2].signal.aborted).toBe(true);
  } finally { vi.useRealTimers(); }
});

test('mode local conserva el seu adaptador i cap consulta remota', async () => {
  expect(await pelPort('javillinares', { dataMode: 'local' })).toMatchObject({ id: 'local' });
  expect(m.local).toHaveBeenCalledWith('javillinares', m.user);
  expect(m.request).not.toHaveBeenCalled();
  expect(m.rpc).not.toHaveBeenCalled();
});

test('hero_url és canònic; cover_url només és un àlies de lectura sense imposar cap esquema nou', () => {
  expect(perfilDePersona({ ...FILA, cover_url: '/assets/altra.webp' }).hero).toBe(FILA.hero_url);
  expect(perfilDePersona({ ...FILA, hero_url: '', cover_url: '/assets/altra.webp' }).hero).toBe('');
  expect(perfilDePersona({ ...FILA, hero_url: null, cover_url: '/assets/altra.webp' }).hero).toBe('/assets/altra.webp');
});

test('la fusió és determinista i conserva els buits explícits, permisos, dates i UUID remots', async () => {
  const remot = await pelPort('javillinares');
  const primer = ambReservaDelPaquet('javillinares', remot);
  expect(primer).toMatchObject(remot);
  expect(primer.id).toBe(ID);
  expect(primer.lema).toBe('');
  expect(ambReservaDelPaquet('javillinares', primer)).toEqual(primer);
  expect(remot).not.toHaveProperty('fontDelPaquet');
});

test('una fitxa mínima privada no hereta camps de presentació ni permisos del paquet', () => {
  const minima = { tipus: 'persona', id: ID, nom: FILA.full_name, publicat: false, propietari: false };
  expect(ambReservaDelPaquet('javillinares', minima)).toBe(minima);
  expect(ambReservaDelPaquet('javillinares', minima)).not.toHaveProperty('bio');
  expect(ambReservaDelPaquet('perfil-inexistent', null)).toBeNull();
});
