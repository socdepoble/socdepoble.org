/* Ordre del Mestre, 261004 (prompt 261004_0515; D-A i T6) · Les props
   opcionals noves de PageFrame i l'autor per defecte enllaçat al projecte:
   · accioPrincipal: dins del bloc del títol, després de les etiquetes i abans
     del copyright (el «botonaco» de Publicar davall de l'H1);
   · refTitol: el focus a l'H1, amb tabIndex -1 només quan es passa;
   · traduccio={false}: Traduir avisa i el servei no rep res;
   · telemetria={{ comptar: false }}: el Connectar de la barra no compta;
   · T6: sense nom propi, la barra signa «Sóc de Poble» i enllaça al seu
     perfil (Onada 8; abans, a /projecte);
   · D-C: l'etiqueta amb botó porta sp-card-label--amb-accio (substituïx el :has()).
   Sense les props, el DOM de sempre (PageFrame.test.jsx, CAPCALERA_SENSE_RANURA). */
import { createRef } from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn(), ui: { externalConfig: {} } }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate, Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => mocks.ui }));
import { AVIS_PAGINA_SENSE_TRADUCCIO, PageFrame } from './PageFrame.jsx';
import { DEFAULT_AUTHOR } from './UniversalUtils.js';
import { CLAU_APAGADA, ESDEVENIMENT_DOM } from '../../data/telemetria.js';
import { buidaCauTraduccions } from '../PedraSeca/hooks/useTraduccioPagina.js';

const URL_SERVEI = '/wp-json/socdepoble/v1/traduir';
let vistos;
const escolta = (event) => vistos.push(event.detail);
const connectars = () => vistos.filter((intent) => intent.nom === 'connectar');

beforeEach(() => {
  vi.clearAllMocks();
  vistos = [];
  mocks.ui = { externalConfig: { traductorUrl: URL_SERVEI } };
  buidaCauTraduccions();
  window.localStorage.removeItem(CLAU_APAGADA);
  window.umami = { track: vi.fn() };
  window.history.replaceState(null, '', '/app/lector');
  window.addEventListener(ESDEVENIMENT_DOM, escolta);
});
afterEach(() => {
  cleanup();
  window.removeEventListener(ESDEVENIMENT_DOM, escolta);
  delete window.umami;
  vi.unstubAllGlobals();
});

const LABELS = ['Sistema', { text: 'Mur', className: 'sdp-badge-system' }];
const fills = (element) => [...element.children].map((e) => `${e.tagName}.${e.className}`);
/* Norma dels logotips (ordre del Mestre, 261004) · Sense autor, la pàgina
   signa Sóc de Poble i porta el seu logotip (clar i fosc) davant de l'H1
   (PageFrame.logo.test.jsx). Una persona no en porta cap. */
const LOGOS_SDP = ['IMG.page-title-logo light-only', 'IMG.page-title-logo dark-only'];
const PERSONA = { authorName: 'Pepa', authorHref: '/gent/pepa' };

describe('accioPrincipal', () => {
  /* Derogat en part (ordre del Mestre, 261004): abans el bloc començava per
     l'H1; signant Sóc de Poble, ara hi va primer el seu logotip. L'ordre de
     l'H1, les etiquetes, l'acció i el copyright no canvia. */
  test('va dins del bloc del títol: logotip, H1, etiquetes, l’acció i el copyright, en este ordre', () => {
    const { container } = render(<PageFrame title="Publicar al Mur" labels={LABELS} copyright="CC BY-NC-SA 4.0 Sóc de Poble"
      accioPrincipal={<a href="/notes" className="sdp-boto">Publicar</a>} />);
    const capcalera = container.querySelector('header.page-title');
    expect(fills(capcalera)).toEqual([
      ...LOGOS_SDP, 'H1.', 'UL.sp-card-labels page-title-labels', 'DIV.page-title-accio', 'P.sp-card-copyright page-title-copyright'
    ]);
    expect(capcalera.querySelector('.page-title-accio > a').getAttribute('href')).toBe('/notes');
  });

  test('amb la classificació de l’editor, l’acció va després de la classificació', () => {
    const { container } = render(<PageFrame title="T" classificacio={<span>b</span>} accioPrincipal={<span>a</span>} />);
    expect(fills(container.querySelector('header.page-title'))).toEqual([...LOGOS_SDP, 'H1.', 'DIV.page-title-classificacio', 'DIV.page-title-accio']);
  });

  /* Derogat en part (ordre del Mestre, 261004): ara el logotip de Sóc de Poble
     també fa aparéixer el bloc. Que l'acció sola el fa aparéixer es prova amb
     una persona, que no porta logotip. */
  test('l’acció sola ja fa aparéixer el bloc del títol; sense, cap div nou', () => {
    const { container } = render(<PageFrame accioPrincipal={<span>a</span>} {...PERSONA} />);
    expect(fills(container.querySelector('header.page-title'))).toEqual(['DIV.page-title-accio']);
    cleanup();
    const sense = render(<PageFrame title="T" accioPrincipal={null} {...PERSONA} />).container;
    expect(sense.querySelector('.page-title-accio')).toBeNull();
    expect(fills(sense.querySelector('header.page-title'))).toEqual(['H1.']);
    cleanup();
    const sdp = render(<PageFrame title="T" accioPrincipal={null} />).container;
    expect(fills(sdp.querySelector('header.page-title'))).toEqual([...LOGOS_SDP, 'H1.']);
  });
});

describe('refTitol', () => {
  test('amb ref, l’H1 el rep i porta tabIndex -1 per a rebre el focus', () => {
    const ref = createRef();
    const { container } = render(<PageFrame title="Notícia" refTitol={ref} />);
    const h1 = container.querySelector('header.page-title h1');
    expect(ref.current).toBe(h1);
    expect(h1.getAttribute('tabindex')).toBe('-1');
    act(() => { ref.current.focus(); });
    expect(document.activeElement).toBe(h1);
  });

  test('sense ref, l’H1 de sempre: sense tabindex', () => {
    const { container } = render(<PageFrame title="Notícia" />);
    expect(container.querySelector('header.page-title h1').hasAttribute('tabindex')).toBe(false);
  });
});

/* Onada 8 (261009) · L'autor per defecte enllaça al perfil de Sóc de Poble
   (DEFAULT_AUTHOR.href, '/empresa/socdepoble'), ja no a /projecte. */
describe('T6 · l’autor per defecte enllaça al perfil de Sóc de Poble', () => {
  const autor = (container) => container.querySelector('section.bar-orange').firstElementChild;

  test('sense nom propi: «Sóc de Poble» i un enllaç al seu perfil', () => {
    const { container } = render(<PageFrame chrome="context" title="Pàgina" />);
    expect(autor(container).tagName).toBe('A');
    expect(autor(container).getAttribute('href')).toBe('/empresa/socdepoble');
    expect(autor(container).getAttribute('href')).toBe(DEFAULT_AUTHOR.href);
    expect(autor(container).querySelector('.sp-card-author-name').textContent).toBe(DEFAULT_AUTHOR.name);
  });

  test('una ruta nul·la explícita amb l’autor per defecte també porta al seu perfil', () => {
    const { container } = render(<PageFrame chrome="context" title="Pàgina" authorHref={null} />);
    expect(autor(container).getAttribute('href')).toBe(DEFAULT_AUTHOR.href);
  });

  test('Onada 8 · una ruta vella /projecte enllaça al perfil i continua portant el logotip', () => {
    const { container } = render(<PageFrame chrome="context" title="Pàgina" authorHref="/projecte" />);
    expect(autor(container).getAttribute('href')).toBe(DEFAULT_AUTHOR.href);
    expect(container.querySelector('header.page-title img')).not.toBeNull();
  });

  test('una ruta pròpia mana, també la de topBarData', () => {
    let { container } = render(<PageFrame chrome="context" title="Pàgina" authorHref="/gent/javillinares" />);
    expect(autor(container).getAttribute('href')).toBe('/gent/javillinares');
    cleanup();
    ({ container } = render(<PageFrame chrome="context" title="Pàgina" topBarData={{ authorHref: '/empresa/forn' }} />));
    expect(autor(container).getAttribute('href')).toBe('/empresa/forn');
  });

  test('amb un nom propi i sense ruta, no s’endevina res: la boina no enllaça', () => {
    let { container } = render(<PageFrame chrome="context" title="Pàgina" authorName="Pepa" />);
    expect(autor(container).tagName).toBe('DIV');
    cleanup();
    ({ container } = render(<PageFrame chrome="context" title="Pàgina" topBarData={{ authorName: 'Foraster' }} />));
    expect(autor(container).tagName).toBe('DIV');
    cleanup();
    /* Un nom nul explícit es pinta buit, com abans, i no signa per defecte. */
    ({ container } = render(<PageFrame chrome="context" title="Pàgina" authorName={null} />));
    expect(autor(container).tagName).toBe('DIV');
    expect(autor(container).querySelector('.sp-card-author-name').textContent).toBe('');
  });

  test('a l’app nativa (capacitor://localhost) la boina del projecte també enllaça', () => {
    vi.stubGlobal('location', { origin: 'capacitor://localhost', protocol: 'capacitor:', host: 'localhost', hostname: 'localhost',
      href: 'capacitor://localhost/page/x', pathname: '/page/x', search: '', hash: '' });
    const { container } = render(<PageFrame chrome="context" title="Pàgina" />);
    expect(autor(container).getAttribute('href')).toBe(DEFAULT_AUTHOR.href);
  });
});

describe('D-C · l’etiqueta amb botó porta la seua classe (sense :has())', () => {
  test('només l’etiqueta amb onClick porta sp-card-label--amb-accio', () => {
    const { container } = render(<PageFrame title="T" labels={['Sistema', { text: 'Carpeta', className: 'sdp-badge-category', onClick: () => {} },
      { text: 'Mur', className: 'sdp-badge-system', href: '/mur' }]} />);
    const classes = [...container.querySelectorAll('.page-title-labels > li')].map((li) => li.className);
    expect(classes).toEqual([
      'sp-card-label sdp-badge-tag', 'sp-card-label sdp-badge-category sp-card-label--amb-accio', 'sp-card-label sdp-badge-system'
    ]);
    expect(container.querySelector('.sp-card-label--amb-accio > button.sp-card-label__action').textContent).toBe('Carpeta');
  });
});

describe('D-A · traduccio={false} i telemetria={{ comptar: false }}', () => {
  const traduir = (container) => container.querySelector('header.bar-blue button[aria-label="Traduir"]');
  const connectar = (container) => container.querySelector('header.bar-blue .btn-connectar.sp-card-connect');

  test('sense la prop, Traduir obri el menú de llengües (el Traductor Sobirà de sempre)', () => {
    const { container } = render(<PageFrame chrome="full" title="Notícia" />);
    fireEvent.click(traduir(container));
    expect(traduir(container).getAttribute('aria-expanded')).toBe('true');
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  test('amb traduccio={false}, Traduir avisa, no obri cap menú i el servei no rep res', () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const { container } = render(<PageFrame chrome="full" title="Notícia" traduccio={false}><p>Text de l’article.</p></PageFrame>);
    fireEvent.click(traduir(container));
    expect(mocks.toast).toHaveBeenCalledWith(AVIS_PAGINA_SENSE_TRADUCCIO);
    expect(container.querySelector('[role="menu"]')).toBeNull();
    expect(document.querySelector('[role="menu"]')).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
    expect(container.querySelector('.sdp-avis-traduccio')).toBeNull();
    expect(container.querySelectorAll('article.content-wrapper')).toHaveLength(1);
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  test('un onTranslate propi continua manant amb traduccio={false}', () => {
    const onTranslate = vi.fn();
    const { container } = render(<PageFrame chrome="full" title="Notícia" traduccio={false} onTranslate={onTranslate} />);
    fireEvent.click(traduir(container));
    expect(onTranslate).toHaveBeenCalledTimes(1);
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  test('showShare={false} amaga Compartir de la barra blava; sense la prop, hi és', () => {
    let { container } = render(<PageFrame chrome="full" title="Notícia" />);
    expect(container.querySelector('header.bar-blue button[aria-label="Compartir"]')).not.toBeNull();
    cleanup();
    ({ container } = render(<PageFrame chrome="full" title="Notícia" showShare={false} />));
    expect(container.querySelector('header.bar-blue button[aria-label="Compartir"]')).toBeNull();
    expect(traduir(container)).not.toBeNull();
  });

  test('el Connectar de la barra compta per defecte; amb { comptar: false }, fa la seua acció i no compta', () => {
    let { container } = render(<PageFrame chrome="full" title="Notícia" />);
    fireEvent.click(connectar(container));
    expect(connectars()).toHaveLength(1);
    expect(connectars()[0].dades.origen).toBe('pagina');
    cleanup();
    vistos = [];
    window.umami.track.mockClear();
    mocks.navigate.mockClear();
    ({ container } = render(<PageFrame chrome="full" title="Notícia" telemetria={{ comptar: false }} />));
    fireEvent.click(connectar(container));
    expect(connectars()).toHaveLength(0);
    expect(window.umami.track).not.toHaveBeenCalled();
    expect(mocks.navigate).toHaveBeenCalledTimes(1);
  });
});
