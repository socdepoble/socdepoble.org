import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/* Gauntlet 261025_0545 (CUR-01) · «Veïnat connectat amb tu» és la llista de
   la persona que té la sessió (quiEmSegueix sense entitat): la clau de la
   lectura porta qui mira (`visor`, per props: Seguidors no llig cap context).
   Si canvia, la llista d'abans se'n va en el mateix pintat i es torna a
   llegir; sense `visor` (GestioMembres, que el Perfil ja torna a muntar per
   sessió), el de sempre. */
const m = vi.hoisted(() => ({ caps: new Set(['seguiments']), qui: vi.fn() }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (cap) => m.caps.has(cap),
  quiEmSegueix: (...args) => m.qui(...args)
}));
import { GentQueEtSegueix } from './Seguidors.jsx';

const DE_PEPA = [{ id: 'u-rosa', nom: 'Rosa Pérez', creatAl: '2026-10-24T09:00:00Z' }];
const DE_BIEL = [{ id: 'u-toni', nom: 'Toni Ferrer', creatAl: '2026-10-25T09:00:00Z' }];
const visorDe = (id, entrada = 1) => JSON.stringify([id, entrada]);

afterEach(cleanup);
beforeEach(() => {
  m.caps = new Set(['seguiments']);
  m.qui.mockReset();
});

describe('CUR-01 · la llista és de qui mira', () => {
  test('un visor nou buida la llista d’abans en el mateix pintat i la torna a llegir', async () => {
    m.qui.mockResolvedValueOnce(DE_PEPA);
    const vista = render(<GentQueEtSegueix config={{ dataMode: 'seed' }} visor={visorDe('pepa')} />);
    expect(await screen.findByText(/Rosa Pérez/)).toBeTruthy();
    let resol;
    m.qui.mockReturnValueOnce(new Promise((r) => { resol = r; }));
    vista.rerender(<GentQueEtSegueix config={{ dataMode: 'seed' }} visor={visorDe('biel', 2)} />);
    expect(screen.queryByText(/Rosa Pérez/)).toBeNull();
    expect(screen.getByText('Carregant el veïnat connectat amb tu…')).toBeTruthy();
    await waitFor(() => expect(m.qui).toHaveBeenCalledTimes(2));
    resol(DE_BIEL);
    expect(await screen.findByText(/Toni Ferrer/)).toBeTruthy();
    expect(screen.queryByText(/Rosa Pérez/)).toBeNull();
  });

  test('una resposta tardana del visor d’abans no es pinta', async () => {
    let resolPepa;
    m.qui.mockReturnValueOnce(new Promise((r) => { resolPepa = r; })).mockResolvedValueOnce(DE_BIEL);
    const vista = render(<GentQueEtSegueix config={{ dataMode: 'seed' }} visor={visorDe('pepa')} />);
    await waitFor(() => expect(m.qui).toHaveBeenCalledTimes(1));
    vista.rerender(<GentQueEtSegueix config={{ dataMode: 'seed' }} visor={visorDe('biel', 2)} />);
    expect(await screen.findByText(/Toni Ferrer/)).toBeTruthy();
    resolPepa(DE_PEPA);
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByText(/Rosa Pérez/)).toBeNull();
  });

  test('el mateix visor no torna a llegir res', async () => {
    m.qui.mockResolvedValue(DE_PEPA);
    const vista = render(<GentQueEtSegueix config={{ dataMode: 'seed' }} visor={visorDe('pepa')} />);
    expect(await screen.findByText(/Rosa Pérez/)).toBeTruthy();
    vista.rerender(<GentQueEtSegueix config={{ dataMode: 'seed' }} visor={visorDe('pepa')} />);
    expect(screen.getByText(/Rosa Pérez/)).toBeTruthy();
    await new Promise((r) => setTimeout(r, 20));
    expect(m.qui).toHaveBeenCalledTimes(1);
  });
});
