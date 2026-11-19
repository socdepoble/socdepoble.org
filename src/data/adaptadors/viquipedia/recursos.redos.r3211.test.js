// @vitest-environment node
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { describe, expect, test } from 'vitest';
import { RECURSOS, textDeHtml } from './recursos.js';

const KIB64 = 65536;
const ompli = cos => cos.repeat(Math.floor(KIB64 / cos.length)) + 'a'.repeat(KIB64 % cos.length);
const vectors = [
  ['obertures sense tanca', '<'.repeat(KIB64)],
  ['imatges sense tanca', ompli('<img ')],
  ['etiquetes amb tanca final', '<'.repeat(KIB64 - 1) + '>'],
  ['HTML i entitats densos', ompli('<b>Joan</b> &amp; Laia ')],
  ['atributs malformats', ompli('<x a="<" ')],
  ['entitats sense punt i coma', ompli('&#xabcdef')],
  ['entitats repetides', ompli('&lt;a&gt;')],
];
const captura = JSON.parse(readFileSync(new URL('../../../../tests/frontissa/fixtures/viquipedia/fitxers-la-torre-de-les-macanes.json', import.meta.url), 'utf8')).body;

function ambAutor(autor) {
  const payload = structuredClone(captura);
  for (const pagina of payload.query.pages) {
    const info = pagina.imageinfo?.[0];
    if (info) info.extmetadata = { ...info.extmetadata, Artist: { value: autor } };
  }
  return payload;
}

describe('R32.11 · text Commons lineal i contracte conservat', () => {
  test.each([
    ['<a href="/">Joan</a> &amp; <b>Laia</b>', 'Joan & Laia'],
    ['<span>CC BY-SA 4.0</span>', 'CC BY-SA 4.0'],
    ['x <<trencat> y &lt;Pep&gt; &#x41;', 'x y <Pep> A'],
    ['<script>x</script>', 'x'],
    ['abans <sense tancar', 'abans <sense tancar'],
    ['<&amp;> &apos; &desconeguda;', "' &desconeguda;"],
  ])('text pla, mai HTML d’autor: %s', (input, output) => expect(textDeHtml(input)).toBe(output));

  test('diferencial amb l’oracle anterior en HTML curt vàlid, malformat i entitats', () => {
    const peces = ['a', '<', '>', '<b>x</b>', '<img a="<">', '&amp;', '&lt;', '&#65;', '&no;', '\n'];
    // Entitats i retall les fa el mateix consumidor, però una primera passada
    // de l'oracle antic lleva totes les etiquetes (incloses les malformades).
    for (const a of peces) for (const b of peces) for (const c of peces) {
      const input = a + b + c;
      const senseEtiquetesAntic = input.replace(/<[^>]*>/g, ' ');
      expect(textDeHtml(input)).toBe(textDeHtml(senseEtiquetesAntic));
    }
  });

  test.each(vectors)('%s:64KiB <25ms sense memòria cau de resultat', (_nom, input) => {
    expect(Buffer.byteLength(input)).toBe(KIB64);
    for (let i = 0; i < 20; i += 1) textDeHtml('<b>text</b>');
    const inici = performance.now();
    const output = textDeHtml(input);
    expect(typeof output).toBe('string');
    expect(performance.now() - inici).toBeLessThan(25);
  });

  test('traductor real de la captura conserva autoria, llicència i tipus sense mutar el payload', () => {
    const base = RECURSOS.fitxers.traductor(captura);
    expect(base.length).toBeGreaterThan(0);
    const payload = ambAutor('<b>Joan</b> &amp; Laia');
    const abans = JSON.stringify(payload);
    const result = RECURSOS.fitxers.traductor(payload);
    expect(result.length).toBe(base.length);
    for (const [i, fitxer] of result.entries()) {
      expect(fitxer.autor).toBe('Joan & Laia');
      expect({ ...fitxer, autor: base[i].autor }).toEqual(base[i]);
      expect(typeof fitxer.llicencia).toBe(typeof base[i].llicencia);
      expect(typeof fitxer.mime).toBe('string');
    }
    expect(JSON.stringify(payload)).toBe(abans);
  });

  test('la contraprova de64KiB passa pel traductor fitxers, conserva l’original i no congela', () => {
    const autor = '<'.repeat(KIB64);
    const payload = ambAutor(autor);
    const abans = JSON.stringify(payload);
    const inici = performance.now();
    const result = RECURSOS.fitxers.traductor(payload);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every(f => f.autor === autor)).toBe(true);
    expect(performance.now() - inici).toBeLessThan(25);
    expect(JSON.stringify(payload)).toBe(abans);
  });
});
