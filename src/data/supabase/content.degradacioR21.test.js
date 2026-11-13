/* Gauntlet R22 · El Mur amb un servidor que encara no té les migracions de R21
   (dades-01) i el drenatge de retirades fora del camí de lectura (dades-03).
   Un servidor sense la funció respon 404 PGRST202: el Mur, el Mercat i
   l'Agenda continuen amb la lectura que eixe servidor fa (la mínima de
   llig_mur_public o, sense cap migració, la de section_submissions d'abans),
   i cap altre error no es disfressa de servidor antic. */
import { beforeEach, describe, expect, test, vi } from 'vitest';

const servidor = vi.hoisted(() => ({ usuari: null, absents: new Set(), files: new Map(), rangs: new Map(), crides: [], drena: null, errorTaula: null }));
vi.mock('./runtime.js', () => ({
  getResolvedConfig: () => ({ hasSupabaseConfig: true, tenantId: '7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7', runtimeDataMode: 'remote' }),
  request: vi.fn(async (url, config, opcions = {}) => {
    servidor.crides.push({ url, opcions });
    const rpc = /\/rpc\/(llig_mur_\w+)\?/.exec(url)?.[1];
    if (rpc && servidor.absents.has(rpc)) {
      throw Object.assign(new Error('Supabase 404: {"code":"PGRST202"}'), { status: 404, postgrestCode: 'PGRST202' });
    }
    if (url.includes('app_content')) return [];
    const seccio = /p_section_id=(\w+)|section_id=eq\.(\w+)/.exec(url);
    const clau = seccio?.[1] || seccio?.[2];
    if (url.includes('/rest/v1/section_submissions')) {
      if (servidor.errorTaula) throw servidor.errorTaula;
      opcions.onResponseMetadata?.({ contentRange: servidor.rangs.get(clau) ?? null });
    }
    const files = structuredClone(servidor.files.get(clau) ?? []);
    return rpc === 'llig_mur_membres' ? { lectura: 'membre', files } : files;
  }),
  buildSeedAppData: vi.fn(), generateUUID: vi.fn(), mapContentRowsToData: vi.fn(),
  getCurrentUser: () => (servidor.usuari ? { id: servidor.usuari } : null)
}));
vi.mock('./xat.js', () => ({ enviaMissatge: vi.fn() }));
vi.mock('./copublicacioMur.js', () => ({
  drenaRevocacionsMur: vi.fn(() => servidor.drena?.() ?? Promise.resolve({ pendents: 0, seguentIntent: null })),
  comprovaPublicacioNoRetirada: vi.fn()
}));
import { loadMur, loadMultimedia, loadSeccioPage } from './content.js';

const TENANT = '7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7';
const UID = '0f1e2d3c-4b5a-4968-8776-655443322110';
const id = n => `6c7d8e9f-a0b1-4c2d-8e3f-${String(n).padStart(12, '0')}`;
const creat = n => `2026-11-0${n}T10:00:00.000000+00:00`;
/* Una fila de section_submissions tal com la servia el servidor d'abans. */
const filaTaula = n => ({ id: id(n), title: `Crònica ${n}`, created_at: creat(n), updated_at: creat(n), owner_user_id: UID, author_org_id: null,
  payload: { title: `Crònica ${n}`, content: '<p>Cos sencer</p>', author_name: 'Veïna', image: 'sdp-media://mitjans/x.webp' } });
/* Una fila de la lectura mínima (llig_mur_public). */
const filaPublica = n => ({ id: id(n), tenant_id: TENANT, section_id: 'mur', title: `Crònica ${n}`, description: '', public_content: 'Cos públic', created_at: creat(n), updated_at: creat(n) });
const cridesA = patro => servidor.crides.filter(({ url }) => url.includes(patro));
const absent = (...noms) => noms.forEach(nom => servidor.absents.add(nom));

beforeEach(() => {
  servidor.usuari = null; servidor.absents.clear(); servidor.files.clear(); servidor.rangs.clear();
  servidor.crides.length = 0; servidor.drena = null; servidor.errorTaula = null;
});

describe('dades-01 · un servidor sense les RPC de R21 no deixa el Mur en error', () => {
  test('visitant sense llig_mur_public: la lectura d’abans de section_submissions, amb l’autoria de les columnes', async () => {
    absent('llig_mur_public', 'llig_mur_membres');
    servidor.files.set('mur', [filaTaula(2), filaTaula(1)]);
    servidor.rangs.set('mur', '0-1/2');
    const valor = await loadMur('U', {});
    expect(valor.feedPosts.map(element => element.id)).toEqual([id(2), id(1)]);
    expect(valor.feedPosts[0]).toMatchObject({ ownerUserId: UID, title: 'Crònica 2' });
    // El rang amb total diu que la secció és completa: cap «Mostra més».
    expect(valor).not.toHaveProperty('paginacio');
    const [taula] = cridesA('/rest/v1/section_submissions?');
    expect(taula.url).toContain('section_id=eq.mur');
    expect(taula.url).toContain('order=created_at.desc,id.desc');
    expect(taula.opcions.headers).toEqual({ Prefer: 'count=exact' });
  });

  test('membre amb només 2611121430 (sense llig_mur_membres): la lectura mínima com a visitant, mai la taula', async () => {
    servidor.usuari = UID;
    absent('llig_mur_membres');
    servidor.files.set('mur', [filaPublica(1)]);
    const valor = await loadMur('U', {});
    expect(valor.feedPosts.map(element => element.id)).toEqual([id(1)]);
    expect(valor.feedPosts[0].ownerUserId ?? null).toBeNull();
    expect(cridesA('/rpc/llig_mur_public?p_tenant_id').every(({ opcions }) => opcions.anonim === true)).toBe(true);
    expect(cridesA('/rest/v1/section_submissions?')).toHaveLength(0);
  });

  test('membre sense cap RPC de R21: la lectura d’abans, i Multimèdia tampoc no cau', async () => {
    servidor.usuari = UID;
    absent('llig_mur_membres', 'llig_mur_public');
    servidor.files.set('multimedia', [filaTaula(3)]);
    servidor.rangs.set('multimedia', '0-0/1');
    expect((await loadMultimedia('U', {})).mediaItems.map(element => element.id)).toEqual([id(3)]);
  });

  test('la pàgina següent de la lectura d’abans porta el filtre de conjunt de claus i el final del rang', async () => {
    absent('llig_mur_public');
    servidor.files.set('mur', [filaTaula(1)]);
    servidor.rangs.set('mur', '0-0/1');
    const pagina = await loadSeccioPage({ seccio: 'mur', cursor: JSON.stringify([TENANT, 'mur', creat(2), id(2)]) }, {});
    expect(pagina).toMatchObject({ complete: true, nextCursor: null });
    expect(pagina.elements.map(element => element.id)).toEqual([id(1)]);
    const url = cridesA('/rest/v1/section_submissions?')[0].url;
    expect(decodeURIComponent(new URL(url, 'http://poble.test').searchParams.get('or'))).toContain(`created_at.lt."${creat(2)}"`);
  });

  test('cap altre error es pren per un servidor antic: un 404 genèric, PGRST205 o un 401 continuen sent errors', async () => {
    const { request } = await import('./runtime.js');
    for (const error of [Object.assign(new Error('404'), { status: 404 }), Object.assign(new Error('404'), { status: 404, postgrestCode: 'PGRST205' }), Object.assign(new Error('401'), { status: 401 })]) {
      servidor.crides.length = 0;
      request.mockImplementationOnce(async (url) => { if (url.includes('app_content')) return []; throw error; });
      request.mockImplementationOnce(async () => { throw error; });
      request.mockImplementationOnce(async () => { throw error; });
      request.mockImplementationOnce(async () => { throw error; });
      await expect(loadMur('U', {})).rejects.toBe(error);
    }
  });

  test('si la lectura d’abans tampoc no està permesa (la migració ja ha tancat la taula), l’error es diu', async () => {
    absent('llig_mur_public');
    servidor.errorTaula = Object.assign(new Error('Supabase 401'), { status: 401 });
    await expect(loadMur('U', {})).rejects.toMatchObject({ status: 401 });
  });
});

describe('dades-03 · el drenatge de retirades no bloqueja la lectura del Mur', () => {
  test('amb una retirada pendent que no respon, loadMur llig igualment i acaba', async () => {
    servidor.drena = () => new Promise(() => {});
    servidor.files.set('mur', [filaPublica(1)]);
    const valor = await loadMur('U', {});
    expect(cridesA('/rpc/llig_mur_public?')).toHaveLength(3);
    expect(valor.feedPosts).toBeDefined();
    const { drenaRevocacionsMur } = await import('./copublicacioMur.js');
    expect(drenaRevocacionsMur).toHaveBeenCalled();
  }, 2000);

  test('un drenatge que falla no afecta la lectura', async () => {
    servidor.drena = () => Promise.reject(Object.assign(new Error('offline'), { revocacioPendent: true }));
    servidor.files.set('mur', [filaPublica(1)]);
    expect((await loadMur('U', {})).feedPosts.map(element => element.id)).toContain(id(1));
  });
});
