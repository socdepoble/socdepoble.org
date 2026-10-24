// @vitest-environment node
/* T5 (P1-07, 261024) · La paritat de les dues llistes blanques: la del servei (fonts.json, que
   llig la funció) i la del frontend (src/data/adaptadors/noticies/cataleg.js, que llig el
   client). Han de dir el mateix, id per id i adreça per adreça: un id que només és a una banda
   seria una font que el Lector demana i el servei no coneix (o a l'inrevés).
   261024 (Lector final), R6 L-09 · I la paritat de les imatges: la miniatura que tria el nucli del
   Lector (analitzaFeed) i que el client demana (imatge(), una adreça https neta) ha de ser una de
   les que el servei recorda d'eixe feed (imatgesDelFeed), amb la mateixa base (el lloc de la font):
   si no, el Lector demanaria una imatge que el servei no coneix (404 i un error a la consola). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { analitzaFeed } from '../../../src/apps/lector/nucli/index.js';
import { CATEGORIES_TERRITORIALS, FONTS_TERRITORIALS } from '../../../src/data/adaptadors/noticies/cataleg.js';
import { adrecaPersonalDelClient } from '../../../src/data/adaptadors/noticies/client.js';
import { imatgesDelFeed } from './gestor.js';

const CATALEG = JSON.parse(readFileSync(path.join(process.cwd(), 'supabase/functions/noticies/fonts.json'), 'utf8'));

describe('fonts.json ↔ cataleg.js', () => {
  test('el contracte i les claus de dalt', () => {
    expect(Object.keys(CATALEG).sort()).toEqual(['categories', 'contracte', 'fonts', 'nota']);
    expect(CATALEG.contracte).toBe('sdp.noticies.v1');
  });

  test('les mateixes fonts, en el mateix ordre, amb el mateix id i la mateixa adreça de feed', () => {
    expect(CATALEG.fonts.map(({ id, feed }) => [id, feed])).toEqual(FONTS_TERRITORIALS.map(({ id, feed }) => [id, feed]));
  });

  test('i la resta de camps, també: cap font diu una cosa al servei i una altra al Lector', () => {
    expect(CATALEG.fonts).toEqual(FONTS_TERRITORIALS.map((font) => ({ ...font })));
    expect(CATALEG.categories).toEqual(CATEGORIES_TERRITORIALS.map((categoria) => ({ ...categoria })));
  });
});

/* Les imatges que demanaria el Lector d'un feed (la del nucli, si el client en fa una adreça) i les
   que en recorda el servei. */
function lesDues(xml, base) {
  const demanades = analitzaFeed(xml, { fontId: 'p', base }).articles.map((article) => adrecaPersonalDelClient(article.imatge ?? '')).filter(Boolean);
  return { demanades, recordades: imatgesDelFeed(xml, base) };
}
const BASES = Object.freeze([null, 'https://blog.example.org']);
const FIXTURES = Object.freeze(['rss2', 'atom', 'rss1', 'malformat', 'xss']);
const CANAL = (items, { enllac = 'https://blog.example.org/' } = {}) => '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" '
  + 'xmlns:media="http://search.yahoo.com/mrss/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">'
  + `<channel><title>Prova</title><atom:link rel="self" href="https://altre.example.org/feed"/>${enllac ? `<link>${enllac}</link>` : ''}`
  + `<image><url>https://blog.example.org/logo.png</url><link>https://altre.example.org/</link></image>${items}</channel></rss>`;
const item = (cos, { enllac = null } = {}) => `<item><title>Una</title>${enllac ? `<link>${enllac}</link>` : ''}${cos}</item>`;
/* Els casos de R6 L-09 i els que el nucli tracta a part: cada un amb la imatge que n'ha d'eixir. */
const CASOS = Object.freeze([
  ['una <img> relativa (WordPress)', CANAL(item('<description><![CDATA[<p><img src="/wp-content/uploads/a.jpg"></p>]]></description>')),
    'https://blog.example.org/wp-content/uploads/a.jpg'],
  ['una de protocol relatiu davant d’una https', CANAL(item('<content:encoded><![CDATA[<img src="//cdn.example.org/b.jpg"><img src="https://cdn.example.org/c.jpg">]]></content:encoded>')),
    'https://cdn.example.org/b.jpg'],
  ['relativa a l’enllaç de l’element, no al del canal', CANAL(item('<description>&lt;img src=&quot;img/d.png&quot;&gt;</description>', { enllac: 'https://blog.example.org/2026/10/entrada/' })),
    'https://blog.example.org/2026/10/entrada/img/d.png'],
  ['un enllaç en CDATA', CANAL(item('<description><![CDATA[<img src="e.png">]]></description>', { enllac: '<![CDATA[https://blog.example.org/post/]]>' })),
    'https://blog.example.org/post/e.png'],
  ['sense enllaç, el guid permanent', CANAL(item('<guid>https://blog.example.org/per-guid/</guid><description><![CDATA[<img src="f.png">]]></description>')),
    'https://blog.example.org/per-guid/f.png'],
  ['un guid que no és permanent no fa de base', CANAL(item('<guid isPermaLink="false">https://blog.example.org/no/</guid><description><![CDATA[<img src="g.png">]]></description>')),
    'https://blog.example.org/g.png'],
  ['sense enllaç al canal ni a l’element: el lloc de la font', CANAL(item('<description><![CDATA[<img src="/h.png">]]></description>'), { enllac: null }),
    'https://blog.example.org/h.png'],
  ['media:content i enclosure relatius', CANAL(item('<media:content url="/m/i.jpg" medium="image"/><enclosure url="/m/j.jpg" type="image/jpeg"/>')),
    'https://blog.example.org/m/i.jpg'],
  ['un data: i una amb credencials no compten; la de dins d’un <noscript>, tampoc', CANAL(item('<description><![CDATA[<img src="data:image/gif;base64,R0lGOD">'
    + '<noscript><img src="https://cdn.example.org/amagada.jpg"></noscript><img src="https://u:p@cdn.example.org/k.jpg"><img src="/l.jpg">]]></description>')),
  'https://blog.example.org/l.jpg'],
  ['la <img> d’un <picture>, i un comentari que no compta', CANAL(item('<description><![CDATA[<!-- <img src="/comentari.jpg"> --><picture><source srcset="/n.webp">'
    + '<img src="/n.jpg"></picture>]]></description>')), 'https://blog.example.org/n.jpg'],
  ['Atom: relativa a l’enllaç «alternate» de l’entrada', '<feed xmlns="http://www.w3.org/2005/Atom"><title>A</title><link rel="self" href="https://altre.example.org/atom"/>'
    + '<link href="https://blog.example.org/"/><entry><title>U</title><id>u</id><link rel="alternate" type="text/html" href="https://blog.example.org/u/"/>'
    + '<content type="html">&lt;img src=&quot;o.png&quot;&gt;</content></entry></feed>', 'https://blog.example.org/u/o.png'],
  ['Atom: sense enllaç a l’entrada, el del feed', '<feed xmlns="http://www.w3.org/2005/Atom"><title>A</title><link href="https://blog.example.org/arrel/"/>'
    + '<entry><title>V</title><id>v</id><summary type="html">&lt;img src=&quot;//cdn.example.org/p.png&quot;&gt;</summary></entry></feed>', 'https://cdn.example.org/p.png'],
  ['una http primer: el nucli la tria i el Lector no demana res', CANAL(item('<description><![CDATA[<img src="http://cdn.example.org/q.jpg"><img src="https://cdn.example.org/r.jpg">]]></description>')),
    null]
]);

describe('R6 L-09 · imatgesDelFeed (servei) ↔ analitzaFeed (nucli del Lector)', () => {
  test.each(FIXTURES)('les fixtures del nucli (%s.xml): cada imatge que demanaria el Lector, el servei la recorda', (nom) => {
    const xml = readFileSync(path.join(process.cwd(), 'src/apps/lector/nucli/__fixtures__', `${nom}.xml`), 'utf8');
    for (const base of BASES) {
      const { demanades, recordades } = lesDues(xml, base);
      for (const adreca of demanades) expect(recordades, `${nom} ${base} ${adreca}`).toContain(adreca);
    }
  });

  test('les fixtures porten imatges de veres que es demanarien (la prova no passa en blanc)', () => {
    const totes = FIXTURES.flatMap((nom) => lesDues(readFileSync(path.join(process.cwd(), 'src/apps/lector/nucli/__fixtures__', `${nom}.xml`), 'utf8'), null).demanades);
    expect(totes.length).toBeGreaterThanOrEqual(4);
  });

  test.each(CASOS)('%s', (nom, xml, esperada) => {
    const { demanades, recordades } = lesDues(xml, 'https://blog.example.org');
    expect(demanades, nom).toEqual(esperada ? [esperada] : []);
    for (const adreca of demanades) expect(recordades, nom).toContain(adreca);
  });
});
