import { describe, expect, test } from 'vitest';
import { PAGE_COPY } from './pageContent.js';
import { localitzaPagina } from './pageContent.r10.js';
import { APARADOR_R20_TEXTS, htmlAparadorR20 } from './pageContent.fediversityR20.js';
import { LA_VEU_DE_SOC_DE_POBLE_COPY } from '../mur/articles/laVeuDeSocDePobleContent.js';
import { sanitizeHtml } from '../../utils/sanitize.js';

const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
const TITOLS_NAVEGADOR_ESPERATS = {
  ca: "Com s'instal·la des del navegador",
  es: 'Cómo se instala desde el navegador',
  en: 'How to install from your browser',
  eu: 'Nola instalatzen da nabigatzailetik',
  gl: 'Como se instala desde o navegador',
};

const doc = (html) => new DOMParser().parseFromString(sanitizeHtml(html), 'text/html');

/* Onada R28 (revisió adversarial, P3) · Els títols diuen exactament el que comproven les assercions. */
describe('Onada R27 · Coherència Editorial Viva en les 5 llengües (ca, es, en, eu, gl)', () => {
  test.each(LLENGUES)('%s · /page/descarregues té paritat estructural 1:1 (6 h3, 8 h4, 3 subtargetes), guia de navegador localitzada, el botó de l’App Store dins de .sdp-accions i els tres enllaços externs', (lang) => {
    const pagina = localitzaPagina(PAGE_COPY.descarregues, lang);
    expect(pagina.contentLanguage ?? 'ca').toBe(lang);
    expect(pagina.title.length).toBeGreaterThan(5);
    expect(pagina.subtitle.length).toBeGreaterThan(5);
    expect(pagina.lead.length).toBeGreaterThan(20);

    const parsed = doc(pagina.html);
    expect(parsed.querySelectorAll('h1, h2')).toHaveLength(0);
    expect(parsed.querySelectorAll('h3')).toHaveLength(6);
    expect(parsed.querySelectorAll('h4')).toHaveLength(8);
    expect(parsed.querySelectorAll('div.sdp-subtargeta[data-sdp-subtargeta]')).toHaveLength(3);

    const h4Textos = [...parsed.querySelectorAll('h4')].map((el) => el.textContent);
    expect(h4Textos).toContain(TITOLS_NAVEGADOR_ESPERATS[lang]);

    const botoApple = parsed.querySelector('.sdp-accions > a.sdp-boto.sdp-boto--marca.sdp-boto--apple.sdp-boto--gran');
    expect(botoApple).not.toBeNull();
    expect(botoApple.getAttribute('href')).toBe('https://apps.apple.com/es/app/soc-de-poble/id6826441844');

    const hrefsExterns = [...parsed.querySelectorAll('a[href^="https://"]')].map((a) => a.getAttribute('href'));
    expect(hrefsExterns).toEqual([
      'https://play.google.com/apps/testing/org.socdepoble.app',
      'https://apps.apple.com/es/app/soc-de-poble/id6826441844',
      'https://wordpress.org/plugins/socdepoble/',
    ]);
  });

  test.each(LLENGUES)('%s · node-zero, fediversity, fedivers, la-iaia-sabuda i descarregues sense «Nodrir la IAIA» ni «Node 0 sobirà», l’aparador R20 sense «sobirà» i el Node 0 amb Matxa-TTS v2, PostgreSQL 17.11 i Supabase', (lang) => {
    for (const slug of ['node-zero', 'fediversity', 'fedivers', 'la-iaia-sabuda', 'descarregues']) {
      const pagina = localitzaPagina(PAGE_COPY[slug], lang);
      expect(pagina.contentLanguage ?? 'ca').toBe(lang);
      const brut = JSON.stringify({
        title: pagina.title,
        subtitle: pagina.subtitle,
        lead: pagina.lead,
        html: pagina.html,
      });
      expect(brut).not.toContain('nodrir-la-iaia');
      expect(brut).not.toMatch(/Nodrir la IAIA/i);
      expect(brut).not.toMatch(/Node 0 (?:Sobirà|Soberano|Burujabe)|Sovereign Node 0|Magatzem sobirà/i);
    }

    const aparador = htmlAparadorR20(lang);
    expect(aparador).not.toMatch(/sobir[aà]|soberan|sovereign|burujabe/i);
    expect(APARADOR_R20_TEXTS[lang].batec.length).toBeGreaterThan(5);

    const nodeZeroText = doc(localitzaPagina(PAGE_COPY['node-zero'], lang).html).body.textContent;
    expect(nodeZeroText).toContain('Matxa-TTS v2');
    expect(nodeZeroText).toContain('PostgreSQL 17.11');
    expect(nodeZeroText).toContain('Supabase');

    const veu = LA_VEU_DE_SOC_DE_POBLE_COPY[lang];
    expect(veu.html).toContain('https://socdepoble.cat/api/v1/node0/veu');
    expect(veu.html).not.toMatch(/mientras abrimos el túnel|while our Node 0 public voice tunnel/i);
  });
});
