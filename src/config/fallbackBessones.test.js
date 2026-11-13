/**
 * Encàrrec 261019_1425 + Onada R21.7 · El recurs de pintat: si una bessona .webp
 * no arriba, demana una sola vegada l'original ràster que realment existix (tant
 * amb política segellada com al web propi via `MAPA_BESSONES_PUBLIC`), sense
 * demanar mai extensions `.png` o `.JPG` inexistents ni tocar `.webp` autònomes.
 */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { fixaPoliticaDeMitjans } from './assetResolver.js';
import { EXTENSIONS_ORIGINALS, MARCA_FALLBACK, instalaFallbackDeBessones, instalaFallbackDeLaPolitica } from './fallbackBessones.js';

const ORIGEN = 'https://socdepoble.org';
const POLITICA = { origen: ORIGEN, externs: ['assets/uploads/'], bessones: ['assets/uploads/poble/DSC00410.JPG'] };

let avis;
beforeEach(() => { avis = vi.spyOn(console, 'warn').mockImplementation(() => {}); });
afterEach(() => {
  fixaPoliticaDeMitjans(null);
  document.body.replaceChildren();
  avis.mockRestore();
});

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

test('sense política (el web propi): una .webp amb bessona real prova únicament la seua extensió existent i mai .png/.JPG inexistents', () => {
  expect(EXTENSIONS_ORIGINALS).toEqual(['.jpg', '.png', '.JPG']);
  const { arrel, img, delComponent } = arrelAmbImatge('/assets/towns/tibi/1.webp?v=3');
  instalaFallbackDeBessones(arrel);
  img.dispatchEvent(new Event('error'));
  expect(img.getAttribute('src')).toMatch(/\/assets\/towns\/tibi\/1\.jpg\?v=3$/);
  expect(img.dataset[MARCA_FALLBACK]).toBe('original');
  expect(avis).toHaveBeenCalledTimes(1);
  expect(avis.mock.calls[0][0]).toBe('[Bessones] No ha arribat');
  expect(delComponent).not.toHaveBeenCalled();
  // Si el .jpg real tampoc no arriba, l'error passa al component sense provar .png ni .JPG inexistents.
  img.dispatchEvent(new Event('error'));
  expect(img.getAttribute('src')).toMatch(/\/assets\/towns\/tibi\/1\.jpg\?v=3$/);
  expect(delComponent).toHaveBeenCalledTimes(1);
  expect(avis).toHaveBeenCalledTimes(1);
});

test('R21.7 · una .webp autònoma sense original ràster (xat_portada.webp) i la-torre-de-les-macanes/2.webp mai demanen .png ni .JPG', () => {
  const portada = arrelAmbImatge('/assets/uploads/brain/xat_portada.webp');
  instalaFallbackDeBessones(portada.arrel);
  portada.img.dispatchEvent(new Event('error'));
  expect(portada.img.getAttribute('src')).toBe('/assets/uploads/brain/xat_portada.webp');
  expect(portada.delComponent).toHaveBeenCalledTimes(1);
  expect(avis).not.toHaveBeenCalled();

  const torre = arrelAmbImatge('/assets/towns/la-torre-de-les-macanes/2.webp');
  instalaFallbackDeBessones(torre.arrel);
  torre.img.dispatchEvent(new Event('error'));
  expect(torre.img.getAttribute('src')).toBe('/assets/towns/la-torre-de-les-macanes/2.jpg');
  expect(avis).toHaveBeenCalledTimes(1);
  torre.img.dispatchEvent(new Event('error'));
  expect(torre.img.getAttribute('src')).toBe('/assets/towns/la-torre-de-les-macanes/2.jpg');
  expect(torre.delComponent).toHaveBeenCalledTimes(1);
  expect(avis).toHaveBeenCalledTimes(1);
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

/* Onada R22 · BOOT3 · L'instal·lador del paquet (PedraSecaEmbed, que només l'instal·la amb política):
   el mateix salt exacte de la política, i sense el cens del web propi, que així no viatja a l'arrencada. */
test('instalaFallbackDeLaPolitica fa el mateix salt exacte que instalaFallbackDeBessones amb política', () => {
  fixaPoliticaDeMitjans(POLITICA);
  const { arrel, img, delComponent } = arrelAmbImatge(`${ORIGEN}/assets/uploads/poble/DSC00410.webp?v=2`);
  const retira = instalaFallbackDeLaPolitica(arrel);
  img.dispatchEvent(new Event('error'));
  expect(img.getAttribute('src')).toBe(`${ORIGEN}/assets/uploads/poble/DSC00410.JPG?v=2`);
  expect(img.dataset[MARCA_FALLBACK]).toBe('original');
  expect(delComponent).not.toHaveBeenCalled();
  img.dispatchEvent(new Event('error'));
  expect(delComponent).toHaveBeenCalledTimes(1);
  const altra = arrelAmbImatge(`${ORIGEN}/assets/uploads/poble/altra.webp`);
  instalaFallbackDeLaPolitica(altra.arrel);
  altra.img.dispatchEvent(new Event('error'));
  expect(altra.img.getAttribute('src')).toBe(`${ORIGEN}/assets/uploads/poble/altra.webp`);
  expect(altra.delComponent).toHaveBeenCalledTimes(1);
  retira();
  expect(typeof instalaFallbackDeLaPolitica(null)).toBe('function');
});

test('instalaFallbackDeLaPolitica no consulta el cens del web propi: sense política, cap imatge no es toca', () => {
  const { arrel, img, delComponent } = arrelAmbImatge('/assets/towns/tibi/1.webp');
  instalaFallbackDeLaPolitica(arrel);
  img.dispatchEvent(new Event('error'));
  expect(img.getAttribute('src')).toBe('/assets/towns/tibi/1.webp');
  expect(img.dataset[MARCA_FALLBACK]).toBeUndefined();
  expect(delComponent).toHaveBeenCalledTimes(1);
  expect(avis).not.toHaveBeenCalled();
});
