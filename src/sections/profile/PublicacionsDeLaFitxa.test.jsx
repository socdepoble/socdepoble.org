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
    /* La regió amb nom és la del peu de PageFrame (FitxaPublica): ací van les pestanyes sense h2 redundant. */
    expect(screen.queryByRole('heading', { level: 2, name: 'El que publica Forn de la Plaça' })).toBeNull();
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
    expect(textos.seccions.connectats.etiqueta).toBe('El que connecta');
    expect(textos.seccions.connectats.vista.buit).toBe('Colla de la Serra encara no connecta amb cap poble o col·lectiu públic.');
  });

  test('IDEA-25 · si es passa connectats, renderitza la pestanya «El que connecta» i la llista d’entitats', () => {
    render(
      <PublicacionsDeLaFitxa
        perfil={FORN}
        connectats={[{ tipus: 'entitat', id: 'cooperativa', nom: 'Cooperativa Agrícola', ruta: '/entitat/cooperativa' }]}
      />
    );
    const pestanya = screen.getByRole('tab', { name: 'El que connecta' });
    fireEvent.click(pestanya);
    expect(screen.getByRole('link', { name: 'Cooperativa Agrícola' }).getAttribute('href')).toBe('/entitat/cooperativa');
  });

  /* Marató 261101_2143 (B4, IDEA-25) · Regressió: abans tornava a /entitat/<id>, una ruta que
     l'App no té (App.jsx: /gent, /empresa, /grup, /ajuntament i /perfil). Ara, la fitxa pública
     del seu tipus (rutaDePerfil), i sense id cap destí inventat. */
  test('IDEA-25 · una ruta que no és interna no ix a l’enllaç: torna a la fitxa pública del seu tipus', () => {
    render(
      <PublicacionsDeLaFitxa
        perfil={FORN}
        connectats={[
          { tipus: 'entitat', id: 'forn', nom: 'Fora', ruta: 'javascript:alert(1)' },
          { tipus: 'entitat', id: 'altre', nom: 'Altre', ruta: '//evil.example/x' },
          { tipus: 'grup', id: 'colla', nom: 'Colla', ruta: '/grup/colla\\x' },
          { tipus: 'persona', id: 'u-pepa', nom: 'Pepa' },
          { id: 'sense tipus', nom: 'Sense tipus' },
          { tipus: 'grup', nom: 'Sense id' }
        ]}
      />
    );
    fireEvent.click(screen.getByRole('tab', { name: 'El que connecta' }));
    const enllacos = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(enllacos.some((href) => href.startsWith('/entitat/'))).toBe(false);
    expect(screen.getByRole('link', { name: 'Fora' }).getAttribute('href')).toBe('/empresa/forn');
    expect(screen.getByRole('link', { name: 'Altre' }).getAttribute('href')).toBe('/empresa/altre');
    expect(screen.getByRole('link', { name: 'Colla' }).getAttribute('href')).toBe('/grup/colla');
    expect(screen.getByRole('link', { name: 'Pepa' }).getAttribute('href')).toBe('/gent/u-pepa');
    expect(screen.getByRole('link', { name: 'Sense tipus' }).getAttribute('href')).toBe('/empresa/sense%20tipus');
    // Sense id: el nom, sense cap enllaç (ni «/entitat/undefined»).
    expect(screen.getByText('Sense id').hasAttribute('href')).toBe(false);
    expect(screen.queryByRole('link', { name: 'Sense id' })).toBeNull();
  });

  /* Correcció ARB-01 (marató 261101_2143, B4) · Un tipus que no té fitxa pública (un poble, una
     «organitzacio» sense normalitzar) no cau a /gent/<id>, la fitxa d'una persona: es queda sense
     enllaç fins que D-B4-2 en decidisca la font i la ruta. «empresa» és l'àlies d'entitat de
     rutaDePerfil i objecteDePerfil. Una ruta interna de les dades continua manant. */
  test('IDEA-25 · un tipus sense fitxa pública no porta cap enllaç inventat', () => {
    render(
      <PublicacionsDeLaFitxa
        perfil={FORN}
        connectats={[
          { tipus: 'poble', id: 'la-torre', nom: 'La Torre' },
          { tipus: 'organitzacio', id: 'coop', nom: 'Coop' },
          { tipus: 'persona ', id: 'u-espai', nom: 'Amb espai' },
          { tipus: 'empresa', id: 'forn', nom: 'Empresa' },
          { tipus: 'ia', id: 'iaia-maria', nom: 'IAIA' },
          { tipus: 'poble', id: 'la-vila', nom: 'La Vila', ruta: '/pobles' }
        ]}
      />
    );
    fireEvent.click(screen.getByRole('tab', { name: 'El que connecta' }));
    const enllacos = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(enllacos.some((href) => href.startsWith('/gent/'))).toBe(false);
    for (const nom of ['La Torre', 'Coop', 'Amb espai']) {
      expect(screen.getByText(nom).hasAttribute('href')).toBe(false);
      expect(screen.queryByRole('link', { name: nom })).toBeNull();
    }
    expect(screen.getByRole('link', { name: 'Empresa' }).getAttribute('href')).toBe('/empresa/forn');
    expect(screen.getByRole('link', { name: 'IAIA' }).getAttribute('href')).toBe('/perfil/iaia-maria');
    expect(screen.getByRole('link', { name: 'La Vila' }).getAttribute('href')).toBe('/pobles');
  });
});
