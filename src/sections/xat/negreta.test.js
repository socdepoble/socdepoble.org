// @vitest-environment node
/* IDEA-53 (pla 261029_1605, Bloc B) · La negreta del xat en funcions pures:
   on són les marques (estil WhatsApp, *text* i **text**), el text sense
   elles, els trams per a pintar amb enllaços dins i el que fan [N] i
   Cmd/Ctrl+B al compositor, amb el comportament literal del pla: amb
   selecció, embolica o desembolica i la selecció queda sobre el text; sense
   selecció, insereix ** amb el cursor al mig. */
import { describe, expect, test } from 'vitest';
import {
  commutaNegreta, esDreceraDeNegreta, marquesDeNegreta, segmentaNegreta, senseMarquesDeNegreta
} from './negreta.js';
import { segmentaEnllacos, tokenitzaText } from './enllacos.js';

/* La Llei del Píxel: tot això es pinta com sempre. */
const NO_CANVIEN = [
  '2 * 3 = 6', '2*3*4', 'a*b', 'a*b*c', '* element\n* element2', 'hola*adeu*', '*hola*s',
  'petons :* :*', 'hola ;*) i adéu ;*)', 'preu 10€* i *IVA inclòs', 'x **y**z',
  '*línia\nsegona*', '*  hola*', '*hola *', '*', '**', '****', '***x***', 'm***a', '',
  // Una lletra de fora del pla bàsic (dues unitats UTF-16) també és de paraula.
  '𝐀*x*', '*x*𝐀', '𠀋*x*'
];

describe('marquesDeNegreta i senseMarquesDeNegreta', () => {
  test('*hola* i **hola**', () => {
    expect(marquesDeNegreta('*hola*')).toEqual([{ obre: 0, tanca: 5, amplada: 1 }]);
    expect(senseMarquesDeNegreta('*hola*')).toBe('hola');
    expect(marquesDeNegreta('**hola**')).toEqual([{ obre: 0, tanca: 6, amplada: 2 }]);
    expect(senseMarquesDeNegreta('**hola**')).toBe('hola');
  });

  test.each(NO_CANVIEN)('%j no canvia', (text) => {
    expect(marquesDeNegreta(text)).toEqual([]);
    expect(senseMarquesDeNegreta(text)).toBe(text);
  });

  test.each([
    ['Bon dia *món*!', 'Bon dia món!'],
    ['(*nota*)', '(nota)'],
    ['«*nota*»', '«nota»'],
    ["l'*aigua*", "l'aigua"],
    ['📢 *AVÍS IMPORTANT*: tall', '📢 AVÍS IMPORTANT: tall'],
    ['**Nota**:', 'Nota:'],
    ['*a* *b*', 'a b'],
    ['*a *b c*', 'a *b c'],
    ['**a*b**', 'a*b'],
    ['*2*3*', '2*3'],
    ['*مرحبا*', 'مرحبا'],
    // Una emoticona no és de paraula: vora.
    ['🍅*tomaca*🍅', '🍅tomaca🍅'],
    /* Documentat: la parella de dins guanya i les de fora es queden en text. */
    ['*a **b** c*', '*a b c*']
  ])('%j → %j', (text, net) => {
    expect(senseMarquesDeNegreta(text)).toBe(net);
  });

  test('entrades estranyes: mai llança', () => {
    for (const valor of [null, undefined, 42, {}, []]) {
      expect(() => marquesDeNegreta(valor)).not.toThrow();
      expect(typeof senseMarquesDeNegreta(valor)).toBe('string');
    }
  });

  test('rendiment: lineal, també amb milers d’obertures sense tancar', () => {
    const advers = `${'*a '.repeat(1365)}*`;
    const llarg = 'x *y* '.repeat(16_667);
    const inici = performance.now();
    for (let i = 0; i < 500; i += 1) marquesDeNegreta(advers);
    senseMarquesDeNegreta(llarg);
    expect(performance.now() - inici).toBeLessThan(1000);
  });
});

describe('segmentaNegreta', () => {
  test('buit → []', () => {
    expect(segmentaNegreta([])).toEqual([]);
    expect(segmentaNegreta(null)).toEqual([]);
  });

  test('sense marques: un sol tram amb els mateixos objectes (el DOM de sempre)', () => {
    const segments = segmentaEnllacos('Bon dia https://socdepoble.org a tots');
    const trams = segmentaNegreta(segments);
    expect(trams).toHaveLength(1);
    expect(trams[0].negreta).toBe(false);
    trams[0].segments.forEach((segment, i) => expect(segment).toBe(segments[i]));
  });

  test('un enllaç dins d’una negreta: el mateix objecte, dins del tram', () => {
    const enllac = { tipus: 'enllac', text: 'https://a.b', href: 'https://a.b/', host: 'a.b', sospitos: false };
    const trams = segmentaNegreta([{ tipus: 'text', text: '*mira ' }, enllac, { tipus: 'text', text: ' ara*' }]);
    expect(trams).toEqual([{ negreta: true, segments: [{ tipus: 'text', text: 'mira ' }, enllac, { tipus: 'text', text: ' ara' }] }]);
    expect(trams[0].segments[1]).toBe(enllac);
  });

  test('*https://socdepoble.org*: tot l’enllaç en negreta', () => {
    const trams = segmentaNegreta(segmentaEnllacos('*https://socdepoble.org*'));
    expect(trams).toHaveLength(1);
    expect(trams[0].negreta).toBe(true);
    expect(trams[0].segments.map((s) => [s.tipus, s.text])).toEqual([['enllac', 'https://socdepoble.org']]);
  });

  test('mai es busquen asteriscs dins d’una adreça', () => {
    const trams = segmentaNegreta(segmentaEnllacos('Hola *món* i https://a.b/c?q=*x* ok'));
    expect(trams.filter((tram) => tram.negreta).flatMap((tram) => tram.segments.map((s) => s.text))).toEqual(['món']);
    const enllac = trams.flatMap((tram) => tram.segments).find((s) => s.tipus === 'enllac');
    expect(enllac.href).toBe('https://a.b/c?q=*x*');
  });
});

describe('commutaNegreta · sense selecció: ** amb el cursor al mig', () => {
  test.each([
    ['', 0, '**', 1],
    ['Hola ', 5, 'Hola **', 6],
    ['hola', 4, 'hola**', 5],
    /* Literal: cap embolcall automàtic de la paraula. */
    ['hola', 2, 'ho**la', 3],
    ['hola', 0, '**hola', 1],
    ['Avís *important*', 16, 'Avís *important***', 17],
    ['hola', 99, 'hola**', 5]
  ])('%j al %i → %j al %i', (valor, cursor, esperat, nouCursor) => {
    expect(commutaNegreta(valor, cursor, cursor)).toEqual({ valor: esperat, inici: nouCursor, fi: nouCursor });
  });

  test('tornar a prémer sobre la parella buida la lleva', () => {
    const primer = commutaNegreta('Hola ', 5, 5);
    expect(commutaNegreta(primer.valor, primer.inici, primer.fi)).toEqual({ valor: 'Hola ', inici: 5, fi: 5 });
    expect(commutaNegreta('**', 1, 1)).toEqual({ valor: '', inici: 0, fi: 0 });
    // Dins d'una tira de tres o més no és una parella buida.
    expect(commutaNegreta('***', 1, 1)).toEqual({ valor: '*****', inici: 2, fi: 2 });
  });

  test('una selecció només d’espais val com a cursor al seu final', () => {
    expect(commutaNegreta('   ', 0, 3)).toEqual({ valor: '   **', inici: 4, fi: 4 });
  });

  test('un cursor dins d’una parella subrogada recula i no selecciona l’emoticona', () => {
    expect(commutaNegreta('a🍅b', 2, 2)).toEqual({ valor: 'a**🍅b', inici: 2, fi: 2 });
  });

  test('índexs estranys: el final del text', () => {
    expect(commutaNegreta('hola', Number.NaN, undefined)).toEqual({ valor: 'hola**', inici: 5, fi: 5 });
    expect(commutaNegreta('hola', -3, -3)).toEqual({ valor: '**hola', inici: 1, fi: 1 });
    expect(commutaNegreta(null, 0, 0)).toEqual({ valor: '**', inici: 1, fi: 1 });
  });
});

describe('commutaNegreta · amb selecció: embolica o desembolica', () => {
  test.each([
    ['Bon dia', 4, 7, 'Bon *dia*', 5, 8],
    ['Bon dia', 0, 3, '*Bon* dia', 1, 4],
    // Els espais de les vores es queden fora (si no, no es pintaria).
    ['Bon dia ', 4, 8, 'Bon *dia* ', 5, 8],
    // Ja era negreta: el contingut o sencera.
    ['Bon *dia*', 5, 8, 'Bon dia', 4, 7],
    ['Bon *dia*', 4, 9, 'Bon dia', 4, 7],
    ['Bon **dia**', 6, 9, 'Bon dia', 4, 7],
    // Literal: el tros triat, sense estendre'l a la paraula.
    ['elmón', 2, 5, 'el*món*', 3, 6],
    // Les negretes de dins es fonen amb la nova.
    ['Bon *dia* tots', 0, 14, '*Bon dia tots*', 1, 13],
    ['*a* *b*', 0, 7, '*a b*', 1, 4],
    // Un tros d'una negreta: en ix i la resta s'hi queda.
    ['Bon *dia tots*', 5, 8, 'Bon dia *tots*', 4, 7],
    ['Bon *dia tots*', 9, 13, 'Bon *dia* tots', 10, 14],
    ['🍅', 0, 2, '*🍅*', 1, 3],
    // La selecció al revés també val.
    ['Bon dia', 7, 4, 'Bon *dia*', 5, 8]
  ])('%j [%i, %i) → %j [%i, %i)', (valor, inici, fi, esperat, nouInici, nouFi) => {
    expect(commutaNegreta(valor, inici, fi)).toEqual({ valor: esperat, inici: nouInici, fi: nouFi });
  });

  test('una selecció que talla una parella subrogada la pren sencera', () => {
    expect(commutaNegreta('🍅', 1, 2)).toEqual({ valor: '*🍅*', inici: 1, fi: 3 });
    expect(commutaNegreta('a🍅', 0, 2)).toEqual({ valor: '*a🍅*', inici: 1, fi: 4 });
  });

  test('anada i tornada: tornar a prémer desfà', () => {
    for (const [valor, inici, fi] of [['Bon dia', 4, 7], ['Avís important: tall de llum', 0, 14], ['*Bon* dia', 6, 9]]) {
      const anada = commutaNegreta(valor, inici, fi);
      const tornada = commutaNegreta(anada.valor, anada.inici, anada.fi);
      expect(tornada.valor).toBe(valor);
      expect(senseMarquesDeNegreta(anada.valor).length).toBe(senseMarquesDeNegreta(valor).length);
    }
  });

  test('diverses línies: línia a línia (la negreta no travessa salts), i a l’inrevés', () => {
    const anada = commutaNegreta('una\ndues\n\ntres', 0, 14);
    expect(anada).toEqual({ valor: '*una*\n*dues*\n\n*tres*', inici: 1, fi: 19 });
    expect(commutaNegreta(anada.valor, anada.inici, anada.fi)).toEqual({ valor: 'una\ndues\n\ntres', inici: 0, fi: 14 });
    expect(commutaNegreta(anada.valor, 0, anada.valor.length)).toEqual({ valor: 'una\ndues\n\ntres', inici: 0, fi: 14 });
    // Si una línia ja ho era, no es toca i s'emboliquen les altres.
    expect(commutaNegreta('*una*\ndues', 0, 10)).toEqual({ valor: '*una*\n*dues*', inici: 0, fi: 11 });
  });
});

describe('commutaNegreta · el límit', () => {
  test('si no hi cap, null i res no canvia', () => {
    expect(commutaNegreta('a b', 0, 3, 4)).toBeNull();
    expect(commutaNegreta('x'.repeat(4095), 4095, 4095, 4096)).toBeNull();
    expect(commutaNegreta('x'.repeat(4094), 4094, 4094, 4096)).toEqual({ valor: `${'x'.repeat(4094)}**`, inici: 4095, fi: 4095 });
  });

  test('desembolicar sempre hi cap', () => {
    const text = `*${'x'.repeat(4094)}*`;
    expect(commutaNegreta(text, 1, 4095, 4096).valor).toBe('x'.repeat(4094));
  });
});

/* Generador determinista (LCG), com a enllacos.seguretat.test.js. */
function generador(llavor) {
  let estat = llavor >>> 0;
  return () => {
    estat = (Math.imul(estat, 1664525) + 1013904223) >>> 0;
    return estat / 2 ** 32;
  };
}

describe('commutaNegreta · propietats', () => {
  const ALFABET = ['a', 'b', 'ç', 'ó', ' ', ' ', '*', '*', '\n', '🍅', '(', ')', '1', '.', ''];
  const SENSE_ASTERISCS = ['a', 'b', 'ç', 'ó', 'x', 'é', '1', '🍅'];

  test('mai llança, i els índexs queden dins del text i en ordre', () => {
    const atzar = generador(261029);
    for (let k = 0; k < 4000; k += 1) {
      const llargada = Math.floor(atzar() * 24);
      let valor = '';
      for (let i = 0; i < llargada; i += 1) valor += ALFABET[Math.floor(atzar() * ALFABET.length)];
      const inici = Math.floor(atzar() * (valor.length + 2)) - 1;
      const fi = Math.floor(atzar() * (valor.length + 2)) - 1;
      const resultat = commutaNegreta(valor, inici, fi);
      expect(resultat).not.toBeNull();
      expect(resultat.inici).toBeGreaterThanOrEqual(0);
      expect(resultat.inici).toBeLessThanOrEqual(resultat.fi);
      expect(resultat.fi).toBeLessThanOrEqual(resultat.valor.length);
    }
  });

  test('embolicar una paraula sencera d’una línia sempre fa una sola negreta exacta, i tornar la desfà', () => {
    const atzar = generador(53);
    for (let k = 0; k < 2000; k += 1) {
      const paraula = () => {
        let p = '';
        const n = 1 + Math.floor(atzar() * 6);
        for (let i = 0; i < n; i += 1) p += SENSE_ASTERISCS[Math.floor(atzar() * SENSE_ASTERISCS.length)];
        return p;
      };
      const paraules = Array.from({ length: 1 + Math.floor(atzar() * 5) }, paraula);
      const valor = paraules.join(' ');
      const triada = Math.floor(atzar() * paraules.length);
      const inici = paraules.slice(0, triada).reduce((suma, p) => suma + p.length + 1, 0);
      const fi = inici + paraules[triada].length;
      const anada = commutaNegreta(valor, inici, fi);
      expect(marquesDeNegreta(anada.valor)).toHaveLength(1);
      expect(anada.valor.slice(anada.inici, anada.fi)).toBe(paraules[triada]);
      expect(commutaNegreta(anada.valor, anada.inici, anada.fi).valor).toBe(valor);
    }
  });
});

describe('esDreceraDeNegreta: Cmd+B o Ctrl+B, com diu el títol', () => {
  test.each([
    [{ key: 'b', metaKey: true }, true],
    [{ key: 'b', ctrlKey: true }, true],
    [{ key: 'B', ctrlKey: true }, true],
    [{ key: 'b', ctrlKey: true, metaKey: true }, false],
    [{ key: 'b' }, false],
    [{ key: 'b', ctrlKey: true, shiftKey: true }, false],
    [{ key: 'b', ctrlKey: true, altKey: true }, false],
    [{ key: 'b', metaKey: true, altKey: true }, false],
    // Una disposició no llatina (ciríl·lic): la tecla física B.
    [{ key: 'и', code: 'KeyB', ctrlKey: true }, true],
    // Dvorak: la tecla física B escriu una x, i no és la drecera.
    [{ key: 'x', code: 'KeyB', ctrlKey: true }, false],
    [{ key: 'i', ctrlKey: true }, false],
    [null, false]
  ])('%j → %s', (e, esperat) => {
    expect(esDreceraDeNegreta(e)).toBe(esperat);
  });
});

/* Gauntlet del Bloc B (QA-B01..B03, onada 261029_1605) · Una sola
   tokenització (tokenitzaText, enllacos.js) per a les adreces i les marques:
   la bombolla (segmentaNegreta), la cita, la previa i la cerca
   (senseMarquesDeNegreta) i el compositor (commutaNegreta) diuen el mateix,
   i mai hi ha cap marca dins d'una adreça. */
describe('una sola tokenització d’adreces i marques (QA-B01..B03)', () => {
  const segmentsDe = (trams) => trams.flatMap((tram) => tram.segments);

  test('QA-B03 · una adreça és opaca: cap marca dins, i el text sense marques la conserva sencera', () => {
    expect(marquesDeNegreta('https://example.test/?q=*x*')).toEqual([]);
    for (const [text, net] of [
      ['https://example.test/?q=*x*', 'https://example.test/?q=*x*'],
      ['Mira https://example.test/?q=*x* i *tu*', 'Mira https://example.test/?q=*x* i tu'],
      ['*mira https://example.test/?q=*x* ara*', 'mira https://example.test/?q=*x* ara'],
      ['https://example.test/search?q=foo*', 'https://example.test/search?q=foo*'],
      ['**https://example.test/**', 'https://example.test/'],
      ['*https://example.test/*.', 'https://example.test/.'],
      ['**text https://example.test/ text**', 'text https://example.test/ text']
    ]) {
      expect([text, senseMarquesDeNegreta(text)]).toEqual([text, net]);
    }
  });

  test('QA-B02 · «**https://example.test/**»: una negreta amb l’enllaç net dins', () => {
    for (const text of ['**https://example.test/**', '*https://example.test/*']) {
      const trams = segmentaNegreta(segmentaEnllacos(text));
      expect(trams.map((tram) => [tram.negreta, tram.segments.map((s) => [s.tipus, s.text, s.href])]))
        .toEqual([[true, [['enllac', 'https://example.test/', 'https://example.test/']]]]);
    }
    const trams = segmentaNegreta(segmentaEnllacos('**text https://example.test/ text**'));
    expect(trams.map((tram) => [tram.negreta, tram.segments.map((s) => s.href ?? s.text)]))
      .toEqual([[true, ['text ', 'https://example.test/', ' text']]]);
    expect(marquesDeNegreta('**https://example.test/**')).toEqual([{ obre: 0, tanca: 23, amplada: 2 }]);
  });

  test('QA-B01 · «?q=foo*» sense cap negreta oberta: cap negreta, i l’href conserva l’asterisc', () => {
    const trams = segmentaNegreta(segmentaEnllacos('Busca https://example.test/search?q=foo* ara'));
    expect(trams.some((tram) => tram.negreta)).toBe(false);
    expect(segmentsDe(trams).filter((s) => s.tipus === 'enllac').map((s) => s.href)).toEqual(['https://example.test/search?q=foo*']);
  });

  test('el compositor no toca els asteriscs de dins d’una adreça', () => {
    // Embolicar una frase amb una adreça no aplana els asteriscs de l'adreça.
    expect(commutaNegreta('mira https://a.b/?q=*x* ara', 0, 27)).toEqual({ valor: '*mira https://a.b/?q=*x* ara*', inici: 1, fi: 28 });
    // Desfer la negreta d'una adreça lleva només les marques de fora.
    expect(commutaNegreta('**https://example.test/**', 2, 23)).toEqual({ valor: 'https://example.test/', inici: 0, fi: 21 });
  });

  test('propietat: la bombolla, el text sense marques i les marques diuen el mateix, i cap marca cau dins d’una adreça', () => {
    const TROSSOS = ['https://a.b/', 'http://x.cat', 'https://e.test/?q=', '*', '*', '**', '***', ' ', '\n', 'a', 'ó', '.', ')', '(',
      'x', '"', '🍅', 'http://', 'http://[', '_'];
    const atzar = generador(2610291858);
    const distints = [];
    for (let k = 0; k < 20_000; k += 1) {
      let text = '';
      for (let i = Math.floor(atzar() * 12); i > 0; i -= 1) text += TROSSOS[Math.floor(atzar() * TROSSOS.length)];
      const trams = segmentaNegreta(segmentaEnllacos(text));
      const marques = marquesDeNegreta(text);
      const pla = segmentsDe(trams).map((s) => s.text).join('');
      const fort = segmentsDe(trams.filter((tram) => tram.negreta)).map((s) => s.text).join('');
      const fortDeLesMarques = marques.map(({ obre, tanca, amplada }) => text.slice(obre + amplada, tanca)).join('');
      const dinsDUnaAdreca = tokenitzaText(text).adreces.some(({ inici, text: adreca }) => marques.some(({ obre, tanca }) => (
        (obre >= inici && obre < inici + adreca.length) || (tanca >= inici && tanca < inici + adreca.length))));
      if (pla !== senseMarquesDeNegreta(text) || fort !== fortDeLesMarques || dinsDUnaAdreca) distints.push(text);
    }
    expect(distints).toEqual([]);
  });

  test('rendiment: 32 KiB adversaris, menys de 50 ms cadascun (lineal, sense retrocés)', () => {
    const MIDA = 32 * 1024;
    const omple = (tros, cap = '', cua = '') => (cap + tros.repeat(Math.ceil(MIDA / tros.length))).slice(0, MIDA - cua.length) + cua;
    const adversaris = [
      omple('*a '), omple('*.', '*https://a.b/'), omple('*', '*https://a.b/'), omple('**https://a.b/c** '),
      omple('*https://a.b/*x '), omple('*x', '*https://a.b/', '*'), omple('**x*', '**https://a.b/', '**'),
      omple(')', 'https://a.b/', '*'), omple('*a\n'), omple('*'), omple('*a **b https://c.d/*e* ** \n'),
      // RX-04: una tira de puntuació que no acaba l'adreça, i un signe al final.
      omple('.', 'https://a.b/', 'x.'), omple('.', '*https://a.b/', 'x*.'), omple('*.', 'https://a.b/', 'x!')
    ];
    for (const text of adversaris) {
      expect(text).toHaveLength(MIDA);
      /* La millor de tres voltes: una màquina carregada no fa caure la prova,
         i una passada quadràtica (milions d'operacions) continua caent. */
      let millor = Infinity;
      for (let volta = 0; volta < 3; volta += 1) {
        const inici = performance.now();
        segmentaNegreta(segmentaEnllacos(text));
        senseMarquesDeNegreta(text);
        millor = Math.min(millor, performance.now() - inici);
      }
      expect([text.slice(0, 16), millor < 50]).toEqual([text.slice(0, 16), true]);
    }
  });
});
