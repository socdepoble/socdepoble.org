/* Torn 260930 (T1) · La fila del grup del poble que encara no existix: té
   l'anatomia d'una comunitat, diu què és i en prémer-la demana obrir-lo. */
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import LlistaConverses from './LlistaConverses.jsx';

const t = (_, alternativa) => alternativa;
const POBLE = { id: 'la-torre-de-les-macanes', nom: 'Gent de la Torre' };

afterEach(cleanup);

test('la llista pinta la fila del poble al capdamunt i en prémer-la crida onObriPoble', () => {
  const onObriPoble = vi.fn();
  const files = [
    { clau: `poble:${POBLE.id}`, tipus: 'poble', poble: POBLE, delPoble: true },
    { clau: 'a', tipus: 'fil', fil: { id: 'a', name: 'Conversa', ultimText: 'Hola' } }
  ];
  render(<LlistaConverses files={files} onSelect={vi.fn()} onObriComunitat={vi.fn()} onObriPoble={onObriPoble} locale="ca-ES" t={t} />);
  const items = screen.getAllByRole('listitem');
  expect(items[0].getAttribute('data-clau')).toBe(`poble:${POBLE.id}`);
  const boto = screen.getByRole('button', { name: /Gent de la Torre, Grup del poble/ });
  expect(boto.textContent).toContain('Avisos, General');
  expect(boto.textContent).toContain('Fixada');
  fireEvent.click(boto);
  expect(onObriPoble).toHaveBeenCalledWith(POBLE);
});

test('sense nom declarat, la fila diu l\'id del poble', () => {
  const files = [{ clau: 'poble:sella', tipus: 'poble', poble: { id: 'sella', nom: '' } }];
  render(<LlistaConverses files={files} onSelect={vi.fn()} onObriPoble={vi.fn()} locale="ca-ES" t={t} />);
  expect(screen.getByRole('button', { name: /sella, Grup del poble/ })).toBeTruthy();
});
