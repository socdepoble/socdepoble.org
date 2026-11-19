/**
 * P0-77 / IDEA-208 (R16-P; ordre del Mestre, 261109 20:57) · /disseny documenta, en les 5 llengües, què és propi
 * de Sóc de Poble i quins patrons hem adaptat, i què fa la data de cada targeta del Mur segons l'arquetip.
 */
import { describe, expect, test } from 'vitest';
import { PAGE_COPY } from './pageContent.js';
import { localitzaPagina } from './pageContent.r10.js';
import { BLOC_DISSENY_R16P } from './pageContent.propiAdaptatR16P.js';

const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
const ADAPTATS = ['Bring!', 'Loyverse', 'WhatsApp', 'Google Docs', 'Feedly', 'Obsidian'];
const h3 = (html) => (html.match(/<h3>/g) ?? []).length;

describe('/disseny · propi i adaptat, i la data de cada targeta', () => {
  test('cada llengua porta el bloc, amb els sis patrons adaptats i les tres maneres de la data', () => {
    for (const lang of LLENGUES) {
      const p = localitzaPagina(PAGE_COPY.disseny, lang);
      expect(p.html, lang).toContain(BLOC_DISSENY_R16P[lang]);
      for (const nom of ADAPTATS) expect(p.html, `${lang} · ${nom}`).toContain(`<strong>${nom}</strong>`);
      for (const tros of ['UniversalCard', 'UniversalPage', 'UniversalWorkspace', 'Pedra Seca', 'href="/calendari"']) {
        expect(p.html, `${lang} · ${tros}`).toContain(tros);
      }
      expect(h3(BLOC_DISSENY_R16P[lang]), lang).toBe(2);
      expect((BLOC_DISSENY_R16P[lang].match(/<li>/g) ?? []).length, lang).toBe(9);
    }
  });

  test('les traduccions tenen tants apartats com el valencià, i el bloc va al final', () => {
    const ca = localitzaPagina(PAGE_COPY.disseny, 'ca').html;
    expect(ca.endsWith(BLOC_DISSENY_R16P.ca)).toBe(true);
    for (const lang of LLENGUES.slice(1)) {
      const html = localitzaPagina(PAGE_COPY.disseny, lang).html;
      expect(h3(html), lang).toBe(h3(ca));
      expect(html.endsWith(BLOC_DISSENY_R16P[lang]), lang).toBe(true);
    }
  });
});
