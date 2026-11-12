import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ sessio: null, desa: vi.fn(), autoritzat: true }));
vi.mock('../../../app/contexts/RouterContext.jsx', () => ({ Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a> }));
vi.mock('../../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => m.sessio }));
vi.mock('../../../hooks/useProjeccionsCataleg.js', () => ({ useProjeccionsCataleg: () => ({ desa: m.desa, autoritzat: m.autoritzat }) }));

import BancImportacioEditorial from './BancImportacioEditorial.jsx';
import { CLAU_STORAGE_REVISIO_WP } from '../../../utils/revisioEditorialWp.js';
import { LIMIT_BYTES_IMPORTACIO_EDITORIAL } from '../../../utils/transformadorEditorialWpBlogger.js';

beforeEach(() => {
  localStorage.clear();
  m.sessio = { currentUser: { id: 'persona-admin' }, estat: 'dins', esSuperadmin: true, nivell: 'aal2' };
  m.autoritzat = true;
  m.desa.mockReset().mockResolvedValue({});
});
afterEach(cleanup);

function seleccionaArbres() {
  fireEvent.change(screen.getByRole('textbox', { name: /Cerca per títol/ }), { target: { value: '619' } });
  fireEvent.click(screen.getByRole('row', { name: /619.*Catàleg d’Arbres/ }));
}

test('la cerca troba el mateix original, i la destinació es conserva després de reobrir', () => {
  const view = render(<BancImportacioEditorial />);
  seleccionaArbres();
  const selector = screen.getByRole('combobox', { name: 'Destinació de publicació' });
  expect([...selector.options].map(o => o.value)).toEqual(['mur', 'arbres-monumentals', 'herbari', 'receptes', 'pagina']);
  expect(selector.value).toBe('arbres-monumentals');
  fireEvent.change(selector, { target: { value: 'herbari' } });
  expect(screen.getByRole('link', { name: 'Obri la destinació' }).getAttribute('href')).toBe('/page/herbari');
  expect(JSON.parse(localStorage.getItem(CLAU_STORAGE_REVISIO_WP)).destinacions['619']).toBe('herbari');
  expect(m.desa).not.toHaveBeenCalled();
  expect(screen.getByRole('link', { name: /Revisa i publica el cos complet/ }).getAttribute('href'))
    .toBe('/notes?importacioWp=cataleg-d-arbres-emblematics-i-monumentals-de-la-torre-de-les-macanes');
  view.unmount();
  render(<BancImportacioEditorial />); seleccionaArbres();
  expect(screen.getByRole('combobox', { name: 'Destinació de publicació' }).value).toBe('herbari');
});

test.each(['mur', 'arbres-monumentals', 'herbari', 'receptes', 'pagina'])('la referència arriba a %s només després del consentiment explícit', async destinacio => {
  render(<BancImportacioEditorial />); seleccionaArbres();
  fireEvent.change(screen.getByRole('combobox', { name: 'Destinació de publicació' }), { target: { value: destinacio } });
  const publica = screen.getByRole('button', { name: 'Publica la referència' });
  expect(publica.disabled).toBe(true); expect(m.desa).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('checkbox', { name: /Accepte publicar el títol/ }));
  fireEvent.click(publica);
  await waitFor(() => expect(m.desa).toHaveBeenCalledWith(expect.objectContaining({ font: 'importacio-wp', id: '619' }), [destinacio]));
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Referència confirmada pel servidor'));
  expect(m.desa.mock.calls[0][0].content).toBeUndefined();
});

test.each([null, { currentUser: { id: 'persona' }, estat: 'comprovant' }])('una sessió sense identitat confirmada no publica', sessio => {
  m.sessio = sessio;
  render(<BancImportacioEditorial />); seleccionaArbres();
  const consentiment = screen.getByRole('checkbox', { name: /Accepte publicar el títol/ });
  expect(consentiment.disabled).toBe(true);
  expect(screen.getByRole('button', { name: 'Publica la referència' }).disabled).toBe(true);
  expect(m.desa).not.toHaveBeenCalled();
});

test('les referències hereten la mateixa autoritat del servei, amb sessió ordinària i consentiment', async () => {
  m.sessio = { currentUser: { id: 'persona' }, estat: 'dins', esSuperadmin: false, nivell: 'aal1' };
  render(<BancImportacioEditorial />); seleccionaArbres();
  fireEvent.click(screen.getByRole('checkbox', { name: /Accepte publicar el títol/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Publica la referència' }));
  await waitFor(() => expect(m.desa).toHaveBeenCalledTimes(1));
});

test('el servei denegat conserva els controls de publicació inactius', () => {
  m.autoritzat = false;
  render(<BancImportacioEditorial />); seleccionaArbres();
  expect(screen.getByRole('checkbox', { name: /Accepte publicar el títol/ }).disabled).toBe(true);
  expect(screen.getByRole('button', { name: 'Publica la referència' }).disabled).toBe(true);
  expect(m.desa).not.toHaveBeenCalled();
});

test('un desat local pendent conserva l’estat real i mai mostra un ACK remot', async () => {
  m.desa.mockRejectedValue(Object.assign(new Error('offline'), { desatLocal: true }));
  render(<BancImportacioEditorial />); seleccionaArbres();
  fireEvent.click(screen.getByRole('checkbox', { name: /Accepte publicar el títol/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Publica la referència' }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('pendent de confirmació del servidor'));
  expect(screen.getByRole('status').textContent).not.toContain('Referència confirmada');
});

test('el fitxer massa gran es rebutja abans de llegir-lo', () => {
  const file = { name: 'gran.xml', size: LIMIT_BYTES_IMPORTACIO_EDITORIAL + 1, text: vi.fn() };
  render(<BancImportacioEditorial />);
  fireEvent.change(screen.getByLabelText(/Carregar arxiu .XML/), { target: { files: [file] } });
  expect(screen.getByRole('alert').textContent).toContain('8 MiB');
  expect(file.text).not.toHaveBeenCalled();
});

test('la lectura comprova els bytes reals i mostra una fallada llegible', async () => {
  const file = { name: 'multibyte.xml', size: 1, text: vi.fn().mockResolvedValue('é'.repeat(LIMIT_BYTES_IMPORTACIO_EDITORIAL / 2 + 1)) };
  render(<BancImportacioEditorial />);
  fireEvent.change(screen.getByLabelText(/Carregar arxiu .XML/), { target: { files: [file] } });
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('8 MiB'));
  expect(screen.queryByText(/processat amb èxit/)).toBeNull();
});
