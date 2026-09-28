/* T47 (correcció de la revisió C01, 260928) · «Confirmar eixida» no esborra
 * en silenci el que el servidor encara no té: primer ho diu, i només «Eixir
 * igualment» tanca la sessió (i, amb ella, oblida els esborranys d'este
 * dispositiu). */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ navigate: vi.fn(), logout: vi.fn(), preparaEixida: vi.fn() }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => m.navigate }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({
  useSession: () => ({ logout: m.logout, preparaEixida: m.preparaEixida }),
}));
import DetallAjust, { pagina } from './DetallAjust.jsx';

const EIXIDA = Object.freeze({ id: 'sessio', lloc: 'compte', titol: 'Tancar sessió', tipus: 'accio', accio: 'logout', obert: true });
const jo = Object.freeze({ id: 'jo', mena: 'persona', nom: 'Pep', dades: {} });

beforeEach(() => {
  m.navigate.mockReset();
  m.logout.mockReset().mockResolvedValue(undefined);
  m.preparaEixida.mockReset().mockResolvedValue([]);
  vi.spyOn(pagina, 'recarrega').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const confirma = () => act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Confirmar eixida' })); });

test('C01 · sense res pendent, «Confirmar eixida» ix de seguida', async () => {
  render(<DetallAjust ajust={EIXIDA} identitat={jo} />);
  await confirma();
  expect(m.preparaEixida).toHaveBeenCalledTimes(1);
  expect(m.logout).toHaveBeenCalledTimes(1);
  expect(m.navigate).toHaveBeenCalledWith('/xat', { replace: true });
  expect(pagina.recarrega).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('status')).toBeNull();
});

test('C01 · amb canvis que el servidor no té, ho diu abans i només «Eixir igualment» tanca la sessió', async () => {
  m.preparaEixida.mockResolvedValue([
    { entitat: 'perfil', id: 'jo', camps: ['lead'] },
    { entitat: 'nota', id: 'n', camps: ['title', 'icon'] },
  ]);
  render(<DetallAjust ajust={EIXIDA} identitat={jo} />);
  await confirma();
  expect(m.logout).not.toHaveBeenCalled();
  const avis = screen.getByRole('status');
  expect(avis.textContent).toContain('Encara hi ha canvis sense desar');
  expect(avis.textContent).toContain('Tens 3 canvis que el servidor encara no té (a la fitxa: l’entradilla; a Notes: 1 nota). Si ixes ara, s’esborraran d’este dispositiu.');
  // El focus va al botó que no esborra res.
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'No eixir encara' }));
  expect(screen.getByRole('button', { name: 'Confirmar eixida' }).disabled).toBe(true);

  // «No eixir encara»: ni es tanca ni s'esborra res.
  fireEvent.click(screen.getByRole('button', { name: 'No eixir encara' }));
  expect(screen.queryByRole('status')).toBeNull();
  expect(m.logout).not.toHaveBeenCalled();
  expect(pagina.recarrega).not.toHaveBeenCalled();

  // Una altra vegada, i ara «Eixir igualment».
  await confirma();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Eixir igualment' })); });
  expect(m.logout).toHaveBeenCalledTimes(1);
  expect(m.navigate).toHaveBeenCalledWith('/xat', { replace: true });
  expect(pagina.recarrega).toHaveBeenCalledTimes(1);
});

test('C01 · si tancar la sessió falla, es diu en línia i no es recarrega', async () => {
  m.logout.mockRejectedValue(new Error('Sense xarxa'));
  render(<DetallAjust ajust={EIXIDA} identitat={jo} />);
  await confirma();
  expect(screen.getByRole('alert').textContent).toBe('No s’ha pogut tancar la sessió.');
  expect(pagina.recarrega).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Confirmar eixida' }).disabled).toBe(false);
});
