/**
 * ModeHumaPur.r32_50.test.jsx — Onada v1.2.23 (R32.50) · IDEA-334 ·
 * Certifica en les 5 llengües oficials (ca, es, en, eu, gl) l'interruptor
 * «Experiència 100 % humana (amagar assistents d'IA)» i l'ocultació neta
 * del botó de la IAIA de la barra negra superior, del botó «🔊 Escolta la IAIA»
 * (PageFrame + BotoVeuIaia) i de la conversa suggerida amb la IAIA, restaurant
 * el nivell previ en tornar-lo a desactivar.
 */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { MemoryRouter } from '../../app/contexts/RouterContext';
import { UIProvider } from '../../app/contexts/UIContext';
import { NotificationProvider } from './NotificationContext.jsx';
import ControlModeHumaPur from './ControlModeHumaPur.jsx';
import { PageFrame } from './PageFrame.jsx';
import { BotoVeuIaia } from '../PedraSeca/molecules/BotoVeuIaia.jsx';
import { CosAjustos } from '../../sections/xat/components/FullAjustos.jsx';
import { TEXTOS_MODE_HUMA_PUR } from '../../config/textosModeHumaPur.js';
import {
  CLAU_NIVELL_IAIA,
  CLAU_NIVELL_IAIA_PREVI,
  activaModeHumaPur,
  esModeHumaPur,
  nivellIaiaDesat,
} from '../../sections/realitat/nivellIaia.js';
import { delVal, getVal, setVal } from '../../config/storage.js';
import PedraSecaEmbed, { activeElements } from '../../PedraSecaEmbed.jsx';
import { CONTRACTE_NUCLI } from '../../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../../data/backendPort.js';

vi.mock('../../host.js', () => ({ quanLlest: async () => undefined, arrencaAuto: vi.fn(), exposaGlobal: vi.fn() }));
vi.mock('../../sections/notes/GlobalSaveManager.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getDraftsForScope: async () => ({}),
}));

let anteriorBackend = null;

beforeEach(() => {
  localStorage.clear();
  delVal(CLAU_NIVELL_IAIA);
  delVal(CLAU_NIVELL_IAIA_PREVI);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
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
  anteriorBackend = { ...getBackendImplementation() };
  setBackendImplementation({
    ...Object.fromEntries(CONTRACTE_NUCLI.map((nom) => [nom, async () => null])),
    getCurrentUser: () => null,
    getRuntimeDataMode: () => 'local',
    getBackendConfigurat: () => true,
    getDefaultUserId: () => null,
    recullTornadaOAuth: async () => null,
    loadCoreContent: async () => ({ towns: [], pages: [], agents: [] }),
    loadMur: async () => ({ feedPosts: [], events: [], marketItems: [] }),
    loadNotes: async () => ({ notes: [], noteFolders: [] }),
    loadMultimedia: async () => ({ mediaItems: [], mediaTimelineGroups: [] }),
    loadFils: async () => [],
  });
});

afterEach(async () => {
  cleanup();
  await act(async () => {
    for (const element of [...activeElements]) {
      element.remove();
      element._desmuntaAra();
    }
  });
  document.body.replaceChildren();
  localStorage.clear();
  if (anteriorBackend && Object.keys(anteriorBackend).length) setBackendImplementation(anteriorBackend);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('IDEA-334 · Experiència 100 % humana (amagar assistents d’IA) en 5 llengües', () => {
  test.each(Object.entries(TEXTOS_MODE_HUMA_PUR))(
    'en %s pinta l’interruptor accessible role="switch", commuta nivell 0 i restaura el nivell previ',
    (codi, tx) => {
      setVal(CLAU_NIVELL_IAIA, '2');
      const { unmount } = render(<ControlModeHumaPur llengua={codi} ambDescripcio />);
      expect(screen.getByText(tx.descripcio)).toBeTruthy();

      const sw = screen.getByRole('switch', { name: tx.xip });
      expect(sw.getAttribute('aria-checked')).toBe('false');
      expect(esModeHumaPur()).toBe(false);

      fireEvent.click(sw);
      expect(sw.getAttribute('aria-checked')).toBe('true');
      expect(nivellIaiaDesat()).toBe(0);
      expect(getVal(CLAU_NIVELL_IAIA_PREVI)).toBe('2');
      expect(esModeHumaPur()).toBe(true);

      fireEvent.click(sw);
      expect(sw.getAttribute('aria-checked')).toBe('false');
      expect(nivellIaiaDesat()).toBe(2);
      expect(esModeHumaPur()).toBe(false);
      expect(esModeHumaPur(null)).toBe(false);
      expect(esModeHumaPur('')).toBe(false);
      expect(esModeHumaPur(false)).toBe(false);

      for (const prohibit of [/sobir[aà]/i, /mas[ií]a/i, /servidor del poble/i]) {
        expect(tx.xip).not.toMatch(prohibit);
        expect(tx.descripcio).not.toMatch(prohibit);
      }
      unmount();
    }
  );

  test('amaga en viu el botó «🔊 Escolta la IAIA» tant a PageFrame com a BotoVeuIaia i el restaura en desactivar', async () => {
    window.speechSynthesis = {
      getVoices: () => [{ lang: 'ca-ES-valencia', name: 'Valencià' }],
      speak: vi.fn(),
      cancel: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    window.SpeechSynthesisUtterance = function Enunciat(text) { this.text = text; };

    render(
      <MemoryRouter rutaInicial="/page/projecte">
        <UIProvider>
          <NotificationProvider>
            <PageFrame title="El projecte" subtitle="Història rural" chrome="full">
              <p>Aquest paràgraf té prou prosa editorial perquè PageFrame active el disparador universal de lectura oral.</p>
              <BotoVeuIaia text="Text curt d'exemple" data-testid="boto-veu-directe" />
            </PageFrame>
          </NotificationProvider>
        </UIProvider>
      </MemoryRouter>
    );

    expect(document.querySelector('.sdp-veu-lectura-marc')).toBeTruthy();
    expect(screen.getByTestId('boto-veu-directe')).toBeTruthy();

    act(() => { activaModeHumaPur(true); });
    expect(document.querySelector('.sdp-veu-lectura-marc')).toBeNull();
    expect(screen.queryByTestId('boto-veu-directe')).toBeNull();

    act(() => { activaModeHumaPur(false); });
    expect(document.querySelector('.sdp-veu-lectura-marc')).toBeTruthy();
    expect(screen.getByTestId('boto-veu-directe')).toBeTruthy();
  });

  test('amaga en viu el botó de la IAIA de la barra superior (header.bar-black) i retira la conversa suggerida de la IAIA al Xat', async () => {
    window.history.replaceState(null, '', '/xat');
    render(<PedraSecaEmbed config={{ routerType: 'browser', manageDocumentHead: false, language: 'ca' }} />);
    await screen.findByRole('main');

    const topBar = document.querySelector('header.bar-black');
    expect(within(topBar).getByRole('button', { name: 'IAIA MarIA' })).toBeTruthy();
    await screen.findByRole('button', { name: /IAIA MarIA/i, hidden: false });

    act(() => { activaModeHumaPur(true); });
    expect(within(topBar).queryByRole('button', { name: 'IAIA MarIA' })).toBeNull();
    expect(document.getElementById('app-grid-list')?.textContent || '').not.toContain('IAIA MarIA');

    act(() => { activaModeHumaPur(false); });
    expect(within(topBar).getByRole('button', { name: 'IAIA MarIA' })).toBeTruthy();
  });

  test('CosAjustos (Ajustos del Xat -> Aparença) exposa l’interruptor «Experiència 100 % humana (amagar assistents d’IA)»', () => {
    render(
      <CosAjustos
        t={(_clau, reserva) => reserva}
        llengua="ca"
        tema="light"
        contrast="normal"
        amplaria="defecte"
        onTema={() => {}}
        onContrast={() => {}}
        onLlengua={() => {}}
        onAmplaria={() => {}}
        onVes={() => {}}
        onObriConversa={() => {}}
        onTanca={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /^Aparença/ }));
    const sw = screen.getByTestId('control-mode-huma-pur-xat');
    expect(sw.getAttribute('role')).toBe('switch');
    expect(sw.textContent).toContain("Experiència 100 % humana (amagar assistents d'IA)");
    fireEvent.click(sw);
    expect(esModeHumaPur()).toBe(true);
  });
});
