import { afterEach, describe, expect, test, vi } from 'vitest';
import { MAX_VEU_MS, gravaVeu } from './adjuntLocal.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('Onada R32.40 · gravaVeu · Alliberament garantit de tracks davant InvalidStateError del WebView', () => {
  test('cancella() tanca tots els MediaStreamTracks encara que recorder.stop() i el primer track llancen InvalidStateError', async () => {
    const track1 = {
      stop: vi.fn(() => {
        throw new DOMException('Track ja tancat pel SO', 'InvalidStateError');
      })
    };
    const track2 = { stop: vi.fn() };

    class RecorderHostil {
      static isTypeSupported = (mime) => mime === 'audio/mp4';
      constructor() {
        this.state = 'inactive';
      }
      start() {
        this.state = 'recording';
      }
      stop() {
        throw new DOMException('El sistema operatiu ha interromput el còdec abans d’actualitzar state', 'InvalidStateError');
      }
    }

    const gravacio = await gravaVeu({
      Recorder: RecorderHostil,
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [track1, track2] })
      }
    });

    expect(() => gravacio.cancella()).not.toThrow();
    await expect(gravacio.resultat).rejects.toMatchObject({ name: 'AbortError' });
    expect(track1.stop).toHaveBeenCalledOnce();
    expect(track2.stop).toHaveBeenCalledOnce();
  });

  test('als 5 minuts, stop que llança tanca el micròfon immediatament i conserva bytes en error recuperable després del deadline', async () => {
    vi.useFakeTimers();
    const track = { stop: vi.fn() };

    class RecorderInterromputAmbDades {
      static isTypeSupported = (mime) => mime === 'audio/mp4';
      constructor() {
        this.state = 'inactive';
        RecorderInterromputAmbDades.ultim = this;
      }
      start() {
        this.state = 'recording';
      }
      stop() {
        throw new DOMException('Còdec tancat pel WebView', 'InvalidStateError');
      }
    }

    const gravacio = await gravaVeu({
      Recorder: RecorderInterromputAmbDades,
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [track] })
      }
    });

    RecorderInterromputAmbDades.ultim.onstart?.();
    RecorderInterromputAmbDades.ultim.ondataavailable?.({ data: new Blob(['veu-iaia']) });

    const resultat = vi.fn();
    gravacio.resultat.then(nota => resultat({ nota }), error => resultat({ error }));
    await vi.advanceTimersByTimeAsync(MAX_VEU_MS);
    expect(track.stop).toHaveBeenCalledOnce();
    expect(resultat).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1_499);
    expect(resultat).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(resultat).toHaveBeenCalledOnce();
    const { error } = resultat.mock.calls[0][0];
    expect(error).toMatchObject({ code: 'gravacio', motiu: 'stop', recuperable: true,
      recuperacio: { tipus: 'veu', aturada: 'temps', duradaMs: null } });
    expect(error.recuperacio.fitxer.size).toBe(8);
    expect(track.stop).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  test('atura() manual amb InvalidStateError i cap byte tanca el micròfon i rebutja al deadline sense recuperació fictícia', async () => {
    vi.useFakeTimers();
    const track = { stop: vi.fn() };

    class RecorderBuitTrencat {
      static isTypeSupported = (mime) => mime === 'audio/mp4';
      constructor() {
        this.state = 'inactive';
      }
      start() {
        this.state = 'recording';
      }
      stop() {
        throw new DOMException('InvalidStateError', 'InvalidStateError');
      }
    }

    const gravacio = await gravaVeu({
      Recorder: RecorderBuitTrencat,
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [track] })
      }
    });

    const resultat = vi.fn();
    gravacio.resultat.then(nota => resultat({ nota }), error => resultat({ error }));
    expect(() => gravacio.atura()).not.toThrow();
    expect(track.stop).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1_499);
    expect(resultat).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(resultat).toHaveBeenCalledOnce();
    expect(resultat.mock.calls[0][0]).toMatchObject({ error: { code: 'gravacio', motiu: 'stop', recuperable: false } });
    expect(resultat.mock.calls[0][0].error).not.toHaveProperty('recuperacio');
    expect(track.stop).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
});
