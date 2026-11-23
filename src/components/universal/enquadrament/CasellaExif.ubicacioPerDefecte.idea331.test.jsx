import { useRef, useState } from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../../tests/helpers/diccionaris.js';
import { UIProvider } from '../../../app/contexts/UIContext.jsx';
import { LANGUAGE_STORAGE_KEY } from '../../../config/i18n.js';
import { delVal } from '../../../config/storage.js';
import CA from '../../../config/idiomes/ca.js';
import ES from '../../../config/idiomes/es.js';
import EN from '../../../config/idiomes/en.js';
import EU from '../../../config/idiomes/eu.js';
import GL from '../../../config/idiomes/gl.js';
import useHeroImageHandler from '../../../hooks/useHeroImageHandler.js';
import {
  AJUDA_TAMBE_DATA, AVIS_UBICACIO_AMAGADA, AVIS_UBICACIO_CONSERVADA, CasellaExif, DialegEnquadrament, ETIQUETA_AMAGA_LLOC,
  ETIQUETA_PUBLICA_SENSE_GEOLOCALITZACIO, TEXTOS_ENQUADRAMENT,
} from './DialegEnquadrament.jsx';
import { llegixExif, teExif } from './exif.js';
import { exifPublicable } from './exifIncrustat.js';
import { configDeForma } from './useEnquadramentImatge.jsx';
import {
  APP0_JFIF, IMATGE, SOI, app1Exif, concatena, dataOriginal, gpsTorre, orientacio, tiff,
} from '../../../../tests/helpers/jpegProva.js';

/* ═══════════════════════════════════════════════════════════════════
   v1.2.23 · IDEA-331 (ordre del Mestre 261123) · FORA DEL XAT

   «A Sóc de Poble tot contingut […] conserva les dades EXIF i GPS per
   defecte […], informant de manera clara i visible l'autor abans de publicar
   («Aquest contingut conserva la ubicació per situar-lo al territori» en les 5
   llengües) i oferint l'interruptor exprés d'1 toc «Publicar sense
   geolocalització» / «Amaga el lloc». Només quan l'autor activa expressament
   publicar sense geolocalització s'eliminen EXIF/GPS.»

   CasellaExif és el control de totes les superfícies on l'autor publica una
   foto pròpia fora del xat: la capçalera (DialegEnquadrament de la closca:
   Notes, Mur, Mercat i Esdeveniments, que es publiquen des del Bloc), la
   capçalera de la fitxa d'una entitat (useImatgeDeFitxa) i les fotos del cos
   (la pregunta de DocumentEditor: les Notes i, ara, el Perfil; vegeu
   DocumentEditor.ubicacioPerDefecte.idea331.test.jsx). Ací:
     · l'avís i l'interruptor en les cinc llengües, apagat de sèrie;
     · de punta a punta per la capçalera de les Notes (el diàleg, el
       processaFitxer de la closca i el compressImage de veres sobre un canvas
       fals): de sèrie, el fitxer que puja porta el GPS; amb un toc a «Amaga el
       lloc», el fitxer que puja no porta ni EXIF ni GPS.
   Queden fora, sempre netes (decisió anterior, P1-64): l'avatar, el logotip i
   la capçalera d'una persona (enquadramentAvatar.privacitat.test.jsx) i les
   imatges enganxades (ordreImatge.exif.test.js).
   ═══════════════════════════════════════════════════════════════════ */

const DICCIONARIS = Object.freeze({ ca: CA, es: ES, en: EN, eu: EU, gl: GL });
/* El text de l'ordre, llengua per llengua (forma valenciana normativa en ca, com al xat). */
const AVIS_ESPERAT = Object.freeze({
  ca: 'Este contingut conserva la ubicació per a situar-lo al territori.',
  es: 'Este contenido conserva la ubicación para situarlo en el territorio.',
  en: 'This content keeps its location so it can be placed on the territory.',
  eu: 'Eduki honek kokapena gordetzen du lurraldean kokatzeko.',
  gl: 'Este contido conserva a localización para situalo no territorio.',
});
/* v1.2.23 · IDEA-331 (ordre del Mestre 261123) · Carril T · L'interruptor ja no nomena la data:
   quan la foto també la porta, es publica, i ho diu una línia a banda, just davall de l'interruptor.
   La descripció de l'interruptor (aria-describedby) continua sent el literal del Mestre tot sol. */
const DATA_ESPERADA = Object.freeze({
  ca: 'També es publicarà la data de la foto.',
  es: 'También se publicará la fecha de la foto.',
  en: 'The photo’s date will also be published.',
  eu: 'Argazkiaren data ere argitaratuko da.',
  gl: 'Tamén se publicará a data da foto.',
});
const ROTUL_ESPERAT = Object.freeze({
  ca: ['Amaga el lloc', 'Publicar sense geolocalització', 'Ubicació amagada'],
  es: ['Ocultar el lugar', 'Publicar sin geolocalización', 'Ubicación ocultada'],
  en: ['Hide the location', 'Publish without geotagging', 'Location hidden'],
  eu: ['Ezkutatu kokapena', 'Argitaratu geokokapenik gabe', 'Kokapena ezkutatuta'],
  gl: ['Agochar o lugar', 'Publicar sen xeolocalización', 'Localización agochada'],
});

const TIFF_GPS = tiff({ ifd0: [orientacio(1)], exif: dataOriginal('2017:05:14 10:22:33', '+02:00'), gps: gpsTorre() });
const FOTO_GPS = concatena(SOI, APP0_JFIF, app1Exif(TIFF_GPS), IMATGE);
/* La mateixa ubicació, sense la data. */
const FOTO_NOMES_GPS = concatena(SOI, APP0_JFIF, app1Exif(tiff({ ifd0: [orientacio(1)], gps: gpsTorre() })), IMATGE);
const SORTIDA_CANVAS = concatena(SOI, APP0_JFIF, IMATGE);
const MARCA_EXIF = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00];
const fotoGps = () => new File([FOTO_GPS], 'IMG_2041.jpg', { type: 'image/jpeg' });

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

/* jsdom no descodifica ni codifica: la Image, el context 2D i toDataURL s'emulen. El «codificador» torna un
   JPEG net: si un camí deixara passar l'original, els seus bytes portarien l'«Exif» i el GPS de la Torre. */
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

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })));
  delVal(LANGUAGE_STORAGE_KEY);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delVal(LANGUAGE_STORAGE_KEY);
});

const descripcio = (control) => document.getElementById(control.getAttribute('aria-describedby')).textContent;
/* v1.2.23 · IDEA-331 · Carril T · La línia de la data: un <p> d'ajuda, el germà just darrere de la
   casella de l'interruptor, amb el text exacte de la llengua, i fora de la descripció. */
function liniaData(control, llengua) {
  const linia = control.closest('.sdp-casella').nextElementSibling;
  expect(linia?.tagName).toBe('P');
  expect(linia.className).toBe('sdp-camp__ajuda');
  expect(linia.textContent).toBe(DATA_ESPERADA[llengua]);
  expect(document.getElementById(control.getAttribute('aria-describedby')).contains(linia)).toBe(false);
  return linia;
}

describe('IDEA-331 · l’avís i l’interruptor «Amaga el lloc» en les cinc llengües', () => {
  test('les reserves del codi són el text del Mestre i els rètols del xat, lletra per lletra', () => {
    expect([AVIS_UBICACIO_CONSERVADA, ETIQUETA_AMAGA_LLOC, ETIQUETA_PUBLICA_SENSE_GEOLOCALITZACIO, AVIS_UBICACIO_AMAGADA])
      .toEqual([AVIS_ESPERAT.ca, ...ROTUL_ESPERAT.ca]);
    expect(AJUDA_TAMBE_DATA).toBe(DATA_ESPERADA.ca);
    // Les claus de l'interruptor són les del xat (el mateix text, una sola clau per llengua).
    expect([TEXTOS_ENQUADRAMENT.ubicacioConservada[0], TEXTOS_ENQUADRAMENT.amagaLloc[0], TEXTOS_ENQUADRAMENT.publicaSenseGeolocalitzacio[0],
      TEXTOS_ENQUADRAMENT.ubicacioAmagada[0]]).toEqual(['editor.enquadrament.ubicacioConservada', 'section.xat.adjunts.amagaLloc',
      'section.xat.adjunts.publicaSenseGeolocalitzacio', 'section.xat.ubicacio.amagada']);
  });

  test.each(Object.keys(DICCIONARIS))('%s: els diccionaris porten l’avís i els rètols, i el xat diu el mateix (sense les coordenades)', (llengua) => {
    const dic = DICCIONARIS[llengua];
    expect(dic['editor.enquadrament.ubicacioConservada']).toBe(AVIS_ESPERAT[llengua]);
    expect([dic['section.xat.adjunts.amagaLloc'], dic['section.xat.adjunts.publicaSenseGeolocalitzacio'], dic['section.xat.ubicacio.amagada']])
      .toEqual(ROTUL_ESPERAT[llengua]);
    // L'avís del xat és el mateix text amb les coordenades al final.
    expect(dic['section.xat.adjunts.ubicacioConservada'].replace(/ \(\{lat\}°, \{lng\}°\)$/, '.')).toBe(AVIS_ESPERAT[llengua]);
    // La clau vella («Si la deixes marcada, la ubicació…») ja no hi és: no la pinta ningú.
    expect(Object.hasOwn(dic, 'editor.enquadrament.exifAjudaUbicacio')).toBe(false);
  });

  /* Una foto de publicació amb GPS: l'interruptor, apagat de sèrie (es conserva), el seu nom llarg i l'avís
     visible; un toc l'encén i l'avís diu que la ubicació s'ha amagat. Els dos `exifTriat` (Notes i Perfil).
     v1.2.23 · IDEA-331 · Carril T · La foto porta també la data (es publica: vegeu «de sèrie: el fitxer
     que puja porta el GPS i la data» d'ací baix). La descripció és el literal del Mestre tot sol, i
     DATA_ESPERADA és la línia germana que ve just darrere de la casella, fora de la descripció. Encés,
     la línia se'n va; apagat de nou, torna. Sense data, cap línia (la prova següent). */
  test.each(Object.keys(DICCIONARIS).flatMap((llengua) => [[llengua, true], [llengua, false]]))(
    '%s (exifTriat %s): apagat de sèrie amb l’avís del Mestre; un toc l’encén i diu «ubicació amagada»',
    async (llengua, exifTriat) => {
      const [curt, llarg, amagada] = ROTUL_ESPERAT[llengua];
      const dades = await exifPublicable(fotoGps());
      const conserves = [];
      function Banc() {
        const [conserva, setConserva] = useState(true);
        conserves.push(conserva);
        return <CasellaExif dades={dades} conserva={conserva} onConserva={setConserva} onPrecisio={() => {}} exifTriat={exifTriat} />;
      }
      const vista = render(<UIProvider externalConfig={{ language: llengua }}><Banc /></UIProvider>);
      await act(async () => {});
      const interruptor = vista.getByRole('switch', { name: `${curt} (${llarg})` });
      expect(interruptor.checked).toBe(false);
      expect(interruptor.getAttribute('title')).toBe(llarg);
      expect(interruptor.closest('.sdp-casella').querySelector('.sdp-casella__etiqueta').firstChild.textContent).toBe(curt);
      expect(descripcio(interruptor)).toBe(AVIS_ESPERAT[llengua]);
      expect(liniaData(interruptor, llengua)).toBeTruthy();
      expect(vista.queryByRole('checkbox')).toBeNull();
      expect(vista.getByRole('radiogroup')).toBeTruthy(); // les píndoles de la precisió, com abans
      fireEvent.click(interruptor);
      expect(interruptor.checked).toBe(true);
      expect(descripcio(interruptor)).toBe(amagada);
      expect(vista.container.textContent).not.toContain(AVIS_ESPERAT[llengua]);
      expect(vista.container.textContent).not.toContain(DATA_ESPERADA[llengua]);
      expect(vista.queryByRole('radiogroup')).toBeNull();
      expect(conserves.at(-1)).toBe(false);
      fireEvent.click(interruptor);
      expect([interruptor.checked, conserves.at(-1), descripcio(interruptor)]).toEqual([false, true, AVIS_ESPERAT[llengua]]);
      expect(liniaData(interruptor, llengua)).toBeTruthy();
    },
  );

  test.each(Object.keys(DICCIONARIS))('%s: una foto amb la ubicació i sense la data: el literal del Mestre tot sol, sense la línia de la data', async (llengua) => {
    const dades = await exifPublicable(new File([FOTO_NOMES_GPS], 'g.jpg', { type: 'image/jpeg' }));
    const vista = render(<UIProvider externalConfig={{ language: llengua }}><CasellaExif dades={dades} conserva onConserva={vi.fn()} onPrecisio={() => {}} /></UIProvider>);
    await act(async () => {});
    const interruptor = vista.getByRole('switch', { name: `${ROTUL_ESPERAT[llengua][0]} (${ROTUL_ESPERAT[llengua][1]})` });
    expect(descripcio(interruptor)).toBe(AVIS_ESPERAT[llengua]);
    expect(vista.container.textContent).not.toContain(DATA_ESPERADA[llengua]);
  });

  test('sense ubicació (només la data) o amb un EXIF que no es pot conservar: la casella d’abans, cap interruptor', async () => {
    const data = await exifPublicable(new File([concatena(SOI, APP0_JFIF, app1Exif(tiff({ exif: dataOriginal('2017:05:14 10:22:33') })), IMATGE)], 'd.jpg', { type: 'image/jpeg' }));
    const vista = render(<CasellaExif dades={data} conserva onConserva={vi.fn()} />);
    expect(vista.getByRole('checkbox', { name: /Conserva la ubicació i la data de la foto/ }).checked).toBe(true);
    expect(vista.queryByRole('switch')).toBeNull();
    vista.rerender(<CasellaExif dades={{ estat: 'no-conservable', gps: { lat: 1, lng: 1 }, contingut: { ubicacio: true } }} conserva onConserva={vi.fn()} />);
    expect(vista.getByRole('checkbox', { name: /Conserva la ubicació i la data de la foto/ })).toBeTruthy();
    expect(vista.queryByRole('switch')).toBeNull();
    expect(vista.queryByText(AVIS_UBICACIO_CONSERVADA)).toBeNull();
  });
});

/* ── De punta a punta: la capçalera de les Notes (Mur, Mercat i Esdeveniments) ──
   El mateix camí que la closca (UniversalEditorShell · desaEnquadrament): el diàleg amb
   ofereixConservarExif, exifTriat i noDestructiu, i processaFitxer amb { forma, midaMaxima,
   ...metadades.exif }. La pujada rep el fitxer que ixiria cap al servidor. */
function CapcaleraDeNota({ font, onImageUpload, senzill }) {
  const handler = useHeroImageHandler({ onImageUpload, onSaveField: vi.fn(), onError: vi.fn() });
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const cfg = senzill ? configDeForma('capcalera') : null;
  return (
    <DialegEnquadrament font={font} onTanca={() => {}} ofereixConservarExif exifTriat={!senzill} noDestructiu
      {...(cfg ? { senzill: true, formatInicial: cfg.formatInicial, formats: cfg.formats, sortida: cfg.sortida(font) } : null)}
      carregador={async () => ({ amplada: 3000, alcada: 3000, tipus: 'image/jpeg', element: {}, allibera: () => {} })}
      exportador={async () => new File([SORTIDA_CANVAS], 'enquadrament.jpg', { type: 'image/jpeg' })}
      dibuixant={() => true}
      onDesa={async (fitxer, _info, metadades) => handlerRef.current.processaFitxer(fitxer, {
        forma: 'capcalera', midaMaxima: 1200, ...metadades?.exif,
      })} />
  );
}

describe('IDEA-331 · la capçalera, de punta a punta: de sèrie conserva el GPS; amb «Amaga el lloc», cap EXIF', () => {
  beforeEach(() => {
    vi.stubGlobal('Image', ImatgeFalsa);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ({ clearRect: vi.fn(), drawImage: vi.fn(), fillRect: vi.fn() }));
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation((tipus = 'image/png') => `data:${tipus};base64,${aBase64(SORTIDA_CANVAS)}`);
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      const { tipus, bytes } = deDataUrl(url);
      return { blob: async () => new Blob([bytes], { type: tipus }) };
    }));
  });

  async function desaCapcalera({ amaga, senzill = false }) {
    const onImageUpload = vi.fn(async () => 'sdp-media://mitjans_privats/t/u/notes/a.webp');
    const vista = render(<CapcaleraDeNota font={fotoGps()} onImageUpload={onImageUpload} senzill={senzill} />);
    const interruptor = await vista.findByRole('switch', { name: new RegExp(ETIQUETA_AMAGA_LLOC) });
    expect(interruptor.checked).toBe(false);
    expect(descripcio(interruptor)).toBe(AVIS_UBICACIO_CONSERVADA);
    expect(vista.getByText(AJUDA_TAMBE_DATA).previousElementSibling).toBe(interruptor.closest('.sdp-casella'));
    if (amaga) fireEvent.click(interruptor);
    await act(async () => { fireEvent.click(vista.getByRole('button', { name: senzill ? 'Guardar' : 'Desar l’enquadrament' })); });
    await waitFor(() => expect(onImageUpload).toHaveBeenCalledTimes(1));
    return bytesDe(onImageUpload.mock.calls[0][0]);
  }

  test.each([['T46 (les Notes)', false], ['senzill (la capçalera d’una entitat)', true]])('%s · de sèrie: el fitxer que puja porta el GPS i la data de la foto', async (_mode, senzill) => {
    const bytes = await desaCapcalera({ amaga: false, senzill });
    expect(teExif(bytes)).toBe(true);
    expect(llegixExif(bytes)).toMatchObject({ gps: { lat: 38.5919, lng: -0.4184 }, dataCaptura: '2017-05-14T10:22:33+02:00' });
  });

  test.each([['T46 (les Notes)', false], ['senzill (la capçalera d’una entitat)', true]])('%s · amb «Amaga el lloc»: el fitxer que puja són els bytes del canvas, sense EXIF ni GPS', async (_mode, senzill) => {
    const bytes = await desaCapcalera({ amaga: true, senzill });
    expect([...bytes]).toEqual([...SORTIDA_CANVAS]);
    expect(conteMarca(bytes, MARCA_EXIF)).toBe(false);
    expect(teExif(bytes)).toBe(false);
    expect(llegixExif(bytes).gps).toBeNull();
  });
});
