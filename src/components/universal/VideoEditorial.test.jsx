/* R12 de Codex (Onada R6, Bloc 4) · El vídeo editorial: l'iframe només el pinta
   VideoEditorial, amb un id de YouTube vàlid i l'origen sense galetes; el cos
   desat guarda un marcador inert (div[data-sdp-youtube]) que el sanejador
   conserva i que l'editor del Bloc de Notes llig i torna a escriure igual. */
import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { ORIGEN_VIDEO_EDITORIAL, VideoEditorial, esIdVideoEditorial, titolDeVideoEditorial } from './VideoEditorial.jsx';
import VideoEditorialNodeView from './richText/extensions/VideoEditorialNodeView.jsx';
import { SenseSubratllat } from './richText/extensions/senseSubratllat.js';
import { extensionsRiques } from './richText/extensions/index.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import ca from '../../config/idiomes/ca.js';
import es from '../../config/idiomes/es.js';
import en from '../../config/idiomes/en.js';
import eu from '../../config/idiomes/eu.js';
import gl from '../../config/idiomes/gl.js';

const ID = 'TlZWYbnGuCE';
const MARCADOR = `<div data-sdp-youtube="${ID}" data-titol="2n Aplec pel Territori"><a href="https://www.youtube.com/watch?v=${ID}">2n Aplec pel Territori</a></div>`;
const HOSTILS = ['"><script>', 'https://atac.test/x', 'TlZWYbnGuCEx', 'TlZWYbnGuC', 'TlZWYbnGu C', null, undefined, 12345678901, { toString: () => ID }];

const editors = [];
afterEach(() => { editors.splice(0).forEach((editor) => editor.destroy()); cleanup(); });
const editor = (content) => {
  const nou = new Editor({
    element: document.createElement('div'),
    extensions: [StarterKit.configure({ underline: false }), SenseSubratllat, ...extensionsRiques()],
    content,
  });
  editors.push(nou);
  return nou;
};
const cos = (html) => new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body;

describe('VideoEditorial · l’únic iframe', () => {
  test('un id vàlid pinta l’iframe de YouTube sense galetes, amb títol i càrrega mandrosa', () => {
    const { container } = render(<VideoEditorial id={ID} title="  2n   Aplec  " />);
    const frames = container.querySelectorAll('iframe');
    expect(frames).toHaveLength(1);
    expect(frames[0].getAttribute('src')).toBe(`${ORIGEN_VIDEO_EDITORIAL}/embed/${ID}`);
    expect(ORIGEN_VIDEO_EDITORIAL).toBe('https://www.youtube-nocookie.com');
    expect(frames[0].title).toBe('2n Aplec');
    expect(frames[0].getAttribute('loading')).toBe('lazy');
    expect(frames[0].getAttribute('referrerpolicy')).toBe('strict-origin-when-cross-origin');
  });

  test('sense títol, el títol accessible ve del diccionari', () => {
    const { container } = render(<VideoEditorial id={ID} />);
    expect(container.querySelector('iframe').title).toBe(ca['editor.video.titolPerDefecte']);
    for (const diccionari of [ca, es, en, eu, gl]) expect(diccionari['editor.video.titolPerDefecte']).toEqual(expect.any(String));
  });

  test('un id que no és de YouTube no pinta res: ni iframe buit ni origen alternatiu', () => {
    for (const id of HOSTILS) {
      expect(esIdVideoEditorial(id)).toBe(false);
      const { container, unmount } = render(<VideoEditorial id={id} title="x" />);
      expect(container.firstChild).toBeNull();
      unmount();
    }
  });

  test('el títol és text d’una línia i retallat', () => {
    expect(titolDeVideoEditorial('a\n\tb')).toBe('a b');
    expect(titolDeVideoEditorial('x'.repeat(500))).toHaveLength(200);
    expect(titolDeVideoEditorial({})).toBe('');
  });

  test('la vista del node a l’editor pinta el mateix iframe, i res amb un id dolent', () => {
    const bo = render(<VideoEditorialNodeView node={{ attrs: { id: ID, title: 'Reportatge' } }} />);
    expect(bo.container.querySelector('.aplec-2023__video iframe').getAttribute('src')).toBe(`${ORIGEN_VIDEO_EDITORIAL}/embed/${ID}`);
    const dolent = render(<VideoEditorialNodeView node={{ attrs: { id: 'javascript:alert(1)', title: 'x' } }} />);
    expect(dolent.container.querySelector('iframe')).toBeNull();
  });
});

describe('node videoEditorial · marcador inert al cos', () => {
  test('el marcador fa el viatge editor → sanejador → editor sense pèrdua i sense cap iframe', () => {
    const primera = editor(MARCADOR).getHTML();
    const net = sanitizeHtml(primera);
    const segona = editor(net).getHTML();
    for (const html of [primera, net, segona]) {
      const marcadors = cos(html).querySelectorAll('div[data-sdp-youtube]');
      expect(marcadors).toHaveLength(1);
      expect(marcadors[0].getAttribute('data-sdp-youtube')).toBe(ID);
      expect(marcadors[0].getAttribute('data-titol')).toBe('2n Aplec pel Territori');
      expect(marcadors[0].querySelector('a').getAttribute('href')).toBe(`https://www.youtube.com/watch?v=${ID}`);
      /* El sanejador hi afig nofollow als enllaços externs; l'editor el torna a escriure. */
      expect(marcadors[0].querySelector('a').getAttribute('rel')).toMatch(/^noopener noreferrer(?: nofollow)?$/);
      expect(html).not.toMatch(/<iframe/i);
    }
    expect(segona).toBe(primera);
  });

  test('sense títol, l’enllaç de reserva mostra l’adreça i no inventa data-titol', () => {
    const html = editor(`<div data-sdp-youtube="${ID}"></div>`).getHTML();
    const marcador = cos(html).querySelector('div[data-sdp-youtube]');
    expect(marcador.hasAttribute('data-titol')).toBe(false);
    expect(marcador.textContent).toBe(`https://www.youtube.com/watch?v=${ID}`);
  });

  test('un marcador amb un valor hostil no crea el node; un iframe enganxat cau', () => {
    const html = editor('<div data-sdp-youtube="https://atac.test/evil">Buit</div><iframe src="https://atac.test"></iframe><p>Text</p>').getHTML();
    expect(html).not.toMatch(/data-sdp-youtube|iframe|atac\.test/);
    expect(html).toContain('Text');
  });

  test('un document JSON amb un id dolent no desa cap marcador ni cap enllaç', () => {
    const doc = { type: 'doc', content: [{ type: 'videoEditorial', attrs: { id: '"><script>alert(1)</script>', title: '<b>x</b>' } }, { type: 'paragraph', content: [{ type: 'text', text: 'ok' }] }] };
    const html = editor(doc).getHTML();
    expect(html).not.toMatch(/data-sdp-youtube|<script|<a\b|youtube/);
    expect(html).toContain('ok');
  });

  test('dins d’un contenidor de maquetació el marcador continua sent un vídeo', () => {
    const html = editor(`<div class="aplec-2023__complement">${MARCADOR}<p>Peu</p></div>`).getHTML();
    const body = cos(html);
    expect(body.querySelectorAll('div.aplec-2023__complement div[data-sdp-youtube]')).toHaveLength(1);
    expect(body.querySelector('div.aplec-2023__complement').textContent).toContain('Peu');
  });
});
