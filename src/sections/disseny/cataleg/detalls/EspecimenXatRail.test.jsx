/* Revisió adversarial 260930 (P2) · L'espècimen del rail pintava el peu
   d'abans (RailXat sense onAjustos): l'avatar i «Tu» estàtics i, plegat,
   l'avatar cap al perfil. En producció el peu és el botó «Tu: ajustos»
   (ClosCaXat.jsx), i el catàleg és el manual de referència (Pedra Seca §9):
   ha de mostrar el mateix, desplegat i plegat. El llapis «Edita el perfil»
   continua al peu desplegat.
   v1.2.23 · K5 (ordre del Mestre 261123) · Llei 0: l'afirmació de 260930 (el
   peu de l'espècimen és el de producció) es conserva, però el peu de producció
   ja no és sempre «Tu: ajustos». Des d'IDEA-327 v2 (ClosCaXat.jsx, v1.2.23),
   amb sessió ClosCaXat passa onIdentitats a RailXat i el peu és el selector
   d'identitat, «{nom}: Amb qui actues?», que obri CalaixIdentitats; el full
   «Ajustos» s'obri des de la fila «Ajustos del xat». Sense sessió (el Foraster,
   IDEA-323) el peu continua sent «Tu: ajustos». La primera prova fixa el peu
   amb sessió (el que pinta l'espècimen per defecte) i la segona, el del
   Foraster, amb les mateixes comprovacions de 260930, desplegat i plegat. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { MemoryRouter } from '../../../../app/contexts/RouterContext.jsx';
import EspecimenXatRail from './EspecimenXatRail.jsx';

afterEach(cleanup);

const rails = () => ({
  desplegat: screen.getByRole('group', { name: 'Rail desplegat de mostra' }),
  plegat: screen.getByRole('group', { name: 'Rail plegat de mostra' })
});

test('amb sessió (per defecte), el peu és el selector d’identitat de producció, i «Ajustos del xat» obri el full, desplegat i plegat', () => {
  render(<MemoryRouter><EspecimenXatRail /></MemoryRouter>);
  const sessio = screen.getByRole('group', { name: 'Sessió de la mostra' });
  expect(within(sessio).getByRole('button', { name: 'Amb sessió' }).getAttribute('aria-pressed')).toBe('true');
  const { desplegat, plegat } = rails();

  const peu = desplegat.querySelector('.sdp-xat-rail-peu');
  expect(peu.classList.contains('sdp-xat-rail-peu--ajustos')).toBe(true);
  const identitat = within(peu).getByRole('button', { name: 'Javi Llinares: Amb qui actues?' });
  expect(identitat.classList.contains('sdp-xat-ajustos-entrada')).toBe(true);
  expect(identitat.getAttribute('aria-haspopup')).toBe('dialog');
  expect(within(identitat).getByText('Javi Llinares')).toBeTruthy();
  expect(within(peu).queryByRole('button', { name: 'Tu: ajustos' })).toBeNull();
  expect(within(peu).getByRole('button', { name: 'Edita el perfil' })).toBeTruthy();
  fireEvent.click(identitat);
  expect(screen.getByRole('status').textContent).toContain('Obriria el calaix «Amb qui actues?»');
  expect(screen.getByRole('status').textContent).toContain('pregunta si queden canvis sense desar');

  const fila = within(desplegat).getByRole('button', { name: 'Ajustos del xat' });
  expect(fila.getAttribute('aria-haspopup')).toBe('dialog');
  fireEvent.click(fila);
  expect(screen.getByText('Obriria el full «Ajustos».')).toBeTruthy();

  const avatar = within(plegat).getByRole('button', { name: 'Javi Llinares: Amb qui actues?' });
  expect(avatar.getAttribute('aria-haspopup')).toBe('dialog');
  expect(within(plegat).getByRole('button', { name: 'Ajustos del xat' }).getAttribute('aria-haspopup')).toBe('dialog');
  expect(within(plegat).queryByRole('button', { name: 'Tu: ajustos' })).toBeNull();
  expect(within(plegat).queryByRole('button', { name: 'Edita el perfil' })).toBeNull();
});

test('sense sessió (el Foraster), el peu continua sent «Tu: ajustos» i obri el full, desplegat i plegat', () => {
  render(<MemoryRouter><EspecimenXatRail /></MemoryRouter>);
  fireEvent.click(within(screen.getByRole('group', { name: 'Sessió de la mostra' })).getByRole('button', { name: 'Sense sessió (el Foraster)' }));
  const { desplegat, plegat } = rails();

  const peu = desplegat.querySelector('.sdp-xat-rail-peu');
  expect(peu.classList.contains('sdp-xat-rail-peu--ajustos')).toBe(true);
  const tu = within(peu).getByRole('button', { name: 'Tu: ajustos' });
  expect(tu.classList.contains('sdp-xat-ajustos-entrada')).toBe(true);
  expect(tu.getAttribute('aria-haspopup')).toBe('dialog');
  expect(within(tu).getByText('Tu')).toBeTruthy();
  expect(within(peu).getByRole('button', { name: 'Edita el perfil' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Amb qui actues\?/ })).toBeNull();
  fireEvent.click(tu);
  expect(screen.getByText('Obriria el full «Ajustos».')).toBeTruthy();

  const avatar = within(plegat).getByRole('button', { name: 'Tu: ajustos' });
  expect(avatar.getAttribute('aria-haspopup')).toBe('dialog');
  expect(within(plegat).queryByRole('button', { name: 'Edita el perfil' })).toBeNull();
});
