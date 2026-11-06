import React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { Aplec2023Article } from './Aplec2023Article.jsx';
import { APLEC_2023_HTML, APLEC_GALLERY, APLEC_PRESS_PARAGRAPHS, APLEC_VIDEO } from './aplec2023Content.js';
import { permetOrigenMitjans, sanitizeHtml } from '../../../utils/sanitize.js';
import { buildEventsDetailSectionMeta } from '../../detail/detailSectionMeta.jsx';
import { MOCK_TOWNS, POBLES_APLEC_2023 } from '../../pobles/townsSeed.js';
import { corresponAPestanyaDelPoble, esDelPoble, parlaDelPoble } from '../../pobles/clauDelPoble.js';
import { CALENDAR_EVENTS } from '../eventsSeed.js';
import { dataDElement, momentDElement } from '../../../components/universal/editorial.js';
import { acteAEsdeveniment } from '../agendaMur.js';
import { fixaBaseRecursos } from '../../../config/assetResolver.js';
import { MANIFEST_DE_POBLE_POST } from '../feedSeed.js';
import { publicacionsDelPoble } from '../../pobles/publicacionsDelPoble.js';

afterEach(() => { cleanup(); fixaBaseRecursos(''); });
/* Gauntlet R9 · G2-04 · Façana de clic: abans del gest, cap iframe; el clic obri el del vídeo. */
const obriVideos = (root) => {
  const botons = within(root).queryAllByRole('button', { name: 'Veure el vídeo (YouTube)' });
  for (const boto of botons) fireEvent.click(boto);
  return botons.length;
};

test('el reportatge de NTC només incrusta YouTube nocookie amb alternativa d’enllaç', () => {
  const { container } = render(<Aplec2023Article />);
  expect(container.querySelector('iframe')).toBeNull();
  expect(obriVideos(container)).toBe(1);
  const frames = container.querySelectorAll('iframe');
  expect(frames).toHaveLength(1);
  expect(frames[0].src).toBe('https://www.youtube-nocookie.com/embed/TlZWYbnGuCE');
  expect(frames[0].title).toContain('NTC À Punt');
  expect(container.querySelector('iframe[src*="facebook"]')).toBeNull();
});

test('conserva les 25 fotografies principals i les 9 addicionals reals de la font', () => {
  const { container } = render(<Aplec2023Article />);
  /* P0-26 · Sense figure ni details (el sanejador i l'editor no els tenen): un
     div per foto, i les 9 complementàries sota el seu títol. */
  expect(container.querySelector('.aplec-2023__galeria').querySelectorAll(':scope > div[data-wp-media-id]')).toHaveLength(25);
  expect(container.querySelector('.aplec-2023__complement').querySelectorAll('.aplec-2023__galeria > div[data-wp-media-id]')).toHaveLength(9);
  expect(container.querySelector('.aplec-2023__complement h4').textContent).toBe('9 fotografies més de l’arxiu original');
  expect([...container.querySelectorAll('[data-wp-media-id] img')].map((img) => img.getAttribute('src'))).toEqual(APLEC_GALLERY.map((f) => f.src));
  expect(container.querySelectorAll('[data-wp-media-id] img').length).toBe(34);
  expect(container.querySelector('[data-wp-media-id] a')).toBeNull();
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
  /* B4 (Porta Llavor) · Cap telèfon de tercers a la llavor: el restaurant es nomena sense número. */
  expect(text).toContain('Balcó de Travadell');
  expect(text).not.toContain('673 61 98 59');
  expect(container.querySelector('img[src*="aplec-pel-territori-2023-A4"]')).toBeNull();
  expect(container.querySelector('a[href*="aplec-pel-territori-2023-A4"]')).not.toBeNull();
});

test('totes les fotografies, logotips i enllaços A4 seguixen la base de l’amfitrió', () => {
  fixaBaseRecursos('https://host.test/connector');
  /* L'amfitrió registra l'origen del paquet (PedraSecaEmbed.jsx). */
  permetOrigenMitjans('https://host.test/connector');
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

/* P0-26 / IDEA-97 (Onada R6, Bloc 1) · El cos viu en item.content. */
test('la llavor porta l’article sencer en HTML editable i el vídeo com a complement declaratiu', () => {
  const event = CALENDAR_EVENTS.find((e) => e.id === 'aplec-2023');
  expect(event.content).toBe(APLEC_2023_HTML);
  expect(event.video_youtube).toEqual({ id: 'TlZWYbnGuCE', titol: '2n Aplec pel Territori - Benillup: NTC À Punt' });
  expect(event.video_youtube).toBe(APLEC_VIDEO);
  for (const tros of ['El 2n Aplec a À Punt NTC', 'Nota de premsa post-Aplec', 'El format de l’Aplec és innovador', 'href="/mur/manifest-de-poble"',
    'https://www.youtube.com/watch?v=TlZWYbnGuCE', 'https://t.me/manifest_de_poble']) expect(event.content).toContain(tros);
  expect(event.content.match(/<img /g)).toHaveLength(43);
  expect(event.content).not.toMatch(/<(?:figure|figcaption|details|summary|section|time|iframe|h1|h2)\b|\sstyle=|\sid=/);
  const net = sanitizeHtml(event.content);
  expect(net.match(/<img /g)).toHaveLength(43);
  expect(net.match(/<a /g)).toHaveLength(event.content.match(/<a /g).length);
});

test('la fitxa de l’acte pinta item.content quan és HTML i la llavor quan app_content no porta cos; el vídeo, només amb un id vàlid', () => {
  const meta = buildEventsDetailSectionMeta({ events: [], t: (_, fallback) => fallback });
  const base = CALENDAR_EVENTS.find((e) => e.id === 'aplec-2023');
  const editat = render(meta.renderBody({ ...base, content: '<h3>Crònica revisada</h3><p>Text nou.</p>', video_youtube: { id: 'abcdefghijk', titol: 'Un altre reportatge' } }));
  expect(editat.container.querySelector('.aplec-2023 h3').textContent).toBe('Crònica revisada');
  expect(obriVideos(editat.container)).toBe(1);
  expect(editat.container.querySelector('iframe').getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/abcdefghijk');
  expect(editat.container.querySelector('iframe').title).toBe('Un altre reportatge');
  cleanup();
  const { content, video_youtube, ...senseCos } = base;
  void content; void video_youtube;
  const remot = render(meta.renderBody({ ...senseCos, video_youtube: { id: '"><script>' } }));
  expect(remot.container.querySelectorAll('[data-wp-media-id] img')).toHaveLength(34);
  expect(obriVideos(remot.container)).toBe(1);
  expect(remot.container.querySelector('iframe').getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/TlZWYbnGuCE');
  expect(remot.container.querySelectorAll('iframe')).toHaveLength(1);
});
