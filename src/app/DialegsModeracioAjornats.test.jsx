import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

const control = vi.hoisted(() => ({ loads: 0, finish: null }));
vi.mock('../components/universal/DialegsModeracio.jsx', async () => {
  control.loads++;
  await new Promise((resolve) => { control.finish = resolve; });
  return { default: ({ denuncia }) => <div data-testid="dialog" hidden={!denuncia.obert}>Denúncia</div> };
});
import DialegsModeracioAjornats from './DialegsModeracioAjornats.jsx';

afterEach(cleanup);
test('no descarrega res fins a obrir; suspén només els diàlegs i conserva la instància en tancar', async () => {
  const tree = (obert) => <><p>El document continua disponible</p><DialegsModeracioAjornats denuncia={{ obert }} /></>;
  const view = render(tree(false));
  expect(control.loads).toBe(0);
  view.rerender(tree(true));
  await waitFor(() => expect(control.loads).toBe(1));
  expect(screen.getByText('El document continua disponible')).toBeTruthy();
  expect(screen.queryByTestId('dialog')).toBeNull();
  await act(async () => { control.finish(); });
  const dialog = await screen.findByTestId('dialog');
  expect(dialog.hidden).toBe(false);
  view.rerender(tree(false));
  expect(screen.getByTestId('dialog')).toBe(dialog);
  expect(dialog.hidden).toBe(true);
  view.rerender(tree(true));
  expect(screen.getByTestId('dialog')).toBe(dialog);
  expect(control.loads).toBe(1);
});
