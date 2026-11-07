/* R12 de Codex (Onada R6, Bloc 4) · El vídeo editorial: l'iframe només el pinta
   VideoEditorial, amb un id de YouTube vàlid i l'origen sense galetes; el cos
   desat guarda un marcador inert (div[data-sdp-youtube]) que el sanejador
   conserva i que l'editor del Bloc de Notes llig i torna a escriure igual. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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

/* Gauntlet R9 · G2-04 · La façana: el botó del vídeo, en la llengua de la interfície (ací, la de reserva).
   R10 · VFC-09 · El seu nom comença pel text visible del botó i acaba amb el títol del vídeo. */
const VEURE = ca['editor.video.veure'];
const esBotoDeVideo = (nom) => nom.startsWith(VEURE);
const obri = (container) => fireEvent.click(within(container).getByRole('button', { name: esBotoDeVideo }));

describe('VideoEditorial · l’únic iframe', () => {
  test('G2-04 · abans del clic, cap iframe ni cap adreça de tercers; després, un sol iframe', () => {
    const { container } = render(<VideoEditorial id={ID} title="  2n   Aplec  " />);
    expect(container.querySelectorAll('iframe')).toHaveLength(0);
    /* Cap miniatura ni cap atribut que el navegador puga demanar a fora (i.ytimg.com, youtube…). */
    expect(container.querySelectorAll('img, picture, video, embed, object, source, link')).toHaveLength(0);
    expect(container.querySelectorAll('[src], [href], [srcset], [poster], [data], [style]')).toHaveLength(0);
    expect(container.innerHTML).not.toMatch(/ytimg|youtube\.com|youtube-nocookie/);
    expect(container.textContent).toContain('2n Aplec');
    expect(container.textContent).toContain(ca['editor.video.avisTercers']);
    expect(ca['editor.video.veure']).toBe('Veure el vídeo (YouTube)');
    obri(container);
    expect(container.querySelectorAll('iframe')).toHaveLength(1);
    expect(within(container).queryByRole('button', { name: esBotoDeVideo })).toBeNull();
    expect(document.activeElement).toBe(container.querySelector('iframe'));
  });

  /* FBV-01 · La façana porta la seua classe: modules.css la pinta amb el crom dins de .aplec-2023__video
     (src/css/videoEditorialFacana.capes.test.js en comprova les regles). */
  test('FBV-01 · la façana és l’EstatBuit amb la classe video-editorial__facana', () => {
    const { container } = render(<VideoEditorial id={ID} title="Un" />);
    const facana = container.firstElementChild;
    expect(facana.classList.contains('sdp-buit')).toBe(true);
    expect(facana.classList.contains('video-editorial__facana')).toBe(true);
    expect(facana.querySelector(':scope > .sdp-buit__titol').textContent).toBe('Un');
    expect(facana.querySelector(':scope > .sdp-buit__text').textContent).toBe(ca['editor.video.avisTercers']);
  });

  /* FBV-05 · Qui ja mostra el títol al costat (el visor d'Anatomia Rural) no el repetix a la façana:
     l'avís hi fa de títol, no hi ha cap text duplicat i l'iframe conserva el títol accessible. */
  test('FBV-05 · amb titolVisible={false}, la façana no repetix el títol i l’iframe el conserva', () => {
    const { container } = render(<VideoEditorial id={ID} title="Documental del pou" titolVisible={false} />);
    expect(container.textContent).not.toContain('Documental del pou');
    const facana = container.firstElementChild;
    expect(facana.querySelector(':scope > .sdp-buit__titol').textContent).toBe(ca['editor.video.avisTercers']);
    expect(facana.querySelector(':scope > .sdp-buit__text')).toBeNull();
    expect(container.textContent.split(ca['editor.video.avisTercers'])).toHaveLength(2);
    obri(container);
    expect(container.querySelector('iframe').title).toBe('Documental del pou');
  });

  test('cada vídeo demana el seu clic: obrir-ne un no obri l’altre', () => {
    const { container } = render(<><VideoEditorial id={ID} title="Un" /><VideoEditorial id="abcdefghijk" title="Dos" /></>);
    fireEvent.click(screen.getByRole('button', { name: `${VEURE} Un` }));
    const frames = container.querySelectorAll('iframe');
    expect(frames).toHaveLength(1);
    expect(frames[0].getAttribute('src')).toBe(`${ORIGEN_VIDEO_EDITORIAL}/embed/${ID}`);
    expect(screen.getAllByRole('button', { name: esBotoDeVideo }).map((boto) => boto.textContent)).toEqual([VEURE]);
    expect(screen.getByRole('button', { name: `${VEURE} Dos` })).toBeTruthy();
  });

  /* Gauntlet R10 · VFC-09 · Dos vídeos, dos noms: a la llista de botons d'un lector de pantalla es
     distingixen pel títol. El nom comença pel text visible (WCAG 2.5.3) i la descripció és l'avís. */
  test('VFC-09 · amb dos vídeos, cada botó té un nom propi, amb el títol, i l’avís de descripció', () => {
    render(<><VideoEditorial id={ID} title="2n Aplec" /><VideoEditorial id="abcdefghijk" title="El pou" /></>);
    const botons = screen.getAllByRole('button', { name: esBotoDeVideo });
    expect(botons).toHaveLength(2);
    expect(screen.getByRole('button', { name: `${VEURE} 2n Aplec`, description: ca['editor.video.avisTercers'] })).toBe(botons[0]);
    expect(screen.getByRole('button', { name: `${VEURE} El pou`, description: ca['editor.video.avisTercers'] })).toBe(botons[1]);
    /* El text visible del botó no canvia: el nom hi afig el títol darrere (2.5.3, l'etiqueta dins del nom). */
    for (const boto of botons) expect(boto.textContent).toBe(VEURE);
    /* La descripció és l'avís de la seua façana: ids de useId, un per instància. */
    const descrits = botons.map((boto) => document.getElementById(boto.getAttribute('aria-describedby')));
    expect(new Set(descrits.map((node) => node.id)).size).toBe(2);
    descrits.forEach((node, i) => expect(node.closest('.video-editorial__facana')).toBe(botons[i].closest('.video-editorial__facana')));
  });

  test('VFC-09 · amb titolVisible={false}, el títol entra al nom i el text de la façana no el repetix', () => {
    const { container } = render(<><VideoEditorial id={ID} title="Documental del pou" titolVisible={false} /><VideoEditorial id="abcdefghijk" title="Documental de l’almàssera" titolVisible={false} /></>);
    expect(screen.getByRole('button', { name: `${VEURE} Documental del pou`, description: ca['editor.video.avisTercers'] })).toBeTruthy();
    expect(screen.getByRole('button', { name: `${VEURE} Documental de l’almàssera`, description: ca['editor.video.avisTercers'] })).toBeTruthy();
    expect(container.textContent).not.toMatch(/Documental/);
  });

  /* Gauntlet R10 · VFC-01 · Al Visor d'Anatomia Rural el mateix lloc passa d'un vídeo a l'altre (el pou,
     l'almàssera, el pou). El «sí» del primer no torna: cap iframe sense un clic nou, i el focus no se'n va
     del control que l'usuari fa servir. */
  test('VFC-01 · A→B→A amb el focus fora: cap iframe sense un clic nou i el focus no es mou', () => {
    const B = 'abcdefghijk';
    const Visor = ({ id }) => <><button type="button">Fora</button><VideoEditorial id={id} title="Documental" /></>;
    const { container, rerender } = render(<Visor id={ID} />);
    const fora = screen.getByRole('button', { name: 'Fora' });
    obri(container);
    expect(document.activeElement).toBe(container.querySelector('iframe'));
    fora.focus();
    rerender(<Visor id={B} />);
    expect(container.querySelector('iframe')).toBeNull();
    rerender(<Visor id={ID} />);
    expect(container.querySelector('iframe')).toBeNull();
    expect(within(container).getByRole('button', { name: `${VEURE} Documental` })).toBeTruthy();
    expect(document.activeElement).toBe(fora);
    obri(container);
    expect(container.querySelector('iframe').getAttribute('src')).toBe(`${ORIGEN_VIDEO_EDITORIAL}/embed/${ID}`);
    expect(document.activeElement).toBe(container.querySelector('iframe'));
  });

  test('VFC-01 · amb el vídeo obert, un render nou (un altre títol) no torna a moure el focus', () => {
    const Visor = ({ titol }) => <><button type="button">Fora</button><VideoEditorial id={ID} title={titol} /></>;
    const { container, rerender } = render(<Visor titol="Un" />);
    obri(container);
    const fora = screen.getByRole('button', { name: 'Fora' });
    fora.focus();
    rerender(<Visor titol="Un, retocat" />);
    expect(container.querySelector('iframe').title).toBe('Un, retocat');
    expect(document.activeElement).toBe(fora);
  });

  test('el «sí» és d’un vídeo: si el mateix lloc passa a un altre id, cal un altre clic', () => {
    const { container, rerender } = render(<VideoEditorial id={ID} title="Un" />);
    obri(container);
    expect(container.querySelector('iframe').getAttribute('src')).toBe(`${ORIGEN_VIDEO_EDITORIAL}/embed/${ID}`);
    rerender(<VideoEditorial id="abcdefghijk" title="Un" />);
    expect(container.querySelector('iframe')).toBeNull();
    obri(container);
    expect(container.querySelector('iframe').getAttribute('src')).toBe(`${ORIGEN_VIDEO_EDITORIAL}/embed/abcdefghijk`);
  });

  test('les claus de la façana són als cinc diccionaris, amb valor propi', () => {
    for (const clau of ['editor.video.veure', 'editor.video.avisTercers']) {
      for (const diccionari of [ca, es, en, eu, gl]) expect(diccionari[clau]).toEqual(expect.any(String));
      for (const diccionari of [es, en, eu, gl]) expect(diccionari[clau]).not.toBe(ca[clau]);
      for (const diccionari of [ca, es, en, eu, gl]) expect(diccionari[clau]).toMatch(/YouTube/);
    }
  });

  test('un id vàlid pinta l’iframe de YouTube sense galetes, amb títol i càrrega mandrosa', () => {
    const { container } = render(<VideoEditorial id={ID} title="  2n   Aplec  " />);
    obri(container);
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
    expect(container.textContent).toContain(ca['editor.video.titolPerDefecte']);
    obri(container);
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
    expect(bo.container.querySelector('iframe')).toBeNull();
    obri(bo.container);
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

/* FBV-02 · /legal 2.5 (text segellat) no nomena YouTube ni a l'apartat 11 ni al 21. El comentari del component
   ho ha de dir, perquè l'únic que informa l'usuari és l'avís de la façana. Si una /legal nova nomena YouTube a
   l'apartat 21, esta prova cau i cal posar el comentari al dia.
   Gauntlet R10 · VFC-07 · Però l'apartat 23 (agraïments) sí que enllaça canals de YouTube: el comentari no pot
   dir que tota /legal 2.5 no el nomena, només els apartats 11 i 21. */
describe('FBV-02 · el comentari diu la veritat sobre /legal', () => {
  const llig = (rel) => readFileSync(path.resolve(process.cwd(), rel), 'utf8');
  const apartat = (html, n) => html.slice(html.indexOf(`<h4>${n}. `), html.indexOf(`<h4>${n + 1}. `));

  test('l’apartat 21 de /legal no nomena YouTube i el comentari no el dona per cobert', () => {
    const legal = llig('src/sections/text/legalContent.js');
    for (const n of [11, 21]) {
      const tros = apartat(legal, n);
      expect(tros.length).toBeGreaterThan(200);
      expect(tros).not.toMatch(/youtube/i);
    }
    expect(apartat(legal, 21)).toMatch(/OpenStreetMap/);
    const capcalera = llig('src/components/universal/VideoEditorial.jsx').split('*/')[0].replace(/\s*\n\s*\*\s*/g, ' ');
    expect(capcalera).toMatch(/[Nn]i l'apartat 11 ni el 21 de \/legal 2\.5 no nomenen YouTube/);
    expect(capcalera).not.toMatch(/\/legal 2\.5 no nomena YouTube/);
    expect(capcalera).toMatch(/l'únic que informa l'usuari és l'avís d'esta façana/);
    expect(capcalera).not.toMatch(/apartats 11 i 21: a un servei de fora només s'hi va amb un botó/);
    /* FBV-03 · «Vore mapa» sí que recorda la tria: el comentari no pot dir el contrari. */
    expect(capcalera).toMatch(/«Vore mapa» sí que recorda la tria \(sdp-mapa-fons\)/);
    expect(legal).toMatch(/sdp-mapa-fons/);
  });
});
