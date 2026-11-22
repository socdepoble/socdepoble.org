/* Onada R32.15 · Lot 03 (D02 + D06) · Suite de Coherència Editorial Viva Llei 6 + Llei 35
   en les 5 llengües oficials (ca, es, en, eu, gl) per a /disseny, /page/node-zero i /page/fediversity,
   més l'espècimen visual del Mode Sènior al catàleg diferit de /disseny (EspecimenPanell). */
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import { PAGE_COPY } from './pageContent.js';
import { localitzaPagina } from './pageContent.r10.js';
import { BLOC_DISSENY_R32_15, FEDIVERSITY_R32_15_PREAMBUL } from './pageContent.coherenciaR32_15.js';
import { nomenaPlataformaAliena, paginaPerAppNativa } from './perAppNativa.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import EspecimenPanell from '../disseny/cataleg/detalls/EspecimenPanell.jsx';

const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
const PAGINES_R32_15 = ['disseny', 'node-zero', 'fediversity'];
const RUTES_FITES_R32_15 = [
  '/perfil',
  '/control',
  '/plugin/avisador',
  '/wikidepoble',
  '/plugin/tpv',
  '/plugin/rebost',
  '/plugin/gestoria',
  '/plugin/rss',
  '/plugin/salut',
  '/plugin/genealogia',
];

const MODE_SENIOR_TERMES = {
  ca: ['Mode Sènior', '56 × 56', '10:1', '320', '359', '7,2 MB', '10 MiB'],
  es: ['Modo Sénior', '56 × 56', '10:1', '320', '359', '7,2 MB', '10 MiB'],
  en: ['Senior Mode', '56 × 56', '10:1', '320', '359', '7.2 MB', '10 MiB'],
  eu: ['Senior Modua', '56 × 56', '10:1', '320', '359', '7,2 MB', '10 MiB'],
  gl: ['Modo Sénior', '56 × 56', '10:1', '320', '359', '7,2 MB', '10 MiB'],
};

const PATRO_PROHIBIT_LLEI_32 =
  /\b(?:servidor|serveis)\s+del\s+poble\b|\b(?:servidor|servicios)\s+del\s+pueblo\b|\bvillage\s+(?:server|services)\b|\bherriko\s+zerbitz(?:ari|u)\w*\b|\b(?:servidor|servizos)\s+da\s+(?:vila|aldea)\b/iu;

const parseja = (html) => new DOMParser().parseFromString(sanitizeHtml(html), 'text/html');

describe('Onada R32.15 · Lot 03 · Coherència Editorial Viva en 5 llengües (Llei 6 + Llei 35)', () => {
  test.each(LLENGUES)(
    '%s · /disseny, /page/node-zero i /page/fediversity documenten Mode Sènior (56 px + 10:1 AAA), 320/359 px, Wiki vertical P0-128, eines en 5 llengües i connector WP de 7,2 MB',
    (lang) => {
      for (const clau of PAGINES_R32_15) {
        const loc = localitzaPagina(PAGE_COPY[clau], lang, clau);
        expect(loc.contentLanguage, `${clau}.${lang}`).toBe(lang);
        const doc = parseja(loc.html);
        const text = doc.body.textContent.replace(/\s+/g, ' ').trim();

        for (const terme of MODE_SENIOR_TERMES[lang]) {
          expect(text, `${clau}.${lang} -> ${terme}`).toContain(terme);
        }
        for (const ruta of RUTES_FITES_R32_15) {
          expect(loc.html, `${clau}.${lang} -> href="${ruta}"`).toContain(`href="${ruta}"`);
        }
        expect(text, `${clau}.${lang} -> Llei 32`).not.toMatch(PATRO_PROHIBIT_LLEI_32);
        expect(text, `${clau}.${lang} -> zero sobirà`).not.toMatch(/\b(?:sobir[àa]|soberan[oa]s?|sovereign|burujabe|subirano[ak]?)\b/i);

        if (clau !== 'fediversity') {
          expect(nomenaPlataformaAliena(loc.html), `${clau}.${lang} Regla 2.3.10`).toBe(false);
          expect(paginaPerAppNativa(loc).html).toBe(loc.html);
        }
      }

      // Llei 35: cada paràgraf nou de BLOC_DISSENY_R32_15 i FEDIVERSITY_R32_15_PREAMBUL té exactament entre 6 i 8 negretes d'escaneig
      for (const fragment of [BLOC_DISSENY_R32_15[lang], FEDIVERSITY_R32_15_PREAMBUL[lang]]) {
        expect(fragment).not.toContain('class=');
        const docFrag = parseja(fragment);
        const paragrafs = [...docFrag.querySelectorAll('p')];
        expect(paragrafs.length).toBeGreaterThanOrEqual(2);
        for (const p of paragrafs) {
          const n = p.querySelectorAll('strong').length;
          expect(n, `${lang}: ${p.textContent.slice(0, 40)}`).toBeGreaterThanOrEqual(6);
          expect(n, `${lang}: ${p.textContent.slice(0, 40)}`).toBeLessThanOrEqual(8);
        }
      }
    },
  );

  /* v1.2.22 · Gauntlet R1 (L3-05) · Un sol «Mode Bancal · Sol i Lletra Gran»: el segon interruptor, mort, ja no hi és.
     S'actualitza a posta (abans, l'espècimen «Mode Sènior / Lectura Gran»). */
  test('Llei 35 · EspecimenPanell porta un sol interruptor, el del Mode Bancal · Sol i Lletra Gran, al catàleg diferit de /disseny', () => {
    render(
      <MemoryRouter>
        <EspecimenPanell />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Mode Bancal · Sol i Lletra Gran' })).toBeTruthy();
    expect(screen.getByRole('switch', { name: 'Mode Bancal · Sol i Lletra Gran' }).disabled).toBe(true);
    expect(screen.queryByRole('switch', { name: 'Activar el Mode Sènior (Lectura Gran)' })).toBeNull();
    expect(screen.getAllByRole('switch')).toHaveLength(1);
    expect(document.body.textContent).not.toContain('preferència de lectura gran');
  });
});
