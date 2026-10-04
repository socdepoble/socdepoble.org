import { afterEach, describe, expect, test } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { extensionsRiques } from './index.js';
import { netejaHtmlEnganxat } from './imatgesEnganxades.js';
import { sanitizeHtml } from '../../../../utils/sanitize.js';
import { netejaCamp } from '../../../../sections/notes/netejaCamp.js';
import { llegixExif, teExif } from '../../enquadrament/exif.js';
import { APP0_JFIF, IMATGE, SOI, concatena, dataOriginal, gpsTorre, jpegAmbExif, tiff } from '../../enquadrament/jpegProva.js';

/* RICH-EXIF (Onada 4, ADR multimèdia D4) · Un data URL enganxat o arrossegat
   al text enriquit no entra mai amb metadades. Editor de veres (TipTap +
   ProseMirror) en jsdom: el camí és el mateix que al navegador. */

const ascii = (text) => Uint8Array.from(text, (c) => c.charCodeAt(0));
function aBase64(bytes) {
  let binari = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binari += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(binari);
}
const dataUrl = (tipus, bytes) => `data:${tipus};base64,${aBase64(bytes)}`;
const deDataUrl = (url) => Uint8Array.from(atob(url.slice(url.indexOf(',') + 1)), (c) => c.charCodeAt(0));
function conte(bytes, text) {
  const cerca = ascii(text);
  for (let i = 0; i + cerca.length <= bytes.length; i += 1) {
    if (cerca.every((b, k) => bytes[i + k] === b)) return true;
  }
  return false;
}
function desDeSos(bytes) {
  let pos = 2;
  while (bytes[pos + 1] !== 0xda) pos += 2 + ((bytes[pos + 2] << 8) | bytes[pos + 3]);
  return bytes.subarray(pos);
}
/* Les fonts de les <img> d'un HTML, llegides sense pintar-lo. */
const fonts = (html) => [...new DOMParser().parseFromString(html, 'text/html').querySelectorAll('img')].map((img) => img.getAttribute('src'));

const FOTO_GPS = jpegAmbExif({ exif: dataOriginal('2017:05:14 10:22:33', '+02:00'), gps: gpsTorre() });
const URL_GPS = dataUrl('image/jpeg', FOTO_GPS);

/* PNG i WebP mínims amb el bloc GPS: el CRC no importa al netejador (no el toca). */
function trosPng(tipus, dades) {
  const t = new Uint8Array(12 + dades.length);
  new DataView(t.buffer).setUint32(0, dades.length);
  t.set(ascii(tipus), 4);
  t.set(dades, 8);
  return t;
}
const PNG_GPS = concatena(
  Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a),
  trosPng('IHDR', new Uint8Array(13)), trosPng('eXIf', tiff({ gps: gpsTorre() })), trosPng('IDAT', Uint8Array.of(1, 2)), trosPng('IEND', new Uint8Array(0)),
);
function trosRiff(tipus, dades) {
  const t = new Uint8Array(8 + dades.length + (dades.length & 1));
  t.set(ascii(tipus));
  new DataView(t.buffer).setUint32(4, dades.length, true);
  t.set(dades, 8);
  return t;
}
function webp(...trossos) {
  const cos = concatena(ascii('WEBP'), ...trossos);
  const cap = ascii('RIFF\0\0\0\0');
  new DataView(cap.buffer).setUint32(4, cos.length, true);
  return concatena(cap, cos);
}
const WEBP_GPS = webp(trosRiff('VP8X', Uint8Array.of(0x08, 0, 0, 0, 0, 0, 0, 0, 0, 0)), trosRiff('VP8L', Uint8Array.of(0x2f, 0, 0, 0, 0)), trosRiff('EXIF', tiff({ gps: gpsTorre() })));
const WEBP_NET = webp(trosRiff('VP8L', Uint8Array.of(0x2f, 0, 0, 0, 0)));

let editor = null;
function creaEditor(content = '<p></p>') {
  const element = document.createElement('div');
  document.body.appendChild(element);
  editor = new Editor({
    element,
    extensions: [StarterKit.configure({ heading: { levels: [2, 3, 4, 5, 6] } }), ...extensionsRiques()],
    content,
  });
  return editor;
}
const enganxa = (html) => editor.view.pasteHTML(html, new Event('paste'));

afterEach(() => {
  editor?.destroy();
  editor = null;
  document.body.replaceChildren();
});

describe('RICH-EXIF · enganxar al text enriquit', () => {
  test('allowBase64 es queda: el data URL de compressImage continua entrant sense canviar ni un caràcter', () => {
    creaEditor();
    expect(editor.extensionManager.extensions.find((e) => e.name === 'image').options.allowBase64).toBe(true);
    const src = dataUrl('image/webp', WEBP_NET);
    enganxa(`<img src="${src}">`);
    expect(fonts(editor.getHTML())).toEqual([src]);
  });

  test('una foto amb GPS: el src desat no porta EXIF i la imatge (SOS en avant) és idèntica', () => {
    creaEditor();
    enganxa(`<p>Olivera de la plaça</p><img src="${URL_GPS}" alt="Olivera">`);
    const html = editor.getHTML();
    expect(html).toContain('Olivera de la plaça');
    const [src] = fonts(html);
    expect(src.startsWith('data:image/jpeg;base64,')).toBe(true);
    const bytes = deDataUrl(src);
    expect(teExif(bytes)).toBe(false);
    expect(conte(bytes, 'Exif')).toBe(false);
    expect(llegixExif(bytes)).toEqual({ orientacio: null, gps: null, dataCaptura: null });
    expect([...desDeSos(bytes)]).toEqual([...desDeSos(FOTO_GPS)]);
    // I el desat de Notes (sanitize) no ho desfà.
    expect(fonts(netejaCamp('content', html))).toEqual([src]);
  });

  test('PNG amb eXIf i WebP amb EXIF: també ixen nets', () => {
    creaEditor();
    enganxa(`<img src="${dataUrl('image/png', PNG_GPS)}"><img src="${dataUrl('image/webp', WEBP_GPS)}">`);
    const [png, wp] = fonts(editor.getHTML()).map(deDataUrl);
    expect(conte(png, 'eXIf')).toBe(false);
    expect(conte(png, 'IDAT')).toBe(true);
    expect(conte(wp, 'EXIF')).toBe(false);
    expect(wp[20] & 0x08).toBe(0); // la bandera E de VP8X, apagada
  });

  test('una imatge que no es pot netejar (truncada, GIF) es lleva; la resta de l’enganxat entra', () => {
    creaEditor();
    const truncada = dataUrl('image/jpeg', FOTO_GPS.subarray(0, FOTO_GPS.length - 2));
    const gif = dataUrl('image/gif', ascii('GIF89a\x01\0\x01\0\0\0\0;'));
    enganxa(`<p>Abans</p><img src="${truncada}"><p>Enmig</p><img src="${gif}"><p>Després</p>`);
    const html = editor.getHTML();
    expect(fonts(html)).toEqual([]);
    for (const text of ['Abans', 'Enmig', 'Després']) expect(html).toContain(text);
  });

  test('un data URL que no és d’imatge no el toca la neteja: el lleva el sanejador en desar (verificat, sense canvis)', () => {
    const src = `data:text/html;base64,${btoa('<script>alert(1)</script>')}`;
    const enganxat = `<p>Text</p><img src="${src}">`;
    expect(netejaHtmlEnganxat(enganxat)).toBe(enganxat);
    creaEditor();
    enganxa(enganxat);
    const html = editor.getHTML();
    expect(fonts(html)).toEqual([src]); // a l'editor encara hi és (allowBase64 admet qualsevol data:)
    const desat = sanitizeHtml(html);
    expect(desat).not.toContain('data:text');
    expect(desat).toContain('data-sdp-bloquejada');
    expect(netejaCamp('content', html)).not.toContain('data:text');
  });

  test('un enllaç a un data URL d’imatge no entra (l’enllaç de TipTap no admet data:): cap porta lateral per al GPS', () => {
    creaEditor();
    enganxa(`<p><a href="${URL_GPS}">la foto</a></p>`);
    const html = editor.getHTML();
    expect(html).toContain('la foto');
    expect(html).not.toContain('data:');
  });
});

describe('RICH-EXIF · deixar anar HTML (arrossegar d’una altra finestra)', () => {
  test('el drop passa per la mateixa neteja que el paste', () => {
    creaEditor('<p>Hola</p>');
    const { view } = editor;
    view.posAtCoords = () => ({ pos: 1, inside: -1 }); // jsdom no té geometria
    const dades = { 'text/html': `<img src="${URL_GPS}">` };
    const deixa = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(deixa, 'dataTransfer', { value: { getData: (tipus) => dades[tipus] || '', files: [], types: Object.keys(dades) } });
    view.dom.dispatchEvent(deixa);
    expect(deixa.defaultPrevented).toBe(true);
    const [src] = fonts(editor.getHTML());
    expect(src).toBeTruthy();
    const bytes = deDataUrl(src);
    expect(teExif(bytes)).toBe(false);
    expect([...desDeSos(bytes)]).toEqual([...desDeSos(FOTO_GPS)]);
  });
});

describe('RICH-EXIF · escriure «![alt](data:…)» (regla de Markdown de TipTap)', () => {
  const escriu = (text) => {
    const pos = editor.state.selection.from;
    return editor.view.someProp('handleTextInput', (f) => f(editor.view, pos, pos, text));
  };

  test('la imatge es crea amb la font neta', () => {
    creaEditor(`<p>![Olivera](${URL_GPS}</p>`);
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);
    expect(escriu(')')).toBe(true);
    const [src] = fonts(editor.getHTML());
    expect(teExif(deDataUrl(src))).toBe(false);
    expect([...desDeSos(deDataUrl(src))]).toEqual([...desDeSos(FOTO_GPS)]);
  });

  test('una imatge que no es pot netejar no es crea: queda el text', () => {
    const truncada = dataUrl('image/jpeg', FOTO_GPS.subarray(0, 40));
    creaEditor(`<p>![Olivera](${truncada}</p>`);
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);
    expect(escriu(')')).toBeFalsy();
    expect(fonts(editor.getHTML())).toEqual([]);
  });

  test('una URL normal continua funcionant com abans', () => {
    creaEditor('<p>![Olivera](/assets/olivera.webp</p>');
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);
    expect(escriu(')')).toBe(true);
    expect(fonts(editor.getHTML())).toEqual(['/assets/olivera.webp']);
  });
});

describe('netejaHtmlEnganxat · la funció', () => {
  test('sense data: torna la MATEIXA cadena (ni un byte canviat en el que s’enganxa cada dia)', () => {
    const html = '<meta charset="utf-8"><p data-pm-slice="1 1 []">Hola <b>món</b> &amp; <img src="https://socdepoble.org/a.jpg"></p>';
    expect(netejaHtmlEnganxat(html)).toBe(html);
    expect(netejaHtmlEnganxat('')).toBe('');
  });

  test('un fragment de taula (<td> solt) conserva la forma, com el llig ProseMirror', () => {
    const net = netejaHtmlEnganxat(`<td>Arbre</td><td><img src="${URL_GPS}"></td>`);
    expect(net.startsWith('<td>Arbre</td><td><img src="data:image/jpeg;base64,')).toBe(true);
    expect(teExif(deDataUrl(fonts(`<table><tr>${net}</tr></table>`)[0]))).toBe(false);
  });

  test('un «</template>» enganxat no trenca el sobre: si no es pot llegir amb seguretat, no s’enganxa res', () => {
    expect(netejaHtmlEnganxat(`<p>a</p></template><img src="${URL_GPS}">`)).toBe('');
  });

  test('una imatge ja neta torna la mateixa cadena encara que hi haja data:', () => {
    const html = `<p>x</p><img src="${dataUrl('image/jpeg', concatena(SOI, APP0_JFIF, IMATGE))}">`;
    expect(netejaHtmlEnganxat(html)).toBe(html);
  });
});

/* Revisió adversarial (Onada 4, tercera passada) · L'HTML es descodifica
   ABANS de llegir el src: el que compta és l'atribut, no el text cru. */
describe('revisió · cap data URL entra disfressat', () => {
  test.each([
    ['dos punts amb entitat de nom', URL_GPS.replace('data:', 'data&colon;')],
    ['dos punts amb entitat numèrica', URL_GPS.replace('data:', 'data&#58;')],
    ['una lletra de l’esquema amb entitat', URL_GPS.replace('data:', '&#x64;ata:')],
    ['un salt de línia (entitat) dins de l’esquema', URL_GPS.replace('data:', 'data&#10;:')],
  ])('%s: l’atribut diu el mateix data URL, i ix net', (_cas, font) => {
    expect(font).not.toMatch(/data:/i);
    creaEditor();
    enganxa(`<p>Olivera</p><img src="${font}">`);
    const [src] = fonts(editor.getHTML());
    expect(src.startsWith('data:image/jpeg;base64,')).toBe(true);
    const bytes = deDataUrl(src);
    expect(teExif(bytes)).toBe(false);
    expect([...desDeSos(bytes)]).toEqual([...desDeSos(FOTO_GPS)]);
  });

  test('<image> (el parser la torna <img>): la mateixa neteja, amb data: cru o amb entitat', () => {
    for (const font of [URL_GPS, URL_GPS.replace('data:', 'data&colon;')]) {
      editor?.destroy();
      creaEditor();
      enganxa(`<image src="${font}">`);
      const [src] = fonts(editor.getHTML());
      expect(teExif(deDataUrl(src))).toBe(false);
    }
  });

  test('sense cap <img>, l’HTML torna idèntic encara que diga «data:» o porte un «</template>» solt', () => {
    const html = '<p>Veure data: 3 d’octubre</p></template><a href="data:text/plain,hola">x</a>';
    expect(netejaHtmlEnganxat(html)).toBe(html);
  });
});
