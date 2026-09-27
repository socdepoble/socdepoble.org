import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* T5 · Connectar crea una nota amb origen a la safata «Connectats». */
/* Els objectes i funcions dels mocks són estables (hoisted): un valor nou a
   cada render entraria als deps dels efectes i faria un bucle. */
const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), toast: vi.fn(), crea: vi.fn(), canCreate: true, user: { id: 'U' },
  params: new URLSearchParams(), folders: [], t: (_, alternativa) => alternativa
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [mocks.params]
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => ({ currentUser: mocks.user }) }));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ noteFolders: mocks.folders, creaNota: mocks.crea, canCreate: mocks.canCreate }) }));
import ConnectarSection, { contingutDeLaConnexio, origenDeLaConnexio } from './ConnectarSection.jsx';

const PARAMS = 'item_id=samarreta-socdepoble&title=Samarreta&sectionId=mercat&targetUserId=socdepoble&autorTipus=entitat&author=S%C3%B3c%20de%20Poble';

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.canCreate = true;
  mocks.user = { id: 'U' };
  mocks.params = new URLSearchParams(PARAMS);
  mocks.crea.mockResolvedValue({ id: 'n-9' });
});

test('la connexió naix a «Connectats», recorda l’origen sencer i porta a la nota', async () => {
  render(<ConnectarSection />);
  expect(screen.getByRole('button', { name: 'Connectats' }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Guardar Connexió' }));
  await waitFor(() => expect(mocks.crea).toHaveBeenCalledTimes(1));
  const [entrada] = mocks.crea.mock.calls[0];
  expect(entrada).toMatchObject({
    title: 'Samarreta', folderId: 'f-connectats', tags: [],
    origen: { tipus: 'connexio', sectionId: 'mercat', itemId: 'samarreta-socdepoble', titol: 'Samarreta',
      autorId: 'socdepoble', autorNom: 'Sóc de Poble', autorTipus: 'entitat', ruta: '/mercat/samarreta-socdepoble' }
  });
  expect(entrada.content).toContain('href="/mercat/samarreta-socdepoble"');
  expect(entrada.content).toContain('Sóc de Poble');
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/notes?nota=n-9'));
  expect(mocks.toast).toHaveBeenCalledWith(expect.stringContaining('Connectats'), 'success');
});

test('es pot triar una altra carpeta i afegir etiquetes abans de guardar', async () => {
  render(<ConnectarSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Mur' }));
  fireEvent.click(screen.getByRole('button', { name: 'Patrimoni' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Etiqueta lliure' }), { target: { value: 'Roba' } });
  fireEvent.click(screen.getByRole('button', { name: 'Afegir' }));
  fireEvent.click(screen.getByRole('button', { name: 'Guardar Connexió' }));
  await waitFor(() => expect(mocks.crea).toHaveBeenCalledTimes(1));
  expect(mocks.crea.mock.calls[0][0]).toMatchObject({ folderId: 'f-mur', tags: ['Patrimoni', 'Roba'] });
});

test('sense poder guardar (Foraster en remot) només simula i no crea res', () => {
  mocks.canCreate = false;
  mocks.user = null;
  vi.useFakeTimers();
  try {
    render(<ConnectarSection />);
    fireEvent.click(screen.getByRole('button', { name: 'Simular Guardat' }));
    expect(mocks.crea).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith(expect.stringContaining('Mode Foraster'), 'info');
  } finally {
    vi.useRealTimers();
  }
});

test('l’origen i el cos es calculen sense inventar res: escapen el text i enllacen només si hi ha ruta', () => {
  const origen = origenDeLaConnexio(new URLSearchParams('item_id=x&title=%3Cb%3EFira%3C%2Fb%3E'));
  expect(origen).toMatchObject({ tipus: 'connexio', itemId: 'x', titol: '<b>Fira</b>', sectionId: '', ruta: '' });
  const cos = contingutDeLaConnexio(origen);
  expect(cos).toContain('&lt;b&gt;Fira&lt;/b&gt;');
  expect(cos).not.toContain('<a ');
  expect(origenDeLaConnexio(new URLSearchParams('')).titol).toBe('element-desconegut');
});
