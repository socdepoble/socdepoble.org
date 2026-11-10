import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import PanellSessionsDetall from './PanellSessionsDetall.jsx';
const files = [
  { clau: 'a'.repeat(32), nom: 'Veïna', correuMascarat: 'v***@example.test', cami: 'app_ios', sessions: 2, activitat: '2026-11-09T14:00:00Z' },
  { clau: 'b'.repeat(32), nom: 'Veí', correuMascarat: 'w***@example.test', cami: 'app_android', sessions: 1, activitat: '2026-11-09T14:00:00Z' }
];
afterEach(cleanup);
test('filtres per usuari i dispositiu arriben al servidor; buit confirmat és explícit', async () => {
  const consulta = vi.fn().mockResolvedValue({ files: [], total: 0, consultatA: '2026-11-09T14:00:00Z' });
  render(<PanellSessionsDetall consulta={consulta} />);
  expect(consulta).not.toHaveBeenCalled();
  fireEvent.change(screen.getByRole('textbox', { name: 'Filtra per nom o àlies' }), { target: { value: 'Veïna' } });
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'app_ios' } });
  fireEvent.click(screen.getByRole('button', { name: 'Consulta el directori' }));
  expect(await screen.findByText('No hi ha sessions que coincidisquen amb estos filtres.')).toBeTruthy();
  expect(consulta).toHaveBeenCalledWith({ cerca: 'Veïna', cami: 'app_ios' }, expect.objectContaining({ signal: expect.any(AbortSignal) }));
});
test('a iOS la taula i els filtres respecten exclusió de plataforma aliena', async () => {
  render(<PanellSessionsDetall consulta={vi.fn().mockResolvedValue({ files, total: 2, consultatA: '2026-11-09T14:00:00Z' })} nativaIos />);
  fireEvent.click(screen.getByRole('button', { name: 'Consulta el directori' }));
  expect(await screen.findByRole('cell', { name: /v\*\*\*@example\.test/ })).toBeTruthy();
  expect(screen.queryByRole('cell', { name: /w\*\*\*@example\.test/ })).toBeNull();
  expect(document.body.textContent).not.toMatch(/Android|Google Play/);
});
test('SEG-R15b-01: la taula mostra el correu emmascarat i el nombre de sessions, mai identificadors', async () => {
  render(<PanellSessionsDetall consulta={vi.fn().mockResolvedValue({ files, total: 2, consultatA: '2026-11-09T14:00:00Z' })} />);
  fireEvent.click(screen.getByRole('button', { name: 'Consulta el directori' }));
  expect(await screen.findByRole('cell', { name: /Veïna.*v\*\*\*@example\.test/ })).toBeTruthy();
  expect(screen.getByRole('cell', { name: /2 sessions/ })).toBeTruthy();
  expect(screen.getByRole('cell', { name: /1 sessió/ })).toBeTruthy();
  expect(screen.getByText(/2 de 2 combinacions de persona i dispositiu coincidents/)).toBeTruthy();
  const text = document.body.textContent;
  expect(text).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-|Sessió [0-9a-f]|veina@example|a{32}|b{32}/);
});
test('la consulta tardana s’avorta quan es desmunta; cap actualització posterior', async () => {
  let resol; const consulta = vi.fn(() => new Promise(r => { resol = r; }));
  const v = render(<PanellSessionsDetall consulta={consulta} />);
  fireEvent.click(screen.getByRole('button', { name: 'Consulta el directori' }));
  await waitFor(() => expect(resol).toBeTypeOf('function')); v.unmount();
  expect(consulta.mock.calls[0][1].signal.aborted).toBe(true);
  resol({ files, total: 2, consultatA: '2026-11-09T14:00:00Z' });
  expect(screen.queryByRole('table')).toBeNull();
});
test('migració absent no es disfressa de directori buit', async () => {
  render(<PanellSessionsDetall consulta={vi.fn().mockRejectedValue(Object.assign(new Error('absent'), { status: 404 }))} />);
  fireEvent.click(screen.getByRole('button', { name: 'Consulta el directori' }));
  expect(await screen.findByText(/migració 2611091500/)).toBeTruthy();
  expect(screen.queryByRole('table')).toBeNull();
});
