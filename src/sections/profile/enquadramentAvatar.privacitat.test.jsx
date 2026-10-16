/* Onada 4 · revisió adversarial (K3, ADR multimèdia D4) · Cap camí de pujada
 * del Perfil puja els bytes originals d'un JPEG amb EXIF i GPS.
 *
 * Una foto sintètica amb el GPS de la Torre (jpegProva.js) passa per cada
 * camí: «Només l’avatar» (desada sencera, el cas on el T46 tornava el mateix
 * File), «La mateixa per a les dues», «Només la capçalera», el mode sense
 * servidor (data URL), l'ajust d'imatge (DetallAjust) i el contracte T46 del
 * DialegEnquadrament amb processaFitxer. useHeroImageHandler i compressImage
 * són REALS: jsdom no descodifica ni codifica, així que Image, el context 2D i
 * toDataURL s'emulen. El «codificador» torna uns bytes nets i propis
 * (SORTIDA_CANVAS); el retallador simulat en torna uns altres (SORTIDA_RETALL):
 * si un camí pujara l'original o el retall sense passar per compressImage, el
 * que arriba al servidor no seria SORTIDA_CANVAS.
 *
 * Onada 6 (verificació, 261009) · Des del 261008 el diàleg intermedi del
 * Perfil («Només l’avatar», «La mateixa per a les dues», «Només la capçalera»
 * i el seu mode sense servidor) ja no existix: la fitxa puja cada imatge amb
 * el seu botó (useImatgeDeFitxa). Els camins vigents que es comproven ací són
 * els tres botons de la fitxa, l'ajust d'imatge (DetallAjust) i el contracte
 * T46.
 *
 * Gauntlet 261016 (Bloc 1.2, mandat del Mestre, pla §0.1.3) · GIRADA A POSTA.
 * Abans, tot el que pujava havia d'eixir net (ADR D4). El mandat conserva de
 * sèrie la ubicació, la data i la càmera de les fotos, i la persona les pot
 * llevar amb la casella «Conserva la ubicació i la data de la foto». Ara:
 *   · avatar i capçalera, amb la casella marcada (de sèrie): el que puja és
 *     el canvas (SORTIDA_CANVAS) amb UN APP1 nou i res més, l'EXIF publicable
 *     de l'original (GPS, data, orientació 1), mai la miniatura de l'IFD1 (la
 *     foto sense retallar) ni cap altre byte de l'original;
 *   · desmarcada: net, com abans;
 *   · el logotip (sense casella) i el contracte T46 sense la casella: net.
 * El que no canvia: mai puja l'original ni el retall sense passar pel canvas. */
import React, { useRef } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
vi.mock('../../app/contexts/RouterContext', () => ({ Link: 'a', useNavigate: () => vi.fn() }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({
  useSession: () => ({ logout: vi.fn(), preparaEixida: vi.fn(async () => []) }),
}));
const dobles = vi.hoisted(() => ({ carregaImatge: vi.fn(), exportaRetall: vi.fn() }));
vi.mock('../../components/universal/enquadrament/imatgeCanvas.js', () => ({
  carregaImatge: dobles.carregaImatge,
  dibuixaVisor: () => true,
  exportaRetall: dobles.exportaRetall,
}));
import DetallAjust from './DetallAjust.jsx';
import { useImatgeDeFitxa } from './useImatgeDeFitxa.jsx';
import useHeroImageHandler from '../../hooks/useHeroImageHandler.js';
import { AJUDA_CONSERVA_UBICACIO, DialegEnquadrament } from '../../components/universal/enquadrament/DialegEnquadrament.jsx';
import { llegixExif, teExif } from '../../components/universal/enquadrament/exif.js';
import { ETIQUETA_CONSERVA_EXIF, extreuTiff, preparaTiff } from '../../components/universal/enquadrament/exifIncrustat.js';
import {
  APP0_JFIF, IMATGE, SOI, app1Exif, concatena, dataOriginal, gpsTorre, orientacio, tiff,
} from '../../components/universal/enquadrament/jpegProva.js';

const MARCA_MINIATURA = Uint8Array.from('MINIATURA-SENSE-RETALLAR', (c) => c.charCodeAt(0));
/* Una càmera de veres guarda a l'IFD1 una miniatura de la foto SENCERA: ací,
   una marca que no pot arribar mai al servidor. */
function ambMiniatura(bloc) {
  const posIfd1 = bloc.length;
  const miniatura = concatena(Uint8Array.of(0xff, 0xd8), MARCA_MINIATURA, Uint8Array.of(0xff, 0xd9));
  const t = concatena(bloc, new Uint8Array(2 + 2 * 12 + 4), miniatura);
  const v = new DataView(t.buffer);
  v.setUint32(8 + 2 + v.getUint16(8) * 12, posIfd1); // MM: l'IFD0 apunta a l'IFD1
  v.setUint16(posIfd1, 2);
  [[0x0201, posIfd1 + 2 + 2 * 12 + 4], [0x0202, miniatura.length]].forEach(([tag, valor], i) => {
    const p = posIfd1 + 2 + i * 12;
    v.setUint16(p, tag);
    v.setUint16(p + 2, 4);
    v.setUint32(p + 4, 1);
    v.setUint32(p + 8, valor);
  });
  return t;
}
const TIFF_GPS = ambMiniatura(tiff({ ifd0: [orientacio(6)], exif: dataOriginal('2017:05:14 10:22:33', '+02:00'), gps: gpsTorre() }));
const FOTO_GPS = concatena(SOI, APP0_JFIF, app1Exif(TIFF_GPS), IMATGE);
const SORTIDA_CANVAS = concatena(SOI, APP0_JFIF, IMATGE);
const SORTIDA_RETALL = concatena(SOI, APP0_JFIF, Uint8Array.of(0xff, 0xfe, 0x00, 0x04, 0x52, 0x54), IMATGE); // amb un COM «RT»
const MARCA_EXIF = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00];
const RETALLADOR = { name: 'Enquadrar l’avatar' };
const CASELLA = { name: new RegExp(ETIQUETA_CONSERVA_EXIF) };

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
/** Ha eixit de compressImage (el canvas) i no porta cap rastre de l'EXIF ni del GPS. */
function esperaNet(bytes) {
  expect([...bytes]).toEqual([...SORTIDA_CANVAS]);
  expect(conteMarca(bytes, MARCA_EXIF)).toBe(false);
  expect(teExif(bytes)).toBe(false);
  expect(llegixExif(bytes).gps).toBeNull();
}
/** Bloc 1.2 · El canvas amb UN APP1 nou: l'EXIF publicable de l'original, sense la miniatura, i res més. */
function esperaAmbExif(bytes) {
  expect([...extreuTiff(bytes)]).toEqual([...preparaTiff(TIFF_GPS)]);
  expect(llegixExif(bytes)).toEqual({ orientacio: 1, gps: { lat: 38.5919, lng: -0.4184, altitud: 456.7 }, dataCaptura: '2017-05-14T10:22:33+02:00' });
  expect(conteMarca(bytes, [...MARCA_MINIATURA])).toBe(false);
  // Fora eixe APP1, queden exactament els bytes del canvas.
  const app1 = 2 + APP0_JFIF.length;
  const longitud = (bytes[app1 + 2] << 8) | bytes[app1 + 3];
  expect([...bytes.subarray(0, app1), ...bytes.subarray(app1 + 2 + longitud)]).toEqual([...SORTIDA_CANVAS]);
}
/* FileReader (dins de compressImage) acaba en una tasca a banda: s'espera la pujada. */
async function esperaPujades(pujada, quantes, espera) {
  await waitFor(() => expect(pujada).toHaveBeenCalledTimes(quantes));
  await act(async () => {});
  for (const [fitxer] of pujada.mock.calls) espera(await bytesDe(fitxer));
}

class ImatgeFalsa {
  constructor() {
    this.width = 0;
    this.height = 0;
  }

  set src(url) {
    this.url = url;
    queueMicrotask(() => {
      this.width = 3000;
      this.height = 3000;
      this.onload?.();
    });
  }

  get src() {
    return this.url;
  }
}

const fotoGps = () => new File([FOTO_GPS], 'IMG_2041.jpg', { type: 'image/jpeg' });

beforeEach(() => {
  // Una foto quadrada: sense ampliar, el retall és la foto SENCERA.
  dobles.carregaImatge.mockReset().mockResolvedValue({ amplada: 3000, alcada: 3000, tipus: 'image/jpeg', element: {}, allibera: vi.fn() });
  dobles.exportaRetall.mockReset().mockImplementation(async () => new File([SORTIDA_RETALL], 'enquadrament.jpg', { type: 'image/jpeg' }));
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

test('la foto de prova porta de veres l’EXIF, el GPS de la Torre i la miniatura', () => {
  expect(teExif(FOTO_GPS)).toBe(true);
  expect(llegixExif(FOTO_GPS)).toMatchObject({ orientacio: 6, gps: { lat: 38.5919, lng: -0.4184 } });
  expect(conteMarca(FOTO_GPS, [...MARCA_MINIATURA])).toBe(true);
});

/* ── La fitxa del Perfil, Onada 4 (retallador senzill, 261008) ──
   Els tres botons (useImatgeDeFitxa): el retall ix SEMPRE recodificat (també
   desat sense ampliar) i la pujada el torna a passar pel canvas. */

function Fitxa({ camp, forma, onImageUpload }) {
  const imatge = useImatgeDeFitxa({ camp, forma, onImageUpload, onDesaCamp: vi.fn(), onError: vi.fn() });
  return <>{imatge.input}{imatge.dialeg}</>;
}

async function obriFitxa(camp, forma, onImageUpload) {
  const vista = render(<Fitxa camp={camp} forma={forma} onImageUpload={onImageUpload} />);
  await act(async () => {
    fireEvent.change(vista.container.querySelector('input[type="file"]'), { target: { files: [fotoGps()] } });
  });
  await act(async () => {});
  return vista;
}

test('Bloc 1.2 · avatar i capçalera de la fitxa, desats sense ampliar i amb la casella marcada de sèrie: puja el canvas amb l’EXIF publicable, mai l’original', async () => {
  const casos = [['logoImage', 'avatar', 'Retalla la foto'], ['heroImage', 'capcalera', 'Retalla la capçalera']];
  for (const [camp, forma, finestra] of casos) {
    const onImageUpload = vi.fn(async () => 'sdp-media://mitjans/t/u/avatars/a.webp');
    await obriFitxa(camp, forma, onImageUpload);
    const dialeg = screen.getByRole('dialog', { name: finestra });
    const casella = await within(dialeg).findByRole('checkbox', CASELLA);
    expect(casella.checked, forma).toBe(true);
    expect(within(dialeg).getByText(AJUDA_CONSERVA_UBICACIO)).toBeTruthy();
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Guardar' })); });
    expect(dobles.exportaRetall, forma).toHaveBeenCalledTimes(1);
    await esperaPujades(onImageUpload, 1, esperaAmbExif);
    cleanup();
    dobles.exportaRetall.mockClear();
  }
});

test('Bloc 1.2 · amb la casella desmarcada, la capçalera i l’avatar pugen nets; el logotip no té casella i puja net', async () => {
  for (const [camp, forma, finestra] of [['heroImage', 'capcalera', 'Retalla la capçalera'], ['logoImage', 'avatar', 'Retalla la foto']]) {
    const onImageUpload = vi.fn(async () => 'sdp-media://mitjans/t/u/avatars/a.webp');
    await obriFitxa(camp, forma, onImageUpload);
    const dialeg = screen.getByRole('dialog', { name: finestra });
    await act(async () => { fireEvent.click(await within(dialeg).findByRole('checkbox', CASELLA)); });
    expect(within(dialeg).getByRole('checkbox', CASELLA).checked).toBe(false);
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Guardar' })); });
    await esperaPujades(onImageUpload, 1, esperaNet);
    cleanup();
  }
  const onImageUpload = vi.fn(async () => 'sdp-media://mitjans/t/u/organitzacions/a.webp');
  await obriFitxa('logoImage', 'logotip', onImageUpload);
  const dialeg = screen.getByRole('dialog', { name: 'Retalla el logotip' });
  expect(within(dialeg).queryByRole('checkbox')).toBeNull();
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Guardar' })); });
  await esperaPujades(onImageUpload, 1, esperaNet);
});

/* ── L'ajust d'imatge (DetallAjust) ── */

/* Onada 6 (verificació, 261009) · `desaRetall` es cridava sense definir des
   que el diàleg intermedi del Perfil va desaparéixer (261008) amb els seus
   ajudants. És el botó de desar del retallador T46 de l'avatar
   (useEnquadramentAvatar), el que DetallAjust munta. */
const desaRetall = () => act(async () => {
  fireEvent.click(within(screen.getByRole('dialog', RETALLADOR)).getByRole('button', { name: 'Desar l’enquadrament' }));
});

test('Bloc 1.2 · DetallAjust: l’avatar que puja és el del canvas, amb l’EXIF publicable de sèrie', async () => {
  const ajust = { id: 'avatar', lloc: 'fitxa', titol: 'Foto de perfil', camp: 'avatar_url', tipus: 'imatge', valor: '', obert: true };
  const pujaMitja = vi.fn(async () => 'sdp-media://mitjans/t/u/avatars/a.webp');
  render(<DetallAjust ajust={ajust} identitat={{ id: 'jo', mena: 'persona', nom: 'Pep', dades: {} }} guardarAjust={vi.fn()} pujaMitja={pujaMitja} />);
  await act(async () => {
    fireEvent.change(screen.getByLabelText('Nou valor per a foto de perfil:'), { target: { files: [fotoGps()] } });
  });
  await act(async () => {});
  expect((await within(screen.getByRole('dialog', RETALLADOR)).findByRole('checkbox', CASELLA)).checked).toBe(true);
  await desaRetall();
  await esperaPujades(pujaMitja, 1, esperaAmbExif);
});

/* ── El contracte T46: «Original» sense zoom torna el MATEIX File ── */

function CapcaleraT46({ font, onImageUpload, rebut }) {
  const handler = useHeroImageHandler({ onImageUpload, onSaveField: vi.fn(), onError: vi.fn() });
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  return (
    <DialegEnquadrament font={font} onTanca={() => {}}
      onDesa={async (fitxer) => { rebut.push(fitxer); return handlerRef.current.processaFitxer(fitxer); }} />
  );
}

test('K3 · T46 sense la casella (el contracte d’abans): el diàleg torna l’original amb GPS, però processaFitxer el recodifica net abans de pujar', async () => {
  const font = fotoGps();
  const rebut = [];
  const onImageUpload = vi.fn(async () => 'sdp-media://mitjans_privats/t/u/notes/a.webp');
  render(<CapcaleraT46 font={font} onImageUpload={onImageUpload} rebut={rebut} />);
  await act(async () => {});
  expect(screen.queryByRole('checkbox')).toBeNull();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Desar l’enquadrament' })); });
  // El camí T46 de veres: el mateix File, amb el seu EXIF, arriba al pare...
  expect(rebut).toHaveLength(1);
  expect(rebut[0]).toBe(font);
  expect(dobles.exportaRetall).not.toHaveBeenCalled();
  // ...i el que puja és el canvas de compressImage.
  await esperaPujades(onImageUpload, 1, esperaNet);
});
