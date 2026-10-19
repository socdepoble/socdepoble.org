/**
 * P5 · Onada 4 · Les portes d'UniversalCard (PortesTargeta.jsx): la targeta
 * de doble acció del Panell de Control.
 *
 * ESMENA 261003 22:34 (directrius 261003_2234 i 261003_2245 del Mestre,
 * transmeses per MarIA) · La targeta amb portes ja no és una variant
 * compacta: és la UniversalCard estàndard, amb l'anatomia sencera (boina
 * d'autoria, imatge, títol, subtítol i entradilla visibles) i les dues portes
 * al final del cos. El nom del fitxer és el de P5 («vinyeta»): este torn no
 * pot moure fitxers.
 *
 * Llei del Píxel (PRD §8) · Sense `portes`, el DOM de les variants de sempre
 * és el d'abans, byte a byte. Les instantànies d'este fitxer es van escriure
 * amb UniversalCard.jsx tal com era ABANS de P5: si una canvia, la targeta de
 * sempre ha canviat.
 *
 * W4-07 (auditoria de Codex 261003_1950) · La ruta interna d'una porta no
 * depén del protocol de la finestra: /mur?x=1#punt és una porta oberta amb
 * origen https, http i capacitor://localhost. Una contrabarra, un caràcter de
 * control o una autoritat «//» la deixen inerta. Un clic modificat es queda
 * amb el navegador (la política de Link i de l'interceptor d'enllaços).
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../../app/contexts/RouterContext';
import { fixaBaseRecursos } from '../../../config/assetResolver.js';
import { objecteDePagina } from '../../../config/objecteConnectable.js';
import { isSafeUrl } from '../../universal/UniversalUtils';
import { TEXTOS_COMENTAR } from '../../universal/barres/BarraBlava.jsx';

const mocks = vi.hoisted(() => ({ toast: vi.fn() }));
vi.mock('../../universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));

import { UniversalCard, midaDelPreu } from './UniversalCard.jsx';
import { PortaDePagina, PortesTargeta, esRutaDeLaPorta, normalitzaPortes } from './PortesTargeta.jsx';
import { MAX_PORTES } from './limitsPortes.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const html = (props) => {
  const { container } = render(
    <MemoryRouter rutaInicial="/mur">
      <UniversalCard {...props} />
    </MemoryRouter>
  );
  const sortida = container.innerHTML;
  cleanup();
  return sortida;
};

/* Les variants de sempre amb el que porten a l'app: el Mur (capçalera,
   imatge, etiquetes, peu i enllaç), el Control i la Consola (action amb
   icona i clic), la targeta plana del Bloc (emoticona i actual), l'acollida
   i el Mercat (preu i data). */
const CASOS = {
  mur: {
    title: 'Fira del Porrat.', subtitle: 'Dissabte a la plaça', body: 'Porta el teu cistell.',
    imageUrl: '/assets/mur/fira.jpg', imageAlt: 'La plaça plena',
    labels: ['festes', { text: 'Mur', className: 'sdp-badge-system', href: '/mur' }, null],
    author: 'Pepa', authorHref: '/gent/pepa', location: 'La Torre', avatarUrl: '/assets/pepa.png',
    time: '10:05', date: '30/09/26', dateTime: '2026-09-30T10:05:00+02:00',
    mainHref: '/mur/p1', hasFooter: true
  },
  action: {
    variant: 'action', title: 'Snippet', subtitle: 'Extensió de Chrome per a desar webs al Bloc',
    imageUrl: '/assets/nano_cards/snippet_nano_card.jpg', onMainClick: () => {},
    labels: [{ text: 'EN OBRES', className: 'sdp-badge-tag' }], className: 'sp-card'
  },
  accioAmbIcona: {
    variant: 'action', title: 'Publicar al Mapa', subtitle: 'Geolocalitzar imatges i llocs d’interès',
    icon: <svg className="icona-de-prova" />, labels: [{ text: 'EN OBRES', className: 'sdp-badge-tag' }]
  },
  pla: {
    variant: 'pla', emoticona: '🍅', title: 'Planter de tomaques', subtitle: 'Quan el sembrem',
    body: 'El dissabte a la plaça.', time: '09:00', date: '12/10/26', dateTime: '2026-10-12T09:00',
    onDateTime: false, actual: true, mainHref: '/notes?nota=n1', hasFooter: true, showConnect: true
  },
  onboarding: { variant: 'onboarding', title: 'Benvinguda', body: <p>Hola</p>, hasFooter: false },
  mercat: {
    title: 'Samarreta', squareBadge: { type: 'price', value: '15 €' },
    calendarBadge: { dia: '14', mes: 'AGOST', any: '2026', dateTime: '2026-08-14' },
    labels: [{ text: 'Mercat', className: 'sdp-badge-system' }], showShare: true, isAvis: true
  }
};

describe('Llei del Píxel · sense portes, el DOM de sempre', () => {
  /* Ordre del Mestre (261007) · «Comentaris = xat» · L'única diferència de les
     instantànies amb peu és que Comentar diu que obri un menú
     (aria-haspopup="menu" i aria-expanded="false"): cap píxel canvia. */
  test('mur', () => {
    expect(html(CASOS.mur)).toMatchInlineSnapshot(`"<article class="sp-card"><header class="sp-card-header"><a href="/gent/pepa" class="sp-card-author-link"><span class="sp-card-author"><img alt="" class="sp-card-avatar" src="/assets/pepa.png" width="48" height="48"><span class="sp-card-author-info"><span class="sp-card-author-name">Pepa</span><span class="sp-card-author-location">La Torre</span></span></span></a><div class="sp-card-meta"><button type="button" class="btn-date-time" aria-label="10:05 30/09/26 · Obri el calendari d’eixe mes" title="10:05 30/09/26 · Obri el calendari d’eixe mes"><span>10:05</span><span>30/09/26</span></button></div></header><a href="/mur/p1" class="sp-card-link-overlay" aria-label="Fira del Porrat."></a><div class="sp-card-media-container"><img class="sp-card-media" src="/assets/mur/fira.jpg" alt="La plaça plena" loading="lazy" decoding="async"></div><div class="sp-card-body"><h3 class="sp-card-title">Fira del Porrat</h3><h4 class="sp-card-subtitle">Dissabte a la plaça</h4><p class="sp-card-text">Porta el teu cistell.</p><ul class="sp-card-labels" aria-label="Categories"><li class="sp-card-label sdp-badge-tag">festes</li><li class="sp-card-label sdp-badge-system"><a href="/mur" class="sp-card-label">Mur</a></li></ul></div><footer class="sp-card-footer"><div class="sp-card-actions"><button type="button" class="sp-card-action" aria-label="Traduir Fira del Porrat." title="Traduir Fira del Porrat."><svg class="icon" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m5 8 6 6"></path><path d="m4 14 6-6 2-3"></path><path d="M2 5h12"></path><path d="M7 2h1"></path><path d="m22 22-5-10-5 10"></path><path d="M14 18h6"></path></svg></button><button type="button" class="sp-card-action" aria-label="Comentar Fira del Porrat." title="Comentar Fira del Porrat." aria-haspopup="menu" aria-expanded="false"><svg class="icon" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path></svg></button><button type="button" class="sp-card-action" aria-label="Compartir Fira del Porrat." title="Compartir Fira del Porrat."><svg class="icon" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line></svg></button></div><button type="button" class="btn-connectar sp-card-connect" aria-label="Connectar amb Fira del Porrat." title="Connectar amb Fira del Porrat."><span class="sp-card-connect-text">Connectar</span><span class="sp-card-connect-plus" aria-hidden="true">+</span></button></footer></article>"`);
  });
  test('action', () => {
    expect(html(CASOS.action)).toMatchInlineSnapshot(`"<article class="sp-card sp-card--action sp-card"><button type="button" class="sp-card-link-overlay" aria-label="Snippet"></button><div class="sp-card-media-container"><img class="sp-card-media" src="/assets/nano_cards/snippet_nano_card.jpg" alt="" loading="lazy" decoding="async"></div><div class="sp-card-body"><h3 class="sp-card-title">Snippet</h3><h4 class="sp-card-subtitle">Extensió de Chrome per a desar webs al Bloc</h4><ul class="sp-card-labels" aria-label="Categories"><li class="sp-card-label sdp-badge-tag">EN OBRES</li></ul></div></article>"`);
  });
  test('action amb icona', () => {
    expect(html(CASOS.accioAmbIcona)).toMatchInlineSnapshot(`"<article class="sp-card sp-card--action"><div class="sp-card-body"><div class="sp-card-heading-with-icon"><span class="sp-card-title-icon"><svg class="icona-de-prova"></svg></span><h3 class="sp-card-title">Publicar al Mapa</h3></div><h4 class="sp-card-subtitle">Geolocalitzar imatges i llocs d’interès</h4><ul class="sp-card-labels" aria-label="Categories"><li class="sp-card-label sdp-badge-tag">EN OBRES</li></ul></div></article>"`);
  });
  test('pla', () => {
    expect(html(CASOS.pla)).toMatchInlineSnapshot(`"<article class="sp-card sp-card--pla"><header class="sp-card-header sp-card-header--amb-emoticona"><span class="sdp-emoticona-barra sdp-emoticona-barra--glif" role="img" aria-label="Emoticona del document: 🍅"><span class="sdp-emoticona-barra__glif" aria-hidden="true">🍅</span></span><div class="sp-card-meta"><time class="btn-date-time" datetime="2026-10-12T09:00" aria-label="Data i hora: 09:00: 12/10/26"><span>09:00</span><span>12/10/26</span></time></div></header><a href="/notes?nota=n1" class="sp-card-link-overlay" aria-label="Planter de tomaques" aria-current="true"></a><div class="sp-card-body"><h3 class="sp-card-title">Planter de tomaques</h3><h4 class="sp-card-subtitle">Quan el sembrem</h4><p class="sp-card-text">El dissabte a la plaça.</p></div><footer class="sp-card-footer"><div class="sp-card-actions"><button type="button" class="sp-card-action" aria-label="Traduir Planter de tomaques" title="Traduir Planter de tomaques"><svg class="icon" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m5 8 6 6"></path><path d="m4 14 6-6 2-3"></path><path d="M2 5h12"></path><path d="M7 2h1"></path><path d="m22 22-5-10-5 10"></path><path d="M14 18h6"></path></svg></button><button type="button" class="sp-card-action" aria-label="Comentar Planter de tomaques" title="Comentar Planter de tomaques" aria-haspopup="menu" aria-expanded="false"><svg class="icon" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path></svg></button><button type="button" class="sp-card-action" aria-label="Compartir Planter de tomaques" title="Compartir Planter de tomaques"><svg class="icon" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line></svg></button></div><button type="button" class="btn-connectar sp-card-connect" aria-label="Connectar amb Planter de tomaques" title="Connectar amb Planter de tomaques"><span class="sp-card-connect-text">Connectar</span><span class="sp-card-connect-plus" aria-hidden="true">+</span></button></footer></article>"`);
  });
  test('onboarding', () => {
    expect(html(CASOS.onboarding)).toMatchInlineSnapshot(`"<article class="sp-card sp-card--onboarding"><div class="sp-card-body"><h3 class="sp-card-title">Benvinguda</h3><div class="sp-card-text"><p>Hola</p></div></div></article>"`);
  });
  /* P6 (directriu 2325) · L'única diferència d'esta instantània és el tram de
     lletra del preu (data-mida), perquè «1.250,00 €» càpia al quadrat: canvi
     volgut, no una regressió. */
  test('mercat', () => {
    expect(html(CASOS.mercat)).toMatchInlineSnapshot(`"<article class="sp-card sp-card--avis"><div class="sp-card-body has-calendar-badge has-aside"><div class="sp-card-calendar-badge" aria-label="Preu: 15 €"><span class="sp-card-calendar-badge__dia" data-oversized="true" data-mida="mitjana">15 €</span></div><h3 class="sp-card-title">Samarreta</h3><ul class="sp-card-labels" aria-label="Categories"><li class="sp-card-label sdp-badge-system">Mercat</li></ul></div><footer class="sp-card-footer"><div class="sp-card-actions"><button type="button" class="sp-card-action" aria-label="Compartir Samarreta" title="Compartir Samarreta"><svg class="icon" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line></svg></button></div></footer></article>"`);
  });
});

/* ── La targeta de doble acció (directrius 2234 i 2245) ─────────────── */

/* On és el router en memòria: el de WordPress, mai window.location. */
function Ubicacio() {
  const { pathname, search } = useLocation();
  return <output data-testid="ubicacio">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}
const ubicacio = () => screen.getByTestId('ubicacio').textContent;

const PORTES_MUR = [
  { id: 'publicar', verb: 'Publicar', nom: 'Publicar al Mur', desti: '/notes', varietat: 'primari' },
  { id: 'saber', verb: 'Saber-ne més', nom: 'Saber-ne més sobre el Mur', desti: '/page/publicar_mur', varietat: 'secundari' }
];
const PORTES_MAPA = [
  { id: 'publicar', verb: 'Publicar', nom: 'Publicar al Mapa', desti: null, varietat: 'primari' },
  { id: 'saber', verb: 'Saber-ne més', nom: 'Saber-ne més sobre el Mapa', desti: null, varietat: 'secundari' }
];

/* La boina de les targetes de sistema: l'entitat socdepoble, que porta al
   seu xat corporatiu (directriu 2234, punt 3). */
const AUTORIA = {
  author: 'Sóc de Poble', location: 'La Torre de les Maçanes',
  avatarUrl: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg', authorHref: '/xat?amb=socdepoble',
  time: '22:45', date: '03/10/26', dateTime: '2026-10-03T22:45:00+02:00'
};

const pintaTargeta = (props = {}, { basename = '' } = {}) => render(
  <MemoryRouter rutaInicial="/control" basename={basename}>
    <UniversalCard
      title="Publicar al Mur"
      subtitle="Comparteix pensaments, notícies o fotografies amb tot el veïnat."
      body="Tot el que escrigues al mur principal serà el cor de la plaça digital."
      imageUrl="/assets/nano_cards/mur_nano_card.jpg"
      {...AUTORIA}
      portes={PORTES_MUR}
      {...props}
    />
    <Ubicacio />
  </MemoryRouter>
);
const targeta = () => document.querySelector('article.sp-card');
const avisos = () => vi.spyOn(console, 'warn').mockImplementation(() => {});

beforeEach(() => { mocks.toast.mockReset(); });

describe('La targeta de doble acció: la UniversalCard estàndard amb dues portes', () => {
  test('anatomia sencera: boina de socdepoble, imatge, títol, subtítol i entradilla visibles, i les portes al final del cos', () => {
    pintaTargeta();
    /* Cap variant pròpia: la targeta de sempre. */
    expect(targeta().className).toBe('sp-card');
    const capcal = targeta().querySelector('header.sp-card-header');
    expect(capcal.querySelector('a.sp-card-author-link').getAttribute('href')).toBe('/xat?amb=socdepoble');
    expect(within(capcal).getByText('Sóc de Poble').classList.contains('sp-card-author-name')).toBe(true);
    expect(within(capcal).getByText('La Torre de les Maçanes')).toBeTruthy();
    /* La imatge és decorativa: el nom el donen el títol i les portes. */
    expect(targeta().querySelector('img.sp-card-media').getAttribute('alt')).toBe('');
    const titol = screen.getByRole('heading', { level: 3, name: 'Publicar al Mur' });
    expect(titol.classList.contains('sdp-sr-only')).toBe(false);
    /* El subtítol és el h4 de sempre, visible i sense el punt final (llevaPuntFinal). */
    const subtitol = screen.getByRole('heading', { level: 4 });
    expect([subtitol.textContent, subtitol.className]).toEqual(['Comparteix pensaments, notícies o fotografies amb tot el veïnat', 'sp-card-subtitle']);
    expect(targeta().querySelector('p.sp-card-text').textContent).toBe('Tot el que escrigues al mur principal serà el cor de la plaça digital.');
    const cos = targeta().querySelector('.sp-card-body');
    expect(cos.lastElementChild.className).toBe('sp-card-portes');
    expect([...cos.children].map((fill) => fill.className)).toEqual(['sp-card-title', 'sp-card-subtitle', 'sp-card-text', 'sp-card-portes']);
  });

  /* P6 (directriu 2325, confirmació 2) · Abans: amb portes, ni overlay ni
     peu. Ara el peu blau es pinta com a tota targeta; l'overlay continua sense
     eixir, i en DEV només avisa onMainClick, que no fa res (mainHref és la
     pàgina del peu). */
  test('amb portes no hi ha enllaç de tota la targeta, però sí el peu; en DEV avisa que onMainClick no fa res', () => {
    const avis = avisos();
    pintaTargeta({ mainHref: '/mur/p1', onMainClick: vi.fn(), hasFooter: true, showConnect: false });
    expect(targeta().querySelector('.sp-card-link-overlay')).toBeNull();
    expect([...targeta().querySelectorAll('.sp-card-footer .sp-card-action')].map((boto) => boto.getAttribute('aria-label'))).toEqual([
      'Traduir Publicar al Mur', 'Comentar Publicar al Mur', 'Compartir Publicar al Mur'
    ]);
    expect(targeta().querySelector('.sp-card-connect')).toBeNull();
    expect(avis.mock.calls.some(([missatge]) => String(missatge).includes('onMainClick no fa res'))).toBe(true);
    avis.mockClear();
    cleanup();
    pintaTargeta({ mainHref: '/page/publicar_mur', hasFooter: true });
    expect(avis).not.toHaveBeenCalled();
    avis.mockRestore();
  });

  test('dues portes amb el nom sencer, que conté el text visible; Publicar en primari i Saber-ne més en secundari', () => {
    pintaTargeta();
    const publicar = screen.getByRole('link', { name: 'Publicar al Mur' });
    const saber = screen.getByRole('link', { name: 'Saber-ne més sobre el Mur' });
    /* El verb es veu; la resta és per a lector, sense aria-label (WCAG 2.5.3). */
    for (const [porta, verb, resta] of [[publicar, 'Publicar', 'al Mur'], [saber, 'Saber-ne més', 'sobre el Mur']]) {
      expect(porta.querySelector('span:not(.sdp-sr-only)').textContent).toBe(verb);
      expect(porta.querySelector('.sdp-sr-only').textContent).toBe(resta);
      expect(porta.hasAttribute('aria-label')).toBe(false);
    }
    expect(publicar.className).toBe('sdp-boto sdp-boto--primari sp-card-porta');
    expect(saber.className).toBe('sdp-boto sdp-boto--secundari sp-card-porta');
    expect(publicar.parentElement).toBe(saber.parentElement);
    expect(publicar.parentElement.className).toBe('sp-card-portes');
  });

  test('l’ordre del DOM i del focus: l’autor, la data, Publicar i Saber-ne més; cap tabindex, i la imatge no és cap parada', () => {
    pintaTargeta();
    const parades = [...targeta().querySelectorAll('a[href], button, [tabindex]')];
    expect(parades.map((el) => el.getAttribute('class'))).toEqual([
      'sp-card-author-link', 'btn-date-time',
      'sdp-boto sdp-boto--primari sp-card-porta', 'sdp-boto sdp-boto--secundari sp-card-porta'
    ]);
    expect(targeta().querySelectorAll('[tabindex]')).toHaveLength(0);
    const imatge = targeta().querySelector('.sp-card-media-container');
    expect(imatge.hasAttribute('role')).toBe(false);
    expect(imatge.hasAttribute('tabindex')).toBe(false);
  });

  /* Directriu 2234, punt 3 · Tocar l'autor (tret de la data i l'hora) porta
     al xat corporatiu de socdepoble, amb el router de l'app. */
  test('l’autor obri el xat de socdepoble amb el router; la data porta al Calendari, no al xat', () => {
    const abans = window.location.href;
    pintaTargeta();
    fireEvent.click(targeta().querySelector('a.sp-card-author-link'));
    expect(ubicacio()).toBe('/xat?amb=socdepoble');
    cleanup();
    pintaTargeta();
    const data = targeta().querySelector('.sp-card-meta button.btn-date-time');
    expect(data.closest('a')).toBeNull();
    fireEvent.click(data);
    expect(ubicacio()).toBe('/calendari?mes=2026-10');
    expect(window.location.href).toBe(abans);
  });

  test('una porta amb destí navega amb el router de l’app, sense tocar window.location', () => {
    const abans = window.location.href;
    pintaTargeta();
    fireEvent.click(screen.getByRole('link', { name: 'Publicar al Mur' }));
    expect(ubicacio()).toBe('/notes');
    fireEvent.click(screen.getByRole('link', { name: 'Saber-ne més sobre el Mur' }));
    expect(ubicacio()).toBe('/page/publicar_mur');
    expect(window.location.href).toBe(abans);
  });

  test('tocar la imatge, el títol o l’entradilla no fa res: només són interactius l’autor, la data i les portes', () => {
    pintaTargeta();
    for (const zona of ['.sp-card-media-container', '.sp-card-media', '.sp-card-title', '.sp-card-text', '.sp-card-portes']) {
      fireEvent.click(targeta().querySelector(zona));
      expect(ubicacio(), zona).toBe('/control');
    }
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  test('un destí insegur o de fora de l’app no es pinta com a enllaç: la porta queda inerta', () => {
    for (const desti of ['javascript:alert(1)', 'https://altra.example/x', '//altra.example/x', 'notes']) {
      pintaTargeta({ portes: [{ id: 'publicar', verb: 'Publicar', nom: 'Publicar al Mur', desti, varietat: 'primari' }] });
      expect(targeta().querySelector('.sp-card-portes a'), desti).toBeNull();
      expect(screen.getByRole('button', { name: 'Publicar al Mur (en obres)' }).getAttribute('aria-disabled'), desti).toBe('true');
      cleanup();
    }
  });

  /* Revisió adversarial de P5 · «/\altra…» comença per una sola barra, però
     el navegador llig la contrabarra com una barra: és «//altra.example», un
     altre lloc. Una porta només obri camins de l'app. */
  test('un camí amb contrabarra és d’un altre lloc: la porta queda inerta', () => {
    for (const desti of ['/\\altra.example/x', '/\t\\altra.example/x', '/\\\\altra.example']) {
      pintaTargeta({ portes: [{ id: 'publicar', verb: 'Publicar', nom: 'Publicar al Mur', desti, varietat: 'primari' }] });
      expect(targeta().querySelector('.sp-card-portes a'), JSON.stringify(desti)).toBeNull();
      cleanup();
    }
    expect(normalitzaPortes([{ verb: 'Publicar', desti: '/\\altra.example/x' }])[0].desti).toBeNull();
    /* Els camins de l'app, amb consulta o sense, continuen oberts. */
    expect(normalitzaPortes([{ verb: 'Publicar', desti: '/notes?carpeta=f-mur' }])[0].desti).toBe('/notes?carpeta=f-mur');
    expect(normalitzaPortes([{ verb: 'Publicar', desti: '/mur' }])[0].desti).toBe('/mur');
  });

  test('sense destí: button aria-disabled, enfocable i no :disabled; en prémer-lo avisa i no navega', () => {
    pintaTargeta({ title: 'Publicar al Mapa', imageUrl: undefined, portes: PORTES_MAPA });
    const porta = screen.getByRole('button', { name: 'Publicar al Mapa (en obres)' });
    expect(porta.getAttribute('aria-disabled')).toBe('true');
    expect(porta.matches(':disabled')).toBe(false);
    porta.focus();
    expect(document.activeElement).toBe(porta);
    /* Una porta inerta és sempre secundària, i la icona d'obres no es llig. */
    expect(porta.className).toBe('sdp-boto sdp-boto--secundari sp-card-porta');
    expect(porta.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
    fireEvent.click(porta);
    expect(mocks.toast).toHaveBeenCalledWith('“Publicar al Mapa” encara està en obres.');
    expect(ubicacio()).toBe('/control');
    expect(screen.getByRole('button', { name: 'Saber-ne més sobre el Mapa (en obres)' })).toBeTruthy();
  });

  test('com a màxim dues portes: la tercera no es pinta i en DEV ho avisa', () => {
    const avis = avisos();
    const tres = [...PORTES_MUR, { id: 'compartir', verb: 'Compartir', nom: 'Compartir el Mur', desti: '/mur' }];
    pintaTargeta({ portes: tres });
    expect(targeta().querySelectorAll('.sp-card-porta')).toHaveLength(MAX_PORTES);
    expect(MAX_PORTES).toBe(2);
    expect(screen.queryByRole('link', { name: 'Compartir el Mur' })).toBeNull();
    expect(avis.mock.calls.some(([missatge]) => String(missatge).includes('com a màxim 2 portes'))).toBe(true);
    expect(normalitzaPortes(tres).map((porta) => porta.id)).toEqual(['publicar', 'saber']);
    avis.mockRestore();
    expect(normalitzaPortes(null)).toEqual([]);
    expect(normalitzaPortes([{ id: 'buida', verb: '  ' }, null])).toEqual([]);
  });

  test('incrustada, la imatge i l’avatar pengen del paquet com sempre (resolRecursPropi)', () => {
    const PAQUET = 'https://wp.example/wp-content/plugins/socdepoble-enxufe/dist';
    fixaBaseRecursos(PAQUET);
    try {
      pintaTargeta();
      expect(targeta().querySelector('img.sp-card-media').getAttribute('src')).toBe(`${PAQUET}/assets/nano_cards/mur_nano_card.jpg`);
      expect(targeta().querySelector('img.sp-card-avatar').getAttribute('src')).toBe(`${PAQUET}/assets/system/ui/logo-socdepoble-cuadrat-verd.svg`);
    } finally {
      fixaBaseRecursos('/');
    }
  });

  test('un nom que no continua el verb amb un espai: el verb visible s’amaga al lector i el nom va sencer', () => {
    pintaTargeta({ title: 'Vehicle Compartit', portes: [{ id: 'publicar', verb: 'Publicar', nom: 'Publicar: Vehicle Compartit', desti: null }] });
    const porta = screen.getByRole('button', { name: 'Publicar: Vehicle Compartit (en obres)' });
    const visible = [...porta.querySelectorAll('span')].find((span) => !span.classList.contains('sdp-sr-only'));
    expect(visible.textContent).toBe('Publicar');
    expect(visible.getAttribute('aria-hidden')).toBe('true');
  });

  test('una porta inerta amb textos propis (traduccions): el complement i l’avís', () => {
    pintaTargeta({
      portes: [{
        id: 'publicar', verb: 'Publish', nom: 'Publish on the Map', desti: null,
        enObres: '(under construction)', avis: '“Publish on the Map” is still under construction.'
      }]
    });
    fireEvent.click(screen.getByRole('button', { name: 'Publish on the Map (under construction)' }));
    expect(mocks.toast).toHaveBeenCalledWith('“Publish on the Map” is still under construction.');
  });

  test('sense portes (null o []), la targeta de sempre en cada variant', () => {
    for (const cas of Object.values(CASOS)) {
      const sense = html(cas);
      expect(html({ ...cas, portes: [] })).toBe(sense);
      expect(html({ ...cas, portes: null })).toBe(sense);
    }
  });

  test('PortesTargeta sense cap porta vàlida no pinta res', () => {
    const { container } = render(<MemoryRouter><PortesTargeta portes={[{ verb: '' }]} /></MemoryRouter>);
    expect(container.innerHTML).toBe('');
  });
});

/* ── W4-07 · La frontera de rutes de les portes ─────────────────────────
   Abans la porta validava amb isSafeUrl, que resolia contra
   window.location.origin i només admetia http(s): amb capacitor://localhost
   (l'app nativa) la porta /mur quedava inerta. La finestra es fixa amb
   vi.stubGlobal, i isSafeUrl, que la llig, confirma en cada cas que la
   finestra és de veres eixe origen: des de la Fase C (261019) admet també
   una adreça capacitor:// del host de l'app, però només a l'app nativa. */
const ORIGENS = Object.freeze({
  https: { origin: 'https://socdepoble.org', protocol: 'https:', host: 'socdepoble.org', hostname: 'socdepoble.org', href: 'https://socdepoble.org/control', pathname: '/control', search: '', hash: '' },
  http: { origin: 'http://localhost:3340', protocol: 'http:', host: 'localhost:3340', hostname: 'localhost', href: 'http://localhost:3340/control', pathname: '/control', search: '', hash: '' },
  capacitor: { origin: 'capacitor://localhost', protocol: 'capacitor:', host: 'localhost', hostname: 'localhost', href: 'capacitor://localhost/control', pathname: '/control', search: '', hash: '' }
});
const PORTA_AMB_PUNT = Object.freeze({ id: 'publicar', verb: 'Publicar', nom: 'Publicar al Mur', desti: '/mur?x=1#punt', varietat: 'primari' });
const MAL_FORMATS = [
  'javascript:alert(1)', 'https://altra.example/x', 'http://altra.example', 'capacitor://localhost/mur',
  '//altra.example/x', '/\\altra.example/x', '/\t/altra.example', '/\n/altra.example', '/mur\u0000',
  '/mur\u007F', '/mur x', ' /mur', 'mur', '', null, 42
];

describe.each(Object.keys(ORIGENS))('W4-07 · origen %s', (nom) => {
  beforeEach(() => { vi.stubGlobal('location', ORIGENS[nom]); });

  test('/mur?x=1#punt és una porta oberta i el clic normal navega amb el router', () => {
    /* La finestra és eixe origen: un camí propi passa a totes, i una adreça
       capacitor:// del host de l'app, només a l'app nativa d'iOS. */
    expect(isSafeUrl('/mur')).toBe(true);
    expect(isSafeUrl('capacitor://localhost/mur')).toBe(nom === 'capacitor');
    expect(esRutaDeLaPorta('/mur?x=1#punt')).toBe(true);
    expect(normalitzaPortes([PORTA_AMB_PUNT])[0].desti).toBe('/mur?x=1#punt');
    pintaTargeta({ portes: [PORTA_AMB_PUNT] });
    const porta = screen.getByRole('link', { name: 'Publicar al Mur' });
    expect(porta.getAttribute('href')).toBe('/mur?x=1#punt');
    /* fireEvent torna false quan el clic s'ha cancel·lat: l'ha atés el router. */
    expect(fireEvent.click(porta)).toBe(false);
    expect(ubicacio()).toBe('/mur?x=1');
  });

  test('un destí mal format o de fora de l’app deixa la porta inerta', () => {
    for (const desti of MAL_FORMATS) {
      expect([desti, esRutaDeLaPorta(desti)]).toEqual([desti, false]);
      expect([desti, normalitzaPortes([{ verb: 'Publicar', desti }])[0].desti]).toEqual([desti, null]);
    }
    pintaTargeta({ portes: [{ ...PORTA_AMB_PUNT, desti: '/\\altra.example/x' }] });
    expect(targeta().querySelector('.sp-card-portes a')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Publicar al Mur (en obres)' }));
    expect(ubicacio()).toBe('/control');
  });

  /* Un clic modificat (pestanya o finestra nova, o el botó del mig) es queda
     amb el navegador, com a Link i a l'interceptor d'enllaços: el router no
     el cancel·la ni navega. L'href és la ruta de l'app amb la base del router. */
  test('el clic modificat no el cancel·la ni el navega el router; l’href porta la base', () => {
    pintaTargeta({ portes: [PORTA_AMB_PUNT] }, { basename: '/comunitat' });
    const porta = screen.getByRole('link', { name: 'Publicar al Mur' });
    expect(porta.getAttribute('href')).toBe('/comunitat/mur?x=1#punt');
    for (const modificador of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      expect([modificador, fireEvent.click(porta, modificador)]).toEqual([modificador, true]);
      expect(ubicacio(), JSON.stringify(modificador)).toBe('/control');
    }
    expect(fireEvent.click(porta)).toBe(false);
    expect(ubicacio()).toBe('/mur?x=1');
  });

  /* La boina de la targeta passa per la mateixa frontera: l'autor de
     socdepoble és un enllaç al seu xat també a l'app nativa. */
  test('l’autor amb una ruta de l’app és un enllaç; amb una contrabarra, no', () => {
    pintaTargeta();
    const autor = targeta().querySelector('a.sp-card-author-link');
    expect(autor.getAttribute('href')).toBe('/xat?amb=socdepoble');
    fireEvent.click(autor);
    expect(ubicacio()).toBe('/xat?amb=socdepoble');
    cleanup();
    pintaTargeta({ authorHref: '/\\altra.example/x' });
    expect(targeta().querySelector('a.sp-card-author-link')).toBeNull();
    expect(within(targeta().querySelector('header')).getByText('Sóc de Poble')).toBeTruthy();
  });
});

/* ── P6 · Directriu 261003_2325 del Mestre ───────────────────────────── */

describe('P6 · el preu va al quadrat de 128 px, mai a la píndola', () => {
  const quadrat = () => targeta().querySelector('.sp-card-body > .sp-card-calendar-badge');

  test('price pinta el quadrat (com squareBadge type price) i cap p.sp-card-price', () => {
    render(<MemoryRouter><UniversalCard title="Samarreta" price="15.00€" /></MemoryRouter>);
    expect(targeta().querySelector('.sp-card-price')).toBeNull();
    expect(quadrat().getAttribute('aria-label')).toBe('Preu: 15.00€');
    const xifra = quadrat().querySelector('.sp-card-calendar-badge__dia');
    expect([xifra.textContent, xifra.dataset.oversized, xifra.dataset.mida]).toEqual(['15.00€', 'true', 'menuda']);
    /* has-price es conserva per a qui la mire; el quadrat afig les de sempre. */
    expect(targeta().querySelector('.sp-card-body').className).toBe('sp-card-body has-price has-calendar-badge has-aside');
  });

  test('un preu llarg baixa de tram de lletra; el quadrat no canvia de mida (CSS)', () => {
    render(<MemoryRouter><UniversalCard title="Motocultor" price="1.250,00 €" /></MemoryRouter>);
    expect(quadrat().querySelector('[data-mida]').dataset.mida).toBe('minima');
    expect(quadrat().textContent).toBe('1.250,00 €');
  });

  test('els trams de midaDelPreu, pels caràcters que es veuen', () => {
    const casos = [
      ['15€', 'gran'], ['9 €', 'gran'], ['15 €', 'mitjana'], ['900€', 'mitjana'], ['15,5€', 'mitjana'],
      ['15.00€', 'menuda'], ['1.250€', 'menuda'], ['900.00€', 'menuda'], ['15,00 €', 'menuda'],
      ['1250.00€', 'minima'], ['1.250,00€', 'minima'], ['12.500,00 €', 'minima'], ['  15€  ', 'gran'], [null, 'gran']
    ];
    expect(casos.map(([valor]) => [valor, midaDelPreu(valor)])).toEqual(casos);
  });

  test('un sol quadrat: mana squareBadge, després price i després calendarBadge', () => {
    const data = { dia: '14', mes: 'AGOST', any: '2026', dateTime: '2026-08-14' };
    render(<MemoryRouter><UniversalCard title="A" price="15 €" calendarBadge={data} /></MemoryRouter>);
    expect(targeta().querySelectorAll('.sp-card-calendar-badge')).toHaveLength(1);
    expect(quadrat().getAttribute('aria-label')).toBe('Preu: 15 €');
    cleanup();
    render(<MemoryRouter><UniversalCard title="B" price="15 €" squareBadge={{ type: 'custom', label: 'Vehicle', content: <svg /> }} /></MemoryRouter>);
    expect(targeta().querySelectorAll('.sp-card-calendar-badge')).toHaveLength(1);
    expect(quadrat().getAttribute('aria-label')).toBe('Vehicle');
    cleanup();
    render(<MemoryRouter><UniversalCard title="C" calendarBadge={data} /></MemoryRouter>);
    expect(quadrat().tagName).toBe('TIME');
  });
});

describe('P6 · el peu blau de la targeta amb portes porta a la seua pàgina', () => {
  const PAGINA = '/page/publicar_mur';
  const ambPeu = (extra = {}, opcions) => pintaTargeta({
    mainHref: PAGINA,
    objecte: objecteDePagina({ titol: 'Publicar al Mur', ruta: PAGINA, id: PAGINA }),
    hasFooter: true,
    showConnect: false,
    ...extra
  }, opcions);
  const accio = (verb) => screen.getByRole('button', { name: `${verb} Publicar al Mur` });

  afterEach(() => { delete navigator.share; });

  test('Traduir, Comentar i Compartir, en eixe ordre, al final de la targeta, i cap Connectar', () => {
    ambPeu();
    expect(targeta().lastElementChild.className).toBe('sp-card-footer');
    expect([...targeta().querySelectorAll('.sp-card-footer button')].map((boto) => boto.getAttribute('aria-label'))).toEqual([
      'Traduir Publicar al Mur', 'Comentar Publicar al Mur', 'Compartir Publicar al Mur'
    ]);
    /* Les portes continuen al cos, i l'overlay no torna. */
    expect(targeta().querySelectorAll('.sp-card-body > .sp-card-portes > .sp-card-porta')).toHaveLength(2);
    expect(targeta().querySelector('.sp-card-link-overlay')).toBeNull();
  });

  test('Traduir porta al traductor de les targetes, com al Mur', () => {
    ambPeu();
    fireEvent.click(accio('Traduir'));
    expect(ubicacio()).toBe('/traduccions');
  });

  /* /page/<clau> no és a la llista tancada de pàgines amb xat comú
     (PAGINES_AMB_XAT, data/contracte.js; pendent del Mestre): «En públic» es
     queda desactivat i no navega. Mai el xat de /control. Amb una pàgina que
     sí que en té, obri el seu: Comentar segueix l'objecte que rep.
     Ordre del Mestre (261007) · Comentar obri el menú de les dues vies; «En
     privat» és el xat amb Sóc de Poble. */
  test('Comentar va a l’objecte de la pàgina: sense xat comú, la via pública desactivada; la privada, Sóc de Poble', () => {
    ambPeu();
    fireEvent.click(accio('Comentar'));
    const publica = screen.getByRole('menuitem', { name: TEXTOS_COMENTAR.public[1] });
    expect(publica.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(publica);
    expect(mocks.toast).not.toHaveBeenCalled();
    expect(ubicacio()).toBe('/control');
    fireEvent.click(screen.getByRole('menuitem', { name: TEXTOS_COMENTAR.privat[1] }));
    expect(ubicacio()).toBe('/xat?amb=socdepoble');
    cleanup();
    ambPeu({ objecte: objecteDePagina({ titol: 'Mur', ruta: '/mur', id: '/mur' }) });
    fireEvent.click(accio('Comentar'));
    fireEvent.click(screen.getByRole('menuitem', { name: TEXTOS_COMENTAR.public[1] }));
    const [cami, consulta] = ubicacio().split('?');
    expect([cami, new URLSearchParams(consulta).get('sobre')]).toEqual(['/xat', 'pagina:/mur']);
  });

  test('Compartir comparteix l’adreça de la pàgina de la targeta, amb la base del router, mai /control', async () => {
    for (const basename of ['', '/comunitat']) {
      const share = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', { value: share, configurable: true });
      ambPeu({}, { basename });
      fireEvent.click(accio('Compartir'));
      await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
      const [{ title, url }] = share.mock.calls[0];
      expect([basename, title, url.endsWith(`${basename}${PAGINA}`), url.includes('/control')]).toEqual([basename, 'Publicar al Mur', true, false]);
      expect(ubicacio()).toBe('/control');
      cleanup();
    }
  });
});

describe('P6 · PortaDePagina: el gran botó Publicar d’una pàgina', () => {
  test('oberta: un enllaç del router, gran, ple i blau, amb el nom sencer; navega amb la base', () => {
    render(
      <MemoryRouter rutaInicial="/page/publicar_mur" basename="/comunitat">
        <PortaDePagina porta={{ id: 'publicar', verb: 'Publicar', nom: 'Publicar al Mur', desti: '/notes', varietat: 'primari' }} />
        <Ubicacio />
      </MemoryRouter>
    );
    const boto = screen.getByRole('link', { name: 'Publicar al Mur' });
    expect(boto.className).toBe('sdp-boto sdp-boto--primari sdp-boto--gran sdp-boto--ple');
    expect(boto.getAttribute('href')).toBe('/comunitat/notes');
    expect(fireEvent.click(boto)).toBe(false);
    expect(ubicacio()).toBe('/notes');
  });

  test('inerta: button aria-disabled, blau i gran, «(en obres)» al nom; avisa i no navega', () => {
    render(
      <MemoryRouter rutaInicial="/page/publicar_mapa">
        <PortaDePagina porta={{ id: 'publicar', verb: 'Publicar', nom: 'Publicar al Mapa', desti: null, varietat: 'primari' }} />
        <Ubicacio />
      </MemoryRouter>
    );
    const boto = screen.getByRole('button', { name: 'Publicar al Mapa (en obres)' });
    expect([boto.getAttribute('aria-disabled'), boto.matches(':disabled'), boto.className]).toEqual([
      'true', false, 'sdp-boto sdp-boto--primari sdp-boto--gran sdp-boto--ple'
    ]);
    fireEvent.click(boto);
    expect(mocks.toast).toHaveBeenCalledWith('“Publicar al Mapa” encara està en obres.');
    expect(ubicacio()).toBe('/page/publicar_mapa');
  });

  test('sense porta vàlida no pinta res', () => {
    const { container } = render(<MemoryRouter><PortaDePagina porta={null} /><PortaDePagina porta={{ verb: ' ' }} /></MemoryRouter>);
    expect(container.childElementCount).toBe(0);
  });
});
