/**
 * W4-10 (auditoria de Codex 261003_1950) · La cadena sencera, de l'autor de la
 * boina del Panell a la RPC: el port resol l'entitat (resolXatCorporatiu) →
 * l'enllaç /xat?amb=<id> → el Xat llig ?amb= amb URLSearchParams (com fa
 * XatSection) → creaFilDirecte de l'adaptador de Supabase.
 *
 * La interfície no sap el format de l'id; l'adaptador, sí. Un UUID arriba a
 * crea_fil_directe tal qual. Un id que no ho és («42», «wp:organization:42»)
 * fa enllaç a la interfície, perquè és l'id que ha tornat el port, i Supabase
 * el rebutja abans de la xarxa amb un error clar.
 *
 * Cap xarxa: el client de Supabase és un doble. El runtime, la identitat i el
 * magatzem local són els reals. Viu ací perquè només l'adaptador pot importar
 * l'adaptador (tractor-enxufe, E1).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({ getClient: vi.fn() }));
vi.mock('./config.js', () => ({ getClient: mock.getClient }));

import { creaFilDirecte } from './xat.js';
import { reiniciaLocalXat } from '../localXat.js';
import { CONTRACTE_NUCLI } from '../contracte.js';
import { setBackendImplementation } from '../backendPort.js';
import { resolXatCorporatiu } from '../../sections/control/xatCorporatiu.js';

const TENANT = '00000000-0000-4000-8000-000000000000';
const ENTITAT_UUID = '7d1f4c2e-9a3b-4c5d-8e6f-0a1b2c3d4e5f';
let client;

beforeEach(() => {
  vi.clearAllMocks();
  reiniciaLocalXat();
  const query = { data: 'fil-corporatiu', error: null, abortSignal: vi.fn().mockReturnThis() };
  client = { rpc: vi.fn().mockReturnValue(query) };
  mock.getClient.mockResolvedValue(client);
});

/* El backend registrat al port: el directori, que torna l'entitat donada. */
const portAmb = (resposta) => ({
  teCapacitat: (capacitat) => capacitat === 'directori',
  loadPerfilPublic: vi.fn(async () => resposta)
});
const llest = async () => {};

/** De la boina a la conversa: l'enllaç de l'autor i el que en fa el Xat. */
async function obriDesDeLaBoina(dataMode, port) {
  const config = { dataMode, tenantId: TENANT };
  const autor = await resolXatCorporatiu({ dataMode, config, port, llest });
  if (!autor.href) return { autor, amb: null, conversa: null };
  const amb = new URLSearchParams(autor.href.split('?')[1]).get('amb');
  const conversa = await creaFilDirecte(amb, null, config).then((filId) => ({ filId }), (error) => ({ error }));
  return { autor, amb, conversa };
}

describe('W4-10 · de la boina a crea_fil_directe', () => {
  it('remot amb l’entitat UUID: l’autor és enllaç i la RPC rep eixe UUID', async () => {
    const { autor, amb, conversa } = await obriDesDeLaBoina('remote', portAmb({ tipus: 'entitat', id: ENTITAT_UUID }));
    expect(autor).toEqual({ estat: 'remot', href: `/xat?amb=${ENTITAT_UUID}` });
    expect(amb).toBe(ENTITAT_UUID);
    expect(conversa).toEqual({ filId: 'fil-corporatiu' });
    expect(client.rpc).toHaveBeenCalledTimes(1);
    expect(client.rpc).toHaveBeenCalledWith('crea_fil_directe', { p_tenant_id: TENANT, p_altre_usuari: ENTITAT_UUID, p_titol: null });
  });

  it.each([
    ['42', '/xat?amb=42'],
    ['wp:organization:42', '/xat?amb=wp%3Aorganization%3A42']
  ])('remot amb l’id opac «%s»: la interfície fa l’enllaç i Supabase el rebutja sense cap RPC', async (id, href) => {
    const { autor, amb, conversa } = await obriDesDeLaBoina('remote', portAmb({ tipus: 'entitat', id }));
    expect(autor).toEqual({ estat: 'remot', href });
    expect(amb).toBe(id);
    expect(conversa.error).toMatchObject({ code: 'DESTINATARI_INVALID', retriable: false });
    expect(conversa.error.message).toMatch(/^No es pot obrir la conversa: .*UUID/);
    expect(mock.getClient).not.toHaveBeenCalled();
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it('remot sense entitat o amb el port en error: cap enllaç i cap RPC', async () => {
    await expect(obriDesDeLaBoina('remote', portAmb(null))).resolves.toEqual({
      autor: { estat: 'absent', href: null }, amb: null, conversa: null
    });
    const caigut = { teCapacitat: () => true, loadPerfilPublic: async () => { throw new Error('503'); } };
    await expect(obriDesDeLaBoina('remote', caigut)).rejects.toThrow('503');
    expect(mock.getClient).not.toHaveBeenCalled();
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it('seed: el xat de la llavor obri la conversa local amb l’entitat, sense port ni Supabase', async () => {
    const port = portAmb({ tipus: 'entitat', id: ENTITAT_UUID });
    const { autor, amb, conversa } = await obriDesDeLaBoina('seed', port);
    expect(autor).toEqual({ estat: 'llavor', href: '/xat?amb=socdepoble' });
    expect(amb).toBe('socdepoble');
    expect(typeof conversa.filId).toBe('string');
    expect(port.loadPerfilPublic).not.toHaveBeenCalled();
    expect(mock.getClient).not.toHaveBeenCalled();
  });
});

/* Revisió adversarial · La reproducció original de Codex (W4-10,
   /tmp/sdp-onada4/repro-control-0050.mjs) amb el PORT REAL: un backend
   acceptat per setBackendImplementation, el resolutor amb el seu port per
   defecte (cap port injectat) i l'adaptador real amb el transport substituït.
   Abans del pegat, «42» i «wp:organization:42» donaven { estat: 'absent' }
   (evidència de Codex control-0050-repro.json); ara fan enllaç. */
describe('W4-10 · la reproducció de Codex amb el backendPort real', () => {
  it('l’UUID arriba a la RPC; «42» i «wp:organization:42» fan enllaç; sense entitat, cap; en seed, cap consulta', async () => {
    let perfil = { tipus: 'entitat', id: '00000000-0000-4000-8000-000000000042' };
    const consultes = [];
    const impl = Object.fromEntries(CONTRACTE_NUCLI.map((nom) => [nom, async () => null]));
    impl.loadPerfilPublic = async (clau, config) => { consultes.push({ clau, config }); return perfil; };
    setBackendImplementation(impl);
    const config = { dataMode: 'remote', backendId: 'audit-generic', tenantId: TENANT };
    const resol = () => resolXatCorporatiu({ dataMode: 'remote', config, llest });

    const uuid = await resol();
    expect(uuid).toEqual({ estat: 'remot', href: '/xat?amb=00000000-0000-4000-8000-000000000042' });
    expect(consultes[0].clau).toBe('soc-de-poble');
    await creaFilDirecte(new URL(uuid.href, 'https://test.invalid').searchParams.get('amb'), null, config);
    expect(client.rpc).toHaveBeenCalledWith('crea_fil_directe', { p_tenant_id: TENANT, p_altre_usuari: perfil.id, p_titol: null });

    for (const [id, href] of [['42', '/xat?amb=42'], ['wp:organization:42', '/xat?amb=wp%3Aorganization%3A42']]) {
      perfil = { tipus: 'entitat', id, slug: 'soc-de-poble' };
      await expect(resol()).resolves.toEqual({ estat: 'remot', href });
    }
    perfil = null;
    await expect(resol()).resolves.toEqual({ estat: 'absent', href: null });

    const abansDeLaLlavor = consultes.length;
    await expect(resolXatCorporatiu({ dataMode: 'seed', llest: async () => { throw new Error('la llavor no espera'); } }))
      .resolves.toEqual({ estat: 'llavor', href: '/xat?amb=socdepoble' });
    expect(consultes).toHaveLength(abansDeLaLlavor);
    expect(client.rpc).toHaveBeenCalledTimes(1);
  });
});
