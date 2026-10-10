/**
 * Onada 10 (261010; decisió del Mestre del 261010) · El botó «Anar al xat» de
 * /iaia obri, en llavor i en local, la conversa de la fila «IAIA MarIA» de la
 * llista: el directe amb ella (/xat?amb=<id>, que XatSection resol amb
 * creaFilDirecte). Ací es prova el que fa el magatzem local, que en estos dos
 * modes fa de servidor:
 *  · en llavor, creaFilDirecte torna el fil 'iaia' de la llavor, sense
 *    crear-ne cap, i és on ella contesta;
 *  · en local, la primera vegada el crea i després el torna a trobar;
 *  · el xat públic de la pàgina /iaia hi és un ALTRE xat (un grup), i la IAIA
 *    no hi contesta: per això en estos modes el botó no hi porta.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AGENTS_MAP } from './agentsSeed.js';
import { PAGINES_AMB_XAT } from './contracte.js';
import { IAIA_ID, RESPOSTA_IAIA } from './identitatsSeed.js';
import { localXat, reiniciaLocalXat } from './localXat.js';
import { XAT_SEED_IDS } from './xatSeed.js';
import { esXatDeLaIAIA } from './xatsPerDefecte.js';

const mock = vi.hoisted(() => ({ user: { id: 'jo-A' } }));
vi.mock('./identitat.js', () => ({ usuariDeSessio: () => mock.user, getDefaultUserId: () => 'convidat-seed' }));

const SEED = { dataMode: 'seed', tenantId: '00000000-0000-4000-8000-000000000000' };
const LOCAL = { dataMode: 'local', tenantId: '00000000-0000-4000-8000-000000000000' };
const PAGINA_DE_LA_IAIA = { tipus: 'pagina', id: '/iaia', ruta: '/iaia', titol: PAGINES_AMB_XAT['/iaia'] };

const idsDe = async (config) => (await localXat.loadFils(config)).map((fil) => fil.id).sort();

beforeEach(() => { reiniciaLocalXat(); mock.user = { id: 'jo-A' }; });

describe('el directe amb la IAIA és la fila «IAIA MarIA» de la llista', () => {
  it('llavor · creaFilDirecte torna el fil de la llavor, sense crear-ne cap', async () => {
    const abans = await localXat.loadFils(SEED);
    const files = abans.filter(esXatDeLaIAIA);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({
      id: XAT_SEED_IDS.filIaia, tipus: 'iaia', subjecte: null, altresNoms: [AGENTS_MAP.IAIA.name],
      altres: [{ id: IAIA_ID, nom: 'IAIA MarIA', tipus: 'ia', avatarUrl: AGENTS_MAP.IAIA.avatar_url }]
    });
    expect(await localXat.creaFilDirecte(IAIA_ID, null, SEED)).toBe(XAT_SEED_IDS.filIaia);
    expect(await idsDe(SEED)).toEqual(abans.map((fil) => fil.id).sort());
  });

  it('llavor · sense sessió (el convidat) també és el fil de la llavor', async () => {
    mock.user = null;
    expect(await localXat.creaFilDirecte(IAIA_ID, null, SEED)).toBe(XAT_SEED_IDS.filIaia);
  });

  it('llavor · en eixe fil la IAIA contesta amb la seua frase «en proves»', async () => {
    const filId = await localXat.creaFilDirecte(IAIA_ID, null, SEED);
    await localXat.enviaMissatge(filId, { id: 'm-1', text: 'Bon dia, iaia' }, SEED);
    const missatges = await localXat.loadMissatges(filId, SEED);
    expect(missatges.at(-1)).toMatchObject({ usuariId: IAIA_ID, esIA: true, text: RESPOSTA_IAIA });
    expect(RESPOSTA_IAIA).toContain('en proves');
  });

  it('local · sense cap fila, el primer clic crea el fil ’iaia’ i el segon el torna a trobar', async () => {
    expect(await localXat.loadFils(LOCAL)).toEqual([]);
    const filId = await localXat.creaFilDirecte(IAIA_ID, null, LOCAL);
    expect(await localXat.creaFilDirecte(IAIA_ID, null, LOCAL)).toBe(filId);
    const fils = await localXat.loadFils(LOCAL);
    expect(fils).toHaveLength(1);
    expect(fils[0]).toMatchObject({ id: filId, tipus: 'iaia', altresNoms: ['IAIA MarIA'] });
    expect(esXatDeLaIAIA(fils[0])).toBe(true);
  });

  it('llavor · el xat públic de la pàgina /iaia és un altre xat, i la IAIA no hi contesta', async () => {
    const obert = await localXat.obriFilDePagina(PAGINA_DE_LA_IAIA, SEED);
    expect(obert.filId).not.toBe(XAT_SEED_IDS.filIaia);
    expect(obert.fils[0]).toMatchObject({ tipus: 'grup', titol: PAGINES_AMB_XAT['/iaia'], subjecte: { tipus: 'pagina', id: '/iaia' } });
    await localXat.enviaMissatge(obert.filId, { id: 'm-2', text: 'Hi ha algú?' }, SEED);
    expect((await localXat.loadMissatges(obert.filId, SEED)).map((missatge) => missatge.text)).toEqual(['Hi ha algú?']);
    /* I el directe continua sent el de la llavor. */
    expect(await localXat.creaFilDirecte(IAIA_ID, null, SEED)).toBe(XAT_SEED_IDS.filIaia);
  });
});
