import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { AVIS_GPS_ELIMINAT_PERFIL, AVIS_REVISA_EXIF, DialegEnquadrament } from './DialegEnquadrament.jsx';
import { exifPublicable } from './exifIncrustat.js';
import { FORMES, configDeForma } from './useEnquadramentImatge.jsx';
import { TIPUS, dataOriginal, gpsTorre, jpegAmbExif, orientacio } from '../../../../tests/helpers/jpegProva.js';

/* P1-64 (pla 261028_1526 §3.1.1; Mestre 261028, decisió 7) · Les fotos
   d'IDENTITAT (l'avatar de totes les menes i la capçalera d'una persona)
   pugen sempre netes, sense casella, i el diàleg diu l'avís literal del Mestre
   només si la foto portava GPS de veres. jsdom no té canvas: el carregador,
   l'exportador i el dibuix s'injecten; la lectura de l'EXIF és la de veres
   (exifPublicable) sobre JPEG sintètics, menys a la prova del temps. */

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const fotoAmb = (opcions) => new File([jpegAmbExif(opcions)], 'jo.jpg', { type: 'image/jpeg' });
const fotoGps = () => fotoAmb({ ifd0: [orientacio(1)], exif: dataOriginal('2024:06:29 12:00:00'), gps: gpsTorre() });
const fotoData = () => fotoAmb({ exif: dataOriginal('2024:06:29 12:00:00') });
const fotoCamera = () => fotoAmb({ ifd0: [{ tag: 0x010f, tipus: TIPUS.ASCII, valors: 'samsung' }, { tag: 0x0110, tipus: TIPUS.ASCII, valors: 'SM-A546B' }] });
const MODES = [['T46 (DetallAjust)', false, 'Desar l’enquadrament'], ['senzill (la fitxa)', true, 'Guardar']];

function props({ senzill = false, font, carregador, ...resta } = {}) {
  const img = { amplada: 1000, alcada: 1000, tipus: 'image/jpeg', element: {}, allibera: vi.fn() };
  const cfg = senzill ? configDeForma('avatar') : null;
  return {
    font,
    // El T46 de l'avatar (useEnquadramentAvatar) sempre lliura el retall a 400 × 400.
    sortida: { ampladaMaxima: 400, format: 'image/jpeg', exacta: { amplada: 400, alcada: 400 } },
    carregador: carregador || vi.fn(async () => img),
    exportador: vi.fn(async () => new File(['y'], 'enquadrament.jpg', { type: 'image/jpeg' })),
    dibuixant: vi.fn(() => true),
    onDesa: vi.fn(async () => true),
    onTanca: vi.fn(),
    ...(cfg ? {
      senzill: true, mascara: cfg.mascara, formatInicial: cfg.formatInicial, formats: cfg.formats, sortida: cfg.sortida(font),
      titol: cfg.titol, descripcio: cfg.descripcio,
    } : null),
    ...resta,
  };
}
function munta(opcions) {
  const p = props(opcions);
  const vista = render(<DialegEnquadrament {...p} />);
  return { ...vista, ...p, p };
}
const carregat = () => act(async () => {});
const desa = (vista, nom) => act(async () => { fireEvent.click(within(vista.getByRole('dialog')).getByRole('button', { name: nom })); });
const metadadesDe = (onDesa) => onDesa.mock.calls[0][2];
/* El DOM del diàleg sense els id de useId, que canvien a cada muntatge. */
const domDe = (vista) => vista.getByRole('dialog').innerHTML.replace(/«[^»]*»|:r[0-9a-z]+:|_r_[0-9a-z]+_/g, 'ID');

describe('P1-64 · la configuració de les formes d’identitat', () => {
  test('l’avatar no conserva l’EXIF i avisa; la capçalera, només amb identitat; el logotip, com sempre', () => {
    expect(FORMES.avatar.conservaExif).toBe(false);
    expect(configDeForma('avatar')).toMatchObject({ conservaExif: false, avisGpsEliminat: true });
    expect(configDeForma('capcalera')).toMatchObject({ conservaExif: true, avisGpsEliminat: false });
    expect(configDeForma('capcalera', { identitat: true })).toMatchObject({ conservaExif: false, avisGpsEliminat: true });
    expect(configDeForma('logotip')).toMatchObject({ conservaExif: false, avisGpsEliminat: false });
  });
});

describe('P1-64 · avisaGpsEliminat', () => {
  test.each(MODES)('%s: amb GPS, l’avís literal i cap casella; desar porta { conservaExif: false } i gpsEliminat', async (_mode, senzill, boto) => {
    const vista = munta({ senzill, font: fotoGps(), avisaGpsEliminat: true });
    expect(await vista.findByText(AVIS_GPS_ELIMINAT_PERFIL)).toBeTruthy();
    expect(AVIS_GPS_ELIMINAT_PERFIL).toBe('🔒 Per la teua privacitat, s\'han eliminat les dades GPS de la foto de perfil');
    expect(vista.queryByRole('checkbox')).toBeNull();
    expect(vista.queryByRole('radiogroup', { name: 'Precisió de la ubicació' })).toBeNull();
    await desa(vista, boto);
    expect(vista.exportador).toHaveBeenCalledTimes(1);
    expect(metadadesDe(vista.onDesa)).toEqual({ geolocalitzacio: null, dataCaptura: null, exif: { conservaExif: false }, gpsEliminat: true });
  });

  test.each([['només la data', fotoData], ['només la càmera', fotoCamera]])('%s: cap avís (no s’ha eliminat cap GPS), cap casella, i gpsEliminat false', async (_cas, foto) => {
    const vista = munta({ font: foto(), avisaGpsEliminat: true });
    await carregat();
    await carregat();
    expect(vista.queryByText(AVIS_GPS_ELIMINAT_PERFIL)).toBeNull();
    expect(vista.queryByRole('checkbox')).toBeNull();
    await desa(vista, 'Desar l’enquadrament');
    expect(metadadesDe(vista.onDesa)).toEqual({ geolocalitzacio: null, dataCaptura: null, exif: { conservaExif: false }, gpsEliminat: false });
  });

  test('mana sobre ofereixConservarExif: cap casella encara que el pare l’oferisca', async () => {
    const vista = munta({ font: fotoGps(), avisaGpsEliminat: true, ofereixConservarExif: true });
    expect(await vista.findByText(AVIS_GPS_ELIMINAT_PERFIL)).toBeTruthy();
    expect(vista.queryByRole('checkbox')).toBeNull();
  });

  test.each(MODES)('%s · Llei del Píxel: sense la prop, el DOM és el de sempre (cap lectura); amb la prop i una foto sense GPS, també', async (_mode, senzill) => {
    const lectorExif = vi.fn(exifPublicable);
    const abans = munta({ senzill, font: fotoGps(), lectorExif });
    await carregat();
    await carregat();
    const html = domDe(abans);
    expect(lectorExif).not.toHaveBeenCalled();
    cleanup();
    const ambFals = munta({ senzill, font: fotoGps(), avisaGpsEliminat: false });
    await carregat();
    await carregat();
    expect(domDe(ambFals)).toBe(html);
    cleanup();
    const senseGps = munta({ senzill, font: fotoData(), avisaGpsEliminat: true });
    await carregat();
    await carregat();
    expect(domDe(senseGps)).toBe(html);
  });

  test('desar abans que acabe la lectura espera la lectura, sense AVIS_REVISA_EXIF, i desa al primer clic', async () => {
    let resol;
    const lectura = new Promise((r) => { resol = r; });
    const vista = munta({ font: fotoGps(), avisaGpsEliminat: true, lectorExif: () => lectura });
    await carregat();
    await desa(vista, 'Desar l’enquadrament');
    expect(vista.onDesa).not.toHaveBeenCalled();
    await act(async () => { resol({ gps: { lat: 38.59, lng: -0.42 }, dataCaptura: null }); });
    expect(vista.onDesa).toHaveBeenCalledTimes(1);
    expect(metadadesDe(vista.onDesa).gpsEliminat).toBe(true);
    expect(vista.queryByRole('alert')).toBeNull();
    expect(vista.queryByText(AVIS_REVISA_EXIF)).toBeNull();
  });

  /* El carregador de veres (carregaImatge) torna el blob que ha baixat de l'adreça: ací, injectat. */
  const ambBlob = (blob) => vi.fn(async () => ({ amplada: 1000, alcada: 1000, tipus: 'image/jpeg', element: {}, allibera: vi.fn(), blob }));

  test('una adreça ja desada i sencera AMB GPS no es dona per bona: es torna a retallar i ix neta', async () => {
    const blob = new Blob([jpegAmbExif({ gps: gpsTorre() })], { type: 'image/jpeg' });
    const vista = munta({ font: '/assets/avatar.jpg', carregador: ambBlob(blob), avisaGpsEliminat: true });
    expect(await vista.findByText(AVIS_GPS_ELIMINAT_PERFIL)).toBeTruthy();
    await desa(vista, 'Desar l’enquadrament');
    expect(vista.onTanca).not.toHaveBeenCalled();
    expect(vista.exportador).toHaveBeenCalledTimes(1);
    expect(metadadesDe(vista.onDesa)).toMatchObject({ exif: { conservaExif: false }, gpsEliminat: true });
  });

  test('una adreça ja desada i sencera sense GPS: no hi ha res a desar i es tanca, com sempre', async () => {
    const blob = new Blob([jpegAmbExif({ exif: dataOriginal('2024:06:29 12:00:00') })], { type: 'image/jpeg' });
    const vista = munta({ font: '/assets/avatar.jpg', carregador: ambBlob(blob), avisaGpsEliminat: true });
    await carregat();
    await carregat();
    await desa(vista, 'Desar l’enquadrament');
    expect(vista.onDesa).not.toHaveBeenCalled();
    expect(vista.onTanca).toHaveBeenCalledWith('boto');
  });
});
