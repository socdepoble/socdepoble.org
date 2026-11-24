/**
 * VeuUnificadaHerbari.r32_50.test.jsx — Onada v1.2.23 (R32.50) · IDEA-337 ·
 * Certifica que:
 *   1. S'ha extirpat el botó fantasma «Escolta amb la veu local del dispositiu»
 *      i `locutorHerbariLocal.js` ja no existeix al mòdul de l'Herbari.
 *   2. Dins de `UniversalPage` / `PageFrame`, la fitxa de l'Herbari exposa un
 *      únic motor de lectura oral («🔊 Escolta la IAIA»), que llig tant la
 *      sinonímia de `.sdp-taula-prosa` com l'avís de seguretat botànica.
 *   3. En fallback offline del navegador, `veuIaiaService` prioritza `ca-ES-valencia`
 *      i les veus identificades com a valencianes davant de les orientals.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { MemoryRouter } from '../../app/contexts/RouterContext';
import { UIProvider } from '../../app/contexts/UIContext';
import { NotificationProvider } from '../../components/universal/NotificationContext.jsx';
import { extreuBlocsLecturaVeu } from '../../components/universal/veu/lectorPaginaVeu.js';
import { ESPECIES_HERBARI_LA_TORRE_117 } from '../../data/patrimoni/herbariLaTorre117.js';
import { parla, reiniciaVeuPerProves, triaVeu } from '../../services/veuIaiaService.js';
import HerbariWorkspaceSection from './HerbariWorkspaceSection.jsx';

vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));

beforeEach(() => {
  reiniciaVeuPerProves();
  vi.stubGlobal('matchMedia', vi.fn((media) => ({
    matches: false,
    media,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  })));
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
});

afterEach(() => {
  cleanup();
  reiniciaVeuPerProves();
  delete window.speechSynthesis;
  delete window.SpeechSynthesisUtterance;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('IDEA-337 · Extirpació del segon botó fantasma i unificació en «🔊 Escolta la IAIA»', () => {
  test('locutorHerbariLocal.js i la seua prova han sigut extirpats del repositori', () => {
    expect(existsSync(resolve(process.cwd(), 'src/sections/patrimoni/locutorHerbariLocal.js'))).toBe(false);
    expect(existsSync(resolve(process.cwd(), 'src/sections/patrimoni/locutorHerbariLocal.test.js'))).toBe(false);
  });

  test('la fitxa oberta a UniversalPage té exactament un sol botó de veu («Escolta la IAIA») i llig sinonímia + avís de seguretat', async () => {
    window.speechSynthesis = {
      getVoices: () => [{ lang: 'ca-ES-valencia', name: 'Valencià' }],
      speak: vi.fn(),
      cancel: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    window.SpeechSynthesisUtterance = function Enunciat(text) { this.text = text; };

    render(
      <MemoryRouter rutaInicial="/page/herbari">
        <UIProvider>
          <NotificationProvider>
            <div className="sdp-root">
              <HerbariWorkspaceSection page={{ title: 'Herbari de La Torre', html: '<p>Presentació documental.</p>' }} />
            </div>
          </NotificationProvider>
        </UIProvider>
      </MemoryRouter>
    );

    const llista = document.getElementById('app-grid-list');
    const arnet = ESPECIES_HERBARI_LA_TORRE_117.find((e) => e.id.includes('arnet-roig')) || ESPECIES_HERBARI_LA_TORRE_117[0];
    fireEvent.click(within(llista).getByRole('button', { name: arnet.nomValencia, exact: true }));

    const detall = document.getElementById('app-grid-main');
    const botonsEscoltaIaia = within(detall).getAllByRole('button', { name: /Escolta la IAIA/i });
    expect(botonsEscoltaIaia).toHaveLength(1);
    expect(detall.textContent).not.toMatch(/veu local del dispositiu|voz local del dispositivo|local voice/i);

    const capcalera = detall.querySelector('header.page-title');
    const cos = detall.querySelector('article.content-wrapper');
    const blocs = extreuBlocsLecturaVeu({ capcalera, cos });
    const textComplet = blocs.map((b) => b.text).join(' | ');

    expect(textComplet).toContain(arnet.nomValencia);
    expect(textComplet).toContain(arnet.nomCastella);
    expect(textComplet).toContain(arnet.nomAngles);
    expect(textComplet).toContain(arnet.nomCientific);
    expect(textComplet).toContain('no acredita innocuïtat');
  });

  test('en fallback offline prioritza ca-ES-valencia i veus amb nom valencià per damunt de català oriental', async () => {
    const pronunciats = [];
    window.speechSynthesis = {
      getVoices: () => [
        { lang: 'ca-ES', name: 'Jordi' },
        { lang: 'ca-ES', name: 'Pau · Valencià' },
      ],
      speak: vi.fn((u) => {
        pronunciats.push(u);
        queueMicrotask(() => u.onend?.());
      }),
      cancel: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    window.SpeechSynthesisUtterance = function Enunciat(text) { this.text = text; };

    expect(triaVeu(window.speechSynthesis.getVoices(), 'ca')?.name).toBe('Pau · Valencià');
    await parla('Arnet roig de la serra.', { idioma: 'ca', privat: true });
    expect(pronunciats).toHaveLength(1);
    expect(pronunciats[0].voice.name).toBe('Pau · Valencià');
  });
});
