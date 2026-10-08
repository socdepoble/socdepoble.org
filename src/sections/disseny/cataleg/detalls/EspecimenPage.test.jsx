/* Norma del Mestre, 261004 (prompt 261004_1108, T2; skill sdp-pedra-seca §9
   i §11) · L'avatar de capçalera de PageFrame té el seu referent al catàleg:
   l'espècimen de la Pàgina Universal munta tres PageFrame de veres. Una
   persona o la IA porta el seu avatar redó i cap logotip; amb onCanvia,
   l'avatar és un botó amb nom que al catàleg només avisa; una pàgina que
   signa l'entitat porta el logotip de Sóc de Poble i cap avatar. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from '../../../../app/contexts/RouterContext.jsx';
import { ETIQUETA_CANVIA_AVATAR } from '../../../../components/universal/PageFrame.jsx';
import EspecimenPage from './EspecimenPage.jsx';

afterEach(cleanup);

const AVATAR = '/assets/uploads/avatars/avatar-ratoli-comic.png';
const pinta = () => render(<MemoryRouter><EspecimenPage /></MemoryRouter>).container;
/* jsdom no dona nom a una figure des del seu figcaption: es busca pel peu. */
const mostra = (peu) => screen.getByText(peu, { selector: 'figcaption' }).closest('figure');
const capcalera = (figura) => figura.querySelector('header.page-title');
const fills = (element) => [...element.children].map((e) => `${e.tagName}.${e.className}`);

describe('EspecimenPage · el bloc del títol: avatar o logotip', () => {
  it('pinta tres PageFrame de veres, cada un amb la seua barra taronja, i cap H1', () => {
    const arrel = pinta();
    const figures = [...arrel.querySelectorAll('figure.sdp-especimen__figura')];
    expect(figures).toHaveLength(3);
    for (const figura of figures) {
      const pagina = figura.querySelector('.sdp-universal-page-container.sdp-especimen__barres');
      expect(pagina).not.toBeNull();
      expect(pagina.querySelector(':scope > section.bar-orange')).not.toBeNull();
      expect(pagina.querySelector(':scope > header.bar-blue')).toBeNull();
    }
    expect(arrel.querySelector('h1')).toBeNull();
  });

  it('una persona o la IA: l’avatar redó dins del bloc del títol, sense logotip ni botó', () => {
    pinta();
    const figura = mostra('Una persona o la IA: l’avatar redó, cap logotip');
    expect(fills(capcalera(figura))).toEqual(['DIV.page-title-avatar']);
    const img = within(figura).getByRole('img', { name: 'Avatar de Súper Ratolí' });
    expect(img.className).toBe('page-title-avatar__imatge');
    expect(img.getAttribute('src')).toBe(AVATAR);
    expect(figura.querySelector('.page-title-logo')).toBeNull();
    expect(capcalera(figura).querySelector('button')).toBeNull();
    /* La boina signa la IA i no porta enlloc des del catàleg. */
    expect(within(figura.querySelector('section.bar-orange')).getByText('Súper Ratolí')).toBeTruthy();
    expect(figura.querySelector('section.bar-orange a')).toBeNull();
  });

  it('amb onCanvia: un botó amb nom i la càmera; al catàleg només avisa, sense navegar', () => {
    pinta();
    const figura = mostra('La pàgina és de qui mira: l’avatar és un botó');
    expect(fills(capcalera(figura))).toEqual(['BUTTON.page-title-avatar page-title-avatar--canvia']);
    const boto = within(figura).getByRole('button', { name: ETIQUETA_CANVIA_AVATAR });
    expect(boto.getAttribute('type')).toBe('button');
    expect(boto.querySelector('img.page-title-avatar__imatge').getAttribute('src')).toBe(AVATAR);
    const marca = boto.querySelector('.page-title-avatar__marca');
    expect(marca.getAttribute('aria-hidden')).toBe('true');
    expect(marca.querySelector('svg.lucide-camera')).not.toBeNull();
    expect(figura.querySelector('.page-title-logo')).toBeNull();

    const abans = window.location.href;
    const estat = within(figura).getByRole('status');
    expect(estat.textContent).toBe('Encara no has premut l’avatar.');
    fireEvent.click(boto);
    expect(estat.textContent).toContain(`Has premut «${ETIQUETA_CANVIA_AVATAR}»`);
    expect(window.location.href).toBe(abans);
  });

  /* Correcció del verificador (261004) · Dins de la columna del catàleg
     l'avatar s'encongix (109px a 1280, 141px a 375). Sense CSS nova, la
     segona mostra s'obri amb la PantallaCompleta del catàleg, on fa la mida
     de veres en escriptori (300px), i el text diu la mida de veres. */
  it('la segona mostra s’obri a pantalla completa amb el mateix PageFrame, i en eixir el focus torna al botó', () => {
    pinta();
    const figura = mostra('La pàgina és de qui mira: l’avatar és un botó');
    const obri = within(figura).getByRole('button', { name: 'Veure-la a pantalla completa' });
    expect(obri.getAttribute('aria-haspopup')).toBe('dialog');
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(obri);
    const dialeg = screen.getByRole('dialog', { name: 'La pàgina és de qui mira, a pantalla completa' });
    expect(dialeg.classList.contains('sdp-pantalla-completa')).toBe(true);
    const visor = dialeg.querySelector('.sdp-pantalla-completa__visor');
    const pagina = visor.querySelector(':scope > .sdp-universal-page-container.sdp-especimen__barres');
    expect(pagina).not.toBeNull();
    expect(pagina.querySelector(':scope > section.bar-orange')).not.toBeNull();
    expect(pagina.querySelector(':scope > header.bar-blue')).toBeNull();
    /* La mostra ha passat sencera al diàleg: a la figura ja no hi ha cap altra. */
    expect([...figura.querySelectorAll('.sdp-universal-page-container')]).toEqual([pagina]);
    expect(fills(pagina.querySelector('header.page-title'))).toEqual(['BUTTON.page-title-avatar page-title-avatar--canvia']);
    expect(dialeg.querySelector('h1')).toBeNull();

    const avatarGran = within(dialeg).getByRole('button', { name: ETIQUETA_CANVIA_AVATAR });
    expect(avatarGran.querySelector('img.page-title-avatar__imatge').getAttribute('src')).toBe(AVATAR);
    /* L'avís viu dins de la mostra: a pantalla completa es veu. */
    fireEvent.click(avatarGran);
    expect(within(dialeg).getByRole('status').textContent).toContain(`Has premut «${ETIQUETA_CANVIA_AVATAR}»`);

    fireEvent.click(within(dialeg).getByRole('button', { name: 'Eixir de la pantalla completa' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(figura.querySelector(':scope > .sdp-universal-page-container')).not.toBeNull();
    expect(document.activeElement).toBe(obri);
    expect(within(figura).getByRole('status').textContent).toContain(`Has premut «${ETIQUETA_CANVIA_AVATAR}»`);
  });

  it('el text diu que la mida de la columna no és la de veres i dona la mida de veres', () => {
    pinta();
    const text = mostra('Una persona o la IA: l’avatar redó, cap logotip').textContent;
    expect(text).toContain('Ací l’avatar no fa la mida de la pàgina de veres');
    expect(text).toContain('fa 300px (--sdp-avatar-capcalera)');
    expect(text).toContain('279px en un mòbil de 375px');
    expect(mostra('La pàgina és de qui mira: l’avatar és un botó').textContent).toContain('A pantalla completa l’avatar fa els 300px de veres en escriptori');
  });

  it('signa l’entitat: el logotip de Sóc de Poble (clar i fosc), cap avatar', () => {
    pinta();
    const figura = mostra('Signa l’entitat: el logotip de Sóc de Poble, cap avatar');
    expect(fills(capcalera(figura))).toEqual(['IMG.page-title-logo light-only', 'IMG.page-title-logo dark-only']);
    expect([...capcalera(figura).querySelectorAll('img')].map((img) => img.getAttribute('src'))).toEqual([
      '/assets/system/ui/logo-socdepoble-rect-negre.svg',
      '/assets/system/ui/logo-socdepoble-rect-blanc.svg'
    ]);
    expect(figura.querySelector('.page-title-avatar')).toBeNull();
    expect(within(figura.querySelector('section.bar-orange')).getByRole('link', { name: /Sóc de Poble/ }).getAttribute('href')).toBe('/projecte');
  });

  it('el contracte documenta avatarAutor al costat de logoEntitat i senseLogo', () => {
    const arrel = pinta();
    const files = [...arrel.querySelectorAll('table tbody tr')];
    const props = files.map((tr) => tr.querySelector('td code').textContent);
    for (const prop of ['logoEntitat', 'senseLogo', 'avatarAutor']) expect(props, prop).toContain(prop);
    const fila = files.find((tr) => tr.querySelector('td code').textContent === 'avatarAutor');
    /* Contracte-1 (261008) · el tipus porta les claus noves de les píndoles.
       Línia I1 (pla 261008_1201) · i les de l'ajuda i la pujada. */
    expect(fila.textContent).toContain('{ src, alt, onCanvia?, etiquetaCanvia?, onLleva?, etiquetaLleva?, ajuda?, pujant? }');
    expect(fila.textContent).toContain('--sdp-avatar-capcalera (300px)');
    expect(fila.textContent).toContain('Llevar l’avatar');
    // Correcció de la revisió (261008) · una referència que no es pot pintar conserva el control.
    expect(fila.textContent).toContain('les píndoles es pinten soles');
    // Línia I1 · què fan ajuda i pujant, i que només compten amb fila de píndoles.
    expect(fila.textContent).toContain('ajuda (text) pinta una línia .sdp-camp__ajuda sencera davall de les píndoles');
    expect(fila.textContent).toContain('pujant (només true) les deixa disabled i aria-busy');
    expect(fila.textContent).toContain('Amb fila de píndoles');
  });

  /* Decisió del Mestre (261008) · drets d'autor dins de l'editor: el contracte
     de PageFrame documenta onCanviaCopyright i diu que fora de l'editor és
     l'enllaç de sempre. */
  it('el contracte documenta onCanviaCopyright: botó a l’editor, enllaç a la resta', () => {
    const arrel = pinta();
    const fila = [...arrel.querySelectorAll('table tbody tr')].find((tr) => tr.querySelector('td code').textContent === 'onCanviaCopyright');
    expect(fila).toBeTruthy();
    expect(fila.textContent).toContain('data-sdp-drets');
    expect(fila.textContent).toContain('/page/drets-autor');
    expect(fila.textContent).toContain('totes les targetes');
  });

  /* Relleu 261007 (històric de l'actor, esmena 2 del pla 261007_1645) · El
     contracte també documenta la ranura del peu i el seu nom accessible. */
  it('el contracte documenta peuDePagina i etiquetaPeuDePagina', () => {
    const arrel = pinta();
    const files = [...arrel.querySelectorAll('table tbody tr')];
    const fila = (prop) => files.find((tr) => tr.querySelector('td code').textContent === prop);
    expect(fila('peuDePagina')?.textContent).toContain('dins del contenidor que fa scroll i fora de l’Índex');
    expect(fila('peuDePagina').textContent).toContain('node');
    expect(fila('etiquetaPeuDePagina')?.textContent).toContain('El nom accessible del section del peu');
  });
});
