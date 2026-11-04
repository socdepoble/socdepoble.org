import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ entrants: vi.fn(), eixints: vi.fn() }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: cap => cap === 'seguiments',
  quiEmSegueix: (...args) => m.entrants(...args),
  elsMeusSeguiments: (...args) => m.eixints(...args),
}));
import { GentQueEtSegueix } from './Seguidors.jsx';

afterEach(cleanup);
beforeEach(() => { m.entrants.mockReset(); m.eixints.mockReset(); });

test('unix les dues direccions amb fitxes clicables i distinció mútua', async () => {
  m.entrants.mockResolvedValue([{ tipus: 'persona', id: 'carmen', nom: 'Carmen' }]);
  m.eixints.mockResolvedValue([
    { tipus: 'persona', id: 'carmen', nom: 'Carmen' },
    { tipus: 'entitat', id: 'oli', nom: 'Oli de La Torre' },
  ]);
  render(<GentQueEtSegueix visor="javi" />);
  expect((await screen.findByRole('link', { name: 'Carmen' })).getAttribute('href')).toBe('/gent/carmen');
  expect(screen.getAllByText('Carmen')).toHaveLength(1);
  expect(screen.getByRole('link', { name: 'Oli de La Torre' }).getAttribute('href')).toBe('/entitats/oli');
  expect(screen.getByText('Connexió mútua')).toBeTruthy();
  expect(screen.getByText('T’hi has connectat')).toBeTruthy();
});

test('un error de sortints no es presenta com una llista completa', async () => {
  m.entrants.mockResolvedValue([{ tipus: 'persona', id: 'carmen', nom: 'Carmen' }]);
  m.eixints.mockRejectedValue(new Error('privat'));
  render(<GentQueEtSegueix visor="javi" />);
  await waitFor(() => expect(screen.queryByText(/Carregant/)).toBeNull());
  expect(screen.queryByText('Carmen')).toBeNull();
  expect(screen.getByText(/No s’ha pogut llegir/)).toBeTruthy();
});
