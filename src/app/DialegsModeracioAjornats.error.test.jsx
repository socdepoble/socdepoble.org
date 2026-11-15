import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('../components/universal/DialegsModeracio.jsx', () => { throw new TypeError('Failed to fetch dynamically imported module'); });
import DialegsModeracioAjornats from './DialegsModeracioAjornats.jsx';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
test('un chunk fallit conserva el document i respecta l’amfitrió incrustat', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const tree = (manageDocumentHead) => <><p>Edició sense perdre</p><DialegsModeracioAjornats externalConfig={{ manageDocumentHead }} denuncia={{ obert: true }} /></>;
  const view = render(tree(false));
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(screen.getByText('Edició sense perdre')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Recarrega l’aplicació' })).toBeNull();
  expect(screen.getByText('Torna a obrir el mòdul des de la pàgina que l’allotja.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Intentar de nou' })).toBeNull();
  view.rerender(tree(true));
  expect(screen.getByRole('button', { name: 'Recarrega l’aplicació' })).toBeTruthy();
});

/* Onada R29 · R29-RUT-05 · La persona prem Denunciar i el tros dels diàlegs no arriba: el focus va al
   títol de l'avís (que pot quedar al final de la columna, fora de la vista), no es queda al botó. */
test('el tros fallat porta el focus a l’avís, encara que el gest l’haja deixat al botó', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const tree = (obert) => <><button type="button">Denunciar</button><DialegsModeracioAjornats externalConfig={{ manageDocumentHead: true }} denuncia={{ obert }} /></>;
  const view = render(tree(false));
  screen.getByRole('button', { name: 'Denunciar' }).focus();
  view.rerender(tree(true));
  await screen.findByRole('alert');
  expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2, name: 'Hi ha hagut un problema' }));
});

/* Onada R29 · R29-RUT-05 · La barrera escolta la connexió: tornar a estar en línia habilita «Recarrega
   l’aplicació» sense cap altre gest (abans només ho sabia en pintar-se). */
test('tornar a estar en línia habilita la recàrrega de l’avís', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const enLinia = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  render(<DialegsModeracioAjornats externalConfig={{ manageDocumentHead: true }} denuncia={{ obert: true }} />);
  await screen.findByRole('alert');
  expect(screen.getByRole('button', { name: 'Recarrega l’aplicació' }).disabled).toBe(true);
  enLinia.mockReturnValue(true);
  act(() => { window.dispatchEvent(new Event('online')); });
  expect(screen.getByRole('button', { name: 'Recarrega l’aplicació' }).disabled).toBe(false);
});
