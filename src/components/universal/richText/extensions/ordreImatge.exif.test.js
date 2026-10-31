import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/* P1-64 (pla 261028_1526 §3.1.1; Mestre 261028, decisió 8) · Les fotos del
   cos d'una publicació (l'ordre «/» Imatge) oferixen la casella de l'EXIF quan
   porten la ubicació o la data (demanaExif, el diàleg de DocumentEditor): la
   tria va a compressImage i el node porta el registre en data-*. Sense res a
   conservar, el camí de sempre i cap pregunta. jsdom no té canvas:
   compressImage se simula; la lectura de l'EXIF és la de veres. */
const dobles = vi.hoisted(() => ({ compressImage: vi.fn() }));
vi.mock('../../../../utils/imageUtils.js', () => ({ compressImage: dobles.compressImage }));
vi.mock('../../../../hooks/useResolvedAsset.js', () => ({ useResolvedAsset: (ref) => ref }));
import { createElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { creaOrdres, extensionsRiques } from './index.js';
import SdpImageNodeView from './SdpImageNodeView.jsx';
import { ERROR_EXIF_NO_CONSERVABLE } from '../../enquadrament/exifIncrustat.js';
import { dataOriginal, gpsTorre, jpegAmbExif } from '../../../../../tests/helpers/jpegProva.js';

const CURT = 'data:image/webp;base64,AAAA';
const PNG = `data:image/png;base64,${btoa(String.fromCharCode(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13))}`;
const JPEG = `data:image/jpeg;base64,${btoa(String.fromCharCode(0xff, 0xd8, 0xff, 0xe0, 0, 16))}`;

function editorFals() {
  const cadena = { focus: () => cadena, deleteRange: () => cadena, setImage: vi.fn(() => cadena), run: vi.fn(() => true) };
  return { editor: { chain: () => cadena }, cadena };
}
function triaRa(fitxer) {
  vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function tria() {
    Object.defineProperty(this, 'files', { value: [fitxer], configurable: true });
    this.dispatchEvent(new Event('change'));
  });
}
const ordreImatge = (opcions) => creaOrdres(opcions).find((o) => o.id === 'imatge');
const fotoGps = () => new File([jpegAmbExif({ exif: dataOriginal('2017:05:14 10:22:33'), gps: gpsTorre() })], 'font.jpg', { type: 'image/jpeg' });
const fotoData = () => new File([jpegAmbExif({ exif: dataOriginal('2017:05:14 10:22:33') })], 'festa.jpg', { type: 'image/jpeg' });
const fotoNeta = () => new File(['x'], 'neta.jpg', { type: 'image/jpeg' });
const RANG = { from: 1, to: 2 };

beforeEach(() => {
  dobles.compressImage.mockReset().mockResolvedValue(CURT);
  vi.stubGlobal('fetch', vi.fn(async () => ({ blob: async () => new Blob(['w'], { type: 'image/webp' }) })));
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('P1-64 · l’ordre «/» Imatge i l’EXIF de les fotos del cos', () => {
  test('amb GPS i la casella marcada: compressImage rep conservaExif, original i precisio; el node, data-lat, data-lng, data-precisio i data-captura', async () => {
    const foto = fotoGps();
    triaRa(foto);
    const demanaExif = vi.fn(async () => ({ conserva: true, precisio: '100m' }));
    const { editor, cadena } = editorFals();
    await ordreImatge({ demanaExif }).executa({ editor, range: RANG });
    expect(demanaExif).toHaveBeenCalledTimes(1);
    expect(demanaExif.mock.calls[0][0]).toBe(foto);
    expect(demanaExif.mock.calls[0][1]).toMatchObject({ gps: { lat: 38.5919, lng: -0.4184 }, dataCaptura: '2017-05-14T10:22:33' });
    expect(dobles.compressImage).toHaveBeenCalledWith(foto, {
      maxSize: 1200, format: 'image/webp', quality: 0.8, conservaExif: true, original: foto, precisio: '100m',
    });
    expect(cadena.setImage).toHaveBeenCalledWith({
      src: CURT, alt: 'font.jpg', lat: '38.592', lng: '-0.418', precisio: '100m', captura: '2017-05-14T10:22:33',
    });
  });

  test('una foto amb només la data, conservada: només data-captura', async () => {
    triaRa(fotoData());
    const { editor, cadena } = editorFals();
    await ordreImatge({ demanaExif: async () => ({ conserva: true, precisio: 'exacta' }) }).executa({ editor, range: RANG });
    expect(cadena.setImage).toHaveBeenCalledWith({ src: CURT, alt: 'festa.jpg', captura: '2017-05-14T10:22:33' });
  });

  test('desmarcada: la crida de sempre (neta) i cap atribut', async () => {
    triaRa(fotoGps());
    const { editor, cadena } = editorFals();
    await ordreImatge({ demanaExif: async () => ({ conserva: false, precisio: 'exacta' }) }).executa({ editor, range: RANG });
    expect(dobles.compressImage.mock.calls.map(([, o]) => o)).toEqual([{ maxSize: 1200, format: 'image/webp', quality: 0.8 }]);
    expect(cadena.setImage).toHaveBeenCalledWith({ src: CURT, alt: 'font.jpg' });
  });

  test('cancel·lada (null): no es comprimix ni s’inserix res', async () => {
    triaRa(fotoGps());
    const { editor, cadena } = editorFals();
    await ordreImatge({ demanaExif: async () => null }).executa({ editor, range: RANG });
    expect(dobles.compressImage).not.toHaveBeenCalled();
    expect(cadena.setImage).not.toHaveBeenCalled();
  });

  test('sense EXIF, cap pregunta; sense demanaExif, el camí de sempre encara que la foto porte GPS', async () => {
    triaRa(fotoNeta());
    const demanaExif = vi.fn();
    const { editor, cadena } = editorFals();
    await ordreImatge({ demanaExif }).executa({ editor, range: RANG });
    expect(demanaExif).not.toHaveBeenCalled();
    expect(cadena.setImage).toHaveBeenCalledWith({ src: CURT, alt: 'neta.jpg' });
    vi.restoreAllMocks();
    triaRa(fotoGps());
    const sense = editorFals();
    await ordreImatge({}).executa({ editor: sense.editor, range: RANG });
    expect(dobles.compressImage.mock.calls.at(-1)[1]).toEqual({ maxSize: 1200, format: 'image/webp', quality: 0.8 });
    expect(sense.cadena.setImage).toHaveBeenCalledWith({ src: CURT, alt: 'font.jpg' });
  });

  test('marcada amb una ubicació que no es pot arrodonir: l’avís i res inserit (mai neta en silenci)', async () => {
    triaRa(new File([jpegAmbExif({ gps: gpsTorre({ lat: [[38, 1], [35, 1], [30, 1], [1, 1]] }) })], 'rara.jpg', { type: 'image/jpeg' }));
    const onToast = vi.fn();
    const { editor, cadena } = editorFals();
    await ordreImatge({ onToast, demanaExif: async () => ({ conserva: true, precisio: 'poble' }) }).executa({ editor, range: RANG });
    expect(onToast).toHaveBeenCalledWith(ERROR_EXIF_NO_CONSERVABLE, 'error');
    expect(dobles.compressImage).not.toHaveBeenCalled();
    expect(cadena.setImage).not.toHaveBeenCalled();
  });

  test('un canvas sense WebP (Safari 16): amb l’EXIF triat, la foto es torna a codificar en JPEG, que el pot portar', async () => {
    dobles.compressImage.mockImplementation(async (_f, { format }) => (format === 'image/jpeg' ? JPEG : PNG));
    triaRa(fotoGps());
    const { editor, cadena } = editorFals();
    await ordreImatge({ demanaExif: async () => ({ conserva: true, precisio: 'exacta' }) }).executa({ editor, range: RANG });
    expect(dobles.compressImage.mock.calls.map(([, o]) => o.format)).toEqual(['image/webp', 'image/jpeg']);
    expect(cadena.setImage.mock.calls[0][0]).toMatchObject({ src: JPEG, precisio: 'exacta' });
  });

  /* Revisió adversarial 261028 (mutant I9) · Ni WebP ni JPEG (un canvas que només fa PNG): l'EXIF triat no hi
     cap, i es diu; mai una foto neta en silenci. */
  test('un canvas que no fa cap format amb EXIF: l’avís i res inserit', async () => {
    dobles.compressImage.mockResolvedValue(PNG);
    triaRa(fotoGps());
    const onToast = vi.fn();
    const { editor, cadena } = editorFals();
    await ordreImatge({ onToast, demanaExif: async () => ({ conserva: true, precisio: 'poble' }) }).executa({ editor, range: RANG });
    expect(onToast).toHaveBeenCalledWith(ERROR_EXIF_NO_CONSERVABLE, 'error');
    expect(cadena.setImage).not.toHaveBeenCalled();
  });
});

describe('P1-64 · els data-* del node SdpImage', () => {
  let editor = null;
  const creaEditor = (content) => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    editor = new Editor({ element, extensions: [StarterKit, ...extensionsRiques()], content });
    return editor;
  };
  afterEach(() => {
    editor?.destroy();
    editor = null;
    document.body.replaceChildren();
  });

  const imatgeDe = (html) => new DOMParser().parseFromString(html, 'text/html').querySelector('img');

  test('el viatge d’anada i tornada de getHTML/setContent conserva els quatre atributs', () => {
    const html = '<img src="/assets/a.webp" alt="Font" data-lat="38.592" data-lng="-0.418" data-precisio="100m" data-captura="2017-05-14T10:22:33">';
    creaEditor(html);
    const img = imatgeDe(editor.getHTML());
    expect(['data-lat', 'data-lng', 'data-precisio', 'data-captura'].map((a) => img.getAttribute(a))).toEqual(['38.592', '-0.418', '100m', '2017-05-14T10:22:33']);
    editor.commands.setContent(editor.getHTML());
    expect(imatgeDe(editor.getHTML()).getAttribute('data-precisio')).toBe('100m');
  });

  test('enganxar HTML amb el registre d’una foto: entra sense cap data-* (les enganxades, sempre netes)', () => {
    creaEditor('<p></p>');
    editor.view.pasteHTML('<img src="/assets/a.webp" alt="A" data-lat="38.592" data-lng=\'-0.418\' data-precisio=100m data-captura="2017-05-14T10:22:33">', new Event('paste'));
    const img = imatgeDe(editor.getHTML());
    expect(img.getAttribute('src')).toBe('/assets/a.webp');
    expect(img.getAttributeNames().filter((a) => a.startsWith('data-'))).toEqual([]);
  });

  test('sense registre, cap atribut nou (Llei del Píxel); un valor amb una forma estranya no entra', () => {
    creaEditor('<img src="/assets/a.webp" alt="Neta"><img src="/assets/b.webp" data-lat="38.5;alert(1)" data-lng="x" data-precisio="metre" data-captura="ahir">');
    const imgs = [...new DOMParser().parseFromString(editor.getHTML(), 'text/html').querySelectorAll('img')];
    expect(imgs).toHaveLength(2);
    for (const img of imgs) {
      expect(img.getAttributeNames().filter((a) => a.startsWith('data-'))).toEqual([]);
    }
  });
});

/* Revisió adversarial 261028 (privacitat 6 i dades 7) · L'enganxat es neteja
   sobre l'HTML llegit (cap forma d'escriure l'atribut no s'escapa) i un
   enganxat INTERN d'una foto pujada conserva el seu registre. */
describe('P1-64 · revisió adversarial · l’enganxat i el registre de les fotos', () => {
  let editors = [];
  const creaEditor = (content) => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    const editor = new Editor({ element, extensions: [StarterKit, ...extensionsRiques()], content });
    editors.push(editor);
    return editor;
  };
  afterEach(() => {
    for (const editor of editors) editor.destroy();
    editors = [];
    document.body.replaceChildren();
    cleanup();
  });
  const dadesDe = (editor) => [...new DOMParser().parseFromString(editor.getHTML(), 'text/html').querySelectorAll('img')]
    .map((img) => Object.fromEntries(img.getAttributeNames().filter((a) => a.startsWith('data-')).map((a) => [a, img.getAttribute(a)])));
  const PUJADA = 'sdp-media://mitjans_privats/t/u/notes/a.webp';
  const REGISTRE = 'data-lat="38.6078167" data-lng="-0.4202444" data-precisio="exacta" data-captura="2017-05-14T10:22:33"';
  const transforma = (html) => extensionsRiques()[0].config.transformPastedHTML(html);

  test.each([
    ['sense espai després de l’atribut', `<img src="${PUJADA}"data-lat="38.6078167"data-lng="-0.4202444"data-precisio="exacta">`],
    ['separat amb barres', `<img src=${PUJADA} /data-lat=38.6078167 /data-lng=-0.4202444 /data-precisio=exacta>`],
    ['en majúscules i en un altre element', `<p DATA-LAT="38.6"><img src="${PUJADA}" DATA-LAT="38.6078167" Data-Lng="-0.4202444" data-PRECISIO="exacta"></p>`],
  ])('de fora, %s: entra sense cap data-*', (_cas, html) => {
    const editor = creaEditor('<p></p>');
    editor.view.pasteHTML(html, new Event('paste'));
    expect(dadesDe(editor)).toEqual([{}]);
    expect(transforma(html)).not.toMatch(/data-(?:lat|lng|precisio|captura)/i);
  });

  test('sense cap registre, el mateix HTML (la mateixa cadena)', () => {
    const html = `<p>Hola</p><img src="${PUJADA}" alt="A" data-sdp-bloquejada="1">`;
    expect(transforma(html)).toBe(html);
  });

  test('copiar i enganxar dins del text una foto pujada conserva el registre; una de fora, o un data-pm-slice amb una foto que no és pujada, no', () => {
    const origen = creaEditor(`<p>a</p><img src="${PUJADA}" alt="A" ${REGISTRE}><img src="/assets/a.webp" alt="B" ${REGISTRE}>`);
    origen.commands.selectAll();
    const { dom } = origen.view.serializeForClipboard(origen.state.selection.content());
    expect(dom.innerHTML).toContain('data-pm-slice');
    const desti = creaEditor('<p></p>');
    desti.view.pasteHTML(dom.innerHTML, new Event('paste'));
    expect(dadesDe(desti)).toEqual([
      { 'data-lat': '38.6078167', 'data-lng': '-0.4202444', 'data-precisio': 'exacta', 'data-captura': '2017-05-14T10:22:33' },
      {},
    ]);
    // El mateix HTML sense la marca del portapapers de ProseMirror: de fora, net.
    const fora = creaEditor('<p></p>');
    fora.view.pasteHTML(dom.innerHTML.replace(/\sdata-pm-slice="[^"]*"/g, ''), new Event('paste'));
    expect(dadesDe(fora)).toEqual([{}, {}]);
  });

  /* Mutant NV1 · La vista del node (l'editor de veres) no pinta cap data-* que el node no porta. */
  test('SdpImageNodeView: sense registre, cap data-*; amb, els quatre', () => {
    const atributs = { src: '/assets/a.webp', alt: 'A', title: null, lat: null, lng: null, precisio: null, captura: null };
    const neta = render(createElement(SdpImageNodeView, { node: { attrs: atributs } }));
    const img = neta.container.querySelector('img');
    expect(img.getAttributeNames().filter((a) => a.startsWith('data-') && a !== 'data-drag-handle')).toEqual([]);
    cleanup();
    const amb = render(createElement(SdpImageNodeView, { node: { attrs: { ...atributs, lat: '38.592', lng: '-0.418', precisio: '100m', captura: '2017-05-14T10:22:33' } } }));
    const ambImg = amb.container.querySelector('img');
    expect(['data-lat', 'data-lng', 'data-precisio', 'data-captura'].map((a) => ambImg.getAttribute(a))).toEqual(['38.592', '-0.418', '100m', '2017-05-14T10:22:33']);
  });
});
