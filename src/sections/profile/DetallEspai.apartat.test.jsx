/* P0-74 (R16-I) · En canviar d'apartat d'Administració, la pàgina comença a dalt: el contenidor que
   fa scroll (.sdp-universal-page-container) és un altre, nou; dins del mateix apartat no es torna a
   muntar (un canvi de dades no el porta a dalt). */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => () => {},
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children),
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: () => {} }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_key, fallback) => fallback }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: { id: 'U' } }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: { tipus: 'persona', id: 'U', nom: 'Persona' } }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ status: 'ready', feedPosts: [], events: [], marketItems: [] }) }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', towns: [] }) }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ status: 'ready', mediaItems: [] }) }));

import { DetallAdministracio } from './DetallEspai.jsx';
import { itemsDAdministracioSistema } from './perfilModel.js';

afterEach(cleanup);

const apartat = (id) => itemsDAdministracioSistema().find((x) => x.id === id);
const desplacador = (container) => container.querySelector('.sdp-universal-page-container');

describe('P0-74 · cada apartat d’Administració s’obri a dalt', () => {
  test('d’un apartat a un altre, el contenidor que fa scroll és nou i no hereta el desplaçament', () => {
    const { container, rerender } = render(<DetallAdministracio item={apartat('admin-crom')}><p>Crom</p></DetallAdministracio>);
    const abans = desplacador(container);
    abans.scrollTop = 900;
    expect(abans.scrollTop).toBe(900);

    rerender(<DetallAdministracio item={apartat('admin-empaquetats')}><p>Empaquetats</p></DetallAdministracio>);
    const despres = desplacador(container);

    expect(despres).not.toBe(abans);
    expect(abans.isConnected).toBe(false);
    expect(despres.scrollTop).toBe(0);
    expect(container.querySelector('h1').textContent).toBe(apartat('admin-empaquetats').title);
    expect(container.textContent).toContain('Empaquetats');
    expect(container.textContent).not.toContain('Crom');
  });

  test('dins del mateix apartat, tornar a pintar no torna a muntar el contenidor', () => {
    const { container, rerender } = render(<DetallAdministracio item={apartat('admin-empaquetats')}><p>v1</p></DetallAdministracio>);
    const abans = desplacador(container);

    rerender(<DetallAdministracio item={{ ...apartat('admin-empaquetats') }}><p>v2</p></DetallAdministracio>);

    expect(desplacador(container)).toBe(abans);
    expect(container.textContent).toContain('v2');
  });
});
