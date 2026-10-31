/* Onada 0.3 (Gauntlet 261016, M04-M06) · VisorImatges: el visor de fotos a
   pantalla completa, a l'estil de Google Fotos. Un Dialeg de mida 'completa'
   i sense marc: tancat no pinta cap imatge; obert, la franja amb «Tancar»
   (focus inicial), el comptador, el zoom i el panell plegable; anterior i
   següent donen la volta (botons, fletxes i lliscament); el zoom (botons,
   tecles, doble clic, roda i pessic) escriu tres propietats CSS des d'una
   ref, cap atribut style. jsdom no té showModal: el Dialeg posa `open`. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useState } from 'react';
import { VisorImatges, limitaEscala } from './VisorImatges.jsx';
/* P1-43 · El traductor de l'app (UIProvider) i els cinc diccionaris, per a les
   etiquetes del mode fixat; els fulls, per text, per a la Llei dels 58px. */
import '../../../../tests/helpers/diccionaris.js';
import { UIProvider } from '../../../app/contexts/UIContext.jsx';
import { createTranslator } from '../../../config/i18n.js';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/* El sostre del zoom (privat a l'organisme: la porta del catàleg registra tot
   export en majúscula). */
const ESCALA_MAXIMA = 4;
/* Correccions del 261024 (R4-02) · La finestra del doble clic (privada a
   l'organisme, per la mateixa porta). */
const FINESTRA_DEL_DOBLE_CLIC = 300;

afterEach(() => {
  cleanup();
  document.querySelectorAll('soc-de-poble').forEach((el) => el.remove());
});

const FOTOS = [
  { src: '/assets/towns/tibi/1.jpg', alt: 'Tibi', titol: 'Tibi' },
  { src: '/assets/towns/sella/1.jpg', alt: 'Sella', titol: 'Sella' },
  { src: '/assets/nano_cards/mur_nano_card.jpg', alt: 'Mur', titol: 'Mur' }
];
const DADES = [
  { clau: 'data', etiqueta: 'Data i hora de captura', valor: '14/05/2017 10:22' },
  { clau: 'drets', etiqueta: 'Drets d’ús', valor: 'CC BY-SA' }
];

function pinta(props = {}) {
  const onCanvi = vi.fn();
  const onTanca = vi.fn();
  const vista = render(<VisorImatges obert imatges={FOTOS} index={0} onCanvi={onCanvi} onTanca={onTanca} metadades={DADES} {...props} />);
  const dialeg = screen.getByRole('dialog', { name: props.titol || 'Visor d’imatges' });
  return { ...vista, dialeg, onCanvi, onTanca };
}

const imatge = (dialeg) => dialeg.querySelector('img.sdp-visor__imatge');
const escala = (dialeg) => imatge(dialeg).style.getPropertyValue('--visor-escala');

describe('obrir i tancar', () => {
  test('tancat: el <dialog> és buit, no es demana cap imatge', () => {
    const { container } = render(<VisorImatges obert={false} imatges={FOTOS} index={0} />);
    const dialeg = container.querySelector('dialog');
    expect(dialeg.hasAttribute('open')).toBe(false);
    expect(dialeg.children).toHaveLength(0);
    expect(container.querySelectorAll('img')).toHaveLength(0);
  });

  test('sense cap imatge, tampoc s’obri', () => {
    const { container } = render(<VisorImatges obert imatges={[]} index={0} />);
    expect(container.querySelector('dialog').hasAttribute('open')).toBe(false);
  });

  test('obert: diàleg amb nom i classes; «Tancar» primer i amb el focus; la foto; el comptador', () => {
    const { dialeg } = pinta({ titol: 'Visor de l’Arxiu' });
    expect(dialeg.className).toBe('sdp-dialeg sdp-dialeg--completa sdp-visor sdp-dialeg--sense-marc');
    expect(dialeg.hasAttribute('open')).toBe(true);
    const tanca = within(dialeg).getByRole('button', { name: 'Tancar el visor' });
    expect(dialeg.querySelector('button')).toBe(tanca);
    expect(tanca.hasAttribute('data-sdp-focus-inicial')).toBe(true);
    expect(tanca.getAttribute('aria-keyshortcuts')).toBe('Escape');
    expect(document.activeElement).toBe(tanca);
    expect(imatge(dialeg).getAttribute('src')).toBe('/assets/towns/tibi/1.jpg');
    expect(imatge(dialeg).getAttribute('alt')).toBe('Tibi');
    expect(imatge(dialeg).getAttribute('style')).toBeNull();
    const comptador = dialeg.querySelector('.sdp-visor__comptador');
    expect(comptador.getAttribute('aria-live')).toBe('polite');
    expect(comptador.textContent).toBe('1 / 3Imatge 1 de 3');
    expect(dialeg.querySelector('h1, h2')).toBeNull();
  });

  test('«Tancar» i Escape avisen el pare', () => {
    const { dialeg, onTanca } = pinta();
    act(() => within(dialeg).getByRole('button', { name: 'Tancar el visor' }).click());
    expect(onTanca).toHaveBeenLastCalledWith('boto');
    const cancel = new Event('cancel', { cancelable: true });
    act(() => { dialeg.dispatchEvent(cancel); });
    expect(cancel.defaultPrevented).toBe(true);
    expect(onTanca).toHaveBeenLastCalledWith('esc');
  });

  /* T4 (pla 261024_1315, P1-06; ordre del Mestre del 261024: un botó ✕) ·
     «Tancar» és la X de lucide, no la fletxa d'arrere; el nom i la drecera,
     els de sempre. */
  test('«Tancar» porta la ✕ (lucide-x), mai la fletxa d’arrere, amb el nom i la drecera de sempre', () => {
    const { dialeg } = pinta();
    const tanca = within(dialeg).getByRole('button', { name: 'Tancar el visor' });
    const glifs = [...tanca.querySelectorAll('svg')].flatMap((svg) => [...svg.classList].filter((classe) => classe.startsWith('lucide-')));
    expect(glifs).toEqual(['lucide-x']);
    expect(tanca.getAttribute('aria-keyshortcuts')).toBe('Escape');
    expect(tanca.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
  });

  test('les etiquetes arriben traduïdes per qui el munta', () => {
    const { dialeg } = pinta({ etiquetes: { tanca: 'Close the viewer', posicio: 'Image {n} of {total}', seguent: 'Next image' } });
    expect(within(dialeg).getByRole('button', { name: 'Close the viewer' })).not.toBeNull();
    expect(within(dialeg).getByRole('button', { name: 'Next image' })).not.toBeNull();
    expect(dialeg.querySelector('.sdp-nomes-lector').textContent).toBe('Image 1 of 3');
  });
});

/* T4 (pla 261024_1315, P1-06; auditoria Gemini 261024, G-01.5: «tancament
   per clic al fons fosc») · Un toc net al fons buit de l'escenari tanca amb
   'vel'. Es decidix pel pointerdown: amb la captura del punter, el clic que
   comença a la foto arriba a l'escenari (com ací, on es dispara a
   l'escenari). Escape continua sent del Dialeg ('esc'). */
describe('tancar amb un clic al fons fosc', () => {
  /* Actualitzada a posta (261024 correccions): R4-02, el tancament del fons
     s'ajorna la finestra d'un doble clic. Rellotge fals i `toca` deixa passar
     la finestra després del clic: les asserts de sempre no canvien. */
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });
  const escenariDe = (dialeg) => dialeg.querySelector('.sdp-visor__escenari');
  /* Un toc complet: baixa a `desde`, s'alça a `fins`, el clic arriba a
     l'escenari i passa la finestra del doble clic. */
  const toca = (dialeg, { desde, fins = null, x = 40, y = 40, dx = 0, dy = 0, pointerType = 'mouse', detail = 1 } = {}) => {
    const escenari = escenariDe(dialeg);
    fireEvent.pointerDown(desde || escenari, { pointerId: 9, pointerType, button: 0, clientX: x, clientY: y });
    fireEvent.pointerUp(fins || escenari, { pointerId: 9, pointerType, button: 0, clientX: x + dx, clientY: y + dy });
    act(() => { fireEvent.click(escenari, { detail, clientX: x + dx, clientY: y + dy }); });
    act(() => { vi.advanceTimersByTime(FINESTRA_DEL_DOBLE_CLIC); });
  };
  /* Un clic de ratolí al fons, sense deixar passar la finestra. */
  const clicAlFons = (escenari, detail, pointerId = 9) => {
    fireEvent.pointerDown(escenari, { pointerId, pointerType: 'mouse', button: 0, clientX: 40, clientY: 40 });
    fireEvent.pointerUp(escenari, { pointerId, pointerType: 'mouse', button: 0, clientX: 40, clientY: 40 });
    act(() => { fireEvent.click(escenari, { detail, clientX: 40, clientY: 40 }); });
  };

  /* Correccions del 261024 (R4-02) · El primer clic d'un doble clic al fons
     no tanca: el tancament espera la finestra i un punter nou l'anul·la. */
  test('un clic net tanca passada la finestra del doble clic, no abans; només una vegada', () => {
    const { dialeg, onTanca } = pinta();
    clicAlFons(escenariDe(dialeg), 1);
    expect(onTanca).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(FINESTRA_DEL_DOBLE_CLIC - 1); });
    expect(onTanca).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(onTanca.mock.calls).toEqual([['vel']]);
    act(() => { vi.advanceTimersByTime(5000); });
    expect(onTanca).toHaveBeenCalledTimes(1);
  });

  test('dins de la finestra, un altre tancament o un gest nou anul·la el «vel»: el pare rep un sol avís', () => {
    const { dialeg, onTanca, rerender } = pinta();
    const escenari = escenariDe(dialeg);
    const marc = dialeg.querySelector('.sdp-visor__marc');
    // «Tancar» (un clic de programa: sense punter ni tecla que l'anul·le): només 'boto'.
    clicAlFons(escenari, 1);
    act(() => within(dialeg).getByRole('button', { name: 'Tancar el visor' }).click());
    act(() => { vi.advanceTimersByTime(1000); });
    expect(onTanca.mock.calls).toEqual([['boto']]);
    // Escape (el cancel del Dialeg, sense cap tecla abans): només 'esc'.
    clicAlFons(escenari, 1);
    act(() => { dialeg.dispatchEvent(new Event('cancel', { cancelable: true })); });
    act(() => { vi.advanceTimersByTime(1000); });
    expect(onTanca.mock.calls.map(([motiu]) => motiu)).toEqual(['boto', 'esc']);
    // Una tecla, la roda o un altre punter dins del visor: cap avís.
    clicAlFons(escenari, 1);
    fireEvent.keyDown(marc, { key: 'ArrowRight' });
    clicAlFons(escenari, 1);
    fireEvent.wheel(escenari, { deltaY: 1 });
    clicAlFons(escenari, 1);
    fireEvent.pointerDown(imatge(dialeg), { pointerId: 4, pointerType: 'touch', button: 0, clientX: 50, clientY: 50 });
    act(() => { vi.advanceTimersByTime(1000); });
    expect(onTanca.mock.calls.map(([motiu]) => motiu)).toEqual(['boto', 'esc']);
    // El pare el tanca pel seu compte: cap 'vel' tardà.
    clicAlFons(escenari, 1);
    rerender(<VisorImatges obert={false} imatges={FOTOS} index={0} onTanca={onTanca} />);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(onTanca.mock.calls.map(([motiu]) => motiu)).toEqual(['boto', 'esc']);
  });

  test('desmuntat dins de la finestra: cap «vel» tardà', () => {
    const { dialeg, onTanca, unmount } = pinta();
    clicAlFons(escenariDe(dialeg), 1);
    unmount();
    act(() => { vi.advanceTimersByTime(1000); });
    expect(onTanca).not.toHaveBeenCalled();
  });

  test('un clic net al fons buit tanca amb «vel», també amb el dit', () => {
    const { dialeg, onTanca } = pinta();
    toca(dialeg);
    expect(onTanca).toHaveBeenCalledTimes(1);
    expect(onTanca).toHaveBeenLastCalledWith('vel');
    toca(dialeg, { pointerType: 'touch', dx: 6, dy: -4 });
    expect(onTanca).toHaveBeenCalledTimes(2);
    expect(onTanca).toHaveBeenLastCalledWith('vel');
  });

  test('a la foto, a l’avís o a un control, no tanca', () => {
    const { dialeg, onTanca } = pinta();
    toca(dialeg, { desde: imatge(dialeg) });
    act(() => within(dialeg).getByRole('button', { name: 'Imatge següent' }).click());
    toca(dialeg, { desde: within(dialeg).getByRole('button', { name: 'Imatge anterior' }) });
    act(() => within(dialeg).getByRole('button', { name: 'Informació de la imatge' }).click());
    fireEvent.error(imatge(dialeg));
    toca(dialeg, { desde: dialeg.querySelector('.sdp-visor__avis') });
    expect(onTanca).not.toHaveBeenCalled();
  });

  test('arrossegar o lliscar, pessigar, el segon clic d’un doble clic o un clic sense toc: no tanca', () => {
    const { dialeg, onTanca, onCanvi } = pinta();
    // Un lliscament passa de foto i no tanca.
    toca(dialeg, { x: 300, y: 200, dx: -180, dy: 5, pointerType: 'touch' });
    expect(onCanvi).toHaveBeenLastCalledWith(1);
    // Un arrossegament curt, més enllà del marge del toc.
    toca(dialeg, { dx: 20 });
    // El pessic: dos dits.
    const escenari = escenariDe(dialeg);
    fireEvent.pointerDown(escenari, { pointerId: 1, pointerType: 'touch', button: 0, clientX: 100, clientY: 100 });
    fireEvent.pointerDown(escenari, { pointerId: 2, pointerType: 'touch', button: 0, clientX: 140, clientY: 100 });
    fireEvent.pointerUp(escenari, { pointerId: 2, pointerType: 'touch', clientX: 140, clientY: 100 });
    fireEvent.pointerUp(escenari, { pointerId: 1, pointerType: 'touch', clientX: 100, clientY: 100 });
    act(() => { fireEvent.click(escenari, { detail: 1 }); });
    // El segon clic d'un doble clic.
    toca(dialeg, { detail: 2 });
    // Un clic que no ve de cap toc (un click() de programa).
    act(() => { fireEvent.click(escenari, { detail: 1 }); });
    // Un punter cancel·lat.
    fireEvent.pointerDown(escenari, { pointerId: 4, pointerType: 'touch', button: 0, clientX: 40, clientY: 40 });
    fireEvent.pointerCancel(escenari, { pointerId: 4, pointerType: 'touch', clientX: 40, clientY: 40 });
    act(() => { fireEvent.click(escenari, { detail: 1 }); });
    // El botó dret del ratolí.
    fireEvent.pointerDown(escenari, { pointerId: 5, pointerType: 'mouse', button: 2, clientX: 40, clientY: 40 });
    fireEvent.pointerUp(escenari, { pointerId: 5, pointerType: 'mouse', button: 2, clientX: 40, clientY: 40 });
    act(() => { fireEvent.click(escenari, { detail: 1 }); });
    expect(onTanca).not.toHaveBeenCalled();
  });

  test('amb la foto ampliada, el fons l’arrossega i no tanca; tornada a 1×, sí', () => {
    const { dialeg, onTanca } = pinta();
    act(() => within(dialeg).getByRole('button', { name: 'Ampliar' }).click());
    expect(escala(dialeg)).toBe('1.5');
    toca(dialeg);
    expect(onTanca).not.toHaveBeenCalled();
    act(() => within(dialeg).getByRole('button', { name: 'Reduir' }).click());
    toca(dialeg);
    expect(onTanca).toHaveBeenLastCalledWith('vel');
  });

  test('Escape continua tancant amb «esc» (el Dialeg); el fons no canvia el motiu', () => {
    const { dialeg, onTanca } = pinta();
    toca(dialeg);
    expect(onTanca).toHaveBeenLastCalledWith('vel');
    const cancel = new Event('cancel', { cancelable: true });
    act(() => { dialeg.dispatchEvent(cancel); });
    expect(cancel.defaultPrevented).toBe(true);
    expect(onTanca).toHaveBeenLastCalledWith('esc');
    expect(onTanca.mock.calls.map(([motiu]) => motiu)).toEqual(['vel', 'esc']);
  });

  test('encastat (dins d’un <soc-de-poble>): el fons tanca amb «vel» i Escape amb «esc»', () => {
    const host = document.createElement('soc-de-poble');
    document.body.append(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const root = document.createElement('div');
    root.className = 'sdp-root';
    shadow.append(root);
    const muntatge = document.createElement('div');
    root.append(muntatge);
    const onTanca = vi.fn();
    render(<VisorImatges obert imatges={FOTOS} index={0} onTanca={onTanca} />, { container: muntatge, baseElement: root });
    const dialeg = root.querySelector('dialog.sdp-visor');
    toca(dialeg);
    expect(onTanca).toHaveBeenLastCalledWith('vel');
    act(() => { root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); });
    expect(onTanca).toHaveBeenLastCalledWith('esc');
  });
});

describe('anterior i següent', () => {
  test('els botons i les fletxes donen la volta', () => {
    const { dialeg, onCanvi } = pinta();
    act(() => within(dialeg).getByRole('button', { name: 'Imatge següent' }).click());
    expect(onCanvi).toHaveBeenLastCalledWith(1);
    act(() => within(dialeg).getByRole('button', { name: 'Imatge anterior' }).click());
    expect(onCanvi).toHaveBeenLastCalledWith(2);
    const tanca = within(dialeg).getByRole('button', { name: 'Tancar el visor' });
    fireEvent.keyDown(tanca, { key: 'ArrowRight' });
    expect(onCanvi).toHaveBeenLastCalledWith(1);
    fireEvent.keyDown(tanca, { key: 'ArrowLeft' });
    expect(onCanvi).toHaveBeenLastCalledWith(2);
    // Amb una tecla modificadora (Alt+fletxa és «arrere» al navegador), res.
    fireEvent.keyDown(tanca, { key: 'ArrowRight', altKey: true });
    expect(onCanvi).toHaveBeenCalledTimes(4);
  });

  /* Gauntlet 261017 · Abans, un clic a la foto deixava el focus al <body> (la
     foto i l'escenari no en reben) i les tecles ja no arribaven al marc. Ara
     el marc el rep (tabIndex -1), sense entrar a l'ordre de Tab. jsdom no
     enfoca en clicar: el focus del clic es fa a mà. */
  test('després de clicar la foto, el teclat continua: el marc rep el focus, fora de l’ordre de Tab', () => {
    const { dialeg, onCanvi } = pinta();
    const marc = dialeg.querySelector('.sdp-visor__marc');
    expect(marc.getAttribute('tabindex')).toBe('-1');
    expect(dialeg.querySelector('button')).toBe(within(dialeg).getByRole('button', { name: 'Tancar el visor' }));
    expect([...dialeg.querySelectorAll('[tabindex]')].filter((node) => node.tabIndex >= 0)).toEqual([]);
    fireEvent.pointerDown(dialeg.querySelector('.sdp-visor__escenari'), { pointerId: 3, pointerType: 'mouse', button: 0, clientX: 10, clientY: 10 });
    act(() => marc.focus());
    expect(document.activeElement).toBe(marc);
    fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' });
    expect(onCanvi).toHaveBeenLastCalledWith(1);
    fireEvent.keyDown(document.activeElement, { key: '+' });
    expect(escala(dialeg)).toBe('1.5');
    fireEvent.keyDown(document.activeElement, { key: 'i' });
    expect(dialeg.querySelector('aside.sdp-visor__panell').hidden).toBe(false);
  });

  test('una sola foto: sense anterior ni següent', () => {
    const { dialeg, onCanvi } = pinta({ imatges: FOTOS.slice(0, 1) });
    expect(within(dialeg).queryByRole('button', { name: 'Imatge següent' })).toBeNull();
    fireEvent.keyDown(dialeg.querySelector('.sdp-visor__marc'), { key: 'ArrowRight' });
    expect(onCanvi).not.toHaveBeenCalled();
  });

  test('lliscar el dit a l’esquerra passa a la següent; un toc curt, no', () => {
    const { dialeg, onCanvi } = pinta();
    const escenari = dialeg.querySelector('.sdp-visor__escenari');
    fireEvent.pointerDown(escenari, { pointerId: 1, pointerType: 'touch', button: 0, clientX: 300, clientY: 200 });
    fireEvent.pointerUp(escenari, { pointerId: 1, pointerType: 'touch', clientX: 120, clientY: 210 });
    expect(onCanvi).toHaveBeenLastCalledWith(1);
    fireEvent.pointerDown(escenari, { pointerId: 2, pointerType: 'touch', button: 0, clientX: 300, clientY: 200 });
    fireEvent.pointerUp(escenari, { pointerId: 2, pointerType: 'touch', clientX: 290, clientY: 200 });
    expect(onCanvi).toHaveBeenCalledTimes(1);
  });

  test('l’índex fora de rang es queda dins; la foto que canvia torna a 1×', () => {
    const { dialeg, rerender } = pinta({ index: 9 });
    expect(imatge(dialeg).getAttribute('src')).toBe('/assets/nano_cards/mur_nano_card.jpg');
    act(() => within(dialeg).getByRole('button', { name: 'Ampliar' }).click());
    expect(escala(dialeg)).toBe('1.5');
    rerender(<VisorImatges obert imatges={FOTOS} index={0} />);
    expect(imatge(dialeg).getAttribute('src')).toBe('/assets/towns/tibi/1.jpg');
    expect(imatge(dialeg).getAttribute('style')).toBeFalsy();
  });
});

describe('zoom', () => {
  test('limitaEscala: d’1× a 4×; un valor que no és un número, 1×', () => {
    expect([limitaEscala(0.2), limitaEscala(2.5), limitaEscala(99), limitaEscala(Number.NaN)]).toEqual([1, 2.5, ESCALA_MAXIMA, 1]);
  });

  test('Ampliar i Reduir (×1,5), fins al sostre de 4×; a 1×, cap estil al node', () => {
    const { dialeg } = pinta();
    const ampliar = within(dialeg).getByRole('button', { name: 'Ampliar' });
    const reduir = within(dialeg).getByRole('button', { name: 'Reduir' });
    act(() => ampliar.click());
    expect(escala(dialeg)).toBe('1.5');
    expect(imatge(dialeg).style.getPropertyValue('--visor-x')).toBe('0px');
    for (let i = 0; i < 6; i += 1) act(() => ampliar.click());
    expect(escala(dialeg)).toBe(String(ESCALA_MAXIMA));
    expect(dialeg.querySelector('.sdp-visor__escenari').classList.contains('sdp-visor__escenari--ampliat')).toBe(true);
    for (let i = 0; i < 6; i += 1) act(() => reduir.click());
    expect(imatge(dialeg).getAttribute('style')).toBeFalsy();
    expect(dialeg.querySelector('.sdp-visor__escenari').classList.contains('sdp-visor__escenari--ampliat')).toBe(false);
  });

  /* Actualitzada a posta (261024 correccions): R4-02. Abans es disparava un
     dblclick sol, que cap navegador no fa; ara la seqüència de veres
     (pointerdown/up i click amb detail 1, pointerdown/up i click amb detail 2,
     dblclick), amb el rellotge fals: al fons fosc el primer clic no tanca i el
     doble clic amplia; a la foto, igual. */
  test('el doble clic de veres, al fons fosc i a la foto, amplia a 2× i torna a 1×, sense tancar; sobre un botó, no', () => {
    vi.useFakeTimers();
    try {
      const { dialeg, onTanca } = pinta();
      const escenari = dialeg.querySelector('.sdp-visor__escenari');
      /* El destí del pointerdown decidix (la captura porta el clic a
         l'escenari); el click i el dblclick arriben a `desti`. */
      const dobleClic = (desti, baixa = desti) => {
        for (const detail of [1, 2]) {
          fireEvent.pointerDown(baixa, { pointerId: 7, pointerType: 'mouse', button: 0, clientX: 40, clientY: 40 });
          fireEvent.pointerUp(escenari, { pointerId: 7, pointerType: 'mouse', button: 0, clientX: 40, clientY: 40 });
          act(() => { fireEvent.click(desti, { detail, button: 0, clientX: 40, clientY: 40 }); });
          act(() => { vi.advanceTimersByTime(120); });
        }
        act(() => { fireEvent.doubleClick(desti, { detail: 2, button: 0, clientX: 40, clientY: 40 }); });
      };
      dobleClic(escenari);
      expect(dialeg.hasAttribute('open')).toBe(true);
      expect(escala(dialeg)).toBe('2');
      act(() => { vi.advanceTimersByTime(5000); });
      expect(onTanca).not.toHaveBeenCalled();
      dobleClic(escenari);
      expect(imatge(dialeg).getAttribute('style')).toBeFalsy();
      act(() => { vi.advanceTimersByTime(5000); });
      expect(onTanca).not.toHaveBeenCalled();
      // A la foto: el pointerdown hi baixa i el clic arriba a l'escenari.
      dobleClic(escenari, imatge(dialeg));
      expect(escala(dialeg)).toBe('2');
      dobleClic(escenari, imatge(dialeg));
      expect(imatge(dialeg).getAttribute('style')).toBeFalsy();
      // Sobre «Imatge següent»: dos clics passen dues fotos, cap zoom.
      fireEvent.doubleClick(within(dialeg).getByRole('button', { name: 'Imatge següent' }));
      expect(imatge(dialeg).getAttribute('style')).toBeFalsy();
      act(() => { vi.advanceTimersByTime(5000); });
      expect(onTanca).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  test('les tecles + − i 0', () => {
    const { dialeg } = pinta();
    const marc = dialeg.querySelector('.sdp-visor__marc');
    fireEvent.keyDown(marc, { key: '+' });
    fireEvent.keyDown(marc, { key: '=' });
    expect(escala(dialeg)).toBe('2.25');
    fireEvent.keyDown(marc, { key: '-' });
    expect(escala(dialeg)).toBe('1.5');
    fireEvent.keyDown(marc, { key: '0' });
    expect(imatge(dialeg).getAttribute('style')).toBeFalsy();
  });

  test('la roda amplia i redueix amb un listener no passiu, que es lleva en tancar', () => {
    const afegits = vi.spyOn(HTMLElement.prototype, 'addEventListener');
    const llevats = vi.spyOn(HTMLElement.prototype, 'removeEventListener');
    const { dialeg, rerender } = pinta();
    const escenari = dialeg.querySelector('.sdp-visor__escenari');
    const crida = afegits.mock.calls.find(([tipus], i) => tipus === 'wheel' && afegits.mock.contexts[i] === escenari);
    expect(crida?.[2]).toEqual({ passive: false });
    const roda = new WheelEvent('wheel', { deltaY: -100, cancelable: true, bubbles: true });
    act(() => { escenari.dispatchEvent(roda); });
    expect(roda.defaultPrevented).toBe(true);
    expect(Number(escala(dialeg))).toBeCloseTo(1.2);
    act(() => { escenari.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, cancelable: true, bubbles: true })); });
    expect(imatge(dialeg).getAttribute('style')).toBeFalsy();
    rerender(<VisorImatges obert={false} imatges={FOTOS} index={0} />);
    expect(llevats.mock.calls.some(([tipus], i) => tipus === 'wheel' && llevats.mock.contexts[i] === escenari)).toBe(true);
    afegits.mockRestore();
    llevats.mockRestore();
  });

  /* Gauntlet 261017 · La roda amplia en proporció al gir: el pas d'un ratolí
     (100 px, o 3 línies a Firefox) és ×1,2 com abans, i el trackpad (girs de
     pocs píxels) ja no salta a 4× d'una revolada. Una pàgina sencera, un pas. */
  test('la roda, en proporció al gir: píxels, línies i pàgines, amb un pas de sostre per gir', () => {
    const { dialeg } = pinta();
    const escenari = dialeg.querySelector('.sdp-visor__escenari');
    const gira = (deltaY, deltaMode = 0) => act(() => { escenari.dispatchEvent(new WheelEvent('wheel', { deltaY, deltaMode, cancelable: true, bubbles: true })); });
    gira(-10);
    expect(Number(escala(dialeg))).toBeCloseTo(1.2 ** 0.1, 5);
    for (let i = 0; i < 9; i += 1) gira(-10);
    expect(Number(escala(dialeg))).toBeCloseTo(1.2, 5);
    gira(-3, 1);
    expect(Number(escala(dialeg))).toBeCloseTo(1.44, 5);
    gira(-5000);
    expect(Number(escala(dialeg))).toBeCloseTo(1.44 * 1.2, 5);
    gira(1, 2);
    expect(Number(escala(dialeg))).toBeCloseTo(1.44, 5);
    gira(0);
    expect(Number(escala(dialeg))).toBeCloseTo(1.44, 5);
  });

  /* Revisió adversarial del 261016 · Els límits del desplaçament. jsdom no fa
     maquetació: les mides de l'escenari (clientWidth/Height) i de la foto
     pintada sense transformar (offsetWidth/Height) es fixen al node. */
  const mides = (dialeg, { escenari: [ew, eh], foto: [fw, fh] }) => {
    const esc = dialeg.querySelector('.sdp-visor__escenari');
    Object.defineProperty(esc, 'clientWidth', { configurable: true, value: ew });
    Object.defineProperty(esc, 'clientHeight', { configurable: true, value: eh });
    Object.defineProperty(imatge(dialeg), 'offsetWidth', { configurable: true, value: fw });
    Object.defineProperty(imatge(dialeg), 'offsetHeight', { configurable: true, value: fh });
    return esc;
  };
  const desplacament = (dialeg) => ['--visor-x', '--visor-y'].map((propietat) => parseFloat(imatge(dialeg).style.getPropertyValue(propietat)));
  const arrossega = (escenari, dx, dy) => {
    fireEvent.pointerDown(escenari, { pointerId: 7, pointerType: 'mouse', button: 0, clientX: 500, clientY: 350 });
    fireEvent.pointerMove(escenari, { pointerId: 7, pointerType: 'mouse', clientX: 500 + dx, clientY: 350 + dy });
    fireEvent.pointerUp(escenari, { pointerId: 7, pointerType: 'mouse', clientX: 500 + dx, clientY: 350 + dy });
  };

  test('la roda torna a passar pels límits: reduir una foto arrossegada a la vora no la deixa fora de l’escenari', () => {
    const { dialeg } = pinta();
    const escenari = mides(dialeg, { escenari: [1000, 700], foto: [1000, 700] });
    const ampliar = within(dialeg).getByRole('button', { name: 'Ampliar' });
    for (let i = 0; i < 4; i += 1) act(() => ampliar.click());
    expect(escala(dialeg)).toBe(String(ESCALA_MAXIMA));
    arrossega(escenari, 5000, 0);
    // A 4×, fins a la vora: (4 · 1000 − 1000) / 2.
    expect(desplacament(dialeg)).toEqual([1500, 0]);
    act(() => { escenari.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, cancelable: true, bubbles: true })); });
    const nova = Number(escala(dialeg));
    expect(nova).toBeCloseTo(ESCALA_MAXIMA / 1.2);
    const [x] = desplacament(dialeg);
    expect(x).toBeCloseTo((nova * 1000 - 1000) / 2);
    expect(x).toBeLessThan(1500);
  });

  test('el límit és el de la foto pintada: una foto vertical, ampliada, no es trau de l’escenari', () => {
    const { dialeg } = pinta();
    const escenari = mides(dialeg, { escenari: [1024, 703], foto: [497, 703] });
    fireEvent.doubleClick(escenari);
    expect(escala(dialeg)).toBe('2');
    arrossega(escenari, 5000, 5000);
    // A 2× la foto fa 994 px d'ample i no omple els 1024 de l'escenari: es
    // queda centrada; en vertical, fins a la vora, (2 · 703 − 703) / 2.
    expect(desplacament(dialeg)).toEqual([0, 351.5]);
    fireEvent.keyDown(dialeg.querySelector('.sdp-visor__marc'), { key: '+' });
    expect(escala(dialeg)).toBe('3');
    arrossega(escenari, -5000, 0);
    // A 3×: (3 · 497 − 1024) / 2, mai la mitja amplada de l'escenari.
    expect(desplacament(dialeg)).toEqual([-233.5, 351.5]);
  });

  test('el pessic amb dos dits amplia de manera fluida', () => {
    const { dialeg } = pinta();
    const escenari = dialeg.querySelector('.sdp-visor__escenari');
    fireEvent.pointerDown(escenari, { pointerId: 1, pointerType: 'touch', button: 0, clientX: 100, clientY: 100 });
    fireEvent.pointerDown(escenari, { pointerId: 2, pointerType: 'touch', button: 0, clientX: 200, clientY: 100 });
    fireEvent.pointerMove(escenari, { pointerId: 2, pointerType: 'touch', clientX: 350, clientY: 100 });
    expect(Number(escala(dialeg))).toBeCloseTo(2.5);
    fireEvent.pointerUp(escenari, { pointerId: 2, pointerType: 'touch', clientX: 350, clientY: 100 });
    fireEvent.pointerUp(escenari, { pointerId: 1, pointerType: 'touch', clientX: 100, clientY: 100 });
    expect(Number(escala(dialeg))).toBeCloseTo(2.5);
  });
});

describe('el panell d’informació', () => {
  test('plegat de sèrie; «Informació» i la tecla «i» el despleguen; les files són dt i dd', () => {
    const { dialeg } = pinta();
    const panell = dialeg.querySelector('aside.sdp-visor__panell');
    const info = within(dialeg).getByRole('button', { name: 'Informació de la imatge' });
    expect(panell.hidden).toBe(true);
    expect(info.getAttribute('aria-expanded')).toBe('false');
    expect(info.getAttribute('aria-controls')).toBe(panell.id);
    act(() => info.click());
    expect(panell.hidden).toBe(false);
    expect(info.getAttribute('aria-expanded')).toBe('true');
    expect(panell.getAttribute('aria-label')).toBe('Informació de la imatge');
    expect(panell.querySelector('.sdp-visor__titol').textContent).toBe('Tibi');
    expect([...panell.querySelectorAll('dt')].map((n) => n.textContent)).toEqual(['Data i hora de captura', 'Drets d’ús']);
    expect([...panell.querySelectorAll('dd')].map((n) => n.textContent)).toEqual(['14/05/2017 10:22', 'CC BY-SA']);
    fireEvent.keyDown(info, { key: 'i' });
    expect(panell.hidden).toBe(true);
  });

  test('infoInicial el deixa desplegat', () => {
    const { dialeg } = pinta({ infoInicial: true });
    expect(dialeg.querySelector('aside.sdp-visor__panell').hidden).toBe(false);
  });
});

/* Gauntlet 261017 (C05 de Codex) · onCarrega: les mides reals de la foto
   pintada, per a la fila «Resolució» de qui munta el visor. jsdom no
   descodifica: naturalWidth i naturalHeight es fixen al node. */
describe('onCarrega: les mides reals de la foto pintada', () => {
  const mides = (img, amplada, alcada) => {
    Object.defineProperty(img, 'naturalWidth', { configurable: true, value: amplada });
    Object.defineProperty(img, 'naturalHeight', { configurable: true, value: alcada });
  };

  test('en carregar, (index, { amplada, alcada }); en una altra foto, el seu índex; si no carrega, (index, null)', () => {
    const onCarrega = vi.fn();
    const { dialeg, rerender } = pinta({ onCarrega });
    expect(onCarrega).not.toHaveBeenCalled();
    mides(imatge(dialeg), 4032, 3024);
    fireEvent.load(imatge(dialeg));
    expect(onCarrega).toHaveBeenLastCalledWith(0, { amplada: 4032, alcada: 3024 });
    rerender(<VisorImatges obert imatges={FOTOS} index={2} onCarrega={onCarrega} />);
    mides(imatge(dialeg), 800, 1200);
    fireEvent.load(imatge(dialeg));
    expect(onCarrega).toHaveBeenLastCalledWith(2, { amplada: 800, alcada: 1200 });
    fireEvent.error(imatge(dialeg));
    expect(onCarrega).toHaveBeenLastCalledWith(2, null);
    expect(dialeg.querySelector('.sdp-visor__avis')).not.toBeNull();
    expect(onCarrega).toHaveBeenCalledTimes(3);
  });

  /* Revisió del Gauntlet 261017 (M4) · Una foto que no ha carregat es queda
     amb l'avís, sense <img>, i no es torna a demanar: en tornar-hi, cap load
     ni cap error nou. Abans, qui munta el visor no en sabia res més i la seua
     «Resolució» deia «Llegint…» per sempre. Ara la peça torna a dir null cada
     vegada que pinta l'avís d'una foto amb src (una sola vegada per visita). */
  test('en tornar a una foto que no ha carregat (l’avís, sense <img>), torna a dir (index, null)', () => {
    const onCarrega = vi.fn();
    const { dialeg, rerender } = pinta({ onCarrega });
    fireEvent.error(imatge(dialeg));
    expect(onCarrega).toHaveBeenLastCalledWith(0, null);
    expect(onCarrega).toHaveBeenCalledTimes(1);
    rerender(<VisorImatges obert imatges={FOTOS} index={1} onCarrega={onCarrega} />);
    mides(imatge(dialeg), 640, 480);
    fireEvent.load(imatge(dialeg));
    expect(onCarrega).toHaveBeenLastCalledWith(1, { amplada: 640, alcada: 480 });
    rerender(<VisorImatges obert imatges={FOTOS} index={0} onCarrega={onCarrega} />);
    expect(imatge(dialeg)).toBeNull();
    expect(dialeg.querySelector('.sdp-visor__avis').textContent).toBe('No s’ha pogut carregar la imatge.');
    expect(onCarrega).toHaveBeenLastCalledWith(0, null);
    expect(onCarrega).toHaveBeenCalledTimes(3);
    // Una entrada sense src no diu res: no hi ha cap foto de què parlar.
    rerender(<VisorImatges obert imatges={[{ src: '', alt: 'Buit' }]} index={0} onCarrega={onCarrega} />);
    expect(onCarrega).toHaveBeenCalledTimes(3);
  });

  test('un fitxer sense mida pròpia (un SVG) dona null, mai un 0 × 0; sense onCarrega, res peta', () => {
    const onCarrega = vi.fn();
    const { dialeg, unmount } = pinta({ onCarrega });
    mides(imatge(dialeg), 0, 0);
    fireEvent.load(imatge(dialeg));
    expect(onCarrega).toHaveBeenLastCalledWith(0, null);
    unmount();
    const sense = pinta();
    mides(imatge(sense.dialeg), 10, 10);
    expect(() => { fireEvent.load(imatge(sense.dialeg)); fireEvent.error(imatge(sense.dialeg)); }).not.toThrow();
  });
});

describe('els avisos', () => {
  test('una foto que no carrega diu que no s’ha pogut; una entrada sense src, que no en porta', () => {
    const { dialeg, rerender } = pinta();
    fireEvent.error(imatge(dialeg));
    expect(imatge(dialeg)).toBeNull();
    expect(dialeg.querySelector('.sdp-visor__avis').textContent).toBe('No s’ha pogut carregar la imatge.');
    rerender(<VisorImatges obert imatges={[{ src: '', alt: 'Buit' }, ...FOTOS]} index={0} />);
    expect(dialeg.querySelector('.sdp-visor__avis').textContent).toBe('Esta entrada no porta cap imatge.');
  });
});

describe('encastat (dins d’un <soc-de-poble>)', () => {
  test('el portal a .sdp-root amb la capa completa, el focus a «Tancar» i Escape tanca', () => {
    const host = document.createElement('soc-de-poble');
    document.body.append(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const root = document.createElement('div');
    root.className = 'sdp-root';
    shadow.append(root);
    const muntatge = document.createElement('div');
    root.append(muntatge);
    const onTanca = vi.fn();
    render(<VisorImatges obert imatges={FOTOS} index={1} onTanca={onTanca} />, { container: muntatge, baseElement: root });
    const capa = root.querySelector('.sdp-capa-modal--completa');
    expect(capa).not.toBeNull();
    const dialeg = capa.querySelector('dialog.sdp-visor');
    expect(dialeg.getAttribute('aria-modal')).toBe('true');
    expect(shadow.activeElement?.getAttribute('aria-label')).toBe('Tancar el visor');
    expect(dialeg.querySelector('img').getAttribute('src')).toBe('/assets/towns/sella/1.jpg');
    act(() => { root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); });
    expect(onTanca).toHaveBeenLastCalledWith('esc');
  });

  /* Revisió del Gauntlet 261017 (M1, A11Y-1) · El clic a la foto deixa el
     focus al marc (tabIndex -1, fora de l'ordre de Tab). La guarda de Tab de
     l'encastament (modalLocal.js) només coneixia el primer control, l'últim i
     el <dialog>: des del marc, Maj+Tab no es prevenia i el navegador portava
     el focus al web amfitrió, amb el visor obert i l'app inert. Ara Maj+Tab
     dona la volta a l'últim control; Tab, l'ordre natiu (el primer control del
     marc, «Tancar»). jsdom no mou el focus amb Tab: el natiu es comprova per
     defaultPrevented. */
  const muntaTancat = (element) => {
    const host = document.createElement('soc-de-poble');
    document.body.append(host);
    const shadow = host.attachShadow({ mode: 'closed' });
    const root = document.createElement('div');
    root.className = 'sdp-root';
    shadow.append(root);
    const muntatge = document.createElement('div');
    root.append(muntatge);
    render(element, { container: muntatge, baseElement: root });
    return { shadow, root, dialeg: root.querySelector('dialog.sdp-visor') };
  };
  const tab = (node, shiftKey = false) => {
    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true, composed: true });
    act(() => { node.dispatchEvent(event); });
    return event;
  };

  test('el marc enfocat pel clic: Maj+Tab dona la volta a l’últim control i Tab segueix l’ordre natiu; les tecles continuen', () => {
    const onCanvi = vi.fn();
    const { shadow, dialeg } = muntaTancat(<VisorImatges obert imatges={FOTOS} index={1} onTanca={vi.fn()} onCanvi={onCanvi} />);
    const marc = dialeg.querySelector('.sdp-visor__marc');
    act(() => marc.focus());
    expect(shadow.activeElement).toBe(marc);
    const enrere = tab(marc, true);
    expect(enrere.defaultPrevented).toBe(true);
    expect(shadow.activeElement?.getAttribute('aria-label')).toBe('Imatge següent');
    act(() => marc.focus());
    expect(tab(marc).defaultPrevented).toBe(false);
    fireEvent.keyDown(marc, { key: 'ArrowRight' });
    expect(onCanvi).toHaveBeenLastCalledWith(2);
  });

  test('una sola foto (la portada d’una publicació): des del marc, Maj+Tab va a «Informació de la imatge»', () => {
    const { shadow, dialeg } = muntaTancat(<VisorImatges obert imatges={FOTOS.slice(0, 1)} index={0} onTanca={vi.fn()} />);
    const marc = dialeg.querySelector('.sdp-visor__marc');
    act(() => marc.focus());
    expect(tab(marc, true).defaultPrevented).toBe(true);
    expect(shadow.activeElement?.getAttribute('aria-label')).toBe('Informació de la imatge');
    expect(dialeg.contains(shadow.activeElement)).toBe(true);
  });
});

/* P1-43 (pla 261029_0216; Llibre Mestre, fita 7) · El mode fixat del panell
   d'informació i l'aspa gran de «Tancar». Guarda de conformitat: fixat, el
   panell no es plega en passar de foto (botons i fletxes) i pinta les dades
   de la foto nova; «Informació» i «i» el pleguen i el desfixen d'un colp; dura
   el que dura el visor obert; sense fixar, tot és com abans (regressió). */
describe('el mode fixat (P1-43)', () => {
  const panellDe = (dialeg) => dialeg.querySelector('aside.sdp-visor__panell');
  const fixarDe = (dialeg) => within(panellDe(dialeg)).getByRole('button', { pressed: false, name: 'Fixar la informació' });
  const desfixarDe = (dialeg) => within(panellDe(dialeg)).getByRole('button', { pressed: true, name: 'Deixar de fixar' });
  const glifsDe = (boto) => [...boto.querySelectorAll('svg')].flatMap((svg) => [...svg.classList].filter((classe) => classe.startsWith('lucide-')));
  const obriPanell = (dialeg) => act(() => within(dialeg).getByRole('button', { name: 'Informació de la imatge' }).click());
  const DADES_SELLA = [{ clau: 'data', etiqueta: 'Data i hora de captura', valor: '02/08/2019 18:40' }];

  test('«Fixar la informació» viu dalt del panell amb aria-pressed; fixat, diu «Deixar de fixar», canvia el glif i el marc ho diu', () => {
    const { dialeg } = pinta();
    const panell = panellDe(dialeg);
    const marc = dialeg.querySelector('.sdp-visor__marc');
    // Plegat: el botó hi és però dins d'un <aside hidden>, fora de l'ordre de Tab de l'encastament.
    expect(panell.hidden).toBe(true);
    expect(panell.querySelector('.sdp-visor__fixador .sdp-visor__fixar')).not.toBeNull();
    obriPanell(dialeg);
    const fixar = fixarDe(dialeg);
    expect(panell.firstElementChild.className).toBe('sdp-visor__fixador');
    expect(fixar.className).toBe('sdp-boto sdp-boto--secundari sdp-visor__fixar');
    expect(glifsDe(fixar)).toEqual(['lucide-pin']);
    expect(marc.className).toBe('sdp-visor__marc');
    act(() => fixar.click());
    const desfixar = desfixarDe(dialeg);
    expect(desfixar).toBe(fixar);
    expect(glifsDe(desfixar)).toEqual(['lucide-pin-off']);
    expect(marc.className).toBe('sdp-visor__marc sdp-visor__marc--fixat');
    expect(panell.hidden).toBe(false);
    // Desfixar amb el mateix botó: el panell es queda obert, com estava.
    act(() => desfixar.click());
    expect(fixarDe(dialeg)).toBe(fixar);
    expect(marc.className).toBe('sdp-visor__marc');
    expect(panell.hidden).toBe(false);
  });

  test('amb el focus al botó de fixar, «i» amaga el panell sense perdre el focus fora del marc (les tecles continuen arribant)', () => {
    const { dialeg } = pinta();
    obriPanell(dialeg);
    act(() => fixarDe(dialeg).click());
    const marc = dialeg.querySelector('.sdp-visor__marc');
    act(() => desfixarDe(dialeg).focus());
    expect(panellDe(dialeg).contains(document.activeElement)).toBe(true);
    fireEvent.keyDown(document.activeElement, { key: 'i' });
    expect(panellDe(dialeg).hidden).toBe(true);
    expect(marc.contains(document.activeElement)).toBe(true);
  });

  test('fixat, el panell es manté obert en passar de foto (botons i fletxes) i pinta el títol i les dades de la nova; Escape tanca', () => {
    const { dialeg, onCanvi, onTanca, rerender } = pinta();
    obriPanell(dialeg);
    act(() => fixarDe(dialeg).click());
    expect(panellDe(dialeg).querySelector('.sdp-visor__titol').textContent).toBe('Tibi');
    act(() => within(dialeg).getByRole('button', { name: 'Imatge següent' }).click());
    expect(onCanvi).toHaveBeenLastCalledWith(1);
    // Qui el munta passa la foto nova i les seues dades: el panell continua obert i fixat.
    rerender(<VisorImatges obert imatges={FOTOS} index={1} onCanvi={onCanvi} onTanca={onTanca} metadades={DADES_SELLA} />);
    const panell = panellDe(dialeg);
    expect(panell.hidden).toBe(false);
    expect(desfixarDe(dialeg)).not.toBeNull();
    expect(panell.querySelector('.sdp-visor__titol').textContent).toBe('Sella');
    expect([...panell.querySelectorAll('dd')].map((n) => n.textContent)).toEqual(['02/08/2019 18:40']);
    expect(within(dialeg).getByRole('button', { name: 'Informació de la imatge' }).getAttribute('aria-expanded')).toBe('true');
    // Les fletxes, també des del botó de fixar (el marc les rep).
    fireEvent.keyDown(desfixarDe(dialeg), { key: 'ArrowRight' });
    expect(onCanvi).toHaveBeenLastCalledWith(2);
    fireEvent.keyDown(desfixarDe(dialeg), { key: 'ArrowLeft' });
    expect(onCanvi).toHaveBeenLastCalledWith(0);
    rerender(<VisorImatges obert imatges={FOTOS} index={2} onCanvi={onCanvi} onTanca={onTanca} metadades={DADES} />);
    expect(panellDe(dialeg).hidden).toBe(false);
    expect(panellDe(dialeg).querySelector('.sdp-visor__titol').textContent).toBe('Mur');
    expect([...panellDe(dialeg).querySelectorAll('dd')].map((n) => n.textContent)).toEqual(['14/05/2017 10:22', 'CC BY-SA']);
    // Escape continua sent del Dialeg: tanca amb 'esc', fixat o no.
    const cancel = new Event('cancel', { cancelable: true });
    act(() => { dialeg.dispatchEvent(cancel); });
    expect(onTanca).toHaveBeenLastCalledWith('esc');
  });

  test('fixat, «Informació» o la tecla «i» pleguen el panell i el desfixen d’un colp; en tornar-lo a obrir, no és fixat', () => {
    const { dialeg } = pinta();
    const info = within(dialeg).getByRole('button', { name: 'Informació de la imatge' });
    obriPanell(dialeg);
    act(() => fixarDe(dialeg).click());
    act(() => info.click());
    expect(panellDe(dialeg).hidden).toBe(true);
    expect(info.getAttribute('aria-expanded')).toBe('false');
    expect(dialeg.querySelector('.sdp-visor__marc').className).toBe('sdp-visor__marc');
    act(() => info.click());
    expect(panellDe(dialeg).hidden).toBe(false);
    expect(fixarDe(dialeg)).not.toBeNull();
    act(() => fixarDe(dialeg).click());
    fireEvent.keyDown(dialeg.querySelector('.sdp-visor__marc'), { key: 'i' });
    expect(panellDe(dialeg).hidden).toBe(true);
    fireEvent.keyDown(dialeg.querySelector('.sdp-visor__marc'), { key: 'I' });
    expect(panellDe(dialeg).hidden).toBe(false);
    expect(fixarDe(dialeg)).not.toBeNull();
  });

  test('el mode fixat dura el que dura el visor: tancat i reobert, torna plegat i sense fixar', () => {
    const { dialeg, onTanca, rerender } = pinta();
    obriPanell(dialeg);
    act(() => fixarDe(dialeg).click());
    rerender(<VisorImatges obert={false} imatges={FOTOS} index={0} onTanca={onTanca} metadades={DADES} />);
    expect(dialeg.children).toHaveLength(0);
    rerender(<VisorImatges obert imatges={FOTOS} index={0} onTanca={onTanca} metadades={DADES} />);
    expect(panellDe(dialeg).hidden).toBe(true);
    obriPanell(dialeg);
    expect(fixarDe(dialeg)).not.toBeNull();
    expect(dialeg.querySelector('.sdp-visor__marc').className).toBe('sdp-visor__marc');
  });

  /* Regressió · Sense fixar, res no canvia: el panell comença plegat (o
     desplegat amb infoInicial), «Informació» i «i» el commuten, l'estat del
     panell no es toca en passar de foto (viu al contingut del visor mentre
     és obert, com abans de P1-43) i ✕ i Escape tanquen el visor. */
  test('sense fixar, tot com abans: «Informació» i «i» commuten, passar de foto no toca el panell, ✕ i Escape tanquen', () => {
    const { dialeg, onCanvi, onTanca, rerender } = pinta();
    const info = within(dialeg).getByRole('button', { name: 'Informació de la imatge' });
    expect(panellDe(dialeg).hidden).toBe(true);
    act(() => within(dialeg).getByRole('button', { name: 'Imatge següent' }).click());
    rerender(<VisorImatges obert imatges={FOTOS} index={1} onCanvi={onCanvi} onTanca={onTanca} metadades={DADES_SELLA} />);
    expect(panellDe(dialeg).hidden).toBe(true);
    expect(info.getAttribute('aria-expanded')).toBe('false');
    act(() => info.click());
    expect(panellDe(dialeg).hidden).toBe(false);
    expect(within(panellDe(dialeg)).getByRole('button', { name: 'Fixar la informació' }).getAttribute('aria-pressed')).toBe('false');
    rerender(<VisorImatges obert imatges={FOTOS} index={2} onCanvi={onCanvi} onTanca={onTanca} metadades={DADES} />);
    expect(panellDe(dialeg).hidden).toBe(false);
    expect(dialeg.querySelector('.sdp-visor__marc').className).toBe('sdp-visor__marc');
    fireEvent.keyDown(dialeg.querySelector('.sdp-visor__marc'), { key: 'i' });
    expect(panellDe(dialeg).hidden).toBe(true);
    act(() => within(dialeg).getByRole('button', { name: 'Tancar el visor' }).click());
    expect(onTanca).toHaveBeenLastCalledWith('boto');
    const cancel = new Event('cancel', { cancelable: true });
    act(() => { dialeg.dispatchEvent(cancel); });
    expect(onTanca).toHaveBeenLastCalledWith('esc');
    expect(onTanca).toHaveBeenCalledTimes(2);
  });

  test('«Tancar» és l’aspa gran: la X de lucide a 28px dins del botó de --sdp-alt-accio, primer i amb el focus; en tancar, el focus torna a qui l’havia obert', () => {
    function Amfitrio() {
      const [obert, setObert] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setObert(true)}>Obri la foto</button>
          <VisorImatges obert={obert} imatges={FOTOS} index={0} onTanca={() => setObert(false)} metadades={DADES} />
        </>
      );
    }
    render(<Amfitrio />);
    const obridor = screen.getByRole('button', { name: 'Obri la foto' });
    act(() => obridor.focus());
    act(() => obridor.click());
    const dialeg = screen.getByRole('dialog', { name: 'Visor d’imatges' });
    const tanca = within(dialeg).getByRole('button', { name: 'Tancar el visor' });
    expect(dialeg.querySelector('button')).toBe(tanca);
    expect(tanca.className).toBe('sdp-boto sdp-boto--secundari sdp-visor__boto sdp-visor__boto--gran');
    expect(glifsDe(tanca)).toEqual(['lucide-x']);
    expect(tanca.querySelector('svg').getAttribute('width')).toBe('28');
    expect(tanca.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
    expect(tanca.getAttribute('aria-keyshortcuts')).toBe('Escape');
    expect(document.activeElement).toBe(tanca);
    act(() => tanca.click());
    expect(dialeg.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(obridor);
  });

  test('les etiquetes del mode fixat: la reserva en valencià; amb el traductor de l’app, la seua llengua; per «etiquetes», les de qui el munta', () => {
    for (const [clau, ca] of [['section.multimedia.visor.fixar', 'Fixar la informació'], ['section.multimedia.visor.desfixar', 'Deixar de fixar']]) {
      expect([clau, createTranslator('ca')(clau)]).toEqual([clau, ca]);
      for (const codi of ['es', 'en', 'eu', 'gl']) expect([codi, clau, createTranslator(codi)(clau) === ca]).toEqual([codi, clau, false]);
    }
    const { dialeg, unmount } = pinta({ infoInicial: true, etiquetes: { fixar: 'Pin info', desfixar: 'Unpin info' } });
    const boto = within(panellDe(dialeg)).getByRole('button', { name: 'Pin info' });
    act(() => boto.click());
    expect(within(panellDe(dialeg)).getByRole('button', { name: 'Unpin info', pressed: true })).toBe(boto);
    unmount();
    /* UIProvider llig el tema del sistema (matchMedia), que jsdom no porta: el simulacre d'App.test.jsx. */
    vi.stubGlobal('matchMedia', vi.fn((query) => ({
      matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn()
    })));
    try {
      render(
        <UIProvider externalConfig={{ language: 'es' }}>
          <VisorImatges obert imatges={FOTOS} index={0} metadades={DADES} infoInicial />
        </UIProvider>
      );
      const enCastella = screen.getByRole('dialog', { name: 'Visor d’imatges' });
      const fijar = within(panellDe(enCastella)).getByRole('button', { name: 'Fijar la información', pressed: false });
      act(() => fijar.click());
      expect(within(panellDe(enCastella)).getByRole('button', { name: 'Dejar de fijar', pressed: true })).toBe(fijar);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  /* Llei de Pedra Seca (tooling/gates/01_porta_pedra_seca_58px.mjs) · Els
     controls nous fan --sdp-alt-accio (58px), mai un 58px en brut, al bloc
     VISOR D'IMATGES de components.css; fixat, en mòbil el full s'acurta i els
     controls pugen; modules.css torna a dir la vora de fixat damunt del Perfil. */
  test('Pedra Seca · els controls nous fan --sdp-alt-accio (58px) i, fixat, el full de mòbil deixa lliures «anterior» i «següent»', () => {
    const llig = (full) => readFileSync(path.join(process.cwd(), 'src/css', full), 'utf8');
    const fullModuls = llig('modules.css');
    const net = llig('components.css').replace(/\/\*[\s\S]*?\*\//g, '');
    const inici = net.indexOf('.sdp-dialeg.sdp-visor.sdp-dialeg--sense-marc');
    const bloc = net.slice(inici, net.indexOf('\n}\n', inici));
    expect(inici).toBeGreaterThan(0);
    const regla = (selector) => bloc.match(new RegExp(selector.replace(/[.*+?^$()[\]\\]/g, '\\$&') + '\\s*\\{([^}]*)\\}'))?.[1] ?? '';
    const gran = regla('.sdp-visor__boto--gran');
    expect(gran).toMatch(/(?:^|[;\s])inline-size:\s*var\(--sdp-alt-accio\);/);
    expect(gran).toMatch(/(?:^|[;\s])min-inline-size:\s*var\(--sdp-alt-accio\);/);
    expect(gran).toMatch(/(?:^|[;\s])min-block-size:\s*var\(--sdp-alt-accio\);/);
    const fixar = regla('.sdp-visor__fixar');
    expect(fixar).toMatch(/(?:^|[;\s])min-block-size:\s*var\(--sdp-alt-accio\);/);
    expect(fixar).toMatch(/(?:^|[;\s])border-radius:\s*var\(--sdp-radi-pastilla\);/);
    expect(regla('.sdp-visor__fixar[aria-pressed="true"]')).toMatch(/border-color:\s*var\(--sdp-accio-control\);/);
    expect(regla('.sdp-visor__fixar:focus-visible')).toMatch(/outline-color:\s*var\(--sdp-crom-focus\);/);
    // Cap 58px ni 56px en brut, cap unitat de viewport, cap .sdp-boto al bloc.
    expect(bloc).not.toMatch(/\b5[68]px\b/);
    expect(bloc).not.toMatch(/\d(?:d|s|l)?v(?:h|w)\b/);
    expect(bloc).not.toMatch(/\.sdp-boto\b/);
    const mobil = bloc.slice(bloc.indexOf('@media (max-width: 720px)'));
    expect(mobil).toMatch(/\.sdp-visor__marc--fixat \.sdp-visor__panell \{ max-block-size: 40%; \}/);
    // D-C · cap inset en tant per cent: la franja de dalt es fa per block-size (60%) amb la vora de baix en auto.
    expect(mobil).toMatch(/\.sdp-visor__marc--fixat \.sdp-visor__controls \{ inset-block-end: auto; block-size: 60%; \}/);
    expect(fullModuls).toMatch(/\.sdp-visor \.sdp-boto--secundari\[aria-pressed="true"\] \{ border-color: var\(--sdp-accio-control\); \}/);
    expect(fullModuls).toMatch(/\.sdp-visor \.sdp-visor__fixar \{ padding: 0 var\(--sdp-space-4\); \}/);
  });
});
