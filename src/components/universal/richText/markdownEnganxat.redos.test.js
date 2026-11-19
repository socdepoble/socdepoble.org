// @vitest-environment node
/* Les entrades són sintètiques, exactament 64 KiB ASCII. Les marques obertes,
   els tancaments rebutjats i els tokens densos exerciten treball real: un
   munt de marques iguals, tot sol, no descobrix el retrocés del contingut.
   Es mesura cada API pública per separat, sense DOM ni mocks del parser. */
import { performance } from 'node:perf_hooks';
import { describe, expect, test } from 'vitest';
import { markdownAHtml, paragrafsDeText, semblaMarkdown, textPlaDeMarkdown } from './markdownEnganxat.js';

const KIB_64 = 64 * 1024;
const completa = (prefix, cos, sufix = '') => `${prefix}${cos.repeat(Math.floor((KIB_64 - prefix.length - sufix.length) / cos.length))}${'a'.repeat((KIB_64 - prefix.length - sufix.length) % cos.length)}${sufix}`;
const tokensUnics = (imatges) => {
  const parts = [];
  let llarg = 0;
  for (let i = 0; ; i += 1) {
    const token = imatges ? `![a${i}](/)` : `http://x/${i} `;
    if (llarg + token.length > KIB_64) break;
    parts.push(token);
    llarg += token.length;
  }
  return parts.join('') + 'a'.repeat(KIB_64 - llarg);
};
const vectors = [
  ['cursiva oberta', completa('*', 'a')],
  ['negreta oberta', completa('**', 'a')],
  ['guio baix obert', completa('_', 'a')],
  ['doble guio baix obert', completa('__', 'a')],
  ['ratllat obert', completa('~~', 'a')],
  ['cursiva amb tancament rebutjat', completa('*', 'a', '**')],
  ['guio baix amb frontera rebutjada', completa('_', 'a', '_a')],
  ['guio baix doble amb frontera rebutjada', completa('__', 'a', '__a')],
  ['espais abans de la tanca', completa('*a', ' ', '*')],
  ['codis sense tancar', completa('`', 'a')],
  ['URL en codi sense tancar', completa('`https://', 'a')],
  ['etiqueta sense tancar', completa('[', 'a')],
  ['desti sense tancar', completa('[a](', 'a')],
  ['URL angular sense tancar', completa('<https://', 'a')],
  ['credencials rebutjades', completa('https://usuari:', 'a', '@example.org')],
  ['URL i puntuacio', completa('https://example.org/', ')')],
  ['intents de desti', completa('', '[a](')],
  ['intents angulars', completa('', '<https://')],
  ['accents greus alternats', completa('', '`a')],
  ['asteriscs alternats', completa('', '*a* ')],
  ['guions baixos alternats', completa('', '_a_ ')],
  ['negretes denses', completa('', '**a** ')],
  ['enllacos densos', completa('', '[a](/)')],
  ['imatges literals denses', completa('', '![a](/)')],
  ['URL soltes denses', completa('', 'http://x ')],
  ['imatges literals totes uniques', tokensUnics(true)],
  ['URL totes uniques', tokensUnics(false)],
  ['marques repetides', completa('', '*')],
  ['sagnat llarg', completa('', ' ', 'a')],
];
const apis = [semblaMarkdown, markdownAHtml, textPlaDeMarkdown, paragrafsDeText];

for (const api of apis) {
  // Escalfament curt i independent dels vectors; cap mesura es descarta.
  for (let i = 0; i < 20; i += 1) api('**a** _b_ [c](/camí) `d`');
}

describe('escaneig adversarial de 64 KiB · menys de 25 ms per API', () => {
  test.each(vectors)('%s', (_nom, text) => {
    expect(Buffer.byteLength(text)).toBe(KIB_64);
    for (const api of apis) {
      const inici = performance.now();
      const resultat = api(text);
      const duracio = performance.now() - inici;
      expect(typeof resultat).toBe(api === semblaMarkdown ? 'boolean' : 'string');
      expect(duracio, `${api.name}: ${duracio.toFixed(3)} ms`).toBeLessThan(25);
    }
  });
});

describe('fronteres i precedencia del text enganxat', () => {
  test.each([
    ['***x***', '<p><em><strong>x</strong></em></p>', 'x'],
    ['*a **b** c*', '<p><em>a <strong>b</strong> c</em></p>', 'a b c'],
    ['**a *b* c**', '<p><strong>a <em>b</em> c</strong></p>', 'a b c'],
    ['𐐀_x_ i _x_𐐀', '<p>𐐀_x_ i _x_𐐀</p>', '𐐀_x_ i _x_𐐀'],
    ['é__x__ i __x__é', '<p>é__x__ i __x__é</p>', 'é__x__ i __x__é'],
    ['_a_ _b_', '<p><em>a</em> <em>b</em></p>', 'a b'],
    ['** ** i ~~ ~~', '<p>** ** i ~~ ~~</p>', '** ** i ~~ ~~'],
    ['[**x**](/camí) `*literal*`', '<p><a href="/camí">**x**</a> <code>*literal*</code></p>', '**x** *literal*'],
  ])('%s', (text, html, pla) => {
    expect(markdownAHtml(text)).toBe(html);
    expect(paragrafsDeText(text)).toBe(html);
    expect(textPlaDeMarkdown(text)).toBe(pla);
  });
});
