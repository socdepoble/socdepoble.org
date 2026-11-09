import { cleanup, render, screen } from '@testing-library/react';
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
