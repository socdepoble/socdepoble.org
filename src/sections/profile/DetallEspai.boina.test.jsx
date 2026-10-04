/**
 * T6 (ordre del Mestre, 261004, prompt 261004_0515 §5) · La pàgina d'una
 * utilitat del node (DetallAplicacio) signa Sóc de Poble, el sistema, i la
 * boina de la barra taronja porta a la pàgina del projecte. Llei del Píxel:
 * el nom, el poble («Utilitat d'este node») i l'avatar no canvien.
 */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: () => {}, t: (_, alternativa) => alternativa,
  identitat: { actor: { tipus: 'persona', id: 'U', nom: 'Pep' } },
  core: { status: 'ready', towns: [] }, media: { status: 'ready', mediaItems: [] },
  mur: { status: 'ready', feedPosts: [], events: [], marketItems: [] }
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: () => {} }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: { id: 'U' } }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => mocks.media }));

import { DetallAplicacio } from './DetallEspai.jsx';
import { APLICACIONS, aplicacionsValides } from './aplicacions.js';
import { RUTA_PROJECTE } from '../../config/navigation.js';

afterEach(cleanup);

describe('T6 · la barra taronja d’una utilitat del node', () => {
  test('signa Sóc de Poble i porta a la pàgina del projecte', () => {
    const [aplicacio] = aplicacionsValides(APLICACIONS);
    const { container } = render(<DetallAplicacio aplicacio={aplicacio} />);
    const autor = container.querySelector('section.bar-orange .sp-card-author');
    expect(autor.matches('a.sp-card-author-link')).toBe(true);
    expect(autor.getAttribute('href')).toBe(RUTA_PROJECTE);
    expect(autor.querySelector('.sp-card-author-name').textContent).toBe('Sóc de Poble');
    expect(autor.querySelector('.sp-card-author-location').textContent).toBe('Utilitat d’este node');
  });
});
