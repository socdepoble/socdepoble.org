/* IDEA-57 L3 (P1-16 + P1-22; Gauntlet 261029, cicle 1, àrea i18n-a11y) · La
   taula pública de /poblacio es desplaça en horitzontal (.sdp-taula,
   overflow-x: auto): la caixa és una regió amb nom que rep el focus (WCAG
   2.1.1, axe scrollable-region-focusable) i les capçaleres de columna van en
   la llengua de la interfície, amb scope. Les dues classes .sdp-taula es
   conserven (la doble vora és un píxel). */
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../config/i18n.js';

const mocks = vi.hoisted(() => ({ t: (_clau, reserva) => reserva }));
vi.mock('../../app/contexts/CoreContentContext', () => ({
  useCoreContent: () => ({
    sortedTowns: [
      { id: 'tibi', title: 'Tibi', comarca: 'Alcoià', population: '1.700 hab' },
      { id: 'torre', title: 'La Torre de les Maçanes', comarca: 'Alacantí', population: '700 hab' }
    ]
  })
}));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/RouterContext', () => ({ Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a> }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, children }) => <article><header className="page-title"><h1>{title}</h1></header>{children}</article>
}));
import PoblacioSection from './PoblacioSection.jsx';

beforeEach(() => { mocks.t = (_clau, reserva) => reserva; });
afterEach(() => cleanup());

describe('/poblacio: la taula', () => {
  test('una regió amb nom, que rep el focus i conté la taula; les dues classes de sempre', () => {
    render(<PoblacioSection />);
    const regio = screen.getByRole('region', { name: 'Pobles per habitants' });
    expect(regio.tabIndex).toBe(0);
    expect(regio.className).toBe('sdp-taula');
    const taula = within(regio).getByRole('table');
    expect(taula.className).toBe('sdp-taula');
    expect(within(taula).getAllByRole('columnheader').map((th) => [th.textContent, th.getAttribute('scope')])).toEqual([
      ['Poble', 'col'], ['Comarca', 'col'], ['Habitants', 'col']
    ]);
    expect(within(taula).getAllByRole('row')).toHaveLength(3);
  });

  test('en anglés: el nom de la regió i les capçaleres', () => {
    mocks.t = createTranslator('en');
    render(<PoblacioSection />);
    const regio = screen.getByRole('region', { name: 'Towns by population' });
    expect(within(regio).getAllByRole('columnheader').map((th) => th.textContent)).toEqual(['Town', 'District', 'Population']);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Population');
  });
});
