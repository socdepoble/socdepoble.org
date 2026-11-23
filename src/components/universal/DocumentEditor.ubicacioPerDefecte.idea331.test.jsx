/* v1.2.23 · IDEA-331 (ordre del Mestre 261123) · Les fotos del COS, fora del xat.
   L'ordre «/» Imatge d'una publicació (les Notes, i per tant el Mur, el Mercat i
   els Esdeveniments) i, ara, del cos del Perfil (PerfilEditor passa
   fotosDePublicacio i exifTriatEnPujar) conserva de sèrie la ubicació: la
   pregunta de DocumentEditor ensenya l'avís del Mestre i l'interruptor «Amaga
   el lloc» apagat, en les cinc llengües. De punta a punta (DocumentEditor de
   veres, les extensions i l'ordre «/» Imatge de veres, compressImage de veres
   sobre un canvas fals): «Inserir» de sèrie puja un fitxer amb el GPS; amb un
   toc a «Amaga el lloc», el fitxer que puja no porta ni EXIF ni GPS. Les
   imatges enganxades continuen netes sempre (ordreImatge.exif.test.js).
   v1.2.23 · costura privacitat del cos del Perfil · REAPUNTADA A POSTA: el cos
   del Perfil ja no puja el bloc sencer (exifTriat false, l'avís amb la
   càmera). Puja directe a l'espai públic, i per això el fitxer porta ja la tria
   de la còpia pública de les Notes (preparaTiffTriat: la ubicació arrodonida i
   la data), mai la marca, el model, el número de sèrie ni el nom; l'avís és el
   de les Notes, sense la càmera. Les Notes, com abans: el fitxer privat porta
   el bloc preparat i la promoció en fa la tria (storage.js · ambExifTriat). */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';

const m = vi.hoisted(() => ({ extensions: null, t: null, llengua: undefined }));
vi.mock('../../app/contexts/UIContext', () => ({
  /* v1.2.23 · L2-03 (Gauntlet R1) · `language` (de sèrie, cap): la llengua dels avisos diferits del cos. */
  useUIActions: () => ({ t: m.t, language: m.llengua }),
  useUIActionsOpcional: () => ({ t: m.t }),
}));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('./richText', async (importOriginal) => ({
  ...(await importOriginal()),
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: () => null,
}));
vi.mock('./richText/extensions', async (importOriginal) => {
  const real = await importOriginal();
  m.extensions = vi.fn(real.extensionsRiques);
  return { ...real, extensionsRiques: (...args) => m.extensions(...args) };
});
import { DocumentEditor } from './DocumentEditor.jsx';
import { createTranslator } from '../../config/i18n.js';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';
import { llegixExif, teExif } from './enquadrament/exif.js';
import {
  APP0_JFIF, IMATGE, SOI, TIPUS, app1Exif, concatena, dataOriginal, gpsTorre, orientacio, tiff,
} from '../../../tests/helpers/jpegProva.js';

const DICCIONARIS = Object.freeze({ ca: CA, es: ES, en: EN, eu: EU, gl: GL });
/* [nom, adaptador, la foto puja ja amb la tria de la còpia pública] */
const SUPERFICIES = Object.freeze([
  ['les Notes (Mur, Mercat, Esdeveniments)', { fotosDePublicacio: true }, false],
  ['el cos del Perfil', { fotosDePublicacio: true, exifTriatEnPujar: true }, true],
]);

/* La càmera i la persona que NO han d'eixir mai a l'espai públic: la marca, el
   model, el número de sèrie (BodySerialNumber) i el nom de qui la té (CameraOwnerName). */
const CAMERA = Object.freeze(['NIKON', 'D850', '0123456789', 'Pep Garcia']);
const TIFF_GPS = tiff({
  ifd0: [orientacio(1), { tag: 0x010f, tipus: TIPUS.ASCII, valors: CAMERA[0] }, { tag: 0x0110, tipus: TIPUS.ASCII, valors: CAMERA[1] }],
  exif: [
    ...dataOriginal('2017:05:14 10:22:33', '+02:00'),
    { tag: 0xa430, tipus: TIPUS.ASCII, valors: CAMERA[3] },
    { tag: 0xa431, tipus: TIPUS.ASCII, valors: CAMERA[2] },
  ],
  gps: gpsTorre(),
});
const FOTO_GPS = concatena(SOI, APP0_JFIF, app1Exif(TIFF_GPS), IMATGE);
const SORTIDA_CANVAS = concatena(SOI, APP0_JFIF, IMATGE);
const MARCA_EXIF = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00];
const fotoGps = () => new File([FOTO_GPS], 'IMG_2041.jpg', { type: 'image/jpeg' });
const DOC = Object.freeze({ id: 'd1', title: 'Títol', subtitle: '', lead: '', content: '<p>Hola</p>', formattedDate: '01/01/26', formattedTime: '10:00' });

const aBase64 = (bytes) => btoa(String.fromCharCode(...bytes));
function deDataUrl(url) {
  const coma = url.indexOf(',');
  const capcalera = url.slice(0, coma);
  const binari = capcalera.includes(';base64') ? atob(url.slice(coma + 1)) : decodeURIComponent(url.slice(coma + 1));
  return { tipus: /^data:([^;,]*)/.exec(capcalera)?.[1] || '', bytes: Uint8Array.from(binari, (c) => c.charCodeAt(0)) };
}
const bytesDe = (blob) => new Promise((resol, rebutja) => {
  const lector = new FileReader();
  lector.onload = () => resol(new Uint8Array(lector.result));
  lector.onerror = () => rebutja(lector.error);
  lector.readAsArrayBuffer(blob);
});
const conteMarca = (bytes, marca) => bytes.some((_, i) => marca.every((b, k) => bytes[i + k] === b));
const conteText = (bytes, text) => conteMarca(bytes, [...text].map((c) => c.charCodeAt(0)));

class ImatgeFalsa {
  constructor() {
    this.width = 0;
    this.height = 0;
  }

  set src(url) {
    this.url = url;
    queueMicrotask(() => {
      this.width = 3000;
      this.height = 2000;
      this.onload?.();
    });
  }

  get src() {
    return this.url;
  }
}

beforeEach(() => {
  m.t = createTranslator('ca');
  m.llengua = undefined;
  vi.stubGlobal('Image', ImatgeFalsa);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ({ clearRect: vi.fn(), drawImage: vi.fn(), fillRect: vi.fn() }));
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation((tipus = 'image/png') => `data:${tipus};base64,${aBase64(SORTIDA_CANVAS)}`);
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    const { tipus, bytes } = deDataUrl(url);
    return { blob: async () => new Blob([bytes], { type: tipus }) };
  }));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const adaptador = (extra, uploadMedia) => ({ document: DOC, labels: [], seedContent: null, updateLocal: vi.fn(), saveRemote: vi.fn(), uploadMedia, ...extra });
/* El selector de fitxers del cos: en fer-li click, «tria» la foto amb GPS. */
function triaRa(fitxer) {
  vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function tria() {
    Object.defineProperty(this, 'files', { value: [fitxer], configurable: true });
    this.dispatchEvent(new Event('change'));
  });
}
function editorFals() {
  const cadena = { focus: () => cadena, deleteRange: () => cadena, setImage: vi.fn(() => cadena), run: vi.fn(() => true) };
  return { editor: { chain: () => cadena }, cadena };
}
/* L'ordre «/» Imatge tal com l'han configurada les extensions de veres que ha demanat DocumentEditor. */
const ordreImatgeDeLEditor = () => m.extensions.mock.results.at(-1).value
  .find((extensio) => extensio.name === 'sdpSlashMenu').options.ordres.find((ordre) => ordre.id === 'imatge');

/* Munta l'editor de la superfície, llança la seua ordre «/» Imatge i torna la pregunta oberta. */
async function obriLaPregunta(extra) {
  const onImageUpload = vi.fn(async () => 'sdp-media://mitjans/t/u/avatars/cos.webp');
  render(<DocumentEditor adapter={adaptador(extra, onImageUpload)} />);
  expect(typeof m.extensions.mock.calls.at(-1)[0].demanaExif).toBe('function');
  triaRa(fotoGps());
  const { editor, cadena } = editorFals();
  let execucio;
  await act(async () => { execucio = ordreImatgeDeLEditor().executa({ editor, range: { from: 1, to: 2 } }); });
  const dialeg = await screen.findByRole('dialog');
  return { dialeg, onImageUpload, cadena, execucio };
}

async function insereix({ dialeg, onImageUpload, execucio }) {
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Inserir' })); });
  await act(async () => { await execucio; });
  await waitFor(() => expect(onImageUpload).toHaveBeenCalledTimes(1));
  return bytesDe(onImageUpload.mock.calls[0][0]);
}

describe('IDEA-331 · l’ordre «/» Imatge del cos: avís i interruptor en cinc llengües', () => {
  test.each(SUPERFICIES.flatMap(([nom, extra]) => Object.keys(DICCIONARIS).map((llengua) => [nom, llengua, extra])))(
    '%s · %s: la pregunta ensenya «Amaga el lloc» apagat i l’avís del Mestre, sense la càmera (es publica la tria)',
    async (_nom, llengua, extra) => {
      const dic = DICCIONARIS[llengua];
      m.t = createTranslator(llengua);
      const { dialeg, execucio } = await obriLaPregunta(extra);
      const curt = dic['section.xat.adjunts.amagaLloc'];
      const llarg = dic['section.xat.adjunts.publicaSenseGeolocalitzacio'];
      const interruptor = within(dialeg).getByRole('switch', { name: `${curt} (${llarg})` });
      expect(interruptor.checked).toBe(false);
      // La foto porta marca, model, sèrie i nom: l'avís no en promet cap, perquè no n'ix cap.
      expect(document.getElementById(interruptor.getAttribute('aria-describedby')).textContent).toBe(dic['editor.enquadrament.ubicacioConservada']);
      fireEvent.click(within(dialeg).getByRole('button', { name: dic['editor.imatge.exif.cancela'] }));
      await act(async () => { await execucio; });
    },
  );
});

describe('IDEA-331 · l’ordre «/» Imatge del cos, de punta a punta', () => {
  test.each(SUPERFICIES)('%s · «Inserir» de sèrie: el fitxer que puja porta el GPS i la data de la foto', async (_nom, extra, triatEnPujar) => {
    const pregunta = await obriLaPregunta(extra);
    const bytes = await insereix(pregunta);
    expect(teExif(bytes)).toBe(true);
    expect(llegixExif(bytes)).toMatchObject({ gps: { lat: 38.5919, lng: -0.4184 }, dataCaptura: '2017-05-14T10:22:33+02:00' });
    expect(pregunta.cadena.setImage).toHaveBeenCalledWith(expect.objectContaining({ lat: '38.5919', lng: '-0.4184', precisio: 'exacta' }));
    /* v1.2.23 · costura privacitat del cos del Perfil · El cos del Perfil puja a l'espai
       públic: cap dada de la càmera ni de la persona. Les Notes pugen al fitxer privat el
       bloc preparat, i la promoció en fa la tria (storage.metadades.test.js). */
    expect(llegixExif(bytes, { ambCamera: true }).camera === null).toBe(triatEnPujar);
    for (const text of CAMERA) expect(conteText(bytes, text), text).toBe(!triatEnPujar);
  });

  test('el cos del Perfil · amb «Uns 100 m»: el fitxer públic porta la ubicació ja arrodonida, mai el punt exacte', async () => {
    const pregunta = await obriLaPregunta(SUPERFICIES[1][1]);
    fireEvent.click(within(pregunta.dialeg).getByRole('radio', { name: 'Uns 100 m' }));
    const bytes = await insereix(pregunta);
    expect(llegixExif(bytes).gps).toMatchObject({ lat: 38.592, lng: -0.418 });
    expect(pregunta.cadena.setImage).toHaveBeenCalledWith(expect.objectContaining({ lat: '38.592', lng: '-0.418', precisio: '100m' }));
    for (const text of CAMERA) expect(conteText(bytes, text), text).toBe(false);
  });

  test.each(SUPERFICIES)('%s · amb «Amaga el lloc» (un toc): el fitxer que puja són els bytes del canvas, sense EXIF ni GPS, i el node sense registre', async (_nom, extra) => {
    const pregunta = await obriLaPregunta(extra);
    fireEvent.click(within(pregunta.dialeg).getByRole('switch', { name: /Amaga el lloc/ }));
    const bytes = await insereix(pregunta);
    expect([...bytes]).toEqual([...SORTIDA_CANVAS]);
    expect(conteMarca(bytes, MARCA_EXIF)).toBe(false);
    expect(teExif(bytes)).toBe(false);
    expect(llegixExif(bytes).gps).toBeNull();
    expect(pregunta.cadena.setImage).toHaveBeenCalledWith({ src: 'sdp-media://mitjans/t/u/avatars/cos.webp', alt: 'IMG_2041.jpg' });
  });
});

/* v1.2.23 · L2-03 (Gauntlet R1) · La pregunta del cos ensenya l'interruptor «Amaga el lloc» apagat. Si després la
   ubicació i la data no es poden posar a la foto (el canvas ix en PNG, que no porta EXIF: ERROR_EXIF_NO_CONSERVABLE a
   richText/extensions), l'avís no pot demanar que es desmarque «Conserva la ubicació i la data de la foto», una casella
   que la pregunta no ensenyava: diu que s'encenga l'interruptor, amb el seu rètol, en la llengua de la interfície
   (i18nAmagaLloc.js). Res no puja ni s'inserix. */
describe('v1.2.23 · L2-03 · el rebuig de la ubicació al cos nomena l’interruptor que s’ha vist', () => {
  const PNG = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGOoCNAAAAI0APHlrLKsAAAAAElFTkSuQmCC'), (c) => c.charCodeAt(0));

  test.each(SUPERFICIES.flatMap(([nom, extra]) => [[nom, 'ca', extra], [nom, 'es', extra]]))('%s · %s · «Inserir» amb el canvas en PNG: l’avís diu que s’encenga l’interruptor, cap casella, i res no puja', async (_nom, llengua, extra) => {
    m.t = createTranslator(llengua);
    m.llengua = llengua;
    HTMLCanvasElement.prototype.toDataURL.mockImplementation(() => `data:image/png;base64,${aBase64(PNG)}`);
    const onToast = vi.fn();
    const onImageUpload = vi.fn(async () => 'sdp-media://mitjans/t/u/avatars/cos.webp');
    render(<DocumentEditor adapter={adaptador(extra, onImageUpload)} onToast={onToast} />);
    triaRa(fotoGps());
    const { editor, cadena } = editorFals();
    let execucio;
    await act(async () => { execucio = ordreImatgeDeLEditor().executa({ editor, range: { from: 1, to: 2 } }); });
    const dialeg = await screen.findByRole('dialog');
    const dic = DICCIONARIS[llengua];
    const rotul = dic['section.xat.adjunts.amagaLloc'];
    expect(within(dialeg).getByRole('switch', { name: new RegExp(rotul) }).checked).toBe(false);
    expect(within(dialeg).queryByRole('checkbox', { name: dic['editor.enquadrament.exifEtiqueta'] })).toBeNull();
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: dic['editor.imatge.exif.inserir'] })); });
    await act(async () => { await execucio; });
    await waitFor(() => expect(onToast).toHaveBeenCalledTimes(1));
    expect(onToast).toHaveBeenCalledWith(llengua === 'ca'
      ? 'No es pot conservar la ubicació i la data d’esta foto; encén «Amaga el lloc» per a pujar-la sense.'
      : 'No se pueden conservar la ubicación y la fecha de esta foto; activa «Ocultar el lugar» para subirla sin ellas.', 'error');
    expect(onToast.mock.calls[0][0]).not.toMatch(/desmarca|Conserva la ubica/);
    expect(onImageUpload).not.toHaveBeenCalled();
    expect(cadena.setImage).not.toHaveBeenCalled();
  });

  test('en castellà, el rètol i l’avís del diccionari diferit; un avís que no és de la ubicació (o sense pregunta), tal qual', async () => {
    const { ERROR_EXIF_NO_CONSERVABLE } = await import('./enquadrament/exifIncrustat.js');
    const { TEXTOS_AMAGA_LLOC } = await import('./enquadrament/i18nAmagaLloc.js');
    const { avisDeRebuigAmbInterruptor } = await import('./enquadrament/DialegEnquadrament.jsx');
    const dades = { gps: { lat: 38.59, lng: -0.42 }, estat: 'publicable' };
    expect(avisDeRebuigAmbInterruptor(ERROR_EXIF_NO_CONSERVABLE, { dades, conserva: true, idioma: 'es', lloc: ES['section.xat.adjunts.amagaLloc'] }))
      .toBe(TEXTOS_AMAGA_LLOC.es.noConservableLloc.replace('{lloc}', 'Ocultar el lugar'));
    expect(avisDeRebuigAmbInterruptor('Sense xarxa', { dades, conserva: true, idioma: 'es', lloc: 'Ocultar el lugar' })).toBe('Sense xarxa');
    expect(avisDeRebuigAmbInterruptor(ERROR_EXIF_NO_CONSERVABLE, { dades, conserva: false, lloc: 'x' })).toBe(ERROR_EXIF_NO_CONSERVABLE);
    expect(avisDeRebuigAmbInterruptor(ERROR_EXIF_NO_CONSERVABLE, { dades: { ...dades, estat: 'no-conservable' }, conserva: true, lloc: 'x' }))
      .toBe(ERROR_EXIF_NO_CONSERVABLE);
    expect(avisDeRebuigAmbInterruptor(ERROR_EXIF_NO_CONSERVABLE, { dades: { dataCaptura: '2017-05-14T10:22:33' }, conserva: true, lloc: 'x' }))
      .toBe(ERROR_EXIF_NO_CONSERVABLE);
  });
});
