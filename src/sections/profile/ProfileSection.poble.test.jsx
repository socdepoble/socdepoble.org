/**
 * R21.5 + Gauntlet 261016 · El directori públic `/perfil` (`Gent i Entitats`)
 * renderitza una reixeta responsiva `sdp-card-grid` amb `UniversalCard` directa
 * (`article.sp-card`), barra taronja completa (avatar + nom enllaçat + poble real +
 * píndola de calendari amb data), Dignitat Humana per a persones (zero etiquetes
 * comercials ni drets), subnavegació centrada amb 3 filtres (`Tots · Persones · Entitats i Grups`)
 * i exclusió d'IA, animals i bots/personatges ficticis obsolets (`11111111-*`), llevat de la
 * IAIA MarIA canònica, l'única IA del Mas.
 *
 * Gauntlet 261016 (Bloc 3; ordre del Mestre: les IA «no com a humans») i Gauntlet R21
 * (regressio_ui_xat-04, honestedat_textos-03) · La targeta de la IAIA MarIA porta la marca
 * d'IA (ETIQUETA_IA, «Intel·ligència artificial»), mai l'etiqueta interna del catàleg
 * («MASTER») ni una d'humana del contingut remot («GENT»).
 */
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), language: 'ca' }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => React.useState(() => new URLSearchParams()),
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, reserva) => reserva, language: mocks.language }) }));

import ProfileSection from './ProfileSection.jsx';
import { AGENTS, AGENTS_MAP, tipusDAgent } from '../../data/agentsSeed.js';
import { filtraAgentsDelDirectori } from '../pobles/SubnavigacioPoblesIGent.jsx';
import { rutaDePerfil } from '../../config/navigation.js';
import { fixaBaseRecursos } from '../../config/assetResolver.js';
import { ETIQUETA_IA } from './fitxaDePerfil.js';

afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); mocks.language = 'ca'; });

const targeta = (arrel, nom) => [...arrel.querySelectorAll('article.sp-card')].find((a) => a.querySelector('.sp-card-title')?.textContent === nom);
const etiquetesDe = (fitxa) => [...fitxa.querySelectorAll('.sp-card-labels > li')].map((li) => li.textContent);

const IA_DE_PROVA = Object.freeze({
  id: 'assistent-de-prova', name: 'Assistent de prova', role: 'Rol de prova', type: 'AI', tag: 'GENT',
  town_name: 'Benilloba', avatar_url: '/assets/prova/assistent.webp'
});
const ANIMAL_DE_PROVA = Object.freeze({
  ...IA_DE_PROVA, id: 'animal-de-prova', name: 'Animal de prova', type: 'ANIMAL', avatar_url: '/assets/prova/animal.webp'
});
const BOT_FICTICI_REMOT = Object.freeze({
  id: '11111111-1111-4111-a111-000000000003',
  personaKey: 'CAPATAS',
  name: 'Andreu Soler',
  type: 'PERSON',
  role: 'Capatàs agrícola',
  town_name: 'La Torre de les Maçanes'
});
const PERSONATGES_OBSOLETS_NOM = Object.freeze([
  { id: 'rem-nano', name: 'Nano Banana', type: 'PERSON', town_name: 'Alcoi' },
  { id: 'rem-pepica', name: 'Pepica la Vall', type: 'PERSON', town_name: 'Cocentaina' },
  { id: 'rem-gall', name: 'Marc (El Gall)', type: 'ANIMAL', town_name: 'Penàguila' }
]);

test('R21.5 · el directori usa sdp-card-grid amb UniversalCard directa, encapçalament Gent i Entitats i barra taronja completa (avatar + nom + poble + data)', () => {
  const { container } = render(<ProfileSection agents={AGENTS} />);
  expect(screen.getByRole('heading', { level: 1, name: 'Gent i Entitats' })).toBeTruthy();
  expect(screen.getByText('Directori de persones, entitats i col·lectius d’este poble')).toBeTruthy();
  expect(container.textContent).not.toMatch(/\bagents\b/i);

  const graella = container.querySelector('.sdp-card-grid');
  expect(graella).not.toBeNull();
  expect(container.querySelector('.feed-grid')).toBeNull();
  const targetes = [...graella.children];
  expect(targetes.length).toBeGreaterThan(0);
  expect(targetes.every((el) => el.matches('article.sp-card'))).toBe(true);

  const humansIEntitats = AGENTS;
  expect(targetes).toHaveLength(humansIEntitats.length);

  for (const agent of humansIEntitats) {
    const fitxa = targeta(container, agent.name);
    const boina = fitxa.querySelector('header.sp-card-header .sp-card-author');
    expect([agent.name, boina?.querySelector('.sp-card-author-name')?.textContent]).toEqual([agent.name, agent.name]);
    expect([agent.name, fitxa.querySelector('header.sp-card-header a.sp-card-author-link')?.getAttribute('href')])
      .toEqual([agent.name, rutaDePerfil(tipusDAgent(agent), agent.id)]);
    expect([agent.name, boina?.querySelector('.sp-card-author-location')?.textContent]).toEqual([agent.name, agent.town_name]);
    expect([agent.name, boina?.querySelector('img.sp-card-avatar')?.getAttribute('src')]).toEqual([agent.name, agent.avatar_url]);
    expect([agent.name, boina?.querySelector('.sp-card-avatar--fallback')]).toEqual([agent.name, null]);
  }

  /* La targeta de Sóc de Poble sempre porta poble real i píndola de calendari amb data (fins i tot si una fila antiga duia town_name: 'Sóc de Poble' i sense created_at). */
  const fitxaSdp = targeta(container, AGENTS_MAP.SOCDEPOBLE.name);
  expect(fitxaSdp.querySelector('.sp-card-author-location')?.textContent).toBe(AGENTS_MAP.SOCDEPOBLE.town_name);
  const pindolaData = fitxaSdp.querySelector('header.sp-card-header .btn-date-time');
  expect(pindolaData).not.toBeNull();
  expect(pindolaData.textContent).toContain('08/09/26');
});

test('R21.5 · si una fila antiga porta town_name "Sóc de Poble" o created_at explícit, la barra taronja normalitza el poble i mostra la data', () => {
  const sdpAntiga = {
    ...AGENTS_MAP.SOCDEPOBLE,
    town_name: 'Sóc de Poble'
  };
  const entitatAmbData = {
    id: 'coop-oli',
    name: 'Cooperativa d’Oli',
    type: 'COMPANY',
    role: 'Almàssera',
    tag: 'AGRICULTURA',
    town_name: 'Benilloba',
    created_at: '2026-10-12T09:30:00Z'
  };
  const { container } = render(<ProfileSection agents={[sdpAntiga, entitatAmbData]} />);

  const fitxaSdp = targeta(container, sdpAntiga.name);
  expect(fitxaSdp.querySelector('.sp-card-author-location')?.textContent).toBe(AGENTS_MAP.SOCDEPOBLE.town_name);
  expect(fitxaSdp.querySelector('header.sp-card-header .btn-date-time')?.textContent).toContain('08/09/26');

  const fitxaCoop = targeta(container, 'Cooperativa d’Oli');
  expect(fitxaCoop.querySelector('.sp-card-author-location')?.textContent).toBe('Benilloba');
  expect(fitxaCoop.querySelector('header.sp-card-header .btn-date-time')?.textContent).toContain('12/10/26');
});

/* Directiva de Dignitat Humana (pla 261015_1900) · El poble és l'única
   localització d'una persona: la seua targeta el porta a la barra taronja i
   continua sense categories comercials ni drets. */
test('la targeta d’una persona porta el seu nom i poble a la barra taronja, sense categories ni drets, i navega a /gent; una entitat navega a /empresa', () => {
  const persona = { id: 'pepa', name: 'Pepa', type: 'PERSON', role: 'Fornera', tag: 'Veïna', town_name: 'Benilloba', avatar_url: '/assets/pepa.png' };
  const { container } = render(<ProfileSection agents={[persona, AGENTS_MAP.SOCDEPOBLE]} />);
  const fitxaPepa = targeta(container, 'Pepa');
  expect(fitxaPepa.querySelector('.sp-card-author-name')?.textContent).toBe('Pepa');
  expect(fitxaPepa.querySelector('.sp-card-author-location')?.textContent).toBe('Benilloba');
  expect(etiquetesDe(fitxaPepa)).toEqual([]);
  expect(fitxaPepa.querySelector('.sp-card-labels')).toBeNull();
  expect(fitxaPepa.querySelector('.sp-card-copyright')).toBeNull();

  const fitxaSdp = targeta(container, AGENTS_MAP.SOCDEPOBLE.name);
  expect(etiquetesDe(fitxaSdp)).toEqual([AGENTS_MAP.SOCDEPOBLE.tag]);

  fireEvent.click(fitxaPepa.querySelector('.sp-card-link-overlay'));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/gent/pepa', expect.anything());
  fireEvent.click(fitxaSdp.querySelector('.sp-card-link-overlay'));
  expect(mocks.navigate).toHaveBeenLastCalledWith(`/empresa/${AGENTS_MAP.SOCDEPOBLE.id}`, expect.anything());
});

test('sense avatar, la barra taronja conserva nom i poble amb la silueta de qui no té foto; un poble en blanc no crea línia buida', () => {
  const senseFoto = { id: 'pepa', name: 'Pepa', type: 'PERSON', town_name: 'Benilloba' };
  const pobleBlanc = { id: 'joan', name: 'Joan', type: 'PERSON', town_name: '   ' };
  const { container } = render(<ProfileSection agents={[senseFoto, pobleBlanc]} />);
  const boinaPepa = targeta(container, 'Pepa').querySelector('.sp-card-author');
  expect(boinaPepa.querySelector('.sp-card-author-name')?.textContent).toBe('Pepa');
  expect(boinaPepa.querySelector('.sp-card-author-location')?.textContent).toBe('Benilloba');
  expect(boinaPepa.querySelector('img')).toBeNull();
  expect(boinaPepa.querySelector('.sp-card-avatar--fallback')).not.toBeNull();

  const boinaJoan = targeta(container, 'Joan').querySelector('.sp-card-author');
  expect(boinaJoan.querySelector('.sp-card-author-name')?.textContent).toBe('Joan');
  expect(boinaJoan.querySelector('.sp-card-author-location').textContent).toBe('Poble no indicat');
});

/* Gauntlet 261016 (Bloc 3; ordre del Mestre: els personatges ANIMAL i els agents
   són IA «no com a humans», «preservant la seua fitxa») · Al directori, la targeta
   d'una IA porta la marca d'IA (ETIQUETA_IA), mai l'etiqueta del catàleg: la IAIA
   del paquet diu «MASTER» i una còpia remota hi pot portar «GENT». La fitxa no
   canvia. Una entitat continua amb la seua etiqueta; una persona, sense cap.
   Expectativa restaurada (Gauntlet R21, regressio_ui_xat-04): R21.5 l'havia
   retirada i la targeta pintava «MASTER». */
test('Gauntlet 261016 · la targeta de la IAIA MarIA porta la marca d’IA, mai «MASTER» ni «GENT»', () => {
  expect(AGENTS_MAP.IAIA.tag).toBe('MASTER');
  expect(tipusDAgent(AGENTS_MAP.IAIA)).toBe('ia');
  const { container } = render(<ProfileSection agents={AGENTS} />);
  expect(etiquetesDe(targeta(container, AGENTS_MAP.IAIA.name))).toEqual([ETIQUETA_IA]);
  expect(ETIQUETA_IA).toBe('Intel·ligència artificial');
  expect(container.textContent).not.toContain('MASTER');
  expect(etiquetesDe(targeta(container, AGENTS_MAP.SOCDEPOBLE.name))).toEqual([AGENTS_MAP.SOCDEPOBLE.tag]);
  expect(etiquetesDe(targeta(container, AGENTS_MAP.JAVI.name))).toEqual([]);
  cleanup();

  const iaiaRemota = { ...AGENTS_MAP.IAIA, tag: 'GENT' };
  const remot = render(<ProfileSection agents={[iaiaRemota]} />).container;
  expect(etiquetesDe(targeta(remot, AGENTS_MAP.IAIA.name))).toEqual([ETIQUETA_IA]);
  expect(remot.textContent).not.toContain('GENT');
});

/* Ordre del Mestre (261021, pla 261021_0015 §12) i P0-72 / IDEA-203 (ordre del
   Mestre del 09-11-2026: «només la IAIA MarIA com a IA») · Al directori del
   paquet, l'única targeta amb la marca d'IA és la de la IAIA MarIA. */
test('P0-72 · al directori del paquet, l’única targeta d’IA és la de la IAIA MarIA', () => {
  const { container } = render(<ProfileSection agents={AGENTS} />);
  const ambMarcaDIA = [...container.querySelectorAll('article.sp-card')]
    .filter((fitxa) => etiquetesDe(fitxa).includes(ETIQUETA_IA))
    .map((fitxa) => fitxa.querySelector('.sp-card-title').textContent);
  expect(ambMarcaDIA).toEqual(['IAIA MarIA']);
});

/* T5 (261001) · Abans ho guardava UniversalCard.recursos.test.jsx sobre
   SectionItemCard, retirada en R21 (Tractor Pedra Seca, LLEI_08): amb base de
   recursos (el connector de WordPress), la foto de la targeta del directori penja
   del paquet, mai d'un '/assets/…' sense resoldre. */
test('T5 · amb base de recursos, la foto de la IAIA al directori penja del paquet', () => {
  const PAQUET = 'https://wp.example/wp-content/plugins/socdepoble-enxufe/dist';
  fixaBaseRecursos(PAQUET);
  try {
    const { container } = render(<ProfileSection agents={[AGENTS_MAP.IAIA]} />);
    const fitxa = targeta(container, AGENTS_MAP.IAIA.name);
    expect(AGENTS_MAP.IAIA.avatar_url.startsWith('/assets/')).toBe(true);
    expect(fitxa.querySelector('img.sp-card-media').getAttribute('src')).toBe(`${PAQUET}${AGENTS_MAP.IAIA.avatar_url}`);
    expect(container.querySelectorAll('img[src^="/assets/"]')).toHaveLength(0);
  } finally {
    fixaBaseRecursos('/');
  }
});

test('R21.6 · no entren IA/animals o IDs històrics acreditats; un nom o prefix coincident no esborra una persona real', () => {
  expect(tipusDAgent(IA_DE_PROVA)).toBe('ia');
  expect(tipusDAgent(ANIMAL_DE_PROVA)).toBe('ia');

  const barreja = [
    ...AGENTS,
    IA_DE_PROVA,
    ANIMAL_DE_PROVA,
    BOT_FICTICI_REMOT,
    ...PERSONATGES_OBSOLETS_NOM
  ];
  const filtrats = filtraAgentsDelDirectori(barreja, 'tots');
  expect(filtrats.filter((a) => tipusDAgent(a) === 'ia').map((a) => a.id)).toEqual([AGENTS_MAP.IAIA.id]);
  expect(filtrats.map((a) => a.name)).toContain('IAIA MarIA');
  expect(filtrats.map((a) => a.name)).not.toContain('Andreu Soler');
  expect(filtrats.map((a) => a.name)).toContain('Nano Banana');
  expect(filtrats.map((a) => a.name)).toContain('Pepica la Vall');
  expect(filtrats.map((a) => a.name)).not.toContain('Marc (El Gall)');
  expect(filtraAgentsDelDirectori(barreja, 'ia')).toEqual([]);

  const { container } = render(<ProfileSection agents={barreja} />);
  const titols = [...container.querySelectorAll('article.sp-card .sp-card-title')].map((el) => el.textContent);
  expect(titols).toContain(AGENTS_MAP.JAVI.name);
  expect(titols).toContain(AGENTS_MAP.SOCDEPOBLE.name);
  expect(titols).toContain('IAIA MarIA');
  expect(titols).not.toContain('Assistent de prova');
  expect(titols).not.toContain('Animal de prova');
  expect(titols).not.toContain('Andreu Soler');
  expect(titols).toContain('Nano Banana');
});

test('la regla UI conserva literalment les persones/entitats reals addicionals del contracte SQL R21.5', () => {
  const reals = [
    { id: 'real-andreu', name: 'Andreu Soler', type: 'PERSON', personaKey: 'CAPATAS', town_name: 'Alcoi' },
    { id: 'real-vicent', name: 'Vicent Ferris', type: 'PERSON', personaKey: 'AGRONOM', extra: { preserva: true } },
    { id: 'real-pepica', name: 'Pepica la Vall', type: 'PERSON' },
    { id: '11111111-1234-4000-8000-000000000099', name: 'Persona real amb prefix coincident', type: 'PERSON' },
    { id: 'entitat-real', name: 'Entitat real', type: 'COMPANY', personaKey: 'ACOMPANYANT' }
  ];
  const legacy = { id: '11111111-1111-4111-A111-000000000003', name: 'Nom canviat', type: 'PERSON' };
  expect(filtraAgentsDelDirectori([...reals, ...reals, legacy, { id: 'unknown-bot', name: 'Bot', type: '\u00a0ai\ufeff' }], 'tots'))
    .toEqual([...reals, ...reals]);
});

const enllacosDeLaSubnav = (subnav, noms) => {
  const enllacos = within(subnav).getAllByRole('link');
  return noms.map((nom) => {
    const a = within(subnav).getByRole('link', { name: nom });
    return [enllacos.indexOf(a), a.getAttribute('href'), a.getAttribute('aria-current'), a.querySelector('[aria-hidden="true"]')?.textContent ?? null, a.textContent];
  });
};

test('R16-X1 + R21.5 · SubnavigacioPoblesIGent connecta Pobles, Gent i Entitats i Demografia i filtra només Tots · Persones · Entitats i Grups (sense pestanya IA)', () => {
  const mostra = [
    { id: 'pepa', name: 'Pepa', type: 'PERSON', role: 'Fornera', town_name: 'Benilloba', publicat: true },
    { id: 'forn', name: 'Forn de la Plaça', type: 'COMPANY', role: 'Forn', tag: 'Comerç', town_name: 'Benilloba', publicat: true },
    { id: 'iaia', name: 'IAIA MarIA', type: 'AI', role: 'Matriarca', tag: 'TECNOLOGIA', town_name: 'La Torre de les Maçanes', publicat: true },
    { id: 'ocult', name: 'Perfil Ocult', type: 'PERSON', role: 'Privat', town_name: 'Benilloba', publicat: false },
    { id: 'privat', name: 'Perfil Privat', type: 'COMPANY', role: 'Privat', town_name: 'Benilloba', visibility: 'private' }
  ];
  const { container } = render(<ProfileSection agents={mostra} />);

  const subnav = screen.getByRole('navigation', { name: 'Directori de pobles i gent' });
  expect(subnav).not.toBeNull();
  expect(within(subnav).getAllByRole('link')).toHaveLength(3);
  expect(enllacosDeLaSubnav(subnav, ['Pobles', 'Gent i Entitats', 'Demografia'])).toEqual([
    [0, '/pobles', null, '🏘️', '🏘️ Pobles'],
    [1, '/perfil', 'page', '👥', '👥 Gent i Entitats'],
    [2, '/poblacio', null, '📊', '📊 Demografia']
  ]);

  const filtres = screen.getByRole('group', { name: 'Filtra el directori per tipus' });
  expect(within(filtres).queryAllByRole('link')).toEqual([]);
  expect(within(filtres).getAllByRole('button')).toHaveLength(3);
  expect(within(filtres).queryByRole('button', { name: /IA/i })).toBeNull();
  expect(screen.queryByRole('link', { name: 'Gent' })).toBeNull();

  const titols = () => [...container.querySelectorAll('article.sp-card .sp-card-title')].map((el) => el.textContent);
  expect(titols()).toEqual(['Pepa', 'Forn de la Plaça']);

  const botonsFiltre = [...container.querySelectorAll('button.sdp-directori-filtres__boto')];
  expect(botonsFiltre.map((b) => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([
    ['Tots', 'true'],
    ['Persones', 'false'],
    ['Entitats i Grups', 'false']
  ]);

  fireEvent.click(botonsFiltre[1]);
  expect(botonsFiltre[1].getAttribute('aria-pressed')).toBe('true');
  expect(titols()).toEqual(['Pepa']);

  fireEvent.click(botonsFiltre[2]);
  expect(botonsFiltre[2].getAttribute('aria-pressed')).toBe('true');
  expect(titols()).toEqual(['Forn de la Plaça']);

  fireEvent.click(botonsFiltre[0]);
  expect(botonsFiltre[0].getAttribute('aria-pressed')).toBe('true');
  expect(titols()).toEqual(['Pepa', 'Forn de la Plaça']);
});

test('C6-05 + R21.5 · amb la interfície en castellà, la subnavegació i els 3 filtres ixen en castellà (sense IA)', () => {
  mocks.language = 'es';
  render(<ProfileSection agents={[{ id: 'pepa', name: 'Pepa', type: 'PERSON', town_name: 'Benilloba' }]} />);
  const subnav = screen.getByRole('navigation', { name: 'Directorio de pueblos y gente' });
  expect(within(subnav).getAllByRole('link')).toHaveLength(3);
  expect(enllacosDeLaSubnav(subnav, ['Pueblos', 'Gente y Entidades', 'Demografía'])).toEqual([
    [0, '/pobles', null, '🏘️', '🏘️ Pueblos'],
    [1, '/perfil', 'page', '👥', '👥 Gente y Entidades'],
    [2, '/poblacio', null, '📊', '📊 Demografía']
  ]);
  const filtres = screen.getByRole('group', { name: 'Filtrar el directorio por tipo' });
  expect(within(filtres).getAllByRole('button').map((b) => b.textContent)).toEqual(['Todos', 'Personas', 'Entidades y Grupos']);
  expect(within(filtres).queryAllByRole('link')).toEqual([]);
});

test('C6-05 + R21.5 · una llengua que la interfície no servix cau en valencià', () => {
  mocks.language = 'fr';
  render(<ProfileSection agents={[]} />);
  expect(screen.getByRole('navigation', { name: 'Directori de pobles i gent' })).toBeTruthy();
  expect(within(screen.getByRole('group', { name: 'Filtra el directori per tipus' })).getAllByRole('button').map((b) => b.textContent))
    .toEqual(['Tots', 'Persones', 'Entitats i Grups']);
});
