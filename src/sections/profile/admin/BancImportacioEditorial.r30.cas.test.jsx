import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ save: vi.fn(), read: vi.fn() }));
vi.mock('../../../utils/revisioEditorialWp.js', async importOriginal => ({ ...await importOriginal(), consultaRevisioEditorialWp: (...a) => m.read(...a), desaRevisioArticleImportatAmbServidor: (...a) => m.save(...a), sincronitzaRevisionsEditorialsWpAmbServidor: async () => ({ sincronitzat: false }) }));
vi.mock('../../../app/contexts/RouterContext.jsx', () => ({ Link: ({ to, children, ...p }) => <a href={to} {...p}>{children}</a>, useNavigate: () => vi.fn() }));
vi.mock('../../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => null }));
vi.mock('../../../hooks/useProjeccionsCataleg.js', () => ({ useProjeccionsCataleg: () => ({ autoritzat: false }) }));
import BancImportacioEditorial from './BancImportacioEditorial.jsx';
beforeEach(() => { localStorage.clear(); m.save.mockReset().mockResolvedValueOnce({ remot: false, conflicte: true }).mockResolvedValue({ remot: true }); m.read.mockReset().mockResolvedValue({ nota: 'Nota d’una altra editora', actualitzatA: '2026-11-15T22:00:00.000002Z' }); });
afterEach(cleanup);
test('l’editor conserva la nota, mostra versió remota i només reintenta després de revisió explícita', async () => {
 render(<BancImportacioEditorial />);
 const nota = screen.getByLabelText(/Anotacions del Mestre/);
 fireEvent.change(nota, { target: { value: 'La nota redactada' } });
 fireEvent.click(screen.getByRole('button', { name: /Aprovar i desar nota/ }));
 await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Conflicte'));
 expect(nota.value).toBe('La nota redactada');
 expect(m.save).toHaveBeenCalledTimes(1);
 fireEvent.click(screen.getByRole('button', { name: 'Revisa la versió del servidor' }));
 await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Nota d’una altra editora'));
 expect(m.save).toHaveBeenCalledTimes(1);
 fireEvent.click(screen.getByRole('button', { name: 'Reintenta amb la nota conservada' }));
 await waitFor(() => expect(m.save).toHaveBeenCalledTimes(2));
 expect(m.save.mock.calls[1][1].nota).toBe('La nota redactada');
 expect(m.save.mock.calls[1][2].actualitzatEsperat).toBe('2026-11-15T22:00:00.000002Z');
 expect(nota.value).toBe('La nota redactada');
});

test('canviar d’article durant el desat no projecta el conflicte vell sobre el nou', async () => {
 let resolve; m.save.mockReset().mockImplementation(() => new Promise(r => { resolve = r; }));
 render(<BancImportacioEditorial />);
 fireEvent.change(screen.getByLabelText(/Anotacions del Mestre/), { target: { value: 'Nota d’A' } });
 fireEvent.click(screen.getByRole('button', { name: /Aprovar i desar nota/ }));
 fireEvent.change(screen.getByRole('textbox', { name: /Cerca per títol/ }), { target: { value: '619' } });
 fireEvent.click(screen.getByRole('button', { name: /^Catàleg d’Arbres/ }));
 resolve({ remot: false, conflicte: true });
 await waitFor(() => expect(screen.getByRole('button', { name: /Aprovar i desar nota/ }).disabled).toBe(false));
 expect(screen.queryByRole('alert')).toBeNull();
 expect(screen.getByLabelText(/Anotacions del Mestre/).value).not.toBe('Nota d’A');
});

test('desmuntar durant el desat invalida l’efecte tardà', async () => {
 let resolve; m.save.mockReset().mockImplementation(() => new Promise(r => { resolve = r; }));
 const view = render(<BancImportacioEditorial />);
 fireEvent.click(screen.getByRole('button', { name: /Aprovar i desar nota/ }));
 view.unmount(); resolve({ remot: false, conflicte: true });
 await Promise.resolve();
 expect(screen.queryByRole('alert')).toBeNull();
 expect(m.read).not.toHaveBeenCalled();
});
