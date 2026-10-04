/**
 * Norma del Mestre, 261004 (prompt 261004_1108, línies 63-69 i T2) · Una
 * publicació pròpia vista des del MAS (PublicacioDetall): si la signa una
 * persona (o la IA), per identificador, la capçalera porta el seu avatar redó
 * davant de l'H1, el mateix de la boina; l'entitat del projecte, el seu
 * logotip (la boina va a /projecte). Mai el logotip de Sóc de Poble a una
 * persona.
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
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: mocks.t }),
  /* Sense UIProvider: fora de l'app, cap crida al port. */
  useUIState: () => { throw new Error('fora de l’app'); }
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: { id: 'U' } }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => mocks.media }));

import { PublicacioDetall } from './PublicacioDetall.jsx';
import { publicacioComANota } from './masDeLUsuari.js';

const CREAT = '2026-09-20T09:15:00Z';
function pinta(item, seccio = 'mur') {
  return render(<PublicacioDetall item={publicacioComANota({ created_at: CREAT, ...item }, seccio)} />).container;
}
const fills = (container) => [...container.querySelector('header.page-title').children].map((e) => `${e.tagName}.${e.className}`);

afterEach(cleanup);

describe('la capçalera de PublicacioDetall la decidix qui signa', () => {
  test('una persona: el seu avatar redó (el de la boina) davant de l’H1, sense logotip', () => {
    const container = pinta({ id: 'mac', title: 'Mac', author_name: 'Javi', owner_user_id: 'javillinares', author_avatar: '/assets/javi.png' }, 'mercat');
    expect(fills(container).slice(0, 2)).toEqual(['DIV.page-title-avatar', 'H1.']);
    const img = container.querySelector('header.page-title img.page-title-avatar__imatge');
    expect(img.getAttribute('src')).toBe('/assets/javi.png');
    expect(img.getAttribute('alt')).toBe('Avatar de Javi');
    expect(container.querySelector('.page-title-logo')).toBeNull();
  });

  test('l’entitat del projecte (per identificador): el seu logotip, cap avatar', () => {
    const container = pinta({ id: 'samarreta', title: 'Samarreta', seller: 'Sóc de Poble', author_entity_id: 'socdepoble', avatar_url: '/assets/quadrat.svg' }, 'mercat');
    expect(fills(container).slice(0, 3)).toEqual(['IMG.page-title-logo light-only', 'IMG.page-title-logo dark-only', 'H1.']);
    expect(container.querySelector('.page-title-avatar')).toBeNull();
  });

  /* Correcció dels verificadors (ordre del Mestre, 261004) · L'avatar de
     capçalera és el de la identitat (author_avatar), mai l'avatar_url de
     l'element: al Mercat porta la marca de Sóc de Poble. */
  test('una persona amb només avatar_url (la marca de Sóc de Poble): ni avatar ni logotip', () => {
    const marca = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
    const container = pinta({ id: 'mac', title: 'Mac', seller: 'Mestre Poble', author_id: 'mestre-obres', avatar_url: marca }, 'mercat');
    expect(fills(container)[0]).toBe('H1.');
    expect(container.querySelector('.page-title-avatar')).toBeNull();
    expect(container.querySelector('.page-title-logo')).toBeNull();
    const srcs = [...container.querySelectorAll('header.page-title img')].map((img) => img.getAttribute('src'));
    expect(srcs).not.toContain(marca);
  });

  test('una persona amb una foto a avatar_url però sense author_avatar: cap avatar de capçalera', () => {
    const container = pinta({ id: 'cadira', title: 'Cadira', author_name: 'Pepa', owner_user_id: 'u-1', avatar_url: '/assets/cadira.png' }, 'mercat');
    expect(fills(container)[0]).toBe('H1.');
  });

  test('un nom sense identitat coneguda: ni avatar ni logotip (no s’endevina pel nom)', () => {
    const container = pinta({ id: 'cistella', title: 'Cistella', seller: 'Pepa', avatar_url: '/assets/pepa.png' }, 'mercat');
    expect(fills(container)[0]).toBe('H1.');
  });
});
