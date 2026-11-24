/* El Bar · vistes/textAlergensDetall.js — el text d'al·lèrgens de la fitxa
   del producte a la Caixa (P07-01, que absorbix P06-01; T4: un buit mai pot
   dir «no en porta»). La fitxa ha de dir el mateix que la rajola del TPV
   (articlesDelTpv): sense font no hi ha declaració, les traces es diuen, i el
   que no està revisat es diu «sense revisar». */
import { act, cleanup, screen } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ALERGENS } from '../../../utils/productes/producteUniversal.js';
import { ENTORN_OBERT, muntaPlataforma } from '../../plataforma/__fixtures__/munta.jsx';
import { creaRegistre } from '../../plataforma/registreApps.js';
import AppBar from '../AppBar.jsx';
import { CODIS_IDIOMA_BAR, TEXTOS_UI_BAR, textosUiBar } from '../i18nBar.js';
import { nomAlergen } from '../i18nMercaderies.js';
import { creaMagatzemBar } from '../magatzem.js';
import manifestBar from '../manifest.js';
import { llavorCarta } from '../nucli/llavor.js';
import { obriTorn } from '../nucli/torn.js';
import { textAlergensDetall } from './textAlergensDetall.js';
import { articlesDelTpv } from './vestits.js';

const DINS = Object.freeze({ ...ENTORN_OBERT, produccio: false, sessio: { estat: 'dins', enLinia: true, modeProves: false } });
/* Qualsevol frase que es puga llegir com «no en porta», en les 5 llengües. */
const DIU_QUE_NO_EN_PORTA = /Sense al·lèrgens|Sin alérgenos|No allergens|Ez dago alergenorik|Sen alérxenos/i;
const FONT = 'Fitxa 2026-11';
const absentsMenys = (...ids) => ALERGENS.filter((id) => !ids.includes(id));
/* El flam de la llavor sense cap camp d'al·lèrgens i, damunt, el cas: la prova no depén
   del que porte la llavor (el kit R32.51 li dona font i llistes). */
const ambCas = (producte, canvi) => {
  const { alergens, tracesAlergens, alergensAbsents, fontAlergens, abastAlergens, alergensEstat, ...resta } = producte;
  void [alergens, tracesAlergens, alergensAbsents, fontAlergens, abastAlergens, alergensEstat];
  return { ...resta, alergens: [], ...canvi };
};

/* Els casos de la troballa i els seus veïns: cada un és un producte de la carta. */
const CASOS = Object.freeze({
  tracaAmbFont: { alergens: [], tracesAlergens: ['fruits-closca'], fontAlergens: FONT },
  pendentParroquia: { alergens: [], alergensEstat: 'pendent' },
  llavorSenseFont: { alergens: ['llet'] },
  tracaSenseFont: { alergens: [], tracesAlergens: ['gluten'] },
  capAnotacio: { alergens: [] },
  fontEnBlanc: { alergens: ['llet'], fontAlergens: '   ' },
  conteParcial: { alergens: ['llet', 'gluten'], fontAlergens: FONT },
  conteITracaParcial: { alergens: ['ous'], tracesAlergens: ['fruits-closca'], fontAlergens: FONT, alergensEstat: 'revisio_manual' },
  conteComplet: { alergens: ['llet', 'gluten'], alergensAbsents: absentsMenys('llet', 'gluten'), fontAlergens: FONT },
  tracaCompleta: { alergens: [], tracesAlergens: ['sesam'], alergensAbsents: absentsMenys('sesam'), fontAlergens: FONT },
  capDels14: { alergens: [], alergensAbsents: [...ALERGENS], fontAlergens: FONT, alergensEstat: 'revisio_manual' },
  absentsSenseFont: { alergens: [], alergensAbsents: [...ALERGENS] }
});

function rellotgeDeProva() {
  let ms = Date.parse('2026-11-24T08:00:00.000Z');
  return () => {
    ms += 1000;
    return new Date(ms).toISOString();
  };
}

/* Un magatzem en memòria amb el torn obert i el flam canviat per `canvi`. */
async function magatzemAmbFlam(canvi) {
  const magatzem = creaMagatzemBar({ idb: null, navegador: {}, Canal: null });
  const { carta } = await magatzem.carrega();
  await magatzem.desaCarta({ ...carta, productes: carta.productes.map((p) => (p.id === 'flam' ? ambCas(p, canvi) : p)) });
  const torn = obriTorn({ id: 'torn-p0701', per: 'Cambrer 1', fonsInicialCents: 0, ara: '2026-11-24T07:00:00.000Z' });
  await magatzem.desaTorn(torn);
  await magatzem.desaMeta('tornActual', torn.id);
  return magatzem;
}

/* Obri la fitxa del flam a la Caixa (/caixa?article=flam) i en torna el diàleg. */
async function fitxaDelFlamALaCaixa(magatzem) {
  const rellotge = rellotgeDeProva();
  const App = () => createElement(AppBar, { magatzem, rellotge, atzar: () => 0.42 });
  const registre = creaRegistre({ internes: [{ ...manifestBar, carrega: () => Promise.resolve({ default: App }) }] });
  await act(async () => {
    muntaPlataforma('/app/bar/caixa?article=flam', { registre, entorn: DINS });
  });
  return screen.findByRole('dialog', { name: 'Flam' });
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('textAlergensDetall: el text en valencià', () => {
  const tx = textosUiBar('ca');
  test.each([
    ['tracaAmbFont', 'Pot contindre (traça): Fruits de closca. Al·lèrgens sense revisar a la fitxa del producte.'],
    ['pendentParroquia', 'Al·lèrgens sense revisar a la fitxa del producte.'],
    ['llavorSenseFont', 'Al·lèrgens sense revisar a la fitxa del producte.'],
    ['tracaSenseFont', 'Al·lèrgens sense revisar a la fitxa del producte.'],
    ['capAnotacio', 'Al·lèrgens sense revisar a la fitxa del producte.'],
    ['fontEnBlanc', 'Al·lèrgens sense revisar a la fitxa del producte.'],
    ['conteParcial', 'Al·lèrgens: Gluten, Llet. Els manté el bar. Al·lèrgens sense revisar a la fitxa del producte.'],
    ['conteITracaParcial', 'Al·lèrgens: Ous. Els manté el bar. Pot contindre (traça): Fruits de closca. Al·lèrgens sense revisar a la fitxa del producte.'],
    ['conteComplet', 'Al·lèrgens: Gluten, Llet. Els manté el bar.'],
    ['tracaCompleta', 'Pot contindre (traça): Sèsam.'],
    ['capDels14', 'Cap dels 14 al·lèrgens, segons la fitxa del producte. Els manté el bar.'],
    ['absentsSenseFont', 'Al·lèrgens sense revisar a la fitxa del producte.']
  ])('%s', (cas, esperat) => {
    expect(textAlergensDetall(CASOS[cas], tx, 'ca')).toBe(esperat);
  });

  test('sense producte (un article que ja no és a la carta), «sense revisar»', () => {
    expect(textAlergensDetall(undefined, tx, 'ca')).toBe(tx.alergensSenseRevisarFitxa);
    expect(textAlergensDetall(null, tx)).toBe(tx.alergensSenseRevisarFitxa);
  });
});

describe.each(CODIS_IDIOMA_BAR)('textAlergensDetall en %s', (idioma) => {
  const tx = TEXTOS_UI_BAR[idioma];
  const text = (cas) => textAlergensDetall(CASOS[cas], tx, idioma);

  test('les tres claus noves hi són, i la de «Sense al·lèrgens anotats» ja no', () => {
    expect(typeof tx.alergensSenseRevisarFitxa).toBe('string');
    expect(typeof tx.capAlergenManteBar).toBe('string');
    expect(typeof tx.tracesManteBar).toBe('function');
    expect(tx).not.toHaveProperty('senseAlergensManteBar');
    expect(tx.alergensSenseRevisarFitxa).not.toMatch(DIU_QUE_NO_EN_PORTA);
  });

  test('(a) una traça amb font: el nom de l’al·lergen i el text de traça', () => {
    const fruits = nomAlergen('fruits-closca', idioma);
    expect(text('tracaAmbFont')).toContain(fruits);
    expect(text('tracaAmbFont')).toContain(tx.tracesManteBar(fruits));
    expect(text('tracaAmbFont')).toContain(tx.alergensSenseRevisarFitxa);
  });

  test('(b) la carta de La Parròquia (buida i «pendent») diu «sense revisar»', () => {
    expect(text('pendentParroquia')).toBe(tx.alergensSenseRevisarFitxa);
  });

  test('(c) la llavor sense font no presenta la llet com a declarada', () => {
    expect(text('llavorSenseFont')).not.toContain(nomAlergen('llet', idioma));
    expect(text('llavorSenseFont')).toBe(tx.alergensSenseRevisarFitxa);
    expect(text('tracaSenseFont')).not.toContain(nomAlergen('gluten', idioma));
    expect(text('fontEnBlanc')).toBe(tx.alergensSenseRevisarFitxa);
  });

  test('(d) els 14 absents amb font donen «cap dels 14»; sense font, no', () => {
    expect(text('capDels14')).toBe(tx.capAlergenManteBar);
    expect(text('absentsSenseFont')).toBe(tx.alergensSenseRevisarFitxa);
  });

  test('(e) cap eixida es pot llegir com «no en porta»', () => {
    for (const cas of Object.keys(CASOS)) expect(text(cas), cas).not.toMatch(DIU_QUE_NO_EN_PORTA);
  });

  test('la fitxa diu el mateix que la rajola del TPV (traces, font i pendents)', () => {
    for (const [cas, canvi] of Object.entries(CASOS)) {
      const carta = llavorCarta();
      carta.productes = carta.productes.map((p) => (p.id === 'flam' ? ambCas(p, canvi) : p));
      const rajola = articlesDelTpv(carta, { idioma }).find((a) => a.id === 'flam');
      const fitxa = textAlergensDetall(carta.productes.find((p) => p.id === 'flam'), tx, idioma);
      const trossos = (rajola.secundari || '').split(' · ');
      const tracesRajola = (trossos.find((t) => t.startsWith('T: ')) || '').slice(3).split(', ').filter(Boolean);
      /* Cada icona i cada traça de la rajola són a la fitxa, i la traça hi és com a traça. */
      for (const id of rajola.alergens || []) expect(fitxa, `${cas}: ${id}`).toContain(nomAlergen(id, idioma));
      if (tracesRajola.length) expect(fitxa, cas).toContain(tx.tracesManteBar(tracesRajola.join(', ')));
      /* Si la rajola diu «pendents», la fitxa diu «sense revisar». */
      if (trossos.includes(tx.alergensPendents)) expect(fitxa, cas).toContain(tx.alergensSenseRevisarFitxa);
      /* La fitxa no declara cap al·lergen que la rajola calle. */
      for (const id of ALERGENS) {
        const enRajola = (rajola.alergens || []).includes(id) || tracesRajola.includes(nomAlergen(id, idioma));
        if (!enRajola) expect(fitxa, `${cas}: ${id}`).not.toContain(nomAlergen(id, idioma));
      }
    }
  });
});

describe('P07-01 · la fitxa de la Caixa, de veres (/app/bar/caixa?article=…)', () => {
  test('una traça declarada amb font es diu a la fitxa; mai «Sense al·lèrgens anotats»', async () => {
    const magatzem = await magatzemAmbFlam({ alergens: [], tracesAlergens: ['fruits-closca'], fontAlergens: 'Fitxa 2026-11' });
    const fitxa = await fitxaDelFlamALaCaixa(magatzem);
    expect(fitxa.textContent).toContain('Pot contindre (traça): Fruits de closca.');
    expect(fitxa.textContent).toContain('Al·lèrgens sense revisar a la fitxa del producte.');
    expect(fitxa.textContent).not.toMatch(DIU_QUE_NO_EN_PORTA);
  });

  test('la carta pendent de La Parròquia (llista buida, estat «pendent») diu «sense revisar»', async () => {
    const magatzem = await magatzemAmbFlam({ alergens: [], alergensEstat: 'pendent' });
    const fitxa = await fitxaDelFlamALaCaixa(magatzem);
    expect(fitxa.textContent).toContain('Al·lèrgens sense revisar a la fitxa del producte.');
    expect(fitxa.textContent).not.toMatch(DIU_QUE_NO_EN_PORTA);
  });

  test('una anotació sense font (la llavor) no es presenta com a declarada', async () => {
    const magatzem = await magatzemAmbFlam({ alergens: ['ous', 'llet'] });
    const fitxa = await fitxaDelFlamALaCaixa(magatzem);
    expect(fitxa.textContent).not.toContain('Al·lèrgens: Ous, Llet');
    expect(fitxa.textContent).toContain('Al·lèrgens sense revisar a la fitxa del producte.');
  });
});
