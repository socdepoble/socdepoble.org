import { describe, expect, test } from 'vitest';
import { esHostSospitos, segmentaEnllacos, segmentaRutesDeLaWiki } from './enllacos.js';
import { rutaDeDocumentWiki } from '../../data/iaiaLocal.js';
import { wikiManifest } from '../../data/wikiManifest.js';

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
