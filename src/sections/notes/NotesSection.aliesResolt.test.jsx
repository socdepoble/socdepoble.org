/* Revisió del Gauntlet 261017 (ID6, relleu 3: una altra sessió mai no és
   Javi) · El Bloc resol els àlies de l'actor amb el mode de dades RESOLT
   (modeDeDadesResolt: normalizeBackendConfig, que té en compte l'elecció
   remota desada en este navegador), el mateix de NotesEditor, NotaFitxa i
   usePublicacionsDeLActor. Abans llegia el `dataMode` cru del paquet: en un
   paquet 'seed' que ja havia triat l'entrada real, qualsevol compte remot
   heretava els àlies de la persona pilot i el Mac Mini de Javi eixia al seu
   Bloc com a publicació pròpia. Mateix patró que NotesSection.mas.test.jsx:
   només el model de l'espai de treball. */
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { MOCK_MARKET_ITEMS } from '../mercat/marketSeed.js';

/* Un tenant UUID (backendConfig l'exigix) i un compte remot qualsevol, que no
   és cap àlies de la persona pilot. */
const TENANT = '00000000-0000-4000-8000-0000000000f6';
const UN_ALTRE_COMPTE = { tipus: 'persona', id: '9d3e1c7a-5b2f-4e8d-a1c0-6f4b2d9e7a31', rol: 'persona' };

const mocks = vi.hoisted(() => ({
  model: null,
  actor: null,
  config: null,
  mercat: [],
  /* El mode que torna resolveDataMode (null: el de veres, sense elecció desada). */
  modeResolt: null
}));
/* L'elecció remota desada, sense recarregar: amb modeResolt, resolveDataMode
   torna eixe mode; sense, el de veres (el mateix patró que NotesEditor.test.jsx). */
vi.mock('../../config/dataMode.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, resolveDataMode: (config) => mocks.modeResolt ?? real.resolveDataMode(config) };
});
vi.mock('./NotesContext', async (importOriginal) => ({ ...await importOriginal(), useNotes: () => ({
  notes: [], noteFolders: [{ id: 'f-mercat', name: 'Mercat' }], status: 'ready', canCreate: true, teSessio: true,
  creaNota: vi.fn()
}) }));
vi.mock('./NotesDataContext.jsx', () => ({ useNotesData: () => ({ activate: () => () => {}, config: mocks.config }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useSearchParams: () => [new URLSearchParams(), vi.fn()] }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: mocks.actor, memberships: [] }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sortedFeedPosts: [], sortedEvents: [], sortedMarketItems: mocks.mercat }) }));
vi.mock('../multimedia/MultimediaContext.jsx', () => ({ useMultimedia: () => ({ status: 'ready', mediaItems: [] }) }));
vi.mock('../../app/contexts/CoreContentContext', () => ({
  useCoreContent: () => ({ status: 'loading', towns: [], pages: [], pageCopy: {}, agents: [], sortedTowns: [], featuredTowns: [] })
}));
vi.mock('../../components/universal/workspace/UniversalWorkspace', () => ({ UniversalWorkspace: (props) => {
  mocks.model = props.model;
  return null;
} }));
vi.mock('./NotesDetail.jsx', () => ({ default: () => null }));
vi.mock('./NotaFitxa.jsx', () => ({ NotaFitxa: () => null }));
vi.mock('./ConnexioFitxa.jsx', () => ({ ConnexioFitxa: () => null }));
vi.mock('./PublicacioDetall.jsx', () => ({ PublicacioDetall: () => null, PublicacioFitxa: () => null }));
import NotesSection from './NotesSection.jsx';

afterEach(() => {
  cleanup();
  Object.assign(mocks, { model: null, actor: null, config: null, mercat: [], modeResolt: null });
});

const publicacionsDe = (estat) => {
  Object.assign(mocks, estat);
  render(<NotesSection />);
  return mocks.model.items.filter((item) => item.kind === 'publicacio').map((item) => item.id);
};

test('ID6 · un paquet seed que ja ha triat l’entrada real: un altre compte no hereta el Mac Mini de Javi', () => {
  const publicacions = publicacionsDe({
    actor: UN_ALTRE_COMPTE, config: { tenantId: TENANT, dataMode: 'seed' }, modeResolt: 'remote', mercat: MOCK_MARKET_ITEMS
  });
  expect(publicacions).not.toContain('publicacio:mercat:mac-mini-m4');
  expect(publicacions).toEqual([]);
});

test('ID6 · sense cap elecció desada, el padró pilot del dispositiu (mode seed) continua com sempre', () => {
  const publicacions = publicacionsDe({
    actor: UN_ALTRE_COMPTE, config: { tenantId: TENANT, dataMode: 'seed' }, mercat: MOCK_MARKET_ITEMS
  });
  expect(publicacions).toContain('publicacio:mercat:mac-mini-m4');
});
