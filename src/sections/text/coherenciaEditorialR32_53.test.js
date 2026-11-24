/* Onada v1.2.23+ (R32.53 · Lot 03) · Suite de Coherència Editorial Viva en les 5 llengües oficials
   (ca, es, en, eu, gl) per a /anima i /page/node-zero sobre la Llei d'Experiència 100 % Humana (IDEA-334)
   i la Càtedra d'Unanimitat 8/8 d'Al·lèrgens al Node 0 (IDEA-336), amb Llei 0, Llei 32, Llei 35, T8 i 2.3.10. */
import { describe, expect, test } from 'vitest';
import { PAGE_COPY } from './pageContent.js';
import { localitzaPagina } from './pageContent.r10.js';
import { BLOC_ANIMA_R32_53, BLOC_NODE_ZERO_R32_53 } from './pageContent.coherenciaR32_53.js';
import { nomenaPlataformaAliena, paginaPerAppNativa } from './perAppNativa.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { infraccionsT8 } from '../../../tests/helpers/lleiT8Prova.js';

const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
const PAGINES = ['anima', 'node-zero'];

const TERMES_ESPERATS = Object.freeze({
  ca: ['100 % humana', '8/8', '8 escoles locals', '1169/2011'],
  es: ['100 % humana', '8/8', '8 escuelas locales', '1169/2011'],
  en: ['100% human', '8/8', '8 local Node 0 schools', '1169/2011'],
  eu: ['% 100 giza', '8/8', '8 eskola lokalen', '1169/2011'],
  gl: ['100 % humana', '8/8', '8 escolas locais', '1169/2011'],
});

const RUTES_REQUERIDES = [
  '/perfil',
  '/control',
  '/plugin/tpv',
  '/plugin/rebost',
  '/page/receptes',
  '/page/herbari',
  '/page/banc-de-llavors',
];

const PATRO_PROHIBIT_LLEI_32 =
  /\b(?:servidor|serveis)\s+del\s+poble\b|\b(?:servidor|servicios)\s+del\s+pueblo\b|\bvillage\s+(?:server|services)\b|\bherriko\s+zerbitz(?:ari|u)\w*\b|\b(?:servidor|servizos)\s+da\s+(?:vila|aldea)\b/iu;

const parseja = (html) => new DOMParser().parseFromString(sanitizeHtml(html), 'text/html');

describe('Onada R32.53 · Lot 03 · Coherència Editorial Viva a /anima i /page/node-zero en 5 llengües', () => {
  test.each(LLENGUES)('en %s tant /anima com /page/node-zero estan localitzades al 100 % amb IDEA-334 i IDEA-336', (lang) => {
    for (const clau of PAGINES) {
      const loc = localitzaPagina(PAGE_COPY[clau], lang, clau);
      expect(loc.contentLanguage, `${clau}.${lang}`).toBe(lang);
      const doc = parseja(loc.html);
      const text = doc.body.textContent.replace(/\s+/g, ' ').trim();

      for (const terme of TERMES_ESPERATS[lang]) {
        expect(text, `${clau}.${lang} -> ${terme}`).toContain(terme);
      }
      for (const ruta of RUTES_REQUERIDES) {
        expect(loc.html, `${clau}.${lang} -> href="${ruta}"`).toContain(`href="${ruta}"`);
      }

      expect(text, `${clau}.${lang} Llei 32`).not.toMatch(PATRO_PROHIBIT_LLEI_32);
      expect(text, `${clau}.${lang} zero sobirà`).not.toMatch(/\b(?:sobir[àa]|soberan[oa]s?|sovereign|burujabe|subirano[ak]?)\b/i);
      expect(text, `${clau}.${lang} zero Masia`).not.toMatch(/\b(?:masia|masía)\b/i);
      expect(text, `${clau}.${lang} zero Apple Silicon`).not.toMatch(/\bApple\s+Silicon\b/i);
      expect(nomenaPlataformaAliena(loc.html), `${clau}.${lang} Regla 2.3.10`).toBe(false);
      expect(paginaPerAppNativa(loc).html).toBe(loc.html);

      if (clau === 'node-zero' || lang !== 'ca') {
        expect(infraccionsT8(loc.html), `${clau}.${lang} T8`).toEqual([]);
      }
    }

    for (const fragment of [BLOC_ANIMA_R32_53[lang], BLOC_NODE_ZERO_R32_53[lang]]) {
      expect(fragment).not.toContain('class=');
      const docFrag = parseja(fragment);
      const paragrafs = [...docFrag.querySelectorAll('p')];
      expect(paragrafs).toHaveLength(2);
      for (const p of paragrafs) {
        const nStrong = p.querySelectorAll('strong').length;
        expect(nStrong, `${lang}: ${p.textContent.slice(0, 45)}`).toBeGreaterThanOrEqual(6);
        expect(nStrong, `${lang}: ${p.textContent.slice(0, 45)}`).toBeLessThanOrEqual(8);
      }
    }
  });
});
