/* R51 (P0-46 / IDEA-177; R51V-03) · El detall d'un element (/mur/:id) passa
   tots els casos pel pla del contracte (planTraduccioPublicacio.js): amb
   on_the_fly, Traduir; amb 'none', la revisada, una revisada incompleta o un
   mode invàlid, cap Traduir (mai Apertium). La revisada pinta el títol i el
   cos de la llengua de la interfície; un error, l'original i un avís
   accessible. Els mateixos dobles que ItemDetailSection.traduccio.test.jsx. */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sectionId: 'mur', itemId: null, navigate: vi.fn(), toast: vi.fn(), t: (_, alternativa) => alternativa, language: 'ca',
  mur: { events: [], feedPosts: [], marketItems: [] }, towns: [], notes: [],
  sessio: { currentUser: null, estat: 'fora', rol: null, esSuperadmin: false }
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useRouter: () => ({ memoria: false }),
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
  useUIActions: () => ({ t: mocks.t, language: mocks.language })
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
const AVIS = 'Esta publicació no té la traducció ben configurada: es mostra en la llengua original, sense traducció automàtica.';
const revisades = (llengues = ['ca', 'es', 'en', 'eu', 'gl']) => Object.fromEntries(llengues.map((codi) => [codi, { title: `Festa ${codi}`, content: `<p>Cos revisat ${codi}</p>`, reviewed: true }]));

function pinta(extra) {
  const item = { id: 'festa-r51', type: 'feed', title: 'La festa original', content: '<p>Cos original</p>', created_at: CREAT, ...extra };
  mocks.sectionId = 'mur';
  mocks.itemId = item.id;
  mocks.mur = { events: [], feedPosts: [item], marketItems: [] };
  return render(<ItemDetailSection />).container;
}
function avisDeTraduir(container) {
  const boto = container.querySelector('header.bar-blue button[aria-label="Traduir"]');
  expect(boto, 'el botó hi és (Llei del Píxel)').toBeTruthy();
  fireEvent.click(boto);
  return mocks.toast.mock.calls.at(-1)?.[0];
}

beforeEach(() => { vi.clearAllMocks(); mocks.language = 'ca'; });
afterEach(cleanup);

test('sense mode o amb on_the_fly: Traduir hi és (sense servei, l’avís de sempre)', () => {
  expect(avisDeTraduir(pinta({}))).toBe(AVIS_SENSE_TRADUCTOR);
  cleanup();
  const container = pinta({ translation_mode: 'on_the_fly', source_language: 'es' });
  expect(avisDeTraduir(container)).toBe(AVIS_SENSE_TRADUCTOR);
  expect(container.textContent).not.toContain(AVIS);
});

test('none: l’original i cap Traduir', () => {
  const container = pinta({ translation_mode: 'none', source_language: 'ca' });
  expect(container.querySelector('h1').textContent).toBe('La festa original');
  expect(avisDeTraduir(container)).toBe(AVIS_PAGINA_SENSE_TRADUCCIO);
});

test('la revisada completa: el títol i el cos de la llengua de la interfície, i cap Traduir', () => {
  mocks.language = 'gl';
  const container = pinta({ translation_mode: 'curated_5_langs', source_language: 'ca', translations: revisades() });
  expect(container.querySelector('h1').textContent).toBe('Festa gl');
  expect(container.textContent).toContain('Cos revisat gl');
  expect(container.textContent).not.toContain('Cos original');
  expect(avisDeTraduir(container)).toBe(AVIS_PAGINA_SENSE_TRADUCCIO);
});

test.each([
  ['la revisada incompleta', { translation_mode: 'curated_5_langs', source_language: 'ca', translations: revisades(['ca']) }],
  ['un mode que no existix', { translation_mode: 'ON_THE_FLY', source_language: 'ca' }],
  ['l’automàtica sense llengua original', { translation_mode: 'on_the_fly' }]
])('%s: l’original, l’avís accessible i cap Traduir (mai Apertium)', (_, extra) => {
  mocks.language = 'en';
  const container = pinta(extra);
  expect(container.querySelector('h1').textContent).toBe('La festa original');
  expect(container.textContent).toContain('Cos original');
  expect(screen.getAllByRole('status').some((regio) => regio.textContent.includes(AVIS))).toBe(true);
  expect(avisDeTraduir(container)).toBe(AVIS_PAGINA_SENSE_TRADUCCIO);
});
