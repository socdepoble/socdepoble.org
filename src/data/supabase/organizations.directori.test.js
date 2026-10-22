/**
 * Pla 261022_1955 (Cercador Universal, T1) · listPublicOrganizations a
 * l'adaptador de Supabase: la vista organization_directory, sense filtre de
 * poble, amb columnes explícites, i la consulta neta abans de PostgREST.
 */
import { beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ request: vi.fn(), ambServidor: true }));
vi.mock('./runtime.js', () => ({ getCurrentUser: () => null, request: m.request,
  getResolvedConfig: (config = {}) => ({ tenantId: '00000000-0000-4000-8000-000000000000', supabaseUrl: 'https://poble.test',
    hasSupabaseConfig: m.ambServidor, runtimeDataMode: config.dataMode || 'remote' }) }));
import { listPublicOrganizations, reiniciaMemoriaDirectori } from './organizations.js';
import { reiniciaLocalPerfils } from '../localPerfils.js';
import { ENTITAT_PILOT_ID } from '../identitatsSeed.js';

const SELECT = 'id,tenant_id,slug,name,kind,parent_organization_id,lema,description,logo_url,hero_url,presentacio_html,copyright,town_name,created_at,updated_at';
const ruta = (n = 0) => m.request.mock.calls[n][0];
const filtreAnd = (cami) => decodeURIComponent(cami.split('&and=')[1].split('&')[0]);
const columnaAbsent = (columna) => new Error(`Supabase 400: {"code":"42703","message":"column organization_directory.${columna} does not exist"}`);

beforeEach(() => {
  m.request.mockReset();
  m.request.mockResolvedValue([]);
  m.ambServidor = true;
  reiniciaMemoriaDirectori();
  reiniciaLocalPerfils();
});

test('Pla 261022_1955 · remot: la vista amb columnes explícites, per nom i id, amb límit i sense filtre de poble', async () => {
  const figuera = { id: 'a6d028a2-8abc-469d-bf86-ae21aea6bffc', slug: 'lafiguera', name: 'La Figuera' };
  m.request.mockResolvedValueOnce([figuera]);
  await expect(listPublicOrganizations({}, {})).resolves.toEqual([figuera]);
  expect(ruta()).toBe(`/rest/v1/organization_directory?select=${SELECT}&order=name.asc,id.asc&limit=500`);
  expect(ruta()).not.toContain('tenant_id=eq.');
  expect(ruta()).not.toContain('select=*');
});

test('Pla 261022_1955 · el límit es queda entre 1 i el sostre del contracte', async () => {
  await listPublicOrganizations({ limit: 20 }, {});
  await listPublicOrganizations({ limit: 9999 }, {});
  await listPublicOrganizations({ limit: 0 }, {});
  await listPublicOrganizations({ limit: 'molts' }, {});
  expect([0, 1, 2, 3].map((n) => /&limit=(\d+)$/.exec(ruta(n))[1])).toEqual(['20', '500', '500', '500']);
});

test('Pla 261022_1955 · la consulta és un AND de paraules, cada una en nom, slug, lema o descripció, sense cap signe de PostgREST', async () => {
  await listPublicOrganizations({ consulta: 'Forn, (Plaça)*"x"' }, {});
  const or = (paraula) => `or(name.ilike."*${paraula}*",slug.ilike."*${paraula}*",lema.ilike."*${paraula}*",description.ilike."*${paraula}*")`;
  /* Cada paraula, com a patró tolerant als accents (vegeu més avall). */
  expect(filtreAnd(ruta())).toBe(`(${or('f_rn')},${or('pl___')},${or('x')})`);
  /* Les cometes van codificades a l'URL: cap valor no tanca la cadena del filtre. */
  expect(ruta().split('&and=')[1]).not.toContain('"');
});

test('Pla 261022_1955 · com a molt cinc paraules, sense repetir, de 40 caràcters', async () => {
  await listPublicOrganizations({ consulta: `u dos u tres quatre cinc sis set ${'a'.repeat(60)}` }, {});
  const grups = [...filtreAnd(ruta()).matchAll(/or\(name\.ilike\."\*([^*]+)\*"/g)].map((tros) => tros[1]);
  expect(grups).toEqual(['_', 'd_s', 'tr_s', 'q__tr_', '__n_']);
  await listPublicOrganizations({ consulta: 'b'.repeat(60) }, {});
  expect(filtreAnd(ruta(1))).toContain(`"*${'b'.repeat(40)}*"`);
  expect(filtreAnd(ruta(1))).not.toContain('b'.repeat(41));
});

test('Pla 261022_1955 · una consulta sense cap lletra ni xifra no filtra', async () => {
  await listPublicOrganizations({ consulta: ' ,()* ' }, {});
  expect(ruta()).not.toContain('&and=');
});

test('Pla 261022_1955 · una columna que la vista encara no té es lleva del select, es recorda i no es torna a demanar', async () => {
  m.request.mockRejectedValueOnce(columnaAbsent('town_name')).mockResolvedValueOnce([{ id: 'o' }]);
  await expect(listPublicOrganizations({}, {})).resolves.toEqual([{ id: 'o' }]);
  expect(m.request).toHaveBeenCalledTimes(2);
  expect(ruta(1)).not.toContain('town_name');
  await listPublicOrganizations({}, {});
  expect(m.request).toHaveBeenCalledTimes(3);
  expect(ruta(2)).not.toContain('town_name');
});

test.each(['id', 'name', 'slug', 'description'])('Pla 261022_1955 · sense la columna %s (de la fila o del filtre) l’error puja', async (columna) => {
  m.request.mockRejectedValueOnce(columnaAbsent(columna));
  await expect(listPublicOrganizations({}, {})).rejects.toThrow('42703');
  expect(m.request).toHaveBeenCalledTimes(1);
});

test('Pla 261022_1955 · el senyal del filtre (o el de la config) arriba a la crida', async () => {
  const senyal = new AbortController().signal;
  await listPublicOrganizations({ signal: senyal }, {});
  expect(m.request.mock.calls[0][2]).toEqual({ signal: senyal });
  const delaConfig = new AbortController().signal;
  await listPublicOrganizations({}, { signal: delaConfig });
  expect(m.request.mock.calls[1][2]).toEqual({ signal: delaConfig });
});

test('Pla 261022_1955 · sense servidor configurat, cap fila i cap crida', async () => {
  m.ambServidor = false;
  await expect(listPublicOrganizations({}, {})).resolves.toEqual([]);
  expect(m.request).not.toHaveBeenCalled();
});

test.each(['seed', 'local'])('Pla 261022_1955 · en %s, el directori local i cap crida al servidor', async (dataMode) => {
  const files = await listPublicOrganizations({ consulta: 'poble' }, { dataMode });
  expect(files.map((fila) => fila.id)).toContain(ENTITAT_PILOT_ID);
  expect(files.every((fila) => fila.tenant_id === null)).toBe(true);
  expect(m.request).not.toHaveBeenCalled();
});

/* Gauntlet (crític de dades) · Les troballes que no van entrar al sostre de la verificació, comprovades a mà. */
test('Gauntlet · una lletra del pla astral al tall de 40 no parteix cap parell suplent ni fa caure la crida', async () => {
  const astral = String.fromCodePoint(0x1d400);
  await expect(listPublicOrganizations({ consulta: `${'b'.repeat(39)}${astral}zzz` }, {})).resolves.toEqual([]);
  expect(m.request).toHaveBeenCalledTimes(1);
  expect(filtreAnd(ruta())).toContain(`"*${'b'.repeat(39)}${astral}*"`);
});

test('Gauntlet · el patró del servidor tolera accents, ç, apòstrofs i la geminada (un superconjunt)', async () => {
  for (const consulta of ['Sèquia', 'sequia', 'SEQUIA']) await listPublicOrganizations({ consulta }, {});
  expect([0, 1, 2].map((n) => filtreAnd(ruta(n)))).toEqual(Array(3).fill(filtreAnd(ruta(0))));
  expect(filtreAnd(ruta(0))).toContain('name.ilike."*s_q___*"');
  await listPublicOrganizations({ consulta: "l’Horta Maçanes collegi" }, {});
  const and = filtreAnd(ruta(3));
  expect(and).toContain('name.ilike."*l_h_rt_*"');
  expect(and).toContain('name.ilike."*m___n_s*"');
  expect(and).toContain('name.ilike."*__l*l_g_*"');
  /* Cap cometa ni apòstrof dins dels valors: només lletres, xifres, '_', '*' i el guionet. */
  for (const [, valor] of and.matchAll(/ilike\."([^"]*)"/g)) expect(valor).toMatch(/^[\p{L}\p{N}_*-]+$/u);
});
