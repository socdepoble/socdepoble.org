/* Onada 0.3 (Gauntlet 261016, M04-M06) · VisorImatges: el visor de fotos a
   pantalla completa, a l'estil de Google Fotos. Un Dialeg de mida 'completa'
   i sense marc: tancat no pinta cap imatge; obert, la franja amb «Tancar»
   (focus inicial), el comptador, el zoom i el panell plegable; anterior i
   següent donen la volta (botons, fletxes i lliscament); el zoom (botons,
   tecles, doble clic, roda i pessic) escriu tres propietats CSS des d'una
   ref, cap atribut style. jsdom no té showModal: el Dialeg posa `open`. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { VisorImatges, limitaEscala } from './VisorImatges.jsx';

/* El sostre del zoom (privat a l'organisme: la porta del catàleg registra tot
   export en majúscula). */
const ESCALA_MAXIMA = 4;

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
const escala = (dialeg) => imatge(dialeg).style.getPropertyValue('--sdp-visor-escala');

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

  test('les etiquetes arriben traduïdes per qui el munta', () => {
    const { dialeg } = pinta({ etiquetes: { tanca: 'Close the viewer', posicio: 'Image {n} of {total}', seguent: 'Next image' } });
    expect(within(dialeg).getByRole('button', { name: 'Close the viewer' })).not.toBeNull();
    expect(within(dialeg).getByRole('button', { name: 'Next image' })).not.toBeNull();
    expect(dialeg.querySelector('.sdp-nomes-lector').textContent).toBe('Image 1 of 3');
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
    expect(imatge(dialeg).style.getPropertyValue('--sdp-visor-x')).toBe('0px');
    for (let i = 0; i < 6; i += 1) act(() => ampliar.click());
    expect(escala(dialeg)).toBe(String(ESCALA_MAXIMA));
    expect(dialeg.querySelector('.sdp-visor__escenari').classList.contains('sdp-visor__escenari--ampliat')).toBe(true);
    for (let i = 0; i < 6; i += 1) act(() => reduir.click());
    expect(imatge(dialeg).getAttribute('style')).toBeFalsy();
    expect(dialeg.querySelector('.sdp-visor__escenari').classList.contains('sdp-visor__escenari--ampliat')).toBe(false);
  });

  test('el doble clic amplia a 2× i torna a 1×; sobre un botó, no', () => {
    const { dialeg } = pinta();
    const escenari = dialeg.querySelector('.sdp-visor__escenari');
    fireEvent.doubleClick(escenari);
    expect(escala(dialeg)).toBe('2');
    fireEvent.doubleClick(escenari);
    expect(imatge(dialeg).getAttribute('style')).toBeFalsy();
    fireEvent.doubleClick(within(dialeg).getByRole('button', { name: 'Imatge següent' }));
    expect(imatge(dialeg).getAttribute('style')).toBeFalsy();
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
  const desplacament = (dialeg) => ['--sdp-visor-x', '--sdp-visor-y'].map((propietat) => parseFloat(imatge(dialeg).style.getPropertyValue(propietat)));
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
