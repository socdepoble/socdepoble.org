import { beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ user: { id: 'A' }, entrada: 1, renovacio: 1, servidor: 'https://poble-a.test', tenant: '00000000-0000-4000-8000-000000000000', clau: 'publica-a', mode: 'remote', request: vi.fn() }));
vi.mock('./runtime.js', () => ({ getCurrentUser: () => m.user, request: m.request,
  getResolvedConfig: () => ({ tenantId: m.tenant, supabaseUrl: m.servidor, supabaseAnonKey: m.clau, hasSupabaseConfig: true, runtimeDataMode: m.mode }) }));
vi.mock('../identitat.js', () => ({ get versioSessio() { return m.renovacio; }, entradaSessio: () => m.entrada, capturaSessio: () => {
  const entrada = m.entrada;
  return () => { if (entrada !== m.entrada) throw new DOMException('Sessió substituïda', 'AbortError'); };
} }));
import { createOrganization, updateOrganization, reiniciaMemoriaDirectori } from './organizations.js';
const FORN = { kind: 'company', name: 'Forn', slug: 'forn', town_name: 'Xixona' };
const diferida = () => { let resol, rebutja; const promesa = new Promise((r, j) => { resol = r; rebutja = j; }); return { promesa, resol, rebutja }; };
beforeEach(() => {
  m.user = { id: 'A' }; m.entrada = 1; m.renovacio = 1; m.servidor = 'https://poble-a.test';
  m.tenant = '00000000-0000-4000-8000-000000000000'; m.clau = 'publica-a'; m.mode = 'remote';
  m.request.mockReset(); reiniciaMemoriaDirectori();
});

test.each(['canvi de compte', 'nova entrada d’A', 'cancel·lació'])('aturada després de llegir el slug: %s impedix el POST', async tipus => {
  const lectura = diferida(), control = new AbortController();
  m.request.mockReturnValueOnce(lectura.promesa);
  const pendent = createOrganization(FORN, { signal: control.signal });
  if (tipus === 'cancel·lació') control.abort();
  else { m.entrada++; if (tipus === 'canvi de compte') m.user = { id: 'B' }; }
  lectura.resol([]);
  await expect(pendent).rejects.toMatchObject({ name: 'AbortError' });
  expect(m.request).toHaveBeenCalledTimes(1);
});

test('una alta confirmada després d’una eixida no continua amb el PATCH del poble', async () => {
  const creada = diferida();
  m.request.mockResolvedValueOnce([]).mockReturnValueOnce(creada.promesa);
  const pendent = createOrganization(FORN);
  await vi.waitFor(() => expect(m.request).toHaveBeenCalledTimes(2));
  m.user = null; m.entrada++;
  creada.resol({ id: 'O-r32', kind: 'company', slug: 'forn' });
  await expect(pendent).rejects.toMatchObject({ name: 'AbortError' });
  expect(m.request).toHaveBeenCalledTimes(2);
});

test('el POST rep el mateix AbortSignal que les lectures i el PATCH', async () => {
  const control = new AbortController();
  m.request.mockResolvedValueOnce([]).mockResolvedValueOnce({ id: 'O-signal' }).mockResolvedValueOnce([{ town_name: 'Xixona' }]);
  await expect(createOrganization(FORN, { signal: control.signal })).resolves.toMatchObject({ id: 'O-signal', town_name: 'Xixona' });
  for (const crida of m.request.mock.calls) expect(crida[2].signal).toBe(control.signal);
});

test.each(['B', 'A'])('un reintent sense poble d’A no autoritza una entrada nova de %s a tocar l’existent', async actor => {
  const id = `O-reintent-${actor}`;
  m.request.mockResolvedValueOnce([]).mockResolvedValueOnce({ id })
    .mockRejectedValueOnce(Object.assign(new Error('tall'), { status: 0 }));
  await expect(createOrganization(FORN)).rejects.toMatchObject({ code: 'POBLE-NO-DESAT' });
  m.entrada++; m.user = { id: actor };
  m.request.mockResolvedValueOnce([{ id, town_name: 'Penàguila' }]).mockResolvedValueOnce({ id });
  await expect(createOrganization(FORN)).rejects.toMatchObject({ code: 'JA-EXISTIX' });
  expect(m.request).toHaveBeenCalledTimes(5);
});

const canviaAbast = (tipus, control) => {
  if (tipus === 'cancel·lació') control.abort();
  else if (tipus === 'servidor') m.servidor = 'https://poble-b.test';
  else if (tipus === 'tenant') m.tenant = '00000000-0000-4000-8000-000000000001';
  else if (tipus === 'clau pública') m.clau = 'publica-b';
  else if (tipus === 'mode') m.mode = 'seed';
  else { m.entrada++; if (tipus === 'compte') m.user = { id: 'B' }; }
};
const ABANS_REINTENT = ['compte', 'nova entrada', 'cancel·lació', 'servidor', 'tenant', 'clau pública', 'mode'];

test.each(ABANS_REINTENT)('el PATCH directe no reintenta una columna SELECT absent després de canviar %s', async tipus => {
  const patch = diferida(), control = new AbortController();
  m.request.mockReturnValueOnce(patch.promesa).mockResolvedValue([{ id: 'O-directe' }]);
  const pendent = updateOrganization('O-directe', { town_name: 'Xixona' }, { signal: control.signal });
  const rebuig = expect(pendent).rejects.toMatchObject({ name: 'AbortError' });
  await vi.waitFor(() => expect(m.request).toHaveBeenCalledTimes(1));
  canviaAbast(tipus, control);
  patch.rebutja(Object.assign(new Error('Supabase 400: column organizations.copyright does not exist'), { status: 400 }));
  await rebuig;
  expect(m.request).toHaveBeenCalledTimes(1);
});

test('el reintent intern de l’alta no envia un segon PATCH sota un altre compte', async () => {
  const patch = diferida(), control = new AbortController(), actors = [];
  m.request.mockImplementation(async (_ruta, _config, opcions = {}) => {
    actors.push({ metode: opcions.method || 'GET', actor: m.user?.id, signal: opcions.signal });
    if (actors.length === 1) return [];
    if (actors.length === 2) return { id: 'O-reintent-intern' };
    if (actors.length === 3) return patch.promesa;
    return [{ id: 'O-reintent-intern', town_name: 'Xixona' }];
  });
  const pendent = createOrganization(FORN, { signal: control.signal });
  const rebuig = expect(pendent).rejects.toMatchObject({ name: 'AbortError' });
  await vi.waitFor(() => expect(m.request).toHaveBeenCalledTimes(3));
  canviaAbast('compte', control);
  patch.rebutja(Object.assign(new Error('Supabase 400: column organizations.hero_video_url does not exist'), { status: 400 }));
  await rebuig;
  expect(actors.filter(a => a.metode === 'PATCH')).toEqual([{ metode: 'PATCH', actor: 'A', signal: control.signal }]);
});

test('el reintent de columna opcional del cos tampoc continua amb una entrada substituïda', async () => {
  const patch = diferida();
  m.request.mockReturnValueOnce(patch.promesa).mockResolvedValue([{ id: 'O-opcional' }]);
  const pendent = updateOrganization('O-opcional', { name: 'Forn', hero_video_url: 'https://poble-a.test/video.mp4' });
  const rebuig = expect(pendent).rejects.toMatchObject({ name: 'AbortError' });
  m.entrada++;
  patch.rebutja(Object.assign(new Error("PGRST204: Could not find the 'hero_video_url' column of 'organizations' in the schema cache"), { status: 400 }));
  await rebuig;
  expect(m.request).toHaveBeenCalledTimes(1);
});

test.each(['compte', 'nova entrada', 'cancel·lació', 'servidor', 'tenant'])('el PATCH directe no confirma resposta després de canviar %s', async tipus => {
  const patch = diferida(), control = new AbortController();
  m.request.mockReturnValueOnce(patch.promesa);
  const pendent = updateOrganization('O-confirmacio', { town_name: 'Xixona' }, { signal: control.signal });
  const rebuig = expect(pendent).rejects.toMatchObject({ name: 'AbortError' });
  canviaAbast(tipus, control);
  patch.resol([{ id: 'O-confirmacio', town_name: 'Xixona' }]);
  await rebuig;
});

test.each(['servidor', 'tenant', 'clau pública', 'mode'])('l’alta no fa POST si canvia %s durant GET', async tipus => {
  const lectura = diferida(), control = new AbortController();
  m.request.mockReturnValueOnce(lectura.promesa).mockResolvedValue({ id: 'O-no-crear' });
  const pendent = createOrganization(FORN, { signal: control.signal });
  const rebuig = expect(pendent).rejects.toMatchObject({ name: 'AbortError' });
  canviaAbast(tipus, control);
  lectura.resol([]);
  await rebuig;
  expect(m.request).toHaveBeenCalledTimes(1);
});

test('el PATCH conserva el senyal i una renovació legítima no invalida la resposta', async () => {
  const patch = diferida(), control = new AbortController();
  m.request.mockReturnValueOnce(patch.promesa);
  const pendent = updateOrganization('O-renovacio', { town_name: 'Xixona' }, { signal: control.signal });
  m.renovacio++;
  patch.resol([{ id: 'O-renovacio', town_name: 'Xixona' }]);
  await expect(pendent).resolves.toMatchObject({ id: 'O-renovacio' });
  expect(m.request.mock.calls[0][2].signal).toBe(control.signal);
});

test('una cancel·lació prèvia impedix qualsevol PATCH', async () => {
  const control = new AbortController(); control.abort();
  await expect(updateOrganization('O-cancel', { town_name: 'Xixona' }, { signal: control.signal }))
    .rejects.toMatchObject({ name: 'AbortError' });
  expect(m.request).not.toHaveBeenCalled();
});
