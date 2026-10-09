// @vitest-environment node
/* Històric · el llibre XLSX per a la gestora (Onada 6, ordre del Mestre,
   261009): set fulles, sense el text dels conceptes, amb l'empremta SHA-256
   dels bytes i els mateixos bytes per a la mateixa entrada. L'anada i
   tornada es fa ací, a la prova, amb el lector de src/utils/fulls (la
   producció no l'importa). Dades sintètiques. */
import { webcrypto } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { llegixLlibre } from '../../../../utils/fulls/lector.js';
import { serieHistorica } from '../../despeses/nucli/serieHistorica.js';
import { ETIQUETA_NO_VERIFICAT, simula } from '../../impostos/nucli/simulacio.js';
import { AVIS_SENSE_XIFRAR, FULLES_LLIBRE, TIPUS_LLIBRE, creaLlibreGestora, modelLlibre, nomDelLlibre } from './llibreGestora.js';
import { SUPOSITS_PER_DEFECTE, operacionsDelBanc } from './operacions.js';

const d = (iso) => ({ a: Number(iso.slice(0, 4)), m: Number(iso.slice(5, 7)), d: Number(iso.slice(8, 10)) });
let n = 0;
const mov = (iso, centims, categoria, proveidor = null, extra = {}) => {
  n += 1;
  return { dataOperacio: d(iso), dataValor: d(iso), centims, id: `m${String(n).padStart(8, '0')}`, categoria, proveidor, confianca: 'mitjana', motiu: 'TEXT', ...extra };
};
const LECTURA = {
  extractes: [{
    lectura: {
      comptes: [{
        capcalera: { entitat: '9999', compte4: '4321', dataInicial: d('2025-01-01'), dataFinal: d('2025-06-30'), saldoInicial: 500000, divisa: 'EUR' },
        moviments: [
          mov('2025-01-05', -2150, 'ia', 'anthropic', { divisa: { moneda: 'USD', centims: -2200 } }),
          mov('2025-01-10', 121000, 'clients'),
          mov('2025-02-05', -2000, 'ia', 'openai'),
          mov('2025-04-01', -29400, 'reta'),
          mov('2025-05-05', -1210, 'allotjament', 'siteground'),
          mov('2025-06-01', 242000, 'clients')
        ],
        peu: { saldoFinal: 500000 - 2150 + 121000 - 2000 - 29400 - 1210 + 242000 }
      }],
      avisos: []
    }
  }]
};
const RANG = { inici: d('2025-01-01'), fi: d('2025-06-30') };
const SERIE = serieHistorica({ lectura: LECTURA, rang: RANG });
const { operacions } = operacionsDelBanc({ moviments: SERIE.moviments });
const SIMULACIO = simula({ operacions, anys: [2025] });
const subtle = webcrypto.subtle;
const hex = (bytes) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
const files = (fulla) => {
  const perFila = new Map();
  for (const c of fulla.celles) {
    if (!perFila.has(c.fila)) perFila.set(c.fila, []);
    perFila.get(c.fila)[c.col] = c.valor;
  }
  return [...perFila.entries()].sort((x, y) => x[0] - y[0]).map(([, fila]) => fila);
};
const cents = (euros) => Math.round(euros * 100);

describe('el model del llibre', () => {
  const model = modelLlibre({ serie: SERIE, simulacio: SIMULACIO, suposits: SUPOSITS_PER_DEFECTE });

  test('set fulles, en ordre; els moviments, un per fila', () => {
    expect(model.fulles.map((f) => f.nom)).toEqual([...FULLES_LLIBRE]);
    expect(FULLES_LLIBRE).toEqual(['Llegiu-me', 'Resum anual', 'Resum trimestral', 'Moviments', 'Despeses IA', 'Estimacions', 'Paràmetres']);
    const moviments = model.fulles[3];
    expect(moviments.files).toHaveLength(SERIE.moviments.length);
    /* «Per què» en paraules, no el codi intern (TEXT, PATRO_FEBLE...), que la gestora no coneix. */
    expect(moviments.files[0]).toEqual(['2025-01-05', '2025-01-05', 1, -2150, 'Intel·ligència artificial', 'Anthropic (Claude)', 'IE', 'Mitjana', 'El text del moviment', 'USD', -22]);
    expect(moviments.columnes[8].titol).toBe('Per què');
    for (const fila of moviments.files) expect(fila[8], String(fila)).not.toMatch(/^[A-Z_]+$/);
  });

  test('amb la cobertura de la sèrie, un trimestre sense extractes no porta cap xifra a les estimacions, tampoc al 130', () => {
    const cobertura = Object.fromEntries(SERIE.trimestres.map((t) => [t.clau, t.cobertura]));
    const ambCobertura = simula({ operacions, anys: [2025], cobertura });
    const estimacions = modelLlibre({ serie: SERIE, simulacio: ambCobertura }).fulles[5].files;
    const de = (periode, model) => estimacions.filter((f) => f[1] === periode && f[2] === model);
    for (const periode of ['3T', '4T']) {
      for (const model of ['303', '130']) {
        expect(de(periode, model), `${periode} ${model}`).toEqual([[2025, periode, model, 'Sense dades', null, 'Sense extractes ni moviments del trimestre: no hi ha estimació']]);
      }
    }
    expect(de('2T', '130').find((f) => f[3] === 'A ingressar')[4]).toEqual(expect.any(Number));
  });

  test('el Llegiu-me porta les notes de la lectura: un forat entre extractes, amb les dates', () => {
    const extracte = (desde, fins, moviments) => ({ lectura: { comptes: [{
      capcalera: { entitat: '9999', compte4: '4321', dataInicial: d(desde), dataFinal: d(fins), saldoInicial: 100000, divisa: 'EUR' }, moviments
    }], avisos: [] } });
    const ambForat = serieHistorica({
      lectura: { extractes: [extracte('2025-01-01', '2025-01-31', [mov('2025-01-05', -100, 'altres')]), extracte('2025-03-01', '2025-03-31', [mov('2025-03-05', -100, 'altres')])] },
      rang: { inici: d('2025-01-01'), fi: d('2025-03-31') }
    });
    const notes = modelLlibre({ serie: ambForat }).fulles[0].files.filter(([camp]) => camp === 'Nota de la lectura').map(([, text]) => text);
    expect(notes).toEqual(['Falten els extractes del compte acabat en 4321 del 01/02/2025 al 28/02/2025: eixos dies no tenen xifra i els seus períodes ixen «parcials».']);
  });

  test('el Llegiu-me diu el període, els comptes, que no porta conceptes i que ix sense xifrar; les estimacions, l’etiqueta', () => {
    const llegiume = Object.fromEntries(model.fulles[0].files);
    expect(llegiume['Període']).toBe('01/01/2025 – 30/06/2025');
    expect(llegiume['Compte 1']).toBe('Entitat 9999, acabat en 4321 (extractes del 01/01/2025 al 30/06/2025)');
    expect(llegiume.Xifratge).toBe('Este fitxer ix SENSE xifrar.');
    expect(llegiume.Privacitat).toMatch(/Sense el text dels conceptes/);
    expect(llegiume['Suposició: IVA de les factures als clients']).toBe('21 %');
    expect(model.fulles[5].files[0]).toEqual([null, '', '', ETIQUETA_NO_VERIFICAT, null, '']);
    expect(AVIS_SENSE_XIFRAR).toMatch(/SENSE xifrar/);
  });

  test('els trimestres porten les estimacions de la simulació; els paràmetres, la font i l’estat', () => {
    const [t1, t2] = model.fulles[2].files;
    expect(t1.slice(0, 4)).toEqual(['1T 2025', '2025-01-01', '2025-03-31', 'Completa']);
    expect(t1[8]).toBe(SIMULACIO.anys[0].trimestres[0].iva.aIngressar);
    expect(t2[10]).toBe(SIMULACIO.anys[0].trimestres[1].irpf.resultat);
    const parametres = model.fulles[6].files;
    expect(parametres.length).toBeGreaterThan(5);
    expect(parametres.every((fila) => fila[0] === 2025 && /\[NO VERIFICAT\]/.test(fila[4]) && fila[3].length > 10)).toBe(true);
  });

  test('cap text dels conceptes del banc (no n’hi ha cap a l’entrada) ni cap id de moviment', () => {
    const text = JSON.stringify(model);
    for (const m of SERIE.moviments) expect(text).not.toContain(m.id);
  });

  test('sense la sèrie, no hi ha llibre', () => {
    expect(() => modelLlibre({})).toThrow(TypeError);
  });
});

describe('el fitxer', () => {
  test('el nom diu el període i res del titular; el tipus és el d’un XLSX', async () => {
    const llibre = await creaLlibreGestora({ serie: SERIE, simulacio: SIMULACIO, suposits: SUPOSITS_PER_DEFECTE, subtle });
    expect(llibre.nom).toBe('gestoria_historic_2025-01-01_2025-06-30.xlsx');
    expect(nomDelLlibre(null)).toBe('gestoria_historic.xlsx');
    expect(llibre.tipus).toBe(TIPUS_LLIBRE);
    expect(llibre.mida).toBe(llibre.dades.length);
  });

  test('l’empremta és el SHA-256 dels bytes; els mateixos fulls, els mateixos bytes; dades torna còpies', async () => {
    const a = await creaLlibreGestora({ serie: SERIE, simulacio: SIMULACIO, suposits: SUPOSITS_PER_DEFECTE, subtle });
    const b = await creaLlibreGestora({ serie: SERIE, simulacio: SIMULACIO, suposits: SUPOSITS_PER_DEFECTE, subtle });
    expect(a.empremta).toMatch(/^[0-9a-f]{64}$/);
    expect(a.empremta).toBe(hex(await subtle.digest('SHA-256', a.dades)));
    expect(b.empremta).toBe(a.empremta);
    expect(b.dades).toEqual(a.dades);
    const copia = a.dades;
    copia[0] = 0;
    expect(a.dades[0]).not.toBe(0);
  });

  test('anada i tornada amb el lector: les fulles, els imports exactes en cèntims i les dates', async () => {
    const llibre = await creaLlibreGestora({ serie: SERIE, simulacio: SIMULACIO, suposits: SUPOSITS_PER_DEFECTE, subtle });
    const llegit = llegixLlibre(llibre.dades);
    expect(llegit.fulles.map((f) => f.nom)).toEqual([...FULLES_LLIBRE]);
    const moviments = files(llegit.fulles[3]);
    expect(moviments[0][0]).toBe('Data');
    expect(moviments.slice(1).map((fila) => [fila[0], cents(fila[3]), fila[4]])).toEqual(SERIE.moviments.map((m) => [
      `${m.data.a}-${String(m.data.m).padStart(2, '0')}-${String(m.data.d).padStart(2, '0')}`, m.centims,
      { ia: 'Intel·ligència artificial', clients: 'Ingressos de clients', reta: 'Quota d’autònoms (RETA)', allotjament: 'Allotjament i dominis' }[m.categoria]
    ]));
    const anual = files(llegit.fulles[1]);
    expect(anual[1].slice(0, 2)).toEqual([2025, 'Parcial']);
    expect(cents(anual[1][2])).toBe(SERIE.anys[0].entrades);
    expect(cents(anual[1][5])).toBe(SERIE.anys[0].ia.net);
    const ia = files(llegit.fulles[4]);
    expect(ia.slice(1).map((fila) => [fila[0], fila[1], cents(fila[4]), fila[5]])).toEqual([
      ['2025-01', 'Anthropic (Claude)', 2150, 22],
      ['2025-02', 'OpenAI (ChatGPT)', 2000, 0]
    ]);
    const estimacions = files(llegit.fulles[5]);
    const aIngressar = estimacions.find((fila) => fila[1] === '1T' && fila[2] === '303' && fila[3] === 'A ingressar');
    expect(cents(aIngressar[4])).toBe(SIMULACIO.anys[0].trimestres[0].iva.aIngressar);
  });
});
