import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { PAGE_COPY } from './pageContent.js';
import { localitzaPagina } from './pageContent.r10.js';
import { nomenaPlataformaAliena, paginaPerAppNativa } from './perAppNativa.js';
import { sanitizeHtml } from '../../utils/sanitize.js';

const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
const PAGINES_ARQUITECTURA = ['projecte', 'disseny', 'node-zero', 'fediversity'];
const MODELS_8_ESCOLES = [
  'deepseek-r1:14b',
  'qwen2.5-coder:14b',
  'phi4:14b',
  'mistral-nemo:12b',
  'gemma3:12b',
  'glm4:9b',
  'iaia-maria:latest',
  'hermes3:8b',
];

const PATRO_PROHIBIT_LLEI_32 =
  /\b(?:servidor|serveis)\s+del\s+poble\b|\b(?:servidor|servicios)\s+del\s+pueblo\b|\bvillage\s+(?:server|services)\b|\bherriko\s+zerbitz(?:ari|u)\w*\b|\b(?:servidor|servizos)\s+da\s+(?:vila|aldea)\b/iu;

const MOSTRAR_AL_MUR = {
  ca: 'Mostrar també al Mur',
  es: 'Mostrar también en el Muro',
  en: 'Also show on the Wall',
  eu: 'Erakutsi Horman ere',
  gl: 'Mostrar tamén no Muro',
};

const AMAGA_EL_LLOC = {
  ca: 'Amaga el lloc',
  es: 'Ocultar el lugar',
  en: 'Hide place',
  eu: 'Ezkutatu lekua',
  gl: 'Agochar o lugar',
};

/* v1.2.9 (integració) · El sintagma canònic és «servidor de Sóc de Poble»: l'article es contrau amb la
   preposició segons la gramàtica (ca «al / del / pel servidor», es «al / del servidor»), i exigir «el
   servidor» literal obligava a escriure «a el servidor». La prohibició de «servidor del poble» no canvia. */
const LLEI_32_SERVIDOR_O_SERVEIS = {
  ca: ['servidor de Sóc de Poble', 'serveis de Sóc de Poble'],
  es: ['servidor de Sóc de Poble', 'servicios de Sóc de Poble'],
  en: ['the Sóc de Poble server', 'Sóc de Poble services'],
  eu: ['Sóc de Pobleren zerbitzari', 'Sóc de Pobleren zerbitzu'],
  gl: ['o servidor de Sóc de Poble', 'servizos de Sóc de Poble'],
};

const textPla = (html) =>
  new DOMParser().parseFromString(sanitizeHtml(html), 'text/html').body.textContent.replace(/\s+/g, ' ').trim();

describe('Onada R32.10 · Lot 04 · Coherència Editorial Viva en 5 llengües i Llei 32', () => {
  test.each(LLENGUES)(
    '%s · /projecte, /disseny, /page/node-zero i /page/fediversity expliquen Llibre Viu Wiki ↔ Mur, columnes plegades, avís d’1 toc, Amaga el lloc, 8 escoles i Llei 32',
    (lang) => {
      for (const clau of PAGINES_ARQUITECTURA) {
        const loc = localitzaPagina(PAGE_COPY[clau], lang, clau);
        expect(loc.contentLanguage, `${clau}.${lang}`).toBe(lang);
        expect(loc.title.length, `${clau}.${lang} title`).toBeGreaterThan(3);
        expect(loc.subtitle.length, `${clau}.${lang} subtitle`).toBeGreaterThan(5);
        expect(loc.lead.length, `${clau}.${lang} lead`).toBeGreaterThan(20);

        const complet = [loc.title, loc.subtitle, loc.lead, textPla(loc.html)].join(' ');

        // 1. Llibre Viu Wiki ↔ Mur + opció d'edició avançada
        expect(complet, `${clau}.${lang} -> Mostrar al Mur`).toContain(MOSTRAR_AL_MUR[lang]);
        expect(loc.html, `${clau}.${lang} -> enllaç /wikidepoble`).toContain('href="/wikidepoble"');
        expect(loc.html, `${clau}.${lang} -> enllaç /mur`).toContain('href="/mur"');

        // 2. Columnes plegades persistents (enllaços als espais en columnes)
        expect(loc.html, `${clau}.${lang} -> enllaç /notes`).toContain('href="/notes"');
        expect(loc.html, `${clau}.${lang} -> enllaç /perfil`).toContain('href="/perfil"');

        // 3. Geolocalització rural amb «Amaga el lloc»
        expect(complet, `${clau}.${lang} -> Amaga el lloc`).toContain(AMAGA_EL_LLOC[lang]);

        // 4. Llei 32: el servidor de Sóc de Poble + els serveis de Sóc de Poble, i ZERO «servidor/serveis del poble»
        for (const sintagma of LLEI_32_SERVIDOR_O_SERVEIS[lang]) {
          expect(complet, `${clau}.${lang} -> Llei 32 «${sintagma}»`).toContain(sintagma);
        }
        expect(complet, `${clau}.${lang} -> zero violació Llei 32`).not.toMatch(PATRO_PROHIBIT_LLEI_32);

        // 5. Regla 2.3.10 d'App Store: cap pèrdua ni menció de plataforma mòbil aliena en el cos nou
        if (clau !== 'fediversity') {
          expect(nomenaPlataformaAliena(loc.html), `${clau}.${lang} sense plataforma aliena`).toBe(false);
          expect(paginaPerAppNativa(loc).html).toBe(loc.html);
        }
      }

      // Les 8 escoles locals explícites al Node 0 en les 5 llengües
      const nodeZeroText = textPla(localitzaPagina(PAGE_COPY['node-zero'], lang, 'node-zero').html);
      for (const model of MODELS_8_ESCOLES) {
        expect(nodeZeroText, `node-zero.${lang} -> ${model}`).toContain(model);
      }
    },
  );

  test('Llei 32 · /fedivers i VistaBotiguesSistema usen «els serveis de Sóc de Poble» en les 5 llengües', () => {
    for (const lang of LLENGUES) {
      const fedivers = localitzaPagina(PAGE_COPY.fedivers, lang, 'fedivers');
      const complet = [fedivers.title, fedivers.subtitle, fedivers.lead, textPla(fedivers.html)].join(' ');
      expect(complet, `fedivers.${lang}`).not.toMatch(PATRO_PROHIBIT_LLEI_32);
    }

    /* Onada v1.2.9 (costura Gemini R32.10 lot 04 ↔ R32.11 lot 04) · Els textos de la vista viuen ara al diccionari de cinc
       llengües i18nBotiguesSistema.js, que VistaBotiguesSistema.jsx importa: la Llei 32 es llig a tots dos fitxers. */
    const vistaBotigues = ['VistaBotiguesSistema.jsx', 'i18nBotiguesSistema.js']
      .map((nom) => readFileSync(path.join(process.cwd(), 'src/sections/botigues', nom), 'utf8')).join('\n');
    expect(vistaBotigues).toContain("import { textosBotiguesSistema } from './i18nBotiguesSistema.js';");
    const i18nBotigues = readFileSync(path.join(process.cwd(), 'src/sections/botigues/i18nBotiguesSistema.js'), 'utf8');
    const metaBotigues = readFileSync(path.join(process.cwd(), 'src/sections/botigues/botiguesSistemaMeta.js'), 'utf8');
    expect(`${vistaBotigues}\n${i18nBotigues}`).toContain('els serveis de Sóc de Poble');
    expect(vistaBotigues).not.toMatch(PATRO_PROHIBIT_LLEI_32);
    expect(i18nBotigues).not.toMatch(PATRO_PROHIBIT_LLEI_32);
    expect(metaBotigues).toContain('serveis de Sóc de Poble');
    expect(metaBotigues).not.toMatch(PATRO_PROHIBIT_LLEI_32);
  });
});
