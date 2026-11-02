/**
 * IDEA-42 (B7h, marató 261101_2143; spec B7-PEDRA §2.9b) · El cartell sencer
 * a la pàgina universal. Quan l'autor ho tria (portada_sencera === true,
 * coaccionat), la portada VERTICAL d'una publicació (VisorDePublicacio, la
 * ranura heroComponent de PageFrame) porta sdp-visor__obridor--sencer i
 * components.css li lleva el límit d'alçada: la mida natural, mai ampliada.
 * Una quadrada o una apaïsada, i tota portada sense la clau, el DOM de sempre.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { VisorDePublicacio } from './VisorDePublicacio.jsx';
import { portadaDElement } from './detailSectionMeta.jsx';

afterEach(cleanup);

const DADES = Object.freeze({ titol: 'Aplec 2023', autor: 'Sóc de Poble', drets: null, poble: null, article: { sectionId: 'events', id: 'aplec-2023' } });
const CARTELL = '/assets/fotos/aplec-cartell.webp';
const carrega = (img, amplada, alcada) => {
  Object.defineProperty(img, 'naturalWidth', { configurable: true, value: amplada });
  Object.defineProperty(img, 'naturalHeight', { configurable: true, value: alcada });
  fireEvent.load(img);
};
const boto = (container) => container.querySelector('button.sdp-visor__obridor');

describe('VisorDePublicacio · sencera', () => {
  test('un cartell vertical (A4, 723×1024) amb sencera: la marca de sempre i --sencer', () => {
    const { container } = render(<VisorDePublicacio fotos={[CARTELL]} dades={DADES} etiquetaObri="Veure la imatge" sencera />);
    expect(boto(container).className).toBe('sdp-visor__obridor');
    carrega(boto(container).querySelector('img'), 723, 1024);
    expect(boto(container).className).toBe('sdp-visor__obridor sdp-visor__obridor--vertical sdp-visor__obridor--sencer');
  });

  test.each([[1600, 900], [1200, 1200]])('una apaïsada o quadrada (%s × %s) amb sencera: res de nou', (amplada, alcada) => {
    const { container } = render(<VisorDePublicacio fotos={[CARTELL]} dades={DADES} etiquetaObri="Veure la imatge" sencera />);
    carrega(boto(container).querySelector('img'), amplada, alcada);
    expect(boto(container).className).toBe('sdp-visor__obridor');
  });

  test.each([undefined, false, 'true', 1, {}])('sencera %s: la vertical de sempre, sense --sencer', (sencera) => {
    const { container } = render(<VisorDePublicacio fotos={[CARTELL]} dades={DADES} etiquetaObri="Veure la imatge" sencera={sencera} />);
    carrega(boto(container).querySelector('img'), 723, 1024);
    expect(boto(container).className).toBe('sdp-visor__obridor sdp-visor__obridor--vertical');
  });

  test('sense sencera, el DOM és byte a byte el d’abans (vertical i apaïsada)', () => {
    for (const [amplada, alcada] of [[723, 1024], [1600, 900]]) {
      const una = render(<VisorDePublicacio fotos={[CARTELL]} dades={DADES} etiquetaObri="Veure la imatge" />);
      carrega(boto(una.container).querySelector('img'), amplada, alcada);
      const abans = una.container.innerHTML;
      cleanup();
      const altra = render(<VisorDePublicacio fotos={[CARTELL]} dades={DADES} etiquetaObri="Veure la imatge" sencera={false} />);
      carrega(boto(altra.container).querySelector('img'), amplada, alcada);
      expect(altra.container.innerHTML).toBe(abans);
      cleanup();
    }
  });
});

describe('portadaDElement · la portada sencera ve de l’element, coaccionada', () => {
  const SECCIO = Object.freeze({ listPath: '/calendari', getImages: () => [] });
  const PAGINA = Object.freeze({ title: 'Aplec 2023', heroImage: CARTELL, heroAlt: 'Cartell de l’Aplec' });
  const t = (_, reserva) => reserva;
  const sencera = (item) => portadaDElement(SECCIO, item, PAGINA, t).topBarData.heroComponent.props.sencera;

  test('portada_sencera: true → sencera', () => {
    expect(sencera({ id: 'aplec-2023', portada_sencera: true })).toBe(true);
  });

  test.each([['la cadena "true"', 'true'], ['1', 1], ['un objecte', { valueOf: () => true }], ['absent', undefined]])(
    'portada_sencera %s → no',
    (_, valor) => {
      expect(sencera({ id: 'aplec-2023', ...(valor === undefined ? {} : { portada_sencera: valor }) })).toBe(false);
    }
  );

  test('heretada del prototip → no', () => {
    expect(sencera(Object.assign(Object.create({ portada_sencera: true }), { id: 'aplec-2023' }))).toBe(false);
  });

  test('el muntatge sencer: el cartell vertical de l’element amb la clau porta --sencer', () => {
    const { heroComponent } = portadaDElement(SECCIO, { id: 'aplec-2023', portada_sencera: true }, PAGINA, t).topBarData;
    const { container } = render(heroComponent);
    carrega(boto(container).querySelector('img'), 723, 1024);
    expect(boto(container).classList.contains('sdp-visor__obridor--sencer')).toBe(true);
  });
});

describe('el full: components.css', () => {
  const css = readFileSync(path.join(process.cwd(), 'src/css/components.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  test('la regla del cartell sencer lleva el límit, viu a la capa components i va després de la guarda vertical', () => {
    const regla = '.hero-image .sdp-visor__obridor--sencer > img { max-height: none; }';
    const on = css.indexOf(regla);
    expect(on).toBeGreaterThan(css.indexOf('.hero-image .sdp-visor__obridor--vertical > img {'));
    const tram = css.slice(css.slice(0, on).lastIndexOf('@layer components {'), on);
    expect(tram.split('{').length - tram.split('}').length).toBe(1);
    /* La mateixa especificitat (dues classes i un element): guanya per l'ordre. */
    expect(css.slice(css.indexOf('.hero-image .sdp-visor__obridor--vertical > img {'), on)).toMatch(/max-width:\s*100%;/);
  });
});
