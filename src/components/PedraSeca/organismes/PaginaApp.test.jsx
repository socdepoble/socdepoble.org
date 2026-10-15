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
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../../app/contexts/RouterContext';

const mocks = vi.hoisted(() => ({ toast: vi.fn(), ui: { externalConfig: {} }, capacitats: new Set(), resol: vi.fn() }));
vi.mock('../../universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../../app/contexts/UIContext', () => ({ useUIState: () => mocks.ui }));
/* Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 4) · El port
   simulat, com a PageFrame.avatar.test.jsx: sense la capacitat 'mitjans' (el
   valor de cada prova si no la demana), el mateix que una app sense node. */
vi.mock('../../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (capacitat) => mocks.capacitats.has(capacitat),
  resolveAsset: (ref, opcions) => mocks.resol(ref, opcions)
}));

import { PaginaApp } from './PaginaApp.jsx';

import { AVIS_PAGINA_SENSE_TRADUCCIO } from '../../universal/PageFrame.jsx';
import { DEFAULT_AUTHOR } from '../../universal/UniversalUtils.js';
import { CLAU_APAGADA, ESDEVENIMENT_DOM } from '../../../data/telemetria.js';
import { buidaCauTraduccions } from '../hooks/useTraduccioPagina.js';

let vistos;
const escolta = (event) => vistos.push(event.detail);
beforeEach(() => {
  vistos = [];
  mocks.ui = { externalConfig: { traductorUrl: '/wp-json/socdepoble/v1/traduir' } };
  mocks.capacitats = new Set();
  mocks.resol.mockReset();
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

  /* Onada 8 (261009) · Al perfil de Sóc de Poble (DEFAULT_AUTHOR.href), ja no
     a la pàgina del projecte. */
  test('sense autor, signa Sóc de Poble i porta al seu perfil (T6, Onada 8)', () => {
    const autor = pinta({ author: null }).querySelector('section.bar-orange').firstElementChild;
    expect(autor.getAttribute('href')).toBe(DEFAULT_AUTHOR.href);
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

/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B) · «A la part dreta
   de la barra taronja, SEMPRE la data i l'hora vives». Amb rellotgeViu, el
   rellotge (RellotgeViu) és l'últim fill de les accions de la dreta; sense, el
   DOM de sempre (Llei del Píxel per a la resta d'apps). El rellotge injectat
   congela l'hora: l'avanç del minut el proven RellotgeViu.test.jsx i
   useAra.test.jsx. */
describe('el rellotge viu de la barra taronja', () => {
  const ARA = new Date(2026, 9, 13, 9, 59, 30).getTime();
  const rellotge = () => ARA;
  const RELLOTGE = 'Data i hora d’ara: 09:59 del 13/10/26';
  const accionsDe = (arrel) => arrel.querySelector('section.bar-orange .bar-actions');
  const fillsDe = (accions) => [...accions.children].map((e) => [e.tagName, e.getAttribute('aria-label') ?? e.textContent]);

  test('sense barActions: la pastilla del document, que no es perd, i després el rellotge', () => {
    const accions = accionsDe(pinta({ rellotgeViu: true, rellotge }));
    expect(fillsDe(accions).map(([etiqueta]) => etiqueta)).toEqual(['TIME', 'TIME']);
    expect(accions.firstElementChild.getAttribute('datetime')).toBe(NOTICIA.dateTime);
    expect(accions.firstElementChild.textContent).toBe('09:3004/10/26');
    const darrer = accions.lastElementChild;
    expect(darrer.className).toBe('btn-date-time');
    expect(darrer.getAttribute('aria-label')).toBe(RELLOTGE);
    expect(darrer.getAttribute('datetime')).toBe('2026-10-13T09:59');
    expect(darrer.textContent).toBe('09:5913/10/26');
  });

  test('amb barActions: les accions, en el seu ordre, i el rellotge a l’extrem dret', () => {
    const accions = accionsDe(pinta({
      rellotgeViu: true,
      rellotge,
      barActions: (
        <>
          <button type="button" aria-pressed="false">Mostra les xifres</button>
          <span className="sdp-gestoria-boina__lectura">llegit</span>
        </>
      )
    }));
    expect(fillsDe(accions)).toEqual([['BUTTON', 'Mostra les xifres'], ['SPAN', 'llegit'], ['TIME', RELLOTGE]]);
    /* barActions mana sobre la pastilla del document: no n'hi ha cap més. */
    expect(accions.querySelectorAll('.btn-date-time')).toHaveLength(1);
  });

  test('sense cap data del document: només el rellotge', () => {
    const accions = accionsDe(pinta({ rellotgeViu: true, rellotge, time: undefined, date: undefined, dateTime: undefined }));
    expect(fillsDe(accions)).toEqual([['TIME', RELLOTGE]]);
  });

  test('un barActions buit no tapa la pastilla del document, com fins ara', () => {
    const accions = accionsDe(pinta({ rellotgeViu: true, rellotge, barActions: false }));
    expect(fillsDe(accions).map(([etiqueta]) => etiqueta)).toEqual(['TIME', 'TIME']);
    expect(accions.firstElementChild.getAttribute('datetime')).toBe(NOTICIA.dateTime);
  });

  test('sense rellotgeViu, el DOM de sempre: cap rellotge, ni amb barActions ni sense', () => {
    let arrel = pinta({ rellotge });
    expect([...accionsDe(arrel).children].map((e) => e.className)).toEqual(['btn-date-time']);
    expect(arrel.querySelector('[aria-label^="Data i hora d’ara"]')).toBeNull();
    cleanup();
    arrel = pinta({ barActions: <button type="button" aria-pressed="false">Mostra les xifres</button> });
    expect([...accionsDe(arrel).children].map((e) => e.tagName)).toEqual(['BUTTON']);
    expect(arrel.querySelector('[aria-label^="Data i hora d’ara"]')).toBeNull();
  });

  test('només un true explícit l’encén: un text o un 1, no', () => {
    for (const valor of ['si', 'true', 1]) {
      const arrel = pinta({ rellotgeViu: valor, rellotge });
      expect(arrel.querySelector('[aria-label^="Data i hora d’ara"]'), String(valor)).toBeNull();
      expect([...accionsDe(arrel).children].map((e) => e.className)).toEqual(['btn-date-time']);
      cleanup();
    }
  });

  test('el rellotge no canvia res més de la pàgina: la mateixa anatomia, la mateixa autoria i el mateix H1', () => {
    const senseRellotge = pinta();
    const marc = (arrel) => [...arrel.querySelector('.sdp-universal-page-container').children].map((e) => e.className);
    const abans = { marc: marc(senseRellotge), autor: senseRellotge.querySelector('section.bar-orange').firstElementChild.outerHTML };
    cleanup();
    const ambRellotge = pinta({ rellotgeViu: true, rellotge });
    expect(marc(ambRellotge)).toEqual(abans.marc);
    expect(ambRellotge.querySelector('section.bar-orange').firstElementChild.outerHTML).toBe(abans.autor);
    expect(ambRellotge.querySelectorAll('h1')).toHaveLength(1);
  });
});

/* act buida el treball pendent de React en eixir: el valor resolt ja s'ha pintat. */
const buida = () => act(async () => { await new Promise((resolt) => { setTimeout(resolt, 0); }); });

/* Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 5) · Les accions
   inoperatives de PageFrame (T36): la Gestoria porta Comentar, Compartir i
   Connectar a la barra, amb aria-disabled, i el clic només diu quin botó és
   (onClickInoperatiu): cap menú, cap navigator.share, cap porta-retalls i cap
   navegació. Sense les props, el DOM i les accions de sempre. */
describe('les accions inoperatives de PageFrame (T36)', () => {
  const botoDe = (arrel, nom) => [...arrel.querySelectorAll('header.bar-blue button')].find((b) => b.getAttribute('aria-label') === nom);
  const ubicacio = () => screen.getByTestId('ubicacio').textContent;
  let share;
  let writeText;
  beforeEach(() => {
    share = vi.fn(async () => {});
    writeText = vi.fn(async () => {});
    Object.defineProperty(window.navigator, 'share', { value: share, configurable: true, writable: true });
    Object.defineProperty(window.navigator, 'clipboard', { value: { writeText }, configurable: true, writable: true });
  });
  afterEach(() => {
    delete window.navigator.share;
    delete window.navigator.clipboard;
  });

  test('Comentar, Compartir i Connectar porten aria-disabled="true"; Índex i Traduir, no', () => {
    const arrel = pinta({ accionsInoperatives: true, onClickInoperatiu: vi.fn() });
    const noms = [...arrel.querySelectorAll('header.bar-blue button')].map((b) => [b.getAttribute('aria-label'), b.getAttribute('aria-disabled')]);
    expect(noms).toEqual([
      ['Índex de secció', null], ['Traduir', null], ['Comentar', 'true'], ['Compartir', 'true'], ['Connectar', 'true']
    ]);
  });

  test('un clic a Compartir crida onClickInoperatiu("compartir") i res més: ni navigator.share, ni el porta-retalls, ni la ubicació', async () => {
    const onClickInoperatiu = vi.fn();
    const arrel = pinta({ accionsInoperatives: true, onClickInoperatiu });
    const abans = ubicacio();
    fireEvent.click(botoDe(arrel, 'Compartir'));
    await buida();
    expect(onClickInoperatiu.mock.calls).toEqual([['compartir']]);
    expect(share).not.toHaveBeenCalled();
    expect(writeText).not.toHaveBeenCalled();
    expect(mocks.toast).not.toHaveBeenCalled();
    expect(ubicacio()).toBe(abans);
  });

  test('Comentar i Connectar també només diuen quin botó són: cap menú, cap navegació i cap telemetria', async () => {
    const onClickInoperatiu = vi.fn();
    const arrel = pinta({ accionsInoperatives: true, onClickInoperatiu });
    const abans = ubicacio();
    fireEvent.click(botoDe(arrel, 'Comentar'));
    fireEvent.click(botoDe(arrel, 'Connectar'));
    await buida();
    expect(onClickInoperatiu.mock.calls).toEqual([['comentar'], ['connectar']]);
    expect(document.querySelector('[role="menu"]')).toBeNull();
    expect(botoDe(arrel, 'Comentar').hasAttribute('aria-haspopup')).toBe(false);
    expect(ubicacio()).toBe(abans);
    expect(vistos.filter((intent) => intent.nom === 'connectar')).toEqual([]);
  });

  test('sense les props, el DOM de sempre i el Compartir de veres (la prova discrimina); onClickInoperatiu sol no apaga res', async () => {
    const sempre = pinta().querySelector('header.bar-blue').outerHTML;
    cleanup();
    const nomesClic = vi.fn();
    const arrel = pinta({ onClickInoperatiu: nomesClic });
    expect(arrel.querySelector('header.bar-blue').outerHTML).toBe(sempre);
    expect(arrel.querySelector('header.bar-blue [aria-disabled]')).toBeNull();
    fireEvent.click(botoDe(arrel, 'Compartir'));
    await buida();
    expect(share).toHaveBeenCalledTimes(1);
    expect(nomesClic).not.toHaveBeenCalled();
  });

  test('ho diu el codi: les dues props passen per nomesAmbValor, com la resta d’accions de la barra', () => {
    const codi = readFileSync(path.join(process.cwd(), 'src/components/PedraSeca/organismes/PaginaApp.jsx'), 'utf8');
    expect(codi).toMatch(/nomesAmbValor\(\{[^}]*accionsInoperatives, onClickInoperatiu[^}]*\}\)/);
  });
});

/* Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 4; decisió de les
   21:20) · La referència opaca d'una pujada ('sdp-media://') es resol pel port
   amb useResolvedAsset abans de passar per fontSegura; mentre es resol, o si
   no es pot, la silueta honesta, mai la referència crua. El port simulat la
   resol a una URL del mateix origen, la que ja admet sanitize.js. */
describe('la referència opaca d’una pujada es resol pel port', () => {
  const REF = 'sdp-media://mitjans/t/u/avatars/p.webp';
  const PORTADA = 'sdp-media://mitjans/t/u/portades/biblioteca.webp';
  const resolta = (ref) => `${window.location.origin}/storage/v1/object/public/${ref.trim().replace(/^sdp-media:\/\//i, '')}`;
  const ambPort = (resolutor = async (ref) => resolta(ref)) => {
    mocks.capacitats = new Set(['mitjans']);
    mocks.resol.mockImplementation(resolutor);
  };
  const ambAvatar = (avatar) => ({ author: { ...NOTICIA.author, avatar } });
  const autorDe = (arrel) => arrel.querySelector('section.bar-orange .sp-card-author');
  const srcAvatar = (arrel) => autorDe(arrel).querySelector('img.sp-card-avatar')?.getAttribute('src');
  /* Tots els src i srcset del document que diuen sdp-media, amb qualsevol caixa i també darrere d'una barra. */
  const opacs = (arrel) => [...arrel.querySelectorAll('[src], [srcset]')]
    .flatMap((e) => [e.getAttribute('src'), e.getAttribute('srcset')])
    .filter((valor) => valor && /sdp-media/i.test(valor));
  const ambSilueta = (arrel) => {
    expect(autorDe(arrel).querySelector('img.sp-card-avatar')).toBeNull();
    expect(autorDe(arrel).querySelector('.sp-card-avatar--fallback:not(.sp-card-avatar--amagat)')).not.toBeNull();
  };

  test('resolta pel port, la barra taronja pinta l’avatar amb eixa URL; mentre es resol, la silueta', async () => {
    ambPort();
    const arrel = pinta(ambAvatar(REF));
    ambSilueta(arrel);
    await waitFor(() => expect(srcAvatar(arrel)).toBe(resolta(REF)));
    expect(mocks.resol).toHaveBeenCalledWith(REF, expect.anything());
    expect(opacs(arrel)).toEqual([]);
  });

  test('la portada opaca, resolta pel port, es pinta sense referent; mentre es resol, cap portada', async () => {
    ambPort();
    const arrel = pinta({ heroImage: PORTADA });
    expect(arrel.querySelector('.hero-image')).toBeNull();
    await waitFor(() => expect(arrel.querySelector('.hero-image img')?.getAttribute('src')).toBe(resolta(PORTADA)));
    expect(arrel.querySelector('.hero-image img').getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(opacs(arrel)).toEqual([]);
  });

  test('sense la capacitat «mitjans», la silueta, cap portada i cap src opac; el port no es crida', async () => {
    const arrel = pinta({ ...ambAvatar(REF), heroImage: PORTADA });
    await buida();
    ambSilueta(arrel);
    expect(arrel.querySelector('.hero-image')).toBeNull();
    expect(opacs(arrel)).toEqual([]);
    expect(mocks.resol).not.toHaveBeenCalled();
  });

  test('si el port torna la mateixa referència (no pot firmar), res o falla: la silueta, mai la referència', async () => {
    const PRIVADA = 'sdp-media://mitjans_privats/t/u/avatars/p.webp';
    for (const resolutor of [async (ref) => ref, async () => null, async () => { throw new Error('el node no respon'); }]) {
      ambPort(resolutor);
      const arrel = pinta(ambAvatar(PRIVADA));
      await waitFor(() => expect(mocks.resol).toHaveBeenCalledWith(PRIVADA, expect.anything()));
      await buida();
      ambSilueta(arrel);
      expect(opacs(arrel)).toEqual([]);
      cleanup();
      mocks.resol.mockReset();
    }
  });

  test('un esquema en majúscules o amb espais davant: al port, la forma canònica; sense port, mai al DOM (ni darrere d’una barra)', async () => {
    for (const ref of ['SDP-MEDIA://mitjans/t/u/avatars/p.webp', '  sdp-media://mitjans/t/u/avatars/p.webp', ' Sdp-Media://mitjans/t/u/avatars/p.webp']) {
      let arrel = pinta({ ...ambAvatar(ref), heroImage: ref });
      await buida();
      ambSilueta(arrel);
      expect(arrel.querySelector('.hero-image'), ref).toBeNull();
      expect([ref, opacs(arrel)]).toEqual([ref, []]);
      cleanup();
      ambPort();
      arrel = pinta(ambAvatar(ref));
      await waitFor(() => expect(srcAvatar(arrel)).toBe(resolta(REF)));
      expect(mocks.resol.mock.calls.map(([demanada]) => demanada)).toEqual([REF]);
      cleanup();
      mocks.capacitats = new Set();
      mocks.resol.mockReset();
    }
  });

  test('una font que no és opaca no passa pel port i es pinta com sempre', async () => {
    ambPort();
    const arrel = pinta();
    await buida();
    expect(srcAvatar(arrel)).toBe(NOTICIA.author.avatar);
    expect(arrel.querySelector('.hero-image img').getAttribute('src')).toBe(NOTICIA.heroImage);
    expect(mocks.resol).not.toHaveBeenCalled();
  });

  test('els ganxos es criden sempre en el mateix ordre: d’opac a cap autor i a una font pròpia, sense trencar res', async () => {
    ambPort();
    const pagina = (props) => (
      <MemoryRouter rutaInicial="/app/lector?article=a1">
        <PaginaApp {...NOTICIA} {...props}><p>El cos de la notícia.</p></PaginaApp>
      </MemoryRouter>
    );
    const { container, rerender } = render(pagina(ambAvatar(REF)));
    await waitFor(() => expect(srcAvatar(container)).toBe(resolta(REF)));
    rerender(pagina({ author: null, heroImage: PORTADA }));
    await waitFor(() => expect(container.querySelector('.hero-image img')?.getAttribute('src')).toBe(resolta(PORTADA)));
    expect(autorDe(container).querySelector('.sp-card-author-name').textContent).toBe('Sóc de Poble');
    rerender(pagina({}));
    await buida();
    expect(srcAvatar(container)).toBe(NOTICIA.author.avatar);
    expect(container.querySelector('.hero-image img').getAttribute('src')).toBe(NOTICIA.heroImage);
    expect(opacs(container)).toEqual([]);
  });
});


