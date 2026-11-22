import '../../../tests/helpers/diccionaris.js';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';
import { UIProvider } from '../../app/contexts/UIContext';
import { ARBRES_MONUMENTALS_2020, FONT_CATALEG_ARBRES_2020 } from '../../data/patrimoni/arbresMonumentals2020.js';
import FitxaArbreMonumental from '../../sections/patrimoni/FitxaArbreMonumental.jsx';
import { formataAltArbreA11y, textosPatrimoniA11y } from '../../sections/patrimoni/i18nPatrimoniA11y.js';
import DocumentPrintPreview from './DocumentPrintPreview.jsx';
import { EstatDesament } from './EstatDesament.jsx';
import { PaginaEmojis } from './classificacio/PaginaEmojis.jsx';
import { textosUniversalControlsA11y } from './i18nUniversalControlsA11y.js';

vi.mock('../../sections/notes/NotesContext', () => ({
  useNotes: () => ({ canCreate: false, nomesLectura: true }),
}));

vi.mock('../../sections/patrimoni/useRevisionsArbre.js', () => ({
  useRevisionsArbre: () => ({ key: 'la-torre', files: [], fase: 'llest', disponible: false, autoritzat: false, mode: null }),
}));

const catalegEmojisMin = () => Promise.resolve({
  GRUPS_EMOJIS: [{ id: 'hort', nom: 'Hort', emojis: [['1F345', '🍅', 'tomato']] }],
});

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('Onada R32.39 · Lot 02 · FitxaArbreMonumental, DocumentPrintPreview, EstatDesament i PaginaEmojis en 5 llengües', () => {
  test.each(['ca', 'es', 'en', 'eu', 'gl'])('FitxaArbreMonumental localitza els 4 alt informatius i aplica roving tabIndex a les 5 pestanyes en %s', (llengua) => {
    const txPat = textosPatrimoniA11y(llengua);
    const baseArbre = ARBRES_MONUMENTALS_2020.find((a) => Boolean(a.fotos?.foto2020));
    const amb2020 = {
      ...baseArbre,
      fotos: { ...baseArbre.fotos, mapa: baseArbre.fotos.mapa || '/assets/mapa-2007.webp' },
    };
    const sense2020 = {
      ...amb2020,
      fotos: { ...amb2020.fotos, foto2020: null, fotoDetall2007: '/assets/detall-2007.webp' },
    };

    const { rerender } = render(
      <MemoryRouter>
        <UIProvider externalConfig={{ language: llengua }}>
          <FitxaArbreMonumental arbre={amb2020} fontDoctoral={FONT_CATALEG_ARBRES_2020} />
        </UIProvider>
      </MemoryRouter>
    );

    expect(screen.getByAltText(formataAltArbreA11y(txPat.altFotoBase2007Plantilla, { nom: amb2020.nom }))).toBeTruthy();
    expect(screen.getByAltText(formataAltArbreA11y(txPat.altFotoSeguiment2020Plantilla, { nom: amb2020.nom, data: amb2020.fotos.dataFoto2020 }))).toBeTruthy();
    expect(screen.getByAltText(formataAltArbreA11y(txPat.altMapaTopograficPlantilla, { nom: amb2020.nom }))).toBeTruthy();

    const tablist = screen.getByRole('tablist', { name: txPat.seccionsFitxaArbreAria });
    const tabs = within(tablist).getAllByRole('tab');
    expect(tabs).toHaveLength(5);
    expect(tabs.map((t) => t.tabIndex)).toEqual([0, -1, -1, -1, -1]);

    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].tabIndex).toBe(0);
    expect(tabs[0].tabIndex).toBe(-1);

    fireEvent.keyDown(tabs[1], { key: 'End' });
    expect(tabs[4].getAttribute('aria-selected')).toBe('true');

    fireEvent.keyDown(tabs[4], { key: 'Home' });
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');

    rerender(
      <MemoryRouter>
        <UIProvider externalConfig={{ language: llengua }}>
          <FitxaArbreMonumental arbre={sense2020} fontDoctoral={FONT_CATALEG_ARBRES_2020} />
        </UIProvider>
      </MemoryRouter>
    );
    expect(screen.getByAltText(formataAltArbreA11y(txPat.altFotoDetall2007Plantilla, { nom: sense2020.nom }))).toBeTruthy();
  });

  test.each(['ca', 'es', 'en', 'eu', 'gl'])('DocumentPrintPreview, EstatDesament i PaginaEmojis exposen noms accessibles coherents en %s', async (llengua) => {
    const tx = textosUniversalControlsA11y(llengua);

    render(
      <UIProvider externalConfig={{ language: llengua }}>
        <DocumentPrintPreview document={{ title: 'Crònica', content: '<p>Text</p>' }} />
      </UIProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Vista A4 / PDF' }));
    expect(screen.getByRole('dialog', { name: tx.impressio.titolDialeg })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: tx.impressio.inclourePortada })).toBeTruthy();
    expect(document.querySelector('iframe.sdp-print-preview')?.getAttribute('title')).toBe(tx.impressio.titolIframeA4);
    cleanup();

    const { container, rerender } = render(
      <UIProvider externalConfig={{ language: llengua }}>
        <EstatDesament estat="pendent" />
      </UIProvider>
    );
    expect(container.querySelector('[role="status"]')?.textContent).toBe(tx.desament.pendent);
    rerender(
      <UIProvider externalConfig={{ language: llengua }}>
        <EstatDesament estat="net" />
      </UIProvider>
    );
    expect(container.querySelector('.sdp-estat-desament--desat')?.getAttribute('aria-label')).toBe(tx.desament.net);
    rerender(
      <UIProvider externalConfig={{ language: llengua }}>
        <EstatDesament estat="error" />
      </UIProvider>
    );
    const botoError = screen.getByRole('button', { name: tx.desament.voreDetall(tx.desament.error) });
    act(() => { fireEvent.click(botoError); });
    expect(screen.getByRole('dialog', { name: tx.desament.titolDetall })).toBeTruthy();
    act(() => { fireEvent.click(screen.getByRole('button', { name: tx.desament.entesos })); });
    cleanup();

    render(
      <UIProvider externalConfig={{ language: llengua }}>
        <PaginaEmojis carregaCataleg={catalegEmojisMin} onTornar={vi.fn()} onTria={vi.fn()} emojiAlCursor={true} />
      </UIProvider>
    );
    expect(screen.getByRole('dialog', { name: tx.emojis.titolPerDefecte })).toBeTruthy();
    const botoTornar = screen.getByRole('button', { name: tx.emojis.tornar });
    expect(botoTornar.textContent.trim()).toBe(tx.emojis.tornar);
    expect(screen.getByRole('button', { name: tx.emojis.tancar })).toBeTruthy();
    expect(screen.getByText(tx.emojis.ajudaInserir)).toBeTruthy();
    await screen.findByRole('button', { name: 'tomato' });
  });
});
