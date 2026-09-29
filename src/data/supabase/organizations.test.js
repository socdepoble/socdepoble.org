import { beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ user: { id: 'A' }, tenantId: 'T', supabaseUrl: 'https://poble.test', request: vi.fn() }));
vi.mock('./runtime.js', () => ({ getCurrentUser: () => m.user, request: m.request,
  getResolvedConfig: (config = {}) => ({ tenantId: m.tenantId, supabaseUrl: m.supabaseUrl, hasSupabaseConfig: true,
    runtimeDataMode: config.dataMode || 'remote' }) }));
import {
  createOrganization, listMyOrganizations, updateOrganization,
  reclamaOrganitzacio, lesMevesReclamacions, llegeixContacteOrganitzacio, desaContacteOrganitzacio,
  reiniciaMemoriaContacte
} from './organizations.js';
import { reiniciaLocalPerfils } from '../localPerfils.js';

/* Les columnes amb grant de SELECT (M01 + F1). Cap més: el RETURNING les demana totes. */
const COLUMNES = ['id', 'tenant_id', 'slug', 'name', 'kind', 'parent_organization_id', 'lema', 'description',
  'visibility', 'logo_url', 'hero_url', 'presentacio_html', 'copyright', 'created_at', 'updated_at'];
beforeEach(() => {
  m.user = { id: 'A' }; m.tenantId = 'T'; m.supabaseUrl = 'https://poble.test';
  m.request.mockReset(); m.request.mockResolvedValue([{ id: 'O' }]);
  /* T48 · La memòria de les RPC de contacte és del mòdul: cada prova comença sense. */
  reiniciaMemoriaContacte();
});

test('updateOrganization mapeja els camps nous de la fitxa i conserva els d’abans', async () => {
  await updateOrganization('O', { name: 'Cooperativa', lema: 'Del camp a casa', logo_url: 'https://x.test/l.png',
    parentOrganizationId: 'P', visibility: 'public', presentacio_html: '<p>Hola</p>', hero_url: 'https://x.test/h.png' });
  const [, , opcions] = m.request.mock.calls[0];
  expect(opcions.method).toBe('PATCH');
  expect(opcions.headers).toEqual({ Prefer: 'return=representation' });
  expect(opcions.body).toEqual({ name: 'Cooperativa', lema: 'Del camp a casa', logo_url: 'https://x.test/l.png',
    parent_organization_id: 'P', visibility: 'public', presentacio_html: '<p>Hola</p>', hero_url: 'https://x.test/h.png' });
});
test('el RETURNING només demana columnes amb grant de SELECT', async () => {
  await updateOrganization('O/1', { name: 'Nom' });
  const url = new URL(m.request.mock.calls[0][0], 'https://example.test');
  expect(url.pathname).toBe('/rest/v1/organizations');
  expect(url.searchParams.get('id')).toBe('eq.O/1');
  expect(url.searchParams.get('select').split(',')).toEqual(COLUMNES);
});
test('un valor buit es desa; un camp absent o desconegut no viatja', async () => {
  await updateOrganization('O', { lema: '', presentacio_html: undefined, rol: 'owner' });
  expect(m.request.mock.calls[0][2].body).toEqual({ lema: '' });
});
for (const [nom, updates] of [['buit', {}], ['desconegut', { rol: 'owner' }], ['undefined', { name: undefined }], ['absent', undefined]]) {
  test(`sense cap camp conegut (${nom}) llança sense cridar el servidor`, async () => {
    await expect(updateOrganization('O', updates)).rejects.toThrow('Cap camp');
    expect(m.request).not.toHaveBeenCalled();
  });
}
test('una imatge incrustada (data:) no s’envia, ni com a logotip ni com a capçalera', async () => {
  await expect(updateOrganization('O', { logo_url: 'data:image/png;base64,AAAA' })).rejects.toThrow('no es desen incrustades');
  await expect(updateOrganization('O', { name: 'Forn', hero_url: 'data:image/webp;base64,AAAA' })).rejects.toThrow('no es desen incrustades');
  expect(m.request).not.toHaveBeenCalled();
});
test('sense fila confirmada no anuncia èxit', async () => {
  m.request.mockResolvedValueOnce([]);
  await expect(updateOrganization('O', { name: 'Nom' })).rejects.toThrow("No s'ha pogut actualitzar");
});

test('createOrganization envia p_lema només si ve', async () => {
  m.request.mockResolvedValue([{ id: 'O' }]);
  await createOrganization({ kind: 'company', name: 'Forn', slug: 'forn' });
  expect(m.request.mock.calls[0][2].body).not.toHaveProperty('p_lema');
  await createOrganization({ kind: 'company', name: 'Forn', slug: 'forn', lema: 'Pa de llenya' });
  expect(m.request.mock.calls[1][0]).toBe('/rest/v1/rpc/create_organization');
  expect(m.request.mock.calls[1][2].body).toEqual({ p_tenant_id: 'T', p_kind: 'company', p_name: 'Forn', p_slug: 'forn',
    p_description: '', p_parent_organization_id: null, p_lema: 'Pa de llenya' });
});
test('createOrganization sense sessió no crida el servidor', async () => {
  m.user = null;
  await expect(createOrganization({ name: 'Forn' })).rejects.toThrow('Cal iniciar sessió');
  expect(m.request).not.toHaveBeenCalled();
});
test.each(['seed', 'local'])('crear organització en %s no escriu al servidor real', async dataMode => {
  await expect(createOrganization({ kind: 'company', name: 'Sóc de Poble', slug: 'soc-de-poble' }, { dataMode }))
    .rejects.toThrow('formulari d’entrada');
  expect(m.request).not.toHaveBeenCalled();
});

test('createOrganization rebutja el tenant diferent del que ha enviat realment', async () => {
  m.request.mockResolvedValue({ id: 'O', tenant_id: 'un-altre-poble' });
  await expect(createOrganization({ kind: 'company', name: 'Forn', slug: 'forn' }, {})).rejects.toThrow('altre poble');
  expect(m.request.mock.calls[0][2].body.p_tenant_id).toBe('T');
});

test('createOrganization accepta el tenant confirmat i una resposta parcial sense tenant', async () => {
  for (const resposta of [{ id: 'O', tenant_id: 'T' }, { id: 'O' }]) {
    m.request.mockResolvedValueOnce([resposta]);
    expect(await createOrganization({ kind: 'company', name: 'Forn', slug: 'forn' })).toEqual(resposta);
  }
});

test('el tenant UUID és el mateix encara que PostgreSQL el retorne en minúscules', async () => {
  m.tenantId = 'AAAAAAAA-AAAA-4AAA-AAAA-AAAAAAAAAAAA';
  const resposta = { id: 'O', tenant_id: m.tenantId.toLowerCase() };
  m.request.mockResolvedValue(resposta);
  expect(await createOrganization({ kind: 'company', name: 'Forn', slug: 'forn' })).toEqual(resposta);
});

/* T47 (C5) · Va després de totes les proves que miren el RETURNING: el mòdul
   recorda la columna absent durant la resta del fitxer. */
test('T47 · una columna del RETURNING que el servidor no té no bloqueja el desat: es torna a provar sense ella', async () => {
  const sense = Object.assign(new Error('Supabase 400: {"code":"42703","message":"column organizations.copyright does not exist"}'), { status: 400 });
  m.request.mockRejectedValueOnce(sense).mockResolvedValueOnce([{ id: 'O', lema: 'Del camp' }]);
  expect(await updateOrganization('O', { lema: 'Del camp' })).toEqual({ id: 'O', lema: 'Del camp' });
  expect(m.request).toHaveBeenCalledTimes(2);
  const select = (crida) => new URL(m.request.mock.calls[crida][0], 'https://example.test').searchParams.get('select').split(',');
  expect(select(0)).toContain('copyright');
  expect(select(1)).toEqual(COLUMNES.filter((columna) => columna !== 'copyright'));
  expect(m.request.mock.calls[1][2].body).toEqual({ lema: 'Del camp' });
  // Recordada: el desat següent ja no la demana.
  await updateOrganization('O', { name: 'Forn' });
  expect(select(2)).not.toContain('copyright');
  // Una columna que s'ESCRIU i no existix no es pot amagar: l'error passa tal qual.
  m.request.mockRejectedValueOnce(Object.assign(new Error('Supabase 400: {"code":"42703","message":"column organizations.hero_url does not exist"}'), { status: 400 }));
  await expect(updateOrganization('O', { hero_url: 'https://x.test/h.png' })).rejects.toThrow('hero_url');
});

test('listMyOrganizations torna les files tal qual, amb les columnes noves', async () => {
  const fila = { id: 'O', name: 'Forn', logo_url: 'https://x.test/l.png', hero_url: null, presentacio_html: '' };
  m.request.mockResolvedValueOnce([fila]);
  expect(await listMyOrganizations()).toEqual([fila]);
  expect(m.request.mock.calls[0][2].body).toEqual({ p_tenant_id: 'T' });
  m.user = null;
  expect(await listMyOrganizations()).toEqual([]);
  expect(m.request).toHaveBeenCalledTimes(1);
});

/* ── T43 (ordre del Mestre, 260928) · administrar organitzacions i correu ── */

const ORG = '5f2b7c1e-0a1b-4c2d-8e3f-9a0b1c2d3e4f';
const errorServidor = (status, cos) => Object.assign(new Error(`Supabase ${status}: ${cos}`), { status });

test('T43 · reclamar crida sollicita_reclamacio amb l’UUID i la justificació tallada a 1000; torna «pendent»', async () => {
  m.request.mockResolvedValueOnce({ id: 'C1', organization_id: ORG, estat: 'pendent', created_at: '2026-09-28T10:00:00Z' });
  const resultat = await reclamaOrganitzacio(ORG.toUpperCase(), { justificacio: `  ${'a'.repeat(1200)}  ` });
  const [ruta, , opcions] = m.request.mock.calls[0];
  expect(ruta).toBe('/rest/v1/rpc/sollicita_reclamacio');
  expect(opcions.method).toBe('POST');
  expect(opcions.body.p_organization_id).toBe(ORG);
  expect(opcions.body.p_justificacio).toHaveLength(1000);
  expect(resultat).toEqual({ id: 'C1', organitzacioId: ORG, estat: 'pendent', role: null, data: '2026-09-28T10:00:00Z' });
});

test('T43 · un id que no és UUID o sense sessió no fa cap petició', async () => {
  await expect(reclamaOrganitzacio('socdepoble')).rejects.toMatchObject({ code: 'SDP-CLAIM-001' });
  m.user = null;
  await expect(reclamaOrganitzacio(ORG)).rejects.toMatchObject({ code: 'SDP-CLAIM-000' });
  expect(await lesMevesReclamacions()).toEqual([]);
  expect(m.request).not.toHaveBeenCalled();
});

test('T43 · els errors es llegixen pel prefix SDP, no pel 409: «ja té propietària» i «ja pendent» són distints', async () => {
  const casos = [
    [errorServidor(409, '{"code":"23505","message":"SDP-CLAIM-003: l\'entitat ja té propietària."}'), 'SDP-CLAIM-003'],
    [errorServidor(409, '{"code":"23505","message":"duplicate key value violates unique constraint \\"idx_claims_una_pendent\\""}'), 'JA-PENDENT'],
    [errorServidor(403, '{"code":"42501","message":"SDP-CLAIM-002: no eres del poble d\'esta entitat."}'), 'SDP-CLAIM-002'],
    [errorServidor(404, 'L\'esquema requerit no està aplicat'), 'NO-DISPONIBLE']
  ];
  for (const [error, code] of casos) {
    m.request.mockRejectedValueOnce(error);
    const fallada = await reclamaOrganitzacio(ORG).catch((e) => e);
    expect(fallada.code).toBe(code);
    expect(fallada.message).not.toContain('Supabase');
  }
  const cancel = Object.assign(new Error('Cancel·lat'), { name: 'AbortError' });
  m.request.mockRejectedValueOnce(cancel);
  await expect(reclamaOrganitzacio(ORG)).rejects.toBe(cancel);
});

test('T43 · les meues peticions porten SEMPRE el filtre de la persona i es tradueixen', async () => {
  m.request.mockResolvedValueOnce([
    { id: 'C1', organization_id: ORG, estat: 'rebutjada', created_at: 'a', resolta_at: 'b' },
    { id: 'C2', organization_id: ORG, estat: 'raro', created_at: 'c', resolta_at: null }
  ]);
  expect(await lesMevesReclamacions()).toEqual([
    { id: 'C1', organitzacioId: ORG, estat: 'rebutjada', data: 'a', resoltaAt: 'b' },
    { id: 'C2', organitzacioId: ORG, estat: 'pendent', data: 'c', resoltaAt: null }
  ]);
  const url = new URL(m.request.mock.calls[0][0], 'https://example.test');
  expect(url.pathname).toBe('/rest/v1/organization_claims');
  expect(url.searchParams.get('user_id')).toBe('eq.A');
  expect(url.searchParams.get('select')).toBe('id,organization_id,estat,created_at,resolta_at');
  m.request.mockRejectedValueOnce(errorServidor(404, '{"code":"PGRST205"}'));
  await expect(lesMevesReclamacions()).rejects.toMatchObject({ code: 'NO-DISPONIBLE' });
});

test('T43 · el correu de l’organització: RPC de lectura i de desat, normalitzat, i sense esquema es diu', async () => {
  m.request.mockResolvedValueOnce([{ correu: 'Forn@Exemple.cat', es_public: true, origen_per_defecte: 'creador', correu_per_defecte: null }]);
  expect(await llegeixContacteOrganitzacio(ORG)).toEqual({
    correu: 'forn@exemple.cat', public: true, perDefecte: { origen: 'creador', correu: null }
  });
  expect(m.request.mock.calls[0][0]).toBe('/rest/v1/rpc/contacte_organitzacio');
  expect(m.request.mock.calls[0][2].body).toEqual({ p_organization_id: ORG });

  m.request.mockResolvedValueOnce([{ correu: '', es_public: false, origen_per_defecte: 'creador', correu_per_defecte: 'a@x.cat' }]);
  expect(await desaContacteOrganitzacio(ORG, { correu: '  ', public: true })).toMatchObject({ correu: '', public: false });
  expect(m.request.mock.calls[1][2].body).toEqual({ p_organization_id: ORG, p_correu: null, p_public: false });

  /* El 403 abans del 404: des de T48, dins d'una prova, el mòdul recorda la RPC
     absent per origen i poble (el beforeEach la reinicia entre proves). */
  m.request.mockRejectedValueOnce(errorServidor(403, '{"message":"SDP-ORGMAIL-001: només qui administra"}'));
  await expect(llegeixContacteOrganitzacio(ORG)).rejects.toMatchObject({ code: 'SDP-ORGMAIL-001' });
  m.request.mockRejectedValueOnce(errorServidor(404, 'L\'esquema requerit no està aplicat (falta "contacte_organitzacio")'));
  const fallada = await llegeixContacteOrganitzacio(ORG).catch((e) => e);
  expect(fallada).toMatchObject({ code: 'NO-DISPONIBLE', message: 'El servidor d’este poble encara no desa el correu de les organitzacions.' });
});

test('T48 · després del primer 404 la RPC de contacte no es torna a cridar per a eixe origen i poble', async () => {
  m.tenantId = 'poble-sense-rpc';
  m.request.mockRejectedValueOnce(errorServidor(404, '{"code":"PGRST202","message":"Could not find the function public.contacte_organitzacio"}'));
  await expect(llegeixContacteOrganitzacio(ORG)).rejects.toMatchObject({ code: 'NO-DISPONIBLE' });
  await expect(llegeixContacteOrganitzacio(ORG)).rejects.toMatchObject({ code: 'NO-DISPONIBLE' });
  await expect(llegeixContacteOrganitzacio('6a3c8d2f-1b2c-4d3e-9f40-ab1c2d3e4f50')).rejects.toMatchObject({ code: 'NO-DISPONIBLE' });
  expect(m.request).toHaveBeenCalledTimes(1);
  // La memòria és per poble: un altre poble sí que es pregunta.
  m.tenantId = 'poble-amb-rpc';
  m.request.mockResolvedValueOnce([{ correu: 'a@x.cat', es_public: false, origen_per_defecte: 'creador', correu_per_defecte: null }]);
  expect(await llegeixContacteOrganitzacio(ORG)).toMatchObject({ correu: 'a@x.cat' });
  expect(m.request).toHaveBeenCalledTimes(2);
  // Un error de permís no es recorda: la crida següent torna a anar al servidor.
  m.request.mockRejectedValueOnce(errorServidor(403, '{"message":"SDP-ORGMAIL-001: només qui administra"}'));
  await expect(llegeixContacteOrganitzacio(ORG)).rejects.toMatchObject({ code: 'SDP-ORGMAIL-001' });
  m.request.mockResolvedValueOnce([{ correu: 'a@x.cat', es_public: true, origen_per_defecte: 'creador', correu_per_defecte: null }]);
  expect(await llegeixContacteOrganitzacio(ORG)).toMatchObject({ public: true });
  expect(m.request).toHaveBeenCalledTimes(4);
  // El desat té la seua memòria: també un sol 404.
  m.tenantId = 'poble-sense-rpc';
  m.request.mockRejectedValueOnce(errorServidor(404, '{"code":"PGRST202"}'));
  await expect(desaContacteOrganitzacio(ORG, { correu: 'b@x.cat', public: true })).rejects.toMatchObject({ code: 'NO-DISPONIBLE' });
  await expect(desaContacteOrganitzacio(ORG, { correu: 'b@x.cat', public: true })).rejects.toMatchObject({ code: 'NO-DISPONIBLE' });
  expect(m.request).toHaveBeenCalledTimes(5);
});

const ORG_2 = '6a3c8d2f-1b2c-4d3e-9f40-ab1c2d3e4f50';
const diferit = () => { let resolve, reject; const promise = new Promise((si, no) => { resolve = si; reject = no; }); return { promise, resolve, reject }; };

test('T48 · lectures concurrents amb el 404 encara en camí: una sola crida, i totes diuen NO-DISPONIBLE', async () => {
  const resposta = diferit();
  m.request.mockReturnValueOnce(resposta.promise);
  /* Dues organitzacions, i StrictMode que repetix l'efecte: quatre lectures alhora. */
  const lectures = [ORG, ORG_2, ORG, ORG_2].map((id) => llegeixContacteOrganitzacio(id).catch((e) => e));
  await Promise.resolve();
  expect(m.request).toHaveBeenCalledTimes(1);
  resposta.reject(errorServidor(404, '{"code":"PGRST202"}'));
  for (const fallada of await Promise.all(lectures)) expect(fallada).toMatchObject({ code: 'NO-DISPONIBLE' });
  expect(m.request).toHaveBeenCalledTimes(1);
});

test('T48 · si la sonda troba la RPC, les que esperaven fan la seua crida; després ja no s’esperen', async () => {
  const primera = diferit();
  m.request.mockReturnValueOnce(primera.promise);
  const fila = [{ correu: 'a@x.cat', es_public: false, origen_per_defecte: 'creador', correu_per_defecte: null }];
  const a = llegeixContacteOrganitzacio(ORG);
  const b = llegeixContacteOrganitzacio(ORG_2);
  await Promise.resolve();
  expect(m.request).toHaveBeenCalledTimes(1);
  m.request.mockResolvedValueOnce(fila);
  primera.resolve(fila);
  await expect(Promise.all([a, b])).resolves.toHaveLength(2);
  expect(m.request.mock.calls.map(([, , opcions]) => opcions.body.p_organization_id)).toEqual([ORG, ORG_2]);
  // La RPC ja ha contestat: dues lectures noves van al servidor alhora, sense sonda.
  const c = diferit(), d = diferit();
  m.request.mockReturnValueOnce(c.promise).mockReturnValueOnce(d.promise);
  const lectures = Promise.all([llegeixContacteOrganitzacio(ORG), llegeixContacteOrganitzacio(ORG_2)]);
  await Promise.resolve();
  expect(m.request).toHaveBeenCalledTimes(4);
  c.resolve(fila); d.resolve(fila);
  await expect(lectures).resolves.toHaveLength(2);
});

/* D4 · Si la sonda fallida (xarxa) es quedara registrada, les lectures següents
   l'esperarien ja resolta i cap faria de sonda nova: totes anirien al servidor
   (ací, 3 crides i una fila de la resposta per defecte). Amb dues lectures
   alhora i el 404 diferit, només una sonda nova en fa 1. */
test('T48 · una sonda sense resposta clara (xarxa) no queda penjada: en naix una de nova', async () => {
  m.request.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  await expect(llegeixContacteOrganitzacio(ORG)).rejects.toThrow('Failed to fetch');
  const resposta = diferit();
  m.request.mockReturnValueOnce(resposta.promise);
  const lectures = [ORG, ORG_2].map((id) => llegeixContacteOrganitzacio(id).catch((e) => e));
  await Promise.resolve();
  resposta.reject(errorServidor(404, '{"code":"PGRST202"}'));
  for (const fallada of await Promise.all(lectures)) expect(fallada).toMatchObject({ code: 'NO-DISPONIBLE' });
  expect(m.request).toHaveBeenCalledTimes(2);
});

test('T48 · la memòria és per origen: el mateix poble en un altre servidor sí que es pregunta', async () => {
  m.request.mockRejectedValueOnce(errorServidor(404, '{"code":"PGRST202"}'));
  await expect(llegeixContacteOrganitzacio(ORG)).rejects.toMatchObject({ code: 'NO-DISPONIBLE' });
  m.supabaseUrl = 'https://un-altre-servidor.test';
  m.request.mockResolvedValueOnce([{ correu: 'a@x.cat', es_public: false, origen_per_defecte: 'creador', correu_per_defecte: null }]);
  expect(await llegeixContacteOrganitzacio(ORG)).toMatchObject({ correu: 'a@x.cat' });
  expect(m.request).toHaveBeenCalledTimes(2);
});

test('T43 · un correu mal format no arriba al servidor', async () => {
  for (const dolent of ['sense-arroba', 'a b@x.cat', 'a@x.cat?cc=b@y.cat', 'a@x']) {
    await expect(desaContacteOrganitzacio(ORG, { correu: dolent, public: false })).rejects.toMatchObject({ code: 'CORREU-INVALID' });
  }
  expect(m.request).not.toHaveBeenCalled();
});

test.each(['seed', 'local'])('T43 · en %s tot delega a localPerfils: alta immediata i correu en memòria, sense servidor', async (dataMode) => {
  reiniciaLocalPerfils();
  m.user = { id: 'A', email: 'a@poble.test' };
  expect(await reclamaOrganitzacio('soc-de-poble', {}, { dataMode })).toMatchObject({ estat: 'aprovada', role: 'owner', jaHiEra: true });
  expect(await lesMevesReclamacions({ dataMode })).toEqual([]);
  expect(await desaContacteOrganitzacio('socdepoble', { correu: 'hola@socdepoble.cat', public: true }, { dataMode }))
    .toEqual({ correu: 'hola@socdepoble.cat', public: true, perDefecte: { origen: 'propietaria', correu: 'a@poble.test' } });
  expect(await llegeixContacteOrganitzacio('socdepoble', { dataMode })).toMatchObject({ correu: 'hola@socdepoble.cat' });
  expect(m.request).not.toHaveBeenCalled();
  reiniciaLocalPerfils();
});
