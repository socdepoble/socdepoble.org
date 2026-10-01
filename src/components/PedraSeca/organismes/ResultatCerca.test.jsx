/** Proves de ResultatCerca (T45): DOM, accessibilitat i seguretat. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext';
import { fixaBaseRecursos } from '../../../config/assetResolver.js';
import { ResultatCerca } from './ResultatCerca.jsx';

let arrel;
beforeEach(() => { arrel = document.createElement('div'); });
afterEach(cleanup);

const pinta = (props) => act(() => {
  render(<MemoryRouter><ResultatCerca titol="Benifallim" {...props} /></MemoryRouter>, { container: arrel });
});

test('el títol és un enllaç amb l’href dins d’una capçalera h3 per defecte', () => {
  pinta({ href: '/pobles/benifallim' });
  const capcalera = arrel.querySelector('h3.sdp-resultat-cerca__titol');
  const enllac = capcalera.querySelector('a');
  expect(enllac.getAttribute('href')).toBe('/pobles/benifallim');
  expect(enllac.textContent).toBe('Benifallim');
  expect(arrel.querySelector('article.sdp-resultat-cerca')).not.toBeNull();
});

test('amb un href insegur (javascript:) el títol no és enllaç', () => {
  pinta({ href: 'javascript:alert(1)' });
  expect(arrel.querySelector('a')).toBeNull();
  expect(arrel.querySelector('.sdp-resultat-cerca__titol').textContent).toBe('Benifallim');
});

test('la miniatura porta alt (buit per defecte) i una font insegura no es pinta', () => {
  pinta({ imatge: { src: '/assets/towns/benifallim/1.jpg' } });
  const img = arrel.querySelector('img.sdp-resultat-cerca__miniatura');
  expect(img.hasAttribute('alt')).toBe(true);
  expect(img.getAttribute('alt')).toBe('');
  cleanup();
  arrel = document.createElement('div');
  pinta({ imatge: { src: 'javascript:alert(1)', alt: 'x' } });
  expect(arrel.querySelector('img')).toBeNull();
  expect(arrel.firstElementChild.classList.contains('sdp-resultat-cerca--sense-media')).toBe(true);
});

test('la insígnia de tipus i la d’avís porten text; la meta va separada per «·» decoratius', () => {
  pinta({ tipus: { etiqueta: 'Poble', to: 'info' }, avis: 'Privada: només la veus tu', meta: ['L’Alcoià', '110 hab'] });
  const meta = arrel.querySelector('.sdp-resultat-cerca__meta');
  expect(meta.querySelector('.sdp-insignia--info').textContent).toBe('Poble');
  expect(meta.querySelector('.sdp-insignia--avis').textContent).toBe('Privada: només la veus tu');
  const seps = meta.querySelectorAll('.sdp-resultat-cerca__sep');
  expect(seps.length).toBe(1);
  expect(seps[0].getAttribute('aria-hidden')).toBe('true');
});

test('una referència opaca (sdp-media://) no fa miniatura ni foto d’avatar: un <img> no la pot obrir', () => {
  pinta({ imatge: { src: 'sdp-media://mitjans/u/foto.jpg' } });
  expect(arrel.querySelector('img')).toBeNull();
  expect(arrel.firstElementChild.classList.contains('sdp-resultat-cerca--sense-media')).toBe(true);
  cleanup();
  arrel = document.createElement('div');
  pinta({ imatge: { src: 'sdp-media://mitjans/u/foto.jpg' }, avatar: { nom: 'Pepa Güell', src: 'sdp-media://mitjans_privats/u/cara.jpg', llavor: 'pepa' } });
  expect(arrel.querySelector('img')).toBeNull();
  expect(arrel.querySelector('.sdp-resultat-cerca__avatar').textContent).toBe('PG');
});

test('sense imatge, l’avatar va amb alt buit (el nom ja és al costat)', () => {
  pinta({ avatar: { nom: 'Pepa Güell', llavor: 'pepa' } });
  const avatar = arrel.querySelector('.sdp-resultat-cerca__avatar');
  expect(avatar).not.toBeNull();
  expect(avatar.querySelector('.sdp-nomes-lector')).toBeNull();
});

test('cap node porta l’atribut style', () => {
  pinta({ href: '/x', meta: ['a', 'b'], extracte: 'text', imatge: { src: '/assets/a.jpg' }, accio: <button type="button">Escriu-li</button> });
  expect(arrel.querySelectorAll('[style]').length).toBe(0);
});

test('headingLevel es limita a h2–h4', () => {
  pinta({ headingLevel: 1 });
  expect(arrel.querySelector('h2')).not.toBeNull();
  cleanup();
  arrel = document.createElement('div');
  pinta({ headingLevel: 6 });
  expect(arrel.querySelector('h4')).not.toBeNull();
  cleanup();
  arrel = document.createElement('div');
  pinta({ headingLevel: 'x' });
  expect(arrel.querySelector('h3')).not.toBeNull();
});

test('el títol i l’extracte accepten nodes amb <mark>', () => {
  pinta({ href: '/x', titol: <>Pepa <mark>Güell</mark></>, extracte: <>la <mark>festa</mark></> });
  expect([...arrel.querySelectorAll('mark')].map((m) => m.textContent)).toEqual(['Güell', 'festa']);
  expect(arrel.querySelector('a').textContent).toBe('Pepa Güell');
});

/* jsdom no carrega el CSS: es comprova la regla escrita. El títol ja va en
   negreta, així que el <mark> de dins necessita un senyal que no siga el pes. */
test('dins del títol, el <mark> porta un subratllat amb un token semàntic', () => {
  const moduls = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
  const regla = /\.sdp-resultat-cerca__titol mark \{([^}]*)\}/.exec(moduls);
  expect(regla).not.toBeNull();
  expect(regla[1]).toContain('text-decoration-line: underline;');
  expect(regla[1]).toMatch(/text-decoration-color: var\(--sdp-[a-z-]+\);/);
});

/* T5 · Base dels recursos: l'índex de cerca porta camins '/assets/…' crus.
   Mateix origen que la pàgina, com el plugin-url de WordPress: el filtre de
   l'avatar (sanitize.js) només admet el nostre origen. */
test('T5 · amb base, la miniatura i la foto de l’avatar pengen del paquet; sense base, idèntiques', () => {
  pinta({ imatge: { src: '/assets/towns/sella/1.jpg' } });
  expect(arrel.querySelector('img.sdp-resultat-cerca__miniatura').getAttribute('src')).toBe('/assets/towns/sella/1.jpg');
  cleanup();
  const paquet = `${window.location.origin}/wp-content/plugins/socdepoble-enxufe/dist`;
  fixaBaseRecursos(paquet);
  try {
    arrel = document.createElement('div');
    pinta({ imatge: { src: '/assets/towns/sella/1.jpg', alt: 'Sella' } });
    const miniatura = arrel.querySelector('img.sdp-resultat-cerca__miniatura');
    expect(miniatura.getAttribute('src')).toBe(`${paquet}/assets/towns/sella/1.jpg`);
    expect(miniatura.getAttribute('alt')).toBe('Sella');
    cleanup();
    arrel = document.createElement('div');
    pinta({ imatge: { src: `${paquet}/assets/towns/sella/1.jpg` } });
    expect(arrel.querySelector('img.sdp-resultat-cerca__miniatura').getAttribute('src')).toBe(`${paquet}/assets/towns/sella/1.jpg`);
    cleanup();
    arrel = document.createElement('div');
    pinta({ avatar: { nom: 'IAIA MarIA', src: '/assets/fotos/iaia-maria.png', llavor: 'iaia' } });
    expect(arrel.querySelector('img.sdp-avatar__imatge').getAttribute('src')).toBe(`${paquet}/assets/fotos/iaia-maria.png`);
  } finally {
    fixaBaseRecursos('/');
  }
});
