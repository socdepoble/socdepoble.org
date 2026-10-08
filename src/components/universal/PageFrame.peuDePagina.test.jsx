/* Esmena 2 del pla 261007_1645 (ordre del Mestre, 261007: «Esta lògica de
   llistar elements de la categoria per a l'avatar actiu ha d'estar disponible
   per tot el sistema») · La ranura `peuDePagina` de PageFrame:
    · sense la prop, el DOM de sempre (Llei del Píxel);
    · amb ella, un section amb nom DESPRÉS de l'article (i de la traducció),
      dins del contenidor que fa scroll i fora de l'article: l'Índex de la
      pàgina no en recull els títols;
    · arriba sola per {...props} d'UniversalPage;
    · és l'últim fill: aparéixer no canvia el node de l'article. */
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';

vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
vi.mock('../PedraSeca/hooks/useAccions.js', async (importOriginal) => ({ ...(await importOriginal()), useAccions: () => ({}) }));
/* La traducció de la pàgina, controlada per la prova (PageFrame.seccio.test.jsx). */
const traduccio = vi.hoisted(() => {
  const original = Object.freeze({ llengua: null, lang: null, carregant: null, titol: null, blocs: null, original: () => {} });
  return { original, valor: original };
});
vi.mock('../PedraSeca/hooks/useTraduccioPagina.js', () => ({ useTraduccioPagina: () => traduccio.valor }));

import { PageFrame } from './PageFrame.jsx';
import { UniversalPage } from './UniversalPage.jsx';

const COS = (
  <>
    <h2>Què és?</h2>
    <p>Text.</p>
    <h3>Vincles</h3>
  </>
);
const PEU = (
  <>
    <h2>Ja publicat al Mercat</h2>
    <article><h3>Samarreta Sóc de Poble</h3></article>
  </>
);
const pinta = (props = {}) => render(
  <MemoryRouter rutaInicial="/notes"><PageFrame chrome="context" layout="contained" title="Nota" {...props}>{COS}</PageFrame></MemoryRouter>
).container;
const fills = (arrel) => [...arrel.querySelector('.sdp-universal-page-container').children].map((e) => `${e.tagName}.${e.className}`);

beforeEach(() => { traduccio.valor = traduccio.original; });
afterEach(cleanup);

describe('sense peuDePagina, el DOM de sempre', () => {
  test('cap section nou, ni amb només l’etiqueta, ni amb un null explícit', () => {
    const sempre = pinta().innerHTML;
    cleanup();
    expect(pinta({ peuDePagina: null, etiquetaPeuDePagina: 'Ja publicat al Mercat' }).innerHTML).toBe(sempre);
    expect(document.querySelector('.sdp-pagina-peu')).toBeNull();
    expect(fills(document.body).at(-1)).toBe('ARTICLE.content-wrapper');
  });
});

describe('amb peuDePagina', () => {
  test('un section amb nom, l’últim fill del contenidor que fa scroll, després i fora de l’article', () => {
    const arrel = pinta({ peuDePagina: PEU, etiquetaPeuDePagina: 'Ja publicat al Mercat' });
    expect(fills(arrel).slice(-2)).toEqual(['ARTICLE.content-wrapper', 'SECTION.sdp-pagina-peu']);
    const peu = screen.getByRole('region', { name: 'Ja publicat al Mercat' });
    expect(peu.className).toBe('sdp-pagina-peu');
    expect(peu.closest('article')).toBeNull();
    expect(arrel.querySelector('article.content-wrapper').contains(peu)).toBe(false);
    expect(within(peu).getByRole('heading', { level: 2 }).textContent).toBe('Ja publicat al Mercat');
  });

  test('l’Índex de la pàgina només recull els encapçalaments de l’article, no els del peu', () => {
    pinta({ peuDePagina: PEU, etiquetaPeuDePagina: 'Ja publicat al Mercat' });
    fireEvent.click(screen.getByRole('button', { name: 'Índex de secció' }));
    const entrades = within(screen.getByRole('dialog')).getAllByRole('button').map((b) => b.textContent).filter((t) => t !== '');
    expect(entrades).toEqual(['Què és?', 'Vincles']);
  });

  test('aparéixer no canvia el node de l’article (el cos no es remunta)', () => {
    const vista = render(<MemoryRouter rutaInicial="/notes"><PageFrame chrome="context" title="Nota">{COS}</PageFrame></MemoryRouter>);
    const article = vista.container.querySelector('article.content-wrapper');
    vista.rerender(<MemoryRouter rutaInicial="/notes"><PageFrame chrome="context" title="Nota" peuDePagina={PEU}>{COS}</PageFrame></MemoryRouter>);
    expect(vista.container.querySelector('article.content-wrapper')).toBe(article);
    expect(vista.container.querySelector('.sdp-pagina-peu')).not.toBeNull();
    vista.rerender(<MemoryRouter rutaInicial="/notes"><PageFrame chrome="context" title="Nota">{COS}</PageFrame></MemoryRouter>);
    expect(vista.container.querySelector('article.content-wrapper')).toBe(article);
    expect(vista.container.querySelector('.sdp-pagina-peu')).toBeNull();
  });

  test('amb la pàgina traduïda, el peu va després de l’article traduït', () => {
    traduccio.valor = { ...traduccio.original, llengua: 'ES', lang: 'es', titol: 'Nota', blocs: [{ etiqueta: 'h2', text: '¿Qué es?' }] };
    const arrel = pinta({ chrome: 'system', peuDePagina: PEU, etiquetaPeuDePagina: 'Ja publicat al Mercat' });
    expect(fills(arrel).slice(-3)).toEqual(['ARTICLE.content-wrapper', 'ARTICLE.content-wrapper sdp-traduccio-cos', 'SECTION.sdp-pagina-peu']);
  });

  test('arriba sola per {...props} d’UniversalPage', () => {
    const arrel = render(
      <MemoryRouter rutaInicial="/notes"><UniversalPage chrome="context" title="Nota" peuDePagina={PEU} etiquetaPeuDePagina="Ja publicat al Mercat">{COS}</UniversalPage></MemoryRouter>
    ).container;
    expect(fills(arrel).at(-1)).toBe('SECTION.sdp-pagina-peu');
    expect(screen.getByRole('region', { name: 'Ja publicat al Mercat' })).toBeTruthy();
  });
});
