/* Norma del Mestre, 261004 (prompt 261004_1108, línies 66-69 i T2) · Les
   persones i la IAIA (ents de carboni o de silici) no porten logotip: porten
   el seu avatar redó, centrat dalt de l'H1, gran però més menut que el
   logotip d'una entitat (--sdp-avatar-capcalera, 300px). Si la pàgina és de
   qui mira, punxant-hi canvia la seua imatge (onCanvia).
   PageFrame el pinta amb `avatarAutor = { src, alt, onCanvia? }`, que passa
   qui sap que signa una persona o la IA, mai s'endevina de la ruta. Va
   després de les vies del logotip (ranura, logoEntitat, Sóc de Poble,
   showLogos); senseLogo també el lleva. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), toast: vi.fn(), capacitats: new Set(), resol: vi.fn()
}));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate, Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (capacitat) => mocks.capacitats.has(capacitat),
  resolveAsset: (ref, opcions) => mocks.resol(ref, opcions)
}));
import { fixaBaseRecursos } from '../../config/assetResolver';
import { ETIQUETA_CANVIA_AVATAR, PageFrame } from './PageFrame.jsx';
import { UniversalPage } from './UniversalPage.jsx';
import { DEFAULT_AUTHOR } from './UniversalUtils.js';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.capacitats = new Set();
  window.history.replaceState(null, '', '/gent/pepa');
});
afterEach(() => {
  cleanup();
  fixaBaseRecursos('/');
});

const capcalera = (container) => container.querySelector('header.page-title');
const fills = (element) => [...element.children].map((e) => `${e.tagName}.${e.className}`);
/* Una persona amb la seua ruta: la boina no és la de Sóc de Poble. */
const PEPA = { chrome: 'full', title: 'Pepa', authorName: 'Pepa', authorHref: '/gent/pepa' };
const AVATAR = { src: '/assets/pepa.png', alt: 'Avatar de Pepa' };

describe('una persona o la IA: l’avatar redó davant de l’H1', () => {
  test('una imatge redona dins de la caixa, centrada davant de l’H1, sense logotip', () => {
    const { container } = render(<PageFrame {...PEPA} avatarAutor={AVATAR} />);
    expect(fills(capcalera(container))).toEqual(['DIV.page-title-avatar', 'H1.']);
    const img = capcalera(container).querySelector('img');
    expect(img.className).toBe('page-title-avatar__imatge');
    expect(img.getAttribute('src')).toBe('/assets/pepa.png');
    expect(img.getAttribute('alt')).toBe('Avatar de Pepa');
    expect(img.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(container.querySelector('.page-title-logo')).toBeNull();
    expect(container.querySelector('button.page-title-avatar')).toBeNull();
  });

  test('sense títol, l’avatar sol ja fa aparéixer el bloc del títol', () => {
    const { container } = render(<PageFrame chrome="full" authorName="Pepa" authorHref="/gent/pepa" avatarAutor={AVATAR} />);
    expect(fills(capcalera(container))).toEqual(['DIV.page-title-avatar']);
  });

  test('amb la base del paquet (WordPress, Sollutia), el src en penja; una URL de fora passa tal qual', () => {
    fixaBaseRecursos('/wp-content/plugins/socdepoble/dist');
    let { container } = render(<PageFrame {...PEPA} avatarAutor={AVATAR} />);
    expect(capcalera(container).querySelector('img').getAttribute('src')).toBe('/wp-content/plugins/socdepoble/dist/assets/pepa.png');
    cleanup();
    ({ container } = render(<PageFrame {...PEPA} avatarAutor={{ src: 'https://exemple.cat/pepa.jpg', alt: '' }} />));
    expect(capcalera(container).querySelector('img').getAttribute('src')).toBe('https://exemple.cat/pepa.jpg');
  });

  test('un descriptor sense imatge o amb una adreça perillosa és com si no n’hi haguera', () => {
    for (const buit of [null, {}, { src: '' }, { src: '   ' }, { src: 'javascript:alert(1)' }, { src: '//dolent.cat/x.png' }, '/assets/pepa.png']) {
      const { container, unmount } = render(<PageFrame {...PEPA} avatarAutor={buit} />);
      expect(fills(capcalera(container)), JSON.stringify(buit)).toEqual(['H1.']);
      unmount();
    }
  });
});

/* Correcció dels verificadors (ordre del Mestre, 261004; skill sdp-pedra-seca
   §11) · La marca de Sóc de Poble (el quadrat verd de la boina i el logotip
   rectangular) no és mai l'avatar d'una persona ni de la IA: a
   /mercat/mac-mini-m4 l'avatar_url del producte era el quadrat verd i es
   pintava com a avatar redó de 300px. */
describe('la marca de Sóc de Poble mai és l’avatar de capçalera', () => {
  const MARQUES = [
    '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg',
    '/assets/system/ui/logo-socdepoble-rect-negre.svg',
    '/assets/system/ui/logo-socdepoble-rect-blanc.svg'
  ];

  test('cap de les tres imatges de la marca, ni en camí, ni ja resolta, ni en URL absoluta', () => {
    const candidats = [
      ...MARQUES,
      DEFAULT_AUTHOR.avatarUrl,
      'http://localhost:3340/assets/system/ui/logo-socdepoble-cuadrat-verd.svg',
      'https://socdepoble.org/assets/system/ui/logo-socdepoble-cuadrat-verd.svg'
    ];
    for (const src of candidats) {
      const { container, unmount } = render(<PageFrame {...PEPA} avatarAutor={{ src, alt: 'Avatar de Pepa' }} />);
      expect(fills(capcalera(container)), src).toEqual(['H1.']);
      expect(container.querySelector('.page-title-logo'), src).toBeNull();
      unmount();
    }
  });

  test('tampoc amb la base del paquet (WordPress): la marca ja resolta o per resoldre', () => {
    fixaBaseRecursos('/wp-content/plugins/socdepoble/dist');
    for (const src of [MARQUES[0], DEFAULT_AUTHOR.avatarUrl]) {
      const { container, unmount } = render(<PageFrame {...PEPA} avatarAutor={{ src, alt: '' }} />);
      expect(fills(capcalera(container)), src).toEqual(['H1.']);
      unmount();
    }
  });

  test('un sdp-media:// que el port resol a la marca tampoc es pinta', async () => {
    mocks.capacitats = new Set(['mitjans']);
    mocks.resol.mockResolvedValue(MARQUES[0]);
    const { container } = render(<PageFrame {...PEPA} avatarAutor={{ src: 'sdp-media://avatars/pepa', alt: '' }} />);
    await act(async () => {});
    expect(fills(capcalera(container))).toEqual(['H1.']);
  });

  test('una foto de persona amb un nom semblant continua pintant-se', () => {
    const { container } = render(<PageFrame {...PEPA} avatarAutor={{ src: '/assets/uploads/avatars/logo-socdepoble-pepa.png', alt: '' }} />);
    expect(fills(capcalera(container))).toEqual(['DIV.page-title-avatar', 'H1.']);
  });
});

describe('si la pàgina és de qui mira (onCanvia), l’avatar és un botó que canvia la imatge', () => {
  test('un botó amb nom, la marca de la càmera i el clic a onCanvia', () => {
    const onCanvia = vi.fn();
    const { container } = render(<PageFrame {...PEPA} avatarAutor={{ ...AVATAR, onCanvia }} />);
    expect(fills(capcalera(container))).toEqual(['BUTTON.page-title-avatar page-title-avatar--canvia', 'H1.']);
    const boto = capcalera(container).querySelector('button');
    expect(boto.getAttribute('type')).toBe('button');
    expect(boto.getAttribute('aria-label')).toBe(ETIQUETA_CANVIA_AVATAR);
    expect(boto.querySelector('img.page-title-avatar__imatge').getAttribute('src')).toBe('/assets/pepa.png');
    expect(boto.querySelector('.page-title-avatar__marca').getAttribute('aria-hidden')).toBe('true');
    fireEvent.click(boto);
    expect(onCanvia).toHaveBeenCalledTimes(1);
  });

  test('un onCanvia que no és una funció no fa cap botó', () => {
    const { container } = render(<PageFrame {...PEPA} avatarAutor={{ ...AVATAR, onCanvia: '/el-meu-perfil' }} />);
    expect(fills(capcalera(container))).toEqual(['DIV.page-title-avatar', 'H1.']);
  });
});

describe('va després de les vies del logotip: amb logotip, cap avatar', () => {
  const imatgesDe = (container) => [...capcalera(container).querySelectorAll('img')].map((img) => img.className);

  /* Onada 8 (261009) · La boina de Sóc de Poble va al seu perfil
     (DEFAULT_AUTHOR.href); la ruta vella /projecte continua valent. */
  test('signa Sóc de Poble (la boina va al seu perfil, o a la vella /projecte): el seu logotip, cap avatar', () => {
    let { container } = render(<PageFrame chrome="system" title="Consola" avatarAutor={AVATAR} />);
    expect(imatgesDe(container)).toEqual(['page-title-logo light-only', 'page-title-logo dark-only']);
    for (const ruta of [DEFAULT_AUTHOR.href, '/projecte']) {
      cleanup();
      ({ container } = render(<PageFrame chrome="full" title="T" authorName="Sóc de Poble" authorHref={ruta} avatarAutor={AVATAR} />));
      expect([ruta, container.querySelector('.page-title-avatar')]).toEqual([ruta, null]);
    }
  });

  test('logoEntitat i la compatibilitat showLogos manen sobre l’avatar', () => {
    let { container } = render(<PageFrame {...PEPA} logoEntitat={{ clar: '/assets/forn.png', alt: '' }} avatarAutor={AVATAR} />);
    expect(imatgesDe(container)).toEqual(['page-title-logo page-title-logo--entitat']);
    cleanup();
    ({ container } = render(<PageFrame {...PEPA} showLogos={true} avatarAutor={AVATAR} />));
    expect(container.querySelector('.page-title-avatar')).toBeNull();
  });

  test('la ranura de l’editor mana sobre tot', () => {
    const { container } = render(<PageFrame {...PEPA} topBarData={{ logoComponent: <span>Logotip</span> }} avatarAutor={AVATAR} />);
    expect(fills(capcalera(container))).toEqual(['DIV.page-title-logo-personalitzat', 'H1.']);
  });

  test('senseLogo === true també el lleva (la mateixa excepció de capçalera)', () => {
    const { container } = render(<PageFrame {...PEPA} {...{ ['sense' + 'Logo']: true }} avatarAutor={AVATAR} />);
    expect(fills(capcalera(container))).toEqual(['H1.']);
  });

  test('UniversalPage la passa a PageFrame', () => {
    const { container } = render(<UniversalPage {...PEPA} avatarAutor={AVATAR} />);
    expect(fills(capcalera(container))).toEqual(['DIV.page-title-avatar', 'H1.']);
  });
});

describe('un sdp-media:// el resol el port, amb la caixa reservada', () => {
  test('mentre es resol, la caixa buida reserva el lloc; després, la imatge resolta', async () => {
    mocks.capacitats = new Set(['mitjans']);
    let resol;
    mocks.resol.mockImplementation(() => new Promise((r) => { resol = r; }));
    const { container } = render(<PageFrame {...PEPA} avatarAutor={{ src: 'sdp-media://avatars/pepa', alt: 'Avatar de Pepa' }} />);
    expect(fills(capcalera(container))).toEqual(['DIV.page-title-avatar', 'H1.']);
    expect(capcalera(container).querySelector('img')).toBeNull();
    expect(mocks.resol).toHaveBeenCalledWith('sdp-media://avatars/pepa', expect.anything());
    await act(async () => { resol('https://mitjans.socdepoble.org/pepa.webp'); });
    expect(capcalera(container).querySelector('img.page-title-avatar__imatge').getAttribute('src')).toBe('https://mitjans.socdepoble.org/pepa.webp');
  });

  test('sense la capacitat del port, no es pinta res (mai /sdp-media://… com a camí)', async () => {
    const { container } = render(<PageFrame {...PEPA} avatarAutor={{ src: 'sdp-media://avatars/pepa', alt: '' }} />);
    await act(async () => {});
    expect(fills(capcalera(container))).toEqual(['H1.']);
    expect(mocks.resol).not.toHaveBeenCalled();
  });
});

/* ── La mida (tokens.css i modules.css, @layer components) ────────────── */
describe('la mida: un token de 300px, redó, a l’ample de la capçalera en pantalla estreta', () => {
  const tokens = readFileSync(path.join(process.cwd(), 'src/css/tokens.css'), 'utf8');
  const css = readFileSync(path.join(process.cwd(), 'src/css/modules.css'), 'utf8');
  const blocDe = (selector) => {
    const inici = css.indexOf(`${selector} {`);
    expect(inici, selector).toBeGreaterThan(-1);
    return css.slice(inici, css.indexOf('}', inici));
  };

  test('--sdp-avatar-capcalera val 18.75rem (300px), dins de la reixeta de 0.25rem', () => {
    expect(tokens).toMatch(/--sdp-avatar-capcalera[:] 18\.75rem;/);
  });

  test('.page-title-avatar: min(100%, token), quadrat, redó amb el token de pastilla, centrat', () => {
    const bloc = blocDe('.page-title-avatar');
    expect(bloc).toContain('width: min(100%, var(--sdp-avatar-capcalera))');
    expect(bloc).toContain('aspect-ratio: 1 / 1');
    expect(bloc).toContain('border-radius: var(--sdp-radi-pastilla)');
    expect(bloc).toContain('margin: 0 auto var(--sdp-space-4)');
    expect(blocDe('.page-title-avatar__imatge')).toContain('object-fit: cover');
    const posicio = css.indexOf('.page-title-avatar {');
    const capa = css.lastIndexOf('@layer components {', posicio);
    expect(capa).toBeGreaterThan(-1);
    expect(css.slice(capa, posicio)).toContain('.page-title-logo--entitat { max-height: 600px; }');
  });

  test('la marca de la càmera és un objectiu tàctil sencer, amb tokens de color', () => {
    const bloc = blocDe('.page-title-avatar__marca');
    expect(bloc).toContain('width: var(--sdp-touch); height: var(--sdp-touch)');
    expect(bloc).toContain('background: var(--sdp-accio); color: var(--sdp-sobre-accio)');
    expect(bloc).not.toMatch(/#[0-9a-f]{3,6}\b/i);
  });
});
