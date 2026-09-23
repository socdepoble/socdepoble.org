import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ adapter: null, upload: vi.fn(), config: { tenantId: 'tenant-A' } }));
vi.mock('./NotesContext', () => ({
  useNotes: () => ({ noteFolders: [], t: (_key, fallback) => fallback, config: mocks.config, workspaceKey: mocks.config.tenantId }),
  etiquetesDeNota: () => []
}));
vi.mock('../../components/universal/DocumentEditor', () => ({ DocumentEditor: ({ adapter }) => { mocks.adapter = adapter; return null; } }));
vi.mock('../../data/backendPort.js', () => ({ uploadToStorage: mocks.upload, teCapacitat: () => true }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: 'user' }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [] }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({}), ESTAT: { DINS: 'dins' } }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn() }));
import NotesEditor from './NotesEditor.jsx';
afterEach(cleanup);
test('la pujada usa la configuració del workspace A i després la de B', async () => {
  mocks.upload.mockResolvedValue({ url: 'sdp-media://result' });
  const { rerender } = render(<NotesEditor />);
  const file = new Blob(['image'], { type: 'image/png' });
  await mocks.adapter.uploadMedia(file);
  expect(mocks.upload).toHaveBeenLastCalledWith(file, { carpeta: 'notes', tenantId: 'tenant-A' }, mocks.config);
  mocks.config = { tenantId: 'tenant-B' };
  rerender(<NotesEditor />);
  await mocks.adapter.uploadMedia(file);
  expect(mocks.upload).toHaveBeenLastCalledWith(file, { carpeta: 'notes', tenantId: 'tenant-B' }, mocks.config);
});
