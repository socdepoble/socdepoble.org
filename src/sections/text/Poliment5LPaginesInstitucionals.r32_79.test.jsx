/* Onada v1.2.24 · G16 (R32.79_gemini) · Suite canària de Poliment Humà 5 Llengües, Regla «de poble»
   (core-llegibilitat-text §4), Escaneig 6–8 <strong> en paràgrafs llargs (>= 42 paraules), Llei 32,
   Llei 9 (accions centrades) i Regla 2.3.10 per a Projecte, Ànima, Fedivers, Fediversity i Descàrregues. */
import { describe, expect, test } from 'vitest';
import { PAGE_COPY } from './pageContent.js';
import { localitzaPagina } from './pageContent.r10.js';
import { htmlAparadorR20 } from './pageContent.fediversityR20.js';
import { nomenaPlataformaAliena, paginaPerAppNativa } from './perAppNativa.js';
import { sanitizeHtml } from '../../utils/sanitize.js';

const PAGINES_G16 = Object.freeze(['projecte', 'anima', 'fedivers', 'fediversity', 'descarregues']);
const LLENGUES = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

const PATRO_LLEI_32 =
  /\b(?:el\s+servidor\s+del\s+poble|els\s+serveis\s+del\s+poble|el\s+servidor\s+del\s+pueblo|los\s+servicios\s+del\s+pueblo|the\s+village\s+server|the\s+village\s+services|herriko\s+zerbitzaria|herriko\s+zerbitzuak|o\s+servidor\s+da\s+(?:vila|aldea)|os\s+servizos\s+da\s+(?:vila|aldea))\b/iu;

const PATRO_SOBIRANIA = /\b(?:sobir[àa]|sobirania|soberan[oa]s?|soberanía|sovereign|sovereignty|burujabe|subirano[ak]?)\b/iu;

const PATRO_GENERIC_DEL_POBLE =
  /\b(?:veí\s+o\s+veïna\s+del\s+poble|vecino\s+o\s+vecina\s+del\s+pueblo|memòria\s+del\s+poble|memoria\s+del\s+pueblo|història\s+del\s+poble|persona\s+del\s+poble\s+revisa|Gestoría\s+del\s+Pueblo|gent\s+gran\s+del\s+poble|veïns\s+majors\s+del\s+poble|missatgeria\s+del\s+poble|Xente\s+da\s+aldea)\b/u;

function parseja(html) {
  const net = String(html || '').replace(/<!--[\s\S]*?-->/g, '');
  return new DOMParser().parseFromString(sanitizeHtml(net), 'text/html');
}

function comptaParaules(text, lang) {
  const seg = new Intl.Segmenter(lang, { granularity: 'word' });
  return [...seg.segment(text)].filter((part) => part.isWordLike).length;
}

describe('G16 · R32.79_gemini · Poliment 5 llengües, Regla «de poble» i escaneig 6–8 negretes en les 5 pàgines institucionals', () => {
  test.each(LLENGUES)(
    '%s · projecte, anima, fedivers, fediversity i descarregues compleixen 5L, 6–8 <strong> en paràgrafs >= 42w, Regla «de poble», Llei 32 i 0 sobirania',
    (lang) => {
      for (const clau of PAGINES_G16) {
        const loc = localitzaPagina(PAGE_COPY[clau], lang, clau);
        expect(loc.contentLanguage ?? 'ca', `${clau}.${lang} contentLanguage`).toBe(lang);
        expect(loc.title.trim().length, `${clau}.${lang} title`).toBeGreaterThan(3);
        expect(loc.subtitle.trim().length, `${clau}.${lang} subtitle`).toBeGreaterThan(5);
        expect(loc.lead.trim().length, `${clau}.${lang} lead`).toBeGreaterThan(25);

        const doc = parseja(loc.html);
        expect(doc.querySelector('h1, h2, script, iframe'), `${clau}.${lang} zero h1/h2/script/iframe`).toBeNull();
        expect(doc.querySelector('h3'), `${clau}.${lang} primer h3`).not.toBeNull();
        expect([...doc.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter((h) => h.querySelector('strong'))).toHaveLength(0);
        expect(doc.querySelectorAll('strong strong, code strong, strong:empty')).toHaveLength(0);

        const hs = [...doc.querySelectorAll('h3, h4, h5, h6')];
        hs.forEach((h, idx) => {
          const nivell = Number(h.tagName[1]);
          if (idx === 0) expect(nivell, `${clau}.${lang} arranca amb H3`).toBe(3);
          else expect(nivell, `${clau}.${lang} sense salt a «${h.textContent}»`).toBeLessThanOrEqual(Number(hs[idx - 1].tagName[1]) + 1);
        });

        const paragrafs = [...doc.querySelectorAll('p')].filter(
          (p) => !p.closest('.sdp-targetes') && !p.closest('[data-sdp-aparador-r20]') && p.textContent.trim().length > 0,
        );
        expect(paragrafs.length, `${clau}.${lang} té paràgrafs editorials`).toBeGreaterThan(5);

        for (const p of paragrafs) {
          const nStrong = p.querySelectorAll('strong').length;
          const nWords = comptaParaules(p.textContent, lang);
          if (nWords > 4) {
            expect(nStrong, `${clau}.${lang} cap paràgraf pla: ${p.textContent.slice(0, 70)}`).toBeGreaterThanOrEqual(1);
          }
          if (nWords >= 42) {
            expect(
              nStrong,
              `${clau}.${lang} paràgraf llarg (${nWords}w) fora de [6,8] (${nStrong}): ${p.textContent.slice(0, 75)}`,
            ).toBeGreaterThanOrEqual(6);
            expect(
              nStrong,
              `${clau}.${lang} paràgraf llarg (${nWords}w) fora de [6,8] (${nStrong}): ${p.textContent.slice(0, 75)}`,
            ).toBeLessThanOrEqual(8);
          }
        }

        const complet = [loc.title, loc.subtitle, loc.lead, doc.body.textContent].join(' ');
        expect(complet, `${clau}.${lang} Llei 32`).not.toMatch(PATRO_LLEI_32);
        expect(complet, `${clau}.${lang} zero sobirania`).not.toMatch(PATRO_SOBIRANIA);
        expect(complet, `${clau}.${lang} Regla «de poble»`).not.toMatch(PATRO_GENERIC_DEL_POBLE);

        if (lang === 'ca') {
          expect(doc.body.textContent, `${clau}.ca utilitza vs usa`).not.toMatch(/\b(?:usa|usen|usar|usant)\b/iu);
        }

        if (['projecte', 'anima', 'fedivers'].includes(clau)) {
          expect(nomenaPlataformaAliena(loc.html), `${clau}.${lang} Regla 2.3.10`).toBe(false);
          expect(paginaPerAppNativa(loc).html).toBe(loc.html);
        }
      }

      const aparador = htmlAparadorR20(lang);
      expect(aparador).not.toMatch(PATRO_SOBIRANIA);
      if (lang === 'es' || lang === 'gl') {
        expect(aparador).not.toMatch(/\bno(?:n)? usa modelos\b/iu);
      }
    },
  );

  test('Llei 9 · els blocs de botons de /projecte i /descarregues van dins dels contenidors centrats canònics (.sdp-pagina-accio i .sdp-accions)', () => {
    for (const lang of LLENGUES) {
      const docProj = parseja(localitzaPagina(PAGE_COPY.projecte, lang, 'projecte').html);
      const botoProj = docProj.querySelector('.sdp-pagina-accio > a.sdp-boto.sdp-boto--primari.sdp-boto--gran.sdp-boto--ple');
      expect(botoProj, `projecte.${lang} botó final centrat`).not.toBeNull();
      expect(botoProj.getAttribute('href')).toBe('/wikidepoble?item=el_projecte');

      const docDesc = parseja(localitzaPagina(PAGE_COPY.descarregues, lang, 'descarregues').html);
      const botoDesc = docDesc.querySelector('.sdp-accions > a.sdp-boto.sdp-boto--marca.sdp-boto--apple.sdp-boto--gran');
      expect(botoDesc, `descarregues.${lang} botó App Store centrat`).not.toBeNull();
      expect(botoDesc.getAttribute('href')).toBe('https://apps.apple.com/es/app/soc-de-poble/id6826441844');
    }
  });
});
