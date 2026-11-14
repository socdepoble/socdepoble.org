/* R24 · CODEX-R24-03 · La capacitat 'consensIsoglosses' a l'adaptador local: el magatzem
   en memòria de la instància (src/data/consensIsoglosses.js), amb les regles de l'SQL R23
   (un vot per persona, pregunta i variant; aportació pendent de moderació; resum agregat sense
   cap identificador personal) i l'autoria de la sessió, mai dels arguments. */
import { afterEach, describe, expect, test } from 'vitest';
import { configuraBackendSessio, desaSessio, esborraSessio } from '../identitat.js';
import { creaAdaptadorLocal } from './adaptadorLocal.js';
import { validaBackendImplementation } from '../backendPort.js';
import { CAPACITATS } from '../contracte.js';

const ANNA = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5';
const BERTA = '2e3f4051-6b7c-4d8e-9fa0-b1c2d3e4f5a6';
const CARME = '3f405162-7c8d-4e9f-a0b1-c2d3e4f5a6b7';
const entra = (adaptador, id) => {
  configuraBackendSessio(adaptador.configuracio);
  expect(desaSessio({ access_token: 'testimoni-opac-local', user: { id, email: 'proves@poble.invalid' } })).toBe(true);
};
const VOT = Object.freeze({ preguntaId: 'q01_creilla', variantClau: 'querilla', paraulaEtiqueta: 'Querilla', poble: 'La Torre de les Maçanes', comarcaId: 'alacanti', abastComarcal: 'nomes_poble' });
/* El registre local del joc tal com el passa la targeta: { tipus, ...res.registre }. */
const APORTACIO = Object.freeze({ tipus: 'variant_isoglossa', id: 'iso-1763100000000', paraula: 'Creïlla de secà', poble: 'La Torre de les Maçanes',
  comarcaId: 'alacanti', comarcaNom: 'L’Alacantí', areaId: 'alacanti_vinalopo', abastComarcal: 'nomes_poble', pobleComarca: 'La Torre de les Maçanes · L’Alacantí',
  preguntaId: 'q01_creilla', opcioVivaId: 'viva:q01_creilla:creilla_de_seca', consentimentArxiuObert: true, consentimentVersio: 'cc-by-sa-4.0-v1',
  consentimentAcceptatAt: '2026-11-14T06:00:00.000Z' });

const adaptadors = [];
const nou = () => { const a = creaAdaptadorLocal({ mode: 'local', tenantId: '11111111-1111-4111-8111-111111111111' }); adaptadors.push(a); return a; };
afterEach(async () => { esborraSessio({ abast: 'tot' }); await Promise.all(adaptadors.splice(0).map((a) => a.destroy())); });

describe('adaptador local · consensIsoglosses', () => {
  test('oferix la capacitat sencera i el port la segella', () => {
    const a = nou();
    for (const nom of CAPACITATS.consensIsoglosses) expect(typeof a[nom], nom).toBe('function');
    const { candidate } = validaBackendImplementation(a);
    for (const nom of CAPACITATS.consensIsoglosses) expect(typeof candidate[nom], nom).toBe('function');
  });

  test('sense sessió llig el resum però no vota ni aporta (401 sense-sessio)', async () => {
    const a = nou();
    await expect(a.lligConsensIsoglossesPoble()).resolves.toEqual([]);
    await expect(a.votaVariantIsoglossaPoble(VOT)).rejects.toMatchObject({ code: 'sense-sessio', status: 401 });
    await expect(a.desaAportacioVeuPoble(APORTACIO)).rejects.toMatchObject({ code: 'sense-sessio', status: 401 });
  });

  test('un vot per persona i variant; el resum agrega persones i no exposa cap identificador', async () => {
    const a = nou();
    entra(a, ANNA);
    await expect(a.votaVariantIsoglossaPoble(VOT)).resolves.toEqual({ preguntaId: 'q01_creilla', variantClau: 'querilla', nou: true });
    await expect(a.votaVariantIsoglossaPoble(VOT)).resolves.toEqual({ preguntaId: 'q01_creilla', variantClau: 'querilla', nou: false });
    entra(a, BERTA);
    await a.votaVariantIsoglossaPoble({ ...VOT, poble: 'Xixona', comarcaId: '' });
    await a.votaVariantIsoglossaPoble({ preguntaId: 'q01_creilla', variantClau: 'queraella', paraulaEtiqueta: 'Queraella' });
    const resum = await a.lligConsensIsoglossesPoble();
    /* Onada R24.2 (R23-U05, CODEX-R24-D1-07) · Una fila per pregunta, variant i comarca, com la
       RPC: el poble i la comarca de cada fila són sempre una parella coherent. */
    expect(resum).toEqual([
      { preguntaId: 'q01_creilla', variantClau: 'queraella', paraula: 'Queraella', poble: null, comarcaId: null, vots: 1 },
      { preguntaId: 'q01_creilla', variantClau: 'querilla', paraula: 'Querilla', poble: null, comarcaId: 'alacanti', vots: 1 },
      { preguntaId: 'q01_creilla', variantClau: 'querilla', paraula: 'Querilla', poble: null, comarcaId: null, vots: 1 }
    ]);
    /* Gauntlet R24.2 · el poble només ix quan dos vots de la mateixa fila el comparteixen. */
    entra(a, CARME);
    await a.votaVariantIsoglossaPoble({ ...VOT, preguntaId: 'q04_pesol', variantClau: 'pesol', paraulaEtiqueta: 'Pésol', poble: 'Alcoi', comarcaId: 'alcoia' });
    entra(a, ANNA);
    await a.votaVariantIsoglossaPoble({ ...VOT, preguntaId: 'q04_pesol', variantClau: 'pesol', paraulaEtiqueta: 'Pésol', poble: 'Alcoi', comarcaId: 'alcoia' });
    entra(a, BERTA);
    await a.votaVariantIsoglossaPoble({ ...VOT, preguntaId: 'q04_pesol', variantClau: 'pesol', paraulaEtiqueta: 'Pésol', poble: 'Cocentaina', comarcaId: 'alcoia' });
    expect(await a.lligConsensIsoglossesPoble({ preguntaId: 'q04_pesol' })).toEqual([
      { preguntaId: 'q04_pesol', variantClau: 'pesol', paraula: 'Pésol', poble: 'Alcoi', comarcaId: 'alcoia', vots: 3 }
    ]);
    expect(JSON.stringify(resum)).not.toContain(ANNA);
    expect(JSON.stringify(resum)).not.toContain(BERTA);
    await expect(a.lligConsensIsoglossesPoble({ preguntaId: 'q02_espencat' })).resolves.toEqual([]);
  });

  test('l’aportació de la targeta entra pendent de moderació, amb l’autoria de la sessió', async () => {
    const a = nou();
    entra(a, ANNA);
    const rebut = await a.desaAportacioVeuPoble(APORTACIO);
    expect(rebut).toMatchObject({ estatModeracio: 'pendent' });
    expect(rebut.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(Number.isFinite(Date.parse(rebut.creatA))).toBe(true);
  });

  test('cap autoria, moderació ni recompte del client; cap clau desconeguda; cap àudio', async () => {
    const a = nou();
    entra(a, ANNA);
    for (const intrusa of [{ userId: BERTA }, { user_id: BERTA }, { estatModeracio: 'aprovat' }, { totalVots: 99 }]) {
      await expect(a.votaVariantIsoglossaPoble({ ...VOT, ...intrusa })).rejects.toBeInstanceOf(TypeError);
      await expect(a.desaAportacioVeuPoble({ ...APORTACIO, ...intrusa })).rejects.toBeInstanceOf(TypeError);
    }
    /* El Refranyer passa el seu registre (sense tipus) i el Blob: no hi ha transport d'àudio. */
    await expect(a.desaAportacioVeuPoble({ refranyId: 'r1', textRefrany: 'Refrany', pobleComarca: 'Poble', blob: new Blob(['x']) })).rejects.toBeInstanceOf(TypeError);
    await expect(a.desaAportacioVeuPoble({ ...APORTACIO, tipus: 'refrany_audio' })).rejects.toBeInstanceOf(TypeError);
    await expect(a.desaAportacioVeuPoble({ ...APORTACIO, consentimentArxiuObert: false })).rejects.toBeInstanceOf(TypeError);
    /* Una etiqueta que no és el mot de la clau no pot pintar-se damunt d'una variant. */
    await expect(a.votaVariantIsoglossaPoble({ ...VOT, paraulaEtiqueta: 'Text ofensiu' })).rejects.toBeInstanceOf(TypeError);
    await expect(a.votaVariantIsoglossaPoble({ ...VOT, variantClau: 'Querilla!' })).rejects.toBeInstanceOf(TypeError);
    await expect(a.lligConsensIsoglossesPoble({ preguntaId: 'Q01' })).rejects.toBeInstanceOf(TypeError);
    await expect(a.lligConsensIsoglossesPoble()).resolves.toEqual([]);
  });

  test('un canvi de sessió en el mateix tic de la crida no vota en nom de l’altra persona', async () => {
    const a = nou();
    entra(a, ANNA);
    const pendent = a.votaVariantIsoglossaPoble(VOT);
    entra(a, BERTA);
    await expect(pendent).rejects.toMatchObject({ name: 'AbortError' });
    await expect(a.lligConsensIsoglossesPoble()).resolves.toEqual([]);
  });

  test('cada instància té el seu magatzem i destroy() el buida', async () => {
    const a = nou(); const b = nou();
    entra(a, ANNA);
    await a.votaVariantIsoglossaPoble(VOT);
    await expect(b.lligConsensIsoglossesPoble()).resolves.toEqual([]);
    await a.destroy();
    await expect(a.lligConsensIsoglossesPoble()).rejects.toThrow('Adaptador tancat');
  });
});
