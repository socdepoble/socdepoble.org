import { describe, expect, it } from 'vitest';
import { parseMarkdown } from './parseMarkdown.js';
import { sanitizeHtml } from '../../utils/sanitize.js';

/* Mateix camí que WikiDePobleSection: parser → sanejador → DOM. */
const pinta = (md) => {
  const arrel = document.createElement('div');
  arrel.innerHTML = sanitizeHtml(parseMarkdown(md));
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

describe('parseMarkdown · sanejament conservat', () => {
  it('l’eixida continua passant pel sanejador', () => {
    const arrel = pinta('[x](javascript:alert(1))\n\n<img src="x" onerror="alert(1)">');
    expect(arrel.querySelector('a').getAttribute('href')).toBeNull();
    expect(arrel.querySelector('img').hasAttribute('onerror')).toBe(false);
  });
});
