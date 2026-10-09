/**
 * Onada 6 (pla 261009_0245, ítem 5: «La primera vista mostrarà exclusivament
 * totes les targetes creades des d'eixe poble») · El panell «Gent de …»:
 *  · mentre el Mur carrega, el Carregant; si falla, l'error amb «Torna-ho a
 *    provar» (el refresh del Mur); sense cap targeta, el text buit;
 *  · les targetes canòniques de cada secció (TargetaDelMercat per al Mercat,
 *    TargetaDelMur per al Mur i l'Agenda), en l'ordre del Mur, i res més: cap
 *    capçalera;
 *  · el veu també el Foraster (contingut públic del poble);
 *  · si el càlcul de les dades peta, l'Alerta del panell i la resta continua.
 */
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), mur: null }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: {} })
}));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', towns: [] }) }));
/* Un acte malformat que fa petar el model de l'acte dins del càlcul de les
   dades (el hook), com a la prova de l'històric de l'actor. */
vi.mock('../mur/agendaMur.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    acteAEsdeveniment: (acte, ...resta) => {
      if (acte?.id === 'acte-malformat') throw new Error('acte malformat');
      return real.acteAEsdeveniment(acte, ...resta);
    }
  };
});

import { PublicacionsDelPoble } from './PublicacionsDelPoble.jsx';
import { MARKET_ITEMS } from '../mercat/marketContent.js';
import { EVENTS } from '../mur/eventsContent.js';
import { MOCK_TOWNS } from './townsSeed.js';

const TORRE = MOCK_TOWNS.find((town) => town.id === 'la-torre-de-les-macanes');
const SELLA = MOCK_TOWNS.find((town) => town.id === 'sella');

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mur = { status: 'ready', error: null, refresh: vi.fn(), feedPosts: [], marketItems: MARKET_ITEMS, events: EVENTS };
});
afterEach(cleanup);

describe('els estats', () => {
  test('mentre el Mur carrega: el Carregant, no el buit', () => {
    mocks.mur = { ...mocks.mur, status: 'loading', marketItems: [], events: [] };
    render(<PublicacionsDelPoble poble={TORRE} />);
    expect(screen.getByRole('status').textContent).toContain('Carregant les publicacions del poble…');
  });

  test('si el Mur falla: l’error, i «Torna-ho a provar» crida el refresh del Mur', () => {
    mocks.mur = { ...mocks.mur, status: 'error', error: new Error('caigut'), marketItems: [], events: [] };
    render(<PublicacionsDelPoble poble={TORRE} />);
    expect(screen.getByText('No s’han pogut carregar les publicacions del poble')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Torna-ho a provar/ }));
    expect(mocks.mur.refresh).toHaveBeenCalledTimes(1);
  });

  test('sense cap publicació del poble: el text buit, amb role=status', () => {
    render(<PublicacionsDelPoble poble={SELLA} />);
    expect(screen.getByRole('status').textContent).toBe('Encara no hi ha cap publicació des d’este poble.');
  });
});

describe('les targetes', () => {
  test('la Torre de la llavor: la samarreta i el Mac Mini (targeta del Mercat) i l’Aplec (targeta del Mur), i cap capçalera', () => {
    const { container } = render(<PublicacionsDelPoble poble={TORRE} />);
    const targetes = [...container.querySelectorAll('article.sp-card')];
    expect(targetes).toHaveLength(3);
    const titols = targetes.map((targeta) => targeta.querySelector('.sp-card-title').textContent);
    expect(titols).toEqual(expect.arrayContaining(['Samarreta Sóc de Poble', 'Mac Mini Apple M4, 24/512GB', '2n Aplec pel Territori']));
    // Les del Mercat porten a /mercat/:id, com a /mercat.
    const samarreta = targetes.find((targeta) => targeta.querySelector('.sp-card-title').textContent === 'Samarreta Sóc de Poble');
    expect(within(samarreta).getAllByRole('link').some((a) => a.getAttribute('href') === '/mercat/samarreta-socdepoble')).toBe(true);
    expect(container.querySelector('h2')).toBeNull();
  });

  test('un poble inventat: les seues targetes, per nom o per poble_id, i cap d’un altre', () => {
    mocks.mur = {
      ...mocks.mur,
      feedPosts: [
        { id: 'c1', type: 'feed', title: 'Peix fresc', author_location: 'El Campello', created_at: '2026-09-02T10:00:00Z' },
        { id: 'c2', type: 'feed', title: 'Declarada', poble_id: 'el-campello', created_at: '2026-09-03T10:00:00Z' }
      ]
    };
    const { container } = render(<PublicacionsDelPoble poble={{ id: 'el-campello', title: 'El Campello' }} />);
    expect([...container.querySelectorAll('.sp-card-title')].map((e) => e.textContent)).toEqual(['Declarada', 'Peix fresc']);
  });

  test('si el càlcul de les dades peta (un acte malformat): l’Alerta del panell i «Torna-ho a provar»', () => {
    const silenci = vi.spyOn(console, 'error').mockImplementation(() => {});
    /* React, en desenvolupament, torna a llançar l'error dins d'un esdeveniment
       de jsdom: es dona per atés (el patró de PublicacionsDeLActor.test.jsx). */
    const atesa = (event) => event.preventDefault();
    window.addEventListener('error', atesa);
    try {
      mocks.mur = { ...mocks.mur, events: [{ id: 'acte-malformat', type: 'event', title: 'X', author_location: 'La Torre de les Maçanes' }] };
      render(<><p>La pàgina de damunt</p><PublicacionsDelPoble poble={TORRE} /></>);
      expect(screen.getByText('La pàgina de damunt')).not.toBeNull();
      const alerta = screen.getByRole('alert');
      expect(alerta.textContent).toContain('No s’han pogut carregar les publicacions del poble');
      expect(within(alerta).getByRole('button', { name: 'Torna-ho a provar' })).not.toBeNull();
    } finally {
      window.removeEventListener('error', atesa);
      silenci.mockRestore();
    }
  });
});
