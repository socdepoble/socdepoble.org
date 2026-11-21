import test from 'node:test';
import assert from 'node:assert/strict';
import { normalitzaOrigen301, verificaMapaRedireccions301, construeixMapaEditorial301 } from '../seo/mapa-redireccions-301.mjs';

test('R32.23 fast source grammar agrees with the independent public normalizer', () => {
  const tails = ['', '/', 'a', 'a/', '.visible', '...', '.', '..', 'a/./b', 'a/../b',
    'a//b', 'a.b/c', 'a%2Fb', 'a\\b', 'a\n', 'a\0', 'a\ud800', 'a%C3%A9',
    'a%C3%A9s', 'a?x=1', 'a?p=1', 'a?p=01', 'a?page_id=1', 'a?attachment_id=9999999999999999999'];
  const alphabet = 'abcdXYZ019._~-/?:%=#\\\n\0';
  let seed = 3223;
  for (let i = 0; i < 3000; i++) {
    let value = '';
    for (let j = 0; j < i % 41; j++) {
      seed = Math.imul(seed, 1664525) + 1013904223 | 0;
      value += alphabet[(seed >>> 0) % alphabet.length];
    }
    tails.push(value);
  }
  for (const prefix of ['https://socdepoble.net/', 'https://socdepoble.com/', 'http://www.socdepoble.net/']) {
    for (const tail of tails) {
      const source = prefix + tail;
      const expected = normalitzaOrigen301(source);
      const result = verificaMapaRedireccions301({
        redireccions: [{ source, destination: '/mur/final', status: 301 }],
        destinsDisponibles: ['/mur/final'],
      });
      assert.equal(result.valid, expected !== null, JSON.stringify(source));
    }
  }
});

test('R32.23 prepared membership uses the same policy for every leading-zero boundary', () => {
  const sources = [];
  for (let zeros = 0; zeros < 150; zeros++) {
    for (const host of ['net', 'com']) sources.push(`https://socdepoble.${host}/name-${'0'.repeat(zeros)}1`);
  }
  const input = {
    redireccions: sources.map(source => ({ source, destination: '/mur/final1', status: 301 })),
    destinsDisponibles: ['/mur/final1'],
    origensEsperats: sources.map(source => source.replace('https://', 'http://www.')).reverse(),
  };
  assert.equal(verificaMapaRedireccions301(input).valid, true);
  input.redireccions.push({ source: sources[243].replace('https://', 'http://www.'), destination: '/mur/final1', status: 301 });
  assert.equal(verificaMapaRedireccions301(input).errors[0].code, 'origen_duplicat_o_conflictiu');
  const articles = sources.map(linkOriginal => ({ linkOriginal, rutaDestiCanonica: '/mur/final1' }));
  assert.equal(construeixMapaEditorial301(articles, { destinsDisponibles: ['/mur/final1'] }).verificacio.valid, true);
});
