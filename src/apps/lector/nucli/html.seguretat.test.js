// @vitest-environment node
/* Gauntlet 261025_0545 (RX-02, RX-03) · Un feed fet a posta ni congela el
   Lector ni el buida. analitzaFeed corre sencer al fil principal
   (fontRemota.articlesDe), i el temporitzador de la ronda no pot parar-lo.
   · RX-02: polix ajunta els textos veïns, i molts nodes d'un sol espai fan
     una tira llarga de blancs; la vora final que llevava retalla amb /\s+$/
     tornava a recórrer la tira des de cada blanc (quadràtic). Ara és lineal i
     lleva exactament el mateix.
   · RX-03: enLinia passava tots els fills d'un bloc com a arguments de push();
     amb més de ~125.000 textos, RangeError, i la font sencera es perdia.
   Els límits de temps deixen marge per a una màquina carregada i continuen
   molt lluny del quadràtic (abans, de 5 a 30 s). */
import { describe, expect, test } from 'vitest';
import { analitzaFeed } from './analitzador.js';
import { sanejaHtml } from './html.js';

const feed = (descripcio) => '<?xml version="1.0"?><rss version="2.0"><channel><title>t</title><link>https://example.org/</link>'
  + `<item><title>hola</title><link>https://example.org/1</link><description><![CDATA[${descripcio}]]></description></item>`
  + '<item><title>altre</title><link>https://example.org/2</link><description>bo</description></item></channel></rss>';

/* Tots els punts de codi que casa \s: els blancs i els finals de línia d'ECMAScript. */
const BLANCS = Array.from({ length: 0x10000 }, (_, punt) => String.fromCharCode(punt)).filter((c) => /\s/.test(c));

/* Un generador determinista (LCG): la mateixa sèrie en cada execució. */
function generador(llavor) {
  let estat = llavor >>> 0;
  return (maxim) => {
    estat = (Math.imul(estat, 1664525) + 1013904223) >>> 0;
    return estat % maxim;
  };
}

describe('RX-02 · la vora final d’un bloc es lleva en temps lineal', () => {
  test('100.000 nodes d’un espai entre dues lletres: el mateix HTML, en menys d’1 s', () => {
    const n = 100000;
    const inici = performance.now();
    const { html, text } = sanejaHtml(`<p>x${'<?> '.repeat(n)}y</p>`);
    expect(performance.now() - inici).toBeLessThan(1000);
    expect(html).toBe(`<p>x${' '.repeat(n)}y</p>`);
    expect(text).toBe(`x${' '.repeat(n)}y`);
  });

  test('també amb comentaris pel mig, i el final del bloc sí que es lleva', () => {
    const n = 60000;
    const inici = performance.now();
    expect(sanejaHtml(`<p>x${'<!--x--> '.repeat(n)}y</p>`).html).toBe(`<p>x${' '.repeat(n)}y</p>`);
    expect(sanejaHtml(`<p>x${'<?> '.repeat(n)}</p>`).html).toBe('<p>x</p>');
    expect(performance.now() - inici).toBeLessThan(1000);
  });

  test('pel feed sencer (400 KB, la descripció passa dues vegades pel sanejador): menys de 2 s', () => {
    const inici = performance.now();
    const { articles } = analitzaFeed(feed(`<p>x${'<?> '.repeat(100000)}y</p>`), { fontId: 'f', base: 'https://example.org/feed' });
    expect(performance.now() - inici).toBeLessThan(2000);
    expect(articles.map((article) => article.titol)).toEqual(['hola', 'altre']);
  });

  test('les vores de sempre: blancs, salts i buits', () => {
    expect(sanejaHtml('<p> \n a <b> b </b> \t </p><p>c<br> </p><p> <br>d</p>').html).toBe('<p>a <strong> b </strong></p><p>c</p><p>d</p>');
  });

  /* El canvi es basa en esta equivalència d'ECMAScript (trimEnd i \s lleven el
     mateix joc de caràcters): la prova la fixa per a cada blanc i en milers de
     textos aleatoris. */
  test('trimEnd lleva exactament el que llevava /\\s+$/', () => {
    expect(BLANCS.length).toBeGreaterThan(20);
    const trossos = [...BLANCS, 'a', 'b', '.', String.fromCharCode(0x200B), String.fromCharCode(0x85)];
    const atzar = generador(20261025);
    const textos = [...trossos.map((c) => `a${c}`), ...trossos.map((c) => `${c}${c}a${c}`)];
    for (let k = 0; k < 4000; k += 1) {
      let text = '';
      for (let i = atzar(12); i > 0; i -= 1) text += trossos[atzar(trossos.length)];
      textos.push(text);
    }
    for (const text of textos) expect([text, text.trimEnd()]).toEqual([text, text.replace(/\s+$/, '')]);
  });
});

describe('RX-03 · un bloc amb molts fills dins d’una etiqueta en línia', () => {
  test('150.000 textos dins d’una cita dins d’un <b>: no llança i no en perd cap', () => {
    const n = 150000;
    let resultat;
    expect(() => { resultat = sanejaHtml(`<b><blockquote>${'a<?>'.repeat(n)}</blockquote></b>`); }).not.toThrow();
    expect(resultat.html).toBe(`<p><strong>  ${'a'.repeat(n)}  </strong></p>`);
  });

  test('el feed (600 KB) es llig sencer: la font no perd els seus articles', () => {
    let resultat;
    expect(() => { resultat = analitzaFeed(feed(`<b><blockquote>${'a<?>'.repeat(150000)}</blockquote></b>`), { fontId: 'f', base: 'https://example.org/feed' }); }).not.toThrow();
    expect(resultat.articles.map((article) => article.titol)).toEqual(['hola', 'altre']);
  });

  test('els blocs de dins d’una etiqueta en línia es desfan entre espais, com sempre', () => {
    expect(sanejaHtml('<b>a<p>b</p><ul><li>c</li></ul><hr>d</b>').html).toBe('<p><strong>a b   c   d</strong></p>');
  });
});
