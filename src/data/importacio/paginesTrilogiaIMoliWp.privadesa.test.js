import { webcrypto } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { carregaPaginesTrilogiaIMoliWp } from './paginesTrilogiaIMoliWp.js';
import { transformaPaginaTrilogiaIMoliWp } from './paginesTrilogiaIMoliEditorial.js';

beforeAll(() => vi.stubGlobal('crypto', webcrypto));
afterAll(() => vi.unstubAllGlobals());

const CORREU = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PAGINA_MINIMA = Object.freeze({ id: 16668, slug: 'prova', title: 'Prova', date: '2014-01-01T12:00:00', link: 'https://socdepoble.net/prova/', featured_image: null, images: [], iframes: [] });

describe('IDEA-111 · privadesa de l’esborrany', () => {
  test('cap esborrany copia l’adreça d’un tercer; només queda la de l’associació', async () => {
    for (const page of await carregaPaginesTrilogiaIMoliWp()) {
      const adreces = (transformaPaginaTrilogiaIMoliWp(page).htmlNet.match(CORREU) || []).map(a => a.toLowerCase());
      expect(adreces.filter(a => a !== 'socdepoblecom@gmail.com')).toEqual([]);
    }
  });

  test('un mailto o un correu en text d’una persona aliena es retira, el de l’associació no', () => {
    const base = { id: 16668, slug: 'prova', title: 'Prova', date: '2014-01-01T12:00:00', link: 'https://socdepoble.net/prova/', featured_image: null, images: [], iframes: [] };
    const draft = transformaPaginaTrilogiaIMoliWp({ ...base, contentHtml: '<p>Escriviu a <a href="mailto:Algu.Aliè@mail.com">algú</a>, a algu@mail.com o a <a href="mailto:socdepoblecom@gmail.com">l’associació</a>.</p>' });
    expect(draft.htmlNet).not.toMatch(/@mail\.com/i);
    expect(draft.htmlNet).toContain('mailto:socdepoblecom@gmail.com');
    expect(draft.htmlNet).toContain('algú');
  });

  test('R19 · un correu aliè enganxat a l’institucional es retira, l’institucional i els separadors es conserven', () => {
    const draft = transformaPaginaTrilogiaIMoliWp({ ...PAGINA_MINIMA, contentHtml: '<p>Contacte: socdepoblecom@gmail.com,veina.particular@correu.net;Altra.Persona@exemple.org (socdepoblecom@gmail.com)</p>' });
    expect(draft.htmlNet).toContain('Contacte: socdepoblecom@gmail.com,correu de contacte;correu de contacte (socdepoblecom@gmail.com)');
    expect(draft.htmlNet).not.toMatch(/veina|particular|correu\.net|Altra\.Persona|exemple\.org/i);
  });

  test('R19 · zero ReDoS: una tirada de 50.000 caràcters hostils costa com una de benigna de la mateixa longitud', () => {
    // Sense fites, «[…]+@» retrocedix sobre tota la tirada des de cada posició (cost quadràtic):
    // 4.421 ms abans de R19, i 13.288–18.576 ms per tirada amb la forma sense prefix ni fites.
    // Un llindar absolut depén de la càrrega de la CI, i la raó 50.000/5.000 la distorsiona el GC
    // d'un heap gran (2,0 ms contra 84,7 ms en una tirada lineal en paral·lel). Per això es compara
    // amb una tirada benigna de la mateixa longitud, mesurada alternadament: mateix parser, mateix
    // sanejador i mateix GC. Lineal ≈ 1–3 vegades; la forma quadràtica, més de 15 vegades.
    const RAO_MAXIMA = 10;
    const LONGITUD = 50000;
    const benigna = 'ab '.repeat(LONGITUD).slice(0, LONGITUD);
    const mesura = (text) => {
      const inici = performance.now();
      const draft = transformaPaginaTrilogiaIMoliWp({ ...PAGINA_MINIMA, contentHtml: `<p>${text}</p>` });
      return { durada: performance.now() - inici, html: draft.htmlNet };
    };
    mesura(benigna);
    for (const hostil of ['a'.repeat(LONGITUD), `${'a'.repeat(LONGITUD)}@`, `x@${'a'.repeat(LONGITUD)}`]) {
      let minimBenigna = Infinity;
      let minimHostil = Infinity;
      for (let repeticio = 0; repeticio < 3; repeticio += 1) {
        minimBenigna = Math.min(minimBenigna, mesura(benigna).durada);
        const { durada, html } = mesura(hostil);
        expect(html).toContain('a'.repeat(1000));
        minimHostil = Math.min(minimHostil, durada);
      }
      const rao = minimHostil / Math.max(minimBenigna, 1);
      expect(rao, `«${hostil.slice(0, 3)}…»: ${minimHostil.toFixed(1)} ms hostil i ${minimBenigna.toFixed(1)} ms benigna`).toBeLessThanOrEqual(RAO_MAXIMA);
    }
  }, 120000);
});
