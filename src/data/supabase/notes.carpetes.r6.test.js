/* R12 (Onada R6, Bloc 4, B4-S1) · Carpetes privades de Notes en remot:
   loadNotes llig `note_folders` (RLS de propietari + pertinença) i
   creaCarpetaNotes passa per la RPC `crea_carpeta_notes` de la migració 76.
   Un servidor sense la migració (404 de PostgREST) continua carregant Notes. */
import { beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ request: vi.fn(), user: { id: '11111111-1111-4111-8111-111111111111' } }));
vi.mock('./runtime.js', () => ({
  request: mocks.request,
  getResolvedConfig: config => ({ hasSupabaseConfig: true, runtimeDataMode: 'remote', ...config }),
  getCurrentUser: () => mocks.user,
  generateUUID: () => '22222222-2222-4222-8222-222222222222',
  buildSeedAppData: vi.fn(),
  ErrorSupabase: class extends Error { constructor(message, status) { super(message); this.status = status; } }
}));
import { creaCarpetaNotes, loadNotes } from './notes.js';
import { NOTE_FOLDERS_SEED } from '../appSeed.js';

const config = { tenantId: '33333333-3333-4333-8333-333333333333' };
const FESTES = { id: 'f-0f0e0d0c-0b0a-4908-8706-050403020100', nom: 'Festes' };
const respostes = (folders) => async (ruta) => {
  if (String(ruta).startsWith('/rest/v1/note_folders')) {
    if (folders instanceof Error) throw folders;
    return folders;
  }
  return [{ id: '00000000-0000-4000-8000-000000000001', revision: 1 }];
};
beforeEach(() => mocks.request.mockReset());

test('les carpetes del servidor s’afigen a les de sèrie, amb el tenant i el propietari de la sessió', async () => {
  mocks.request.mockImplementation(respostes([FESTES]));
  const { noteFolders } = await loadNotes(mocks.user.id, config);
  expect(noteFolders).toEqual([...NOTE_FOLDERS_SEED, { ...FESTES, parentId: null }]);
  const ruta = mocks.request.mock.calls.map(([r]) => r).find(r => r.startsWith('/rest/v1/note_folders'));
  expect(ruta).toContain(`tenant_id=eq.${config.tenantId}`);
  expect(ruta).toContain(`owner_user_id=eq.${mocks.user.id}`);
});

test('sense la migració 76 (404 de PostgREST, sense `code`) les Notes carreguen amb les carpetes de sèrie', async () => {
  mocks.request.mockImplementation(respostes(Object.assign(new Error('Supabase 404: {"code":"PGRST205"}'), { status: 404 })));
  const { notes, noteFolders } = await loadNotes(mocks.user.id, config);
  expect(notes).toHaveLength(1);
  expect(noteFolders).toEqual(NOTE_FOLDERS_SEED);
});

test('un error real del servidor de carpetes no es dissimula', async () => {
  mocks.request.mockImplementation(respostes(Object.assign(new Error('Supabase 500'), { status: 500 })));
  await expect(loadNotes(mocks.user.id, config)).rejects.toThrow('500');
});

test('creaCarpetaNotes envia només el nom net i el tenant; l’id el dona el servidor', async () => {
  mocks.request.mockResolvedValueOnce(FESTES);
  await expect(creaCarpetaNotes({ nom: '  Festes ' }, config)).resolves.toEqual({ ...FESTES, parentId: null });
  const [ruta, , opcions] = mocks.request.mock.calls[0];
  expect(ruta).toBe('/rest/v1/rpc/crea_carpeta_notes');
  expect(JSON.parse(opcions.body)).toEqual({ p_nom: 'Festes', p_tenant_id: config.tenantId });
});

test('un nom buit o amb control es rebutja abans de la xarxa', async () => {
  await expect(creaCarpetaNotes({ nom: '   ' }, config)).rejects.toThrow(TypeError);
  await expect(creaCarpetaNotes({ nom: 'Fes\u0007tes' }, config)).rejects.toThrow(TypeError);
  expect(mocks.request).not.toHaveBeenCalled();
});
