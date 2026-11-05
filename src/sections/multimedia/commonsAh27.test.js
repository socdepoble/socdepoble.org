// @vitest-environment node
import { expect, test } from 'vitest';
import { DADES_POBLES_APLEC_VIQUIPEDIA } from '../pobles/poblesAplecViquipedia.js';
import { TOWNS } from '../pobles/townsContent.js';
import { MANIFEST_DE_POBLE_POST } from '../mur/feedSeed.js';
import { CENS_IMATGES, mitjansDelCens } from './censImatges.js';
import { fotosDelMur, fotosDelsPobles } from './mediaContent.js';
import { creditDeCommons, dretsDe, metadadesDeCommons } from './origenImatges.js';
import { autorDeclarat, filesDelPanell } from './panellDeLaFoto.js';

const fotografies = fotosDelsPobles(TOWNS);
const arxiu = mitjansDelCens();

test('AH-27 · el logotip del Manifest és una portada editorial i no una fotografia', () => {
  expect(fotosDelMur([MANIFEST_DE_POBLE_POST])).toEqual([]);
  expect(fotosDelMur([{ id: 'foto', image_url: '/assets/fotografia.webp' }])).toHaveLength(1);
});

test.each(['benimassot', 'planes', 'la-torre-de-les-macanes'])('AH-27 · %s conserva domini públic, autoria i font en els dos DTO', (id) => {
  const dada = DADES_POBLES_APLEC_VIQUIPEDIA[id];
  const font = dada.wikipedia_provenance.photo;
  expect(font.llicencia).toBe('Public domain');
  for (const foto of [fotografies.find(item => item.id === `town-${id}`), arxiu.find(item => item.src === dada.image_url)]) {
    expect(foto.creditCommons.fontUrl).toBe(new URL(font.fontUrl).href);
    expect(autorDeclarat(foto)).toBe(font.autor);
    expect(dretsDe(foto)).toBe('Public domain');
    const files = filesDelPanell({ ...foto, copyright: 'CC BY-SA genèrica' }, { exif: { autor: 'EXIF antic', copyright: 'CC BY-SA EXIF' } });
    expect(files.find(fila => fila.clau === 'autor')).toMatchObject({ valor: font.autor, href: new URL(font.fontUrl).href });
    expect(files.find(fila => fila.clau === 'drets')).toMatchObject({ valor: 'Public domain', href: new URL(font.fontUrl).href });
  }
});

test('AH-27 · els 22 crèdits passen al cens i al mitjà de la fitxa, sense escuts ni drets del text', () => {
  for (const [id, dada] of Object.entries(DADES_POBLES_APLEC_VIQUIPEDIA)) {
    const foto = fotografies.find(item => item.id === `town-${id}`);
    const cens = CENS_IMATGES.find(item => item.src === dada.image_url);
    const mitja = arxiu.find(item => item.src === dada.image_url);
    for (const item of [foto, cens, mitja]) {
      expect(item.creditCommons.fitxer, id).toBe(dada.imatges.hero.fitxer);
      expect(item.creditCommons.autor, id).toBe(dada.imatges.hero.autor);
      expect(item.copyright, id).toBe(dada.imatges.hero.llicencia);
      expect(item.creditCommons.fitxer, id).not.toMatch(/escut|shield/i);
    }
  }
});

test('AH-27 · una fotografia CC conserva l’enllaç específic de la seua llicència', () => {
  const foto = fotografies.find(item => item.id === 'town-l-atzubia');
  const files = filesDelPanell(foto);
  expect(autorDeclarat(foto)).toBe('Joanbanjo');
  expect(dretsDe(foto)).toBe('CC BY-SA 3.0');
  expect(files.find(fila => fila.clau === 'drets')).toMatchObject({ valor: 'CC BY-SA 3.0', href: 'https://creativecommons.org/licenses/by-sa/3.0' });
  expect(files.find(fila => fila.clau === 'autor').href).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
});

test('AH-27 · els crèdits no introdueixen URL actives alienes ni canvien l’autoritat d’una aportació', () => {
  const font = DADES_POBLES_APLEC_VIQUIPEDIA['l-atzubia'].imatges.hero;
  const meta = metadadesDeCommons(font);
  for (const fontUrl of ['javascript:alert(1)', 'https://commons.wikimedia.org.evil.test/wiki/File:X', 'https://u:secret@commons.wikimedia.org/wiki/File:X']) {
    expect(metadadesDeCommons({ ...font, fontUrl })).toEqual({});
  }
  const malicios = metadadesDeCommons({ ...font, llicenciaUrl: 'javascript:alert(1)' });
  expect(malicios.creditCommons.llicenciaUrl).toBeNull();
  expect(filesDelPanell({ src: '/x.webp', ...malicios }).find(fila => fila.clau === 'drets').href).toBe(new URL(font.fontUrl).href);
  const aportacio = { src: '/foto.jpg', ...meta, ownerUserId: 'veina', copyright: '(c) Veïna' };
  expect(creditDeCommons(aportacio)).toBeNull();
  expect(dretsDe(aportacio)).toBe('(c) Veïna');
  expect(dretsDe({ src: '/foto.jpg', ...metadadesDeCommons({ ...font, llicencia: 'Fet per la IAIA' }) })).toBeNull();
});
