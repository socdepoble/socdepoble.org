import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ cap: false, save: vi.fn(), language: 'ca' }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: () => m.cap, desaRevisioEditorialWp: (...args) => m.save(...args), llistaRevisionsEditorialsWp: async () => []
}));
vi.mock('../../app/contexts/RouterContext.jsx', () => ({ Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a> }));
vi.mock('../../app/contexts/UIContext.jsx', () => ({ useUIActionsOpcional: () => ({ language: m.language }), useUIStateOpcional: () => ({ language: m.language }) }));
import FitxaRevisioImportacioWp from './FitxaRevisioImportacioWp.jsx';
import { CLAU_STORAGE_REVISIO_WP } from '../../utils/revisioEditorialWp.js';
import { desaSessio, esborraSessio } from '../../data/identitat.js';
const note = () => screen.getByRole('textbox');
const save = () => fireEvent.click(screen.getByRole('button', { name: /Aprovar i desar nota/ }));
beforeEach(() => {
  localStorage.clear(); m.cap = false; m.language = 'ca'; m.save.mockReset();
  localStorage.setItem(CLAU_STORAGE_REVISIO_WP, JSON.stringify({ estats: { 619: 'aprovat' }, anotacions: { 619: 'anterior' }, versions: { 619: 'v0' } }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); esborraSessio(); });

test('cap ACK: Notes conserva text i base CAS; un reintent pot persistir', async () => {
  render(<FitxaRevisioImportacioWp wpId={619} />);
  fireEvent.change(note(), { target: { value: 'esborrany imprescindible' } });
  const denied = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('quota', 'QuotaExceededError'); });
  save();
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('No s’ha desat'));
  expect(note().value).toBe('esborrany imprescindible');
  denied.mockRestore(); m.cap = true; m.save.mockResolvedValue({ wpId: 619, actualitzatA: 'v1' });
  save();
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Revisió confirmada pel servidor.'));
  expect(m.save).toHaveBeenCalledWith(expect.objectContaining({ nota: 'esborrany imprescindible', actualitzatEsperat: 'v0' }), {});
  expect(note().value).toBe('esborrany imprescindible');
});

test('ACK remot amb storage denegat conserva el text visible i avança base al token confirmat', async () => {
  m.cap = true; m.save.mockResolvedValue({ wpId: 619, actualitzatA: 'v1' });
  render(<FitxaRevisioImportacioWp wpId={619} />);
  fireEvent.change(note(), { target: { value: 'text confirmat remotament' } });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  save();
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Revisió confirmada pel servidor.'));
  expect(note().value).toBe('text confirmat remotament');
  fireEvent.change(note(), { target: { value: 'segona edició' } }); save();
  await waitFor(() => expect(m.save).toHaveBeenCalledTimes(2));
  expect(m.save.mock.calls[1][0].actualitzatEsperat).toBe('v1');
});

test('conflicte amb local fallit conserva esborrany i no anuncia desat', async () => {
  m.cap = true; m.save.mockRejectedValue(Object.assign(new Error('409'), { code: 'conflicte-versio' }));
  render(<FitxaRevisioImportacioWp wpId={619} />);
  fireEvent.change(note(), { target: { value: 'nota encara no guardada' } });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  save();
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Una altra revisió'));
  expect(screen.getByRole('status').textContent).not.toContain('continua desada');
  expect(note().value).toBe('nota encara no guardada');
});

test('una resposta tardana no substituïx l’esborrany d’un altre wpId', async () => {
  let resolve; m.cap = true; m.save.mockImplementation(() => new Promise(r => { resolve = r; }));
  const view = render(<FitxaRevisioImportacioWp wpId={619} />);
  fireEvent.change(note(), { target: { value: 'text d’A' } }); save();
  await waitFor(() => expect(resolve).toBeTypeOf('function'));
  view.rerender(<FitxaRevisioImportacioWp wpId={16839} />);
  fireEvent.change(note(), { target: { value: 'text de B' } });
  await act(async () => { resolve({ wpId: 619, actualitzatA: 'v1' }); });
  expect(note().value).toBe('text de B');
  expect(screen.queryByRole('status')).toBeNull();
});

test('dues intencions síncrones només enceten un desament', async () => {
  let resolve; m.cap = true; m.save.mockImplementation(() => new Promise(r => { resolve = r; }));
  render(<FitxaRevisioImportacioWp wpId={619} />);
  await act(async () => { save(); save(); });
  await waitFor(() => expect(m.save).toHaveBeenCalledTimes(1));
  await act(async () => { resolve({ wpId: 619, actualitzatA: 'v1' }); });
});

test('eixir i tornar a entrar amb el mateix compte invalida l’ACK pendent', async () => {
  const sessio = { access_token: 'r36-local-fixture', user: { id: 'actor-r36' } };
  desaSessio(sessio);
  let resolve; m.cap = true; m.save.mockImplementation(() => new Promise(r => { resolve = r; }));
  render(<FitxaRevisioImportacioWp wpId={619} />);
  fireEvent.change(note(), { target: { value: 'esborrany de la primera entrada' } }); save();
  await waitFor(() => expect(resolve).toBeTypeOf('function'));
  esborraSessio(); desaSessio(sessio);
  await act(async () => { resolve({ wpId: 619, actualitzatA: 'v1' }); });
  expect(note().value).toBe('esborrany de la primera entrada');
  expect(screen.queryByRole('status')).toBeNull();
});

test.each([
  ['ca', 'No s’ha desat'], ['es', 'No se ha guardado'], ['en', 'The review was not saved'],
  ['eu', 'Berrikuspena ez da'], ['gl', 'Non se gardou']
])('Notes comunica fallada real en %s i conserva el text', async (language, message) => {
  m.language = language;
  render(<FitxaRevisioImportacioWp wpId={619} />);
  fireEvent.change(note(), { target: { value: 'text que cal conservar' } });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); }); save();
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain(message));
  expect(note().value).toBe('text que cal conservar');
});
