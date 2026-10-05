/* A2: cancel·lació cooperativa entre etapes i guarda de publicació.
   La porta de la UI es controla; el tractor i la verificació criptogràfica
   són reals, amb un autenticador simulat i només dades sintètiques. */
import { webcrypto } from 'node:crypto';
import { StrictMode, useEffect } from 'react';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { creaAutenticadorSimulat } from '../../../../tests/helpers/autenticadorSimulat.js';
import { TRACTOR_TAULER } from '../tractors.js';
import { PortaTauler } from './Tauler.jsx';
import { useTauler } from './useTauler.js';
import { ErrorTauler, executaTractorTauler } from './nucli/tractorTauler.js';

const contextMock = vi.hoisted(() => vi.fn());
vi.mock('../../tractors/useTractors.js', () => ({
  contextAprovacio: contextMock,
  useTractors: () => ({ carregant: false, error: null, tractors: [{ id: 'gestoria.tauler', estat: 'aprovat' }] })
}));

const ARA = Date.UTC(2026, 9, 4, 8);
const EMPREMTA = `sha256:${'ab'.repeat(32)}`;
const subtle = webcrypto.subtle;
const autenticador = await creaAutenticadorSimulat({ subtle });
const registre = await autenticador.signa({
  manifest: TRACTOR_TAULER, empremta: EMPREMTA, ara: ARA - 60000, nonce: new Uint8Array(16).fill(42)
});
const aprovacio = {
  manifest: TRACTOR_TAULER, empremta: EMPREMTA, registres: [registre], claus: autenticador.claus,
  origen: autenticador.origen, rpId: autenticador.rpId, ara: ARA
};
const bytes = new TextEncoder().encode('Fecha,Importe,Saldo\n2026-06-10,25.00,100.00\n').buffer;

function pendent() {
  let resol, rebutja;
  const promesa = new Promise((si, no) => { resol = si; rebutja = no; });
  return { promesa, resol, rebutja };
}
function diferit(name) {
  const espera = pendent();
  return { ...espera, fitxer: { name, size: bytes.byteLength, arrayBuffer: vi.fn(() => espera.promesa) } };
}
const llest = (name) => ({ name, size: bytes.byteLength, arrayBuffer: vi.fn(async () => bytes.slice(0)) });
const modelUi = (canvis = {}) => ({
  porta: { carregant: false, error: null }, fila: { estat: 'aprovat' }, aprovat: true,
  llegint: false, error: null, lectura: null, generacio: 0, llig: vi.fn(), oblida: vi.fn(), ...canvis
});

beforeEach(() => contextMock.mockReset().mockResolvedValue(aprovacio));
afterEach(cleanup);

describe('Oblida en la UI del Tauler', () => {
  test('el primer lot pendent oferix Oblida les dades', () => {
    render(<PortaTauler tauler={modelUi({ llegint: true })} onObreTractors={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Oblida les dades' })).toBeTruthy();
  });

  test('Oblida retira el nom seleccionat del DOM mentre el primer lot espera', () => {
    const model = modelUi();
    let vista;
    model.llig = () => vista.rerender(<PortaTauler tauler={{ ...model, llegint: true }} onObreTractors={vi.fn()} />);
    model.oblida = () => vista.rerender(<PortaTauler tauler={modelUi({ generacio: 2 })} onObreTractors={vi.fn()} />);
    vista = render(<PortaTauler tauler={model} onObreTractors={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Tria els extractes del banc'), {
      target: { files: [new File(['a'], 'extracte_persona_sintetica.csv')] }
    });
    expect(screen.getByText(/extracte_persona_sintetica/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Oblida les dades' }));
    expect(screen.queryByText(/extracte_persona_sintetica/)).toBeNull();
    expect(screen.getByText('Cap fitxer triat')).toBeTruthy();
  });
});

describe('finestres await: tractor i hook reals', () => {
  test('Oblida mentre espera l’aprovació no inicia bytes després', async () => {
    const espera = pendent(), fitxer = llest('context.csv');
    contextMock.mockImplementationOnce(() => espera.promesa);
    const { result } = renderHook(() => useTauler({ subtle }));
    let lectura;
    act(() => { lectura = result.current.llig([fitxer]); });
    act(() => result.current.oblida());
    await act(async () => { espera.resol(aprovacio); await lectura; });
    expect(fitxer.arrayBuffer).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({ lectura: null, llegit: null, error: null, llegint: false });
  });

  test('una lectura antiga acabada no retira el controlador de la següent', async () => {
    const primera = diferit('a.csv'), segona = diferit('b.csv'), futur = llest('despres_b.csv');
    const { result } = renderHook(() => useTauler({ subtle }));
    let lecturaA, lecturaB;
    act(() => { lecturaA = result.current.llig([primera.fitxer]); });
    await waitFor(() => expect(primera.fitxer.arrayBuffer).toHaveBeenCalled());
    act(() => { lecturaB = result.current.llig([segona.fitxer, futur]); });
    await waitFor(() => expect(segona.fitxer.arrayBuffer).toHaveBeenCalled());
    await act(async () => { primera.resol(bytes); await lecturaA; });
    act(() => result.current.oblida());
    await act(async () => { segona.resol(bytes); await lecturaB; });
    expect(futur.arrayBuffer).not.toHaveBeenCalled();
    expect(result.current.lectura).toBeNull();
    expect(result.current.error).toBeNull();
  });

  test('una lectura antiga tardana no sobreescriu la nova', async () => {
    const antiga = diferit('a.csv'), nova = llest('b.csv');
    const { result } = renderHook(() => useTauler({ subtle }));
    let lecturaA, lecturaB;
    act(() => { lecturaA = result.current.llig([antiga.fitxer]); });
    await waitFor(() => expect(antiga.fitxer.arrayBuffer).toHaveBeenCalled());
    act(() => { lecturaB = result.current.llig([nova]); });
    await act(async () => await lecturaB);
    const publicada = result.current.lectura;
    expect(publicada.csv).toHaveLength(1);
    await act(async () => { antiga.resol(bytes); await lecturaA; });
    expect(result.current.lectura).toBe(publicada);
  });

  test('desmuntar amb fitxer pendent no inicia el fitxer següent', async () => {
    const primer = diferit('desmuntar.csv'), futur = llest('futur.csv');
    const { result, unmount } = renderHook(() => useTauler({ subtle }));
    let lectura;
    act(() => { lectura = result.current.llig([primer.fitxer, futur]); });
    await waitFor(() => expect(primer.fitxer.arrayBuffer).toHaveBeenCalled());
    unmount();
    await act(async () => { primer.resol(bytes); await lectura; });
    expect(futur.arrayBuffer).not.toHaveBeenCalled();
  });

  test.each(['resolt', 'rebutjat'])('cancel·lar l’últim fitxer %s rebutja el lot sense resultat parcial', async (final) => {
    const bo = llest('bo.csv'), ultim = diferit('ultim.csv'), controlador = new AbortController();
    const lectura = executaTractorTauler({
      fitxers: [bo, ultim.fitxer], aprovacio, subtle, signal: controlador.signal
    });
    const resultat = lectura.then(valor => ({ valor }), error => ({ error }));
    await waitFor(() => expect(ultim.fitxer.arrayBuffer).toHaveBeenCalled());
    controlador.abort();
    if (final === 'resolt') ultim.resol(bytes);
    else ultim.rebutja(new Error('Error de lectura sintètic'));
    const r = await resultat;
    expect(r.error).toBeInstanceOf(ErrorTauler);
    expect(r.error.codi).toBe('LECTURA_CANCELLADA');
    expect(r.valor).toBeUndefined();
  });
});


describe('StrictMode: remuntatge d’efectes i lectures reals', () => {
  test('la neteja inicial no bloqueja una lectura nova legítima', async () => {
    const triat = llest('strict.csv');
    const { result } = renderHook(() => useTauler({ subtle }), { wrapper: StrictMode });
    await act(async () => await result.current.llig([triat]));
    expect(triat.arrayBuffer).toHaveBeenCalledTimes(1);
    expect(result.current.lectura.csv).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });
  test('Oblida després del remuntatge descarta bytes tardans i no llig el fitxer futur', async () => {
    const primer = diferit('strict-oblit.csv'), futur = llest('strict-futur.csv');
    const { result } = renderHook(() => useTauler({ subtle }), { wrapper: StrictMode });
    let feina;
    act(() => { feina = result.current.llig([primer.fitxer, futur]); });
    await waitFor(() => expect(primer.fitxer.arrayBuffer).toHaveBeenCalled());
    act(() => result.current.oblida());
    await act(async () => { primer.resol(bytes); await feina; });
    expect(futur.arrayBuffer).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({ lectura: null, llegit: null, error: null, llegint: false });
  });
  test('el primer efecte desmuntat no retira el controlador del segon efecte viu', async () => {
    const gateA = pendent(), gateB = pendent(), primer = llest('strict-primer.csv');
    const segon = diferit('strict-segon.csv'), futur = llest('strict-despres.csv');
    contextMock.mockImplementationOnce(() => gateA.promesa).mockImplementationOnce(() => gateB.promesa);
    let intents = 0; const feines = [];
    const { result } = renderHook(() => {
      const tauler = useTauler({ subtle });
      const { llig } = tauler;
      useEffect(() => { feines.push(llig(++intents === 1 ? [primer] : [segon.fitxer, futur])); }, [llig]);
      return tauler;
    }, { wrapper: StrictMode });
    expect(intents).toBe(2);
    await act(async () => { gateB.resol(aprovacio); });
    await waitFor(() => expect(segon.fitxer.arrayBuffer).toHaveBeenCalled());
    await act(async () => { gateA.resol(aprovacio); await feines[0]; });
    expect(primer.arrayBuffer).not.toHaveBeenCalled();
    act(() => result.current.oblida());
    await act(async () => { segon.resol(bytes); await feines[1]; });
    expect(futur.arrayBuffer).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({ lectura: null, llegit: null, error: null, llegint: false });
  });
});
