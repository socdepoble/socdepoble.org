import React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { Aplec2023Article } from './Aplec2023Article.jsx';
import { APLEC_GALLERY, APLEC_PRESS_PARAGRAPHS } from './aplec2023Content.js';
import { MOCK_TOWNS, POBLES_APLEC_2023 } from '../../pobles/townsSeed.js';
import { corresponAPestanyaDelPoble, esDelPoble, parlaDelPoble } from '../../pobles/clauDelPoble.js';
import { CALENDAR_EVENTS } from '../eventsSeed.js';
import { dataDElement, momentDElement } from '../../../components/universal/editorial.js';
import { acteAEsdeveniment } from '../agendaMur.js';
import { fixaBaseRecursos } from '../../../config/assetResolver.js';
import { MANIFEST_DE_POBLE_POST } from '../feedSeed.js';
import { publicacionsDelPoble } from '../../pobles/publicacionsDelPoble.js';

afterEach(() => { cleanup(); fixaBaseRecursos(''); });

test('el reportatge de NTC només incrusta YouTube nocookie amb alternativa d’enllaç', () => {
  const { container } = render(<Aplec2023Article />);
  const frames = container.querySelectorAll('iframe');
  expect(frames).toHaveLength(1);
  expect(frames[0].src).toBe('https://www.youtube-nocookie.com/embed/TlZWYbnGuCE');
  expect(frames[0].title).toContain('NTC À Punt');
  expect(container.querySelector('iframe[src*="facebook"]')).toBeNull();
});

test('conserva les 25 fotografies principals i les 9 addicionals reals de la font', () => {
  const { container } = render(<Aplec2023Article />);
  expect(container.querySelector('.aplec-2023__galeria').querySelectorAll('figure')).toHaveLength(25);
  expect(container.querySelector('details').querySelectorAll('figure')).toHaveLength(9);
  expect(new Set(APLEC_GALLERY.map((f) => f.wpId)).size).toBe(34);
  expect(APLEC_GALLERY.map((f) => f.wpId).sort((a, b) => a - b)).toEqual(Array.from({ length: 34 }, (_, i) => 17044 + i));
  for (const foto of APLEC_GALLERY) {
    expect(existsSync(path.resolve('public', `.${foto.src}`))).toBe(true);
  }
});

test('la nota de premsa conserva íntegres els cinc paràgrafs i tots els enllaços documentals', () => {
  const { container } = render(<Aplec2023Article />);
  const text = container.textContent;
  expect(APLEC_PRESS_PARAGRAPHS).toHaveLength(5);
  for (const paragraph of APLEC_PRESS_PARAGRAPHS) expect(text).toContain(paragraph);
  for (const href of ['https://t.me/manifest_de_poble', 'http://zona14.org', 'https://rentonar.blogspot.com', 'https://socdepoble.net', '/mur/manifest-de-poble']) {
    expect(container.querySelector(`a[href="${href}"]`)).not.toBeNull();
  }
  expect(container.querySelector('a[href*="17H8EY4LTWlImwiusvuXlhv9ScpG3iE9M"]')).not.toBeNull();
  expect(text).toContain('673 61 98 59');
  expect(container.querySelector('img[src*="aplec-pel-territori-2023-A4"]')).toBeNull();
  expect(container.querySelector('a[href*="aplec-pel-territori-2023-A4"]')).not.toBeNull();
});

test('totes les fotografies, logotips i enllaços A4 seguixen la base de l’amfitrió', () => {
  fixaBaseRecursos('https://host.test/connector');
  const { container } = render(<Aplec2023Article />);
  for (const image of container.querySelectorAll('img')) expect(image.src).toMatch(/^https:\/\/host\.test\/connector\/assets\/events\/aplec-2023\//);
  expect(container.querySelector('a[href*="aplec-pel-territori-2023-A4"]').href).toContain('https://host.test/connector/assets/');
});

test('la data editorial és 17/11/2022 i la celebració es conserva al calendari el 29/01/2023', () => {
  const event = CALENDAR_EVENTS.find((e) => e.id === 'aplec-2023');
  expect(event.boinaDataPublicacio).toBe(true);
  expect(dataDElement(event).date).toBe('17/11/22');
  expect(momentDElement(event)).toBe(Date.parse('2022-11-17T21:03:41+01:00'));
  expect(acteAEsdeveniment(event).inici.dataHora).toContain('2023-01-29');
  expect(event.calendar_badge.dateTime).toBe('2023-01-29');
  expect(event.author_location).toBe('La Torre de les Maçanes');
  expect(event.pobles_esmentats).toHaveLength(22);
});

test('la façana del vídeo té alçada acotada i fons continu', () => {
  /* El full de secció es va moure a un bloc de modules.css (tractor-vocabulari, css-de-seccio). */
  const css = readFileSync(path.resolve('src/css/modules.css'), 'utf8');
  expect(css).toContain('max-height: min(75vh, 720px)');
  expect(css).toContain('background: var(--sdp-crom-fons)');
});

// Integració AH-17/AH-19: autoria local i pobles participants queden separats.
test('els 21 pobles participants troben l’Aplec a Tot i al carril territorial correcte', () => {
  const event = CALENDAR_EVENTS.find((e) => e.id === 'aplec-2023');
  expect(POBLES_APLEC_2023).toHaveLength(21);
  for (const participant of POBLES_APLEC_2023) {
    const town = MOCK_TOWNS.find((t) => t.id === participant.id);
    expect(town, participant.id).toBeDefined();
    const torre = town.id === 'la-torre-de-les-macanes';
    expect(esDelPoble(event, town), participant.id).toBe(torre);
    expect(parlaDelPoble(event, town), participant.id).toBe(true);
    expect(corresponAPestanyaDelPoble(event, town, 'tot'), participant.id).toBe(true);
    expect(corresponAPestanyaDelPoble(event, town, 'gent'), participant.id).toBe(torre);
    expect(corresponAPestanyaDelPoble(event, town, 'xarxa'), participant.id).toBe(!torre);
  }
  const ebo = MOCK_TOWNS.find((t) => t.id === 'la-vall-d-ebo');
  expect(corresponAPestanyaDelPoble(event, ebo, 'xarxa')).toBe(true);
});

test('AH-27 · Aplec i Manifest apareixen junts als 21 pobles sense confondre autoria i territori', () => {
  const event = CALENDAR_EVENTS.find(item => item.id === 'aplec-2023');
  const fonts = { feedPosts: [MANIFEST_DE_POBLE_POST], events: [event] };
  for (const participant of POBLES_APLEC_2023) {
    const town = MOCK_TOWNS.find(item => item.id === participant.id);
    const torre = town.id === 'la-torre-de-les-macanes';
    for (const item of [event, MANIFEST_DE_POBLE_POST]) {
      expect(corresponAPestanyaDelPoble(item, town, 'tot'), `${town.id}:${item.id}`).toBe(true);
      expect(corresponAPestanyaDelPoble(item, town, 'gent'), `${town.id}:${item.id}`).toBe(torre);
      expect(corresponAPestanyaDelPoble(item, town, 'xarxa'), `${town.id}:${item.id}`).toBe(!torre);
    }
    for (const pestanya of ['tot', torre ? 'gent' : 'xarxa']) {
      expect(publicacionsDelPoble(fonts, town, pestanya).map(row => row.item.id)).toEqual(['manifest-de-poble', 'aplec-2023']);
    }
  }
  const ebo = MOCK_TOWNS.find(item => item.id === 'la-vall-d-ebo');
  expect(publicacionsDelPoble(fonts, ebo, 'xarxa').map(row => row.item.id)).toEqual(['manifest-de-poble', 'aplec-2023']);
});
