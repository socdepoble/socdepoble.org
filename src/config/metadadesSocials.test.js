/* Pla 261028_1526 (P1-61, Fase 2) · Les metadades socials compartides pel
   client i el prerender (metadadesSocials.js): el text pla, la regla de les
   pàgines (lead-first, decisió per defecte D6) i la dels detalls de llavor,
   comparada amb la de veres del detall (detailSectionMeta.jsx i
   paginaDElement). Si divergiren, el head servit d'una ruta i el de l'app no
   dirien el mateix. */
import { describe, expect, test } from 'vitest';
import { CAP_SOCIAL_BASE, VARIANTS_SOCIALS } from './imatgeSocial.js';
import { LIMIT_DESCRIPCIO, metadadesDeDetall, metadadesDePagina, SECCIONS_DE_DETALL, textPla } from './metadadesSocials.js';
import { PAGE_COPY } from '../sections/text/pageContent.js';
import { MOCK_MARKET_ITEMS } from '../sections/mercat/marketSeed.js';
import { CALENDAR_EVENTS } from '../sections/mur/eventsSeed.js';
import { MOCK_TOWNS } from '../sections/pobles/townsSeed.js';
import {
  buildEventsDetailSectionMeta, buildMercatDetailSectionMeta, buildPoblesDetailSectionMeta
} from '../sections/detail/detailSectionMeta.jsx';
import { paginaDElement } from '../sections/detail/elementDeSeccio.js';

const OPCIONS = Object.freeze({ origen: 'https://socdepoble.org', permesos: [] });

describe('textPla', () => {
  test('sense HTML, scripts, enllaços, èmfasi, entitats ni controls; un sol espai', () => {
    expect(textPla('<p>Hola <strong>món</strong></p><script>alert(1)</script>')).toBe('Hola món');
    expect(textPla('Un **text** amb [enllaç](https://x.test) i [[nota|àlies]] i `codi`')).toBe('Un text amb enllaç i àlies i codi');
    expect(textPla('A &amp; B &lt;i&gt; &#39;c&#39;\u0007\n\n  d')).toBe("A & B <i> 'c' d");
    expect(textPla(null)).toBe('');
  });
  test('retalla per unitats UTF-16 sense partir cap emoji ni deixar cap espai final, i és idempotent', () => {
    expect(textPla('🙂'.repeat(160), 160)).toHaveLength(160);
    expect(textPla(`a${'🙂'.repeat(10)}`, 4)).toBe('a🙂');
    expect(textPla('abc def', 4)).toBe('abc');
    for (const pagina of Object.values(PAGE_COPY)) {
      for (const valor of [pagina.title, pagina.lead, pagina.subtitle]) {
        const una = textPla(valor, LIMIT_DESCRIPCIO);
        expect(textPla(una, LIMIT_DESCRIPCIO)).toBe(una);
      }
    }
  });
  /* Revisió adversarial (261028) · Les marques només se'n van a la vora d'una
     paraula: dins d'una paraula són text. */
  test.each([
    ['doc_to_app', 'doc_to_app'],
    ['created_at i 02_saber', 'created_at i 02_saber'],
    ['aammdd_hhmm_categoria_titol.ext', 'aammdd_hhmm_categoria_titol.ext'],
    ['doc__to', 'doc__to'],
    ['2*3 i a~b', '2*3 i a~b'],
    ['**negreta** i _cursiva_, ~~ratllat~~.', 'negreta i cursiva, ratllat.'],
    ['__init__ i *_mescla_*', 'init i mescla'],
    ['adéu_àvia ŀl_ç', 'adéu_àvia ŀl_ç'],
    ['𝐀_𝐁', '𝐀_𝐁'],
    ['🙂_🙂 i a_ b', '🙂🙂 i a b'],
    ['`codi`a`b`', 'codiab']
  ])('textPla(%j) = %j', (entrada, eixida) => {
    expect(textPla(entrada)).toBe(eixida);
    expect(textPla(eixida)).toBe(eixida);
  });
  test('el tall no deixa cap marca solta al final i continua sent idempotent', () => {
    expect(textPla('abc_def', 4)).toBe('abc');
    expect(textPla('abc__def', 5)).toBe('abc');
    expect(textPla('abc_def', 5)).toBe('abc_d');
    for (let limit = 1; limit <= 24; limit += 1) {
      const una = textPla('personalitat_iaia agents_equip_ia', limit);
      expect(textPla(una, limit)).toBe(una);
      expect(una).not.toMatch(/[*_~]$/);
    }
  });
  test('una tirada molt llarga de marques és lineal', () => {
    const inici = performance.now();
    expect(textPla(`a${'_'.repeat(200000)}b`, 10)).toBe('a');
    expect(textPla(`${'a_'.repeat(100000)}`, 6)).toBe('a_a_a');
    expect(performance.now() - inici).toBeLessThan(2000);
  });
});

describe('metadadesDePagina', () => {
  test('lead-first: l’entradeta i, sense, el subtítol; sense cap, la genèrica', () => {
    expect(metadadesDePagina({ title: 'T', lead: 'Entradeta', subtitle: 'Subtítol' }, OPCIONS).description).toBe('Entradeta');
    expect(metadadesDePagina({ title: 'T', subtitle: 'Subtítol' }, OPCIONS).description).toBe('Subtítol');
    expect(metadadesDePagina({ title: 'T' }, OPCIONS).description).toBe(CAP_SOCIAL_BASE.description);
    expect(metadadesDePagina(PAGE_COPY.anima, OPCIONS).description).toBe(PAGE_COPY.anima.lead);
  });
  test('la imatge de la portada porta el seu imageAlt; una del cos, el títol; cap, null', () => {
    const anima = metadadesDePagina(PAGE_COPY.anima, OPCIONS);
    expect(anima.imatge.estat).toBe('triada');
    // R-01 (pla 261029_0216) · La il·lustració de /anima és WebP i pesa més de 300 KB: al <head> va la seua variant social; l'alt, el de la portada.
    expect(anima.imatge.ref).toBe(PAGE_COPY.anima.image);
    expect(anima.image).toEqual({ url: `https://socdepoble.org${VARIANTS_SOCIALS[PAGE_COPY.anima.image]}`, alt: PAGE_COPY.anima.imageAlt });
    const delCos = metadadesDePagina({ title: 'Del cos', html: '<p><img src="/assets/x.jpg" alt="x"></p>' }, OPCIONS);
    expect(delCos.image).toEqual({ url: 'https://socdepoble.org/assets/x.jpg', alt: 'Del cos' });
    const sense = metadadesDePagina({ title: 'Sense', html: '<p>Res</p>' }, OPCIONS);
    expect([sense.imatge.estat, sense.image]).toEqual(['absent', null]);
  });
  test('una primera imatge que no es pot servir (SVG) és bloquejada: cap imatge al head, i el prerender en fa porta roja', () => {
    const svg = metadadesDePagina({ title: 'SVG', image: '/assets/x.svg' }, OPCIONS);
    expect([svg.imatge.estat, svg.image]).toEqual(['bloquejada', null]);
  });
});

describe('metadadesDeDetall · paritat amb el detall de veres (ItemDetailSection)', () => {
  const t = (_clau, valor) => valor;
  const SECCIONS = {
    mercat: [buildMercatDetailSectionMeta({ marketItems: MOCK_MARKET_ITEMS, t }), MOCK_MARKET_ITEMS],
    events: [buildEventsDetailSectionMeta({ events: CALENDAR_EVENTS, t }), CALENDAR_EVENTS],
    pobles: [buildPoblesDetailSectionMeta({ towns: MOCK_TOWNS, t }), MOCK_TOWNS]
  };
  test('les tres seccions amb llavor al repositori, i cap més', () => {
    expect([...SECCIONS_DE_DETALL].sort()).toEqual(Object.keys(SECCIONS).sort());
    expect(metadadesDeDetall('mur', { title: 'x' }, OPCIONS)).toBeNull();
    expect(metadadesDeDetall('constructor', { title: 'x' }, OPCIONS)).toBeNull();
  });
  test.each(Object.keys(SECCIONS))('%s: el títol i la descripció del <head> d’ItemDetailSection, en text pla', (seccio) => {
    const [section, items] = SECCIONS[seccio];
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      const pagina = paginaDElement(section, item);
      const metadades = metadadesDeDetall(seccio, item, OPCIONS);
      expect(metadades.title, item.id).toBe(textPla(section.getTitle(item), 160));
      expect(metadades.description, item.id).toBe(textPla(pagina.lead || section.getSubtitle(item), LIMIT_DESCRIPCIO) || CAP_SOCIAL_BASE.description);
      if (metadades.image) expect(metadades.image.alt, item.id).toBe(textPla(pagina.heroAlt, 160));
    }
  });
  test('la samarreta porta la primera foto de la galeria (01-chica-jersey), mai el logotip ni el perfil', () => {
    const samarreta = MOCK_MARKET_ITEMS.find((item) => item.id === 'samarreta-socdepoble');
    const { image } = metadadesDeDetall('mercat', samarreta, OPCIONS);
    // R-01 (pla 261029_0216) · Al <head> va la variant social de la xica; la portada que es pinta continua sent el .png.
    expect(image.url).toBe('https://socdepoble.org/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/01-chica-jersey-social-1200x630.jpg');
    expect(image.url).not.toMatch(/logo|perfil/);
  });
});
