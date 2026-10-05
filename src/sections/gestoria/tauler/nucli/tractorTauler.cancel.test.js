// @vitest-environment node
/* P1–P5: comprovacions diferenciades amb el parser Norma 43 real.
   L'autenticador és simulat i les dades són sintètiques; no és aprovació humana. */
import { webcrypto } from 'node:crypto';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { creaAutenticadorSimulat } from '../../../../../tests/helpers/autenticadorSimulat.js';
import { TRACTOR_TAULER } from '../../tractors.js';
import { llegeixC43 } from '../../nucli/c43.js';
import { llegeixMovimentsCsv } from '../../nucli/movimentsBanc.js';
import { ErrorTauler, executaTractorTauler } from './tractorTauler.js';

const control = vi.hoisted(() => ({ despresParsejar: null }));
vi.mock('../../nucli/c43.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, llegeixC43: vi.fn((...args) => {
    const resultat = actual.llegeixC43(...args);
    control.despresParsejar?.();
    return resultat;
  }) };
});

vi.mock('../../nucli/movimentsBanc.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, llegeixMovimentsCsv: vi.fn(actual.llegeixMovimentsCsv) };
});

const subtle = webcrypto.subtle;
const autenticador = await creaAutenticadorSimulat({ subtle });
const ara = Date.UTC(2026, 9, 4, 8);
const empremta = `sha256:${'ab'.repeat(32)}`;
const registre = await autenticador.signa({ manifest: TRACTOR_TAULER, empremta, ara: ara - 60000, nonce: new Uint8Array(16).fill(52) });
const aprovacio = { manifest: TRACTOR_TAULER, empremta, registres: [registre], claus: autenticador.claus,
  origen: autenticador.origen, rpId: autenticador.rpId, ara };
const xifres = (n, llargaria) => String(n).padStart(llargaria, '0');
const text = (v, llargaria) => String(v).padEnd(llargaria, ' ').slice(0, llargaria);
const bytes = new TextEncoder().encode([
  `119999000100000043212606012606302${xifres(100000, 14)}9783${text('TITULAR SINTETIC', 26)}${text('', 3)}`,
  `22${text('', 4)}0001260610260610990001${xifres(2500, 14)}${xifres(0, 10)}${text('', 12)}${text('', 16)}`,
  `3399990001000000432100001${xifres(2500, 14)}00000${xifres(0, 14)}2${xifres(97500, 14)}978${text('', 4)}`,
  `88${'9'.repeat(18)}${xifres(3, 6)}${text('', 54)}`
].join('\r\n')).buffer;
const fitxer = (name) => ({ name, size: bytes.byteLength, arrayBuffer: vi.fn(async () => bytes.slice(0)) });
const resultatDe = (p) => p.then(valor => ({ valor }), error => ({ error }));
function verificaAmb(despres) {
  const verify = vi.fn(async (...args) => {
    const valid = await subtle.verify(...args);
    despres?.();
    return valid;
  });
  return { verify, port: new Proxy(subtle, { get(target, key) {
    if (key === 'verify') return verify;
    const v = Reflect.get(target, key, target);
    return typeof v === 'function' ? v.bind(target) : v;
  } }) };
}
function esCancelLat(r) {
  expect(r.error).toBeInstanceOf(ErrorTauler);
  expect(r.error.codi).toBe('LECTURA_CANCELLADA');
  expect(r.valor).toBeUndefined();
}
afterEach(() => { vi.clearAllMocks(); control.despresParsejar = null; });

describe('cinc punts de cancel·lació amb verificació i parser reals', () => {
  test('P1 · preavortat no arriba ni a verify ni als bytes ni al parser', async () => {
    const c = new AbortController(), triat = fitxer('p1.n43'), verificacio = verificaAmb();
    c.abort();
    esCancelLat(await resultatDe(executaTractorTauler({ fitxers: [triat], aprovacio, subtle: verificacio.port, signal: c.signal })));
    expect(verificacio.verify).not.toHaveBeenCalled();
    expect(triat.arrayBuffer).not.toHaveBeenCalled();
    expect(llegeixC43).not.toHaveBeenCalled();
  });
  test('P1 · un senyal preavortat preval també davant d’una aprovació absent', async () => {
    const c = new AbortController(), triat = fitxer('p1-sense-aprovacio.n43'), verificacio = verificaAmb();
    c.abort();
    esCancelLat(await resultatDe(executaTractorTauler({ fitxers: [triat], aprovacio: { ...aprovacio, registres: [] }, subtle: verificacio.port, signal: c.signal })));
    expect(verificacio.verify).not.toHaveBeenCalled();
    expect(triat.arrayBuffer).not.toHaveBeenCalled();
    expect(llegeixC43).not.toHaveBeenCalled();
  });
  test('P2 · avortat en tornar verify es cancel·la abans de validar un lot buit', async () => {
    const c = new AbortController(), verificacio = verificaAmb(() => c.abort());
    esCancelLat(await resultatDe(executaTractorTauler({ fitxers: [], aprovacio, subtle: verificacio.port, signal: c.signal })));
    expect(verificacio.verify).toHaveBeenCalledTimes(1);
    expect(llegeixC43).not.toHaveBeenCalled();
  });
  test('P2 · amb Norma 43 triada l’avortament després de verify tampoc toca bytes ni parser', async () => {
    const c = new AbortController(), triat = fitxer('p2.n43'), verificacio = verificaAmb(() => c.abort());
    esCancelLat(await resultatDe(executaTractorTauler({ fitxers: [triat], aprovacio, subtle: verificacio.port, signal: c.signal })));
    expect(verificacio.verify).toHaveBeenCalledTimes(1);
    expect(triat.arrayBuffer).not.toHaveBeenCalled();
    expect(llegeixC43).not.toHaveBeenCalled();
  });
  test('P3 · avortat després del primer parser no inicia el fitxer següent', async () => {
    const c = new AbortController(), primer = fitxer('p3a.n43'), segon = fitxer('p3b.n43');
    control.despresParsejar = () => c.abort();
    esCancelLat(await resultatDe(executaTractorTauler({ fitxers: [primer, segon], aprovacio, subtle, signal: c.signal })));
    expect(llegeixC43).toHaveBeenCalledTimes(1);
    expect(primer.arrayBuffer).toHaveBeenCalledTimes(1);
    expect(segon.arrayBuffer).not.toHaveBeenCalled();
  });
  test.each(['n43', 'csv'])('P4 · avortat en tornar els bytes %s vàlids no arriba a cap parser', async (ext) => {
    const c = new AbortController(), triat = fitxer(`p4.${ext}`);
    const contingut = ext === 'csv' ? new TextEncoder().encode('Fecha,Importe,Saldo\n2026-06-10,25.00,100.00\n').buffer : bytes;
    triat.arrayBuffer.mockImplementation(async () => { c.abort(); return contingut.slice(0); });
    esCancelLat(await resultatDe(executaTractorTauler({ fitxers: [triat], aprovacio, subtle, signal: c.signal })));
    expect(triat.arrayBuffer).toHaveBeenCalledTimes(1);
    expect(llegeixC43).not.toHaveBeenCalled();
    expect(llegeixMovimentsCsv).not.toHaveBeenCalled();
  });
  test('P5 · avortat després de l’últim parser no publica el resultat parcial', async () => {
    const c = new AbortController(), triat = fitxer('p5.n43');
    control.despresParsejar = () => c.abort();
    esCancelLat(await resultatDe(executaTractorTauler({ fitxers: [triat], aprovacio, subtle, signal: c.signal })));
    expect(triat.arrayBuffer).toHaveBeenCalledTimes(1);
    expect(llegeixC43).toHaveBeenCalledTimes(1);
  });
});
