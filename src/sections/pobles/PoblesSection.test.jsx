/**
 * T2 (prompt 1140, ordre del Mestre, 261001) · «Pobles mutilat»: les targetes
 * de /pobles pinten l'avatar del poble i la pastilla de data i hora sencera.
 *
 * Abans la pastilla llegia `dynamic_time` i `dynamic_date`, camps que no
 * escriu cap codi: la targeta eixia sense pastilla. Ara és la regla de Pedra
 * Seca §10 (editorial.js · dataDElement): la data de creació del poble, o la
 * de l'última versió si és posterior. Les proves s'executen a Europe/Madrid
 * (vite.config.js), i per això les hores literals són les de València.
 */
import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), t: (_, alternativa) => alternativa, core: {}, mur: {} }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams('')],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
/* Onada 6 · Les publicacions del Mur, per al naixement de cada poble. */
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));

import PoblesSection from './PoblesSection.jsx';
import { TOWNS } from './townsContent.js';
import { COPYRIGHT_VIQUIPEDIA, dataDElement } from '../../components/universal/editorial.js';
import { fixaBaseRecursos } from '../../config/assetResolver.js';
import { rutaXatDePagina } from '../../config/navigation';
import { nomDeLaGent } from './nomsDelPoble.js';
import { objecteDelPobleXat } from './xatDelPoble.js';
import { APP_SEED } from '../../data/appSeed.js';
import { llavorAmbDatesDeProva } from '../mur/datesDeProvaMur.js';

const llavor = (towns) => ({ status: 'ready', error: null, sortedTowns: towns });
const targetes = (arrel) => [...arrel.querySelectorAll('article.sp-card')];
const titol = (targeta) => targeta.querySelector('.sp-card-title').textContent;
const targetaDe = (arrel, nom) => targetes(arrel).find((targeta) => titol(targeta) === nom);
const etiquetes = (targeta) => [...targeta.querySelectorAll('.sp-card-labels > li')]
  .map((li) => [li.textContent, [...li.classList].find((classe) => classe.startsWith('sdp-badge-'))]);
const autor = (targeta) => targeta.querySelector('.sp-card-author-name').textContent;
const viquipedia = (targeta) => targeta.querySelector('.sp-card-labels > li.sdp-badge-neutral a').getAttribute('href');
const drets = (targeta) => targeta.querySelector('.sp-card-copyright').textContent;
const pastilla = (targeta) => {
  const control = targeta.querySelector('.sp-card-meta .btn-date-time');
  return control ? [...control.querySelectorAll('span')].map((s) => s.textContent) : null;
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.core = llavor(TOWNS);
  mocks.mur = { status: 'ready', feedPosts: [], marketItems: [], events: [] };
});
afterEach(() => {
  cleanup();
  fixaBaseRecursos('/');
});

test('T2 · cada poble de la llavor porta el seu avatar i la pastilla sencera (hora i dia)', () => {
  const { container } = render(<PoblesSection />);
  const llista = targetes(container);
  expect(llista).toHaveLength(TOWNS.length);
  for (const targeta of llista) {
    const town = TOWNS.find((t) => t.title === titol(targeta));
    expect(targeta.querySelector('.sp-card-author img.sp-card-avatar').getAttribute('src')).toBe(town.avatar_url);
    const { time, date } = dataDElement(town);
    expect(time).toMatch(/^\d{2}:\d{2}$/);
    expect(date).toMatch(/^\d{2}\/\d{2}\/\d{2}$/);
    expect(pastilla(targeta)).toEqual([time, date]);
  }
});

test('T2 · la pastilla diu la data de creació en hora local i porta al Calendari d’eixe mes', () => {
  render(<PoblesSection />);
  // La Torre: created_at «2026-08-20T08:00:00.000Z» → 10:00 a València.
  const boto = screen.getByRole('button', { name: '10:00 20/08/26 · Obri el calendari d’eixe mes' });
  boto.click();
  expect(mocks.navigate).toHaveBeenCalledWith('/calendari?mes=2026-08');
});

test('T2 · l’ordre ix de la mateixa data que la pastilla: de la més nova a la més vella', () => {
  const { container } = render(<PoblesSection />);
  expect(targetes(container).map(titol)).toEqual([
    'La Torre de les Maçanes', 'Xixona', 'Tibi', 'Alcoleja', 'Relleu', 'Orxeta', 'Sella', 'Penàguila', 'Benifallim'
  ]);
});

test('T2 · una versió posterior guanya a la creació; sense cap data real, cap pastilla inventada i al final', () => {
  mocks.core = llavor([
    { id: 'sense', title: 'Sense data', comarca: 'Enlloc', content: '.' },
    { id: 'vell', title: 'Vell', comarca: 'L’Alcoià', content: '.', created_at: '2026-08-01T08:00:00Z', updated_at: '2026-09-30T16:45:00Z' },
    { id: 'nou', title: 'Nou', comarca: 'L’Alcoià', content: '.', created_at: '2026-09-01T08:00:00Z' }
  ]);
  const { container } = render(<PoblesSection />);
  const llista = targetes(container);
  expect(llista.map(titol)).toEqual(['Vell', 'Nou', 'Sense data']);
  expect(pastilla(llista[0])).toEqual(['18:45', '30/09/26']);
  expect(pastilla(llista[1])).toEqual(['10:00', '01/09/26']);
  expect(pastilla(llista[2])).toBeNull();
  expect(llista[2].textContent).not.toMatch(/--/);
});

test('T2 · un poble remot sense avatar_url pinta la seua imatge com a avatar; sense cap imatge, el cercle de reserva', () => {
  mocks.core = llavor([
    { id: 'remot', title: 'Remot', comarca: 'La Marina', content: '.', image_url: '/assets/towns/sella/1.jpg', created_at: '2026-09-01T08:00:00Z' },
    { id: 'nu', title: 'Nu', comarca: 'La Marina', content: '.', created_at: '2026-08-01T08:00:00Z' }
  ]);
  const { container } = render(<PoblesSection />);
  const [remot, nu] = targetes(container);
  expect(remot.querySelector('.sp-card-author img.sp-card-avatar').getAttribute('src')).toBe('/assets/towns/sella/1.jpg');
  expect(nu.querySelector('.sp-card-author img')).toBeNull();
  expect(nu.querySelector('.sp-card-author .sp-card-avatar--fallback')).not.toBeNull();
});

test('T2 · incrustat en un amfitrió, l’avatar del poble penja del paquet (resolRecursPropi)', () => {
  fixaBaseRecursos('https://amfitrio.example/wp-content/plugins/soc-de-poble/dist');
  mocks.core = llavor([TOWNS.find((t) => t.id === 'sella')]);
  const { container } = render(<PoblesSection />);
  /* Ordre del Mestre del 261004 (barra taronja universal) · La pàgina de
     sistema ja porta la seua barra taronja, amb el logo de Sóc de Poble com a
     avatar: l'avatar del poble es busca dins de la seua targeta, no el primer
     del document. */
  const [sella] = targetes(container);
  expect(sella.querySelector('.sp-card-author img.sp-card-avatar').getAttribute('src'))
    .toBe('https://amfitrio.example/wp-content/plugins/soc-de-poble/dist/assets/towns/sella/2.jpg');
  // La barra de la pàgina també penja del paquet.
  expect(container.querySelector('section.bar-orange img.sp-card-avatar').getAttribute('src'))
    .toBe('https://amfitrio.example/wp-content/plugins/soc-de-poble/dist/assets/system/ui/logo-socdepoble-cuadrat-verd.svg');
});

/*
 * Onada 5 (ordre del Mestre, 261008) · La caputxa taronja de la targeta de
 * /pobles és l'entitat («Gent de la Torre») i el seu poble («La Torre de les
 * Maçanes»), no la comarca. Té dos objectius de clic germans: la caputxa porta
 * al xat comú del poble (el mateix subjecte poble:<id> que «Comentar · En
 * públic», T63.2) i el cos o la foto, a la pàgina del poble. La targeta es
 * classifica per província (categoria) i comarca (etiqueta).
 */
test('Onada 5 · la caputxa de La Torre diu «Gent de la Torre» i el seu poble, no la comarca', () => {
  const { container } = render(<PoblesSection />);
  const torre = targetaDe(container, 'La Torre de les Maçanes');
  expect(torre.querySelector('.sp-card-author-name').textContent).toBe('Gent de la Torre');
  expect(torre.querySelector('.sp-card-author-location').textContent).toBe('La Torre de les Maçanes');
  // La comarca continua al subtítol del cos.
  expect(torre.querySelector('.sp-card-subtitle').textContent).toBe('L\'Alacantí');
});

test('Onada 5 · la caputxa porta al xat comú del poble i el cos, a la pàgina del poble', () => {
  const { container } = render(<PoblesSection />);
  const town = TOWNS.find((t) => t.id === 'la-torre-de-les-macanes');
  const torre = targetaDe(container, town.title);
  const autor = torre.querySelector('a.sp-card-author-link');
  const vel = torre.querySelector('a.sp-card-link-overlay');
  /* Onada 6 (pla 261009_0245, ítem 4) · El fil es diu com la gent del poble. */
  expect(autor.getAttribute('href')).toBe(rutaXatDePagina(objecteDelPobleXat(town)));
  expect(autor.getAttribute('href')).toMatch(/^\/xat\?sobre=poble:la-torre-de-les-macanes&titol=Gent%20de%20la%20Torre&/);
  expect(vel.getAttribute('href')).toBe('/pobles/la-torre-de-les-macanes');
  // Dos objectius germans: la caputxa no està dins del vel, ni el vel dins de la caputxa.
  expect(autor.closest('.sp-card-link-overlay')).toBeNull();
  expect(vel.contains(autor)).toBe(false);
  expect(autor.contains(vel)).toBe(false);
});

/* Onada 5 (F5, fase 3) · Sense author, la caputxa signa amb la regla única
   de nomsDelPoble.js (nomDeLaGent), la mateixa de l'H1 i de la barra taronja
   de la pàgina. El nom curt «Gent de la Torre» és una dada de la llavor, no
   un literal del codi: una Torre sense author rep el nom sencer. */
test('Onada 5 · un poble remot sense author rep nomDeLaGent del seu nom i obri el seu xat', () => {
  const orxeta = { id: 'orxeta', title: 'Orxeta', content: '.', created_at: '2026-09-01T08:00:00Z' };
  const torre = { id: 'la-torre-de-les-macanes', title: 'La Torre de les Maçanes', content: '.', created_at: '2026-08-01T08:00:00Z' };
  const campello = { id: 'el-campello', title: 'El Campello', content: '.', created_at: '2026-07-01T08:00:00Z' };
  mocks.core = llavor([orxeta, torre, campello]);
  const { container } = render(<PoblesSection />);
  const [targetaOrxeta, targetaTorre, targetaCampello] = targetes(container);
  expect(autor(targetaOrxeta)).toBe(nomDeLaGent('Orxeta'));
  expect(autor(targetaOrxeta)).toBe('Gent d\'Orxeta');
  expect(targetaOrxeta.querySelector('.sp-card-author-location').textContent).toBe('Orxeta');
  expect(targetaOrxeta.querySelector('a.sp-card-author-link').getAttribute('href'))
    .toBe(rutaXatDePagina(objecteDelPobleXat(orxeta)));
  expect(targetaOrxeta.querySelector('a.sp-card-author-link').getAttribute('href')).toMatch(/^\/xat\?sobre=poble:orxeta&/);
  expect(autor(targetaTorre)).toBe('Gent de la Torre de les Maçanes');
  // L'article del topònim es contrau: «del Campello», no «de El Campello».
  expect(autor(targetaCampello)).toBe('Gent del Campello');
});

/* Llei del Píxel · Els 9 pobles de la llavor porten author: la caputxa, la
   Viquipèdia (amb les desambiguacions de Sella i Relleu) i els drets són
   exactament els d'abans de la fase 3. */
test('Onada 5 · la llavor es pinta idèntica: el seu author, el seu article de la Viquipèdia i els drets de sempre', () => {
  const { container } = render(<PoblesSection />);
  const ARTICLES = {
    'la-torre-de-les-macanes': 'La_Torre_de_les_Ma%C3%A7anes',
    penaguila: 'Pen%C3%A0guila',
    benifallim: 'Benifallim',
    sella: 'Sella_(Marina_Baixa)',
    orxeta: 'Orxeta',
    relleu: 'Relleu_(municipi)',
    alcoleja: 'Alcoleja',
    xixona: 'Xixona',
    tibi: 'Tibi'
  };
  expect(Object.keys(ARTICLES).sort()).toEqual(TOWNS.map((town) => town.id).sort());
  for (const town of TOWNS) {
    const targeta = targetaDe(container, town.title);
    expect(autor(targeta)).toBe(town.author);
    expect(viquipedia(targeta)).toBe(`https://ca.wikipedia.org/wiki/${ARTICLES[town.id]}`);
    expect(drets(targeta)).toBe('© Viquipèdia / Wikimedia Commons (CC BY-SA)');
  }
  expect(autor(targetaDe(container, 'La Torre de les Maçanes'))).toBe('Gent de la Torre');
});

test('Onada 5 · les dades manen: el wikipedia_title de la fitxa i els seus drets; sense, la reserva', () => {
  mocks.core = llavor([
    { id: 'sella', title: 'Sella', wikipedia_title: 'Sella (municipi)', copyright: 'CC BY 4.0 Ajuntament de Sella', created_at: '2026-09-01T08:00:00Z' },
    { id: 'vila', title: 'La Vila Joiosa', wikipedia_title: 'la Vila Joiosa', created_at: '2026-08-01T08:00:00Z' },
    { id: 'relleu', title: 'Relleu', created_at: '2026-07-01T08:00:00Z' },
    { id: 'penaguila', title: 'Penàguila', created_at: '2026-06-01T08:00:00Z' }
  ]);
  const { container } = render(<PoblesSection />);
  const [sella, vila, relleu, penaguila] = targetes(container);
  // El títol de la fitxa guanya a la desambiguació fixada al codi.
  expect(viquipedia(sella)).toBe('https://ca.wikipedia.org/wiki/Sella_(municipi)');
  expect(drets(sella)).toBe('CC BY 4.0 Ajuntament de Sella');
  expect(viquipedia(vila)).toBe('https://ca.wikipedia.org/wiki/la_Vila_Joiosa');
  expect(drets(vila)).toBe(COPYRIGHT_VIQUIPEDIA);
  /* Sense wikipedia_title, el títol del poble. Onada 6 (prompt 261009_0230,
     punt 6: cap poble escrit al codi) · La desambiguació de Relleu ja no és
     una reserva del codi sinó una dada de la llavor (townsSeed.js i
     supabase/seed.sql); una fitxa que no la porta enllaça el seu títol. */
  expect(viquipedia(relleu)).toBe('https://ca.wikipedia.org/wiki/Relleu');
  expect(viquipedia(penaguila)).toBe('https://ca.wikipedia.org/wiki/Pen%C3%A0guila');
});

/* Revisió adversarial de l'Onada 6 · Cap id ni nom de poble, amb qualsevol
   delimitador (cometes simples, dobles o plantilla de text). */
test('Onada 6 · cap id ni nom de poble escrit a PoblesSection.jsx', async () => {
  const { readFileSync } = await import('node:fs');
  const codi = readFileSync(`${process.cwd()}/src/sections/pobles/PoblesSection.jsx`, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
  const escapa = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const town of TOWNS) {
    for (const valor of [town.id, town.title]) {
      expect(codi, valor).not.toMatch(new RegExp(`['"\`]${escapa(valor)}['"\`]`));
    }
  }
  // Sonda: el patró veu un nom entre cometes dobles i dins d'una plantilla.
  expect(`const a = "sella";`).toMatch(new RegExp(`['"\`]${escapa('sella')}['"\`]`));
  expect('const b = `Sella`;').toMatch(new RegExp(`['"\`]${escapa('Sella')}['"\`]`));
});

/* Onada 6 (requisit 15 de l'Onada 5: «En crear un poble per primera vegada,
   s'hi assignarà la data i hora d'aquella primera publicació de naixement del
   poble») · La pastilla d'un poble és el seu naixement: la més antiga entre
   la fitxa i el created_at de les publicacions que el DECLAREN (poble_id).
   L'ordre llig la mateixa data (T51). */
test('Onada 6 · la pastilla diu el naixement del poble i l’ordre la seguix', () => {
  mocks.core = llavor([
    { id: 'nou', title: 'Nou', content: '.', created_at: '2026-09-01T08:00:00Z' },
    { id: 'vell', title: 'Vell', content: '.', created_at: '2026-08-01T08:00:00Z' }
  ]);
  mocks.mur = {
    status: 'ready',
    feedPosts: [
      // La primera publicació de «Nou» és anterior a la seua fitxa: naix el 01-07.
      { id: 'p1', poble_id: 'nou', created_at: '2026-07-01T08:00:00Z' },
      // Una publicació posterior de «Vell» no el fa més jove.
      { id: 'p2', poble_id: 'vell', created_at: '2026-09-15T08:00:00Z' },
      // La data triada al calendari no és la creació real (cap naixement en 1950).
      { id: 'p3', poble_id: 'vell', publish_date: '1950-01-01T08:00:00Z', created_at: '2026-09-20T08:00:00Z' },
      // Revisió adversarial · El text del lloc d'abans no data cap poble.
      { id: 'p4', author_location: 'Vell', created_at: '2026-01-01T08:00:00Z' }
    ],
    marketItems: [],
    events: []
  };
  const { container } = render(<PoblesSection />);
  const llista = targetes(container);
  expect(llista.map(titol)).toEqual(['Vell', 'Nou']);
  expect(pastilla(llista[0])).toEqual(['10:00', '01/08/26']);
  expect(pastilla(llista[1])).toEqual(['10:00', '01/07/26']);
});

test('Onada 6 · un poble sense data a la fitxa naix amb la seua primera publicació declarada; un sense res, sense pastilla', () => {
  mocks.core = llavor([
    { id: 'el-campello', title: 'El Campello', content: '.' },
    { id: 'buit', title: 'Buit', content: '.' },
    { id: 'nomes-text', title: 'Només Text', content: '.' }
  ]);
  mocks.mur = {
    status: 'ready',
    feedPosts: [
      { id: 'c1', poble_id: 'el-campello', author_location: 'El Campello', created_at: '2026-09-02T16:45:00Z' },
      { id: 't1', author_location: 'Només Text', created_at: '2026-09-03T08:00:00Z' }
    ],
    marketItems: [{ id: 'm1', poble_id: 'el-campello', population: 'El Campello', created_at: '2026-09-05T08:00:00Z' }],
    events: []
  };
  const { container } = render(<PoblesSection />);
  const [campello, buit, nomesText] = targetes(container);
  expect(titol(campello)).toBe('El Campello');
  expect(pastilla(campello)).toEqual(['18:45', '02/09/26']);
  expect(pastilla(buit)).toBeNull();
  // Casat només pel text: com abans d'esta onada, sense pastilla.
  expect(titol(nomesText)).toBe('Només Text');
  expect(pastilla(nomesText)).toBeNull();
});

/* Revisió adversarial de l'Onada 6 · Amb el Mur de la llavor, l'ordre i les
   pastilles de /pobles són els d'abans: de la Torre (10:00 20/08/26) a
   Benifallim. Amb les dates crues (les de supabase/seed.sql: el Mac Mini del
   15-02-2026 i la samarreta del 15-08-2026 casen amb la Torre per
   `population`) i amb les que servix el mode seed (llavorAmbDatesDeProva:
   les d'esta setmana). */
test.each([
  ['dates crues de la llavor (supabase/seed.sql)', () => APP_SEED],
  ['dates del mode seed (llavorAmbDatesDeProva)', () => llavorAmbDatesDeProva(APP_SEED, new Date(2026, 9, 9, 4, 0))]
])('Onada 6 · Llei del Píxel: amb el Mur de la llavor (%s), /pobles es pinta com abans', (_, llavorDelMur) => {
  const { feedPosts, marketItems, events } = llavorDelMur();
  expect(marketItems.some((item) => item.population === 'La Torre de les Maçanes')).toBe(true);
  mocks.mur = { status: 'ready', feedPosts, marketItems, events };
  const { container } = render(<PoblesSection />);
  const llista = targetes(container);
  expect(llista.map(titol)).toEqual([
    'La Torre de les Maçanes', 'Xixona', 'Tibi', 'Alcoleja', 'Relleu', 'Orxeta', 'Sella', 'Penàguila', 'Benifallim'
  ]);
  for (const targeta of llista) {
    const town = TOWNS.find((t) => t.title === titol(targeta));
    const { time, date } = dataDElement(town);
    expect(pastilla(targeta), town.id).toEqual([time, date]);
  }
  expect(pastilla(llista[0])).toEqual(['10:00', '20/08/26']);
});

test('Onada 6 · «Comentar · En públic» de la targeta porta al xat de la gent; Connectar, com sempre', () => {
  mocks.core = llavor([TOWNS.find((t) => t.id === 'sella')]);
  const { container } = render(<PoblesSection />);
  const [sella] = targetes(container);
  expect(sella.querySelector('a.sp-card-author-link').getAttribute('href')).toContain('titol=Gent%20de%20Sella');
  within(sella).getByRole('button', { name: /Connectar/ }).click();
  const connectar = new URL(mocks.navigate.mock.calls[0][0], 'http://localhost');
  expect(connectar.searchParams.get('title')).toBe('Sella');
});

test('Onada 5 · la targeta es classifica per província (categoria) i comarca (etiqueta), només si hi són', () => {
  const remot = { id: 'remot', title: 'Remot', content: '.', created_at: '2026-07-01T08:00:00Z' };
  mocks.core = llavor([TOWNS.find((t) => t.id === 'la-torre-de-les-macanes'), remot]);
  const { container } = render(<PoblesSection />);
  expect(etiquetes(targetaDe(container, 'La Torre de les Maçanes'))).toEqual([
    ['Pobles', 'sdp-badge-system'],
    ['Alacant', 'sdp-badge-category'],
    ['L\'Alacantí', 'sdp-badge-tag'],
    ['700 hab', 'sdp-badge-accent'],
    ['Publicat a la Viquipèdia', 'sdp-badge-neutral']
  ]);
  expect(etiquetes(targetaDe(container, 'Remot'))).toEqual([
    ['Pobles', 'sdp-badge-system'],
    ['Publicat a la Viquipèdia', 'sdp-badge-neutral']
  ]);
});
