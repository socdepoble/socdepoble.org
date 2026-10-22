/**
 * Encàrrec 261019_1425 · El recurs de pintat: si una bessona .webp no arriba,
 * l'original al mateix lloc, una sola vegada, sense que el component amague
 * la imatge mentrestant.
 */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { fixaPoliticaDeMitjans } from './assetResolver.js';
import { EXTENSIONS_ORIGINALS, MARCA_FALLBACK, instalaFallbackDeBessones } from './fallbackBessones.js';

const ORIGEN = 'https://socdepoble.org';
const POLITICA = { origen: ORIGEN, externs: ['assets/uploads/'], bessones: ['assets/uploads/poble/DSC00410.JPG'] };

/* Pla 261022_1645 · Cada salt avisa per consola: ací es mira, i no embruta l'eixida. */
let avis;
beforeEach(() => { avis = vi.spyOn(console, 'warn').mockImplementation(() => {}); });
afterEach(() => {
  fixaPoliticaDeMitjans(null);
  document.body.innerHTML = '';
  avis.mockRestore();
});

/* Un shadow root com el de <soc-de-poble>, amb una imatge que avisa del seu error. */
function arrelAmbImatge(src) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const arrel = host.attachShadow({ mode: 'closed' });
  const img = document.createElement('img');
  img.setAttribute('src', src);
  const delComponent = vi.fn();
  img.addEventListener('error', delComponent);
  arrel.appendChild(img);
  return { arrel, img, delComponent };
}

test('una bessona que no arriba torna a l’original una vegada; el component no veu el primer error', () => {
  fixaPoliticaDeMitjans(POLITICA);
  const { arrel, img, delComponent } = arrelAmbImatge(`${ORIGEN}/assets/uploads/poble/DSC00410.webp`);
  const retira = instalaFallbackDeBessones(arrel);
  img.dispatchEvent(new Event('error'));
  expect(img.getAttribute('src')).toBe(`${ORIGEN}/assets/uploads/poble/DSC00410.JPG`);
  expect(img.dataset[MARCA_FALLBACK]).toBe('original');
  expect(delComponent).not.toHaveBeenCalled();
  // L'original tampoc no arriba: el segon error seguix el camí de sempre.
  img.dispatchEvent(new Event('error'));
  expect(img.getAttribute('src')).toBe(`${ORIGEN}/assets/uploads/poble/DSC00410.JPG`);
  expect(delComponent).toHaveBeenCalledTimes(1);
  retira();
});

test('amb política, una imatge que no és cap bessona no es toca (cap endevinalla)', () => {
  fixaPoliticaDeMitjans(POLITICA);
  const altra = arrelAmbImatge(`${ORIGEN}/assets/uploads/poble/altra.webp`);
  instalaFallbackDeBessones(altra.arrel);
  altra.img.dispatchEvent(new Event('error'));
  expect(altra.img.getAttribute('src')).toBe(`${ORIGEN}/assets/uploads/poble/altra.webp`);
  expect(altra.delComponent).toHaveBeenCalledTimes(1);
  expect(avis).not.toHaveBeenCalled();
});

/* Pla 261022_1645 (tasca 3) · El web propi (main.jsx) no porta política: el
   recurs hi prova el mateix camí amb les extensions dels originals, una per
   error, i acabades deixa passar l'error. */
test('sense política (el web propi): una .webp d’assets/ prova .jpg, .png i .JPG, amb avís, i després l’error seguix', () => {
  expect(EXTENSIONS_ORIGINALS).toEqual(['.jpg', '.png', '.JPG']);
  const { arrel, img, delComponent } = arrelAmbImatge('/assets/towns/tibi/1.webp?v=3');
  instalaFallbackDeBessones(arrel);
  img.dispatchEvent(new Event('error'));
  expect(img.getAttribute('src')).toMatch(/\/assets\/towns\/tibi\/1\.jpg\?v=3$/);
  expect(avis).toHaveBeenCalledTimes(1);
  expect(avis.mock.calls[0][0]).toBe('[Bessones] No ha arribat');
  img.dispatchEvent(new Event('error'));
  expect(img.getAttribute('src')).toMatch(/\/assets\/towns\/tibi\/1\.png\?v=3$/);
  img.dispatchEvent(new Event('error'));
  expect(img.getAttribute('src')).toMatch(/\/assets\/towns\/tibi\/1\.JPG\?v=3$/);
  expect(delComponent).not.toHaveBeenCalled();
  // Cap original: el quart error arriba al component, i cap altre salt (cap bucle).
  img.dispatchEvent(new Event('error'));
  expect(delComponent).toHaveBeenCalledTimes(1);
  expect(img.dataset[MARCA_FALLBACK]).toBe('original');
  img.dispatchEvent(new Event('error'));
  expect(delComponent).toHaveBeenCalledTimes(2);
  expect(avis).toHaveBeenCalledTimes(3);
});

test('sense política, el que no és una .webp d’assets/ no es toca (una pujada de Storage, un .jpg)', () => {
  for (const src of ['https://abc.supabase.co/storage/v1/object/public/mitjans/t/u/avatars/x.webp', '/assets/towns/tibi/1.jpg', '/img/assets.webp']) {
    const { arrel, img, delComponent } = arrelAmbImatge(src);
    instalaFallbackDeBessones(arrel);
    img.dispatchEvent(new Event('error'));
    expect(img.getAttribute('src')).toBe(src);
    expect(delComponent).toHaveBeenCalledTimes(1);
  }
  expect(avis).not.toHaveBeenCalled();
});

test('sobre l’arrel #root (com al web propi, main.jsx) veu les imatges de l’app, també les fondes', () => {
  const arrel = document.createElement('div');
  arrel.id = 'root';
  const img = document.createElement('img');
  img.setAttribute('src', '/assets/img/pi-pla-verd.webp');
  arrel.appendChild(document.createElement('section')).appendChild(img);
  document.body.appendChild(arrel);
  const retira = instalaFallbackDeBessones(arrel);
  img.dispatchEvent(new Event('error'));
  expect(img.getAttribute('src')).toMatch(/\/assets\/img\/pi-pla-verd\.jpg$/);
  retira();
});

test('retirar el recurs el deixa sense efecte; una arrel buida no fa res', () => {
  fixaPoliticaDeMitjans(POLITICA);
  const { arrel, img, delComponent } = arrelAmbImatge(`${ORIGEN}/assets/uploads/poble/DSC00410.webp`);
  instalaFallbackDeBessones(arrel)();
  img.dispatchEvent(new Event('error'));
  expect(img.getAttribute('src')).toBe(`${ORIGEN}/assets/uploads/poble/DSC00410.webp`);
  expect(delComponent).toHaveBeenCalledTimes(1);
  expect(typeof instalaFallbackDeBessones(null)).toBe('function');
});
