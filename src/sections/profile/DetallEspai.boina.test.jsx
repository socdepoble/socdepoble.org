/**
 * T6 (ordre del Mestre, 261004, prompt 261004_0515 §5) · La pàgina d'una
 * utilitat del node (DetallAplicacio) signa Sóc de Poble, el sistema, i la
 * boina de la barra taronja porta al seu perfil (Onada 8, 261009; abans, a la
 * pàgina del projecte). Llei del Píxel:
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

import { DetallAplicacio, DetallNodes, DetallSenseOrganitzacions } from './DetallEspai.jsx';
import { APLICACIONS, aplicacionsValides } from './aplicacions.js';
import { RUTA_PERFIL_PROJECTE } from '../../config/navigation.js';

afterEach(cleanup);

describe('T6 · la barra taronja d’una utilitat del node', () => {
  /* Onada 8 (261009) · Al perfil de Sóc de Poble, ja no a /projecte. */
  test('signa Sóc de Poble i porta al seu perfil', () => {
    const [aplicacio] = aplicacionsValides(APLICACIONS);
    const { container } = render(<DetallAplicacio aplicacio={aplicacio} />);
    const autor = container.querySelector('section.bar-orange .sp-card-author');
    expect(autor.matches('a.sp-card-author-link')).toBe(true);
    expect(autor.getAttribute('href')).toBe(RUTA_PERFIL_PROJECTE);
    expect(autor.querySelector('.sp-card-author-name').textContent).toBe('Sóc de Poble');
    expect(autor.querySelector('.sp-card-author-location').textContent).toBe('Utilitat d’este node');
  });

  /* Design Guard (marató del 261007, Llei del Píxel) · El contenidor del botó
     del Panell ja no porta estil en línia: el seu marge (un token inexistent)
     no s'aplicava mai. */
  test('el botó del Panell de Control no porta cap estil en línia', () => {
    const [aplicacio] = aplicacionsValides(APLICACIONS);
    const { getByRole } = render(<DetallAplicacio aplicacio={aplicacio} />);
    const boto = getByRole('button', { name: /Panell de Control/ });
    expect(boto.parentElement.tagName).toBe('DIV');
    expect(boto.parentElement.hasAttribute('style')).toBe(false);
  });
});

/* Ordre del Mestre (261007) · «Quan isquen, les barres taronges han de portar
   a la pàgina de l'autor que l'ha creada». Les pàgines del compte de la
   persona porten a la seua fitxa pública, per l'id de la seua fila. */
describe('261007 · la barra taronja de les pàgines del compte de la persona', () => {
  const persona = { id: 'jo', mena: 'persona', nom: 'Pep', avatar: '', dades: { id: 'U', town_name: 'La Torre' } };
  const autoria = (container) => container.querySelector('section.bar-orange > .sp-card-author');

  test('«Els nodes» i «Grups i empreses» porten a /gent/<id real>, mai a «jo»', () => {
    for (const pagina of [
      <DetallNodes key="nodes" persona={persona} nodes={[]} estat="connectat" etiquetaEstat="Connectat" />,
      <DetallSenseOrganitzacions key="orgs" persona={persona} />,
    ]) {
      const { container } = render(pagina);
      const autor = autoria(container);
      expect(autor.matches('a.sp-card-author-link')).toBe(true);
      expect(autor.getAttribute('href')).toBe('/gent/U');
      expect(autor.querySelector('.sp-card-author-name').textContent).toBe('Pep');
      cleanup();
    }
  });

  test('sense la fila de la persona, l’autoria no enllaça enlloc', () => {
    const { container } = render(<DetallSenseOrganitzacions persona={{ ...persona, dades: { town_name: 'La Torre' } }} />);
    expect(autoria(container).tagName).toBe('DIV');
    expect(container.querySelector('section.bar-orange a')).toBeNull();
  });
});
