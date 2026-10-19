/**
 * Auditoria de seguretat 261019 (R1) · textPla (indexCerca.js), que /cerca
 * passa per a tothom sobre el cos de cada publicació i cada producte, torna
 * exactament el mateix que amb les expressions d'abans, i en temps lineal: un
 * cos amb molts '<', '<script' o '![' i cap tancament ja no congela la cerca.
 */
import { describe, expect, test } from 'vitest';
import { cercaEntrades, deProducte, dePublicacio, textPla } from './indexCerca.js';

/* El textPla d'abans, només com a oracle de la prova. */
const ENTITATS = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'" };
const textPlaDAbans = (valor) => {
  if (valor == null || typeof valor === 'object') return '';
  return String(valor).replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
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

  test('torna el mateix que l’expressió d’abans en milers de textos aleatoris', () => {
    const trossos = ['<', '>', '<p>', '</p>', '<script', '</script>', '<STYLE', '</style>', '![', ']', '(', ')', '](',
      '&nbsp;', '&amp;', '&#39;', '&apos', 'a', ' ', '\n', ' '];
    for (const text of textsAleatoris(trossos, 6000, 30, 20261019)) {
      expect(textPla(text)).toBe(textPlaDAbans(text));
    }
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
