/* Gauntlet 261030 (Fase 3, TC3.2; troballa P1 `traduir-contingut-de-membres`)
   · El detall d'un element (/mur/:id, /mercat/:id, /events/:id, /pobles/:id,
   /notes/:id) només es traduïx si l'element és públic i la secció en pot
   tindre de públic (components/universal/traduccio/visibilitatTraduible.js).
   Una publicació del veïnat (fila de section_submissions: ownerUserId, encara
   que siga null) o una nota no ixen mai cap al motor: el botó no canvia i, en
   clicar-lo, PageFrame avisa (AVIS_PAGINA_SENSE_TRADUCCIO). Un element públic,
   sense cap servei de traducció (com ací), dona l'avís de sempre
   (AVIS_SENSE_TRADUCTOR): la diferència és el que distingix les dues vies.
   Els mateixos dobles que ItemDetailSection.capcalera.test.jsx. */
import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sectionId: 'mur', itemId: null, navigate: vi.fn(), toast: vi.fn(), t: (_, alternativa) => alternativa,
  mur: { events: [], feedPosts: [], marketItems: [] }, towns: [], notes: [],
  sessio: { currentUser: null, estat: 'fora', rol: null, esSuperadmin: false }
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ sectionId: mocks.sectionId, itemId: mocks.itemId }),
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: `/${mocks.sectionId}/${mocks.itemId}`, state: null }),
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../sections/mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: mocks.towns }) }));
vi.mock('../../sections/notes/NotesDataContext', () => ({ useNotesData: () => ({ notes: mocks.notes, status: 'ready' }) }));
vi.mock('../../sections/multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ mediaItems: [] }) }));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActions: () => ({ t: mocks.t })
}));
vi.mock('../../app/contexts/SessionContext', () => ({
  ESTAT: Object.freeze({ COMPROVANT: 'comprovant', DINS: 'dins', FORA: 'fora' }),
  useSession: () => mocks.sessio,
  useSessioOpcional: () => mocks.sessio
}));
vi.mock('../../hooks/useSEO.js', () => ({ useSEO: () => {} }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
import ItemDetailSection from './ItemDetailSection.jsx';
import { AVIS_PAGINA_SENSE_TRADUCCIO } from '../../components/universal/PageFrame.jsx';
import { AVIS_SENSE_TRADUCTOR } from '../../components/PedraSeca/hooks/useTraduccioPagina.js';

const CREAT = '2026-10-20T10:00:00.000Z';
const publica = { id: 'festa-inventada', type: 'feed', title: 'La festa inventada', content: 'Text de la festa.', created_at: CREAT };
/* elementDeFilaPublicada (mapejadorSeccions.js) posa SEMPRE ownerUserId a una fila del veïnat. */
const delVeinat = { ...publica, id: 'sopar-inventat', title: 'El sopar del veïnat inventat', ownerUserId: null };

function avisDeTraduir(sectionId, item, mur = {}) {
  mocks.sectionId = sectionId;
  mocks.itemId = item.id;
  mocks.mur = { events: [], feedPosts: [], marketItems: [], ...mur };
  const { container } = render(<ItemDetailSection />);
  const boto = container.querySelector('header.bar-blue button[aria-label="Traduir"]');
  expect(boto, `${sectionId}/${item.id}: el botó hi és (Llei del Píxel)`).toBeTruthy();
  fireEvent.click(boto);
  return mocks.toast.mock.calls.at(-1)?.[0];
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.towns = [];
  mocks.notes = [];
});
afterEach(cleanup);

test('/mur/:id públic: Traduir hi és (sense servei, l’avís de sempre)', () => {
  expect(avisDeTraduir('mur', publica, { feedPosts: [publica] })).toBe(AVIS_SENSE_TRADUCTOR);
});

test('/mur/:id del veïnat (ownerUserId, només per als membres): Traduir no envia res', () => {
  expect(avisDeTraduir('mur', delVeinat, { feedPosts: [delVeinat] })).toBe(AVIS_PAGINA_SENSE_TRADUCCIO);
});

test('/mercat/:id i /events/:id del veïnat (owner_user_id, visibility no pública): tampoc', () => {
  const producte = { id: 'cistella-inventada', type: 'market', title: 'Cistella inventada', created_at: CREAT, owner_user_id: 'u-1' };
  expect(avisDeTraduir('mercat', producte, { marketItems: [producte] })).toBe(AVIS_PAGINA_SENSE_TRADUCCIO);
  cleanup();
  const acte = { id: 'ball-inventat', type: 'event', title: 'Ball inventat', created_at: CREAT, visibility: 'members' };
  expect(avisDeTraduir('events', acte, { events: [acte] })).toBe(AVIS_PAGINA_SENSE_TRADUCCIO);
});

test('/notes/:id (una nota, sempre privada): Traduir no envia res', () => {
  const nota = { id: 'nota-inventada', title: 'Nota inventada', body: 'Text privat inventat.' };
  mocks.notes = [nota];
  expect(avisDeTraduir('notes', nota)).toBe(AVIS_PAGINA_SENSE_TRADUCCIO);
});

test('/pobles/:id: públic només si les publicacions del poble (pestanya «Gent de …») ho són totes', () => {
  const poble = { id: 'poble-inventat', slug: 'poble-inventat', title: 'Poble Inventat', name: 'Poble Inventat' };
  mocks.towns = [poble];
  const delPoble = (extra) => ({ id: 'acte-del-poble', type: 'feed', title: 'Acte del poble inventat', created_at: CREAT, poble_id: 'poble-inventat', ...extra });
  expect(avisDeTraduir('pobles', poble, { feedPosts: [delPoble()] })).toBe(AVIS_SENSE_TRADUCTOR);
  cleanup();
  expect(avisDeTraduir('pobles', poble, { feedPosts: [delPoble({ ownerUserId: 'u-1' })] })).toBe(AVIS_PAGINA_SENSE_TRADUCCIO);
});
