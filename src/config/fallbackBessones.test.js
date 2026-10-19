/**
 * Encàrrec 261019_1425 · El recurs de pintat: si una bessona .webp no arriba,
 * l'original al mateix lloc, una sola vegada, sense que el component amague
 * la imatge mentrestant.
 */
import { afterEach, expect, test, vi } from 'vitest';
import { fixaPoliticaDeMitjans } from './assetResolver.js';
import { MARCA_FALLBACK, instalaFallbackDeBessones } from './fallbackBessones.js';

const ORIGEN = 'https://socdepoble.org';
const POLITICA = { origen: ORIGEN, externs: ['assets/uploads/'], bessones: ['assets/uploads/poble/DSC00410.JPG'] };

afterEach(() => {
  fixaPoliticaDeMitjans(null);
  document.body.innerHTML = '';
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

test('una imatge que no és cap bessona, o sense política, no es toca', () => {
  fixaPoliticaDeMitjans(POLITICA);
  const altra = arrelAmbImatge(`${ORIGEN}/assets/uploads/poble/altra.webp`);
  instalaFallbackDeBessones(altra.arrel);
  altra.img.dispatchEvent(new Event('error'));
  expect(altra.img.getAttribute('src')).toBe(`${ORIGEN}/assets/uploads/poble/altra.webp`);
  expect(altra.delComponent).toHaveBeenCalledTimes(1);

  fixaPoliticaDeMitjans(null);
  const sense = arrelAmbImatge(`${ORIGEN}/assets/uploads/poble/DSC00410.webp`);
  instalaFallbackDeBessones(sense.arrel);
  sense.img.dispatchEvent(new Event('error'));
  expect(sense.img.getAttribute('src')).toBe(`${ORIGEN}/assets/uploads/poble/DSC00410.webp`);
  expect(sense.delComponent).toHaveBeenCalledTimes(1);
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
