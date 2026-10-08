/* Decisió 4 del Mestre (261007) · «Tall de 50 publicacions: CARREGA
   PROGRESSIVA (LOAD MORE).» La capacitat 'paginacioSeccions' de l'adaptador
   Supabase (content.js, ADR-2026-11-PAGINACIO-SECCIONS): el cursor de conjunt
   de claus (created_at, id), els empats, la codificació del filtre, el final
   del recorregut i el mode de proves sense cap petició. El recorregut de punta
   a punta contra un doble de PostgREST viu a conformitat.test.js. */
import { beforeEach, describe, expect, test, vi } from 'vitest';

const servidor = vi.hoisted(() => ({ mode: 'remote', tenant: '7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7', respostes: new Map(), crides: [] }));
vi.mock('./runtime.js', () => ({
  getResolvedConfig: () => ({ hasSupabaseConfig: true, tenantId: servidor.tenant, runtimeDataMode: servidor.mode }),
  request: vi.fn(async (url, config, opcions = {}) => {
    servidor.crides.push({ url, opcions });
    const resposta = [...servidor.respostes.entries()].find(([patro]) => url.includes(patro))?.[1] ?? { files: [] };
    if (resposta.contentRange !== undefined) opcions.onResponseMetadata?.({ contentRange: resposta.contentRange });
    return structuredClone(resposta.files);
  }),
  buildSeedAppData: vi.fn(async () => ({ feedPosts: [{ id: 'cronica' }], events: [], marketItems: [] })),
  generateUUID: vi.fn(), getCurrentUser: vi.fn(), mapContentRowsToData: vi.fn()
}));
vi.mock('./xat.js', () => ({ enviaMissatge: vi.fn() }));
import { loadMur, loadSeccioPage } from './content.js';
import { request } from './runtime.js';

const TENANT = servidor.tenant;
const id = (n) => `6c7d8e9f-a0b1-4c2d-8e3f-${String(n).padStart(12, '0')}`;
const fila = (n, creat, extra = {}) => ({ id: id(n), title: `P${n}`, created_at: creat, updated_at: creat,
  owner_user_id: 'U', author_org_id: null, payload: { title: `P${n}` }, ...extra });
/* 50 files del Mur de més nova a més vella, amb la data com la servix PostgREST. */
const cinquanta = () => Array.from({ length: 50 }, (_, n) => fila(99 - n, `2026-10-07T10:${String(59 - n).padStart(2, '0')}:00.123456+00:00`));
const cursor = (seccio, creat, n) => JSON.stringify([TENANT, seccio, creat, id(n)]);
const respon = (patro, files, contentRange) => servidor.respostes.set(patro, { files, contentRange });
const cridesA = (patro) => servidor.crides.filter(({ url }) => url.includes(patro));

beforeEach(() => {
  servidor.mode = 'remote';
  servidor.respostes.clear();
  servidor.crides.length = 0;
  request.mockClear();
});

describe('Decisió 4 · loadMur porta el cursor de les seccions que tenen més', () => {
  test('una secció amb més files de les 50 porta el cursor de la seua última fila; les completes, cap', async () => {
    const mur = cinquanta();
    respon('section_id=eq.mur', mur, '0-49/137');
    respon('section_id=eq.events', [fila(1, '2026-10-01T09:00:00+00:00')], '0-0/1');
    respon('section_id=eq.mercat', [], '*/0');
    const valor = await loadMur('U', {});
    expect(valor.feedPosts).toHaveLength(50);
    expect(valor.paginacio).toEqual({ mur: cursor('mur', mur.at(-1).created_at, 50) });
    // El total es demana a les tres seccions; app_content no en necessita.
    for (const seccio of ['mur', 'events', 'mercat']) {
      expect(cridesA(`section_id=eq.${seccio}`)[0].opcions.headers).toEqual({ Prefer: 'count=exact' });
    }
    expect(cridesA('app_content')[0].opcions).not.toHaveProperty('headers');
  });

  test('amb totes les seccions completes, la forma del nucli no canvia: ni tan sols el camp paginacio', async () => {
    respon('section_id=eq.mur', [fila(1, '2026-10-01T09:00:00+00:00')], '0-0/1');
    respon('section_id=eq.events', [], '*/0');
    respon('section_id=eq.mercat', [], '*/0');
    const valor = await loadMur('U', {});
    expect(Object.keys(valor).sort()).toEqual(['events', 'feedPosts', 'marketItems']);
  });

  test('una pàgina de menys de 50 sense total no es dona per completa (el servidor pot tallar abans)', async () => {
    const files = cinquanta().slice(0, 20);
    respon('section_id=eq.mur', files, null);
    expect((await loadMur('U', {})).paginacio).toEqual({ mur: cursor('mur', files.at(-1).created_at, 80) });
  });

  test('el cursor ix de section_submissions, mai d’un element d’app_content', async () => {
    const mur = cinquanta();
    respon('app_content', [{ key: 'feedPosts', payload: [{ id: 'avis-de-l-ajuntament', created_at: '2020-01-01T00:00:00Z' }] }]);
    respon('section_id=eq.mur', mur, '0-49/51');
    const valor = await loadMur('U', {});
    expect(valor.feedPosts.map((element) => element.id)).toContain('avis-de-l-ajuntament');
    expect(JSON.parse(valor.paginacio.mur)).toEqual([TENANT, 'mur', mur.at(-1).created_at, id(50)]);
  });

  test('sense cap fila amb clau fiable no es promet cap pàgina: la primera pàgina es pinta igual', async () => {
    respon('section_id=eq.mur', [fila(1, '2026-10-01T09:00:00+00:00', { id: 'p-sense-uuid' })], '0-0/9');
    const valor = await loadMur('U', {});
    expect(valor.feedPosts.map((element) => element.id)).toEqual(['p-sense-uuid']);
    expect(valor).not.toHaveProperty('paginacio');
  });

  /* Relleu 261008 (revisió adversarial) · created_at el posa el client: una
     cua de files sense clau fiable no apaga el «Mostra més» de tot el poble. */
  test('amb una cua de files sense clau fiable, el cursor ix de l’última que en té', async () => {
    const mur = [...cinquanta().slice(0, 48), fila(2, '-infinity'), fila(1, '0044-03-15T12:00:00+00:00 BC')];
    respon('section_id=eq.mur', mur, '0-49/60');
    const valor = await loadMur('U', {});
    expect(valor.feedPosts).toHaveLength(50);
    expect(valor.paginacio).toEqual({ mur: cursor('mur', mur[47].created_at, 52) });
  });

  test('en mode de proves, loadMur no porta cap paginació ni cap petició', async () => {
    for (const mode of ['seed', 'local']) {
      servidor.mode = mode;
      expect(await loadMur('U', {})).not.toHaveProperty('paginacio');
    }
    expect(request).not.toHaveBeenCalled();
  });
});

describe('Decisió 4 · loadSeccioPage', () => {
  const CREAT = '2026-10-07T10:00:00.123456+00:00';

  test('demana la pàgina següent amb el filtre de conjunt de claus, l’ordre estable, el límit i el total', async () => {
    const senyal = new AbortController().signal;
    respon('section_submissions', [fila(41, CREAT), fila(40, '2026-10-06T08:00:00+00:00')], '0-1/2');
    const pagina = await loadSeccioPage({ seccio: 'mercat', cursor: cursor('mercat', CREAT, 42), signal: senyal }, {});
    expect(pagina).toEqual({ elements: [expect.objectContaining({ id: id(41) }), expect.objectContaining({ id: id(40) })], complete: true, nextCursor: null });
    const [{ url, opcions }] = servidor.crides;
    const params = new URL(url, 'http://poble.test').searchParams;
    expect(params.get('section_id')).toBe('eq.mercat');
    expect(params.get('tenant_id')).toBe(`eq.${TENANT}`);
    expect(params.get('order')).toBe('created_at.desc,id.desc');
    expect(params.get('limit')).toBe('50');
    expect(params.get('or')).toBe(`(created_at.lt."${CREAT}",and(created_at.eq."${CREAT}",id.lt."${id(42)}"))`);
    expect(opcions).toMatchObject({ signal: senyal, headers: { Prefer: 'count=exact' } });
  });

  test('codificació: el «+» del fus, els «:», les cometes i les comes viatgen codificats', async () => {
    await loadSeccioPage({ seccio: 'mur', cursor: cursor('mur', CREAT, 42) }, {});
    const [{ url }] = servidor.crides;
    const cru = url.slice(url.indexOf('&or=') + 4, url.indexOf('&order='));
    expect(cru).not.toMatch(/[+:",]/);
    expect(cru).toContain('%2B00%3A00%22');
    expect(cru).toContain('%2Cand(');
    expect(decodeURIComponent(cru)).toBe(`(created_at.lt."${CREAT}",and(created_at.eq."${CREAT}",id.lt."${id(42)}"))`);
  });

  test('empats: files amb el mateix created_at i id decreixent avancen, i el cursor conserva els microsegons', async () => {
    const files = [fila(41, CREAT), fila(30, CREAT), fila(29, '2026-10-07T10:00:00.123455+00:00')];
    respon('section_submissions', files, '0-2/9');
    const pagina = await loadSeccioPage({ seccio: 'mur', cursor: cursor('mur', CREAT, 42), limit: 3 }, {});
    expect(pagina.complete).toBe(false);
    expect(JSON.parse(pagina.nextCursor)).toEqual([TENANT, 'mur', '2026-10-07T10:00:00.123455+00:00', id(29)]);
  });

  test('una pàgina que no avança (un servidor que ignora el filtre) és un error, mai una pàgina repetida', async () => {
    respon('section_submissions', [fila(42, CREAT)], '0-0/1');
    await expect(loadSeccioPage({ seccio: 'mur', cursor: cursor('mur', CREAT, 42) }, {})).rejects.toThrow('no avança');
    respon('section_submissions', [fila(41, '2026-10-07T10:00:00.123457+00:00')], '0-0/1');
    await expect(loadSeccioPage({ seccio: 'mur', cursor: cursor('mur', CREAT, 42) }, {})).rejects.toThrow('no avança');
  });

  test('sense total, una pàgina plena no és la darrera; una buida sí', async () => {
    respon('section_submissions', [fila(41, CREAT)], null);
    expect(await loadSeccioPage({ seccio: 'mur', cursor: null, limit: 1 }, {}))
      .toMatchObject({ complete: false, nextCursor: cursor('mur', CREAT, 41) });
    respon('section_submissions', [], null);
    expect(await loadSeccioPage({ seccio: 'mur', cursor: null }, {})).toEqual({ elements: [], complete: true, nextCursor: null });
  });

  /* Relleu 261008 (revisió adversarial) · Una fila amb un created_at que no
     casa amb INSTANT ('-infinity', una data aC o un any de cinc xifres, que
     el client pot posar) es pinta igual, però no fa de cursor ni entra en la
     comprovació d'ordre: abans deixava la pàgina en error per a tothom. */
  test('una fila sense clau fiable es pinta igual i el cursor ix de l’última fila que en té', async () => {
    const files = [fila(41, CREAT), fila(40, '2026-10-06T08:00:00+00:00'), fila(39, '-infinity')];
    respon('section_submissions', files, '0-2/9');
    const pagina = await loadSeccioPage({ seccio: 'mur', cursor: cursor('mur', CREAT, 42), limit: 3 }, {});
    expect(pagina.elements.map((element) => element.id)).toEqual([id(41), id(40), id(39)]);
    expect(pagina).toMatchObject({ complete: false, nextCursor: cursor('mur', '2026-10-06T08:00:00+00:00', 40) });
  });

  test('una pàgina només de files sense clau fiable és la darrera: d’ací ja no es pot avançar', async () => {
    const files = [fila(39, '-infinity'), fila(38, '0044-03-15T12:00:00+00:00 BC'), fila(37, '10000-01-01T00:00:00+00:00')];
    respon('section_submissions', files, '0-2/7');
    const pagina = await loadSeccioPage({ seccio: 'mur', cursor: cursor('mur', CREAT, 42), limit: 3 }, {});
    expect(pagina.elements).toHaveLength(3);
    expect(pagina).toMatchObject({ complete: true, nextCursor: null });
  });

  test('una fila sense clau no amaga una pàgina que no avança', async () => {
    respon('section_submissions', [fila(39, '-infinity'), fila(42, CREAT)], '0-1/2');
    await expect(loadSeccioPage({ seccio: 'mur', cursor: cursor('mur', CREAT, 42) }, {})).rejects.toThrow('no avança');
  });

  test('un rang o un total inconsistents són un error', async () => {
    respon('section_submissions', [fila(41, CREAT)], '0-4/9');
    await expect(loadSeccioPage({ seccio: 'mur' }, {})).rejects.toThrow('Rang');
    respon('section_submissions', [fila(41, CREAT), fila(40, '2026-10-06T08:00:00+00:00')], '0-1/1');
    await expect(loadSeccioPage({ seccio: 'mur' }, {})).rejects.toThrow('Total');
  });

  test('les pàgines següents passen pel mateix mapatge: cap clau d’autoritat del payload d’un veí', async () => {
    respon('section_submissions', [fila(41, CREAT, { payload: { title: 'Avís', isSystem: true, mainHref: 'https://fals.example' } })], '0-0/1');
    const [element] = (await loadSeccioPage({ seccio: 'mur' }, {})).elements;
    expect(element).toMatchObject({ id: id(41), title: 'Avís', ownerUserId: 'U' });
    expect(element).not.toHaveProperty('isSystem');
    expect(element).not.toHaveProperty('mainHref');
  });

  test('en mode de proves no hi ha cap pàgina més i no es fa cap petició', async () => {
    for (const mode of ['seed', 'local']) {
      servidor.mode = mode;
      expect(await loadSeccioPage({ seccio: 'mur', cursor: null }, {})).toEqual({ elements: [], complete: true, nextCursor: null });
    }
    expect(request).not.toHaveBeenCalled();
  });

  test.each([
    ['una secció que no es pagina', { seccio: 'notes' }, 'no es pagina'],
    ['la Multimèdia', { seccio: 'multimedia' }, 'no es pagina'],
    ['una clau del prototip', { seccio: 'toString' }, 'no es pagina'],
    ['un límit de més de 50', { seccio: 'mur', limit: 51 }, 'Límit'],
    ['un límit que no és enter', { seccio: 'mur', limit: 1.5 }, 'Límit'],
    ['un cursor d’un altre poble', { seccio: 'mur', cursor: JSON.stringify(['un-altre-poble', 'mur', CREAT, id(1)]) }, 'Cursor'],
    ['un cursor d’una altra secció', { seccio: 'mur', cursor: cursor('mercat', CREAT, 1) }, 'Cursor'],
    ['un cursor amb cometes a la data', { seccio: 'mur', cursor: cursor('mur', '2026-10-07T10:00:00"),id.gt.(0', 1) }, 'Cursor'],
    ['un cursor que no és JSON', { seccio: 'mur', cursor: 'pàgina 2' }, 'Cursor']
  ])('%s rebutja sense cap petició', async (_, opcions, motiu) => {
    await expect(loadSeccioPage(opcions, {})).rejects.toThrow(motiu);
    expect(request).not.toHaveBeenCalled();
  });
});
