/**
 * P0-25 / IDEA-96 (Onada R6, Bloc 1; ordre del Mestre: fora les Cards «Ja
 * publicat al Mur» de /notes) · Deroga l'Esmena 2 del pla 261007_1645 dins del
 * Bloc: cap lectura de PublicacioDetall (publicació ni pàgina del sistema)
 * pinta el peu de l'històric de l'actor (PublicacionsDeLActor). L'històric
 * continua al perfil i al Mur.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, render, screen } from '@testing-library/react';
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

describe('el peu de PublicacioDetall (P0-25: fora)', () => {
  test('la Samarreta oberta amb altres productes de l’actor: cap regió «Ja publicat al Mercat» ni cap Card', () => {
    const { container } = render(<PublicacioDetall item={publicacioComANota(SAMARRETA, 'mercat')} />);
    expect(screen.queryByRole('region', { name: 'Ja publicat al Mercat' })).toBeNull();
    expect(container.querySelector('.sdp-pagina-peu')).toBeNull();
    expect(container.querySelector('.sp-card-title')).toBeNull();
    /* L'article i la capçalera continuen sent els de la Samarreta. */
    expect(container.querySelector('header.page-title h1').textContent).toContain('Samarreta Sóc de Poble');
  });

  test.each([
    ['el Foraster (el convidat, amb id)', { tipus: 'persona', id: '00000000-0000-4000-8000-0000000c0f1d', rol: 'convidat' }],
    ['sense actor', null]
  ])('%s: cap peu ni cap regió fantasma', (_cas, actor) => {
    mocks.identitat = { actor };
    const { container } = render(<PublicacioDetall item={publicacioComANota(SAMARRETA, 'mercat')} />);
    expect(container.querySelector('.sdp-pagina-peu')).toBeNull();
  });

  test('una publicació de Multimèdia: cap peu (el DOM de sempre)', () => {
    const { container } = render(<PublicacioDetall item={publicacioComANota({ id: 'foto', title: 'Foto', src: '/assets/foto.jpg', author_org_id: ENTITAT_PILOT_ID }, 'multimedia')} />);
    expect(container.querySelector('.sdp-pagina-peu')).toBeNull();
  });

  test('el codi del lector ja no munta PublicacionsDeLActor ni la ranura del peu', () => {
    const codi = readFileSync(path.join(process.cwd(), 'src/sections/notes/PublicacioDetall.jsx'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(codi).not.toMatch(/<PublicacionsDeLActor\b/);
    expect(codi).not.toMatch(/peuDePagina/);
    expect(codi).not.toMatch(/useVeuHistoric|titolDeLHistoric/);
  });
});
