/* Onada 6 · L'adaptador del xat per als beta testers:
   · tasca 12 · el xat de la IAIA es diu «IAIA MarIA» a la llista (loadFils) i
     en obrir-lo (obriFilDePagina): el servidor el titula «L'ànima de la iaia» i
     abans la fila canviava de nom en obrir-la;
   · decisió 5 · SDP-XAT-003, SDP-XAT-013 i SDP-XAT-429 arriben amb el text per
     a la persona, mai el codi cru, i el 429 es pot tornar a provar. La
     traducció pel codi la comprova src/sections/xat/errorsXat.test.js. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { enviaMissatge, loadFils, obriFilDePagina, reiniciaMemoriaXatDePagina } from './xat.js';
import { reiniciaLocalXat } from '../localXat.js';
import { AJUDA_PER_CLAU } from '../xatsPerDefecte.js';
import { XAT_SEED_IDS } from '../xatSeed.js';
import { createTranslator } from '../../config/i18n.js';

const mock = vi.hoisted(() => ({ getClient: vi.fn(), user: { id: 'A' } }));
vi.mock('./config.js', async (original) => ({ ...(await original()), getClient: mock.getClient }));
vi.mock('../identitat.js', async (original) => ({
  ...(await original()), usuariDeSessio: () => mock.user, getDefaultUserId: () => mock.user?.id || 'convidat-seed'
}));
vi.mock('./runtime.js', async (original) => ({
  ...(await original()),
  getResolvedConfig: (config) => ({ ...config, runtimeDataMode: config.dataMode || 'remote' }),
  generateUUID: () => 'uuid-generat'
}));
vi.mock('./utils.js', async (original) => ({ ...(await original()), handleError: (error) => error }));

const REMOT = { tenantId: '00000000-0000-4000-8000-000000000000' };
const SEED = { dataMode: 'seed', tenantId: '00000000-0000-4000-8000-000000000000' };
const resposta = (data, error = null) => ({ data, error, abortSignal: vi.fn().mockReturnThis() });
let client;

beforeEach(() => {
  vi.clearAllMocks(); mock.user = { id: 'A' }; reiniciaLocalXat(); reiniciaMemoriaXatDePagina();
  client = { rpc: vi.fn().mockReturnValue(resposta([])) };
  mock.getClient.mockResolvedValue(client);
});

/* Una fila del xat públic de /iaia, com la torna el servidor (2610042330). */
const filaIaia = (extra = {}) => ({
  id: 'p-iaia', tipus: 'grup', titol: "L'ànima de la iaia", imatge_url: null, actualitzat_al: '2026-10-09T01:00:00Z',
  ultim_seq: 2, comunitat_id: null, org_id: null, subjecte_tipus: 'pagina', subjecte_id: '/iaia', subjecte_ruta: '/iaia',
  subjecte_titol: "L'ànima de la iaia", participant: true, rol: 'membre', desti: true, ...extra
});

describe('tasca 12 · el xat de la IAIA es diu «IAIA MarIA»', () => {
  it('a la llista: el fil de /iaia porta el nom i la cara d’AJUDA i la fila sintètica se’n va', async () => {
    client.rpc.mockReturnValueOnce(resposta([filaIaia()]));
    const fils = await loadFils(REMOT);
    /* Gauntlet 261016 (Bloc 3.6) · Javi Llinares també és a la cua. */
    expect(fils.map((f) => f.perDefecte ?? f.id)).toEqual(['p-iaia', 'socdepoble', 'javi']);
    expect(fils[0]).toMatchObject({ titol: 'IAIA MarIA', imatgeUrl: AJUDA_PER_CLAU.iaia.avatar });
    /* La pàgina continua sent «L'ànima de la iaia». */
    expect(fils[0].subjecte).toEqual({ tipus: 'pagina', id: '/iaia', ruta: '/iaia', titol: "L'ànima de la iaia" });
  });

  it('en obrir-lo (la fila de la IAIA en remot): el mateix nom, i la llista no el canvia', async () => {
    client.rpc.mockReturnValueOnce(resposta([filaIaia({ participant: false })]));
    const obert = await obriFilDePagina({ tipus: 'pagina', id: '/iaia', ruta: '/iaia', titol: "L'ànima de la iaia" }, REMOT);
    expect(obert.filId).toBe('p-iaia');
    expect(obert.fils[0]).toMatchObject({ titol: 'IAIA MarIA', imatgeUrl: AJUDA_PER_CLAU.iaia.avatar, participant: false });
  });

  it('una altra pàgina, un grup o un directe qualsevol no canvien', async () => {
    client.rpc.mockReturnValueOnce(resposta([
      filaIaia({ id: 'p-mur', titol: 'El Mur', subjecte_id: '/mur', subjecte_ruta: '/mur', subjecte_titol: 'El Mur' }),
      { id: 'd-1', tipus: 'directe', titol: 'Pepa', imatge_url: '/assets/x.png', ultim_seq: 0 }
    ]));
    const fils = await loadFils(REMOT);
    expect(fils.slice(0, 2).map((f) => [f.titol, f.imatgeUrl])).toEqual([['El Mur', null], ['Pepa', '/assets/x.png']]);
  });

  it('en llavor no es vestix res: el fil de la IAIA ja es diu així, i el xat de /iaia és un altre xat', async () => {
    const fils = await loadFils(SEED);
    const iaia = fils.find((f) => f.id === XAT_SEED_IDS.filIaia);
    expect(iaia.titol).toBeNull();
    const obert = await obriFilDePagina({ tipus: 'pagina', id: '/iaia', ruta: '/iaia' }, SEED);
    expect(obert.fils[0].titol).toBe("L'ànima de la iaia");
    expect(client.rpc).not.toHaveBeenCalled();
  });
});

describe('decisió 5 · els codis SDP que es troba una persona el primer dia', () => {
  const ca = createTranslator('ca');

  it.each([
    ['SDP-XAT-003', 'section.xat.error.noMembre', false],
    ['SDP-XAT-013', 'section.xat.error.paginaNoVisible', false],
    ['SDP-XAT-429', 'section.xat.error.massaMissatges', true]
  ])('%s: el text valencià de la clau, sense el codi; reintentable: %s', async (codi, clau, reintentable) => {
    client.rpc.mockReturnValueOnce(resposta(null, { message: `${codi}: text del servidor`, code: 'P0001' }));
    const error = await enviaMissatge('fil', 'hola', REMOT).catch((e) => e);
    expect(error).toMatchObject({ code: codi, retriable: reintentable, message: ca(clau) });
    expect(error.message).not.toMatch(/SDP-XAT/);
    expect(error.cause.message).toBe(`${codi}: text del servidor`);
  });

  it('un altre codi SDP continua amb el text del servidor i sense reintent', async () => {
    client.rpc.mockReturnValueOnce(resposta(null, { message: 'SDP-XAT-011: en este canal només escriuen els administradors.' }));
    const error = await enviaMissatge('fil', 'hola', REMOT).catch((e) => e);
    expect(error).toMatchObject({ code: 'SDP-XAT-011', retriable: false, message: 'SDP-XAT-011: en este canal només escriuen els administradors.' });
  });
});
