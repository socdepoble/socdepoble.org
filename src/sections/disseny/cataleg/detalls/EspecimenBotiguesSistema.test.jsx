import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { MemoryRouter } from '../../../../app/contexts/RouterContext.jsx';
import EspecimenBotiguesSistema, { MOSTRA_BOTIGUES } from './EspecimenBotiguesSistema.jsx';
import { VistaBotiguesSistema } from '../../../botigues/VistaBotiguesSistema.jsx';

afterEach(cleanup);

test('el catàleg munta el cos real, sense H1 nou ni connexions o èxits inventats', () => {
  const { container } = render(<MemoryRouter><EspecimenBotiguesSistema /></MemoryRouter>);
  expect(container.querySelectorAll('.sdp-botigues-sistema')).toHaveLength(1);
  expect(container.querySelector('h1')).toBeNull();
  expect(screen.getByText('2/12')).toBeTruthy();
  expect(screen.getByText('14')).toBeTruthy();
  expect(screen.getAllByText('Estat operatiu no verificat')).toHaveLength(2);
  expect(screen.queryByRole('button', { name: /Copia/ })).toBeNull();
  expect(screen.queryByRole('button', { name: /Refresc/ })).toBeNull();
});

test('una mostra amb enllaç i sense acció de còpia conserva l’enllaç i desactiva només copiar', () => {
  const model = { ...MOSTRA_BOTIGUES, play: { ...MOSTRA_BOTIGUES.play, optInUrl: 'https://play.google.com/apps/testing/org.socdepoble.app' } };
  render(<MemoryRouter><VistaBotiguesSistema model={model} /></MemoryRouter>);
  expect(screen.getByRole('link', { name: 'Obri les proves de Google Play' }).getAttribute('rel')).toBe('noopener noreferrer');
  expect(screen.getByRole('button', { name: 'Copia l’enllaç de proves' }).disabled).toBe(true);
  expect(screen.queryByText('Enllaç copiat.')).toBeNull();
});
