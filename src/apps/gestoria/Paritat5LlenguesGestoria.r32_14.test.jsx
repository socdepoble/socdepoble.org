import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { ENTORN_OBERT, muntaPlataforma } from '../plataforma/__fixtures__/munta.jsx';
import { LLENGUES_APP } from '../plataforma/manifestApp.js';
import { creaRegistre } from '../plataforma/registreApps.js';
import manifestGestoria from './manifest.js';
import {
  TEXTOS_BUIT_GESTORIA,
  TEXTOS_PONT_GESTORIA
} from './AppGestoria.jsx';
import {
  TEXTOS_SECCIONS_GESTORIA,
  textosSeccionsGestoria
} from './i18nGestoria.js';
import {
  CADENES_GESTORIA,
  CODIS_IDIOMA_GESTORIA,
  PLANTILLES_GESTORIA,
  barallaGestoria,
  codiIdiomaGestoria,
  diaLlegibleGestoria,
  localeIdiomaGestoria,
  tg,
  tf
} from '../../sections/gestoria/i18nGestoria.js';
import { BARALLA_GESTORIA } from '../../sections/gestoria/aprendre/baralla.js';
import Facturacio from '../../sections/gestoria/facturar/Facturacio.jsx';
import { TEXTOS_FACTURACIO } from '../../sections/gestoria/facturar/nucli/textosFacturacio.js';
import { etiquetaBetaOberta, ETIQUETA_BETA_OBERTA } from '../../sections/gestoria/insigniaBetaOberta.js';
import { RouterProvider } from '../../app/contexts/RouterContext';
import { VistaHistoric } from '../../sections/gestoria/historic/Historic.jsx';
import { VistaFinestreta } from '../../sections/gestoria/finestreta/Finestreta.jsx';

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

/* Frases exclusivament valencianes que NO poden aparéixer quan la llengua és es, en, eu o gl. */
const FUITES_VALENCIANES = [
  'Qui porta esta gestoria?',
  'La teua realitat',
  'Cal aprovar el tractor',
  'Llegint les aprovacions dels tractors',
  'Tria els extractes del banc',
  'Prepara el full trimestral per a la gestoria a partir de la teua carpeta',
  'El que guardes en este cofre es desa xifrat',
  'Sense mirar res, intenta recordar la resposta.',
  'Estes dades van a cada factura com a emissor.',
  'Els teus papers d’identitat, llegits en este ordinador'
];

describe('Onada R32.14 · T2 (D03 · T3-UI-03) · Gestoria interna 100 % en les 5 llengües oficials (ca, es, en, eu, gl)', () => {
  test('el diccionari modular pur cobrix les 5 llengües sense buits i preserva el valencià intacte', () => {
    expect(CODIS_IDIOMA_GESTORIA).toEqual(LLENGUES_APP);
    expect(codiIdiomaGestoria('eu-ES')).toBe('eu');
    expect(codiIdiomaGestoria('gl-ES')).toBe('gl');
    expect(codiIdiomaGestoria('fr')).toBe('ca');
    expect(localeIdiomaGestoria('en')).toBe('en-GB');
    expect(etiquetaBetaOberta('ca')).toBe(ETIQUETA_BETA_OBERTA);

    const clausCadenes = Object.keys(CADENES_GESTORIA);
    expect(clausCadenes.length).toBeGreaterThan(250);
    for (const clau of clausCadenes) {
      expect(tg('ca', clau)).toBe(clau);
      for (const lang of ['es', 'en', 'eu', 'gl']) {
        const trad = tg(lang, clau);
        expect(typeof trad, `${lang}: ${clau}`).toBe('string');
        expect(trad.trim().length, `${lang}: ${clau}`).toBeGreaterThan(0);
      }
    }

    const clausPlantilles = Object.keys(PLANTILLES_GESTORIA.ca);
    for (const lang of LLENGUES_APP) {
      expect(Object.keys(PLANTILLES_GESTORIA[lang]).sort()).toEqual([...clausPlantilles].sort());
      expect(textosSeccionsGestoria(lang)).toBe(TEXTOS_SECCIONS_GESTORIA[lang]);
      expect(TEXTOS_PONT_GESTORIA[lang].aprendreTitol.trim()).not.toBe('');
      expect(TEXTOS_FACTURACIO[lang].pas1.trim()).not.toBe('');
      expect(TEXTOS_BUIT_GESTORIA[lang].noCompiladaTitol.trim()).not.toBe('');
      expect(diaLlegibleGestoria(Date.UTC(2026, 9, 14, 10, 0, 0), lang).trim()).not.toBe('');
      expect(tf(lang, 'analitzaTrimestre', 3, 2026).trim()).not.toBe('');
    }
  });

  test('la baralla Leitner d’Aprendre traduïx les 17 targetes en es, en, eu i gl mantenint id i versió', () => {
    expect(barallaGestoria(BARALLA_GESTORIA, 'ca')).toBe(BARALLA_GESTORIA);
    for (const lang of ['es', 'en', 'eu', 'gl']) {
      const b = barallaGestoria(BARALLA_GESTORIA, lang);
      expect(b.id).toBe(BARALLA_GESTORIA.id);
      expect(b.titol).not.toBe(BARALLA_GESTORIA.titol);
      expect(b.avis).not.toBe(BARALLA_GESTORIA.avis);
      expect(b.targetes).toHaveLength(BARALLA_GESTORIA.targetes.length);
      for (let i = 0; i < b.targetes.length; i += 1) {
        const orig = BARALLA_GESTORIA.targetes[i];
        const trad = b.targetes[i];
        expect(trad.id).toBe(orig.id);
        expect(trad.versio).toBe(orig.versio);
        for (const camp of ['titol', 'concepte', 'mnemotecnia', 'pregunta', 'resposta', 'explicacio']) {
          expect(trad[camp].trim().length, `${lang} ${orig.id}.${camp}`).toBeGreaterThan(0);
        }
      }
    }
  });

  test.each([
    ['ca', 'Tauler Central', 'La teua realitat', 'Quadre de comandament'],
    ['es', 'Tablero Central', 'Tu realidad', 'Cuadro de mando'],
    ['en', 'Central Dashboard', 'Your reality', 'Command deck'],
    ['eu', 'Aginte Mahai Nagusia', 'Zure errealitatea', 'Aginte-koadroa'],
    ['gl', 'Taboleiro Central', 'A túa realidade', 'Cadro de mando']
  ])('munta /app/gestoria/tauler i el Quadre de comandament en %s sense fuites d’idioma', async (lang, h1Esperat, blocEsperat, cabinaEsperada) => {
    const registre = creaRegistre({ internes: [manifestGestoria] });
    const { container } = muntaPlataforma('/app/gestoria/tauler', {
      registre,
      entorn: { ...ENTORN_OBERT, produccio: false },
      externalConfig: { language: lang }
    });
    expect(await screen.findByRole('heading', { level: 1, name: h1Esperat })).toBeTruthy();
    expect(await screen.findByRole('heading', { level: 3, name: blocEsperat })).toBeTruthy();

    const botoCabina = screen.getByRole('button', { name: cabinaEsperada });
    fireEvent.click(botoCabina);
    expect(await screen.findByRole('heading', { level: 3, name: cabinaEsperada })).toBeTruthy();

    if (lang !== 'ca') {
      for (const fuita of FUITES_VALENCIANES) {
        expect(container.textContent).not.toContain(fuita);
      }
    }
  });

  test.each([
    ['es', '/app/gestoria/full', 'Hoja trimestral', '1. Aprobación de los tractores'],
    ['en', '/app/gestoria/full', 'Quarterly sheet', '1. Tractor approvals'],
    ['eu', '/app/gestoria/full', 'Hiruhileko orria', '1. Traktoreen onespena'],
    ['gl', '/app/gestoria/full', 'Folla trimestral', '1. Aprobación dos tractores'],
    ['en', '/app/gestoria/escaner', 'Local Scanner', 'Tractor approval required'],
    ['eu', '/app/gestoria/escaner', 'Tokiko Eskanerra', 'Traktorea onartu behar da'],
    ['gl', '/app/gestoria/contactes', 'Contactos', 'En obras']
  ])('munta mòduls de ShellGestoria (%s · %s) traduïts i sense fuites valencianes', async (lang, ruta, h1Esperat, textEsperat) => {
    const registre = creaRegistre({ internes: [manifestGestoria] });
    const { container } = muntaPlataforma(ruta, {
      registre,
      entorn: { ...ENTORN_OBERT, produccio: false },
      externalConfig: { language: lang }
    });
    expect(await screen.findByRole('heading', { level: 1, name: h1Esperat })).toBeTruthy();
    expect((await screen.findAllByText(textEsperat)).length).toBeGreaterThan(0);
    for (const fuita of FUITES_VALENCIANES) {
      expect(container.textContent).not.toContain(fuita);
    }
  });

  test.each(['ca', 'es', 'en', 'eu', 'gl'])('munta Facturació, Aprendre, Històric i Finestreta en %s sense fuites valencianes', async (lang) => {
    const registre = creaRegistre({ internes: [manifestGestoria] });

    // 1a. Facturació per ruta (estat sense IndexedDB en jsdom: alerta localitzada)
    const rFactRuta = muntaPlataforma('/app/gestoria/facturacio', {
      registre,
      entorn: { ...ENTORN_OBERT, produccio: false },
      externalConfig: { language: lang }
    });
    expect(await screen.findByRole('heading', { level: 1, name: TEXTOS_PONT_GESTORIA[lang].facturacioTitol })).toBeTruthy();
    expect(await screen.findByText(TEXTOS_FACTURACIO[lang].errorTitol)).toBeTruthy();
    if (lang !== 'ca') {
      for (const fuita of FUITES_VALENCIANES) expect(rFactRuta.container.textContent).not.toContain(fuita);
      expect(rFactRuta.container.textContent).not.toContain('ací no es pot emetre cap factura');
    }
    cleanup();

    // 1b. Facturació amb port i perfil injectats: tots els 5 passos oberts i localitzats
    const rFact = render(
      <Facturacio
        idioma={lang}
        port={{ llig: async () => [] }}
        perfil={{ llig: async () => ({ config: null, llegat: null, copia: null }) }}
      />
    );
    expect(await screen.findByRole('heading', { level: 3, name: `1. ${TEXTOS_FACTURACIO[lang].pas1}` })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: `2. ${TEXTOS_FACTURACIO[lang].pas2}` })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: `3. ${TEXTOS_FACTURACIO[lang].pas3}` })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: `4. ${TEXTOS_FACTURACIO[lang].pas4}` })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: `5. ${TEXTOS_FACTURACIO[lang].pas5}` })).toBeTruthy();
    if (lang !== 'ca') {
      for (const fuita of FUITES_VALENCIANES) expect(rFact.container.textContent).not.toContain(fuita);
    }
    cleanup();

    // 2. Aprendre
    const rApr = muntaPlataforma('/app/gestoria/aprendre', {
      registre,
      entorn: { ...ENTORN_OBERT, produccio: false },
      externalConfig: { language: lang }
    });
    expect(await screen.findByRole('heading', { level: 1, name: TEXTOS_PONT_GESTORIA[lang].aprendreTitol })).toBeTruthy();
    expect(await screen.findByRole('button', { name: tg(lang, 'Mostra la imatge') })).toBeTruthy();
    if (lang !== 'ca') {
      for (const fuita of FUITES_VALENCIANES) expect(rApr.container.textContent).not.toContain(fuita);
    }
    cleanup();

    // 3. VistaHistoric i VistaFinestreta directes
    const rHist = render(
      <RouterProvider initialPath="/app/gestoria/historic">
        <VistaHistoric idioma={lang} />
      </RouterProvider>
    );
    expect(await screen.findByRole('heading', { level: 1, name: tg(lang, 'Històric i IA') })).toBeTruthy();
    if (lang !== 'ca') {
      for (const fuita of FUITES_VALENCIANES) expect(rHist.container.textContent).not.toContain(fuita);
    }
    cleanup();

    const rFin = render(
      <RouterProvider initialPath="/app/gestoria/identitat">
        <VistaFinestreta idioma={lang} />
      </RouterProvider>
    );
    expect(await screen.findByRole('heading', { level: 1, name: tg(lang, 'Identitat i Finestreta') })).toBeTruthy();
    if (lang !== 'ca') {
      for (const fuita of FUITES_VALENCIANES) expect(rFin.container.textContent).not.toContain(fuita);
    }
    cleanup();
  });
});
