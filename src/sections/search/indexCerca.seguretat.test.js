/**
 * Auditoria de seguretat 261019 (R1) · textPla (indexCerca.js), que /cerca
 * passa per a tothom sobre el cos de cada publicació i cada producte, torna
 * el contracte històric amb inline sense espai (ordre O6), en temps lineal: un
 * cos amb molts '<', '<script' o '![' i cap tancament ja no congela la cerca.
 */
import { describe, expect, test } from 'vitest';
import { cercaEntrades, deProducte, dePublicacio, textPla } from './indexCerca.js';

/* Oracle independent de la prova (només entrades curtes). Del legacy només
   canvia la substitució d'una etiqueta inline vàlida per buit (ordre O6),
   decidida sobre la mateixa finestra sencera, no en dues passades. */
const ENTITATS = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'" };
const textPlaDAbans = (valor) => {
  if (valor == null || typeof valor === 'object') return '';
  return String(valor).replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, (tag) => {
      const match = /^<\/?([a-z]+)/i.exec(tag);
      const name = match?.[1]?.toLowerCase();
      const inline = ['strong', 'b', 'em', 'i', 'code', 'span', 'mark', 'u', 's', 'sub', 'sup', 'small', 'abbr', 'a'].includes(name);
      const suffix = match ? tag.slice(match[0].length, -1) : null;
      const valid = suffix === '' || suffix === '/' || /^[\t\n\f\r ]/.test(suffix ?? '');
      return inline && valid && !tag.slice(1).includes('<') ? '' : ' ';
    })
    .replace(/&(nbsp|amp|lt|gt|quot|apos|#39);/g, (entitat) => ENTITATS[entitat] || ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/* Un generador determinista (LCG): la mateixa sèrie en cada execució. */
function generador(llavor) {
  let estat = llavor >>> 0;
  return (maxim) => {
    estat = (Math.imul(estat, 1664525) + 1013904223) >>> 0;
    return estat % maxim;
  };
}

function textsAleatoris(trossos, quantitat, llargariaMaxima, llavor) {
  const atzar = generador(llavor);
  return Array.from({ length: quantitat }, () => {
    const llargaria = atzar(llargariaMaxima + 1);
    let text = '';
    for (let i = 0; i < llargaria; i += 1) text += trossos[atzar(trossos.length)];
    return text;
  });
}

describe('textPla', () => {
  test('els casos de sempre', () => {
    expect(textPla('<p>Hola&nbsp;<b>món</b></p><script>x()</script><style>p{}</style>')).toBe('Hola món');
    expect(textPla('Pa ![foto](/assets/pa.webp) de casa &amp; coca')).toBe('Pa de casa & coca');
    expect(textPla('a < b')).toBe('a < b');
    expect(textPla(null)).toBe('');
    expect(textPla({ html: '<p>x</p>' })).toBe('');
  });

  test('conserva el contracte històric i les inline d’O6 en milers de textos aleatoris', () => {
    const trossos = ['<', '>', '<p>', '</p>', '<script', '</script>', '<STYLE', '</style>', '![', ']', '(', ')', '](',
      '&nbsp;', '&amp;', '&#39;', '&apos', 'a', ' ', '\n', ' '];
    for (const text of textsAleatoris(trossos, 6000, 30, 20261019)) {
      expect(textPla(text), JSON.stringify(text)).toBe(textPlaDAbans(text));
    }
  });

  test('O7 · retirar la inline d’un doble < no fabrica una etiqueta incompleta nova', () => {
    const text = '</p><<a >a&nbsp;<STYLE &apos))<scripta</style>](\n<STYLE';
    expect(textPla(text)).toBe('a ]( <STYLE');
    expect(textPla(text)).toBe(textPlaDAbans(text));
    expect(textPla('ab<<a >cd')).toBe('ab cd');
  });

  test('O6 · inline vàlida no separa; blocs, tags amb nom distint i fragments incomplets conserven el seu contracte', () => {
    expect(textPla("l'<strong>APK</strong> i <em>l'app</em>")).toBe("l'APK i l'app");
    expect(textPla('ab<a href="/notes">cd</a>ef')).toBe('abcdef');
    expect(textPla('ab<p>cd</p>ef')).toBe('ab cd ef');
    expect(textPla('ab<a-b>cd</a-b>ef')).toBe('ab cd ef');
    expect(textPla('ab<a////>cd')).toBe('ab cd');
    expect(textPla('ab<a >cd')).toBe('ab cd');
    expect(textPla('ab<strong')).toBe('ab<strong');
  });

  test('un cos de molts <, <script o ![ sense tancar es resol en temps lineal', () => {
    const inici = performance.now();
    expect(textPla('<'.repeat(160000))).toBe('<'.repeat(160000));
    expect(textPla('<script'.repeat(40000))).toBe('<script'.repeat(40000));
    expect(textPla('!['.repeat(160000))).toBe('!['.repeat(160000));
    expect(performance.now() - inici).toBeLessThan(1000);
  });

  test('/cerca indexa i troba una publicació i un producte amb un cos d’atac sense congelar-se', () => {
    const inici = performance.now();
    const index = [
      dePublicacio({ id: 'p1', title: 'Atac al Mur', content: `${'<'.repeat(160000)} final` }),
      deProducte({ id: 'm1', title: 'Atac al Mercat', description: `${'![]('.repeat(40000)} final` })
    ];
    expect(cercaEntrades(index, 'atac').llista.map((entrada) => entrada.clau)).toEqual(expect.arrayContaining(['publicacions:p1', 'mercat:m1']));
    expect(performance.now() - inici).toBeLessThan(1000);
  });
});
