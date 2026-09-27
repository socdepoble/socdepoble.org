import { beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ user: { id: 'A' }, entrada: 0, createOrganization: vi.fn() }));
vi.mock('./backendPort.js', () => ({ createOrganization: m.createOrganization, getCurrentUser: () => m.user }));
vi.mock('./identitat.js', () => ({ capturaSessio: () => {
  const entrada = m.entrada;
  return () => { if (entrada !== m.entrada) throw new DOMException('La sessió ha canviat.', 'AbortError'); };
} }));
import { creaOrganitzacio } from './organizations.js';

const empresa = { name: 'Forn', slug: 'forn', kind: 'company' };
const mare = { id: 'O', kind: 'company', role: 'owner' };
const grup = { name: 'Colla', slug: 'colla', kind: 'group', parentOrganizationId: 'O' };
beforeEach(() => { m.user = { id: 'A' }; m.entrada = 0; m.createOrganization.mockReset().mockResolvedValue({ id: 'N' }); });

test('crea amb el port configurat, normalitza i no envia camps de privilegi', async () => {
  const config = { backendId: 'adaptador-alternatiu', tenantId: 'T' };
  const resultat = await creaOrganitzacio({ ...empresa, name: ' Forn ', slug: ' FORN ', role: 'owner', created_by: 'B' }, config);
  expect(m.createOrganization).toHaveBeenCalledWith(empresa, config);
  expect(resultat).toEqual({ ...empresa, id: 'N' });
});

test.each(['owner', 'admin'])('un grup es crea sota una empresa amb rol %s', async (role) => {
  await creaOrganitzacio(grup, {}, [{ ...mare, role }]);
  expect(m.createOrganization).toHaveBeenCalledWith(grup, {});
});

test.each([
  [{ ...empresa, name: 'F' }, [], 'Nom o identificador'],
  [{ ...empresa, name: 'F'.repeat(121) }, [], 'Nom o identificador'],
  [{ ...empresa, slug: '' }, [], 'Nom o identificador'],
  [{ ...empresa, kind: 'city_hall' }, [], 'Tipus'],
  [{ ...empresa, parentOrganizationId: 'O' }, [], 'mare'],
  [{ ...grup, parentOrganizationId: '' }, [mare], 'mare'],
  [grup, [], 'administrar'],
  [grup, [{ ...mare, role: 'member' }], 'administrar'],
  [grup, [{ ...mare, kind: 'group' }], 'administrar'],
  [{ ...empresa, description: 'a'.repeat(501) }, [], 'descripció'],
])('una alta invàlida no arriba al port (%j)', async (dades, organitzacions, error) => {
  await expect(creaOrganitzacio(dades, {}, organitzacions)).rejects.toThrow(error);
  expect(m.createOrganization).not.toHaveBeenCalled();
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
