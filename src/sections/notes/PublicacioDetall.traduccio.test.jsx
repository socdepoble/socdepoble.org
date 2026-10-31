/* Gauntlet 261030 (Fase 3, TC3.2; troballa P1 `traduir-contingut-de-membres`)
   · Una publicació pròpia vista des del MAS (PublicacioDetall, dins de /notes)
   només es traduïx si és pública (traduccio/visibilitatTraduible.js). Una del
   veïnat (section_submissions: ownerUserId, encara que siga null) no ix cap al
   motor: el botó no canvia i PageFrame avisa (AVIS_PAGINA_SENSE_TRADUCCIO).
   Sense servei de traducció, una pública dona l'avís de sempre
   (AVIS_SENSE_TRADUCTOR). Els dobles de PublicacioDetall.capcalera.test.jsx. */
import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: () => {}, toast: vi.fn(), t: (_, alternativa) => alternativa,
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
  useUIActions: () => ({ t: mocks.t }),
  useUIState: () => { throw new Error('fora de l’app'); }
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: { id: 'U' } }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => mocks.media }));

import { PublicacioDetall } from './PublicacioDetall.jsx';
import { publicacioComANota } from './masDeLUsuari.js';
import { AVIS_PAGINA_SENSE_TRADUCCIO } from '../../components/universal/PageFrame.jsx';
import { AVIS_SENSE_TRADUCTOR } from '../../components/PedraSeca/hooks/useTraduccioPagina.js';

const CREAT = '2026-10-20T10:00:00.000Z';
function avisDeTraduir(item, seccio) {
  const { container } = render(<PublicacioDetall item={publicacioComANota({ created_at: CREAT, ...item }, seccio)} />);
  const boto = container.querySelector('header.bar-blue button[aria-label="Traduir"]');
  expect(boto, 'el botó hi és (Llei del Píxel)').toBeTruthy();
  fireEvent.click(boto);
  return mocks.toast.mock.calls.at(-1)?.[0];
}

beforeEach(() => { vi.clearAllMocks(); });
afterEach(cleanup);

test('una publicació pública del Mur: Traduir hi és (sense servei, l’avís de sempre)', () => {
  expect(avisDeTraduir({ id: 'p-publica', type: 'feed', title: 'Festa inventada', content: 'Text públic inventat.' }, 'mur'))
    .toBe(AVIS_SENSE_TRADUCTOR);
});

test('una publicació del veïnat (ownerUserId null, només per als membres): Traduir no envia res', () => {
  for (const [seccio, item] of [
    ['mur', { id: 'p-veinat', type: 'feed', title: 'Sopar inventat', content: 'Text del veïnat inventat.', ownerUserId: null }],
    ['mercat', { id: 'm-veinat', type: 'market', title: 'Cistella inventada', description: 'Producte inventat.', owner_user_id: 'u-1' }],
    ['events', { id: 'e-veinat', type: 'event', title: 'Ball inventat', description: 'Acte inventat.', visibility: 'members' }]
  ]) {
    expect(avisDeTraduir(item, seccio), seccio).toBe(AVIS_PAGINA_SENSE_TRADUCCIO);
    cleanup();
  }
});
