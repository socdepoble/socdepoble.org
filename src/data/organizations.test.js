import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ user: { id: 'A' }, entrada: 0, createOrganization: vi.fn() }));
vi.mock('./backendPort.js', () => ({ createOrganization: m.createOrganization, getCurrentUser: () => m.user }));
vi.mock('./identitat.js', () => ({ capturaSessio: () => {
  const entrada = m.entrada;
  return () => { if (entrada !== m.entrada) throw new DOMException('La sessió ha canviat.', 'AbortError'); };
} }));
import { creaOrganitzacio, TIPUS_MARE } from './organizations.js';

const empresa = { name: 'Forn', slug: 'forn', kind: 'company' };
const mare = { id: 'O', kind: 'company', role: 'owner' };
const grup = { name: 'Colla', slug: 'colla', kind: 'group', parentOrganizationId: 'O' };
beforeEach(() => { m.user = { id: 'A' }; m.entrada = 0; m.createOrganization.mockReset().mockResolvedValue({ id: 'N' }); });

test('crea amb el port configurat, normalitza i no envia camps de privilegi', async () => {
  const config = { backendId: 'adaptador-alternatiu', tenantId: '00000000-0000-4000-8000-000000000000' };
  const resultat = await creaOrganitzacio({ ...empresa, name: ' Forn ', slug: ' FORN ', role: 'owner', created_by: 'B' }, config);
  expect(m.createOrganization).toHaveBeenCalledWith(empresa, config);
  expect(resultat).toEqual({ ...empresa, id: 'N' });
});

test.each(['owner', 'admin'])('un grup es crea sota una empresa amb rol %s', async (role) => {
  await creaOrganitzacio(grup, {}, [{ ...mare, role }]);
  expect(m.createOrganization).toHaveBeenCalledWith(grup, {});
});

/* F5 (ordre del Mestre, 261004; pla 2045, Marató 2230) · Una associació o un
   ajuntament que la persona administra també pot ser mare d'un grup, com ja
   admet private.can_create_group (2609272201_grups_mare.sql:26). */
test.each([
  ['entity', 'owner'], ['entity', 'admin'], ['city_hall', 'owner'], ['city_hall', 'admin'],
])('un grup es crea sota una organització %s amb rol %s', async (kind, role) => {
  await creaOrganitzacio(grup, {}, [{ ...mare, kind, role }]);
  expect(m.createOrganization).toHaveBeenCalledWith(grup, {});
});

/* Ordre del Mestre (261008, grup C) · «Un grup no té per què pertànyer a cap
   empresa»: sense mare (absent, buida o d'espais), el grup arriba al port
   sense la clau parentOrganizationId, i no cal administrar res. */
test.each([
  [{ name: 'Colla', slug: 'colla', kind: 'group' }],
  [{ ...grup, parentOrganizationId: '' }],
  [{ ...grup, parentOrganizationId: '   ' }],
  [{ ...grup, parentOrganizationId: undefined }],
])('un grup sense mare es crea i el payload no porta mare (%#)', async (dades) => {
  const resultat = await creaOrganitzacio(dades, {}, []);
  expect(m.createOrganization).toHaveBeenCalledWith({ name: 'Colla', slug: 'colla', kind: 'group' }, {});
  expect(m.createOrganization.mock.calls[0][0]).not.toHaveProperty('parentOrganizationId');
  expect(resultat).toEqual({ name: 'Colla', slug: 'colla', kind: 'group', id: 'N' });
});

test('un grup sense mare no confirma una resposta que en porte una', async () => {
  m.createOrganization.mockResolvedValue({ id: 'N', kind: 'group', parent_organization_id: 'O' });
  await expect(creaOrganitzacio({ name: 'Colla', slug: 'colla', kind: 'group' })).rejects.toThrow('organització incoherent');
  m.createOrganization.mockResolvedValue({ id: 'N', kind: 'group', parent_organization_id: null });
  await expect(creaOrganitzacio({ name: 'Colla', slug: 'colla', kind: 'group' })).resolves.toMatchObject({ id: 'N' });
});

/* F5 · poliment · Amb només les dades al títol, les cinc altes de `grup`
   es deien igual i una roja no deia quina mare l'havia provocada: el títol
   porta l'índex (%#) i també la llista d'organitzacions. */
test.each([
  [{ ...empresa, name: 'F' }, [], 'Nom o identificador'],
  [{ ...empresa, name: 'F'.repeat(121) }, [], 'Nom o identificador'],
  [{ ...empresa, slug: '' }, [], 'Nom o identificador'],
  [{ ...empresa, kind: 'city_hall' }, [], 'Tipus'],
  [{ ...empresa, parentOrganizationId: 'O' }, [], 'mare'],
  [grup, [], 'administrar'],
  [grup, [{ ...mare, role: 'member' }], 'administrar'],
  [grup, [{ ...mare, kind: 'group' }], 'administrar'],
  [grup, [{ ...mare, kind: 'persona' }], 'administrar'],
  [grup, [{ ...mare, kind: 'entity', role: 'member' }], 'administrar'],
  [{ ...empresa, description: 'a'.repeat(501) }, [], 'descripció'],
  [{ ...empresa, lema: 'a'.repeat(257) }, [], 'lema'],
  [{ ...empresa, lema: '🌾'.repeat(257) }, [], 'lema'],
])('una alta invàlida no arriba al port (%#: %j, mares %j)', async (dades, organitzacions, error) => {
  await expect(creaOrganitzacio(dades, {}, organitzacions)).rejects.toThrow(error);
  expect(m.createOrganization).not.toHaveBeenCalled();
});

/* T49 (ordre del Mestre, 260928) · L'entradilla (lema) admet 256 caràcters,
   comptats com char_length del CHECK: «🌾» és 1, encara que en JS en mesure 2. */
test.each([
  ['a'.repeat(256), 'a'.repeat(256)],
  ['🌾'.repeat(256), '🌾'.repeat(256)],
  [`  ${'b'.repeat(256)}  `, 'b'.repeat(256)],
])('un lema de fins a 256 caràcters arriba al port, retallat d’espais (%#)', async (lema, esperat) => {
  await creaOrganitzacio({ ...empresa, lema });
  expect(m.createOrganization).toHaveBeenCalledWith({ ...empresa, lema: esperat }, {});
});

test('sense sessió no intenta crear', async () => {
  m.user = null;
  await expect(creaOrganitzacio(empresa)).rejects.toThrow('iniciar sessió');
  expect(m.createOrganization).not.toHaveBeenCalled();
});

test.each([null, {}, { id: '' }, { id: ' ' }])('una resposta sense confirmació no és èxit (%j)', async (resposta) => {
  m.createOrganization.mockResolvedValue(resposta);
  await expect(creaOrganitzacio(empresa)).rejects.toThrow('no ha confirmat');
});

test.each([
  [empresa, { kind: 'group' }],
  [empresa, { kind: null }],
  [empresa, { slug: 'un-altre-forn' }],
  [empresa, { parent_organization_id: 'O' }],
  [grup, { parent_organization_id: 'una-altra-mare' }],
  [grup, { parentOrganizationId: null }],
  [grup, { parentOrganizationId: 'O', parent_organization_id: 'una-altra-mare' }],
  [empresa, { role: 'superadmin' }],
  [empresa, { role: null }],
  [empresa, { name: null }],
])('una resposta contradictòria no confirma l’alta (%j, %j)', async (dades, camps) => {
  m.createOrganization.mockResolvedValue({ id: 'N', ...camps });
  await expect(creaOrganitzacio(dades, {}, [mare])).rejects.toThrow('organització incoherent');
});

test('un reintent conserva el nom actual de l’entitat i el rol retornats pel backend', async () => {
  const resposta = { id: 'N', name: 'Forn del poble', slug: 'forn', kind: 'company', parent_organization_id: null, role: 'admin' };
  m.createOrganization.mockResolvedValue(resposta);
  expect(await creaOrganitzacio(empresa)).toEqual(resposta);
});

test.each(['owner', 'admin', 'member'])('un resultat parcial amb rol %s conserva els camps coneguts', async (role) => {
  m.createOrganization.mockResolvedValue({ id: 'N', role });
  expect(await creaOrganitzacio(empresa)).toEqual({ ...empresa, id: 'N', role });
});

test('un grup confirmat pot tornar l’empresa mare en format del port o de l’adaptador', async () => {
  for (const camp of ['parentOrganizationId', 'parent_organization_id']) {
    m.createOrganization.mockResolvedValue({ id: 'N', [camp]: 'O' });
    expect(await creaOrganitzacio(grup, {}, [mare])).toMatchObject({ id: 'N', kind: 'group', [camp]: 'O' });
  }
});

test('propaga errors del port per permetre un reintent', async () => {
  m.createOrganization.mockRejectedValueOnce(new Error('Sense xarxa'));
  await expect(creaOrganitzacio(empresa)).rejects.toThrow('Sense xarxa');
  await expect(creaOrganitzacio(empresa)).resolves.toMatchObject({ id: 'N' });
});

test('una resposta després de canviar sessió es descarta', async () => {
  let resol;
  m.createOrganization.mockReturnValue(new Promise((resolve) => { resol = resolve; }));
  const pendent = creaOrganitzacio(empresa);
  const comprova = expect(pendent).rejects.toMatchObject({ name: 'AbortError' });
  m.entrada++;
  resol({ id: 'N' });
  await comprova;
});

/* F5 · Guarda de deriva entre el domini i l'SQL. Si algú estreny o amplia els
   tipus de mare en una capa sense l'altra, cau. Es llig l'SQL (patró de
   limitsText.test.js): un mock que copiara la constant no detectaria res. */
const MIGRACIONS = resolve(process.cwd(), 'supabase/migrations');
const llig = (fitxer) => readFileSync(resolve(MIGRACIONS, fitxer), 'utf8');
const RE_CAN_CREATE_GROUP = /create\s+or\s+replace\s+function\s+private\.can_create_group\s*\([\s\S]*?\n\$\$;/i;
const kindsMare = (sql) => {
  const cos = RE_CAN_CREATE_GROUP.exec(sql)?.[0] ?? '';
  const llista = /parent\.kind\s+in\s*\(([^)]*)\)/i.exec(cos)?.[1] ?? '';
  return llista.split(',').map((kind) => kind.trim().replace(/^'|'$/g, '')).filter(Boolean).sort();
};

test('TIPUS_MARE és el conjunt de kinds de can_create_group (2609272201_grups_mare.sql)', () => {
  expect(kindsMare(llig('2609272201_grups_mare.sql'))).toEqual([...TIPUS_MARE].sort());
});

test('l’última migració que redefinix can_create_group diu el mateix que el client', () => {
  /* En ordre alfabètic, el mateix en què s'apliquen (supabase/README.md). */
  const ultima = readdirSync(MIGRACIONS).filter((fitxer) => fitxer.endsWith('.sql')).sort()
    .filter((fitxer) => RE_CAN_CREATE_GROUP.test(llig(fitxer))).at(-1);
  expect(ultima).toBeDefined();
  expect(kindsMare(llig(ultima))).toEqual([...TIPUS_MARE].sort());
});
