/**
 * Ordre del Mestre (261007) · «Implementa un carrusel a la imatge principal
 * d'aquesta pàgina universal perquè l'usuari puga passar les fotos.»
 * CarruselImatges: la navegació (botons amb la volta, fletxes, Inici i Fi),
 * el comptador que seguix la pista, l'accessibilitat del patró Carousel de
 * l'APG, la càrrega mandrosa (la primera, no), el moviment reduït i els casos
 * d'una foto (la imatge tal qual) i de cap (res).
 */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CarruselImatges, imatgesDelCarrusel } from './CarruselImatges.jsx';

const AMPLE = 400;
const FOTOS = ['/a.png', '/b.png', '/c.png', '/d.png'].map((src, i) => ({ src, alt: `Foto ${i + 1}` }));

let desplacaments;
let reduit;
const SCROLL_TO_ORIGINAL = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTo');
const AMPLE_ORIGINAL = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
const MATCH_MEDIA_ORIGINAL = window.matchMedia;

beforeEach(() => {
  desplacaments = [];
  reduit = false;
  /* jsdom no desplaça ni mesura: la pista fa 400 px d'ample i scrollTo
     n'apunta el destí (i el deixa a scrollLeft, com el navegador en acabar). */
  Object.defineProperty(Element.prototype, 'clientWidth', {
    configurable: true,
    get() { return this.classList?.contains('sdp-carrusel__pista') ? AMPLE : 0; }
  });
  Object.defineProperty(Element.prototype, 'scrollTo', {
    configurable: true,
    writable: true,
    value(opcions) {
      desplacaments.push(opcions);
      this.scrollLeft = opcions.left;
    }
  });
  window.matchMedia = vi.fn((consulta) => ({
    matches: reduit && consulta === '(prefers-reduced-motion: reduce)',
    media: consulta, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}
  }));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
  for (const [nom, descriptor] of [['scrollTo', SCROLL_TO_ORIGINAL], ['clientWidth', AMPLE_ORIGINAL]]) {
    if (descriptor) Object.defineProperty(Element.prototype, nom, descriptor);
    else delete Element.prototype[nom];
  }
  window.matchMedia = MATCH_MEDIA_ORIGINAL;
});

const carrusel = () => screen.getByRole('region', { name: 'Imatges de la samarreta' });
const comptador = (container) => container.querySelector('.sdp-carrusel__comptador');
const pista = (container) => container.querySelector('.sdp-carrusel__pista');
const pinta = (props = {}) => render(<CarruselImatges imatges={FOTOS} etiqueta="Imatges de la samarreta" {...props} />);

describe('accessibilitat (patró Carousel de l’APG)', () => {
  test('una secció amb nom i aria-roledescription="carrusel"; cada diapositiva, un grup «Imatge X de N»', () => {
    pinta();
    const arrel = carrusel();
    expect(arrel.tagName).toBe('SECTION');
    expect(arrel.getAttribute('aria-roledescription')).toBe('carrusel');
    /* Revisió S5 (261007) · La pista, que rep el focus, és el grup
       «Diapositives» i conté les diapositives. */
    const grupDePista = within(arrel).getByRole('group', { name: 'Diapositives' });
    expect(grupDePista.className).toBe('sdp-carrusel__pista');
    expect(grupDePista.getAttribute('tabindex')).toBe('0');
    const diapositives = within(grupDePista).getAllByRole('group');
    expect(diapositives.map((d) => d.getAttribute('aria-label'))).toEqual(['Imatge 1 de 4', 'Imatge 2 de 4', 'Imatge 3 de 4', 'Imatge 4 de 4']);
    for (const d of diapositives) expect(d.getAttribute('aria-roledescription')).toBe('diapositiva');
    expect(within(diapositives[2]).getByRole('img').getAttribute('alt')).toBe('Foto 3');
  });

  test('els dos botons tenen nom, i el comptador és una regió viva que diu «Imatge X de N»', () => {
    const { container } = pinta();
    expect(screen.getByRole('button', { name: 'Imatge anterior' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Imatge següent' })).toBeTruthy();
    const viu = comptador(container);
    expect(viu.getAttribute('aria-live')).toBe('polite');
    expect(viu.getAttribute('aria-atomic')).toBe('true');
    expect(viu.querySelector('[aria-hidden="true"]').textContent).toBe('1 / 4');
    expect(viu.querySelector('.sdp-nomes-lector').textContent).toBe('Imatge 1 de 4');
  });

  test('la pista rep el focus (es desplaça), i els noms dels botons es poden canviar', () => {
    const { container } = pinta({ etiquetes: { anterior: 'Foto anterior', seguent: 'Foto següent' } });
    expect(pista(container).getAttribute('tabindex')).toBe('0');
    expect(screen.getByRole('button', { name: 'Foto anterior' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Foto següent' })).toBeTruthy();
  });

  test('sense etiqueta, «Imatges»', () => {
    render(<CarruselImatges imatges={FOTOS} />);
    expect(screen.getByRole('region', { name: 'Imatges' })).toBeTruthy();
  });

  /* Revisió del 261007 (M9) · La peça és presentacional: qui la munta li
     passa els textos traduïts. Cap text per al lector queda fix en valencià. */
  test('M9 · tots els textos per al lector arriben traduïts per props', () => {
    const { container } = render(<CarruselImatges imatges={FOTOS} etiqueta="Images of the T-shirt" etiquetes={{
      anterior: 'Previous image', seguent: 'Next image', diapositives: 'Slides',
      posicio: 'Image {n} of {total} ($&)', carrusel: 'carousel', diapositiva: 'slide'
    }} />);
    const arrel = screen.getByRole('region', { name: 'Images of the T-shirt' });
    expect(arrel.getAttribute('aria-roledescription')).toBe('carousel');
    const diapositives = within(within(arrel).getByRole('group', { name: 'Slides' })).getAllByRole('group');
    expect(diapositives.map((d) => d.getAttribute('aria-label'))).toEqual([1, 2, 3, 4].map((n) => `Image ${n} of 4 ($&)`));
    for (const d of diapositives) expect(d.getAttribute('aria-roledescription')).toBe('slide');
    expect(screen.getByRole('button', { name: 'Previous image' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next image' })).toBeTruthy();
    expect(comptador(container).querySelector('.sdp-nomes-lector').textContent).toBe('Image 1 of 4 ($&)');
  });
});

describe('càrrega', () => {
  test('la primera foto és la principal (sense loading); la resta, mandroses i asíncrones', () => {
    const { container } = pinta();
    const imatges = [...container.querySelectorAll('img.sdp-carrusel__imatge')];
    expect(imatges.map((img) => img.getAttribute('src'))).toEqual(['/a.png', '/b.png', '/c.png', '/d.png']);
    expect(imatges[0].hasAttribute('loading')).toBe(false);
    expect(imatges[0].hasAttribute('decoding')).toBe(false);
    for (const img of imatges.slice(1)) {
      expect(img.getAttribute('loading')).toBe('lazy');
      expect(img.getAttribute('decoding')).toBe('async');
    }
    for (const img of imatges) expect(img.getAttribute('draggable')).toBe('false');
  });
});

describe('navegació amb els botons', () => {
  test('Següent i Anterior mouen la pista una amplada i el comptador els seguix, amb la volta', () => {
    const { container } = pinta();
    fireEvent.click(screen.getByRole('button', { name: 'Imatge següent' }));
    expect(desplacaments.at(-1)).toEqual({ left: AMPLE, behavior: 'smooth' });
    expect(comptador(container).textContent).toContain('2 / 4');
    fireEvent.click(screen.getByRole('button', { name: 'Imatge anterior' }));
    expect(desplacaments.at(-1)).toEqual({ left: 0, behavior: 'smooth' });
    expect(comptador(container).textContent).toContain('1 / 4');
    // Abans de la primera, l'última; després de l'última, la primera.
    fireEvent.click(screen.getByRole('button', { name: 'Imatge anterior' }));
    expect(desplacaments.at(-1).left).toBe(3 * AMPLE);
    expect(comptador(container).textContent).toContain('4 / 4');
    expect(comptador(container).querySelector('.sdp-nomes-lector').textContent).toBe('Imatge 4 de 4');
    fireEvent.click(screen.getByRole('button', { name: 'Imatge següent' }));
    expect(desplacaments.at(-1).left).toBe(0);
    expect(comptador(container).textContent).toContain('1 / 4');
  });

  test('amb moviment reduït, el pas salta (behavior auto)', () => {
    reduit = true;
    pinta();
    fireEvent.click(screen.getByRole('button', { name: 'Imatge següent' }));
    expect(desplacaments.at(-1)).toEqual({ left: AMPLE, behavior: 'auto' });
  });

  test('sense scrollTo (navegadors vells, jsdom), scrollLeft', () => {
    delete Element.prototype.scrollTo;
    const { container } = pinta();
    fireEvent.click(screen.getByRole('button', { name: 'Imatge següent' }));
    expect(pista(container).scrollLeft).toBe(AMPLE);
  });
});

describe('teclat', () => {
  test('les fletxes passen les fotos (amb la volta), Inici i Fi van als extrems, des de la pista', () => {
    const { container } = pinta();
    const p = pista(container);
    fireEvent.keyDown(p, { key: 'ArrowRight' });
    expect(comptador(container).textContent).toContain('2 / 4');
    fireEvent.keyDown(p, { key: 'End' });
    expect(comptador(container).textContent).toContain('4 / 4');
    expect(desplacaments.at(-1).left).toBe(3 * AMPLE);
    fireEvent.keyDown(p, { key: 'ArrowRight' });
    expect(comptador(container).textContent).toContain('1 / 4');
    fireEvent.keyDown(p, { key: 'ArrowLeft' });
    expect(comptador(container).textContent).toContain('4 / 4');
    fireEvent.keyDown(p, { key: 'Home' });
    expect(comptador(container).textContent).toContain('1 / 4');
    expect(desplacaments.at(-1).left).toBe(0);
  });

  test('també des dels botons, i la tecla no fa el desplaçament natiu (preventDefault)', () => {
    const { container } = pinta();
    const boto = screen.getByRole('button', { name: 'Imatge següent' });
    const natiu = fireEvent.keyDown(boto, { key: 'ArrowRight' });
    expect(natiu).toBe(false);
    expect(comptador(container).textContent).toContain('2 / 4');
  });

  test('amb una tecla modificadora (Alt+fletxa és «arrere») o una altra tecla, res', () => {
    const { container } = pinta();
    const p = pista(container);
    for (const tecla of [{ key: 'ArrowRight', altKey: true }, { key: 'ArrowRight', metaKey: true }, { key: 'ArrowRight', ctrlKey: true }, { key: 'ArrowRight', shiftKey: true }, { key: 'Enter' }, { key: 'ArrowDown' }]) {
      expect(fireEvent.keyDown(p, tecla), JSON.stringify(tecla)).toBe(true);
    }
    expect(desplacaments).toEqual([]);
    expect(comptador(container).textContent).toContain('1 / 4');
  });
});

describe('el comptador seguix el dit', () => {
  test('quan la pista para, diu la foto que es veu (no a mitjan pas)', () => {
    vi.useFakeTimers();
    const { container } = pinta();
    const p = pista(container);
    p.scrollLeft = 1.4 * AMPLE;
    fireEvent.scroll(p);
    p.scrollLeft = 2 * AMPLE;
    fireEvent.scroll(p);
    // Encara es mou: el número no salta.
    expect(comptador(container).textContent).toContain('1 / 4');
    act(() => { vi.advanceTimersByTime(150); });
    expect(comptador(container).textContent).toContain('3 / 4');
  });

  test('desmuntat a mitjan gest, el temporitzador no escriu en un component mort', () => {
    vi.useFakeTimers();
    const avisos = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container, unmount } = pinta();
    fireEvent.scroll(pista(container));
    unmount();
    act(() => { vi.advanceTimersByTime(500); });
    expect(avisos).not.toHaveBeenCalled();
  });
});

describe('una foto o cap (Llei del Píxel)', () => {
  test('una sola foto: la imatge tal qual, sense pista, botons ni comptador', () => {
    const { container } = render(<CarruselImatges imatges={[FOTOS[0]]} etiqueta="Imatges de la samarreta" />);
    expect(container.innerHTML).toBe('<img src="/a.png" alt="Foto 1">');
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('region')).toBeNull();
  });

  test('cap foto (o cap amb src): res', () => {
    for (const imatges of [[], undefined, null, [{ alt: 'sense src' }, { src: '  ' }]]) {
      const { container } = render(<CarruselImatges imatges={imatges} />);
      expect(container.innerHTML, JSON.stringify(imatges)).toBe('');
      cleanup();
    }
  });
});

/* Gauntlet 261017 (C04 de Codex: «La fotografia de /mercat/mac-mini-m4 no
   obri cap modal en clicar-la») · Amb onObri, cada foto és un botó amb nom
   que la demana a pantalla completa; qui munta el carrusel hi posa el visor.
   Passar fotos (el dit, el ratolí arrossegant, la pista que llisca) no l'obri. */
describe('onObri: cada foto obri el visor', () => {
  const botonsDeFoto = (container) => [...pista(container).querySelectorAll('.sdp-carrusel__diapositiva > button')];

  test('sense onObri, cap botó dins de la pista (Llei del Píxel)', () => {
    const { container } = pinta();
    expect(pista(container).querySelector('button')).toBeNull();
    expect(pista(container).querySelectorAll('.sdp-carrusel__diapositiva > img.sdp-carrusel__imatge')).toHaveLength(4);
  });

  test('cada foto, dins d’un <button> amb nom i aria-haspopup; només el de la foto que es veu és a l’ordre de Tab', () => {
    const { container } = pinta({ onObri: vi.fn(), etiquetes: { obri: 'View the image full screen' } });
    const botons = botonsDeFoto(container);
    expect(botons).toHaveLength(4);
    for (const [i, boto] of botons.entries()) {
      expect(boto.type).toBe('button');
      expect(boto.getAttribute('aria-haspopup')).toBe('dialog');
      expect(boto.getAttribute('aria-label')).toBe('View the image full screen');
      expect(boto.querySelector('img.sdp-carrusel__imatge').getAttribute('src')).toBe(FOTOS[i].src);
      expect(boto.getAttribute('class')).toBeNull();
    }
    expect(botons.map((boto) => boto.tabIndex)).toEqual([0, -1, -1, -1]);
    fireEvent.click(screen.getByRole('button', { name: 'Imatge següent' }));
    expect(botonsDeFoto(container).map((boto) => boto.tabIndex)).toEqual([-1, 0, -1, -1]);
    // Sense etiqueta, la reserva valenciana.
    cleanup();
    const segon = pinta({ onObri: vi.fn() });
    expect(botonsDeFoto(segon.container)[0].getAttribute('aria-label')).toBe('Veure la imatge a pantalla completa');
  });

  test('un clic sense moure’s (o Intro i Espai, que no porten premut) obri la seua foto i passa el botó', () => {
    const onObri = vi.fn();
    const { container } = pinta({ onObri });
    const botons = botonsDeFoto(container);
    fireEvent.pointerDown(botons[2], { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 100, clientY: 100 });
    fireEvent.click(botons[2], { detail: 1, clientX: 104, clientY: 103 });
    expect(onObri).toHaveBeenLastCalledWith(2, botons[2]);
    fireEvent.click(botons[0], { detail: 0 });
    expect(onObri).toHaveBeenLastCalledWith(0, botons[0]);
    expect(onObri).toHaveBeenCalledTimes(2);
  });

  test('passar fotos no l’obri: el ratolí que arrossega, el dit que llisca la pista', () => {
    const onObri = vi.fn();
    const { container } = pinta({ onObri });
    const [primer] = botonsDeFoto(container);
    fireEvent.pointerDown(primer, { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 300, clientY: 100 });
    fireEvent.click(primer, { detail: 1, clientX: 180, clientY: 102 });
    expect(onObri).not.toHaveBeenCalled();
    fireEvent.pointerDown(primer, { pointerId: 2, pointerType: 'touch', button: 0, clientX: 200, clientY: 100 });
    pista(container).scrollLeft = 60;
    fireEvent.scroll(pista(container));
    fireEvent.click(primer, { detail: 1, clientX: 200, clientY: 100 });
    expect(onObri).not.toHaveBeenCalled();
    // Un clic net després, sí: el premut d'abans no s'hi queda.
    fireEvent.pointerDown(primer, { pointerId: 3, pointerType: 'touch', button: 0, clientX: 200, clientY: 100 });
    fireEvent.click(primer, { detail: 1, clientX: 202, clientY: 101 });
    expect(onObri).toHaveBeenCalledTimes(1);
  });

  test('amb el focus a una foto, les fletxes, Inici i Fi s’emporten el focus a la nova (Intro obri la que es veu)', () => {
    const onObri = vi.fn();
    const { container } = pinta({ onObri });
    act(() => botonsDeFoto(container)[0].focus());
    fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(botonsDeFoto(container)[1]);
    expect(comptador(container).textContent).toContain('2 / 4');
    expect(desplacaments.at(-1)).toEqual({ left: AMPLE, behavior: 'smooth' });
    fireEvent.keyDown(document.activeElement, { key: 'ArrowLeft' });
    fireEvent.keyDown(document.activeElement, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(botonsDeFoto(container)[3]);
    fireEvent.keyDown(document.activeElement, { key: 'Home' });
    expect(document.activeElement).toBe(botonsDeFoto(container)[0]);
    fireEvent.keyDown(document.activeElement, { key: 'End' });
    expect(document.activeElement).toBe(botonsDeFoto(container)[3]);
    fireEvent.click(document.activeElement, { detail: 0 });
    expect(onObri).toHaveBeenLastCalledWith(3, botonsDeFoto(container)[3]);
    // Des de la pista, el focus es queda a la pista, com abans.
    act(() => pista(container).focus());
    fireEvent.keyDown(pista(container), { key: 'ArrowRight' });
    expect(document.activeElement).toBe(pista(container));
  });

  test('una sola foto: la imatge tal qual, també amb onObri (la portada sola en fa el botó qui la munta)', () => {
    const { container } = render(<CarruselImatges imatges={[FOTOS[0]]} onObri={vi.fn()} />);
    expect(container.innerHTML).toBe('<img src="/a.png" alt="Foto 1">');
  });
});

describe('imatgesDelCarrusel', () => {
  test('accepta cadenes i objectes, descarta els que no porten src i normalitza l’alt', () => {
    expect(imatgesDelCarrusel(['/a.png', { src: ' /b.png ', alt: 'B' }, { src: '' }, null, { src: '/c.png', alt: 3 }])).toEqual([
      { src: '/a.png', alt: '' }, { src: '/b.png', alt: 'B' }, { src: '/c.png', alt: '' }
    ]);
    expect(imatgesDelCarrusel('no és una llista')).toEqual([]);
  });
});
