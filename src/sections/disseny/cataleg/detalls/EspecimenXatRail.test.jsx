/* Revisió adversarial 260930 (P2) · L'espècimen del rail pintava el peu
   d'abans (RailXat sense onAjustos): l'avatar i «Tu» estàtics i, plegat,
   l'avatar cap al perfil. En producció el peu és el botó «Tu: ajustos»
   (ClosCaXat.jsx), i el catàleg és el manual de referència (Pedra Seca §9):
   ha de mostrar el mateix, desplegat i plegat. El llapis «Edita el perfil»
   continua al peu desplegat. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { MemoryRouter } from '../../../../app/contexts/RouterContext.jsx';
import EspecimenXatRail from './EspecimenXatRail.jsx';

afterEach(cleanup);

test('el peu del rail és el de producció: «Tu: ajustos» obri el full, desplegat i plegat', () => {
  render(<MemoryRouter><EspecimenXatRail /></MemoryRouter>);
  const desplegat = screen.getByRole('group', { name: 'Rail desplegat de mostra' });
  const plegat = screen.getByRole('group', { name: 'Rail plegat de mostra' });

  const peu = desplegat.querySelector('.sdp-xat-rail-peu');
  expect(peu.classList.contains('sdp-xat-rail-peu--ajustos')).toBe(true);
  const tu = within(peu).getByRole('button', { name: 'Tu: ajustos' });
  expect(tu.classList.contains('sdp-xat-ajustos-entrada')).toBe(true);
  expect(tu.getAttribute('aria-haspopup')).toBe('dialog');
  expect(within(tu).getByText('Tu')).toBeTruthy();
  expect(within(peu).getByRole('button', { name: 'Edita el perfil' })).toBeTruthy();
  fireEvent.click(tu);
  expect(screen.getByText('Obriria el full «Ajustos».')).toBeTruthy();

  const avatar = within(plegat).getByRole('button', { name: 'Tu: ajustos' });
  expect(avatar.getAttribute('aria-haspopup')).toBe('dialog');
  expect(within(plegat).queryByRole('button', { name: 'Edita el perfil' })).toBeNull();
});
