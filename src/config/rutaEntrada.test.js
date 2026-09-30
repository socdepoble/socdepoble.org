import { expect, test } from 'vitest';
import { MAXIM_TORNADA, esRutaDEntrada, modeDEntrada, rutaDEntrada, tornadaSegura } from './rutaEntrada.js';
import { esRutaInterna } from './objecteConnectable.js';

/* Correcció de la revisió T1–T4 (260930) · Un /connectar de Web Share Target
   (url, title i text) que codificat passa dels 300 caràcters d'esRutaInterna. */
const LLARGA = `/connectar?${new URLSearchParams({
  url: 'https://www.diari.example/comarques/2026/09/30/fira-tardor-la-torre-123456.html',
  title: 'Fira de la Tardor a la Torre de les Maçanes: parades, música i productes de la terra',
  text: 'Fira de la Tardor https://www.diari.example/comarques/2026/09/30/fira-tardor-la-torre-123456.html'
})}`;
const tornarDe = (ruta) => new URL(ruta, 'https://poble.test').searchParams.get('tornar');

test('T4 · una tornada de més de 300 caràcters (un /connectar compartit) es conserva sencera', () => {
  expect(LLARGA.length).toBeGreaterThan(300);
  // El topall dels objectes connectables no canvia: esta ruta no hi cap…
  expect(esRutaInterna(LLARGA)).toBe(false);
  // …però la tornada té el seu.
  expect(tornadaSegura(LLARGA)).toBe(LLARGA);
  expect(tornarDe(rutaDEntrada({ mode: 'entrar', tornar: LLARGA }))).toBe(LLARGA);
});

test('T4 · el topall de la tornada és MAXIM_TORNADA (2048) i els controls són els d’esRutaInterna', () => {
  expect(MAXIM_TORNADA).toBe(2048);
  const justa = `/connectar?x=${'a'.repeat(MAXIM_TORNADA - '/connectar?x='.length)}`;
  expect(justa.length).toBe(MAXIM_TORNADA);
  expect(tornadaSegura(justa)).toBe(justa);
  expect(tornadaSegura(`${justa}a`)).toBe(null);
  expect(rutaDEntrada({ tornar: `${justa}a` })).toBe('/registre?mode=entrar');
  const cua = 'a'.repeat(400);
  for (const dolenta of [`//dolent.test/${cua}`, `/a\\b${cua}`, `/amb espai${cua}`, `/control\u0001${cua}`, `/del\u007F${cua}`, `/salt\n${cua}`, `mur/${cua}`, `https://dolent.test/${cua}`, `/registre?mode=crear&x=${cua}`]) {
    expect(tornadaSegura(dolenta), JSON.stringify(dolenta.slice(0, 24))).toBe(null);
  }
});

test('T4 · la ruta d’entrada porta el mode i la tornada interna', () => {
  expect(rutaDEntrada()).toBe('/registre?mode=entrar');
  expect(rutaDEntrada({ mode: 'crear' })).toBe('/registre?mode=crear');
  expect(rutaDEntrada({ tornar: '/mur/123?vista=1' }))
    .toBe(`/registre?mode=entrar&tornar=${encodeURIComponent('/mur/123?vista=1')}`);
  expect(new URLSearchParams(rutaDEntrada({ tornar: '/connectar?url=https%3A%2F%2Fx.org' }).split('?')[1]).get('tornar'))
    .toBe('/connectar?url=https%3A%2F%2Fx.org');
});

test('T4 · un mode desconegut o una tornada insegura es descarten', () => {
  expect(rutaDEntrada({ mode: 'recuperar' })).toBe('/registre');
  for (const tornar of ['//dolent.test', 'https://dolent.test', '/a\\b', '/amb espai', '', null, 42]) {
    expect(rutaDEntrada({ tornar })).toBe('/registre?mode=entrar');
  }
});

test('T4 · la tornada mai és la mateixa entrada', () => {
  expect(esRutaDEntrada('/registre')).toBe(true);
  expect(esRutaDEntrada('/registre?mode=crear')).toBe(true);
  expect(esRutaDEntrada('/registres')).toBe(false);
  expect(tornadaSegura('/registre?tornar=%2Fmur')).toBe(null);
  expect(rutaDEntrada({ tornar: '/registre' })).toBe('/registre?mode=entrar');
});

test('T4 · només entrar i crear són modes', () => {
  expect(modeDEntrada('entrar')).toBe('entrar');
  expect(modeDEntrada('crear')).toBe('crear');
  expect(modeDEntrada('register')).toBe(null);
});
