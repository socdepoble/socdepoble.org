/* Gestoria · Escàner Local · el hook (ordre del Mestre, 13-10-2026, pla
   261013_1405, front D; mapa D, §3): el selector s'obri dins del gest, abans
   de cap espera; l'alternativa webkitdirectory; una carpeta nova cancel·la
   l'anàlisi anterior; oblidar desenxufa la Font; i els fitxers per al Tauler
   lligen els bytes per la Font només quan el Tauler els demana. La porta de
   la UI es controla (contextAprovacio); el tractor, la Font i la verificació
   criptogràfica són reals, amb un autenticador simulat i només dades
   sintètiques (entitat 9999 de prova, noms inventats). */
import { webcrypto } from 'node:crypto';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { creaAutenticadorSimulat } from '../../../../tests/helpers/autenticadorSimulat.js';
import { demanaCarpeta, oblidaFont } from '../font/fontNavegador.js';
import { TRACTOR_ESCANER, TRACTOR_TAULER } from '../tractors.js';
import { executaTractorTauler } from '../tauler/nucli/tractorTauler.js';
import { useEscaner } from './useEscaner.js';

const contextMock = vi.hoisted(() => vi.fn());
vi.mock('../../tractors/useTractors.js', () => ({ contextAprovacio: contextMock }));
/* La Font és la de veres; les espies només apunten quan s'obri el selector i quan s'oblida una Font. */
vi.mock('../font/fontNavegador.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, demanaCarpeta: vi.fn(real.demanaCarpeta), oblidaFont: vi.fn(real.oblidaFont) };
});

const ARA = Date.UTC(2026, 9, 13, 8);
const AVUI = { a: 2026, m: 10, d: 13 };
const EMPREMTA = `sha256:${'ab'.repeat(32)}`;
const MODIFICAT = 1760000000000;
const subtle = webcrypto.subtle;
const autenticador = await creaAutenticadorSimulat({ subtle });
const aprovacioDe = async (manifest, n) => ({
  manifest, empremta: EMPREMTA, claus: autenticador.claus, origen: autenticador.origen, rpId: autenticador.rpId, ara: ARA,
  registres: [await autenticador.signa({ manifest, empremta: EMPREMTA, ara: ARA - 60000, nonce: new Uint8Array(16).fill(n) })]
});
const APROVACIO = await aprovacioDe(TRACTOR_ESCANER, 61);
const APROVACIO_TAULER = await aprovacioDe(TRACTOR_TAULER, 62);
const PORTA = Object.freeze({ carregant: false, error: null, tractors: [{ id: 'gestoria.escaner', estat: 'aprovat' }] });

/* ── Extractes sintètics (les posicions de nucli/c43.js) ─────────────────── */
const xifres = (n, llargaria) => String(n).padStart(llargaria, '0');
const text = (valor, llargaria) => String(valor).padEnd(llargaria, ' ').slice(0, llargaria);
const N43 = [
  `119999000100000043212606012606302${xifres(100000, 14)}9783${text('TITULAR SINTETIC', 26)}${text('', 3)}`,
  `22${text('', 4)}000126061026061099000${'1'}${xifres(2500, 14)}${xifres(0, 10)}${text('', 12)}${text('', 16)}`,
  `3399990001000000432100001${xifres(2500, 14)}00000${xifres(0, 14)}2${xifres(97500, 14)}978${text('', 4)}`,
  `88${'9'.repeat(18)}${xifres(3, 6)}${text('', 54)}`
].join('\r\n');
const CSV_TAULER = 'Fecha,F. valor,Concepto,Importe,Saldo\n2026-06-10,2026-06-10,COMPRA PROVA,-25.00,975.00\n';

const B = '02_Facturacio/2026_Bancs';
const N43_RUTA = `${B}/moviments_compte.n43`;
const CSV_RUTA = `${B}/bancpoble.csv`;
const XLS_RUTA = `${B}/moviments_export.xls`;
const ARBRE = Object.freeze({
  [N43_RUTA]: N43,
  [CSV_RUTA]: CSV_TAULER,
  [XLS_RUTA]: 'FULL-DE-CALCUL-PROVA',
  '02_Facturacio/2026_3T/proveidor_alfa.pdf': 'PDF-UNIC',
  '01_Identitat_Legal/Persona/document_escanejat.pdf': 'PDF-PROVA-B'
});

const bytesDe = (contingut) => new TextEncoder().encode(contingut);

/* Un fitxer de l'<input webkitdirectory>: la carpeta triada és el primer segment de webkitRelativePath. */
function fitxerDe(ruta, contingut, { arrayBuffer } = {}) {
  const bytes = bytesDe(contingut);
  return {
    name: ruta.split('/').pop(), size: bytes.length, lastModified: MODIFICAT, webkitRelativePath: `Gestoria_Prova/${ruta}`,
    arrayBuffer: vi.fn(arrayBuffer ?? (async () => bytes.slice().buffer))
  };
}
const fitxersDe = (arbre) => Object.entries(arbre).map(([ruta, contingut]) => fitxerDe(ruta, contingut));

/* Un handle de carpeta (File System Access) en memòria, amb el que fa servir fontDesDeHandle. */
function handleDe(nom, arbre) {
  const arrel = { kind: 'directory', name: nom, fills: new Map() };
  for (const [ruta, contingut] of Object.entries(arbre)) {
    const segs = ruta.split('/');
    let dir = arrel;
    for (const s of segs.slice(0, -1)) {
      if (!dir.fills.has(s)) dir.fills.set(s, { kind: 'directory', name: s, fills: new Map() });
      dir = dir.fills.get(s);
    }
    const fitxer = segs[segs.length - 1];
    dir.fills.set(fitxer, { kind: 'file', name: fitxer, bytes: bytesDe(contingut) });
  }
  const noTrobat = () => Object.assign(new Error('No trobat'), { name: 'NotFoundError' });
  const aHandle = (node) => {
    if (node.kind === 'file') {
      return {
        kind: 'file', name: node.name,
        getFile: async () => ({ size: node.bytes.length, lastModified: MODIFICAT, arrayBuffer: async () => node.bytes.slice().buffer })
      };
    }
    return {
      kind: 'directory', name: node.name,
      async* entries() {
        for (const [n, f] of node.fills) yield [n, aHandle(f)];
      },
      getDirectoryHandle: async (n) => {
        const f = node.fills.get(n);
        if (f?.kind !== 'directory') throw noTrobat();
        return aHandle(f);
      },
      getFileHandle: async (n) => {
        const f = node.fills.get(n);
        if (f?.kind !== 'file') throw noTrobat();
        return aHandle(f);
      }
    };
  };
  return aHandle(arrel);
}

function pendent() {
  let resol, rebutja;
  const promesa = new Promise((si, no) => { resol = si; rebutja = no; });
  return { promesa, resol, rebutja };
}

const munta = (opcions = {}) => renderHook(() => useEscaner({ porta: PORTA, subtle, avui: AVUI, entorn: {}, ...opcions }));

beforeEach(() => {
  contextMock.mockReset().mockResolvedValue(APROVACIO);
  vi.mocked(oblidaFont).mockClear();
  vi.mocked(demanaCarpeta).mockClear();
});
afterEach(cleanup);

describe('la porta i el selector', () => {
  test('l’aprovació ix de la porta del Tauler (cap segona passada); sense selector de carpetes, potTriarCarpeta és fals', () => {
    expect(munta().result.current).toMatchObject({ aprovat: true, potTriarCarpeta: false, ocupat: null, resultat: null, seleccio: [] });
    const pendentDeSignar = { ...PORTA, tractors: [{ id: 'gestoria.escaner', estat: 'pendent' }] };
    expect(munta({ porta: pendentDeSignar }).result.current.aprovat).toBe(false);
    expect(munta({ porta: null }).result.current).toMatchObject({ aprovat: false, fila: null });
    expect(munta({ entorn: { showDirectoryPicker: () => null } }).result.current.potTriarCarpeta).toBe(true);
  });

  test('triaCarpeta obri el selector dins del gest, abans de cap espera, i després analitza la carpeta', async () => {
    const espera = pendent();
    const entorn = { showDirectoryPicker: vi.fn(() => espera.promesa) };
    const { result } = munta({ entorn });
    let feina;
    act(() => {
      feina = result.current.triaCarpeta();
      // Encara dins del clic: el selector ja s'ha obert, i ni l'aprovació ni cap Font s'han demanat.
      expect(demanaCarpeta).toHaveBeenCalledTimes(1);
      expect(entorn.showDirectoryPicker).toHaveBeenCalledTimes(1);
      expect(entorn.showDirectoryPicker).toHaveBeenCalledWith({ mode: 'read' });
      expect(contextMock).not.toHaveBeenCalled();
    });
    expect(result.current.ocupat).toBe('carpeta');
    await act(async () => {
      espera.resol(handleDe('Gestoria_Prova', ARBRE));
      expect(await feina).toBe(true);
    });
    expect(contextMock).toHaveBeenCalledWith('gestoria.escaner', expect.objectContaining({ subtle }));
    expect(result.current).toMatchObject({ ocupat: null, error: null, nomCarpeta: 'Gestoria_Prova', teCarpeta: true });
    expect(result.current.resultat.radiografia).toMatchObject({ carpeta: 'Gestoria_Prova', fitxers: 5 });
    expect(result.current.seleccio).toEqual([CSV_RUTA, N43_RUTA]);
  });

  test('cancel·lar el selector no és cap error; un selector fora del gest, sí', async () => {
    const cancel = Object.assign(new Error('cancel·lat'), { name: 'AbortError' });
    const { result } = munta({ entorn: { showDirectoryPicker: vi.fn(async () => { throw cancel; }) } });
    await act(async () => { expect(await result.current.triaCarpeta()).toBe(false); });
    expect(result.current).toMatchObject({ ocupat: null, error: null, resultat: null });
    const fora = Object.assign(new Error('sense gest'), { name: 'NotAllowedError' });
    const altre = munta({ entorn: { showDirectoryPicker: vi.fn(async () => { throw fora; }) } });
    await act(async () => { await altre.result.current.triaCarpeta(); });
    expect(altre.result.current.error).toMatch(/clic/);
    expect(contextMock).not.toHaveBeenCalled();
  });

  test('sense selector de carpetes: els fitxers de l’<input webkitdirectory> fan la Font i s’analitzen', async () => {
    const { result } = munta();
    act(() => { expect(result.current.usaFitxers(fitxersDe(ARBRE))).toBe(true); });
    expect(result.current.ocupat).toBe('escaneig');
    await waitFor(() => expect(result.current.resultat).not.toBeNull());
    expect(result.current).toMatchObject({ ocupat: null, nomCarpeta: 'Gestoria_Prova', error: null });
    expect(result.current.resultat.extractes.find((f) => f.ruta === N43_RUTA)).toMatchObject({ format: 'n43', preseleccionat: true });
    expect(result.current.resultat.radiografia.identitat).toEqual({ carpetes: 1, fitxers: 1 });
    // Una llista buida no fa cap Font.
    act(() => { expect(result.current.usaFitxers([])).toBe(false); });
  });
});

describe('els torns: una carpeta nova cancel·la l’anterior, i oblidar desenxufa la Font', () => {
  test('una carpeta nova cancel·la l’anàlisi anterior: n’oblida la Font, no en llig cap altre fitxer i el seu resultat no arriba', async () => {
    const espera = pendent();
    const lent = fitxerDe(N43_RUTA, N43, { arrayBuffer: () => espera.promesa });
    const despres = fitxerDe(`${B}/zz_moviments.csv`, CSV_TAULER);
    const { result } = munta();
    act(() => { result.current.usaFitxers([lent, despres]); });
    await waitFor(() => expect(lent.arrayBuffer).toHaveBeenCalled());
    act(() => { result.current.usaFitxers([fitxerDe(CSV_RUTA, CSV_TAULER)]); });
    expect(oblidaFont).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.resultat?.extractes.map((f) => f.ruta)).toEqual([CSV_RUTA]));
    await act(async () => { espera.resol(bytesDe(N43).buffer); });
    expect(despres.arrayBuffer).not.toHaveBeenCalled();
    expect(result.current.resultat.extractes.map((f) => f.ruta)).toEqual([CSV_RUTA]);
    expect(result.current.error).toBeNull();
  });

  test('oblida desenxufa la Font i ho buida tot; els fitxers donats abans al Tauler ja no lligen res', async () => {
    const { result } = munta();
    act(() => { result.current.usaFitxers(fitxersDe(ARBRE)); });
    await waitFor(() => expect(result.current.resultat).not.toBeNull());
    const donats = result.current.fitxersPerAlTauler();
    expect(donats).toHaveLength(2);
    act(() => result.current.oblida());
    expect(oblidaFont).toHaveBeenCalledTimes(1);
    expect(result.current).toMatchObject({ resultat: null, seleccio: [], nomCarpeta: '', ocupat: null, error: null, teCarpeta: false });
    expect(result.current.fitxersPerAlTauler()).toEqual([]);
    await expect(donats[0].arrayBuffer()).rejects.toMatchObject({ codi: 'FONT_OBLIDADA' });
  });

  test('oblidar mentre el selector és obert: la carpeta que arriba després no s’analitza i s’oblida', async () => {
    const espera = pendent();
    const { result } = munta({ entorn: { showDirectoryPicker: vi.fn(() => espera.promesa) } });
    let feina;
    act(() => { feina = result.current.triaCarpeta(); });
    act(() => result.current.oblida());
    await act(async () => {
      espera.resol(handleDe('Gestoria_Prova', ARBRE));
      expect(await feina).toBe(false);
    });
    expect(contextMock).not.toHaveBeenCalled();
    expect(oblidaFont).toHaveBeenCalledTimes(1);
    expect(result.current).toMatchObject({ resultat: null, ocupat: null });
  });

  test('desmuntar desenxufa la Font', async () => {
    const { result, unmount } = munta();
    act(() => { result.current.usaFitxers(fitxersDe(ARBRE)); });
    await waitFor(() => expect(result.current.resultat).not.toBeNull());
    unmount();
    expect(oblidaFont).toHaveBeenCalledTimes(1);
  });

  test('sense l’aprovació, l’error es diu, no hi ha resultat i la Font s’oblida', async () => {
    contextMock.mockRejectedValueOnce(Object.assign(new Error('No hi ha cap tractor «gestoria.escaner» al catàleg.'), { codi: 'APROVACIO_REQUERIDA' }));
    const triats = fitxersDe(ARBRE);
    const { result } = munta();
    act(() => { result.current.usaFitxers(triats); });
    await waitFor(() => expect(result.current.error).toMatch(/gestoria\.escaner/));
    // La carpeta ja no és enxufada: tampoc no es diu com a «triada».
    expect(result.current).toMatchObject({ resultat: null, ocupat: null, teCarpeta: false, nomCarpeta: '' });
    expect(oblidaFont).toHaveBeenCalledTimes(1);
    expect(triats.every((f) => f.arrayBuffer.mock.calls.length === 0)).toBe(true);
  });
});

describe('la selecció i els fitxers per al Tauler', () => {
  test('commutaExtracte marca i desmarca els seleccionables; un full del banc no es pot triar', async () => {
    const { result } = munta();
    act(() => { result.current.usaFitxers(fitxersDe(ARBRE)); });
    await waitFor(() => expect(result.current.resultat).not.toBeNull());
    act(() => result.current.commutaExtracte(CSV_RUTA));
    expect(result.current.seleccio).toEqual([N43_RUTA]);
    act(() => result.current.commutaExtracte(XLS_RUTA));
    expect(result.current.seleccio).toEqual([N43_RUTA]);
    act(() => result.current.commutaExtracte(CSV_RUTA));
    expect(result.current.seleccio).toEqual([CSV_RUTA, N43_RUTA]);
  });

  test('fitxersPerAlTauler llig els bytes per la Font només quan el Tauler els demana, i el Tauler de veres els llig', async () => {
    const triats = fitxersDe(ARBRE);
    const n43 = triats.find((f) => f.webkitRelativePath.endsWith('.n43'));
    const { result } = munta();
    act(() => { result.current.usaFitxers(triats); });
    await waitFor(() => expect(result.current.resultat).not.toBeNull());
    const llegitsAbans = n43.arrayBuffer.mock.calls.length;
    const perAlTauler = result.current.fitxersPerAlTauler();
    expect(perAlTauler.map((f) => [f.name, f.size])).toEqual([[CSV_RUTA, bytesDe(CSV_TAULER).length], [N43_RUTA, bytesDe(N43).length]]);
    expect(n43.arrayBuffer).toHaveBeenCalledTimes(llegitsAbans);
    const lectura = await executaTractorTauler({ fitxers: perAlTauler, aprovacio: APROVACIO_TAULER, subtle });
    expect(n43.arrayBuffer).toHaveBeenCalledTimes(llegitsAbans + 1);
    expect(lectura.avisos).toEqual([]);
    expect(lectura.extractes).toHaveLength(1);
    expect(lectura.extractes[0].lectura.comptes[0].capcalera).toMatchObject({ entitat: '9999', compte4: '4321' });
    expect(lectura.csv).toHaveLength(1);
  });
});
