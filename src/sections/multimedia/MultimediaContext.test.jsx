/* Onada 0.3 (Gauntlet 261016, M03 i I35; MCR 261016, b03_multimedia.2) ·
   MultimediaProvider: el que porta el port, davant i tal qual; darrere, les
   fotos vives del Mur, el Mercat, l'Agenda i els Pobles que els proveïdors
   que l'embolcallen ja tenen (deduplicades per id i per src, només les
   pròpies); i la Cronologia calculada (abans es llegia
   payload.mediaTimelineGroups, que no existix, i era sempre buida). */
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({
  recurs: { status: 'ready', payload: null, error: null, errorRevalidacio: null, refresh: () => {} },
  mur: { feedPosts: [], marketItems: [], events: [] },
  core: { towns: [] }
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: 'A', actorKey: 'A' }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: { id: 'u' } }) }));
vi.mock('../../app/contexts/useScopedResource.js', () => ({ useScopedResource: () => m.recurs }));
vi.mock('../../app/contexts/useRecarregaExterna.jsx', () => ({ useRecarregaExterna: () => {} }));
vi.mock('../../data/backendPort.js', () => ({ loadMultimedia: async () => ({}) }));
vi.mock('../mur/MurContext.jsx', () => ({ useMur: () => m.mur }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => m.core }));
import { MultimediaProvider, useMultimedia } from './MultimediaContext.jsx';

const wrapper = ({ children }) => <MultimediaProvider config={{}}>{children}</MultimediaProvider>;
const pinta = () => renderHook(() => useMultimedia(), { wrapper });

const DEL_PORT = [
  { id: 'nano-mur', title: 'Mur', src: '/assets/nano_cards/mur_nano_card.jpg', created_at: '2023-01-01T00:00:00Z' },
  { id: 'market-0', title: 'Mac Mini', src: '/assets/uploads/brain/mac_mini_m4_1787721966622.jpg', created_at: '2026-02-15T12:00:00.000Z' }
];

beforeEach(() => {
  m.recurs = { status: 'ready', payload: { mediaItems: DEL_PORT }, error: null, errorRevalidacio: null, refresh: () => {} };
  m.mur = { feedPosts: [], marketItems: [], events: [] };
  m.core = { towns: [] };
});
afterEach(() => vi.clearAllMocks());

describe('les fotos vives', () => {
  test('el port davant i tal qual; darrere, les fotos dels articles vius que no hi són (per id i per src)', () => {
    m.mur = {
      feedPosts: [
        { id: 'p1', title: 'Fira', image_url: '/assets/fira.jpg', created_at: '2026-09-02T10:00:00.000Z' },
        { id: 'p2', title: 'Sense foto' }
      ],
      marketItems: [{ id: 'mac-mini-m4', title: 'Mac Mini', images: ['/assets/uploads/brain/mac_mini_m4_1787721966622.jpg'] }],
      events: [{ id: 'aplec', title: 'Aplec', image_url: '/assets/events/cartell.jpg', author_avatar: '/assets/logo.png' }]
    };
    m.core = { towns: [{ id: 'tibi', title: 'Tibi', image_url: '/assets/towns/tibi/1.jpg' }, { id: 'buit', title: 'Sense foto' }] };
    const { result } = pinta();
    expect(result.current.mediaItems.slice(0, 2)).toEqual(DEL_PORT);
    expect(result.current.mediaItems[0]).toBe(DEL_PORT[0]);
    expect(result.current.mediaItems.map((item) => item.id)).toEqual(['nano-mur', 'market-0', 'feed-p1', 'event-aplec', 'town-tibi']);
    expect(result.current.mediaItems.find((item) => item.id === 'event-aplec').article).toEqual({ sectionId: 'events', id: 'aplec' });
  });

  test('privadesa: cap foto viva de tercers ni cap sdp-media:// (la resol el port, no un <img>)', () => {
    m.mur = {
      feedPosts: [
        { id: 'fora', title: 'Fora', image_url: 'https://rastreig.example/p.jpg' },
        { id: 'opac', title: 'Opac', image_url: 'sdp-media://mitjans/poble/u/mur/a.webp' },
        { id: 'propia', title: 'Pròpia', image_url: '/assets/propia.jpg' }
      ],
      marketItems: [],
      events: []
    };
    const { result } = pinta();
    expect(result.current.mediaItems.map((item) => item.id)).toEqual(['nano-mur', 'market-0', 'feed-propia']);
  });

  /* Revisió adversarial del 261016 · La fila remota de producció (d'abans de
     l'Onada 12): market-0 amb la foto de perfil de qui ven i market-1 amb el
     logotip, sense `article`. Amb el Mercat viu, cada article una vegada, amb
     la seua foto i el seu article; sense, cap logotip ni cap avatar. */
  test('la fila remota rància: la foto viva del mateix article la substituïx al seu lloc; sense viva, ni el logotip ni l’avatar', () => {
    const remot = [
      { id: 'market-0', title: 'Mac Mini Apple M4', src: '/assets/uploads/gent/javi-llinares/avatars/javi-llinares-perfil-1200px.jpg', tag: 'Mercat', created_at: '2026-02-15T12:00:00.000Z' },
      { id: 'market-1', title: 'Samarreta Sóc de Poble', src: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg', tag: 'Mercat', created_at: '2026-02-20T12:00:00.000Z' },
      { id: 'town-tibi', title: 'Tibi', src: '/assets/towns/tibi/1.jpg', tag: 'Poble', article: { sectionId: 'pobles', id: 'tibi' } }
    ];
    m.recurs = { ...m.recurs, payload: { mediaItems: remot } };
    m.mur = {
      feedPosts: [],
      marketItems: [
        { id: 'mac-mini-m4', title: 'Mac Mini Apple M4', seller: 'Javi Llinares', avatar_url: '/assets/uploads/gent/javi-llinares/avatars/javi-llinares-perfil-1200px.jpg', images: ['/assets/uploads/brain/mac_mini_m4_1787721966622.jpg'], created_at: '2026-02-15T12:00:00.000Z' },
        { id: 'samarreta-socdepoble', title: 'Samarreta Sóc de Poble', seller: 'Sóc de Poble', images: ['/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/01-chica-jersey.png'], created_at: '2026-02-20T12:00:00.000Z' }
      ],
      events: []
    };
    const { result } = pinta();
    expect(result.current.mediaItems.map((item) => [item.id, item.article])).toEqual([
      ['market-mac-mini-m4', { sectionId: 'mercat', id: 'mac-mini-m4' }],
      ['market-samarreta-socdepoble', { sectionId: 'mercat', id: 'samarreta-socdepoble' }],
      ['town-tibi', { sectionId: 'pobles', id: 'tibi' }]
    ]);
    m.mur = { feedPosts: [], marketItems: [], events: [] };
    expect(pinta().result.current.mediaItems.map((item) => item.id)).toEqual(['town-tibi']);
  });

  test('sense mediaItems al payload, les vives; mentre carrega o amb error, res', () => {
    m.mur = { feedPosts: [{ id: 'p1', image_url: '/assets/fira.jpg' }], marketItems: [], events: [] };
    m.recurs = { ...m.recurs, payload: {} };
    expect(pinta().result.current.mediaItems.map((item) => item.id)).toEqual(['feed-p1']);
    for (const status of ['loading', 'error']) {
      m.recurs = { ...m.recurs, status, payload: null };
      const { result } = pinta();
      expect(result.current.mediaItems, status).toEqual([]);
      expect(result.current.mediaTimelineGroups, status).toEqual([]);
    }
  });
});

describe('la Cronologia', () => {
  test('es calcula dels mitjans (no de payload.mediaTimelineGroups): per mes, del més nou al més vell, i «Sense data» al final', () => {
    m.recurs = {
      ...m.recurs,
      payload: { mediaItems: [...DEL_PORT, { id: 'sense', src: '/assets/x.jpg' }], mediaTimelineGroups: [{ key: 'fals', label: 'Fals', items: [] }] }
    };
    m.mur = { feedPosts: [{ id: 'p1', image_url: '/assets/fira.jpg', created_at: '2026-09-02T10:00:00.000Z' }], marketItems: [], events: [] };
    const { result } = pinta();
    expect(result.current.mediaTimelineGroups.map((grup) => [grup.key, grup.items.map((item) => item.id)])).toEqual([
      ['2026-09', ['feed-p1']],
      ['2026-02', ['market-0']],
      ['2023-01', ['nano-mur']],
      ['sense-data', ['sense']]
    ]);
  });
});

describe('memòria', () => {
  test('amb les mateixes llistes, el mateix valor: els consumidors no es tornen a pintar', () => {
    m.mur = { feedPosts: [{ id: 'p1', image_url: '/assets/fira.jpg' }], marketItems: [], events: [] };
    const { result, rerender } = pinta();
    const primer = result.current;
    rerender();
    expect(result.current).toBe(primer);
    m.mur = { ...m.mur, feedPosts: [{ id: 'p2', image_url: '/assets/nova.jpg' }] };
    rerender();
    expect(result.current).not.toBe(primer);
    expect(result.current.mediaItems.map((item) => item.id)).toContain('feed-p2');
  });
});
