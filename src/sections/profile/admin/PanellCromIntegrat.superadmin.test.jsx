import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* Onada R6 · Bloc 2 (P1-b) · El Crom del sistema només es desa per a tot el
   poble si qui mira és superadmin: la capacitat 'personalitzacio' del port no
   és un rol. */
const m = vi.hoisted(() => ({ sessio: null, desa: vi.fn() }));
vi.mock('../../../app/contexts/SessionContext.jsx', () => ({
  useSession: () => ({ currentUser: null, estat: 'fora' }),
  useSessioOpcional: () => m.sessio,
}));
vi.mock('../../../app/contexts/CoreContentContext.jsx', () => ({
  useCoreContent: () => ({ personalitzacio: null, refresh: vi.fn() }),
}));
vi.mock('../../../app/contexts/RouterContext.jsx', () => ({ Link: ({ to, children }) => <a href={to}>{children}</a> }));
vi.mock('../../../data/backendPort.js', () => ({
  teCapacitat: (cap) => cap === 'personalitzacio',
  adminDesaPersonalitzacio: (...args) => m.desa(...args),
}));
vi.mock('../../../config/crom.js', () => ({
  aplica: vi.fn(),
  base: () => ({ canons: ['#000000'] }),
  CANON_BLAU: 0,
  deltaDe: () => 0,
  previsualitza: () => [],
  restaura: vi.fn(),
}));
import { PanellCromIntegrat } from './PanellsAdministracioSistema.jsx';

beforeEach(() => {
  m.sessio = null;
  m.desa = vi.fn(() => Promise.resolve({ versio: 2 }));
});
afterEach(cleanup);

const pinta = () => render(<div className="sdp-root"><PanellCromIntegrat /></div>);

test('P1-b · sense superadmin el Crom no ofereix «Desar» ni crida adminDesaPersonalitzacio', () => {
  for (const sessio of [null, { esSuperadmin: false }, { rol: 'veí' }]) {
    cleanup();
    m.sessio = sessio;
    pinta();
    expect(screen.queryByRole('button', { name: 'Desar' })).toBeNull();
  }
  expect(m.desa).not.toHaveBeenCalled();
});

test('P1-b · amb superadmin i la capacitat, «Desar» crida adminDesaPersonalitzacio', async () => {
  m.sessio = { esSuperadmin: true };
  pinta();
  fireEvent.click(screen.getByRole('button', { name: 'Desar' }));
  await vi.waitFor(() => expect(m.desa).toHaveBeenCalledTimes(1));
  expect(m.desa.mock.calls[0][0]).toMatchObject({ clau: 'estil' });
});
