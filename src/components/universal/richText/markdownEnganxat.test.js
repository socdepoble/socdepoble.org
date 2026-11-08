/* P0-58 (IDEA-189) · El text pla amb Markdown enganxat al cos (el botó de
   copiar de ChatGPT, una llista de WhatsApp) entra amb el nostre format:
   títols h2–h6 (mai el de nivell 1), llistes, cites, separadors, codi,
   enllaços segurs i èmfasi. Tot el text s'escapa abans de construir, ix un
   conjunt tancat d'etiquetes, mai una <img>, cap expressió amb retrocés
   quadràtic i res fora del Baseline (Safari 16 / Chrome 100 / Firefox 100).
   Els porta-retalls de tests/helpers/portaretalls.js són SINTÈTICS. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import { describe, expect, test } from 'vitest';
import { markdownAHtml, paragrafsDeText, semblaMarkdown, textPlaDeMarkdown, urlWebSegura } from './markdownEnganxat.js';
import { sanitizeHtml } from '../../../utils/sanitize.js';
import { ORIGEN_SINTETIC, PORTARETALLS, URL_PROVA_TANCADA } from '../../../../tests/helpers/portaretalls.js';

/* L'HTML llegit sense pintar-lo (DOMParser és inert). */
const cos = (html) => new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body;
const fills = (html) => Array.from(cos(html).children, (e) => e.tagName.toLowerCase());
const ETIQUETES_PERMESES = new Set(['p', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 's', 'code', 'pre', 'a', 'ul', 'ol', 'li', 'blockquote', 'hr', 'br']);

describe('les fixtures', () => {
  test('totes són sintètiques i ho diuen', () => {
    for (const [nom, fixture] of Object.entries(PORTARETALLS)) {
      expect(fixture.origen, nom).toBe(ORIGEN_SINTETIC);
      expect(fixture.font, nom).toBeTruthy();
    }
  });
});

describe('markdownAHtml · blocs (botó de copiar de ChatGPT, SINTÈTIC)', () => {
  const html = markdownAHtml(PORTARETALLS.chatgptBotoCopiar.text);
  const arrel = cos(html);

  test('# i ## donen h2, ### dona h3, - i * donen ul, 1. i 1) donen ol, > dona cita, --- separador i ``` bloc de codi', () => {
    expect(fills(html)).toEqual(['h2', 'h2', 'p', 'h3', 'ul', 'ol', 'blockquote', 'hr', 'p', 'pre', 'p']);
    expect(arrel.querySelector('h1')).toBeNull();
    expect(Array.from(arrel.querySelectorAll('ul > li'), (li) => li.textContent)).toEqual(['Obri Google Play amb el mateix compte.', 'Busca Sóc de Poble.']);
    expect(Array.from(arrel.querySelectorAll('ol > li'), (li) => li.textContent)).toEqual(['Instal·la l’app.', 'Obri-la i entra.']);
    expect(arrel.querySelectorAll('li > p')).toHaveLength(4);
    expect(arrel.querySelector('blockquote > p').textContent).toBe('Si no la trobes, espera uns minuts.');
    expect(arrel.querySelector('pre > code').textContent).toBe('npm run dev');
  });

  test('en línia: negreta, cursiva (* i _), ratllat, enllaç, URL entre accents greus i URL solta sense el punt final', () => {
    expect(arrel.querySelector('strong').textContent).toBe('apunta’t');
    expect(Array.from(arrel.querySelectorAll('em'), (em) => em.textContent)).toEqual(['Google Play', 'Sóc de Poble']);
    expect(arrel.querySelector('s').textContent).toBe('Ja no cal registrar-se.');
    const enllacos = Array.from(arrel.querySelectorAll('a'), (a) => [a.getAttribute('href'), a.textContent]);
    expect(enllacos).toEqual([
      [URL_PROVA_TANCADA, URL_PROVA_TANCADA],
      ['https://socdepoble.org', 'la web'],
      ['https://socdepoble.org/ajuda', 'https://socdepoble.org/ajuda'],
    ]);
    // La URL de la captura ja no és cap codi: l'únic <code> és el del bloc.
    expect(Array.from(arrel.querySelectorAll('code'), (c) => c.parentElement.tagName)).toEqual(['PRE']);
    expect(arrel.querySelectorAll(':scope > p')[1].textContent.endsWith('/ajuda.')).toBe(true);
  });

  test('els nivells dels títols: mai h1; set coixinets no són cap títol', () => {
    expect(markdownAHtml('# a\n## b\n### c\n#### d\n##### e\n###### f\n####### g')).toBe(
      '<h2>a</h2><h2>b</h2><h3>c</h3><h4>d</h4><h5>e</h5><h6>f</h6><p>####### g</p>',
    );
    expect(markdownAHtml('## Títol ##')).toBe('<h2>Títol</h2>');
    expect(markdownAHtml('#etiqueta de xarxa')).toBe('<p>#etiqueta de xarxa</p>');
  });

  test('llistes: les tres vinyetes fan una llista; 1. i 1) una altra; una línia sense marca la talla', () => {
    expect(markdownAHtml('- a\n* b\n+ c')).toBe('<ul><li><p>a</p></li><li><p>b</p></li><li><p>c</p></li></ul>');
    expect(markdownAHtml('1. a\n1) b\nfi')).toBe('<ol><li><p>a</p></li><li><p>b</p></li></ol><p>fi</p>');
    expect(markdownAHtml('- a\n\n- b')).toBe('<ul><li><p>a</p></li><li><p>b</p></li></ul>');
  });

  /* C-02 · Fora de la Wiki, sanitizeHtml lleva el start de les <ol> (WC-06):
     una llista que comença per 3 es tornaria 1, 2 en silenci. Una llista
     numerada que no comença per 1 es queda com el text que era (un <p> per
     línia, amb el número); dins d'una llista oberta només mana el primer
     número (CommonMark). */
  test('una llista numerada que no comença per 1 es queda literal, amb els seus números', () => {
    expect(sanitizeHtml('<ol start="3"><li>x</li></ol>')).not.toContain('start');
    expect(markdownAHtml('3. Tercer\n4. Quart')).toBe('<p>3. Tercer</p><p>4. Quart</p>');
    expect(markdownAHtml('# Història\n2024. Un any per recordar')).toBe('<h2>Història</h2><p>2024. Un any per recordar</p>');
    expect(markdownAHtml('- a\n  3) **x**')).toBe('<ul><li><p>a</p><p>3) <strong>x</strong></p></li></ul>');
    expect(markdownAHtml('1. a\n3. b')).toBe('<ol><li><p>a</p></li><li><p>b</p></li></ol>');
    expect(markdownAHtml('01. a\n02. b')).toBe('<ol><li><p>a</p></li><li><p>b</p></li></ol>');
  });

  test('passos numerats de ChatGPT: subllista, paràgraf i bloc de codi sagnats queden dins del pas (no torna a començar per 1)', () => {
    const text = '1. Pas u\n   - detall\n2. Pas dos\n\n   Paràgraf del pas dos\n3. Instal·la:\n   ```bash\n   npm i\n   ```\n4. Obri';
    expect(markdownAHtml(text)).toBe(
      '<ol><li><p>Pas u</p><ul><li><p>detall</p></li></ul></li>'
      + '<li><p>Pas dos</p><p>Paràgraf del pas dos</p></li>'
      + '<li><p>Instal·la:</p><pre><code>npm i</code></pre></li>'
      + '<li><p>Obri</p></li></ol>',
    );
  });

  test('cites: les línies seguides fan una cita; una línia buida en comença una altra', () => {
    expect(markdownAHtml('> u\n> dos\n\n> tres')).toBe('<blockquote><p>u</p><p>dos</p></blockquote><blockquote><p>tres</p></blockquote>');
  });

  test('un bloc de codi amb només una URL és un enllaç; sense tancar, arriba fins al final', () => {
    expect(markdownAHtml('```\nhttps://example.org/a\n```')).toBe('<p><a href="https://example.org/a">https://example.org/a</a></p>');
    expect(markdownAHtml('```js\nconst a = 1 < 2;\n\nfi')).toBe('<pre><code>const a = 1 &lt; 2;\n\nfi</code></pre>');
  });

  test('la resta, cada línia un <p> (el que fa ProseMirror amb el text pla)', () => {
    expect(markdownAHtml('## T\nu\ndos\n\ntres')).toBe('<h2>T</h2><p>u</p><p>dos</p><p>tres</p>');
  });
});

describe('markdownAHtml · en línia', () => {
  test.each([
    ['**x**', '<p><strong>x</strong></p>'],
    ['__x__', '<p><strong>x</strong></p>'],
    ['*x*', '<p><em>x</em></p>'],
    ['_x_', '<p><em>x</em></p>'],
    ['~~x~~', '<p><s>x</s></p>'],
    ['[web](https://example.org)', '<p><a href="https://example.org">web</a></p>'],
    ['`https://example.org`', '<p><a href="https://example.org">https://example.org</a></p>'],
    ['<https://example.org>', '<p><a href="https://example.org">https://example.org</a></p>'],
    ['Mira https://example.org.', '<p>Mira <a href="https://example.org">https://example.org</a>.</p>'],
    ['(vegeu https://example.org/a)', '<p>(vegeu <a href="https://example.org/a">https://example.org/a</a>)</p>'],
    ['https://ca.wikipedia.org/wiki/Alcoi_(ciutat)', '<p><a href="https://ca.wikipedia.org/wiki/Alcoi_(ciutat)">https://ca.wikipedia.org/wiki/Alcoi_(ciutat)</a></p>'],
    ['**https://example.org**', '<p><strong><a href="https://example.org">https://example.org</a></strong></p>'],
    ['`npm run dev`', '<p><code>npm run dev</code></p>'],
    ['[`codi`](https://example.org)', '<p><a href="https://example.org">codi</a></p>'],
    ['**a *b* c**', '<p><strong>a <em>b</em> c</strong></p>'],
    ['*a **b** c*', '<p><em>a <strong>b</strong> c</em></p>'],
    ['***x***', '<p><em><strong>x</strong></em></p>'],
    ['noms_de_variable i snake_case', '<p>noms_de_variable i snake_case</p>'],
    ['5 * 3 * 2', '<p>5 * 3 * 2</p>'],
    ['a < b & "c" \'d\'', '<p>a &lt; b &amp; &quot;c&quot; &#39;d&#39;</p>'],
  ])('%s', (entrada, eixida) => {
    expect(markdownAHtml(entrada)).toBe(eixida);
  });
});

describe('semblaMarkdown', () => {
  test.each([
    PORTARETALLS.chatgptBotoCopiar.text, PORTARETALLS.whatsappWebLlista.text,
    '## Títol', '> cita', '```', '---',
    'Mira [la web](https://example.org)', 'Mira `https://example.org`',
    '- a\n- b', '1. a\n2. b', '1) a\n\n2) b', '- a\n  - b', '1. Pas\n   detall del pas\n\n2. Pas',
  ])('cert: %j', (text) => {
    expect(semblaMarkdown(text)).toBe(true);
  });

  test.each([
    'https://example.org', PORTARETALLS.whatsappWeb.text, '#etiqueta i més', 'Hola\nbon dia', '**negreta** sola', '', '   ',
  ])('fals: %j', (text) => {
    expect(semblaMarkdown(text)).toBe(false);
  });

  /* C-02 · Una sola línia que comença per un número i un punt (un any, un
     apartat) o per un guió és text de la persona, no una llista: a HEAD
     entrava tal qual, i fer-ne Markdown se'n menjava el número. Cal un
     altre element de llista al costat (les línies buides i les sagnades
     no en tallen la tira; una línia sense sagnar i sense marca, sí). */
  test.each([
    '2024. Un any per recordar', '1714. La caiguda de Barcelona', '3) Pressupost municipal', '- Avís important -',
    '1. primer', '1) primer', '- punt', 'Avís:\n- Demà no hi ha mercat', '- a\nText del mig\n- b',
  ])('fals amb un sol element de llista: %j', (text) => {
    expect(semblaMarkdown(text)).toBe(false);
  });

  test('fals per a tot el que no és una cadena', () => {
    for (const valor of [null, undefined, 1, {}, []]) expect(semblaMarkdown(valor)).toBe(false);
  });
});

describe('XSS: res no esdevé marcatge ni enllaç perillós', () => {
  test.each([
    '[x](javascript:alert(1))',
    '[x](JaVaScRiPt:alert%281%29)',
    '[x](java\tscript:alert(1))',
    '[x](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)',
    '[x](vbscript:msgbox)',
    '[x](https://usuari:clau@example.org)',
    '[x](//example.org)',
  ])('%j es queda com a text literal', (text) => {
    const arrel = cos(markdownAHtml(text));
    expect(arrel.querySelector('a')).toBeNull();
    expect(arrel.textContent).toBe(text);
  });

  test('una etiqueta escrita ix escapada: cap <img>, cap onerror', () => {
    const text = '<img src=x onerror=alert(1)> i <script>alert(2)</script>';
    const arrel = cos(markdownAHtml(text));
    expect(arrel.querySelector('img, script')).toBeNull();
    expect(arrel.textContent).toBe(text);
  });

  test('«![a](u)» no genera mai cap <img> (cap porta lateral per a l’EXIF) i es queda com a text', () => {
    for (const text of ['![a](data:image/jpeg;base64,/9j/4AAQSkZJRg==)', '![a](https://example.org/a.jpg)']) {
      const arrel = cos(markdownAHtml(text));
      expect(arrel.querySelector('img, a')).toBeNull();
      expect(arrel.textContent).toBe(text);
    }
  });

  test('l’etiqueta d’un enllaç i el contingut d’un codi ixen escapats', () => {
    expect(markdownAHtml('[<b>x</b>](https://example.org)')).toBe('<p><a href="https://example.org">&lt;b&gt;x&lt;/b&gt;</a></p>');
    expect(markdownAHtml('`<script>alert(1)</script>`')).toBe('<p><code>&lt;script&gt;alert(1)&lt;/script&gt;</code></p>');
  });

  test('una URL amb cometes no obri cap atribut', () => {
    const arrel = cos(markdownAHtml('https://example.org/"onmouseover="alert(1)'));
    for (const element of arrel.querySelectorAll('*')) {
      expect(element.getAttributeNames().filter((nom) => nom !== 'href')).toEqual([]);
    }
    expect(arrel.querySelector('a').getAttribute('href')).toBe('https://example.org/');
  });

  test('urlWebSegura: només una URL http(s) sola, sense credencials, espais ni controls', () => {
    expect(urlWebSegura(` ${URL_PROVA_TANCADA} `)).toBe(URL_PROVA_TANCADA);
    for (const valor of ['javascript:alert(1)', 'data:text/html,x', 'https://x" onmouseover="y', 'https://u:p@example.org', 'mailto:a@b.cat', 'https://a.cat b', '/camí', null]) {
      expect(urlWebSegura(valor)).toBeNull();
    }
  });
});

describe('l’eixida només porta etiquetes del conjunt tancat', () => {
  const entrades = [
    ...Object.values(PORTARETALLS).map((f) => f.text),
    '<img src=x onerror=alert(1)><svg onload=alert(1)><iframe src=javascript:alert(1)></iframe>',
    '[x](javascript:alert(1)) ![a](data:image/png;base64,iVBORw0KGgo=) <a href="javascript:alert(1)">x</a>',
    '# <h2 onclick="x">T</h2>\n- <table><tr><td>x</td></tr></table>',
  ];
  test.each(entrades.map((e, i) => [i, e]))('entrada %i', (_i, entrada) => {
    for (const element of cos(markdownAHtml(entrada)).querySelectorAll('*')) {
      const etiqueta = element.tagName.toLowerCase();
      expect(ETIQUETES_PERMESES.has(etiqueta), etiqueta).toBe(true);
      expect(element.getAttributeNames()).toEqual(etiqueta === 'a' ? ['href'] : []);
    }
  });
});

describe('textPlaDeMarkdown (per als camps de la capçalera)', () => {
  test('sense marques de bloc ni d’èmfasi; l’etiqueta dels enllaços; les línies es conserven', () => {
    expect(textPlaDeMarkdown('## Títol **gran** ##\n\n> Una _cita_ amb `codi` i [web](https://example.org)\n- punt\n---\n```\nnpm i\n```')).toBe(
      'Títol gran\n\nUna cita amb codi i web\npunt\nnpm i',
    );
  });

  test('C-02 · el número d’un element de llista numerada és text i es queda (un any, un apartat); la vinyeta se’n va', () => {
    expect(textPlaDeMarkdown('# Història\n1714. La caiguda de Barcelona\n3) Pressupost municipal\n- punt')).toBe(
      'Història\n1714. La caiguda de Barcelona\n3) Pressupost municipal\npunt',
    );
  });

  test('la URL de dins d’un codi es queda com a text normal', () => {
    expect(textPlaDeMarkdown(`Apunta’t: \`${URL_PROVA_TANCADA}\`.`)).toBe(`Apunta’t: ${URL_PROVA_TANCADA}.`);
  });

  test('un enllaç perillós i una imatge es queden literals; cap etiqueta s’interpreta', () => {
    expect(textPlaDeMarkdown('[x](javascript:alert(1)) ![a](u) <b>x</b>')).toBe('[x](javascript:alert(1)) ![a](u) <b>x</b>');
  });
});

describe('paragrafsDeText (text sense forma de Markdown)', () => {
  test('un <p> per línia que no és buida, escapat, amb les regles en línia de TipTap', () => {
    expect(paragrafsDeText('Hola <veïns>\n\n*Fira* dissabte: https://example.org.\r\nFi')).toBe(
      '<p>Hola &lt;veïns&gt;</p><p><em>Fira</em> dissabte: <a href="https://example.org">https://example.org</a>.</p><p>Fi</p>',
    );
    expect(paragrafsDeText('  \n ')).toBe('');
  });
});

describe('ReDoS: 50.000 caràcters patològics en menys de 50 ms', () => {
  const N = 50000;
  const patologics = [
    ['*', '*'.repeat(N)], ['[', '['.repeat(N)], ['`', '`'.repeat(N)], ['_', '_'.repeat(N)], ['~', '~'.repeat(N)],
    ['#', '#'.repeat(N)], ['>', '>'.repeat(N)], ['(', '('.repeat(N)], [')', ')'.repeat(N)], ['espais', ' '.repeat(N)],
    ['[a](', '[a]('.repeat(N / 4)], ['**a ', '**a '.repeat(N / 4)], [' _a', ' _a'.repeat(N / 3)], ['`a', '`a'.repeat(N / 2)],
    ['https://', 'https://'.repeat(N / 8)], ['URL llarga', `https://${'a'.repeat(N)}`], ['[x](https://', `[x](https://${'a'.repeat(N)}`],
    ['*a* ', '*a* '.repeat(N / 4)], ['a_', 'a_'.repeat(N / 2)], ['- ', '- '.repeat(N / 2)], ['línies de llista', '  - a\n'.repeat(N / 7)],
  ];
  markdownAHtml('**escalfa** _el_ [motor](https://example.org)');

  test.each(patologics)('%s', (_nom, text) => {
    for (const funcio of [semblaMarkdown, markdownAHtml, textPlaDeMarkdown, paragrafsDeText]) {
      const inici = performance.now();
      funcio(text);
      expect(performance.now() - inici, funcio.name).toBeLessThan(50);
    }
  });
});

describe('Baseline (Safari 16 / Chrome 100 / Firefox 100)', () => {
  const FONTS = ['src/components/universal/richText/markdownEnganxat.js', 'src/components/universal/richText/extensions/enganxatNet.js'];
  const llig = (ruta) => readFileSync(path.join(process.cwd(), ruta), 'utf8');

  test.each(FONTS)('%s: cap lookbehind, cap URL.canParse, cap plaintext-only', (ruta) => {
    const font = llig(ruta);
    expect(font).not.toContain('(?<');
    expect(font).not.toContain('canParse');
    expect(font).not.toContain('plaintext-only');
  });

  test.each(FONTS)('%s: cap expressió regular amb la bandera «v» ni amb lookbehind', (ruta) => {
    const expressions = [];
    const recorre = (node) => {
      if (!node || typeof node.type !== 'string') return;
      if (node.type === 'RegExpLiteral') expressions.push(node);
      for (const valor of Object.values(node)) {
        if (Array.isArray(valor)) valor.forEach(recorre);
        else if (valor && typeof valor === 'object') recorre(valor);
      }
    };
    recorre(parse(llig(ruta), { sourceType: 'module' }).program);
    expect(expressions.length).toBeGreaterThan(0);
    for (const { pattern, flags } of expressions) {
      expect(flags, pattern).not.toContain('v');
      expect(pattern).not.toMatch(/\(\?<[=!]/);
    }
    expect(llig(ruta)).not.toMatch(/new RegExp\(/);
  });
});
