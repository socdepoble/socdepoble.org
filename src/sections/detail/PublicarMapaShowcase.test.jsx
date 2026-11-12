import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from '../../app/contexts/RouterContext.jsx';

vi.mock('../mur/MapaFotografic.jsx', () => ({
  default: ({ items }) => (
    <div data-testid="mapa-fotografic-mock" data-items={items?.length ?? 0}>
      Mapa fotogràfic amb {items?.length ?? 0} arbres
    </div>
  )
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: vi.fn() })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/CoreContentContext', () => ({
  useCoreContent: () => ({ status: 'ready', pages: [], pageCopy: {} })
}));
vi.mock('../../app/contexts/UIContext', async (orig) => ({
  ...(await orig()),
  useUIActions: () => ({
    language: 'ca',
    t: (_clau, reserva, vars) => {
      if (!vars) return reserva;
      return Object.entries(vars).reduce(
        (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
        reserva
      );
    }
  }),
  useUIActionsOpcional: () => ({
    language: 'ca',
    t: (_clau, reserva, vars) => {
      if (!vars) return reserva;
      return Object.entries(vars).reduce(
        (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
        reserva
      );
    }
  })
}));

import PageDetailSection from './PageDetailSection.jsx';

function RutaActual() {
  const loc = useLocation();
  const q = loc.search ? (loc.search.startsWith('?') ? loc.search : `?${loc.search}`) : '';
  return <output data-testid="ruta-actual">{`${loc.pathname}${q}`}</output>;
}

describe('P0-110 · /page/publicar_mapa amb MapaFotografic lazyRoute, UniversalCard d’exemple i 2 botons Publicar', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('pinta MapaFotografic entre el bloc blanc de l’H1 i l’H2 taronja, conserva els 2 botons Publicar i obri /mapa', async () => {
    const { container } = render(
      <MemoryRouter rutaInicial="/page/publicar_mapa">
        <Routes>
          <Route path="/page/:slug" element={<PageDetailSection />} />
          <Route path="/mapa" element={<p>Mapa Viu</p>} />
        </Routes>
        <RutaActual />
      </MemoryRouter>
    );

    const h1 = await screen.findByRole('heading', { level: 1, name: /Publicar al Mapa/i });
    const h2 = screen.getByRole('heading', { level: 2, name: /geolocalitzar/i });
    const visorAbans = await screen.findByRole(
      'region',
      { name: /Mapa fotogràfic interactiu d’exemple amb el patrimoni arbori del poble/i },
      { timeout: 8000 }
    );

    expect(h1.compareDocumentPosition(visorAbans) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(visorAbans.compareDocumentPosition(h2) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByTestId('mapa-fotografic-mock').getAttribute('data-items')).toBe('19');

    // Es conserven intactes els 2 botons blaus grandots de Publicar (capçalera i peu)
    const botonsPublicar = container.querySelectorAll('.page-title-accio .sdp-boto--primari, .sdp-pagina-accio .sdp-boto--primari');
    expect(botonsPublicar.length).toBe(2);

    // La UniversalCard d'exemple porta l'autoria Associació El Rentonar (mai Sóc de Poble com autora del catàleg) i SquareBadge geo
    const exemple = await screen.findByRole('region', { name: /Exemple real de fitxa publicada al Mapa del poble/i });
    expect(exemple.textContent).toContain('Associació El Rentonar');
    // D3 del Mestre (acta 261112_1400) · La grafia de la font primària WP 619, la mateixa al subtítol i als drets.
    expect(exemple.textContent).toContain('Pedro Ferrer Rodriguez');
    expect(exemple.textContent).not.toContain('Rodríguez');

    const botoGeo = screen.getByRole('button', { name: /Vore al mapa:.*Llorer de Villa María/i });
    fireEvent.click(botoGeo);
    expect(screen.getByTestId('ruta-actual').textContent).toBe(
      '/mapa?lat=38.608122&lng=-0.421325&zoom=18&id=arbre-10-llorer-de-villa-maria'
    );
  });
});
