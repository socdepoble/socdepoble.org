/**
 * Ordre E del Mestre (261007, prompt 261007_1628: «no es pot posar el logotip
 * damunt de l'H1») · El logotip que la persona puja a l'editor de Notes
 * arriba a la publicació com a logo_image i la pàgina publicada el pinta
 * damunt de l'H1 (PageFrame, via c: logoEntitat):
 *  · paginaDElement el porta si es pot pintar sense el port i és segur (el
 *    filtre de l'avatar de capçalera de PageFrame), davant de la marca de
 *    sèrie; mai la marca de Sóc de Poble, ni un «javascript:» ni un «//…»;
 *  · useLogoEntitatDElement hi afig el sdp-media://, resolt pel port, i diu
 *    quan encara el resol (carregant): mentrestant, cap avatar redó;
 *  · /mur/:id (ItemDetailSection) el pinta; sense logo_image, la capçalera de
 *    sempre (Llei del Píxel).
 */
import React from 'react';
import { act, cleanup, render, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sectionId: 'mur', itemId: null, navigate: vi.fn(), t: (_, alternativa) => alternativa,
  mur: { status: 'ready', events: [], feedPosts: [], marketItems: [] },
  sessio: { currentUser: null, estat: 'fora', rol: null, esSuperadmin: false },
  capacitats: new Set(), resol: vi.fn()
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ sectionId: mocks.sectionId, itemId: mocks.itemId }),
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: `/${mocks.sectionId}/${mocks.itemId}`, state: null }),
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', towns: [] }) }));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ notes: [] }) }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ status: 'ready', mediaItems: [] }) }));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActions: () => ({ t: mocks.t })
}));
/* El doble de la Sessió de les altres proves del detall (ItemDetailSection.capcalera.test.jsx). */
vi.mock('../../app/contexts/SessionContext', () => ({
  ESTAT: Object.freeze({ COMPROVANT: 'comprovant', DINS: 'dins', FORA: 'fora' }),
  useSession: () => mocks.sessio,
  useSessioOpcional: () => mocks.sessio
}));
vi.mock('../../hooks/useSEO.js', () => ({ useSEO: () => {} }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (capacitat) => mocks.capacitats.has(capacitat),
  resolveAsset: (...args) => mocks.resol(...args)
}));

import ItemDetailSection from './ItemDetailSection.jsx';
import { logoEntitatDElement, paginaDElement, useLogoEntitatDElement } from './elementDeSeccio.js';
import { buildMercatDetailSectionMeta, buildMurDetailSectionMeta } from './detailSectionMeta.jsx';
import { DEFAULT_AUTHOR } from '../../components/universal/UniversalUtils.js';
import { rutaDePerfilDAutor } from '../../config/navigation.js';
import { ENTITAT_PILOT_SLUG } from '../../data/identitatsSeed.js';
import { permetOrigenMitjans } from '../../utils/sanitize.js';

const LOGO = '/assets/uploads/empresa/forn/logo-forn.png';
const QUADRAT_VERD = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
const LOGO_NEGRE = '/assets/system/ui/logo-socdepoble-rect-negre.svg';
const LOGO_BLANC = '/assets/system/ui/logo-socdepoble-rect-blanc.svg';
const PUBLIC = 'https://mitjans.poble.test/storage/v1/object/public/mitjans/forn/logo.webp';
const CREAT = '2026-09-01T10:00:00.000Z';
const mur = buildMurDetailSectionMeta({ feedPosts: [], t: mocks.t });
const mercat = buildMercatDetailSectionMeta({ marketItems: [], t: mocks.t });

/* Decisió 3 del Mestre (261007, confirmada) · El Storage de proves és el
   NOSTRE servidor de mitjans: el registra la configuració (runtime.js), com
   en producció. També la URL que torna el doble del port (PUBLIC). */
permetOrigenMitjans(PUBLIC);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.capacitats = new Set();
});
afterEach(cleanup);

describe('paginaDElement: el logotip propi (logo_image), net i davant de la marca de sèrie', () => {
  /* Decisió 3 del Mestre (261007, confirmada: «Imatges externes al Mur:
     PROHIBIDES (PRIVACITAT)») · Abans valia «una URL https» qualsevol; ara,
     només la del nostre servidor de mitjans (revisió adversarial del 261007). */
  test('un camí propi o una URL https del nostre servidor de mitjans: logoEntitat { clar, alt }', () => {
    expect(paginaDElement(mur, { id: 'p', title: 'Pa', author_name: 'Forn', author_org_id: 'forn', logo_image: LOGO }).logoEntitat)
      .toEqual({ clar: LOGO, alt: '' });
    expect(logoEntitatDElement({ logo_image: ` ${PUBLIC} ` })).toEqual({ clar: PUBLIC, alt: '' });
  });

  test('Decisió 3 · un logotip d’un servidor de fora (també un avatar de Google) no es demana', () => {
    for (const deFora of ['https://rastreig.example/l.png', 'https://lh3.googleusercontent.com/a/x.png', '/\\rastreig.example/l.png',
      'data:image/svg+xml;base64,PHN2Zz4=']) {
      expect(logoEntitatDElement({ logo_image: deFora }), deFora).toBeNull();
      const pagina = paginaDElement(mur, { id: 'p', title: 'Pa', author_name: 'Forn', author_org_id: 'forn', logo_image: deFora });
      expect(pagina, deFora).not.toHaveProperty('logoEntitat');
      expect(renderHook(() => useLogoEntitatDElement({ logo_image: deFora })).result.current, deFora).toEqual({ logo: null, carregant: false });
    }
  });

  test('el de qui publica passa davant del de Sóc de Poble, encara que signe l’entitat del projecte', () => {
    const projecte = { id: 'a', title: 'Avís', author_name: 'Sóc de Poble', author_entity_id: ENTITAT_PILOT_SLUG };
    // La sonda: signa l'entitat del projecte i, sense logo propi, porta la marca de sèrie.
    expect(rutaDePerfilDAutor(projecte)).toBe(DEFAULT_AUTHOR.href);
    expect(paginaDElement(mur, projecte).logoEntitat).toEqual(DEFAULT_AUTHOR.logo);
    expect(paginaDElement(mur, { ...projecte, logo_image: LOGO }).logoEntitat).toEqual({ clar: LOGO, alt: '' });
  });

  test('insegur, del port o de la marca de Sóc de Poble: no en dona cap; la regla de sempre continua', () => {
    const persona = { id: 'p', title: 'Pa', author_name: 'Pepa', owner_user_id: 'u-1', created_at: CREAT };
    for (const dolent of ['javascript:alert(1)', '//altre.domini/logo.png', 'data:text/html,<b>', 'sdp-media://mitjans/forn/logo.webp', QUADRAT_VERD, LOGO_NEGRE, LOGO_BLANC, '', '   ', 7, null]) {
      expect(logoEntitatDElement({ logo_image: dolent }), String(dolent)).toBeNull();
      expect(paginaDElement(mercat, { ...persona, logo_image: dolent }), String(dolent)).not.toHaveProperty('logoEntitat');
    }
    expect(logoEntitatDElement(null)).toBeNull();
    expect(logoEntitatDElement(undefined)).toBeNull();
  });
});

/* Revisió adversarial del 261007 · El hook torna { logo, carregant }:
   `carregant` diu als lectors que el port encara resol el logotip. */
describe('useLogoEntitatDElement: també el sdp-media://, resolt pel port', () => {
  test('mentre es resol, cap logo i carregant; resolt, el logotip amb la URL del port', async () => {
    mocks.capacitats = new Set(['mitjans']);
    mocks.resol.mockResolvedValue(PUBLIC);
    const { result } = renderHook(() => useLogoEntitatDElement({ logo_image: 'sdp-media://mitjans/forn/logo.webp' }));
    expect(result.current).toEqual({ logo: null, carregant: true });
    await waitFor(() => expect(result.current).toEqual({ logo: { clar: PUBLIC, alt: '' }, carregant: false }));
    expect(mocks.resol.mock.calls[0][0]).toBe('sdp-media://mitjans/forn/logo.webp');
  });

  test('sense la capacitat de mitjans, o si el port torna la marca o res, cap logotip i ja no carrega', async () => {
    const element = { logo_image: 'sdp-media://mitjans/forn/logo.webp' };
    const sense = renderHook(() => useLogoEntitatDElement(element));
    await waitFor(() => expect(sense.result.current).toEqual({ logo: null, carregant: false }));
    expect(mocks.resol).not.toHaveBeenCalled();
    mocks.capacitats = new Set(['mitjans']);
    for (const torna of [`https://poble.test${QUADRAT_VERD}`, '', null]) {
      mocks.resol.mockResolvedValueOnce(torna);
      const { result } = renderHook(() => useLogoEntitatDElement({ ...element }));
      await waitFor(() => expect(mocks.resol).toHaveBeenCalled());
      // La promesa del port s'assenta i el hook es torna a pintar.
      await act(async () => { await new Promise((resol) => { setTimeout(resol, 0); }); });
      expect(result.current, String(torna)).toEqual({ logo: null, carregant: false });
      mocks.resol.mockClear();
    }
  });

  test('un logo que es pinta sense el port: el mateix de paginaDElement, sense cridar-lo ni carregar', () => {
    const { result } = renderHook(() => useLogoEntitatDElement({ logo_image: LOGO }));
    expect(result.current).toEqual({ logo: { clar: LOGO, alt: '' }, carregant: false });
    expect(renderHook(() => useLogoEntitatDElement(null)).result.current).toEqual({ logo: null, carregant: false });
    expect(renderHook(() => useLogoEntitatDElement({ logo_image: 'javascript:alert(1)' })).result.current)
      .toEqual({ logo: null, carregant: false });
    expect(mocks.resol).not.toHaveBeenCalled();
  });
});

describe('/mur/:id (ItemDetailSection): el logotip pujat, damunt de l’H1', () => {
  const capcalera = (container) => container.querySelector('header.page-title');
  const fills = (container) => [...capcalera(container).children].map((e) => `${e.tagName}.${e.className}`);
  function pinta(item) {
    mocks.sectionId = 'mur';
    mocks.itemId = item.id;
    mocks.mur = { status: 'ready', events: [], feedPosts: [item], marketItems: [] };
    return render(<ItemDetailSection />).container;
  }

  test('una publicació amb logo_image: el logotip de l’entitat, abans que l’avatar redó', () => {
    const container = pinta({ id: 'p1', type: 'feed', title: 'Recepta', author_name: 'Pepa', owner_user_id: 'u-1',
      author_avatar: '/assets/pepa.png', logo_image: LOGO, created_at: CREAT });
    expect(fills(container).slice(0, 2)).toEqual(['IMG.page-title-logo page-title-logo--entitat', 'H1.']);
    expect(capcalera(container).querySelector('img').getAttribute('src')).toBe(LOGO);
    expect(container.querySelector('.page-title-avatar')).toBeNull();
  });

  test('un logo_image sdp-media://: es pinta quan el port el resol', async () => {
    mocks.capacitats = new Set(['mitjans']);
    mocks.resol.mockResolvedValue(PUBLIC);
    const container = pinta({ id: 'p2', type: 'feed', title: 'Pa', author_name: 'Forn', author_org_id: 'forn',
      logo_image: 'sdp-media://mitjans/forn/logo.webp', created_at: CREAT });
    await waitFor(() => expect(capcalera(container).querySelector('img.page-title-logo--entitat')?.getAttribute('src')).toBe(PUBLIC));
  });

  test('sense logo_image: la capçalera de sempre (l’avatar de qui signa, o l’H1)', () => {
    const container = pinta({ id: 'p3', type: 'feed', title: 'Recepta', author_name: 'Pepa', owner_user_id: 'u-1',
      author_avatar: '/assets/pepa.png', created_at: CREAT });
    expect(fills(container).slice(0, 2)).toEqual(['DIV.page-title-avatar', 'H1.']);
    expect(container.querySelector('.page-title-logo')).toBeNull();
    expect(mocks.resol).not.toHaveBeenCalled();
  });

  /* Revisió adversarial del 261007 · Mentre el port resol el logotip d'una
     persona, la capçalera no pinta l'avatar redó que el logotip llevaria en
     arribar; si el port no el resol, l'avatar torna. */
  const PERSONA_AMB_LOGO_DEL_PORT = { id: 'p4', type: 'feed', title: 'Recepta', author_name: 'Pepa', owner_user_id: 'u-1',
    author_avatar: '/assets/pepa.png', logo_image: 'sdp-media://mitjans/pepa/logo.webp', created_at: CREAT };

  test('un logo_image sdp-media:// d’una persona: cap avatar mentre es resol, i el logotip en arribar', async () => {
    mocks.capacitats = new Set(['mitjans']);
    let entrega;
    mocks.resol.mockReturnValueOnce(new Promise((resol) => { entrega = resol; }));
    const container = pinta(PERSONA_AMB_LOGO_DEL_PORT);
    await waitFor(() => expect(mocks.resol).toHaveBeenCalledTimes(1));
    expect(fills(container)[0]).toBe('H1.');
    expect(container.querySelector('.page-title-avatar')).toBeNull();
    expect(container.querySelector('.page-title-logo')).toBeNull();
    await act(async () => { entrega(PUBLIC); });
    await waitFor(() => expect(capcalera(container).querySelector('img.page-title-logo--entitat')?.getAttribute('src')).toBe(PUBLIC));
    expect(container.querySelector('.page-title-avatar')).toBeNull();
  });

  test('si el port no resol el logotip, l’avatar de qui signa torna', async () => {
    mocks.capacitats = new Set(['mitjans']);
    mocks.resol.mockResolvedValueOnce('');
    const container = pinta(PERSONA_AMB_LOGO_DEL_PORT);
    await waitFor(() => expect(fills(container).slice(0, 2)).toEqual(['DIV.page-title-avatar', 'H1.']));
    expect(container.querySelector('.page-title-logo')).toBeNull();
    expect(mocks.resol).toHaveBeenCalledTimes(1);
  });
});
