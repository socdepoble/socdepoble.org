import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  AJUDA_CONSERVA_CAMERA, AJUDA_CONSERVA_DATA, AJUDA_CONSERVA_UBICACIO, AVIS_REVISA_EXIF, DialegEnquadrament, LLEGENDA_PRECISIO,
} from './DialegEnquadrament.jsx';
import {
  ERROR_EXIF_NO_CONSERVABLE, ERROR_EXIF_NO_CONSERVABLE_CAMERA, ETIQUETA_CONSERVA_CAMERA, ETIQUETA_CONSERVA_EXIF, exifPublicable,
} from './exifIncrustat.js';
import { configDeForma } from './useEnquadramentImatge.jsx';
import { TIPUS, dataOriginal, gpsTorre, jpegAmbExif, orientacio } from '../../../../tests/helpers/jpegProva.js';

/* Gauntlet 261016 (Bloc 1.2, mandat del Mestre, pla §0.1.3) · La casella
   «Conserva la ubicació i la data de la foto» del DialegEnquadrament: marcada
   de sèrie, només quan la foto en porta i el pare l'oferix, i la tria va a
   onDesa (metadades.exif). jsdom no té canvas: el carregador, l'exportador i
   el dibuix s'injecten; la lectura de l'EXIF és la de veres (exifPublicable)
   sobre JPEG sintètics, menys a les proves de temps, que l'injecten. */

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const fotoAmb = (opcions) => new File([jpegAmbExif(opcions)], 'arbre.jpg', { type: 'image/jpeg' });
const fotoGps = () => fotoAmb({ ifd0: [orientacio(1)], exif: dataOriginal('2017:05:14 10:22:33'), gps: gpsTorre() });
const fotoData = () => fotoAmb({ exif: dataOriginal('2017:05:14 10:22:33') });
const fotoNeta = () => new File(['x'], 'foto.png', { type: 'image/png' });
const CASELLA = { name: new RegExp(ETIQUETA_CONSERVA_EXIF) };
const MODES = [['T46 (la capçalera de les Notes)', false, 'Desar l’enquadrament'], ['senzill (el Perfil)', true, 'Guardar']];

function props({ senzill = false, font, ...resta } = {}) {
  const img = { amplada: 1000, alcada: 1000, tipus: 'image/jpeg', element: {}, allibera: vi.fn() };
  const cfg = senzill ? configDeForma('capcalera') : null;
  return {
    font,
    carregador: vi.fn(async () => img),
    exportador: vi.fn(async () => new File(['y'], 'enquadrament.jpg', { type: 'image/jpeg' })),
    dibuixant: vi.fn(() => true),
    onDesa: vi.fn(async () => true),
    onTanca: vi.fn(),
    ...(cfg ? {
      senzill: true, formatInicial: cfg.formatInicial, formats: cfg.formats, sortida: cfg.sortida(font), titol: cfg.titol, descripcio: cfg.descripcio,
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

describe('sense ofereixConservarExif · el diàleg d’abans (Llei del Píxel)', () => {
  test.each(MODES)('%s: cap casella i cap lectura, encara que la foto porte GPS; metadades sense `exif`', async (_mode, senzill, boto) => {
    const lectorExif = vi.fn(async () => ({ gps: { lat: 1, lng: 1 }, dataCaptura: null }));
    const vista = munta({ senzill, font: fotoGps(), lectorExif });
    await carregat();
    expect(vista.queryByRole('checkbox', CASELLA)).toBeNull();
    expect(lectorExif).not.toHaveBeenCalled();
    await desa(vista, boto);
    expect(metadadesDe(vista.onDesa)).toEqual({ geolocalitzacio: null, dataCaptura: null });
    expect('exif' in metadadesDe(vista.onDesa)).toBe(false);
  });
});

describe('amb ofereixConservarExif · la casella, marcada de sèrie', () => {
  /* P1-64 (pla 261028_1526; Mestre 261028, decisió 8) · ACTUALITZADA A POSTA:
     amb una ubicació, la tria porta també la precisió (l'exacta, de sèrie), i
     metadades, el punt i la data de la foto. */
  test.each(MODES)('%s: una foto amb GPS ensenya la casella marcada i l’avís de la ubicació; desar porta { conservaExif: true, original, precisio: exacta }, el punt i la data', async (_mode, senzill, boto) => {
    const font = fotoGps();
    const vista = munta({ senzill, font, ofereixConservarExif: true });
    const casella = await vista.findByRole('checkbox', CASELLA);
    expect(casella.checked).toBe(true);
    expect(vista.getByText(AJUDA_CONSERVA_UBICACIO)).toBeTruthy();
    expect(casella.getAttribute('aria-describedby')).toBeTruthy();
    await desa(vista, boto);
    expect(vista.onDesa).toHaveBeenCalledTimes(1);
    expect(metadadesDe(vista.onDesa)).toEqual({
      geolocalitzacio: { lat: 38.5919, lng: -0.4184, precisio: 'exacta', precisio_m: 1, origen: 'exif' },
      dataCaptura: '2017-05-14T10:22:33',
      exif: { conservaExif: true, original: font, precisio: 'exacta' },
    });
  });

  test.each(MODES)('%s: desmarcada, desar porta { conservaExif: false } (la foto ixirà neta)', async (_mode, senzill, boto) => {
    const vista = munta({ senzill, font: fotoGps(), ofereixConservarExif: true });
    fireEvent.click(await vista.findByRole('checkbox', CASELLA));
    expect(vista.getByRole('checkbox', CASELLA).checked).toBe(false);
    await desa(vista, boto);
    expect(metadadesDe(vista.onDesa).exif).toEqual({ conservaExif: false });
  });

  test('una foto amb data i sense GPS: l’avís parla de la data, no de la ubicació', async () => {
    const vista = munta({ font: fotoData(), ofereixConservarExif: true });
    await vista.findByRole('checkbox', CASELLA);
    expect(vista.getByText(AJUDA_CONSERVA_DATA)).toBeTruthy();
    expect(vista.queryByText(AJUDA_CONSERVA_UBICACIO)).toBeNull();
  });

  /* Gauntlet 261016 (Bloc B, P2) · ACTUALITZADA A POSTA. Abans, una adreça ja
     desada (el botó «Enquadrar» de la capçalera) no tenia mai casella ni
     lectura, i el re-enquadrament esborrava en silenci l'EXIF conservat a la
     primera pujada. Ara el diàleg llig l'EXIF del blob que ha obert el
     carregador (vegeu «una adreça ja desada», davall). Sense blob (un blob:
     directe, o un carregador que no en torna), continua sense res per llegir. */
  test('una foto sense EXIF, o una adreça sense cap blob per llegir: cap casella, i metadades sense `exif`', async () => {
    const vista = munta({ font: fotoNeta(), ofereixConservarExif: true });
    await carregat();
    await carregat();
    expect(vista.queryByRole('checkbox')).toBeNull();
    await desa(vista, 'Desar l’enquadrament');
    expect('exif' in metadadesDe(vista.onDesa)).toBe(false);
    cleanup();
    const lectorExif = vi.fn();
    const url = munta({ font: '/assets/h.webp', ofereixConservarExif: true, lectorExif });
    await carregat();
    expect(url.queryByRole('checkbox')).toBeNull();
    expect(lectorExif).not.toHaveBeenCalled();
  });

  test('la casella la fa la Pedra Seca (Casella), al peu dels controls, en els dos modes', async () => {
    const t46 = munta({ font: fotoGps(), ofereixConservarExif: true });
    const casella = await t46.findByRole('checkbox', CASELLA);
    expect(casella.closest('.sdp-casella')).toBeTruthy();
    expect(casella.closest('.sdp-enquadrament__controls')).toBeTruthy();
    expect(document.querySelector('[style]')).toBeNull();
    cleanup();
    const senzill = munta({ senzill: true, font: fotoGps(), ofereixConservarExif: true });
    const casellaSenzilla = await senzill.findByRole('checkbox', CASELLA);
    // Davall de la fila de zoom.
    const zoom = senzill.getByLabelText('Ampliació').closest('.sdp-enquadrament__zoom');
    expect(zoom.compareDocumentPosition(casellaSenzilla) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

/* Gauntlet 261016 (Codex, relleu 02:26) · La lectura és la de veres
   (exifPublicable sobre el TIFF del JPEG sintètic): una càmera sense GPS ni
   data també té un EXIF publicable, i un EXIF que no es pot conservar es diu
   abans de desar, no ix net d'amagat. */
describe('Codex 02:26 · la càmera sense GPS ni data, i l’EXIF que no es pot conservar', () => {
  const MARCA_MODEL = [{ tag: 0x010f, tipus: TIPUS.ASCII, valors: 'Canon' }, { tag: 0x0110, tipus: TIPUS.ASCII, valors: 'EOS R6' }];
  const fotoCamera = () => fotoAmb({ ifd0: [orientacio(6), ...MARCA_MODEL] });
  /* L'Exif apunta fora del bloc: el GPS es llig, però el bloc no es pot conservar. */
  const fotoTrencada = (opcions = { exif: dataOriginal('2017:05:14 10:22:33'), gps: gpsTorre() }) => fotoAmb({ ...opcions, punterExif: 0x7fffffff });
  const CASELLA_CAMERA = { name: new RegExp(ETIQUETA_CONSERVA_CAMERA) };

  /* Gauntlet 261016 (Bloc B, P2) · ACTUALITZADA A POSTA: l'avís ja no diu
     només «les dades de la càmera», sinó quines s'hi publiquen (la marca i el
     model). Sense cap dada que identifique la càmera, l'avís és el d'abans. */
  test.each(MODES)('%s: marca, model i orientació sense GPS ni data: la casella de la càmera, marcada; desar porta { conservaExif: true, original }', async (_mode, senzill, boto) => {
    const font = fotoCamera();
    const vista = munta({ senzill, font, ofereixConservarExif: true });
    const casella = await vista.findByRole('checkbox', CASELLA_CAMERA);
    expect(casella.checked).toBe(true);
    expect(vista.getByText('Si la deixes marcada, les dades de la càmera es publicaran amb la foto: la marca i el model.')).toBeTruthy();
    expect(vista.queryByRole('checkbox', CASELLA)).toBeNull();
    await desa(vista, boto);
    expect(metadadesDe(vista.onDesa).exif).toEqual({ conservaExif: true, original: font });
  });

  test('desmarcada, la foto de la càmera ix neta: { conservaExif: false }', async () => {
    const vista = munta({ font: fotoCamera(), ofereixConservarExif: true });
    fireEvent.click(await vista.findByRole('checkbox', CASELLA_CAMERA));
    await desa(vista, 'Desar l’enquadrament');
    expect(metadadesDe(vista.onDesa).exif).toEqual({ conservaExif: false });
  });

  test.each(MODES)('%s: un EXIF que no es pot conservar: la casella, marcada, ho diu; desar-la marcada no desa i avisa; desmarcada, desa neta', async (_mode, senzill, boto) => {
    const vista = munta({ senzill, font: fotoTrencada(), ofereixConservarExif: true });
    const casella = await vista.findByRole('checkbox', CASELLA);
    expect(casella.checked).toBe(true);
    expect(vista.getByText(ERROR_EXIF_NO_CONSERVABLE)).toBeTruthy(); // l'ajuda de la casella, abans de desar
    await desa(vista, boto);
    expect(vista.onDesa).not.toHaveBeenCalled();
    expect(vista.getByRole('alert').textContent).toContain(ERROR_EXIF_NO_CONSERVABLE);
    fireEvent.click(casella);
    await desa(vista, boto);
    expect(metadadesDe(vista.onDesa).exif).toEqual({ conservaExif: false });
  });

  test('un EXIF de càmera que no es pot conservar: l’avís parla de la càmera, amb la seua etiqueta', async () => {
    const vista = munta({ font: fotoTrencada({ ifd0: MARCA_MODEL, exif: dataOriginal('2017:05:14 10:22:33') }), ofereixConservarExif: true });
    await vista.findByRole('checkbox', CASELLA_CAMERA);
    expect(vista.getByText(ERROR_EXIF_NO_CONSERVABLE_CAMERA)).toBeTruthy();
  });
});

/* Gauntlet 261016 (Bloc B, privacitat i consentiment de l'EXIF publicable) ·
   L'etiqueta i l'avís diuen el que porta el bloc que es publicarà, i el
   re-enquadrament d'una adreça ja desada no esborra en silenci l'EXIF que s'hi
   va conservar. La lectura és la de veres (exifPublicable). */
describe('Bloc B · el que es publica, dit, i el re-enquadrament d’una adreça', () => {
  const texte = (tag, valors) => ({ tag, tipus: TIPUS.ASCII, valors });
  const IDENTITAT = [texte(0x010f, 'NIKON'), texte(0x0110, 'D850')];
  const SERIE = texte(0xa431, '0123456789');
  const AMPLIA = (vista) => act(async () => { fireEvent.change(vista.getByLabelText('Ampliació'), { target: { value: '2' } }); });

  test('P2 · un GPS IFD que el lector estricte no entén (sense N/S ni E/W): la casella i l’avís diuen la ubicació, perquè es publica', async () => {
    const font = fotoAmb({ ifd0: IDENTITAT.slice(0, 1), gps: gpsTorre().filter((e) => e.tag !== 1 && e.tag !== 3) });
    const vista = munta({ font, ofereixConservarExif: true });
    const casella = await vista.findByRole('checkbox', CASELLA);
    expect(casella.checked).toBe(true);
    expect(vista.getByText(new RegExp(`^${AJUDA_CONSERVA_UBICACIO}`))).toBeTruthy();
  });

  test.each(MODES)('%s · P2 · amb la ubicació, l’avís diu també les dades que identifiquen la càmera: marca, model i número de sèrie', async (_mode, senzill) => {
    const font = fotoAmb({ ifd0: [orientacio(1), ...IDENTITAT], exif: [...dataOriginal('2017:05:14 10:22:33'), SERIE], gps: gpsTorre() });
    const vista = munta({ senzill, font, ofereixConservarExif: true });
    expect((await vista.findByRole('checkbox', CASELLA)).checked).toBe(true); // la tria de sèrie no canvia (pla §0.1.3)
    expect(vista.getByText(`${AJUDA_CONSERVA_UBICACIO} També es publicaran les dades de la càmera: la marca, el model i el número de sèrie.`)).toBeTruthy();
  });

  test('P2 · sense cap dada que identifique la càmera (només l’orientació), l’avís de la càmera, el d’abans', async () => {
    const vista = munta({ font: fotoAmb({ ifd0: [orientacio(6)] }), ofereixConservarExif: true });
    await vista.findByRole('checkbox', { name: new RegExp(ETIQUETA_CONSERVA_CAMERA) });
    expect(vista.getByText(AJUDA_CONSERVA_CAMERA)).toBeTruthy();
  });

  /* El carregador de veres (carregaImatge) torna el blob que ha baixat de l'adreça: ací, injectat. */
  const ambBlob = (blob) => vi.fn(async () => ({ amplada: 1000, alcada: 1000, tipus: 'image/webp', element: {}, allibera: vi.fn(), blob }));

  test.each(MODES)('%s · P2 · una adreça ja desada: llig l’EXIF del blob que ha obert, ensenya la casella marcada, i la pujada rep el blob com a original', async (_mode, senzill, boto) => {
    const blob = new Blob([jpegAmbExif({ exif: dataOriginal('2017:05:14 10:22:33'), gps: gpsTorre() })], { type: 'image/webp' });
    const lectorExif = vi.fn(exifPublicable);
    const vista = munta({ senzill, font: '/assets/h.webp', carregador: ambBlob(blob), ofereixConservarExif: true, lectorExif });
    const casella = await vista.findByRole('checkbox', CASELLA);
    expect(casella.checked).toBe(true);
    expect(lectorExif.mock.calls).toEqual([[blob]]);
    await AMPLIA(vista);
    await desa(vista, boto);
    expect(metadadesDe(vista.onDesa).exif).toEqual({ conservaExif: true, original: blob, precisio: 'exacta' });
  });

  test('P2 · una adreça desada sencera (sense ampliar): marcada, no hi ha res a desar i es tanca (l’EXIF queda on era); desmarcada, es desa neta', async () => {
    const blob = new Blob([jpegAmbExif({ gps: gpsTorre() })], { type: 'image/webp' });
    const marcada = munta({ font: '/assets/h.webp', carregador: ambBlob(blob), ofereixConservarExif: true });
    await marcada.findByRole('checkbox', CASELLA);
    await desa(marcada, 'Desar l’enquadrament');
    expect(marcada.onDesa).not.toHaveBeenCalled();
    expect(marcada.onTanca).toHaveBeenCalledWith('boto');
    cleanup();
    const desmarcada = munta({ font: '/assets/h.webp', carregador: ambBlob(blob), ofereixConservarExif: true });
    fireEvent.click(await desmarcada.findByRole('checkbox', CASELLA));
    await desa(desmarcada, 'Desar l’enquadrament');
    expect(desmarcada.exportador).toHaveBeenCalledTimes(1);
    expect(desmarcada.onDesa).toHaveBeenCalledTimes(1);
    expect(desmarcada.onDesa.mock.calls[0][0]).toBeInstanceOf(File);
    expect(metadadesDe(desmarcada.onDesa).exif).toEqual({ conservaExif: false });
  });

  test('P2 · una adreça el blob de la qual no porta EXIF: cap casella, i es desa com abans', async () => {
    const vista = munta({ font: '/assets/h.webp', carregador: ambBlob(new Blob(['x'], { type: 'image/webp' })), ofereixConservarExif: true });
    await carregat();
    await carregat();
    expect(vista.queryByRole('checkbox')).toBeNull();
    await AMPLIA(vista);
    await desa(vista, 'Desar l’enquadrament');
    expect('exif' in metadadesDe(vista.onDesa)).toBe(false);
  });
});

describe('el temps de la lectura', () => {
  function diferida() {
    let resol;
    const promesa = new Promise((r) => { resol = r; });
    return { promesa, resol };
  }

  /* Gauntlet 261016 (Bloc B, P3) · ACTUALITZADA A POSTA. Abans, qui desava
     abans que acabara la lectura publicava la ubicació amb la tria de sèrie
     sense haver vist mai la casella ni el seu avís. Ara s'espera la lectura i,
     si porta un EXIF per a la casella, no es desa: la casella apareix (marcada
     de sèrie), un avís demana tornar a desar, i és el segon clic el que desa. */
  test.each(MODES)('%s: si es desa abans que acabe la lectura i la foto porta EXIF, no es desa: ix la casella marcada i l’avís, i el segon clic desa', async (_mode, senzill, boto) => {
    const lectura = diferida();
    const font = fotoGps();
    const vista = munta({ senzill, font, ofereixConservarExif: true, lectorExif: () => lectura.promesa });
    await carregat();
    expect(vista.queryByRole('checkbox', CASELLA)).toBeNull();
    await desa(vista, boto);
    expect(vista.onDesa).not.toHaveBeenCalled();
    await act(async () => { lectura.resol({ gps: { lat: 38.59, lng: -0.42 }, dataCaptura: null }); });
    expect(vista.onDesa).not.toHaveBeenCalled();
    expect(vista.getByRole('checkbox', CASELLA).checked).toBe(true);
    expect(vista.getByRole('alert').textContent).toContain(AVIS_REVISA_EXIF);
    await desa(vista, boto);
    expect(vista.onDesa).toHaveBeenCalledTimes(1);
    expect(metadadesDe(vista.onDesa).exif).toEqual({ conservaExif: true, original: font, precisio: 'exacta' });
  });

  test('si es desa abans que acabe la lectura i la foto no porta res per a la casella, es desa al primer clic, com abans', async () => {
    const lectura = diferida();
    const vista = munta({ font: fotoGps(), ofereixConservarExif: true, lectorExif: () => lectura.promesa });
    await carregat();
    await desa(vista, 'Desar l’enquadrament');
    expect(vista.onDesa).not.toHaveBeenCalled();
    await act(async () => { lectura.resol(null); });
    expect(vista.onDesa).toHaveBeenCalledTimes(1);
    expect('exif' in metadadesDe(vista.onDesa)).toBe(false);
    expect(vista.queryByRole('alert')).toBeNull();
  });

  test('una lectura tardana d’una foto anterior no pinta cap casella a la nova', async () => {
    const lectures = new Map();
    const lectorExif = (f) => {
      const d = diferida();
      lectures.set(f.name, d);
      return d.promesa;
    };
    const vella = new File(['a'], 'vella.jpg', { type: 'image/jpeg' });
    const nova = new File(['b'], 'nova.jpg', { type: 'image/jpeg' });
    const p = props({ font: vella, ofereixConservarExif: true, lectorExif });
    const vista = render(<DialegEnquadrament {...p} />);
    await carregat();
    vista.rerender(<DialegEnquadrament {...p} font={nova} />);
    await carregat();
    await act(async () => { lectures.get('vella.jpg').resol({ gps: { lat: 38.59, lng: -0.42 }, dataCaptura: null }); });
    await act(async () => { lectures.get('nova.jpg').resol(null); });
    expect(vista.queryByRole('checkbox', CASELLA)).toBeNull();
    await desa(vista, 'Desar l’enquadrament');
    expect('exif' in p.onDesa.mock.calls[0][2]).toBe(false);
  });
});

/* P1-64 (pla 261028_1526 §3.1.1; Mestre 261028, decisió 8) · Amb la casella
   marcada i una ubicació a la foto, les píndoles de la precisió (l'exacta de
   sèrie) i la línia del que es desarà; la tria va a metadades (el camp) i a
   metadades.exif.precisio (el fitxer, que arrodonix la compressió). */
describe('P1-64 · la precisió de la ubicació', () => {
  const PINDOLES = { name: LLEGENDA_PRECISIO };

  test.each(MODES)('%s: les píndoles només ixen amb la casella marcada i una ubicació; l’exacta, de sèrie', async (_mode, senzill) => {
    const vista = munta({ senzill, font: fotoGps(), ofereixConservarExif: true });
    await vista.findByRole('checkbox', CASELLA);
    const grup = vista.getByRole('radiogroup', PINDOLES);
    expect(within(grup).getAllByRole('radio').map((r) => [r.value, r.checked])).toEqual([['exacta', true], ['100m', false], ['poble', false]]);
    expect(vista.getByText('Es desarà: 38.59190, -0.41840 (exacta). El punt de la foto, a un metre.')).toBeTruthy();
    fireEvent.click(vista.getByRole('checkbox', CASELLA));
    expect(vista.queryByRole('radiogroup', PINDOLES)).toBeNull();
    expect(vista.queryByText(/^Es desarà:/)).toBeNull();
  });

  test('una foto amb data i sense ubicació: la casella, sense píndoles', async () => {
    const vista = munta({ font: fotoData(), ofereixConservarExif: true });
    await vista.findByRole('checkbox', CASELLA);
    expect(vista.queryByRole('radiogroup', PINDOLES)).toBeNull();
  });

  test.each(MODES)('%s: triar «Uns 100 m» arrodonix el punt i la tria va a la pujada', async (_mode, senzill, boto) => {
    const font = fotoGps();
    const vista = munta({ senzill, font, ofereixConservarExif: true });
    await vista.findByRole('checkbox', CASELLA);
    fireEvent.click(vista.getByRole('radio', { name: 'Uns 100 m' }));
    expect(vista.getByText('Es desarà: 38.592, -0.418 (uns 100 m). Es veu el paratge, no el punt exacte.')).toBeTruthy();
    await desa(vista, boto);
    expect(metadadesDe(vista.onDesa)).toEqual({
      geolocalitzacio: { lat: 38.592, lng: -0.418, precisio: '100m', precisio_m: 100, origen: 'exif' },
      dataCaptura: '2017-05-14T10:22:33',
      exif: { conservaExif: true, original: font, precisio: '100m' },
    });
  });

  test('desmarcada, res de la ubicació: { conservaExif: false } i el punt a null', async () => {
    const vista = munta({ font: fotoGps(), ofereixConservarExif: true });
    fireEvent.click(await vista.findByRole('checkbox', CASELLA));
    await desa(vista, 'Desar l’enquadrament');
    expect(metadadesDe(vista.onDesa)).toEqual({ geolocalitzacio: null, dataCaptura: null, exif: { conservaExif: false } });
  });

  test('una foto nova torna a l’exacta', async () => {
    const p = props({ font: fotoGps(), ofereixConservarExif: true });
    const vista = render(<DialegEnquadrament {...p} />);
    await vista.findByRole('checkbox', CASELLA);
    fireEvent.click(vista.getByRole('radio', { name: 'Només el poble' }));
    vista.rerender(<DialegEnquadrament {...p} font={fotoGps()} />);
    await carregat();
    await vista.findByRole('checkbox', CASELLA);
    expect(vista.getByRole('radio', { name: 'Exacta' }).checked).toBe(true);
  });
});
