import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { DialegEnquadrament } from './DialegEnquadrament.jsx';
import { configDeForma } from './useEnquadramentImatge.jsx';
import { ETIQUETA_CONSERVA_EXIF } from './exifIncrustat.js';
import { ambEnquadrament, separaEnquadrament } from '../../../utils/enquadramentUrl.js';
import {
  APP0_JFIF, IMATGE, SOI, concatena, dataOriginal, gpsTorre, jpegAmbExif,
} from '../../../../tests/helpers/jpegProva.js';

/* P0-80 / IDEA-211 (llei del Mestre, 09-11-2026: ENQUADRAMENT NO DESTRUCTIU) ·
   El diàleg amb `noDestructiu` (la capçalera): cap foto es retalla. jsdom no
   té canvas: el carregador, l'exportador i el dibuix s'injecten, i el que es
   comprova és el que reben (el rectangle de l'exportador, el que va a onDesa
   i l'adreça que es carrega). */

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const W = 4000;
const H = 3000;
const BASE = 'https://exemple.test/mitjans/foto.webp';
const foto = () => new File(['x'], 'foto.jpg', { type: 'image/jpeg' });

function munta({ font = foto(), senzill = false, imatge = {}, ...resta } = {}) {
  const img = { amplada: W, alcada: H, tipus: 'image/jpeg', element: { soc: 'foto' }, allibera: vi.fn(), ...imatge };
  const cfg = configDeForma('capcalera');
  const p = {
    font,
    noDestructiu: true,
    formats: cfg.formats,
    formatInicial: typeof font === 'string' ? 'original' : cfg.formatInicial,
    sortida: cfg.sortida(font),
    carregador: vi.fn(async () => img),
    exportador: vi.fn(async () => new File(['y'], 'sencera.jpg', { type: 'image/jpeg' })),
    dibuixant: vi.fn(() => true),
    onDesa: vi.fn(async () => true),
    onTanca: vi.fn(),
    ...(senzill ? { senzill: true, titol: cfg.titol, descripcio: cfg.descripcio } : null),
    ...resta,
  };
  const vista = render(<DialegEnquadrament {...p} />);
  return { ...vista, ...p };
}
const carregat = () => act(async () => {});
const desa = (vista, nom = 'Desar l’enquadrament') => act(async () => {
  fireEvent.click(within(vista.getByRole('dialog')).getByRole('button', { name: nom }));
});
const radio = (vista, valor) => vista.getByRole('dialog').querySelector(`input[type="radio"][value="${valor}"]`);
const forma = (vista, valor) => act(() => { fireEvent.click(radio(vista, valor)); });
const zoom = (vista, valor) => act(() => { fireEvent.change(vista.getByLabelText('Ampliació'), { target: { value: String(valor) } }); });

describe('una foto nova (File): es puja sencera', () => {
  test('l’exportador rep la foto SENCERA { 0, 0, W, H }, mai el retall; onDesa porta el marc a part', async () => {
    const vista = munta();
    await carregat();
    await forma(vista, '16:9');
    await zoom(vista, 2);
    await desa(vista);
    expect(vista.exportador).toHaveBeenCalledTimes(1);
    const [element, rect, opcions] = vista.exportador.mock.calls[0];
    expect(element).toEqual({ soc: 'foto' });
    expect(rect).toEqual({ x: 0, y: 0, w: W, h: H });
    // 1.200 pel costat llarg DE LA FOTO (la capçalera), amb la seua proporció: 4:3.
    expect(opcions).toMatchObject({ amplada: 1200, alcada: 900 });
    const [fitxer, info] = vista.onDesa.mock.calls[0];
    expect(fitxer).toBeInstanceOf(File);
    expect(info).toMatchObject({ format: '16:9', rect: { x: 0, y: 0, w: W, h: H }, sencera: true });
    expect(info.enquadrament).toEqual({ format: '16:9', zoom: 2, cx: 0.5, cy: 0.5 });
    // El retall d'abans només és informatiu: el marc que es veu.
    expect(info.retall).toEqual({ x: 1000, y: 938, w: 2000, h: 1125 });
  });

  test('una `sortida` exacta (la d’un retall) no s’aplica a la foto sencera', async () => {
    const vista = munta({ sortida: { ampladaMaxima: 400, format: 'image/webp', exacta: { amplada: 400, alcada: 400 } } });
    await carregat();
    await desa(vista);
    expect(vista.exportador.mock.calls[0][1]).toEqual({ x: 0, y: 0, w: W, h: H });
    expect(vista.exportador.mock.calls[0][2]).toMatchObject({ amplada: 400, alcada: 300 });
  });

  test('la foto sencera (Original, sense ampliar) no porta cap marc', async () => {
    const vista = munta();
    await carregat();
    await forma(vista, 'original');
    await desa(vista);
    expect(vista.onDesa.mock.calls[0][1].enquadrament).toBeNull();
  });
});

describe('una adreça desada: re-enquadrar no torna a retallar', () => {
  const desada = ambEnquadrament(BASE, { format: '16:9', zoom: 1.5, cx: 0.4, cy: 0.6 });

  test('es carrega la foto SENCERA (sense el fragment) i el diàleg comença en el seu marc', async () => {
    const vista = munta({ font: desada });
    await carregat();
    expect(vista.carregador.mock.calls[0][0]).toBe(BASE);
    expect(radio(vista, '16:9').checked).toBe(true);
    expect(vista.getByLabelText('Ampliació').getAttribute('aria-valuetext')).toBe('150 %');
    // El visor pinta el mateix marc: 4.000 / 1,5 d'ample en 16:9, centrat a 0,4 i 0,6.
    expect(vista.dibuixant.mock.lastCall[2]).toEqual({ x: 267, y: 1050, w: 2667, h: 1500 });
  });

  test('obrir i tornar a desar sense moure res: no es desa res, ni cap exportació ni cap pujada', async () => {
    const vista = munta({ font: desada });
    await carregat();
    await desa(vista);
    expect(vista.exportador).not.toHaveBeenCalled();
    expect(vista.onDesa).not.toHaveBeenCalled();
    expect(vista.onTanca).toHaveBeenCalledWith('boto');
  });

  test('moure el marc: onDesa rep la MATEIXA adreça amb el marc nou (un text), sense cap exportació', async () => {
    const vista = munta({ font: desada });
    await carregat();
    await zoom(vista, 2);
    await desa(vista);
    expect(vista.exportador).not.toHaveBeenCalled();
    const [valor, info] = vista.onDesa.mock.calls[0];
    expect(typeof valor).toBe('string');
    expect(separaEnquadrament(valor)).toEqual({ base: BASE, enquadrament: info.enquadrament });
    expect(info.enquadrament).toMatchObject({ format: '16:9', zoom: 2 });
    expect(info.rect).toEqual({ x: 0, y: 0, w: W, h: H });
  });

  test('una imatge d’abans, ja retallada i sense fragment: s’obri tal com és i un marc nou només hi afig el fragment', async () => {
    const vista = munta({ font: BASE });
    await carregat();
    expect(radio(vista, 'original').checked).toBe(true);
    // Desar-la tal com és no la toca.
    await desa(vista);
    expect(vista.onDesa).not.toHaveBeenCalled();
    expect(vista.exportador).not.toHaveBeenCalled();
    await zoom(vista, 1.5);
    await desa(vista);
    expect(vista.exportador).not.toHaveBeenCalled();
    expect(separaEnquadrament(vista.onDesa.mock.calls[0][0])).toEqual({ base: BASE, enquadrament: { format: 'original', zoom: 1.5, cx: 0.5, cy: 0.5 } });
  });

  test('una foto d’identitat amb GPS es torna a codificar SENCERA (sense el GPS), mai retallada', async () => {
    const blob = new Blob([jpegAmbExif({ gps: gpsTorre() })], { type: 'image/jpeg' });
    const vista = munta({ font: desada, avisaGpsEliminat: true, imatge: { blob } });
    await carregat();
    await carregat();
    await desa(vista);
    expect(vista.exportador).toHaveBeenCalledTimes(1);
    expect(vista.exportador.mock.calls[0][1]).toEqual({ x: 0, y: 0, w: W, h: H });
    const [fitxer, info, metadades] = vista.onDesa.mock.calls[0];
    expect(fitxer).toBeInstanceOf(File);
    expect(info.enquadrament).toEqual({ format: '16:9', zoom: 1.5, cx: 0.4, cy: 0.6 });
    expect(metadades).toMatchObject({ exif: { conservaExif: false }, gpsEliminat: true });
  });
});

/* R16a (revisió final, troballa 3, P1 de privadesa) · Re-enquadrar una
   capçalera desada que porta GPS: les píndoles de la precisió es veien, però
   una precisió més grossa no es tornava a codificar (el diàleg lliurava un
   text) i el fitxer públic es quedava amb la ubicació exacta. Ara la foto
   sencera es torna a codificar quan la precisió triada és més grossa que la
   del fitxer; les píndoles s'obrin en la del fitxer, i sense cap canvi no es
   puja res. */
describe('R16a · la precisió del GPS en re-enquadrar una adreça', () => {
  const desada = ambEnquadrament(BASE, { format: '16:9', zoom: 1.5, cx: 0.4, cy: 0.6 });
  const MARC_DESAT = { format: '16:9', zoom: 1.5, cx: 0.4, cy: 0.6 };
  const CASELLA = { name: new RegExp(ETIQUETA_CONSERVA_EXIF) };
  const jpeg = (bytes) => new Blob([bytes], { type: 'image/jpeg' });
  /* El GPS de la càmera (exacte) i el d'un fitxer que ja ha passat per la
     pujada, amb la marca d'ajustaPrecisioGps: (n, 10^d), (0, 1), (0, 1). */
  const ambGpsExacte = () => jpeg(jpegAmbExif({ exif: dataOriginal('2017:05:14 10:22:33'), gps: gpsTorre() }));
  const ambGpsArrodonit = (n, den, m) => jpeg(jpegAmbExif({
    gps: gpsTorre({ lat: [[n, den], [0, 1], [0, 1]], lng: [[m, den], [0, 1], [0, 1]] }),
  }));
  const ambGpsPoble = () => ambGpsArrodonit(3859, 100, 42);
  const ambGps100 = () => ambGpsArrodonit(38592, 1000, 418);
  const reobri = async (blob, resta = {}) => {
    const vista = munta({ font: desada, ofereixConservarExif: true, imatge: { blob }, ...resta });
    await carregat();
    return vista;
  };
  const conservaVisible = (vista) => within(vista.getByRole('dialog')).findByRole('checkbox', CASELLA);
  const precisio = (vista, valor) => act(() => { fireEvent.click(radio(vista, valor)); });

  test('GPS exacte, «Només el poble» i un marc nou: es torna a codificar la foto SENCERA, amb la precisió i el marc', async () => {
    const blob = ambGpsExacte();
    const vista = await reobri(blob);
    await conservaVisible(vista);
    await precisio(vista, 'poble');
    await zoom(vista, 2);
    await desa(vista);
    expect(vista.exportador).toHaveBeenCalledTimes(1);
    expect(vista.exportador.mock.calls[0][1]).toEqual({ x: 0, y: 0, w: W, h: H });
    const [fitxer, info, metadades] = vista.onDesa.mock.calls[0];
    expect(fitxer).toBeInstanceOf(File);
    expect(info).toMatchObject({ rect: { x: 0, y: 0, w: W, h: H }, sencera: true });
    expect(info.enquadrament).toEqual({ ...MARC_DESAT, zoom: 2 });
    expect(metadades.exif).toEqual({ conservaExif: true, original: blob, precisio: 'poble' });
    expect(metadades.geolocalitzacio).toMatchObject({ lat: 38.59, lng: -0.42, precisio: 'poble', origen: 'exif' });
  });

  test('només la precisió, amb el marc igual: no es tanca sense desar, es torna a codificar amb el marc de sempre', async () => {
    const vista = await reobri(ambGpsExacte());
    await conservaVisible(vista);
    await precisio(vista, '100m');
    await desa(vista);
    expect(vista.onTanca).not.toHaveBeenCalled();
    expect(vista.exportador).toHaveBeenCalledTimes(1);
    expect(vista.exportador.mock.calls[0][1]).toEqual({ x: 0, y: 0, w: W, h: H });
    const [fitxer, info, metadades] = vista.onDesa.mock.calls[0];
    expect(fitxer).toBeInstanceOf(File);
    expect(info.enquadrament).toEqual(MARC_DESAT);
    expect(metadades.exif.precisio).toBe('100m');
  });

  test('GPS exacte i l’exacta de sèrie: un marc nou continua sense cap exportació (el «cap pujada» de P0-80)', async () => {
    const vista = await reobri(ambGpsExacte());
    await conservaVisible(vista);
    expect(radio(vista, 'exacta').checked).toBe(true);
    await zoom(vista, 2);
    await desa(vista);
    expect(vista.exportador).not.toHaveBeenCalled();
    expect(separaEnquadrament(vista.onDesa.mock.calls[0][0])).toEqual({ base: BASE, enquadrament: { ...MARC_DESAT, zoom: 2 } });
  });

  test('una foto nova (File) amb el GPS ja arrodonit s’obri en l’exacta, com abans: la precisió del fitxer només mana en re-enquadrar', async () => {
    const fitxer = new File([jpegAmbExif({
      gps: gpsTorre({ lat: [[3859, 100], [0, 1], [0, 1]], lng: [[42, 100], [0, 1], [0, 1]] }),
    })], 'baixada.jpg', { type: 'image/jpeg' });
    const vista = munta({ font: fitxer, ofereixConservarExif: true });
    await carregat();
    await conservaVisible(vista);
    expect(radio(vista, 'exacta').checked).toBe(true);
    expect(radio(vista, 'poble').checked).toBe(false);
  });

  test('un fitxer ja arrodonit al poble s’obri en «Només el poble»: tornar-lo a desar, o moure el marc, no puja res', async () => {
    const vista = await reobri(ambGpsPoble());
    await conservaVisible(vista);
    expect(radio(vista, 'poble').checked).toBe(true);
    expect(within(vista.getByRole('dialog')).getByText(/^Es desarà: 38\.59, -0\.42 \(uns 1\.000 m\)\./)).toBeTruthy();
    await desa(vista);
    expect(vista.onDesa).not.toHaveBeenCalled();
    expect(vista.onTanca).toHaveBeenCalledWith('boto');
    await zoom(vista, 2);
    await desa(vista);
    expect(vista.exportador).not.toHaveBeenCalled();
    expect(typeof vista.onDesa.mock.calls[0][0]).toBe('string');
  });

  test.each([
    ['poble', 'exacta', ambGpsPoble, false],
    ['poble', '100m', ambGpsPoble, false],
    ['100m', 'poble', ambGps100, true],
  ])('un fitxer a «%s» i la píndola «%s»: es torna a codificar només si la precisió és més grossa (%s)', async (delFitxer, triada, blob, codifica) => {
    const vista = await reobri(blob());
    await conservaVisible(vista);
    expect(radio(vista, delFitxer).checked).toBe(true);
    await precisio(vista, triada);
    await zoom(vista, 2);
    await desa(vista);
    expect(vista.exportador).toHaveBeenCalledTimes(codifica ? 1 : 0);
    const [fitxer, , metadades] = vista.onDesa.mock.calls[0];
    expect(fitxer instanceof File).toBe(codifica);
    expect(metadades.exif.precisio).toBe(triada);
  });

  test('el camí invers: desmarcar la casella (llevar la ubicació) torna a codificar la foto sencera, neta, encara que el marc no es moga', async () => {
    const vista = await reobri(ambGpsExacte());
    fireEvent.click(await conservaVisible(vista));
    await desa(vista);
    expect(vista.exportador).toHaveBeenCalledTimes(1);
    expect(vista.exportador.mock.calls[0][1]).toEqual({ x: 0, y: 0, w: W, h: H });
    const [fitxer, info, metadades] = vista.onDesa.mock.calls[0];
    expect(fitxer).toBeInstanceOf(File);
    expect(info.enquadrament).toEqual(MARC_DESAT);
    expect(metadades.exif).toEqual({ conservaExif: false });
    expect(metadades.geolocalitzacio).toBeNull();
  });

  test.each([
    ['només la data', () => jpeg(jpegAmbExif({ exif: dataOriginal('2017:05:14 10:22:33') })), true],
    ['cap EXIF', () => jpeg(concatena(SOI, APP0_JFIF, IMATGE)), false],
  ])('una foto sense GPS (%s): cap píndola i un marc nou continua sense pujar res', async (_nom, blob, ambCasella) => {
    const vista = await reobri(blob());
    await carregat();
    expect(Boolean(within(vista.getByRole('dialog')).queryByRole('checkbox', CASELLA))).toBe(ambCasella);
    expect(radio(vista, 'poble')).toBeNull();
    await zoom(vista, 2);
    await desa(vista);
    expect(vista.exportador).not.toHaveBeenCalled();
    expect(typeof vista.onDesa.mock.calls[0][0]).toBe('string');
  });
});

describe('sense `noDestructiu`, el contracte d’abans (l’avatar i el logotip)', () => {
  /* R16a (troballa 3) · senseCanvi compta també la precisió: una adreça
     sencera amb una precisió més grossa ja no es tanca sense desar. */
  test('una adreça sencera amb GPS exacte i «Només el poble»: es torna a exportar sencera amb la precisió', async () => {
    const blob = new Blob([jpegAmbExif({ gps: gpsTorre() })], { type: 'image/jpeg' });
    const vista = munta({ noDestructiu: false, font: BASE, ofereixConservarExif: true, imatge: { blob } });
    await carregat();
    await within(vista.getByRole('dialog')).findByRole('checkbox', { name: new RegExp(ETIQUETA_CONSERVA_EXIF) });
    expect(radio(vista, 'exacta').checked).toBe(true);
    await act(() => { fireEvent.click(radio(vista, 'poble')); });
    await desa(vista);
    expect(vista.onTanca).not.toHaveBeenCalled();
    expect(vista.exportador.mock.calls[0][1]).toEqual({ x: 0, y: 0, w: W, h: H });
    const [fitxer, , metadades] = vista.onDesa.mock.calls[0];
    expect(fitxer).toBeInstanceOf(File);
    expect(metadades.exif).toEqual({ conservaExif: true, original: blob, precisio: 'poble' });
  });

  test('el retall es cou dins del fitxer', async () => {
    const vista = munta({ noDestructiu: false });
    await carregat();
    await forma(vista, '16:9');
    await desa(vista);
    expect(vista.exportador.mock.calls[0][1]).toEqual({ x: 0, y: 375, w: 4000, h: 2250 });
    expect(vista.onDesa.mock.calls[0][1]).toEqual({ format: '16:9', rect: { x: 0, y: 375, w: 4000, h: 2250 }, sencera: false });
  });
});
