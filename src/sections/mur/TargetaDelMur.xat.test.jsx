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
 * Router en memòria de veres: el clic es llig on acaba la ubicació.
 */
import React from 'react';
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
import { SYSTEM_PAGES, accioDeLaPagina } from '../../config/systemPages.js';
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
    expect(accioDeLaPagina('xat')).toEqual({ id: 'anar-al-xat', verb: 'Anar al xat', desti: '/xat', varietat: 'primari' });
    /* Cap altra pàgina del sistema porta acció: el Mur no canvia per a elles.
       Onada 8 (261009) · Menys la Consola i el Cervell, que hi entren amb el
       seu botó «Obrir…» (systemPages.test.js). */
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
