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

  test('als 5 minuts (MAX_VEU_MS) si recorder.stop() llança InvalidStateError amb àudio ja gravat, conserva la nota i tanca el micròfon sense excepció', async () => {
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

    await vi.advanceTimersByTimeAsync(MAX_VEU_MS);
    const nota = await gravacio.resultat;
    expect(nota).toMatchObject({ tipus: 'veu', aturada: 'temps' });
    expect(nota.fitxer.size).toBe(8);
    expect(track.stop).toHaveBeenCalledOnce();
  });

  test('atura() manual amb InvalidStateError i cap byte gravat rebutja amb codi gravacio i tanca el micròfon', async () => {
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

    expect(() => gravacio.atura()).not.toThrow();
    await expect(gravacio.resultat).rejects.toMatchObject({ code: 'gravacio' });
    expect(track.stop).toHaveBeenCalledOnce();
  });
});
