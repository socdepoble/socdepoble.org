/* R24 · CODEX-R24-03 · L'adaptador Supabase de 'consensIsoglosses' contra els objectes SQL de
   les migracions R23 (la RPC public.resum_consens_isoglosses_poble i les taules
   public.joc_isoglosses_vots_consens i public.aportacions_veu_poble): la ruta, el cos, les
   capçaleres i el user_id de la sessió de cada crida, i la validació de cada resposta. El
   transport és un doble (cap xarxa); el mateix mapatge el prova sobre PostgreSQL real
   tests/r24-consens-isoglosses-postgres.test.mjs. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { desaSessio, esborraSessio } from '../identitat.js';

const m = vi.hoisted(() => ({ rpc: vi.fn(), request: vi.fn(), mode: 'remote', configurat: true }));
vi.mock('./runtime.js', async () => {
  const { usuariDeSessio } = await import('../identitat.js');
  return {
    rpc: m.rpc, request: m.request, getCurrentUser: () => usuariDeSessio(),
    getResolvedConfig: () => ({ hasSupabaseConfig: m.configurat, runtimeDataMode: m.mode })
  };
});
const { lligConsensIsoglossesPoble, votaVariantIsoglossaPoble, desaAportacioVeuPoble } = await import('./consensIsoglosses.js');

const ANNA = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5';
const BERTA = '2e3f4051-6b7c-4d8e-9fa0-b1c2d3e4f5a6';
const entra = id => expect(desaSessio({ access_token: 'testimoni-sintetic-consens', user: { id } })).toBe(true);
const VOT = Object.freeze({ preguntaId: 'q01_creilla', variantClau: 'querilla', paraulaEtiqueta: 'Querilla', poble: '', comarcaId: 'no_ho_se', abastComarcal: 'no_ho_se' });
const APORTACIO = Object.freeze({ tipus: 'variant_isoglossa', id: 'iso-1763100000000', paraula: '  Creïlla   de secà ', poble: 'La Torre de les Maçanes',
  comarcaId: 'alacanti', comarcaNom: 'L’Alacantí', areaId: 'alacanti_vinalopo', abastComarcal: 'nomes_poble', pobleComarca: 'La Torre de les Maçanes · L’Alacantí',
  preguntaId: 'q01_creilla', opcioVivaId: 'viva:q01_creilla:creilla_de_seca', consentimentArxiuObert: true, consentimentVersio: 'cc-by-sa-4.0-v1',
  consentimentAcceptatAt: '2026-11-14T06:00:00Z' });
const FILA = Object.freeze({ pregunta_id: 'q01_creilla', variant_clau: 'querilla', paraula_etiqueta: 'Querilla', poble_exemple: 'La Torre de les Maçanes', comarca_id: 'alacanti', total_vots: 3 });

beforeEach(() => { m.rpc.mockReset(); m.request.mockReset(); m.mode = 'remote'; m.configurat = true; esborraSessio(); });
afterEach(() => esborraSessio());

describe('lligConsensIsoglossesPoble → RPC resum_consens_isoglosses_poble', () => {
  test('sense arguments (la crida de la targeta): p_pregunta_id null, DTO en camelCase', async () => {
    m.rpc.mockResolvedValue([FILA]);
    await expect(lligConsensIsoglossesPoble()).resolves.toEqual([
      { preguntaId: 'q01_creilla', variantClau: 'querilla', paraula: 'Querilla', poble: 'La Torre de les Maçanes', comarcaId: 'alacanti', vots: 3 }
    ]);
    expect(m.rpc).toHaveBeenCalledTimes(1);
    expect(m.rpc.mock.calls[0].slice(0, 2)).toEqual(['resum_consens_isoglosses_poble', { p_pregunta_id: null }]);
    expect(m.request).not.toHaveBeenCalled();
  });

  test('amb una pregunta, la passa; una pregunta malformada rebutja abans de cap petició', async () => {
    m.rpc.mockResolvedValue([]);
    await lligConsensIsoglossesPoble({ preguntaId: 'q02_espencat' });
    expect(m.rpc.mock.calls[0][1]).toEqual({ p_pregunta_id: 'q02_espencat' });
    m.rpc.mockReset();
    for (const dolenta of [{ preguntaId: 'Q02' }, { preguntaId: "q02'; drop" }, { tenantId: 'x' }, 'q02_espencat', []]) {
      await expect(lligConsensIsoglossesPoble(dolenta)).rejects.toBeInstanceOf(TypeError);
    }
    expect(m.rpc).not.toHaveBeenCalled();
  });

  test('una resposta que no és la de la RPC no es pinta (cap fila a mitges)', async () => {
    for (const dolenta of [null, {}, [{ ...FILA, total_vots: 0 }], [{ ...FILA, variant_clau: 'Querilla' }], [{ ...FILA, user_id: undefined, comarca_id: 'Alacantí' }],
      [{ ...FILA, poble_exemple: undefined }], Array(251).fill(FILA)]) {
      m.rpc.mockResolvedValueOnce(dolenta);
      await expect(lligConsensIsoglossesPoble()).rejects.toBeInstanceOf(TypeError);
    }
  });

  test('min(paraula_etiqueta) d’un vot escrit fora del port no pinta cap text aliè damunt de la variant', async () => {
    m.rpc.mockResolvedValue([{ ...FILA, paraula_etiqueta: 'AAA text ofensiu' }, { ...FILA, variant_clau: 'bajoca_tendra', paraula_etiqueta: 'Bajoca  tendra', comarca_id: 'no_ho_se', poble_exemple: null }]);
    const [primera, segona] = await lligConsensIsoglossesPoble();
    expect(primera.paraula).toBe('querilla');
    expect(segona).toMatchObject({ paraula: 'Bajoca tendra', comarcaId: null, poble: null });
  });

  test('fora del mode remot o sense servidor, cap petició: no-disponible', async () => {
    for (const [mode, configurat] of [['seed', true], ['local', true], ['remote', false]]) {
      m.mode = mode; m.configurat = configurat;
      await expect(lligConsensIsoglossesPoble()).rejects.toMatchObject({ code: 'no-disponible' });
    }
    expect(m.rpc).not.toHaveBeenCalled();
  });

  test('sense la migració (PGRST202) és no-disponible; un altre error es propaga tal qual', async () => {
    m.rpc.mockRejectedValueOnce(Object.assign(new Error('absent'), { status: 404, postgrestCode: 'PGRST202' }));
    await expect(lligConsensIsoglossesPoble()).rejects.toMatchObject({ code: 'no-disponible', status: 404 });
    const error = Object.assign(new Error('Supabase 500'), { status: 500 });
    m.rpc.mockRejectedValueOnce(error);
    await expect(lligConsensIsoglossesPoble()).rejects.toBe(error);
  });
});

describe('votaVariantIsoglossaPoble → INSERT … ON CONFLICT DO NOTHING a joc_isoglosses_vots_consens', () => {
  test('user_id de la sessió, cos en snake_case, sense comarca «no ho sé» ni poble buit', async () => {
    entra(ANNA);
    m.request.mockResolvedValue([{ pregunta_id: 'q01_creilla', variant_clau: 'querilla' }]);
    await expect(votaVariantIsoglossaPoble(VOT)).resolves.toEqual({ preguntaId: 'q01_creilla', variantClau: 'querilla', nou: true });
    expect(m.request).toHaveBeenCalledTimes(1);
    const [ruta, , opcions] = m.request.mock.calls[0];
    expect(ruta).toBe('/rest/v1/joc_isoglosses_vots_consens?on_conflict=user_id,pregunta_id,variant_clau&select=pregunta_id,variant_clau');
    expect(opcions).toMatchObject({ method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=representation' } });
    expect(opcions.body).toEqual([{ user_id: ANNA, pregunta_id: 'q01_creilla', variant_clau: 'querilla', paraula_etiqueta: 'Querilla', poble: null, comarca_id: null, abast_comarcal: 'no_ho_se' }]);
  });

  test('el vot repetit (cap fila tornada) no és un vot nou', async () => {
    entra(ANNA);
    m.request.mockResolvedValue([]);
    await expect(votaVariantIsoglossaPoble(VOT)).resolves.toMatchObject({ nou: false });
  });

  test('sense sessió, cap petició (401 sense-sessio); cap autoria ni etiqueta aliena del client', async () => {
    await expect(votaVariantIsoglossaPoble(VOT)).rejects.toMatchObject({ code: 'sense-sessio', status: 401 });
    entra(ANNA);
    for (const dolent of [{ ...VOT, userId: BERTA }, { ...VOT, user_id: BERTA }, { ...VOT, paraulaEtiqueta: 'Insult' }, { ...VOT, abastComarcal: 'tot_el_mon' }, { ...VOT, comarcaId: 'Alacantí' }, null]) {
      await expect(votaVariantIsoglossaPoble(dolent)).rejects.toBeInstanceOf(TypeError);
    }
    expect(m.request).not.toHaveBeenCalled();
  });

  test('si la sessió canvia durant la petició, el rebut no ix', async () => {
    entra(ANNA);
    m.request.mockImplementation(async () => { entra(BERTA); return [{ pregunta_id: 'q01_creilla', variant_clau: 'querilla' }]; });
    await expect(votaVariantIsoglossaPoble(VOT)).rejects.toMatchObject({ name: 'AbortError' });
  });

  test('sense la taula (PGRST205) és no-disponible; una resposta d’una altra variant és invàlida', async () => {
    entra(ANNA);
    m.request.mockRejectedValueOnce(Object.assign(new Error('absent'), { status: 404, postgrestCode: 'PGRST205' }));
    await expect(votaVariantIsoglossaPoble(VOT)).rejects.toMatchObject({ code: 'no-disponible' });
    m.request.mockResolvedValueOnce([{ pregunta_id: 'q01_creilla', variant_clau: 'queraella' }]);
    await expect(votaVariantIsoglossaPoble(VOT)).rejects.toBeInstanceOf(TypeError);
  });
});

describe('desaAportacioVeuPoble → INSERT a aportacions_veu_poble', () => {
  test('el registre de la targeta: user_id de la sessió, consentiment literal i cap camp de presentació', async () => {
    entra(ANNA);
    m.request.mockResolvedValue([{ id: '10000000-0000-4000-8000-0000000000AA', estat_moderacio: 'pendent', created_at: '2026-11-14T06:00:01+00:00' }]);
    await expect(desaAportacioVeuPoble(APORTACIO)).resolves.toEqual({ id: '10000000-0000-4000-8000-0000000000aa', estatModeracio: 'pendent', creatA: '2026-11-14T06:00:01+00:00' });
    const [ruta, , opcions] = m.request.mock.calls[0];
    expect(ruta).toBe('/rest/v1/aportacions_veu_poble?select=id,estat_moderacio,created_at');
    expect(opcions).toMatchObject({ method: 'POST', headers: { Prefer: 'return=representation' } });
    expect(opcions.body).toEqual([{ user_id: ANNA, tipus: 'variant_isoglossa', pregunta_id: 'q01_creilla', text_aportat: 'Creïlla de secà',
      poble_comarca: 'La Torre de les Maçanes · L’Alacantí', poble: 'La Torre de les Maçanes', comarca_id: 'alacanti', abast_comarcal: 'nomes_poble',
      consentiment_arxiu_obert: true, consentiment_versio: 'cc-by-sa-4.0-v1', consentiment_acceptat_at: '2026-11-14T06:00:00.000Z' }]);
    expect(JSON.stringify(opcions.body)).not.toMatch(/estat_moderacio|comarcaNom|areaId|opcioVivaId|iso-1763/);
  });

  test('sense consentiment, amb àudio o amb autoria del client, cap petició', async () => {
    entra(ANNA);
    for (const dolenta of [{ ...APORTACIO, consentimentArxiuObert: false }, { ...APORTACIO, consentimentVersio: 'cc-by-4.0' }, { ...APORTACIO, consentimentAcceptatAt: 'ahir' },
      { ...APORTACIO, tipus: 'refrany_audio' }, { refranyId: 'r1', textRefrany: 'Refrany', pobleComarca: 'Poble', blob: new Blob(['x']) },
      { ...APORTACIO, userId: BERTA }, { ...APORTACIO, estatModeracio: 'aprovat' }, { ...APORTACIO, paraula: 'x' }, { ...APORTACIO, pobleComarca: '', poble: '' }]) {
      await expect(desaAportacioVeuPoble(dolenta)).rejects.toBeInstanceOf(TypeError);
    }
    expect(m.request).not.toHaveBeenCalled();
    esborraSessio();
    await expect(desaAportacioVeuPoble(APORTACIO)).rejects.toMatchObject({ code: 'sense-sessio' });
  });

  test('una resposta que no és pendent de moderació no s’accepta com a rebut', async () => {
    entra(ANNA);
    m.request.mockResolvedValue([{ id: '10000000-0000-4000-8000-0000000000aa', estat_moderacio: 'aprovat', created_at: '2026-11-14T06:00:01Z' }]);
    await expect(desaAportacioVeuPoble(APORTACIO)).rejects.toBeInstanceOf(TypeError);
  });
});
