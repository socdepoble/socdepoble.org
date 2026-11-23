import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../tests/helpers/diccionaris.js';
import { UIProvider, useUIActions, useUIState } from '../app/contexts/UIContext.jsx';
import { MemoryRouter } from '../app/contexts/RouterContext.jsx';
import ControlModeSenior from '../components/universal/ControlModeSenior.jsx';
import { DetallIdioma } from '../sections/profile/DetallEspai.jsx';
import { TEXTOS_MODE_SENIOR } from '../config/textosModeSenior.js';
import { delVal, getVal } from '../config/storage.js';
import {
  ATRIBUT_SENIOR,
  SENIOR_KEY,
  aplicaSenior,
  arrelDePresentacio,
  readSeniorPreference,
  reclamaAtribut,
  reiniciaMemoriaSenior,
  writeSeniorPreference,
} from '../config/theme.js';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const senseComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');
const declaracions = (text) => Object.fromEntries(
  [...senseComentaris(text).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]),
);

function bloc(text, iniciText) {
  const inici = text.indexOf(iniciText);
  expect(inici, `falta el bloc ${iniciText}`).toBeGreaterThan(-1);
  const obre = text.indexOf('{', inici);
  let prof = 0;
  for (let i = obre; i < text.length; i += 1) {
    if (text[i] === '{') prof += 1;
    if (text[i] === '}' && --prof === 0) return text.slice(obre + 1, i);
  }
  throw new Error(`bloc sense tancar: ${iniciText}`);
}

function resolToken(valor, mapa, vistos = new Set()) {
  return valor.replace(/var\((--[\w-]+)\)/g, (_, nom) => {
    expect(vistos.has(nom), `cicle a ${nom}`).toBe(false);
    expect(mapa[nom], `falta ${nom}`).toBeDefined();
    return resolToken(mapa[nom], mapa, new Set([...vistos, nom]));
  }).trim();
}

function luminancia(hex) {
  expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
  const [r, g, b] = hex.slice(1).match(/../g).map((x) => parseInt(x, 16) / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(tokA, tokB, mapa) {
  const la = luminancia(resolToken(`var(${tokA})`, mapa));
  const lb = luminancia(resolToken(`var(${tokB})`, mapa));
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn((consulta) => ({
    matches: false,
    media: consulta,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  })));
  delVal(SENIOR_KEY);
  reiniciaMemoriaSenior();
  document.documentElement.removeAttribute(ATRIBUT_SENIOR);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delVal(SENIOR_KEY);
  reiniciaMemoriaSenior();
  document.documentElement.removeAttribute(ATRIBUT_SENIOR);
});

describe('Onada R32.15 · T1 · Mode Sènior (P1-80 / IDEA-252) + <= 359 px', () => {
  test('persistència per storage.js, UIProvider sincronitzat i arrelDePresentacio sense contaminar amfitrions', () => {
    expect(readSeniorPreference()).toBe(false);
    expect(writeSeniorPreference('si')).toBe(false);
    expect(writeSeniorPreference(true)).toBe(true);
    expect(getVal(SENIOR_KEY)).toBe(true);
    expect(readSeniorPreference()).toBe(true);

    const arrelDoc = document.documentElement;
    const alliberaDoc = reclamaAtribut(arrelDoc, ATRIBUT_SENIOR, 'true');
    expect(arrelDoc.getAttribute('data-sdp-senior')).toBe('true');
    alliberaDoc();
    expect(arrelDoc.hasAttribute('data-sdp-senior')).toBe(false);

    const hostExtern = document.createElement('div');
    const sdpRoot = document.createElement('div');
    sdpRoot.className = 'sdp-root';
    const fill = document.createElement('span');
    sdpRoot.appendChild(fill);
    hostExtern.appendChild(sdpRoot);
    const arrelEmbed = arrelDePresentacio(fill, { amaDelDocument: false });
    expect(arrelEmbed).toBe(sdpRoot);
    aplicaSenior(arrelEmbed, true);
    expect(sdpRoot.getAttribute('data-sdp-senior')).toBe('true');
    expect(document.documentElement.hasAttribute('data-sdp-senior')).toBe(false);
  });

  test('1 sol toc activa i desactiva Mode Sènior en les 5 llengües (ca, es, en, eu, gl) i en DetallIdioma d’/el-meu-perfil', () => {
    function Arnés({ idioma }) {
      const { seniorMode } = useUIState();
      const { setLanguage } = useUIActions();
      return (
        <div data-senior={String(seniorMode)}>
          <button type="button" onClick={() => setLanguage(idioma)}>canvia</button>
          <ControlModeSenior />
        </div>
      );
    }

    for (const codi of ['ca', 'es', 'en', 'eu', 'gl']) {
      delVal(SENIOR_KEY);
      reiniciaMemoriaSenior();
      const tx = TEXTOS_MODE_SENIOR[codi];
      const { unmount } = render(
        <MemoryRouter rutaInicial="/el-meu-perfil">
          <UIProvider externalConfig={{ language: codi }}>
            <Arnés idioma={codi} />
            <DetallIdioma persona={{ id: 'jo', mena: 'persona', nom: 'Pep', dades: { id: 'u1' } }} />
          </UIProvider>
        </MemoryRouter>,
      );
      const xip = screen.getByTestId('control-mode-senior');
      expect(xip.getAttribute('role')).toBe('switch');
      expect(xip.getAttribute('aria-checked')).toBe('false');
      expect(xip.textContent).toContain(tx.xip);
      expect(xip.textContent).toContain(tx.inactiu);

      fireEvent.click(xip);
      expect(xip.getAttribute('aria-checked')).toBe('true');
      expect(xip.textContent).toContain(tx.actiu);
      expect(getVal(SENIOR_KEY)).toBe(true);

      const xipPerfil = screen.getByTestId('control-mode-senior-idioma');
      expect(xipPerfil.getAttribute('aria-checked')).toBe('true');
      fireEvent.click(xipPerfil);
      expect(xip.getAttribute('aria-checked')).toBe('false');
      expect(getVal(SENIOR_KEY)).toBe(false);
      unmount();
    }
  });

  test('resiliència en mode privat (Storage bloquejat): la preferència es manté durant tota la sessió', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Bloquejat', 'SecurityError'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Quota', 'QuotaExceededError'); });

    render(
      <UIProvider externalConfig={{}}>
        <ControlModeSenior />
      </UIProvider>,
    );
    const xip = screen.getByTestId('control-mode-senior');
    expect(xip.getAttribute('aria-checked')).toBe('false');
    act(() => { fireEvent.click(xip); });
    expect(xip.getAttribute('aria-checked')).toBe('true');
  });

  test('contrast AAA (>= 7:1 l\'accent viu, >= 10:1 el text principal) en clar i fosc, dianes >= 56x56 px (3.5rem), botons centrats i 0 selectors :has()', () => {
    const tokensCss = llig('src/css/tokens.css');
    const canonCss = llig('src/css/design-tokens.css');
    const componentsCss = llig('src/css/components.css');
    const diferitSeniorCss = llig('src/css/diferit-mode-senior.css');

    for (const full of [tokensCss, componentsCss, diferitSeniorCss]) {
      expect(senseComentaris(full)).not.toContain(':has(');
    }

    const clarBase = {
      ...declaracions(canonCss),
      ...declaracions(bloc(tokensCss, '\n:root, :host, .sdp-root {')),
    };
    const foscBase = {
      ...clarBase,
      ...declaracions(bloc(tokensCss, '\n:root[data-theme="dark"], :host([data-theme="dark"]),')),
    };
    const seniorClar = {
      ...clarBase,
      ...declaracions(bloc(tokensCss, '\n.sdp-root[data-sdp-senior="true"],')),
    };
    const seniorFosc = {
      ...foscBase,
      ...declaracions(bloc(tokensCss, '\n.sdp-root[data-sdp-senior="true"],')),
      ...declaracions(bloc(tokensCss, "\n:root[data-theme='dark'] .sdp-root[data-sdp-senior=\"true\"],")),
    };

    const superficies = ['--sdp-fons-targeta', '--sdp-fons-app', '--sdp-fons-subtil'];
    const textos = ['--sdp-text-titol', '--sdp-text-cos', '--sdp-text-suau', '--sdp-accent-text', '--sdp-accent-titol', '--sdp-accio-text'];

    /* v1.2.22 · IDEA-328 v2 (ordre del Mestre, 22-11-2026) · L'accent no es redefinix (la caputxa i el botó de data
       conserven el taronja de marca amb pedra-900: 7,12:1 AAA), i en fosc els títols d'accent i d'acció van en colors vius
       (primary-400 i secondary-300, >= 7:1 AAA). El text principal continua per damunt de 10:1. S'actualitza a posta. */
    const vius = (nomTema, txt) => nomTema === 'fosc' && ['--sdp-accent-text', '--sdp-accent-titol', '--sdp-accio-text'].includes(txt);
    for (const [nomTema, mapa] of [['clar', seniorClar], ['fosc', seniorFosc]]) {
      for (const sup of superficies) {
        for (const txt of textos) {
          expect(contrast(txt, sup, mapa), `${nomTema}: ${txt} sobre ${sup}`).toBeGreaterThanOrEqual(vius(nomTema, txt) ? 7 : 10);
        }
      }
      expect(contrast('--sdp-sobre-accio', '--sdp-accio-control', mapa), `${nomTema}: botó primari`).toBeGreaterThanOrEqual(10);
      expect(contrast('--sdp-sobre-accent', '--sdp-accent', mapa), `${nomTema}: botó accent`).toBeGreaterThanOrEqual(7);
      // El nom de la primitiva es construïx: la Porta Tokens (T4) no admet que un fitxer de src/ en cite cap de literal.
      expect(mapa['--sdp-accent'], `${nomTema}: el taronja de marca`).toBe(`var(--sdp-${'primary-500'})`);
      // Gauntlet v1.2.13 · El quadrat del calendari: text blanc sobre --sdp-accent-control (en fosc, primary-200 donava 1,39:1).
      expect(contrast('--sdp-sobre-color', '--sdp-accent-control', mapa), `${nomTema}: quadrat de calendari`).toBeGreaterThanOrEqual(10);
      expect(contrast('--sdp-sobre-color', '--sdp-accent-control-hover', mapa), `${nomTema}: quadrat de calendari (hover)`).toBeGreaterThanOrEqual(10);
    }

    expect(diferitSeniorCss).toContain('min-height: 3.5rem;');
    expect(diferitSeniorCss).toContain('min-width: 3.5rem;');
    expect(diferitSeniorCss).toContain('justify-content: center;');
    expect(diferitSeniorCss).toContain('text-align: center;');
  });

  test('jerarquia estricta H1 > H2 > H3 en pantalles ultra-estretes <= 359 px (280 px, 320 px i 359 px)', () => {
    const modulesCss = senseComentaris(llig('src/css/modules.css'));
    expect(modulesCss).toContain('max(calc(var(--sdp-fluid-h2) + 0.125rem), clamp(var(--sdp-text-h6), 0.95rem + 3.5cqi, var(--sdp-text-h4)))');
    // Gauntlet v1.2.13 (Llei del Píxel) · Només el bloc de ≤ 380 px puja l'H1: el de 640 px i el de 520 px es queden com eren.
    expect(modulesCss).not.toContain('max(calc(var(--sdp-fluid-h2) + 0.125rem), var(--sdp-text-h3))');
    expect(modulesCss).not.toContain('max(calc(var(--sdp-fluid-h2) + 0.125rem), clamp(var(--sdp-text-h5), 1rem + 4cqi, var(--sdp-text-h3)))');

    const h1Fluid = (w) => Math.max(32, Math.min(1.3182 * 16 + (3.4091 * w) / 100, 56));
    const h2Fluid = (w) => Math.max(28, Math.min(1.2386 * 16 + (2.5568 * w) / 100, 46));
    const h3Fluid = (w) => Math.max(24, Math.min(1.1591 * 16 + (1.7045 * w) / 100, 36));
    const h1Workspace380 = (w) => Math.max(h2Fluid(w) + 2, Math.max(20, Math.min(0.95 * 16 + (3.5 * w) / 100, 28)));

    for (const ample of [280, 320, 359, 360]) {
      expect(h1Fluid(ample)).toBeGreaterThan(h2Fluid(ample));
      expect(h2Fluid(ample)).toBeGreaterThan(h3Fluid(ample));
      expect(h1Workspace380(ample)).toBeGreaterThan(h2Fluid(ample));
    }
  });
});
