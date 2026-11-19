/* Onada R32 · Fusió semàntica del lot_01 de Codex R31 (opció A de publicacions)
   sobre l'esquema VIU. El kit enviava `expectedUpdatedAt` a una RPC CAS que
   només existix a la migració 20261115231000, rebutjada a R30 (ni al
   repositori ni a Producció). Ací es prova el que sí que val amb l'esquema viu:
   servei real → client real (content.js) sobre un transport que modela
   l'upsert per id de PostgREST (`resolution=merge-duplicates`,
   `return=representation`) i els triggers de section_submissions:
     · publicar, republicar i retirar les dues audiències sense cap RPC;
     · la versió del servidor (updated_at, text exacte amb microsegons) es
       guarda per audiència i sobreviu a la reobertura, però no torna a viatjar;
     · una escriptura amb versió es rebutja abans de cap petició (D-R32-PUB-1),
       mai es degrada a sobreescriure;
     · una representació sense versió estricta no n'inventa cap, i un ACK sense
       versió deixa la de l'audiència desconeguda (null), mai la de la revisió
       anterior, que ja és rància (Gauntlet R32);
     · un registre d'abans de R32 només adopta una versió coincident exacta, i
       només amb el servei versionat: dorment, l'adopció no toca el magatzem. */
import { beforeEach, expect, test, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { creaIdbFals } from '../../utils/__fixtures__/navegadorFals.js';
const OWNER = '11111111-1111-4111-8111-111111111111', TOWN = '22222222-2222-4222-8222-222222222222';
const ENTITAT = '44444444-4444-4444-8444-444444444444';
const m = vi.hoisted(() => ({ rows: new Map(), calls: [], tick: 0, lose: false, committed: 0, representacio: null }));
vi.mock('./runtime.js', () => ({
  getCurrentUser: () => ({ id: '11111111-1111-4111-8111-111111111111' }),
  getResolvedConfig: () => ({ hasSupabaseConfig: true, tenantId: '22222222-2222-4222-8222-222222222222', runtimeDataMode: 'remote' }),
  generateUUID: () => '33333333-3333-4333-8333-333333333333', buildSeedAppData: vi.fn(), mapContentRowsToData: vi.fn(), rpc: vi.fn(),
  request: vi.fn(async (url, _config, options = {}) => {
    m.calls.push({ url, options: structuredClone(options) });
    if (url.includes('/rpc/')) throw Object.assign(new Error(`RPC inexistent a l'esquema viu: ${url}`), {status:404,postgrestCode:'PGRST202'});
    if (url !== '/rest/v1/section_submissions?on_conflict=id' || options.method !== 'POST') throw new Error(`Transport inesperat: ${url}`);
    expect(options.headers.Prefer).toBe('return=representation,resolution=merge-duplicates');
    const [fila] = options.body;
    expect(fila).not.toHaveProperty('expectedUpdatedAt');
    const next = () => `2026-11-16T05:00:00.${String(++m.tick).padStart(6, '0')}Z`;
    // Contracte de trg_force_submission_author i de section_submissions_conserva_creacio:
    // estes claus no sobreviuen, el nom visible el recalcula el servidor i created_at no es redata.
    const sanitize = row => { for (const key of ['id', 'created_at', 'author']) delete row.payload[key]; row.payload.author_name = 'Autoria canònica'; return row; };
    const previa = m.rows.get(fila.id);
    if (previa && previa.owner_user_id !== fila.owner_user_id) throw Object.assign(new Error('RLS'), { postgrestCode: '42501' });
    if (previa && previa.section_id !== fila.section_id) throw Object.assign(new Error('SDP-SEC-002: section_id is immutable'), { postgrestCode: 'P0001' });
    const desada = sanitize({ ...structuredClone(previa ?? {}), ...structuredClone(fila),
      author_org_id: Object.hasOwn(fila, 'author_org_id') ? fila.author_org_id : previa?.author_org_id ?? null,
      created_at: previa?.created_at ?? fila.created_at, updated_at: next() });
    m.rows.set(fila.id, desada); m.committed++;
    if (m.lose) { m.lose = false; throw new Error('ACK perdut després del commit'); }
    return m.representacio ? m.representacio(structuredClone(desada)) : [structuredClone(desada)];
  }),
}));
vi.mock('../identitat.js', () => ({ capturaSessio: () => () => {} }));
vi.mock('./copublicacioMur.js', () => ({ comprovaPublicacioNoRetirada: async () => {}, drenaRevocacionsMur: async () => {} }));
import { appendSectionSubmissionNetworkOnly } from './content.js';
import { creaServeiProjeccionsCataleg, registreProjeccioPendent } from '../projeccionsCatalegServei.js';
import { elementDeFilaPublicada } from '../mapejadorSeccions.js';
import { elementDeMurMembre } from '../murPublic.js';
const FONT = { font: 'herbari', id: 'romer', title: 'Romer', subtitle: 'Salvia rosmarinus', lead: '' };
const enviades = [];
const crea = extra => creaServeiProjeccionsCataleg({ abast: { tenantId: TOWN, ownerId: OWNER, backendId: 'r32-fixture' },
  idb: null, navegador: null, Canal: null, subtil: webcrypto.subtle,
  publica: sub => { enviades.push(structuredClone(sub)); return appendSectionSubmissionNetworkOnly(sub); }, ...extra });
const remote = () => [...m.rows.values()].map(row => row.section_id === 'mur' ? elementDeMurMembre(row, 'mur')
  : { ...elementDeFilaPublicada({ id: row.id, payload: row.payload, titol: row.title, createdAt: row.created_at,
    updatedAt: row.updated_at, ownerUserId: row.owner_user_id, authorOrgId: row.author_org_id, sectionId: 'notes' }), sectionId: 'notes' });
const versioDe = sectionId => [...m.rows.values()].find(row => row.section_id === sectionId).updated_at;
beforeEach(() => { m.rows.clear(); m.calls.length = 0; m.tick = 0; m.lose = false; m.committed = 0; m.representacio = null; enviades.length = 0; });

test('servei real → client viu: publica, republica i retira les dues audiències amb l’upsert per id, sense cap RPC', async () => {
  const service = crea();
  try {
    await service.prepara(); await service.desa(FONT, ['mur', 'bar']); await service.sincronitza();
    const first = (await service.llista())[0];
    // La versió de cada audiència és el text exacte del servidor (microsegons inclosos).
    expect(first.versions).toEqual({ privada: '2026-11-16T05:00:00.000001Z', publica: '2026-11-16T05:00:00.000002Z' });
    await service.desa({ ...FONT, title: 'Romer revisat' }, ['herbari', 'rebost']); await service.sincronitza();
    expect(remote().map(row => row.projeccioCataleg.destins)).toEqual([['rebost'], ['herbari']]);
    expect((await service.llista())[0].versions).toEqual({ privada: versioDe('notes'), publica: versioDe('mur') });
    await service.desa(FONT, []); await service.sincronitza();
    expect(remote().map(row => [row.title, row.projeccioCataleg.destins])).toEqual([['Publicació retirada', []], ['Publicació retirada', []]]);
    expect(registreProjeccioPendent((await service.llista())[0])).toBe(false);
    expect(m.committed).toBe(6); expect(m.rows.size).toBe(2);
    expect(m.calls.some(call => call.url.includes('/rpc/'))).toBe(false);
    // Les versions conegudes no tornen a viatjar: el backend viu no té CAS de publicacions.
    expect(enviades).toHaveLength(6);
    expect(enviades.some(sub => Object.hasOwn(sub, 'expectedUpdatedAt'))).toBe(false);
  } finally { service.tanca(); }
});

test('D-R32-PUB-1 · CAS opt-in absent fa només una RPC i conserva operació pendent sense upsert', async () => {
  const operationId = '44444444-4444-4444-8444-444444444444';
  for (const expectedUpdatedAt of ['2026-11-16T05:00:00.000001Z', null]) {
    await expect(appendSectionSubmissionNetworkOnly({ id: '33333333-3333-4333-8333-333333333333', sectionId: 'mur',
      payload: { content: 'Cos' }, expectedUpdatedAt, operationId })).rejects.toMatchObject({ codi: 'esquema-absent' });
  }
  expect(m.calls).toHaveLength(2); expect(m.calls.every(call => call.url.endsWith('/rpc/publica_section_submission_cas'))).toBe(true);
  const service = crea({ versionada: true });
  try {
    await service.prepara(); await service.desa(FONT, ['mur', 'bar']);
    await expect(service.sincronitza()).rejects.toMatchObject({ codi: 'esquema-absent' });
    expect(m.rows.size).toBe(0);
    const row = (await service.llista())[0]; expect(registreProjeccioPendent(row)).toBe(true);
    expect(row.operacions.privada.id).toMatch(/^[a-f0-9-]{36}$/); expect(row.versions.privada).toBeNull();
  } finally { service.tanca(); }
});

test('ACK perdut després del commit: el reintent és el mateix upsert per id i no duplica cap fila', async () => {
  const service = crea();
  try {
    await service.prepara(); await service.desa(FONT, ['mur', 'bar']);
    m.lose = true;
    await expect(service.sincronitza()).rejects.toThrow('ACK perdut');
    expect(registreProjeccioPendent((await service.llista())[0])).toBe(true);
    await service.sincronitza();
    const row = (await service.llista())[0];
    expect(registreProjeccioPendent(row)).toBe(false);
    expect(m.rows.size).toBe(2); expect(m.committed).toBe(3);
    expect(row.versions).toEqual({ privada: versioDe('notes'), publica: versioDe('mur') });
  } finally { service.tanca(); }
});

test('una representació sense versió estricta publica com abans i no inventa cap versió', async () => {
  const sub = { id: '33333333-3333-4333-8333-333333333333', sectionId: 'mur', title: 'Fira', payload: { content: 'Cos' } };
  const casos = [
    row => [{ ...row, updated_at: 0 }], row => [{ ...row, updated_at: 2026 }], row => [{ ...row, updated_at: '2026' }],
    row => [{ ...row, updated_at: '2026-11-16' }], row => [{ ...row, updated_at: 'invalid' }], row => [{ ...row, updated_at: undefined }],
    row => [{ ...row, id: '55555555-5555-4555-8555-555555555555' }], row => [row, row], () => [], () => null, () => undefined, row => row
  ];
  for (const cas of casos) {
    m.representacio = cas;
    const desada = await appendSectionSubmissionNetworkOnly(sub);
    expect(desada.id).toBe(sub.id); expect(desada).not.toHaveProperty('updatedAt');
  }
  m.representacio = row => [{ ...row, updated_at: '2026-11-16T05:00:00.123456+00:00' }];
  expect((await appendSectionSubmissionNetworkOnly(sub)).updatedAt).toBe('2026-11-16T05:00:00.123456+00:00');
  // El servei tampoc no certifica una versió que el servidor no ha donat.
  m.rows.clear(); m.representacio = () => [];
  const service = crea();
  try {
    await service.prepara(); await service.desa(FONT, ['mur', 'bar']); await service.sincronitza();
    const row = (await service.llista())[0];
    expect(registreProjeccioPendent(row)).toBe(false); expect(row.versions).toEqual({ privada: null, publica: null });
  } finally { service.tanca(); }
});

test('un ACK confirmat sense versió deixa la de l’audiència desconeguda, mai la de la revisió anterior', async () => {
  const service = crea();
  try {
    await service.prepara(); await service.desa(FONT, ['mur', 'bar']); await service.sincronitza();
    const primera = (await service.llista())[0].versions;
    expect(primera).toEqual({ privada: versioDe('notes'), publica: versioDe('mur') });
    // Republicar amb una representació sense updated_at (com Node 0 o l'adaptador local): el servidor ha canviat de versió.
    m.representacio = () => [];
    await service.desa({ ...FONT, title: 'Romer revisat' }, ['herbari', 'rebost']); await service.sincronitza();
    expect(versioDe('notes')).not.toBe(primera.privada); expect(versioDe('mur')).not.toBe(primera.publica);
    const row = (await service.llista())[0];
    expect(registreProjeccioPendent(row)).toBe(false); expect(row.versions).toEqual({ privada: null, publica: null });
    // Una representació amb versió torna a certificar l'actual.
    m.representacio = null;
    await service.desa(FONT, ['bar']); await service.sincronitza();
    expect((await service.llista())[0].versions).toEqual({ privada: versioDe('notes'), publica: versioDe('mur') });
  } finally { service.tanca(); }
});

test('l’entitat que signa la projecció es conserva en republicar i retirar', async () => {
  const actor = { tipus: 'entitat', id: ENTITAT };
  const service = crea({ publica: sub => appendSectionSubmissionNetworkOnly({ ...sub, actor }) });
  try {
    await service.prepara(); await service.desa(FONT, ['mur', 'bar']); await service.sincronitza();
    await service.desa({ ...FONT, title: 'Edició de l’entitat' }, ['herbari', 'bar']); await service.sincronitza();
    await service.desa(FONT, []); await service.sincronitza();
    expect([...m.rows.values()].every(row => row.author_org_id === ENTITAT && row.owner_user_id === OWNER)).toBe(true);
  } finally { service.tanca(); }
});

test('versions sobreviuen a reobertura i un registre d’abans de R32 només adopta l’ACK confirmat exactament coincident', async () => {
  const idb = creaIdbFals().idb;
  let service = crea({ idb });
  try {
    await service.prepara(); await service.desa(FONT, ['mur', 'bar']); await service.sincronitza();
    const versions = (await service.llista())[0].versions; service.tanca(); service = crea({ idb }); await service.prepara();
    expect((await service.llista())[0].versions).toEqual(versions);
  } finally { service.tanca(); }
  const rows = new Map(), es = { totes: 0, actualitza: 0 }, store = { prepara: async () => {}, obtinBloqueig: async () => {},
    totes: async () => { es.totes++; return [...rows.values()]; },
    // Com magatzemLocal: una funció que torna undefined no escriu res.
    actualitza: async (_store, key, fn) => { es.actualitza++; const value = fn(rows.get(key)); if (value !== undefined) rows.set(key, value); return value ?? rows.get(key); },
    tanca() {}, subscriu: () => () => {} };
  // Dorment (el servei de producció): ni una fila exacta fa llegir ni escriure el magatzem.
  service = crea({ magatzem: store });
  try {
    m.rows.clear(); await service.prepara(); await service.desa(FONT, ['mur', 'bar']); await service.sincronitza();
    for (const row of rows.values()) delete row.versions;
    const abans = { ...es };
    await expect(service.adoptaVersionsRemotes(remote())).resolves.toBe(false);
    expect(es).toEqual(abans);
  } finally { service.tanca(); }
  service = crea({ magatzem: store, versionada: true });
  try {
    await service.prepara();
    const actual = remote();
    const divergent = structuredClone(actual); divergent[0].content = 'Edició desconeguda';
    await expect(service.adoptaVersionsRemotes(divergent)).resolves.toBe(true);
    expect((await service.llista())[0].versions.privada).toBeNull();
    await expect(service.adoptaVersionsRemotes(actual)).resolves.toBe(true);
    const saved = (await service.llista())[0]; expect(saved.versions.privada).toBeTruthy(); expect(saved.versions.publica).toBeTruthy();
    // Una versió ja coneguda no canvia encara que la lectura següent siga nova.
    const newer = structuredClone(actual); newer[0].updated_at = '2026-11-16T05:00:00.999999Z';
    await service.adoptaVersionsRemotes(newer); expect((await service.llista())[0].versions).toEqual(saved.versions);
    // Una tria pendent tampoc no adopta res.
    for (const row of rows.values()) { row.versions = { privada: null, publica: null }; row.seq++; }
    await service.adoptaVersionsRemotes(actual); expect((await service.llista())[0].versions).toEqual({ privada: null, publica: null });
  } finally { service.tanca(); }
});
