import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../../app/contexts/RouterContext.jsx';
import { SquareBadge } from './SquareBadge.jsx';
import { UniversalCard } from './UniversalCard.jsx';

const ui = vi.hoisted(() => ({ language: 'ca' }));
vi.mock('../../../app/contexts/UIContext', async (orig) => {
  const real = await orig();
  return {
    ...real,
    useUIActions: () => ({
      language: ui.language,
      t: (_clau, reserva, vars) => {
        if (!vars) return reserva;
        return Object.entries(vars).reduce(
          (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
          reserva
        );
      }
    }),
    useUIActionsOpcional: () => ({
      language: ui.language,
      t: (_clau, reserva, vars) => {
        if (!vars) return reserva;
        return Object.entries(vars).reduce(
          (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
          reserva
        );
      }
    })
  };
});

afterEach(() => {
  cleanup();
  ui.language = 'ca';
});

function RutaActual() {
  const loc = useLocation();
  const q = loc.search ? (loc.search.startsWith('?') ? loc.search : `?${loc.search}`) : '';
  return <output data-testid="ruta-actual">{`${loc.pathname}${q}`}</output>;
}

describe('P0-107 · SquareBadge Opció 1 (type="geo", 3 pisos, stopPropagation i ruta al Mapa)', () => {
  it('formateja les coordenades curtes i obri /mapa?lat=...&lng=...&zoom=18&id=...', () => {
    render(
      <MemoryRouter rutaInicial="/page/arbres-monumentals">
        <SquareBadge
          badge={{
            type: 'geo',
            lat: 38.608122,
            lng: -0.421325,
            zoom: 18,
            id: 'arbre-10-llorer-de-villa-maria',
            nom: 'Llorer de Villa María'
          }}
        />
        <RutaActual />
      </MemoryRouter>
    );

    const boto = screen.getByRole('button', { name: /Vore al mapa:.*Llorer de Villa María/i });
    expect(boto.getAttribute('data-tipus')).toBe('geo');
    expect(boto.textContent).toContain('AL MAPA');
    expect(boto.textContent).toContain('38.61°N · 0.42°O');

    fireEvent.click(boto);
    expect(screen.getByTestId('ruta-actual').textContent).toBe(
      '/mapa?lat=38.608122&lng=-0.421325&zoom=18&id=arbre-10-llorer-de-villa-maria'
    );
  });

  it('dins d’UniversalCard fa stopPropagation() perquè no s’execute onMainClick del cos', () => {
    const onMainClick = vi.fn();
    render(
      <MemoryRouter rutaInicial="/page/publicar_mapa">
        <UniversalCard
          title="Llorer de Villa María"
          subtitle="Laurus nobilis"
          onMainClick={onMainClick}
          squareBadge={{
            type: 'geo',
            lat: 38.608122,
            lng: -0.421325,
            zoom: 18,
            id: 'arbre-10-llorer-de-villa-maria',
            nom: 'Llorer de Villa María'
          }}
        />
        <RutaActual />
      </MemoryRouter>
    );

    const botoGeo = screen.getByRole('button', { name: /Vore al mapa:.*Llorer de Villa María/i });
    fireEvent.click(botoGeo);
    expect(onMainClick).not.toHaveBeenCalled();
    expect(screen.getByTestId('ruta-actual').textContent).toContain('/mapa?lat=38.608122');
  });
});
