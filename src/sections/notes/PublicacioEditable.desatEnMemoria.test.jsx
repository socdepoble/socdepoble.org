/* v1.2.20 · Gauntlet R1 (L2-01) · Una publicació pròpia del Mur oberta al Bloc (PublicacioEditable)
   s'edita en una nota en memòria: ni la cua de desat ni el navegador en guarden res fins a
   «Actualitzar al Mur». L'estat visible ho ha de dir així, i no «desat com a esborrany privat» ni
   «Còpia local». PublicacioEditable, NotesEditor, DocumentEditor i la closca són de veres; els dobles
   són els de PublicacioEditable.botoPublicacio.test.jsx. */
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ barra: null, adapter: null }));
vi.mock('../../components/universal/richText', () => ({
  useUniversalRichText: () => null,
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: (props) => { mocks.barra = props; return <div className="sdp-editor-tools" />; },
  UniversalRichTextContent: () => <div />
}));
vi.mock('../../components/universal/richText/extensions', () => ({ extensionsRiques: () => [] }));
vi.mock('../../components/universal/DocumentEditor', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, DocumentEditor: (props) => { mocks.adapter = props.adapter; return <real.DocumentEditor {...props} />; } };
});
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActions: () => ({ t: (_clau, text) => text }),
  useUIStateOpcional: () => null
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(), Link: 'a', useSearchParams: () => [new URLSearchParams(''), vi.fn()]
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../../app/contexts/useIdentitatOReserva.js', () => ({
  useIdentitatOReserva: () => ({ actor: { tipus: 'persona', id: 'U', nom: 'Pepa' }, actorId: 'U', memberships: [] })
}));
vi.mock('../../hooks/useSuperadminEstable.js', () => ({ useSuperadminEstable: () => ({ esSuperadmin: false, rolPendent: false }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [], towns: [], pages: [] }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: { id: 'U' }, estat: 'dins' }), ESTAT: { DINS: 'dins' } }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ status: 'ready', feedPosts: [], events: [], marketItems: [] }) }));
vi.mock('../../data/backendPort.js', () => ({ uploadToStorage: vi.fn(), teCapacitat: () => true }));

import { NotesContext } from './objectesDeContext.js';
import { PublicacioEditable } from './PublicacioEditable.jsx';
import { publicacioComANota } from './masDeLUsuari.js';
import { _reiniciaRevisionsEditorialsPerAProves } from '../../data/revisionsEditorials.js';
import { TEXTOS_HONESTEDAT_DESAT } from './honestedatDesat.js';

const UUID_FILA = '3f2a1b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b';
const FILA_MUR = {
  id: UUID_FILA, title: 'Festa de la Torre', post_subtitle: 'Cada agost', entradilla: 'La festa del poble.',
  content: '<h3>Programa</h3><p>Missa i ball.</p>', image_url: '/assets/mur/festa.webp', author_user_id: 'U'
};


let base;
beforeEach(() => {
  _reiniciaRevisionsEditorialsPerAProves();
  mocks.barra = null;
  mocks.adapter = null;
  base = {
    config: { dataMode: 'remote', tenantId: '00000000-0000-4000-8000-0000000000a1' }, scopeKey: 'ambit-memoria', t: (_c, r) => r,
    notes: [], noteFolders: [], notesComplete: true, workspaceKey: 'a',
    setLocalNoteField: vi.fn(), saveNoteField: vi.fn(async () => true), compartirNota: vi.fn(), mouNota: vi.fn(), esborraNota: vi.fn(), potEsborrar: true,
    creaNota: vi.fn(async (input) => ({ ...input, revision: 0 })),
    updateNote: vi.fn(async (id, canvis, revisio) => ({ id, ...canvis, revision: revisio + 1 })),
    publishNote: vi.fn(async () => true), rebuigDePublicacio: vi.fn(() => null)
  };
});
afterEach(() => {
  cleanup();
  _reiniciaRevisionsEditorialsPerAProves();
});

const obri = (element, seccio = 'mur') => render(
  <NotesContext.Provider value={base}><PublicacioEditable item={publicacioComANota(element, seccio)} /></NotesContext.Provider>
);
const MEMORIA = TEXTOS_HONESTEDAT_DESAT.ca.memoria;
const paragraf = (vista) => vista.container.querySelector('[data-sdp-notes-desament="true"]');

test.each(['remote', 'seed'])('L2-01 · en mode %s, l’estat visible diu que els canvis només són en esta pantalla', async (dataMode) => {
  base.config = { ...base.config, dataMode };
  const vista = obri(FILA_MUR);
  expect(mocks.adapter.textEstatDesament).toBe(MEMORIA);
  await act(async () => { await mocks.adapter.saveRemote(mocks.adapter.document.id, 'title', 'Festa major'); });
  expect(base.saveNoteField).not.toHaveBeenCalled();
  expect(mocks.adapter.textEstatDesament).toBe(MEMORIA);
  expect(paragraf(vista)?.textContent).toBe(MEMORIA);
  const { privada, publicada, local } = TEXTOS_HONESTEDAT_DESAT.ca;
  for (const fals of [privada, publicada, local]) expect(paragraf(vista).textContent).not.toContain(fals);
});
