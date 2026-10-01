/* Revisió adversarial 260930 · L'espècimen del full «Ajustos» mostra el que
   fa el full de producció després de les correccions: la nota honesta de
   «Privacitat» a l'arrel (P3) i la cerca que troba la secció Llengua (P2). */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import EspecimenXatAjustos from './EspecimenXatAjustos.jsx';

afterEach(cleanup);

test('l’arrel diu on porta «Privacitat», i «llengua» troba la secció de l’Aparença', () => {
  render(<EspecimenXatAjustos />);
  const arrel = screen.getByRole('group', { name: 'Full «Ajustos» de mostra: l’arrel' });
  expect(within(arrel).getByText('«Privacitat» obri el teu perfil: hi trobaràs l’apartat «Privacitat i dades».')).toBeTruthy();
  fireEvent.change(within(arrel).getByRole('searchbox'), { target: { value: 'llengua' } });
  fireEvent.click(within(arrel).getByRole('button', { name: /^Llengua/ }));
  expect(within(arrel).getByRole('heading', { level: 2 }).textContent).toBe('Aparença');
});
