import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* T46 (ordre del Mestre, 260928) · processaFitxer és el cos d'handleFileChange
   amb un File directe. jsdom no pot comprimir (sense canvas): compressImage i
   el fetch d'aFitxer se simulen. */
const dobles = vi.hoisted(() => ({ compressImage: vi.fn() }));
vi.mock('../utils/imageUtils.js', () => ({ compressImage: dobles.compressImage }));

import useHeroImageHandler, { MIDA_MAXIMA_IMATGE, validaFitxerImatge } from './useHeroImageHandler.js';

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

test('T46 · sense servidor, un data URL massa llarg es torna a comprimir més xicotet abans de donar error', async () => {
  dobles.compressImage.mockResolvedValueOnce(LLARG).mockResolvedValueOnce(CURT);
  const { result, onSaveField, onError } = munta();
  let fet;
  await act(async () => { fet = await result.current.processaFitxer(foto()); });
  expect(fet).toBe(true);
  expect(dobles.compressImage.mock.calls.map(([, o]) => o)).toEqual([
    { maxSize: 1200, format: 'image/webp', quality: 0.8 },
    { maxSize: 960, format: 'image/webp', quality: 0.75 },
  ]);
  expect(onSaveField).toHaveBeenCalledWith('heroImage', CURT);
  expect(onError).not.toHaveBeenCalled();
});

test('T46 · si cap esglaó hi cap, el missatge d’abans i false', async () => {
  dobles.compressImage.mockResolvedValue(LLARG);
  const onImageUpload = vi.fn(async () => null); // sense la capacitat 'mitjans'
  const { result, onSaveField, onError } = munta({ onImageUpload });
  let fet;
  await act(async () => { fet = await result.current.processaFitxer(foto()); });
  expect(fet).toBe(false);
  expect(dobles.compressImage).toHaveBeenCalledTimes(4);
  expect(dobles.compressImage.mock.calls.at(-1)[1]).toEqual({ maxSize: 600, format: 'image/webp', quality: 0.7 });
  expect(onImageUpload).toHaveBeenCalledTimes(4);
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

test('T46 · un error de pujada ix per onError i torna false', async () => {
  const onImageUpload = vi.fn(async () => { throw new Error('Sense xarxa.'); });
  const { result, onSaveField, onError } = munta({ onImageUpload });
  let fet;
  await act(async () => { fet = await result.current.processaFitxer(foto()); });
  expect(fet).toBe(false);
  expect(onError).toHaveBeenCalledWith('Sense xarxa.');
  expect(onSaveField).not.toHaveBeenCalled();
});
