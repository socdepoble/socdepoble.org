import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';
import { UIProvider } from '../../app/contexts/UIContext';
import BrainGraph, { grafDeLaWiki } from '../../components/universal/graph/BrainGraph.jsx';
import { textosBrainGraphA11y } from '../../components/universal/graph/i18nBrainGraph.js';
import { construeixBrainTaxonomia, idEtiquetaBrain } from '../../data/taxonomia/brainTaxonomia.js';
import { BrainTaxonomiaVista } from './BrainTaxonomia.jsx';
import { textosBrainTaxonomiaA11y } from './i18nBrainTaxonomia.js';

vi.mock('../../components/universal/graph/useForceLayout', () => ({
  default: vi.fn(({ nodes }) => ({ current: nodes.map((node, i) => ({ ...node, x: 240 + i * 60, y: 200 })) })),
}));

const GRAF_PROVA = grafDeLaWiki({
  categories: [{ id: 'cat_saber', label: 'Saber' }],
  items: [{ id: 'doc_olivera', title: 'Olivera', categoryId: 'cat_saber', tags: ['poble'] }],
});

const MODEL_BRAIN = () => construeixBrainTaxonomia({
  publicacions: [{ id: 'pub-1', title: 'Article del poble', labels: ['Herbari', 'Llavors', 'Projectes'] }],
  coberturaViva: { parcial: true, estat: 'ready' },
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
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(new Proxy({}, {
    get: () => () => {},
    set: () => true,
  }));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('Onada R32.39 · Lot 01 · BrainGraph i BrainTaxonomia a11y en 5 llengües', () => {
  test.each(['ca', 'es', 'en', 'eu', 'gl'])('BrainGraph exposa controls, inspector i icones decoratives ocultes en %s', (llengua) => {
    const tx = textosBrainGraphA11y(llengua);
    render(
      <UIProvider externalConfig={{ language: llengua }}>
        <BrainGraph graf={GRAF_PROVA} />
      </UIProvider>
    );

    const grup = screen.getByRole('group', { name: tx.controlsGraf });
    const botons = within(grup).getAllByRole('button');
    expect(botons).toHaveLength(4);
    for (const boto of botons) {
      const svg = boto.querySelector('svg');
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
    }

    expect(within(grup).getByRole('button', { name: tx.pausarSimulacioAria })).toBeTruthy();
    expect(within(grup).getByRole('button', { name: tx.aproparAria })).toBeTruthy();
    expect(within(grup).getByRole('button', { name: tx.allunyarAria })).toBeTruthy();
    expect(within(grup).getByRole('button', { name: tx.centrarAria })).toBeTruthy();

    fireEvent.click(within(grup).getByRole('button', { name: tx.pausarSimulacioAria }));
    expect(within(grup).getByRole('button', { name: tx.reprendreSimulacioAria })).toBeTruthy();

    const inspector = screen.getByRole('complementary', { name: tx.textosWiki.inspector });
    fireEvent.change(within(inspector).getByRole('combobox'), { target: { value: 'doc_olivera' } });
    const botoNetejar = within(inspector).getByRole('button', { name: tx.netejarSeleccio });
    expect(botoNetejar.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  test.each(['ca', 'es', 'en', 'eu', 'gl'])('BrainTaxonomiaVista localitza totes les regions i navegacions ARIA en %s', (llengua) => {
    const tx = textosBrainTaxonomiaA11y(llengua);
    render(
      <MemoryRouter>
        <UIProvider externalConfig={{ language: llengua }}>
          <BrainTaxonomiaVista model={MODEL_BRAIN()} />
        </UIProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('region', { name: tx.segonBrainAria })).toBeTruthy();
    expect(screen.getByRole('region', { name: tx.procedenciaAria })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: tx.vistesAria })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: tx.dimensionsAria })).toBeTruthy();
    expect(screen.getByRole('region', { name: tx.fitxaMitAria })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Laboratori de decisions' }));
    expect(screen.getByRole('region', { name: tx.propostesMestreAria })).toBeTruthy();
    expect(screen.getByRole('region', { name: tx.lecturaSimulacioAria })).toBeTruthy();
    expect(screen.getByRole('region', { name: tx.nomsEtapaAria(tx.etapaAbans) })).toBeTruthy();
    expect(screen.getByRole('region', { name: tx.nomsEtapaAria(tx.etapaDespres) })).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Concepte per a escurçar'), { target: { value: idEtiquetaBrain('Herbari') } });
    fireEvent.change(screen.getByLabelText('Nom de prova'), { target: { value: 'Llavors' } });
    expect(screen.getByRole('region', { name: tx.collisionsAria })).toBeTruthy();
  });
});
