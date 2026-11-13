/* R22.1 · Gauntlet r221-dades-01 i r221-text-01/-03 · En remot, els productes
   del Mercat són els d'app_content, tal qual: el client no hi posa cap vídeo
   ni cap portada per autoria (author_org_id de l'organització que signa), ni
   hi injecta cap producte de llavor quan el poble té la llavor editorial. Si
   el Mestre vol un vídeo en un producte, l'escriu un SQL revisat a eixa fila.
   Gauntlet R22.1 · Dades SINTÈTIQUES: una organització fictícia amb un UUID
   de prova, sense noms, preus ni mitjans de cap negoci real. */
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

const ORG_ID = '00000000-0000-4000-8000-0000000000c1';
/* La forma d'una fila del Mercat signada per una organització: author_org_id, sense video_url. */
const CAIXA = Object.freeze({ id: 'cooperativa-sintetica-caixa-3', title: 'Cooperativa Sintètica · Caixa de 3 unitats', price: '9,99 €',
  author_org_id: ORG_ID, image_url: '/assets/mercat/caixa.webp', images: ['/assets/mercat/caixa.webp'] });
const SENSE_FOTO = Object.freeze({ id: 'cooperativa-sintetica-mostra', title: 'Cooperativa Sintètica · Mostra', price: '1,23 €',
  author_org_id: ORG_ID, author_id: 'cooperativa-sintetica' });
const MANIFEST = Object.freeze({ id: 'manifest-de-poble', title: 'Manifest de Poble', created_at: '2022-11-17T23:50:00+01:00' });
const appContent = (marketItems) => [
  { key: 'feedPosts', payload: [MANIFEST], version: 7 },
  { key: 'events', payload: [{ id: 'aplec-2023', title: '2n Aplec pel Territori' }], version: 2 },
  { key: 'marketItems', payload: marketItems, version: 5 },
];

beforeEach(() => { servidor.respostes.clear(); });

describe('loadMur en remot · el Mercat d’app_content, tal qual', () => {
  test('les fitxes signades per una organització no reben cap vídeo, portada ni imatge que la fila no porte', async () => {
    servidor.respostes.set('app_content', appContent([CAIXA, SENSE_FOTO]));
    const { marketItems } = await loadMur('U', {});
    const caixa = marketItems.find((item) => item.id === CAIXA.id);
    const petita = marketItems.find((item) => item.id === SENSE_FOTO.id);
    expect(Object.hasOwn(caixa, 'video_url')).toBe(false);
    expect(caixa.image_url).toBe(CAIXA.image_url);
    expect(Object.hasOwn(petita, 'video_url')).toBe(false);
    for (const camp of ['image_url', 'imageSrc', 'images']) expect(Object.hasOwn(petita, camp), camp).toBe(false);
  });

  test('amb la llavor editorial i sense cap producte de l’organització, no torna cap producte de llavor', async () => {
    servidor.respostes.set('app_content', appContent([{ id: 'mel-serra', title: 'Mel de la serra', price: '6,00 €' }]));
    expect((await loadMur('U', {})).marketItems.map((item) => item.id)).toEqual(['mel-serra']);
    servidor.respostes.set('app_content', appContent([]));
    expect((await loadMur('U', {})).marketItems).toEqual([]);
  });

  test('un video_url que la fila sí que porta (escrit per SQL) arriba tal qual', async () => {
    const ambVideo = { ...CAIXA, video_url: 'https://socdepoble.org/media/video-de-la-fila.mp4' };
    servidor.respostes.set('app_content', appContent([ambVideo]));
    const [fitxa] = (await loadMur('U', {})).marketItems;
    expect(fitxa.video_url).toBe('https://socdepoble.org/media/video-de-la-fila.mp4');
  });
});
