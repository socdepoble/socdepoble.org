/**
 * Ordre del Mestre (261007) · El copyright de la targeta és un enllaç.
 *
 *  · SEMPRE: siga quin siga el text («CC BY-NC-SA 4.0…», «© Pepet»…), el
 *    copyright porta a la pàgina «Drets d'autor» (/page/drets-autor), amb el
 *    Link del router, dins del paràgraf .sp-card-copyright de sempre.
 *  · Sense copyright, cap paràgraf (com abans).
 *  · El clic a l'enllaç és seu: navega a la pàgina dels drets i no obri la
 *    targeta (és germà del vel, no fill, i puja damunt seu).
 *  · Teclat: és una parada pròpia, després de l'enllaç de la targeta.
 *  · CSS: blau d'acció, sense subratllat (només en passar el ratolí, dins de
 *    la guarda), focus amb l'anell del sistema i àrea tàctil ≥ --sdp-touch.
 *
 * Router en memòria de veres: el clic es llig on acaba la ubicació.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../../app/contexts/RouterContext';
import { RUTA_DRETS_AUTOR } from '../../../config/systemPages.js';
import { COPYRIGHT_SDP } from '../../universal/editorial.js';
import { UniversalCard } from './UniversalCard.jsx';

afterEach(cleanup);

function Ubicacio() {
  const { pathname } = useLocation();
  return <output data-testid="ubicacio">{pathname}</output>;
}
const ubicacio = () => screen.getByTestId('ubicacio').textContent;

const pinta = (props) => render(
  <MemoryRouter rutaInicial="/mur">
    <UniversalCard title="La festa" body="Dissabte, a la plaça." mainHref="/mur/festa" hasFooter={true} {...props} />
    <Ubicacio />
  </MemoryRouter>
);

describe('el copyright és un enllaç a «Drets d’autor»', () => {
  test('la ruta és la de l’entrada «drets-autor» de SYSTEM_PAGES', () => {
    expect(RUTA_DRETS_AUTOR).toBe('/page/drets-autor');
  });

  test.each([
    ['la Creative Commons de les pàgines del sistema', COPYRIGHT_SDP],
    ['un «Copyright (C)» d’una persona', '© Pepet'],
    ['una llicència qualsevol', 'CC BY-SA 4.0 · Sóc de Poble'],
    ['un text lliure CC0', 'Fotos de la Iaia Pepa · CC0 1.0']
  ])('SEMPRE, siga quin siga el text: %s', (_, copyright) => {
    const { container } = pinta({ copyright });
    const paragraf = container.querySelector('.sp-card-body > p.sp-card-copyright');
    expect(paragraf.outerHTML).toBe(
      `<p class="sp-card-copyright"><a href="${RUTA_DRETS_AUTOR}" class="sp-card-copyright__enllac">${copyright}</a></p>`
    );
    expect(screen.getByRole('link', { name: copyright }).getAttribute('href')).toBe('/page/drets-autor');
  });

  test('sense copyright, cap paràgraf ni cap enllaç de drets', () => {
    const { container } = pinta({ copyright: '' });
    expect(container.querySelector('.sp-card-copyright')).toBeNull();
    expect(container.querySelector('.sp-card-copyright__enllac')).toBeNull();
  });

  test('el clic navega a la pàgina dels drets i no obri la targeta', () => {
    const obriTargeta = vi.fn();
    const { container } = pinta({ copyright: '© Pepet', onMainClick: obriTargeta });
    const vel = container.querySelector('a.sp-card-link-overlay');
    const enllac = screen.getByRole('link', { name: '© Pepet' });
    /* Germà del vel, mai fill: el seu clic no arriba a l'enllaç de la targeta. */
    expect(vel.contains(enllac)).toBe(false);
    fireEvent.click(enllac);
    expect(ubicacio()).toBe('/page/drets-autor');
    expect(obriTargeta).not.toHaveBeenCalled();
    /* La resta de la targeta continua obrint la seua pàgina. */
    fireEvent.click(vel);
    expect(ubicacio()).toBe('/mur/festa');
    expect(obriTargeta).toHaveBeenCalledTimes(1);
  });

  test('amb el botó de tota la targeta (onMainClick sense mainHref), el clic tampoc l’obri', () => {
    const obriTargeta = vi.fn();
    pinta({ copyright: '© Pepet', mainHref: undefined, onMainClick: obriTargeta });
    fireEvent.click(screen.getByRole('link', { name: '© Pepet' }));
    expect(ubicacio()).toBe('/page/drets-autor');
    expect(obriTargeta).not.toHaveBeenCalled();
  });

  test('teclat: una parada pròpia, enfocable, després de l’enllaç de la targeta', () => {
    const { container } = pinta({ copyright: '© Pepet' });
    const parades = [...container.querySelectorAll('article a[href], article button')].filter((el) => el.tabIndex >= 0);
    const vel = container.querySelector('a.sp-card-link-overlay');
    const enllac = screen.getByRole('link', { name: '© Pepet' });
    expect(parades.indexOf(enllac)).toBeGreaterThan(parades.indexOf(vel));
    enllac.focus();
    expect(document.activeElement).toBe(enllac);
  });
});

/* jsdom no calcula capes, colors ni z-index: es comprova la regla escrita,
   com les proves de capes. */
describe('CSS de l’enllaç del copyright (components.css)', () => {
  const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
  const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
  const COMPONENTS = senseComentaris(llig('src/css/components.css'));
  const inici = COMPONENTS.search(/@layer components \{\s*\.sp-card-copyright__enllac \{/);
  const BLOC = inici < 0 ? '' : COMPONENTS.slice(inici, COMPONENTS.indexOf('\n}\n', inici) + 2);
  const regla = (selector) => {
    const escapat = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return BLOC.match(new RegExp(`(?:^|\\n)\\s*${escapat} \\{([^}]*)\\}`))?.[1].replace(/\s+/g, ' ').trim() ?? null;
  };

  test('un sol bloc, dins de @layer components', () => {
    expect(BLOC.startsWith('@layer components {')).toBe(true);
    expect(BLOC.trim().endsWith('}')).toBe(true);
  });

  test('blau d’acció i sense subratllat en repòs', () => {
    const repos = regla('.sp-card-copyright__enllac');
    expect(repos).toMatch(/color: var\(--sdp-accio-text\);/);
    expect(repos).toMatch(/text-decoration: none;/);
  });

  test('el subratllat, només en passar el ratolí i dins de la guarda de ratolí', () => {
    const guarda = BLOC.match(/@media \(hover: hover\) and \(pointer: fine\) \{\s*\.sp-card-copyright__enllac:hover \{([^}]*)\}/);
    expect(guarda).not.toBeNull();
    expect(guarda[1]).toMatch(/text-decoration: underline;/);
    // Cap :hover fora de la guarda.
    const foraDeLaGuarda = BLOC.replace(/@media \(hover: hover\) and \(pointer: fine\) \{[^}]*\}\s*\}/, '');
    expect(foraDeLaGuarda).not.toMatch(/:hover/);
  });

  test('focus visible amb l’anell del sistema (--sdp-focus-*)', () => {
    const focus = regla('.sp-card-copyright__enllac:focus-visible');
    expect(focus).toMatch(/outline: var\(--sdp-focus-gruix\) solid var\(--sdp-focus\);/);
    expect(focus).toMatch(/outline-offset: var\(--sdp-focus-separacio\);/);
  });

  test('àrea tàctil ≥ --sdp-touch sense moure la línia: coixí vertical i el mateix marge en negatiu', () => {
    const repos = regla('.sp-card-copyright__enllac');
    expect(repos).toMatch(/display: inline-block;/);
    expect(repos).toMatch(/vertical-align: top;/);
    expect(repos).toMatch(/padding-block: var\(--sdp-space-4\);/);
    expect(repos).toMatch(/margin-block: calc\(var\(--sdp-space-4\) \* -1\);/);
    expect(repos).toMatch(/min-inline-size: var\(--sdp-touch\);/);
    const tokens = llig('src/css/tokens.css');
    const valor = (nom) => tokens.match(new RegExp(`${nom}:\\s*([\\d.]+)`))?.[1];
    const meta = Number(valor('--sdp-text-meta')) * 16; // rem → px
    const linia = meta * Number(valor('--sdp-leading-cos'));
    const coixi = Number(valor('--sdp-space-4'));
    expect(linia + 2 * coixi).toBeGreaterThanOrEqual(Number(valor('--sdp-touch')));
  });

  test('damunt del vel de la targeta: el paràgraf puja per damunt (z-index 2 > 1)', () => {
    const capa = Number(COMPONENTS.match(/\.sp-card-copyright,\s*\.sp-card-body a,[^{]*\{\s*position: relative;\s*z-index: (\d+);/)?.[1]);
    const vel = Number(COMPONENTS.match(/\.sp-card-link-overlay \{[^}]*z-index: (\d+);/)?.[1]);
    expect(capa).toBeGreaterThan(vel);
  });

  /* Ordre del Mestre (261007) · Una sola línia a totes les targetes i a la
     capçalera: el retall va a l'enllaç, mai al paràgraf (retallaria la zona
     tàctil, que en sobreïx per dalt i per baix). */
  test('una sola línia a totes les targetes: l’enllaç es retalla amb punts suspensius, el paràgraf no retalla', () => {
    const repos = regla('.sp-card-copyright__enllac');
    expect(repos).toMatch(/overflow: hidden;/);
    expect(repos).toMatch(/text-overflow: ellipsis;/);
    expect(repos).toMatch(/white-space: nowrap;/);
    expect(repos).toMatch(/max-inline-size: 100%;/);
    expect(regla('.sp-card-copyright.page-title-copyright')).toBe('overflow: visible;');
    expect(regla('.page-title-copyright > .sp-card-copyright__enllac')).toBeNull();
    // Cap regla del paràgraf de la targeta el retalla ni el fa partir línia.
    for (const [, cos] of COMPONENTS.matchAll(/(?:^|\n)\.sp-card-copyright \{([^}]*)\}/g)) {
      expect(cos).not.toMatch(/overflow|line-clamp/);
    }
  });

  test('Pedra Seca: només tokens, cap color cru, cap ombra, cap selector de pare', () => {
    expect(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(/.test(BLOC)).toBe(false);
    expect(BLOC.includes('box-shadow')).toBe(false);
    expect(BLOC.includes([':h', 'as('].join(''))).toBe(false);
    for (const [, valor] of BLOC.matchAll(/(?:margin|padding|gap)[\w-]*:\s*([^;]+);/g)) {
      expect(valor.trim()).toMatch(/^(?:0|var\(--sdp-space-\d+\)|calc\(var\(--sdp-space-\d+\) \* -1\))$/);
    }
  });
});
