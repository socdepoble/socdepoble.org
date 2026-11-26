/**
 * ConsolaIdea362CmsPur.test.jsx — G26-3 · IDEA-362 (v1.2.26).
 *
 * Verifica:
 *  1. `.sdp-consola__index` a `src/css/modules.css` manté una columna única
 *     editorial fluida de part a part (sense `@media (min-width: 900px)` a 2 columnes).
 *  2. Separació CMS Pur 100 Anys: `ConsolaSection` i `IndexConsola` consumixen el
 *     copy editable de `CoreContentContext.pageCopy.consola` amb caiguda segura
 *     sobre `copyConsola()`.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { CoreContentContext } from '../../app/contexts/objectesDeContext.js';
import {
  resolCopyConsolaEditorial,
  resolIndexEditorialConsola,
  resolPaginaConsolaEditorial,
  resolPaginesConsolaEditorial
} from './copyConsolaEditorial.js';

vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ locale: 'ca-ES', language: 'ca' }),
  useUIActions: () => ({ t: (_clau, perDefecte) => perDefecte })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../components/universal/graph/BrainGraph', () => ({ default: () => null }));
vi.mock('./mapa/useMapa.js', () => ({
  useMapa: () => ({ estat: 'absent', mapa: null, error: null, carrega: () => {} })
}));
vi.mock('./consolaContent.js', async (importOriginal) => ({
  ...(await importOriginal()),
  carregaConsola: () => Promise.resolve(null)
}));

import { Route, RouterProvider, Routes } from '../../app/contexts/RouterContext';
import ConsolaSection from './ConsolaSection.jsx';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('IDEA-362 · /consola columna única editorial fluida + CMS Pur', () => {
  test('modules.css no partix .sdp-consola__index en 2 columnes paral·leles', () => {
    const css = readFileSync(path.join(process.cwd(), 'src/css/modules.css'), 'utf8');
    const inici = css.indexOf('.sdp-consola__index {');
    expect(inici).toBeGreaterThan(-1);
    const fragment = css.slice(inici, inici + 1400);
    expect(fragment).toContain('grid-template-columns: minmax(0, 1fr);');
    expect(fragment).not.toMatch(/grid-template-columns:\s*repeat\(2,/);
  });

  test('resolCopyConsolaEditorial fusiona el CMS damunt la llavor sense trencar la reserva', () => {
    const base = resolCopyConsolaEditorial(null);
    expect(base.title).toBeTruthy();
    const editat = resolCopyConsolaEditorial({
      consola: {
        title: 'Consola editada al CMS',
        subtitle: 'Subtítol viu del poble',
        lead: 'Entradeta editable sense tocar el motor JSX.',
        indexTitle: 'Índex editorial en columna única',
        indexLead: 'Guia viva separada del codi.',
        pagines: [{ id: 'pols', title: 'Pols viu', subtitle: 'Estat editable', lead: 'Descripció viva del pols.' }]
      }
    });
    expect(editat.title).toBe('Consola editada al CMS');
    expect(editat.subtitle).toBe('Subtítol viu del poble');
    expect(resolPaginaConsolaEditorial('pols', { consola: editat }).title).toBe('Pols viu');
    expect(resolPaginesConsolaEditorial({ consola: editat }).find((p) => p.id === 'pols').subtitle).toBe('Estat editable');
    const editorialIdx = resolIndexEditorialConsola({
      consola: { indexTitle: 'Índex editorial en columna única', indexLead: 'Guia viva separada del codi.' }
    });
    expect(editorialIdx).toEqual({
      titol: 'Índex editorial en columna única',
      entradeta: 'Guia viva separada del codi.',
      pagines: null
    });
  });

  test('ConsolaSection pinta el títol i l’índex editats des de CoreContentContext.pageCopy', async () => {
    window.history.replaceState(null, '', '/consola');
    const valorCore = {
      status: 'ready',
      towns: [],
      pages: [],
      agents: [],
      sortedTowns: [],
      featuredTowns: [],
      personalitzacio: null,
      pageCopy: {
        consola: {
          title: 'Consola CMS Pur',
          subtitle: 'Subtítol editorial editable',
          lead: 'Entradeta editable des del CMS.',
          indexTitle: 'Guia editorial fluida de la Consola',
          indexLead: 'Text editable de l’índex en columna única.'
        }
      }
    };
    render(
      <CoreContentContext.Provider value={valorCore}>
        <RouterProvider>
          <Routes>
            <Route path="/consola/*" element={<ConsolaSection />} />
          </Routes>
        </RouterProvider>
      </CoreContentContext.Provider>
    );
    await act(async () => {});
    await waitFor(() => expect(document.querySelector('h1')?.textContent).toBe('Consola CMS Pur'));
    expect(screen.getByRole('heading', { level: 3, name: 'Guia editorial fluida de la Consola' })).toBeTruthy();
    expect(screen.getByText('Text editable de l’índex en columna única.')).toBeTruthy();
  });
});
