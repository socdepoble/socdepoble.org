/* R51 (P0-46 / IDEA-177; R51V-03) · El lector del MAS (LectorDePublicacio)
   passa tots els casos pel pla del contracte (planTraduccioPublicacio.js):
   amb on_the_fly, Traduir; amb 'none', la revisada, una revisada incompleta o
   un mode invàlid, cap Traduir (mai Apertium). La revisada pinta el títol i
   el cos de la llengua de la interfície; un error, l'original i un avís
   accessible. Els dobles de PublicacioDetall.traduccio.test.jsx. */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: () => {}, toast: vi.fn(), t: (_, alternativa) => alternativa, language: 'ca',
  identitat: { actor: { tipus: 'persona', id: 'U', nom: 'Pep' } },
  core: { status: 'ready', towns: [] }, media: { status: 'ready', mediaItems: [] },
  mur: { status: 'ready', feedPosts: [], events: [], marketItems: [] }
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: mocks.t, language: mocks.language }),
  useUIState: () => { throw new Error('fora de l’app'); }
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: { id: 'U' } }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => mocks.media }));

import { LectorDePublicacio } from './PublicacioDetall.jsx';
import { publicacioComANota } from './masDeLUsuari.js';
import { AVIS_PAGINA_SENSE_TRADUCCIO } from '../../components/universal/PageFrame.jsx';
import { AVIS_SENSE_TRADUCTOR } from '../../components/PedraSeca/hooks/useTraduccioPagina.js';

const CREAT = '2026-10-20T10:00:00.000Z';
const AVIS = 'Esta publicació no té la traducció ben configurada: es mostra en la llengua original, sense traducció automàtica.';
const revisades = (llengues = ['ca', 'es', 'en', 'eu', 'gl']) => Object.fromEntries(llengues.map((codi) => [codi, { title: `Festa ${codi}`, content: `<p>Cos revisat ${codi}</p>`, reviewed: true }]));
const pinta = (extra) => render(<LectorDePublicacio item={publicacioComANota({
  id: 'p-r51', type: 'feed', title: 'Festa original', content: '<p>Cos original</p>', created_at: CREAT, ...extra
}, 'mur')} />).container;
function avisDeTraduir(container) {
  const boto = container.querySelector('header.bar-blue button[aria-label="Traduir"]');
  expect(boto, 'el botó hi és (Llei del Píxel)').toBeTruthy();
  fireEvent.click(boto);
  return mocks.toast.mock.calls.at(-1)?.[0];
}

beforeEach(() => { vi.clearAllMocks(); mocks.language = 'ca'; });
afterEach(cleanup);

test('on_the_fly: Traduir hi és (sense servei, l’avís de sempre), sense cap avís R51', () => {
  const container = pinta({ translation_mode: 'on_the_fly', source_language: 'es' });
  expect(avisDeTraduir(container)).toBe(AVIS_SENSE_TRADUCTOR);
  expect(container.textContent).not.toContain(AVIS);
});

test('none: l’original i cap Traduir', () => {
  const container = pinta({ translation_mode: 'none', source_language: 'ca' });
  expect(container.querySelector('h1').textContent).toBe('Festa original');
  expect(avisDeTraduir(container)).toBe(AVIS_PAGINA_SENSE_TRADUCCIO);
});

test('la revisada completa: el títol i el cos de la llengua de la interfície, i cap Traduir', () => {
  mocks.language = 'en';
  const container = pinta({ translation_mode: 'curated_5_langs', source_language: 'ca', translations: revisades() });
  expect(container.querySelector('h1').textContent).toBe('Festa en');
  expect(container.textContent).toContain('Cos revisat en');
  expect(container.textContent).not.toContain('Cos original');
  expect(avisDeTraduir(container)).toBe(AVIS_PAGINA_SENSE_TRADUCCIO);
});

test.each([
  ['la revisada incompleta', { translation_mode: 'curated_5_langs', source_language: 'ca', translations: revisades(['ca', 'es']) }],
  ['un mode que no existix', { translation_mode: 'auto', source_language: 'ca' }],
  ['una llengua que no és de les cinc', { translation_mode: 'on_the_fly', source_language: 'fr' }]
])('%s: l’original, l’avís accessible i cap Traduir (mai Apertium)', (_, extra) => {
  mocks.language = 'es';
  const container = pinta(extra);
  expect(container.querySelector('h1').textContent).toBe('Festa original');
  expect(container.textContent).toContain('Cos original');
  expect(screen.getAllByRole('status').some((regio) => regio.textContent.includes(AVIS))).toBe(true);
  expect(avisDeTraduir(container)).toBe(AVIS_PAGINA_SENSE_TRADUCCIO);
});
