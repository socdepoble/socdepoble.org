/* Onada 3 (captura 19.12.18) · El «…» de la fila de títol de la llista: un
   menú amb una sola opció, «Seleccionar xats». Escape i clic fora el tanquen. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import MenuLlista from './MenuLlista.jsx';

const t = (_, alternativa) => alternativa;
afterEach(cleanup);

test('el «…» es diu «Més opcions», obri un menú d’una sola opció i hi porta el focus', () => {
  const onSeleccionar = vi.fn();
  render(<MenuLlista onSeleccionar={onSeleccionar} t={t} />);
  const boto = screen.getByRole('button', { name: 'Més opcions' });
  expect(boto.getAttribute('aria-haspopup')).toBe('menu');
  expect(boto.getAttribute('aria-expanded')).toBe('false');
  expect(screen.queryByRole('menu')).toBeNull();

  fireEvent.click(boto);
  expect(boto.getAttribute('aria-expanded')).toBe('true');
  const menu = screen.getByRole('menu', { name: 'Més opcions' });
  const opcions = within(menu).getAllByRole('menuitem');
  expect(opcions.map((o) => o.textContent)).toEqual(['Seleccionar xats']);
  /* La icona és la marca dins d'un cercle. */
  expect(opcions[0].querySelector('svg.lucide-circle-check')).toBeTruthy();
  expect(document.activeElement).toBe(opcions[0]);

  fireEvent.click(opcions[0]);
  expect(onSeleccionar).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('menu')).toBeNull();
});

test('Escape tanca el menú, queda consumit i torna el focus al botó; un clic fora també el tanca', () => {
  const refBoto = { current: null };
  render(
    <>
      <MenuLlista onSeleccionar={() => {}} t={t} refBoto={refBoto} />
      <p>fora</p>
    </>
  );
  const boto = screen.getByRole('button', { name: 'Més opcions' });
  /* Qui el munta hi pot tornar el focus (en eixir de la selecció de xats). */
  expect(refBoto.current).toBe(boto);
  fireEvent.click(boto);
  /* preventDefault: la selecció de xats no rep el mateix Escape. */
  expect(fireEvent.keyDown(document, { key: 'Escape' })).toBe(false);
  expect(screen.queryByRole('menu')).toBeNull();
  expect(document.activeElement).toBe(boto);

  fireEvent.click(boto);
  fireEvent.pointerDown(screen.getByText('fora'));
  expect(screen.queryByRole('menu')).toBeNull();
});
