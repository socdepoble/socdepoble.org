/* Revisió final R16a (carril FA) · Una publicació pròpia del Mur oberta en
   viu (PublicacioEditable): l'editor escriu en una nota en memòria i el Mur
   només canvia amb «Actualitzar al Mur». El botó diu «Publicat» (verd) en
   obrir-la, passa a «pendent» (blau) amb la primera edició i només hi torna
   després d'una publicació que acaba bé.
   PublicacioEditable, NotesEditor i DocumentEditor són de veres; només la
   barra rica és un doble que guarda les props, com a
   DocumentEditor.botoPublicacio.test.jsx, i el context de base, com a
   PublicacioEditable.test.jsx. */
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
import { bgSaveManager } from './GlobalSaveManager.js';
import { _reiniciaRevisionsEditorialsPerAProves, revisioEditorial } from '../../data/revisionsEditorials.js';

const UUID_FILA = '3f2a1b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b';
const FILA_MUR = {
  id: UUID_FILA, title: 'Festa de la Torre', post_subtitle: 'Cada agost', entradilla: 'La festa del poble.',
  content: '<h3>Programa</h3><p>Missa i ball.</p>', image_url: '/assets/mur/festa.webp', author_user_id: 'U'
};
const MANIFEST = { id: 'manifest-de-poble', title: 'Manifest de Poble', entradilla: 'Les associacions…', content: '<p>Un document obert.</p>' };

let base;
beforeEach(() => {
  _reiniciaRevisionsEditorialsPerAProves();
  mocks.barra = null;
  mocks.adapter = null;
  base = {
    config: { dataMode: 'remote', tenantId: '00000000-0000-4000-8000-0000000000a1' }, scopeKey: 'ambit-fa-viu', t: (_c, r) => r,
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
const boto = () => mocks.barra.publishState;
const id = () => mocks.adapter.document.id;
const desa = async (camp, valor) => { await act(async () => { await mocks.adapter.saveRemote(id(), camp, valor); }); };
/* «Actualitzar al Mur»: el selector de visibilitat confirma «pública» (NotesEditor · onTria). */
const actualitzaAlMur = () => mocks.adapter.visibilitat.onTria(true, mocks.adapter.document).then(() => 'fet', (error) => error);

test('en obrir-la el Mur té la nota: «Publicat»; reescriure el mateix valor no és cap edició', async () => {
  obri(FILA_MUR);
  expect(mocks.adapter.document.isPublished).toBe(true);
  expect(mocks.adapter.publicacioAlDia).toBe(true);
  expect(boto()).toBe('publicat');
  act(() => { mocks.adapter.updateLocal(id(), 'title', 'Festa de la Torre'); });
  await desa('title', 'Festa de la Torre');
  expect(boto()).toBe('publicat');
});

test('la primera edició, només en memòria, la deixa «pendent»: ni la cua ni el Mur l’han rebuda', async () => {
  obri(FILA_MUR);
  await desa('title', 'Festa de la Torre (canviada)');
  expect(mocks.adapter.document.title).toBe('Festa de la Torre (canviada)');
  expect(mocks.adapter.estatDesament?.estat ?? 'net').toBe('net');
  expect(bgSaveManager.estat(base.scopeKey, id()).estat).toBe('net');
  expect(base.saveNoteField).not.toHaveBeenCalled();
  expect(base.publishNote).not.toHaveBeenCalled();
  expect(mocks.adapter.publicacioAlDia).toBe(false);
  expect(boto()).toBe('pendent');
});

test('L5 · el reenquadrament de la capçalera també és una edició que el Mur no té: «pendent»', async () => {
  obri(FILA_MUR);
  await desa('heroImage', '/assets/mur/festa.webp#sdp-crop=format=16%3A9&zoom=1.5&cx=0.4&cy=0.6');
  expect(mocks.adapter.document.heroImage).toContain('#sdp-crop=');
  expect(boto()).toBe('pendent');
});

test('fila del Mur: «Actualitzar» que falla continua «pendent»; el que acaba bé torna «Publicat»', async () => {
  base.publishNote.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  obri(FILA_MUR);
  await desa('title', 'Festa major');
  let resultat;
  await act(async () => { resultat = await actualitzaAlMur(); });
  expect(resultat).toBeInstanceOf(Error);
  expect(boto()).toBe('pendent');
  await act(async () => { resultat = await actualitzaAlMur(); });
  expect(resultat).toBe('fet');
  expect(base.publishNote).toHaveBeenCalledTimes(2);
  expect(base.publishNote.mock.calls[1][0]).toMatchObject({ title: 'Festa major', publishedSubmissionId: UUID_FILA, isPublished: true });
  expect(boto()).toBe('publicat');
  await desa('lead', 'Una altra entradilla');
  expect(boto()).toBe('pendent');
});

test('una edició mentre «Actualitzar» viatja no és al Mur: després de publicar, continua «pendent»', async () => {
  let acaba;
  base.publishNote.mockImplementationOnce(() => new Promise((resolve) => { acaba = resolve; }));
  obri(FILA_MUR);
  await desa('title', 'Festa major');
  let promesa;
  await act(async () => { promesa = actualitzaAlMur(); });
  await desa('subtitle', 'Escrit mentre publicava');
  await act(async () => { acaba(true); expect(await promesa).toBe('fet'); });
  expect(base.publishNote.mock.calls[0][0].subtitle).toBe('Cada agost');
  expect(boto()).toBe('pendent');
});

test('la llavor (revisió editorial): «Actualitzar al Mur» la desa i el botó torna a «Publicat»', async () => {
  obri(MANIFEST);
  expect(boto()).toBe('publicat');
  await desa('lead', 'Entradilla revisada');
  expect(boto()).toBe('pendent');
  let resultat;
  await act(async () => { resultat = await actualitzaAlMur(); });
  expect(resultat).toBe('fet');
  expect(revisioEditorial('mur', 'manifest-de-poble')).toEqual({ lead: 'Entradilla revisada' });
  expect(base.publishNote).not.toHaveBeenCalled();
  expect(boto()).toBe('publicat');
});
