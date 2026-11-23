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
import { TEXTOS_MODE_SENIOR } from '../../config/textosModeSenior.js';

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
  ca: ['Mode Sènior', '56 × 56', '320', '359', '7,2 MB', '10 MiB'],
  es: ['Modo Sénior', '56 × 56', '320', '359', '7,2 MB', '10 MiB'],
  en: ['Senior Mode', '56 × 56', '320', '359', '7.2 MB', '10 MiB'],
  eu: ['Senior Modua', '56 × 56', '320', '359', '7,2 MB', '10 MiB'],
  gl: ['Modo Sénior', '56 × 56', '320', '359', '7,2 MB', '10 MiB'],
};

/* v1.2.23 · L3-03 (Gauntlet R1) · El nom del mode és per pàgina. /disseny el descriu en present i ensenya, a EspecimenPanell,
   l'interruptor «Mode Bancal · Sol i Lletra Gran» (DOL-31): diu el rètol viu del xip (textosModeSenior.js) i cap nom vell en
   tota la pàgina. /page/node-zero i /page/fediversity són cròniques de l'R32.15 i conserven el nom d'aleshores
   (MODE_SENIOR_TERMES[lang][0]). S'actualitza a posta (abans, «Mode Sènior» a les tres). */
const NOMS_VELLS = /(?:Mode|Modo) S[èée]nior|Senior Mod|Lectura Gran|Large Reading|Irakurketa Handia/i;
const termesDelMode = (clau, lang) => (clau === 'disseny'
  ? [TEXTOS_MODE_SENIOR[lang].xipCurt, TEXTOS_MODE_SENIOR[lang].xip.split(' · ')[1], ...MODE_SENIOR_TERMES[lang].slice(1)]
  : MODE_SENIOR_TERMES[lang]);

/* v1.2.23 · D-V1223-TEXT-BANCAL (ordre del Mestre 261123) · El contrast de cada pàgina. /disseny descriu el mode en present
   (BLOC_DISSENY_R32_15): hui el mínim real és AAA ≥ 7:1 (el taronja de marca amb pedra-900 al damunt fa 7,12:1; v1.2.23 · L3-01,
   el text d'avís damunt del subtil clar, 7,07:1). /page/node-zero
   (dins de «Què fa hui el Node 0») i /page/fediversity porten la crònica de l'R32.15 i diuen «AAA (≥ 7:1)», que és cert
   aleshores (passava de 10:1) i hui. Cap de les tres diu «10:1». S'actualitza a posta (abans, 10:1 a les tres). */
const CONTRAST_PER_PAGINA = { disseny: '7:1', 'node-zero': '(≥ 7:1)', fediversity: '(≥ 7:1)' };
/** «10:1» com a xifra pròpia: no casa amb «16,10:1» ni «7,10:1» (altres parells) ni amb hores com «10:15». */
const PROMESA_10_1 = /(?<![\d,.])10:1(?!\d)/;
const CONTRAST_DISSENY = {
  ca: '7:1 o més (AAA)', es: '7:1 o más (AAA)', en: '7:1 or higher (AAA)', eu: '7:1 edo gehiagora (AAA)', gl: '7:1 ou máis (AAA)',
};

const PATRO_PROHIBIT_LLEI_32 =
  /\b(?:servidor|serveis)\s+del\s+poble\b|\b(?:servidor|servicios)\s+del\s+pueblo\b|\bvillage\s+(?:server|services)\b|\bherriko\s+zerbitz(?:ari|u)\w*\b|\b(?:servidor|servizos)\s+da\s+(?:vila|aldea)\b/iu;

const parseja = (html) => new DOMParser().parseFromString(sanitizeHtml(html), 'text/html');

describe('Onada R32.15 · Lot 03 · Coherència Editorial Viva en 5 llengües (Llei 6 + Llei 35)', () => {
  test.each(LLENGUES)(
    '%s · /disseny (Mode Bancal, el nom viu), /page/node-zero i /page/fediversity (Mode Sènior, la crònica) documenten 56 px + AAA ≥ 7:1 (cap 10:1), 320/359 px, Wiki vertical P0-128, eines en 5 llengües i connector WP de 7,2 MB',
    (lang) => {
      for (const clau of PAGINES_R32_15) {
        const loc = localitzaPagina(PAGE_COPY[clau], lang, clau);
        expect(loc.contentLanguage, `${clau}.${lang}`).toBe(lang);
        const doc = parseja(loc.html);
        const text = doc.body.textContent.replace(/\s+/g, ' ').trim();

        for (const terme of termesDelMode(clau, lang)) {
          expect(text, `${clau}.${lang} -> ${terme}`).toContain(terme);
        }
        if (clau === 'disseny') expect(text, `${clau}.${lang} -> cap nom vell del mode`).not.toMatch(NOMS_VELLS);
        expect(text, `${clau}.${lang} -> ${CONTRAST_PER_PAGINA[clau]}`).toContain(CONTRAST_PER_PAGINA[clau]);
        expect(text, `${clau}.${lang} -> cap 10:1`).not.toMatch(PROMESA_10_1);
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

      // v1.2.23 · D-V1223-TEXT-BANCAL · El bloc viu de /disseny diu AAA ≥ 7:1 i cap 10:1.
      const blocDisseny = parseja(BLOC_DISSENY_R32_15[lang]).body.textContent;
      expect(blocDisseny, `disseny.${lang} -> ${CONTRAST_DISSENY[lang]}`).toContain(CONTRAST_DISSENY[lang]);
      expect(blocDisseny, `disseny.${lang} -> cap 10:1`).not.toContain('10:1');

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
