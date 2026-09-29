/* T68 · La barra de selecció de xats: la creu per a eixir, el recompte i
   l'única acció amb RPC darrere, «Marcar com a llegides». */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import BarraSeleccio, { textDeRecompte } from './BarraSeleccio.jsx';

const t = (_, alternativa) => alternativa;
afterEach(cleanup);

test('el recompte diu quants xats hi ha triats, en singular i en plural', () => {
  expect(textDeRecompte(0, t)).toBe('Tria els xats');
  expect(textDeRecompte(1, t)).toBe('1 seleccionada');
  expect(textDeRecompte(4, t)).toBe('4 seleccionades');
});

test('sense cap xat triat l’acció està desactivada; la creu ix i l’acció marca', () => {
  const onEixir = vi.fn();
  const onMarcaLlegides = vi.fn();
  const { rerender } = render(<BarraSeleccio quants={0} onEixir={onEixir} onMarcaLlegides={onMarcaLlegides} t={t} />);
  const marca = screen.getByRole('button', { name: 'Marcar com a llegides' });
  expect(marca.disabled).toBe(true);
  const recompte = screen.getByText('Tria els xats');
  expect(recompte.getAttribute('aria-live')).toBe('polite');
  /* És la fila 1 de la graella, com la del títol que substituïx. */
  expect(recompte.closest('.app-grid-col-header')).toBeTruthy();

  rerender(<BarraSeleccio quants={2} onEixir={onEixir} onMarcaLlegides={onMarcaLlegides} t={t} />);
  expect(screen.getByText('2 seleccionades')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Marcar com a llegides' }));
  expect(onMarcaLlegides).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Eixir de la selecció de xats' }));
  expect(onEixir).toHaveBeenCalledTimes(1);
});
