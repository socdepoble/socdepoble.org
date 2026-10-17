/**
 * Norma del Mestre, 261004 (prompt 261004_1108, línies 63-69 i T2) · Qui signa
 * decidix la capçalera de la fitxa d'un element (Mercat, agenda, Mur):
 *  · l'entitat del projecte, reconeguda per identificador: el seu logotip
 *    rectangular, també amb la boina al perfil públic del Mercat;
 *  · una persona (o la IA): el seu avatar redó davant de l'H1, MAI el
 *    logotip de Sóc de Poble.
 * Derogat el showLogos={true} d'ItemDetailSection (ordre del Mestre, 261004):
 * pintava el logotip de Sóc de Poble a la fitxa de qualsevol persona
 * (/mercat/mac-mini-m4). Es prova amb la UniversalPage i el PageFrame de veres.
 * Correcció dels verificadors (ordre del Mestre, 261004) · L'avatar de
 * capçalera ix només de l'avatar de la identitat (author_avatar), mai de
 * l'avatar_url de l'element, i la marca de Sóc de Poble no és mai l'avatar
 * d'una persona (skill sdp-pedra-seca §11).
 */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sectionId: 'mercat', itemId: null, navigate: vi.fn(), t: (_, alternativa) => alternativa,
  mur: { events: [], feedPosts: [], marketItems: [] },
  sessio: { currentUser: null, estat: 'fora', rol: null, esSuperadmin: false }
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ sectionId: mocks.sectionId, itemId: mocks.itemId }),
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: `/${mocks.sectionId}/${mocks.itemId}`, state: null }),
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../sections/mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: [] }) }));
vi.mock('../../sections/notes/NotesDataContext', () => ({ useNotesData: () => ({ notes: [] }) }));
vi.mock('../../sections/multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ mediaItems: [] }) }));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActions: () => ({ t: mocks.t })
}));
/* Marató 2230 · P4 (petició de Codex, 261004_2240_auditoria_codex.md:134) · El
   detall llig el rol de la Sessió obligatòria (ItemDetailSection.jsx:20), que
   a l'app posa el SessionProvider de PedraSecaEmbed. Ací, el doble de les
   altres proves de seccions amb el valor del proveïdor real per a qui visita
   sense entrar (SessionContext.jsx:157, sessionService.js:114-115).
   Poliment P4 · Ací UniversalPage i PageFrame són de veres: el doble porta les
   exportacions de SessionContext.jsx que poden importar, ESTAT (:59) tal qual,
   useSession (:167) i useSessioOpcional (:174), que dins del proveïdor tornen
   el mateix valor. Amb només useSession, el dia que una d'elles llegira la
   sessió opcional, Vitest petaria amb «No export is defined on the mock».
   SessionProvider es queda fora: el posa PedraSecaEmbed, no cap peça del detall. */
vi.mock('../../app/contexts/SessionContext', () => ({
  ESTAT: Object.freeze({ COMPROVANT: 'comprovant', DINS: 'dins', FORA: 'fora' }),
  useSession: () => mocks.sessio,
  useSessioOpcional: () => mocks.sessio
}));
vi.mock('../../hooks/useSEO.js', () => ({ useSEO: () => {} }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import ItemDetailSection from './ItemDetailSection.jsx';
import { EVENTS, MARKET_ITEMS } from '../../data/sectionContent.js';
import { RUTA_PERFIL_PROJECTE } from '../../config/navigation.js';
import { PERSONA_PILOT } from '../../data/identitatsSeed.js';

const LOGO_NEGRE = '/assets/system/ui/logo-socdepoble-rect-negre.svg';
/* La marca de l'entitat: l'avatar de la boina de Sóc de Poble, mai el d'una persona. */
const QUADRAT_VERD = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
/* Onada 8 (261009) · La marca que es pinta ara són els PNG; els SVG d'abans
   (els de dalt) continuen arribant de les files del servidor. */
const LOGO_NEGRE_PNG = '/assets/system/ui/logo-socdepoble-rect-negre-985x256.png';
const QUADRAT_VERD_PNG = '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png';
const capcalera = (container) => container.querySelector('header.page-title');
const srcsDeLaCapcalera = (container) => [...capcalera(container).querySelectorAll('img')].map((img) => img.getAttribute('src'));
const fills = (container) => [...capcalera(container).children].map((e) => `${e.tagName}.${e.className}`);
const boina = (container) => container.querySelector('section.bar-orange .sp-card-author')?.getAttribute('href') ?? null;

function pinta(sectionId, item) {
  mocks.sectionId = sectionId;
  mocks.itemId = item.id;
  mocks.mur = {
    events: sectionId === 'events' ? [item] : [],
    feedPosts: sectionId === 'mur' ? [item] : [],
    marketItems: sectionId === 'mercat' ? [item] : []
  };
  return render(<ItemDetailSection />).container;
}

const llavor = (llista, id) => {
  const item = llista.find((element) => element.id === id);
  expect(item, id).toBeTruthy();
  return item;
};

beforeEach(() => { vi.clearAllMocks(); });
afterEach(cleanup);

describe('l’entitat del projecte (per identificador): el seu logotip, cap avatar', () => {
  test('/mercat/samarreta-socdepoble', () => {
    const container = pinta('mercat', llavor(MARKET_ITEMS, 'samarreta-socdepoble'));
    expect(boina(container)).toBe('/empresa/socdepoble');
    expect(fills(container).slice(0, 3)).toEqual(['IMG.page-title-logo light-only', 'IMG.page-title-logo dark-only', 'H1.']);
    expect(capcalera(container).querySelector('img').getAttribute('src')).toBe(LOGO_NEGRE_PNG);
    expect(container.querySelector('.page-title-avatar')).toBeNull();
  });

  test('/events/aplec-2023 (signat per author_entity_id, com el seed.sql corregit)', () => {
    const container = pinta('events', llavor(EVENTS, 'aplec-2023'));
    expect(boina(container)).toBe(RUTA_PERFIL_PROJECTE);
    expect(fills(container).slice(0, 3)).toEqual(['IMG.page-title-logo light-only', 'IMG.page-title-logo dark-only', 'H1.']);
    expect(container.querySelector('.page-title-avatar')).toBeNull();
  });
});

describe('una persona: el seu avatar redó, mai el logotip de Sóc de Poble', () => {
  test('/mercat/mac-mini-m4 de la llavor (signa una persona per author_id)', () => {
    const mac = llavor(MARKET_ITEMS, 'mac-mini-m4');
    const container = pinta('mercat', mac);
    expect(boina(container)).toMatch(/^\/gent\//);
    expect(fills(container).slice(0, 2)).toEqual(['DIV.page-title-avatar', 'H1.']);
    expect(container.querySelector('.page-title-logo')).toBeNull();
    const img = capcalera(container).querySelector('img.page-title-avatar__imatge');
    expect(img.getAttribute('src')).toBe(mac.author_avatar);
    expect(img.getAttribute('alt')).toBe(`Avatar de ${mac.author_name}`);
  });

  /* Derogat (ordre del Mestre, 261004; correcció dels verificadors): esta
     prova exigia DIV.page-title-avatar amb l'avatar_url del node, que és la
     marca de Sóc de Poble (quadrat verd): fixava el defecte. L'avatar_url no
     és l'autoria (T3, 261001) i la marca mai no és l'avatar d'una persona
     (skill sdp-pedra-seca §11).
     Gauntlet 261016 · diürn 1530 (Bloc -1; ordre del Mestre: l'avatar de la
     persona pilot «Sempre és la seua foto personal de perfil») · Derogat
     també el «ni avatar ni logotip» d'esta prova: la persona pilot porta
     SEMPRE la seua foto davant de l'H1 (signaturaDeQuiSigna), encara que
     l'element no porte author_avatar. La marca continua sense aparéixer mai,
     ni a la capçalera ni a la barra taronja. */
  const fotoDeLaBarra = (container) => container.querySelector('section.bar-orange img.sp-card-avatar')?.getAttribute('src') ?? null;
  const nomDeLaBarra = (container) => container.querySelector('section.bar-orange .sp-card-author-name')?.textContent ?? null;

  test('el mac-mini amb author_id javillinares i només avatar_url de la marca: la foto de la pilot, mai el logotip', () => {
    const container = pinta('mercat', {
      id: 'mac-mini-m4', title: 'Mac Mini Apple M4, 24/512GB', seller: 'Javi Llinares', author_name: 'Javi Llinares',
      author_id: 'javillinares', avatar_url: QUADRAT_VERD, created_at: '2026-02-15T12:00:00.000Z'
    });
    expect(boina(container)).toBe('/gent/javillinares');
    expect(container.querySelector('.page-title-logo')).toBeNull();
    expect(fills(container).slice(0, 2)).toEqual(['DIV.page-title-avatar', 'H1.']);
    expect(capcalera(container).querySelector('img.page-title-avatar__imatge').getAttribute('src')).toBe(PERSONA_PILOT.avatar);
    expect(srcsDeLaCapcalera(container)).not.toContain(QUADRAT_VERD);
    expect([nomDeLaBarra(container), fotoDeLaBarra(container)]).toEqual(['Javi Llinares', PERSONA_PILOT.avatar]);
  });

  /* Gauntlet 261016 · diürn 1530 (Bloc -1) · La fila CRUA del Mac Mini de
     supabase/seed.sql, tal com arriba d'app_content en remot i al node local
     (sense author_avatar; la foto a avatar_url): abans la capçalera eixia
     sense avatar. I, sense cap avatar ni el nom sencer, la barra taronja ja
     no cau al de sèrie de PageFrame (el quadrat verd). */
  test.each([
    ['la fila crua del seed.sql', {}],
    ['sense cap avatar i amb el nom curt', { avatar_url: undefined, author_name: 'Javi', seller: 'Javi' }]
  ])('/mercat/mac-mini-m4 amb %s: la foto de la pilot a la capçalera i a la barra', (_, canvis) => {
    const container = pinta('mercat', {
      id: 'mac-mini-m4', type: 'product', title: 'Mac Mini Apple M4, 24/512GB', seller: 'Javi Llinares', author_name: 'Javi Llinares',
      author_id: 'javillinares', avatar_url: PERSONA_PILOT.avatar, images: ['/assets/uploads/brain/mac_mini_m4_1787721966622.jpg'],
      created_at: '2026-02-15T12:00:00.000Z', ...canvis
    });
    expect(fills(container).slice(0, 2)).toEqual(['DIV.page-title-avatar', 'H1.']);
    const img = capcalera(container).querySelector('img.page-title-avatar__imatge');
    expect([img.getAttribute('src'), img.getAttribute('alt')]).toEqual([PERSONA_PILOT.avatar, 'Avatar de Javi Llinares']);
    expect([nomDeLaBarra(container), fotoDeLaBarra(container)]).toEqual(['Javi Llinares', PERSONA_PILOT.avatar]);
    for (const marca of [QUADRAT_VERD, QUADRAT_VERD_PNG]) expect(container.innerHTML, marca).not.toContain(marca);
  });

  test('l’avatar de capçalera és el de la identitat (author_avatar), mai l’avatar_url de l’element', () => {
    const container = pinta('mercat', {
      id: 'cadira', title: 'Cadira de bova', author_name: 'Pepa', author_id: 'pepa',
      avatar_url: '/assets/cadira.png', created_at: '2026-09-01T10:00:00.000Z'
    });
    expect(fills(container)[0]).toBe('H1.');
    expect(container.querySelector('.page-title-avatar')).toBeNull();
  });

  test('cap avatar de capçalera amb la marca de Sóc de Poble, encara que vinga com a author_avatar', () => {
    for (const marca of [QUADRAT_VERD, LOGO_NEGRE, QUADRAT_VERD_PNG, LOGO_NEGRE_PNG]) {
      const container = pinta('mur', {
        id: 'p-marca', type: 'feed', title: 'Recepta', author_name: 'Pepa', owner_user_id: 'u-1',
        author_avatar: marca, created_at: '2026-09-01T10:00:00.000Z'
      });
      expect(fills(container)[0], marca).toBe('H1.');
      expect(container.querySelector('.page-title-avatar'), marca).toBeNull();
      expect(srcsDeLaCapcalera(container), marca).not.toContain(marca);
      cleanup();
    }
  });

  test('una persona sense avatar: ni logotip ni avatar, el bloc comença per l’H1', () => {
    const container = pinta('mur', { id: 'p1', type: 'feed', title: 'Recepta', author_name: 'Pepa', owner_user_id: 'u-1', created_at: '2026-09-01T10:00:00.000Z' });
    expect(fills(container)[0]).toBe('H1.');
  });
});

describe('qui signa no se sap: res (mai pel nom)', () => {
  test('un element que ha perdut l’identificador de l’entitat no porta logotip, encara que diga «Sóc de Poble»', () => {
    const senseId = { ...llavor(EVENTS, 'aplec-2023') };
    delete senseId.author_entity_id;
    const container = pinta('events', senseId);
    expect(boina(container)).toBeNull();
    expect(container.querySelector('.page-title-logo')).toBeNull();
    expect(container.querySelector('.page-title-avatar')).toBeNull();
  });
});
