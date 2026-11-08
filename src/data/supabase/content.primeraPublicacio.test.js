/* IDEA-116 (Onada R9, carril C2) · En remot, la primera publicació del Mur
   («Noves tecnologies aplicades a la cultura rural») entra amb la llavor
   editorial del Mur, com l'acte de pedra en sec amb l'Aplec: on app_content
   porta el Manifest, hi és; on no, no s'hi inventa; si un dia és a
   app_content, mana la d'app_content (i la seua versió per a la RPC). */
import { beforeEach, describe, expect, test, vi } from 'vitest';

const servidor = vi.hoisted(() => ({ respostes: new Map() }));
vi.mock('./runtime.js', () => ({
  getResolvedConfig: () => ({ hasSupabaseConfig: true, tenantId: '7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7', runtimeDataMode: 'remote' }),
  request: vi.fn(async (url) => structuredClone([...servidor.respostes.entries()].find(([patro]) => url.includes(patro))?.[1] ?? [])),
  buildSeedAppData: vi.fn(async () => ({ feedPosts: [], events: [], marketItems: [] })),
  generateUUID: vi.fn(), getCurrentUser: vi.fn(), mapContentRowsToData: vi.fn()
}));
vi.mock('./xat.js', () => ({ enviaMissatge: vi.fn() }));
import { loadMur } from './content.js';
import { NOVES_TECNOLOGIES_CULTURA_RURAL_POST as POST } from '../../sections/mur/articles/novesTecnologiesCulturaRuralContent.js';

const MANIFEST = { id: 'manifest-de-poble', title: 'Manifest de Poble', created_at: '2022-11-17T23:50:00+01:00' };
const appContent = (feedPosts, versio = 7, events = []) => [{ key: 'feedPosts', payload: feedPosts, version: versio }, { key: 'events', payload: events, version: 2 }];

beforeEach(() => { servidor.respostes.clear(); });

describe('loadMur en remot', () => {
  test('amb la llavor editorial (el Manifest), hi entra la primera publicació, amb la seua data real', async () => {
    servidor.respostes.set('app_content', appContent([MANIFEST]));
    const { feedPosts } = await loadMur('U', {});
    const nostra = feedPosts.find((item) => item.id === POST.id);
    expect(nostra).toMatchObject({ id: POST.id, title: POST.title, created_at: '2026-11-07T21:20:00+01:00' });
    // Cap versió d'app_content: la revisió des de /notes es queda al navegador i ho diu (revisionsEditorials.js).
    expect(nostra._editorialVersio).toBeUndefined();
    expect(feedPosts.find((item) => item.id === 'manifest-de-poble')).toMatchObject({ _editorialClau: 'feedPosts', _editorialVersio: 7 });
  });

  test('amb l’Aplec a l’agenda i sense el Manifest al Mur (com es veu producció el 06-11-2026), també hi entra', async () => {
    servidor.respostes.set('app_content', appContent([{ id: 'una-altra', title: 'Una altra' }], 7, [{ id: 'aplec-2023', title: '2n Aplec pel Territori' }]));
    const { feedPosts } = await loadMur('U', {});
    expect(feedPosts.map((item) => item.id)).toEqual([POST.id, 'una-altra']);
  });

  test('sense la llavor editorial (un altre poble), no s’hi afig res', async () => {
    servidor.respostes.set('app_content', appContent([{ id: 'una-altra', title: 'Una altra' }]));
    const { feedPosts } = await loadMur('U', {});
    expect(feedPosts.map((item) => item.id)).toEqual(['una-altra']);
  });

  test('si app_content ja la porta (amb la data de la llavor o una de més nova), mana la d’app_content (i la seua versió)', async () => {
    servidor.respostes.set('app_content', appContent([MANIFEST, { id: POST.id, title: 'Títol revisat al servidor', created_at: POST.created_at }], 9));
    const { feedPosts } = await loadMur('U', {});
    const nostres = feedPosts.filter((item) => item.id === POST.id);
    expect(nostres).toHaveLength(1);
    expect(nostres[0]).toMatchObject({ title: 'Títol revisat al servidor', _editorialVersio: 9 });
  });
});
