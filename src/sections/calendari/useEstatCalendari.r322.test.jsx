import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext';
import { useEstatCalendari } from './useEstatCalendari.js';
afterEach(cleanup);
const avui = new Date(2026, 9, 1, 12);
function Sonda() {
  const { estat, navega, triaDia } = useEstatCalendari({ avui });
  const location = useLocation();
  return <><output data-testid="estat">{estat.diaTriat || 'cap'}</output><output data-testid="url">{location.search}</output><button onClick={() => navega('seguent')}>Següent</button><button onClick={() => triaDia('2027-03-05')}>Tria dia</button></>;
}
test.each(['setmana', 'dues-setmanes', 'mes', 'any', 'agenda'])('R32.2 · àlies en %s no segresta navegació ni selecció posterior', (vista) => {
  render(<MemoryRouter rutaInicial={`/calendari?vista=${vista}&data=2026-11-16&filtre=prova`}><Sonda /></MemoryRouter>);
  expect(screen.getByTestId('estat').textContent).toBe('2026-11-16');
  fireEvent.click(screen.getByRole('button', { name: 'Següent' }));
  expect(screen.getByTestId('estat').textContent).toBe('cap');
  let url = new URLSearchParams(screen.getByTestId('url').textContent);
  expect(url.has('data')).toBe(false);
  expect(url.get('filtre')).toBe('prova');
  fireEvent.click(screen.getByRole('button', { name: 'Tria dia' }));
  expect(screen.getByTestId('estat').textContent).toBe('2027-03-05');
  url = new URLSearchParams(screen.getByTestId('url').textContent);
  expect(url.get('date')).toBe('2027-03-05');
  expect(url.has('data')).toBe(false);
});
