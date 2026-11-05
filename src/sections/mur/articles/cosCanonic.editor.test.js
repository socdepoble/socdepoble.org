/* P0-26 / IDEA-97 (Onada R6, Bloc 1) · El document dels dos articles canònics
   es pot obrir a l'editor del Bloc de Notes (les mateixes extensions que
   useUniversalRichText i DocumentEditor) sense perdre títols, paràgrafs,
   imatges ni els enllaços de text amb la seua classe (els botons).
   P0-26 D1 (Onada R6, Bloc 2; avisos A1 i A2 de Gemini) · I ara el viatge
   d'anada i tornada és sense pèrdua: els contenidors de maquetació en llista
   blanca (maquetacio.js), el paràgraf centrat, les 43 imatges de l'Aplec i les
   del Manifest amb la seua mida, i l'enllaç al voltant de cada imatge
   enllaçada (enllacImatge.js). Les fotos de galeria no porten cap enllaç:
   continuen obrint el visor. Substituïx la prova que fixava la pèrdua.
   B3-3 (Onada R6, Bloc 3) · I sense perdre res més: la classe del quadre
   d'adhesió, el span.sdp-sr-only del botó i les classes detail-content__*. */
import { afterEach, expect, test } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { SenseSubratllat } from '../../../components/universal/richText/extensions/senseSubratllat.js';
import { extensionsRiques } from '../../../components/universal/richText/extensions/index.js';
import {
  CLASSES_DE_CONTENIDOR, CLASSES_D_ACCIONS, CLASSES_DE_PARAGRAF, CLASSES_DE_TITOL, CLASSES_DE_LLISTA,
} from '../../../components/universal/richText/extensions/maquetacio.js';
import { sanitizeHtml } from '../../../utils/sanitize.js';
import { MANIFEST_DE_POBLE_HTML, MANIFEST_ADHESIO_URL } from './manifestDePobleContent.js';
import { APLEC_2023_HTML } from './aplec2023Content.js';

const editors = [];
afterEach(() => { editors.splice(0).forEach((editor) => editor.destroy()); });

const html = (content) => {
  const editor = new Editor({
    element: document.createElement('div'),
    extensions: [StarterKit.configure({ heading: { levels: [2, 3, 4, 5, 6] }, underline: false }), SenseSubratllat, ...extensionsRiques()],
    content
  });
  editors.push(editor);
  return editor.getHTML();
};
const cosDe = (text) => new DOMParser().parseFromString(`<body>${text}</body>`, 'text/html').body;
const obri = (content) => cosDe(html(content));
const compta = (text, selector) => cosDe(text).querySelectorAll(selector).length;

const SELECTORS_DE_MAQUETACIO = [
  ...CLASSES_DE_CONTENIDOR.map((classe) => `div.${classe}`),
  ...CLASSES_D_ACCIONS.map((classe) => `div.${classe}`),
  ...CLASSES_DE_PARAGRAF.map((classe) => `p.${classe}`),
  'div[data-wp-media-id]',
  'div.sdp-subtargeta.manifest-de-poble__adhesio[data-sdp-subtargeta]',
  'a.sdp-boto > span.sdp-sr-only',
  ...CLASSES_DE_TITOL.map((classe) => `h3.${classe}`),
  ...CLASSES_DE_LLISTA.map((classe) => `ul.${classe}`),
];
/* Cada classe detail-content__* del cos, amb les vegades que hi apareix. */
const tipografiques = (cos) => {
  const comptes = {};
  for (const element of cos.querySelectorAll('[class*="detail-content__"]')) {
    for (const classe of element.classList) {
      if (classe.startsWith('detail-content__')) comptes[`${element.tagName}.${classe}`] = (comptes[`${element.tagName}.${classe}`] ?? 0) + 1;
    }
  }
  return comptes;
};
const maquetacio = (cos) => Object.fromEntries(SELECTORS_DE_MAQUETACIO.map((selector) => [selector, cos.querySelectorAll(selector).length]));
/* Cada imatge: font, mida i l'enllaç que la porta (o res). */
const imatges = (cos) => [...cos.querySelectorAll('img')].map((img) => {
  const enllac = img.closest('a');
  return [img.getAttribute('src'), img.getAttribute('width'), img.getAttribute('height'), enllac?.getAttribute('href') ?? null, enllac?.getAttribute('target') ?? null];
});

test('el Manifest obri a l’editor amb tots els títols, les 8 imatges, els botons i la Subtargeta d’adhesió', () => {
  const cos = obri(MANIFEST_DE_POBLE_HTML);
  expect([...cos.querySelectorAll('h3,h4')].map((h) => h.textContent)).toEqual(
    [...cosDe(MANIFEST_DE_POBLE_HTML).querySelectorAll('h3,h4')].map((h) => h.textContent)
  );
  expect(cos.querySelectorAll('img')).toHaveLength(8);
  expect(cos.querySelector('[data-sdp-subtargeta] h3').textContent).toBe('Formulari d’Adhesió al Manifest de Poble');
  const adhesio = cos.querySelector(`a[href="${MANIFEST_ADHESIO_URL}"]`);
  expect(adhesio.classList.contains('sdp-boto--primari')).toBe(true);
  expect(cos.querySelectorAll('a.sdp-boto--secundari')).toHaveLength(2);
  expect(cos.querySelector('a[href="/events/aplec-2023"]')).not.toBeNull();
  expect(cos.textContent).toContain('Revitalitzant estos aspectes, la resta fluirà sol!');
});

test('l’Aplec obri a l’editor amb la nota de premsa, la llista de ponents i les 43 imatges', () => {
  const cos = obri(APLEC_2023_HTML);
  expect(compta(APLEC_2023_HTML, 'img')).toBe(43);
  expect(cos.querySelectorAll('img')).toHaveLength(43);
  expect(cos.querySelectorAll('h3,h4')).toHaveLength(compta(APLEC_2023_HTML, 'h3,h4'));
  expect(cos.querySelectorAll('ul li')).toHaveLength(12);
  expect(cos.querySelector('a[href="/mur/manifest-de-poble"]')).not.toBeNull();
  expect(cos.textContent).toContain('El format de l’Aplec era molt atractiu');
});

test.each([
  ['el Manifest', MANIFEST_DE_POBLE_HTML],
  ['l’Aplec', APLEC_2023_HTML],
])('%s fa el viatge d’anada i tornada sense perdre contenidors, paràgrafs centrats, mides ni enllaços d’imatge', (_nom, font) => {
  const original = cosDe(font);
  const desat = html(font);
  const cos = cosDe(desat);
  expect(maquetacio(cos)).toEqual(maquetacio(original));
  expect(imatges(cos)).toEqual(imatges(original));
  /* Idempotent: el que es desa es torna a obrir igual. */
  expect(html(desat)).toBe(desat);
  /* I el sanejador del Mur i de Notes no hi lleva res que l'editor necessite. */
  const sanejat = cosDe(sanitizeHtml(desat));
  expect(maquetacio(sanejat)).toEqual(maquetacio(original));
  expect(imatges(sanejat)).toEqual(imatges(original));
  expect(maquetacio(obri(sanitizeHtml(desat)))).toEqual(maquetacio(original));
  expect(tipografiques(cos)).toEqual(tipografiques(original));
  expect(tipografiques(sanejat)).toEqual(tipografiques(original));
});

test('el quadre d’adhesió conserva la seua classe i el botó, el text només per a lectors de pantalla', () => {
  const original = cosDe(MANIFEST_DE_POBLE_HTML);
  const desat = html(MANIFEST_DE_POBLE_HTML);
  for (const cos of [cosDe(desat), cosDe(sanitizeHtml(desat))]) {
    const caixa = cos.querySelector('div[data-sdp-subtargeta]');
    expect(caixa.getAttribute('class')).toBe(original.querySelector('div[data-sdp-subtargeta]').getAttribute('class'));
    const boto = cos.querySelector(`a[href="${MANIFEST_ADHESIO_URL}"]`);
    expect(boto.querySelector('span.sdp-sr-only').textContent).toBe('(s’obri en una altra pestanya)');
    expect(boto.textContent).toBe(original.querySelector(`a[href="${MANIFEST_ADHESIO_URL}"]`).textContent);
    expect(cos.querySelectorAll('span.sdp-sr-only')).toHaveLength(original.querySelectorAll('span.sdp-sr-only').length);
  }
  const aplec = tipografiques(obri(APLEC_2023_HTML));
  expect(Object.keys(aplec).sort()).toEqual(['H3.detail-content__titol', 'P.detail-content__paragraph', 'UL.detail-content__llista']);
});

test('els comptes que fixa el canònic: les galeries, les figures, els logotips enllaçats i els dos paràgrafs centrats', () => {
  const aplec = obri(APLEC_2023_HTML);
  expect(aplec.querySelectorAll('div.aplec-2023__galeria')).toHaveLength(2);
  expect(aplec.querySelectorAll('div.aplec-2023__galeria > div[data-wp-media-id] > img')).toHaveLength(34);
  expect(aplec.querySelectorAll('div.aplec-2023__organitzadores > div.aplec-2023__figura > a.sdp-image-link > img')).toHaveLength(3);
  /* A2 de Gemini · Cap foto de galeria dins d'un enllaç (obrin el visor) i totes amb mida. */
  for (const img of aplec.querySelectorAll('.aplec-2023__galeria img')) {
    expect(img.closest('a')).toBeNull();
    expect(img.getAttribute('width')).toMatch(/^\d+$/);
    expect(img.getAttribute('height')).toMatch(/^\d+$/);
  }
  const manifest = obri(MANIFEST_DE_POBLE_HTML);
  expect(manifest.querySelectorAll('p.sdp-paragraf-centrat')).toHaveLength(2);
  expect([...manifest.querySelectorAll('div.manifest-de-poble__organitzadores > a.sdp-image-link')].map((a) => a.getAttribute('href')))
    .toEqual(['http://zona14.org', '/rentonar', '/socdepoble']);
  expect(manifest.querySelector('a.sdp-image-link[href="/events/aplec-2023"] > img')).not.toBeNull();
  expect(manifest.querySelector('div.manifest-de-poble__documents.sdp-accions > a.sdp-boto--secundari')).not.toBeNull();
  /* L'enllaç bidireccional: el logotip del Manifest a l'Aplec torna al Manifest. */
  expect(aplec.querySelector('a.sdp-image-link[href="/mur/manifest-de-poble"] > img')).not.toBeNull();
});

test('una imatge enllaçada a una pestanya nova conserva noopener i noreferrer', () => {
  const cos = obri('<a href="https://zona14.org" target="_blank"><img src="/assets/events/aplec-2023/logo-rentonar-300x300.png" alt="Logotip"></a>');
  const enllac = cos.querySelector('a.sdp-image-link');
  expect(enllac.getAttribute('target')).toBe('_blank');
  expect(enllac.getAttribute('rel').split(' ')).toEqual(expect.arrayContaining(['noopener', 'noreferrer']));
  const marcada = obri('<img src="/assets/a.png" alt="" data-sdp-href="mailto:hola@socdepoble.org">');
  expect(marcada.querySelector('a.sdp-image-link').getAttribute('href')).toBe('mailto:hola@socdepoble.org');
});

test('cap href insegur ni cap classe fora de la llista blanca no entra', () => {
  const cos = obri([
    '<a href="javascript:alert(1)"><img src="/assets/a.png" alt="u"></a>',
    '<img src="/assets/b.png" alt="dos" data-sdp-href="//dolent.example/x">',
    '<div class="dolent"><p>tres</p></div>',
    '<div class="aplec-2023__figura dolent"><p class="dolent sdp-paragraf-centrat">quatre</p></div>',
    '<div data-wp-media-id="12a"><p>cinc</p></div>',
    '<div class="sdp-subtargeta dolent manifest-de-poble__adhesio aplec-2023__figura" data-sdp-subtargeta=""><h3 class="dolent detail-content__titol">sis</h3></div>',
    '<ul class="dolent detail-content__llista"><li><p>set <span class="dolent">vuit</span> <span class="sdp-sr-only dolent">nou</span></p></li></ul>',
  ].join(''));
  expect(cos.querySelector('div[data-sdp-subtargeta]').getAttribute('class')).toBe('sdp-subtargeta manifest-de-poble__adhesio');
  expect(cos.querySelector('h3').getAttribute('class')).toBe('detail-content__titol');
  expect(cos.querySelector('ul').getAttribute('class')).toBe('detail-content__llista');
  expect([...cos.querySelectorAll('span')].map((span) => [span.getAttribute('class'), span.textContent])).toEqual([['sdp-sr-only', 'nou']]);
  expect(cos.querySelectorAll('img')).toHaveLength(2);
  expect(cos.querySelector('a')).toBeNull();
  expect(cos.querySelector('.dolent')).toBeNull();
  expect(cos.querySelector('div.aplec-2023__figura > p.sdp-paragraf-centrat').getAttribute('class')).toBe('sdp-paragraf-centrat');
  expect(cos.querySelector('[data-wp-media-id]')).toBeNull();
  expect(cos.textContent).toContain('cinc');
});

test('l’ordre enllacaImatge posa, refusa i lleva l’enllaç de la imatge triada', () => {
  const editor = new Editor({
    element: document.createElement('div'),
    extensions: [StarterKit.configure({ underline: false }), SenseSubratllat, ...extensionsRiques()],
    content: '<img src="/assets/a.png" alt="u" width="10" height="10">'
  });
  editors.push(editor);
  editor.commands.setNodeSelection(0);
  expect(editor.commands.enllacaImatge({ href: 'javascript:alert(1)' })).toBe(false);
  expect(editor.commands.enllacaImatge({ href: '/\\dolent.example' })).toBe(false);
  expect(editor.getHTML()).not.toContain('<a');
  expect(editor.commands.enllacaImatge({ href: 'https://zona14.org', target: '_blank', rel: 'nofollow dolent' })).toBe(true);
  const enllac = cosDe(editor.getHTML()).querySelector('a.sdp-image-link > img[width="10"]').parentElement;
  expect(enllac.getAttribute('rel')).toBe('noopener noreferrer nofollow');
  editor.commands.setNodeSelection(0);
  expect(editor.commands.enllacaImatge({ href: '' })).toBe(true);
  expect(cosDe(editor.getHTML()).querySelector('a')).toBeNull();
});
