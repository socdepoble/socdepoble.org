/* Gauntlet 261030 (cicle 4, lang-ca-nomes-a-textsection) · Decisió del
   Mestre (261030): «lang="ca" al contingut original en valencià quan la
   interfície està en una altra llengua». La fitxa d'un poble (/pobles/:id):
   l'H1 («Gent de …»), el nom del poble i l'entradilla (el text de la llavor o
   de la Viquipèdia en català) porten lang="ca" amb la interfície en anglés
   (WCAG 3.1.2). Una publicació del veïnat (/mur/:id) no declara cap llengua:
   la pot haver escrita qualsevol persona en qualsevol llengua. Amb la
   interfície en valencià, cap lang (el DOM de sempre). El PageFrame és el de
   veres; els dobles són els d'ItemDetailSection.traduccio.test.jsx. */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sectionId: 'pobles', itemId: null, navigate: vi.fn(), toast: vi.fn(), t: (_, alternativa) => alternativa,
  mur: { events: [], feedPosts: [], marketItems: [] }, towns: [], ui: null,
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
vi.mock('../../sections/notes/NotesDataContext', () => ({ useNotesData: () => ({ notes: [], status: 'ready' }) }));
vi.mock('../../sections/multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ mediaItems: [] }) }));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIState: () => mocks.ui,
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

const CREAT = '2026-10-20T10:00:00.000Z';
const POBLE = Object.freeze({
  id: 'poble-inventat', slug: 'poble-inventat', title: 'Poble Inventat', name: 'Poble Inventat',
  content: 'Poble Inventat és un municipi inventat del País Valencià.', created_at: CREAT
});
const PUBLICACIO = Object.freeze({ id: 'festa-inventada', type: 'feed', title: 'La festa inventada', content: 'Text de la festa.', created_at: CREAT });

function obri(sectionId, item, mur = {}) {
  mocks.sectionId = sectionId;
  mocks.itemId = item.id;
  mocks.mur = { events: [], feedPosts: [], marketItems: [], ...mur };
  return render(<ItemDetailSection />).container;
}
const original = (container) => container.querySelector('article.content-wrapper:not(.sdp-traduccio-cos)');

beforeEach(() => {
  vi.clearAllMocks();
  mocks.towns = [POBLE];
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test('/pobles/:id amb la interfície en anglés: l’H1, el nom i l’entradilla porten lang="ca"; l’article sencer, no', () => {
  mocks.ui = { locale: 'ca-ES', externalConfig: {}, llenguaDelText: 'en' };
  const container = obri('pobles', POBLE);
  const h1 = container.querySelector('header.page-title h1');
  expect([h1.textContent, h1.getAttribute('lang')]).toEqual(['Gent de Poble Inventat', 'ca']);
  const intro = original(container).querySelector('.page-intro');
  expect([intro.getAttribute('lang'), intro.textContent]).toEqual(['ca', expect.stringContaining('Poble Inventat')]);
  expect(original(container).hasAttribute('lang')).toBe(false);
});

test('/mur/:id no declara cap llengua: la publicació la pot haver escrita qualsevol', () => {
  mocks.ui = { locale: 'ca-ES', externalConfig: {}, llenguaDelText: 'en' };
  const container = obri('mur', PUBLICACIO, { feedPosts: [PUBLICACIO] });
  expect(container.querySelector('header.page-title h1').hasAttribute('lang')).toBe(false);
  expect(original(container).querySelector('[lang]')).toBeNull();
});

test('amb la interfície en valencià, la fitxa del poble no porta cap lang (el DOM de sempre)', () => {
  mocks.ui = { locale: 'ca-ES', externalConfig: {}, llenguaDelText: 'ca' };
  const container = obri('pobles', POBLE);
  expect(container.querySelectorAll('[lang]')).toHaveLength(0);
});
