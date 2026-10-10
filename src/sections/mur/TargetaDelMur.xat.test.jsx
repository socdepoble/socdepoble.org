/**
 * Ordre del Mestre (261007) · La targeta d'«El Xat» al Mur i al Calendari
 * (TargetaDelMur, la mateixa a les dues pàgines):
 *  · en lloc de les etiquetes, el gran botó «Anar al xat» cap a /xat;
 *  · un clic a qualsevol altra part de la targeta obri la seua pàgina,
 *    /page/xat;
 *  · «Comentaris = xat» · Comentar és el MATEIX a totes les targetes, també
 *    a les de sistema: el menú de dues vies, «En privat» (el xat privat amb
 *    Sóc de Poble) i «En públic» (el xat públic de l'element, pel seu
 *    objecte; sense, desactivat). Cap gestor de llista (derogat
 *    onComentarSistema, que saltava la via pública).
 * Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) · El botó
 * de la targeta és el d'accioDeLaTargeta, que hui només declara El Xat. Les
 * targetes de la Consola i del Cervell perden el botó gran «Obrir…» (derogat
 * de l'Onada 8) i porten Categoria i Etiqueta; el botó es queda a la seua
 * pàgina.
 * Router en memòria de veres: el clic es llig on acaba la ubicació.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ toast: vi.fn() }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: {} })
}));

import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext';
import { TargetaDelMur } from './TargetaDelMur.jsx';
import { targetesDeSistema } from './targetesMur.js';
import { PAGE_COPY } from '../text/pageContent.js';
import { RUTA_DRETS_AUTOR, SYSTEM_PAGES, accioDeLaPagina, accioDeLaTargeta } from '../../config/systemPages.js';
import { resolveAsset } from '../../config/assetResolver.js';
import { RUTA_PERFIL_PROJECTE } from '../../config/navigation.js';
import { COPYRIGHT_SDP } from '../../components/universal/editorial.js';
import { TEXTOS_COMENTAR } from '../../components/universal/barres/BarraBlava.jsx';

function Ubicacio() {
  const { pathname, search } = useLocation();
  return <output data-testid="ubicacio">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}
const ubicacio = () => screen.getByTestId('ubicacio').textContent;
/* La ubicació llegida com la llegirà XatSection. */
const desti = () => {
  const url = new URL(ubicacio(), 'http://localhost');
  return { cami: url.pathname, ...Object.fromEntries(url.searchParams) };
};

const sistema = (clau) => targetesDeSistema(PAGE_COPY).find((item) => item.id === clau);
const pinta = (item, props = {}) => render(
  <MemoryRouter rutaInicial="/mur">
    <TargetaDelMur item={item} {...props} />
    <Ubicacio />
  </MemoryRouter>
);

afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); });

describe('261007 · la targeta d’El Xat', () => {
  test('és una pàgina del sistema: /page/xat, al Mur i al Calendari, amb l’acció «Anar al xat»', () => {
    expect(SYSTEM_PAGES.find((pagina) => pagina.key === 'xat')).toMatchObject({ key: 'xat', isAvis: false, href: '/page/xat' });
    const xat = sistema('xat');
    expect(xat).toMatchObject({ id: 'xat', isSystem: true, mainHref: '/page/xat', title: 'El Xat', image: '/assets/uploads/brain/xat_portada.jpg' });
    expect(accioDeLaTargeta('xat')).toEqual({ id: 'anar-al-xat', verb: 'Anar al xat', desti: '/xat', varietat: 'primari' });
    /* Cap altra targeta del sistema porta acció: el Mur no canvia per a elles.
       Onada 10 (261010) · Derogat de l'Onada 8 que la Consola i el Cervell hi
       entren amb el seu botó «Obrir…»: l'acció de la TARGETA només la declara
       El Xat. Les tres continuen tenint acció de PÀGINA (systemPages.test.js). */
    expect(SYSTEM_PAGES.filter((pagina) => accioDeLaTargeta(pagina.key)).map((pagina) => pagina.key)).toEqual(['xat']);
    expect(SYSTEM_PAGES.filter((pagina) => accioDeLaPagina(pagina.key)).map((pagina) => pagina.key)).toEqual(['consola', 'cervell', 'xat']);
  });

  test('en lloc de les etiquetes, el gran botó «Anar al xat»; les altres targetes conserven les seues', () => {
    const { container } = pinta(sistema('xat'));
    const article = container.querySelector('article');
    expect(article.querySelector('ul.sp-card-labels')).toBeNull();
    const boto = screen.getByRole('link', { name: 'Anar al xat' });
    expect(article.querySelector('.sp-card-body > .sp-card-accio').contains(boto)).toBe(true);
    expect(boto.getAttribute('href')).toBe('/xat');
    expect(boto.className.split(' ')).toEqual(expect.arrayContaining(['sdp-boto', 'sdp-boto--primari', 'sdp-boto--gran']));
    cleanup();
    const { container: altra } = pinta(sistema('constitucio'));
    expect(altra.querySelector('ul.sp-card-labels')).not.toBeNull();
    expect(altra.querySelector('.sp-card-accio')).toBeNull();
  });

  test('el botó porta a /xat; un clic a qualsevol altra part de la targeta, a /page/xat', () => {
    const { container } = pinta(sistema('xat'));
    fireEvent.click(screen.getByRole('link', { name: 'Anar al xat' }));
    expect(ubicacio()).toBe('/xat');
    const vel = container.querySelector('a.sp-card-link-overlay');
    expect(vel.getAttribute('aria-label')).toBe('El Xat');
    fireEvent.click(vel);
    expect(ubicacio()).toBe('/page/xat');
  });
});

/* Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) · Al Mur
   (i al Calendari, que munta esta mateixa targeta) la Consola i el Cervell
   perden el botó gran i porten Categoria i Etiqueta, les de PAGE_COPY. El
   botó «Obrir…» es queda a /page/consola i /page/cervell. */
describe('Onada 10 · les targetes de la Consola i del Cervell: etiquetes i cap botó gran', () => {
  test.each([
    ['consola', 'Obrir la Consola'],
    ['cervell', 'Obrir el Cervell']
  ])('%s: Categoria i Etiqueta, cap .sp-card-accio ni cap enllaç «%s», i el vel porta a la seua pàgina', (clau, verb) => {
    const item = sistema(clau);
    expect(item).toMatchObject({ id: clau, isSystem: true, mainHref: `/page/${clau}`, labels: PAGE_COPY[clau].labels });
    const { container } = pinta(item);
    const article = container.querySelector('article');
    const etiquetes = [...article.querySelectorAll('.sp-card-body ul.sp-card-labels > li')];
    expect(etiquetes.map((etiqueta) => etiqueta.textContent)).toEqual(PAGE_COPY[clau].labels.map((etiqueta) => etiqueta.text));
    expect(etiquetes).toHaveLength(2);
    expect(etiquetes[0].classList.contains('sdp-badge-category')).toBe(true);
    expect(etiquetes[1].classList.contains('sdp-badge-tag')).toBe(true);
    // Ni la píndola de reserva «Sistema» (sdp-badge-system) ni cap botó gran.
    expect(article.querySelector('.sdp-badge-system')).toBeNull();
    expect(article.querySelector('.sp-card-accio')).toBeNull();
    expect(article.querySelector('.sdp-boto--gran')).toBeNull();
    expect(screen.queryByRole('link', { name: verb })).toBeNull();
    // Tota la targeta continua obrint la seua pàgina, on viu el botó.
    const vel = container.querySelector('a.sp-card-link-overlay');
    expect(vel.getAttribute('aria-label')).toBe(PAGE_COPY[clau].title);
    fireEvent.click(vel);
    expect(ubicacio()).toBe(`/page/${clau}`);
  });

  /* Ací només es mira la dada; el filtre ?category= de veres el prova
     MurSection.xat.test.jsx amb el Mur muntat. */
  test('la primera etiqueta de la targeta és la Categoria «Sistema» (la dada que llig el filtre ?category= del Mur)', () => {
    for (const clau of ['consola', 'cervell']) {
      expect([clau, sistema(clau).labels[0]]).toEqual([clau, { text: 'Sistema', className: 'sdp-badge-category' }]);
    }
  });
});

/* Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) · Les
   tres targetes que ixen del Panell de Control («Consola Termodinàmica», «El
   Cervell» i «Disseny Pedra Seca») viuen només al Mur. La prova derogada del
   Panell («Onada 8 · la maquinària comença per la Consola, el Cervell i
   Disseny…», ControlSection.test.jsx) era l'única que en mirava la targeta
   sencera: la boina, la data del Mestre, la il·lustració, el copyright,
   Connectar i les etiquetes de Disseny. Eixa cobertura viu ara ací, on viu la
   targeta. Les etiquetes es lligen de PAGE_COPY (són un esborrany per al
   Mestre: ací no se'n copia cap text); el que es fixa és l'ordre de les
   classes. L'ordre de les tres dins de la llista del Mur el vigila
   MurSection.datesDeProva.test.jsx. */
describe('Onada 10 · les tres targetes que ixen del Panell viuen al Mur, senceres', () => {
  const pastilla = (article) => [...article.querySelectorAll('header.sp-card-header .btn-date-time span')].map((span) => span.textContent);
  const dia = (iso) => new Date(iso).toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });

  test.each([
    ['consola', 'Consola Termodinàmica', '2026-09-08T00:00:00+02:00', ['sdp-badge-category', 'sdp-badge-tag']],
    ['cervell', 'El Cervell', '2026-09-09T00:00:00+02:00', ['sdp-badge-category', 'sdp-badge-tag']],
    ['disseny', 'Disseny Pedra Seca', '2026-09-10T00:00:00+02:00', ['sdp-badge-system', 'sdp-badge-category', 'sdp-badge-tag']]
  ])('%s: «%s», boina de Sóc de Poble, la data del Mestre, la il·lustració de la pàgina i les seues etiquetes', (clau, titol, data, classes) => {
    const copy = PAGE_COPY[clau];
    expect([copy.title, copy.date]).toEqual([titol, data]);
    const item = sistema(clau);
    const { container } = pinta(item);
    const article = container.querySelector('article');
    /* La boina: Sóc de Poble, el seu poble i l'enllaç al seu perfil. */
    const capcal = article.querySelector('header.sp-card-header');
    expect(article.firstElementChild).toBe(capcal);
    expect(capcal.querySelector('.sp-card-author-name').textContent).toBe('Sóc de Poble');
    expect(capcal.querySelector('.sp-card-author-location').textContent).toBe('La Torre de les Maçanes');
    expect(capcal.querySelector('a.sp-card-author-link').getAttribute('href')).toBe(RUTA_PERFIL_PROJECTE);
    /* La data del Mestre (Onada 8), a les 00:00: una sola pastilla. */
    expect(article.querySelectorAll('.btn-date-time')).toHaveLength(1);
    expect(pastilla(article)).toEqual(['00:00', dia(data)]);
    /* La il·lustració i el títol, els de la pàgina. */
    const imatge = article.querySelector('img.sp-card-media');
    expect([imatge.getAttribute('src'), imatge.getAttribute('alt')]).toEqual([resolveAsset(copy.image), copy.imageAlt]);
    expect(article.querySelector('.sp-card-title').textContent).toBe(titol);
    /* Les etiquetes de PAGE_COPY, en l'ordre de la skill (Carpeta, Categoria,
       Etiqueta), i cap botó gran: Disseny no en té, i la Consola i el Cervell
       el tenen a la seua pàgina. */
    const etiquetes = [...article.querySelectorAll('.sp-card-body ul.sp-card-labels > li')];
    expect(copy.labels.map((etiqueta) => etiqueta.className)).toEqual(classes);
    expect(etiquetes.map((li) => [li.textContent, li.className]))
      .toEqual(copy.labels.map((etiqueta) => [etiqueta.text, `sp-card-label ${etiqueta.className}`]));
    expect(article.querySelector('.sp-card-accio')).toBeNull();
    /* El copyright cap a «Drets d'autor» i el peu sencer, amb Connectar. */
    const drets = article.querySelector('.sp-card-copyright__enllac');
    expect([drets.textContent, drets.getAttribute('href')]).toEqual([COPYRIGHT_SDP, RUTA_DRETS_AUTOR]);
    expect(article.lastElementChild.className).toBe('sp-card-footer');
    expect([...article.querySelectorAll('.sp-card-footer button')].map((boto) => boto.getAttribute('aria-label')))
      .toEqual([`Traduir ${titol}`, `Comentar ${titol}`, `Compartir ${titol}`, `Connectar amb ${titol}`]);
    /* Tota la targeta obri la seua pàgina: /page/<clau>, o /disseny. */
    const vel = container.querySelector('a.sp-card-link-overlay');
    expect([vel.getAttribute('aria-label'), vel.getAttribute('href')]).toEqual([titol, item.mainHref]);
    expect(item.mainHref).toBe(clau === 'disseny' ? '/disseny' : `/page/${clau}`);
  });
});

describe('261007 · «Comentaris = xat» · Comentar de les targetes del Mur i del Calendari', () => {
  /* Obri el menú de Comentar de la targeta i hi tria una via. */
  const comenta = (titol, via) => {
    fireEvent.click(screen.getByRole('button', { name: `Comentar ${titol}` }));
    fireEvent.click(screen.getByRole('menuitem', { name: via }));
  };
  const PRIVAT = TEXTOS_COMENTAR.privat[1];
  const PUBLIC = TEXTOS_COMENTAR.public[1];

  test('una targeta de sistema amb xat públic: les dues vies', () => {
    pinta(sistema('constitucio'));
    comenta('Constitució', PUBLIC);
    expect(desti()).toMatchObject({ cami: '/xat', sobre: 'pagina:/constitucio', ruta: '/constitucio' });
    comenta('Constitució', PRIVAT);
    expect(desti()).toEqual({ cami: '/xat', amb: 'socdepoble' });
  });

  test('El Xat (/page/xat, fora de les pàgines amb xat): la via pública desactivada diu per què; la privada, Sóc de Poble', () => {
    pinta(sistema('xat'));
    fireEvent.click(screen.getByRole('button', { name: 'Comentar El Xat' }));
    const publica = screen.getByRole('menuitem', { name: PUBLIC });
    expect(publica.getAttribute('aria-disabled')).toBe('true');
    expect(publica.textContent).toContain(TEXTOS_COMENTAR.senseXatPublic[1]);
    fireEvent.click(publica);
    expect(ubicacio()).toBe('/mur');
    fireEvent.click(screen.getByRole('menuitem', { name: PRIVAT }));
    expect(desti()).toEqual({ cami: '/xat', amb: 'socdepoble' });
  });

  test('una publicació: «En públic» és el seu xat, amb el seu títol com a nom', () => {
    pinta({ id: 'coca', type: 'feed', title: 'Recepta de coca', created_at: '2026-09-01T10:00:00.000Z' });
    comenta('Recepta de coca', PUBLIC);
    expect(desti()).toMatchObject({ cami: '/xat', sobre: 'publicacio:coca', titol: 'Recepta de coca' });
  });
});
