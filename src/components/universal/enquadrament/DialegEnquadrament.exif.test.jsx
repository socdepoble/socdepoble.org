import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  AJUDA_CONSERVA_CAMERA, AJUDA_CONSERVA_DATA, AJUDA_TAMBE_DATA, AVIS_REVISA_EXIF, AVIS_REVISA_LLOC, AVIS_UBICACIO_AMAGADA, AVIS_UBICACIO_CONSERVADA,
  CasellaExif, DialegEnquadrament,
  ETIQUETA_AMAGA_LLOC, avisDeRebuigDeLaTria, ETIQUETA_PUBLICA_SENSE_GEOLOCALITZACIO, LLEGENDA_PRECISIO,
} from './DialegEnquadrament.jsx';
import {
  ERROR_EXIF_NO_CONSERVABLE, ERROR_EXIF_NO_CONSERVABLE_CAMERA, ETIQUETA_CONSERVA_CAMERA, ETIQUETA_CONSERVA_EXIF, analitzaTiff, exifPublicable,
  extreuTiff, preparaTiffTriat,
} from './exifIncrustat.js';
import { configDeForma } from './useEnquadramentImatge.jsx';
import { TEXTOS_AMAGA_LLOC } from './i18nAmagaLloc.js';
import { ERROR_PRESSUPOST_EXIF } from '../../../utils/pujadaImatge.js';
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
/* v1.2.23 · IDEA-331 (ordre del Mestre 261123) · REAPUNTADES A POSTA les proves
   d'una foto AMB UBICACIÓ: la casella «Conserva la ubicació i la data de la
   foto» MARCADA de sèrie és ara l'interruptor «Amaga el lloc» APAGAT de sèrie
   (la mateixa Casella amb role="switch" i checked = !conservaExif), amb l'avís
   literal del Mestre (AVIS_UBICACIO_CONSERVADA) en lloc de «Si la deixes
   marcada, la ubicació es publicarà amb la foto». L'invariant de cada prova és
   el mateix: de sèrie es conserva (switch.checked === false ⇔ casella.checked
   === true) i un sol toc ho lleva ({ conservaExif: false }). Les fotos sense
   ubicació (data, càmera) i les que no es poden conservar mantenen la casella
   i les seues proves, lletra per lletra. Les guardes de «cap casella» de les
   fotos amb GPS miren ara també l'interruptor (si no, passarien soles). */
const INTERRUPTOR = { name: new RegExp(ETIQUETA_AMAGA_LLOC) };
/* v1.2.23 · IDEA-331 (ordre del Mestre 261123) · Carril T · Una foto amb ubicació I DATA (fotoGps, mobil):
   l'interruptor ja no nomena la data, i la data es publica (metadades.dataCaptura i el bloc). La descripció de
   l'interruptor continua sent el literal del Mestre tot sol, i una línia a banda, just davall, diu
   «També es publicarà la data de la foto.» (liniaDeLaData). Una foto amb ubicació i sense data no porta eixa línia
   (CasellaExif.ubicacioPerDefecte.idea331.test.jsx). I qui desa abans que acabe la lectura d'una foto amb ubicació
   llig AVIS_REVISA_LLOC, que nomena l'interruptor; la casella d'una foto sense ubicació continua amb
   AVIS_REVISA_EXIF («Revisa la casella»). */
const TAMBE_DATA = 'També es publicarà la data de la foto.';
/* v1.2.23 · IDEA-331 (Gauntlet R1, pendent T) · La línia de la data: un <p> d'ajuda, el germà just darrere de la casella de l'interruptor, fora de la
   seua descripció (aria-describedby), amb el text exacte. */
function liniaDeLaData(vista) {
  const interruptor = vista.getByRole('switch', INTERRUPTOR);
  const linia = vista.getByText(TAMBE_DATA);
  expect(linia.tagName).toBe('P');
  expect(linia.previousElementSibling).toBe(interruptor.closest('.sdp-casella'));
  expect(document.getElementById(interruptor.getAttribute('aria-describedby')).contains(linia)).toBe(false);
  return linia;
}
const REVISA_LLOC = 'Esta foto porta dades que es publicarien amb ella. Revisa «Amaga el lloc» i torna a desar.';
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
    expect(vista.queryByRole('switch', INTERRUPTOR)).toBeNull();
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
  test.each(MODES)('%s: una foto amb GPS ensenya l’interruptor «Amaga el lloc» apagat i l’avís del Mestre; desar porta { conservaExif: true, original, precisio: exacta }, el punt i la data', async (_mode, senzill, boto) => {
    const font = fotoGps();
    const vista = munta({ senzill, font, ofereixConservarExif: true });
    const interruptor = await vista.findByRole('switch', INTERRUPTOR);
    expect(interruptor.checked).toBe(false);
    expect(vista.queryByRole('checkbox', CASELLA)).toBeNull();
    expect(AJUDA_TAMBE_DATA).toBe(TAMBE_DATA);
    expect(vista.getByText(AVIS_UBICACIO_CONSERVADA)).toBeTruthy();
    expect(document.getElementById(interruptor.getAttribute('aria-describedby')).textContent).toBe(AVIS_UBICACIO_CONSERVADA);
    expect(liniaDeLaData(vista)).toBeTruthy();
    expect(interruptor.getAttribute('aria-label')).toBe(`${ETIQUETA_AMAGA_LLOC} (${ETIQUETA_PUBLICA_SENSE_GEOLOCALITZACIO})`);
    expect(interruptor.getAttribute('title')).toBe(ETIQUETA_PUBLICA_SENSE_GEOLOCALITZACIO);
    await desa(vista, boto);
    expect(vista.onDesa).toHaveBeenCalledTimes(1);
    expect(metadadesDe(vista.onDesa)).toEqual({
      geolocalitzacio: { lat: 38.5919, lng: -0.4184, precisio: 'exacta', precisio_m: 1, origen: 'exif' },
      dataCaptura: '2017-05-14T10:22:33',
      exif: { conservaExif: true, original: font, precisio: 'exacta' },
    });
  });

  test.each(MODES)('%s: «Amaga el lloc» encés (un toc), desar porta { conservaExif: false } (la foto ixirà neta)', async (_mode, senzill, boto) => {
    const vista = munta({ senzill, font: fotoGps(), ofereixConservarExif: true });
    fireEvent.click(await vista.findByRole('switch', INTERRUPTOR));
    expect(vista.getByRole('switch', INTERRUPTOR).checked).toBe(true);
    expect(vista.getByText(AVIS_UBICACIO_AMAGADA)).toBeTruthy();
    expect(vista.queryByText(AVIS_UBICACIO_CONSERVADA)).toBeNull();
    /* v1.2.23 · IDEA-331 (Gauntlet R1) · Pendent T de la ronda 2 · queryByText només troba un
       element amb el text sencer: l'avís del Mestre tampoc no pot quedar dins d'un text més llarg. */
    expect(vista.container.textContent).not.toContain(AVIS_UBICACIO_CONSERVADA);
    expect(vista.queryByText(new RegExp(TAMBE_DATA))).toBeNull();
    await desa(vista, boto);
    expect(metadadesDe(vista.onDesa).exif).toEqual({ conservaExif: false });
  });

  test('una foto amb data i sense GPS: l’avís parla de la data, no de la ubicació', async () => {
    const vista = munta({ font: fotoData(), ofereixConservarExif: true });
    await vista.findByRole('checkbox', CASELLA);
    expect(vista.getByText(AJUDA_CONSERVA_DATA)).toBeTruthy();
    expect(vista.queryByText(AVIS_UBICACIO_CONSERVADA)).toBeNull();
    expect(vista.queryByRole('switch', INTERRUPTOR)).toBeNull();
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
    expect(vista.queryByRole('switch')).toBeNull();
    await desa(vista, 'Desar l’enquadrament');
    expect('exif' in metadadesDe(vista.onDesa)).toBe(false);
    cleanup();
    const lectorExif = vi.fn();
    const url = munta({ font: '/assets/h.webp', ofereixConservarExif: true, lectorExif });
    await carregat();
    expect(url.queryByRole('checkbox')).toBeNull();
    expect(lectorExif).not.toHaveBeenCalled();
  });

  test('la casella (l’interruptor, amb ubicació) la fa la Pedra Seca (Casella), al peu dels controls, en els dos modes', async () => {
    const t46 = munta({ font: fotoGps(), ofereixConservarExif: true });
    const casella = await t46.findByRole('switch', INTERRUPTOR);
    expect(casella.closest('.sdp-casella')).toBeTruthy();
    expect(casella.closest('.sdp-enquadrament__controls')).toBeTruthy();
    expect(document.querySelector('[style]')).toBeNull();
    cleanup();
    const senzill = munta({ senzill: true, font: fotoGps(), ofereixConservarExif: true });
    const casellaSenzilla = await senzill.findByRole('switch', INTERRUPTOR);
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
    expect(vista.queryByRole('switch', INTERRUPTOR)).toBeNull();
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
    // v1.2.23 · IDEA-331 · Un EXIF que no es pot conservar no promet conservar el lloc: la casella d'abans, cap interruptor.
    expect(vista.queryByRole('switch', INTERRUPTOR)).toBeNull();
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

/* v1.2.23 · L2-03 (Gauntlet R1) · Amb una ubicació que es pot conservar, el control que es veu és l'interruptor
   «Amaga el lloc». Si la pujada rebutja la foto perquè la ubicació i la data no hi caben (ERROR_PRESSUPOST_EXIF) o
   no s'hi poden posar (ERROR_EXIF_NO_CONSERVABLE), l'avís no pot demanar que es desmarque una casella que no hi
   és: diu que s'encenga l'interruptor, amb el seu rètol. Amb la casella d'abans (NO_CONSERVABLE, només la data),
   o qualsevol altre error, l'avís de sempre, tal qual. */
describe('v1.2.23 · L2-03 · l’avís d’una pujada rebutjada nomena el control que es veu', () => {
  const PRESSUPOST_LLOC = 'La foto pesa massa amb la ubicació i la data; encén «Amaga el lloc» o prova amb una altra foto.';
  const NO_CONSERVABLE_LLOC = 'No es pot conservar la ubicació i la data d’esta foto; encén «Amaga el lloc» per a pujar-la sense.';

  test.each([
    ['ERROR_PRESSUPOST_EXIF', ERROR_PRESSUPOST_EXIF, PRESSUPOST_LLOC],
    ['ERROR_EXIF_NO_CONSERVABLE', ERROR_EXIF_NO_CONSERVABLE, NO_CONSERVABLE_LLOC],
  ])('%s amb l’interruptor apagat: l’alerta diu «encén «Amaga el lloc»» i no parla de cap casella', async (_nom, rebuig, esperat) => {
    for (const [, senzill, boto] of MODES) {
      const vista = munta({ senzill, font: fotoGps(), ofereixConservarExif: true, onDesa: vi.fn(async () => { throw new Error(rebuig); }) });
      expect((await vista.findByRole('switch', INTERRUPTOR)).checked).toBe(false);
      expect(rebuig).toContain(`desmarca «${ETIQUETA_CONSERVA_EXIF}»`);
      await desa(vista, boto);
      expect(vista.onDesa).toHaveBeenCalledTimes(1);
      const alerta = vista.getByRole('alert').textContent;
      expect(alerta).toBe(esperat);
      expect(alerta).not.toMatch(/desmarca|Conserva la ubicació/);
      cleanup();
    }
  });

  test('amb la casella d’abans (una foto que només porta la data), el mateix rebuig es diu tal qual: la casella hi és', async () => {
    const vista = munta({ font: fotoData(), ofereixConservarExif: true, onDesa: vi.fn(async () => { throw new Error(ERROR_PRESSUPOST_EXIF); }) });
    expect((await vista.findByRole('checkbox', CASELLA)).checked).toBe(true);
    await desa(vista, 'Desar l’enquadrament');
    expect(vista.getByRole('alert').textContent).toBe(ERROR_PRESSUPOST_EXIF);
  });

  test('un altre error de la pujada, o l’interruptor encés, no es toca', async () => {
    const altre = munta({ font: fotoGps(), ofereixConservarExif: true, onDesa: vi.fn(async () => { throw new Error('Sense xarxa'); }) });
    await altre.findByRole('switch', INTERRUPTOR);
    await desa(altre, 'Desar l’enquadrament');
    expect(altre.getByRole('alert').textContent).toBe('Sense xarxa');
    cleanup();
    const encesa = munta({ font: fotoGps(), ofereixConservarExif: true, onDesa: vi.fn(async () => { throw new Error(ERROR_PRESSUPOST_EXIF); }) });
    fireEvent.click(await encesa.findByRole('switch', INTERRUPTOR));
    await desa(encesa, 'Desar l’enquadrament');
    expect(metadadesDe(encesa.onDesa).exif).toEqual({ conservaExif: false });
    expect(encesa.getByRole('alert').textContent).toBe(ERROR_PRESSUPOST_EXIF);
  });

  /* v1.2.23 · L2-03 (Gauntlet R2) · Amb la finestra ja tancada (Escape a mitja pujada), qui puja només té la tria que
     el diàleg ha enviat (metadades.exif): avisDeRebuigDeLaTria en diu el mateix que l'alerta del diàleg obert. Les
     tries són les de veres, les que el diàleg passa a onDesa amb cada control. */
  test('v1.2.23 · L2-03 (Gauntlet R2) · avisDeRebuigDeLaTria: la tria enviada diu el mateix que el diàleg obert', async () => {
    const lloc = ETIQUETA_AMAGA_LLOC;
    const apagat = munta({ font: fotoGps(), ofereixConservarExif: true, onDesa: vi.fn(async () => { throw new Error(ERROR_PRESSUPOST_EXIF); }) });
    expect((await apagat.findByRole('switch', INTERRUPTOR)).checked).toBe(false);
    await desa(apagat, 'Desar l’enquadrament');
    const triaApagat = metadadesDe(apagat.onDesa).exif;
    expect(avisDeRebuigDeLaTria(ERROR_PRESSUPOST_EXIF, triaApagat, { lloc })).toBe(apagat.getByRole('alert').textContent);
    expect(avisDeRebuigDeLaTria(ERROR_PRESSUPOST_EXIF, triaApagat, { lloc })).toBe(PRESSUPOST_LLOC);
    expect(avisDeRebuigDeLaTria(ERROR_EXIF_NO_CONSERVABLE, triaApagat, { lloc })).toBe(NO_CONSERVABLE_LLOC);
    expect(avisDeRebuigDeLaTria(ERROR_PRESSUPOST_EXIF, triaApagat, { idioma: 'es', lloc: 'Ocultar el lugar' }))
      .toBe(TEXTOS_AMAGA_LLOC.es.pressupostLloc.replace('{lloc}', 'Ocultar el lugar'));
    expect(avisDeRebuigDeLaTria('Sense xarxa', triaApagat, { lloc })).toBe('Sense xarxa');
    cleanup();
    // La casella d'abans (una foto que només porta la data): la tria no porta precisió, i el rebuig es diu tal qual.
    const casella = munta({ font: fotoData(), ofereixConservarExif: true, onDesa: vi.fn(async () => { throw new Error(ERROR_PRESSUPOST_EXIF); }) });
    expect((await casella.findByRole('checkbox', CASELLA)).checked).toBe(true);
    await desa(casella, 'Desar l’enquadrament');
    expect(avisDeRebuigDeLaTria(ERROR_PRESSUPOST_EXIF, metadadesDe(casella.onDesa).exif, { lloc })).toBe(ERROR_PRESSUPOST_EXIF);
    cleanup();
    // L'interruptor encés (una tria neta) o cap tria: tal qual.
    expect(avisDeRebuigDeLaTria(ERROR_PRESSUPOST_EXIF, { conservaExif: false }, { lloc })).toBe(ERROR_PRESSUPOST_EXIF);
    expect(avisDeRebuigDeLaTria(ERROR_PRESSUPOST_EXIF, undefined, { lloc })).toBe(ERROR_PRESSUPOST_EXIF);
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

  test('P2 · un GPS IFD que el lector estricte no entén (sense N/S ni E/W): l’interruptor i l’avís diuen la ubicació, perquè es publica', async () => {
    const font = fotoAmb({ ifd0: IDENTITAT.slice(0, 1), gps: gpsTorre().filter((e) => e.tag !== 1 && e.tag !== 3) });
    const vista = munta({ font, ofereixConservarExif: true });
    const interruptor = await vista.findByRole('switch', INTERRUPTOR);
    expect(interruptor.checked).toBe(false);
    expect(vista.getByText(new RegExp(`^${AVIS_UBICACIO_CONSERVADA}`))).toBeTruthy();
  });

  test.each(MODES)('%s · P2 · amb la ubicació, l’avís diu també les dades que identifiquen la càmera: marca, model i número de sèrie', async (_mode, senzill) => {
    const font = fotoAmb({ ifd0: [orientacio(1), ...IDENTITAT], exif: [...dataOriginal('2017:05:14 10:22:33'), SERIE], gps: gpsTorre() });
    const vista = munta({ senzill, font, ofereixConservarExif: true });
    expect((await vista.findByRole('switch', INTERRUPTOR)).checked).toBe(false); // la tria de sèrie no canvia (pla §0.1.3): es conserva
    expect(vista.getByText(`${AVIS_UBICACIO_CONSERVADA} També es publicaran les dades de la càmera: la marca, el model i el número de sèrie.`)).toBeTruthy();
    expect(liniaDeLaData(vista)).toBeTruthy();
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
    const interruptor = await vista.findByRole('switch', INTERRUPTOR);
    expect(interruptor.checked).toBe(false);
    expect(lectorExif.mock.calls).toEqual([[blob]]);
    await AMPLIA(vista);
    await desa(vista, boto);
    expect(metadadesDe(vista.onDesa).exif).toEqual({ conservaExif: true, original: blob, precisio: 'exacta' });
  });

  test('P2 · una adreça desada sencera (sense ampliar): marcada, no hi ha res a desar i es tanca (l’EXIF queda on era); desmarcada, es desa neta', async () => {
    const blob = new Blob([jpegAmbExif({ gps: gpsTorre() })], { type: 'image/webp' });
    const marcada = munta({ font: '/assets/h.webp', carregador: ambBlob(blob), ofereixConservarExif: true });
    await marcada.findByRole('switch', INTERRUPTOR);
    await desa(marcada, 'Desar l’enquadrament');
    expect(marcada.onDesa).not.toHaveBeenCalled();
    expect(marcada.onTanca).toHaveBeenCalledWith('boto');
    cleanup();
    const desmarcada = munta({ font: '/assets/h.webp', carregador: ambBlob(blob), ofereixConservarExif: true });
    fireEvent.click(await desmarcada.findByRole('switch', INTERRUPTOR));
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
    expect(vista.queryByRole('switch')).toBeNull();
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
    expect(vista.queryByRole('switch', INTERRUPTOR)).toBeNull();
    await desa(vista, boto);
    expect(vista.onDesa).not.toHaveBeenCalled();
    await act(async () => { lectura.resol({ gps: { lat: 38.59, lng: -0.42 }, dataCaptura: null }); });
    expect(vista.onDesa).not.toHaveBeenCalled();
    expect(vista.getByRole('switch', INTERRUPTOR).checked).toBe(false);
    expect(AVIS_REVISA_LLOC).toBe(REVISA_LLOC);
    expect(vista.getByRole('alert').textContent).toBe(REVISA_LLOC);
    await desa(vista, boto);
    expect(vista.onDesa).toHaveBeenCalledTimes(1);
    expect(metadadesDe(vista.onDesa).exif).toEqual({ conservaExif: true, original: font, precisio: 'exacta' });
  });

  /* v1.2.23 · IDEA-331 · Carril T · El mateix temps amb una foto que només porta la data: el control que
     apareix és la casella d'abans (marcada), i l'avís continua dient «Revisa la casella» (AVIS_REVISA_EXIF). */
  test.each(MODES)('%s: si es desa abans que acabe la lectura d’una foto que només porta la data, ix la casella marcada i AVIS_REVISA_EXIF', async (_mode, senzill, boto) => {
    const lectura = diferida();
    const vista = munta({ senzill, font: fotoData(), ofereixConservarExif: true, lectorExif: () => lectura.promesa });
    await carregat();
    await desa(vista, boto);
    expect(vista.onDesa).not.toHaveBeenCalled();
    await act(async () => { lectura.resol({ gps: null, dataCaptura: '2017-05-14T10:22:33', estat: 'publicable', contingut: { data: true } }); });
    expect(vista.onDesa).not.toHaveBeenCalled();
    expect(vista.getByRole('checkbox', CASELLA).checked).toBe(true);
    expect(vista.queryByRole('switch', INTERRUPTOR)).toBeNull();
    expect(vista.getByRole('alert').textContent).toBe(AVIS_REVISA_EXIF);
    await desa(vista, boto);
    expect(vista.onDesa).toHaveBeenCalledTimes(1);
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
    expect(vista.queryByRole('switch', INTERRUPTOR)).toBeNull();
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
    await vista.findByRole('switch', INTERRUPTOR);
    const grup = vista.getByRole('radiogroup', PINDOLES);
    expect(within(grup).getAllByRole('radio').map((r) => [r.value, r.checked])).toEqual([['exacta', true], ['100m', false], ['poble', false]]);
    expect(vista.getByText('Es desarà: 38.59190, -0.41840 (exacta). El punt de la foto, a un metre.')).toBeTruthy();
    fireEvent.click(vista.getByRole('switch', INTERRUPTOR));
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
    await vista.findByRole('switch', INTERRUPTOR);
    fireEvent.click(vista.getByRole('radio', { name: 'Uns 100 m' }));
    expect(vista.getByText('Es desarà: 38.592, -0.418 (uns 100 m). Es veu el paratge, no el punt exacte.')).toBeTruthy();
    await desa(vista, boto);
    expect(metadadesDe(vista.onDesa)).toEqual({
      geolocalitzacio: { lat: 38.592, lng: -0.418, precisio: '100m', precisio_m: 100, origen: 'exif' },
      dataCaptura: '2017-05-14T10:22:33',
      exif: { conservaExif: true, original: font, precisio: '100m' },
    });
  });

  test('«Amaga el lloc» encés, res de la ubicació: { conservaExif: false } i el punt a null', async () => {
    const vista = munta({ font: fotoGps(), ofereixConservarExif: true });
    fireEvent.click(await vista.findByRole('switch', INTERRUPTOR));
    await desa(vista, 'Desar l’enquadrament');
    expect(metadadesDe(vista.onDesa)).toEqual({ geolocalitzacio: null, dataCaptura: null, exif: { conservaExif: false } });
  });

  test('una foto nova torna a l’exacta', async () => {
    const p = props({ font: fotoGps(), ofereixConservarExif: true });
    const vista = render(<DialegEnquadrament {...p} />);
    await vista.findByRole('switch', INTERRUPTOR);
    fireEvent.click(vista.getByRole('radio', { name: 'Només el poble' }));
    vista.rerender(<DialegEnquadrament {...p} font={fotoGps()} />);
    await carregat();
    await vista.findByRole('switch', INTERRUPTOR);
    expect(vista.getByRole('radio', { name: 'Exacta' }).checked).toBe(true);
  });
});

/* Gauntlet R22 (ronda 4) · Una foto de Notes va al fitxer privat amb el bloc
   sencer i ix al Mur per promoteToPublic, que només hi deixa la tria de
   preparaTiffTriat (storage.js · ambExifTriat). Amb exifTriat, l'avís de la
   casella diu el que porta eixa còpia pública: es compara amb el contingut
   de veres del bloc triat (la mateixa cadena: extreuTiff → preparaTiffTriat). */
describe('R22 (ronda 4) · exifTriat: l’avís diu el que publica preparaTiffTriat', () => {
  const texte = (tag, valors) => ({ tag, tipus: TIPUS.ASCII, valors });
  const CAMERA = [texte(0x010f, 'NIKON'), texte(0x0110, 'D850')];
  const SERIE = texte(0xa431, '0123456789');
  const AUTORA = texte(0x013b, 'AUTORA-SECRETA');
  const PROPIETARIA = texte(0xa430, 'PROPIETARIA-SECRETA');
  const mobil = () => jpegAmbExif({ ifd0: [orientacio(1), ...CAMERA], exif: [...dataOriginal('2017:05:14 10:22:33'), SERIE], gps: gpsTorre() });
  const camera = () => jpegAmbExif({ ifd0: [...CAMERA, AUTORA], exif: [PROPIETARIA, SERIE] });
  const serie = () => jpegAmbExif({ ifd0: [AUTORA], exif: [PROPIETARIA, SERIE] });
  const publicat = (bytes) => {
    const triat = preparaTiffTriat(extreuTiff(bytes));
    return triat ? analitzaTiff(triat).contingut : null;
  };
  const NOMES_MARCA_I_MODEL = 'Si la deixes marcada, les dades de la càmera es publicaran amb la foto: la marca i el model.';
  const NO_ES_PUBLICA = 'Si la deixes marcada, les dades de la càmera es conservaran, però no es publicaran amb la foto.';

  test('ubicació, data i càmera: la còpia pública no porta cap dada de la càmera, i l’avís tampoc no en parla', async () => {
    const bytes = mobil();
    expect(publicat(bytes)).toMatchObject({ ubicacio: true, data: true, marca: false, model: false, serie: false, nom: false });
    const vista = munta({ font: new File([bytes], 'mobil.jpg', { type: 'image/jpeg' }), ofereixConservarExif: true, exifTriat: true });
    expect((await vista.findByRole('switch', INTERRUPTOR)).checked).toBe(false);
    expect(vista.getByText(AVIS_UBICACIO_CONSERVADA)).toBeTruthy();
    expect(liniaDeLaData(vista)).toBeTruthy();
    expect(vista.queryByText(/dades de la càmera/)).toBeNull();
  });

  test('només la càmera: la còpia pública porta la marca i el model, i l’avís només diu això (mai la sèrie ni el nom)', async () => {
    const bytes = camera();
    expect(publicat(bytes)).toMatchObject({ ubicacio: false, data: false, marca: true, model: true, serie: false, nom: false });
    const vista = munta({ font: new File([bytes], 'camera.jpg', { type: 'image/jpeg' }), ofereixConservarExif: true, exifTriat: true });
    await vista.findByRole('checkbox', { name: new RegExp(ETIQUETA_CONSERVA_CAMERA) });
    expect(vista.getByText(NOMES_MARCA_I_MODEL)).toBeTruthy();
    expect(vista.queryByText(/número de sèrie|nom de persona/)).toBeNull();
  });

  test('només la sèrie i noms: la còpia pública no en porta res, i l’avís diu que no es publicaran', async () => {
    const bytes = serie();
    expect(publicat(bytes)).toBeNull();
    const vista = munta({ font: new File([bytes], 'serie.jpg', { type: 'image/jpeg' }), ofereixConservarExif: true, exifTriat: true });
    await vista.findByRole('checkbox', { name: new RegExp(ETIQUETA_CONSERVA_CAMERA) });
    expect(vista.getByText(NO_ES_PUBLICA)).toBeTruthy();
  });

  test('sense exifTriat (la capçalera d’una fitxa, que puja el bloc sencer), l’avís de sempre amb totes les dades', async () => {
    const vista = munta({ font: new File([camera()], 'camera.jpg', { type: 'image/jpeg' }), ofereixConservarExif: true });
    await vista.findByRole('checkbox', { name: new RegExp(ETIQUETA_CONSERVA_CAMERA) });
    expect(vista.getByText('Si la deixes marcada, les dades de la càmera es publicaran amb la foto: la marca, el model, el número de sèrie i un nom de persona.')).toBeTruthy();
  });

  test('CasellaExif amb exifTriat (l’ordre «/» Imatge de les Notes): el mateix avís', async () => {
    const dades = await exifPublicable(new File([mobil()], 'mobil.jpg', { type: 'image/jpeg' }));
    const vista = render(<CasellaExif dades={dades} conserva onConserva={vi.fn()} exifTriat />);
    expect(vista.getByText(AVIS_UBICACIO_CONSERVADA)).toBeTruthy();
    expect(liniaDeLaData(vista)).toBeTruthy();
    vista.rerender(<CasellaExif dades={await exifPublicable(new File([camera()], 'c.jpg', { type: 'image/jpeg' }))} conserva onConserva={vi.fn()} exifTriat />);
    expect(vista.getByText(NOMES_MARCA_I_MODEL)).toBeTruthy();
  });
});
