/* QA-R2-03 (Codex, Ronda 2; P1) · L'eixida de veres incrementa l'època de la
   biblioteca (epocaBib), però les continuacions de tria, reconnecta i vincula
   no la miraven: un permís, un selector o un desat que acabaven DESPRÉS de
   l'oblit tornaven a obrir (obriVolum capturava una generació nova) o a
   desar (bib.desa) la carpeta de qui ja havia eixit. En un ordinador
   compartit, la persona següent la trobava oberta o a la Barra. Ara cada
   continuació captura l'època abans del primer await i la comprova després
   de cada espera, abans de publicar estat, desar o obrir; un desat que aterra
   després de l'oblit es desfà. Els casos: permís en vol (tria i reconnecta),
   selector en vol, desat en vol (en esta pestanya i amb l'oblit d'una
   pestanya germana pel BroadcastChannel). */
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { arbreMultimedia, creaBibliotecaFalsa } from '../../../tests/helpers/carpetaLocalFalsa.js';
import { oblidaTotesLesCarpetesLocals } from './bibliotecaCarpetesLocals.js';

const mocks = vi.hoisted(() => ({ sessio: null }));
vi.mock('../../app/contexts/SessionContext', () => ({ useSessioOpcional: () => mocks.sessio }));
import { useGestorArxiusLocals } from './useGestorArxiusLocals.js';

afterEach(() => {
  cleanup();
  mocks.sessio = null;
});

const diferit = () => {
  let resol;
  const promesa = new Promise((r) => { resol = r; });
  return { promesa, resol };
};
const espera = (ms = 30) => act(async () => { await new Promise((resol) => { setTimeout(resol, ms); }); });
const lectures = (dir) => dir.registre.filter(([op]) => op === 'entries' || op === 'values').length;

function munta({ bib, entorn = {}, seleccio = null }) {
  mocks.sessio = { currentUser: { id: 'u-1' } };
  const onSeleccio = vi.fn();
  const seleccioRef = { current: seleccio };
  const vista = renderHook(() => useGestorArxiusLocals({ magatzemCarpetes: bib, entorn, seleccioRef, onSeleccio }));
  return { ...vista, onSeleccio };
}

/* DESPRES_DE_TANCAR en esta pestanya: la biblioteca buidada i l'avís de l'oblit. */
async function eixida(bib) {
  await act(async () => {
    await bib.oblidaTotes();
    await oblidaTotesLesCarpetesLocals({ idb: null });
  });
}

/* Una carpeta recordada amb el permís en 'prompt' (no s'obri sola) i una petició de permís que espera. */
function carpetaAmbPermisEnVol() {
  const dir = arbreMultimedia({ permisos: { read: 'prompt', readwrite: 'prompt' } });
  const permis = diferit();
  dir.requestPermission = async ({ mode = 'read' } = {}) => {
    const valor = await permis.promesa;
    if (valor === 'granted') dir.permisos[mode] = 'granted';
    return valor;
  };
  return { dir, permis };
}

async function expectRes(vista, dir, lecturesAbans) {
  expect(vista.result.current.font).toBeNull();
  expect(vista.result.current.volumObert).toBe(false);
  expect(vista.result.current.estatVolum).toBe('cap');
  expect(vista.result.current.volums).toEqual([]);
  expect(lectures(dir)).toBe(lecturesAbans);
}

describe('QA-R2-03 · cap continuació d’abans de l’eixida obri ni desa res', () => {
  test('tria: el permís concedit després de l’eixida no obri la carpeta de qui ha eixit', async () => {
    const { dir, permis } = carpetaAmbPermisEnVol();
    const bib = creaBibliotecaFalsa([{ id: 'v1', handle: dir }]);
    const vista = munta({ bib });
    await waitFor(() => expect(vista.result.current.estatVolum).toBe('cal-permis'));
    const volum = vista.result.current.volums[0];
    act(() => { vista.result.current.propsBarra.onTria(volum); });
    await espera();
    await eixida(bib);
    const abans = lectures(dir);
    await act(async () => { permis.resol('granted'); });
    await espera();
    await expectRes(vista, dir, abans);
  });

  test('reconnecta: igual, el permís tardà no obri res', async () => {
    const { dir, permis } = carpetaAmbPermisEnVol();
    const bib = creaBibliotecaFalsa([{ id: 'v1', handle: dir }]);
    const vista = munta({ bib });
    await waitFor(() => expect(vista.result.current.estatVolum).toBe('cal-permis'));
    const volum = vista.result.current.volums[0];
    act(() => { vista.result.current.propsBarra.onReconnecta(volum); });
    await espera();
    await eixida(bib);
    const abans = lectures(dir);
    await act(async () => { permis.resol('granted'); });
    await espera();
    await expectRes(vista, dir, abans);
  });

  test('vincula: el selector que torna després de l’eixida no desa ni obri la carpeta', async () => {
    const selector = diferit();
    const entorn = { showDirectoryPicker: vi.fn(() => selector.promesa) };
    const bib = creaBibliotecaFalsa([]);
    const vista = munta({ bib, entorn });
    await waitFor(() => expect(vista.result.current.arrencadaLlesta).toBe(true));
    act(() => { vista.result.current.propsBarra.onVincula(); });
    await espera();
    await eixida(bib);
    const dir = arbreMultimedia();
    await act(async () => { selector.resol(dir); });
    await espera();
    expect(bib.crides.filter(([metode]) => metode === 'desa')).toEqual([]);
    expect(await bib.llista()).toEqual([]);
    await expectRes(vista, dir, 0);
  });

  test('vincula: un desat que aterra després de l’oblit no obri la carpeta', async () => {
    const real = creaBibliotecaFalsa([]);
    const porta = diferit();
    /* El desat escriu i, abans de tornar, arriba l'eixida (que buida la biblioteca). */
    const bib = { ...real, desa: async (handle) => { const desat = await real.desa(handle); await porta.promesa; return desat; } };
    const dir = arbreMultimedia();
    const entorn = { showDirectoryPicker: vi.fn(async () => dir) };
    const vista = munta({ bib, entorn });
    await waitFor(() => expect(vista.result.current.arrencadaLlesta).toBe(true));
    act(() => { vista.result.current.propsBarra.onVincula(); });
    await espera();
    expect(real.crides.filter(([metode]) => metode === 'desa')).toHaveLength(1);
    await eixida(real);
    await act(async () => { porta.resol(); });
    await espera();
    expect(await real.llista()).toEqual([]);
    await expectRes(vista, dir, 0);
  });

  test('vincula: l’oblit d’una pestanya germana arriba abans que el desat escriga → el handle no queda a la biblioteca', async () => {
    const real = creaBibliotecaFalsa([]);
    const porta = diferit();
    /* El desat espera i escriu DESPRÉS de l'oblit de l'altra pestanya. */
    const bib = { ...real, desa: async (handle) => { await porta.promesa; return real.desa(handle); } };
    const dir = arbreMultimedia();
    const entorn = { showDirectoryPicker: vi.fn(async () => dir) };
    const vista = munta({ bib, entorn, seleccio: { carpeta: '', ruta: null } });
    await waitFor(() => expect(vista.result.current.arrencadaLlesta).toBe(true));
    act(() => { vista.result.current.propsBarra.onVincula(); });
    await espera();
    /* L'altra pestanya: buida la base compartida i avisa pel BroadcastChannel. */
    await real.oblidaTotes();
    const canal = new BroadcastChannel('sdp-arxius-locals-oblit');
    canal.postMessage({ origen: 'una-pestanya-germana' });
    canal.close();
    await waitFor(() => expect(vista.onSeleccio).toHaveBeenCalledWith({ portada: true }));
    await act(async () => { porta.resol(); });
    await espera();
    expect(await real.llista()).toEqual([]);
    await expectRes(vista, dir, 0);
  });
});
