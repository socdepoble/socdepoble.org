/**
 * IDEA-357 (v1.2.26 · Pedra Seca 2.0) · Netejador lineal O(n) zero-ReDoS
 * contra marques Markdown crues (**, __, *, _, backticks, [txt](url),
 * [[wiki|etiqueta]], #, >) en entradetes de targetes i Targeta Viva.
 */
import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { toFeedSummary, toMediaDescription } from './contentHelpers.js';
import { textPlaSenseMarkdown } from './textPlaSenseMarkdown.js';
import { textPla } from '../components/universal/targetaViva.js';

vi.mock('../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: ({ children, to, ...rest }) => <a href={to} {...rest}>{children}</a> }));
vi.mock('../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_clau, reserva) => reserva, language: 'ca' }),
  useUIActionsOpcional: () => ({ t: (_clau, reserva) => reserva, language: 'ca' }),
}));
vi.mock('../hooks/useEntitatDelProjecte.js', () => ({ useEntitatDelProjecte: () => null }));
vi.mock('../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
import { TargetaDelMur } from '../sections/mur/TargetaDelMur.jsx';

afterEach(() => cleanup());

describe('IDEA-357 · textPlaSenseMarkdown (lineal O(n), zero-ReDoS)', () => {
  test('lleva negretes, cursives, codi, ratllat, enllaços i wiki-enllaços sense mutilar el contingut', () => {
    expect(textPlaSenseMarkdown('Com s’organitza la **maquinària interna** de **Sóc de Poble** amb `skills` i `tractors` al **Node 0**.'))
      .toBe('Com s’organitza la maquinària interna de Sóc de Poble amb skills i tractors al Node 0.');
    expect(textPlaSenseMarkdown('__Negreta__ amb *cursiva* i _altra cursiva_ i ~~ratllat~~.'))
      .toBe('Negreta amb cursiva i altra cursiva i ratllat.');
    expect(textPlaSenseMarkdown('Visita [La Torre](/pobles/la-torre) i [[00_index|el Portal]] o [[el_projecte]].'))
      .toBe('Visita La Torre i el Portal o el_projecte.');
    expect(textPlaSenseMarkdown('## Títol\n> Cita important\n- Element primer\n* Element segon'))
      .toBe('Títol Cita important Element primer Element segon');
    expect(textPlaSenseMarkdown('```js\nconst a = 1;\n```\nText final'))
      .toBe('const a = 1; Text final');
    expect(textPlaSenseMarkdown('![alt](/foto.jpg) <strong>Hola</strong> <em>món</em>'))
      .toBe('Hola món');
  });

  test('conserva guions baixos interns (foo_bar_baz), multiplicacions (2 * 3) i apòstrofs valencians', () => {
    expect(textPlaSenseMarkdown("L'aigua d'ús s'organitza a foo_bar_baz i snake_case_id."))
      .toBe("L'aigua d'ús s'organitza a foo_bar_baz i snake_case_id.");
    expect(textPlaSenseMarkdown('Càlcul: 2 * 3 = 6 i a__b intacte.'))
      .toBe('Càlcul: 2 * 3 = 6 i a__b intacte.');
  });

  test('neteja marques sense tancar, controla maxLen i entrades buides', () => {
    expect(textPlaSenseMarkdown('**Text truncat sense tancar i `codi obert')).toBe('Text truncat sense tancar i codi obert');
    expect(textPlaSenseMarkdown('**Hola** món del poble', { maxLen: 8 })).toBe('Hola món');
    expect(textPlaSenseMarkdown(null)).toBe('');
    expect(textPlaSenseMarkdown(undefined)).toBe('');
    expect(textPlaSenseMarkdown('')).toBe('');
  });

  test('toFeedSummary i toMediaDescription també lleven marques Markdown crues', () => {
    expect(toFeedSummary('**Festa** a [La Torre](/pobles/la-torre) amb `tractors`')).toBe('Festa a La Torre amb tractors');
    expect(toMediaDescription('**Foto** de _la plaça_ amb `EXIF`')).toBe('Foto de la plaça amb EXIF');
  });

  /* D2 de l'integrador C1-3 (Gauntlet G26, Lent 1 #16 i Lent 2 #8) · «sense mutilar el contingut»:
     abans, 'Si fa < 5 graus i > 30 graus' donava 'Si fa 30 graus', '2*3*4' donava '234' i
     '- 5 graus' perdia el signe. */
  test('D2 · no mutila el contingut legítim: < i > de text pla, multiplicacions, potències i signes', () => {
    for (const legitim of [
      'Si fa < 5 graus i > 30 graus, tapa-ho.',
      'Preu < 5 € i > 2 € per quilo',
      'Barreja 2*3*4 grams i 5**2 cullerades.',
      '- 5 graus a la matinada',
      '+ 3 graus a migdia',
      'Una potència, 10**3, i a**b sense negreta.',
      /* Verificador de la tercera ronda · cada límit de * i la porta d'etiqueta, per separat. */
      'x*y* z',
      'x *2*3 m',
      'Escriu a <info@socdepoble.org> o truca.',
      'Feta al <poble>',
      'Si x<y i y>z, tria y.',
    ]) {
      expect(textPlaSenseMarkdown(legitim)).toBe(legitim);
      expect(textPlaSenseMarkdown(legitim, { llevaHtml: false })).toBe(legitim);
    }
    expect(toFeedSummary('Barreja 2*3*4 grams i 5**2 cullerades.')).toBe('Barreja 2*3*4 grams i 5**2 cullerades.');
    expect(toMediaDescription('- 5 graus a la matinada')).toBe('- 5 graus a la matinada');
  });

  test('D2 · l’HTML es lleva només quan hi ha una etiqueta vàlida, i les marques amb límit continuen fora', () => {
    expect(textPlaSenseMarkdown('<p>Hola</p> i < 5 graus')).toBe('Hola i < 5 graus');
    expect(textPlaSenseMarkdown('<script>x()</script>Text <br/>net')).toBe('Text net');
    expect(textPlaSenseMarkdown('<b>x</b>', { llevaHtml: false })).toBe('<b>x</b>');
    expect(textPlaSenseMarkdown('(**y**), ***x*** i **z**.')).toBe('(y), x i z.');
    expect(textPlaSenseMarkdown('- Element\n- 7 unitats\n## 2026')).toBe('Element - 7 unitats 2026');
    /* Una etiqueta de la llista tancada encara activa la neteja d'HTML. */
    expect(textPlaSenseMarkdown('<P>Hola</P> <section>món</section>')).toBe('Hola món');
    /* Les etiquetes heretades de WordPress i Blogger també són HTML de debò. */
    expect(textPlaSenseMarkdown('<center>Festes de 2026</center>')).toBe('Festes de 2026');
    expect(textPlaSenseMarkdown('<strike>Preu antic</strike> 5 €')).toBe('Preu antic 5 €');
  });

  /* IDEA-357.2 («mai **») · Una negreta enganxada a una paraula per un sol costat se'n va sencera;
     sense cap costat lliure (a**b**c, 5**2) és text i es queda. */
  test('IDEA-357.2 · la negreta enganxada per un costat no deixa mai ** a la vista', () => {
    expect(textPlaSenseMarkdown('**Tractor**s i més**negreta**.')).toBe('Tractors i mésnegreta.');
    expect(textPlaSenseMarkdown('a**b**c i 5**2')).toBe('a**b**c i 5**2');
    expect(textPlaSenseMarkdown('Els **Tractors** del **Node 0**')).toBe('Els Tractors del Node 0');
    /* Verificador de la tercera ronda (lent 1) · les negretes adjacents no deixen cap **, i la negreta
       lliure continua passant per les regles d'inici de línia de llevaMd. */
    expect(textPlaSenseMarkdown('a****b** i **a****b')).toBe('ab i ab');
    expect(textPlaSenseMarkdown('**a****b****c**')).toBe('abc');
    expect(textPlaSenseMarkdown('- **11.00 h** Despertà\n- **18.00 h** Concert')).toBe('11.00 h Despertà 18.00 h Concert');
    expect(textPlaSenseMarkdown('**+ info** a la web')).toBe('+ info a la web');
    expect(textPlaSenseMarkdown('**> 30 graus** a l’estiu')).toBe('> 30 graus a l’estiu');
  });

  test('targetaViva · textPla elimina Markdown cru en entradetes i títols', () => {
    expect(textPla('<p>**Maquinària** i `skills` a [La Torre](/pobles/la-torre)</p>'))
      .toBe('Maquinària i skills a La Torre');
  });

  /* Les mostres hostils d'abans i les dels límits nous de D2 (l'etiqueta vàlida, ** i * amb límit,
     el signe davant d'un dígit), de llargària `n`. */
  const mostresHostils = (n) => [
    '*'.repeat(n),
    '_'.repeat(n),
    '['.repeat(n),
    '`'.repeat(n),
    '<'.repeat(n),
    '\n'.repeat(n),
    `${'**a_b_c '.repeat(n / 8)}`,
    `${'*a '.repeat(Math.floor(n / 3))}`,
    `${'_a '.repeat(Math.floor(n / 3))}`,
    `${' '.repeat(n)}text`,
    `${'[['.repeat(n / 2)}`,
    `${'['.repeat(n / 2)}](${'x'.repeat(n / 2)}`,
    `${'<a'.repeat(n / 2)}`,
    `<${'a'.repeat(n)}`,
    `${'5**2 '.repeat(n / 5)}`,
    `${'2*3*'.repeat(n / 4)}`,
    ` *a${'b'.repeat(n)}*c`,
    `${'- 5\n'.repeat(n / 4)}`,
    `-${' '.repeat(n)}`,
  ];
  const resolLineal = (n, sostreMs) => {
    for (const entrada of mostresHostils(n)) {
      for (const llevaHtml of [true, false]) {
        const inici = performance.now();
        const eixida = textPlaSenseMarkdown(entrada, { llevaHtml });
        const ms = performance.now() - inici;
        expect(typeof eixida).toBe('string');
        expect(ms).toBeLessThan(sostreMs);
      }
    }
  };

  test('fuzzing 100.000 caràcters (*, _, [, `, <, \\n) es resol en temps lineal (< 250 ms, zero ReDoS)', () => {
    resolLineal(100_000, 250);
  });

  /* ×10 d'entrada, ×10 de sostre: una expressió quadràtica hi faria ×100 (el Gauntlet G26 va mesurar
     108–110 ms per al pitjor cas d'1.000.000 de salts de línia). */
  test('fuzzing 1.000.000 de caràcters es resol en temps lineal (sostre ample de 2.500 ms)', () => {
    resolLineal(1_000_000, 2500);
  }, 120_000);

  test('integració TargetaDelMur: mai pinta **, __, backticks ni [txt](url) crus a l’entradeta', () => {
    const item = {
      id: 'post-md-1',
      type: 'post',
      title: 'El sistema nerviós',
      subtitle: '**Mapa** de `skills`',
      entradilla: 'Com funciona la **maquinària interna** de [Sóc de Poble](/projecte) amb `tractors` i [[00_index|la Wiki]].',
      created_at: '2026-11-26T04:00:00Z',
    };
    const { container } = render(<TargetaDelMur item={item} />);
    const text = container.textContent;
    expect(text).toContain('Com funciona la maquinària interna de Sóc de Poble amb tractors i la Wiki.');
    expect(text).toContain('Mapa de skills');
    expect(text).not.toContain('**');
    expect(text).not.toContain('`');
    expect(text).not.toContain('[[');
    expect(text).not.toContain('](/projecte)');
  });

  /* Gauntlet G26, Lent 2 #8 · netMd (llevaHtml per defecte) ja no es menja el text entre < i >. */
  test('integració TargetaDelMur: una entradeta en text pla amb < i > i un subtítol amb 2*3 es pinten sencers', () => {
    const item = {
      id: 'post-md-2',
      type: 'post',
      title: 'Preus de la tardor',
      subtitle: 'Caixes de 2*3 quilos',
      entradilla: 'Preu < 5 € i > 2 € per quilo',
      created_at: '2026-11-26T04:00:00Z',
    };
    const { container } = render(<TargetaDelMur item={item} />);
    expect(container.textContent).toContain('Preu < 5 € i > 2 € per quilo');
    expect(container.textContent).toContain('Caixes de 2*3 quilos');
  });
});
