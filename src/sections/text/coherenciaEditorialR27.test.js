import { describe, expect, test } from 'vitest';
import { PAGE_COPY } from './pageContent.js';
import { localitzaPagina } from './pageContent.r10.js';
import { APARADOR_R20_TEXTS, htmlAparadorR20 } from './pageContent.fediversityR20.js';
import { LA_VEU_DE_SOC_DE_POBLE_COPY } from '../mur/articles/laVeuDeSocDePobleContent.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';

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

/* Onada R28 · veu-editorial-01 (opció b) i 09 (revisió adversarial) · L'apartat 5 de La Veu diu el que
   fa el codi: la barra inferior l'obrin «Escolta la IAIA» (PageFrame) i «Tria esta veu» (banc de veus,
   obriReproductor del context); l'opció del menú Traduir llig la pàgina sencera d'una tirada
   (useTraduccioPagina · alternaLecturaVeu) i no l'obri. Cada etiqueta citada és la de la interfície. */
const DICCIONARIS = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };
const RE_EMOJI_INICIAL = /^\p{Extended_Pictographic}️?\s*/u;
const etiqueta = (lang, clau) => String(DICCIONARIS[lang][clau] ?? '').replace(RE_EMOJI_INICIAL, '').trim();
const NO_OBRI_LA_BARRA = {
  ca: 'no obri la barra',
  es: 'no abre la barra',
  en: 'does not open the bar',
  eu: 'ez du barra irekitzen',
  gl: 'non abre a barra',
};

const apartat5DeLaVeu = (lang) => {
  const parsed = doc(LA_VEU_DE_SOC_DE_POBLE_COPY[lang].html);
  const titol = [...parsed.querySelectorAll('h3')].find((h3) => h3.textContent.trim().startsWith('5.'));
  let paragraf = titol?.nextElementSibling || null;
  while (paragraf && paragraf.tagName !== 'P') paragraf = paragraf.nextElementSibling;
  return { titol, paragraf };
};

describe('Onada R28 · La Veu, apartat 5: qui obri la barra i què fa el menú Traduir (Llei 0)', () => {
  test.each(LLENGUES)('%s · les etiquetes citades són les de la interfície i el menú Traduir no promet la barra', (lang) => {
    const { titol, paragraf } = apartat5DeLaVeu(lang);
    expect(titol, `${lang}: falta l’apartat 5`).toBeTruthy();
    expect(paragraf, `${lang}: falta el paràgraf de l’apartat 5`).toBeTruthy();
    const destacats = [...paragraf.querySelectorAll('strong')].map((el) => el.textContent.trim());
    const cita = (clau) => {
      const text = etiqueta(lang, clau);
      expect(text, `${lang}: ${clau} absent del diccionari`).toBeTruthy();
      return lang === 'en' ? `“${text}”` : `«${text}»`;
    };
    const escolta = cita('common.veuIaiaEscolta');
    const triaVeu = cita('patrimoni.bancVeus.triaVeu');
    const escoltaPagina = cita('section.traduir.escoltarPagina');
    const aturaLectura = cita('section.traduir.aturarLectura');
    const menuTraduir = etiqueta(lang, 'pagina.barra.traduir');
    for (const esperat of [escolta, triaVeu, escoltaPagina, aturaLectura, menuTraduir]) {
      expect(destacats, `${lang}: ${esperat}`).toContain(esperat);
    }

    const frases = paragraf.textContent.replace(/\s+/g, ' ').split(/(?<=\.)\s+/);
    /* La frase que obri la barra nomena els dos botons que l'obrin, i no el menú Traduir. */
    const fraseBarra = frases.find((frase) => frase.includes(escolta));
    expect(fraseBarra).toContain(triaVeu);
    expect(fraseBarra).not.toContain(escoltaPagina);
    /* La frase de l'opció del menú diu que no obri la barra i com es para. */
    const fraseMenu = frases.find((frase) => frase.includes(escoltaPagina));
    expect(fraseMenu).toContain(NO_OBRI_LA_BARRA[lang]);
    expect(fraseMenu).toContain(menuTraduir);
    expect(fraseMenu).toContain(aturaLectura);
  });

  test('eu · el nom del reproductor és el de les claus de la interfície (erreproduzigailu)', () => {
    expect(EU['veu.reproductor.regio']).toMatch(/erreproduzigailu/);
    const { titol } = apartat5DeLaVeu('eu');
    expect(titol.textContent).toMatch(/erreproduzigailu/);
    expect(LA_VEU_DE_SOC_DE_POBLE_COPY.eu.html).not.toMatch(/erreproduzitzaile/);
  });
});
