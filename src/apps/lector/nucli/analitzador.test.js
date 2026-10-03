// @vitest-environment node
/* Lector de notícies · l'analitzador de feeds amb fixtures sintètiques
   (__fixtures__/*.xml: RSS 2.0, Atom 1.0, RSS 1.0, XML trencat i vectors
   d'injecció), els ids i el model. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { esIdOpac } from '../../plataforma/rutesAplicacio.js';
import { MAX_ARTICLES, analitzaFeed } from './analitzador.js';
import { BLOCS, ETIQUETES_EN_LINIA, llegixHtml } from './html.js';
import { PATRO_ID, empremta, esIdLector, idArticle } from './ids.js';
import { LIMITS_MODEL, normalitzaArticle, normalitzaCategoria, normalitzaFont, normalitzaResum, resumDeText, senseFinal } from './model.js';

const fixture = (nom) => readFileSync(path.join(process.cwd(), 'src/apps/lector/nucli/__fixtures__', nom), 'utf8');

/* Totes les etiquetes i atributs d'un HTML, llegit amb el mateix lector tolerant. */
function etiquetesDe(html) {
  const etiquetes = new Set();
  const atributs = new Set();
  const recorre = (node) => {
    for (const fill of node.fills) {
      if (typeof fill === 'string') continue;
      etiquetes.add(fill.local);
      for (const clau of fill.atributs.keys()) atributs.add(clau);
      recorre(fill);
    }
  };
  recorre(llegixHtml(html));
  return { etiquetes, atributs };
}

describe('RSS 2.0', () => {
  const { font, articles, errors } = analitzaFeed(fixture('rss2.xml'), { fontId: 'veu-placa' });

  test('la font, amb la imatge relativa resolta contra l’enllaç del canal', () => {
    expect(errors).toEqual([]);
    expect(font).toEqual({
      titol: 'La Veu de la Plaça',
      enllac: 'https://example.org/veu/',
      descripcio: 'Notícies del poble & la comarca',
      imatge: 'https://example.org/imatges/logo.png'
    });
  });

  test('tres notícies: el guid repetit i la que no té títol cauen', () => {
    expect(articles.map((a) => a.titol)).toEqual([
      'Obertes les inscripcions de l’escola d’estiu', 'Talls d\'aigua al carrer Major', 'Sense imatge ni data'
    ]);
    for (const a of articles) {
      expect(esIdOpac(a.id), a.id).toBe(true);
      expect(a.id.startsWith('veu-placa-')).toBe(true);
      expect(a.fontId).toBe('veu-placa');
    }
  });

  test('la primera: enllaç relatiu resolt, data RFC 822 amb zona, autor de dc:creator, resum de description, imatge de media:content', () => {
    const [a] = articles;
    expect(a).toMatchObject({
      enllac: 'https://example.org/2026/10/escola-estiu',
      data: '2026-10-02T07:30:00.000Z',
      autor: 'Redacció',
      resum: 'L’Ajuntament obri les inscripcions de l\'escola d\'estiu.',
      imatge: 'https://example.org/fotos/escola-gran.jpg',
      mitjansOmesos: 1
    });
    expect(a.contingutHtml).toBe('<h3>Inscripcions</h3><p>L\'Ajuntament obri les <strong>inscripcions</strong> fins al <em>15 d\'octubre</em>.</p>'
      + '<p>Més informació a <a href="https://example.org/info" rel="noopener noreferrer" target="_blank">l\'oficina</a>.</p>');
  });

  test('la segona: description amb HTML escapat, autor sense el correu, imatge d’enclosure', () => {
    const [, a] = articles;
    expect(a.autor).toBe('Servei d\'Aigües');
    expect(a.resum).toBe('Dimarts no hi haurà aigua de 8 a 12 & caldrà fer previsió.');
    expect(a.contingutHtml).toBe('<p>Dimarts no hi haurà aigua de 8 a 12 &amp; caldrà fer previsió.</p>');
    expect(a.imatge).toBe('https://example.org/fotos/aixeta.png');
    expect(a.data).toBe('2026-10-01T18:05:00.000Z');
  });

  test('la tercera: sense imatge ni data ni autor', () => {
    const [, , a] = articles;
    expect(a).toMatchObject({ imatge: null, data: null, autor: null, resum: 'Un text pla sense cap etiqueta.' });
  });

  test('els ids són deterministes: el mateix feed dona els mateixos ids', () => {
    const altra = analitzaFeed(fixture('rss2.xml'), { fontId: 'veu-placa' });
    expect(altra.articles.map((a) => a.id)).toEqual(articles.map((a) => a.id));
    expect(analitzaFeed(fixture('rss2.xml'), { fontId: 'una-altra' }).articles[0].id).not.toBe(articles[0].id);
  });
});

describe('Atom 1.0', () => {
  const { font, articles } = analitzaFeed(fixture('atom.xml'), { fontId: 'radio' });

  test('la font: subtítol html en text, logo', () => {
    expect(font).toEqual({
      titol: 'Ràdio del Barranc', enllac: 'https://example.org/radio/', descripcio: 'La ràdio del poble',
      imatge: 'https://example.org/radio/logo.png'
    });
  });

  test('xhtml: el contingut es llig dels nodes; el títol html en text; enllaç relatiu; published abans que updated', () => {
    const [a] = articles;
    expect(a).toMatchObject({
      titol: 'Concert de la banda dissabte',
      enllac: 'https://example.org/radio/concert-banda',
      data: '2026-10-02T06:00:00.000Z',
      autor: 'Equip de la ràdio',
      resum: 'La banda municipal toca dissabte a la plaça.',
      imatge: 'https://example.org/radio/banda.jpg'
    });
    expect(a.contingutHtml).toBe('<h3>Programa</h3><p>Pasdobles i <a href="https://example.org/radio/programa" rel="noopener noreferrer" target="_blank">el programa sencer</a>.</p>'
      + '<ul><li>Primera part</li><li>Segona part</li></ul>');
  });

  test('html: l’iframe es compta i cau; media:thumbnail; sense summary, el resum ix del contingut', () => {
    const [, a] = articles;
    expect(a).toMatchObject({
      autor: 'Marta', imatge: 'https://example.org/radio/entrevista.jpg', resum: 'Parlem del pressupost.',
      mitjansOmesos: 1, data: '2026-10-01T17:45:00.000Z'
    });
    expect(a.contingutHtml).toBe('<p>Parlem del <strong>pressupost</strong>.</p>');
  });

  test('text: les etiquetes són text i les línies en blanc fan paràgrafs', () => {
    const [, , a] = articles;
    expect(a.contingutHtml).toBe('<p>Primer paràgraf amb &lt;etiquetes&gt; que són text.</p><p>Segon paràgraf.</p>');
    expect(a.resum).toBe('Primer paràgraf amb <etiquetes> que són text. Segon paràgraf.');
  });

  test('un Atom sense xmlns també es llig', () => {
    const { articles: sense } = analitzaFeed('<feed><title>F</title><entry><title>E</title><id>x</id><link href="https://example.org/e"/></entry></feed>', { fontId: 'f' });
    expect(sense.map((a) => [a.titol, a.enllac])).toEqual([['E', 'https://example.org/e']]);
  });
});

describe('RSS 1.0', () => {
  test('els ítems són germans del canal; dc:date ISO o RFC; content:encoded', () => {
    const { font, articles, errors } = analitzaFeed(fixture('rss1.xml'), { fontId: 'pregoner' });
    expect(errors).toEqual([]);
    expect(font.titol).toBe('El Pregoner');
    expect(articles.map((a) => [a.titol, a.data, a.autor])).toEqual([
      ['Ban de neteja de solars', '2026-10-02T05:00:00.000Z', 'L\'Ajuntament'],
      ['Horari d\'hivern de la biblioteca', '2026-09-30T10:00:00.000Z', null]
    ]);
    expect(articles[0].contingutHtml).toBe('<p>Cal <em>netejar</em> els solars.</p>');
    expect(articles[0].resum).toBe('Cal netejar els solars abans de l\'1 de novembre.');
  });
});

describe('XML trencat i hostil', () => {
  test('es recupera el que es pot, cap entitat del DOCTYPE s’expandix i les dates impossibles són null', () => {
    const { font, articles, errors } = analitzaFeed(fixture('malformat.xml'), { fontId: 'trencada' });
    expect(font.titol).toBe('Font trencada & mal escrita © &desconeguda;');
    expect(articles.map((a) => a.titol)).toEqual([
      'Primera &c; &extern;', 'Segona, amb una etiqueta que tanca de més', 'Tercera, sense tancar el feed'
    ]);
    expect(articles.map((a) => a.data)).toEqual([null, null, '2026-10-03T00:00:00.000Z']);
    expect(articles[0].resum).toBe('Paràgraf sense tancar');
    expect(errors.length).toBeGreaterThan(0);
  });

  test('cap vector d’injecció arriba a l’HTML net; enllaços i títol nets', () => {
    const { articles } = analitzaFeed(fixture('xss.xml'), { fontId: 'hostil' });
    const [a] = articles;
    /* El títol escapat es llig com a HTML (és el costum dels feeds): l'script cau, i el U+202E també. */
    expect(a.titol).toBe('Hola txt.exe');
    expect(a.enllac).toBeNull();
    expect(a.resum).toBe('Resum net');
    const { etiquetes, atributs } = etiquetesDe(a.contingutHtml);
    for (const etiqueta of etiquetes) expect([...BLOCS, ...ETIQUETES_EN_LINIA], etiqueta).toContain(etiqueta);
    expect([...atributs].sort()).toEqual(['href', 'rel', 'target']);
    expect(a.contingutHtml).not.toMatch(/alert|javascript|vbscript|data:|onerror|onload|onclick|onmouseover|srcdoc|style|usuari/i);
    const enllacos = [...a.contingutHtml.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    expect(enllacos).toEqual(['https://example.org/bo', 'mailto:redaccio', 'https://example.org/b']);
    expect(a.contingutHtml).toContain('<p>Inici</p>');
    expect(a.contingutHtml).toContain('<p>Final</p>');
    /* Una imatge, un svg, dos iframes, un object i un embed. */
    expect(a.mitjansOmesos).toBe(6);
  });

  test('el que no és un feed: font null, cap article i el motiu', () => {
    expect(analitzaFeed('<html><body>no</body></html>')).toEqual({ font: null, articles: [], errors: ['format desconegut: «html»'] });
    expect(analitzaFeed('')).toMatchObject({ font: null, articles: [] });
    expect(analitzaFeed(undefined)).toMatchObject({ font: null, articles: [] });
    expect(analitzaFeed('<rss></rss>')).toMatchObject({ font: null, errors: ['RSS sense <channel>'] });
  });

  test('com a molt MAX_ARTICLES per feed', () => {
    const items = Array.from({ length: MAX_ARTICLES + 5 }, (_, i) => `<item><title>N${i}</title><guid>g${i}</guid></item>`).join('');
    expect(analitzaFeed(`<rss><channel><title>T</title>${items}</channel></rss>`).articles).toHaveLength(MAX_ARTICLES);
  });
});

describe('ids', () => {
  test('el patró és el d’esIdOpac i l’empremta és estable', () => {
    for (const valor of ['a', 'veu-placa-0123456789abcdef', 'x_y', 'A', '-a', 'a b', 'a'.repeat(65), '']) {
      expect(PATRO_ID.test(valor), valor).toBe(esIdOpac(valor));
    }
    expect(empremta('hola')).toBe(empremta('hola'));
    expect(empremta('hola')).toMatch(/^[0-9a-f]{16}$/);
    expect(empremta('hola')).not.toBe(empremta('holb'));
    expect(idArticle('Font Dolenta', 'x')).toMatch(/^a-[0-9a-f]{16}$/);
    expect(esIdLector(idArticle('x'.repeat(50), 'y'))).toBe(true);
  });
});

describe('model', () => {
  test('el resum: sencer fins a 280; si no, tallat per paraula entre 200 i 280, amb «…»', () => {
    expect(resumDeText('  curt  ')).toBe('curt');
    const llarg = Array.from({ length: 80 }, (_, i) => `paraula${i}`).join(' ');
    const resum = resumDeText(llarg);
    expect(resum.length).toBeGreaterThanOrEqual(LIMITS_MODEL.resumMinim);
    expect(resum.length).toBeLessThanOrEqual(LIMITS_MODEL.resum);
    expect(resum.endsWith('…')).toBe(true);
    expect(llarg.startsWith(resum.slice(0, -1))).toBe(true);
    expect(resum.slice(0, -1)).toMatch(/paraula\d+$/);
    const senseEspais = resumDeText('x'.repeat(400));
    expect(senseEspais).toHaveLength(LIMITS_MODEL.resum);
  });

  test('el títol sense punt final; els suspensius es queden', () => {
    expect(senseFinal('Hola.')).toBe('Hola');
    expect(senseFinal('Hola...')).toBe('Hola...');
    expect(senseFinal('Hola…')).toBe('Hola…');
  });

  test('categories i fonts: ids lliures (no reservats), textos nets, icones de la llista i adreces web', () => {
    expect(normalitzaCategoria({ id: 'hui', nom: 'Hui' })).toBeNull();
    /* El U+202E es construïx pel punt de codi: en cru, les portes del repo el vetarien. */
    expect(normalitzaCategoria({ id: 'festes', nom: `  Cultura${String.fromCharCode(0x202E)} i festes `, icona: 'Skull' }, 4))
      .toEqual({ id: 'festes', nom: 'Cultura i festes', ordre: 4, icona: null });
    expect(normalitzaFont({ id: 'veu', nom: 'Veu', categoriaId: 'res', lloc: 'javascript:x', imatge: 'https://example.org/i.png' }, new Set(['festes'])))
      .toEqual({ id: 'veu', nom: 'Veu', categoriaId: null, lloc: null, descripcio: '', imatge: 'https://example.org/i.png' });
    expect(normalitzaFont({ id: 'totes', nom: 'x' })).toBeNull();
  });

  test('resum i article: el que no té id, font o títol cau; el contingut es torna a sanejar', () => {
    expect(normalitzaResum({ id: 'Malament', fontId: 'f', titol: 't' })).toBeNull();
    expect(normalitzaResum({ id: 'a', fontId: 'f', titol: '  ' })).toBeNull();
    const article = normalitzaArticle({
      id: 'a', fontId: 'f', titol: 't', enllac: 'https://example.org/a', data: 'Fri, 02 Oct 2026 09:30:00 +0200',
      contingutHtml: '<p onclick="x()">hola<script>alert(1)</script><img src="/i.png"></p>', mitjansOmesos: 2, extra: 'fora'
    });
    expect(article).toEqual({
      id: 'a', fontId: 'f', titol: 't', enllac: 'https://example.org/a', data: '2026-10-02T07:30:00.000Z', autor: null,
      resum: '', imatge: null, contingutHtml: '<p>hola</p>', mitjansOmesos: 2
    });
  });
});
