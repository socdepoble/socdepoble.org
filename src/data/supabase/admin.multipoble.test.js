import { beforeEach, expect, test, vi } from 'vitest';
import { readFileSync } from 'node:fs';
const m = vi.hoisted(() => ({ user: { id: 'super' }, epoch: 1, rpc: vi.fn(), mode: 'remote', configured: true }));
vi.mock('./runtime.js', () => ({
  getCurrentUser: () => m.user, rpc: m.rpc,
  getResolvedConfig: config => ({ hasSupabaseConfig: m.configured, tenantId: config.tenantId ?? config.tenant_id ?? 'global', runtimeDataMode: m.mode })
}));
vi.mock('../identitat.js', () => ({ get versioSessio() { return m.epoch; } }));
import { adminLlistaPobles, adminLligPersonalitzacio } from './admin.js';
import { CAPACITATS, CONTRACTE_NUCLI } from '../contracte.js';
import { CASOS, contextDeConformitat, executaCas } from '../conformitat/kit.js';
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
beforeEach(() => { m.rpc.mockReset(); m.user = { id: 'super' }; m.epoch = 1; m.mode = 'remote'; m.configured = true; });

test('FEDI-04 · capacitat opcional separada de l’admin i del nucli', () => {
  expect(CAPACITATS.administracioMultipoble).toEqual(['adminLlistaPobles', 'adminLligPersonalitzacio']);
  for (const nom of CAPACITATS.administracioMultipoble) expect(CONTRACTE_NUCLI).not.toContain(nom);
});
test('llista només la RPC protegida, projecta tres camps i conserva config i senyal', async () => {
  const control = new AbortController(), config = { signal: control.signal };
  m.rpc.mockResolvedValue([{ id: A, slug: 'xixona', nom: 'Xixona', campPrivat: 'no copiar' }]);
  expect(await adminLlistaPobles(config)).toEqual([{ id: A, slug: 'xixona', nom: 'Xixona' }]);
  expect(m.rpc).toHaveBeenCalledWith('admin_llista_pobles', {}, config, { signal: control.signal });
});
test('lectura del tenant explícit amb versions reals; mai usa el tenant global implícit', async () => {
  await expect(adminLligPersonalitzacio({})).rejects.toThrow('tenant explícit');
  expect(m.rpc).not.toHaveBeenCalled();
  const config = { tenantId: B };
  m.rpc.mockResolvedValue({ tenantId: B, files: [{ key: 'taxonomia', payload: { categories: ['B'] }, version: 7 }] });
  expect(await adminLligPersonalitzacio(config)).toEqual({ taxonomia: { payload: { categories: ['B'] }, versio: 7 }, estil: null });
  expect(m.rpc).toHaveBeenCalledWith('admin_llegix_personalitzacio', { p_tenant_id: B }, config, { signal: undefined });
});
test('inputs malformats rebutgen amb codi neutral abans de qualsevol RPC (casos del kit)', async () => {
  for (const metode of [adminLlistaPobles, adminLligPersonalitzacio]) {
    await expect(metode({ tenantId: 'conformitat-tenant-invalid' })).rejects.toMatchObject({ code: 'abast-invalid' });
  }
  expect(m.rpc).not.toHaveBeenCalled();
});
test('els quatre casos neutrals passen contra l’adaptador remot amb doble de RPC autoritzada', async () => {
  const ctx = contextDeConformitat({ config: { tenantId: A }, adminMultipobleAutoritzat: true, tenantAdministrat: B });
  const adaptador = { adminLlistaPobles, adminLligPersonalitzacio };
  m.rpc.mockImplementation(async (nom, args) => nom === 'admin_llista_pobles'
    ? [{ id: B, slug: 'sella', nom: 'Sella' }]
    : { tenantId: args.p_tenant_id, files: [{ key: 'estil', payload: {}, version: 2 }] });
  for (const c of CASOS.filter(c => c.capacitat === 'administracioMultipoble')) {
    expect(await executaCas(c, adaptador, ctx), c.titol).toEqual({ estat: 'ok', falles: [], motiu: null });
  }
  expect(m.rpc).toHaveBeenCalledTimes(2);
  expect(m.rpc).toHaveBeenLastCalledWith('admin_llegix_personalitzacio', { p_tenant_id: B }, { tenantId: B }, { signal: undefined });
  expect(ctx.config).toEqual({ tenantId: A });
});
test('sense sessió o servidor remot no inventa llista ni simulació multipoble', async () => {
  m.user = null;
  await expect(adminLlistaPobles()).rejects.toMatchObject({ code: 'sense-sessio' });
  m.user = { id: 'a' }; m.mode = 'seed';
  await expect(adminLlistaPobles()).rejects.toMatchObject({ code: 'no-disponible' });
  await expect(adminLligPersonalitzacio({ tenantId: A })).rejects.toMatchObject({ code: 'no-disponible' });
  expect(m.rpc).not.toHaveBeenCalled();
});
test('rebutja files inesperades, repetides i respostes d’un altre tenant', async () => {
  for (const rows of [null, [{ id: 'mostra', slug: 's', nom: 's' }], [{ id: A, slug: 'a', nom: 'A' }, { id: A, slug: 'b', nom: 'B' }]]) {
    m.rpc.mockResolvedValueOnce(rows); await expect(adminLlistaPobles()).rejects.toThrow('invàlida');
  }
  m.rpc.mockResolvedValueOnce({ tenantId: A, files: [] });
  await expect(adminLligPersonalitzacio({ tenantId: B })).rejects.toThrow('altre poble');
});
test('un rebuig del servidor no es transforma en una llista buida', async () => {
  for (const message of ['rol no autoritzat', 'cal aal2', 'tenant no autoritzat']) {
    const error = Object.assign(new Error(message), { status: 403 });
    m.rpc.mockRejectedValueOnce(error);
    await expect(adminLlistaPobles()).rejects.toBe(error);
  }
});
test('una sessió substituïda durant la lectura no lliura les dades antigues', async () => {
  let resolve;
  m.rpc.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
  const promesa = adminLlistaPobles();
  m.epoch++;
  resolve([{ id: A, slug: 'a', nom: 'A' }]);
  await expect(promesa).rejects.toMatchObject({ name: 'AbortError' });
});
test('contracte SQL, sense executar PostgreSQL: guarda superadmin/aal2 abans de llegir, permisos tancats i tenant exacte', () => {
  const sql = readFileSync('supabase/migrations/2611031700_administracio_multipoble.sql', 'utf8').replace(/--.*$/gm, '');
  expect(sql).not.toMatch(/town_memberships|grant.*to\s+anon/i);
  const funcions = sql.split('create or replace function public.').slice(1);
  expect(funcions).toHaveLength(2);
  for (const f of funcions) {
    expect(f).toMatch(/security definer set search_path = ''/);
    expect(f.indexOf('private.es_superadmin()')).toBeLessThan(f.indexOf('from public.'));
    expect(f).toMatch(/errcode = '42501'/);
  }
  expect(sql).toContain('where c.tenant_id = p_tenant_id');
  expect(sql).toContain("c.key in ('taxonomia', 'estil')");
  expect(sql).toMatch(/p_tenant_id is null or not exists/);
  for (const signatura of ['admin_llista_pobles()', 'admin_llegix_personalitzacio(uuid)']) {
    expect(sql).toContain(`revoke execute on function public.${signatura} from public, anon;`);
  }
  expect(sql.match(/to authenticated;/g)).toHaveLength(2);
  const aal = readFileSync('supabase/migrations/2610061448_superadmin_aal2.sql', 'utf8');
  expect(aal).toMatch(/role = 'superadmin'[\s\S]*'aal2'/);
});
