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
/* Decisió R5-D5 (COMMIT R6, d79a0b530; townsSeed.js · fusionaAmbAplec i
   fitxaDelPoble.js · fusionaAmbFitxaEditorial) · La fitxa pròpia mana: un poble
   que ja tenia foto real la conserva i la seua fitxa no porta els crèdits de
   Commons; la foto de Commons continua al cens i a l'Arxiu. Dels 22, només La
   Torre té foto pròpia (1.jpg). Les proves AH-27 (c49d173c4, R5) eren anteriors
   a R5-D5: per a la resta, la fitxa ha de continuar sent la de Commons. */
const AMB_FOTO_PROPIA = new Set(['la-torre-de-les-macanes']);

test('AH-27 · el logotip del Manifest és una portada editorial i no una fotografia', () => {
  expect(fotosDelMur([MANIFEST_DE_POBLE_POST])).toEqual([]);
  expect(fotosDelMur([{ id: 'foto', image_url: '/assets/fotografia.webp' }])).toHaveLength(1);
});

test.each(['benimassot', 'planes'])('AH-27 · %s conserva domini públic, autoria i font en els dos DTO', (id) => {
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

test('R5-D5 · La Torre conserva la foto pròpia sense crèdits de Commons; el cens manté la de Commons', () => {
  const dada = DADES_POBLES_APLEC_VIQUIPEDIA['la-torre-de-les-macanes'];
  const font = dada.wikipedia_provenance.photo;
  const foto = fotografies.find(item => item.id === 'town-la-torre-de-les-macanes');
  expect(foto.src).toBe('/assets/towns/la-torre-de-les-macanes/1.jpg');
  expect(foto.src).not.toBe(dada.image_url);
  expect(foto.creditCommons).toBeUndefined();
  const mitja = arxiu.find(item => item.src === dada.image_url);
  expect(mitja.src).toBe('/assets/towns/la-torre-de-les-macanes/commons-ah27.webp');
  expect(mitja.creditCommons.fontUrl).toBe(new URL(font.fontUrl).href);
  expect(autorDeclarat(mitja)).toBe(font.autor);
  expect(dretsDe(mitja)).toBe('Public domain');
});

test('AH-27 · els 22 crèdits passen al cens i al mitjà de la fitxa, sense escuts ni drets del text', () => {
  expect(Object.keys(DADES_POBLES_APLEC_VIQUIPEDIA)).toHaveLength(22);
  for (const [id, dada] of Object.entries(DADES_POBLES_APLEC_VIQUIPEDIA)) {
    const foto = fotografies.find(item => item.id === `town-${id}`);
    const cens = CENS_IMATGES.find(item => item.src === dada.image_url);
    const mitja = arxiu.find(item => item.src === dada.image_url);
    // R5-D5 · Només La Torre deixa de portar la de Commons a la fitxa; la resta, sí.
    expect(foto.src === dada.image_url, id).toBe(!AMB_FOTO_PROPIA.has(id));
    for (const item of AMB_FOTO_PROPIA.has(id) ? [cens, mitja] : [foto, cens, mitja]) {
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
