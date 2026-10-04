/**
 * PaginaApp · la Pàgina Universal de les apps (ordre del Mestre, 261004,
 * prompt 261004_0515; D-A del xat de les 06:38). La porta permesa: PageFrame
 * amb la doble barra sencera, però sense traductor, sense telemetria i amb les
 * imatges privades. src/apps/plataforma/fronteres.test.js continua vetant
 * PageFrame, UniversalPage i el traductor dins de src/apps.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRef } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../../app/contexts/RouterContext';

const mocks = vi.hoisted(() => ({ toast: vi.fn(), ui: { externalConfig: {} } }));
vi.mock('../../universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../../app/contexts/UIContext', () => ({ useUIState: () => mocks.ui }));

import { PaginaApp } from './PaginaApp.jsx';
import * as PedraSeca from '../index.js';
import { AVIS_PAGINA_SENSE_TRADUCCIO } from '../../universal/PageFrame.jsx';
import { CLAU_APAGADA, ESDEVENIMENT_DOM } from '../../../data/telemetria.js';
import { buidaCauTraduccions } from '../hooks/useTraduccioPagina.js';

let vistos;
const escolta = (event) => vistos.push(event.detail);
beforeEach(() => {
  vistos = [];
  mocks.ui = { externalConfig: { traductorUrl: '/wp-json/socdepoble/v1/traduir' } };
  buidaCauTraduccions();
  window.localStorage.removeItem(CLAU_APAGADA);
  window.umami = { track: vi.fn() };
  window.addEventListener(ESDEVENIMENT_DOM, escolta);
});
afterEach(() => {
  cleanup();
  window.removeEventListener(ESDEVENIMENT_DOM, escolta);
  delete window.umami;
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function Ubicacio() {
  const { pathname, search } = useLocation();
  return <output data-testid="ubicacio">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}
const NOTICIA = {
  title: 'Obri la biblioteca de dissabte',
  subtitle: 'Horari nou de la tardor',
  lead: 'Cada dissabte de 10:00 a 13:00.',
  author: { nom: 'Notícies del Poble', poble: 'La Torre de les Maçanes', avatar: '/assets/fonts/noticies.png', href: '/app/lector/fonts' },
  time: '09:30', date: '04/10/26', dateTime: '2026-10-04T09:30',
  heroImage: '/assets/noticies/biblioteca.jpg', heroAlt: 'La biblioteca'
};
const pinta = (props = {}) => render(
  <MemoryRouter rutaInicial="/app/lector?article=a1">
    <PaginaApp {...NOTICIA} {...props}><p>El cos de la notícia.</p></PaginaApp>
    <Ubicacio />
  </MemoryRouter>
).container;

describe('l’anatomia de la Pàgina Universal', () => {
  test('doble barra, portada, barra taronja, H1 dins de header.page-title i el cos a l’article', () => {
    const arrel = pinta({ labels: [{ text: 'Notícies', className: 'sdp-badge-system' }] });
    const marc = arrel.querySelector('.sdp-universal-page-container');
    expect([...marc.children].map((e) => e.className)).toEqual([
      'bar-blue', 'hero-image', 'bar-orange', 'page-title', 'content-wrapper'
    ]);
    const h1 = arrel.querySelector('header.page-title > h1');
    expect(h1.textContent).toBe(NOTICIA.title);
    expect(arrel.querySelectorAll('h1')).toHaveLength(1);
    expect(arrel.querySelector('.page-title-labels').textContent).toBe('Notícies');
    expect(arrel.querySelector('article.content-wrapper .page-intro h2').textContent).toBe(NOTICIA.subtitle);
    expect(arrel.querySelector('article.content-wrapper > p').textContent).toBe('El cos de la notícia.');
    /* Sense onBack, la fletxa de Tornar no hi és (BarraBlava): la resta, sempre. */
    const blava = [...arrel.querySelectorAll('header.bar-blue button')].map((b) => b.getAttribute('aria-label'));
    expect(blava).toEqual(['Índex de secció', 'Traduir', 'Comentar', 'Compartir', 'Connectar']);
    cleanup();
    const ambTornar = pinta({ onBack: () => {} });
    expect([...ambTornar.querySelectorAll('header.bar-blue button')].map((b) => b.getAttribute('aria-label'))[0]).toBe('Tornar arrere');
  });

  test('l’acció principal va dins del bloc del títol, davall de l’H1', () => {
    const arrel = pinta({ accioPrincipal: <button type="button">Desa per a després</button> });
    expect([...arrel.querySelector('header.page-title').children].map((e) => e.tagName + '.' + e.className))
      .toEqual(['H1.', 'DIV.page-title-accio']);
  });

  test('refTitol porta el focus a l’H1; Tornar crida onBack', () => {
    const ref = createRef();
    const onBack = vi.fn();
    const arrel = pinta({ refTitol: ref, onBack });
    act(() => { ref.current.focus(); });
    expect(document.activeElement).toBe(arrel.querySelector('header.page-title > h1'));
    fireEvent.click(screen.getByRole('button', { name: 'Tornar arrere' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  test('les accions de la barra blava es poden apagar: Comentar, Compartir i Connectar', () => {
    const arrel = pinta({ showComment: false, showShare: false, showConnect: false });
    expect([...arrel.querySelectorAll('header.bar-blue button')].map((b) => b.getAttribute('aria-label')))
      .toEqual(['Índex de secció', 'Traduir']);
  });

  test('la data és text (<time>): un element d’una app no és al Calendari', () => {
    const pastilla = pinta().querySelector('section.bar-orange .btn-date-time');
    expect(pastilla.tagName).toBe('TIME');
    expect(pastilla.getAttribute('datetime')).toBe(NOTICIA.dateTime);
  });

  /* Ordre del Mestre, 261004 (Gestoria, principi 2) · la boina personal porta
     l'ull de privacitat i la seua data: barActions mana sobre la pastilla. */
  test('barActions: les accions de la dreta de la barra taronja, amb la seua pastilla; sense, les de sempre', () => {
    const accions = pinta({ barActions: <button type="button" aria-pressed="false">Mostra les xifres</button> })
      .querySelector('section.bar-orange .bar-actions');
    expect([...accions.children].map((e) => e.tagName)).toEqual(['BUTTON']);
    expect(accions.querySelector('.btn-date-time')).toBeNull();
    cleanup();
    const sempre = pinta().querySelector('section.bar-orange .bar-actions');
    expect([...sempre.children].map((e) => e.className)).toEqual(['btn-date-time']);
  });
});

describe('sense traductor ni telemetria', () => {
  test('Traduir avisa i no crida cap traductor, encara que l’amfitrió en tinga', () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const arrel = pinta();
    fireEvent.click(screen.getByRole('button', { name: 'Traduir' }));
    expect(mocks.toast).toHaveBeenCalledWith(AVIS_PAGINA_SENSE_TRADUCCIO);
    expect(document.querySelector('[role="menu"]')).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
    expect(arrel.querySelector('.sdp-avis-traduccio, article.sdp-traduccio-cos')).toBeNull();
  });

  test('el Connectar de la barra no compta cap esdeveniment de telemetria', () => {
    const arrel = pinta();
    fireEvent.click(arrel.querySelector('header.bar-blue .btn-connectar'));
    expect(vistos.filter((intent) => intent.nom === 'connectar')).toEqual([]);
    expect(window.umami.track).not.toHaveBeenCalled();
    /* Fa la seua acció de sempre: Connectar amb el descriptor de la pàgina. */
    expect(screen.getByTestId('ubicacio').textContent).toMatch(/^\/connectar\?/);
  });

  test('ho diu el codi: traduccio={false} i { comptar: false }, sempre', () => {
    const codi = readFileSync(path.join(process.cwd(), 'src/components/PedraSeca/organismes/PaginaApp.jsx'), 'utf8');
    expect(codi).toContain('traduccio={false}');
    expect(codi).toMatch(/SENSE_TELEMETRIA = Object\.freeze\(\{ comptar: false \}\)/);
    expect(codi).toContain('telemetria={SENSE_TELEMETRIA}');
    expect(codi).not.toMatch(/useTraduccioPagina|data\/telemetria/);
  });
});

describe('les imatges privades', () => {
  test('una portada pròpia es demana sense referent; una de fora no es pinta', () => {
    let arrel = pinta();
    const portada = arrel.querySelector('.hero-image img');
    expect(portada.getAttribute('src')).toBe(NOTICIA.heroImage);
    expect(portada.getAttribute('alt')).toBe('La biblioteca');
    expect(portada.getAttribute('referrerpolicy')).toBe('no-referrer');
    cleanup();
    arrel = pinta({ heroImage: 'https://diari.example/foto.jpg' });
    expect(arrel.querySelector('.hero-image')).toBeNull();
    expect(arrel.querySelector('img[src^="https://diari.example"]')).toBeNull();
  });

  test('un avatar de fora no es pinta: el cercle de reserva, mai el logo de l’autor per defecte', () => {
    const arrel = pinta({ author: { ...NOTICIA.author, avatar: 'https://diari.example/logo.png' } });
    const autor = arrel.querySelector('section.bar-orange .sp-card-author');
    expect(autor.querySelector('img.sp-card-avatar')).toBeNull();
    expect(autor.querySelector('.sp-card-avatar--fallback')).not.toBeNull();
    expect(autor.querySelector('.sp-card-author-name').textContent).toBe('Notícies del Poble');
  });
});

describe('l’autoria', () => {
  test('amb autor, el seu nom, el seu poble i la seua ruta', () => {
    const autor = pinta().querySelector('section.bar-orange').firstElementChild;
    expect(autor.tagName).toBe('A');
    expect(autor.getAttribute('href')).toBe('/app/lector/fonts');
    expect(autor.querySelector('.sp-card-author-location').textContent).toBe('La Torre de les Maçanes');
  });

  test('sense autor, signa Sóc de Poble i porta a la pàgina del projecte (T6)', () => {
    const autor = pinta({ author: null }).querySelector('section.bar-orange').firstElementChild;
    expect(autor.getAttribute('href')).toBe('/projecte');
    expect(autor.querySelector('.sp-card-author-name').textContent).toBe('Sóc de Poble');
  });

  test('un autor sense ruta no enllaça', () => {
    const autor = pinta({ author: { nom: 'La meua llista', poble: '' } }).querySelector('section.bar-orange').firstElementChild;
    expect(autor.tagName).toBe('DIV');
  });

  /* Norma del Mestre, 261004 (prompt 261004_1108, logotips) · Una pàgina
     d'app que signa Sóc de Poble (sense autor, o amb la ruta del projecte:
     les xifres i el pols de la Consola, DetallEspai) porta el seu logotip
     dalt de l'H1, sense cap prop nova: el decidix PageFrame per la ruta de la
     boina. Una font de fora o una persona, cap (el Lector no carrega cap
     imatge que no siga la portada). */
  test('signant Sóc de Poble porta el seu logotip dalt de l’H1; una font o una persona, cap', () => {
    const fills = (arrel) => [...arrel.querySelector('header.page-title').children].map((e) => e.tagName + '.' + e.className);
    const LOGOS = ['IMG.page-title-logo light-only', 'IMG.page-title-logo dark-only'];
    expect(fills(pinta({ author: null }))).toEqual([...LOGOS, 'H1.']);
    cleanup();
    expect(fills(pinta({ author: { nom: 'Sóc de Poble', href: '/projecte', poble: 'La Torre de les Maçanes' } }))).toEqual([...LOGOS, 'H1.']);
    cleanup();
    expect(fills(pinta())).toEqual(['H1.']);
    cleanup();
    expect(fills(pinta({ author: { nom: 'La meua llista', poble: '' } }))).toEqual(['H1.']);
  });
});

test('la façana de Pedra Seca l’exporta (la porta de les apps)', () => {
  expect(PedraSeca.PaginaApp).toBe(PaginaApp);
  expect(typeof PedraSeca.GraellaTargetes).toBe('function');
});
