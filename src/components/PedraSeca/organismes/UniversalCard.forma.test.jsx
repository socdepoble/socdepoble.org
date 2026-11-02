/**
 * IDEA-42 (B7h, marató 261101_2143; spec B7-PEDRA §2.9c) · La targeta 16:9
 * amb punt focal: `formaMitja` ('16:9') i `posicioMitja` ({ cx, cy, zoom }).
 *  · Sense `formaMitja` (o amb un altre valor), el DOM de sempre, byte a byte.
 *  · Amb '16:9', la classe sp-card-media-container--16-9 i, quan la foto diu
 *    la seua proporció (load), les tres propietats pròpies que llig
 *    components.css, escrites des d'una ref (cap atribut style en JSX).
 *  · Un punt hostil no escriu res; una foto nova torna a començar.
 * jsdom no carrega imatges: naturalWidth i naturalHeight es definixen a
 * l'element i es dispara el load a mà.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext';
import { posicioDeRetall } from '../../universal/enquadrament/enquadrament.js';

vi.mock('../../universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: () => {} }) }));

import { UniversalCard } from './UniversalCard.jsx';

afterEach(cleanup);

const BASE = Object.freeze({
  title: 'Aplec de la Torre', body: 'Música i paella.', imageUrl: '/assets/fotos/aplec.webp', imageAlt: 'Cartell',
  author: 'Pepa', mainHref: '/events/aplec-2023', labels: [{ text: 'Aplec', className: 'sdp-badge-category' }], hasFooter: true
});
const pinta = (props) => render(
  <MemoryRouter rutaInicial="/mur">
    <UniversalCard {...BASE} {...props} />
  </MemoryRouter>
);
const html = (props) => {
  const { container } = pinta(props);
  const sortida = container.innerHTML;
  cleanup();
  return sortida;
};
const carrega = (img, amplada, alcada) => {
  Object.defineProperty(img, 'naturalWidth', { configurable: true, value: amplada });
  Object.defineProperty(img, 'naturalHeight', { configurable: true, value: alcada });
  act(() => { fireEvent.load(img); });
};
const variables = (img) => ['--targeta-mitja-x', '--targeta-mitja-y', '--targeta-mitja-zoom'].map((nom) => img.style.getPropertyValue(nom));

describe('sense forma, la targeta de sempre', () => {
  test.each([undefined, null, '', '1:1', '4:3', '16/9', ' 16:9', { format: '16:9' }])('formaMitja %s: el DOM és byte a byte el de sense la prop', (formaMitja) => {
    const abans = html({});
    expect(html({ formaMitja, posicioMitja: { cx: 0.2, cy: 0.2, zoom: 2 } })).toBe(abans);
    expect(abans).toContain('<div class="sp-card-media-container"><img class="sp-card-media"');
  });

  test('sense imatge, cap mitjà, tampoc amb forma', () => {
    const { container } = pinta({ imageUrl: '', formaMitja: '16:9', posicioMitja: { cx: 0.5, cy: 0.5, zoom: 1 } });
    expect(container.querySelector('.sp-card-media-container')).toBeNull();
  });
});

describe('amb la forma 16:9', () => {
  test('la classe, els mateixos atributs de la imatge i, abans de carregar, cap propietat (centrada)', () => {
    const { container } = pinta({ formaMitja: '16:9', posicioMitja: { cx: 0.3, cy: 0.5, zoom: 2 } });
    const caixa = container.querySelector('.sp-card-media-container');
    expect(caixa.className).toBe('sp-card-media-container sp-card-media-container--16-9');
    const img = caixa.querySelector('img.sp-card-media');
    expect([img.getAttribute('src'), img.getAttribute('alt'), img.getAttribute('loading'), img.getAttribute('decoding')])
      .toEqual(['/assets/fotos/aplec.webp', 'Cartell', 'lazy', 'async']);
    expect(img.hasAttribute('style')).toBe(false);
  });

  test('en carregar, les propietats són les de posicioDeRetall amb la proporció de la foto', () => {
    const punt = { cx: 0.3, cy: 0.5, zoom: 2 };
    const { container } = pinta({ formaMitja: '16:9', posicioMitja: punt });
    const img = container.querySelector('img.sp-card-media');
    carrega(img, 2000, 1000);
    const esperat = posicioDeRetall(punt, 2);
    expect(esperat).toEqual({ x: 14, y: 50, zoom: 2 });
    expect(variables(img)).toEqual(['14%', '50%', '2']);
  });

  test('sense punt focal, la forma sola: 16:9 centrada, cap propietat', () => {
    const { container } = pinta({ formaMitja: '16:9' });
    const img = container.querySelector('img.sp-card-media');
    carrega(img, 2000, 1000);
    expect(container.querySelector('.sp-card-media-container--16-9')).not.toBeNull();
    expect(variables(img)).toEqual(['', '', '']);
  });

  test.each([
    ['cx en text', { cx: '0.3', cy: 0.5, zoom: 1 }],
    ['una injecció CSS', { cx: '0.3; background: url(//rastreig.example)', cy: 0.5, zoom: 1 }],
    ['zoom NaN', { cx: 0.3, cy: 0.5, zoom: Number.NaN }],
    ['una cadena', '30% 50%']
  ])('un punt hostil (%s) no escriu cap propietat', (_, posicioMitja) => {
    const { container } = pinta({ formaMitja: '16:9', posicioMitja });
    const img = container.querySelector('img.sp-card-media');
    carrega(img, 2000, 1000);
    expect(variables(img)).toEqual(['', '', '']);
  });

  test('una foto nova torna a començar: les propietats de l’anterior se’n van fins que carrega la seua', () => {
    const punt = { cx: 0.3, cy: 0.5, zoom: 2 };
    const vista = pinta({ formaMitja: '16:9', posicioMitja: punt });
    const img = () => vista.container.querySelector('img.sp-card-media');
    carrega(img(), 2000, 1000);
    expect(variables(img())).toEqual(['14%', '50%', '2']);
    vista.rerender(<MemoryRouter rutaInicial="/mur"><UniversalCard {...BASE} imageUrl="/assets/fotos/cartell.webp" formaMitja="16:9" posicioMitja={punt} /></MemoryRouter>);
    expect(img().getAttribute('src')).toBe('/assets/fotos/cartell.webp');
    expect(variables(img())).toEqual(['', '', '']);
    carrega(img(), 723, 1024);
    const esperat = posicioDeRetall(punt, 723 / 1024);
    expect(variables(img())).toEqual([`${esperat.x}%`, `${esperat.y}%`, String(esperat.zoom)]);
  });

  /* Corrector B7h (B7h-A02) · Decisió 3 (261007): la foto pròpia d'una
     targeta privada no envia el referent. El camí 16:9 és una altra <img> i
     ha de dir el mateix que la quadrada, amb la prop i sense. */
  test.each([[true, 'no-referrer'], [false, null]])('imatgePrivada %s: la imatge 16:9 porta el mateix referrerpolicy que la quadrada (%s)', (imatgePrivada, politica) => {
    const { container } = pinta({ imatgePrivada, formaMitja: '16:9', posicioMitja: { cx: 0.3, cy: 0.5, zoom: 2 } });
    const img = container.querySelector('.sp-card-media-container--16-9 > img.sp-card-media');
    expect(img.getAttribute('referrerpolicy')).toBe(politica);
    cleanup();
    const quadrada = pinta({ imatgePrivada }).container.querySelector('.sp-card-media-container > img.sp-card-media');
    expect(quadrada.getAttribute('referrerpolicy')).toBe(politica);
  });

  /* Corrector B7h (B7h-A05) · El load no és un esdeveniment discret de React
     (prioritat per defecte): sense flushSync, l'estat quedaria programat i la
     foto es pintaria un fotograma centrada. Ací el load es dispara fora
     d'act() (i sense l'entorn d'act, que ho buidaria tot en acabar): quan
     dispatchEvent torna, les propietats ja hi han de ser. */
  test('el load es confirma dins de la mateixa tasca: les propietats ja hi són quan dispatchEvent torna', () => {
    const { container } = pinta({ formaMitja: '16:9', posicioMitja: { cx: 0.3, cy: 0.5, zoom: 2 } });
    const img = container.querySelector('img.sp-card-media');
    Object.defineProperty(img, 'naturalWidth', { configurable: true, value: 2000 });
    Object.defineProperty(img, 'naturalHeight', { configurable: true, value: 1000 });
    const entornAct = globalThis.IS_REACT_ACT_ENVIRONMENT;
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
    try {
      img.dispatchEvent(new Event('load'));
      expect(variables(img)).toEqual(['14%', '50%', '2']);
    } finally {
      globalThis.IS_REACT_ACT_ENVIRONMENT = entornAct;
    }
  });

  test('llevar la forma torna al DOM de sempre, sense propietats òrfenes', () => {
    const punt = { cx: 0.3, cy: 0.5, zoom: 2 };
    const vista = pinta({ formaMitja: '16:9', posicioMitja: punt });
    carrega(vista.container.querySelector('img.sp-card-media'), 2000, 1000);
    vista.rerender(<MemoryRouter rutaInicial="/mur"><UniversalCard {...BASE} /></MemoryRouter>);
    const img = vista.container.querySelector('img.sp-card-media');
    expect(img.closest('.sp-card-media-container').className).toBe('sp-card-media-container');
    expect(img.hasAttribute('style')).toBe(false);
  });
});

describe('el full: components.css', () => {
  const css = readFileSync(path.join(process.cwd(), 'src/css/components.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const cos = (selector) => {
    const i = css.indexOf(`${selector} {`);
    return i < 0 ? null : css.slice(i + selector.length + 2, css.indexOf('}', i)).replace(/\s+/g, ' ').trim();
  };
  /* La regla viu dins d'un bloc `@layer components {` encara obert (la mateixa capa que .sp-card-media-container). */
  const dinsDeComponents = (marca) => {
    const abans = css.slice(0, css.indexOf(marca));
    const tram = abans.slice(abans.lastIndexOf('@layer components {'));
    return tram.split('{').length - tram.split('}').length === 1;
  };

  test('el contenidor 16:9, en la capa de .sp-card-media-container, i el de sempre continua 1:1', () => {
    expect(cos('.sp-card-media-container--16-9')).toBe('aspect-ratio: 16 / 9;');
    expect(cos('.sp-card-media-container')).toContain('aspect-ratio: 1 / 1;');
    expect(dinsDeComponents('.sp-card-media-container--16-9 {')).toBe(true);
    expect(dinsDeComponents('.sp-card-media-container {')).toBe(true);
    expect(css.indexOf('.sp-card-media-container--16-9 {')).toBeGreaterThan(css.indexOf('.sp-card-media-container {'));
  });

  test('la imatge: posició i origen al mateix punt, l’escala, i la de sèrie centrada i sense ampliar', () => {
    const regla = cos('.sp-card-media-container--16-9 > .sp-card-media');
    expect(regla).toContain('object-position: var(--targeta-mitja-x, 50%) var(--targeta-mitja-y, 50%);');
    expect(regla).toContain('transform-origin: var(--targeta-mitja-x, 50%) var(--targeta-mitja-y, 50%);');
    expect(regla).toContain('transform: scale(var(--targeta-mitja-zoom, 1));');
    expect(regla).not.toMatch(/\d+px|#[0-9a-f]{3,8}\b/i);
  });
});
