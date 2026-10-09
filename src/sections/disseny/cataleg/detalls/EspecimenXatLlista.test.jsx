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

/* Onada 6 · Revisió 261009 (Pedra Seca §9) · El peu «Informa d'un error»:
   fora de la <ul>, davall de l'avís d'una llista que no carrega i amb la
   reserva quan el xat no s'obri. Els components de producció. */
test('XatLlista porta el peu «Informa d’un error» en els tres estats', () => {
  render(<MemoryRouter><EspecimenXatLlista /></MemoryRouter>);
  const ambLlista = screen.getByRole('complementary', { name: 'Llista de mostra amb el peu' });
  const llista = within(ambLlista).getByRole('list', { name: 'Converses' });
  expect(within(llista).queryByRole('button', { name: "Informa d'un error" })).toBeNull();
  expect(llista.nextElementSibling.classList.contains('sdp-xat-llista__peu')).toBe(true);
  fireEvent.click(within(ambLlista).getByRole('button', { name: "Informa d'un error" }));
  expect(screen.getByText('Obriria el xat de feedback amb l’esborrany de l’informe.').getAttribute('role')).toBe('status');

  const senseCarregar = screen.getByRole('complementary', { name: 'Llista que no s’ha pogut carregar, amb el peu' });
  expect(within(senseCarregar).getByRole('alert').textContent).toContain('Encara no consta');
  expect(within(senseCarregar).getByRole('button', { name: "Informa d'un error" })).not.toBeNull();

  const reserva = screen.getByRole('complementary', { name: 'El xat no s’ha pogut obrir: la reserva' });
  const nota = within(reserva).getAllByRole('status').find((node) => node.classList.contains('sdp-xat-informe__nota'));
  expect(nota.textContent).toContain('socdepoble@socdepoble.org');
  expect(within(reserva).getByRole('link', { name: "Envia'l per correu" }).getAttribute('href')).toMatch(/^mailto:socdepoble@socdepoble\.org\?subject=/);
  fireEvent.click(within(reserva).getByRole('button', { name: "Copia l'informe" }));
  expect(screen.getByText('Copiaria l’informe al porta-retalls.')).not.toBeNull();
  expect(screen.getAllByText('BotoInformaDUnError').length).toBeGreaterThan(0);
});
