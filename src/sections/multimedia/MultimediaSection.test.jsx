/** T64 · La botonera Galeria / Cronologia de /multimedia, centrada. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  multimedia: {
    mediaItems: [
      { id: 'm1', title: 'Era', src: '/era.webp', created_at: '2026-09-01T10:00:00Z' },
      { id: 'm2', title: 'Font', src: '/font.webp', created_at: '2026-08-01T10:00:00Z' }
    ],
    mediaTimelineGroups: [{ key: '2026-09', label: 'Setembre 2026', items: [{ id: 'm1', title: 'Era', src: '/era.webp' }] }]
  }
}));

// La UniversalPage no entra en joc: es prova la capçalera de la secció.
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children }) => <main>{children}</main>
}));
/* Onada 0.3 (Gauntlet 261016) · La secció llig ?foto= (el visor): el doble del
   router porta també la consulta, la ubicació i navigate. El cens de
   public/assets (useCensImatges) no entra en estes proves de la capçalera. */
vi.mock('../../app/contexts/RouterContext', () => ({
  Link: ({ to, children, className }) => <a href={to} className={className}>{children}</a>,
  useSearchParams: () => [new URLSearchParams(''), () => {}],
  useLocation: () => ({ pathname: '/multimedia', search: '', state: null }),
  useNavigate: () => () => {}
}));
vi.mock('../../config/navigation', () => ({ getSectionItemPath: (seccio, id) => `/${seccio}/${id}` }));
vi.mock('./MultimediaContext', () => ({ useMultimedia: () => mocks.multimedia }));
vi.mock('./useCensImatges.js', () => ({ useCensImatges: () => ({ mitjans: [], cens: new Map() }) }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: [] }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }), useUIStateOpcional: () => null }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
import MultimediaSection from './MultimediaSection.jsx';

afterEach(cleanup);

test('T64 · la píndola Galeria / Cronologia porta el modificador de centrat; el rètol de damunt no canvia', () => {
  render(<MultimediaSection />);
  const grup = screen.getByRole('group', { name: 'Mode de vista' });
  // El modificador va a la mateixa caixa .sdp-pindola, fill directe de la toolbar.
  expect(grup.className).toBe('sdp-pindola sdp-pindola--centrada');
  expect(grup.parentElement.className).toBe('univ-manager-toolbar');
  // El rètol «TOTS (n) – …» continua fora de la toolbar i sense centrat.
  const capcalera = grup.closest('header');
  expect(capcalera.className).toBe('notes-list-header');
  const retol = capcalera.firstElementChild;
  expect(retol.tagName).toBe('STRONG');
  expect(retol.className).toBe('univ-manager-facet-header');
  expect(retol.textContent).toMatch(/^TOTS \(2\) - /);
  expect(capcalera.querySelectorAll('.sdp-pindola--centrada')).toHaveLength(1);
});

test('T64 · centrada, la píndola continua canviant de vista', () => {
  const { container } = render(<MultimediaSection />);
  expect(screen.getByRole('button', { name: 'Galeria' }).getAttribute('aria-pressed')).toBe('true');
  expect(container.querySelector('.stack-grid')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Cronologia' }));
  expect(screen.getByRole('button', { name: 'Cronologia' }).getAttribute('aria-pressed')).toBe('true');
  expect(container.querySelector('.stack-grid')).not.toBeNull();
});

/* El centrat el fa el modificador canònic, no cap CSS nou de Multimèdia: com a
   fill flex de .univ-manager-toolbar, margin-inline:auto reparteix l'espai
   lliure a banda i banda. Ha d'anar DESPRÉS de .sdp-pindola (mateixa capa i
   especificitat) perquè el seu display no el trepitge ningú. */
test('T64 · .sdp-pindola--centrada centra la caixa (width fit-content, margin-inline auto) i va després de .sdp-pindola', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8');
  const regla = css.match(/\.sdp-pindola--centrada\s*\{([^}]*)\}/);
  expect(regla).not.toBeNull();
  expect(regla[1]).toMatch(/margin-inline:\s*auto/);
  expect(regla[1]).toMatch(/width:\s*fit-content/);
  expect(css.indexOf('.sdp-pindola {')).toBeGreaterThan(-1);
  expect(css.indexOf('.sdp-pindola {')).toBeLessThan(regla.index);
});
