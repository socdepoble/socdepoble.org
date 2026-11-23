import { afterEach, describe, expect, test, vi } from 'vitest';
import { MAX_VEU_MS, gravaVeu } from './adjuntLocal.js';

const ESPERA_STOP_MS = 1_500;
const lligBlob = blob => {
  // El cleanup ja s'ha comprovat amb el rellotge fals; FileReader usa cues reals.
  vi.useRealTimers();
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = () => reject(lector.error);
    lector.readAsText(blob);
  });
};

function entorn({ stopLlança = false, primerTrackLlança = false } = {}) {
  const tracks = [
    { stop: vi.fn(() => { if (primerTrackLlança) throw new DOMException('Ja tancat', 'InvalidStateError'); }) },
    { stop: vi.fn() }
  ];
  class Recorder {
    static isTypeSupported = mime => mime === 'audio/mp4';
    constructor() { this.state = 'inactive'; Recorder.ultim = this; }
    start() { this.state = 'recording'; this.onstart?.(); }
    stop = vi.fn(() => {
      if (stopLlança) throw new DOMException('Còdec interromput', 'InvalidStateError');
      this.state = 'inactive';
    });
  }
  return { Recorder, tracks, mediaDevices: { getUserMedia: async () => ({ getTracks: () => tracks }) } };
}

function observa(gravacio) {
  const resultat = vi.fn();
  gravacio.resultat.then(nota => resultat({ nota }), error => resultat({ error }));
  return resultat;
}

function neta(e) {
  for (const track of e.tracks) expect(track.stop).toHaveBeenCalledOnce();
  for (const clau of ['onstart', 'ondataavailable', 'onstop', 'onerror']) expect(e.Recorder.ultim[clau]).toBeNull();
  expect(vi.getTimerCount()).toBe(0);
}

afterEach(() => { vi.useRealTimers(); });

describe('R32.44 · la gravadora conserva dades i limita l’espera del còdec', () => {
  test('onerror conserva els chunks anteriors i el dataavailable final abans d’onstop', async () => {
    vi.useFakeTimers();
    const e = entorn();
    const gravacio = await gravaVeu(e);
    const resultat = observa(gravacio);
    const recorder = e.Recorder.ultim;
    recorder.ondataavailable({ data: new Blob(['principi-']) });
    recorder.state = 'inactive';
    recorder.onerror({ error: new DOMException('El còdec ha fallat', 'UnknownError') });
    await Promise.resolve();
    expect(resultat).not.toHaveBeenCalled();
    recorder.ondataavailable?.({ data: new Blob(['final']) });
    recorder.onstop?.();
    await Promise.resolve();
    expect(resultat).toHaveBeenCalledOnce();
    const { error } = resultat.mock.calls[0][0];
    expect(error).toMatchObject({ code: 'gravacio', motiu: 'onerror', recuperable: true,
      recuperacio: { tipus: 'veu', fitxer: expect.any(Blob), duradaMs: null, incompleta: true } });
    neta(e);
    expect(await lligBlob(error.recuperacio.fitxer)).toBe('principi-final');
  });

  test.each([false, true])('onerror sense onstop conserva els bytes i tanca tots els tracks al deadline (inactive=%s)', async inactive => {
    vi.useFakeTimers();
    const e = entorn({ primerTrackLlança: true });
    const gravacio = await gravaVeu(e);
    const resultat = observa(gravacio);
    const recorder = e.Recorder.ultim;
    recorder.ondataavailable({ data: new Blob(['veu recuperada']) });
    if (inactive) recorder.state = 'inactive';
    recorder.onerror({ error: new Error('Còdec interromput') });
    await vi.advanceTimersByTimeAsync(ESPERA_STOP_MS - 1);
    expect(resultat).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(resultat).toHaveBeenCalledOnce();
    const { error } = resultat.mock.calls[0][0];
    expect(error).toMatchObject({ code: 'gravacio', motiu: 'onerror', recuperable: true });
    neta(e);
    expect(await lligBlob(error.recuperacio.fitxer)).toBe('veu recuperada');
  });

  test('atura repetida no ajorna els 1.500 ms, no suma l’espera a la durada i ignora events tardans', async () => {
    vi.useFakeTimers();
    const e = entorn();
    const gravacio = await gravaVeu(e);
    const resultat = observa(gravacio);
    const recorder = e.Recorder.ultim;
    recorder.ondataavailable({ data: new Blob(['nota']) });
    const dadaTardana = recorder.ondataavailable;
    const stopTarda = recorder.onstop;
    await vi.advanceTimersByTimeAsync(4_200);
    gravacio.atura();
    await vi.advanceTimersByTimeAsync(1_000);
    gravacio.atura();
    await vi.advanceTimersByTimeAsync(499);
    expect(resultat).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(resultat).toHaveBeenCalledOnce();
    expect(recorder.stop).toHaveBeenCalledOnce();
    const { error } = resultat.mock.calls[0][0];
    expect(error).toMatchObject({ code: 'gravacio', motiu: 'onstop-absent', recuperable: true,
      recuperacio: { duradaMs: null, duradaCapturaMs: 4_200, incompleta: true } });
    dadaTardana({ data: new Blob(['tardana']) });
    stopTarda();
    gravacio.cancella();
    await vi.advanceTimersByTimeAsync(MAX_VEU_MS);
    expect(resultat).toHaveBeenCalledOnce();
    expect(error.recuperacio.fitxer.size).toBe(4);
    neta(e);
    expect(await lligBlob(error.recuperacio.fitxer)).toBe('nota');
  });

  test.each(['manual', 'error'])('sense bytes ni onstop rebutja netament al deadline (%s)', async origen => {
    vi.useFakeTimers();
    const e = entorn();
    const gravacio = await gravaVeu(e);
    const resultat = observa(gravacio);
    if (origen === 'error') e.Recorder.ultim.onerror({ error: new Error('Sense dades') });
    else gravacio.atura();
    await vi.advanceTimersByTimeAsync(ESPERA_STOP_MS - 1);
    expect(resultat).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(resultat).toHaveBeenCalledOnce();
    expect(resultat.mock.calls[0][0]).toMatchObject({ error: { code: 'gravacio' } });
    neta(e);
  });

  test('el límit de cinc minuts també té deadline si el navegador no emet onstop', async () => {
    vi.useFakeTimers();
    const e = entorn();
    const gravacio = await gravaVeu(e);
    const resultat = observa(gravacio);
    e.Recorder.ultim.ondataavailable({ data: new Blob(['veu']) });
    await vi.advanceTimersByTimeAsync(MAX_VEU_MS + ESPERA_STOP_MS);
    expect(resultat).toHaveBeenCalledOnce();
    expect(resultat.mock.calls[0][0]).toMatchObject({ error: { motiu: 'onstop-absent', recuperable: true,
      recuperacio: { aturada: 'temps', duradaMs: null, duradaCapturaMs: MAX_VEU_MS } } });
    neta(e);
  });

  test('F01 · stop que llança després d’onerror tanca pistes però encara rep les dades finals', async () => {
    vi.useFakeTimers();
    const e = entorn({ stopLlança: true, primerTrackLlança: true });
    const gravacio = await gravaVeu(e);
    const resultat = observa(gravacio);
    const recorder = e.Recorder.ultim;
    const dadesFinals = recorder.ondataavailable;
    const stopFinal = recorder.onstop;
    recorder.ondataavailable({ data: new Blob(['principi-']) });
    recorder.onerror({ error: new Error('Còdec interromput') });
    await Promise.resolve();
    expect(resultat).not.toHaveBeenCalled();
    for (const track of e.tracks) expect(track.stop).toHaveBeenCalledOnce();
    expect(recorder.ondataavailable).toBe(dadesFinals);
    await vi.advanceTimersByTimeAsync(1_499);
    expect(resultat).not.toHaveBeenCalled();
    dadesFinals({ data: new Blob(['final']) });
    stopFinal();
    await Promise.resolve();
    expect(resultat).toHaveBeenCalledOnce();
    const { error } = resultat.mock.calls[0][0];
    expect(error).toMatchObject({ code: 'gravacio', motiu: 'onerror', recuperable: true });
    neta(e);
    expect(await lligBlob(error.recuperacio.fitxer)).toBe('principi-final');
  });

  test('F02 · un prefix salvat al deadline és un error recuperable amb durada desconeguda, mai una nota normal', async () => {
    vi.useFakeTimers();
    const e = entorn();
    const gravacio = await gravaVeu(e);
    const resultat = observa(gravacio);
    e.Recorder.ultim.ondataavailable({ data: new Blob(['prefix']) });
    await vi.advanceTimersByTimeAsync(10_000);
    gravacio.atura();
    await vi.advanceTimersByTimeAsync(1_500);
    expect(resultat).toHaveBeenCalledOnce();
    const final = resultat.mock.calls[0][0];
    expect(final).not.toHaveProperty('nota');
    expect(final.error).toMatchObject({ code: 'gravacio', motiu: 'onstop-absent', recuperable: true,
      recuperacio: { duradaMs: null, duradaCapturaMs: 10_000, incompleta: true } });
    neta(e);
    expect(await lligBlob(final.error.recuperacio.fitxer)).toBe('prefix');
  });

  test('cancel·lar durant l’espera rebutja immediatament i lleva també el deadline', async () => {
    vi.useFakeTimers();
    const e = entorn();
    const control = new AbortController();
    const gravacio = await gravaVeu({ ...e, signal: control.signal });
    const resultat = observa(gravacio);
    e.Recorder.ultim.ondataavailable({ data: new Blob(['descart explícit']) });
    gravacio.atura();
    control.abort();
    await Promise.resolve();
    expect(resultat).toHaveBeenCalledOnce();
    expect(resultat.mock.calls[0][0]).toMatchObject({ error: { name: 'AbortError' } });
    neta(e);
  });
});
