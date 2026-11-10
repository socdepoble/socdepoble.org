import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import SelectorDestinsPublicacio from './SelectorDestinsPublicacio.jsx';

afterEach(cleanup);
test('una tria nova guardant espera el seu ACK i no reutilitza la confirmació anterior', async () => {
  let confirma;
  const pendent = new Promise(resolve => { confirma = resolve; });
  const desa = vi.fn(() => pendent);
  const font = { font: 'herbari', id: 'romer', title: 'Romer' };
  render(<SelectorDestinsPublicacio font={font} inicials={['bar']} desa={desa} autoritzat estat="confirmat" />);
  expect(screen.getByRole('status').textContent).toBe('Destins confirmats pel servidor.');
  fireEvent.click(screen.getByRole('checkbox', { name: 'Rebost privat' }));
  expect(screen.getByRole('status').textContent).toMatch(/encara no s’ha desat/);
  fireEvent.click(screen.getByRole('button', { name: 'Desa els destins' }));
  try {
    expect(desa).toHaveBeenCalledWith(font, ['bar', 'rebost']);
    expect(screen.getByRole('button', { name: 'Guardant…' }).disabled).toBe(true);
    expect(screen.getByRole('status').textContent).toBe('Guardant…');
  } finally {
    await act(async () => { confirma(); await pendent; });
  }
  expect(screen.getByRole('status').textContent).toBe('Destins confirmats pel servidor.');
});
