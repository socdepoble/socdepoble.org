/**
 * XatSection.seniorC2.r32_28.test.jsx — Onada R32.28 · Lot 01 (C-2).
 *
 * Certifica en les 5 llengües oficials (ca, es, en, eu, gl) que:
 *   1. El xip «Lletra gran» a l'accés del Xat (`AccesAlXat`) usa la variant compacta
 *      `.sdp-mode-senior-xip--curt` d'1 sola línia (`white-space: nowrap` en mode normal)
 *      amb marca d'estat no-cromàtica (`○` -> `✓`) i nom accessible invariant.
 *   2. La franja `.sdp-mode-senior-franja` dins de `.sdp-xat-acces` declara
 *      `flex: 1 1 auto` per compartir fila sense desquadrar +27px i fer wrap centrat net
 *      quan no hi cap (320px, Mode Sènior o traduccions llargues).
 *      v1.2.18 · Gauntlet R1 (L1-02) · El mínim és `min-inline-size: auto` amb
 *      `max-inline-size: 100%`; `min(100%, max-content)` era CSS invàlid. Les cadenes les fixen
 *      XatSection.acces.capes.test.js i XatSection.accesForaster.v1216.test.js.
 *      v1.2.18 · Gauntlet R1 (L1-04) · A 360px, en normal, es i eu ja baixen a dues files: la
 *      geometria per llengua queda pendent de la decisió C-2 del Mestre (L1-03).
 *   3. Les dues regles CSS mortes de `src/css/modules.css` han estat extirpades.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { UIProvider } from '../../app/contexts/UIContext.jsx';
import { delVal } from '../../config/storage.js';
import { SENIOR_KEY, reiniciaMemoriaSenior } from '../../config/theme.js';
import XatSection from './XatSection.jsx';
import { XatContext } from './XatContext.jsx';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), params: new URLSearchParams() }));

vi.mock('../../app/contexts/RouterContext', async () => {
  const { createElement: crea } = await import('react');
  return {
    useNavigate: () => mocks.navigate,
    useLocation: () => ({ pathname: '/xat' }),
    useSearchParams: () => [mocks.params],
    useParams: () => ({ threadId: null }),
    useRouter: () => ({ navigate: mocks.navigate, currentPath: '/xat' }),
    Link: ({ to, children, className, ...rest }) => crea('a', { href: to, className, ...rest }, children),
  };
});
vi.mock('../../pages/NotFoundPage', () => ({ default: () => null }));
vi.mock('../text/TextSection', () => ({ default: () => null }));
vi.mock('./components/FitxaVivaDeComunitat.jsx', () => ({ default: () => null }));
vi.mock('../../app/contexts/CoreContentContext', () => ({
  useCoreContent: () => ({ status: 'ready', pageCopy: {}, towns: [] }),
}));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ creaNota: vi.fn() }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

function contextForaster() {
  return {
    scopeKey: 'A',
    ambitEstable: 'P',
    status: 'ready',
    avis: null,
    chatThreads: [],
    getThreadMessages: () => [],
    sendChatMessage: vi.fn(async () => []),
    obriFil: () => {},
    creaFil: vi.fn(),
    cercaMembres: vi.fn(async () => []),
    totalNoLlegits: 0,
    hiHaMesAntics: () => false,
    carregantAntics: () => false,
    carregaMesAntics: () => {},
    reintenta: () => {},
    descartaFallit: () => {},
    marcaVist: () => {},
    comunitats: [],
    contactesFrequents: [],
    marcaLlegides: () => 0,
    obriFilDePagina: vi.fn(async () => null),
    joId: null,
    joNom: null,
    senseSessio: true,
    modeDades: 'remote',
    consumixEntrada: undefined,
  };
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('matchMedia', vi.fn((q) => ({
    matches: false,
    media: q,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  })));
  mocks.navigate.mockReset();
});

afterEach(() => {
  cleanup();
  delVal(SENIOR_KEY);
  reiniciaMemoriaSenior();
  vi.unstubAllGlobals();
});

describe('Onada R32.28 · Lot 01 (C-2) · Geometria Sènior a AccesAlXat i 0 regles mortes', () => {
  test.each([
    /* IDEA-323.4 · DOL-31 (v1.2.22, ordre del Mestre del 261122) · Un sol «Mode Bancal»: el rètol curt de l'ordre. */
    ['ca', 'Mode Bancal'],
    ['es', 'Modo Bancal'],
    ['en', 'Bancal Mode'],
    ['eu', 'Bankal Modua'],
    ['gl', 'Modo Bancal'],
  ])('en %s mostra el xip compacte «%s» d’1 línia i commuta netament Mode Sènior', (llengua, etiqueta) => {
    render(
      createElement(
        UIProvider,
        { externalConfig: { language: llengua } },
        createElement(XatContext.Provider, { value: contextForaster() }, createElement(XatSection))
      )
    );

    const xip = screen.getByTestId('xat-acces-lletra-gran');
    expect(screen.getByRole('switch', { name: etiqueta })).toBe(xip);
    expect(xip.classList.contains('sdp-mode-senior-xip--curt')).toBe(true);
    expect(xip.getAttribute('aria-checked')).toBe('false');
    expect(xip.querySelector('.sdp-mode-senior-xip__estat--curt')?.textContent).toBe('○');

    fireEvent.click(xip);
    expect(xip.getAttribute('aria-checked')).toBe('true');
    expect(xip.classList.contains('sdp-mode-senior-xip--actiu')).toBe(true);
    expect(xip.querySelector('.sdp-mode-senior-xip__estat--curt')?.textContent).toBe('✓');
  });

  test('modules.css ja no arrossega cap de les dues regles mortes de .sdp-xat-acces > .sdp-xat-acces__descarrega', () => {
    const modulesCss = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    expect(modulesCss).not.toContain('.sdp-xat-acces > .sdp-xat-acces__descarrega');
    expect(modulesCss).toContain('.sdp-xat-acces > .sdp-alerta__accions > .sdp-xat-acces__descarrega');
  });
});
