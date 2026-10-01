/* Revisió adversarial 260930 (P3, Pedra Seca §9: «Res existeix fins que no
   està al manual») · La fila del grup del poble (FilaPoble) té el seu
   exemplar al catàleg: el component de producció, no una còpia. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { MemoryRouter } from '../../../../app/contexts/RouterContext.jsx';
import EspecimenXatLlista from './EspecimenXatLlista.jsx';

afterEach(cleanup);

test('XatLlista porta la fila del grup del poble de l’amfitrió, amb l’anatomia de FilaComunitat', () => {
  render(<MemoryRouter><EspecimenXatLlista /></MemoryRouter>);
  const llista = screen.getByRole('list', { name: 'Grup del poble de mostra' });
  const [li] = within(llista).getAllByRole('listitem');
  expect(li.getAttribute('data-clau')).toBe('poble:la-torre-de-les-macanes');
  const fila = within(llista).getByRole('button', { name: /Gent de la Torre, Grup del poble/ });
  expect(fila.classList.contains('sdp-xat-fila--comunitat')).toBe(true);
  expect(fila.querySelector('.sdp-xat-apilat .sdp-xat-avatar--quadrat')).not.toBeNull();
  expect(fila.querySelector('.sdp-xat-fila__xebro')).not.toBeNull();
  expect(fila.textContent).toContain('Avisos, General');
  expect(fila.querySelector('svg.lucide-pin')).not.toBeNull();
  expect(fila.textContent).toContain('Fixada');
  fireEvent.click(fila);
  expect(screen.getByText('Obriria o crearia el grup de Gent de la Torre.').getAttribute('role')).toBe('status');
  /* El contracte de l'espècimen la documenta. */
  expect(screen.getAllByText('FilaPoble').length).toBeGreaterThan(0);
});
