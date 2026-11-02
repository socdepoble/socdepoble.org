import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { configuraBackendSessio, desaSessio, esborraSessio } from '../identitat.js';
import { creaAdaptadorLocal } from './adaptadorLocal.js';

/* IDEA-24 (marató 261101_2143, B4) · La transferència atòmica de la propietat
   a l'adaptador local (comunitatLocal + localPerfils): la mateixa entrada que
   Supabase, cap xarxa, la guarda transversal de l'adaptador, i o canvien tots
   dos rols o cap. */
const PERSONA = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5';
const VEINA = '2e3f4051-6b7c-4d8e-9fa0-b1c2d3e4f5a6';
const FORN = 'socdepoble'; // 'company' a la llavor; qui entra n'és la propietària (rolALEntitat)
const ambCodi = (code) => expect.objectContaining({ code });
const xarxa = vi.fn(() => { throw new Error('XARXA_PROHIBIDA'); });
beforeAll(() => { vi.stubGlobal('fetch', xarxa); });
afterAll(() => { vi.unstubAllGlobals(); expect(xarxa).not.toHaveBeenCalled(); });
afterEach(() => { esborraSessio({ abast: 'tot' }); });

function entra(adaptador, id = PERSONA) {
  configuraBackendSessio(adaptador.configuracio);
  expect(desaSessio({ access_token: 'testimoni-opac-local', user: { id, email: 'proves@poble.invalid', user_metadata: {} } })).toBe(true);
}
const nou = () => creaAdaptadorLocal({ mode: 'local', dades: { persones: [{ id: VEINA, nom: 'Pepa Veïna', avatar: '' }] } });
const rolsDe = async (a) => Object.fromEntries((await a.llistaMembresOrganitzacio(FORN, {})).map((m) => [m.id, m.rol]));
const elMeuRol = async (a) => (await a.listMyOrganizations({})).find((o) => o.id === FORN)?.role;

describe('transfereixPropietatOrganitzacio · adaptador local', () => {
  test('sense sessió, 000; una organització com a destinatària, 001; qui no n’és membre, 003; una mateixa, 004; cap rol canvia', async () => {
    const a = nou();
    await expect(a.transfereixPropietatOrganitzacio(FORN, { tipus: 'persona', id: VEINA }, {})).rejects.toEqual(ambCodi('SDP-ORGMEM-000'));
    entra(a);
    await expect(a.transfereixPropietatOrganitzacio(FORN, { tipus: 'organitzacio', id: 'rentonar' }, {})).rejects.toEqual(ambCodi('SDP-ORGMEM-001'));
    await expect(a.transfereixPropietatOrganitzacio(FORN, VEINA, {})).rejects.toEqual(ambCodi('SDP-ORGMEM-001'));
    await expect(a.transfereixPropietatOrganitzacio('no-existix', { tipus: 'persona', id: VEINA }, {})).rejects.toEqual(ambCodi('SDP-ORGMEM-002'));
    await expect(a.transfereixPropietatOrganitzacio(FORN, { tipus: 'persona', id: VEINA }, {})).rejects.toEqual(ambCodi('SDP-ORGMEM-003'));
    await expect(a.transfereixPropietatOrganitzacio(FORN, { tipus: 'persona', id: PERSONA }, {})).rejects.toEqual(ambCodi('SDP-ORGMEM-004'));
    expect(await elMeuRol(a)).toBe('owner');
    await a.destroy();
  });

  test('la propietària la cedix a una persona membre: ella passa a admin, la veïna a owner, i ja no la pot tornar a cedir', async () => {
    const a = nou();
    entra(a);
    await a.desaMembreOrganitzacio(FORN, { tipus: 'persona', id: VEINA, rol: 'member' }, {});
    const resultat = await a.transfereixPropietatOrganitzacio(FORN, { tipus: 'persona', id: ` ${VEINA} ` }, {});
    expect(resultat).toEqual({ organizationId: FORN, anticOwnerId: PERSONA, nouOwnerId: VEINA });
    expect(await elMeuRol(a)).toBe('admin');
    const rols = await rolsDe(a);
    expect(rols).toMatchObject({ [VEINA]: 'owner', [PERSONA]: 'admin' });
    expect(Object.values(rols).filter((rol) => rol === 'owner')).toHaveLength(1);
    // El resultat és una dada solta, no una referència al magatzem: tocar-lo no
    // canvia els rols. (localPerfils ja torna un literal nou; e.copia ho manté
    // si això canvia. Sense e.copia, avui la prova no cau: és equivalent.)
    resultat.nouOwnerId = PERSONA;
    expect((await rolsDe(a))[VEINA]).toBe('owner');
    await expect(a.transfereixPropietatOrganitzacio(FORN, { tipus: 'persona', id: VEINA }, {})).rejects.toEqual(ambCodi('SDP-ORGMEM-006'));
    // Ja no és la propietària: no nomena administradores.
    await expect(a.desaMembreOrganitzacio(FORN, { tipus: 'persona', id: VEINA, rol: 'admin' }, {})).rejects.toEqual(ambCodi('SDP-ORGMEM-005'));
    await a.destroy();
  });

  test.each(['entity', 'city_hall'])('una organització %s no es transferix (001) i cap rol canvia', async (kind) => {
    const a = nou();
    entra(a);
    await a.desaMembreOrganitzacio(FORN, { tipus: 'persona', id: VEINA, rol: 'member' }, {});
    await a.updateOrganization(FORN, { kind }, {});
    await expect(a.transfereixPropietatOrganitzacio(FORN, { tipus: 'persona', id: VEINA }, {})).rejects.toEqual(ambCodi('SDP-ORGMEM-001'));
    expect(await rolsDe(a)).toMatchObject({ [VEINA]: 'member' });
    expect(await elMeuRol(a)).toBe('owner');
    await a.destroy();
  });

  test('la guarda de l’adaptador: amb el senyal avortat rebutja sense canviar cap rol; tancat, rebutja la guarda i no el magatzem', async () => {
    const a = nou();
    entra(a);
    await a.desaMembreOrganitzacio(FORN, { tipus: 'persona', id: VEINA, rol: 'member' }, {});
    const tall = new AbortController();
    tall.abort();
    await expect(a.transfereixPropietatOrganitzacio(FORN, { tipus: 'persona', id: VEINA }, { signal: tall.signal }))
      .rejects.toMatchObject({ name: 'AbortError' });
    expect(await rolsDe(a)).toMatchObject({ [VEINA]: 'member' });
    expect(await elMeuRol(a)).toBe('owner');
    await a.destroy();
    // Ha de rebutjar la guarda de tancament: sense ella, el magatzem buidat per
    // destroy també rebutjaria, però amb SDP-ORGMEM-003.
    const tancat = await a.transfereixPropietatOrganitzacio(FORN, { tipus: 'persona', id: VEINA }, {}).then(
      () => { throw new Error('Un adaptador tancat no pot resoldre.'); },
      (error) => error
    );
    expect(tancat).toMatchObject({ message: '[adaptadorLocal] Adaptador tancat.' });
    expect(tancat.code).toBeUndefined();
  });
});
