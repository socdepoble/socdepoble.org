// @vitest-environment node
import { beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ user: { id: 'a1b2c3d4-0000-4000-8000-00000000000a' }, configurat: true, request: vi.fn() }));
/* La resta de runtime.js, la real: la darrera prova importa l'adaptador sencer (index.js). */
vi.mock('./runtime.js', async (original) => ({
  ...(await original()),
  getCurrentUser: () => m.user,
  request: m.request,
  getResolvedConfig: (config = {}) => ({ tenantId: '00000000-0000-4000-8000-000000000000', supabaseUrl: 'https://poble.test',
    hasSupabaseConfig: m.configurat, runtimeDataMode: config.dataMode || 'remote' })
}));
import { transfereixPropietatOrganitzacio } from './organizations.js';
import { PERSONES_SEED, localPerfils, reiniciaLocalPerfils } from '../localPerfils.js';
import { ENTITAT_PILOT_ID } from '../identitatsSeed.js';
import { setBackendImplementation, teCapacitat, validaBackendImplementation } from '../backendPort.js';

/* IDEA-24 (marató 261101_2143, B4) · La transferència atòmica de la propietat
   (capacitat 'transferenciaPropietat') a l'adaptador Supabase: la RPC de
   2610311500, la validació abans de la xarxa, la confirmació d'una sola fila,
   els codis SDP-ORGMEM, la RPC absent i la delegació a localPerfils en seed i
   local. */
const JO = 'a1b2c3d4-0000-4000-8000-00000000000a';
const ORG = '5f2b7c1e-0a1b-4c2d-8e3f-9a0b1c2d3e4f';
const PEPA = '6a3c8d2f-1b2c-4d3e-9f40-ab1c2d3e4f50';
const PEPA_PERSONA = Object.freeze({ tipus: 'persona', id: PEPA });
const errorServidor = (status, cos) => Object.assign(new Error(`Supabase ${status}: ${cos}`), { status });
const filaBona = () => ({ organization_id: ORG, antic_owner_id: JO, nou_owner_id: PEPA });

beforeEach(() => { m.user = { id: JO }; m.configurat = true; m.request.mockReset(); reiniciaLocalPerfils(); });

test('crida transfereix_propietat_organitzacio una sola vegada, amb els UUID en minúscules i el cos exacte, i torna la transferència confirmada', async () => {
  m.request.mockResolvedValueOnce([filaBona()]);
  const signal = new AbortController().signal;
  expect(await transfereixPropietatOrganitzacio(ORG.toUpperCase(), { tipus: 'persona', id: ` ${PEPA.toUpperCase()} ` }, { signal }))
    .toEqual({ organizationId: ORG, anticOwnerId: JO, nouOwnerId: PEPA });
  expect(m.request).toHaveBeenCalledTimes(1);
  const [ruta, , opcions] = m.request.mock.calls[0];
  expect(ruta).toBe('/rest/v1/rpc/transfereix_propietat_organitzacio');
  expect(opcions).toMatchObject({ method: 'POST', signal, body: { p_organization_id: ORG, p_nou_owner_id: PEPA } });
  expect(Object.keys(opcions.body).sort()).toEqual(['p_nou_owner_id', 'p_organization_id']);
});

test('la fila es compara sense majúscules; la sessió en majúscules torna l’antiga propietària en minúscules', async () => {
  m.user = { id: JO.toUpperCase() };
  m.request.mockResolvedValueOnce([{ organization_id: ORG.toUpperCase(), antic_owner_id: JO, nou_owner_id: PEPA.toUpperCase() }]);
  expect(await transfereixPropietatOrganitzacio(ORG, PEPA_PERSONA)).toEqual({ organizationId: ORG, anticOwnerId: JO, nouOwnerId: PEPA });
  // La fila sola (sense llista) també confirma.
  m.request.mockResolvedValueOnce(filaBona());
  expect(await transfereixPropietatOrganitzacio(ORG, PEPA_PERSONA)).toEqual({ organizationId: ORG, anticOwnerId: JO, nouOwnerId: PEPA });
});

test('sense exactament una fila que confirme els dos rols, cap èxit', async () => {
  const respostes = [
    null, undefined, true, 'ok', [], [null], [filaBona(), filaBona()],
    [{ ...filaBona(), nou_owner_id: JO }],
    [{ ...filaBona(), antic_owner_id: PEPA }],
    [{ ...filaBona(), antic_owner_id: 'altre' }],
    [{ ...filaBona(), organization_id: '7b4d9e30-2c3d-4e4f-a051-bc2d3e4f5a61' }],
    [{ organization_id: ORG, nou_owner_id: PEPA }]
  ];
  for (const resposta of respostes) {
    m.request.mockResolvedValueOnce(resposta);
    await expect(transfereixPropietatOrganitzacio(ORG, PEPA_PERSONA), JSON.stringify(resposta) ?? String(resposta))
      .rejects.toThrow('El servidor no ha confirmat la transferència. Torna a carregar la llista.');
  }
  expect(m.request).toHaveBeenCalledTimes(respostes.length);
});

test('abans de la xarxa: sessió, tipus, servidor, ids i una mateixa', async () => {
  await expect(transfereixPropietatOrganitzacio(ORG, { tipus: 'organitzacio', id: PEPA })).rejects.toMatchObject({ code: 'SDP-ORGMEM-001' });
  await expect(transfereixPropietatOrganitzacio(ORG, { tipus: 'persona', id: '' })).rejects.toMatchObject({ code: 'SDP-ORGMEM-001' });
  await expect(transfereixPropietatOrganitzacio(ORG, PEPA)).rejects.toMatchObject({ code: 'SDP-ORGMEM-001' });
  await expect(transfereixPropietatOrganitzacio(ORG)).rejects.toMatchObject({ code: 'SDP-ORGMEM-001' });
  await expect(transfereixPropietatOrganitzacio('forn', PEPA_PERSONA)).rejects.toMatchObject({ code: 'SDP-ORGMEM-002' });
  await expect(transfereixPropietatOrganitzacio(ORG, { tipus: 'persona', id: 'pepa' })).rejects.toMatchObject({ code: 'SDP-ORGMEM-003' });
  await expect(transfereixPropietatOrganitzacio(ORG, { tipus: 'persona', id: JO.toUpperCase() })).rejects.toMatchObject({ code: 'SDP-ORGMEM-004' });
  m.configurat = false;
  await expect(transfereixPropietatOrganitzacio(ORG, PEPA_PERSONA)).rejects.toMatchObject({ code: 'NO-DISPONIBLE' });
  m.user = null;
  await expect(transfereixPropietatOrganitzacio(ORG, PEPA_PERSONA)).rejects.toMatchObject({ code: 'SDP-ORGMEM-000' });
  expect(m.request).not.toHaveBeenCalled();
});

test('els codis del servidor es llegixen pel prefix SDP, amb el text del contracte i mai el de Supabase', async () => {
  for (const codi of ['SDP-ORGMEM-000', 'SDP-ORGMEM-001', 'SDP-ORGMEM-002', 'SDP-ORGMEM-003', 'SDP-ORGMEM-004', 'SDP-ORGMEM-006']) {
    m.request.mockRejectedValueOnce(errorServidor(400, `{"message":"${codi}: text del servidor"}`));
    const error = await transfereixPropietatOrganitzacio(ORG, PEPA_PERSONA).catch((e) => e);
    expect(error.code, codi).toBe(codi);
    expect(error.message, codi).not.toMatch(/Supabase|text del servidor/);
  }
  /* Un codi SDP amb un 404 (un poble d'una altra base) no és «RPC absent». */
  m.request.mockRejectedValueOnce(errorServidor(404, '{"message":"SDP-ORGMEM-002: no"}'));
  await expect(transfereixPropietatOrganitzacio(ORG, PEPA_PERSONA)).rejects.toMatchObject({ code: 'SDP-ORGMEM-002' });
});

test('la RPC absent (404 o PGRST202) és NO-DISPONIBLE amb la frase de la transferència; la resta passa tal qual', async () => {
  const frase = 'El servidor d’este poble encara no sap transferir la propietat de les organitzacions.';
  m.request.mockRejectedValueOnce(errorServidor(404, '{"code":"PGRST202","message":"Could not find the function"}'));
  await expect(transfereixPropietatOrganitzacio(ORG, PEPA_PERSONA)).rejects.toMatchObject({ code: 'NO-DISPONIBLE', message: frase });
  const senseEstat = errorServidor(undefined, '{"code":"PGRST202"}');
  m.request.mockRejectedValueOnce(senseEstat);
  const error = await transfereixPropietatOrganitzacio(ORG, PEPA_PERSONA).catch((e) => e);
  expect(error).toMatchObject({ code: 'NO-DISPONIBLE', message: frase });
  expect(error.cause).toBe(senseEstat);
  /* Un error de servidor sense codi ni esquema absent no es disfressa. */
  const caigut = errorServidor(500, 'internal');
  m.request.mockRejectedValueOnce(caigut);
  await expect(transfereixPropietatOrganitzacio(ORG, PEPA_PERSONA)).rejects.toBe(caigut);
  const tall = new DOMException('Operació cancel·lada.', 'AbortError');
  m.request.mockRejectedValueOnce(tall);
  await expect(transfereixPropietatOrganitzacio(ORG, PEPA_PERSONA)).rejects.toBe(tall);
});

test.each(['seed', 'local'])('en %s delega a localPerfils, sense cap petició: una organització que no existix, 002', async (dataMode) => {
  await expect(transfereixPropietatOrganitzacio('no-existix', { tipus: 'persona', id: 'pepa' }, { dataMode }))
    .rejects.toMatchObject({ code: 'SDP-ORGMEM-002' });
  // La regla d'entrada és la mateixa abans de delegar.
  await expect(transfereixPropietatOrganitzacio(ENTITAT_PILOT_ID, { tipus: 'organitzacio', id: 'rentonar' }, { dataMode }))
    .rejects.toMatchObject({ code: 'SDP-ORGMEM-001' });
  expect(m.request).not.toHaveBeenCalled();
});

test('en seed, la propietària la cedix de veres: ella passa a admin, la destinatària a owner, una sola propietària i cap petició', async () => {
  const desti = PERSONES_SEED[0].id;
  localPerfils.desaMembreOrganitzacio(ENTITAT_PILOT_ID, { tipus: 'persona', id: desti, rol: 'member' }, m.user);
  expect(await transfereixPropietatOrganitzacio(ENTITAT_PILOT_ID, { tipus: 'persona', id: desti }, { dataMode: 'seed' }))
    .toEqual({ organizationId: ENTITAT_PILOT_ID, anticOwnerId: JO, nouOwnerId: desti });
  const rols = localPerfils.llistaMembresOrganitzacio(ENTITAT_PILOT_ID, m.user).map((membre) => [membre.id, membre.rol]);
  expect(Object.fromEntries(rols)).toMatchObject({ [JO]: 'admin', [desti]: 'owner' });
  expect(rols.filter(([, rol]) => rol === 'owner')).toHaveLength(1);
  // Ja no n'és la propietària: una segona cessió és 006.
  await expect(transfereixPropietatOrganitzacio(ENTITAT_PILOT_ID, { tipus: 'persona', id: desti }, { dataMode: 'seed' }))
    .rejects.toMatchObject({ code: 'SDP-ORGMEM-006' });
  expect(m.request).not.toHaveBeenCalled();
});

test('l’adaptador Supabase sencer (index.js) la porta: valida i té la capacitat transferenciaPropietat', async () => {
  const supabase = await import('./index.js');
  expect(supabase.transfereixPropietatOrganitzacio).toBe(transfereixPropietatOrganitzacio);
  expect(() => validaBackendImplementation({ ...supabase })).not.toThrow();
  setBackendImplementation({ ...supabase });
  expect(teCapacitat('transferenciaPropietat')).toBe(true);
  expect(teCapacitat('membresOrganitzacio')).toBe(true);
});
