import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../src/app/contexts/RouterContext.jsx';
import { AppGridContext } from '../src/components/layout/AppGridShell.jsx';
import manifestBar from '../src/apps/bar/manifest.js';
import manifestGenealogia from '../src/apps/genealogia/manifest.js';
import { ProveidorApp } from '../src/apps/plataforma/ContextApp.jsx';
import { ProveidorGenealogia } from '../src/apps/genealogia/nucli/index.js';
import { PreguntaEntrevista } from '../src/apps/genealogia/vistes/Entrevista.jsx';
import { creaMagatzemGenealogia } from '../src/apps/genealogia/magatzem.js';
import { SelectorModeCalendari } from '../src/sections/calendari/DesplegableEsdevenimentsCalendari.jsx';
import VistaEnConstruccio from '../src/sections/xat/components/VistaEnConstruccio.jsx';

const cssXatV1225 = readFileSync(path.resolve(process.cwd(), 'src/css/diferit-xat-v1225.css'), 'utf8');

vi.mock('../src/app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_k, f) => f, language: 'ca' }),
  useUIState: () => ({ language: 'ca', llenguaDelText: 'ca' }),
}));

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Lot G7 · ML-06 (Entrevista compacta), ML-12 (manifest Bar) i RR-D13-03 (Calendari ambError)', () => {
  test('ML-12 · manifest del Bar declara entradaPerDefecte cataleg de forma coherent', () => {
    expect(manifestBar.id).toBe('bar');
    expect(manifestBar.entradaPerDefecte).toBe('cataleg');
    expect(manifestBar.entrades.some((e) => e.slug === 'cataleg')).toBe(true);
    expect(manifestBar.entrades.some((e) => e.slug === 'tpv')).toBe(true);
  });

  test('ML-06 · Entrevista de Genealogia compacta progrés+regla i ajuda+exemple amb .sdp-camp__ajuda', async () => {
    const magatzem = creaMagatzemGenealogia({ idb: null });
    render(
      <MemoryRouter initialEntries={['/app/genealogia/entrevista']}>
        <AppGridContext.Provider value={{ mida: 'estret', columnaActiva: 'detall' }}>
          <ProveidorApp manifest={manifestGenealogia} idioma="ca">
            <ProveidorGenealogia magatzem={magatzem} versioAvis="1">
              <PreguntaEntrevista />
            </ProveidorGenealogia>
          </ProveidorApp>
        </AppGridContext.Provider>
      </MemoryRouter>
    );
    const input = await screen.findByRole('textbox');
    expect(input).toBeTruthy();
    const ajudes = document.querySelectorAll('.sdp-camp__ajuda');
    expect(ajudes.length).toBeGreaterThanOrEqual(2);
  });

  test('RR-D13-03 · SelectorModeCalendari no pinta l’estat buit ni role=status quan ambError és true', () => {
    const { rerender } = render(
      <MemoryRouter>
        <SelectorModeCalendari mode="events" onCanviMode={vi.fn()} entradesEsdeveniments={[]} ambError={true} />
      </MemoryRouter>
    );
    expect(screen.queryByRole('status')).toBeNull();

    rerender(
      <MemoryRouter>
        <SelectorModeCalendari mode="events" onCanviMode={vi.fn()} entradesEsdeveniments={[]} ambError={false} />
      </MemoryRouter>
    );
    expect(screen.getByRole('status')).toBeTruthy();
  });

  test('XAT-B04 · VistaEnConstruccio aplica opacitat d’inert i min-block-size var(--sdp-touch) al cercador', () => {
    render(
      <VistaEnConstruccio
        titol="Telefonades"
        accio={{ tipus: 'nou', etiqueta: 'Nova telefonada' }}
        cerca="Nom del contacte"
        t={(_k, f) => f}
      />
    );
    expect(screen.getByRole('button', { name: 'Nova telefonada' }).getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByRole('searchbox', { name: 'Nom del contacte' }).getAttribute('aria-disabled')).toBe('true');
    expect(cssXatV1225).toContain('.sdp-xat-inert[aria-disabled="true"]');
    expect(cssXatV1225).toContain('opacity: 0.55');
    expect(cssXatV1225).toContain('min-block-size: var(--sdp-touch)');
  });
});
