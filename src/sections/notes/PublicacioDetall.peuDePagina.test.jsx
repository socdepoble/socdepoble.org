/**
 * Esmena 2 del pla 261007_1645 (ordre del Mestre, 261007: «En seleccionar la
 * carpeta 'Mur' o 'Mercat' i el perfil 'Sóc de Poble', la part inferior de la
 * nota hauria de llistar totes les notícies/productes ja publicades en eixe
 * context per al perfil actiu») · A Notes > Mercat, amb Sóc de Poble, el que
 * s'obri primer és la Samarreta (PublicacioDetall), no una nota. Davall d'ella,
 * fora de l'article, la regió «Ja publicat al Mercat» amb la resta de
 * productes de l'entitat i sense la Samarreta oberta. Multimèdia no en té, i
 * el Foraster tampoc (decisió per defecte del Mestre, 261007).
 */
import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: () => {}, t: (_, alternativa) => alternativa,
  identitat: null, core: { status: 'ready', towns: [] }, media: { status: 'ready', mediaItems: [] }, mur: null
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
import { MARKET_ITEMS } from '../mercat/marketContent.js';
import { ENTITAT_PILOT_ID } from '../../data/identitatsSeed.js';

const SAMARRETA = MARKET_ITEMS.find((item) => item.id === 'samarreta-socdepoble');
const TASSA = { ...SAMARRETA, id: 'tassa-socdepoble', title: 'Tassa Sóc de Poble', images: [], created_at: '2026-10-01T10:00:00Z' };

beforeEach(() => {
  mocks.identitat = { actor: { tipus: 'entitat', id: ENTITAT_PILOT_ID } };
  mocks.mur = { status: 'ready', refresh: vi.fn(), sortedFeedPosts: [], sortedMarketItems: [...MARKET_ITEMS, TASSA], sortedEvents: [] };
});
afterEach(cleanup);

describe('el peu de PublicacioDetall', () => {
  test('la Samarreta oberta: «Ja publicat al Mercat» davall, fora de l’article, amb la Tassa i sense la Samarreta', () => {
    const { container } = render(<PublicacioDetall item={publicacioComANota(SAMARRETA, 'mercat')} />);
    const peu = screen.getByRole('region', { name: 'Ja publicat al Mercat' });
    expect(peu.className).toBe('sdp-pagina-peu');
    expect(peu.closest('article')).toBeNull();
    const pagina = container.querySelector('.sdp-universal-page-container');
    expect(pagina.lastElementChild).toBe(peu);
    expect(within(peu).getByRole('heading', { level: 2 }).textContent).toBe('Ja publicat al Mercat');
    const titols = [...peu.querySelectorAll('.sp-card-title')].map((titol) => titol.textContent);
    expect(titols).toEqual(['Tassa Sóc de Poble']);
    expect(peu.querySelector('.sp-card-link-overlay').getAttribute('href')).toBe('/mercat/tassa-socdepoble');
    /* L'article i la capçalera de la pàgina continuen sent els de la Samarreta. */
    expect(container.querySelector('header.page-title h1').textContent).toContain('Samarreta Sóc de Poble');
  });

  test('sense cap altra publicació de l’actor: la regió amb el text buit', () => {
    mocks.mur = { ...mocks.mur, sortedMarketItems: MARKET_ITEMS };
    render(<PublicacioDetall item={publicacioComANota(SAMARRETA, 'mercat')} />);
    const peu = screen.getByRole('region', { name: 'Ja publicat al Mercat' });
    expect(within(peu).getByRole('status').textContent).toBe('Amb esta identitat encara no hi ha res publicat al Mercat.');
  });

  /* Decisió per defecte del Mestre (261007) · el Foraster no veu cap
     històric. Revisió adversarial del 261007 · Abans PublicacioDetall posava
     el peu sense guarda d'actor i PageFrame pintava la regió buida, amb nom i
     coixí. El Foraster de veres porta id (el del convidat). */
  test.each([
    ['el Foraster (el convidat, amb id)', { tipus: 'persona', id: '00000000-0000-4000-8000-0000000c0f1d', rol: 'convidat' }],
    ['sense actor', null]
  ])('%s: cap peu ni cap regió fantasma', (_cas, actor) => {
    mocks.identitat = { actor };
    const { container } = render(<PublicacioDetall item={publicacioComANota(SAMARRETA, 'mercat')} />);
    expect(container.querySelector('.sdp-pagina-peu')).toBeNull();
    expect(screen.queryByRole('region', { name: 'Ja publicat al Mercat' })).toBeNull();
  });

  test('una publicació de Multimèdia: cap peu (el DOM de sempre)', () => {
    const { container } = render(<PublicacioDetall item={publicacioComANota({ id: 'foto', title: 'Foto', src: '/assets/foto.jpg', author_org_id: ENTITAT_PILOT_ID }, 'multimedia')} />);
    expect(container.querySelector('.sdp-pagina-peu')).toBeNull();
  });
});
