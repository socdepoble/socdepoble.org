import { useState } from 'react';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
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
import { DialegEnquadrament, TEXTOS_ENQUADRAMENT } from './DialegEnquadrament.jsx';
import { FORMATS, PARELLS_FORMA, PARELL_PERCENTATGE, textAmpliacio } from './enquadrament.js';
import { PARELLS_PRECISIO, PARELL_CASELLA_GEO } from './geolocalitzacio.js';
import { TEXTOS_UBICACIO } from './UbicacioImatge.jsx';
import { AJUDA_FOTO, PARELLS_DE_SERIE, useEnquadramentImatge } from './useEnquadramentImatge.jsx';

/* ═══════════════════════════════════════════════════════════════════
   T5c · P1-22 (assalt 261101) · L'ENQUADRAMENT EN CINC LLENGÜES

   Les altres proves del directori pinten el diàleg fora de l'App (sense
   UIProvider): el valencià de la reserva, lletra per lletra. Ací, el mateix
   diàleg dins de l'App en castellà, anglés i basc: la finestra senzilla del
   Perfil pel hook (useEnquadramentImatge), el T46 de les Notes, la
   geolocalització (UbicacioImatge), la casella de l'EXIF (CasellaExif) i
   l'avís del GPS de les fotos d'identitat. I la paritat: cada parell
   [clau, reserva] dels mòduls té la clau a les cinc llengües, amb els
   mateixos marcadors, i en valencià diu exactament la reserva.
   jsdom no té canvas: el carregador, l'exportador i el dibuix s'injecten.
   ═══════════════════════════════════════════════════════════════════ */

/* UIProvider llig el tema del sistema (matchMedia), que jsdom no té. */
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

const foto = (tipus = 'image/png', nom = 'foto.png') => new File(['x'], nom, { type: tipus });
/* Un fitxer que diu pesar `mb` MB sense ocupar-los en memòria. */
const pesat = (mb, tipus = 'image/jpeg') => {
  const fitxer = foto(tipus, 'gran.jpg');
  Object.defineProperty(fitxer, 'size', { value: mb * 1024 * 1024 });
  return fitxer;
};
const eines = (img = {}) => ({
  carregador: vi.fn(async () => ({ amplada: 4000, alcada: 2000, tipus: 'image/png', element: {}, allibera: vi.fn(), ...img })),
  exportador: vi.fn(async () => new File(['y'], 'enquadrament.png', { type: 'image/png' })),
  dibuixant: vi.fn(() => true),
});
const enApp = (llengua, node) => (llengua ? <UIProvider externalConfig={{ language: llengua }}>{node}</UIProvider> : node);
const carregat = () => act(async () => {});
const dialeg = (vista) => vista.getByRole('dialog');
const peu = (vista) => [...dialeg(vista).querySelectorAll('.sdp-dialeg__peu button')].map((b) => b.textContent);

/* El T46 (les Notes), muntat directament. */
function muntaT46(llengua, { imatge, ...props } = {}) {
  const e = eines(imatge);
  const p = { font: foto(), onDesa: vi.fn(async () => true), onTanca: vi.fn(), ...e, ...props };
  const vista = render(enApp(llengua, <DialegEnquadrament {...p} />));
  return { ...vista, ...p };
}

/* La finestra senzilla del Perfil, pel hook de veres: el carregador i els
   altres dobles entren per `extres`, com les props opcionals del diàleg. */
function Banc({ forma, onError, extres, exposa }) {
  const [, setRes] = useState(0);
  const h = useEnquadramentImatge({ forma, onError, onEnquadrat: async () => {}, extres });
  exposa.current = h;
  return (
    <>
      <button type="button" onClick={() => { h.obri(foto()); setRes((n) => n + 1); }}>obri</button>
      {h.dialeg}
    </>
  );
}
function muntaHook(llengua, { forma = 'capcalera', extres = {} } = {}) {
  const onError = vi.fn();
  const exposa = { current: null };
  const vista = render(enApp(llengua, <Banc forma={forma} onError={onError} extres={{ ...eines(), ...extres }} exposa={exposa} />));
  return { ...vista, onError, hook: () => exposa.current };
}
const obri = async (vista) => {
  fireEvent.click(vista.getByRole('button', { name: 'obri' }));
  await carregat();
};

describe('la finestra senzilla del Perfil (useEnquadramentImatge) dins de l’App', () => {
  test('es: títol, ajuda, peu, zoom, visor, formes (nom sencer i píndola curta) i didàctica', async () => {
    const vista = muntaHook('es');
    await obri(vista);
    const d = vista.getByRole('dialog', { name: 'Recorta la cabecera' });
    expect(d.querySelector('.sdp-dialeg__descripcio').textContent).toBe(ES['editor.enquadrament.ajudaRetall']);
    expect(peu(vista)).toEqual(['Restablecer', 'Cancelar', 'Guardar']);
    const allunya = within(d).getByRole('button', { name: 'Alejar' });
    expect(allunya.getAttribute('title')).toBe('Alejar');
    expect(within(d).getByRole('button', { name: 'Acercar' }).getAttribute('title')).toBe('Acercar');
    expect(within(d).getByRole('slider', { name: 'Ampliación' })).toBeTruthy();
    expect(within(d).getByRole('img', { name: 'Vista previa del recorte' })).toBeTruthy();
    const grup = within(d).getByRole('radiogroup', { name: 'Forma' });
    expect(within(grup).getByRole('radio', { name: 'Panorámico (16:9)' })).toBeTruthy();
    expect(within(grup).getByRole('radio', { name: 'Cuadrado (1:1)' }).checked).toBe(true);
    expect(within(grup).getByText('Orig.')).toBeTruthy();
    expect(d.querySelector('.sdp-enquadrament__didactica').textContent)
      .toBe(`Cuadrado (1:1) · ${ES['editor.enquadrament.ajudaCapcaleraQuadrada']}`);
    fireEvent.click(within(grup).getByRole('radio', { name: 'Vertical alargado (9:16)' }));
    expect(d.querySelector('.sdp-enquadrament__didactica').textContent)
      .toBe(`Vertical alargado (9:16) · ${ES['editor.enquadrament.ajudaCapcaleraLliure']}`);
  });

  test('eu: la píndola curta de l’original i el nom de la forma, en basc', async () => {
    const vista = muntaHook('eu');
    await obri(vista);
    const grup = vista.getByRole('radiogroup', { name: 'Forma' });
    expect(within(grup).getByRole('radio', { name: 'Jatorrizkoa' })).toBeTruthy();
    expect(within(grup).getByText('Jat.')).toBeTruthy();
    expect(within(grup).queryByText('Orig.')).toBeNull();
    expect(vista.getByRole('dialog', { name: 'Moztu goiburua' })).toBeTruthy();
  });

  test('en: els botons de la foto i l’ajuda de sèrie (AJUDA_FOTO) dins del diàleg; una etiqueta del pare es respecta', async () => {
    const vista = muntaHook('en', { forma: 'avatar', extres: { onCanviaFoto: () => null, ajudaFoto: AJUDA_FOTO, onLleva: vi.fn() } });
    await obri(vista);
    const d = vista.getByRole('dialog', { name: 'Crop the photo' });
    const canvia = within(d).getByRole('button', { name: 'Change photo' });
    expect(within(d).getByRole('button', { name: 'Remove the photo' })).toBeTruthy();
    expect(document.getElementById(canvia.getAttribute('aria-describedby')).textContent).toBe('PNG, JPEG or WebP, up to 10 MB.');
    cleanup();
    const propia = muntaHook('en', { forma: 'avatar', extres: { onLleva: vi.fn(), etiquetaLleva: 'Llevar avatar', ajudaFoto: 'Text propi' } });
    await obri(propia);
    expect(within(propia.getByRole('dialog')).getByRole('button', { name: 'Llevar avatar' })).toBeTruthy();
    expect(propia.getByText('Text propi')).toBeTruthy();
  });

  /* Gauntlet T5c-V1 · El lliscador de l'ampliació del retallador senzill (la
     finestra del Perfil) també diu el percentatge a l'anglesa: sense el `t`
     de textAmpliacio diria «120 %», com el valencià. En castellà no es veu:
     «{n} %» coincidix amb la reserva. */
  test('en: el lliscador de l’ampliació diu el percentatge a l’anglesa (120%, sense espai)', async () => {
    const vista = muntaHook('en');
    await obri(vista);
    const lliscador = within(dialeg(vista)).getByRole('slider', { name: 'Zoom' });
    expect(lliscador.disabled).toBe(false);
    expect(lliscador.getAttribute('aria-valuetext')).toBe('100%');
    fireEvent.change(lliscador, { target: { value: '1.2' } });
    expect(lliscador.getAttribute('aria-valuetext')).toBe('120%');
    expect(lliscador.getAttribute('aria-valuetext')).not.toBe(textAmpliacio(1.2));
  });

  test('es: els avisos de la foto triada (onError d’obri i el retorn de canvia) en la llengua de l’App', async () => {
    const vista = muntaHook('es');
    act(() => { vista.hook().obri(foto('text/plain', 'nota.txt')); });
    expect(vista.onError).toHaveBeenLastCalledWith('Solo puedes subir fotos PNG, JPEG o WebP.');
    act(() => { vista.hook().obri(null); });
    expect(vista.onError).toHaveBeenLastCalledWith('No has elegido ninguna imagen.');
    await obri(vista);
    expect(vista.hook().canvia(pesat(11, 'image/png'))).toBe('Esta foto ocupa más de 10 MB. Elige una más ligera.');
  });

  test('fora de l’App, el valencià de sempre: el mateix text que dins de l’App en valencià', async () => {
    const sense = muntaHook(null);
    await obri(sense);
    const textSense = dialeg(sense).textContent;
    const nomsSense = [...dialeg(sense).querySelectorAll('[aria-label]')].map((n) => n.getAttribute('aria-label'));
    cleanup();
    const ambCa = muntaHook('ca');
    await obri(ambCa);
    expect(dialeg(ambCa).textContent).toBe(textSense);
    expect([...dialeg(ambCa).querySelectorAll('[aria-label]')].map((n) => n.getAttribute('aria-label'))).toEqual(nomsSense);
    expect(textSense).toContain('Retalla la capçalera');
    expect(peu(ambCa)).toEqual(['Restablir', 'Cancel·lar', 'Guardar']);
  });
});

describe('el T46 de les Notes dins de l’App', () => {
  test('es: títol de sèrie, peu, lliscadors amb el seu valor llegible, forma i visor', async () => {
    const vista = muntaT46('es');
    await carregat();
    const d = vista.getByRole('dialog', { name: 'Encuadrar la imagen' });
    expect(d.querySelector('.sdp-dialeg__descripcio').textContent).toBe(ES['editor.enquadrament.descripcio']);
    expect(peu(vista)).toEqual(['Cancelar', 'Centrar', 'Guardar el encuadre']);
    expect(within(d).getByRole('slider', { name: 'Ampliación' })).toBeTruthy();
    const horitzontal = within(d).getByRole('slider', { name: 'Posición horizontal' });
    expect(horitzontal.getAttribute('aria-valuetext')).toBe('50 % desde la izquierda');
    const vertical = within(d).getByRole('slider', { name: 'Posición vertical' });
    expect(vertical.getAttribute('aria-valuetext')).toBe('50 % desde arriba');
    // La foto (4000 × 2000) ja omple el marc quadrat de dalt a baix.
    expect(within(d).getByText('En esta dirección la foto ya llena todo el marco.')).toBeTruthy();
    const grup = within(d).getByRole('group', { name: 'Forma' });
    expect(within(grup).getByRole('radio', { name: 'Panorámico (16:9)' })).toBeTruthy();
    expect(within(grup).getByRole('radio', { name: 'Superpanorámico (21:9)' })).toBeTruthy();
    const visor = within(d).getByRole('img', { name: 'Vista previa del encuadre' });
    expect(document.getElementById(visor.getAttribute('aria-describedby')).textContent).toBe(ES['editor.enquadrament.ajudaTeclat']);
  });

  test('es: el teclat sobre el visor s’anuncia en castellà (posició i ampliació)', async () => {
    const vista = muntaT46('es');
    await carregat();
    const visor = vista.getByRole('img', { name: 'Vista previa del encuadre' });
    const anunci = () => [...dialeg(vista).querySelectorAll('.sdp-nomes-lector[aria-live="polite"]')].map((n) => n.textContent).join('');
    fireEvent.keyDown(visor, { key: 'ArrowRight' });
    expect(anunci()).toMatch(/^Posición \d+ % desde la izquierda y \d+ % desde arriba$/);
    fireEvent.keyDown(visor, { key: '+' });
    expect(anunci()).toMatch(/^Ampliación \d+ %$/);
    expect(within(dialeg(vista)).getByRole('slider', { name: 'Ampliación' }).getAttribute('aria-valuetext')).toMatch(/^\d+ %$/);
  });

  /* Correcció T5c-G4 · En anglés, el percentatge va enganxat al número
     («50%»), també el de l'ampliació (textAmpliacio amb `t`). */
  test('en: els lliscadors i el teclat diuen el percentatge a l’anglesa (50%, sense espai)', async () => {
    const vista = muntaT46('en');
    await carregat();
    const d = dialeg(vista);
    expect(within(d).getByRole('slider', { name: 'Horizontal position' }).getAttribute('aria-valuetext')).toBe('50% from the left');
    expect(within(d).getByRole('slider', { name: 'Vertical position' }).getAttribute('aria-valuetext')).toBe('50% from the top');
    expect(within(d).getByRole('slider', { name: 'Zoom' }).getAttribute('aria-valuetext')).toBe('100%');
    const visor = within(d).getByRole('img', { name: EN['editor.enquadrament.visorEnquadrament'] });
    const anunci = () => [...d.querySelectorAll('.sdp-nomes-lector[aria-live="polite"]')].map((n) => n.textContent).join('');
    fireEvent.keyDown(visor, { key: 'ArrowRight' });
    expect(anunci()).toMatch(/^Position \d+% from the left and \d+% from the top$/);
    fireEvent.keyDown(visor, { key: '+' });
    expect(anunci()).toMatch(/^Zoom \d+%$/);
  });

  test('en: un títol i un nom del botó principal que passa el pare es respecten', async () => {
    const vista = muntaT46('en', { titol: 'Títol del pare', etiquetaDesa: 'Desa-ho' });
    await carregat();
    expect(vista.getByRole('dialog', { name: 'Títol del pare' })).toBeTruthy();
    expect(peu(vista)).toEqual(['Cancel', 'Centre', 'Desa-ho']);
  });

  test('es: els avisos de càrrega (fitxer, pes, HEIC i píxels) en castellà', async () => {
    const fallat = muntaT46('es', { carregador: vi.fn(async () => { throw new Error('x'); }) });
    await carregat();
    expect(within(dialeg(fallat)).getByText(ES['editor.enquadrament.errorFitxer'])).toBeTruthy();
    cleanup();
    const gran = muntaT46('es', { font: pesat(26) });
    await carregat();
    expect(within(dialeg(gran)).getByText('Esta foto ocupa más de 25 MB. Elige una más ligera.')).toBeTruthy();
    cleanup();
    const heic = muntaT46('es', { font: foto('image/heic', 'foto.heic'), carregador: vi.fn(async () => { throw new Error('x'); }) });
    await carregat();
    expect(within(dialeg(heic)).getByText(ES['editor.enquadrament.errorHeic'])).toBeTruthy();
    cleanup();
    const pixels = muntaT46('es', { imatge: { amplada: 20000, alcada: 100 } });
    await carregat();
    expect(within(dialeg(pixels)).getByText(ES['editor.enquadrament.errorPixels'])).toBeTruthy();
  });

  /* Correcció T5c-G3 · Les dues branques que cap prova en una altra llengua
     no mossegava: una adreça que no s'obri i el retall que no es pot preparar
     (l'exportador que falla, o qui puja que falla sense cap missatge). */
  test('en: una adreça que no s’obri diu errorUrl, en anglés', async () => {
    const vista = muntaT46('en', { font: 'https://exemple.test/foto.jpg', carregador: vi.fn(async () => { throw new Error('x'); }) });
    await carregat();
    expect(within(dialeg(vista)).getByText(EN['editor.enquadrament.errorUrl'])).toBeTruthy();
    expect(within(dialeg(vista)).queryByText(CA['editor.enquadrament.errorUrl'])).toBeNull();
  });

  test('en: si l’exportador falla, o qui puja falla sense missatge, l’avís és errorExporta en anglés', async () => {
    const exporta = muntaT46('en', { exportador: vi.fn(async () => { throw new Error('canvas'); }) });
    await carregat();
    await act(async () => { fireEvent.click(within(dialeg(exporta)).getByRole('button', { name: 'Save the framing' })); });
    expect(within(dialeg(exporta)).getByRole('alert').textContent).toBe(EN['editor.enquadrament.errorExporta']);
    expect(exporta.onDesa).not.toHaveBeenCalled();
    cleanup();
    const puja = muntaT46('en', { onDesa: vi.fn(async () => { throw new Error(''); }) });
    await carregat();
    await act(async () => { fireEvent.click(within(dialeg(puja)).getByRole('button', { name: 'Save the framing' })); });
    expect(puja.onDesa).toHaveBeenCalledTimes(1);
    expect(within(dialeg(puja)).getByRole('alert').textContent).toBe(EN['editor.enquadrament.errorExporta']);
  });

  test('en: «Vull geolocalitzar aquesta imatge», els camps, els errors i la línia del que es desarà (amb el separador dels milers)', async () => {
    const lectorMetadades = vi.fn(async () => ({ gps: null, dataCaptura: null }));
    const vista = muntaT46('en', { permetGeolocalitzacio: true, lectorMetadades });
    await carregat();
    const d = dialeg(vista);
    const casella = within(d).getByRole('checkbox', { name: /I want to geotag this image/ });
    await act(async () => { fireEvent.click(casella); });
    expect(within(d).getByText(EN['editor.enquadrament.geoSense'])).toBeTruthy();
    expect(within(d).getByText('There is no location to save yet.')).toBeTruthy();
    const grup = within(d).getByRole('group', { name: 'Accuracy' });
    expect(within(grup).getAllByRole('radio').map((r) => r.labels[0].firstChild.textContent)).toEqual(['Exact', 'About 100 m', 'Town only']);
    fireEvent.change(within(d).getByLabelText('Latitude'), { target: { value: '200' } });
    expect(within(d).getByText('Enter a latitude between -90 and 90 (for example, 38.5919).')).toBeTruthy();
    // Desar sense punt: l'avís nomena la casella tal com es veu.
    await act(async () => { fireEvent.click(within(d).getByRole('button', { name: 'Save the framing' })); });
    expect(within(d).getByRole('alert').textContent)
      .toBe('The location is missing: enter the latitude and longitude or untick “I want to geotag this image”.');
    fireEvent.change(within(d).getByLabelText('Latitude'), { target: { value: '38.5919' } });
    fireEvent.change(within(d).getByLabelText('Longitude'), { target: { value: '-0.4184' } });
    expect(within(d).getByText('It will be saved as: 38.59, -0.42 (about 1,000 m).')).toBeTruthy();
  });

  test('gl: la ubicació trobada a la foto, la data i la precisió de 100 m', async () => {
    const lectorMetadades = vi.fn(async () => ({ gps: { lat: 38.5919, lng: -0.4184 }, dataCaptura: '2024-05-01T10:00:00' }));
    const vista = muntaT46('gl', { permetGeolocalitzacio: true, lectorMetadades });
    await carregat();
    const d = dialeg(vista);
    await act(async () => { fireEvent.click(within(d).getByRole('checkbox', { name: /Quero xeolocalizar esta imaxe/ })); });
    expect(within(d).getByText(GL['editor.enquadrament.geoTrobada'])).toBeTruthy();
    expect(within(d).getByText('Data da foto: 2024-05-01 10:00:00')).toBeTruthy();
    fireEvent.click(within(d).getByRole('radio', { name: /Uns 100 m/ }));
    expect(within(d).getByText('Gardarase: 38.592, -0.418 (uns 100 m).')).toBeTruthy();
  });
});

describe('la casella de l’EXIF (CasellaExif) i l’avís del GPS, dins de l’App', () => {
  const lectura = Object.freeze({
    gps: { lat: 38.5919, lng: -0.4184 }, dataCaptura: '2024-05-01T10:00:00', estat: 'publicable',
    contingut: { ubicacio: true, data: true, marca: true, model: true, serie: true },
  });

  test('es: l’etiqueta, l’avís amb les dades de la càmera, les píndoles de precisió i la línia del que es desarà', async () => {
    const vista = muntaT46('es', { ofereixConservarExif: true, lectorExif: vi.fn(async () => lectura) });
    await carregat();
    const d = dialeg(vista);
    const casella = within(d).getByRole('checkbox', { name: /Conserva la ubicación y la fecha de la foto/ });
    expect(document.getElementById(casella.getAttribute('aria-describedby')).textContent).toBe(
      'Si la dejas marcada, la ubicación se publicará con la foto. También se publicarán los datos de la cámara: la marca, el modelo y el número de serie.',
    );
    const precisio = within(d).getByRole('radiogroup', { name: 'Precisión de la ubicación' });
    expect(within(precisio).getAllByRole('radio').map((r) => r.labels[0].textContent)).toEqual(['Exacta', 'Unos 100 m', 'Solo el pueblo']);
    expect(within(d).getByText('Se guardará: 38.59190, -0.41840 (exacta). El punto de la foto, a un metro.')).toBeTruthy();
  });

  /* Correcció T5c-G2 · L'abast i el separador dels milers de la línia del
     que es desarà (textUbicacio amb `t`): en castellà, «exacta» coincidix
     amb el valencià i no ho podia demostrar. */
  test('en: les píndoles de 100 m i del poble canvien la línia del que es desarà (abast i milers en anglés)', async () => {
    const vista = muntaT46('en', { ofereixConservarExif: true, lectorExif: vi.fn(async () => lectura) });
    await carregat();
    const d = dialeg(vista);
    const precisio = within(d).getByRole('radiogroup', { name: 'Location accuracy' });
    expect(within(d).getByText('It will be saved as: 38.59190, -0.41840 (exact). The photo’s spot, to within a metre.')).toBeTruthy();
    fireEvent.click(within(precisio).getByRole('radio', { name: 'About 100 m' }));
    expect(within(d).getByText('It will be saved as: 38.592, -0.418 (about 100 m). You can see the area, not the exact spot.')).toBeTruthy();
    fireEvent.click(within(precisio).getByRole('radio', { name: 'Town only' }));
    expect(within(d).getByText('It will be saved as: 38.59, -0.42 (about 1,000 m). Within a kilometre: no house can be pinpointed.')).toBeTruthy();
    expect(within(d).queryByText(/uns 1\.000 m|exacta/)).toBeNull();
  });

  test('eu: una foto que només porta la càmera: «Gorde argazkiaren kameraren datuak» i la llista en basc', async () => {
    const camera = { estat: 'publicable', tiff: new Uint8Array(8), contingut: { marca: true, model: true } };
    const vista = muntaT46('eu', { ofereixConservarExif: true, lectorExif: vi.fn(async () => camera) });
    await carregat();
    const casella = vista.getByRole('checkbox', { name: /Gorde argazkiaren kameraren datuak/ });
    expect(document.getElementById(casella.getAttribute('aria-describedby')).textContent)
      .toBe('Markatuta uzten baduzu, kameraren datuak argazkiarekin argitaratuko dira: marka eta modeloa.');
  });

  test('en: un EXIF que no es pot conservar ho diu, i desar-la marcada avisa amb l’etiqueta traduïda', async () => {
    const noConservable = { estat: 'no-conservable', gps: { lat: 1, lng: 1 }, contingut: { ubicacio: true } };
    const vista = muntaT46('en', { ofereixConservarExif: true, lectorExif: vi.fn(async () => noConservable) });
    await carregat();
    const d = dialeg(vista);
    const esperat = 'This photo’s location and date cannot be kept; untick “Keep the photo’s location and date” to upload it without them.';
    const casella = within(d).getByRole('checkbox', { name: /Keep the photo’s location and date/ });
    expect(document.getElementById(casella.getAttribute('aria-describedby')).textContent).toBe(esperat);
    await act(async () => { fireEvent.click(within(d).getByRole('button', { name: 'Save the framing' })); });
    expect(within(d).getByRole('alert').textContent).toBe(esperat);
    expect(vista.onDesa).not.toHaveBeenCalled();
  });

  test('en: desar abans de vore la casella demana revisar-la, en anglés', async () => {
    let resol;
    const lectorExif = vi.fn(() => new Promise((r) => { resol = r; }));
    const vista = muntaT46('en', { ofereixConservarExif: true, lectorExif });
    await carregat();
    const d = dialeg(vista);
    await act(async () => { fireEvent.click(within(d).getByRole('button', { name: 'Save the framing' })); });
    expect(within(d).queryByRole('alert')).toBeNull();
    await act(async () => { resol(lectura); });
    expect(within(d).getByRole('alert').textContent).toBe(EN['editor.enquadrament.exifRevisa']);
  });

  test('en: una foto d’identitat amb GPS diu que l’ha eliminat, en anglés', async () => {
    const vista = muntaT46('en', { senzill: true, avisaGpsEliminat: true, lectorExif: vi.fn(async () => lectura) });
    await carregat();
    expect(within(dialeg(vista)).getByText('🔒 For your privacy, the GPS data has been removed from your profile photo')).toBeTruthy();
  });
});

describe('paritat dels parells de l’enquadrament', () => {
  /* Tots els parells [clau, reserva] que els mòduls exporten o lliuren. */
  const parells = () => {
    const tots = [
      ...Object.values(TEXTOS_ENQUADRAMENT), ...Object.values(TEXTOS_UBICACIO), ...Object.values(PARELLS_FORMA),
      ...Object.values(PARELLS_PRECISIO).flatMap((p) => [p.etiqueta, p.ajuda]), PARELL_CASELLA_GEO, ...PARELLS_DE_SERIE.values(),
      PARELL_PERCENTATGE,
    ];
    return tots.filter((p) => p[0].startsWith('editor.enquadrament.'));
  };
  const DICCIONARIS = { es: ES, en: EN, eu: EU, gl: GL };
  const marcadors = (text) => [...String(text).matchAll(/\{\w+\}/g)].map((m) => m[0]).sort().join(' ');

  test('en valencià, cada clau diu exactament la reserva del codi (dins i fora de l’App es veu el mateix)', () => {
    const diferents = parells().filter(([clau, reserva]) => CA[clau] !== reserva).map(([clau]) => clau);
    expect(parells().length).toBeGreaterThan(60);
    expect(diferents).toEqual([]);
  });

  test.each(Object.keys(DICCIONARIS))('%s: cada clau hi és, no és buida i porta els mateixos marcadors', (codi) => {
    const dic = DICCIONARIS[codi];
    const mal = parells().filter(([clau, reserva]) => typeof dic[clau] !== 'string' || !dic[clau].trim() || marcadors(dic[clau]) !== marcadors(reserva));
    expect(mal.map(([clau]) => clau)).toEqual([]);
  });

  test('cada forma de FORMATS té el seu parell, i la reserva és la seua etiqueta', () => {
    expect(FORMATS.filter((f) => PARELLS_FORMA[f.valor]?.[1] !== f.etiqueta).map((f) => f.valor)).toEqual([]);
  });

  test('el castellà i l’anglés no copien el valencià en els textos llargs (cap clau sense traduir)', () => {
    const llargs = parells().filter(([, reserva]) => reserva.length > 20);
    for (const dic of [ES, EN]) expect(llargs.filter(([clau, reserva]) => dic[clau] === reserva).map(([clau]) => clau)).toEqual([]);
  });

  test('en basc, cap sufix enganxat a un marcador', () => {
    const enganxats = Object.entries(EU).filter(([clau, valor]) => clau.startsWith('editor.enquadrament.') && /\{\w+\}[\p{L}-]/u.test(valor));
    expect(enganxats).toEqual([]);
  });
});
