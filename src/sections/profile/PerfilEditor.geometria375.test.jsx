/* Pas 8.4 del pla 261029_0216 (T8 · Geometria autenticada R1, 375 px) ·
   Revisió del Bloc H (R1): IdentitatAlPoble pintat com a germà del
   DocumentEditor dins del detall del Perfil (overflow: hidden,
   PerfilShell.css) deixava l'editor a 0 px als telèfons. La correcció va per
   la clau d'adaptador peuDePagina (PerfilEditor.jsx): el bloc viu dins del
   contenidor que fa scroll, després de l'article, i la closca de l'editor
   conserva l'alçada del detall (425 px a 375x667).
   jsdom no té motor de maquetació: ací es fixa l'estructura del DOM amb una
   sessió simulada (entrada, qui pot editar) a 375 px, i el text del CSS que
   fa la geometria (la cadena detall → closca → document → contenidor amb
   scroll → peu), llegit com a text, com Conversa.test.jsx i
   UniversalEditorShell.edicioAvancada.test.jsx. L'harnés és el de
   PerfilEditor.usuari.test.jsx: TipTap substituït, DocumentEditor i PageFrame
   de veres. Cap :has() al CSS (tests/lint_xat). */
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ perfil: null, towns: [] }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} }),
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: null, refresh: vi.fn() }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [], towns: m.towns }) }));
/* La sessió simulada: dins, amb la persona «U» (la mateixa de getCurrentUser). */
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: { id: 'U' }, estat: 'dins', rol: 'usuari', generacio: 1 }) }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useRouter: () => ({ navigate: vi.fn(), location: { pathname: '/el-meu-perfil' } }),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/el-meu-perfil' }),
  useSearchParams: () => [new URLSearchParams()],
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUI: () => ({ externalConfig: {} }),
  useUIActions: () => ({ t: (_clau, text) => text }),
}));
vi.mock('../../components/universal/ContentProvider', () => ({ useContent: () => null }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: () => false,
  getCurrentUser: () => ({ id: 'U' }),
}));
vi.mock('./PerfilContext.jsx', () => ({ usePerfil: () => m.perfil }));
vi.mock('../../components/universal/richText', () => ({
  useUniversalRichText: () => null,
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: () => <div className="sdp-editor-tools" />,
  UniversalRichTextContent: () => <div className="sdp-editor-full-canvas" />,
}));
vi.mock('../../components/universal/richText/extensions', () => ({ extensionsRiques: () => [] }));
vi.mock('../../components/universal/DocumentPrintPreview.jsx', () => ({ default: () => null }));

import { PerfilEditor } from './PerfilEditor.jsx';
import { ETIQUETA_POBLE, ETIQUETA_USUARI, TITOL_IDENTITAT_AL_POBLE } from '../onboarding/IdentitatAlPoble.jsx';

const AMPLADA = 375;
const ALCADA = 667;
const persona = (dades = {}) => ({ id: 'jo', mena: 'persona', nom: 'Pep Sala', rol: 'Persona',
  dades: { id: 'U', full_name: 'Pep Sala', town_name: 'La Torre de les Maçanes', username: 'pepsala', username_confirmat_at: null, ...dades } });

/* El telèfon: la finestra, les caixes i les consultes de mitjans, com les
   altres proves de geometria (App.barresScroll, PerfilShell.mestreDetall). */
beforeEach(() => {
  m.perfil = { identitats: [], autodesament: null, guardarCampPerfil: vi.fn(async () => {}), pujaMitja: vi.fn(), recarrega: vi.fn() };
  m.towns = [{ title: 'La Torre de les Maçanes' }, { title: 'Penàguila' }];
  vi.stubGlobal('innerWidth', AMPLADA);
  vi.stubGlobal('innerHeight', ALCADA);
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(AMPLADA);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn()
  })));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

/* El detall del Perfil tal com el pinta PerfilShell (la tercera columna):
   .sdp-workspace-detail amb la classe que li posa overflow: hidden. */
const munta = (identitat) => render(
  <div className="perfil-espai">
    <div className="sdp-workspace-detail perfil-espai__detall">
      <PerfilEditor identitat={identitat} />
    </div>
  </div>
);

describe(`R1 · la fitxa de la persona amb sessió a ${AMPLADA} px`, () => {
  test('qui pot editar veu el bloc viu (identificador i poble) i l’editor en el seu lloc', () => {
    munta(persona());
    expect(window.innerWidth).toBe(AMPLADA);
    expect(document.documentElement.clientWidth).toBe(AMPLADA);
    const grup = screen.getByRole('group', { name: TITOL_IDENTITAT_AL_POBLE });
    expect(within(grup).getByLabelText(ETIQUETA_USUARI).value).toBe('pepsala');
    expect(within(grup).getByLabelText(ETIQUETA_POBLE)).toBeTruthy();
    expect(screen.getAllByRole('group', { name: TITOL_IDENTITAT_AL_POBLE })).toHaveLength(1);
  });

  test('el bloc entra per peuDePagina: dins de la closca, al contenidor que fa scroll, després de l’article; mai germà de l’editor al detall', () => {
    const { container } = munta(persona());
    const detall = container.querySelector('.perfil-espai__detall');
    const closca = detall.querySelector('.sdp-editor-shell-atomic');
    const grup = screen.getByRole('group', { name: TITOL_IDENTITAT_AL_POBLE });
    /* La closca és el primer fill del detall i cap germà seu conté el bloc. */
    expect(detall.firstElementChild).toBe(closca);
    expect([...detall.children].filter((fill) => fill !== closca && fill.contains(grup))).toEqual([]);
    expect(closca.contains(grup)).toBe(true);
    /* La cadena de la geometria: closca → document → contenidor amb scroll → peu. */
    const pagina = closca.querySelector(':scope > .sdp-editor-document > .sdp-universal-page-container--contained');
    expect(pagina).not.toBeNull();
    const peu = screen.getByRole('region', { name: TITOL_IDENTITAT_AL_POBLE });
    expect(peu.matches('section.sdp-pagina-peu')).toBe(true);
    expect(peu.parentElement).toBe(pagina);
    expect(pagina.lastElementChild).toBe(peu);
    expect(peu.previousElementSibling.matches('article.content-wrapper')).toBe(true);
    expect(peu.closest('article')).toBeNull();
    expect(peu.contains(grup)).toBe(true);
    expect(container.querySelectorAll('.sdp-pagina-peu')).toHaveLength(1);
    /* Les eines de la fitxa (davall de l'entradilla) continuen dins de
       l'article, abans del cos: el peu no les mou. */
    const article = peu.previousElementSibling;
    expect(article.querySelector('.sdp-editor-eines > .sdp-editor-tools')).not.toBeNull();
    expect(article.querySelector('.sdp-editor-full-canvas')).not.toBeNull();
  });

  test('sense el bloc (cap identificador del servidor, o en lectura) el DOM és el de sempre: cap peu', () => {
    const { container } = munta(persona({ username: undefined, username_confirmat_at: undefined }));
    expect(container.querySelector('.sdp-pagina-peu')).toBeNull();
    expect(screen.queryByRole('group', { name: TITOL_IDENTITAT_AL_POBLE })).toBeNull();
    cleanup();
    const reserva = munta(persona({ reserva: true }));
    expect(reserva.container.querySelector('.sdp-pagina-peu')).toBeNull();
    expect(reserva.container.querySelector('.sdp-editor-shell-atomic')).not.toBeNull();
  });

  /* La font, com a text: la clau de l'adaptador és l'única porta del bloc
     (PerfilEditor.jsx), i el JSX que es retorna no el pinta enlloc més. */
  test('PerfilEditor.jsx només passa IdentitatAlPoble per peuDePagina (amb el nom del bloc com a etiqueta)', () => {
    const font = readFileSync(resolve(process.cwd(), 'src/sections/profile/PerfilEditor.jsx'), 'utf8');
    expect(font).toMatch(/peuDePagina:\s*identitatAlPoble,\s*etiquetaPeuDePagina:\s*TITOL_IDENTITAT_AL_POBLE/);
    expect(font.match(/<IdentitatAlPoble\b/g)).toHaveLength(1);
    const memoria = font.indexOf('const identitatAlPoble = useMemo(');
    const fiMemoria = font.indexOf('[ambIdentitatAlPoble', memoria);
    expect(memoria).toBeGreaterThan(-1);
    expect(fiMemoria).toBeGreaterThan(memoria);
    const unic = font.indexOf('<IdentitatAlPoble');
    expect(unic).toBeGreaterThan(memoria);
    expect(unic).toBeLessThan(fiMemoria);
  });
});

/* El full, llegit com a text: la geometria que dona l'alçada a l'editor als
   telèfons. El detall del Perfil no fa scroll (overflow: hidden); la closca
   ompli el detall (height: 100%, columna flex); el document és l'únic fill
   que creix (flex: 1 1 0, min-height: 0); el contenidor de la pàgina és qui
   fa scroll (overflow-y: auto, height: 100%); i el peu no creix (flex: none):
   mai es menja l'alçada de l'article. Un bloc germà de la closca dins del
   detall trencaria el primer pas (la closca cediria la seua alçada). */
describe('R1 · el CSS de la cadena detall → closca → document → scroll → peu', () => {
  const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const bloc = (css, selector) => {
    const m = new RegExp(`\\n\\s*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^}]*)\\}`).exec(css);
    expect(m, selector).not.toBeNull();
    return m[1].split(';').map((d) => d.trim()).filter(Boolean);
  };

  test('el detall del Perfil no fa scroll: overflow hidden, una sola regla, sense :has()', () => {
    const perfil = llig('src/sections/profile/PerfilShell.css');
    expect(perfil.match(/\.perfil-espai \.perfil-espai__detall \{/g)).toHaveLength(1);
    expect(bloc(perfil, '.perfil-espai .perfil-espai__detall')).toEqual(['overflow: hidden']);
    expect(perfil).not.toMatch(/:has\(/);
    /* I el detall genèric és una columna flex que fa 100% del seu pare. */
    const moduls = llig('src/css/modules.css');
    expect(bloc(moduls, '.sdp-workspace-detail')).toEqual(expect.arrayContaining(['height: 100%', 'min-height: 0', 'display: flex', 'flex-direction: column']));
  });

  test('la closca ompli el detall i només el document creix', () => {
    const moduls = llig('src/css/modules.css');
    expect(moduls.match(/\.sdp-editor-shell-atomic \{/g)).toHaveLength(1);
    expect(bloc(moduls, '.sdp-editor-shell-atomic')).toEqual(expect.arrayContaining(['display: flex', 'flex-direction: column', 'height: 100%', 'min-height: 0', 'overflow: hidden']));
    expect(moduls.match(/\.sdp-editor-document \{/g)).toHaveLength(1);
    expect(bloc(moduls, '.sdp-editor-document')).toEqual(expect.arrayContaining(['flex: 1 1 0', 'min-height: 0', 'overflow: hidden']));
    expect(moduls).not.toMatch(/\.sdp-editor-(shell-atomic|document)[^{]*:has\(/);
  });

  test('el contenidor de la pàgina és qui fa scroll, l’article creix i el peu no', () => {
    const utilitats = llig('src/css/utilities.css');
    expect(bloc(utilitats, '.sdp-universal-page-container--contained')).toEqual(expect.arrayContaining(['display: flex', 'flex-direction: column', 'height: 100%', 'min-height: 0', 'overflow-y: auto']));
    expect(bloc(utilitats, '.sdp-universal-page-container--contained > .content-wrapper')).toEqual(expect.arrayContaining(['flex: 1 0 auto', 'min-height: 0']));
    expect(utilitats.match(/\.sdp-pagina-peu \{/g)).toHaveLength(1);
    expect(bloc(utilitats, '.sdp-pagina-peu')).toEqual(expect.arrayContaining(['flex: none', 'width: 100%']));
    /* Cap @media no redefinix el peu: val igual a 375 que a 1280 px. */
    expect(utilitats).not.toMatch(/@media[^{]*\{[^}]*\.sdp-pagina-peu/);
    expect(utilitats).not.toMatch(/sdp-pagina-peu[^{]*:has\(/);
  });
});
