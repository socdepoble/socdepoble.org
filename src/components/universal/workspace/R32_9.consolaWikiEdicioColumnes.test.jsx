import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { getVal, setVal } from '../../../config/storage.js';
import { UniversalWorkspace } from './UniversalWorkspace.jsx';
import {
  CLAU_COLUMNES_PLEGADES,
  columnesPlegadesDe,
  desaColumnaPlegada,
  normalitzaColumnesPlegades,
} from './persistenciaColumnesUI.js';
import { dataDeDocumentWiki, destiInternDeWiki } from '../../../sections/wiki-de-poble/WikiDePobleSection.jsx';
import { BOTIGUES_SISTEMA_META } from '../../../sections/botigues/botiguesSistemaMeta.js';
import { UniversalEditorShell } from '../UniversalEditorShell.jsx';
import { ContentProvider } from '../ContentProvider.jsx';
import { NotificationProvider } from '../NotificationContext.jsx';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { _reiniciaColumnesPlegades } from './columnesPlegades.js';

vi.mock('../../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} }),
}));

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1440 });
});

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const MODEL_WIKI = {
  status: 'ready',
  workspaceKey: 'wikidepoble',
  categories: [
    { id: 'c-ser', label: '01 · Ser' },
    { id: 'c-saber', label: '02 · Saber' },
  ],
  items: [
    { id: 'doc-1', title: 'Capítol 1', categoryIds: ['c-ser'] },
    { id: 'doc-2', title: 'Capítol 2', categoryIds: ['c-saber'] },
  ],
};

describe('R32.9 · Bloc A (P0-127): persistència 100% de columnes plegades i rutes SPA de la Wiki', () => {
  test('plegar una o les dues columnes persisteix a workspace.columnesPlegades.v1 entre capítols i remuntatges fins tornar-la a obrir', () => {
    const etiquetes = { categories: 'WIKI DE POBLE', items: 'DOCUMENTS' };
    const { container, unmount, rerender } = render(
      <UniversalWorkspace
        idEspai="wiki"
        model={MODEL_WIKI}
        labels={etiquetes}
        selection={{ categoryId: 'c-ser', itemId: 'doc-1' }}
        renderDetail={({ item }) => <article>{item?.title}</article>}
      />
    );

    expect(container.querySelector('.has-left-collapsed')).toBeNull();
    expect(container.querySelector('.has-middle-collapsed')).toBeNull();

    // L'usuari plega la columna esquerra i la central per llegir còmodament
    fireEvent.click(screen.getByRole('button', { name: 'Replegar WIKI DE POBLE' }));
    fireEvent.click(screen.getByRole('button', { name: 'Replegar DOCUMENTS' }));

    expect(container.querySelector('.has-left-collapsed')).not.toBeNull();
    expect(container.querySelector('.has-middle-collapsed')).not.toBeNull();
    expect(columnesPlegadesDe('wiki')).toEqual({ left: true, middle: true });
    expect(getVal(CLAU_COLUMNES_PLEGADES, null)?.espais?.wiki).toEqual({ left: true, middle: true });

    // Canvia a un altre capítol (rerender amb nova selection)
    rerender(
      <UniversalWorkspace
        idEspai="wiki"
        model={MODEL_WIKI}
        labels={etiquetes}
        selection={{ categoryId: 'c-saber', itemId: 'doc-2' }}
        renderDetail={({ item }) => <article>{item?.title}</article>}
      />
    );
    expect(container.querySelector('.has-left-collapsed')).not.toBeNull();
    expect(container.querySelector('.has-middle-collapsed')).not.toBeNull();

    // Ix de la secció (unmount) i hi torna (mount fresc): continua plegada!
    unmount();
    const segona = render(
      <UniversalWorkspace
        idEspai="wiki"
        model={MODEL_WIKI}
        labels={etiquetes}
        selection={{ categoryId: 'c-saber', itemId: 'doc-2' }}
        renderDetail={({ item }) => <article>{item?.title}</article>}
      />
    );
    expect(segona.container.querySelector('.has-left-collapsed')).not.toBeNull();
    expect(segona.container.querySelector('.has-middle-collapsed')).not.toBeNull();

    // Quan la persona desplega manualment DOCUMENTS, es guarda false i queda oberta
    fireEvent.click(within(segona.container).getByRole('button', { name: 'Expandir DOCUMENTS' }));
    expect(segona.container.querySelector('.has-middle-collapsed')).toBeNull();
    expect(columnesPlegadesDe('wiki')).toEqual({ left: true, middle: false });
  });

  test('normalitzaColumnesPlegades admet format versionat i format pla sense contaminació de prototip', () => {
    setVal(CLAU_COLUMNES_PLEGADES, { wiki: { left: true }, __proto__: { left: true } });
    // v1.2.8 · Un sol magatzem (columnesPlegades.js, amb memòria cau): una escriptura directa a storage es llig en recarregar.
    _reiniciaColumnesPlegades();
    expect(columnesPlegadesDe('wiki')).toEqual({ left: true });
    desaColumnaPlegada('notes', 'middle', true);
    expect(normalitzaColumnesPlegades(getVal(CLAU_COLUMNES_PLEGADES, null)).espais).toEqual({
      wiki: { left: true },
      notes: { middle: true },
    });
  });

  test('destiInternDeWiki resol ?item=... i rutes internes sense interceptar externs, àncores ni recursos', () => {
    expect(destiInternDeWiki('?item=sistema_nervios_skills_i_repositoris', '/wikidepoble'))
      .toBe('/wikidepoble?item=sistema_nervios_skills_i_repositoris');
    expect(destiInternDeWiki('/consola/inventari', '/wikidepoble')).toBe('/consola/inventari');
    expect(destiInternDeWiki('/page/node-zero', '/wikidepoble')).toBe('/page/node-zero');
    expect(destiInternDeWiki('#seccio-1', '/wikidepoble')).toBeNull();
    expect(destiInternDeWiki('https://github.com/github/spec-kit', '/wikidepoble')).toBeNull();
    expect(destiInternDeWiki('/assets/ui/plugins/consola_vinyeta.jpg', '/wikidepoble')).toBeNull();
  });
});

describe('R32.9 · Bloc B (P0-126) i Bloc C (Llei 32)', () => {
  test('dataDeDocumentWiki reflectix updated com a data de barra quan és més recent que date', () => {
    const data = dataDeDocumentWiki({
      id: 'sistema_nervios_skills_i_repositoris',
      attributes: {
        date: '2026-11-17T00:14:00+01:00',
        updated: '2026-11-17T20:15:00+01:00',
      },
    });
    expect(data.dateTime).toMatch(/^2026-11-17T20:15/);
  });

  test('UniversalEditorShell en Edició avançada exposa l’Interruptor «Mostrar també al Mur» vs «Només al seu llibre o carpeta»', () => {
    const onCanvia = vi.fn();
    function Prova() {
      const [actiu, setActiu] = React.useState(false);
      return (
        <MemoryRouter>
          <NotificationProvider>
            <ContentProvider>
              <UniversalEditorShell
                id="n-r32-9"
                edicioAvancada
                titleHtml="Capítol del llibre"
                mostrarAlMur={actiu}
                onCanviaMostrarAlMur={(seguent) => {
                  onCanvia(seguent);
                  setActiu(seguent);
                }}
              >
                <p>Cos de prova</p>
              </UniversalEditorShell>
            </ContentProvider>
          </NotificationProvider>
        </MemoryRouter>
      );
    }

    const { container } = render(<Prova />);
    const details = container.querySelector('details.sdp-edicio-avancada');
    act(() => { details.open = true; });

    const interruptor = screen.getByRole('switch', { name: 'Mostrar també al Mur' });
    expect(interruptor.getAttribute('aria-checked')).toBe('false');
    expect(container.textContent).toContain('Només al seu llibre o carpeta');

    fireEvent.click(interruptor);
    expect(onCanvia).toHaveBeenCalledWith(true);
    expect(interruptor.getAttribute('aria-checked')).toBe('true');
    expect(container.textContent).toContain('Visible a l’aparador del Mur');
  });

  test('BOTIGUES_SISTEMA_META complix la Llei 32 i no duu emoji al títol', () => {
    expect(BOTIGUES_SISTEMA_META.title).toBe('Botigues, Verificadors (2/12) i Flota d’IAs');
    expect(BOTIGUES_SISTEMA_META.subtitle).toBe('Aplicacions, proves i serveis de Sóc de Poble amb procedència explícita');
  });
});
