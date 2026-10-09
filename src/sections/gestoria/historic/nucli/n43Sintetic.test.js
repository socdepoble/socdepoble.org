// @vitest-environment node
/* Històric · de punta a punta amb Norma 43 sintètica (Onada 6, ordre del
   Mestre, 261009): els extractes de set trimestres, alguns solapats, passen
   pel tractor (aprovació de veres amb un autenticador simulat), la sèrie,
   les operacions, la simulació i el llibre. Cap text del banc arriba a cap
   eixida i cap moviment compta dues vegades. */
import { describe, expect, test } from 'vitest';
import { creaAutenticadorSimulat } from '../../../../../tests/helpers/autenticadorSimulat.js';
import { llegeixC43 } from '../../nucli/c43.js';
import { indicadors, rangPerDefecte, serieHistorica } from '../../despeses/nucli/serieHistorica.js';
import { provisioDe, simula } from '../../impostos/nucli/simulacio.js';
import { TRACTOR_HISTORIC } from '../../tractors.js';
import { creaLlibreGestora, modelLlibre } from './llibreGestora.js';
import { SUPOSITS_PER_DEFECTE, operacionsDelBanc } from './operacions.js';
import { executaTractorHistoric } from './tractorHistoric.js';

const xifres = (n, llargaria) => String(Math.abs(n)).padStart(llargaria, '0');
const text = (valor, llargaria) => String(valor).padEnd(llargaria, ' ').slice(0, llargaria);
const aammdd = (iso) => iso.slice(2, 4) + iso.slice(5, 7) + iso.slice(8, 10);

/* Una Norma 43 sintètica d'un compte: registres de 80 caràcters que llegeixC43 llig sense avisos. */
const CLAU_COMPTE = `9999${'0001'}${xifres(43, 10)}`;
function n43({ desde, fins, saldoInicial, moviments }) {
  const linies = [`11${CLAU_COMPTE}${aammdd(desde)}${aammdd(fins)}2${xifres(saldoInicial, 14)}9783${text('TITULAR SINTETIC', 26)}${text('', 3)}`];
  let deure = 0, haver = 0, sumaDeure = 0, sumaHaver = 0;
  for (const m of moviments) {
    if (m.centims < 0) { deure += 1; sumaDeure -= m.centims; } else { haver += 1; sumaHaver += m.centims; }
    linies.push(`22${text('', 4)}0001${aammdd(m.data)}${aammdd(m.data)}99000${m.centims < 0 ? '1' : '2'}${xifres(m.centims, 14)}${xifres(0, 10)}${text('', 12)}${text('', 16)}`);
    linies.push(`2301${text(m.concepte, 38)}${text('', 38)}`);
    if (m.usd != null) linies.push(`2401840${xifres(m.usd, 14)}${text('', 59)}`);
  }
  const saldoFinal = saldoInicial + sumaHaver - sumaDeure;
  linies.push(`33${CLAU_COMPTE}${xifres(deure, 5)}${xifres(sumaDeure, 14)}${xifres(haver, 5)}${xifres(sumaHaver, 14)}2${xifres(saldoFinal, 14)}978${text('', 4)}`);
  linies.push(`88${'9'.repeat(18)}${xifres(linies.length, 6)}${text('', 54)}`);
  return { text: linies.join('\r\n'), saldoFinal };
}

/* Set trimestres (de l'1-1-2025 al 30-9-2026), cada mes amb Claude, ChatGPT, la RETA i un client. */
const ISO = (a, m, d) => `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
function movimentsDelMes(a, m) {
  return [
    { data: ISO(a, m, 3), centims: -2150, concepte: 'COMPRA TARJ ANTHROPIC CLAUDE PRO', usd: 2200 },
    { data: ISO(a, m, 8), centims: -2300, concepte: 'OPENAI *CHATGPT SUBSCR' },
    { data: ISO(a, m, 28), centims: -29400, concepte: 'TGSS COTIZACION REGIMEN AUTONOMOS' },
    { data: ISO(a, m, 15), centims: 242000, concepte: 'TRANSFERENCIA DE EMPRESA SINTETICA' }
  ].sort((x, y) => x.data.localeCompare(y.data));
}
function extractes() {
  const fitxers = [];
  let saldo = 1000000;
  for (const [a, t] of [[2025, 1], [2025, 2], [2025, 3], [2025, 4], [2026, 1], [2026, 2], [2026, 3]]) {
    const mesos = [3 * t - 2, 3 * t - 1, 3 * t];
    const moviments = mesos.flatMap((m) => movimentsDelMes(a, m));
    const fi = { 3: 31, 6: 30, 9: 30, 12: 31 }[3 * t];
    const { text: contingut, saldoFinal } = n43({ desde: ISO(a, mesos[0], 1), fins: ISO(a, 3 * t, fi), saldoInicial: saldo, moviments });
    fitxers.push({ nom: `${a}_${t}T.n43`, contingut });
    saldo = saldoFinal;
  }
  return { fitxers, saldo };
}

const ARA = Date.UTC(2026, 9, 9, 3, 0, 0);
const EMPREMTA = `sha256:${'ab'.repeat(32)}`;
const autenticador = await creaAutenticadorSimulat();
const registre = await autenticador.signa({ manifest: TRACTOR_HISTORIC, empremta: EMPREMTA, ara: ARA - 60000, nonce: new Uint8Array(16).fill(5) });
const APROVACIO = {
  manifest: TRACTOR_HISTORIC, empremta: EMPREMTA, registres: [registre], claus: autenticador.claus,
  origen: autenticador.origen, rpId: autenticador.rpId, ara: ARA
};
const fitxer = (nom, contingut) => {
  const bytes = new TextEncoder().encode(contingut);
  return { name: nom, size: bytes.length, arrayBuffer: async () => bytes.slice().buffer };
};
const PRIVATS = ['ANTHROPIC', 'CHATGPT', 'TGSS', 'EMPRESA SINTETICA', 'TITULAR SINTETIC', 'CLAUDE PRO'];

describe('l’històric de punta a punta', () => {
  const { fitxers, saldo } = extractes();
  /* El segon trimestre de 2025, repetit: el mateix extracte dues vegades. */
  const triats = [...fitxers, fitxers[1]].map((f) => fitxer(f.nom, f.contingut));

  test('la Norma 43 sintètica es llig sense avisos', () => {
    expect(llegeixC43(fitxers[0].contingut).avisos).toEqual([]);
  });

  test('un trimestre que falta (el 2T de 2025) i un extracte anual de 2025 per damunt dels trimestrals: cap forat amagat, cap moviment perdut', async () => {
    const senseSegon = fitxers.filter((_, i) => i !== 1).map((f) => fitxer(f.nom, f.contingut));
    const ambForat = serieHistorica({ lectura: await executaTractorHistoric({ fitxers: senseSegon, aprovacio: APROVACIO }), rang: rangPerDefecte({ a: 2026, m: 10, d: 9 }) });
    expect(ambForat.trimestres.map((t) => t.cobertura)).toEqual(['completa', 'cap', 'completa', 'completa', 'completa', 'completa', 'completa']);
    expect(ambForat.trimestres[1].entrades).toBeNull();
    expect(ambForat.avisos.map((a) => a.codi)).toEqual(['FORAT_ENTRE_EXTRACTES']);
    /* Un extracte anual de 2025 (els quatre trimestres en un) i el 3T de 2025 a part: el 3T no fa perdre gener-juny. */
    const moviments2025 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].flatMap((m) => movimentsDelMes(2025, m));
    const anual = n43({ desde: '2025-01-01', fins: '2025-12-31', saldoInicial: 1000000, moviments: moviments2025 }).text;
    const ambAnual = serieHistorica({
      lectura: await executaTractorHistoric({ fitxers: [fitxer('3T.n43', fitxers[2].contingut), fitxer('2025.n43', anual)], aprovacio: APROVACIO }),
      rang: { inici: { a: 2025, m: 1, d: 1 }, fi: { a: 2025, m: 12, d: 31 } }
    });
    expect(ambAnual.moviments).toHaveLength(12 * 4);
    expect(ambAnual.mesos.every((m) => m.cobertura === 'completa' && m.ia.net === 4450)).toBe(true);
  }, 30000);

  test('set trimestres, un repetit: cap moviment dues vegades; la IA per proveïdor; cap text a cap eixida', async () => {
    const lectura = await executaTractorHistoric({ fitxers: triats, aprovacio: APROVACIO });
    const rang = rangPerDefecte({ a: 2026, m: 10, d: 9 });
    const serie = serieHistorica({ lectura, rang });
    expect(serie.moviments).toHaveLength(21 * 4);
    expect(serie.avisos.map((a) => a.codi)).toEqual(['EXTRACTES_SOLAPATS']);
    expect(serie.mesos).toHaveLength(21);
    expect(serie.mesos.every((m) => m.cobertura === 'completa' && m.ia.net === 4450)).toBe(true);
    expect(serie.trimestres.map((t) => t.clau)).toEqual(['2025-T1', '2025-T2', '2025-T3', '2025-T4', '2026-T1', '2026-T2', '2026-T3']);
    expect(serie.ia.net).toBe(21 * 4450);
    expect(serie.ia.usd).toBe(21 * 2200);
    expect(serie.ia.perProveidor.map((p) => [p.clau, p.net])).toEqual([['openai', 21 * 2300], ['anthropic', 21 * 2150]]);
    expect(serie.caixa.saldo).toBe(saldo);
    for (const privat of PRIVATS) {
      expect(JSON.stringify(lectura), privat).not.toContain(privat);
      expect(JSON.stringify(serie), privat).not.toContain(privat);
    }

    const ind = indicadors({ serie });
    expect(ind.despesaMensual.valor).toBe(2150 + 2300 + 29400);
    expect(ind.consumNet.valor).toBe(2150 + 2300 + 29400 - 242000);
    expect(ind.runway.motiu).toBe('SENSE_CONSUM');

    const { operacions } = operacionsDelBanc({ moviments: serie.moviments, suposits: SUPOSITS_PER_DEFECTE });
    /* La cobertura de cada trimestre, com la passa la vista (useHistoric). */
    const cobertura = Object.fromEntries(serie.trimestres.map((t) => [t.clau, t.cobertura]));
    const simulacio = simula({ operacions, anys: [2025, 2026], cobertura });
    const [a2025, a2026] = simulacio.anys;
    /* La IA d'Irlanda és inversió del subjecte passiu: net zero al 303, i cada trimestre avisa del 349. */
    expect(a2025.trimestres[0].iva.avisos.map((a) => a.codi)).toContain('MODEL_349');
    expect(a2025.trimestres[0].iva.ispIntracomunitari).toBe(a2025.trimestres[0].iva.suportat);
    expect(a2025.model390.parcial).toBe(false);
    expect(a2026.model390.parcial).toBe(true);
    /* El quart trimestre de 2026 no té extractes: ni 303, ni 130, ni total (mai 0,00 €). */
    expect(a2026.trimestres[3]).toMatchObject({ cobertura: 'cap', total: null });
    expect(a2026.trimestres[3].iva.motiu).toBe('SENSE_DADES');
    expect(a2026.trimestres[3].irpf).toMatchObject({ resultat: null, motiu: 'SENSE_DADES' });
    expect(provisioDe(simulacio, { any: 2026, t: 4 }).valor).toBeNull();
    expect(provisioDe(simulacio, { any: 2026, t: 3 }).valor).toBeGreaterThan(0);

    const model = modelLlibre({ serie, simulacio, suposits: SUPOSITS_PER_DEFECTE });
    expect(model.fulles[3].files).toHaveLength(84);
    /* Al full d'estimacions, el 4T 2026 diu «Sense dades» sense cap import, també al 130. */
    expect(model.fulles[5].files.filter((f) => f[0] === 2026 && f[1] === '4T').map((f) => [f[2], f[3], f[4]]))
      .toEqual([['303', 'Sense dades', null], ['130', 'Sense dades', null]]);
    for (const privat of PRIVATS) expect(JSON.stringify(model), privat).not.toContain(privat);
    const llibre = await creaLlibreGestora({ serie, simulacio, suposits: SUPOSITS_PER_DEFECTE });
    expect(llibre.nom).toBe('gestoria_historic_2025-01-01_2026-09-30.xlsx');
    const bytes = new TextDecoder('latin1').decode(llibre.dades);
    for (const privat of PRIVATS) expect(bytes, privat).not.toContain(privat);
  }, 30000);
});
