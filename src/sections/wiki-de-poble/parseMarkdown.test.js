import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseMarkdown, parseMarkdownEnLinia, extreuEditorial } from './parseMarkdown.js';
import { marcaDeTaula, sanitizeHtml } from '../../utils/sanitize.js';

/* Mateix camí que WikiDePobleSection: parser → sanejador → DOM. */
const pinta = (md, opcions) => {
  const arrel = document.createElement('div');
  arrel.innerHTML = sanitizeHtml(parseMarkdown(md, opcions));
  return arrel;
};
const textos = (nodes) => [...nodes].map((node) => node.textContent);

describe('parseMarkdown · taules (C15)', () => {
  it.each([
    ['una', '| A |\n|---|\n| 1 |', ['A'], ['1']],
    ['dos', '| Camp | Valor |\n| --- | --- |\n| x | y |', ['Camp', 'Valor'], ['x', 'y']],
    ['tres', '| a | b | c |\n|---|:-:|---|\n| 1 | 2 | 3 |', ['a', 'b', 'c'], ['1', '2', '3']],
  ])('conserva la capçalera sencera amb %s columnes', (_nom, md, capcalera, cos) => {
    const arrel = pinta(md);
    expect(textos(arrel.querySelectorAll('thead th'))).toEqual(capcalera);
    expect(textos(arrel.querySelectorAll('tbody td'))).toEqual(cos);
  });

  it('conserva una cel·la de capçalera buida al seu lloc', () => {
    const arrel = pinta('|  | B |\n|---|---|\n| 1 | 2 |');
    expect(textos(arrel.querySelectorAll('thead th'))).toEqual(['', 'B']);
  });
});

/* P1-16 (pla 261028_1526 §3.5.1) · La caixa de cada taula és una regió amb
   nom i focus (s'hi arriba i es desplaça amb el teclat, WCAG 2.1.1), i cada
   capçalera és de columna. El nom ix de les columnes en text pla, i ni el
   codi en línia, ni una cometa, ni un angle no el trenquen: el camí sencer,
   parser → sanejador → DOM, com a la Wiki. */
describe('parseMarkdown · taules accessibles (P1-16)', () => {
  const caixa = (md) => pinta(md).querySelector('div.sdp-taula-prosa');
  const nom = (md) => caixa(md).getAttribute('aria-label');

  it('la caixa és una regió amb focus i el nom de les columnes; cada th és de columna', () => {
    const arrel = pinta('| Camp | Valor |\n| --- | --- |\n| x | y |');
    const regio = arrel.querySelector('div.sdp-taula-prosa');
    expect([regio.getAttribute('role'), regio.getAttribute('tabindex'), regio.tabIndex]).toEqual(['region', '0', 0]);
    expect(regio.getAttribute('aria-label')).toBe('Taula: Camp, Valor');
    expect([...regio.attributes].map((a) => a.name).sort()).toEqual(['aria-label', 'class', 'role', 'tabindex']);
    expect(regio.firstElementChild.tagName).toBe('TABLE');
    expect([...arrel.querySelectorAll('thead th')].map((th) => th.getAttribute('scope'))).toEqual(['col', 'col']);
    expect(arrel.querySelector('tbody th, td[scope]')).toBeNull();
  });

  it('el codi en línia, la negreta i els enllaços de la capçalera donen un nom en text pla', () => {
    const arrel = pinta('| `sanitizeHtml()` | **Gran** | [Enllaç](?item=x) |\n|---|---|---|\n| 1 | 2 | 3 |');
    expect(arrel.querySelector('div.sdp-taula-prosa').getAttribute('aria-label')).toBe('Taula: sanitizeHtml(), Gran, Enllaç');
    // La capçalera visible conserva el seu format.
    expect(arrel.querySelector('thead th code').textContent).toBe('sanitizeHtml()');
    expect(arrel.querySelector('thead th strong').textContent).toBe('Gran');
  });

  it('una cometa a la capçalera queda dins del nom: cap atribut nou', () => {
    const regio = caixa('| a" onmouseover="alert(1) | b |\n|---|---|\n| 1 | 2 |');
    expect(regio.getAttribute('aria-label')).toBe('Taula: a" onmouseover="alert(1), b');
    expect([...regio.attributes].map((a) => a.name).sort()).toEqual(['aria-label', 'class', 'role', 'tabindex']);
  });

  it('cap angle al nom (DOMPurify esborra un atribut amb «-->»), i un & és text', () => {
    expect(nom('| `a-->b` | `<b>` |\n|---|---|\n| 1 | 2 |')).toBe('Taula: a-- b, b');
    expect(nom('| R&D | I+D |\n|---|---|\n| 1 | 2 |')).toBe('Taula: R&D, I+D');
  });

  it('les referències de caràcter diuen el que pinta la capçalera; el codi en línia continua sent text', () => {
    const arrel = pinta('| R&amp;D | &nbsp; | &lt;b&gt; | &#65;&#x42; | &eacute; | `&amp;` | --&gt; |\n|---|---|---|---|---|---|---|\n| 1 | 2 | 3 | 4 | 5 | 6 | 7 |');
    expect(arrel.querySelector('thead th').textContent).toBe('R&D');
    expect(arrel.querySelector('div.sdp-taula-prosa').getAttribute('aria-label')).toBe('Taula: R&D, b, AB, &eacute;, &amp;, --');
    // Un control no fa cap marcador: &#0; és un espai.
    expect(nom('| `x` | &#0;LINIA0&#0; | &#xD800; |\n|---|---|---|\n| 1 | 2 | 3 |')).toBe('Taula: x, LINIA0');
  });

  it('només les caixes que fa el parser porten la marca, i el sanejador la lleva: una caixa escrita a mà no guanya res', () => {
    const md = 'Text <div class="sdp-taula-prosa" role="region" tabindex="0" aria-label="Fals">fals</div>\n\n| A |\n|---|\n| 1 |';
    expect(parseMarkdown(md)).toContain(` tabindex="0" data-sdp-taula="${marcaDeTaula()}"><table>`);
    const arrel = pinta(md);
    const caixes = [...arrel.querySelectorAll('div.sdp-taula-prosa')];
    expect(caixes.map((c) => [c.getAttribute('aria-label'), c.getAttribute('role'), c.getAttribute('tabindex')]))
      .toEqual([['Fals', null, null], ['Taula: A', 'region', '0']]);
    expect(arrel.querySelector('[data-sdp-taula]')).toBeNull();
    expect(arrel.querySelectorAll('[role], [tabindex]')).toHaveLength(1);
  });

  it('sense text a la capçalera, «Taula N» per l’ordre del document; un nom llarg es talla', () => {
    const arrel = pinta('| A |\n|---|\n| 1 |\n\nText.\n\n|  |\n|---|\n| 2 |');
    expect([...arrel.querySelectorAll('div.sdp-taula-prosa')].map((d) => d.getAttribute('aria-label'))).toEqual(['Taula: A', 'Taula 2']);
    const columnes = Array.from({ length: 20 }, (_, i) => `Columna ${i + 1}`);
    const llarg = nom(`| ${columnes.join(' | ')} |\n|${'---|'.repeat(20)}\n|${' x |'.repeat(20)}`);
    expect([...llarg]).toHaveLength(120);
    expect(llarg.endsWith('…')).toBe(true);
    expect(llarg.startsWith('Taula: Columna 1, Columna 2, ')).toBe(true);
  });
});

describe('parseMarkdown · codi (U09)', () => {
  it('un bloc tancat és text literal: ni títols, ni llistes, ni negreta, ni HTML', () => {
    const codi = '# no és títol\n- ni llista\n**ni negreta**\n<script>x</script>';
    const arrel = pinta(`Abans\n\n\`\`\`js\n${codi}\n\`\`\`\n\nDesprés`);
    const bloc = arrel.querySelector('pre > code.language-js');
    expect(bloc.textContent).toBe(codi);
    expect(arrel.querySelector('pre :is(h1, h2, h3, li, strong, script)')).toBeNull();
    expect(arrel.querySelector('script')).toBeNull();
    expect(textos(arrel.querySelectorAll(':scope > p'))).toEqual(['Abans', 'Després']);
  });

  it('el codi en línia no rep format i escapa l’HTML', () => {
    const arrel = pinta('Usa `**x**` i `<b>`.');
    expect(textos(arrel.querySelectorAll('code'))).toEqual(['**x**', '<b>']);
    expect(arrel.querySelector('strong, b')).toBeNull();
  });
});

describe('parseMarkdown · format en línia (U09)', () => {
  it('negreta múltiple en una línia: dos <strong> i cap <em> imprevist', () => {
    const arrel = pinta('**A** i **B**');
    expect(textos(arrel.querySelectorAll('strong'))).toEqual(['A', 'B']);
    expect(arrel.querySelector('em')).toBeNull();
    expect(arrel.textContent).not.toContain('*');
  });

  it('cursiva múltiple en una línia', () => {
    expect(textos(pinta('*a* i *b*').querySelectorAll('em'))).toEqual(['a', 'b']);
  });
});

describe('parseMarkdown · callouts (U09 · U10b)', () => {
  it('accepta espais finals i vestix la pell de l’Alerta', () => {
    const arrel = pinta('> [!CAUTION] \n> Compte amb açò.\n\nDesprés');
    const avis = arrel.querySelector('.sdp-alerta.sdp-alerta--error');
    expect(avis).not.toBeNull();
    expect(avis.querySelector('.sdp-alerta__cos').textContent).toBe('Compte amb açò.');
    expect(arrel.querySelector('blockquote')).toBeNull();
    expect(arrel.querySelector(':scope > p').textContent).toBe('Després');
  });

  it('NOTE sense espai continua funcionant i es pinta com a informació', () => {
    const arrel = pinta('> [!NOTE]\n> Fase d’auditoria.');
    expect(arrel.querySelector('.sdp-alerta--info .sdp-alerta__cos').textContent).toBe('Fase d’auditoria.');
  });
});

describe('parseMarkdown · llistes (agrupació i autonumeració)', () => {
  it('una llista ordenada de 4 elements és un sol <ol> amb 4 <li> i sense <p>', () => {
    const md = '1. Primer\n2. Segon\n3. Tercer\n4. Quart';
    const arrel = pinta(md);
    expect(arrel.querySelectorAll('ol')).toHaveLength(1);
    expect(arrel.querySelectorAll('ol > li')).toHaveLength(4);
    expect(arrel.querySelector('p')).toBeNull();
    expect(textos(arrel.querySelectorAll('ol > li'))).toEqual(['Primer', 'Segon', 'Tercer', 'Quart']);
  });

  it('una llista no ordenada de diversos elements és un sol <ul> amb els seus <li>', () => {
    const md = '- Alfa\n- Beta\n- Gamma';
    const arrel = pinta(md);
    expect(arrel.querySelectorAll('ul')).toHaveLength(1);
    expect(arrel.querySelectorAll('ul > li')).toHaveLength(3);
    expect(arrel.querySelector('p')).toBeNull();
    expect(textos(arrel.querySelectorAll('ul > li'))).toEqual(['Alfa', 'Beta', 'Gamma']);
  });

  it('dues llistes separades per paràgraf generen cadascuna el seu contenidor propi', () => {
    const md = '1. A\n2. B\n\nParàgraf entremig.\n\n- X\n- Y';
    const arrel = pinta(md);
    expect(arrel.querySelectorAll('ol')).toHaveLength(1);
    expect(arrel.querySelectorAll('ol > li')).toHaveLength(2);
    expect(arrel.querySelectorAll('ul')).toHaveLength(1);
    expect(arrel.querySelectorAll('ul > li')).toHaveLength(2);
    expect(arrel.querySelectorAll(':scope > p')).toHaveLength(1);
    expect(arrel.querySelector(':scope > p').textContent).toBe('Paràgraf entremig.');
  });

  /* Decisió del Mestre (30-10-2026) · La marca provisional del tipus de llista
     és un atribut data- que no ix mai a l'HTML, i la font no escriu cap classe
     sense regla (tractor-pedra-seca, LLEI_01). */
  it('les llistes ixen netes: cap marca provisional ni classe als <li>, i la font no marca amb classes', () => {
    const html = parseMarkdown('- Alfa\n- Beta\n\n1. Un\n2. Dos');
    expect(html).toContain('<ul><li>Alfa</li><li>Beta</li></ul>');
    expect(html).toContain('<ol><li>Un</li><li>Dos</li></ol>');
    expect(html).not.toMatch(/data-llista|<li class=/);
    const font = readFileSync(resolve(process.cwd(), 'src/sections/wiki-de-poble/parseMarkdown.js'), 'utf8');
    expect(font).not.toMatch(/<li class=/);
    expect(font).toMatch(/<li data-llista="ul">/);
  });
});

describe('parseMarkdown · diagrames mermaid', () => {
  it('un bloc mermaid es convertix en targeta de diagrama d’arquitectura', () => {
    const md = '```mermaid\nflowchart LR\n  A --> B\n```';
    const arrel = pinta(md);
    const targeta = arrel.querySelector('.sdp-diagrama-card');
    expect(targeta).not.toBeNull();
    expect(targeta.querySelector('.sdp-diagrama-capcalera').textContent).toContain('Diagrama d’arquitectura');
    expect(targeta.querySelector('pre.sdp-diagrama-cos > code.language-mermaid').textContent).toContain('flowchart LR');
  });

  it('la icona de la capçalera no porta cap classe sense regla (Decisió del Mestre, 30-10-2026)', () => {
    const arrel = pinta('```mermaid\nflowchart LR\n  A --> B\n```');
    const icona = arrel.querySelector('.sdp-diagrama-capcalera > span');
    expect(icona.textContent).toBe('📐');
    expect(icona.hasAttribute('class')).toBe(false);
  });
});

describe('parseMarkdown · sanejament conservat', () => {
  it('l’eixida continua passant pel sanejador', () => {
    const arrel = pinta('[x](javascript:alert(1))\n\n<img src="x" onerror="alert(1)">');
    expect(arrel.querySelector('a').getAttribute('href')).toBeNull();
    expect(arrel.querySelector('img').hasAttribute('onerror')).toBe(false);
  });
});

describe('parseMarkdown · títols sense punt final (260925)', () => {
  const titol = (md) => pinta(md).querySelector('h2, h3, h4, h5, h6');

  it.each([
    ['# Títol.', 'H2', 'Títol'],
    ['## Dos.', 'H3', 'Dos'],
    ['### Tres.', 'H4', 'Tres'],
    ['#### Quatre.', 'H5', 'Quatre'],
    ['##### Cinc.', 'H6', 'Cinc'],
    ['###### Sis.', 'H6', 'Sis']
  ])('%s', (md, etiqueta, text) => {
    const node = titol(md);
    expect(node.tagName).toBe(etiqueta);
    expect(node.textContent).toBe(text);
  });

  it.each([
    ['## Continuarà...', 'Continuarà...'],
    ['## Continuarà…', 'Continuarà…'],
    ['## Versió 1.2 del pla.', 'Versió 1.2 del pla'],
    ['## Títol .   ', 'Títol'],
    ['## Títol amb tancament ##', 'Títol amb tancament'],
    ['## Fitxer `a.md`', 'Fitxer a.md'],
    ['## Usa `x`.', 'Usa x'],
    ['## *Nota*.', 'Nota'],
    ['### _x._', '_x_']
  ])('%s → %s', (md, text) => {
    expect(titol(md).textContent).toBe(text);
  });

  it('el punt dins de la negreta que tanca el títol també se’n va', () => {
    const node = titol('## **Nota.**');
    expect(node.querySelector('strong').textContent).toBe('Nota');
    expect(node.textContent).toBe('Nota');
  });

  it('el codi del títol no es toca: el punt de dins d’un `bloc` es queda', () => {
    expect(titol('## Ordre `npm run porta.`').querySelector('code').textContent).toBe('npm run porta.');
  });

  it('un paràgraf enganxat davall d’un títol ja no queda fora de cap <p>', () => {
    const arrel = pinta('## Secció\nText enganxat.');
    expect(arrel.querySelector('h3.h2').textContent).toBe('Secció');
    expect(textos(arrel.querySelectorAll(':scope > p'))).toEqual(['Text enganxat.']);
  });

  it('un comentari HTML entre el títol i la llista no deixa cap <p> buit', () => {
    const arrel = pinta('### Part tècnica\n<!-- Què hem tocat? -->\n- **Estat:** net');
    expect(arrel.querySelector('p')).toBeNull();
    expect(arrel.querySelector('h4.h3 + ul > li > strong').textContent).toBe('Estat:');
  });

  it('un comentari sol no es pinta com a paràgraf, i davant de text el text continua dins d’un <p>', () => {
    expect(pinta('<!-- SDP:EIXIDA\nplantilla -->\n\n## Títol').querySelector('p')).toBeNull();
    const ambText = pinta('<!-- nota -->\nText.');
    expect(ambText.querySelectorAll('p')).toHaveLength(1);
    expect(ambText.querySelector('p').textContent.trim()).toBe('Text.');
  });
});

describe('parseMarkdown · entradilla dins de la prosa (260925)', () => {
  it('el primer paràgraf pla després del primer «# » és p.lead; la resta, paràgrafs', () => {
    const arrel = pinta('# Títol\n\nEntradilla.\n\nSegon paràgraf.');
    expect(textos(arrel.querySelectorAll('p.lead'))).toEqual(['Entradilla.']);
    expect(textos(arrel.querySelectorAll('p:not(.lead)'))).toEqual(['Segon paràgraf.']);
  });

  it('també quan va enganxat al títol, i conserva el format en línia', () => {
    const lead = pinta('# Títol\n**Molt** *bé*, amb [enllaç](?item=x) i `codi`.').querySelector('p.lead');
    expect(lead.querySelector('strong').textContent).toBe('Molt');
    expect(lead.querySelector('em').textContent).toBe('bé');
    expect(lead.querySelector('a').getAttribute('href')).toBe('?item=x');
    expect(lead.querySelector('code').textContent).toBe('codi');
  });

  it('només el primer «# » en porta', () => {
    const arrel = pinta('# A\n\nEntradilla A.\n\n# B\n\nParàgraf B.');
    expect(textos(arrel.querySelectorAll('p.lead'))).toEqual(['Entradilla A.']);
  });

  it('el «# » no ha de ser el primer bloc', () => {
    const arrel = pinta('Introducció.\n\n# Títol\n\nEntradilla.');
    expect(textos(arrel.querySelectorAll('p.lead'))).toEqual(['Entradilla.']);
    expect(arrel.querySelector('p').textContent).toBe('Introducció.');
  });

  it.each([
    ['llista', '# T\n\n- a\n- b'],
    ['taula', '# T\n\n| A |\n|---|\n| 1 |'],
    ['cita', '# T\n\n> cita'],
    ['callout', '# T\n\n> [!NOTE]\n> nota'],
    ['regle', '# T\n\n---\n\nText.'],
    ['títol', '# T\n\n## Secció\n\nText.'],
    ['codi', '# T\n\n```\nx\n```\n\nText.'],
    ['HTML', '# T\n\n<div>x</div>\n\nText.'],
    ['imatge', '# T\n\n![alt](/img.png)\n\nText.'],
    ['etiqueta', '# T\n\n**Categoria:** Arquitectura\n\nText.'],
    ['etiqueta amb dos punts fora', '# T\n\n**Estat**: esborrany\n\nText.']
  ])('sense entradilla si després del títol ve %s', (_nom, md) => {
    expect(pinta(md).querySelector('p.lead')).toBeNull();
  });

  it('sense «# » no hi ha entradilla', () => {
    expect(pinta('## Secció\n\nText.').querySelector('p.lead')).toBeNull();
  });

  it('un «# » dins d’un bloc de codi no compta', () => {
    expect(pinta('```\n# no\n```\n\nText.').querySelector('p.lead')).toBeNull();
  });

  it('es pot apagar: { entradilla: false }', () => {
    const arrel = pinta('# Títol\n\nEntradilla.', { entradilla: false });
    expect(arrel.querySelector('p.lead')).toBeNull();
    expect(textos(arrel.querySelectorAll('p'))).toEqual(['Entradilla.']);
  });
});

describe('extreuEditorial', () => {
  it('separa títol, entradilla i cos', () => {
    expect(extreuEditorial('# Títol\n\nEntradilla **forta**.\n\n## Secció\n\nCos.')).toEqual({
      titol: 'Títol',
      entradilla: 'Entradilla **forta**.',
      cos: '## Secció\n\nCos.'
    });
  });

  it('línies en blanc inicials, CRLF i BOM', () => {
    expect(extreuEditorial('﻿\r\n\r\n# Títol\r\n\r\nPrimera línia\r\nsegona línia\r\n\r\nCos')).toEqual({
      titol: 'Títol',
      entradilla: 'Primera línia segona línia',
      cos: 'Cos'
    });
  });

  it('el títol ix en text pla i sense punt final', () => {
    expect(extreuEditorial('# **Arquitectura** `tècnica` [unificada](?item=x).').titol).toBe('Arquitectura tècnica unificada');
    expect(extreuEditorial('# Continuarà...').titol).toBe('Continuarà...');
    expect(extreuEditorial('# Títol ##').titol).toBe('Títol');
  });

  it('entradilla enganxada al títol i tallada per una llista', () => {
    expect(extreuEditorial('# T\nEntradilla\n- a\n- b')).toEqual({ titol: 'T', entradilla: 'Entradilla', cos: '- a\n- b' });
  });

  it('un títol sol deixa el cos buit', () => {
    expect(extreuEditorial('# Només títol\n\n')).toEqual({ titol: 'Només títol', entradilla: null, cos: '' });
  });

  it.each([
    ['llista', '- a\n- b'],
    ['taula', '| A |\n|---|\n| 1 |'],
    ['cita', '> cita'],
    ['callout', '> [!NOTE]\n> nota'],
    ['regle', '---\n\nText.'],
    ['títol', '## Secció\n\nText.'],
    ['codi', '```js\nx\n```'],
    ['HTML', '<div>x</div>'],
    ['imatge', '![alt](/img.png)'],
    ['etiqueta', '**Categoria:** Arquitectura\n\nText.']
  ])('H1 seguit de %s: sense entradilla, i el cos comença per ell', (_nom, bloc) => {
    expect(extreuEditorial(`# Títol\n\n${bloc}`)).toEqual({ titol: 'Títol', entradilla: null, cos: bloc });
  });

  it.each([
    ['sense H1', '## Secció\n\nText.'],
    ['text abans del H1', 'Text.\n\n# Títol'],
    ['«#» sense espai', '#Títol\n\nText.'],
    ['H1 buit', '# \n\nText.']
  ])('%s: ni títol ni entradilla, i el cos és el document sencer', (_nom, md) => {
    expect(extreuEditorial(md)).toEqual({ titol: null, entradilla: null, cos: md });
  });

  it('allò que no és text dona un document buit', () => {
    expect(extreuEditorial(undefined)).toEqual({ titol: null, entradilla: null, cos: '' });
  });

  /* R-07 (pla 261029_0216) · El preàmbul no és contingut: les plantilles obrin
     amb <!-- SDP:EIXIDA … --> davant de l'H1. */
  it('salta els comentaris HTML inicials i no els torna al cos', () => {
    const md = '\n<!-- SDP:EIXIDA\ntype: acta\n-->\n<!-- Nom: aammdd_hhmm_acta_titol.md -->\n# Títol\n\nEntradilla.\n\n## Secció';
    expect(extreuEditorial(md)).toEqual({ titol: 'Títol', entradilla: 'Entradilla.', cos: '## Secció' });
    expect(extreuEditorial('<!-- a --><!-- b -->  \n\n# T\nCos')).toEqual({ titol: 'T', entradilla: 'Cos', cos: '' });
    expect(extreuEditorial('<!-->\n# T')).toEqual({ titol: 'T', entradilla: null, cos: '' });
  });

  it('un «# Títol» de dins d’un comentari és comentari', () => {
    expect(extreuEditorial('<!--\n# Fals\n-->\n# Real\n\nCos').titol).toBe('Real');
    const nomes = '<!-- # Fals -->\n\n## Només secció';
    expect(extreuEditorial(nomes)).toEqual({ titol: null, entradilla: null, cos: nomes });
  });

  it.each([
    ['sense tancar', '<!-- obert\n# Fals\n\nText.'],
    ['sense tancar i «# » a l’última línia', '<!-- obert\n# Fals'],
    ['«# » darrere d’un «-->» a la mateixa línia', '<!-- a --> # No\n\nText.'],
    ['«# » sagnat', '<!-- a -->\n   # No\n\nText.']
  ])('comentari %s: ni títol ni entradilla, i el cos és el document sencer', (_nom, md) => {
    expect(extreuEditorial(md)).toEqual({ titol: null, entradilla: null, cos: md });
  });

  it('un frontmatter romanent se salta; un regle «---» sense tancar, no', () => {
    expect(extreuEditorial('---\ntype: acta\ntitle: ---x\n---  \n\n<!-- c -->\n# Títol\n\nCos')).toEqual({ titol: 'Títol', entradilla: 'Cos', cos: '' });
    const regle = '---\n\n# Títol';
    expect(extreuEditorial(regle)).toEqual({ titol: null, entradilla: null, cos: regle });
  });

  it('el preàmbul es recorre en temps lineal (guarda de regressió contra un retrocés catastròfic)', () => {
    const inici = performance.now();
    expect(extreuEditorial(`<!--${'-<!'.repeat(200000)}`).titol).toBeNull();
    expect(extreuEditorial(`---\n${'---x\n'.repeat(100000)}# T`).titol).toBeNull();
    expect(extreuEditorial(`${'<!-- c -->\n'.repeat(50000)}# T`).titol).toBe('T');
    expect(performance.now() - inici).toBeLessThan(2000);
  });
});

describe('els documents reals de la Wiki', () => {
  it('cap títol ix amb punt final i cap document perd el cos', async () => {
    const { wikiManifest } = await import('../../data/wikiManifest.js');
    const ambPunt = [];
    for (const item of wikiManifest.items) {
      const editorial = extreuEditorial(item.content);
      if (editorial.titol && /[^.]\.$/.test(editorial.titol)) ambPunt.push(`${item.id} · ${editorial.titol}`);
      const arrel = pinta(editorial.cos, { entradilla: !editorial.titol });
      for (const node of arrel.querySelectorAll('h2, h3, h4, h5, h6')) {
        // El punt de dins d'un `codi` o d'un enllaç que tanca el títol és seu.
        if (['CODE', 'A'].includes(node.lastChild?.nodeName)) continue;
        if (/[^.]\.$/.test(node.textContent.trim())) ambPunt.push(`${item.id} · ${node.textContent}`);
      }
    }
    expect(ambPunt).toEqual([]);
    // La majoria obrin amb «# » i entradilla; les plantilles, que comencen
    // pel comentari SDP:EIXIDA, tenen el títol de darrere del comentari (R-07).
    expect(wikiManifest.items.some((item) => extreuEditorial(item.content).entradilla)).toBe(true);
    const plantilles = wikiManifest.items.filter((item) => item.content.includes('<!-- SDP:EIXIDA'));
    expect(plantilles.length).toBeGreaterThan(0);
    expect(plantilles.filter((item) => !extreuEditorial(item.content).titol).map((item) => item.id)).toEqual([]);
  });
});

describe('parseMarkdownEnLinia', () => {
  const pintaLinia = (md) => {
    const arrel = document.createElement('p');
    arrel.innerHTML = sanitizeHtml(parseMarkdownEnLinia(md));
    return arrel;
  };

  it('negreta, cursiva, enllaç i codi, en una sola línia', () => {
    const arrel = pintaLinia('**A** i *b*\namb [c](?item=c) i `d`');
    expect(arrel.textContent).toBe('A i b amb c i d');
    expect(arrel.querySelector('strong').textContent).toBe('A');
    expect(arrel.querySelector('em').textContent).toBe('b');
    expect(arrel.querySelector('a').getAttribute('href')).toBe('?item=c');
    expect(arrel.querySelector('code').textContent).toBe('d');
  });

  it('l’HTML de l’entradilla és text, no marcatge', () => {
    const arrel = pintaLinia('Compte amb <script>x</script> i <p>blocs</p>');
    expect(arrel.querySelector('script, p')).toBeNull();
    expect(arrel.textContent).toBe('Compte amb <script>x</script> i <p>blocs</p>');
  });

  it('sense text no hi ha res', () => {
    expect(parseMarkdownEnLinia('')).toBe('');
    expect(parseMarkdownEnLinia(null)).toBe('');
  });
});
