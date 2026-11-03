import { describe, expect, it } from 'vitest';
import { parseMarkdown } from './parseMarkdown.js';
import { sanitizeHtml } from '../../utils/sanitize.js';

// La prosa de la Wiki sanejada com la pinta WikiDePobleSection (WC-06).
const pinta = text => {
  const root = document.createElement('div');
  root.innerHTML = sanitizeHtml(parseMarkdown(text, { entradilla: false }), { llistesNumerades: true });
  return root;
};

describe('Wiki O7 · numeració i blocs de prosa', () => {
  it('conserva una sola llista entre paràgrafs i subllistes', () => {
    const root = pinta('1. Primer pas.\n\n   Paràgraf que explica el primer pas.\n\n   - detall A\n   - detall B\n\n2. Segon pas.\n\n3. Tercer pas.');
    expect(root.querySelectorAll(':scope > ol')).toHaveLength(1);
    expect(root.querySelectorAll(':scope > ol > li')).toHaveLength(3);
    expect(root.querySelector('ol > li > ul').children).toHaveLength(2);
    expect(root.querySelector('ol > li').textContent).toContain('Paràgraf que explica');
    expect(root.querySelectorAll(':scope > p')).toHaveLength(0);
  });

  it('llistes separades expressament conserven el número inicial', () => {
    const root = pinta('4. Quart.\n5. Cinqué.\n\nText fora de la llista.\n\n9. Nové.\n10. Desé.');
    expect([...root.querySelectorAll(':scope > ol')].map(n => n.start)).toEqual([4, 9]);
    expect(root.querySelector(':scope > p').textContent).toBe('Text fora de la llista.');
  });

  it('un bloc de codi dins de l’ítem no trenca ni crea llistes', () => {
    const root = pinta('1. Executa:\n\n   ```sh\n   20. açò és codi\n   ```\n\n2. Verifica.');
    expect(root.querySelectorAll(':scope > ol')).toHaveLength(1);
    expect(root.querySelectorAll('ol > li')).toHaveLength(2);
    expect(root.querySelector('li pre code').textContent).toBe('20. açò és codi');
  });

  it('una llista dins d’un bloc de codi exterior és literal', () => {
    const root = pinta('```md\n4. açò és codi\n5. també\n```');
    expect(root.querySelector('ol')).toBeNull();
    expect(root.querySelector('code').textContent).toContain('4. açò és codi');
  });

  it('una línia que comença amb enllaç és un paràgraf complet', () => {
    const root = pinta('[Consulta el projecte](?item=el_projecte) i continua\nla mateixa frase, amb **negreta**.');
    expect(root.children).toHaveLength(1);
    expect(root.firstElementChild.tagName).toBe('P');
    expect(root.querySelector('p').textContent).toBe('Consulta el projecte i continua la mateixa frase, amb negreta.');
  });

  it('text immediatament darrere d’una llista és un paràgraf propi', () => {
    const root = pinta('1. Primer.\n2. Segon.\n## Resultat\n[Comprova](?item=x) que tot acaba bé.');
    expect(root.querySelectorAll(':scope > ol')).toHaveLength(1);
    expect(root.querySelector('h3 + p > a')).not.toBeNull();
  });

  it('admet 1) i manté separades llistes ordenades i amb pics', () => {
    const root = pinta('3) Tres\n4) Quatre\n- una altra llista\n- detall');
    expect([...root.children].map(n => n.tagName)).toEqual(['OL', 'UL']);
    expect(root.querySelector('ol').start).toBe(3);
  });

  it('els salts de línia tous no trenquen strong ni em, però el canvi de paràgraf sí', () => {
    const root = pinta('Text **CRDT\nreal** i *memòria\ncau*, amb una sola frase.\n\n**No continua\n\nen el paràgraf següent**.');
    expect(root.querySelector('strong').textContent).toBe('CRDT real');
    expect(root.querySelector('em').textContent).toBe('memòria cau');
    expect(root.querySelectorAll('strong')).toHaveLength(1);
  });

  it('el sanejador només conserva start numèric d’una llista ordenada', () => {
    const root = document.createElement('div');
    root.innerHTML = sanitizeHtml('<ol start="-2"><li>A</li></ol><ol start="javascript:alert(1)"><li>B</li></ol><p start="4">C</p><ol start="4" onclick="alert(1)"><li>D</li></ol>', { llistesNumerades: true });
    expect([...root.querySelectorAll('ol')].map(n => n.getAttribute('start'))).toEqual(['-2', null, '4']);
    expect(root.querySelector('p').hasAttribute('start')).toBe(false);
    expect(root.querySelector('[onclick]')).toBeNull();
  });

  /* WC-06 · El ganxo de start és del sanejador únic: fora de la Wiki (Notes,
     el Mur, el Perfil, l'editor TipTap, que escriu <ol start="N"> amb «N. »),
     start continua caient com abans de l'O7, i la marca no sobreviu la crida. */
  it('fora de la prosa de la Wiki start continua caient, com abans de l’O7', () => {
    const ol = '<ol start="5"><li>a</li></ol>';
    expect(sanitizeHtml(ol)).toBe('<ol><li>a</li></ol>');
    expect(sanitizeHtml(ol, { imatgesPropies: true })).toBe('<ol><li>a</li></ol>');
    expect(sanitizeHtml(ol, { llistesNumerades: true })).toBe(ol);
    expect(sanitizeHtml(ol)).toBe('<ol><li>a</li></ol>');
    expect(sanitizeHtml(ol, { llistesNumerades: 'true' })).toBe('<ol><li>a</li></ol>');
  });
});

describe('Gauntlet O7 · regressions del parser de llistes', () => {
  /* WC-01 · (.*)$ sense /m: amb \r, U+2028 o U+2029 darrere d'una tirada
     d'espais, el motor la repartia entre [ \t]+ i (.*) en O(k²) (12 s amb
     1e5 espais). Una nota .md local arriba ací pel fil principal. */
  it('[REDOS] una tirada llarga d’espais davant de \\r, U+2028 o U+2029 es recorre en temps lineal', () => {
    const espais = ' '.repeat(100000);
    const inici = performance.now();
    for (const fi of ['\r', String.fromCharCode(0x2028), String.fromCharCode(0x2029)]) {
      expect(parseMarkdown(`-${espais}a${fi}b`, { entradilla: false })).toMatch(/^\s*<ul><li>/);
      expect(parseMarkdown(`1.${espais}x${fi}y`, { entradilla: false })).toMatch(/^\s*<ol><li>/);
    }
    expect(performance.now() - inici).toBeLessThan(1000);
  });

  /* WC-02 i WD-02 · L'estat de comentari és el de l'INICI de la línia, i un
     «<!--» de dins de codi és text. Abans, el primer ítem eixia com
     «<p>- …</p>» i la resta com <ol start="2">, o s'apagaven totes les
     llistes posteriors del document. */
  it.each([
    ['comentari al primer ítem', '- primer <!-- nota -->\n- segon\n- tercer', ['UL'], 3],
    ['comentari al primer ítem numerat', '1. primer <!-- nota -->\n2. segon\n3. tercer', ['OL'], 3],
    ['«<!--» dins de codi en línia', '- Obri amb `<!--`\n- segon\n\nParàgraf\n\n- x\n- y', ['UL', 'P', 'UL'], 4],
    ['«<!--» dins d’un bloc de codi', '```html\n<!-- SDP:EIXIDA\n```\n\n- a\n- b', ['PRE', 'UL'], 2],
    ['tanca dins d’un comentari sense parella', '<!--\n```\n-->\n- q', ['UL'], 1]
  ])('WC-02 · un «<!--» no desfà cap llista: %s', (_nom, md, etiquetes, items) => {
    const root = pinta(md);
    expect([...root.children].map(n => n.tagName)).toEqual(etiquetes);
    expect(root.querySelectorAll('li')).toHaveLength(items);
    expect(root.querySelector('ol')?.hasAttribute('start') ?? false).toBe(false);
    expect(root.textContent).not.toMatch(/^\s*(?:-|\d\.)\s/m);
  });

  it('WC-02 · una llista dins d’un comentari de diverses línies continua sense pintar-se', () => {
    const root = pinta('<!--\n- dins\n-->\n\n- fora\n\nText.\n\n- a <!-- obert\n- b\n-->\n\nText.\n\n- c');
    expect([...root.querySelectorAll(':scope > ul')].at(-1).textContent).toBe('c');
    expect([...root.querySelectorAll('li')].map(n => n.textContent)).not.toContain('dins');
  });

  it('WD-02 · Llibre d’Or, Error 01: «Cost real» i «Antídot» en una sola llista', () => {
    const root = pinta('### Error 01 · Propagar un gir d\'arquitectura amb un `sed` global\n- **Cost real:** el **`LEDGER` immutable va quedar mutat**, la **història de l\'Offline-First esborrada** i l\'**`ADR-2026-08` amb el sentit capgirat**. <!-- tractor-psicopatia: allow ZOMBIE-OFFLINE-FIRST -- memòria episòdica: cost històric de l\'esborrat, no un requisit vigent -->\n- **Antídot obligatori:** fer primer una **llista en sec amb `grep -l`**.');
    expect(root.querySelectorAll(':scope > ul')).toHaveLength(1);
    expect([...root.querySelectorAll('ul > li > strong:first-child')].map(n => n.textContent)).toEqual(['Cost real:', 'Antídot obligatori:']);
    expect(root.querySelector(':scope > p')).toBeNull();
    expect(root.textContent).not.toMatch(/-\s*Cost real/);
  });

  /* WC-03 · Una sola regla de tanca per a les llistes i per al codi. Abans,
     quan discrepaven, s'apagaven les llistes de la resta del document o el
     marcador intern \u0000BLOC acabava dins del <pre>. */
  it('WC-03 · una tanca a la columna 0 tanca el codi obert dins de l’ítem', () => {
    const root = pinta('1. Executa:\n   ```sh\n   npm test\n```\n2. Verifica\n\n## Després\n\n- a\n- b');
    expect(root.querySelectorAll(':scope > ol > li')).toHaveLength(2);
    expect(root.querySelector('ol > li pre code').textContent).toBe('npm test');
    expect([...root.querySelectorAll(':scope > ul > li')].map(n => n.textContent)).toEqual(['a', 'b']);
    expect(root.textContent).not.toContain('```');
  });

  it.each([
    ['obertura ```` tancada amb ```', '````\ncodi\n```\n\n- a\n- b', 'codi'],
    ['tanca sense parella', 'Text\n\n```\nsense tancar\n\n## Secció\n\n- a\n- b', null]
  ])('WC-03 · %s no apaga les llistes posteriors', (_nom, md, codi) => {
    const root = pinta(md);
    expect([...root.querySelectorAll(':scope > ul > li')].map(n => n.textContent)).toEqual(['a', 'b']);
    expect(root.querySelector('pre code')?.textContent ?? null).toBe(codi);
  });

  it('WC-03 · una línia «```js» dins d’un bloc ``` és codi i no filtra cap marcador', () => {
    const html = parseMarkdown('```\nexemple:\n```js\n- dins del codi\n```\n\n- a\n- b', { entradilla: false });
    expect(html).not.toContain('\u0000');
    const root = pinta('```\nexemple:\n```js\n- dins del codi\n```\n\n- a\n- b');
    expect(root.querySelector('pre code').textContent).toBe('exemple:\n```js\n- dins del codi');
    expect([...root.querySelectorAll(':scope > ul > li')].map(n => n.textContent)).toEqual(['a', 'b']);
  });

  /* WC-03 (ronda 3) · La regla de tanca porta /m: «^» i «$» casen també a \r,
     U+2028 i U+2029, que no parteixen les línies. Un bloc que obri o tanca a
     mitja línia s'enduia la línia sencera, sense avís, també en una nota .md
     importada. El pas 1a d'abans (un replace) conservava el text de fora. */
  const L = String.fromCharCode(0x2028);
  const P = String.fromCharCode(0x2029);
  it.each([
    ['de davant de l’obertura, després d’un \\r', 'texte\r```\ncodi\n```\n\n- a', 'texte'],
    ['de davant de l’obertura, després d’un U+2028', `texte${L}\`\`\`\ncodi\n\`\`\`\n\n- a`, 'texte'],
    ['de darrere de la tanca, abans d’un U+2029', `\`\`\`\ncodi\n\`\`\`${P}despres\n\n- a`, 'despres'],
    ['de darrere de la tanca, després d’una llista i d’un U+2028', `- x\n\n\`\`\`\ncodi\n\`\`\`${L}cua important`, 'cua important']
  ])('WC-03 · no es perd el text %s', (_nom, md, text) => {
    const root = pinta(md);
    expect(root.querySelector('pre code').textContent).toBe('codi');
    expect(root.textContent).toContain(text);
    expect(root.textContent).not.toContain('```');
  });

  it('WC-03 · un ítem davant d’una obertura a mitja línia continua sent un ítem', () => {
    const root = pinta(`- item${L}\`\`\`\n  codi\n  \`\`\`\n- b`);
    expect([...root.querySelectorAll('li')].map(n => n.textContent.trim())).toEqual(['item', 'b']);
    expect(root.querySelector('pre code').textContent.trim()).toBe('codi');
    expect(root.querySelector(':scope > p')).toBeNull();
  });

  it('WC-03 · dos blocs que compartixen línia són tots dos codi, i el text de fora es queda', () => {
    const root = pinta(`A${L}\`\`\`\na\n\`\`\`${L}B${L}\`\`\`\n<b>b</b> <!-- c -->\n\`\`\`${P}fi\n\n- x`);
    expect([...root.querySelectorAll('pre code')].map(n => n.textContent)).toEqual(['a', '<b>b</b> <!-- c -->']);
    expect(root.querySelector('b')).toBeNull();
    expect([...root.querySelectorAll(':scope > p')].map(n => n.textContent.trim())).toEqual(['A', 'B', 'fi']);
    expect([...root.querySelectorAll(':scope > ul > li')].map(n => n.textContent)).toEqual(['x']);
  });

  /* WC-04 · La negreta i la cursiva creuen un salt tou només dins d'un
     paràgraf pla: al pas global, un «*» en dues files de taula o en dues
     línies de cita fusionava files o creuava </blockquote> i <hr />. */
  it('WC-04 · un «*» en dues files de taula no les fusiona ni desfà la taula', () => {
    const patrons = pinta('| fitxer | patró |\n|---|---|\n| a | *.md |\n| b | src/*.js |');
    expect(patrons.querySelectorAll('tr')).toHaveLength(3);
    expect(patrons.querySelector('em')).toBeNull();
    const productes = pinta('| 2*3 | 6 |\n|---|---|\n| 4*5 | 20 |');
    expect(productes.querySelector('table')).not.toBeNull();
    expect(productes.querySelectorAll('tr')).toHaveLength(2);
  });

  it.each([
    ['dues línies de cita', '> a*b\n> c*d'],
    ['negreta entre cites', '> **a\n> b**'],
    ['un regle enmig', 'a*b\n---\nc*d'],
    ['un avís i una línia enganxada', '> [!NOTE]\n> a*b\nc*d']
  ])('WC-04 · cap parella creua %s', (_nom, md) => {
    const html = parseMarkdown(md, { entradilla: false });
    expect(html).not.toMatch(/<(?:em|strong)>/);
  });

  it('WC-04 · el salt tou continua dins del paràgraf, de l’ítem i de l’entradilla', () => {
    expect(parseMarkdown('text *amb\ncursiva* i **amb\nnegreta**', { entradilla: false }))
      .toBe('<p>text <em>amb cursiva</em> i <strong>amb negreta</strong></p>');
    expect(pinta('- ítem **amb\n  salt**').querySelector('li strong').textContent).toBe('amb salt');
    expect(parseMarkdown('# Títol\n\n**amb\nsalt** a l’entradilla')).toContain('<p class="lead"><strong>amb salt</strong> a l’entradilla</p>');
  });
});
