/* P1-68 (decisió del Mestre 261028: camp separat) · perfilDePersona porta
   l'identificador a `usuari`: la columna `usuari` de perfil_public
   (2610282100), que només el dona d'una fitxa sencera, o el
   profiles.username de la fila pròpia, que llegixPerfilRemot hi passa.
   `slug` continua null: un identificador triat per qualsevol no és mai la
   clau d'una identitat fundacional. Noms sintètics. */
import { beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ request: vi.fn(), rpc: vi.fn(), user: null }));
vi.mock('./runtime.js', () => ({ getCurrentUser: () => m.user, request: m.request, rpc: m.rpc,
  getResolvedConfig: (config = {}) => ({ hasSupabaseConfig: true, runtimeDataMode: config.dataMode || 'remote', ...config }) }));
import { loadPerfilPublic, perfilDePersona } from './perfils.js';
import { clauFundacional } from '../identitatsSeed.js';
import { USERNAMES_FUNDACIONALS } from '../../sections/onboarding/onboardingModel.js';

const JO = '00000000-0000-4000-8000-0000000000a1';
const ELLA = '00000000-0000-4000-8000-0000000000b2';
beforeEach(() => { vi.clearAllMocks(); m.user = null; m.request.mockResolvedValue([]); m.rpc.mockResolvedValue([]); });

test('la columna `usuari` de perfil_public dona `usuari`; slug, null', () => {
  expect(perfilDePersona({ id: 'X', usuari: 'annaperez' })).toMatchObject({ usuari: 'annaperez', slug: null });
  expect(perfilDePersona({ id: 'X', usuari: null }).usuari).toBeNull();
  expect(perfilDePersona({ id: 'X' }).usuari).toBeNull();
});

test('una altra persona: el que torna perfil_public; la fila pròpia: el seu username', async () => {
  m.user = { id: JO };
  m.rpc.mockResolvedValue([{ id: ELLA, full_name: 'Anna Pérez Soler', is_public: true, usuari: 'annaperez' }]);
  expect(await loadPerfilPublic(ELLA)).toMatchObject({ id: ELLA, publicat: true, usuari: 'annaperez', slug: null });
  m.request.mockImplementation(async (ruta) => (ruta.includes('/profiles') ? [{ id: JO, full_name: 'Pep Sala', username: 'pepsala' }] : []));
  expect(await loadPerfilPublic(JO)).toMatchObject({ propietari: true, usuari: 'pepsala', slug: null });
});

test('un @usuari que diu com un àlies fundacional no en fa cap identitat fundacional', () => {
  for (const usuari of [...USERNAMES_FUNDACIONALS, 'socdepoble']) {
    expect(clauFundacional(perfilDePersona({ id: '00000000-0000-4000-8000-0000000000aa', usuari }))).toBeNull();
  }
});
