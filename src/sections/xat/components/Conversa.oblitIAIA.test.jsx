import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import Conversa from './Conversa.jsx';

const t = (_, alternativa) => alternativa;
const FIL = { id: 'iaia-local-00000000-0000-4000-8000-000000000077', tipus: 'iaia', sessioLocalIAIA: true, filLocalIAIA: true, name: 'Mercat', potEscriure: true };
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() { this.setAttribute('open', ''); } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value() { this.removeAttribute('open'); this.dispatchEvent(new Event('close')); } });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); delete HTMLDialogElement.prototype.showModal; delete HTMLDialogElement.prototype.close; });
function pinta(onOblidaSessioIAIA, fil = FIL) {
  render(<MemoryRouter><AppGridContext.Provider value={{ mida: 'ample' }}><Conversa
    fil={fil} messages={[]} onSendMessage={vi.fn()} t={t} onOblidaSessioIAIA={onOblidaSessioIAIA}
  /></AppGridContext.Provider></MemoryRouter>);
}
function demanaOblit() {
  fireEvent.click(screen.getByRole('button', { name: 'Opcions de la conversa' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Oblida esta conversa' }));
}
test('el menú del fil IAIA confirma amb el diàleg existent, cancel·lar no escriu i confirmar oblida el fil', async () => {
  const oblida = vi.fn().mockResolvedValue(true);
  pinta(oblida);
  demanaOblit();
  expect(screen.getByRole('dialog', { name: 'Oblida esta conversa' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel·lar' }));
  expect(oblida).not.toHaveBeenCalled();
  demanaOblit();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Oblida la conversa' })); });
  expect(oblida).toHaveBeenCalledExactlyOnceWith(FIL.id);
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});
test('quota fallida manté la confirmació oberta, anuncia l’error i permet tornar-ho a provar', async () => {
  const oblida = vi.fn().mockRejectedValueOnce(new DOMException('Quota', 'QuotaExceededError')).mockResolvedValue(true);
  pinta(oblida);
  demanaOblit();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Oblida la conversa' })); });
  expect(screen.getByRole('alert').textContent).toBe('No s’ha pogut oblidar la conversa. Torna-ho a provar.');
  expect(screen.getByRole('dialog')).toBeTruthy();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Oblida la conversa' })); });
  expect(oblida).toHaveBeenCalledTimes(2);
});
test('el xat públic de la IAIA no oferix esborrar un títol local', () => {
  pinta(vi.fn(), { ...FIL, id: 'public-iaia', tipus: 'grup', sessioLocalIAIA: false });
  fireEvent.click(screen.getByRole('button', { name: 'Opcions de la conversa' }));
  expect(screen.queryByRole('menuitem', { name: 'Oblida esta conversa' })).toBeNull();
});
