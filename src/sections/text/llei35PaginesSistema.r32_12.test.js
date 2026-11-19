import { execFileSync } from 'node:child_process';
import { describe, expect, test } from 'vitest';
import { PAGE_COPY } from './pageContent.js';
import { localitzaPagina } from './pageContent.r10.js';
import { paginaPerAppNativa } from './perAppNativa.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { infraccionsT8 } from '../../../tests/helpers/lleiT8Prova.js';

const PAGINES_SISTEMA_R32_12 = Object.freeze(['projecte', 'constitucio', 'anima', 'roadmap', 'legal', 'fedivers']);
const PAGINES_5_LLENGUES = Object.freeze(['projecte', 'constitucio', 'fedivers']);
const LLENGUES = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

const PATRO_PROHIBIT_LLEI_32 = /\b(?:el\s+servidor\s+del\s+poble|els\s+serveis\s+del\s+poble|el\s+servidor\s+del\s+pueblo|los\s+servicios\s+del\s+pueblo|the\s+village\s+server|the\s+village\s+services|herriko\s+zerbitzaria|herriko\s+zerbitzuak|o\s+servidor\s+da\s+vila|os\s+servizos\s+da\s+vila)\b/i;

function docNet(html) {
  const senseComentaris = String(html || '').replace(/<!--[\s\S]*?-->/g, '');
  return new DOMParser().parseFromString(sanitizeHtml(senseComentaris), 'text/html');
}

describe('Onada R32.12 · Lot 02 · Llei 35 Pedra Seca 10/10, Llei 32 i certificació d’enllaços en pàgines de sistema', () => {
  test.each(PAGINES_SISTEMA_R32_12)('/%s té entradilla canònica, jerarquia h3 sense salts, negretes d’escaneig en cada <p> i Llei 32 = 0', (clau) => {
    const page = PAGE_COPY[clau];
    expect(page.title.trim().length).toBeGreaterThan(3);
    expect(page.subtitle.trim().length).toBeGreaterThan(5);
    expect(page.lead.trim().length).toBeGreaterThan(25);

    const doc = docNet(page.html);
    expect(doc.querySelector('h1, h2, script, iframe')).toBeNull();
    expect(doc.querySelector('h3')).not.toBeNull();

    const encapcalaments = [...doc.querySelectorAll('h3, h4, h5, h6')];
    encapcalaments.forEach((h, idx) => {
      const nivell = Number(h.tagName[1]);
      if (idx === 0) expect(nivell, `${clau} primer encapçalament`).toBe(3);
      else expect(nivell, `${clau} salt d'encapçalament a «${h.textContent}»`).toBeLessThanOrEqual(Number(encapcalaments[idx - 1].tagName[1]) + 1);
    });

    const paragrafs = [...doc.querySelectorAll('p')].filter((p) => !p.closest('.sdp-targetes') && p.textContent.trim().length > 0);
    expect(paragrafs.length).toBeGreaterThan(5);
    for (const p of paragrafs) {
      const nStrong = p.querySelectorAll('strong').length;
      expect(nStrong, `${clau} paràgraf sense negreta: ${p.textContent.slice(0, 70)}`).toBeGreaterThanOrEqual(1);
      if (clau !== 'legal') {
        const paraules = p.textContent.trim().split(/\s+/).length;
        if (paraules >= 28) {
          expect(nStrong, `${clau} paràgraf llarg amb massa poques negretes (${paraules}w): ${p.textContent.slice(0, 70)}`).toBeGreaterThanOrEqual(4);
        }
      }
    }

    const complet = [page.title, page.subtitle, page.lead, doc.body.textContent].join(' ');
    expect(complet).not.toMatch(PATRO_PROHIBIT_LLEI_32);
    expect(complet).not.toMatch(/\b(?:IAIA|Node\s*0)\s+sobir[àa]/i);
    if (clau !== 'legal') {
      expect(doc.body.textContent).not.toMatch(/\b(?:usa|usen|usar|usant)\b/i);
    }
  });

  test.each(LLENGUES)('paritat en %s per a /projecte, /constitucio i /fedivers amb escaneig Llei 35 i Llei 32 = 0', (lang) => {
    for (const clau of PAGINES_5_LLENGUES) {
      const loc = localitzaPagina(PAGE_COPY[clau], lang, clau);
      expect(loc.contentLanguage, `${clau}.${lang}`).toBe(lang);
      expect(loc.title.trim().length).toBeGreaterThan(3);
      expect(loc.subtitle.trim().length).toBeGreaterThan(5);
      expect(loc.lead.trim().length).toBeGreaterThan(25);

      const doc = docNet(loc.html);
      expect(doc.querySelector('h1, h2, script, iframe')).toBeNull();
      expect(doc.querySelector('h3')).not.toBeNull();

      const paragrafs = [...doc.querySelectorAll('p')].filter((p) => !p.closest('.sdp-targetes') && p.textContent.trim().length > 0);
      for (const p of paragrafs) {
        const paraules = p.textContent.trim().split(/\s+/).length;
        const nStrong = p.querySelectorAll('strong').length;
        expect(nStrong, `${clau}.${lang} paràgraf sense negreta`).toBeGreaterThanOrEqual(1);
        if (paraules >= 28) {
          expect(nStrong, `${clau}.${lang} paràgraf llarg (${paraules}w) amb menys de 4 negretes: ${p.textContent.slice(0, 70)}`).toBeGreaterThanOrEqual(4);
        }
      }

      const complet = [loc.title, loc.subtitle, loc.lead, doc.body.textContent].join(' ');
      expect(complet, `${clau}.${lang} Llei 32`).not.toMatch(PATRO_PROHIBIT_LLEI_32);

      if (clau === 'constitucio') {
        expect(infraccionsT8(loc.html), `constitucio.${lang} T8`).toEqual([]);
        expect(doc.querySelectorAll('h4')).toHaveLength(4);
        expect(doc.querySelectorAll('h5')).toHaveLength(15);
        for (const href of ['/projecte', '/page/node-zero', '/legal', '/disseny', '/wikidepoble']) {
          expect(loc.html, `constitucio.${lang} -> ${href}`).toContain(`href="${href}"`);
        }
        expect(paginaPerAppNativa(loc).html).toBe(loc.html);
      }
    }
  });

  test('tots els enllaços de /projecte, /constitucio, /anima, /roadmap, /legal i /fedivers en les 5 llengües passen certifica-enllacos contra l’arbre SPA', () => {
    const urls = new Set(PAGINES_SISTEMA_R32_12.map((c) => `/${c}`));
    for (const clau of PAGINES_SISTEMA_R32_12) {
      for (const lang of LLENGUES) {
        const loc = localitzaPagina(PAGE_COPY[clau], lang, clau);
        const html = String(loc.html || '');
        const doc = new DOMParser().parseFromString(html, 'text/html');
        for (const el of doc.querySelectorAll('[href], [data-ruta], [data-autor-ruta]')) {
          for (const attr of ['href', 'data-ruta', 'data-autor-ruta']) {
            const val = el.getAttribute(attr)?.trim();
            if (val && (/^https?:\/\//.test(val) || val.startsWith('/'))) {
              urls.add(val);
            }
          }
        }
      }
    }
    const cru = execFileSync(
      process.execPath,
      ['tooling/gates/certifica-enllacos.mjs', '--json', '--arrel', process.cwd(), ...urls],
      { cwd: process.cwd(), encoding: 'utf8' }
    );
    const informe = JSON.parse(cru);
    expect(informe.falles).toEqual([]);
    expect(informe.ok).toBe(true);
    expect(informe.total).toBeGreaterThanOrEqual(50);
  });
});
