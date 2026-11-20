/* Onada R32.15 · Lot 2 (D03) · Suite transversal de paritat 100 % en les 5
   llengües oficials (ca, es, en, eu, gl) de totes les micro-apps registrades
   i dels tres diccionaris diferits purs (i18nGenealogia, i18nLector, i18nSalut),
   amb verificació de Llei 32 i render en viu per rutes. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { ENTORN_OBERT, muntaPlataforma } from './__fixtures__/munta.jsx';
import { _reiniciaPreferencies } from './preferenciesApps.js';
import { MANIFESTS_INTERNS, creaRegistre } from './registreApps.js';
import manifestGenealogia from '../genealogia/manifest.js';
import AppGenealogia from '../genealogia/AppGenealogia.jsx';
import { TEXTOS_GENEALOGIA, VERSIO_AVIS as VERSIO_AVIS_GEN, t as tGen, textosGenealogia } from '../genealogia/i18nGenealogia.js';
import { creaMagatzemGenealogia, desaMeta as desaMetaGen } from '../genealogia/magatzem.js';
import manifestLector from '../lector/manifest.js';
import AppLector from '../lector/AppLector.jsx';
import {
  TEXTOS_LECTOR, dataCurtaLector, descripcioFontLector, textErrorCopiaLector,
  textMotiuPersonalLector, textosLector
} from '../lector/i18nLector.js';
import { creaFontNoticies } from '../lector/fontNoticies.js';
import { creaAdaptadorLlavor } from '../lector/llavor/fontLlavor.js';
import { creaMagatzemLector } from '../lector/magatzem.js';
import manifestSalut from '../salut/manifest.js';
import AppSalut from '../salut/AppSalut.jsx';
import {
  TEXTOS_SALUT, alertaSalutTraduida, apartatsGuiaSalut, avisSalutTraduit,
  entitatsSalutTraduites, etiquetaDataLlargaSalut, resumApuntSalut, textErrorSalut,
  textosSalut, valoracioSetmanalSalut
} from '../salut/i18nSalut.js';
import { REGLES } from '../salut/nucli/alertes.js';
import { creaMagatzemSalut, desaMeta as desaMetaSalut } from '../salut/magatzem.js';
import { TEXTOS_ERRORS_BAR, TEXTOS_UI_BAR } from '../bar/i18nBar.js';
import { TEXTOS_BUIT_NEVERA, TEXTOS_VISTA_NEVERA } from '../nevera/i18nNevera.js';
import { TEXTOS_BUIT_GESTORIA, TEXTOS_SECCIONS_GESTORIA } from '../gestoria/i18nGestoria.js';

const LLENGUES = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);
const ENTORN = Object.freeze({ ...ENTORN_OBERT, produccio: false });
const ARA = new Date(2026, 10, 19, 10, 0);

function cadenesDe(valor, acc = []) {
  if (typeof valor === 'string') {
    acc.push(valor);
    return acc;
  }
  if (typeof valor === 'function') {
    try {
      const mostra = valor('Mostra', '10:00', '100 %');
      if (typeof mostra === 'string') acc.push(mostra);
    } catch {
      /* funcions amb signatura específica es proven als tests dedicats */
    }
    return acc;
  }
  if (Array.isArray(valor)) {
    for (const item of valor) cadenesDe(item, acc);
    return acc;
  }
  if (valor && typeof valor === 'object') {
    for (const v of Object.values(valor)) cadenesDe(v, acc);
  }
  return acc;
}

beforeEach(() => {
  window.localStorage.clear();
  _reiniciaPreferencies();
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Coronació 100 % 5 llengües · manifests i diccionaris diferits (D03)', () => {
  test('totes les micro-apps internes declaren titol, entrades, grups i interruptors en ca, es, en, eu i gl', () => {
    expect(MANIFESTS_INTERNS.length).toBeGreaterThanOrEqual(6);
    for (const manifest of MANIFESTS_INTERNS) {
      for (const lang of LLENGUES) {
        expect(typeof manifest.titol?.[lang] === 'string' && manifest.titol[lang].trim().length > 0, `${manifest.id}.titol.${lang}`).toBe(true);
        for (const entrada of manifest.entrades || []) {
          expect(typeof entrada.titol?.[lang] === 'string' && entrada.titol[lang].trim().length > 0, `${manifest.id}.entrada.${entrada.slug}.${lang}`).toBe(true);
        }
        for (const grup of manifest.grups || []) {
          expect(typeof grup.titol?.[lang] === 'string' && grup.titol[lang].trim().length > 0, `${manifest.id}.grup.${grup.id}.${lang}`).toBe(true);
        }
        for (const int of manifest.interruptors || []) {
          expect(typeof int.titol?.[lang] === 'string' && int.titol[lang].trim().length > 0, `${manifest.id}.interruptor.${int.id}.${lang}`).toBe(true);
        }
      }
    }
  });

  test('i18nGenealogia, i18nLector, i18nSalut, i18nBar, i18nNevera i i18nGestoria tenen simetria de claus en les 5 llengües', () => {
    for (const [nom, taula, minClaus] of [
      ['i18nGenealogia', TEXTOS_GENEALOGIA, 100],
      ['i18nLector', TEXTOS_LECTOR, 40],
      ['i18nSalut', TEXTOS_SALUT, 15],
      ['i18nBar.ui', TEXTOS_UI_BAR, 100],
      ['i18nBar.errors', TEXTOS_ERRORS_BAR, 20],
      ['i18nNevera.vista', TEXTOS_VISTA_NEVERA, 100],
      ['i18nNevera.buit', TEXTOS_BUIT_NEVERA, 20],
      ['i18nGestoria.buit', TEXTOS_BUIT_GESTORIA, 5],
      ['i18nGestoria.seccions', TEXTOS_SECCIONS_GESTORIA, 10],
    ]) {
      const clausBase = Object.keys(taula.ca).sort();
      expect(clausBase.length, nom).toBeGreaterThanOrEqual(minClaus);
      for (const lang of LLENGUES) {
        expect(Object.keys(taula[lang]).sort(), `${nom}.${lang}`).toEqual(clausBase);
      }
    }
    expect(textosGenealogia('gl')['app.titol']).toBe(tGen('gl', 'app.titol'));
  });

  test('Llei 32 i vocabulari net: cap menció impròpia ni «sobirà/sobirana» als diccionaris de les micro-apps', () => {
    const servidorImpropi = new RegExp([
      'servidor del poble', 'servidor del pueblo', 'village server', 'herriko zerbitzari', 'servidor da vila'
    ].join('|'), 'i');
    const sobira = new RegExp(['\\b(?:sobi', 'r[àa]|sobi', 'rans?|sobi', 'ranes|sobe', 'ran[oa]s?|sovere', 'ign|subira', 'no[ak]?)\\b'].join(''), 'i');

    const totesLesCadenes = [
      ...cadenesDe(TEXTOS_GENEALOGIA),
      ...cadenesDe(TEXTOS_LECTOR),
      ...cadenesDe(TEXTOS_SALUT),
      ...cadenesDe(TEXTOS_UI_BAR),
      ...cadenesDe(TEXTOS_ERRORS_BAR),
      ...cadenesDe(TEXTOS_VISTA_NEVERA),
      ...cadenesDe(TEXTOS_BUIT_NEVERA),
      ...cadenesDe(TEXTOS_BUIT_GESTORIA),
      ...cadenesDe(TEXTOS_SECCIONS_GESTORIA),
      ...LLENGUES.flatMap((lang) => [
        ...cadenesDe(avisSalutTraduit(lang)),
        ...cadenesDe(apartatsGuiaSalut(lang)),
        ...cadenesDe(entitatsSalutTraduites(lang)),
        ...REGLES.flatMap((r) => cadenesDe(alertaSalutTraduida(r, lang))),
      ]),
    ];
    expect(totesLesCadenes.length).toBeGreaterThan(2500);
    for (const frase of totesLesCadenes) {
      expect(servidorImpropi.test(frase), frase).toBe(false);
      expect(sobira.test(frase), frase).toBe(false);
    }
  });
});

describe('Render en viu en les 5 llengües · Genealogia, Lector i Salut', () => {
  test.each([
    ['ca', 'Entesos', 'Els teus arbres'],
    ['es', 'Entendido', 'Tus árboles'],
    ['en', 'Understood', 'Your trees'],
    ['eu', 'Ulertuta', 'Zure zuhaitzak'],
    ['gl', 'Entendido', 'As túas árbores'],
  ])('Genealogia renderitza avís i entrevista en %s', async (lang, botoAvis, colEsquerra) => {
    const magatzem = creaMagatzemGenealogia({ idb: null, navegador: null, Canal: null, anyActual: 2026 });
    const App = () => <AppGenealogia magatzem={magatzem} rellotge={() => ARA} />;
    muntaPlataforma('/app/genealogia/entrevista', {
      registre: creaRegistre({ internes: [{ ...manifestGenealogia, carrega: () => Promise.resolve({ default: App }) }] }),
      entorn: ENTORN,
      externalConfig: { language: lang },
    });
    const boto = await screen.findByRole('button', { name: botoAvis });
    expect(screen.getAllByText(colEsquerra).length).toBeGreaterThan(0);
    fireEvent.click(boto);
    await waitFor(() => expect(screen.getByTestId('ubicacio').textContent).toBe('/app/genealogia/entrevista'));
    expect(await screen.findByRole('heading', { level: 3 })).toBeTruthy();
    await desaMetaGen(magatzem, 'avis', { acceptatA: ARA.toISOString(), versio: VERSIO_AVIS_GEN });
  });

  test.each([
    ['ca', 'Hui', 'Gestiona les fonts', '3 d’octubre'],
    ['es', 'Hoy', 'Gestionar fuentes', '3 de octubre'],
    ['en', 'Today', 'Manage sources', '3 October'],
    ['eu', 'Gaur', 'Kudeatu iturriak', 'urriak 3'],
    ['gl', 'Hoxe', 'Xestionar as fontes', '3 de outubro'],
  ])('Lector renderitza espai, gestió de fonts i helpers en %s', async (lang, carpetaHui, botoGestio, dataEsperada) => {
    const magatzem = creaMagatzemLector({ idb: null, navegador: null, Canal: null });
    const font = creaFontNoticies(creaAdaptadorLlavor({ ara: ARA.getTime() }));
    const App = () => <AppLector magatzem={magatzem} font={font} ara={() => ARA.getTime()} />;
    muntaPlataforma('/app/lector/noticies/hui', {
      registre: creaRegistre({ internes: [{ ...manifestLector, carrega: () => Promise.resolve({ default: App }) }] }),
      entorn: ENTORN,
      externalConfig: { language: lang },
    });
    expect((await screen.findAllByText(carpetaHui)).length).toBeGreaterThan(0);
    const obriGestio = await screen.findByRole('button', { name: botoGestio });
    fireEvent.click(obriGestio);
    expect(await screen.findByRole('dialog', { name: textosLector(lang).gestionaLesFontsTitol })).toBeTruthy();
    expect(dataCurtaLector('2026-10-03T09:00:00.000Z', ARA.getTime(), 0, lang)).toBe(dataEsperada);
    expect(textMotiuPersonalLector({ codi: 'repetida' }, lang)).toBe(textosLector(lang).motiusPersonal.repetida);
    expect(textErrorCopiaLector({ codi: 'COPIA_INVALIDA' }, lang)).toBe(textosLector(lang).errorsCopia.COPIA_INVALIDA);
    expect(descripcioFontLector({ descripcio: 'Una font que has afegit tu.' }, lang)).toBe(textosLector(lang).descripcioFontPersonal);
  });

  test.each([
    ['ca', 'Ho he entés', 'Ha orinat', 'Com fer el diari de 3 dies'],
    ['es', 'Lo he entendido', 'Ha orinado', 'Cómo hacer el diario de 3 días'],
    ['en', 'I understand', 'Bathroom visit', 'How to keep a 3-day diary'],
    ['eu', 'Ulertu dut', 'Pixa egin du', 'Nola egin 3 eguneko egunkaria'],
    ['gl', 'Entendino', 'Ouriñou', 'Como facer o diario de 3 días'],
  ])('Salut renderitza avís, botonera, diccionari i guia en %s', async (lang, botoAvis, botoMiccio, titolGuia) => {
    const magatzem = creaMagatzemSalut({ idb: null, navegador: null, Canal: null });
    const App = () => <AppSalut magatzem={magatzem} rellotge={() => ARA} ofsetDe={() => 60} />;
    muntaPlataforma('/app/salut/diari', {
      registre: creaRegistre({ internes: [{ ...manifestSalut, carrega: () => Promise.resolve({ default: App }) }] }),
      entorn: ENTORN,
      externalConfig: { language: lang },
    });
    const accepta = await screen.findByRole('button', { name: botoAvis });
    fireEvent.click(accepta);
    expect(await screen.findByRole('button', { name: botoMiccio })).toBeTruthy();
    cleanup();

    await desaMetaSalut(magatzem, 'avis', { acceptatA: ARA.toISOString(), versio: 1 });
    muntaPlataforma('/app/salut/guia/diari-3-dies', {
      registre: creaRegistre({ internes: [{ ...manifestSalut, carrega: () => Promise.resolve({ default: App }) }] }),
      entorn: ENTORN,
      externalConfig: { language: lang },
    });
    expect((await screen.findAllByText(titolGuia)).length).toBeGreaterThan(0);

    expect(textErrorSalut({ codi: 'NOMES_LECTURA' }, lang)).toBeTruthy();
    expect(etiquetaDataLlargaSalut('2026-11-19', lang).length).toBeGreaterThan(5);
    expect(resumApuntSalut({ tipus: 'miccio', mesura: 'no-mesurat' }, lang)).toContain(botoMiccio);
    expect(valoracioSetmanalSalut(lang).dominis).toHaveLength(12);
    expect(textosSalut(lang).avisos).toBeTruthy();
  });
});
