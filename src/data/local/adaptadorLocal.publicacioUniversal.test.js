/* IDEA-61 (T0, prompt 261102_1532; carril L1) · Integració del Flux Universal
   de Publicació amb l'adaptador local (el segon adaptador complet del port):
   una fitxa d'àmbit publicada amb appendSectionSubmissionNetworkOnly (una sola
   fila a la secció de l'àmbit: 'mur' per a vehicle, treball i habitatge; la
   seua per al mercat) torna per loadMur neta, cada vertical la troba amb
   perAmbit, canviaEstat → re-upsert del mateix id no duplica, un payload hostil
   queda net o sense àmbit, i una publicació de sempre no canvia ni un byte.
   Sense xarxa: fetch és un error. Patró d'adaptadorLocal.test.js. */
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { configuraBackendSessio, desaSessio, esborraSessio } from '../identitat.js';
import { esperaLaIAIA, reiniciaLocalXat } from '../localXat.js';
import { creaAdaptadorLocal } from './adaptadorLocal.js';
import { canviaEstat, esFitxaDAmbit, esVisibleALaLlista, perAmbit, projeccioPayload, resumDeFitxa, seccioDAmbit } from '../../utils/publicacioUniversal.js';

const PERSONA = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5';
const ID_VIATGE = '6a7b8c9d-0e1f-4a2b-8c3d-4e5f6a7b8c9d';
const ID_OLI = '7b8c9d0e-1f2a-4b3c-8d4e-5f6a7b8c9d0e';
const ID_FIRA = '8c9d0e1f-2a3b-4c4d-8e5f-6a7b8c9d0e1f';
const ID_HOSTIL = '9d0e1f2a-3b4c-4d5e-8f6a-7b8c9d0e1f2a';
const ID_XYZ = 'a0e1f2a3-4b5c-4e6f-8a7b-8c9d0e1f2a3b';
const ID_OLI_A_MUR = 'b1f2a3b4-5c6d-4f7a-8b8c-9d0e1f2a3b4c';
const ID_VIATGE_A_MERCAT = 'c2a3b4c5-6d7e-4a8b-8c9d-0e1f2a3b4c5d';
const ARA = new Date('2026-11-02T18:00:00.000Z');
const ara = () => new Date(ARA);

const xarxa = vi.fn(() => { throw new Error('XARXA_PROHIBIDA'); });
beforeAll(() => { vi.stubGlobal('fetch', xarxa); reiniciaLocalXat(); });
afterEach(() => { esborraSessio({ abast: 'tot' }); });
afterAll(async () => {
  await esperaLaIAIA();
  reiniciaLocalXat();
  vi.unstubAllGlobals();
  expect(xarxa).not.toHaveBeenCalled();
});

function entra(adaptador, id = PERSONA) {
  configuraBackendSessio(adaptador.configuracio);
  expect(desaSessio({ access_token: 'testimoni-opac-local', user: { id, email: 'proves@poble.invalid', user_metadata: {} } })).toBe(true);
}
const textHostil = () => JSON.parse('{"toString":0}');
const senseAmbit = (element) => {
  for (const clau of ['ambit', 'estat', 'dades']) expect(element, clau).not.toHaveProperty(clau);
};

/* El que publishNote envia: el payload de sempre projectat pel contracte. */
const deSempre = (title) => ({ sectionId: 'mur', type: 'feed', title, subtitle: '', description: '', content: '<p>Cos</p>', copyright: '', image: '/assets/fira.png', labels: [], author_name: 'Pepa' });
const viatge = () => projeccioPayload({
  ...deSempre('Viatge a Alcoi'), ambit: 'vehicle', estat: 'disponible',
  dades: { modalitat: 'oferisc_places', lloc_eixida: 'La Torre', lloc_arribada: 'Alcoi', data_eixida: '2026-11-15', places: '3', aportacio: '5 €' }
});
const oli = () => projeccioPayload({
  ...deSempre('Oli'), sectionId: 'mercat', ambit: 'mercat', estat: 'disponible',
  dades: { preu: '12 €', unitat: 'litre', categoria: 'Oli d’oliva' }
});
const publica = (a, id, payload) => a.appendSectionSubmissionNetworkOnly({ id, sectionId: seccioDAmbit(payload.ambit), payload }, {});

describe('una sola fila, dues vistes', () => {
  test('un viatge (mur), un producte (mercat) i una publicació de sempre tornen per loadMur: la fitxa neta, cada vertical la troba amb perAmbit', async () => {
    const a = creaAdaptadorLocal({ mode: 'local', ara });
    entra(a);
    expect(seccioDAmbit('vehicle')).toBe('mur');
    expect(seccioDAmbit('mercat')).toBe('mercat');
    await publica(a, ID_VIATGE, viatge());
    await publica(a, ID_OLI, oli());
    await publica(a, ID_FIRA, deSempre('Fira'));
    const { feedPosts, marketItems, events } = await a.loadMur(PERSONA, {});
    expect(events).toEqual([]);
    expect(feedPosts.map((p) => p.id).sort()).toEqual([ID_FIRA, ID_VIATGE].sort());
    expect(marketItems.map((p) => p.id)).toEqual([ID_OLI]);

    const [viatgeLlegit] = perAmbit(feedPosts, 'vehicle');
    expect(viatgeLlegit).toMatchObject({ id: ID_VIATGE, sectionId: 'mur', type: 'vehicle', title: 'Viatge a Alcoi', ambit: 'vehicle', estat: 'disponible', ownerUserId: PERSONA });
    expect(viatgeLlegit.dades).toEqual({ modalitat: 'oferisc_places', lloc_eixida: 'La Torre', lloc_arribada: 'Alcoi', data_eixida: '2026-11-15', places: 3, aportacio: '5 €' });
    expect(esFitxaDAmbit(viatgeLlegit)).toBe(true);
    expect(esVisibleALaLlista(viatgeLlegit)).toBe(true);
    expect(resumDeFitxa(viatgeLlegit)).toBe('Oferisc places · La Torre → Alcoi · 2026-11-15 · Places disponibles: 3 · 5 €');
    expect(perAmbit(feedPosts, 'mur').map((p) => p.id)).toEqual([ID_FIRA]);
    expect(perAmbit(feedPosts, 'treball')).toEqual([]);
    senseAmbit(feedPosts.find((p) => p.id === ID_FIRA));

    const [oliLlegit] = perAmbit(marketItems, 'mercat');
    expect(oliLlegit).toMatchObject({ id: ID_OLI, sectionId: 'mercat', type: 'product', title: 'Oli', ambit: 'mercat', estat: 'disponible', price: '12 €', tag: 'Oli d’oliva', category_slug: 'oli-d-oliva', seller: 'Pepa' });
    expect(oliLlegit.dades).toEqual({ preu: '12 €', unitat: 'litre', categoria: 'Oli d’oliva' });
    expect(resumDeFitxa(oliLlegit)).toBe('12 € · litre · Oli d’oliva');
  });

  test('canviaEstat → re-upsert del mateix id: loadMur reflectix l’estat nou i no duplica; tancada, continua existint però no ix a la llista', async () => {
    const a = creaAdaptadorLocal({ mode: 'local', ara });
    entra(a);
    const payload = viatge();
    await publica(a, ID_VIATGE, payload);
    await publica(a, ID_VIATGE, canviaEstat(payload, 'reservat'));
    let files = (await a.loadMur(PERSONA, {})).feedPosts.filter((p) => p.id === ID_VIATGE);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({ ambit: 'vehicle', estat: 'reservat', title: 'Viatge a Alcoi' });
    expect(files[0].dades).toEqual(perAmbit([files[0]], 'vehicle')[0].dades);
    expect(esVisibleALaLlista(files[0])).toBe(true);
    /* Un estat de fora d'ESTATS no mou res (canviaEstat) i, si arribara cru, el mapejador el torna a disponible. */
    await publica(a, ID_VIATGE, canviaEstat(payload, 'venut'));
    expect((await a.loadMur(PERSONA, {})).feedPosts.find((p) => p.id === ID_VIATGE).estat).toBe('disponible');
    await publica(a, ID_VIATGE, { ...payload, estat: 'hackejat' });
    expect((await a.loadMur(PERSONA, {})).feedPosts.find((p) => p.id === ID_VIATGE).estat).toBe('disponible');
    await publica(a, ID_VIATGE, canviaEstat(payload, 'tancat'));
    files = (await a.loadMur(PERSONA, {})).feedPosts.filter((p) => p.id === ID_VIATGE);
    expect(files).toHaveLength(1);
    expect(files[0].estat).toBe('tancat');
    expect(esVisibleALaLlista(files[0])).toBe(false);
    expect(perAmbit(files, 'vehicle')).toHaveLength(1);
  });

  test('un payload hostil escrit directament al port queda net o sense àmbit, a la secció que toca', async () => {
    const a = creaAdaptadorLocal({ mode: 'local', ara });
    entra(a);
    await a.appendSectionSubmissionNetworkOnly({ id: ID_HOSTIL, sectionId: 'mur', payload: {
      title: 'Hostil', ambit: 'vehicle', estat: 'hackejat',
      dades: { modalitat: 'oferisc_places', lloc_eixida: textHostil(), lloc_arribada: ['x'], data_eixida: '2026-02-30', places: 99, punt_trobada: ' Plaça ', ofici: 'no és del vehicle' }
    } }, {});
    await a.appendSectionSubmissionNetworkOnly({ id: ID_XYZ, sectionId: 'mur', payload: { title: 'Àmbit inventat', ambit: 'xyz', estat: 'reservat', dades: { preu: '1' } } }, {});
    await a.appendSectionSubmissionNetworkOnly({ id: ID_OLI_A_MUR, sectionId: 'mur', payload: { title: 'Oli a mur', ambit: 'mercat', estat: 'disponible', dades: { preu: '1' } } }, {});
    await a.appendSectionSubmissionNetworkOnly({ id: ID_VIATGE_A_MERCAT, sectionId: 'mercat', payload: { title: 'Viatge a mercat', ambit: 'vehicle', dades: { modalitat: 'busque_lloc' } } }, {});
    const { feedPosts, marketItems } = await a.loadMur(PERSONA, {});
    const hostil = feedPosts.find((p) => p.id === ID_HOSTIL);
    expect(hostil).toMatchObject({ ambit: 'vehicle', estat: 'disponible' });
    expect(hostil.dades).toEqual({ modalitat: 'oferisc_places', punt_trobada: 'Plaça' });
    senseAmbit(feedPosts.find((p) => p.id === ID_XYZ));
    senseAmbit(feedPosts.find((p) => p.id === ID_OLI_A_MUR));
    expect(marketItems.map((p) => p.id)).toEqual([ID_VIATGE_A_MERCAT]);
    senseAmbit(marketItems[0]);
    expect(perAmbit(feedPosts, 'vehicle').map((p) => p.id)).toEqual([ID_HOSTIL]);
    expect(perAmbit(feedPosts, 'mercat')).toEqual([]);
    const tot = JSON.stringify([...feedPosts, ...marketItems]);
    expect(tot).not.toContain('toString');
    expect(tot).not.toContain('hackejat');
    expect(tot).not.toContain('2026-02-30');
  });

  test('Llei del Píxel · una publicació de sempre, republicada amb un àmbit invàlid, dona el mateix element byte a byte', async () => {
    const a = creaAdaptadorLocal({ mode: 'local', ara });
    entra(a);
    await publica(a, ID_FIRA, deSempre('Fira'));
    const [abans] = (await a.loadMur(PERSONA, {})).feedPosts;
    senseAmbit(abans);
    await a.appendSectionSubmissionNetworkOnly({ id: ID_FIRA, sectionId: 'mur', payload: { ...deSempre('Fira'), ambit: 'xyz', estat: 'reservat', dades: { preu: '1' } } }, {});
    const [despres] = (await a.loadMur(PERSONA, {})).feedPosts;
    expect(despres).toEqual(abans);
    await a.appendSectionSubmissionNetworkOnly({ id: ID_FIRA, sectionId: 'mur', payload: { ...deSempre('Fira'), ambit: 'mur' } }, {});
    expect((await a.loadMur(PERSONA, {})).feedPosts[0]).toEqual(abans);
  });
});
