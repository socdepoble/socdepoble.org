/**
 * P1-11 (pla 261024_2230, T5B-02; C11-04 de Codex i G2230-02 de Gemini) ·
 * L'aparador al peu de la fitxa pública: el que la identitat VISITADA (no
 * l'actor actiu) ha publicat al Mur, al Mercat i a l'Agenda, amb el DTO de
 * l'històric ({ id, item, esdeveniment }) i les targetes canòniques. Els
 * àlies, mai pel slug; una persona i una entitat amb el mateix id no es
 * barregen; una IA no en porta; i cap botó de seguir.
 */
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ mur: null }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({
  useCoreContent: () => ({ status: 'ready', refresh: () => {}, pageCopy: {}, towns: [], pages: [], agents: [] })
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_clau, reserva) => reserva }),
  useUIState: () => ({ externalConfig: { dataMode: 'seed' }, locale: 'ca-ES' })
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));

import { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG, PERSONA_PILOT } from '../../data/identitatsSeed.js';
import { oblidaEntitatDelProjecte, registraEntitatDelProjecte } from '../../config/navigation.js';
import { PublicacionsDeLaFitxa, textosDeLAparador } from './PublicacionsDeLaFitxa.jsx';
import { aliesDeLaFitxa, teAparador, tipusAutorDeLaFitxa } from './usePublicacionsDeLaFitxa.js';

const FORN = Object.freeze({ tipus: 'entitat', id: 'org-forn', slug: 'forn', nom: 'Forn de la Plaça' });
const PEPA = Object.freeze({ tipus: 'persona', id: 'u-pepa', slug: 'pepa', nom: 'Pepa' });

const POSTS = [
  { id: 'p-forn', type: 'post', title: 'Coca de llanda', author_org_id: 'org-forn', created_at: '2026-10-06T10:00:00Z' },
  { id: 'p-pepa', type: 'post', title: 'De la Pepa', author_id: 'u-pepa', created_at: '2026-10-05T10:00:00Z' },
  /* Una persona amb el mateix id que l'entitat: no és el Forn. */
  { id: 'p-homonim', type: 'post', title: 'Homònim', author_id: 'org-forn', created_at: '2026-10-04T10:00:00Z' }
];
const PRODUCTES = [
  { id: 'm-pa', title: 'Pa de llenya', author_org_id: 'org-forn', price: '2 €', created_at: '2026-10-03T10:00:00Z' }
];

beforeEach(() => {
  mocks.mur = { status: 'ready', error: null, refresh: vi.fn(), sortedFeedPosts: POSTS, sortedMarketItems: PRODUCTES, sortedEvents: [] };
});
afterEach(cleanup);

describe('els àlies de la fitxa visitada', () => {
  test('una entitat qualsevol: només el seu id (mai el slug)', () => {
    expect([...aliesDeLaFitxa(FORN)]).toEqual(['org-forn']);
    expect([...aliesDeLaFitxa(PEPA)]).toEqual(['u-pepa']);
  });

  test('una organització que pren el slug del projecte no s’emporta els àlies del projecte', () => {
    const impostora = { tipus: 'entitat', id: '8b0a3c5e-0000-4000-8000-0000000000ff', slug: ENTITAT_PILOT_SLUG, nom: 'Sóc de Poble' };
    expect([...aliesDeLaFitxa(impostora)]).toEqual([impostora.id]);
    /* Una persona amb el slug de la persona pilot, tampoc. */
    expect([...aliesDeLaFitxa({ tipus: 'persona', id: 'u-altra', slug: PERSONA_PILOT.slug })]).toEqual(['u-altra']);
  });

  test('les identitats del Mestre, pel seu id: els àlies que declara la llavor', () => {
    const projecte = aliesDeLaFitxa({ tipus: 'entitat', id: ENTITAT_PILOT_ID });
    expect(projecte.has(ENTITAT_PILOT_SLUG)).toBe(true);
    expect(projecte.has('soc-de-poble_official')).toBe(true);
    const javi = aliesDeLaFitxa({ tipus: 'persona', id: PERSONA_PILOT.id });
    for (const alies of PERSONA_PILOT.alies) expect(javi.has(alies)).toBe(true);
  });

  test('en remot, l’UUID registrat del projecte porta els àlies del projecte (i les pàgines del sistema); un UUID qualsevol, no', () => {
    const UUID = '6f1c2a10-0000-4000-8000-00000000c0de';
    expect(aliesDeLaFitxa({ tipus: 'entitat', id: UUID }).has(ENTITAT_PILOT_SLUG)).toBe(false);
    registraEntitatDelProjecte({ tipus: 'entitat', id: UUID, slug: ENTITAT_PILOT_SLUG });
    const alies = aliesDeLaFitxa({ tipus: 'entitat', id: UUID });
    expect(alies.has(UUID) && alies.has(ENTITAT_PILOT_SLUG) && alies.has(ENTITAT_PILOT_ID)).toBe(true);
    /* Un grup amb el mateix id no és el projecte. */
    expect(aliesDeLaFitxa({ tipus: 'grup', id: UUID }).has(ENTITAT_PILOT_SLUG)).toBe(false);
    oblidaEntitatDelProjecte();
  });

  test('una IA o una fitxa sense id no publiquen', () => {
    expect(aliesDeLaFitxa({ tipus: 'ia', id: 'iaia-maria', esIA: true }).size).toBe(0);
    expect(aliesDeLaFitxa({ tipus: 'persona', id: '' }).size).toBe(0);
    expect(teAparador({ tipus: 'ia', id: 'x' })).toBe(false);
    expect(teAparador({ tipus: 'grup', id: 'g' })).toBe(true);
    expect([tipusAutorDeLaFitxa({ tipus: 'grup' }), tipusAutorDeLaFitxa({ tipus: 'persona' }), tipusAutorDeLaFitxa({ tipus: 'ia' })])
      .toEqual(['entitat', 'persona', null]);
  });
});

describe('l’aparador', () => {
  test('tres pestanyes; s’obri per la primera amb publicacions i pinta la targeta canònica de cada secció', () => {
    render(<PublicacionsDeLaFitxa perfil={FORN} />);
    /* La regió amb nom és la del peu de PageFrame (FitxaPublica): ací, el títol i les pestanyes. */
    expect(screen.getByRole('heading', { level: 2, name: 'El que publica Forn de la Plaça' })).toBeTruthy();
    const regio = document.body;
    expect(screen.getByRole('tablist', { name: 'El que publica Forn de la Plaça' })).toBeTruthy();
    const pestanyes = within(regio).getAllByRole('tab');
    expect(pestanyes.map((p) => p.textContent)).toEqual(['Mur', 'Mercat', 'Agenda']);
    expect(pestanyes[0].getAttribute('aria-selected')).toBe('true');
    const [mur, mercat, agenda] = within(regio).getAllByRole('tabpanel', { hidden: true });
    /* Només el que signa l'entitat: ni la Pepa ni l'homònim persona. */
    expect(within(mur).getByText('Coca de llanda')).toBeTruthy();
    expect(within(mur).queryByText('De la Pepa')).toBeNull();
    expect(within(mur).queryByText('Homònim')).toBeNull();
    expect(within(mercat).getByText('Pa de llenya')).toBeTruthy();
    expect(agenda.textContent).toBe('Forn de la Plaça no té cap acte recent a l’Agenda d’este poble.');
    /* Doctrina del Connectar: cap botó de seguir. */
    expect(regio.textContent).not.toMatch(/Seguir|seguix|Seguidors/);
  });

  test('un comerç que només ven obri pel Mercat; la tria de la persona mana', () => {
    mocks.mur = { ...mocks.mur, sortedFeedPosts: [] };
    render(<PublicacionsDeLaFitxa perfil={FORN} />);
    const pestanyes = screen.getAllByRole('tab');
    expect(pestanyes[1].getAttribute('aria-selected')).toBe('true');
    fireEvent.click(pestanyes[0]);
    expect(pestanyes[0].getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText('Forn de la Plaça no té cap publicació recent al Mur d’este poble.')).toBeTruthy();
  });

  test('una persona veu les seues publicacions (persona), no les de cap entitat', () => {
    render(<PublicacionsDeLaFitxa perfil={PEPA} />);
    expect(screen.getByText('De la Pepa')).toBeTruthy();
    expect(screen.queryByText('Coca de llanda')).toBeNull();
  });

  test('mentre el Mur carrega, el Carregant; si falla, l’error amb «Torna-ho a provar» del Mur', () => {
    mocks.mur = { ...mocks.mur, status: 'loading', sortedFeedPosts: [], sortedMarketItems: [] };
    render(<PublicacionsDeLaFitxa perfil={FORN} />);
    expect(screen.getAllByText('Carregant les publicacions…').length).toBeGreaterThan(0);
    cleanup();
    const refresh = vi.fn();
    mocks.mur = { ...mocks.mur, status: 'error', error: new Error('Supabase 503'), refresh };
    render(<PublicacionsDeLaFitxa perfil={FORN} />);
    const [alerta] = screen.getAllByRole('alert');
    expect(alerta.textContent).toContain('No s’han pogut carregar les publicacions');
    fireEvent.click(within(alerta).getByRole('button', { name: 'Torna-ho a provar' }));
    expect(refresh).toHaveBeenCalled();
  });

  test('fora del Mur de l’App (la reserva de useMur, sense refresh), cap aparador', () => {
    mocks.mur = { status: 'loading', feedPosts: [], events: [], marketItems: [], sortedFeedPosts: [], sortedEvents: [], sortedMarketItems: [] };
    const { container } = render(<PublicacionsDeLaFitxa perfil={FORN} />);
    expect(container.innerHTML).toBe('');
  });

  test('una IA no porta aparador', () => {
    const { container } = render(<PublicacionsDeLaFitxa perfil={{ tipus: 'ia', id: 'iaia-maria', esIA: true, nom: 'IAIA MarIA' }} />);
    expect(container.innerHTML).toBe('');
  });

  test('els textos porten el nom de la fitxa', () => {
    const textos = textosDeLAparador('Colla de la Serra');
    expect(textos.regio).toBe('El que publica Colla de la Serra');
    expect(textos.seccions.mercat.vista.buit).toBe('Colla de la Serra no té res recent a l’aparador del Mercat d’este poble.');
  });
});
