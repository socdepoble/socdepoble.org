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
 * que arriba al servidor no seria SORTIDA_CANVAS. */
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
import { DialegEnquadrament } from '../../components/universal/enquadrament/DialegEnquadrament.jsx';
import { llegixExif, teExif } from '../../components/universal/enquadrament/exif.js';
import {
  APP0_JFIF, IMATGE, SOI, concatena, dataOriginal, gpsTorre, jpegAmbExif, orientacio,
} from '../../components/universal/enquadrament/jpegProva.js';

const FOTO_GPS = jpegAmbExif({ ifd0: [orientacio(1)], exif: dataOriginal('2017:05:14 10:22:33', '+02:00'), gps: gpsTorre() });
const SORTIDA_CANVAS = concatena(SOI, APP0_JFIF, IMATGE);
const SORTIDA_RETALL = concatena(SOI, APP0_JFIF, Uint8Array.of(0xff, 0xfe, 0x00, 0x04, 0x52, 0x54), IMATGE); // amb un COM «RT»
const MARCA_EXIF = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00];
const RETALLADOR = { name: 'Enquadrar l’avatar' };

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
const conteMarcaExif = (bytes) => bytes.some((_, i) => MARCA_EXIF.every((b, k) => bytes[i + k] === b));
/** Ha eixit de compressImage (el canvas) i no porta cap rastre de l'EXIF ni del GPS. */
function esperaNet(bytes) {
  expect([...bytes]).toEqual([...SORTIDA_CANVAS]);
  expect(conteMarcaExif(bytes)).toBe(false);
  expect(teExif(bytes)).toBe(false);
  expect(llegixExif(bytes).gps).toBeNull();
}
/* FileReader (dins de compressImage) acaba en una tasca a banda: s'espera la pujada. */
async function esperaPujadesNetes(pujada, quantes) {
  await waitFor(() => expect(pujada).toHaveBeenCalledTimes(quantes));
  await act(async () => {});
  for (const [fitxer] of pujada.mock.calls) esperaNet(await bytesDe(fitxer));
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

test('la foto de prova porta de veres l’EXIF i el GPS de la Torre', () => {
  expect(teExif(FOTO_GPS)).toBe(true);
  expect(llegixExif(FOTO_GPS).gps).toMatchObject({ lat: 38.5919, lng: -0.4184 });
});

/* ── La fitxa del Perfil, Onada 4 (retallador senzill, 261008) ──
   Els tres botons (useImatgeDeFitxa): el retall ix SEMPRE recodificat (també
   desat sense ampliar) i la pujada el torna a passar pel canvas. */

function Fitxa({ camp, forma, onImageUpload }) {
  const imatge = useImatgeDeFitxa({ camp, forma, onImageUpload, onDesaCamp: vi.fn(), onError: vi.fn() });
  return <>{imatge.input}{imatge.dialeg}</>;
}

test('K3 · Onada 4 · avatar, logotip i capçalera de la fitxa, desats sense ampliar: el que puja és el canvas, mai l’original', async () => {
  const casos = [['logoImage', 'avatar', 'Retalla la foto'], ['logoImage', 'logotip', 'Retalla el logotip'], ['heroImage', 'capcalera', 'Retalla la capçalera']];
  for (const [camp, forma, finestra] of casos) {
    const onImageUpload = vi.fn(async () => 'sdp-media://mitjans/t/u/avatars/a.webp');
    const vista = render(<Fitxa camp={camp} forma={forma} onImageUpload={onImageUpload} />);
    await act(async () => {
      fireEvent.change(vista.container.querySelector('input[type="file"]'), { target: { files: [fotoGps()] } });
    });
    await act(async () => {});
    await act(async () => {
      fireEvent.click(within(screen.getByRole('dialog', { name: finestra })).getByRole('button', { name: 'Guardar' }));
    });
    expect(dobles.exportaRetall, forma).toHaveBeenCalledTimes(1);
    await esperaPujadesNetes(onImageUpload, 1);
    cleanup();
    dobles.exportaRetall.mockClear();
  }
});

/* ── L'ajust d'imatge (DetallAjust) ── */

test('K3 · DetallAjust: l’avatar que puja és el del canvas', async () => {
  const ajust = { id: 'avatar', lloc: 'fitxa', titol: 'Foto de perfil', camp: 'avatar_url', tipus: 'imatge', valor: '', obert: true };
  const pujaMitja = vi.fn(async () => 'sdp-media://mitjans/t/u/avatars/a.webp');
  render(<DetallAjust ajust={ajust} identitat={{ id: 'jo', mena: 'persona', nom: 'Pep', dades: {} }} guardarAjust={vi.fn()} pujaMitja={pujaMitja} />);
  await act(async () => {
    fireEvent.change(screen.getByLabelText('Nou valor per a foto de perfil:'), { target: { files: [fotoGps()] } });
  });
  await act(async () => {});
  await desaRetall();
  await esperaPujadesNetes(pujaMitja, 1);
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

test('K3 · T46 (la capçalera de la closca): el diàleg torna l’original amb GPS, però processaFitxer el recodifica abans de pujar', async () => {
  const font = fotoGps();
  const rebut = [];
  const onImageUpload = vi.fn(async () => 'sdp-media://mitjans_privats/t/u/notes/a.webp');
  render(<CapcaleraT46 font={font} onImageUpload={onImageUpload} rebut={rebut} />);
  await act(async () => {});
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Desar l’enquadrament' })); });
  // El camí T46 de veres: el mateix File, amb el seu EXIF, arriba al pare...
  expect(rebut).toHaveLength(1);
  expect(rebut[0]).toBe(font);
  expect(dobles.exportaRetall).not.toHaveBeenCalled();
  // ...i el que puja és el canvas de compressImage.
  await esperaPujadesNetes(onImageUpload, 1);
});
