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
import { creaCarpetaNotes, loadNotes, loadNotesPage } from './notes.js';
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
  /* Onada R29 · PF-01: request() codifica el cos; ací ha d'arribar l'objecte, mai una cadena JSON
     (el JSON.parse d'abans consagrava la doble codificació). */
  expect(opcions.body).toEqual({ p_nom: 'Festes', p_tenant_id: config.tenantId });
});

test('un nom buit o amb control es rebutja abans de la xarxa', async () => {
  await expect(creaCarpetaNotes({ nom: '   ' }, config)).rejects.toThrow(TypeError);
  await expect(creaCarpetaNotes({ nom: 'Fes\u0007tes' }, config)).rejects.toThrow(TypeError);
  expect(mocks.request).not.toHaveBeenCalled();
});

const paginaCarpetes = (pagina, quantitat = 500) => Array.from({ length: quantitat }, (_, posicio) => ({
  id: `f-${(pagina * 500 + posicio + 1).toString(16).padStart(8, '0')}-0b0a-4908-8706-050403020100`, nom: `Carpeta ${pagina * 500 + posicio + 1}`
}));

test('R31 · un servidor que sempre avança té pressupost finit i mai retorna una llista truncada', async () => {
  let pagines = 0;
  mocks.request.mockImplementation(async ruta => String(ruta).startsWith('/rest/v1/note_folders')
    ? pagines < 33 ? paginaCarpetes(pagines++) : [] : []);
  const resultat = await loadNotes(mocks.user.id, config).then(() => null, error => error.message);
  expect(resultat).toContain('límit de pàgines de carpetes');
  expect(pagines).toBe(32);
});

test('R31 · una lectura legítima de més de 500 carpetes conserva totes les files', async () => {
  let pagines = 0;
  mocks.request.mockImplementation(async ruta => String(ruta).startsWith('/rest/v1/note_folders')
    ? paginaCarpetes(pagines++, pagines === 1 ? 500 : 2) : []);
  const { noteFolders } = await loadNotes(mocks.user.id, config);
  expect(noteFolders).toHaveLength(NOTE_FOLDERS_SEED.length + 502);
  expect(pagines).toBe(2);
});

test('R31 · cancel·lació en rebre una pàgina de carpetes no deixa començar-ne una altra', async () => {
  const control = new AbortController();
  let pagines = 0;
  mocks.request.mockImplementation(async ruta => {
    if (!String(ruta).startsWith('/rest/v1/note_folders')) return [];
    pagines += 1;
    if (pagines === 1) { control.abort(); return paginaCarpetes(0); }
    return [];
  });
  const resultat = await loadNotes(mocks.user.id, { ...config, signal: control.signal }).then(() => null, error => error.name);
  expect(resultat).toBe('AbortError');
  expect(pagines).toBe(1);
});

test('R31 · el senyal públic de loadNotesPage talla també la segona fase de carpetes', async () => {
  const control = new AbortController();
  mocks.request.mockImplementation(async () => { control.abort(); return []; });
  const resultat = await loadNotesPage({ ownerUserId: mocks.user.id, signal: control.signal }, config).then(() => null, error => error.name);
  expect(resultat).toBe('AbortError');
  expect(mocks.request).toHaveBeenCalledOnce();
});
