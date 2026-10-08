// @vitest-environment node
import path from 'node:path';
import { ESLint } from 'eslint';
import { beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ user: { id: 'A' }, configurat: true, request: vi.fn() }));
vi.mock('./runtime.js', () => ({ getCurrentUser: () => m.user, request: m.request,
  getResolvedConfig: (config = {}) => ({ tenantId: '00000000-0000-4000-8000-000000000000', supabaseUrl: 'https://poble.test',
    hasSupabaseConfig: m.configurat, runtimeDataMode: config.dataMode || 'remote' }) }));
import { desaMembreOrganitzacio, llevaMembreOrganitzacio, llistaMembresOrganitzacio } from './organizations.js';
import { reiniciaLocalPerfils } from '../localPerfils.js';
import { ENTITAT_PILOT_ID } from '../identitatsSeed.js';
import { AGENTS_MAP } from '../agentsSeed.js';

/* Ordre del Mestre (261008, grup C) · Els membres d'una organització
   (capacitat 'membresOrganitzacio') a l'adaptador Supabase: les tres RPC de
   2610081402, la validació abans de la xarxa, els codis SDP-ORGMEM en
   valencià, l'esquema absent i la delegació a localPerfils en seed i local.
   Fitxer propi per no trepitjar les proves de T43 i F1 en l'arbre compartit. */
const ORG = '5f2b7c1e-0a1b-4c2d-8e3f-9a0b1c2d3e4f';
const PERSONA = '6a3c8d2f-1b2c-4d3e-9f40-ab1c2d3e4f50';
const ALTRA_ORG = '7b4d9e30-2c3d-4e4f-a051-bc2d3e4f5a61';
const errorServidor = (status, cos) => Object.assign(new Error(`Supabase ${status}: ${cos}`), { status });
const filaPersona = { tipus: 'persona', membre_id: PERSONA, nom: 'Pepa Soler', avatar_url: 'https://img.test/p.webp',
  role: 'admin', created_at: '2026-10-08T10:00:00+00:00' };
const filaOrg = { tipus: 'organitzacio', membre_id: ALTRA_ORG, nom: 'El Rentonar', avatar_url: null,
  role: 'member', created_at: '2026-10-08T11:00:00+00:00' };

beforeEach(() => { m.user = { id: 'A' }; m.configurat = true; m.request.mockReset(); });

test('llista: crida membres_organitzacio amb l’UUID en minúscules i tradueix cada fila al Membre del contracte', async () => {
  m.request.mockResolvedValueOnce([filaPersona, filaOrg]);
  const signal = new AbortController().signal;
  expect(await llistaMembresOrganitzacio(ORG.toUpperCase(), { signal })).toEqual([
    { tipus: 'persona', id: PERSONA, nom: 'Pepa Soler', avatar: 'https://img.test/p.webp', rol: 'admin', desDe: '2026-10-08T10:00:00+00:00' },
    { tipus: 'organitzacio', id: ALTRA_ORG, nom: 'El Rentonar', avatar: '', rol: 'member', desDe: '2026-10-08T11:00:00+00:00' }
  ]);
  const [ruta, , opcions] = m.request.mock.calls[0];
  expect(ruta).toBe('/rest/v1/rpc/membres_organitzacio');
  expect(opcions).toMatchObject({ method: 'POST', body: { p_organization_id: ORG }, signal });
});

test('llista: una fila sense tipus conegut o sense id no ix; un rol desconegut es mostra com a member', async () => {
  m.request.mockResolvedValueOnce([
    { ...filaPersona, role: 'superadmin' },
    { ...filaPersona, tipus: 'ia' },
    { ...filaPersona, membre_id: '' },
    null,
    { ...filaOrg, created_at: '', nom: 7 }
  ]);
  expect(await llistaMembresOrganitzacio(ORG)).toEqual([
    expect.objectContaining({ tipus: 'persona', rol: 'member' }),
    { tipus: 'organitzacio', id: ALTRA_ORG, nom: '', avatar: '', rol: 'member', desDe: null }
  ]);
  m.request.mockResolvedValueOnce(null);
  expect(await llistaMembresOrganitzacio(ORG)).toEqual([]);
});

test('sense sessió, sense servidor o amb un id que no és UUID, cap petició', async () => {
  await expect(llistaMembresOrganitzacio('socdepoble')).rejects.toMatchObject({ code: 'SDP-ORGMEM-002' });
  await expect(desaMembreOrganitzacio(ORG, { tipus: 'persona', id: 'pepa' })).rejects.toMatchObject({ code: 'SDP-ORGMEM-003' });
  await expect(desaMembreOrganitzacio(ORG, { tipus: 'organitzacio', id: 'rentonar' })).rejects.toMatchObject({ code: 'SDP-ORGMEM-007' });
  await expect(llevaMembreOrganitzacio('rentonar', { tipus: 'persona', id: PERSONA })).rejects.toMatchObject({ code: 'SDP-ORGMEM-002' });
  m.configurat = false;
  await expect(llistaMembresOrganitzacio(ORG)).rejects.toMatchObject({ code: 'NO-DISPONIBLE' });
  m.user = null;
  for (const crida of [() => llistaMembresOrganitzacio(ORG), () => desaMembreOrganitzacio(ORG, { tipus: 'persona', id: PERSONA }),
    () => llevaMembreOrganitzacio(ORG, { tipus: 'persona', id: PERSONA })]) {
    await expect(crida()).rejects.toMatchObject({ code: 'SDP-ORGMEM-000', message: 'Cal iniciar sessió.' });
  }
  expect(m.request).not.toHaveBeenCalled();
});

test('desa: el tipus i el rol es validen abans de la xarxa (mai owner; una organització, només member)', async () => {
  for (const dades of [
    {}, { tipus: 'persona' }, { tipus: 'ia', id: PERSONA }, { tipus: 'persona', id: PERSONA, rol: 'owner' },
    { tipus: 'persona', id: PERSONA, rol: 'superadmin' }, { tipus: 'organitzacio', id: ALTRA_ORG, rol: 'admin' }
  ]) {
    await expect(desaMembreOrganitzacio(ORG, dades), JSON.stringify(dades)).rejects
      .toMatchObject({ code: 'SDP-ORGMEM-001', message: 'El tipus de membre o el rol no és vàlid.' });
  }
  await expect(llevaMembreOrganitzacio(ORG, { tipus: 'grup', id: ALTRA_ORG })).rejects.toMatchObject({ code: 'SDP-ORGMEM-001' });
  expect(m.request).not.toHaveBeenCalled();
});

test('desa: crida desa_membre_organitzacio amb el rol (member per defecte) i torna el Membre confirmat', async () => {
  m.request.mockResolvedValueOnce([{ ...filaPersona, role: 'member' }]);
  expect(await desaMembreOrganitzacio(ORG, { tipus: 'persona', id: PERSONA.toUpperCase() }))
    .toMatchObject({ tipus: 'persona', id: PERSONA, rol: 'member' });
  expect(m.request.mock.calls[0][0]).toBe('/rest/v1/rpc/desa_membre_organitzacio');
  expect(m.request.mock.calls[0][2].body).toEqual({ p_organization_id: ORG, p_membre_id: PERSONA, p_tipus: 'persona', p_role: 'member' });
  m.request.mockResolvedValueOnce([filaPersona]);
  await desaMembreOrganitzacio(ORG, { tipus: 'persona', id: PERSONA, rol: 'admin' });
  expect(m.request.mock.calls[1][2].body.p_role).toBe('admin');
  m.request.mockResolvedValueOnce(filaOrg);
  expect(await desaMembreOrganitzacio(ORG, { tipus: 'organitzacio', id: ALTRA_ORG }))
    .toMatchObject({ tipus: 'organitzacio', id: ALTRA_ORG, rol: 'member' });
  expect(m.request.mock.calls[2][2].body).toEqual({ p_organization_id: ORG, p_membre_id: ALTRA_ORG, p_tipus: 'organitzacio', p_role: 'member' });
});

test('desa: sense la fila del mateix membre, no s’anuncia cap èxit', async () => {
  for (const resposta of [[], null, [{ ...filaPersona, membre_id: ALTRA_ORG }], [{ ...filaPersona, tipus: 'organitzacio' }]]) {
    m.request.mockResolvedValueOnce(resposta);
    await expect(desaMembreOrganitzacio(ORG, { tipus: 'persona', id: PERSONA }), JSON.stringify(resposta))
      .rejects.toThrow('no ha confirmat el membre');
  }
});

test('lleva: el booleà de la RPC és { llevat }; el cos no porta rol', async () => {
  m.request.mockResolvedValueOnce(true).mockResolvedValueOnce(false).mockResolvedValueOnce([true]).mockResolvedValueOnce(null);
  expect(await llevaMembreOrganitzacio(ORG, { tipus: 'persona', id: PERSONA })).toEqual({ llevat: true });
  expect(await llevaMembreOrganitzacio(ORG, { tipus: 'persona', id: PERSONA })).toEqual({ llevat: false });
  expect(await llevaMembreOrganitzacio(ORG, { tipus: 'organitzacio', id: ALTRA_ORG })).toEqual({ llevat: true });
  expect(await llevaMembreOrganitzacio(ORG, { tipus: 'organitzacio', id: ALTRA_ORG })).toEqual({ llevat: false });
  expect(m.request.mock.calls[0][0]).toBe('/rest/v1/rpc/lleva_membre_organitzacio');
  expect(m.request.mock.calls[0][2].body).toEqual({ p_organization_id: ORG, p_membre_id: PERSONA, p_tipus: 'persona' });
  expect(m.request.mock.calls[2][2].body).toEqual({ p_organization_id: ORG, p_membre_id: ALTRA_ORG, p_tipus: 'organitzacio' });
});

test('els errors del servidor es llegixen pel prefix SDP i es diuen en valencià, sense «Supabase»', async () => {
  const casos = [
    [errorServidor(403, '{"code":"42501","message":"SDP-ORGMEM-006: només la propietària nomena, degrada o lleva administradores."}'),
      'SDP-ORGMEM-006', 'Només la propietària nomena, degrada o lleva administradores.'],
    [errorServidor(403, '{"code":"42501","message":"SDP-ORGMEM-005: la propietària no es canvia ni es lleva."}'),
      'SDP-ORGMEM-005', 'La propietària no es canvia ni es lleva.'],
    [errorServidor(400, '{"code":"22023","message":"SDP-ORGMEM-003: la persona no és del poble de l\'organització o ha demanat la baixa."}'),
      'SDP-ORGMEM-003', 'Esta persona no és del poble de l’organització o ha demanat la baixa.'],
    [errorServidor(404, '{"code":"PGRST202","message":"Could not find the function public.desa_membre_organitzacio"}'),
      'NO-DISPONIBLE', 'El servidor d’este poble encara no gestiona els membres de les organitzacions.']
  ];
  for (const [error, code, message] of casos) {
    m.request.mockRejectedValueOnce(error);
    const fallada = await desaMembreOrganitzacio(ORG, { tipus: 'persona', id: PERSONA, rol: 'admin' }).catch((e) => e);
    expect(fallada).toMatchObject({ code, message });
    expect(fallada.cause).toBe(error);
    expect(fallada.message).not.toMatch(/Supabase|PGRST|Could not/);
  }
  m.request.mockRejectedValueOnce(errorServidor(404, '{"code":"PGRST202"}'));
  await expect(llistaMembresOrganitzacio(ORG)).rejects.toMatchObject({ code: 'NO-DISPONIBLE' });
  m.request.mockRejectedValueOnce(errorServidor(403, '{"message":"SDP-ORGMEM-002: només qui administra"}'));
  await expect(llevaMembreOrganitzacio(ORG, { tipus: 'persona', id: PERSONA })).rejects.toMatchObject({ code: 'SDP-ORGMEM-002' });
});

test('la cancel·lació i la xarxa passen tal qual: la interfície ja les sap dir', async () => {
  const cancel = Object.assign(new Error('Cancel·lat'), { name: 'AbortError' });
  const xarxa = Object.assign(new Error('Error de xarxa: No es pot connectar al servidor.'), { status: 0 });
  for (const error of [cancel, xarxa]) {
    m.request.mockRejectedValueOnce(error);
    await expect(llistaMembresOrganitzacio(ORG)).rejects.toBe(error);
  }
});

/* En seed i local, el servidor és localPerfils: les mateixes formes i regles,
   cap petició. Qui té sessió és la propietària de l'entitat pilot (D1) i la
   persona pilot del padró ('0001') es pot fer membre. */
test.each(['seed', 'local'])('en %s tot delega a localPerfils, sense cap petició', async (dataMode) => {
  reiniciaLocalPerfils();
  m.user = { id: 'jo-local', user_metadata: { full_name: 'Pep de la llavor' } };
  const config = { dataMode };
  expect(await llistaMembresOrganitzacio(ENTITAT_PILOT_ID, config)).toEqual([
    expect.objectContaining({ tipus: 'persona', id: 'jo-local', nom: 'Pep de la llavor', rol: 'owner' })
  ]);
  expect(await desaMembreOrganitzacio(ENTITAT_PILOT_ID, { tipus: 'persona', id: AGENTS_MAP.JAVI.id }, config))
    .toMatchObject({ tipus: 'persona', id: AGENTS_MAP.JAVI.id, rol: 'member' });
  expect(await desaMembreOrganitzacio(ENTITAT_PILOT_ID, { tipus: 'persona', id: AGENTS_MAP.JAVI.id, rol: 'admin' }, config))
    .toMatchObject({ rol: 'admin' });
  await expect(desaMembreOrganitzacio(ENTITAT_PILOT_ID, { tipus: 'organitzacio', id: ENTITAT_PILOT_ID }, config))
    .rejects.toMatchObject({ code: 'SDP-ORGMEM-007' });
  await expect(llistaMembresOrganitzacio('cap-organitzacio', config)).rejects.toMatchObject({ code: 'SDP-ORGMEM-002' });
  expect(await llevaMembreOrganitzacio(ENTITAT_PILOT_ID, { tipus: 'persona', id: AGENTS_MAP.JAVI.id }, config)).toEqual({ llevat: true });
  expect(await llevaMembreOrganitzacio(ENTITAT_PILOT_ID, { tipus: 'persona', id: AGENTS_MAP.JAVI.id }, config)).toEqual({ llevat: false });
  await expect(llevaMembreOrganitzacio(ENTITAT_PILOT_ID, { tipus: 'persona', id: 'jo-local' }, config))
    .rejects.toMatchObject({ code: 'SDP-ORGMEM-005' });
  expect(m.request).not.toHaveBeenCalled();
  reiniciaLocalPerfils();
});

/* Qualitat · ESLint amb la configuració del projecte i zero missatges
   (l'equivalent de --max-warnings=0) als fitxers de dades del grup C que cap
   altre cens de qualitat no vigila (src/data/qualitat.test.js i
   src/data/conformitat/qualitat.test.js ja hi tenen contracte.js,
   backendPort.js, kit.js i els seus tests). */
const CENS_GRUP_C = Object.freeze([
  'src/data/supabase/organizations.js',
  'src/data/supabase/organizations.membres.test.js',
  'src/data/supabase/organizations.grup.test.js',
  'src/data/supabase/perfils.js',
  'src/data/supabase/perfils.test.js',
  'src/data/localPerfils.js',
  'src/data/localPerfils.test.js',
  'src/data/organizations.js',
  'src/data/organizations.test.js'
]);

test('qualitat · ESLint sense cap missatge als fitxers de dades del grup C', async () => {
  const arrel = process.cwd();
  const eslint = new ESLint({ cwd: arrel });
  const resultats = await eslint.lintFiles(CENS_GRUP_C.map((fitxer) => path.join(arrel, fitxer)));
  const missatges = resultats.flatMap((r) => r.messages.map((mis) => `${path.relative(arrel, r.filePath)}:${mis.line} [${mis.ruleId}] ${mis.message}`));
  expect(resultats).toHaveLength(CENS_GRUP_C.length);
  expect(missatges).toEqual([]);
  // Sonda: la configuració del projecte és activa.
  const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(arrel, 'src/data/supabase/sonda.js') });
  expect(sonda.messages.map((mis) => mis.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
}, 120000);
