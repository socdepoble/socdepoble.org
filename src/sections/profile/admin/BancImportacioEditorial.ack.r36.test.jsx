import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ cap: false, save: vi.fn() }));
vi.mock('../../../data/backendPort.js', () => ({
  teCapacitat: () => m.cap, desaRevisioEditorialWp: (...args) => m.save(...args), llistaRevisionsEditorialsWp: async () => []
}));
vi.mock('../../../app/contexts/RouterContext.jsx', () => ({ Link: ({ to, children, ...p }) => <a href={to} {...p}>{children}</a>, useNavigate: () => vi.fn() }));
vi.mock('../../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => null }));
vi.mock('../../../hooks/useProjeccionsCataleg.js', () => ({ useProjeccionsCataleg: () => ({ autoritzat: false }) }));
import BancImportacioEditorial from './BancImportacioEditorial.jsx';
import { CLAU_STORAGE_REVISIO_WP, llegeixEstatRevisioEditorial } from '../../../utils/revisioEditorialWp.js';
import { lligArticlesImportatsAmbRevisio } from '../../../utils/transformadorEditorialWpBlogger.js';
beforeEach(() => {
  localStorage.clear(); m.cap = false; m.save.mockReset();
  localStorage.setItem(CLAU_STORAGE_REVISIO_WP, JSON.stringify({ estats: { 619: 'aprovat' }, anotacions: { 619: 'anterior durable' }, versions: { 619: 'v0' } }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
async function open619() {
  render(<BancImportacioEditorial />);
  await act(async () => { await new Promise(r => setTimeout(r, 0)); });
  fireEvent.change(screen.getByRole('textbox', { name: /Cerca per títol/ }), { target: { value: '619' } });
  fireEvent.click(screen.getByRole('button', { name: /^Catàleg d’Arbres/ }));
  const textarea = screen.getByLabelText(/Anotacions del Mestre/);
  fireEvent.change(textarea, { target: { value: 'nota de treball' } });
  return textarea;
}
const save = () => fireEvent.click(screen.getByRole('button', { name: /Aprovar i desar nota/ }));

test('Banc: cap ACK no anuncia desat i conserva text/base per a reintentar', async () => {
  const textarea = await open619();
  const denied = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  save();
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('No s’ha desat'));
  expect(textarea.value).toBe('nota de treball');
  expect(llegeixEstatRevisioEditorial().anotacions['619']).toBe('anterior durable');
  denied.mockRestore(); m.cap = true; m.save.mockResolvedValue({ wpId: 619, actualitzatA: 'v1' });
  save();
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Revisió confirmada pel servidor.'));
  expect(m.save.mock.calls[0][0]).toMatchObject({ nota: 'nota de treball', actualitzatEsperat: 'v0' });
});

test('Banc: conflicte i local fallit no prometen còpia local', async () => {
  const textarea = await open619();
  m.cap = true; m.save.mockRejectedValue(Object.assign(new Error('409'), { code: 'conflicte-versio' }));
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  save();
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Conflicte'));
  expect(screen.getByRole('status').textContent).toContain('però no s’ha desat');
  expect(screen.getByRole('status').textContent).not.toContain('continua desada');
  expect(textarea.value).toBe('nota de treball');
});

test('Banc: ACK remot amb còpia local fallida és èxit remot i conserva el token', async () => {
  const textarea = await open619();
  m.cap = true; m.save.mockResolvedValue({ wpId: 619, actualitzatA: 'v1' });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  save();
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Revisió confirmada pel servidor.'));
  expect(screen.getByRole('status').textContent).toContain('no n’ha pogut guardar la còpia');
  expect(textarea.value).toBe('nota de treball');
  save();
  await waitFor(() => expect(m.save).toHaveBeenCalledTimes(2));
  expect(m.save.mock.calls[1][0].actualitzatEsperat).toBe('v1');
});

test('Banc: A→B→A amb nou text no rep l’avís antic, però conserva el token conegut per reintentar', async () => {
  let resolve;
  const textarea = await open619();
  m.cap = true; m.save.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
  save();
  await waitFor(() => expect(resolve).toBeTypeOf('function'));
  for (const id of [16839, 619]) {
    const article = lligArticlesImportatsAmbRevisio().find(a => a.wp_id === id);
    fireEvent.change(screen.getByRole('textbox', { name: /Cerca per títol/ }), { target: { value: String(id) } });
    const name = new RegExp('^'+article.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    fireEvent.click(screen.getByRole('button', { name }));
  }
  fireEvent.change(textarea, { target: { value: 'nou esborrany A' } });
  await act(async () => { resolve({ wpId: 619, actualitzatA: 'v1' }); });
  expect(textarea.value).toBe('nou esborrany A');
  expect(screen.queryByRole('status')).toBeNull();
  m.save.mockResolvedValue({ wpId: 619, actualitzatA: 'v2' }); save();
  await waitFor(() => expect(m.save).toHaveBeenCalledTimes(2));
  expect(m.save.mock.calls[1][0]).toMatchObject({ nota: 'nou esborrany A', actualitzatEsperat: 'v1' });
});

test('Banc: escriure després d’un ACK o durant una espera invalida la confirmació del text anterior', async () => {
  const textarea = await open619(); m.cap = true; m.save.mockResolvedValueOnce({ wpId: 619, actualitzatA: 'v1' });
  save(); await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Revisió confirmada pel servidor.'));
  fireEvent.change(textarea, { target: { value: 'text següent' } });
  expect(screen.queryByRole('status')).toBeNull();
  let resolve; m.save.mockImplementationOnce(() => new Promise(r => { resolve = r; })); save();
  await waitFor(() => expect(resolve).toBeTypeOf('function'));
  fireEvent.change(textarea, { target: { value: 'text encara més nou' } });
  await act(async () => { resolve({ wpId: 619, actualitzatA: 'v2' }); });
  expect(textarea.value).toBe('text encara més nou'); expect(screen.queryByRole('status')).toBeNull();
});
