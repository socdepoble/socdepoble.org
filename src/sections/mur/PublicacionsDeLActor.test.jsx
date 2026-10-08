/**
 * Esmena 2 del pla 261007_1645 (ordre del Mestre, 261007: «En seleccionar la
 * carpeta 'Mur' o 'Mercat' i el perfil 'Sóc de Poble', la part inferior de la
 * nota hauria de llistar totes les notícies/productes ja publicades en eixe
 * context per al perfil actiu») · PublicacionsDeLActor:
 *  · mentre el Mur carrega, el Carregant; si falla, l'Alerta amb «Torna-ho a
 *    provar» (el refresh del Mur); sense cap element, el text buit;
 *  · al Mercat, la targeta de /mercat (TargetaDelMercat), la mateixa al píxel,
 *    que porta a /mercat/samarreta-socdepoble;
 *  · als Esdeveniments, la targeta del Mur (TargetaDelMur) amb l'Aplec;
 *  · sense actor, amb el Foraster (el convidat, que porta id) o en una
 *    secció sense històric, res;
 *  · si peta una targeta o el càlcul de les dades, l'Alerta de la regió.
 */
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), identitat: null, mur: null }));
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
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('./MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', towns: [] }) }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ status: 'ready', mediaItems: [] }) }));
/* Revisió adversarial del 261007 · Un acte malformat que fa petar el model de
   l'acte dins del càlcul de les dades (el hook), no dins de la targeta. La
   resta d'actes, el model de sempre. */
vi.mock('./agendaMur.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    acteAEsdeveniment: (acte, ...resta) => {
      if (acte?.id === 'acte-malformat') throw new Error('acte malformat');
      return real.acteAEsdeveniment(acte, ...resta);
    }
  };
});

import { PublicacionsDeLActor, VistaPublicacionsDeLActor } from './PublicacionsDeLActor.jsx';
import MercatSection from '../mercat/MercatSection.jsx';
import { MARKET_ITEMS } from '../mercat/marketContent.js';
import { EVENTS } from './eventsContent.js';
import { ENTITAT_PILOT_ID } from '../../data/identitatsSeed.js';

const SAMARRETA = MARKET_ITEMS.find((item) => item.id === 'samarreta-socdepoble');
const APLEC = EVENTS.find((item) => item.id === 'aplec-2023');
/* El Foraster de veres: sense sessió, IdentitatContext hi posa la persona
   convidada, amb l'id de convidat (mai buit) i rol 'convidat'. */
const FORASTER = Object.freeze({ tipus: 'persona', id: '00000000-0000-4000-8000-0000000c0f1d', rol: 'convidat' });
/* Els ids que React genera canvien d'una pintada a l'altra: no són píxels. */
const senseIds = (html) => html.replace(/\s(?:id|for|aria-controls|aria-labelledby|aria-describedby)="[^"]*"/g, '');

beforeEach(() => {
  vi.clearAllMocks();
  mocks.identitat = { actor: { tipus: 'entitat', id: ENTITAT_PILOT_ID } };
  mocks.mur = { status: 'ready', error: null, refresh: vi.fn(), sortedFeedPosts: [], sortedMarketItems: MARKET_ITEMS, sortedEvents: EVENTS };
});
afterEach(cleanup);

describe('els estats', () => {
  test('mentre el Mur carrega: la capçalera i el Carregant, no el buit', () => {
    mocks.mur = { status: 'loading' };
    render(<PublicacionsDeLActor seccio="mur" />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Ja publicat al Mur');
    expect(screen.getByRole('status').textContent).toBe('Carregant les publicacions…');
    expect(screen.queryByText(/encara no hi ha res publicat/)).toBeNull();
  });

  test('si el Mur falla: l’Alerta d’error, i «Torna-ho a provar» crida el refresh del Mur', () => {
    const refresh = vi.fn();
    mocks.mur = { status: 'error', error: { status: 500 }, refresh };
    render(<PublicacionsDeLActor seccio="mercat" />);
    expect(screen.getByText('No s’han pogut carregar les publicacions')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Torna-ho a provar' }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  test('sense cap publicació: el text buit, amb role=status', () => {
    render(<PublicacionsDeLActor seccio="mur" />);
    expect(screen.getByRole('status').textContent).toBe('Amb esta identitat encara no hi ha res publicat al Mur.');
    expect(document.querySelector('.sdp-card-grid')).toBeNull();
  });

  test('si una targeta peta (un element malformat): la regió ho diu amb «Torna-ho a provar» i la resta continua', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    /* React, en desenvolupament, torna a llançar l'error dins d'un esdeveniment
       de jsdom: es dona per atés perquè no isca com a error sense capturar. */
    const atesa = (event) => event.preventDefault();
    window.addEventListener('error', atesa);
    mocks.mur = { status: 'ready', sortedFeedPosts: [{ id: 'trencat', type: 'post', title: { no: 'és un text' }, author_org_id: ENTITAT_PILOT_ID }] };
    render(<><p>La pàgina de damunt</p><PublicacionsDeLActor seccio="mur" /></>);
    window.removeEventListener('error', atesa);
    expect(screen.getByText('La pàgina de damunt')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Ja publicat al Mur');
    const alerta = screen.getByRole('alert');
    expect(within(alerta).getByText('No s’han pogut carregar les publicacions')).toBeTruthy();
    expect(within(alerta).getByRole('button', { name: 'Torna-ho a provar' })).toBeTruthy();
    errors.mockRestore();
  });

  /* Revisió adversarial del 261007 · El càlcul de les dades també és dins de
     la barrera: abans el hook es cridava fora i l'error s'enduia la pàgina. */
  test('si el càlcul de les dades peta (un acte malformat): la regió ho diu i la resta continua', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const atesa = (event) => event.preventDefault();
    window.addEventListener('error', atesa);
    mocks.mur = { status: 'ready', sortedEvents: [{ id: 'acte-malformat', type: 'event', title: 'Acte', author_org_id: ENTITAT_PILOT_ID }] };
    render(<><p>La pàgina de damunt</p><PublicacionsDeLActor seccio="events" /></>);
    window.removeEventListener('error', atesa);
    expect(screen.getByText('La pàgina de damunt')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Ja publicat a Esdeveniments');
    const alerta = screen.getByRole('alert');
    expect(within(alerta).getByText('No s’han pogut carregar les publicacions')).toBeTruthy();
    expect(within(alerta).getByRole('button', { name: 'Torna-ho a provar' })).toBeTruthy();
    errors.mockRestore();
  });

  /* Decisió per defecte del Mestre (261007) · el Foraster no veu cap
     històric. El Foraster de veres porta id (el del convidat): abans
     `Boolean(actor?.id)` el deixava passar i la regió es pintava. */
  test('el Foraster (la persona convidada, amb id): res, ni la capçalera', () => {
    mocks.identitat = { actor: FORASTER };
    mocks.mur = { ...mocks.mur, sortedFeedPosts: [{ id: 'del-convidat', type: 'post', title: 'Del convidat', author_id: FORASTER.id, created_at: '2026-10-06T10:00:00Z' }] };
    expect(render(<PublicacionsDeLActor seccio="mur" />).container.innerHTML).toBe('');
    cleanup();
    expect(render(<PublicacionsDeLActor seccio="mercat" />).container.innerHTML).toBe('');
  });

  test('sense actor o en una secció sense històric: res', () => {
    mocks.identitat = { actor: null };
    expect(render(<PublicacionsDeLActor seccio="mercat" />).container.innerHTML).toBe('');
    cleanup();
    mocks.identitat = { actor: { tipus: 'entitat', id: ENTITAT_PILOT_ID } };
    expect(render(<PublicacionsDeLActor seccio="multimedia" />).container.innerHTML).toBe('');
  });
});

describe('les targetes canòniques', () => {
  test('Mercat: la targeta de /mercat, la mateixa al píxel, que porta a /mercat/samarreta-socdepoble', () => {
    const historic = render(<PublicacionsDeLActor seccio="mercat" />).container;
    const graella = historic.querySelector('.sdp-card-grid');
    const targetes = [...graella.querySelectorAll('article.sp-card')];
    expect(targetes).toHaveLength(1);
    expect(targetes[0].querySelector('.sp-card-link-overlay').getAttribute('href')).toBe('/mercat/samarreta-socdepoble');
    expect(targetes[0].querySelector('.sp-card-title').textContent).toBe(SAMARRETA.title);
    /* La del Mac Mini (de Javi) no és de l'entitat. */
    expect(historic.textContent).not.toContain('Mac Mini');
    mocks.mur = { status: 'ready', sortedMarketItems: [SAMARRETA] };
    const mercat = render(<MercatSection />).container.querySelector('.sdp-card-grid article.sp-card');
    expect(senseIds(targetes[0].outerHTML)).toBe(senseIds(mercat.outerHTML));
  });

  test('sense l’element obert: la Samarreta oberta no es repetix davall', () => {
    render(<PublicacionsDeLActor seccio="mercat" exclouId="samarreta-socdepoble" />);
    expect(screen.getByRole('status').textContent).toBe('Amb esta identitat encara no hi ha res publicat al Mercat.');
  });

  test('Esdeveniments: la targeta del Mur amb l’Aplec', () => {
    const arrel = render(<PublicacionsDeLActor seccio="events" />).container;
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Ja publicat a Esdeveniments');
    const targetes = arrel.querySelectorAll('.sdp-card-grid > *');
    expect(targetes).toHaveLength(1);
    expect(within(targetes[0]).getByText(APLEC.title)).toBeTruthy();
  });

  test('la vista accepta un altre nivell de capçalera (el catàleg) i torna a h2 amb un de dolent', () => {
    render(<VistaPublicacionsDeLActor seccio="mur" elements={[]} nivell="h4" />);
    expect(screen.getByRole('heading', { level: 4 }).textContent).toBe('Ja publicat al Mur');
    cleanup();
    render(<VistaPublicacionsDeLActor seccio="mur" elements={[]} nivell="div" />);
    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
  });
});
