import { beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ user: { id: 'A' }, request: vi.fn() }));
vi.mock('./runtime.js', () => ({ getCurrentUser: () => m.user, request: m.request,
  getResolvedConfig: (config = {}) => ({ tenantId: '00000000-0000-4000-8000-000000000000',
    supabaseUrl: 'https://poble.test', hasSupabaseConfig: true, runtimeDataMode: config.dataMode || 'remote' }) }));
import { createOrganization } from './organizations.js';

/* Revisió adversarial del Gauntlet 261016 (encàrrec C; troballes «Crear una
   organització en remot deixa la fila sense poble i un error que promet un
   reintent que mai no funciona» i «Crear una organització amb un slug que ja
   administres sobreescriu en silenci el poble de l'existent») · create_organization
   és idempotent: si la persona ja administra una organització amb eixe slug,
   la torna tal qual. El poble es desa amb un PATCH a part, i només sobre la
   fila que ha creat ESTA alta (o el seu reintent): una organització que ja
   existia no es toca. Si el PATCH falla, el missatge diu què ha passat i
   només promet el reintent quan el reintent el pot desar de veres.
   Fitxer propi: la memòria d'altes i la de columnes absents són del mòdul, i
   ací no trepitgen les proves de F1 (organizations.test.js). Cada prova fa
   servir el seu id. */
const POBLE = '00000000-0000-4000-8000-000000000000';
const NOM_POBLE = 'La Torre de les Maçanes';
const FORN = Object.freeze({ kind: 'company', name: 'Forn', slug: 'forn', town_name: NOM_POBLE });
const xarxa = () => Object.assign(new Error('Error de xarxa: No es pot connectar al servidor.'), { status: 0 });
const errorServidor = (status, cos) => Object.assign(new Error(`Supabase ${status}: ${cos}`), { status });

/* Un servidor simulat per ruta: la lectura prèvia (GET organizations), la RPC
   i el PATCH. Torna la llista dels cossos dels PATCH que han arribat. */
function servidor({ previa = () => [], creada, pegat }) {
  const pegats = [];
  m.request.mockImplementation(async (ruta, _config, opcions = {}) => {
    if (ruta === '/rest/v1/rpc/create_organization') return creada();
    if (ruta.startsWith('/rest/v1/organizations?') && opcions.method === 'PATCH') {
      pegats.push(opcions.body);
      return pegat ? pegat(opcions.body) : [{ ...opcions.body }];
    }
    if (ruta.startsWith('/rest/v1/organizations?') && (opcions.method ?? 'GET') === 'GET') return previa(ruta);
    throw new Error(`Consulta inesperada: ${ruta}`);
  });
  return pegats;
}

beforeEach(() => { m.user = { id: 'A' }; m.request.mockReset(); });

test('una alta nova: abans de la RPC es mira si la persona ja té una organització amb eixe slug en este poble; després, el poble a la fila nova', async () => {
  const pegats = servidor({ creada: () => ({ id: 'O1', slug: 'forn', kind: 'company' }), pegat: () => [{ id: 'O1', town_name: NOM_POBLE }] });
  expect(await createOrganization(FORN)).toEqual({ id: 'O1', slug: 'forn', kind: 'company', town_name: NOM_POBLE });
  expect(pegats).toEqual([{ town_name: NOM_POBLE }]);
  const [previa, rpc, patch] = m.request.mock.calls;
  const url = new URL(previa[0], 'https://poble.test');
  expect([url.pathname, url.searchParams.get('slug'), url.searchParams.get('tenant_id'), url.searchParams.get('limit')])
    .toEqual(['/rest/v1/organizations', 'eq.forn', `eq.${POBLE}`, '1']);
  expect(url.searchParams.get('select').split(',')).toEqual(['id', 'town_name']);
  expect(rpc[0]).toBe('/rest/v1/rpc/create_organization');
  expect(new URL(patch[0], 'https://poble.test').searchParams.get('id')).toBe('eq.O1');
});

test('una organització que ja administraves, d’un altre poble: cap PATCH, i l’error diu quina és i que no s’ha tocat', async () => {
  const pegats = servidor({ previa: () => [{ id: 'O2', town_name: 'Penàguila' }], creada: () => ({ id: 'O2', slug: 'forn', kind: 'company' }) });
  const fallada = await createOrganization(FORN).catch((e) => e);
  expect(pegats).toEqual([]);
  expect(fallada).toMatchObject({ code: 'JA-EXISTIX' });
  expect(fallada.message).toContain('«forn»');
  expect(fallada.message).toContain('Penàguila');
  expect(fallada.message).not.toMatch(/PGRST|Supabase/);
});

test('una organització que ja administraves, sense poble: tampoc no se li posa el de l’alta (podria ser d’un altre poble)', async () => {
  const pegats = servidor({ previa: () => [{ id: 'O3', town_name: null }], creada: () => ({ id: 'O3', slug: 'forn', kind: 'company' }) });
  const fallada = await createOrganization(FORN).catch((e) => e);
  expect(pegats).toEqual([]);
  expect(fallada).toMatchObject({ code: 'JA-EXISTIX' });
  expect(fallada.message).toContain('«forn»');
});

test('una organització que ja administraves, del mateix poble: el reintent idempotent de sempre, sense cap PATCH', async () => {
  const pegats = servidor({ previa: () => [{ id: 'O4', town_name: NOM_POBLE }], creada: () => ({ id: 'O4', slug: 'forn', kind: 'company' }) });
  expect(await createOrganization(FORN)).toEqual({ id: 'O4', slug: 'forn', kind: 'company', town_name: NOM_POBLE });
  expect(pegats).toEqual([]);
});

test('si el PATCH falla per un tall, el missatge ho diu i el reintent de la mateixa alta completa el poble de veres', async () => {
  let existix = false;
  let desat = null;
  let talla = true;
  const pegats = servidor({
    previa: () => (existix ? [{ id: 'O5', town_name: desat }] : []),
    creada: () => { existix = true; return { id: 'O5', slug: 'forn', kind: 'company' }; },
    pegat: (cos) => {
      if (talla) { talla = false; throw xarxa(); }
      desat = cos.town_name;
      return [{ id: 'O5', town_name: desat }];
    }
  });
  const primera = await createOrganization(FORN).catch((e) => e);
  expect(primera).toMatchObject({ code: 'POBLE-NO-DESAT' });
  expect(primera.message).toMatch(/s’ha creat/);
  expect(primera.message).toMatch(/Torna a prémer «Crear»/);
  expect(primera.message).toMatch(/mateixa organització/);
  /* El reintent: la RPC torna la mateixa fila (ara ja existix, sense poble), i és la d'esta alta. */
  expect(await createOrganization(FORN)).toEqual({ id: 'O5', slug: 'forn', kind: 'company', town_name: NOM_POBLE });
  expect(pegats).toEqual([{ town_name: NOM_POBLE }, { town_name: NOM_POBLE }]);
  expect(desat).toBe(NOM_POBLE);
  /* Completada, ja no és cap alta pendent: una altra alta igual és el reintent idempotent, sense PATCH. */
  expect(await createOrganization(FORN)).toMatchObject({ id: 'O5', town_name: NOM_POBLE });
  expect(pegats).toHaveLength(2);
});

test('si el servidor rebutja el poble (permís), el missatge ho diu sense prometre que el reintent el desarà', async () => {
  servidor({
    creada: () => ({ id: 'O6', slug: 'forn', kind: 'company' }),
    pegat: () => { throw errorServidor(403, '{"code":"42501","message":"permission denied for table organizations"}'); }
  });
  const fallada = await createOrganization(FORN).catch((e) => e);
  expect(fallada).toMatchObject({ code: 'POBLE-NO-DESAT' });
  expect(fallada.message).toMatch(/s’ha creat sense poble/);
  expect(fallada.message).toMatch(/no ha acceptat/);
  expect(fallada.message).not.toMatch(/es desarà/);
  expect(fallada.message).not.toMatch(/PGRST|Supabase|permission/i);
});

/* Va l'última: el mòdul recorda la columna absent del select la resta del fitxer. */
test('servidor sense 2610081401: la lectura prèvia es refà sense town_name, l’alta es crea, i el missatge diu que falta la migració sense prometre cap reintent', async () => {
  const pegats = servidor({
    previa: (ruta) => {
      if (new URL(ruta, 'https://poble.test').searchParams.get('select').includes('town_name')) {
        throw errorServidor(400, '{"code":"42703","message":"column organizations.town_name does not exist"}');
      }
      return [];
    },
    creada: () => ({ id: 'O7', slug: 'forn', kind: 'company' }),
    pegat: () => { throw errorServidor(400, '{"code":"PGRST204","message":"Could not find the \'town_name\' column of \'organizations\' in the schema cache"}'); }
  });
  const fallada = await createOrganization(FORN).catch((e) => e);
  expect(fallada).toMatchObject({ code: 'POBLE-NO-DESAT' });
  expect(fallada.message).toMatch(/s’ha creat sense poble/);
  expect(fallada.message).toMatch(/migració/);
  expect(fallada.message).not.toMatch(/Torna|es desarà/);
  expect(fallada.message).not.toMatch(/PGRST|Supabase|Could not/i);
  expect(pegats).toEqual([{ town_name: NOM_POBLE }]);
  const selects = m.request.mock.calls.map(([ruta]) => ruta).filter((ruta) => ruta.startsWith('/rest/v1/organizations?select='))
    .map((ruta) => new URL(ruta, 'https://poble.test').searchParams.get('select'));
  expect(selects).toEqual(['id,town_name', 'id']);
});
