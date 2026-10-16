import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/* T46 (ordre del Mestre, 260928) · processaFitxer és el cos d'handleFileChange
   amb un File directe. jsdom no pot comprimir (sense canvas): compressImage i
   el fetch del data URL (fitxerDeDataUrl) se simulen. */
const dobles = vi.hoisted(() => ({ compressImage: vi.fn() }));
vi.mock('../utils/imageUtils.js', () => ({ compressImage: dobles.compressImage }));

import useHeroImageHandler, { MIDA_MAXIMA_IMATGE, validaFitxerImatge } from './useHeroImageHandler.js';
import { ERROR_PRESSUPOST, MAX_CODIFICACIONS, QUALITATS_DE_LA_CERCA, QUALITAT_MINIMA } from '../utils/pujadaImatge.js';

const CURT = 'data:image/webp;base64,AAAA';
const LLARG = `data:image/webp;base64,${'A'.repeat(150001)}`;
const foto = (tipus = 'image/jpeg') => new File(['x'], 'foto.jpg', { type: tipus });
const pesada = () => {
  const fitxer = foto();
  Object.defineProperty(fitxer, 'size', { value: MIDA_MAXIMA_IMATGE + 1 });
  return fitxer;
};

beforeEach(() => {
  dobles.compressImage.mockReset();
  dobles.compressImage.mockResolvedValue(CURT);
  vi.stubGlobal('fetch', vi.fn(async () => ({ blob: async () => new Blob(['w'], { type: 'image/webp' }) })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const munta = (props = {}) => {
  const onSaveField = vi.fn();
  const onError = vi.fn();
  const { result } = renderHook(() => useHeroImageHandler({ onSaveField, onError, ...props }));
  return { result, onSaveField, onError };
};

test('T46 · validaFitxerImatge torna null o el missatge de sempre', () => {
  expect(validaFitxerImatge(foto())).toBeNull();
  expect(validaFitxerImatge(foto('application/pdf'))).toBe('Només imatges, de moment.');
  expect(validaFitxerImatge(pesada())).toBe('La imatge passa de 5 MB. És massa pesada per processar-la.');
  expect(validaFitxerImatge(null)).toBe('No has triat cap imatge.');
});

test('T46 · processaFitxer amb pujada: desa l’URL del servidor i torna true', async () => {
  const onImageUpload = vi.fn(async () => 'sdp-media://mitjans_privats/t/u/notes/a.webp');
  const { result, onSaveField, onError } = munta({ onImageUpload });
  let fet;
  await act(async () => { fet = await result.current.processaFitxer(foto()); });
  expect(fet).toBe(true);
  // El primer esglaó és exactament el d'abans.
  expect(dobles.compressImage).toHaveBeenCalledTimes(1);
  expect(dobles.compressImage).toHaveBeenCalledWith(expect.any(File), { maxSize: 1200, format: 'image/webp', quality: 0.8 });
  expect(onImageUpload.mock.calls[0][0].name).toBe('heroImage.webp');
  expect(onSaveField).toHaveBeenCalledWith('heroImage', 'sdp-media://mitjans_privats/t/u/notes/a.webp');
  expect(onError).not.toHaveBeenCalled();
});

test('T46 · el logotip continua a 600 px', async () => {
  const { result, onSaveField } = munta({ fieldName: 'logoImage' });
  await act(async () => { await result.current.processaFitxer(foto()); });
  expect(dobles.compressImage).toHaveBeenCalledWith(expect.any(File), { maxSize: 600, format: 'image/webp', quality: 0.8 });
  expect(onSaveField).toHaveBeenCalledWith('logoImage', CURT);
});

test('T46 · un fitxer que no és imatge o que pesa massa: el missatge de sempre i false', async () => {
  const { result, onSaveField, onError } = munta();
  let fet;
  await act(async () => { fet = await result.current.processaFitxer(foto('video/mp4')); });
  expect(fet).toBe(false);
  expect(onError).toHaveBeenLastCalledWith('Només imatges, de moment.');
  await act(async () => { fet = await result.current.processaFitxer(pesada()); });
  expect(fet).toBe(false);
  expect(onError).toHaveBeenLastCalledWith('La imatge passa de 5 MB. És massa pesada per processar-la.');
  expect(dobles.compressImage).not.toHaveBeenCalled();
  expect(onSaveField).not.toHaveBeenCalled();
});

test('T46 · handleFileChange buida l’input i delega en processaFitxer', async () => {
  const { result, onSaveField } = munta();
  const event = { target: { files: [foto()], value: 'C:\\fakepath\\foto.jpg' } };
  let fet;
  await act(async () => { fet = await result.current.handleFileChange(event); });
  expect(event.target.value).toBe('');
  expect(fet).toBe(true);
  expect(onSaveField).toHaveBeenCalledWith('heroImage', CURT);
  // Sense fitxer (selector cancel·lat), res.
  await act(async () => { fet = await result.current.handleFileChange({ target: { files: [], value: '' } }); });
  expect(fet).toBe(false);
  expect(onSaveField).toHaveBeenCalledTimes(1);
});

/* Gauntlet 261016 (Bloc 1, Llei del Quadrat) · Abans el segon esglaó
   encongia la capçalera a 960 px. Ara la mida és fixa (1.200): el segon
   intent només baixa la qualitat.
   Gauntlet 261016 (P1 de l'auditoria adversarial) · Abans el segon intent era
   0,72 i s'aturava. Ara la cerca prova 0,4 i, com que hi cap, puja fins a la
   qualitat més alta que hi cap per davall del sostre (0,76). */
test('T46 · sense servidor, un data URL massa llarg es torna a comprimir amb menys qualitat, a la mateixa mida', async () => {
  dobles.compressImage.mockResolvedValueOnce(LLARG).mockResolvedValueOnce(CURT);
  const { result, onSaveField, onError } = munta();
  let fet;
  await act(async () => { fet = await result.current.processaFitxer(foto()); });
  expect(fet).toBe(true);
  expect(dobles.compressImage.mock.calls.map(([, o]) => o)).toEqual(
    [0.8, 0.4, 0.6, 0.68, 0.72, 0.76].map((quality) => ({ maxSize: 1200, format: 'image/webp', quality })),
  );
  expect(onSaveField).toHaveBeenCalledWith('heroImage', CURT);
  expect(onError).not.toHaveBeenCalled();
});

/* Gauntlet 261016 · Els esglaons T46 (més xicotet a cada pas) ja només són
   del logotip; abans esta prova els fixava per a la capçalera. */
test('T46 · el logotip: si cap esglaó hi cap, el missatge d’abans i false', async () => {
  dobles.compressImage.mockResolvedValue(LLARG);
  const onImageUpload = vi.fn(async () => null); // sense la capacitat 'mitjans'
  const { result, onSaveField, onError } = munta({ fieldName: 'logoImage', onImageUpload });
  let fet;
  await act(async () => { fet = await result.current.processaFitxer(foto()); });
  expect(fet).toBe(false);
  expect(dobles.compressImage).toHaveBeenCalledTimes(4);
  expect(dobles.compressImage.mock.calls.at(-1)[1]).toEqual({ maxSize: 300, format: 'image/webp', quality: 0.7 });
  expect(onImageUpload).toHaveBeenCalledTimes(4);
  expect(onError).toHaveBeenCalledWith("La imatge no s'ha pogut pujar al servidor i és massa gran (més de 150KB) per desar-la directament.");
  expect(onSaveField).not.toHaveBeenCalled();
});

test('Gauntlet 261016 · la capçalera, sense URL del servidor i amb un data URL massa llarg: UNA compressió, UNA pujada i el missatge d’abans', async () => {
  dobles.compressImage.mockResolvedValue(LLARG); // el fetch simulat en fa un fitxer d'1 byte: cap al pressupost
  const onImageUpload = vi.fn(async () => null);
  const { result, onSaveField, onError } = munta({ onImageUpload });
  let fet;
  await act(async () => { fet = await result.current.processaFitxer(foto()); });
  expect(fet).toBe(false);
  expect(dobles.compressImage.mock.calls.map(([, o]) => o)).toEqual([{ maxSize: 1200, format: 'image/webp', quality: 0.8 }]);
  expect(onImageUpload).toHaveBeenCalledTimes(1);
  expect(onError).toHaveBeenCalledWith("La imatge no s'ha pogut pujar al servidor i és massa gran (més de 150KB) per desar-la directament.");
  expect(onSaveField).not.toHaveBeenCalled();
});

test('T46 · amb URL del servidor no hi ha esglaons: la mida del data URL no importa', async () => {
  dobles.compressImage.mockResolvedValue(LLARG);
  const onImageUpload = vi.fn(async () => 'sdp-media://mitjans/a.webp');
  const { result, onSaveField } = munta({ onImageUpload });
  await act(async () => { await result.current.processaFitxer(foto()); });
  expect(dobles.compressImage).toHaveBeenCalledTimes(1);
  expect(onSaveField).toHaveBeenCalledWith('heroImage', 'sdp-media://mitjans/a.webp');
});

test('Onada 4 · K2 · opcions.pesMaxim canvia el límit només per a eixa crida; sense opcions, el de sempre', async () => {
  const MB = 1024 * 1024;
  const de7MB = () => {
    const fitxer = foto();
    Object.defineProperty(fitxer, 'size', { value: 7 * MB });
    return fitxer;
  };
  const { result, onSaveField, onError } = munta();
  let fet;
  await act(async () => { fet = await result.current.processaFitxer(de7MB(), { pesMaxim: 25 * MB }); });
  expect(fet).toBe(true);
  expect(onSaveField).toHaveBeenCalledWith('heroImage', CURT);
  // La crida següent, sense opcions, torna al límit de 5 MB.
  await act(async () => { fet = await result.current.processaFitxer(de7MB()); });
  expect(fet).toBe(false);
  expect(onError).toHaveBeenLastCalledWith('La imatge passa de 5 MB. És massa pesada per processar-la.');
  // handleFileChange passa les opcions; com a onChange (només l'esdeveniment), el de sempre.
  await act(async () => { fet = await result.current.handleFileChange({ target: { files: [de7MB()], value: 'x' } }, { pesMaxim: 25 * MB }); });
  expect(fet).toBe(true);
  await act(async () => { fet = await result.current.handleFileChange({ target: { files: [de7MB()], value: 'x' } }); });
  expect(fet).toBe(false);
  // Un valor absurd no obri la porta: el de sempre.
  for (const pesMaxim of [0, -1, Number.NaN, 'molt', null]) {
    await act(async () => { fet = await result.current.processaFitxer(de7MB(), { pesMaxim }); });
    expect(fet).toBe(false);
  }
  expect(dobles.compressImage).toHaveBeenCalledTimes(2);
});

test('Onada 4 (retallador senzill) · opcions.midaMaxima fixa el costat llarg de la compressió només per a eixa crida', async () => {
  const { result } = munta({ fieldName: 'heroImage' });
  await act(async () => { await result.current.processaFitxer(foto(), { midaMaxima: 1600 }); });
  expect(dobles.compressImage).toHaveBeenLastCalledWith(expect.any(File), { maxSize: 1600, format: 'image/webp', quality: 0.8 });
  // Sense opcions, el de sempre (1.200 la capçalera); un valor absurd, també.
  await act(async () => { await result.current.processaFitxer(foto()); });
  expect(dobles.compressImage).toHaveBeenLastCalledWith(expect.any(File), { maxSize: 1200, format: 'image/webp', quality: 0.8 });
  for (const midaMaxima of [0, -5, Number.NaN, 'gran', null]) {
    await act(async () => { await result.current.processaFitxer(foto(), { midaMaxima }); });
    expect(dobles.compressImage.mock.calls.at(-1)[1].maxSize).toBe(1200);
  }
});

/* ── Gauntlet 261016 (Bloc 1, Llei del Quadrat) ──
   Un fetch que torna els bytes de veres del data URL (amb el tipus de la seua
   capçalera) i un codificador fals que en fa el pes que toca: així es llig el
   tipus real del fitxer i el pes que puja de veres. */
const FIRMA_PNG = String.fromCharCode(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13) + 'IHDR';
const FIRMA_WEBP = 'RIFF\u0000\u0000\u0000\u0000WEBPVP8 ';
const FIRMA_JPEG = String.fromCharCode(0xff, 0xd8, 0xff, 0xe0);
/* «<80 KB» en decimal i estricte (abans 80 · 1.024 = 81.920 amb <=). */
const PRESSUPOST = 80000;
const URL_PUJADA = 'sdp-media://mitjans/t/u/portades/a.webp';
/** Un data URL de `pes` bytes que comencen per la firma. */
const dataUrlDe = (tipus, firma, pes) => `data:${tipus};base64,${btoa(firma + 'x'.repeat(Math.max(0, pes - firma.length)))}`;
function fetchDeVeres() {
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    const coma = url.indexOf(',');
    const tipus = /^data:([^;,]*)/.exec(url)?.[1] || '';
    const bytes = Uint8Array.from(atob(url.slice(coma + 1)), (c) => c.charCodeAt(0));
    return { blob: async () => new Blob([bytes], { type: tipus }) };
  }));
}
/* El pes creix amb els píxels i amb la qualitat: f · costat² · qualitat. */
const pesDe = (f, maxSize, quality) => Math.round(f * maxSize * maxSize * quality);
const codificador = (f) => async (_fitxer, { maxSize, quality }) => dataUrlDe('image/webp', FIRMA_WEBP, pesDe(f, maxSize, quality));
/* Safari 16: el canvas no sap WebP i torna PNG (sis vegades més pesat); en JPEG, el que se li demana. */
const codificadorSafari16 = (f) => async (_fitxer, { maxSize, format, quality }) => (format === 'image/jpeg'
  ? dataUrlDe('image/jpeg', FIRMA_JPEG, pesDe(f, maxSize, quality))
  : dataUrlDe('image/png', FIRMA_PNG, 6 * pesDe(f, maxSize, quality)));
const intents = () => dobles.compressImage.mock.calls.map(([, o]) => [o.maxSize, o.quality]);

test('Gauntlet 261016 · l’avatar ix a 400 px (MIDA_AVATAR) i el logotip continua a 600: ja no són la mateixa constant', async () => {
  const avatar = munta({ fieldName: 'avatarImage' });
  await act(async () => { await avatar.result.current.processaFitxer(foto()); });
  expect(dobles.compressImage).toHaveBeenLastCalledWith(expect.any(File), { maxSize: 400, format: 'image/webp', quality: 0.8 });
  const logotip = munta({ fieldName: 'logoImage' });
  await act(async () => { await logotip.result.current.processaFitxer(foto()); });
  expect(dobles.compressImage).toHaveBeenLastCalledWith(expect.any(File), { maxSize: 600, format: 'image/webp', quality: 0.8 });
  // Sense servidor no es fa cap fitxer: cap fetch del data URL, com sempre.
  expect(fetch).not.toHaveBeenCalled();
});

/* Gauntlet 261016 · Un codificador fals que només sap PNG (també quan se li
   demana el JPEG de reserva): el fitxer diu PNG, que és el que porta. Abans
   el primer cas es deia «Safari 16»; Safari 16 ara puja JPEG (prova de baix). */
test.each([
  ['un codificador que només torna PNG', 'image/png'],
  ['la capçalera diu WebP però els bytes són PNG: manen els bytes', 'image/webp'],
])('Gauntlet 261016 · el fitxer que puja porta el tipus real: %s', async (_cas, capcalera) => {
  fetchDeVeres();
  dobles.compressImage.mockResolvedValue(dataUrlDe(capcalera, FIRMA_PNG, 2000));
  const onImageUpload = vi.fn(async () => URL_PUJADA);
  const { result, onSaveField } = munta({ onImageUpload });
  await act(async () => { await result.current.processaFitxer(foto()); });
  const pujat = onImageUpload.mock.calls[0][0];
  expect([pujat.name, pujat.type, pujat.size]).toEqual(['heroImage.png', 'image/png', 2000]);
  expect(onSaveField).toHaveBeenCalledWith('heroImage', URL_PUJADA);
});

/* Gauntlet 261016 (Bloc 1, Llei del Quadrat) · Abans els intents rebaixaven
   la capçalera a 960, 768 i 600 px, el pressupost era de 81.920 bytes amb <=
   i, si cap intent hi arribava, pujava el més lleuger. L'ordre (prompt Bloc 1
   i pla §0.1.1) i l'auditoria de Codex (01:31 i 01:36) ho giren: la mida és
   fixa, només baixa la qualitat, menys de 80.000 bytes, i si no hi cap,
   l'error honest i cap pujada.
   Gauntlet 261016 (P1 de l'auditoria adversarial) · L'escala fixa (0,8 →
   0,4, la qualitat només baixava i pujava el primer que hi cabia) deixava
   fora les fotos del poble amb els codificadors de veres. Ara, després del
   sostre, la cerca binària va amunt i avall fins a la qualitat MÉS ALTA que
   hi cap, i puja el millor intent. Una foto que abans no hi cabia ni a 0,4
   ara puja. */
describe('Gauntlet 261016 · la capçalera i la targeta pugen per davall de 80.000 bytes, sempre a 1.200 px', () => {
  test.each([
    ['ja hi cap: un sol intent, el d’abans', 0.05, [0.8], 0.8],
    ['la més alta que hi cap és 0,68 (abans pujava 0,64)', 0.08, [0.8, 0.4, 0.6, 0.68, 0.72], 0.68],
    ['la més alta que hi cap és 0,52 (abans, 0,48)', 0.1, [0.8, 0.4, 0.6, 0.48, 0.52, 0.56], 0.52],
    ['la més alta que hi cap és 0,44 (abans, 0,4)', 0.12, [0.8, 0.4, 0.6, 0.48, 0.44], 0.44],
    ['abans no hi cabia ni a 0,4 (ERROR_PRESSUPOST): ara puja a 0,16', 0.3, [0.8, 0.4, 0.2, 0.08, 0.12, 0.16], 0.16],
  ])('%s', async (_cas, f, qualitats, millor) => {
    fetchDeVeres();
    dobles.compressImage.mockImplementation(codificador(f));
    const onImageUpload = vi.fn(async () => URL_PUJADA);
    const { result, onSaveField, onError } = munta({ onImageUpload });
    let fet;
    await act(async () => { fet = await result.current.processaFitxer(foto()); });
    expect(fet).toBe(true);
    // La mida no canvia mai, i mai més de MAX_CODIFICACIONS.
    expect(intents()).toEqual(qualitats.map((q) => [1200, q]));
    expect(intents().length).toBeLessThanOrEqual(MAX_CODIFICACIONS);
    // La més alta de la reixa que hi cap, mirant-les totes.
    expect(millor).toBe([...QUALITATS_DE_LA_CERCA].reverse().find((q) => pesDe(f, 1200, q) < PRESSUPOST));
    // UNA pujada: la del millor intent.
    expect(onImageUpload).toHaveBeenCalledTimes(1);
    const pujat = onImageUpload.mock.calls[0][0];
    expect(pujat.size).toBeLessThan(PRESSUPOST);
    expect(pujat.size).toBe(pesDe(f, 1200, millor));
    expect([pujat.name, pujat.type]).toEqual(['heroImage.webp', 'image/webp']);
    expect(onSaveField).toHaveBeenCalledWith('heroImage', URL_PUJADA);
    expect(onError).not.toHaveBeenCalled();
  });

  test('estricte: un intent de 80.000 bytes exactes no hi cap; el de 79.999, sí', async () => {
    fetchDeVeres();
    const pes = (q) => (q === 0.8 ? 80000 : 79999);
    dobles.compressImage.mockImplementation(async (_f, { quality }) => dataUrlDe('image/webp', FIRMA_WEBP, pes(quality)));
    const onImageUpload = vi.fn(async () => URL_PUJADA);
    const { result } = munta({ onImageUpload });
    await act(async () => { await result.current.processaFitxer(foto()); });
    expect(intents()).toEqual([0.8, 0.4, 0.6, 0.68, 0.72, 0.76].map((q) => [1200, q]));
    expect(onImageUpload.mock.calls.map(([f]) => f.size)).toEqual([79999]);
  });

  /* Abans, 0,5 (a 0,4 pesava 288.000 B); amb la cerca, eixa foto ja hi cap a
     0,08. Ara, una que no hi cap ni a la qualitat mínima (86.400 B a 0,04). */
  test('si cap intent no hi arriba: l’error honest, cap pujada i res desat', async () => {
    fetchDeVeres();
    dobles.compressImage.mockImplementation(codificador(1.5));
    const onImageUpload = vi.fn(async () => URL_PUJADA);
    const { result, onSaveField, onError } = munta({ onImageUpload });
    let fet;
    await act(async () => { fet = await result.current.processaFitxer(foto()); });
    expect(fet).toBe(false);
    expect(intents()).toEqual([0.8, 0.4, 0.2, 0.08, 0.04].map((q) => [1200, q]));
    expect(intents().at(-1)[1]).toBe(QUALITAT_MINIMA);
    expect(Math.min(...QUALITATS_DE_LA_CERCA.map((q) => pesDe(1.5, 1200, q)))).toBeGreaterThan(PRESSUPOST);
    expect(onImageUpload).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(ERROR_PRESSUPOST);
    expect(ERROR_PRESSUPOST).toBe('La imatge pesa massa fins i tot comprimida; prova amb una altra foto.');
    expect(onSaveField).not.toHaveBeenCalled();
  });

  test('el retall de la fitxa (midaMaxima) no canvia de mida en cap intent', async () => {
    fetchDeVeres();
    dobles.compressImage.mockImplementation(codificador(0.15));
    const onImageUpload = vi.fn(async () => URL_PUJADA);
    const { result } = munta({ onImageUpload });
    await act(async () => { await result.current.processaFitxer(foto(), { midaMaxima: 1000 }); });
    expect(intents()).toEqual([0.8, 0.4, 0.6, 0.48, 0.52, 0.56].map((q) => [1000, q]));
    expect(onImageUpload.mock.calls[0][0].size).toBeLessThan(PRESSUPOST);
  });

  test('Safari 16 (sense WebP en canvas): la foto torna a codificar-se en JPEG, i puja un .jpg de tipus image/jpeg', async () => {
    fetchDeVeres();
    dobles.compressImage.mockImplementation(codificadorSafari16(0.05));
    const onImageUpload = vi.fn(async () => URL_PUJADA);
    const { result, onSaveField } = munta({ onImageUpload });
    await act(async () => { await result.current.processaFitxer(foto()); });
    expect(dobles.compressImage.mock.calls.map(([, o]) => o)).toEqual([
      { maxSize: 1200, format: 'image/webp', quality: 0.8 },
      { maxSize: 1200, format: 'image/jpeg', quality: 0.8 },
    ]);
    const pujat = onImageUpload.mock.calls[0][0];
    expect([pujat.name, pujat.type, pujat.size]).toEqual(['heroImage.jpg', 'image/jpeg', pesDe(0.05, 1200, 0.8)]);
    expect(onSaveField).toHaveBeenCalledWith('heroImage', URL_PUJADA);
  });

  test('Safari 16 i el pressupost: després del primer PNG, tots els intents van ja en JPEG', async () => {
    fetchDeVeres();
    dobles.compressImage.mockImplementation(codificadorSafari16(0.08));
    const onImageUpload = vi.fn(async () => URL_PUJADA);
    const { result } = munta({ onImageUpload });
    await act(async () => { await result.current.processaFitxer(foto()); });
    expect(dobles.compressImage.mock.calls.map(([, o]) => [o.format, o.quality])).toEqual([
      ['image/webp', 0.8], ...[0.8, 0.4, 0.6, 0.68, 0.72].map((q) => ['image/jpeg', q]),
    ]);
    expect(onImageUpload.mock.calls.map(([f]) => [f.type, f.size < PRESSUPOST])).toEqual([['image/jpeg', true]]);
  });

  test('el logotip en Safari 16 conserva la reserva PNG (la transparència): una compressió, cap JPEG', async () => {
    fetchDeVeres();
    dobles.compressImage.mockImplementation(codificadorSafari16(0.1));
    const onImageUpload = vi.fn(async () => URL_PUJADA);
    const { result } = munta({ fieldName: 'logoImage', onImageUpload });
    await act(async () => { await result.current.processaFitxer(foto()); });
    expect(dobles.compressImage.mock.calls.map(([, o]) => o)).toEqual([{ maxSize: 600, format: 'image/webp', quality: 0.8 }]);
    expect(onImageUpload.mock.calls.map(([f]) => [f.name, f.type])).toEqual([['logoImage.png', 'image/png']]);
  });

  test('el logotip queda fora del pressupost: un intent, encara que passe de 80.000 bytes', async () => {
    fetchDeVeres();
    dobles.compressImage.mockImplementation(codificador(1));
    const onImageUpload = vi.fn(async () => URL_PUJADA);
    const { result, onError } = munta({ fieldName: 'logoImage', onImageUpload });
    await act(async () => { await result.current.processaFitxer(foto()); });
    expect(intents()).toEqual([[600, 0.8]]);
    expect(onImageUpload.mock.calls[0][0].size).toBe(pesDe(1, 600, 0.8));
    expect(onError).not.toHaveBeenCalled();
  });

  test('l’avatar té la mida fixa de 400 i el pressupost de les fotos: només baixa la qualitat', async () => {
    fetchDeVeres();
    dobles.compressImage.mockImplementation(codificador(1));
    const onImageUpload = vi.fn(async () => URL_PUJADA);
    const { result } = munta({ fieldName: 'avatarImage', onImageUpload });
    await act(async () => { await result.current.processaFitxer(foto()); });
    expect(intents()).toEqual([0.8, 0.4, 0.6, 0.48, 0.52].map((q) => [400, q]));
    expect(onImageUpload.mock.calls.map(([f]) => [f.name, f.size])).toEqual([['avatarImage.webp', pesDe(1, 400, 0.48)]]);
  });

  test('opcions.forma mana sobre el nom del camp: l’avatar d’una persona al camp logoImage puja com a avatar', async () => {
    fetchDeVeres();
    dobles.compressImage.mockImplementation(codificador(1));
    const onImageUpload = vi.fn(async () => URL_PUJADA);
    const { result, onError } = munta({ fieldName: 'logoImage', onImageUpload });
    await act(async () => { await result.current.processaFitxer(foto(), { forma: 'avatar', midaMaxima: 400 }); });
    expect(intents()).toEqual([0.8, 0.4, 0.6, 0.48, 0.52].map((q) => [400, q]));
    // Sense midaMaxima, la mida de la forma (400), no la del logotip (600).
    dobles.compressImage.mockClear();
    await act(async () => { await result.current.processaFitxer(foto(), { forma: 'avatar' }); });
    expect(intents()[0]).toEqual([400, 0.8]);
    /* Un avatar que no hi cap: l'error honest, com la capçalera. Abans,
       codificador(1,5), que amb la cerca ja hi cap a 0,32: ara, un que no hi
       cap ni a la qualitat mínima. */
    dobles.compressImage.mockReset().mockImplementation(async () => dataUrlDe('image/webp', FIRMA_WEBP, PRESSUPOST));
    onImageUpload.mockClear();
    await act(async () => { await result.current.processaFitxer(foto(), { forma: 'avatar', midaMaxima: 400 }); });
    expect(onImageUpload).not.toHaveBeenCalled();
    expect(onError).toHaveBeenLastCalledWith(ERROR_PRESSUPOST);
    // Una forma desconeguda no val: el nom del camp, com sempre (logotip, 600).
    dobles.compressImage.mockReset().mockImplementation(codificador(1));
    await act(async () => { await result.current.processaFitxer(foto(), { forma: 'constructor' }); });
    expect(intents()).toEqual([[600, 0.8]]);
  });

  /* Gauntlet 261016 (P1) · Abans es desava el primer que hi cabia (0,48); ara,
     el de la qualitat més alta que hi cap (0,52, el cinqué intent). */
  test('sense servidor, la mateixa mida i el mateix pressupost, sense cap fetch: es desa el data URL de la qualitat més alta que hi cap', async () => {
    fetchDeVeres();
    dobles.compressImage.mockImplementation(codificador(0.1));
    const { result, onSaveField } = munta();
    await act(async () => { await result.current.processaFitxer(foto()); });
    expect(intents()).toEqual([0.8, 0.4, 0.6, 0.48, 0.52, 0.56].map((q) => [1200, q]));
    expect(fetch).not.toHaveBeenCalled();
    expect(onSaveField).toHaveBeenCalledWith('heroImage', await dobles.compressImage.mock.results[4].value);
  });

  test('sense servidor, si no hi cap: l’error honest i res desat', async () => {
    // Abans 0,5, que amb la cerca ja hi cap a 0,08: ara, una que no hi cap ni a 0,04.
    dobles.compressImage.mockImplementation(codificador(1.5));
    const { result, onSaveField, onError } = munta();
    let fet;
    await act(async () => { fet = await result.current.processaFitxer(foto()); });
    expect(fet).toBe(false);
    expect(onError).toHaveBeenCalledWith(ERROR_PRESSUPOST);
    expect(onSaveField).not.toHaveBeenCalled();
  });
});

/* Gauntlet 261016 (Bloc 1.2, mandat del Mestre, pla §0.1.3) · La tria de la
   casella del diàleg (opcions.conservaExif i opcions.original) arriba a cada
   intent de compressImage de les fotos; el logotip no en porta mai. */
describe('Gauntlet 261016 · Bloc 1.2 · la tria de l’EXIF arriba a la compressió', () => {
  const original = () => new File(['o'], 'IMG_2041.jpg', { type: 'image/jpeg' });
  const opcions = () => dobles.compressImage.mock.calls.map(([, o]) => o);

  test('marcada: la capçalera i l’avatar passen conservaExif i l’original a cada intent', async () => {
    fetchDeVeres();
    dobles.compressImage.mockImplementation(codificador(0.08));
    const triada = original();
    const { result } = munta({ onImageUpload: vi.fn(async () => URL_PUJADA) });
    await act(async () => { await result.current.processaFitxer(foto(), { conservaExif: true, original: triada }); });
    // Els cinc intents de la cerca (0,8, 0,4, 0,6, 0,68 i 0,72; abans, tres de l'escala).
    expect(opcions()).toHaveLength(5);
    opcions().forEach((o) => expect(o).toMatchObject({ maxSize: 1200, conservaExif: true, original: triada }));
    dobles.compressImage.mockClear();
    const avatar = munta({ fieldName: 'logoImage', onImageUpload: vi.fn(async () => URL_PUJADA) });
    await act(async () => { await avatar.result.current.processaFitxer(foto(), { forma: 'avatar', conservaExif: true }); });
    // Sense `original`, l'EXIF es llig del mateix fitxer (el camí T46 «sencera» de la closca).
    expect(opcions()[0]).toMatchObject({ maxSize: 400, conservaExif: true, original: expect.any(File) });
    expect(opcions()[0].original).toBe(dobles.compressImage.mock.calls[0][0]);
  });

  test('desmarcada, un valor que no és true o el logotip: cap clau nova (la foto ix neta, com abans)', async () => {
    fetchDeVeres();
    dobles.compressImage.mockImplementation(codificador(0.05));
    const { result } = munta({ onImageUpload: vi.fn(async () => URL_PUJADA) });
    for (const conservaExif of [false, 'true', 1, undefined]) {
      await act(async () => { await result.current.processaFitxer(foto(), { conservaExif, original: original() }); });
    }
    const logotip = munta({ fieldName: 'logoImage', onImageUpload: vi.fn(async () => URL_PUJADA) });
    await act(async () => { await logotip.result.current.processaFitxer(foto(), { conservaExif: true, original: original() }); });
    expect(opcions().map((o) => Object.keys(o))).toEqual(new Array(5).fill(['maxSize', 'format', 'quality']));
  });
});

test('T46 · un error de pujada ix per onError i torna false', async () => {
  const onImageUpload = vi.fn(async () => { throw new Error('Sense xarxa.'); });
  const { result, onSaveField, onError } = munta({ onImageUpload });
  let fet;
  await act(async () => { fet = await result.current.processaFitxer(foto()); });
  expect(fet).toBe(false);
  expect(onError).toHaveBeenCalledWith('Sense xarxa.');
  expect(onSaveField).not.toHaveBeenCalled();
});
