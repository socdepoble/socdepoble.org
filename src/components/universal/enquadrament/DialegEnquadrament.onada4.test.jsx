import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { DialegEnquadrament, ERROR_CARREGA_FITXER } from './DialegEnquadrament.jsx';
import { senseDades } from './exif.js';
import { ERROR_UBICACIO } from './geolocalitzacio.js';
import { gpsTorre, jpegAmbExif, orientacio } from '../../../../tests/helpers/jpegProva.js';
import { ERROR_HEIC, ERROR_PES, ERROR_PIXELS, ErrorImatge, PES_MAXIM_ENTRADA } from './limits.js';

/* Onada 4, T3a · Ampliacions del DialegEnquadrament: geolocalització
   voluntària (ADR multimèdia D5, D6, §3.3), `sortida`, límits d'entrada i
   teclat sobre el visor (RETALLADOR §1). jsdom no té canvas: el carregador,
   l'exportador, el dibuix i el lector de metadades s'injecten. */

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const DESAR = 'Desar l’enquadrament';
const NOM_CASELLA = /Vull geolocalitzar aquesta imatge/;
const foto = () => new File(['x'], 'foto.jpg', { type: 'image/jpeg' });
const AMB_GPS = { orientacio: 1, gps: { lat: 38.591937, lng: -0.418426, altitud: 456.7 }, dataCaptura: '2017-05-14T10:22:33+02:00' };

function munta({ font = foto(), imatge = {}, ...props } = {}) {
  const img = { amplada: 4000, alcada: 2000, tipus: 'image/jpeg', element: { soc: 'element' }, allibera: vi.fn(), ...imatge };
  const eines = {
    carregador: vi.fn(async () => img),
    exportador: vi.fn(async () => new File(['y'], 'enquadrament.webp', { type: 'image/webp' })),
    dibuixant: vi.fn(() => true),
    onDesa: vi.fn(async () => true),
    onTanca: vi.fn(),
    lectorMetadades: vi.fn(async () => AMB_GPS),
    ...props,
  };
  const vista = render(<DialegEnquadrament font={font} {...eines} />);
  return { ...vista, img, font, ...eines };
}

const carregat = async (vista) => {
  await act(async () => {});
  return vista.getByLabelText('Ampliació');
};
const desa = async (vista) => {
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
};
const marca = async (vista) => {
  await act(async () => { fireEvent.click(vista.getByRole('checkbox', { name: NOM_CASELLA })); });
};
const escriu = (vista, etiqueta, valor) => {
  act(() => { fireEvent.change(vista.getByLabelText(etiqueta), { target: { value: valor } }); });
};
const metadadesDe = (onDesa) => onDesa.mock.calls[0][2];

describe('T3a · geolocalització: apagada de sèrie', () => {
  test('sense permetGeolocalitzacio no hi ha casella, no es llig res i metadades va tot a null', async () => {
    const vista = munta();
    await carregat(vista);
    expect(vista.queryByRole('checkbox', { name: NOM_CASELLA })).toBeNull();
    await desa(vista);
    expect(vista.lectorMetadades).not.toHaveBeenCalled();
    expect(metadadesDe(vista.onDesa)).toEqual({ geolocalitzacio: null, dataCaptura: null });
  });

  test('amb permetGeolocalitzacio, la casella ix desmarcada; sense marcar-la no es llig cap GPS', async () => {
    const vista = munta({ permetGeolocalitzacio: true });
    await carregat(vista);
    const casella = vista.getByRole('checkbox', { name: NOM_CASELLA });
    expect(casella.checked).toBe(false);
    expect(vista.queryByLabelText('Latitud')).toBeNull();
    await desa(vista);
    expect(vista.lectorMetadades).not.toHaveBeenCalled();
    expect(metadadesDe(vista.onDesa)).toEqual({ geolocalitzacio: null, dataCaptura: null });
    expect(document.querySelector('[style]')).toBeNull();
  });
});

describe('T3a · geolocalització: encesa', () => {
  test('marcar-la llig el GPS del fitxer ORIGINAL, l’ensenya i el desa com a camps arrodonits', async () => {
    const vista = munta({ permetGeolocalitzacio: true });
    await carregat(vista);
    await marca(vista);
    expect(vista.lectorMetadades).toHaveBeenCalledTimes(1);
    expect(vista.lectorMetadades).toHaveBeenCalledWith(vista.font);
    expect(vista.getByLabelText('Latitud').value).toBe('38.591937');
    expect(vista.getByLabelText('Longitud').value).toBe('-0.418426');
    expect(vista.container.textContent).toContain('La foto porta esta ubicació');
    expect(vista.container.textContent).toContain('Es desarà: 38.59, -0.42 (uns 1.000 m).');
    expect(vista.container.textContent).toContain('Data de la foto: 2017-05-14 10:22:33+02:00');
    await desa(vista);
    const [fitxer, info, metadades] = vista.onDesa.mock.calls[0];
    expect(fitxer.name).toBe('enquadrament.webp'); // el retall nou, no l'original
    expect(info.format).toBe('1:1');
    expect(metadades).toEqual({
      geolocalitzacio: { lat: 38.59, lng: -0.42, precisio: 'poble', precisio_m: 1000, origen: 'exif' },
      dataCaptura: '2017-05-14T10:22:33+02:00',
    });
  });

  test('la precisió triada arrodonix el que es desa: exacta i uns 100 m', async () => {
    const vista = munta({ permetGeolocalitzacio: true });
    await carregat(vista);
    await marca(vista);
    act(() => { fireEvent.click(vista.getByRole('radio', { name: /^Uns 100 m/ })); });
    expect(vista.container.textContent).toContain('Es desarà: 38.592, -0.418 (uns 100 m).');
    act(() => { fireEvent.click(vista.getByRole('radio', { name: /^Exacta/ })); });
    await desa(vista);
    expect(metadadesDe(vista.onDesa).geolocalitzacio).toEqual({ lat: 38.59194, lng: -0.41843, precisio: 'exacta', precisio_m: 1, origen: 'exif' });
  });

  test('una foto sense GPS: avís, entrada a mà (amb coma decimal) i origen «manual»', async () => {
    const vista = munta({ permetGeolocalitzacio: true, lectorMetadades: vi.fn(async () => senseDades()) });
    await carregat(vista);
    await marca(vista);
    expect(vista.container.textContent).toContain('Esta foto no porta ubicació');
    expect(vista.getByLabelText('Latitud').value).toBe('');
    // Desar sense ubicació: avís en línia i res desat.
    await desa(vista);
    expect(vista.getByRole('alert').textContent).toBe(ERROR_UBICACIO);
    expect(vista.onDesa).not.toHaveBeenCalled();
    escriu(vista, 'Latitud', '38,5919');
    escriu(vista, 'Longitud', '-0.4184');
    await desa(vista);
    expect(metadadesDe(vista.onDesa)).toEqual({
      geolocalitzacio: { lat: 38.59, lng: -0.42, precisio: 'poble', precisio_m: 1000, origen: 'manual' },
      dataCaptura: null,
    });
  });

  test('corregir una coordenada de l’EXIF la fa «manual»; una coordenada impossible es marca i no es desa', async () => {
    const vista = munta({ permetGeolocalitzacio: true });
    await carregat(vista);
    await marca(vista);
    escriu(vista, 'Latitud', '95');
    expect(vista.getByLabelText('Latitud').getAttribute('aria-invalid')).toBe('true');
    expect(vista.container.textContent).toContain('Escriu una latitud entre -90 i 90');
    await desa(vista);
    expect(vista.onDesa).not.toHaveBeenCalled();
    escriu(vista, 'Latitud', '38.6');
    await desa(vista);
    expect(metadadesDe(vista.onDesa).geolocalitzacio).toMatchObject({ lat: 38.6, origen: 'manual' });
  });

  test('desmarcar-la després de llegir: no viatja cap coordenada ni cap data', async () => {
    const vista = munta({ permetGeolocalitzacio: true });
    await carregat(vista);
    await marca(vista);
    await marca(vista);
    await desa(vista);
    expect(metadadesDe(vista.onDesa)).toEqual({ geolocalitzacio: null, dataCaptura: null });
    // Tornar-la a marcar no torna a llegir el fitxer.
    await marca(vista);
    expect(vista.lectorMetadades).toHaveBeenCalledTimes(1);
  });

  test('mentre llig, «Desar» espera', async () => {
    let resol;
    const vista = munta({ permetGeolocalitzacio: true, lectorMetadades: vi.fn(() => new Promise((r) => { resol = r; })) });
    await carregat(vista);
    await marca(vista);
    expect(vista.getByRole('button', { name: DESAR }).disabled).toBe(true);
    expect(vista.getByText('Llegint la ubicació de la foto…')).toBeTruthy();
    await act(async () => resol(AMB_GPS));
    expect(vista.getByRole('button', { name: DESAR }).disabled).toBe(false);
  });

  test('de punta a punta amb el lector propi: un JPEG sintètic amb GPS', async () => {
    const font = new File([jpegAmbExif({ ifd0: [orientacio(1)], gps: gpsTorre() })], 'arbre.jpg', { type: 'image/jpeg' });
    const vista = munta({ font, permetGeolocalitzacio: true, lectorMetadades: undefined });
    await carregat(vista);
    await marca(vista);
    await act(async () => {}); // la lectura del Blob
    expect(vista.getByLabelText('Latitud').value).toBe('38.5919');
    expect(vista.getByLabelText('Longitud').value).toBe('-0.4184');
  });

  test('amb la geolocalització permesa, «Original» sense zoom també es torna a codificar: l’original no ix', async () => {
    const vista = munta({ permetGeolocalitzacio: true });
    await carregat(vista);
    act(() => { fireEvent.click(vista.container.querySelector('input[type="radio"][value="original"]')); });
    await desa(vista);
    expect(vista.exportador).toHaveBeenCalledTimes(1);
    expect(vista.onDesa.mock.calls[0][0]).not.toBe(vista.font);
    expect(vista.onDesa.mock.calls[0][1].sencera).toBe(true);
  });
});

describe('T3a · sortida', () => {
  test('el format i l’amplada màxima del pare arriben a l’exportador; «Original» també es recodifica', async () => {
    const vista = munta({ sortida: { ampladaMaxima: 600, format: 'image/webp', qualitat: 0.85 } });
    await carregat(vista);
    await desa(vista);
    expect(vista.exportador).toHaveBeenLastCalledWith(vista.img.element, { x: 1000, y: 0, w: 2000, h: 2000 },
      { amplada: 600, alcada: 600, tipus: 'image/webp', qualitat: 0.85 });
    act(() => { fireEvent.click(vista.container.querySelector('input[type="radio"][value="original"]')); });
    await desa(vista);
    expect(vista.exportador).toHaveBeenCalledTimes(2);
    expect(vista.onDesa.mock.calls[1][0]).not.toBe(vista.font);
  });
});

describe('T3a · límits d’entrada', () => {
  test('més de 25 MB: avís en línia i el carregador ni es crida', async () => {
    const gran = foto();
    Object.defineProperty(gran, 'size', { value: PES_MAXIM_ENTRADA + 1 });
    const vista = munta({ font: gran });
    await act(async () => {});
    expect(vista.getByRole('alert').textContent).toBe(ERROR_PES);
    expect(vista.carregador).not.toHaveBeenCalled();
    expect(vista.getByRole('button', { name: DESAR }).disabled).toBe(true);
  });

  test('massa píxels: avís i la imatge s’allibera, encara que el carregador no ho comprove', async () => {
    const vista = munta({ imatge: { amplada: 20000, alcada: 100 } });
    await act(async () => {});
    expect(vista.getByRole('alert').textContent).toBe(ERROR_PIXELS);
    expect(vista.img.allibera).toHaveBeenCalledTimes(1);
    expect(vista.container.querySelector('canvas')).toBeNull();
  });

  test('HEIC: pel codi de l’error o pel tipus del fitxer, l’avís propi; la resta, el de sempre', async () => {
    const perCodi = munta({ carregador: vi.fn(async () => { throw new ErrorImatge('heic'); }) });
    await act(async () => {});
    expect(perCodi.getByRole('alert').textContent).toBe(ERROR_HEIC);
    cleanup();
    const heic = new File(['x'], 'IMG_0001.HEIC', { type: '' });
    const perTipus = munta({ font: heic, carregador: vi.fn(async () => { throw new Error('decode'); }) });
    await act(async () => {});
    expect(perTipus.getByRole('alert').textContent).toBe(ERROR_HEIC);
    cleanup();
    const jpeg = munta({ carregador: vi.fn(async () => { throw new Error('decode'); }) });
    await act(async () => {});
    expect(jpeg.getByRole('alert').textContent).toBe(ERROR_CARREGA_FITXER);
  });
});

describe('T3a · teclat sobre el visor (RETALLADOR §1)', () => {
  test('el visor rep el focus i declara les dreceres', async () => {
    const vista = munta();
    await carregat(vista);
    const canvas = vista.container.querySelector('canvas');
    expect(canvas.getAttribute('tabindex')).toBe('0');
    /* Revisió adversarial (K7) · A aria-keyshortcuts el «+» separa modificadors
       (WAI-ARIA 1.2): la tecla més s'escriu «Plus». Cap testimoni pot ser un «+» sol. */
    expect(canvas.getAttribute('aria-keyshortcuts')).toBe('ArrowLeft ArrowRight ArrowUp ArrowDown Plus - Enter');
    expect(canvas.getAttribute('aria-keyshortcuts').split(' ')).not.toContain('+');
    canvas.focus();
    expect(document.activeElement).toBe(canvas);
  });

  test('les fletxes mouen el marc i s’anuncia la posició; + i − amplien i s’anuncia l’ampliació', async () => {
    const vista = munta();
    const zoom = await carregat(vista);
    const canvas = vista.container.querySelector('canvas');
    const anunci = vista.container.querySelector('[aria-live="polite"].sdp-nomes-lector');
    expect(anunci.textContent).toBe('');
    act(() => { fireEvent.keyDown(canvas, { key: 'ArrowRight' }); });
    expect(vista.getByLabelText('Posició horitzontal').value).toBe('55');
    expect(anunci.textContent).toBe('Posició 55 % des de l’esquerra i 50 % des de dalt');
    act(() => { fireEvent.keyDown(canvas, { key: '+' }); });
    expect(zoom.getAttribute('aria-valuetext')).toBe('110 %');
    expect(anunci.textContent).toBe('Ampliació 110 %');
    act(() => { fireEvent.keyDown(canvas, { key: '-' }); });
    expect(zoom.getAttribute('aria-valuetext')).toBe('100 %');
    // Una tecla aliena no fa res ni s'anuncia.
    const abans = anunci.textContent;
    const noTocada = fireEvent.keyDown(canvas, { key: 'a' });
    expect(noTocada).toBe(true);
    expect(anunci.textContent).toBe(abans);
  });

  test('Retorn sobre el visor desa; Escape el gestiona el diàleg (tanca)', async () => {
    const vista = munta();
    await carregat(vista);
    const canvas = vista.container.querySelector('canvas');
    await act(async () => { fireEvent.keyDown(canvas, { key: 'Enter' }); });
    expect(vista.onDesa).toHaveBeenCalledTimes(1);
    fireEvent(vista.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    expect(vista.onTanca).toHaveBeenCalledWith('esc');
  });

  test('amb Ctrl o Alt, la tecla és del navegador', async () => {
    const vista = munta();
    await carregat(vista);
    const canvas = vista.container.querySelector('canvas');
    act(() => { fireEvent.keyDown(canvas, { key: '+', ctrlKey: true }); });
    expect(vista.getByLabelText('Ampliació').getAttribute('aria-valuetext')).toBe('100 %');
  });
});
