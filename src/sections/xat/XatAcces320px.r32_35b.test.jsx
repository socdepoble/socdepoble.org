/**
 * Onada R32.35b · DOL-29 · Geometria i integritat d'AccesAlXat a 320x800 en les 5 llengües
 * (ca, es, en, eu, gl), normal i Mode Sènior, garantint 0 mutacions a >= 360px.
 */
/* v1.2.21 · Els cinc diccionaris carregats abans de traduir (guarda de src/config/i18n.idiomes.test.js), com la
   costura de R32.41 a UniversalControlsA11y5Llengues.r32_39.test.jsx. */
import '../../../tests/helpers/diccionaris.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { cleanup, render, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createTranslator } from '../../config/i18n.js';
import XatSection from './XatSection.jsx';
import { XatContext } from './XatContext.jsx';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  params: new URLSearchParams(),
  lang: 'ca',
  t: (_, alt) => alt,
}));

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
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: mocks.t, resolveAsset: (v) => v }),
  useUIState: () => ({ language: mocks.lang, locale: `${mocks.lang}-ES`, externalConfig: {} }),
  useUIStateOpcional: () => ({ language: mocks.lang, locale: `${mocks.lang}-ES`, externalConfig: {} }),
}));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ creaNota: vi.fn() }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const diferitSenior = readFileSync(resolve(process.cwd(), 'src/css/diferit-mode-senior.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '');

function contextSenseSessio() {
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
  mocks.navigate.mockReset();
});

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-sdp-senior');
  vi.unstubAllGlobals();
});

describe('Onada R32.35b · DOL-29 · /xat a 320px en les 5 llengües (normal i Sènior)', () => {
  test('la compactació anti-retall viu exclusivament dins de @media (max-width: 359px) al full diferit (0 canvis a >= 360px)', () => {
    const idxMedia = diferitSenior.indexOf('@media (max-width: 359px)');
    expect(idxMedia).toBeGreaterThan(-1);
    const bloc359 = diferitSenior.slice(idxMedia);
    expect(bloc359).toContain('.sdp-alerta.sdp-xat-acces');
    expect(bloc359).toContain('.sdp-xat-acces > .sdp-alerta__accions:last-of-type > .sdp-xat-pindola');
    expect(bloc359).not.toContain('.sdp-xat-fila');
    expect(bloc359).not.toContain('.sdp-xat-llista');
    expect(bloc359).toContain('min-inline-size: auto');
    // IDEA-323.3 (v1.2.22, ordre del Mestre del 261122) · L'accés ja no porta la benvinguda: cap regla per al
    // paràgraf (abans, v1.2.21 L2-01, la de 1rem i 1.5 en Sènior).
    expect(bloc359).not.toContain('.sdp-xat-acces > p');
    expect(bloc359).toContain('padding-inline: var(--sdp-space-3)');

    // Fora de @media (max-width: 359px), cap regla nova que altere >= 360px
    const fora359 = diferitSenior.slice(0, idxMedia);
    expect(fora359).not.toContain('.sdp-xat-cos--amb-peu .sdp-xat-fila');
    expect(fora359).not.toContain('.sdp-xat-llista__peu--acces');
  });

  test.each(['ca', 'es', 'en', 'eu', 'gl'])(
    'llengua %s (normal i Sènior): les dues files d’accions casen amb els selectors de 320px i tots els botons tenen type="button"',
    (lang) => {
      mocks.lang = lang;
      mocks.t = createTranslator(lang);
      for (const senior of [false, true]) {
        if (senior) document.documentElement.setAttribute('data-sdp-senior', 'true');
        else document.documentElement.removeAttribute('data-sdp-senior');

        const { unmount } = render(
          createElement(XatContext.Provider, { value: contextSenseSessio() }, createElement(XatSection))
        );
        const peu = document.querySelector('.sdp-xat-llista__peu--acces');
        expect(peu).not.toBeNull();
        const acces = peu.querySelector(':scope > .sdp-alerta.sdp-xat-acces');
        expect(acces).not.toBeNull();
        const filesAccions = acces.querySelectorAll(':scope > .sdp-alerta__accions');
        expect(filesAccions).toHaveLength(2);
        const botonsFila2 = within(filesAccions[1]).getAllByRole('button');
        expect(botonsFila2).toHaveLength(2);
        for (const b of botonsFila2) {
          expect(b.getAttribute('type')).toBe('button');
          expect(b.matches('.sdp-xat-llista__peu--acces > .sdp-xat-acces > .sdp-alerta__accions:last-of-type > .sdp-xat-pindola')).toBe(true);
          expect(b.textContent.trim().length).toBeGreaterThan(0);
        }
        unmount();
      }
    }
  );
});
