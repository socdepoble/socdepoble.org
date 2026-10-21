/**
 * Encàrrec 261019_1425 · La política de mitjans del paquet al resolutor.
 *
 * La variant del directori de WordPress.org segella (vite.standalone.config.js)
 * quines carpetes es demanen a un origen extern i quins originals tenen
 * bessona .webp; l'autònom, només les bessones (D3). resolveAsset() n'és
 * l'únic punt d'aplicació; sense política
 * res no canvia (Llei del Píxel), i les dades continuen nomenant l'original.
 */
import { afterEach, expect, test, vi } from 'vitest';
import {
  fixaBaseRecursos,
  fixaPoliticaDeMitjans,
  hiHaPoliticaDeMitjans,
  origenDeMitjansExterns,
  recursOriginalDeBessona,
  resolRecursPropi,
  resolRecursosDeHtml,
  resolveAsset,
  resolveTownImageUrl,
  TOWN_FALLBACK_IMAGES
} from './assetResolver.js';
import { permetOrigenMitjans, sanitizeHtml } from '../utils/sanitize.js';

const PAQUET = 'https://wp.example/wp-content/plugins/socdepoble-enxufe/dist';
const ORIGEN = 'https://socdepoble.org';
/* Nom d'exemple (Mòdul B, 261021): un original de la interfície que continua
   amb la seua bessona a public/ (consola_vinyeta). Abans era la vinyeta del
   Mapa, que ja només viu com a WebP. La política és sintètica: cap prova no
   llig el disc ací. */
const POLITICA = {
  origen: ORIGEN,
  externs: ['assets/uploads/', 'assets/towns/'],
  bessones: ['assets/ui/plugins/consola_vinyeta.jpg', 'assets/uploads/poble/DSC00410.JPG', 'assets/towns/tibi/1.jpg']
};

afterEach(() => {
  fixaPoliticaDeMitjans(null);
  fixaBaseRecursos('/');
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

test('sense política (proves, socdepoble.org) tot resol com sempre', () => {
  expect(fixaPoliticaDeMitjans(null)).toBeNull();
  expect(origenDeMitjansExterns()).toBe('');
  expect(resolveAsset('/assets/ui/plugins/consola_vinyeta.jpg')).toBe('/assets/ui/plugins/consola_vinyeta.jpg');
  expect(resolveAsset('/assets/uploads/poble/DSC00410.JPG')).toBe('/assets/uploads/poble/DSC00410.JPG');
  expect(resolRecursPropi('/assets/towns/tibi/1.jpg')).toBe('/assets/towns/tibi/1.jpg');
  const html = '<p><img src="/assets/uploads/poble/DSC00410.JPG" alt=""></p>';
  expect(resolRecursosDeHtml(html)).toBe(html);
});

test('amb política i base de paquet: la bessona viatja al paquet; l’arxiu, a l’origen extern', () => {
  fixaBaseRecursos(PAQUET);
  fixaPoliticaDeMitjans(POLITICA);
  expect(origenDeMitjansExterns()).toBe(ORIGEN);
  // Estructura: la bessona, dins del paquet.
  expect(resolveAsset('/assets/ui/plugins/consola_vinyeta.jpg')).toBe(`${PAQUET}/assets/ui/plugins/consola_vinyeta.webp`);
  // Sense bessona: l'original, dins del paquet.
  expect(resolveAsset('/assets/ui/plugins/petita.jpg')).toBe(`${PAQUET}/assets/ui/plugins/petita.jpg`);
  expect(resolveAsset('/assets/system/ui/logo.svg')).toBe(`${PAQUET}/assets/system/ui/logo.svg`);
  // Arxiu: l'origen extern, amb la bessona si en té (la caixa del nom es conserva).
  expect(resolveAsset('/assets/uploads/poble/DSC00410.JPG')).toBe(`${ORIGEN}/assets/uploads/poble/DSC00410.webp`);
  expect(resolveAsset('/assets/uploads/avatars/mixa-comic.png')).toBe(`${ORIGEN}/assets/uploads/avatars/mixa-comic.png`);
  expect(resolveAsset('assets/towns/tibi/1.jpg')).toBe(`${ORIGEN}/assets/towns/tibi/1.webp`);
});

test('l’origen extern mana sobre qualsevol base: la de l’amfitrió, un pluginUrl o un basePath', () => {
  fixaBaseRecursos(PAQUET);
  fixaPoliticaDeMitjans(POLITICA);
  expect(resolveAsset('/assets/uploads/x.png', '/', 'https://altre.example/dist')).toBe(`${ORIGEN}/assets/uploads/x.png`);
  expect(resolveAsset('/assets/uploads/x.png', '/sub')).toBe(`${ORIGEN}/assets/uploads/x.png`);
  // La resta continua penjant de la base demanada.
  expect(resolveAsset('/assets/ui/plugins/consola_vinyeta.jpg', '/', 'https://altre.example/dist'))
    .toBe('https://altre.example/dist/assets/ui/plugins/consola_vinyeta.webp');
});

test('el connector lleuger resol també el logo, les vinyetes i els assets de l’arrel des de l’origen canònic', () => {
  fixaBaseRecursos(PAQUET);
  fixaPoliticaDeMitjans({ ...POLITICA, externs: ['assets/'] });
  for (const cami of ['assets/system/ui/logo.png', 'assets/soc_de_poble_ibanez.webp', 'assets/nano_cards/mur.webp']) {
    expect(resolveAsset(`/${cami}`)).toBe(`${ORIGEN}/${cami}`);
  }
  expect(resolveAsset('/assets/ui/plugins/consola_vinyeta.jpg')).toBe(`${ORIGEN}/assets/ui/plugins/consola_vinyeta.webp`);
  expect(resolveAsset('/fonts/noto-sans.css')).toBe(`${PAQUET}/fonts/noto-sans.css`);
});

test('la consulta, la versió i el fragment es conserven; una URL resolta no es torna a tocar', () => {
  fixaBaseRecursos(PAQUET);
  fixaPoliticaDeMitjans(POLITICA);
  expect(resolveAsset('/assets/ui/plugins/consola_vinyeta.jpg?x=1#a', '/', '', '7'))
    .toBe(`${PAQUET}/assets/ui/plugins/consola_vinyeta.webp?x=1&v=7#a`);
  expect(resolveAsset('/assets/uploads/poble/DSC00410.JPG#retall', '/', '', '3'))
    .toBe(`${ORIGEN}/assets/uploads/poble/DSC00410.webp?v=3#retall`);
  const resolta = resolveAsset('/assets/uploads/poble/DSC00410.JPG');
  expect(resolveAsset(resolta)).toBe(resolta);
  expect(resolRecursPropi(resolta)).toBe(resolta);
  for (const externa of ['https://altre.example/assets/uploads/x.jpg', 'data:image/png;base64,AAAA', 'blob:https://x/y']) {
    expect(resolveAsset(externa)).toBe(externa);
  }
});

test('la bessona només si és a la política: el nom exacte, sense endevinar', () => {
  fixaPoliticaDeMitjans(POLITICA);
  // Una altra caixa no és el mateix fitxer en un servidor que distingix majúscules.
  expect(resolveAsset('/assets/uploads/poble/dsc00410.jpg')).toBe(`${ORIGEN}/assets/uploads/poble/dsc00410.jpg`);
  expect(resolveAsset('/assets/ui/plugins/consola_vinyeta.png')).toBe('/assets/ui/plugins/consola_vinyeta.png');
});

test('resolRecursPropi i resolRecursosDeHtml apliquen la política també sense base (i el sanejador hi deixa passar l’origen registrat)', () => {
  fixaPoliticaDeMitjans(POLITICA);
  expect(resolRecursPropi('/assets/ui/plugins/consola_vinyeta.jpg')).toBe('/assets/ui/plugins/consola_vinyeta.webp');
  expect(resolRecursPropi('/assets/uploads/avatars/mixa-comic.png')).toBe(`${ORIGEN}/assets/uploads/avatars/mixa-comic.png`);
  expect(resolRecursPropi('sdp-media://mitjans/x')).toBe('sdp-media://mitjans/x');
  expect(resolRecursPropi('/altre/x.png')).toBe('/altre/x.png');
  const html = '<p><img src="/assets/uploads/poble/DSC00410.JPG" alt="La Torre"></p>';
  const resolt = resolRecursosDeHtml(html);
  expect(resolt).toBe(`<p><img src="${ORIGEN}/assets/uploads/poble/DSC00410.webp" alt="La Torre"></p>`);
  // Sense registrar l'origen, sanitize.js el tractaria com un far de tercers.
  expect(sanitizeHtml(resolt)).not.toContain(`${ORIGEN}/assets/`);
  permetOrigenMitjans(origenDeMitjansExterns());
  expect(sanitizeHtml(resolt)).toContain(`src="${ORIGEN}/assets/uploads/poble/DSC00410.webp"`);
});

test('les reserves dels pobles (uploads/brain) van a l’origen extern', () => {
  fixaBaseRecursos(PAQUET);
  fixaPoliticaDeMitjans(POLITICA);
  const reserva = resolveTownImageUrl('', 'Benifallim');
  expect(reserva).toBe(`${ORIGEN}${TOWN_FALLBACK_IMAGES[0]}`);
});

test('una política mal formada no s’aplica: cap origen relatiu, cap prefix fora d’assets/, cap «..»', () => {
  expect(fixaPoliticaDeMitjans('no és JSON')).toBeNull();
  expect(fixaPoliticaDeMitjans({ origen: '/camí', externs: ['assets/uploads/'], bessones: [] })).toBeNull();
  expect(fixaPoliticaDeMitjans({ origen: 'javascript:alert(1)', externs: ['assets/uploads/'] })).toBeNull();
  const neta = fixaPoliticaDeMitjans({
    origen: `${ORIGEN}/`,
    externs: ['assets/uploads/', 'uploads/', 'assets/../x/', 'assets/uploads', '/assets/towns/', 42],
    bessones: ['assets/a/x.jpg', 'assets/../b/y.jpg', 'assets/a/z.webp', '/assets/a/w.png', null]
  });
  expect(neta.origen).toBe(ORIGEN);
  expect([...neta.externs]).toEqual(['assets/uploads/']);
  expect([...neta.bessones]).toEqual(['assets/a/x.jpg']);
  expect(Object.isFrozen(neta)).toBe(true);
  // Externs sense origen: només les bessones.
  const senseOrigen = fixaPoliticaDeMitjans({ externs: ['assets/uploads/'], bessones: ['assets/a/x.jpg'] });
  expect(senseOrigen.externs).toEqual([]);
  expect(resolveAsset('/assets/uploads/x.png')).toBe('/assets/uploads/x.png');
  expect(origenDeMitjansExterns()).toBe('');
});

test('la política segellada pel build (import.meta.env.SDP_POLITICA_DE_MITJANS) s’aplica en avaluar-se el mòdul; una global de la pàgina, no', async () => {
  // Una global que posara l'amfitrió no és cap canal: només el build segella orígens.
  vi.stubGlobal('__SDP_POLITICA_DE_MITJANS__', POLITICA);
  vi.resetModules();
  const ambGlobal = await import('./assetResolver.js');
  expect(ambGlobal.origenDeMitjansExterns()).toBe('');
  vi.unstubAllGlobals();
  vi.stubEnv('SDP_POLITICA_DE_MITJANS', JSON.stringify(POLITICA));
  vi.resetModules();
  const resolutor = await import('./assetResolver.js');
  expect(resolutor.origenDeMitjansExterns()).toBe(ORIGEN);
  expect(resolutor.resolveAsset('/assets/uploads/poble/DSC00410.JPG')).toBe(`${ORIGEN}/assets/uploads/poble/DSC00410.webp`);
  vi.unstubAllEnvs();
  vi.resetModules();
  const net = await import('./assetResolver.js');
  expect(net.origenDeMitjansExterns()).toBe('');
});

test('recursOriginalDeBessona: de l’adreça d’una bessona, la del seu original al mateix lloc; de qualsevol altra, res', () => {
  expect(recursOriginalDeBessona(`${ORIGEN}/assets/uploads/poble/DSC00410.webp`)).toBe('');
  fixaBaseRecursos(PAQUET);
  fixaPoliticaDeMitjans(POLITICA);
  expect(hiHaPoliticaDeMitjans()).toBe(true);
  expect(recursOriginalDeBessona(`${ORIGEN}/assets/uploads/poble/DSC00410.webp`)).toBe(`${ORIGEN}/assets/uploads/poble/DSC00410.JPG`);
  expect(recursOriginalDeBessona(`${PAQUET}/assets/ui/plugins/consola_vinyeta.webp?v=3#a`)).toBe(`${PAQUET}/assets/ui/plugins/consola_vinyeta.jpg?v=3#a`);
  expect(recursOriginalDeBessona('/assets/towns/tibi/1.webp')).toBe('/assets/towns/tibi/1.jpg');
  expect(recursOriginalDeBessona('assets/towns/tibi/1.webp')).toBe('assets/towns/tibi/1.jpg');
  // Una base que també porta «assets/» al camí no confon la cerca.
  expect(recursOriginalDeBessona('https://x.example/assets/dist/assets/towns/tibi/1.webp')).toBe('https://x.example/assets/dist/assets/towns/tibi/1.jpg');
  for (const altra of [`${ORIGEN}/assets/uploads/poble/altra.webp`, `${ORIGEN}/assets/uploads/poble/DSC00410.JPG`, `${PAQUET}/xassets/towns/tibi/1.webp`, '', null]) {
    expect(recursOriginalDeBessona(altra), String(altra)).toBe('');
  }
  fixaPoliticaDeMitjans(null);
  expect(hiHaPoliticaDeMitjans()).toBe(false);
});
