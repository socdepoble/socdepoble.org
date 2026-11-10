/**
 * Gauntlet 261016 (Bloc 3; ordre del Mestre: «mostrar clarament el poble de
 * cada persona a la targeta del directori») · Cada targeta del directori
 * (ProfileSection) porta el poble de l'agent a la seua boina (`location`), amb
 * l'avatar de l'agent al costat: mai la silueta de reserva per a una fitxa que
 * té foto. A totes les targetes, per coherència de la graella. Sense poble, el
 * DOM de sempre.
 *
 * I els personatges ANIMAL són IA (data/agentsSeed.js · tipusDAgent): la
 * targeta porta a la seua fitxa d'IA (/perfil/<id>), i la fitxa no canvia.
 * P0-72 / IDEA-203 · El catàleg del paquet ja no en porta cap (només la
 * IAIA és IA), però el contingut remot sí que en pot portar: es proven amb
 * dues fitxes sintètiques de prova, una AI i una ANIMAL.
 */
import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, reserva) => reserva }) }));

import ProfileSection from './ProfileSection.jsx';
import { AGENTS, AGENTS_MAP, tipusDAgent } from '../../data/agentsSeed.js';
import { ETIQUETA_IA } from './fitxaDePerfil.js';

afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); });

const targeta = (arrel, nom) => [...arrel.querySelectorAll('article.sp-card')].find((a) => a.querySelector('.sp-card-title')?.textContent === nom);
/* Expectativa actualitzada a propòsit (P0-72 / IDEA-203, ordre del Mestre del
   09-11-2026: «només la IAIA MarIA com a IA») · Al catàleg del paquet l'única
   IA és la IAIA. Una IA que no és ella (amb l'etiqueta humana «GENT» a la
   fitxa, el cas que vigila la marca d'IA) i un personatge ANIMAL són fitxes
   sintètiques de prova, com les que pot portar el contingut remot. */
const IA_DE_PROVA = Object.freeze({
  id: 'assistent-de-prova', name: 'Assistent de prova', role: 'Rol de prova', type: 'AI', tag: 'GENT',
  town_name: 'Benilloba', avatar_url: '/assets/prova/assistent.webp'
});
const ANIMAL_DE_PROVA = Object.freeze({ ...IA_DE_PROVA, id: 'animal-de-prova', name: 'Animal de prova', type: 'ANIMAL', avatar_url: '/assets/prova/animal.webp' });
const ANIMALS = [ANIMAL_DE_PROVA];
const AMB_PROVES = [...AGENTS, IA_DE_PROVA, ANIMAL_DE_PROVA];
const ASSISTENTS_OFICIALS = ['IAIA MarIA'];

test('cada targeta del catàleg porta el seu poble a la boina, amb el seu avatar i mai la silueta de reserva', () => {
  const { container } = render(<ProfileSection agents={AMB_PROVES} />);
  expect(AGENTS.length).toBeGreaterThan(0);
  for (const agent of AMB_PROVES) {
    const fitxa = targeta(container, agent.name);
    const boina = fitxa.querySelector('header.sp-card-header .sp-card-author');
    expect([agent.name, boina?.querySelector('.sp-card-author-location')?.textContent]).toEqual([agent.name, agent.town_name]);
    expect([agent.name, boina.querySelector('img.sp-card-avatar').getAttribute('src')]).toEqual([agent.name, agent.avatar_url]);
    expect([agent.name, boina.querySelector('.sp-card-avatar--fallback')]).toEqual([agent.name, null]);
    /* La boina no s'inventa cap nom: el de la fitxa ja és el títol. */
    expect([agent.name, boina.querySelector('.sp-card-author-name')]).toEqual([agent.name, null]);
  }
});

/* Directiva de Dignitat Humana (pla 261015_1900) · El poble és l'única
   categoria d'una persona: la seua targeta el porta i continua sense
   categories ni drets. */
test('la targeta d’una persona porta el seu poble, i continua sense categories ni drets', () => {
  const persona = { id: 'pepa', name: 'Pepa', type: 'PERSON', role: 'Forner', tag: 'Veïna', town_name: 'Benilloba', avatar_url: '/assets/pepa.png' };
  const { container } = render(<ProfileSection agents={[persona]} />);
  const fitxa = targeta(container, 'Pepa');
  expect(fitxa.querySelector('.sp-card-author-location').textContent).toBe('Benilloba');
  expect(fitxa.querySelector('.sp-card-labels')).toBeNull();
  expect(fitxa.querySelector('.sp-card-copyright')).toBeNull();
});

test('sense poble, cap boina: el DOM de sempre', () => {
  const sensePoble = { id: 'pepa', name: 'Pepa', type: 'PERSON', role: 'Forner', avatar_url: '/assets/pepa.png' };
  const ambPobleBuit = { ...sensePoble, town_name: '   ' };
  const { container } = render(<ProfileSection agents={[sensePoble]} />);
  expect(targeta(container, 'Pepa').querySelector('header.sp-card-header')).toBeNull();
  const abans = container.innerHTML;
  cleanup();
  expect(render(<ProfileSection agents={[ambPobleBuit]} />).container.innerHTML).toBe(abans);
});

test('un poble sense avatar no s’amaga: la boina porta el poble amb la silueta de qui no té foto', () => {
  const { container } = render(<ProfileSection agents={[{ id: 'pepa', name: 'Pepa', type: 'PERSON', town_name: 'Benilloba' }]} />);
  const boina = targeta(container, 'Pepa').querySelector('.sp-card-author');
  expect(boina.querySelector('.sp-card-author-location').textContent).toBe('Benilloba');
  expect(boina.querySelector('img')).toBeNull();
});

test('els personatges ANIMAL són IA: la targeta porta a la seua fitxa d’IA, i la fitxa no canvia', () => {
  const { container } = render(<ProfileSection agents={AMB_PROVES} />);
  for (const agent of ANIMALS) {
    expect([agent.name, agent.type, tipusDAgent(agent)]).toEqual([agent.name, 'ANIMAL', 'ia']);
    fireEvent.click(targeta(container, agent.name).querySelector('.sp-card-link-overlay'));
    expect(mocks.navigate).toHaveBeenLastCalledWith(`/perfil/${agent.id}`, expect.anything());
  }
  /* Una persona continua anant a /gent, i una entitat a /empresa. */
  fireEvent.click(targeta(container, AGENTS_MAP.JAVI.name).querySelector('.sp-card-link-overlay'));
  expect(mocks.navigate).toHaveBeenLastCalledWith(`/gent/${AGENTS_MAP.JAVI.id}`, expect.anything());
  fireEvent.click(targeta(container, AGENTS_MAP.SOCDEPOBLE.name).querySelector('.sp-card-link-overlay'));
  expect(mocks.navigate).toHaveBeenLastCalledWith(`/empresa/${AGENTS_MAP.SOCDEPOBLE.id}`, expect.anything());
});

/* Gauntlet 261016 (Bloc 3; ordre del Mestre: els personatges ANIMAL i els
   agents són IA «no com a humans», «preservant la seua fitxa») · Al
   directori, una targeta de tipus 'ia' porta la marca d'IA (ETIQUETA_IA), mai
   l'etiqueta humana de la fitxa: l'assistent de prova diu «GENT». Una persona
   o una entitat continuen amb la seua.
   Expectativa actualitzada a propòsit (P0-72 / IDEA-203) · Abans ho provaven
   El Pregoner i L'Acompanyant de Paraula, que ja no són al catàleg. */
const etiquetesDe = (fitxa) => [...fitxa.querySelectorAll('.sp-card-labels > li')].map((li) => li.textContent);

test('les targetes de tipus IA (animals i agents) porten la marca d’IA, mai «GENT»', () => {
  const { container } = render(<ProfileSection agents={AMB_PROVES} />);
  const ia = AMB_PROVES.filter((agent) => tipusDAgent(agent) === 'ia');
  expect(ia.map((agent) => agent.id)).toEqual([AGENTS_MAP.IAIA.id, IA_DE_PROVA.id, ANIMAL_DE_PROVA.id]);
  for (const agent of ia) {
    expect([agent.name, etiquetesDe(targeta(container, agent.name))]).toEqual([agent.name, [ETIQUETA_IA]]);
  }
  expect(etiquetesDe(targeta(container, IA_DE_PROVA.name))).not.toContain(IA_DE_PROVA.tag);
  /* Una entitat continua amb la seua etiqueta; una persona, sense cap (Dignitat Humana). */
  expect(etiquetesDe(targeta(container, AGENTS_MAP.SOCDEPOBLE.name))).toEqual([AGENTS_MAP.SOCDEPOBLE.tag]);
  expect(etiquetesDe(targeta(container, AGENTS_MAP.JAVI.name))).toEqual([]);
});

/* Ordre del Mestre (261021, pla 261021_0015 §12) · Les persones de ficció i
   les identitats fundacionals no entren a les targetes d'IA del directori.
   Expectativa actualitzada a propòsit (P0-72 / IDEA-203, ordre del Mestre del
   09-11-2026) · Dels cinc assistents oficials només es queda la IAIA MarIA. */
test('P0-72 · al directori del paquet, l’única targeta d’IA és la de la IAIA MarIA', () => {
  const { container } = render(<ProfileSection agents={AGENTS} />);
  const ambMarcaDIA = [...container.querySelectorAll('article.sp-card')]
    .filter((fitxa) => etiquetesDe(fitxa).includes(ETIQUETA_IA))
    .map((fitxa) => fitxa.querySelector('.sp-card-title').textContent);
  expect(ambMarcaDIA).toEqual(ASSISTENTS_OFICIALS);
});
