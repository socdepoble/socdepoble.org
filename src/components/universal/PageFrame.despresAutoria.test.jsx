/* Pla 261028_1526 (P1-58; Llibre Mestre, Fita 22) · La ranura `despresAutoria`
   de PageFrame:
    · sense la prop, el DOM de sempre (Llei del Píxel);
    · amb ella, un div.sdp-pagina-despres-autoria just DESPRÉS de la barra
      taronja i ABANS de la capçalera de l'H1, dins del contenidor que fa
      scroll i fora de la capçalera i de l'article: l'Índex no en recull els
      títols;
    · aparéixer no canvia el node de la capçalera ni el de l'article;
    · arriba per les props d'UniversalPage, mai per la config del
      ContentProvider;
    · la regla de la ranura, escrita dins de @layer components com la del
      peu (jsdom no calcula capes). */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';

vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
vi.mock('../PedraSeca/hooks/useAccions.js', async (importOriginal) => ({ ...(await importOriginal()), useAccions: () => ({}) }));

import { PageFrame } from './PageFrame.jsx';
import { UniversalPage } from './UniversalPage.jsx';
import { ContentProvider } from './ContentProvider.jsx';

const COS = (
  <>
    <h2>Què és?</h2>
    <p>Text.</p>
    <h3>Vincles</h3>
  </>
);
const DALT = (
  <details className="sdp-edicio-avancada">
    <summary>Edició avançada de la fitxa</summary>
    <h2>Capçalera</h2>
  </details>
);
const pinta = (props = {}) => render(
  <MemoryRouter rutaInicial="/perfil"><PageFrame chrome="context" layout="contained" title="Fitxa" {...props}>{COS}</PageFrame></MemoryRouter>
).container;
const fills = (arrel) => [...arrel.querySelector('.sdp-universal-page-container').children].map((e) => `${e.tagName}.${e.className}`);

afterEach(cleanup);

describe('sense despresAutoria, el DOM de sempre', () => {
  test('cap div nou, ni amb un null explícit', () => {
    const sempre = pinta().innerHTML;
    cleanup();
    expect(pinta({ despresAutoria: null }).innerHTML).toBe(sempre);
    expect(document.querySelector('.sdp-pagina-despres-autoria')).toBeNull();
    expect(fills(document.body)).toEqual(['HEADER.bar-blue', 'SECTION.bar-orange', 'HEADER.page-title', 'ARTICLE.content-wrapper']);
  });
});

describe('amb despresAutoria', () => {
  test('entre la barra taronja i la capçalera de l’H1, fora de la capçalera i de l’article', () => {
    const arrel = pinta({ despresAutoria: DALT });
    expect(fills(arrel)).toEqual([
      'HEADER.bar-blue', 'SECTION.bar-orange', 'DIV.sdp-pagina-despres-autoria', 'HEADER.page-title', 'ARTICLE.content-wrapper'
    ]);
    const ranura = arrel.querySelector('.sdp-pagina-despres-autoria');
    expect(ranura.firstElementChild.matches('details.sdp-edicio-avancada')).toBe(true);
    expect(ranura.closest('header')).toBeNull();
    expect(ranura.closest('article')).toBeNull();
    expect(arrel.querySelector('header.page-title').contains(ranura)).toBe(false);
    expect(arrel.querySelector('article.content-wrapper').contains(ranura)).toBe(false);
  });

  test('no depén de la capçalera: amb chrome \'none\' (cap header.page-title), la ranura continua davall de la barra', () => {
    const arrel = pinta({ chrome: 'none', despresAutoria: DALT });
    expect(fills(arrel)).toEqual(['SECTION.bar-orange', 'DIV.sdp-pagina-despres-autoria', 'ARTICLE.content-wrapper']);
  });

  /* Ordre del Mestre (261026_2126, §5) · L'Índex llig l'H1 de la capçalera i
     el cos de l'article; el que hi ha a la ranura no hi entra. */
  test('l’Índex de la pàgina només recull l’H1 i els encapçalaments de l’article, no els de la ranura', () => {
    pinta({ despresAutoria: DALT });
    fireEvent.click(screen.getByRole('button', { name: 'Índex de secció' }));
    const entrades = within(screen.getByRole('dialog')).getAllByRole('button').map((b) => b.textContent).filter((t) => t !== '');
    expect(entrades).toEqual(['Fitxa', 'Què és?', 'Vincles']);
  });

  test('aparéixer i desaparéixer no canvia el node de la capçalera ni el de l’article (el cos no es remunta)', () => {
    const marc = (props) => <MemoryRouter rutaInicial="/perfil"><PageFrame chrome="context" title="Fitxa" {...props}>{COS}</PageFrame></MemoryRouter>;
    const vista = render(marc({}));
    const capcalera = vista.container.querySelector('header.page-title');
    const article = vista.container.querySelector('article.content-wrapper');
    vista.rerender(marc({ despresAutoria: DALT }));
    expect(vista.container.querySelector('.sdp-pagina-despres-autoria')).not.toBeNull();
    expect(vista.container.querySelector('header.page-title')).toBe(capcalera);
    expect(vista.container.querySelector('article.content-wrapper')).toBe(article);
    vista.rerender(marc({}));
    expect(vista.container.querySelector('.sdp-pagina-despres-autoria')).toBeNull();
    expect(vista.container.querySelector('header.page-title')).toBe(capcalera);
    expect(vista.container.querySelector('article.content-wrapper')).toBe(article);
  });

  test('arriba per les props d’UniversalPage', () => {
    const arrel = render(
      <MemoryRouter rutaInicial="/perfil"><UniversalPage chrome="context" title="Fitxa" despresAutoria={DALT}>{COS}</UniversalPage></MemoryRouter>
    ).container;
    expect(fills(arrel).slice(1, 4)).toEqual(['SECTION.bar-orange', 'DIV.sdp-pagina-despres-autoria', 'HEADER.page-title']);
  });

  test('la config del ContentProvider no hi pot injectar res', () => {
    const arrel = render(
      <MemoryRouter rutaInicial="/perfil">
        <ContentProvider initialConfig={{ chrome: 'system', title: 'Mercat', despresAutoria: <p>injectat</p> }}>
          <UniversalPage />
        </ContentProvider>
      </MemoryRouter>
    ).container;
    expect(arrel.querySelector('.sdp-pagina-despres-autoria')).toBeNull();
    expect(arrel.textContent).not.toContain('injectat');
  });
});

describe('la regla de la ranura', () => {
  test('classe pròpia dins de @layer components, sense créixer com l’article i amb el coixí lateral del cos', () => {
    const utilitats = readFileSync(resolve(process.cwd(), 'src/css/utilities.css'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
    const regla = '.sdp-pagina-despres-autoria { flex: none; width: 100%; padding-inline: var(--sdp-pad-contenidor); }';
    const capa = utilitats.slice(utilitats.indexOf('@layer components {'), utilitats.indexOf('@layer utilities {'));
    expect(capa).toContain(regla);
  });
});
