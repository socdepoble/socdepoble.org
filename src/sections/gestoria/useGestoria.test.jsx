/* Gestoria · useGestoria: l'estat en memòria i les tres aprovacions, amb el
   tractor de veres sobre una Font sintètica en memòria (un full del 2T fet
   amb el mateix motor i el CSV d'una factura de proveïdor). Empreses
   fictícies i CIF calculats; cap dada de cap persona. */
import { webcrypto } from 'node:crypto';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { creaAutenticadorSimulat } from '../../../tests/helpers/autenticadorSimulat.js';
import { ErrorAprovacio, preparaRegistre } from '../tractors/nucli/aprovacio.js';
import { fontDesDeFitxers } from './font/fontNavegador.js';
import { empremtaProposta } from './nucli/entregables.js';
import { fullACsv, maquetaFull } from './nucli/fullModel.js';
import { crearFactura } from './nucli/model.js';
import { PLANTILLA_GESTORIA } from './nucli/plantilla.js';
import { ErrorTractor, executaTractorFactures } from './nucli/tractor.js';
import { TRACTOR_CORREUS, TRACTOR_FACTURES } from './tractors.js';
import { dataDeAvui, incidenciesDe, missatgeError, trimestreAnterior, useGestoria } from './useGestoria.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const subtle = webcrypto.subtle;

/* ── Dades sintètiques ──────────────────────────────────────────────────── */

function controlCif(xifres) {
  const parells = Number(xifres[1]) + Number(xifres[3]) + Number(xifres[5]);
  const senars = [0, 2, 4, 6].map((i) => Number(xifres[i]) * 2).map((n) => (n > 9 ? n - 9 : n)).reduce((a, b) => a + b, 0);
  return (10 - ((parells + senars) % 10)) % 10;
}
const cif = (lletra, xifres) => `${lletra}${xifres}${controlCif(xifres)}`;

const TITULAR = 'Cooperativa Exemple del Poble';
const CIF_LLUM = cif('B', '7100001');
const CIF_CLIENT = cif('B', '7100008');
const bytes = (text) => new TextEncoder().encode(text);

/* El full del 2T, fet amb el motor de veres: un proveïdor que factura cada mes. */
const historica = (dades) => crearFactura({ origen: { metode: 'manual' }, ...dades });
const FULL_2T = fullACsv(maquetaFull(PLANTILLA_GESTORIA, {
  titular: TITULAR,
  any: 2026,
  t: 2,
  ingressos: [historica({ tipus: 'ingres', data: '15/05/2026', num: 'F26-0001', contrapart: 'Exemple Distribucions SL', nif: CIF_CLIENT, descripcio: 'Taller', subtotal: 50000, iva: 10500, total: 60500 })],
  despeses: [4, 5, 6].map((m) => historica({
    tipus: 'despesa', data: { a: 2026, m, d: 28 }, num: `EL-2026-0${m}`, contrapart: 'Exemple Llum SL', nif: CIF_LLUM,
    descripcio: 'Subministrament elèctric', subtotal: 10000, iva: 2100, total: 12100
  }))
}));
const CSV_PROVEIDOR = [
  'Número de factura,7777777777',
  'Fecha de la factura,31 jul 2026',
  'Importe de la factura,"12,10 €"',
  '',
  'Descripción,Intervalo,Cantidad,Importe(€)',
  'Servei al núvol,1 jul 2026 - 31 jul 2026,1,"10,00"',
  'Subtotal en EUR,,,"10,00"',
  'I.V.A. (21%),,,"2,10"',
  'Total en EUR,,,"12,10"'
].join('\r\n');
const MODEL_2T = '2026_2T/2026-FACTURACIO-Cooperativa_Exemple_del_Poble_-_2T.csv';
const CARPETA = Object.freeze({
  [MODEL_2T]: bytes(FULL_2T),
  '2026_3T/7777777777.csv': bytes(CSV_PROVEIDOR),
  '2026_3T/notes.txt': bytes('apunts')
});
const NOM_XLSX = '2026-FACTURACIO-Cooperativa_Exemple_del_Poble_-_3T.xlsx';

/* Un PDF d'una pàgina sense comprimir (com els de nucli/tractor.test.js): sense descompressor també es llig. */
function pdfPla(linies) {
  const contingut = linies.map((l, i) => `BT /F1 10 Tf 72 ${780 - i * 16} Td (${l.replace(/[\\()]/g, '\\$&')}) Tj ET`).join('\n');
  const objectes = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n',
    `4 0 obj\n<< /Length ${contingut.length} >>\nstream\n${contingut}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n'
  ];
  let text = '%PDF-1.7\n';
  const posicions = objectes.map((objecte) => {
    const posicio = text.length;
    text += objecte;
    return posicio;
  });
  const xref = `xref\n0 6\n0000000000 65535 f \n${posicions.map((p) => `${String(p).padStart(10, '0')} 00000 n \n`).join('')}`;
  return bytes(`${text}${xref}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${text.length}\n%%EOF\n`);
}

/* La carpeta amb una factura d'un proveïdor que factura en dòlars. */
const AMB_DOLARS = Object.freeze({
  ...CARPETA,
  '2026_3T/example_cloud.pdf': pdfPla([
    'Example Cloud Inc', 'Invoice number INV-2026-0907', 'Invoice date: 30/08/2026',
    'Subtotal $20.00', 'VAT (21%) $4.20', 'Total $24.20'
  ])
});

/* Una Font en memòria (el contracte de nucli/tractor.js) que apunta cada crida. */
function fontMemoria({ ambEscriu = true, existents = [], fitxers = CARPETA } = {}) {
  const crides = [];
  const presents = new Set(existents);
  const font = {
    nom: 'Facturacio',
    async llista() {
      crides.push('llista');
      return Object.keys(fitxers).map((ruta) => ({ ruta, mida: fitxers[ruta].length, modificat: 0 }));
    },
    async llig(ruta) {
      crides.push(`llig:${ruta}`);
      return fitxers[ruta];
    }
  };
  if (ambEscriu) {
    font.escriu = vi.fn(async (ruta, dades, { sobreescriu = false } = {}) => {
      crides.push(`escriu:${ruta}`);
      if (presents.has(ruta) && sobreescriu !== true) throw new ErrorTractor('FITXER_JA_EXISTEIX', `Ja hi ha un fitxer «${ruta}».`);
      const sobreescrit = presents.has(ruta);
      presents.add(ruta);
      return { ruta, mida: dades.length, sobreescrit };
    });
  }
  return { font, crides };
}

/* Aprovacions de prova (el model de nucli/tractor.test.js). Els dos tractors
   exigixen signatura (dades personals): un autenticador WebAuthn simulat
   signa de veres i la porta ho verifica. */
const ARA = Date.UTC(2026, 9, 2, 10, 0, 0);
const EMPREMTA = `sha256:${'ab'.repeat(32)}`;
const autenticador = await creaAutenticadorSimulat({ subtle });
const SIGNATS = Object.freeze({
  [TRACTOR_FACTURES.id]: await autenticador.signa({ manifest: TRACTOR_FACTURES, empremta: EMPREMTA, ara: ARA - 60000 }),
  [TRACTOR_CORREUS.id]: await autenticador.signa({ manifest: TRACTOR_CORREUS, empremta: EMPREMTA, ara: ARA - 60000 })
});
/* Revocar no exigix cap nivell: useTractors.revoca la fa amb confirmació. */
const revocacioDe = (manifest, ara) => preparaRegistre({
  manifest, empremta: EMPREMTA, decisio: 'revocat', nivell: 'confirmacio', ara, nonce: new Uint8Array(16).fill(1)
});
const aprovacioDe = (manifest, registres = [SIGNATS[manifest.id]]) => ({
  manifest, empremta: EMPREMTA, registres, claus: autenticador.claus, origen: autenticador.origen, rpId: autenticador.rpId, ara: ARA
});
const APROVATS = { 'gestoria.factures': TRACTOR_FACTURES, 'gestoria.correus': TRACTOR_CORREUS };
function porta({ sense = [] } = {}) {
  return vi.fn(async (id) => aprovacioDe(APROVATS[id], sense.includes(id) ? [] : undefined));
}

const AVUI = () => new Date(2026, 9, 2, 12, 0, 0);
const munta = (extra = {}) => renderHook(() => useGestoria({ obteAprovacio: porta(), subtle, inflate: null, avui: AVUI, ...extra }));
const codis = (llista) => llista.map((i) => i.codi);
/* Exemple Llum factura cada mes (historial del 2T); el proveïdor del CSV, també (catàleg). */
const mesosQueFalten = (llista, proveidor = 'exemple-llum') => llista
  .filter((i) => i.codi === 'FALTA_MENSUAL' && i.proveidor === proveidor).map((i) => i.mes);

async function analitzada(extra = {}) {
  const hook = munta(extra);
  const memoria = fontMemoria(extra.font);
  act(() => { hook.result.current.usaFont(memoria.font); });
  let ok;
  await act(async () => { ok = await hook.result.current.analitza({ any: 2026, t: 3 }); });
  expect(ok).toBe(true);
  return { ...hook, ...memoria };
}

const despesaGoogle = (r) => r.current.proposta.despeses.find((f) => f.num === '7777777777');

/* ── Proves ─────────────────────────────────────────────────────────────── */

describe('dates i missatges', () => {
  test('el trimestre per defecte és el natural anterior a avui', () => {
    expect(trimestreAnterior(dataDeAvui(new Date(2026, 9, 2)))).toEqual({ any: 2026, t: 3 });
    expect(trimestreAnterior({ a: 2026, m: 2, d: 10 })).toEqual({ any: 2025, t: 4 });
    expect(trimestreAnterior({ a: 2026, m: 6, d: 30 })).toEqual({ any: 2026, t: 1 });
    expect(dataDeAvui(new Date('no'))).toBeNull();
  });

  test('els errors arriben en valencià i amb el seu codi', () => {
    expect(missatgeError(new ErrorAprovacio('APROVACIO_REVOCADA', 'revocada'))).toMatchObject({
      titol: 'L’aprovació està revocada: cal tornar a aprovar el tractor.', detall: 'revocada', codi: 'APROVACIO_REVOCADA', aprovacio: true
    });
    expect(missatgeError(new ErrorTractor('TRIMESTRE_NO_TROBAT', 'No hi ha cap carpeta del 3T de 2026.'))).toMatchObject({
      titol: 'No s’ha trobat el trimestre a la carpeta.', detall: 'No hi ha cap carpeta del 3T de 2026.', to: 'error'
    });
    expect(missatgeError(new ErrorTractor('SELECCIO_CANCELLADA', "No s'ha triat cap carpeta.")).to).toBe('info');
    expect(missatgeError(new TypeError('x'), 'Ha fallat.')).toMatchObject({ titol: 'Ha fallat.', detall: 'x', codi: 'ERROR_INTERN' });
  });
});

describe('la porta del tractor: abans de tocar la carpeta', () => {
  test.each([
    ['sense cap aprovació', porta({ sense: ['gestoria.factures'] }), 'APROVACIO_REQUERIDA'],
    ['si la porta falla', vi.fn(async () => { throw new Error('IndexedDB tancada'); }), 'APROVACIO_REQUERIDA'],
    ['amb l’aprovació d’un altre tractor', vi.fn(async () => aprovacioDe(TRACTOR_CORREUS)), 'APROVACIO_REQUERIDA'],
    ['sense porta connectada', undefined, 'APROVACIO_REQUERIDA']
  ])('%s: error d’aprovació i la Font intacta', async (_cas, obteAprovacio, codi) => {
    const { result } = renderHook(() => useGestoria({ obteAprovacio, subtle, inflate: null, avui: AVUI }));
    const { font, crides } = fontMemoria();
    act(() => { result.current.usaFont(font); });
    let ok;
    await act(async () => { ok = await result.current.analitza({ any: 2026, t: 3 }); });
    expect(ok).toBe(false);
    expect(result.current.error).toMatchObject({ codi, aprovacio: true, titol: 'Este tractor no té cap aprovació vigent.' });
    expect(crides).toEqual([]);
    expect(result.current.proposta).toBeNull();
  });

  test('l’aprovació es demana just abans de cada anàlisi: revocar-la para la següent', async () => {
    const obteAprovacio = vi.fn(async (id) => aprovacioDe(APROVATS[id]));
    const { result, crides } = await analitzada({ obteAprovacio });
    expect(obteAprovacio).toHaveBeenCalledTimes(1);
    expect(obteAprovacio).toHaveBeenLastCalledWith('gestoria.factures');
    obteAprovacio.mockImplementation(async (id) => aprovacioDe(APROVATS[id], [SIGNATS[id], revocacioDe(APROVATS[id], ARA - 1000)]));
    const abans = crides.length;
    await act(async () => { await result.current.analitza({ any: 2026, t: 3 }); });
    expect(obteAprovacio).toHaveBeenCalledTimes(2);
    expect(result.current.error).toMatchObject({ codi: 'APROVACIO_REVOCADA' });
    expect(crides.length).toBe(abans);
  });

  test('sense carpeta no s’analitza res', async () => {
    const obteAprovacio = porta();
    const { result } = munta({ obteAprovacio });
    await act(async () => { await result.current.analitza({ any: 2026, t: 3 }); });
    expect(result.current.error.titol).toBe('Encara no hi ha cap carpeta triada.');
    expect(obteAprovacio).not.toHaveBeenCalled();
  });

  test('una confirmació escrita ja no basta: les dades personals exigixen signatura', async () => {
    // El registre és d'un tractor de nivell confirmació; el de veres demana signatura.
    const confirmada = preparaRegistre({
      manifest: { ...TRACTOR_FACTURES, nivellMinim: 'confirmacio' }, empremta: EMPREMTA, decisio: 'aprovat',
      nivell: 'confirmacio', ara: ARA - 60000, nonce: new Uint8Array(16).fill(2)
    });
    const obteAprovacio = vi.fn(async (id) => aprovacioDe(APROVATS[id], [confirmada]));
    const { result } = munta({ obteAprovacio });
    const { font, crides } = fontMemoria();
    act(() => { result.current.usaFont(font); });
    let ok;
    await act(async () => { ok = await result.current.analitza({ any: 2026, t: 3 }); });
    expect(ok).toBe(false);
    expect(result.current.error).toMatchObject({ codi: 'NIVELL_INSUFICIENT', aprovacio: true });
    expect(crides).toEqual([]);
    expect(result.current.proposta).toBeNull();
  });
});

describe('l’anàlisi i la revisió', () => {
  test('la proposta, el progrés i les incidències, iguals que les del tractor', async () => {
    const { result, crides } = await analitzada();
    expect(result.current.proposta).toMatchObject({ titular: TITULAR, any: 2026, t: 3, ingressos: [] });
    expect(despesaGoogle(result)).toMatchObject({ total: 1210, estat: 'completa', origen: { metode: 'csv-proveidor' } });
    expect(mesosQueFalten(result.current.incidencies)).toEqual(['2026-07', '2026-08', '2026-09']);
    expect(mesosQueFalten(result.current.incidencies, 'google-cloud')).toEqual(['2026-08', '2026-09']);
    expect(codis(result.current.incidencies)).toContain('CORREU_NO_REVISAT');
    expect(result.current.analisi.cobertura).toMatchObject({ carpeta: 'revisada', correu: 'no-revisat', carpetaTrimestre: '2026_3T', historial: ['2026_2T'] });
    expect(result.current.analisi.documents.map((d) => d.ruta)).toContain('2026_3T/7777777777.csv');
    /* El proveïdor del CSV és d'Irlanda i la factura porta IVA: la gestoria ha de dir si és deduïble. */
    expect(result.current.incidencies).toContainEqual(expect.objectContaining({
      codi: 'IVA_ESTRANGER', severitat: 'mitjana', pais: 'IE', facturaId: despesaGoogle(result).id
    }));
    expect(result.current.avis).toBe('Anàlisi del 3T de 2026 acabada: cap ingrés, una despesa i 7 incidències per revisar.');
    expect(result.current.ocupat).toBeNull();
    expect(crides.some((c) => c.startsWith('escriu:'))).toBe(false);

    // Recalculades amb la proposta d'ara, diuen el mateix que el tractor.
    const directe = await executaTractorFactures({
      font: fontMemoria().font, any: 2026, t: 3, aprovacio: aprovacioDe(TRACTOR_FACTURES), subtle, inflate: null, avui: { a: 2026, m: 10, d: 2 }
    });
    const clau = (i) => `${i.codi}|${i.severitat}|${i.missatge}`;
    expect(result.current.incidencies.map(clau).sort()).toEqual(directe.incidencies.map(clau).sort());
  });

  test('mentre s’analitza, el panell està ocupat i no admet una altra anàlisi', async () => {
    let solta;
    const obteAprovacio = vi.fn(() => new Promise((resol) => { solta = () => resol(aprovacioDe(TRACTOR_FACTURES)); }));
    const { result } = munta({ obteAprovacio });
    act(() => { result.current.usaFont(fontMemoria().font); });
    let promesa;
    act(() => { promesa = result.current.analitza({ any: 2026, t: 3 }); });
    expect(result.current.ocupat).toBe('analisi');
    let segona;
    await act(async () => { segona = await result.current.analitza({ any: 2026, t: 3 }); });
    expect(segona).toBe(false);
    expect(obteAprovacio).toHaveBeenCalledTimes(1);
    await act(async () => { solta(); await promesa; });
    expect(result.current.ocupat).toBeNull();
    expect(result.current.progres).toBeNull();
    expect(result.current.proposta).not.toBeNull();
  });

  test('editar una cel·la recrea la factura, la revalida i hi posa confiança alta', async () => {
    const { result } = await analitzada();
    const id = despesaGoogle(result).id;
    act(() => { result.current.editaFactura(id, 'total', '15,00'); });
    expect(despesaGoogle(result)).toMatchObject({ id, total: 1500, estat: 'pendent', confianca: expect.objectContaining({ total: 'alta' }) });
    expect(result.current.incidencies).toContainEqual(expect.objectContaining({ codi: 'IVA_INCOHERENT', facturaId: id }));
    act(() => { result.current.editaFactura(id, 'total', '12,10 €'); });
    expect(despesaGoogle(result)).toMatchObject({ total: 1210, estat: 'completa' });
    expect(codis(result.current.incidencies)).not.toContain('IVA_INCOHERENT');
    // El mateix valor no és cap canvi; un camp desconegut, tampoc.
    const versio = result.current.versio;
    act(() => { result.current.editaFactura(id, 'total', '12,10'); });
    act(() => { result.current.editaFactura(id, 'origen', 'x'); });
    expect(result.current.versio).toBe(versio);
  });

  test('una factura afegida a mà fa caure l’avís del mes que faltava', async () => {
    const { result } = await analitzada();
    let id;
    act(() => { id = result.current.afegixFactura('despesa'); });
    expect(id).toMatch(/^manual_/);
    const dades = { data: '28/07/2026', num: 'EL-2026-07', contrapart: 'Exemple Llum SL', nif: CIF_LLUM, descripcio: 'Subministrament elèctric', subtotal: '100,00', iva: '21,00', total: '121,00' };
    for (const [camp, valor] of Object.entries(dades)) act(() => { result.current.editaFactura(id, camp, valor); });
    expect(result.current.proposta.despeses.find((f) => f.id === id)).toMatchObject({ estat: 'completa', origen: { metode: 'manual' } });
    expect(mesosQueFalten(result.current.incidencies)).toEqual(['2026-08', '2026-09']);
  });

  test('una factura en dòlars: incidència alta, i no passa a euros fins que se n’escriu el total en euros (format-fiscal-02, G3T-15)', async () => {
    const { result } = await analitzada({ font: { fitxers: AMB_DOLARS } });
    const usd = () => result.current.proposta.despeses.find((f) => f.num === 'INV-2026-0907');
    expect(usd()).toMatchObject({ moneda: 'USD', subtotal: 2000, iva: 420, total: 2420, estat: 'pendent' });
    expect(result.current.incidencies).toContainEqual(expect.objectContaining({ codi: 'MONEDA_ESTRANGERA', severitat: 'alta', facturaId: usd().id }));
    expect(result.current.totalsEditats).toEqual({});
    // 24,20 USD no són 24,20 €: sense el total en euros, marcar-ho no fa res.
    let canviat;
    let versio = result.current.versio;
    act(() => { canviat = result.current.editaFactura(usd().id, 'moneda', 'EUR'); });
    expect(canviat).toBe(false);
    expect(usd()).toMatchObject({ moneda: 'USD', total: 2420 });
    expect(result.current.versio).toBe(versio);
    expect(result.current.avis).toMatch(/escriu-ne el total en euros/);
    // Escrit el total en euros, sí; i, com qualsevol edició, anul·la l'aprovació de la proposta.
    act(() => { result.current.editaFactura(usd().id, 'total', '22,10'); });
    expect(result.current.totalsEditats).toEqual({ [usd().id]: true });
    expect(usd().moneda).toBe('USD');
    await act(async () => { await result.current.aprovaProposta({ acceptaIncidencies: true }); });
    expect(result.current.propostaAprovada).toBe(true);
    act(() => { canviat = result.current.editaFactura(usd().id, 'moneda', 'EUR'); });
    expect(canviat).toBe(true);
    expect(usd()).toMatchObject({ moneda: 'EUR', total: 2210 });
    expect(codis(result.current.incidencies)).not.toContain('MONEDA_ESTRANGERA');
    expect(result.current.propostaAprovada).toBe(false);
    expect(result.current.aprovacioProposta).toBeNull();
    // Només es pot marcar que són euros: cap altra moneda per esta via.
    versio = result.current.versio;
    act(() => { canviat = result.current.editaFactura(usd().id, 'moneda', 'USD'); });
    expect(canviat).toBe(false);
    expect(result.current.versio).toBe(versio);
  });

  test('passaAEuros: amb el total en euros del càrrec, la base i l’IVA en la mateixa proporció (G3T-15)', async () => {
    const { result } = await analitzada({ font: { fitxers: AMB_DOLARS } });
    const usd = () => result.current.proposta.despeses.find((f) => f.num === 'INV-2026-0907');
    const id = usd().id;
    let ok;
    for (const text of ['vint', '', '0,00', '-22,10']) {
      act(() => { ok = result.current.passaAEuros(id, text); });
      expect(ok, text).toBe(false);
    }
    expect(usd()).toMatchObject({ moneda: 'USD', total: 2420 });
    act(() => { ok = result.current.passaAEuros(id, '22,10 €'); });
    expect(ok).toBe(true);
    /* 20,00 × 22,10 / 24,20 = 18,26 de base, i l'IVA és la resta fins al total. */
    expect(usd()).toMatchObject({ moneda: 'EUR', subtotal: 1826, iva: 384, total: 2210, confianca: expect.objectContaining({ total: 'alta' }) });
    expect(codis(result.current.incidencies.filter((i) => i.facturaId === id))).not.toContain('MONEDA_ESTRANGERA');
    expect(codis(result.current.incidencies.filter((i) => i.facturaId === id))).not.toContain('IVA_INCOHERENT');
    expect(result.current.avis).toBe('La factura «INV-2026-0907» ara és en euros: 22,10 € de total, amb la base i l’IVA en la mateixa proporció. Revisa-ho.');
    // Ja és en euros, o no hi és: res a fer.
    act(() => { ok = result.current.passaAEuros(id, '22,10'); });
    expect(ok).toBe(false);
    act(() => { ok = result.current.passaAEuros('no-hi-es', '1,00'); });
    expect(ok).toBe(false);
  });

  test('passaAEuros sense la base llegida: l’IVA també passa a euros, no es queda en dòlars (G3T-15)', async () => {
    const { result } = await analitzada({ font: { fitxers: AMB_DOLARS } });
    const usd = () => result.current.proposta.despeses.find((f) => f.num === 'INV-2026-0907');
    const id = usd().id;
    act(() => { result.current.editaFactura(id, 'subtotal', ''); });
    expect(usd()).toMatchObject({ moneda: 'USD', subtotal: null, iva: 420, total: 2420 });
    let ok;
    act(() => { ok = result.current.passaAEuros(id, '22,10'); });
    expect(ok).toBe(true);
    /* 4,20 × 22,10 / 24,20 = 3,8355: 3,84 €; la base, que no es va llegir, continua buida. */
    expect(usd()).toMatchObject({ moneda: 'EUR', subtotal: null, iva: 384, total: 2210 });
  });

  test('un rebut que cita una factura absent: alta fins que s’afig la factura, i es recalcula (G3T-04)', async () => {
    const rebut = pdfPla(['Receipt number 2000-0001', 'Invoice number EXA-0004', 'Date paid 24/08/2026', 'Amount paid 30,25 EUR']);
    const { result } = await analitzada({ font: { fitxers: { ...CARPETA, '2026_3T/Receipt-2000-0001.pdf': rebut } } });
    const rebuts = () => result.current.incidencies.filter((i) => i.codi === 'REBUT_SENSE_FACTURA');
    expect(rebuts()).toEqual([expect.objectContaining({ severitat: 'alta', numero: 'EXA-0004', fitxer: '2026_3T/Receipt-2000-0001.pdf' })]);
    let id;
    act(() => { id = result.current.afegixFactura('despesa'); });
    act(() => { result.current.editaFactura(id, 'num', 'EXA 0004'); });
    expect(rebuts()).toEqual([]);
  });

  test('incidenciesDe: els forats, l’IVA estranger i els dobles cobraments es recalculen; el rebut sense número es conserva', () => {
    const f = (num, d) => crearFactura({
      tipus: 'despesa', data: { a: 2026, m: 8, d }, num, contrapart: 'Exemple Llum SL', nif: CIF_LLUM, subtotal: 10000, iva: 2100, total: 12100
    });
    const analisi = {
      proveidors: null, nifsPropis: [], avui: { a: 2026, m: 10, d: 2 },
      documents: [
        { ruta: '2026_3T/Receipt-1.pdf', tipus: 'rebut', ambit: 'trimestre', numeroCitat: 'EL-0004', avisos: [] },
        { ruta: '2026_3T/Receipt-2.pdf', tipus: 'rebut', ambit: 'trimestre', numeroCitat: null, avisos: [] }
      ],
      incidencies: [
        { codi: 'FORAT_NUMERACIO', severitat: 'mitjana', missatge: 'de l’anàlisi', numeros: ['EL-0002'] },
        { codi: 'POSSIBLE_DOBLE_COBRAMENT', severitat: 'baixa', missatge: 'de l’anàlisi' },
        { codi: 'REBUT_SENSE_FACTURA', severitat: 'alta', missatge: 'de l’anàlisi', fitxer: '2026_3T/Receipt-1.pdf', numero: 'EL-0004' },
        { codi: 'REBUT_SENSE_FACTURA', severitat: 'mitjana', missatge: 'sense número', fitxer: '2026_3T/Receipt-2.pdf' }
      ]
    };
    const proposta = { any: 2026, t: 3, ingressos: [], despeses: [f('EL-0001', 1), f('EL-0003', 3), f('EL-0004', 4)] };
    const llista = incidenciesDe({ analisi, proposta, correu: null });
    const forats = llista.filter((i) => i.codi === 'FORAT_NUMERACIO');
    expect(forats.map((i) => i.numeros)).toEqual([['EL-0002']]);
    expect(forats[0].missatge).toMatch(/^Indici: /);
    expect(llista.filter((i) => i.missatge === 'de l’anàlisi')).toEqual([]);
    expect(llista.filter((i) => i.codi === 'REBUT_SENSE_FACTURA').map((i) => i.missatge)).toEqual(['sense número']);
  });

  test('incidenciesDe: la còpia d’un rebut que cita un número no es torna a auditar, com fa el tractor (G3T-04)', () => {
    const analisi = {
      proveidors: null, nifsPropis: [], avui: { a: 2026, m: 10, d: 2 }, incidencies: [],
      documents: [
        { ruta: '2026_3T/Receipt-1.pdf', tipus: 'rebut', ambit: 'trimestre', numeroCitat: 'EL-0009', avisos: [] },
        { ruta: '2026_3T/Receipt-1 copia.pdf', tipus: 'rebut', ambit: 'trimestre', numeroCitat: 'EL-0009', copiaDe: '2026_3T/Receipt-1.pdf', avisos: [] },
        { ruta: '2026_2T/Receipt-0.pdf', tipus: 'rebut', ambit: 'historial', numeroCitat: 'EL-0008', avisos: [] }
      ]
    };
    const llista = incidenciesDe({ analisi, proposta: { any: 2026, t: 3, ingressos: [], despeses: [] }, correu: null });
    expect(llista.filter((i) => i.codi === 'REBUT_SENSE_FACTURA').map((i) => [i.fitxer, i.numero])).toEqual([['2026_3T/Receipt-1.pdf', 'EL-0009']]);
  });

  test('incidenciesDe: un rebut sense número però amb import es torna a casar per import amb la proposta d’ara', () => {
    const analisi = {
      proveidors: null, nifsPropis: [], avui: { a: 2026, m: 10, d: 2 },
      documents: [{ ruta: '2026_3T/Justi_0001.pdf', tipus: 'rebut', ambit: 'trimestre', numeroCitat: null, import: 12100, avisos: [] }],
      incidencies: [{ codi: 'REBUT_SENSE_FACTURA', severitat: 'mitjana', missatge: 'de l’anàlisi', fitxer: '2026_3T/Justi_0001.pdf' }]
    };
    const llum = crearFactura({
      tipus: 'despesa', data: { a: 2026, m: 8, d: 28 }, num: 'EL-2026-08', contrapart: 'Exemple Llum SL', nif: CIF_LLUM, subtotal: 10000, iva: 2100, total: 12100
    });
    const rebuts = (despeses) => incidenciesDe({ analisi, proposta: { any: 2026, t: 3, ingressos: [], despeses }, correu: null })
      .filter((i) => i.codi === 'REBUT_SENSE_FACTURA');
    /* Sense la factura, l'avís és el recalculat (no el de l'anàlisi); amb la factura del mateix import, cap. */
    expect(rebuts([])).toEqual([expect.objectContaining({ severitat: 'mitjana', fitxer: '2026_3T/Justi_0001.pdf', missatge: expect.stringMatching(/121,00/) })]);
    expect(rebuts([llum])).toEqual([]);
  });

  test('incidenciesDe: el pagament agrupat es recalcula amb la proposta d’ara i no es duplica (R3T-03)', () => {
    const nuvol = (num, subtotal, iva) => crearFactura({
      tipus: 'despesa', data: { a: 2026, m: 7, d: 3 }, num, contrapart: 'Cloudflare', subtotal, iva, total: subtotal + iva
    });
    const analisi = {
      proveidors: null, nifsPropis: [], avui: { a: 2026, m: 10, d: 2 },
      documents: [{ ruta: '2026_3T/Justi_0001.pdf', tipus: 'rebut', ambit: 'trimestre', numeroCitat: null, import: 71400, proveidor: 'cloudflare', avisos: [] }],
      incidencies: [{ codi: 'PAGAMENT_AGRUPAT', severitat: 'info', missatge: 'de l’anàlisi', fitxer: '2026_3T/Justi_0001.pdf' }]
    };
    const amb = (despeses) => incidenciesDe({ analisi, proposta: { any: 2026, t: 3, ingressos: [], despeses }, correu: null });
    const codiDe = (llista, codi) => llista.filter((i) => i.codi === codi);
    const ara = amb([nuvol('CF-0101', 110000, 23100), nuvol('CF-0102', 230000, 48300)]);
    expect(codiDe(ara, 'PAGAMENT_AGRUPAT')).toEqual([expect.objectContaining({
      severitat: 'info', numeros: ['CF-0101', 'CF-0102'], missatge: expect.stringMatching(/^Rebut «Justi_0001\.pdf» de Cloudflare: /)
    })]);
    expect(codiDe(ara, 'REBUT_SENSE_FACTURA')).toEqual([]);
    /* Sense les factures que paga, ja no és cap pagament agrupat: el rebut no té factura. */
    const sense = amb([]);
    expect(codiDe(sense, 'PAGAMENT_AGRUPAT')).toEqual([]);
    expect(codiDe(sense, 'REBUT_SENSE_FACTURA')).toHaveLength(1);
  });

  test('l’avís d’un document duplicat (de la carpeta, sense factura) es conserva en recalcular les incidències', async () => {
    const linies = (num) => ['Exemple Serveis SL', `CIF: ${CIF_LLUM}`, `Numero de factura: ${num}`, 'Fecha de la factura: 21/07/2026',
      'Base imponible 100,00 EUR', 'IVA 21% 21,00 EUR', 'Total factura 121,00 EUR'];
    const fitxers = { ...CARPETA, '2026_3T/serveis.pdf': pdfPla(linies('ES-2026-0007')), '2026_3T/serveis copia.pdf': pdfPla(linies('ES-2026-0008')) };
    const { result } = await analitzada({ font: { fitxers } });
    const documentals = (llista) => llista.filter((i) => i.codi === 'DUPLICAT' && !i.facturaId);
    expect(documentals(result.current.incidencies)).toEqual([expect.objectContaining({ severitat: 'mitjana', fitxer: '2026_3T/serveis copia.pdf' })]);
    const directe = await executaTractorFactures({
      font: fontMemoria({ fitxers }).font, any: 2026, t: 3, aprovacio: aprovacioDe(TRACTOR_FACTURES), subtle, inflate: null, avui: { a: 2026, m: 10, d: 2 }
    });
    const clau = (i) => `${i.codi}|${i.severitat}|${i.missatge}`;
    expect(result.current.incidencies.map(clau).sort()).toEqual(directe.incidencies.map(clau).sort());
  });

  test('una còpia pel nom fusionada en l’anàlisi ix a les excloses i es pot tornar a la proposta (G3T-02)', async () => {
    const linies = ['Exemple Serveis SL', `CIF: ${CIF_LLUM}`, 'Numero de factura: ES-2026-0007', 'Fecha de la factura: 21/07/2026',
      'Base imponible 100,00 EUR', 'IVA 21% 21,00 EUR', 'Total factura 121,00 EUR'];
    const original = pdfPla(linies);
    const copia = new Uint8Array([...original, 10]);
    const { result } = await analitzada({ font: { fitxers: { ...CARPETA, '2026_3T/serveis.pdf': original, '2026_3T/serveis copia.pdf': copia } } });
    const delFitxer = (llista, ruta) => llista.filter((f) => f.origen?.fitxer === ruta);
    expect(delFitxer(result.current.proposta.despeses, '2026_3T/serveis.pdf')).toHaveLength(1);
    expect(delFitxer(result.current.proposta.despeses, '2026_3T/serveis copia.pdf')).toEqual([]);
    const [exclosa] = result.current.excloses;
    expect(result.current.excloses).toHaveLength(1);
    expect(exclosa).toMatchObject({ num: 'ES-2026-0007', origen: { fitxer: '2026_3T/serveis copia.pdf' } });
    act(() => { result.current.restauraFactura(exclosa.id); });
    expect(delFitxer(result.current.proposta.despeses, '2026_3T/serveis copia.pdf').map((f) => f.id)).toEqual([exclosa.id]);
    expect(result.current.excloses).toEqual([]);
  });

  test('excloure i restaurar; moure una despesa a ingressos', async () => {
    const { result } = await analitzada();
    const id = despesaGoogle(result).id;
    act(() => { result.current.exclouFactura(id); });
    expect(result.current.proposta.despeses).toEqual([]);
    expect(result.current.excloses.map((f) => f.id)).toEqual([id]);
    expect(result.current.avis).toBe('S’ha exclòs la factura «7777777777»: no anirà al full.');
    act(() => { result.current.restauraFactura(id); });
    expect(result.current.excloses).toEqual([]);
    act(() => { result.current.editaFactura(id, 'tipus', 'ingres'); });
    expect(result.current.proposta.ingressos.map((f) => f.id)).toEqual([id]);
    expect(result.current.proposta.despeses).toEqual([]);
  });
});

describe('la segona aprovació i els fitxers', () => {
  test('amb incidències altes cal acceptar-les; l’aprovació porta l’empremta de la proposta', async () => {
    const { result } = await analitzada();
    let aprovacio;
    await act(async () => { aprovacio = await result.current.aprovaProposta(); });
    expect(aprovacio).toBeNull();
    /* format-fiscal-03: abans n'eren 5. Les dues FALTA_MENSUAL del proveïdor del
       CSV (mensual pel catàleg, però sense cap trimestre sencer a l'historial)
       ara són de severitat mitjana; les tres d'Exemple Llum (abril, maig i juny
       al 2T) continuen sent altes. */
    expect(result.current.error.titol).toBe('Hi ha 3 incidències d’alta severitat.');
    await act(async () => { aprovacio = await result.current.aprovaProposta({ acceptaIncidencies: true }); });
    expect(aprovacio.empremta).toBe(await empremtaProposta(result.current.proposta, subtle));
    expect(aprovacio.acceptades).toHaveLength(3);
    expect(aprovacio.acceptades[0]).toMatch(/^Falta la factura/);
    expect(result.current.propostaAprovada).toBe(true);
  });

  test('sense titular no s’aprova', async () => {
    const { result } = await analitzada();
    act(() => { result.current.editaTitular('  '); });
    await act(async () => { await result.current.aprovaProposta({ acceptaIncidencies: true }); });
    expect(result.current.error.titol).toBe('Falta el titular del full.');
    expect(result.current.propostaAprovada).toBe(false);
  });

  test('el flux sencer: aprovar, generar i desar a la carpeta del trimestre', async () => {
    const obteAprovacio = porta();
    const { result, font } = await analitzada({ obteAprovacio });
    await act(async () => { await result.current.aprovaProposta({ acceptaIncidencies: true }); });
    let ok;
    await act(async () => { ok = await result.current.genera(); });
    expect(ok).toBe(true);
    const { entregables } = result.current;
    expect(entregables.xlsx.nom).toBe(NOM_XLSX);
    expect(entregables.full.files.filter((f) => f.rol === 'dada')).toHaveLength(1);
    expect(result.current.avis).toBe(`Full generat: «${NOM_XLSX}» i «${entregables.csv.nom}».`);
    await act(async () => { ok = await result.current.desaAlTrimestre('xlsx'); });
    expect(ok).toBe(true);
    expect(font.escriu).toHaveBeenCalledTimes(1);
    const [ruta, dades, opcions] = font.escriu.mock.calls[0];
    expect(ruta).toBe(`2026_3T/${NOM_XLSX}`);
    expect(dades).toEqual(entregables.xlsx.dades);
    expect(opcions).toEqual({ sobreescriu: false });
    expect(result.current.desats.xlsx).toMatchObject({ ruta: `2026_3T/${NOM_XLSX}`, sobreescrit: false });
    // Analitzar, generar i desar: cada una ha demanat l'aprovació del tractor de factures.
    expect(obteAprovacio.mock.calls.map(([id]) => id)).toEqual(['gestoria.factures', 'gestoria.factures', 'gestoria.factures']);
  });

  test('qualsevol edició després d’aprovar anul·la l’aprovació i els fitxers', async () => {
    const { result } = await analitzada();
    await act(async () => { await result.current.aprovaProposta({ acceptaIncidencies: true }); });
    await act(async () => { await result.current.genera(); });
    expect(result.current.entregables).not.toBeNull();
    act(() => { result.current.editaFactura(despesaGoogle(result).id, 'descripcio', 'Servei al núvol de juliol'); });
    expect(result.current.propostaAprovada).toBe(false);
    expect(result.current.aprovacioProposta).toBeNull();
    expect(result.current.entregables).toBeNull();
    let ok;
    await act(async () => { ok = await result.current.genera(); });
    expect(ok).toBe(false);
    expect(result.current.error.titol).toBe('Encara no has aprovat esta proposta.');
  });

  test('si es revoca el tractor després d’aprovar la proposta, no es genera res', async () => {
    const obteAprovacio = porta();
    const { result } = await analitzada({ obteAprovacio });
    await act(async () => { await result.current.aprovaProposta({ acceptaIncidencies: true }); });
    obteAprovacio.mockImplementation(async (id) => aprovacioDe(APROVATS[id], []));
    await act(async () => { await result.current.genera(); });
    expect(result.current.entregables).toBeNull();
    expect(result.current.error).toMatchObject({ codi: 'APROVACIO_REQUERIDA', aprovacio: true });
  });

  test('desar mai sobreescriu sense confirmació explícita', async () => {
    const { result, font } = await analitzada({ font: { existents: [`2026_3T/${NOM_XLSX}`] } });
    await act(async () => { await result.current.aprovaProposta({ acceptaIncidencies: true }); });
    await act(async () => { await result.current.genera(); });
    await act(async () => { await result.current.desaAlTrimestre('xlsx'); });
    expect(result.current.sobreescriure).toEqual({ format: 'xlsx', ruta: `2026_3T/${NOM_XLSX}`, nom: NOM_XLSX });
    expect(result.current.desats).toEqual({});
    act(() => { result.current.cancellaSobreescriure(); });
    expect(result.current.sobreescriure).toBeNull();
    await act(async () => { await result.current.desaAlTrimestre('xlsx', { sobreescriu: true }); });
    expect(font.escriu.mock.calls.map(([, , o]) => o)).toEqual([{ sobreescriu: false }, { sobreescriu: true }]);
    expect(result.current.desats.xlsx.sobreescrit).toBe(true);
    expect(result.current.avis).toBe(`Substituït: «2026_3T/${NOM_XLSX}».`);
  });

  test('una carpeta que no es pot escriure: cap intent, i el consell de descarregar', async () => {
    const { result } = await analitzada({ font: { ambEscriu: false } });
    expect(result.current.potEscriure).toBe(false);
    await act(async () => { await result.current.aprovaProposta({ acceptaIncidencies: true }); });
    await act(async () => { await result.current.genera(); });
    let ok;
    await act(async () => { ok = await result.current.desaAlTrimestre('csv'); });
    expect(ok).toBe(false);
    expect(result.current.error.titol).toBe('Esta carpeta no es pot escriure des d’este navegador.');
  });
});

describe('el correu', () => {
  const MBOX = [
    'From factures@example.org Mon Aug 31 09:00:00 2026',
    'From: Exemple Llum <factures@example.org>',
    "Subject: La teua factura d'agost",
    'Date: Mon, 31 Aug 2026 09:00:00 +0200',
    'Content-Type: multipart/mixed; boundary="LIMIT"',
    '',
    '--LIMIT',
    'Content-Type: application/pdf; name="factura_agost.pdf"',
    'Content-Disposition: attachment; filename="factura_agost.pdf"',
    '',
    'COS-SECRET',
    '--LIMIT--',
    ''
  ].join('\n');
  const exportacio = () => {
    const fitxer = new File([MBOX], 'correu.mbox', { type: 'application/mbox' });
    vi.spyOn(fitxer, 'text');
    return fitxer;
  };

  test('sense l’aprovació del correu, l’exportació ni es llig', async () => {
    const { result } = await analitzada({ obteAprovacio: porta({ sense: ['gestoria.correus'] }) });
    const fitxer = exportacio();
    await act(async () => { await result.current.creuaCorreus([fitxer]); });
    expect(fitxer.text).not.toHaveBeenCalled();
    expect(result.current.error).toMatchObject({ codi: 'APROVACIO_REQUERIDA', aprovacio: true });
    expect(result.current.correu).toBeNull();
  });

  test('amb l’aprovació: incidències del correu, cobertura i l’aprovació de la proposta anul·lada', async () => {
    const { result } = await analitzada();
    await act(async () => { await result.current.aprovaProposta({ acceptaIncidencies: true }); });
    const fitxer = exportacio();
    await act(async () => { await result.current.creuaCorreus([fitxer]); });
    expect(fitxer.text).toHaveBeenCalledTimes(1);
    expect(result.current.propostaAprovada).toBe(false);
    expect(result.current.analisi.cobertura).toMatchObject({ carpeta: 'revisada', correu: 'revisat', correusRevisats: 1 });
    expect(codis(result.current.incidencies)).not.toContain('CORREU_NO_REVISAT');
    expect(result.current.incidencies).toContainEqual(expect.objectContaining({ codi: 'CORREU_SENSE_DOCUMENT', mes: '2026-08' }));
    expect(JSON.stringify(result.current.correu)).not.toContain('COS-SECRET');
    expect(result.current.correu.fitxers).toEqual(['correu.mbox']);
  });
});

describe('desenxufa', () => {
  const fitxers = () => Object.entries(CARPETA).map(([ruta, dades]) => ({
    name: ruta.split('/').pop(), webkitRelativePath: `Facturacio/${ruta}`, size: dades.length, lastModified: 0,
    arrayBuffer: async () => dades.slice().buffer
  }));

  test('oblida la carpeta i torna a l’estat inicial: no queda res en memòria', async () => {
    const { result } = munta();
    act(() => { result.current.usaFitxers(fitxers()); });
    expect(result.current).toMatchObject({ teCarpeta: true, nomCarpeta: 'Facturacio', potEscriure: false });
    await act(async () => { await result.current.analitza({ any: 2026, t: 3 }); });
    await act(async () => { await result.current.aprovaProposta({ acceptaIncidencies: true }); });
    await act(async () => { await result.current.genera(); });
    expect(result.current.entregables).not.toBeNull();
    act(() => { result.current.desenxufa(); });
    expect(result.current).toMatchObject({
      teCarpeta: false, nomCarpeta: '', analisi: null, proposta: null, correu: null, entregables: null,
      aprovacioProposta: null, incidencies: [], excloses: [], error: null
    });
    expect(result.current.avis).toMatch(/^Desenxufat/);
  });

  test('la Font queda oblidada: ja no es pot llegir', async () => {
    const font = fontDesDeFitxers(fitxers());
    const { result } = munta();
    act(() => { result.current.usaFont(font); });
    act(() => { result.current.desenxufa(); });
    await expect(font.llista()).rejects.toMatchObject({ codi: 'FONT_OBLIDADA' });
  });

  test('desenxufar mentre s’analitza descarta el resultat', async () => {
    const { result } = munta();
    act(() => { result.current.usaFont(fontMemoria().font); });
    let promesa;
    act(() => { promesa = result.current.analitza({ any: 2026, t: 3 }); });
    act(() => { result.current.desenxufa(); });
    let ok;
    await act(async () => { ok = await promesa; });
    expect(ok).toBe(false);
    expect(result.current.proposta).toBeNull();
    expect(result.current.ocupat).toBeNull();
  });

  test('desmuntar el panell també oblida la carpeta', () => {
    const font = fontDesDeFitxers(fitxers());
    const { result, unmount } = munta();
    act(() => { result.current.usaFont(font); });
    unmount();
    return expect(font.llista()).rejects.toMatchObject({ codi: 'FONT_OBLIDADA' });
  });

  test('cap dada al navegador: ni Storage ni IndexedDB', async () => {
    const desa = vi.spyOn(Storage.prototype, 'setItem');
    const obri = globalThis.indexedDB ? vi.spyOn(globalThis.indexedDB, 'open') : null;
    const { result } = await analitzada();
    await act(async () => { await result.current.aprovaProposta({ acceptaIncidencies: true }); });
    await act(async () => { await result.current.genera(); });
    expect(desa).not.toHaveBeenCalled();
    if (obri) expect(obri).not.toHaveBeenCalled();
  });
});

describe('el selector de carpetes', () => {
  const handle = { kind: 'directory', name: 'Facturacio', async *entries() {} };

  test('triaCarpeta obri el selector del sistema i en fa la Font', async () => {
    const showDirectoryPicker = vi.fn(async () => handle);
    const { result } = munta({ entorn: { showDirectoryPicker } });
    expect(result.current.potTriarCarpeta).toBe(true);
    await act(async () => { await result.current.triaCarpeta(); });
    expect(showDirectoryPicker).toHaveBeenCalledWith({ mode: 'read' });
    expect(result.current).toMatchObject({ teCarpeta: true, nomCarpeta: 'Facturacio', error: null });
  });

  test('cancel·lar el selector és informació, no un error', async () => {
    const showDirectoryPicker = vi.fn(async () => { throw new DOMException('cancel·lat', 'AbortError'); });
    const { result } = munta({ entorn: { showDirectoryPicker } });
    await act(async () => { await result.current.triaCarpeta(); });
    expect(result.current.error).toMatchObject({ codi: 'SELECCIO_CANCELLADA', to: 'info' });
    expect(result.current.teCarpeta).toBe(false);
  });

  test('sense selector, potTriarCarpeta és fals', () => {
    const { result } = munta({ entorn: {} });
    expect(result.current.potTriarCarpeta).toBe(false);
  });
});

describe('incidenciesDe', () => {
  test('sense anàlisi, cap', () => {
    expect(incidenciesDe({})).toEqual([]);
  });
});
