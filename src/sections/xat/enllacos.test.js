import { describe, expect, test } from 'vitest';
import { esHostSospitos, segmentaEnllacos, segmentaRutesDeLaWiki } from './enllacos.js';
import { ATLES_OPERATIU, PAGINES_PER_A_LA_IAIA, RUTA_INTERNA, rutaDeDocumentWiki, rutaDePagina } from '../../data/iaiaLocal.js';
import { wikiManifest } from '../../data/wikiManifest.js';
import { MOCK_TOWNS } from '../pobles/townsSeed.js';
import { segmentaNegreta } from './negreta.js';

describe('enllaços del xat', () => {
  test('un text sense URL és un sol segment de text', () => {
    expect(segmentaEnllacos('Bon dia a tots')).toEqual([{ tipus: 'text', text: 'Bon dia a tots' }]);
    expect(segmentaEnllacos('')).toEqual([]);
    expect(segmentaEnllacos(null)).toEqual([]);
  });

  test('troba http i https, conserva el text del voltant i lleva la puntuació final', () => {
    const segments = segmentaEnllacos('Mira https://socdepoble.org/mur. I també http://exemple.cat/a?b=1, val?');
    expect(segments).toEqual([
      { tipus: 'text', text: 'Mira ' },
      { tipus: 'enllac', text: 'https://socdepoble.org/mur', href: 'https://socdepoble.org/mur', host: 'socdepoble.org', sospitos: false },
      { tipus: 'text', text: '. I també ' },
      { tipus: 'enllac', text: 'http://exemple.cat/a?b=1', href: 'http://exemple.cat/a?b=1', host: 'exemple.cat', sospitos: false },
      { tipus: 'text', text: ', val?' }
    ]);
  });

  test('marca com a sospitosos els dominis amb punycode, també escrits amb Unicode', () => {
    expect(esHostSospitos('xn--pple-43d.com')).toBe(true);
    expect(esHostSospitos('socdepoble.org')).toBe(false);
    const [enllac] = segmentaEnllacos('http://xn--pple-43d.com/entra');
    expect(enllac.sospitos).toBe(true);
    const [unicode] = segmentaEnllacos('https://аpple.com');
    expect(unicode.tipus).toBe('enllac');
    expect(unicode.sospitos).toBe(true);
  });

  test('mai produïx HTML ni toca protocols que no siguen web', () => {
    const segments = segmentaEnllacos('<b>javascript:alert(1)</b> i ftp://res');
    expect(segments).toEqual([{ tipus: 'text', text: '<b>javascript:alert(1)</b> i ftp://res' }]);
  });

  /* IDEA-53 (pla 261029_1605, Bloc B) · L'asterisc que tanca una negreta no
     és de l'adreça; un que s'aparella amb un altre de dins de l'adreça, sí.
     Gauntlet del Bloc B (QA-B01) · Sense cap negreta oberta abans, el del
     final també és de l'adreça (abans es llevava per paritat). */
  test('l’asterisc del final que tanca una negreta no és de l’adreça; els aparellats, sí', () => {
    expect(segmentaEnllacos('*https://socdepoble.org*')).toEqual([
      { tipus: 'text', text: '*' },
      { tipus: 'enllac', text: 'https://socdepoble.org', href: 'https://socdepoble.org/', host: 'socdepoble.org', sospitos: false },
      { tipus: 'text', text: '*' }
    ]);
    expect(segmentaEnllacos('*https://x.org/a*.').map((segment) => segment.text)).toEqual(['*', 'https://x.org/a', '*.']);
    const [enllac, resta] = segmentaEnllacos('https://x.org/a*.');
    expect([enllac.text, enllac.href, resta]).toEqual(['https://x.org/a*', 'https://x.org/a*', { tipus: 'text', text: '.' }]);
    const [mig] = segmentaEnllacos('https://a.b/c?q=*x*').filter((segment) => segment.tipus === 'enllac');
    expect(mig.href).toBe('https://a.b/c?q=*x*');
    const [senar, cua] = segmentaEnllacos('*https://a.b/c?q=*x**');
    expect(senar).toEqual({ tipus: 'text', text: '*' });
    expect([cua.text, segmentaEnllacos('*https://a.b/c?q=*x**').at(-1)]).toEqual(['https://a.b/c?q=*x*', { tipus: 'text', text: '*' }]);
    expect(segmentaEnllacos('*mira https://a.b/c?q=*x* ara*').map((segment) => segment.text)).toEqual(['*mira ', 'https://a.b/c?q=*x*', ' ara*']);
  });

  /* Gauntlet del Bloc B (QA-B01) · Un asterisc al final d'una adreça és de
     l'adreça (l'href el conserva) si no tanca cap negreta oberta abans en
     la mateixa línia. */
  test('QA-B01 · «?q=foo*» conserva l’asterisc si no tanca cap negreta oberta', () => {
    const url = 'https://example.test/search?q=foo*';
    expect(segmentaEnllacos(url)).toEqual([{ tipus: 'enllac', text: url, href: url, host: 'example.test', sospitos: false }]);
    for (const text of [`Busca ${url} ara`, `(${url})`, `${url}.`, `* llista ${url}`, `*hola\n${url}`, `a*b ${url}`, `**${url}`]) {
      const enllac = segmentaEnllacos(text).find((segment) => segment.tipus === 'enllac');
      expect([text, enllac.text, enllac.href]).toEqual([text, url, url]);
    }
    // Amb una negreta oberta abans, el de la cua la tanca.
    expect(segmentaEnllacos(`*Busca ${url}`).map((segment) => segment.text)).toEqual(['*Busca ', 'https://example.test/search?q=foo', '*']);
  });

  /* Gauntlet del Bloc B (QA-B02) · Les marques que emboliquen una adreça no
     són de l'adreça: l'href és net. */
  test('QA-B02 · «**https://example.test/**»: les marques no entren a l’adreça', () => {
    const enllac = { tipus: 'enllac', text: 'https://example.test/', href: 'https://example.test/', host: 'example.test', sospitos: false };
    expect(segmentaEnllacos('**https://example.test/**')).toEqual([{ tipus: 'text', text: '**' }, enllac, { tipus: 'text', text: '**' }]);
    expect(segmentaEnllacos('*https://example.test/*')).toEqual([{ tipus: 'text', text: '*' }, enllac, { tipus: 'text', text: '*' }]);
    expect(segmentaEnllacos('**text https://example.test/ text**')).toEqual([
      { tipus: 'text', text: '**text ' }, enllac, { tipus: 'text', text: ' text**' }
    ]);
    expect(segmentaEnllacos('(**https://example.test/**).').map((segment) => segment.text)).toEqual(['(**', 'https://example.test/', '**).']);
  });

  test('la cua d’asteriscs i puntuació continua sent lineal (RX-04)', () => {
    const inici = performance.now();
    segmentaEnllacos(`https://a.b/${'*.'.repeat(50_000)}`);
    segmentaEnllacos(`https://a.b/${'*'.repeat(100_001)}`);
    expect(performance.now() - inici).toBeLessThan(1000);
  });
});

/* Gauntlet 261016_1530 (Bloc 3.6.6; relleu F25) · Les rutes de la Wiki de
   Poble que cita la IAIA local. */
describe('segmentaRutesDeLaWiki', () => {
  const rutes = (text) => segmentaRutesDeLaWiki(segmentaEnllacos(text));

  test('cada /wikidepoble?item=<slug> a l’inici o darrere d’un espai és un segment de ruta', () => {
    expect(rutes('Això és el que en sé:\n· Pedra — /wikidepoble?item=pedra_seca\n· Model B — /wikidepoble?item=ADR-2026-09-SOLLUTIA-MODEL-B')).toEqual([
      { tipus: 'text', text: 'Això és el que en sé:\n· Pedra — ' },
      { tipus: 'ruta', text: '/wikidepoble?item=pedra_seca', ruta: '/wikidepoble?item=pedra_seca' },
      { tipus: 'text', text: '\n· Model B — ' },
      { tipus: 'ruta', text: '/wikidepoble?item=ADR-2026-09-SOLLUTIA-MODEL-B', ruta: '/wikidepoble?item=ADR-2026-09-SOLLUTIA-MODEL-B' }
    ]);
    expect(rutes('/wikidepoble?item=a%20b%26c')).toEqual([{ tipus: 'ruta', text: '/wikidepoble?item=a%20b%26c', ruta: '/wikidepoble?item=a%20b%26c' }]);
  });

  test('el punt final de la frase no forma part de la ruta', () => {
    expect(rutes('Mira /wikidepoble?item=genoma.')).toEqual([
      { tipus: 'text', text: 'Mira ' },
      { tipus: 'ruta', text: '/wikidepoble?item=genoma', ruta: '/wikidepoble?item=genoma' },
      { tipus: 'text', text: '.' }
    ]);
  });

  test('ni dins d’una adreça externa, ni enganxada a una paraula, ni sense slug, ni cap altra ruta', () => {
    const externa = 'https://exemple.cat/wikidepoble?item=pedra';
    expect(rutes(externa)).toEqual(segmentaEnllacos(externa));
    expect(rutes(externa)[0].tipus).toBe('enllac');
    for (const text of ['x/wikidepoble?item=pedra', '/wikidepoble?item=', '/wikidepoble', '/mur?item=pedra', 'javascript:/wikidepoble?item=x']) {
      expect([text, rutes(text)]).toEqual([text, [{ tipus: 'text', text }]]);
    }
  });

  /* Revisió adversarial (Bloc 3.6.6) · El contracte dels dos mòduls: la ruta
     que escriu la IAIA local (rutaDeDocumentWiki) és sencera per a la
     bombolla, també amb «!'()*» a l'id i per a cada document de la Wiki. */
  test('la ruta que escriu la IAIA local arriba sencera, també amb «!\'()*» a l’id', () => {
    for (const id of ['a(b)', "l'ànima", 'hola!', 'x*y', 'pedra seca (v2).']) {
      const ruta = rutaDeDocumentWiki(id);
      expect([id, rutes(`· Títol — ${ruta}`)]).toEqual([id, [
        { tipus: 'text', text: '· Títol — ' },
        { tipus: 'ruta', text: ruta, ruta }
      ]]);
      expect(new URL(ruta, 'http://localhost').searchParams.get('item')).toBe(id);
    }
    const trencades = wikiManifest.items
      .map((item) => rutaDeDocumentWiki(item.id))
      .filter((ruta) => rutes(`· ${ruta}`).find((segment) => segment.tipus === 'ruta')?.ruta !== ruta);
    expect(trencades).toEqual([]);
  });

  test('sense cap ruta, els segments són els mateixos objectes', () => {
    const segments = segmentaEnllacos('Hola https://socdepoble.org i adeu');
    const resultat = segmentaRutesDeLaWiki(segments);
    expect(resultat).toEqual(segments);
    resultat.forEach((segment, i) => expect(segment).toBe(segments[i]));
    expect(segmentaRutesDeLaWiki(null)).toEqual([]);
  });
});

/* IDEA-56 (pla 261029_1605, Bloc F.2) · Les rutes de les seccions que cita
   l'Atles de la IAIA (data/iaiaLocal.js): una llista tancada, la mateixa que
   RUTA_INTERNA, que també és enllaç intern a la seua bombolla. */
describe('segmentaRutesDeLaWiki · les rutes de l’Atles, dels pobles i de les pàgines', () => {
  const rutes = (text) => segmentaRutesDeLaWiki(segmentaEnllacos(text));
  const CORPUS = [...new Set([
    ...ATLES_OPERATIU.map((entrada) => entrada.ruta),
    ...MOCK_TOWNS.map((poble) => `/pobles/${poble.id}`),
    ...PAGINES_PER_A_LA_IAIA.map(rutaDePagina)
  ])];
  const NO_SON_RUTES = ['/xat/123', '/admin', '/pobles/', '/page/', '/mercatx', '/mercat?x=1', '/mur?item=pedra', '/mercat*',
    '/pobles/La-Torre', '/page/Legal', '/mercat.x', '/wikidepoble', '/mercat/'];

  test('cada ruta que pot citar la IAIA, al final de la seua línia, és un segment de ruta sencer', () => {
    expect(CORPUS.length).toBeGreaterThan(30);
    for (const ruta of CORPUS) {
      expect([ruta, rutes(`· Títol — ${ruta}`)]).toEqual([ruta, [{ tipus: 'text', text: '· Títol — ' }, { tipus: 'ruta', text: ruta, ruta }]]);
      expect([ruta, rutes(`· A — ${ruta}\n· B — /wikidepoble?item=x`).filter((segment) => segment.tipus === 'ruta').map((segment) => segment.ruta)])
        .toEqual([ruta, [ruta, '/wikidepoble?item=x']]);
    }
  });

  test('la puntuació de la frase es queda fora; enganxada a una paraula, amb una subruta o una consulta, text', () => {
    expect(rutes('Mira /mercat.')).toEqual([{ tipus: 'text', text: 'Mira ' }, { tipus: 'ruta', text: '/mercat', ruta: '/mercat' }, { tipus: 'text', text: '.' }]);
    expect(rutes('/mur, /notes; i /pobles/xixona!').filter((segment) => segment.tipus === 'ruta').map((segment) => segment.ruta))
      .toEqual(['/mur', '/notes', '/pobles/xixona']);
    for (const text of [...NO_SON_RUTES, 'x/mercat', 'javascript:/mercat', 'https://exemple.cat/mercat']) {
      expect([text, rutes(text).some((segment) => segment.tipus === 'ruta')]).toEqual([text, false]);
    }
  });

  /* Les dues llistes (la de la bombolla i RUTA_INTERNA de la IAIA) han de
     ser la mateixa: una ruta que la IAIA cita i la bombolla no enllaça, o al
     revés, és un error. */
  test('RUTA_INTERNA (iaiaLocal.js) i la bombolla diuen el mateix per a cada ruta', () => {
    for (const ruta of [...CORPUS, ...NO_SON_RUTES]) {
      const enllacada = rutes(`· ${ruta}`).some((segment) => segment.tipus === 'ruta' && segment.ruta === ruta);
      expect([ruta, RUTA_INTERNA.test(ruta)]).toEqual([ruta, enllacada]);
    }
  });

  test('dins d’una negreta, la ruta és una peça opaca i l’asterisc enganxat no hi entra', () => {
    const trams = segmentaNegreta(rutes('*mira /mercat ara*'));
    expect(trams).toEqual([{ negreta: true, segments: [{ tipus: 'text', text: 'mira ' }, { tipus: 'ruta', text: '/mercat', ruta: '/mercat' }, { tipus: 'text', text: ' ara' }] }]);
    expect(rutes('*/mercat*').some((segment) => segment.tipus === 'ruta')).toBe(false);
  });

  test('lineal: 4.096 caràcters adversaris sense blanc final en menys de 50 ms', () => {
    const adversaris = [
      ` /pobles/${'a-'.repeat(2_044)}`,
      ' /page/x'.repeat(512),
      ` ${'/pobles/a'.repeat(455)}*`
    ];
    for (const text of adversaris) {
      const inici = performance.now();
      rutes(text);
      expect([text.length >= 4_096, performance.now() - inici < 50]).toEqual([true, true]);
    }
  });
});
