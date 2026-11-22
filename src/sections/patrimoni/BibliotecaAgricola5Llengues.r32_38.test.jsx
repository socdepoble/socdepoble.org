import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';
import { FONTS_BANC_LLAVORS, entradesDelCataleg } from '../../data/patrimoni/bancLlavors.js';
import BancLlavorsWorkspaceSection from './BancLlavorsWorkspaceSection.jsx';
import CalendariAgricolaLlavorsView from './CalendariAgricolaLlavorsView.jsx';
import {
  CODIS_LLENGUA_BIBLIOTECA_AGRICOLA,
  codiLlenguaBibliotecaAgricola,
  textosBibliotecaAgricola
} from './i18nBibliotecaAgricola.js';

const ui = vi.hoisted(() => ({ language: 'ca', t: (_clau, reserva) => reserva }));
vi.mock('../../app/contexts/UIContext', async (orig) => ({
  ...(await orig()),
  useUIActions: () => ui,
  useUIActionsOpcional: () => ui,
  useUIStateOpcional: () => ({ language: ui.language })
}));
vi.mock('../../app/contexts/UIContext.jsx', async (orig) => ({
  ...(await orig()),
  useUIActions: () => ui,
  useUIActionsOpcional: () => ui,
  useUIStateOpcional: () => ({ language: ui.language })
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: vi.fn() })
}));
vi.mock('../text/TextSection', () => ({
  default: ({ children }) => <article>{children}</article>
}));

/* v1.2.22 · Gauntlet R2 (M5-02) · El rètol de la pestanya del Banc és una funció del total de fitxes, que es calcula
   ací de les dades, a part del component (avui 45 + 65 + 15 + 3 = 128). */
const TOTAL_FITXES = FONTS_BANC_LLAVORS.reduce((suma, font) => suma + entradesDelCataleg(font.id).length, 0);

beforeEach(() => {
  ui.language = 'ca';
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1024);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Onada R32.38 · Lot 02 · Biblioteca Agrícola i Calendari Agrícola en 5 llengües + roving tabindex WAI-ARIA', () => {
  test.each(CODIS_LLENGUA_BIBLIOTECA_AGRICOLA)(
    'completa totes les cadenes, grups, fases i 12 mesos en %s sense cap literal indefinit',
    (codi) => {
      expect(codiLlenguaBibliotecaAgricola(codi)).toBe(codi);
      const tx = textosBibliotecaAgricola(codi);
      expect(tx.mesos).toHaveLength(12);
      expect(tx.mesos.every((m) => typeof m === 'string' && m.length >= 3)).toBe(true);
      expect(tx.titolCalendari.length).toBeGreaterThan(10);
      expect(tx.introDespresFont(45)).toContain('45');
      expect(tx.recompteDe(12, 45)).toContain('12');
      expect(tx.veureVarietats(12)).toContain('12');
      expect(tx.paginaPdf(88)).toContain('88');
      expect(typeof tx.llibreLlavors).toBe('function');
      expect(tx.llibreLlavors(TOTAL_FITXES)).toContain(`(${TOTAL_FITXES} `);
      expect(tx.empremtaDeclarada).toMatch(/SHA-256/);
      expect(tx.registreDocument.length).toBeGreaterThan(5);
    }
  );

  test.each(CODIS_LLENGUA_BIBLIOTECA_AGRICOLA)(
    'CalendariAgricolaLlavorsView renderitza títol, filtres, 12 mesos i declara lang="ca" al títol de la font fora del valencià (%s)',
    (codi) => {
      ui.language = codi;
      const tx = textosBibliotecaAgricola(codi);
      const { container } = render(<CalendariAgricolaLlavorsView onObrirVarietat={() => {}} />);

      expect(screen.getByRole('heading', { level: 3, name: tx.titolCalendari })).toBeTruthy();
      expect(screen.getByRole('button', { name: tx.grups.tomaques })).toBeTruthy();
      expect(screen.getByRole('button', { name: tx.totesLesFases })).toBeTruthy();
      expect(screen.getByRole('button', { name: tx.totLAny12Mesos })).toBeTruthy();
      expect(screen.getByRole('button', { name: tx.mesos[11] })).toBeTruthy();
      expect(screen.getAllByRole('button', { name: tx.obrirFitxaVarietat }).length).toBeGreaterThan(0);

      const fontStrong = container.querySelector('section.sdp-calendari-agricola > div > p > strong');
      expect(fontStrong).not.toBeNull();
      if (codi === 'ca') {
        expect(fontStrong.getAttribute('lang')).toBeNull();
      } else {
        expect(fontStrong.getAttribute('lang')).toBe('ca');
      }
    }
  );

  test('BancLlavorsWorkspaceSection traduïx els 3 llibres en les 5 llengües i aplica roving tabindex amb ArrowRight/ArrowLeft/Home/End', () => {
    ui.language = 'eu';
    const txEu = textosBibliotecaAgricola('eu');
    render(
      <MemoryRouter rutaInicial="/page/banc-de-llavors">
        <BancLlavorsWorkspaceSection page={{}} />
      </MemoryRouter>
    );

    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent.trim())).toEqual([
      `🌱${txEu.llibreLlavors(TOTAL_FITXES)}`,
      `🍅${txEu.llibreCalendari}`,
      `🧊${txEu.llibreAnatomia}`,
    ]);
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1, -1]);

    tabs[0].focus();
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(tabs[1]);
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([-1, 0, -1]);
    // Selecció per activació: moure el focus amb fletxa encara no activa el tros diferit
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');

    fireEvent.keyDown(tabs[1], { key: 'End' });
    expect(document.activeElement).toBe(tabs[2]);
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([-1, -1, 0]);

    fireEvent.keyDown(tabs[2], { key: 'Home' });
    expect(document.activeElement).toBe(tabs[0]);
  });
});
